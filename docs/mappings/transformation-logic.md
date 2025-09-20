# Lógica de Transformação de Dados

## 📋 Visão Geral

Este documento detalha as transformações aplicadas aos dados durante o processamento ETL. As transformações são organizadas em etapas sequenciais, cada uma com objetivos específicos para garantir que os dados sejam padronizados, enriquecidos e otimizados para análise.

## 🔄 Etapas de Transformação

### 1. Normalização e Limpeza
- Padronização de formatos
- Conversão de tipos de dados
- Remoção de caracteres inválidos
- Correção de encoding

### 2. Enriquecimento de Dados
- Adição de dados contextuais
- Cálculo de métricas derivadas
- Integração com fontes externas
- Geocodificação

### 3. Cálculos de Performance
- Métricas de crescimento
- Indicadores de eficiência
- Scores de saúde
- Rankings comparativos

### 4. Agregações e Sumarizações
- Médias móveis
- Totalizações por período
- Métricas de grupo
- Tendências temporais

## 🧮 Transformações por Campo

### animal_id (Identificação do Animal)

#### Normalização
```typescript
const normalizeAnimalId = (animalId: string): string => {
  return animalId
    .trim()                           // Remove espaços
    .toUpperCase()                    // Converte para maiúscula
    .replace(/[^\w\-]/g, '')          // Remove caracteres especiais
    .substring(0, 50);                // Limita tamanho
};

// Exemplos:
// "  br001234  " → "BR001234"
// "br-001-234" → "BR-001-234"
// "bovino_001@#$" → "BOVINO_001"
```

#### Padronização de Formatos
```typescript
const standardizeAnimalId = (animalId: string, organizationId: string): string => {
  const orgConfig = getOrganizationConfig(organizationId);

  // Aplicar padrão específico da organização
  if (orgConfig.animalIdPattern) {
    return applyPattern(animalId, orgConfig.animalIdPattern);
  }

  // Padrões padrão por tipo
  if (/^\d+$/.test(animalId)) {
    // Numérico puro - adicionar prefixo da fazenda
    return `${orgConfig.farmPrefix}${animalId.padStart(6, '0')}`;
  }

  if (/^[A-Z]{2}\d+$/.test(animalId)) {
    // Já no formato padrão brasileiro
    return animalId;
  }

  return animalId; // Manter original se não corresponder a padrões conhecidos
};
```

### weight_kg (Peso em Quilogramas)

#### Conversão de Unidades
```typescript
interface WeightConversion {
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  precision: number;
}

const weightConversions: WeightConversion[] = [
  { fromUnit: 'lbs', toUnit: 'kg', conversionFactor: 0.453592, precision: 3 },
  { fromUnit: 'pounds', toUnit: 'kg', conversionFactor: 0.453592, precision: 3 },
  { fromUnit: 'arrobas', toUnit: 'kg', conversionFactor: 15, precision: 3 },
  { fromUnit: 'g', toUnit: 'kg', conversionFactor: 0.001, precision: 3 },
  { fromUnit: 'grams', toUnit: 'kg', conversionFactor: 0.001, precision: 3 }
];

const convertWeight = (
  value: number,
  fromUnit: string,
  sourceHeader: string
): number => {
  // Detectar unidade pelo header se não especificada
  if (!fromUnit) {
    fromUnit = detectUnitFromHeader(sourceHeader);
  }

  const conversion = weightConversions.find(c => c.fromUnit === fromUnit);

  if (!conversion) {
    return value; // Assumir que já está em kg
  }

  const converted = value * conversion.conversionFactor;
  return Number(converted.toFixed(conversion.precision));
};

// Exemplos:
// 1000 lbs → 453.592 kg
// 2.5 arrobas → 37.500 kg
// 500000 g → 500.000 kg
```

#### Validação e Correção Automática
```typescript
const validateAndCorrectWeight = (
  weight: number,
  animalId: string,
  measurementDate: Date,
  organizationId: string
): WeightValidationResult => {

  const validationResult: WeightValidationResult = {
    originalValue: weight,
    correctedValue: weight,
    corrections: [],
    warnings: [],
    isValid: true
  };

  // Correção 1: Decimal incorreto (provavelmente em gramas)
  if (weight > 50000 && weight < 2000000) {
    validationResult.correctedValue = weight / 1000;
    validationResult.corrections.push({
      type: 'unit_conversion',
      description: 'Convertido de gramas para quilogramas',
      factor: 0.001
    });
  }

  // Correção 2: Vírgula/ponto decimal invertido
  if (weight < 10 && weight > 0.1) {
    const corrected = weight * 100;
    if (corrected >= 50 && corrected <= 2000) {
      validationResult.correctedValue = corrected;
      validationResult.corrections.push({
        type: 'decimal_correction',
        description: 'Corrigido separador decimal',
        factor: 100
      });
    }
  }

  // Validação final dos limites
  const finalWeight = validationResult.correctedValue;

  if (finalWeight < 25 || finalWeight > 2000) {
    validationResult.isValid = false;
    validationResult.warnings.push(
      `Peso fora dos limites biológicos: ${finalWeight}kg`
    );
  }

  return validationResult;
};
```

