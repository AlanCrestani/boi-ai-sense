import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================
// Pipeline 02 - Desvio Carregamento
// =============================
interface RawRow02 {
  [key: string]: string;
}

interface ProcessedRow02 {
  organization_id: string;
  file_id: string;
  data: string;
  hora: string;
  pazeiro: string;
  vagao: string;
  dieta: string;
  nro_carregamento: string;
  ingrediente: string;
  tipo_ingrediente: string;
  realizado_kg: number;
  previsto_kg: number;
  desvio_kg: number;
  desvio_pc: number;
  status: string;
  merge: string;
  id_carregamento: string;
}

function parseNumericValue(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  // Handle Brazilian number format: remove thousand separators (.) and convert decimal comma to dot
  let cleaned = value.replace('%', '').trim();

  // If there are multiple dots and one comma, it's Brazilian format (1.234.567,89)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Remove thousand separators (dots) and convert decimal comma to dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Only comma, it's decimal separator
    cleaned = cleaned.replace(',', '.');
  }
  // If only dots, could be thousands (1.234) or decimal (1.23) - assume decimal for smaller numbers

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(dateString: string | undefined): string {
  if (!dateString || dateString.trim() === '') return '';

  // Handle Brazilian date format dd/MM/yyyy or dd-MM-yyyy
  const cleaned = dateString.trim();
  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/MM/yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // dd-MM-yyyy
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`; // yyyy-MM-dd format for Supabase
    }
  }

  // If no pattern matches, return as-is
  return cleaned;
}

function calculateStatus(desvioPercentual: number): string {
  const absDesvio = Math.abs(desvioPercentual);
  if (absDesvio < 5) return 'VERDE';
  if (absDesvio < 10) return 'AMARELO';
  return 'VERMELHO';
}

async function processar02(
  csvText: string,
  organizationId: string,
  fileId: string
): Promise<ProcessedRow02[]> {
  console.log('🔄 Iniciando processamento Pipeline 02');

  // Split lines to handle Brazilian CSV format with potential title line
  const lines = csvText.split('\n');
  console.log(`📄 Total de linhas no arquivo: ${lines.length}`);

  // Find the actual header line (contains "Data;Hora;Pazeiro")
  let headerLineIndex = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('Data;Hora;Pazeiro')) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    throw new Error('Header line not found in CSV');
  }

  console.log(`📋 Header encontrado na linha ${headerLineIndex + 1}`);

  // Reconstruct CSV starting from header
  const csvData = lines.slice(headerLineIndex).join('\n');

  // Parse CSV with semicolon delimiter
  const { data: rawRows } = Papa.parse<RawRow02>(csvData, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Fix encoding issues for common headers
      return header
        .replace('Vag�o', 'Vagão')
        .replace('Pr�-Mistura', 'Pré-Mistura')
        .trim();
    }
  });

  console.log(`📊 Total de linhas no CSV: ${rawRows.length}`);

  const processedRows: ProcessedRow02[] = [];

  for (const row of rawRows) {
    // Skip summary/total lines that appear at the end of CSV
    const data = (row["Data"] || '').trim();
    const hora = (row["Hora"] || '').trim();
    const pazeiro = (row["Pazeiro"] || '').trim();

    // Filter out total lines (Total:, jan/15, etc.)
    if (data.toLowerCase().includes('total') ||
        data.match(/^[a-zA-Z]{3}\/\d{2}$/) ||  // jan/15, fev/22, etc.
        !data || !hora || !pazeiro) {
      console.log(`⏭️ Pulando linha de total/agrupamento: Data="${data}", Hora="${hora}", Pazeiro="${pazeiro}"`);
      continue;
    }

    // Get vagao with multiple possible header variations
    const vagao = (row["Vagão"] || row["Vag�o"] || row["Vagao"] || '').toUpperCase().trim();

    console.log(`🚛 Processando vagão: "${vagao}"`);

    // Filter only BAHMAN and SILOKING (more flexible matching)
    if (!vagao || (!vagao.includes('BAHMAN') && !vagao.includes('SILOKING'))) {
      console.log(`⏭️ Pulando vagão: "${vagao}" (não é BAHMAN/SILOKING)`);
      continue;
    }

    // Extract and process values with Brazilian format
    const realizado = parseNumericValue(row["Carregado (kg)"]);
    const previsto = parseNumericValue(row["Previsto (kg)"]);
    const desvioKg = parseNumericValue(row["Desvio (kg)"]) || (realizado - previsto);
    const desvioPercent = parseNumericValue(row["Desvio (%)"]) ||
                          (previsto !== 0 ? (desvioKg / previsto) * 100 : 0);

    // Determine status based on deviation
    const status = row["Status"]?.toUpperCase() || calculateStatus(desvioPercent);

    // Parse and format date
    const dataFormatted = parseDate(row["Data"]);

    // Generate merge field with formatted date
    const merge = `${dataFormatted} ${hora}-${vagao}`;

    const processedRow: ProcessedRow02 = {
      organization_id: organizationId,
      file_id: fileId,
      data: dataFormatted,
      hora: hora,
      pazeiro: (row["Pazeiro"] || '').toUpperCase().trim(),
      vagao: vagao,
      dieta: (row["Dieta"] || '').toUpperCase().trim(),
      nro_carregamento: (row["Nro Carregamento"] || '').trim(),
      ingrediente: (row["Ingrediente"] || '').toUpperCase().trim(),
      tipo_ingrediente: (row["Tipo Ingrediente"] || '').toUpperCase().trim(),
      realizado_kg: realizado,
      previsto_kg: previsto,
      desvio_kg: desvioKg,
      desvio_pc: Math.round(desvioPercent * 100) / 100, // Round to 2 decimals
      status: status,
      merge: merge,
      id_carregamento: crypto.randomUUID()
    };

    console.log(`✅ Linha processada: ${vagao} - ${dataFormatted} ${hora}`);
    processedRows.push(processedRow);
  }

  console.log(`✅ Total de linhas processadas (BAHMAN/SILOKING): ${processedRows.length}`);

  // Sort by data + vagao + hora
  processedRows.sort((a, b) =>
    (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora)
  );

  return processedRows;
}

async function insertInBatches(
  rows: ProcessedRow02[],
  batchSize: number = 500
): Promise<{ success: number; errors: any[] }> {
  const results = { success: 0, errors: [] as any[] };

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`📦 Inserindo batch ${Math.floor(i / batchSize) + 1} com ${batch.length} linhas`);

    try {
      const { error } = await supabase
        .from('staging_02_desvio_carregamento')
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

    // Generate fileId if not provided
    const actualFileId = fileId || crypto.randomUUID();

    // Check if file was already processed
    console.log(`🔍 Verificando se arquivo já foi processado...`);
    const { data: existingData, error: checkError } = await supabase
      .from('staging_02_desvio_carregamento')
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
          .from('staging_02_desvio_carregamento')
          .delete()
          .eq('file_id', actualFileId)
          .eq('organization_id', organizationId);
      }
    }

    // Download CSV file from storage using organizational structure
    const filePath = `${organizationId}/csv-processed/02/${filename}`;
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
    const processedData = await processar02(csvText, organizationId, actualFileId);

    if (processedData.length === 0) {
      console.warn('⚠️ Nenhuma linha válida encontrada para processar');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma linha de BAHMAN ou SILOKING encontrada no arquivo',
        filename,
        rowsProcessed: 0,
        rowsInserted: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate data based on merge keys (optional additional check)
    if (processedData.length > 0) {
      console.log(`🔍 Verificando dados duplicados por merge keys...`);
      const sampleMergeKeys = processedData.slice(0, 10).map(row => row.merge);

      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('staging_02_desvio_carregamento')
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
            .from('staging_02_desvio_carregamento')
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
      message: `Pipeline 02 processado: ${insertResults.success} linhas inseridas em staging_02_desvio_carregamento`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});