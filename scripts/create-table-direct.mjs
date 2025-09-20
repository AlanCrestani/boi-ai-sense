import pkg from 'pg';
const { Client } = pkg;

// Usar conexão direta sem pooler
const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();

    console.log('Criando tabela staging_03_desvio_distribuicao...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS staging_03_desvio_distribuicao (
        id SERIAL PRIMARY KEY,
        organization_id UUID NOT NULL,
        created_by UUID,
        updated_by UUID,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        vagao VARCHAR(100),
        curral VARCHAR(100) NOT NULL,
        trato VARCHAR(100),
        tratador VARCHAR(255),
        dieta VARCHAR(255),
        realizado_kg DECIMAL(10, 2),
        previsto_kg DECIMAL(10, 2),
        desvio_kg DECIMAL(10, 2),
        desvio_pc DECIMAL(10, 2),
        status VARCHAR(50),
        merge VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ Tabela staging_03_desvio_distribuicao criada com sucesso!');

    // Criar índices
    console.log('Criando índices...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_staging_03_data ON staging_03_desvio_distribuicao(data);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);');
    console.log('✅ Índices criados!');

    // Habilitar RLS
    console.log('Habilitando Row Level Security...');
    await client.query('ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS habilitado!');

    // Verificar se a tabela foi criada
    const result = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'staging_03_desvio_distribuicao'
      ORDER BY ordinal_position;
    `);

    console.log('\\n🎉 Tabela criada com as seguintes colunas:');
    result.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createTable();