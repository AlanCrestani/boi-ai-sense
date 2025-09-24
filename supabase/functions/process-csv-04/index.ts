import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

function parseNumericValue(value) {
  if (!value || value.trim() === '') return 0;
  // Remove percentage symbol and spaces
  let cleaned = value.replace(/%/g, '').trim();
  // Handle negative numbers
  const isNegative = cleaned.startsWith('-');
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }
  // Handle Brazilian number format
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Format: 1.234.567,89 (Brazilian thousands and decimals)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Format: 1234,89 (Brazilian decimal only)
    cleaned = cleaned.replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Check if it's thousands or decimal
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal (e.g., 123.45)
      // Keep as is
    } else if (parts.length > 2 || parts.length === 2 && parts[1].length > 2) {
      // Likely thousands (e.g., 1.234.567 or 1.234)
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  const parsed = parseFloat(cleaned);
  const result = isNaN(parsed) ? 0 : parsed;
  return isNegative ? -result : result;
}

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return '';
  const cleaned = dateString.trim();
  // Skip invalid dates (like aggregation rows)
  if (cleaned.toLowerCase().includes('total') || cleaned.match(/^[a-zA-Z]{3}\/\d{2}$/)) {
    return '';
  }
  // Handle Brazilian date formats
  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/ // yyyy/MM/dd
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      let day, month, year;
      // Check if it's already in yyyy-MM-dd format or yyyy/MM/dd
      if (pattern.source.startsWith('^\\(\\\\\\d\\{4\\}')) {
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else {
        // Brazilian format: dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        year = match[3];
      }
      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  // If no pattern matches, return empty to avoid invalid dates
  console.warn(`⚠️ Data inválida encontrada: "${cleaned}"`);
  return '';
}

// Função para corrigir encoding UTF-8
const fixUtf8 = (text) => {
  if (!text) return text;
  return text
    // Correções muito específicas primeiro
    .replace(/Pr�-Mistura/g, 'Pré-Mistura')
    .replace(/Vag�o/g, 'Vagão')
    .replace(/TERMINA��O/g, 'TERMINAÇÃO')
    .replace(/Bic�lcico/g, 'Bicálcico')
    .replace(/s�dio/g, 'sódio')
    .replace(/gr�o �mido/g, 'grão úmido')
    .replace(/gróo ómido/g, 'grão úmido')
    .replace(/mo�do/g, 'moído')
    .replace(/moódo/g, 'moído')
    .replace(/n�3/g, 'nº3')
    .replace(/nó3/g, 'nº3')
    // Padrões gerais mais comuns
    .replace(/��/g, 'ção')
    .replace(/�/g, 'ã')
    // Evitar correções que criam problemas
    .replace(/TERMINAÇÃOO/g, 'TERMINAÇÃO')
    .replace(/Vagóo/g, 'Vagão')
    .replace(/Pró-Mistura/g, 'Pré-Mistura')
    .replace(/óó/g, 'ó')
    .replace(/ãã/g, 'ã');
};

