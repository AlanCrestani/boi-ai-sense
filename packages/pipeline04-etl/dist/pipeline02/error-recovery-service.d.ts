/**
 * Pipeline 02 Error Recovery Service
 * Handles errors, implements retry logic, and manages failure recovery
 */
import { Pipeline02LoggingService } from './logging-service.js';
import { ETLState } from '../state-machine/types.js';
export declare enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    DIMENSION_LOOKUP_ERROR = "DIMENSION_LOOKUP_ERROR",
    UPSERT_ERROR = "UPSERT_ERROR",
    PARSING_ERROR = "PARSING_ERROR",
    STATE_TRANSITION_ERROR = "STATE_TRANSITION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",// Non-critical, processing can continue
    MEDIUM = "MEDIUM",// Significant issue, may affect some records
    HIGH = "HIGH",// Critical issue, processing should be retried
    CRITICAL = "CRITICAL"
}
export interface ErrorDetails {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    affectedRecords?: any[];
    retryCount?: number;
    timestamp: Date;
    stackTrace?: string;
    suggestedAction?: string;
}
export interface RetryPolicy {
    maxRetries: number;
    backoffType: 'linear' | 'exponential' | 'fixed';
    baseDelay: number;
    maxDelay: number;
    retryableErrors: ErrorType[];
}
export interface RecoveryStrategy {
    errorType: ErrorType;
    strategy: 'retry' | 'skip' | 'fallback' | 'manual';
    maxAttempts: number;
    fallbackAction?: () => Promise<any>;
    requiresManualIntervention: boolean;
}
export interface ErrorRecoveryContext {
    fileId: string;
    runId?: string;
    organizationId: string;
    currentState: ETLState;
    attemptNumber: number;
    lastError?: ErrorDetails;
}
export declare class Pipeline02ErrorRecoveryService {
    private loggingService;
    private retryPolicy;
    private recoveryStrategies;
    constructor(loggingService: Pipeline02LoggingService, retryPolicy?: Partial<RetryPolicy>, recoveryStrategies?: RecoveryStrategy[]);
    /**
     * Handle an error with automatic recovery attempts
     */
    handleError<T>(error: Error | any, context: ErrorRecoveryContext, operation: () => Promise<T>): Promise<T>;
    /**
     * Execute recovery strategy based on error type
     */
    private executeRecoveryStrategy;
    /**
     * Retry operation with exponential backoff
     */
    private retryOperation;
    /**
     * Execute fallback strategy
     */
    private executeFallback;
    /**
     * Calculate retry delay based on backoff type
     */
    private calculateRetryDelay;
    /**
     * Analyze error and classify it
     */
    private analyzeError;
    /**
     * Get error statistics for monitoring
     */
    getErrorStatistics(fileId: string, runId?: string): Promise<{
        totalErrors: number;
        errorsByType: Record<ErrorType, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        retryAttempts: number;
        successfulRecoveries: number;
        manualInterventionsRequired: number;
    }>;
    /**
     * Check if an error is recoverable
     */
    isRecoverable(errorType: ErrorType): boolean;
    /**
     * Get suggested recovery action for an error
     */
    getSuggestedAction(errorType: ErrorType): string;
    /**
     * Delay utility for retry backoff
     */
    private delay;
}
