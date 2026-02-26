import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PaymentService, formatCurrency } from '@/services/paymentService';
import { LicenseService } from '@/services/licenseService';
import { Subscription, Invoice, Plan, Payment } from '@/types/licensing';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  MoreVertical,
} from 'lucide-react';

interface SubscriptionPanelProps {
  userId: string;
  onSubscriptionChanged?: (subscription: Subscription) => void;
}

export function SubscriptionPanel({ userId, onSubscriptionChanged }: SubscriptionPanelProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const [sub, payments, invoices] = await Promise.all([
        PaymentService.getActiveSubscription(userId),
        PaymentService.getPaymentHistory(userId),
        PaymentService.getInvoices(userId),
      ]);

      setSubscription(sub);
      setPayments(payments);
      setInvoices(invoices);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await PaymentService.cancelSubscription(subscription.id);
      setSubscription(null);
      onSubscriptionChanged?.(null as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await PaymentService.downloadInvoice(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar fatura');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Carregando assinatura...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
          <CardDescription>Escolha um plano para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Escolher Plano</Button>
        </CardContent>
      </Card>
    );
  }

  const plan = LicenseService.getPlan(subscription.planType);
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.nextBillingDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Assinatura Atual */}
      <Card className={subscription.status === 'active' ? 'border-green-200 bg-green-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Assinatura Ativa
              </CardTitle>
              <CardDescription>Sua assinatura atual</CardDescription>
            </div>
            <Badge className={subscription.status === 'active' ? 'bg-green-600' : 'bg-red-600'}>
              {subscription.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Plano */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-xs text-gray-600 mb-1">Plano</p>
              <p className="font-semibold">{plan?.name}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-xs text-gray-600 mb-1">Valor</p>
              <p className="font-semibold">{formatCurrency(plan?.price || 0)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-xs text-gray-600 mb-1">Ciclo</p>
              <p className="font-semibold capitalize">
                {subscription.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-xs text-gray-600 mb-1">Renovação</p>
              <p className="font-semibold">
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} dias` : 'Hoje'}
              </p>
            </div>
          </div>

          {/* Recurso Renovação Automática */}
          {subscription.autoRenew && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Renovação automática ativada. Você será cobrado em
                {' '}
                <strong>
                  {new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Período Atual</p>
              <p>
                {new Date(subscription.currentPeriodStart).toLocaleDateString('pt-BR')} a{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Próxima Cobrança</p>
              <p>{new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Alterar Método de Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atualizar Método de Pagamento</DialogTitle>
                  <DialogDescription>
                    Selecione um novo método de pagamento para sua assinatura
                  </DialogDescription>
                </DialogHeader>
                {/* Formulário de atualização - implementado no formPaymentForm */}
                <p className="text-sm text-gray-600">
                  Funcionalidade de atualização de método será exibida aqui
                </p>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="flex-1">
              Fazer Upgrade
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Cancelar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar Assinatura</DialogTitle>
                  <DialogDescription>
                    Tem certeza que quer cancelar? Você perderá acesso aos recursos
                    premium.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelSubscription}
                  >
                    Sim, Cancelar Assinatura
                  </Button>
                  <Button variant="outline" className="w-full">
                    Manter Assinatura
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Seus últimos pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payment.status === 'completed'
                        ? 'default'
                        : payment.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {payment.status === 'completed' && '✓ Pago'}
                    {payment.status === 'pending' && '⏳ Pendente'}
                    {payment.status === 'failed' && '✗ Falhou'}
                    {payment.status === 'refunded' && '↩ Reembolso'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faturas */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Faturas</CardTitle>
            <CardDescription>Seus documentos fiscais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <p className="font-medium">
                        Fatura {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{formatCurrency(invoice.total)}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
