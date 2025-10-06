-- ==========================================================================
-- VIEW 1: Análise Balancão x Visor
-- Compara peso líquido do balancão com peso do visor do vagão
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_analise_balancao_visor AS
SELECT
    cpv.id,
    cpv.organization_id,
    cpv.data_checagem,
    cpv.hora_checagem,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,

    -- Pesos
    cpv.peso_liquido_balancao,
    cpv.peso_visor_balanca_vagao,

    -- Diferença
    cpv.peso_liquido_balancao - cpv.peso_visor_balanca_vagao AS diferenca_kg,
    cpv.diferenca_balancao_visor AS diferenca_percentual,

    -- Status de tolerância
    cpv.status_tolerancia,
    CASE cpv.status_tolerancia
        WHEN 'verde' THEN '✅ Conforme (0-2%)'
        WHEN 'amarelo' THEN '⚠️ Atenção (2-5%)'
        WHEN 'vermelho' THEN '❌ Crítico (5-10%)'
        WHEN 'vermelho_escuro' THEN '🔴 Muito Crítico (>10%)'
    END AS status_descricao,

    -- Responsável
    p.full_name AS responsavel_nome,

    -- Observações
    cpv.observacoes,
    cpv.created_at
FROM public.checagem_peso_vagao cpv
JOIN public.dim_vagoes v ON v.id = cpv.vagao_id
JOIN public.profiles p ON p.id = cpv.responsavel_id
ORDER BY cpv.data_checagem DESC, cpv.hora_checagem DESC;

-- Comentário da view
COMMENT ON VIEW public.view_analise_balancao_visor IS 'Análise comparativa entre peso líquido do balancão e peso do visor do vagão';

-- ==========================================================================
-- VIEW 2: Análise Visor x Sistema (id_carregamento)
-- Compara peso do visor com peso registrado no sistema
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_analise_visor_sistema AS
SELECT
    cpv.id,
    cpv.organization_id,
    cpv.data_checagem,
    cpv.hora_checagem,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,

    -- Referência do carregamento
    cpv.id_carregamento,

    -- Pesos
    cpv.peso_visor_balanca_vagao,
    cpv.peso_id_carregamento AS peso_sistema,

    -- Diferença
    cpv.peso_visor_balanca_vagao - cpv.peso_id_carregamento AS diferenca_kg,
    cpv.diferenca_visor_carregamento AS diferenca_percentual,

    -- Classificação de tolerância baseada na diferença
    CASE
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 2 THEN 'verde'
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 5 THEN 'amarelo'
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 10 THEN 'vermelho'
        ELSE 'vermelho_escuro'
    END AS status_tolerancia,

    CASE
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 2 THEN '✅ Conforme (0-2%)'
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 5 THEN '⚠️ Atenção (2-5%)'
        WHEN ABS(COALESCE(cpv.diferenca_visor_carregamento, 0)) <= 10 THEN '❌ Crítico (5-10%)'
        ELSE '🔴 Muito Crítico (>10%)'
    END AS status_descricao,

    -- Responsável
    p.full_name AS responsavel_nome,

    -- Observações
    cpv.observacoes,
    cpv.created_at
FROM public.checagem_peso_vagao cpv
JOIN public.dim_vagoes v ON v.id = cpv.vagao_id
JOIN public.profiles p ON p.id = cpv.responsavel_id
WHERE cpv.id_carregamento IS NOT NULL
ORDER BY cpv.data_checagem DESC, cpv.hora_checagem DESC;

-- Comentário da view
COMMENT ON VIEW public.view_analise_visor_sistema IS 'Análise comparativa entre peso do visor e peso registrado no sistema (id_carregamento)';

