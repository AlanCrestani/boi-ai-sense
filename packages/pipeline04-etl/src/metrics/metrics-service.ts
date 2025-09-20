/**
 * ETL Metrics Collection and Aggregation Service
 * Collects, aggregates, and stores metrics for ETL pipeline monitoring
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ETLMetric {
  organizationId: string;
  metricType: 'processing_time' | 'error_rate' | 'throughput' | 'data_quality' | 'system_performance';
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  entityType?: 'etl_file' | 'etl_run' | 'pipeline' | 'system';
  entityId?: string;
  pipelineStage?: 'extraction' | 'transformation' | 'validation' | 'loading';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface PerformanceSnapshot {
  organizationId: string;
  snapshotPeriod: 'hourly' | 'daily' | 'weekly';
  snapshotTime: Date;
  totalFilesProcessed: number;
  filesUploaded: number;
  filesProcessing: number;
  filesValidated: number;
  filesApproved: number;
  filesLoaded: number;
  filesFailed: number;
  avgProcessingTimeMs?: number;
  p50ProcessingTimeMs?: number;
  p95ProcessingTimeMs?: number;
  p99ProcessingTimeMs?: number;
  maxProcessingTimeMs?: number;
  totalErrors: number;
  errorRatePercentage: number;
  successRatePercentage: number;
  dataQualityScore?: number;
  recordsProcessed: number;
  bytesProcessed: number;
  throughputRecordsPerMinute?: number;
  throughputMbPerMinute?: number;
  dlqEntries: number;
  activeRetries: number;
}

export interface MetricsQuery {
  organizationId: string;
  metricTypes?: string[];
  entityType?: string;
  entityId?: string;
  pipelineStage?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

export interface MetricsAggregation {
  organizationId: string;
  metricType: string;
  timeWindow: '1h' | '24h' | '7d' | '30d';
  aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count';
  startTime: Date;
  endTime: Date;
}

export class MetricsService {
  private supabase: SupabaseClient;
  private metricsBuffer: ETLMetric[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private bufferFlushSize = 100;
  private bufferFlushIntervalMs = 30000; // 30 seconds

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.startMetricsBuffering();
  }

  /**
   * Record a single ETL metric
   */
  async recordMetric(metric: ETLMetric): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('record_etl_metric', {
        p_organization_id: metric.organizationId,
        p_metric_type: metric.metricType,
        p_metric_name: metric.metricName,
        p_metric_value: metric.metricValue,
        p_metric_unit: metric.metricUnit,
        p_entity_type: metric.entityType,
        p_entity_id: metric.entityId,
        p_pipeline_stage: metric.pipelineStage,
        p_metadata: metric.metadata || {}
      });

    if (error) {
      console.error('Failed to record ETL metric:', error);
      throw error;
    }

    return data;
  }

  /**
   * Record a metric asynchronously using buffering for better performance
   */
  recordMetricAsync(metric: ETLMetric): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date()
    });

    // Flush buffer if it reaches the size limit
    if (this.metricsBuffer.length >= this.bufferFlushSize) {
      this.flushMetricsBuffer();
    }
  }

  /**
   * Record processing time metric for a file or run
   */
  async recordProcessingTime(
    organizationId: string,
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    processingTimeMs: number,
    pipelineStage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      organizationId,
      metricType: 'processing_time',
      metricName: `${entityType}_processing_duration`,
      metricValue: processingTimeMs,
      metricUnit: 'milliseconds',
      entityType,
      entityId,
      pipelineStage,
      metadata
    });
  }

  /**
   * Record error rate metric
   */
  async recordErrorRate(
    organizationId: string,
    errorCount: number,
    totalCount: number,
    pipelineStage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    await this.recordMetric({
      organizationId,
      metricType: 'error_rate',
      metricName: 'pipeline_error_rate',
      metricValue: errorRate,
      metricUnit: 'percentage',
      pipelineStage,
      metadata: {
        ...metadata,
        errorCount,
        totalCount
      }
    });
  }

  /**
   * Record throughput metric
   */
  async recordThroughput(
    organizationId: string,
    recordsProcessed: number,
    timeWindowMs: number,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const throughputPerMinute = (recordsProcessed / timeWindowMs) * 60000;

    await this.recordMetric({
      organizationId,
      metricType: 'throughput',
      metricName: 'records_per_minute',
      metricValue: throughputPerMinute,
      metricUnit: 'records/minute',
      entityType: entityType as any,
      entityId,
      metadata: {
        ...metadata,
        recordsProcessed,
        timeWindowMs
      }
    });
  }

  /**
   * Record data quality metric
   */
  async recordDataQuality(
    organizationId: string,
    qualityScore: number,
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    qualityMetrics: {
      completeness?: number;
      accuracy?: number;
      consistency?: number;
      validity?: number;
    },
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      organizationId,
      metricType: 'data_quality',
      metricName: 'overall_quality_score',
      metricValue: qualityScore,
      metricUnit: 'score',
      entityType,
      entityId,
      metadata: {
        ...metadata,
        qualityMetrics
      }
    });
  }

  /**
   * Record system performance metric
   */
  async recordSystemPerformance(
    organizationId: string,
    metricName: string,
    metricValue: number,
    metricUnit: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      organizationId,
      metricType: 'system_performance',
      metricName,
      metricValue,
      metricUnit,
      entityType: 'system',
      metadata
    });
  }

  /**
   * Query metrics with filtering and pagination
   */
  async queryMetrics(query: MetricsQuery): Promise<ETLMetric[]> {
    let supabaseQuery = this.supabase
      .from('etl_metrics')
      .select('*')
      .eq('organization_id', query.organizationId)
      .order('timestamp', { ascending: false });

    if (query.metricTypes && query.metricTypes.length > 0) {
      supabaseQuery = supabaseQuery.in('metric_type', query.metricTypes);
    }

    if (query.entityType) {
      supabaseQuery = supabaseQuery.eq('entity_type', query.entityType);
    }

    if (query.entityId) {
      supabaseQuery = supabaseQuery.eq('entity_id', query.entityId);
    }

    if (query.pipelineStage) {
      supabaseQuery = supabaseQuery.eq('pipeline_stage', query.pipelineStage);
    }

    if (query.startTime) {
      supabaseQuery = supabaseQuery.gte('timestamp', query.startTime.toISOString());
    }

    if (query.endTime) {
      supabaseQuery = supabaseQuery.lte('timestamp', query.endTime.toISOString());
    }

    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Failed to query metrics:', error);
      throw error;
    }

    return data?.map(row => ({
      organizationId: row.organization_id,
      metricType: row.metric_type,
      metricName: row.metric_name,
      metricValue: row.metric_value,
      metricUnit: row.metric_unit,
      entityType: row.entity_type,
      entityId: row.entity_id,
      pipelineStage: row.pipeline_stage,
      metadata: row.metadata,
      timestamp: new Date(row.timestamp)
    })) || [];
  }

  /**
   * Get aggregated metrics for dashboard display
   */
  async getAggregatedMetrics(aggregation: MetricsAggregation): Promise<any> {
    const { data, error } = await this.supabase
      .from('etl_metrics')
      .select(`
        metric_value,
        timestamp
      `)
      .eq('organization_id', aggregation.organizationId)
      .eq('metric_type', aggregation.metricType)
      .gte('timestamp', aggregation.startTime.toISOString())
      .lte('timestamp', aggregation.endTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Failed to get aggregated metrics:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { value: 0, dataPoints: [] };
    }

    const values = data.map(row => row.metric_value);
    let aggregatedValue: number;

    switch (aggregation.aggregationType) {
      case 'avg':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = 0;
    }

    return {
      value: aggregatedValue,
      dataPoints: data.map(row => ({
        timestamp: new Date(row.timestamp),
        value: row.metric_value
      }))
    };
  }

  /**
   * Calculate and store performance snapshot
   */
  async calculatePerformanceSnapshot(
    organizationId: string,
    snapshotPeriod: 'hourly' | 'daily' | 'weekly' = 'hourly'
  ): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('calculate_performance_snapshot', {
        p_organization_id: organizationId,
        p_snapshot_period: snapshotPeriod
      });

    if (error) {
      console.error('Failed to calculate performance snapshot:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get latest performance snapshots
   */
  async getPerformanceSnapshots(
    organizationId: string,
    period: 'hourly' | 'daily' | 'weekly',
    limit: number = 24
  ): Promise<PerformanceSnapshot[]> {
    const { data, error } = await this.supabase
      .from('etl_performance_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('snapshot_period', period)
      .order('snapshot_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get performance snapshots:', error);
      throw error;
    }

    return data?.map(row => ({
      organizationId: row.organization_id,
      snapshotPeriod: row.snapshot_period,
      snapshotTime: new Date(row.snapshot_time),
      totalFilesProcessed: row.total_files_processed,
      filesUploaded: row.files_uploaded,
      filesProcessing: row.files_processing,
      filesValidated: row.files_validated,
      filesApproved: row.files_approved,
      filesLoaded: row.files_loaded,
      filesFailed: row.files_failed,
      avgProcessingTimeMs: row.avg_processing_time_ms,
      p50ProcessingTimeMs: row.p50_processing_time_ms,
      p95ProcessingTimeMs: row.p95_processing_time_ms,
      p99ProcessingTimeMs: row.p99_processing_time_ms,
      maxProcessingTimeMs: row.max_processing_time_ms,
      totalErrors: row.total_errors,
      errorRatePercentage: row.error_rate_percentage,
      successRatePercentage: row.success_rate_percentage,
      dataQualityScore: row.data_quality_score,
      recordsProcessed: row.records_processed,
      bytesProcessed: row.bytes_processed,
      throughputRecordsPerMinute: row.throughput_records_per_minute,
      throughputMbPerMinute: row.throughput_mb_per_minute,
      dlqEntries: row.dlq_entries,
      activeRetries: row.active_retries
    })) || [];
  }

  /**
   * Get current metrics overview for dashboard
   */
  async getMetricsOverview(organizationId: string): Promise<{
    totalFiles: number;
    processingFiles: number;
    successRate: number;
    errorRate: number;
    avgProcessingTime: number;
    dlqSize: number;
    activeRetries: number;
  }> {
    // Get latest snapshot
    const snapshots = await this.getPerformanceSnapshots(organizationId, 'hourly', 1);
    const latestSnapshot = snapshots[0];

    if (!latestSnapshot) {
      return {
        totalFiles: 0,
        processingFiles: 0,
        successRate: 100,
        errorRate: 0,
        avgProcessingTime: 0,
        dlqSize: 0,
        activeRetries: 0
      };
    }

    return {
      totalFiles: latestSnapshot.totalFilesProcessed,
      processingFiles: latestSnapshot.filesProcessing,
      successRate: latestSnapshot.successRatePercentage,
      errorRate: latestSnapshot.errorRatePercentage,
      avgProcessingTime: latestSnapshot.avgProcessingTimeMs || 0,
      dlqSize: latestSnapshot.dlqEntries,
      activeRetries: latestSnapshot.activeRetries
    };
  }

  /**
   * Start metrics buffering for async recording
   */
  private startMetricsBuffering(): void {
    this.bufferFlushInterval = setInterval(() => {
      this.flushMetricsBuffer();
    }, this.bufferFlushIntervalMs);
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const insertPromises = metricsToFlush.map(metric => this.recordMetric(metric));
      await Promise.all(insertPromises);
      console.log(`Flushed ${metricsToFlush.length} metrics to database`);
    } catch (error) {
      console.error('Failed to flush metrics buffer:', error);
      // Re-add failed metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Stop metrics buffering and flush remaining metrics
   */
  async stopMetricsBuffering(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }

    await this.flushMetricsBuffer();
  }

  /**
   * Create a metrics tracking context for operations
   */
  createMetricsContext(
    organizationId: string,
    entityType: 'etl_file' | 'etl_run',
    entityId: string
  ) {
    const startTime = Date.now();

    return {
      recordSuccess: async (pipelineStage?: string, metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        await this.recordProcessingTime(
          organizationId,
          entityType,
          entityId,
          duration,
          pipelineStage,
          { ...metadata, success: true }
        );
      },

      recordError: async (error: Error, pipelineStage?: string, metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        await this.recordProcessingTime(
          organizationId,
          entityType,
          entityId,
          duration,
          pipelineStage,
          { ...metadata, success: false, error: error.message }
        );
      },

      recordStageCompletion: async (stage: string, stageStartTime: number, metadata?: Record<string, any>) => {
        const stageDuration = Date.now() - stageStartTime;
        await this.recordProcessingTime(
          organizationId,
          entityType,
          entityId,
          stageDuration,
          stage,
          metadata
        );
      }
    };
  }
}