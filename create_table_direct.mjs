#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

async function createTable() {
  console.log('🚀 Creating staging_03_desvio_distribuicao table...\n');

  // Simplified table creation SQL (no policies for now)
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.staging_03_desvio_distribuicao (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      file_id UUID NOT NULL,
      data TEXT,
      hora TEXT,
      tratador TEXT,
      vagao TEXT,
      curral TEXT,
      trato TEXT,
      dieta TEXT,
      realizado_kg NUMERIC(10,2),
      previsto_kg NUMERIC(10,2),
      desvio_kg NUMERIC(10,2),
      desvio_pc NUMERIC(10,2),
      plano_alimentar TEXT,
      lote TEXT,
      status TEXT CHECK (status IN ('VERDE', 'AMARELO', 'VERMELHO')),
      merge TEXT,
      id_distribuicao UUID DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create basic indexes
    CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON public.staging_03_desvio_distribuicao(organization_id);
    CREATE INDEX IF NOT EXISTS idx_staging_03_file_id ON public.staging_03_desvio_distribuicao(file_id);
    CREATE INDEX IF NOT EXISTS idx_staging_03_vagao ON public.staging_03_desvio_distribuicao(vagao);
    CREATE INDEX IF NOT EXISTS idx_staging_03_data ON public.staging_03_desvio_distribuicao(data);
    CREATE INDEX IF NOT EXISTS idx_staging_03_merge_file ON public.staging_03_desvio_distribuicao(merge, file_id);

    -- Add comments
    COMMENT ON TABLE public.staging_03_desvio_distribuicao IS 'Staging table for desvio distribuição data from pipeline 03';
    COMMENT ON COLUMN public.staging_03_desvio_distribuicao.merge IS 'Concatenation of data + curral + vagao for unique identification';
  `;

  console.log(`📋 Executing simplified table creation...\n`);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query_runner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    console.log('✅ Table creation attempted!');

    // Test if table exists by trying to query it
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/staging_03_desvio_distribuicao?select=count&limit=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'count=exact'
      }
    });

    if (testResponse.ok) {
      console.log('✅ Table staging_03_desvio_distribuicao exists and is accessible!');
    } else {
      console.log('⚠️ Table might not be accessible via REST API yet');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please create the table manually in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz/sql');
    console.log('2. Execute this SQL:');
    console.log(createTableSQL);
  }
}

createTable().catch(console.error);