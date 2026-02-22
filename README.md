# Wint Tidrapportering

A single-page PWA for entering weekly time reports against the [Wint.se](https://wint.se) accounting platform. Built with a **neobrutalism** design language.

## Features

- BankID authentication with animated QR code
- Weekly hour grid with inline editing
- Internal/external comment dialog per day per project
- Week locking/unlocking
- Keyboard shortcuts (arrows = week nav, t = today, l = lock, c = comment, Ctrl+Enter = save, Esc = discard)
- Mobile responsive card-based layout
- PWA installable

## Tech Stack

- **Vite 6 + React 18 + TypeScript** (strict mode)
- **CSS custom properties** for design tokens (hand-crafted neobrutalism, no Tailwind)
- **Vitest + Testing Library + MSW** for testing
- **Storybook 8** for component development
- **Nix flake** for reproducible builds and container images

## Development

```bash
# Enter dev environment (requires Nix with flakes)
nix develop

# Install dependencies
npm install

# Start dev server (port 5173, API proxy to api.wint.se)
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Storybook
npm run storybook
```

## Building

The Nix flake builds both the application and a minimal Docker container image:

```bash
# Build the app
nix build

# Build the container image (streams to stdout)
nix build .#container
./result | docker load

# Run locally
docker run -p 8080:8080 wint-time:latest
```

## Deployment (Cloud Run)

The project deploys to Google Cloud Run via Cloud Build. The `cloudbuild.yaml` runs three steps:

1. **Nix build** — builds the container image using `nixos/nix`
2. **Push** — tags and pushes to Artifact Registry
3. **Deploy** — deploys to Cloud Run

### Prerequisites

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create wint-time \
  --repository-format=docker \
  --location=europe-north1

# Grant Cloud Build permission to deploy
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Set up Cloud Build trigger

```bash
# Connect your GitHub repo and create a trigger (via console or CLI)
gcloud builds triggers create github \
  --repo-name=web-wint-tidrapportering \
  --repo-owner=meros \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml
```

### Manual deploy

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Project Structure

```
src/
├── api/           # API client (client.ts, auth.ts, company.ts, timereport.ts)
├── components/    # UI components (each with .tsx, .css, .stories.tsx, .test.tsx)
├── hooks/         # useAuth, useTimeReport
├── test/          # MSW mock handlers and test setup
└── utils/         # Date utilities, BankID QR algorithm
```

## License

Private
