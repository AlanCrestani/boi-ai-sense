/**
 * Test runner for Pipeline 04 ETL
 */

import { testBusinessRules } from './test-business-rules.js';
import { testDataCleanser } from './test-data-cleanser.js';
import { testDimensionLookup } from './test-dimension-lookup.js';
import { testUpsertLogic } from './test-upsert-logic.js';
import { testReferentialIntegrity } from './test-referential-integrity.js';
import { runAllPipeline02Tests } from '../pipeline02/test-runner.js';
import { runPipeline02E2ETests } from '../pipeline02/__tests__/pipeline02-e2e.test.js';
import { runStagingCleanupTests } from '../state-machine/__tests__/staging-cleanup-service.test.js';
import { runOptimisticLockingTests } from '../state-machine/__tests__/optimistic-locking-service.test.js';
import { runRetryLogicTests } from '../state-machine/__tests__/retry-logic-service.test.js';

async function runTests(): Promise<void> {
  console.log('🧪 Running Pipeline 04 ETL Test Suite\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Business Rules Validator', fn: testBusinessRules },
    { name: 'Data Cleanser', fn: testDataCleanser },
    { name: 'Dimension Lookup Service', fn: testDimensionLookup },
    { name: 'UPSERT Logic', fn: testUpsertLogic },
    { name: 'Referential Integrity Service', fn: testReferentialIntegrity },
    { name: 'Pipeline 02 - Data Validation Service', fn: runAllPipeline02Tests },
    { name: 'Pipeline 02 - End-to-End Integration', fn: runPipeline02E2ETests },
    { name: 'State Machine - Staging Cleanup Service', fn: runStagingCleanupTests },
    { name: 'State Machine - Optimistic Locking and Concurrency Control', fn: runOptimisticLockingTests },
  ];

  for (const test of tests) {
    try {
      console.log(`▶️  Running ${test.name} tests...`);
      await test.fn();
      console.log(`✅ ${test.name} tests passed\n`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} tests failed: ${error instanceof Error ? error.message : error}\n`);
      failed++;
    }
  }

  const duration = Date.now() - startTime;

  console.log('📊 Test Summary');
  console.log('================');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}ms\n`);

  if (failed > 0) {
    console.log('❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}