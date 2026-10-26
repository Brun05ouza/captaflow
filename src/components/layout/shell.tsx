'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Columns3,
  Radio,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Menu,
  Building2,
} from 'lucide-react';
import { Brand, Mark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { toast } from 'sonner';
const nav = [
  { path: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { path: 'leads', label: 'Meus Leads', icon: Users },
  { path: 'pipeline', label: 'Funil de Vendas', icon: Columns3 },
  { path: 'live', label: 'Captação ao Vivo', icon: Radio },
];
export function Shell({
  workspaceName,
  userName,
  children,
}: {
  workspaceName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const current =
    nav.find((n) => path.startsWith(`/app/${n.path}`))?.label ||
    (path === '/app/intelligence' ? 'Recursos futuros' : 'Configurações');
  async function logout() {
    setLeaving(true);
    try {
      const r = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!r.ok) throw new Error();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Não foi possível sair. Tente novamente.');
      setLeaving(false);
    }
  }
  const links = (
    <>
      <div className="workspace-chip">
        <Building2 size={18} />
        <span>
          <strong>{workspaceName}</strong>
          <small>Área comercial</small>
        </span>
      </div>
      <div className="nav-label">Seu negócio</div>
      <nav aria-label="Principal">
        {nav.map(({ path: p, label, icon: Icon }) => (
          <Link
            key={p}
            href={`/app/${p}`}
            aria-label={label}
            className={`nav-item ${path.startsWith(`/app/${p}`) ? 'active' : ''}`}
            aria-current={path.startsWith(`/app/${p}`) ? 'page' : undefined}
            onClick={() => setMobile(false)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="live-note">
          <Radio size={20} />
          <strong>Oportunidades, ao vivo.</strong>
          <p>Receba participações por QR Code durante uma demonstração.</p>
          <Link href="/app/live" onClick={() => setMobile(false)}>
            Abrir captação <ArrowUpRight size={14} />
          </Link>
        </div>
        <Link
          href="/app/settings"
          aria-label="Configurações"
          className={`nav-item ${path === '/app/settings' ? 'active' : ''}`}
          onClick={() => setMobile(false)}
        >
          <Settings size={18} />
          <span>Configurações</span>
        </Link>
        <div className="user-row">
          <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
          <span>
            <strong>{userName}</strong>
            <small>Administrador</small>
          </span>
          <button aria-label="Sair da conta" className="logout" disabled={leaving} onClick={logout}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </>
  );
  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''}`}>
      <a href="#main" className="skip-link">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          {collapsed ? <Mark /> : <Brand />}
          <button
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {links}
      </aside>
      <Modal open={mobile} onOpenChange={setMobile} title="Navegação" description={workspaceName}>
        <div className="mobile-nav">{links}</div>
      </Modal>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              onClick={() => setMobile(true)}
              aria-label="Abrir navegação"
            >
              <Menu size={20} />
            </Button>
            <span>Sua área</span>
            <ChevronRight size={14} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-right">
            <span className="rules-status">
              <span />
              Prioridade por regras
            </span>
            <span className="top-avatar">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>CaptaFlow · Capture oportunidades. Converta mais.</span>
          <span>Classificação transparente, por regras.</span>
        </footer>
      </div>
    </div>
  );
}
