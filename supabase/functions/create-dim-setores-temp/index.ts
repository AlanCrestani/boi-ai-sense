import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating dim_setores table...');

    // Create the table
    const createTableQuery = `
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

    const { error: createError } = await supabase.rpc('exec', { sql: createTableQuery });

    if (createError) {
      throw createError;
    }

    // Create policies
    const policiesQueries = [
      `
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
      `,
      `
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
      `,
      `
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
      `,
      `
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
      `
    ];

    for (const policy of policiesQueries) {
      const { error: policyError } = await supabase.rpc('exec', { sql: policy });
      if (policyError) {
        console.error('Policy error:', policyError);
      }
    }

    // Insert sample data
    const sampleDataQuery = `
      INSERT INTO public.dim_setores (organization_id, codigo, nome, tipo, descricao) VALUES
      ((SELECT id FROM organizations LIMIT 1), 'PASTO-01', 'Setor Norte Pasto', 'pasto', 'Setor dedicado ao manejo de pastagens do norte da propriedade'),
      ((SELECT id FROM organizations LIMIT 1), 'CONF-01', 'Setor Confinamento Central', 'confinamento', 'Setor central de confinamento com capacidade para manejo intensivo'),
      ((SELECT id FROM organizations LIMIT 1), 'SEMI-01', 'Setor Semiconfinamento A', 'semiconfinamento', 'Primeiro setor de semiconfinamento da propriedade')
      ON CONFLICT (organization_id, codigo) DO NOTHING;
    `;

    const { error: sampleError } = await supabase.rpc('exec', { sql: sampleDataQuery });

    if (sampleError) {
      console.error('Sample data error:', sampleError);
    }

    // Add table comment
    const commentQuery = `
      COMMENT ON TABLE public.dim_setores IS 'Dimensão de setores organizacionais (não inclui área - específica para currais/módulos/pastos)';
    `;

    const { error: commentError } = await supabase.rpc('exec', { sql: commentQuery });

    if (commentError) {
      console.error('Comment error:', commentError);
    }

    // Verify table creation
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'dim_setores');

    if (checkError) {
      throw checkError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'dim_setores table created successfully',
      tableExists: tables && tables.length > 0,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      }
    });
  }
});