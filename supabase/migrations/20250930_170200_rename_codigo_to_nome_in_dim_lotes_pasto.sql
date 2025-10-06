-- Renomeia coluna codigo para nome em dim_lotes_pasto
-- A coluna nome armazenará um identificador padronizado no formato: AAMMDD - [SETOR][PASTO] - [SEQ]
-- Exemplo: "250930 - SE01 - 01"

ALTER TABLE dim_lotes_pasto
RENAME COLUMN codigo TO nome;

-- Atualiza o comentário da coluna
COMMENT ON COLUMN dim_lotes_pasto.nome IS 'Nome padronizado do lote no formato: AAMMDD - [SETOR_ABRV][PASTO_ABRV] - [SEQ]. Exemplo: 250930 - SE01 - 01';