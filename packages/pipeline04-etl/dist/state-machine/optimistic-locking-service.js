/**
 * Optimistic Locking Service
 * Provides concurrency control for ETL operations using version-based optimistic locking
 */
export class OptimisticLockingService {
    supabaseClient;
    defaultOptions = {
        maxRetries: 3,
        retryDelayMs: 100,
        backoffMultiplier: 2,
        sessionId: '',
        processingTimeout: 300000, // 5 minutes default
    };
    constructor(supabaseClient, options) {
        this.supabaseClient = supabaseClient;
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
    /**
     * Update a record with optimistic locking
     */
    async updateWithLock(tableName, id, updates, options) {
        const opts = { ...this.defaultOptions, ...options };
        let lastError = '';
        let currentVersion;
        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                // Get current record with version
                const { data: currentRecord, error: fetchError } = await this.supabaseClient
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .single();
                if (fetchError) {
                    return {
                        success: false,
                        error: `Failed to fetch record: ${fetchError.message}`,
                        retryAttempt: attempt,
                    };
                }
                if (!currentRecord) {
                    return {
                        success: false,
                        error: 'Record not found',
                        retryAttempt: attempt,
                    };
                }
                currentVersion = currentRecord.version;
                const newVersion = (currentVersion || 0) + 1;
                // Prepare the update with version increment
                const updateData = {
                    ...updates,
                    version: newVersion,
                    updated_at: new Date(),
                };
                // Perform the conditional update
                const { data, error } = await this.supabaseClient
                    .from(tableName)
                    .update(updateData)
                    .eq('id', id)
                    .eq('version', currentVersion) // This ensures optimistic locking
                    .select()
                    .single();
                if (error) {
                    // Check if it's a version conflict (no rows affected)
                    if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
                        lastError = `Version conflict detected. Expected version ${currentVersion}, but record was modified by another process.`;
                        if (attempt < opts.maxRetries) {
                            // Wait before retry with exponential backoff
                            const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                            await this.delay(delay);
                            continue;
                        }
                    }
                    else {
                        return {
                            success: false,
                            error: `Update failed: ${error.message}`,
                            currentVersion,
                            retryAttempt: attempt,
                        };
                    }
                }
                else if (data) {
                    // Success
                    return {
                        success: true,
                        data: data,
                        currentVersion: newVersion,
                        retryAttempt: attempt,
                    };
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                if (attempt < opts.maxRetries) {
                    const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                    await this.delay(delay);
                }
            }
        }
        return {
            success: false,
            error: `Max retries (${opts.maxRetries}) exceeded. Last error: ${lastError}`,
            currentVersion,
            retryAttempt: opts.maxRetries,
        };
    }
    /**
     * Update multiple records with optimistic locking in a transaction
     */
    async updateMultipleWithLock(updates, options) {
        const opts = { ...this.defaultOptions, ...options };
        let lastError = '';
        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                // Start a transaction
                const { data, error } = await this.supabaseClient.rpc('update_multiple_with_lock', {
                    p_updates: updates.map(update => ({
                        table_name: update.tableName,
                        record_id: update.id,
                        update_data: JSON.stringify({
                            ...update.updates,
                            version: (update.expectedVersion || 0) + 1,
                            updated_at: new Date(),
                        }),
                        expected_version: update.expectedVersion,
                    })),
                });
                if (error) {
                    if (error.message?.includes('version_conflict')) {
                        lastError = 'Version conflict in transaction';
                        if (attempt < opts.maxRetries) {
                            const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                            await this.delay(delay);
                            continue;
                        }
                    }
                    else {
                        return {
                            success: false,
                            error: `Transaction failed: ${error.message}`,
                            retryAttempt: attempt,
                        };
                    }
                }
                else {
                    return {
                        success: true,
                        data: data,
                        retryAttempt: attempt,
                    };
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                if (attempt < opts.maxRetries) {
                    const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                    await this.delay(delay);
                }
            }
        }
        return {
            success: false,
            error: `Max retries (${opts.maxRetries}) exceeded. Last error: ${lastError}`,
            retryAttempt: opts.maxRetries,
        };
    }
    /**
     * Safely increment a counter field with optimistic locking
     */
    async incrementCounter(tableName, id, field, incrementBy = 1, options) {
        const opts = { ...this.defaultOptions, ...options };
        return this.updateWithLock(tableName, id, {
            [field]: this.supabaseClient.raw(`${field} + ${incrementBy}`),
        }, opts);
    }
    /**
     * Check if a record exists and get its current version
     */
    async getRecordVersion(tableName, id) {
        try {
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .select('version, *')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return { exists: false };
                }
                throw error;
            }
            return {
                exists: true,
                version: data.version,
                data,
            };
        }
        catch (error) {
            throw new Error(`Failed to get record version: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Lock a record for exclusive access (pessimistic locking)
     */
    async lockRecord(tableName, id, lockTimeout = 30000, // 30 seconds
    lockId) {
        const generatedLockId = lockId || `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + lockTimeout);
        try {
            // Try to acquire the lock
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .update({
                locked_by: generatedLockId,
                locked_at: new Date(),
                lock_expires_at: expiresAt,
                updated_at: new Date(),
            })
                .eq('id', id)
                .is('locked_by', null) // Only update if not already locked
                .select()
                .single();
            if (error || !data) {
                return {
                    success: false,
                    error: 'Record is already locked or does not exist',
                };
            }
            return {
                success: true,
                data: {
                    lockId: generatedLockId,
                    expiresAt,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to acquire lock: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Release a record lock
     */
    async releaseLock(tableName, id, lockId) {
        try {
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .update({
                locked_by: null,
                locked_at: null,
                lock_expires_at: null,
                updated_at: new Date(),
            })
                .eq('id', id)
                .eq('locked_by', lockId) // Only release if we own the lock
                .select()
                .single();
            if (error || !data) {
                return {
                    success: false,
                    error: 'Lock not found or not owned by the specified lockId',
                };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to release lock: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Check and release expired locks
     */
    async releaseExpiredLocks(tableName) {
        try {
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .update({
                locked_by: null,
                locked_at: null,
                lock_expires_at: null,
                updated_at: new Date(),
            })
                .lt('lock_expires_at', new Date().toISOString())
                .not('locked_by', 'is', null)
                .select('id');
            if (error) {
                return {
                    releasedCount: 0,
                    errors: [error.message],
                };
            }
            return {
                releasedCount: data?.length || 0,
                errors: [],
            };
        }
        catch (error) {
            return {
                releasedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Execute a function with automatic lock acquisition and release
     */
    async withLock(tableName, id, operation, lockTimeout = 30000) {
        const lockResult = await this.lockRecord(tableName, id, lockTimeout);
        if (!lockResult.success || !lockResult.data) {
            return {
                success: false,
                error: lockResult.error,
            };
        }
        const { lockId } = lockResult.data;
        try {
            const result = await operation(lockId);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
        finally {
            // Always try to release the lock
            await this.releaseLock(tableName, id, lockId);
        }
    }
    /**
     * Utility function to add delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get locking statistics for monitoring
     */
    async getLockingStats(tableName) {
        try {
            const { data, error } = await this.supabaseClient
                .rpc('get_locking_stats', { p_table_name: tableName });
            if (error)
                throw error;
            return data || {
                totalRecords: 0,
                lockedRecords: 0,
                expiredLocks: 0,
                averageLockDuration: 0,
            };
        }
        catch (error) {
            console.error('Failed to get locking stats:', error);
            return {
                totalRecords: 0,
                lockedRecords: 0,
                expiredLocks: 0,
                averageLockDuration: 0,
            };
        }
    }
    /**
     * Perform a safe ETL state transition with concurrency control
     */
    async safeStateTransition(request, options) {
        const opts = { ...this.defaultOptions, ...options };
        let lastError = '';
        let currentVersion;
        try {
            // First, check for stale processing sessions
            const staleCheck = await this.checkForStaleProcessing(request.tableName, request.id, opts);
            if (staleCheck.isStaleProcessing) {
                return {
                    success: false,
                    error: `Stale processing session detected: ${staleCheck.error}`,
                    isStaleProcessing: true,
                };
            }
            // Perform the state transition with optimistic locking
            for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
                try {
                    // Get current record with lock check
                    const { data: currentRecord, error: fetchError } = await this.supabaseClient
                        .from(request.tableName)
                        .select('*')
                        .eq('id', request.id)
                        .single();
                    if (fetchError) {
                        return {
                            success: false,
                            error: `Failed to fetch record: ${fetchError.message}`,
                            retryAttempt: attempt,
                        };
                    }
                    if (!currentRecord) {
                        return {
                            success: false,
                            error: 'Record not found',
                            retryAttempt: attempt,
                        };
                    }
                    currentVersion = currentRecord.version;
                    // Check if another session is processing this record
                    if (currentRecord.processing_by &&
                        currentRecord.processing_by !== request.sessionId &&
                        this.isProcessingSessionActive(currentRecord)) {
                        return {
                            success: false,
                            error: `Record is being processed by another session: ${currentRecord.processing_by}`,
                            retryAttempt: attempt,
                            sessionId: currentRecord.processing_by,
                        };
                    }
                    // Validate state transition
                    const isValidTransition = await this.validateStateTransition(request.fromState, request.toState, currentRecord.current_state);
                    if (!isValidTransition) {
                        return {
                            success: false,
                            error: `Invalid state transition from ${currentRecord.current_state} to ${request.toState}`,
                            retryAttempt: attempt,
                        };
                    }
                    // Check version if specified
                    if (request.expectedVersion && currentVersion !== request.expectedVersion) {
                        lastError = `Version conflict: expected ${request.expectedVersion}, found ${currentVersion}`;
                        if (attempt < opts.maxRetries) {
                            const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                            await this.delay(delay);
                            continue;
                        }
                    }
                    const newVersion = (currentVersion || 0) + 1;
                    // Prepare state transition update
                    const updateData = {
                        current_state: request.toState,
                        version: newVersion,
                        updated_at: new Date(),
                        processing_by: request.processingBy,
                        processing_started_at: new Date(),
                        ...(request.metadata || {}),
                    };
                    // Add state history entry
                    const stateHistory = currentRecord.state_history || [];
                    stateHistory.push({
                        from_state: currentRecord.current_state,
                        to_state: request.toState,
                        timestamp: new Date(),
                        processing_by: request.processingBy,
                        session_id: request.sessionId,
                        metadata: request.metadata,
                    });
                    updateData.state_history = stateHistory;
                    // Perform the conditional update
                    const { data, error } = await this.supabaseClient
                        .from(request.tableName)
                        .update(updateData)
                        .eq('id', request.id)
                        .eq('version', currentVersion)
                        .select()
                        .single();
                    if (error) {
                        if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
                            lastError = `Version conflict during state transition. Record was modified by another process.`;
                            if (attempt < opts.maxRetries) {
                                const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                                await this.delay(delay);
                                continue;
                            }
                        }
                        else {
                            return {
                                success: false,
                                error: `State transition failed: ${error.message}`,
                                currentVersion,
                                retryAttempt: attempt,
                            };
                        }
                    }
                    else if (data) {
                        return {
                            success: true,
                            data: data,
                            currentVersion: newVersion,
                            retryAttempt: attempt,
                            sessionId: request.sessionId,
                        };
                    }
                }
                catch (error) {
                    lastError = error instanceof Error ? error.message : 'Unknown error';
                    if (attempt < opts.maxRetries) {
                        const delay = opts.retryDelayMs * Math.pow(opts.backoffMultiplier, attempt);
                        await this.delay(delay);
                    }
                }
            }
            return {
                success: false,
                error: `Max retries (${opts.maxRetries}) exceeded. Last error: ${lastError}`,
                currentVersion,
                retryAttempt: opts.maxRetries,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `State transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Check for stale processing sessions
     */
    async checkForStaleProcessing(tableName, recordId, options) {
        try {
            const { data: record, error } = await this.supabaseClient
                .from(tableName)
                .select('processing_by, processing_started_at, session_id')
                .eq('id', recordId)
                .single();
            if (error) {
                return {
                    success: false,
                    error: `Failed to check processing status: ${error.message}`,
                };
            }
            if (!record) {
                return { success: true };
            }
            // Check if processing session is stale
            if (record.processing_by && record.processing_started_at) {
                const processingStarted = new Date(record.processing_started_at);
                const now = new Date();
                const processingDuration = now.getTime() - processingStarted.getTime();
                if (processingDuration > (options.processingTimeout || this.defaultOptions.processingTimeout)) {
                    return {
                        success: false,
                        error: `Processing session is stale. Started ${processingDuration}ms ago by ${record.processing_by}`,
                        isStaleProcessing: true,
                        sessionId: record.processing_by,
                    };
                }
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to check stale processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Clear stale processing sessions
     */
    async clearStaleProcessingSessions(tableName, timeoutMs = this.defaultOptions.processingTimeout) {
        try {
            const cutoffTime = new Date(Date.now() - timeoutMs);
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .update({
                processing_by: null,
                processing_started_at: null,
                updated_at: new Date(),
            })
                .lt('processing_started_at', cutoffTime.toISOString())
                .not('processing_by', 'is', null)
                .select('id');
            if (error) {
                return {
                    clearedCount: 0,
                    errors: [error.message],
                };
            }
            return {
                clearedCount: data?.length || 0,
                errors: [],
            };
        }
        catch (error) {
            return {
                clearedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Validate state transition using database function
     */
    async validateStateTransition(fromState, toState, currentState) {
        try {
            // First check if current state matches expected from state
            if (fromState && currentState !== fromState) {
                return false;
            }
            // Use database function to validate transition
            const { data, error } = await this.supabaseClient
                .rpc('is_valid_state_transition', {
                p_from_state: currentState,
                p_to_state: toState,
            });
            if (error) {
                console.error('Failed to validate state transition:', error);
                return false;
            }
            return data === true;
        }
        catch (error) {
            console.error('Error validating state transition:', error);
            return false;
        }
    }
    /**
     * Check if a processing session is still active
     */
    isProcessingSessionActive(record) {
        if (!record.processing_started_at) {
            return false;
        }
        const processingStarted = new Date(record.processing_started_at);
        const now = new Date();
        const duration = now.getTime() - processingStarted.getTime();
        return duration < this.defaultOptions.processingTimeout;
    }
    /**
     * Release processing session
     */
    async releaseProcessingSession(tableName, recordId, sessionId) {
        try {
            const { data, error } = await this.supabaseClient
                .from(tableName)
                .update({
                processing_by: null,
                processing_started_at: null,
                updated_at: new Date(),
            })
                .eq('id', recordId)
                .eq('processing_by', sessionId)
                .select()
                .single();
            if (error || !data) {
                return {
                    success: false,
                    error: 'Processing session not found or not owned by the specified session ID',
                };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to release processing session: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get concurrency statistics for monitoring
     */
    async getConcurrencyStats(tableName, organizationId) {
        try {
            let query = this.supabaseClient.from(tableName).select('*');
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
            const { data: records, error } = await query;
            if (error) {
                throw error;
            }
            const now = new Date();
            const timeoutMs = this.defaultOptions.processingTimeout;
            let activeProcessingSessions = 0;
            let staleSessions = 0;
            let activeLocks = 0;
            let expiredLocks = 0;
            for (const record of records || []) {
                // Check processing sessions
                if (record.processing_by && record.processing_started_at) {
                    const processingStarted = new Date(record.processing_started_at);
                    const duration = now.getTime() - processingStarted.getTime();
                    if (duration < timeoutMs) {
                        activeProcessingSessions++;
                    }
                    else {
                        staleSessions++;
                    }
                }
                // Check locks
                if (record.locked_by) {
                    if (record.lock_expires_at && new Date(record.lock_expires_at) > now) {
                        activeLocks++;
                    }
                    else {
                        expiredLocks++;
                    }
                }
            }
            return {
                activeProcessingSessions,
                staleSessions,
                activeLocks,
                expiredLocks,
                recentConflicts: 0, // This would require additional tracking
            };
        }
        catch (error) {
            console.error('Failed to get concurrency stats:', error);
            return {
                activeProcessingSessions: 0,
                staleSessions: 0,
                activeLocks: 0,
                expiredLocks: 0,
                recentConflicts: 0,
            };
        }
    }
}
