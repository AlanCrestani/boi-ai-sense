/**
 * Tests for Pipeline 04 Business Rules Validation
 * Tests feeding treatment data validation logic
 */

import { Pipeline04BusinessValidator } from '../validators/business-rules.js';

export async function testBusinessRules(): Promise<void> {
  const validator = new Pipeline04BusinessValidator();

  // Test 1: Valid feeding treatment data
  const validData = {
    data_ref: '2024-12-15',
    hora: '08:30',
    turno: 'MANHÃ',
    curral_codigo: 'CUR-001',
    trateiro: 'João Silva',
    dieta_nome: 'Dieta A',
    tipo_trato: 'RAÇÃO',
    quantidade_kg: 150.5,
    quantidade_cabecas: 25,
    observacoes: 'Trato normal',
  };

  const validResult = validator.validateRawData(validData);
  if (!validResult.isValid) {
    throw new Error(`Valid data should pass validation: ${validResult.errors.map(e => e.message).join(', ')}`);
  }

  // Process data to get natural key and datetime
  const processedData = validator.processData(validResult.data!, 'test-org-123');
  if (!processedData.natural_key.includes('TESTORG123')) {
    throw new Error(`Natural key should contain organization prefix, got: ${processedData.natural_key}`);
  }

  if (processedData.datetime_trato.getHours() !== 8 || processedData.datetime_trato.getMinutes() !== 30) {
    throw new Error('DateTime should combine date and time correctly');
  }

  // Test 2: Invalid turno
  const invalidTurno = { ...validData, turno: 'INVALID_TURNO' };
  const turnoResult = validator.validateRawData(invalidTurno);
  if (turnoResult.isValid) {
    throw new Error('Invalid turno should be rejected');
  }

  // Test 3: Future date rejection
  const futureData = { ...validData, data_ref: '2025-12-15' };
  const futureResult = validator.validateRawData(futureData);
  if (futureResult.isValid) {
    throw new Error('Future date should be rejected');
  }

  // Test 4: Invalid time format
  const invalidTime = { ...validData, hora: '25:30' };
  const timeResult = validator.validateRawData(invalidTime);
  if (timeResult.isValid) {
    throw new Error('Invalid time should be rejected');
  }

  // Test 5: Negative quantity rejection
  const negativeQuantity = { ...validData, quantidade_kg: -50 };
  const negativeResult = validator.validateRawData(negativeQuantity);
  if (negativeResult.isValid) {
    throw new Error('Negative quantity should be rejected');
  }

  // Test 6: Business logic validation - basic check
  validator.validateBusinessLogic(processedData);

  // Test with suspicious time (late night)
  const lateNightData = {
    ...processedData,
    hora: '23:30',
    datetime_trato: new Date('2024-12-15T23:30:00'),
  };
  const lateResult = validator.validateBusinessLogic(lateNightData);
  const hasSuspiciousTimeWarning = lateResult.errors.some(e => e.code === 'SUSPICIOUS_TIME');
  if (!hasSuspiciousTimeWarning) {
    throw new Error('Late night feeding should trigger suspicious time warning');
  }

  // Test 7: Turno consistency check
  const inconsistentTurno = {
    ...processedData,
    hora: '14:00', // Afternoon time
    turno: 'MANHÃ' as const, // Morning shift
    datetime_trato: new Date('2024-12-15T14:00:00'),
  };
  const inconsistentResult = validator.validateBusinessLogic(inconsistentTurno);
  const hasInconsistentShift = inconsistentResult.errors.some(e => e.code === 'INCONSISTENT_SHIFT');
  if (!hasInconsistentShift) {
    throw new Error('Inconsistent turno should be detected');
  }

  // Test 8: Excessive quantity warning
  const excessiveQuantity = {
    ...processedData,
    quantidade_kg: 6000, // Very high amount
  };
  const excessiveResult = validator.validateBusinessLogic(excessiveQuantity);
  const hasExcessiveWarning = excessiveResult.errors.some(e => e.code === 'EXCESSIVE_QUANTITY');
  if (!hasExcessiveWarning) {
    throw new Error('Excessive quantity should trigger warning');
  }

  // Test 9: Nullable dieta handling
  const nullDietaData = { ...validData, dieta_nome: null };
  const nullDietaResult = validator.validateRawData(nullDietaData);
  if (!nullDietaResult.isValid) {
    throw new Error('Null dieta should be allowed');
  }

  // Test 10: Tipo trato validation
  const validTipos = ['RAÇÃO', 'VOLUMOSO', 'MINERAL', 'MEDICAMENTO'];
  for (const tipo of validTipos) {
    const tipoData = { ...validData, tipo_trato: tipo };
    const tipoResult = validator.validateRawData(tipoData);
    if (!tipoResult.isValid) {
      throw new Error(`Valid tipo_trato '${tipo}' should be accepted`);
    }
  }

  console.log('   ✓ Valid feeding treatment data validation');
  console.log('   ✓ Invalid turno rejection');
  console.log('   ✓ Future date rejection');
  console.log('   ✓ Invalid time format rejection');
  console.log('   ✓ Negative quantity rejection');
  console.log('   ✓ Suspicious time detection');
  console.log('   ✓ Turno consistency check');
  console.log('   ✓ Excessive quantity warning');
  console.log('   ✓ Nullable dieta handling');
  console.log('   ✓ Tipo trato validation');
}