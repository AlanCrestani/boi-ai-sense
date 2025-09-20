/**
 * Tests for pipeline-specific configurations
 */

import { HeaderMapper } from '../header-mapping.js';
import { pipeline02Config, pipeline04Config } from '../pipeline-configs.js';

export async function testPipelineConfigs(): Promise<void> {
  // Test Pipeline 02 Configuration
  await testPipeline02Config();

  // Test Pipeline 04 Configuration
  await testPipeline04Config();

  console.log('   ✓ Pipeline 02 configuration');
  console.log('   ✓ Pipeline 04 configuration');
}

async function testPipeline02Config(): Promise<void> {
  const mapper = new HeaderMapper(pipeline02Config);

  // Test 1: Standard Pipeline 02 headers
  const standardHeaders = [
    'data_ref',
    'turno',
    'equipamento',
    'curral_codigo',
    'dieta_nome',
    'kg_planejado',
    'kg_real',
    'desvio_kg',
    'desvio_pct'
  ];

  const analysis = mapper.analyzeHeaders(standardHeaders);

  if (analysis.confidence < 0.9) {
    throw new Error(`Pipeline 02: Expected high confidence, got ${analysis.confidence}`);
  }

  if (analysis.missingRequired.length > 0) {
    throw new Error(`Pipeline 02: Missing required fields: ${analysis.missingRequired.join(', ')}`);
  }

  // Test 2: Alternative headers (aliases)
  const alternativeHeaders = [
    'data',           // alias for data_ref
    'shift',          // alias for turno
    'equipment',      // alias for equipamento
    'pen',            // alias for curral_codigo
    'diet',           // alias for dieta_nome
    'planned',        // alias for kg_planejado
    'actual',         // alias for kg_real
    'deviation',      // alias for desvio_kg
    'deviation_pct'   // alias for desvio_pct
  ];

  const aliasAnalysis = mapper.analyzeHeaders(alternativeHeaders);

  if (aliasAnalysis.mappedHeaders.length !== 9) {
    throw new Error(`Pipeline 02: Expected 9 mapped aliases, got ${aliasAnalysis.mappedHeaders.length}`);
  }

  // Test 3: Sample data mapping
  const sampleData = [
    '2024-01-15',  // data_ref
    'Manhã',       // turno
    'BAHMAN',      // equipamento
    'CUR-001',     // curral_codigo
    'Dieta A',     // dieta_nome
    '1000.50',     // kg_planejado
    '980.25',      // kg_real
    '-20.25',      // desvio_kg
    '-2.03'        // desvio_pct
  ];

  // First analyze headers to set up the mapping
  mapper.analyzeHeaders(standardHeaders);
  const mappedRow = mapper.mapRow(sampleData, standardHeaders, 1);

  if (mappedRow.errors.length > 0) {
    throw new Error(`Pipeline 02: Unexpected mapping errors: ${mappedRow.errors.map(e => e.message).join(', ')}`);
  }

  // Verify required fields are present
  const requiredFields = ['data_ref', 'equipamento', 'curral_codigo', 'kg_planejado', 'kg_real'];
  for (const field of requiredFields) {
    if (mappedRow.mapped[field] === undefined || mappedRow.mapped[field] === null) {
      throw new Error(`Pipeline 02: Required field '${field}' is missing or null`);
    }
  }

  // Test 4: Mixed case headers
  const mixedHeaders = ['DATA_REF', 'TURNO', 'Equipamento', 'curral_codigo'];
  const mixedAnalysis = mapper.analyzeHeaders(mixedHeaders);

  if (mixedAnalysis.mappedHeaders.length !== 4) {
    throw new Error(`Pipeline 02: Case insensitive mapping failed, got ${mixedAnalysis.mappedHeaders.length} mapped`);
  }
}

