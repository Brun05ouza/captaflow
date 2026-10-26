import { randomBytes } from 'node:crypto';
import { and, eq, desc, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { demoSessions, leads, leadEvents, leadScoreFactors } from '@/db/schema';
import { scoreLead, SCORING_METHOD } from '@/features/scoring/engine';
import { publicLeadSchema } from '@/features/leads/validation';
import { HttpError } from '@/lib/http';
export async function createDemoSession(workspaceId: string, name: string) {
  const [session] = await db()
    .insert(demoSessions)
    .values({
      workspaceId,
      name,
      token: randomBytes(32).toString('base64url'),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    })
    .returning();
  return session;
}
export async function liveSnapshot(workspaceId: string, sessionId?: string) {
  const sessions = await db()
    .select()
    .from(demoSessions)
    .where(eq(demoSessions.workspaceId, workspaceId))
    .orderBy(desc(demoSessions.createdAt))
    .limit(50);
  const current = sessionId ? sessions.find((s) => s.id === sessionId) : sessions[0];
  if (sessionId && !current) throw new HttpError(404, 'Sessão não encontrada.');
  if (!current) return { sessions: [], current: null, entries: [], count: 0 };
  const entries = await db()
    .select({
      id: leads.id,
      name: leads.name,
      interest: leads.interest,
      urgency: leads.urgency,
      score: leads.score,
      temperature: leads.temperature,
      stage: leads.stage,
      source: leads.source,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.demoSessionId, current.id)))
    .orderBy(desc(leads.createdAt))
    .limit(50);
  const [count] = await db()
    .select({ value: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.workspaceId, workspaceId), eq(leads.demoSessionId, current.id)));
  return {
    sessions,
    current: {
      ...current,
      status:
        current.status === 'active' && current.expiresAt <= new Date() ? 'expired' : current.status,
    },
    entries,
    count: count.value,
  };
}
export async function endDemoSession(workspaceId: string, id: string) {
  const [session] = await db()
    .update(demoSessions)
    .set({ status: 'ended', endedAt: new Date() })
    .where(and(eq(demoSessions.id, id), eq(demoSessions.workspaceId, workspaceId)))
    .returning();
  if (!session) throw new HttpError(404, 'Sessão não encontrada.');
  return session;
}
export async function eraseDemoSession(workspaceId: string, id: string) {
  return db().transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(demoSessions)
      .where(and(eq(demoSessions.id, id), eq(demoSessions.workspaceId, workspaceId)))
      .for('update');
    if (!session) throw new HttpError(404, 'Sessão não encontrada.');
    if (session.status === 'active' && session.expiresAt > new Date())
      throw new HttpError(409, 'Encerre a sessão antes de excluir seus registros.');
    await tx
      .delete(leads)
      .where(and(eq(leads.workspaceId, workspaceId), eq(leads.demoSessionId, id)));
  });
}
export async function submitPublicLead(token: string, raw: unknown) {
  const input = publicLeadSchema.parse(raw);
  return db().transaction(async (tx) => {
    // Session lock serializes submission with close/delete and rechecks expiry at write time.
    const [session] = await tx
      .select()
      .from(demoSessions)
      .where(
        and(
          eq(demoSessions.token, token),
          eq(demoSessions.status, 'active'),
          gt(demoSessions.expiresAt, new Date()),
        ),
      )
      .for('update');
    if (!session) throw new HttpError(410, 'Esta demonstração foi encerrada ou expirou.');
    if (session.expiresAt <= new Date()) throw new HttpError(410, 'Esta demonstração expirou.');
    const scoring = scoreLead(input);
    const scoredAt = new Date();
    const [lead] = await tx
      .insert(leads)
      .values({
        workspaceId: session.workspaceId,
        name: input.name,
        interest: input.interest,
        urgency: input.urgency,
        budgetRange: input.budgetRange,
        notes: input.notes,
        source: 'Live Experience',
        score: scoring.score,
        temperature: scoring.temperature,
        scoreReason: scoring.reason,
        scoringMethod: SCORING_METHOD,
        scoredAt,
        isDemo: true,
        demoSessionId: session.id,
        consentAt: new Date(),
      })
      .returning({ id: leads.id });
    await tx
      .insert(leadScoreFactors)
      .values(scoring.factors.map((f) => ({ ...f, leadId: lead.id, createdAt: scoredAt })));
    await tx.insert(leadEvents).values({
      leadId: lead.id,
      eventType: 'created',
      description: 'Participação voluntária em demonstração. Classificação automática por regras.',
    });
    return {
      score: scoring.score,
      temperature: scoring.temperature,
      factors: scoring.factors,
      reason: scoring.reason,
      reliable: scoring.reliable,
    };
  });
}
