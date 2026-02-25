# AGENTS.md — Wint Time Reporting PWA

## Project Status

### Completed (v0.1)
- [x] Nix flake + project scaffold (node 22, pnpm)
- [x] Design tokens (neobrutalism CSS custom properties)
- [x] Global CSS (reset, halftone patterns, typography, layout)
- [x] Base components: Button, Input/Textarea, Card, Badge (all with Storybook stories + tests)
- [x] Domain components: HourCell, CommentDialog, WeekNav, WeekGrid (all with stories + tests)
- [x] BankID login with animated QR code + "open on this device" button
- [x] API client layer: client.ts, auth.ts, company.ts, timereport.ts
- [x] React hooks: useAuth (BankID + company selection), useTimeReport (week data + save)
- [x] App.tsx — main app wiring (login → week grid → save flow)
- [x] MSW mock handlers for all API endpoints
- [x] 74 passing tests (Vitest + Testing Library)
- [x] PWA manifest + vite-plugin-pwa config
- [x] Mobile responsive layout (card-based grid with inline day inputs)
- [x] Comment dialog with internal/external notes (reads from Filter endpoint)
- [x] Lock/unlock weeks (PUT /api/TimeReport/Status)
- [x] Keyboard shortcuts (arrows=week nav, t=today, l=lock, c=comment, Ctrl+Enter=save, Esc=discard)
- [x] Tab order: hour inputs only, dialog focus trapping
- [x] URL state sync (?week=N parameter)
- [x] Daily totals in summary row (desktop + mobile)
- [x] Comment indicators (Excel-style corner triangle on desktop, tappable day label on mobile)
- [x] Sticky bottom action bar with lock + save buttons
- [x] SVG favicon in neobrutalism style
- [x] Production CORS proxy server (server.mjs, zero dependencies)
- [x] Dockerfile for containerized deployment

### Remaining Work (v0.2+)

#### High Priority
- [ ] **Real BankID testing** — Auth flow implemented but needs real API verification
- [ ] **Company LockDate handling** — Periods before `LockDate` should disable editing
- [ ] **Error handling UI** — Toast notifications for save failures, network errors, auth expiry

#### Medium Priority
- [ ] **Copy previous week** — Carry forward project/task rows from last week
- [ ] **PWA icons** — Generate 192x192 and 512x512 raster icons for manifest
- [ ] **Service worker caching** — Offline data strategy
- [ ] **Loading skeletons** — Replace text loading state with skeleton UI

#### Nice to Have
- [ ] **Weekly summary view** — Hours breakdown by project with visualization
- [ ] **Dark mode** — Neobrutalism dark variant
- [ ] **Flexible hour input** — Accept `8h`, `8:00`, `480m` formats
- [ ] **Project autocomplete** — Search/filter when adding new project rows
- [ ] **Swipe navigation** — Swipe left/right between weeks on mobile

## Architecture Notes

### Data Flow
```
BankID → JWT → localStorage
         ↓
Company list → select → companyId in headers
         ↓
TimeReport/Filter → parseFilterResponse() → ProjectWeekData[]
         ↓                                        ↓
   WeekGrid (render)                      useTimeReport (state)
         ↓                                        ↓
   HourCell onChange →               updateHours() → dirty flag
         ↓                                        ↓
   Save button →                     save() → MergeTimeReport POST
```

### API Endpoints Used
- `GET /api/TimeReport/Filter` — Week data with comments (InternalComment/ExternalComment per CategoryTime)
- `POST /api/TimeReport/MergeTimeReport` — Save time entries (camelCase payload)
- `PUT /api/TimeReport/Status` — Lock/unlock weeks (status: 0=Open, 1=Locked)
- `POST /api/BankIdAuth/start` → `GET /api/BankIdAuth/jwt/{id}` — BankID auth flow
- `GET /api/Company` → `POST /api/Company/Selected` — Company selection

### Key Files
1. `src/hooks/useTimeReport.ts` — Main business logic
2. `src/api/client.ts` — API calls (auth headers, proxy)
3. `src/components/WeekGrid/WeekGrid.tsx` — Main UI
4. `src/App.tsx` — App shell, keyboard shortcuts, URL state
5. `src/test/mocks/handlers.ts` — All mock API responses
