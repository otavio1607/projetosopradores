import { loadStripe } from '@stripe/stripe-js';
import { MAINTENANCE_TYPES, MaintenanceTypeId, PaymentTransaction, ServicePricing } from '@/types/equipment';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const getStripePromise = () => {
  if (!stripePublishableKey) return null;
  return loadStripe(stripePublishableKey);
};

const SERVICE_PRICES: Record<string, number> = {
  troca_cabos: 450.0,
  troca_redutor: 1200.0,
  troca_caixa_oca: 2500.0,
  troca_esticador: 380.0,
  troca_corrente: 320.0,
  troca_embreagem: 980.0,
  troca_lanca: 3200.0,
  troca_micro: 290.0,
  limpeza_caixa_selagem: 150.0,
};

export const getServicePricings = (): ServicePricing[] =>
  MAINTENANCE_TYPES.map((type) => ({
    serviceId: type.id,
    label: type.label,
    price: SERVICE_PRICES[type.id] ?? 0,
    currency: 'BRL',
  }));

export const getServicePrice = (serviceId: MaintenanceTypeId | string): number =>
  SERVICE_PRICES[serviceId] ?? 0;

export const formatCurrency = (amount: number, currency = 'BRL'): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);

export const createMockTransaction = (
  serviceType: MaintenanceTypeId | string,
  paymentType: 'one_time' | 'subscription',
  equipmentId?: string,
): PaymentTransaction => {
  const amount = getServicePrice(serviceType);
  const label =
    MAINTENANCE_TYPES.find((t) => t.id === serviceType)?.label ?? serviceType;

  return {
    id: `txn_${crypto.randomUUID()}`,
    equipmentId,
    serviceType,
    amount: paymentType === 'subscription' ? amount * 0.9 : amount,
    currency: 'BRL',
    status: 'pending',
    paymentType,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: `${paymentType === 'subscription' ? '[Assinatura] ' : ''}${label}`,
  };
};
