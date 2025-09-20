/**
 * Monitoring and Alerting Service for ETL Operations
 * Provides monitoring capabilities for retry logic and dead letter queue
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorType, DeadLetterQueueEntry } from './types.js';

export interface MonitoringAlert {
  id: string;
  type: 'dead_letter_queue_full' | 'high_retry_rate' | 'stale_processing' | 'error_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  organizationId: string;
  entityType?: 'etl_file' | 'etl_run';
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface MonitoringMetrics {
  organizationId: string;
  activeRetries: number;
  deadLetterQueueSize: number;
  successRate: number;
  averageRetries: number;
  errorsByType: Record<ErrorType, number>;
  alertsLast24h: number;
  processingDuration: {
    p50: number;
    p95: number;
    p99: number;
  };
  timestamp: Date;
}

export interface AlertThresholds {
  deadLetterQueueMaxSize: number;
  maxRetryRate: number; // percentage
  maxProcessingDurationMs: number;
  errorSpikeThreshold: number; // errors per hour
  staleProcessingTimeoutMs: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  deadLetterQueueMaxSize: 100,
  maxRetryRate: 30, // 30% retry rate
  maxProcessingDurationMs: 1800000, // 30 minutes
  errorSpikeThreshold: 50, // 50 errors per hour
  staleProcessingTimeoutMs: 3600000 // 1 hour
};

export class MonitoringService {
  private supabase: SupabaseClient;
  private thresholds: AlertThresholds;
  private alertCallbacks: ((alert: MonitoringAlert) => Promise<void>)[] = [];

  constructor(supabase: SupabaseClient, thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS) {
    this.supabase = supabase;
    this.thresholds = thresholds;
  }

  /**
   * Register callback for alert notifications
   */
  onAlert(callback: (alert: MonitoringAlert) => Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Send alert to all registered callbacks
   */
  private async sendAlert(alert: MonitoringAlert): Promise<void> {
    console.warn(`ETL Alert [${alert.severity.toUpperCase()}]:`, alert.message);

    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error('Failed to send alert notification:', error);
      }
    }
  }

  /**
   * Get comprehensive monitoring metrics for an organization
   */
  async getMetrics(organizationId: string): Promise<MonitoringMetrics> {
    const [retryStats, errorStats, alertStats, processingStats] = await Promise.all([
      this.getRetryStatistics(organizationId),
      this.getErrorStatistics(organizationId),
      this.getAlertStatistics(organizationId),
      this.getProcessingStatistics(organizationId)
    ]);

    return {
      organizationId,
      activeRetries: retryStats.activeRetries,
      deadLetterQueueSize: retryStats.deadLetterQueueSize,
      successRate: retryStats.successRate,
      averageRetries: retryStats.averageRetries,
      errorsByType: errorStats,
      alertsLast24h: alertStats,
      processingDuration: processingStats,
      timestamp: new Date()
    };
  }

  /**
   * Check for alert conditions and send notifications
   */
  async checkAlerts(organizationId: string): Promise<MonitoringAlert[]> {
    const metrics = await this.getMetrics(organizationId);
    const alerts: MonitoringAlert[] = [];

    // Check dead letter queue size
    if (metrics.deadLetterQueueSize >= this.thresholds.deadLetterQueueMaxSize) {
      alerts.push({
        id: `dlq-full-${Date.now()}`,
        type: 'dead_letter_queue_full',
        severity: metrics.deadLetterQueueSize >= this.thresholds.deadLetterQueueMaxSize * 2 ? 'critical' : 'high',
        message: `Dead letter queue has ${metrics.deadLetterQueueSize} entries (threshold: ${this.thresholds.deadLetterQueueMaxSize})`,
        organizationId,
        metadata: { currentSize: metrics.deadLetterQueueSize, threshold: this.thresholds.deadLetterQueueMaxSize },
        createdAt: new Date()
      });
    }

    // Check retry rate
    const retryRate = 100 - metrics.successRate;
    if (retryRate >= this.thresholds.maxRetryRate) {
      alerts.push({
        id: `retry-rate-${Date.now()}`,
        type: 'high_retry_rate',
        severity: retryRate >= this.thresholds.maxRetryRate * 2 ? 'critical' : 'high',
        message: `High retry rate: ${retryRate.toFixed(1)}% (threshold: ${this.thresholds.maxRetryRate}%)`,
        organizationId,
        metadata: { retryRate, threshold: this.thresholds.maxRetryRate },
        createdAt: new Date()
      });
    }

    // Check for stale processing
    const staleEntities = await this.getStaleProcessingEntities(organizationId);
    if (staleEntities.length > 0) {
      alerts.push({
        id: `stale-processing-${Date.now()}`,
        type: 'stale_processing',
        severity: 'medium',
        message: `Found ${staleEntities.length} entities with stale processing`,
        organizationId,
        metadata: { staleCount: staleEntities.length, entities: staleEntities.slice(0, 5) },
        createdAt: new Date()
      });
    }

    // Check for error spikes
    const hourlyErrors = await this.getHourlyErrorCount(organizationId);
    if (hourlyErrors >= this.thresholds.errorSpikeThreshold) {
      alerts.push({
        id: `error-spike-${Date.now()}`,
        type: 'error_spike',
        severity: 'high',
        message: `Error spike detected: ${hourlyErrors} errors in the last hour (threshold: ${this.thresholds.errorSpikeThreshold})`,
        organizationId,
        metadata: { hourlyErrors, threshold: this.thresholds.errorSpikeThreshold },
        createdAt: new Date()
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Get retry statistics
   */
  private async getRetryStatistics(organizationId: string): Promise<{
    activeRetries: number;
    deadLetterQueueSize: number;
    successRate: number;
    averageRetries: number;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_retry_statistics', { org_id: organizationId });

    if (error) {
      console.error('Failed to get retry statistics:', error);
      return { activeRetries: 0, deadLetterQueueSize: 0, successRate: 100, averageRetries: 0 };
    }

    const stats = data?.[0] || {};
    return {
      activeRetries: stats.active_retries || 0,
      deadLetterQueueSize: stats.dead_letter_queue_size || 0,
      successRate: stats.success_rate || 100,
      averageRetries: stats.average_retries || 0
    };
  }

  /**
   * Get error statistics by type
   */
  private async getErrorStatistics(organizationId: string): Promise<Record<ErrorType, number>> {
    const { data, error } = await this.supabase
      .from('etl_dead_letter_queue')
      .select('error_type')
      .eq('organization_id', organizationId)
      .eq('resolved', false);

    if (error) {
      console.error('Failed to get error statistics:', error);
      return { transient: 0, permanent: 0, rate_limited: 0, resource: 0 };
    }

    const stats: Record<ErrorType, number> = { transient: 0, permanent: 0, rate_limited: 0, resource: 0 };
    data?.forEach(entry => {
      if (entry.error_type in stats) {
        stats[entry.error_type as ErrorType]++;
      }
    });

    return stats;
  }

  /**
   * Get alert count for last 24 hours
   */
  private async getAlertStatistics(organizationId: string): Promise<number> {
    // In a real implementation, you'd have an alerts table
    // For now, we'll estimate based on dead letter queue entries
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('etl_dead_letter_queue')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', yesterday.toISOString());

    if (error) {
      console.error('Failed to get alert statistics:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get processing duration percentiles
   */
  private async getProcessingStatistics(organizationId: string): Promise<{
    p50: number;
    p95: number;
    p99: number;
  }> {
    // Calculate processing durations from completed runs
    const { data, error } = await this.supabase
      .from('etl_run')
      .select('started_at, completed_at')
      .eq('organization_id', organizationId)
      .not('completed_at', 'is', null)
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false })
      .limit(1000);

    if (error || !data?.length) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const durations = data
      .map(run => {
        const start = new Date(run.started_at).getTime();
        const end = new Date(run.completed_at!).getTime();
        return end - start;
      })
      .sort((a, b) => a - b);

    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.ceil(arr.length * percentile / 100) - 1;
      return arr[Math.max(0, index)] || 0;
    };

    return {
      p50: getPercentile(durations, 50),
      p95: getPercentile(durations, 95),
      p99: getPercentile(durations, 99)
    };
  }

  /**
   * Get entities with stale processing
   */
  private async getStaleProcessingEntities(organizationId: string): Promise<Array<{
    type: 'etl_file' | 'etl_run';
    id: string;
    processingStartedAt: Date;
  }>> {
    const staleThreshold = new Date(Date.now() - this.thresholds.staleProcessingTimeoutMs);

    const [files, runs] = await Promise.all([
      this.supabase
        .from('etl_file')
        .select('id, processing_started_at')
        .eq('organization_id', organizationId)
        .not('processing_started_at', 'is', null)
        .lt('processing_started_at', staleThreshold.toISOString()),

      this.supabase
        .from('etl_run')
        .select('id, processing_started_at')
        .eq('organization_id', organizationId)
        .not('processing_started_at', 'is', null)
        .lt('processing_started_at', staleThreshold.toISOString())
    ]);

    const result: Array<{ type: 'etl_file' | 'etl_run'; id: string; processingStartedAt: Date }> = [];

    files.data?.forEach(file => {
      result.push({
        type: 'etl_file',
        id: file.id,
        processingStartedAt: new Date(file.processing_started_at)
      });
    });

    runs.data?.forEach(run => {
      result.push({
        type: 'etl_run',
        id: run.id,
        processingStartedAt: new Date(run.processing_started_at)
      });
    });

    return result;
  }

  /**
   * Get error count for the last hour
   */
  private async getHourlyErrorCount(organizationId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('etl_run_log')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('level', 'error')
      .gte('timestamp', oneHourAgo.toISOString());

    if (error) {
      console.error('Failed to get hourly error count:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get health check summary
   */
  async getHealthCheck(organizationId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: MonitoringMetrics;
  }> {
    const metrics = await this.getMetrics(organizationId);
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check critical issues
    if (metrics.deadLetterQueueSize >= this.thresholds.deadLetterQueueMaxSize * 2) {
      issues.push(`Critical: Dead letter queue severely overloaded (${metrics.deadLetterQueueSize} entries)`);
      status = 'critical';
    }

    if (metrics.successRate < 50) {
      issues.push(`Critical: Very low success rate (${metrics.successRate.toFixed(1)}%)`);
      status = 'critical';
    }

    // Check warning issues
    if (status !== 'critical') {
      if (metrics.deadLetterQueueSize >= this.thresholds.deadLetterQueueMaxSize) {
        issues.push(`Warning: Dead letter queue approaching limit (${metrics.deadLetterQueueSize} entries)`);
        status = 'warning';
      }

      if (metrics.successRate < 70) {
        issues.push(`Warning: Low success rate (${metrics.successRate.toFixed(1)}%)`);
        status = 'warning';
      }

      if (metrics.averageRetries > 2) {
        issues.push(`Warning: High average retry count (${metrics.averageRetries.toFixed(1)})`);
        status = 'warning';
      }
    }

    return { status, issues, metrics };
  }

  /**
   * Setup automatic monitoring with interval checking
   */
  startMonitoring(organizationId: string, intervalMs: number = 300000): () => void {
    const intervalId = setInterval(async () => {
      try {
        await this.checkAlerts(organizationId);
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }
}