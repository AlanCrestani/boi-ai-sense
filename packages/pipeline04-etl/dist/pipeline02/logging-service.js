/**
 * Pipeline 02 Logging Service
 * Comprehensive logging and audit trail for Pipeline 02 operations
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["CRITICAL"] = "CRITICAL";
})(LogLevel || (LogLevel = {}));
export var LogCategory;
(function (LogCategory) {
    LogCategory["ORCHESTRATION"] = "ORCHESTRATION";
    LogCategory["PARSING"] = "PARSING";
    LogCategory["VALIDATION"] = "VALIDATION";
    LogCategory["DIMENSION_LOOKUP"] = "DIMENSION_LOOKUP";
    LogCategory["UPSERT"] = "UPSERT";
    LogCategory["STATE_TRANSITION"] = "STATE_TRANSITION";
    LogCategory["ERROR_HANDLING"] = "ERROR_HANDLING";
    LogCategory["PERFORMANCE"] = "PERFORMANCE";
})(LogCategory || (LogCategory = {}));
export class Pipeline02LoggingService {
    supabaseClient;
    context;
    constructor(supabaseClient, context) {
        this.supabaseClient = supabaseClient;
        this.context = context;
    }
    /**
     * Log an entry with automatic context injection
     */
    async log(level, category, message, metadata, options) {
        const logEntry = {
            fileId: this.context.fileId || 'unknown',
            runId: this.context.runId,
            timestamp: new Date(),
            level,
            category,
            message,
            metadata: {
                ...metadata,
                organizationId: this.context.organizationId,
                source: 'pipeline02',
            },
            ...options,
        };
        try {
            // Log to database
            await this.persistLog(logEntry);
            // Log to console for development
            this.logToConsole(logEntry);
            // Handle critical errors with additional alerting
            if (level === LogLevel.CRITICAL) {
                await this.handleCriticalError(logEntry);
            }
        }
        catch (error) {
            console.error('Failed to log entry:', error, logEntry);
        }
    }
    /**
     * Convenience methods for different log levels
     */
    async debug(category, message, metadata) {
        await this.log(LogLevel.DEBUG, category, message, metadata);
    }
    async info(category, message, metadata) {
        await this.log(LogLevel.INFO, category, message, metadata);
    }
    async warn(category, message, metadata) {
        await this.log(LogLevel.WARN, category, message, metadata);
    }
    async error(category, message, error, metadata) {
        const errorDetails = error ? {
            errorType: error.constructor.name,
            errorCode: error.code,
            stackTrace: error.stack,
        } : undefined;
        await this.log(LogLevel.ERROR, category, message, metadata, { errorDetails });
    }
    async critical(category, message, error, metadata) {
        const errorDetails = error ? {
            errorType: error.constructor.name,
            errorCode: error.code,
            stackTrace: error.stack,
        } : undefined;
        await this.log(LogLevel.CRITICAL, category, message, metadata, { errorDetails });
    }
    /**
     * Log performance metrics
     */
    async logPerformance(operation, duration, recordsProcessed, metadata) {
        await this.log(LogLevel.INFO, LogCategory.PERFORMANCE, `${operation} completed`, {
            operation,
            ...metadata,
        }, {
            duration,
            recordsProcessed,
        });
    }
    /**
     * Log validation results
     */
    async logValidation(validRecords, invalidRecords, warnings, errors, metadata) {
        const message = `Validation completed: ${validRecords} valid, ${invalidRecords} invalid records`;
        await this.log(invalidRecords > 0 ? LogLevel.WARN : LogLevel.INFO, LogCategory.VALIDATION, message, {
            validRecords,
            invalidRecords,
            warningCount: warnings.length,
            errorCount: errors.length,
            warnings: warnings.slice(0, 10), // Limit to first 10
            errors: errors.slice(0, 10), // Limit to first 10
            ...metadata,
        });
    }
    /**
     * Log UPSERT operation results
     */
    async logUpsert(inserted, updated, skipped, failed, duration, metadata) {
        const message = `UPSERT completed: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`;
        await this.log(failed > 0 ? LogLevel.WARN : LogLevel.INFO, LogCategory.UPSERT, message, {
            inserted,
            updated,
            skipped,
            failed,
            totalRecords: inserted + updated + skipped + failed,
            ...metadata,
        }, {
            duration,
            recordsProcessed: inserted + updated + skipped,
        });
    }
    /**
     * Log state transition
     */
    async logStateTransition(fromState, toState, duration, metadata) {
        await this.log(LogLevel.INFO, LogCategory.STATE_TRANSITION, `State transition: ${fromState} → ${toState}`, {
            fromState,
            toState,
            ...metadata,
        }, {
            duration,
        });
    }
    /**
     * Query logs with filtering
     */
    async queryLogs(query) {
        try {
            let dbQuery = this.supabaseClient
                .from('etl_run_log')
                .select('*')
                .eq('metadata->>organizationId', this.context.organizationId)
                .order('created_at', { ascending: false });
            if (query.fileId) {
                dbQuery = dbQuery.eq('metadata->>fileId', query.fileId);
            }
            if (query.runId) {
                dbQuery = dbQuery.eq('run_id', query.runId);
            }
            if (query.levels && query.levels.length > 0) {
                dbQuery = dbQuery.in('log_level', query.levels);
            }
            if (query.categories && query.categories.length > 0) {
                dbQuery = dbQuery.in('metadata->>category', query.categories);
            }
            if (query.dateFrom) {
                dbQuery = dbQuery.gte('created_at', query.dateFrom.toISOString());
            }
            if (query.dateTo) {
                dbQuery = dbQuery.lte('created_at', query.dateTo.toISOString());
            }
            if (query.limit) {
                dbQuery = dbQuery.limit(query.limit);
            }
            if (query.offset) {
                dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
            }
            const { data, error } = await dbQuery;
            if (error) {
                throw new Error(`Failed to query logs: ${error.message}`);
            }
            return (data || []).map(this.mapDbLogToLogEntry);
        }
        catch (error) {
            console.error('Error querying logs:', error);
            return [];
        }
    }
    /**
     * Get log summary for a file or run
     */
    async getLogSummary(fileId, runId) {
        try {
            const query = {
                fileId: fileId || this.context.fileId,
                runId: runId || this.context.runId,
                limit: 1000, // Reasonable limit for summary
            };
            const logs = await this.queryLogs(query);
            if (logs.length === 0) {
                return null;
            }
            const errorCount = logs.filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL).length;
            const warningCount = logs.filter(log => log.level === LogLevel.WARN).length;
            const categories = {};
            Object.values(LogCategory).forEach(cat => {
                categories[cat] = logs.filter(log => log.category === cat).length;
            });
            const timeline = logs
                .slice(0, 20) // Most recent 20 entries
                .map(log => ({
                timestamp: log.timestamp,
                category: log.category,
                level: log.level,
                message: log.message,
            }));
            // Calculate processing duration if available
            const firstLog = logs[logs.length - 1];
            const lastLog = logs[0];
            const processingDuration = firstLog && lastLog
                ? lastLog.timestamp.getTime() - firstLog.timestamp.getTime()
                : undefined;
            return {
                fileId: query.fileId || 'unknown',
                runId: query.runId,
                totalLogs: logs.length,
                errorCount,
                warningCount,
                lastLogTime: logs[0].timestamp,
                processingDuration,
                categories,
                timeline,
            };
        }
        catch (error) {
            console.error('Error generating log summary:', error);
            return null;
        }
    }
    /**
     * Persist log entry to database
     */
    async persistLog(logEntry) {
        const { error } = await this.supabaseClient
            .from('etl_run_log')
            .insert({
            run_id: logEntry.runId,
            log_level: logEntry.level,
            message: logEntry.message,
            metadata: {
                ...logEntry.metadata,
                fileId: logEntry.fileId,
                category: logEntry.category,
                duration: logEntry.duration,
                recordsProcessed: logEntry.recordsProcessed,
                errorDetails: logEntry.errorDetails,
                timestamp: logEntry.timestamp.toISOString(),
            },
        });
        if (error) {
            throw new Error(`Failed to persist log: ${error.message}`);
        }
    }
    /**
     * Log to console with formatting
     */
    logToConsole(logEntry) {
        const timestamp = logEntry.timestamp.toISOString();
        const emoji = this.getLevelEmoji(logEntry.level);
        const prefix = `${emoji} [${timestamp}] [${logEntry.category}] [${logEntry.fileId}]`;
        switch (logEntry.level) {
            case LogLevel.DEBUG:
                console.debug(`${prefix} ${logEntry.message}`, logEntry.metadata);
                break;
            case LogLevel.INFO:
                console.info(`${prefix} ${logEntry.message}`, logEntry.metadata);
                break;
            case LogLevel.WARN:
                console.warn(`${prefix} ${logEntry.message}`, logEntry.metadata);
                break;
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                console.error(`${prefix} ${logEntry.message}`, logEntry.metadata, logEntry.errorDetails);
                break;
        }
    }
    /**
     * Handle critical errors with additional alerting
     */
    async handleCriticalError(logEntry) {
        // In a production environment, this would trigger alerts
        // For now, just ensure it's prominently logged
        console.error('🚨 CRITICAL ERROR IN PIPELINE 02:', {
            fileId: logEntry.fileId,
            runId: logEntry.runId,
            message: logEntry.message,
            timestamp: logEntry.timestamp,
            metadata: logEntry.metadata,
            errorDetails: logEntry.errorDetails,
        });
        // Future enhancement: Send to monitoring service, Slack, email, etc.
    }
    /**
     * Get emoji for log level
     */
    getLevelEmoji(level) {
        switch (level) {
            case LogLevel.DEBUG: return '🔍';
            case LogLevel.INFO: return 'ℹ️';
            case LogLevel.WARN: return '⚠️';
            case LogLevel.ERROR: return '❌';
            case LogLevel.CRITICAL: return '🚨';
            default: return '📝';
        }
    }
    /**
     * Map database log entry to LogEntry interface
     */
    mapDbLogToLogEntry(dbLog) {
        return {
            id: dbLog.id,
            fileId: dbLog.metadata?.fileId || 'unknown',
            runId: dbLog.run_id,
            timestamp: new Date(dbLog.created_at),
            level: dbLog.log_level,
            category: dbLog.metadata?.category || LogCategory.ORCHESTRATION,
            message: dbLog.message,
            metadata: dbLog.metadata,
            duration: dbLog.metadata?.duration,
            recordsProcessed: dbLog.metadata?.recordsProcessed,
            errorDetails: dbLog.metadata?.errorDetails,
        };
    }
}
