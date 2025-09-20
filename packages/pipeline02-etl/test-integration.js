/**
 * Teste de Integração Simples - Componentes Individuais
 */

import {
  Pipeline02BusinessValidator,
  Pipeline02DataCleanser
} from './dist/index.js';

console.log('🔍 Teste de Integração - Componentes Individuais\n');

const validator = new Pipeline02BusinessValidator();
const cleanser = new Pipeline02DataCleanser();

// Dados já no formato esperado pelo validador
const testData = {
  data_ref: '2024-01-15', // Formato ISO
  turno: 'MANHÃ',
  equipamento: 'BAHMAN',
  curral_codigo: 'CUR-001',
  dieta_nome: 'Dieta A',
  kg_planejado: 1000.5,  // Número
  kg_real: 980.25        // Número
};

console.log('1. Dados de entrada (já limpos):', testData);

console.log('\n2. Testando validação direta...');
const validationResult = validator.validateRawData(testData);
console.log('Resultado da validação:', {
  isValid: validationResult.isValid,
  errors: validationResult.errors.map(e => e.message)
});

if (validationResult.isValid && validationResult.data) {
  console.log('\n3. Processando dados validados...');
  const processedData = validator.processData(validationResult.data, 'org-test-123');

  console.log('Dados processados:');
  console.log({
    natural_key: processedData.natural_key,
    data_ref: processedData.data_ref,
    equipamento: processedData.equipamento,
    kg_planejado: processedData.kg_planejado,
    kg_real: processedData.kg_real,
    desvio_kg: processedData.desvio_kg,
    desvio_pct: processedData.desvio_pct
  });

  console.log('\n4. Validação de regras de negócio...');
  const businessValidation = validator.validateBusinessLogic(processedData);
  console.log('Business validation:', {
    isValid: businessValidation.isValid,
    warnings: businessValidation.errors.filter(e => e.code === 'SUSPICIOUS_VALUE').map(e => e.message),
    errors: businessValidation.errors.filter(e => e.code !== 'SUSPICIOUS_VALUE').map(e => e.message)
  });

  console.log('\n✅ Teste de integração bem-sucedido!');
} else {
  console.log('\n❌ Falha na validação básica');
  console.log('Erros:', validationResult.errors);
}

// Teste com dados inválidos
console.log('\n\n🔴 Testando dados inválidos...');
const invalidData = {
  data_ref: '2025-01-15', // Data futura
  turno: 'MANHÃ',
  equipamento: 'INVALID_EQUIP',
  curral_codigo: 'CUR-001',
  dieta_nome: 'Dieta A',
  kg_planejado: -100,
  kg_real: 980.25
};

const invalidValidation = validator.validateRawData(invalidData);
console.log('Validação de dados inválidos:', {
  isValid: invalidValidation.isValid,
  errors: invalidValidation.errors.map(e => e.message)
});

console.log('\n✅ Testes de integração concluídos!');