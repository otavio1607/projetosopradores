import { Equipment, MaintenanceStats } from '@/types/equipment';

export function filterEquipment(
  equipment: Equipment[],
  filters: {
    search?: string;
    status?: string;
    area?: string;
    tipo?: string;
    elevacao?: number;
  }
): Equipment[] {
  return equipment.filter(eq => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesTag = eq.tag.toLowerCase().includes(q);
      const matchesDesc = eq.descricao.toLowerCase().includes(q);
      const matchesArea = eq.area.toLowerCase().includes(q);
      if (!matchesTag && !matchesDesc && !matchesArea) return false;
    }

    if (filters.status && filters.status !== 'all') {
      if (eq.statusGeral !== filters.status) return false;
    }

    if (filters.area && filters.area !== 'all') {
      if (eq.area !== filters.area) return false;
    }

    if (filters.tipo && filters.tipo !== 'all') {
      if (eq.tipo !== filters.tipo) return false;
    }

    if (filters.elevacao !== undefined) {
      if (eq.elevacao !== filters.elevacao) return false;
    }

    return true;
  });
}

export function getUniqueAreas(equipment: Equipment[]): string[] {
  return [...new Set(equipment.map(eq => eq.area))].sort();
}

export function getUniqueTipos(equipment: Equipment[]): string[] {
  return [...new Set(equipment.map(eq => eq.tipo))].sort();
}

export function getUniqueElevacoes(equipment: Equipment[]): number[] {
  return [...new Set(equipment.map(eq => eq.elevacao))].sort((a, b) => a - b);
}

export function sortEquipment(
  equipment: Equipment[],
  sortBy: keyof Pick<Equipment, 'tag' | 'area' | 'elevacao' | 'statusGeral' | 'diasRestantesGeral'>,
  direction: 'asc' | 'desc' = 'asc'
): Equipment[] {
  return [...equipment].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
    if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
