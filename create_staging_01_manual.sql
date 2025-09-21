-- Create staging_01_historico_consumo table
CREATE TABLE IF NOT EXISTS staging_01_historico_consumo (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- CSV data columns
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staging_01_historico_consumo_org_file
ON staging_01_historico_consumo(organization_id, file_id);

CREATE INDEX IF NOT EXISTS idx_staging_01_historico_consumo_data
ON staging_01_historico_consumo(organization_id, data);

-- Enable RLS
ALTER TABLE staging_01_historico_consumo ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "staging_01_historico_consumo_org_access" ON staging_01_historico_consumo;
CREATE POLICY "staging_01_historico_consumo_org_access"
ON staging_01_historico_consumo
FOR ALL
TO authenticated
USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

-- Grant permissions
GRANT ALL ON staging_01_historico_consumo TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE staging_01_historico_consumo_id_seq TO authenticated;

-- Grant permissions to anon for edge functions
GRANT ALL ON staging_01_historico_consumo TO anon;
GRANT USAGE, SELECT ON SEQUENCE staging_01_historico_consumo_id_seq TO anon;