async function processar04(csvText, organizationId, fileId) {
  console.log('🔄 Iniciando processamento Pipeline 04');

  // Parse CSV with semicolon delimiter
  // First, parse without header to get all lines
  const { data: allLines } = Papa.parse(csvText, {
    delimiter: ";",
    skipEmptyLines: true
  });

  // Skip the first line (usually title/description) and use second line as header
  const lines = allLines;
  if (lines.length < 2) {
    throw new Error('Arquivo CSV deve ter pelo menos 2 linhas (cabeçalho na 2ª linha)');
  }

  // Use second line as header and remaining lines as data
  const headers = lines[1].map((header) => {
    // Fix encoding issues for common headers
    return fixUtf8(header.trim());
  });

  let dataLines = lines.slice(2); // Skip first two lines (title + header)

  // Remove last lines that are typically totals/groupers
  // Look for lines that contain "Total", date patterns like "jan/25", or empty first columns
  while (dataLines.length > 0) {
    const lastLine = dataLines[dataLines.length - 1];
    const firstColumn = (lastLine[0] || '').trim().toLowerCase();
    // Check if last line is a total, date grouper, or empty
    if (
      firstColumn.includes('total') ||
      firstColumn.match(/^[a-zA-Z]{3}\/\d{2}$/) || // jan/25, fev/24, etc.
      firstColumn === '' ||
      lastLine.every((cell) => (cell || '').trim() === '') // All empty cells
    ) {
      console.log(`🗑️ Removendo linha de total/agrupamento: "${firstColumn}"`);
      dataLines.pop();
    } else {
      break;
    }
  }

  console.log(`📊 Linhas após remoção de totais: ${dataLines.length}`);

  // Convert to objects using headers
  const rawRows = dataLines.map((line) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = line[index] || '';
    });
    return row;
  });

  console.log(`📊 Total de linhas no CSV: ${rawRows.length}`);

  const processedRows = [];

  for (const row of rawRows) {
    // Skip empty rows or summary lines
    const dataInclusao = (row["Data de Inclusão"] || row["Data de Inclus�o"] || '').trim();
    const hora = (row["Hora"] || '').trim();
    const motorista = (row["Motorista"] || '').trim();

    // Filter out total lines or empty data
    if (
      dataInclusao.toLowerCase().includes('total') ||
      dataInclusao.match(/^[a-zA-Z]{3}\/\d{2}$/) || // jan/15, fev/22, etc.
      !dataInclusao ||
      !hora ||
      !motorista
    ) {
      console.log(`⏭️ Pulando linha de total/agrupamento: Data="${dataInclusao}", Hora="${hora}", Motorista="${motorista}"`);
      continue;
    }

    // Get vagao with multiple possible header variations
    const vagao = fixUtf8((row["Vagão"] || row["Vag�o"] || row["Vagao"] || '').toUpperCase().trim());
    console.log(`🚛 Processando vagão: "${vagao}"`);

    // Filter only BAHMAN and SILOKING (more flexible matching)
    if (!vagao || (!vagao.includes('BAHMAN') && !vagao.includes('SILOKING'))) {
      console.log(`⏭️ Pulando vagão: "${vagao}" (não é BAHMAN/SILOKING)`);
      continue;
    }

    // Parse and format date
    const dataFormatted = parseDate(dataInclusao);

    // Generate merge field - similar ao padrão dos outros pipelines
    const merge = `${dataFormatted}|${hora}|${vagao}`;

    const processedRow = {
      organization_id: organizationId,
      file_id: fileId, // Usar o parâmetro da função
      data: dataFormatted,
      id_carregamento: row["Id. Carregamento"] || '', // CORREÇÃO: era id_carregamento_original
      hora: hora,
      dieta: fixUtf8((row["Dieta"] || '').toUpperCase().trim()),
      carregamento: fixUtf8(row["Carregamento"] || ''),
      ingrediente: fixUtf8((row["Ingrediente"] || '').toUpperCase().trim()),
      realizado_kg: parseNumericValue(row["Quantidade MN (kg)"]),
      pazeiro: fixUtf8((row["Motorista"] || '').toUpperCase().trim()),
      vagao: vagao,
      ms_dieta_pc: parseNumericValue(row["%MS Dieta Real"]),
      ndt_dieta_pc: parseNumericValue(row["%NDT Dieta Real"]),
      merge: merge
    };

    console.log(`✅ Linha processada: ${vagao} - ${dataFormatted} ${hora}`);
    processedRows.push(processedRow);
  }

  console.log(`✅ Linhas processadas (BAHMAN/SILOKING): ${processedRows.length}`);

  // Sort by data + vagao + hora
  processedRows.sort((a, b) => (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora));

  return processedRows;
}

