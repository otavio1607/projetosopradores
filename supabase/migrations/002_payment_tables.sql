/**
 * Migração: tabelas para logs de pagamento e eventos de webhook
 *
 * Execute este script no Supabase SQL Editor após 001_initial_schema.sql
 */

-- Tabela de logs de tentativas de pagamento (auditoria PCI-DSS)
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('credit_card', 'pix', 'bank_transfer', 'trial')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  error_code TEXT,
  error_message TEXT,
  provider TEXT,
  sandbox_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frequentes
CREATE INDEX idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);

-- Tabela de eventos de webhook recebidos (rastreabilidade e reprocessamento)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'pagarme', 'manual')),
  payload JSONB NOT NULL,
  signature TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at);

-- RLS para payment_logs: somente o próprio usuário e admins
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment logs" ON payment_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Service can insert payment logs" ON payment_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS para webhook_events: somente admins
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Service can insert webhook events" ON webhook_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update webhook events" ON webhook_events
  FOR UPDATE USING (true);
