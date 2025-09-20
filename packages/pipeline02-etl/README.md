# Pipeline 02 ETL - Desvio de Carregamento

Pipeline ETL especializado para processamento de dados de Desvio de Carregamento (Pipeline 02) no sistema Conecta Boi.

## 🎯 Objetivo

Este pipeline processa dados CSV de desvio de carregamento de ração, aplicando validações de negócio, limpeza de dados e cálculos de desvio antes de inserir/atualizar na tabela fato `fato_desvio_carregamento`.

## 📋 Funcionalidades

### ✅ Validação de Dados
- **Equipamentos válidos**: Apenas BAHMAN e SILOKING
- **Datas**: Rejeita datas futuras, suporte a formato brasileiro DD/MM/YYYY
- **Valores numéricos**: Rejeita valores negativos, suporte a formato brasileiro (vírgula decimal)
- **Campos obrigatórios**: Validação de campos essenciais

### 🧹 Limpeza de Dados
- **Normalização de equipamentos**: BAHMANN → BAHMAN, SILO KING → SILOKING
- **Formatação de datas**: DD/MM/YYYY → Date
- **Formatação numérica**: 1.250,50 → 1250.5
- **Limpeza de texto**: Trim, normalização de caracteres

### 📊 Cálculos de Negócio
- **Desvio em KG**: kg_real - kg_planejado
- **Desvio percentual**: (desvio_kg / kg_planejado) × 100
- **Chave natural**: Geração automática para operações idempotentes

### 🔄 UPSERT Idempotente
- **Detecção de mudanças**: Compara dados existentes antes de atualizar
- **Estratégias múltiplas**: Single record, batch, PostgreSQL nativo
- **Lookup de dimensões**: Integração com tabelas de dimensão

## 🚀 Uso Rápido

```typescript
import { processDesvioCarregamentoCSV } from '@conecta-boi/pipeline02-etl';

const result = await processDesvioCarregamentoCSV(
  csvContent,
  'org-123',
  'file-456',
  'postgresql://localhost:5432/db',
  {
    batchSize: 1000,
    skipValidation: false,
    environment: 'production'
  }
);

console.log(`Processadas: ${result.totalRows} linhas`);
console.log(`Válidas: ${result.validRows}, Inválidas: ${result.invalidRows}`);
```

## 🔧 Uso Avançado

```typescript
import {
  Pipeline02ETLProcessor,
  Pipeline02BusinessValidator,
  Pipeline02DataCleanser,
  createPipeline02Config,
  PIPELINE02_PRESETS
} from '@conecta-boi/pipeline02-etl';

// Configuração personalizada
const config = createPipeline02Config('production', {
  processing: {
    batchSize: 5000,
    maxRetries: 3
  },
  validation: {
    strictMode: true,
    maxDeviationPercent: 50
  }
});

// Ou usar preset
const processor = new Pipeline02ETLProcessor({
  ...PIPELINE02_PRESETS.HIGH_THROUGHPUT,
  connectionString: process.env.DATABASE_URL,
  organizationId: 'org-123',
  fileId: 'file-456'
});

const result = await processor.processCSVFile(csvContent);
```

## 📊 Formato CSV Esperado

```csv
Data,Turno,Equipamento,Curral,Dieta,Kg Planejado,Kg Real
15/01/2024,MANHÃ,BAHMAN,CUR-001,Dieta A,"1.000,50","980,25"
15/01/2024,TARDE,SILOKING,CUR-002,Dieta B,"1.500,00","1.520,75"
16/01/2024,MANHÃ,BAHMAN,CUR-003,,"850,25","830,00"
```

### Campos Obrigatórios
- **Data**: DD/MM/YYYY (não pode ser futura)
- **Turno**: MANHÃ, TARDE, NOITE
- **Equipamento**: BAHMAN ou SILOKING
- **Curral**: Código do curral
- **Kg Planejado**: Valor numérico positivo
- **Kg Real**: Valor numérico positivo

### Campos Opcionais
- **Dieta**: Nome da dieta (pode ser vazio)

## 🏗️ Arquitetura

### Componentes Principais

```
Pipeline02ETLProcessor
├── Pipeline02DataCleanser          # Limpeza e normalização
├── Pipeline02BusinessValidator     # Validação de regras de negócio
├── FactTableUpsertService          # Operações UPSERT idempotentes
└── DimensionLookupService          # Lookup de IDs de dimensão
```

### Fluxo de Processamento

1. **Parse CSV** → Headers e linhas
2. **Limpeza** → Normalização de dados
3. **Validação** → Regras de negócio
4. **Cálculos** → Desvios e chave natural
5. **Staging** → Inserção na tabela de staging
6. **UPSERT** → Inserção/atualização idempotente na tabela fato

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
DATABASE_URL=postgresql://localhost:5432/conectaboi
NODE_ENV=production
```

### Configurações por Ambiente

- **Development**: Batch size 100, logging habilitado, validação flexível
- **Testing**: Batch size 10, logging desabilitado, validação relaxada
- **Staging**: Batch size 500, validação rigorosa
- **Production**: Batch size 2000, paralelização habilitada, validação rigorosa

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm run test:business-rules
npm run test:data-cleanser
npm run test:upsert-logic
npm run test:deviation-calculations
```

