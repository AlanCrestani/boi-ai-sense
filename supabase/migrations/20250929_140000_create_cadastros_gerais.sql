-- Create dim_maquinarios table for machinery management
CREATE TABLE IF NOT EXISTS public.dim_maquinarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- Trator, Misturador, Carreta, etc.
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano_fabricacao INTEGER,
  numero_serie VARCHAR(100),
  placa VARCHAR(20),
  capacidade_operacional VARCHAR(100), -- Ex: 15m³, 500kg, etc.
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'manutencao', 'inativo')),
  data_aquisicao DATE,
  valor_aquisicao DECIMAL(12,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create dim_colaboradores table for employee management
CREATE TABLE IF NOT EXISTS public.dim_colaboradores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  data_nascimento DATE,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cargo VARCHAR(100) NOT NULL,
  setor_id UUID REFERENCES dim_setores(id) ON DELETE SET NULL,
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  salario DECIMAL(10,2),
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'afastado', 'demitido')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, codigo)
);

-- Create indexes for better performance
-- dim_maquinarios indexes
CREATE INDEX IF NOT EXISTS idx_dim_maquinarios_organization ON public.dim_maquinarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_maquinarios_tipo ON public.dim_maquinarios(tipo);
CREATE INDEX IF NOT EXISTS idx_dim_maquinarios_status ON public.dim_maquinarios(status);
CREATE INDEX IF NOT EXISTS idx_dim_maquinarios_ativo ON public.dim_maquinarios(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_maquinarios_codigo ON public.dim_maquinarios(codigo);

-- dim_colaboradores indexes
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_organization ON public.dim_colaboradores(organization_id);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_cargo ON public.dim_colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_setor ON public.dim_colaboradores(setor_id);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_status ON public.dim_colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_ativo ON public.dim_colaboradores(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_codigo ON public.dim_colaboradores(codigo);
CREATE INDEX IF NOT EXISTS idx_dim_colaboradores_cpf ON public.dim_colaboradores(cpf);

-- Add RLS policies for dim_maquinarios
ALTER TABLE public.dim_maquinarios ENABLE ROW LEVEL SECURITY;

-- Policies for dim_maquinarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_maquinarios' AND policyname = 'Users can view their organization machinery') THEN
    CREATE POLICY "Users can view their organization machinery" ON public.dim_maquinarios
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_maquinarios' AND policyname = 'Users can insert machinery for their organization') THEN
    CREATE POLICY "Users can insert machinery for their organization" ON public.dim_maquinarios
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_maquinarios' AND policyname = 'Users can update their organization machinery') THEN
    CREATE POLICY "Users can update their organization machinery" ON public.dim_maquinarios
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_maquinarios' AND policyname = 'Users can delete their organization machinery') THEN
    CREATE POLICY "Users can delete their organization machinery" ON public.dim_maquinarios
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

-- Add RLS policies for dim_colaboradores
ALTER TABLE public.dim_colaboradores ENABLE ROW LEVEL SECURITY;

-- Policies for dim_colaboradores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_colaboradores' AND policyname = 'Users can view their organization employees') THEN
    CREATE POLICY "Users can view their organization employees" ON public.dim_colaboradores
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_colaboradores' AND policyname = 'Users can insert employees for their organization') THEN
    CREATE POLICY "Users can insert employees for their organization" ON public.dim_colaboradores
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_colaboradores' AND policyname = 'Users can update their organization employees') THEN
    CREATE POLICY "Users can update their organization employees" ON public.dim_colaboradores
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_colaboradores' AND policyname = 'Users can delete their organization employees') THEN
    CREATE POLICY "Users can delete their organization employees" ON public.dim_colaboradores
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

-- Insert sample data for testing
INSERT INTO public.dim_maquinarios (organization_id, codigo, nome, tipo, marca, modelo, ano_fabricacao, capacidade_operacional, status) VALUES
((SELECT id FROM organizations LIMIT 1), 'MAQ-001', 'Trator John Deere 6110J', 'Trator', 'John Deere', '6110J', 2020, '110 CV', 'ativo'),
((SELECT id FROM organizations LIMIT 1), 'MAQ-002', 'Misturador Totalmix', 'Misturador', 'Totalmix', 'TM-15', 2019, '15 m³', 'ativo'),
((SELECT id FROM organizations LIMIT 1), 'MAQ-003', 'Carreta Distribuição', 'Carreta', 'Siltomac', 'CD-8000', 2021, '8000 kg', 'manutencao')
ON CONFLICT (organization_id, codigo) DO NOTHING;

-- Add comments to tables
COMMENT ON TABLE public.dim_maquinarios IS 'Dimensão de maquinários para controle de equipamentos';
COMMENT ON TABLE public.dim_colaboradores IS 'Dimensão de colaboradores para gestão de funcionários';