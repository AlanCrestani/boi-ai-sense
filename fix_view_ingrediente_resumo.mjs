import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixView() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Dropar a view existente primeiro
    await client.query('DROP VIEW IF EXISTS public.view_ingrediente_resumo;');
    console.log('View anterior removida');

    // Criar a view com o nome correto da tabela
    const createViewSQL = `
      CREATE VIEW public.view_ingrediente_resumo AS
      SELECT
          organization_id,
          ingrediente,
          SUM(realizado_kg) as realizado_kg,
          SUM(previsto_kg) as previsto_kg,
          SUM(desvio_kg) as desvio_kg,
          AVG(desvio_pc) as desvio_pc,
          data
      FROM public.staging_02_desvio_carregamento
      WHERE ingrediente IS NOT NULL
          AND realizado_kg IS NOT NULL
          AND previsto_kg IS NOT NULL
      GROUP BY organization_id, ingrediente, data;
    `;

    await client.query(createViewSQL);
    console.log('✅ View view_ingrediente_resumo criada com sucesso!');

    // Garantir permissões
    await client.query('GRANT SELECT ON public.view_ingrediente_resumo TO authenticated;');
    console.log('✅ Permissões concedidas');

    // Testar a view com dados
    const testResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT organization_id) as orgs,
             COUNT(DISTINCT data) as datas
      FROM public.view_ingrediente_resumo
    `);

    console.log('\n📊 Estatísticas da view:');
    console.log('Total de registros:', testResult.rows[0].total);
    console.log('Organizations:', testResult.rows[0].orgs);
    console.log('Datas distintas:', testResult.rows[0].datas);

    // Verificar dados para a org específica
    const orgId = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
    const orgResult = await client.query(`
      SELECT ingrediente, data, previsto_kg, realizado_kg
      FROM public.view_ingrediente_resumo
      WHERE organization_id = $1
      ORDER BY data DESC, ingrediente
      LIMIT 5
    `, [orgId]);

    console.log(`\n📊 Dados para organization_id ${orgId}:`);
    if (orgResult.rows.length > 0) {
      console.table(orgResult.rows);
    } else {
      console.log('Nenhum dado encontrado para esta organization_id');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
    console.log('\nConexão fechada');
  }
}

fixView();