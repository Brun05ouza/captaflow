import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireContext } from '@/lib/session';
import { listLeads } from '@/features/leads/service';
import { stages, sources } from '@/features/leads/validation';
import { PageHeader } from '@/components/page-header';
import { LeadForm } from '@/components/leads/lead-form';
import { LeadTable } from '@/components/leads/table';
import { Button } from '@/components/ui/button';
import { sourceLabel } from '@/lib/utils';
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await requireContext();
  const p = await searchParams;
  const result = await listLeads(ctx.workspaceId, { ...p, page: Number(p.page) || 1 });
  const pageLink = (page: number) => {
    const query = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    query.set('page', String(page));
    return `/app/leads?${query}`;
  };
  return (
    <>
      <PageHeader
        title="Meus Leads"
        description="Veja quem entrou em contato, o que procura e qual é o próximo passo."
      >
        <LeadForm />
      </PageHeader>
      <form className="filter-bar">
        <div className="search-input">
          <Search size={17} />
          <label className="sr-only" htmlFor="search">
            Buscar leads
          </label>
          <input
            id="search"
            name="q"
            placeholder="Buscar nome, empresa ou e-mail…"
            defaultValue={p.q}
          />
        </div>
        <select
          name="temperature"
          aria-label="Prioridade comercial"
          defaultValue={p.temperature || ''}
        >
          <option value="">Todas as prioridades</option>
          <option value="hot">Alta</option>
          <option value="warm">Média</option>
          <option value="cold">Baixa</option>
          <option value="insufficient">Dados insuficientes</option>
        </select>
        <select name="stage" aria-label="Etapa" defaultValue={p.stage || ''}>
          <option value="">Todas as etapas</option>
          {Object.entries(stages).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select name="source" aria-label="Origem" defaultValue={p.source || ''}>
          <option value="">Todas as origens</option>
          {[...sources, 'Live Experience'].map((s) => (
            <option key={s} value={s}>
              {sourceLabel(s)}
            </option>
          ))}
        </select>
        <select name="demo" aria-label="Tipo de registro" defaultValue={p.demo || ''}>
          <option value="">Reais e demonstração</option>
          <option value="real">Somente reais</option>
          <option value="demo">Somente demonstração</option>
        </select>
        <select name="sort" aria-label="Ordenação" defaultValue={p.sort || ''}>
          <option value="">Mais recentes</option>
          <option value="score">Maior pontuação</option>
          <option value="name">Nome A–Z</option>
        </select>
        <Button variant="outline">Filtrar</Button>
        {Object.values(p).some(Boolean) && (
          <Link className="subtle-link" href="/app/leads">
            Limpar
          </Link>
        )}
      </form>
      <section className="panel">
        <div className="panel-heading">
          <h2>
            Todos os leads <span className="count-badge">{result.total}</span>
          </h2>
          <span className="muted">12 por página</span>
        </div>
        <LeadTable
          rows={result.rows}
          filtered={Boolean(p.q || p.stage || p.temperature || p.source || p.demo)}
        />
        <div className="pagination">
          <span>
            {result.total
              ? `${(result.page - 1) * 12 + 1}–${Math.min(result.page * 12, result.total)} de ${result.total} leads`
              : '0 leads'}
          </span>
          <div>
            {result.page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageLink(result.page - 1)}>
                  <ChevronLeft size={15} />
                  Anterior
                </Link>
              </Button>
            )}
            <span>
              Página {result.page} de {result.pages}
            </span>
            {result.page < result.pages && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageLink(result.page + 1)}>
                  Próxima
                  <ChevronRight size={15} />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
