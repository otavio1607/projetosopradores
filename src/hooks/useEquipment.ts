import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  equipmentService,
  maintenanceHistoryService,
  alertService,
  statsService,
} from '@/services/equipmentService';
import { Equipment, MaintenanceHistory, Alert, MaintenanceStats } from '@/lib/validationSchemas';

// Query keys
export const equipmentQueryKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...equipmentQueryKeys.lists(), { filters }] as const,
  details: () => [...equipmentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentQueryKeys.details(), id] as const,
  byArea: (area: string) => [...equipmentQueryKeys.all, 'area', area] as const,
  byStatus: (status: string) => [...equipmentQueryKeys.all, 'status', status] as const,
};

export const historyQueryKeys = {
  all: ['maintenance-history'] as const,
  lists: () => [...historyQueryKeys.all, 'list'] as const,
  list: (equipmentId: string) => [...historyQueryKeys.lists(), equipmentId] as const,
  byDateRange: (startDate: Date, endDate: Date) =>
    [...historyQueryKeys.all, 'range', startDate, endDate] as const,
};

export const alertQueryKeys = {
  all: ['alerts'] as const,
  unread: () => [...alertQueryKeys.all, 'unread'] as const,
  byEquipment: (equipmentId: string) => [...alertQueryKeys.all, 'equipment', equipmentId] as const,
};

export const statsQueryKeys = {
  all: ['stats'] as const,
  stats: () => [...statsQueryKeys.all, 'stats'] as const,
  overdueRate: () => [...statsQueryKeys.all, 'overdueRate'] as const,
  critical: () => [...statsQueryKeys.all, 'critical'] as const,
};

// Equipment hooks
export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentQueryKeys.detail(id),
    queryFn: () => equipmentService.getById(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEquipmentList() {
  return useQuery({
    queryKey: equipmentQueryKeys.list(),
    queryFn: () => equipmentService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEquipmentByArea(area: string) {
  return useQuery({
    queryKey: equipmentQueryKeys.byArea(area),
    queryFn: () => equipmentService.getByArea(area),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEquipmentByStatus(status: string) {
  return useQuery({
    queryKey: equipmentQueryKeys.byStatus(status),
    queryFn: () => equipmentService.getByStatus(status),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) =>
      equipmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.lists() });
    },
  });
}

export function useUpdateEquipment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.lists() });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.lists() });
    },
  });
}

// Maintenance History hooks
export function useMaintenanceHistory(equipmentId: string) {
  return useQuery({
    queryKey: historyQueryKeys.list(equipmentId),
    queryFn: () => maintenanceHistoryService.getByEquipmentId(equipmentId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMaintenanceHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<MaintenanceHistory, 'id' | 'createdAt' | 'updatedAt'>) =>
      maintenanceHistoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: statsQueryKeys.stats() });
    },
  });
}

export function useMaintenanceHistoryByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: historyQueryKeys.byDateRange(startDate, endDate),
    queryFn: () => maintenanceHistoryService.getByDateRange(startDate, endDate),
    staleTime: 1000 * 60 * 5,
  });
}

// Alert hooks
export function useUnreadAlerts() {
  return useQuery({
    queryKey: alertQueryKeys.unread(),
    queryFn: () => alertService.getUnread(),
    staleTime: 1000 * 30, // 30 seconds for alerts
    refetchInterval: 1000 * 30, // Poll every 30 seconds
  });
}

export function useAlertsByEquipment(equipmentId: string) {
  return useQuery({
    queryKey: alertQueryKeys.byEquipment(equipmentId),
    queryFn: () => alertService.getByEquipmentId(equipmentId),
    staleTime: 1000 * 30,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.unread() });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => alertService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.unread() });
    },
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) =>
      alertService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.unread() });
    },
  });
}

// Stats hooks
export function useMaintenanceStats() {
  return useQuery({
    queryKey: statsQueryKeys.stats(),
    queryFn: () => statsService.getStats(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useOverdueRate() {
  return useQuery({
    queryKey: statsQueryKeys.overdueRate(),
    queryFn: () => statsService.getOverdueRate(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useMostCriticalEquipment(limit = 10) {
  return useQuery({
    queryKey: [...statsQueryKeys.critical(), limit],
    queryFn: () => statsService.getMostCritical(limit),
    staleTime: 1000 * 60 * 5,
  });
}
