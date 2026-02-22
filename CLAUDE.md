# Wint Time Reporting PWA

## Project Overview
Single-page PWA for entering time reports day by day, targeting the Wint.se accounting platform API. Uses **neobrutalism** design language.

## Tech Stack
- **Vite 6 + React 18 + TypeScript** (strict mode)
- **Storybook 8** for component development
- **Vitest + Testing Library + MSW** for testing (mock API handlers in `src/test/mocks/`)
- **CSS custom properties** for design tokens (no Tailwind — hand-crafted neobrutalism CSS)
- **vite-plugin-pwa** for service worker / installability
- **Nix flake** for dev environment (node 22, pnpm)

## Commands
```bash
pnpm dev             # Vite dev server (port 5173, API proxy → api.wint.se)
pnpm storybook       # Storybook (port 6006)
pnpm test            # Vitest (all tests)
pnpm test:watch      # Vitest watch mode
pnpm typecheck       # TypeScript --noEmit
pnpm build           # Production build
pnpm start           # Production server with CORS proxy (port 3000)
```

## Architecture

### Directory Layout
```
src/
├── api/           # API client modules (client.ts, auth.ts, company.ts, timereport.ts)
├── components/    # UI components, each in own folder with .tsx, .css, .stories.tsx, .test.tsx
├── hooks/         # React hooks (useAuth, useTimeReport)
├── test/          # Test setup + MSW mock handlers
└── utils/         # Utility functions (date.ts)
```

### Component Pattern
Each component follows: `ComponentName/ComponentName.{tsx,css,stories.tsx,test.tsx}`

### Design System
- Tokens in `src/tokens.css` (CSS custom properties)
- Global styles in `src/global.css` (reset, halftone patterns, layout utilities)
- Neobrutalism signature: `border: 2px solid`, `box-shadow: Npx Npx 0px` (zero blur), bold press interactions

### API Layer
- `src/api/client.ts` — fetch wrapper with JWT + company headers
- Dev: Vite proxy (`/api` → `https://api.wint.se`). Prod: `server.mjs` proxy (zero-dep Node.js)
- Headers: `Authorization: Bearer {jwt}`, `companyid: {id}`, `wint-client: wint-client-web`

### Testing
- **Vitest** with jsdom environment
- **MSW** (Mock Service Worker) for API mocking — handlers in `src/test/mocks/handlers.ts`
- **Testing Library** for component rendering and interaction tests
- Tests run without any real API access
- Run `pnpm test` to verify all 74 tests pass

### Auth Flow (BankID with QR code)
1. POST `/api/BankIdAuth/start` → get sessionId, qrStartToken, qrStartSecret, autoStartToken
2. Show animated QR code (updates every second) — user scans with BankID app
3. QR data format: `bankid.<qrStartToken>.<qrTime>.<HMAC-SHA256(qrStartSecret, String(qrTime))>`
4. Alternative: "Öppna BankID på denna enhet" button → `bankid:///` URI scheme
5. Poll GET `/api/BankIdAuth/jwt/{sessionId}` every 300ms until complete
6. On complete: decode JWT, store in localStorage
7. GET `/api/Company` → auto-select first company
8. All subsequent requests include JWT + companyId headers
- Key files: `src/utils/bankid-qr.ts` (QR algorithm), `src/components/BankIdQr/BankIdQr.tsx` (rendering)

## Key Conventions
- Swedish UI text (button labels, placeholders, etc.)
- ISO weeks for week navigation
- Date formatting: `toApiDate()` → `YYYY-MM-DDT00:00:00.000`
- PascalCase for API response fields (ASP.NET convention), camelCase internally
- Component props use TypeScript interfaces (no `type` aliases for props)

## API Documentation
See `WINT_API.md` for full API reference and `swagger.json` for OpenAPI spec.

## What's Next
See `AGENTS.md` for the development roadmap and remaining work.
