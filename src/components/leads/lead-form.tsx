'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sourceLabel } from '@/lib/utils';
import {
  leadSchema,
  demoEditSchema,
  urgencies,
  budgets,
  sources,
} from '@/features/leads/validation';
import type { Lead } from '@/db/schema';
export function LeadForm({ lead, triggerLabel }: { lead?: Lead; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<z.input<typeof leadSchema>, unknown, z.output<typeof leadSchema>>({
    resolver: zodResolver(lead?.isDemo ? demoEditSchema : leadSchema),
    defaultValues: lead
      ? {
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company || '',
          segment: lead.segment || '',
          interest: lead.interest,
          urgency: lead.urgency as 'low',
          budgetRange: lead.budgetRange as 'unknown',
          source: lead.source as (typeof sources)[number],
          notes: lead.notes || '',
        }
      : {
          name: '',
          email: '',
          phone: '',
          company: '',
          segment: '',
          interest: '',
          urgency: 'medium',
          budgetRange: 'unknown',
          source: 'Manual',
          notes: '',
        },
  });
  async function submit(input: z.output<typeof leadSchema>) {
    try {
      const r = await fetch(lead ? `/api/leads/${lead.id}` : '/api/leads', {
        method: lead ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      toast.success(
        lead
          ? 'Lead atualizado. Prioridade reavaliada.'
          : 'Contato cadastrado. Veja os próximos passos no perfil.',
      );
      setOpen(false);
      if (!lead) form.reset();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  }
  const field = (
    name: keyof z.input<typeof leadSchema>,
    label: string,
    type = 'text',
    placeholder = '',
  ) => (
    <div className="field" key={name}>
      <label htmlFor={`lead-${name}`}>{label}</label>
      <input
        id={`lead-${name}`}
        type={type}
        placeholder={placeholder}
        {...form.register(name)}
        aria-invalid={!!form.formState.errors[name]}
        aria-describedby={form.formState.errors[name] ? `${name}-error` : undefined}
      />
      {form.formState.errors[name] && (
        <small id={`${name}-error`} className="field-error">
          {form.formState.errors[name]?.message}
        </small>
      )}
    </div>
  );
  return (
    <>
      <Button variant={lead ? 'outline' : 'default'} onClick={() => setOpen(true)}>
        {lead ? <Pencil size={16} /> : <Plus size={17} />}{' '}
        {lead ? 'Editar lead' : triggerLabel || 'Novo lead'}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={lead ? 'Editar lead' : 'Uma nova oportunidade'}
        description="Registre o contato e conte o que ele precisa. Acompanhe a conversa pelo funil de vendas."
      >
        <form onSubmit={form.handleSubmit(submit)} className="form-grid" noValidate>
          {field('name', 'Nome *')}
          {field('company', 'Empresa')}
          {field('email', 'E-mail', 'email', 'nome@empresa.com')}
          {field('phone', 'WhatsApp com DDD', 'tel', '+55 11 99999-9999')}
          {field('segment', 'Segmento')}
          {field('interest', 'Serviço de interesse *')}
          <div className="field">
            <label htmlFor="lead-urgency">Urgência</label>
            <select id="lead-urgency" {...form.register('urgency')}>
              {Object.entries(urgencies).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="lead-budget">Faixa de investimento</label>
            <select id="lead-budget" {...form.register('budgetRange')}>
              {Object.entries(budgets).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="lead-source">Origem</label>
            <select id="lead-source" {...form.register('source')}>
              {[...sources, ...(lead?.source === 'Live Experience' ? ['Live Experience'] : [])].map(
                (v) => (
                  <option key={v} value={v}>
                    {sourceLabel(v)}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="field span-full">
            <label htmlFor="lead-notes">Problema ou objetivo do contato</label>
            <textarea
              id="lead-notes"
              rows={3}
              placeholder="Ex.: recebe pedidos por mensagens e precisa organizar o atendimento."
              {...form.register('notes')}
            />
            <small>
              Opcional. Detalhes sobre a necessidade ajudam na avaliação. Sem eles, mostramos “Dados
              insuficientes”.
            </small>
          </div>
          <div className="form-footer span-full">
            <small>
              {lead?.isDemo
                ? 'Demonstração: e-mail e WhatsApp continuam opcionais.'
                : 'Informe pelo menos um contato válido: e-mail ou WhatsApp.'}
            </small>
            <Button disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 size={16} className="spin" />}Salvar lead
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
