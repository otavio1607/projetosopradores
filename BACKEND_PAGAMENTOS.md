# 🚀 IMPLEMENTAÇÃO BACKEND - Pagamentos e Licenciamento

## Visão Geral

Guia completo para implementar o backend de pagamentos e licenciamento em Node.js/Express.

---

## 📦 Dependências

```bash
npm install express stripe uuid date-fns pg dotenv axios cors
npm install -D @types/express @types/node typescript
```

---

## 📁 Estrutura de Pastas

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── payments.routes.ts
│   │   │   ├── licenses.routes.ts
│   │   │   ├── subscriptions.routes.ts
│   │   │   └── invoices.routes.ts
│   │   ├── controllers/
│   │   │   ├── PaymentController.ts
│   │   │   ├── LicenseController.ts
│   │   │   └── SubscriptionController.ts
│   │   └── middleware/
│   │       ├── validateLicense.ts
│   │       └── auth.ts
│   ├── services/
│   │   ├── StripeService.ts
│   │   ├── LicenseService.ts
│   │   ├── EmailService.ts
│   │   └── DatabaseService.ts
│   ├── models/
│   │   ├── License.ts
│   │   ├── Subscription.ts
│   │   ├── Payment.ts
│   │   └── Invoice.ts
│   ├── webhooks/
│   │   └── stripe.webhook.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── stripe.ts
│   │   └── email.ts
│   └── app.ts
├── .env
├── .env.example
└── package.json
```

---

## 1️⃣ Configuração Básica (app.ts)

```typescript
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;
```

---

## 2️⃣ Stripe Service

```typescript
// services/StripeService.ts
import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Cria uma PaymentIntent para Pix
   */
  async createPixPaymentIntent(
    amount: number,
    email: string,
    planType: string
  ) {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // em centavos
      currency: 'brl',
      payment_method_types: ['pix'],
      receipt_email: email,
      description: `Plano ${planType}`,
      metadata: { planType, email },
      statement_descriptor: 'SOPRADORES APP',
    });
  }

  /**
   * Cria uma PaymentIntent para Cartão de Crédito
   */
  async createCardPaymentIntent(
    amount: number,
    email: string,
    planType: string,
    token: string
  ) {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      payment_method_types: ['card'],
      receipt_email: email,
      description: `Plano ${planType}`,
      metadata: { planType, email },
      statement_descriptor: 'SOPRADORES APP',
    });
  }

  /**
   * Obtém detalhes da PaymentIntent
   */
  async getPaymentIntent(id: string) {
    return this.stripe.paymentIntents.retrieve(id);
  }

  /**
   * Confirmar pagamento
   */
  async confirmPaymentIntent(id: string, paymentMethod: string) {
    return this.stripe.paymentIntents.confirm(id, {
      payment_method: paymentMethod,
      return_url: `${process.env.APP_URL}/billing/success`,
    });
  }

  /**
   * Refundar pagamento
   */
  async refundPayment(paymentIntentId: string, reason: string) {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: { customReason: reason },
    });
  }

  /**
   * Verificar status do Pix
   */
  async checkPixStatus(paymentIntentId: string) {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: pi.status,
      amount: pi.amount,
      currency: pi.currency,
      clientSecret: pi.client_secret,
    };
  }
}
```

---

## 3️⃣ License Service

```typescript
// services/LicenseService.ts
import { v4 as uuidv4 } from 'uuid';
import { addYears } from 'date-fns';
import { DatabaseService } from './DatabaseService';

export interface License {
  id: string;
  key: string;
  planType: string;
  organizationName: string;
  organizationEmail: string;
  maxEquipment: number;
  maxUsers: number;
  status: 'valid' | 'expired' | 'invalid' | 'suspended';
  issuedAt: Date;
  expiresAt: Date;
  features: Record<string, boolean>;
}

