import postgres from 'postgres';

const connectionString = "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log('🔌 Testando conexão com o banco de dados...');

try {
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 20
  });

  // Teste básico de conexão
  const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
  console.log('✅ Banco conectado com sucesso!');
  console.log(`⏰ Horário atual: ${result[0].current_time}`);
  console.log(`🐘 Versão PostgreSQL: ${result[0].pg_version.split(' ')[0]}`);

  // Listar todas as tabelas no schema público
  console.log('\n📋 Listando todas as tabelas...');
  const tables = await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  if (tables.length > 0) {
    console.log(`✅ Encontradas ${tables.length} tabelas no schema público:`);
    tables.forEach(table => {
      console.log(`   📄 ${table.table_name} (${table.table_type})`);
    });
  } else {
    console.log('⚠️  Nenhuma tabela encontrada no schema público');
  }

  // Verificar tabelas ETL específicas
  console.log('\n🔍 Verificando tabelas ETL específicas...');
  const etlTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND (
      table_name LIKE 'staging_%' OR
      table_name LIKE 'etl_%' OR
      table_name LIKE 'dim_%' OR
      table_name LIKE 'fato_%'
    )
    ORDER BY table_name
  `;

  if (etlTables.length > 0) {
    console.log(`✅ Encontradas ${etlTables.length} tabelas ETL:`);
    etlTables.forEach(table => console.log(`   📊 ${table.table_name}`));
  } else {
    console.log('⚠️  Nenhuma tabela ETL encontrada');
  }

  // Verificar a tabela staging_03_desvio_distribuicao específicamente
  console.log('\n🎯 Verificando tabela staging_03_desvio_distribuicao...');
  const stagingTable = await sql`
    SELECT COUNT(*) as record_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'staging_03_desvio_distribuicao'
  `;

  if (stagingTable[0].record_count > 0) {
    console.log('✅ Tabela staging_03_desvio_distribuicao encontrada!');

    // Contar registros na tabela
    try {
      const recordCount = await sql`SELECT COUNT(*) as total FROM staging_03_desvio_distribuicao`;
      console.log(`📊 Total de registros: ${recordCount[0].total}`);

      // Mostrar algumas colunas da tabela
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'staging_03_desvio_distribuicao'
        ORDER BY ordinal_position
      `;

      console.log(`📋 Colunas da tabela (${columns.length} total):`);
      columns.slice(0, 10).forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}`);
      });
      if (columns.length > 10) {
        console.log(`   ... e mais ${columns.length - 10} colunas`);
      }

    } catch (err) {
      console.log('⚠️  Erro ao acessar dados da tabela:', err.message);
    }
  } else {
    console.log('❌ Tabela staging_03_desvio_distribuicao NÃO encontrada');
  }

  await sql.end();
  console.log('\n🎉 Teste de conexão completado com sucesso!');

} catch (error) {
  console.error('❌ Erro na conexão com o banco:', error.message);
  console.error('Detalhes:', error);
}