import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, forceOverwrite = false } = await req.json();

    if (!organizationId) {
      throw new Error('organizationId é obrigatório');
    }

    console.log(`🔄 Iniciando processamento fato_distribuicao para organização: ${organizationId}`);

    // Verificar se já existe dados
    if (!forceOverwrite) {
      const { data: existingData, error: checkError } = await supabase
        .from('fato_distribuicao')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      if (!checkError && existingData && existingData.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Dados já existem na fato_distribuicao. Use forceOverwrite: true para reprocessar.',
          existingRecords: existingData.length
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Limpar dados existentes se forceOverwrite
      console.log('🧹 Limpando dados existentes da fato_distribuicao...');
      await supabase
        .from('fato_distribuicao')
        .delete()
        .eq('organization_id', organizationId);
    }

    // Buscar dados da staging_03 (base) com paginação
    console.log('📥 Buscando dados da staging_03_desvio_distribuicao...');
    let allStaging03Data = [];
    let start = 0;
    const pageSize = 999;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from('staging_03_desvio_distribuicao')
        .select(`
          organization_id,
          file_id,
          data,
          hora,
          vagao,
          curral,
          trato,
          tratador,
          dieta,
          realizado_kg,
          previsto_kg,
          desvio_kg,
          desvio_pc,
          status,
          merge
        `)
        .eq('organization_id', organizationId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })
        .order('vagao', { ascending: true })
        .range(start, start + pageSize - 1);

      if (fetchError) {
        console.error('❌ Erro buscando staging_03:', fetchError);
        throw new Error(`Erro na staging_03: ${fetchError.message}`);
      }

      if (pageData && pageData.length > 0) {
        allStaging03Data = allStaging03Data.concat(pageData);
        hasMore = pageData.length === pageSize;
        start += pageSize;
        console.log(`📄 Página ${Math.floor(start/pageSize)}: ${pageData.length} registros (Total: ${allStaging03Data.length})`);
      } else {
        hasMore = false;
      }
    }

    const staging03Data = allStaging03Data;

    if (!staging03Data || staging03Data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhum dado encontrado na staging_03_desvio_distribuicao para esta organização',
        organizationId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 ${staging03Data.length} registros encontrados na staging_03`);

    // Buscar dados da staging_05 para enriquecimento com paginação
    console.log('🔗 Buscando dados da staging_05_trato_por_curral para enriquecimento...');
    let allStaging05Data = [];
    let start05 = 0;
    let hasMore05 = true;

    while (hasMore05) {
      const { data: pageData05, error: fetchError05 } = await supabase
        .from('staging_05_trato_por_curral')
        .select('data, hora, vagao, trato, id_carregamento, realizado_kg, merge')
        .eq('organization_id', organizationId)
        .range(start05, start05 + pageSize - 1);

      if (fetchError05) {
        console.warn('⚠️ Erro buscando staging_05:', fetchError05);
        hasMore05 = false;
      } else if (pageData05 && pageData05.length > 0) {
        allStaging05Data = allStaging05Data.concat(pageData05);
        hasMore05 = pageData05.length === pageSize;
        start05 += pageSize;
        console.log(`📄 Staging_05 página ${Math.floor(start05/pageSize)}: ${pageData05.length} registros (Total: ${allStaging05Data.length})`);
      } else {
        hasMore05 = false;
      }
    }

    console.log(`📊 ${allStaging05Data.length} registros encontrados na staging_05`);

    // Criar mapas de enriquecimento
    // Mapa principal: data + hora + vagao + trato
    const enrichmentMapMain = new Map();
    // Mapa fallback: data + vagao + trato + realizado_kg
    const enrichmentMapFallback = new Map();

    if (allStaging05Data && allStaging05Data.length > 0) {
      allStaging05Data.forEach((row) => {
        if (row.id_carregamento) {
          // Normalizar trato para apenas número
          const tratoNormalizado = (row.trato || '').toString().replace(/^Trato\s*/i, '').trim();

          // Chave principal: data + hora + vagao + trato
          if (row.data && row.hora && row.vagao && tratoNormalizado) {
            const keyMain = `${row.data}|${row.hora}|${row.vagao}|${tratoNormalizado}`;
            enrichmentMapMain.set(keyMain, row.id_carregamento);
          }

          // Chave fallback: data + vagao + trato + realizado_kg
          if (row.data && row.vagao && tratoNormalizado && row.realizado_kg !== null) {
            const keyFallback = `${row.data}|${row.vagao}|${tratoNormalizado}|${row.realizado_kg}`;
            enrichmentMapFallback.set(keyFallback, row.id_carregamento);
          }
        }
      });

      console.log(`🔗 Mapa principal: ${enrichmentMapMain.size} chaves mapeadas`);
      console.log(`🔗 Mapa fallback: ${enrichmentMapFallback.size} chaves mapeadas`);
    }

    // Processar dados com enriquecimento
    console.log('🔄 Processando dados com enriquecimento e tratamento...');
    let enrichedByMain = 0;
    let enrichedByFallback = 0;

    const processedData = staging03Data.map((row) => {
      // Normalizar campo trato - extrair apenas o número
      let tratoProcessed = (row.trato || '').toString().replace(/^Trato\s*/i, '').trim();

      let id_carregamento = null;

      // Tentar merge principal: data + hora + vagao + trato
      if (row.data && row.hora && row.vagao && tratoProcessed) {
        const keyMain = `${row.data}|${row.hora}|${row.vagao}|${tratoProcessed}`;
        id_carregamento = enrichmentMapMain.get(keyMain);

        if (id_carregamento) {
          enrichedByMain++;
        }
      }

      // Se não encontrou, tentar fallback: data + vagao + trato + realizado_kg
      if (!id_carregamento && row.data && row.vagao && tratoProcessed && row.realizado_kg !== null) {
        const keyFallback = `${row.data}|${row.vagao}|${tratoProcessed}|${row.realizado_kg}`;
        id_carregamento = enrichmentMapFallback.get(keyFallback);

        if (id_carregamento) {
          enrichedByFallback++;
        }
      }

      // Recalcular merge com trato normalizado
      const mergeCorrigido = row.data && row.hora && row.vagao && tratoProcessed
        ? `${row.data}-${row.hora}-${row.vagao}-${tratoProcessed}`
        : row.merge;

      return {
        organization_id: row.organization_id,
        file_id: row.file_id || crypto.randomUUID(),
        data: row.data,
        hora: row.hora,
        vagao: row.vagao,
        curral: row.curral,
        trato: tratoProcessed,
        tratador: row.tratador,
        dieta: row.dieta,
        realizado_kg: row.realizado_kg,
        previsto_kg: row.previsto_kg,
        desvio_kg: row.desvio_kg,
        desvio_pc: row.desvio_pc,
        status: row.status,
        merge: mergeCorrigido,
        id_carregamento: id_carregamento
      };
    });

    // Inserir em lotes na fato_distribuicao
    console.log('💾 Inserindo dados na fato_distribuicao...');
    let insertedCount = 0;
    const batchSize = 500;
    const errors = [];

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);

      try {
        const { error: insertError } = await supabase
          .from('fato_distribuicao')
          .insert(batch);

        if (insertError) {
          errors.push({
            batch: Math.floor(i / batchSize) + 1,
            error: insertError.message,
            rowsAffected: batch.length
          });
          console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, insertError);
        } else {
          insertedCount += batch.length;
          console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido: ${batch.length} registros`);
        }
      } catch (error) {
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          rowsAffected: batch.length
        });
      }
    }

    // Estatísticas do enriquecimento
    const totalEnriched = enrichedByMain + enrichedByFallback;
    const notEnrichedRecords = processedData.length - totalEnriched;

    console.log(`✅ Processamento concluído:`);
    console.log(`   - Total processado: ${processedData.length}`);
    console.log(`   - Total inserido: ${insertedCount}`);
    console.log(`   - Enriquecidos (merge principal): ${enrichedByMain}`);
    console.log(`   - Enriquecidos (merge fallback): ${enrichedByFallback}`);
    console.log(`   - Total enriquecido: ${totalEnriched}`);
    console.log(`   - Sem enriquecimento: ${notEnrichedRecords}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Fato distribuição processada com sucesso',
      organizationId,
      stats: {
        totalProcessed: processedData.length,
        totalInserted: insertedCount,
        enrichedByMain: enrichedByMain,
        enrichedByFallback: enrichedByFallback,
        totalEnriched: totalEnriched,
        notEnrichedRecords: notEnrichedRecords,
        enrichmentRate: Math.round((totalEnriched / processedData.length) * 100) + '%'
      },
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no processamento da fato_distribuicao:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});