-- Expand Dead Letter Queue for Enhanced Retry Logic
-- This migration enhances the existing etl_dead_letter_queue table to support
-- the full RetryLogicService functionality with error classification and retry attempts

-- Create enum for error types
CREATE TYPE error_type AS ENUM (
  'transient',     -- Network issues, temporary database unavailability
  'permanent',     -- Schema errors, validation failures, malformed data
  'rate_limited',  -- API rate limiting
  'resource'       -- Memory, disk space, connection pool exhaustion
);

-- Create composite type for retry attempts
CREATE TYPE retry_attempt AS (
  attempt_number INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  error_type error_type,
  error_message TEXT,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Backup existing data
CREATE TEMP TABLE dlq_backup AS SELECT * FROM etl_dead_letter_queue;

-- Drop existing table and recreate with enhanced structure
DROP TABLE IF EXISTS etl_dead_letter_queue CASCADE;

CREATE TABLE etl_dead_letter_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('etl_file', 'etl_run')),
  entity_id TEXT NOT NULL,

  -- Error information
  original_error TEXT NOT NULL,
  error_type error_type NOT NULL DEFAULT 'transient',

  -- Retry tracking
  retry_attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_retries INTEGER NOT NULL DEFAULT 0,
  first_failure_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_retry_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  max_retries_exceeded BOOLEAN NOT NULL DEFAULT TRUE,

  -- Resolution tracking
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT,

  -- Metadata and audit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_dlq_file FOREIGN KEY (entity_id) REFERENCES etl_file(id) ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT fk_dlq_run FOREIGN KEY (entity_id) REFERENCES etl_run(id) ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX idx_dlq_organization_id ON etl_dead_letter_queue(organization_id);
CREATE INDEX idx_dlq_entity_type_id ON etl_dead_letter_queue(entity_type, entity_id);
CREATE INDEX idx_dlq_error_type ON etl_dead_letter_queue(error_type);
CREATE INDEX idx_dlq_resolved ON etl_dead_letter_queue(resolved);
CREATE INDEX idx_dlq_first_failure ON etl_dead_letter_queue(first_failure_at);
CREATE INDEX idx_dlq_last_retry ON etl_dead_letter_queue(last_retry_at);
CREATE INDEX idx_dlq_created_at ON etl_dead_letter_queue(created_at);
CREATE INDEX idx_dlq_unresolved ON etl_dead_letter_queue(organization_id, resolved) WHERE resolved = false;

-- Add triggers for updated_at
CREATE TRIGGER update_dlq_updated_at
  BEFORE UPDATE ON etl_dead_letter_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE etl_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for organization isolation
CREATE POLICY dlq_org_isolation ON etl_dead_letter_queue
  FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Migrate old data if any exists
INSERT INTO etl_dead_letter_queue (
  organization_id,
  entity_type,
  entity_id,
  original_error,
  error_type,
  total_retries,
  first_failure_at,
  last_retry_at,
  max_retries_exceeded,
  resolved,
  metadata,
  created_at,
  updated_at
)
SELECT
  organization_id,
  CASE
    WHEN run_id IS NOT NULL THEN 'etl_run'
    ELSE 'etl_file'
  END as entity_type,
  COALESCE(run_id, file_id) as entity_id,
  error_message,
  'transient'::error_type, -- Default classification for migrated data
  0, -- Will be updated based on actual retry history
  created_at,
  updated_at,
  max_retries_exceeded,
  false, -- Mark as unresolved initially
  COALESCE(error_details, '{}'::jsonb),
  created_at,
  updated_at
FROM dlq_backup
WHERE dlq_backup.organization_id IS NOT NULL;

-- Clean up
DROP TABLE dlq_backup;

