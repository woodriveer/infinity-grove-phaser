# Git workflow

- Always push right after you commit something.

# Release report

- After each feature/spec is done (Verifier PASS, everything pushed), write an HTML report of the result to `.specs/features/<feature>/report.html`, commit it, and give the user its path. Write it in Portuguese (AD-007).
- The report has:
  - the verdict, the commit range and the Verifier summary (sensor killed/survived);
  - **production code** of the range (`git diff --numstat <range>`): lines added and removed and files touched, split into backend (`backend/src/main`) and game (`game/src` without `*.test.js`, plus `game/public/*.css`). Specs, tests and assets are not production code;
  - **test code** of the range: backend (`backend/src/test`), game unit (`game/src/**/*.test.js`), e2e (`game/e2e`), with the number of tests added and the totals of each suite after the run;
  - **unit test coverage**: line and branch percentage of backend (JaCoCo) and game (Vitest `--coverage`, v8), for the whole project and for the files the feature changed;
  - **e2e coverage**: the line percentage of game code that the Playwright suite exercises (istanbul instrumentation), and the feature's e2e scenarios with pass/fail;
  - failing tests that are not caused by the feature, and why.
- Every number comes from a command run for that report. If a coverage tool is not configured, write `não medido` with the reason. Never estimate a number.

# Deploy

- After finishing a new feature/spec (Verifier PASS, everything pushed), deploy it manually to Cloudflare. The deploy is never automatic and never skipped silently.
- From the repository root run `./publish.sh`: it starts everything, opens the `cloudflared` quick tunnel to the backend and publishes the game Worker pointing at that tunnel. To publish only the Worker, run `BACKEND_URL=<tunnel> npm run deploy` inside `game/`. Details in `game/readme.md`.
- It needs `cloudflared` and a prior `npx wrangler login`. If either is missing, or the user is away from the machine, report that the deploy is pending instead of skipping it.
- The site is `https://infinity-grove.yan-tapajos.workers.dev/`. It works only while the tunnel runs, so tell the user the deploy is live only for that session.
