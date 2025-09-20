/**
 * Optimistic Locking Service
 * Provides concurrency control for ETL operations using version-based optimistic locking
 */
import { LockingOptions, LockingResult, VersionedRecord, ETLStateTransitionRequest } from './types.js';
export { LockingOptions, LockingResult, VersionedRecord, ETLStateTransitionRequest };
export declare class OptimisticLockingService {
    private supabaseClient;
    private defaultOptions;
    constructor(supabaseClient: any, options?: LockingOptions);
    /**
     * Update a record with optimistic locking
     */
    updateWithLock<T extends VersionedRecord>(tableName: string, id: string, updates: Partial<T>, options?: LockingOptions): Promise<LockingResult<T>>;
    /**
     * Update multiple records with optimistic locking in a transaction
     */
    updateMultipleWithLock<T extends VersionedRecord>(updates: Array<{
        tableName: string;
        id: string;
        updates: Partial<T>;
        expectedVersion?: number;
    }>, options?: LockingOptions): Promise<LockingResult<T[]>>;
    /**
     * Safely increment a counter field with optimistic locking
     */
    incrementCounter(tableName: string, id: string, field: string, incrementBy?: number, options?: LockingOptions): Promise<LockingResult<any>>;
    /**
     * Check if a record exists and get its current version
     */
    getRecordVersion(tableName: string, id: string): Promise<{
        exists: boolean;
        version?: number;
        data?: any;
    }>;
    /**
     * Lock a record for exclusive access (pessimistic locking)
     */
    lockRecord(tableName: string, id: string, lockTimeout?: number, // 30 seconds
    lockId?: string): Promise<LockingResult<{
        lockId: string;
        expiresAt: Date;
    }>>;
    /**
     * Release a record lock
     */
    releaseLock(tableName: string, id: string, lockId: string): Promise<LockingResult<void>>;
    /**
     * Check and release expired locks
     */
    releaseExpiredLocks(tableName: string): Promise<{
        releasedCount: number;
        errors: string[];
    }>;
    /**
     * Execute a function with automatic lock acquisition and release
     */
    withLock<T>(tableName: string, id: string, operation: (lockId: string) => Promise<T>, lockTimeout?: number): Promise<LockingResult<T>>;
    /**
     * Utility function to add delay
     */
    private delay;
    /**
     * Get locking statistics for monitoring
     */
    getLockingStats(tableName: string): Promise<{
        totalRecords: number;
        lockedRecords: number;
        expiredLocks: number;
        averageLockDuration: number;
    }>;
    /**
     * Perform a safe ETL state transition with concurrency control
     */
    safeStateTransition(request: ETLStateTransitionRequest, options?: LockingOptions): Promise<LockingResult<any>>;
    /**
     * Check for stale processing sessions
     */
    checkForStaleProcessing(tableName: string, recordId: string, options: LockingOptions): Promise<LockingResult<void>>;
    /**
     * Clear stale processing sessions
     */
    clearStaleProcessingSessions(tableName: string, timeoutMs?: number): Promise<{
        clearedCount: number;
        errors: string[];
    }>;
    /**
     * Validate state transition using database function
     */
    private validateStateTransition;
    /**
     * Check if a processing session is still active
     */
    private isProcessingSessionActive;
    /**
     * Release processing session
     */
    releaseProcessingSession(tableName: string, recordId: string, sessionId: string): Promise<LockingResult<void>>;
    /**
     * Get concurrency statistics for monitoring
     */
    getConcurrencyStats(tableName: string, organizationId?: string): Promise<{
        activeProcessingSessions: number;
        staleSessions: number;
        activeLocks: number;
        expiredLocks: number;
        recentConflicts: number;
    }>;
}
