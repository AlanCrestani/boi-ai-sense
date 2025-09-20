/**
 * Tests for UPSERT Service - Pipeline 02
 */

import {
  UpsertService,
  DimensionLookupService,
  DataValidationService,
  DesvioCarregamentoData,
  DimensionIds,
  UpsertContext,
  DimensionLookupContext,
  ValidationContext,
  RawDesvioData,
} from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mock Supabase client for testing
const createMockSupabaseClient = () => {
  let mockFactRecords: any[] = [];
  let mockDimensions: any = {
    dim_curral: [],
    dim_dieta: [],
    dim_equipamento: [],
  };

  return {
    from: (tableName: string) => ({
      select: (fields: string = '*') => {
        const chainable = {
          eq: (field: string, value: any) => {
            const filteredRecords = tableName === 'fato_desvio_carregamento'
              ? mockFactRecords.filter((r: any) => r[field] === value)
              : (mockDimensions[tableName] || []).filter((r: any) => r[field] === value);

            return {
              eq: (field2: string, value2: any) => {
                const doubleFiltered = filteredRecords.filter((r: any) => r[field2] === value2);
                return {
                  eq: (field3: string, value3: any) => {
                    const tripleFiltered = doubleFiltered.filter((r: any) => r[field3] === value3);
                    return {
                      like: (field4: string, pattern: string) => ({
                        data: tripleFiltered.filter((r: any) =>
                          r[field4] && r[field4].toString().includes(pattern.replace('%', ''))
                        ),
                        error: null,
                        then: (resolve: any) => resolve({
                          data: tripleFiltered.filter((r: any) =>
                            r[field4] && r[field4].toString().includes(pattern.replace('%', ''))
                          ),
                          error: null
                        }),
                      }),
                      single: async () => {
                        const record = tripleFiltered[0];
                        return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
                      },
                      data: tripleFiltered,
                      error: null,
                      then: (resolve: any) => resolve({ data: tripleFiltered, error: null }),
                    };
                  },
                  like: (field3: string, pattern: string) => {
                    const likeFiltered = doubleFiltered.filter((r: any) =>
                      r[field3] && r[field3].toString().includes(pattern.replace('%', ''))
                    );
                    return {
                      data: likeFiltered,
                      error: null,
                      then: (resolve: any) => resolve({ data: likeFiltered, error: null }),
                    };
                  },
                  single: async () => {
                    const record = doubleFiltered[0];
                    return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
                  },
                  data: doubleFiltered,
                  error: null,
                };
              },
              or: (condition: string) => ({
                eq: (field3: string, value3: any) => ({
                  single: async () => {
                    // Parse the OR condition (e.g., "nome.eq.value,tipo.eq.value")
                    const orParts = condition.split(',');
                    const record = filteredRecords.find((r: any) => {
                      return orParts.some(part => {
                        const [fieldPath, op, val] = part.split('.');
                        return r[fieldPath] === val;
                      }) && r[field3] === value3;
                    });
                    return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
                  },
                  data: filteredRecords.filter((r: any) => {
                    const orParts = condition.split(',');
                    return orParts.some(part => {
                      const [fieldPath, op, val] = part.split('.');
                      return r[fieldPath] === val;
                    }) && r[field3] === value3;
                  }),
                  error: null,
                }),
              }),
              single: async () => {
                const record = filteredRecords[0];
                return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
              },
              order: () => ({
                data: filteredRecords,
                error: null,
              }),
              in: (field2: string, values: any[]) => ({
                data: filteredRecords.filter((r: any) => values.includes(r[field2])),
                error: null,
              }),
              // Make it awaitable for direct promise resolution
              data: filteredRecords,
              error: null,
              then: (resolve: any) => resolve({ data: filteredRecords, error: null }),
            };
          },
          in: (field: string, values: any[]) => ({
            data: mockFactRecords.filter((r: any) => values.includes(r[field])),
            error: null,
          }),
          or: (condition: string) => ({
            eq: (field2: string, value2: any) => ({
              single: async () => {
                const records = mockDimensions[tableName] || [];
                const record = records.find((r: any) => r[field2] === value2);
                return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
              },
            }),
          }),
          like: (field: string, pattern: string) => {
            const allRecords = tableName === 'fato_desvio_carregamento' ? mockFactRecords : (mockDimensions[tableName] || []);
            const filtered = allRecords.filter((r: any) =>
              r[field] && r[field].toString().includes(pattern.replace('%', ''))
            );
            return {
              data: filtered,
              error: null,
              then: (resolve: any) => resolve({ data: filtered, error: null }),
            };
          },
        };

        // For simple calls without chaining - make them awaitable
        if (tableName === 'fato_desvio_carregamento') {
          Object.assign(chainable, {
            data: mockFactRecords,
            error: null,
            // Make the object awaitable for direct promise resolution
            then: (resolve: any) => resolve({ data: mockFactRecords, error: null }),
          });
        } else if (tableName.startsWith('dim_')) {
          Object.assign(chainable, {
            data: mockDimensions[tableName] || [],
            error: null,
            // Make the object awaitable for direct promise resolution
            then: (resolve: any) => resolve({ data: mockDimensions[tableName] || [], error: null }),
          });
        }

        return chainable;
      },
      insert: async (data: any) => {
        if (tableName === 'fato_desvio_carregamento') {
          mockFactRecords.push(data);
        } else if (tableName.startsWith('dim_')) {
          if (!mockDimensions[tableName]) {
            mockDimensions[tableName] = [];
          }
          mockDimensions[tableName].push(data);
        }
        return { data, error: null };
      },
      update: (updates: any) => ({
        eq: (field: string, value: any) => ({
          eq: async (field2: string, value2: any) => {
            if (tableName === 'fato_desvio_carregamento') {
              const recordIndex = mockFactRecords.findIndex(r => r[field] === value && r[field2] === value2);
              if (recordIndex >= 0) {
                mockFactRecords[recordIndex] = { ...mockFactRecords[recordIndex], ...updates };
              }
            } else if (tableName.startsWith('dim_')) {
              const records = mockDimensions[tableName] || [];
              const recordIndex = records.findIndex((r: any) => r[field] === value && r[field2] === value2);
              if (recordIndex >= 0) {
                records[recordIndex] = { ...records[recordIndex], ...updates };
              }
            }
            return { error: null };
          },
          // Support single eq for backward compatibility
          then: async (resolve: any) => {
            if (tableName === 'fato_desvio_carregamento') {
              const recordIndex = mockFactRecords.findIndex(r => r[field] === value);
              if (recordIndex >= 0) {
                mockFactRecords[recordIndex] = { ...mockFactRecords[recordIndex], ...updates };
              }
            } else if (tableName.startsWith('dim_')) {
              const records = mockDimensions[tableName] || [];
              const recordIndex = records.findIndex((r: any) => r[field] === value);
              if (recordIndex >= 0) {
                records[recordIndex] = { ...records[recordIndex], ...updates };
              }
            }
            resolve({ error: null });
          },
        }),
      }),
      delete: () => ({
        eq: (field: string, value: any) => ({
          eq: (field2: string, value2: any) => ({
            select: async (fields: string) => {
              if (tableName === 'fato_desvio_carregamento') {
                const toDelete = mockFactRecords.filter(r => r[field] === value && r[field2] === value2);
                mockFactRecords = mockFactRecords.filter(r => !(r[field] === value && r[field2] === value2));
                return { data: toDelete, error: null };
              }
              return { data: [], error: null };
            },
          }),
          select: async (fields: string) => {
            if (tableName === 'fato_desvio_carregamento') {
              const toDelete = mockFactRecords.filter(r => r[field] === value);
              mockFactRecords = mockFactRecords.filter(r => r[field] !== value);
              return { data: toDelete, error: null };
            }
            return { data: [], error: null };
          },
        }),
      }),
    }),
    mockReset: () => {
      mockFactRecords = [];
      mockDimensions = {
        dim_curral: [],
        dim_dieta: [],
        dim_equipamento: [],
      };
    },
    mockAddDimensions: (dimensions: any) => {
      mockDimensions = { ...mockDimensions, ...dimensions };
    },
    mockGetFactRecords: () => mockFactRecords,
    mockGetDimensions: () => mockDimensions,
  };
};

