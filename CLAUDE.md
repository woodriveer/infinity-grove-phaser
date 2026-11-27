# Git workflow

- Always push right after you commit something. Pushing to a feature branch counts.
- The deploy watcher deploys `origin/main`, so a commit whose tests have not passed in CI yet (backend, e2e, coverage, mutants: see Agent team §4) goes to a branch first, e.g. `ci/<feature>-<topic>`: push it, run `node scripts/ci-wait.mjs <branch>`, and only when it is green `git pull --rebase origin main && git push origin HEAD:main`. Commits checked by the fast local suites alone (game code with its Vitest gate, docs, specs) can go straight to `main`.

# Release report

- After each feature/spec is done (every task ticked, `test-engineer` author check clean, `ui-artist` APROVADO when the player sees a change, everything pushed), write an HTML report of the result to `.specs/features/<feature>/report.html`, commit it, and give the user its path. Write it in Portuguese (AD-007).
- The report has:
  - the verdict, the commit range and the `test-engineer` author check summary (sensor killed/survived);
  - **production code** of the range (`git diff --numstat <range>`): lines added and removed and files touched, split into backend (`backend/src/main`) and game (`game/src` without `*.test.js`, plus `game/public/*.css`). Specs, tests, assets and build config (`game/vite.config.js` and the like) are not production code;
  - **test code** of the range: backend (`backend/src/test`), game unit (`game/src/**/*.test.js`), e2e (`game/e2e`), with the number of tests added and the totals of each suite after the run;
  - **unit test coverage**: line and branch percentage of backend (JaCoCo) and game (Vitest `--coverage`, v8), for the whole project and for the files the feature changed;
  - **e2e coverage**: the line percentage of game code that the Playwright suite exercises (istanbul instrumentation), and the feature's e2e scenarios with pass/fail;
  - failing tests that are not caused by the feature, and why.
- Coverage and suite totals come from the Tests workflow (`.github/workflows/tests.yml`) run of the release commit, not from a local run: `node scripts/ci-wait.mjs <commit> --out <dir>` waits for it, prints each job's summary (totals, failed tests, coverage) and saves every artifact in `<dir>`. The jobs run: backend `./gradlew ktlintCheck cleanTest test` (artifact `backend-reports`: JaCoCo `jacocoTestReport.xml`, JUnit XML); game unit `npm run test:coverage` (`game-unit-coverage`: `coverage-summary.json`, per file); e2e `npm run test:e2e:coverage -- --shard=<n>/8` in 8 shards, merged by the `e2e` job (`e2e-coverage`: `coverage-summary.json`, the JUnit XML of every shard with every scenario); deploy `node --test --experimental-test-coverage "deploy/**/*.test.mjs"` (lcov totals in `summary-deploy-scripts`). The e2e number is a lower bound: a page reloaded inside a test loses what it counted before the reload.
- Every number comes from a run made for that report: the CI run of the release commit (cite its run id), or a command run now. If a coverage tool is not configured, write `não medido` with the reason. Never estimate a number.

# Deploy

- The backend and the game go live from `origin/main` while `./publish.sh` runs. From the repository root it starts the blue-green stack in Docker (Postgres, the active backend slot, the Traefik proxy on `localhost:8080`, Dozzle), opens the `cloudflared` quick tunnel to the proxy, publishes the game Worker through that tunnel and starts the deploy watcher (`deploy/watcher.mjs`).
- Every 60 s the watcher fetches `origin/main` and deploys the newest commit it has not handled. A commit that changes `backend/**` (backend tests in `backend/src/test/**` alone do not count) is built into the idle slot, checked by the regression suite (`deploy/regression.mjs`) and switched in with no downtime; a failing commit never takes traffic. A commit that changes the game republishes the Worker through the same tunnel. Any other commit is only recorded. The state is in `.deploy-state`.
- Only the tree of a commit is deployed, never the working tree: uncommitted files never reach players.
- `./publish.sh` runs only on the owner's publish computer, the one whose `hostname` is `DESKTOP-RCMC353`; on any other machine never start it. After finishing a new feature/spec (done as in Release report, everything pushed), make sure the commit is on `origin/main`. On the publish computer make sure `./publish.sh` is running (start it if not) so the watcher deploys it within a few minutes; elsewhere tell the user the commit is ready for that deploy. Never skip this step silently.
- `./deploy.sh --rollback` brings back the previous backend within 5 minutes of a deploy; after that the old slot and its image are removed.
- Dozzle shows the live logs of every container (slots, proxy, regression runs) at `http://localhost:8888`.
- A second `./publish.sh` while one runs only prints the tunnel and the active slot; `--force` republishes the Worker of the handled commit. To publish only the Worker by hand, run `BACKEND_URL=<tunnel> npm run deploy` inside `game/`. Details in `game/readme.md`.
- Every Flyway migration must keep the previous backend working (expand/contract, AD-016): a failed deploy does not undo it.
- It needs Docker, `cloudflared` and a prior `npx wrangler login`. If one is missing, or the user is away from the machine, report that the deploy is pending instead of skipping it.
- The site is `https://infinity-grove.yan-tapajos.workers.dev/`. It works only while the tunnel runs, so tell the user the deploy is live only while `publish.sh` runs.

# Agent team

The game targets PC only: no agent writes phone layout requirements, phone findings or phone debts.

