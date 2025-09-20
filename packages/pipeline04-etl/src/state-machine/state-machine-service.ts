/**
 * ETL State Machine Service
 * High-level service for managing ETL file and run states
 */

import { ETLStateMachine } from './state-machine.js';
import { ChecksumService, DuplicateDetectionResult, ReprocessingOptions } from './checksum-service.js';
import { StagingCleanupService, StagingCleanupOptions, CleanupResult } from './staging-cleanup-service.js';
import { OptimisticLockingService, LockingOptions, LockingResult } from './optimistic-locking-service.js';
import { RetryLogicService } from './retry-logic-service.js';
import { MonitoringService } from './monitoring-service.js';
import {
  RetryConfig,
  RetryResult,
  ErrorType,
  DEFAULT_RETRY_CONFIG
} from './types.js';
import {
  ETLState,
  ETLFile,
  ETLRun,
  StateTransitionRequest,
  StateTransitionResult,
  StateMachineConfig,
} from './types.js';

export class ETLStateMachineService {
  private stateMachine: ETLStateMachine;
  private checksumService: ChecksumService;
  private stagingCleanupService: StagingCleanupService;
  private lockingService: OptimisticLockingService;
  private retryLogicService: RetryLogicService;
  private monitoringService: MonitoringService;
  private supabaseClient: any;

  constructor(
    supabaseClient: any,
    config?: Partial<StateMachineConfig>,
    lockingOptions?: LockingOptions,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.supabaseClient = supabaseClient;
    this.stateMachine = new ETLStateMachine(config);
    this.checksumService = new ChecksumService(supabaseClient);
    this.stagingCleanupService = new StagingCleanupService(supabaseClient);
    this.lockingService = new OptimisticLockingService(supabaseClient, lockingOptions);
    this.retryLogicService = new RetryLogicService(supabaseClient, retryConfig);
    this.monitoringService = new MonitoringService(supabaseClient);
  }

  /**
   * Create a new ETL file record
   */
  async createETLFile(file: {
    id: string;
    organizationId: string;
    filename: string;
    filepath: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    uploadedBy: string;
    metadata?: Record<string, any>;
  }): Promise<ETLFile> {
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

    if (error) throw error;
    return this.mapDbToETLFile(data);
  }

  /**
   * Create a new ETL run for a file
   */
  async createETLRun(params: {
    fileId: string;
    organizationId: string;
    startedBy?: string;
    metadata?: Record<string, any>;
  }): Promise<ETLRun> {
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

    if (error) throw error;
    return this.mapDbToETLRun(data);
  }

