import { describe, it, expect, beforeEach } from 'vitest';
import { Equipment, MAINTENANCE_TYPES } from '@/types/equipment';
import {
  saveEquipmentStorage,
  loadEquipmentStorage,
  clearEquipmentStorage,
} from '@/utils/localStorageUtils';

function makeEquipment(tag: string, date: Date | null = null): Equipment {
  return {
    id: `id-${tag}`,
    tag,
    elevacao: 14,
    altura: 1.0,
    descricao: 'Test equipment',
    area: 'Caldeira',
    tipo: 'Rotativo',
    statusGeral: 'ok',
    proximaManutencaoGeral: date,
    diasRestantesGeral: date ? 30 : null,
    manutencoes: MAINTENANCE_TYPES.map(t => ({
      typeId: t.id,
      label: t.label,
      periodicidade: t.periodicidade,
      ultimaManutencao: null,
      proximaManutencao: date,
      diasRestantes: date ? 30 : null,
      status: 'ok',
    })),
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('localStorageUtils', () => {
  it('returns null when storage is empty', () => {
    expect(loadEquipmentStorage()).toBeNull();
  });

  it('saves and loads equipment without dates', () => {
    const eq = makeEquipment('SPD-101');
    saveEquipmentStorage([eq]);
    const loaded = loadEquipmentStorage();
    expect(loaded).not.toBeNull();
    expect(loaded).toHaveLength(1);
    expect(loaded![0].tag).toBe('SPD-101');
    expect(loaded![0].proximaManutencaoGeral).toBeNull();
  });

  it('saves and loads equipment with Date fields restored', () => {
    const date = new Date('2026-06-15T00:00:00.000Z');
    const eq = makeEquipment('SPD-202', date);
    saveEquipmentStorage([eq]);
    const loaded = loadEquipmentStorage();
    expect(loaded).not.toBeNull();
    const loadedEq = loaded![0];
    expect(loadedEq.proximaManutencaoGeral).toBeInstanceOf(Date);
    expect(loadedEq.proximaManutencaoGeral!.toISOString()).toBe(date.toISOString());
    // Maintenance record dates also restored
    loadedEq.manutencoes.forEach(m => {
      expect(m.proximaManutencao).toBeInstanceOf(Date);
      expect(m.proximaManutencao!.toISOString()).toBe(date.toISOString());
    });
  });

  it('saves and loads multiple equipment entries', () => {
    const list = [makeEquipment('SPD-101'), makeEquipment('SPD-102'), makeEquipment('SPD-103')];
    saveEquipmentStorage(list);
    const loaded = loadEquipmentStorage();
    expect(loaded).toHaveLength(3);
    expect(loaded!.map(e => e.tag)).toEqual(['SPD-101', 'SPD-102', 'SPD-103']);
  });

  it('returns null after clearEquipmentStorage', () => {
    saveEquipmentStorage([makeEquipment('SPD-101')]);
    clearEquipmentStorage();
    expect(loadEquipmentStorage()).toBeNull();
  });

  it('overwrites previous data on subsequent saves', () => {
    saveEquipmentStorage([makeEquipment('SPD-101')]);
    saveEquipmentStorage([makeEquipment('SPD-200'), makeEquipment('SPD-201')]);
    const loaded = loadEquipmentStorage();
    expect(loaded).toHaveLength(2);
    expect(loaded![0].tag).toBe('SPD-200');
  });

  it('returns null for invalid JSON in storage', () => {
    localStorage.setItem('sopradores_equipment_v1', 'not-valid-json');
    expect(loadEquipmentStorage()).toBeNull();
  });

  it('returns null for empty array stored', () => {
    localStorage.setItem('sopradores_equipment_v1', '[]');
    expect(loadEquipmentStorage()).toBeNull();
  });
});
