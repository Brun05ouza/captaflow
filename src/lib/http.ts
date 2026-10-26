import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin;
  if (request.headers.get('origin') !== expected)
    throw new HttpError(403, 'Origem da requisição não autorizada.');
}
export function errorResponse(e: unknown) {
  if (e instanceof ZodError)
    return Response.json({ error: e.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  console.error('Falha na operação', e instanceof Error ? e.name : 'Unknown');
  return Response.json({ error: 'Não foi possível concluir. Tente novamente.' }, { status: 500 });
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 16000)
    throw new HttpError(413, 'Conteúdo muito grande.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Envie os dados do formulário.');
  let text = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16000) {
      await reader.cancel();
      throw new HttpError(413, 'Conteúdo muito grande.');
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not-object');
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}
