/**
 * Tests for Staging Cleanup Service - Node.js compatible
 */

import { StagingCleanupService, StagingCleanupOptions } from '../staging-cleanup-service.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Simplified mock Supabase client focused on core functionality
const createMockSupabaseClient = () => {
  let deletedRecords = 0;
  let auditLogs: any[] = [];

  return {
    from: (tableName: string) => ({
      eq: (field: string, value: any) => ({
        lt: (field2: string, value2: any) => ({
          select: (fields: string = '*', options?: any) => {
            if (fields.includes('count') || options?.count === 'exact') {
              return { count: 0, error: null };
            }
            return { data: auditLogs, error: null };
          },
          delete: () => ({
            select: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: () => ({
            select: async () => {
              deletedRecords = 1;
              return { data: [{ id: 'test-record' }], error: null };
            },
          }),
          select: async () => {
            deletedRecords = 1;
            return { data: [{ id: 'test-record' }], error: null };
          },
        }),
        select: async () => {
          deletedRecords = 2;
          return { data: [{ id: 'test1' }, { id: 'test2' }], error: null };
        },
      }),
      select: (fields: string = '*', options?: any) => {
        if (fields.includes('count') || options?.count === 'exact') {
          return {
            eq: (field: string, value: any) => ({
              eq: (field2: string, value2: any) => ({ count: 0, error: null }),
              count: 0,
              error: null,
            }),
            count: 0,
            error: null,
          };
        }
        return {
          eq: (field: string, value: any) => ({
            gte: (field2: string, value2: any) => ({
              order: (orderField: string, orderOptions: any) => ({
                then: async (resolve: any) => resolve({ data: auditLogs, error: null }),
              }),
              then: async (resolve: any) => resolve({ data: auditLogs, error: null }),
            }),
            order: (orderField: string, orderOptions: any) => ({
              limit: (limitValue: number) => ({
                then: async (resolve: any) => resolve({ data: auditLogs, error: null }),
              }),
            }),
            then: async (resolve: any) => resolve({ data: auditLogs, error: null }),
          }),
        };
      },
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const newLog = { ...data, id: `audit-${Date.now()}` };
            auditLogs.push(newLog);
            return { data: newLog, error: null };
          },
        }),
      }),
    }),
    mockReset: () => {
      deletedRecords = 0;
      auditLogs = [];
    },
    mockGetDeletedCount: () => deletedRecords,
    mockGetAuditLogs: () => auditLogs,
  };
};

async function runStagingCleanupTests() {
  console.log('🧪 Running Staging Cleanup Service Tests...\n');

  try {
    const mockClient = createMockSupabaseClient();

    // Test 1: Service initialization
    console.log('✓ Test 1: Service initialization...');
    const cleanupService = new StagingCleanupService(mockClient);
    assert(cleanupService !== null, 'Should create service instance');

    // Test 2: Basic cleanup functionality
    console.log('✓ Test 2: Basic staging table cleanup...');

    const cleanupOptions: StagingCleanupOptions = {
      organizationId: 'org-123',
      fileId: 'file-001',
    };

    const cleanupResult = await cleanupService.cleanupStagingTables(cleanupOptions);

    assert(typeof cleanupResult === 'object', 'Should return cleanup result');
    assert(Array.isArray(cleanupResult.tablesProcessed), 'Should have processed tables array');
    assert(typeof cleanupResult.recordsDeleted === 'number', 'Should have records deleted count');
    assert(Array.isArray(cleanupResult.errors), 'Should have errors array');
    assert(typeof cleanupResult.cleanupDuration === 'number', 'Should have duration');

    console.log(`   - Tables processed: ${cleanupResult.tablesProcessed.length}`);
    console.log(`   - Records deleted: ${cleanupResult.recordsDeleted}`);

    // Test 3: Dry run mode
    console.log('✓ Test 3: Dry run mode...');

    mockClient.mockReset();
    const dryRunOptions: StagingCleanupOptions = {
      organizationId: 'org-123',
      dryRun: true,
    };

    const dryRunResult = await cleanupService.cleanupStagingTables(dryRunOptions);

    assert(dryRunResult.dryRunResults !== undefined, 'Should have dry run results');
    assert(typeof dryRunResult.dryRunResults?.wouldDelete === 'number', 'Should have would delete count');

    console.log(`   - Would delete: ${dryRunResult.dryRunResults?.wouldDelete} records`);

    // Test 4: Cleanup verification
    console.log('✓ Test 4: Cleanup verification...');

    const verificationResult = await cleanupService.verifyStagingCleanup({
      organizationId: 'org-123',
      fileId: 'file-001',
    });

    assert(typeof verificationResult === 'object', 'Should return verification result');
    assert(typeof verificationResult.isClean === 'boolean', 'Should have isClean flag');
    assert(typeof verificationResult.remainingRecords === 'object', 'Should have remaining records');

    console.log(`   - Is clean: ${verificationResult.isClean}`);

    // Test 5: Audit event logging
    console.log('✓ Test 5: Audit event logging...');

    const auditId = await cleanupService.logAuditEvent({
      level: 'info',
      action: 'test_action',
      message: 'Test audit message',
      organizationId: 'org-123',
    });

    assert(typeof auditId === 'string', 'Should return audit ID');
    console.log(`   - Audit ID: ${auditId}`);

    // Test 6: Audit trail retrieval
    console.log('✓ Test 6: Audit trail retrieval...');

    const auditTrail = await cleanupService.getAuditTrail({
      organizationId: 'org-123',
      limit: 10,
    });

    assert(Array.isArray(auditTrail), 'Should return audit trail array');
    console.log(`   - Audit entries: ${auditTrail.length}`);

    // Test 7: Audit statistics
    console.log('✓ Test 7: Audit statistics...');

    const auditStats = await cleanupService.getAuditStats('org-123', 24);

    assert(typeof auditStats === 'object', 'Should return audit stats');
    assert(typeof auditStats.totalEvents === 'number', 'Should have total events');
    assert(typeof auditStats.successRate === 'number', 'Should have success rate');

    console.log(`   - Total events: ${auditStats.totalEvents}`);
    console.log(`   - Success rate: ${auditStats.successRate.toFixed(1)}%`);

    // Test 8: Old audit record cleanup
    console.log('✓ Test 8: Old audit record cleanup...');

    const auditCleanupResult = await cleanupService.cleanupOldAuditRecords('org-123', 30, false);

    assert(typeof auditCleanupResult === 'object', 'Should return audit cleanup result');
    assert(typeof auditCleanupResult.recordsDeleted === 'number', 'Should have deleted count');

    console.log(`   - Old records deleted: ${auditCleanupResult.recordsDeleted}`);

    console.log('\n🎉 All staging cleanup tests passed!');
  } catch (error) {
    console.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export { runStagingCleanupTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runStagingCleanupTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}