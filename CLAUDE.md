# Git workflow

- Always push right after you commit something.

# Deploy

- After finishing a new feature/spec (Verifier PASS, everything pushed), deploy it manually to Cloudflare. The deploy is never automatic and never skipped silently.
- From the repository root run `./publish.sh`: it starts everything, opens the `cloudflared` quick tunnel to the backend and publishes the game Worker pointing at that tunnel. To publish only the Worker, run `BACKEND_URL=<tunnel> npm run deploy` inside `game/`. Details in `game/readme.md`.
- It needs `cloudflared` and a prior `npx wrangler login`. If either is missing, or the user is away from the machine, report that the deploy is pending instead of skipping it.
- The site is `https://infinity-grove.yan-tapajos.workers.dev/`. It works only while the tunnel runs, so tell the user the deploy is live only for that session.
