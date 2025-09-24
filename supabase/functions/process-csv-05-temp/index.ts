import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filename, organizationId, fileId, forceOverwrite } = await req.json();

    console.log(`🔄 Processando CSV 05: ${filename} para organização: ${organizationId}`);

    // Verificar se já existe processamento para este arquivo
    if (!forceOverwrite) {
      const { count: existingCount } = await supabase
        .from('staging_05_trato_por_curral')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('file_id', fileId);

      if (existingCount && existingCount > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Já existem ${existingCount} registros para este arquivo. Use forceOverwrite para reprocessar.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Limpar dados existentes se forceOverwrite
    if (forceOverwrite) {
      await supabase
        .from('staging_05_trato_por_curral')
        .delete()
        .eq('organization_id', organizationId)
        .eq('file_id', fileId);
    }

    // Buscar o arquivo CSV do storage (tentar ambos os locais)
    let filePath = `${organizationId}/05/${filename}`;
    let { data: fileData, error: downloadError } = await supabase.storage
      .from('csv-uploads')
      .download(filePath);

    // Se não encontrar, tentar na pasta csv-processed
    if (downloadError) {
      filePath = `${organizationId}/csv-processed/05/${filename}`;
      const result = await supabase.storage
        .from('csv-uploads')
        .download(filePath);
      fileData = result.data;
      downloadError = result.error;
    }

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }

    // Converter para texto
    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    console.log(`📄 Arquivo tem ${lines.length} linhas`);

    if (lines.length <= 1) {
      throw new Error('Arquivo CSV está vazio ou só tem cabeçalho');
    }

    // Processar cabeçalho - detectar separador (vírgula ou ponto-vírgula)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    console.log(`🔍 Separador detectado: "${separator}"`);

    // Encontrar linha de header real (pode não ser a primeira)
    let headerLineIndex = 0;
    let header = [];
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const testHeader = lines[i].split(separator).map(col => col.trim().replace(/"/g, ''));
      if (testHeader.some(col => col.toLowerCase().includes('data') ||
                               col.toLowerCase().includes('curral') ||
                               col.toLowerCase().includes('trato'))) {
        header = testHeader;
        headerLineIndex = i;
        break;
      }
    }

    let dataLines = lines.slice(headerLineIndex + 1);

    console.log(`📋 Cabeçalho: ${header.join(', ')}`);

    // Filtrar linhas inválidas (vazias, totais, etc)
    dataLines = dataLines.filter(line => {
      const values = line.split(separator).map(val => val.trim().replace(/"/g, ''));

      // Pular linhas vazias
      if (values.length < 3 || values.every(val => !val)) return false;

      // Pular linhas que são claramente totais/agregações
      const firstCol = values[0].toLowerCase();
      if (firstCol.includes('total') || firstCol.includes('soma') || firstCol.includes('média')) return false;

      // Validar se tem uma data válida (diferentes formatos possíveis)
      const dataCol = values.find(val => val && (
        val.match(/\d{4}-\d{2}-\d{2}/) ||           // YYYY-MM-DD
        val.match(/\d{2}\/\d{2}\/\d{4}/) ||        // DD/MM/YYYY
        val.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||    // D/M/YYYY ou DD/MM/YYYY
        val.match(/\d{2}-\d{2}-\d{4}/)             // DD-MM-YYYY
      ));
      return !!dataCol;
    });

    console.log(`📊 Após filtros: ${dataLines.length} linhas válidas`);

    // Mapear colunas esperadas para staging_05_trato_por_curral
    const expectedColumns = {
      'Data': 'data',
      'Hora': 'hora',
      'Curral': 'curral',
      'Trato': 'trato',
      'Tratador': 'tratador',
      'Dieta': 'dieta',
      'Realizado': 'realizado_kg',
      'Realizado (kg)': 'realizado_kg',
      'Previsto': 'previsto_kg',
      'Previsto (kg)': 'previsto_kg',
      'Diferença': 'diferenca_kg',
      'Diferença (kg)': 'diferenca_kg',
      'Desvio': 'desvio_pc',
      'Desvio (%)': 'desvio_pc',
      'Desvio %': 'desvio_pc'
    };

    // Mapear índices das colunas
    const columnIndices = {};
    for (const [csvCol, dbCol] of Object.entries(expectedColumns)) {
      if (columnIndices[dbCol]) continue; // Já encontrou
      const index = header.findIndex(h =>
        h.toLowerCase().includes(csvCol.toLowerCase()) ||
        h.toLowerCase().trim() === csvCol.toLowerCase()
      );
      if (index !== -1) {
        columnIndices[dbCol] = index;
      }
    }

    // Log detalhado do mapeamento
    console.log(`📋 Header encontrado:`, header);
    console.log(`🗺️ Colunas mapeadas:`, Object.keys(columnIndices));
    console.log(`⚠️ Colunas não encontradas:`, Object.values(expectedColumns).filter(col => !columnIndices[col]));

    console.log(`🗺️ Mapeamento de colunas:`, columnIndices);

    // Debug: mostrar primeira linha de dados
    if (dataLines.length > 0) {
      const firstLine = dataLines[0];
      const firstValues = firstLine.split(separator).map(val => val.trim().replace(/"/g, ''));
      console.log(`🔍 Primeira linha de dados:`, firstValues);
      console.log(`🔍 Header:`, header);
    }

    // Processar dados em lotes para evitar timeout
    const batchSize = 500;
    let totalInserted = 0;
    let errors = [];

    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const batchData = [];

      for (const line of batch) {
        try {
          const values = line.split(separator).map(val => val.trim().replace(/"/g, ''));

          // Debug primeira linha do primeiro lote
          if (i === 0 && batchData.length === 0) {
            console.log(`🔍 Processando primeira linha:`, values.slice(0, 5));
          }

          // Função para converter data para formato YYYY-MM-DD
          const convertDate = (dateStr) => {
            if (!dateStr) return null;

            // Se já está no formato correto
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

            // Converter DD/MM/YYYY ou D/M/YYYY para YYYY-MM-DD
            if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const [day, month, year] = dateStr.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            // Converter DD-MM-YYYY para YYYY-MM-DD
            if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const [day, month, year] = dateStr.split('-');
              return `${year}-${month}-${day}`;
            }

            return null; // Formato não reconhecido
          };

          // Validar se a linha tem dados válidos
          const rawData = values[columnIndices.data] || null;
          const data = convertDate(rawData);
          const curral = values[columnIndices.curral] || null;
          const trato = values[columnIndices.trato] || null;

          // Debug primeiras linhas
          if (i === 0 && batchData.length < 3) {
            console.log(`🔍 Linha ${batchData.length + 1}: rawData=${rawData}, data=${data}, curral=${curral}, trato=${trato}`);
            console.log(`🔍 Valores extraídos:`, {
              hora: values[columnIndices.hora],
              tratador: values[columnIndices.tratador],
              dieta: values[columnIndices.dieta]
            });
          }

          // Pular linhas sem dados essenciais
          if (!data || !curral) {
            console.log(`⚠️ Linha ignorada - dados inválidos: data=${rawData}→${data}, curral=${curral}`);
            continue;
          }

          const record = {
            organization_id: organizationId,
            file_id: crypto.randomUUID(), // Gerar UUID válido
            data: data,
            hora: values[columnIndices.hora] || null,
            curral: curral,
            trato: trato,
            tratador: values[columnIndices.tratador] || null,
            dieta: values[columnIndices.dieta] || null,
            realizado_kg: values[columnIndices.realizado_kg] ? parseFloat(values[columnIndices.realizado_kg]) : null,
            previsto_kg: values[columnIndices.previsto_kg] ? parseFloat(values[columnIndices.previsto_kg]) : null,
            diferenca_kg: values[columnIndices.diferenca_kg] ? parseFloat(values[columnIndices.diferenca_kg]) : null,
            desvio_pc: values[columnIndices.desvio_pc] ? parseFloat(values[columnIndices.desvio_pc]) : null,
            status: 'VERDE',
            merge: null
          };

          batchData.push(record);
        } catch (error) {
          errors.push(`Linha ${i + batchData.length + 1}: ${error.message}`);
        }
      }

      if (batchData.length > 0) {
        const { error: insertError } = await supabase
          .from('staging_05_trato_por_curral')
          .insert(batchData);

        if (insertError) {
          console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, insertError);
          errors.push(`Lote ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
        } else {
          totalInserted += batchData.length;
          console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${batchData.length} registros (Total: ${totalInserted})`);
        }
      }
    }

    const summary = {
      totalRows: dataLines.length,
      successfulRows: totalInserted,
      failedRows: dataLines.length - totalInserted,
      errors: errors.slice(0, 10) // Primeiros 10 erros
    };

    console.log(`✅ Processamento concluído: ${totalInserted}/${dataLines.length} registros inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        fileId,
        rowsProcessed: dataLines.length,
        rowsInserted: totalInserted,
        summary,
        message: `Processamento concluído: ${totalInserted} registros inseridos`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});