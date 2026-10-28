# Blue-Green Deploy Specification

## Problem Statement

Today a new backend goes live by stopping `./publish.sh` and starting it again. The backend is down while it restarts, the tunnel comes back with a new address, the Worker has to be published again, and nothing checks the new version before players reach it. This feature runs the backend in containers behind a fixed proxy and adds a local watcher. On every new commit on `origin/main` the watcher builds the new backend next to the running one and runs an API regression suite against it. Only when the suite passes does it move the traffic and delete the old version 5 minutes later. Dozzle shows the logs of every container live in the browser while this happens.

## Goals

- [ ] A commit pushed to `main` that changes the backend is live within 10 minutes with no request lost during the switch, and only if the regression suite passed against it.
- [ ] A failing commit never takes traffic: the old backend keeps serving and the failure is visible in the logs.
- [ ] The tunnel address and the Worker do not change on a backend deploy.
- [ ] The owner can watch the containers' logs live at `http://localhost:8888`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Kubernetes, Argo CD, Argo Rollouts | Owner chose the lighter Docker Compose path |
| Portainer or another container dashboard | Owner chose Dozzle only |
| Blue-green of the game (Worker) | Cloudflare keeps versions itself; the watcher only republishes the Worker when the game changed |
| Rolling back database migrations | Flyway has no down migrations; migrations must stay compatible with the previous backend (see assumptions) |
| A named Cloudflare tunnel with a fixed domain | Needs a domain; the quick tunnel stays up across deploys because it points at the proxy |
| Running the Playwright e2e against the real backend | Owner chose a new API suite |
| Remote CI (GitHub Actions) | Everything runs on the owner's machine |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Trigger | A local watcher runs `git fetch` every 60 s and deploys when `origin/main` has a commit it has not deployed | User choice "Automático a cada push no main" | y |
| Regression suite | A Node script with no new dependency that drives the real API (detailed in US-2) | User choice "Suíte de API nova" | y |
| Old version | Stopped at the switch, kept for 5 minutes for `./deploy.sh --rollback`, then removed | User choice "Apaga após 5 min" | y |
| Log viewer | Dozzle (`amir20/dozzle`) in the compose, bound to `127.0.0.1:8888` | User choice "Só Dozzle"; the Docker socket gives full control of the machine, so it is never exposed on the network or the tunnel | y |
| What is deployed | The tree of the commit (`git archive`), never the working tree, so the owner's uncommitted work never reaches players | A watcher acts without the owner looking | n |
| Proxy | An `nginx` container on `localhost:8080`, the address the tunnel already uses; a switch rewrites its upstream and runs `nginx -s reload`, which lets requests in flight finish | Zero-downtime switch with a stock image | n |
| Backend image | Multi-stage `backend/Dockerfile`: Gradle `bootJar` on JDK 25, run on a JRE 25 image; tagged with the short commit hash | The toolchain is Java 25 | n |
| Slots | Two compose services `backend-blue` and `backend-green` on the internal network; the idle slot takes the new version | Classic blue-green | n |
| Readiness | A slot is ready when `GET /progress` answers 401 (up, no token) within 180 s | No actuator in the project; 401 proves Spring and security are up | n |
| Database | Both slots use the same Postgres; the new slot runs Flyway on start, before the suite. Every migration must work with the previous backend (expand/contract); a failed deploy does not undo the migration | One database, Flyway has no down migrations | n |
| Regression data | The suite registers `regression-<commit>-<random>` users and deletes them with `DELETE /users/{username}` at the end, also when a step fails | It runs on the real database | n |
| What triggers what | A commit that changes `backend/**` runs the blue-green; a commit that changes the game (the `publish.sh` fingerprint paths) republishes the Worker from the commit tree through the live tunnel; a commit that changes neither is only recorded | Avoid needless deploys | n |
| Overlap | One deploy at a time (lock file `.deploy.lock`); a commit that lands during a deploy waits for the next poll | Two switches at once would race on the proxy | n |
| State | `.deploy-state` records the active slot, its commit, the previous slot and commit, and the last commit handled | The watcher survives a restart | n |
| `publish.sh` | It starts the compose stack (Postgres, proxy, Dozzle, the active slot) instead of `gradlew bootRun`, then the tunnel to `localhost:8080`, then the watcher | One command stays the way to go live | n |
| Failed commit | Not retried; the next new commit is tried | A rerun of the same code fails the same way | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Deploy a new backend with no downtime ⭐ MVP

