-- Remove coluna codigo_sequencial obsoleta de dim_lotes_pasto
-- A geração de nomes de lotes agora é feita via trigger usando formato AAMMDD - [SETOR_ABRV][PASTO_ABRV] - [SEQ]

ALTER TABLE dim_lotes_pasto
DROP COLUMN IF EXISTS codigo_sequencial;