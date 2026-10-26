export const SCORING_METHOD = 'rules-v2';
export interface ScoringInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  segment?: string | null;
  interest: string;
  urgency: string;
  budgetRange: string;
  notes?: string | null;
}
const placeholders = new Set([
  'teste',
  'test',
  'asdf',
  'qwerty',
  'abc',
  'abcde',
  'abcdef',
  'foo',
  'bar',
  'baz',
  'lorem',
  'ipsum',
  'nenhum',
  'qualquer',
  'sim',
  'ok',
  'na',
  'servico',
  'produto',
  'interesse',
  'nada',
  'xxx',
]);
const stopWords = new Set([
  'a',
  'o',
  'as',
  'os',
  'um',
  'uma',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'ou',
  'para',
  'por',
  'com',
  'em',
  'no',
  'na',
  'pelo',
  'pela',
  'quero',
  'preciso',
  'meu',
  'minha',
  'que',
  'se',
  'nao',
  'sei',
]);
function normalize(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim();
}
function words(value: string) {
  return [...new Intl.Segmenter('pt-BR', { granularity: 'word' }).segment(normalize(value))]
    .filter((s) => s.isWordLike)
    .map((s) => s.segment);
}
export function hasUsefulText(value: string | null | undefined) {
  if (!value) return false;
  const text = normalize(value);
  const letters = text.replace(/[^\p{L}]/gu, '');
  const tokens = words(text);
  return (
    letters.length >= 2 &&
    new Set(letters).size >= 2 &&
    tokens.some((w) => !placeholders.has(w) && !stopWords.has(w) && !/^(.)\1+$/u.test(w)) &&
    !(tokens.length > 2 && new Set(tokens).size === 1) &&
    !['nao sei', 'a definir', 'nao informado', 'sem informacao'].includes(text)
  );
}
export function hasContext(value: string | null | undefined) {
  if (!hasUsefulText(value)) return false;
  const tokens = words(value!).filter(
    (w) => !stopWords.has(w) && !placeholders.has(w) && !/^\d+$/.test(w) && !/^(.)\1+$/u.test(w),
  );
  return new Set(tokens).size >= 3 && tokens.join('').replace(/[^\p{L}]/gu, '').length >= 16;
}
export const temperatureFor = (score: number) =>
  score >= 80 ? 'hot' : score >= 60 ? 'warm' : 'cold';
export function scoreLead(input: ScoringInput) {
  const interest = hasUsefulText(input.interest);
  const context = hasContext(input.notes) || hasContext(input.interest);
  const reliable = interest && context;
  const budget = ['under_2k', 'from_2k_5k', 'from_5k_10k', 'over_10k'].includes(input.budgetRange);
  const urgency = reliable
    ? input.urgency === 'high'
      ? 45
      : input.urgency === 'medium'
        ? 20
        : 0
    : 0;
  const factors = [
    {
      factor: 'Prazo informado',
      points: urgency,
      explanation: !reliable
        ? 'O prazo só acrescenta pontos quando a necessidade está descrita.'
        : input.urgency === 'high'
          ? 'Informou que precisa avançar o quanto antes.'
          : input.urgency === 'medium'
            ? 'Pretende avançar nas próximas semanas.'
            : 'Sem pressa declarada; isso não significa falta de interesse.',
    },
    {
      factor: 'Serviço procurado',
      points: interest ? 20 : 0,
      explanation: interest
        ? 'Há uma descrição utilizável do serviço procurado.'
        : 'O serviço está ausente ou contém apenas texto genérico, repetido ou de teste.',
    },
    {
      factor: 'Problema ou objetivo',
      points: context ? 25 : 0,
      explanation: context
        ? 'O texto contém detalhes mínimos sobre a necessidade. A intenção real ainda deve ser confirmada em conversa.'
        : 'Falta descrever o problema ou objetivo com detalhes que ajudem na conversa.',
    },
    {
      factor: 'Faixa de investimento',
      points: reliable && budget ? 10 : 0,
      explanation:
        reliable && budget
          ? 'Uma faixa foi informada. Valores maiores não recebem mais pontos.'
          : 'Orçamento não é obrigatório. Sem contexto suficiente, selecionar uma faixa não aumenta a pontuação.',
    },
  ];
  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const missing = [
    !interest ? 'Serviço procurado' : null,
    !context ? 'Problema ou objetivo' : null,
  ].filter((v): v is string => Boolean(v));
  const contactAvailable = Boolean(input.email || input.phone);
  const temperature = reliable ? temperatureFor(score) : 'insufficient';
  const reason = reliable
    ? `Estimativa baseada no serviço, na descrição da necessidade e no prazo informado. ${factors
        .filter((f) => f.points > 0)
        .map((f) => f.explanation)
        .join(' ')}`
    : `Dados insuficientes para sugerir uma prioridade comercial. Ainda falta detalhar: ${missing.join(' e ').toLocaleLowerCase('pt-BR')}. Isso não significa que o contato tenha pouco potencial.`;
  return {
    score,
    temperature,
    reliable,
    factors,
    missing,
    reason,
    method: SCORING_METHOD,
    recommendation: !reliable
      ? 'Converse para entender qual serviço a pessoa procura e o problema que deseja resolver.'
      : !contactAvailable
        ? 'Se houver interesse em continuar, peça um meio de contato.'
        : temperature === 'hot'
          ? 'Entre em contato e confirme a necessidade e o prazo.'
          : temperature === 'warm'
            ? 'Combine uma conversa para avaliar o próximo passo.'
            : 'Combine quando será um bom momento para retomar a conversa.',
  };
}
