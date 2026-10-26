---
name: CaptaFlow
description: Workspace comercial para captar, classificar por regras e agir.
colors:
  primary: '#2563ff'
  primary-hover: '#174ed5'
  primary-foreground: '#fff'
  accent: '#7775ff'
  deep: '#0b1020'
  background: '#f8faff'
  surface: '#fff'
  border: '#e5eaf2'
  foreground: '#192238'
  muted-foreground: '#667085'
  muted: '#f1f4f9'
  success: '#126d34'
  warning: '#a86505'
  danger: '#c52424'
  temperature-hot: '#d85a3b'
  temperature-warm: '#d19a25'
  temperature-cold: '#5c86b5'
  chart-muted: '#a7b9df'
  chart-light: '#ccd7ed'
  sidebar-muted: '#a0acc2'
  sidebar-border: '#263047'
  sidebar-active: '#202b41'
  hot-bg: '#fff0e9'
  warm-bg: '#fff7e2'
  cold-bg: '#edf4fd'
typography:
  display:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(32px, 3.4vw, 50px)'
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: '-0.035em'
  headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: '28px'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Geist, sans-serif'
    fontSize: '17px'
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'Geist, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Geist, sans-serif'
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1.5
rounded:
  badge: '4px'
  field: '6px'
  button: '7px'
  note: '8px'
  panel: '12px'
  dialog: '14px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  2xl: '24px'
  3xl: '32px'
  4xl: '48px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.button}'
    padding: '9px 15px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-outline:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.button}'
    padding: '9px 15px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.muted-foreground}'
    rounded: '{rounded.button}'
    padding: '9px 15px'
  button-danger:
    backgroundColor: '{colors.danger}'
    textColor: '{colors.surface}'
    rounded: '{rounded.button}'
    padding: '9px 15px'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.field}'
    padding: '9px 12px'
  panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
  navigation-active:
    backgroundColor: '{colors.sidebar-active}'
    textColor: '{colors.surface}'
    rounded: '{rounded.field}'
    padding: '9px 10px'
---

# Design System: CaptaFlow

## Overview

A revisão de usabilidade preserva a identidade e organiza a navegação em Visão Geral, Meus Leads, Funil de Vendas, Captação ao Vivo e Configurações. Pontuação do Lead é parte do perfil, com detalhes progressivos em um `<details>` nativo; não é um destino separado. IA fica fora da navegação principal, com arquitetura futura preservada.

“Prioridade comercial” substitui temperatura: Alta, Média, Baixa e Dados insuficientes. O último estado usa superfície/texto neutros, nunca a aparência de uma prioridade baixa. A pontuação parcial é identificada como tal. O guia dispensável do dashboard mostra o processo comercial; não tem animação de entrada nem atrasa as ações. A preferência é local ao navegador, por workspace, sem uso na autenticação.

Estados vazios oferecem cadastro no primeiro uso e limpeza de filtros quando a busca não encontra resultados. Mobile inclui orientação de scroll da tabela para acessar prioridade, etapa e origem. A Captação ao Vivo explica a participação demonstrativa por QR Code e não promete integrações comerciais inexistentes. Regras e preservação de avaliações: `docs/priority-rules.md`.

**Creative North Star: "Fluxo comercial"**

O CaptaFlow reúne captação, classificação explicável e ação comercial. A identidade é o símbolo vetorial de trajetórias que convergem em uma seta, com a palavra captaflow. A interface de operação usa sidebar Deep, folha clara e azul para ação e dados. Geist mantém continuidade entre navegação, formulários e leitura numérica.

Este registro deriva de `src/app/globals.css` e dos componentes atuais. A direção é Operate, code-led, conforme `.impeccable/direction-contract.md`; não há comp aprovado. O briefing e as decisões explícitas do usuário prevalecem sobre recomendações estéticas. A área de IA comunica preparação, sem análises ou respostas simuladas.

**Key Characteristics:**

