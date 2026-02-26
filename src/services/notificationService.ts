import { Equipment } from '@/types/equipment';
import { Notification } from '@/types/notifications';

export function generateMaintenanceAlerts(equipment: Equipment[]): Omit<Notification, 'id' | 'createdAt'>[] {
  const alerts: Omit<Notification, 'id' | 'createdAt'>[] = [];

  equipment.forEach(eq => {
    eq.manutencoes.forEach(m => {
      if (m.status === 'overdue') {
        alerts.push({
          type: 'error',
          title: 'Manutenção Atrasada',
          message: `${eq.tag}: ${m.label} está atrasada`,
          read: false,
          channel: 'in-app',
          equipmentId: eq.id,
          maintenanceType: m.typeId,
        });
      } else if (m.status === 'critical') {
        alerts.push({
          type: 'warning',
          title: 'Manutenção Crítica',
          message: `${eq.tag}: ${m.label} vence em ${m.diasRestantes} dias`,
          read: false,
          channel: 'in-app',
          equipmentId: eq.id,
          maintenanceType: m.typeId,
        });
      }
    });
  });

  return alerts.slice(0, 50);
}

export function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  return Notification.requestPermission();
}

export function sendBrowserNotification(title: string, body: string, icon?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: icon ?? '/favicon.ico' });
}
