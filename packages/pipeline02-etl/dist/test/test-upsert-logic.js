/**
 * Tests for Pipeline 02 UPSERT Logic
 * Tests idempotent operations and dimension lookups
 */
import { FactTableUpsertService } from '../services/upsert-strategy.js';
import { MockDimensionLookupService } from '../services/dimension-lookup.js';
export async function testUpsertLogic() {
    const dimensionService = new MockDimensionLookupService();
    const upsertService = new FactTableUpsertService(dimensionService);
    // Mock transaction and fact table
    const mockTx = new MockTransaction();
    const mockFactTable = new MockFactTable();
    // Test 1: Insert new record
    const newRecord = {
        data_ref: new Date('2024-01-15'),
        turno: 'MANHÃ',
        equipamento: 'BAHMAN',
        curral_codigo: 'CUR-001',
        dieta_nome: 'Dieta A',
        kg_planejado: 1000,
        kg_real: 980,
        desvio_kg: -20,
        desvio_pct: -2,
        natural_key: 'TEST-ORG_2024-01-15_MANHÃ_BAHMAN_CUR-001_DIETA A',
    };
    const insertResult = await upsertService.upsertSingleRecord(mockTx, newRecord, 'test-org-123', 'file-123', mockFactTable);
    if (insertResult.action !== 'inserted') {
        throw new Error(`Expected 'inserted', got '${insertResult.action}'`);
    }
    if (!insertResult.recordId) {
        throw new Error('Insert should return record ID');
    }
    // Test 2: Update existing record (same natural key, different data)
    const updatedRecord = {
        ...newRecord,
        kg_real: 950,
        desvio_kg: -50,
        desvio_pct: -5,
    };
    const updateResult = await upsertService.upsertSingleRecord(mockTx, updatedRecord, 'test-org-123', 'file-123', mockFactTable);
    if (updateResult.action !== 'updated') {
        throw new Error(`Expected 'updated', got '${updateResult.action}'`);
    }
    // Test 3: Skip unchanged record (run the same record again with EXACT same data)
    const skipResult = await upsertService.upsertSingleRecord(mockTx, updatedRecord, // Same record with same data
    'test-org-123', 'file-123', mockFactTable);
    if (skipResult.action !== 'skipped') {
        throw new Error(`Expected 'skipped', got '${skipResult.action}'. Reason: ${skipResult.reason}`);
    }
    if (skipResult.reason !== 'No changes detected') {
        throw new Error(`Expected 'No changes detected', got '${skipResult.reason}'`);
    }
    // Test 4: Dimension lookup consistency
    const curralId1 = await dimensionService.lookupCurralId('CUR-001', 'test-org');
    const curralId2 = await dimensionService.lookupCurralId('CUR-001', 'test-org');
    if (curralId1 !== curralId2) {
        throw new Error('Dimension lookups should be consistent');
    }
    // Test 5: Different organization should get different dimension IDs
    const curralIdDifferentOrg = await dimensionService.lookupCurralId('CUR-001', 'other-org');
    if (curralId1 === curralIdDifferentOrg) {
        throw new Error('Different organizations should get different dimension IDs');
    }
    // Test 6: Null dieta handling
    const nullDietaId = await dimensionService.lookupDietaId(null, 'test-org');
    if (nullDietaId !== null) {
        throw new Error('Null dieta should return null ID');
    }
    // Test 7: Batch processing
    const batchData = [
        {
            ...newRecord,
            natural_key: 'BATCH-TEST-1',
            curral_codigo: 'CUR-002',
        },
        {
            ...newRecord,
            natural_key: 'BATCH-TEST-2',
            curral_codigo: 'CUR-003',
        },
        {
            ...newRecord,
            natural_key: 'BATCH-TEST-3',
            curral_codigo: 'CUR-004',
        },
    ];
    const batchResult = await upsertService.upsertBatch(mockTx, batchData, 'test-org-123', 'file-123', mockFactTable);
    if (batchResult.totalProcessed !== 3) {
        throw new Error(`Expected 3 processed, got ${batchResult.totalProcessed}`);
    }
    if (batchResult.inserted !== 3) {
        throw new Error(`Expected 3 inserted, got ${batchResult.inserted}`);
    }
    if (batchResult.errors.length !== 0) {
        throw new Error(`Expected 0 errors, got ${batchResult.errors.length}`);
    }
    console.log('   ✓ Insert new record');
    console.log('   ✓ Update existing record');
    console.log('   ✓ Skip unchanged record');
    console.log('   ✓ Dimension lookup consistency');
    console.log('   ✓ Organization-specific dimension IDs');
    console.log('   ✓ Null dieta handling');
    console.log('   ✓ Batch processing');
}
/**
 * Mock transaction for testing
 */
class MockTransaction {
    records = new Map();
    // Simplified method for mock testing
    async findRecord(organizationId, naturalKey) {
        const key = `${organizationId}:${naturalKey}`;
        return this.records.get(key) || null;
    }
    async updateRecord(organizationId, naturalKey, data) {
        const key = `${organizationId}:${naturalKey}`;
        const existing = this.records.get(key);
        if (existing) {
            // Store the update with the same field names as the comparison logic expects
            const updatedRecord = {
                ...existing,
                ...data,
                updated_at: new Date(),
                // Ensure all fields use the exact same names as the comparison logic
                dataRef: data.dataRef,
                turno: data.turno,
                curralId: data.curralId,
                dietaId: data.dietaId,
                equipamentoId: data.equipamentoId,
                kgPlanejado: data.kgPlanejado,
                kgReal: data.kgReal,
                desvioKg: data.desvioKg,
                desvioPct: data.desvioPct,
                sourceFileId: data.sourceFileId,
            };
            this.records.set(key, updatedRecord);
        }
    }
    async insertRecord(data) {
        const key = `${data.organizationId}:${data.naturalKey}`;
        const id = `record-${Math.random().toString(36).substr(2, 9)}`;
        // Store with same field names as the comparison logic expects
        const record = {
            ...data,
            id,
            created_at: new Date(),
            // Ensure field names match the comparison logic
            organizationId: data.organizationId,
            naturalKey: data.naturalKey,
            dataRef: data.dataRef,
            turno: data.turno,
            curralId: data.curralId,
            dietaId: data.dietaId,
            equipamentoId: data.equipamentoId,
            kgPlanejado: data.kgPlanejado,
            kgReal: data.kgReal,
            desvioKg: data.desvioKg,
            desvioPct: data.desvioPct,
            sourceFileId: data.sourceFileId,
        };
        this.records.set(key, record);
        return id;
    }
    async execute(_query, params) {
        // Mock PostgreSQL ON CONFLICT response
        return {
            rows: [
                {
                    id: `record-${Math.random().toString(36).substr(2, 9)}`,
                    action: this.records.has(`${params[0]}:${params[1]}`) ? 'updated' : 'inserted',
                },
            ],
        };
    }
}
/**
 * Mock fact table for testing
 */
class MockFactTable {
}
//# sourceMappingURL=test-upsert-logic.js.map