/**
 * State Machine Types for ETL Processing
 * Defines states, transitions, and related types for the ETL state machine
 */
/**
 * Possible states for an ETL file/run
 */
export var ETLState;
(function (ETLState) {
    ETLState["UPLOADED"] = "uploaded";
    ETLState["PARSING"] = "parsing";
    ETLState["PARSED"] = "parsed";
    ETLState["VALIDATING"] = "validating";
    ETLState["VALIDATED"] = "validated";
    ETLState["AWAITING_APPROVAL"] = "awaiting_approval";
    ETLState["APPROVED"] = "approved";
    ETLState["LOADING"] = "loading";
    ETLState["LOADED"] = "loaded";
    ETLState["FAILED"] = "failed";
    ETLState["CANCELLED"] = "cancelled";
})(ETLState || (ETLState = {}));
/**
 * Valid state transitions
 */
export const STATE_TRANSITIONS = {
    [ETLState.UPLOADED]: [ETLState.PARSING, ETLState.CANCELLED],
    [ETLState.PARSING]: [ETLState.PARSED, ETLState.FAILED],
    [ETLState.PARSED]: [ETLState.VALIDATING, ETLState.CANCELLED],
    [ETLState.VALIDATING]: [ETLState.VALIDATED, ETLState.FAILED],
    [ETLState.VALIDATED]: [ETLState.AWAITING_APPROVAL, ETLState.LOADING, ETLState.CANCELLED],
    [ETLState.AWAITING_APPROVAL]: [ETLState.APPROVED, ETLState.CANCELLED],
    [ETLState.APPROVED]: [ETLState.LOADING, ETLState.CANCELLED],
    [ETLState.LOADING]: [ETLState.LOADED, ETLState.FAILED],
    [ETLState.LOADED]: [], // Terminal state
    [ETLState.FAILED]: [ETLState.PARSING], // Can retry from failed
    [ETLState.CANCELLED]: [ETLState.PARSING], // Can retry from cancelled
};
/**
 * Default state machine configuration
 */
export const DEFAULT_STATE_MACHINE_CONFIG = {
    requireApproval: false, // Auto-approve by default
    autoRetry: true,
    maxRetries: 3,
    retryDelayMs: 5000, // 5 seconds
    retryBackoffMultiplier: 2, // Exponential backoff
    staleProcessingTimeoutMs: 600000, // 10 minutes
    deadLetterQueueEnabled: true,
};
