/**
 * Tests for Pipeline 04 UPSERT Logic
 * Tests idempotent operations and pending entry handling
 */
import { FactTratoUpsertService } from '../services/upsert-strategy.js';
import { MockDimensionLookupService } from '../services/dimension-lookup.js';
export async function testUpsertLogic() {
    const dimensionService = new MockDimensionLookupService();
    const upsertService = new FactTratoUpsertService(dimensionService);
    // Mock transaction and fact table
    const mockTx = new MockTransaction();
    const mockFactTable = new MockFactTable();
    // Test 1: Insert new record (with existing dimensions)
    const newRecord = {
        data_ref: new Date('2024-12-15'),
        hora: '08:30',
        datetime_trato: new Date('2024-12-15T08:30:00'),
        turno: 'MANHÃ',
        curral_codigo: 'CUR-001', // Existing
        trateiro: 'João Silva',
        dieta_nome: 'Dieta A', // Existing
        tipo_trato: 'RAÇÃO',
        quantidade_kg: 150.5,
        quantidade_cabecas: 25,
        observacoes: 'Trato normal',
        natural_key: 'TEST-ORG_2024-12-15_08:30_CUR-001_JOAO_SILVA_RAÇÃO',
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
        quantidade_kg: 175.0,
        quantidade_cabecas: 30,
        observacoes: 'Trato ajustado',
    };
    const updateResult = await upsertService.upsertSingleRecord(mockTx, updatedRecord, 'test-org-123', 'file-123', mockFactTable);
    if (updateResult.action !== 'updated') {
        throw new Error(`Expected 'updated', got '${updateResult.action}'`);
    }
    // Test 3: Skip unchanged record (run the same record again)
    const skipResult = await upsertService.upsertSingleRecord(mockTx, updatedRecord, // Same record with same data
    'test-org-123', 'file-123', mockFactTable);
    if (skipResult.action !== 'skipped') {
        throw new Error(`Expected 'skipped', got '${skipResult.action}'. Reason: ${skipResult.reason}`);
    }
    if (skipResult.reason !== 'No changes detected') {
        throw new Error(`Expected 'No changes detected', got '${skipResult.reason}'`);
    }
    // Test 4: Pending entry creation for unknown curral
    const unknownCurralRecord = {
        ...newRecord,
        curral_codigo: 'CUR-999', // Non-existing
        natural_key: 'TEST-ORG_2024-12-15_08:30_CUR-999_JOAO_SILVA_RAÇÃO',
    };
    const pendingResult = await upsertService.upsertSingleRecord(mockTx, unknownCurralRecord, 'test-org-123', 'file-123', mockFactTable);
    if (pendingResult.action !== 'pending') {
        throw new Error(`Expected 'pending', got '${pendingResult.action}'`);
    }
    if (!pendingResult.pendingEntries || pendingResult.pendingEntries.length === 0) {
        throw new Error('Pending result should include pending entry IDs');
    }
    // Test 5: Pending entry creation for unknown dieta
    const unknownDietaRecord = {
        ...newRecord,
        dieta_nome: 'Dieta Inexistente', // Non-existing
        natural_key: 'TEST-ORG_2024-12-15_08:30_CUR-001_JOAO_SILVA_RAÇÃO_DIETA_INEXISTENTE',
    };
    const pendingDietaResult = await upsertService.upsertSingleRecord(mockTx, unknownDietaRecord, 'test-org-123', 'file-123', mockFactTable);
    if (pendingDietaResult.action !== 'pending') {
        throw new Error(`Expected 'pending' for unknown dieta, got '${pendingDietaResult.action}'`);
    }
    // Test 6: Dimension lookup consistency
    const trateiroId1 = await dimensionService.lookupTrateiroId('João Silva', 'test-org');
    const trateiroId2 = await dimensionService.lookupTrateiroId('João Silva', 'test-org');
    if (trateiroId1 !== trateiroId2) {
        throw new Error('Dimension lookups should be consistent');
    }
    // Test 7: Different organization should get different dimension IDs
    const trateiroIdDifferentOrg = await dimensionService.lookupTrateiroId('João Silva', 'other-org');
    if (trateiroId1 === trateiroIdDifferentOrg) {
        throw new Error('Different organizations should get different dimension IDs');
    }
    // Test 8: Null dieta handling
    const nullDietaRecord = {
        ...newRecord,
        dieta_nome: null,
        natural_key: 'TEST-ORG_2024-12-15_08:30_CUR-001_JOAO_SILVA_RAÇÃO_NULL',
    };
    const nullDietaResult = await upsertService.upsertSingleRecord(mockTx, nullDietaRecord, 'test-org-123', 'file-123', mockFactTable);
    if (nullDietaResult.action !== 'inserted') {
        throw new Error('Null dieta should allow insertion');
    }
    // Test 9: Batch processing
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
            curral_codigo: 'CURRAL-A',
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
    console.log('   ✓ Pending entry creation for unknown curral');
    console.log('   ✓ Pending entry creation for unknown dieta');
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
                datetimeTrato: data.datetimeTrato,
                hora: data.hora,
                turno: data.turno,
                curralId: data.curralId,
                trateiroId: data.trateiroId,
                dietaId: data.dietaId,
                tipoTrato: data.tipoTrato,
                quantidadeKg: data.quantidadeKg,
                quantidadeCabecas: data.quantidadeCabecas,
                observacoes: data.observacoes,
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
            datetimeTrato: data.datetimeTrato,
            hora: data.hora,
            turno: data.turno,
            curralId: data.curralId,
            trateiroId: data.trateiroId,
            dietaId: data.dietaId,
            tipoTrato: data.tipoTrato,
            quantidadeKg: data.quantidadeKg,
            quantidadeCabecas: data.quantidadeCabecas,
            observacoes: data.observacoes,
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
