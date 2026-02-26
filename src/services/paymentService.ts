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
} from '@/types/licensing';
import { getNextBillingDate } from '@/lib/paymentPlans';

export class PaymentService {
  private static readonly API_BASE = '/api/v1/payments';

  /**
   * Processa pagamento via cartão de crédito
   */
  static async processCardPayment(
    token: string,
    amount: number,
    planType: PlanType,
    email: string
  ): Promise<Payment> {
    const response = await fetch(`${this.API_BASE}/card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        amount,
        planType,
        email,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao processar pagamento');
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
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao gerar Pix');
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
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha ao gerar dados bancários');
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
   * Webhook para confirmar pagamento (chamado pelo backend)
   */
  static async confirmPayment(paymentId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${paymentId}/confirm`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Falha ao confirmar pagamento');
    }
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
