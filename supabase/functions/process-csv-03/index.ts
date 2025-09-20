import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================
// FUNÇÕES AUXILIARES BASEADAS NO RELATÓRIO
// =============================

function parseDate(dateString: string | undefined): string {
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

function parseNumericValue(value: string | undefined): number {
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

function determineStatus(desvio_pc: number): string {
  const abs_desvio = Math.abs(desvio_pc);
  if (abs_desvio <= 3) return 'VERDE';
  if (abs_desvio <= 7) return 'AMARELO';
  return 'VERMELHO';
}


// =============================
// PROCESSAMENTO DO CSV 03
// =============================

async function processar03(csvText: string, organizationId: string, fileId: string) {
  console.log('🚀 Iniciando processamento Pipeline 03...');

  // Split lines to handle Brazilian CSV format
  const lines = csvText.split('\n');
  console.log(`📄 Total de linhas no arquivo: ${lines.length}`);

  // Find the actual header line (contains "Data;Hora;Trato")
  let headerLineIndex = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('Data;Hora;Trato')) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    throw new Error('Header line not found in CSV - looking for "Data;Hora;Trato"');
  }

  console.log(`📋 Header encontrado na linha ${headerLineIndex + 1}`);

  // Reconstruct CSV starting from header
  const csvData = lines.slice(headerLineIndex).join('\n');

  // Parse CSV with semicolon delimiter using Papa.parse like pipeline 02
  const { data: rawRows } = Papa.parse(csvData, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Fix encoding issues for common headers
      return header
        .replace('Vag�o', 'Vagão')
        .replace('Distribu�do', 'Distribuído')
        .trim();
    }
  });

  console.log(`📊 Total de linhas no CSV: ${rawRows.length}`);

  const processedRows = [];

  for (const row of rawRows) {
    // Skip summary/total lines that appear at the end of CSV
    const data = (row["Data"] || '').trim();
    const hora = (row["Hora"] || '').trim();
    const tratador = (row["Tratador"] || '').trim();

    // Filter out total lines (Total:, jan/15, etc.)
    if (data.toLowerCase().includes('total') ||
        data.match(/^[a-zA-Z]{3}\/\d{2}$/) ||  // jan/15, fev/22, etc.
        !data || !hora || !tratador) {
      console.log(`⏭️ Pulando linha de total/agrupamento: Data="${data}", Hora="${hora}", Tratador="${tratador}"`);
      continue;
    }

    // Extract and process values with Brazilian format
    const dataFormatted = parseDate(data);
    const trato = (row["Trato"] || '').trim();
    const vagao = (row["Vagão"] || '').trim();
    const curral = (row["Curral"] || '').trim();
    const dieta = (row["Dieta"] || '').trim();

    // Extract only the number from trato for merge compatibility with staging 05
    // "Trato 1" -> "1", "Trato 2" -> "2", etc.
    const tratoNumber = trato.replace(/^Trato\s*/i, '').trim() || trato;

    const realizado_kg = parseNumericValue(row["Distribuído (kg)"]);
    const previsto_kg = parseNumericValue(row["Previsto (kg)"]);
    const desvio_kg = parseNumericValue(row["Desvio (kg)"]) || (realizado_kg - previsto_kg);
    const desvio_pc = parseNumericValue(row["Desvio (%)"]) ||
                      (previsto_kg !== 0 ? (desvio_kg / previsto_kg) * 100 : 0);

    // Determine status based on deviation
    const status = row["Status"]?.toUpperCase() || determineStatus(desvio_pc);

    // Generate merge field with formatted date, hora, vagao, trato NUMBER (for compatibility with staging 05)
    const merge = `${dataFormatted}-${hora}-${vagao}-${tratoNumber}`;

    const processedRow = {
      organization_id: organizationId,
      file_id: fileId,
      data: dataFormatted,
      hora: hora,
      vagao: vagao.trim(),
      curral: curral.trim(),
      trato: trato,
      tratador: tratador.trim(),
      dieta: dieta.trim(),
      realizado_kg: Math.round(realizado_kg * 100) / 100,
      previsto_kg: Math.round(previsto_kg * 100) / 100,
      desvio_kg: Math.round(desvio_kg * 100) / 100,
      desvio_pc: Math.round(desvio_pc * 100) / 100,
      status: status,
      merge: merge
    };

    console.log(`✅ Linha processada: ${vagao} - ${dataFormatted} ${hora}`);
    processedRows.push(processedRow);
  }

  console.log(`✅ Total de linhas processadas: ${processedRows.length}`);

  // Sort by data + vagao + hora
  processedRows.sort((a, b) =>
    (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora)
  );

  return processedRows;
}

