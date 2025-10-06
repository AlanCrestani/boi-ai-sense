-- Função para atualizar estatísticas após mudanças nas tabelas fato
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
  -- Atualizar estatísticas das tabelas fato principais
  ANALYZE fato_historico_consumo;
  ANALYZE fato_carregamento;
  ANALYZE fato_distribuicao;
  ANALYZE fato_distribuicao_pasto;

  -- Atualizar estatísticas das tabelas dimensão relacionadas
  ANALYZE dim_lotes;
  ANALYZE dim_lotes_pasto;
  ANALYZE dim_ingredientes;
  ANALYZE dim_dietas;
  ANALYZE dim_pastos;
  ANALYZE dim_setores;

  -- Atualizar estatísticas das views materializadas se existirem
  -- (Views normais não precisam de ANALYZE pois são recalculadas a cada query)

  -- Log da atualização
  RAISE NOTICE 'Estatísticas atualizadas em %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Função trigger para atualizar estatísticas após bulk insert/update/delete
CREATE OR REPLACE FUNCTION trigger_update_statistics()
RETURNS trigger AS $$
BEGIN
  -- Só executar se mais de 100 linhas foram afetadas
  -- Para evitar overhead em operações pequenas
  IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    -- Agendar atualização de estatísticas para não bloquear a operação
    -- Usando pg_notify para processar de forma assíncrona
    PERFORM pg_notify('update_statistics', TG_TABLE_NAME::text);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para as tabelas fato principais
-- Usando AFTER e FOR EACH STATEMENT para executar apenas uma vez após toda operação

DROP TRIGGER IF EXISTS update_stats_after_changes ON fato_historico_consumo;
CREATE TRIGGER update_stats_after_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON fato_historico_consumo
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_statistics();

DROP TRIGGER IF EXISTS update_stats_after_changes ON fato_carregamento;
CREATE TRIGGER update_stats_after_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON fato_carregamento
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_statistics();

DROP TRIGGER IF EXISTS update_stats_after_changes ON fato_distribuicao;
CREATE TRIGGER update_stats_after_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON fato_distribuicao
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_statistics();

DROP TRIGGER IF EXISTS update_stats_after_changes ON fato_distribuicao_pasto;
CREATE TRIGGER update_stats_after_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON fato_distribuicao_pasto
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_statistics();

-- Função para atualização manual de estatísticas (pode ser chamada via RPC)
CREATE OR REPLACE FUNCTION manual_update_statistics()
RETURNS text AS $$
BEGIN
  PERFORM update_table_statistics();
  RETURN 'Estatísticas atualizadas com sucesso em ' || NOW()::text;
END;
$$ LANGUAGE plpgsql;

-- Grant para permitir execução da função manual
GRANT EXECUTE ON FUNCTION manual_update_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_update_statistics() TO service_role;

-- Executar uma vez para garantir estatísticas atualizadas
SELECT update_table_statistics();