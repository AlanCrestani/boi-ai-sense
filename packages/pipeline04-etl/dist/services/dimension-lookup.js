/**
 * Dimension Lookup Service for Pipeline 04 ETL
 * Handles lookup and creation of dimension IDs for fact table
 * Creates pending entries for unmapped codes
 */
/**
 * Mock implementation for dimension lookups with pending entry creation
 * In a real implementation, this would query actual dimension tables
 */
export class MockDimensionLookupService {
    curralCache = new Map();
    dietaCache = new Map();
    trateiroCache = new Map();
    pendingEntries = new Map();
    async lookupCurralId(curralCodigo, organizationId) {
        const key = `${organizationId}:${curralCodigo}`;
        if (this.curralCache.has(key)) {
            return this.curralCache.get(key);
        }
        // In real implementation, would query dim_curral table
        // For mock, simulate some existing currals
        const existingCurrals = ['CUR-001', 'CUR-002', 'CUR-003', 'CURRAL-A', 'CURRAL-B'];
        if (existingCurrals.includes(curralCodigo)) {
            const uuid = this.generateDeterministicUuid(`curral-${organizationId}-${curralCodigo}`);
            this.curralCache.set(key, uuid);
            return uuid;
        }
        // Curral not found - this will need pending entry creation
        return null;
    }
    async lookupDietaId(dietaNome, organizationId) {
        if (!dietaNome) {
            return null;
        }
        const key = `${organizationId}:${dietaNome}`;
        if (this.dietaCache.has(key)) {
            return this.dietaCache.get(key);
        }
        // In real implementation, would query dim_dieta table
        // For mock, simulate some existing dietas
        const existingDietas = ['Dieta A', 'Dieta B', 'Dieta C', 'Ração Engorda', 'Ração Mantença'];
        if (existingDietas.includes(dietaNome)) {
            const uuid = this.generateDeterministicUuid(`dieta-${organizationId}-${dietaNome}`);
            this.dietaCache.set(key, uuid);
            return uuid;
        }
        // Dieta not found - this will need pending entry creation
        return null;
    }
    async lookupTrateiroId(trateiro, organizationId) {
        const key = `${organizationId}:${trateiro}`;
        if (this.trateiroCache.has(key)) {
            return this.trateiroCache.get(key);
        }
        // Trateiros are always created automatically (no pending needed)
        const uuid = this.generateDeterministicUuid(`trateiro-${organizationId}-${trateiro}`);
        this.trateiroCache.set(key, uuid);
        return uuid;
    }
    async createPendingCurral(curralCodigo, organizationId) {
        const pendingId = `pending-curral-${Math.random().toString(36).substr(2, 9)}`;
        const pendingEntry = {
            id: pendingId,
            organizationId,
            type: 'curral',
            code: curralCodigo,
            status: 'pending',
            createdAt: new Date(),
        };
        this.pendingEntries.set(pendingId, pendingEntry);
        console.log(`⚠️ Pending curral created: ${curralCodigo} (ID: ${pendingId})`);
        return pendingId;
    }
    async createPendingDieta(dietaNome, organizationId) {
        const pendingId = `pending-dieta-${Math.random().toString(36).substr(2, 9)}`;
        const pendingEntry = {
            id: pendingId,
            organizationId,
            type: 'dieta',
            code: dietaNome,
            status: 'pending',
            createdAt: new Date(),
        };
        this.pendingEntries.set(pendingId, pendingEntry);
        console.log(`⚠️ Pending dieta created: ${dietaNome} (ID: ${pendingId})`);
        return pendingId;
    }
    /**
     * Get all pending entries for an organization
     */
    async getPendingEntries(organizationId) {
        return Array.from(this.pendingEntries.values())
            .filter(entry => entry.organizationId === organizationId);
    }
    /**
     * Resolve a pending entry (mock manual resolution)
     */
    async resolvePendingEntry(pendingId, resolvedId, resolvedBy) {
        const pending = this.pendingEntries.get(pendingId);
        if (pending) {
            pending.status = 'resolved';
            pending.resolvedAt = new Date();
            pending.resolvedBy = resolvedBy;
            // Update cache with resolved ID
            const key = `${pending.organizationId}:${pending.code}`;
            if (pending.type === 'curral') {
                this.curralCache.set(key, resolvedId);
            }
            else if (pending.type === 'dieta') {
                this.dietaCache.set(key, resolvedId);
            }
            console.log(`✅ Pending ${pending.type} resolved: ${pending.code} -> ${resolvedId}`);
        }
    }
    /**
     * Generate deterministic UUID for consistent dimension IDs
     * In production, this would be replaced with actual database lookups
     */
    generateDeterministicUuid(input) {
        // Simple hash to UUID conversion (for testing purposes)
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert hash to hex and pad to create UUID-like format
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        return `${hex.substr(0, 8)}-${hex.substr(0, 4)}-4${hex.substr(1, 3)}-a${hex.substr(0, 3)}-${hex.padEnd(12, '0').substr(0, 12)}`;
    }
}
