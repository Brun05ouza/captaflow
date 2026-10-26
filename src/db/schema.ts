import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  bigint,
  jsonb,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
const time = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: time('created_at'),
  updatedAt: time('updated_at'),
});
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: time('created_at'),
    updatedAt: time('updated_at'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
);
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: time('created_at'),
    updatedAt: time('updated_at'),
  },
  (t) => [index('account_user_idx').on(t.userId)],
);
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: time('created_at'),
  updatedAt: time('updated_at'),
});
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: time('created_at'),
  updatedAt: time('updated_at'),
});
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('admin'),
    createdAt: time('created_at'),
  },
  (t) => [
    uniqueIndex('member_user_unique').on(t.userId),
    index('member_workspace_idx').on(t.workspaceId),
  ],
);
export const demoSessions = pgTable(
  'demo_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: time('created_at'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => [index('demo_workspace_idx').on(t.workspaceId, t.createdAt)],
);
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    company: text('company'),
    segment: text('segment'),
    interest: text('interest').notNull(),
    urgency: text('urgency').notNull(),
    budgetRange: text('budget_range').notNull(),
    source: text('source').notNull(),
    campaign: text('campaign'),
    notes: text('notes'),
    stage: text('stage').notNull().default('new'),
    score: integer('score').notNull(),
    temperature: text('temperature').notNull(),
    scoreReason: text('score_reason').notNull(),
    scoringMethod: text('scoring_method').notNull().default('rules-v1'),
    isDemo: boolean('is_demo').notNull().default(false),
    demoSessionId: uuid('demo_session_id').references(() => demoSessions.id, {
      onDelete: 'cascade',
    }),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    scoredAt: time('scored_at'),
    createdAt: time('created_at'),
    updatedAt: time('updated_at'),
  },
  (t) => [
    index('lead_workspace_created_idx').on(t.workspaceId, t.createdAt),
    index('lead_workspace_stage_idx').on(t.workspaceId, t.stage),
    index('lead_demo_idx').on(t.demoSessionId),
    uniqueIndex('lead_seed_unique').on(t.workspaceId, t.campaign),
    check('score_bounds', sql`${t.score} between 0 and 100`),
    check('stage_valid', sql`${t.stage} in ('new','qualified','negotiation','won','lost')`),
  ],
);
export const leadScoreFactors = pgTable(
  'lead_score_factors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    factor: text('factor').notNull(),
    points: integer('points').notNull(),
    explanation: text('explanation').notNull(),
    createdAt: time('created_at'),
  },
  (t) => [index('factor_lead_idx').on(t.leadId)],
);
export const leadEvents = pgTable(
  'lead_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    description: text('description').notNull(),
    metadata: jsonb('metadata'),
    createdAt: time('created_at'),
  },
  (t) => [index('event_lead_idx').on(t.leadId, t.createdAt)],
);
export const leadIntelligenceAnalyses = pgTable('lead_intelligence_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  model: text('model'),
  status: text('status').notNull(),
  result: jsonb('result'),
  createdAt: time('created_at'),
});
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').primaryKey(),
    hits: integer('hits').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('rate_expiry_idx').on(t.expiresAt)],
);
export const authRateLimits = pgTable('auth_rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type DemoSession = typeof demoSessions.$inferSelect;
