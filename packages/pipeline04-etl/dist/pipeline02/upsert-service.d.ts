/**
 * UPSERT Service for Pipeline 02 - Desvio de Carregamento
 * Implements idempotent UPSERT logic for fato_desvio_carregamento table
 */
import { DesvioCarregamentoData } from './data-validation-service.js';
export interface UpsertContext {
    organizationId: string;
    fileId: string;
    runId?: string;
    supabaseClient: any;
}
export interface DimensionIds {
    curralId: string;
    dietaId: string | null;
    equipamentoId: string | null;
}
export interface UpsertResult {
    operation: 'insert' | 'update' | 'skip';
    recordId: string;
    isSuccess: boolean;
    error?: string;
    warnings: string[];
    dimensionLookups: {
        curralResolved: boolean;
        dietaResolved: boolean;
        equipamentoResolved: boolean;
    };
}
export interface BatchUpsertResult {
    results: UpsertResult[];
    summary: {
        total: number;
        inserted: number;
        updated: number;
        skipped: number;
        failed: number;
        pendingDimensions: number;
    };
    errors: string[];
}
export interface FactRecord {
    distrib_id: string;
    organization_id: string;
    data_ref: Date;
    turno: string | null;
    curral_id: string;
    dieta_id: string | null;
    equipamento_id: string | null;
    kg_planejado: number;
    kg_real: number;
    desvio_kg: number;
    desvio_pct: number;
    source_file_id: string;
    natural_key: string;
    created_at: Date;
}
export declare class UpsertService {
    private context;
    constructor(context: UpsertContext);
    /**
     * Perform idempotent UPSERT operation on fato_desvio_carregamento
     */
    upsertDesvioRecord(validatedData: DesvioCarregamentoData, dimensionIds: DimensionIds): Promise<UpsertResult>;
    /**
     * Find existing record by natural_key and organization_id
     */
    private findExistingRecord;
    /**
     * Insert new record into fato_desvio_carregamento
     */
    private insertRecord;
    /**
     * Update existing record if values have changed
     */
    private updateRecord;
    /**
     * Batch UPSERT operation for multiple records
     */
    batchUpsert(validatedDataList: Array<{
        data: DesvioCarregamentoData;
        dimensions: DimensionIds;
    }>): Promise<BatchUpsertResult>;
    /**
     * Get records by natural keys for verification
     */
    getRecordsByNaturalKeys(naturalKeys: string[]): Promise<FactRecord[]>;
    /**
     * Count records for an organization
     */
    getRecordCount(organizationId?: string): Promise<number>;
    /**
     * Get records by file ID for audit purposes
     */
    getRecordsByFileId(fileId: string): Promise<FactRecord[]>;
    /**
     * Delete records by file ID (for reprocessing scenarios)
     */
    deleteRecordsByFileId(fileId: string): Promise<number>;
    /**
     * Verify data integrity for a batch of records
     */
    verifyBatchIntegrity(naturalKeys: string[]): Promise<{
        totalExpected: number;
        totalFound: number;
        missingKeys: string[];
        isComplete: boolean;
    }>;
    /**
     * Get processing statistics for monitoring
     */
    getProcessingStats(fileId?: string): Promise<{
        totalRecords: number;
        recordsByDate: Record<string, number>;
        recordsByEquipamento: Record<string, number>;
        avgDeviationKg: number;
        avgDeviationPct: number;
        recordsWithPendingDimensions: number;
    }>;
}
