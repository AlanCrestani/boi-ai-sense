import pkg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pkg;

// Usar conexão direta
const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

const migrations = [
  'supabase/migrations/20250930_210000_create_dim_dietas.sql',
  'supabase/migrations/20250930_220000_create_estoque_insumos_pasto.sql',
  'supabase/migrations/20250930_230000_create_dim_rotas_distribuicao.sql',
  'supabase/migrations/20250930_240000_create_fato_distribuicao_pasto.sql',
  'supabase/migrations/20250930_250000_create_triggers_controle_estoque.sql'
];

async function applyMigrations() {
  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();

    for (const migrationPath of migrations) {
      console.log(`\n📄 Aplicando ${migrationPath}...`);

      try {
        const sql = readFileSync(migrationPath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${migrationPath} aplicada com sucesso!`);
      } catch (error) {
        console.error(`❌ Erro ao aplicar ${migrationPath}:`, error.message);
        // Continue com as próximas migrations
      }
    }

    console.log('\n🎉 Processo de migrations concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

applyMigrations();