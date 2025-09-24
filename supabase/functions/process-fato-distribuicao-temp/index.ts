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

    const { organizationId } = await req.json();

    console.log(`🔄 Processando fato_distribuicao para organization: ${organizationId}`);

    // Limpar dados existentes para a organização
    const { error: deleteError } = await supabase
      .from('fato_distribuicao')
      .delete()
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Erro ao limpar dados existentes: ${deleteError.message}`);
    }

    // Buscar TODOS os dados do staging_03 usando paginação (base principal)
    let allStagingData = [];
    let start = 0;
    const pageSize = 999;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from('staging_03_desvio_distribuicao')
        .select('*')
        .eq('organization_id', organizationId)
        .range(start, start + pageSize - 1);

      if (fetchError) {
        throw new Error(`Erro ao buscar dados do staging: ${fetchError.message}`);
      }

      if (pageData && pageData.length > 0) {
        allStagingData = allStagingData.concat(pageData);
        hasMore = pageData.length === pageSize;
        start += pageSize;
        console.log(`📄 Página ${Math.floor(start/pageSize)}: ${pageData.length} registros (Total: ${allStagingData.length})`);
      } else {
        hasMore = false;
      }
    }

    const staging03Data = allStagingData;

    console.log(`📊 Encontrados ${staging03Data?.length || 0} registros no staging_03`);

    if (!staging03Data || staging03Data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum dado encontrado no staging_03_desvio_distribuicao'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do staging_05 para enriquecimento com id_carregamento
    let allStaging05Data = [];
    let start05 = 0;
    let hasMore05 = true;

    console.log(`🔍 Buscando dados do staging_05 para enriquecimento...`);

    while (hasMore05) {
      const { data: pageData05, error: fetchError05 } = await supabase
        .from('staging_05_trato_por_curral')
        .select('*')
        .eq('organization_id', organizationId)
        .range(start05, start05 + pageSize - 1);

      if (fetchError05) {
        console.warn(`⚠️ Erro ao buscar staging_05: ${fetchError05.message}`);
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

    console.log(`📊 Encontrados ${allStaging05Data.length} registros no staging_05 para enriquecimento`);

    // Criar índice para otimizar merge com staging_05
    const staging05Index = new Map();
    allStaging05Data.forEach(record => {
      // Chave de merge: data + hora + vagao + trato
      const key = `${record.data}|${record.hora || ''}|${record.vagao || ''}|${record.trato || ''}`;
      staging05Index.set(key, record);
    });

    // Transformar dados para fato_distribuicao com enriquecimento
    const fatoData = staging03Data.map(record => {
      // Tentar fazer merge com staging_05 usando as chaves: data + hora + vagao + trato
      const mergeKey = `${record.data}|${record.hora || ''}|${record.vagao || ''}|${record.trato || ''}`;
      const staging05Match = staging05Index.get(mergeKey);

      let enrichedRecord = {
        organization_id: record.organization_id,
        file_id: record.file_id || crypto.randomUUID(),
        data: record.data,
        hora: record.hora,
        vagao: record.vagao || null,
        curral: record.curral,
        trato: record.trato,
        tratador: staging05Match?.tratador || null, // Enriquecido do staging_05
        dieta: record.dieta,
        realizado_kg: record.realizado_kg,
        previsto_kg: record.previsto_kg,
        desvio_kg: record.desvio_kg,
        desvio_pc: record.desvio_pc,
        status: 'processed',
        merge: record.merge,
        id_carregamento: staging05Match?.id || null // Enriquecido do staging_05
      };

      return enrichedRecord;
    });

    const enrichedCount = fatoData.filter(record => record.id_carregamento !== null).length;
    console.log(`🔗 Enriquecimento: ${enrichedCount}/${fatoData.length} registros enriquecidos com id_carregamento`);

    // Inserir em lotes de 500 para evitar timeout
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < fatoData.length; i += batchSize) {
      const batch = fatoData.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from('fato_distribuicao')
        .insert(batch);

      if (insertError) {
        throw new Error(`Erro ao inserir lote ${i/batchSize + 1}: ${insertError.message}`);
      }

      totalInserted += batch.length;
      console.log(`✅ Lote ${i/batchSize + 1} inserido: ${batch.length} registros (Total: ${totalInserted})`);
    }

    const enrichmentRate = ((enrichedCount / totalInserted) * 100).toFixed(1);
    const stats = {
      totalProcessed: totalInserted,
      enrichmentRate: `${enrichmentRate}%`,
      staging03Records: staging03Data.length,
      staging05Records: allStaging05Data.length,
      enrichedRecords: enrichedCount,
      fatoRecords: totalInserted
    };

    console.log(`✅ Processamento concluído: ${totalInserted} registros inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Processamento concluído com sucesso: ${totalInserted} registros`
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