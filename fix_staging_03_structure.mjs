import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixStaging03Structure() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    console.log('🔄 Corrigindo estrutura da tabela staging_03_desvio_distribuicao...');

    // 1. Adicionar coluna file_id
    console.log('➕ Adicionando coluna file_id...');
    await client.query(`
      ALTER TABLE staging_03_desvio_distribuicao
      ADD COLUMN IF NOT EXISTS file_id UUID;
    `);

    // 2. Remover colunas created_by e updated_by
    console.log('➖ Removendo coluna created_by...');
    await client.query(`
      ALTER TABLE staging_03_desvio_distribuicao
      DROP COLUMN IF EXISTS created_by;
    `);

    console.log('➖ Removendo coluna updated_by...');
    await client.query(`
      ALTER TABLE staging_03_desvio_distribuicao
      DROP COLUMN IF EXISTS updated_by;
    `);

    // 3. Verificar estrutura final
    console.log('📋 Verificando estrutura final...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staging_03_desvio_distribuicao'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('✅ Estrutura final da staging_03_desvio_distribuicao:');
    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${col.column_name}: ${col.data_type} (${nullable})`);
    });

    console.log('\n🎯 Estrutura agora consistente com staging_02 e staging_04!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

fixStaging03Structure();