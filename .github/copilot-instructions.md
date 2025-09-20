# Copilot Instructions for Conecta Boi ETL Platform

## Architecture Overview
This is a **livestock management ETL platform** built as a **pnpm monorepo** with React frontend and Supabase backend. The system processes CSV files through multiple specialized pipelines with full state machine tracking.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **ORM**: Drizzle ORM with custom schema sync utilities
- **Monorepo**: pnpm workspaces with specialized packages
- **ETL Engine**: Custom streaming parser with batch processing

## Monorepo Structure
```
packages/
├── database/           # Drizzle schemas + connection management
├── etl-validation/     # Core ETL parsing, validation, streaming
├── etl-ui/            # React components for ETL interfaces
├── supabase-client/   # Supabase client singleton + utilities
└── pipeline02-etl/    # Pipeline-specific validation (Desvio Carregamento)
```

## Critical ETL Architecture Patterns

### 1. State Machine-Driven Processing
All files flow through: `uploaded → parsed → validated → approved → loaded → failed`
- Tables: `etl_file`, `etl_run`, `etl_run_log` track every state transition
- **Never skip states** - each transition is logged with timestamps
- Use `etl_state` enum, not string literals

### 2. Multi-Tenant Data Isolation
- **All tables require `organization_id`** - Row Level Security (RLS) enabled
- Use `useAuth()` hook to get current organization context
- Edge functions automatically inherit organization from JWT

### 3. Pipeline-Specific Processing
- **Pipeline 02**: BAHMAN/SILOKING equipment deviation tracking
- **Pipeline 04**: Feed distribution by pen (trato por curral)
- Each pipeline has custom validation in `packages/etl-validation/src/`
- Staging tables follow pattern: `etl_staging_0X_*`

## Development Workflow Essentials

### Database Schema Management
```bash
# CRITICAL: Check schema sync before DB changes
npm run drizzle:sync-check

# Create tables via direct connection (not Supabase CLI)
node scripts/create-table-direct.mjs

# After schema changes, verify sync
npm run drizzle:check-drift
```

### Package Development
```bash
# Build specific package first
pnpm build --filter @conecta-boi/database

# Test package in isolation
cd packages/database && pnpm test:connection

# Add cross-package dependency
pnpm add @conecta-boi/database --filter @conecta-boi/etl-ui
```

### File Processing Flow
1. Upload to Supabase Storage → registers in `etl_file`
2. Edge function processes via `packages/etl-validation` streaming parser
3. Extract to staging tables with natural key generation
4. Business validation against dimension tables
5. Insert into fact tables with full audit trail

## Key Conventions

### Naming Patterns
- **Components**: `PascalCase.tsx` (pages, features)
- **shadcn/ui**: `kebab-case.tsx` (primitives only)
- **Database**: `snake_case` tables, `camelCase` TypeScript types
- **Packages**: `@conecta-boi/package-name` scoping

### Error Handling
- ETL errors → logged to `etl_run_log` with context
- Frontend errors → Sentry integration with React Error Boundaries
- Validation errors → returned as structured `FieldError[]` arrays

### Data Flow Architecture
- **Streaming First**: Use `StreamingCsvParser` for large files
- **Batch Processing**: `BatchProcessor` handles staging inserts
- **Natural Keys**: Generate deterministic IDs for idempotent processing
- **Dimensional Modeling**: Always validate against dimension tables first

## Essential Edge Function Patterns
```typescript
// Always use service role key for internal operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Filter by organization from JWT
const { data: { user } } = await supabase.auth.getUser(authToken);
const orgId = user?.user_metadata?.organization_id;
```

## Troubleshooting Quick Reference

### Schema Drift Issues
- Run `npm run drizzle:sync-check` first
- Use direct connection scripts in `scripts/` for table creation
- Supabase CLI migrations often fail - prefer direct pg connection

### ETL Processing Failures
- Check `etl_run_log` table for detailed error context
- Verify organization_id matches in all related tables
- Ensure staging table structure matches pipeline expectations

### Package Build Failures
- Build dependencies in correct order: `database` → `supabase-client` → `etl-validation` → `etl-ui`
- Use `pnpm build --filter <package>` for incremental builds
- Check TypeScript path mappings in monorepo `tsconfig` files

## Performance Considerations
- **Large CSVs**: Always use streaming parser, never load full file to memory
- **Batch Inserts**: Use `BatchProcessor` with configurable batch sizes
- **Database Queries**: Leverage RLS - don't filter by organization manually
- **Build Optimization**: Vite config includes smart chunking for vendor libraries

This platform prioritizes **data integrity** and **audit trails** over speed - every operation is logged and recoverable.