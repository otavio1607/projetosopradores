import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog } from '@/services/rbacService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Edit, Trash2, Plus, Download, Upload, LogIn, LogOut, Lock } from 'lucide-react';

interface AuditLogViewerProps {
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  limit?: number;
}

/**
 * Componente para visualizar logs de auditoria
 */
export function AuditLogViewer({
  resourceType,
  resourceId,
  userId,
  limit = 50,
}: AuditLogViewerProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', resourceType, resourceId, userId],
    queryFn: async () => {
      if (resourceType && resourceId) {
        return await auditService.getByResource(resourceType, resourceId);
      } else if (userId) {
        return await auditService.getByUser(userId, limit);
      }
      return [];
    },
  });

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Carregando histórico...</div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-center text-gray-500">Nenhum log de auditoria</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Histórico de Alterações</h3>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {logs.map(log => (
          <AuditLogCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

/**
 * Card individual de log de auditoria
 */
function AuditLogCard({ log }: { log: AuditLog }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'READ':
        return <Eye size={16} />;
      case 'CREATE':
        return <Plus size={16} />;
      case 'UPDATE':
        return <Edit size={16} />;
      case 'DELETE':
        return <Trash2 size={16} />;
      case 'EXPORT':
        return <Download size={16} />;
      case 'IMPORT':
        return <Upload size={16} />;
      case 'LOGIN':
        return <LogIn size={16} />;
      case 'LOGOUT':
        return <LogOut size={16} />;
      case 'PERMISSION_CHANGE':
        return <Lock size={16} />;
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE':
        return 'destructive';
      case 'CREATE':
      case 'IMPORT':
        return 'outline';
      case 'UPDATE':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: 'Criado',
      READ: 'Visualizado',
      UPDATE: 'Atualizado',
      DELETE: 'Deletado',
      EXPORT: 'Exportado',
      IMPORT: 'Importado',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      PERMISSION_CHANGE: 'Permissão alterada',
    };
    return labels[action] || action;
  };

  return (
    <Card className="p-3 border-l-4 border-blue-500 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-blue-600 mt-1">{getActionIcon(log.action)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={getActionColor(log.action) as any}>
                {getActionLabel(log.action)}
              </Badge>
              <span className="text-sm font-medium text-gray-900">
                {log.resourceType} #{log.resourceId.substring(0, 8)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Por <span className="font-medium">{log.userEmail}</span>
            </p>

            {/* Show changes if available */}
            {Object.keys(log.changes).length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                {Object.entries(log.changes).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="text-gray-900 font-medium">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
          <div>{format(log.timestamp, 'dd MMM yyyy HH:mm', { locale: ptBR })}</div>
          <div className="text-gray-400 mt-1">
            {formatDistanceToNow(log.timestamp, { locale: ptBR, addSuffix: true })}
          </div>
        </div>
      </div>

      {/* IP and User Agent info */}
      {(log.ipAddress || log.userAgent) && (
        <details className="mt-2 pt-2 border-t border-gray-200">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Detalhes técnicos
          </summary>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            {log.ipAddress && <div>IP: {log.ipAddress}</div>}
            {log.userAgent && <div className="break-all">UA: {log.userAgent}</div>}
          </div>
        </details>
      )}
    </Card>
  );
}

/**
 * Componente que mostra um resumo de alterações recentes
 */
export function RecentChangesSummary({ limit = 5 }: { limit?: number }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['recent-audit-logs', limit],
    queryFn: async () => {
      // This would need a query that gets recent logs across all resources
      return [];
    },
  });

  if (isLoading) return null;

  const createCount = logs.filter(l => l.action === 'CREATE').length;
  const updateCount = logs.filter(l => l.action === 'UPDATE').length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;

  return (
    <Card className="p-4 bg-blue-50">
      <h3 className="font-semibold mb-3">Alterações Recentes</h3>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{createCount}</div>
          <p className="text-xs text-gray-600">Criados</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{updateCount}</div>
          <p className="text-xs text-gray-600">Atualizados</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{deleteCount}</div>
          <p className="text-xs text-gray-600">Deletados</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{logs.length}</div>
          <p className="text-xs text-gray-600">Total</p>
        </div>
      </div>
    </Card>
  );
}
