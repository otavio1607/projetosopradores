import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDaysRemaining,
  getStatus,
  getOverallStatus,
  getNextMaintenance,
  calculateStats,
  calculateOverdueRate,
  findRecurrentIssues,
} from '@/lib/maintenanceCalculations';
import { Equipment, MaintenanceRecord } from '@/lib/validationSchemas';

const mockMaintenanceRecord = (
  overrides?: Partial<MaintenanceRecord>
): MaintenanceRecord => ({
  id: 'test-id',
  typeId: 'troca_cabos',
  label: 'Troca de Cabos',
  periodicidade: 'Anual',
  ultimaManutencao: null,
  proximaManutencao: null,
  diasRestantes: null,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockEquipment = (overrides?: Partial<Equipment>): Equipment => ({
  id: 'eq-1',
  tag: 'SOP-001',
  elevacao: 10,
  altura: 5,
  descricao: 'Soprador de fuligem principal',
  area: 'Caldeira',
  tipo: 'Industrial',
  manutencoes: [mockMaintenanceRecord()],
  statusGeral: 'ok',
  proximaManutencaoGeral: null,
  diasRestantesGeral: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Maintenance Calculations', () => {
  describe('calculateDaysRemaining', () => {
    it('should return null for null date', () => {
      expect(calculateDaysRemaining(null)).toBeNull();
    });

    it('should calculate positive days remaining for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const days = calculateDaysRemaining(tomorrow);
      expect(days).toBe(5);
    });

    it('should calculate negative days for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 5);
      const days = calculateDaysRemaining(yesterday);
      expect(days).toBe(-5);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = calculateDaysRemaining(today);
      expect(days).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return pending for null days', () => {
      expect(getStatus(null)).toBe('pending');
    });

    it('should return overdue for negative days', () => {
      expect(getStatus(-5)).toBe('overdue');
    });

    it('should return critical for 0-7 days', () => {
      expect(getStatus(0)).toBe('critical');
      expect(getStatus(7)).toBe('critical');
    });

    it('should return warning for 8-30 days', () => {
      expect(getStatus(8)).toBe('warning');
      expect(getStatus(30)).toBe('warning');
    });

    it('should return ok for >30 days', () => {
      expect(getStatus(31)).toBe('ok');
      expect(getStatus(100)).toBe('ok');
    });
  });

  describe('getOverallStatus', () => {
    it('should return overdue if any maintenance is overdue', () => {
      const manutencoes = [
        mockMaintenanceRecord({ status: 'ok' }),
        mockMaintenanceRecord({ status: 'overdue' }),
      ];
      expect(getOverallStatus(manutencoes)).toBe('overdue');
    });

    it('should return critical if any is critical and none overdue', () => {
      const manutencoes = [
        mockMaintenanceRecord({ status: 'ok' }),
        mockMaintenanceRecord({ status: 'critical' }),
      ];
      expect(getOverallStatus(manutencoes)).toBe('critical');
    });

    it('should return warning if any is warning', () => {
      const manutencoes = [
        mockMaintenanceRecord({ status: 'ok' }),
        mockMaintenanceRecord({ status: 'warning' }),
      ];
      expect(getOverallStatus(manutencoes)).toBe('warning');
    });

    it('should return ok if all are ok', () => {
      const manutencoes = [
        mockMaintenanceRecord({ status: 'ok' }),
        mockMaintenanceRecord({ status: 'ok' }),
      ];
      expect(getOverallStatus(manutencoes)).toBe('ok');
    });
  });

  describe('getNextMaintenance', () => {
    it('should return null for empty maintenance array', () => {
      const result = getNextMaintenance([]);
      expect(result.date).toBeNull();
      expect(result.diasRestantes).toBeNull();
    });

    it('should find earliest maintenance date', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const manutencoes = [
        mockMaintenanceRecord({ proximaManutencao: nextWeek }),
        mockMaintenanceRecord({ proximaManutencao: tomorrow }),
        mockMaintenanceRecord({ proximaManutencao: today }),
      ];

      const result = getNextMaintenance(manutencoes);
      expect(result.date).toEqual(today);
      expect(result.diasRestantes).toBe(0);
    });
  });

  describe('calculateStats', () => {
    it('should count equipment by status', () => {
      const equipment = [
        mockEquipment({ statusGeral: 'ok' }),
        mockEquipment({ statusGeral: 'ok' }),
        mockEquipment({ statusGeral: 'warning' }),
        mockEquipment({ statusGeral: 'critical' }),
        mockEquipment({ statusGeral: 'overdue' }),
      ];

      const stats = calculateStats(equipment);

      expect(stats.total).toBe(5);
      expect(stats.emDia).toBe(2);
      expect(stats.atencao).toBe(1);
      expect(stats.critico).toBe(1);
      expect(stats.atrasado).toBe(1);
    });

    it('should handle empty equipment array', () => {
      const stats = calculateStats([]);
      expect(stats.total).toBe(0);
      expect(stats.emDia).toBe(0);
    });
  });

  describe('calculateOverdueRate', () => {
    it('should calculate percentage of overdue equipment', () => {
      const equipment = [
        mockEquipment({ statusGeral: 'overdue' }),
        mockEquipment({ statusGeral: 'overdue' }),
        mockEquipment({ statusGeral: 'ok' }),
      ];

      const rate = calculateOverdueRate(equipment);
      expect(rate).toBeCloseTo(66.67, 1);
    });

    it('should return 0 for no overdue', () => {
      const equipment = [
        mockEquipment({ statusGeral: 'ok' }),
        mockEquipment({ statusGeral: 'warning' }),
      ];

      expect(calculateOverdueRate(equipment)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateOverdueRate([])).toBe(0);
    });
  });

  describe('findRecurrentIssues', () => {
    it('should find maintenance types that are repeatedly overdue', () => {
      const equipment = [
        mockEquipment({
          id: 'eq-1',
          tag: 'SOP-001',
          manutencoes: [
            mockMaintenanceRecord({ typeId: 'troca_cabos', status: 'overdue' }),
            mockMaintenanceRecord({ typeId: 'troca_cabos', status: 'overdue' }),
            mockMaintenanceRecord({ typeId: 'troca_cabos', status: 'overdue' }),
          ],
        }),
      ];

      const issues = findRecurrentIssues(equipment, 2);
      expect(issues.length).toBe(1);
      expect(issues[0].equipmentTag).toBe('SOP-001');
      expect(issues[0].maintenanceType).toBe('Troca de Cabos');
      expect(issues[0].count).toBe(3);
    });

    it('should filter by threshold', () => {
      const equipment = [
        mockEquipment({
          id: 'eq-1',
          tag: 'SOP-001',
          manutencoes: [
            mockMaintenanceRecord({ typeId: 'troca_cabos', status: 'overdue' }),
            mockMaintenanceRecord({ typeId: 'troca_cabos', status: 'overdue' }),
          ],
        }),
      ];

      const issues = findRecurrentIssues(equipment, 3);
      expect(issues.length).toBe(0);
    });
  });
});
