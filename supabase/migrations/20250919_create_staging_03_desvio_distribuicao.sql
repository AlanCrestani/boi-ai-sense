-- =====================================================
-- Migration: Create staging_03_desvio_distribuicao table
-- Date: 2025-09-19
-- Description: Creates staging_03_desvio_distribuicao table for pipeline 03 (desvio distribuição)
-- =====================================================

-- Drop table if it exists (for clean migration)
DROP TABLE IF EXISTS public.staging_03_desvio_distribuicao CASCADE;

-- =====================================================
-- Table: staging_03_desvio_distribuicao
-- Purpose: Store processed data from 03_desvio_distribuicao.csv
-- CSV Structure: Data;Tratador;Vagão;;Curral;Dieta;;Plano Alimentar (%);Lote;Distribuído (kg);Previsto (kg);Desvio (kg);Desvio (%);Status
-- =====================================================
CREATE TABLE public.staging_03_desvio_distribuicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL,

    -- Dados principais do CSV
    data TEXT NOT NULL,                    -- Data da distribuição (formato DD/MM/YYYY)
    hora TEXT,                            -- Hora (pode ser extraída ou inferida)
    tratador TEXT,                        -- Nome do tratador
    vagao TEXT,                           -- Vagão utilizado (BAHMAN, BAHMAN/SILOKING, etc.)
    curral TEXT,                          -- Código do curral (01, 02, 06, 08, etc.)
    trato TEXT,                           -- Número do trato (pode ser inferido)
    dieta TEXT,                           -- Nome da dieta

    -- Dados quantitativos
    realizado_kg NUMERIC(10,2),           -- Distribuído (kg) - valor realizado
    previsto_kg NUMERIC(10,2),            -- Previsto (kg) - valor planejado
    desvio_kg NUMERIC(10,2),              -- Desvio em kg (realizado - previsto)
    desvio_pc NUMERIC(10,2),              -- Desvio em percentual

    -- Dados auxiliares do CSV
    plano_alimentar TEXT,                 -- Plano Alimentar (%) - pode estar vazio
    lote TEXT,                            -- Lote do animal

    -- Status e controle
    status TEXT CHECK (status IN ('VERDE', 'AMARELO', 'VERMELHO')) DEFAULT 'VERDE',
    merge TEXT,                           -- Chave única: data + curral + vagao

    -- Colunas padrão do sistema
    id_distribuicao UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fk_staging03_organization
        FOREIGN KEY (organization_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_staging03_organization_id ON public.staging_03_desvio_distribuicao(organization_id);
CREATE INDEX idx_staging03_file_id ON public.staging_03_desvio_distribuicao(file_id);
CREATE INDEX idx_staging03_data ON public.staging_03_desvio_distribuicao(data);
CREATE INDEX idx_staging03_curral ON public.staging_03_desvio_distribuicao(curral);
CREATE INDEX idx_staging03_vagao ON public.staging_03_desvio_distribuicao(vagao);
CREATE INDEX idx_staging03_tratador ON public.staging_03_desvio_distribuicao(tratador);
CREATE INDEX idx_staging03_merge_file ON public.staging_03_desvio_distribuicao(merge, file_id);
CREATE INDEX idx_staging03_status ON public.staging_03_desvio_distribuicao(status);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_staging03_unique_merge_file
ON public.staging_03_desvio_distribuicao(merge, file_id)
WHERE merge IS NOT NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staging03_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_staging03_timestamp
    BEFORE UPDATE ON public.staging_03_desvio_distribuicao
    FOR EACH ROW
    EXECUTE FUNCTION update_staging03_timestamp();

-- Add comments for documentation
COMMENT ON TABLE public.staging_03_desvio_distribuicao IS 'Staging table for desvio distribuição data from pipeline 03 - tracks feed distribution deviations by pen and wagon';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.data IS 'Distribution date in DD/MM/YYYY format from CSV';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.tratador IS 'Feed distributor/operator name';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.vagao IS 'Wagon used for distribution (BAHMAN, SILOKING, etc.)';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.curral IS 'Pen/corral code where feed was distributed';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.dieta IS 'Diet/ration name';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.realizado_kg IS 'Actual amount distributed in kg';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.previsto_kg IS 'Planned amount in kg';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.desvio_kg IS 'Deviation in kg (actual - planned)';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.desvio_pc IS 'Deviation percentage';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.lote IS 'Animal batch/lot identifier';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.merge IS 'Unique identifier: data + curral + vagao for duplicate detection';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.status IS 'Status based on deviation: VERDE (good), AMARELO (warning), VERMELHO (critical)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staging_03_desvio_distribuicao TO authenticated;
GRANT SELECT ON public.staging_03_desvio_distribuicao TO anon;

-- RLS (Row Level Security) - users can only see their organization data
ALTER TABLE public.staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access staging03 data for their organization" ON public.staging_03_desvio_distribuicao
    FOR ALL USING (
        organization_id = auth.uid()
        OR
        organization_id IN (
            SELECT id FROM auth.users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create view for easier querying with proper date formatting
CREATE OR REPLACE VIEW public.view_staging03_formatted AS
SELECT
    id,
    organization_id,
    file_id,

    -- Convert DD/MM/YYYY to proper date
    CASE
        WHEN data ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(data, 'DD/MM/YYYY')
        ELSE NULL
    END as data_formatted,

    data as data_original,
    hora,
    tratador,
    vagao,
    curral,
    trato,
    dieta,
    realizado_kg,
    previsto_kg,
    desvio_kg,
    desvio_pc,
    plano_alimentar,
    lote,
    status,
    merge,
    id_distribuicao,
    created_at,
    updated_at
FROM public.staging_03_desvio_distribuicao;

-- Grant permissions on view
GRANT SELECT ON public.view_staging03_formatted TO authenticated;
GRANT SELECT ON public.view_staging03_formatted TO anon;

-- Add RLS on view
ALTER VIEW public.view_staging03_formatted SET (security_barrier = true);

COMMENT ON VIEW public.view_staging03_formatted IS 'Formatted view of staging03 table with proper date conversion';