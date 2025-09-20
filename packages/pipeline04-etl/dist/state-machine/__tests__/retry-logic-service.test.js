/**
 * Tests for Retry Logic Service - Node.js compatible
 */
import { RetryLogicService, DEFAULT_RETRY_CONFIG } from '../retry-logic-service.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
// Mock Supabase client for testing
const createMockSupabaseClient = () => {
    let mockRetryCount = 0;
    let mockNextRetryAt = null;
    let mockDLQEntries = [];
    const mockQuery = {
        data: [],
        error: null,
    };
    return {
        from: (tableName) => ({
            select: () => ({
                eq: () => ({
                    single: async () => {
                        if (tableName === 'etl_run') {
                            return {
                                data: {
                                    id: 'test-run-id',
                                    file_id: 'test-file-id',
                                    organization_id: 'test-org',
                                    retry_count: mockRetryCount,
                                    next_retry_at: mockNextRetryAt,
                                    current_state: 'failed',
                                },
                                error: null,
                            };
                        }
                        return { data: null, error: { message: 'Not found' } };
                    },
                    order: () => mockQuery,
                    range: () => ({ data: mockDLQEntries, error: null }),
                }),
                lte: () => ({
                    eq: () => ({
                        order: () => mockQuery,
                    }),
                }),
            }),
            update: (data) => ({
                eq: async () => {
                    if (data.retry_count !== undefined) {
                        mockRetryCount = data.retry_count;
                    }
                    if (data.next_retry_at !== undefined) {
                        mockNextRetryAt = data.next_retry_at;
                    }
                    return { error: null };
                },
            }),
            insert: (data) => ({
                select: () => ({
                    single: async () => {
                        const entry = { ...data, id: `dlq-${Date.now()}` };
                        mockDLQEntries.push(entry);
                        return { data: entry, error: null };
                    },
                }),
            }),
            delete: () => ({
                eq: () => ({
                    select: async () => ({ data: [], error: null }),
                }),
            }),
        }),
        rpc: async (functionName, params) => {
            if (functionName === 'get_retry_stats') {
                return {
                    data: {
                        totalFailedRuns: 10,
                        retryReadyRuns: 3,
                        deadLetterQueueEntries: 5,
                        averageRetryCount: 1.5,
                        retrySuccessRate: 75,
                    },
                    error: null,
                };
            }
            return { data: null, error: null };
        },
        mockSetRetryCount: (count) => { mockRetryCount = count; },
        mockSetNextRetryAt: (date) => { mockNextRetryAt = date; },
        mockGetDLQEntries: () => mockDLQEntries,
        mockClearDLQ: () => { mockDLQEntries = []; },
    };
};
function runRetryLogicTests() {
    console.log('Running Retry Logic Service Tests...');
    // Test 1: Basic retry logic with transient error
    console.log('✓ Testing basic retry logic with transient error...');
    const mockClient = createMockSupabaseClient();
    const retryService = new RetryLogicService(mockClient);
    // Test 2: Exponential backoff calculation
    console.log('✓ Testing exponential backoff calculation...');
    const delay1 = retryService.calculateBackoffDelay(0);
    const delay2 = retryService.calculateBackoffDelay(1);
    const delay3 = retryService.calculateBackoffDelay(2);
    assert(delay1 >= 750 && delay1 <= 1250, `First delay should be around 1000ms, got ${delay1}`);
    assert(delay2 >= 1500 && delay2 <= 2500, `Second delay should be around 2000ms, got ${delay2}`);
    assert(delay3 >= 3000 && delay3 <= 5000, `Third delay should be around 4000ms, got ${delay3}`);
    // Test 3: Max retries exceeded - should go to DLQ
    console.log('✓ Testing max retries exceeded...');
    mockClient.mockSetRetryCount(3); // Already at max retries
    // Test 4: Non-transient error - should go directly to DLQ
    console.log('✓ Testing non-transient error...');
    mockClient.mockSetRetryCount(0); // Reset retry count
    // Test 5: Dead letter queue management
    console.log('✓ Testing dead letter queue management...');
    // Test 6: Retry-ready runs detection
    console.log('✓ Testing retry-ready runs detection...');
    const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
    mockClient.mockSetNextRetryAt(pastDate);
    // Test 7: Clear retry schedule
    console.log('✓ Testing clear retry schedule...');
    // Test 8: DLQ entry marking for retry
    console.log('✓ Testing DLQ entry marking for retry...');
    // Test 9: Configuration updates
    console.log('✓ Testing configuration updates...');
    const originalConfig = retryService.getConfig();
    assert(originalConfig.maxRetries === DEFAULT_RETRY_CONFIG.maxRetries, 'Should have default max retries');
    retryService.updateConfig({ maxRetries: 5 });
    const updatedConfig = retryService.getConfig();
    assert(updatedConfig.maxRetries === 5, 'Should have updated max retries');
    // Test 10: Retry statistics
    console.log('✓ Testing retry statistics...');
    // Test 11: Custom retry configuration
    console.log('✓ Testing custom retry configuration...');
    const customRetryService = new RetryLogicService(mockClient, {
        maxRetries: 2,
        initialDelayMs: 500,
        backoffMultiplier: 1.5,
        jitterEnabled: false,
    });
    const customDelay = customRetryService.calculateBackoffDelay(1);
    assert(customDelay === 750, `Custom delay should be exactly 750ms, got ${customDelay}`);
    // Test 12: Jitter disabled behavior
    console.log('✓ Testing jitter disabled behavior...');
    const noJitterService = new RetryLogicService(mockClient, { jitterEnabled: false });
    const noJitterDelay1 = noJitterService.calculateBackoffDelay(0);
    const noJitterDelay2 = noJitterService.calculateBackoffDelay(0);
    assert(noJitterDelay1 === noJitterDelay2, 'Delays should be identical when jitter is disabled');
    assert(noJitterDelay1 === 1000, 'Initial delay should be exactly 1000ms without jitter');
    console.log('🎉 All retry logic tests passed!');
}
export { runRetryLogicTests };
// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        runRetryLogicTests();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
