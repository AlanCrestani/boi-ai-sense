// Enums que correspondem aos tipos customizados do banco real
export type AppRole = 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type EtlState = 'uploaded' | 'parsed' | 'validated' | 'approved' | 'loaded' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ETL status types (mantidos para compatibilidade)
export type EtlRunStatus = 'running' | 'success' | 'failed' | 'cancelled';
export type EtlFileStatus = 'uploaded' | 'parsed' | 'validated' | 'approved' | 'loaded' | 'failed' | 'skipped';
export type EtlLogLevel = 'INFO' | 'NECESSITA_ACAO' | 'WARN' | 'ERROR';

// Status do staging
export type StagingStatus = 'VERDE' | 'AMARELO' | 'VERMELHO';
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Pipeline types
export type PipelineType = '01' | '02' | '03' | '04' | '05';

// Processing step types
export type ProcessingStep = 'discovery' | 'parse' | 'validate' | 'map' | 'load';

// ETL file metadata
export interface EtlFileMetadata {
  pipeline: PipelineType;
  uploadDate: string;
  originalFilename: string;
  rowCount?: number;
  validRows?: number;
  errorRows?: number;
}

// Natural key generators
export interface NaturalKeyConfig {
  fields: string[];
  separator?: string;
  hashLength?: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  rowIndex?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  rowIndex?: number;
}

// CSV parsing configuration
export interface CsvParseConfig {
  delimiter?: string;
  quote?: string;
  escape?: string;
  encoding?: 'utf8' | 'latin1' | 'ascii';
  skipEmptyLines?: boolean;
  trimHeaders?: boolean;
  maxRows?: number;
}

// Header mapping configuration
export interface HeaderMapping {
  [standardField: string]: string[];
}

// Processing context
export interface ProcessingContext {
  runId: string;
  fileId: string;
  organizationId: string;
  pipeline: PipelineType;
  userId?: string;
}

// Dimensional mapping
export interface DimensionalMapping {
  curralCodigo?: string;
  curralId?: string;
  dietaNome?: string;
  dietaId?: string;
  equipamentoCodigo?: string;
  equipamentoId?: string;
}

export interface MappingPendency {
  type: 'curral' | 'dieta' | 'equipamento';
  code: string;
  suggested?: {
    name?: string;
    category?: string;
  };
}