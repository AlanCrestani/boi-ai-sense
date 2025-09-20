/**
 * Pipeline 02 ETL - Main Entry Point
 * Exports all public APIs for the Pipeline 02 ETL system
 */

// Main ETL Processor
export {
  Pipeline02ETLProcessor,
  type ETLConfig,
  type ETLResult,
  type ProcessingError,
  type ProcessingWarning,
} from './etl-processor.js';

// Business Rules and Validation
export {
  Pipeline02BusinessValidator,
  type Pipeline02RawData,
  type Pipeline02ProcessedData,
  type ValidationResult,
  type ValidationError,
  pipeline02RawDataSchema,
  pipeline02ProcessedSchema,
  VALID_EQUIPAMENTOS,
} from './validators/business-rules.js';

// Data Cleansing
export {
  Pipeline02DataCleanser,
  type CleansingResult,
  type CleansingWarning,
} from './validators/data-cleanser.js';

// UPSERT Services
export {
  FactTableUpsertService,
  type UpsertResult,
  type UpsertBatchResult,
  type UpsertError,
} from './services/upsert-strategy.js';

// Dimension Lookup Services
export {
  type DimensionLookupService,
  MockDimensionLookupService,
} from './services/dimension-lookup.js';

// Configuration
export {
  type Pipeline02Config,
  DEFAULT_PIPELINE02_CONFIG,
  ENVIRONMENT_CONFIGS,
  PIPELINE02_PRESETS,
  createPipeline02Config,
  validatePipeline02Config,
} from './config/pipeline-config.js';

/**
 * Quick start function for simple usage
 */
export async function processDesvioCarregamentoCSV(
  csvContent: string,
  organizationId: string,
  fileId: string,
  connectionString: string,
  options: {
    runId?: string;
    batchSize?: number;
    skipValidation?: boolean;
    environment?: string;
  } = {}
): Promise<import('./etl-processor.js').ETLResult> {
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
  } finally {
    // Always close the connection
    await processor.close();
  }
}