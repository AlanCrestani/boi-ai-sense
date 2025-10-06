-- Migration: Atualizar ENUM de tipo em dim_dietas
-- Data: 2025-09-30
-- Objetivo: Substituir valores antigos (confinamento, pasto, proteinado)
--           pelos novos (adaptacao, crescimento, terminacao, recria, pre-mistura, proteinado)

-- 1. Remover a constraint CHECK antiga
ALTER TABLE public.dim_dietas
DROP CONSTRAINT IF EXISTS dim_dietas_tipo_check;

-- 2. Atualizar dados existentes para os novos valores
-- Mapeamento baseado nos nomes das dietas:
-- - "ADAP*" → adaptacao
-- - "CRES*" → crescimento
-- - "TERMINAÇÃO*" ou "TERMIN*" → terminacao
-- - "RECRIA*" → recria
-- - "PRE-MISTURA*" → pre-mistura
-- - "PROTEINADO*" → proteinado
-- - Default "confinamento" → crescimento (mais comum)
-- - "pasto" → proteinado (mais comum em pasto)

UPDATE public.dim_dietas
SET tipo = CASE
    -- Adaptação
    WHEN UPPER(nome) LIKE 'ADAP%' THEN 'adaptacao'
    WHEN UPPER(nome) LIKE '%ADAPTAC%' THEN 'adaptacao'

    -- Crescimento
    WHEN UPPER(nome) LIKE 'CREC%' THEN 'crescimento'
    WHEN UPPER(nome) LIKE '%CRESCIMENTO%' THEN 'crescimento'

    -- Terminação
    WHEN UPPER(nome) LIKE 'TERMIN%' THEN 'terminacao'
    WHEN UPPER(nome) LIKE '%TERMINAC%' THEN 'terminacao'

    -- Recria
    WHEN UPPER(nome) LIKE 'RECRIA%' THEN 'recria'
    WHEN UPPER(nome) LIKE '%RECRIA%' THEN 'recria'

    -- Pré-mistura
    WHEN UPPER(nome) LIKE 'PRE-MISTURA%' THEN 'pre-mistura'
    WHEN UPPER(nome) LIKE '%PRE%MISTURA%' THEN 'pre-mistura'

    -- Proteinado
    WHEN UPPER(nome) LIKE 'PROTEINADO%' THEN 'proteinado'
    WHEN UPPER(nome) LIKE '%PROTEINADO%' THEN 'proteinado'

    -- Default por tipo antigo
    WHEN tipo = 'pasto' THEN 'proteinado'
    WHEN tipo = 'proteinado' THEN 'proteinado'
    WHEN tipo = 'confinamento' THEN 'crescimento'

    -- Fallback
    ELSE 'crescimento'
END
WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

-- 3. Criar nova constraint CHECK com os valores corretos
ALTER TABLE public.dim_dietas
ADD CONSTRAINT dim_dietas_tipo_check
CHECK (tipo::text = ANY (ARRAY[
    'adaptacao'::character varying,
    'crescimento'::character varying,
    'terminacao'::character varying,
    'recria'::character varying,
    'pre-mistura'::character varying,
    'proteinado'::character varying
]::text[]));

-- 4. Adicionar comentário na coluna
COMMENT ON COLUMN public.dim_dietas.tipo IS 'Tipo da dieta: adaptacao, crescimento, terminacao, recria, pre-mistura, proteinado';
