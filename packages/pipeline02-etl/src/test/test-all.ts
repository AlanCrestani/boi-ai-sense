/**
 * Test runner for Pipeline 02 ETL
 */

import { testBusinessRules } from './test-business-rules.js';
import { testDataCleanser } from './test-data-cleanser.js';
import { testDeviationCalculations } from './test-deviation-calculations.js';
import { testUpsertLogic } from './test-upsert-logic.js';

async function runTests(): Promise<void> {
  console.log('🧪 Running Pipeline 02 ETL Test Suite\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Business Rules Validator', fn: testBusinessRules },
    { name: 'Data Cleanser', fn: testDataCleanser },
    { name: 'Deviation Calculations', fn: testDeviationCalculations },
    { name: 'UPSERT Logic', fn: testUpsertLogic },
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