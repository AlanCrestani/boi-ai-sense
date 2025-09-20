/**
 * Pipeline 02 Error Recovery Service
 * Handles errors, implements retry logic, and manages failure recovery
 */

import { Pipeline02LoggingService, LogLevel, LogCategory } from './logging-service.js';
import { ETLState } from '../state-machine/types.js';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DIMENSION_LOOKUP_ERROR = 'DIMENSION_LOOKUP_ERROR',
  UPSERT_ERROR = 'UPSERT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  STATE_TRANSITION_ERROR = 'STATE_TRANSITION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',           // Non-critical, processing can continue
  MEDIUM = 'MEDIUM',     // Significant issue, may affect some records
  HIGH = 'HIGH',         // Critical issue, processing should be retried
  CRITICAL = 'CRITICAL', // Fatal error, requires manual intervention
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
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
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

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffType: 'exponential',
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.DATABASE_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.UPSERT_ERROR,
  ],
};

const DEFAULT_RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    errorType: ErrorType.VALIDATION_ERROR,
    strategy: 'skip',
    maxAttempts: 1,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.DIMENSION_LOOKUP_ERROR,
    strategy: 'fallback',
    maxAttempts: 2,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.UPSERT_ERROR,
    strategy: 'retry',
    maxAttempts: 3,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.PARSING_ERROR,
    strategy: 'manual',
    maxAttempts: 1,
    requiresManualIntervention: true,
  },
  {
    errorType: ErrorType.STATE_TRANSITION_ERROR,
    strategy: 'retry',
    maxAttempts: 2,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.NETWORK_ERROR,
    strategy: 'retry',
    maxAttempts: 5,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.DATABASE_ERROR,
    strategy: 'retry',
    maxAttempts: 3,
    requiresManualIntervention: false,
  },
  {
    errorType: ErrorType.TIMEOUT_ERROR,
    strategy: 'retry',
    maxAttempts: 2,
    requiresManualIntervention: false,
  },
];

export class Pipeline02ErrorRecoveryService {
  private loggingService: Pipeline02LoggingService;
  private retryPolicy: RetryPolicy;
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy>;

