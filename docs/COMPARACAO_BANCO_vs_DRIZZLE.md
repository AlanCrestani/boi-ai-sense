# 🔍 COMPARAÇÃO: BANCO REAL vs. DRIZZLE SCHEMAS

*Análise Comparativa - 18/09/2025*

## 🎯 RESUMO EXECUTIVO

**ALERTA**: Há **diferenças significativas** entre o schema real do banco e as definições do Drizzle. O banco real está mais avançado e possui estruturas que não existem no Drizzle.

---

## 📊 ANÁLISE TABELA POR TABELA

### ✅ **TABELAS QUE EXISTEM EM AMBOS**

| Conceito | Banco Real | Drizzle ORM | Status |
|----------|------------|-------------|---------|
| Sistema ETL | 5 tabelas avançadas | 3 tabelas básicas | ❌ **DIVERGENTE** |
| Staging 02 | `staging_02_desvio_carregamento` | `etl_staging_02_desvio_carregamento` | ❌ **NOMES DIFERENTES** |
| Staging 04 | `staging_04_itens_trato` | `etl_staging_04_trato_curral` | ❌ **NOMES DIFERENTES** |
| Tabela Fatos | `fato_carregamento` | `fato_desvio_carregamento` + `fato_trato_curral` | ❌ **ESTRUTURAS DIFERENTES** |

---

## 🔴 **DIVERGÊNCIAS CRÍTICAS**

### **1. SISTEMA ETL - COMPLETAMENTE DIFERENTE**

#### **BANCO REAL** (5 tabelas com state machine):
```sql
- etl_file (TEXT id, state machine avançada, locking)
- etl_run (TEXT id, state machine, retry logic)
- etl_run_log (logging detalhado)
- etl_dead_letter_queue (fila de falhas)
- etl_reprocessing_log (reprocessamento)
```

#### **DRIZZLE** (3 tabelas básicas):
```typescript
- etlFile (UUID fileId, status simples)
- etlRun (UUID runId, status simples) 
- etlRunLog (serial logId, log básico)
```

**🚨 PROBLEMAS:**
- Drizzle usa `UUID` como PK, banco real usa `TEXT`
- Banco real tem **state machine complexa**, Drizzle tem status simples
- Banco real tem **locking mechanism**, Drizzle não
- Banco real tem **retry logic**, Drizzle não
- Banco real tem **2 tabelas extras** (dead letter queue + reprocessing)

### **2. STAGING TABLES - NOMES E ESTRUTURAS DIFERENTES**

#### **STAGING 02 - DESVIO CARREGAMENTO**

**BANCO REAL:**
```sql
staging_02_desvio_carregamento (
  id UUID,
  organization_id UUID,
  file_id UUID,
  data TEXT,           -- ❌ Drizzle: dataRef DATE
  hora TEXT,           -- ❌ Não existe no Drizzle
  pazeiro TEXT,        -- ❌ Drizzle: trateiro
  vagao TEXT,          -- ❌ Drizzle: equipamento
  dieta TEXT,          -- ❌ Drizzle: dietaNome
  nro_carregamento TEXT, -- ❌ Não existe no Drizzle
  ingrediente TEXT,    -- ❌ Não existe no Drizzle
  tipo_ingrediente TEXT, -- ❌ Não existe no Drizzle
  realizado_kg NUMERIC, -- ❌ Drizzle: kgReal
  previsto_kg NUMERIC, -- ❌ Drizzle: kgPlanejado
  desvio_kg NUMERIC,   -- ✅ Drizzle: desvioKg
  desvio_pc NUMERIC,   -- ✅ Drizzle: desvioPct
  status TEXT,         -- ❌ Não existe no Drizzle
  merge TEXT           -- ❌ Drizzle: naturalKey
)
```

**DRIZZLE:**
```typescript
etl_staging_02_desvio_carregamento (
  staging_id UUID,
  organization_id UUID,
  file_id UUID,
  raw_data JSONB,      -- ❌ Banco não tem
  data_ref DATE,       -- ❌ Banco: data TEXT
  turno TEXT,          -- ❌ Banco não tem
  equipamento TEXT,    -- ❌ Banco: vagao
  curral_codigo TEXT,  -- ❌ Banco não tem
  dieta_nome TEXT,     -- ❌ Banco: dieta
  kg_planejado NUMERIC, -- ❌ Banco: previsto_kg
  kg_real NUMERIC,     -- ❌ Banco: realizado_kg
  desvio_kg NUMERIC,   -- ✅ 
  desvio_pct NUMERIC,  -- ✅
  natural_key TEXT     -- ❌ Banco: merge
)
```

#### **STAGING 04 - ITENS TRATO**

**BANCO REAL:**
```sql
staging_04_itens_trato (
  id UUID,
  organization_id UUID,
  file_id UUID,
  data TEXT,
  id_carregamento_original TEXT, -- ❌ Não existe no Drizzle
  hora TEXT,                     -- ❌ Drizzle: horaTrato
  dieta TEXT,                    -- ❌ Drizzle: dietaNome
  carregamento TEXT,             -- ❌ Não existe no Drizzle
  ingrediente TEXT,              -- ❌ Não existe no Drizzle
  realizado_kg NUMERIC,          -- ❌ Drizzle: quantidadeKg
  pazeiro TEXT,                  -- ❌ Drizzle: trateiro
  vagao TEXT,                    -- ❌ Drizzle: curralCodigo
  ms_dieta_pc NUMERIC,           -- ❌ Não existe no Drizzle
  ndt_dieta_pc NUMERIC,          -- ❌ Não existe no Drizzle
  merge TEXT                     -- ❌ Drizzle: naturalKey
)
```