-- ==========================================================================
-- VIEW 3: Análise Carregamento x Distribuição
-- Compara peso carregado com soma dos pesos distribuídos
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_analise_carregamento_distribuicao AS
SELECT
    cpv.id,
    cpv.organization_id,
    cpv.data_checagem,
    cpv.hora_checagem,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,

    -- Referência do carregamento
    cpv.id_carregamento,

    -- Pesos
    cpv.peso_id_carregamento AS peso_carregado,
    cpv.peso_total_distribuido,

    -- Diferença
    cpv.peso_id_carregamento - cpv.peso_total_distribuido AS diferenca_kg,
    cpv.diferenca_carregamento_distribuicao AS diferenca_percentual,

    -- Classificação de tolerância
    CASE
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 2 THEN 'verde'
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 5 THEN 'amarelo'
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 10 THEN 'vermelho'
        ELSE 'vermelho_escuro'
    END AS status_tolerancia,

    CASE
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 2 THEN '✅ Conforme (0-2%)'
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 5 THEN '⚠️ Atenção (2-5%)'
        WHEN ABS(COALESCE(cpv.diferenca_carregamento_distribuicao, 0)) <= 10 THEN '❌ Crítico (5-10%)'
        ELSE '🔴 Muito Crítico (>10%)'
    END AS status_descricao,

    -- Responsável
    p.full_name AS responsavel_nome,

    -- Observações
    cpv.observacoes,
    cpv.created_at
FROM public.checagem_peso_vagao cpv
JOIN public.dim_vagoes v ON v.id = cpv.vagao_id
JOIN public.profiles p ON p.id = cpv.responsavel_id
WHERE cpv.id_carregamento IS NOT NULL
    AND cpv.peso_total_distribuido IS NOT NULL
ORDER BY cpv.data_checagem DESC, cpv.hora_checagem DESC;

-- Comentário da view
COMMENT ON VIEW public.view_analise_carregamento_distribuicao IS 'Análise de rastreabilidade entre peso carregado e soma dos pesos distribuídos';

-- ==========================================================================
-- VIEW 4: Resumo Semanal de Checagens
-- Agrupamento por semana para acompanhamento da rotina de checagem
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_resumo_semanal_checagem AS
SELECT
    cpv.organization_id,
    DATE_TRUNC('week', cpv.data_checagem)::date AS semana_inicio,
    COUNT(*) AS total_checagens,
    COUNT(DISTINCT cpv.vagao_id) AS vagoes_checados,

    -- Estatísticas de conformidade
    COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'verde') AS checagens_conformes,
    COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'amarelo') AS checagens_atencao,
    COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'vermelho') AS checagens_criticas,
    COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'vermelho_escuro') AS checagens_muito_criticas,

    -- Percentual de conformidade
    ROUND(
        COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'verde')::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS percentual_conformidade,

    -- Médias das diferenças
    ROUND(AVG(ABS(cpv.diferenca_balancao_visor)), 2) AS media_diferenca_balancao_visor,
    ROUND(AVG(ABS(cpv.diferenca_visor_carregamento)), 2) AS media_diferenca_visor_sistema,
    ROUND(AVG(ABS(cpv.diferenca_carregamento_distribuicao)), 2) AS media_diferenca_carregamento_distribuicao
FROM public.checagem_peso_vagao cpv
GROUP BY cpv.organization_id, DATE_TRUNC('week', cpv.data_checagem)
ORDER BY semana_inicio DESC;

-- Comentário da view
COMMENT ON VIEW public.view_resumo_semanal_checagem IS 'Resumo semanal das checagens de peso com estatísticas de conformidade';

