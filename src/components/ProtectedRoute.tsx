import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { Loader2, Info } from 'lucide-react';
import { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // When Supabase is not configured (missing env vars), allow access without authentication.
  // The app works as a standalone local tool — display an informational banner so users
  // know they are running in standalone mode without account protection.
  if (!isSupabaseConfigured) {
    return (
      <>
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-800 text-xs">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            Modo autônomo — autenticação desativada (variáveis de ambiente Supabase não configuradas).
          </span>
        </div>
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
