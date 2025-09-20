import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Boi*Sense2024@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function limparDuplicados() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    // First, let's see what we have
    const countResult = await client.query(`
      SELECT
        file_id,
        COUNT(*) as total_records,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      GROUP BY file_id
      ORDER BY last_created DESC
    `);

    console.log('📊 Situação atual dos dados:');
    countResult.rows.forEach(row => {
      console.log(`  File ID: ${row.file_id}`);
      console.log(`    Total: ${row.total_records} registros`);
      console.log(`    Período: ${new Date(row.first_created).toLocaleString('pt-BR')} até ${new Date(row.last_created).toLocaleString('pt-BR')}`);
      console.log('  ---');
    });

    // Check for duplicates by merge key
    const duplicateResult = await client.query(`
      SELECT merge, COUNT(*) as count_duplicates
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      GROUP BY merge
      HAVING COUNT(*) > 1
      ORDER BY count_duplicates DESC
      LIMIT 10
    `);

    console.log(`🔍 Encontrados ${duplicateResult.rows.length} merge keys duplicados:`);
    duplicateResult.rows.forEach(row => {
      console.log(`  Merge: ${row.merge} -> ${row.count_duplicates} registros`);
    });

    if (duplicateResult.rows.length > 0) {
      console.log('');
      console.log('🧹 Removendo duplicados, mantendo apenas o registro mais recente de cada merge...');

      // Delete duplicates, keeping only the most recent record for each merge
      const deleteResult = await client.query(`
        DELETE FROM staging_03_desvio_distribuicao
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY merge ORDER BY created_at DESC) as row_num
            FROM staging_03_desvio_distribuicao
            WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
          ) t
          WHERE row_num > 1
        )
      `);

      console.log(`✅ ${deleteResult.rowCount} registros duplicados removidos`);

      // Verify result
      const finalCountResult = await client.query(`
        SELECT COUNT(*) as total_final
        FROM staging_03_desvio_distribuicao
        WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      `);

      console.log(`📋 Total final de registros: ${finalCountResult.rows[0].total_final}`);
    } else {
      console.log('✅ Não há duplicados para remover');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('🔚 Conexão fechada');
  }
}

limparDuplicados();