  constructor(
    loggingService: Pipeline02LoggingService,
    retryPolicy?: Partial<RetryPolicy>,
    recoveryStrategies?: RecoveryStrategy[]
  ) {
    this.loggingService = loggingService;
    this.retryPolicy = { ...DEFAULT_RETRY_POLICY, ...retryPolicy };

    this.recoveryStrategies = new Map();
    const strategies = recoveryStrategies || DEFAULT_RECOVERY_STRATEGIES;
    strategies.forEach(strategy => {
      this.recoveryStrategies.set(strategy.errorType, strategy);
    });
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  async handleError<T>(
    error: Error | any,
    context: ErrorRecoveryContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const errorDetails = this.analyzeError(error, context);

    await this.loggingService.error(
      LogCategory.ERROR_HANDLING,
      `Error occurred: ${errorDetails.message}`,
      error,
      {
        errorType: errorDetails.type,
        severity: errorDetails.severity,
        context: errorDetails.context,
        attemptNumber: context.attemptNumber,
      }
    );

    const strategy = this.recoveryStrategies.get(errorDetails.type);
    if (!strategy) {
      throw new Error(`No recovery strategy defined for error type: ${errorDetails.type}`);
    }

    return await this.executeRecoveryStrategy(strategy, errorDetails, context, operation);
  }

  /**
   * Execute recovery strategy based on error type
   */
  private async executeRecoveryStrategy<T>(
    strategy: RecoveryStrategy,
    errorDetails: ErrorDetails,
    context: ErrorRecoveryContext,
    operation: () => Promise<T>
  ): Promise<T> {
    switch (strategy.strategy) {
      case 'retry':
        return await this.retryOperation(operation, errorDetails, context, strategy.maxAttempts);

      case 'skip':
        await this.loggingService.warn(
          LogCategory.ERROR_HANDLING,
          `Skipping operation due to ${errorDetails.type}`,
          { errorDetails, context }
        );
        throw new Error(`Operation skipped due to ${errorDetails.type}: ${errorDetails.message}`);

      case 'fallback':
        return await this.executeFallback(strategy, errorDetails, context, operation);

      case 'manual':
        await this.loggingService.critical(
          LogCategory.ERROR_HANDLING,
          `Manual intervention required for ${errorDetails.type}`,
          errorDetails.originalError,
          { errorDetails, context }
        );
        throw new Error(`Manual intervention required: ${errorDetails.message}`);

      default:
        throw new Error(`Unknown recovery strategy: ${strategy.strategy}`);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    errorDetails: ErrorDetails,
    context: ErrorRecoveryContext,
    maxAttempts: number
  ): Promise<T> {
    if (!this.retryPolicy.retryableErrors.includes(errorDetails.type)) {
      throw new Error(`Error type ${errorDetails.type} is not retryable`);
    }

    if (context.attemptNumber >= maxAttempts) {
      await this.loggingService.critical(
        LogCategory.ERROR_HANDLING,
        `Max retry attempts (${maxAttempts}) exceeded for ${errorDetails.type}`,
        errorDetails.originalError,
        { errorDetails, context, maxAttempts }
      );
      throw new Error(`Max retry attempts exceeded: ${errorDetails.message}`);
    }

    const delay = this.calculateRetryDelay(context.attemptNumber);

    await this.loggingService.info(
      LogCategory.ERROR_HANDLING,
      `Retrying operation in ${delay}ms (attempt ${context.attemptNumber + 1}/${maxAttempts})`,
      { errorDetails, context, delay }
    );

    await this.delay(delay);

    try {
      const result = await operation();

      await this.loggingService.info(
        LogCategory.ERROR_HANDLING,
        `Retry successful after ${context.attemptNumber + 1} attempts`,
        { context, errorDetails }
      );

      return result;
    } catch (retryError) {
      const newContext = {
        ...context,
        attemptNumber: context.attemptNumber + 1,
        lastError: errorDetails,
      };

      return await this.retryOperation(operation, errorDetails, newContext, maxAttempts);
    }
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback<T>(
    strategy: RecoveryStrategy,
    errorDetails: ErrorDetails,
    context: ErrorRecoveryContext,
    originalOperation: () => Promise<T>
  ): Promise<T> {
    await this.loggingService.warn(
      LogCategory.ERROR_HANDLING,
      `Executing fallback for ${errorDetails.type}`,
      { errorDetails, context }
    );

    if (strategy.fallbackAction) {
      try {
        const fallbackResult = await strategy.fallbackAction();

        await this.loggingService.info(
          LogCategory.ERROR_HANDLING,
          `Fallback completed successfully for ${errorDetails.type}`,
          { errorDetails, context }
        );

        return fallbackResult;
      } catch (fallbackError) {
        await this.loggingService.error(
          LogCategory.ERROR_HANDLING,
          `Fallback failed for ${errorDetails.type}`,
          fallbackError,
          { errorDetails, context, originalError: errorDetails.originalError }
        );

        // Try retry as last resort
        return await this.retryOperation(originalOperation, errorDetails, context, 1);
      }
    } else {
      // Default fallback: single retry
      return await this.retryOperation(originalOperation, errorDetails, context, 1);
    }
  }

  /**
   * Calculate retry delay based on backoff type
   */
  private calculateRetryDelay(attemptNumber: number): number {
    let delay: number;

    switch (this.retryPolicy.backoffType) {
      case 'linear':
        delay = this.retryPolicy.baseDelay * (attemptNumber + 1);
        break;

      case 'exponential':
        delay = this.retryPolicy.baseDelay * Math.pow(2, attemptNumber);
        break;

      case 'fixed':
      default:
        delay = this.retryPolicy.baseDelay;
        break;
    }

    // Apply jitter (±25% randomization)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    delay += jitter;

    return Math.min(Math.max(delay, 100), this.retryPolicy.maxDelay);
  }

  /**
   * Analyze error and classify it
   */
  private analyzeError(error: Error | any, context: ErrorRecoveryContext): ErrorDetails {
    let errorType = ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let suggestedAction = 'Review error details and retry operation';

    // Classify error based on message and type
    const errorMessage = error?.message || String(error);
    const errorName = error?.constructor?.name || 'Error';

    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      errorType = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.LOW;
      suggestedAction = 'Fix data validation issues and retry';
    } else if (errorMessage.includes('dimension') || errorMessage.includes('lookup')) {
      errorType = ErrorType.DIMENSION_LOOKUP_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedAction = 'Create missing dimension entries or use fallback values';
    } else if (errorMessage.includes('upsert') || errorMessage.includes('insert') || errorMessage.includes('update')) {
      errorType = ErrorType.UPSERT_ERROR;
      severity = ErrorSeverity.HIGH;
      suggestedAction = 'Check database connectivity and data integrity';
    } else if (errorMessage.includes('parse') || errorMessage.includes('CSV')) {
      errorType = ErrorType.PARSING_ERROR;
      severity = ErrorSeverity.CRITICAL;
      suggestedAction = 'Verify CSV file format and structure';
    } else if (errorMessage.includes('state') || errorMessage.includes('transition')) {
      errorType = ErrorType.STATE_TRANSITION_ERROR;
      severity = ErrorSeverity.HIGH;
      suggestedAction = 'Check state machine configuration and retry';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      errorType = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedAction = 'Check network connectivity and retry';
    } else if (errorMessage.includes('database') || errorMessage.includes('connection') || errorName.includes('PostgresError')) {
      errorType = ErrorType.DATABASE_ERROR;
      severity = ErrorSeverity.HIGH;
      suggestedAction = 'Check database connectivity and configuration';
    } else if (errorMessage.includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedAction = 'Increase timeout limits or optimize operation';
    }

    return {
      type: errorType,
      severity,
      message: errorMessage,
      originalError: error instanceof Error ? error : undefined,
      context: {
        fileId: context.fileId,
        runId: context.runId,
        currentState: context.currentState,
        attemptNumber: context.attemptNumber,
      },
      timestamp: new Date(),
      stackTrace: error?.stack,
      suggestedAction,
    };
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStatistics(fileId: string, runId?: string): Promise<{
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    retryAttempts: number;
    successfulRecoveries: number;
    manualInterventionsRequired: number;
  }> {
    // This would query the logging service for error statistics
    // Implementation would depend on how errors are stored and tracked

    return {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      retryAttempts: 0,
      successfulRecoveries: 0,
      manualInterventionsRequired: 0,
    };
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(errorType: ErrorType): boolean {
    const strategy = this.recoveryStrategies.get(errorType);
    return strategy ? strategy.strategy !== 'manual' : false;
  }

  /**
   * Get suggested recovery action for an error
   */
  getSuggestedAction(errorType: ErrorType): string {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      return 'Unknown error type - manual investigation required';
    }

    switch (strategy.strategy) {
      case 'retry':
        return `Automatic retry (max ${strategy.maxAttempts} attempts)`;
      case 'skip':
        return 'Skip and continue processing';
      case 'fallback':
        return 'Use fallback mechanism';
      case 'manual':
        return 'Manual intervention required';
      default:
        return 'Unknown recovery strategy';
    }
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}