# Regras de Validação de Dados

## 📋 Visão Geral

Este documento define todas as regras de validação aplicadas aos dados durante o processamento ETL. As validações são organizadas em categorias e aplicadas em diferentes estágios do pipeline para garantir a qualidade e consistência dos dados.

## 🎯 Categorias de Validação

### 1. Validações de Formato (Nível 1)
- Verificação de tipos de dados
- Formatos de string e padrões
- Limites de tamanho
- Encoding de caracteres

### 2. Validações de Domínio (Nível 2)
- Valores dentro de faixas válidas
- Enums e listas de valores permitidos
- Formatos específicos de IDs
- Consistência interna

### 3. Validações de Negócio (Nível 3)
- Regras específicas da pecuária
- Correlações entre campos
- Validações temporais
- Constraints organizacionais

### 4. Validações de Integridade (Nível 4)
- Referências entre entidades
- Unicidade de registros
- Dependências entre dados
- Consistência histórica

## 🔍 Regras por Campo

### animal_id (Identificação do Animal)

#### Validações de Formato
```yaml
format_validations:
  type: "string"
  required: true
  max_length: 50
  min_length: 1
  pattern: "^[A-Za-z0-9\-_]{1,50}$"
  trim: true
  case_sensitive: false
```

#### Validações de Domínio
```yaml
domain_validations:
  allowed_patterns:
    - "^[A-Z]{2,3}[0-9]{3,8}$"        # Padrão brasileiro (BR001234)
    - "^[0-9]{4,12}$"                 # Numérico puro
    - "^[A-Za-z0-9\-]{5,20}$"         # Alfanumérico com hífen
    - "^RFID[0-9A-F]{8,16}$"          # RFID tags

  forbidden_values:
    - "000000"
    - "123456"
    - "test"
    - "exemplo"
    - "null"
    - "undefined"
    - ""
```

#### Validações de Negócio
```typescript
// Regras específicas de negócio
const businessRules = {
  // Animal deve existir no sistema ou ser registrado automaticamente
  existsInSystem: async (animalId: string, organizationId: string) => {
    const exists = await db.exists('animals', {
      id: animalId,
      organization_id: organizationId
    });

    if (!exists && AUTO_REGISTER_ANIMALS) {
      await createAnimalRecord(animalId, organizationId);
    }

    return exists || AUTO_REGISTER_ANIMALS;
  },

  // Não pode haver duplicatas na mesma data
  noDuplicatesPerDate: async (animalId: string, date: Date, organizationId: string) => {
    const existing = await db.count('animal_measurements', {
      animal_id: animalId,
      measurement_date: date,
      organization_id: organizationId
    });

    return existing === 0;
  },

  // Animal não pode estar marcado como inativo
  isActive: async (animalId: string, organizationId: string) => {
    const animal = await db.findOne('animals', {
      id: animalId,
      organization_id: organizationId
    });

    return animal?.status !== 'inactive';
  }
};
```

### weight_kg (Peso em Quilogramas)

#### Validações de Formato
```yaml
format_validations:
  type: "decimal"
  required: true
  precision: 10
  scale: 3
  min_value: 0
  max_value: 9999.999
```

#### Validações de Domínio
```yaml
domain_validations:
  biological_limits:
    min_weight: 50      # kg - peso mínimo biologicamente viável
    max_weight: 2000    # kg - peso máximo para bovinos

  age_based_limits:
    calf:       { min: 25,   max: 150  }   # Bezerros
    young:      { min: 100,  max: 400  }   # Jovens
    adult:      { min: 300,  max: 800  }   # Adultos
    breeding:   { min: 400,  max: 1200 }   # Reprodutores
```

