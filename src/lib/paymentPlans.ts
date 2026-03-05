/**
 * Planos de pagamento e suas características
 */

import { Plan } from '@/types/licensing';

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Plano Inicial',
    description: 'Até 10 equipamentos',
    price: 130,
    billingCycle: 'monthly',
    maxEquipment: 10,
    maxUsers: 1,
    maxStorage: 100,
    support: 'email',
    rateLimit: 100,
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Dashboard completo', included: true },
      { name: 'Até 10 equipamentos', included: true },
      { name: '1 acesso (usuário)', included: true },
      { name: 'Suporte por email', included: true },
    ],
  },

  {
    id: 'pro',
    name: 'Plano Profissional',
    description: 'Até 100 equipamentos',
    price: 200,
    billingCycle: 'monthly',
    maxEquipment: 100,
    maxUsers: 1,
    maxStorage: 5000,
    support: 'email',
    rateLimit: 1000,
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Dashboard completo', included: true },
      { name: 'Até 100 equipamentos', included: true },
      { name: '1 acesso (usuário)', included: true },
      { name: 'Suporte por email', included: true },
    ],
  },

  {
    id: 'annual-pro',
    name: 'Profissional Anual',
    description: 'Aproveite 20% de desconto',
    price: 1920, // 12 meses com 20% off sobre R$200
    billingCycle: 'annual',
    maxEquipment: 100,
    maxUsers: 1,
    maxStorage: 5000,
    support: 'email',
    rateLimit: 1000,
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Tudo do plano Profissional', included: true },
      { name: 'Desconto de 20%', included: true },
      { name: 'Faturamento anual', included: true },
    ],
  },

  {
    id: 'enterprise',
    name: 'Plano Avançado',
    description: 'Até 400 equipamentos',
    price: 300,
    billingCycle: 'monthly',
    maxEquipment: 400,
    maxUsers: 1,
    maxStorage: 50000,
    support: 'email',
    rateLimit: 10000,
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Dashboard completo', included: true },
      { name: 'Até 400 equipamentos', included: true },
      { name: '1 acesso (usuário)', included: true },
      { name: 'Suporte por email', included: true },
    ],
  },

  {
    id: 'annual-enterprise',
    name: 'Avançado Anual',
    description: 'Aproveite 20% de desconto',
    price: 2880, // 12 meses com 20% off sobre R$300
    billingCycle: 'annual',
    maxEquipment: 400,
    maxUsers: 1,
    maxStorage: 50000,
    support: 'email',
    rateLimit: 10000,
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Tudo do plano Avançado', included: true },
      { name: 'Desconto de 20%', included: true },
      { name: 'Faturamento anual', included: true },
    ],
  },
];

/**
 * Configura planos de pagamento via diferentes métodos
 */
export const paymentMethods = [
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    icon: '💳',
    description: 'Visa, Mastercard, American Express',
    countries: ['BR', 'US', 'ALL'],
    processing_fee: 0.029, // 2.9%
  },
  {
    id: 'pix',
    name: 'Pix',
    icon: '📱',
    description: 'Transferência instantânea 24/7 • Chave: 14997525748',
    countries: ['BR'],
    processing_fee: 0,
  },
  {
    id: 'bank_transfer',
    name: 'Transferência Bancária',
    icon: '🏦',
    description: 'TED, DOC ou transferência internacional',
    countries: ['BR', 'US'],
    processing_fee: 0.01, // 1%
  },
];

/**
 * Calcula o preço com possíveis descontos
 */
export function calculatePrice(
  planId: string,
  quantity: number = 1,
  discountPercentage: number = 0
): number {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return 0;

  const basePrice = plan.price * quantity;
  const discount = basePrice * (discountPercentage / 100);
  return Math.max(0, basePrice - discount);
}

/**
 * Gera próximo período de faturamento
 */
export function getNextBillingDate(billingCycle: 'monthly' | 'annual'): Date {
  const now = new Date();
  if (billingCycle === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  }
}

/**
 * Desconta valor baseado no ciclo de faturamento
 */
export function getPriceWithBillingDiscount(
  monthlyPrice: number,
  billingCycle: 'monthly' | 'annual'
): number {
  if (billingCycle === 'monthly') {
    return monthlyPrice;
  }
  // Anual com 15-25% desconto
  return Math.floor(monthlyPrice * 12 * 0.8);
}
