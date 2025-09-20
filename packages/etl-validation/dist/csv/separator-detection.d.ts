/**
 * CSV Separator Detection Utility
 * Automatically detects the separator used in CSV files by analyzing sample lines
 */
export interface SeparatorDetectionResult {
    separator: string;
    confidence: number;
    detectedPattern: {
        comma: number;
        semicolon: number;
        tab: number;
        pipe: number;
    };
}
export interface SeparatorDetectionOptions {
    /** Number of lines to sample for detection (default: 5) */
    sampleLines?: number;
    /** Minimum confidence threshold (default: 0.7) */
    minConfidence?: number;
    /** Custom separators to test */
    customSeparators?: string[];
}
/**
 * Detects the most likely CSV separator by analyzing the first N lines
 * @param csvContent - The CSV content as string
 * @param options - Detection options
 * @returns Detection result with separator and confidence
 */
export declare function detectSeparator(csvContent: string, options?: SeparatorDetectionOptions): SeparatorDetectionResult;
/**
 * Validates if a separator detection is reliable
 * @param result - Detection result
 * @param minConfidence - Minimum confidence threshold
 * @returns True if detection is reliable
 */
export declare function isDetectionReliable(result: SeparatorDetectionResult, minConfidence?: number): boolean;
/**
 * Gets a human-readable name for a separator
 * @param separator - The separator character
 * @returns Human-readable name
 */
export declare function getSeparatorName(separator: string): string;
/**
 * Analyzes a CSV file and provides detailed separator detection report
 * @param csvContent - The CSV content
 * @param options - Detection options
 * @returns Detailed analysis report
 */
export declare function analyzeCsvSeparators(csvContent: string, options?: SeparatorDetectionOptions): {
    result: SeparatorDetectionResult;
    isReliable: boolean;
    recommendation: string;
    alternativeSeparators: Array<{
        separator: string;
        confidence: number;
        name: string;
    }>;
};