-- Add helpful functions for retry logic
CREATE OR REPLACE FUNCTION calculate_next_retry_delay(
  attempt_number INTEGER,
  base_delay_ms INTEGER DEFAULT 1000,
  max_delay_ms INTEGER DEFAULT 300000,
  backoff_multiplier NUMERIC DEFAULT 2,
  jitter_enabled BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
  delay_ms INTEGER;
  jitter INTEGER;
BEGIN
  -- Calculate exponential backoff
  delay_ms := base_delay_ms * (backoff_multiplier ^ (attempt_number - 1));

  -- Cap at maximum delay
  delay_ms := LEAST(delay_ms, max_delay_ms);

  -- Add jitter if enabled (±25% of delay)
  IF jitter_enabled THEN
    jitter := (delay_ms * 0.25 * (random() * 2 - 1))::INTEGER;
    delay_ms := GREATEST(base_delay_ms, delay_ms + jitter);
  END IF;

  RETURN delay_ms;
END;
$$ LANGUAGE plpgsql;

-- Function to classify error messages
CREATE OR REPLACE FUNCTION classify_error_type(error_message TEXT) RETURNS error_type AS $$
DECLARE
  msg TEXT;
BEGIN
  msg := lower(error_message);

  -- Network and connection issues (transient)
  IF msg ~ '(network|timeout|connection|econnreset|enotfound|temporary)' THEN
    RETURN 'transient';
  END IF;

  -- Rate limiting (transient)
  IF msg ~ '(rate limit|too many requests|429)' THEN
    RETURN 'rate_limited';
  END IF;

  -- Resource exhaustion (usually transient)
  IF msg ~ '(memory|disk space|pool exhausted|resource|lock timeout)' THEN
    RETURN 'resource';
  END IF;

  -- Schema, validation, and data errors (permanent)
  IF msg ~ '(validation|schema|constraint|foreign key|parse|invalid data|malformed)' THEN
    RETURN 'permanent';
  END IF;

  -- Default to transient for unknown errors
  RETURN 'transient';
END;
$$ LANGUAGE plpgsql;

-- Function to check if error type is retryable
CREATE OR REPLACE FUNCTION is_error_retryable(err_type error_type) RETURNS BOOLEAN AS $$
BEGIN
  RETURN err_type IN ('transient', 'rate_limited', 'resource');
END;
$$ LANGUAGE plpgsql;

-- Function to get retry statistics
CREATE OR REPLACE FUNCTION get_retry_statistics(org_id TEXT)
RETURNS TABLE (
  active_retries BIGINT,
  dead_letter_queue_size BIGINT,
  success_rate NUMERIC,
  average_retries NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM etl_run
       WHERE organization_id = org_id AND retry_count > 0) as active_count,
      (SELECT COUNT(*) FROM etl_dead_letter_queue
       WHERE organization_id = org_id AND resolved = false) as dlq_count,
      (SELECT AVG(retry_count) FROM etl_run
       WHERE organization_id = org_id AND retry_count > 0) as avg_retries
  )
  SELECT
    s.active_count,
    s.dlq_count,
    CASE
      WHEN s.active_count + s.dlq_count > 0
      THEN (s.active_count::NUMERIC / (s.active_count + s.dlq_count) * 100)
      ELSE 100.0
    END,
    COALESCE(s.avg_retries, 0.0)
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE etl_dead_letter_queue IS 'Enhanced dead letter queue for failed ETL operations with retry tracking';
COMMENT ON COLUMN etl_dead_letter_queue.entity_type IS 'Type of entity: etl_file or etl_run';
COMMENT ON COLUMN etl_dead_letter_queue.entity_id IS 'ID of the failed entity (file or run)';
COMMENT ON COLUMN etl_dead_letter_queue.error_type IS 'Classification of error for retry decisions';
COMMENT ON COLUMN etl_dead_letter_queue.retry_attempts IS 'JSON array of all retry attempts with timing and errors';
COMMENT ON COLUMN etl_dead_letter_queue.total_retries IS 'Total number of retry attempts made';
COMMENT ON COLUMN etl_dead_letter_queue.resolved IS 'Whether the issue has been manually resolved';

COMMENT ON FUNCTION calculate_next_retry_delay IS 'Calculate next retry delay with exponential backoff and jitter';
COMMENT ON FUNCTION classify_error_type IS 'Automatically classify error messages by type';
COMMENT ON FUNCTION is_error_retryable IS 'Check if an error type should be retried';
COMMENT ON FUNCTION get_retry_statistics IS 'Get retry and dead letter queue statistics for monitoring';