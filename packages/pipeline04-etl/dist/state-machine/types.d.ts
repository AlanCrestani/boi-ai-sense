/**
 * State Machine Types for ETL Processing
 * Defines states, transitions, and related types for the ETL state machine
 */
/**
 * Possible states for an ETL file/run
 */
export declare enum ETLState {
    UPLOADED = "uploaded",
    PARSING = "parsing",
    PARSED = "parsed",
    VALIDATING = "validating",
    VALIDATED = "validated",
    AWAITING_APPROVAL = "awaiting_approval",
    APPROVED = "approved",
    LOADING = "loading",
    LOADED = "loaded",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
/**
 * Valid state transitions
 */
export declare const STATE_TRANSITIONS: Record<ETLState, ETLState[]>;
/**
 * State metadata for tracking transitions
 */
export interface StateMetadata {
    state: ETLState;
    timestamp: Date;
    userId?: string;
    message?: string;
    error?: string;
    metadata?: Record<string, any>;
}
/**
 * ETL File record structure
 */
export interface ETLFile {
    id: string;
    organizationId: string;
    filename: string;
    filepath: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    currentState: ETLState;
    stateHistory: StateMetadata[];
    uploadedAt: Date;
    uploadedBy: string;
    parsedAt?: Date;
    validatedAt?: Date;
    approvedAt?: Date;
    approvedBy?: string;
    loadedAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
    metadata?: Record<string, any>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * ETL Run record structure
 */
export interface ETLRun {
    id: string;
    fileId: string;
    organizationId: string;
    runNumber: number;
    currentState: ETLState;
    stateHistory: StateMetadata[];
    startedAt: Date;
    completedAt?: Date;
    processingBy?: string;
    processingStartedAt?: Date;
    recordsTotal?: number;
    recordsProcessed?: number;
    recordsFailed?: number;
    errorMessage?: string;
    errorDetails?: Record<string, any>;
    retryCount: number;
    nextRetryAt?: Date;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * ETL Run Log entry structure
 */
export interface ETLRunLog {
    id: string;
    runId: string;
    fileId: string;
    organizationId: string;
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    details?: Record<string, any>;
    state?: ETLState;
    previousState?: ETLState;
    userId?: string;
    action?: string;
    createdAt: Date;
}
/**
 * State transition request
 */
export interface StateTransitionRequest {
    fileId?: string;
    runId?: string;
    fromState: ETLState;
    toState: ETLState;
    userId?: string;
    message?: string;
    metadata?: Record<string, any>;
}
/**
 * State transition result
 */
export interface StateTransitionResult {
    success: boolean;
    previousState: ETLState;
    currentState: ETLState;
    timestamp: Date;
    error?: string;
    logId?: string;
}
/**
 * State machine configuration
 */
export interface StateMachineConfig {
    requireApproval: boolean;
    autoRetry: boolean;
    maxRetries: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    staleProcessingTimeoutMs: number;
    deadLetterQueueEnabled: boolean;
}
/**
 * Default state machine configuration
 */
export declare const DEFAULT_STATE_MACHINE_CONFIG: StateMachineConfig;
/**
 * Optimistic locking options
 */
export interface LockingOptions {
    maxRetries?: number;
    retryDelayMs?: number;
    backoffMultiplier?: number;
    sessionId?: string;
    processingTimeout?: number;
}
/**
 * Locking operation result
 */
export interface LockingResult<T = any> {
    success: boolean;
    data?: T;
    currentVersion?: number;
    retryAttempt?: number;
    error?: string;
    conflictedField?: string;
    sessionId?: string;
    isStaleProcessing?: boolean;
}
/**
 * Versioned record interface for optimistic locking
 */
export interface VersionedRecord {
    id: string;
    version: number;
    updated_at?: Date;
    processing_by?: string;
    processing_started_at?: Date;
    locked_by?: string;
    locked_at?: Date;
    lock_expires_at?: Date;
    current_state?: string;
    state_history?: any[];
    metadata?: Record<string, any>;
    [key: string]: any;
}
/**
 * ETL state transition request for concurrency control
 */
export interface ETLStateTransitionRequest {
    id: string;
    tableName: 'etl_file' | 'etl_run';
    fromState: string;
    toState: string;
    expectedVersion?: number;
    sessionId: string;
    processingBy: string;
    metadata?: Record<string, any>;
}
