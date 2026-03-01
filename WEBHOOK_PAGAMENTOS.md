# 🔔 Webhook de Pagamentos (Ativação Automática)

Este guia conecta seu provedor de pagamento (Pix/cartão/transferência) ao Supabase para:

1. Confirmar pagamento
2. Ativar/atualizar assinatura
3. Atualizar plano do usuário automaticamente

---

## 1) Pré-requisito

Execute as migrations no Supabase SQL Editor, em ordem:

1. `001_initial_schema.sql`
2. `002_enforce_plan_limits_and_tenant_security.sql`
3. `003_billing_auto_activation.sql`

---

## 2) Função principal (já criada)

Função SQL:

`public.confirm_payment_and_activate_subscription(...)`

Ela faz tudo em transação lógica:

- grava/atualiza `payment_events`
- grava/atualiza `subscriptions`
- atualiza `users.plan_type` (e o trigger ajusta `max_equipment_limit`)

---

## 3) Exemplo de chamada SQL manual

```sql
select public.confirm_payment_and_activate_subscription(
  p_external_payment_id := 'pix_20260301_0001',
  p_user_id := '00000000-0000-0000-0000-000000000000',
  p_plan_type := 'pro',
  p_amount := 150,
  p_payment_method := 'pix',
  p_billing_cycle := 'monthly',
  p_provider := 'manual',
  p_payload := '{"source":"admin_sql"}'::jsonb
);
```

---

## 4) Exemplo de webhook (Edge Function / Backend)

Quando o provedor confirmar pagamento (`paid`, `approved`), converta o evento para:

```json
{
  "externalPaymentId": "pix_20260301_0001",
  "userId": "UUID_DO_CLIENTE",
  "planType": "pro",
  "amount": 150,
  "paymentMethod": "pix",
  "billingCycle": "monthly",
  "provider": "mercado_pago",
  "payload": {
    "raw": "...evento original..."
  }
}
```

Depois execute RPC com `service_role`:

```ts
const { data, error } = await supabaseAdmin.rpc('confirm_payment_and_activate_subscription', {
  p_external_payment_id: body.externalPaymentId,
  p_user_id: body.userId,
  p_plan_type: body.planType,
  p_amount: body.amount,
  p_payment_method: body.paymentMethod,
  p_billing_cycle: body.billingCycle,
  p_provider: body.provider,
  p_payload: body.payload ?? {},
});
```

---

## 5) Regras de negócio atuais

Planos e limites:

- `free`: 10 equipamentos
- `pro`: 100 equipamentos
- `enterprise`: 400 equipamentos

Anuais equivalentes:

- `annual-pro`: 100
- `annual-enterprise`: 400

---

## 6) Verificação rápida

Após o webhook, rode:

```sql
select id, email, plan_type, max_equipment_limit
from public.users
where id = 'UUID_DO_CLIENTE';

select user_id, plan_type, billing_cycle, status, next_billing_at
from public.subscriptions
where user_id = 'UUID_DO_CLIENTE';

select external_payment_id, status, amount, paid_at
from public.payment_events
where user_id = 'UUID_DO_CLIENTE'
order by created_at desc
limit 10;
```

---

## 7) Segurança recomendada

- Valide assinatura do webhook do provedor (HMAC/secret)
- Rejeite eventos sem `status=paid/approved`
- Garanta idempotência com `external_payment_id` único
- Use somente `service_role` para chamar a função
