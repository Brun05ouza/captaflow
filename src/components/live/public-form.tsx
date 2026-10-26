'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { publicLeadSchema, urgencies, budgets } from '@/features/leads/validation';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Temperature } from '@/components/leads/table';
type Result = {
  score: number;
  temperature: string;
  reason: string;
  factors: { factor: string; points: number; explanation: string }[];
};
export function PublicForm({ token, sessionName }: { token: string; sessionName: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const f = useForm<z.input<typeof publicLeadSchema>, unknown, z.output<typeof publicLeadSchema>>({
    resolver: zodResolver(publicLeadSchema),
    defaultValues: {
      name: '',
      interest: '',
      urgency: 'medium',
      budgetRange: 'unknown',
      notes: '',
      website: '',
    },
  });
  const errors = f.formState.errors;
  return (
    <div className="public-page">
      <header>
        <Brand />
        <span className="demo-label">Demonstração ao vivo</span>
      </header>
      <main className="public-form-wrap">
        {result ? (
          <section className="public-result" aria-live="polite">
            <span className="success-mark">
              <Check size={30} />
            </span>
            <h1>Seu interesse já virou uma oportunidade.</h1>
            <p>
              Recebemos sua participação em {sessionName}. Sua classificação já está no painel da
              apresentação.
            </p>
            <div className="public-score">
              <span>Prioridade comercial · estimativa por regras</span>
              <div className="large-score">
                {result.score}
                <span>/100</span>
              </div>
              <Temperature value={result.temperature} />
            </div>
            <p>{result.reason}</p>
            <h2>O que contribuiu para a pontuação</h2>
            {result.factors.map((factor) => (
              <div className="factor-row" key={factor.factor}>
                <div>
                  <strong>{factor.factor}</strong>
                  <small>{factor.explanation}</small>
                </div>
                <span>+{factor.points}</span>
              </div>
            ))}
            <p className="muted">
              Este resultado é uma estimativa por regras comerciais, sem análise de IA ou garantia
              de conversão. Nenhum contato privado foi solicitado.
            </p>
          </section>
        ) : (
          <>
            <div className="public-title">
              <h1>Descubra como seu interesse se transforma em uma oportunidade.</h1>
              <p>
                Este é um formulário de demonstração. Responda algumas perguntas e veja seu contato
                aparecer na apresentação. Não é uma solicitação comercial.
              </p>
            </div>
            <form
              onSubmit={f.handleSubmit(async (input) => {
                setError('');
                try {
                  const r = await fetch(`/api/demo/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                  });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error);
                  setResult(d);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : 'Não foi possível enviar. Tente novamente.',
                  );
                }
              })}
              noValidate
              className="public-form panel"
            >
              <div className="field">
                <label htmlFor="nickname">Como podemos chamar você?</label>
                <input
                  id="nickname"
                  placeholder="Primeiro nome ou apelido"
                  autoComplete="off"
                  {...f.register('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'public-name-error' : undefined}
                />
                {errors.name && (
                  <small id="public-name-error" className="field-error" role="alert">
                    {errors.name.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="service">Qual serviço você procura?</label>
                <input
                  id="service"
                  placeholder="Ex.: um novo site para minha empresa"
                  {...f.register('interest')}
                  aria-invalid={!!errors.interest}
                  aria-describedby={errors.interest ? 'public-interest-error' : undefined}
                />
                {errors.interest && (
                  <small id="public-interest-error" className="field-error" role="alert">
                    {errors.interest.message}
                  </small>
                )}
              </div>
              <div className="field">
                <label htmlFor="urgency">Qual seu nível de urgência?</label>
                <select id="urgency" {...f.register('urgency')}>
                  {Object.entries(urgencies).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="budget">Qual faixa de investimento considera?</label>
                <select id="budget" {...f.register('budgetRange')}>
                  {Object.entries(budgets).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <small>
                  Opcional. Valores maiores não recebem mais pontos. Sem uma necessidade descrita, a
                  faixa não aumenta a pontuação.
                </small>
              </div>
              <div className="field">
                <label htmlFor="problem">Qual problema deseja resolver?</label>
                <textarea
                  id="problem"
                  placeholder="Conte brevemente o que precisa melhorar…"
                  rows={3}
                  {...f.register('notes')}
                  aria-invalid={!!errors.notes}
                  aria-describedby={errors.notes ? 'public-notes-error' : undefined}
                />
                {errors.notes && (
                  <small id="public-notes-error" className="field-error" role="alert">
                    {errors.notes.message}
                  </small>
                )}
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" tabIndex={-1} autoComplete="off" {...f.register('website')} />
              </div>
              <label className="consent">
                <input
                  type="checkbox"
                  {...f.register('consent')}
                  aria-describedby={errors.consent ? 'consent-error' : undefined}
                />
                <span>
                  Concordo com o uso das respostas nesta demonstração. Meu apelido, interesse e
                  classificação poderão aparecer na apresentação e no CRM. Não informe dados
                  sensíveis. O administrador pode excluir os registros ao final.
                </span>
              </label>
              {errors.consent && (
                <small id="consent-error" className="field-error" role="alert">
                  {errors.consent.message}
                </small>
              )}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <Button disabled={f.formState.isSubmitting}>
                {f.formState.isSubmitting ? (
                  <Loader2 size={17} className="spin" />
                ) : (
                  <>
                    Ver minha classificação
                    <ArrowRight size={17} />
                  </>
                )}
              </Button>
              <small className="public-privacy">
                <ShieldCheck size={15} />
                Sem e-mail ou telefone. Apenas uma demonstração.
              </small>
            </form>
          </>
        )}
        <footer>CaptaFlow · {sessionName}</footer>
      </main>
    </div>
  );
}
