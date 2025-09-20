-- Create staging_03_desvio_distribuicao table
-- Execute this script in Supabase SQL Editor

-- First ensure organizations table exists
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Create the main table
CREATE TABLE IF NOT EXISTS staging_03_desvio_distribuicao (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Multi-tenancy columns
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Business columns
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

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);
CREATE INDEX IF NOT EXISTS idx_staging_03_data ON staging_03_desvio_distribuicao(data);
CREATE INDEX IF NOT EXISTS idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);
CREATE INDEX IF NOT EXISTS idx_staging_03_status ON staging_03_desvio_distribuicao(status);
CREATE INDEX IF NOT EXISTS idx_staging_03_created_at ON staging_03_desvio_distribuicao(created_at DESC);

-- Enable Row Level Security
ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Policy for SELECT
DROP POLICY IF EXISTS "Users can view their organization's staging_03 data" ON staging_03_desvio_distribuicao;
CREATE POLICY "Users can view their organization's staging_03 data"
    ON staging_03_desvio_distribuicao
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Policy for INSERT
DROP POLICY IF EXISTS "Users can insert staging_03 data for their organization" ON staging_03_desvio_distribuicao;
CREATE POLICY "Users can insert staging_03 data for their organization"
    ON staging_03_desvio_distribuicao
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Policy for UPDATE
DROP POLICY IF EXISTS "Users can update their organization's staging_03 data" ON staging_03_desvio_distribuicao;
CREATE POLICY "Users can update their organization's staging_03 data"
    ON staging_03_desvio_distribuicao
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Policy for DELETE
DROP POLICY IF EXISTS "Users can delete their organization's staging_03 data" ON staging_03_desvio_distribuicao;
CREATE POLICY "Users can delete their organization's staging_03 data"
    ON staging_03_desvio_distribuicao
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
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

-- Add table comments for documentation
COMMENT ON TABLE staging_03_desvio_distribuicao IS 'Staging table for desvio de distribuição data from CSV pipeline 03';

-- Verify table was created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'staging_03_desvio_distribuicao') as column_count
FROM information_schema.tables
WHERE table_name = 'staging_03_desvio_distribuicao';