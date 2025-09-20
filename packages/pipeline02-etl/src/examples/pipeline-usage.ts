/**
 * End-to-End Pipeline Usage Example
 * Demonstrates how to use the Pipeline 02 ETL for processing CSV files
 */

import { Pipeline02ETLProcessor, ETLConfig } from '../etl-processor.js';

/**
 * Example CSV data for testing the pipeline
 */
const SAMPLE_CSV_DATA = `Data,Turno,Equipamento,Curral,Dieta,Kg Planejado,Kg Real
15/01/2024,MANHÃ,BAHMAN,CUR-001,Dieta A,"1.000,50","980,25"
15/01/2024,TARDE,SILOKING,CUR-002,Dieta B,"1.500,00","1.520,75"
16/01/2024,MANHÃ,BAHMAN,CUR-003,,"850,25","830,00"
16/01/2024,TARDE,SILOKING,CUR-001,Dieta A,"2.000,00","1.950,50"`;

/**
 * Example usage of the Pipeline 02 ETL processor
 */
export async function demonstratePipelineUsage(): Promise<void> {
  console.log('🚀 Iniciando demonstração do Pipeline 02 ETL\n');

  // Configuration for ETL processor
  const config: ETLConfig = {
    connectionString: 'postgresql://user:password@localhost:5432/database',
    organizationId: 'org-demo-123',
    fileId: 'file-demo-456',
    runId: 'run-demo-789',
    batchSize: 100,
    skipValidation: false,
  };

  // Create ETL processor instance
  const processor = new Pipeline02ETLProcessor(config);

  try {
    console.log('📋 Processando dados CSV...');
    console.log('Dados de entrada:');
    console.log(SAMPLE_CSV_DATA);
    console.log('\n');

    // Process the CSV data
    const result = await processor.processCSVFile(SAMPLE_CSV_DATA);

    // Display results
    console.log('📊 Resultados do processamento:');
    console.log('================================');
    console.log(`✅ Sucesso: ${result.success}`);
    console.log(`📈 Total de linhas: ${result.totalRows}`);
    console.log(`✓ Linhas válidas: ${result.validRows}`);
    console.log(`❌ Linhas inválidas: ${result.invalidRows}`);
    console.log(`💾 Inserções na staging: ${result.stagingInserts}`);
    console.log(`🔄 UPSERTs na tabela fato: ${result.factTableUpserts}`);
    console.log(`⏱️ Duração: ${result.duration}ms`);

    // Display errors if any
    if (result.errors.length > 0) {
      console.log('\n🚨 Erros encontrados:');
      console.log('===================');
      for (const error of result.errors) {
        console.log(`Linha ${error.rowNumber} (${error.stage}): ${error.message}`);
      }
    }

    // Display warnings if any
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Avisos:');
      console.log('==========');
      for (const warning of result.warnings) {
        console.log(`Linha ${warning.rowNumber} (${warning.stage}): ${warning.message}`);
        if (warning.field && warning.originalValue && warning.cleanedValue) {
          console.log(`  Campo: ${warning.field}`);
          console.log(`  Valor original: ${warning.originalValue}`);
          console.log(`  Valor limpo: ${warning.cleanedValue}`);
        }
      }
    }

    console.log('\n🎉 Processamento concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
  } finally {
    // Close database connection
    await processor.close();
  }
}

/**
 * Error handling demonstration
 */
