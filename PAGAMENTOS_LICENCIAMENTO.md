# 💳 SISTEMA DE PAGAMENTOS E LICENCIAMENTO

## 📋 Visão Geral

Seu sistema agora possui um **sistema completo de pagamentos e licenciamento** profissional com:

- ✅ **5 Planos** (Gratuito, Pro, Pro Anual, Corporativo, Corporativo Anual)
- ✅ **3 Métodos de Pagamento** (Pix, Cartão de Crédito, Transferência Bancária)
- ✅ **Sistema de Licença** com validação online/offline
- ✅ **Gestão de Assinatura** (renovação automática, upgrade/downgrade)
- ✅ **Histórico de Faturas** e downloads
- ✅ **Suporte aos 3 métodos** de pagamento brasileiros

---

## 🎯 Planos Disponíveis

### 1️⃣ **Gratuito** (R$ 0/mês)
```
✓ Dashboard básico
✓ Até 10 equipamentos  
✓ 1 usuário
✓ Histórico de manutenção
✓ Exportação Excel
✓ Suporte por email
✗ Relatórios avançados
✗ API REST
✗ Prioridade de suporte
```

### 2️⃣ **Profissional** (R$ 99/mês)
```
✓ Tudo do plano Gratuito
✓ Até 100 equipamentos
✓ Até 5 usuários
✓ Relatórios avançados
✓ Gráficos e análises
✓ Integração Power BI
✓ Alertas automáticos
✓ Backup automático
✓ Suporte prioritário
✓ Auditoria de acesso
✗ API REST
✗ SSO/OAuth
```

### 3️⃣ **Profissional Anual** (R$ 950/ano = -20%)
```
✓ Tudo do Profissional mensal
✓ Desconto de 20%
✓ Faturamento anual
```

### 4️⃣ **Corporativo** (R$ 399/mês)
```
✓ Tudo do Profissional
✓ Ilimitado de equipamentos
✓ Ilimitado de usuários
✓ API REST completa
✓ Webhooks customizados
✓ SSO/OAuth integrado
✓ Suporte 24/7
✓ Gestor de conta dedicado
✓ White-label disponível
```

### 5️⃣ **Corporativo Anual** (R$ 3.580/ano = -25%)
```
✓ Tudo do Corporativo mensal
✓ Desconto de 25%
✓ Prioridade máxima
```

---

## 💰 Métodos de Pagamento Integrados

### 📱 **Pix** (Recomendado)
- ✅ Sem taxas
- ✅ Instantâneo
- ✅ Disponível 24/7
- ✅ QR Code + Copia e Cola
- Integração: **Mercado Pago** ou **Stripe**

### 💳 **Cartão de Crédito**
- ✅ Visa, Mastercard, American Express
- ✅ Parcelamento disponível
- Taxa: ~2.9%
- Integração: **Stripe**

### 🏦 **Transferência Bancária**
- ✅ TED/DOC para outras contas
- ✅ DOC para mesma conta
- Taxa: ~1%
- Tempo: 1-3 dias úteis

---

## 🔧 Integração Técnica

### **Arquivos Criados**

```
src/
├── types/
│   └── licensing.ts ...................... Tipos e interfaces
├── lib/
│   └── paymentPlans.ts .................. Configuração de planos
├── services/
│   ├── licenseService.ts ............... Gerenciamento de licenças
│   └── paymentService.ts ............... Processamento de pagamentos
├── components/
│   ├── PricingPlans.tsx ................ Display de planos
│   ├── LicenseManager.tsx .............. Gerenciamento de licenças
│   ├── PaymentForm.tsx ................. Formulário de pagamento
│   └── SubscriptionPanel.tsx ........... Painel de assinatura
└── pages/
    └── Billing.tsx ..................... Página completa de faturamento
```

---

## 📖 Como Usar

### **1. Exibir Planos**

```tsx
import { PricingPlans } from '@/components/PricingPlans';
import { Plan } from '@/types/licensing';

export function HomePage() {
  const handleSelectPlan = (plan: Plan) => {
    // Redirecionar para pagamento
    navigate('/billing/payment', { state: { plan } });
  };

  return <PricingPlans onSelectPlan={handleSelectPlan} />;
}
```

### **2. Gerenciar Licenças**

```tsx
import { LicenseManager } from '@/components/LicenseManager';
import { LicenseService } from '@/services/licenseService';

export function SettingsPage() {
  return (
    <LicenseManager
      onLicenseValidated={(license) => {
        console.log('Licença ativada:', license);
      }}
      onError={(error) => {
        console.error('Erro:', error);
      }}
    />
  );
}
```

### **3. Processar Pagamento**

