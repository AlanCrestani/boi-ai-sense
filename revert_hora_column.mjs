import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function revertHoraColumn() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    console.log('🔄 Revertendo coluna hora para NOT NULL...');

    // Primeiro, atualizar todos os NULLs para uma hora padrão
    console.log('🔄 Atualizando registros NULL para hora padrão...');
    const updateResult = await client.query(`
      UPDATE staging_03_desvio_distribuicao
      SET hora = '06:00:00'
      WHERE hora IS NULL;
    `);

    console.log(`✅ ${updateResult.rowCount} registros atualizados com hora padrão`);

    // Depois, alterar coluna para NOT NULL
    await client.query(`
      ALTER TABLE staging_03_desvio_distribuicao
      ALTER COLUMN hora SET NOT NULL;
    `);

    console.log('✅ Coluna hora agora é NOT NULL obrigatória');

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

    console.log('\n🎯 Coluna hora voltou a ser obrigatória para merge!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

revertHoraColumn();