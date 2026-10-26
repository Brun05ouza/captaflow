# CaptaFlow

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Administrador comercial de um workspace. Participantes de uma apresentação podem responder voluntariamente ao formulário público da Live Experience.

## Product Purpose

CRM comercial em português para captar, qualificar por regras, contatar e converter leads. Proposta: “Capture oportunidades. Organize seus leads. Converta mais.”

## Operating Context

Aplicação web para desktop e mobile. O fluxo reúne visão geral, leads, funil de vendas, pontuação no perfil de cada lead, configurações e Captação ao Vivo. Live recebe respostas durante apresentações e oferece projeção sem contatos privados.

## Capabilities and Constraints

Next.js App Router, TypeScript strict, Drizzle, PostgreSQL dedicado e Better Auth por email/senha. Leituras e escritas internas exigem sessão e escopo de workspace no servidor. Histórico, fatores e lead devem permanecer atômicos.

Pontuação determinística, explicável e identificada como classificação por regras, com recálculo após edição. IA está em preparação: sem APIs, chaves, SDKs ou respostas simuladas; contrato futuro em `src/features/intelligence` e `docs/ai-integration.md`.

Live usa polling de quatro segundos com página visível, consentimento, token aleatório, expiração, honeypot e limite persistente atômico. Seed é opcional, explícito e idempotente; nunca executar automaticamente em produção. Ações destrutivas exigem confirmação. Sem billing ou equipes complexas no escopo atual.

## Brand Commitments

Nome CaptaFlow, português e símbolo vetorial de fluxo. Sidebar Deep escura, conteúdo claro, azul de ação e Geist são decisões explícitas do briefing. Identidade própria e acabamento preciso, preservando segurança e usabilidade.

## Evidence on Hand

Briefing original do usuário, `AGENTS.md`, `.impeccable/direction-contract.md`, componentes e estilos no repositório. Capturas em `artifacts/` documentam telas avaliadas no trabalho; não constituem testemunhos, prova de clientes ou autorização para dados fictícios no frontend. Não há comp aprovado.

## Product Principles

- Classificação transparente e explicável por regras.
- Isolamento de workspace e proteção de contatos privados.
- Captação voluntária conectada ao acompanhamento comercial.
- Funcionalidades e estados comunicados sem simular inteligência artificial.

## Accessibility & Inclusion

Interface responsiva, navegação por teclado, foco visível, labels persistentes e respeito a movimento reduzido. Prioridade comercial combina texto e cor; dados insuficientes não significam baixa prioridade. Etapa do pipeline pode ser alterada sem arrastar. O briefing exige contraste AA e apresentação sem exposição de contatos privados.
