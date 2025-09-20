/**
 * ETL State Machine Service
 * High-level service for managing ETL file and run states
 */
import { ETLStateMachine } from './state-machine.js';
import { ChecksumService } from './checksum-service.js';
import { StagingCleanupService } from './staging-cleanup-service.js';
import { OptimisticLockingService } from './optimistic-locking-service.js';
import { RetryLogicService } from './retry-logic-service.js';
import { ETLState, } from './types.js';
export class ETLStateMachineService {
    stateMachine;
    checksumService;
    stagingCleanupService;
    lockingService;
    retryLogicService;
    supabaseClient;
    constructor(supabaseClient, config, lockingOptions, retryConfig) {
        this.supabaseClient = supabaseClient;
        this.stateMachine = new ETLStateMachine(config);
        this.checksumService = new ChecksumService(supabaseClient);
        this.stagingCleanupService = new StagingCleanupService(supabaseClient);
        this.lockingService = new OptimisticLockingService(supabaseClient, lockingOptions);
        this.retryLogicService = new RetryLogicService(supabaseClient, retryConfig);
    }
    /**
     * Create a new ETL file record
     */
    async createETLFile(file) {
        const etlFile = {
            id: file.id,
            organization_id: file.organizationId,
            filename: file.filename,
            filepath: file.filepath,
            file_size: file.fileSize,
            mime_type: file.mimeType,
            checksum: file.checksum,
            current_state: ETLState.UPLOADED,
            state_history: [{
                    state: ETLState.UPLOADED,
                    timestamp: new Date(),
                    userId: file.uploadedBy,
                    message: 'File uploaded',
                }],
            uploaded_at: new Date(),
            uploaded_by: file.uploadedBy,
            metadata: file.metadata || {},
            version: 1,
            created_at: new Date(),
            updated_at: new Date(),
        };
        const { data, error } = await this.supabaseClient
            .from('etl_file')
            .insert(etlFile)
            .select()
            .single();
        if (error)
            throw error;
        return this.mapDbToETLFile(data);
    }
    /**
     * Create a new ETL run for a file
     */
    async createETLRun(params) {
        // Get next run number
        const { data: runNumberData } = await this.supabaseClient
            .rpc('get_next_run_number', { p_file_id: params.fileId });
        const runNumber = runNumberData || 1;
        const etlRun = {
            id: `run-${params.fileId}-${runNumber}-${Date.now()}`,
            file_id: params.fileId,
            organization_id: params.organizationId,
            run_number: runNumber,
            current_state: ETLState.UPLOADED,
            state_history: [{
                    state: ETLState.UPLOADED,
                    timestamp: new Date(),
                    userId: params.startedBy,
                    message: `Run ${runNumber} started`,
                }],
            started_at: new Date(),
            processing_by: params.startedBy,
            retry_count: 0,
            version: 1,
            created_at: new Date(),
            updated_at: new Date(),
        };
        const { data, error } = await this.supabaseClient
            .from('etl_run')
            .insert(etlRun)
            .select()
            .single();
        if (error)
            throw error;
        return this.mapDbToETLRun(data);
    }
    /**
     * Transition file state with optimistic locking
     */
    async transitionFileState(fileId, toState, userId, message, metadata, options) {
        // Use optimistic locking for state transitions
        const lockingResult = await this.lockingService.updateWithLock('etl_file', fileId, {
            current_state: toState,
            state_history: this.supabaseClient.raw(`
          state_history || jsonb_build_object(
            'state', '${toState}',
            'timestamp', '${new Date().toISOString()}',
            'userId', ${userId ? `'${userId}'` : 'null'},
            'message', ${message ? `'${message}'` : 'null'}
          )::jsonb
        `),
        }, options);
        if (!lockingResult.success) {
            throw new Error(`Failed to transition file state: ${lockingResult.error}`);
        }
        // Log the state transition
        await this.stagingCleanupService.logAuditEvent({
            level: 'info',
            action: 'file_state_transition',
            message: message || `File state changed to ${toState}`,
            details: {
                fileId,
                fromState: lockingResult.data?.current_state,
                toState,
                retryAttempt: lockingResult.retryAttempt,
                ...metadata,
            },
            organizationId: lockingResult.data?.organization_id || '',
            userId,
            fileId,
        });
        return {
            success: true,
            previousState: lockingResult.data?.current_state || toState,
            currentState: toState,
            timestamp: new Date(),
        };
    }
    /**
     * Transition run state with optimistic locking
     */
    async transitionRunState(runId, toState, userId, message, metadata, options) {
        // Use optimistic locking for state transitions
        const lockingResult = await this.lockingService.updateWithLock('etl_run', runId, {
            current_state: toState,
            state_history: this.supabaseClient.raw(`
          state_history || jsonb_build_object(
            'state', '${toState}',
            'timestamp', '${new Date().toISOString()}',
            'userId', ${userId ? `'${userId}'` : 'null'},
            'message', ${message ? `'${message}'` : 'null'}
          )::jsonb
        `),
        }, options);
        if (!lockingResult.success) {
            throw new Error(`Failed to transition run state: ${lockingResult.error}`);
        }
        // Log the state transition
        await this.stagingCleanupService.logAuditEvent({
            level: 'info',
            action: 'run_state_transition',
            message: message || `Run state changed to ${toState}`,
            details: {
                runId,
                fromState: lockingResult.data?.current_state,
                toState,
                retryAttempt: lockingResult.retryAttempt,
                ...metadata,
            },
            organizationId: lockingResult.data?.organization_id || '',
            userId,
            runId,
        });
        return {
            success: true,
            previousState: lockingResult.data?.current_state || toState,
            currentState: toState,
            timestamp: new Date(),
        };
    }
    /**
     * Check for duplicate file by checksum
     */
    async findDuplicateFile(checksum, organizationId, currentFileId) {
        return this.checksumService.checkForDuplicate(checksum, organizationId, currentFileId);
    }
    /**
     * Calculate file checksum
     */
    async calculateFileChecksum(filepath, algorithm = 'sha256') {
        return this.checksumService.calculateFileChecksum(filepath, algorithm);
    }
    /**
     * Calculate checksum from buffer
     */
    calculateBufferChecksum(buffer, algorithm = 'sha256') {
        return this.checksumService.calculateBufferChecksum(buffer, algorithm);
    }
    /**
     * Handle forced reprocessing for duplicate files
     */
    async handleForcedReprocessing(checksum, organizationId, options) {
        return this.checksumService.handleForcedReprocessing(checksum, organizationId, options);
    }
    /**
     * Get checksum history for a file
     */
    async getChecksumHistory(checksum, organizationId) {
        return this.checksumService.getChecksumHistory(checksum, organizationId);
    }
    /**
     * Start processing a run with optional staging cleanup
     */
    async startProcessing(runId, processingBy, cleanupOptions) {
        // Get run details for cleanup
        const run = await this.getETLRun(runId);
        if (!run) {
            throw new Error('Run not found');
        }
        // Clean staging tables if requested
        let cleanupResult;
        if (cleanupOptions) {
            const fullCleanupOptions = {
                organizationId: run.organizationId,
                fileId: run.fileId,
                runId: run.id,
                ...cleanupOptions,
            };
            cleanupResult = await this.stagingCleanupService.cleanupStagingTables(fullCleanupOptions);
        }
        // Mark processing start
        const { error } = await this.supabaseClient
            .from('etl_run')
            .update({
            processing_by: processingBy,
            processing_started_at: new Date(),
            updated_at: new Date(),
        })
            .eq('id', runId);
        if (error)
            throw error;
        // Transition to parsing state
        const transitionResult = await this.transitionRunState(runId, ETLState.PARSING, processingBy, 'Processing started');
        return {
            ...transitionResult,
            cleanupResult,
        };
    }
    /**
     * Complete parsing phase
     */
    async completeParsing(runId, recordsTotal, userId) {
        // Update records count
        await this.supabaseClient
            .from('etl_run')
            .update({
            records_total: recordsTotal,
            updated_at: new Date(),
        })
            .eq('id', runId);
        // Transition to parsed state
        return this.transitionRunState(runId, ETLState.PARSED, userId, `Parsing completed: ${recordsTotal} records found`);
    }
    /**
     * Complete validation phase
     */
    async completeValidation(runId, recordsProcessed, recordsFailed, userId) {
        // Update records count
        await this.supabaseClient
            .from('etl_run')
            .update({
            records_processed: recordsProcessed,
            records_failed: recordsFailed,
            updated_at: new Date(),
        })
            .eq('id', runId);
        // Transition to validated state
        return this.transitionRunState(runId, ETLState.VALIDATED, userId, `Validation completed: ${recordsProcessed} processed, ${recordsFailed} failed`);
    }
    /**
     * Handle run failure with retry logic
     */
    async handleRunFailure(runId, errorMessage, errorDetails, isTransient = true) {
        // Update run with error information
        await this.supabaseClient
            .from('etl_run')
            .update({
            error_message: errorMessage,
            error_details: errorDetails,
            failed_at: new Date(),
            updated_at: new Date(),
        })
            .eq('id', runId);
        // Transition to failed state
        await this.transitionRunState(runId, ETLState.FAILED, undefined, errorMessage, { errorDetails, isTransient });
        // Handle retry logic using the new retry service
        return this.retryLogicService.handleFailure(runId, errorMessage, errorDetails, isTransient);
    }
    /**
     * Get file by ID
     */
    async getETLFile(fileId) {
        const { data, error } = await this.supabaseClient
            .from('etl_file')
            .select('*')
            .eq('id', fileId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        return this.mapDbToETLFile(data);
    }
    /**
     * Get run by ID
     */
    async getETLRun(runId) {
        const { data, error } = await this.supabaseClient
            .from('etl_run')
            .select('*')
            .eq('id', runId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        return this.mapDbToETLRun(data);
    }
    /**
     * Get runs for a file
     */
    async getFileRuns(fileId) {
        const { data, error } = await this.supabaseClient
            .from('etl_run')
            .select('*')
            .eq('file_id', fileId)
            .order('run_number', { ascending: false });
        if (error)
            throw error;
        return data.map(this.mapDbToETLRun);
    }
    /**
     * Check and release stale locks
     */
    async checkAndReleaseStaleLocKs() {
        const staleRunIds = await this.stateMachine.checkStaleLocks(this.supabaseClient);
        const releasedRuns = [];
        for (const runId of staleRunIds) {
            try {
                await this.stateMachine.releaseStaLock(this.supabaseClient, runId, 'Processing timeout - stale lock detected');
                releasedRuns.push(runId);
            }
            catch (error) {
                console.error(`Failed to release stale lock for run ${runId}:`, error);
            }
        }
        return releasedRuns;
    }
    /**
     * Clean staging tables for reprocessing
     */
    async cleanupStagingTables(options) {
        return this.stagingCleanupService.cleanupStagingTables(options);
    }
    /**
     * Verify staging cleanup was successful
     */
    async verifyStagingCleanup(options) {
        return this.stagingCleanupService.verifyStagingCleanup(options);
    }
    /**
     * Get audit trail for ETL operations
     */
    async getAuditTrail(options) {
        return this.stagingCleanupService.getAuditTrail(options);
    }
    /**
     * Get audit statistics
     */
    async getAuditStats(organizationId, timeRangeHours = 24) {
        return this.stagingCleanupService.getAuditStats(organizationId, timeRangeHours);
    }
    /**
     * Clean up old audit records
     */
    async cleanupOldAuditRecords(organizationId, retainDays = 90, dryRun = false) {
        return this.stagingCleanupService.cleanupOldAuditRecords(organizationId, retainDays, dryRun);
    }
    /**
     * Update record with optimistic locking
     */
    async updateWithLock(tableName, id, updates, options) {
        return this.lockingService.updateWithLock(tableName, id, updates, options);
    }
    /**
     * Execute operation with exclusive lock
     */
    async withLock(tableName, id, operation, lockTimeout = 30000) {
        return this.lockingService.withLock(tableName, id, operation, lockTimeout);
    }
    /**
     * Release expired locks for maintenance
     */
    async releaseExpiredLocks() {
        const [fileResult, runResult] = await Promise.all([
            this.lockingService.releaseExpiredLocks('etl_file'),
            this.lockingService.releaseExpiredLocks('etl_run'),
        ]);
        return {
            etlFile: fileResult.releasedCount,
            etlRun: runResult.releasedCount,
        };
    }
    /**
     * Get locking statistics for monitoring
     */
    async getLockingStats() {
        const [fileStats, runStats] = await Promise.all([
            this.lockingService.getLockingStats('etl_file'),
            this.lockingService.getLockingStats('etl_run'),
        ]);
        return {
            etlFile: fileStats,
            etlRun: runStats,
        };
    }
    /**
     * Get retry-ready runs for processing
     */
    async getRetryReadyRuns(organizationId) {
        return this.retryLogicService.getRetryReadyRuns(organizationId);
    }
    /**
     * Clear retry schedule after successful processing
     */
    async clearRetrySchedule(runId) {
        return this.retryLogicService.clearRetrySchedule(runId);
    }
    /**
     * Get dead letter queue entries
     */
    async getDeadLetterQueueEntries(organizationId, limit = 100, offset = 0) {
        return this.retryLogicService.getDeadLetterQueueEntries(organizationId, limit, offset);
    }
    /**
     * Mark DLQ entry for retry
     */
    async markDLQForRetry(dlqId, retryAfter) {
        return this.retryLogicService.markForRetry(dlqId, retryAfter);
    }
    /**
     * Remove entry from dead letter queue
     */
    async removeFromDeadLetterQueue(dlqId) {
        return this.retryLogicService.removeFromDeadLetterQueue(dlqId);
    }
    /**
     * Get retry statistics for monitoring
     */
    async getRetryStats(organizationId) {
        return this.retryLogicService.getRetryStats(organizationId);
    }
    /**
     * Process marked DLQ entries for retry
     */
    async processMarkedDLQEntries(organizationId) {
        return this.retryLogicService.processMarkedDLQEntries(organizationId);
    }
    /**
     * Clean up old DLQ entries
     */
    async cleanupOldDLQEntries(olderThanDays = 30, organizationId) {
        return this.retryLogicService.cleanupOldDLQEntries(olderThanDays, organizationId);
    }
    /**
     * Update retry configuration
     */
    updateRetryConfig(newConfig) {
        this.retryLogicService.updateConfig(newConfig);
    }
    /**
     * Get current retry configuration
     */
    getRetryConfig() {
        return this.retryLogicService.getConfig();
    }
    /**
     * Map database record to ETLFile
     */
    mapDbToETLFile(data) {
        return {
            id: data.id,
            organizationId: data.organization_id,
            filename: data.filename,
            filepath: data.filepath,
            fileSize: data.file_size,
            mimeType: data.mime_type,
            checksum: data.checksum,
            currentState: data.current_state,
            stateHistory: data.state_history || [],
            uploadedAt: new Date(data.uploaded_at),
            uploadedBy: data.uploaded_by,
            parsedAt: data.parsed_at ? new Date(data.parsed_at) : undefined,
            validatedAt: data.validated_at ? new Date(data.validated_at) : undefined,
            approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
            approvedBy: data.approved_by,
            loadedAt: data.loaded_at ? new Date(data.loaded_at) : undefined,
            failedAt: data.failed_at ? new Date(data.failed_at) : undefined,
            errorMessage: data.error_message,
            metadata: data.metadata || {},
            version: data.version,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }
    /**
     * Map database record to ETLRun
     */
    mapDbToETLRun(data) {
        return {
            id: data.id,
            fileId: data.file_id,
            organizationId: data.organization_id,
            runNumber: data.run_number,
            currentState: data.current_state,
            stateHistory: data.state_history || [],
            startedAt: new Date(data.started_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
            processingBy: data.processing_by,
            processingStartedAt: data.processing_started_at ? new Date(data.processing_started_at) : undefined,
            recordsTotal: data.records_total,
            recordsProcessed: data.records_processed,
            recordsFailed: data.records_failed,
            errorMessage: data.error_message,
            errorDetails: data.error_details,
            retryCount: data.retry_count,
            nextRetryAt: data.next_retry_at ? new Date(data.next_retry_at) : undefined,
            version: data.version,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }
}
