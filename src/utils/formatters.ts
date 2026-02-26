import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: Date | string | null, pattern: string = 'dd/MM/yyyy'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, pattern, { locale: ptBR });
}

export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Pendente';
  if (days < 0) return `${Math.abs(days)} dias atrasado`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days} dias`;
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function formatEquipmentTag(id: string | number): string {
  const numId = typeof id === 'string' ? parseInt(id) : id;
  return `SPD ${numId.toString().padStart(3, '0')}`;
}
