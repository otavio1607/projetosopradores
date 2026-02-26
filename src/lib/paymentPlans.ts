/**
 * Planos de pagamento e suas características
 */

import { Plan } from '@/types/licensing';

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfeito para testar a plataforma',
    price: 0,
    billingCycle: 'monthly',
    maxEquipment: 10,
    maxUsers: 1,
    maxStorage: 100, // MB
    support: 'email',
    rateLimit: 100, // requisições/hora
    sso: false,
    advancedReports: false,
    apiAccess: false,
    features: [
      { name: 'Dashboard básico', included: true },
      { name: 'Até 10 equipamentos', included: true },
      { name: 'Histórico de manutenção', included: true },
      { name: 'Exportação Excel', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Múltiplos usuários', included: false },
      { name: 'Relatórios avançados', included: false },
      { name: 'API REST', included: false },
      { name: 'Prioridade de suporte', included: false },
      { name: 'SSO/OAuth', included: false },
    ],
  },

  {
    id: 'pro',
    name: 'Profissional',
    description: 'Para pequenas e médias empresas',
    price: 99,
    billingCycle: 'monthly',
    maxEquipment: 100,
    maxUsers: 5,
    maxStorage: 5000, // 5 GB
    support: 'priority',
    rateLimit: 1000,
    sso: false,
    advancedReports: true,
    apiAccess: false,
    features: [
      { name: 'Dashboard completo', included: true },
      { name: 'Até 100 equipamentos', included: true },
      { name: 'Histórico detalhado', included: true },
      { name: 'Múltiplos usuários (até 5)', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Gráficos e análises', included: true },
      { name: 'Integração Power BI', included: true },
      { name: 'Alertas automáticos', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'Backup automático', included: true },
      { name: 'Auditoria de acesso', included: true },
      { name: 'API REST', included: false },
      { name: 'SSO/OAuth', included: false },
      { name: 'Webhook', included: false },
    ],
  },

  {
    id: 'annual-pro',
    name: 'Profissional Anual',
    description: 'Aproveite 20% de desconto',
    price: 950, // 12 meses com 20% off
    billingCycle: 'annual',
    maxEquipment: 100,
    maxUsers: 5,
    maxStorage: 5000,
    support: 'priority',
    rateLimit: 1000,
    sso: false,
    advancedReports: true,
    apiAccess: false,
    features: [
      { name: 'Tudo do plano Profissional', included: true },
      { name: 'Desconto de 20%', included: true },
      { name: 'Faturamento anual', included: true },
    ],
  },

  {
    id: 'enterprise',
    name: 'Corporativo',
    description: 'Para grandes empresas com demandas específicas',
    price: 399,
    billingCycle: 'monthly',
    maxEquipment: 999,
    maxUsers: 99,
    maxStorage: 50000, // 50 GB
    support: '24/7',
    rateLimit: 10000,
    sso: true,
    advancedReports: true,
    apiAccess: true,
    features: [
      { name: 'Tudo do plano Profissional', included: true },
      { name: 'Ilimitado de equipamentos', included: true },
      { name: 'Ilimitado de usuários', included: true },
      { name: 'API REST completa', included: true },
      { name: 'Webhooks customizados', included: true },
      { name: 'SSO/OAuth integrado', included: true },
      { name: 'Suporte 24/7 prioritário', included: true },
      { name: 'Gestor de conta dedicado', included: true },
      { name: 'Integração personalizada', included: true },
      { name: 'SLA garantido', included: true },
      { name: 'Controle de permissões avançado', included: true },
      { name: 'Relatórios customizados', included: true },
      { name: 'White-label disponível', included: true },
      { name: 'Backup sob demanda', included: true },
    ],
  },

  {
    id: 'annual-enterprise',
    name: 'Corporativo Anual',
    description: 'Aproveite 25% de desconto',
    price: 3580, // 12 meses com 25% off
    billingCycle: 'annual',
    maxEquipment: 999,
    maxUsers: 99,
    maxStorage: 50000,
    support: '24/7',
    rateLimit: 10000,
    sso: true,
    advancedReports: true,
    apiAccess: true,
    features: [
      { name: 'Tudo do plano Corporativo', included: true },
      { name: 'Desconto de 25%', included: true },
      { name: 'Faturamento anual', included: true },
      { name: 'Prioridade máxima', included: true },
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
    description: 'Transferência instantânea 24/7',
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
