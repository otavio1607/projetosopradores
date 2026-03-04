import { supabase } from '@/integrations/supabase/client';
import { Equipment, MaintenanceRecord } from '@/types/equipment';
import { calculateStats, getOverallStatus, getNextMaintenance } from '@/lib/maintenanceCalculations';
import type { MaintenanceStats } from '@/types/equipment';

/**
 * Service para operações com equipamentos via Supabase
 * Nota: As tabelas precisam ser criadas no banco antes de usar este service.
 * Enquanto isso, o app usa dados do Excel (excelParser.ts).
 */
export const equipmentService = {
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .select('*');
    if (error) throw error;
    return (data || []).map((row: any) => transformEquipmentRow(row));
  },

  async getById(id: string): Promise<Equipment | null> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return null;
    return transformEquipmentRow(data);
  },

  async create(equipment: Partial<Equipment>): Promise<Equipment> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .insert({
        tag: equipment.tag,
        elevacao: equipment.elevacao,
        altura: equipment.altura,
        descricao: equipment.descricao,
        area: equipment.area,
        tipo: equipment.tipo,
      })
      .select()
      .single();
    if (error) throw error;
    return transformEquipmentRow(data);
  },

  async update(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .update({
        tag: updates.tag,
        elevacao: updates.elevacao,
        altura: updates.altura,
        descricao: updates.descricao,
        area: updates.area,
        tipo: updates.tipo,
        status_geral: updates.statusGeral,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformEquipmentRow(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('equipment')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByArea(area: string): Promise<Equipment[]> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .select('*')
      .eq('area', area);
    if (error) throw error;
    return (data || []).map((row: any) => transformEquipmentRow(row));
  },

  async getByStatus(status: string): Promise<Equipment[]> {
    const { data, error } = await (supabase as any)
      .from('equipment')
      .select('*')
      .eq('status_geral', status);
    if (error) throw error;
    return (data || []).map((row: any) => transformEquipmentRow(row));
  },
};

export const maintenanceHistoryService = {
  async getByEquipmentId(equipmentId: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('maintenance_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('data_manutencao', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      equipmentId: row.equipment_id,
      maintenanceTypeId: row.maintenance_type_id,
      dataManutencao: new Date(row.data_manutencao),
      dataProxima: row.data_proxima ? new Date(row.data_proxima) : null,
      realizadoPor: row.realizado_por,
      notas: row.notas || undefined,
      resultado: row.resultado,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  async create(history: any): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('maintenance_history')
      .insert({
        equipment_id: history.equipmentId,
        maintenance_type_id: history.maintenanceTypeId,
        data_manutencao: history.dataManutencao,
        data_proxima: history.dataProxima,
        realizado_por: history.realizadoPor,
        notas: history.notas,
        resultado: history.resultado,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const alertService = {
  async getUnread(): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('alerts')
      .select('*')
      .eq('lido', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      equipmentId: row.equipment_id,
      maintenanceTypeId: row.maintenance_type_id,
      tipo: row.tipo,
      mensagem: row.mensagem,
      lido: row.lido,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('alerts')
      .update({ lido: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { error } = await (supabase as any)
      .from('alerts')
      .update({ lido: true })
      .eq('lido', false);
    if (error) throw error;
  },

  async create(alert: any): Promise<any> {
    const { data, error } = await (supabase as any)
      .from('alerts')
      .insert({
        equipment_id: alert.equipmentId,
        maintenance_type_id: alert.maintenanceTypeId,
        tipo: alert.tipo,
        mensagem: alert.mensagem,
        lido: alert.lido,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByEquipmentId(equipmentId: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('alerts')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export const statsService = {
  async getStats(): Promise<MaintenanceStats> {
    const equipment = await equipmentService.getAll();
    return calculateStats(equipment);
  },

  async getOverdueRate(): Promise<number> {
    const equipment = await equipmentService.getAll();
    const overdue = equipment.filter(e => e.statusGeral === 'overdue').length;
    return equipment.length > 0 ? (overdue / equipment.length) * 100 : 0;
  },

  async getMostCritical(limit: number = 10): Promise<Equipment[]> {
    const equipment = await equipmentService.getAll();
    const statusPriority = { overdue: 0, critical: 1, warning: 2, ok: 3 };
    return equipment
      .sort((a, b) =>
        (statusPriority[a.statusGeral] || 3) - (statusPriority[b.statusGeral] || 3)
      )
      .slice(0, limit);
  },
};

function transformEquipmentRow(row: any): Equipment {
  const manutencoes: MaintenanceRecord[] = (row.maintenance_records || []).map((m: any) => ({
    typeId: m.type_id || m.typeId,
    label: m.label,
    periodicidade: m.periodicidade,
    ultimaManutencao: m.ultima_manutencao ? new Date(m.ultima_manutencao) : null,
    proximaManutencao: m.proxima_manutencao ? new Date(m.proxima_manutencao) : null,
    diasRestantes: m.dias_restantes,
    status: m.status,
  }));

  return {
    id: row.id,
    tag: row.tag,
    elevacao: row.elevacao,
    altura: row.altura,
    descricao: row.descricao || '',
    area: row.area,
    tipo: row.tipo,
    manutencoes,
    statusGeral: row.status_geral || 'ok',
    proximaManutencaoGeral: row.proxima_manutencao_geral ? new Date(row.proxima_manutencao_geral) : null,
    diasRestantesGeral: row.dias_restantes_geral ?? null,
  };
}
