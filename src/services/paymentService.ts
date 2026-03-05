/**
 * Serviço de processamento de pagamentos
 */

import {
  Payment,
  PaymentMethod,
  Subscription,
  Invoice,
  PlanType,
  BillingCycle,
  PaymentLog,
  ReconciliationSummary,
} from '@/types/licensing';
import { getNextBillingDate } from '@/lib/paymentPlans';

/**
 * Cartões de teste para modo sandbox (Mercado Pago / Stripe)
 * Nunca usar em produção.
 */
export const SANDBOX_TEST_CARDS = {
  approved: '4509 9535 6623 3704',
  declined: '4000 0000 0000 0002',
  insufficient_funds: '4000 0000 0000 9995',
  processing_error: '4000 0000 0000 0119',
  expired_card: '4000 0000 0000 0069',
  incorrect_cvc: '4000 0000 0000 0127',
} as const;

/**
 * Mapeamento de códigos de erro para mensagens em português
 */
const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Cartão recusado. Verifique os dados ou tente outro cartão.',
  insufficient_funds: 'Saldo insuficiente. Verifique o limite disponível no seu cartão.',
  invalid_card: 'Dados do cartão inválidos. Confira o número, validade e CVV.',
  expired_card: 'Cartão expirado. Por favor, utilize um cartão com validade vigente.',
  incorrect_cvc: 'CVV incorreto. Verifique o código de segurança no verso do cartão.',
  processing_error: 'Erro ao processar o pagamento. Tente novamente em instantes.',
  do_not_honor: 'Transação não autorizada pelo banco emissor. Entre em contato com seu banco.',
  fraudulent: 'Transação bloqueada por suspeita de fraude. Entre em contato com seu banco.',
  network_error: 'Falha de comunicação com a operadora. Tente novamente.',
  pix_expired: 'Código Pix expirado. Gere um novo código para prosseguir.',
  boleto_expired: 'Boleto vencido. Gere um novo boleto para prosseguir.',
  subscription_canceled: 'Assinatura cancelada. Renove para continuar utilizando.',
  unknown: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
};

/**
 * Converte código de erro da API em mensagem amigável ao usuário
 */
export function parsePaymentError(errorCodeOrMessage: string): string {
  const key = errorCodeOrMessage.toLowerCase().replace(/[\s-]/g, '_');
  return PAYMENT_ERROR_MESSAGES[key] ?? PAYMENT_ERROR_MESSAGES['unknown'];
}

/**
 * Indica se o sistema está em modo sandbox (homologação)
 */
export function isSandboxMode(): boolean {
  return import.meta.env.VITE_PAYMENT_SANDBOX === 'true' || import.meta.env.DEV;
}

export class PaymentService {
  private static readonly API_BASE = '/api/v1/payments';

  /**
   * Tokeniza dados do cartão no lado do cliente antes de enviar ao servidor.
   * Em produção, usar Stripe.js ou SDK do Mercado Pago para gerar o token.
   * Nunca enviar dados brutos do cartão ao servidor (PCI-DSS).
   */
  static tokenizeCard(cardNumber: string): string {
    // Produção: substituir por Stripe.js `stripe.createToken()` ou
    // MP SDK `mp.createCardToken()`. Aqui retornamos apenas os últimos 4 dígitos
    // como placeholder, garantindo que o número completo nunca trafegue.
    const digits = cardNumber.replace(/\D/g, '');
    return `tok_${digits.slice(-4)}_${Date.now()}`;
  }

