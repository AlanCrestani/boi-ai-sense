import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  filename: string
  organizationId: string
  fileId: string
  forceOverwrite?: boolean
}

// Function to normalize headers to snake_case
function normalizeHeader(header: string): string {
  // Remove BOM and special characters
  header = header.replace(/^\uFEFF/, '').replace(/[^\w\s]/g, ' ')

  // Convert to snake_case
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
}

// Function to convert Brazilian date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
function convertDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null

  // Check if already in ISO format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }

  // Convert from DD/MM/YYYY or DD/MM/YY
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    let year = parts[2]

    // Handle 2-digit year
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year
    }

    return `${year}-${month}-${day}`
  }

  return null
}

// Function to convert Brazilian number format to SQL format
function convertNumber(value: string): number | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'null') {
    return null
  }

  // Remove thousand separators (.) and replace comma with dot
  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? null : parsed
}

// Function to convert integer values
function convertInteger(value: string): number | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'null') {
    return null
  }

  const parsed = parseInt(value.replace(/\D/g, ''))
  return isNaN(parsed) ? null : parsed
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filename, organizationId, fileId, forceOverwrite } = await req.json() as RequestBody

    console.log('Processing CSV 01 - Histórico Consumo:', { filename, organizationId, fileId })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download CSV file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('csv-uploads')
      .download(`${organizationId}/csv-processed/01/${filename}`)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Parse CSV content
    const csvText = await fileData.text()
    let lines = csvText.split('\n').filter(line => line.trim())

    if (lines.length < 3) {
      throw new Error('CSV file is empty or has no data rows')
    }

    // Skip first line (title/date) and use second line as headers
    lines = lines.slice(1) // Remove first line

    // Remove last 2 lines (aggregators/totals)
    if (lines.length > 2) {
      lines = lines.slice(0, -2)
    }

    // Process headers from the first line (which was originally line 2)
    const rawHeaders = lines[0].split(';')
    console.log('Raw headers:', rawHeaders)

    const headers = rawHeaders.map(h => normalizeHeader(h))
    console.log('Normalized headers:', headers)

    // Load header mapping from the official mapping file
    const headerMappingDefinition = {
      'Data': 'data',
      'Localidade': 'curral',
      'Lote': 'lote',
      'Raça': 'raca',
      'Sexo': 'sexo',
      'Cod Grupo Genético': 'cod_grupo_genetico',
      'Grupo Genético': 'grupo_genetico',
      'Setor': 'setor',
      'Proprietário Predominante': 'proprietario_predominante',
      'Origem Predominante': 'origem_predominante',
      'Tipo de Aquisição': 'tipo_aquisicao',
      'Dieta Prevista': 'dieta',
      'Escore': 'escore',
      'Fator de Correção (kg MS/cab)': 'fator_correcao_kg',
      'Escore Noturno': 'escore_noturno',
      'Data Entrada': 'data_entrada',
      'Qtd. Animais': 'qtd_animais',
      'Peso Entrada (Kg)': 'peso_entrada_kg',
      'Peso Médio Estimado (Kg)': 'peso_estimado_kg',
      'Dia Confinamento': 'dias_confinados',
      'Consumo Total (Kg MN)': 'consumo_total_kg_mn',
      'Consumo Total (Kg MS)': 'consumo_total_ms',
      '%MS Dieta Meta': 'ms_dieta_meta_pc',
      '%MS Dieta Real': 'ms_dieta_real_pc',
      'CMS Previsão/(Kg/Cab)': 'cms_previsto_kg',
      'CMS Real/(Kg/Cab)': 'cms_realizado_kg',
      'CMN Previsão/(Kg/Cab)': 'cmn_previsto_kg',
      'CMN Real/(Kg/Cab)': 'cmn_realizado_kg',
      'GMD Médio (Gramas)': 'gmd_kg',
      'CMS Referência (%PV)': 'cms_referencia_pcpv',
      'CMS Referência (Kg/Cab)': 'cms_referencia_kg',
      'CMS Real (%PV)': 'cms_realizado_pcpv'
    }

    // Map headers to database columns using exact matching
    const headerMapping: { [key: string]: string } = {}

    headers.forEach((header, index) => {
      const originalHeader = rawHeaders[index]?.trim()
      console.log(`Analyzing header ${index}: "${header}" (original: "${originalHeader}")`)

      // Try exact match first
      if (headerMappingDefinition[originalHeader]) {
        headerMapping[header] = headerMappingDefinition[originalHeader]
        console.log(`  → Exact match mapped to: ${headerMappingDefinition[originalHeader]}`)
        return
      }

      // Try fuzzy matching for common variations
      const cleanOriginal = originalHeader?.replace(/[^\w\s]/g, '').trim()
      for (const [csvHeader, dbColumn] of Object.entries(headerMappingDefinition)) {
        const cleanCsv = csvHeader.replace(/[^\w\s]/g, '').trim()
        if (cleanOriginal && cleanCsv.toLowerCase() === cleanOriginal.toLowerCase()) {
          headerMapping[header] = dbColumn
          console.log(`  → Fuzzy match mapped to: ${dbColumn}`)
          return
        }
      }

      console.log(`  → NOT MAPPED (original: "${originalHeader}")`)
    })

    console.log('Final header mapping:', headerMapping)
    console.log('Total mapped headers:', Object.keys(headerMapping).length)

    // Check for forceOverwrite flag
    if (forceOverwrite) {
      console.log('Force overwrite enabled, deleting existing data...')
      const { error: deleteError } = await supabaseClient
        .from('staging_01_historico_consumo')
        .delete()
        .eq('organization_id', organizationId)
        .eq('file_id', fileId)

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError)
      }
    }

    // Process data rows
    const processedRows = []
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    const totalDataRows = lines.length - 1 // Total data rows (excluding header)

    // Log first data row for debugging
    if (lines.length > 1) {
      console.log('First data row (raw):', lines[1])
      console.log('First data row (split):', lines[1].split(';'))
    }

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(';')
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
          errorCount++
          continue
        }

        const row: any = {
          organization_id: organizationId,
          file_id: fileId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Map values to columns
        headers.forEach((header, index) => {
          const dbColumn = headerMapping[header]
          if (!dbColumn) {
            // Don't warn for every row, just once
            if (i === 1) {
              console.warn(`Unknown header: ${header}`)
            }
            return
          }

          const value = values[index]?.trim()

          // Log value mapping for first row
          if (i === 1) {
            console.log(`Mapping value: "${value}" → ${dbColumn}`)
          }

          // Handle different data types
          if (dbColumn === 'data' || dbColumn === 'data_entrada') {
            const convertedDate = convertDate(value)
            row[dbColumn] = convertedDate
            if (i === 1) console.log(`  Date converted: "${value}" → ${convertedDate}`)
          } else if (dbColumn === 'qtd_animais' || dbColumn === 'dias_confinados') {
            const convertedInt = convertInteger(value)
            row[dbColumn] = convertedInt
            if (i === 1) console.log(`  Integer converted: "${value}" → ${convertedInt}`)
          } else if (dbColumn.includes('kg') || dbColumn.includes('ms') ||
                     dbColumn.includes('pc') || dbColumn.includes('escore') ||
                     dbColumn.includes('fator') || dbColumn.includes('gmd') ||
                     dbColumn.includes('cms') || dbColumn.includes('cmn') ||
                     dbColumn.includes('pcpv')) {
            const convertedNumber = convertNumber(value)
            row[dbColumn] = convertedNumber
            if (i === 1) console.log(`  Number converted: "${value}" → ${convertedNumber}`)
          } else {
            // Text fields
            const textValue = value || null
            row[dbColumn] = textValue
            if (i === 1) console.log(`  Text value: "${value}" → ${textValue}`)
          }
        })

        // Log first processed row for debugging
        if (i === 1) {
          console.log('First processed row:', row)
        }

        processedRows.push(row)
        successCount++

        // Insert in batches of 100
        if (processedRows.length >= 100) {
          const { error: insertError } = await supabaseClient
            .from('staging_01_historico_consumo')
            .insert(processedRows)

          if (insertError) {
            throw insertError
          }

          console.log(`Inserted batch of ${processedRows.length} rows`)
          processedRows.length = 0
        }

      } catch (rowError) {
        errors.push(`Row ${i + 1}: ${rowError.message}`)
        errorCount++
      }
    }

    // Insert remaining rows
    if (processedRows.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('staging_01_historico_consumo')
        .insert(processedRows)

      if (insertError) {
        throw insertError
      }

      console.log(`Inserted final batch of ${processedRows.length} rows`)
    }

    const response = {
      success: true,
      message: `CSV processing completed`,
      summary: {
        totalRows: totalDataRows,
        successfulRows: successCount,
        failedRows: errorCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    }

    console.log('Processing complete:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing CSV:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})