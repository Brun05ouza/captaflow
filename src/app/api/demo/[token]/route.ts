import { z } from 'zod';
import { errorResponse, jsonBody, sameOrigin } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { submitPublicLead } from '@/features/live/service';
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    sameOrigin(request);
    const token = z
      .string()
      .regex(/^[\w-]{43}$/)
      .parse((await params).token);
    await rateLimit(request, 'public-global', 20);
    await rateLimit(request, `demo:${token}`, 5);
    return Response.json(await submitPublicLead(token, await jsonBody(request)), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
