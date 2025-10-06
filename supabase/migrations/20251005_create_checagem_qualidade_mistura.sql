-- ==========================================================================
-- CHECAGEM QUALIDADE DA MISTURA
-- Controle de homogeneidade e qualidade da mistura de ração
-- ==========================================================================

-- Criar tabela de checagem qualidade da mistura
CREATE TABLE IF NOT EXISTS public.checagem_qualidade_mistura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,

    -- Dados da checagem
    data_checagem DATE NOT NULL,
    hora_checagem TIME NOT NULL,
    vagao_id UUID REFERENCES public.dim_vagoes(id),

    -- Identificação da dieta/mistura
    dieta_nome VARCHAR(100),
    lote_producao VARCHAR(50),
    quantidade_produzida DECIMAL(12,2), -- kg

    -- Parâmetros de qualidade avaliados
    homogeneidade_visual VARCHAR(20) CHECK (homogeneidade_visual IN ('excelente', 'boa', 'regular', 'ruim')),
    presenca_grumos BOOLEAN DEFAULT false,
    segregacao_ingredientes BOOLEAN DEFAULT false,
    umidade_aparente VARCHAR(20) CHECK (umidade_aparente IN ('seca', 'adequada', 'umida', 'muito_umida')),
    cor_consistencia VARCHAR(20) CHECK (cor_consistencia IN ('normal', 'alterada', 'suspeita')),
    odor VARCHAR(20) CHECK (odor IN ('normal', 'alterado', 'azedo', 'mofo')),

    -- Teste do sal/marcador (Penn State Particle Separator)
    teste_marcador_realizado BOOLEAN DEFAULT false,
    coeficiente_variacao DECIMAL(5,2), -- % CV do teste
    numero_amostras INTEGER,

    -- Análise granulométrica da mistura
    particulas_grossas DECIMAL(5,2), -- % retida peneira superior
    particulas_medias DECIMAL(5,2),  -- % retida peneira média
    particulas_finas DECIMAL(5,2),   -- % retida peneira inferior

    -- Temperatura da mistura
    temperatura_mistura DECIMAL(5,2), -- °C

    -- Status e classificação
    status_geral VARCHAR(20) DEFAULT 'pendente' CHECK (status_geral IN ('aprovado', 'aprovado_restricao', 'reprovado', 'pendente')),

    -- Ações corretivas
    requer_acao_corretiva BOOLEAN DEFAULT false,
    acao_corretiva_descricao TEXT,
    remisturar BOOLEAN DEFAULT false,
    ajustar_tempo_mistura BOOLEAN DEFAULT false,
    ajustar_sequencia_ingredientes BOOLEAN DEFAULT false,

    -- Observações
    observacoes TEXT,
    responsavel_id UUID REFERENCES public.profiles(id) NOT NULL,
    aprovado_por UUID REFERENCES public.profiles(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Índices para otimização
CREATE INDEX idx_checagem_qualidade_org_data ON public.checagem_qualidade_mistura(organization_id, data_checagem DESC);
CREATE INDEX idx_checagem_qualidade_status ON public.checagem_qualidade_mistura(status_geral);
CREATE INDEX idx_checagem_qualidade_vagao ON public.checagem_qualidade_mistura(vagao_id);

-- RLS para checagem_qualidade_mistura
ALTER TABLE public.checagem_qualidade_mistura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checagem_qualidade_select" ON public.checagem_qualidade_mistura
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "checagem_qualidade_insert" ON public.checagem_qualidade_mistura
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "checagem_qualidade_update" ON public.checagem_qualidade_mistura
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- ==========================================================================
-- VIEW 1: Análise de Conformidade da Mistura
-- Resume o status de qualidade das misturas
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_conformidade_mistura AS
SELECT
    cqm.id,
    cqm.organization_id,
    cqm.data_checagem,
    cqm.hora_checagem,
    v.codigo AS vagao_codigo,
    v.nome AS vagao_nome,
    cqm.dieta_nome,
    cqm.lote_producao,
    cqm.quantidade_produzida,

    -- Avaliação visual
    cqm.homogeneidade_visual,
    CASE
        WHEN cqm.homogeneidade_visual = 'excelente' THEN '⭐⭐⭐⭐⭐'
        WHEN cqm.homogeneidade_visual = 'boa' THEN '⭐⭐⭐⭐'
        WHEN cqm.homogeneidade_visual = 'regular' THEN '⭐⭐⭐'
        ELSE '⭐⭐'
    END AS qualidade_estrelas,

    -- Problemas identificados
    cqm.presenca_grumos,
    cqm.segregacao_ingredientes,
    cqm.umidade_aparente,
    cqm.odor,

    -- Teste de homogeneidade
    cqm.coeficiente_variacao,
    CASE
        WHEN cqm.coeficiente_variacao IS NULL THEN 'Não realizado'
        WHEN cqm.coeficiente_variacao <= 10 THEN '✅ Excelente (<10%)'
        WHEN cqm.coeficiente_variacao <= 15 THEN '⚠️ Aceitável (10-15%)'
        WHEN cqm.coeficiente_variacao <= 20 THEN '❌ Marginal (15-20%)'
        ELSE '🔴 Inadequado (>20%)'
    END AS classificacao_cv,

    -- Status
    cqm.status_geral,
    CASE cqm.status_geral
        WHEN 'aprovado' THEN '✅ Aprovado'
        WHEN 'aprovado_restricao' THEN '⚠️ Aprovado com Restrição'
        WHEN 'reprovado' THEN '❌ Reprovado'
        ELSE '⏳ Pendente'
    END AS status_descricao,

    cqm.requer_acao_corretiva,

    -- Responsáveis
    p.full_name AS responsavel_nome,
    ap.full_name AS aprovador_nome,
    cqm.data_aprovacao,

    cqm.observacoes,
    cqm.created_at
FROM public.checagem_qualidade_mistura cqm
LEFT JOIN public.dim_vagoes v ON v.id = cqm.vagao_id
JOIN public.profiles p ON p.id = cqm.responsavel_id
LEFT JOIN public.profiles ap ON ap.id = cqm.aprovado_por
ORDER BY cqm.data_checagem DESC, cqm.hora_checagem DESC;

-- Comentário da view
COMMENT ON VIEW public.view_conformidade_mistura IS 'Análise de conformidade e qualidade das misturas de ração';

-- ==========================================================================
-- VIEW 2: Estatísticas de Qualidade por Período
-- Métricas agregadas de qualidade
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_estatisticas_qualidade_mistura AS
SELECT
    cqm.organization_id,
    DATE_TRUNC('week', cqm.data_checagem)::date AS semana,
    COUNT(*) AS total_checagens,

    -- Taxa de aprovação
    COUNT(*) FILTER (WHERE cqm.status_geral = 'aprovado') AS total_aprovados,
    COUNT(*) FILTER (WHERE cqm.status_geral = 'aprovado_restricao') AS total_aprovados_restricao,
    COUNT(*) FILTER (WHERE cqm.status_geral = 'reprovado') AS total_reprovados,

    ROUND(
        COUNT(*) FILTER (WHERE cqm.status_geral IN ('aprovado', 'aprovado_restricao'))::numeric /
        NULLIF(COUNT(*) FILTER (WHERE cqm.status_geral != 'pendente'), 0) * 100,
        2
    ) AS taxa_aprovacao,

    -- Problemas mais frequentes
    COUNT(*) FILTER (WHERE cqm.presenca_grumos = true) AS casos_grumos,
    COUNT(*) FILTER (WHERE cqm.segregacao_ingredientes = true) AS casos_segregacao,
    COUNT(*) FILTER (WHERE cqm.odor != 'normal') AS casos_odor_alterado,

    -- Média do CV quando testado
    ROUND(AVG(cqm.coeficiente_variacao) FILTER (WHERE cqm.coeficiente_variacao IS NOT NULL), 2) AS cv_medio,
    MIN(cqm.coeficiente_variacao) FILTER (WHERE cqm.coeficiente_variacao IS NOT NULL) AS cv_minimo,
    MAX(cqm.coeficiente_variacao) FILTER (WHERE cqm.coeficiente_variacao IS NOT NULL) AS cv_maximo,

    -- Ações corretivas
    COUNT(*) FILTER (WHERE cqm.requer_acao_corretiva = true) AS total_acoes_corretivas
FROM public.checagem_qualidade_mistura cqm
GROUP BY cqm.organization_id, DATE_TRUNC('week', cqm.data_checagem)
ORDER BY semana DESC;

-- Comentário da view
COMMENT ON VIEW public.view_estatisticas_qualidade_mistura IS 'Estatísticas semanais de qualidade das misturas';

-- ==========================================================================
-- VIEW 3: Checagens Pendentes de Aprovação
-- Lista checagens que precisam de aprovação
-- ==========================================================================
CREATE OR REPLACE VIEW public.view_checagens_pendentes_aprovacao AS
SELECT
    cqm.id,
    cqm.organization_id,
    cqm.data_checagem,
    cqm.hora_checagem,
    v.codigo AS vagao_codigo,
    cqm.dieta_nome,
    cqm.lote_producao,

    -- Avaliação
    cqm.homogeneidade_visual,
    cqm.coeficiente_variacao,
    cqm.presenca_grumos OR cqm.segregacao_ingredientes AS tem_problemas,

    -- Tempo aguardando
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cqm.created_at)) / 3600 AS horas_aguardando,

    CASE
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cqm.created_at)) / 3600 > 24 THEN '🔴 Urgente (>24h)'
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cqm.created_at)) / 3600 > 12 THEN '⚠️ Prioritário (>12h)'
        ELSE '⏰ Normal'
    END AS prioridade,

    -- Responsável
    p.full_name AS responsavel_nome,

    cqm.observacoes,
    cqm.created_at
FROM public.checagem_qualidade_mistura cqm
LEFT JOIN public.dim_vagoes v ON v.id = cqm.vagao_id
JOIN public.profiles p ON p.id = cqm.responsavel_id
WHERE cqm.status_geral = 'pendente'
    AND cqm.aprovado_por IS NULL
ORDER BY cqm.created_at ASC;

-- Comentário da view
COMMENT ON VIEW public.view_checagens_pendentes_aprovacao IS 'Lista de checagens de qualidade aguardando aprovação';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_checagem_qualidade_updated_at
    BEFORE UPDATE ON public.checagem_qualidade_mistura
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();