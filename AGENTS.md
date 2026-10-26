# Diretrizes do CaptaFlow

- Next.js App Router, TypeScript strict, Drizzle e PostgreSQL dedicado; Better Auth por email/senha.
- Toda leitura e escrita interna exige sessão e escopo de workspace no servidor. Não confiar em ids do cliente. Histórico, fatores e lead devem ser atômicos.
- Sem APIs, SDKs, chaves ou respostas simuladas de IA. Contrato futuro em src/features/intelligence e docs/ai-integration.md.
- Pontuação é determinística, explicável, identificada como classificação por regras e recalculada após edição.
- Leia DESIGN.md antes de UI. Use skills locais reais na etapa pertinente; não reinstale nem copie integralmente skills. Briefing e segurança prevalecem sobre recomendações estéticas.
- Nenhum dado fictício embutido no dashboard. Seed opcional explícito e idempotente. Nunca executar em produção automaticamente.
- Live usa polling 4s com página visível, consentimento, token aleatório, expiração, honeypot e limite persistente atômico.
- Não expor segredos, contatos em apresentação ou dados de outro workspace. Ações destrutivas exigem confirmação.
- Rode lint, typecheck, Vitest, build e testes e2e pertinentes. Registre limitações reais; não declare testes não executados como aprovados.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