function createTestData(): {
  validatedData: DesvioCarregamentoData;
  dimensionIds: DimensionIds;
  rawData: RawDesvioData;
} {
  const rawData: RawDesvioData = {
    data: '2024-01-15',
    turno: 'MANHA',
    equipamento: 'BAHMAN',
    curral: 'C001',
    dieta: 'Dieta Engorda',
    kg_planejado: 1500,
    kg_real: 1450,
  };

  const validatedData: DesvioCarregamentoData = {
    data_ref: new Date('2024-01-15'),
    turno: 'MANHA',
    equipamento: 'BAHMAN',
    curral_codigo: 'C001',
    dieta_nome: 'Dieta Engorda',
    kg_planejado: 1500,
    kg_real: 1450,
    desvio_kg: -50,
    desvio_pct: -3.33,
    natural_key: '2024-01-15|BAHMAN|C001|MANHA',
  };

  const dimensionIds: DimensionIds = {
    curralId: 'curral-123',
    dietaId: 'dieta-456',
    equipamentoId: 'equip-789',
  };

  return { validatedData, dimensionIds, rawData };
}

async function runUpsertServiceTests() {
  console.log('Running UPSERT Service Tests...');

  const mockClient = createMockSupabaseClient();
  const context: UpsertContext = {
    organizationId: 'test-org-123',
    fileId: 'test-file-456',
    runId: 'test-run-789',
    supabaseClient: mockClient,
  };

  const upsertService = new UpsertService(context);
  const { validatedData, dimensionIds } = createTestData();

  // Test 1: Insert new record
  console.log('✓ Testing new record insertion...');

  mockClient.mockReset();
  const insertResult = await upsertService.upsertDesvioRecord(validatedData, dimensionIds);

  assert(insertResult.isSuccess, 'Insert should succeed');
  assert(insertResult.operation === 'insert', 'Operation should be insert');
  assert(insertResult.recordId !== '', 'Should return record ID');
  assert(insertResult.dimensionLookups.curralResolved, 'Curral should be resolved');
  assert(insertResult.dimensionLookups.dietaResolved, 'Dieta should be resolved');
  assert(insertResult.dimensionLookups.equipamentoResolved, 'Equipamento should be resolved');

  const factRecords = mockClient.mockGetFactRecords();
  assert(factRecords.length === 1, 'Should have one fact record');
  assert(factRecords[0].natural_key === validatedData.natural_key, 'Natural key should match');

  // Test 2: Update existing record with changes
  console.log('✓ Testing record update with changes...');

  const updatedData = { ...validatedData, kg_real: 1400, desvio_kg: -100, desvio_pct: -6.67 };
  const updateResult = await upsertService.upsertDesvioRecord(updatedData, dimensionIds);

  assert(updateResult.isSuccess, 'Update should succeed');
  assert(updateResult.operation === 'update', 'Operation should be update');
  assert(updateResult.recordId === insertResult.recordId, 'Should return same record ID');

  const updatedFactRecords = mockClient.mockGetFactRecords();
  assert(updatedFactRecords.length === 1, 'Should still have one fact record');
  assert(updatedFactRecords[0].kg_real === 1400, 'kg_real should be updated');

  // Test 3: Skip unchanged record
  console.log('✓ Testing skip unchanged record...');

  const skipResult = await upsertService.upsertDesvioRecord(updatedData, dimensionIds);

  assert(skipResult.isSuccess, 'Skip should succeed');
  assert(skipResult.operation === 'skip', 'Operation should be skip');
  assert(skipResult.recordId === insertResult.recordId, 'Should return same record ID');

  // Test 4: Handle pending dimensions
  console.log('✓ Testing pending dimensions handling...');

  mockClient.mockReset();
  const pendingDimensionIds: DimensionIds = {
    curralId: 'pending-curral-123',
    dietaId: 'pending-dieta-456',
    equipamentoId: 'pending-equip-789',
  };

  const pendingResult = await upsertService.upsertDesvioRecord(validatedData, pendingDimensionIds);

  assert(pendingResult.isSuccess, 'Pending dimensions should succeed');
  assert(pendingResult.operation === 'insert', 'Operation should be insert');
  assert(pendingResult.dimensionLookups.curralResolved === false, 'Curral should not be resolved');
  assert(pendingResult.dimensionLookups.dietaResolved === false, 'Dieta should not be resolved');
  assert(pendingResult.dimensionLookups.equipamentoResolved === false, 'Equipamento should not be resolved');
  assert(pendingResult.warnings.length === 3, 'Should have 3 warnings for pending dimensions');

  // Test 5: Batch UPSERT operations
  console.log('✓ Testing batch UPSERT operations...');

  mockClient.mockReset();
  const batchData = [
    { data: validatedData, dimensions: dimensionIds },
    {
      data: { ...validatedData, natural_key: '2024-01-15|BAHMAN|C002|TARDE', curral_codigo: 'C002', turno: 'TARDE' },
      dimensions: { ...dimensionIds, curralId: 'curral-456' }
    },
    {
      data: { ...validatedData, natural_key: '2024-01-15|SILOKING|C003|NOITE', equipamento: 'SILOKING', curral_codigo: 'C003', turno: 'NOITE' },
      dimensions: { ...dimensionIds, curralId: 'curral-789', equipamentoId: 'equip-999' }
    },
  ];

  const batchResult = await upsertService.batchUpsert(batchData);

  assert(batchResult.summary.total === 3, 'Should process 3 records');
  assert(batchResult.summary.inserted === 3, 'Should insert 3 new records');
  assert(batchResult.summary.updated === 0, 'Should update 0 records');
  assert(batchResult.summary.failed === 0, 'Should have 0 failures');
  assert(batchResult.errors.length === 0, 'Should have no errors');

  const batchFactRecords = mockClient.mockGetFactRecords();
  assert(batchFactRecords.length === 3, 'Should have 3 fact records');

  // Test 6: Get records by natural keys
  console.log('✓ Testing get records by natural keys...');

  const naturalKeys = batchData.map(d => d.data.natural_key);
  const foundRecords = await upsertService.getRecordsByNaturalKeys(naturalKeys);

  assert(foundRecords.length === 3, 'Should find all 3 records');

  // Test 7: Verify batch integrity
  console.log('✓ Testing batch integrity verification...');

  const integrityResult = await upsertService.verifyBatchIntegrity(naturalKeys);

  assert(integrityResult.totalExpected === 3, 'Should expect 3 records');
  assert(integrityResult.totalFound === 3, 'Should find 3 records');
  assert(integrityResult.missingKeys.length === 0, 'Should have no missing keys');
  assert(integrityResult.isComplete, 'Batch should be complete');

  // Test 8: Get processing statistics
  console.log('✓ Testing processing statistics...');

  const stats = await upsertService.getProcessingStats();

  assert(stats.totalRecords === 3, 'Should have 3 total records');
  assert(stats.recordsByDate['2024-01-15'] === 3, 'Should have 3 records for 2024-01-15');
  assert(typeof stats.avgDeviationKg === 'number', 'Should have numeric average deviation');
  assert(typeof stats.avgDeviationPct === 'number', 'Should have numeric average deviation percentage');

  // Test 9: Delete records by file ID
  console.log('✓ Testing delete records by file ID...');

  const deleteCount = await upsertService.deleteRecordsByFileId(context.fileId);

  assert(deleteCount === 3, 'Should delete 3 records');

  const remainingRecords = mockClient.mockGetFactRecords();
  assert(remainingRecords.length === 0, 'Should have no remaining records');

  console.log('🎉 All UPSERT service tests passed!');
}

