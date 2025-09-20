import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================
// Pipeline 02 - Desvio Carregamento
// =============================
async function processar02(csvText: string) {
  let { data: rows } = Papa.parse(csvText, { header: true, delimiter: ";" });

  rows = (rows as any[])
    .slice(1) // Skip linhas superiores
    .map((r) => ({
      data: r["Data"],
      hora: r["Hora"],
      pazeiro: r["Pazeiro"]?.toUpperCase(),
      vagao: r["Vagão"]?.toUpperCase(),
      dieta: r["Dieta"]?.toUpperCase(),
      nro_carregamento: r["Nro Carregamento"],
      ingrediente: r["Ingrediente"]?.toUpperCase(),
      tipo_ingrediente: r["Tipo Ingrediente"]?.toUpperCase(),
      realizado_kg: parseFloat(r["Carregado (kg)"] || 0),
      previsto_kg: parseFloat(r["Previsto (kg)"] || 0),
      desvio_kg: parseFloat(r["Desvio (kg)"] || 0),
      desvio_pc: parseFloat(r["Desvio (%)"] || 0),
      status: r["Status"]?.toUpperCase(),
      merge: `${r["Data"]} ${r["Hora"]}-${r["Vagão"]}`,
    }))
    .filter((r) => ["BAHMAN", "SILOKING"].includes(r.vagao));

  rows.sort((a, b) => (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora));
  return rows;
}

// =============================
// Pipeline 03 - Desvio Distribuição
// =============================
async function processar03(csvText: string) {
  let { data: rows } = Papa.parse(csvText, { header: true, delimiter: ";" });

  rows = (rows as any[])
    .slice(1)
    .map((r) => ({
      data: r["Data"],
      hora: r["Hora"],
      trato: (r["Trato"] || "").split(" ")[1], // Text.AfterDelimiter
      tratador: r["Tratador"]?.toUpperCase(),
      vagao: r["Vagão"]?.toUpperCase(),
      curral: r["Curral"],
      dieta: r["Dieta"]?.toUpperCase(),
      realizado_kg: parseFloat(r["Distribuído (kg)"] || 0),
      previsto_kg: parseFloat(r["Previsto (kg)"] || 0),
      desvio_kg: parseFloat(r["Desvio (kg)"] || 0),
      desvio_pc: parseFloat(r["Desvio (%)"] || 0),
      status: r["Status"]?.toUpperCase(),
      merge: `${r["Data"]} ${r["Hora"]}-${r["Vagão"]}-${r["Curral"]}-${(r["Trato"] || "").split(" ")[1]}`,
    }))
    .filter((r) => ["BAHMAN", "SILOKING"].includes(r.vagao));

  rows.sort((a, b) => (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora));
  return rows;
}

// =============================
// Pipeline 04 - Itens de Trato
// =============================
async function processar04(csvText: string) {
  let { data: rows } = Papa.parse(csvText, { header: true, delimiter: ";" });

  rows = (rows as any[]).map((r) => ({
    data: r["Data de Inclusão"],
    hora: r["Hora"],
    vagao: r["Vagão"]?.toUpperCase(),
    id_carregamento: r["Id. Carregamento"],
    dieta: r["Dieta"]?.toUpperCase(),
    carregamento: r["Carregamento"],
    ingrediente: r["Ingrediente"]?.toUpperCase(),
    realizado_kg: parseFloat(r["Quantidade MN (kg)"] || 0),
    pazeiro: r["Motorista"]?.toUpperCase(),
    ms_dieta_pc: parseFloat(r["%MS Dieta Real"] || 0),
    merge: `${r["Data de Inclusão"]} ${r["Hora"]}-${r["Vagão"]}`,
  })).filter((r) => ["BAHMAN", "SILOKING"].includes(r.vagao));

  return rows;
}

