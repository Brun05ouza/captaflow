import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
const globalDb = globalThis as unknown as { captaPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  return (globalDb.captaPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  }));
}
export function db() {
  return drizzle(getPool(), { schema });
}
