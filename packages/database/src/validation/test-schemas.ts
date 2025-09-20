import { z } from 'zod';
import {
  insertEtlRunSchema,
  insertEtlFileSchema,
} from '../schema/etl.js';

import {
  insertDimCurralSchema,
} from '../schema/dimensions.js';

import {
  insertFatoCarregamentoSchema,
} from '../schema/facts.js';

export function testSchemaValidation() {
  console.log('🧪 Testing Zod schema validation...');

  try {
    // Test ETL schemas with sample data
    const etlRunData = {
      runId: '123e4567-e89b-12d3-a456-426614174000',
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      startedAt: new Date(),
      status: 'running' as const,
    };

    const validatedEtlRun = insertEtlRunSchema.parse(etlRunData);
    console.log('✅ ETL Run schema validation passed');

    const etlFileData = {
      fileId: '123e4567-e89b-12d3-a456-426614174002',
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      storageBucket: 'etl-files',
      storagePath: '/uploads/2024/01/file.csv',
      checksum: 'abc123def456',
      uploadedAt: new Date(),
      status: 'uploaded' as const,
    };

    const validatedEtlFile = insertEtlFileSchema.parse(etlFileData);
    console.log('✅ ETL File schema validation passed');

    // Test dimensional schemas
    const curralData = {
      curralId: '123e4567-e89b-12d3-a456-426614174003',
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      codigo: 'CUR-001',
      nome: 'Curral 1',
      capacidade: '100',
      setor: 'Setor A',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validatedCurral = insertDimCurralSchema.parse(curralData);
    console.log('✅ Dimension Curral schema validation passed');

    // Test fact schemas
    const desvioData = {
      distribId: '123e4567-e89b-12d3-a456-426614174004',
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      dataRef: '2024-01-15', // Use string for date field
      turno: 'Manhã',
      curralId: '123e4567-e89b-12d3-a456-426614174003',
      kgPlanejado: '1000.50',
      kgReal: '980.25',
      desvioKg: '-20.25',
      desvioPct: '-2.03',
      sourceFileId: '123e4567-e89b-12d3-a456-426614174002',
      naturalKey: 'ORG_001_CUR_001_2024_01_15_MANHA',
      createdAt: new Date(),
    };

    const validatedDesvio = insertFatoCarregamentoSchema.parse(desvioData);
    console.log('✅ Fact Desvio Carregamento schema validation passed');

    console.log('🎉 All schema validations passed successfully!');

    return {
      success: true,
      validatedSchemas: {
        etlRun: validatedEtlRun,
        etlFile: validatedEtlFile,
        curral: validatedCurral,
        desvio: validatedDesvio,
      },
    };

  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSchemaValidation();
}