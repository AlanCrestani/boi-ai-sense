-- Corrigir a view para usar o nome correto da tabela (com underscore)
CREATE OR REPLACE VIEW public.view_ingrediente_resumo AS
SELECT
    organization_id,
    ingrediente,
    SUM(realizado_kg) as realizado_kg,
    SUM(previsto_kg) as previsto_kg,
    SUM(desvio_kg) as desvio_kg,
    AVG(desvio_pc) as desvio_pc,
    data
FROM public.staging_02_desvio_carregamento  -- Nome correto com underscore
WHERE ingrediente IS NOT NULL
    AND realizado_kg IS NOT NULL
    AND previsto_kg IS NOT NULL
GROUP BY organization_id, ingrediente, data;

-- Garantir permissões
GRANT SELECT ON public.view_ingrediente_resumo TO authenticated;