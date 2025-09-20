import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function compareStructures() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    const tables = ['staging_02_desvio_carregamento', 'staging_03_desvio_distribuicao', 'staging_04_itens_trato'];

    for (const table of tables) {
      console.log(`\n📋 Estrutura da tabela ${table}:`);

      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [table]);

      if (result.rows.length === 0) {
        console.log(`❌ Tabela ${table} não encontrada`);
        continue;
      }

      result.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   ${col.column_name}: ${col.data_type} (${nullable})`);
      });

      // Mostrar alguns dados de exemplo
      const dataResult = await client.query(`
        SELECT COUNT(*) as total FROM ${table};
      `);
      console.log(`   💾 Total de registros: ${dataResult.rows[0].total}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

compareStructures();