#### Validações de Negócio
```typescript
const weightValidations = {
  // Variação máxima entre medições consecutivas
  maxVariationBetweenMeasurements: async (
    animalId: string,
    newWeight: number,
    measurementDate: Date,
    organizationId: string
  ) => {
    const lastMeasurement = await getLastMeasurement(animalId, measurementDate, organizationId);

    if (!lastMeasurement) return true; // Primeira medição

    const daysBetween = daysBetween(lastMeasurement.date, measurementDate);
    const weightDifference = Math.abs(newWeight - lastMeasurement.weight);

    // Variação máxima: 3kg por dia (ganho) ou 5kg por dia (perda)
    const maxGain = daysBetween * 3;
    const maxLoss = daysBetween * 5;

    if (newWeight > lastMeasurement.weight) {
      return (newWeight - lastMeasurement.weight) <= maxGain;
    } else {
      return (lastMeasurement.weight - newWeight) <= maxLoss;
    }
  },

  // Peso deve ser compatível com idade estimada
  compatibleWithAge: async (animalId: string, weight: number, organizationId: string) => {
    const animal = await getAnimalInfo(animalId, organizationId);

    if (!animal.birthDate) return true; // Sem data de nascimento, não valida

    const ageInMonths = monthsBetween(animal.birthDate, new Date());

    // Curvas de crescimento padrão
    const expectedWeightRanges = {
      0: { min: 25, max: 50 },    // Nascimento
      6: { min: 120, max: 200 },  // 6 meses
      12: { min: 200, max: 350 }, // 1 ano
      18: { min: 280, max: 450 }, // 1.5 anos
      24: { min: 350, max: 550 }, // 2 anos
      36: { min: 400, max: 700 }  // 3 anos
    };

    const range = getExpectedRange(ageInMonths, expectedWeightRanges);
    return weight >= range.min * 0.8 && weight <= range.max * 1.2; // Margem de 20%
  },

  // Detecção de outliers estatísticos
  statisticalOutlier: async (
    animalId: string,
    weight: number,
    organizationId: string
  ) => {
    const recentWeights = await getRecentWeights(animalId, organizationId, 10);

    if (recentWeights.length < 3) return true; // Dados insuficientes

    const mean = recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length;
    const stdDev = Math.sqrt(
      recentWeights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / recentWeights.length
    );

    const zScore = Math.abs(weight - mean) / stdDev;

    return zScore <= 3; // Dentro de 3 desvios padrão
  }
};
```

### measurement_date (Data de Medição)

#### Validações de Formato
```yaml
format_validations:
  type: "datetime"
  required: true
  formats:
    - "YYYY-MM-DDTHH:mm:ss.sssZ"    # ISO 8601
    - "YYYY-MM-DD HH:mm:ss"         # SQL timestamp
    - "DD/MM/YYYY HH:mm:ss"         # Brasileiro
    - "DD/MM/YYYY"                  # Brasileiro (data apenas)
    - "YYYY-MM-DD"                  # ISO date
```

#### Validações de Domínio
```yaml
domain_validations:
  not_future: true                    # Não pode ser no futuro
  not_too_old: "1990-01-01"          # Não pode ser anterior a 1990
  business_hours_only: false          # Aceita medições fora do horário comercial

  time_constraints:
    min_interval_hours: 6             # Mínimo 6h entre medições do mesmo animal
    max_interval_days: 365            # Máximo 1 ano desde última medição
```

#### Validações de Negócio
```typescript
const dateValidations = {
  // Data não pode ser futura
  notInFuture: (date: Date) => {
    return date <= new Date();
  },

  // Intervalo mínimo entre medições do mesmo animal
  minimumInterval: async (
    animalId: string,
    newDate: Date,
    organizationId: string
  ) => {
    const lastMeasurement = await getLastMeasurement(animalId, newDate, organizationId);

    if (!lastMeasurement) return true;

    const hoursDifference = hoursBetween(lastMeasurement.date, newDate);
    return hoursDifference >= 6; // Mínimo 6 horas
  },

  // Data deve ser compatível com período de vida do animal
  withinAnimalLifespan: async (
    animalId: string,
    date: Date,
    organizationId: string
  ) => {
    const animal = await getAnimalInfo(animalId, organizationId);

    if (animal.birthDate && date < animal.birthDate) {
      return false; // Medição antes do nascimento
    }

    if (animal.deathDate && date > animal.deathDate) {
      return false; // Medição após morte
    }

    return true;
  },

  // Detecção de padrões suspeitos (muitas medições em pouco tempo)
  suspiciousPattern: async (
    animalId: string,
    date: Date,
    organizationId: string
  ) => {
    const recentMeasurements = await getRecentMeasurements(
      animalId,
      organizationId,
      date,
      24 // últimas 24 horas
    );

    // Máximo 4 medições por dia
    return recentMeasurements.length < 4;
  }
};
```

### farm_id (Identificação da Fazenda)

#### Validações de Formato
```yaml
format_validations:
  type: "string"
  required: true
  max_length: 100
  min_length: 1
  pattern: "^[A-Za-z0-9\-_]{1,100}$"
```

