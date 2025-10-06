-- Migration: Reestruturação da tabela dim_lotes para dim_lotes_pasto
-- Data: 2025-09-29
-- Descrição: Renomeia tabela e adiciona colunas para controle de pesagem e curva de ganho de peso

-- 1. Renomear a tabela existente
ALTER TABLE dim_lotes RENAME TO dim_lotes_pasto;

-- 2. Adicionar novas colunas para controle de status de pesagem
ALTER TABLE dim_lotes_pasto ADD COLUMN status_pesagem VARCHAR(10) DEFAULT 'coletivo';
ALTER TABLE dim_lotes_pasto ADD COLUMN data_pesagem_individual DATE;
ALTER TABLE dim_lotes_pasto ADD COLUMN dias_descanso INTEGER;

-- 3. Adicionar colunas para sistema de códigos e nomenclatura
ALTER TABLE dim_lotes_pasto ADD COLUMN nome_lote VARCHAR(50);
ALTER TABLE dim_lotes_pasto ADD COLUMN sigla_status VARCHAR(3) DEFAULT 'RCP';
ALTER TABLE dim_lotes_pasto ADD COLUMN codigo_sequencial INTEGER;
ALTER TABLE dim_lotes_pasto ADD COLUMN modulo_pasto VARCHAR(20);

-- 4. Adicionar colunas para controle de peso
ALTER TABLE dim_lotes_pasto ADD COLUMN peso_balanca_coletivo NUMERIC(10,2);
ALTER TABLE dim_lotes_pasto ADD COLUMN peso_liquido_total NUMERIC(10,2);
ALTER TABLE dim_lotes_pasto ADD COLUMN peso_medio_coletivo NUMERIC(8,2);
ALTER TABLE dim_lotes_pasto ADD COLUMN peso_medio_individual NUMERIC(8,2);
ALTER TABLE dim_lotes_pasto ADD COLUMN peso_atual NUMERIC(8,2);

-- 5. Adicionar coluna para curva de ganho de peso
ALTER TABLE dim_lotes_pasto ADD COLUMN curva_ganho_peso JSONB DEFAULT '{"pesagens": [], "gmd_atual": null, "tendencia": null}'::jsonb;

-- 6. Adicionar colunas para rastreabilidade
ALTER TABLE dim_lotes_pasto ADD COLUMN origem_lote VARCHAR(100);
ALTER TABLE dim_lotes_pasto ADD COLUMN fornecedor VARCHAR(100);
ALTER TABLE dim_lotes_pasto ADD COLUMN nota_fiscal VARCHAR(50);
ALTER TABLE dim_lotes_pasto ADD COLUMN valor_compra_total NUMERIC(12,2);
ALTER TABLE dim_lotes_pasto ADD COLUMN valor_por_arroba NUMERIC(8,2);

-- 7. Adicionar constraints para status_pesagem
ALTER TABLE dim_lotes_pasto ADD CONSTRAINT chk_status_pesagem
CHECK (status_pesagem IN ('coletivo', 'individual'));

-- 8. Adicionar constraints para sigla_status
ALTER TABLE dim_lotes_pasto ADD CONSTRAINT chk_sigla_status
CHECK (sigla_status IN ('RCP', 'CNF'));

-- 9. Criar índices para melhor performance
CREATE INDEX idx_dim_lotes_pasto_nome_lote ON dim_lotes_pasto(nome_lote);
CREATE INDEX idx_dim_lotes_pasto_status_pesagem ON dim_lotes_pasto(status_pesagem);
CREATE INDEX idx_dim_lotes_pasto_sigla_status ON dim_lotes_pasto(sigla_status);
CREATE INDEX idx_dim_lotes_pasto_data_entrada ON dim_lotes_pasto(data_entrada);

-- 10. Atualizar dados existentes (se houver)
UPDATE dim_lotes_pasto SET
  status_pesagem = 'coletivo',
  sigla_status = 'RCP',
  peso_atual = peso_medio_entrada
WHERE peso_medio_entrada IS NOT NULL;

-- 11. Comentários para documentação
COMMENT ON TABLE dim_lotes_pasto IS 'Dimensão de lotes de animais em pastagem com controle de pesagem coletiva e individual';
COMMENT ON COLUMN dim_lotes_pasto.status_pesagem IS 'Status do tipo de pesagem: coletivo (balança) ou individual (curral)';
COMMENT ON COLUMN dim_lotes_pasto.nome_lote IS 'Nome do lote no formato DDMMAA-PP-NN (ex: 250929-13-01)';
COMMENT ON COLUMN dim_lotes_pasto.sigla_status IS 'RCP=Recepção (coletivo), CNF=Confinamento (individual)';
COMMENT ON COLUMN dim_lotes_pasto.curva_ganho_peso IS 'Dados da curva de ganho de peso em formato JSON';
COMMENT ON COLUMN dim_lotes_pasto.peso_atual IS 'Peso atual do lote (coletivo ou individual conforme status)';