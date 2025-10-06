-- Adiciona coluna nome_abrv em dim_setores
-- Esta coluna armazenará uma abreviação de 2 caracteres para identificação dos setores
-- Exemplo: "SEDE" -> "SE", "MÓDULO A" -> "MA"

ALTER TABLE dim_setores
ADD COLUMN IF NOT EXISTS nome_abrv VARCHAR(2);

-- Comentário explicativo
COMMENT ON COLUMN dim_setores.nome_abrv IS 'Abreviação de 2 caracteres do nome do setor para composição do código do lote';

-- Adiciona índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_dim_setores_nome_abrv ON dim_setores(nome_abrv);