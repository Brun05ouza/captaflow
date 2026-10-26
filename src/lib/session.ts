import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getAuth } from './auth';
import { db } from '@/db';
import { workspaceMembers, workspaces } from '@/db/schema';
export const getContext = cache(async () => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const [membership] = await db()
    .select({ workspaceId: workspaces.id, workspaceName: workspaces.name })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, session.user.id))
    .limit(1);
  if (!membership) return null;
  return { ...membership, user: session.user };
});
export async function requireContext() {
  const ctx = await getContext();
  if (!ctx) redirect('/login');
  return ctx;
}
