-- =====================================================
-- Migration: Rename id_carregamento_original to id_carregamento in fato_carregamento
-- Date: 2025-09-20
-- Description: Correct column name from id_carregamento_original to id_carregamento
-- =====================================================

-- Rename the column in fato_carregamento table
ALTER TABLE public.fato_carregamento
RENAME COLUMN id_carregamento_original TO id_carregamento;

-- Update comment for clarity
COMMENT ON COLUMN public.fato_carregamento.id_carregamento IS 'ID do carregamento associado aos dados';