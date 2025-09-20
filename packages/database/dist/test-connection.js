import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as etlSchema from './schema/etl.js';
import * as dimensionsSchema from './schema/dimensions.js';
import * as factsSchema from './schema/facts.js';
// Test database connection and schema validation
export async function testConnection() {
    const connectionString = process.env.DATABASE_URL ||
        `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.VITE_SUPABASE_URL?.replace('https://', '')}:5432/postgres`;
    console.log('🔌 Testing database connection...');
    try {
        const client = postgres(connectionString, {
            max: 1,
            idle_timeout: 5,
            connect_timeout: 10
        });
        // Database instance for schema validation
        drizzle(client, {
            schema: {
                ...etlSchema,
                ...dimensionsSchema,
                ...factsSchema
            }
        });
        // Test basic connection
        const result = await client `SELECT NOW() as current_time, version() as pg_version`;
        console.log('✅ Database connected successfully');
        console.log(`⏰ Current time: ${result[0].current_time}`);
        console.log(`🐘 PostgreSQL version: ${result[0].pg_version.split(' ')[0]}`);
        // Test schema availability (check if tables exist)
        console.log('\n📋 Checking table existence...');
        const tables = await client `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'etl_run', 'etl_file', 'etl_run_log',
        'etl_staging_02_desvio_carregamento',
        'etl_staging_04_trato_curral',
        'dim_curral', 'dim_dieta', 'dim_equipamento',
        'fato_desvio_carregamento', 'fato_trato_curral'
      )
      ORDER BY table_name
    `;
        if (tables.length > 0) {
            console.log(`✅ Found ${tables.length} ETL tables:`);
            tables.forEach(table => console.log(`   📄 ${table.table_name}`));
        }
        else {
            console.log('⚠️  No ETL tables found - migrations may need to be applied');
        }
        // Test RLS policies
        console.log('\n🔒 Checking RLS policies...');
        const policies = await client `
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename LIKE 'etl_%' OR tablename LIKE 'dim_%' OR tablename LIKE 'fato_%'
      ORDER BY tablename, policyname
    `;
        if (policies.length > 0) {
            console.log(`✅ Found ${policies.length} RLS policies:`);
            const groupedPolicies = policies.reduce((acc, policy) => {
                if (!acc[policy.tablename])
                    acc[policy.tablename] = [];
                acc[policy.tablename].push(policy.policyname);
                return acc;
            }, {});
            Object.entries(groupedPolicies).forEach(([table, policyNames]) => {
                console.log(`   🔐 ${table}: ${policyNames.length} policies`);
            });
        }
        else {
            console.log('⚠️  No RLS policies found - security policies may need to be applied');
        }
        // Test indexes
        console.log('\n📈 Checking indexes...');
        const indexes = await client `
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND (tablename LIKE 'etl_%' OR tablename LIKE 'dim_%' OR tablename LIKE 'fato_%')
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `;
        if (indexes.length > 0) {
            console.log(`✅ Found ${indexes.length} performance indexes:`);
            const groupedIndexes = indexes.reduce((acc, index) => {
                if (!acc[index.tablename])
                    acc[index.tablename] = [];
                acc[index.tablename].push(index.indexname);
                return acc;
            }, {});
            Object.entries(groupedIndexes).forEach(([table, indexNames]) => {
                console.log(`   📊 ${table}: ${indexNames.length} indexes`);
            });
        }
        else {
            console.log('⚠️  No performance indexes found');
        }
        await client.end();
        console.log('\n🎉 Database test completed successfully!');
        return {
            connected: true,
            tablesFound: tables.length,
            policiesFound: policies.length,
            indexesFound: indexes.length
        };
    }
    catch (error) {
        console.error('❌ Database connection test failed:', error);
        throw error;
    }
}
// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testConnection()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
//# sourceMappingURL=test-connection.js.map