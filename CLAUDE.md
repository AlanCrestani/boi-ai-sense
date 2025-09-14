# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` – Install dependencies
- `npm run dev` – Start Vite dev server with hot module replacement (HMR)

### Build & Deploy
- `npm run build` – Production build to `dist/`
- `npm run build:dev` – Development-mode build (includes debugging information)
- `npm run preview` – Serve the built application from `dist/`

### Code Quality
- `npm run lint` – Run ESLint to check code quality

## Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Context (AuthProvider) + React Query for server state
- **Backend**: Supabase (database, auth, edge functions)
- **Routing**: React Router v6

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

supabase/
├── functions/         # Edge functions
│   └── process-csv/   # CSV processing edge function
└── migrations/        # Database migrations
```

### Key Patterns
- **Authentication**: Managed through `useAuth` hook and AuthProvider context
- **Layout**: Most pages use the `Layout` component which includes `AppSidebar` for navigation
- **Styling**: Use Tailwind utility classes composed with `cn()` helper from `lib/utils.ts`
- **Component Files**: Pages/Components use PascalCase.tsx, shadcn/ui components use kebab-case.tsx
- **Environment Variables**: Accessed via `import.meta.env` (prefixed with `VITE_`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Application Features
This is a livestock management platform (Conecta Boi) with features for:
- CSV data upload and processing
- Analytics and deviation tracking
- Feed reading management
- Logistics coordination
- Alert management
- Team collaboration with invite system
- Multi-language support (via LanguageSelector component)