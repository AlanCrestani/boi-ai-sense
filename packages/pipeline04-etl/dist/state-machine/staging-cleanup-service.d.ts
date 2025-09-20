/**
 * Staging Table Cleanup and Audit Trail Service
 * Manages staging table cleanup before reprocessing and maintains detailed audit trails
 */
export interface StagingCleanupOptions {
    fileId?: string;
    runId?: string;
    organizationId: string;
    beforeState?: string;
    retainDays?: number;
    dryRun?: boolean;
}
export interface CleanupResult {
    tablesProcessed: string[];
    recordsDeleted: number;
    errors: string[];
    cleanupDuration: number;
    retainedRecords?: number;
    dryRunResults?: {
        wouldDelete: number;
        tables: Record<string, number>;
    };
}
export interface AuditEvent {
    id?: string;
    timestamp?: Date;
    level: 'info' | 'warning' | 'error' | 'debug';
    action: string;
    message: string;
    details?: Record<string, any>;
    organizationId: string;
    userId?: string;
    fileId?: string;
    runId?: string;
    duration?: number;
    success?: boolean;
}
/**
 * Service for managing staging table cleanup and audit trail
 */
export declare class StagingCleanupService {
    private supabaseClient;
    constructor(supabaseClient: any);
    /**
     * Clean staging tables before reprocessing
     */
    cleanupStagingTables(options: StagingCleanupOptions): Promise<CleanupResult>;
    /**
     * Get list of staging tables to clean
     */
    private getStagingTables;
    /**
     * Clean a specific staging table
     */
    private cleanupStagingTable;
    /**
     * Clean up old audit trail records
     */
    cleanupOldAuditRecords(organizationId: string, retainDays?: number, dryRun?: boolean): Promise<CleanupResult>;
    /**
     * Verify staging table cleanup was successful
     */
    verifyStagingCleanup(options: StagingCleanupOptions): Promise<{
        isClean: boolean;
        remainingRecords: Record<string, number>;
        details: string[];
    }>;
    /**
     * Log audit event
     */
    logAuditEvent(event: AuditEvent): Promise<string>;
    /**
     * Get audit trail for a specific file or run
     */
    getAuditTrail(options: {
        organizationId: string;
        fileId?: string;
        runId?: string;
        action?: string;
        level?: string;
        limit?: number;
        offset?: number;
    }): Promise<AuditEvent[]>;
    /**
     * Get audit trail statistics
     */
    getAuditStats(organizationId: string, timeRangeHours?: number): Promise<{
        totalEvents: number;
        eventsByLevel: Record<string, number>;
        eventsByAction: Record<string, number>;
        successRate: number;
        avgDuration: number;
        recentErrors: AuditEvent[];
    }>;
}
