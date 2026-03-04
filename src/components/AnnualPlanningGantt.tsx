import { useState, useRef, useCallback } from 'react';
import { Equipment, MaintenanceTypeId, MAINTENANCE_TYPES } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { CalendarDays, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addWeeks, startOfWeek, format, addDays, differenceInWeeks, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnualPlanningGanttProps {
  equipment: Equipment[];
  onMaintenanceDateChange: (equipmentId: string, typeId: MaintenanceTypeId, newDate: Date | null) => void;
}

interface GanttTask {
  equipmentId: string;
  tag: string;
  area: string;
  typeId: MaintenanceTypeId;
  label: string;
  weekIndex: number; // 0-based week offset from chartStart
  durationWeeks: number;
  status: 'ok' | 'warning' | 'critical' | 'overdue' | 'pending';
  date: Date;
}

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-status-ok/80 border-status-ok hover:bg-status-ok',
  warning: 'bg-status-warning/80 border-status-warning hover:bg-status-warning',
  critical: 'bg-status-critical/80 border-status-critical hover:bg-status-critical',
  overdue: 'bg-status-overdue/80 border-status-overdue hover:bg-status-overdue',
  pending: 'bg-muted border-muted-foreground',
};

const WEEKS_PER_VIEW = 26; // Show 26 weeks at a time (half year)
const TOTAL_WEEKS = 52;

