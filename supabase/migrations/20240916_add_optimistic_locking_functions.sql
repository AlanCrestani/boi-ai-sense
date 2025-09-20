-- Add Optimistic Locking Support Functions
-- This migration adds database functions to support optimistic locking and concurrency control

-- Add locking columns to existing tables
ALTER TABLE etl_file ADD COLUMN IF NOT EXISTS locked_by TEXT;
ALTER TABLE etl_file ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE etl_file ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE etl_run ADD COLUMN IF NOT EXISTS locked_by TEXT;
ALTER TABLE etl_run ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE etl_run ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for lock management
CREATE INDEX IF NOT EXISTS idx_etl_file_locks ON etl_file(locked_by, lock_expires_at) WHERE locked_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_etl_run_locks ON etl_run(locked_by, lock_expires_at) WHERE locked_by IS NOT NULL;

-- Function to update multiple records with optimistic locking
CREATE OR REPLACE FUNCTION update_multiple_with_lock(
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  update_item JSONB;
  update_record RECORD;
  current_version INTEGER;
  result_array JSONB := '[]'::jsonb;
  temp_result JSONB;
BEGIN
  -- Start transaction (function is already in a transaction context)

  FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    -- Extract update parameters
    SELECT
      update_item->>'table_name' as table_name,
      update_item->>'record_id' as record_id,
      update_item->>'update_data' as update_data,
      (update_item->>'expected_version')::INTEGER as expected_version
    INTO update_record;

    -- Check current version
    EXECUTE format('SELECT version FROM %I WHERE id = $1', update_record.table_name)
    INTO current_version
    USING update_record.record_id;

    -- Verify version matches expectation
    IF current_version IS NULL THEN
      RAISE EXCEPTION 'Record not found: %', update_record.record_id;
    END IF;

    IF update_record.expected_version IS NOT NULL AND current_version != update_record.expected_version THEN
      RAISE EXCEPTION 'version_conflict: Expected version % but found %',
        update_record.expected_version, current_version;
    END IF;

    -- Perform the update with version increment
    EXECUTE format(
      'UPDATE %I SET %s WHERE id = $1 AND version = $2 RETURNING to_jsonb(%I.*)',
      update_record.table_name,
      string_agg(
        format('%I = %s', key,
          CASE
            WHEN jsonb_typeof(value) = 'string' THEN quote_literal(value #>> '{}')
            WHEN jsonb_typeof(value) = 'number' THEN value #>> '{}'
            WHEN jsonb_typeof(value) = 'boolean' THEN value #>> '{}'
            WHEN jsonb_typeof(value) = 'null' THEN 'NULL'
            ELSE quote_literal(value #>> '{}')
          END
        ), ', '
      ),
      update_record.table_name
    )
    INTO temp_result
    USING update_record.record_id, current_version
    FROM jsonb_each(update_record.update_data::jsonb) AS t(key, value);

    -- Check if update was successful
    IF temp_result IS NULL THEN
      RAISE EXCEPTION 'version_conflict: Update failed for record %', update_record.record_id;
    END IF;

    -- Add to result array
    result_array := result_array || temp_result;
  END LOOP;

  RETURN result_array;
END;
$$ LANGUAGE plpgsql;

-- Function to get locking statistics
CREATE OR REPLACE FUNCTION get_locking_stats(p_table_name TEXT)
RETURNS JSONB AS $$
DECLARE
  total_count INTEGER;
  locked_count INTEGER;
  expired_count INTEGER;
  avg_duration INTERVAL;
  result JSONB;
BEGIN
  -- Get total record count
  EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name)
  INTO total_count;

  -- Get locked record count
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE locked_by IS NOT NULL', p_table_name)
  INTO locked_count;

  -- Get expired lock count
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE locked_by IS NOT NULL AND lock_expires_at < NOW()', p_table_name)
  INTO expired_count;

  -- Get average lock duration for completed locks
  EXECUTE format(
    'SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - locked_at))) FROM %I WHERE locked_at IS NOT NULL',
    p_table_name
  )
  INTO avg_duration;

  -- Build result JSON
  SELECT jsonb_build_object(
    'totalRecords', total_count,
    'lockedRecords', locked_count,
    'expiredLocks', expired_count,
    'averageLockDuration', COALESCE(EXTRACT(EPOCH FROM avg_duration), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean expired locks from etl_file
  UPDATE etl_file
  SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL, updated_at = NOW()
  WHERE locked_by IS NOT NULL AND lock_expires_at < NOW();

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;

  -- Clean expired locks from etl_run
  UPDATE etl_run
  SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL, updated_at = NOW()
  WHERE locked_by IS NOT NULL AND lock_expires_at < NOW();

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleaned_count := cleaned_count + temp_count;

  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to safely update a record with version checking
CREATE OR REPLACE FUNCTION safe_update_with_version(
  p_table_name TEXT,
  p_record_id TEXT,
  p_updates JSONB,
  p_expected_version INTEGER
) RETURNS JSONB AS $$
DECLARE
  current_version INTEGER;
  result JSONB;
  update_sql TEXT;
  set_clause TEXT;
  key TEXT;
  value JSONB;
BEGIN
  -- Get current version
  EXECUTE format('SELECT version FROM %I WHERE id = $1', p_table_name)
  INTO current_version
  USING p_record_id;

  -- Check if record exists
  IF current_version IS NULL THEN
    RAISE EXCEPTION 'Record not found: %', p_record_id;
  END IF;

  -- Check version conflict
  IF p_expected_version IS NOT NULL AND current_version != p_expected_version THEN
    RAISE EXCEPTION 'Version conflict: expected % but found %', p_expected_version, current_version;
  END IF;

  -- Build SET clause
  SELECT string_agg(
    format('%I = %s', key,
      CASE
        WHEN jsonb_typeof(value) = 'string' THEN quote_literal(value #>> '{}')
        WHEN jsonb_typeof(value) = 'number' THEN value #>> '{}'
        WHEN jsonb_typeof(value) = 'boolean' THEN value #>> '{}'
        WHEN jsonb_typeof(value) = 'null' THEN 'NULL'
        ELSE quote_literal(value #>> '{}')
      END
    ), ', '
  )
  INTO set_clause
  FROM jsonb_each(p_updates || jsonb_build_object('version', current_version + 1, 'updated_at', NOW())) AS t(key, value);

  -- Execute update
  update_sql := format(
    'UPDATE %I SET %s WHERE id = $1 AND version = $2 RETURNING to_jsonb(%I.*)',
    p_table_name, set_clause, p_table_name
  );

  EXECUTE update_sql
  INTO result
  USING p_record_id, current_version;

  -- Check if update was successful
  IF result IS NULL THEN
    RAISE EXCEPTION 'Update failed - possible version conflict';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired locks (if pg_cron is available)
-- This is optional and will only work if pg_cron extension is installed
DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Try to create a cron job
    BEGIN
      PERFORM cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');
      RAISE NOTICE 'Scheduled cleanup job created successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create scheduled cleanup job: %', SQLERRM;
    END;
  ELSE
    -- pg_cron is not available, skip this
    RAISE NOTICE 'pg_cron extension not available, skipping scheduled cleanup job';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION update_multiple_with_lock(JSONB) IS 'Updates multiple records with optimistic locking in a single transaction';
COMMENT ON FUNCTION get_locking_stats(TEXT) IS 'Returns statistics about record locking for a given table';
COMMENT ON FUNCTION cleanup_expired_locks() IS 'Cleans up expired locks from all ETL tables';
COMMENT ON FUNCTION safe_update_with_version(TEXT, TEXT, JSONB, INTEGER) IS 'Safely updates a record with version conflict detection';

-- Create a view for monitoring locks
CREATE OR REPLACE VIEW etl_active_locks AS
SELECT
  'etl_file' as table_name,
  id,
  locked_by,
  locked_at,
  lock_expires_at,
  (lock_expires_at < NOW()) as is_expired,
  EXTRACT(EPOCH FROM (NOW() - locked_at)) as lock_duration_seconds
FROM etl_file
WHERE locked_by IS NOT NULL

UNION ALL

SELECT
  'etl_run' as table_name,
  id,
  locked_by,
  locked_at,
  lock_expires_at,
  (lock_expires_at < NOW()) as is_expired,
  EXTRACT(EPOCH FROM (NOW() - locked_at)) as lock_duration_seconds
FROM etl_run
WHERE locked_by IS NOT NULL

ORDER BY locked_at DESC;

COMMENT ON VIEW etl_active_locks IS 'Shows all currently active locks across ETL tables for monitoring';