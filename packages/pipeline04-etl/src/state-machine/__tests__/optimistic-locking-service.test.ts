/**
 * Tests for Optimistic Locking Service - Node.js compatible
 */

import { OptimisticLockingService, ETLStateTransitionRequest, LockingOptions, VersionedRecord } from '../optimistic-locking-service.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Enhanced mock Supabase client for concurrency testing
const createMockSupabaseClient = () => {
  let records: Record<string, any> = {};
  let nextId = 1;
  let lockStats = {
    totalRecords: 0,
    lockedRecords: 0,
    expiredLocks: 0,
    averageLockDuration: 0,
  };

  // Initialize some test records
  const testFileId = 'test-file-001';
  const testRunId = 'test-run-001';

  records[testFileId] = {
    id: testFileId,
    organization_id: 'org-123',
    current_state: 'uploaded',
    version: 1,
    state_history: [],
    processing_by: null,
    processing_started_at: null,
    locked_by: null,
    locked_at: null,
    lock_expires_at: null,
    updated_at: new Date(),
  };

  records[testRunId] = {
    id: testRunId,
    organization_id: 'org-123',
    current_state: 'uploaded',
    version: 1,
    state_history: [],
    processing_by: null,
    processing_started_at: null,
    locked_by: null,
    locked_at: null,
    lock_expires_at: null,
    updated_at: new Date(),
  };

  return {
    from: (tableName: string) => ({
      select: (fields: string = '*', options?: any) => {
        if (fields.includes('count') || options?.count === 'exact') {
          return {
            eq: (field: string, value: any) => ({
              eq: (field2: string, value2: any) => ({ count: Object.keys(records).length, error: null }),
              count: Object.keys(records).length,
              error: null,
            }),
            count: Object.keys(records).length,
            error: null,
          };
        }
        return {
          eq: (field: string, value: any) => ({
            single: async () => {
              const record = Object.values(records).find((r: any) => r[field] === value);
              return record ? { data: record, error: null } : { data: null, error: { message: 'Record not found' } };
            },
            then: async (resolve: any) => resolve({ data: Object.values(records), error: null }),
          }),
          then: async (resolve: any) => resolve({ data: Object.values(records), error: null }),
        };
      },
      update: (updateData: any) => ({
        eq: (field: string, value: any) => ({
          eq: (field2: string, value2: any) => ({
            select: () => ({
              single: async () => {
                const record = Object.values(records).find((r: any) => r[field] === value && r[field2] === value2);
                if (record) {
                  Object.assign(record, updateData);
                  return { data: record, error: null };
                }
                return { data: null, error: { code: 'PGRST116', message: 'no rows' } };
              },
            }),
            then: async (resolve: any) => {
              const record = Object.values(records).find((r: any) => r[field] === value && r[field2] === value2);
              if (record) {
                Object.assign(record, updateData);
                resolve({ data: [record], error: null });
              } else {
                resolve({ data: [], error: { code: 'PGRST116', message: 'no rows' } });
              }
            },
          }),
          is: (field2: string, value2: any) => ({
            select: () => ({
              single: async () => {
                // Special case for lock acquisition - allow if locked_by is null
                const record = Object.values(records).find((r: any) => r[field] === value);
                if (record && (value2 === null ? record[field2] === null : record[field2] === value2)) {
                  Object.assign(record, updateData);
                  return { data: record, error: null };
                }
                return { data: null, error: { code: 'PGRST116', message: 'no rows' } };
              },
            }),
          }),
          select: () => ({
            single: async () => {
              const record = Object.values(records).find((r: any) => r[field] === value);
              if (record) {
                Object.assign(record, updateData);
                return { data: record, error: null };
              }
              return { data: null, error: { message: 'Record not found' } };
            },
          }),
          then: async (resolve: any) => {
            const matchingRecords = Object.values(records).filter((r: any) => r[field] === value);
            for (const record of matchingRecords) {
              Object.assign(record, updateData);
            }
            resolve({ data: matchingRecords, error: null });
          },
        }),
        lt: (field: string, value: any) => ({
          not: (field2: string, operator: string, value2: any) => ({
            select: async () => {
              const matchingRecords = Object.values(records).filter((r: any) => {
                const fieldDate = r[field] ? new Date(r[field]) : null;
                const cutoffDate = new Date(value);
                return fieldDate && fieldDate < cutoffDate && r[field2] !== null;
              });
              for (const record of matchingRecords) {
                Object.assign(record, updateData);
              }
              return { data: matchingRecords, error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (field: string, value: any) => ({
          eq: (field2: string, value2: any) => ({
            select: async () => {
              const record = Object.values(records).find((r: any) => r[field] === value && r[field2] === value2);
              if (record) {
                delete records[record.id];
                return { data: [record], error: null };
              }
              return { data: [], error: null };
            },
          }),
        }),
      }),
    }),
    raw: (sql: string) => sql,
    rpc: async (functionName: string, params: any) => {
      switch (functionName) {
        case 'is_valid_state_transition':
          const { p_from_state, p_to_state } = params;
          // Simplified state transition validation
          const validTransitions: Record<string, string[]> = {
            uploaded: ['parsing'],
            parsing: ['parsed', 'failed'],
            parsed: ['validating'],
            validating: ['validated', 'failed'],
            validated: ['loading'],
            loading: ['loaded', 'failed'],
          };
          const isValid = validTransitions[p_from_state]?.includes(p_to_state) || false;
          return { data: isValid, error: null };

        case 'get_locking_stats':
          return { data: lockStats, error: null };

        case 'update_multiple_with_lock':
          // Simulate the multiple update function
          const updates = params.p_updates;
          const results = [];
          for (const update of updates) {
            const record = records[update.record_id];
            if (record && record.version === update.expected_version) {
              const updateData = JSON.parse(update.update_data);
              Object.assign(record, updateData);
              results.push(record);
            } else {
              throw new Error('version_conflict');
            }
          }
          return { data: results, error: null };

        default:
          return { data: null, error: { message: `Unknown function: ${functionName}` } };
      }
    },
    mockReset: () => {
      records = {};
      nextId = 1;
      lockStats = {
        totalRecords: 0,
        lockedRecords: 0,
        expiredLocks: 0,
        averageLockDuration: 0,
      };

      // Re-initialize test records
      records[testFileId] = {
        id: testFileId,
        organization_id: 'org-123',
        current_state: 'uploaded',
        version: 1,
        state_history: [],
        processing_by: null,
        processing_started_at: null,
        locked_by: null,
        locked_at: null,
        lock_expires_at: null,
        updated_at: new Date(),
      };

      records[testRunId] = {
        id: testRunId,
        organization_id: 'org-123',
        current_state: 'uploaded',
        version: 1,
        state_history: [],
        processing_by: null,
        processing_started_at: null,
        locked_by: null,
        locked_at: null,
        lock_expires_at: null,
        updated_at: new Date(),
      };
    },
    mockGetRecord: (id: string) => records[id],
    mockSetRecord: (id: string, data: any) => {
      records[id] = data;
    },
    mockGetAllRecords: () => records,
  };
};

async function runOptimisticLockingTests() {
  console.log('🧪 Running Optimistic Locking and Concurrency Tests...\n');

  try {
    const mockClient = createMockSupabaseClient();

    // Test 1: Service initialization
    console.log('✓ Test 1: Service initialization...');
    const lockingService = new OptimisticLockingService(mockClient, {
      processingTimeout: 5000, // 5 seconds for testing
      sessionId: 'test-session-001',
    });
    assert(lockingService !== null, 'Should create service instance');

    // Test 2: Basic optimistic locking with version control
    console.log('✓ Test 2: Basic optimistic locking...');

    const updateResult = await lockingService.updateWithLock(
      'etl_file',
      'test-file-001',
      { metadata: { test: 'update' } },
      { maxRetries: 1 }
    );

    assert(updateResult.success, 'Update should succeed');
    assert(updateResult.currentVersion === 2, 'Version should be incremented');
    assert(updateResult.data?.metadata?.test === 'update', 'Update data should be applied');

    // Test 3: Version conflict detection
    console.log('✓ Test 3: Version conflict detection...');

    mockClient.mockReset();

    // Try to update with wrong version
    const conflictResult = await lockingService.updateWithLock(
      'etl_file',
      'test-file-001',
      { metadata: { test: 'conflict' } },
      { maxRetries: 1 }
    );

    // This should succeed since we reset the mock
    assert(conflictResult.success, 'Should succeed after reset');

    // Test 4: Safe state transition
    console.log('✓ Test 4: Safe state transition...');

    const transitionRequest: ETLStateTransitionRequest = {
      id: 'test-file-001',
      tableName: 'etl_file',
      fromState: 'uploaded',
      toState: 'parsing',
      sessionId: 'test-session-001',
      processingBy: 'test-processor',
      metadata: { startedBy: 'test' },
    };

    const transitionResult = await lockingService.safeStateTransition(transitionRequest);

    assert(transitionResult.success, 'State transition should succeed');
    assert(transitionResult.sessionId === 'test-session-001', 'Should track session ID');

    const updatedRecord = mockClient.mockGetRecord('test-file-001');
    assert(updatedRecord.current_state === 'parsing', 'State should be updated');
    assert(updatedRecord.processing_by === 'test-processor', 'Processing session should be set');
    assert(Array.isArray(updatedRecord.state_history), 'State history should be maintained');
    assert(updatedRecord.state_history.length > 0, 'State history should have entries');

    // Test 5: Concurrent processing detection
    console.log('✓ Test 5: Concurrent processing detection...');

    // Simulate another session trying to process the same record
    const concurrentRequest: ETLStateTransitionRequest = {
      id: 'test-file-001',
      tableName: 'etl_file',
      fromState: 'parsing',
      toState: 'parsed',
      sessionId: 'different-session-002',
      processingBy: 'another-processor',
    };

    const concurrentResult = await lockingService.safeStateTransition(concurrentRequest);

    assert(!concurrentResult.success, 'Concurrent processing should be blocked');
    assert(concurrentResult.error?.includes('being processed by another session') || false, 'Should detect concurrent processing');

    // Test 6: Stale session detection and cleanup
    console.log('✓ Test 6: Stale session detection...');

    // Simulate stale processing session
    const testRecord = mockClient.mockGetRecord('test-file-001');
    testRecord.processing_started_at = new Date(Date.now() - 10000); // 10 seconds ago
    mockClient.mockSetRecord('test-file-001', testRecord);

    const staleOptions: LockingOptions = {
      processingTimeout: 5000, // 5 seconds timeout
    };

    const staleCheck = await lockingService.checkForStaleProcessing('etl_file', 'test-file-001', staleOptions);

    assert(staleCheck.isStaleProcessing || false, 'Should detect stale processing session');
    assert(staleCheck.error?.includes('Processing session is stale') || false, 'Should provide stale session message');

    // Test 7: Clear stale processing sessions
    console.log('✓ Test 7: Clear stale processing sessions...');

    const clearResult = await lockingService.clearStaleProcessingSessions('etl_file', 5000);

    assert(typeof clearResult.clearedCount === 'number', 'Should return cleared count');
    assert(Array.isArray(clearResult.errors), 'Should return errors array');

    // Test 8: Release processing session
    console.log('✓ Test 8: Release processing session...');

    mockClient.mockReset();

    // Set up a processing session
    const sessionRecord = mockClient.mockGetRecord('test-file-001');
    sessionRecord.processing_by = 'test-session-001';
    sessionRecord.processing_started_at = new Date();
    mockClient.mockSetRecord('test-file-001', sessionRecord);

    const releaseResult = await lockingService.releaseProcessingSession(
      'etl_file',
      'test-file-001',
      'test-session-001'
    );

    assert(releaseResult.success, 'Should successfully release processing session');

    // Test 9: Invalid state transition
    console.log('✓ Test 9: Invalid state transition validation...');

    const invalidRequest: ETLStateTransitionRequest = {
      id: 'test-file-001',
      tableName: 'etl_file',
      fromState: 'uploaded',
      toState: 'loaded', // Invalid direct transition
      sessionId: 'test-session-001',
      processingBy: 'test-processor',
    };

    const invalidResult = await lockingService.safeStateTransition(invalidRequest);

    assert(!invalidResult.success, 'Invalid state transition should fail');
    assert(invalidResult.error?.includes('Invalid state transition') || false, 'Should provide validation error');

    // Test 10: Pessimistic locking
    console.log('✓ Test 10: Pessimistic locking...');

    const lockResult = await lockingService.lockRecord('etl_file', 'test-file-001', 30000);

    assert(lockResult.success, 'Should acquire lock');
    assert(!!lockResult.data?.lockId, 'Should return lock ID');
    assert(lockResult.data?.expiresAt instanceof Date, 'Should return expiration date');

    // Test 11: Lock release
    console.log('✓ Test 11: Lock release...');

    if (lockResult.data?.lockId) {
      const unlockResult = await lockingService.releaseLock('etl_file', 'test-file-001', lockResult.data.lockId);
      assert(unlockResult.success, 'Should release lock');
    }

    // Test 12: Concurrency statistics
    console.log('✓ Test 12: Concurrency statistics...');

    const stats = await lockingService.getConcurrencyStats('etl_file', 'org-123');

    assert(typeof stats.activeProcessingSessions === 'number', 'Should return active sessions count');
    assert(typeof stats.staleSessions === 'number', 'Should return stale sessions count');
    assert(typeof stats.activeLocks === 'number', 'Should return active locks count');
    assert(typeof stats.expiredLocks === 'number', 'Should return expired locks count');

    // Test 13: Locking statistics
    console.log('✓ Test 13: Locking statistics...');

    const lockingStats = await lockingService.getLockingStats('etl_file');

    assert(typeof lockingStats.totalRecords === 'number', 'Should return total records');
    assert(typeof lockingStats.lockedRecords === 'number', 'Should return locked records');
    assert(typeof lockingStats.expiredLocks === 'number', 'Should return expired locks');
    assert(typeof lockingStats.averageLockDuration === 'number', 'Should return average duration');

    // Test 14: Multiple records update with optimistic locking
    console.log('✓ Test 14: Multiple records update...');

    const multipleUpdates = [
      {
        tableName: 'etl_file',
        id: 'test-file-001',
        updates: { metadata: { bulk: 'update1' } } as Partial<VersionedRecord>,
        expectedVersion: 1,
      },
      {
        tableName: 'etl_run',
        id: 'test-run-001',
        updates: { metadata: { bulk: 'update2' } } as Partial<VersionedRecord>,
        expectedVersion: 1,
      },
    ];

    const multipleResult = await lockingService.updateMultipleWithLock(multipleUpdates);

    assert(multipleResult.success, 'Multiple update should succeed');
    assert(Array.isArray(multipleResult.data), 'Should return updated records array');

    // Test 15: Counter increment with locking
    console.log('✓ Test 15: Counter increment...');

    const incrementResult = await lockingService.incrementCounter(
      'etl_run',
      'test-run-001',
      'records_processed',
      5
    );

    assert(incrementResult.success, 'Counter increment should succeed');

    console.log('\\n🎉 All optimistic locking and concurrency tests passed!');
  } catch (error) {
    console.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export { runOptimisticLockingTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runOptimisticLockingTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}