// =============================
// Pipeline 05 - Trato por Curral
// =============================
async function processar05(csvText: string) {
  let { data: rows } = Papa.parse(csvText, { header: true, delimiter: ";" });

  rows = (rows as any[])
    .slice(1)
    .map((r) => ({
      data: r["Data"],
      hora: r["Hora"],
      vagao: r["Vagão"]?.toUpperCase(),
      curral: r["Curral"],
      id_carregamento: r["Id. Carregamento"],
      lote: r["Lote"],
      trato: r["Trato"],
      realizado_kg: parseFloat(r["Peso Abastecido (kg)"] || 0),
      dieta: r["Dieta"]?.toUpperCase(),
      tratador: r["Tratador"],
      ms_dieta_pc: parseFloat(r["%MS Dieta Real"] || 0),
      merge: `${r["Data"]} ${r["Hora"]}-${r["Vagão"]}-${r["Curral"]}-${r["Trato"]}`,
    }))
    .filter((r) => ["BAHMAN", "SILOKING"].includes(r.vagao));

  rows.sort((a, b) => (a.data + a.vagao + a.hora).localeCompare(b.data + b.vagao + b.hora));
  return rows;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pipeline, filename, fileId, organizationId } = await req.json();

    console.log(`Processing pipeline ${pipeline} for file: ${filename}`);
    console.log(`File ID: ${fileId}, Organization ID: ${organizationId}`);

    // Read CSV file from storage
    const { data: csvFile, error: downloadError } = await supabase.storage
      .from('csv-uploads')
      .download(`${pipeline.padStart(2, '0')}/${filename}`);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const csvText = await csvFile.text();

    // Parse raw CSV data and save to staging_csv_raw
    const { data: rawRows } = Papa.parse(csvText, { header: true, delimiter: ";" });
    const headers = Object.keys(rawRows[0] || {});

    console.log(`Parsed ${rawRows.length} raw rows with headers:`, headers);

    // Insert raw data into staging table
    const rawStagingData = rawRows.map((row, index) => ({
      organization_id: organizationId,
      file_id: fileId,
      row_number: index + 1,
      raw_data: row,
      headers: headers
    }));

    if (rawStagingData.length > 0) {
      const { error: rawInsertError } = await supabase
        .from('staging_csv_raw')
        .insert(rawStagingData);

      if (rawInsertError) {
        console.error('Error inserting raw data:', rawInsertError);
        throw new Error(`Failed to insert raw data: ${rawInsertError.message}`);
      }

      console.log(`✅ Inserted ${rawStagingData.length} rows into staging_csv_raw`);
    }

    // Process based on pipeline
    let processedData;
    switch (pipeline) {
      case '02':
        processedData = await processar02(csvText);
        break;
      case '03':
        processedData = await processar03(csvText);
        break;
      case '04':
        processedData = await processar04(csvText);
        break;
      case '05':
        processedData = await processar05(csvText);
        break;
      default:
        throw new Error(`Pipeline ${pipeline} not supported`);
    }

    console.log(`Processed ${processedData.length} rows for pipeline ${pipeline}`);

    // Insert processed data into staging_csv_processed
    const processedStagingData = processedData.map((row, index) => ({
      organization_id: organizationId,
      file_id: fileId,
      row_number: index + 1,
      original_data: rawRows[index] || {},
      mapped_data: row,
      validation_status: 'valid', // Basic validation - could be enhanced
      validation_errors: [],
      validation_warnings: []
    }));

    if (processedStagingData.length > 0) {
      const { error: processedInsertError } = await supabase
        .from('staging_csv_processed')
        .insert(processedStagingData);

      if (processedInsertError) {
        console.error('Error inserting processed data:', processedInsertError);
        throw new Error(`Failed to insert processed data: ${processedInsertError.message}`);
      }

      console.log(`✅ Inserted ${processedStagingData.length} rows into staging_csv_processed`);
    }

    // Convert processed data back to CSV for storage backup
    const processedCsv = Papa.unparse(processedData);

    // Save processed file to csv-processed folder
    const processedFilename = filename.replace('.csv', '_processed.csv');
    const { error: uploadError } = await supabase.storage
      .from('csv-uploads')
      .upload(`csv-processed/${pipeline.padStart(2, '0')}/${processedFilename}`,
        new Blob([processedCsv], { type: 'text/csv' }),
        {
          cacheControl: '3600',
          upsert: true
        }
      );

    if (uploadError) {
      console.warn('Storage upload warning (non-fatal):', uploadError);
      // Don't throw error here - staging data is more important than file backup
    } else {
      console.log(`✅ Backup file saved as: ${processedFilename}`);
    }

    return new Response(JSON.stringify({
      success: true,
      pipeline,
      filename,
      processedFilename,
      rowsProcessed: processedData.length,
      rawRowsStaged: rawStagingData.length,
      processedRowsStaged: processedStagingData.length,
      message: `Pipeline ${pipeline} processed successfully and staged in database`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});