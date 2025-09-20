/**
 * Streaming CSV parser with automatic separator detection
 * Supports both fast-csv and PapaParse for different environments
 */
import { Readable } from 'stream';
import { CsvSeparator, SeparatorDetectionResult } from './separator-detection.js';
export interface StreamingParseOptions {
    /** Maximum number of lines to sample for separator detection */
    sampleLines?: number;
    /** Minimum confidence required for automatic separator detection */
    minConfidence?: number;
    /** Manual separator override (skips detection) */
    separator?: CsvSeparator;
    /** Batch size for processing rows */
    batchSize?: number;
    /** Skip empty lines */
    skipEmptyLines?: boolean;
    /** Trim whitespace from fields */
    trimFields?: boolean;
    /** First row contains headers */
    hasHeaders?: boolean;
}
export interface ParsedRow {
    /** Raw row data as array of strings */
    raw: string[];
    /** Row number (1-based) */
    rowNumber: number;
    /** Headers if hasHeaders is true */
    headers?: string[];
}
export interface ParsingResult {
    /** Detected or provided separator */
    separator: CsvSeparator;
    /** Separator detection details */
    detection: SeparatorDetectionResult;
    /** Headers if hasHeaders is true */
    headers?: string[];
    /** Total rows processed */
    totalRows: number;
    /** Parsing errors encountered */
    errors: ParsingError[];
}
export interface ParsingError {
    row: number;
    message: string;
    data?: any;
}
export type RowCallback = (row: ParsedRow) => Promise<void> | void;
export type BatchCallback = (batch: ParsedRow[]) => Promise<void> | void;
export type ErrorCallback = (error: ParsingError) => void;
/**
 * Streaming CSV Parser class
 */
export declare class StreamingCsvParser {
    private options;
    private result;
    private currentBatch;
    private rowNumber;
    constructor(options?: StreamingParseOptions);
    /**
     * Parse CSV content from string
     */
    parseString(csvContent: string, callbacks?: {
        onRow?: RowCallback;
        onBatch?: BatchCallback;
        onError?: ErrorCallback;
    }): Promise<ParsingResult>;
    /**
     * Parse CSV content from readable stream
     */
    parseStream(stream: Readable, callbacks?: {
        onRow?: RowCallback;
        onBatch?: BatchCallback;
        onError?: ErrorCallback;
    }): Promise<ParsingResult>;
    /**
     * Internal parsing logic
     */
    private parseInternal;
    /**
     * Process current batch
     */
    private processBatch;
    /**
     * Get current parsing result
     */
    getResult(): ParsingResult;
}
/**
 * Utility function to parse CSV string quickly
 */
export declare function parseCSV(csvContent: string, options?: StreamingParseOptions): Promise<{
    rows: ParsedRow[];
    result: ParsingResult;
}>;
/**
 * Utility function to parse CSV from stream
 */
export declare function parseCSVStream(stream: Readable, options?: StreamingParseOptions): Promise<{
    rows: ParsedRow[];
    result: ParsingResult;
}>;
