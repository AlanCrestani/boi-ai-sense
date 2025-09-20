-- Create ETL State Machine Tables
-- This migration creates the necessary tables for the ETL state machine

-- Create enum for ETL states
CREATE TYPE etl_state AS ENUM (
  'uploaded',
  'parsing',
  'parsed',
  'validating',
  'validated',
  'awaiting_approval',
  'approved',
  'loading',
  'loaded',
  'failed',
  'cancelled'
);

-- Create enum for log levels
CREATE TYPE log_level AS ENUM ('info', 'warning', 'error', 'debug');

-- Create etl_file table
CREATE TABLE IF NOT EXISTS etl_file (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  checksum TEXT NOT NULL,
  current_state etl_state NOT NULL DEFAULT 'uploaded',
  state_history JSONB DEFAULT '[]'::jsonb,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  uploaded_by TEXT NOT NULL,
  parsed_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  loaded_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for etl_file
CREATE INDEX idx_etl_file_organization ON etl_file(organization_id);
CREATE INDEX idx_etl_file_checksum ON etl_file(checksum);
CREATE INDEX idx_etl_file_state ON etl_file(current_state);
CREATE INDEX idx_etl_file_uploaded_at ON etl_file(uploaded_at);
CREATE UNIQUE INDEX idx_etl_file_checksum_org ON etl_file(checksum, organization_id);

-- Create etl_run table
CREATE TABLE IF NOT EXISTS etl_run (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES etl_file(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  run_number INTEGER NOT NULL,
  current_state etl_state NOT NULL DEFAULT 'uploaded',
  state_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_by TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  records_total INTEGER,
  records_processed INTEGER,
  records_failed INTEGER,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for etl_run
CREATE INDEX idx_etl_run_file ON etl_run(file_id);
CREATE INDEX idx_etl_run_organization ON etl_run(organization_id);
CREATE INDEX idx_etl_run_state ON etl_run(current_state);
CREATE INDEX idx_etl_run_started_at ON etl_run(started_at);
CREATE INDEX idx_etl_run_processing ON etl_run(processing_started_at) WHERE processing_started_at IS NOT NULL;
CREATE INDEX idx_etl_run_retry ON etl_run(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE UNIQUE INDEX idx_etl_run_file_number ON etl_run(file_id, run_number);

-- Create etl_run_log table
CREATE TABLE IF NOT EXISTS etl_run_log (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES etl_run(id) ON DELETE CASCADE,
  file_id TEXT REFERENCES etl_file(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  level log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB,
  state etl_state,
  previous_state etl_state,
  user_id TEXT,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for etl_run_log
CREATE INDEX idx_etl_run_log_run ON etl_run_log(run_id);
CREATE INDEX idx_etl_run_log_file ON etl_run_log(file_id);
CREATE INDEX idx_etl_run_log_organization ON etl_run_log(organization_id);
CREATE INDEX idx_etl_run_log_timestamp ON etl_run_log(timestamp);
CREATE INDEX idx_etl_run_log_level ON etl_run_log(level);

-- Create dead letter queue table
CREATE TABLE IF NOT EXISTS etl_dead_letter_queue (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES etl_run(id) ON DELETE CASCADE,
  file_id TEXT REFERENCES etl_file(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  max_retries_exceeded BOOLEAN DEFAULT FALSE,
  marked_for_retry BOOLEAN DEFAULT FALSE,
  retry_after TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reprocessing log table
CREATE TABLE IF NOT EXISTS etl_reprocessing_log (
  id TEXT PRIMARY KEY,
  original_file_id TEXT REFERENCES etl_file(id) ON DELETE CASCADE,
  checksum TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  forced_by TEXT NOT NULL,
  reason TEXT,
  skip_validation BOOLEAN DEFAULT FALSE,
  new_file_id TEXT REFERENCES etl_file(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for dead letter queue
CREATE INDEX idx_dlq_run ON etl_dead_letter_queue(run_id);
CREATE INDEX idx_dlq_file ON etl_dead_letter_queue(file_id);
CREATE INDEX idx_dlq_organization ON etl_dead_letter_queue(organization_id);
CREATE INDEX idx_dlq_created ON etl_dead_letter_queue(created_at);
CREATE INDEX idx_dlq_retry ON etl_dead_letter_queue(marked_for_retry, retry_after);

-- Create indexes for reprocessing log
CREATE INDEX idx_reprocess_original_file ON etl_reprocessing_log(original_file_id);
CREATE INDEX idx_reprocess_checksum ON etl_reprocessing_log(checksum);
CREATE INDEX idx_reprocess_organization ON etl_reprocessing_log(organization_id);
CREATE INDEX idx_reprocess_forced_by ON etl_reprocessing_log(forced_by);
CREATE INDEX idx_reprocess_created ON etl_reprocessing_log(created_at);
CREATE INDEX idx_reprocess_completed ON etl_reprocessing_log(completed_at) WHERE completed_at IS NOT NULL;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_etl_file_updated_at
  BEFORE UPDATE ON etl_file
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_etl_run_updated_at
  BEFORE UPDATE ON etl_run
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlq_updated_at
  BEFORE UPDATE ON etl_dead_letter_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reprocess_updated_at
  BEFORE UPDATE ON etl_reprocessing_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get next run number
CREATE OR REPLACE FUNCTION get_next_run_number(p_file_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(run_number), 0) + 1
  INTO next_number
  FROM etl_run
  WHERE file_id = p_file_id;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to check state transition validity
CREATE OR REPLACE FUNCTION is_valid_state_transition(
  p_from_state etl_state,
  p_to_state etl_state
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid transitions
  RETURN CASE p_from_state
    WHEN 'uploaded' THEN p_to_state IN ('parsing', 'cancelled')
    WHEN 'parsing' THEN p_to_state IN ('parsed', 'failed')
    WHEN 'parsed' THEN p_to_state IN ('validating', 'cancelled')
    WHEN 'validating' THEN p_to_state IN ('validated', 'failed')
    WHEN 'validated' THEN p_to_state IN ('awaiting_approval', 'loading', 'cancelled')
    WHEN 'awaiting_approval' THEN p_to_state IN ('approved', 'cancelled')
    WHEN 'approved' THEN p_to_state IN ('loading', 'cancelled')
    WHEN 'loading' THEN p_to_state IN ('loaded', 'failed')
    WHEN 'loaded' THEN FALSE -- Terminal state
    WHEN 'failed' THEN p_to_state = 'parsing' -- Can retry
    WHEN 'cancelled' THEN p_to_state = 'parsing' -- Can retry
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies (adjust based on your auth setup)
ALTER TABLE etl_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_run_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_reprocessing_log ENABLE ROW LEVEL SECURITY;

-- Create policies for organization isolation
CREATE POLICY etl_file_org_isolation ON etl_file
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY etl_run_org_isolation ON etl_run
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY etl_run_log_org_isolation ON etl_run_log
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY dlq_org_isolation ON etl_dead_letter_queue
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY reprocess_org_isolation ON etl_reprocessing_log
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Add comments for documentation
COMMENT ON TABLE etl_file IS 'Tracks ETL files and their processing state';
COMMENT ON TABLE etl_run IS 'Tracks individual ETL processing runs for each file';
COMMENT ON TABLE etl_run_log IS 'Audit log for all ETL processing events';
COMMENT ON TABLE etl_dead_letter_queue IS 'Stores failed runs that exceeded retry limits';
COMMENT ON TABLE etl_reprocessing_log IS 'Tracks forced reprocessing of duplicate files';

COMMENT ON COLUMN etl_file.checksum IS 'SHA-256 hash of file content for duplicate detection';
COMMENT ON COLUMN etl_file.version IS 'Optimistic locking version to prevent concurrent modifications';
COMMENT ON COLUMN etl_run.retry_count IS 'Number of retry attempts for this run';
COMMENT ON COLUMN etl_run.next_retry_at IS 'Scheduled time for next retry attempt';