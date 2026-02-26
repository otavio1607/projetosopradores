export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationChannel = 'in-app' | 'email' | 'push';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  channel: NotificationChannel;
  equipmentId?: string;
  maintenanceType?: string;
}
