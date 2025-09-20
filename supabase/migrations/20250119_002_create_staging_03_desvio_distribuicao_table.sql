-- Create staging_03_desvio_distribuicao table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT staging_03_unique_record UNIQUE (organization_id, data, hora, curral, vagao)
);

-- Create indexes for better query performance
CREATE INDEX idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);
CREATE INDEX idx_staging_03_data ON staging_03_desvio_distribuicao(data);
CREATE INDEX idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);
CREATE INDEX idx_staging_03_status ON staging_03_desvio_distribuicao(status);
CREATE INDEX idx_staging_03_created_at ON staging_03_desvio_distribuicao(created_at DESC);

-- Enable Row Level Security
ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Policy for SELECT: Users can only see data from their organization
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

-- Policy for INSERT: Users can only insert data for their organization
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

-- Policy for UPDATE: Users can only update their organization's data
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

-- Policy for DELETE: Users can only delete their organization's data
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

CREATE TRIGGER update_staging_03_updated_at
    BEFORE UPDATE ON staging_03_desvio_distribuicao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE staging_03_desvio_distribuicao IS 'Staging table for desvio de distribuição data from CSV pipeline 03';
COMMENT ON COLUMN staging_03_desvio_distribuicao.organization_id IS 'Reference to the organization that owns this data';
COMMENT ON COLUMN staging_03_desvio_distribuicao.data IS 'Date of the distribution deviation';
COMMENT ON COLUMN staging_03_desvio_distribuicao.hora IS 'Time of the distribution';
COMMENT ON COLUMN staging_03_desvio_distribuicao.vagao IS 'Wagon identifier';
COMMENT ON COLUMN staging_03_desvio_distribuicao.curral IS 'Pen/Corral identifier';
COMMENT ON COLUMN staging_03_desvio_distribuicao.trato IS 'Feed/Treatment type';
COMMENT ON COLUMN staging_03_desvio_distribuicao.tratador IS 'Handler/Operator name';
COMMENT ON COLUMN staging_03_desvio_distribuicao.dieta IS 'Diet type';
COMMENT ON COLUMN staging_03_desvio_distribuicao.realizado_kg IS 'Actual weight delivered in kg';
COMMENT ON COLUMN staging_03_desvio_distribuicao.previsto_kg IS 'Predicted/Expected weight in kg';
COMMENT ON COLUMN staging_03_desvio_distribuicao.desvio_kg IS 'Deviation in kg (realizado - previsto)';
COMMENT ON COLUMN staging_03_desvio_distribuicao.desvio_pc IS 'Deviation percentage';
COMMENT ON COLUMN staging_03_desvio_distribuicao.status IS 'Processing status';
COMMENT ON COLUMN staging_03_desvio_distribuicao.merge IS 'Merge identifier for data consolidation';