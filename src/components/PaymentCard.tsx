import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle2, XCircle, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStripePromise,
  getServicePricings,
  formatCurrency,
  createMockTransaction,
} from '@/utils/paymentUtils';
import { PaymentTransaction, ServicePricing } from '@/types/equipment';

// ─── Inner checkout form (needs Stripe context) ──────────────────────────────

interface CheckoutFormProps {
  selectedService: ServicePricing | null;
  paymentType: 'one_time' | 'subscription';
  onSuccess: (transaction: PaymentTransaction) => void;
  onClose: () => void;
}

function CheckoutForm({ selectedService, paymentType, onSuccess, onClose }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !selectedService) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      return;
    }

    try {
      // In production replace this with a real PaymentIntent from your backend.
      const { error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast.error(error.message ?? 'Erro ao processar pagamento');
        setProcessing(false);
        return;
      }

      const transaction = createMockTransaction(selectedService.serviceId, paymentType);
      const completed: PaymentTransaction = { ...transaction, status: 'completed', updatedAt: new Date() };
      onSuccess(completed);
      toast.success('Pagamento processado com sucesso!');
    } catch {
      toast.error('Erro inesperado ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const amount = selectedService
    ? paymentType === 'subscription'
      ? selectedService.price * 0.9
      : selectedService.price
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-border p-3 bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: 'hsl(var(--foreground))',
                '::placeholder': { color: 'hsl(var(--muted-foreground))' },
              },
            },
          }}
        />
      </div>

      {selectedService && (
        <div className="flex justify-between items-center text-sm rounded-md bg-muted/50 p-3">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(amount)}
            {paymentType === 'subscription' && (
              <span className="ml-1 text-xs text-muted-foreground">/mês</span>
            )}
          </span>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!stripe || processing || !selectedService} className="gap-2">
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {processing ? 'Processando…' : `Pagar ${selectedService ? formatCurrency(amount) : ''}`}
        </Button>
      </div>
    </form>
  );
}

// ─── Transaction history ──────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: PaymentTransaction[];
}

function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Nenhuma transação registrada.
      </p>
    );
  }

  const statusBadge = (status: PaymentTransaction['status']) => {
    if (status === 'completed')
      return <Badge className="bg-status-ok/20 text-status-ok border-status-ok/30" aria-label="Concluído"><CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />Concluído</Badge>;
    if (status === 'failed')
      return <Badge variant="destructive" aria-label="Falha"><XCircle className="h-3 w-3 mr-1" aria-hidden="true" />Falha</Badge>;
    return <Badge variant="secondary" aria-label="Pendente"><Loader2 className="h-3 w-3 mr-1 animate-spin" aria-hidden="true" />Pendente</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-4">Descrição</th>
            <th className="pb-2 pr-4">Tipo</th>
            <th className="pb-2 pr-4">Valor</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 pr-4 font-medium">{t.description}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {t.paymentType === 'subscription' ? 'Assinatura' : 'Único'}
              </td>
              <td className="py-2 pr-4">{formatCurrency(t.amount, t.currency)}</td>
              <td className="py-2 pr-4">{statusBadge(t.status)}</td>
              <td className="py-2 text-muted-foreground">
                {t.createdAt.toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main PaymentCard component ───────────────────────────────────────────────

interface PaymentCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentCard({ open, onOpenChange }: PaymentCardProps) {
  const stripePromise = getStripePromise();
  const pricings = getServicePricings();

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'one_time' | 'subscription'>('one_time');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [view, setView] = useState<'checkout' | 'history'>('checkout');

  const selectedService = pricings.find((p) => p.serviceId === selectedServiceId) ?? null;

  const handleSuccess = (transaction: PaymentTransaction) => {
    setTransactions((prev) => [transaction, ...prev]);
    setView('history');
    setSelectedServiceId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pagamento de Serviços
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-md bg-muted p-1 mb-2">
          <button
            className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${view === 'checkout' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('checkout')}
          >
            Checkout
          </button>
          <button
            className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${view === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('history')}
          >
            <Receipt className="h-3.5 w-3.5" />
            Histórico
            {transactions.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">{transactions.length}</Badge>
            )}
          </button>
        </div>

        {view === 'history' ? (
          <TransactionTable transactions={transactions} />
        ) : (
          <div className="space-y-4">
            {/* Service selector */}
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço…" />
                </SelectTrigger>
                <SelectContent>
                  {pricings.map((p) => (
                    <SelectItem
                      key={p.serviceId}
                      value={p.serviceId}
                      aria-label={`${p.label} - ${formatCurrency(p.price)}`}
                    >
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{p.label}</span>
                        <span className="text-muted-foreground text-xs" aria-hidden="true">{formatCurrency(p.price)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment type */}
            <div className="space-y-1.5">
              <Label>Tipo de pagamento</Label>
              <div className="flex gap-2">
                {(['one_time', 'subscription'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPaymentType(type)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${paymentType === type ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    {type === 'one_time' ? 'Pagamento Único' : 'Assinatura Mensal (-10%)'}
                  </button>
                ))}
              </div>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  selectedService={selectedService}
                  paymentType={paymentType}
                  onSuccess={handleSuccess}
                  onClose={() => onOpenChange(false)}
                />
              </Elements>
            ) : (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <p className="font-medium">Stripe não configurado</p>
                <p className="text-xs mt-1">
                  Defina <code className="bg-amber-500/10 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> no arquivo{' '}
                  <code className="bg-amber-500/10 px-1 rounded">.env</code> para habilitar pagamentos.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
