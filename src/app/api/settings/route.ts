import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { workspaces } from '@/db/schema';
import { getContext } from '@/lib/session';
import { errorResponse, HttpError, jsonBody, sameOrigin } from '@/lib/http';
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const { name } = z
      .object({ name: z.string().trim().min(2).max(100) })
      .parse(await jsonBody(request));
    await db()
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(eq(workspaces.id, ctx.workspaceId));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
