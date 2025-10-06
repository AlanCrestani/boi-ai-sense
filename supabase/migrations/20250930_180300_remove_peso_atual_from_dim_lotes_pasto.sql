-- Remove coluna peso_atual de dim_lotes_pasto
-- O peso médio de entrada será armazenado em peso_medio_entrada

ALTER TABLE dim_lotes_pasto
DROP COLUMN IF EXISTS peso_atual;

-- Atualiza comentário da coluna peso_medio_entrada
COMMENT ON COLUMN dim_lotes_pasto.peso_medio_entrada IS 'Peso médio dos animais na entrada do lote (em kg). Recebe dados do campo Peso Médio do frontend.';