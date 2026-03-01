import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parsePaymentError,
  formatCurrency,
  calculateProcessingFee,
  SANDBOX_TEST_CARDS,
  PaymentService,
} from '@/services/paymentService';
import { WebhookService } from '@/services/webhookService';
import type { WebhookEvent } from '@/types/licensing';

// ---------------------------------------------------------------------------
// parsePaymentError
// ---------------------------------------------------------------------------
describe('parsePaymentError', () => {
  it('maps card_declined to portuguese message', () => {
    expect(parsePaymentError('card_declined')).toContain('Cartão recusado');
  });

  it('maps insufficient_funds', () => {
    expect(parsePaymentError('insufficient_funds')).toContain('Saldo insuficiente');
  });

  it('maps expired_card', () => {
    expect(parsePaymentError('expired_card')).toContain('expirado');
  });

  it('maps incorrect_cvc', () => {
    expect(parsePaymentError('incorrect_cvc')).toContain('CVV');
  });

  it('maps processing_error', () => {
    expect(parsePaymentError('processing_error')).toContain('processar');
  });

  it('maps pix_expired', () => {
    expect(parsePaymentError('pix_expired')).toContain('Pix expirado');
  });

  it('returns fallback for unknown code', () => {
    expect(parsePaymentError('some_random_error_xyz')).toContain('erro inesperado');
  });

  it('is case-insensitive', () => {
    expect(parsePaymentError('CARD_DECLINED')).toContain('Cartão recusado');
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats BRL correctly', () => {
    const result = formatCurrency(99.9);
    expect(result).toContain('99');
    expect(result).toContain('R$');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('accepts other currencies', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('100');
  });
});

// ---------------------------------------------------------------------------
// calculateProcessingFee
// ---------------------------------------------------------------------------
describe('calculateProcessingFee', () => {
  it('calculates 2.9% fee on 100', () => {
    expect(calculateProcessingFee(100, 0.029)).toBe(2.9);
  });

  it('calculates zero fee for Pix (0%)', () => {
    expect(calculateProcessingFee(100, 0)).toBe(0);
  });

  it('rounds to two decimal places', () => {
    const fee = calculateProcessingFee(99.99, 0.029);
    expect(Number.isFinite(fee)).toBe(true);
    expect(fee.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// SANDBOX_TEST_CARDS
// ---------------------------------------------------------------------------
describe('SANDBOX_TEST_CARDS', () => {
  it('exposes an approved test card number', () => {
    expect(SANDBOX_TEST_CARDS.approved).toBeTruthy();
    expect(typeof SANDBOX_TEST_CARDS.approved).toBe('string');
  });

  it('exposes a declined test card number', () => {
    expect(SANDBOX_TEST_CARDS.declined).toBeTruthy();
  });

  it('exposes an insufficient_funds test card number', () => {
    expect(SANDBOX_TEST_CARDS.insufficient_funds).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PaymentService.tokenizeCard
// ---------------------------------------------------------------------------
describe('PaymentService.tokenizeCard', () => {
  it('returns a token string that does not contain the full card number', () => {
    const cardNumber = '4509 9535 6623 3704';
    const token = PaymentService.tokenizeCard(cardNumber);
    // Token must not expose the full 16-digit card number
    expect(token).not.toContain('45099535');
    expect(token.startsWith('tok_')).toBe(true);
  });

  it('includes last 4 digits in token', () => {
    const token = PaymentService.tokenizeCard('4111111111111111');
    expect(token).toContain('1111');
  });
});

// ---------------------------------------------------------------------------
// WebhookService.verifySignature
// ---------------------------------------------------------------------------
describe('WebhookService.verifySignature', () => {
  it('returns true for a valid HMAC-SHA256 signature', async () => {
    const body = JSON.stringify({ event: 'payment.completed', id: 'abc123' });
    const secret = 'test_secret_key';

    // Compute expected signature using Web Crypto
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const result = await WebhookService.verifySignature(body, expectedSig, secret);
    expect(result).toBe(true);
  });

  it('returns false for a tampered signature', async () => {
    const body = JSON.stringify({ event: 'payment.completed' });
    const result = await WebhookService.verifySignature(body, 'invalid_sig', 'any_secret');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WebhookService.on / processEvent
// ---------------------------------------------------------------------------
describe('WebhookService event routing', () => {
  afterEach(() => {
    WebhookService.off('payment.completed');
    WebhookService.off('payment.failed');
  });

  it('calls registered handler when event type matches', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    WebhookService.on('payment.completed', handler);

    const event: WebhookEvent = {
      id: 'evt_1',
      type: 'payment.completed',
      provider: 'stripe',
      payload: { paymentId: 'pay_123' },
      receivedAt: new Date(),
      processed: false,
    };

    await WebhookService.processEvent(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not call handler for different event type', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    WebhookService.on('payment.failed', handler);

    const event: WebhookEvent = {
      id: 'evt_2',
      type: 'payment.completed',
      provider: 'mercadopago',
      payload: {},
      receivedAt: new Date(),
      processed: false,
    };

    await WebhookService.processEvent(event);
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple handlers for the same event type', async () => {
    const h1 = vi.fn().mockResolvedValue(undefined);
    const h2 = vi.fn().mockResolvedValue(undefined);
    WebhookService.on('payment.completed', h1);
    WebhookService.on('payment.completed', h2);

    const event: WebhookEvent = {
      id: 'evt_3',
      type: 'payment.completed',
      provider: 'stripe',
      payload: {},
      receivedAt: new Date(),
      processed: false,
    };

    await WebhookService.processEvent(event);
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
