/**
 * ETL State Machine Implementation
 * Manages state transitions and enforces business rules
 */
import { ETLState, STATE_TRANSITIONS, DEFAULT_STATE_MACHINE_CONFIG, } from './types.js';
export class ETLStateMachine {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_STATE_MACHINE_CONFIG, ...config };
    }
    /**
     * Check if a state transition is valid
     */
    isValidTransition(fromState, toState) {
        const allowedStates = STATE_TRANSITIONS[fromState] || [];
        return allowedStates.includes(toState);
    }
    /**
     * Get all valid next states from current state
     */
    getValidNextStates(currentState) {
        return STATE_TRANSITIONS[currentState] || [];
    }
    /**
     * Transition to a new state
     */
    async transitionState(request, supabaseClient) {
        const { fileId, runId, fromState, toState, userId, message, metadata } = request;
        // Validate transition
        if (!this.isValidTransition(fromState, toState)) {
            return {
                success: false,
                previousState: fromState,
                currentState: fromState,
                timestamp: new Date(),
                error: `Invalid state transition from ${fromState} to ${toState}`,
            };
        }
        const timestamp = new Date();
        const stateMetadata = {
            state: toState,
            timestamp,
            userId,
            message,
            metadata,
        };
        try {
            // Start transaction-like operation
            const updates = [];
            // Update ETL File if fileId provided
            if (fileId) {
                const fileUpdate = this.updateFileState(supabaseClient, fileId, toState, stateMetadata);
                updates.push(fileUpdate);
            }
            // Update ETL Run if runId provided
            if (runId) {
                const runUpdate = this.updateRunState(supabaseClient, runId, toState, stateMetadata);
                updates.push(runUpdate);
            }
            // Log the transition
            const logEntry = this.logTransition(supabaseClient, {
                fileId: fileId || '',
                runId: runId || '',
                fromState,
                toState,
                userId,
                message,
                metadata,
            });
            updates.push(logEntry);
            // Execute all updates
            const results = await Promise.all(updates);
            const logId = results[results.length - 1]?.id;
            return {
                success: true,
                previousState: fromState,
                currentState: toState,
                timestamp,
                logId,
            };
        }
        catch (error) {
            console.error('State transition failed:', error);
            return {
                success: false,
                previousState: fromState,
                currentState: fromState,
                timestamp,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Update file state with optimistic locking
     */
    async updateFileState(supabaseClient, fileId, newState, stateMetadata) {
        // Get current file with version
        const { data: currentFile, error: fetchError } = await supabaseClient
            .from('etl_file')
            .select('*')
            .eq('id', fileId)
            .single();
        if (fetchError)
            throw new Error(`Failed to fetch file: ${fetchError.message}`);
        // Prepare state history update
        const updatedStateHistory = [
            ...(currentFile.state_history || []),
            stateMetadata,
        ];
        // Update with optimistic locking
        const { data, error } = await supabaseClient
            .from('etl_file')
            .update({
            current_state: newState,
            state_history: updatedStateHistory,
            [`${newState.toLowerCase()}_at`]: stateMetadata.timestamp,
            version: currentFile.version + 1,
            updated_at: new Date(),
        })
            .eq('id', fileId)
            .eq('version', currentFile.version); // Optimistic lock check
        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Concurrent modification detected. Please retry.');
            }
            throw error;
        }
        return data;
    }
    /**
     * Update run state with optimistic locking
     */
    async updateRunState(supabaseClient, runId, newState, stateMetadata) {
        // Get current run with version
        const { data: currentRun, error: fetchError } = await supabaseClient
            .from('etl_run')
            .select('*')
            .eq('id', runId)
            .single();
        if (fetchError)
            throw new Error(`Failed to fetch run: ${fetchError.message}`);
        // Prepare state history update
        const updatedStateHistory = [
            ...(currentRun.state_history || []),
            stateMetadata,
        ];
        // Update with optimistic locking
        const { data, error } = await supabaseClient
            .from('etl_run')
            .update({
            current_state: newState,
            state_history: updatedStateHistory,
            version: currentRun.version + 1,
            updated_at: new Date(),
            ...(newState === ETLState.LOADED || newState === ETLState.FAILED || newState === ETLState.CANCELLED
                ? { completed_at: stateMetadata.timestamp }
                : {}),
        })
            .eq('id', runId)
            .eq('version', currentRun.version); // Optimistic lock check
        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Concurrent modification detected. Please retry.');
            }
            throw error;
        }
        return data;
    }
    /**
     * Log state transition
     */
    async logTransition(supabaseClient, transition) {
        const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            run_id: transition.runId,
            file_id: transition.fileId,
            organization_id: transition.metadata?.organizationId || '',
            timestamp: new Date(),
            level: 'info',
            message: transition.message || `State transition: ${transition.fromState} → ${transition.toState}`,
            details: transition.metadata,
            state: transition.toState,
            previous_state: transition.fromState,
            user_id: transition.userId,
            action: 'state_transition',
            created_at: new Date(),
        };
        const { data, error } = await supabaseClient
            .from('etl_run_log')
            .insert(logEntry)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Check for stale processing locks
     */
    async checkStaleLocks(supabaseClient) {
        const staleThreshold = new Date(Date.now() - this.config.staleProcessingTimeoutMs);
        // Find runs that are in processing states but haven't been updated recently
        const processingStates = [
            ETLState.PARSING,
            ETLState.VALIDATING,
            ETLState.LOADING,
        ];
        const { data, error } = await supabaseClient
            .from('etl_run')
            .select('id, file_id, current_state, processing_started_at')
            .in('current_state', processingStates)
            .lt('processing_started_at', staleThreshold.toISOString());
        if (error) {
            console.error('Failed to check stale locks:', error);
            return [];
        }
        return data?.map((run) => run.id) || [];
    }
    /**
     * Release stale lock and transition to failed state
     */
    async releaseStaLock(supabaseClient, runId, reason = 'Processing timeout') {
        // Get current state
        const { data: run, error } = await supabaseClient
            .from('etl_run')
            .select('current_state')
            .eq('id', runId)
            .single();
        if (error || !run) {
            return {
                success: false,
                previousState: ETLState.UPLOADED,
                currentState: ETLState.UPLOADED,
                timestamp: new Date(),
                error: 'Run not found',
            };
        }
        // Transition to failed state
        return this.transitionState({
            runId,
            fromState: run.current_state,
            toState: ETLState.FAILED,
            message: reason,
            metadata: { reason: 'stale_lock_timeout' },
        }, supabaseClient);
    }
    /**
     * Calculate next retry time with exponential backoff
     */
    calculateNextRetryTime(retryCount) {
        const delayMs = this.config.retryDelayMs *
            Math.pow(this.config.retryBackoffMultiplier, retryCount);
        return new Date(Date.now() + delayMs);
    }
    /**
     * Check if retry is allowed
     */
    canRetry(retryCount) {
        return this.config.autoRetry && retryCount < this.config.maxRetries;
    }
    /**
     * Handle failure with retry logic
     */
    async handleFailure(supabaseClient, runId, error, isTransient = true) {
        // Get current run
        const { data: run, error: fetchError } = await supabaseClient
            .from('etl_run')
            .select('retry_count')
            .eq('id', runId)
            .single();
        if (fetchError || !run) {
            return { shouldRetry: false };
        }
        const retryCount = run.retry_count || 0;
        // Check if retry is allowed
        if (!isTransient || !this.canRetry(retryCount)) {
            // Move to dead letter queue if enabled
            if (this.config.deadLetterQueueEnabled) {
                await this.moveToDeadLetterQueue(supabaseClient, runId, error);
            }
            return { shouldRetry: false };
        }
        // Calculate next retry time
        const nextRetryAt = this.calculateNextRetryTime(retryCount);
        // Update run with retry information
        await supabaseClient
            .from('etl_run')
            .update({
            retry_count: retryCount + 1,
            next_retry_at: nextRetryAt,
            error_message: error,
            updated_at: new Date(),
        })
            .eq('id', runId);
        return { shouldRetry: true, nextRetryAt };
    }
    /**
     * Move failed run to dead letter queue
     */
    async moveToDeadLetterQueue(supabaseClient, runId, error) {
        const dlqEntry = {
            id: `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            run_id: runId,
            error_message: error,
            max_retries_exceeded: true,
            created_at: new Date(),
        };
        await supabaseClient
            .from('etl_dead_letter_queue')
            .insert(dlqEntry);
        // Log to audit trail
        await supabaseClient
            .from('etl_run_log')
            .insert({
            id: `log-dlq-${Date.now()}`,
            run_id: runId,
            timestamp: new Date(),
            level: 'error',
            message: 'Run moved to dead letter queue',
            details: { error, max_retries_exceeded: true },
            action: 'dead_letter_queue',
            created_at: new Date(),
        });
    }
}
