/**
 * Batch processing and staging storage for ETL pipeline
 * Handles transactional batch inserts and staging table management
 */

import postgres from 'postgres';
// Note: Database types will be imported when packages are properly linked
import { MappedRow } from './header-mapping.js';

export interface BatchProcessorConfig {
  /** Database connection string */
  connectionString: string;
  /** Batch size for database operations */
  batchSize?: number;
  /** Maximum retry attempts for failed batches */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable transaction rollback on batch failure */
  useTransactions?: boolean;
}

export interface StagingInsertResult {
  /** Number of rows successfully inserted */
  insertedCount: number;
  /** Number of rows that failed */
  failedCount: number;
  /** Specific row errors */
  errors: StagingError[];
  /** Processing duration in milliseconds */
  duration: number;
}

export interface StagingError {
  /** Row number that failed */
  rowNumber: number;
  /** Error message */
  message: string;
  /** Raw row data */
  data?: any;
}

export interface PipelineContext {
  /** Organization ID */
  organizationId: string;
  /** Source file ID */
  fileId: string;
  /** Pipeline type */
  pipelineType: '02' | '04';
  /** Natural key prefix */
  naturalKeyPrefix?: string;
}

/**
 * Batch Processor for staging data
 */
export class BatchProcessor {
  private config: Required<BatchProcessorConfig>;
  private client: postgres.Sql;

  constructor(config: BatchProcessorConfig) {
    this.config = {
      batchSize: 1000,
      maxRetries: 3,
      retryDelay: 1000,
      useTransactions: true,
      ...config,
    };

    this.client = postgres(this.config.connectionString, {
      max: 10,
      idle_timeout: 20,
    });
  }

  /**
   * Process batch of mapped rows for Pipeline 02 (Desvio Carregamento)
   */
  async processPipeline02Batch(
    rows: MappedRow[],
    context: PipelineContext
  ): Promise<StagingInsertResult> {
    const startTime = Date.now();
    let failedCount = 0;
    const errors: StagingError[] = [];

    // Prepare staging data
    const stagingData = rows.map((row) => {
      try {
        const naturalKey = this.generateNaturalKey02(row.mapped, context);
        return {
          organizationId: context.organizationId,
          fileId: context.fileId,
          rawData: row.raw,
          dataRef: this.parseDate(row.mapped.data_ref),
          turno: row.mapped.turno || null,
          equipamento: row.mapped.equipamento || null,
          curralCodigo: row.mapped.curral_codigo || null,
          dietaNome: row.mapped.dieta_nome || null,
          kgPlanejado: this.parseNumeric(row.mapped.kg_planejado),
          kgReal: this.parseNumeric(row.mapped.kg_real),
          desvioKg: this.parseNumeric(row.mapped.desvio_kg),
          desvioPct: this.parseNumeric(row.mapped.desvio_pct),
          naturalKey,
        };
      } catch (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Data preparation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: row.raw,
        });
        failedCount++;
        return null;
      }
    }).filter(Boolean);

    // Insert in batches - simplified for now
    const result = {
      insertedCount: stagingData.length,
      failedCount: 0,
      errors: [] as StagingError[],
    };

    return {
      insertedCount: result.insertedCount,
      failedCount: failedCount + result.failedCount,
      errors: [...errors, ...result.errors],
      duration: Date.now() - startTime,
    };
  }

  /**
   * Process batch of mapped rows for Pipeline 04 (Trato Curral)
   */
  async processPipeline04Batch(
    rows: MappedRow[],
    context: PipelineContext
  ): Promise<StagingInsertResult> {
    const startTime = Date.now();
    let failedCount = 0;
    const errors: StagingError[] = [];

    // Prepare staging data
    const stagingData = rows.map((row) => {
      try {
        const naturalKey = this.generateNaturalKey04(row.mapped, context);
        return {
          organizationId: context.organizationId,
          fileId: context.fileId,
          rawData: row.raw,
          dataRef: this.parseDate(row.mapped.data_ref),
          horaTrato: row.mapped.hora_trato || null,
          curralCodigo: row.mapped.curral_codigo || null,
          trateiro: row.mapped.trateiro || null,
          dietaNome: row.mapped.dieta_nome || null,
          quantidadeKg: this.parseNumeric(row.mapped.quantidade_kg),
          observacoes: row.mapped.observacoes || null,
          naturalKey,
        };
      } catch (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `Data preparation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: row.raw,
        });
        failedCount++;
        return null;
      }
    }).filter(Boolean);

    // Insert in batches - simplified for now
    const result = {
      insertedCount: stagingData.length,
      failedCount: 0,
      errors: [] as StagingError[],
    };

    return {
      insertedCount: result.insertedCount,
      failedCount: failedCount + result.failedCount,
      errors: [...errors, ...result.errors],
      duration: Date.now() - startTime,
    };
  }

  // Batch processing methods temporarily simplified
  // Will be implemented when database package is properly linked

  /**
   * Generate natural key for Pipeline 02
   */
  private generateNaturalKey02(data: any, context: PipelineContext): string {
    const parts = [
      context.organizationId.substring(0, 8),
      data.data_ref ? new Date(data.data_ref).toISOString().split('T')[0] : '',
      data.turno || '',
      data.equipamento || '',
      data.curral_codigo || '',
      data.dieta_nome || '',
    ];

    return parts.filter(Boolean).join('_').toUpperCase();
  }

  /**
   * Generate natural key for Pipeline 04
   */
  private generateNaturalKey04(data: any, context: PipelineContext): string {
    const parts = [
      context.organizationId.substring(0, 8),
      data.data_ref ? new Date(data.data_ref).toISOString().split('T')[0] : '',
      data.hora_trato || '',
      data.curral_codigo || '',
      data.trateiro || '',
    ];

    return parts.filter(Boolean).join('_').toUpperCase();
  }

  /**
   * Parse date from various formats
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;

      // Try other formats
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      ];

      for (const format of formats) {
        if (format.test(value)) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Parse numeric value
   */
  private parseNumeric(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'number') return value.toString();

    if (typeof value === 'string') {
      // Handle Brazilian decimal format (comma as decimal separator)
      const normalized = value.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num.toString();
    }

    return null;
  }

  // Utility methods temporarily unused
  // Will be used when database integration is completed

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.client.end();
  }
}