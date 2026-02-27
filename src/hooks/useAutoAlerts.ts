import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Equipment, Alert } from '@/lib/validationSchemas';
import { useCreateAlert, useUnreadAlerts } from '@/hooks/useEquipment';
import { getStatus } from '@/lib/maintenanceCalculations';

/**
 * Hook que monitora mudanças de status e cria alertas automaticamente
 */
export function useAutoAlerts(equipment: Equipment[] | undefined) {
  const { mutate: createAlert } = useCreateAlert();
  const { data: unreadAlerts } = useUnreadAlerts();

  // Track alerts that have already been created
  const existingAlertKeys = new Set(
    (unreadAlerts || []).map(a => `${a.equipmentId}-${a.maintenanceTypeId}`)
  );

  const generateAlerts = useCallback(() => {
    if (!equipment) return;

    equipment.forEach(eq => {
      eq.manutencoes.forEach(maintenance => {
        const alertKey = `${eq.id}-${maintenance.typeId}`;

        // Skip if alert already exists
        if (existingAlertKeys.has(alertKey)) return;

        const status = getStatus(maintenance.diasRestantes);

        if (status === 'critical') {
          createAlert(
            {
              equipmentId: eq.id,
              maintenanceTypeId: maintenance.typeId,
              tipo: 'critico',
              mensagem: `${eq.tag}: Manutenção "${maintenance.label}" fica crítica em ${maintenance.diasRestantes} dia${maintenance.diasRestantes !== 1 ? 's' : ''}`,
              lido: false,
            },
            {
              onSuccess: () => {
                toast.warning(`Alerta crítico: ${eq.tag} - ${maintenance.label}`);
              },
            }
          );
        } else if (status === 'overdue') {
          createAlert(
            {
              equipmentId: eq.id,
              maintenanceTypeId: maintenance.typeId,
              tipo: 'critico',
              mensagem: `${eq.tag}: Manutenção "${maintenance.label}" está ATRASADA por ${Math.abs(maintenance.diasRestantes || 0)} dia${Math.abs(maintenance.diasRestantes || 0) !== 1 ? 's' : ''}`,
              lido: false,
            },
            {
              onSuccess: () => {
                toast.error(`Manutenção atrasada: ${eq.tag} - ${maintenance.label}`);
              },
            }
          );
        } else if (status === 'warning') {
          createAlert(
            {
              equipmentId: eq.id,
              maintenanceTypeId: maintenance.typeId,
              tipo: 'aviso',
              mensagem: `${eq.tag}: Manutenção "${maintenance.label}" em atenção (${maintenance.diasRestantes} dias)`,
              lido: false,
            },
            {
              onSuccess: () => {
                toast.info(`Aviso: ${eq.tag} - ${maintenance.label}`);
              },
            }
          );
        }
      });
    });
  }, [equipment, createAlert, existingAlertKeys]);

  useEffect(() => {
    generateAlerts();
  }, [generateAlerts]);

  return null;
}

/**
 * Hook para notificar o usuário sobre alertas não lidos
 */
export function useAlertNotifications() {
  const { data: unreadAlerts, refetch } = useUnreadAlerts();

  useEffect(() => {
    if (!unreadAlerts || unreadAlerts.length === 0) return;

    // Check if browser supports notifications
    if (!('Notification' in window)) return;

    // Request permission if needed
    if (Notification.permission === 'granted') {
      showNotifications(unreadAlerts);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotifications(unreadAlerts);
        }
      });
    }

    // Refetch every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [unreadAlerts, refetch]);
}

/**
 * Função auxiliar para mostrar notificações do navegador
 */
function showNotifications(alerts: Alert[]) {
  alerts.slice(0, 3).forEach(alert => {
    new Notification('Sistema de Manutenção', {
      body: alert.mensagem,
      icon: alert.tipo === 'critico' ? '🔴' : '⚠️',
      tag: alert.id,
      requireInteraction: alert.tipo === 'critico',
    });
  });
}

/**
 * Hook para enviar alertas por email
 * (Integração com um serviço de email Backend)
 */
export function useEmailAlerts() {
  const { data: unreadAlerts } = useUnreadAlerts();

  const sendEmailAlert = useCallback(async (alert: Alert) => {
    try {
      await fetch('/api/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@company.com', // Should come from user settings
          subject: `[${alert.tipo.toUpperCase()}] ${alert.mensagem}`,
          body: alert.mensagem,
          alertType: alert.tipo,
        }),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }, []);

  useEffect(() => {
    if (!unreadAlerts) return;

    // Send critical alerts immediately
    const criticalAlerts = unreadAlerts.filter(a => a.tipo === 'critico');
    criticalAlerts.forEach(alert => {
      sendEmailAlert(alert);
    });
  }, [unreadAlerts, sendEmailAlert]);
}
