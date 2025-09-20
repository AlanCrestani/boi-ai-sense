/**
 * Pipeline 02 State Machine Integration
 * Integrates Pipeline 02 (Desvio de Carregamento) with ETL State Machine
 */
import { ETLStateMachineService } from '../state-machine/state-machine-service.js';
import { ETLState } from '../state-machine/types.js';
import { DataValidationService } from './data-validation-service.js';
import { DimensionLookupService } from './dimension-lookup-service.js';
import { UpsertService } from './upsert-service.js';
export class Pipeline02StateIntegration {
    stateMachineService;
    dataValidationService;
    dimensionLookupService;
    upsertService;
    constructor(context) {
        this.stateMachineService = new ETLStateMachineService(context.supabaseClient);
        // Initialize Pipeline 02 services
        this.dataValidationService = new DataValidationService();
        this.dimensionLookupService = new DimensionLookupService({
            organizationId: context.organizationId,
            supabaseClient: context.supabaseClient,
        });
        this.upsertService = new UpsertService({
            organizationId: context.organizationId,
            fileId: context.fileId,
            runId: context.runId,
            supabaseClient: context.supabaseClient,
        });
    }
    /**
     * Process CSV file through complete Pipeline 02 workflow with state management
     */
    async processFile(rawData, context, options = {}) {
        const { skipValidation = false, autoApproveDimensions = false, maxRecordsPerBatch = 100, retryFailedRecords = true, } = options;
        const result = {
            success: false,
            state: ETLState.PARSING,
            processedRecords: 0,
            failedRecords: 0,
            warnings: [],
            errors: [],
            dimensionStats: {
                pendingDimensions: 0,
                resolvedDimensions: 0,
            },
        };
        try {
            // Transition to PARSING state
            await this.transitionState(context, ETLState.UPLOADED, ETLState.PARSING, 'Starting Pipeline 02 processing');
            // Step 1: Parse data (already done by caller, just transition state)
            await this.transitionState(context, ETLState.PARSING, ETLState.PARSED, `Parsed ${rawData.length} records`);
            result.state = ETLState.PARSED;
            // Step 2: Data Validation
            if (!skipValidation) {
                await this.transitionState(context, ETLState.PARSED, ETLState.VALIDATING, 'Starting data validation');
                result.state = ETLState.VALIDATING;
                const validationResults = await this.validateData(rawData, context);
                if (validationResults.hasErrors) {
                    result.errors = validationResults.errors.map(e => e.message);
                    await this.transitionState(context, ETLState.VALIDATING, ETLState.FAILED, `Validation failed: ${result.errors.length} errors`);
                    result.state = ETLState.FAILED;
                    return result;
                }
                result.warnings = validationResults.warnings.map(w => w.message);
                await this.transitionState(context, ETLState.VALIDATING, ETLState.VALIDATED, `Validation complete: ${validationResults.validRecords.length} valid records`);
                result.state = ETLState.VALIDATED;
            }
            // Step 3: Dimension Lookup and UPSERT Operations
            await this.transitionState(context, result.state, ETLState.LOADING, 'Starting data loading');
            result.state = ETLState.LOADING;
            const loadingResult = await this.loadData(rawData, {
                maxRecordsPerBatch,
                autoApproveDimensions,
                retryFailedRecords,
            });
            result.batchResult = loadingResult.batchResult;
            result.processedRecords = loadingResult.processedRecords;
            result.failedRecords = loadingResult.failedRecords;
            result.dimensionStats = loadingResult.dimensionStats;
            result.warnings.push(...loadingResult.warnings);
            if (loadingResult.success) {
                await this.transitionState(context, ETLState.LOADING, ETLState.LOADED, `Loading complete: ${result.processedRecords} processed, ${result.failedRecords} failed`);
                result.state = ETLState.LOADED;
                result.success = true;
            }
            else {
                result.errors.push(...loadingResult.errors);
                await this.transitionState(context, ETLState.LOADING, ETLState.FAILED, `Loading failed: ${loadingResult.errors.join(', ')}`);
                result.state = ETLState.FAILED;
            }
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            await this.transitionState(context, result.state, ETLState.FAILED, `Processing failed: ${result.errors.join(', ')}`);
            result.state = ETLState.FAILED;
        }
        return result;
    }
    /**
     * Validate data using Pipeline 02 validation service
     */
    async validateData(rawData, context) {
        const errors = [];
        const warnings = [];
        const validRecords = [];
        for (const record of rawData) {
            try {
                const validationContext = {
                    organizationId: context.organizationId,
                    fileId: context.fileId,
                    runId: context.runId,
                    processingDate: new Date(),
                };
                const validationResult = await this.dataValidationService.validateDesvioData(record, validationContext);
                if (validationResult.isValid) {
                    validRecords.push(validationResult.cleanedData);
                    warnings.push(...validationResult.warnings.map(w => ({ message: w.message, record })));
                }
                else {
                    errors.push(...validationResult.errors.map(e => ({ message: e.message, record })));
                }
            }
            catch (error) {
                errors.push({
                    message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    record
                });
            }
        }
        return {
            hasErrors: errors.length > 0,
            validRecords,
            errors,
            warnings,
        };
    }
    /**
     * Load data using Pipeline 02 dimension lookup and UPSERT services
     */
    async loadData(rawData, options) {
        const warnings = [];
        const errors = [];
        let processedRecords = 0;
        let failedRecords = 0;
        let pendingDimensions = 0;
        let resolvedDimensions = 0;
        try {
            // Prepare data for UPSERT (validate + dimension lookup)
            const preparedData = [];
            for (const record of rawData) {
                try {
                    // Validate record
                    const validationContext = {
                        organizationId: this.upsertService['context'].organizationId,
                        fileId: this.upsertService['context'].fileId,
                        runId: this.upsertService['context'].runId,
                        processingDate: new Date(),
                    };
                    const validationResult = await this.dataValidationService.validateDesvioData(record, validationContext);
                    if (!validationResult.isValid) {
                        failedRecords++;
                        errors.push(`Validation failed for record: ${validationResult.errors.map(e => e.message).join(', ')}`);
                        continue;
                    }
                    // Lookup dimensions
                    const dimensionResult = await this.dimensionLookupService.lookupDimensions(record.curralCodigo || record.curral, record.equipamento, record.dietaNome || record.dieta);
                    // Track dimension statistics
                    if (dimensionResult.pendingCreations.curral)
                        pendingDimensions++;
                    if (dimensionResult.pendingCreations.dieta)
                        pendingDimensions++;
                    if (dimensionResult.pendingCreations.equipamento)
                        pendingDimensions++;
                    if (dimensionResult.curralId && !dimensionResult.curralId.startsWith('pending-'))
                        resolvedDimensions++;
                    if (dimensionResult.dietaId && !dimensionResult.dietaId.startsWith('pending-'))
                        resolvedDimensions++;
                    if (dimensionResult.equipamentoId && !dimensionResult.equipamentoId.startsWith('pending-'))
                        resolvedDimensions++;
                    warnings.push(...dimensionResult.warnings);
                    preparedData.push({
                        data: validationResult.cleanedData,
                        dimensions: {
                            curralId: dimensionResult.curralId,
                            dietaId: dimensionResult.dietaId,
                            equipamentoId: dimensionResult.equipamentoId,
                        },
                    });
                }
                catch (error) {
                    failedRecords++;
                    errors.push(`Error preparing record: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            // Perform batch UPSERT
            const batchResult = await this.upsertService.batchUpsert(preparedData);
            processedRecords = batchResult.summary.inserted + batchResult.summary.updated + batchResult.summary.skipped;
            failedRecords += batchResult.summary.failed;
            errors.push(...batchResult.errors);
            return {
                success: batchResult.summary.failed === 0,
                processedRecords,
                failedRecords,
                warnings,
                errors,
                dimensionStats: {
                    pendingDimensions,
                    resolvedDimensions,
                },
                batchResult,
            };
        }
        catch (error) {
            errors.push(`Batch loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                processedRecords,
                failedRecords: rawData.length,
                warnings,
                errors,
                dimensionStats: {
                    pendingDimensions,
                    resolvedDimensions,
                },
            };
        }
    }
    /**
     * Helper method to transition states with logging
     */
    async transitionState(context, fromState, toState, message) {
        const request = {
            fileId: context.fileId,
            runId: context.runId,
            fromState,
            toState,
            userId: context.userId,
            message,
            metadata: {
                pipeline: 'pipeline02',
                service: 'desvio_carregamento',
            },
        };
        const result = await this.stateMachineService.transitionFileState(context.fileId, toState, context.userId, message);
        if (!result.success) {
            throw new Error(`State transition failed: ${result.error}`);
        }
        console.log(`🔄 Pipeline 02 state transition: ${fromState} → ${toState} - ${message}`);
    }
    /**
     * Get current ETL file state
     */
    async getCurrentState(fileId) {
        try {
            const file = await this.stateMachineService.getETLFile(fileId);
            return file ? file.currentState : null;
        }
        catch (error) {
            console.error('Error getting current state:', error);
            return null;
        }
    }
    /**
     * Get processing statistics for a file
     */
    async getProcessingStats(fileId) {
        try {
            const file = await this.stateMachineService.getETLFile(fileId);
            if (!file) {
                return null;
            }
            const stats = await this.upsertService.getProcessingStats(fileId);
            const dimensionStats = await this.dimensionLookupService.getDimensionStats();
            return {
                totalRecords: stats.totalRecords,
                processedRecords: stats.totalRecords,
                failedRecords: 0, // Would need to track this separately
                pendingDimensions: dimensionStats.currais.pending + dimensionStats.dietas.pending + dimensionStats.equipamentos.pending,
                state: file.currentState,
                stateHistory: file.stateHistory,
            };
        }
        catch (error) {
            console.error('Error getting processing stats:', error);
            return null;
        }
    }
    /**
     * Retry failed processing from a specific state
     */
    async retryProcessing(fileId, fromState, rawData, options = {}) {
        const context = {
            organizationId: this.upsertService['context'].organizationId,
            fileId,
            supabaseClient: this.upsertService['context'].supabaseClient,
        };
        // Reset state to the retry point
        await this.transitionState(context, fromState, ETLState.PARSING, 'Retrying processing');
        return await this.processFile(rawData, context, options);
    }
}
