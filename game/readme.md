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

The game is served by a Cloudflare Worker at `https://infinity-grove.yan-tapajos.workers.dev/`. It forwards `/api/*` to the backend, which runs on your machine behind a fixed ngrok domain. A push to `main` that touches `game/` runs `.github/workflows/deploy-game.yml` (unit tests, then `npm run deploy`).

One-time setup:

1. ngrok dashboard: claim the free static domain (Universal Gateway > Domains), e.g. `your-name.ngrok-free.app`.
2. GitHub repository secrets:
   - `BACKEND_URL`: `https://your-name.ngrok-free.app/api`
   - `CLOUDFLARE_API_TOKEN`: token with the "Edit Cloudflare Workers" template
   - `CLOUDFLARE_ACCOUNT_ID`: shown in the Cloudflare dashboard

Whenever you want the site to work, run the backend and the tunnel:

```
./start.sh                                   # postgres + backend (+ local dev server)
ngrok http --url=your-name.ngrok-free.app 8080
```

Manual deploy: `BACKEND_URL=https://your-name.ngrok-free.app/api npm run deploy`.
