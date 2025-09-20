/**
 * Pipeline 02 Orchestrator - End-to-End ETL Automation
 * Orchestrates the complete Pipeline 02 workflow from file upload to fact table loading
 */
import { ETLState } from '../state-machine/types.js';
import { Pipeline02ProcessingOptions, Pipeline02ProcessingResult } from './pipeline02-state-integration.js';
export interface Pipeline02OrchestratorContext {
    organizationId: string;
    userId?: string;
    supabaseClient: any;
}
export interface Pipeline02FileProcessingRequest {
    fileId: string;
    filePath: string;
    fileName: string;
    processingOptions?: Pipeline02ProcessingOptions;
}
export interface Pipeline02OrchestratorResult {
    success: boolean;
    fileId: string;
    finalState: ETLState;
    processingResult?: Pipeline02ProcessingResult;
    errors: string[];
    warnings: string[];
    duration: number;
    summary: {
        totalRecords: number;
        processedRecords: number;
        failedRecords: number;
        pendingDimensions: number;
    };
}
export declare class Pipeline02Orchestrator {
    private stateMachineService;
    private csvParserService;
    private context;
    constructor(context: Pipeline02OrchestratorContext);
    /**
     * Process a file through the complete Pipeline 02 workflow
     */
    processFile(request: Pipeline02FileProcessingRequest): Promise<Pipeline02OrchestratorResult>;
    /**
     * Parse CSV file using the CSV parser service
     */
    private parseCSVFile;
    /**
     * Read file content from storage
     */
    private readFile;
    /**
     * Log a processing step to ETL run log
     */
    private logStep;
    /**
     * Get processing status for a file
     */
    getFileStatus(fileId: string): Promise<{
        fileId: string;
        state: ETLState;
        lastUpdated: Date;
        processingStats?: any;
        logs: any[];
    } | null>;
    /**
     * Retry processing a failed file
     */
    retryFileProcessing(fileId: string, filePath: string, fileName: string, options?: Pipeline02ProcessingOptions): Promise<Pipeline02OrchestratorResult>;
    /**
     * Get orchestrator health status
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        timestamp: Date;
    };
}
