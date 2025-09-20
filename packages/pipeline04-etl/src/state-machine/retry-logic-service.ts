/**
 * Retry Logic Service for ETL Operations
 * Implements exponential backoff, dead letter queue, and error categorization
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  ErrorType,
  RetryAttempt,
  RetryResult,
  DeadLetterQueueEntry,
  ETLRun,
  ETLFile
} from './types.js';

export class RetryLogicService {
  private supabase: SupabaseClient;
  private config: RetryConfig;

  constructor(supabase: SupabaseClient, config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.supabase = supabase;
    this.config = config;
  }

  /**
   * Calculate next retry delay using exponential backoff with jitter
   */
  calculateNextRetryDelay(attemptNumber: number, config?: Partial<RetryConfig>): number {
    const cfg = { ...this.config, ...config };

    // Calculate exponential backoff: base * (multiplier ^ attempt)
    let delay = cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attemptNumber - 1);

    // Cap at maximum delay
    delay = Math.min(delay, cfg.maxDelayMs);

    // Add jitter to prevent thundering herd problem
    if (cfg.jitterEnabled) {
      // Add random jitter ±25% of the delay
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      delay = Math.max(cfg.baseDelayMs, delay + jitter);
    }

    return Math.floor(delay);
  }

  /**
   * Classify error type for retry decisions
   */
  classifyError(error: Error | string): ErrorType {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowercaseMsg = errorMessage.toLowerCase();

    // Network and connection issues (transient)
    if (lowercaseMsg.includes('network') ||
        lowercaseMsg.includes('timeout') ||
        lowercaseMsg.includes('connection') ||
        lowercaseMsg.includes('econnreset') ||
        lowercaseMsg.includes('enotfound') ||
        lowercaseMsg.includes('temporary')) {
      return ErrorType.TRANSIENT;
    }

    // Rate limiting (transient)
    if (lowercaseMsg.includes('rate limit') ||
        lowercaseMsg.includes('too many requests') ||
        lowercaseMsg.includes('429')) {
      return ErrorType.RATE_LIMITED;
    }

    // Resource exhaustion (usually transient)
    if (lowercaseMsg.includes('memory') ||
        lowercaseMsg.includes('disk space') ||
        lowercaseMsg.includes('pool exhausted') ||
        lowercaseMsg.includes('resource') ||
        lowercaseMsg.includes('lock timeout')) {
      return ErrorType.RESOURCE;
    }

    // Schema, validation, and data errors (permanent)
    if (lowercaseMsg.includes('validation') ||
        lowercaseMsg.includes('schema') ||
        lowercaseMsg.includes('constraint') ||
        lowercaseMsg.includes('foreign key') ||
        lowercaseMsg.includes('parse') ||
        lowercaseMsg.includes('invalid data') ||
        lowercaseMsg.includes('malformed')) {
      return ErrorType.PERMANENT;
    }

    // Default to transient for unknown errors (safer approach)
    return ErrorType.TRANSIENT;
  }

  /**
   * Check if error type is retryable based on configuration
   */
  isRetryable(errorType: ErrorType): boolean {
    return this.config.retryableErrors.includes(errorType);
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    organizationId: string,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const cfg = { ...this.config, ...config };
    let lastError: Error | null = null;
    let attemptNumber = 1;

    // Get current retry count from database
    const currentRetryCount = await this.getCurrentRetryCount(entityType, entityId);
    attemptNumber = currentRetryCount + 1;

    while (attemptNumber <= cfg.maxRetries + 1) { // +1 for initial attempt
      try {
        const result = await operation();

        // Success - reset retry count if this was a retry
        if (attemptNumber > 1) {
          await this.resetRetryCount(entityType, entityId);
        }

        return {
          success: true,
          result,
          shouldRetry: false,
          attemptNumber,
          finalAttempt: false
        };
      } catch (error) {
        lastError = error as Error;
        const errorType = this.classifyError(lastError);
        const isRetryable = this.isRetryable(errorType);
        const isLastAttempt = attemptNumber >= cfg.maxRetries + 1;

        // Log the retry attempt
        await this.logRetryAttempt(entityType, entityId, attemptNumber, errorType, lastError.message);

        if (!isRetryable || isLastAttempt) {
          // Send to dead letter queue if max retries exceeded
          if (isLastAttempt && isRetryable) {
            await this.sendToDeadLetterQueue(
              entityType,
              entityId,
              organizationId,
              lastError.message,
              errorType,
              attemptNumber - 1
            );
          }

          return {
            success: false,
            shouldRetry: false,
            errorType,
            errorMessage: lastError.message,
            attemptNumber,
            finalAttempt: isLastAttempt,
            sentToDeadLetterQueue: isLastAttempt && isRetryable
          };
        }

        // Calculate next retry time
        const delayMs = this.calculateNextRetryDelay(attemptNumber, cfg);
        const nextRetryAt = new Date(Date.now() + delayMs);

        // Update retry information in database
        await this.updateRetryInfo(entityType, entityId, attemptNumber, nextRetryAt);

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delayMs));

        attemptNumber++;
      }
    }

    // This should never be reached, but included for completeness
    return {
      success: false,
      shouldRetry: false,
      errorType: this.classifyError(lastError!),
      errorMessage: lastError?.message || 'Unknown error',
      attemptNumber: attemptNumber - 1,
      finalAttempt: true,
      sentToDeadLetterQueue: true
    };
  }

  /**
   * Get current retry count from database
   */
  private async getCurrentRetryCount(entityType: 'etl_file' | 'etl_run', entityId: string): Promise<number> {
    const tableName = entityType === 'etl_file' ? 'etl_file' : 'etl_run';
    const { data, error } = await this.supabase
      .from(tableName)
      .select('retry_count')
      .eq('id', entityId)
      .single();

    if (error) {
      console.warn(`Failed to get retry count for ${entityType} ${entityId}:`, error);
      return 0;
    }

    return data?.retry_count || 0;
  }

  /**
   * Update retry information in database
   */
  private async updateRetryInfo(
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    retryCount: number,
    nextRetryAt: Date
  ): Promise<void> {
    const tableName = entityType === 'etl_file' ? 'etl_file' : 'etl_run';

    const { error } = await this.supabase
      .from(tableName)
      .update({
        retry_count: retryCount,
        next_retry_at: nextRetryAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId);

    if (error) {
      console.error(`Failed to update retry info for ${entityType} ${entityId}:`, error);
    }
  }

  /**
   * Reset retry count after successful operation
   */
  private async resetRetryCount(entityType: 'etl_file' | 'etl_run', entityId: string): Promise<void> {
    const tableName = entityType === 'etl_file' ? 'etl_file' : 'etl_run';

    const { error } = await this.supabase
      .from(tableName)
      .update({
        retry_count: 0,
        next_retry_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId);

    if (error) {
      console.error(`Failed to reset retry count for ${entityType} ${entityId}:`, error);
    }
  }

  /**
   * Log retry attempt for monitoring and debugging
   */
  private async logRetryAttempt(
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    attemptNumber: number,
    errorType: ErrorType,
    errorMessage: string
  ): Promise<void> {
    // This would typically log to etl_run_log table or monitoring system
    console.log(`Retry attempt ${attemptNumber} for ${entityType} ${entityId}:`, {
      errorType,
      errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send failed entity to dead letter queue
   */
  private async sendToDeadLetterQueue(
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    organizationId: string,
    errorMessage: string,
    errorType: ErrorType,
    totalRetries: number
  ): Promise<void> {
    try {
      const dlqEntry: Omit<DeadLetterQueueEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId,
        entityType,
        entityId,
        originalError: errorMessage,
        errorType,
        retryAttempts: [], // Would be populated from actual retry history
        totalRetries,
        firstFailureAt: new Date(), // Would get from actual first failure
        lastRetryAt: new Date(),
        maxRetriesExceeded: true,
        resolved: false,
        metadata: {
          maxRetries: this.config.maxRetries,
          entityType,
          entityId
        }
      };

      const { error } = await this.supabase
        .from('etl_dead_letter_queue')
        .insert(dlqEntry);

      if (error) {
        console.error(`Failed to insert into dead letter queue:`, error);
      } else {
        console.warn(`Entity ${entityType}:${entityId} sent to dead letter queue after ${totalRetries} retries`);
      }
    } catch (error) {
      console.error(`Error sending to dead letter queue:`, error);
    }
  }

  /**
   * Get entities ready for retry (past their next_retry_at time)
   */
  async getEntitiesReadyForRetry(organizationId: string): Promise<{ files: ETLFile[]; runs: ETLRun[] }> {
    const now = new Date().toISOString();

    const [filesResult, runsResult] = await Promise.all([
      this.supabase
        .from('etl_file')
        .select('*')
        .eq('organization_id', organizationId)
        .gt('retry_count', 0)
        .lte('next_retry_at', now),

      this.supabase
        .from('etl_run')
        .select('*')
        .eq('organization_id', organizationId)
        .gt('retry_count', 0)
        .lte('next_retry_at', now)
    ]);

    return {
      files: filesResult.data || [],
      runs: runsResult.data || []
    };
  }

  /**
   * Get dead letter queue entries for monitoring
   */
  async getDeadLetterQueueEntries(
    organizationId: string,
    limit: number = 100,
    resolved: boolean = false
  ): Promise<DeadLetterQueueEntry[]> {
    const { data, error } = await this.supabase
      .from('etl_dead_letter_queue')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch dead letter queue entries:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Resolve dead letter queue entry (mark as manually fixed)
   */
  async resolveDeadLetterQueueEntry(
    entryId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('etl_dead_letter_queue')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) {
      console.error(`Failed to resolve dead letter queue entry ${entryId}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Get retry statistics for monitoring
   */
  async getRetryStatistics(organizationId: string): Promise<{
    activeRetries: number;
    deadLetterQueueSize: number;
    successRate: number;
    averageRetries: number;
  }> {
    const [activeRetriesResult, dlqResult] = await Promise.all([
      this.supabase
        .from('etl_run')
        .select('retry_count')
        .eq('organization_id', organizationId)
        .gt('retry_count', 0),

      this.supabase
        .from('etl_dead_letter_queue')
        .select('total_retries')
        .eq('organization_id', organizationId)
        .eq('resolved', false)
    ]);

    const activeRetries = activeRetriesResult.data?.length || 0;
    const deadLetterQueueSize = dlqResult.data?.length || 0;

    // Calculate success rate and average retries
    // This is a simplified calculation - in production you'd want more sophisticated metrics
    const totalAttempts = activeRetries + deadLetterQueueSize;
    const successRate = totalAttempts > 0 ? (activeRetries / totalAttempts) * 100 : 100;
    const averageRetries = activeRetriesResult.data?.reduce((sum, item) => sum + (item.retry_count || 0), 0) / Math.max(activeRetries, 1) || 0;

    return {
      activeRetries,
      deadLetterQueueSize,
      successRate,
      averageRetries
    };
  }
}