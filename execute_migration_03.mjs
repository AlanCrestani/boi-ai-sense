#!/usr/bin/env node
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
  process.exit(1);
}

async function executeMigration() {
  console.log('🚀 Executing Pipeline 03 migration...\n');

  // Read migration SQL
  const migrationPath = join(__dirname, 'supabase/migrations/20250919_create_staging03_desvio_distribuicao.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📋 Executing SQL:\n${sql.substring(0, 200)}...\n`);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', result);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Try alternative approach: execute via direct SQL endpoint
    console.log('\n🔄 Trying alternative method...');

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/sql',
          'apikey': supabaseKey
        },
        body: sql
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      console.log('✅ Migration executed successfully via alternative method!');

    } catch (altError) {
      console.error('❌ Alternative method also failed:', altError.message);
      console.log('\n💡 Please execute the migration manually in Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz/sql');
      console.log('2. Paste the SQL from the migration file');
      console.log('3. Click "Run"');
    }
  }
}

executeMigration().catch(console.error);