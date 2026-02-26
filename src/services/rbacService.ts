import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de roles disponíveis
 */
export type UserRole = 'admin' | 'supervisor' | 'tecnico' | 'viewer';

/**
 * Interface para auditoria de ações
 */
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Serviço de auditoria
 */
export const auditService = {
  /**
   * Registra uma ação na auditoria
   */
  async log(
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>,
    user?: User
  ): Promise<void> {
    if (!user) {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;
      user = currentUser;
    }

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes: changes || {},
        timestamp: new Date().toISOString(),
        ip_address: getClientIp(),
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  },

  /**
   * Busca logs de auditoria para um recurso
   */
  async getByResource(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      changes: row.changes,
      timestamp: new Date(row.timestamp),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }));
  },

  /**
   * Busca logs por usuário
   */
  async getByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      changes: row.changes,
      timestamp: new Date(row.timestamp),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }));
  },
};

/**
 * Serviço para controle de acesso por papel
 */
export const rbacService = {
  /**
   * Permissões por role
   */
  permissions: {
    admin: ['create', 'read', 'update', 'delete', 'manage_users', 'view_audit'],
    supervisor: ['create', 'read', 'update', 'view_audit'],
    tecnico: ['create', 'read', 'update'],
    viewer: ['read'],
  },

  /**
   * Verifica se um usuário pode realizar uma ação
   */
  canPerform(role: UserRole, action: string): boolean {
    const rolePermissions = this.permissions[role];
    return rolePermissions.includes(action);
  },

  /**
   * Verifica se um usuário é admin
   */
  isAdmin(role: UserRole): boolean {
    return role === 'admin';
  },

  /**
   * Verifica se um usuário é supervisor ou admin
   */
  isSupervisor(role: UserRole): boolean {
    return role === 'admin' || role === 'supervisor';
  },

  /**
   * Verifica se um usuário é técnico ou acima
   */
  isTecnico(role: UserRole): boolean {
    return role === 'admin' || role === 'supervisor' || role === 'tecnico';
  },

  /**
   * Obtém o nível de acesso numérico (maior = mais permissões)
   */
  getAccessLevel(role: UserRole): number {
    const levels: Record<UserRole, number> = {
      viewer: 1,
      tecnico: 2,
      supervisor: 3,
      admin: 4,
    };
    return levels[role];
  },

  /**
   * Verifica se um role tem mais acesso que outro
   */
  hasMoreAccessThan(roleA: UserRole, roleB: UserRole): boolean {
    return this.getAccessLevel(roleA) > this.getAccessLevel(roleB);
  },
};

/**
 * Hook para verificar permissões do usuário
 */
export function usePermission(requiredRole: UserRole, requiredAction?: string) {
  // This would typically come from AuthContext
  // Implementation depends on your auth setup
  return {
    canPerform: (action: string) => {
      // Implementation
      return true;
    },
    hasRole: (role: UserRole) => {
      // Implementation
      return true;
    },
  };
}

/**
 * Função auxiliar para obter IP do cliente
 */
function getClientIp(): string | undefined {
  // This would need to be implemented on the backend
  // as browsers don't have direct access to IP
  return undefined;
}

/**
 * Componente wrapper para proteger routes por role
 */
export function requireRole(role: UserRole) {
  return function withRoleCheck<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedComponent(props: P) {
      // Implementation would check auth context
      return <Component {...props} />;
    };
  };
}

/**
 * Tipos de ações auditáveis
 */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
} as const;

/**
 * Tipos de recursos que podem ser auditados
 */
export const AUDIT_RESOURCES = {
  EQUIPMENT: 'EQUIPMENT',
  MAINTENANCE_RECORD: 'MAINTENANCE_RECORD',
  MAINTENANCE_HISTORY: 'MAINTENANCE_HISTORY',
  USER: 'USER',
  ALERT: 'ALERT',
} as const;
