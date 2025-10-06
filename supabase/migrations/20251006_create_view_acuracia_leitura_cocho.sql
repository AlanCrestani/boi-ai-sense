-- View para análise de acurácia da leitura de cocho
-- Processa pares de dias consecutivos e valida se as notas de escore foram corretas

CREATE OR REPLACE VIEW view_acuracia_leitura_cocho AS
WITH dados_com_desvio AS (
  -- Buscar dados dos últimos 14 dias com cálculo de compliance
  SELECT
    organization_id,
    data,
    curral,
    lote,
    escore,
    cms_realizado_kg as realizado,
    cms_previsto_kg as previsto,
    EXTRACT(DOW FROM data) as dia_semana_num,
    CASE EXTRACT(DOW FROM data)
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Seg'
      WHEN 2 THEN 'Ter'
      WHEN 3 THEN 'Qua'
      WHEN 4 THEN 'Qui'
      WHEN 5 THEN 'Sex'
      WHEN 6 THEN 'Sáb'
    END as dia_semana,
    -- Calcular ratio compliance (realizado/previsto)
    CASE
      WHEN cms_previsto_kg > 0 THEN cms_realizado_kg / cms_previsto_kg
      ELSE 0
    END as ratio_compliance,
    -- Verificar se está dentro do target (±2% = entre 0.98 e 1.02)
    CASE
      WHEN cms_previsto_kg > 0 AND
           cms_realizado_kg / cms_previsto_kg >= 0.98 AND
           cms_realizado_kg / cms_previsto_kg <= 1.02
      THEN true
      ELSE false
    END as compliance_ok
  FROM fato_historico_consumo
  WHERE
    data >= (
      SELECT MAX(data) - INTERVAL '13 days'
      FROM fato_historico_consumo
      WHERE organization_id = fato_historico_consumo.organization_id
    )
    AND escore IS NOT NULL
    AND cms_previsto_kg > 0
    AND curral IS NOT NULL
    AND lote IS NOT NULL
),
pares_consecutivos AS (
  -- Criar pares de dias consecutivos usando window function
  SELECT
    organization_id,
    curral,
    lote,
    data as data_dia1,
    dia_semana as dia_semana_dia1,
    escore as escore_dia1,
    realizado as realizado_dia1,
    previsto as previsto_dia1,
    ratio_compliance as ratio_compliance_dia1,
    compliance_ok as compliance_ok_dia1,
    -- Pegar próximo dia
    LEAD(data) OVER (PARTITION BY organization_id, curral, lote ORDER BY data) as data_dia2,
    LEAD(dia_semana) OVER (PARTITION BY organization_id, curral, lote ORDER BY data) as dia_semana_dia2,
    LEAD(escore) OVER (PARTITION BY organization_id, curral, lote ORDER BY data) as escore_dia2
  FROM dados_com_desvio
),
validacoes_classificadas AS (
  -- Classificar cada par de acordo com as regras de negócio
  SELECT
    organization_id,
    curral,
    lote,
    data_dia1,
    dia_semana_dia1,
    escore_dia1,
    data_dia2,
    dia_semana_dia2,
    escore_dia2,
    realizado_dia1,
    previsto_dia1,
    ratio_compliance_dia1 as ratio_compliance,
    compliance_ok_dia1 as compliance_ok,

    -- REGRA 1: Se compliance não passou, marcar como INVALIDO
    CASE
      WHEN NOT compliance_ok_dia1 THEN 'INVALIDO'

      -- REGRA 2: Nota 1 é sempre ACERTO (é o objetivo, pode repetir)
      WHEN escore_dia1 = 1 THEN 'ACERTO'

      -- REGRA 3: Notas corretas em direção ao 1 (AUMENTANDO)
      WHEN escore_dia1 = -2 AND escore_dia2 IN (-1, 0, 1) THEN 'ACERTO'
      WHEN escore_dia1 = -1 AND escore_dia2 IN (0, 1) THEN 'ACERTO'
      WHEN escore_dia1 = 0 AND escore_dia2 = 1 THEN 'ACERTO'

      -- REGRA 4: Notas corretas em direção ao 1 (DIMINUINDO)
      WHEN escore_dia1 = 4 AND escore_dia2 IN (3, 2, 1) THEN 'ACERTO'
      WHEN escore_dia1 = 3 AND escore_dia2 IN (2, 1) THEN 'ACERTO'
      WHEN escore_dia1 = 2 AND escore_dia2 = 1 THEN 'ACERTO'

      -- REGRA 5: Erros leves (ultrapassa 1 casa)
      WHEN (escore_dia1 = 0 AND escore_dia2 = 2) OR
           (escore_dia1 = 2 AND escore_dia2 = 0) OR
           (escore_dia1 = 1 AND escore_dia2 = 0) OR
           (escore_dia1 = 1 AND escore_dia2 = 2)
      THEN 'ERRO_LEVE'

      -- REGRA 6: Erros graves (ultrapassa 2+ casas ou vai na direção errada)
      -- Aumentando mas ultrapassou o 1
      WHEN (escore_dia1 = 0 AND escore_dia2 IN (3, 4)) OR
           (escore_dia1 = -1 AND escore_dia2 IN (2, 3, 4)) OR
           (escore_dia1 = -2 AND escore_dia2 IN (2, 3, 4))
      THEN 'ERRO_GRAVE'

      -- Diminuindo mas ultrapassou o 1
      WHEN (escore_dia1 = 2 AND escore_dia2 IN (-1, -2)) OR
           (escore_dia1 = 3 AND escore_dia2 IN (0, -1, -2)) OR
           (escore_dia1 = 4 AND escore_dia2 IN (0, -1, -2))
      THEN 'ERRO_GRAVE'

      -- Saiu do 1 para qualquer direção (exceto repetir 1)
      WHEN escore_dia1 = 1 AND escore_dia2 IN (-2, -1, 0, 2, 3, 4)
      THEN 'ERRO_GRAVE'

      -- Qualquer outro caso não mapeado = ERRO_GRAVE
      ELSE 'ERRO_GRAVE'
    END as tipo_validacao,

    -- Motivo do erro (para debugging e insights)
    CASE
      WHEN NOT compliance_ok_dia1 THEN 'Tratador não executou corretamente (realizado/previsto fora de ±2%)'
      WHEN escore_dia1 = 1 THEN 'Nota 1 é sempre acerto (objetivo alcançado)'

      -- Acertos
      WHEN escore_dia1 = -2 AND escore_dia2 IN (-1, 0, 1) THEN 'Aumentou corretamente em direção ao 1'
      WHEN escore_dia1 = -1 AND escore_dia2 IN (0, 1) THEN 'Aumentou corretamente em direção ao 1'
      WHEN escore_dia1 = 0 AND escore_dia2 = 1 THEN 'Aumentou corretamente e alcançou o objetivo'
      WHEN escore_dia1 = 4 AND escore_dia2 IN (3, 2, 1) THEN 'Diminuiu corretamente em direção ao 1'
      WHEN escore_dia1 = 3 AND escore_dia2 IN (2, 1) THEN 'Diminuiu corretamente em direção ao 1'
      WHEN escore_dia1 = 2 AND escore_dia2 = 1 THEN 'Diminuiu corretamente e alcançou o objetivo'

      -- Erros leves
      WHEN escore_dia1 = 0 AND escore_dia2 = 2 THEN 'Poderia ter dado nota 1 ao invés de 2'
      WHEN escore_dia1 = 2 AND escore_dia2 = 0 THEN 'Poderia ter dado nota 1 ao invés de 0'
      WHEN escore_dia1 = 1 AND escore_dia2 = 0 THEN 'Poderia ter mantido nota 1 (objetivo) ao invés de 0'
      WHEN escore_dia1 = 1 AND escore_dia2 = 2 THEN 'Poderia ter mantido nota 1 (objetivo) ao invés de 2'

      -- Erros graves
      WHEN escore_dia1 = 0 AND escore_dia2 IN (3, 4) THEN 'Aumentou demais (pulou 2+ casas)'
      WHEN escore_dia1 = -1 AND escore_dia2 IN (2, 3, 4) THEN 'Aumentou demais (ultrapassou o 1)'
      WHEN escore_dia1 = -2 AND escore_dia2 IN (2, 3, 4) THEN 'Aumentou demais (ultrapassou o 1)'
      WHEN escore_dia1 = 2 AND escore_dia2 IN (-1, -2) THEN 'Diminuiu demais (ultrapassou o 1)'
      WHEN escore_dia1 = 3 AND escore_dia2 IN (0, -1, -2) THEN 'Diminuiu demais (pulou 2+ casas)'
      WHEN escore_dia1 = 4 AND escore_dia2 IN (0, -1, -2) THEN 'Diminuiu demais (pulou 2+ casas)'
      WHEN escore_dia1 = 1 AND escore_dia2 IN (-2, -1, 0, 2, 3, 4) THEN 'Saiu do objetivo (nota 1) sem necessidade'

      ELSE 'Erro não mapeado'
    END as motivo
  FROM pares_consecutivos
  WHERE data_dia2 IS NOT NULL  -- Só pares válidos (onde existe dia seguinte)
)
-- SELECT final com métricas agregadas
SELECT
  organization_id,
  curral,
  lote,
  data_dia1,
  dia_semana_dia1,
  escore_dia1,
  data_dia2,
  dia_semana_dia2,
  escore_dia2,
  realizado_dia1,
  previsto_dia1,
  ratio_compliance,
  compliance_ok,
  tipo_validacao,
  motivo,

  -- Métricas agregadas por curral/lote (usando window functions)
  COUNT(*) OVER (PARTITION BY organization_id, curral, lote) as total_validacoes,

  SUM(CASE WHEN compliance_ok THEN 1 ELSE 0 END)
    OVER (PARTITION BY organization_id, curral, lote) as total_validacoes_compliance,

  SUM(CASE WHEN tipo_validacao = 'ACERTO' AND compliance_ok THEN 1 ELSE 0 END)
    OVER (PARTITION BY organization_id, curral, lote) as total_acertos,

  SUM(CASE WHEN tipo_validacao = 'ERRO_LEVE' AND compliance_ok THEN 1 ELSE 0 END)
    OVER (PARTITION BY organization_id, curral, lote) as total_erros_leves,

  SUM(CASE WHEN tipo_validacao = 'ERRO_GRAVE' AND compliance_ok THEN 1 ELSE 0 END)
    OVER (PARTITION BY organization_id, curral, lote) as total_erros_graves,

  -- Taxa de acerto (%)
  CASE
    WHEN SUM(CASE WHEN compliance_ok THEN 1 ELSE 0 END)
         OVER (PARTITION BY organization_id, curral, lote) > 0
    THEN (SUM(CASE WHEN tipo_validacao = 'ACERTO' AND compliance_ok THEN 1 ELSE 0 END)
          OVER (PARTITION BY organization_id, curral, lote)::NUMERIC /
          SUM(CASE WHEN compliance_ok THEN 1 ELSE 0 END)
          OVER (PARTITION BY organization_id, curral, lote)::NUMERIC) * 100
    ELSE 0
  END as taxa_acerto_percentual,

  -- Compliance do tratador (%)
  CASE
    WHEN COUNT(*) OVER (PARTITION BY organization_id, curral, lote) > 0
    THEN (SUM(CASE WHEN compliance_ok THEN 1 ELSE 0 END)
          OVER (PARTITION BY organization_id, curral, lote)::NUMERIC /
          COUNT(*) OVER (PARTITION BY organization_id, curral, lote)::NUMERIC) * 100
    ELSE 0
  END as compliance_tratador_percentual

FROM validacoes_classificadas
ORDER BY organization_id, curral, lote, data_dia1;

-- Conceder permissões
GRANT SELECT ON view_acuracia_leitura_cocho TO anon, authenticated;

-- Comentário na view
COMMENT ON VIEW view_acuracia_leitura_cocho IS
'View otimizada para análise de acurácia da leitura de cocho.
Processa pares de dias consecutivos e valida se as notas de escore foram dadas corretamente.
REGRAS:
1. Só valida se tratador executou corretamente (realizado/previsto entre 0.98-1.02)
2. Nota 1 é o objetivo (sempre acerto)
3. Notas devem caminhar em direção ao 1
4. Erros leves: ultrapassam 1 casa
5. Erros graves: ultrapassam 2+ casas';