async function insertInBatches(rows, batchSize = 500) {
  const results = {
    success: 0,
    errors: []
  };

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`📦 Inserindo batch ${Math.floor(i / batchSize) + 1} com ${batch.length} linhas`);

    try {
      const { error } = await supabase
        .from('staging_04_itens_trato')
        .insert(batch);

      if (error) {
        console.error(`❌ Erro no batch ${Math.floor(i / batchSize) + 1}:`, error);
        results.errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error.message,
          rowsAffected: batch.length
        });
      } else {
        results.success += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserido com sucesso`);
      }
    } catch (error) {
      console.error(`❌ Erro inesperado no batch ${Math.floor(i / batchSize) + 1}:`, error);
      results.errors.push({
        batch: Math.floor(i / batchSize) + 1,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        rowsAffected: batch.length
      });
    }
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, fileId, organizationId, forceOverwrite = false } = await req.json();

    console.log(`🚀 Processando arquivo: ${filename}`);
    console.log(`📋 File ID: ${fileId}, Organization ID: ${organizationId}`);

    // Validate required parameters
    if (!filename || !organizationId) {
      throw new Error('Parâmetros obrigatórios ausentes: filename e organizationId');
    }

    // Generate fileId if not provided (sempre gerar UUID válido)
    const actualFileId = crypto.randomUUID();

    // Check if file was already processed
    console.log(`🔍 Verificando se arquivo já foi processado...`);
    const { data: existingData, error: checkError } = await supabase
      .from('staging_04_itens_trato')
      .select('id, created_at')
      .eq('file_id', actualFileId)
      .eq('organization_id', organizationId)
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar duplicação:', checkError);
      // Continue processing even if check fails
    } else if (existingData && existingData.length > 0) {
      if (!forceOverwrite) {
        console.warn('⚠️ Arquivo já foi processado anteriormente');
        return new Response(JSON.stringify({
          success: false,
          error: `Arquivo já foi processado em ${new Date(existingData[0].created_at).toLocaleString('pt-BR')}. Use um file_id diferente, adicione "forceOverwrite": true para sobrescrever, ou remova os dados anteriores.`,
          fileId: actualFileId,
          existingRecordId: existingData[0].id
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('🔄 Forçando sobrescrita - removendo dados anteriores...');
        await supabase
          .from('staging_04_itens_trato')
          .delete()
          .eq('file_id', actualFileId)
          .eq('organization_id', organizationId);
      }
    }

    // Download CSV file from storage using organizational structure
    const filePath = `${organizationId}/csv-processed/04/${filename}`;
    console.log(`📁 Baixando arquivo do caminho: ${filePath}`);

    const { data: csvFile, error: downloadError } = await supabase.storage
      .from('csv-uploads')
      .download(filePath);

    if (downloadError) {
      console.error('❌ Erro ao baixar arquivo:', downloadError);
      throw new Error(`Falha ao baixar arquivo: ${downloadError.message}`);
    }

    // Convert blob to text
    const csvText = await csvFile.text();
    console.log(`📄 Arquivo lido, tamanho: ${csvText.length} caracteres`);

    // Process CSV data
    const processedData = await processar04(csvText, organizationId, actualFileId);

    if (processedData.length === 0) {
      console.warn('⚠️ Nenhuma linha válida encontrada para processar');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma linha de BAHMAN ou SILOKING encontrada no arquivo',
        filename,
        rowsProcessed: 0,
        rowsInserted: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate data based on merge keys (optional additional check)
    if (processedData.length > 0) {
      console.log(`🔍 Verificando dados duplicados por merge keys...`);
      const sampleMergeKeys = processedData.slice(0, 10).map((row) => row.merge);
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('staging_04_itens_trato')
        .select('merge, file_id, created_at')
        .eq('organization_id', organizationId)
        .in('merge', sampleMergeKeys)
        .limit(5);

      if (!duplicateError && duplicateCheck && duplicateCheck.length > 0) {
        if (!forceOverwrite) {
          console.warn(`⚠️ Encontradas ${duplicateCheck.length} linhas com dados similares`);
          const oldestDuplicate = duplicateCheck[0];
          return new Response(JSON.stringify({
            success: false,
            error: `Dados similares já existem na base (${duplicateCheck.length} linhas encontradas). Primeiro registro similar foi processado em ${new Date(oldestDuplicate.created_at).toLocaleString('pt-BR')}. Adicione "forceOverwrite": true para processar mesmo assim.`,
            fileId: actualFileId,
            duplicateFileId: oldestDuplicate.file_id,
            duplicateCount: duplicateCheck.length,
            sampleDuplicateKeys: duplicateCheck.map((d) => d.merge)
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`🔄 Forçando sobrescrita - removendo ${duplicateCheck.length} dados similares existentes por merge keys...`);
          // Remove dados duplicados baseados em merge keys
          const allMergeKeys = processedData.map((row) => row.merge);
          await supabase
            .from('staging_04_itens_trato')
            .delete()
            .eq('organization_id', organizationId)
            .in('merge', allMergeKeys);
          console.log(`✅ Dados similares removidos, processando com novos merge keys...`);
        }
      }
    }

    // Insert data in batches
    const insertResults = await insertInBatches(processedData);

    // Log summary
    console.log('📊 Resumo do processamento:');
    console.log(`  - Linhas no CSV: ${csvText.split('\n').length}`);
    console.log(`  - Linhas processadas: ${processedData.length}`);
    console.log(`  - Linhas inseridas: ${insertResults.success}`);
    console.log(`  - Erros: ${insertResults.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      filename,
      fileId: actualFileId,
      rowsProcessed: processedData.length,
      rowsInserted: insertResults.success,
      errors: insertResults.errors.length > 0 ? insertResults.errors : undefined,
      message: `Pipeline 04 processado: ${insertResults.success} linhas inseridas em staging_04_itens_trato`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});