import { z } from 'zod';
import { getContext } from '@/lib/session';
import { errorResponse, HttpError, jsonBody, sameOrigin } from '@/lib/http';
import {
  createDemoSession,
  liveSnapshot,
  endDemoSession,
  eraseDemoSession,
} from '@/features/live/service';
export async function GET(request: Request) {
  try {
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const id = new URL(request.url).searchParams.get('id');
    if (id) z.uuid().parse(id);
    return Response.json(await liveSnapshot(ctx.workspaceId, id || undefined), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const { name } = z
      .object({ name: z.string().trim().min(2).max(100) })
      .parse(await jsonBody(request));
    return Response.json(await createDemoSession(ctx.workspaceId, name), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const { id } = z.object({ id: z.uuid() }).parse(await jsonBody(request));
    return Response.json(await endDemoSession(ctx.workspaceId, id));
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const { id, confirm } = z
      .object({ id: z.uuid(), confirm: z.literal(true) })
      .parse(await jsonBody(request));
    if (confirm) await eraseDemoSession(ctx.workspaceId, id);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
