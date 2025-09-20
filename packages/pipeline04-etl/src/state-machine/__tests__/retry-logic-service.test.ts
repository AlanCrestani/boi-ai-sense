/**
 * Comprehensive tests for RetryLogicService
 * Tests exponential backoff, error classification, dead letter queue, and monitoring
 */

import { RetryLogicService } from '../retry-logic-service.js';
import { MonitoringService } from '../monitoring-service.js';
import {
  ErrorType,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  RetryResult
} from '../types.js';

// Mock Supabase client for testing
const createMockSupabaseClient = () => {
  const mockData: any = {
    etl_file: [],
    etl_run: [],
    etl_dead_letter_queue: [],
    etl_run_log: []
  };

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({
            data: mockData[table].find((item: any) => item[column] === value),
            error: null
          }),
          gt: (column: string, value: any) => ({
            lte: (column2: string, value2: any) => Promise.resolve({
              data: mockData[table].filter((item: any) =>
                item[column] > value && item[column2] <= value2
              ),
              error: null
            })
          }),
          gte: (column: string, value: any) => ({
            order: (orderBy: string, options: any) => ({
              limit: (limit: number) => Promise.resolve({
                data: mockData[table]
                  .filter((item: any) => item[column] >= value)
                  .slice(0, limit),
                error: null
              })
            }),
            lt: (column2: string, value2: any) => Promise.resolve({
              data: mockData[table].filter((item: any) =>
                item[column] >= value && item[column2] < value2
              ),
              error: null
            })
          }),
          not: (column: string, operator: string, value: any) => ({
            lt: (column2: string, value2: any) => Promise.resolve({
              data: mockData[table].filter((item: any) =>
                item[column] !== value && item[column2] < value2
              ),
              error: null
            })
          }),
          order: (column: string, options: any) => ({
            limit: (limit: number) => Promise.resolve({
              data: mockData[table].slice(0, limit),
              error: null
            })
          })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          const item = mockData[table].find((item: any) => item[column] === value);
          if (item) {
            Object.assign(item, data);
          }
          return Promise.resolve({ error: null });
        }
      }),
      insert: (data: any) => {
        const newItem = { id: `test-${Date.now()}`, ...data };
        mockData[table].push(newItem);
        return Promise.resolve({ error: null });
      }
    }),
    rpc: (functionName: string, params: any) => {
      if (functionName === 'get_retry_statistics') {
        return Promise.resolve({
          data: [{
            active_retries: 5,
            dead_letter_queue_size: 3,
            success_rate: 85,
            average_retries: 1.5
          }],
          error: null
        });
      }
      return Promise.resolve({ data: null, error: null });
    }
  };
};

// Test data setup
const mockSupabase = createMockSupabaseClient();
const testOrgId = 'test-org-123';
const testEntityId = 'test-entity-456';

