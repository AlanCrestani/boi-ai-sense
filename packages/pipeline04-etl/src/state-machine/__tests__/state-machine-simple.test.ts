/**
 * Simple Tests for ETL State Machine - Node.js compatible
 */

import { ETLStateMachine } from '../state-machine.js';
import { ETLState } from '../types.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('Running ETL State Machine Tests...');

  const stateMachine = new ETLStateMachine();

  // Test valid state transitions
  console.log('✓ Testing valid state transitions...');
  assert(stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.PARSING), 'uploaded -> parsing should be valid');
  assert(stateMachine.isValidTransition(ETLState.PARSING, ETLState.PARSED), 'parsing -> parsed should be valid');
  assert(stateMachine.isValidTransition(ETLState.PARSED, ETLState.VALIDATING), 'parsed -> validating should be valid');
  assert(stateMachine.isValidTransition(ETLState.VALIDATING, ETLState.VALIDATED), 'validating -> validated should be valid');
  assert(stateMachine.isValidTransition(ETLState.VALIDATED, ETLState.LOADING), 'validated -> loading should be valid');
  assert(stateMachine.isValidTransition(ETLState.LOADING, ETLState.LOADED), 'loading -> loaded should be valid');

  // Test invalid state transitions
  console.log('✓ Testing invalid state transitions...');
  assert(!stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.LOADED), 'uploaded -> loaded should be invalid');
  assert(!stateMachine.isValidTransition(ETLState.LOADED, ETLState.PARSING), 'loaded -> parsing should be invalid');
  assert(!stateMachine.isValidTransition(ETLState.PARSING, ETLState.LOADING), 'parsing -> loading should be invalid');

  // Test cancellation transitions
  console.log('✓ Testing cancellation transitions...');
  assert(stateMachine.isValidTransition(ETLState.UPLOADED, ETLState.CANCELLED), 'uploaded -> cancelled should be valid');
  assert(stateMachine.isValidTransition(ETLState.PARSED, ETLState.CANCELLED), 'parsed -> cancelled should be valid');
  assert(stateMachine.isValidTransition(ETLState.VALIDATED, ETLState.CANCELLED), 'validated -> cancelled should be valid');

  // Test failure transitions
  console.log('✓ Testing failure transitions...');
  assert(stateMachine.isValidTransition(ETLState.PARSING, ETLState.FAILED), 'parsing -> failed should be valid');
  assert(stateMachine.isValidTransition(ETLState.VALIDATING, ETLState.FAILED), 'validating -> failed should be valid');
  assert(stateMachine.isValidTransition(ETLState.LOADING, ETLState.FAILED), 'loading -> failed should be valid');

  // Test retry transitions
  console.log('✓ Testing retry transitions...');
  assert(stateMachine.isValidTransition(ETLState.FAILED, ETLState.PARSING), 'failed -> parsing should be valid (retry)');
  assert(stateMachine.isValidTransition(ETLState.CANCELLED, ETLState.PARSING), 'cancelled -> parsing should be valid (retry)');

  // Test valid next states
  console.log('✓ Testing valid next states...');
  const uploadedNextStates = stateMachine.getValidNextStates(ETLState.UPLOADED);
  assert(uploadedNextStates.includes(ETLState.PARSING), 'uploaded should allow transition to parsing');
  assert(uploadedNextStates.includes(ETLState.CANCELLED), 'uploaded should allow transition to cancelled');

  const loadedNextStates = stateMachine.getValidNextStates(ETLState.LOADED);
  assert(loadedNextStates.length === 0, 'loaded should be terminal state with no next states');

  // Test retry logic
  console.log('✓ Testing retry logic...');
  assert(stateMachine.canRetry(0), 'should allow retry at count 0');
  assert(stateMachine.canRetry(1), 'should allow retry at count 1');
  assert(stateMachine.canRetry(2), 'should allow retry at count 2');
  assert(!stateMachine.canRetry(3), 'should not allow retry at count 3 (max retries exceeded)');

  // Test exponential backoff calculation
  console.log('✓ Testing exponential backoff...');
  const retry0 = stateMachine.calculateNextRetryTime(0);
  const retry1 = stateMachine.calculateNextRetryTime(1);
  const retry2 = stateMachine.calculateNextRetryTime(2);

  const now = Date.now();
  assert(retry0.getTime() > now + 4000, 'first retry should be after ~5 seconds');
  assert(retry1.getTime() > now + 9000, 'second retry should be after ~10 seconds');
  assert(retry2.getTime() > now + 19000, 'third retry should be after ~20 seconds');

  console.log('🎉 All tests passed!');
}

export { runTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}