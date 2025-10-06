-- Migration: Criar tabela de composição de dietas
-- Data: 2025-09-30
-- Objetivo: Relacionar ingredientes com dietas, incluindo proporções e custos

-- Criar tabela de composição de dietas
CREATE TABLE IF NOT EXISTS public.dieta_composicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    dieta_id UUID NOT NULL REFERENCES public.dim_dietas(id) ON DELETE CASCADE,
    ingrediente_id UUID NOT NULL REFERENCES public.dim_ingredientes(id) ON DELETE CASCADE,

    -- Campos informados pelo usuário
    cons_ms_kg NUMERIC(10,4) NOT NULL, -- Consumo de Matéria Seca (Kg MS)
    percentual_ms NUMERIC(6,4) NOT NULL, -- %MS (em decimal, ex: 0.8850 = 88.50%)
    custo_mo_ton NUMERIC(12,2), -- Custo Matéria Original (R$/Ton)
    local_mistura VARCHAR(20) NOT NULL DEFAULT 'vagao', -- 'vagao' ou 'pre-mistura'

    -- Campos calculados automaticamente
    cons_mo_kg NUMERIC(10,4), -- Consumo MO = Cons MS / %MS
    prop_ms_percentual NUMERIC(8,6), -- Proporção %MS = Cons MS ingrediente / Σ Cons MS dieta
    prop_mo_percentual NUMERIC(8,6), -- Proporção %MO = Cons MO ingrediente / Σ Cons MO dieta
    custo_ms_ton NUMERIC(12,2), -- Custo MS = Custo MO / %MS

    -- Ordem de mistura (útil para sequência no vagão)
    ordem_mistura INTEGER DEFAULT 1,

    -- Observações
    observacoes TEXT,

    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT dieta_composicao_organization_dieta_ingrediente_unique
        UNIQUE (organization_id, dieta_id, ingrediente_id),
    CONSTRAINT dieta_composicao_local_mistura_check
        CHECK (local_mistura IN ('vagao', 'pre-mistura')),
    CONSTRAINT dieta_composicao_cons_ms_positive
        CHECK (cons_ms_kg > 0),
    CONSTRAINT dieta_composicao_percentual_ms_range
        CHECK (percentual_ms > 0 AND percentual_ms <= 1)
);

-- Criar índices para performance
CREATE INDEX idx_dieta_composicao_organization ON public.dieta_composicao(organization_id);
CREATE INDEX idx_dieta_composicao_dieta ON public.dieta_composicao(dieta_id);
CREATE INDEX idx_dieta_composicao_ingrediente ON public.dieta_composicao(ingrediente_id);
CREATE INDEX idx_dieta_composicao_local_mistura ON public.dieta_composicao(local_mistura);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_dieta_composicao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Calcular campos automaticamente
    -- 1. Cons MO = Cons MS / %MS
    IF NEW.cons_ms_kg IS NOT NULL AND NEW.percentual_ms IS NOT NULL AND NEW.percentual_ms > 0 THEN
        NEW.cons_mo_kg = NEW.cons_ms_kg / NEW.percentual_ms;
    END IF;

    -- 2. Custo MS = Custo MO / %MS
    IF NEW.custo_mo_ton IS NOT NULL AND NEW.percentual_ms IS NOT NULL AND NEW.percentual_ms > 0 THEN
        NEW.custo_ms_ton = NEW.custo_mo_ton / NEW.percentual_ms;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dieta_composicao_updated_at
    BEFORE UPDATE ON public.dieta_composicao
    FOR EACH ROW
    EXECUTE FUNCTION update_dieta_composicao_updated_at();

CREATE TRIGGER trigger_calculate_dieta_composicao_fields
    BEFORE INSERT ON public.dieta_composicao
    FOR EACH ROW
    EXECUTE FUNCTION update_dieta_composicao_updated_at();

