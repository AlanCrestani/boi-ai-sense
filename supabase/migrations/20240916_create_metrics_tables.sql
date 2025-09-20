-- ETL Metrics and Observability Tables
-- Create comprehensive metrics collection system for ETL pipeline monitoring

-- ETL Metrics table for storing various metric types and values
CREATE TABLE IF NOT EXISTS etl_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- e.g., 'processing_time', 'error_rate', 'throughput', 'data_quality'
    metric_name VARCHAR(200) NOT NULL, -- e.g., 'file_processing_duration', 'validation_error_count'
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50), -- e.g., 'milliseconds', 'count', 'percentage', 'bytes'
    entity_type VARCHAR(50), -- e.g., 'etl_file', 'etl_run', 'pipeline', 'system'
    entity_id UUID, -- Reference to specific entity
    pipeline_stage VARCHAR(100), -- e.g., 'extraction', 'transformation', 'validation', 'loading'
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}', -- Additional context and details
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_etl_metrics_org_type ON etl_metrics (organization_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_timestamp ON etl_metrics (timestamp);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_entity ON etl_metrics (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_org_time ON etl_metrics (organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_type_time ON etl_metrics (metric_type, timestamp DESC);

-- Performance snapshots for aggregated metrics over time periods
CREATE TABLE IF NOT EXISTS etl_performance_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_period VARCHAR(20) NOT NULL, -- e.g., 'hourly', 'daily', 'weekly'
    snapshot_time TIMESTAMPTZ NOT NULL,

    -- File processing metrics
    total_files_processed INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    files_processing INTEGER DEFAULT 0,
    files_validated INTEGER DEFAULT 0,
    files_approved INTEGER DEFAULT 0,
    files_loaded INTEGER DEFAULT 0,
    files_failed INTEGER DEFAULT 0,

    -- Performance metrics
    avg_processing_time_ms DECIMAL(15,2),
    p50_processing_time_ms DECIMAL(15,2),
    p95_processing_time_ms DECIMAL(15,2),
    p99_processing_time_ms DECIMAL(15,2),
    max_processing_time_ms DECIMAL(15,2),

    -- Error and quality metrics
    total_errors INTEGER DEFAULT 0,
    error_rate_percentage DECIMAL(5,2) DEFAULT 0,
    success_rate_percentage DECIMAL(5,2) DEFAULT 100,
    data_quality_score DECIMAL(5,2), -- 0-100 score

    -- Throughput metrics
    records_processed BIGINT DEFAULT 0,
    bytes_processed BIGINT DEFAULT 0,
    throughput_records_per_minute DECIMAL(15,2),
    throughput_mb_per_minute DECIMAL(15,2),

    -- System resource metrics
    avg_cpu_usage_percentage DECIMAL(5,2),
    avg_memory_usage_percentage DECIMAL(5,2),
    peak_memory_usage_mb DECIMAL(15,2),

    -- Dead letter queue metrics
    dlq_entries INTEGER DEFAULT 0,
    active_retries INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint to prevent duplicate snapshots
    UNIQUE(organization_id, snapshot_period, snapshot_time)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_org_period ON etl_performance_snapshots (organization_id, snapshot_period);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_time ON etl_performance_snapshots (snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_org_time ON etl_performance_snapshots (organization_id, snapshot_time DESC);

-- Alert configuration table for defining alerting rules
CREATE TABLE IF NOT EXISTS etl_alerts_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- e.g., 'error_rate', 'processing_time', 'sla_breach', 'data_quality'
    metric_type VARCHAR(100) NOT NULL, -- Which metric to monitor
    condition_operator VARCHAR(20) NOT NULL, -- e.g., '>', '<', '>=', '<=', '=='
    threshold_value DECIMAL(15,4) NOT NULL,
    evaluation_window_minutes INTEGER NOT NULL DEFAULT 60, -- Time window for evaluation
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

    -- Notification settings
    email_enabled BOOLEAN DEFAULT true,
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,
    email_recipients TEXT[], -- Array of email addresses

    -- Alert behavior
    is_enabled BOOLEAN DEFAULT true,
    alert_cooldown_minutes INTEGER DEFAULT 60, -- Minimum time between alerts
    escalation_enabled BOOLEAN DEFAULT false,
    escalation_delay_minutes INTEGER DEFAULT 120,

    -- Alert message templates
    alert_title_template TEXT,
    alert_message_template TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for alerts config table
CREATE INDEX IF NOT EXISTS idx_alerts_config_org ON etl_alerts_config (organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_config_type ON etl_alerts_config (alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_config_enabled ON etl_alerts_config (is_enabled);

-- Alert history table for tracking fired alerts
CREATE TABLE IF NOT EXISTS etl_alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_config_id UUID NOT NULL REFERENCES etl_alerts_config(id) ON DELETE CASCADE,
    alert_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,

    -- Alert trigger details
    triggered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    condition_met TEXT NOT NULL, -- Human readable condition that was met

    -- Context and metadata
    entity_type VARCHAR(50),
    entity_id UUID,
    pipeline_stage VARCHAR(100),
    context_data JSONB DEFAULT '{}',

    -- Alert delivery status
    email_sent BOOLEAN DEFAULT false,
    slack_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    slack_sent_at TIMESTAMPTZ,

    -- Alert lifecycle
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for alert history table
CREATE INDEX IF NOT EXISTS idx_alert_history_org ON etl_alert_history (organization_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_config ON etl_alert_history (alert_config_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON etl_alert_history (triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unresolved ON etl_alert_history (organization_id, resolved) WHERE resolved = false;

-- System health metrics table for overall system monitoring
CREATE TABLE IF NOT EXISTS etl_system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    check_name VARCHAR(200) NOT NULL, -- e.g., 'database_connection', 'storage_availability', 'api_response_time'
    status VARCHAR(20) NOT NULL DEFAULT 'healthy', -- 'healthy', 'warning', 'critical', 'unknown'
    response_time_ms DECIMAL(10,2),
    status_message TEXT,
    details JSONB DEFAULT '{}',
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for system health table
CREATE INDEX IF NOT EXISTS idx_system_health_org ON etl_system_health (organization_id);
CREATE INDEX IF NOT EXISTS idx_system_health_name ON etl_system_health (check_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON etl_system_health (status);
CREATE INDEX IF NOT EXISTS idx_system_health_time ON etl_system_health (checked_at DESC);

-- Enable Row Level Security (RLS) on all metrics tables
ALTER TABLE etl_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_alerts_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for etl_metrics
CREATE POLICY "Users can access metrics for their organization" ON etl_metrics
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for etl_performance_snapshots
CREATE POLICY "Users can access performance snapshots for their organization" ON etl_performance_snapshots
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for etl_alerts_config
CREATE POLICY "Users can manage alert configs for their organization" ON etl_alerts_config
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for etl_alert_history
CREATE POLICY "Users can access alert history for their organization" ON etl_alert_history
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for etl_system_health
CREATE POLICY "Users can access system health for their organization" ON etl_system_health
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Function to calculate and store performance snapshots
CREATE OR REPLACE FUNCTION calculate_performance_snapshot(
    p_organization_id UUID,
    p_snapshot_period VARCHAR(20) DEFAULT 'hourly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id UUID;
    v_snapshot_time TIMESTAMPTZ;
    v_start_time TIMESTAMPTZ;
    v_file_stats RECORD;
    v_processing_stats RECORD;
    v_error_stats RECORD;
    v_dlq_stats RECORD;
BEGIN
    -- Calculate snapshot time based on period
    IF p_snapshot_period = 'hourly' THEN
        v_snapshot_time := DATE_TRUNC('hour', NOW());
        v_start_time := v_snapshot_time - INTERVAL '1 hour';
    ELSIF p_snapshot_period = 'daily' THEN
        v_snapshot_time := DATE_TRUNC('day', NOW());
        v_start_time := v_snapshot_time - INTERVAL '1 day';
    ELSIF p_snapshot_period = 'weekly' THEN
        v_snapshot_time := DATE_TRUNC('week', NOW());
        v_start_time := v_snapshot_time - INTERVAL '1 week';
    ELSE
        RAISE EXCEPTION 'Invalid snapshot period: %', p_snapshot_period;
    END IF;

    -- Calculate file processing statistics
    SELECT
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE status = 'uploaded') as uploaded,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'validated') as validated,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'loaded') as loaded,
        COUNT(*) FILTER (WHERE status = 'error') as failed
    INTO v_file_stats
    FROM etl_file
    WHERE organization_id = p_organization_id
        AND uploaded_at >= v_start_time
        AND uploaded_at < v_snapshot_time + INTERVAL '1 hour';

    -- Calculate processing time statistics
    SELECT
        AVG(EXTRACT(EPOCH FROM (completed_at - processing_started_at)) * 1000) as avg_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - processing_started_at)) * 1000) as p50_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - processing_started_at)) * 1000) as p95_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - processing_started_at)) * 1000) as p99_time,
        MAX(EXTRACT(EPOCH FROM (completed_at - processing_started_at)) * 1000) as max_time
    INTO v_processing_stats
    FROM etl_file
    WHERE organization_id = p_organization_id
        AND completed_at IS NOT NULL
        AND processing_started_at IS NOT NULL
        AND completed_at >= v_start_time
        AND completed_at < v_snapshot_time + INTERVAL '1 hour';

    -- Calculate error statistics
    SELECT
        COUNT(*) as total_errors,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'error')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            2
        ) as error_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE status IN ('validated', 'approved', 'loaded'))::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            2
        ) as success_rate
    INTO v_error_stats
    FROM etl_file
    WHERE organization_id = p_organization_id
        AND uploaded_at >= v_start_time
        AND uploaded_at < v_snapshot_time + INTERVAL '1 hour';

    -- Calculate dead letter queue statistics
    SELECT
        COUNT(*) FILTER (WHERE NOT resolved) as dlq_entries,
        COUNT(*) FILTER (WHERE retry_count > 0 AND NOT resolved) as active_retries
    INTO v_dlq_stats
    FROM etl_dead_letter_queue
    WHERE organization_id = p_organization_id;

    -- Insert or update performance snapshot
    INSERT INTO etl_performance_snapshots (
        organization_id,
        snapshot_period,
        snapshot_time,
        total_files_processed,
        files_uploaded,
        files_processing,
        files_validated,
        files_approved,
        files_loaded,
        files_failed,
        avg_processing_time_ms,
        p50_processing_time_ms,
        p95_processing_time_ms,
        p99_processing_time_ms,
        max_processing_time_ms,
        total_errors,
        error_rate_percentage,
        success_rate_percentage,
        dlq_entries,
        active_retries
    ) VALUES (
        p_organization_id,
        p_snapshot_period,
        v_snapshot_time,
        COALESCE(v_file_stats.total_files, 0),
        COALESCE(v_file_stats.uploaded, 0),
        COALESCE(v_file_stats.processing, 0),
        COALESCE(v_file_stats.validated, 0),
        COALESCE(v_file_stats.approved, 0),
        COALESCE(v_file_stats.loaded, 0),
        COALESCE(v_file_stats.failed, 0),
        COALESCE(v_processing_stats.avg_time, 0),
        COALESCE(v_processing_stats.p50_time, 0),
        COALESCE(v_processing_stats.p95_time, 0),
        COALESCE(v_processing_stats.p99_time, 0),
        COALESCE(v_processing_stats.max_time, 0),
        COALESCE(v_error_stats.total_errors, 0),
        COALESCE(v_error_stats.error_rate, 0),
        COALESCE(v_error_stats.success_rate, 100),
        COALESCE(v_dlq_stats.dlq_entries, 0),
        COALESCE(v_dlq_stats.active_retries, 0)
    )
    ON CONFLICT (organization_id, snapshot_period, snapshot_time)
    DO UPDATE SET
        total_files_processed = EXCLUDED.total_files_processed,
        files_uploaded = EXCLUDED.files_uploaded,
        files_processing = EXCLUDED.files_processing,
        files_validated = EXCLUDED.files_validated,
        files_approved = EXCLUDED.files_approved,
        files_loaded = EXCLUDED.files_loaded,
        files_failed = EXCLUDED.files_failed,
        avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
        p50_processing_time_ms = EXCLUDED.p50_processing_time_ms,
        p95_processing_time_ms = EXCLUDED.p95_processing_time_ms,
        p99_processing_time_ms = EXCLUDED.p99_processing_time_ms,
        max_processing_time_ms = EXCLUDED.max_processing_time_ms,
        total_errors = EXCLUDED.total_errors,
        error_rate_percentage = EXCLUDED.error_rate_percentage,
        success_rate_percentage = EXCLUDED.success_rate_percentage,
        dlq_entries = EXCLUDED.dlq_entries,
        active_retries = EXCLUDED.active_retries
    RETURNING id INTO v_snapshot_id;

    RETURN v_snapshot_id;
END;
$$;

-- Function to record ETL metrics
CREATE OR REPLACE FUNCTION record_etl_metric(
    p_organization_id UUID,
    p_metric_type VARCHAR(100),
    p_metric_name VARCHAR(200),
    p_metric_value DECIMAL(15,4),
    p_metric_unit VARCHAR(50) DEFAULT NULL,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_pipeline_stage VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metric_id UUID;
BEGIN
    INSERT INTO etl_metrics (
        organization_id,
        metric_type,
        metric_name,
        metric_value,
        metric_unit,
        entity_type,
        entity_id,
        pipeline_stage,
        metadata
    ) VALUES (
        p_organization_id,
        p_metric_type,
        p_metric_name,
        p_metric_value,
        p_metric_unit,
        p_entity_type,
        p_entity_id,
        p_pipeline_stage,
        p_metadata
    ) RETURNING id INTO v_metric_id;

    RETURN v_metric_id;
END;
$$;