// Helper function to run all retry logic tests
export async function runRetryLogicTests(): Promise<void> {
  console.log('🧪 Running Retry Logic Service Tests...');

  try {
    // Create test instances
    const mockSupabase = createMockSupabaseClient();
    const retryService = new RetryLogicService(mockSupabase as any);
    const monitoringService = new MonitoringService(mockSupabase as any);

    // Test 1: Exponential backoff calculation
    console.log('  ✓ Testing exponential backoff calculation...');
    const delay1 = retryService.calculateNextRetryDelay(1, { jitterEnabled: false });
    const delay2 = retryService.calculateNextRetryDelay(2, { jitterEnabled: false });
    const delay3 = retryService.calculateNextRetryDelay(3, { jitterEnabled: false });

    if (delay1 !== 1000 || delay2 !== 2000 || delay3 !== 4000) {
      throw new Error(`Exponential backoff calculation failed: ${delay1}, ${delay2}, ${delay3}`);
    }

    // Test 2: Error classification
    console.log('  ✓ Testing error classification...');
    const transientError = retryService.classifyError('Network timeout occurred');
    const permanentError = retryService.classifyError('Validation failed: missing field');
    const rateLimitError = retryService.classifyError('Rate limit exceeded');
    const resourceError = retryService.classifyError('Out of memory');

    if (transientError !== ErrorType.TRANSIENT ||
        permanentError !== ErrorType.PERMANENT ||
        rateLimitError !== ErrorType.RATE_LIMITED ||
        resourceError !== ErrorType.RESOURCE) {
      throw new Error('Error classification failed');
    }

    // Test 3: Retry eligibility check
    console.log('  ✓ Testing retry eligibility...');
    const isTransientRetryable = retryService.isRetryable(ErrorType.TRANSIENT);
    const isPermanentRetryable = retryService.isRetryable(ErrorType.PERMANENT);

    if (!isTransientRetryable || isPermanentRetryable) {
      throw new Error('Retry eligibility check failed');
    }

    // Test 4: Jitter calculation
    console.log('  ✓ Testing jitter in backoff calculation...');
    const delaysWithJitter = Array.from({ length: 10 }, () =>
      retryService.calculateNextRetryDelay(3, { jitterEnabled: true })
    );

    const uniqueDelays = new Set(delaysWithJitter);
    if (uniqueDelays.size < 2) {
      throw new Error('Jitter is not working - all delays are the same');
    }

    // Test 5: Maximum delay cap
    console.log('  ✓ Testing maximum delay cap...');
    const delayWithCap = retryService.calculateNextRetryDelay(10, {
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitterEnabled: false
    });

    if (delayWithCap !== 5000) {
      throw new Error(`Maximum delay cap failed: expected 5000, got ${delayWithCap}`);
    }

    // Test 6: Successful retry operation
    console.log('  ✓ Testing successful retry operation...');
    let attemptCount = 0;
    const successOperation = async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new Error('Network timeout occurred');
      }
      return 'success';
    };

    const result = await retryService.executeWithRetry(
      successOperation,
      'etl_run',
      'test-entity',
      'test-org'
    );

    if (!result.success || result.result !== 'success' || result.attemptNumber !== 2) {
      throw new Error(`Retry logic test failed: ${JSON.stringify(result)}`);
    }

    // Test 7: Permanent error handling
    console.log('  ✓ Testing permanent error handling...');
    const permanentErrorOperation = async () => {
      throw new Error('Validation failed: missing required field');
    };

    const permanentResult = await retryService.executeWithRetry(
      permanentErrorOperation,
      'etl_file',
      'test-file',
      'test-org'
    );

    if (permanentResult.success || permanentResult.shouldRetry || permanentResult.errorType !== ErrorType.PERMANENT) {
      throw new Error(`Permanent error handling failed: ${JSON.stringify(permanentResult)}`);
    }

    // Test 8: Monitoring metrics
    console.log('  ✓ Testing monitoring metrics...');
    const metrics = await monitoringService.getMetrics('test-org');

    if (!metrics.organizationId || typeof metrics.activeRetries !== 'number') {
      throw new Error('Monitoring metrics test failed');
    }

    // Test 9: Health check
    console.log('  ✓ Testing health check...');
    const health = await monitoringService.getHealthCheck('test-org');

    if (!health.status || !Array.isArray(health.issues)) {
      throw new Error('Health check test failed');
    }

    // Test 10: Dead letter queue operations
    console.log('  ✓ Testing dead letter queue operations...');
    const dlqEntries = await retryService.getDeadLetterQueueEntries('test-org');
    const resolveResult = await retryService.resolveDeadLetterQueueEntry('test-id', 'test-user');

    if (!Array.isArray(dlqEntries)) {
      throw new Error('Dead letter queue entries test failed');
    }

    // Test 11: Retry statistics
    console.log('  ✓ Testing retry statistics...');
    const stats = await retryService.getRetryStatistics('test-org');

    if (typeof stats.activeRetries !== 'number' ||
        typeof stats.deadLetterQueueSize !== 'number' ||
        typeof stats.successRate !== 'number' ||
        typeof stats.averageRetries !== 'number') {
      throw new Error('Retry statistics test failed');
    }

    // Test 12: Alert checking
    console.log('  ✓ Testing alert checking...');
    const alerts = await monitoringService.checkAlerts('test-org');

    if (!Array.isArray(alerts)) {
      throw new Error('Alert checking test failed');
    }

    // Test 13: Entities ready for retry
    console.log('  ✓ Testing entities ready for retry...');
    const entitiesReady = await retryService.getEntitiesReadyForRetry('test-org');

    if (!entitiesReady.files || !entitiesReady.runs ||
        !Array.isArray(entitiesReady.files) || !Array.isArray(entitiesReady.runs)) {
      throw new Error('Entities ready for retry test failed');
    }

    // Test 14: Error type boundaries
    console.log('  ✓ Testing error type boundary cases...');
    const unknownError = retryService.classifyError('Some completely unknown error message');
    if (unknownError !== ErrorType.TRANSIENT) {
      throw new Error('Unknown error should default to transient');
    }

    const mixedCaseError = retryService.classifyError('NETWORK TIMEOUT OCCURRED');
    if (mixedCaseError !== ErrorType.TRANSIENT) {
      throw new Error('Mixed case error classification failed');
    }

    // Test 15: Configuration validation
    console.log('  ✓ Testing configuration validation...');
    const customConfig: Partial<RetryConfig> = {
      maxRetries: 1,
      baseDelayMs: 500,
      maxDelayMs: 2000,
      backoffMultiplier: 1.5
    };

    const customDelay = retryService.calculateNextRetryDelay(2, customConfig);
    const expectedDelay = 500 * Math.pow(1.5, 1); // 750ms
    if (Math.abs(customDelay - expectedDelay) > 1) { // Allow 1ms tolerance
      throw new Error(`Custom configuration test failed: expected ~${expectedDelay}, got ${customDelay}`);
    }

    console.log('✅ All Retry Logic Service tests passed!');
  } catch (error) {
    console.error('❌ Retry Logic Service tests failed:', error);
    throw error;
  }
}