- Sidebar escura e conteúdo claro, com superfícies planas delimitadas por bordas.
- Símbolo próprio de fluxo e azul como acento operacional.
- Densidade de CRM, números tabulares e prioridade comercial acompanhada de texto.
- Feedback breve, foco visível e navegação alternativa ao arrastar.

## Colors

A paleta combina azul de ação, Deep estrutural e neutros frios. O frontmatter é normativo e corresponde às variáveis de `globals.css`.

### Primary

- **Azul CaptaFlow:** ações principais, seleção, dados de captação e foco; o tom hover escurece o botão em ponteiro fino.

### Secondary

- **Violeta de marca:** símbolo e ponto da marca sobre sidebar e painel de autenticação; apoio visual do convite Live.

### Neutral

- **Deep:** fundo estrutural da navegação e da narrativa de autenticação.
- **Folha fria / Superfície:** canvas da aplicação e painéis brancos.
- **Texto / Texto secundário:** hierarquia de informação e descrições.
- **Borda / Neutro suave:** separação de superfícies, campos e estados secundários.
- **Neutros da sidebar:** texto secundário, divisórias e seleção sobre Deep.
- **Neutros de gráfico:** séries auxiliares e elementos discretos de visualização.

Sucesso, atenção e perigo são semânticos. Prioridade comercial tem cores de gráfico próprias, fundos suaves e rótulos escritos. Textos de badges usam tons mais escuros que as séries: quente (`#a33d23`), morno (`#895d00`) e frio (`#3e628c`).

**The Estado Legível Rule.** Cor acompanha texto ou outra indicação identificável; prioridade e etapa não dependem apenas da cor.

## Typography

**Display Font:** Geist, sans-serif. **Body Font:** Geist, sans-serif. A fonte é carregada por `next/font/google`; não há família mono separada na interface.

O desenho é compacto e semibold nos títulos. O corpo habilita `cv02` e `cv03`; indicadores, contagens e scores usam números tabulares onde definidos no CSS.

### Hierarchy

- **Display:** narrativa desktop de autenticação com tamanho fluido; substituições responsivas estão no CSS.
- **Headline:** título de página; no shell mobile passa a (27px), e a (25px) abaixo de (360px).
- **Title:** seções gerais; cabeçalhos de painéis do dashboard usam (14px) e tracking (-0.015em).
- **Body:** texto da interface; descrições específicas variam entre (12px) e (15px).
- **Label:** labels persistentes; navegação usa (12px) e legendas auxiliares frequentemente (11px).
- **Indicador:** KPI do dashboard usa (30px), peso (600), tracking (-1.2px) e números tabulares.

**The Uma Voz Rule.** Preserve Geist e a hierarquia existente entre ação, título e dado; a marca distingue pesos dentro da mesma palavra.

## Layout

Shell desktop em grid: sidebar (232px), conteúdo fluido, topbar (65px) e margem principal (32px). Até (1200px), sidebar (218px) e margem principal (26px 24px). Navegação recolhida usa (72px). Acima de (1600px), margem principal (36px 44px).

O dashboard combina quatro KPIs e duas colunas de painéis (1.8fr / 1fr); até (1200px), (1.5fr / 1fr). As substituições finais do dashboard desktop usam gaps de (20px), painéis compactos e gráficos com altura (155px). Essas medidas são locais à visão geral.

Até (950px), KPIs passam a duas colunas e gráficos a uma. Até (1023px), a sidebar dá lugar a navegação em modal claro; a topbar fica sticky, conteúdo usa (25px 20px 32px) e considera safe areas. Formulários passam a uma coluna, ações quebram linha e filtros se reorganizam. Tabelas mantêm scroll horizontal local. O pipeline usa colunas roláveis de (240px) em mobile, preservando alteração de etapa por select.

O ritmo usa os passos do frontmatter, com espaçamentos locais. Campos de modal, configurações, autenticação e entrada Live usam fonte (16px) em mobile. Botões de ação, ícones e filtros recebem alvos de (44px) onde há regras responsivas explícitas; não presumir que todos os controles do projeto tenham esse tamanho.

