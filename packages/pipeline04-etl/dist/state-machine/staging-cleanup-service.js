/**
 * Staging Table Cleanup and Audit Trail Service
 * Manages staging table cleanup before reprocessing and maintains detailed audit trails
 */
/**
 * Service for managing staging table cleanup and audit trail
 */
export class StagingCleanupService {
    supabaseClient;
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
    }
    /**
     * Clean staging tables before reprocessing
     */
    async cleanupStagingTables(options) {
        const startTime = Date.now();
        const result = {
            tablesProcessed: [],
            recordsDeleted: 0,
            errors: [],
            cleanupDuration: 0,
        };
        try {
            await this.logAuditEvent({
                level: 'info',
                action: 'staging_cleanup_start',
                message: 'Starting staging table cleanup',
                details: { options },
                organizationId: options.organizationId,
                fileId: options.fileId,
                runId: options.runId,
            });
            // Get list of staging tables to clean
            const stagingTables = await this.getStagingTables();
            for (const tableName of stagingTables) {
                try {
                    const tableResult = await this.cleanupStagingTable(tableName, options);
                    result.tablesProcessed.push(tableName);
                    result.recordsDeleted += tableResult.deletedCount;
                    if (options.dryRun) {
                        if (!result.dryRunResults) {
                            result.dryRunResults = { wouldDelete: 0, tables: {} };
                        }
                        result.dryRunResults.wouldDelete += tableResult.deletedCount;
                        result.dryRunResults.tables[tableName] = tableResult.deletedCount;
                    }
                }
                catch (error) {
                    const errorMessage = `Failed to clean table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    result.errors.push(errorMessage);
                    await this.logAuditEvent({
                        level: 'error',
                        action: 'staging_cleanup_table_error',
                        message: errorMessage,
                        details: { tableName, error: error instanceof Error ? error.message : error },
                        organizationId: options.organizationId,
                        fileId: options.fileId,
                        runId: options.runId,
                        success: false,
                    });
                }
            }
            result.cleanupDuration = Date.now() - startTime;
            await this.logAuditEvent({
                level: result.errors.length > 0 ? 'warning' : 'info',
                action: 'staging_cleanup_complete',
                message: `Staging cleanup completed: ${result.recordsDeleted} records ${options.dryRun ? 'would be ' : ''}deleted from ${result.tablesProcessed.length} tables`,
                details: {
                    recordsDeleted: result.recordsDeleted,
                    tablesProcessed: result.tablesProcessed,
                    errors: result.errors,
                    dryRun: options.dryRun,
                },
                organizationId: options.organizationId,
                fileId: options.fileId,
                runId: options.runId,
                duration: result.cleanupDuration,
                success: result.errors.length === 0,
            });
            return result;
        }
        catch (error) {
            result.cleanupDuration = Date.now() - startTime;
            const errorMessage = `Staging cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            result.errors.push(errorMessage);
            await this.logAuditEvent({
                level: 'error',
                action: 'staging_cleanup_failed',
                message: errorMessage,
                details: { error: error instanceof Error ? error.message : error },
                organizationId: options.organizationId,
                fileId: options.fileId,
                runId: options.runId,
                duration: result.cleanupDuration,
                success: false,
            });
            throw error;
        }
    }
    /**
     * Get list of staging tables to clean
     */
    async getStagingTables() {
        // For now, return the known staging tables
        // In a more dynamic system, this could query the database schema
        return [
            'pipeline04_staging',
            'pipeline04_pending_entries',
            // Add other staging tables as needed
        ];
    }
    /**
     * Clean a specific staging table
     */
    async cleanupStagingTable(tableName, options) {
        let query = this.supabaseClient
            .from(tableName)
            .delete()
            .eq('organization_id', options.organizationId);
        // Add specific filters based on options
        if (options.fileId) {
            query = query.eq('file_id', options.fileId);
        }
        if (options.runId) {
            query = query.eq('run_id', options.runId);
        }
        if (options.beforeState) {
            query = query.neq('status', options.beforeState);
        }
        if (options.retainDays) {
            const cutoffDate = new Date(Date.now() - options.retainDays * 24 * 60 * 60 * 1000);
            query = query.lt('created_at', cutoffDate.toISOString());
        }
        if (options.dryRun) {
            // For dry run, count instead of delete
            const { count, error } = await this.supabaseClient
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', options.organizationId);
            if (error)
                throw error;
            return { deletedCount: count || 0 };
        }
        // Execute the actual delete
        const { data, error } = await query.select();
        if (error)
            throw error;
        return { deletedCount: data?.length || 0 };
    }
    /**
     * Clean up old audit trail records
     */
    async cleanupOldAuditRecords(organizationId, retainDays = 90, dryRun = false) {
        const startTime = Date.now();
        const cutoffDate = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
        try {
            let query = this.supabaseClient
                .from('etl_run_log')
                .eq('organization_id', organizationId)
                .lt('created_at', cutoffDate.toISOString());
            if (dryRun) {
                const { count, error } = await query.select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                return {
                    tablesProcessed: ['etl_run_log'],
                    recordsDeleted: 0,
                    errors: [],
                    cleanupDuration: Date.now() - startTime,
                    dryRunResults: {
                        wouldDelete: count || 0,
                        tables: { etl_run_log: count || 0 },
                    },
                };
            }
            const { data, error } = await query.delete().select();
            if (error)
                throw error;
            const deletedCount = data?.length || 0;
            await this.logAuditEvent({
                level: 'info',
                action: 'audit_cleanup',
                message: `Cleaned up ${deletedCount} old audit records older than ${retainDays} days`,
                details: { cutoffDate, deletedCount, retainDays },
                organizationId,
                duration: Date.now() - startTime,
                success: true,
            });
            return {
                tablesProcessed: ['etl_run_log'],
                recordsDeleted: deletedCount,
                errors: [],
                cleanupDuration: Date.now() - startTime,
            };
        }
        catch (error) {
            await this.logAuditEvent({
                level: 'error',
                action: 'audit_cleanup_failed',
                message: `Failed to cleanup old audit records: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details: { error: error instanceof Error ? error.message : error },
                organizationId,
                duration: Date.now() - startTime,
                success: false,
            });
            throw error;
        }
    }
    /**
     * Verify staging table cleanup was successful
     */
    async verifyStagingCleanup(options) {
        const result = {
            isClean: true,
            remainingRecords: {},
            details: [],
        };
        try {
            const stagingTables = await this.getStagingTables();
            for (const tableName of stagingTables) {
                let query = this.supabaseClient
                    .from(tableName)
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', options.organizationId);
                if (options.fileId) {
                    query = query.eq('file_id', options.fileId);
                }
                if (options.runId) {
                    query = query.eq('run_id', options.runId);
                }
                const { count, error } = await query;
                if (error) {
                    result.details.push(`Error checking ${tableName}: ${error.message}`);
                    continue;
                }
                const recordCount = count || 0;
                result.remainingRecords[tableName] = recordCount;
                if (recordCount > 0) {
                    result.isClean = false;
                    result.details.push(`${tableName} still has ${recordCount} records`);
                }
            }
            await this.logAuditEvent({
                level: result.isClean ? 'info' : 'warning',
                action: 'staging_cleanup_verification',
                message: result.isClean ? 'Staging cleanup verification passed' : 'Staging cleanup verification found remaining records',
                details: {
                    isClean: result.isClean,
                    remainingRecords: result.remainingRecords,
                    issues: result.details,
                },
                organizationId: options.organizationId,
                fileId: options.fileId,
                runId: options.runId,
                success: result.isClean,
            });
            return result;
        }
        catch (error) {
            await this.logAuditEvent({
                level: 'error',
                action: 'staging_cleanup_verification_failed',
                message: `Staging cleanup verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details: { error: error instanceof Error ? error.message : error },
                organizationId: options.organizationId,
                fileId: options.fileId,
                runId: options.runId,
                success: false,
            });
            throw error;
        }
    }
    /**
     * Log audit event
     */
    async logAuditEvent(event) {
        try {
            const logEntry = {
                id: event.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: event.timestamp || new Date(),
                level: event.level,
                action: event.action,
                message: event.message,
                details: event.details,
                organization_id: event.organizationId,
                user_id: event.userId,
                file_id: event.fileId,
                run_id: event.runId,
                duration: event.duration,
                success: event.success,
                created_at: new Date(),
            };
            const { data, error } = await this.supabaseClient
                .from('etl_run_log')
                .insert(logEntry)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw - logging errors shouldn't break the main flow
            return '';
        }
    }
    /**
     * Get audit trail for a specific file or run
     */
    async getAuditTrail(options) {
        try {
            let query = this.supabaseClient
                .from('etl_run_log')
                .select('*')
                .eq('organization_id', options.organizationId)
                .order('timestamp', { ascending: false });
            if (options.fileId) {
                query = query.eq('file_id', options.fileId);
            }
            if (options.runId) {
                query = query.eq('run_id', options.runId);
            }
            if (options.action) {
                query = query.eq('action', options.action);
            }
            if (options.level) {
                query = query.eq('level', options.level);
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            return data.map((log) => ({
                id: log.id,
                timestamp: new Date(log.timestamp),
                level: log.level,
                action: log.action,
                message: log.message,
                details: log.details,
                organizationId: log.organization_id,
                userId: log.user_id,
                fileId: log.file_id,
                runId: log.run_id,
                duration: log.duration,
                success: log.success,
            }));
        }
        catch (error) {
            console.error('Failed to get audit trail:', error);
            throw error;
        }
    }
    /**
     * Get audit trail statistics
     */
    async getAuditStats(organizationId, timeRangeHours = 24) {
        try {
            const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
            // Get all events in time range
            const { data: events, error } = await this.supabaseClient
                .from('etl_run_log')
                .select('*')
                .eq('organization_id', organizationId)
                .gte('timestamp', startTime.toISOString())
                .order('timestamp', { ascending: false });
            if (error)
                throw error;
            const totalEvents = events?.length || 0;
            const eventsByLevel = {};
            const eventsByAction = {};
            let successCount = 0;
            let totalDuration = 0;
            let durationCount = 0;
            for (const event of events || []) {
                // Count by level
                eventsByLevel[event.level] = (eventsByLevel[event.level] || 0) + 1;
                // Count by action
                eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
                // Success rate
                if (event.success === true)
                    successCount++;
                // Average duration
                if (event.duration && event.duration > 0) {
                    totalDuration += event.duration;
                    durationCount++;
                }
            }
            const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;
            const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
            // Get recent errors
            const recentErrors = (events || [])
                .filter((event) => event.level === 'error')
                .slice(0, 10)
                .map((log) => ({
                id: log.id,
                timestamp: new Date(log.timestamp),
                level: log.level,
                action: log.action,
                message: log.message,
                details: log.details,
                organizationId: log.organization_id,
                userId: log.user_id,
                fileId: log.file_id,
                runId: log.run_id,
                duration: log.duration,
                success: log.success,
            }));
            return {
                totalEvents,
                eventsByLevel,
                eventsByAction,
                successRate,
                avgDuration,
                recentErrors,
            };
        }
        catch (error) {
            console.error('Failed to get audit stats:', error);
            throw error;
        }
    }
}
