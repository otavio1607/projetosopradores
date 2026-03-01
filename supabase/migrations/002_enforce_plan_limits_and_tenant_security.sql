-- Segurança server-side para plano/mensalidade e limite de equipamentos
-- Objetivo:
-- 1) Limitar quantidade de equipamentos por usuário conforme plano
-- 2) Evitar bypass por chamadas diretas ao banco
-- 3) Isolar dados por usuário (tenant simples por created_by)

-- ==========================================
-- 1) Extensões de plano no cadastro de users
-- ==========================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro', 'annual-pro', 'enterprise', 'annual-enterprise'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS max_equipment_limit INTEGER NOT NULL DEFAULT 10
    CHECK (max_equipment_limit >= 0);

-- Sincroniza limite pelo plano (server-side)
CREATE OR REPLACE FUNCTION public.sync_user_equipment_limit_from_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.max_equipment_limit := CASE NEW.plan_type
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 100
    WHEN 'annual-pro' THEN 100
    WHEN 'enterprise' THEN 400
    WHEN 'annual-enterprise' THEN 400
    ELSE 10
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_equipment_limit_from_plan ON public.users;
CREATE TRIGGER trg_sync_user_equipment_limit_from_plan
BEFORE INSERT OR UPDATE OF plan_type
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_equipment_limit_from_plan();

-- ==========================================
-- 2) Helpers para políticas RLS de equipment
-- ==========================================
CREATE OR REPLACE FUNCTION public.current_user_can_manage_equipment()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'supervisor')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_equipment_limit()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT u.max_equipment_limit FROM public.users u WHERE u.id = auth.uid()),
    0
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_equipment_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.equipment e
  WHERE e.created_by = auth.uid();
$$;

-- created_by sempre do usuário autenticado
ALTER TABLE public.equipment
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- ==========================================
-- 3) Ajuste de unicidade para multi-tenant
-- ==========================================
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_tag_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_created_by_tag_unique
  ON public.equipment (created_by, tag);

-- ==========================================
-- 4) RLS: isolar dados e aplicar limite
-- ==========================================
-- equipment
DROP POLICY IF EXISTS "Users can view all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can update equipment" ON public.equipment;

CREATE POLICY "Users can view own equipment"
ON public.equipment
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can insert own equipment within plan limit"
ON public.equipment
FOR INSERT
WITH CHECK (
  public.current_user_can_manage_equipment()
  AND created_by = auth.uid()
  AND public.current_user_equipment_count() < public.current_user_equipment_limit()
);

CREATE POLICY "Users can update own equipment"
ON public.equipment
FOR UPDATE
USING (public.current_user_can_manage_equipment() AND created_by = auth.uid())
WITH CHECK (public.current_user_can_manage_equipment() AND created_by = auth.uid());

CREATE POLICY "Users can delete own equipment"
ON public.equipment
FOR DELETE
USING (public.current_user_can_manage_equipment() AND created_by = auth.uid());

-- maintenance_records
DROP POLICY IF EXISTS "Users can view maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Admins can insert maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Admins can update maintenance records" ON public.maintenance_records;

CREATE POLICY "Users can view own maintenance records"
ON public.maintenance_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_records.equipment_id
      AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert own maintenance records"
ON public.maintenance_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_records.equipment_id
      AND e.created_by = auth.uid()
  )
  AND public.current_user_can_manage_equipment()
);

CREATE POLICY "Users can update own maintenance records"
ON public.maintenance_records
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_records.equipment_id
      AND e.created_by = auth.uid()
  )
  AND public.current_user_can_manage_equipment()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_records.equipment_id
      AND e.created_by = auth.uid()
  )
  AND public.current_user_can_manage_equipment()
);

-- maintenance_history
DROP POLICY IF EXISTS "Users can view maintenance history" ON public.maintenance_history;
DROP POLICY IF EXISTS "Admins can insert history" ON public.maintenance_history;

CREATE POLICY "Users can view own maintenance history"
ON public.maintenance_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_history.equipment_id
      AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert own maintenance history"
ON public.maintenance_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = maintenance_history.equipment_id
      AND e.created_by = auth.uid()
  )
  AND public.current_user_can_manage_equipment()
);

-- alerts
DROP POLICY IF EXISTS "Users can view alerts" ON public.alerts;

CREATE POLICY "Users can view own alerts"
ON public.alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = alerts.equipment_id
      AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update own alerts"
ON public.alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment e
    WHERE e.id = alerts.equipment_id
      AND e.created_by = auth.uid()
  )
);

-- users
-- Mantém privacidade do perfil (sem permitir auto-alteração de plano/role)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());
