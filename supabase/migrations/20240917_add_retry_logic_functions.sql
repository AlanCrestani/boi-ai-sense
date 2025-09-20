-- Add Retry Logic Support Functions
-- This migration adds database functions to support retry logic and dead letter queue management

-- Function to get retry statistics
CREATE OR REPLACE FUNCTION get_retry_stats(p_organization_id TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  total_failed INTEGER;
  retry_ready INTEGER;
  dlq_entries INTEGER;
  avg_retry_count NUMERIC;
  retry_success_rate NUMERIC;
  total_retries INTEGER;
  successful_retries INTEGER;
  result JSONB;
BEGIN
  -- Get total failed runs
  SELECT COUNT(*)
  INTO total_failed
  FROM etl_run
  WHERE current_state = 'failed'
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);

  -- Get retry-ready runs (failed runs with next_retry_at <= now)
  SELECT COUNT(*)
  INTO retry_ready
  FROM etl_run
  WHERE current_state = 'failed'
    AND next_retry_at IS NOT NULL
    AND next_retry_at <= NOW()
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);

  -- Get dead letter queue entries
  SELECT COUNT(*)
  INTO dlq_entries
  FROM etl_dead_letter_queue
  WHERE (p_organization_id IS NULL OR organization_id = p_organization_id);

  -- Get average retry count for failed runs
  SELECT AVG(retry_count)
  INTO avg_retry_count
  FROM etl_run
  WHERE current_state = 'failed'
    AND retry_count > 0
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);

  -- Calculate retry success rate
  -- (Total runs that succeeded after retries / Total runs that had retries)
  SELECT
    COUNT(*) FILTER (WHERE current_state = 'loaded' AND retry_count > 0),
    COUNT(*) FILTER (WHERE retry_count > 0)
  INTO successful_retries, total_retries
  FROM etl_run
  WHERE (p_organization_id IS NULL OR organization_id = p_organization_id);

  IF total_retries > 0 THEN
    retry_success_rate := (successful_retries::NUMERIC / total_retries::NUMERIC) * 100;
  ELSE
    retry_success_rate := 0;
  END IF;

  -- Build result JSON
  SELECT jsonb_build_object(
    'totalFailedRuns', total_failed,
    'retryReadyRuns', retry_ready,
    'deadLetterQueueEntries', dlq_entries,
    'averageRetryCount', COALESCE(avg_retry_count, 0),
    'retrySuccessRate', COALESCE(retry_success_rate, 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically process retry-ready runs
CREATE OR REPLACE FUNCTION process_retry_ready_runs(p_organization_id TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  processed_count INTEGER := 0;
  run_record RECORD;
  result JSONB;
BEGIN
  -- Get retry-ready runs
  FOR run_record IN
    SELECT id, file_id, organization_id, retry_count
    FROM etl_run
    WHERE current_state = 'failed'
      AND next_retry_at IS NOT NULL
      AND next_retry_at <= NOW()
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    ORDER BY next_retry_at ASC
    LIMIT 100 -- Process in batches
  LOOP
    -- Reset the run to uploaded state for retry
    UPDATE etl_run
    SET
      current_state = 'uploaded',
      next_retry_at = NULL,
      processing_started_at = NULL,
      processing_by = NULL,
      updated_at = NOW()
    WHERE id = run_record.id;

    processed_count := processed_count + 1;
  END LOOP;

  SELECT jsonb_build_object(
    'processedRuns', processed_count,
    'timestamp', NOW()
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old dead letter queue entries
CREATE OR REPLACE FUNCTION cleanup_old_dlq_entries(
  p_older_than_days INTEGER DEFAULT 30,
  p_organization_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - (p_older_than_days || ' days')::INTERVAL;

  DELETE FROM etl_dead_letter_queue
  WHERE created_at < cutoff_date
    AND marked_for_retry = FALSE
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate exponential backoff delay
CREATE OR REPLACE FUNCTION calculate_backoff_delay(
  p_attempt_number INTEGER,
  p_initial_delay_ms INTEGER DEFAULT 1000,
  p_max_delay_ms INTEGER DEFAULT 300000,
  p_backoff_multiplier NUMERIC DEFAULT 2,
  p_jitter_enabled BOOLEAN DEFAULT TRUE,
  p_jitter_max_percentage INTEGER DEFAULT 25
)
RETURNS INTEGER AS $$
DECLARE
  delay_ms INTEGER;
  jitter_range INTEGER;
  jitter INTEGER;
BEGIN
  -- Calculate base delay: initial_delay * (multiplier ^ attempt)
  delay_ms := p_initial_delay_ms * (p_backoff_multiplier ^ p_attempt_number);

  -- Cap at max delay
  delay_ms := LEAST(delay_ms, p_max_delay_ms);

  -- Add jitter if enabled
  IF p_jitter_enabled THEN
    jitter_range := delay_ms * (p_jitter_max_percentage / 100.0);
    jitter := (RANDOM() - 0.5) * 2 * jitter_range;
    delay_ms := GREATEST(0, delay_ms + jitter);
  END IF;

  RETURN delay_ms::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get runs with exponential backoff calculation
CREATE OR REPLACE FUNCTION schedule_run_retry(
  p_run_id TEXT,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL,
  p_is_transient BOOLEAN DEFAULT TRUE,
  p_max_retries INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
  run_record RECORD;
  current_attempt INTEGER;
  delay_ms INTEGER;
  next_retry_at TIMESTAMP WITH TIME ZONE;
  should_retry BOOLEAN := FALSE;
  dlq_id TEXT;
  result JSONB;
BEGIN
  -- Get current run information
  SELECT retry_count, file_id, organization_id
  INTO run_record
  FROM etl_run
  WHERE id = p_run_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'shouldRetry', FALSE,
      'reason', 'Run not found'
    );
  END IF;

  current_attempt := COALESCE(run_record.retry_count, 0);

  -- Check if we should retry
  IF current_attempt < p_max_retries AND p_is_transient THEN
    should_retry := TRUE;

    -- Calculate backoff delay
    delay_ms := calculate_backoff_delay(current_attempt);
    next_retry_at := NOW() + (delay_ms || ' milliseconds')::INTERVAL;

    -- Update run with retry information
    UPDATE etl_run
    SET
      retry_count = current_attempt + 1,
      next_retry_at = next_retry_at,
      error_message = p_error_message,
      error_details = p_error_details,
      current_state = 'failed',
      updated_at = NOW()
    WHERE id = p_run_id;

    result := jsonb_build_object(
      'shouldRetry', TRUE,
      'nextRetryAt', next_retry_at,
      'delayMs', delay_ms,
      'reason', 'Retry ' || (current_attempt + 1) || '/' || p_max_retries || ' scheduled'
    );
  ELSE
    -- Add to dead letter queue
    dlq_id := 'dlq-' || EXTRACT(EPOCH FROM NOW()) || '-' ||
              substr(md5(random()::text), 1, 9);

    INSERT INTO etl_dead_letter_queue (
      id,
      run_id,
      file_id,
      organization_id,
      error_message,
      error_details,
      max_retries_exceeded,
      marked_for_retry,
      created_at,
      updated_at
    ) VALUES (
      dlq_id,
      p_run_id,
      run_record.file_id,
      run_record.organization_id,
      p_error_message,
      p_error_details,
      current_attempt >= p_max_retries,
      FALSE,
      NOW(),
      NOW()
    );

    result := jsonb_build_object(
      'shouldRetry', FALSE,
      'deadLetterQueueId', dlq_id,
      'reason', CASE
        WHEN NOT p_is_transient THEN 'Non-transient error - no retry'
        ELSE 'Max retries (' || p_max_retries || ') exceeded'
      END
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk process DLQ marked entries
CREATE OR REPLACE FUNCTION process_marked_dlq_entries(p_organization_id TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  dlq_record RECORD;
  result JSONB;
BEGIN
  -- Process marked DLQ entries
  FOR dlq_record IN
    SELECT id, run_id
    FROM etl_dead_letter_queue
    WHERE marked_for_retry = TRUE
      AND (retry_after IS NULL OR retry_after <= NOW())
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    LIMIT 50 -- Process in batches
  LOOP
    BEGIN
      -- Reset the run for retry
      UPDATE etl_run
      SET
        retry_count = 0,
        next_retry_at = NOW(),
        current_state = 'failed',
        updated_at = NOW()
      WHERE id = dlq_record.run_id;

      -- Remove from DLQ
      DELETE FROM etl_dead_letter_queue
      WHERE id = dlq_record.id;

      processed_count := processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      -- Log the error but continue processing
      RAISE NOTICE 'Failed to process DLQ entry %: %', dlq_record.id, SQLERRM;
    END;
  END LOOP;

  SELECT jsonb_build_object(
    'processed', processed_count,
    'errors', error_count,
    'timestamp', NOW()
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a view for monitoring retry health
CREATE OR REPLACE VIEW etl_retry_monitoring AS
SELECT
  r.organization_id,
  COUNT(*) FILTER (WHERE r.current_state = 'failed') as total_failed_runs,
  COUNT(*) FILTER (WHERE r.current_state = 'failed' AND r.next_retry_at <= NOW()) as retry_ready_runs,
  COUNT(*) FILTER (WHERE r.retry_count > 0) as runs_with_retries,
  AVG(r.retry_count) FILTER (WHERE r.retry_count > 0) as avg_retry_count,
  COUNT(dlq.id) as dlq_entries,
  COUNT(*) FILTER (WHERE dlq.marked_for_retry = TRUE) as dlq_marked_for_retry,
  COUNT(*) FILTER (WHERE r.current_state = 'loaded' AND r.retry_count > 0) as successful_retries
FROM etl_run r
LEFT JOIN etl_dead_letter_queue dlq ON r.id = dlq.run_id
GROUP BY r.organization_id;

-- Create scheduled job to process retries (if pg_cron is available)
DO $$
BEGIN
  -- Try to create cron jobs, but don't fail if pg_cron is not available
  BEGIN
    -- Process retry-ready runs every minute
    PERFORM cron.schedule('process-retry-ready-runs', '* * * * *', 'SELECT process_retry_ready_runs();');

    -- Process marked DLQ entries every 5 minutes
    PERFORM cron.schedule('process-marked-dlq', '*/5 * * * *', 'SELECT process_marked_dlq_entries();');

    -- Clean up old DLQ entries daily at 2 AM
    PERFORM cron.schedule('cleanup-old-dlq', '0 2 * * *', 'SELECT cleanup_old_dlq_entries(30);');

  EXCEPTION WHEN undefined_function THEN
    -- pg_cron is not available, skip this
    RAISE NOTICE 'pg_cron extension not available, skipping scheduled retry jobs';
  END;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION get_retry_stats(TEXT) IS 'Returns comprehensive retry statistics for monitoring';
COMMENT ON FUNCTION process_retry_ready_runs(TEXT) IS 'Processes runs that are ready for retry';
COMMENT ON FUNCTION cleanup_old_dlq_entries(INTEGER, TEXT) IS 'Cleans up old dead letter queue entries';
COMMENT ON FUNCTION calculate_backoff_delay(INTEGER, INTEGER, INTEGER, NUMERIC, BOOLEAN, INTEGER) IS 'Calculates exponential backoff delay with optional jitter';
COMMENT ON FUNCTION schedule_run_retry(TEXT, TEXT, JSONB, BOOLEAN, INTEGER) IS 'Schedules a run for retry or adds to dead letter queue';
COMMENT ON FUNCTION process_marked_dlq_entries(TEXT) IS 'Processes dead letter queue entries marked for retry';
COMMENT ON VIEW etl_retry_monitoring IS 'Monitoring view for retry system health across organizations';