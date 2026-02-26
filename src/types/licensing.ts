/**
 * Tipos e interfaces para sistema de licenciamento e pagamento
 */

export type PlanType = 'free' | 'pro' | 'enterprise' | 'annual-pro' | 'annual-enterprise';
export type PaymentMethod = 'credit_card' | 'pix' | 'bank_transfer' | 'trial';
export type LicenseStatus = 'valid' | 'expired' | 'invalid' | 'trial' | 'suspended';
export type BillingCycle = 'monthly' | 'annual';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: PlanFeature[];
  maxEquipment: number;
  maxUsers: number;
  maxStorage: number; // em MB
  support: 'email' | 'priority' | '24/7';
  rateLimit: number; // requisições por hora
  sso: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export interface License {
  id: string;
  key: string;
  planType: PlanType;
  organizationName: string;
  organizationEmail: string;
  maxEquipment: number;
  maxUsers: number;
  status: LicenseStatus;
  issuedAt: Date;
  expiresAt: Date;
  activatedAt?: Date;
  lastValidatedAt: Date;
  hardwareFingerprint?: string;
  features: {
    [key: string]: boolean;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  licenseId: string;
  planType: PlanType;
  billingCycle: BillingCycle;
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  nextBillingDate: Date;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  paidAt?: Date;
  dueAt?: Date;
  invoiceUrl?: string;
  transactionId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  items: InvoiceItem[];
  pdfUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface LicenseValidationResponse {
  valid: boolean;
  status: LicenseStatus;
  message: string;
  license?: License;
  daysUntilExpiration?: number;
  canUseFeature: (feature: string) => boolean;
}

export interface PaymentConfig {
  stripePublicKey?: string;
  pixKey?: string; // CPF, CNPJ ou Email para Pix
  bankAccount?: BankAccount;
}

export interface BankAccount {
  bankCode: string;
  accountNumber: string;
  accountDigit: string;
  agencyNumber: string;
  accountType: 'checking' | 'savings';
}
