import { describe, it, expect } from 'vitest';
import { calculateStats } from '@/utils/excelParser';
import type { Equipment, MaintenanceRecord } from '@/types/equipment';

function makeEquipment(statusGeral: Equipment['statusGeral']): Equipment {
  return {
    id: 'test-1',
    tag: 'SPD-101',
    elevacao: 16,
    altura: 1.0,
    descricao: 'Soprador de Fuligem Rotativo',
    area: 'Caldeira',
    tipo: 'Rotativo',
    manutencoes: [] as MaintenanceRecord[],
    statusGeral,
    proximaManutencaoGeral: null,
    diasRestantesGeral: null,
  };
}

describe('calculateStats', () => {
  it('returns zeroed stats for empty equipment list', () => {
    const stats = calculateStats([]);
    expect(stats).toEqual({ total: 0, emDia: 0, atencao: 0, critico: 0, atrasado: 0 });
  });

  it('counts total correctly', () => {
    const equipment = [
      makeEquipment('ok'),
      makeEquipment('warning'),
      makeEquipment('critical'),
      makeEquipment('overdue'),
    ];
    expect(calculateStats(equipment).total).toBe(4);
  });

  it('counts emDia (ok status) correctly', () => {
    const equipment = [makeEquipment('ok'), makeEquipment('ok'), makeEquipment('warning')];
    expect(calculateStats(equipment).emDia).toBe(2);
  });

  it('counts atencao (warning status) correctly', () => {
    const equipment = [makeEquipment('ok'), makeEquipment('warning'), makeEquipment('warning')];
    expect(calculateStats(equipment).atencao).toBe(2);
  });

  it('counts critico (critical status) correctly', () => {
    const equipment = [makeEquipment('critical'), makeEquipment('ok')];
    expect(calculateStats(equipment).critico).toBe(1);
  });

  it('counts atrasado (overdue status) correctly', () => {
    const equipment = [makeEquipment('overdue'), makeEquipment('overdue'), makeEquipment('ok')];
    expect(calculateStats(equipment).atrasado).toBe(2);
  });

  it('stats are mutually exclusive and sum to total', () => {
    const equipment = [
      makeEquipment('ok'),
      makeEquipment('warning'),
      makeEquipment('critical'),
      makeEquipment('overdue'),
    ];
    const stats = calculateStats(equipment);
    expect(stats.emDia + stats.atencao + stats.critico + stats.atrasado).toBe(stats.total);
  });
});
