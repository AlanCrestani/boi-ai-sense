-- Primeiro, criar tabelas base se não existirem
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Criar a tabela staging_03_desvio_distribuicao
CREATE TABLE IF NOT EXISTS staging_03_desvio_distribuicao (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    data DATE NOT NULL,
    hora TIME NOT NULL,
    vagao VARCHAR(100),
    curral VARCHAR(100) NOT NULL,
    trato VARCHAR(100),
    tratador VARCHAR(255),
    dieta VARCHAR(255),
    realizado_kg DECIMAL(10, 2),
    previsto_kg DECIMAL(10, 2),
    desvio_kg DECIMAL(10, 2),
    desvio_pc DECIMAL(10, 2),
    status VARCHAR(50),
    merge VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);
CREATE INDEX IF NOT EXISTS idx_staging_03_data ON staging_03_desvio_distribuicao(data);
CREATE INDEX IF NOT EXISTS idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);

-- Habilitar RLS
ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "staging_03_select_policy" ON staging_03_desvio_distribuicao;
CREATE POLICY "staging_03_select_policy" ON staging_03_desvio_distribuicao
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "staging_03_insert_policy" ON staging_03_desvio_distribuicao;
CREATE POLICY "staging_03_insert_policy" ON staging_03_desvio_distribuicao
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "staging_03_update_policy" ON staging_03_desvio_distribuicao;
CREATE POLICY "staging_03_update_policy" ON staging_03_desvio_distribuicao
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "staging_03_delete_policy" ON staging_03_desvio_distribuicao;
CREATE POLICY "staging_03_delete_policy" ON staging_03_desvio_distribuicao
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_staging_03_updated_at ON staging_03_desvio_distribuicao;
CREATE TRIGGER update_staging_03_updated_at
    BEFORE UPDATE ON staging_03_desvio_distribuicao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();