### measurement_date (Data de Medição)

#### Normalização de Formatos
```typescript
import { parse, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const supportedDateFormats = [
  'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX',  // ISO 8601 completo
  'yyyy-MM-dd HH:mm:ss',             // SQL timestamp
  'yyyy-MM-dd',                      // ISO date
  'dd/MM/yyyy HH:mm:ss',             // Brasileiro com hora
  'dd/MM/yyyy',                      // Brasileiro
  'dd-MM-yyyy',                      // Brasileiro com hífen
  'MM/dd/yyyy',                      // Americano
  'dd.MM.yyyy',                      // Europeu
];

const normalizeDateString = (
  dateString: string,
  organizationTimezone: string = 'America/Sao_Paulo'
): Date => {

  // Limpar string
  const cleanedDate = dateString.trim().replace(/\s+/g, ' ');

  // Tentar cada formato suportado
  for (const formatString of supportedDateFormats) {
    try {
      const parsedDate = parse(cleanedDate, formatString, new Date());

      if (isValid(parsedDate)) {
        // Ajustar timezone se necessário
        return adjustTimezone(parsedDate, organizationTimezone);
      }
    } catch (error) {
      // Continuar tentando próximo formato
    }
  }

  throw new Error(`Formato de data não reconhecido: ${dateString}`);
};

// Exemplos:
// "16/01/2025 14:30:00" → 2025-01-16T14:30:00-03:00
// "2025-01-16" → 2025-01-16T00:00:00-03:00
// "16.01.2025" → 2025-01-16T00:00:00-03:00
```

#### Enriquecimento Temporal
```typescript
interface TemporalEnrichment {
  dayOfWeek: number;        // 1-7 (segunda-domingo)
  weekOfYear: number;       // 1-53
  monthOfYear: number;      // 1-12
  quarterOfYear: number;    // 1-4
  isWeekend: boolean;
  isHoliday: boolean;
  seasonOfYear: 'summer' | 'autumn' | 'winter' | 'spring';
  workingHours: boolean;    // 8h-17h
}

const enrichTemporalData = (
  date: Date,
  organizationId: string
): TemporalEnrichment => {

  const orgConfig = getOrganizationConfig(organizationId);

  return {
    dayOfWeek: getDay(date),
    weekOfYear: getWeek(date),
    monthOfYear: getMonth(date) + 1,
    quarterOfYear: getQuarter(date),
    isWeekend: isWeekend(date),
    isHoliday: isHoliday(date, orgConfig.country),
    seasonOfYear: getSeason(date, orgConfig.hemisphere),
    workingHours: isWithinWorkingHours(date, orgConfig.workingHours)
  };
};
```

## 📊 Cálculos de Performance Animal

### Métricas de Crescimento

```typescript
interface GrowthMetrics {
  dailyWeightGain: number;           // kg/dia
  weeklyWeightGain: number;          // kg/semana
  monthlyWeightGain: number;         // kg/mês
  cumulativeGain: number;            // kg total desde primeiro registro
  growthRate: number;                // % crescimento
  growthEfficiency: number;          // ganho/tempo (kg/dia normalizado)
}

const calculateGrowthMetrics = async (
  animalId: string,
  currentWeight: number,
  currentDate: Date,
  organizationId: string
): Promise<GrowthMetrics> => {

  const historicalData = await getAnimalWeightHistory(
    animalId,
    organizationId,
    currentDate,
    90 // últimos 90 dias
  );

  if (historicalData.length === 0) {
    return getDefaultGrowthMetrics();
  }

  // Ordenar por data
  const sortedData = historicalData.sort(
    (a, b) => a.measurementDate.getTime() - b.measurementDate.getTime()
  );

  const firstRecord = sortedData[0];
  const lastRecord = sortedData[sortedData.length - 1];

  // Cálculo de ganho diário
  const daysBetween = differenceInDays(currentDate, lastRecord.measurementDate);
  const dailyWeightGain = daysBetween > 0
    ? (currentWeight - lastRecord.weight) / daysBetween
    : 0;

  // Cálculo de ganho semanal (média dos últimos 7 dias)
  const weekData = sortedData.filter(
    record => differenceInDays(currentDate, record.measurementDate) <= 7
  );
  const weeklyWeightGain = calculateWeeklyGain(weekData, currentWeight, currentDate);

  // Cálculo de ganho mensal (média dos últimos 30 dias)
  const monthData = sortedData.filter(
    record => differenceInDays(currentDate, record.measurementDate) <= 30
  );
  const monthlyWeightGain = calculateMonthlyGain(monthData, currentWeight, currentDate);

  // Ganho cumulativo desde primeiro registro
  const cumulativeGain = currentWeight - firstRecord.weight;

  // Taxa de crescimento percentual
  const growthRate = firstRecord.weight > 0
    ? (cumulativeGain / firstRecord.weight) * 100
    : 0;

  // Eficiência de crescimento (normalizada por idade estimada)
  const growthEfficiency = calculateGrowthEfficiency(
    dailyWeightGain,
    animalId,
    organizationId
  );

  return {
    dailyWeightGain,
    weeklyWeightGain,
    monthlyWeightGain,
    cumulativeGain,
    growthRate,
    growthEfficiency
  };
};
```

