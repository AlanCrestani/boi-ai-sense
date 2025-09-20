/**
 * Streaming CSV parser with automatic separator detection
 * Supports both fast-csv and PapaParse for different environments
 */

import { Readable } from 'stream';
import Papa from 'papaparse';
import { detectSeparator, CsvSeparator, SeparatorDetectionResult } from './separator-detection.js';

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

const DEFAULT_OPTIONS: Required<StreamingParseOptions> = {
  sampleLines: 10,
  minConfidence: 0.7,
  separator: ',',
  batchSize: 1000,
  skipEmptyLines: true,
  trimFields: true,
  hasHeaders: true,
};

/**
 * Streaming CSV Parser class
 */
export class StreamingCsvParser {
  private options: Required<StreamingParseOptions>;
  private result: ParsingResult;
  private currentBatch: ParsedRow[] = [];
  private rowNumber = 0;

  constructor(options: StreamingParseOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.result = {
      separator: this.options.separator,
      detection: { separator: ',', confidence: 0, analysis: {} as any },
      totalRows: 0,
      errors: [],
    };
  }

  /**
   * Parse CSV content from string
   */
  async parseString(
    csvContent: string,
    callbacks: {
      onRow?: RowCallback;
      onBatch?: BatchCallback;
      onError?: ErrorCallback;
    } = {}
  ): Promise<ParsingResult> {
    return this.parseInternal(csvContent, callbacks);
  }

  /**
   * Parse CSV content from readable stream
   */
  async parseStream(
    stream: Readable,
    callbacks: {
      onRow?: RowCallback;
      onBatch?: BatchCallback;
      onError?: ErrorCallback;
    } = {}
  ): Promise<ParsingResult> {
    const chunks: string[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk.toString());
      });

      stream.on('end', async () => {
        try {
          const csvContent = chunks.join('');
          const result = await this.parseInternal(csvContent, callbacks);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  /**
   * Internal parsing logic
   */
  private async parseInternal(
    csvContent: string,
    callbacks: {
      onRow?: RowCallback;
      onBatch?: BatchCallback;
      onError?: ErrorCallback;
    }
  ): Promise<ParsingResult> {
    // Reset state
    this.currentBatch = [];
    this.rowNumber = 0;
    this.result.totalRows = 0;
    this.result.errors = [];

    // Detect separator if not provided
    if (!this.options.separator) {
      this.result.detection = detectSeparator(csvContent, {
        sampleLines: this.options.sampleLines,
        minConfidence: this.options.minConfidence,
      });
      this.result.separator = this.result.detection.separator;
    } else {
      this.result.separator = this.options.separator;
    }

    // Configure PapaParse
    const config: Papa.ParseConfig = {
      delimiter: this.result.separator,
      skipEmptyLines: this.options.skipEmptyLines,
      header: false, // We handle headers manually
      step: async (results: Papa.ParseStepResult<string[]>) => {
        if (results.errors.length > 0) {
          // Errors are handled by the error callback above
          return;
        }

        this.rowNumber++;
        let rawData = results.data;

        // Trim fields if requested
        if (this.options.trimFields) {
          rawData = rawData.map((field: string) => field.trim());
        }

        // Handle headers
        if (this.rowNumber === 1 && this.options.hasHeaders) {
          this.result.headers = rawData;
          return; // Skip processing header row
        }

        // Create parsed row
        const parsedRow: ParsedRow = {
          raw: rawData,
          rowNumber: this.rowNumber,
          headers: this.result.headers,
        };

        this.result.totalRows++;

        // Add to batch
        this.currentBatch.push(parsedRow);

        // Call row callback
        if (callbacks.onRow) {
          try {
            await callbacks.onRow(parsedRow);
          } catch (error) {
            const parsingError: ParsingError = {
              row: this.rowNumber,
              message: `Row callback error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              data: parsedRow,
            };
            this.result.errors.push(parsingError);
            if (callbacks.onError) {
              callbacks.onError(parsingError);
            }
          }
        }

        // Process batch when full
        if (this.currentBatch.length >= this.options.batchSize) {
          await this.processBatch(callbacks);
        }
      },
    };

    return new Promise((resolve, reject) => {
      const parseConfig = {
        ...config,
        error: (error: Papa.ParseError) => {
          const parsingError: ParsingError = {
            row: error.row || 0,
            message: error.message,
            data: error,
          };
          this.result.errors.push(parsingError);
          if (callbacks.onError) {
            callbacks.onError(parsingError);
          }
        },
        complete: async () => {
          try {
            // Process remaining batch
            if (this.currentBatch.length > 0) {
              await this.processBatch(callbacks);
            }
            resolve(this.result);
          } catch (error) {
            reject(error);
          }
        },
      };

      Papa.parse(csvContent, parseConfig);
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(callbacks: { onBatch?: BatchCallback; onError?: ErrorCallback }) {
    if (this.currentBatch.length === 0) return;

    if (callbacks.onBatch) {
      try {
        await callbacks.onBatch([...this.currentBatch]);
      } catch (error) {
        const parsingError: ParsingError = {
          row: this.currentBatch[0]?.rowNumber || 0,
          message: `Batch callback error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: this.currentBatch,
        };
        this.result.errors.push(parsingError);
        if (callbacks.onError) {
          callbacks.onError(parsingError);
        }
      }
    }

    this.currentBatch = [];
  }

  /**
   * Get current parsing result
   */
  getResult(): ParsingResult {
    return { ...this.result };
  }
}

/**
 * Utility function to parse CSV string quickly
 */
export async function parseCSV(
  csvContent: string,
  options: StreamingParseOptions = {}
): Promise<{ rows: ParsedRow[]; result: ParsingResult }> {
  const parser = new StreamingCsvParser(options);
  const rows: ParsedRow[] = [];

  const result = await parser.parseString(csvContent, {
    onRow: (row) => {
      rows.push(row);
    },
  });

  return { rows, result };
}

/**
 * Utility function to parse CSV from stream
 */
export async function parseCSVStream(
  stream: Readable,
  options: StreamingParseOptions = {}
): Promise<{ rows: ParsedRow[]; result: ParsingResult }> {
  const parser = new StreamingCsvParser(options);
  const rows: ParsedRow[] = [];

  const result = await parser.parseStream(stream, {
    onRow: (row) => {
      rows.push(row);
    },
  });

  return { rows, result };
}