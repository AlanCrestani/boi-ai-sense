-- =====================================================
-- Migration: Rename staging tables for standardization
-- Date: 2025-09-17
-- Description: Rename tables to staging_02_desvio_carregamento and staging_04_itens_trato
-- =====================================================

-- Rename tables to standardized format
ALTER TABLE public.staging02_desvio_carregamento RENAME TO staging_02_desvio_carregamento;
ALTER TABLE public.staging04_itens_trato RENAME TO staging_04_itens_trato;

-- Update indexes names to match new table names
DROP INDEX IF EXISTS idx_staging02_organization_id;
DROP INDEX IF EXISTS idx_staging02_file_id;
DROP INDEX IF EXISTS idx_staging02_vagao;
DROP INDEX IF EXISTS idx_staging02_data;
DROP INDEX IF EXISTS idx_staging02_merge_file;

DROP INDEX IF EXISTS idx_staging04_organization_id;
DROP INDEX IF EXISTS idx_staging04_file_id;
DROP INDEX IF EXISTS idx_staging04_vagao;
DROP INDEX IF EXISTS idx_staging04_data;
DROP INDEX IF EXISTS idx_staging04_merge_file;

-- Recreate indexes with standardized names
CREATE INDEX idx_staging_02_organization_id ON public.staging_02_desvio_carregamento(organization_id);
CREATE INDEX idx_staging_02_file_id ON public.staging_02_desvio_carregamento(file_id);
CREATE INDEX idx_staging_02_vagao ON public.staging_02_desvio_carregamento(vagao);
CREATE INDEX idx_staging_02_data ON public.staging_02_desvio_carregamento(data);
CREATE INDEX idx_staging_02_merge_file ON public.staging_02_desvio_carregamento(merge, file_id);

CREATE INDEX idx_staging_04_organization_id ON public.staging_04_itens_trato(organization_id);
CREATE INDEX idx_staging_04_file_id ON public.staging_04_itens_trato(file_id);
CREATE INDEX idx_staging_04_vagao ON public.staging_04_itens_trato(vagao);
CREATE INDEX idx_staging_04_data ON public.staging_04_itens_trato(data);
CREATE INDEX idx_staging_04_merge_file ON public.staging_04_itens_trato(merge, file_id);

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own organization data - staging02" ON public.staging_02_desvio_carregamento;
DROP POLICY IF EXISTS "Users can view own organization data - staging04" ON public.staging_04_itens_trato;
DROP POLICY IF EXISTS "Admins and managers can insert data - staging02" ON public.staging_02_desvio_carregamento;
DROP POLICY IF EXISTS "Admins and managers can insert data - staging04" ON public.staging_04_itens_trato;
DROP POLICY IF EXISTS "Service role has full access - staging02" ON public.staging_02_desvio_carregamento;
DROP POLICY IF EXISTS "Service role has full access - staging04" ON public.staging_04_itens_trato;

-- Recreate RLS policies with standardized names
CREATE POLICY "Users can view own organization data - staging_02"
ON public.staging_02_desvio_carregamento
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_02_desvio_carregamento.organization_id
    )
);

CREATE POLICY "Users can view own organization data - staging_04"
ON public.staging_04_itens_trato
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id
        FROM public.user_roles
        WHERE organization_id = staging_04_itens_trato.organization_id
    )
);

CREATE POLICY "Admins and managers can insert data - staging_02"
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

CREATE POLICY "Admins and managers can insert data - staging_04"
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

CREATE POLICY "Service role has full access - staging_02"
ON public.staging_02_desvio_carregamento
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role has full access - staging_04"
ON public.staging_04_itens_trato
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Drop old triggers
DROP TRIGGER IF EXISTS update_staging02_updated_at ON public.staging_02_desvio_carregamento;
DROP TRIGGER IF EXISTS update_staging04_updated_at ON public.staging_04_itens_trato;

-- Recreate triggers with standardized names
CREATE TRIGGER update_staging_02_updated_at
    BEFORE UPDATE ON public.staging_02_desvio_carregamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staging_04_updated_at
    BEFORE UPDATE ON public.staging_04_itens_trato
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions on renamed tables
GRANT ALL ON public.staging_02_desvio_carregamento TO authenticated;
GRANT ALL ON public.staging_04_itens_trato TO authenticated;
GRANT ALL ON public.staging_02_desvio_carregamento TO service_role;
GRANT ALL ON public.staging_04_itens_trato TO service_role;