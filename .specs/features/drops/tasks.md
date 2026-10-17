# Drops Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/drops/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `game/docs/adr/0004-testing-strategy.md`, `game/vitest.config.js`, `game/playwright.config.js`, `game/package.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain logic (`src/combat`, `src/economy`) | unit | All branches; 1:1 to spec ACs; every listed edge case | `game/src/**/*.test.js` | `npm test` |
| API layer (`src/api`) | unit | Client mocked; request shape and result mapping | `game/src/api/*.test.js` | `npm test` |
| Scene (`src/scenes`) | unit | Phaser mocked; every scene-level AC and edge case | `game/src/scenes/*.test.js` | `npm test` |
| Player flow | e2e | Happy path of the feature in a real browser | `game/e2e/*.spec.js` | `npm run test:e2e` |
| E2E support, docs, CSS | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase. Run from `game/`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks with e2e tests | `npm test && npm run test:e2e` |
| Build | After phase completion or config/docs-only tasks | `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Logic

```
T1 → T2 → T3 → T4
```

### Phase 2: Scene

```
T5 → T6 → T7
```

### Phase 3: Integration and docs

```
T8 → T9 → T10
```

---

## Task Breakdown

### T1: Give the monster a level

**What**: `Monster` takes a `level` (default 1) and exposes it.
**Where**: `game/src/combat/monster.js`
**Depends on**: None
**Reuses**: Existing `Monster` constructor
**Requirement**: DROP-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `new Monster().level` is 1; `new Monster(10, 2).level` is 2
- [x] Health behavior is unchanged
- [x] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): give the monster a level`

---

### T2: Add the wallet API

**What**: `walletApi.get()` and `walletApi.sync(kills)` over `httpClient`, exported from the api index.
**Where**: `game/src/api/walletApi.js`
**Depends on**: T1
**Reuses**: `userApi.js`
**Requirement**: DROP-01, DROP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `get` calls `GET /wallet` through `httpClient` (with auth) and returns `data`
- [x] `sync(kills)` calls `POST /wallet/sync` with body `{ kills }` and returns `data`
- [x] Errors from the client propagate
- [x] `src/api/index.js` exports `walletApi`
- [x] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): add the wallet api`

---

### T3: Add the wallet ledger core

**What**: `WalletLedger` with `load`, `takeDrop`, `land`, `display` and the carry arithmetic.
**Where**: `game/src/economy/walletLedger.js`
**Depends on**: T2
**Reuses**: `Monster` style of small pure classes
**Requirement**: DROP-01, DROP-02, DROP-04, DROP-06, DROP-07, DROP-08, DROP-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Before `load`, `loaded` is false and `takeDrop` returns null
- [ ] `takeDrop(level)` pops the first value of that level's queue and returns `{ id, value }`; an empty or missing queue returns null and changes nothing
- [ ] `land(id)` adds 1 copper to the display; a value of 3 lands three times to add 3
- [ ] `display()` carries 100 copper to 1 silver and 100 silver to 1 gold (99 copper + 1 gives 1 silver 0 copper; 99 silver 99 copper + 1 gives 1 gold 0 silver 0 copper)
- [ ] Gold above 99 999 and above 2^31 displays as is (no cap)
- [ ] Level keys work as numbers or strings
- [ ] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): add the wallet ledger core`

---

### T4: Add the ledger sync bookkeeping

**What**: `beginSync`, `completeSync`, `failSync`, `hasUnreported` on `WalletLedger`.
**Where**: `game/src/economy/walletLedger.js` (modify)
**Depends on**: T3
**Reuses**: Ledger entries from T3
**Requirement**: DROP-10, DROP-11, DROP-12, DROP-13, DROP-14, DROP-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `beginSync()` returns the unreported kill counts per level, marks them in flight, and returns null while a sync is in flight or when nothing is unreported
- [ ] A kill taken while a sync is in flight is not in that sync and is unreported for the next one
- [ ] `completeSync` removes the sent entries, sets the base wallet from the response, and replaces each queue with the response `drops` minus the first m values taken since the request; a level missing from the response gets an empty queue
- [ ] Coins of a covered entry that land after `completeSync` do not change the display; coins of an uncovered entry that landed before it still count on top of the response wallet
- [ ] `failSync` keeps every entry unreported and allows the next `beginSync` to send them together with newer ones
- [ ] A drop above 5 copper is handled like any other value
- [ ] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): add the ledger sync bookkeeping`

---

### T5: Show the wallet text and load the wallet

**What**: `ClickerGame` creates the wallet DOM text (hidden), calls `walletApi.get()` on create and shows the text on success; existing scene tests get the new stubs.
**Where**: `game/src/scenes/ClickerGame.js`
**Depends on**: None (previous phase complete)
**Reuses**: `MainMenu` DOM pattern, `public/style.css`
**Requirement**: DROP-01, DROP-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] On create the scene calls `walletApi.get()` once
- [ ] After it resolves, the text reads `Gold: G  Silver: S  Copper: C` for the response wallet, at the top-left (`WALLET` point), and is visible
- [ ] Before it resolves, and after it fails, the text is hidden
- [ ] A response that arrives after the scene shut down changes nothing and throws nothing
- [ ] `public/style.css` styles `.wallet`
- [ ] All earlier `ClickerGame` tests still pass, with only stand-in stubs added; the "no coins or score" test name is updated for the new wallet text (its assertions are unchanged)
- [ ] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): show the wallet text and load the wallet`

