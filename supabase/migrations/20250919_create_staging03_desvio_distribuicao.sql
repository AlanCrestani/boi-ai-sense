-- =====================================================
-- Migration: Create staging03_desvio_distribuicao table
-- Date: 2025-09-19
-- Description: Creates staging03_desvio_distribuicao table for pipeline 03 (desvio distribuição)
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
    data TEXT,
    hora TEXT,
    tratador TEXT,
    vagao TEXT,
    curral TEXT,
    trato TEXT,
    dieta TEXT,
    realizado_kg NUMERIC(10,2),
    previsto_kg NUMERIC(10,2),
    desvio_kg NUMERIC(10,2),
    desvio_pc NUMERIC(10,2),
    plano_alimentar TEXT,
    lote TEXT,
    status TEXT CHECK (status IN ('VERDE', 'AMARELO', 'VERMELHO')),
    merge TEXT,
    id_distribuicao UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_staging_03_organization_id ON public.staging_03_desvio_distribuicao(organization_id);
CREATE INDEX idx_staging_03_file_id ON public.staging_03_desvio_distribuicao(file_id);
CREATE INDEX idx_staging_03_vagao ON public.staging_03_desvio_distribuicao(vagao);
CREATE INDEX idx_staging_03_data ON public.staging_03_desvio_distribuicao(data);
CREATE INDEX idx_staging_03_merge_file ON public.staging_03_desvio_distribuicao(merge, file_id);

-- Add comments for documentation
COMMENT ON TABLE public.staging_03_desvio_distribuicao IS 'Staging table for desvio distribuição data from pipeline 03';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.merge IS 'Concatenation of data + curral + vagao for unique identification';
COMMENT ON COLUMN public.staging_03_desvio_distribuicao.status IS 'Status based on deviation: VERDE (good), AMARELO (warning), VERMELHO (critical)';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on table
ALTER TABLE public.staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their organization
CREATE POLICY "Users can view own organization data - staging03"
ON public.staging_03_desvio_distribuicao
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_03_desvio_distribuicao.organization_id
    )
);

-- Policy: Users with admin/manager role can insert data
CREATE POLICY "Admins and managers can insert data - staging03"
ON public.staging_03_desvio_distribuicao
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_03_desvio_distribuicao.organization_id
        AND role IN ('admin', 'manager', 'owner')
    )
);

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access - staging03"
ON public.staging_03_desvio_distribuicao
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER update_staging_03_updated_at
    BEFORE UPDATE ON public.staging_03_desvio_distribuicao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT ALL ON public.staging_03_desvio_distribuicao TO authenticated;
GRANT ALL ON public.staging_03_desvio_distribuicao TO service_role;