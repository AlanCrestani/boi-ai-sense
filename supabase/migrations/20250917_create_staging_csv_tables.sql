-- =====================================================
-- Migration: Create staging tables for CSV processing
-- Date: 2025-09-17
-- Description: Creates staging_02_desvio_carregamento and staging_04_itens_trato tables
-- =====================================================

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.staging_02_desvio_carregamento CASCADE;
DROP TABLE IF EXISTS public.staging_04_itens_trato CASCADE;

-- =====================================================
-- Table: staging_02_desvio_carregamento
-- Purpose: Store processed data from 02_desvio_carregamento.csv
-- =====================================================
CREATE TABLE public.staging_02_desvio_carregamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL,
    data TEXT,
    hora TEXT,
    pazeiro TEXT,
    vagao TEXT,
    dieta TEXT,
    nro_carregamento TEXT,
    ingrediente TEXT,
    tipo_ingrediente TEXT,
    realizado_kg NUMERIC(10,2),
    previsto_kg NUMERIC(10,2),
    desvio_kg NUMERIC(10,2),
    desvio_pc NUMERIC(10,2),
    status TEXT CHECK (status IN ('VERDE', 'AMARELO', 'VERMELHO')),
    merge TEXT,
    id_carregamento UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_staging02_organization_id ON public.staging_02_desvio_carregamento(organization_id);
CREATE INDEX idx_staging02_file_id ON public.staging_02_desvio_carregamento(file_id);
CREATE INDEX idx_staging02_vagao ON public.staging_02_desvio_carregamento(vagao);
CREATE INDEX idx_staging02_data ON public.staging_02_desvio_carregamento(data);
CREATE INDEX idx_staging02_merge_file ON public.staging_02_desvio_carregamento(merge, file_id);

-- Add comments for documentation
COMMENT ON TABLE public.staging_02_desvio_carregamento IS 'Staging table for desvio carregamento data from pipeline 02';
COMMENT ON COLUMN public.staging_02_desvio_carregamento.merge IS 'Concatenation of data + hora + vagao for unique identification';
COMMENT ON COLUMN public.staging_02_desvio_carregamento.status IS 'Status based on deviation percentage: VERDE < 5%, AMARELO 5-10%, VERMELHO > 10%';

-- =====================================================
-- Table: staging_04_itens_trato
-- Purpose: Store processed data from 04_itens_trato.csv
-- =====================================================
CREATE TABLE public.staging_04_itens_trato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL,
    data TEXT,
    id_carregamento_original TEXT,
    hora TEXT,
    dieta TEXT,
    carregamento TEXT,
    ingrediente TEXT,
    realizado_kg NUMERIC(10,2),
    pazeiro TEXT,
    vagao TEXT,
    ms_dieta_pc NUMERIC(10,2),
    ndt_dieta_pc NUMERIC(10,2),
    merge TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_staging04_organization_id ON public.staging_04_itens_trato(organization_id);
CREATE INDEX idx_staging04_file_id ON public.staging_04_itens_trato(file_id);
CREATE INDEX idx_staging04_vagao ON public.staging_04_itens_trato(vagao);
CREATE INDEX idx_staging04_data ON public.staging_04_itens_trato(data);
CREATE INDEX idx_staging04_merge_file ON public.staging_04_itens_trato(merge, file_id);

-- Add comments for documentation
COMMENT ON TABLE public.staging_04_itens_trato IS 'Staging table for itens de trato data from pipeline 04';
COMMENT ON COLUMN public.staging_04_itens_trato.merge IS 'Concatenation of data + hora + vagao for unique identification';
COMMENT ON COLUMN public.staging_04_itens_trato.ms_dieta_pc IS 'Percentual de matéria seca na dieta real';
COMMENT ON COLUMN public.staging_04_itens_trato.ndt_dieta_pc IS 'Percentual de NDT (Nutrientes Digestíveis Totais) na dieta real';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE public.staging_02_desvio_carregamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_04_itens_trato ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their organization
CREATE POLICY "Users can view own organization data - staging02"
ON public.staging_02_desvio_carregamento
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_02_desvio_carregamento.organization_id
    )
);

CREATE POLICY "Users can view own organization data - staging04"
ON public.staging_04_itens_trato
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_04_itens_trato.organization_id
    )
);

-- Policy: Users with admin/manager role can insert data
CREATE POLICY "Admins and managers can insert data - staging02"
ON public.staging_02_desvio_carregamento
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_02_desvio_carregamento.organization_id
        AND role IN ('admin', 'manager', 'owner')
    )
);

CREATE POLICY "Admins and managers can insert data - staging04"
ON public.staging_04_itens_trato
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_04_itens_trato.organization_id
        AND role IN ('admin', 'manager', 'owner')
    )
);

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access - staging02"
ON public.staging_02_desvio_carregamento
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role has full access - staging04"
ON public.staging_04_itens_trato
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staging02_updated_at
    BEFORE UPDATE ON public.staging_02_desvio_carregamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staging04_updated_at
    BEFORE UPDATE ON public.staging_04_itens_trato
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT ALL ON public.staging_02_desvio_carregamento TO authenticated;
GRANT ALL ON public.staging_04_itens_trato TO authenticated;
GRANT ALL ON public.staging_02_desvio_carregamento TO service_role;
GRANT ALL ON public.staging_04_itens_trato TO service_role;