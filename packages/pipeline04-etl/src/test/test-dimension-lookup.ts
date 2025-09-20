/**
 * Tests for Pipeline 04 Dimension Lookup Service
 * Tests dimension mapping and pending entry creation
 */

import { MockDimensionLookupService } from '../services/dimension-lookup.js';

export async function testDimensionLookup(): Promise<void> {
  const dimensionService = new MockDimensionLookupService();

  // Test 1: Existing curral lookup
  const existingCurralId1 = await dimensionService.lookupCurralId('CUR-001', 'test-org');
  if (!existingCurralId1) {
    throw new Error('Existing curral should return ID');
  }

  // Test 2: Consistent curral lookup (same result)
  const existingCurralId2 = await dimensionService.lookupCurralId('CUR-001', 'test-org');
  if (existingCurralId1 !== existingCurralId2) {
    throw new Error('Curral lookups should be consistent');
  }

  // Test 3: Non-existing curral lookup
  const nonExistingCurralId = await dimensionService.lookupCurralId('CUR-999', 'test-org');
  if (nonExistingCurralId !== null) {
    throw new Error('Non-existing curral should return null');
  }

  // Test 4: Create pending curral entry
  const pendingCurralId = await dimensionService.createPendingCurral('CUR-999', 'test-org');
  if (!pendingCurralId.startsWith('pending-curral-')) {
    throw new Error('Pending curral should have correct ID format');
  }

  // Test 5: Existing dieta lookup
  const existingDietaId = await dimensionService.lookupDietaId('Dieta A', 'test-org');
  if (!existingDietaId) {
    throw new Error('Existing dieta should return ID');
  }

  // Test 6: Null dieta handling
  const nullDietaId = await dimensionService.lookupDietaId(null, 'test-org');
  if (nullDietaId !== null) {
    throw new Error('Null dieta should return null');
  }

  // Test 7: Non-existing dieta lookup
  const nonExistingDietaId = await dimensionService.lookupDietaId('Dieta Inexistente', 'test-org');
  if (nonExistingDietaId !== null) {
    throw new Error('Non-existing dieta should return null');
  }

  // Test 8: Create pending dieta entry
  const pendingDietaId = await dimensionService.createPendingDieta('Dieta Inexistente', 'test-org');
  if (!pendingDietaId.startsWith('pending-dieta-')) {
    throw new Error('Pending dieta should have correct ID format');
  }

  // Test 9: Trateiro lookup (always creates if not exists)
  const trateiroId1 = await dimensionService.lookupTrateiroId('João Silva', 'test-org');
  if (!trateiroId1) {
    throw new Error('Trateiro should always return ID');
  }

  const trateiroId2 = await dimensionService.lookupTrateiroId('João Silva', 'test-org');
  if (trateiroId1 !== trateiroId2) {
    throw new Error('Trateiro lookups should be consistent');
  }

  // Test 10: Different organization should get different IDs
  const orgACurralId = await dimensionService.lookupCurralId('CUR-001', 'org-a');
  const orgBCurralId = await dimensionService.lookupCurralId('CUR-001', 'org-b');
  if (orgACurralId === orgBCurralId) {
    throw new Error('Different organizations should get different dimension IDs');
  }

  // Test 11: Get pending entries
  const pendingEntries = await dimensionService.getPendingEntries('test-org');
  if (pendingEntries.length < 2) {
    throw new Error('Should have at least 2 pending entries (curral and dieta)');
  }

  const pendingCurral = pendingEntries.find(e => e.type === 'curral' && e.code === 'CUR-999');
  if (!pendingCurral) {
    throw new Error('Should find pending curral entry');
  }

  const pendingDieta = pendingEntries.find(e => e.type === 'dieta' && e.code === 'Dieta Inexistente');
  if (!pendingDieta) {
    throw new Error('Should find pending dieta entry');
  }

  // Test 12: Resolve pending entry
  await dimensionService.resolvePendingEntry(pendingCurralId, 'resolved-curral-999', 'admin-user');

  // After resolution, lookup should return the resolved ID
  const resolvedCurralId = await dimensionService.lookupCurralId('CUR-999', 'test-org');
  if (resolvedCurralId !== 'resolved-curral-999') {
    throw new Error('Resolved curral should return the resolved ID');
  }

  // Test 13: Deterministic UUID generation
  const uuid1 = await dimensionService.lookupTrateiroId('Test User', 'test-org');
  const uuid2 = await dimensionService.lookupTrateiroId('Test User', 'test-org');
  if (uuid1 !== uuid2) {
    throw new Error('UUIDs should be deterministic for same input');
  }

  console.log('   ✓ Existing curral lookup');
  console.log('   ✓ Consistent curral lookup');
  console.log('   ✓ Non-existing curral lookup');
  console.log('   ✓ Create pending curral entry');
  console.log('   ✓ Existing dieta lookup');
  console.log('   ✓ Null dieta handling');
  console.log('   ✓ Non-existing dieta lookup');
  console.log('   ✓ Create pending dieta entry');
  console.log('   ✓ Trateiro lookup (auto-create)');
  console.log('   ✓ Organization-specific dimension IDs');
  console.log('   ✓ Get pending entries');
  console.log('   ✓ Resolve pending entry');
  console.log('   ✓ Deterministic UUID generation');
}