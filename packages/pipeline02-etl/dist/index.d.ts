/**
 * Pipeline 02 ETL - Main Entry Point
 * Exports all public APIs for the Pipeline 02 ETL system
 */
export { Pipeline02ETLProcessor, type ETLConfig, type ETLResult, type ProcessingError, type ProcessingWarning, } from './etl-processor.js';
export { Pipeline02BusinessValidator, type Pipeline02RawData, type Pipeline02ProcessedData, type ValidationResult, type ValidationError, pipeline02RawDataSchema, pipeline02ProcessedSchema, VALID_EQUIPAMENTOS, } from './validators/business-rules.js';
export { Pipeline02DataCleanser, type CleansingResult, type CleansingWarning, } from './validators/data-cleanser.js';
export { FactTableUpsertService, type UpsertResult, type UpsertBatchResult, type UpsertError, } from './services/upsert-strategy.js';
export { type DimensionLookupService, MockDimensionLookupService, } from './services/dimension-lookup.js';
export { type Pipeline02Config, DEFAULT_PIPELINE02_CONFIG, ENVIRONMENT_CONFIGS, PIPELINE02_PRESETS, createPipeline02Config, validatePipeline02Config, } from './config/pipeline-config.js';
/**
 * Quick start function for simple usage
 */
export declare function processDesvioCarregamentoCSV(csvContent: string, organizationId: string, fileId: string, connectionString: string, options?: {
    runId?: string;
    batchSize?: number;
    skipValidation?: boolean;
    environment?: string;
}): Promise<import('./etl-processor.js').ETLResult>;
//# sourceMappingURL=index.d.ts.map