import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { demoSessions } from '@/db/schema';
import { PublicForm } from '@/components/live/public-form';
import { Brand } from '@/components/brand';
export const dynamic = 'force-dynamic';
export default async function Demo({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [session] = /^[\w-]{43}$/.test(token)
    ? await db()
        .select({ name: demoSessions.name })
        .from(demoSessions)
        .where(
          and(
            eq(demoSessions.token, token),
            eq(demoSessions.status, 'active'),
            gt(demoSessions.expiresAt, new Date()),
          ),
        )
        .limit(1)
    : [];
  if (!session)
    return (
      <main className="public-unavailable">
        <Brand />
        <h1>Esta demonstração não está disponível.</h1>
        <p>
          A sessão foi encerrada, expirou ou o link está incorreto. Solicite um novo QR Code ao
          apresentador.
        </p>
      </main>
    );
  return <PublicForm token={token} sessionName={session.name} />;
}