#### Validações de Integridade
```typescript
const farmValidations = {
  // Fazenda deve existir e estar ativa
  existsAndActive: async (farmId: string, organizationId: string) => {
    const farm = await db.findOne('farms', {
      id: farmId,
      organization_id: organizationId
    });

    return farm && farm.status === 'active';
  },

  // Animal deve estar atribuído à fazenda
  animalBelongsToFarm: async (
    animalId: string,
    farmId: string,
    organizationId: string
  ) => {
    const animal = await db.findOne('animals', {
      id: animalId,
      organization_id: organizationId
    });

    return !animal.current_farm_id || animal.current_farm_id === farmId;
  },

  // Fazenda deve ter permissões para a organização
  hasPermissions: async (farmId: string, organizationId: string) => {
    const permissions = await db.findOne('farm_permissions', {
      farm_id: farmId,
      organization_id: organizationId
    });

    return permissions && permissions.can_record_measurements;
  }
};
```

### operator_id (Identificação do Operador)

#### Validações de Formato
```yaml
format_validations:
  type: "string"
  required: false
  max_length: 100
  min_length: 1
  pattern: "^[A-Za-z0-9\-_@.]{1,100}$"
```

#### Validações de Integridade
```typescript
const operatorValidations = {
  // Operador deve existir e estar ativo
  existsAndActive: async (operatorId: string, organizationId: string) => {
    const operator = await db.findOne('users', {
      id: operatorId,
      organization_id: organizationId
    });

    return operator && operator.status === 'active';
  },

  // Operador deve ter permissões para registrar medições
  hasPermissions: async (operatorId: string, organizationId: string) => {
    const permissions = await getUserPermissions(operatorId, organizationId);
    return permissions.includes('record_measurements');
  },

  // Verificar limite de medições por operador por dia
  dailyLimit: async (operatorId: string, date: Date, organizationId: string) => {
    const todayMeasurements = await db.count('animal_measurements', {
      operator_id: operatorId,
      organization_id: organizationId,
      measurement_date: {
        '>=': startOfDay(date),
        '<': endOfDay(date)
      }
    });

    const dailyLimit = await getOperatorDailyLimit(operatorId, organizationId);
    return todayMeasurements < dailyLimit;
  }
};
```

## 🚨 Validações de Integridade Complexas

### Consistência Temporal

```typescript
const temporalValidations = {
  // Sequência cronológica de pesos deve fazer sentido
  chronologicalWeightSequence: async (
    animalId: string,
    newWeight: number,
    newDate: Date,
    organizationId: string
  ) => {
    const measurements = await db
      .select(['weight_kg', 'measurement_date'])
      .from('animal_measurements')
      .where('animal_id', animalId)
      .where('organization_id', organizationId)
      .orderBy('measurement_date', 'asc');

    // Inserir nova medição na sequência ordenada
    measurements.push({ weight_kg: newWeight, measurement_date: newDate });
    measurements.sort((a, b) => a.measurement_date.getTime() - b.measurement_date.getTime());

    // Verificar se a sequência faz sentido biológico
    for (let i = 1; i < measurements.length; i++) {
      const prev = measurements[i - 1];
      const curr = measurements[i];

      const daysDiff = daysBetween(prev.measurement_date, curr.measurement_date);
      const weightDiff = curr.weight_kg - prev.weight_kg;
      const dailyGain = weightDiff / daysDiff;

      // Ganho diário não pode ser superior a 5kg ou inferior a -3kg
      if (dailyGain > 5 || dailyGain < -3) {
        return {
          valid: false,
          reason: `Ganho diário inviável: ${dailyGain.toFixed(2)}kg/dia`
        };
      }
    }

    return { valid: true };
  },

  // Detecção de medições fora de sequência
  outOfSequenceDetection: async (
    animalId: string,
    newDate: Date,
    organizationId: string
  ) => {
    const futureMeasurements = await db.count('animal_measurements', {
      animal_id: animalId,
      organization_id: organizationId,
      measurement_date: { '>': newDate }
    });

    if (futureMeasurements > 0) {
      return {
        valid: false,
        reason: 'Inserção de medição retroativa detectada',
        warning: 'Medição está sendo inserida entre medições existentes'
      };
    }

    return { valid: true };
  }
};
```

### Validações de Correlação

