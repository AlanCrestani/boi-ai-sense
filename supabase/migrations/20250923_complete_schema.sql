-- Complete Schema Migration for Conecta Boi

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- 4. ETL File tracking
CREATE TABLE IF NOT EXISTS public.etl_file (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  filename TEXT NOT NULL,
  filepath TEXT,
  file_size BIGINT,
  mime_type TEXT,
  checksum TEXT,
  current_state TEXT DEFAULT 'uploaded',
  state_history JSONB DEFAULT '[]'::jsonb,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  parsed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  loaded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ,
  lock_expires_at TIMESTAMPTZ
);

-- 5. ETL Run tracking
CREATE TABLE IF NOT EXISTS public.etl_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL REFERENCES public.etl_file(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  run_number INTEGER NOT NULL,
  current_state TEXT DEFAULT 'pending',
  state_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_by UUID REFERENCES auth.users(id),
  processing_started_at TIMESTAMPTZ,
  records_total INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ,
  lock_expires_at TIMESTAMPTZ,
  UNIQUE(file_id, run_number)
);

-- 6. Staging tables
CREATE TABLE IF NOT EXISTS public.staging_01_historico_consumo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_id TEXT REFERENCES public.etl_file(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  data DATE,
  curral TEXT,
  lote TEXT,
  raca TEXT,
  sexo TEXT,
  cod_grupo_genetico TEXT,
  grupo_genetico TEXT,
  setor TEXT,
  proprietario_predominante TEXT,
  origem_predominante TEXT,
  tipo_aquisicao TEXT,
  dieta TEXT,
  escore NUMERIC,
  fator_correcao_kg NUMERIC,
  escore_noturno NUMERIC,
  data_entrada DATE,
  qtd_animais INTEGER,
  peso_entrada_kg NUMERIC,
  peso_estimado_kg NUMERIC,
  dias_confinados INTEGER,
  consumo_total_kg_mn NUMERIC,
  consumo_total_ms NUMERIC,
  ms_dieta_meta_pc NUMERIC,
  ms_dieta_real_pc NUMERIC,
  cms_previsto_kg NUMERIC,
  cms_realizado_kg NUMERIC,
  cmn_previsto_kg NUMERIC,
  cmn_realizado_kg NUMERIC,
  gmd_kg NUMERIC,
  cms_referencia_pcpv NUMERIC,
  cms_referencia_kg NUMERIC,
  cms_realizado_pcpv NUMERIC
);

CREATE TABLE IF NOT EXISTS public.staging_02_desvio_carregamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_id TEXT REFERENCES public.etl_file(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  bahman TEXT,
  carregamento TEXT,
  vagao TEXT,
  data TEXT,
  hora TEXT,
  dieta TEXT,
  ingrediente TEXT,
  previsto NUMERIC,
  realizado NUMERIC,
  desvio_pc NUMERIC,
  equipamento TEXT
);

CREATE TABLE IF NOT EXISTS public.staging_03_desvio_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_id TEXT REFERENCES public.etl_file(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  trato TEXT,
  merge TEXT,
  curral TEXT,
  data TEXT,
  hora TEXT,
  dieta TEXT,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC,
  diferenca_kg NUMERIC,
  desvio_pc NUMERIC
);

CREATE TABLE IF NOT EXISTS public.staging_04_trato_por_curral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_id TEXT REFERENCES public.etl_file(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  data TEXT,
  hora TEXT,
  trato TEXT,
  curral TEXT,
  dieta TEXT,
  lote TEXT,
  sexo TEXT,
  qtd_animais INTEGER,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC
);

CREATE TABLE IF NOT EXISTS public.staging_05_trato_por_vagao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  file_id TEXT REFERENCES public.etl_file(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  data TEXT,
  hora TEXT,
  trato TEXT,
  carregamento TEXT,
  vagao TEXT,
  dieta TEXT,
  qtd_animais INTEGER,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC
);

-- 7. Fact tables
CREATE TABLE IF NOT EXISTS public.fato_carregamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  data DATE,
  hora TIME,
  id_carregamento TEXT,
  vagao TEXT,
  dieta TEXT,
  ingrediente TEXT,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  equipamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fato_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  data DATE,
  hora TIME,
  trato TEXT,
  curral TEXT,
  dieta TEXT,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC,
  diferenca_kg NUMERIC,
  desvio_pc NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fato_historico_consumo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  data DATE,
  curral TEXT,
  lote TEXT,
  raca TEXT,
  sexo TEXT,
  grupo_genetico TEXT,
  setor TEXT,
  dieta TEXT,
  qtd_animais INTEGER,
  peso_estimado_kg NUMERIC,
  dias_confinados INTEGER,
  consumo_total_kg_mn NUMERIC,
  cms_previsto_kg NUMERIC,
  cms_realizado_kg NUMERIC,
  gmd_kg NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Alert configuration
