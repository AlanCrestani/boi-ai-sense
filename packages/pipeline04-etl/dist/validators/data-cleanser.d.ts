/**
 * Data Cleanser for Pipeline 04 - Trato por Curral ETL
 * Handles Brazilian data formats and common data quality issues
 */
export interface CleansingResult {
    cleaned: any;
    warnings: CleansingWarning[];
}
export interface CleansingWarning {
    field: string;
    message: string;
    originalValue: any;
    cleanedValue: any;
}
export interface MappedRow {
    raw: (string | null | undefined)[];
    rowNumber: number;
    mapped: Record<string, any>;
    errors: any[];
}
/**
 * Data cleanser for Pipeline 04 feeding treatment data
 */
export declare class Pipeline04DataCleanser {
    /**
     * Clean a row of data
     */
    cleanRow(row: MappedRow): CleansingResult;
    /**
     * Clean date field (Brazilian format DD/MM/YYYY to ISO)
     */
    private cleanDateField;
    /**
     * Clean time field (HH:MM format)
     */
    private cleanTimeField;
    /**
     * Clean turno field
     */
    private cleanTurnoField;
    /**
     * Clean curral code field
     */
    private cleanCurralField;
    /**
     * Clean trateiro name field
     */
    private cleanTrateiroField;
    private cleanTrateiroFieldOLD;
    /**
     * Clean dieta name field
     */
    private cleanDietaField;
    /**
     * Clean tipo trato field
     */
    private cleanTipoTratoField;
    /**
     * Clean numeric field (handle Brazilian decimal format)
     */
    private cleanNumericField;
    /**
     * Clean text field (general purpose)
     */
    private cleanTextField;
}
