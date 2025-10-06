-- Remove coluna peso_medio_individual de dim_lotes_pasto

ALTER TABLE dim_lotes_pasto
DROP COLUMN IF EXISTS peso_medio_individual;