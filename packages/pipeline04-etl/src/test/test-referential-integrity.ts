/**
 * Tests for Pipeline 04 Referential Integrity Service
 * Tests dimension mapping, pending entries, and integrity checks
 */

import { ReferentialIntegrityService } from '../services/referential-integrity.js';
import { MockDimensionLookupService } from '../services/dimension-lookup.js';

export async function testReferentialIntegrity(): Promise<void> {
  const dimensionService = new MockDimensionLookupService();
  const integrityService = new ReferentialIntegrityService(dimensionService);

  // Test 1: Valid data with existing dimensions
  const validData = {
    curral_codigo: 'CUR-001', // Existing
    dieta_nome: 'Dieta A', // Existing
    trateiro: 'João Silva',
  };

  const validResult = await integrityService.checkReferentialIntegrity(validData, 'test-org');

  if (!validResult.isValid) {
    throw new Error('Valid data should pass referential integrity check');
  }

  if (!validResult.mappedDimensions.curralId) {
    throw new Error('Valid curral should be mapped to dimension ID');
  }

  if (!validResult.mappedDimensions.dietaId) {
    throw new Error('Valid dieta should be mapped to dimension ID');
  }

  if (!validResult.mappedDimensions.trateiroId) {
    throw new Error('Trateiro should always be mapped to dimension ID');
  }

  if (validResult.pendingEntries.length > 0) {
    throw new Error('Valid data should not create pending entries');
  }

  // Test 2: Data with unknown curral
  const unknownCurralData = {
    curral_codigo: 'CUR-999', // Non-existing
    dieta_nome: 'Dieta A', // Existing
    trateiro: 'João Silva',
  };

  const unknownCurralResult = await integrityService.checkReferentialIntegrity(unknownCurralData, 'test-org');

  if (!unknownCurralResult.isValid) {
    throw new Error('Unknown curral should still be valid due to pending entry creation');
  }

  if (unknownCurralResult.mappedDimensions.curralId !== null) {
    throw new Error('Unknown curral should not be mapped to dimension ID');
  }

  if (unknownCurralResult.pendingEntries.length !== 1) {
    throw new Error('Unknown curral should create exactly one pending entry');
  }

  if (unknownCurralResult.pendingEntries[0].type !== 'curral') {
    throw new Error('Pending entry should be of type curral');
  }

  if (unknownCurralResult.errors.length === 0) {
    throw new Error('Unknown curral should generate warning error');
  }

  // Test 3: Data with unknown dieta
  const unknownDietaData = {
    curral_codigo: 'CUR-001', // Existing
    dieta_nome: 'Dieta Inexistente', // Non-existing
    trateiro: 'João Silva',
  };

  const unknownDietaResult = await integrityService.checkReferentialIntegrity(unknownDietaData, 'test-org');

  if (!unknownDietaResult.isValid) {
    throw new Error('Unknown dieta should still be valid due to pending entry creation');
  }

  if (unknownDietaResult.mappedDimensions.dietaId !== null) {
    throw new Error('Unknown dieta should not be mapped to dimension ID');
  }

  if (unknownDietaResult.pendingEntries.length !== 1) {
    throw new Error('Unknown dieta should create exactly one pending entry');
  }

  if (unknownDietaResult.pendingEntries[0].type !== 'dieta') {
    throw new Error('Pending entry should be of type dieta');
  }

  // Test 4: Data with null dieta (should be allowed)
  const nullDietaData = {
    curral_codigo: 'CUR-001', // Existing
    dieta_nome: null,
    trateiro: 'João Silva',
  };

  const nullDietaResult = await integrityService.checkReferentialIntegrity(nullDietaData, 'test-org');

  if (!nullDietaResult.isValid) {
    throw new Error('Null dieta should be valid');
  }

  if (nullDietaResult.mappedDimensions.dietaId !== null) {
    throw new Error('Null dieta should map to null dimension ID');
  }

  if (nullDietaResult.pendingEntries.length > 0) {
    throw new Error('Null dieta should not create pending entries');
  }

  // Test 5: Data with both unknown curral and dieta
  const bothUnknownData = {
    curral_codigo: 'CUR-888', // Non-existing
    dieta_nome: 'Dieta X', // Non-existing
    trateiro: 'Maria Santos',
  };

  const bothUnknownResult = await integrityService.checkReferentialIntegrity(bothUnknownData, 'test-org');

  if (!bothUnknownResult.isValid) {
    throw new Error('Both unknown dimensions should still be valid due to pending entries');
  }

  if (bothUnknownResult.pendingEntries.length !== 2) {
    throw new Error('Both unknown dimensions should create exactly two pending entries');
  }

  const hasCurralPending = bothUnknownResult.pendingEntries.some(p => p.type === 'curral');
  const hasDietaPending = bothUnknownResult.pendingEntries.some(p => p.type === 'dieta');

  if (!hasCurralPending || !hasDietaPending) {
    throw new Error('Should have both curral and dieta pending entries');
  }

  // Test 6: Suspicious curral code detection
  const suspiciousData = {
    curral_codigo: 'test-curral-123', // Suspicious name
    dieta_nome: 'Dieta A',
    trateiro: 'João Silva',
  };

  const suspiciousResult = await integrityService.checkReferentialIntegrity(suspiciousData, 'test-org');

  const hasSuspiciousWarning = suspiciousResult.warnings.some(w =>
    w.field === 'curral_codigo' && w.message.includes('suspeito')
  );

  if (!hasSuspiciousWarning) {
    throw new Error('Suspicious curral code should generate warning');
  }

  // Test 7: Long trateiro name warning
  const longNameData = {
    curral_codigo: 'CUR-001',
    dieta_nome: 'Dieta A',
    trateiro: 'A'.repeat(150), // Very long name
  };

  const longNameResult = await integrityService.checkReferentialIntegrity(longNameData, 'test-org');

  const hasLongNameWarning = longNameResult.warnings.some(w =>
    w.field === 'trateiro' && w.message.includes('muito longo')
  );

  if (!hasLongNameWarning) {
    throw new Error('Very long trateiro name should generate warning');
  }

  // Test 8: Potentially duplicate trateiro detection
  const duplicateData = {
    curral_codigo: 'CUR-001',
    dieta_nome: 'Dieta A',
    trateiro: 'João Silva 2', // Potentially duplicate
  };

  const duplicateResult = await integrityService.checkReferentialIntegrity(duplicateData, 'test-org');

  const hasDuplicateWarning = duplicateResult.warnings.some(w =>
    w.field === 'trateiro' && w.message.includes('duplicata')
  );

  if (!hasDuplicateWarning) {
    throw new Error('Potentially duplicate trateiro should generate warning');
  }

  // Test 9: Referential integrity report
  const report = await integrityService.getReferentialIntegrityReport('test-org');

  if (report.summary.totalPending < 3) {
    throw new Error('Should have at least 3 pending entries from previous tests');
  }

  if (report.summary.pendingCurrals < 1) {
    throw new Error('Should have at least 1 pending curral');
  }

  if (report.summary.pendingDietas < 1) {
    throw new Error('Should have at least 1 pending dieta');
  }

  // Test 10: Batch referential integrity check
  const batchData = [
    { curral_codigo: 'CUR-001', dieta_nome: 'Dieta A', trateiro: 'João Silva' }, // Valid
    { curral_codigo: 'CUR-999', dieta_nome: 'Dieta A', trateiro: 'Maria Santos' }, // Unknown curral
    { curral_codigo: 'CUR-001', dieta_nome: 'Dieta Z', trateiro: 'Pedro Oliveira' }, // Unknown dieta
    { curral_codigo: 'CUR-777', dieta_nome: 'Dieta Y', trateiro: 'Ana Costa' }, // Both unknown
  ];

  const batchResult = await integrityService.batchCheckReferentialIntegrity(batchData, 'test-org-batch');

  if (batchResult.summary.totalRecords !== 4) {
    throw new Error('Batch should process 4 records');
  }

  if (batchResult.summary.validRecords !== 4) {
    throw new Error('All batch records should be valid (pending entries allow processing)');
  }

  if (batchResult.summary.recordsWithPendingEntries !== 3) {
    throw new Error('3 batch records should have pending entries');
  }

  if (batchResult.summary.totalPendingEntries !== 4) {
    throw new Error('Batch should create 4 pending entries total');
  }

  // Test 11: Organization isolation
  const isolationResult1 = await integrityService.checkReferentialIntegrity(validData, 'org-1');
  const isolationResult2 = await integrityService.checkReferentialIntegrity(validData, 'org-2');

  if (isolationResult1.mappedDimensions.trateiroId === isolationResult2.mappedDimensions.trateiroId) {
    throw new Error('Different organizations should get different dimension IDs');
  }

  console.log('   ✓ Valid data with existing dimensions');
  console.log('   ✓ Data with unknown curral (pending entry created)');
  console.log('   ✓ Data with unknown dieta (pending entry created)');
  console.log('   ✓ Data with null dieta (allowed)');
  console.log('   ✓ Data with both unknown dimensions');
  console.log('   ✓ Suspicious curral code detection');
  console.log('   ✓ Long trateiro name warning');
  console.log('   ✓ Potentially duplicate trateiro detection');
  console.log('   ✓ Referential integrity report generation');
  console.log('   ✓ Batch referential integrity check');
  console.log('   ✓ Organization isolation verification');
}