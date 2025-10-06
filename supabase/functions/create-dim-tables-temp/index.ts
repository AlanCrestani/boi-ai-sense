import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req: Request) => {
  try {
    // Get database credentials from environment
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');

    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not configured');
    }

    const migrationSQL = `
-- Create dim_fornecedores (Suppliers dimension table)
CREATE TABLE IF NOT EXISTS public.dim_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    telefone VARCHAR(20),
    email VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dim_fornecedores_organization_nome_unique UNIQUE (organization_id, nome)
);

CREATE TABLE IF NOT EXISTS public.dim_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    fornecedor_id UUID REFERENCES public.dim_fornecedores(id) ON DELETE SET NULL,
    unidade_medida VARCHAR(20) DEFAULT 'kg',
    tipo VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dim_ingredientes_organization_nome_unique UNIQUE (organization_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_organization ON public.dim_fornecedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_ativo ON public.dim_fornecedores(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_fornecedores_nome ON public.dim_fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_organization ON public.dim_ingredientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_fornecedor ON public.dim_ingredientes(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_ativo ON public.dim_ingredientes(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_ingredientes_nome ON public.dim_ingredientes(nome);

ALTER TABLE public.dim_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_ingredientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view fornecedores from their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can view fornecedores from their organization"
    ON public.dim_fornecedores FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can insert fornecedores in their organization"
    ON public.dim_fornecedores FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can update fornecedores in their organization"
    ON public.dim_fornecedores FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete fornecedores in their organization" ON public.dim_fornecedores;
CREATE POLICY "Users can delete fornecedores in their organization"
    ON public.dim_fornecedores FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view ingredientes from their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can view ingredientes from their organization"
    ON public.dim_ingredientes FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can insert ingredientes in their organization"
    ON public.dim_ingredientes FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can update ingredientes in their organization"
    ON public.dim_ingredientes FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete ingredientes in their organization" ON public.dim_ingredientes;
CREATE POLICY "Users can delete ingredientes in their organization"
    ON public.dim_ingredientes FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dim_fornecedores_updated_at ON public.dim_fornecedores;
CREATE TRIGGER update_dim_fornecedores_updated_at
    BEFORE UPDATE ON public.dim_fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dim_ingredientes_updated_at ON public.dim_ingredientes;
CREATE TRIGGER update_dim_ingredientes_updated_at
    BEFORE UPDATE ON public.dim_ingredientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    // Execute SQL using fetch to internal postgres connection
    const response = await fetch(dbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sql' },
      body: migrationSQL,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Database error: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabelas dim_fornecedores e dim_ingredientes criadas com sucesso!'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});