import { supabase } from '@/integrations/supabase/client';
import { Equipment, MaintenanceRecord, MaintenanceHistory, Alert, MaintenanceStats } from '@/lib/validationSchemas';
import { equipmentSchema, maintenanceRecordSchema, maintenanceHistorySchema, alertSchema } from '@/lib/validationSchemas';
import { calculateStats, getOverallStatus, getNextMaintenance } from '@/lib/maintenanceCalculations';

/**
 * Service para operações com equipamentos
 */
export const equipmentService = {
  /**
   * Busca todos os equipamentos com suas manutenções
   */
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        tag,
        elevacao,
        altura,
        descricao,
        area,
        tipo,
        status_geral,
        proxima_manutencao_geral,
        dias_restantes_geral,
        created_at,
        updated_at,
        maintenance_records (
          id,
          type_id,
          label,
          periodicidade,
          ultima_manutencao,
          proxima_manutencao,
          dias_restantes,
          status,
          created_at,
          updated_at
        )
      `);

    if (error) throw error;

    return data.map(row => transformEquipmentRow(row));
  },

  /**
   * Busca um equipamento específico pelo ID
   */
  async getById(id: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        tag,
        elevacao,
        altura,
        descricao,
        area,
        tipo,
        status_geral,
        proxima_manutencao_geral,
        dias_restantes_geral,
        created_at,
        updated_at,
        maintenance_records (
          id,
          type_id,
          label,
          periodicidade,
          ultima_manutencao,
          proxima_manutencao,
          dias_restantes,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return transformEquipmentRow(data);
  },

  /**
   * Cria um novo equipamento
   */
  async create(equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> {
    const validated = equipmentSchema.parse(equipment);

    const { data, error } = await supabase
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

  /**
   * Atualiza um equipamento
   */
  async update(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const { data, error } = await supabase
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

  /**
   * Deleta um equipamento
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Busca equipamentos por área
   */
  async getByArea(area: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('area', area);

    if (error) throw error;

    return data.map(row => transformEquipmentRow(row));
  },

  /**
   * Busca equipamentos por status
   */
  async getByStatus(status: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('status_geral', status);

    if (error) throw error;

    return data.map(row => transformEquipmentRow(row));
  },
};

/**
 * Service para operações com histórico de manutenção
 */
export const maintenanceHistoryService = {
  /**
   * Busca histórico de um equipamento
   */
  async getByEquipmentId(equipmentId: string): Promise<MaintenanceHistory[]> {
    const { data, error } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('data_manutencao', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
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

  /**
   * Registra uma manutenção realizada
   */
  async create(history: Omit<MaintenanceHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceHistory> {
    const validated = maintenanceHistorySchema.parse(history);

    const { data, error } = await supabase
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

    return {
      id: data.id,
      equipmentId: data.equipment_id,
      maintenanceTypeId: data.maintenance_type_id,
      dataManutencao: new Date(data.data_manutencao),
      dataProxima: data.data_proxima ? new Date(data.data_proxima) : null,
      realizadoPor: data.realizado_por,
      notas: data.notas,
      resultado: data.resultado,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Busca histórico entre datas
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<MaintenanceHistory[]> {
    const { data, error } = await supabase
      .from('maintenance_history')
      .select('*')
      .gte('data_manutencao', startDate.toISOString().split('T')[0])
      .lte('data_manutencao', endDate.toISOString().split('T')[0])
      .order('data_manutencao', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      equipmentId: row.equipment_id,
      maintenanceTypeId: row.maintenance_type_id,
      dataManutencao: new Date(row.data_manutencao),
      dataProxima: row.data_proxima ? new Date(row.data_proxima) : null,
      realizadoPor: row.realizado_por,
      notas: row.notas,
      resultado: row.resultado,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },
};

/**
 * Service para gerenciar alertas
 */
export const alertService = {
  /**
   * Busca alertas não lidos
   */
  async getUnread(): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('lido', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
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

  /**
   * Marca um alerta como lido
   */
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ lido: true })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Marca todos os alertas como lidos
   */
  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ lido: true })
      .eq('lido', false);

    if (error) throw error;
  },

  /**
   * Cria um alerta
   */
  async create(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    const { data, error } = await supabase
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

    return {
      id: data.id,
      equipmentId: data.equipment_id,
      maintenanceTypeId: data.maintenance_type_id,
      tipo: data.tipo,
      mensagem: data.mensagem,
      lido: data.lido,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Busca alertas de um equipamento específico
   */
  async getByEquipmentId(equipmentId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
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
};

/**
 * Service para estatísticas
 */
export const statsService = {
  /**
   * Calcula estatísticas de manutenção
   */
  async getStats(): Promise<MaintenanceStats> {
    const equipment = await equipmentService.getAll();
    return calculateStats(equipment);
  },

  /**
   * Calcula taxa de atraso
   */
  async getOverdueRate(): Promise<number> {
    const equipment = await equipmentService.getAll();
    const overdue = equipment.filter(e => e.statusGeral === 'overdue').length;
    return equipment.length > 0 ? (overdue / equipment.length) * 100 : 0;
  },

  /**
   * Busca equipamentos mais críticos
   */
  async getMostCritical(limit: number = 10): Promise<Equipment[]> {
    const equipment = await equipmentService.getAll();
    const statusPriority = { overdue: 0, critical: 1, warning: 2, ok: 3 };
    return equipment
      .sort(
        (a, b) =>
          statusPriority[a.statusGeral as keyof typeof statusPriority] -
          statusPriority[b.statusGeral as keyof typeof statusPriority]
      )
      .slice(0, limit);
  },
};

/**
 * Função auxiliar para transformar dados do Supabase
 */
function transformEquipmentRow(row: any): Equipment {
  const manutencoes: MaintenanceRecord[] = (row.maintenance_records || []).map((m: any) => ({
    id: m.id,
    typeId: m.type_id,
    label: m.label,
    periodicidade: m.periodicidade,
    ultimaManutencao: m.ultima_manutencao ? new Date(m.ultima_manutencao) : null,
    proximaManutencao: m.proxima_manutencao ? new Date(m.proxima_manutencao) : null,
    diasRestantes: m.dias_restantes,
    status: m.status,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
  }));

  return {
    id: row.id,
    tag: row.tag,
    elevacao: row.elevacao,
    altura: row.altura,
    descricao: row.descricao,
    area: row.area,
    tipo: row.tipo,
    manutencoes,
    statusGeral: row.status_geral,
    proximaManutencaoGeral: row.proxima_manutencao_geral ? new Date(row.proxima_manutencao_geral) : null,
    diasRestantesGeral: row.dias_restantes_geral,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
