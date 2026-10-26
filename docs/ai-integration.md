# Integração futura de inteligência artificial

Estado: **Integração em preparação**. Nenhum SDK, adaptador ou credencial de IA está instalado. Nenhuma chamada a modelos é feita. `lead_intelligence_analyses` permanece vazia.

Contrato em `src/features/intelligence/provider.ts`: `LeadIntelligenceProvider.analyzeLead(input)` recebe ID do lead, interesse, urgência, faixa de orçamento e observações. A implementação futura só poderá ser escolhida mediante solicitação explícita do proprietário.

Saída esperada: resumo (`summary`), justificativa (`rationale`), interesses (`interests`), ação recomendada (`recommendedAction`), mensagem sugerida (`suggestedMessage`), metadados com provedor, modelo, origem externa e timestamp UTC. Validar uma futura resposta com schema Zod antes de persistir. Não confundir essas saídas com `scoreLead`, que é um motor determinístico de regras independente.

Ponto de integração: serviço autenticado no servidor que primeiro consulta o lead com `workspace_id`, minimiza dados e então chama o provider. Nunca enviar email/telefone por padrão. Revisar consentimento, retenção e tratamento de observações antes de habilitar.

Falhas: timeout limitado, erro seguro e status de falha sem inventar uma resposta; retry limitado e idempotência. O CRM e o scoring continuam funcionando quando a análise falhar. Não alterar scores silenciosamente com saídas de modelos. Nenhuma ação comercial ou mensagem será enviada automaticamente.
