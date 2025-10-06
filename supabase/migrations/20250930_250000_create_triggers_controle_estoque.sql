-- Triggers para controle automático de estoque de insumos do pasto
-- 1. Importa fabricações de proteinado do fato_carregamento como entrada
-- 2. Dá baixa no estoque quando há distribuição concluída

-- =====================================================
-- TRIGGER 1: Importar fabricação para estoque
-- =====================================================

CREATE OR REPLACE FUNCTION fn_importar_fabricacao_para_estoque()
RETURNS TRIGGER AS $$
DECLARE
  v_saldo_anterior DECIMAL(10,2);
  v_saldo_novo DECIMAL(10,2);
  v_ingrediente VARCHAR(100);
BEGIN
  -- Verifica se é proteinado (ajustar lógica conforme necessário)
  -- Considera proteinado se a dieta contém a palavra "proteinado" (case-insensitive)
  IF NEW.dieta ILIKE '%proteinado%' THEN

    -- Define o ingrediente como "Proteinado" + nome da dieta se houver
    v_ingrediente := 'Proteinado';
    IF NEW.dieta IS NOT NULL AND NEW.dieta != '' THEN
      v_ingrediente := 'Proteinado - ' || NEW.dieta;
    END IF;

    -- Busca saldo anterior para este ingrediente
    SELECT COALESCE(saldo_atual_kg, 0) INTO v_saldo_anterior
    FROM estoque_insumos_pasto
    WHERE organization_id = NEW.organization_id
      AND ingrediente = v_ingrediente
    ORDER BY created_at DESC
    LIMIT 1;

    -- Se não encontrou saldo anterior, considera zero
    IF v_saldo_anterior IS NULL THEN
      v_saldo_anterior := 0;
    END IF;

    -- Calcula novo saldo (entrada aumenta o estoque)
    v_saldo_novo := v_saldo_anterior + NEW.realizado_kg;

    -- Insere movimentação de entrada no estoque
    INSERT INTO estoque_insumos_pasto (
      organization_id,
      ingrediente,
      tipo_movimentacao,
      quantidade_kg,
      data_movimentacao,
      hora_movimentacao,
      origem_tipo,
      origem_id_carregamento,
      saldo_anterior_kg,
      saldo_atual_kg,
      observacoes,
      created_by
    ) VALUES (
      NEW.organization_id,
      v_ingrediente,
      'entrada',
      NEW.realizado_kg,
      NEW.data,
      NEW.hora,
      'fabricacao',
      NEW.id_carregamento,
      v_saldo_anterior,
      v_saldo_novo,
      'Importação automática de fato_carregamento - Vagão: ' || COALESCE(NEW.vagao::TEXT, 'N/A') || ', Equipamento: ' || COALESCE(NEW.equipamento, 'N/A'),
      NEW.created_by
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger AFTER INSERT no fato_carregamento
CREATE TRIGGER trg_importar_fabricacao_estoque
AFTER INSERT ON fato_carregamento
FOR EACH ROW
EXECUTE FUNCTION fn_importar_fabricacao_para_estoque();

COMMENT ON FUNCTION fn_importar_fabricacao_para_estoque() IS 'Importa automaticamente fabricações de proteinado do fato_carregamento para o estoque';

-- =====================================================
-- TRIGGER 2: Baixa no estoque na distribuição
-- =====================================================

CREATE OR REPLACE FUNCTION fn_baixa_estoque_distribuicao()
RETURNS TRIGGER AS $$
DECLARE
  v_saldo_anterior DECIMAL(10,2);
  v_saldo_novo DECIMAL(10,2);
  v_ingrediente VARCHAR(100);
  v_dieta_nome VARCHAR(100);
BEGIN
  -- Apenas quando houver consumo realizado registrado
  IF NEW.consumo_realizado_kg IS NOT NULL AND NEW.consumo_realizado_kg > 0 THEN

    -- Busca nome da dieta se houver
    IF NEW.dieta_id IS NOT NULL THEN
      SELECT nome INTO v_dieta_nome
      FROM dim_dietas
      WHERE id = NEW.dieta_id;

      v_ingrediente := 'Proteinado - ' || COALESCE(v_dieta_nome, 'Geral');
    ELSE
      v_ingrediente := 'Proteinado';
    END IF;

    -- Busca saldo anterior para este ingrediente
    SELECT COALESCE(saldo_atual_kg, 0) INTO v_saldo_anterior
    FROM estoque_insumos_pasto
    WHERE organization_id = NEW.organization_id
      AND ingrediente = v_ingrediente
    ORDER BY created_at DESC
    LIMIT 1;

    -- Se não encontrou saldo anterior, considera zero
    IF v_saldo_anterior IS NULL THEN
      v_saldo_anterior := 0;
    END IF;

    -- Verifica se há saldo suficiente
    IF v_saldo_anterior < NEW.consumo_realizado_kg THEN
      RAISE EXCEPTION 'Estoque insuficiente de "%" (Saldo atual: % kg, Necessário: % kg)',
        v_ingrediente, v_saldo_anterior, NEW.consumo_realizado_kg;
    END IF;

    -- Calcula novo saldo (saída diminui o estoque)
    v_saldo_novo := v_saldo_anterior - NEW.consumo_realizado_kg;

    -- Insere movimentação de saída no estoque
    INSERT INTO estoque_insumos_pasto (
      organization_id,
      ingrediente,
      tipo_movimentacao,
      quantidade_kg,
      data_movimentacao,
      hora_movimentacao,
      origem_tipo,
      origem_id_distribuicao,
      saldo_anterior_kg,
      saldo_atual_kg,
      observacoes,
      created_by
    ) VALUES (
      NEW.organization_id,
      v_ingrediente,
      'saida',
      NEW.consumo_realizado_kg,
      NEW.data_registro,
      NEW.hora_registro,
      'distribuicao',
      NEW.id,
      v_saldo_anterior,
      v_saldo_novo,
      'Distribuição para lote (ID: ' || NEW.lote_id || ')',
      NEW.updated_by
    );

    -- Atualiza o status da distribuição para concluído se ainda não estiver
    IF NEW.status != 'concluido' THEN
      NEW.status := 'concluido';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger BEFORE INSERT OR UPDATE no fato_distribuicao_pasto
-- Usar BEFORE para poder modificar NEW.status se necessário
CREATE TRIGGER trg_baixa_estoque_distribuicao
BEFORE INSERT OR UPDATE ON fato_distribuicao_pasto
FOR EACH ROW
WHEN (NEW.consumo_realizado_kg IS NOT NULL AND NEW.consumo_realizado_kg > 0)
EXECUTE FUNCTION fn_baixa_estoque_distribuicao();

COMMENT ON FUNCTION fn_baixa_estoque_distribuicao() IS 'Dá baixa automática no estoque quando há consumo realizado em distribuição';