  /**
   * Transition file state with optimistic locking
   */
  async transitionFileState(
    fileId: string,
    toState: ETLState,
    userId?: string,
    message?: string,
    metadata?: Record<string, any>,
    options?: LockingOptions
  ): Promise<StateTransitionResult> {
    // Use optimistic locking for state transitions
    const lockingResult = await this.lockingService.updateWithLock(
      'etl_file',
      fileId,
      {
        current_state: toState,
        state_history: this.supabaseClient.raw(`
          state_history || jsonb_build_object(
            'state', '${toState}',
            'timestamp', '${new Date().toISOString()}',
            'userId', ${userId ? `'${userId}'` : 'null'},
            'message', ${message ? `'${message}'` : 'null'}
          )::jsonb
        `),
      } as any,
      options
    );

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
        fromState: (lockingResult.data as any)?.current_state,
        toState,
        retryAttempt: lockingResult.retryAttempt,
        ...metadata,
      },
      organizationId: (lockingResult.data as any)?.organization_id || '',
      userId,
      fileId,
    });

    return {
      success: true,
      previousState: (lockingResult.data as any)?.current_state || toState,
      currentState: toState,
      timestamp: new Date(),
    };
  }

  /**
   * Transition run state with optimistic locking
   */
  async transitionRunState(
    runId: string,
    toState: ETLState,
    userId?: string,
    message?: string,
    metadata?: Record<string, any>,
    options?: LockingOptions
  ): Promise<StateTransitionResult> {
    // Use optimistic locking for state transitions
    const lockingResult = await this.lockingService.updateWithLock(
      'etl_run',
      runId,
      {
        current_state: toState,
        state_history: this.supabaseClient.raw(`
          state_history || jsonb_build_object(
            'state', '${toState}',
            'timestamp', '${new Date().toISOString()}',
            'userId', ${userId ? `'${userId}'` : 'null'},
            'message', ${message ? `'${message}'` : 'null'}
          )::jsonb
        `),
      } as any,
      options
    );

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
        fromState: (lockingResult.data as any)?.current_state,
        toState,
        retryAttempt: lockingResult.retryAttempt,
        ...metadata,
      },
      organizationId: (lockingResult.data as any)?.organization_id || '',
      userId,
      runId,
    });

    return {
      success: true,
      previousState: (lockingResult.data as any)?.current_state || toState,
      currentState: toState,
      timestamp: new Date(),
    };
  }

  /**
   * Check for duplicate file by checksum
   */
  async findDuplicateFile(
    checksum: string,
    organizationId: string,
    currentFileId?: string
  ): Promise<DuplicateDetectionResult> {
    return this.checksumService.checkForDuplicate(checksum, organizationId, currentFileId);
  }

  /**
   * Calculate file checksum
   */
  async calculateFileChecksum(
    filepath: string,
    algorithm: 'sha256' | 'md5' = 'sha256'
  ): Promise<string> {
    return this.checksumService.calculateFileChecksum(filepath, algorithm);
  }

  /**
   * Calculate checksum from buffer
   */
  calculateBufferChecksum(
    buffer: Buffer,
    algorithm: 'sha256' | 'md5' = 'sha256'
  ): string {
    return this.checksumService.calculateBufferChecksum(buffer, algorithm);
  }

  /**
   * Handle forced reprocessing for duplicate files
   */
  async handleForcedReprocessing(
    checksum: string,
    organizationId: string,
    options: ReprocessingOptions
  ): Promise<{
    allowed: boolean;
    originalFileId?: string;
    reprocessingRecordId?: string;
    reason: string;
  }> {
    return this.checksumService.handleForcedReprocessing(checksum, organizationId, options);
  }

  /**
   * Get checksum history for a file
   */
  async getChecksumHistory(
    checksum: string,
    organizationId: string
  ): Promise<Array<{
    id: string;
    filename: string;
    uploadedAt: Date;
    uploadedBy: string;
    currentState: string;
    processedRecords?: number;
  }>> {
    return this.checksumService.getChecksumHistory(checksum, organizationId);
  }

  /**
   * Start processing a run with optional staging cleanup
   */
  async startProcessing(
    runId: string,
    processingBy: string,
    cleanupOptions?: Partial<StagingCleanupOptions>
  ): Promise<StateTransitionResult & { cleanupResult?: CleanupResult }> {
    // Get run details for cleanup
    const run = await this.getETLRun(runId);
    if (!run) {
      throw new Error('Run not found');
    }

    // Clean staging tables if requested
    let cleanupResult: CleanupResult | undefined;
    if (cleanupOptions) {
      const fullCleanupOptions: StagingCleanupOptions = {
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

    if (error) throw error;

    // Transition to parsing state
    const transitionResult = await this.transitionRunState(
      runId,
      ETLState.PARSING,
      processingBy,
      'Processing started'
    );

    return {
      ...transitionResult,
      cleanupResult,
    };
  }

  /**
   * Complete parsing phase
   */
  async completeParsing(
    runId: string,
    recordsTotal: number,
    userId?: string
  ): Promise<StateTransitionResult> {
    // Update records count
    await this.supabaseClient
      .from('etl_run')
      .update({
        records_total: recordsTotal,
        updated_at: new Date(),
      })
      .eq('id', runId);

    // Transition to parsed state
    return this.transitionRunState(
      runId,
      ETLState.PARSED,
      userId,
      `Parsing completed: ${recordsTotal} records found`
    );
  }

  /**
   * Complete validation phase
   */
  async completeValidation(
    runId: string,
    recordsProcessed: number,
    recordsFailed: number,
    userId?: string
  ): Promise<StateTransitionResult> {
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
    return this.transitionRunState(
      runId,
      ETLState.VALIDATED,
      userId,
      `Validation completed: ${recordsProcessed} processed, ${recordsFailed} failed`
    );
  }

  /**
   * Handle run failure with retry logic
   */
  async handleRunFailure(
    runId: string,
    errorMessage: string,
    errorDetails?: Record<string, any>,
    isTransient: boolean = true
  ): Promise<RetryResult> {
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
    await this.transitionRunState(
      runId,
      ETLState.FAILED,
      undefined,
      errorMessage,
      { errorDetails, isTransient }
    );

    // Handle retry logic using the new retry service
    return this.retryLogicService.handleFailure(runId, errorMessage, errorDetails, isTransient);
  }

  /**
   * Get file by ID
   */
  async getETLFile(fileId: string): Promise<ETLFile | null> {
    const { data, error } = await this.supabaseClient
      .from('etl_file')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDbToETLFile(data);
  }

  /**
   * Get run by ID
   */
  async getETLRun(runId: string): Promise<ETLRun | null> {
    const { data, error } = await this.supabaseClient
      .from('etl_run')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDbToETLRun(data);
  }

  /**
   * Get runs for a file
   */
  async getFileRuns(fileId: string): Promise<ETLRun[]> {
    const { data, error } = await this.supabaseClient
      .from('etl_run')
      .select('*')
      .eq('file_id', fileId)
      .order('run_number', { ascending: false });

    if (error) throw error;
    return data.map(this.mapDbToETLRun);
  }

  /**
   * Check and release stale locks
   */
  async checkAndReleaseStaleLocKs(): Promise<string[]> {
    const staleRunIds = await this.stateMachine.checkStaleLocks(this.supabaseClient);

    const releasedRuns = [];
    for (const runId of staleRunIds) {
      try {
        await this.stateMachine.releaseStaLock(
          this.supabaseClient,
          runId,
          'Processing timeout - stale lock detected'
        );
        releasedRuns.push(runId);
      } catch (error) {
        console.error(`Failed to release stale lock for run ${runId}:`, error);
      }
    }

    return releasedRuns;
  }

  /**
   * Clean staging tables for reprocessing
   */
  async cleanupStagingTables(options: StagingCleanupOptions): Promise<CleanupResult> {
    return this.stagingCleanupService.cleanupStagingTables(options);
  }

  /**
   * Verify staging cleanup was successful
   */
  async verifyStagingCleanup(options: StagingCleanupOptions): Promise<{
    isClean: boolean;
    remainingRecords: Record<string, number>;
    details: string[];
  }> {
    return this.stagingCleanupService.verifyStagingCleanup(options);
  }

  /**
   * Get audit trail for ETL operations
   */
  async getAuditTrail(options: {
    organizationId: string;
    fileId?: string;
    runId?: string;
    action?: string;
    level?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.stagingCleanupService.getAuditTrail(options);
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(organizationId: string, timeRangeHours: number = 24) {
    return this.stagingCleanupService.getAuditStats(organizationId, timeRangeHours);
  }

  /**
   * Clean up old audit records
   */
  async cleanupOldAuditRecords(
    organizationId: string,
    retainDays: number = 90,
    dryRun: boolean = false
  ): Promise<CleanupResult> {
    return this.stagingCleanupService.cleanupOldAuditRecords(organizationId, retainDays, dryRun);
  }

  /**
   * Update record with optimistic locking
   */
  async updateWithLock<T>(
    tableName: string,
    id: string,
    updates: Partial<T>,
    options?: LockingOptions
  ): Promise<LockingResult<T>> {
    return this.lockingService.updateWithLock(tableName, id, updates, options) as Promise<LockingResult<T>>;
  }

  /**
   * Execute operation with exclusive lock
   */
  async withLock<T>(
    tableName: string,
    id: string,
    operation: (lockId: string) => Promise<T>,
    lockTimeout: number = 30000
  ): Promise<LockingResult<T>> {
    return this.lockingService.withLock(tableName, id, operation, lockTimeout);
  }

  /**
   * Release expired locks for maintenance
   */
  async releaseExpiredLocks(): Promise<{ etlFile: number; etlRun: number }> {
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
  async getLockingStats(): Promise<{
    etlFile: any;
    etlRun: any;
  }> {
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
  async getRetryReadyRuns(organizationId?: string) {
    return this.retryLogicService.getRetryReadyRuns(organizationId);
  }

  /**
   * Clear retry schedule after successful processing
   */
  async clearRetrySchedule(runId: string): Promise<void> {
    return this.retryLogicService.clearRetrySchedule(runId);
  }

  /**
   * Get dead letter queue entries
   */
  async getDeadLetterQueueEntries(
    organizationId?: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return this.retryLogicService.getDeadLetterQueueEntries(organizationId, limit, offset);
  }

  /**
   * Mark DLQ entry for retry
   */
  async markDLQForRetry(dlqId: string, retryAfter?: Date) {
    return this.retryLogicService.markForRetry(dlqId, retryAfter);
  }

  /**
   * Remove entry from dead letter queue
   */
  async removeFromDeadLetterQueue(dlqId: string) {
    return this.retryLogicService.removeFromDeadLetterQueue(dlqId);
  }

  /**
   * Get retry statistics for monitoring
   */
  async getRetryStats(organizationId?: string) {
    return this.retryLogicService.getRetryStats(organizationId);
  }

  /**
   * Process marked DLQ entries for retry
   */
  async processMarkedDLQEntries(organizationId?: string) {
    return this.retryLogicService.processMarkedDLQEntries(organizationId);
  }

  /**
   * Clean up old DLQ entries
   */
  async cleanupOldDLQEntries(olderThanDays: number = 30, organizationId?: string) {
    return this.retryLogicService.cleanupOldDLQEntries(olderThanDays, organizationId);
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryLogicService.updateConfig(newConfig);
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return this.retryLogicService.getConfig();
  }

  /**
   * Execute ETL operation with retry logic and monitoring
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    entityType: 'etl_file' | 'etl_run',
    entityId: string,
    organizationId: string,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    return this.retryLogicService.executeWithRetry(
      operation,
      entityType,
      entityId,
      organizationId,
      config
    );
  }

  /**
   * Process ETL file with complete retry and monitoring integration
   */
  async processFileWithRetry(
    fileId: string,
    organizationId: string,
    processor: (file: ETLFile) => Promise<void>,
    userId?: string
  ): Promise<RetryResult<void>> {
    return this.executeWithRetry(
      async () => {
        const file = await this.getETLFile(fileId);
        if (!file) {
          throw new Error(`ETL file ${fileId} not found`);
        }

        // Transition to processing state
        await this.transitionFileState(
          fileId,
          ETLState.PARSING,
          userId,
          'Starting file processing with retry logic'
        );

        try {
          await processor(file);

          // Mark as successfully parsed
          await this.transitionFileState(
            fileId,
            ETLState.PARSED,
            userId,
            'File processing completed successfully'
          );
        } catch (error) {
          // Transition to failed state and let retry logic handle it
          await this.transitionFileState(
            fileId,
            ETLState.FAILED,
            userId,
            `File processing failed: ${error}`
          );
          throw error;
        }
      },
      'etl_file',
      fileId,
      organizationId
    );
  }

  /**
   * Process ETL run with complete retry and monitoring integration
   */
  async processRunWithRetry(
    runId: string,
    organizationId: string,
    processor: (run: ETLRun) => Promise<void>,
    userId?: string
  ): Promise<RetryResult<void>> {
    return this.executeWithRetry(
      async () => {
        const run = await this.getETLRun(runId);
        if (!run) {
          throw new Error(`ETL run ${runId} not found`);
        }

        // Transition to processing state
        await this.transitionRunState(
          runId,
          ETLState.LOADING,
          userId,
          'Starting run processing with retry logic'
        );

        try {
          await processor(run);

          // Mark as successfully completed
          await this.transitionRunState(
            runId,
            ETLState.LOADED,
            userId,
            'Run processing completed successfully'
          );
        } catch (error) {
          // Transition to failed state and let retry logic handle it
          await this.transitionRunState(
            runId,
            ETLState.FAILED,
            userId,
            `Run processing failed: ${error}`
          );
          throw error;
        }
      },
      'etl_run',
      runId,
      organizationId
    );
  }

  /**
   * Get entities ready for retry processing
   */
  async getEntitiesReadyForRetry(organizationId: string): Promise<{
    files: ETLFile[];
    runs: ETLRun[];
  }> {
    return this.retryLogicService.getEntitiesReadyForRetry(organizationId);
  }

  /**
   * Get dead letter queue entries with full monitoring info
   */
  async getDeadLetterQueueEntriesWithDetails(
    organizationId: string,
    limit: number = 100,
    resolved: boolean = false
  ) {
    return this.retryLogicService.getDeadLetterQueueEntries(organizationId, limit, resolved);
  }

  /**
   * Resolve dead letter queue entry
   */
  async resolveDeadLetterQueueEntry(
    entryId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    return this.retryLogicService.resolveDeadLetterQueueEntry(entryId, resolvedBy, resolutionNotes);
  }

  /**
   * Get comprehensive monitoring metrics
   */
  async getMonitoringMetrics(organizationId: string) {
    return this.monitoringService.getMetrics(organizationId);
  }

  /**
   * Check for alerts and send notifications
   */
  async checkAlerts(organizationId: string) {
    return this.monitoringService.checkAlerts(organizationId);
  }

  /**
   * Get health check status
   */
  async getHealthCheck(organizationId: string) {
    return this.monitoringService.getHealthCheck(organizationId);
  }

  /**
   * Start automatic monitoring for an organization
   */
  startMonitoring(organizationId: string, intervalMs: number = 300000) {
    return this.monitoringService.startMonitoring(organizationId, intervalMs);
  }

  /**
   * Register alert callback for notifications
   */
  onAlert(callback: (alert: any) => Promise<void>) {
    this.monitoringService.onAlert(callback);
  }

  /**
   * Get retry statistics for dashboard
   */
  async getRetryStatistics(organizationId: string) {
    return this.retryLogicService.getRetryStatistics(organizationId);
  }

  /**
   * Classify error type for retry decisions
   */
  classifyError(error: Error | string): ErrorType {
    return this.retryLogicService.classifyError(error);
  }

  /**
   * Process all entities ready for retry
   */
  async processRetryQueue(
    organizationId: string,
    processorCallbacks: {
      fileProcessor?: (file: ETLFile) => Promise<void>;
      runProcessor?: (run: ETLRun) => Promise<void>;
    }
  ): Promise<{
    filesProcessed: number;
    runsProcessed: number;
    errors: Array<{ type: string; id: string; error: string }>;
  }> {
    const { files, runs } = await this.getEntitiesReadyForRetry(organizationId);
    const errors: Array<{ type: string; id: string; error: string }> = [];

    let filesProcessed = 0;
    let runsProcessed = 0;

    // Process ready files
    if (processorCallbacks.fileProcessor) {
      for (const file of files) {
        try {
          const result = await this.processFileWithRetry(
            file.id,
            organizationId,
            processorCallbacks.fileProcessor
          );

          if (result.success) {
            filesProcessed++;
          } else if (result.sentToDeadLetterQueue) {
            errors.push({
              type: 'file',
              id: file.id,
              error: result.errorMessage || 'Unknown error'
            });
          }
        } catch (error) {
          errors.push({
            type: 'file',
            id: file.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    // Process ready runs
    if (processorCallbacks.runProcessor) {
      for (const run of runs) {
        try {
          const result = await this.processRunWithRetry(
            run.id,
            organizationId,
            processorCallbacks.runProcessor
          );

          if (result.success) {
            runsProcessed++;
          } else if (result.sentToDeadLetterQueue) {
            errors.push({
              type: 'run',
              id: run.id,
              error: result.errorMessage || 'Unknown error'
            });
          }
        } catch (error) {
          errors.push({
            type: 'run',
            id: run.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return { filesProcessed, runsProcessed, errors };
  }

  /**
   * Map database record to ETLFile
   */
  private mapDbToETLFile(data: any): ETLFile {
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
  private mapDbToETLRun(data: any): ETLRun {
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