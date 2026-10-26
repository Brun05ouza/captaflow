import { createHmac } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { HttpError } from './http';
export async function rateLimit(request: Request, scope: string, max = 8) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, 'Proteção de envios não configurada.');
  // Vercel overwrites x-vercel-forwarded-for; never trust arbitrary client x-forwarded-for.
  const ip = process.env.VERCEL
    ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    : 'local';
  const key = createHmac('sha256', secret).update(`${scope}:${ip}`).digest('hex');
  const result = await db().execute(
    sql`insert into rate_limits (key,hits,expires_at) values (${key},1,now()+interval '1 minute') on conflict (key) do update set hits=case when rate_limits.expires_at<=now() then 1 else rate_limits.hits+1 end,expires_at=case when rate_limits.expires_at<=now() then now()+interval '1 minute' else rate_limits.expires_at end returning hits`,
  );
  await db().execute(
    sql`delete from rate_limits where key in (select key from rate_limits where expires_at < now()-interval '1 hour' limit 100)`,
  );
  if (Number(result.rows[0]?.hits) > max)
    throw new HttpError(429, 'Muitos envios. Aguarde um minuto e tente novamente.');
}
