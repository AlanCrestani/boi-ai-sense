/**
 * Data Cleansing for Pipeline 02 - Desvio de Carregamento
 * Cleans and normalizes raw CSV data before validation
 */
interface MappedRow {
    raw: string[];
    rowNumber: number;
    mapped: Record<string, any>;
    errors: any[];
}
export interface CleansingResult {
    cleaned: Record<string, any>;
    warnings: CleansingWarning[];
}
export interface CleansingWarning {
    field: string;
    message: string;
    originalValue: any;
    cleanedValue: any;
}
/**
 * Data Cleanser for Pipeline 02
 */
export declare class Pipeline02DataCleanser {
    /**
     * Clean and normalize raw CSV row data
     */
    cleanRow(mappedRow: MappedRow): CleansingResult;
    /**
     * Clean date field with various format support
     */
    private cleanDateField;
    /**
     * Clean text field with normalization options
     */
    private cleanTextField;
    /**
     * Clean equipamento field with specific business logic
     */
    private cleanEquipamentoField;
    /**
     * Clean numeric field with Brazilian format support
     */
    private cleanNumericField;
}
export {};
//# sourceMappingURL=data-cleanser.d.ts.map