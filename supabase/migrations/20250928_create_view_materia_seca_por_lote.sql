-- View para consumo de matéria seca por lote com tracking de currais
CREATE OR REPLACE VIEW view_materia_seca_por_lote AS
WITH dados_recentes AS (
  -- Buscar dados dos últimos 14 dias a partir da data mais recente
  SELECT
    organization_id,
    data,
    curral,
    lote,
    cms_previsto_kg,
    cms_realizado_kg,
    escore
  FROM fato_historico_consumo
  WHERE
    data >= (
      SELECT MAX(data) - INTERVAL '13 days'
      FROM fato_historico_consumo
      WHERE organization_id = fato_historico_consumo.organization_id
    )
    AND cms_previsto_kg IS NOT NULL
    AND cms_realizado_kg IS NOT NULL
    AND curral IS NOT NULL
    AND lote IS NOT NULL
),
lotes_ativos AS (
  -- Identificar lotes que têm dados na data mais recente (hoje)
  SELECT DISTINCT
    organization_id,
    lote
  FROM dados_recentes
  WHERE data = (
    SELECT MAX(data)
    FROM dados_recentes
    WHERE organization_id = dados_recentes.organization_id
  )
)
SELECT
  dr.organization_id,
  dr.lote,
  dr.data,
  EXTRACT(DOW FROM dr.data) as dia_semana, -- 0=domingo, 1=segunda...
  CASE EXTRACT(DOW FROM dr.data)
    WHEN 0 THEN 'Dom'
    WHEN 1 THEN 'Seg'
    WHEN 2 THEN 'Ter'
    WHEN 3 THEN 'Qua'
    WHEN 4 THEN 'Qui'
    WHEN 5 THEN 'Sex'
    WHEN 6 THEN 'Sáb'
  END as dia_nome,
  dr.curral,
  dr.cms_previsto_kg as previsto,
  dr.cms_realizado_kg as realizado,
  (dr.cms_realizado_kg - dr.cms_previsto_kg) as variacao,
  CASE
    WHEN dr.cms_previsto_kg > 0
    THEN ROUND(((dr.cms_realizado_kg - dr.cms_previsto_kg) / dr.cms_previsto_kg) * 100, 2)
    ELSE 0
  END as variacao_percentual,
  CASE
    WHEN dr.cms_previsto_kg > 0
    THEN ROUND((dr.cms_realizado_kg / dr.cms_previsto_kg) * 100, 2)
    ELSE 0
  END as eficiencia_percentual,
  dr.escore
FROM dados_recentes dr
INNER JOIN lotes_ativos la ON dr.organization_id = la.organization_id AND dr.lote = la.lote
ORDER BY dr.lote, dr.data;

-- Conceder permissões para a view
GRANT SELECT ON view_materia_seca_por_lote TO anon, authenticated;