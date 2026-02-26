import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { StatusFilter } from '@/types/equipment';

interface FilterPanelProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  areaFilter: string;
  onAreaChange: (area: string) => void;
  areas: string[];
  tipoFilter: string;
  onTipoChange: (tipo: string) => void;
  tipos: string[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({
  statusFilter,
  onStatusChange,
  areaFilter,
  onAreaChange,
  areas,
  tipoFilter,
  onTipoChange,
  tipos,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros:</span>
      </div>

      <Select value={statusFilter} onValueChange={v => onStatusChange(v as StatusFilter)}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="ok">Em Dia</SelectItem>
          <SelectItem value="warning">Atenção</SelectItem>
          <SelectItem value="critical">Crítico</SelectItem>
          <SelectItem value="overdue">Atrasado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={areaFilter} onValueChange={onAreaChange}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Áreas</SelectItem>
          {areas.map(area => (
            <SelectItem key={area} value={area}>{area}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tipoFilter} onValueChange={onTipoChange}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          {tipos.map(tipo => (
            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1 text-xs">
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
