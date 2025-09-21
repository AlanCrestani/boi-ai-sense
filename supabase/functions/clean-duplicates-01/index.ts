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
    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('organizationId é obrigatório');
    }

    console.log(`🧹 Iniciando limpeza de duplicados Pipeline 01 para organização: ${organizationId}`);

    // 1. Verificar situação atual
    const { data: countData, error: countError } = await supabase
      .from('staging_01_historico_consumo')
      .select('file_id, created_at')
      .eq('organization_id', organizationId);

    if (countError) {
      throw new Error(`Erro ao contar registros: ${countError.message}`);
    }

    const totalRecords = countData.length;
    console.log(`📊 Total de registros encontrados: ${totalRecords}`);

    // 2. Identificar duplicados por combinação data + lote + setor
    const { data: allData, error: allError } = await supabase
      .from('staging_01_historico_consumo')
      .select('id, data, lote, setor, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (allError) {
      throw new Error(`Erro ao buscar dados: ${allError.message}`);
    }

    // 3. Encontrar duplicados (manter apenas o mais recente de cada combinação data+lote+setor)
    const uniqueKeyMap = new Map();
    const idsToDelete = [];

    for (const record of allData) {
      // Criar chave única: data + lote + setor
      const uniqueKey = `${record.data || ''}_${record.lote || ''}_${record.setor || ''}`;
      const existingRecord = uniqueKeyMap.get(uniqueKey);

      if (existingRecord) {
        // Se já existe um registro para esta combinação, decidir qual manter
        const existingDate = new Date(existingRecord.created_at);
        const currentDate = new Date(record.created_at);

        if (currentDate > existingDate) {
          // Registro atual é mais recente, marcar o existente para deletar
          idsToDelete.push(existingRecord.id);
          uniqueKeyMap.set(uniqueKey, record);
        } else {
          // Registro existente é mais recente, marcar o atual para deletar
          idsToDelete.push(record.id);
        }
      } else {
        // Primeiro registro para esta combinação
        uniqueKeyMap.set(uniqueKey, record);
      }
    }

    console.log(`🔍 Encontrados ${idsToDelete.length} registros duplicados para remover`);

    if (idsToDelete.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Não há duplicados para remover no Pipeline 01',
        totalRecords: totalRecords,
        duplicatesRemoved: 0,
        finalCount: totalRecords
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Remover duplicados em lotes
    let removedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('staging_01_historico_consumo')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Erro ao deletar lote ${Math.floor(i / batchSize) + 1}:`, deleteError);
      } else {
        removedCount += batch.length;
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} removido: ${batch.length} registros`);
      }
    }

    // 5. Verificar resultado final
    const { data: finalCountData, error: finalCountError } = await supabase
      .from('staging_01_historico_consumo')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId);

    const finalCount = finalCountData?.length || 0;

    console.log(`✅ Limpeza Pipeline 01 concluída: ${removedCount} duplicados removidos, ${finalCount} registros restantes`);

    return new Response(JSON.stringify({
      success: true,
      message: `Limpeza de duplicados Pipeline 01 concluída`,
      totalRecords: totalRecords,
      duplicatesRemoved: removedCount,
      finalCount: finalCount,
      uniqueKeys: uniqueKeyMap.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na limpeza de duplicados Pipeline 01:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});