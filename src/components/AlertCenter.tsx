import { AlertCircle, CheckCircle2, AlertTriangle, Info, Bell, X } from 'lucide-react';
import { useUnreadAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '@/hooks/useEquipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Alert } from '@/lib/validationSchemas';

/**
 * Componente que mostra alertas não lidos em um painel
 */
export function AlertCenter() {
  const { data: alerts = [], isLoading } = useUnreadAlerts();
  const { mutate: markAsRead } = useMarkAlertAsRead();
  const { mutate: markAllAsRead } = useMarkAllAlertsAsRead();
  const [isOpen, setIsOpen] = useState(false);

  const criticalCount = alerts.filter(a => a.tipo === 'critico').length;
  const warningCount = alerts.filter(a => a.tipo === 'aviso').length;

  if (isLoading) return null;

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Alert panel */}
      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 overflow-y-auto shadow-lg z-50 bg-white">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Alertas ({alerts.length})</h3>
            <div className="flex gap-2">
              {alerts.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAllAsRead()}
                  className="text-xs"
                >
                  Marcar tudo como lido
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stats */}
          {alerts.length > 0 && (
            <div className="p-3 bg-gray-50 flex gap-4 border-b">
              {criticalCount > 0 && (
                <div className="text-sm">
                  <Badge variant="destructive">{criticalCount} crítico</Badge>
                </div>
              )}
              {warningCount > 0 && (
                <div className="text-sm">
                  <Badge variant="outline">{warningCount} aviso</Badge>
                </div>
              )}
            </div>
          )}

          {/* Alert list */}
          <div className="divide-y">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                Nenhum alerta ativo
              </div>
            ) : (
              alerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => markAsRead(alert.id)}
                />
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Componente individual de alerta
 */
function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'aviso':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundColor = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-50 border-red-200';
      case 'aviso':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`p-4 border-l-4 ${getBackgroundColor(alert.tipo)} flex justify-between items-start`}>
      <div className="flex gap-3 flex-1">
        {getIcon(alert.tipo)}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{alert.mensagem}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 ml-2"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * Banner compacto para exibir apenas alertas críticos na página principal
 */
export function CriticalAlertBanner() {
  const { data: alerts = [] } = useUnreadAlerts();
  const criticalAlerts = alerts.filter(a => a.tipo === 'critico');

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-500 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 mb-1">⚠️ Alertas Críticos</h4>
          <ul className="text-sm text-red-800 space-y-1">
            {criticalAlerts.slice(0, 3).map(alert => (
              <li key={alert.id}>• {alert.mensagem}</li>
            ))}
          </ul>
          {criticalAlerts.length > 3 && (
            <p className="text-xs text-red-700 mt-2">
              ... e mais {criticalAlerts.length - 3} alerta(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
