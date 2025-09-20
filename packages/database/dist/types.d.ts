export type AppRole = 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type EtlState = 'uploaded' | 'parsed' | 'validated' | 'approved' | 'loaded' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type EtlRunStatus = 'running' | 'success' | 'failed' | 'cancelled';
export type EtlFileStatus = 'uploaded' | 'parsed' | 'validated' | 'approved' | 'loaded' | 'failed' | 'skipped';
export type EtlLogLevel = 'INFO' | 'NECESSITA_ACAO' | 'WARN' | 'ERROR';
export type StagingStatus = 'VERDE' | 'AMARELO' | 'VERMELHO';
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type PipelineType = '01' | '02' | '03' | '04' | '05';
export type ProcessingStep = 'discovery' | 'parse' | 'validate' | 'map' | 'load';
export interface EtlFileMetadata {
    pipeline: PipelineType;
    uploadDate: string;
    originalFilename: string;
    rowCount?: number;
    validRows?: number;
    errorRows?: number;
}
export interface NaturalKeyConfig {
    fields: string[];
    separator?: string;
    hashLength?: number;
}
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
export interface CsvParseConfig {
    delimiter?: string;
    quote?: string;
    escape?: string;
    encoding?: 'utf8' | 'latin1' | 'ascii';
    skipEmptyLines?: boolean;
    trimHeaders?: boolean;
    maxRows?: number;
}
export interface HeaderMapping {
    [standardField: string]: string[];
}
export interface ProcessingContext {
    runId: string;
    fileId: string;
    organizationId: string;
    pipeline: PipelineType;
    userId?: string;
}
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
//# sourceMappingURL=types.d.ts.map