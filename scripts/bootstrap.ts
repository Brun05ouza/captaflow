import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import { db, getPool } from '../src/db';
import { user, account, workspaces, workspaceMembers } from '../src/db/schema';
import { hashPassword } from 'better-auth/crypto';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
config({ path: '.env.local' });
const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string', default: 'Administrador' },
    workspace: { type: 'string', default: 'Meu workspace' },
  },
});
const email = z.email().parse(values.email || process.env.BOOTSTRAP_EMAIL);
// Never pass a password in shell arguments. Supply via a secure environment or interactive hidden prompt.
let password = process.env.BOOTSTRAP_PASSWORD;
if (!password) {
  console.log('Digite a senha (mínimo 12 caracteres):');
  if (!process.stdin.isTTY) throw new Error('Defina BOOTSTRAP_PASSWORD no ambiente.');
  process.stdin.setRawMode(true);
  password = await new Promise<string>((resolve) => {
    let buf = '';
    process.stdin.resume();
    process.stdin.on('data', (chunk) => {
      for (const c of chunk.toString()) {
        if (c === '\r' || c === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          resolve(buf);
          return;
        }
        if (c === '\u0003') process.exit(1);
        if (c === '\u007f' || c === '\b') buf = buf.slice(0, -1);
        else buf += c;
      }
    });
  });
}
z.string().min(12).max(128).parse(password);
const hash = await hashPassword(password);
await db().transaction(async (tx) => {
  await tx.execute(sql`select pg_advisory_xact_lock(83473711)`);
  const existing = await tx.select({ id: user.id }).from(user).limit(1);
  if (existing.length) throw new Error('Bootstrap fechado: já existe uma conta.');
  const id = crypto.randomUUID();
  await tx.insert(user).values({ id, name: values.name!, email, emailVerified: false });
  await tx.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: hash,
  });
  const [workspace] = await tx
    .insert(workspaces)
    .values({ name: values.workspace!, slug: `captaflow-${crypto.randomUUID().slice(0, 8)}` })
    .returning();
  await tx.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: id });
});
console.log('Administrador e workspace criados. Login público de cadastro está desativado.');
await getPool().end();
