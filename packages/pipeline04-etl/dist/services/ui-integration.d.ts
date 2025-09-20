/**
 * UI Integration Service for Pipeline 04
 * Connects React components to ETL services and Supabase backend
 */
import { PendingEntry } from './dimension-lookup.js';
export interface UIPendingEntry extends PendingEntry {
    canResolve: boolean;
    canReject: boolean;
    priority: 'low' | 'medium' | 'high';
    affectedRecords: number;
}
export interface UIProcessingStats {
    totalRecordsProcessed: number;
    recordsToday: number;
    recordsThisWeek: number;
    pendingEntriesCount: number;
    pendingCurrals: number;
    pendingDietas: number;
    processingHealthStatus: 'healthy' | 'warning' | 'error';
    avgProcessingTimeMs: number;
    lastProcessedAt?: Date;
    errorRate: number;
    recommendations: string[];
}
export interface ProcessingLogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    details?: string;
    organizationId: string;
    fileId?: string;
    recordCount?: number;
}
/**
 * Service for integrating Pipeline 04 ETL with UI components
 */
export declare class Pipeline04UIService {
    private supabaseClient;
    private organizationId;
    constructor(supabaseClient: any, // Supabase client
    organizationId: string);
    /**
     * Get enhanced pending entries for UI display
     */
    getUIPendingEntries(): Promise<UIPendingEntry[]>;
    /**
     * Resolve a pending entry with UI feedback
     */
    resolvePendingEntry(pendingId: string, resolvedValue: string, resolvedBy: string, notes?: string): Promise<void>;
    /**
     * Reject a pending entry
     */
    rejectPendingEntry(pendingId: string, reason: string, rejectedBy: string): Promise<void>;
    /**
     * Get processing statistics for dashboard
     */
    getProcessingStats(): Promise<UIProcessingStats>;
    /**
     * Get processing logs for UI display
     */
    getProcessingLogs(limit?: number): Promise<ProcessingLogEntry[]>;
    /**
     * Log a processing event
     */
    logProcessingEvent(event: {
        level: 'info' | 'warning' | 'error' | 'success';
        message: string;
        details?: string;
        organizationId: string;
        fileId?: string;
        recordCount?: number;
    }): Promise<void>;
    /**
     * Export processing data to CSV
     */
    exportProcessingData(dateRange: {
        start: Date;
        end: Date;
    }): Promise<string>;
}
