/**
 * Data Validation and Cleansing Service for Pipeline 02 - Desvio de Carregamento
 * Implements comprehensive validation rules for livestock feeding deviation data
 */
export interface ValidationConfig {
    allowFutureDates: boolean;
    maxDaysInFuture: number;
    minReasonableWeight: number;
    maxReasonableWeight: number;
    allowedEquipmentTypes: string[];
    strictMode: boolean;
}
export interface ValidationContext {
    organizationId: string;
    fileId: string;
    runId?: string;
    processingDate: Date;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    cleanedData?: DesvioCarregamentoData;
    severity: 'clean' | 'warnings' | 'errors' | 'critical';
}
export interface ValidationError {
    field: string;
    code: string;
    message: string;
    severity: 'error' | 'critical';
    originalValue?: any;
    suggestedValue?: any;
}
export interface ValidationWarning {
    field: string;
    code: string;
    message: string;
    originalValue: any;
    cleanedValue?: any;
}
export interface RawDesvioData {
    data?: string | Date;
    hora?: string;
    turno?: string;
    equipamento?: string;
    curral?: string | number;
    vagao?: string | number;
    dieta?: string;
    kg_planejado?: string | number;
    kg_real?: string | number;
    [key: string]: any;
}
export interface DesvioCarregamentoData {
    data_ref: Date;
    turno: string | null;
    equipamento: string;
    curral_codigo: string;
    dieta_nome: string | null;
    kg_planejado: number;
    kg_real: number;
    desvio_kg: number;
    desvio_pct: number;
    natural_key: string;
}
export declare const DEFAULT_VALIDATION_CONFIG: ValidationConfig;
export declare class DataValidationService {
    private config;
    constructor(config?: Partial<ValidationConfig>);
    /**
     * Validate and cleanse raw desvio carregamento data
     */
    validateDesvioData(rawData: RawDesvioData, context: ValidationContext): Promise<ValidationResult>;
    /**
     * Validate presence of required fields
     */
    private validateRequiredFields;
    /**
     * Validate and transform individual fields using Zod schemas
     */
    private validateFields;
    /**
     * Create cleaned data object with calculated fields
     */
    private createCleanedData;
    /**
     * Validate business rules
     */
    private validateBusinessRules;
    /**
     * Generate a natural key for the record
     */
    private generateNaturalKey;
    /**
     * Update validation configuration
     */
    updateConfig(newConfig: Partial<ValidationConfig>): void;
    /**
     * Get current validation configuration
     */
    getConfig(): ValidationConfig;
    /**
     * Batch validate multiple records
     */
    validateBatch(rawDataList: RawDesvioData[], context: ValidationContext): Promise<{
        results: ValidationResult[];
        summary: {
            total: number;
            valid: number;
            withWarnings: number;
            withErrors: number;
            critical: number;
        };
    }>;
}
