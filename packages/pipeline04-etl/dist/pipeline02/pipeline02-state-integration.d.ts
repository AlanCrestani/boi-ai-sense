/**
 * Pipeline 02 State Machine Integration
 * Integrates Pipeline 02 (Desvio de Carregamento) with ETL State Machine
 */
import { ETLState } from '../state-machine/types.js';
import { BatchUpsertResult } from './upsert-service.js';
export interface Pipeline02Context {
    organizationId: string;
    fileId: string;
    runId?: string;
    userId?: string;
    supabaseClient: any;
}
export interface Pipeline02ProcessingResult {
    success: boolean;
    state: ETLState;
    processedRecords: number;
    failedRecords: number;
    warnings: string[];
    errors: string[];
    dimensionStats?: {
        pendingDimensions: number;
        resolvedDimensions: number;
    };
    batchResult?: BatchUpsertResult;
}
export interface Pipeline02ProcessingOptions {
    skipValidation?: boolean;
    autoApproveDimensions?: boolean;
    maxRecordsPerBatch?: number;
    retryFailedRecords?: boolean;
}
export declare class Pipeline02StateIntegration {
    private stateMachineService;
    private dataValidationService;
    private dimensionLookupService;
    private upsertService;
    constructor(context: Pipeline02Context);
    /**
     * Process CSV file through complete Pipeline 02 workflow with state management
     */
    processFile(rawData: any[], context: Pipeline02Context, options?: Pipeline02ProcessingOptions): Promise<Pipeline02ProcessingResult>;
    /**
     * Validate data using Pipeline 02 validation service
     */
    private validateData;
    /**
     * Load data using Pipeline 02 dimension lookup and UPSERT services
     */
    private loadData;
    /**
     * Helper method to transition states with logging
     */
    private transitionState;
    /**
     * Get current ETL file state
     */
    getCurrentState(fileId: string): Promise<ETLState | null>;
    /**
     * Get processing statistics for a file
     */
    getProcessingStats(fileId: string): Promise<{
        totalRecords: number;
        processedRecords: number;
        failedRecords: number;
        pendingDimensions: number;
        state: ETLState;
        stateHistory: any[];
    } | null>;
    /**
     * Retry failed processing from a specific state
     */
    retryProcessing(fileId: string, fromState: ETLState, rawData: any[], options?: Pipeline02ProcessingOptions): Promise<Pipeline02ProcessingResult>;
}
