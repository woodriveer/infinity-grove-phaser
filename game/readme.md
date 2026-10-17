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

The game is served by a Cloudflare Worker at `https://infinity-grove.yan-tapajos.workers.dev/`. It forwards `/api/*` to a backend that must be reachable from the internet (the backend has no `/api` prefix; the Worker strips it).

Deploy by hand after every change to `game/`; a `git push` does not publish:

```
BACKEND_URL=https://<backend-host> npm run deploy
```

`BACKEND_URL` is the bare backend address, without `/api`. It needs a prior `npx wrangler login`.

From the repository root, `./publish.sh` does all of it: it runs `start.sh`, opens a Cloudflare quick tunnel to the backend and publishes the latest game pointing at that tunnel (needs `cloudflared` and `npx wrangler login`). The tunnel address changes on every run, so the site works only while the script runs. `./publish.sh --no-deploy` skips the publish.
