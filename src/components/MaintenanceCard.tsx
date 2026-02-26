import { useState } from 'react';
import { MaintenanceRecord, MaintenanceTypeId, MAINTENANCE_TYPES } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Pencil, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaintenanceCardProps {
  maintenance: MaintenanceRecord;
  equipmentId: string;
  onDateChange?: (equipmentId: string, typeId: MaintenanceTypeId, newDate: Date | null) => void;
  onComplete?: (equipmentId: string, typeId: MaintenanceTypeId) => void;
  editable?: boolean;
}

export function MaintenanceCard({ 
  maintenance: m, 
  equipmentId, 
  onDateChange,
  onComplete,
  editable = true 
}: MaintenanceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    m.proximaManutencao ?? undefined
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateChange) {
      onDateChange(equipmentId, m.typeId, date);
    }
    setIsOpen(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable) {
      setIsOpen(true);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onClick={handleCardClick}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer group',
            'hover:ring-2 hover:ring-primary/30',
            m.status === 'ok' && 'bg-status-ok/5 border-status-ok/20 hover:bg-status-ok/10',
            m.status === 'warning' && 'bg-status-warning/5 border-status-warning/20 hover:bg-status-warning/10',
            m.status === 'critical' && 'bg-status-critical/10 border-status-critical/30 hover:bg-status-critical/15',
            m.status === 'overdue' && 'bg-status-overdue/10 border-status-overdue/30 hover:bg-status-overdue/15',
            m.status === 'pending' && 'bg-muted/30 border-border hover:bg-muted/50'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground truncate" title={m.periodicidade}>
              {m.label}
            </span>
            {editable && (
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          {m.proximaManutencao ? (
            <>
              <div className="font-mono text-sm font-semibold">
                {m.proximaManutencao.toLocaleDateString('pt-BR')}
              </div>
              <div className={cn(
                'text-xs font-bold mt-1',
                m.status === 'ok' && 'text-status-ok',
                m.status === 'warning' && 'text-status-warning',
                m.status === 'critical' && 'text-status-critical',
                m.status === 'overdue' && 'text-status-overdue'
              )}>
                {m.diasRestantes !== null && m.diasRestantes < 0 
                  ? `${Math.abs(m.diasRestantes)}d atrasado` 
                  : `${m.diasRestantes}d restantes`}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Clique para definir
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b">
          <p className="text-sm font-medium">{m.label}</p>
          <p className="text-xs text-muted-foreground">Selecione a próxima data de manutenção</p>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
          initialFocus
        />
        <div className="p-3 border-t flex flex-col gap-2">
          {m.proximaManutencao && (m.status === 'overdue' || m.status === 'critical' || m.status === 'warning') && (
            <Button 
              variant="default" 
              size="sm"
              className="w-full gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (onComplete) {
                  onComplete(equipmentId, m.typeId);
                }
                setIsOpen(false);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Concluir Manutenção
            </Button>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              Cancelar
            </Button>
            {m.proximaManutencao && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDateChange) {
                    onDateChange(equipmentId, m.typeId, null);
                  }
                  setSelectedDate(undefined);
                  setIsOpen(false);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