export async function demonstrateErrorHandling(): Promise<void> {
  console.log('\n🧪 Demonstrando tratamento de erros\n');

  // CSV with intentional errors
  const INVALID_CSV_DATA = `Data,Turno,Equipamento,Curral,Dieta,Kg Planejado,Kg Real
32/01/2024,MANHÃ,INVALID_EQUIP,CUR-001,Dieta A,"1.000,50","980,25"
15/01/2025,TARDE,SILOKING,CUR-002,Dieta B,"-1.500,00","1.520,75"
INVALID_DATE,MANHÃ,BAHMAN,CUR-003,,"abc","def"`;

  const config: ETLConfig = {
    connectionString: 'postgresql://user:password@localhost:5432/database',
    organizationId: 'org-demo-errors',
    fileId: 'file-demo-errors',
    runId: 'run-demo-errors',
    batchSize: 10,
    skipValidation: false,
  };

  const processor = new Pipeline02ETLProcessor(config);

  try {
    console.log('📋 Processando CSV com erros intencionais...');
    const result = await processor.processCSVFile(INVALID_CSV_DATA);

    console.log('📊 Resultados (com erros):');
    console.log('==========================');
    console.log(`Total de linhas: ${result.totalRows}`);
    console.log(`Linhas válidas: ${result.validRows}`);
    console.log(`Linhas inválidas: ${result.invalidRows}`);
    console.log(`Taxa de erro: ${((result.invalidRows / result.totalRows) * 100).toFixed(1)}%`);

    console.log('\n🚨 Detalhes dos erros:');
    for (const error of result.errors) {
      console.log(`- Linha ${error.rowNumber}: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await processor.close();
  }
}

/**
 * Performance demonstration with large dataset
 */
export async function demonstratePerformance(): Promise<void> {
  console.log('\n⚡ Demonstrando performance com dataset grande\n');

  // Generate large CSV dataset
  const headers = 'Data,Turno,Equipamento,Curral,Dieta,Kg Planejado,Kg Real';
  const rows: string[] = [headers];

  const equipamentos = ['BAHMAN', 'SILOKING'];
  const turnos = ['MANHÃ', 'TARDE'];
  const dietas = ['Dieta A', 'Dieta B', 'Dieta C', null];

  // Generate 1000 rows
  for (let i = 0; i < 1000; i++) {
    const date = new Date(2024, 0, 1 + (i % 30));
    const dateStr = date.toLocaleDateString('pt-BR');
    const turno = turnos[i % turnos.length];
    const equipamento = equipamentos[i % equipamentos.length];
    const curral = `CUR-${String(i % 50 + 1).padStart(3, '0')}`;
    const dieta = dietas[i % dietas.length] || '';
    const kgPlanejado = (1000 + (i % 500)).toLocaleString('pt-BR');
    const kgReal = (950 + (i % 600)).toLocaleString('pt-BR');

    rows.push(`${dateStr},${turno},${equipamento},${curral},${dieta},"${kgPlanejado}","${kgReal}"`);
  }

  const largeCsvData = rows.join('\n');

  const config: ETLConfig = {
    connectionString: 'postgresql://user:password@localhost:5432/database',
    organizationId: 'org-demo-performance',
    fileId: 'file-demo-performance',
    runId: 'run-demo-performance',
    batchSize: 100, // Process in batches of 100
    skipValidation: false,
  };

  const processor = new Pipeline02ETLProcessor(config);

  try {
    console.log(`📋 Processando ${rows.length - 1} linhas de dados...`);
    const startTime = Date.now();

    const result = await processor.processCSVFile(largeCsvData);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📊 Resultados de performance:');
    console.log('============================');
    console.log(`✅ Sucesso: ${result.success}`);
    console.log(`📈 Total processado: ${result.totalRows} linhas`);
    console.log(`✓ Taxa de sucesso: ${((result.validRows / result.totalRows) * 100).toFixed(1)}%`);
    console.log(`⏱️ Tempo total: ${duration}ms`);
    console.log(`🚀 Throughput: ${(result.totalRows / (duration / 1000)).toFixed(1)} linhas/segundo`);
    console.log(`💾 UPSERT rate: ${(result.factTableUpserts / (duration / 1000)).toFixed(1)} ops/segundo`);

  } catch (error) {
    console.error('❌ Erro de performance:', error);
  } finally {
    await processor.close();
  }
}

// Executar demonstração se arquivo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await demonstratePipelineUsage();
    await demonstrateErrorHandling();
    await demonstratePerformance();
  })().catch(console.error);
}