// Script simplificado para limpar dados duplicados
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:LwbNsQr9Kibx1YSP@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function simpleCleanup() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    // Verificar total atual
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    console.log(`📊 Total atual: ${countResult.rows[0].total} registros`);

    // Encontrar o último carregamento
    const latestResult = await client.query(`
      SELECT MAX(created_at) as ultimo_carregamento
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    const ultimoCarregamento = latestResult.rows[0].ultimo_carregamento;
    console.log(`🎯 Último carregamento: ${ultimoCarregamento}`);

    // Contar registros do último carregamento
    const keepCountResult = await client.query(`
      SELECT COUNT(*) as manter
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      AND created_at = $1
    `, [ultimoCarregamento]);

    console.log(`✅ Registros do último carregamento: ${keepCountResult.rows[0].manter}`);

    // Deletar todos os registros EXCETO o último carregamento
    console.log('\n🧹 Deletando registros antigos...');
    const deleteResult = await client.query(`
      DELETE FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
      AND created_at < $1
    `, [ultimoCarregamento]);

    console.log(`🗑️ ${deleteResult.rowCount} registros antigos deletados!`);

    // Verificar resultado final
    const finalCountResult = await client.query(`
      SELECT COUNT(*) as total_final
      FROM staging_03_desvio_distribuicao
      WHERE organization_id = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    `);

    console.log(`🎯 Total final: ${finalCountResult.rows[0].total_final} registros`);
    console.log('✅ Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

simpleCleanup();