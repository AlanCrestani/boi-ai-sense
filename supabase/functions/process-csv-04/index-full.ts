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
// Pipeline 04 - Itens de Trato
// =============================
interface RawRow04 {
  [key: string]: string;
}

interface ProcessedRow04 {
  organization_id: string;
  file_id: string;
  data: string;
  id_carregamento_original: string;
  hora: string;
  dieta: string;
  carregamento: string;
  ingrediente: string;
  realizado_kg: number;
  pazeiro: string;
  vagao: string;
  ms_dieta_pc: number;
  ndt_dieta_pc: number;
  merge: string;
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

async function processar04(
  csvText: string,
  organizationId: string,
  fileId: string
): Promise<ProcessedRow04[]> {
  console.log('🔄 Iniciando processamento Pipeline 04');

  // Parse CSV with semicolon delimiter
  const { data: rawRows } = Papa.parse<RawRow04>(csvText, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true
  });

  console.log(`📊 Total de linhas no CSV: ${rawRows.length}`);

  const processedRows: ProcessedRow04[] = [];

  for (const row of rawRows) {
    // Skip empty rows or summary lines
    const dataInclusao = (row["Data de Inclusão"] || row["Data de Inclus�o"] || '').trim();
    const hora = (row["Hora"] || '').trim();
    const motorista = (row["Motorista"] || '').trim();

    // Filter out total lines or empty data
    if (dataInclusao.toLowerCase().includes('total') ||
        dataInclusao.match(/^[a-zA-Z]{3}\/\d{2}$/) ||  // jan/15, fev/22, etc.
        !dataInclusao || !hora || !motorista) {
      console.log(`⏭️ Pulando linha de total/agrupamento: Data="${dataInclusao}", Hora="${hora}", Motorista="${motorista}"`);
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

    // Parse and format date
    const dataFormatted = parseDate(dataInclusao);

    // Generate merge field
    const merge = `${dataFormatted} ${hora}-${vagao}`;

    const processedRow: ProcessedRow04 = {
      organization_id: organizationId,
      file_id: fileId,
      data: dataFormatted,
      id_carregamento_original: row["Id. Carregamento"] || '',
      hora: hora,
      dieta: (row["Dieta"] || '').toUpperCase().trim(),
      carregamento: row["Carregamento"] || '',
      ingrediente: (row["Ingrediente"] || '').toUpperCase().trim(),
      realizado_kg: parseNumericValue(row["Quantidade MN (kg)"]),
      pazeiro: (row["Motorista"] || '').toUpperCase().trim(),
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
  processedRows.sort((a, b) =>
    (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora)
  );

  return processedRows;
}

async function insertInBatches(
  rows: ProcessedRow04[],
  batchSize: number = 500
): Promise<{ success: number; errors: any[] }> {
  const results = { success: 0, errors: [] as any[] };

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
    const { filename, fileId, organizationId } = await req.json();

    console.log(`🚀 Processando arquivo: ${filename}`);
    console.log(`📋 File ID: ${fileId}, Organization ID: ${organizationId}`);

    // Validate required parameters
    if (!filename || !organizationId) {
      throw new Error('Parâmetros obrigatórios ausentes: filename e organizationId');
    }

    // Generate fileId if not provided
    const actualFileId = fileId || crypto.randomUUID();

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert data in batches
    const insertResults = await insertInBatches(processedData);

    // Check if file already exists in staging to avoid duplicates
    const { data: existingData } = await supabase
      .from('staging_04_itens_trato')
      .select('id')
      .eq('file_id', actualFileId)
      .limit(1);

    if (existingData && existingData.length > 0) {
      console.warn('⚠️ Arquivo já foi processado anteriormente');
    }

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});