export function AnnualPlanningGantt({ equipment, onMaintenanceDateChange }: AnnualPlanningGanttProps) {
  const today = startOfDay(new Date());
  const chartStart = startOfWeek(today, { weekStartsOn: 0 });

  const [weekOffset, setWeekOffset] = useState(0); // viewport scroll in weeks
  const [draggingTask, setDraggingTask] = useState<GanttTask | null>(null);
  const [dragOverWeek, setDragOverWeek] = useState<number | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Build week headers for viewport
  const viewWeeks = Array.from({ length: WEEKS_PER_VIEW }, (_, i) => {
    const weekStart = addWeeks(chartStart, weekOffset + i);
    return {
      index: weekOffset + i,
      label: format(weekStart, 'dd/MM', { locale: ptBR }),
      monthLabel: format(weekStart, 'MMM', { locale: ptBR }),
      isToday: differenceInWeeks(weekStart, chartStart) === 0 && weekOffset === 0 && i === 0,
      date: weekStart,
    };
  });

  // Build month groups for the header
  const monthGroups: { label: string; start: number; span: number }[] = [];
  viewWeeks.forEach((w, i) => {
    const month = format(w.date, 'MMM yyyy', { locale: ptBR });
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === month) {
      last.span++;
    } else {
      monthGroups.push({ label: month, start: i, span: 1 });
    }
  });

  // Build Gantt tasks from equipment maintenance schedules
  const tasks: GanttTask[] = [];
  const displayEquipment = equipment.slice(0, 30); // Limit to first 30 for performance

  displayEquipment.forEach(eq => {
    eq.manutencoes.forEach(m => {
      if (!m.proximaManutencao) return;
      const taskDate = new Date(m.proximaManutencao);
      const weekIdx = differenceInWeeks(startOfWeek(taskDate, { weekStartsOn: 0 }), chartStart);
      if (weekIdx < 0 || weekIdx >= TOTAL_WEEKS) return;

      // Each task occupies one week cell in the Gantt view
      const durationWeeks = 1;

      tasks.push({
        equipmentId: eq.id,
        tag: eq.tag,
        area: eq.area,
        typeId: m.typeId,
        label: m.label,
        weekIndex: weekIdx,
        durationWeeks,
        status: m.status,
        date: taskDate,
      });
    });
  });

  // Group tasks by equipment row
  const equipmentRows = displayEquipment.map(eq => ({
    id: eq.id,
    tag: eq.tag,
    area: eq.area,
    tasks: tasks.filter(t => t.equipmentId === eq.id),
  }));

  const handleDragStart = useCallback((task: GanttTask) => {
    setDraggingTask(task);
  }, []);

  const handleDragEnter = useCallback((weekIndex: number) => {
    setDragOverWeek(weekIndex);
  }, []);

  const handleDrop = useCallback((weekIndex: number) => {
    if (!draggingTask) return;
    const newDate = addDays(addWeeks(chartStart, weekIndex), 1); // Monday of the target week
    onMaintenanceDateChange(draggingTask.equipmentId, draggingTask.typeId, newDate);
    setDraggingTask(null);
    setDragOverWeek(null);
  }, [draggingTask, chartStart, onMaintenanceDateChange]);

  const handleDragEnd = useCallback(() => {
    setDraggingTask(null);
    setDragOverWeek(null);
  }, []);

  const canScrollBack = weekOffset > 0;
  const canScrollForward = weekOffset + WEEKS_PER_VIEW < TOTAL_WEEKS;

  const todayWeekIndex = 0; // chartStart is today's week
  const todayViewPosition = todayWeekIndex - weekOffset;
  const showTodayLine = todayViewPosition >= 0 && todayViewPosition < WEEKS_PER_VIEW;

  return (
    <div className="industrial-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Planejamento Anual (52 Semanas)</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {format(addWeeks(chartStart, weekOffset), 'MMM yyyy', { locale: ptBR })} —{' '}
            {format(addWeeks(chartStart, weekOffset + WEEKS_PER_VIEW - 1), 'MMM yyyy', { locale: ptBR })}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setWeekOffset(0)}
            className="text-xs"
          >
            Hoje
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={!canScrollBack}
            onClick={() => setWeekOffset(w => Math.max(0, w - WEEKS_PER_VIEW / 2))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={!canScrollForward}
            onClick={() => setWeekOffset(w => Math.min(TOTAL_WEEKS - WEEKS_PER_VIEW, w + WEEKS_PER_VIEW / 2))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {Object.entries({ ok: 'Em Dia', warning: 'Atenção', critical: 'Crítico', overdue: 'Atrasado' }).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={cn('w-3 h-3 rounded-sm border', STATUS_COLORS[status])} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-auto text-muted-foreground">
          <GripHorizontal className="h-3 w-3" />
          Arraste para reprogramar
        </span>
      </div>

      {/* Gantt Grid */}
      <div className="overflow-x-auto" ref={ganttRef}>
        <div style={{ minWidth: `${160 + WEEKS_PER_VIEW * 28}px` }}>
          {/* Month header */}
          <div className="flex">
            <div className="w-40 shrink-0" />
            {monthGroups.map((mg, idx) => (
              <div
                key={idx}
                className="text-xs font-semibold text-center text-muted-foreground border-b border-border pb-1 capitalize"
                style={{ width: `${mg.span * 28}px` }}
              >
                {mg.label}
              </div>
            ))}
          </div>

          {/* Week header */}
          <div className="flex mb-1">
            <div className="w-40 shrink-0 text-xs text-muted-foreground px-2 py-1">
              Equipamento
            </div>
            {viewWeeks.map((w, i) => (
              <div
                key={i}
                className={cn(
                  'w-7 shrink-0 text-center text-xs text-muted-foreground border-l border-border/30 py-1',
                  dragOverWeek === w.index && 'bg-primary/20',
                  showTodayLine && i === todayViewPosition && 'bg-primary/10 text-primary font-bold',
                )}
                style={{ fontSize: '9px' }}
              >
                {w.label.split('/')[0]}
              </div>
            ))}
          </div>

          {/* Equipment rows */}
          <div className="space-y-px">
            {equipmentRows.map(row => (
              <div key={row.id} className="flex items-center group hover:bg-muted/10 rounded">
                {/* Equipment label */}
                <div className="w-40 shrink-0 px-2 py-1.5">
                  <div className="font-mono text-xs font-bold text-primary truncate">{row.tag}</div>
                  <div className="text-xs text-muted-foreground truncate">{row.area}</div>
                </div>

                {/* Week cells */}
                {viewWeeks.map((w, i) => {
                  const cellWeekIdx = w.index;
                  const tasksInCell = row.tasks.filter(t => t.weekIndex === cellWeekIdx);
                  const isToday = showTodayLine && i === todayViewPosition;
                  const isDropTarget = dragOverWeek === cellWeekIdx;

                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-7 h-8 shrink-0 border-l border-border/20 relative flex items-center justify-center',
                        isToday && 'bg-primary/10',
                        isDropTarget && draggingTask && 'bg-primary/25 border-primary/50',
                      )}
                      onDragOver={e => { e.preventDefault(); handleDragEnter(cellWeekIdx); }}
                      onDrop={() => handleDrop(cellWeekIdx)}
                    >
                      {tasksInCell.length > 0 && tasksInCell.map((task, ti) => (
                        <div
                          key={ti}
                          className={cn(
                            'absolute inset-x-0.5 inset-y-1 rounded-sm border cursor-grab active:cursor-grabbing',
                            'flex items-center justify-center transition-all',
                            STATUS_COLORS[task.status],
                            draggingTask?.equipmentId === task.equipmentId && draggingTask?.typeId === task.typeId && 'opacity-50',
                          )}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          title={`${task.tag}: ${task.label}\n${format(task.date, 'dd/MM/yyyy')}\nArraste para reprogramar`}
                        />
                      ))}
                      {tasksInCell.length > 1 && (
                        <span className="absolute top-0 right-0 text-[8px] font-bold text-foreground z-10">
                          {tasksInCell.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {equipment.length > 30 && (
            <div className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">
              Exibindo 30 de {equipment.length} equipamentos. Use os filtros para refinar a visualização.
            </div>
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {MAINTENANCE_TYPES.filter(t => t.interval <= 365).map(mt => {
          const count = tasks.filter(t => t.typeId === mt.id).length;
          return (
            <div key={mt.id} className="text-xs">
              <div className="font-medium text-foreground truncate">{mt.label}</div>
              <div className="text-muted-foreground">{count} programados</div>
              <div className="text-muted-foreground capitalize">{mt.periodicidade}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