### Indicadores de Saúde

```typescript
interface HealthIndicators {
  healthScore: number;                // 0-100
  nutritionalStatus: NutritionalStatus;
  growthConsistency: number;          // 0-1 (variabilidade)
  weightTrend: 'increasing' | 'decreasing' | 'stable';
  performanceRank: number;            // Posição no grupo
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const calculateHealthIndicators = async (
  animalId: string,
  currentMetrics: GrowthMetrics,
  organizationId: string
): Promise<HealthIndicators> => {

  let healthScore = 100;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Fator 1: Consistência de crescimento (peso 30%)
  const consistencyScore = calculateGrowthConsistency(animalId, organizationId);
  healthScore -= (1 - consistencyScore) * 30;

  // Fator 2: Taxa de ganho de peso comparativa (peso 25%)
  const expectedGain = await getExpectedDailyGain(animalId, organizationId);
  const gainRatio = currentMetrics.dailyWeightGain / expectedGain;

  if (gainRatio < 0.5) {
    healthScore -= 25; // Ganho muito baixo
    riskLevel = 'high';
  } else if (gainRatio < 0.8) {
    healthScore -= 15; // Ganho baixo
    riskLevel = 'medium';
  }

  // Fator 3: Tendência de peso (peso 20%)
  const weightTrend = determineWeightTrend(animalId, organizationId);
  if (weightTrend === 'decreasing') {
    healthScore -= 20;
    riskLevel = 'high';
  } else if (weightTrend === 'stable') {
    healthScore -= 10;
  }

  // Fator 4: Fatores ambientais (peso 15%)
  const environmentalImpact = await assessEnvironmentalImpact(animalId, organizationId);
  healthScore -= environmentalImpact * 15;

  // Fator 5: Histórico de problemas (peso 10%)
  const healthHistory = await getHealthHistory(animalId, organizationId);
  healthScore -= healthHistory.riskFactor * 10;

  // Determinar status nutricional
  const nutritionalStatus = determineNutritionalStatus(
    healthScore,
    currentMetrics.dailyWeightGain,
    expectedGain
  );

  // Calcular ranking de performance
  const performanceRank = await calculatePerformanceRank(
    animalId,
    currentMetrics,
    organizationId
  );

  // Determinar nível de risco final
  if (healthScore < 60) riskLevel = 'critical';
  else if (healthScore < 70) riskLevel = 'high';
  else if (healthScore < 85) riskLevel = 'medium';

  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    nutritionalStatus,
    growthConsistency: consistencyScore,
    weightTrend,
    performanceRank,
    riskLevel
  };
};
```

## 🌍 Enriquecimento com Dados Externos

### Dados Meteorológicos