CREATE TABLE IF NOT EXISTS public.etl_alerts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  alert_name TEXT NOT NULL,
  alert_type TEXT,
  metric_type TEXT,
  condition_operator TEXT,
  threshold_value NUMERIC,
  evaluation_window_minutes INTEGER,
  severity TEXT,
  email_enabled BOOLEAN DEFAULT false,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  email_recipients TEXT[],
  is_enabled BOOLEAN DEFAULT true,
  alert_cooldown_minutes INTEGER DEFAULT 60,
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_delay_minutes INTEGER,
  alert_title_template TEXT,
  alert_message_template TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 9. Reprocessing log
CREATE TABLE IF NOT EXISTS public.etl_reprocessing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_id TEXT REFERENCES public.etl_file(id),
  checksum TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  forced_by UUID REFERENCES auth.users(id),
  reason TEXT,
  skip_validation BOOLEAN DEFAULT false,
  new_file_id TEXT REFERENCES public.etl_file(id),
  completed_at TIMESTAMPTZ,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create analytical views
-- Drop existing views first to avoid conflicts
DROP VIEW IF EXISTS public.view_ingrediente_resumo CASCADE;
DROP VIEW IF EXISTS public.view_dieta_resumo CASCADE;
DROP VIEW IF EXISTS public.view_carregamento_eficiencia CASCADE;

CREATE OR REPLACE VIEW public.view_ingrediente_resumo AS
SELECT
  fc.organization_id,
  fc.data,
  fc.ingrediente,
  COUNT(DISTINCT fc.id_carregamento) as total_carregamentos,
  SUM(fc.previsto_kg) as total_previsto_kg,
  SUM(fc.realizado_kg) as total_realizado_kg,
  AVG(fc.desvio_pc) as desvio_medio_percentual,
  MIN(fc.desvio_pc) as desvio_minimo,
  MAX(fc.desvio_pc) as desvio_maximo
FROM public.fato_carregamento fc
GROUP BY fc.organization_id, fc.data, fc.ingrediente;

CREATE OR REPLACE VIEW public.view_dieta_resumo AS
SELECT
  fd.organization_id,
  fd.data,
  fd.dieta,
  COUNT(DISTINCT fd.trato) as total_tratos,
  COUNT(DISTINCT fd.curral) as total_currais,
  SUM(fd.previsto_kg) as total_previsto_kg,
  SUM(fd.realizado_kg) as total_realizado_kg,
  AVG(fd.desvio_pc) as desvio_medio_percentual
FROM public.fato_distribuicao fd
GROUP BY fd.organization_id, fd.data, fd.dieta;

CREATE OR REPLACE VIEW public.view_carregamento_eficiencia AS
SELECT
  fc.organization_id,
  fc.id_carregamento as carregamento,
  fc.id_carregamento,
  fc.vagao,
  fc.dieta,
  fc.data,
  fc.hora,
  CASE
    WHEN SUM(fc.previsto_kg) > 0 THEN
      (1 - (SUM(ABS(fc.desvio_kg)) / SUM(fc.previsto_kg))) * 100
    ELSE 0
  END as eficiencia,
  SUM(fc.realizado_kg) as total_realizado,
  SUM(fc.previsto_kg) as total_previsto,
  AVG(fc.desvio_pc) as desvio_medio_pc
FROM public.fato_carregamento fc
GROUP BY
  fc.organization_id,
  fc.id_carregamento,
  fc.vagao,
  fc.dieta,
  fc.data,
  fc.hora;

-- 11. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 12. Create RPC function for profile access (PostgREST workaround)
CREATE OR REPLACE FUNCTION get_profile_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  "position" TEXT,
  department TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.organization_id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.phone,
    p."position",
    p.department,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_profile_by_user_id TO anon, authenticated;

-- 13. Create trigger for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- If company_name is provided, create an organization
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES (
      NEW.raw_user_meta_data->>'company_name',
      lower(replace(NEW.raw_user_meta_data->>'company_name', ' ', '-'))
    )
    RETURNING id INTO new_org_id;
  ELSE
    -- Use a default organization or get the first one
    SELECT id INTO new_org_id FROM public.organizations LIMIT 1;

    -- If no organization exists, create a default one
    IF new_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug)
      VALUES ('Default Organization', 'default-org')
      RETURNING id INTO new_org_id;
    END IF;
  END IF;

  -- Create profile for the user
  INSERT INTO public.profiles (
    user_id,
    organization_id,
    full_name,
    email
  ) VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );

  -- Create user role
  INSERT INTO public.user_roles (
    user_id,
    organization_id,
    role
  ) VALUES (
    NEW.id,
    new_org_id,
    CASE
      WHEN NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN 'owner'
      ELSE 'member'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();