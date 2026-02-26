import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Bell, LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Settings() {
  const { profile, signOut, role } = useAuth();
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [emailNotifications, setEmailNotifications] = useLocalStorage('emailNotifications', true);
  const [browserNotifications, setBrowserNotifications] = useLocalStorage('browserNotifications', false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sessão encerrada');
  };

  const handleBrowserNotifications = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão de notificações negada pelo navegador');
        return;
      }
    }
    setBrowserNotifications(enabled);
    toast.success(enabled ? 'Notificações ativadas' : 'Notificações desativadas');
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    tecnico: 'Técnico',
  };

  const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    supervisor: 'secondary',
    tecnico: 'outline',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <Card className="industrial-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{profile?.displayName ?? 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Badge variant={roleBadgeVariants[role] ?? 'outline'}>
              {roleLabels[role] ?? role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="industrial-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="text-sm cursor-pointer">
              Modo Escuro
            </Label>
            <Switch
              id="darkMode"
              checked={darkMode}
              onCheckedChange={v => {
                setDarkMode(v);
                document.documentElement.classList.toggle('dark', v);
                toast.success(v ? 'Modo escuro ativado' : 'Modo claro ativado');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="industrial-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotif" className="text-sm cursor-pointer">Notificações por Email</Label>
              <p className="text-xs text-muted-foreground">Receber alertas de manutenção por email</p>
            </div>
            <Switch
              id="emailNotif"
              checked={emailNotifications}
              onCheckedChange={v => {
                setEmailNotifications(v);
                toast.success(v ? 'Notificações por email ativadas' : 'Notificações por email desativadas');
              }}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="browserNotif" className="text-sm cursor-pointer">Notificações do Navegador</Label>
              <p className="text-xs text-muted-foreground">Alertas push no navegador</p>
            </div>
            <Switch
              id="browserNotif"
              checked={browserNotifications}
              onCheckedChange={handleBrowserNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="industrial-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
