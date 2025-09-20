/**
 * Dimension Lookup Service for Pipeline 02 - Desvio de Carregamento
 * Handles dimension lookups for curral, dieta, and equipamento tables
 */
export interface DimensionLookupContext {
    organizationId: string;
    supabaseClient: any;
}
export interface CurralDimension {
    curral_id: string;
    codigo: string;
    nome?: string;
    capacidade?: string;
    setor?: string;
    is_active: boolean;
}
export interface DietaDimension {
    dieta_id: string;
    nome: string;
    descricao?: string;
    categoria?: string;
    is_active: boolean;
}
export interface EquipamentoDimension {
    equipamento_id: string;
    codigo: string;
    nome?: string;
    tipo?: string;
    modelo?: string;
    capacidade?: string;
    is_active: boolean;
}
export interface DimensionLookupResult {
    curralId: string;
    dietaId: string | null;
    equipamentoId: string | null;
    pendingCreations: {
        curral?: string;
        dieta?: string;
        equipamento?: string;
    };
    warnings: string[];
}
export declare class DimensionLookupService {
    private context;
    constructor(context: DimensionLookupContext);
    /**
     * Lookup all dimensions for a desvio carregamento record
     */
    lookupDimensions(curralCodigo: string, equipamento: string, dietaNome?: string | null): Promise<DimensionLookupResult>;
    /**
     * Lookup curral by codigo
     */
    lookupCurral(codigo: string): Promise<string>;
    /**
     * Lookup dieta by nome
     */
    lookupDieta(nome: string): Promise<string | null>;
    /**
     * Lookup equipamento by nome/tipo
     */
    lookupEquipamento(equipamento: string): Promise<string | null>;
    /**
     * Create pending curral entry
     */
    private createPendingCurral;
    /**
     * Create pending dieta entry
     */
    private createPendingDieta;
    /**
     * Create pending equipamento entry
     */
    private createPendingEquipamento;
    /**
     * Get all pending dimensions for resolution
     */
    getPendingDimensions(): Promise<{
        currais: CurralDimension[];
        dietas: DietaDimension[];
        equipamentos: EquipamentoDimension[];
    }>;
    /**
     * Resolve pending dimension to active dimension
     */
    resolvePendingDimension(type: 'curral' | 'dieta' | 'equipamento', pendingId: string, resolvedId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get dimension lookup statistics
     */
    getDimensionStats(): Promise<{
        currais: {
            total: number;
            active: number;
            pending: number;
        };
        dietas: {
            total: number;
            active: number;
            pending: number;
        };
        equipamentos: {
            total: number;
            active: number;
            pending: number;
        };
    }>;
    /**
     * Get stats for a specific dimension table
     */
    private getDimensionStatsForTable;
    /**
     * Batch lookup dimensions for multiple records
     */
    batchLookupDimensions(records: Array<{
        curralCodigo: string;
        equipamento: string;
        dietaNome?: string | null;
    }>): Promise<DimensionLookupResult[]>;
}
