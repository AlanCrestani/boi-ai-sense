-- =====================================================
-- Migration: Create Analytics Views
-- Date: 2025-09-18
-- Description: Creates views for Analytics dashboard based on staging tables
-- =====================================================

-- =====================================================
-- View: view_ingrediente_resumo
-- Purpose: Aggregated ingredient data for analytics
-- =====================================================
CREATE OR REPLACE VIEW public.view_ingrediente_resumo AS
SELECT
    organization_id,
    ingrediente,
    SUM(realizado_kg) as realizado_kg,
    SUM(previsto_kg) as previsto_kg,
    SUM(desvio_kg) as desvio_kg,
    AVG(desvio_pc) as desvio_pc,
    data
FROM public.staging_02_desvio_carregamento
WHERE ingrediente IS NOT NULL
    AND realizado_kg IS NOT NULL
    AND previsto_kg IS NOT NULL
GROUP BY organization_id, ingrediente, data;

-- =====================================================
-- View: view_ingrediente_participacao
-- Purpose: Ingredient participation percentage
-- =====================================================
CREATE OR REPLACE VIEW public.view_ingrediente_participacao AS
WITH total_por_org AS (
    SELECT
        organization_id,
        data,
        SUM(realizado_kg) as total_realizado
    FROM public.staging_02_desvio_carregamento
    WHERE realizado_kg IS NOT NULL
    GROUP BY organization_id, data
),
ingrediente_totals AS (
    SELECT
        s.organization_id,
        s.ingrediente,
        s.data,
        SUM(s.realizado_kg) as realizado_kg_ingrediente
    FROM public.staging_02_desvio_carregamento s
    WHERE s.realizado_kg IS NOT NULL
        AND s.ingrediente IS NOT NULL
    GROUP BY s.organization_id, s.ingrediente, s.data
)
SELECT
    i.organization_id,
    i.ingrediente,
    i.data,
    i.realizado_kg_ingrediente,
    t.total_realizado,
    ROUND(
        (i.realizado_kg_ingrediente / NULLIF(t.total_realizado, 0)) * 100,
        2
    ) as participacao_pc
FROM ingrediente_totals i
JOIN total_por_org t ON i.organization_id = t.organization_id AND i.data = t.data
WHERE t.total_realizado > 0;

-- =====================================================
-- View: view_carregamento_eficiencia
-- Purpose: Loading efficiency by carregamento
-- =====================================================
CREATE OR REPLACE VIEW public.view_carregamento_eficiencia AS
SELECT
    organization_id,
    nro_carregamento as carregamento,
    id_carregamento,
    vagao,
    dieta,
    data,
    hora,
    AVG(
        CASE
            WHEN previsto_kg > 0 THEN (realizado_kg / previsto_kg) * 100
            ELSE 0
        END
    ) as eficiencia,
    SUM(realizado_kg) as total_realizado,
    SUM(previsto_kg) as total_previsto,
    AVG(ABS(desvio_pc)) as desvio_medio_pc
FROM public.staging_02_desvio_carregamento
WHERE nro_carregamento IS NOT NULL
    AND realizado_kg IS NOT NULL
    AND previsto_kg IS NOT NULL
    AND previsto_kg > 0
GROUP BY organization_id, nro_carregamento, id_carregamento, vagao, dieta, data, hora;

-- =====================================================
-- View: view_eficiencia_distribuicao
-- Purpose: Efficiency distribution for charts
-- =====================================================
CREATE OR REPLACE VIEW public.view_eficiencia_distribuicao AS
WITH eficiencia_ranges AS (
    SELECT
        organization_id,
        data,
        CASE
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 95 THEN 'Excelente (95%+)'
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 85 THEN 'Bom (85-94%)'
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 70 THEN 'Regular (70-84%)'
            ELSE 'Ruim (<70%)'
        END as faixa_eficiencia
    FROM public.staging_02_desvio_carregamento
    WHERE realizado_kg IS NOT NULL
        AND previsto_kg IS NOT NULL
        AND previsto_kg > 0
)
SELECT
    organization_id,
    faixa_eficiencia as faixa,
    COUNT(*) as quantidade,
    data
FROM eficiencia_ranges
GROUP BY organization_id, faixa_eficiencia, data;

-- =====================================================
-- View: view_volume_por_dieta
-- Purpose: Volume by diet for charts
-- =====================================================
CREATE OR REPLACE VIEW public.view_volume_por_dieta AS
SELECT
    organization_id,
    dieta,
    data,
    SUM(realizado_kg) as volume,
    SUM(previsto_kg) as previsto_total,
    SUM(realizado_kg) as realizado_total,
    COUNT(DISTINCT nro_carregamento) as total_carregamentos
FROM public.staging_02_desvio_carregamento
WHERE dieta IS NOT NULL
    AND realizado_kg IS NOT NULL
GROUP BY organization_id, dieta, data;

-- =====================================================
-- View: view_volume_por_vagao
-- Purpose: Volume by wagon for charts
-- =====================================================
CREATE OR REPLACE VIEW public.view_volume_por_vagao AS
SELECT
    organization_id,
    vagao,
    data,
    SUM(realizado_kg) as total_realizado,
    COUNT(DISTINCT nro_carregamento) as total_carregamentos,
    AVG(ABS(desvio_pc)) as desvio_medio
FROM public.staging_02_desvio_carregamento
WHERE vagao IS NOT NULL
    AND realizado_kg IS NOT NULL
GROUP BY organization_id, vagao, data;

-- =====================================================
-- View: view_eficiencia_temporal
-- Purpose: Efficiency over time (hourly)
-- =====================================================
CREATE OR REPLACE VIEW public.view_eficiencia_temporal AS
SELECT
    organization_id,
    data,
    hora,
    AVG(
        CASE
            WHEN previsto_kg > 0 THEN (realizado_kg / previsto_kg) * 100
            ELSE 0
        END
    ) as eficiencia,
    AVG(ABS(desvio_pc)) as desvio_medio_pc,
    SUM(realizado_kg) as volume_total
FROM public.staging_02_desvio_carregamento
WHERE hora IS NOT NULL
    AND realizado_kg IS NOT NULL
    AND previsto_kg IS NOT NULL
    AND previsto_kg > 0
GROUP BY organization_id, data, hora
ORDER BY data, hora;

-- =====================================================
-- Permissions: Grant access to views
-- =====================================================
GRANT SELECT ON public.view_ingrediente_resumo TO authenticated;
GRANT SELECT ON public.view_ingrediente_participacao TO authenticated;
GRANT SELECT ON public.view_carregamento_eficiencia TO authenticated;
GRANT SELECT ON public.view_eficiencia_distribuicao TO authenticated;
GRANT SELECT ON public.view_volume_por_dieta TO authenticated;
GRANT SELECT ON public.view_volume_por_vagao TO authenticated;
GRANT SELECT ON public.view_eficiencia_temporal TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON VIEW public.view_ingrediente_resumo IS 'Aggregated ingredient consumption and efficiency data';
COMMENT ON VIEW public.view_ingrediente_participacao IS 'Ingredient participation percentage in total consumption';
COMMENT ON VIEW public.view_carregamento_eficiencia IS 'Loading efficiency metrics by carregamento';
COMMENT ON VIEW public.view_eficiencia_distribuicao IS 'Distribution of efficiency across different ranges';
COMMENT ON VIEW public.view_volume_por_dieta IS 'Volume metrics aggregated by diet type';
COMMENT ON VIEW public.view_volume_por_vagao IS 'Volume metrics aggregated by wagon';
COMMENT ON VIEW public.view_eficiencia_temporal IS 'Efficiency trends over time (hourly granularity)';