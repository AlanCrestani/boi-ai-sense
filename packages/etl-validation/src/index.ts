// ETL Validation Package - Main exports

// Separator Detection
export {
  detectSeparator,
  separatorToName,
  type CsvSeparator,
  type SeparatorDetectionResult,
  type SeparatorDetectionOptions,
} from './separator-detection.js';

// Streaming Parser
export {
  StreamingCsvParser,
  parseCSV,
  parseCSVStream,
  type StreamingParseOptions,
  type ParsedRow,
  type ParsingResult,
  type ParsingError,
  type RowCallback,
  type BatchCallback,
  type ErrorCallback,
} from './streaming-parser.js';

// Header Mapping
export {
  HeaderMapper,
  type HeaderMapping,
  type HeaderMappingConfig,
  type MappedRow,
  type FieldError,
  type MappingAnalysis,
} from './header-mapping.js';

// Batch Processing
export {
  BatchProcessor,
  type BatchProcessorConfig,
  type StagingInsertResult,
  type StagingError,
  type PipelineContext,
} from './batch-processor.js';

// Pipeline Configurations
export { pipeline02Config, pipeline04Config } from './pipeline-configs.js';