// Script para limpar dados duplicados da tabela staging_03_desvio_distribuicao
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:LwbNsQr9Kibx1YSP@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupDuplicates() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    // Primeiro, verificar quantos registros existem
    console.log('📊 Verificando registros atuais...');
    const countResult = await client.query(`
      SELECT
        COUNT(*) as total,
        MAX(created_at) as ultimo_carregamento,
        MIN(created_at) as primeiro_carregamento
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    console.log('📋 Status atual:', countResult.rows[0]);

    // Listar carregamentos únicos
    console.log('\n🔍 Verificando carregamentos únicos...');
    const loadingsResult = await client.query(`
      SELECT
        created_at::date as data_carregamento,
        created_at::time as hora_carregamento,
        COUNT(*) as registros
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      GROUP BY created_at::date, created_at::time
      ORDER BY created_at DESC
    `);

    console.log('📅 Carregamentos encontrados:');
    loadingsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.data_carregamento} ${row.hora_carregamento} - ${row.registros} registros`);
    });

    // Identificar o último carregamento
    const latestLoadingResult = await client.query(`
      SELECT MAX(created_at) as ultimo_carregamento
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    const ultimoCarregamento = latestLoadingResult.rows[0].ultimo_carregamento;
    console.log(`\n🎯 Último carregamento: ${ultimoCarregamento}`);

    // Contar registros que serão mantidos
    const keepResult = await client.query(`
      SELECT COUNT(*) as manter
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      AND created_at = $1
    `, [ultimoCarregamento]);

    console.log(`✅ Registros que serão mantidos: ${keepResult.rows[0].manter}`);

    // Contar registros que serão deletados
    const deleteResult = await client.query(`
      SELECT COUNT(*) as deletar
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      AND created_at < $1
    `, [ultimoCarregamento]);

    console.log(`🗑️ Registros que serão deletados: ${deleteResult.rows[0].deletar}`);

    // Executar limpeza
    console.log('\n🧹 Iniciando limpeza...');
    const cleanupResult = await client.query(`
      DELETE FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      AND created_at < $1
    `, [ultimoCarregamento]);

    console.log(`✅ ${cleanupResult.rowCount} registros deletados com sucesso!`);

    // Verificar resultado final
    const finalResult = await client.query(`
      SELECT COUNT(*) as total_final
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    console.log(`🎯 Total final de registros: ${finalResult.rows[0].total_final}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

cleanupDuplicates();