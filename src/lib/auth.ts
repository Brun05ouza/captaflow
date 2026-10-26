import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
function createAuth() {
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)
    throw new Error('Configure BETTER_AUTH_SECRET com pelo menos 32 caracteres.');
  return betterAuth({
    database: drizzleAdapter(db(), {
      provider: 'pg',
      schema: { ...schema, authRateLimits: schema.authRateLimits },
      transaction: true,
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      useSecureCookies: process.env.NODE_ENV === 'production',
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'authRateLimits',
      window: 60,
      max: 20,
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
