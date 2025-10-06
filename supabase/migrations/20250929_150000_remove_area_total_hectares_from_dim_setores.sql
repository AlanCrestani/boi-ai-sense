-- Remove area_total_hectares column from dim_setores table
-- This field is specific for Curral, Modulo or Pasto, not for organizational sectors

-- Check if the column exists before trying to drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'dim_setores'
    AND column_name = 'area_total_hectares'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.dim_setores DROP COLUMN area_total_hectares;
  END IF;
END
$$;

-- Add comment to clarify the purpose of the table
COMMENT ON TABLE public.dim_setores IS 'Dimensão de setores organizacionais (não inclui área - específica para currais/módulos/pastos)';