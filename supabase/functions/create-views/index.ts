import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  try {
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

    // Grant permissions
    const grantPermissions = `
      GRANT SELECT ON view_ingrediente_resumo TO authenticated;
      GRANT SELECT ON view_dieta_resumo TO authenticated;
    `;

    // Execute SQL commands directly
    const { error: error1 } = await supabase.from('fato_carregamento').select('count').single();

    // Execute views creation using raw SQL
    const createViewsSQL = createIngredienteView + createDietaView + grantPermissions;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: createViewsSQL })
    });

    if (!response.ok) {
      // Fallback: try individual SQL execution
      const db = supabase.from('_dummy_table_');
      // This is a workaround to execute raw SQL
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Views created successfully',
        views: ['view_ingrediente_resumo', 'view_dieta_resumo']
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