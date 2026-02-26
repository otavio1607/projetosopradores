import { describe, it, expect } from 'vitest';
import { formatDaysRemaining, formatPercentage, formatEquipmentTag } from '@/utils/formatters';
import { isValidDate, isValidEquipmentId } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errorHandler';
import { filterEquipment, getUniqueAreas } from '@/services/maintenanceService';

describe('formatters', () => {
  describe('formatDaysRemaining', () => {
    it('returns "Pendente" for null', () => {
      expect(formatDaysRemaining(null)).toBe('Pendente');
    });
    it('formats overdue days', () => {
      expect(formatDaysRemaining(-5)).toBe('5 dias atrasado');
    });
    it('returns "Hoje" for 0', () => {
      expect(formatDaysRemaining(0)).toBe('Hoje');
    });
    it('returns "Amanhã" for 1', () => {
      expect(formatDaysRemaining(1)).toBe('Amanhã');
    });
    it('formats future days', () => {
      expect(formatDaysRemaining(15)).toBe('15 dias');
    });
  });

  describe('formatPercentage', () => {
    it('returns 0% for zero total', () => {
      expect(formatPercentage(5, 0)).toBe('0%');
    });
    it('calculates percentage correctly', () => {
      expect(formatPercentage(1, 4)).toBe('25%');
    });
    it('rounds to nearest integer', () => {
      expect(formatPercentage(1, 3)).toBe('33%');
    });
  });

  describe('formatEquipmentTag', () => {
    it('formats numeric id', () => {
      expect(formatEquipmentTag(101)).toBe('SPD 101');
    });
    it('pads small numbers', () => {
      expect(formatEquipmentTag(5)).toBe('SPD 005');
    });
  });
});

describe('validators', () => {
  describe('isValidDate', () => {
    it('validates correct date format', () => {
      expect(isValidDate('01/01/2024')).toBe(true);
    });
    it('rejects invalid format', () => {
      expect(isValidDate('2024-01-01')).toBe(false);
    });
    it('rejects invalid month', () => {
      expect(isValidDate('01/13/2024')).toBe(false);
    });
  });

  describe('isValidEquipmentId', () => {
    it('validates correct ID', () => {
      expect(isValidEquipmentId('SPD 101')).toBe(true);
      expect(isValidEquipmentId('SPD101')).toBe(true);
    });
    it('rejects invalid ID', () => {
      expect(isValidEquipmentId('ABC 101')).toBe(false);
    });
  });
});

describe('errorHandler', () => {
  it('handles Error instance', () => {
    expect(getErrorMessage(new Error('test error'))).toBe('test error');
  });
  it('handles string error', () => {
    expect(getErrorMessage('string error')).toBe('string error');
  });
  it('handles unknown error', () => {
    const msg = getErrorMessage({ code: 500 });
    expect(msg).toBe('Erro inesperado. Tente novamente.');
  });
});

describe('maintenanceService', () => {
  const mockEquipment = [
    {
      id: '101',
      tag: 'SPD 101',
      elevacao: 16,
      altura: 1.0,
      descricao: 'Test',
      area: 'Caldeira',
      tipo: 'Rotativo',
      manutencoes: [],
      statusGeral: 'ok' as const,
      proximaManutencaoGeral: null,
      diasRestantesGeral: null,
    },
    {
      id: '131',
      tag: 'SPD 131',
      elevacao: 14,
      altura: 2.3,
      descricao: 'Test 2',
      area: 'Superaquecedor',
      tipo: 'Retrátil',
      manutencoes: [],
      statusGeral: 'overdue' as const,
      proximaManutencaoGeral: null,
      diasRestantesGeral: null,
    },
  ];

  describe('filterEquipment', () => {
    it('filters by search query', () => {
      const result = filterEquipment(mockEquipment, { search: 'SPD 101' });
      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe('SPD 101');
    });
    it('filters by status', () => {
      const result = filterEquipment(mockEquipment, { status: 'overdue' });
      expect(result).toHaveLength(1);
      expect(result[0].statusGeral).toBe('overdue');
    });
    it('filters by area', () => {
      const result = filterEquipment(mockEquipment, { area: 'Caldeira' });
      expect(result).toHaveLength(1);
      expect(result[0].area).toBe('Caldeira');
    });
    it('returns all when no filters', () => {
      expect(filterEquipment(mockEquipment, {})).toHaveLength(2);
    });
  });

  describe('getUniqueAreas', () => {
    it('returns unique areas', () => {
      const areas = getUniqueAreas(mockEquipment);
      expect(areas).toContain('Caldeira');
      expect(areas).toContain('Superaquecedor');
      expect(areas).toHaveLength(2);
    });
  });
});
