-- Criar tabela dim_vagoes se não existir
CREATE TABLE IF NOT EXISTS public.dim_vagoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50), -- misturador, distribuidor, etc
    capacidade_kg DECIMAL(10,2),
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano_fabricacao INTEGER,
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(organization_id, codigo)
);

-- Criar enum para status de tolerância
DO $$ BEGIN
    CREATE TYPE tolerancia_status AS ENUM ('verde', 'amarelo', 'vermelho', 'vermelho_escuro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de checagem peso vagão
CREATE TABLE IF NOT EXISTS public.checagem_peso_vagao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,

    -- Dados da checagem
    data_checagem DATE NOT NULL,
    hora_checagem TIME NOT NULL,
    vagao_id UUID REFERENCES public.dim_vagoes(id) NOT NULL,

    -- Pesos do balancão
    peso_vazio_balancao DECIMAL(12,2) NOT NULL,
    peso_carregado_balancao DECIMAL(12,2) NOT NULL,
    peso_liquido_balancao DECIMAL(12,2) GENERATED ALWAYS AS (peso_carregado_balancao - peso_vazio_balancao) STORED,

    -- Peso do visor do vagão
    peso_visor_balanca_vagao DECIMAL(12,2) NOT NULL,

    -- Referência ao carregamento
    id_carregamento BIGINT,
    peso_id_carregamento DECIMAL(12,2),

    -- Peso distribuído
    peso_total_distribuido DECIMAL(12,2),

    -- Análises de diferença (%)
    diferenca_balancao_visor DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN peso_visor_balanca_vagao = 0 THEN NULL
            ELSE ((peso_liquido_balancao - peso_visor_balanca_vagao) / peso_visor_balanca_vagao * 100)
        END
    ) STORED,

    diferenca_visor_carregamento DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN peso_id_carregamento = 0 OR peso_id_carregamento IS NULL THEN NULL
            ELSE ((peso_visor_balanca_vagao - peso_id_carregamento) / peso_id_carregamento * 100)
        END
    ) STORED,

    diferenca_carregamento_distribuicao DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN peso_total_distribuido = 0 OR peso_total_distribuido IS NULL THEN NULL
            ELSE ((peso_id_carregamento - peso_total_distribuido) / peso_total_distribuido * 100)
        END
    ) STORED,

    -- Status de tolerância
    status_tolerancia tolerancia_status GENERATED ALWAYS AS (
        CASE
            WHEN ABS(COALESCE(diferenca_balancao_visor, 0)) <= 2 THEN 'verde'::tolerancia_status
            WHEN ABS(COALESCE(diferenca_balancao_visor, 0)) <= 5 THEN 'amarelo'::tolerancia_status
            WHEN ABS(COALESCE(diferenca_balancao_visor, 0)) <= 10 THEN 'vermelho'::tolerancia_status
            ELSE 'vermelho_escuro'::tolerancia_status
        END
    ) STORED,

    -- Outros campos
    observacoes TEXT,
    responsavel_id UUID REFERENCES public.profiles(id) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Índices para otimização
CREATE INDEX idx_checagem_peso_vagao_org_data ON public.checagem_peso_vagao(organization_id, data_checagem DESC);
CREATE INDEX idx_checagem_peso_vagao_vagao ON public.checagem_peso_vagao(vagao_id);
CREATE INDEX idx_checagem_peso_vagao_carregamento ON public.checagem_peso_vagao(id_carregamento);
CREATE INDEX idx_checagem_peso_vagao_status ON public.checagem_peso_vagao(status_tolerancia);

-- RLS para dim_vagoes
ALTER TABLE public.dim_vagoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dim_vagoes_select" ON public.dim_vagoes
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "dim_vagoes_insert" ON public.dim_vagoes
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "dim_vagoes_update" ON public.dim_vagoes
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- RLS para checagem_peso_vagao
ALTER TABLE public.checagem_peso_vagao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checagem_peso_vagao_select" ON public.checagem_peso_vagao
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "checagem_peso_vagao_insert" ON public.checagem_peso_vagao
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "checagem_peso_vagao_update" ON public.checagem_peso_vagao
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Função para buscar id_carregamento automaticamente
CREATE OR REPLACE FUNCTION buscar_id_carregamento_checagem(
    p_organization_id UUID,
    p_data_checagem DATE,
    p_hora_checagem TIME,
    p_vagao_id UUID
)
RETURNS TABLE (
    id_carregamento BIGINT,
    peso_total DECIMAL,
    hora_ultimo_ingrediente TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fc.id_carregamento,
        fc.peso_total_realizado as peso_total,
        fc.data_hora_fim as hora_ultimo_ingrediente
    FROM public.fato_carregamento fc
    WHERE fc.organization_id = p_organization_id
        AND fc.data_hora_fim::date = p_data_checagem
        AND fc.data_hora_fim::time < p_hora_checagem
        AND fc.vagao_id = p_vagao_id
    ORDER BY fc.data_hora_fim DESC
    LIMIT 1;
END;
$$;

-- Função para buscar peso total distribuído
CREATE OR REPLACE FUNCTION buscar_peso_distribuido_carregamento(
    p_organization_id UUID,
    p_id_carregamento BIGINT
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_peso_total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(peso_distribuido), 0)
    INTO v_peso_total
    FROM public.fato_distribuicao
    WHERE organization_id = p_organization_id
        AND id_carregamento = p_id_carregamento;

    RETURN v_peso_total;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dim_vagoes_updated_at
    BEFORE UPDATE ON public.dim_vagoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checagem_peso_vagao_updated_at
    BEFORE UPDATE ON public.checagem_peso_vagao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();