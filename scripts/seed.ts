import { config } from 'dotenv';
import { db, getPool } from '../src/db';
import {
  workspaces,
  workspaceMembers,
  user,
  leads,
  leadScoreFactors,
  leadEvents,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { parseArgs } from 'node:util';
import { scoreLead, SCORING_METHOD } from '../src/features/scoring/engine';
config({ path: '.env.local' });
if (process.env.NODE_ENV === 'production') throw new Error('Seed bloqueado em produção.');
const { values } = parseArgs({ options: { workspace: { type: 'string' } } });
const [workspace] = values.workspace
  ? await db().select().from(workspaces).where(eq(workspaces.id, values.workspace)).limit(1)
  : await db()
      .select({ id: workspaces.id })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(user, eq(user.id, workspaceMembers.userId))
      .where(eq(user.email, process.env.BOOTSTRAP_EMAIL || ''))
      .limit(1);
if (!workspace) throw new Error('Execute bootstrap primeiro.');
const names = [
  'Ana Oliveira',
  'Lucas Martins',
  'Mariana Costa',
  'Pedro Almeida',
  'Beatriz Santos',
  'Rafael Lima',
  'Camila Rocha',
  'Gabriel Souza',
  'Juliana Ferreira',
  'Thiago Pereira',
];
const services = [
  'Website institucional',
  'Automação comercial',
  'Gestão de tráfego',
  'Consultoria de vendas',
  'Loja virtual',
];
const stageList = ['new', 'qualified', 'negotiation', 'won', 'lost'];
for (let i = 0; i < 30; i++) {
  const input = {
    name: names[i % 10],
    email: `demo.${i + 1}@example.com`,
    phone: '',
    company: [
      'Estúdio Aurora',
      'Nexo Consultoria',
      'Casa Verde',
      'Ateliê Forma',
      'Horizonte Digital',
    ][i % 5],
    segment: ['Serviços', 'Consultoria', 'Varejo'][i % 3],
    interest: services[i % 5],
    urgency: ['low', 'medium', 'high'][i % 3],
    budgetRange: ['unknown', 'under_2k', 'from_2k_5k', 'over_10k'][i % 4],
    notes:
      i % 5 === 0
        ? 'teste'
        : 'Precisa organizar os pedidos recebidos pelo site da empresa. Registro de demonstração.',
  };
  if (i % 7 === 0) {
    input.email = '';
    input.company = '';
    input.segment = '';
    input.urgency = 'low';
    input.budgetRange = 'unknown';
  }
  const scoring = scoreLead(input);
  await db().transaction(async (tx) => {
    const scoredAt = new Date();
    const [lead] = await tx
      .insert(leads)
      .values({
        ...input,
        workspaceId: workspace.id,
        source: ['Site', 'Instagram', 'Indicação', 'LinkedIn', 'Evento'][i % 5],
        stage: stageList[i % 5],
        score: scoring.score,
        temperature: scoring.temperature,
        scoreReason: scoring.reason,
        scoringMethod: SCORING_METHOD,
        scoredAt,
        isDemo: true,
        campaign: `seed-v1-${i}`,
        createdAt: new Date(Date.now() - ((i * 7) % 29) * 86400000),
      })
      .onConflictDoNothing()
      .returning();
    if (!lead) return;
    await tx
      .insert(leadScoreFactors)
      .values(scoring.factors.map((f) => ({ ...f, leadId: lead.id, createdAt: scoredAt })));
    await tx.insert(leadEvents).values({
      leadId: lead.id,
      eventType: 'created',
      description: 'Dado fictício criado por seed opcional.',
    });
  });
}
console.log('30 leads fictícios processados de forma idempotente.');
await getPool().end();
