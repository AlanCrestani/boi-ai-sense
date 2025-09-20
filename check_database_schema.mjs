import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zirowpnlxjenkxiqcuwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTYwMTksImV4cCI6MjA3MzA5MjAxOX0.4WTrwYIZZSey5_9yE4mU2aP19P9tl3CeGr1RjBC7IH8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Verificando schema do banco de dados...\n');

  try {
    // Verificar tabelas existentes no esquema public
    const { data: tables, error: tablesError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.error('❌ Erro ao buscar tabelas:', tablesError);
      return;
    }

    console.log('📋 TABELAS ENCONTRADAS NO BANCO:');
    console.log('================================');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    console.log('\n🔍 Verificando tabelas específicas do projeto...\n');

    // Verificar tabelas específicas que esperamos
    const expectedTables = [
      'organizations',
      'profiles', 
      'user_roles',
      'invitations',
      'staging_02_desvio_carregamento',
      'staging_04_itens_trato'
    ];

    for (const tableName of expectedTables) {
      const tableExists = tables.some(t => t.table_name === tableName);
      console.log(`${tableExists ? '✅' : '❌'} ${tableName}`);
      
      if (tableExists) {
        // Verificar colunas da tabela
        const { data: columns, error: columnsError } = await supabase
          .rpc('sql', {
            query: `
              SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = '${tableName}'
              ORDER BY ordinal_position;
            `
          });

        if (!columnsError && columns) {
          console.log(`   Colunas (${columns.length}):`);
          columns.forEach(col => {
            console.log(`     - ${col.column_name} (${col.data_type})`);
          });
        }
      }
      console.log('');
    }

    // Verificar views
    console.log('\n📊 VIEWS ENCONTRADAS:');
    console.log('====================');
    const { data: views, error: viewsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            table_name as view_name
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'VIEW'
          ORDER BY table_name;
        `
      });

    if (!viewsError && views) {
      views.forEach(view => {
        console.log(`- ${view.view_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar verificação
checkDatabaseSchema();