async function runDimensionLookupTests() {
  console.log('Running Dimension Lookup Service Tests...');

  const mockClient = createMockSupabaseClient();
  const context: DimensionLookupContext = {
    organizationId: 'test-org-123',
    supabaseClient: mockClient,
  };

  const dimensionService = new DimensionLookupService(context);

  // Test 1: Lookup existing dimensions
  console.log('✓ Testing existing dimension lookups...');

  mockClient.mockAddDimensions({
    dim_curral: [
      { curral_id: 'curral-123', organization_id: 'test-org-123', codigo: 'C001', nome: 'Curral 001', is_active: true },
    ],
    dim_dieta: [
      { dieta_id: 'dieta-456', organization_id: 'test-org-123', nome: 'Dieta Engorda', descricao: 'Dieta para engorda', is_active: true },
    ],
    dim_equipamento: [
      { equipamento_id: 'equip-789', organization_id: 'test-org-123', nome: 'BAHMAN', tipo: 'BAHMAN', is_active: true },
    ],
  });

  const lookupResult = await dimensionService.lookupDimensions('C001', 'BAHMAN', 'Dieta Engorda');

  assert(lookupResult.curralId === 'curral-123', 'Should find existing curral');
  assert(lookupResult.dietaId === 'dieta-456', 'Should find existing dieta');
  assert(lookupResult.equipamentoId === 'equip-789', 'Should find existing equipamento');
  assert(lookupResult.warnings.length === 0, 'Should have no warnings for existing dimensions');
  assert(Object.keys(lookupResult.pendingCreations).length === 0, 'Should have no pending creations');

  // Test 2: Lookup non-existing dimensions (should create pending)
  console.log('✓ Testing non-existing dimension lookups...');

  const pendingLookupResult = await dimensionService.lookupDimensions('C999', 'UNKNOWN_BRAND', 'Unknown Diet');

  assert(pendingLookupResult.curralId.startsWith('pending-curral-'), 'Should create pending curral');
  assert(pendingLookupResult.dietaId !== null && pendingLookupResult.dietaId.startsWith('pending-dieta-'), 'Should create pending dieta');
  assert(pendingLookupResult.equipamentoId !== null && pendingLookupResult.equipamentoId.startsWith('pending-equipamento-'), 'Should create pending equipamento');
  assert(pendingLookupResult.warnings.length === 3, 'Should have 3 warnings for pending dimensions');
  assert(pendingLookupResult.pendingCreations.curral === 'C999', 'Should track pending curral creation');
  assert(pendingLookupResult.pendingCreations.dieta === 'Unknown Diet', 'Should track pending dieta creation');
  assert(pendingLookupResult.pendingCreations.equipamento === 'UNKNOWN_BRAND', 'Should track pending equipamento creation');

  // Test 3: Get pending dimensions
  console.log('✓ Testing get pending dimensions...');

  const pendingDimensions = await dimensionService.getPendingDimensions();

  assert(pendingDimensions.currais.length >= 1, 'Should have at least 1 pending curral');
  assert(pendingDimensions.dietas.length >= 1, 'Should have at least 1 pending dieta');
  assert(pendingDimensions.equipamentos.length >= 1, 'Should have at least 1 pending equipamento');

  // Test 4: Resolve pending dimension
  console.log('✓ Testing resolve pending dimension...');

  const pendingCurralId = pendingLookupResult.curralId;
  const resolveResult = await dimensionService.resolvePendingDimension('curral', pendingCurralId, 'resolved-curral-999');

  assert(resolveResult.success, 'Should successfully resolve pending dimension');

  // Test 5: Get dimension statistics
  console.log('✓ Testing dimension statistics...');

  const dimensionStats = await dimensionService.getDimensionStats();

  assert(dimensionStats.currais.total >= 1, 'Should have at least 1 curral');
  assert(dimensionStats.dietas.total >= 1, 'Should have at least 1 dieta');
  assert(dimensionStats.equipamentos.total >= 1, 'Should have at least 1 equipamento');
  assert(typeof dimensionStats.currais.active === 'number', 'Should have numeric active count');
  assert(typeof dimensionStats.currais.pending === 'number', 'Should have numeric pending count');

  // Test 6: Batch dimension lookups
  console.log('✓ Testing batch dimension lookups...');

  const batchRecords = [
    { curralCodigo: 'C001', equipamento: 'BAHMAN', dietaNome: 'Dieta Engorda' },
    { curralCodigo: 'C002', equipamento: 'SILOKING', dietaNome: 'Dieta Manutenção' },
    { curralCodigo: 'C003', equipamento: 'BAHMAN', dietaNome: null },
  ];

  const batchLookupResults = await dimensionService.batchLookupDimensions(batchRecords);

  assert(batchLookupResults.length === 3, 'Should return 3 lookup results');
  assert(batchLookupResults[0].curralId === 'curral-123', 'First record should find existing curral');
  assert(batchLookupResults[2].dietaId === null, 'Third record should have null dieta');

  console.log('🎉 All dimension lookup service tests passed!');
}

export { runUpsertServiceTests, runDimensionLookupTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    Promise.all([
      runUpsertServiceTests(),
      runDimensionLookupTests(),
    ]).then(() => {
      console.log('🎉 All Pipeline 02 UPSERT and Dimension tests passed!');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}