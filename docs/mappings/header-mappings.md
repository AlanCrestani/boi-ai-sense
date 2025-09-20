# Tabelas de Mapeamento de Headers

## 📋 Visão Geral

Esta documentação define os mapeamentos de headers utilizados no sistema ETL para padronizar dados de diferentes fontes. O sistema suporta correspondência exata, fuzzy matching, expressões regulares e análise semântica para garantir máxima compatibilidade.

## 🗂️ Estrutura de Mapeamentos

### Headers Padrão do Sistema

Os seguintes headers são considerados padrão no sistema:

| Header Padrão | Tipo | Descrição | Validação |
|---------------|------|-----------|-----------|
| `animal_id` | string | Identificador único do animal | Alfanumérico, máx 50 chars |
| `weight_kg` | decimal | Peso do animal em quilogramas | Positivo, 0-9999.999 |
| `measurement_date` | datetime | Data/hora da medição | ISO 8601 ou DD/MM/YYYY |
| `farm_id` | string | Identificador da fazenda | UUID ou código alfanumérico |
| `operator_id` | string | Identificador do operador | UUID ou código de funcionário |
| `feed_type` | string | Tipo de ração utilizada | Enum pré-definido |
| `feed_amount` | decimal | Quantidade de ração (kg) | Positivo, 0-999.999 |
| `temperature` | decimal | Temperatura ambiente (°C) | -50 a 70 |
| `humidity` | decimal | Umidade relativa (%) | 0-100 |
| `pen_id` | string | Identificador do curral | Alfanumérico |

## 🎯 Mapeamentos por Categoria

### 1. Identificação Animal

#### Correspondências Exatas
```yaml
exact_mappings:
  animal_id:
    - "animal_id"
    - "id_animal"
    - "codigo_animal"
    - "animal_code"
```

#### Correspondências Fuzzy (Similaridade > 80%)
```yaml
fuzzy_mappings:
  animal_id:
    - "brinco" (95%)
    - "numero_brinco" (90%)
    - "tag" (85%)
    - "animal_tag" (95%)
    - "bovino_id" (90%)
    - "gado_id" (85%)
    - "animal_number" (90%)
    - "livestock_id" (85%)
```

#### Padrões Regex
```regex
# Padrões para identificação animal
^(id|cod|codigo|num|numero)_?(animal|boi|gado|bovino)s?$
^(brinco|tag)_?(numero|number|id)?$
^(livestock|cattle)_?(id|code|number)$
```

#### Aliases Regionais
```yaml
regional_aliases:
  brasil:
    - "brinco"
    - "numero_brinco"
    - "codigo_bovino"
    - "id_gado"

  argentina:
    - "caravana"
    - "numero_caravana"
    - "id_bovino"

  colombia:
    - "chapeta"
    - "numero_chapeta"
    - "codigo_res"

  internacional:
    - "ear_tag"
    - "livestock_id"
    - "cattle_id"
    - "animal_number"
```

### 2. Peso e Medições

#### Correspondências Exatas
```yaml
exact_mappings:
  weight_kg:
    - "weight_kg"
    - "peso_kg"
    - "peso_quilos"
    - "weight_kilos"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  weight_kg:
    - "peso" (95%)
    - "weight" (95%)
    - "wt" (80%)
    - "kilogramas" (90%)
    - "kilograms" (90%)
    - "peso_corporal" (85%)
    - "body_weight" (85%)
    - "live_weight" (80%)
    - "peso_vivo" (85%)
```

#### Padrões Regex
```regex
^(peso|weight|wt)_?(kg|quilos?|kilos?|kilograms?)?$
^(body|live)_?(weight|peso)_?(kg)?$
^mass[ao]?_?corporal_?(kg)?$
```

#### Conversões de Unidade
```yaml
unit_conversions:
  weight_pounds:
    target: "weight_kg"
    conversion: "value * 0.453592"
    regex: "^(peso|weight)_?(lb|lbs|pounds?|libras?)$"

  weight_arrobas:
    target: "weight_kg"
    conversion: "value * 15"
    regex: "^(peso_)?arrobas?$"

  weight_grams:
    target: "weight_kg"
    conversion: "value / 1000"
    regex: "^(peso|weight)_?(g|grams?|gramas?)$"
```

### 3. Data e Timestamp

