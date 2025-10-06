-- Create view_ingrediente_resumo for Analytics page
CREATE OR REPLACE VIEW view_ingrediente_resumo AS
SELECT
    organization_id,
    data::date as data,
    ingrediente,
    SUM(previsto_kg) as previsto_kg,
    SUM(realizado_kg) as realizado_kg,
    SUM(desvio_kg) as desvio_kg,
    CASE
        WHEN SUM(previsto_kg) > 0 THEN
            ROUND((SUM(desvio_kg) / SUM(previsto_kg)) * 100, 2)
        ELSE 0
    END as desvio_percentual
FROM fato_carregamento
WHERE organization_id IS NOT NULL
  AND data IS NOT NULL
  AND ingrediente IS NOT NULL
GROUP BY organization_id, data::date, ingrediente
ORDER BY organization_id, data::date, ingrediente;

-- Create view_dieta_resumo for Analytics page
CREATE OR REPLACE VIEW view_dieta_resumo AS
SELECT
    organization_id,
    data::date as data,
    dieta,
    SUM(previsto_kg) as previsto_kg,
    SUM(realizado_kg) as realizado_kg,
    SUM(desvio_kg) as desvio_kg,
    CASE
        WHEN SUM(previsto_kg) > 0 THEN
            ROUND((SUM(desvio_kg) / SUM(previsto_kg)) * 100, 2)
        ELSE 0
    END as desvio_percentual
FROM fato_carregamento
WHERE organization_id IS NOT NULL
  AND data IS NOT NULL
  AND dieta IS NOT NULL
GROUP BY organization_id, data::date, dieta
ORDER BY organization_id, data::date, dieta;

-- Grant permissions to authenticated users
GRANT SELECT ON view_ingrediente_resumo TO authenticated;
GRANT SELECT ON view_dieta_resumo TO authenticated;