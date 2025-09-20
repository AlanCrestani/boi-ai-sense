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
// FUNÇÕES AUXILIARES
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

// =============================
// PROCESSAMENTO DO CSV 05
// =============================

async function processar05(csvText: string, organizationId: string, fileId: string) {
  console.log('🚀 Iniciando processamento Pipeline 05...');

  // Parse sem header primeiro (seguindo padrão pipelines 02/04)
  const { data: allLines } = Papa.parse(csvText, {
    delimiter: ";",
    skipEmptyLines: true
  });

  // Validar mínimo de linhas
  const lines = allLines as string[][];
  if (lines.length < 2) {
    throw new Error('Arquivo CSV deve ter pelo menos 2 linhas');
  }

  console.log(`📊 Total de linhas CSV: ${lines.length}`);

  // Usar 2ª linha como header (padrão estabelecido)
  const headers = lines[1].map((header: string) => {
    return header
      .replace('Id. Carregamento', 'Id_Carregamento')
      .replace('Peso Abastecido (kg)', 'Peso_Abastecido_kg')
      .replace('Vagão', 'Vagao')
      .replace('Vag�o', 'Vagao') // Encoding fix
      .replace('%MS Dieta Real', 'MS_Dieta_PC')
      .replace('%Ndt Dieta Real', 'NDT_Dieta_PC')
      .trim();
  });

  console.log(`📋 Headers da linha 2:`, headers);

  // Pular primeiras 2 linhas para dados (padrão estabelecido)
  let dataLines = lines.slice(2);

  // Remover últimas linhas que são totais (padrão estabelecido)
  while (dataLines.length > 0) {
    const lastLine = dataLines[dataLines.length - 1];
    const firstColumn = (lastLine[0] || '').trim().toLowerCase();

    if (
      firstColumn.includes('total') ||
      firstColumn.match(/^[a-zA-Z]{3}\/\d{2}$/) || // jan/25
      firstColumn === '' ||
      lastLine.every(cell => (cell || '').trim() === '')
    ) {
      console.log(`🗑️ Removendo linha agregadora: "${firstColumn}"`);
      dataLines.pop();
    } else {
      break;
    }
  }

  console.log(`📊 Linhas de dados após limpeza: ${dataLines.length}`);

  // Convert to objects with proper headers
  const rawRows = dataLines.map((line: string[]) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = line[index] || '';
    });
    return obj;
  });

  console.log(`📊 Total de linhas no CSV: ${rawRows.length}`);

  // Debug: Log first row to check headers
  if (rawRows.length > 0) {
    console.log(`🔍 Headers detectados:`, Object.keys(rawRows[0]));
    console.log(`🔍 Primeira linha de dados:`, rawRows[0]);
  }

  const processedRows = [];

  for (const row of rawRows) {
    // Skip summary/total lines
    const idCarregamento = (row["Id_Carregamento"] || '').trim();
    const curral = (row["Curral"] || '').trim();
    const data = (row["Data"] || '').trim();
    const hora = (row["Hora"] || '').trim();

    // Filter out total lines or invalid data
    if (!idCarregamento || !curral || !data || !hora ||
        data.toLowerCase().includes('total') ||
        data.match(/^[a-zA-Z]{3}\/\d{2}$/)) {
      console.log(`⏭️ Pulando linha inválida: Id=${idCarregamento}, Curral=${curral}, Data=${data}`);
      continue;
    }

    // Extract and process values
    const dataFormatted = parseDate(data);
    if (!dataFormatted) {
      console.log(`⏭️ Data inválida: ${data}`);
      continue;
    }

    const lote = (row["Lote"] || '').trim();
    const trato = (row["Trato"] || '').trim();
    const realizado_kg = parseNumericValue(row["Peso_Abastecido_kg"]);
    const dieta = (row["Dieta"] || '').trim();

    // Obter vagão com múltiplas variações de header (padrão estabelecido)
    const vagao = (
      row["Vagao"] ||
      row["Vagão"] ||
      row["Vag�o"] ||
      ''
    ).trim();

    const tratador = (row["Tratador"] || '').trim();
    const ms_dieta_pc = parseNumericValue(row["MS_Dieta_PC"]);

    // Debug vagão para as primeiras linhas
    if (processedRows.length < 3) {
      console.log(`🚛 Debug Vagão linha ${processedRows.length + 1}:`);
      console.log(`   row["Vagao"]: "${row["Vagao"]}"`);
      console.log(`   vagao final: "${vagao}"`);
      console.log(`   Todos os campos:`, {
        "Vagao": row["Vagao"],
        "Vagão": row["Vagão"],
        "vagao": row["vagao"]
      });
    }

    // Generate merge field: data + hora + vagao + trato
    const merge = `${dataFormatted}-${hora}-${vagao}-${trato}`;

    const processedRow = {
      organization_id: organizationId,
      file_id: fileId,
      data: dataFormatted,
      hora: hora,
      vagao: vagao,
      curral: curral,
      id_carregamento: idCarregamento,
      lote: lote,
      trato: trato,
      realizado_kg: Math.round(realizado_kg * 100) / 100,
      dieta: dieta,
      tratador: tratador,
      ms_dieta_pc: Math.round(ms_dieta_pc * 100) / 100,
      merge: merge
    };

    console.log(`✅ Linha processada: ${curral} - ${dataFormatted} ${hora}`);
    processedRows.push(processedRow);
  }

  console.log(`✅ Total de linhas processadas: ${processedRows.length}`);

  // Sort by data + curral + hora
  processedRows.sort((a, b) =>
    (a.data + a.curral + a.hora).localeCompare(b.data + b.curral + b.hora)
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
        .from('staging_05_trato_por_curral')
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

    console.log(`🔄 Pipeline 05 - Processando: ${filename} (org: ${organizationId}, fileId: ${actualFileId})`);

    // Check if file was already processed
    console.log(`🔍 Verificando se arquivo já foi processado...`);
    const { data: existingData, error: checkError } = await supabase
      .from('staging_05_trato_por_curral')
      .select('id, created_at')
      .eq('file_id', actualFileId)
      .eq('organization_id', organizationId)
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar duplicação:', checkError);
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
          .from('staging_05_trato_por_curral')
          .delete()
          .eq('file_id', actualFileId)
          .eq('organization_id', organizationId);
      }
    }

    // Download CSV from storage
    console.log(`📁 Baixando arquivo do storage...`);
    const filePath = `${organizationId}/csv-processed/05/${filename}`;
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
    const processedData = await processar05(csvText, organizationId, actualFileId);
    console.log(`✅ Processamento concluído: ${processedData.length} linhas`);

    // Check for duplicate data based on merge keys
    if (processedData.length > 0) {
      console.log(`🔍 Verificando dados duplicados por merge keys...`);
      const sampleMergeKeys = processedData.slice(0, 10).map(row => row.merge);

      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('staging_05_trato_por_curral')
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
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`🔄 Forçando sobrescrita - removendo ${duplicateCheck.length} dados similares existentes por merge keys...`);

          // Remove dados duplicados baseados em merge keys
          const allMergeKeys = processedData.map(row => row.merge);
          await supabase
            .from('staging_05_trato_por_curral')
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
      message: `Pipeline 05 processado: ${insertResults.success} linhas inseridas`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no Pipeline 05:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});