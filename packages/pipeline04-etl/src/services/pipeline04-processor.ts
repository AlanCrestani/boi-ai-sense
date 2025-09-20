/**
 * Main Pipeline 04 ETL Processor
 * Integrates all services for complete feeding treatment data processing
 */

import { Pipeline04BusinessValidator, Pipeline04ProcessedData } from '../validators/business-rules.js';
import { Pipeline04DataCleanser, MappedRow } from '../validators/data-cleanser.js';
import { ReferentialIntegrityService, ReferentialCheckResult } from './referential-integrity.js';
import { FactTratoUpsertService, UpsertResult } from './upsert-strategy.js';
import { DimensionLookupService } from './dimension-lookup.js';

export interface Pipeline04ProcessingResult {
  success: boolean;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  pendingEntries: number;
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
  processingTimeMs: number;
}

export interface ProcessingError {
  rowNumber?: number;
  stage: 'validation' | 'cleaning' | 'referential' | 'upsert';
  field?: string;
  code: string;
  message: string;
  originalValue?: any;
}

export interface ProcessingWarning {
  rowNumber?: number;
  stage: 'validation' | 'cleaning' | 'referential' | 'upsert';
  field?: string;
  message: string;
  recommendation?: string;
}

/**
 * Complete Pipeline 04 ETL processor
 */
export class Pipeline04Processor {
  private businessValidator: Pipeline04BusinessValidator;
  private dataCleanser: Pipeline04DataCleanser;
  private referentialService: ReferentialIntegrityService;
  private upsertService: FactTratoUpsertService;

  constructor(dimensionService: DimensionLookupService) {
    this.businessValidator = new Pipeline04BusinessValidator();
    this.dataCleanser = new Pipeline04DataCleanser();
    this.referentialService = new ReferentialIntegrityService(dimensionService);
    this.upsertService = new FactTratoUpsertService(dimensionService);
  }

  /**
   * Process a single feeding treatment record through the complete ETL pipeline
   */
  async processSingleRecord(
    rawRow: MappedRow,
    organizationId: string,
    fileId: string,
    transaction: any,
    fatoTable: any
  ): Promise<{
    success: boolean;
    result?: UpsertResult;
    errors: ProcessingError[];
    warnings: ProcessingWarning[];
  }> {
    const errors: ProcessingError[] = [];
    const warnings: ProcessingWarning[] = [];

    try {
      // Stage 1: Data Cleaning
      const cleaningResult = this.dataCleanser.cleanRow(rawRow);

      // Convert cleaning warnings to processing warnings
      cleaningResult.warnings.forEach(w => {
        warnings.push({
          rowNumber: rawRow.rowNumber,
          stage: 'cleaning',
          field: w.field,
          message: w.message,
          recommendation: `Valor original: ${w.originalValue}, valor limpo: ${w.cleanedValue}`,
        });
      });

      // Stage 2: Business Rules Validation
      const validationResult = this.businessValidator.validateRawData(cleaningResult.cleaned);

      if (!validationResult.isValid) {
        validationResult.errors.forEach(e => {
          errors.push({
            rowNumber: rawRow.rowNumber,
            stage: 'validation',
            field: e.field,
            code: e.code || 'VALIDATION_ERROR',
            message: e.message,
            originalValue: e.value,
          });
        });

        return { success: false, errors, warnings };
      }

      // Stage 3: Process and Transform Data
      const processedData = this.businessValidator.processData(validationResult.data!, organizationId);

      // Stage 4: Business Logic Validation
      const businessLogicResult = this.businessValidator.validateBusinessLogic(processedData);

      // Convert business logic errors to warnings (non-blocking)
      businessLogicResult.errors.forEach(e => {
        warnings.push({
          rowNumber: rawRow.rowNumber,
          stage: 'validation',
          field: e.field,
          message: e.message,
          recommendation: 'Verifique se os dados estão corretos',
        });
      });

      // Stage 5: Referential Integrity Check
      const referentialResult = await this.referentialService.checkReferentialIntegrity(
        {
          curral_codigo: processedData.curral_codigo,
          dieta_nome: processedData.dieta_nome,
          trateiro: processedData.trateiro,
        },
        organizationId
      );

      // Convert referential errors to processing warnings/errors
      referentialResult.errors.forEach(e => {
        if (e.severity === 'error') {
          errors.push({
            rowNumber: rawRow.rowNumber,
            stage: 'referential',
            field: e.field,
            code: e.code,
            message: e.message,
            originalValue: e.originalValue,
          });
        } else {
          warnings.push({
            rowNumber: rawRow.rowNumber,
            stage: 'referential',
            field: e.field,
            message: e.message,
          });
        }
      });

      referentialResult.warnings.forEach(w => {
        warnings.push({
          rowNumber: rawRow.rowNumber,
          stage: 'referential',
          field: w.field,
          message: w.message,
          recommendation: w.recommendation,
        });
      });

      // If referential integrity failed, return error
      if (!referentialResult.isValid) {
        return { success: false, errors, warnings };
      }

      // Stage 6: UPSERT Operation
      const upsertResult = await this.upsertService.upsertSingleRecord(
        transaction,
        processedData,
        organizationId,
        fileId,
        fatoTable
      );

      return {
        success: true,
        result: upsertResult,
        errors,
        warnings,
      };

    } catch (error) {
      errors.push({
        rowNumber: rawRow.rowNumber,
        stage: 'upsert',
        code: 'PROCESSING_ERROR',
        message: `Erro inesperado no processamento: ${error instanceof Error ? error.message : error}`,
      });

      return { success: false, errors, warnings };
    }
  }

