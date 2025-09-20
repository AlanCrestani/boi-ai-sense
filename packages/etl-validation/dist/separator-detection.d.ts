/**
 * Automatic CSV separator detection
 * Analyzes first N lines to determine the most likely delimiter
 */
export type CsvSeparator = ',' | ';' | '\t' | '|';
export interface SeparatorDetectionResult {
    separator: CsvSeparator;
    confidence: number;
    analysis: {
        [key in CsvSeparator]: {
            count: number;
            consistency: number;
            score: number;
        };
    };
}
export interface SeparatorDetectionOptions {
    sampleLines?: number;
    minConfidence?: number;
    fallbackSeparator?: CsvSeparator;
}
/**
 * Detects the most likely CSV separator by analyzing sample lines
 */
export declare function detectSeparator(csvContent: string, options?: SeparatorDetectionOptions): SeparatorDetectionResult;
/**
 * Utility function to convert separator to readable name
 */
export declare function separatorToName(separator: CsvSeparator): string;