-- Function para recalcular proporções de uma dieta (chamada após INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION recalcular_proporcoes_dieta(p_dieta_id UUID, p_organization_id UUID)
RETURNS void AS $$
DECLARE
    v_total_cons_ms NUMERIC(10,4);
    v_total_cons_mo NUMERIC(10,4);
BEGIN
    -- Calcular totais da dieta
    SELECT
        COALESCE(SUM(cons_ms_kg), 0),
        COALESCE(SUM(cons_mo_kg), 0)
    INTO v_total_cons_ms, v_total_cons_mo
    FROM public.dieta_composicao
    WHERE dieta_id = p_dieta_id
        AND organization_id = p_organization_id
        AND ativo = true;

    -- Atualizar proporções de todos os ingredientes da dieta
    IF v_total_cons_ms > 0 AND v_total_cons_mo > 0 THEN
        UPDATE public.dieta_composicao
        SET
            prop_ms_percentual = cons_ms_kg / v_total_cons_ms,
            prop_mo_percentual = cons_mo_kg / v_total_cons_mo,
            updated_at = NOW()
        WHERE dieta_id = p_dieta_id
            AND organization_id = p_organization_id
            AND ativo = true;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular proporções automaticamente após mudanças
CREATE OR REPLACE FUNCTION trigger_recalcular_proporcoes()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular para a dieta afetada
    IF TG_OP = 'DELETE' THEN
        PERFORM recalcular_proporcoes_dieta(OLD.dieta_id, OLD.organization_id);
        RETURN OLD;
    ELSE
        PERFORM recalcular_proporcoes_dieta(NEW.dieta_id, NEW.organization_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_proporcoes_after_insert
    AFTER INSERT ON public.dieta_composicao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_proporcoes();

CREATE TRIGGER trigger_recalcular_proporcoes_after_update
    AFTER UPDATE OF cons_ms_kg, percentual_ms, ativo ON public.dieta_composicao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_proporcoes();

CREATE TRIGGER trigger_recalcular_proporcoes_after_delete
    AFTER DELETE ON public.dieta_composicao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_proporcoes();

-- RLS Policies
ALTER TABLE public.dieta_composicao ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
CREATE POLICY dieta_composicao_select_policy ON public.dieta_composicao
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: INSERT
CREATE POLICY dieta_composicao_insert_policy ON public.dieta_composicao
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: UPDATE
CREATE POLICY dieta_composicao_update_policy ON public.dieta_composicao
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: DELETE
CREATE POLICY dieta_composicao_delete_policy ON public.dieta_composicao
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dieta_composicao TO authenticated;
GRANT SELECT ON public.dieta_composicao TO anon;

-- Comentários
COMMENT ON TABLE public.dieta_composicao IS 'Composição/formulação de dietas - relaciona ingredientes com dietas incluindo proporções e custos';
COMMENT ON COLUMN public.dieta_composicao.cons_ms_kg IS 'Consumo de Matéria Seca em Kg';
COMMENT ON COLUMN public.dieta_composicao.percentual_ms IS 'Percentual de Matéria Seca (decimal, ex: 0.8850 = 88.50%)';
COMMENT ON COLUMN public.dieta_composicao.custo_mo_ton IS 'Custo da Matéria Original em R$/Tonelada';
COMMENT ON COLUMN public.dieta_composicao.local_mistura IS 'Local de mistura: vagao ou pre-mistura';
COMMENT ON COLUMN public.dieta_composicao.cons_mo_kg IS 'Consumo de Matéria Original = Cons MS / %MS (calculado)';
COMMENT ON COLUMN public.dieta_composicao.prop_ms_percentual IS 'Proporção %MS = Cons MS ingrediente / Σ Cons MS dieta (calculado)';
COMMENT ON COLUMN public.dieta_composicao.prop_mo_percentual IS 'Proporção %MO = Cons MO ingrediente / Σ Cons MO dieta (calculado)';
COMMENT ON COLUMN public.dieta_composicao.custo_ms_ton IS 'Custo da Matéria Seca = Custo MO / %MS (calculado)';
