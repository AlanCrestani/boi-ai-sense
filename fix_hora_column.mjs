import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixHoraColumn() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    console.log('🔄 Alterando coluna hora para permitir NULL...');

    // Alterar coluna hora para permitir NULL
    await client.query(`
      ALTER TABLE staging_03_desvio_distribuicao
      ALTER COLUMN hora DROP NOT NULL;
    `);

    console.log('✅ Coluna hora agora permite NULL');

    // Atualizar registros existentes para NULL
    console.log('🔄 Atualizando registros existentes para NULL...');
    const updateResult = await client.query(`
      UPDATE staging_03_desvio_distribuicao
      SET hora = NULL
      WHERE hora = '00:00:00';
    `);

    console.log(`✅ ${updateResult.rowCount} registros atualizados para hora = NULL`);

    // Verificar estrutura final
    console.log('📋 Verificando estrutura final...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staging_03_desvio_distribuicao'
      AND column_name = 'hora'
      AND table_schema = 'public';
    `);

    console.log('✅ Estrutura da coluna hora:');
    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${col.column_name}: ${col.data_type} (${nullable})`);
    });

    console.log('\n🎯 Agora a coluna hora pode ser NULL quando não há informação de hora no CSV!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

fixHoraColumn();