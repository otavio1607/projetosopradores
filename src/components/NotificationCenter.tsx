import { Bell, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/types/notifications';
import { formatRelativeDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
}

const typeColors: Record<Notification['type'], string> = {
  error: 'bg-destructive/10 border-destructive/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  success: 'bg-green-500/10 border-green-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
};

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
}: NotificationCenterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onMarkAllAsRead}>
              <CheckCheck className="h-3 w-3" />
              Marcar tudo
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-1 space-y-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'p-3 rounded-md border text-xs space-y-1 transition-colors',
                    typeColors[n.type],
                    !n.read && 'ring-1 ring-primary/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    <div className="flex gap-1 shrink-0">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onMarkAsRead(n.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onRemove(n.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                  <p className="text-muted-foreground/60">{formatRelativeDate(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
