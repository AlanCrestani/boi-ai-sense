/**
 * Tests for Pipeline 04 Data Cleanser
 * Tests data cleaning and normalization for feeding treatment data
 */

import { Pipeline04DataCleanser } from '../validators/data-cleanser.js';

export async function testDataCleanser(): Promise<void> {
  const cleanser = new Pipeline04DataCleanser();

  // Test 1: Basic data cleaning
  const basicData = {
    raw: ['15/12/2024', '08:30', 'MANHÃ', 'CUR-001', 'João Silva', 'Dieta A', 'RAÇÃO', '150.5', '25', 'Observação'],
    rowNumber: 1,
    mapped: {
      data_ref: '15/12/2024',
      hora: '08:30',
      turno: 'manhã', // lowercase
      curral_codigo: 'cur-001', // lowercase
      trateiro: '  João Silva  ', // extra spaces
      dieta_nome: 'Dieta A',
      tipo_trato: 'racao', // lowercase
      quantidade_kg: '150.5',
      quantidade_cabecas: '25',
      observacoes: 'Observação',
    },
    errors: [],
  };

  const basicResult = cleanser.cleanRow(basicData);
  if (basicResult.cleaned.turno !== 'MANHÃ') {
    throw new Error('Turno should be normalized to uppercase');
  }
  if (basicResult.cleaned.curral_codigo !== 'CUR-001') {
    throw new Error('Curral code should be normalized to uppercase');
  }
  if (basicResult.cleaned.trateiro !== 'João Silva') {
    throw new Error('Trateiro name should be trimmed and capitalized');
  }
  if (basicResult.cleaned.tipo_trato !== 'RAÇÃO') {
    throw new Error('Tipo trato should be normalized');
  }

  // Test 2: Brazilian date format conversion
  const brazilianDateData = {
    raw: ['15/12/2024'],
    rowNumber: 1,
    mapped: { data_ref: '15/12/2024' },
    errors: [],
  };

  const dateResult = cleanser.cleanRow(brazilianDateData);
  if (dateResult.cleaned.data_ref !== '2024-12-15') {
    throw new Error('Brazilian date should be converted to ISO format');
  }
  if (!dateResult.warnings.some(w => w.message.includes('Data convertida'))) {
    throw new Error('Date conversion should generate warning');
  }

  // Test 3: Time format normalization
  const timeData = {
    raw: ['0830'],
    rowNumber: 1,
    mapped: { hora: '0830' },
    errors: [],
  };

  const timeResult = cleanser.cleanRow(timeData);
  if (timeResult.cleaned.hora !== '08:30') {
    throw new Error('Time should be formatted with colon');
  }

  // Test 4: Turno normalization
  const turnoMappings = [
    { input: 'manha', expected: 'MANHÃ' },
    { input: 'morning', expected: 'MANHÃ' },
    { input: 'matutino', expected: 'MANHÃ' },
    { input: 'vespertino', expected: 'TARDE' },
    { input: 'noturno', expected: 'NOITE' },
  ];

  for (const mapping of turnoMappings) {
    const turnoData = {
      raw: [mapping.input],
      rowNumber: 1,
      mapped: { turno: mapping.input },
      errors: [],
    };

    const turnoResult = cleanser.cleanRow(turnoData);
    if (turnoResult.cleaned.turno !== mapping.expected) {
      throw new Error(`Turno '${mapping.input}' should be normalized to '${mapping.expected}'`);
    }
  }

  // Test 5: Curral code cleaning
  const curralData = {
    raw: ['cur@-001#'],
    rowNumber: 1,
    mapped: { curral_codigo: 'cur@-001#' },
    errors: [],
  };

  const curralResult = cleanser.cleanRow(curralData);
  if (curralResult.cleaned.curral_codigo !== 'CUR-001') {
    throw new Error('Curral code should remove special characters and normalize');
  }

  // Test 6: Trateiro name capitalization
  const trateiroData = {
    raw: ['joão silva santos'],
    rowNumber: 1,
    mapped: { trateiro: 'joão silva santos' },
    errors: [],
  };

  const trateiroResult = cleanser.cleanRow(trateiroData);
  if (trateiroResult.cleaned.trateiro !== 'João Silva Santos') {
    throw new Error('Trateiro name should be properly capitalized');
  }

  // Test 7: Tipo trato normalization
  const tipoMappings = [
    { input: 'racao', expected: 'RAÇÃO' },
    { input: 'feed', expected: 'RAÇÃO' },
    { input: 'roughage', expected: 'VOLUMOSO' },
    { input: 'medicine', expected: 'MEDICAMENTO' },
  ];

  for (const mapping of tipoMappings) {
    const tipoData = {
      raw: [mapping.input],
      rowNumber: 1,
      mapped: { tipo_trato: mapping.input },
      errors: [],
    };

    const tipoResult = cleanser.cleanRow(tipoData);
    if (tipoResult.cleaned.tipo_trato !== mapping.expected) {
      throw new Error(`Tipo trato '${mapping.input}' should be normalized to '${mapping.expected}'`);
    }
  }

  // Test 8: Numeric field cleaning
  const numericData = {
    raw: ['1.250,50', '25'],
    rowNumber: 1,
    mapped: {
      quantidade_kg: '1.250,50', // Brazilian decimal format
      quantidade_cabecas: '25',
    },
    errors: [],
  };

  const numericResult = cleanser.cleanRow(numericData);
  if (numericResult.cleaned.quantidade_kg !== 1250.5) {
    throw new Error('Brazilian decimal format should be converted correctly');
  }
  if (numericResult.cleaned.quantidade_cabecas !== 25) {
    throw new Error('Integer should be parsed correctly');
  }

  // Test 9: Null/empty value handling
  const nullData = {
    raw: ['', null, undefined],
    rowNumber: 1,
    mapped: {
      dieta_nome: '',
      observacoes: null,
      extra_field: undefined,
    },
    errors: [],
  };

  const nullResult = cleanser.cleanRow(nullData);
  if (nullResult.cleaned.dieta_nome !== null) {
    throw new Error('Empty string should be converted to null');
  }
  if (nullResult.cleaned.observacoes !== null) {
    throw new Error('Null should remain null');
  }

  // Test 10: Text normalization
  const textData = {
    raw: ['  Observação   com    espaços  múltiplos  '],
    rowNumber: 1,
    mapped: { observacoes: '  Observação   com    espaços  múltiplos  ' },
    errors: [],
  };

  const textResult = cleanser.cleanRow(textData);
  if (textResult.cleaned.observacoes !== 'Observação com espaços múltiplos') {
    throw new Error('Text should be normalized with single spaces');
  }

  console.log('   ✓ Basic data cleaning');
  console.log('   ✓ Brazilian date format conversion');
  console.log('   ✓ Time format normalization');
  console.log('   ✓ Turno normalization');
  console.log('   ✓ Curral code cleaning');
  console.log('   ✓ Trateiro name capitalization');
  console.log('   ✓ Tipo trato normalization');
  console.log('   ✓ Numeric field cleaning');
  console.log('   ✓ Null/empty value handling');
  console.log('   ✓ Text normalization');
}