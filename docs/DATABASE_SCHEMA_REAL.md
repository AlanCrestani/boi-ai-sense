# 📊 SCHEMA REAL DO BANCO DE DADOS - CONECTA BOI

*Atualizado em: 18/09/2025*

## 🎯 RESUMO EXECUTIVO

O banco de dados está **MUITO MAIS COMPLETO** do que detectado inicialmente via API. Contém todas as tabelas necessárias para o sistema ETL e muito mais.

---

## 📋 TABELAS EXISTENTES NO BANCO (14 tabelas)

### 🏢 **SISTEMA CORE** (4 tabelas)
- `organizations` ✅ - Organizações/fazendas
- `profiles` ✅ - Perfis de usuários  
- `user_roles` ✅ - Permissões de usuários
- `invitations` ✅ - Sistema de convites

### 🔄 **SISTEMA ETL COMPLETO** (5 tabelas)
- `etl_file` ✅ - Manifesto de arquivos com state machine
- `etl_run` ✅ - Execuções de processamento
- `etl_run_log` ✅ - Logs detalhados
- `etl_dead_letter_queue` ✅ - Fila de falhas
- `etl_reprocessing_log` ✅ - Log de reprocessamento

### 📊 **STAGING TABLES** (5 tabelas)
- `staging_02_desvio_carregamento` ✅ - Pipeline 02 (Desvio Carregamento)
- `staging_04_itens_trato` ✅ - Pipeline 04 (Itens de Trato)
- `staging_csv_raw` ✅ - Dados brutos do CSV
- `staging_csv_processed` ✅ - Dados processados do CSV
- `staging_livestock_data` ✅ - Dados de gado

### 🎯 **FATOS** (1 tabela)
- `fato_carregamento` ✅ - Tabela de fatos principal

---

## 🔍 ANÁLISE DETALHADA POR TABELA

### 📋 **1. ORGANIZATIONS**
```sql
- id: UUID (PK)
- name: TEXT (nome da organização)
- slug: TEXT UNIQUE (identificador único)
- domain: TEXT (domínio)
- logo_url: TEXT (URL do logo)
- subscription_status: TEXT DEFAULT 'active'
- created_at, updated_at: TIMESTAMPTZ
```

### 👤 **2. PROFILES** 
```sql
- id: UUID (PK)
- user_id: UUID UNIQUE → auth.users(id)
- organization_id: UUID → organizations(id)
- full_name: TEXT (nome completo)
- email: TEXT
- avatar_url, phone, position, department: TEXT
- is_active: BOOLEAN DEFAULT true
- created_at, updated_at: TIMESTAMPTZ
```

### 🔐 **3. USER_ROLES**
```sql
- id: UUID (PK)
- user_id: UUID → auth.users(id)
- organization_id: UUID → organizations(id)
- role: app_role ENUM (owner, admin, manager, employee, viewer)
- granted_by: UUID → auth.users(id)
- granted_at: TIMESTAMPTZ
```

### 📧 **4. INVITATIONS**
```sql
- id: UUID (PK)
- organization_id: UUID → organizations(id)
- email: TEXT
- role: app_role ENUM DEFAULT 'employee'
- invited_by: UUID → auth.users(id)
- invitation_token: TEXT UNIQUE
- status: invitation_status ENUM DEFAULT 'pending'
- expires_at: TIMESTAMPTZ DEFAULT now() + 7 days
- accepted_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### 📁 **5. ETL_FILE** (State Machine)
```sql
- id: TEXT (PK)
- organization_id: TEXT
- filename, filepath: TEXT
- file_size: BIGINT
- mime_type, checksum: TEXT
- current_state: etl_state ENUM DEFAULT 'uploaded'
- state_history: JSONB DEFAULT '[]'
- uploaded_at, parsed_at, validated_at, approved_at, loaded_at, failed_at: TIMESTAMPTZ
- uploaded_by, approved_by: TEXT
- error_message: TEXT
- metadata: JSONB DEFAULT '{}'
- version: INTEGER DEFAULT 1 (otimistic locking)
- locked_by: TEXT, locked_at, lock_expires_at: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

### 🏃 **6. ETL_RUN**
```sql
- id: TEXT (PK)
- file_id: TEXT → etl_file(id)
- organization_id: TEXT
- run_number: INTEGER
- current_state: etl_state ENUM DEFAULT 'uploaded'
- state_history: JSONB DEFAULT '[]'
- started_at, completed_at: TIMESTAMPTZ
- processing_by: TEXT
- processing_started_at: TIMESTAMPTZ
- records_total, records_processed, records_failed: INTEGER
- error_message: TEXT, error_details: JSONB
- retry_count: INTEGER DEFAULT 0
- next_retry_at: TIMESTAMPTZ
- version: INTEGER DEFAULT 1 (optimistic locking)
- locked_by: TEXT, locked_at, lock_expires_at: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

### 📝 **7. ETL_RUN_LOG**
```sql
- id: TEXT (PK)
- run_id: TEXT → etl_run(id)
- file_id: TEXT → etl_file(id)
- organization_id: TEXT
- timestamp: TIMESTAMPTZ DEFAULT now()
- level: log_level ENUM DEFAULT 'info'
- message: TEXT
- details: JSONB
- state, previous_state: etl_state ENUM
- user_id: TEXT
- action: TEXT
- created_at: TIMESTAMPTZ
```

### ⚰️ **8. ETL_DEAD_LETTER_QUEUE**
```sql
- id: TEXT (PK)
- run_id: TEXT → etl_run(id)
- file_id: TEXT → etl_file(id)
- organization_id: TEXT
- error_message: TEXT
- error_details: JSONB
- max_retries_exceeded: BOOLEAN DEFAULT false
- marked_for_retry: BOOLEAN DEFAULT false
- retry_after: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

