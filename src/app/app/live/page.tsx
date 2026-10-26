import { requireContext } from '@/lib/session';
import { liveSnapshot } from '@/features/live/service';
import { PageHeader } from '@/components/page-header';
import { LivePanel } from '@/components/live/live-panel';
export default async function Live() {
  const ctx = await requireContext();
  const snapshot = await liveSnapshot(ctx.workspaceId);
  return (
    <>
      <PageHeader
        title="Captação ao Vivo"
        description="Receba participações via QR Code e acompanhe a entrada de cada contato na demonstração."
      />
      <div className="notice">
        Formulário demonstrativo para apresentações. Não importa contatos automaticamente de
        WhatsApp, Instagram ou outros serviços. Integrações comerciais ainda não estão disponíveis.
      </div>
      <LivePanel
        initial={snapshot}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
      />
    </>
  );
}
