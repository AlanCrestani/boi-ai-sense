/**
 * Dimension Lookup Service for Pipeline 02 ETL
 * Handles lookup and creation of dimension IDs for fact table
 */
export interface DimensionLookupService {
    lookupCurralId(curralCodigo: string, organizationId: string): Promise<string>;
    lookupDietaId(dietaNome: string | null, organizationId: string): Promise<string | null>;
    lookupEquipamentoId(equipamento: string, organizationId: string): Promise<string>;
}
/**
 * Mock implementation for dimension lookups
 * In a real implementation, this would query actual dimension tables
 */
export declare class MockDimensionLookupService implements DimensionLookupService {
    private curralCache;
    private dietaCache;
    private equipamentoCache;
    lookupCurralId(curralCodigo: string, organizationId: string): Promise<string>;
    lookupDietaId(dietaNome: string | null, organizationId: string): Promise<string | null>;
    lookupEquipamentoId(equipamento: string, organizationId: string): Promise<string>;
    /**
     * Generate deterministic UUID for consistent dimension IDs
     * In production, this would be replaced with actual database lookups
     */
    private generateDeterministicUuid;
}
//# sourceMappingURL=dimension-lookup.d.ts.map