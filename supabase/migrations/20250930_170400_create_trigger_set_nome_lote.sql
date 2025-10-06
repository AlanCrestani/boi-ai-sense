-- Trigger para aplicar automaticamente a função generate_nome_lote
-- Este trigger é executado ANTES de cada INSERT ou UPDATE em dim_lotes_pasto
-- e preenche automaticamente a coluna nome com o formato padronizado

CREATE OR REPLACE FUNCTION trigger_set_nome_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Apenas gera o nome se:
  -- 1. O nome ainda não foi definido (é NULL ou vazio)
  -- 2. Temos data_entrada, pasto_id e organization_id válidos
  IF (NEW.nome IS NULL OR NEW.nome = '')
     AND NEW.data_entrada IS NOT NULL
     AND NEW.pasto_id IS NOT NULL
     AND NEW.organization_id IS NOT NULL
  THEN
    NEW.nome := generate_nome_lote(
      NEW.data_entrada,
      NEW.pasto_id,
      NEW.organization_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Cria o trigger para INSERT
DROP TRIGGER IF EXISTS trigger_set_nome_lote_before_insert ON dim_lotes_pasto;
CREATE TRIGGER trigger_set_nome_lote_before_insert
  BEFORE INSERT ON dim_lotes_pasto
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_nome_lote();

-- Cria o trigger para UPDATE (caso data_entrada ou pasto_id sejam alterados)
DROP TRIGGER IF EXISTS trigger_set_nome_lote_before_update ON dim_lotes_pasto;
CREATE TRIGGER trigger_set_nome_lote_before_update
  BEFORE UPDATE OF data_entrada, pasto_id ON dim_lotes_pasto
  FOR EACH ROW
  WHEN (OLD.data_entrada IS DISTINCT FROM NEW.data_entrada OR OLD.pasto_id IS DISTINCT FROM NEW.pasto_id)
  EXECUTE FUNCTION trigger_set_nome_lote();

-- Comentários explicativos
COMMENT ON FUNCTION trigger_set_nome_lote() IS 'Função trigger que gera automaticamente o nome padronizado do lote antes de INSERT ou UPDATE';
COMMENT ON TRIGGER trigger_set_nome_lote_before_insert ON dim_lotes_pasto IS 'Gera automaticamente o nome do lote no formato AAMMDD - [SETOR][PASTO] - [SEQ] antes da inserção';
COMMENT ON TRIGGER trigger_set_nome_lote_before_update ON dim_lotes_pasto IS 'Atualiza o nome do lote quando data_entrada ou pasto_id são alterados';