-- Criar tabela dim_dietas para armazenar informações sobre dietas
-- Incluindo CMS (Consumo de Matéria Seca) percentual em relação ao peso vivo

CREATE TABLE dim_dietas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('confinamento', 'pasto', 'proteinado')),
  cms_percentual_peso_vivo DECIMAL(5,2) NOT NULL, -- Ex: 0.30 para 0,3%
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  UNIQUE(organization_id, nome)
);

-- Índices
CREATE INDEX idx_dim_dietas_org ON dim_dietas(organization_id);
CREATE INDEX idx_dim_dietas_tipo ON dim_dietas(tipo);
CREATE INDEX idx_dim_dietas_ativo ON dim_dietas(ativo);

-- Comentários
COMMENT ON TABLE dim_dietas IS 'Tabela de dimensão para dietas com informações de CMS';
COMMENT ON COLUMN dim_dietas.cms_percentual_peso_vivo IS 'Percentual de CMS em relação ao peso vivo (ex: 0.30 = 0,3%)';
COMMENT ON COLUMN dim_dietas.tipo IS 'Tipo da dieta: confinamento, pasto ou proteinado';
COMMENT ON COLUMN dim_dietas.ativo IS 'Indica se a dieta está ativa no sistema';

-- Habilitar RLS
ALTER TABLE dim_dietas ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can view dietas from their organization"
  ON dim_dietas FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert dietas in their organization"
  ON dim_dietas FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update dietas in their organization"
  ON dim_dietas FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete dietas in their organization"
  ON dim_dietas FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));