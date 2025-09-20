/**
 * Main Pipeline 04 ETL Processor
 * Integrates all services for complete feeding treatment data processing
 */
import { MappedRow } from '../validators/data-cleanser.js';
import { UpsertResult } from './upsert-strategy.js';
import { DimensionLookupService } from './dimension-lookup.js';
export interface Pipeline04ProcessingResult {
    success: boolean;
    recordsProcessed: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsSkipped: number;
    pendingEntries: number;
    errors: ProcessingError[];
    warnings: ProcessingWarning[];
    processingTimeMs: number;
}
export interface ProcessingError {
    rowNumber?: number;
    stage: 'validation' | 'cleaning' | 'referential' | 'upsert';
    field?: string;
    code: string;
    message: string;
    originalValue?: any;
}
export interface ProcessingWarning {
    rowNumber?: number;
    stage: 'validation' | 'cleaning' | 'referential' | 'upsert';
    field?: string;
    message: string;
    recommendation?: string;
}
/**
 * Complete Pipeline 04 ETL processor
 */
export declare class Pipeline04Processor {
    private businessValidator;
    private dataCleanser;
    private referentialService;
    private upsertService;
    constructor(dimensionService: DimensionLookupService);
    /**
     * Process a single feeding treatment record through the complete ETL pipeline
     */
    processSingleRecord(rawRow: MappedRow, organizationId: string, fileId: string, transaction: any, fatoTable: any): Promise<{
        success: boolean;
        result?: UpsertResult;
        errors: ProcessingError[];
        warnings: ProcessingWarning[];
    }>;
    /**
     * Process multiple feeding treatment records through the complete ETL pipeline
     */
    processBatch(rawRows: MappedRow[], organizationId: string, fileId: string, transaction: any, fatoTable: any): Promise<Pipeline04ProcessingResult>;
    /**
     * Get processing statistics and health check
     */
    getProcessingHealthCheck(organizationId: string): Promise<{
        status: 'healthy' | 'warning' | 'error';
        pendingEntriesCount: number;
        oldestPendingEntry?: Date;
        recommendations: string[];
    }>;
    /**
     * Generate comprehensive processing report
     */
    generateProcessingReport(result: Pipeline04ProcessingResult): string;
}
