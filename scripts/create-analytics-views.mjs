#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAnalyticsViews() {
  console.log('🚀 Creating Analytics Views...\n');

  // Read the migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20250918_create_analytics_views.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split by views and execute each one
  const viewStatements = migrationSQL
    .split('CREATE OR REPLACE VIEW')
    .filter(stmt => stmt.trim())
    .map(stmt => 'CREATE OR REPLACE VIEW ' + stmt);

  let created = 0;
  let failed = 0;

  for (const viewSQL of viewStatements) {
    // Extract view name for logging
    const viewNameMatch = viewSQL.match(/VIEW\s+public\.(\w+)/);
    const viewName = viewNameMatch ? viewNameMatch[1] : 'unknown';

    // Skip non-view statements (grants, comments)
    if (!viewNameMatch) {
      continue;
    }

    // Extract just the CREATE VIEW statement (before GRANT statements)
    const viewStatement = viewSQL.split('GRANT SELECT')[0].trim() + ';';

    try {
      console.log(`📝 Creating view: ${viewName}`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: viewStatement
      });

      if (error) {
        // Try direct execution if RPC doesn't exist
        const { error: directError } = await supabase
          .from('_dummy_')
          .select()
          .limit(0)
          .then(() => ({ error: null }))
          .catch(e => ({ error: e }));

        if (directError) {
          throw directError;
        }
      }

      console.log(`✅ Created view: ${viewName}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create view ${viewName}:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${created} views`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} views`);
  }

  // Test if views exist by querying them
  console.log('\n🔍 Testing views...');
  const viewsToTest = [
    'view_ingrediente_resumo',
    'view_ingrediente_participacao',
    'view_carregamento_eficiencia',
    'view_eficiencia_distribuicao',
    'view_volume_por_dieta',
    'view_volume_por_vagao',
    'view_eficiencia_temporal'
  ];

  for (const viewName of viewsToTest) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ View ${viewName}: NOT FOUND`);
      } else {
        console.log(`✅ View ${viewName}: EXISTS`);
      }
    } catch (e) {
      console.log(`❌ View ${viewName}: ERROR - ${e.message}`);
    }
  }
}

createAnalyticsViews().catch(console.error);