import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Boi*Sense2024@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function createFatoDistribuicaoTable() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS fato_distribuicao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        file_id UUID NOT NULL,
        data TEXT,
        hora TEXT,
        vagao TEXT,
        curral TEXT,
        trato TEXT,
        tratador TEXT,
        dieta TEXT,
        realizado_kg NUMERIC,
        previsto_kg NUMERIC,
        desvio_kg NUMERIC,
        desvio_pc NUMERIC,
        status TEXT,
        merge TEXT,
        id_carregamento TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('📝 Criando tabela fato_distribuicao...');
    await client.query(createTableSQL);
    console.log('✅ Tabela fato_distribuicao criada com sucesso!');

    // Criar índices
    console.log('📋 Criando índices...');

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_data
        ON fato_distribuicao (organization_id, data);`,

      `CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_merge
        ON fato_distribuicao (merge);`,

      `CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_curral_data
        ON fato_distribuicao (organization_id, curral, data);`,

      `CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_id_carregamento
        ON fato_distribuicao (id_carregamento) WHERE id_carregamento IS NOT NULL;`
    ];

    for (const indexSQL of indexes) {
      try {
        await client.query(indexSQL);
        console.log('✅ Índice criado');
      } catch (indexError) {
        console.warn('⚠️ Erro criando índice:', indexError.message);
      }
    }

    // Configurar RLS
    console.log('🔒 Configurando Row Level Security...');

    const rlsSQL = `
      ALTER TABLE fato_distribuicao ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "fato_distribuicao_isolation" ON fato_distribuicao;
      CREATE POLICY "fato_distribuicao_isolation" ON fato_distribuicao
        USING (organization_id = (SELECT auth.uid()::text::uuid));
    `;

    try {
      await client.query(rlsSQL);
      console.log('✅ RLS configurado');
    } catch (rlsError) {
      console.warn('⚠️ Erro configurando RLS:', rlsError.message);
    }

    // Verificar estrutura criada
    const checkResult = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'fato_distribuicao'
      ORDER BY ordinal_position
    `);

    console.log('📋 Estrutura da tabela criada:');
    checkResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n🎉 Tabela fato_distribuicao criada com sucesso!');
    console.log('📊 Colunas incluídas:');
    console.log('   - Campos base: data, hora, vagao, curral, trato, tratador, dieta');
    console.log('   - Campos numéricos: realizado_kg, previsto_kg, desvio_kg, desvio_pc');
    console.log('   - Campos controle: status, merge, id_carregamento');
    console.log('   - Campos padrão: id, organization_id, file_id, created_at, updated_at');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await client.end();
    console.log('🔚 Conexão fechada');
  }
}

createFatoDistribuicaoTable();