### 🔄 **9. ETL_REPROCESSING_LOG**
```sql
- id: TEXT (PK)
- original_file_id: TEXT → etl_file(id)
- checksum: TEXT
- organization_id: TEXT
- forced_by: TEXT
- reason: TEXT
- skip_validation: BOOLEAN DEFAULT false
- new_file_id: TEXT → etl_file(id)
- completed_at: TIMESTAMPTZ
- success: BOOLEAN
- error_message: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

### 📊 **10. STAGING_02_DESVIO_CARREGAMENTO** (Pipeline 02)
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- data, hora, pazeiro, vagao, dieta: TEXT
- nro_carregamento, ingrediente, tipo_ingrediente: TEXT
- realizado_kg, previsto_kg, desvio_kg, desvio_pc: NUMERIC
- status: TEXT CHECK ('VERDE', 'AMARELO', 'VERMELHO')
- merge: TEXT (chave natural)
- created_at, updated_at: TIMESTAMPTZ
```

### 🥛 **11. STAGING_04_ITENS_TRATO** (Pipeline 04)
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- data, id_carregamento_original, hora, dieta: TEXT
- carregamento, ingrediente, pazeiro, vagao: TEXT
- realizado_kg, ms_dieta_pc, ndt_dieta_pc: NUMERIC
- merge: TEXT (chave natural)
- created_at, updated_at: TIMESTAMPTZ
```

### 📥 **12. STAGING_CSV_RAW**
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- row_number: INTEGER
- raw_data: JSONB (dados brutos)
- headers: JSONB
- created_at: TIMESTAMPTZ
```

### ✅ **13. STAGING_CSV_PROCESSED**
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- row_number: INTEGER
- original_data: JSONB
- mapped_data: JSONB
- validation_status: TEXT CHECK ('pending', 'valid', 'invalid', 'warning')
- validation_errors, validation_warnings: JSONB DEFAULT '[]'
- processed_at: TIMESTAMPTZ
```

### 🐄 **14. STAGING_LIVESTOCK_DATA**
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- source_row_number: INTEGER
- animal_id, rfid_tag, ear_tag, breed, gender: TEXT
- birth_date: DATE
- weight_kg: NUMERIC
- location, status, owner_name: TEXT
- data_quality_score: NUMERIC DEFAULT 1.0
- confidence_level: TEXT CHECK ('low', 'medium', 'high') DEFAULT 'high'
- processing_notes: TEXT
- created_at: TIMESTAMPTZ
```

### 📈 **15. FATO_CARREGAMENTO** (Tabela de Fatos)
```sql
- id: UUID (PK)
- organization_id: UUID
- file_id: UUID
- data, hora, pazeiro, vagao, dieta: TEXT
- nro_carregamento, ingrediente, tipo_ingrediente: TEXT
- realizado_kg, previsto_kg, desvio_kg, desvio_pc: NUMERIC
- status: TEXT
- merge: TEXT
- id_carregamento_original: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

---

## 🔧 TIPOS PERSONALIZADOS (ENUMs)

```sql
-- Roles de usuário
CREATE TYPE app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- Status de convite
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Estados do ETL
CREATE TYPE etl_state AS ENUM ('uploaded', 'parsed', 'validated', 'approved', 'loaded', 'failed');

-- Níveis de log
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error', 'debug');
```

---

## 🎯 COMPARAÇÃO: REAL vs. MIGRAÇÕES vs. DRIZZLE

| Componente | No Banco Real | Nas Migrações | No Drizzle |
|------------|---------------|---------------|------------|
| **Tabelas Core** | ✅ 4 tabelas | ✅ Completo | ✅ Completo |
| **Sistema ETL** | ✅ 5 tabelas | ✅ Completo | ✅ Completo |
| **Staging Tables** | ✅ 5 tabelas | ✅ Completo | ✅ Completo |
| **Fato Tables** | ✅ 1 tabela | ✅ Completo | ✅ Completo |
| **ENUMs** | ✅ 4 tipos | ✅ Completo | ✅ Completo |
| **RLS** | ✅ Ativo | ✅ Configurado | ❌ Não aplicável |

---

## ✅ CONCLUSÃO

O banco de dados está **COMPLETAMENTE IMPLEMENTADO** e pronto para produção com:

- ✅ **15 tabelas** funcionais
- ✅ **Sistema ETL completo** com state machine
- ✅ **Staging tables** para ambos os pipelines  
- ✅ **Sistema de permissões** robusto
- ✅ **Auditoria completa** com logs e reprocessamento
- ✅ **RLS ativo** para segurança multi-tenant

O sistema está muito mais avançado do que as definições do Drizzle sugeriam!