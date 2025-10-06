-- Create dim_dietas table for diet categorization
CREATE TABLE IF NOT EXISTS public.dim_dietas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('confinamento', 'semiconfinamento', 'pasto')),
  categoria VARCHAR(100),
  descricao TEXT,
  composicao JSONB,
  custo_kg DECIMAL(10,4),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create indexes for better performance
CREATE INDEX idx_dim_dietas_organization ON public.dim_dietas(organization_id);
CREATE INDEX idx_dim_dietas_tipo ON public.dim_dietas(tipo);
CREATE INDEX idx_dim_dietas_ativo ON public.dim_dietas(ativo);
CREATE INDEX idx_dim_dietas_codigo ON public.dim_dietas(codigo);

-- Add RLS policies
ALTER TABLE public.dim_dietas ENABLE ROW LEVEL SECURITY;

-- Policy for viewing dietas (users can only see their organization's data)
CREATE POLICY "Users can view their organization dietas" ON public.dim_dietas
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy for inserting dietas
CREATE POLICY "Users can insert dietas for their organization" ON public.dim_dietas
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy for updating dietas
CREATE POLICY "Users can update their organization dietas" ON public.dim_dietas
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

-- Policy for deleting dietas
CREATE POLICY "Users can delete their organization dietas" ON public.dim_dietas
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Create table for stock control
CREATE TABLE IF NOT EXISTS public.estoque_produtos_pasto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dieta_id UUID NOT NULL REFERENCES dim_dietas(id) ON DELETE RESTRICT,
  data DATE NOT NULL,
  quantidade_fabricada DECIMAL(12,3),
  quantidade_estoque DECIMAL(12,3),
  quantidade_distribuida DECIMAL(12,3),
  lote_fabricacao VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_estoque_produtos_pasto_organization ON public.estoque_produtos_pasto(organization_id);
CREATE INDEX idx_estoque_produtos_pasto_dieta ON public.estoque_produtos_pasto(dieta_id);
CREATE INDEX idx_estoque_produtos_pasto_data ON public.estoque_produtos_pasto(data);

-- Add RLS policies for estoque_produtos_pasto
ALTER TABLE public.estoque_produtos_pasto ENABLE ROW LEVEL SECURITY;

-- Policy for viewing stock
CREATE POLICY "Users can view their organization stock" ON public.estoque_produtos_pasto
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy for inserting stock
CREATE POLICY "Users can insert stock for their organization" ON public.estoque_produtos_pasto
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy for updating stock
CREATE POLICY "Users can update their organization stock" ON public.estoque_produtos_pasto
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

-- Policy for deleting stock
CREATE POLICY "Users can delete their organization stock" ON public.estoque_produtos_pasto
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Add comment to tables
COMMENT ON TABLE public.dim_dietas IS 'Dimensão de dietas para catalogar tipos de alimentos: confinamento, semiconfinamento e pasto';
COMMENT ON TABLE public.estoque_produtos_pasto IS 'Controle de estoque de produtos para pasto, incluindo proteinados fabricados no confinamento';