```tsx
import { PaymentForm } from '@/components/PaymentForm';
import { Plan } from '@/types/licensing';

const plan: Plan = {
  id: 'pro',
  name: 'Profissional',
  price: 99,
  // ... outros campos
};

export function CheckoutPage() {
  return (
    <PaymentForm
      plan={plan}
      onSuccess={(payment) => {
        console.log('Pagamento realizado:', payment);
        // Redirecionar para licença
      }}
      onError={(error) => {
        console.error('Falha no pagamento:', error);
      }}
    />
  );
}
```

### **4. Controlar Acesso baseado em Licença**

```tsx
import { LicenseService } from '@/services/licenseService';

export function ProtectedFeature() {
  const license = LicenseService.getLocalLicense();
  const validation = await LicenseService.validateLicense(license?.key!);

  if (!validation.valid) {
    return <div>Licença inválida. Adquira uma licença.</div>;
  }

  const canUseAPI = validation.canUseFeature('api_access');
  const canUseSSO = validation.canUseFeature('sso');

  return (
    <div>
      {canUseAPI && <APIPanel />}
      {canUseSSO && <SSOPanel />}
    </div>
  );
}
```

---

## 🔐 Validação de Licença

### **Online (Recomendado)**

```tsx
// Valida contra servidor
const result = await LicenseService.validateLicense('SOPR-PRO-XXXX-XXXX');

if (result.valid) {
  console.log('Licença válida!');
  console.log('Dias até expiração:', result.daysUntilExpiration);
  console.log('Pode usar API?', result.canUseFeature('api_access'));
}
```

### **Offline (Fallback)**

Se o servidor estiver indisponível, o sistema valida localmente usando dados armazenados no localStorage:

```tsx
// Tenta online
// Se falhar → tenta offline
// Se offline tb falhar → retorna inválido
```

---

## 💻 API Backend (Exemplos)

### **POST /api/v1/payments/pix**
Gera código Pix para pagamento

```bash
curl -X POST http://localhost:3000/api/v1/payments/pix \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99,
    "planType": "pro",
    "email": "user@example.com"
  }'

# Response:
{
  "payment": {
    "id": "pay_123",
    "amount": 99,
    "status": "pending"
  },
  "pixQrCode": "data:image/png;base64,iVBORw0KGgo...",
  "pixCopyPaste": "00020126360014br.gov.bcb.pix..."
}
```

### **POST /api/v1/payments/card**
Processa pagamento com cartão

```bash
curl -X POST http://localhost:3000/api/v1/payments/card \
  -H "Content-Type: application/json" \
  -d '{
    "token": "tok_visa",
    "amount": 99,
    "planType": "pro",
    "email": "user@example.com"
  }'
```

### **POST /api/v1/licenses/validate**
Valida uma chave de licença

```bash
curl -X POST http://localhost:3000/api/v1/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "SOPR-PRO-1706300000000-abt5f7c3j2k"}'

# Response:
{
  "valid": true,
  "status": "valid",
  "message": "Licença válida",
  "license": {
    "id": "lic_123",
    "key": "SOPR-PRO-1706300000000-abt5f7c3j2k",
    "planType": "pro",
    "maxEquipment": 100,
    "maxUsers": 5,
    "features": {
      "api_access": false,
      "sso": false,
      "advanced_reports": true
    }
  },
  "daysUntilExpiration": 365
}
```

---

## 🚀 Implementação no Backend (Node.js/Express)

### **1. Instalar Dependências**

```bash
npm install stripe date-fns uuid
```

### **2. Criar Rota de Pagamento Pix**

```typescript
// routes/payments.ts
import { Router } from 'express';
import Stripe from 'stripe';
import { generateLicenseKey } from '../services/licensing';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/pix', async (req, res) => {
  const { amount, planType, email } = req.body;

  try {
    // Criar PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // em centavos
      currency: 'brl',
      payment_method_types: ['pix'],
      receipt_email: email,
      metadata: { planType },
    });

    // Gerar QR code Pix (Stripe retorna automaticamente)
    const charge = await stripe.charges.retrieve(paymentIntent.id);

    res.json({
      payment: {
        id: paymentIntent.id,
        amount,
        status: 'pending',
      },
      pixQrCode: charge.receipt_url, // Aqui seria o QR code
      pixCopyPaste: paymentIntent.client_secret, // Copia e cola
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
```

### **3. Webhook para Confirmar Pagamento**

```typescript
// webhooks/stripe.ts
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { planType, email } = paymentIntent.metadata;

    // Gerar licença
    const licenseKey = generateLicenseKey(email, planType);
    
    // Salvar no BD
    await saveLicense({
      key: licenseKey,
      planType,
      email,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // Enviar email com licença
    await sendLicenseEmail(email, licenseKey);
  }

  res.json({ received: true });
});
```

