/**
 * Referential Integrity Service for Pipeline 04
 * Validates and maps codes to dimension tables with pending entry support
 */
export interface ReferentialCheckResult {
    isValid: boolean;
    mappedDimensions: MappedDimensions;
    pendingEntries: PendingEntry[];
    errors: ReferentialError[];
    warnings: ReferentialWarning[];
}
export interface MappedDimensions {
    curralId: string | null;
    dietaId: string | null;
    trateiroId: string;
    organizationId: string;
}
export interface ReferentialError {
    field: string;
    code: string;
    message: string;
    originalValue: any;
    severity: 'error' | 'warning';
}
export interface ReferentialWarning {
    field: string;
    message: string;
    recommendation: string;
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
export interface DimensionLookupService {
    lookupCurralId(codigo: string, organizationId: string): Promise<string | null>;
    lookupDietaId(nome: string | null, organizationId: string): Promise<string | null>;
    lookupTrateiroId(nome: string, organizationId: string): Promise<string>;
    createPendingCurral(codigo: string, organizationId: string): Promise<string>;
    createPendingDieta(nome: string, organizationId: string): Promise<string>;
    getPendingEntries(organizationId: string): Promise<PendingEntry[]>;
    resolvePendingEntry(pendingId: string, resolvedValue: string, resolvedBy: string): Promise<void>;
}
/**
 * Service for checking referential integrity with dimension tables
 */
export declare class ReferentialIntegrityService {
    private dimensionService;
    constructor(dimensionService: DimensionLookupService);
    /**
     * Check referential integrity for Pipeline 04 feeding treatment data
     */
    checkReferentialIntegrity(data: {
        curral_codigo: string;
        dieta_nome: string | null;
        trateiro: string;
    }, organizationId: string): Promise<ReferentialCheckResult>;
    /**
     * Perform additional business logic checks
     */
    private performAdditionalChecks;
    /**
     * Check if curral code looks suspicious
     */
    private isSuspiciousCurralCode;
    /**
     * Check if trateiro name is potentially a duplicate
     */
    private isPotentiallyDuplicateTrateiro;
    /**
     * Get comprehensive referential integrity report
     */
    getReferentialIntegrityReport(organizationId: string): Promise<{
        pendingEntries: PendingEntry[];
        summary: {
            totalPending: number;
            pendingCurrals: number;
            pendingDietas: number;
            oldestPending?: Date;
        };
    }>;
    /**
     * Batch check referential integrity for multiple records
     */
    batchCheckReferentialIntegrity(records: Array<{
        curral_codigo: string;
        dieta_nome: string | null;
        trateiro: string;
    }>, organizationId: string): Promise<{
        results: ReferentialCheckResult[];
        summary: {
            totalRecords: number;
            validRecords: number;
            recordsWithPendingEntries: number;
            totalPendingEntries: number;
        };
    }>;
}
