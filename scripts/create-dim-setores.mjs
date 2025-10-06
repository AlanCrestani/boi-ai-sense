import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:XMzJHd5qTDLGZdMW@db.zirowpnlxjenkxiqcuwz.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function createDimSetores() {
  try {
    await client.connect();
    console.log('🔌 Connected to database');

    const createTableSQL = `
-- Create dim_setores table for organizational sectors
CREATE TABLE IF NOT EXISTS public.dim_setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('confinamento', 'semiconfinamento', 'pasto')),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dim_setores_organization ON public.dim_setores(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_setores_tipo ON public.dim_setores(tipo);
CREATE INDEX IF NOT EXISTS idx_dim_setores_ativo ON public.dim_setores(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_setores_codigo ON public.dim_setores(codigo);

-- Add RLS policies for dim_setores
ALTER TABLE public.dim_setores ENABLE ROW LEVEL SECURITY;
    `;

    const createPoliciesSQL = `
-- Policies for dim_setores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can view their organization sectors') THEN
    CREATE POLICY "Users can view their organization sectors" ON public.dim_setores
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can insert sectors for their organization') THEN
    CREATE POLICY "Users can insert sectors for their organization" ON public.dim_setores
      FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can update their organization sectors') THEN
    CREATE POLICY "Users can update their organization sectors" ON public.dim_setores
      FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can delete their organization sectors') THEN
    CREATE POLICY "Users can delete their organization sectors" ON public.dim_setores
      FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;
END
$$;
    `;

    const insertSampleDataSQL = `
-- Insert sample data for testing
INSERT INTO public.dim_setores (organization_id, codigo, nome, tipo, descricao) VALUES
((SELECT id FROM organizations LIMIT 1), 'PASTO-01', 'Setor Norte Pasto', 'pasto', 'Setor dedicado ao manejo de pastagens do norte da propriedade'),
((SELECT id FROM organizations LIMIT 1), 'CONF-01', 'Setor Confinamento Central', 'confinamento', 'Setor central de confinamento com capacidade para manejo intensivo'),
((SELECT id FROM organizations LIMIT 1), 'SEMI-01', 'Setor Semiconfinamento A', 'semiconfinamento', 'Primeiro setor de semiconfinamento da propriedade')
ON CONFLICT (organization_id, codigo) DO NOTHING;
    `;

    console.log('🏗️  Creating dim_setores table...');
    await client.query(createTableSQL);
    console.log('✅ Table created successfully');

    console.log('🔐 Creating RLS policies...');
    await client.query(createPoliciesSQL);
    console.log('✅ Policies created successfully');

    console.log('📝 Inserting sample data...');
    await client.query(insertSampleDataSQL);
    console.log('✅ Sample data inserted successfully');

    console.log('📊 Adding table comment...');
    await client.query("COMMENT ON TABLE public.dim_setores IS 'Dimensão de setores organizacionais (não inclui área - específica para currais/módulos/pastos)'");
    console.log('✅ Comment added successfully');

    // Verify table was created
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dim_setores'");
    console.log('🔍 Verification:', result.rows.length > 0 ? 'dim_setores table exists!' : 'Table not found');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

createDimSetores();