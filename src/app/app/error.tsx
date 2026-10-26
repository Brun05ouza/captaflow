'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>Não foi possível carregar o workspace</h1>
      <p>Confira a conexão e tente novamente. Se persistir, verifique a configuração do banco.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
