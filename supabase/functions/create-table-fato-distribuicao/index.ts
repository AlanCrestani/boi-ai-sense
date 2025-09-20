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
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏗️ Criando tabela fato_distribuicao...');

    // Execute SQL usando uma query direta
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'fato_distribuicao')
      .single();

    // Se a tabela já existe
    if (data && !error) {
      console.log('ℹ️ Tabela fato_distribuicao já existe');
      return new Response(JSON.stringify({
        success: true,
        message: 'Tabela fato_distribuicao já existe',
        action: 'no_action_needed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Como não podemos executar DDL diretamente via edge function,
    // vamos usar uma abordagem alternativa: tentar inserir na tabela
    // Se falhar, assumimos que ela não existe
    const testInsert = await supabase
      .from('fato_distribuicao')
      .insert({
        organization_id: '00000000-0000-0000-0000-000000000000',
        file_id: '00000000-0000-0000-0000-000000000000',
        data: 'test'
      });

    if (testInsert.error && testInsert.error.message.includes('relation "fato_distribuicao" does not exist')) {
      // Tabela não existe, precisamos criá-la manualmente
      console.log('❌ Tabela fato_distribuicao não existe');

      return new Response(JSON.stringify({
        success: false,
        message: 'Tabela fato_distribuicao não existe. Execute o SQL manualmente.',
        sql: `
CREATE TABLE IF NOT EXISTS fato_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  file_id UUID NOT NULL,
  data TEXT,
  hora TEXT,
  vagao TEXT,
  curral TEXT,
  trato TEXT,
  tratador TEXT,
  dieta TEXT,
  realizado_kg NUMERIC,
  previsto_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  merge TEXT,
  id_carregamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_data
  ON fato_distribuicao (organization_id, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_merge
  ON fato_distribuicao (merge);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_curral_data
  ON fato_distribuicao (organization_id, curral, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_id_carregamento
  ON fato_distribuicao (id_carregamento) WHERE id_carregamento IS NOT NULL;

-- RLS
ALTER TABLE fato_distribuicao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fato_distribuicao_isolation" ON fato_distribuicao;
CREATE POLICY "fato_distribuicao_isolation" ON fato_distribuicao
  USING (organization_id = (SELECT auth.uid()::text::uuid));
        `
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se chegou aqui, a tabela existe, vamos remover o registro de teste
    if (!testInsert.error) {
      await supabase
        .from('fato_distribuicao')
        .delete()
        .eq('organization_id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('✅ Tabela fato_distribuicao verificada e funcional');

    return new Response(JSON.stringify({
      success: true,
      message: 'Tabela fato_distribuicao existe e está funcional',
      action: 'verified'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});