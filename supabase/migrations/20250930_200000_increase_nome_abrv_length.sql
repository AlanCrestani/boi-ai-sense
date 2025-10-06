-- Aumentar tamanho do campo nome_abrv para 3 caracteres em dim_pastos e dim_setores
-- Para permitir abreviações como "18A", "18B" ao invés de apenas "18"

-- Atualizar dim_pastos
ALTER TABLE dim_pastos
ALTER COLUMN nome_abrv TYPE VARCHAR(3);

COMMENT ON COLUMN dim_pastos.nome_abrv IS 'Abreviação de até 3 caracteres do pasto para composição do código do lote (ex: 18A, 18B)';

-- Atualizar dim_setores
ALTER TABLE dim_setores
ALTER COLUMN nome_abrv TYPE VARCHAR(3);

COMMENT ON COLUMN dim_setores.nome_abrv IS 'Abreviação de até 3 caracteres do nome do setor para composição do código do lote';