-- Migration: Create staging tables for CSV processing
-- Description: Tables to temporarily hold CSV data before validation and processing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staging table for raw CSV data (before any processing)
CREATE TABLE staging_csv_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL, -- Reference to etl_file
    row_number INTEGER NOT NULL,
    raw_data JSONB NOT NULL, -- Raw CSV row data as JSON
    headers JSONB, -- Original headers from CSV
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT staging_csv_raw_org_file_row UNIQUE (organization_id, file_id, row_number)
);

-- Staging table for validated and mapped data
CREATE TABLE staging_csv_processed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL,
    row_number INTEGER NOT NULL,
    original_data JSONB NOT NULL, -- Original CSV data
    mapped_data JSONB NOT NULL, -- Data after header mapping
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'warning')),
    validation_errors JSONB DEFAULT '[]', -- Array of validation errors
    validation_warnings JSONB DEFAULT '[]', -- Array of validation warnings
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Performance indexes
    CONSTRAINT staging_csv_processed_org_file_row UNIQUE (organization_id, file_id, row_number)
);

-- Staging table for final livestock data (ready for production)
CREATE TABLE staging_livestock_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    file_id UUID NOT NULL,
    source_row_number INTEGER NOT NULL,

    -- Core livestock fields (mapped and validated)
    animal_id TEXT,
    rfid_tag TEXT,
    ear_tag TEXT,
    breed TEXT,
    gender TEXT,
    birth_date DATE,
    weight_kg DECIMAL(8,2),
    location TEXT,
    status TEXT,
    owner_name TEXT,

    -- Metadata
    data_quality_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
    confidence_level TEXT DEFAULT 'high' CHECK (confidence_level IN ('low', 'medium', 'high')),
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT staging_livestock_org_file_row UNIQUE (organization_id, file_id, source_row_number)
);

-- Create indexes for better query performance
CREATE INDEX idx_staging_csv_raw_org_file ON staging_csv_raw (organization_id, file_id);
CREATE INDEX idx_staging_csv_raw_created ON staging_csv_raw (created_at);

CREATE INDEX idx_staging_csv_processed_org_file ON staging_csv_processed (organization_id, file_id);
CREATE INDEX idx_staging_csv_processed_status ON staging_csv_processed (validation_status);
CREATE INDEX idx_staging_csv_processed_date ON staging_csv_processed (processed_at);

CREATE INDEX idx_staging_livestock_org_file ON staging_livestock_data (organization_id, file_id);
CREATE INDEX idx_staging_livestock_quality ON staging_livestock_data (data_quality_score);
CREATE INDEX idx_staging_livestock_confidence ON staging_livestock_data (confidence_level);

-- Enable RLS (Row Level Security)
ALTER TABLE staging_csv_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_csv_processed ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_livestock_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staging_csv_raw
CREATE POLICY "Users can insert their organization's staging raw data"
    ON staging_csv_raw FOR INSERT
    WITH CHECK (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can select their organization's staging raw data"
    ON staging_csv_raw FOR SELECT
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can update their organization's staging raw data"
    ON staging_csv_raw FOR UPDATE
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their organization's staging raw data"
    ON staging_csv_raw FOR DELETE
    USING (organization_id = auth.uid()::uuid);

-- RLS Policies for staging_csv_processed
CREATE POLICY "Users can insert their organization's staging processed data"
    ON staging_csv_processed FOR INSERT
    WITH CHECK (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can select their organization's staging processed data"
    ON staging_csv_processed FOR SELECT
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can update their organization's staging processed data"
    ON staging_csv_processed FOR UPDATE
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their organization's staging processed data"
    ON staging_csv_processed FOR DELETE
    USING (organization_id = auth.uid()::uuid);

-- RLS Policies for staging_livestock_data
CREATE POLICY "Users can insert their organization's staging livestock data"
    ON staging_livestock_data FOR INSERT
    WITH CHECK (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can select their organization's staging livestock data"
    ON staging_livestock_data FOR SELECT
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can update their organization's staging livestock data"
    ON staging_livestock_data FOR UPDATE
    USING (organization_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their organization's staging livestock data"
    ON staging_livestock_data FOR DELETE
    USING (organization_id = auth.uid()::uuid);

-- Function to cleanup staging data for a specific file
CREATE OR REPLACE FUNCTION cleanup_staging_data(p_file_id UUID, p_organization_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from all staging tables for the specified file
    DELETE FROM staging_csv_raw
    WHERE file_id = p_file_id AND organization_id = p_organization_id;

    DELETE FROM staging_csv_processed
    WHERE file_id = p_file_id AND organization_id = p_organization_id;

    DELETE FROM staging_livestock_data
    WHERE file_id = p_file_id AND organization_id = p_organization_id;

    RAISE NOTICE 'Staging data cleaned for file_id: % organization_id: %', p_file_id, p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get staging statistics
CREATE OR REPLACE FUNCTION get_staging_statistics(p_file_id UUID, p_organization_id UUID)
RETURNS TABLE(
    raw_rows INTEGER,
    processed_rows INTEGER,
    valid_rows INTEGER,
    invalid_rows INTEGER,
    warning_rows INTEGER,
    livestock_rows INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM staging_csv_raw
         WHERE file_id = p_file_id AND organization_id = p_organization_id) as raw_rows,
        (SELECT COUNT(*)::INTEGER FROM staging_csv_processed
         WHERE file_id = p_file_id AND organization_id = p_organization_id) as processed_rows,
        (SELECT COUNT(*)::INTEGER FROM staging_csv_processed
         WHERE file_id = p_file_id AND organization_id = p_organization_id
         AND validation_status = 'valid') as valid_rows,
        (SELECT COUNT(*)::INTEGER FROM staging_csv_processed
         WHERE file_id = p_file_id AND organization_id = p_organization_id
         AND validation_status = 'invalid') as invalid_rows,
        (SELECT COUNT(*)::INTEGER FROM staging_csv_processed
         WHERE file_id = p_file_id AND organization_id = p_organization_id
         AND validation_status = 'warning') as warning_rows,
        (SELECT COUNT(*)::INTEGER FROM staging_livestock_data
         WHERE file_id = p_file_id AND organization_id = p_organization_id) as livestock_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON staging_csv_raw TO anon, authenticated;
GRANT ALL ON staging_csv_processed TO anon, authenticated;
GRANT ALL ON staging_livestock_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_staging_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_staging_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE staging_csv_raw IS 'Temporary storage for raw CSV data before any processing';
COMMENT ON TABLE staging_csv_processed IS 'Staging area for CSV data after header mapping and validation';
COMMENT ON TABLE staging_livestock_data IS 'Final staging area for validated livestock data ready for production';
COMMENT ON FUNCTION cleanup_staging_data IS 'Cleans all staging data for a specific file and organization';
COMMENT ON FUNCTION get_staging_statistics IS 'Returns processing statistics for staging data';