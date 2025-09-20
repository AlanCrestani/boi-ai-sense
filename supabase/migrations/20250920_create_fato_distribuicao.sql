-- Migration: Create fato_distribuicao table
-- Description: Tabela fato para distribuição enriquecida com dados de staging_03 e staging_05

CREATE TABLE IF NOT EXISTS fato_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  file_id UUID NOT NULL,
  data TEXT,
  hora TEXT,
  vagao TEXT,
  curral TEXT,
  trato TEXT,
  tratador TEXT,
  dieta TEXT,
  realizado_kg NUMERIC,
  previsto_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  merge TEXT,
  id_carregamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_data
  ON fato_distribuicao (organization_id, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_merge
  ON fato_distribuicao (merge);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_curral_data
  ON fato_distribuicao (organization_id, curral, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_id_carregamento
  ON fato_distribuicao (id_carregamento) WHERE id_carregamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_status
  ON fato_distribuicao (organization_id, status);

-- Row Level Security
ALTER TABLE fato_distribuicao ENABLE ROW LEVEL SECURITY;

-- Policy para isolamento por organização
DROP POLICY IF EXISTS "fato_distribuicao_isolation" ON fato_distribuicao;
CREATE POLICY "fato_distribuicao_isolation" ON fato_distribuicao
  USING (organization_id = (SELECT auth.uid()::text::uuid));

-- Policy para permitir INSERT/UPDATE/DELETE para usuários autenticados
DROP POLICY IF EXISTS "fato_distribuicao_crud" ON fato_distribuicao;
CREATE POLICY "fato_distribuicao_crud" ON fato_distribuicao
  FOR ALL
  TO authenticated
  USING (organization_id = (SELECT auth.uid()::text::uuid))
  WITH CHECK (organization_id = (SELECT auth.uid()::text::uuid));

-- Comentários da tabela
COMMENT ON TABLE fato_distribuicao IS 'Tabela fato para distribuição enriquecida com join entre staging_03 e staging_05';
COMMENT ON COLUMN fato_distribuicao.enrichment_status IS 'Status do enriquecimento: SUCCESS (dados completos), PARTIAL (dados parciais), NO_MATCH (sem correspondência)';
COMMENT ON COLUMN fato_distribuicao.merge IS 'Chave de merge no formato: data-hora-vagao-trato';
COMMENT ON COLUMN fato_distribuicao.id_carregamento IS 'ID do carregamento obtido da staging_05_trato_por_curral';
COMMENT ON COLUMN fato_distribuicao.staging_03_id IS 'Referência ao registro da staging_03_desvio_distribuicao';
COMMENT ON COLUMN fato_distribuicao.staging_05_id IS 'Referência ao registro da staging_05_trato_por_curral';