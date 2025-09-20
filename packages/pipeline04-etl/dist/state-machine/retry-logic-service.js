/**
 * Retry Logic Service with Exponential Backoff and Dead Letter Queue
 * Manages retry logic for failed ETL operations with configurable backoff strategies
 */
import { ETLState } from './types.js';
export const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitterEnabled: true,
    jitterMaxPercentage: 25,
};
export class RetryLogicService {
    supabaseClient;
    config;
    constructor(supabaseClient, config = {}) {
        this.supabaseClient = supabaseClient;
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    }
    /**
     * Handle a failed ETL run and determine retry strategy
     */
    async handleFailure(runId, errorMessage, errorDetails, isTransient = true) {
        try {
            // Get current run information
            const { data: run, error } = await this.supabaseClient
                .from('etl_run')
                .select('*')
                .eq('id', runId)
                .single();
            if (error || !run) {
                return {
                    shouldRetry: false,
                    reason: 'Run not found',
                };
            }
            const currentAttempt = run.retry_count || 0;
            // Check if we've exceeded max retries
            if (currentAttempt >= this.config.maxRetries) {
                // Send to dead letter queue
                const dlqId = await this.addToDeadLetterQueue({
                    runId,
                    fileId: run.file_id,
                    organizationId: run.organization_id,
                    errorMessage,
                    errorDetails,
                    maxRetriesExceeded: true,
                });
                return {
                    shouldRetry: false,
                    deadLetterQueueId: dlqId,
                    reason: `Max retries (${this.config.maxRetries}) exceeded`,
                };
            }
            // For non-transient errors, send directly to DLQ without retries
            if (!isTransient) {
                const dlqId = await this.addToDeadLetterQueue({
                    runId,
                    fileId: run.file_id,
                    organizationId: run.organization_id,
                    errorMessage,
                    errorDetails,
                    maxRetriesExceeded: false,
                });
                return {
                    shouldRetry: false,
                    deadLetterQueueId: dlqId,
                    reason: 'Non-transient error - no retry',
                };
            }
            // Calculate next retry delay with exponential backoff
            const delayMs = this.calculateBackoffDelay(currentAttempt);
            const nextRetryAt = new Date(Date.now() + delayMs);
            // Update run with retry information
            await this.supabaseClient
                .from('etl_run')
                .update({
                retry_count: currentAttempt + 1,
                next_retry_at: nextRetryAt,
                error_message: errorMessage,
                error_details: errorDetails,
                updated_at: new Date(),
            })
                .eq('id', runId);
            return {
                shouldRetry: true,
                nextRetryAt,
                delayMs,
                reason: `Retry ${currentAttempt + 1}/${this.config.maxRetries} scheduled`,
            };
        }
        catch (error) {
            return {
                shouldRetry: false,
                reason: `Failed to handle retry: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Calculate exponential backoff delay with optional jitter
     */
    calculateBackoffDelay(attemptNumber) {
        // Base delay calculation: initialDelay * (multiplier ^ attempt)
        let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptNumber);
        // Cap at max delay
        delay = Math.min(delay, this.config.maxDelayMs);
        // Add jitter if enabled
        if (this.config.jitterEnabled) {
            const jitterRange = delay * (this.config.jitterMaxPercentage / 100);
            const jitter = (Math.random() - 0.5) * 2 * jitterRange;
            delay = Math.max(0, delay + jitter);
        }
        return Math.floor(delay);
    }
    /**
     * Add a failed run to the dead letter queue
     */
    async addToDeadLetterQueue(entry) {
        const dlqEntry = {
            id: `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            run_id: entry.runId,
            file_id: entry.fileId,
            organization_id: entry.organizationId,
            error_message: entry.errorMessage,
            error_details: entry.errorDetails,
            max_retries_exceeded: entry.maxRetriesExceeded,
            marked_for_retry: false,
            retry_after: entry.retryAfter,
            created_at: new Date(),
            updated_at: new Date(),
        };
        const { data, error } = await this.supabaseClient
            .from('etl_dead_letter_queue')
            .insert(dlqEntry)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to add to dead letter queue: ${error.message}`);
        }
        return data.id;
    }
    /**
     * Get retry-ready runs that should be processed now
     */
    async getRetryReadyRuns(organizationId) {
        try {
            let query = this.supabaseClient
                .from('etl_run')
                .select('id, file_id, organization_id, current_state, retry_count, next_retry_at, error_message')
                .not('next_retry_at', 'is', null)
                .lte('next_retry_at', new Date().toISOString())
                .eq('current_state', ETLState.FAILED);
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
            const { data, error } = await query.order('next_retry_at', { ascending: true });
            if (error)
                throw error;
            return (data || []).map((run) => ({
                id: run.id,
                fileId: run.file_id,
                organizationId: run.organization_id,
                currentState: run.current_state,
                retryCount: run.retry_count,
                nextRetryAt: new Date(run.next_retry_at),
                errorMessage: run.error_message,
            }));
        }
        catch (error) {
            console.error('Failed to get retry-ready runs:', error);
            return [];
        }
    }
    /**
     * Clear retry schedule for a run (e.g., after successful retry)
     */
    async clearRetrySchedule(runId) {
        await this.supabaseClient
            .from('etl_run')
            .update({
            next_retry_at: null,
            error_message: null,
            error_details: null,
            updated_at: new Date(),
        })
            .eq('id', runId);
    }
    /**
     * Get dead letter queue entries
     */
    async getDeadLetterQueueEntries(organizationId, limit = 100, offset = 0) {
        try {
            let query = this.supabaseClient
                .from('etl_dead_letter_queue')
                .select('*');
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return (data || []).map((entry) => ({
                id: entry.id,
                runId: entry.run_id,
                fileId: entry.file_id,
                organizationId: entry.organization_id,
                errorMessage: entry.error_message,
                errorDetails: entry.error_details,
                maxRetriesExceeded: entry.max_retries_exceeded,
                markedForRetry: entry.marked_for_retry,
                retryAfter: entry.retry_after ? new Date(entry.retry_after) : undefined,
                createdAt: new Date(entry.created_at),
                updatedAt: new Date(entry.updated_at),
            }));
        }
        catch (error) {
            console.error('Failed to get dead letter queue entries:', error);
            return [];
        }
    }
    /**
     * Mark a dead letter queue entry for retry
     */
    async markForRetry(dlqId, retryAfter) {
        try {
            const { error } = await this.supabaseClient
                .from('etl_dead_letter_queue')
                .update({
                marked_for_retry: true,
                retry_after: retryAfter || new Date(),
                updated_at: new Date(),
            })
                .eq('id', dlqId);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Remove an entry from the dead letter queue
     */
    async removeFromDeadLetterQueue(dlqId) {
        try {
            const { error } = await this.supabaseClient
                .from('etl_dead_letter_queue')
                .delete()
                .eq('id', dlqId);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get retry statistics for monitoring
     */
    async getRetryStats(organizationId) {
        try {
            const { data, error } = await this.supabaseClient
                .rpc('get_retry_stats', { p_organization_id: organizationId });
            if (error)
                throw error;
            return data || {
                totalFailedRuns: 0,
                retryReadyRuns: 0,
                deadLetterQueueEntries: 0,
                averageRetryCount: 0,
                retrySuccessRate: 0,
            };
        }
        catch (error) {
            console.error('Failed to get retry stats:', error);
            return {
                totalFailedRuns: 0,
                retryReadyRuns: 0,
                deadLetterQueueEntries: 0,
                averageRetryCount: 0,
                retrySuccessRate: 0,
            };
        }
    }
    /**
     * Process marked DLQ entries for retry
     */
    async processMarkedDLQEntries(organizationId) {
        try {
            let query = this.supabaseClient
                .from('etl_dead_letter_queue')
                .select('*')
                .eq('marked_for_retry', true)
                .lte('retry_after', new Date().toISOString());
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
            const { data: entries, error } = await query;
            if (error)
                throw error;
            const processed = [];
            const errors = [];
            for (const entry of entries || []) {
                try {
                    // Reset the run's retry count and schedule immediate retry
                    await this.supabaseClient
                        .from('etl_run')
                        .update({
                        retry_count: 0,
                        next_retry_at: new Date(),
                        current_state: ETLState.FAILED,
                        updated_at: new Date(),
                    })
                        .eq('id', entry.run_id);
                    // Remove from DLQ
                    await this.removeFromDeadLetterQueue(entry.id);
                    processed.push(entry.id);
                }
                catch (error) {
                    const errorMsg = `Failed to process DLQ entry ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                }
            }
            return {
                processed: processed.length,
                errors,
            };
        }
        catch (error) {
            return {
                processed: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Clean up old dead letter queue entries
     */
    async cleanupOldDLQEntries(olderThanDays = 30, organizationId) {
        try {
            const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
            let query = this.supabaseClient
                .from('etl_dead_letter_queue')
                .delete()
                .lt('created_at', cutoffDate.toISOString())
                .eq('marked_for_retry', false); // Only delete entries not marked for retry
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
            const { data, error } = await query.select();
            if (error) {
                return { deletedCount: 0, errors: [error.message] };
            }
            return {
                deletedCount: data?.length || 0,
                errors: [],
            };
        }
        catch (error) {
            return {
                deletedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Update retry configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current retry configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
