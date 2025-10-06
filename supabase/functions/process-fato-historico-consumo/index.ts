import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza texto removendo caracteres corrompidos de encoding e padronizando
 */
function normalizeText(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    // Remove caracteres de replacement (�) que indicam encoding corrompido
    let normalized = text.replace(/�/g, '');

    // Normaliza para NFD (Canonical Decomposition) e depois remove marcas diacríticas
    // Isso converte "ã" -> "a~" -> "a", "ç" -> "c," -> "c"
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Remove múltiplos espaços
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Converte para uppercase para padronização
    normalized = normalized.toUpperCase();

    return normalized;
  } catch (error) {
    console.error(`Erro ao normalizar texto: ${text}`, error);
    return text;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organizationId } = await req.json();

    console.log(`🔄 Processando fato_historico_consumo para organization: ${organizationId}`);

    // Limpar dados existentes para a organização
    const { error: deleteError } = await supabase
      .from('fato_historico_consumo')
      .delete()
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Erro ao limpar dados existentes: ${deleteError.message}`);
    }

    // Buscar TODOS os dados do staging_01 usando paginação para contornar limite
    let allStagingData = [];
    let start = 0;
    const pageSize = 999; // Pouco menos que 1000 para segurança
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from('staging_01_historico_consumo')
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

    console.log(`📊 Encontrados ${stagingData?.length || 0} registros no staging_01`);

    if (!stagingData || stagingData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum dado encontrado no staging_01_historico_consumo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar dados para fato_historico_consumo
    const fatoData = stagingData.map(record => ({
      organization_id: record.organization_id,
      file_id: record.file_id || 'batch-process',
      data: record.data,
      curral: record.curral,
      lote: record.lote,
      raca: record.raca,
      sexo: record.sexo,
      cod_grupo_genetico: record.cod_grupo_genetico,
      grupo_genetico: record.grupo_genetico,
      setor: record.setor,
      proprietario_predominante: record.proprietario_predominante,
      origem_predominante: record.origem_predominante,
      tipo_aquisicao: record.tipo_aquisicao,
      dieta: normalizeText(record.dieta),
      escore: record.escore,
      fator_correcao_kg: record.fator_correcao_kg,
      escore_noturno: record.escore_noturno,
      data_entrada: record.data_entrada,
      qtd_animais: record.qtd_animais,
      peso_entrada_kg: record.peso_entrada_kg,
      peso_estimado_kg: record.peso_estimado_kg,
      dias_confinados: record.dias_confinados,
      consumo_total_kg_mn: record.consumo_total_kg_mn,
      consumo_total_ms: record.consumo_total_ms,
      ms_dieta_meta_pc: record.ms_dieta_meta_pc,
      ms_dieta_real_pc: record.ms_dieta_real_pc,
      cms_previsto_kg: record.cms_previsto_kg,
      cms_realizado_kg: record.cms_realizado_kg,
      cmn_previsto_kg: record.cmn_previsto_kg,
      cmn_realizado_kg: record.cmn_realizado_kg,
      gmd_kg: record.gmd_kg,
      cms_referencia_pcpv: record.cms_referencia_pcpv,
      cms_referencia_kg: record.cms_referencia_kg,
      cms_realizado_pcpv: record.cms_realizado_pcpv
    }));

    // Inserir em lotes de 500 para evitar timeout
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < fatoData.length; i += batchSize) {
      const batch = fatoData.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from('fato_historico_consumo')
        .insert(batch);

      if (insertError) {
        throw new Error(`Erro ao inserir lote ${i/batchSize + 1}: ${insertError.message}`);
      }

      totalInserted += batch.length;
      console.log(`✅ Lote ${i/batchSize + 1} inserido: ${batch.length} registros (Total: ${totalInserted})`);
    }

    const stats = {
      totalProcessed: totalInserted,
      successRate: totalInserted > 0 ? '100%' : '0%',
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