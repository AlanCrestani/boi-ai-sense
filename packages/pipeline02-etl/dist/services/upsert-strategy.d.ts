/**
 * Advanced UPSERT Strategies for Pipeline 02 ETL
 * Implements efficient idempotent operations for fact table
 */
import { Pipeline02ProcessedData } from '../validators/business-rules.js';
import { DimensionLookupService } from './dimension-lookup.js';
export interface UpsertResult {
    action: 'inserted' | 'updated' | 'skipped';
    recordId?: string;
    reason?: string;
}
export interface UpsertBatchResult {
    totalProcessed: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: UpsertError[];
}
export interface UpsertError {
    naturalKey: string;
    message: string;
    data?: any;
}
/**
 * Enhanced UPSERT service with multiple strategies
 */
export declare class FactTableUpsertService {
    private dimensionService;
    constructor(dimensionService: DimensionLookupService);
    /**
     * Single record UPSERT with dimension lookups
     */
    upsertSingleRecord(tx: any, data: Pipeline02ProcessedData, organizationId: string, fileId: string, fatoTable: any): Promise<UpsertResult>;
    /**
     * Batch UPSERT for better performance
     */
    upsertBatch(tx: any, dataArray: Pipeline02ProcessedData[], organizationId: string, fileId: string, fatoTable: any): Promise<UpsertBatchResult>;
    /**
     * PostgreSQL native UPSERT using ON CONFLICT
     */
    nativeUpsert(tx: any, data: Pipeline02ProcessedData, organizationId: string, fileId: string, _fatoTable: any): Promise<UpsertResult>;
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
//# sourceMappingURL=upsert-strategy.d.ts.map