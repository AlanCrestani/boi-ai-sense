-- Create dim_pastos table for pasture management
CREATE TABLE IF NOT EXISTS public.dim_pastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  area_hectares DECIMAL(10,2),
  localizacao VARCHAR(255) NOT NULL,
  quantidade_cocho_metros DECIMAL(10,2),
  tipo_solo VARCHAR(100),
  tipo_pasto VARCHAR(100),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dim_pastos_organization ON public.dim_pastos(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_pastos_ativo ON public.dim_pastos(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_pastos_codigo ON public.dim_pastos(codigo);
CREATE INDEX IF NOT EXISTS idx_dim_pastos_nome ON public.dim_pastos(nome);

-- Add RLS policies
ALTER TABLE public.dim_pastos ENABLE ROW LEVEL SECURITY;

-- Policy for viewing pastos (users can only see their organization's data)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_pastos' AND policyname = 'Users can view their organization pastos') THEN
    CREATE POLICY "Users can view their organization pastos" ON public.dim_pastos
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

-- Policy for inserting pastos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_pastos' AND policyname = 'Users can insert pastos for their organization') THEN
    CREATE POLICY "Users can insert pastos for their organization" ON public.dim_pastos
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

-- Policy for updating pastos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_pastos' AND policyname = 'Users can update their organization pastos') THEN
    CREATE POLICY "Users can update their organization pastos" ON public.dim_pastos
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

-- Policy for deleting pastos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_pastos' AND policyname = 'Users can delete their organization pastos') THEN
    CREATE POLICY "Users can delete their organization pastos" ON public.dim_pastos
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

-- Create table for lotes
CREATE TABLE IF NOT EXISTS public.dim_lotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(100) NOT NULL,
  pasto_id UUID REFERENCES dim_pastos(id) ON DELETE SET NULL,
  quantidade_animais INTEGER,
  data_entrada DATE,
  peso_medio_entrada DECIMAL(8,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create indexes for dim_lotes
CREATE INDEX IF NOT EXISTS idx_dim_lotes_organization ON public.dim_lotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_lotes_pasto ON public.dim_lotes(pasto_id);
CREATE INDEX IF NOT EXISTS idx_dim_lotes_ativo ON public.dim_lotes(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_lotes_codigo ON public.dim_lotes(codigo);
CREATE INDEX IF NOT EXISTS idx_dim_lotes_data_entrada ON public.dim_lotes(data_entrada);

-- Add RLS policies for dim_lotes
ALTER TABLE public.dim_lotes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing lotes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_lotes' AND policyname = 'Users can view their organization lotes') THEN
    CREATE POLICY "Users can view their organization lotes" ON public.dim_lotes
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

-- Policy for inserting lotes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_lotes' AND policyname = 'Users can insert lotes for their organization') THEN
    CREATE POLICY "Users can insert lotes for their organization" ON public.dim_lotes
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

-- Policy for updating lotes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_lotes' AND policyname = 'Users can update their organization lotes') THEN
    CREATE POLICY "Users can update their organization lotes" ON public.dim_lotes
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

-- Policy for deleting lotes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_lotes' AND policyname = 'Users can delete their organization lotes') THEN
    CREATE POLICY "Users can delete their organization lotes" ON public.dim_lotes
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

-- Add comments to tables
COMMENT ON TABLE public.dim_pastos IS 'Dimensão de pastos para controle de áreas de pastagem';
COMMENT ON TABLE public.dim_lotes IS 'Dimensão de lotes de animais em pastagem';