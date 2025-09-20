#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;

// Parse the Supabase URL to get connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const projectRef = supabaseUrl?.match(/https:\/\/(\w+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Invalid Supabase URL');
  process.exit(1);
}

// Construct database URL
const databaseUrl = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || 'LU7h9h24fDa1E4fS'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function executeSQL() {
  console.log('🚀 Executing SQL to create views...\n');

  const client = await pool.connect();

  try {
    // Create views that are missing
    const viewsSQL = [
      // view_eficiencia_distribuicao
      `CREATE OR REPLACE VIEW public.view_eficiencia_distribuicao AS
      WITH eficiencia_ranges AS (
        SELECT
          organization_id,
          data,
          CASE
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 95 THEN 'Excelente (95%+)'
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 85 THEN 'Bom (85-94%)'
            WHEN (realizado_kg / NULLIF(previsto_kg, 0)) * 100 >= 70 THEN 'Regular (70-84%)'
            ELSE 'Ruim (<70%)'
          END as faixa_eficiencia
        FROM public.staging02_desvio_carregamento
        WHERE realizado_kg IS NOT NULL
          AND previsto_kg IS NOT NULL
          AND previsto_kg > 0
      )
      SELECT
        organization_id,
        faixa_eficiencia as faixa,
        COUNT(*) as quantidade,
        data
      FROM eficiencia_ranges
      GROUP BY organization_id, faixa_eficiencia, data`,

      // view_volume_por_dieta
      `CREATE OR REPLACE VIEW public.view_volume_por_dieta AS
      SELECT
        organization_id,
        dieta,
        data,
        SUM(realizado_kg) as volume,
        SUM(previsto_kg) as previsto_total,
        SUM(realizado_kg) as realizado_total,
        COUNT(DISTINCT nro_carregamento) as total_carregamentos
      FROM public.staging02_desvio_carregamento
      WHERE dieta IS NOT NULL
        AND realizado_kg IS NOT NULL
      GROUP BY organization_id, dieta, data`,

      // view_volume_por_vagao
      `CREATE OR REPLACE VIEW public.view_volume_por_vagao AS
      SELECT
        organization_id,
        vagao,
        data,
        SUM(realizado_kg) as total_realizado,
        COUNT(DISTINCT nro_carregamento) as total_carregamentos,
        AVG(ABS(desvio_pc)) as desvio_medio
      FROM public.staging02_desvio_carregamento
      WHERE vagao IS NOT NULL
        AND realizado_kg IS NOT NULL
      GROUP BY organization_id, vagao, data`,

      // view_eficiencia_temporal
      `CREATE OR REPLACE VIEW public.view_eficiencia_temporal AS
      SELECT
        organization_id,
        data,
        hora,
        AVG(
          CASE
            WHEN previsto_kg > 0 THEN (realizado_kg / previsto_kg) * 100
            ELSE 0
          END
        ) as eficiencia,
        AVG(ABS(desvio_pc)) as desvio_medio_pc,
        SUM(realizado_kg) as volume_total
      FROM public.staging02_desvio_carregamento
      WHERE hora IS NOT NULL
        AND realizado_kg IS NOT NULL
        AND previsto_kg IS NOT NULL
        AND previsto_kg > 0
      GROUP BY organization_id, data, hora
      ORDER BY data, hora`
    ];

    for (const sql of viewsSQL) {
      const viewNameMatch = sql.match(/VIEW\s+public\.(\w+)/);
      const viewName = viewNameMatch ? viewNameMatch[1] : 'unknown';

      try {
        console.log(`📝 Creating view: ${viewName}`);
        await client.query(sql);
        console.log(`✅ Created view: ${viewName}`);
      } catch (error) {
        console.error(`❌ Failed to create view ${viewName}:`, error.message);
      }
    }

    // Grant permissions
    console.log('\n🔐 Granting permissions...');
    const grantSQL = `
      GRANT SELECT ON public.view_eficiencia_distribuicao TO authenticated;
      GRANT SELECT ON public.view_volume_por_dieta TO authenticated;
      GRANT SELECT ON public.view_volume_por_vagao TO authenticated;
      GRANT SELECT ON public.view_eficiencia_temporal TO authenticated;
    `;

    try {
      await client.query(grantSQL);
      console.log('✅ Permissions granted');
    } catch (error) {
      console.error('❌ Failed to grant permissions:', error.message);
    }

    // Test views
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
        const result = await client.query(`SELECT COUNT(*) FROM public.${viewName} LIMIT 1`);
        console.log(`✅ View ${viewName}: EXISTS (${result.rows[0].count} rows)`);
      } catch (error) {
        console.log(`❌ View ${viewName}: NOT FOUND - ${error.message}`);
      }
    }

  } finally {
    client.release();
    await pool.end();
  }
}

executeSQL().catch(console.error);