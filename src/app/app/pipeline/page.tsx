import Link from 'next/link';
import { eq, desc } from 'drizzle-orm';
import { ArrowUpRight } from 'lucide-react';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { requireContext } from '@/lib/session';
import { PageHeader } from '@/components/page-header';
import { LeadForm } from '@/components/leads/lead-form';
import { StageSelect } from '@/components/leads/detail-actions';
import { Temperature } from '@/components/leads/table';
import { stages } from '@/features/leads/validation';
import { sourceLabel } from '@/lib/utils';
export default async function Pipeline() {
  const ctx = await requireContext();
  const rows = await db()
    .select()
    .from(leads)
    .where(eq(leads.workspaceId, ctx.workspaceId))
    .orderBy(desc(leads.updatedAt))
    .limit(500);
  return (
    <>
      <PageHeader
        title="Funil de Vendas"
        description="Acompanhe as conversas do primeiro contato até a venda. Use o menu de cada lead para mudar a etapa."
      >
        <LeadForm />
      </PageHeader>
      {!rows.length && (
        <section className="panel empty-state">
          <h2>Do primeiro contato à venda</h2>
          <p>
            Este funil mostra em que ponto está cada conversa. Cadastre um contato; ele aparecerá em
            “Novo” e poderá avançar conforme a negociação.
          </p>
          <LeadForm triggerLabel="Cadastrar primeiro contato" />
        </section>
      )}
      {rows.length > 0 && (
        <div className="pipeline" role="region" aria-label="Funil comercial">
          {Object.entries(stages).map(([stage, label]) => {
            const group = rows.filter((l) => l.stage === stage);
            return (
              <section className="pipeline-column" key={stage}>
                <header>
                  <span className={`stage-dot stage-${stage}`} />
                  <h2>{label}</h2>
                  <span>{group.length}</span>
                </header>
                <div className="pipeline-cards">
                  {group.map((lead) => (
                    <article key={lead.id} className="pipeline-card">
                      <Link href={`/app/leads/${lead.id}`}>
                        <strong>{lead.name}</strong>
                        <ArrowUpRight size={15} />
                      </Link>
                      <p>{lead.company || lead.interest}</p>
                      <div className="pipeline-score">
                        <Temperature value={lead.temperature} />
                        <strong>
                          {lead.score}
                          <small>/100</small>
                        </strong>
                      </div>
                      <div className="pipeline-meta">
                        {sourceLabel(lead.source)}
                        {lead.isDemo && <span>Demonstração</span>}
                      </div>
                      <StageSelect id={lead.id} stage={lead.stage} />
                    </article>
                  ))}
                  {!group.length && (
                    <div className="pipeline-empty">
                      Nenhuma conversa em “{label}”. Escolha esta etapa no menu de um lead quando a
                      negociação avançar.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {rows.length > 0 && (
        <p className="data-note">
          Exibindo até 500 oportunidades recentes. Alterações de etapa são salvas e registradas no
          histórico.
        </p>
      )}
    </>
  );
}
