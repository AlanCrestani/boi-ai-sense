/**
 * Tests for Pipeline 02 Business Rules Validator
 */

import { Pipeline02BusinessValidator } from '../validators/business-rules.js';

export async function testBusinessRules(): Promise<void> {
  const validator = new Pipeline02BusinessValidator();

  // Test 1: Valid data
  const validData = {
    data_ref: '2024-01-15',
    turno: 'MANHÃ',
    equipamento: 'BAHMAN',
    curral_codigo: 'CUR-001',
    dieta_nome: 'Dieta A',
    kg_planejado: 1000,
    kg_real: 980,
    desvio_kg: -20,
    desvio_pct: -2,
  };

  const validResult = validator.validateRawData(validData);
  if (!validResult.isValid) {
    throw new Error(`Valid data should pass validation: ${validResult.errors.map(e => e.message).join(', ')}`);
  }

  // Test 2: Invalid equipamento
  const invalidEquipamento = {
    ...validData,
    equipamento: 'INVALID_EQUIP',
  };

  const invalidResult = validator.validateRawData(invalidEquipamento);
  if (invalidResult.isValid) {
    throw new Error('Invalid equipamento should fail validation');
  }

  const equipamentoError = invalidResult.errors.find(e => e.field === 'equipamento');
  if (!equipamentoError) {
    throw new Error('Should have equipamento validation error');
  }

  // Test 3: Future date
  const futureDate = {
    ...validData,
    data_ref: '2030-01-01',
  };

  const futureDateResult = validator.validateRawData(futureDate);
  if (futureDateResult.isValid) {
    throw new Error('Future date should fail validation');
  }

  // Test 4: Negative kg_planejado
  const negativeKg = {
    ...validData,
    kg_planejado: -100,
  };

  const negativeResult = validator.validateRawData(negativeKg);
  if (negativeResult.isValid) {
    throw new Error('Negative kg_planejado should fail validation');
  }

  // Test 5: Brazilian decimal format
  const brazilianFormat = {
    ...validData,
    kg_planejado: '1.250,50',
    kg_real: '1.200,25',
  };

  const brazilianResult = validator.validateRawData(brazilianFormat);
  if (!brazilianResult.isValid) {
    throw new Error(`Brazilian format should be accepted: ${brazilianResult.errors.map(e => e.message).join(', ')}`);
  }

  if (brazilianResult.data!.kg_planejado !== 1250.5) {
    throw new Error(`Brazilian format not parsed correctly: expected 1250.5, got ${brazilianResult.data!.kg_planejado}`);
  }

  // Test 6: Process data and calculate deviations
  const processedData = validator.processData(validResult.data!, 'test-org-123');

  if (processedData.desvio_kg !== -20) {
    throw new Error(`Desvio kg calculation incorrect: expected -20, got ${processedData.desvio_kg}`);
  }

  if (Math.abs(processedData.desvio_pct - (-2)) > 0.01) {
    throw new Error(`Desvio percentage calculation incorrect: expected -2, got ${processedData.desvio_pct}`);
  }

  if (!processedData.natural_key.includes('TEST-ORG')) {
    throw new Error(`Natural key should contain organization ID: ${processedData.natural_key}`);
  }

  // Test 7: Business logic validation (extreme values)
  const extremeData = {
    ...processedData,
    kg_real: processedData.kg_planejado * 5, // 5x planned = extreme
    desvio_kg: processedData.kg_planejado * 4,
    desvio_pct: 400,
  };

  const businessValidation = validator.validateBusinessLogic(extremeData);
  if (businessValidation.isValid) {
    throw new Error('Extreme deviation should trigger business logic warnings');
  }

  const suspiciousError = businessValidation.errors.find(e => e.code === 'SUSPICIOUS_VALUE');
  if (!suspiciousError) {
    throw new Error('Should have suspicious value error');
  }

  console.log('   ✓ Valid data validation');
  console.log('   ✓ Invalid equipamento rejection');
  console.log('   ✓ Future date rejection');
  console.log('   ✓ Negative values rejection');
  console.log('   ✓ Brazilian decimal format support');
  console.log('   ✓ Deviation calculations');
  console.log('   ✓ Natural key generation');
  console.log('   ✓ Business logic validation');
}