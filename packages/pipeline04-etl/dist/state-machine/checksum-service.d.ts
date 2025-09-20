/**
 * Checksum Service for ETL File Processing
 * Handles file checksum calculation and duplicate detection
 */
export interface FileChecksum {
    filename: string;
    filepath: string;
    checksum: string;
    algorithm: 'sha256' | 'md5';
    fileSize: number;
    calculatedAt: Date;
}
export interface DuplicateDetectionResult {
    isDuplicate: boolean;
    originalFile?: {
        id: string;
        filename: string;
        uploadedAt: Date;
        uploadedBy: string;
        currentState: string;
    };
    allowReprocessing: boolean;
    reason?: string;
}
export interface ReprocessingOptions {
    forcedReprocessing: boolean;
    userId: string;
    reason?: string;
    skipValidation?: boolean;
}
/**
 * Service for handling file checksums and duplicate detection
 */
export declare class ChecksumService {
    private supabaseClient;
    private defaultAlgorithm;
    constructor(supabaseClient: any, algorithm?: 'sha256' | 'md5');
    /**
     * Calculate checksum for a file
     */
    calculateFileChecksum(filepath: string, algorithm?: 'sha256' | 'md5'): Promise<string>;
    /**
     * Calculate checksum from buffer data
     */
    calculateBufferChecksum(buffer: Buffer, algorithm?: 'sha256' | 'md5'): string;
    /**
     * Check if file is duplicate based on checksum
     */
    checkForDuplicate(checksum: string, organizationId: string, currentFileId?: string): Promise<DuplicateDetectionResult>;
    /**
     * Determine if reprocessing should be allowed based on original file state
     */
    private shouldAllowReprocessing;
    /**
     * Handle forced reprocessing
     */
    handleForcedReprocessing(checksum: string, organizationId: string, options: ReprocessingOptions): Promise<{
        allowed: boolean;
        originalFileId?: string;
        reprocessingRecordId?: string;
        reason: string;
    }>;
    /**
     * Get file checksum history
     */
    getChecksumHistory(checksum: string, organizationId: string): Promise<Array<{
        id: string;
        filename: string;
        uploadedAt: Date;
        uploadedBy: string;
        currentState: string;
        processedRecords?: number;
    }>>;
    /**
     * Update file checksum (for file modifications)
     */
    updateFileChecksum(fileId: string, newChecksum: string, userId: string, reason?: string): Promise<void>;
    /**
     * Log reprocessing event
     */
    private logReprocessingEvent;
    /**
     * Clean up old reprocessing records
     */
    cleanupOldReprocessingRecords(organizationId: string, daysToKeep?: number): Promise<number>;
}
