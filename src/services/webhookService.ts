/**
 * Serviço de processamento de webhooks de pagamento.
 *
 * Responsabilidades:
 * - Verificar assinatura HMAC dos eventos recebidos (evita spoofing)
 * - Rotear eventos para os handlers corretos
 * - Liberar produto/serviço automaticamente após confirmação de pagamento
 */

import { WebhookEvent, WebhookEventType } from '@/types/licensing';

const WEBHOOK_ENDPOINT = '/api/v1/webhooks/payments';

export type WebhookHandler = (event: WebhookEvent) => Promise<void>;

const handlers: Partial<Record<WebhookEventType, WebhookHandler[]>> = {};

export const WebhookService = {
  /**
   * Registra handler para um tipo de evento de webhook
   */
  on(eventType: WebhookEventType, handler: WebhookHandler): void {
    if (!handlers[eventType]) {
      handlers[eventType] = [];
    }
    handlers[eventType]!.push(handler);
  },

  /**
   * Remove todos os handlers de um tipo de evento (útil em testes)
   */
  off(eventType: WebhookEventType): void {
    delete handlers[eventType];
  },

  /**
   * Verifica a assinatura HMAC-SHA256 de um evento recebido.
   * A assinatura deve ser enviada no header `X-Webhook-Signature`.
   *
   * Em produção: compare com o secret configurado no painel do provedor
   * (Stripe: `stripe.webhooks.constructEvent`, MercadoPago: `x-signature`).
   */
  async verifySignature(
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
    const computedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHex === signature;
  },

  /**
   * Processa um evento de webhook recebido do provedor de pagamento.
   * Roteia o evento para os handlers registrados e libera o serviço
   * automaticamente após confirmação de pagamento.
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    const eventHandlers = handlers[event.type] ?? [];
    await Promise.all(eventHandlers.map((h) => h(event)));
  },

  /**
   * Registra evento de webhook recebido no backend (auditoria)
   */
  async recordEvent(
    type: WebhookEventType,
    provider: WebhookEvent['provider'],
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<WebhookEvent> {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, provider, payload, signature }),
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar evento de webhook');
    }

    return response.json();
  },

  /**
   * Obtém histórico de eventos de webhook (útil para reprocessamento)
   */
  async getEventHistory(limit: number = 50): Promise<WebhookEvent[]> {
    const response = await fetch(`${WEBHOOK_ENDPOINT}?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Falha ao obter histórico de webhooks');
    }

    return response.json();
  },
};
