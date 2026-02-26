/**
 * Script SQL para criar as tabelas no Supabase
 * Execute este script no Supabase SQL Editor
 */

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS maintenance_history CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (extends built-in auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'supervisor', 'tecnico', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  elevacao NUMERIC NOT NULL,
  altura NUMERIC NOT NULL,
  descricao TEXT,
  area TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status_geral TEXT NOT NULL DEFAULT 'ok' CHECK (status_geral IN ('ok', 'warning', 'critical', 'overdue')),
  proxima_manutencao_geral DATE,
  dias_restantes_geral INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Maintenance records (actual maintenance tasks for each equipment)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  type_id TEXT NOT NULL,
  label TEXT NOT NULL,
  periodicidade TEXT NOT NULL,
  ultima_manutencao DATE,
  proxima_manutencao DATE,
  dias_restantes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('ok', 'warning', 'critical', 'overdue', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance history (audit trail)
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type_id TEXT NOT NULL,
  data_manutencao DATE NOT NULL,
  data_proxima DATE,
  realizado_por TEXT NOT NULL,
  notas TEXT,
  resultado TEXT CHECK (resultado IN ('sucesso', 'falho', 'pendente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts (notifications for critical/overdue maintenance)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('critico', 'aviso', 'info')),
  mensagem TEXT NOT NULL,
  lido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_equipment_area ON equipment(area);
CREATE INDEX idx_equipment_status ON equipment(status_geral);
CREATE INDEX idx_maintenance_records_equipment_id ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_history_equipment_id ON maintenance_history(equipment_id);
CREATE INDEX idx_maintenance_history_data ON maintenance_history(data_manutencao);
CREATE INDEX idx_alerts_equipment_id ON alerts(equipment_id);
CREATE INDEX idx_alerts_lido ON alerts(lido);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can see all equipment and related data
CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Users can view maintenance records" ON maintenance_records FOR SELECT USING (true);
CREATE POLICY "Users can view maintenance history" ON maintenance_history FOR SELECT USING (true);
CREATE POLICY "Users can view alerts" ON alerts FOR SELECT USING (true);

-- Admins and supervisors can insert/update/delete
CREATE POLICY "Admins can insert equipment" ON equipment FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'supervisor'))
);

CREATE POLICY "Admins can update equipment" ON equipment FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'supervisor'))
);

CREATE POLICY "Admins can insert maintenance records" ON maintenance_records FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'supervisor', 'tecnico'))
);

CREATE POLICY "Admins can update maintenance records" ON maintenance_records FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'supervisor', 'tecnico'))
);

CREATE POLICY "Admins can insert history" ON maintenance_history FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'supervisor', 'tecnico'))
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_history_updated_at BEFORE UPDATE ON maintenance_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
