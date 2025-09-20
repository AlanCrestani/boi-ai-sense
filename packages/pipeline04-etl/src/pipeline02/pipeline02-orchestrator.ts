/**
 * Pipeline 02 Orchestrator - End-to-End ETL Automation
 * Orchestrates the complete Pipeline 02 workflow from file upload to fact table loading
 */

import { ETLStateMachineService } from '../state-machine/state-machine-service.js';
import { ETLState } from '../state-machine/types.js';
import { Pipeline02StateIntegration, Pipeline02Context, Pipeline02ProcessingOptions, Pipeline02ProcessingResult } from './pipeline02-state-integration.js';
import { CSVParserService } from '../parser/csv-parser-service.js';

export interface Pipeline02OrchestratorContext {
  organizationId: string;
  userId?: string;
  supabaseClient: any;
}

export interface Pipeline02FileProcessingRequest {
  fileId: string;
  filePath: string;
  fileName: string;
  processingOptions?: Pipeline02ProcessingOptions;
}

export interface Pipeline02OrchestratorResult {
  success: boolean;
  fileId: string;
  finalState: ETLState;
  processingResult?: Pipeline02ProcessingResult;
  errors: string[];
  warnings: string[];
  duration: number;
  summary: {
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    pendingDimensions: number;
  };
}

export class Pipeline02Orchestrator {
  private stateMachineService: ETLStateMachineService;
  private csvParserService: CSVParserService;
  private context: Pipeline02OrchestratorContext;

  constructor(context: Pipeline02OrchestratorContext) {
    this.context = context;
    this.stateMachineService = new ETLStateMachineService(context.supabaseClient);
    this.csvParserService = new CSVParserService();
  }

