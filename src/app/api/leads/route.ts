import { getContext } from '@/lib/session';
import { listLeads, saveLead } from '@/features/leads/service';
import { leadSchema } from '@/features/leads/validation';
import { errorResponse, HttpError, jsonBody, sameOrigin } from '@/lib/http';
export async function GET(request: Request) {
  try {
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    const p = new URL(request.url).searchParams;
    return Response.json(
      await listLeads(ctx.workspaceId, {
        q: p.get('q') || '',
        stage: p.get('stage') || '',
        temperature: p.get('temperature') || '',
        source: p.get('source') || '',
        page: Number(p.get('page')) || 1,
        sort: p.get('sort') || '',
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await getContext();
    if (!ctx) throw new HttpError(401, 'Entre para continuar.');
    return Response.json(
      await saveLead(ctx.workspaceId, leadSchema.parse(await jsonBody(request))),
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
