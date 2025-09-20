/**
 * ETL Processor for Pipeline 02 - Desvio de Carregamento
 * Orchestrates the complete ETL pipeline with error handling
 */
export interface ETLConfig {
    connectionString: string;
    organizationId: string;
    fileId: string;
    runId?: string;
    batchSize?: number;
    skipValidation?: boolean;
}
export interface ETLResult {
    success: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    stagingInserts: number;
    factTableUpserts: number;
    errors: ProcessingError[];
    warnings: ProcessingWarning[];
    duration: number;
}
export interface ProcessingError {
    rowNumber: number;
    stage: 'parsing' | 'cleansing' | 'validation' | 'staging' | 'fact_table';
    message: string;
    data?: any;
}
export interface ProcessingWarning {
    rowNumber: number;
    stage: 'cleansing' | 'validation';
    message: string;
    field?: string;
    originalValue?: any;
    cleanedValue?: any;
}
/**
 * Main ETL Processor for Pipeline 02
 */
export declare class Pipeline02ETLProcessor {
    private db;
    private client;
    private headerMapper;
    private cleanser;
    private validator;
    private upsertService;
    private config;
    constructor(config: ETLConfig);
    /**
     * Process CSV file through complete ETL pipeline
     */
    processCSVFile(csvContent: string): Promise<ETLResult>;
    /**
     * Process a batch of rows
     */
    private processBatch;
    /**
     * Log information message
     */
    private logInfo;
    /**
     * Log warning message
     */
    private logWarning;
    /**
     * Log error message
     */
    private logError;
    /**
     * Close database connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=etl-processor.d.ts.map