#### Correspondências Exatas
```yaml
exact_mappings:
  measurement_date:
    - "measurement_date"
    - "data_pesagem"
    - "data_medicao"
    - "weighing_date"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  measurement_date:
    - "data" (80%)
    - "date" (95%)
    - "timestamp" (85%)
    - "ts" (75%)
    - "datetime" (90%)
    - "data_hora" (85%)
    - "fecha" (85%)
    - "fecha_pesaje" (90%)
```

#### Padrões Regex
```regex
^(data|date|timestamp|ts)_?(pesagem|medicao|measurement|weighing)?$
^(fecha)_?(pesaje|medicion)?$
^(created|recorded)_?(at|date|time)$
```

#### Formatos de Data Suportados
```yaml
date_formats:
  iso_8601:
    - "YYYY-MM-DDTHH:mm:ss.sssZ"
    - "YYYY-MM-DD HH:mm:ss"
    - "YYYY-MM-DD"

  brazilian:
    - "DD/MM/YYYY HH:mm:ss"
    - "DD/MM/YYYY HH:mm"
    - "DD/MM/YYYY"
    - "DD-MM-YYYY"

  american:
    - "MM/DD/YYYY HH:mm:ss"
    - "MM/DD/YYYY"
    - "MM-DD-YYYY"

  european:
    - "DD.MM.YYYY HH:mm:ss"
    - "DD.MM.YYYY"
```

### 4. Localização (Fazenda/Curral)

#### Correspondências Exatas
```yaml
exact_mappings:
  farm_id:
    - "farm_id"
    - "id_fazenda"
    - "fazenda_id"
    - "propriedade_id"

  pen_id:
    - "pen_id"
    - "id_curral"
    - "curral_id"
    - "paddock_id"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  farm_id:
    - "fazenda" (90%)
    - "farm" (95%)
    - "propriedade" (85%)
    - "rancho" (80%)
    - "hacienda" (80%)
    - "estancia" (80%)
    - "ranch" (90%)
    - "property" (85%)

  pen_id:
    - "curral" (95%)
    - "pen" (95%)
    - "paddock" (90%)
    - "corral" (90%)
    - "enclosure" (80%)
    - "piquete" (85%)
    - "potrero" (80%)
```

#### Padrões Regex
```regex
# Fazenda/Propriedade
^(id|cod|codigo)_?(fazenda|farm|propriedade|rancho|ranch|hacienda)$
^(farm|ranch|property)_?(id|code|number)$

# Curral/Piquete
^(id|cod|codigo)_?(curral|pen|paddock|corral|piquete)$
^(pen|paddock|enclosure)_?(id|number)$
```

### 5. Operador/Funcionário

#### Correspondências Exatas
```yaml
exact_mappings:
  operator_id:
    - "operator_id"
    - "id_operador"
    - "operador_id"
    - "funcionario_id"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  operator_id:
    - "operador" (95%)
    - "operator" (95%)
    - "funcionario" (90%)
    - "employee" (90%)
    - "worker" (85%)
    - "trabalhador" (85%)
    - "usuario" (80%)
    - "user" (80%)
```

### 6. Alimentação

#### Correspondências Exatas
```yaml
exact_mappings:
  feed_type:
    - "feed_type"
    - "tipo_racao"
    - "tipo_alimentacao"
    - "food_type"

  feed_amount:
    - "feed_amount"
    - "quantidade_racao"
    - "volume_racao"
    - "amount_feed"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  feed_type:
    - "racao" (95%)
    - "feed" (95%)
    - "alimentacao" (90%)
    - "food" (85%)
    - "comida" (80%)
    - "alimento" (90%)
    - "forragem" (85%)
    - "forage" (85%)

  feed_amount:
    - "quantidade" (85%)
    - "amount" (95%)
    - "volume" (90%)
    - "peso_racao" (85%)
    - "kg_racao" (90%)
```

### 7. Condições Ambientais

#### Correspondências Exatas
```yaml
exact_mappings:
  temperature:
    - "temperature"
    - "temperatura"
    - "temp"

  humidity:
    - "humidity"
    - "umidade"
    - "humedad"
```

#### Correspondências Fuzzy
```yaml
fuzzy_mappings:
  temperature:
    - "temp" (90%)
    - "temperatura_ambiente" (85%)
    - "ambient_temp" (85%)
    - "air_temp" (80%)

  humidity:
    - "umidade_relativa" (90%)
    - "relative_humidity" (95%)
    - "rh" (85%)
    - "humedad_relativa" (90%)
```

