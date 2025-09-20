/**
 * Dimension Lookup Service for Pipeline 04 ETL
 * Handles lookup and creation of dimension IDs for fact table
 * Creates pending entries for unmapped codes
 */
export interface DimensionLookupService {
    lookupCurralId(curralCodigo: string, organizationId: string): Promise<string | null>;
    lookupDietaId(dietaNome: string | null, organizationId: string): Promise<string | null>;
    lookupTrateiroId(trateiro: string, organizationId: string): Promise<string>;
    createPendingCurral(curralCodigo: string, organizationId: string): Promise<string>;
    createPendingDieta(dietaNome: string, organizationId: string): Promise<string>;
    getPendingEntries(organizationId: string): Promise<PendingEntry[]>;
    resolvePendingEntry(pendingId: string, resolvedValue: string, resolvedBy: string): Promise<void>;
}
export interface PendingEntry {
    id: string;
    type: 'curral' | 'dieta';
    code: string;
    organizationId: string;
    status: 'pending' | 'resolved' | 'rejected';
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolvedValue?: string;
    notes?: string;
}
/**
 * Mock implementation for dimension lookups with pending entry creation
 * In a real implementation, this would query actual dimension tables
 */
export declare class MockDimensionLookupService implements DimensionLookupService {
    private curralCache;
    private dietaCache;
    private trateiroCache;
    private pendingEntries;
    lookupCurralId(curralCodigo: string, organizationId: string): Promise<string | null>;
    lookupDietaId(dietaNome: string | null, organizationId: string): Promise<string | null>;
    lookupTrateiroId(trateiro: string, organizationId: string): Promise<string>;
    createPendingCurral(curralCodigo: string, organizationId: string): Promise<string>;
    createPendingDieta(dietaNome: string, organizationId: string): Promise<string>;
    /**
     * Get all pending entries for an organization
     */
    getPendingEntries(organizationId: string): Promise<PendingEntry[]>;
    /**
     * Resolve a pending entry (mock manual resolution)
     */
    resolvePendingEntry(pendingId: string, resolvedId: string, resolvedBy: string): Promise<void>;
    /**
     * Generate deterministic UUID for consistent dimension IDs
     * In production, this would be replaced with actual database lookups
     */
    private generateDeterministicUuid;
}
