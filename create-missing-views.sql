
-- view_eficiencia_distribuicao
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
  COUNT(*)::integer as quantidade,
  data
FROM eficiencia_ranges
GROUP BY organization_id, faixa_eficiencia, data;

-- view_volume_por_dieta
CREATE OR REPLACE VIEW public.view_volume_por_dieta AS
SELECT
  organization_id,
  dieta,
  data,
  SUM(realizado_kg)::numeric as volume,
  SUM(previsto_kg)::numeric as previsto_total,
  SUM(realizado_kg)::numeric as realizado_total,
  COUNT(DISTINCT nro_carregamento)::integer as total_carregamentos
FROM public.staging_02_desvio_carregamento
WHERE dieta IS NOT NULL
  AND realizado_kg IS NOT NULL
GROUP BY organization_id, dieta, data;

-- view_volume_por_vagao
CREATE OR REPLACE VIEW public.view_volume_por_vagao AS
SELECT
  organization_id,
  vagao,
  data,
  SUM(realizado_kg)::numeric as total_realizado,
  COUNT(DISTINCT nro_carregamento)::integer as total_carregamentos,
  AVG(ABS(desvio_pc))::numeric as desvio_medio
FROM public.staging_02_desvio_carregamento
WHERE vagao IS NOT NULL
  AND realizado_kg IS NOT NULL
GROUP BY organization_id, vagao, data;

-- view_eficiencia_temporal
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
  )::numeric as eficiencia,
  AVG(ABS(desvio_pc))::numeric as desvio_medio_pc,
  SUM(realizado_kg)::numeric as volume_total
FROM public.staging_02_desvio_carregamento
WHERE hora IS NOT NULL
  AND realizado_kg IS NOT NULL
  AND previsto_kg IS NOT NULL
  AND previsto_kg > 0
GROUP BY organization_id, data, hora
ORDER BY data, hora;

-- Grant permissions
GRANT SELECT ON public.view_eficiencia_distribuicao TO authenticated;
GRANT SELECT ON public.view_volume_por_dieta TO authenticated;
GRANT SELECT ON public.view_volume_por_vagao TO authenticated;
GRANT SELECT ON public.view_eficiencia_temporal TO authenticated;
  