## 🔧 Configuração de Mapeamentos Customizados

### Estrutura de Configuração

```yaml
# config/custom-mappings.yaml
organization_mappings:
  "fazenda-xyz-123":
    custom_patterns:
      animal_id:
        - pattern: "^BOVINO_[0-9]{4}_[A-Z]{2}$"
          confidence: 0.95
        - pattern: "^XYZ[0-9]{6}$"
          confidence: 0.90

      weight_kg:
        - pattern: "^PESO_CORPORAL_(KG|QUILOS)$"
          confidence: 0.90

    aliases:
      - source: "número identificação"
        target: "animal_id"
        confidence: 0.90

      - source: "massa corporal"
        target: "weight_kg"
        confidence: 0.85

    unit_conversions:
      - source_pattern: "peso_arrobas?"
        target: "weight_kg"
        conversion: "value * 15"

  "cooperativa-abc-456":
    regional_settings:
      date_format: "DD/MM/YYYY"
      decimal_separator: ","
      thousand_separator: "."

    required_fields:
      - "animal_id"
      - "weight_kg"
      - "measurement_date"
      - "farm_id"

    optional_fields:
      - "operator_id"
      - "temperature"
      - "humidity"
```

### API de Mapeamentos Customizados

```typescript
// Registrar novo mapeamento customizado
POST /api/mappings/custom
{
  "organizationId": "org-123",
  "sourceHeader": "codigo_bovino_especial",
  "targetHeader": "animal_id",
  "mappingType": "custom",
  "pattern": "^BOV[0-9]{6}[A-Z]{2}$",
  "confidence": 0.95,
  "description": "Padrão específico da fazenda XYZ"
}

// Buscar mapeamentos para organização
GET /api/mappings/organization/org-123

// Testar mapeamento
POST /api/mappings/test
{
  "headers": ["codigo_bovino_especial", "peso_animal", "data"],
  "organizationId": "org-123"
}
```

## 📊 Métricas de Mapeamento

### Estatísticas de Uso

```sql
-- Mapeamentos mais utilizados
SELECT
  target_header,
  mapping_type,
  COUNT(*) as usage_count,
  AVG(confidence_score) as avg_confidence,
  COUNT(DISTINCT organization_id) as org_count
FROM etl_header_mapping
WHERE last_used_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY target_header, mapping_type
ORDER BY usage_count DESC;

-- Taxa de sucesso por tipo de mapeamento
SELECT
  mapping_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_approved = true) as successful_mappings,
  ROUND(
    COUNT(*) FILTER (WHERE is_approved = true)::decimal /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate
FROM etl_header_mapping
GROUP BY mapping_type;
```

### Dashboard de Qualidade

```sql
-- Headers mais problemáticos (necessitam intervenção manual)
SELECT
  source_header,
  COUNT(*) as occurrence_count,
  COUNT(*) FILTER (WHERE mapping_type = 'custom') as manual_mappings,
  AVG(confidence_score) as avg_confidence
FROM etl_header_mapping
WHERE confidence_score < 0.8
GROUP BY source_header
HAVING COUNT(*) > 5
ORDER BY occurrence_count DESC;
```

## 🔍 Troubleshooting

### Headers Não Mapeados Comuns

```yaml
common_unmapped_headers:
  identification:
    - "num_brinco_novo"  # Sugestão: adicionar ao fuzzy matching de animal_id
    - "codigo_chip"      # Sugestão: criar mapeamento para animal_id
    - "rfid_tag"         # Sugestão: criar mapeamento para animal_id

  weight:
    - "peso_balanca_1"   # Sugestão: adicionar regex para peso_*
    - "weight_lbs"       # Sugestão: adicionar conversão de libras
    - "peso_estimado"    # Sugestão: criar campo separado para peso estimado

  location:
    - "setor_pasto"      # Sugestão: criar campo para setor
    - "lote_animais"     # Sugestão: criar campo para lote
    - "divisao_fazenda"  # Sugestão: mapeamento para farm_id ou novo campo
```

### Resolução de Conflitos

```yaml
conflict_resolution_rules:
  multiple_candidates:
    strategy: "highest_confidence"
    min_confidence_diff: 0.1

  ambiguous_mappings:
    strategy: "manual_review"
    auto_approve_threshold: 0.95

  regional_differences:
    strategy: "organization_preference"
    fallback: "most_common"
```

---

**Próximo Documento**: [Regras de Validação](validation-rules.md)