---

### T6: Drop coins when the monster dies

**What**: On death the scene takes a drop from the ledger, spawns that many coin sprites at the monster, tweens them to the wallet text, and lands them into the ledger.
**Where**: `game/src/scenes/ClickerGame.js` (modify)
**Depends on**: T5
**Reuses**: `fadeOutMonster` tween style, `coin` atlas, `rotate` animation
**Requirement**: DROP-04, DROP-05, DROP-06, DROP-07, DROP-08, DROP-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A kill with a drop of v spawns v `coin` sprites at (700, 500), each playing `rotate`
- [ ] Coin i is tweened to the wallet text point over 600 ms with a start delay of i x 100 ms
- [ ] When a coin's tween completes the coin is destroyed, the ledger lands one copper and the text refreshes; after all v coins the text grew by v
- [ ] 99 copper plus a drop of 2 shows 1 silver and 1 copper
- [ ] With the wallet not loaded, or an empty or missing queue, a kill spawns no coins and leaves the text unchanged
- [ ] The monster's `level` picks the queue
- [ ] The existing death, fade and respawn tests still pass
- [ ] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): drop coins when the monster dies`

---

### T7: Sync kills with the backend

**What**: A 10 s loop that syncs unreported kills or retries a failed load, result handling, and one final sync on shutdown.
**Where**: `game/src/scenes/ClickerGame.js` (modify)
**Depends on**: T6
**Reuses**: `WalletLedger.beginSync/completeSync/failSync`, `walletApi.sync`
**Requirement**: DROP-10, DROP-11, DROP-12, DROP-13, DROP-14, DROP-15, DROP-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The scene registers one looping 10 000 ms timer
- [ ] On a tick with unreported kills and no sync in flight the scene calls `walletApi.sync({ "1": n })`; with none it calls nothing
- [ ] While a sync is in flight a tick starts no second sync
- [ ] On success the wallet text shows the response wallet plus the landed coins the response does not cover, and the queues follow the ledger rules
- [ ] On failure the kills stay unreported, play continues, and the next tick retries
- [ ] On a tick with the wallet not loaded the scene calls `walletApi.get()` again until it succeeds
- [ ] On shutdown with unreported kills the scene sends one `walletApi.sync` and never retries it; with none it sends nothing
- [ ] A kill made while a sync is in flight goes to the next sync
- [ ] Responses after shutdown change nothing
- [ ] Gate check passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(drops): sync kills with the backend`

---

### T8: Add the wallet routes to the fake backend

**What**: `fakeBackend.js` answers `GET /api/wallet` and `POST /api/wallet/sync` with the server's contract (pre-rolled queue, credit, Bearer check).
**Where**: `game/e2e/support/fakeBackend.js`
**Depends on**: None (previous phase complete)
**Reuses**: Existing session and token handling in the same file
**Requirement**: DROP-01, DROP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Wallet routes return 401 `AUTH_UNAUTHENTICATED` without a valid Bearer
- [ ] `GET /wallet` returns `{ wallet, drops: { "1": [20 values] } }` for the logged-in user and keeps state per user
- [ ] `POST /wallet/sync` credits the first k queued values, removes them, refills to 20, and returns `{ wallet, accepted, drops }`
- [ ] The helper exposes the recorded wallet calls and a way to seed the queue and the starting wallet
- [ ] Existing e2e scenarios still pass: `npm run test:e2e`
- [ ] Gate check passes: `npm run build && npm test`

**Tests**: none
**Gate**: build

**Commit**: `test(drops): add wallet routes to the fake backend`

---

### T9: Cover the kill, sync and reload flow in the browser

**What**: One Playwright scenario: log in, start the game, kill the monster, see the coins land in the wallet text, see one sync, reload, see the same wallet.
**Where**: `game/e2e/drops.spec.js`
**Depends on**: T8
**Reuses**: `openMainMenu`, `fillCredentials`, `mockBackend`
**Requirement**: DROP-02, DROP-05, DROP-06, DROP-10, DROP-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] After 10 clicks the wallet text grows by the first queued value once the coins land
- [ ] About 10 s later the fake backend recorded exactly one `POST /wallet/sync` with `kills: { "1": 1 }`
- [ ] After a reload and starting the game again the text shows the synced wallet
- [ ] A scenario with a wallet of 99 copper and a drop of 2 shows 1 silver and 1 copper
- [ ] Gate check passes: `npm test && npm run test:e2e`

**Tests**: e2e
**Gate**: full

**Commit**: `test(drops): cover kill, sync and reload in the browser`

---

### T10: Add ADR 0006 for wallet and drops in the game

**What**: Record the ledger, sync and DOM-text decisions.
**Where**: `game/docs/adr/0006-wallet-and-drops.md`
**Depends on**: T9
**Reuses**: ADR 0005 format
**Requirement**: DROP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR states context, decision, consequences and alternatives
- [ ] Gate check passes: `npm run build && npm test`

**Tests**: none
**Gate**: build

**Commit**: `docs(drops): add ADR 0006 on wallet and drops`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7
Phase 3:  T8 ------→ T9 ------→ T10
```
