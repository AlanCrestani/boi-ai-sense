/**
 * State Machine Types for ETL Processing
 * Defines states, transitions, and related types for the ETL state machine
 */

/**
 * Possible states for an ETL file/run
 */
export enum ETLState {
  UPLOADED = 'uploaded',
  PARSING = 'parsing',
  PARSED = 'parsed',
  VALIDATING = 'validating',
  VALIDATED = 'validated',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  LOADING = 'loading',
  LOADED = 'loaded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Valid state transitions
 */
export const STATE_TRANSITIONS: Record<ETLState, ETLState[]> = {
  [ETLState.UPLOADED]: [ETLState.PARSING, ETLState.CANCELLED],
  [ETLState.PARSING]: [ETLState.PARSED, ETLState.FAILED],
  [ETLState.PARSED]: [ETLState.VALIDATING, ETLState.CANCELLED],
  [ETLState.VALIDATING]: [ETLState.VALIDATED, ETLState.FAILED],
  [ETLState.VALIDATED]: [ETLState.AWAITING_APPROVAL, ETLState.LOADING, ETLState.CANCELLED],
  [ETLState.AWAITING_APPROVAL]: [ETLState.APPROVED, ETLState.CANCELLED],
  [ETLState.APPROVED]: [ETLState.LOADING, ETLState.CANCELLED],
  [ETLState.LOADING]: [ETLState.LOADED, ETLState.FAILED],
  [ETLState.LOADED]: [], // Terminal state
  [ETLState.FAILED]: [ETLState.PARSING], // Can retry from failed
  [ETLState.CANCELLED]: [ETLState.PARSING], // Can retry from cancelled
};

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
  version: number; // For optimistic locking
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
  version: number; // For optimistic locking
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
export const DEFAULT_STATE_MACHINE_CONFIG: StateMachineConfig = {
  requireApproval: false, // Auto-approve by default
  autoRetry: true,
  maxRetries: 3,
  retryDelayMs: 5000, // 5 seconds
  retryBackoffMultiplier: 2, // Exponential backoff
  staleProcessingTimeoutMs: 600000, // 10 minutes
  deadLetterQueueEnabled: true,
};

/**
 * Optimistic locking options
 */
export interface LockingOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  backoffMultiplier?: number;
  sessionId?: string;
  processingTimeout?: number; // in milliseconds
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
  [key: string]: any; // Allow additional properties
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

/**
 * Error classification for retry logic
 */
export enum ErrorType {
  TRANSIENT = 'transient',     // Network issues, temporary database unavailability
  PERMANENT = 'permanent',     // Schema errors, validation failures, malformed data
  RATE_LIMITED = 'rate_limited', // API rate limiting
  RESOURCE = 'resource'        // Memory, disk space, connection pool exhaustion
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryableErrors: ErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,      // 1 second
  maxDelayMs: 300000,     // 5 minutes
  backoffMultiplier: 2,   // Exponential backoff
  jitterEnabled: true,    // Add randomization to prevent thundering herd
  retryableErrors: [ErrorType.TRANSIENT, ErrorType.RATE_LIMITED, ErrorType.RESOURCE]
};

/**
 * Retry attempt metadata
 */
export interface RetryAttempt {
  attemptNumber: number;
  scheduledAt: Date;
  executedAt?: Date;
  errorType: ErrorType;
  errorMessage: string;
  nextRetryAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Dead letter queue entry
 */
export interface DeadLetterQueueEntry {
  id: string;
  organizationId: string;
  entityType: 'etl_file' | 'etl_run';
  entityId: string;
  originalError: string;
  errorType: ErrorType;
  retryAttempts: RetryAttempt[];
  totalRetries: number;
  firstFailureAt: Date;
  lastRetryAt: Date;
  maxRetriesExceeded: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retry operation result
 */
export interface RetryResult<T = any> {
  success: boolean;
  result?: T;
  shouldRetry: boolean;
  nextRetryAt?: Date;
  errorType?: ErrorType;
  errorMessage?: string;
  attemptNumber: number;
  finalAttempt: boolean;
  sentToDeadLetterQueue?: boolean;
}