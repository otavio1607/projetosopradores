import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MaintenanceTypeId } from '@/types/equipment';

interface SavedRecord {
  equipment_tag: string;
  type_id: string;
  ultima_manutencao: string | null;
  proxima_manutencao: string | null;
}

export function useMaintenanceSync() {
  const { user } = useAuth();

  const loadSavedRecords = useCallback(async (): Promise<SavedRecord[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('equipment_tag, type_id, ultima_manutencao, proxima_manutencao')
      .eq('user_id', user.id);
    if (error) {
      console.error('Error loading maintenance records:', error);
      return [];
    }
    return data || [];
  }, [user]);

  const saveRecord = useCallback(async (
    equipmentTag: string,
    typeId: MaintenanceTypeId,
    proximaManutencao: Date | null,
    ultimaManutencao: Date | null
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from('maintenance_records')
      .upsert(
        {
          user_id: user.id,
          equipment_tag: equipmentTag,
          type_id: typeId,
          proxima_manutencao: proximaManutencao
            ? proximaManutencao.toISOString().split('T')[0]
            : null,
          ultima_manutencao: ultimaManutencao
            ? ultimaManutencao.toISOString().split('T')[0]
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,equipment_tag,type_id' }
      );
    if (error) {
      console.error('Error saving maintenance record:', error);
    }
  }, [user]);

  return { loadSavedRecords, saveRecord };
}
