import { Equipment, MaintenanceRecord, MaintenanceStats } from '@/types/equipment';
import { MAINTENANCE_TYPES } from '@/types/equipment';

/**
 * Calcula dias faltantes até a próxima manutenção
 */
export function calculateDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determina o status de uma manutenção baseado nos dias restantes
 */
export function getStatus(
  daysRemaining: number | null
): 'ok' | 'warning' | 'critical' | 'overdue' | 'pending' {
  if (daysRemaining === null) return 'pending';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'ok';
}

/**
 * Calcula o status geral de um equipamento baseado no pior status
 */
export function getOverallStatus(
  manutencoes: MaintenanceRecord[]
): 'ok' | 'warning' | 'critical' | 'overdue' {
  const hasOverdue = manutencoes.some(m => m.status === 'overdue');
  if (hasOverdue) return 'overdue';
  const hasCritical = manutencoes.some(m => m.status === 'critical');
  if (hasCritical) return 'critical';
  const hasWarning = manutencoes.some(m => m.status === 'warning');
  if (hasWarning) return 'warning';
  return 'ok';
}

/**
 * Encontra a próxima manutenção mais próxima de um equipamento
 */
export function getNextMaintenance(
  manutencoes: MaintenanceRecord[]
): { date: Date | null; diasRestantes: number | null } {
  const validDates = manutencoes
    .filter(m => m.proximaManutencao !== null)
    .sort((a, b) => {
      if (!a.proximaManutencao || !b.proximaManutencao) return 0;
      return a.proximaManutencao.getTime() - b.proximaManutencao.getTime();
    });

  if (validDates.length === 0) {
    return { date: null, diasRestantes: null };
  }

  const proximaData = validDates[0].proximaManutencao;
  return {
    date: proximaData,
    diasRestantes: calculateDaysRemaining(proximaData),
  };
}

/**
 * Calcula estatísticas consolidadas de um array de equipamentos
 */
export function calculateStats(equipment: Equipment[]): MaintenanceStats {
  const stats: MaintenanceStats = {
    total: equipment.length,
    emDia: 0,
    atencao: 0,
    critico: 0,
    atrasado: 0,
  };

  equipment.forEach(eq => {
    switch (eq.statusGeral) {
      case 'ok':
        stats.emDia++;
        break;
      case 'warning':
        stats.atencao++;
        break;
      case 'critical':
        stats.critico++;
        break;
      case 'overdue':
        stats.atrasado++;
        break;
    }
  });

  return stats;
}

/**
 * Interpreta cor baseado no status
 */
export function getStatusColor(
  status: 'ok' | 'warning' | 'critical' | 'overdue' | 'pending'
): string {
  switch (status) {
    case 'ok':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'critical':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'pending':
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Calcula a próxima data de manutenção baseado na última data
 */
export function calculateNextMaintenanceDate(
  lastMaintenanceDate: Date | null,
  intervalDays: number
): Date | null {
  if (!lastMaintenanceDate) return null;
  const nextDate = new Date(lastMaintenanceDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

/**
 * Filtra equipamentos por intervalo de dias até próxima manutenção
 */
export function filterByDaysInterval(
  equipment: Equipment[],
  minDays: number,
  maxDays: number
): Equipment[] {
  return equipment.filter(eq => {
    if (eq.diasRestantesGeral === null) return false;
    return eq.diasRestantesGeral >= minDays && eq.diasRestantesGeral <= maxDays;
  });
}

/**
 * Encontra equipamentos com manutenção atrasada por mais de N dias
 */
export function findOverdueEquipment(equipment: Equipment[], daysThreshold: number = 0): Equipment[] {
  return equipment.filter(eq => {
    const hasOverdue = eq.manutencoes.some(m => {
      if (m.diasRestantes === null) return false;
      return m.diasRestantes < -daysThreshold;
    });
    return hasOverdue;
  });
}

/**
 * Agrupa equipamentos por área
 */
export function groupByArea(equipment: Equipment[]): Record<string, Equipment[]> {
  return equipment.reduce(
    (groups, eq) => {
      if (!groups[eq.area]) {
        groups[eq.area] = [];
      }
      groups[eq.area].push(eq);
      return groups;
    },
    {} as Record<string, Equipment[]>
  );
}

/**
 * Agrupa equipamentos por status geral
 */
export function groupByStatus(equipment: Equipment[]): Record<string, Equipment[]> {
  return equipment.reduce(
    (groups, eq) => {
      if (!groups[eq.statusGeral]) {
        groups[eq.statusGeral] = [];
      }
      groups[eq.statusGeral].push(eq);
      return groups;
    },
    {} as Record<string, Equipment[]>
  );
}

/**
 * Calcula taxa de atraso (equipamentos atrasados / total)
 */
export function calculateOverdueRate(equipment: Equipment[]): number {
  if (equipment.length === 0) return 0;
  const overdue = equipment.filter(eq => eq.statusGeral === 'overdue').length;
  return (overdue / equipment.length) * 100;
}

/**
 * Encontra tipos de manutenção mais frequentes com atraso
 */
export function findMostOverdueMaintenance(equipment: Equipment[]): Array<{
  typeId: string;
  label: string;
  count: number;
}> {
  const counts: Record<string, { label: string; count: number }> = {};

  equipment.forEach(eq => {
    eq.manutencoes.forEach(m => {
      if (m.status === 'overdue') {
        if (!counts[m.typeId]) {
          counts[m.typeId] = { label: m.label, count: 0 };
        }
        counts[m.typeId].count++;
      }
    });
  });

  return Object.entries(counts)
    .map(([typeId, data]) => ({ typeId, ...data }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detecta equipamentos que podem estar com falha recorrente
 * (mesmo tipo de manutenção atrasado repetidamente)
 */
export function findRecurrentIssues(
  equipment: Equipment[],
  threshold: number = 3
): Array<{
  equipmentTag: string;
  maintenanceType: string;
  count: number;
}> {
  const issues: Record<string, { maintenanceType: string; count: number }> = {};

  equipment.forEach(eq => {
    eq.manutencoes.forEach(m => {
      if (m.status === 'overdue') {
        const key = `${eq.id}-${m.typeId}`;
        if (!issues[key]) {
          issues[key] = { maintenanceType: m.label, count: 0 };
        }
        issues[key].count++;
      }
    });
  });

  return Object.entries(issues)
    .filter(([_, data]) => data.count >= threshold)
    .map(([key, data]) => {
      const equipTag = equipment.find(eq => eq.id === key.split('-')[0])?.tag || 'Unknown';
      return {
        equipmentTag: equipTag,
        maintenanceType: data.maintenanceType,
        count: data.count,
      };
    });
}
