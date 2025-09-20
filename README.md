# Conecta Boi - ETL Platform

Sistema de gestão pecuária com pipeline ETL robusto para processamento de dados CSV.

## 🏗️ Arquitetura

### Monorepo Structure
```
├── apps/
│   └── etl-dashboard/          # Dashboard ETL React App
├── packages/
│   ├── database/               # Drizzle ORM + Schemas
│   ├── supabase-client/        # Supabase Client Manager
│   ├── etl-validation/         # Validação de pipelines
│   └── etl-ui/                # Componentes UI ETL
├── src/                       # App principal (existente)
└── supabase/                  # Edge Functions + Migrations
```

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **ORM**: Drizzle ORM
- **Monorepo**: pnpm workspaces
- **Validation**: Zod schemas
- **UI**: shadcn/ui + TailwindCSS

## 🚀 Quick Start

### Prerequisites
- Node.js >=18.0.0
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Configure your Supabase credentials

# Run development server
pnpm dev
```

### Database Setup
```bash
# Generate database migrations
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Open Drizzle Studio
pnpm run db:studio
```

## 📦 Packages

### @conecta-boi/database
Drizzle ORM schemas e connection management:
- ETL control tables (`etl_run`, `etl_file`, `etl_run_log`)
- Staging tables (`etl_staging_02_*`, `etl_staging_04_*`)
- Dimension tables (`dim_curral`, `dim_dieta`, `dim_equipamento`)
- Fact tables (`fato_desvio_carregamento`, `fato_trato_curral`)

### @conecta-boi/supabase-client
Gerenciador de conexão Supabase:
- Singleton pattern
- Auth management
- Storage operations
- Type-safe client

### @conecta-boi/etl-validation
Validação de pipelines ETL:
- Pipeline 02: Desvio de Carregamento
- Pipeline 04: Trato por Curral
- CSV parsing and validation
- Natural key generation

### @conecta-boi/etl-ui
Componentes React para ETL:
- File management interface
- Status indicators
- Progress tracking
- Validation reports

## 🔄 ETL Pipelines

### Pipeline 02 - Desvio de Carregamento
Processa dados de carregamento de vagões (BAHMAN/SILOKING):
- Validação de equipamentos específicos
- Cálculo de desvios (kg e %)
- Mapeamento dimensional

### Pipeline 04 - Trato por Curral
Processa dados de trato por curral:
- Validação de horários
- Mapeamento de currais
- Detecção de duplicatas

## 📝 Scripts Disponíveis

```bash
# Development
pnpm dev              # Start dev server
pnpm build           # Build all packages
pnpm type-check      # TypeScript check

# Code Quality
pnpm lint            # ESLint
pnpm lint:fix        # ESLint with auto-fix
pnpm format          # Prettier format
pnpm format:check    # Prettier check

# Database
pnpm db:generate     # Generate migrations
pnpm db:migrate      # Apply migrations
pnpm db:studio       # Open Drizzle Studio
pnpm db:push         # Push schema changes
```

## 🔧 Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PROJECT_REF=your_project_ref

# Task Master AI (optional)
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key

# Database (optional - uses Supabase by default)
DATABASE_URL=postgresql://...
```

## 🗂️ Project Structure

### Database Schema
- **Multi-tenant**: All tables include `organization_id`
- **RLS enabled**: Row Level Security on all tables
- **Idempotent**: Natural keys prevent duplicates
- **Auditable**: Complete processing history

### File Processing Flow
1. **Upload** → Storage bucket
2. **Discovery** → Register in `etl_file`
3. **Parse** → Extract to staging tables
4. **Validate** → Business rules validation
5. **Map** → Dimensional mapping
6. **Load** → Insert into fact tables

## 🧪 Testing

```bash
# Test Supabase connection
cd packages/supabase-client
pnpm build && node dist/test-connection.js

# Test database connection
cd packages/database
pnpm build && node -e "
import { dbConnection } from './dist/connection.js';
const db = dbConnection.connect({
  connectionString: process.env.DATABASE_URL
});
console.log('✅ Database connected');
"
```

## 📚 Development Guide

### Adding New Pipeline
1. Create schema in `packages/database/src/schema/`
2. Add validation in `packages/etl-validation/src/`
3. Create UI components in `packages/etl-ui/src/`
4. Update edge function in `supabase/functions/`

### Package Management
```bash
# Add dependency to specific package
pnpm add <package> --filter @conecta-boi/database

# Add workspace dependency
pnpm add @conecta-boi/database --filter @conecta-boi/etl-ui

# Build specific package
pnpm build --filter @conecta-boi/database
```

## 🔗 Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Task Master AI Docs](./.taskmaster/CLAUDE.md)
- [Project Requirements](./RELATORIO_PROJETO.md)

## 📄 License

Private - Conecta Boi Project