# Coin Clicker

This is a simple coin clicker game. The goal is to click the coin as many times as possible in the time limit.

## Instructions

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. If you want to build the project, run `npm run build`.


![screenshot](screenshot.png)
## Tests

- `npm test`: unit tests (Vitest). `npm run test:watch` for watch mode.
- `npm run test:e2e`: Playwright end-to-end tests against a faked backend. First run: `npx playwright install chromium`.

See `docs/adr/` for the architecture decisions.

## Deploy

The game is served by a Cloudflare Worker at `https://infinity-grove.yan-tapajos.workers.dev/`. It forwards `/api/*` to the backend on Google Cloud Run, whose address is the repository variable `BACKEND_URL` (`https://infinity-grove-backend-<project number>.southamerica-east1.run.app`; the backend has no `/api` prefix, the Worker strips it), so the game stays same-origin and needs no CORS.

Every push to `main` that changes the game or the backend runs `.github/workflows/deploy.yml`. After the backend job passes (tests, regression, a Cloud Run revision checked before it takes traffic), the `game` job runs `npm run deploy` with `BACKEND_URL` from the repository variable and builds the Worker from the commit tree, never the working tree. Nothing deploys while the repository variable `CLOUD_RUN_PRODUCTION` is not `true`.

The start screen calls `GET /api/health` once (60 s timeout) before the session restore, because Cloud Run may be starting the backend from zero; after 2 s the message reads `Acordando o servidor, aguarde...`.

To publish by hand from `game/` (needs `npx wrangler login` and `gh auth login`):

```
BACKEND_URL="$(gh variable get BACKEND_URL)" npm run deploy
```

`BACKEND_URL` is the bare backend address, without `/api`. This publishes the working tree, uncommitted changes included.
