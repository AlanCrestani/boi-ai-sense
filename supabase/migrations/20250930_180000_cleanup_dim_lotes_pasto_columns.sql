-- Remove colunas desnecessárias de dim_lotes_pasto
-- Simplifica a estrutura mantendo apenas as informações essenciais

ALTER TABLE dim_lotes_pasto
DROP COLUMN IF EXISTS data_pesagem_individual,
DROP COLUMN IF EXISTS dias_descanso,
DROP COLUMN IF EXISTS nome_lote,
DROP COLUMN IF EXISTS peso_balanca_coletivo,
DROP COLUMN IF EXISTS peso_medio_coletivo,
DROP COLUMN IF EXISTS peso_liquido_total,
DROP COLUMN IF EXISTS origem_lote,
DROP COLUMN IF EXISTS fornecedor,
DROP COLUMN IF EXISTS nota_fiscal,
DROP COLUMN IF EXISTS valor_compra_total,
DROP COLUMN IF EXISTS valor_por_arroba;