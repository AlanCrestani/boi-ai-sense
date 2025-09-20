/**
 * Pipeline 02 ETL - Main Entry Point
 * Exports all public APIs for the Pipeline 02 ETL system
 */
// Main ETL Processor
export { Pipeline02ETLProcessor, } from './etl-processor.js';
// Business Rules and Validation
export { Pipeline02BusinessValidator, pipeline02RawDataSchema, pipeline02ProcessedSchema, VALID_EQUIPAMENTOS, } from './validators/business-rules.js';
// Data Cleansing
export { Pipeline02DataCleanser, } from './validators/data-cleanser.js';
// UPSERT Services
export { FactTableUpsertService, } from './services/upsert-strategy.js';
// Dimension Lookup Services
export { MockDimensionLookupService, } from './services/dimension-lookup.js';
// Configuration
export { DEFAULT_PIPELINE02_CONFIG, ENVIRONMENT_CONFIGS, PIPELINE02_PRESETS, createPipeline02Config, validatePipeline02Config, } from './config/pipeline-config.js';
/**
 * Quick start function for simple usage
 */
export async function processDesvioCarregamentoCSV(csvContent, organizationId, fileId, connectionString, options = {}) {
    const { Pipeline02ETLProcessor } = await import('./etl-processor.js');
    const { createPipeline02Config } = await import('./config/pipeline-config.js');
    // Create configuration
    const config = createPipeline02Config(options.environment, {
        database: { connectionString },
        processing: {
            batchSize: options.batchSize || 1000,
            maxRetries: 3,
            skipValidation: options.skipValidation || false,
            enableLogging: true,
        },
    });
    // Create and configure processor
    const processor = new Pipeline02ETLProcessor({
        connectionString,
        organizationId,
        fileId,
        runId: options.runId,
        batchSize: config.processing.batchSize,
        skipValidation: config.processing.skipValidation,
    });
    try {
        // Process the CSV
        return await processor.processCSVFile(csvContent);
    }
    finally {
        // Always close the connection
        await processor.close();
    }
}
//# sourceMappingURL=index.js.map