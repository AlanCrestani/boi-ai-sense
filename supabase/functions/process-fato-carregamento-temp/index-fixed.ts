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

    console.log(`🔄 Processando fato_carregamento para organization: ${organizationId}`);

    // Limpar dados existentes para a organização
    const { error: deleteError } = await supabase
      .from('fato_carregamento')
      .delete()
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Erro ao limpar dados existentes: ${deleteError.message}`);
    }

    // Buscar TODOS os dados do staging_02 usando paginação (base principal)
    let allStagingData = [];
    let start = 0;
    const pageSize = 999;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from('staging_02_desvio_carregamento')
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

    const staging02Data = allStagingData;

    console.log(`📊 Encontrados ${staging02Data?.length || 0} registros no staging_02`);

    if (!staging02Data || staging02Data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum dado encontrado no staging_02_desvio_carregamento'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do staging_04 para enriquecimento com id_carregamento
    let allStaging04Data = [];
    let start04 = 0;
    let hasMore04 = true;

    console.log(`🔍 Buscando dados do staging_04 para enriquecimento...`);

    while (hasMore04) {
      const { data: pageData04, error: fetchError04 } = await supabase
        .from('staging_04_itens_trato')
        .select('*')
        .eq('organization_id', organizationId)
        .range(start04, start04 + pageSize - 1);

      if (fetchError04) {
        console.warn(`⚠️ Erro ao buscar staging_04: ${fetchError04.message}`);
        hasMore04 = false;
      } else if (pageData04 && pageData04.length > 0) {
        allStaging04Data = allStaging04Data.concat(pageData04);
        hasMore04 = pageData04.length === pageSize;
        start04 += pageSize;
        console.log(`📄 Staging_04 página ${Math.floor(start04/pageSize)}: ${pageData04.length} registros (Total: ${allStaging04Data.length})`);
      } else {
        hasMore04 = false;
      }
    }

    console.log(`📊 Encontrados ${allStaging04Data.length} registros no staging_04 para enriquecimento`);

    // Criar índice para otimizar merge com staging_04
    const staging04Index = new Map();
    allStaging04Data.forEach(record => {
      // Chave de merge: data + hora + vagao
      const key = `${record.data}|${record.hora || ''}|${record.vagao || ''}`;
      staging04Index.set(key, record);
    });

    // Transformar dados para fato_carregamento com enriquecimento
    const fatoData = staging02Data.map(record => {
      // Tentar fazer merge com staging_04 usando as chaves: data + hora + vagao
      const mergeKey = `${record.data}|${record.hora || ''}|${record.vagao || ''}`;
      const staging04Match = staging04Index.get(mergeKey);

      let enrichedRecord = {
        organization_id: record.organization_id,
        file_id: record.file_id || crypto.randomUUID(),
        data: record.data,
        hora: record.hora,
        pazeiro: record.pazeiro,
        vagao: record.vagao,
        dieta: record.dieta,
        nro_carregamento: record.nro_carregamento,
        ingrediente: record.ingrediente,
        tipo_ingrediente: record.tipo_ingrediente,
        realizado_kg: record.realizado_kg,
        previsto_kg: record.previsto_kg,
        desvio_kg: record.desvio_kg,
        desvio_pc: record.desvio_pc,
        status: 'processed',
        merge: record.merge,
        id_carregamento: staging04Match?.id || null // Enriquecido do staging_04
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
        .from('fato_carregamento')
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
      staging02Records: staging02Data.length,
      staging04Records: allStaging04Data.length,
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