import { MaintenanceRecord } from '@/types/equipment';

export function calculateDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStatus(daysRemaining: number | null): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (daysRemaining === null) return 'pending';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'ok';
}

export function getOverallStatus(manutencoes: MaintenanceRecord[]): 'ok' | 'warning' | 'critical' | 'overdue' {
  const hasOverdue = manutencoes.some(m => m.status === 'overdue');
  if (hasOverdue) return 'overdue';
  const hasCritical = manutencoes.some(m => m.status === 'critical');
  if (hasCritical) return 'critical';
  const hasWarning = manutencoes.some(m => m.status === 'warning');
  if (hasWarning) return 'warning';
  return 'ok';
}

export function getStatusLabel(status: string): string {
  if (status === 'ok') return 'Em Dia';
  if (status === 'warning') return 'Atenção';
  if (status === 'critical') return 'Crítico';
  if (status === 'overdue') return 'Atrasado';
  return 'Pendente';
}
