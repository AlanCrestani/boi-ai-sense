import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role to have DDL permissions
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Update view_ingrediente_resumo to use fato_carregamento directly with SQL
    const { data, error } = await supabase
      .from('_temp_sql_exec')
      .select('*')
      .eq('sql', `
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

    // Actually execute with raw SQL via pg library
    const client = new (await import('https://deno.land/x/postgres@v0.17.0/mod.ts')).Client({
      hostname: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres.zirowpnlxjenkxiqcuwz',
      password: Deno.env.get('SUPABASE_DB_PASSWORD'),
      database: 'postgres',
      tls: {
        enabled: true,
        enforce: false,
        caCertificates: []
      }
    });

    await client.connect();

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
      message: 'view_ingrediente_resumo updated to use fato_carregamento'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});