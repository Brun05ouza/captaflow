import { z } from 'zod';
import { getContext } from '@/lib/session';
import {
  deleteLead,
  findLead,
  moveLead,
  saveLead,
  recalculateLead,
} from '@/features/leads/service';
import { leadSchema, demoEditSchema } from '@/features/leads/validation';
import { errorResponse, HttpError, jsonBody, sameOrigin } from '@/lib/http';
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, c: Context) {
  try {
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    return Response.json(await findLead(ctx.workspaceId, z.uuid().parse((await c.params).id)));
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(request: Request, c: Context) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const id = z.uuid().parse((await c.params).id);
    const body = await jsonBody(request);
    if (body.action === 'recalculate')
      return Response.json(await recalculateLead(ctx.workspaceId, id));
    if (body.action === 'stage') {
      const stage = z.enum(['new', 'qualified', 'negotiation', 'won', 'lost']).parse(body.stage);
      return Response.json(await moveLead(ctx.workspaceId, id, stage));
    }
    const existing = await findLead(ctx.workspaceId, id);
    return Response.json(
      await saveLead(
        ctx.workspaceId,
        (existing.isDemo ? demoEditSchema : leadSchema).parse(body),
        id,
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request, c: Context) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    await deleteLead(ctx.workspaceId, z.uuid().parse((await c.params).id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