**User Story**: As the owner, I want every backend commit on `main` to go live by itself without stopping the game, so that I only have to push.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHEN the watcher finds a new commit on `origin/main` that changes `backend/**` THEN it SHALL build the image `infinity-grove-backend:<short hash>` from that commit's tree.
2. WHEN the image is built THEN the deploy SHALL start it in the idle slot and wait until `GET /progress` on that slot answers 401, for at most 180 s.
3. IF the new slot is not ready within 180 s THEN the deploy SHALL stop and remove the new slot, keep the proxy on the active slot, and log `Deploy <hash> falhou: o backend não ficou pronto em 180 s`.
4. WHEN the new slot is ready THEN the deploy SHALL run the regression suite against that slot's internal address, never through the proxy.
5. WHEN the suite passes THEN the deploy SHALL point the proxy at the new slot with `nginx -s reload` and log `Deploy <hash> ativo no slot <slot>`.
6. WHILE the proxy switches, requests sent to `localhost:8080` SHALL all get an answer from one of the slots (none refused or reset).
7. WHEN the switch is done THEN the deploy SHALL stop the old slot, keep its container for 5 minutes, and then remove it.
8. WHEN a deploy ends (any outcome) THEN `.deploy-state` SHALL hold the active slot and commit, the previous slot and commit, and the last commit handled.
9. The tunnel address and the Worker SHALL stay the same across a backend deploy.

**Independent Test**: With the stack up on commit A, push commit B that changes a backend response; within 10 minutes `localhost:8080` answers like B, a client polling `/progress` every 100 ms meanwhile saw no failed request, and `docker ps -a` shows the old slot stopped, then gone 5 minutes later.

---

### P1: Regression suite against the new backend ⭐ MVP

**User Story**: As the owner, I want the new backend checked against the real API before it takes players, so that a broken commit never reaches them.

**Why P1**: It is what makes the switch safe.

**Acceptance Criteria**:

1. The suite SHALL take the base URL of the backend to test as its only argument and exit 0 when every check passes, 1 otherwise.
2. The suite SHALL check, in order: register a new user (201 with an access token), log in (200), `GET /progress` at chapter 1 stage 1, `GET /wallet`, `GET /talents`, `GET /heroes`, `GET /equipment`, `GET /auto-click` (level 0, `resets` 0), `POST /account/reset` at chapter 1 answering 409 `RESET_LOCKED`, clearing every encounter of chapter 1 with `POST /progress/outcome` until the progress is at chapter 2, `POST /account/reset` with `fromChapter` 2 answering 200 with `reward` 2 and progress chapter 1, and `GET /auto-click` answering `resets` 1 and `crystals` 2.
3. WHEN a check fails THEN the suite SHALL print `FALHOU: <check>: <expected> / <received>` and stop.
4. WHEN the suite ends (pass or fail) THEN it SHALL delete every user it created with `DELETE /users/{username}`.
5. WHEN every check passes THEN the suite SHALL print `Regressão OK: <n> verificações em <s> s`.
6. IF the suite exits non-zero THEN the deploy SHALL remove the new slot, keep the proxy on the active slot, and log `Deploy <hash> falhou na regressão; o slot <slot> continua ativo`.

**Independent Test**: Run the suite against a healthy local backend: exit 0, the `Regressão OK` line, and no `regression-` user left in `users`. Run it against a backend where `/account/reset` answers 500: exit 1 with a `FALHOU` line, no `regression-` user left.

---

### P1: Watcher on `main` ⭐ MVP

**User Story**: As the owner, I want the deploy to start by itself when I push, so that I do not run anything by hand.

**Why P1**: User choice.

**Acceptance Criteria**:

1. WHILE `publish.sh` runs, the watcher SHALL run `git fetch origin main` every 60 s.
2. WHEN `origin/main` points at a commit different from the last commit handled THEN the watcher SHALL deploy it.
3. WHEN a commit changes neither `backend/**` nor the game fingerprint paths THEN the watcher SHALL record it as handled and deploy nothing.
4. WHEN a commit changes the game fingerprint paths THEN the watcher SHALL publish the Worker built from that commit's tree through the live tunnel, after the backend deploy of the same commit if there is one, and only if that deploy passed.
5. WHILE a deploy runs, the watcher SHALL start no other deploy.
6. IF `git fetch` fails THEN the watcher SHALL log `Não foi possível buscar origin/main; nova tentativa em 60 s` and keep running.
7. The deploy SHALL use the commit's tree only: files modified or untracked in the working tree SHALL NOT reach the image or the Worker.

