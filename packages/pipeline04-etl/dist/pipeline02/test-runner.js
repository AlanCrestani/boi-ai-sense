/**
 * Test Runner for Pipeline 02 - Desvio de Carregamento
 */
import { runDataValidationTests } from './__tests__/data-validation-service.test.js';
import { runUpsertServiceTests, runDimensionLookupTests } from './__tests__/upsert-service.test.js';
export async function runAllPipeline02Tests() {
    console.log('\n🧪 Running Pipeline 02 Tests...\n');
    try {
        // Run data validation tests
        await runDataValidationTests();
        // Run UPSERT service tests
        await runUpsertServiceTests();
        // Run dimension lookup tests
        await runDimensionLookupTests();
        console.log('\n✅ All Pipeline 02 tests completed successfully!\n');
    }
    catch (error) {
        console.error('\n❌ Pipeline 02 tests failed:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllPipeline02Tests()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
