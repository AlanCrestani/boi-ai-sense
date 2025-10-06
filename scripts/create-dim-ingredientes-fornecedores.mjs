import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.zirowpnlxjenkxiqcuwz:XMzJHd5qTDLGZdMW@db.zirowpnlxjenkxiqcuwz.supabase.co:5432/postgres";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const createTableSQL = `
-- Migration: Create dim_ingredientes and dim_fornecedores tables
-- Created: 2025-09-30
-- Description: Basic structure for ingredients and suppliers management

-- Create dim_fornecedores (Suppliers dimension table)
CREATE TABLE IF NOT EXISTS public.dim_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Basic information
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    telefone VARCHAR(20),
    email VARCHAR(255),

    -- Status
    ativo BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT dim_fornecedores_organization_nome_unique UNIQUE (organization_id, nome)
);

-- Create dim_ingredientes (Ingredients dimension table)
CREATE TABLE IF NOT EXISTS public.dim_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Basic information
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),

    -- Supplier relationship
    fornecedor_id UUID REFERENCES public.dim_fornecedores(id) ON DELETE SET NULL,

    -- Unit and type
    unidade_medida VARCHAR(20) DEFAULT 'kg',
    tipo VARCHAR(50), -- concentrado, volumoso, mineral, etc.

    -- Status
    ativo BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT dim_ingredientes_organization_nome_unique UNIQUE (organization_id, nome)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_organization ON public.dim_fornecedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_ativo ON public.dim_fornecedores(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_nome ON public.dim_fornecedores(nome);

CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_organization ON public.dim_ingredientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_fornecedor ON public.dim_ingredientes(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_ativo ON public.dim_ingredientes(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_nome ON public.dim_ingredientes(nome);

-- Enable Row Level Security
ALTER TABLE public.dim_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_ingredientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dim_fornecedores
DROP POLICY IF EXISTS "Users can view fornecedores from their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can view fornecedores from their organization"
    ON public.dim_fornecedores FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can insert fornecedores in their organization"
    ON public.dim_fornecedores FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can update fornecedores in their organization"
    ON public.dim_fornecedores FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can delete fornecedores in their organization"
    ON public.dim_fornecedores FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- RLS Policies for dim_ingredientes
DROP POLICY IF EXISTS "Users can view ingredientes from their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can view ingredientes from their organization"
    ON public.dim_ingredientes FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can insert ingredientes in their organization"
    ON public.dim_ingredientes FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can update ingredientes in their organization"
    ON public.dim_ingredientes FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can delete ingredientes in their organization"
    ON public.dim_ingredientes FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_dim_fornecedores_updated_at ON public.dim_fornecedores;
CREATE TRIGGER update_dim_fornecedores_updated_at
    BEFORE UPDATE ON public.dim_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dim_ingredientes_updated_at ON public.dim_ingredientes;
CREATE TRIGGER update_dim_ingredientes_updated_at
    BEFORE UPDATE ON public.dim_ingredientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.dim_fornecedores IS 'Dimension table for suppliers/providers of ingredients';
COMMENT ON TABLE public.dim_ingredientes IS 'Dimension table for feed ingredients';

COMMENT ON COLUMN public.dim_fornecedores.nome IS 'Supplier name';
COMMENT ON COLUMN public.dim_fornecedores.cnpj IS 'Brazilian company registration number';
COMMENT ON COLUMN public.dim_fornecedores.ativo IS 'Active status flag';

COMMENT ON COLUMN public.dim_ingredientes.nome IS 'Ingredient name';
COMMENT ON COLUMN public.dim_ingredientes.codigo IS 'Ingredient code/SKU';
COMMENT ON COLUMN public.dim_ingredientes.unidade_medida IS 'Unit of measurement (kg, ton, etc)';
COMMENT ON COLUMN public.dim_ingredientes.tipo IS 'Ingredient type (concentrado, volumoso, mineral, etc)';
COMMENT ON COLUMN public.dim_ingredientes.ativo IS 'Active status flag';
`;

async function createTables() {
  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conectado com sucesso!');

    console.log('\nCriando tabelas dim_fornecedores e dim_ingredientes...');
    await client.query(createTableSQL);
    console.log('✅ Tabelas criadas com sucesso!');

    // Verificar se as tabelas foram criadas
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('dim_fornecedores', 'dim_ingredientes')
      ORDER BY table_name;
    `);

    console.log('\n✅ Tabelas encontradas no banco:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\nConexão fechada.');
  }
}

createTables();