export class LicenseService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Gera uma chave de licença
   */
  generateKey(planType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `SOPR-${planType.toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Cria uma licença
   */
  async createLicense(
    planType: string,
    organizationName: string,
    organizationEmail: string,
    billingCycle: 'monthly' | 'annual'
  ): Promise<License> {
    const id = uuidv4();
    const key = this.generateKey(planType);
    
    // Determinar limite baseado no plano
    const limits = this.getPlanLimits(planType);
    
    // Expiração
    const issuedAt = new Date();
    const expiresAt =
      billingCycle === 'monthly'
        ? new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        : addYears(issuedAt, 1);

    const license: License = {
      id,
      key,
      planType,
      organizationName,
      organizationEmail,
      maxEquipment: limits.maxEquipment,
      maxUsers: limits.maxUsers,
      status: 'valid',
      issuedAt,
      expiresAt,
      features: limits.features,
    };

    // Salvar no banco
    await this.db.licenses.insert(license);

    return license;
  }

  /**
   * Valida uma chave de licença
   */
  async validateLicense(key: string) {
    const license = await this.db.licenses.findByKey(key);

    if (!license) {
      return {
        valid: false,
        status: 'invalid',
        message: 'Licença não encontrada',
      };
    }

    const now = new Date();
    if (license.expiresAt < now) {
      return {
        valid: false,
        status: 'expired',
        message: 'Licença expirada',
        license,
      };
    }

    if (license.status === 'suspended') {
      return {
        valid: false,
        status: 'suspended',
        message: 'Licença suspensa',
        license,
      };
    }

    return {
      valid: true,
      status: 'valid',
      message: 'Licença válida',
      license,
    };
  }

  /**
   * Ativa uma licença
   */
  async activateLicense(key: string, deviceFingerprint?: string) {
    const license = await this.db.licenses.findByKey(key);

    if (!license) {
      throw new Error('Licença não encontrada');
    }

    await this.db.licenses.update(license.id, {
      hardwareFingerprint: deviceFingerprint,
      activatedAt: new Date(),
      lastValidatedAt: new Date(),
    });

    return license;
  }

  /**
   * Renova uma licença
   */
  async renewLicense(licenseId: string, paymentId: string) {
    const license = await this.db.licenses.findById(licenseId);

    if (!license) {
      throw new Error('Licença não encontrada');
    }

    const newExpiresAt = addYears(new Date(), 1);

    await this.db.licenses.update(licenseId, {
      expiresAt: newExpiresAt,
      status: 'valid',
    });

    // Registrar renovação
    await this.db.licenseHistory.insert({
      licenseId,
      action: 'renew',
      paymentId,
      timestamp: new Date(),
    });

    return license;
  }

  /**
   * Obtém limites de acordo com o plano
   */
  private getPlanLimits(planType: string) {
    const limits: Record<
      string,
      {
        maxEquipment: number;
        maxUsers: number;
        features: Record<string, boolean>;
      }
    > = {
      free: {
        maxEquipment: 10,
        maxUsers: 1,
        features: {
          api_access: false,
          sso: false,
          advanced_reports: false,
          support_24h: false,
        },
      },
      pro: {
        maxEquipment: 100,
        maxUsers: 5,
        features: {
          api_access: false,
          sso: false,
          advanced_reports: true,
          support_24h: false,
        },
      },
      enterprise: {
        maxEquipment: 999,
        maxUsers: 99,
        features: {
          api_access: true,
          sso: true,
          advanced_reports: true,
          support_24h: true,
        },
      },
    };

    return limits[planType] || limits.free;
  }
}
```

---

## 4️⃣ Payment Routes

```typescript
// routes/payments.routes.ts
import { Router, Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { LicenseService } from '../services/LicenseService';
import { EmailService } from '../services/EmailService';

const router = Router();
const stripeService = new StripeService();
const licenseService = new LicenseService();
const emailService = new EmailService();

/**
 * POST /api/v1/payments/pix
 * Cria um código Pix para pagamento
 */
router.post('/pix', async (req: Request, res: Response) => {
  try {
    const { amount, planType, email } = req.body;

    // Validar
    if (!amount || !planType || !email) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Criar PaymentIntent
    const paymentIntent = await stripeService.createPixPaymentIntent(
      amount,
      email,
      planType
    );

    // Pix QR Code é gerado automaticamente pelo Stripe
    // Em um cenário real, você buscaria de um serviço de geração de QR

    res.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        amount,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      },
      pixQrCode: 'data:image/png;base64,...', // QR code em base64
      pixCopyPaste: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erro ao criar Pix:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento Pix' });
  }
});

/**
 * POST /api/v1/payments/card
 * Processa pagamento com cartão
 */
router.post('/card', async (req: Request, res: Response) => {
  try {
    const { amount, planType, email, token } = req.body;

    const paymentIntent = await stripeService.createCardPaymentIntent(
      amount,
      email,
      planType,
      token
    );

    // Confirmar pagamento
    const confirmed = await stripeService.confirmPaymentIntent(
      paymentIntent.id,
      token
    );

    res.json({
      success: true,
      payment: {
        id: confirmed.id,
        amount,
        status: confirmed.status,
      },
    });
  } catch (error) {
    console.error('Erro ao processar cartão:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

/**
 * POST /api/v1/payments/bank-transfer
 * Gera dados para transferência bancária
 */
router.post('/bank-transfer', async (req: Request, res: Response) => {
  try {
    const { amount, planType, email } = req.body;

    // Gerar código de referência
    const referenceCode = `RF${Date.now()}`;

    const bankDetails = {
      bankCode: process.env.BANK_CODE,
      bankName: 'Banco do Brasil',
      accountNumber: process.env.BANK_ACCOUNT,
      accountDigit: process.env.BANK_ACCOUNT_DIGIT,
      agencyNumber: process.env.BANK_AGENCY,
      accountType: process.env.BANK_ACCOUNT_TYPE,
      recipientName: process.env.BANK_RECIPIENT_NAME,
      recipientDocument: process.env.BANK_RECIPIENT_DOCUMENT,
      amount,
      referenceCode,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Salvar pagamento como pendente
    // await db.payments.insert({ ... });

    res.json({
      success: true,
      payment: {
        id: referenceCode,
        amount,
        status: 'pending',
      },
      bankDetails,
    });
  } catch (error) {
    console.error('Erro ao gerar transferência:', error);
    res.status(500).json({ error: 'Erro ao processar transferência' });
  }
});

/**
 * GET /api/v1/payments/pix/:paymentId/status
 * Verifica status de pagamento Pix
 */
router.get('/pix/:paymentId/status', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const status = await stripeService.checkPixStatus(paymentId);

    res.json({ success: true, status });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

export default router;
```

---

## 5️⃣ License Routes

```typescript
// routes/licenses.routes.ts
import { Router, Request, Response } from 'express';
import { LicenseService } from '../services/LicenseService';

const router = Router();
const licenseService = new LicenseService();

/**
 * POST /api/v1/licenses/validate
 * Valida uma chave de licença
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'Chave de licença obrigatória' });
    }

    const result = await licenseService.validateLicense(licenseKey);

    res.json(result);
  } catch (error) {
    console.error('Erro ao validar licença:', error);
    res.status(500).json({ error: 'Erro ao validar licença' });
  }
});

/**
 * POST /api/v1/licenses/activate
 * Ativa uma licença
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { licenseKey, deviceFingerprint } = req.body;

    const license = await licenseService.activateLicense(
      licenseKey,
      deviceFingerprint
    );

    res.json({
      success: true,
      license,
    });
  } catch (error) {
    console.error('Erro ao ativar licença:', error);
    res.status(500).json({ error: 'Erro ao ativar licença' });
  }
});

/**
 * GET /api/v1/licenses/:licenseId
 * Obtém detalhes da licença
 */
router.get('/:licenseId', async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;
    // const license = await db.licenses.findById(licenseId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter licença' });
  }
});

export default router;
```

---

## 6️⃣ Webhook Stripe

```typescript
// webhooks/stripe.webhook.ts
import { Router, Request, Response, raw } from 'express';
import Stripe from 'stripe';
import { LicenseService } from '../services/LicenseService';
import { EmailService } from '../services/EmailService';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const licenseService = new LicenseService();
const emailService = new EmailService();

/**
 * POST /api/webhooks/stripe
 * Webhook para eventos Stripe
 */
router.post(
  '/stripe',
  raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      // Event: payment_intent.succeeded
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { planType, email } = paymentIntent.metadata || {};

        console.log('✅ Pagamento bem-sucedido:', paymentIntent.id);

        // Criar licença
        const license = await licenseService.createLicense(
          planType,
          email || 'cliente',
          email || 'unknown@example.com',
          'monthly'
        );

        // Enviar email com licença
        await emailService.sendLicenseEmail(email, license.key);

        // Salvar payment no BD
        // await db.payments.insert({
        //   external_id: paymentIntent.id,
        //   amount: paymentIntent.amount / 100,
        //   status: 'completed',
        //   ...
        // });
      }

      // Event: payment_intent.payment_failed
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { email } = paymentIntent.metadata || {};

        console.log('❌ Pagamento falhou:', paymentIntent.id);

        // Notificar usuário
        await emailService.sendPaymentFailedEmail(email);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  }
);

export default router;
```

---

## 7️⃣ Email Service

```typescript
// services/EmailService.ts
import sgMail from '@sendgrid/mail';

export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  /**
   * Envia email com chave de licença
   */
  async sendLicenseEmail(email: string, licenseKey: string) {
    const message = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: '🎉 Sua Licença foi Ativada!',
      html: `
        <h1>Bem-vindo ao Sopradores!</h1>
        <p>Sua licença foi ativada com sucesso.</p>
        <h2>Sua Chave de Licença:</h2>
        <code style="background: #f0f0f0; padding: 10px;">${licenseKey}</code>
        <p>Guarde esta chave em um local seguro.</p>
        <p><a href="${process.env.APP_URL}/billing">Ir para Configurações</a></p>
      `,
    };

    return sgMail.send(message);
  }

  /**
   * Envia email de falha de pagamento
   */
  async sendPaymentFailedEmail(email: string) {
    const message = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: '❌ Seu Pagamento Falhou',
      html: `
        <h1>Seu Pagamento Falhou</h1>
        <p>Houve um problema ao processar seu pagamento.</p>
        <p><a href="${process.env.APP_URL}/billing">Tentar Novamente</a></p>
      `,
    };

    return sgMail.send(message);
  }

  /**
   * Envia e-mail de renovação de licença
   */
  async sendRenewalReminderEmail(email: string, daysUntilExpiration: number) {
    const message = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: `⏰ Sua Licença Vence em ${daysUntilExpiration} Dias`,
      html: `
        <h1>Renovação de Licença</h1>
        <p>Sua licença vence em ${daysUntilExpiration} dias.</p>
        <p><a href="${process.env.APP_URL}/billing">Renovar Licença</a></p>
      `,
    };

    return sgMail.send(message);
  }
}
```

---

## 8️⃣ Database Service (Supabase)

```typescript
// services/DatabaseService.ts
import { createClient } from '@supabase/supabase-js';

export class DatabaseService {
  private supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  licenses = {
    insert: async (license: any) =>
      this.supabase.from('licenses').insert(license),

    findByKey: async (key: string) =>
      this.supabase.from('licenses').select('*').eq('key', key).single(),

    findById: async (id: string) =>
      this.supabase.from('licenses').select('*').eq('id', id).single(),

    update: async (id: string, data: any) =>
      this.supabase.from('licenses').update(data).eq('id', id),
  };

  payments = {
    insert: async (payment: any) =>
      this.supabase.from('payments').insert(payment),

    findById: async (id: string) =>
      this.supabase.from('payments').select('*').eq('id', id).single(),
  };

  subscriptions = {
    insert: async (subscription: any) =>
      this.supabase.from('subscriptions').insert(subscription),

    findByUserId: async (userId: string) =>
      this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single(),
  };

  licenseHistory = {
    insert: async (entry: any) =>
      this.supabase.from('license_history').insert(entry),
  };
}
```

---

## 📝 Variáveis de Ambiente

```env
# Backend
NODE_ENV=development
PORT=3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@example.com

# Banco
BANK_CODE=001
BANK_AGENCY=0001
BANK_ACCOUNT=12345
BANK_ACCOUNT_DIGIT=6
BANK_ACCOUNT_TYPE=checking
BANK_RECIPIENT_NAME=Sua Empresa
BANK_RECIPIENT_DOCUMENT=12345678000190

# URLs
APP_URL=http://localhost:5173
```

---

## ✅ Checklist

- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada
- [ ] Variáveis de ambiente configuradas
- [ ] Stripe Service implementado
- [ ] License Service implementado
- [ ] Rotas de pagamento implementadas
- [ ] Webhook do Stripe registrado
- [ ] Email Service configurado
- [ ] Base de dados criada (Supabase)
- [ ] Testes de integração
- [ ] Deploy em staging
- [ ] Testes finais
- [ ] Deploy em produção

---

**Backend pronto! 🚀**
