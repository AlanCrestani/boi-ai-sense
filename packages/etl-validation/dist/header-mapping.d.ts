/**
 * Flexible header mapping for CSV files
 * Supports variant header names, aliases, and missing field handling
 */
export interface HeaderMapping {
    /** Canonical field name */
    canonical: string;
    /** Required field flag */
    required?: boolean;
    /** Alternative header names that map to this field */
    aliases?: string[];
    /** Data type for validation */
    type?: 'string' | 'number' | 'date' | 'boolean';
    /** Default value if field is missing */
    defaultValue?: any;
    /** Custom transformation function */
    transform?: (value: string) => any;
    /** Validation function */
    validate?: (value: any) => boolean | string;
}
export interface HeaderMappingConfig {
    /** Field mappings */
    fields: Record<string, HeaderMapping>;
    /** Case-sensitive matching */
    caseSensitive?: boolean;
    /** Strict mode - fail if unknown headers found */
    strict?: boolean;
    /** Prefix to remove from headers (e.g., "col_") */
    removePrefix?: string;
    /** Suffix to remove from headers (e.g., "_data") */
    removeSuffix?: string;
}
export interface MappedRow {
    /** Original raw data */
    raw: string[];
    /** Original headers */
    headers: string[];
    /** Mapped data with canonical field names */
    mapped: Record<string, any>;
    /** Fields that were missing from input */
    missingFields: string[];
    /** Fields that couldn't be mapped */
    unmappedFields: string[];
    /** Validation errors */
    errors: FieldError[];
    /** Row number */
    rowNumber: number;
}
export interface FieldError {
    field: string;
    message: string;
    value?: any;
}
export interface MappingAnalysis {
    /** Headers found in CSV */
    detectedHeaders: string[];
    /** Successfully mapped headers */
    mappedHeaders: string[];
    /** Headers that couldn't be mapped */
    unmappedHeaders: string[];
    /** Required fields that are missing */
    missingRequired: string[];
    /** Mapping confidence score (0-1) */
    confidence: number;
    /** Suggested header mappings */
    suggestions: Array<{
        csvHeader: string;
        suggestedCanonical: string;
        similarity: number;
    }>;
}
/**
 * Header Mapper class for flexible CSV header mapping
 */
export declare class HeaderMapper {
    private config;
    private headerMap;
    private analysis;
    constructor(config: HeaderMappingConfig);
    /**
     * Analyze headers and create mapping
     */
    analyzeHeaders(headers: string[]): MappingAnalysis;
    /**
     * Map a row using the current header mapping
     */
    mapRow(rawData: string[], headers: string[], rowNumber: number): MappedRow;
    /**
     * Get current mapping analysis
     */
    getAnalysis(): MappingAnalysis | null;
    /**
     * Clean header name
     */
    private cleanHeader;
    /**
     * Find mapping for a header
     */
    private findMapping;
    /**
     * Find best suggestion for unmapped header
     */
    private findBestSuggestion;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateSimilarity;
    /**
     * Convert value to specified type
     */
    private convertType;
}
