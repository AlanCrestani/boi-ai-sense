/**
 * Tests for Pipeline 02 Deviation Calculations
 * Focused on edge cases and complex scenarios
 */
import { Pipeline02BusinessValidator } from '../validators/business-rules.js';
export async function testDeviationCalculations() {
    const validator = new Pipeline02BusinessValidator();
    // Test 1: Basic positive deviation
    const positiveDeviation = {
        data_ref: '2024-01-15',
        turno: 'MANHÃ',
        equipamento: 'BAHMAN',
        curral_codigo: 'CUR-001',
        dieta_nome: 'Dieta A',
        kg_planejado: 1000,
        kg_real: 1200,
    };
    const positiveResult = validator.validateRawData(positiveDeviation);
    if (!positiveResult.isValid) {
        throw new Error('Positive deviation data should be valid');
    }
    const positiveProcessed = validator.processData(positiveResult.data, 'test-org');
    // Expected: desvio_kg = 1200 - 1000 = 200
    if (positiveProcessed.desvio_kg !== 200) {
        throw new Error(`Positive deviation kg incorrect: expected 200, got ${positiveProcessed.desvio_kg}`);
    }
    // Expected: desvio_pct = (200 / 1000) * 100 = 20%
    if (Math.abs(positiveProcessed.desvio_pct - 20) > 0.01) {
        throw new Error(`Positive deviation % incorrect: expected 20, got ${positiveProcessed.desvio_pct}`);
    }
    // Test 2: Basic negative deviation
    const negativeDeviation = {
        ...positiveDeviation,
        kg_real: 800,
    };
    const negativeResult = validator.validateRawData(negativeDeviation);
    const negativeProcessed = validator.processData(negativeResult.data, 'test-org');
    // Expected: desvio_kg = 800 - 1000 = -200
    if (negativeProcessed.desvio_kg !== -200) {
        throw new Error(`Negative deviation kg incorrect: expected -200, got ${negativeProcessed.desvio_kg}`);
    }
    // Expected: desvio_pct = (-200 / 1000) * 100 = -20%
    if (Math.abs(negativeProcessed.desvio_pct - (-20)) > 0.01) {
        throw new Error(`Negative deviation % incorrect: expected -20, got ${negativeProcessed.desvio_pct}`);
    }
    // Test 3: Zero planned weight (edge case)
    const zeroPlanned = {
        ...positiveDeviation,
        kg_planejado: 0,
        kg_real: 100,
    };
    const zeroResult = validator.validateRawData(zeroPlanned);
    // This should fail validation as kg_planejado must be positive
    if (zeroResult.isValid) {
        throw new Error('Zero planned weight should fail validation');
    }
    // Test 4: Perfect match (no deviation)
    const perfectMatch = {
        ...positiveDeviation,
        kg_real: 1000,
    };
    const perfectResult = validator.validateRawData(perfectMatch);
    const perfectProcessed = validator.processData(perfectResult.data, 'test-org');
    if (perfectProcessed.desvio_kg !== 0) {
        throw new Error(`Perfect match deviation kg should be 0, got ${perfectProcessed.desvio_kg}`);
    }
    if (perfectProcessed.desvio_pct !== 0) {
        throw new Error(`Perfect match deviation % should be 0, got ${perfectProcessed.desvio_pct}`);
    }
    // Test 5: Decimal precision
    const decimalTest = {
        ...positiveDeviation,
        kg_planejado: 1000.5,
        kg_real: 1001.25,
    };
    const decimalResult = validator.validateRawData(decimalTest);
    const decimalProcessed = validator.processData(decimalResult.data, 'test-org');
    // Expected: desvio_kg = 1001.25 - 1000.5 = 0.75
    if (Math.abs(decimalProcessed.desvio_kg - 0.75) > 0.001) {
        throw new Error(`Decimal deviation kg incorrect: expected 0.75, got ${decimalProcessed.desvio_kg}`);
    }
    // Expected: desvio_pct = (0.75 / 1000.5) * 100 ≈ 0.075%
    const expectedPct = (0.75 / 1000.5) * 100;
    if (Math.abs(decimalProcessed.desvio_pct - expectedPct) > 0.001) {
        throw new Error(`Decimal deviation % incorrect: expected ${expectedPct}, got ${decimalProcessed.desvio_pct}`);
    }
    // Test 6: Large numbers
    const largeNumbers = {
        ...positiveDeviation,
        kg_planejado: 50000,
        kg_real: 52500,
    };
    const largeResult = validator.validateRawData(largeNumbers);
    const largeProcessed = validator.processData(largeResult.data, 'test-org');
    // Expected: desvio_kg = 52500 - 50000 = 2500
    if (largeProcessed.desvio_kg !== 2500) {
        throw new Error(`Large numbers deviation kg incorrect: expected 2500, got ${largeProcessed.desvio_kg}`);
    }
    // Expected: desvio_pct = (2500 / 50000) * 100 = 5%
    if (Math.abs(largeProcessed.desvio_pct - 5) > 0.01) {
        throw new Error(`Large numbers deviation % incorrect: expected 5, got ${largeProcessed.desvio_pct}`);
    }
    // Test 7: Brazilian format inputs
    const brazilianFormat = {
        ...positiveDeviation,
        kg_planejado: '1.250,50', // 1250.5
        kg_real: '1.000,25', // 1000.25
    };
    const brazilianResult = validator.validateRawData(brazilianFormat);
    const brazilianProcessed = validator.processData(brazilianResult.data, 'test-org');
    // Expected: desvio_kg = 1000.25 - 1250.5 = -250.25
    if (Math.abs(brazilianProcessed.desvio_kg - (-250.25)) > 0.01) {
        throw new Error(`Brazilian format deviation kg incorrect: expected -250.25, got ${brazilianProcessed.desvio_kg}`);
    }
    // Expected: desvio_pct = (-250.25 / 1250.5) * 100 ≈ -20.02%
    const expectedBrazilianPct = (-250.25 / 1250.5) * 100;
    if (Math.abs(brazilianProcessed.desvio_pct - expectedBrazilianPct) > 0.01) {
        throw new Error(`Brazilian format deviation % incorrect: expected ${expectedBrazilianPct}, got ${brazilianProcessed.desvio_pct}`);
    }
    // Test 8: Natural key generation validation
    if (!brazilianProcessed.natural_key.includes('TEST-ORG')) {
        throw new Error(`Natural key should contain organization prefix: ${brazilianProcessed.natural_key}`);
    }
    if (!brazilianProcessed.natural_key.includes('2024-01-15')) {
        throw new Error(`Natural key should contain date: ${brazilianProcessed.natural_key}`);
    }
    console.log('   ✓ Positive deviation calculation');
    console.log('   ✓ Negative deviation calculation');
    console.log('   ✓ Zero planned weight validation');
    console.log('   ✓ Perfect match (zero deviation)');
    console.log('   ✓ Decimal precision handling');
    console.log('   ✓ Large numbers processing');
    console.log('   ✓ Brazilian format input processing');
    console.log('   ✓ Natural key generation');
}
//# sourceMappingURL=test-deviation-calculations.js.map