```typescript
interface WeatherEnrichment {
  temperature: number;              // °C
  humidity: number;                 // %
  precipitation: number;            // mm
  windSpeed: number;               // km/h
  heatIndex: number;               // °C (sensação térmica)
  stressLevel: 'none' | 'mild' | 'moderate' | 'severe';
  weatherCondition: string;        // 'sunny', 'cloudy', 'rainy', etc.
}

const enrichWithWeatherData = async (
  farmId: string,
  measurementDate: Date,
  organizationId: string
): Promise<WeatherEnrichment | null> => {

  try {
    const farm = await getFarmCoordinates(farmId, organizationId);

    if (!farm.latitude || !farm.longitude) {
      return null;
    }

    const weatherData = await weatherAPI.getHistoricalWeather({
      lat: farm.latitude,
      lon: farm.longitude,
      date: format(measurementDate, 'yyyy-MM-dd'),
      apiKey: process.env.WEATHER_API_KEY
    });

    const heatIndex = calculateHeatIndex(
      weatherData.temperature,
      weatherData.humidity
    );

    const stressLevel = determineHeatStress(heatIndex);

    return {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      precipitation: weatherData.precipitation,
      windSpeed: weatherData.windSpeed,
      heatIndex,
      stressLevel,
      weatherCondition: weatherData.condition
    };

  } catch (error) {
    console.warn('Erro ao buscar dados meteorológicos:', error);
    return null;
  }
};

const calculateHeatIndex = (temperature: number, humidity: number): number => {
  // Fórmula do Heat Index (sensação térmica)
  if (temperature < 26.7) {
    return temperature;
  }

  const T = temperature;
  const RH = humidity;

  const HI = -8.784695 +
    1.61139411 * T +
    2.33854884 * RH +
    -0.14611605 * T * RH +
    -0.012308094 * T * T +
    -0.016424828 * RH * RH +
    0.002211732 * T * T * RH +
    0.00072546 * T * RH * RH +
    -0.000003582 * T * T * RH * RH;

  return Math.round(HI * 10) / 10;
};
```

### Dados de Mercado

```typescript
interface MarketEnrichment {
  beefPrice: number;                // R$/kg
  cornPrice: number;                // R$/ton
  soybeanPrice: number;             // R$/ton
  feedCostIndex: number;            // Índice base 100
  profitabilityIndex: number;       // Margem estimada
  marketTrend: 'bullish' | 'bearish' | 'stable';
}

const enrichWithMarketData = async (
  measurementDate: Date,
  organizationId: string
): Promise<MarketEnrichment | null> => {

  try {
    // Buscar preços mais recentes próximos à data
    const marketData = await db
      .select()
      .from('market_prices')
      .where('price_date', '<=', measurementDate)
      .orderBy('price_date', 'desc')
      .limit(1)
      .first();

    if (!marketData) {
      return null;
    }

    const profitabilityIndex = calculateProfitabilityIndex(
      marketData.beef_price_per_kg,
      marketData.feed_cost_index
    );

    const marketTrend = determineMarketTrend(
      marketData.beef_price_per_kg,
      measurementDate
    );

    return {
      beefPrice: marketData.beef_price_per_kg,
      cornPrice: marketData.corn_price_per_ton,
      soybeanPrice: marketData.soybean_price_per_ton,
      feedCostIndex: marketData.feed_cost_index,
      profitabilityIndex,
      marketTrend
    };

  } catch (error) {
    console.warn('Erro ao buscar dados de mercado:', error);
    return null;
  }
};
```

## 📈 Agregações e Métricas de Grupo

### Métricas por Fazenda

```typescript
interface FarmMetrics {
  averageWeight: number;
  averageDailyGain: number;
  totalAnimals: number;
  performanceDistribution: {
    excellent: number;    // % animais com performance excelente
    good: number;         // % animais com performance boa
    average: number;      // % animais com performance média
    poor: number;         // % animais com performance ruim
  };
  healthScoreAverage: number;
  feedConversionRatio: number;
}

const calculateFarmMetrics = async (
  farmId: string,
  date: Date,
  organizationId: string
): Promise<FarmMetrics> => {

  const farmAnimals = await db
    .select([
      'animal_id',
      'weight_kg',
      'daily_weight_gain',
      'health_score',
      'performance_rank'
    ])
    .from('animal_measurements_current_view')
    .where('farm_id', farmId)
    .where('organization_id', organizationId)
    .where('measurement_date', '>=', subDays(date, 7)); // Última semana

  if (farmAnimals.length === 0) {
    return getDefaultFarmMetrics();
  }

  const averageWeight = farmAnimals.reduce(
    (sum, animal) => sum + animal.weight_kg, 0
  ) / farmAnimals.length;

  const averageDailyGain = farmAnimals.reduce(
    (sum, animal) => sum + (animal.daily_weight_gain || 0), 0
  ) / farmAnimals.length;

  const healthScoreAverage = farmAnimals.reduce(
    (sum, animal) => sum + (animal.health_score || 0), 0
  ) / farmAnimals.length;

  // Distribuição de performance
  const performanceDistribution = {
    excellent: farmAnimals.filter(a => a.performance_rank <= 10).length / farmAnimals.length * 100,
    good: farmAnimals.filter(a => a.performance_rank <= 25 && a.performance_rank > 10).length / farmAnimals.length * 100,
    average: farmAnimals.filter(a => a.performance_rank <= 75 && a.performance_rank > 25).length / farmAnimals.length * 100,
    poor: farmAnimals.filter(a => a.performance_rank > 75).length / farmAnimals.length * 100
  };

  // Calcular FCR da fazenda
  const feedConversionRatio = await calculateFarmFCR(farmId, date, organizationId);

  return {
    averageWeight,
    averageDailyGain,
    totalAnimals: farmAnimals.length,
    performanceDistribution,
    healthScoreAverage,
    feedConversionRatio
  };
};
```

