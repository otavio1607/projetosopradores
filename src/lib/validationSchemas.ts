import { z } from 'zod';
import { MAINTENANCE_TYPES } from '@/types/equipment';

// Tipos de validação
export const maintenanceTypeIdSchema = z.enum(
  MAINTENANCE_TYPES.map(m => m.id) as [string, ...string[]]
);

export const statusSchema = z.enum(['ok', 'warning', 'critical', 'overdue', 'pending']);
export const overallStatusSchema = z.enum(['ok', 'warning', 'critical', 'overdue']);

export const maintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  typeId: maintenanceTypeIdSchema,
  label: z.string().min(1),
  periodicidade: z.string(),
  ultimaManutencao: z.date().nullable(),
  proximaManutencao: z.date().nullable(),
  diasRestantes: z.number().nullable(),
  status: statusSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const equipmentSchema = z.object({
  id: z.string().uuid(),
  tag: z.string().min(1, 'Tag é obrigatória'),
  elevacao: z.number().min(0),
  altura: z.number().min(0),
  descricao: z.string(),
  area: z.string().min(1, 'Área é obrigatória'),
  tipo: z.string(),
  manutencoes: z.array(maintenanceRecordSchema),
  statusGeral: overallStatusSchema,
  proximaManutencaoGeral: z.date().nullable(),
  diasRestantesGeral: z.number().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const maintenanceStatsSchema = z.object({
  total: z.number(),
  emDia: z.number(),
  atencao: z.number(),
  critico: z.number(),
  atrasado: z.number(),
});

export const maintenanceHistorySchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  maintenanceTypeId: maintenanceTypeIdSchema,
  dataManutencao: z.date(),
  dataProxima: z.date().nullable(),
  realizadoPor: z.string(),
  notas: z.string().optional(),
  resultado: z.enum(['sucesso', 'falho', 'pendente']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const alertSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  maintenanceTypeId: maintenanceTypeIdSchema,
  tipo: z.enum(['critico', 'aviso', 'info']),
  mensagem: z.string(),
  lido: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().optional(),
  role: z.enum(['admin', 'supervisor', 'tecnico', 'viewer']).default('viewer'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tipos derivados dos schemas
export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type MaintenanceStats = z.infer<typeof maintenanceStatsSchema>;
export type MaintenanceHistory = z.infer<typeof maintenanceHistorySchema>;
export type Alert = z.infer<typeof alertSchema>;
export type User = z.infer<typeof userSchema>;
