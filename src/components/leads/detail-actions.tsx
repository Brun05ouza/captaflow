'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import type { Lead } from '@/db/schema';
import { stages } from '@/features/leads/validation';
export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <select
      className="stage-select"
      aria-label="Alterar etapa comercial"
      value={stage}
      disabled={busy}
      onChange={async (e) => {
        setBusy(true);
        try {
          const r = await fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stage', stage: e.target.value }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          toast.success('Etapa atualizada.');
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Falha ao atualizar.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {Object.entries(stages).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
export function DetailActions({ lead }: { lead: Lead }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function run(remove: boolean) {
    setBusy(true);
    try {
      const r = await fetch(`/api/leads/${lead.id}`, {
        method: remove ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: remove ? undefined : JSON.stringify({ action: 'recalculate' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success(remove ? 'Lead excluído.' : 'Prioridade reavaliada.');
      if (remove) router.push('/app/leads');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha na operação.');
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }
  return (
    <>
      <Button variant="outline" disabled={busy} onClick={() => run(false)}>
        <RotateCw size={15} />
        Reavaliar prioridade
      </Button>
      <Button variant="ghost" onClick={() => setConfirm(true)} aria-label="Excluir lead">
        <Trash2 size={17} />
      </Button>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Excluir este lead?"
        description={`O cadastro de ${lead.name}, suas anotações e seu histórico serão removidos permanentemente.`}
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => run(true)}>
            Excluir lead
          </Button>
        </div>
      </Modal>
    </>
  );
}
export function NoteForm({ id }: { id: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="note-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch(`/api/leads/${id}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: text }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setText('');
          toast.success('Anotação adicionada.');
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Falha ao adicionar.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="note">Adicionar anotação</label>
      <textarea
        id="note"
        rows={3}
        value={text}
        minLength={2}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
        required
      />
      <Button variant="outline" disabled={busy}>
        Salvar anotação
      </Button>
    </form>
  );
}