### Tendências Temporais

```typescript
interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;      // 0-1, força da tendência
  r_squared: number;     // Coeficiente de determinação
  slope: number;         // Inclinação da linha de tendência
  projection: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;  // 0-1
  };
}

const analyzeTrend = (
  data: { date: Date; value: number }[],
  timeframe: 'week' | 'month' | 'quarter'
): TrendAnalysis => {

  if (data.length < 3) {
    return getDefaultTrend();
  }

  // Ordenar por data
  const sortedData = data.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Converter datas para números (dias desde primeira medição)
  const baseDate = sortedData[0].date;
  const points = sortedData.map(point => ({
    x: differenceInDays(point.date, baseDate),
    y: point.value
  }));

  // Calcular regressão linear
  const regression = calculateLinearRegression(points);

  // Determinar direção da tendência
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(regression.slope) < 0.01) {
    direction = 'stable';
  } else if (regression.slope > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }

  // Calcular força da tendência
  const strength = Math.min(1, Math.abs(regression.rSquared));

  // Fazer projeções
  const lastX = points[points.length - 1].x;
  const nextWeekProjection = regression.slope * (lastX + 7) + regression.intercept;
  const nextMonthProjection = regression.slope * (lastX + 30) + regression.intercept;

  return {
    direction,
    strength,
    r_squared: regression.rSquared,
    slope: regression.slope,
    projection: {
      nextWeek: nextWeekProjection,
      nextMonth: nextMonthProjection,
      confidence: strength
    }
  };
};
```

## 🔧 Pipeline de Transformação

### Orquestração das Transformações

```typescript
export class TransformationPipeline {
  async transformRecord(
    rawRecord: RawAnimalData,
    organizationId: string
  ): Promise<TransformedAnimalData> {

    const transformationSteps = [
      this.normalizeFields,
      this.validateAndCorrect,
      this.enrichWithContext,
      this.calculateMetrics,
      this.applyBusinessRules,
      this.generateAggregations
    ];

    let transformedRecord = { ...rawRecord } as any;

    for (const step of transformationSteps) {
      try {
        transformedRecord = await step.call(this, transformedRecord, organizationId);
      } catch (error) {
        // Log erro e enviar para DLQ se crítico
        await this.handleTransformationError(error, transformedRecord, step.name);

        if (this.isCriticalError(error)) {
          throw error;
        }
      }
    }

    return transformedRecord;
  }

  private async normalizeFields(
    record: any,
    organizationId: string
  ): Promise<any> {
    return {
      ...record,
      animal_id: normalizeAnimalId(record.animal_id),
      weight_kg: convertWeight(record.weight_kg, record.weight_unit, record.source_header),
      measurement_date: normalizeDateString(record.measurement_date),
      farm_id: record.farm_id?.trim().toUpperCase(),
      operator_id: record.operator_id?.trim()
    };
  }

  private async enrichWithContext(
    record: any,
    organizationId: string
  ): Promise<any> {
    const [weatherData, marketData, temporalData] = await Promise.all([
      enrichWithWeatherData(record.farm_id, record.measurement_date, organizationId),
      enrichWithMarketData(record.measurement_date, organizationId),
      enrichTemporalData(record.measurement_date, organizationId)
    ]);

    return {
      ...record,
      weather_data: weatherData,
      market_data: marketData,
      temporal_data: temporalData
    };
  }

  private async calculateMetrics(
    record: any,
    organizationId: string
  ): Promise<any> {
    const [growthMetrics, healthIndicators] = await Promise.all([
      calculateGrowthMetrics(
        record.animal_id,
        record.weight_kg,
        record.measurement_date,
        organizationId
      ),
      calculateHealthIndicators(
        record.animal_id,
        record.weight_kg,
        organizationId
      )
    ]);

    return {
      ...record,
      growth_metrics: growthMetrics,
      health_indicators: healthIndicators
    };
  }
}
```

---

**Documento Anterior**: [Regras de Validação](validation-rules.md)
**Próximo Documento**: [Scripts de Manutenção](../maintenance/sql-scripts.md)