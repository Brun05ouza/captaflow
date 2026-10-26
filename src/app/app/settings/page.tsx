import { ShieldCheck, Database, LockKeyhole } from 'lucide-react';
import { requireContext } from '@/lib/session';
import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings-form';
export default async function Settings() {
  const ctx = await requireContext();
  return (
    <>
      <PageHeader title="Configurações" description="O essencial para o seu workspace comercial." />
      <div className="settings-section">
        <div>
          <h2>Seu workspace</h2>
          <p>Uma identidade para as suas oportunidades.</p>
        </div>
        <section className="panel settings-panel">
          <SettingsForm name={ctx.workspaceName} />
        </section>
      </div>
      <div className="settings-section">
        <div>
          <h2>Conta e acesso</h2>
          <p>Seu ambiente comercial é privado.</p>
        </div>
        <section className="panel settings-panel">
          <dl>
            <dt>Administrador</dt>
            <dd>{ctx.user.name}</dd>
            <dt>E-mail de acesso</dt>
            <dd>{ctx.user.email}</dd>
            <dt>Permissão</dt>
            <dd>Administrador do workspace</dd>
          </dl>
        </section>
      </div>
      <div className="settings-section">
        <div>
          <h2>Proteção dos dados</h2>
          <p>Controles ativos na plataforma.</p>
        </div>
        <section className="panel settings-panel security-list">
          <p>
            <ShieldCheck size={19} />
            Autorização por workspace no servidor
          </p>
          <p>
            <Database size={19} />
            Persistência PostgreSQL no Neon
          </p>
          <p>
            <LockKeyhole size={19} />
            Sessões persistentes com Better Auth
          </p>
          <small>
            Envios públicos têm limites persistentes. Demonstrações não exigem dados de contato.
            Nenhum serviço de IA está conectado.
          </small>
        </section>
      </div>
    </>
  );
}
