import { Equipment, ServiceOrder } from '@/types/equipment';

const STORAGE_KEY = 'sopradores_equipment_v1';

/** Serializes Equipment[] for JSON storage, converting Date fields to ISO strings. */
function serializeEquipment(equipment: Equipment[]) {
  return equipment.map(eq => ({
    ...eq,
    proximaManutencaoGeral: eq.proximaManutencaoGeral?.toISOString() ?? null,
    manutencoes: eq.manutencoes.map(m => ({
      ...m,
      ultimaManutencao: m.ultimaManutencao?.toISOString() ?? null,
      proximaManutencao: m.proximaManutencao?.toISOString() ?? null,
    })),
  }));
}

type SerializedEquipment = ReturnType<typeof serializeEquipment>[number];

/** Deserializes stored JSON back to Equipment[], restoring Date objects. */
function deserializeEquipment(raw: SerializedEquipment[]): Equipment[] {
  return raw.map(eq => ({
    ...eq,
    proximaManutencaoGeral: eq.proximaManutencaoGeral
      ? new Date(eq.proximaManutencaoGeral)
      : null,
    manutencoes: eq.manutencoes.map(m => ({
      ...m,
      ultimaManutencao: m.ultimaManutencao ? new Date(m.ultimaManutencao) : null,
      proximaManutencao: m.proximaManutencao ? new Date(m.proximaManutencao) : null,
    })),
  }));
}

/** Persists the current equipment list to localStorage. */
export function saveEquipmentStorage(equipment: Equipment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeEquipment(equipment)));
  } catch (err) {
    console.warn('[storage] Failed to save equipment:', err);
  }
}

/**
 * Loads the equipment list from localStorage.
 * Returns `null` when no data is stored or parsing fails.
 */
export function loadEquipmentStorage(): Equipment[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SerializedEquipment[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return deserializeEquipment(parsed);
  } catch (err) {
    console.warn('[storage] Failed to load equipment:', err);
    return null;
  }
}

/** Removes the stored equipment list from localStorage. */
export function clearEquipmentStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Service Orders ──────────────────────────────────────────────────────────

const OS_STORAGE_KEY = 'sopradores_os_v1';

function serializeOrders(orders: ServiceOrder[]) {
  return orders.map(o => ({
    ...o,
    dataCriacao: o.dataCriacao.toISOString(),
    dataPrevista: o.dataPrevista ? o.dataPrevista.toISOString() : null,
    dataConclusao: o.dataConclusao ? o.dataConclusao.toISOString() : null,
  }));
}

type SerializedOrder = ReturnType<typeof serializeOrders>[number];

function deserializeOrders(raw: SerializedOrder[]): ServiceOrder[] {
  return raw.map(o => ({
    ...o,
    dataCriacao: new Date(o.dataCriacao),
    dataPrevista: o.dataPrevista ? new Date(o.dataPrevista) : null,
    dataConclusao: o.dataConclusao ? new Date(o.dataConclusao) : null,
  }));
}

export function saveOrdersStorage(orders: ServiceOrder[]): void {
  try {
    localStorage.setItem(OS_STORAGE_KEY, JSON.stringify(serializeOrders(orders)));
  } catch (err) {
    console.warn('[storage] Failed to save service orders:', err);
  }
}

export function loadOrdersStorage(): ServiceOrder[] | null {
  try {
    const raw = localStorage.getItem(OS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: SerializedOrder[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return deserializeOrders(parsed);
  } catch (err) {
    console.warn('[storage] Failed to load service orders:', err);
    return null;
  }
}
