#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('🚀 Creating staging_03_desvio_distribuicao table...\n');

  // Read migration SQL
  const migrationPath = join(__dirname, 'supabase/migrations/20250919_create_staging03_desvio_distribuicao.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📋 Executing SQL from migration file...\n`);

  try {
    // Execute the complete migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing migration:', error);
      throw error;
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', data);

    // Verify table was created
    const { data: tableCheck, error: checkError } = await supabase
      .from('staging_03_desvio_distribuicao')
      .select('count', { count: 'exact', head: true });

    if (checkError) {
      console.error('❌ Error verifying table:', checkError);
    } else {
      console.log('✅ Table staging_03_desvio_distribuicao verified successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Try executing parts manually
    console.log('\n🔄 Trying to execute parts of the migration...');

    try {
      // Just create the basic table structure
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
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (createError) {
        console.error('❌ Error creating basic table:', createError);
      } else {
        console.log('✅ Basic table created successfully!');
      }

    } catch (altError) {
      console.error('❌ Alternative creation also failed:', altError.message);
      console.log('\n💡 Please execute the migration manually in Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz/sql');
      console.log('2. Paste the SQL from the migration file');
      console.log('3. Click "Run"');
    }
  }
}

createTable().catch(console.error);