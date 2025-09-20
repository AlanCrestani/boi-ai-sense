// Script para criar tabela staging_05_trato_por_curral
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace('6543', '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

async function createStaging05Table() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await client.connect();

    console.log('🔨 Criando tabela staging_05_trato_por_curral...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS staging_05_trato_por_curral (
        id SERIAL PRIMARY KEY,
        organization_id UUID NOT NULL,
        file_id UUID,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        vagao VARCHAR(100),
        curral VARCHAR(100) NOT NULL,
        id_carregamento VARCHAR(100),
        lote VARCHAR(100),
        trato VARCHAR(100),
        realizado_kg DECIMAL(10, 2),
        dieta VARCHAR(255),
        tratador VARCHAR(255),
        ms_dieta_pc DECIMAL(5, 2),
        merge VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ Tabela staging_05_trato_por_curral criada com sucesso!');

    // Verificar se a tabela foi criada
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staging_05_trato_por_curral'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura da tabela criada:');
    verifyResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${col.column_name}: ${col.data_type} (${nullable})`);
    });

    console.log('\n🎯 Tabela staging_05_trato_por_curral pronta para uso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createStaging05Table();