  /**
   * Processa pagamento via cartão de crédito.
   * Recebe token (não dados brutos do cartão) – conformidade PCI-DSS.
   */
  static async processCardPayment(
    cardToken: string,
    amount: number,
    planType: PlanType,
    email: string
  ): Promise<Payment> {
    const response = await fetch(`${this.API_BASE}/card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardToken,
        amount,
        planType,
        email,
        sandbox: isSandboxMode(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const userMessage = parsePaymentError(error.code ?? error.message ?? 'unknown');
      throw new Error(userMessage);
    }

    return response.json();
  }

  /**
   * Processa pagamento via Pix
   */
  static async processPixPayment(
    amount: number,
    planType: PlanType,
    email: string
  ): Promise<{ payment: Payment; pixQrCode: string; pixCopyPaste: string }> {
    const response = await fetch(`${this.API_BASE}/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        planType,
        email,
        sandbox: isSandboxMode(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const userMessage = parsePaymentError(error.code ?? error.message ?? 'unknown');
      throw new Error(userMessage);
    }

    return response.json();
  }

  /**
   * Processa pagamento via transferência bancária
   */
  static async processBankTransferPayment(
    amount: number,
    planType: PlanType,
    email: string
  ): Promise<{ payment: Payment; bankDetails: BankTransferDetails }> {
    const response = await fetch(`${this.API_BASE}/bank-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        planType,
        email,
        sandbox: isSandboxMode(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const userMessage = parsePaymentError(error.code ?? error.message ?? 'unknown');
      throw new Error(userMessage);
    }

    return response.json();
  }

  /**
   * Cria assinatura após pagamento bem-sucedido
   */
  static async createSubscription(
    userId: string,
    planType: PlanType,
    billingCycle: BillingCycle,
    paymentId: string,
    paymentMethod: PaymentMethod
  ): Promise<Subscription> {
    const response = await fetch(`${this.API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        planType,
        billingCycle,
        paymentId,
        paymentMethod,
        currentPeriodStart: new Date(),
        nextBillingDate: getNextBillingDate(billingCycle),
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar assinatura');
    }

    return response.json();
  }

  /**
   * Obtém histórico de pagamentos do usuário
   */
  static async getPaymentHistory(userId: string, limit: number = 10): Promise<Payment[]> {
    const response = await fetch(`${this.API_BASE}/history?userId=${userId}&limit=${limit}`);

    if (!response.ok) {
      throw new Error('Falha ao obter histórico de pagamentos');
    }

    return response.json();
  }

  /**
   * Obtém assinatura ativa do usuário
   */
  static async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const response = await fetch(`${this.API_BASE}/subscriptions/active?userId=${userId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Falha ao obter assinatura');
    }

    return response.json();
  }

  /**
   * Obtém faturas (invoices)
   */
  static async getInvoices(userId: string): Promise<Invoice[]> {
    const response = await fetch(`${this.API_BASE}/invoices?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Falha ao obter faturas');
    }

    return response.json();
  }

  /**
   * Baixa PDF da fatura
   */
  static async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await fetch(`${this.API_BASE}/invoices/${invoiceId}/pdf`);

    if (!response.ok) {
      throw new Error('Falha ao baixar fatura');
    }

    return response.blob();
  }

  /**
   * Atualiza método de pagamento
   */
  static async updatePaymentMethod(
    subscriptionId: string,
    token: string,
    method: PaymentMethod
  ): Promise<Subscription> {
    const response = await fetch(
      `${this.API_BASE}/subscriptions/${subscriptionId}/payment-method`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, method }),
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao atualizar método de pagamento');
    }

    return response.json();
  }

  /**
   * Reembolsa pagamento
   */
  static async refundPayment(paymentId: string, reason: string): Promise<Payment> {
    const response = await fetch(`${this.API_BASE}/${paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar reembolso');
    }

    return response.json();
  }

  /**
   * Verifica status de pagamento Pix
   */
  static async checkPixPaymentStatus(paymentId: string): Promise<'pending' | 'completed' | 'failed'> {
    const response = await fetch(`${this.API_BASE}/pix/${paymentId}/status`);

    if (!response.ok) {
      throw new Error('Falha ao verificar status');
    }

    const data = await response.json();
    return data.status;
  }

  /**
   * Webhook para confirmar pagamento (chamado pelo backend após verificação de assinatura)
   */
  static async confirmPayment(paymentId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${paymentId}/confirm`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Falha ao confirmar pagamento');
    }
  }

  /**
   * Registra tentativa de pagamento nos logs (auditoria)
   */
  static async logPaymentAttempt(log: Omit<PaymentLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...log, createdAt: new Date().toISOString() }),
      });
    } catch {
      // Logging failures must not interrupt the payment flow
      console.warn('[PaymentService] Falha ao registrar log de pagamento');
    }
  }

  /**
   * Obtém dados de conciliação financeira para o período informado
   */
  static async getReconciliationData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationSummary> {
    const params = new URLSearchParams({
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await fetch(`${this.API_BASE}/reconciliation?${params}`);

    if (!response.ok) {
      throw new Error('Falha ao obter dados de conciliação');
    }

    return response.json();
  }
}

export interface BankTransferDetails {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountDigit: string;
  agencyNumber: string;
  accountType: string;
  recipientName: string;
  recipientDocument: string;
  amount: number;
  dueDate: string;
}

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Calcula taxa de processamento
 */
export function calculateProcessingFee(amount: number, feePercentage: number): number {
  return Math.round(amount * feePercentage * 100) / 100;
}

