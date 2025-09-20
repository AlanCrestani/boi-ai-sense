# Instruções para Criar a Tabela fato_distribuicao

## 🎯 Objetivo
Criar a tabela `fato_distribuicao` no Supabase com todas as colunas especificadas.

## 📋 Passos para Executar

### 1. Acesse o Console do Supabase
1. Vá para: https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"New Query"**

### 2. Execute o SQL Abaixo
Copie e cole o seguinte SQL no editor e clique **"Run"**:

```sql
CREATE TABLE IF NOT EXISTS fato_distribuicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  file_id UUID NOT NULL,
  data TEXT,
  hora TEXT,
  vagao TEXT,
  curral TEXT,
  trato TEXT,
  tratador TEXT,
  dieta TEXT,
  realizado_kg NUMERIC,
  previsto_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  merge TEXT,
  id_carregamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_org_data
  ON fato_distribuicao (organization_id, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_merge
  ON fato_distribuicao (merge);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_curral_data
  ON fato_distribuicao (organization_id, curral, data);

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_id_carregamento
  ON fato_distribuicao (id_carregamento) WHERE id_carregamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fato_distribuicao_status
  ON fato_distribuicao (organization_id, status);

-- Row Level Security
ALTER TABLE fato_distribuicao ENABLE ROW LEVEL SECURITY;

-- Policy para isolamento por organização
DROP POLICY IF EXISTS "fato_distribuicao_isolation" ON fato_distribuicao;
CREATE POLICY "fato_distribuicao_isolation" ON fato_distribuicao
  USING (organization_id = (SELECT auth.uid()::text::uuid));

-- Policy para permitir INSERT/UPDATE/DELETE para usuários autenticados
DROP POLICY IF EXISTS "fato_distribuicao_crud" ON fato_distribuicao;
CREATE POLICY "fato_distribuicao_crud" ON fato_distribuicao
  FOR ALL
  TO authenticated
  USING (organization_id = (SELECT auth.uid()::text::uuid))
  WITH CHECK (organization_id = (SELECT auth.uid()::text::uuid));
```

### 3. Verificar Criação
Execute esta query para verificar se a tabela foi criada:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'fato_distribuicao'
ORDER BY ordinal_position;
```

## ✅ Resultado Esperado
Você deve ver as seguintes colunas:
- `id` (uuid)
- `organization_id` (uuid)
- `file_id` (uuid)
- `data` (text)
- `hora` (text)
- `vagao` (text)
- `curral` (text)
- `trato` (text)
- `tratador` (text)
- `dieta` (text)
- `realizado_kg` (numeric)
- `previsto_kg` (numeric)
- `desvio_kg` (numeric)
- `desvio_pc` (numeric)
- `status` (text)
- `merge` (text)
- `id_carregamento` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

## 🚀 Após Criação
Depois que a tabela for criada com sucesso, você pode testar a edge function:

```bash
curl -X POST 'https://zirowpnlxjenkxiqcuwz.supabase.co/functions/v1/process-fato-distribuicao' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"organizationId": "b7a05c98-9fc5-4aef-b92f-bfa0586bf495"}'
```

## 📁 Arquivos Relacionados
- Migration: `supabase/migrations/20250920_create_fato_distribuicao.sql`
- Edge Function: `supabase/functions/process-fato-distribuicao/index.ts`
- SQL Direto: `create_table_via_rpc.sql`