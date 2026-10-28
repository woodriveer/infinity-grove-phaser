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

The Worker is published by `./publish.sh` (repository root) and, while it runs, by its deploy watcher: every commit on `origin/main` that changes the game is built from the commit tree (never the working tree) and published through the running tunnel. A `git push` is enough while `publish.sh` runs.

`./publish.sh` starts the backend blue-green stack in Docker, opens a Cloudflare quick tunnel to the proxy on `localhost:8080`, publishes the Worker of the last handled commit pointing at that tunnel and starts the watcher (needs Docker, `cloudflared` and `npx wrangler login`). The tunnel address changes on every run, so the site works only while the script runs. `./publish.sh --no-deploy` skips the first publish; a second run while one is up prints the tunnel, and `--force` republishes. The container logs are at `http://localhost:8888` (Dozzle).

To publish by hand from `game/`:

```
BACKEND_URL=https://<backend-host> npm run deploy
```

`BACKEND_URL` is the bare backend address, without `/api`. This publishes the working tree, uncommitted changes included.
