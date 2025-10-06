-- Remove coluna curva_ganho_peso de dim_lotes_pasto

ALTER TABLE dim_lotes_pasto
DROP COLUMN IF EXISTS curva_ganho_peso;