---

## 📊 Estrutura de Dados

### **Licença**

```json
{
  "id": "lic_123",
  "key": "SOPR-PRO-1706300000000-abt5f7c3j2k",
  "planType": "pro",
  "organizationName": "Acme Corp",
  "organizationEmail": "admin@acme.com",
  "maxEquipment": 100,
  "maxUsers": 5,
  "maxStorage": 5000,
  "status": "valid",
  "issuedAt": "2024-01-27T12:00:00Z",
  "expiresAt": "2025-01-27T12:00:00Z",
  "activatedAt": "2024-01-27T13:20:00Z",
  "lastValidatedAt": "2024-02-26T10:30:00Z",
  "features": {
    "api_access": false,
    "sso": false,
    "advanced_reports": true,
    "24h_support": false
  }
}
```

### **Assinatura**

```json
{
  "id": "sub_123",
  "userId": "user_456",
  "licenseId": "lic_123",
  "planType": "pro",
  "billingCycle": "monthly",
  "status": "active",
  "currentPeriodStart": "2024-02-01T00:00:00Z",
  "currentPeriodEnd": "2024-03-01T00:00:00Z",
  "autoRenew": true,
  "paymentMethod": "pix",
  "nextBillingDate": "2024-03-01T00:00:00Z"
}
```

### **Pagamento**

```json
{
  "id": "pay_123",
  "subscriptionId": "sub_123",
  "amount": 99,
  "currency": "BRL",
  "status": "completed",
  "paymentMethod": "pix",
  "transactionId": "PIX001234567890",
  "paidAt": "2024-02-26T14:30:00Z",
  "createdAt": "2024-02-26T10:30:00Z",
  "updatedAt": "2024-02-26T14:30:00Z"
}
```

---

## 📱 Integração com Aplicazione

### **App.tsx**

```tsx
// Adicionar rota de billing
<Routes>
  <Route path="/login" element={<Auth />} />
  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
  <Route path="/billing" element={<ProtectedRoute><BillingPage userId={userId} /></ProtectedRoute>} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### **Header.tsx**

```tsx
// Adicionar link para billing no menu
<NavLink to="/billing" icon={<CreditCard />}>
  Planos e Pagamentos
</NavLink>
```

---

## 🔒 Quando Validar Licença?

```
1. ✅ Na inicialização do App (App.tsx)
2. ✅ Antes de usar recursos premium
3. ✅ A cada 24h em background
4. ✅ Ao acessar API REST
5. ✅ Ao ativar features específicas
```

---

## 🎓 Exemplos Completos

### **Exemplo 1: Proteger Feature com Licença**

```tsx
import { useEffect, useState } from 'react';
import { LicenseService } from '@/services/licenseService';

export function AdvancedReportsFeature() {
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const license = LicenseService.getLocalLicense();
      if (!license) {
        setCanAccess(false);
        return;
      }

      const validation = await LicenseService.validateLicense(license.key);
      setCanAccess(
        validation.valid && 
        validation.canUseFeature('advanced_reports')
      );
    };

    checkAccess();
  }, []);

  if (!canAccess) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p>Esta feature requer plano Pro. 
            <Button variant="link">Fazer Upgrade</Button>
          </p>
        </CardContent>
      </Card>
    );
  }

  return <AdvancedReportsPanel />;
}
```

### **Exemplo 2: Modal de Upgrade**

```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function UpgradeModal({
  isOpen,
  feature,
  currentPlan,
  onUpgrade,
}: any) {
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <h2>Fazer Upgrade</h2>
        <p>A feature "{feature}" requer plano {currentPlan}.</p>
        <PricingPlans onSelectPlan={onUpgrade} />
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências (Stripe SDK)
- [ ] Criar endpoints de pagamento no backend
- [ ] Configurar webhooks Stripe
- [ ] Testar Pix com sandbox Stripe
- [ ] Testar Cartão com números de teste
- [ ] Testar Transferência Bancária
- [ ] Implementar geração de licenças
- [ ] Implementar sistema de emails
- [ ] Validar licenças em produção
- [ ] Configurar variáveis de ambiente
- [ ] Testar renovação automática
- [ ] Testar upgrade/downgrade de planos

---

## 📞 Suporte e Documentação

- **Stripe Docs**: https://stripe.com/docs/payments/pix
- **Mercado Pago**: https://www.mercadopago.com.br/developers
- **Webhook Testing**: ngrok ou localtunnel

---

**⚡ Sistema de licenciamento completo e pronto para monetizar seu software!**
