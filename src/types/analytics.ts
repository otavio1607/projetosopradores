export interface KPI {
  label: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export interface ComplianceByService {
  service: string;
  compliant: number;
  total: number;
  percentage: number;
}

export interface MaintenanceTrend {
  month: string;
  completed: number;
  overdue: number;
  scheduled: number;
}

export interface AnalyticsDashboard {
  kpis: KPI[];
  complianceByService: ComplianceByService[];
  trends: MaintenanceTrend[];
  upcomingMaintenances: Array<{
    equipmentId: string;
    equipmentTag: string;
    maintenanceType: string;
    daysUntil: number;
    dueDate: string;
  }>;
}
