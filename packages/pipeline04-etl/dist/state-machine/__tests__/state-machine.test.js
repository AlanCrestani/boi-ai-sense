/**
 * Tests for ETL State Machine
 */
import { ETLStateMachine } from '../state-machine';
import { ETLState } from '../types';
describe('ETLStateMachine', () => {
    let stateMachine;
    let mockSupabaseClient;
    beforeEach(() => {
        stateMachine = new ETLStateMachine();
        // Mock Supabase client
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
        };
    });
    describe('State Validation', () => {
        test('should validate correct state transitions', () => {
            expect(stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.PARSING)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.PARSING, ETLState.PARSED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.PARSED, ETLState.VALIDATING)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.VALIDATING, ETLState.VALIDATED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.VALIDATED, ETLState.LOADING)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.LOADING, ETLState.LOADED)).toBe(true);
        });
        test('should reject invalid state transitions', () => {
            expect(stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.LOADED)).toBe(false);
            expect(stateMachine.isValidTransition(ETLState.LOADED, ETLState.PARSING)).toBe(false);
            expect(stateMachine.isValidTransition(ETLState.PARSING, ETLState.LOADING)).toBe(false);
        });
        test('should allow transitions to cancelled state from most states', () => {
            expect(stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.CANCELLED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.PARSED, ETLState.CANCELLED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.VALIDATED, ETLState.CANCELLED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.APPROVED, ETLState.CANCELLED)).toBe(true);
        });
        test('should allow transitions to failed state from processing states', () => {
            expect(stateMachine.isValidTransition(ETLState.PARSING, ETLState.FAILED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.VALIDATING, ETLState.FAILED)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.LOADING, ETLState.FAILED)).toBe(true);
        });
        test('should allow retry from failed and cancelled states', () => {
            expect(stateMachine.isValidTransition(ETLState.FAILED, ETLState.PARSING)).toBe(true);
            expect(stateMachine.isValidTransition(ETLState.CANCELLED, ETLState.PARSING)).toBe(true);
        });
    });
    describe('State Transition Execution', () => {
        test('should transition file state successfully', async () => {
            // Mock successful database operations
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: {
                    id: 'file-1',
                    current_state: 'uploaded',
                    state_history: [],
                    version: 1,
                },
                error: null,
            });
            mockSupabaseClient.update().eq().eq.mockResolvedValueOnce({
                data: { id: 'file-1' },
                error: null,
            });
            mockSupabaseClient.insert().select().single.mockResolvedValueOnce({
                data: { id: 'log-1' },
                error: null,
            });
            const request = {
                fileId: 'file-1',
                fromState: ETLState.UPLOADED,
                toState: ETLState.PARSING,
                userId: 'user-1',
                message: 'Starting parsing',
            };
            const result = await stateMachine.transitionState(request, mockSupabaseClient);
            expect(result.success).toBe(true);
            expect(result.previousState).toBe(ETLState.UPLOADED);
            expect(result.currentState).toBe(ETLState.PARSING);
        });
        test('should reject invalid state transition', async () => {
            const request = {
                fileId: 'file-1',
                fromState: ETLState.UPLOADED,
                toState: ETLState.LOADED, // Invalid transition
                userId: 'user-1',
            };
            const result = await stateMachine.transitionState(request, mockSupabaseClient);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid state transition');
        });
        test('should handle database errors gracefully', async () => {
            // Mock database error
            mockSupabaseClient.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Database connection failed' },
            });
            const request = {
                fileId: 'file-1',
                fromState: ETLState.UPLOADED,
                toState: ETLState.PARSING,
            };
            const result = await stateMachine.transitionState(request, mockSupabaseClient);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to fetch file');
        });
    });
    describe('Retry Logic', () => {
        test('should calculate exponential backoff correctly', () => {
            const retry0 = stateMachine.calculateNextRetryTime(0);
            const retry1 = stateMachine.calculateNextRetryTime(1);
            const retry2 = stateMachine.calculateNextRetryTime(2);
            const now = Date.now();
            // First retry should be after 5 seconds
            expect(retry0.getTime()).toBeGreaterThan(now + 4000);
            expect(retry0.getTime()).toBeLessThan(now + 6000);
            // Second retry should be after 10 seconds
            expect(retry1.getTime()).toBeGreaterThan(now + 9000);
            expect(retry1.getTime()).toBeLessThan(now + 11000);
            // Third retry should be after 20 seconds
            expect(retry2.getTime()).toBeGreaterThan(now + 19000);
            expect(retry2.getTime()).toBeLessThan(now + 21000);
        });
        test('should respect max retry limit', () => {
            expect(stateMachine.canRetry(0)).toBe(true);
            expect(stateMachine.canRetry(1)).toBe(true);
            expect(stateMachine.canRetry(2)).toBe(true);
            expect(stateMachine.canRetry(3)).toBe(false);
            expect(stateMachine.canRetry(4)).toBe(false);
        });
    });
    describe('Valid Next States', () => {
        test('should return correct next states for each state', () => {
            expect(stateMachine.getValidNextStates(ETLState.UPLOADED))
                .toEqual([ETLState.PARSING, ETLState.CANCELLED]);
            expect(stateMachine.getValidNextStates(ETLState.PARSING))
                .toEqual([ETLState.PARSED, ETLState.FAILED]);
            expect(stateMachine.getValidNextStates(ETLState.VALIDATED))
                .toEqual([ETLState.AWAITING_APPROVAL, ETLState.LOADING, ETLState.CANCELLED]);
            expect(stateMachine.getValidNextStates(ETLState.LOADED))
                .toEqual([]); // Terminal state
        });
    });
    describe('Stale Lock Detection', () => {
        test('should identify stale processing locks', async () => {
            const staleThreshold = new Date(Date.now() - 600000); // 10 minutes ago
            mockSupabaseClient.select.mockReturnThis();
            mockSupabaseClient.in = jest.fn().mockReturnThis();
            mockSupabaseClient.lt = jest.fn().mockResolvedValueOnce({
                data: [
                    { id: 'run-1', current_state: 'parsing' },
                    { id: 'run-2', current_state: 'validating' },
                ],
                error: null,
            });
            const staleRunIds = await stateMachine.checkStaleLocks(mockSupabaseClient);
            expect(staleRunIds).toEqual(['run-1', 'run-2']);
            expect(mockSupabaseClient.in).toHaveBeenCalledWith('current_state', ['parsing', 'validating', 'loading']);
        });
    });
});
