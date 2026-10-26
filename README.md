# CaptaFlow

CRM de captação e gestão comercial com autenticação real, PostgreSQL no Neon, pipeline, histórico, classificação determinística e demonstrações participativas por QR Code.

**Capture oportunidades. Organize seus leads. Converta mais.**

## Stack

Next.js App Router, React, TypeScript strict, Tailwind CSS 4, componentes shadcn/ui com Radix, Lucide, Recharts, React Hook Form, Zod e Sonner. Backend em Route Handlers, Drizzle ORM, PostgreSQL via `pg` (conexão pooled Neon) e Better Auth. Vitest, Playwright e axe-core para validação. Não há SDK, chave ou API de IA.

## Instalação e primeiro acesso

Requer Node.js 22+ e um projeto Neon exclusivo. Não reutilize credenciais de outros sistemas.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Preencha `.env.local` com `DATABASE_URL` pooled do Neon, `BETTER_AUTH_SECRET` e `RATE_LIMIT_SECRET` aleatórios com pelo menos 32 caracteres. Nunca versione este arquivo. Use `sslmode=verify-full` na conexão. Configure as duas URLs para o endereço público do aplicativo ou `http://localhost:3000` localmente.

Neste ambiente, o projeto Neon **CaptaFlow** (`nameless-dream-74425829`) já foi criado e as migrations aplicadas. O ambiente local usa a branch isolada **development** (`br-nameless-star-b5a3kgrm`); a branch principal permanece sem dados de teste. A conexão e os segredos locais estão configurados. `BOOTSTRAP_EMAIL` está definido para o e-mail escolhido pelo proprietário.

```powershell
npm run db:migrate
npm run bootstrap -- --email seu@email.com --name "Seu nome" --workspace "Minha empresa"
npm run dev
```

O bootstrap solicita a senha **sem ecoar os caracteres**, exige 12 a 128 caracteres e cria atomicamente usuário, credencial Better Auth, workspace e vínculo de administrador. Um advisory lock impede duas contas iniciais concorrentes; depois da primeira conta, o bootstrap é fechado. Com `BOOTSTRAP_EMAIL` já preenchido, basta `npm run bootstrap`. Em CI, use `BOOTSTRAP_PASSWORD` via ambiente seguro, nunca argumentos ou commit. Não envie a senha pelo chat.