-- ==========================================================================
-- VIEW 5: Alertas de Checagem Pendente
-- Identifica vagões que precisam ser checados (segunda-feira)
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_alertas_checagem_pendente AS
WITH ultima_checagem AS (
    SELECT
        vagao_id,
        organization_id,
        MAX(data_checagem) AS ultima_data_checagem
    FROM public.checagem_peso_vagao
    GROUP BY vagao_id, organization_id
),
proxima_segunda AS (
    SELECT
        CASE
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN CURRENT_DATE
            ELSE DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        END::date AS data_proxima_checagem
)
SELECT
    v.id AS vagao_id,
    v.organization_id,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,
    uc.ultima_data_checagem,
    ps.data_proxima_checagem,
    CASE
        WHEN uc.ultima_data_checagem IS NULL THEN 'Nunca checado'
        WHEN uc.ultima_data_checagem < ps.data_proxima_checagem - INTERVAL '7 days' THEN 'Checagem atrasada'
        WHEN ps.data_proxima_checagem = CURRENT_DATE THEN 'Checagem hoje'
        ELSE 'Em dia'
    END AS status_checagem,
    CASE
        WHEN uc.ultima_data_checagem IS NULL OR
             uc.ultima_data_checagem < ps.data_proxima_checagem - INTERVAL '7 days' THEN true
        ELSE false
    END AS requer_acao
FROM public.dim_vagoes v
LEFT JOIN ultima_checagem uc ON uc.vagao_id = v.id AND uc.organization_id = v.organization_id
CROSS JOIN proxima_segunda ps
WHERE v.ativo = true
ORDER BY
    CASE
        WHEN uc.ultima_data_checagem IS NULL THEN 0
        WHEN uc.ultima_data_checagem < ps.data_proxima_checagem - INTERVAL '7 days' THEN 1
        WHEN ps.data_proxima_checagem = CURRENT_DATE THEN 2
        ELSE 3
    END,
    v.codigo;

-- Comentário da view
COMMENT ON VIEW public.view_alertas_checagem_pendente IS 'Identifica vagões que precisam de checagem semanal (segundas-feiras)';

-- ==========================================================================
-- VIEW 6: Histórico de Performance por Vagão
-- Acompanhamento histórico de cada vagão
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_historico_performance_vagao AS
SELECT
    v.id AS vagao_id,
    v.organization_id,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,
    COUNT(cpv.id) AS total_checagens,

    -- Primeira e última checagem
    MIN(cpv.data_checagem) AS primeira_checagem,
    MAX(cpv.data_checagem) AS ultima_checagem,

    -- Estatísticas de conformidade
    COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'verde') AS total_conforme,
    COUNT(*) FILTER (WHERE cpv.status_tolerancia IN ('amarelo', 'vermelho', 'vermelho_escuro')) AS total_nao_conforme,

    -- Taxa de conformidade
    ROUND(
        COUNT(*) FILTER (WHERE cpv.status_tolerancia = 'verde')::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS taxa_conformidade,

    -- Médias das diferenças
    ROUND(AVG(ABS(cpv.diferenca_balancao_visor)), 2) AS media_diferenca_balancao,
    ROUND(MAX(ABS(cpv.diferenca_balancao_visor)), 2) AS maxima_diferenca_balancao,

    -- Tendência (últimas 4 checagens)
    ROUND(
        AVG(ABS(cpv.diferenca_balancao_visor)) FILTER (
            WHERE cpv.data_checagem >= (
                SELECT MAX(data_checagem) - INTERVAL '28 days'
                FROM public.checagem_peso_vagao
                WHERE vagao_id = v.id
            )
        ),
        2
    ) AS media_ultimas_4_semanas
FROM public.dim_vagoes v
LEFT JOIN public.checagem_peso_vagao cpv ON cpv.vagao_id = v.id
WHERE v.ativo = true
GROUP BY v.id, v.organization_id, v.codigo, v.nome
ORDER BY v.codigo;

-- Comentário da view
COMMENT ON VIEW public.view_historico_performance_vagao IS 'Histórico de performance e conformidade por vagão';

-- Criar índices para melhorar performance das views
CREATE INDEX IF NOT EXISTS idx_fato_carregamento_org_vagao_data
    ON public.fato_carregamento(organization_id, vagao_id, data_hora_fim);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_carregamento
    ON public.fato_distribuicao(organization_id, id_carregamento);