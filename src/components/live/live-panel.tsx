'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Radio,
  Copy,
  ArrowUpRight,
  Play,
  Square,
  Users,
  UserPlus,
  Maximize2,
  Minimize2,
  Trash2,
  Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Temperature } from '@/components/leads/table';
import { urgencies, stages } from '@/features/leads/validation';
import { sourceLabel } from '@/lib/utils';
type Snapshot = {
  current: {
    id: string;
    token: string;
    name: string;
    status: string;
    expiresAt: string | Date;
  } | null;
  sessions: { id: string; name: string }[];
  entries: {
    id: string;
    name: string;
    interest: string;
    urgency: string;
    score: number;
    temperature: string;
    stage: string;
    source: string;
    createdAt: string | Date;
  }[];
  count: number;
};
export function LivePanel({ initial, appUrl }: { initial: Snapshot; appUrl: string }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Minha apresentação');
  const [presenting, setPresenting] = useState(false);
  const [confirmation, setConfirmation] = useState<'end' | 'erase' | null>(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const seenIds = useRef(new Set(initial.entries.map((e) => e.id)));
  const [recentIds, setRecentIds] = useState(new Set<string>());
  const refresh = useCallback(async () => {
    if (document.hidden) return;
    try {
      const r = await fetch(`/api/live${selectedId ? `?id=${selectedId}` : ''}`, {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error();
      const next: Snapshot = await r.json();
      setRecentIds(
        new Set(next.entries.filter((e) => !seenIds.current.has(e.id)).map((e) => e.id)),
      );
      seenIds.current = new Set(next.entries.map((e) => e.id));
      setSnapshot(next);
      setError('');
    } catch {
      setError('Atualização interrompida. Tentando reconectar…');
    }
  }, [selectedId]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(tick, 4000);
    };
    timer = setTimeout(tick, 4000);
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  async function action(method: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/live', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          method === 'POST' ? { name } : { id: snapshot.current?.id, confirm: true },
        ),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (method === 'POST') {
        setSelectedId('');
        const latest = await fetch('/api/live', { cache: 'no-store' });
        if (latest.ok) setSnapshot(await latest.json());
      } else await refresh();
      toast.success(
        method === 'POST'
          ? 'Apresentação iniciada.'
          : method === 'PATCH'
            ? 'Sessão encerrada.'
            : 'Registros da sessão excluídos.',
      );
      setConfirmation(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha na operação.');
    } finally {
      setBusy(false);
    }
  }
  const current = snapshot.current;
  const active = current?.status === 'active';
  const url = current ? `${appUrl.replace(/\/$/, '')}/demo/${current.token}` : '';
  return (
    <div className={presenting ? 'presentation-mode' : ''}>
      <div className="live-toolbar">
        <div className="session-status">
          <i className={active ? 'live-dot' : ''} />
          {active
            ? 'Sessão aberta'
            : current?.status === 'expired'
              ? 'Sessão expirada'
              : current
                ? 'Sessão encerrada'
                : 'Pronto para começar'}
          {active && <span>Atualização a cada 4 segundos</span>}
        </div>
        <Button variant="outline" onClick={() => setPresenting(!presenting)}>
          {presenting ? <Minimize2 size={16} /> : <Maximize2 size={16} />}{' '}
          {presenting ? 'Sair da apresentação' : 'Modo apresentação'}
        </Button>
      </div>
      {snapshot.sessions.length > 1 && !presenting && (
        <div className="session-picker">
          <label htmlFor="past-session">Apresentação</label>
          <select
            id="past-session"
            value={selectedId || snapshot.current?.id || ''}
            onChange={async (e) => {
              const id = e.target.value;
              setSelectedId(id);
              const r = await fetch(`/api/live?id=${id}`, { cache: 'no-store' });
              if (r.ok) {
                const next: Snapshot = await r.json();
                seenIds.current = new Set(next.entries.map((entry) => entry.id));
                setSnapshot(next);
              }
            }}
          >
            {snapshot.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <div className="form-error" role="status">
          {error}
        </div>
      )}
      {!current || !active ? (
        <section className="live-start panel">
          <Radio size={38} strokeWidth={1.4} />
          <h2>Transforme sua plateia em oportunidades.</h2>
          <p>
            Inicie uma apresentação e compartilhe o QR Code. Cada resposta vira um contato de
            demonstração, com prioridade estimada pelas informações enviadas.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action('POST');
            }}
          >
            <label className="sr-only" htmlFor="session-name">
              Nome da apresentação
            </label>
            <input
              id="session-name"
              value={name}
              minLength={2}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button disabled={busy}>
              <Play size={16} />
              Iniciar apresentação
            </Button>
          </form>
          <small>As sessões expiram após 4 horas. Sem exigência de dados de contato.</small>
        </section>
      ) : null}
      {current && (
        <div className="live-grid">
          <section className="panel qr-panel">
            <div className="panel-heading">
              <div>
                <h2>{current.name}</h2>
                <p>Demonstração interativa do CaptaFlow</p>
              </div>
              <Radio size={19} />
            </div>
            <div className="qr-code">
              {active ? (
                <QRCodeSVG
                  value={url}
                  size={230}
                  level="M"
                  marginSize={3}
                  title="Escaneie para participar da apresentação"
                />
              ) : (
                <div className="qr-ended">
                  <Square size={36} />
                  <strong>Esta sessão está fechada</strong>
                </div>
              )}
            </div>
            <h3>{active ? 'Escaneie. Responda. Acompanhe.' : 'Obrigado por participar.'}</h3>
            <p>Somente nome ou apelido, interesse e classificação são exibidos na apresentação.</p>
            {active && (
              <>
                <div className="copy-link">
                  <input value={url} readOnly aria-label="Link público da apresentação" />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copiar link público"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success('Link copiado.');
                      } catch {
                        toast.error('Selecione e copie o link manualmente.');
                      }
                    }}
                  >
                    <Copy size={17} />
                  </Button>
                </div>
                <a className="subtle-link" href={url} target="_blank" rel="noopener noreferrer">
                  Abrir formulário
                  <ArrowUpRight size={15} />
                </a>
                <small className="expiry">
                  <Clock3 size={13} />
                  Expira às{' '}
                  {new Date(current.expiresAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </small>
              </>
            )}
            <div className="session-actions">
              {active ? (
                <Button variant="outline" onClick={() => setConfirmation('end')}>
                  <Square size={14} />
                  Encerrar sessão
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setConfirmation('erase')}>
                  <Trash2 size={15} />
                  Excluir registros da sessão
                </Button>
              )}
            </div>
          </section>
          <section className="live-entries">
            <div className="live-counters" aria-live="polite" aria-atomic="true">
              <div className="panel">
                <Users size={18} />
                <span>Participantes</span>
                <strong>{snapshot.count}</strong>
              </div>
              <div className="panel">
                <UserPlus size={18} />
                <span>Leads de demonstração</span>
                <strong>{snapshot.count}</strong>
              </div>
            </div>
            <div className="panel live-feed">
              <div className="panel-heading">
                <div>
                  <h2>As oportunidades estão chegando</h2>
                  <p>Prioridade comercial estimada por regras</p>
                </div>
                <span className="count-badge">{snapshot.count}</span>
              </div>
              {snapshot.entries.length ? (
                <div className="live-feed-list">
                  {snapshot.entries.map((entry) => (
                    <article
                      className={`live-entry ${recentIds.has(entry.id) ? 'live-entry-new' : ''}`}
                      key={entry.id}
                    >
                      <div className="entry-avatar">{entry.name[0].toUpperCase()}</div>
                      <div className="entry-info">
                        <strong>{entry.name}</strong>
                        <span>{entry.interest}</span>
                        <small>
                          {urgencies[entry.urgency as keyof typeof urgencies]} · Demonstração
                        </small>
                        <small>
                          {stages[entry.stage as keyof typeof stages]} · {sourceLabel(entry.source)}
                        </small>
                      </div>
                      <div className="entry-score">
                        <strong>
                          {entry.score}
                          <small>/100</small>
                        </strong>
                        <Temperature value={entry.temperature} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Radio size={30} />
                  <h3>Aguardando a primeira participação</h3>
                  <p>Compartilhe o QR Code. Cada envio aparece aqui com sua classificação.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      <Modal
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
        title={
          confirmation === 'erase' ? 'Excluir dados da demonstração?' : 'Encerrar esta sessão?'
        }
        description={
          confirmation === 'erase'
            ? 'Todos os leads, fatores e históricos vinculados à sessão serão removidos permanentemente.'
            : 'O link público deixará de aceitar respostas. Os registros já recebidos permanecem no CRM.'
        }
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirmation(null)}>
            Cancelar
          </Button>
          <Button
            variant={confirmation === 'erase' ? 'destructive' : 'default'}
            disabled={busy}
            onClick={() => action(confirmation === 'erase' ? 'DELETE' : 'PATCH')}
          >
            {confirmation === 'erase' ? 'Excluir registros' : 'Encerrar sessão'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
