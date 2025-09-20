import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://postgres.zirowpnlxjenkxiqcuwz:Boi*Sense2024@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function createFatoDistribuicaoTable() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS fato_distribuicao (
        id SERIAL PRIMARY KEY,
        organization_id UUID NOT NULL,

        -- Campos da staging_03_desvio_distribuicao (base)
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

        -- Campos enriquecidos da staging_05_trato_por_curral
        id_carregamento VARCHAR(100),
        lote VARCHAR(100),
        ms_dieta_pc DECIMAL(5, 2),

        -- Campos de controle
        merge VARCHAR(255),
        staging_03_id INTEGER,
        staging_05_id INTEGER,
        enrichment_status VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, PARTIAL, NO_MATCH

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Constraints
        CONSTRAINT fato_distribuicao_org_merge_unique UNIQUE (organization_id, merge)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_data
        ON fato_distribuicao (organization_id, data);

      CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_merge
        ON fato_distribuicao (merge);

      CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_curral_data
        ON fato_distribuicao (organization_id, curral, data);

      CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_id_carregamento
        ON fato_distribuicao (id_carregamento) WHERE id_carregamento IS NOT NULL;

      -- Row Level Security
      ALTER TABLE fato_distribuicao ENABLE ROW LEVEL SECURITY;

      -- Policy for organization isolation
      DROP POLICY IF EXISTS "fato_distribuicao_isolation" ON fato_distribuicao;
      CREATE POLICY "fato_distribuicao_isolation" ON fato_distribuicao
        USING (organization_id = (SELECT auth.uid()::text::uuid));
    `;

    console.log('📝 Criando tabela fato_distribuicao...');
    await client.query(createTableSQL);
    console.log('✅ Tabela fato_distribuicao criada com sucesso!');

    // Verificar se a tabela foi criada
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

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await client.end();
    console.log('🔚 Conexão fechada');
  }
}

createFatoDistribuicaoTable();