import { z } from 'zod';
export const stages = {
  new: 'Novo',
  qualified: 'Qualificado',
  negotiation: 'Em negociação',
  won: 'Ganho',
  lost: 'Perdido',
} as const;
export const urgencies = {
  low: 'Sem pressa',
  medium: 'Nas próximas semanas',
  high: 'O quanto antes',
} as const;
export const budgets = {
  unknown: 'Ainda não definido',
  under_2k: 'Até R$ 2 mil',
  from_2k_5k: 'R$ 2 mil a R$ 5 mil',
  from_5k_10k: 'R$ 5 mil a R$ 10 mil',
  over_10k: 'Acima de R$ 10 mil',
} as const;
export const sources = ['Manual', 'Site', 'Instagram', 'Indicação', 'LinkedIn', 'Evento'] as const;
export const phoneValid = (v: string) =>
  /^\+?[\d\s().-]+$/.test(v) &&
  v.replace(/\D/g, '').length >= 10 &&
  v.replace(/\D/g, '').length <= 15;
const fields = {
  name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(100),
  email: z.union([z.email('Informe um e-mail válido.'), z.literal('')]).default(''),
  phone: z
    .string()
    .trim()
    .max(25)
    .refine((v) => !v || phoneValid(v), 'Informe um telefone válido com DDD.')
    .default(''),
  company: z.string().trim().max(120).default(''),
  segment: z.string().trim().max(80).default(''),
  interest: z.string().trim().min(3, 'Descreva o serviço procurado.').max(250),
  urgency: z.enum(['low', 'medium', 'high']),
  budgetRange: z.enum(['unknown', 'under_2k', 'from_2k_5k', 'from_5k_10k', 'over_10k']),
  source: z.enum([...sources, 'Live Experience']),
  notes: z.string().trim().max(3000).default(''),
};
export const demoEditSchema = z.object(fields);
export const leadSchema = demoEditSchema.refine((v) => Boolean(v.email || v.phone), {
  path: ['email'],
  message: 'Informe e-mail ou WhatsApp para contato.',
});
export type LeadInput = z.output<typeof leadSchema>;
export const publicLeadSchema = z.object({
  name: fields.name,
  interest: fields.interest,
  urgency: fields.urgency,
  budgetRange: fields.budgetRange,
  notes: z.string().trim().min(5, 'Conte um pouco sobre o problema.').max(1000),
  consent: z.literal(true, { error: 'Aceite o uso dos dados para participar.' }),
  website: z.string().max(0).default(''),
});
