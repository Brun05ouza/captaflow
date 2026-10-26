import {
  FileText,
  ScanSearch,
  MessagesSquare,
  ListFilter,
  ArrowRight,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
export default function Intelligence() {
  return (
    <>
      <PageHeader
        title="Inteligência Artificial"
        description="Mais contexto para suas decisões comerciais."
      />
      <section className="intelligence-panel">
        <div className="intelligence-heading">
          <Workflow size={44} strokeWidth={1.25} />
          <h2>A próxima camada de contexto.</h2>
          <p>
            O CaptaFlow já organiza e prioriza seus leads. Em breve, análises inteligentes e
            recomendações personalizadas estarão disponíveis.
          </p>
          <span className="preparation-badge">Integração em preparação</span>
        </div>
        <div className="intelligence-features">
          {[
            {
              icon: FileText,
              title: 'Resumos comerciais',
              text: 'Uma visão objetiva do contexto de cada oportunidade.',
            },
            {
              icon: ScanSearch,
              title: 'Identificação de interesses',
              text: 'Mais clareza sobre necessidades e intenções.',
            },
            {
              icon: MessagesSquare,
              title: 'Sugestões de abordagem',
              text: 'Recomendações personalizadas e apoio à conversa comercial.',
            },
            {
              icon: ListFilter,
              title: 'Priorização enriquecida',
              text: 'Contexto adicional para complementar as regras comerciais.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={22} strokeWidth={1.5} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <small>Planejado</small>
            </article>
          ))}
        </div>
        <div className="intelligence-footer">
          <p>Enquanto isso, seu motor de regras já está em ação.</p>
          <Button asChild variant="outline">
            <Link href="/app/leads">
              Consultar a pontuação nos leads
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
