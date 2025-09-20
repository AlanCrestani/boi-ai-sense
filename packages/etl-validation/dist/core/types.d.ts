export interface ValidationConfig {
    pipeline: string;
    requiredFields: string[];
    optionalFields?: string[];
    headerMappings: Record<string, string[]>;
    naturalKeyFields: string[];
    customValidators?: ValidationRule[];
}
export interface ValidationRule {
    field: string;
    rule: 'required' | 'numeric' | 'date' | 'email' | 'regex' | 'enum' | 'range' | 'custom';
    params?: any;
    message?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    processedRows: number;
    validRows: number;
}
export interface ValidationError {
    row: number;
    field: string;
    value: any;
    message: string;
    severity: 'error' | 'warning';
}
export interface ValidationWarning {
    row: number;
    field: string;
    value: any;
    message: string;
}
export interface ParsedCsvData {
    headers: string[];
    rows: Record<string, any>[];
    metadata: {
        totalRows: number;
        delimiter: string;
        encoding: string;
    };
}