  /**
   * Process a file through the complete Pipeline 02 workflow
   */
  async processFile(request: Pipeline02FileProcessingRequest): Promise<Pipeline02OrchestratorResult> {
    const startTime = Date.now();

    const result: Pipeline02OrchestratorResult = {
      success: false,
      fileId: request.fileId,
      finalState: ETLState.UPLOADED,
      errors: [],
      warnings: [],
      duration: 0,
      summary: {
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        pendingDimensions: 0,
      },
    };

    try {
      // Log orchestration start
      await this.logStep(request.fileId, 'ORCHESTRATION_START',
        `Starting Pipeline 02 orchestration for file: ${request.fileName}`);

      // Step 1: Verify file state and get ETL file record
      const etlFile = await this.stateMachineService.getETLFile(request.fileId);
      if (!etlFile) {
        throw new Error(`ETL file record not found for fileId: ${request.fileId}`);
      }

      result.finalState = etlFile.currentState;

      // Step 2: Parse CSV file if not already parsed
      let rawData: any[] = [];
      if (etlFile.currentState === ETLState.UPLOADED) {
        await this.logStep(request.fileId, 'PARSING_START', 'Starting CSV file parsing');

        try {
          rawData = await this.parseCSVFile(request.filePath);
          result.summary.totalRecords = rawData.length;

          await this.logStep(request.fileId, 'PARSING_SUCCESS',
            `Successfully parsed ${rawData.length} records from CSV`);
        } catch (parseError) {
          const errorMsg = `CSV parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          await this.logStep(request.fileId, 'PARSING_FAILED', errorMsg);

          // Transition to failed state
          await this.stateMachineService.transitionFileState(
            request.fileId,
            ETLState.FAILED,
            this.context.userId,
            errorMsg
          );
          result.finalState = ETLState.FAILED;
          return result;
        }
      } else {
        // File already parsed, we need to retrieve the data from staging or re-parse
        await this.logStep(request.fileId, 'REPROCESSING_NOTE',
          `File already processed to state: ${etlFile.currentState}. Re-parsing for reprocessing.`);

        try {
          rawData = await this.parseCSVFile(request.filePath);
          result.summary.totalRecords = rawData.length;
        } catch (parseError) {
          const errorMsg = `Reprocessing parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          await this.logStep(request.fileId, 'REPROCESSING_PARSE_FAILED', errorMsg);
          return result;
        }
      }

      // Step 3: Execute Pipeline 02 state integration workflow
      await this.logStep(request.fileId, 'PIPELINE_PROCESSING_START',
        'Starting Pipeline 02 state integration processing');

      const pipelineContext: Pipeline02Context = {
        organizationId: this.context.organizationId,
        fileId: request.fileId,
        runId: etlFile.id || undefined,
        userId: this.context.userId,
        supabaseClient: this.context.supabaseClient,
      };

      const pipeline02Integration = new Pipeline02StateIntegration(pipelineContext);

      try {
        const processingResult = await pipeline02Integration.processFile(
          rawData,
          pipelineContext,
          request.processingOptions || {}
        );

        result.processingResult = processingResult;
        result.finalState = processingResult.state;
        result.success = processingResult.success;
        result.errors.push(...processingResult.errors);
        result.warnings.push(...processingResult.warnings);

        // Update summary with processing results
        result.summary.processedRecords = processingResult.processedRecords;
        result.summary.failedRecords = processingResult.failedRecords;
        result.summary.pendingDimensions = processingResult.dimensionStats?.pendingDimensions || 0;

        if (processingResult.success) {
          await this.logStep(request.fileId, 'PIPELINE_PROCESSING_SUCCESS',
            `Pipeline 02 processing completed successfully. Processed: ${processingResult.processedRecords}, Failed: ${processingResult.failedRecords}`);
        } else {
          await this.logStep(request.fileId, 'PIPELINE_PROCESSING_FAILED',
            `Pipeline 02 processing failed with errors: ${processingResult.errors.join(', ')}`);
        }

      } catch (processingError) {
        const errorMsg = `Pipeline 02 processing error: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        await this.logStep(request.fileId, 'PIPELINE_PROCESSING_ERROR', errorMsg);

        // Ensure failed state is set
        result.finalState = ETLState.FAILED;
        await this.stateMachineService.transitionFileState(
          request.fileId,
          ETLState.FAILED,
          this.context.userId,
          errorMsg
        );
      }

      // Step 4: Final logging and cleanup
      result.duration = Date.now() - startTime;

      const finalMessage = result.success
        ? `Pipeline 02 orchestration completed successfully in ${result.duration}ms`
        : `Pipeline 02 orchestration failed after ${result.duration}ms with ${result.errors.length} errors`;

      await this.logStep(request.fileId, 'ORCHESTRATION_COMPLETE', finalMessage);

    } catch (orchestrationError) {
      result.duration = Date.now() - startTime;
      const errorMsg = `Orchestration error: ${orchestrationError instanceof Error ? orchestrationError.message : 'Unknown error'}`;
      result.errors.push(errorMsg);

      await this.logStep(request.fileId, 'ORCHESTRATION_ERROR', errorMsg);

      // Ensure failed state
      result.finalState = ETLState.FAILED;
      try {
        await this.stateMachineService.transitionFileState(
          request.fileId,
          ETLState.FAILED,
          this.context.userId,
          errorMsg
        );
      } catch (stateError) {
        console.error('Failed to transition to failed state:', stateError);
      }
    }

    return result;
  }

  /**
   * Parse CSV file using the CSV parser service
   */
  private async parseCSVFile(filePath: string): Promise<any[]> {
    try {
      // Read file from Supabase Storage or local filesystem
      const fileContent = await this.readFile(filePath);

      // Use CSV parser service to parse the content
      const parseResult = await this.csvParserService.parseCSV(fileContent, {
        skipEmptyLines: true,
        trimHeaders: true,
        dynamicTyping: false, // Keep as strings for validation
      });

      if (!parseResult.success) {
        throw new Error(`CSV parsing failed: ${parseResult.errors.join(', ')}`);
      }

      return parseResult.data || [];
    } catch (error) {
      throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read file content from storage
   */
  private async readFile(filePath: string): Promise<string> {
    if (filePath.startsWith('http') || filePath.startsWith('supabase://')) {
      // Handle Supabase Storage URLs
      const { data, error } = await this.context.supabaseClient.storage
        .from('csv-uploads')
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download file from Supabase Storage: ${error.message}`);
      }

      return await data.text();
    } else {
      // Handle local file system (for testing)
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf-8');
    }
  }

  /**
   * Log a processing step to ETL run log
   */
  private async logStep(fileId: string, stepName: string, message: string): Promise<void> {
    try {
      // Simple console logging for now - would integrate with proper logging service
      console.log(`🔄 [Pipeline 02 - ${fileId}] ${stepName}: ${message}`);
    } catch (error) {
      console.error(`Failed to log step ${stepName}:`, error);
    }
  }

  /**
   * Get processing status for a file
   */
  async getFileStatus(fileId: string): Promise<{
    fileId: string;
    state: ETLState;
    lastUpdated: Date;
    processingStats?: any;
    logs: any[];
  } | null> {
    try {
      const etlFile = await this.stateMachineService.getETLFile(fileId);
      if (!etlFile) {
        return null;
      }

      const logs: any[] = []; // Would get logs from logging service

      // Get processing stats if available
      let processingStats = null;
      if (etlFile.currentState === ETLState.LOADED || etlFile.currentState === ETLState.FAILED) {
        const pipeline02Integration = new Pipeline02StateIntegration({
          organizationId: this.context.organizationId,
          fileId,
          supabaseClient: this.context.supabaseClient,
        });

        processingStats = await pipeline02Integration.getProcessingStats(fileId);
      }

      return {
        fileId,
        state: etlFile.currentState,
        lastUpdated: etlFile.updatedAt,
        processingStats,
        logs,
      };
    } catch (error) {
      console.error('Error getting file status:', error);
      return null;
    }
  }

  /**
   * Retry processing a failed file
   */
  async retryFileProcessing(
    fileId: string,
    filePath: string,
    fileName: string,
    options?: Pipeline02ProcessingOptions
  ): Promise<Pipeline02OrchestratorResult> {
    await this.logStep(fileId, 'RETRY_PROCESSING_START',
      `Starting retry processing for file: ${fileName}`);

    // Reset file state to uploaded for reprocessing
    await this.stateMachineService.transitionFileState(
      fileId,
      ETLState.UPLOADED,
      this.context.userId,
      'Retrying processing - resetting to uploaded state'
    );

    return await this.processFile({
      fileId,
      filePath,
      fileName,
      processingOptions: options,
    });
  }

  /**
   * Get orchestrator health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: Date;
  } {
    return {
      status: 'healthy',
      services: {
        stateMachine: true,
        csvParser: true,
        pipeline02Integration: true,
      },
      timestamp: new Date(),
    };
  }
}