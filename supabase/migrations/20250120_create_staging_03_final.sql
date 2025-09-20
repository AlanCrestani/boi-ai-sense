-- Criar tabela staging_03_desvio_distribuicao se não existir
CREATE TABLE IF NOT EXISTS staging_03_desvio_distribuicao (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    created_by UUID,
    updated_by UUID,
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

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);
CREATE INDEX IF NOT EXISTS idx_staging_03_data ON staging_03_desvio_distribuicao(data);
CREATE INDEX IF NOT EXISTS idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);
CREATE INDEX IF NOT EXISTS idx_staging_03_status ON staging_03_desvio_distribuicao(status);
CREATE INDEX IF NOT EXISTS idx_staging_03_created_at ON staging_03_desvio_distribuicao(created_at DESC);

-- Habilitar RLS
ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

-- Criar função de atualização se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_staging_03_updated_at ON staging_03_desvio_distribuicao;
CREATE TRIGGER update_staging_03_updated_at
    BEFORE UPDATE ON staging_03_desvio_distribuicao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();