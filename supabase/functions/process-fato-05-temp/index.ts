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

    console.log(`🔄 Processando staging_05 → fato_distribuicao para organization: ${organizationId}`);

    // Limpar dados existentes para a organização
    const { error: deleteError } = await supabase
      .from('fato_distribuicao')
      .delete()
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Erro ao limpar dados existentes: ${deleteError.message}`);
    }

    // Buscar TODOS os dados do staging_05 usando paginação
    let allStagingData = [];
    let start = 0;
    const pageSize = 999;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from('staging_05_trato_por_curral')
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

    const stagingData = allStagingData;

    console.log(`📊 Encontrados ${stagingData?.length || 0} registros no staging_05`);

    if (!stagingData || stagingData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum dado encontrado no staging_05_trato_por_curral'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar dados para fato_distribuicao
    const fatoData = stagingData.map(record => ({
      organization_id: record.organization_id,
      file_id: record.file_id || crypto.randomUUID(),
      data: record.data,
      hora: record.hora,
      vagao: null,
      curral: record.curral,
      trato: record.trato,
      tratador: record.tratador,
      dieta: record.dieta,
      realizado_kg: record.realizado_kg,
      previsto_kg: record.previsto_kg,
      desvio_kg: record.diferenca_kg,
      desvio_pc: record.desvio_pc,
      status: 'processed',
      merge: record.merge,
      id_carregamento: null
    }));

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

    const stats = {
      totalProcessed: totalInserted,
      enrichmentRate: totalInserted > 0 ? '100%' : '0%',
      stagingRecords: stagingData.length,
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