## Elevation & Depth

Painéis, KPIs e listas repousam planos: fundo, borda e contraste tonal estabelecem agrupamento. O modal tem overlay Deep translúcido e sombra (`0 20px 80px rgb(11 16 32 / 0.2)`). O foco usa outline azul (2px), afastado (3px).

**The Plano na Operação Rule.** Use borda e superfície para containers comuns; reserve a sombra existente para o diálogo elevado.

## Shapes

Painéis usam cantos moderados, campos e navegação cantos menores e badges cantos discretos, segundo o frontmatter. Avatares e pontos de estado são circulares. O símbolo mantém trajetórias e seta com extremidades arredondadas; não substituí-lo por um ícone genérico.

## Components

### Buttons

Botões compactos com ícone opcional, gap (8px), peso (500), texto (13px), altura mínima desktop (40px) e variante pequena (34px). Primário azul; outline branco com borda; ghost transparente com texto secundário; perigo vermelho. Hover do primário escurece e outline/ghost recebe fundo neutro suave, apenas com hover e ponteiro fino. Press reduz opacidade a (0.8); disabled usa (0.55) e cursor de espera. Foco segue o outline global. Transições de cor e fundo duram (160ms).

### Chips

Temperatura reúne ponto e texto, padding (3px 7px), fonte (11px), peso (500) e fundo semântico suave. Etapas têm texto e círculo vazado. O badge de preparação de IA é violeta suave, separado abaixo da descrição por margem superior (22px); comunica standby.

### Cards / Containers

Painéis brancos com borda de (1px), sem sombra e overflow contido. Cabeçalhos e conteúdos determinam o padding: não há padding universal no container. KPIs são containers de leitura numérica, sem blocos coloridos em volta de ícones. Estados vazios orientam o próximo passo com texto e ação contextual.

### Inputs / Fields

Campos brancos com borda, padding (9px 12px), altura mínima (40px), labels persistentes e ajuda adjacente. `aria-invalid` muda a borda para perigo; mensagem próxima explica o erro. Textareas redimensionam verticalmente. Foco usa o anel global. A busca compõe ícone e input dentro de uma única borda.

### Navigation

Sidebar Deep com item de altura mínima (43px), ícone (18px), texto secundário e seleção em superfície escura distinta. Ativo usa texto branco e ícone azul claro. A marca alterna para símbolo quando recolhida. Em mobile, o modal de navegação usa superfície clara e estados neutros.

### Dialog

Radix Dialog controla título, descrição, fechamento e foco. Conteúdo centralizado, largura (`calc(100% - 32px)`), máximo (620px), altura máxima (90dvh) e scroll interno; overlay e conteúdo entram com fade de (180ms) e curva (`cubic-bezier(0.16, 1, 0.3, 1)`).

### Live e dados comerciais

Novas entradas Live usam chegada de (220ms), opacity e deslocamento vertical (4px), além de realce de fundo. Movimento é feedback, sem cascata de entrada. `prefers-reduced-motion` desliga animações e transições. Tabelas alinham identidade à esquerda e dados numéricos à direita; gráficos usam rótulos e legendas. Projeção Live separa apresentação e contatos privados. Nenhum dado de exemplo deve ser embutido no dashboard.

## Do's and Don'ts

### Do:

- **Do** preservar sidebar Deep, fundo claro, Geist e símbolo próprio de fluxo.
- **Do** aplicar azul a ações e dados e acompanhar estados semânticos com texto.
- **Do** manter foco visível, labels persistentes, scroll local de tabelas e redução de movimento.
- **Do** identificar a classificação por regras e a IA em preparação com linguagem verdadeira.

### Don't:

- **Don't** introduzir gradientes decorativos, ícones em quadrados coloridos ou crescimento sem base.
- **Don't** embutir números fictícios no dashboard ou publicar contatos no modo de apresentação.
- **Don't** simular respostas de IA ou apresentar a área standby como análise ativa.
- **Don't** promover ajustes locais de densidade do dashboard a regras globais.
