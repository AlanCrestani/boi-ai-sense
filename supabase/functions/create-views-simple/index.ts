import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create view_ingrediente_resumo
    const createIngredienteView = `
      CREATE OR REPLACE VIEW view_ingrediente_resumo AS
      SELECT
          organization_id,
          data::date as data,
          ingrediente,
          SUM(previsto_kg) as previsto_kg,
          SUM(realizado_kg) as realizado_kg,
          SUM(desvio_kg) as desvio_kg,
          CASE
              WHEN SUM(previsto_kg) > 0 THEN
                  ROUND((SUM(desvio_kg) / SUM(previsto_kg)) * 100, 2)
              ELSE 0
          END as desvio_percentual
      FROM fato_carregamento
      WHERE organization_id IS NOT NULL
        AND data IS NOT NULL
        AND ingrediente IS NOT NULL
      GROUP BY organization_id, data::date, ingrediente
      ORDER BY organization_id, data::date, ingrediente;
    `;

    // Create view_dieta_resumo
    const createDietaView = `
      CREATE OR REPLACE VIEW view_dieta_resumo AS
      SELECT
          organization_id,
          data::date as data,
          dieta,
          SUM(previsto_kg) as previsto_kg,
          SUM(realizado_kg) as realizado_kg,
          SUM(desvio_kg) as desvio_kg,
          CASE
              WHEN SUM(previsto_kg) > 0 THEN
                  ROUND((SUM(desvio_kg) / SUM(previsto_kg)) * 100, 2)
              ELSE 0
          END as desvio_percentual
      FROM fato_carregamento
      WHERE organization_id IS NOT NULL
        AND data IS NOT NULL
        AND dieta IS NOT NULL
      GROUP BY organization_id, data::date, dieta
      ORDER BY organization_id, data::date, dieta;
    `;

    // Execute first view
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/vnd.pgrst.object+json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'tx=commit'
      },
      body: createIngredienteView
    });

    // Execute second view
    const response2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/vnd.pgrst.object+json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'tx=commit'
      },
      body: createDietaView
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Views creation attempted',
        response1: response1.status,
        response2: response2.status,
        sql1: createIngredienteView,
        sql2: createDietaView
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating views:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});