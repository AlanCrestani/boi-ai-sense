-- Adiciona coluna nome_abrv em dim_pastos
-- Esta coluna armazenará uma referência numérica de 2 caracteres para identificação dos pastos
-- Exemplo: "MÓDULO 01" -> "01", "PASTO NORTE" -> "01"

ALTER TABLE dim_pastos
ADD COLUMN IF NOT EXISTS nome_abrv VARCHAR(2);

-- Comentário explicativo
COMMENT ON COLUMN dim_pastos.nome_abrv IS 'Abreviação numérica de 2 caracteres do pasto para composição do código do lote';

-- Adiciona índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_dim_pastos_nome_abrv ON dim_pastos(nome_abrv);