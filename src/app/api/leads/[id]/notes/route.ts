import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { leads, leadEvents } from '@/db/schema';
import { getContext } from '@/lib/session';
import { errorResponse, HttpError, jsonBody, sameOrigin } from '@/lib/http';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const id = z.uuid().parse((await params).id);
    const body = z
      .object({ description: z.string().trim().min(2).max(2000) })
      .parse(await jsonBody(request));
    await db().transaction(async (tx) => {
      const [lead] = await tx
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.id, id), eq(leads.workspaceId, ctx.workspaceId)))
        .for('update');
      if (!lead) throw new HttpError(404, 'Lead não encontrado.');
      await tx
        .insert(leadEvents)
        .values({ leadId: id, eventType: 'note', description: body.description });
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
