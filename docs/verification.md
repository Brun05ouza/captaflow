# Verificação da entrega

## Revisão de simplificação da experiência — 25/10/2026

- 37 testes Vitest passaram: regras v2, conteúdo genérico/repetitivo, contato com poucos dados, orçamento sem viés de valor, estados de prioridade, validação, isolamento e persistência no Neon.
- Os dois testes Playwright passaram. O fluxo CRM cobre a navegação reduzida, dispensar/restaurar o guia (inclusive após recarregar), explicação no perfil, edição e nova prioridade na própria tela, “Dados insuficientes” em mobile, mudança de etapa, captação/QR/polling, encerramento e logout. O teste separado de login permanece aprovado. Capturas desktop/mobile foram atualizadas e inspecionadas; axe continuou sem violações detectadas nas telas cobertas.
- Schema, autenticação e autorização por workspace não foram alterados. Nenhuma API de IA, integração comercial ou novo módulo foi adicionado.
- A única avaliação prévia existente foi atualizada para v2. Verificação antes/depois confirmou a mesma quantidade de leads e igualdade dos campos originais. Os fatores anteriores foram mantidos e o histórico registra a avaliação anterior.
- Fatores agora são lotes imutáveis por avaliação; o perfil lê o lote associado ao `scored_at` atual. Testes verificam que a edição mantém os fatores anteriores e não os mistura à soma da pontuação atual.
- As seções abaixo mantêm o registro histórico da entrega inicial. As regras atuais estão em `docs/priority-rules.md`.

Verificações executadas em 25/10/2026, no Windows/Node 24, com banco **CaptaFlow** exclusivo no Neon e branch local **development**. Não há publicação de produção nesta entrega.

## Resultados

| Verificação              | Resultado                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migrations Drizzle       | Aplicadas no Neon; 13 tabelas, duas migrations versionadas                                                                                          |
| ESLint                   | Passou, zero erros e avisos na última execução                                                                                                      |
| TypeScript strict        | Passou; `typecheck` e compilação de produção                                                                                                        |
| Vitest                   | 25 testes passaram em três arquivos                                                                                                                 |
| Playwright CRM           | Fluxo completo passou contra Neon real                                                                                                              |
| Playwright login         | Desktop e mobile passaram com axe                                                                                                                   |
| Build Next.js            | Build de produção passou; rotas dinâmicas e páginas estáticas geradas                                                                               |
| Acessibilidade axe       | Sem violações WCAG A/AA detectadas no dashboard, login e formulário público testados                                                                |
| Responsividade           | Dashboard em 1440, 1280, 1156, 768 e 390 px; demais módulos em desktop/390 px; sem overflow global detectado                                        |
| Impeccable detector      | Retornou `[]` na execução mecânica                                                                                                                  |
| Taste lint               | Zero falhas; aviso restante de sombra refere-se ao modal sobreposto, onde a própria regra permite elevação                                          |
| Taste inspector no login | Zero falhas; três avisos de heurística explicados abaixo                                                                                            |
| Revisão independente     | Duas correções materiais identificadas, aplicadas e recapturadas; revisor confirmou ambas resolvidas, disposition `ship` no escopo dessas correções |

## Cobertura real

Vitest cobre soma/limites/temperaturas, campos ausentes, orçamento sem viés de valor, validação e consentimento, corpos JSON inválidos e limite por bytes, origem das mutações e normalização de telefone. Integração PostgreSQL verifica cadastro, edição, busca/filtros/paginação, isolamento de workspaces, fatores/histórico, conversão, exclusão em cascata, Live, encerramento, projeção sem contatos, limite persistente com chamadas concorrentes e execução idempotente do seed (30 registros, três temperaturas).

Playwright usa conta e workspaces temporários. Verifica proteção sem sessão, origem externa, acesso e alterações cruzadas negadas, login, cadastro/edição com recálculo, etapa e anotações, filtros, criação Live, QR, formulário público mobile, persistência/score, atualização por polling, consentimento/honeypot, token inválido, encerramento/expiração, exclusão confirmada e logout. Também percorre os módulos, o drawer mobile e as larguras documentadas.

As fixtures são criadas explicitamente no Neon e removidas ao final. Capturas em `artifacts/` demonstram esses dados temporários, não números hardcoded do frontend. O seed opcional não foi aplicado ao workspace do proprietário.

## Revisão visual

Capturas de desktop/mobile e largura da janela (1156 px) foram abertas e avaliadas. Foram corrigidos: overflow causado por label absoluta de acessibilidade fora do scrollport da tabela; sidebar em tablet; contraste do indicador de prioridade; rótulos omitidos no gráfico de origens; aviso de IA usado como eyebrow; h1 ausente na versão mobile do login. O revisor independente confirmou a correção dos rótulos e do aviso de IA por novas capturas.

O inspector de login acusa três avisos não bloqueantes: margens amplas do formulário limitado a 360 px, espaço no painel editorial e textos auxiliares de 11–12 px. São escolhas específicas da autenticação em duas colunas; a versão mobile mantém formulário em coluna única e a leitura/contraste foram testados com axe. Não são avisos de overflow ou contraste reprovado. A sombra apontada pelo lint pertence ao dialog modal, uma sobreposição real.

## Pendências e limites

- A senha do administrador deve ser definida pelo proprietário em `npm run bootstrap`; o e-mail escolhido está em `.env.local`. Não foi inventada senha nem utilizada credencial salva do navegador.
- O aplicativo está disponível localmente. Para demonstração com celulares externos, publicar em HTTPS e configurar as URLs de autenticação e aplicação; `localhost` no QR é válido somente no computador.
- Emulação de viewport não valida teclado virtual, notch e gestos em hardware real. iPhone/Android físicos ainda precisam ser testados.
- Axe não certifica toda acessibilidade. Leitura com leitores de tela reais e testes manuais adicionais permanecem recomendados antes de produção.
- O limite público é compartilhado por IP: 5 envios/minuto/sessão e 20 globais/minuto. Ajustar para plateias grandes em rede compartilhada conforme README.
- `npm audit --omit=dev --audit-level=high` não apontou severidades high/critical; apontou quatro moderate na cadeia esbuild/Drizzle Kit. Não foi aplicado downgrade automático incompatível. O app não utiliza um servidor esbuild.
- Sem deploy Vercel, testes de carga, CI remoto, recuperação de senha por e-mail, billing ou equipes. IA permanece desativada e sem provedor.
