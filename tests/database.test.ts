import { config } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db, getPool } from '../src/db';
import { workspaces, leads, leadEvents, leadScoreFactors } from '../src/db/schema';
import {
  saveLead,
  listLeads,
  moveLead,
  findLead,
  deleteLead,
  recalculateLead,
  analytics,
} from '../src/features/leads/service';
import {
  createDemoSession,
  submitPublicLead,
  endDemoSession,
  eraseDemoSession,
  liveSnapshot,
} from '../src/features/live/service';
import { rateLimit } from '../src/lib/rate-limit';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
config({ path: '.env.local', quiet: true });
describe.runIf(Boolean(process.env.DATABASE_URL))('integração PostgreSQL dedicada', () => {
  let a: string;
  let b: string;
  let id: string;
  const input = {
    name: 'Teste de integração',
    email: 'integration@example.com',
    phone: '',
    company: 'Empresa teste',
    segment: 'Serviços',
    interest: 'Website',
    urgency: 'high' as const,
    budgetRange: 'under_2k' as const,
    source: 'Manual' as const,
    notes: 'Precisa organizar os contatos recebidos pelo site da empresa.',
  };
  beforeAll(async () => {
    const rows = await db()
      .insert(workspaces)
      .values([
        { name: 'Teste A', slug: `test-a-${crypto.randomUUID()}` },
        { name: 'Teste B', slug: `test-b-${crypto.randomUUID()}` },
      ])
      .returning();
    a = rows[0].id;
    b = rows[1].id;
  });
  afterAll(async () => {
    if (a) await db().delete(workspaces).where(eq(workspaces.id, a));
    if (b) await db().delete(workspaces).where(eq(workspaces.id, b));
    await getPool().end();
  });
  it('cria, busca, filtra e pagina com escopo de workspace', async () => {
    const lead = await saveLead(a, input);
    id = lead.id;
    expect(lead.score).toBe(100);
    expect((await listLeads(a, { q: 'integração' })).total).toBe(1);
    expect((await listLeads(b)).total).toBe(0);
    expect((await listLeads(a, { stage: 'won' })).total).toBe(0);
    expect((await listLeads(a, { page: 999 })).page).toBe(1);
  });
  it('rejeita leitura, alteração, anotação implícita e exclusão cruzadas', async () => {
    await expect(findLead(b, id)).rejects.toMatchObject({ status: 404 });
    await expect(moveLead(b, id, 'won')).rejects.toMatchObject({ status: 404 });
    await expect(saveLead(b, input, id)).rejects.toMatchObject({ status: 404 });
    await expect(deleteLead(b, id)).rejects.toMatchObject({ status: 404 });
  });
  it('edição recalcula fatores, move etapa e contabiliza conversão', async () => {
    const edited = await saveLead(a, { ...input, urgency: 'low' }, id);
    expect(edited.score).toBe(55);
    await moveLead(a, id, 'won');
    const result = await analytics(a);
    expect(result.conversion).toBe(100);
    expect(result.evolution.reduce((s, d) => s + d.value, 0)).toBe(result.totals.total);
    const factors = await db()
      .select()
      .from(leadScoreFactors)
      .where(and(eq(leadScoreFactors.leadId, id), eq(leadScoreFactors.createdAt, edited.scoredAt)));
    expect(factors.reduce((s, f) => s + f.points, 0)).toBe(55);
    expect(
      await db().select().from(leadScoreFactors).where(eq(leadScoreFactors.leadId, id)),
    ).toHaveLength(8);
    const history = await db().select().from(leadEvents).where(eq(leadEvents.leadId, id));
    expect(history.map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['created', 'updated', 'stage_changed']),
    );
  });
  it('Live persiste score, protege projeção e serializa encerramento', async () => {
    const session = await createDemoSession(a, 'Demonstração de integração');
    const data = {
      name: 'Bia',
      interest: 'Website',
      urgency: 'high',
      budgetRange: 'under_2k',
      notes: 'Quero organizar os contatos recebidos pelo site.',
      consent: true,
    };
    const result = await submitPublicLead(session.token, data);
    expect(result.score).toBe(100);
    const snap = await liveSnapshot(a);
    expect(snap.count).toBe(1);
    expect(snap.entries[0]).not.toHaveProperty('email');
    expect(snap.entries[0]).not.toHaveProperty('notes');
    expect((await recalculateLead(a, snap.entries[0].id)).score).toBe(100);
    await expect(eraseDemoSession(a, session.id)).rejects.toMatchObject({ status: 409 });
    await expect(endDemoSession(b, session.id)).rejects.toMatchObject({ status: 404 });
    await endDemoSession(a, session.id);
    await expect(submitPublicLead(session.token, data)).rejects.toMatchObject({ status: 410 });
    await expect(submitPublicLead('missing', data)).rejects.toMatchObject({ status: 410 });
    await eraseDemoSession(a, session.id);
    expect((await liveSnapshot(a)).count).toBe(0);
  });
  it('limite persistente é atômico com chamadas concorrentes', async () => {
    const scope = `test-${crypto.randomUUID()}`;
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => rateLimit(new Request('http://localhost:3000'), scope, 3)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(5);
  });
  it('exclusão remove fatores e histórico em cascata', async () => {
    await deleteLead(a, id);
    expect(await db().select().from(leads).where(eq(leads.id, id))).toHaveLength(0);
    expect(await db().select().from(leadEvents).where(eq(leadEvents.leadId, id))).toHaveLength(0);
    expect(
      await db().select().from(leadScoreFactors).where(eq(leadScoreFactors.leadId, id)),
    ).toHaveLength(0);
  });
  it('seed é idempotente e inclui temperaturas distintas calculadas', async () => {
    for (let i = 0; i < 2; i++)
      await run(
        process.execPath,
        ['node_modules/tsx/dist/cli.mjs', 'scripts/seed.ts', '--workspace', a],
        { timeout: 60000 },
      );
    const rows = await db().select().from(leads).where(eq(leads.workspaceId, a));
    expect(rows).toHaveLength(30);
    expect(new Set(rows.map((l) => l.temperature))).toEqual(
      new Set(['hot', 'warm', 'cold', 'insufficient']),
    );
    expect(rows.every((l) => l.isDemo)).toBe(true);
  }, 120000);
});