```typescript
const correlationValidations = {
  // Peso vs idade deve seguir curvas de crescimento
  weightAgeCorrelation: async (
    animalId: string,
    weight: number,
    organizationId: string
  ) => {
    const animal = await getAnimalInfo(animalId, organizationId);

    if (!animal.birthDate) return { valid: true }; // Sem idade conhecida

    const ageInDays = daysBetween(animal.birthDate, new Date());
    const expectedWeight = calculateExpectedWeight(ageInDays, animal.breed);

    const deviation = Math.abs(weight - expectedWeight) / expectedWeight;

    if (deviation > 0.4) { // Mais de 40% de desvio
      return {
        valid: false,
        reason: `Peso incompatível com idade: esperado ~${expectedWeight}kg, recebido ${weight}kg`
      };
    }

    return { valid: true };
  },

  // Condições ambientais vs performance
  environmentalCorrelation: async (
    weight: number,
    temperature: number,
    humidity: number,
    animalId: string,
    organizationId: string
  ) => {
    // Condições extremas afetam ganho de peso
    const heatIndex = calculateHeatIndex(temperature, humidity);

    if (heatIndex > 35) { // Stress térmico alto
      const recentGains = await getRecentWeightGains(animalId, organizationId, 7);
      const avgGain = recentGains.reduce((sum, gain) => sum + gain, 0) / recentGains.length;

      if (avgGain > 2) { // Ganho muito alto para condições de stress
        return {
          valid: false,
          reason: 'Ganho de peso improvável em condições de stress térmico',
          warning: `Índice de calor: ${heatIndex}°C`
        };
      }
    }

    return { valid: true };
  }
};
```

## 🔧 Sistema de Validação Configurável

### Configuração por Organização

```yaml
# config/validation-rules.yaml
organization_rules:
  "fazenda-modelo-123":
    weight_limits:
      min: 100          # kg
      max: 900          # kg

    measurement_frequency:
      min_interval_hours: 24
      max_measurements_per_day: 2

    mandatory_fields:
      - "animal_id"
      - "weight_kg"
      - "measurement_date"
      - "operator_id"

    business_rules:
      enforce_chronological_order: true
      allow_retroactive_entries: false
      max_retroactive_days: 7

    quality_thresholds:
      min_data_quality_score: 85
      max_outlier_percentage: 5

  "cooperativa-sul-456":
    weight_limits:
      min: 50
      max: 1200

    regional_settings:
      timezone: "America/Sao_Paulo"
      date_format: "DD/MM/YYYY"

    automated_corrections:
      auto_fix_decimal_separators: true
      auto_convert_units: true
      auto_trim_whitespace: true
```

### API de Configuração

```typescript
// Atualizar regras de validação
PUT /api/validation-rules/organization/{orgId}
{
  "weightLimits": {
    "min": 100,
    "max": 900
  },
  "measurementFrequency": {
    "minIntervalHours": 24,
    "maxMeasurementsPerDay": 2
  },
  "businessRules": {
    "enforceChronologicalOrder": true,
    "allowRetroactiveEntries": false
  }
}

// Obter regras ativas
GET /api/validation-rules/organization/{orgId}

// Testar validação
POST /api/validation-rules/test
{
  "organizationId": "org-123",
  "data": {
    "animal_id": "BR001234",
    "weight_kg": 450.5,
    "measurement_date": "2025-01-16T10:30:00Z",
    "farm_id": "farm-001"
  }
}
```

## 📊 Métricas de Validação

### Estatísticas de Qualidade

```sql
-- Taxa de validação por campo
SELECT
  field_name,
  COUNT(*) as total_validations,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_count,
  ROUND(
    COUNT(*) FILTER (WHERE is_valid = true)::decimal /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate
FROM validation_results
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY field_name
ORDER BY success_rate ASC;

-- Tipos de erro mais comuns
SELECT
  error_type,
  field_name,
  COUNT(*) as error_count,
  COUNT(DISTINCT organization_id) as affected_orgs
FROM validation_errors
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY error_type, field_name
ORDER BY error_count DESC
LIMIT 20;
```

### Dashboard de Monitoramento

```sql
-- Qualidade de dados em tempo real
CREATE VIEW data_quality_dashboard AS
SELECT
  organization_id,
  DATE_TRUNC('hour', validated_at) as hour,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE quality_score >= 95) as high_quality,
  COUNT(*) FILTER (WHERE quality_score >= 80) as good_quality,
  COUNT(*) FILTER (WHERE quality_score < 80) as poor_quality,
  AVG(quality_score) as avg_quality_score,
  COUNT(DISTINCT validation_errors.id) as total_errors
FROM validation_results
LEFT JOIN validation_errors ON validation_results.record_id = validation_errors.record_id
WHERE validated_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY organization_id, hour
ORDER BY hour DESC;
```

---

**Documento Anterior**: [Mapeamento de Headers](header-mappings.md)
**Próximo Documento**: [Lógica de Transformação](transformation-logic.md)