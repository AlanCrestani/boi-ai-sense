import pg from 'pg';
const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.zirowpnlxjenkxiqcuwz:Xi60F1EdKWnJccNL@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create the table
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
    console.log('Table staging_03_desvio_distribuicao created successfully');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_staging_03_organization_id ON staging_03_desvio_distribuicao(organization_id);',
      'CREATE INDEX IF NOT EXISTS idx_staging_03_data ON staging_03_desvio_distribuicao(data);',
      'CREATE INDEX IF NOT EXISTS idx_staging_03_curral ON staging_03_desvio_distribuicao(curral);',
      'CREATE INDEX IF NOT EXISTS idx_staging_03_status ON staging_03_desvio_distribuicao(status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_03_created_at ON staging_03_desvio_distribuicao(created_at DESC);'
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
      console.log(`Index created: ${indexSQL.match(/idx_\w+/)[0]}`);
    }

    // Enable RLS
    await client.query('ALTER TABLE staging_03_desvio_distribuicao ENABLE ROW LEVEL SECURITY;');
    console.log('RLS enabled');

    // Verify table creation
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'staging_03_desvio_distribuicao'
      ORDER BY ordinal_position;
    `);

    console.log('\nTable columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\nTable created successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTable();