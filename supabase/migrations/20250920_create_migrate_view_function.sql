-- Criar função RPC para migrar a view
CREATE OR REPLACE FUNCTION migrate_view_ingrediente_resumo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Drop and recreate the view to use fato_carregamento
    EXECUTE '
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
    ';

    RETURN 'view_ingrediente_resumo migrated to use fato_carregamento successfully';
END;
$$;