// =============================
// INSERÇÃO EM LOTE
// =============================

async function insertInBatches(rows: any[], batchSize = 500) {
  const results = {
    success: 0,
    errors: []
  };

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      const { error } = await supabase
        .from('staging_03_desvio_distribuicao')
        .insert(batch);

      if (error) {
        results.errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error.message,
          rowsAffected: batch.length
        });
      } else {
        results.success += batch.length;
      }
    } catch (error) {
      results.errors.push({
        batch: Math.floor(i / batchSize) + 1,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        rowsAffected: batch.length
      });
    }
  }

  return results;
}

// =============================
// EDGE FUNCTION PRINCIPAL
// =============================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, fileId, organizationId, forceOverwrite = false } = await req.json();

    // Validate parameters
    if (!filename || !organizationId) {
      throw new Error('Parâmetros obrigatórios ausentes: filename, organizationId');
    }

    const actualFileId = fileId && fileId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ? fileId
      : crypto.randomUUID();

    console.log(`🔄 Pipeline 03 - Processando: ${filename} (org: ${organizationId}, fileId: ${actualFileId})`);

    // Check if file was already processed
    console.log(`🔍 Verificando se arquivo já foi processado...`);
    const { data: existingData, error: checkError } = await supabase
      .from('staging_03_desvio_distribuicao')
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
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('🔄 Forçando sobrescrita - removendo dados anteriores...');
        await supabase
          .from('staging_03_desvio_distribuicao')
          .delete()
          .eq('file_id', actualFileId)
          .eq('organization_id', organizationId);
      }
    }

    // Download CSV from storage
    console.log(`📁 Baixando arquivo do storage...`);
    const filePath = `${organizationId}/csv-processed/03/${filename}`;
    console.log(`📂 Caminho: ${filePath}`);

    const { data: csvFile, error: downloadError } = await supabase.storage
      .from('csv-uploads')
      .download(filePath);

    if (downloadError) {
      console.error('❌ Erro ao baixar arquivo:', downloadError);
      throw new Error(`Falha ao baixar arquivo: ${downloadError.message}`);
    }

    console.log('✅ Arquivo baixado com sucesso');
    const csvText = await csvFile.text();
    console.log(`📄 Conteúdo CSV: ${csvText.substring(0, 200)}...`);

    // Process CSV
    console.log(`🔄 Iniciando processamento...`);
    const processedData = await processar03(csvText, organizationId, actualFileId);
    console.log(`✅ Processamento concluído: ${processedData.length} linhas`);

    // Check for duplicate data based on merge keys (optional additional check)
    if (processedData.length > 0) {
      console.log(`🔍 Verificando dados duplicados por merge keys...`);
      const sampleMergeKeys = processedData.slice(0, 10).map(row => row.merge);

      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('staging_03_desvio_distribuicao')
        .select('merge, created_at')
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
            duplicateCount: duplicateCheck.length,
            sampleDuplicateKeys: duplicateCheck.map(d => d.merge)
          }), {
            status: 409, // Conflict
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`🔄 Forçando sobrescrita - removendo ${duplicateCheck.length} dados similares existentes por merge keys...`);

          // Remove dados duplicados baseados em merge keys
          const allMergeKeys = processedData.map(row => row.merge);
          await supabase
            .from('staging_03_desvio_distribuicao')
            .delete()
            .eq('organization_id', organizationId)
            .in('merge', allMergeKeys);

          console.log(`✅ Dados similares removidos, processando com novos merge keys...`);
        }
      }
    }

    // Insert data
    const insertResults = await insertInBatches(processedData);

    return new Response(JSON.stringify({
      success: true,
      filename,
      fileId: actualFileId,
      rowsProcessed: processedData.length,
      rowsInserted: insertResults.success,
      errors: insertResults.errors.length > 0 ? insertResults.errors : undefined,
      message: `Pipeline 03 processado: ${insertResults.success} linhas inseridas`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no Pipeline 03:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});