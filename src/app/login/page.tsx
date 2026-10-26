'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Eye, EyeOff, ArrowUpRight, Check } from 'lucide-react';
import { Brand, Mark } from '@/components/brand';
import { Button } from '@/components/ui/button';
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-story-main">
          <h2>Oportunidades em movimento.</h2>
          <p>
            Capture, organize e avance. Seu workspace comercial, do primeiro interesse à próxima
            conquista.
          </p>
          <div className="flow-visual" aria-hidden="true">
            <div className="flow-node">Interesse</div>
            <div className="flow-line" />
            <div className="flow-center">
              <Mark size={44} />
            </div>
            <div className="flow-line" />
            <div className="flow-node">
              Oportunidade
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="login-benefits">
            <span>
              <Check size={16} />
              Todas as oportunidades em um lugar
            </span>
            <span>
              <Check size={16} />
              Prioridades com critérios transparentes
            </span>
            <span>
              <Check size={16} />
              Captação ao vivo, conectada ao seu CRM
            </span>
          </div>
        </div>
        <div className="login-story-footer">
          Um fluxo mais inteligente para suas vendas.
          <span>CaptaFlow © {new Date().getFullYear()}</span>
        </div>
      </section>
      <main className="login-form-side">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form-wrap">
          <span className="login-symbol">
            <Mark size={36} />
          </span>
          <h1>Seu próximo movimento.</h1>
          <p>Entre para acompanhar suas oportunidades.</p>
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                const r = await fetch('/api/auth/sign-in/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
                });
                if (!r.ok) {
                  setError(
                    r.status === 429
                      ? 'Muitas tentativas. Aguarde um minuto.'
                      : 'E-mail ou senha incorretos. Confira seus dados.',
                  );
                  return;
                }
                router.replace('/app/dashboard');
                router.refresh();
              } catch {
                setError('Não foi possível conectar. Tente novamente.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="voce@empresa.com"
                required
                autoCapitalize="none"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="password-input">
                <input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <Button disabled={busy} className="login-submit">
              {busy ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <>
                  Entrar no workspace
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>
          <div className="login-support">
            Acesso exclusivo ao seu workspace.
            <br />
            Precisa de acesso? Fale com o administrador.
          </div>
        </div>
        <div className="login-bottom">Capture oportunidades. Converta mais.</div>
      </main>
    </div>
  );
}
