/**
 * Comprehensive test suite for ETL validation package
 * Tests separator detection, streaming parsing, header mapping, and batch processing
 */
import { testSeparatorDetection } from './test-separator-detection.js';
import { testStreamingParser } from './test-streaming-parser.js';
import { testHeaderMapping } from './test-header-mapping.js';
import { testPipelineConfigs } from './test-pipeline-configs.js';
async function runAllTests() {
    console.log('🧪 Running ETL Validation Test Suite\n');
    const tests = [
        { name: 'Separator Detection', test: testSeparatorDetection },
        { name: 'Streaming Parser', test: testStreamingParser },
        { name: 'Header Mapping', test: testHeaderMapping },
        { name: 'Pipeline Configs', test: testPipelineConfigs },
    ];
    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;
    for (const { name, test } of tests) {
        const startTime = Date.now();
        try {
            console.log(`▶️  Running ${name} tests...`);
            await test();
            const duration = Date.now() - startTime;
            results.push({ name, passed: true, duration });
            totalPassed++;
            console.log(`✅ ${name} tests passed (${duration}ms)\n`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({ name, passed: false, duration, error: errorMessage });
            totalFailed++;
            console.log(`❌ ${name} tests failed (${duration}ms): ${errorMessage}\n`);
        }
    }
    // Print summary
    console.log('📊 Test Summary');
    console.log('================');
    console.log(`Total tests: ${tests.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${((totalPassed / tests.length) * 100).toFixed(1)}%`);
    if (totalFailed > 0) {
        console.log('\n❌ Failed tests:');
        results.filter(r => !r.passed).forEach(result => {
            console.log(`   - ${result.name}: ${result.error}`);
        });
        process.exit(1);
    }
    else {
        console.log('\n🎉 All tests passed!');
    }
}
// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}
