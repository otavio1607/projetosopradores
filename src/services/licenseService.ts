/**
 * Serviço de gerenciamento de licenças e validação
 */

import {
  License,
  LicenseStatus,
  LicenseValidationResponse,
  Plan,
  PlanType,
  Subscription,
} from '@/types/licensing';

// Planos disponíveis
import { plans } from './paymentPlans';

export class LicenseService {
  private static readonly LICENSE_STORAGE_KEY = 'app_license';
  private static readonly LICENSE_ENDPOINT = '/api/v1/licenses';
  private static readonly VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Gera chave de licença (uso de desenvolvimento/demo)
   */
  static generateLicenseKey(organizationName: string, planType: PlanType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const key = `SOPR-${planType.toUpperCase()}-${timestamp}-${random}`;
    return key;
  }

  /**
   * Valida uma chave de licença
   */
  static async validateLicense(licenseKey: string): Promise<LicenseValidationResponse> {
    try {
      // Primeiro tenta validar localmente (offline)
      const localLicense = this.getLocalLicense();
      if (localLicense && localLicense.key === licenseKey) {
        const validation = this.validateLicenseOffline(localLicense);
        
        // Se offline está OK e já tem online recente, retorna local
        if (validation.valid && this.isRecentValidation(localLicense)) {
          return validation;
        }
      }

      // Tenta validar online
      const response = await fetch(`${this.LICENSE_ENDPOINT}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });

      if (!response.ok) {
        throw new Error('Falha na validação online');
      }

      const license: License = await response.json();
      const validation = this.validateLicenseOffline(license);

      // Salva localmente para uso offline
      if (validation.valid) {
        localStorage.setItem(this.LICENSE_STORAGE_KEY, JSON.stringify(license));
      }

      return validation;
    } catch (error) {
      // Fallback para validação offline
      const localLicense = this.getLocalLicense();
      if (localLicense) {
        return this.validateLicenseOffline(localLicense);
      }

      return {
        valid: false,
        status: 'invalid',
        message: 'Não foi possível validar a licença. Sem internet.',
        canUseFeature: () => false,
      };
    }
  }

  /**
   * Valida licença localmente (offline)
   */
  private static validateLicenseOffline(license: License): LicenseValidationResponse {
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);

    // Calcula dias até expiração
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determina status
    let status: LicenseStatus = 'valid';
    let message = 'Licença válida';

    if (license.status === 'suspended') {
      status = 'suspended';
      message = 'Licença suspensa';
    } else if (license.status === 'invalid') {
      status = 'invalid';
      message = 'Licença inválida';
    } else if (daysUntilExpiration <= 0) {
      status = 'expired';
      message = 'Licença expirada';
    } else if (daysUntilExpiration <= 30) {
      status = 'valid';
      message = `Licença vence em ${daysUntilExpiration} dias`;
    }

    return {
      valid: status === 'valid',
      status,
      message,
      license,
      daysUntilExpiration,
      canUseFeature: (feature: string) => license.features[feature] ?? false,
    };
  }

  /**
   * Ativa uma licença
   */
  static async activateLicense(licenseKey: string): Promise<License> {
    const response = await fetch(`${this.LICENSE_ENDPOINT}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      throw new Error('Falha ao ativar licença');
    }

    const license: License = await response.json();
    localStorage.setItem(this.LICENSE_STORAGE_KEY, JSON.stringify(license));

    return license;
  }

  /**
   * Obtém licença armazenada localmente
   */
  static getLocalLicense(): License | null {
    const stored = localStorage.getItem(this.LICENSE_STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Salva licença
   */
  static setLocalLicense(license: License): void {
    localStorage.setItem(this.LICENSE_STORAGE_KEY, JSON.stringify(license));
  }

  /**
   * Remove licença
   */
  static clearLocalLicense(): void {
    localStorage.removeItem(this.LICENSE_STORAGE_KEY);
  }

  /**
   * Verifica se a licença local foi validada recentemente
   */
  private static isRecentValidation(license: License): boolean {
    const lastValidation = new Date(license.lastValidatedAt);
    const now = new Date();
    const timeSinceValidation = now.getTime() - lastValidation.getTime();

    return timeSinceValidation < this.VALIDATION_INTERVAL;
  }

  /**
   * Obtém plano baseado no tipo
   */
  static getPlan(planType: PlanType): Plan | undefined {
    return plans.find((p) => p.id === planType);
  }

  /**
   * Obtém todos os planos
   */
  static getAllPlans(): Plan[] {
    return plans;
  }

  /**
   * Renova licença
   */
  static async renewLicense(licenseId: string, paymentId: string): Promise<License> {
    const response = await fetch(`${this.LICENSE_ENDPOINT}/${licenseId}/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });

    if (!response.ok) {
      throw new Error('Falha ao renovar licença');
    }

    const license: License = await response.json();
    return license;
  }

  /**
   * Faz upgrade de plano
   */
  static async upgradePlan(
    subscriptionId: string,
    newPlanType: PlanType
  ): Promise<Subscription> {
    const response = await fetch(`/api/v1/subscriptions/${subscriptionId}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPlanType }),
    });

    if (!response.ok) {
      throw new Error('Falha ao fazer upgrade');
    }

    return response.json();
  }

  /**
   * Cancela assinatura
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(
      `/api/v1/subscriptions/${subscriptionId}/cancel`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error('Falha ao cancelar assinatura');
    }
  }

  /**
   * Valida se um equipamento pode ser adicionado baseado no plano
   */
  static canAddEquipment(license: License, currentCount: number): boolean {
    return currentCount < license.maxEquipment;
  }

  /**
   * Valida se um usuário pode ser adicionado baseado no plano
   */
  static canAddUser(license: License, currentCount: number): boolean {
    return currentCount < license.maxUsers;
  }

  /**
   * Obtém informações de uso
   */
  static async getUsageInfo(licenseId: string) {
    const response = await fetch(`${this.LICENSE_ENDPOINT}/${licenseId}/usage`);

    if (!response.ok) {
      throw new Error('Falha ao obter informações de uso');
    }

    return response.json();
  }
}
