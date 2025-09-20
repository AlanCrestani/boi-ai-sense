/**
 * Tests for Pipeline 02 Data Cleanser
 */

import { Pipeline02DataCleanser } from '../validators/data-cleanser.js';
// import { MappedRow } from '@conecta-boi/etl-validation/src/index.js';

// Mock temporário para compilação
interface MappedRow {
  raw: string[];
  rowNumber: number;
  mapped: Record<string, any>;
  errors: any[];
}

export async function testDataCleanser(): Promise<void> {
  const cleanser = new Pipeline02DataCleanser();

  // Test 1: Basic cleaning
  const basicRow: MappedRow = {
    raw: ['2024-01-15', 'MANHÃ', 'BAHMAN', 'CUR-001', 'Dieta A', '1000.50', '980.25'],
    rowNumber: 1,
    mapped: {
      data_ref: '2024-01-15',
      turno: 'MANHÃ',
      equipamento: 'BAHMAN',
      curral_codigo: 'CUR-001',
      dieta_nome: 'Dieta A',
      kg_planejado: '1000.50',
      kg_real: '980.25',
    },
    errors: [],
  };

  const basicResult = cleanser.cleanRow(basicRow);
  if (basicResult.cleaned.data_ref !== '2024-01-15') {
    throw new Error('Basic date cleaning failed');
  }

  if (basicResult.cleaned.kg_planejado !== 1000.5) {
    throw new Error('Basic numeric cleaning failed');
  }

  // Test 2: Brazilian date format
  const brazilianDateRow: MappedRow = {
    ...basicRow,
    mapped: {
      ...basicRow.mapped,
      data_ref: '15/01/2024',
    },
  };

  const brazilianResult = cleanser.cleanRow(brazilianDateRow);
  if (brazilianResult.cleaned.data_ref !== '2024-01-15') {
    throw new Error(`Brazilian date conversion failed: expected '2024-01-15', got '${brazilianResult.cleaned.data_ref}'`);
  }

  const dateWarning = brazilianResult.warnings.find(w => w.field === 'data_ref');
  if (!dateWarning) {
    throw new Error('Should have warning for date conversion');
  }

  // Test 3: Equipamento normalization
  const equipamentoVariations = [
    { input: 'bahman', expected: 'BAHMAN' },
    { input: 'BAHMANN', expected: 'BAHMAN' },
    { input: 'silo king', expected: 'SILOKING' },
    { input: 'SILO-KING', expected: 'SILOKING' },
  ];

  for (const variation of equipamentoVariations) {
    const testRow: MappedRow = {
      ...basicRow,
      mapped: {
        ...basicRow.mapped,
        equipamento: variation.input,
      },
    };

    const result = cleanser.cleanRow(testRow);
    if (result.cleaned.equipamento !== variation.expected) {
      throw new Error(`Equipamento normalization failed for '${variation.input}': expected '${variation.expected}', got '${result.cleaned.equipamento}'`);
    }
  }

  // Test 4: Brazilian numeric format
  const brazilianNumericRow: MappedRow = {
    ...basicRow,
    mapped: {
      ...basicRow.mapped,
      kg_planejado: '1.250,50',
      kg_real: '1.200,25',
    },
  };

  const numericResult = cleanser.cleanRow(brazilianNumericRow);
  if (numericResult.cleaned.kg_planejado !== 1250.5) {
    throw new Error(`Brazilian numeric format failed: expected 1250.5, got ${numericResult.cleaned.kg_planejado}`);
  }

  if (numericResult.cleaned.kg_real !== 1200.25) {
    throw new Error(`Brazilian numeric format failed: expected 1200.25, got ${numericResult.cleaned.kg_real}`);
  }

  // Test 5: Text normalization
  const textRow: MappedRow = {
    ...basicRow,
    mapped: {
      ...basicRow.mapped,
      turno: '  manhã  ',
      curral_codigo: 'cur-001',
      dieta_nome: '  Dieta Especial  ',
    },
  };

  const textResult = cleanser.cleanRow(textRow);
  if (textResult.cleaned.turno !== 'MANHÃ') {
    throw new Error(`Text normalization failed for turno: expected 'MANHÃ', got '${textResult.cleaned.turno}'`);
  }

  if (textResult.cleaned.curral_codigo !== 'CUR-001') {
    throw new Error(`Text normalization failed for curral_codigo: expected 'CUR-001', got '${textResult.cleaned.curral_codigo}'`);
  }

  // Test 6: Null/empty handling
  const emptyRow: MappedRow = {
    ...basicRow,
    mapped: {
      ...basicRow.mapped,
      turno: '',
      dieta_nome: null,
      desvio_kg: undefined,
    },
  };

  const emptyResult = cleanser.cleanRow(emptyRow);
  if (emptyResult.cleaned.turno !== null) {
    throw new Error('Empty string should become null');
  }

  if (emptyResult.cleaned.dieta_nome !== null) {
    throw new Error('Null should remain null');
  }

  if (emptyResult.cleaned.desvio_kg !== null) {
    throw new Error('Undefined should become null');
  }

  // Test 7: Currency and format cleaning
  const currencyRow: MappedRow = {
    ...basicRow,
    mapped: {
      ...basicRow.mapped,
      kg_planejado: 'R$ 1.250,50',
      kg_real: '1 200,25 kg',
    },
  };

  const currencyResult = cleanser.cleanRow(currencyRow);
  if (currencyResult.cleaned.kg_planejado !== 1250.5) {
    throw new Error(`Currency cleaning failed: expected 1250.5, got ${currencyResult.cleaned.kg_planejado}`);
  }

  console.log('   ✓ Basic data cleaning');
  console.log('   ✓ Brazilian date format conversion');
  console.log('   ✓ Equipamento normalization');
  console.log('   ✓ Brazilian numeric format support');
  console.log('   ✓ Text normalization and trimming');
  console.log('   ✓ Null/empty value handling');
  console.log('   ✓ Currency and format cleaning');
}