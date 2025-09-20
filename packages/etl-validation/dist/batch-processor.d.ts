/**
 * Batch processing and staging storage for ETL pipeline
 * Handles transactional batch inserts and staging table management
 */
import { MappedRow } from './header-mapping.js';
export interface BatchProcessorConfig {
    /** Database connection string */
    connectionString: string;
    /** Batch size for database operations */
    batchSize?: number;
    /** Maximum retry attempts for failed batches */
    maxRetries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
    /** Enable transaction rollback on batch failure */
    useTransactions?: boolean;
}
export interface StagingInsertResult {
    /** Number of rows successfully inserted */
    insertedCount: number;
    /** Number of rows that failed */
    failedCount: number;
    /** Specific row errors */
    errors: StagingError[];
    /** Processing duration in milliseconds */
    duration: number;
}
export interface StagingError {
    /** Row number that failed */
    rowNumber: number;
    /** Error message */
    message: string;
    /** Raw row data */
    data?: any;
}
export interface PipelineContext {
    /** Organization ID */
    organizationId: string;
    /** Source file ID */
    fileId: string;
    /** Pipeline type */
    pipelineType: '02' | '04';
    /** Natural key prefix */
    naturalKeyPrefix?: string;
}
/**
 * Batch Processor for staging data
 */
export declare class BatchProcessor {
    private config;
    private client;
    constructor(config: BatchProcessorConfig);
    /**
     * Process batch of mapped rows for Pipeline 02 (Desvio Carregamento)
     */
    processPipeline02Batch(rows: MappedRow[], context: PipelineContext): Promise<StagingInsertResult>;
    /**
     * Process batch of mapped rows for Pipeline 04 (Trato Curral)
     */
    processPipeline04Batch(rows: MappedRow[], context: PipelineContext): Promise<StagingInsertResult>;
    /**
     * Generate natural key for Pipeline 02
     */
    private generateNaturalKey02;
    /**
     * Generate natural key for Pipeline 04
     */
    private generateNaturalKey04;
    /**
     * Parse date from various formats
     */
    private parseDate;
    /**
     * Parse numeric value
     */
    private parseNumeric;
    /**
     * Close database connection
     */
    close(): Promise<void>;
}
