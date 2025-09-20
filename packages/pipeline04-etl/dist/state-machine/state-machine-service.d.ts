/**
 * ETL State Machine Service
 * High-level service for managing ETL file and run states
 */
import { DuplicateDetectionResult, ReprocessingOptions } from './checksum-service.js';
import { StagingCleanupOptions, CleanupResult } from './staging-cleanup-service.js';
import { LockingOptions, LockingResult } from './optimistic-locking-service.js';
import { RetryConfig, RetryResult } from './retry-logic-service.js';
import { ETLState, ETLFile, ETLRun, StateTransitionResult, StateMachineConfig } from './types.js';
export declare class ETLStateMachineService {
    private stateMachine;
    private checksumService;
    private stagingCleanupService;
    private lockingService;
    private retryLogicService;
    private supabaseClient;
    constructor(supabaseClient: any, config?: Partial<StateMachineConfig>, lockingOptions?: LockingOptions, retryConfig?: Partial<RetryConfig>);
    /**
     * Create a new ETL file record
     */
    createETLFile(file: {
        id: string;
        organizationId: string;
        filename: string;
        filepath: string;
        fileSize: number;
        mimeType: string;
        checksum: string;
        uploadedBy: string;
        metadata?: Record<string, any>;
    }): Promise<ETLFile>;
    /**
     * Create a new ETL run for a file
     */
    createETLRun(params: {
        fileId: string;
        organizationId: string;
        startedBy?: string;
        metadata?: Record<string, any>;
    }): Promise<ETLRun>;
    /**
     * Transition file state with optimistic locking
     */
    transitionFileState(fileId: string, toState: ETLState, userId?: string, message?: string, metadata?: Record<string, any>, options?: LockingOptions): Promise<StateTransitionResult>;
    /**
     * Transition run state with optimistic locking
     */
    transitionRunState(runId: string, toState: ETLState, userId?: string, message?: string, metadata?: Record<string, any>, options?: LockingOptions): Promise<StateTransitionResult>;
    /**
     * Check for duplicate file by checksum
     */
    findDuplicateFile(checksum: string, organizationId: string, currentFileId?: string): Promise<DuplicateDetectionResult>;
    /**
     * Calculate file checksum
     */
    calculateFileChecksum(filepath: string, algorithm?: 'sha256' | 'md5'): Promise<string>;
    /**
     * Calculate checksum from buffer
     */
    calculateBufferChecksum(buffer: Buffer, algorithm?: 'sha256' | 'md5'): string;
    /**
     * Handle forced reprocessing for duplicate files
     */
    handleForcedReprocessing(checksum: string, organizationId: string, options: ReprocessingOptions): Promise<{
        allowed: boolean;
        originalFileId?: string;
        reprocessingRecordId?: string;
        reason: string;
    }>;
    /**
     * Get checksum history for a file
     */
    getChecksumHistory(checksum: string, organizationId: string): Promise<Array<{
        id: string;
        filename: string;
        uploadedAt: Date;
        uploadedBy: string;
        currentState: string;
        processedRecords?: number;
    }>>;
    /**
     * Start processing a run with optional staging cleanup
     */
    startProcessing(runId: string, processingBy: string, cleanupOptions?: Partial<StagingCleanupOptions>): Promise<StateTransitionResult & {
        cleanupResult?: CleanupResult;
    }>;
    /**
     * Complete parsing phase
     */
    completeParsing(runId: string, recordsTotal: number, userId?: string): Promise<StateTransitionResult>;
    /**
     * Complete validation phase
     */
    completeValidation(runId: string, recordsProcessed: number, recordsFailed: number, userId?: string): Promise<StateTransitionResult>;
    /**
     * Handle run failure with retry logic
     */
    handleRunFailure(runId: string, errorMessage: string, errorDetails?: Record<string, any>, isTransient?: boolean): Promise<RetryResult>;
    /**
     * Get file by ID
     */
    getETLFile(fileId: string): Promise<ETLFile | null>;
    /**
     * Get run by ID
     */
    getETLRun(runId: string): Promise<ETLRun | null>;
    /**
     * Get runs for a file
     */
    getFileRuns(fileId: string): Promise<ETLRun[]>;
    /**
     * Check and release stale locks
     */
    checkAndReleaseStaleLocKs(): Promise<string[]>;
    /**
     * Clean staging tables for reprocessing
     */
    cleanupStagingTables(options: StagingCleanupOptions): Promise<CleanupResult>;
    /**
     * Verify staging cleanup was successful
     */
    verifyStagingCleanup(options: StagingCleanupOptions): Promise<{
        isClean: boolean;
        remainingRecords: Record<string, number>;
        details: string[];
    }>;
    /**
     * Get audit trail for ETL operations
     */
    getAuditTrail(options: {
        organizationId: string;
        fileId?: string;
        runId?: string;
        action?: string;
        level?: string;
        limit?: number;
        offset?: number;
    }): Promise<import("./staging-cleanup-service.js").AuditEvent[]>;
    /**
     * Get audit statistics
     */
    getAuditStats(organizationId: string, timeRangeHours?: number): Promise<{
        totalEvents: number;
        eventsByLevel: Record<string, number>;
        eventsByAction: Record<string, number>;
        successRate: number;
        avgDuration: number;
        recentErrors: import("./staging-cleanup-service.js").AuditEvent[];
    }>;
    /**
     * Clean up old audit records
     */
    cleanupOldAuditRecords(organizationId: string, retainDays?: number, dryRun?: boolean): Promise<CleanupResult>;
    /**
     * Update record with optimistic locking
     */
    updateWithLock<T>(tableName: string, id: string, updates: Partial<T>, options?: LockingOptions): Promise<LockingResult<T>>;
    /**
     * Execute operation with exclusive lock
     */
    withLock<T>(tableName: string, id: string, operation: (lockId: string) => Promise<T>, lockTimeout?: number): Promise<LockingResult<T>>;
    /**
     * Release expired locks for maintenance
     */
    releaseExpiredLocks(): Promise<{
        etlFile: number;
        etlRun: number;
    }>;
    /**
     * Get locking statistics for monitoring
     */
    getLockingStats(): Promise<{
        etlFile: any;
        etlRun: any;
    }>;
    /**
     * Get retry-ready runs for processing
     */
    getRetryReadyRuns(organizationId?: string): Promise<{
        id: string;
        fileId: string;
        organizationId: string;
        currentState: ETLState;
        retryCount: number;
        nextRetryAt: Date;
        errorMessage: string;
    }[]>;
    /**
     * Clear retry schedule after successful processing
     */
    clearRetrySchedule(runId: string): Promise<void>;
    /**
     * Get dead letter queue entries
     */
    getDeadLetterQueueEntries(organizationId?: string, limit?: number, offset?: number): Promise<import("./retry-logic-service.js").DeadLetterQueueEntry[]>;
    /**
     * Mark DLQ entry for retry
     */
    markDLQForRetry(dlqId: string, retryAfter?: Date): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Remove entry from dead letter queue
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
     * Clean up old DLQ entries
     */
    cleanupOldDLQEntries(olderThanDays?: number, organizationId?: string): Promise<{
        deletedCount: number;
        errors: string[];
    }>;
    /**
     * Update retry configuration
     */
    updateRetryConfig(newConfig: Partial<RetryConfig>): void;
    /**
     * Get current retry configuration
     */
    getRetryConfig(): RetryConfig;
    /**
     * Map database record to ETLFile
     */
    private mapDbToETLFile;
    /**
     * Map database record to ETLRun
     */
    private mapDbToETLRun;
}
