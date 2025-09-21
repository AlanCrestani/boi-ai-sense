-- Grant permissions for view_dieta_resumo
GRANT SELECT ON view_dieta_resumo TO anon, authenticated;

-- Add RLS policy if needed (though views typically inherit from base tables)
-- ALTER VIEW view_dieta_resumo ENABLE ROW LEVEL SECURITY;