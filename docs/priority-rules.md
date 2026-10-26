# Pontuação do Lead — regras v2

O usuário vê **Prioridade comercial** (Alta, Média, Baixa ou Dados insuficientes). A pontuação e a explicação ficam no perfil de cada lead. A rota antiga `/app/scoring` redireciona para Meus Leads; a estrutura de IA continua preparada, fora da navegação principal. Nenhuma integração de IA foi adicionada.

## Critérios

| Evidência                                             |      Pontos |
| ----------------------------------------------------- | ----------: |
| Prazo: o quanto antes / próximas semanas / sem pressa | 45 / 20 / 0 |
| Serviço descrito com texto utilizável                 |          20 |
| Detalhes mínimos sobre problema ou objetivo           |          25 |
| Faixa de investimento reconhecida, qualquer valor     |          10 |

Prazo e investimento só acrescentam pontos quando o serviço e o contexto estão descritos. Alta: 80–100; Média: 60–79; Baixa: 0–59. A ausência de contexto tem precedência: exibir **Dados insuficientes**, nunca confundir com baixa prioridade. Pontuação nesse estado é parcial e não recomenda posição na fila de atendimento.

Nome, e-mail, telefone, empresa e segmento não dão pontos. Um contato com poucos campos, mas uma necessidade e prazo claros, pode ter prioridade alta. Não conhecer o orçamento não impede essa prioridade. Um orçamento maior não recebe mais pontos.

## O que a regra sabe — e o que não sabe

São verificações de formato e detalhes mínimos, sem interpretação semântica. O texto é normalizado com suporte Unicode, segmentado em palavras e comparado a exemplos genéricos/de teste. Campos somente numéricos, símbolos, letras repetidas, placeholders e repetições da mesma palavra não sustentam uma classificação. Contexto exige ao menos três palavras distintas úteis e 16 letras, desconsiderando conectivos, placeholders e tokens repetitivos. Uma descrição detalhada do próprio serviço pode fornecer esse contexto, mesmo sem observações.

Essas heurísticas não verificam a veracidade das respostas nem garantem que textos livres façam sentido. Palavras arbitrárias distintas ainda podem passar. A interface sempre apresenta uma estimativa e orienta confirmar necessidade e prazo em conversa. Texto curto ou incompleto pede esclarecimento, sem concluir que o contato tem pouco potencial.

## Compatibilidade e preservação

Sem mudança no schema, autenticação ou autorização. `scoring_method` identifica `rules-v2`; `temperature` conserva o nome técnico e os valores `hot`, `warm`, `cold`, com o novo estado textual `insufficient`. A origem histórica `Live Experience` é preservada no banco e apresentada como “Captação ao Vivo (demo)”.

Ao editar ou reavaliar, fatores anteriores **não são removidos**: cada avaliação acrescenta um lote com `created_at` igual ao novo `scored_at` do lead. O perfil consulta apenas o lote atual. O evento registra pontuação, prioridade e versão anteriores. Timestamps de lotes são monotônicos por lead sob lock para evitar misturar avaliações concorrentes.

Para atualizar avaliações antigas após implantar esta versão:

```powershell
npm run scoring:upgrade
```

Comando administrativo local, idempotente para a versão atual, sem endpoint público. Atualiza somente a classificação derivada e acrescenta histórico/fatores; mantém cadastro, origem, etapa, consentimento e fatores antigos. A conexão usada é `DATABASE_URL` do ambiente do comando. Na implementação local, a avaliação já existente foi atualizada e os campos originais/fatores foram comparados antes e depois.

## Experiência simplificada

Navegação: Visão Geral, Meus Leads, Funil de Vendas, Captação ao Vivo, Configurações. A introdução “Como funciona o CaptaFlow” pode ser dispensada e restaurada no dashboard; a preferência fica apenas no navegador, por workspace, sem relação com autenticação. Estados vazios distinguem primeiro uso de filtros sem resultados e oferecem cadastro ou limpeza de filtros.

Captação ao Vivo é uma demonstração via QR Code, com participação voluntária e sem contato obrigatório. Não é uma integração comercial com WhatsApp, Instagram ou outros serviços. Persistência, polling, encerramento, limites e isolamento existentes foram mantidos.
