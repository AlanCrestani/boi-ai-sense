# Fluxo de Autenticação - Conecta Boi

## 📝 Cadastro (Sign Up)

### 1. Formulário de Cadastro (`/signup`)
O usuário preenche:
- **Nome Completo** (obrigatório)
- **Nome da Empresa** (opcional)
- **Email** (obrigatório)
- **Senha** (obrigatório)

### 2. Processo de Registro

#### 2.1 Criação do Usuário
```javascript
// src/hooks/useAuth.tsx - função signUp
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      company_name: companyName // opcional
    }
  }
});
```

#### 2.2 Onde os Dados São Armazenados

**Tabela `auth.users` (gerenciada pelo Supabase):**
- `id`: UUID gerado automaticamente
- `email`: Email do usuário
- `encrypted_password`: Senha criptografada
- `raw_user_meta_data`: JSON contendo:
  - `full_name`: Nome completo
  - `company_name`: Nome da empresa (se fornecido)
- `email_confirmed_at`: Data de confirmação do email
- `created_at`: Data de criação

### 3. Trigger Automático (se existir)

```sql
-- Trigger: on_auth_user_created
-- Quando um novo usuário é criado em auth.users, automaticamente:

1. Cria uma organização (se company_name foi fornecido):
   - Tabela: organizations
   - Campos: id, name, slug

2. Cria um perfil do usuário:
   - Tabela: profiles (SE EXISTIR)
   - Campos: id, user_id, organization_id, full_name, email

3. Cria um papel (role) para o usuário:
   - Tabela: user_roles
   - Campos: user_id, role ('owner' se criou organização)
```

## 🔐 Login (Sign In)

### 1. Formulário de Login (`/signin`)
O usuário fornece:
- **Email**
- **Senha**

### 2. Processo de Autenticação

#### 2.1 Autenticação
```javascript
// src/hooks/useAuth.tsx - função signIn
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

#### 2.2 Recuperação de Dados do Usuário
```javascript
// src/hooks/useAuth.tsx - função fetchUserData
// Executada automaticamente após login bem-sucedido

1. Busca dados do usuário autenticado:
   const { data: { user } } = await supabase.auth.getUser();

2. Monta o perfil usando metadata:
   const profileData = {
     id: user?.id,
     email: user?.email,
     full_name: user?.user_metadata?.full_name,
     organization_id: '...' // se houver
   };

3. Busca organização (se existir):
   await supabase.from('organizations')
     .select('*')
     .eq('id', organization_id)

4. Busca role do usuário:
   await supabase.from('user_roles')
     .select('role')
     .eq('user_id', userId)
```

## 🏢 Multi-Tenancy (Isolamento por Organização)

### Como funciona o isolamento de dados por tenant?

**O campo `organization_id` é a chave!** Cada organização (tenant) tem um UUID único, e TODAS as tabelas de dados incluem este campo para segregar os dados.

#### Exemplo Prático:
```sql
-- Tenant A (Fazenda São José)
organization_id = 'a1234567-89ab-cdef-0123-456789abcdef'

-- Tenant B (Fazenda Santa Rita)
organization_id = 'b7654321-89ab-cdef-0123-456789abcdef'

-- Na tabela staging_02_desvio_carregamento:
SELECT * FROM staging_02_desvio_carregamento
WHERE organization_id = 'a1234567-...'  -- Retorna só dados da Fazenda São José

SELECT * FROM staging_02_desvio_carregamento
WHERE organization_id = 'b7654321-...'  -- Retorna só dados da Fazenda Santa Rita
```

### Row Level Security (RLS)

Para garantir que um usuário só veja dados da sua organização:

```sql
-- Policy de RLS nas tabelas
CREATE POLICY "Users can only see their organization data" ON staging_02_desvio_carregamento
FOR ALL USING (
  organization_id = (
    SELECT organization_id
    FROM profiles
    WHERE user_id = auth.uid()
  )
);
```

### Estrutura Multi-Tenant:

```
Organizations (Tenants)
├── Tenant A (id: a1234...)
│   ├── Usuários: João, Maria, Pedro
│   └── Dados: Apenas com organization_id = a1234...
│
└── Tenant B (id: b7654...)
    ├── Usuários: Ana, Carlos, Lucas
    └── Dados: Apenas com organization_id = b7654...
```

### Tabelas com Segregação por Tenant:

Todas estas tabelas têm `organization_id`:
- `staging_01_historico_consumo`
- `staging_02_desvio_carregamento`
- `staging_03_desvio_distribuicao`
- `staging_04_trato_por_curral`
- `staging_05_trato_por_vagao`
- `fato_carregamento`
- `fato_distribuicao`
- `fato_historico_consumo`
- `etl_file`
- `etl_run`
- Todas as views analíticas

## 📊 Estrutura de Dados

### Tabelas Principais

#### `auth.users` (Supabase Auth)
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  encrypted_password VARCHAR,
  raw_user_meta_data JSONB, -- Contém full_name, company_name
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

#### `organizations` (Aplicação)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_roles` (Aplicação)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  granted_at TIMESTAMPTZ DEFAULT now()
);
```

#### `profiles` (SE EXISTIR - Aplicação)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔄 Fluxo Completo

```mermaid
graph TD
    A[Usuário Acessa /signup] --> B[Preenche Formulário]
    B --> C[supabase.auth.signUp]
    C --> D[Cria registro em auth.users]
    D --> E[Trigger on_auth_user_created]
    E --> F[Cria Organization se company_name existe]
    E --> G[Cria Profile se tabela existe]
    E --> H[Cria User Role]

    I[Usuário Acessa /signin] --> J[Fornece Email/Senha]
    J --> K[supabase.auth.signInWithPassword]
    K --> L[Valida Credenciais]
    L --> M[fetchUserData]
    M --> N[Recupera user_metadata]
    M --> O[Busca Organization]
    M --> P[Busca User Role]
    N --> Q[Monta Context de Autenticação]
    O --> Q
    P --> Q
    Q --> R[Redireciona para Dashboard]
```

## ⚠️ Problemas Atuais Identificados

1. **Tabela `profiles` não existe**: O sistema está tentando buscar uma tabela que não foi criada
2. **Dados ficam em `user_metadata`**: As informações do perfil estão apenas no JSON da tabela auth.users
3. **Organização padrão hardcoded**: Para desenvolvimento local, está usando ID fixo

## ✅ Solução Recomendada

### Opção 1: Usar apenas auth.users (SIMPLES)
- Armazenar tudo em `raw_user_meta_data`
- Não criar tabela profiles
- Ajustar código para usar apenas metadata

### Opção 2: Criar estrutura completa (ROBUSTO)
```sql
-- 1. Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar trigger para auto-criar profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 📌 Configuração de Ambiente

### Desenvolvimento Local
```env
# Supabase Local (Docker)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...local...key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Produção (Remoto)
```env
# Supabase Cloud
VITE_SUPABASE_URL=https://zirowpnlxjenkxiqcuwz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...production...key
DATABASE_URL=postgresql://postgres.zirowpnlxjenkxiqcuwz:password@aws.supabase.com:6543/postgres
```