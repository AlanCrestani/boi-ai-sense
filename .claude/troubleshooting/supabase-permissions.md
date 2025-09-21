# Troubleshooting Guide - Supabase Views e Permissões RLS

## Problema Comum: Views Retornando Dados Vazios

### Sintomas
- View criada com sucesso
- GRANT SELECT executado na view
- Query retorna array vazio mesmo com dados existentes
- Nenhum erro explícito de permissão

### Causa Raiz
Views herdam permissões RLS das tabelas base. Mesmo com GRANT na view, se a tabela subjacente tem RLS restritivo, a view não retorna dados.

### Diagnóstico
1. Testar query na view sem filtros:
```sql
SELECT * FROM view_name LIMIT 5;
```

2. Testar query na tabela base:
```sql
SELECT * FROM base_table LIMIT 5;
```

3. Verificar políticas RLS da tabela base:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'nome_da_tabela';
```

### Solução
Criar política RLS adicional na tabela base para usuários autenticados:

```sql
CREATE POLICY "nome_tabela_authenticated_access"
ON nome_da_tabela
FOR SELECT TO authenticated
USING (true);
```

### Aplicar Migração
```bash
SUPABASE_ACCESS_TOKEN=sbp_token npx supabase db push --file migration.sql
```

## Padrão de Implementação de Views

### 1. Criar a View
```sql
CREATE OR REPLACE VIEW view_name AS
SELECT
  campo1,
  campo2,
  organization_id
FROM tabela_base
WHERE condicoes;
```

### 2. Conceder Permissões na View
```sql
GRANT SELECT ON view_name TO anon, authenticated;
```

### 3. Verificar RLS na Tabela Base
```sql
-- Se necessário, adicionar política para authenticated users
CREATE POLICY "tabela_base_authenticated_access"
ON tabela_base
FOR SELECT TO authenticated
USING (true);
```

### 4. Testar Acesso
```javascript
const { data, error } = await supabase
  .from('view_name')
  .select('*')
  .eq('organization_id', orgId);
```

## Debugging Steps

1. **Verificar se view existe**: Query direct no Supabase
2. **Testar sem filtros**: Remover WHERE temporariamente
3. **Verificar RLS da tabela base**: Listar políticas existentes
4. **Adicionar política para authenticated**: Usar padrão acima
5. **Reprocessar permissões**: Executar migration
6. **Testar novamente**: Validar no frontend

## Comandos Úteis

```bash
# Verificar estrutura da view
SUPABASE_ACCESS_TOKEN=token npx @supabase/mcp-server-supabase execute-sql "\\d+ view_name"

# Listar políticas RLS
SUPABASE_ACCESS_TOKEN=token npx @supabase/mcp-server-supabase execute-sql "SELECT * FROM pg_policies WHERE tablename = 'table_name'"

# Testar query direta
SUPABASE_ACCESS_TOKEN=token npx @supabase/mcp-server-supabase execute-sql "SELECT COUNT(*) FROM view_name"
```

---
*Documento criado em 20/09/2025 - Consolidação dos problemas encontrados durante implementação da view_dieta_resumo*