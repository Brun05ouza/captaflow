'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
export function SettingsForm({ name }: { name: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: f.get('name') }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          toast.success('Workspace atualizado.');
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Falha ao salvar.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="workspace-name">Nome do workspace</label>
        <input
          id="workspace-name"
          name="name"
          defaultValue={name}
          minLength={2}
          maxLength={100}
          required
        />
      </div>
      <Button disabled={busy}>Salvar alterações</Button>
    </form>
  );
}
