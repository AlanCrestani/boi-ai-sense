-- Criar tabelas para rotas de distribuição customizáveis
-- Permite que o usuário defina a sequência de atendimento dos lotes

CREATE TABLE dim_rotas_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  UNIQUE(organization_id, nome)
);

-- Tabela de itens da rota com sequência
CREATE TABLE dim_rotas_distribuicao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rota_id UUID NOT NULL REFERENCES dim_rotas_distribuicao(id) ON DELETE CASCADE,
  lote_id UUID NOT NULL REFERENCES dim_lotes_pasto(id),
  sequencia INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(rota_id, lote_id),
  UNIQUE(rota_id, sequencia),
  CONSTRAINT chk_sequencia_positiva CHECK (sequencia > 0)
);

-- Índices
CREATE INDEX idx_rotas_org ON dim_rotas_distribuicao(organization_id);
CREATE INDEX idx_rotas_ativo ON dim_rotas_distribuicao(ativo);
CREATE INDEX idx_rotas_itens_rota ON dim_rotas_distribuicao_itens(rota_id, sequencia);
CREATE INDEX idx_rotas_itens_lote ON dim_rotas_distribuicao_itens(lote_id);

-- Comentários
COMMENT ON TABLE dim_rotas_distribuicao IS 'Rotas de distribuição personalizáveis por organização';
COMMENT ON COLUMN dim_rotas_distribuicao.nome IS 'Nome da rota (ex: Rota Manhã, Rota Setor A)';
COMMENT ON COLUMN dim_rotas_distribuicao.ativo IS 'Indica se a rota está ativa';
COMMENT ON TABLE dim_rotas_distribuicao_itens IS 'Itens da rota com sequência de lotes a serem atendidos';
COMMENT ON COLUMN dim_rotas_distribuicao_itens.sequencia IS 'Ordem de atendimento do lote na rota (1, 2, 3...)';

-- Habilitar RLS
ALTER TABLE dim_rotas_distribuicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_rotas_distribuicao_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - dim_rotas_distribuicao
CREATE POLICY "Users can view rotas from their organization"
  ON dim_rotas_distribuicao FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert rotas in their organization"
  ON dim_rotas_distribuicao FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update rotas in their organization"
  ON dim_rotas_distribuicao FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete rotas in their organization"
  ON dim_rotas_distribuicao FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas RLS - dim_rotas_distribuicao_itens
CREATE POLICY "Users can view rotas itens from their organization"
  ON dim_rotas_distribuicao_itens FOR SELECT
  USING (
    rota_id IN (
      SELECT id FROM dim_rotas_distribuicao
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert rotas itens in their organization"
  ON dim_rotas_distribuicao_itens FOR INSERT
  WITH CHECK (
    rota_id IN (
      SELECT id FROM dim_rotas_distribuicao
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update rotas itens in their organization"
  ON dim_rotas_distribuicao_itens FOR UPDATE
  USING (
    rota_id IN (
      SELECT id FROM dim_rotas_distribuicao
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete rotas itens in their organization"
  ON dim_rotas_distribuicao_itens FOR DELETE
  USING (
    rota_id IN (
      SELECT id FROM dim_rotas_distribuicao
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- View para consultar rotas com seus lotes ordenados
CREATE OR REPLACE VIEW view_rotas_distribuicao_completa AS
SELECT
  r.id as rota_id,
  r.organization_id,
  r.nome as rota_nome,
  r.descricao as rota_descricao,
  r.ativo as rota_ativa,
  ri.id as item_id,
  ri.sequencia,
  l.id as lote_id,
  l.nome as lote_nome,
  l.ativo as lote_ativo,
  p.nome as pasto_nome,
  s.nome as setor_nome
FROM dim_rotas_distribuicao r
LEFT JOIN dim_rotas_distribuicao_itens ri ON ri.rota_id = r.id
LEFT JOIN dim_lotes_pasto l ON l.id = ri.lote_id
LEFT JOIN dim_pastos p ON p.id = l.pasto_id
LEFT JOIN dim_setores s ON s.id = p.setor_id
ORDER BY r.organization_id, r.nome, ri.sequencia;

COMMENT ON VIEW view_rotas_distribuicao_completa IS 'View completa das rotas com lotes ordenados por sequência';