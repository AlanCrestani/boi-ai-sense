/**
 * Pipeline 02 Logging Service
 * Comprehensive logging and audit trail for Pipeline 02 operations
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare enum LogCategory {
    ORCHESTRATION = "ORCHESTRATION",
    PARSING = "PARSING",
    VALIDATION = "VALIDATION",
    DIMENSION_LOOKUP = "DIMENSION_LOOKUP",
    UPSERT = "UPSERT",
    STATE_TRANSITION = "STATE_TRANSITION",
    ERROR_HANDLING = "ERROR_HANDLING",
    PERFORMANCE = "PERFORMANCE"
}
export interface LogEntry {
    id?: string;
    fileId: string;
    runId?: string;
    timestamp: Date;
    level: LogLevel;
    category: LogCategory;
    message: string;
    metadata?: Record<string, any>;
    duration?: number;
    recordsProcessed?: number;
    errorDetails?: {
        errorType: string;
        errorCode?: string;
        stackTrace?: string;
        affectedRecords?: any[];
    };
}
export interface LogQuery {
    fileId?: string;
    runId?: string;
    levels?: LogLevel[];
    categories?: LogCategory[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
}
export interface LogSummary {
    fileId: string;
    runId?: string;
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    lastLogTime: Date;
    processingDuration?: number;
    categories: Record<LogCategory, number>;
    timeline: Array<{
        timestamp: Date;
        category: LogCategory;
        level: LogLevel;
        message: string;
    }>;
}
export declare class Pipeline02LoggingService {
    private supabaseClient;
    private context;
    constructor(supabaseClient: any, context: {
        organizationId: string;
        fileId?: string;
        runId?: string;
    });
    /**
     * Log an entry with automatic context injection
     */
    log(level: LogLevel, category: LogCategory, message: string, metadata?: Record<string, any>, options?: {
        duration?: number;
        recordsProcessed?: number;
        errorDetails?: LogEntry['errorDetails'];
    }): Promise<void>;
    /**
     * Convenience methods for different log levels
     */
    debug(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void>;
    info(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void>;
    warn(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void>;
    error(category: LogCategory, message: string, error?: Error | any, metadata?: Record<string, any>): Promise<void>;
    critical(category: LogCategory, message: string, error?: Error | any, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log performance metrics
     */
    logPerformance(operation: string, duration: number, recordsProcessed?: number, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log validation results
     */
    logValidation(validRecords: number, invalidRecords: number, warnings: string[], errors: string[], metadata?: Record<string, any>): Promise<void>;
    /**
     * Log UPSERT operation results
     */
    logUpsert(inserted: number, updated: number, skipped: number, failed: number, duration: number, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log state transition
     */
    logStateTransition(fromState: string, toState: string, duration?: number, metadata?: Record<string, any>): Promise<void>;
    /**
     * Query logs with filtering
     */
    queryLogs(query: LogQuery): Promise<LogEntry[]>;
    /**
     * Get log summary for a file or run
     */
    getLogSummary(fileId?: string, runId?: string): Promise<LogSummary | null>;
    /**
     * Persist log entry to database
     */
    private persistLog;
    /**
     * Log to console with formatting
     */
    private logToConsole;
    /**
     * Handle critical errors with additional alerting
     */
    private handleCriticalError;
    /**
     * Get emoji for log level
     */
    private getLevelEmoji;
    /**
     * Map database log entry to LogEntry interface
     */
    private mapDbLogToLogEntry;
}
