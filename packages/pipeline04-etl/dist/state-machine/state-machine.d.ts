/**
 * ETL State Machine Implementation
 * Manages state transitions and enforces business rules
 */
import { ETLState, StateTransitionRequest, StateTransitionResult, StateMachineConfig } from './types.js';
export declare class ETLStateMachine {
    private config;
    constructor(config?: Partial<StateMachineConfig>);
    /**
     * Check if a state transition is valid
     */
    isValidTransition(fromState: ETLState, toState: ETLState): boolean;
    /**
     * Get all valid next states from current state
     */
    getValidNextStates(currentState: ETLState): ETLState[];
    /**
     * Transition to a new state
     */
    transitionState(request: StateTransitionRequest, supabaseClient: any): Promise<StateTransitionResult>;
    /**
     * Update file state with optimistic locking
     */
    private updateFileState;
    /**
     * Update run state with optimistic locking
     */
    private updateRunState;
    /**
     * Log state transition
     */
    private logTransition;
    /**
     * Check for stale processing locks
     */
    checkStaleLocks(supabaseClient: any): Promise<string[]>;
    /**
     * Release stale lock and transition to failed state
     */
    releaseStaLock(supabaseClient: any, runId: string, reason?: string): Promise<StateTransitionResult>;
    /**
     * Calculate next retry time with exponential backoff
     */
    calculateNextRetryTime(retryCount: number): Date;
    /**
     * Check if retry is allowed
     */
    canRetry(retryCount: number): boolean;
    /**
     * Handle failure with retry logic
     */
    handleFailure(supabaseClient: any, runId: string, error: string, isTransient?: boolean): Promise<{
        shouldRetry: boolean;
        nextRetryAt?: Date;
    }>;
    /**
     * Move failed run to dead letter queue
     */
    private moveToDeadLetterQueue;
}
