import { Equipment } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

interface MaintenanceTimelineProps {
  equipment: Equipment[];
}

interface TimelineEvent {
  tag: string;
  area: string;
  elevacao: number;
  service: string;
  date: Date;
  daysRemaining: number;
  status: 'ok' | 'warning' | 'critical' | 'overdue' | 'pending';
}

const STATUS_CONFIG = {
  overdue: { icon: XCircle, label: 'Atrasado', dotClass: 'bg-status-overdue', textClass: 'text-status-overdue' },
  critical: { icon: AlertCircle, label: 'Crítico', dotClass: 'bg-status-critical', textClass: 'text-status-critical' },
  warning: { icon: AlertTriangle, label: 'Atenção', dotClass: 'bg-status-warning', textClass: 'text-status-warning' },
  ok: { icon: CheckCircle2, label: 'Em Dia', dotClass: 'bg-status-ok', textClass: 'text-status-ok' },
  pending: { icon: Clock, label: 'Pendente', dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground' },
};

export function MaintenanceTimeline({ equipment }: MaintenanceTimelineProps) {
  // Collect all maintenance events with dates
  const events: TimelineEvent[] = [];
  equipment.forEach(e => {
    e.manutencoes.forEach(m => {
      if (m.proximaManutencao && m.diasRestantes !== null) {
        events.push({
          tag: e.tag,
          area: e.area,
          elevacao: e.elevacao,
          service: m.label,
          date: new Date(m.proximaManutencao),
          daysRemaining: m.diasRestantes,
          status: m.status,
        });
      }
    });
  });

  // Sort: overdue first (most overdue), then by date ascending
  events.sort((a, b) => {
    const priorityA = a.status === 'overdue' ? 0 : a.status === 'critical' ? 1 : a.status === 'warning' ? 2 : 3;
    const priorityB = b.status === 'overdue' ? 0 : b.status === 'critical' ? 1 : b.status === 'warning' ? 2 : 3;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.daysRemaining - b.daysRemaining;
  });

  // Show top 50 most urgent
  const displayEvents = events.slice(0, 50);

  // Group by status for summary
  const overdue = events.filter(e => e.status === 'overdue').length;
  const critical = events.filter(e => e.status === 'critical').length;
  const warning = events.filter(e => e.status === 'warning').length;

  return (
    <div className="industrial-card">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Timeline de Manutenção</h2>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 mb-4 text-xs">
        {overdue > 0 && (
          <span className="px-2 py-1 rounded bg-status-overdue/20 text-status-overdue font-bold">
            {overdue} atrasados
          </span>
        )}
        {critical > 0 && (
          <span className="px-2 py-1 rounded bg-status-critical/20 text-status-critical font-bold">
            {critical} críticos
          </span>
        )}
        {warning > 0 && (
          <span className="px-2 py-1 rounded bg-status-warning/20 text-status-warning font-bold">
            {warning} atenção
          </span>
        )}
      </div>

      {/* Timeline list */}
      <div className="relative max-h-[500px] overflow-y-auto">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {displayEvents.map((event, idx) => {
            const config = STATUS_CONFIG[event.status];
            const Icon = config.icon;

            return (
              <div
                key={idx}
                className={cn(
                  'relative pl-8 pr-3 py-2 rounded-lg transition-all hover:bg-muted/30',
                  event.status === 'overdue' && 'bg-status-overdue/5',
                  event.status === 'critical' && 'bg-status-critical/5',
                )}
              >
                {/* Dot on timeline */}
                <div className={cn(
                  'absolute left-1.5 top-3.5 w-3 h-3 rounded-full border-2 border-background z-10',
                  config.dotClass
                )} />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {event.tag}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {event.service}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {event.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className={cn('text-xs font-bold font-mono', config.textClass)}>
                      {event.daysRemaining > 0 ? `${event.daysRemaining}d` : `${Math.abs(event.daysRemaining)}d atrás`}
                    </span>
                    <Icon className={cn('h-3.5 w-3.5', config.textClass)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 50 && (
        <div className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">
          Mostrando 50 de {events.length} manutenções programadas
        </div>
      )}
    </div>
  );
}
