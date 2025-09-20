# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` – Install dependencies (or use `pnpm install` for monorepo)
- `npm run dev` – Start Vite dev server with hot module replacement (HMR) on localhost:8080

### Build & Deploy
- `npm run build` – Production build to `dist/`
- `npm run build:dev` – Development-mode build (includes debugging information)
- `npm run preview` – Serve the built application from `dist/`

### Code Quality
- `npm run lint` – Run ESLint to check code quality
- `npm run lint:fix` – Run ESLint with auto-fix
- `npm run format` – Format code with Prettier
- `npm run format:check` – Check code formatting
- `npm run type-check` – Run TypeScript type checking

## Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Context (AuthProvider) + React Query for server state
- **Backend**: Supabase (database, auth, edge functions)
- **Routing**: React Router v6
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Package Management**: pnpm workspaces (monorepo structure)
- **Validation**: Zod schemas
- **Error Monitoring**: Sentry integration

### Project Structure
```
src/
├── pages/              # Route components
│   ├── ConectaBoiDashboard.tsx  # Main dashboard (/)
│   ├── Analytics.tsx   # Analytics page (also handles /desvios)
│   ├── CsvUpload.tsx   # CSV file processing interface
│   └── [other pages]
├── components/
│   ├── ui/            # shadcn/ui primitives (lowercase naming)
│   ├── dashboard/     # Dashboard-specific components
│   ├── AppSidebar.tsx # Main navigation sidebar
│   └── Layout.tsx     # Main layout wrapper
├── integrations/supabase/
│   ├── client.ts      # Supabase client configuration
│   └── types.ts       # Generated database types
├── hooks/             # Custom React hooks
│   └── useAuth.tsx    # Authentication context and hook
└── lib/
    └── utils.ts       # Utility functions including cn() for className composition

packages/                # Monorepo packages
├── database/           # Drizzle ORM schemas and database connection
├── supabase-client/    # Supabase client manager
├── etl-validation/     # ETL pipeline validation logic
└── etl-ui/            # ETL UI components
apps/                  # Application packages
└── etl-dashboard/     # ETL dashboard React app
supabase/
├── functions/         # Edge functions
│   ├── process-csv/   # Main CSV processing function
│   ├── process-csv-02/ # Pipeline 02 processing
│   └── process-csv-04/ # Pipeline 04 processing
└── migrations/        # Database migrations
scripts/               # Utility scripts
├── drizzle-sync-check.mjs     # Check DB schema sync
├── drizzle-check-drift.mjs    # Check schema drift
└── drizzle-backup.mjs         # Database backup utility
```

