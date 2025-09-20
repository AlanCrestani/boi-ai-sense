import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    // Import PostgreSQL client
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');

    // Create direct connection using service role credentials
    const client = new Client({
      hostname: 'aws-0-us-east-1.pooler.supabase.com',
      port: 5432,
      user: 'postgres.zirowpnlxjenkxiqcuwz',
      password: '7@8f47EixKxvFhLt',
      database: 'postgres',
      tls: {
        enabled: true,
        enforce: false,
        caCertificates: []
      }
    });

    await client.connect();

    // Execute the view update
    await client.queryObject(`
      CREATE OR REPLACE VIEW view_ingrediente_resumo AS
      SELECT
          organization_id,
          ingrediente,
          sum(realizado_kg) AS realizado_kg,
          sum(previsto_kg) AS previsto_kg,
          sum(desvio_kg) AS desvio_kg,
          avg(desvio_pc) AS desvio_pc,
          data
      FROM fato_carregamento
      WHERE ingrediente IS NOT NULL
          AND realizado_kg IS NOT NULL
          AND previsto_kg IS NOT NULL
      GROUP BY organization_id, ingrediente, data;
    `);

    await client.end();

    return new Response(JSON.stringify({
      success: true,
      message: 'view_ingrediente_resumo migrated to use fato_carregamento'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});