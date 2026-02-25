# Wint Time Reporting PWA

Single-page PWA for time reports against the Wint.se API. Neobrutalism design.

## Stack & Commands
- Vite 6 + React 18 + TypeScript (strict) | CSS custom properties (no Tailwind) | Nix flake (node 22, pnpm)
- Vitest + Testing Library + MSW | Storybook 8

```bash
pnpm dev          # Dev server (port 5173, proxy → api.wint.se)
pnpm test         # 74 tests
pnpm typecheck    # tsc --noEmit
pnpm build        # Production build
```

## Conventions
- Swedish UI text, ISO weeks, `toApiDate()` → `YYYY-MM-DDT00:00:00.000`
- PascalCase API responses, camelCase internally
- Props: `interface` not `type` | Pattern: `Name/Name.{tsx,css,stories.tsx,test.tsx}`
- Neobrutalism: `border: 2px solid`, `box-shadow: Npx Npx 0px` (zero blur)

## Architecture
- **API**: `src/api/` — `client.ts` (fetch+JWT+company headers), `auth.ts`, `company.ts`, `timereport.ts`
- **Hooks**: `useAuth` (BankID+company), `useTimeReport` (week data+save)
- **Proxy**: Dev=Vite `/api`→`api.wint.se` | Prod=`server.mjs` (port 8080)
- **Deploy**: Cloud Build (`cloudbuild.yaml`) → Artifact Registry → Cloud Run (`europe-north1`)
- **Docs**: `WINT_API.md` (full API ref), `swagger.json` (OpenAPI spec)

## Roadmap
- [ ] Real BankID testing against live API
- [ ] Company LockDate → disable editing locked periods
- [ ] Error toasts (save failures, network, auth expiry)
- [ ] Copy previous week, PWA icons, offline caching, loading skeletons
