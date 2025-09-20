// Teste local da função process-csv-03
import fs from 'fs';
import path from 'path';

// Simular dados do CSV
const csvContent = `;;;DESVIO DA DISTRIBUIÇÃO;;;;;;;;;;
Data;Tratador;Vagão;;Curral;Dieta;;Plano Alimentar (%);Lote;Distribuído (kg);Previsto (kg);Desvio (kg);Desvio (%);Status
01/09/2025;AGUSTIN LOPEZ;BAHMAN;;01;TERMINACION SORGO-19/08/2025;;;01-G1-25;1.395,00;1.374,00;21,00; 1,53 %;VERDE
01/09/2025;AGUSTIN LOPEZ;BAHMAN;;02;TERMINACION SORGO-19/08/2025;;;02-G2-25;1.405,00;1.343,00;62,00; 4,62 %;AMARELO`;

// Função de parse de data (copiada da edge function)
function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return '';

  const cleaned = dateString.trim();

  // Skip datas inválidas
  if (cleaned.toLowerCase().includes('total') ||
      cleaned.match(/^[a-zA-Z]{3}\/\d{2}$/)) {
    return '';
  }

  // Patterns brasileiros
  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/MM/yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // dd-MM-yyyy
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/  // dd.MM.yyyy
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];

      // Validar ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (dayNum >= 1 && dayNum <= 31 &&
          monthNum >= 1 && monthNum <= 12 &&
          yearNum >= 1900 && yearNum <= 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  return '';
}

// Função de parse numérico (copiada da edge function)
function parseNumericValue(value) {
  if (!value || value.trim() === '') return 0;

  let cleaned = value.replace(/%/g, '').trim();

  // Negativos
  const isNegative = cleaned.startsWith('-');
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Formato brasileiro
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // 1.234.567,89 → 1234567.89
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // 1234,89 → 1234.89
    cleaned = cleaned.replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Detectar se é milhar ou decimal
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal (123.45)
    } else if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
      // Milhares (1.234.567 ou 1.234)
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(cleaned);
  const result = isNaN(parsed) ? 0 : parsed;

  return isNegative ? -result : result;
}

// Simular parse do CSV
console.log('🧪 Testando parse do CSV 03...');

const lines = csvContent.split('\n');
console.log(`📄 Arquivo tem ${lines.length} linhas`);

// Usar 2ª linha como header
const headers = lines[1].split(';').map(header => {
  return header
    .replace('Vagão', 'Vagão')
    .replace('Distribuído', 'Distribuído')
    .trim();
});

console.log('📋 Headers encontrados:', headers);

// Pular primeiras 2 linhas
const dataLines = lines.slice(2);

console.log(`📊 Processando ${dataLines.length} linhas de dados`);

const processedData = [];
let skipped = 0;

for (const line of dataLines) {
  if (!line.trim()) continue;

  const values = line.split(';');

  // Criar objeto com headers
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });

  console.log('📝 Linha processada:', row);

  // Extrair campos
  const data = parseDate(row["Data"]);
  const tratador = (row["Tratador"] || '').trim();
  const vagao = (row["Vagão"] || '').trim();
  const curral = (row["Curral"] || '').trim();
  const dieta = (row["Dieta"] || '').trim();
  const distribuidoStr = row["Distribuído (kg)"] || '';
  const previstoStr = row["Previsto (kg)"] || '';
  const desvioKgStr = row["Desvio (kg)"] || '';
  const desvioPcStr = row["Desvio (%)"] || '';

  console.log('🔍 Dados extraídos:', {
    data, tratador, vagao, curral, dieta,
    distribuidoStr, previstoStr, desvioKgStr, desvioPcStr
  });

  // Skip linhas vazias
  if (!data || !tratador || !curral || !dieta) {
    console.log(`⏭️ Pulando linha vazia/incompleta`);
    skipped++;
    continue;
  }

  // Parse valores numéricos
  const realizado_kg = parseNumericValue(distribuidoStr);
  const previsto_kg = parseNumericValue(previstoStr);
  const desvio_kg = parseNumericValue(desvioKgStr);
  const desvio_pc = parseNumericValue(desvioPcStr);

  console.log('🔢 Valores numéricos:', {
    realizado_kg, previsto_kg, desvio_kg, desvio_pc
  });

  // Criar merge key
  const merge = `${data}-${curral}-${vagao}`;

  processedData.push({
    data,
    tratador,
    vagao,
    curral,
    dieta,
    realizado_kg,
    previsto_kg,
    desvio_kg,
    desvio_pc,
    merge
  });
}

console.log(`✅ Resultado final: ${processedData.length} processadas, ${skipped} puladas`);
console.log('📋 Dados processados:', JSON.stringify(processedData, null, 2));