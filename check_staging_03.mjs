import pkg from 'pg';
const { Client } = pkg;

// Usar conexão direta
const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkStaging03() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    // Verificar se a tabela existe
    console.log('📋 Verificando se tabela staging_03_desvio_distribuicao existe...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'staging_03_desvio_distribuicao'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela staging_03_desvio_distribuicao não existe!');
      return;
    }

    console.log('✅ Tabela staging_03_desvio_distribuicao existe');

    // Contar total de registros
    console.log('🔢 Contando registros na tabela...');
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM staging_03_desvio_distribuicao;
    `);

    const totalRecords = countResult.rows[0].total;
    console.log(`📊 Total de registros: ${totalRecords}`);

    if (totalRecords > 0) {
      // Mostrar alguns registros de exemplo
      console.log('📋 Primeiros 5 registros:');
      const sampleResult = await client.query(`
        SELECT
          id,
          organization_id,
          data,
          tratador,
          vagao,
          curral,
          dieta,
          realizado_kg,
          previsto_kg,
          desvio_kg,
          desvio_pc,
          status,
          created_at
        FROM staging_03_desvio_distribuicao
        ORDER BY created_at DESC
        LIMIT 5;
      `);

      sampleResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Registro ID: ${row.id}`);
        console.log(`   Data: ${row.data}`);
        console.log(`   Tratador: ${row.tratador}`);
        console.log(`   Vagão: ${row.vagao}`);
        console.log(`   Curral: ${row.curral}`);
        console.log(`   Dieta: ${row.dieta}`);
        console.log(`   Realizado: ${row.realizado_kg}kg`);
        console.log(`   Previsto: ${row.previsto_kg}kg`);
        console.log(`   Desvio: ${row.desvio_kg}kg (${row.desvio_pc}%)`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Criado em: ${row.created_at}`);
      });

      // Verificar por organização específica
      console.log('\n🏢 Contando por organização...');
      const orgResult = await client.query(`
        SELECT
          organization_id,
          COUNT(*) as count,
          MAX(created_at) as last_insert
        FROM staging_03_desvio_distribuicao
        GROUP BY organization_id
        ORDER BY count DESC;
      `);

      orgResult.rows.forEach(row => {
        console.log(`   Org: ${row.organization_id} | Registros: ${row.count} | Último insert: ${row.last_insert}`);
      });
    } else {
      console.log('📭 Nenhum registro encontrado na tabela');

      // Verificar se há algum erro de estrutura
      console.log('🔍 Verificando estrutura da tabela...');
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'staging_03_desvio_distribuicao'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Estrutura da tabela:');
      structure.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkStaging03();