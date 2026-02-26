import { Equipment } from '@/types/equipment';
import { AnalyticsDashboard, KPI, ComplianceByService, MaintenanceTrend } from '@/types/analytics';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function calculateKPIs(equipment: Equipment[]): KPI[] {
  const total = equipment.length;
  if (total === 0) return [];

  const overdue = equipment.filter(e => e.statusGeral === 'overdue').length;
  const ok = equipment.filter(e => e.statusGeral === 'ok').length;
  const critical = equipment.filter(e => e.statusGeral === 'critical').length;
  const warning = equipment.filter(e => e.statusGeral === 'warning').length;

  const complianceRate = Math.round((ok / total) * 100);

  return [
    {
      label: 'Total de Equipamentos',
      value: total,
      trend: 'stable',
    },
    {
      label: 'Taxa de Conformidade',
      value: complianceRate,
      unit: '%',
      trend: complianceRate >= 80 ? 'up' : 'down',
    },
    {
      label: 'Em Dia',
      value: ok,
      trend: 'stable',
    },
    {
      label: 'Atenção',
      value: warning,
      trend: warning > 0 ? 'down' : 'stable',
    },
    {
      label: 'Crítico',
      value: critical,
      trend: critical > 0 ? 'down' : 'stable',
    },
    {
      label: 'Atrasado',
      value: overdue,
      trend: overdue > 0 ? 'down' : 'stable',
    },
  ];
}

export function calculateComplianceByService(equipment: Equipment[]): ComplianceByService[] {
  const serviceMap = new Map<string, { compliant: number; total: number }>();

  equipment.forEach(eq => {
    const area = eq.area || 'Outros';
    if (!serviceMap.has(area)) {
      serviceMap.set(area, { compliant: 0, total: 0 });
    }
    const entry = serviceMap.get(area)!;
    entry.total++;
    if (eq.statusGeral === 'ok') {
      entry.compliant++;
    }
  });

  return Array.from(serviceMap.entries()).map(([service, data]) => ({
    service,
    compliant: data.compliant,
    total: data.total,
    percentage: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
  }));
}

export function calculateTrends(equipment: Equipment[]): MaintenanceTrend[] {
  const months: MaintenanceTrend[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });

    let completed = 0;
    let overdue = 0;
    let scheduled = 0;

    equipment.forEach(eq => {
      eq.manutencoes.forEach(m => {
        if (m.proximaManutencao) {
          const isInMonth = isWithinInterval(m.proximaManutencao, { start: monthStart, end: monthEnd });
          if (isInMonth) {
            if (m.status === 'ok') completed++;
            else if (m.status === 'overdue') overdue++;
            else scheduled++;
          }
        }
      });
    });

    months.push({ month: monthLabel, completed, overdue, scheduled });
  }

  return months;
}

export function getUpcomingMaintenances(equipment: Equipment[], daysAhead: number = 30) {
  const upcoming: AnalyticsDashboard['upcomingMaintenances'] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  equipment.forEach(eq => {
    eq.manutencoes.forEach(m => {
      if (m.proximaManutencao && m.proximaManutencao > now && m.proximaManutencao <= cutoff) {
        const daysUntil = Math.ceil((m.proximaManutencao.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        upcoming.push({
          equipmentId: eq.id,
          equipmentTag: eq.tag,
          maintenanceType: m.label,
          daysUntil,
          dueDate: format(m.proximaManutencao, 'dd/MM/yyyy'),
        });
      }
    });
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 20);
}

export function buildAnalyticsDashboard(equipment: Equipment[]): AnalyticsDashboard {
  return {
    kpis: calculateKPIs(equipment),
    complianceByService: calculateComplianceByService(equipment),
    trends: calculateTrends(equipment),
    upcomingMaintenances: getUpcomingMaintenances(equipment),
  };
}