**Independent Test**: With the watcher up, push a commit that only touches `README.md`: the state records it and no image is built. Push a backend commit: a deploy starts within 60 s.

---

### P2: Manual rollback

**User Story**: As the owner, I want to go back to the previous backend within 5 minutes of a deploy, so that a problem the suite missed costs one command.

**Why P2**: The suite should catch most failures; rollback is the safety net.

**Acceptance Criteria**:

1. WHEN the owner runs `./deploy.sh --rollback` while the previous slot's container still exists THEN the script SHALL start it, wait for it to be ready, point the proxy at it, stop the other slot, and log `Rollback para <hash> no slot <slot>`.
2. IF the previous container no longer exists THEN `./deploy.sh --rollback` SHALL exit 1 with `Sem versão anterior para voltar (removida após 5 min)`.
3. WHEN a rollback is done THEN the watcher SHALL NOT redeploy the commit rolled back from until a newer commit appears.

**Independent Test**: Right after a deploy of B over A, run `./deploy.sh --rollback`: `localhost:8080` answers like A.

---

### P2: Live logs in Dozzle

**User Story**: As the owner, I want to watch the containers while a deploy runs, so that I see the switch happen.

**Why P2**: Monitoring, not required for the switch.

**Acceptance Criteria**:

1. WHILE the stack runs, Dozzle SHALL serve at `http://localhost:8888` the live logs of Postgres, the proxy, both slots and the regression run.
2. Dozzle SHALL listen on `127.0.0.1` only and SHALL NOT be reachable through the tunnel or the proxy.
3. The regression suite SHALL run in a container named `infinity-grove-regression-<hash>` so its output shows in Dozzle.

**Independent Test**: During a deploy, open `http://localhost:8888`: the new slot appears with the Flyway lines, then the regression container with its checks.

---

## Edge Cases

- WHEN the watcher starts and `.deploy-state` is missing THEN it SHALL record the current `origin/main` commit as handled and the slot that `publish.sh` started as active, without deploying.
- IF Docker is not running THEN the watcher SHALL log `Docker indisponível; nova tentativa em 60 s` and keep running.
- IF the image build fails THEN the deploy SHALL log `Deploy <hash> falhou no build da imagem` and change nothing.
- WHEN two commits land between polls THEN the watcher SHALL deploy only the newest one.
- IF the machine restarts during a deploy THEN the next `publish.sh` SHALL start the slot recorded as active in `.deploy-state` and remove a stale `.deploy.lock`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BG-01 | P1: Deploy - AC 1 (image from the commit) | Design | Pending |
| BG-02 | P1: Deploy - AC 2, 3 (start and readiness) | Design | Pending |
| BG-03 | P1: Deploy - AC 4, 5, 6 (suite then zero-downtime switch) | Design | Pending |
| BG-04 | P1: Deploy - AC 7 (old slot kept 5 min) | Design | Pending |
| BG-05 | P1: Deploy - AC 8, 9 (state; tunnel and Worker unchanged) | Design | Pending |
| BG-06 | P1: Regression - AC 1, 2, 3, 5 (checks and output) | Design | Pending |
| BG-07 | P1: Regression - AC 4 (cleanup) | Design | Pending |
| BG-08 | P1: Regression - AC 6 (failure keeps the old slot) | Design | Pending |
| BG-09 | P1: Watcher - AC 1, 2, 3, 5, 6 | Design | Pending |
| BG-10 | P1: Watcher - AC 4 (Worker from the commit) | Design | Pending |
| BG-11 | P1: Watcher - AC 7 (commit tree only) | Design | Pending |
| BG-12 | P2: Rollback | Design | Pending |
| BG-13 | P2: Dozzle | Design | Pending |
| BG-14 | Edge cases (first start, Docker down, build failure, restart) | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks, 14 unmapped ⚠️

---

## Success Criteria

- [ ] A backend push goes live with no failed request seen by a client polling every 100 ms.
- [ ] A commit that breaks `/account/reset` never takes traffic.
- [ ] The owner's uncommitted files are never deployed.
