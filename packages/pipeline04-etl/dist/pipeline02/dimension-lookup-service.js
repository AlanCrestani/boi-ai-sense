/**
 * Dimension Lookup Service for Pipeline 02 - Desvio de Carregamento
 * Handles dimension lookups for curral, dieta, and equipamento tables
 */
export class DimensionLookupService {
    context;
    constructor(context) {
        this.context = context;
    }
    /**
     * Lookup all dimensions for a desvio carregamento record
     */
    async lookupDimensions(curralCodigo, equipamento, dietaNome) {
        const warnings = [];
        const pendingCreations = {};
        // Lookup curral (required)
        const curralId = await this.lookupCurral(curralCodigo);
        if (curralId.startsWith('pending-')) {
            pendingCreations.curral = curralCodigo;
            warnings.push(`Curral not found: ${curralCodigo} - created pending entry`);
        }
        // Lookup equipamento
        const equipamentoId = await this.lookupEquipamento(equipamento);
        if (equipamentoId && equipamentoId.startsWith('pending-')) {
            pendingCreations.equipamento = equipamento;
            warnings.push(`Equipamento not found: ${equipamento} - created pending entry`);
        }
        // Lookup dieta (optional)
        let dietaId = null;
        if (dietaNome && dietaNome.trim() !== '') {
            dietaId = await this.lookupDieta(dietaNome);
            if (dietaId && dietaId.startsWith('pending-')) {
                pendingCreations.dieta = dietaNome;
                warnings.push(`Dieta not found: ${dietaNome} - created pending entry`);
            }
        }
        return {
            curralId,
            dietaId,
            equipamentoId,
            pendingCreations,
            warnings,
        };
    }
    /**
     * Lookup curral by codigo
     */
    async lookupCurral(codigo) {
        try {
            // Try to find existing curral
            const { data: existing } = await this.context.supabaseClient
                .from('dim_curral')
                .select('curral_id')
                .eq('organization_id', this.context.organizationId)
                .eq('codigo', codigo)
                .eq('is_active', true)
                .single();
            if (existing) {
                return existing.curral_id;
            }
            // Create pending curral entry
            return await this.createPendingCurral(codigo);
        }
        catch (error) {
            console.error('Error looking up curral:', error);
            return await this.createPendingCurral(codigo);
        }
    }
    /**
     * Lookup dieta by nome
     */
    async lookupDieta(nome) {
        try {
            // Try to find existing dieta
            const { data: existing } = await this.context.supabaseClient
                .from('dim_dieta')
                .select('dieta_id')
                .eq('organization_id', this.context.organizationId)
                .eq('nome', nome)
                .eq('is_active', true)
                .single();
            if (existing) {
                return existing.dieta_id;
            }
            // Create pending dieta entry
            return await this.createPendingDieta(nome);
        }
        catch (error) {
            console.error('Error looking up dieta:', error);
            return await this.createPendingDieta(nome);
        }
    }
    /**
     * Lookup equipamento by nome/tipo
     */
    async lookupEquipamento(equipamento) {
        try {
            // Try to find existing equipamento by nome or tipo
            const { data: existing } = await this.context.supabaseClient
                .from('dim_equipamento')
                .select('equipamento_id')
                .eq('organization_id', this.context.organizationId)
                .or(`nome.eq.${equipamento},tipo.eq.${equipamento}`)
                .eq('is_active', true)
                .single();
            if (existing) {
                return existing.equipamento_id;
            }
            // Create pending equipamento entry
            return await this.createPendingEquipamento(equipamento);
        }
        catch (error) {
            console.error('Error looking up equipamento:', error);
            return await this.createPendingEquipamento(equipamento);
        }
    }
    /**
     * Create pending curral entry
     */
    async createPendingCurral(codigo) {
        const pendingId = `pending-curral-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const curralData = {
            curral_id: pendingId,
            organization_id: this.context.organizationId,
            codigo,
            nome: `Curral ${codigo} (Pendente)`,
            capacidade: null,
            setor: null,
            is_active: false, // Mark as inactive until resolved
            created_at: new Date(),
            updated_at: new Date(),
        };
        try {
            await this.context.supabaseClient
                .from('dim_curral')
                .insert(curralData);
            console.warn(`⚠️ Pending curral created: ${codigo} (ID: ${pendingId})`);
            return pendingId;
        }
        catch (error) {
            console.error('Error creating pending curral:', error);
            return pendingId; // Return the ID even if creation failed
        }
    }
    /**
     * Create pending dieta entry
     */
    async createPendingDieta(nome) {
        const pendingId = `pending-dieta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dietaData = {
            dieta_id: pendingId,
            organization_id: this.context.organizationId,
            nome,
            descricao: `Dieta ${nome} (Pendente)`,
            categoria: null,
            is_active: false, // Mark as inactive until resolved
            created_at: new Date(),
            updated_at: new Date(),
        };
        try {
            await this.context.supabaseClient
                .from('dim_dieta')
                .insert(dietaData);
            console.warn(`⚠️ Pending dieta created: ${nome} (ID: ${pendingId})`);
            return pendingId;
        }
        catch (error) {
            console.error('Error creating pending dieta:', error);
            return pendingId; // Return the ID even if creation failed
        }
    }
    /**
     * Create pending equipamento entry
     */
    async createPendingEquipamento(equipamento) {
        const pendingId = `pending-equipamento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const equipamentoData = {
            equipamento_id: pendingId,
            organization_id: this.context.organizationId,
            codigo: equipamento,
            nome: `Equipamento ${equipamento} (Pendente)`,
            tipo: equipamento,
            modelo: null,
            capacidade: null,
            is_active: false, // Mark as inactive until resolved
            created_at: new Date(),
            updated_at: new Date(),
        };
        try {
            await this.context.supabaseClient
                .from('dim_equipamento')
                .insert(equipamentoData);
            console.warn(`⚠️ Pending equipamento created: ${equipamento} (ID: ${pendingId})`);
            return pendingId;
        }
        catch (error) {
            console.error('Error creating pending equipamento:', error);
            return pendingId; // Return the ID even if creation failed
        }
    }
    /**
     * Get all pending dimensions for resolution
     */
    async getPendingDimensions() {
        try {
            const [curraisResult, dietasResult, equipamentosResult] = await Promise.all([
                this.context.supabaseClient
                    .from('dim_curral')
                    .select('*')
                    .eq('organization_id', this.context.organizationId)
                    .eq('is_active', false)
                    .like('curral_id', 'pending-%'),
                this.context.supabaseClient
                    .from('dim_dieta')
                    .select('*')
                    .eq('organization_id', this.context.organizationId)
                    .eq('is_active', false)
                    .like('dieta_id', 'pending-%'),
                this.context.supabaseClient
                    .from('dim_equipamento')
                    .select('*')
                    .eq('organization_id', this.context.organizationId)
                    .eq('is_active', false)
                    .like('equipamento_id', 'pending-%'),
            ]);
            return {
                currais: curraisResult.data || [],
                dietas: dietasResult.data || [],
                equipamentos: equipamentosResult.data || [],
            };
        }
        catch (error) {
            console.error('Error getting pending dimensions:', error);
            return {
                currais: [],
                dietas: [],
                equipamentos: [],
            };
        }
    }
    /**
     * Resolve pending dimension to active dimension
     */
    async resolvePendingDimension(type, pendingId, resolvedId) {
        try {
            const tableName = `dim_${type}`;
            const idField = `${type}_id`;
            // Update the pending dimension to point to resolved dimension
            const { error: updateError } = await this.context.supabaseClient
                .from(tableName)
                .update({
                [idField]: resolvedId,
                is_active: true,
                updated_at: new Date(),
            })
                .eq(idField, pendingId)
                .eq('organization_id', this.context.organizationId);
            if (updateError) {
                return { success: false, error: updateError.message };
            }
            // Update fact table references
            const { error: factUpdateError } = await this.context.supabaseClient
                .from('fato_desvio_carregamento')
                .update({ [idField]: resolvedId })
                .eq(idField, pendingId)
                .eq('organization_id', this.context.organizationId);
            if (factUpdateError) {
                console.warn(`Warning: Could not update fact table references: ${factUpdateError.message}`);
            }
            console.log(`✅ Pending ${type} resolved: ${pendingId} -> ${resolvedId}`);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get dimension lookup statistics
     */
    async getDimensionStats() {
        try {
            const [curraisStats, dietasStats, equipamentosStats] = await Promise.all([
                this.getDimensionStatsForTable('dim_curral', 'curral_id'),
                this.getDimensionStatsForTable('dim_dieta', 'dieta_id'),
                this.getDimensionStatsForTable('dim_equipamento', 'equipamento_id'),
            ]);
            return {
                currais: curraisStats,
                dietas: dietasStats,
                equipamentos: equipamentosStats,
            };
        }
        catch (error) {
            console.error('Error getting dimension stats:', error);
            return {
                currais: { total: 0, active: 0, pending: 0 },
                dietas: { total: 0, active: 0, pending: 0 },
                equipamentos: { total: 0, active: 0, pending: 0 },
            };
        }
    }
    /**
     * Get stats for a specific dimension table
     */
    async getDimensionStatsForTable(tableName, idField) {
        try {
            const { data, error } = await this.context.supabaseClient
                .from(tableName)
                .select(`${idField}, is_active`)
                .eq('organization_id', this.context.organizationId);
            if (error) {
                throw error;
            }
            const total = data?.length || 0;
            const active = data?.filter((d) => d.is_active).length || 0;
            const pending = data?.filter((d) => !d.is_active && d[idField].startsWith('pending-')).length || 0;
            return { total, active, pending };
        }
        catch (error) {
            console.error(`Error getting stats for ${tableName}:`, error);
            return { total: 0, active: 0, pending: 0 };
        }
    }
    /**
     * Batch lookup dimensions for multiple records
     */
    async batchLookupDimensions(records) {
        const results = [];
        for (const record of records) {
            const result = await this.lookupDimensions(record.curralCodigo, record.equipamento, record.dietaNome);
            results.push(result);
        }
        return results;
    }
}
