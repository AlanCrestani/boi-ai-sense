/**
 * Teste Manual do Pipeline 02 ETL
 * Execute: node test-manual.js
 */

import {
  Pipeline02BusinessValidator,
  Pipeline02DataCleanser,
  processDesvioCarregamentoCSV
} from './dist/index.js';

console.log('🧪 Iniciando Teste Manual do Pipeline 02 ETL\n');

// ========================================
// 1. Teste de Validação Individual
// ========================================
console.log('1️⃣ Testando Validação Individual...');
const validator = new Pipeline02BusinessValidator();
const cleanser = new Pipeline02DataCleanser();

// Dados de teste
const testData = {
  data_ref: '15/01/2024',
  turno: 'MANHÃ',
  equipamento: 'BAHMAN',
  curral_codigo: 'CUR-001',
  dieta_nome: 'Dieta A',
  kg_planejado: '1.000,50',
  kg_real: '980,25'
};

console.log('Dados de entrada:', testData);

// Teste de limpeza
console.log('\n🧹 Testando limpeza de dados...');
const mockRow = { raw: Object.values(testData), rowNumber: 1, mapped: testData, errors: [] };
const cleanResult = cleanser.cleanRow(mockRow);
console.log('Dados limpos:', cleanResult.cleaned);
console.log('Avisos:', cleanResult.warnings.map(w => w.message));

// Teste de validação
console.log('\n✅ Testando validação...');
const validationResult = validator.validateRawData(cleanResult.cleaned);
console.log('Válido:', validationResult.isValid);
if (validationResult.isValid) {
  const processedData = validator.processData(validationResult.data, 'org-test');
  console.log('Dados processados:', {
    natural_key: processedData.natural_key,
    desvio_kg: processedData.desvio_kg,
    desvio_pct: processedData.desvio_pct
  });
}

// ========================================
// 2. Teste com CSV Completo (Mock)
// ========================================
console.log('\n\n2️⃣ Testando Pipeline Completo com CSV...');

const csvData = `Data,Turno,Equipamento,Curral,Dieta,Kg Planejado,Kg Real
15/01/2024,MANHÃ,BAHMAN,CUR-001,Dieta A,"1.000,50","980,25"
15/01/2024,TARDE,SILOKING,CUR-002,Dieta B,"1.500,00","1.520,75"
16/01/2024,MANHÃ,BAHMAN,CUR-003,,"850,25","830,00"
16/01/2024,TARDE,SILOKING,CUR-001,Dieta A,"2.000,00","1.950,50"`;

console.log('CSV de teste:');
console.log(csvData);

// Simular processamento (sem banco real)
console.log('\n📊 Resultado simulado do processamento:');
const lines = csvData.split('\n');
const dataLines = lines.slice(1); // Remove header

console.log(`Total de linhas: ${dataLines.length}`);
console.log('Processamento individual das linhas:');

let validCount = 0;
let invalidCount = 0;

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const values = line.split(',').map(v => v.replace(/"/g, ''));

  try {
    const rowData = {
      data_ref: values[0],
      turno: values[1],
      equipamento: values[2],
      curral_codigo: values[3],
      dieta_nome: values[4],
      kg_planejado: values[5],
      kg_real: values[6]
    };

    const mockRow = { raw: values, rowNumber: i + 2, mapped: rowData, errors: [] };
    const cleanResult = cleanser.cleanRow(mockRow);
    const validationResult = validator.validateRawData(cleanResult.cleaned);

    if (validationResult.isValid) {
      const processedData = validator.processData(validationResult.data, 'org-test');
      console.log(`  ✅ Linha ${i + 2}: ${processedData.equipamento} - Desvio: ${processedData.desvio_kg}kg (${processedData.desvio_pct}%)`);
      validCount++;
    } else {
      console.log(`  ❌ Linha ${i + 2}: Erro de validação`);
      invalidCount++;
    }
  } catch (error) {
    console.log(`  ❌ Linha ${i + 2}: Erro - ${error.message}`);
    invalidCount++;
  }
}

console.log(`\n📈 Resumo: ${validCount} válidas, ${invalidCount} inválidas`);
console.log(`Taxa de sucesso: ${((validCount / dataLines.length) * 100).toFixed(1)}%`);

// ========================================
// 3. Teste de Casos de Erro
// ========================================
console.log('\n\n3️⃣ Testando Casos de Erro...');

const errorCases = [
  { name: 'Data futura', data: { ...testData, data_ref: '15/01/2025' } },
  { name: 'Equipamento inválido', data: { ...testData, equipamento: 'INVALID' } },
  { name: 'Valor negativo', data: { ...testData, kg_planejado: '-100,00' } },
  { name: 'Data inválida', data: { ...testData, data_ref: '32/01/2024' } },
];

for (const testCase of errorCases) {
  console.log(`\n🔴 Testando: ${testCase.name}`);
  try {
    const mockRow = { raw: Object.values(testCase.data), rowNumber: 1, mapped: testCase.data, errors: [] };
    const cleanResult = cleanser.cleanRow(mockRow);
    const validationResult = validator.validateRawData(cleanResult.cleaned);

    if (validationResult.isValid) {
      console.log('  ⚠️ Deveria ter falhado, mas passou na validação');
    } else {
      console.log(`  ✅ Corretamente rejeitado: ${validationResult.errors[0]?.message}`);
    }
  } catch (error) {
    console.log(`  ✅ Corretamente rejeitado: ${error.message}`);
  }
}

// ========================================
// 4. Teste de Performance Básico
// ========================================
console.log('\n\n4️⃣ Testando Performance...');

const startTime = Date.now();
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  const mockRow = { raw: Object.values(testData), rowNumber: i, mapped: testData, errors: [] };
  const cleanResult = cleanser.cleanRow(mockRow);
  const validationResult = validator.validateRawData(cleanResult.cleaned);
  if (validationResult.isValid) {
    validator.processData(validationResult.data, 'org-test');
  }
}

const endTime = Date.now();
const duration = endTime - startTime;
const throughput = (iterations / (duration / 1000)).toFixed(1);

console.log(`Processadas ${iterations} linhas em ${duration}ms`);
console.log(`Throughput: ${throughput} linhas/segundo`);

console.log('\n🎉 Teste Manual Concluído!');
console.log('\n💡 Para testar com banco real, configure DATABASE_URL e execute:');
console.log('   const result = await processDesvioCarregamentoCSV(csvData, "org-id", "file-id", DATABASE_URL);');