import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Radio, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { requireContext } from '@/lib/session';
import { analytics } from '@/features/leads/service';
import { PageHeader } from '@/components/page-header';
import { LeadForm } from '@/components/leads/lead-form';
import { LeadTable } from '@/components/leads/table';
import { CaptureChart, SourceChart, Distribution } from '@/components/dashboard/charts';
import { Button } from '@/components/ui/button';
import { HowItWorks } from '@/components/dashboard/how-it-works';
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const ctx = await requireContext();
  const p = await searchParams;
  const days = [7, 30, 90].includes(Number(p.days)) ? Number(p.days) : 30;
  const a = await analytics(ctx.workspaceId, days);
  return (
    <div className="dashboard-page">
      <PageHeader
        title="Visão Geral"
        description="Acompanhe seus contatos e escolha o próximo passo de cada conversa."
      >
        <Button asChild variant="outline">
          <Link href="/app/live">
            <Radio size={16} />
            Captação ao Vivo
          </Link>
        </Button>
        <LeadForm />
      </PageHeader>
      <HowItWorks workspaceId={ctx.workspaceId} />
      <div className="overview-toolbar">
        <div className="view-tabs">
          <span className="selected">Panorama comercial</span>
          <Link href="/app/pipeline">
            Funil de Vendas <ArrowUpRight size={13} />
          </Link>
        </div>
        <form>
          <CalendarDays size={15} />
          <label className="sr-only" htmlFor="period">
            Período
          </label>
          <select id="period" name="days" defaultValue={days}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button aria-label="Aplicar período">
            <SlidersHorizontal size={15} />
          </button>
        </form>
      </div>
      <section className="kpi-grid" aria-label="Indicadores comerciais">
        {[
          {
            label: 'Total de leads',
            value: a.totals.total,
            sub: `Cadastrados nos últimos ${days} dias`,
          },
          { label: 'Leads novos', value: a.totals.new, sub: 'Aguardando o primeiro contato' },
          {
            label: 'Leads com prioridade alta',
            value: a.totals.hot,
            sub: 'Necessidade descrita e pontuação a partir de 80',
          },
          {
            label: 'Taxa de conversão',
            value: `${a.conversion.toFixed(1).replace('.', ',')}%`,
            sub: `${a.totals.won} ganhos de ${a.totals.total} cadastrados`,
          },
        ].map((k, i) => (
          <article className="kpi" key={k.label}>
            <span>
              {k.label}
              <ArrowUpRight size={15} />
            </span>
            <strong>{k.value}</strong>
            <small>
              {i === 2 && a.totals.hot > 0 ? (
                <span className="priority-label">Priorize o contato</span>
              ) : (
                k.sub
              )}
            </small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="panel capture-panel">
          <div className="panel-heading">
            <div>
              <h2>Evolução da captação</h2>
              <p>Novas oportunidades ao longo do período</p>
            </div>
            <span className="series-key">
              <i />
              Leads captados
            </span>
          </div>
          <CaptureChart data={a.evolution} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Leads por origem</h2>
              <p>De onde vêm suas oportunidades</p>
            </div>
          </div>
          {a.bySource.length ? (
            <SourceChart data={a.bySource} />
          ) : (
            <div className="chart-empty">As origens aparecem após o primeiro cadastro.</div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Prioridade comercial</h2>
              <p>Prioridades com critérios transparentes</p>
            </div>
            <Link className="subtle-link" href="/app/leads">
              Avaliar contatos <ArrowUpRight size={14} />
            </Link>
          </div>
          <Distribution data={a.byTemperature} type="temperature" total={a.totals.total} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Etapas do funil</h2>
              <p>O caminho até a conversão</p>
            </div>
            <Link className="subtle-link" href="/app/pipeline">
              Abrir funil <ArrowUpRight size={14} />
            </Link>
          </div>
          <Distribution data={a.byStage} type="stage" total={a.totals.total} />
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Oportunidades recentes</h2>
            <p>Os últimos contatos que chegaram ao seu workspace</p>
          </div>
          <Link className="subtle-link" href="/app/leads">
            Ver todos os leads <ArrowRight size={15} />
          </Link>
        </div>
        <LeadTable rows={a.recent} compact />
      </section>
      <div className="data-note">
        Os indicadores incluem {a.totals.demo} registros de demonstração no período. Conversão =
        ganhos ÷ leads cadastrados no período.
      </div>
    </div>
  );
}
