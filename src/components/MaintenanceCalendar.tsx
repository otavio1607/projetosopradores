import { Equipment, MAINTENANCE_TYPES } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { Calendar, XCircle } from 'lucide-react';

interface MaintenanceCalendarProps {
  equipment: Equipment[];
}

export function MaintenanceCalendar({ equipment }: MaintenanceCalendarProps) {
  const today = new Date();
  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  // Get all maintenance records that fall on a specific date
  const getMaintenanceForDate = (date: Date) => {
    const results: { equipment: Equipment; maintenance: string; status: string }[] = [];
    
    equipment.forEach(equipmentItem => {
      equipmentItem.manutencoes.forEach(maintenanceRecord => {
        if (maintenanceRecord.proximaManutencao) {
          const maintDate = new Date(maintenanceRecord.proximaManutencao);
          if (maintDate.toDateString() === date.toDateString()) {
            results.push({
              equipment: equipmentItem,
              maintenance: maintenanceRecord.label,
              status: maintenanceRecord.status,
            });
          }
        }
      });
    });
    
    return results;
  };

  // Get overdue maintenance records
  const overdueRecords: { tag: string; service: string; days: number }[] = [];
  equipment.forEach(equipmentItem => {
    equipmentItem.manutencoes.forEach(maintenanceRecord => {
      if (maintenanceRecord.status === 'overdue' && maintenanceRecord.diasRestantes !== null) {
        overdueRecords.push({
          tag: equipmentItem.tag,
          service: maintenanceRecord.label,
          days: Math.abs(maintenanceRecord.diasRestantes),
        });
      }
    });
  });

  // Get count of maintenance by type
  const maintenanceCounts = MAINTENANCE_TYPES.map(type => {
    const overdue = equipment.filter(equipmentItem => 
      equipmentItem.manutencoes.find(maintenanceRecord => maintenanceRecord.typeId === type.id && maintenanceRecord.status === 'overdue')
    ).length;
    const critical = equipment.filter(equipmentItem => 
      equipmentItem.manutencoes.find(maintenanceRecord => maintenanceRecord.typeId === type.id && maintenanceRecord.status === 'critical')
    ).length;
    const warning = equipment.filter(equipmentItem => 
      equipmentItem.manutencoes.find(maintenanceRecord => maintenanceRecord.typeId === type.id && maintenanceRecord.status === 'warning')
    ).length;
    
    return {
      ...type,
      overdue,
      critical,
      warning,
      urgent: overdue + critical,
    };
  }).sort((a, b) => b.urgent - a.urgent);

  return (
    <div className="space-y-6">
      {/* Overdue Alert */}
      {overdueRecords.length > 0 && (
        <div className="industrial-card p-4 bg-status-overdue/5 border-status-overdue/30">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-status-overdue" />
            <span className="font-semibold text-status-overdue">
              {overdueRecords.length} serviço(s) atrasado(s)!
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {overdueRecords.slice(0, 10).map((record, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs px-2 py-1 rounded bg-status-overdue/10"
              >
                <span className="font-mono text-status-overdue">{record.tag}</span>
                <span className="text-muted-foreground truncate mx-2 flex-1">{record.service}</span>
                <span className="font-bold text-status-overdue">{record.days}d</span>
              </div>
            ))}
            {overdueRecords.length > 10 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{overdueRecords.length - 10} mais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Maintenance by Type */}
      <div className="industrial-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Serviços por Tipo</h2>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {maintenanceCounts.map(type => (
            <div
              key={type.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                type.urgent > 0 ? 'border-status-critical/30 bg-status-critical/5' : 'border-border bg-muted/20'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{type.label}</span>
                <div className="flex items-center gap-2">
                  {type.overdue > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-status-overdue/20 text-status-overdue">
                      {type.overdue} atrasado
                    </span>
                  )}
                  {type.critical > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-status-critical/20 text-status-critical">
                      {type.critical} crítico
                    </span>
                  )}
                  {type.warning > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-status-warning/20 text-status-warning">
                      {type.warning} atenção
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="industrial-card">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Próximos 30 dias
        </h3>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-1">
          {Array.from({ length: today.getDay() }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {next30Days.map((date, i) => {
            const maintenances = getMaintenanceForDate(date);
            const hasMaintenances = maintenances.length > 0;
            const isToday = date.toDateString() === today.toDateString();
            
            const hasCritical = maintenances.some(m => m.status === 'critical' || m.status === 'overdue');
            const hasWarning = maintenances.some(m => m.status === 'warning');

            return (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded flex flex-col items-center justify-center relative text-xs',
                  isToday && 'ring-2 ring-primary',
                  hasCritical && 'bg-status-critical/20',
                  !hasCritical && hasWarning && 'bg-status-warning/20',
                  !hasCritical && !hasWarning && hasMaintenances && 'bg-status-ok/20',
                  !hasMaintenances && 'bg-muted/20'
                )}
                title={hasMaintenances ? `${maintenances.length} manutenção(ões)` : undefined}
              >
                <span className={cn('font-mono', isToday && 'font-bold text-primary')}>
                  {date.getDate()}
                </span>
                {hasMaintenances && (
                  <span className="text-[10px] font-bold">{maintenances.length}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-status-ok" />
            <span className="text-muted-foreground">Em Dia</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-status-warning" />
            <span className="text-muted-foreground">Atenção</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-status-critical" />
            <span className="text-muted-foreground">Crítico</span>
          </div>
        </div>
      </div>
    </div>
  );
}
