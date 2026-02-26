import { useState, useCallback } from 'react';
import { Equipment } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterCriteria {
  searchTerm?: string;
  status?: 'all' | 'ok' | 'warning' | 'critical' | 'overdue';
  area?: string;
  daysRange?: { min: number; max: number };
  type?: string;
}

interface AdvancedFiltersProps {
  equipment: Equipment[];
  onFiltersChange: (filtered: Equipment[]) => void;
}

/**
 * Componente de filtros avançados para equipamentos
 */
export function AdvancedFilters({ equipment, onFiltersChange }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    status: 'all',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique values for filters
  const areas = Array.from(new Set(equipment.map(e => e.area)));
  const types = Array.from(new Set(equipment.map(e => e.tipo)));

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = equipment;

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.tag.toLowerCase().includes(term) ||
          e.descricao.toLowerCase().includes(term) ||
          e.area.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(e => e.statusGeral === filters.status);
    }

    // Area filter
    if (filters.area) {
      filtered = filtered.filter(e => e.area === filters.area);
    }

    // Days remaining filter
    if (filters.daysRange) {
      filtered = filtered.filter(e => {
        const days = e.diasRestantesGeral;
        if (days === null) return false;
        return days >= filters.daysRange!.min && days <= filters.daysRange!.max;
      });
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(e => e.tipo === filters.type);
    }

    onFiltersChange(filtered);
  }, [filters, equipment, onFiltersChange]);

  // Apply filters when they change
  useState(() => {
    applyFilters();
  }, [filters, applyFilters]);

  const handleClearFilters = () => {
    setFilters({ status: 'all' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter size={16} />
            Filtros Avançados
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFilters}
            className="text-red-600 hover:text-red-700"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <Card className="p-4 bg-gray-50 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Tag, descrição, área..."
              value={filters.searchTerm || ''}
              onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    status: value as FilterCriteria['status'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ok">✓ Em dia</SelectItem>
                  <SelectItem value="warning">⚠️ Atenção</SelectItem>
                  <SelectItem value="critical">🔴 Crítico</SelectItem>
                  <SelectItem value="overdue">❌ Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <Select
                value={filters.area || ''}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    area: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <Select
                value={filters.type || ''}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    type: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias até próxima manutenção
              </label>
              <Select
                value={filters.daysRange ? `${filters.daysRange.min}-${filters.daysRange.max}` : ''}
                onValueChange={value => {
                  if (value === '') {
                    setFilters({ ...filters, daysRange: undefined });
                  } else {
                    const [min, max] = value.split('-').map(Number);
                    setFilters({
                      ...filters,
                      daysRange: { min, max },
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione intervalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="0-7">0-7 dias (Crítico)</SelectItem>
                  <SelectItem value="8-30">8-30 dias (Aviso)</SelectItem>
                  <SelectItem value="31-90">31-90 dias</SelectItem>
                  <SelectItem value="91-999">90+ dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Filtros ativos:</p>
              <div className="flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setFilters({ ...filters, searchTerm: undefined })}
                  >
                    Busca: {filters.searchTerm}
                    <X size={12} />
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setFilters({ ...filters, status: 'all' })}
                  >
                    Status: {filters.status}
                    <X size={12} />
                  </Badge>
                )}
                {filters.area && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setFilters({ ...filters, area: undefined })}
                  >
                    Área: {filters.area}
                    <X size={12} />
                  </Badge>
                )}
                {filters.type && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setFilters({ ...filters, type: undefined })}
                  >
                    Tipo: {filters.type}
                    <X size={12} />
                  </Badge>
                )}
                {filters.daysRange && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setFilters({ ...filters, daysRange: undefined })}
                  >
                    {filters.daysRange.min}-{filters.daysRange.max} dias
                    <X size={12} />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Results info */}
      <p className="text-sm text-gray-600">
        Exibindo <span className="font-medium">resultados</span> de {equipment.length} equipamentos
      </p>
    </div>
  );
}