### Cobertura de Testes

- ✅ **Business Rules**: 8 testes (validação, cálculos, chave natural)
- ✅ **Data Cleanser**: 7 testes (limpeza, normalização, formatação)
- ✅ **UPSERT Logic**: 7 testes (inserção, atualização, skip, batch)
- ✅ **Deviation Calculations**: 8 testes (cálculos, precisão, formatos)

## 📈 Performance

### Benchmarks

- **Throughput**: ~1000 linhas/segundo (modo padrão)
- **Throughput Alto**: ~2000+ linhas/segundo (preset HIGH_THROUGHPUT)
- **Memória**: ~50MB para 10.000 linhas (batch size 1000)

### Otimizações

- **Batch Processing**: Processa em lotes para reduzir overhead
- **Connection Pooling**: Reutilização de conexões de banco
- **Validação Eficiente**: Zod v3.x para validação rápida
- **UPSERT Nativo**: PostgreSQL ON CONFLICT para máxima performance

## 🔗 Integração

### Sistema Principal

```typescript
// Em um Supabase Edge Function
import { processDesvioCarregamentoCSV } from '@conecta-boi/pipeline02-etl';

export default async function handler(req: Request) {
  const { csvContent, organizationId, fileId } = await req.json();

  const result = await processDesvioCarregamentoCSV(
    csvContent,
    organizationId,
    fileId,
    Deno.env.get('DATABASE_URL')!,
    { environment: 'production' }
  );

  return new Response(JSON.stringify(result));
}
```

### Monitoramento

```typescript
const result = await processor.processCSVFile(csvContent);

// Log de sucesso
console.log(`ETL Pipeline 02 - Sucesso: ${result.success}`);
console.log(`Processadas: ${result.totalRows} linhas em ${result.duration}ms`);
console.log(`Taxa de sucesso: ${(result.validRows/result.totalRows*100).toFixed(1)}%`);

// Alertas para alta taxa de erro
if (result.invalidRows / result.totalRows > 0.1) {
  console.warn(`Alta taxa de erro: ${(result.invalidRows/result.totalRows*100).toFixed(1)}%`);
}
```

## 🚨 Tratamento de Erros

### Categorias de Erros

- **Parsing**: Problemas na estrutura do CSV
- **Cleansing**: Dados que não puderam ser limpos
- **Validation**: Violação de regras de negócio
- **Staging**: Falhas na inserção em staging
- **Fact Table**: Falhas no UPSERT da tabela fato

### Estratégias de Recuperação

- **Retry Automático**: Até 3 tentativas para erros temporários
- **Rollback**: Transações são revertidas em caso de falha
- **Logging Detalhado**: Logs estruturados para debugging
- **Graceful Degradation**: Processamento continua mesmo com erros individuais

## 📚 Exemplos Completos

Ver arquivos na pasta `src/examples/`:
- `pipeline-usage.ts`: Uso básico e demonstrações
- `error-handling.ts`: Tratamento de erros
- `performance.ts`: Testes de performance

## 🔍 Debugging

### Logs Detalhados

```typescript
const processor = new Pipeline02ETLProcessor({
  // ... config
  enableLogging: true
});

// Logs automáticos em cada etapa
// [INFO] ETL_START: Iniciando processamento ETL Pipeline 02
// [INFO] CSV_PARSED: CSV processado: 1000 linhas
// [INFO] BATCH_PROCESSED: Batch processado: 1-100
// [INFO] FACT_UPSERT: Record updated
// [INFO] ETL_COMPLETE: Processamento ETL concluído
```

### Análise de Erros

```typescript
if (!result.success) {
  console.log('Análise de Erros:');

  const errorsByStage = result.errors.reduce((acc, error) => {
    acc[error.stage] = (acc[error.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.table(errorsByStage);
}
```

## 🛠️ Desenvolvimento

### Setup Local

```bash
cd packages/pipeline02-etl
npm install
npm run build
npm test
```

### Estrutura de Arquivos

```
src/
├── validators/           # Validação e limpeza de dados
│   ├── business-rules.ts
│   └── data-cleanser.ts
├── services/            # Serviços de negócio
│   ├── upsert-strategy.ts
│   └── dimension-lookup.ts
├── config/              # Configurações
│   └── pipeline-config.ts
├── test/                # Testes unitários
├── examples/            # Exemplos de uso
└── index.ts            # Ponto de entrada principal
```

## 📄 Licença

MIT - Ver LICENSE file para detalhes.