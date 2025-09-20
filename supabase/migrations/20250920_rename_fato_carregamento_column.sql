-- =====================================================
-- Migration: Rename id_carregamento_original to id_carregamento in fato_carregamento
-- Date: 2025-09-20
-- Description: Standardize column name from id_carregamento_original to id_carregamento
-- =====================================================

-- Rename the column in fato_carregamento table
ALTER TABLE public.fato_carregamento
RENAME COLUMN id_carregamento_original TO id_carregamento;

-- Update any existing indexes that reference the old column name
DROP INDEX IF EXISTS idx_fato_carregamento_id_carregamento_original;

-- Create index for the new column name
CREATE INDEX IF NOT EXISTS idx_fato_carregamento_id_carregamento
ON public.fato_carregamento (id_carregamento);

-- Update comment for clarity
COMMENT ON COLUMN public.fato_carregamento.id_carregamento IS 'ID do carregamento enriquecido via JOIN com staging_04_itens_trato';