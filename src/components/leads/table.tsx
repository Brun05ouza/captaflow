import Link from 'next/link';
import { ArrowUpRight, Users } from 'lucide-react';
import type { Lead } from '@/db/schema';
import { dateLabel, temperatureLabels, sourceLabel } from '@/lib/utils';
import { LeadForm } from './lead-form';
import { stages } from '@/features/leads/validation';
export function Temperature({ value }: { value: string }) {
  return (
    <span className={`temperature ${value}`}>
      <i />
      {temperatureLabels[value] || value}
    </span>
  );
}
export function LeadTable({
  rows,
  compact = false,
  filtered = false,
}: {
  rows: Lead[];
  compact?: boolean;
  filtered?: boolean;
}) {
  if (!rows.length)
    return (
      <div className="empty-state">
        <Users size={30} />
        <h3>{filtered ? 'Nenhum contato encontrado' : 'Seus contatos começam aqui'}</h3>
        <p>
          {filtered
            ? 'Nenhum lead corresponde aos filtros escolhidos. Limpe os filtros para ver todos os contatos.'
            : 'Reúna as pessoas interessadas no seu serviço. Cadastre um contato para registrar o que ele precisa e acompanhar a negociação.'}
        </p>
        {filtered ? (
          <Link className="button button-outline" href="/app/leads">
            Limpar filtros
          </Link>
        ) : (
          <>
            <LeadForm triggerLabel="Cadastrar primeiro contato" />
            <Link className="subtle-link" href="/app/live">
              Experimentar captação por QR Code
            </Link>
          </>
        )}
      </div>
    );
  return (
    <div>
      <p className="table-hint">
        Deslize a tabela para ver prioridade, etapa e origem. Toque no nome para abrir o contato.
      </p>
      <div className="table-scroll" role="region" aria-label="Tabela de leads" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th>Nome / empresa</th>
              {!compact && <th>Interesse</th>}
              <th>Origem</th>
              <th>Prioridade comercial</th>
              <th className="numeric">Pontuação</th>
              <th>Etapa</th>
              <th>Cadastro</th>
              <th>
                <span className="sr-only">Detalhes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <Link className="person" href={`/app/leads/${lead.id}`}>
                    <span className={`person-avatar avatar-${lead.name.charCodeAt(0) % 4}`}>
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <span>
                      <strong>{lead.name}</strong>
                      <small>
                        {lead.company || 'Sem empresa'}
                        {lead.isDemo && <em>Demonstração</em>}
                      </small>
                    </span>
                  </Link>
                </td>
                {!compact && (
                  <td className="interest-cell">
                    {lead.interest}
                    <small>{lead.segment || 'Sem segmento'}</small>
                  </td>
                )}
                <td>{sourceLabel(lead.source)}</td>
                <td>
                  <Temperature value={lead.temperature} />
                </td>
                <td className="numeric">
                  <span className="score">
                    {lead.score}
                    <small>/100</small>
                  </span>
                </td>
                <td>
                  <span className={`stage-label stage-${lead.stage}`}>
                    {stages[lead.stage as keyof typeof stages]}
                  </span>
                </td>
                <td className="muted nowrap">{dateLabel(lead.createdAt)}</td>
                <td>
                  <Link
                    href={`/app/leads/${lead.id}`}
                    className="row-link"
                    aria-label={`Ver ${lead.name}`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
