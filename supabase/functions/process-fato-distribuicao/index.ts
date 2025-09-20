import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Buscar dados da staging_03 (base)
    console.log('📥 Buscando dados da staging_03_desvio_distribuicao...');

    const { data: staging03Data, error: s03Error } = await supabase
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
      .order('vagao', { ascending: true });

    if (s03Error) {
      console.error('❌ Erro buscando staging_03:', s03Error);
      throw new Error(`Erro na staging_03: ${s03Error.message}`);
    }

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

    // Buscar dados da staging_05 para enriquecimento
    console.log('🔗 Buscando dados da staging_05_trato_por_curral para enriquecimento...');

    const { data: staging05Data, error: s05Error } = await supabase
      .from('staging_05_trato_por_curral')
      .select('merge, id_carregamento')
      .eq('organization_id', organizationId);

    if (s05Error) {
      console.warn('⚠️ Erro buscando staging_05 (continuando sem enriquecimento):', s05Error);
    }

    // Criar mapa de enriquecimento
    const enrichmentMap = new Map();
    if (staging05Data) {
      staging05Data.forEach(row => {
        if (row.merge && row.id_carregamento) {
          enrichmentMap.set(row.merge, row.id_carregamento);
        }
      });
      console.log(`🔗 ${enrichmentMap.size} registros mapeados para enriquecimento`);
    }

    // Processar dados com enriquecimento e tratamento
    console.log('🔄 Processando dados com enriquecimento e tratamento...');

    const processedData = staging03Data.map((row: any) => {
      // Buscar id_carregamento no mapa de enriquecimento
      const id_carregamento = enrichmentMap.get(row.merge) || null;

      // Tratar campo trato - extrair apenas o número, removendo "Trato "
      let tratoProcessed = row.trato || '';
      if (tratoProcessed && typeof tratoProcessed === 'string') {
        // Remover "Trato " do início (case insensitive) e manter apenas o número
        tratoProcessed = tratoProcessed.replace(/^Trato\s*/i, '').trim();
      }

      return {
        organization_id: row.organization_id,
        file_id: row.file_id,
        data: row.data,
        hora: row.hora,
        vagao: row.vagao,
        curral: row.curral,
        trato: tratoProcessed, // ← Campo tratado: "Trato 1" → "1"
        tratador: row.tratador,
        dieta: row.dieta,
        realizado_kg: row.realizado_kg,
        previsto_kg: row.previsto_kg,
        desvio_kg: row.desvio_kg,
        desvio_pc: row.desvio_pc,
        status: row.status,
        merge: row.merge,
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
    const enrichedRecords = processedData.filter(row => row.id_carregamento !== null).length;
    const notEnrichedRecords = processedData.length - enrichedRecords;

    console.log(`✅ Processamento concluído:`);
    console.log(`   - Total processado: ${processedData.length}`);
    console.log(`   - Total inserido: ${insertedCount}`);
    console.log(`   - Enriquecidos com id_carregamento: ${enrichedRecords}`);
    console.log(`   - Sem enriquecimento: ${notEnrichedRecords}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Fato distribuição processada com sucesso',
      organizationId,
      stats: {
        totalProcessed: processedData.length,
        totalInserted: insertedCount,
        enrichedRecords: enrichedRecords,
        notEnrichedRecords: notEnrichedRecords,
        enrichmentRate: Math.round((enrichedRecords / processedData.length) * 100) + '%'
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