# Configuração de Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o projeto Conecta Boi.

## Arquivo .env

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
cp .env.example .env
```

## Variáveis Obrigatórias

### Supabase Configuration
```bash
VITE_SUPABASE_URL=https://zirowpnlxjenkxiqcuwz.supabase.co
VITE_SUPABASE_ANON_KEY=seu_token_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
SUPABASE_PROJECT_REF=zirowpnlxjenkxiqcuwz
SUPABASE_ACCESS_TOKEN=seu_access_token_aqui
SUPABASE_JWT_SECRET=seu_jwt_secret_aqui
```

### Database Configuration
```bash
DATABASE_URL=postgresql://postgres.zirowpnlxjenkxiqcuwz:senha@aws-1-us-east-2.pooler.supabase.com:6543/postgres
DATABASE_PASSWORD=sua_senha_db_aqui
```

### Task Master AI
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
PERPLEXITY_API_KEY=pplx-...  # Opcional
```

### GitHub Integration
```bash
GITHUB_TOKEN=github_pat_...
```

## Como Obter as Credenciais

### Supabase
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz/settings/api)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### JWT Secret
1. No Dashboard do Supabase, vá em **Settings** → **General**
2. Copie o **JWT Secret** → `SUPABASE_JWT_SECRET`

### Access Token
1. Acesse [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Gere um novo token → `SUPABASE_ACCESS_TOKEN`

### Anthropic API Key
1. Acesse [Anthropic Console](https://console.anthropic.com/)
2. Gere uma API key → `ANTHROPIC_API_KEY`

### GitHub Token
1. Acesse [GitHub Settings](https://github.com/settings/tokens)
2. Gere um token com permissões adequadas → `GITHUB_TOKEN`

## Validação

Execute o script de teste para verificar se todas as variáveis estão configuradas:

```bash
node test_env_setup.mjs
```

## Segurança

⚠️ **IMPORTANTE**:
- Nunca commite o arquivo `.env`
- Use apenas variáveis de ambiente em produção
- Mantenha as credenciais seguras e rotacione-as regularmente

## Arquivo .env.example

```bash
# Task Master AI - API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_REF=your_project_ref_here
SUPABASE_ACCESS_TOKEN=your_access_token_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Database Configuration
DATABASE_URL=your_database_url_here
DATABASE_PASSWORD=your_database_password_here

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
```