  /**
   * Process multiple feeding treatment records through the complete ETL pipeline
   */
  async processBatch(
    rawRows: MappedRow[],
    organizationId: string,
    fileId: string,
    transaction: any,
    fatoTable: any
  ): Promise<Pipeline04ProcessingResult> {
    const startTime = Date.now();
    const allErrors: ProcessingError[] = [];
    const allWarnings: ProcessingWarning[] = [];

    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let pendingEntries = 0;

    for (const rawRow of rawRows) {
      const result = await this.processSingleRecord(rawRow, organizationId, fileId, transaction, fatoTable);

      recordsProcessed++;
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);

      if (result.success && result.result) {
        switch (result.result.action) {
          case 'inserted':
            recordsInserted++;
            break;
          case 'updated':
            recordsUpdated++;
            break;
          case 'skipped':
            recordsSkipped++;
            break;
          case 'pending':
            pendingEntries += result.result.pendingEntries?.length || 0;
            break;
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const success = allErrors.length === 0;

    return {
      success,
      recordsProcessed,
      recordsInserted,
      recordsUpdated,
      recordsSkipped,
      pendingEntries,
      errors: allErrors,
      warnings: allWarnings,
      processingTimeMs,
    };
  }

  /**
   * Get processing statistics and health check
   */
  async getProcessingHealthCheck(organizationId: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    pendingEntriesCount: number;
    oldestPendingEntry?: Date;
    recommendations: string[];
  }> {
    const referentialReport = await this.referentialService.getReferentialIntegrityReport(organizationId);

    const pendingCount = referentialReport.summary.totalPending;
    const oldestPending = referentialReport.summary.oldestPending;

    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    if (pendingCount > 0) {
      status = 'warning';
      recommendations.push(`Existem ${pendingCount} entradas pendentes que precisam ser resolvidas`);

      if (oldestPending) {
        const daysSinceOldest = Math.floor((Date.now() - oldestPending.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOldest > 7) {
          status = 'error';
          recommendations.push(`Entrada pendente mais antiga tem ${daysSinceOldest} dias - resolva urgentemente`);
        } else if (daysSinceOldest > 3) {
          recommendations.push(`Entrada pendente mais antiga tem ${daysSinceOldest} dias - resolva em breve`);
        }
      }
    }

    if (referentialReport.summary.pendingCurrals > 10) {
      status = 'error';
      recommendations.push('Muitos currais pendentes - verifique nomenclatura padrão');
    }

    if (referentialReport.summary.pendingDietas > 5) {
      status = 'warning';
      recommendations.push('Várias dietas pendentes - padronize nomenclatura');
    }

    return {
      status,
      pendingEntriesCount: pendingCount,
      oldestPendingEntry: oldestPending,
      recommendations,
    };
  }

  /**
   * Generate comprehensive processing report
   */
  generateProcessingReport(result: Pipeline04ProcessingResult): string {
    const lines: string[] = [];

    lines.push('📊 Pipeline 04 - Relatório de Processamento');
    lines.push('=====================================');
    lines.push('');

    // Summary
    lines.push('📈 Resumo:');
    lines.push(`   Total processado: ${result.recordsProcessed} registros`);
    lines.push(`   Inseridos: ${result.recordsInserted}`);
    lines.push(`   Atualizados: ${result.recordsUpdated}`);
    lines.push(`   Ignorados: ${result.recordsSkipped}`);
    lines.push(`   Entradas pendentes: ${result.pendingEntries}`);
    lines.push(`   Tempo: ${result.processingTimeMs}ms`);
    lines.push(`   Status: ${result.success ? '✅ Sucesso' : '❌ Falhou'}`);
    lines.push('');

    // Errors
    if (result.errors.length > 0) {
      lines.push('❌ Erros:');
      result.errors.forEach(error => {
        const row = error.rowNumber ? ` (linha ${error.rowNumber})` : '';
        lines.push(`   ${error.stage}${row}: ${error.message}`);
      });
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️ Avisos:');
      result.warnings.slice(0, 10).forEach(warning => { // Show only first 10 warnings
        const row = warning.rowNumber ? ` (linha ${warning.rowNumber})` : '';
        lines.push(`   ${warning.stage}${row}: ${warning.message}`);
      });
      if (result.warnings.length > 10) {
        lines.push(`   ... e mais ${result.warnings.length - 10} avisos`);
      }
      lines.push('');
    }

    // Performance metrics
    if (result.recordsProcessed > 0) {
      const avgTimePerRecord = result.processingTimeMs / result.recordsProcessed;
      lines.push('⚡ Performance:');
      lines.push(`   Tempo médio por registro: ${avgTimePerRecord.toFixed(2)}ms`);
      lines.push(`   Taxa de processamento: ${(result.recordsProcessed / (result.processingTimeMs / 1000)).toFixed(1)} registros/segundo`);
    }

    return lines.join('\n');
  }
}