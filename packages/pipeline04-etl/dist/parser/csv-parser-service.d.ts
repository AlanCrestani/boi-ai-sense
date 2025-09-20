/**
 * Simple CSV Parser Service
 * Basic CSV parsing functionality for Pipeline ETL
 */
export interface CSVParseOptions {
    skipEmptyLines?: boolean;
    trimHeaders?: boolean;
    dynamicTyping?: boolean;
    delimiter?: string;
}
export interface CSVParseResult {
    success: boolean;
    data?: any[];
    errors: string[];
    meta?: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
    };
}
export declare class CSVParserService {
    /**
     * Parse CSV content into JavaScript objects
     */
    parseCSV(content: string, options?: CSVParseOptions): Promise<CSVParseResult>;
    /**
     * Detect CSV delimiter by analyzing the first few lines
     */
    private detectDelimiter;
    /**
     * Parse a single CSV line respecting quotes and escaping
     */
    private parseLine;
    /**
     * Convert string value to appropriate type
     */
    private convertType;
}
