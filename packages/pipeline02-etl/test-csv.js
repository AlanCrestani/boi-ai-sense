/**
 * Teste com CSV Real
 */

import { readFileSync } from 'fs';
import {
  Pipeline02BusinessValidator,
  Pipeline02DataCleanser
} from './dist/index.js';

console.log('📄 Teste com Arquivo CSV Real\n');

// Ler o arquivo CSV
const csvContent = readFileSync('exemplo-teste.csv', 'utf-8');
console.log('Conteúdo do CSV:');
console.log(csvContent);
console.log('\n' + '='.repeat(50) + '\n');

const validator = new Pipeline02BusinessValidator();
const cleanser = new Pipeline02DataCleanser();

// Parsear CSV manualmente (simulando um parser real)
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const dataLines = lines.slice(1);

console.log(`Headers encontrados: ${headers.join(', ')}`);
console.log(`Total de linhas de dados: ${dataLines.length}\n`);

let validCount = 0;
let invalidCount = 0;
const results = [];

// Processar cada linha
for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const rowNumber = i + 2; // +2 porque começamos do índice 1 e temos header

  console.log(`🔄 Processando linha ${rowNumber}...`);

  try {
    // Parsear valores (remover aspas)
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());

    // Criar objeto de dados
    const rawData = {
      data_ref: values[0],
      turno: values[1],
      equipamento: values[2],
      curral_codigo: values[3],
      dieta_nome: values[4] || null,
      kg_planejado: values[5],
      kg_real: values[6]
    };

    console.log(`  📥 Dados brutos:`, rawData);

    // Limpeza de dados
    const mockRow = { raw: values, rowNumber, mapped: rawData, errors: [] };
    const cleanResult = cleanser.cleanRow(mockRow);

    if (cleanResult.warnings.length > 0) {
      console.log(`  ⚠️ Avisos de limpeza: ${cleanResult.warnings.map(w => w.message).join(', ')}`);
    }

    console.log(`  🧹 Dados limpos:`, cleanResult.cleaned);

    // Validação
    const validationResult = validator.validateRawData(cleanResult.cleaned);

    if (validationResult.isValid && validationResult.data) {
      // Processamento
      const processedData = validator.processData(validationResult.data, 'org-teste-123');

      // Validação de negócio
      const businessValidation = validator.validateBusinessLogic(processedData);

      console.log(`  ✅ Processado com sucesso:`);
      console.log(`     Chave Natural: ${processedData.natural_key}`);
      console.log(`     Desvio: ${processedData.desvio_kg}kg (${processedData.desvio_pct.toFixed(2)}%)`);

      if (!businessValidation.isValid) {
        const warnings = businessValidation.errors.filter(e => e.code === 'SUSPICIOUS_VALUE');
        const errors = businessValidation.errors.filter(e => e.code !== 'SUSPICIOUS_VALUE');

        if (warnings.length > 0) {
          console.log(`     ⚠️ Avisos: ${warnings.map(w => w.message).join(', ')}`);
        }
        if (errors.length > 0) {
          console.log(`     ❌ Erros de negócio: ${errors.map(e => e.message).join(', ')}`);
        }
      }

      results.push({
        linha: rowNumber,
        status: 'sucesso',
        dados: processedData
      });
      validCount++;

    } else {
      console.log(`  ❌ Falha na validação: ${validationResult.errors.map(e => e.message).join(', ')}`);
      results.push({
        linha: rowNumber,
        status: 'erro',
        erros: validationResult.errors.map(e => e.message)
      });
      invalidCount++;
    }

  } catch (error) {
    console.log(`  💥 Erro no processamento: ${error.message}`);
    results.push({
      linha: rowNumber,
      status: 'erro',
      erros: [error.message]
    });
    invalidCount++;
  }

  console.log(''); // Linha em branco
}

// Resumo final
console.log('=' .repeat(50));
console.log('📊 RESUMO FINAL');
console.log('=' .repeat(50));
console.log(`Total de linhas processadas: ${dataLines.length}`);
console.log(`✅ Sucessos: ${validCount}`);
console.log(`❌ Falhas: ${invalidCount}`);
console.log(`📈 Taxa de sucesso: ${((validCount / dataLines.length) * 100).toFixed(1)}%`);

if (validCount > 0) {
  console.log('\n🎯 Dados processados com sucesso:');
  results
    .filter(r => r.status === 'sucesso')
    .forEach(r => {
      const dados = r.dados;
      console.log(`  Linha ${r.linha}: ${dados.equipamento} em ${dados.curral_codigo} - Desvio: ${dados.desvio_kg}kg`);
    });
}

if (invalidCount > 0) {
  console.log('\n🚨 Erros encontrados:');
  results
    .filter(r => r.status === 'erro')
    .forEach(r => {
      console.log(`  Linha ${r.linha}: ${r.erros.join(', ')}`);
    });
}

console.log('\n💡 Para testar com banco de dados real:');
console.log('   1. Configure a variável DATABASE_URL');
console.log('   2. Use: processDesvioCarregamentoCSV(csvContent, "org-id", "file-id", DATABASE_URL)');

export { results };