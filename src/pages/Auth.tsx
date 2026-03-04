import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, LogIn, UserPlus, Loader2, Copy, Check, Shield, Zap, Crown, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { plans, paymentMethods } from '@/lib/paymentPlans';

export default function Auth() {
  const pixKey = '14997525748';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
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

  const monthlyPlans = plans.filter(p => p.billingCycle === 'monthly');
  const annualPlans = plans.filter(p => p.billingCycle === 'annual');
  const displayPlans = billingCycle === 'monthly' ? monthlyPlans : annualPlans;

  const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="h-5 w-5" />,
    pro: <Shield className="h-5 w-5" />,
    enterprise: <Crown className="h-5 w-5" />,
    'annual-pro': <Shield className="h-5 w-5" />,
    'annual-enterprise': <Crown className="h-5 w-5" />,
  };

  const planColors: Record<string, string> = {
    free: 'border-emerald-500/30 bg-emerald-500/5',
    pro: 'border-primary/40 bg-primary/5 ring-2 ring-primary/20',
    enterprise: 'border-amber-500/30 bg-amber-500/5',
    'annual-pro': 'border-primary/40 bg-primary/5 ring-2 ring-primary/20',
    'annual-enterprise': 'border-amber-500/30 bg-amber-500/5',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Sopradores de Fuligem
            </h1>
            <p className="text-xs text-muted-foreground">
              Sistema de Manutenção Preventiva Industrial
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Gestão Inteligente de Manutenção
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Controle completo dos sopradores de fuligem da sua caldeira. 
            Prevenção de falhas, relatórios automatizados e integração com Power BI.
          </p>
        </section>

        {/* Planos de Assinatura */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Planos de Assinatura</h3>
            <p className="text-muted-foreground">Escolha o plano ideal para sua operação</p>
          </div>

          {/* Toggle Mensal/Anual */}
          <div className="flex justify-center gap-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('monthly')}
              size="sm"
              className="min-w-[120px]"
            >
              Mensal
            </Button>
            <Button
              variant={billingCycle === 'annual' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('annual')}
              size="sm"
              className="min-w-[120px] gap-2"
            >
              Anual
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                -20%
              </Badge>
            </Button>
          </div>

          {/* Cards de Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {displayPlans.map((plan) => {
              const isPopular = plan.id === 'pro' || plan.id === 'annual-pro';
              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-lg ${planColors[plan.id] || ''} ${
                    isPopular ? 'scale-[1.02] shadow-md' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">
                        ⭐ Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary">{planIcons[plan.id]}</span>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Preço */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>
                      {plan.billingCycle === 'annual' && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          Equivale a R$ {(plan.price / 12).toFixed(2).replace('.', ',')}/mês
                        </p>
                      )}
                    </div>

                    {/* Limites */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-foreground">
                          {plan.maxEquipment >= 400 ? 'Até 400' : `Até ${plan.maxEquipment}`} equipamentos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-foreground">
                          {plan.maxUsers >= 99 ? 'Usuários ilimitados' : `${plan.maxUsers} usuário${plan.maxUsers > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      {plan.features.filter(f => f.included).slice(0, 5).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-foreground">{feature.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => {
                        document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
                        toast.info(`Plano ${plan.name} selecionado. Crie sua conta para começar!`);
                      }}
                    >
                      {plan.price <= 80 ? 'Começar Agora' : 'Escolher Plano'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Formas de Pagamento */}
        <section className="max-w-3xl mx-auto">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Formas de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">Cartão de Crédito</p>
                    <p className="text-xs text-muted-foreground">Visa, Master, Amex</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">Pix</p>
                    <p className="text-xs text-muted-foreground">Instantâneo 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <span className="text-2xl">🏦</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">Transferência</p>
                    <p className="text-xs text-muted-foreground">TED / DOC</p>
                  </div>
                </div>
              </div>

              {/* Chave Pix */}
              <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Chave Pix para pagamento
                </p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={pixKey} className="font-mono text-sm bg-background" />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(pixKey);
                      toast.success('Chave Pix copiada!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Licenciamento */}
        <section className="max-w-3xl mx-auto">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Licenciamento e Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">📋 Licença de Uso</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Licença SaaS (Software como Serviço)</li>
                    <li>Uso não-exclusivo e intransferível</li>
                    <li>Válida enquanto a assinatura estiver ativa</li>
                    <li>Atualizações automáticas incluídas</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">🔒 Segurança e Dados</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Dados criptografados em trânsito e repouso</li>
                    <li>Backup diário automático</li>
                    <li>Conformidade com LGPD</li>
                    <li>Exportação total de dados garantida</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">🔄 Cancelamento</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Cancele a qualquer momento</li>
                    <li>Sem multa de fidelidade</li>
                    <li>Dados disponíveis por 30 dias após cancelamento</li>
                    <li>Reembolso proporcional no plano anual</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">📞 Suporte</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Suporte técnico por email (todos os planos)</li>
                    <li>Atendimento prioritário (Pro e Avançado)</li>
                    <li>Suporte 24/7 no plano Avançado</li>
                    <li>Treinamento online gratuito</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Login/Cadastro */}
        <section id="auth-form" className="max-w-md mx-auto pb-12">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
                  </CardTitle>
                  <CardDescription>
                    {isLogin ? 'Entre para gerenciar seus equipamentos' : 'Comece agora com seu plano'}
                  </CardDescription>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex gap-2">
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
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Seu nome completo"
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
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Sopradores de Fuligem — Sistema de Manutenção Preventiva</p>
        <p className="mt-1">Licença SaaS • LGPD Compliance • Suporte técnico incluso</p>
      </footer>
    </div>
  );
}
