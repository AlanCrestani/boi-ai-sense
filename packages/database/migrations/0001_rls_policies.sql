-- Row Level Security (RLS) Policies for ETL Tables
-- Implements multi-tenant isolation by organization_id

-- Enable RLS on all ETL tables
ALTER TABLE etl_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_run_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_staging_02_desvio_carregamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_staging_04_trato_curral ENABLE ROW LEVEL SECURITY;

-- Enable RLS on dimension tables
ALTER TABLE dim_curral ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_dieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_equipamento ENABLE ROW LEVEL SECURITY;

-- Enable RLS on fact tables
ALTER TABLE fato_desvio_carregamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_trato_curral ENABLE ROW LEVEL SECURITY;

-- ETL Run policies
CREATE POLICY "Users can manage their organization's ETL runs"
ON etl_run
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- ETL File policies
CREATE POLICY "Users can manage their organization's ETL files"
ON etl_file
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- ETL Run Log policies
CREATE POLICY "Users can view their organization's ETL logs"
ON etl_run_log
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- Staging 02 - Desvio Carregamento policies
CREATE POLICY "Users can manage their organization's staging 02 data"
ON etl_staging_02_desvio_carregamento
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- Staging 04 - Trato Curral policies
CREATE POLICY "Users can manage their organization's staging 04 data"
ON etl_staging_04_trato_curral
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- Dimension table policies
CREATE POLICY "Users can manage their organization's currals"
ON dim_curral
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

CREATE POLICY "Users can manage their organization's dietas"
ON dim_dieta
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

CREATE POLICY "Users can manage their organization's equipamentos"
ON dim_equipamento
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- Fact table policies
CREATE POLICY "Users can view their organization's desvio carregamento facts"
ON fato_desvio_carregamento
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

CREATE POLICY "Users can view their organization's trato curral facts"
ON fato_trato_curral
FOR ALL
USING (organization_id = current_setting('app.current_organization')::uuid);

-- Create function to set organization context
CREATE OR REPLACE FUNCTION set_organization_context(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_organization', org_id::text, true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_organization_context(uuid) TO authenticated;

-- Comment the policies
COMMENT ON POLICY "Users can manage their organization's ETL runs" ON etl_run IS
'Isolates ETL runs by organization_id using current_setting context';

COMMENT ON POLICY "Users can manage their organization's ETL files" ON etl_file IS
'Isolates ETL files by organization_id using current_setting context';

COMMENT ON POLICY "Users can view their organization's ETL logs" ON etl_run_log IS
'Isolates ETL logs by organization_id using current_setting context';