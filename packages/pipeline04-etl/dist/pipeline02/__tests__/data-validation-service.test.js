/**
 * Tests for Data Validation Service - Pipeline 02
 */
import { DataValidationService, } from '../data-validation-service.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function createTestContext() {
    return {
        organizationId: 'test-org-123',
        fileId: 'test-file-456',
        runId: 'test-run-789',
        processingDate: new Date('2024-01-15T10:00:00Z'),
    };
}
function runDataValidationTests() {
    console.log('Running Data Validation Service Tests...');
    const validationService = new DataValidationService();
    const context = createTestContext();
    // Test 1: Valid data should pass all validations
    console.log('✓ Testing valid data validation...');
    const validData = {
        data: '2024-01-15',
        turno: 'MANHA',
        equipamento: 'BAHMAN',
        curral: 'C001',
        dieta: 'Dieta Engorda',
        kg_planejado: '1500.50',
        kg_real: 1450.25,
    };
    validationService.validateDesvioData(validData, context).then(result => {
        assert(result.isValid, 'Valid data should pass validation');
        assert(result.severity === 'clean', 'Valid data should have clean severity');
        assert(result.errors.length === 0, 'Valid data should have no errors');
        assert(result.cleanedData !== undefined, 'Valid data should have cleaned data');
        assert(result.cleanedData.equipamento === 'BAHMAN', 'Equipment should be normalized');
        assert(Math.abs(result.cleanedData.desvio_kg - (-50.25)) < 0.01, 'Deviation should be calculated correctly');
    }).catch(error => {
        throw new Error(`Valid data test failed: ${error.message}`);
    });
    // Test 2: Missing required fields should fail
    console.log('✓ Testing missing required fields...');
    const missingFieldsData = {
        turno: 'TARDE',
        dieta: 'Dieta Engorda',
    };
    validationService.validateDesvioData(missingFieldsData, context).then(result => {
        assert(!result.isValid, 'Missing required fields should fail validation');
        assert(result.severity === 'critical', 'Missing required fields should be critical');
        assert(result.errors.length > 0, 'Missing required fields should have errors');
        assert(result.errors.some(e => e.code === 'MISSING_REQUIRED'), 'Should have missing required field errors');
    }).catch(error => {
        throw new Error(`Missing fields test failed: ${error.message}`);
    });
    // Test 3: Invalid equipment type should fail
    console.log('✓ Testing invalid equipment filter...');
    const invalidEquipmentData = {
        data: '2024-01-15',
        equipamento: 'INVALID_BRAND',
        curral: 'C001',
        kg_planejado: 1500,
        kg_real: 1450,
    };
    validationService.validateDesvioData(invalidEquipmentData, context).then(result => {
        assert(!result.isValid, 'Invalid equipment should fail validation');
        assert(result.errors.some(e => e.field === 'equipamento'), 'Should have equipment error');
        assert(result.errors.some(e => e.code === 'INVALID_EQUIPMENT'), 'Should have invalid equipment error');
    }).catch(error => {
        throw new Error(`Invalid equipment test failed: ${error.message}`);
    });
    // Test 4: Negative weights should fail
    console.log('✓ Testing negative weight rejection...');
    const negativeWeightData = {
        data: '2024-01-15',
        equipamento: 'SILOKING',
        curral: 'C001',
        kg_planejado: '-100',
        kg_real: 1450,
    };
    validationService.validateDesvioData(negativeWeightData, context).then(result => {
        assert(!result.isValid, 'Negative weights should fail validation');
        assert(result.errors.some(e => e.field === 'kg_planejado'), 'Should have weight error');
        assert(result.errors.some(e => e.code === 'INVALID_WEIGHT'), 'Should have invalid weight error');
    }).catch(error => {
        throw new Error(`Negative weight test failed: ${error.message}`);
    });
    // Test 5: Future dates should be detected
    console.log('✓ Testing future date detection...');
    const futureDateData = {
        data: '2024-01-20', // 5 days in the future from processing date
        equipamento: 'BAHMAN',
        curral: 'C001',
        kg_planejado: 1500,
        kg_real: 1450,
    };
    validationService.validateDesvioData(futureDateData, context).then(result => {
        assert(!result.isValid, 'Future dates should fail validation');
        assert(result.errors.some(e => e.code === 'FUTURE_DATE'), 'Should have future date error');
    }).catch(error => {
        throw new Error(`Future date test failed: ${error.message}`);
    });
    // Test 6: Date format normalization
    console.log('✓ Testing date format normalization...');
    const ddmmyyyyData = {
        data: '15/01/2024', // DD/MM/YYYY format
        equipamento: 'BAHMAN',
        curral: 'C001',
        kg_planejado: 1500,
        kg_real: 1450,
    };
    validationService.validateDesvioData(ddmmyyyyData, context).then(result => {
        assert(result.isValid, 'DD/MM/YYYY format should be valid');
        assert(result.cleanedData.data_ref.getDate() === 15, 'Day should be parsed correctly');
        assert(result.cleanedData.data_ref.getMonth() === 0, 'Month should be parsed correctly (0-indexed)');
        assert(result.cleanedData.data_ref.getFullYear() === 2024, 'Year should be parsed correctly');
    }).catch(error => {
        throw new Error(`Date format test failed: ${error.message}`);
    });
    // Test 7: Curral vs Vagao handling
    console.log('✓ Testing curral vs vagao field handling...');
    const vagaoOnlyData = {
        data: '2024-01-15',
        equipamento: 'BAHMAN',
        vagao: 'V001', // Only vagao, no curral
        kg_planejado: 1500,
        kg_real: 1450,
    };
    validationService.validateDesvioData(vagaoOnlyData, context).then(result => {
        assert(result.isValid, 'Vagao-only data should be valid');
        assert(result.warnings.some(w => w.code === 'USING_VAGAO_AS_CURRAL'), 'Should warn about using vagao as curral');
        assert(result.cleanedData.curral_codigo === 'V001', 'Should use vagao as curral_codigo');
    }).catch(error => {
        throw new Error(`Vagao handling test failed: ${error.message}`);
    });
    // Test 8: Extreme deviation detection
    console.log('✓ Testing extreme deviation detection...');
    const extremeDeviationData = {
        data: '2024-01-15',
        equipamento: 'BAHMAN',
        curral: 'C001',
        kg_planejado: 1000,
        kg_real: 2000, // 100% deviation
    };
    validationService.validateDesvioData(extremeDeviationData, context).then(result => {
        assert(result.isValid, 'Extreme deviation should still be valid');
        assert(result.warnings.some(w => w.code === 'EXTREME_DEVIATION'), 'Should warn about extreme deviation');
        assert(result.cleanedData.desvio_pct === 100, 'Should calculate 100% deviation');
    }).catch(error => {
        throw new Error(`Extreme deviation test failed: ${error.message}`);
    });
    // Test 9: Natural key generation
    console.log('✓ Testing natural key generation...');
    const naturalKeyData = {
        data: '2024-01-15',
        turno: 'MANHA',
        equipamento: 'BAHMAN',
        curral: 'C001',
        kg_planejado: 1500,
        kg_real: 1450,
    };
    validationService.validateDesvioData(naturalKeyData, context).then(result => {
        assert(result.isValid, 'Natural key data should be valid');
        const expectedKey = '2024-01-15|BAHMAN|C001|MANHA';
        assert(result.cleanedData.natural_key === expectedKey, `Natural key should be "${expectedKey}", got "${result.cleanedData.natural_key}"`);
    }).catch(error => {
        throw new Error(`Natural key test failed: ${error.message}`);
    });
    // Test 10: Configuration updates
    console.log('✓ Testing configuration updates...');
    const originalConfig = validationService.getConfig();
    assert(originalConfig.allowedEquipmentTypes.length === 2, 'Should have default equipment types');
    validationService.updateConfig({ allowFutureDates: true, maxDaysInFuture: 7 });
    const updatedConfig = validationService.getConfig();
    assert(updatedConfig.allowFutureDates === true, 'Should update future date setting');
    assert(updatedConfig.maxDaysInFuture === 7, 'Should update max future days');
    // Test 11: Batch validation
    console.log('✓ Testing batch validation...');
    const batchData = [
        {
            data: '2024-01-15',
            equipamento: 'BAHMAN',
            curral: 'C001',
            kg_planejado: 1500,
            kg_real: 1450,
        },
        {
            data: '2024-01-15',
            equipamento: 'INVALID',
            curral: 'C002',
            kg_planejado: 1200,
            kg_real: 1180,
        },
        {
            // Missing required fields
            turno: 'TARDE',
        },
    ];
    validationService.validateBatch(batchData, context).then(batchResult => {
        assert(batchResult.results.length === 3, 'Should have 3 validation results');
        assert(batchResult.summary.total === 3, 'Summary should show 3 total records');
        assert(batchResult.summary.valid === 1, 'Summary should show 1 valid record');
        assert(batchResult.summary.withErrors === 1, 'Summary should show 1 record with errors');
        assert(batchResult.summary.critical === 1, 'Summary should show 1 critical record');
    }).catch(error => {
        throw new Error(`Batch validation test failed: ${error.message}`);
    });
    // Test 12: Weight precision and rounding
    console.log('✓ Testing weight precision and rounding...');
    const precisionData = {
        data: '2024-01-15',
        equipamento: 'BAHMAN',
        curral: 'C001',
        kg_planejado: '1500.123456',
        kg_real: '1450.987654',
    };
    validationService.validateDesvioData(precisionData, context).then(result => {
        assert(result.isValid, 'Precision data should be valid');
        assert(Math.abs(result.cleanedData.kg_planejado - 1500.123456) < 0.000001, 'Should preserve original precision for weights');
        // Calculate expected deviation: 1450.987654 - 1500.123456 = -49.135802
        // Rounded to 2 decimal places: -49.14
        const expectedDeviation = -49.14;
        assert(Math.abs(result.cleanedData.desvio_kg - expectedDeviation) < 0.01, `Should round deviation to 2 decimal places. Expected: ${expectedDeviation}, Got: ${result.cleanedData.desvio_kg}`);
    }).catch(error => {
        throw new Error(`Precision test failed: ${error.message}`);
    });
    console.log('🎉 All data validation tests passed!');
}
export { runDataValidationTests };
// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        runDataValidationTests();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
