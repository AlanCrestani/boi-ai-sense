-- Criar tabela fato_distribuicao_pasto para registrar distribuições de proteinado
-- Contém previsão, realizado, e controle completo do processo de distribuição

CREATE TABLE fato_distribuicao_pasto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Identificação
  lote_id UUID NOT NULL REFERENCES dim_lotes_pasto(id),
  dieta_id UUID REFERENCES dim_dietas(id),

  -- Datas e dias de fornecimento
  data_registro DATE NOT NULL,
  hora_registro TIME,
  dias_fornecimento INTEGER[], -- Array com dias da semana: [2,3,4] = Ter,Qua,Qui (1=Dom, 7=Sáb)
  quantidade_dias_selecionados INTEGER NOT NULL,

  -- Pesos e quantidades
  peso_medio_atual_kg DECIMAL(10,2) NOT NULL, -- Peso Atual calculado
  quantidade_animais INTEGER NOT NULL,
  cms_percentual DECIMAL(5,2) NOT NULL, -- CMS da dieta no momento do registro

  -- Consumo
  consumo_previsto_kg DECIMAL(10,2) NOT NULL,
  consumo_realizado_kg DECIMAL(10,2),
  desvio_kg DECIMAL(10,2),
  desvio_percentual DECIMAL(5,2),

  -- Status do cocho (informado pelo tratador)
  cocho_vazio BOOLEAN,
  cocho_com_sobra BOOLEAN,
  observacoes_cocho TEXT,

  -- QR Code e GPS
  qr_code_escaneado VARCHAR(100),
  coordenadas_gps_lat DECIMAL(10,8),
  coordenadas_gps_lng DECIMAL(11,8),
  timestamp_qr_scan TIMESTAMPTZ,

  -- Controle
  rota_id UUID REFERENCES dim_rotas_distribuicao(id),
  status VARCHAR(20) DEFAULT 'previsto' CHECK (status IN ('previsto', 'em_andamento', 'concluido', 'cancelado')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  CONSTRAINT chk_quantidade_dias_positiva CHECK (quantidade_dias_selecionados > 0),
  CONSTRAINT chk_peso_atual_positivo CHECK (peso_medio_atual_kg > 0),
  CONSTRAINT chk_quantidade_animais_positiva CHECK (quantidade_animais > 0),
  CONSTRAINT chk_cms_positivo CHECK (cms_percentual > 0),
  CONSTRAINT chk_consumo_previsto_positivo CHECK (consumo_previsto_kg > 0)
);

-- Índices
CREATE INDEX idx_fato_dist_org_data ON fato_distribuicao_pasto(organization_id, data_registro DESC);
CREATE INDEX idx_fato_dist_lote ON fato_distribuicao_pasto(lote_id);
CREATE INDEX idx_fato_dist_rota ON fato_distribuicao_pasto(rota_id);
CREATE INDEX idx_fato_dist_status ON fato_distribuicao_pasto(status);
CREATE INDEX idx_fato_dist_dieta ON fato_distribuicao_pasto(dieta_id);
CREATE INDEX idx_fato_dist_created_at ON fato_distribuicao_pasto(created_at DESC);

-- Comentários
COMMENT ON TABLE fato_distribuicao_pasto IS 'Fato de distribuição de proteinado nos lotes de pasto';
COMMENT ON COLUMN fato_distribuicao_pasto.peso_medio_atual_kg IS 'Peso Atual = Peso Entrada + ((Data atual - data entrada + 1) * GMD informado)';
COMMENT ON COLUMN fato_distribuicao_pasto.consumo_previsto_kg IS 'Consumo Previsto = peso_medio_atual_kg * cms_percentual * quantidade_animais * quantidade_dias_selecionados';
COMMENT ON COLUMN fato_distribuicao_pasto.dias_fornecimento IS 'Array de dias da semana selecionados (1=Dom até 7=Sáb)';
COMMENT ON COLUMN fato_distribuicao_pasto.status IS 'Status da distribuição: previsto, em_andamento, concluido ou cancelado';
COMMENT ON COLUMN fato_distribuicao_pasto.cocho_vazio IS 'Indica se o cocho estava vazio no momento da distribuição';
COMMENT ON COLUMN fato_distribuicao_pasto.cocho_com_sobra IS 'Indica se havia sobra no cocho';
COMMENT ON COLUMN fato_distribuicao_pasto.qr_code_escaneado IS 'Código QR escaneado no momento da distribuição';
COMMENT ON COLUMN fato_distribuicao_pasto.coordenadas_gps_lat IS 'Latitude GPS capturada ao escanear QR code';
COMMENT ON COLUMN fato_distribuicao_pasto.coordenadas_gps_lng IS 'Longitude GPS capturada ao escanear QR code';
COMMENT ON COLUMN fato_distribuicao_pasto.timestamp_qr_scan IS 'Data e hora do scan do QR code';

-- Habilitar RLS
ALTER TABLE fato_distribuicao_pasto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view distribuicoes from their organization"
  ON fato_distribuicao_pasto FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert distribuicoes in their organization"
  ON fato_distribuicao_pasto FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update distribuicoes in their organization"
  ON fato_distribuicao_pasto FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete distribuicoes in their organization"
  ON fato_distribuicao_pasto FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Trigger para calcular desvio automaticamente
CREATE OR REPLACE FUNCTION fn_calcular_desvio_distribuicao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consumo_realizado_kg IS NOT NULL AND NEW.consumo_previsto_kg IS NOT NULL THEN
    NEW.desvio_kg := NEW.consumo_realizado_kg - NEW.consumo_previsto_kg;

    IF NEW.consumo_previsto_kg > 0 THEN
      NEW.desvio_percentual := ROUND(((NEW.desvio_kg / NEW.consumo_previsto_kg) * 100)::numeric, 2);
    ELSE
      NEW.desvio_percentual := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_desvio_distribuicao
BEFORE INSERT OR UPDATE ON fato_distribuicao_pasto
FOR EACH ROW
EXECUTE FUNCTION fn_calcular_desvio_distribuicao();

-- View resumida para consultas rápidas
CREATE OR REPLACE VIEW view_distribuicao_pasto_resumo AS
SELECT
  d.id,
  d.organization_id,
  d.data_registro,
  d.hora_registro,
  d.status,
  l.nome as lote_nome,
  l.ativo as lote_ativo,
  p.nome as pasto_nome,
  s.nome as setor_nome,
  di.nome as dieta_nome,
  d.quantidade_animais,
  d.peso_medio_atual_kg,
  d.consumo_previsto_kg,
  d.consumo_realizado_kg,
  d.desvio_kg,
  d.desvio_percentual,
  d.quantidade_dias_selecionados,
  r.nome as rota_nome,
  d.created_at
FROM fato_distribuicao_pasto d
LEFT JOIN dim_lotes_pasto l ON l.id = d.lote_id
LEFT JOIN dim_pastos p ON p.id = l.pasto_id
LEFT JOIN dim_setores s ON s.id = p.setor_id
LEFT JOIN dim_dietas di ON di.id = d.dieta_id
LEFT JOIN dim_rotas_distribuicao r ON r.id = d.rota_id
ORDER BY d.organization_id, d.data_registro DESC, d.created_at DESC;

COMMENT ON VIEW view_distribuicao_pasto_resumo IS 'View resumida das distribuições com informações relacionadas';