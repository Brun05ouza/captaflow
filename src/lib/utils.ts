import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return !phone.startsWith('+') && [10, 11].includes(digits.length) ? `55${digits}` : digits;
}
export const dateLabel = (date: Date | string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(date));
export const temperatureLabels: Record<string, string> = {
  hot: 'Alta',
  warm: 'Média',
  cold: 'Baixa',
  insufficient: 'Dados insuficientes',
};
export const sourceLabel = (source: string) =>
  source === 'Live Experience' ? 'Captação ao Vivo (demo)' : source;
