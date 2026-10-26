import { and, eq, desc, ilike, or, sql, asc, gte, count } from 'drizzle-orm';
import { db } from '@/db';
import { leads, leadEvents, leadScoreFactors } from '@/db/schema';
import { scoreLead, SCORING_METHOD } from '@/features/scoring/engine';
import type { LeadInput } from './validation';
import { stages } from './validation';
import { HttpError } from '@/lib/http';
export interface LeadFilters {
  q?: string;
  stage?: string;
  temperature?: string;
  source?: string;
  sort?: string;
  page?: number;
  days?: number;
  demo?: string;
}
export function periodStart(days: number, now = new Date()) {
  const firstDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(now.getTime() - (days - 1) * 86400000),
  );
  return new Date(`${firstDay}T00:00:00-03:00`);
}
export function leadConditions(workspaceId: string, f: LeadFilters = {}) {
  return and(
    eq(leads.workspaceId, workspaceId),
    f.q
      ? or(
          ilike(leads.name, `%${f.q}%`),
          ilike(leads.company, `%${f.q}%`),
          ilike(leads.email, `%${f.q}%`),
        )
      : undefined,
    f.stage ? eq(leads.stage, f.stage) : undefined,
    f.temperature ? eq(leads.temperature, f.temperature) : undefined,
    f.source ? eq(leads.source, f.source) : undefined,
    f.days ? gte(leads.createdAt, periodStart(f.days)) : undefined,
    f.demo === 'real'
      ? eq(leads.isDemo, false)
      : f.demo === 'demo'
        ? eq(leads.isDemo, true)
        : undefined,
  );
}
export async function listLeads(workspaceId: string, f: LeadFilters = {}) {
  const condition = leadConditions(workspaceId, f);
  const [{ total }] = await db().select({ total: count() }).from(leads).where(condition);
  const page = Math.min(Math.max(1, f.page || 1), Math.max(1, Math.ceil(total / 12)));
  const rows = await db()
    .select()
    .from(leads)
    .where(condition)
    .orderBy(
      f.sort === 'score'
        ? desc(leads.score)
        : f.sort === 'name'
          ? asc(leads.name)
          : desc(leads.createdAt),
    )
    .limit(12)
    .offset((page - 1) * 12);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / 12)) };
}
export async function findLead(workspaceId: string, id: string) {
  const [lead] = await db()
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
    .limit(1);
  if (!lead) throw new HttpError(404, 'Lead não encontrado.');
  return lead;
}
export async function saveLead(workspaceId: string, input: LeadInput, id?: string) {
  const scoring = scoreLead(input);
  return db().transaction(async (tx) => {
    const [previous] = id
      ? await tx
          .select()
          .from(leads)
          .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
          .for('update')
      : [];
    if (id && !previous) throw new HttpError(404, 'Lead não encontrado.');
    const scoredAt = new Date(Math.max(Date.now(), (previous?.scoredAt.getTime() ?? 0) + 1));
    const values = {
      ...input,
      email: input.email || null,
      phone: input.phone || null,
      workspaceId,
      score: scoring.score,
      temperature: scoring.temperature,
      scoreReason: scoring.reason,
      scoringMethod: SCORING_METHOD,
      scoredAt,
      updatedAt: new Date(),
    };
    let lead;
    if (id) {
      [lead] = await tx
        .update(leads)
        .set(values)
        .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
        .returning();
      if (!lead) throw new HttpError(404, 'Lead não encontrado.');
    } else {
      [lead] = await tx.insert(leads).values(values).returning();
    }
    await tx
      .insert(leadScoreFactors)
      .values(scoring.factors.map((f) => ({ ...f, leadId: lead.id, createdAt: scoredAt })));
    await tx.insert(leadEvents).values({
      leadId: lead.id,
      eventType: id ? 'updated' : 'created',
      description: id
        ? 'Cadastro atualizado e prioridade reavaliada.'
        : 'Lead cadastrado. Classificação automática por regras.',
      metadata: {
        score: scoring.score,
        method: SCORING_METHOD,
        previous: previous
          ? {
              score: previous.score,
              temperature: previous.temperature,
              method: previous.scoringMethod,
            }
          : null,
      },
    });
    return lead;
  });
}
export async function moveLead(workspaceId: string, id: string, stage: keyof typeof stages) {
  return db().transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .for('update');
    if (!before) throw new HttpError(404, 'Lead não encontrado.');
    if (before.stage === stage) return before;
    const [lead] = await tx
      .update(leads)
      .set({ stage, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .returning();
    await tx.insert(leadEvents).values({
      leadId: id,
      eventType: 'stage_changed',
      description: `Etapa alterada de ${stages[before.stage as keyof typeof stages]} para ${stages[stage]}.`,
      metadata: { from: before.stage, to: stage },
    });
    return lead;
  });
}
export async function deleteLead(workspaceId: string, id: string) {
  const deleted = await db()
    .delete(leads)
    .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
    .returning({ id: leads.id });
  if (!deleted.length) throw new HttpError(404, 'Lead não encontrado.');
}
export async function recalculateLead(workspaceId: string, id: string) {
  return db().transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .for('update');
    if (!lead) throw new HttpError(404, 'Lead não encontrado.');
    const result = scoreLead(lead);
    const scoredAt = new Date(Math.max(Date.now(), lead.scoredAt.getTime() + 1));
    const [updated] = await tx
      .update(leads)
      .set({
        score: result.score,
        temperature: result.temperature,
        scoreReason: result.reason,
        scoringMethod: SCORING_METHOD,
        scoredAt,
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .returning();
    await tx
      .insert(leadScoreFactors)
      .values(result.factors.map((f) => ({ ...f, leadId: id, createdAt: scoredAt })));
    await tx.insert(leadEvents).values({
      leadId: id,
      eventType: 'scored',
      description: 'Prioridade reavaliada com critérios conservadores (versão 2).',
      metadata: {
        previous: { score: lead.score, temperature: lead.temperature, method: lead.scoringMethod },
        current: { score: result.score, temperature: result.temperature, method: SCORING_METHOD },
      },
    });
    return updated;
  });
}
export async function analytics(workspaceId: string, days = 30) {
  const where = leadConditions(workspaceId, { days });
  const [totals] = await db()
    .select({
      total: count(),
      new: sql<number>`count(*) filter (where ${leads.stage}='new')::int`,
      hot: sql<number>`count(*) filter (where ${leads.temperature}='hot')::int`,
      won: sql<number>`count(*) filter (where ${leads.stage}='won')::int`,
      demo: sql<number>`count(*) filter (where ${leads.isDemo})::int`,
    })
    .from(leads)
    .where(where);
  const bySource = await db()
    .select({ name: leads.source, value: count() })
    .from(leads)
    .where(where)
    .groupBy(leads.source)
    .orderBy(desc(count()), asc(leads.source));
  const byTemperature = await db()
    .select({ name: leads.temperature, value: count() })
    .from(leads)
    .where(where)
    .groupBy(leads.temperature);
  const byStage = await db()
    .select({ name: leads.stage, value: count() })
    .from(leads)
    .where(where)
    .groupBy(leads.stage);
  const daily = await db()
    .select({
      day: sql<string>`to_char(${leads.createdAt} at time zone 'America/Sao_Paulo','YYYY-MM-DD')`,
      value: count(),
    })
    .from(leads)
    .where(where)
    .groupBy(sql`to_char(${leads.createdAt} at time zone 'America/Sao_Paulo','YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(${leads.createdAt} at time zone 'America/Sao_Paulo','YYYY-MM-DD')`));
  const evolution = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
    return {
      day: day.slice(5).split('-').reverse().join('/'),
      value: daily.find((d) => d.day === day)?.value || 0,
    };
  });
  const recent = await db()
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(5);
  return {
    totals,
    conversion: totals.total ? (totals.won / totals.total) * 100 : 0,
    bySource,
    byTemperature,
    byStage,
    evolution,
    recent,
  };
}