**DRIZZLE:**
```typescript
etl_staging_04_trato_curral (
  staging_id UUID,
  organization_id UUID,
  file_id UUID,
  raw_data JSONB,        -- ❌ Banco não tem
  data_ref DATE,         -- ❌ Banco: data TEXT
  hora_trato TEXT,       -- ❌ Banco: hora
  curral_codigo TEXT,    -- ❌ Banco: vagao
  trateiro TEXT,         -- ❌ Banco: pazeiro
  dieta_nome TEXT,       -- ❌ Banco: dieta
  quantidade_kg NUMERIC, -- ❌ Banco: realizado_kg
  observacoes TEXT,      -- ❌ Banco não tem
  natural_key TEXT       -- ❌ Banco: merge
)
```

### **3. TABELAS FATO - ESTRUTURAS INCOMPATÍVEIS**

#### **BANCO REAL:**
```sql
fato_carregamento (
  id UUID,
  organization_id UUID,
  file_id UUID,
  -- Campos diretos (não normalizados)
  data TEXT,
  hora TEXT,
  pazeiro TEXT,
  vagao TEXT,
  dieta TEXT,
  nro_carregamento TEXT,
  ingrediente TEXT,
  tipo_ingrediente TEXT,
  realizado_kg NUMERIC,
  previsto_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  merge TEXT,
  id_carregamento_original TEXT
)
```

#### **DRIZZLE:**
```typescript
// Duas tabelas separadas e normalizadas
fato_desvio_carregamento (
  distrib_id UUID,
  organization_id UUID,
  data_ref DATE,
  -- FKs para dimensões
  curral_id UUID → dim_curral,
  dieta_id UUID → dim_dieta,
  equipamento_id UUID → dim_equipamento,
  kg_planejado NUMERIC,
  kg_real NUMERIC,
  desvio_kg NUMERIC,
  desvio_pct NUMERIC
)

fato_trato_curral (
  trato_id UUID,
  organization_id UUID,
  data_ref DATE,
  -- FKs para dimensões
  curral_id UUID → dim_curral,
  dieta_id UUID → dim_dieta,
  trateiro TEXT,
  quantidade_kg NUMERIC
)
```

---

## 🔴 **TABELAS QUE EXISTEM APENAS NO BANCO REAL**

| Tabela | Descrição | Status no Drizzle |
|--------|-----------|-------------------|
| `organizations` | Sistema core | ❌ **AUSENTE** |
| `profiles` | Perfis de usuário | ❌ **AUSENTE** |
| `user_roles` | Permissões | ❌ **AUSENTE** |
| `invitations` | Sistema de convites | ❌ **AUSENTE** |
| `etl_dead_letter_queue` | Fila de falhas | ❌ **AUSENTE** |
| `etl_reprocessing_log` | Log de reprocessamento | ❌ **AUSENTE** |
| `staging_csv_raw` | CSV bruto | ❌ **AUSENTE** |
| `staging_csv_processed` | CSV processado | ❌ **AUSENTE** |
| `staging_livestock_data` | Dados de gado | ❌ **AUSENTE** |

---

## 🟡 **TABELAS QUE EXISTEM APENAS NO DRIZZLE**

| Tabela | Descrição | Status no Banco |
|--------|-----------|-----------------|
| `dim_curral` | Dimensão curral | ❌ **AUSENTE** |
| `dim_dieta` | Dimensão dieta | ❌ **AUSENTE** |
| `dim_equipamento` | Dimensão equipamento | ❌ **AUSENTE** |
| `fato_desvio_carregamento` | Fato normalizado | ❌ **AUSENTE** |
| `fato_trato_curral` | Fato normalizado | ❌ **AUSENTE** |

---

## 🎯 **CONCLUSÕES E RECOMENDAÇÕES**

### **🚨 PROBLEMAS CRÍTICOS:**

1. **Incompatibilidade Total**: Drizzle e banco real são **incompatíveis**
2. **Nomes Diferentes**: Staging tables têm nomes completamente diferentes
3. **Estruturas Diferentes**: Campos têm nomes e tipos diferentes
4. **Arquitetura Diferentes**: 
   - Banco real: **denormalizado, direto**
   - Drizzle: **normalizado, dimensional**

### **📋 AÇÕES NECESSÁRIAS:**

#### **OPÇÃO 1: Atualizar Drizzle para corresponder ao banco real**
```typescript
// Criar novos schemas que espelhem exatamente o banco real
- Renomear tabelas staging
- Ajustar nomes de campos  
- Remover dimensões (não existem)
- Adicionar tabelas ausentes (organizations, profiles, etc)
- Ajustar sistema ETL para corresponder ao real
```

#### **OPÇÃO 2: Migrar banco para corresponder ao Drizzle**
```sql
-- Criar migrações para:
- Renomear tabelas staging
- Adicionar tabelas de dimensões
- Criar tabelas fato normalizadas
- Migrar dados existentes
- Ajustar aplicação
```

### **💡 RECOMENDAÇÃO:**

**Atualizar o Drizzle** (Opção 1) é mais seguro pois:
- Não quebra o banco em produção
- Mantém dados existentes intactos
- Permite validação gradual
- Menor risco de perda de dados

Quer que eu gere os novos schemas do Drizzle correspondentes ao banco real?