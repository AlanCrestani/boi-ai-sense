/**
 * Checksum Service for ETL File Processing
 * Handles file checksum calculation and duplicate detection
 */
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
/**
 * Service for handling file checksums and duplicate detection
 */
export class ChecksumService {
    supabaseClient;
    defaultAlgorithm = 'sha256';
    constructor(supabaseClient, algorithm = 'sha256') {
        this.supabaseClient = supabaseClient;
        this.defaultAlgorithm = algorithm;
    }
    /**
     * Calculate checksum for a file
     */
    async calculateFileChecksum(filepath, algorithm = this.defaultAlgorithm) {
        try {
            const fileBuffer = await readFile(filepath);
            const hash = createHash(algorithm);
            hash.update(fileBuffer);
            return hash.digest('hex');
        }
        catch (error) {
            throw new Error(`Failed to calculate checksum for ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Calculate checksum from buffer data
     */
    calculateBufferChecksum(buffer, algorithm = this.defaultAlgorithm) {
        const hash = createHash(algorithm);
        hash.update(buffer);
        return hash.digest('hex');
    }
    /**
     * Check if file is duplicate based on checksum
     */
    async checkForDuplicate(checksum, organizationId, currentFileId) {
        try {
            // Query for existing files with the same checksum
            let query = this.supabaseClient
                .from('etl_file')
                .select(`
          id,
          filename,
          uploaded_at,
          uploaded_by,
          current_state,
          filepath
        `)
                .eq('checksum', checksum)
                .eq('organization_id', organizationId)
                .order('uploaded_at', { ascending: false });
            // Exclude current file if provided (for updates)
            if (currentFileId) {
                query = query.neq('id', currentFileId);
            }
            const { data: duplicateFiles, error } = await query;
            if (error) {
                throw new Error(`Database query failed: ${error.message}`);
            }
            if (!duplicateFiles || duplicateFiles.length === 0) {
                return {
                    isDuplicate: false,
                    allowReprocessing: true,
                    reason: 'No duplicate files found',
                };
            }
            // Get the most recent duplicate
            const originalFile = duplicateFiles[0];
            // Determine if reprocessing should be allowed
            const allowReprocessing = this.shouldAllowReprocessing(originalFile);
            return {
                isDuplicate: true,
                originalFile: {
                    id: originalFile.id,
                    filename: originalFile.filename,
                    uploadedAt: new Date(originalFile.uploaded_at),
                    uploadedBy: originalFile.uploaded_by,
                    currentState: originalFile.current_state,
                },
                allowReprocessing,
                reason: allowReprocessing
                    ? 'Duplicate found but reprocessing allowed'
                    : 'Duplicate found - reprocessing blocked',
            };
        }
        catch (error) {
            console.error('Error checking for duplicates:', error);
            throw error;
        }
    }
    /**
     * Determine if reprocessing should be allowed based on original file state
     */
    shouldAllowReprocessing(originalFile) {
        const state = originalFile.current_state;
        // Allow reprocessing if the original file failed or was cancelled
        const failedStates = ['failed', 'cancelled'];
        if (failedStates.includes(state)) {
            return true;
        }
        // Allow reprocessing if the original file is very old (>30 days)
        const uploadedAt = new Date(originalFile.uploaded_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (uploadedAt < thirtyDaysAgo) {
            return true;
        }
        // Block reprocessing for recently successful files
        const successfulStates = ['loaded', 'approved'];
        if (successfulStates.includes(state)) {
            return false;
        }
        // Allow reprocessing for files still in progress (they might be stuck)
        return true;
    }
    /**
     * Handle forced reprocessing
     */
    async handleForcedReprocessing(checksum, organizationId, options) {
        if (!options.forcedReprocessing) {
            return {
                allowed: false,
                reason: 'Forced reprocessing not requested',
            };
        }
        try {
            // Check for existing file
            const duplicateResult = await this.checkForDuplicate(checksum, organizationId);
            if (!duplicateResult.isDuplicate || !duplicateResult.originalFile) {
                return {
                    allowed: true,
                    reason: 'No duplicate found - processing normally',
                };
            }
            // Create reprocessing record
            const reprocessingRecord = {
                id: `reprocess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                original_file_id: duplicateResult.originalFile.id,
                checksum,
                organization_id: organizationId,
                forced_by: options.userId,
                reason: options.reason || 'Manual forced reprocessing',
                skip_validation: options.skipValidation || false,
                created_at: new Date(),
            };
            const { data, error } = await this.supabaseClient
                .from('etl_reprocessing_log')
                .insert(reprocessingRecord)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create reprocessing record: ${error.message}`);
            }
            // Log the forced reprocessing
            await this.logReprocessingEvent({
                level: 'warning',
                message: `Forced reprocessing initiated for duplicate file`,
                details: {
                    originalFileId: duplicateResult.originalFile.id,
                    checksum,
                    forcedBy: options.userId,
                    reason: options.reason,
                },
                organizationId,
                userId: options.userId,
            });
            return {
                allowed: true,
                originalFileId: duplicateResult.originalFile.id,
                reprocessingRecordId: data.id,
                reason: 'Forced reprocessing approved',
            };
        }
        catch (error) {
            console.error('Error handling forced reprocessing:', error);
            throw error;
        }
    }
    /**
     * Get file checksum history
     */
    async getChecksumHistory(checksum, organizationId) {
        const { data, error } = await this.supabaseClient
            .from('etl_file')
            .select(`
        id,
        filename,
        uploaded_at,
        uploaded_by,
        current_state,
        metadata
      `)
            .eq('checksum', checksum)
            .eq('organization_id', organizationId)
            .order('uploaded_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get checksum history: ${error.message}`);
        }
        return data.map((file) => ({
            id: file.id,
            filename: file.filename,
            uploadedAt: new Date(file.uploaded_at),
            uploadedBy: file.uploaded_by,
            currentState: file.current_state,
            processedRecords: file.metadata?.processedRecords,
        }));
    }
    /**
     * Update file checksum (for file modifications)
     */
    async updateFileChecksum(fileId, newChecksum, userId, reason = 'File content updated') {
        try {
            // Get current file info
            const { data: currentFile, error: fetchError } = await this.supabaseClient
                .from('etl_file')
                .select('checksum, organization_id, version')
                .eq('id', fileId)
                .single();
            if (fetchError) {
                throw new Error(`Failed to fetch current file: ${fetchError.message}`);
            }
            const oldChecksum = currentFile.checksum;
            // Update checksum with optimistic locking
            const { error: updateError } = await this.supabaseClient
                .from('etl_file')
                .update({
                checksum: newChecksum,
                version: currentFile.version + 1,
                updated_at: new Date(),
            })
                .eq('id', fileId)
                .eq('version', currentFile.version);
            if (updateError) {
                if (updateError.code === 'PGRST116') {
                    throw new Error('Concurrent modification detected. Please retry.');
                }
                throw updateError;
            }
            // Log the checksum change
            await this.logReprocessingEvent({
                level: 'info',
                message: 'File checksum updated',
                details: {
                    fileId,
                    oldChecksum,
                    newChecksum,
                    reason,
                    updatedBy: userId,
                },
                organizationId: currentFile.organization_id,
                userId,
            });
        }
        catch (error) {
            console.error('Error updating file checksum:', error);
            throw error;
        }
    }
    /**
     * Log reprocessing event
     */
    async logReprocessingEvent(event) {
        try {
            const logEntry = {
                id: `log-checksum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                level: event.level,
                message: event.message,
                details: event.details,
                organization_id: event.organizationId,
                user_id: event.userId,
                action: 'checksum_processing',
                created_at: new Date(),
            };
            await this.supabaseClient
                .from('etl_run_log')
                .insert(logEntry);
        }
        catch (error) {
            console.error('Failed to log reprocessing event:', error);
            // Don't throw - logging errors shouldn't break the main flow
        }
    }
    /**
     * Clean up old reprocessing records
     */
    async cleanupOldReprocessingRecords(organizationId, daysToKeep = 90) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const { data, error } = await this.supabaseClient
            .from('etl_reprocessing_log')
            .delete()
            .eq('organization_id', organizationId)
            .lt('created_at', cutoffDate.toISOString())
            .select('id');
        if (error) {
            throw new Error(`Failed to cleanup reprocessing records: ${error.message}`);
        }
        const deletedCount = data?.length || 0;
        if (deletedCount > 0) {
            await this.logReprocessingEvent({
                level: 'info',
                message: `Cleaned up ${deletedCount} old reprocessing records`,
                details: { cutoffDate, deletedCount },
                organizationId,
            });
        }
        return deletedCount;
    }
}
