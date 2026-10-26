'use client';
import { useState, useSyncExternalStore } from 'react';
import { ArrowRight, X } from 'lucide-react';
const subscribe = () => () => {};
export function HowItWorks({ workspaceId }: { workspaceId: string }) {
  const key = `captaflow:guide:${workspaceId}`;
  const stored = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) === 'dismissed';
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const hidden = dismissed ?? stored;
  return hidden ? (
    <button
      className="guide-restore"
      onClick={() => {
        try {
          localStorage.removeItem(key);
        } catch {}
        setDismissed(false);
      }}
    >
      Como funciona o CaptaFlow
    </button>
  ) : (
    <section className="how-it-works" aria-labelledby="guide-title">
      <div className="guide-heading">
        <h2 id="guide-title">Como funciona o CaptaFlow</h2>
        <button
          className="button button-ghost button-icon"
          aria-label="Dispensar explicação"
          onClick={() => {
            try {
              localStorage.setItem(key, 'dismissed');
            } catch {}
            setDismissed(true);
          }}
        >
          <X size={16} />
        </button>
      </div>
      <ol>
        {['Receber contato', 'Avaliar prioridade', 'Negociar', 'Fechar venda'].map((step, i) => (
          <li key={step}>
            <span>{step}</span>
            {i < 3 && <ArrowRight size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p>Cadastre seus contatos, entenda o que precisam e acompanhe cada conversa até a venda.</p>
    </section>
  );
}
