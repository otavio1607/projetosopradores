import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { PaymentService, formatCurrency } from '@/services/paymentService';
import { Plan, PaymentMethod, Payment } from '@/types/licensing';
import { Copy, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentFormProps {
  plan: Plan;
  onSuccess?: (payment: Payment) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({ plan, onSuccess, onError }: PaymentFormProps) {
  const pixKey = '14997525748';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string } | null>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    email: '',
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      let payment;

      if (paymentMethod === 'pix') {
        const result = await PaymentService.processPixPayment(
          plan.price,
          plan.id,
          formData.email
        );
        payment = result.payment;
        setPixData({
          qrCode: result.pixQrCode,
          copyPaste: result.pixCopyPaste,
        });
      } else if (paymentMethod === 'credit_card') {
        payment = await PaymentService.processCardPayment(
          formData.cardNumber,
          plan.price,
          plan.id,
          formData.email
        );
      } else if (paymentMethod === 'bank_transfer') {
        const result = await PaymentService.processBankTransferPayment(
          plan.price,
          plan.id,
          formData.email
        );
        payment = result.payment;
        setBankDetails(result.bankDetails);
      }

      setPaymentStatus('success');
      onSuccess?.(payment);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      setPaymentStatus('error');
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Pagamento Processado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Seu pagamento foi recebido com sucesso! Você receberá um email de confirmação.
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => window.location.href = '/'}>
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Plano */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(plan.price)}
              </p>
              <p className="text-sm text-gray-600">
                {plan.billingCycle === 'monthly' ? 'por mês' : 'por ano'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
          <CardDescription>Escolha como deseja pagar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
            {/* Pix */}
            <div
              className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setPaymentMethod('pix')}
            >
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-semibold">📱 Pix</p>
                  <p className="text-sm text-gray-600">Transferência instantânea (sem taxas) • Chave: {pixKey}</p>
                </div>
              </Label>
              <Badge>Recomendado</Badge>
            </div>

            {/* Cartão de Crédito */}
            <div
              className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setPaymentMethod('credit_card')}
            >
              <RadioGroupItem value="credit_card" id="credit_card" />
              <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                <p className="font-semibold">💳 Cartão de Crédito</p>
                <p className="text-sm text-gray-600">Visa, Mastercard ou American Express</p>
              </Label>
            </div>

            {/* Transferência Bancária */}
            <div
              className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setPaymentMethod('bank_transfer')}
            >
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                <p className="font-semibold">🏦 Transferência Bancária</p>
                <p className="text-sm text-gray-600">TED ou DOC</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Formulário de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            {/* Formulário específico por método */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Nome do Titular</Label>
                  <Input
                    id="cardholderName"
                    placeholder="João Silva"
                    value={formData.cardholderName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cardholderName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cardNumber: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Validade</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/AA"
                      value={formData.cardExpiry}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cardExpiry: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCVC">CVC</Label>
                    <Input
                      id="cardCVC"
                      placeholder="123"
                      value={formData.cardCVC}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cardCVC: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Erro ao processar pagamento. Tente novamente.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? 'Processando...' : `Pagar ${formatCurrency(plan.price)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Exibição de QR Code Pix */}
      {paymentMethod === 'pix' && pixData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Código Pix Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-white text-center">
              <img
                src={pixData.qrCode}
                alt="QR Code Pix"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-2">
              <Label>Copia e Cola (para pagar via App)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={pixData.copyPaste}
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.copyPaste);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Abra seu banco ou app de pagamentos, selecione Pix e scaneie o código.
            </p>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'pix' && !pixData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Chave Pix para Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Chave Pix (copia e cola)</Label>
            <div className="flex gap-2">
              <Input readOnly value={pixKey} className="font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(pixKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Use esta chave para receber o pagamento via Pix.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exibição de Dados Bancários */}
      {paymentMethod === 'bank_transfer' && bankDetails && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Dados Bancários para Transferência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600">Banco</p>
                <p className="font-semibold">{bankDetails.bankName}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600">Agência</p>
                <p className="font-semibold">{bankDetails.agencyNumber}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600">Conta</p>
                <p className="font-semibold">
                  {bankDetails.accountNumber}-{bankDetails.accountDigit}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600">Tipo</p>
                <p className="font-semibold">{bankDetails.accountType}</p>
              </div>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Valor a transferir: {formatCurrency(bankDetails.amount)}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
