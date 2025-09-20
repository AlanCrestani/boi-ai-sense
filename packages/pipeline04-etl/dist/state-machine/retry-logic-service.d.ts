/**
 * Retry Logic Service with Exponential Backoff and Dead Letter Queue
 * Manages retry logic for failed ETL operations with configurable backoff strategies
 */
import { ETLState } from './types.js';
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitterEnabled: boolean;
    jitterMaxPercentage: number;
}
export interface RetryContext {
    runId: string;
    fileId: string;
    organizationId: string;
    currentAttempt: number;
    maxRetries: number;
    lastError: string;
    errorDetails?: Record<string, any>;
    nextRetryAt?: Date;
    isTransient: boolean;
    backoffDelayMs: number;
}
export interface DeadLetterQueueEntry {
    id: string;
    runId: string;
    fileId: string;
    organizationId: string;
    errorMessage: string;
    errorDetails?: Record<string, any>;
    maxRetriesExceeded: boolean;
    markedForRetry: boolean;
    retryAfter?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RetryResult {
    shouldRetry: boolean;
    nextRetryAt?: Date;
    delayMs?: number;
    deadLetterQueueId?: string;
    reason: string;
}
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
export declare class RetryLogicService {
    private supabaseClient;
    private config;
    constructor(supabaseClient: any, config?: Partial<RetryConfig>);
    /**
     * Handle a failed ETL run and determine retry strategy
     */
    handleFailure(runId: string, errorMessage: string, errorDetails?: Record<string, any>, isTransient?: boolean): Promise<RetryResult>;
    /**
     * Calculate exponential backoff delay with optional jitter
     */
    calculateBackoffDelay(attemptNumber: number): number;
    /**
     * Add a failed run to the dead letter queue
     */
    addToDeadLetterQueue(entry: {
        runId: string;
        fileId: string;
        organizationId: string;
        errorMessage: string;
        errorDetails?: Record<string, any>;
        maxRetriesExceeded: boolean;
        retryAfter?: Date;
    }): Promise<string>;
    /**
     * Get retry-ready runs that should be processed now
     */
    getRetryReadyRuns(organizationId?: string): Promise<Array<{
        id: string;
        fileId: string;
        organizationId: string;
        currentState: ETLState;
        retryCount: number;
        nextRetryAt: Date;
        errorMessage: string;
    }>>;
    /**
     * Clear retry schedule for a run (e.g., after successful retry)
     */
    clearRetrySchedule(runId: string): Promise<void>;
    /**
     * Get dead letter queue entries
     */
    getDeadLetterQueueEntries(organizationId?: string, limit?: number, offset?: number): Promise<DeadLetterQueueEntry[]>;
    /**
     * Mark a dead letter queue entry for retry
     */
    markForRetry(dlqId: string, retryAfter?: Date): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Remove an entry from the dead letter queue
     */
    removeFromDeadLetterQueue(dlqId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get retry statistics for monitoring
     */
    getRetryStats(organizationId?: string): Promise<{
        totalFailedRuns: number;
        retryReadyRuns: number;
        deadLetterQueueEntries: number;
        averageRetryCount: number;
        retrySuccessRate: number;
    }>;
    /**
     * Process marked DLQ entries for retry
     */
    processMarkedDLQEntries(organizationId?: string): Promise<{
        processed: number;
        errors: string[];
    }>;
    /**
     * Clean up old dead letter queue entries
     */
    cleanupOldDLQEntries(olderThanDays?: number, organizationId?: string): Promise<{
        deletedCount: number;
        errors: string[];
    }>;
    /**
     * Update retry configuration
     */
    updateConfig(newConfig: Partial<RetryConfig>): void;
    /**
     * Get current retry configuration
     */
    getConfig(): RetryConfig;
}
