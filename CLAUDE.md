# Wint Time Reporting PWA

## Tech Stack
- **Vite 6 + React 18 + TypeScript** (strict mode)
- **Storybook 8** for component development
- **Vitest + Testing Library + MSW** for testing (mock handlers in `src/test/mocks/`)
- **CSS custom properties** — hand-crafted neobrutalism (no Tailwind)
- **vite-plugin-pwa** for installability
- **Nix flake** for dev environment (node 22, pnpm)

## Commands
```bash
pnpm dev          # Vite dev (port 5173, proxy → api.wint.se)
pnpm test         # Vitest (74 tests)
pnpm typecheck    # tsc --noEmit
pnpm build        # Production build
pnpm storybook    # Storybook (port 6006)
```

## Key Conventions
- Swedish UI text
- ISO weeks for navigation
- `toApiDate()` → `YYYY-MM-DDT00:00:00.000`
- PascalCase for API response fields, camelCase internally
- Component props: TypeScript `interface` (not `type`)
- Component pattern: `ComponentName/ComponentName.{tsx,css,stories.tsx,test.tsx}`
- Neobrutalism: `border: 2px solid`, `box-shadow: Npx Npx 0px` (zero blur)

## Architecture
```
src/
├── api/           # client.ts (fetch+JWT+company headers), auth.ts, company.ts, timereport.ts
├── components/    # UI components (each in own folder)
├── hooks/         # useAuth (BankID+company), useTimeReport (week data+save)
├── test/          # MSW mock handlers
└── utils/         # date.ts, bankid-qr.ts
```

### API Layer
- Dev: Vite proxy (`/api` → `https://api.wint.se`)
- Prod: `server.mjs` zero-dep Node.js proxy (port 8080)
- Headers: `Authorization: Bearer {jwt}`, `companyid: {id}`, `wint-client: wint-client-web`

### Deployment
- **Cloud Build** (`cloudbuild.yaml`): Nix build → Docker → Artifact Registry → Cloud Run
- Cloud Run service: `web-wint-tidrapportering` in `europe-north1`

## Reference Docs
- `WINT_API.md` — Full API reference (BankID auth, TimeReport, Company, etc.)
- `swagger.json` — OpenAPI spec
- `AGENTS.md` — Roadmap and remaining work
