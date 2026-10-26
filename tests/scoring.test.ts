import { describe, it, expect } from 'vitest';
import { scoreLead, temperatureFor, hasUsefulText } from '../src/features/scoring/engine';
import { leadSchema, publicLeadSchema } from '../src/features/leads/validation';
const full = {
  name: 'Maria',
  email: 'maria@example.com',
  phone: '',
  company: 'Empresa',
  segment: 'Serviços',
  interest: 'Website',
  urgency: 'high',
  budgetRange: 'under_2k',
  notes: 'Precisa organizar os contatos recebidos pelo site da empresa.',
};
describe('prioridade conservadora v2', () => {
  it('soma fatores reais, limita a 100 e identifica versão', () => {
    const r = scoreLead(full);
    expect(r.score).toBe(100);
    expect(r.factors.reduce((s, f) => s + f.points, 0)).toBe(r.score);
    expect(r.temperature).toBe('hot');
    expect(r.reliable).toBe(true);
    expect(r.method).toBe('rules-v2');
  });
  it.each([
    [0, 'cold'],
    [59, 'cold'],
    [60, 'warm'],
    [79, 'warm'],
    [80, 'hot'],
    [100, 'hot'],
  ])('faixa %i => %s', (n, t) => expect(temperatureFor(n as number)).toBe(t));
  it('não premia orçamento maior', () =>
    expect(scoreLead({ ...full, budgetRange: 'over_10k' }).score).toBe(scoreLead(full).score));
  it('não penaliza contato, empresa ou segmento ausentes', () => {
    const r = scoreLead({ ...full, email: '', company: '', segment: '' });
    expect(r.score).toBe(100);
    expect(r.temperature).toBe('hot');
  });
  it('poucos campos com uma necessidade específica são suficientes', () => {
    const r = scoreLead({
      name: 'A',
      interest: 'Website para organizar pedidos recebidos pela loja',
      notes: '',
      urgency: 'high',
      budgetRange: 'unknown',
    });
    expect(r.temperature).toBe('hot');
    expect(r.score).toBe(90);
  });
  it.each([
    'teste',
    'aaaaaa',
    'abc',
    '123456',
    '!!!',
    'site site site',
    'foo bar baz',
    'aaa bbb ccc',
  ])('texto sem contexto %s nunca vira alta prioridade', (text) => {
    const r = scoreLead({ ...full, interest: text, notes: text });
    expect(r.temperature).toBe('insufficient');
    expect(r.score).toBeLessThan(60);
    expect(r.reliable).toBe(false);
  });
  it('só selecionar urgência e orçamento não basta', () => {
    const r = scoreLead({ ...full, notes: 'Site novo' });
    expect(r.score).toBe(20);
    expect(r.temperature).toBe('insufficient');
    expect(r.factors.find((f) => f.factor === 'Prazo informado')?.points).toBe(0);
  });
  it('dados ausentes não são classificados como pouco potencial', () => {
    const r = scoreLead({ name: 'Ana', interest: '', urgency: 'low', budgetRange: 'unknown' });
    expect(r.score).toBe(0);
    expect(r.temperature).toBe('insufficient');
    expect(r.reason).toContain('não significa');
    expect(r.missing).toContain('Problema ou objetivo');
  });
  it('prazo diferencia alta, média e baixa com a mesma necessidade', () => {
    expect(scoreLead({ ...full, urgency: 'low' }).temperature).toBe('cold');
    expect(scoreLead({ ...full, urgency: 'medium' }).temperature).toBe('warm');
    expect(scoreLead(full).temperature).toBe('hot');
  });
  it('reconhece texto Unicode sem depender de nomes ou emails', () => {
    expect(hasUsefulText('网站')).toBe(true);
    expect(hasUsefulText('تصميم')).toBe(true);
    expect(hasUsefulText('SEO')).toBe(true);
  });
  it('justificativas seguem os fatores e não alegam verificação de intenção', () => {
    const r = scoreLead(full);
    expect(r.reason).toContain('confirmada em conversa');
    expect(r.reason).not.toContain('garantia');
    expect(r.recommendation).toContain('confirme');
  });
});
describe('validação preservada', () => {
  it('CRM exige contato', () =>
    expect(leadSchema.safeParse({ ...full, email: '', source: 'Manual' }).success).toBe(false));
  it('telefone inválido continua rejeitado', () =>
    expect(leadSchema.safeParse({ ...full, phone: 'abc', source: 'Manual' }).success).toBe(false));
  it('demo exige consentimento, dispensa contato e rejeita honeypot', () => {
    const d = {
      name: 'Ana',
      interest: 'Website',
      urgency: 'high',
      budgetRange: 'unknown',
      notes: 'Preciso vender mais',
      consent: true,
    };
    expect(publicLeadSchema.safeParse(d).success).toBe(true);
    expect(publicLeadSchema.safeParse({ ...d, consent: false }).success).toBe(false);
    expect(publicLeadSchema.safeParse({ ...d, website: 'bot' }).success).toBe(false);
  });
});
