/**
 * UPSERT Service for Pipeline 02 - Desvio de Carregamento
 * Implements idempotent UPSERT logic for fato_desvio_carregamento table
 */
export class UpsertService {
    context;
    constructor(context) {
        this.context = context;
    }
    /**
     * Perform idempotent UPSERT operation on fato_desvio_carregamento
     */
    async upsertDesvioRecord(validatedData, dimensionIds) {
        try {
            const warnings = [];
            const dimensionLookups = {
                curralResolved: true,
                dietaResolved: dimensionIds.dietaId !== null,
                equipamentoResolved: dimensionIds.equipamentoId !== null,
            };
            // Check for pending dimensions
            if (dimensionIds.curralId.startsWith('pending-')) {
                dimensionLookups.curralResolved = false;
                warnings.push('Curral not found - using pending dimension');
            }
            if (dimensionIds.dietaId && dimensionIds.dietaId.startsWith('pending-')) {
                dimensionLookups.dietaResolved = false;
                warnings.push('Dieta not found - using pending dimension');
            }
            if (dimensionIds.equipamentoId && dimensionIds.equipamentoId.startsWith('pending-')) {
                dimensionLookups.equipamentoResolved = false;
                warnings.push('Equipamento not found - using pending dimension');
            }
            // Check if record already exists based on natural_key and organization_id
            const existingRecord = await this.findExistingRecord(validatedData.natural_key, this.context.organizationId);
            if (existingRecord) {
                // Determine if update is needed
                const updateResult = await this.updateRecord(existingRecord, validatedData, dimensionIds);
                return {
                    operation: updateResult.wasUpdated ? 'update' : 'skip',
                    recordId: existingRecord.distrib_id,
                    isSuccess: true,
                    warnings,
                    dimensionLookups,
                };
            }
            else {
                // Insert new record
                const newRecordId = await this.insertRecord(validatedData, dimensionIds);
                return {
                    operation: 'insert',
                    recordId: newRecordId,
                    isSuccess: true,
                    warnings,
                    dimensionLookups,
                };
            }
        }
        catch (error) {
            return {
                operation: 'insert',
                recordId: '',
                isSuccess: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                warnings: [],
                dimensionLookups: {
                    curralResolved: false,
                    dietaResolved: false,
                    equipamentoResolved: false,
                },
            };
        }
    }
    /**
     * Find existing record by natural_key and organization_id
     */
    async findExistingRecord(naturalKey, organizationId) {
        try {
            const { data, error } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .select('*')
                .eq('natural_key', naturalKey)
                .eq('organization_id', organizationId)
                .single();
            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "not found" error, which is expected
                throw error;
            }
            return data || null;
        }
        catch (error) {
            console.error('Error finding existing record:', error);
            return null;
        }
    }
    /**
     * Insert new record into fato_desvio_carregamento
     */
    async insertRecord(validatedData, dimensionIds) {
        const recordId = `distrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const factRecord = {
            distrib_id: recordId,
            organization_id: this.context.organizationId,
            data_ref: validatedData.data_ref.toISOString().split('T')[0], // Convert to date string
            turno: validatedData.turno,
            curral_id: dimensionIds.curralId,
            dieta_id: dimensionIds.dietaId,
            equipamento_id: dimensionIds.equipamentoId,
            kg_planejado: validatedData.kg_planejado,
            kg_real: validatedData.kg_real,
            desvio_kg: validatedData.desvio_kg,
            desvio_pct: validatedData.desvio_pct,
            source_file_id: this.context.fileId,
            natural_key: validatedData.natural_key,
            created_at: new Date(),
        };
        const { error } = await this.context.supabaseClient
            .from('fato_desvio_carregamento')
            .insert(factRecord);
        if (error) {
            throw new Error(`Failed to insert record: ${error.message}`);
        }
        return recordId;
    }
    /**
     * Update existing record if values have changed
     */
    async updateRecord(existingRecord, validatedData, dimensionIds) {
        // Check if any significant values have changed
        const hasChanges = existingRecord.kg_planejado !== validatedData.kg_planejado ||
            existingRecord.kg_real !== validatedData.kg_real ||
            Math.abs(existingRecord.desvio_kg - validatedData.desvio_kg) > 0.01 ||
            Math.abs(existingRecord.desvio_pct - validatedData.desvio_pct) > 0.01 ||
            existingRecord.turno !== validatedData.turno ||
            existingRecord.curral_id !== dimensionIds.curralId ||
            existingRecord.dieta_id !== dimensionIds.dietaId ||
            existingRecord.equipamento_id !== dimensionIds.equipamentoId ||
            existingRecord.source_file_id !== this.context.fileId;
        if (!hasChanges) {
            return { wasUpdated: false };
        }
        // Update the record
        const updates = {
            kg_planejado: validatedData.kg_planejado,
            kg_real: validatedData.kg_real,
            desvio_kg: validatedData.desvio_kg,
            desvio_pct: validatedData.desvio_pct,
            turno: validatedData.turno,
            curral_id: dimensionIds.curralId,
            dieta_id: dimensionIds.dietaId,
            equipamento_id: dimensionIds.equipamentoId,
            source_file_id: this.context.fileId,
            // Note: Don't update natural_key as it's used for identification
        };
        const { error } = await this.context.supabaseClient
            .from('fato_desvio_carregamento')
            .update(updates)
            .eq('distrib_id', existingRecord.distrib_id);
        if (error) {
            throw new Error(`Failed to update record: ${error.message}`);
        }
        return { wasUpdated: true };
    }
    /**
     * Batch UPSERT operation for multiple records
     */
    async batchUpsert(validatedDataList) {
        const results = [];
        const errors = [];
        const summary = {
            total: validatedDataList.length,
            inserted: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            pendingDimensions: 0,
        };
        for (const { data, dimensions } of validatedDataList) {
            try {
                const result = await this.upsertDesvioRecord(data, dimensions);
                results.push(result);
                if (result.isSuccess) {
                    switch (result.operation) {
                        case 'insert':
                            summary.inserted++;
                            break;
                        case 'update':
                            summary.updated++;
                            break;
                        case 'skip':
                            summary.skipped++;
                            break;
                    }
                    // Count pending dimensions
                    if (!result.dimensionLookups.curralResolved ||
                        !result.dimensionLookups.dietaResolved ||
                        !result.dimensionLookups.equipamentoResolved) {
                        summary.pendingDimensions++;
                    }
                }
                else {
                    summary.failed++;
                    if (result.error) {
                        errors.push(`Record ${data.natural_key}: ${result.error}`);
                    }
                }
            }
            catch (error) {
                summary.failed++;
                const errorMsg = `Record ${data.natural_key}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                results.push({
                    operation: 'insert',
                    recordId: '',
                    isSuccess: false,
                    error: errorMsg,
                    warnings: [],
                    dimensionLookups: {
                        curralResolved: false,
                        dietaResolved: false,
                        equipamentoResolved: false,
                    },
                });
            }
        }
        return {
            results,
            summary,
            errors,
        };
    }
    /**
     * Get records by natural keys for verification
     */
    async getRecordsByNaturalKeys(naturalKeys) {
        try {
            const { data, error } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .select('*')
                .eq('organization_id', this.context.organizationId)
                .in('natural_key', naturalKeys);
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Error getting records by natural keys:', error);
            return [];
        }
    }
    /**
     * Count records for an organization
     */
    async getRecordCount(organizationId) {
        try {
            const orgId = organizationId || this.context.organizationId;
            const { count, error } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId);
            if (error) {
                throw error;
            }
            return count || 0;
        }
        catch (error) {
            console.error('Error getting record count:', error);
            return 0;
        }
    }
    /**
     * Get records by file ID for audit purposes
     */
    async getRecordsByFileId(fileId) {
        try {
            const { data, error } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .select('*')
                .eq('organization_id', this.context.organizationId)
                .eq('source_file_id', fileId)
                .order('created_at', { ascending: true });
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('Error getting records by file ID:', error);
            return [];
        }
    }
    /**
     * Delete records by file ID (for reprocessing scenarios)
     */
    async deleteRecordsByFileId(fileId) {
        try {
            const { data, error } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .delete()
                .eq('organization_id', this.context.organizationId)
                .eq('source_file_id', fileId)
                .select('distrib_id');
            if (error) {
                throw error;
            }
            return data ? data.length : 0;
        }
        catch (error) {
            console.error('Error deleting records by file ID:', error);
            return 0;
        }
    }
    /**
     * Verify data integrity for a batch of records
     */
    async verifyBatchIntegrity(naturalKeys) {
        try {
            const foundRecords = await this.getRecordsByNaturalKeys(naturalKeys);
            const foundKeys = new Set(foundRecords.map(r => r.natural_key));
            const missingKeys = naturalKeys.filter(key => !foundKeys.has(key));
            return {
                totalExpected: naturalKeys.length,
                totalFound: foundRecords.length,
                missingKeys,
                isComplete: missingKeys.length === 0,
            };
        }
        catch (error) {
            console.error('Error verifying batch integrity:', error);
            return {
                totalExpected: naturalKeys.length,
                totalFound: 0,
                missingKeys: naturalKeys,
                isComplete: false,
            };
        }
    }
    /**
     * Get processing statistics for monitoring
     */
    async getProcessingStats(fileId) {
        try {
            let query = this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .select('data_ref, kg_planejado, kg_real, desvio_kg, desvio_pct, curral_id, dieta_id, equipamento_id')
                .eq('organization_id', this.context.organizationId);
            if (fileId) {
                query = query.eq('source_file_id', fileId);
            }
            const { data, error } = await query;
            if (error) {
                throw error;
            }
            const records = data || [];
            const stats = {
                totalRecords: records.length,
                recordsByDate: {},
                recordsByEquipamento: {},
                avgDeviationKg: 0,
                avgDeviationPct: 0,
                recordsWithPendingDimensions: 0,
            };
            if (records.length === 0) {
                return stats;
            }
            let totalDeviationKg = 0;
            let totalDeviationPct = 0;
            for (const record of records) {
                // Count by date
                const dateStr = record.data_ref;
                stats.recordsByDate[dateStr] = (stats.recordsByDate[dateStr] || 0) + 1;
                // Count by equipamento (would need join with dim_equipamento for actual name)
                const equipamentoId = record.equipamento_id || 'unknown';
                stats.recordsByEquipamento[equipamentoId] = (stats.recordsByEquipamento[equipamentoId] || 0) + 1;
                // Sum deviations
                totalDeviationKg += record.desvio_kg || 0;
                totalDeviationPct += record.desvio_pct || 0;
                // Count pending dimensions
                if (record.curral_id?.startsWith('pending-') ||
                    record.dieta_id?.startsWith('pending-') ||
                    record.equipamento_id?.startsWith('pending-')) {
                    stats.recordsWithPendingDimensions++;
                }
            }
            stats.avgDeviationKg = Math.round((totalDeviationKg / records.length) * 100) / 100;
            stats.avgDeviationPct = Math.round((totalDeviationPct / records.length) * 100) / 100;
            return stats;
        }
        catch (error) {
            console.error('Error getting processing stats:', error);
            return {
                totalRecords: 0,
                recordsByDate: {},
                recordsByEquipamento: {},
                avgDeviationKg: 0,
                avgDeviationPct: 0,
                recordsWithPendingDimensions: 0,
            };
        }
    }
}
