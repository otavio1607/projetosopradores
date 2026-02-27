import { Equipment, StatusFilter, MaintenanceTypeId } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Wrench, ArrowUpDown, ChevronDown, ChevronRight, Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { MaintenanceCard } from './MaintenanceCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EquipmentTableProps {
  equipment: Equipment[];
  statusFilter: StatusFilter;
  onMaintenanceDateChange?: (equipmentId: string, typeId: MaintenanceTypeId, newDate: Date | null) => void;
  onMaintenanceComplete?: (equipmentId: string, typeId: MaintenanceTypeId) => void;
}

type SortField = 'tag' | 'area' | 'elevacao' | 'diasRestantesGeral' | 'statusGeral';
type SortOrder = 'asc' | 'desc';

const statusLabels = {
  ok: 'Em Dia',
  warning: 'Atenção',
  critical: 'Crítico',
  overdue: 'Atrasado',
  pending: 'Pendente',
};

export function EquipmentTable({ equipment, statusFilter, onMaintenanceDateChange, onMaintenanceComplete }: EquipmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('diasRestantesGeral');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTag, setSearchTag] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const areas = useMemo(() => {
    const unique = [...new Set(equipment.map(e => e.area))].sort();
    return unique;
  }, [equipment]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEquipment = equipment
    .filter(e => statusFilter === 'all' || e.statusGeral === statusFilter)
    .filter(e => areaFilter === 'all' || e.area === areaFilter)
    .filter(e => !searchTag || e.tag.toLowerCase().includes(searchTag.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'tag':
          comparison = a.tag.localeCompare(b.tag);
          break;
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
        case 'elevacao':
          comparison = a.elevacao - b.elevacao;
          break;
        case 'diasRestantesGeral':
          const aDays = a.diasRestantesGeral ?? 999;
          const bDays = b.diasRestantesGeral ?? 999;
          comparison = aDays - bDays;
          break;
        case 'statusGeral':
          const statusOrder = { overdue: 0, critical: 1, warning: 2, ok: 3 };
          comparison = statusOrder[a.statusGeral] - statusOrder[b.statusGeral];
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        'flex items-center gap-1 hover:text-foreground transition-colors',
        sortField === field ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="industrial-card overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por TAG (ex: SPD-101)"
            value={searchTag}
            onChange={e => setSearchTag(e.target.value)}
            className="pl-9 bg-muted/50 border-border"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 border-border">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Áreas</SelectItem>
            {areas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-12 p-4"></th>
              <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider w-32">
                <SortButton field="tag">TAG</SortButton>
              </th>
              <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider w-36">
                <SortButton field="area">Área</SortButton>
              </th>
              <th className="text-center p-4 font-semibold text-sm uppercase tracking-wider w-24">
                <SortButton field="elevacao">Andar</SortButton>
              </th>
              <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground flex-1">
                Próxima Manutenção
              </th>
              <th className="text-center p-4 font-semibold text-sm uppercase tracking-wider w-24">
                <SortButton field="diasRestantesGeral">Dias</SortButton>
              </th>
              <th className="text-center p-4 font-semibold text-sm uppercase tracking-wider w-32">
                <SortButton field="statusGeral">Status</SortButton>
              </th>
              <th className="text-center p-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground w-28">
                Serviços
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.map((equip, index) => {
              const isExpanded = expandedRows.has(equip.id);
              const criticalServices = equip.manutencoes.filter(m => m.status === 'overdue' || m.status === 'critical');
              
              return (
                <>
                  <tr
                    key={equip.id}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer',
                      'animate-slide-in'
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                    onClick={() => toggleRow(equip.id)}
                  >
                    <td className="p-4">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold text-foreground">{equip.tag}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm">
                        {equip.area}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-mono font-bold text-sm">
                        {equip.elevacao}º
                      </span>
                    </td>
                    <td className="p-4">
                      {equip.proximaManutencaoGeral ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm">
                            {equip.proximaManutencaoGeral.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <DaysRemainingBadge days={equip.diasRestantesGeral} status={equip.statusGeral} />
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={equip.statusGeral} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {criticalServices.length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-status-critical/20 text-status-critical">
                            {criticalServices.length} urgente{criticalServices.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {equip.manutencoes.length} tipos
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row - Maintenance Details with Editing */}
                  {isExpanded && (
                    <tr key={`${equip.id}-expanded`} className="bg-muted/20">
                      <td colSpan={8} className="p-0">
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Clique em um card para editar a data de manutenção
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {equip.manutencoes.map(m => (
                              <MaintenanceCard
                                key={m.typeId}
                                maintenance={m}
                                equipmentId={equip.id}
                                onDateChange={onMaintenanceDateChange}
                                onComplete={onMaintenanceComplete}
                                editable={!!onMaintenanceDateChange}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredEquipment.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum equipamento encontrado com o filtro selecionado.</p>
        </div>
      )}
    </div>
  );
}

function DaysRemainingBadge({ days, status }: { days: number | null; status: Equipment['statusGeral'] }) {
  if (days === null) return <span className="text-muted-foreground">-</span>;
  
  const isOverdue = days < 0;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-mono font-bold text-sm',
        status === 'ok' && 'bg-status-ok/15 text-status-ok',
        status === 'warning' && 'bg-status-warning/15 text-status-warning',
        status === 'critical' && 'bg-status-critical/15 text-status-critical',
        status === 'overdue' && 'bg-status-overdue/20 text-status-overdue animate-pulse'
      )}
    >
      <Clock className="h-3 w-3" />
      {isOverdue ? `${Math.abs(days)}d atrasado` : `${days}d`}
    </div>
  );
}

function StatusBadge({ status }: { status: Equipment['statusGeral'] }) {
  return (
    <span
      className={cn(
        'status-badge',
        status === 'ok' && 'status-ok',
        status === 'warning' && 'status-warning',
        status === 'critical' && 'status-critical',
        status === 'overdue' && 'status-overdue'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'ok' && 'bg-status-ok',
          status === 'warning' && 'bg-status-warning',
          status === 'critical' && 'bg-status-critical',
          status === 'overdue' && 'bg-status-overdue'
        )}
      />
      {statusLabels[status]}
    </span>
  );
}
