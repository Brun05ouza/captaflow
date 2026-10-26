import { notFound } from 'next/navigation';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { Phone, Mail, Building2, ArrowLeft, MessageCircle, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { requireContext } from '@/lib/session';
import { findLead } from '@/features/leads/service';
import { db } from '@/db';
import { leadEvents, leadScoreFactors } from '@/db/schema';
import { PageHeader } from '@/components/page-header';
import { LeadForm } from '@/components/leads/lead-form';
import { DetailActions, StageSelect, NoteForm } from '@/components/leads/detail-actions';
import { Temperature } from '@/components/leads/table';
import { Button } from '@/components/ui/button';
import { scoreLead } from '@/features/scoring/engine';
import { budgets, urgencies, phoneValid } from '@/features/leads/validation';
import { whatsappNumber, sourceLabel } from '@/lib/utils';
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let lead;
  try {
    lead = await findLead(ctx.workspaceId, id);
  } catch {
    notFound();
  }
  const [events, factors] = await Promise.all([
    db()
      .select()
      .from(leadEvents)
      .where(eq(leadEvents.leadId, id))
      .orderBy(desc(leadEvents.createdAt))
      .limit(50),
    db()
      .select()
      .from(leadScoreFactors)
      .where(and(eq(leadScoreFactors.leadId, id), eq(leadScoreFactors.createdAt, lead.scoredAt))),
  ]);
  const scoring = scoreLead(lead);
  return (
    <>
      <Link href="/app/leads" className="back-link">
        <ArrowLeft size={15} />
        Todos os leads
      </Link>
      <PageHeader title={lead.name} description={lead.company || 'Perfil da oportunidade'}>
        <LeadForm lead={lead} />
        <DetailActions lead={lead} />
      </PageHeader>
      {lead.isDemo && (
        <div className="notice">
          Registro de demonstração · Dados fornecidos para apresentação do produto.
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Perfil comercial</h2>
            <StageSelect id={id} stage={lead.stage} />
          </div>
          <div className="profile-data">
            <div>
              <Mail size={17} />
              <span>
                E-mail<strong>{lead.email || 'Não informado'}</strong>
              </span>
            </div>
            <div>
              <Phone size={17} />
              <span>
                WhatsApp<strong>{lead.phone || 'Não informado'}</strong>
              </span>
            </div>
            <div>
              <Building2 size={17} />
              <span>
                Empresa / segmento
                <strong>
                  {lead.company || 'Não informado'} / {lead.segment || 'Não informado'}
                </strong>
              </span>
            </div>
            <dl>
              <dt>Serviço de interesse</dt>
              <dd>{lead.interest}</dd>
              <dt>Urgência</dt>
              <dd>{urgencies[lead.urgency as keyof typeof urgencies]}</dd>
              <dt>Investimento</dt>
              <dd>{budgets[lead.budgetRange as keyof typeof budgets]}</dd>
              <dt>Origem</dt>
              <dd>{sourceLabel(lead.source)}</dd>
              <dt>Problema ou objetivo</dt>
              <dd className="preserve-lines">{lead.notes || 'Nenhuma observação.'}</dd>
            </dl>
            {lead.phone && phoneValid(lead.phone) && (
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/${whatsappNumber(lead.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={17} />
                  Abrir WhatsApp
                </a>
              </Button>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Pontuação do Lead</h2>
              <p>Prioridade comercial estimada por regras</p>
            </div>
            <Temperature value={lead.temperature} />
          </div>
          <div className="qualification">
            {!scoring.reliable && (
              <p className="insufficient-help">
                Dados insuficientes não significam pouco potencial. Entenda a necessidade antes de
                definir a ordem de atendimento.
              </p>
            )}
            <span className="muted">
              {scoring.reliable ? 'Pontuação atual' : 'Pontuação parcial'}
            </span>
            <div className="large-score">
              {lead.score}
              <span>/100</span>
            </div>
            <p>{lead.scoreReason}</p>
            <details className="scoring-help">
              <summary>Como funciona a classificação?</summary>
              <p>
                As regras consideram o serviço procurado, o problema descrito, o prazo e a faixa de
                investimento. Preencher campos com texto genérico não basta para indicar uma
                prioridade.
              </p>
              <p>
                Alta: 80–100 pontos. Média: 60–79. Baixa: 0–59. Sem uma descrição utilizável do
                serviço e da necessidade, o resultado é “Dados insuficientes”, sem posição sugerida
                na fila.
              </p>
              <p>
                Empresa, nome e dados de contato não acrescentam pontos. Orçamento maior não vale
                mais. A classificação é uma estimativa: confirme a necessidade em conversa.
              </p>
            </details>
            {factors.map((f) => (
              <div className="factor-row" key={f.id}>
                <div>
                  <strong>{f.factor}</strong>
                  <small>{f.explanation}</small>
                </div>
                <span>+{f.points}</span>
              </div>
            ))}
            <div className="recommendation">
              <strong>Próxima ação</strong>
              <p>{scoring.recommendation}</p>
            </div>
            <p className="muted">
              {scoring.missing.length
                ? `Para completar a avaliação: ${scoring.missing.join(', ')}.`
                : 'Há detalhes mínimos para uma estimativa.'}{' '}
              A pontuação não garante uma venda.
            </p>
          </div>
        </section>
        <section className="panel span-full">
          <div className="panel-heading">
            <h2>Histórico da oportunidade</h2>
            <Clock3 size={18} />
          </div>
          <div className="history-grid">
            <div className="timeline">
              {events.map((event) => (
                <article key={event.id}>
                  <i />
                  <div>
                    <strong>{event.description}</strong>
                    <small>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'America/Sao_Paulo',
                      }).format(event.createdAt)}
                    </small>
                  </div>
                </article>
              ))}
            </div>
            <NoteForm id={id} />
          </div>
        </section>
      </div>
    </>
  );
}
