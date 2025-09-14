# Repository Guidelines

## Project Structure & Module Organization
- `src/` – app code: `pages/` (routes/screens), `components/` (UI + `components/ui` shadcn primitives), `lib/` (utilities like `cn`), `hooks/`, `integrations/supabase/` (client, types), `assets/`.
- `public/` – static assets served as‑is.
- `supabase/` – migrations and edge functions (e.g., `functions/process-csv`).
- Root config: `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `tsconfig*.json`, `index.html`.

## Build, Test, and Development Commands
- `npm install` – install dependencies.
- `npm run dev` – start Vite dev server with HMR.
- `npm run build` – production build to `dist/`.
- `npm run build:dev` – development-mode build (useful for debugging).
- `npm run preview` – serve the built app from `dist/`.
- `npm run lint` – run ESLint on TypeScript/React files.

## Coding Style & Naming Conventions
- TypeScript + React 18, TailwindCSS for styling. Prefer utility classes; compose with `cn` from `src/lib/utils.ts`.
- Indentation: 2 spaces. Use named exports where reasonable.
- Files: Pages/Components use `PascalCase.tsx` (e.g., `src/pages/Analytics.tsx`); shadcn UI primitives are kebab/lowercase (e.g., `components/ui/slider.tsx`); helpers `lowercase.ts` (e.g., `lib/utils.ts`).
- Keep components small and typed; avoid inline styles; no unused vars (ESLint configured).

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests alongside files as `*.test.tsx` or under `src/__tests__/`.
- Aim to cover page routing, key components, and supabase integration boundaries.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.
- PRs: clear description, linked issues, screenshots/GIFs for UI changes, notes on breaking changes or migrations. Keep PRs focused and small.
- Run `npm run lint` and ensure `npm run build` passes before requesting review.

## Security & Configuration Tips
- Supabase: client in `src/integrations/supabase/client.ts`. Prefer env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) via `import.meta.env`; avoid committing secrets. Edge functions read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Do not store secrets in source; use `.env.local` (excluded from VCS) and Vercel/host env for deployments.
