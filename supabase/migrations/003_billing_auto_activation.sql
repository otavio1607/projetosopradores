-- Billing: eventos de pagamento + assinatura + auto-ativação de plano

-- =========================
-- 1) Tabelas de billing
-- =========================
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'manual',
  external_payment_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'annual-pro', 'enterprise', 'annual-enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'annual-pro', 'enterprise', 'annual-enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP WITH TIME ZONE,
  next_billing_at TIMESTAMP WITH TIME ZONE,
  last_payment_event_id UUID REFERENCES public.payment_events(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_events_user_id ON public.payment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Triggers de updated_at (função já existe na migration 001)
DROP TRIGGER IF EXISTS update_payment_events_updated_at ON public.payment_events;
CREATE TRIGGER update_payment_events_updated_at
BEFORE UPDATE ON public.payment_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 2) RLS de billing
-- =========================
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment events" ON public.payment_events;
CREATE POLICY "Users can view own payment events"
ON public.payment_events
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- =========================
-- 3) Função de auto-ativação
-- =========================
CREATE OR REPLACE FUNCTION public.confirm_payment_and_activate_subscription(
  p_external_payment_id TEXT,
  p_user_id UUID,
  p_plan_type TEXT,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_provider TEXT DEFAULT 'manual',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_next_billing TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_plan_type NOT IN ('free', 'pro', 'annual-pro', 'enterprise', 'annual-enterprise') THEN
    RAISE EXCEPTION 'plan_type inválido: %', p_plan_type;
  END IF;

  IF p_billing_cycle NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'billing_cycle inválido: %', p_billing_cycle;
  END IF;

  IF p_payment_method NOT IN ('pix', 'credit_card', 'bank_transfer') THEN
    RAISE EXCEPTION 'payment_method inválido: %', p_payment_method;
  END IF;

  IF p_billing_cycle = 'annual' THEN
    v_next_billing := now() + INTERVAL '1 year';
  ELSE
    v_next_billing := now() + INTERVAL '1 month';
  END IF;
  v_period_end := v_next_billing;

  INSERT INTO public.payment_events (
    provider,
    external_payment_id,
    user_id,
    plan_type,
    billing_cycle,
    amount,
    payment_method,
    status,
    paid_at,
    payload
  ) VALUES (
    p_provider,
    p_external_payment_id,
    p_user_id,
    p_plan_type,
    p_billing_cycle,
    p_amount,
    p_payment_method,
    'paid',
    now(),
    COALESCE(p_payload, '{}'::jsonb)
  )
  ON CONFLICT (external_payment_id)
  DO UPDATE SET
    status = 'paid',
    paid_at = now(),
    payload = EXCLUDED.payload,
    updated_at = now()
  RETURNING id INTO v_payment_id;

  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    billing_cycle,
    status,
    started_at,
    current_period_end,
    next_billing_at,
    last_payment_event_id
  ) VALUES (
    p_user_id,
    p_plan_type,
    p_billing_cycle,
    'active',
    now(),
    v_period_end,
    v_next_billing,
    v_payment_id
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    billing_cycle = EXCLUDED.billing_cycle,
    status = 'active',
    current_period_end = EXCLUDED.current_period_end,
    next_billing_at = EXCLUDED.next_billing_at,
    last_payment_event_id = EXCLUDED.last_payment_event_id,
    updated_at = now();

  UPDATE public.users
  SET plan_type = p_plan_type,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_user_id,
    'plan_type', p_plan_type,
    'billing_cycle', p_billing_cycle,
    'next_billing_at', v_next_billing,
    'payment_event_id', v_payment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_payment_and_activate_subscription(
  TEXT, UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.confirm_payment_and_activate_subscription(
  TEXT, UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB
) TO service_role;