Abra [o login local](http://localhost:3000/login). O cadastro público de administradores é desativado. Logout revoga a sessão; cookies HttpOnly e seguros em produção, sessões persistidas no banco. Reset de senha por e-mail e convites estão fora do MVP; não há controles que prometam esses fluxos.

## Banco, migrations e isolamento

```powershell
npm run db:generate
npm run db:migrate
```

Schema em `src/db/schema.ts`, migrations SQL e snapshots em `drizzle/`. Não use `drizzle-kit push` em produção. As tabelas Better Auth correspondem à versão instalada; timestamps UTC, UUIDs, índices, FKs e exclusões em cascata. O servidor obtém o workspace pela sessão, nunca pelo corpo enviado pelo cliente. Leads, fatores e eventos são gravados em transações. Não há acesso direto ao banco no navegador.

Para desenvolvimento e testes, use uma branch Neon isolada; migre e teste antes de promover alterações à principal. A conexão local já aponta para development. Para produção, obtenha a conexão da branch principal do mesmo projeto exclusivo, aplique as migrations e faça bootstrap naquela branch.

## Dados de demonstração

```powershell
npm run seed
# Ou selecione explicitamente um workspace de desenvolvimento:
npm run seed -- --workspace UUID_DO_WORKSPACE
```

O seed exige um workspace existente, procura o administrador por `BOOTSTRAP_EMAIL` ou pelo UUID explicitamente fornecido e processa 30 registros fictícios. O índice `(workspace_id, campaign)` e a transação tornam a execução idempotente. Prioridades vêm do motor de regras; inclui perfis incompletos, prioridades distintas e dados insuficientes. Todos são rotulados como demonstração. Não executa durante deploy e bloqueia `NODE_ENV=production`.

## Funcionamento

- **Visão geral:** período de 7, 30 ou 90 dias, captação, origem, prioridade comercial, etapas e contatos recentes. Leituras e agregações no Neon; sem totais inventados. Conversão = leads ganhos ÷ leads cadastrados no período, incluindo registros demonstrativos explicitamente contabilizados. Períodos usam dias de calendário de São Paulo e incluem o dia atual.
- **Meus Leads:** cadastro com pelo menos e-mail ou telefone válido, edição, filtros, busca, ordenação e paginação de 12 registros no servidor. Perfil detalhado, anotações, histórico, mudança de etapa, recálculo e exclusão confirmada. Registros Live podem continuar sem contato ao editar. WhatsApp abre somente por ação explícita; não envia mensagens.
- **Funil de Vendas:** Novo, Qualificado, Em negociação, Ganho e Perdido. Menu nativo de etapa em cada card, acessível por teclado e toque, com persistência e histórico. Até 500 oportunidades recentes; use filtros na lista para volumes maiores. Drag-and-drop foi dispensado em favor da alternativa acessível e estável autorizada no briefing.
- **Pontuação do Lead:** no perfil de cada lead, com fatores, explicação e próxima ação. Regras conservadoras v2: prazo até 45, serviço 20, contexto 25 e faixa de investimento 10. Alta a partir de 80; Média 60–79; Baixa até 59, somente com contexto suficiente. Campos genéricos ou sem descrição da necessidade ficam como **Dados insuficientes**. Nome, contato e empresa não dão pontos. Consulte `docs/priority-rules.md` para regras, limites e atualização preservando dados.
- **IA:** fora da navegação principal; estrutura técnica e página de preparação, sem execução fictícia ou controles inativos de análise. Contrato documentado em `docs/ai-integration.md`.

## Apresentação ao vivo

1. Faça login e abra **Captação ao Vivo**.
2. Dê um nome e inicie a apresentação. A sessão recebe token criptográfico de 256 bits e validade de 4 horas.
3. Compartilhe o QR Code ou copie a URL. No modo apresentação, são exibidos somente apelido, interesse, urgência, pontuação, prioridade, etapa e origem demonstrativa.
4. O público responde ao formulário `/demo/[token]` e consente com o uso na demonstração. E-mail e telefone não são solicitados. O envio cria um lead de demonstração real e seus fatores no Neon.
5. O painel atualiza a cada 4 segundos enquanto a aba está visível. Novas entradas são destacadas temporariamente. Cada resposta aceita gera um lead; o contador de participantes conta participações aceitas, sem rastreamento individual.
6. Encerre a sessão para bloquear novos envios. O histórico permite escolher até as 50 sessões mais recentes. Após encerrar/expirar, exclua os registros da sessão com confirmação.

Encerramento e submissão compartilham lock transacional: um envio não ultrapassa uma sessão já encerrada. Tokens inválidos, sessões encerradas e expiradas não aceitam dados. A projeção Live é restrita no próprio servidor e nunca inclui contatos ou observações.

**Para usar um celular**, a URL precisa estar acessível ao público. `localhost` no QR Code só serve para teste no computador. Publique em HTTPS (Vercel) e configure `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` com a mesma origem pública. Para teste em LAN, configure ambas com `http://IP_DO_COMPUTADOR:3000` e reinicie; a origem é validada estritamente. Esse modo é local, sem cookies Secure. O app não foi publicado automaticamente.

## Segurança e privacidade

Validação Zod também no servidor, origem estrita em mutações, autorização por workspace e respostas seguras de erro. O endpoint público limita conteúdo a 16 mil caracteres, usa honeypot e consentimento obrigatório. Rate limiting persistente por HMAC do IP, escopo global (20/minuto) e sessão (5/minuto), usando `INSERT ON CONFLICT` atômico no PostgreSQL. Em Vercel, usa apenas `x-vercel-forwarded-for` sobrescrito pela plataforma; em execução local, todos compartilham a chave local. Não registra IP em texto puro. Registros expirados são eliminados em lotes; entradas antigas inativas saem nos próximos envios.

Redes com IP compartilhado também compartilham o limite: ajuste os valores em `src/app/api/demo/[token]/route.ts` após avaliar o tamanho da apresentação. Em outro host de produção, configure um cabeçalho de IP autenticado pelo proxy antes de alterar o mecanismo. O MVP não inclui CAPTCHA, deduplicação de participantes, reset por e-mail, billing ou equipes. Não colete informações sensíveis no texto livre. Exclua demonstrações quando não forem mais necessárias.

## Comandos e testes

```powershell
npm run dev
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

Vitest inclui motor, limites de temperatura e validação; os testes de integração PostgreSQL rodam quando `DATABASE_URL` está configurada e criam/excluem workspaces próprios. Não execute testes contra produção. Playwright cria uma conta e workspaces temporários, testa login/CRUD/isolamento/Live/expiração/logout no Neon e remove as fixtures em `afterAll`. Não precisa da senha do administrador. Capturas em `artifacts/`, traces de falhas em `test-results/` (ignorados). Axe verifica o dashboard; emulação responsiva não substitui teste de hardware em iPhone/Android.

## Deploy na Vercel

Importe o repositório como Next.js. Cadastre `DATABASE_URL` da branch de produção, `BETTER_AUTH_SECRET`, `RATE_LIMIT_SECRET`, `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` nos ambientes correspondentes; gere segredos distintos dos locais. Use pooled Neon, não exponha `DATABASE_URL` com prefixo `NEXT_PUBLIC_`. Aplique migrations em etapa controlada antes do deploy e faça o bootstrap uma vez com conexão de produção em ambiente seguro. Nunca coloque senhas em argumentos de build. Build: `npm run build`; Next.js e Route Handlers usam Node.js.

## Documentação

`DESIGN.md`: identidade e tokens. `AGENTS.md`: regras estáveis. `docs/ai-integration.md`: contrato futuro. `docs/verification.md`: verificações executadas e limites reais da entrega.
