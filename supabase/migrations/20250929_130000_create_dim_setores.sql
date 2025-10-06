-- Create dim_setores table for sector management (used for confinamento, semiconfinamento, and pasto)
CREATE TABLE IF NOT EXISTS public.dim_setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('confinamento', 'semiconfinamento', 'pasto')),
  descricao TEXT,
  responsavel VARCHAR(255),
  localizacao_gps POINT,
  area_total_hectares DECIMAL(12,3),
  observacoes TEXT,
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
CREATE INDEX IF NOT EXISTS idx_dim_setores_nome ON public.dim_setores(nome);

-- Add RLS policies
ALTER TABLE public.dim_setores ENABLE ROW LEVEL SECURITY;

-- Policy for viewing setores (users can only see their organization's data)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can view their organization setores') THEN
    CREATE POLICY "Users can view their organization setores" ON public.dim_setores
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

-- Policy for inserting setores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can insert setores for their organization') THEN
    CREATE POLICY "Users can insert setores for their organization" ON public.dim_setores
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

-- Policy for updating setores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can update their organization setores') THEN
    CREATE POLICY "Users can update their organization setores" ON public.dim_setores
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

-- Policy for deleting setores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_setores' AND policyname = 'Users can delete their organization setores') THEN
    CREATE POLICY "Users can delete their organization setores" ON public.dim_setores
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

-- Update dim_pastos table to include setor_id reference
ALTER TABLE public.dim_pastos
ADD COLUMN IF NOT EXISTS setor_id UUID REFERENCES dim_setores(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_dim_pastos_setor ON public.dim_pastos(setor_id);

-- Insert some sample setores for testing (these would be organization-specific in real implementation)
-- This is just for development/testing purposes
INSERT INTO public.dim_setores (organization_id, codigo, nome, tipo, descricao, area_total_hectares) VALUES
((SELECT id FROM organizations LIMIT 1), 'SET-PASTO-01', 'Setor Norte Pasto', 'pasto', 'Setor principal de pastagem ao norte da propriedade', 500.00),
((SELECT id FROM organizations LIMIT 1), 'SET-PASTO-02', 'Setor Sul Pasto', 'pasto', 'Área de pastagem na região sul', 320.50),
((SELECT id FROM organizations LIMIT 1), 'SET-PASTO-03', 'Setor Leste Pasto', 'pasto', 'Pastagem próxima ao córrego', 275.75),
((SELECT id FROM organizations LIMIT 1), 'SET-CONF-01', 'Setor Confinamento Central', 'confinamento', 'Área principal de confinamento', 45.00),
((SELECT id FROM organizations LIMIT 1), 'SET-SEMI-01', 'Setor Semiconfinamento A', 'semiconfinamento', 'Área de semiconfinamento próxima aos currais', 120.00)
ON CONFLICT (organization_id, codigo) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.dim_setores IS 'Dimensão de setores para organização de áreas por tipo: confinamento, semiconfinamento e pasto';