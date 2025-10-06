-- Criar tabela estoque_insumos_pasto para controlar saldo de estoque
-- Principalmente proteinado, com histórico de todas as movimentações

CREATE TABLE estoque_insumos_pasto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  ingrediente VARCHAR(100) NOT NULL,
  tipo_movimentacao VARCHAR(20) NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste')),
  quantidade_kg DECIMAL(10,2) NOT NULL,
  data_movimentacao DATE NOT NULL,
  hora_movimentacao TIME,

  -- Referência para origem da movimentação
  origem_tipo VARCHAR(30) CHECK (origem_tipo IN ('fabricacao', 'distribuicao', 'ajuste_manual')),
  origem_id_carregamento INTEGER, -- Quando vier de fato_carregamento
  origem_id_distribuicao UUID, -- Quando vier de fato_distribuicao_pasto

  saldo_anterior_kg DECIMAL(10,2),
  saldo_atual_kg DECIMAL(10,2) NOT NULL,

  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  CONSTRAINT chk_quantidade_positiva CHECK (quantidade_kg > 0),
  CONSTRAINT chk_saldo_nao_negativo CHECK (saldo_atual_kg >= 0)
);

-- Índices
CREATE INDEX idx_estoque_org_ingrediente ON estoque_insumos_pasto(organization_id, ingrediente);
CREATE INDEX idx_estoque_data ON estoque_insumos_pasto(data_movimentacao DESC);
CREATE INDEX idx_estoque_origem_carregamento ON estoque_insumos_pasto(origem_id_carregamento);
CREATE INDEX idx_estoque_origem_distribuicao ON estoque_insumos_pasto(origem_id_distribuicao);
CREATE INDEX idx_estoque_tipo_movimentacao ON estoque_insumos_pasto(tipo_movimentacao);

-- Comentários
COMMENT ON TABLE estoque_insumos_pasto IS 'Controle de estoque de insumos para pasto com histórico de movimentações';
COMMENT ON COLUMN estoque_insumos_pasto.tipo_movimentacao IS 'Tipo de movimentação: entrada (fabricação), saida (distribuição) ou ajuste manual';
COMMENT ON COLUMN estoque_insumos_pasto.saldo_atual_kg IS 'Saldo calculado após a movimentação';
COMMENT ON COLUMN estoque_insumos_pasto.origem_tipo IS 'Indica de onde veio a movimentação: fabricacao, distribuicao ou ajuste_manual';
COMMENT ON COLUMN estoque_insumos_pasto.origem_id_carregamento IS 'ID do carregamento em fato_carregamento quando origem for fabricacao';
COMMENT ON COLUMN estoque_insumos_pasto.origem_id_distribuicao IS 'ID da distribuição em fato_distribuicao_pasto quando origem for distribuicao';

-- Habilitar RLS
ALTER TABLE estoque_insumos_pasto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view estoque from their organization"
  ON estoque_insumos_pasto FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert estoque in their organization"
  ON estoque_insumos_pasto FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update estoque in their organization"
  ON estoque_insumos_pasto FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- View para consultar saldo atual por ingrediente
CREATE OR REPLACE VIEW view_saldo_estoque_pasto AS
SELECT DISTINCT ON (organization_id, ingrediente)
  organization_id,
  ingrediente,
  saldo_atual_kg,
  data_movimentacao,
  hora_movimentacao,
  created_at
FROM estoque_insumos_pasto
ORDER BY organization_id, ingrediente, created_at DESC;

COMMENT ON VIEW view_saldo_estoque_pasto IS 'View que retorna o saldo atual de cada ingrediente por organização';