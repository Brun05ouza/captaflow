import Link from 'next/link';
import { Brand } from '@/components/brand';
export default function NotFound() {
  return (
    <main className="public-unavailable">
      <Brand />
      <h1>Essa oportunidade não foi encontrada.</h1>
      <p>O link pode ter expirado ou o registro pode ter sido removido.</p>
      <Link className="button button-primary" href="/app/dashboard">
        Voltar ao workspace
      </Link>
    </main>
  );
}