### Key Patterns
- **Authentication**: Managed through `useAuth` hook and AuthProvider context
- **Layout**: Most pages use the `Layout` component which includes `AppSidebar` for navigation
- **Styling**: Use Tailwind utility classes composed with `cn()` helper from `lib/utils.ts`
- **Component Files**: Pages/Components use PascalCase.tsx, shadcn/ui components use kebab-case.tsx
- **Environment Variables**: Accessed via `import.meta.env` (prefixed with `VITE_`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Routing**: Main dashboard at `/`, Analytics handles both `/analytics` and `/desvios`
- **Performance**: Optimized build with code splitting, lazy loading, and Sentry monitoring

### Application Features
This is a livestock management platform (Conecta Boi) with features for:
- CSV data upload and processing
- Analytics and deviation tracking
- Feed reading management
- Logistics coordination
- Alert management
- Team collaboration with invite system
- Multi-language support (via LanguageSelector component)

### ETL Pipeline Architecture
- **Pipeline 02**: Desvio de Carregamento (BAHMAN/SILOKING equipment data)
- **Pipeline 04**: Trato por Curral (feed management by pen)
- **Multi-tenant**: Organization-based data isolation with RLS
- **State Machine**: Comprehensive ETL state tracking and error handling
- **Validation**: Business rules validation with custom test suites

### Database Commands
- `npm run drizzle:sync-check` – Verify Drizzle schema matches database
- `npm run drizzle:check-drift` – Check for schema drift
- `npm run drizzle:backup` – Backup database

### Creating Database Tables (Supabase)
When Supabase CLI migration fails due to schema conflicts, use direct database connection:

**Working Method for Table Creation:**
1. Create Node.js script with pg library:
   ```javascript
   import pkg from 'pg';
   const { Client } = pkg;

   const client = new Client({
     connectionString: "postgresql://postgres.project:password@host:5432/postgres",
     ssl: { rejectUnauthorized: false }
   });

   // CREATE TABLE IF NOT EXISTS statement
   await client.query(createTableSQL);
   ```

2. Execute from project root: `node scripts/create-table-script.mjs`

**Tested and Working Example:**
- Created `staging_03_desvio_distribuicao` table successfully
- Script: `scripts/create-table-direct.mjs`
- Connection string format: Use port 5432 (not 6543 pooler)
- Always use `CREATE TABLE IF NOT EXISTS` for safety

**After table creation:**
- Update Drizzle schema in `packages/database/src/schema/`
- Export new table in `packages/database/src/index.ts`
- Run `npm run drizzle:sync-check` to verify sync

### Monorepo Package Commands
Each package in `packages/` has its own build and test commands:
- **Database Package**: `cd packages/database && npm run test:connection` – Test database connection
- **ETL Validation**: `cd packages/etl-validation && npm run test` – Run all ETL validation tests
- **Individual ETL Tests**: `npm run test:separator`, `npm run test:streaming`, `npm run test:mapping`

### Testing
- **Custom Test Framework**: TypeScript-based test suites in `packages/*/src/test/`
- **Run ETL Tests**: `cd packages/etl-validation && npm run build && node dist/test/test-all.js`
- **Manual Testing**: Individual test files available for each pipeline component
- **Connection Tests**: `packages/database/src/test-connection.ts` and `packages/supabase-client/src/test-connection.ts`

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## MCP Server Configuration

### Currently Active Servers
- **GitHub**: Official GitHub MCP server for repository management
- **Supabase**: Database operations and management
- **Context7**: Enhanced code context and analysis
- **Task Master AI**: Development workflow management
- **Playwright**: Browser automation and testing
- **Vercel**: Deployment and hosting management
- **Sentry**: Error monitoring and debugging (OAuth authentication)

### Authentication Notes
- **GitHub**: Uses Personal Access Token authentication via Authorization header
- **Supabase**: Uses project-specific tokens and keys 
- **Sentry**: Uses OAuth flow with automatic authentication - you'll be redirected to login with your Sentry account on first use
- **Vercel**: Uses OAuth authentication
- **Context7**: Uses API key authentication
- **Task Master AI**: Uses multiple AI provider API keys (Anthropic, Perplexity, etc.)

### Sentry MCP Features (16+ tools available)
Once OAuth authenticated, Sentry MCP provides tools for:

**Issue Management:**
- 🔍 **analyze_issue_with_seer**: AI-powered root cause analysis using Sentry's Seer
- � **search_issues**: Natural language issue searching
- � **get_issue_details**: Detailed issue information and context
- � **update_issue**: Modify issue status and properties

**Performance & Monitoring:**
- 🔄 **get_trace_details**: Performance trace analysis
- 🔎 **search_events**: Natural language event searching
- 📈 **find_releases**: Query release information

**Project Management:**
- 🏢 **find_organizations**: List available organizations
- 📁 **find_projects**: Query and list projects
- 👥 **find_teams**: Team management and information
- 🔑 **create_dsn**: Generate Data Source Names for instrumentation
- ➕ **create_project**: Set up new Sentry projects

**Documentation & Support:**
- 📚 **search_docs**: Search Sentry documentation
- ❓ **get_doc**: Retrieve specific documentation

### Example Sentry MCP Prompts
- "Tell me about the issues in my project-name"
- "Check Sentry for errors in components/UserProfile.tsx and propose solutions"
- "Diagnose issue PROJECT-123 and propose solutions using Seer"
- "Create a new project in Sentry for new-service-name"
- "Show me the most recent releases for my organization"
- "Find all unresolved crashes in my React Native app"

### Troubleshooting Sentry MCP
If you encounter authentication issues:
1. Ensure you're using a client that supports OAuth (VS Code 1.101+, Claude Code, Cursor)
2. Check that you have proper permissions in your Sentry organization
3. If you joined a new organization, log out and back in to refresh access
4. For persistent issues, try the legacy configuration:
   ```json
   "sentry": {
     "command": "npx",
     "args": ["-y", "mcp-remote@latest", "https://mcp.sentry.dev/mcp"]
   }
   ```

### Temporarily Disabled
- None currently - all servers configured and ready

### Configuration Notes
- MCP servers are configured in `.mcp.json` in the project root
- GitHub uses Personal Access Token authentication
- Supabase uses project-specific tokens and keys
- Most remote servers use OAuth which may require specific redirect URI setup