The main session is the orchestrator; the agents live in `.claude/agents/`. For a new feature:

1. `product-owner` (Opus, high) writes spec, design and fully detailed tasks with `tlc-spec-driven`; the user approves them.
2. Each task goes to its owner: `kotlin-backend-dev` (Sonnet, high) for `backend/` and the deploy scripts (`deploy/`, `publish.sh`, `deploy.sh`, `start.sh`), `game-dev` (Sonnet, high) for `game/`, `test-engineer` (Sonnet, high) for test tasks.
3. `ui-artist` reviews every change the player can see and writes `ui-review.html` from `.claude/templates/ui-review.html`, with Playwright screenshots of every changed screen (`npm run ui:shots` in `game/`); findings become tasks.
4. There is no Verifier agent. The `test-engineer` author check (`.claude/agents/test-engineer.md`) is the test gate, and the `verifier` step of `tlc-spec-driven` (validation.md, `validate_state.py`) is off in this project. Mutants run with `node scripts/sensor.mjs`.
   - The heavy suites run in GitHub Actions (`.github/workflows/tests.yml`, on every push of any branch), not on this machine, which also serves production. Locally agents run only fast suites: Vitest (`cd game && npm test`, or one test file), one backend test class that needs no Testcontainers (`./gradlew test --tests <Class>`), the node tests of `deploy/` and `scripts/`, and at most the one Playwright spec file they are iterating on. The full backend suite, every Testcontainers test, the full e2e suite, coverage and mutants run only in CI.
   - To get a CI result, push (to a branch, see Git workflow) and call `node scripts/ci-wait.mjs <branch|commit>` once, in the foreground with `timeout: 600000`. It blocks until the run ends and prints the jobs, their summaries and the failing tests (exit 0 green, 1 red or cancelled, 3 no run: not pushed or a docs-only push). If the Bash call times out first, call it once more: it reattaches to the same run. Never poll: no sleep loops, no repeated `gh run list` or `gh run view`.
   - Mutants run in CI: `gh workflow run tests.yml --ref <branch> -f mutants="$(cat <mutants.json>)" -f suites=false [-f only=M1,M2]`, then `node scripts/ci-wait.mjs <branch> --event workflow_dispatch`. The mutants file has the format at the top of `scripts/sensor.mjs`.
   - No agent leaves a test suite running in the background or runs two suites at once in the same checkout.
   - Work of different features that touches different files (for example test-only fixes) runs in parallel, each agent in its own worktree (`isolation: "worktree"`); each rebases on `origin/main` before it pushes to `main` (`git pull --rebase origin main && git push origin HEAD:main`).
5. There is no acceptance step. The orchestrator checks that every task of `tasks.md` is ticked, the `test-engineer` author check has no gaps or surviving mutants and the `ui-artist` review is APROVADO (when the player sees a change); any gap becomes a task for its owner. Scope questions still go to `product-owner`.
6. `gitops` pushes, makes sure the deploy is live, checks production, writes `report.html` from the CI run of the release commit, updates `CHANGELOG.md` and cuts the release tag.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.


---

# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Use o fluxo adequado no chat:

- `/reversa` — descobrir e documentar um sistema existente
- `/reversa-new` — criar PRD e specs para um projeto novo
- `/reversa-forward` — implementar ou evoluir código a partir das specs
- `/reversa-migrate` — planejar a migração de um sistema legado
- `/reversa-docs` — gerar o mini-site visual da documentação
- `/impeccable` — design de front-end: criticar, auditar e polir interfaces (Impeccable, Apache 2.0)
- `/reversa-agents-help` — consultar o catálogo completo de agentes

## Comportamento ao ativar

Quando o usuário digitar `/reversa` ou a palavra `reversa` sozinha em uma mensagem:

1. Ative o skill `reversa` disponível em `.claude/skills/reversa/SKILL.md`
2. Se não encontrar em `.claude/skills/`, tente `.agents/skills/reversa/SKILL.md`
3. Leia o SKILL.md na íntegra e siga exatamente as instruções do Reversa

## Regra não-negociável

Por padrão, nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado:
o Reversa escreve apenas em `.reversa/`, `_reversa_sdd/`, `_reversa_docs/`, `_reversa_forward/`, `_reversa_bugs/` e `_reversa_refactor/`.
A única exceção é a política configurável abaixo, controlada exclusivamente pelo usuário.

Antes de criar, modificar ou apagar qualquer arquivo fora das pastas próprias do Reversa, leia `.reversa/reversa-config.json` e obedeça ao resultado:

- Arquivo ausente, JSON inválido ou campo com tipo errado: trate como `allowLegacyEdits: false` (falha segura, nenhuma escrita fora das pastas do Reversa).
- `allowLegacyEdits: false`: recuse a escrita, informando o caminho recusado, o estado atual da config e o que o usuário deve editar para liberar.
- `allowLegacyEdits: true` com `allowedPaths` não vazio: escreva apenas em caminhos que casem com algum glob da lista (globs relativos à raiz do projeto, com `/`, suportando `*` e `**`).
- `allowLegacyEdits: true` com `allowedPaths` vazio ou ausente: projeto liberado; avise uma vez por sessão que a liberação é irrestrita.

Nunca crie nem edite `.reversa/reversa-config.json` por iniciativa própria: pedido na conversa não é liberação implícita, alterações nesse arquivo são ato exclusivo do usuário.
