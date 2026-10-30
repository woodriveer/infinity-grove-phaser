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
- Coverage commands: backend `cd backend && ./gradlew test` (JaCoCo, `build/reports/jacoco/test/jacocoTestReport.xml`); game unit `cd game && npm run test:coverage` (`coverage/unit/coverage-summary.json`); e2e `cd game && npm run test:e2e:coverage` (`coverage/e2e/coverage-summary.json`); deploy `node --test --experimental-test-coverage "deploy/**/*.test.mjs"` (printed in the run output). The e2e number is a lower bound: a page reloaded inside a test loses what it counted before the reload.
- Every number comes from a command run for that report. If a coverage tool is not configured, write `não medido` with the reason. Never estimate a number.

# Deploy

- The backend and the game go live from `origin/main` while `./publish.sh` runs. From the repository root it starts the blue-green stack in Docker (Postgres, the active backend slot, the nginx proxy on `localhost:8080`, Dozzle), opens the `cloudflared` quick tunnel to the proxy, publishes the game Worker through that tunnel and starts the deploy watcher (`deploy/watcher.mjs`).
- Every 60 s the watcher fetches `origin/main` and deploys the newest commit it has not handled. A commit that changes `backend/**` is built into the idle slot, checked by the regression suite (`deploy/regression.mjs`) and switched in with no downtime; a failing commit never takes traffic. A commit that changes the game republishes the Worker through the same tunnel. Any other commit is only recorded. The state is in `.deploy-state`.
- Only the tree of a commit is deployed, never the working tree: uncommitted files never reach players.
- After finishing a new feature/spec (Verifier PASS, everything pushed), make sure `./publish.sh` is running and the commit is on `origin/main`; the watcher deploys it within a few minutes. This step is never skipped silently: if `publish.sh` is not running and cannot be started, report that the deploy is pending.
- `./deploy.sh --rollback` brings back the previous backend within 5 minutes of a deploy; after that the old slot and its image are removed.
- Dozzle shows the live logs of every container (slots, proxy, regression runs) at `http://localhost:8888`.
- A second `./publish.sh` while one runs only prints the tunnel and the active slot; `--force` republishes the Worker of the handled commit. To publish only the Worker by hand, run `BACKEND_URL=<tunnel> npm run deploy` inside `game/`. Details in `game/readme.md`.
- Every Flyway migration must keep the previous backend working (expand/contract, AD-016): a failed deploy does not undo it.
- It needs Docker, `cloudflared` and a prior `npx wrangler login`. If one is missing, or the user is away from the machine, report that the deploy is pending instead of skipping it.
- The site is `https://infinity-grove.yan-tapajos.workers.dev/`. It works only while the tunnel runs, so tell the user the deploy is live only while `publish.sh` runs.

# Agent team

The main session is the orchestrator; the agents live in `.claude/agents/`. For a new feature:

1. `product-owner` (Opus, high) writes spec, design and fully detailed tasks with `tlc-spec-driven`; the user approves them.
2. Each task goes to its owner: `kotlin-backend-dev` (Haiku, high) for `backend/`, `game-dev` (Haiku, high) for `game/`, `test-engineer` (Haiku, high) for test tasks.
3. `ui-artist` reviews every change the player can see and writes `ui-review.md`; findings become tasks.
4. A fresh `test-engineer` runs as the Verifier (it must not have authored the feature in that context).
5. `product-owner` accepts or rejects against the spec.
6. `gitops` pushes, makes sure the deploy is live, checks production, writes `report.html`, updates `CHANGELOG.md` and cuts the release tag.
