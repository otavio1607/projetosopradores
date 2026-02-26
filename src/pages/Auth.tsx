import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message);
        } else {
          toast.success('Login realizado com sucesso!');
          navigate('/');
        }
      } else {
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.');
        }
      }
    } catch (err) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="industrial-card">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Sopradores de Fuligem
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Manutenção Preventiva
              </p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={isLogin ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLogin(true)}
              className="flex-1 gap-2"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
            <Button
              type="button"
              variant={!isLogin ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLogin(false)}
              className="flex-1 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Criar Conta
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Seu nome"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
