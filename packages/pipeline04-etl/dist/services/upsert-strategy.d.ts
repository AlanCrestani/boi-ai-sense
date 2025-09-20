/**
 * Advanced UPSERT Strategies for Pipeline 04 ETL
 * Implements efficient idempotent operations for fato_trato_curral
 */
import { Pipeline04ProcessedData } from '../validators/business-rules.js';
import { DimensionLookupService } from './dimension-lookup.js';
export interface UpsertResult {
    action: 'inserted' | 'updated' | 'skipped' | 'pending';
    recordId?: string;
    reason?: string;
    pendingEntries?: string[];
}
export interface UpsertBatchResult {
    totalProcessed: number;
    inserted: number;
    updated: number;
    skipped: number;
    pending: number;
    errors: UpsertError[];
}
export interface UpsertError {
    naturalKey: string;
    message: string;
    data?: any;
}
/**
 * Enhanced UPSERT service for fato_trato_curral with pending entry handling
 */
export declare class FactTratoUpsertService {
    private dimensionService;
    constructor(dimensionService: DimensionLookupService);
    /**
     * Single record UPSERT with dimension lookups and pending entry creation
     */
    upsertSingleRecord(tx: any, data: Pipeline04ProcessedData, organizationId: string, fileId: string, fatoTable: any): Promise<UpsertResult>;
    /**
     * Batch UPSERT for better performance
     */
    upsertBatch(tx: any, dataArray: Pipeline04ProcessedData[], organizationId: string, fileId: string, fatoTable: any): Promise<UpsertBatchResult>;
    /**
     * PostgreSQL native UPSERT using ON CONFLICT (when no pending entries)
     */
    nativeUpsert(tx: any, data: Pipeline04ProcessedData, organizationId: string, fileId: string, curralId: string, dietaId: string | null, trateiroId: string, _fatoTable: any): Promise<UpsertResult>;
    /**
     * Find existing record by natural key
     */
    private findExistingRecord;
    /**
     * Check if existing record needs update
     */
    private recordNeedsUpdate;
    /**
     * Update existing record
     */
    private updateExistingRecord;
    /**
     * Insert new record
     */
    private insertNewRecord;
    /**
     * Process batch of records
     */
    private processBatch;
}
