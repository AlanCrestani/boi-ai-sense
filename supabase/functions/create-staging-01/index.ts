import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const createTableSQL = `
      -- Create staging_01_historico_consumo table
      CREATE TABLE IF NOT EXISTS staging_01_historico_consumo (
        id BIGSERIAL PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        file_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- CSV data columns
        data DATE,
        curral TEXT,
        lote TEXT,
        raca TEXT,
        sexo TEXT,
        cod_grupo_genetico TEXT,
        grupo_genetico TEXT,
        setor TEXT,
        proprietario_predominante TEXT,
        origem_predominante TEXT,
        tipo_aquisicao TEXT,
        dieta TEXT,
        escore NUMERIC,
        fator_correcao_kg NUMERIC,
        escore_noturno NUMERIC,
        data_entrada DATE,
        qtd_animais INTEGER,
        peso_entrada_kg NUMERIC,
        peso_estimado_kg NUMERIC,
        dias_confinados INTEGER,
        consumo_total_kg_mn NUMERIC,
        consumo_total_ms NUMERIC,
        ms_dieta_meta_pc NUMERIC,
        ms_dieta_real_pc NUMERIC,
        cms_previsto_kg NUMERIC,
        cms_realizado_kg NUMERIC,
        cmn_previsto_kg NUMERIC,
        cmn_realizado_kg NUMERIC,
        gmd_kg NUMERIC,
        cms_referencia_pcpv NUMERIC,
        cms_referencia_kg NUMERIC,
        cms_realizado_pcpv NUMERIC
      );

      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_staging_01_historico_consumo_org_file
      ON staging_01_historico_consumo(organization_id, file_id);

      CREATE INDEX IF NOT EXISTS idx_staging_01_historico_consumo_data
      ON staging_01_historico_consumo(organization_id, data);

      -- Enable RLS
      ALTER TABLE staging_01_historico_consumo ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy
      DROP POLICY IF EXISTS "staging_01_historico_consumo_org_access" ON staging_01_historico_consumo;
      CREATE POLICY "staging_01_historico_consumo_org_access"
      ON staging_01_historico_consumo
      FOR ALL
      TO authenticated
      USING (organization_id = (auth.jwt() ->> 'organization_id')::UUID);

      -- Grant permissions
      GRANT ALL ON staging_01_historico_consumo TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE staging_01_historico_consumo_id_seq TO authenticated;
    `;

    const { error } = await supabaseClient.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabela staging_01_historico_consumo criada com sucesso!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
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