async function testPipeline04Config(): Promise<void> {
  const mapper = new HeaderMapper(pipeline04Config);

  // Test 1: Standard Pipeline 04 headers
  const standardHeaders = [
    'data_ref',
    'hora_trato',
    'curral_codigo',
    'trateiro',
    'dieta_nome',
    'quantidade_kg',
    'observacoes'
  ];

  const analysis = mapper.analyzeHeaders(standardHeaders);

  if (analysis.confidence < 0.9) {
    throw new Error(`Pipeline 04: Expected high confidence, got ${analysis.confidence}`);
  }

  if (analysis.missingRequired.length > 0) {
    throw new Error(`Pipeline 04: Missing required fields: ${analysis.missingRequired.join(', ')}`);
  }

  // Test 2: Alternative headers (aliases)
  const alternativeHeaders = [
    'date',           // alias for data_ref
    'time',           // alias for hora_trato
    'pen',            // alias for curral_codigo
    'feeder',         // alias for trateiro
    'diet',           // alias for dieta_nome
    'amount',         // alias for quantidade_kg
    'notes'           // alias for observacoes
  ];

  const aliasAnalysis = mapper.analyzeHeaders(alternativeHeaders);

  if (aliasAnalysis.mappedHeaders.length !== 7) {
    throw new Error(`Pipeline 04: Expected 7 mapped aliases, got ${aliasAnalysis.mappedHeaders.length}`);
  }

  // Test 3: Sample data mapping
  const sampleData = [
    '2024-01-15',    // data_ref
    '07:30',         // hora_trato
    'CUR-002',       // curral_codigo
    'João Silva',    // trateiro
    'Dieta B',       // dieta_nome
    '850.75',        // quantidade_kg
    'Trato normal'   // observacoes
  ];

  // First analyze headers to set up the mapping
  mapper.analyzeHeaders(standardHeaders);
  const mappedRow = mapper.mapRow(sampleData, standardHeaders, 1);

  if (mappedRow.errors.length > 0) {
    throw new Error(`Pipeline 04: Unexpected mapping errors: ${mappedRow.errors.map(e => e.message).join(', ')}`);
  }

  // Verify required fields are present
  const requiredFields = ['data_ref', 'curral_codigo', 'quantidade_kg'];
  for (const field of requiredFields) {
    if (mappedRow.mapped[field] === undefined || mappedRow.mapped[field] === null) {
      throw new Error(`Pipeline 04: Required field '${field}' is missing or null`);
    }
  }

  // Test 4: Numeric conversion for quantidade_kg
  const numericHeaders = ['data_ref', 'curral_codigo', 'quantidade_kg'];
  const numericData = ['2024-01-15', 'CUR-001', '1250,50']; // Brazilian decimal format

  // Analyze headers first
  mapper.analyzeHeaders(numericHeaders);
  const numericRow = mapper.mapRow(numericData, numericHeaders, 1);

  if (typeof numericRow.mapped.quantidade_kg !== 'number') {
    throw new Error(`Pipeline 04: Expected numeric conversion for quantidade_kg, got ${typeof numericRow.mapped.quantidade_kg}`);
  }

  // Test 5: Optional fields handling
  const minimalHeaders = ['data_ref', 'curral_codigo', 'quantidade_kg'];
  const minimalData = ['2024-01-15', 'CUR-001', '1000'];

  // Analyze headers first
  mapper.analyzeHeaders(minimalHeaders);
  const minimalRow = mapper.mapRow(minimalData, minimalHeaders, 1);

  // Should not have errors for missing optional fields
  const requiredFieldErrors = minimalRow.errors.filter(e =>
    e.message.includes('Required field') &&
    !e.field.includes('data_ref') &&
    !e.field.includes('curral_codigo') &&
    !e.field.includes('quantidade_kg')
  );

  if (requiredFieldErrors.length > 0) {
    throw new Error(`Pipeline 04: Optional fields should not generate required field errors: ${requiredFieldErrors.map(e => e.message).join(', ')}`);
  }
}