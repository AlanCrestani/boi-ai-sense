-- Função para gerar automaticamente o nome padronizado do lote
-- Formato: AAMMDD - [SETOR_ABRV][PASTO_ABRV] - [SEQ]
-- Exemplo: 250930 - SE01 - 01

CREATE OR REPLACE FUNCTION generate_nome_lote(
  p_data_entrada DATE,
  p_pasto_id UUID,
  p_organization_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_data_parte TEXT;
  v_setor_abrv TEXT;
  v_pasto_abrv TEXT;
  v_sequencial INTEGER;
  v_sequencial_str TEXT;
  v_nome_lote TEXT;
BEGIN
  -- Gera a parte da data no formato AAMMDD (Ano com 2 dígitos, Mês, Dia)
  v_data_parte := TO_CHAR(p_data_entrada, 'YYMMDD');

  -- Busca a abreviação do setor e do pasto
  SELECT
    s.nome_abrv,
    p.nome_abrv
  INTO
    v_setor_abrv,
    v_pasto_abrv
  FROM dim_pastos p
  INNER JOIN dim_setores s ON p.setor_id = s.id
  WHERE p.id = p_pasto_id
    AND p.organization_id = p_organization_id;

  -- Se não encontrou o pasto ou as abreviações não estão preenchidas, retorna NULL
  IF v_setor_abrv IS NULL OR v_pasto_abrv IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcula o número sequencial para o mesmo dia, pasto e organização
  SELECT COALESCE(MAX(
    CASE
      -- Extrai o número sequencial da última parte do nome (após o último hífen)
      WHEN nome ~ '-\s*[0-9]+\s*$' THEN
        CAST(
          REGEXP_REPLACE(
            SUBSTRING(nome FROM '-\s*([0-9]+)\s*$'),
            '[^0-9]',
            '',
            'g'
          ) AS INTEGER
        )
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequencial
  FROM dim_lotes_pasto
  WHERE pasto_id = p_pasto_id
    AND organization_id = p_organization_id
    AND data_entrada = p_data_entrada;

  -- Formata o sequencial com 2 dígitos (01, 02, ..., 99)
  v_sequencial_str := LPAD(v_sequencial::TEXT, 2, '0');

  -- Monta o nome final: AAMMDD - [SETOR][PASTO] - [SEQ]
  v_nome_lote := v_data_parte || ' - ' || v_setor_abrv || v_pasto_abrv || ' - ' || v_sequencial_str;

  RETURN v_nome_lote;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION generate_nome_lote(DATE, UUID, UUID) IS 'Gera automaticamente o nome padronizado do lote no formato AAMMDD - [SETOR_ABRV][PASTO_ABRV] - [SEQ]. Exemplo: 250930 - SE01 - 01';