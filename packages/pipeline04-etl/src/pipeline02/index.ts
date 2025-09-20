/**
 * Pipeline 02 - Desvio de Carregamento Module
 * Exports all Pipeline 02 related functionality for livestock feeding deviation processing
 */

export * from './data-validation-service.js';
export * from './dimension-lookup-service.js';
export * from './upsert-service.js';
export * from './pipeline02-state-integration.js';
export * from './pipeline02-orchestrator.js';
export * from './logging-service.js';
export * from './error-recovery-service.js';

// Re-export commonly used types and classes
export {
  DataValidationService,
  DEFAULT_VALIDATION_CONFIG,
} from './data-validation-service.js';

export {
  DimensionLookupService,
} from './dimension-lookup-service.js';

export {
  UpsertService,
} from './upsert-service.js';

export {
  Pipeline02StateIntegration,
} from './pipeline02-state-integration.js';

export {
  Pipeline02Orchestrator,
} from './pipeline02-orchestrator.js';

export {
  Pipeline02LoggingService,
  LogLevel,
  LogCategory,
} from './logging-service.js';

export {
  Pipeline02ErrorRecoveryService,
  ErrorType,
  ErrorSeverity,
} from './error-recovery-service.js';

// Export types
export type {
  ValidationConfig,
  ValidationContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  RawDesvioData,
  DesvioCarregamentoData,
} from './data-validation-service.js';

export type {
  DimensionLookupContext,
  CurralDimension,
  DietaDimension,
  EquipamentoDimension,
  DimensionLookupResult,
} from './dimension-lookup-service.js';

export type {
  UpsertContext,
  DimensionIds,
  UpsertResult,
  BatchUpsertResult,
  FactRecord,
} from './upsert-service.js';

export type {
  Pipeline02Context,
  Pipeline02ProcessingResult,
  Pipeline02ProcessingOptions,
} from './pipeline02-state-integration.js';

export type {
  Pipeline02OrchestratorContext,
  Pipeline02FileProcessingRequest,
  Pipeline02OrchestratorResult,
} from './pipeline02-orchestrator.js';

export type {
  LogEntry,
  LogQuery,
  LogSummary,
} from './logging-service.js';

export type {
  ErrorDetails,
  RetryPolicy,
  RecoveryStrategy,
  ErrorRecoveryContext,
} from './error-recovery-service.js';