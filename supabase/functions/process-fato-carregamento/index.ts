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

    console.log(`🔄 Iniciando processamento fato_carregamento para organização: ${organizationId}`);

    // Note: Using id_carregamento (renamed from id_carregamento_original)
    console.log('📋 Processando com estrutura padrão da tabela fato_carregamento...');

    // Limpar dados existentes se forceOverwrite
    if (forceOverwrite) {
      console.log('🧹 Limpando dados existentes da fato_carregamento...');
      await supabase
        .from('fato_carregamento')
        .delete()
        .eq('organization_id', organizationId);
    }

    // Buscar dados da staging_02 (base)
    console.log('📥 Buscando dados da staging_02_desvio_carregamento...');

    const { data: staging02Data, error: s02Error } = await supabase
      .from('staging_02_desvio_carregamento')
      .select('*')
      .eq('organization_id', organizationId)
      .order('data', { ascending: true })
      .order('hora', { ascending: true });

    if (s02Error) {
      console.error('❌ Erro buscando staging_02:', s02Error);
      throw new Error(`Erro na staging_02: ${s02Error.message}`);
    }

    if (!staging02Data || staging02Data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhum dado encontrado na staging_02_desvio_carregamento para esta organização',
        organizationId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 ${staging02Data.length} registros encontrados na staging_02`);

    // Buscar dados da staging_04 para enriquecimento
    console.log('🔗 Buscando dados da staging_04_itens_trato para enriquecimento...');

    const { data: staging04Data, error: s04Error } = await supabase
      .from('staging_04_itens_trato')
      .select('merge, id_carregamento_original')
      .eq('organization_id', organizationId);

    if (s04Error) {
      console.warn('⚠️ Erro buscando staging_04 (continuando sem enriquecimento):', s04Error);
    }

    // Criar mapa de enriquecimento
    const enrichmentMap = new Map();
    if (staging04Data) {
      staging04Data.forEach(row => {
        if (row.merge && row.id_carregamento_original) {
          enrichmentMap.set(row.merge, row.id_carregamento_original);
        }
      });
      console.log(`🔗 ${enrichmentMap.size} registros mapeados para enriquecimento`);
    }

    // Processar dados com enriquecimento e tratamento
    console.log('🔄 Processando dados com enriquecimento e tratamento...');

    const processedData = staging02Data.map((row: any) => {
      // Buscar id_carregamento no mapa de enriquecimento
      const id_carregamento = enrichmentMap.get(row.merge) || null;

      // Função para corrigir encoding de caracteres
      const fixEncoding = (text: string): string => {
        if (!text || typeof text !== 'string') return text;

        // Mapear os caracteres corrompidos para os corretos baseado nos exemplos
        return text
          // Correções baseadas nos exemplos fornecidos
          .replace(/GRÃO ÃMIDO SILAGEM/g, 'GRÃO ÚMIDO SILAGEM')
          .replace(/PRÃ-MISTURA/g, 'PRÉ-MISTURA')
          .replace(/VAG�O/g, 'VAGÃO')
          .replace(/PR�-MISTURA/g, 'PRÉ-MISTURA')
          .replace(/GR�O/g, 'GRÃO')
          .replace(/�MIDO/g, 'ÚMIDO')
          // Correções de caracteres individuais (ordem importa)
          .replace(/Ã(?=MIDO)/g, 'Ú') // Só trocar Ã por Ú quando seguido de MIDO
          .replace(/Ã(?=-)/g, 'É') // Só trocar Ã por É quando seguido de hífen (PRÃ-)
          .trim();
      };

      // Tratar campo nro_carregamento - extrair apenas o número
      let nroCarregamentoProcessed = row.nro_carregamento || '';
      if (nroCarregamentoProcessed && typeof nroCarregamentoProcessed === 'string') {
        nroCarregamentoProcessed = nroCarregamentoProcessed.replace(/^Carregamento\s*/i, '').trim();
      }

      return {
        organization_id: row.organization_id,
        file_id: row.file_id,
        data: row.data,
        hora: row.hora,
        pazeiro: fixEncoding(row.pazeiro),
        vagao: fixEncoding(row.vagao),
        dieta: fixEncoding(row.dieta),
        nro_carregamento: fixEncoding(nroCarregamentoProcessed),
        ingrediente: fixEncoding(row.ingrediente),
        tipo_ingrediente: fixEncoding(row.tipo_ingrediente),
        realizado_kg: row.realizado_kg,
        previsto_kg: row.previsto_kg,
        desvio_kg: row.desvio_kg,
        desvio_pc: row.desvio_pc,
        status: fixEncoding(row.status),
        merge: row.merge,
        id_carregamento: id_carregamento // ← Campo enriquecido via JOIN
      };
    });

    // Inserir em lotes na fato_carregamento
    console.log('💾 Inserindo dados na fato_carregamento...');

    let insertedCount = 0;
    const batchSize = 100; // Smaller batches for safety
    const errors = [];

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);

      try {
        const { error: insertError } = await supabase
          .from('fato_carregamento')
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
      message: 'Fato carregamento processada com sucesso',
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
    console.error('❌ Erro no processamento da fato_carregamento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});