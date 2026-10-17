# Drops Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/drops/spec.md`
**Diff range**: `81b3509..HEAD` (game code and tests, e2e support, ADR 0006; design and tasks)
**Verifier**: fresh-eyes standalone pass by the implementing agent, because spawning sub-agents was not authorized in this session (the skill's "standalone fallback"). Coverage was re-derived from the spec, not from the author's notes. Author and verifier are the same agent; treat the independence as weaker than a sub-agent run.

**Verdict**: PASS

Gate: `npm run build && npm test && npm run test:e2e` in `game/`: build ok, 187 unit tests passed, 21 e2e scenarios passed, 0 failed, 0 skipped. Unit tests before the feature: 113 (187 minus 74 new). E2e before: 19 (21 minus 2 new).

Path prefix used below: `S/` = `game/src/scenes/`, `E/` = `game/src/economy/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T7 | Done | Monster level, wallet API, ledger (core and sync), scene wallet text, coin drops, sync loop |
| T8 | Done | First gate run failed all e2e scenarios: the route glob `**/api/wallet**` matched Vite's request for `/src/api/walletApi.js` and broke game boot. Fixed with `**/api/wallet` and `**/api/wallet/**` (ADR 0006) |
| T9 | Done | Also caps Playwright workers at 3 in `playwright.config.js`: with 6 workers the heavier suite flaked on unrelated scenarios (boot timeouts); 3 workers passed 21/21 twice |
| T10 | Done | ADR 0006 |

---

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DROP-01 load on start | one `GET /wallet`, wallet and queues kept | `S/ClickerGame.test.js:327` `expect(walletApi.get).toHaveBeenCalledTimes(1)`; queues used by every drop test, e.g. `:408` | PASS |
| DROP-02 wallet text | `Gold: G  Silver: S  Copper: C`, top-left | `S/ClickerGame.test.js:339` `expect(walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37')`, `expect(walletElement().visible).toBe(true)`, `x` below 512 and `y` below 100; `:355` zeros shown; e2e `game/e2e/drops.spec.js:41` `toHaveText('Gold: 0 Silver: 0 Copper: 0')` in real Phaser | PASS |
| DROP-03 monster level | level 1 | `game/src/combat/monster.test.js` "is level 1 by default" `expect(new Monster().level).toBe(1)` and `new Monster(10, 2).level` is 2; scene `S/ClickerGame.test.js:513` | PASS |
| DROP-04 spawn v coins | v sprites at (700, 500), `coin`, `rotate` | `S/ClickerGame.test.js:408` `expect(ctx.sprites).toHaveLength(3)` and `[coin.x, coin.y, coin.key, coin.anim]` equals `[700, 500, 'coin', 'rotate']`; `:397` none before the killing click | PASS |
| DROP-05 600 ms tween, 100 ms stagger | duration 600, delay i x 100, target = wallet text point | `S/ClickerGame.test.js:419` `expect(tween).toEqual(expect.objectContaining({ targets: ctx.sprites[i], x: ctx.walletElement().x, y: ctx.walletElement().y, duration: 600, delay: i * 100 }))` | PASS |
| DROP-06 landing adds 1 copper | +1 and coin destroyed per landing | `S/ClickerGame.test.js:437` `toBe('Gold: 2  Silver: 14  Copper: 38')` after one landing, `'... Copper: 40'` after three, `destroy` called once; `E/walletLedger.test.js:90` | PASS |
| DROP-07 carry | 99 + 2 gives 1 silver 1 copper; 100 silver gives 1 gold | `S/ClickerGame.test.js:460` `toBe('Gold: 0  Silver: 1  Copper: 1')`; `:469` `toBe('Gold: 8  Silver: 0  Copper: 0')`; `E/walletLedger.test.js:120,131`; e2e `game/e2e/drops.spec.js:56` | PASS |
| DROP-08 nothing to drop | no coins, text unchanged | `S/ClickerGame.test.js:488` (not loaded), `:496` (empty queue) `toBe('Gold: 2  Silver: 14  Copper: 37')`, `:505` (level missing) `toHaveLength(0)` | PASS |
| DROP-09 no gold cap | gold keeps growing | `E/walletLedger.test.js:139` `toEqual(wallet(5_000_000_001, 0, 0))`; `S/ClickerGame.test.js:478` 12 coins add 12 copper | PASS |
| DROP-10 send unreported kills per level | `POST /wallet/sync` with `{ "1": n }`; nothing when none | `S/ClickerGame.test.js:581` `toHaveBeenCalledWith({ 1: 2 })`; `:594` `not.toHaveBeenCalled()`; `:602` drop-less kill not counted; `:574` loop of 10 000 ms; e2e `game/e2e/drops.spec.js:44` `toEqual({ kills: { 1: 1 } })` | PASS |
| DROP-11 one sync at a time | no second sync in flight | `S/ClickerGame.test.js:611` `toHaveBeenCalledTimes(1)`; `E/walletLedger.test.js:177` | PASS |
| DROP-12 success updates base and queues | queue = server queue minus drops taken since the request | `E/walletLedger.test.js:202` next value is 2 then 4; `S/ClickerGame.test.js:643` `toBe('Gold: 2  Silver: 15  Copper: 5')`; `:670` next kill spawns 7 coins | PASS |
| DROP-13 display response plus uncovered landed coins | 40 + 1 landed = 41 | `S/ClickerGame.test.js:653` `toBe('Gold: 2  Silver: 14  Copper: 41')`; `E/walletLedger.test.js:249` covered coins add nothing, `:260` uncovered add on top, `:272` snap down | PASS |
| DROP-14 failure keeps kills, retries | same count next tick, play continues | `S/ClickerGame.test.js:683` `toHaveBeenLastCalledWith({ 1: 2 })` and 4 sprites after the failed sync; `E/walletLedger.test.js:296` | PASS |
| DROP-15 failed GET retried | text hidden, retry each tick until success | `S/ClickerGame.test.js:362` hidden after failure; `:699` `toHaveBeenCalledTimes(2)` and visible with the wallet text; `:713` stops once loaded; `:722` no parallel request | PASS |
| DROP-16 final sync on shutdown | one sync, no retry, none when nothing unreported | `S/ClickerGame.test.js:730` `toHaveBeenCalledWith({ 1: 1 })`; `:741` `toHaveBeenCalledTimes(1)` after a failure; `:752` `not.toHaveBeenCalled()` | PASS |
| Edge: kill during a sync goes to the next sync | next sync carries it | `S/ClickerGame.test.js:625` `toHaveBeenLastCalledWith({ 1: 1 })` on the second call | PASS |
| Edge: no session or backend down | game keeps playing without a wallet | `S/ClickerGame.test.js:362,488` | PASS |
| Edge: scene shuts down while coins fly | no error; kills already counted | final sync covers counted kills `S/ClickerGame.test.js:730`; the tween lifecycle belongs to Phaser and cannot be driven by the stand-in | WARNING Spec-precision gap (G1) |

**Status**: 16 of 16 requirements and 2 of 3 edge cases matched with exact outcomes; 1 accepted gap (G1).

Full browser run (real Phaser 3.80.1, `game/e2e/drops.spec.js`): kill with a drop of 3 shows `Copper: 3` after the coins land (`:41`), exactly one `POST /wallet/sync` with `{ kills: { 1: 1 } }` arrives after about 10 s (`:43-44`), the fake backend holds 3 copper (`:45`), and after a reload the text shows 3 again (`:51`); a second scenario shows `Silver: 1 Copper: 1` for 99 + 2 (`:56`).

**Gaps (non-blocking)**
- G1: No test for coins still flying when the scene shuts down. Phaser removes a scene's tweens on shutdown, so no landing callback runs; this is Phaser behavior, not driven by the stand-in. Accepted.
- G2: The click-through wallet text (`pointerEvents = 'none'`) exists only in the design, not as a spec criterion. A test was added at `S/ClickerGame.test.js:349` after the review found it unpinned.

---

## Discrimination Sensor

Scratch: temporary git worktree (`node_modules` junctioned in), each mutant applied to one file, `npx vitest run`, file restored; the junction was removed before the worktree, and the real `node_modules` was verified intact. Real-tree porcelain after cleanup is empty, equal to the pre-sensor baseline. A mutant counts as killed only with named failing tests.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| 1 | `src/economy/walletLedger.js:37` | takes the last queued value | Killed (9) |
| 2 | `walletLedger.js:49` | one extra landing counts | Killed (1) |
| 3 | `walletLedger.js:63` | silver not reduced after carrying | Killed (3) |
| 4 | `walletLedger.js:77` | second sync allowed in flight | Killed (2) |
| 5 | `walletLedger.js:86` | drops not marked in flight | Killed (10) |
| 6 | `walletLedger.js:108` | drops taken during the request not skipped | Killed (1) |
| 7 | `walletLedger.js:105` | sent entries stay in the ledger | Killed (4) |
| 8 | `walletLedger.js:106` | server wallet not taken as base | Killed (6) |
| 9 | `walletLedger.js:119` | failSync leaves the flag set | Killed (2) |
| 10 | `src/scenes/ClickerGame.js:182` | coin count capped at 5 | Killed (2) |
| 11 | `ClickerGame.js:191` | coins start together | Killed (1) |
| 12 | `ClickerGame.js:190` | coin flight 500 ms | Killed (1) |
| 13 | `ClickerGame.js:195` | landing never counts | Killed (5) |
| 14 | `ClickerGame.js:194` | landed coin not destroyed | Killed (1) |
| 15 | `ClickerGame.js:175` | queue chosen without the monster level | Killed (1) |
| 16 | `ClickerGame.js:58` | tick sync and load swapped | Killed (9) |
| 17 | `ClickerGame.js:13` | sync every 5 s | Killed (1) |
| 18 | `ClickerGame.js:107` | final sync inverted | Killed (3) |
| 19 | `ClickerGame.js:85` | failed sync never released | Killed (1) |
| 20 | `ClickerGame.js:116` | no guard against parallel wallet requests | Killed (1) |
| 21 | `ClickerGame.js:145` | wallet text never shown | Killed (2) |
| 22 | `src/combat/monster.js:6` | default monster level 2 | Killed (19) |
| 23 | `src/api/walletApi.js:9` | sync posts the bare map | Killed (1) |
| 24 | `ClickerGame.js:152` | copper shown plus one | Killed (12) |
| 25 | `ClickerGame.js:47` | wallet text captures clicks | Killed (1) after the G2 test was added |
| 26 | `ClickerGame.js:184` | coins spawn 10 px below the monster | Killed (1) |
| 27 | `ClickerGame.js:184` | coins do not rotate | Killed (1) |

**Sensor depth**: lightweight, extended (27 mutants). **Result**: 27/27 killed - PASS. Mutants 1-24 were killed by the tests as first written; 25 would have survived without the G2 test.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS: one pure ledger, the scene only wires it; no unused option |
| Surgical changes | PASS: existing files touched only for the wallet (`ClickerGame.js`, its test stand-in, `monster.js`, `api/index.js`, `style.css`, `fakeBackend.js`, `playwright.config.js`) |
| No scope creep | PASS |
| Matches patterns | PASS: DOM text like `MainMenu`, thin API wrapper like `userApi`, scene constants, `sys.isActive()` guard |
| Spec-anchored outcome check | PASS: asserted strings, counts and timings equal the spec values |
| Per-layer Coverage Expectation | PASS: ledger and scene map 1:1 to DROP ids plus edge cases; e2e covers the happy path |
| Every test maps to a requirement | PASS: reverse-mapped; the "stand-in" tests added to `createScene` are support, not assertions |
| Guidelines followed | `game/docs/adr/0004-testing-strategy.md` (unit with Phaser mocked, e2e happy path per feature, player-facing text as real DOM) |
| Modified existing test | Only the title of "shows one black square character and one monster, and no coins or score" became "... and no coins yet"; its assertions are unchanged (superseded criterion, per the spec) |

---

## Edge Cases

- [x] Kill during an in-flight sync goes to the next sync
- [x] No session or backend down: play continues without a wallet
- [ ] Scene shuts down while coins fly: not testable with the stand-in (G1), accepted

---

## Gate Check

- **Gate command**: `npm run build && npm test` and `npm run test:e2e` (in `game/`)
- **Result**: unit 187 passed, 0 failed, 0 skipped; e2e 21 passed, 0 failed
- **Test count before feature**: unit 113, e2e 19
- **Test count after feature**: unit 187, e2e 21
- **Delta**: +74 unit (monster 2, walletApi 3, ledger 31, scene 38), +2 e2e
- **Skipped tests**: none
- **Failures**: none

---

## Requirement Traceability Update

All DROP-01 to DROP-16 moved from Pending to Verified in `spec.md`.

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 16/16 requirements matched with exact outcomes; 1 accepted edge-case gap
**Sensor**: 27/27 mutations killed
**Gate**: 187 unit + 21 e2e passed

**What works**: Coins drop on death from the server queue and fly to the corner wallet, carry to silver and gold, sync every 10 s, survive failures and reloads.

**Issues found**: A fake-backend route glob that broke game boot (fixed), e2e flakiness at 6 workers (capped at 3), and an unpinned click-through behavior (test added).

**Next steps**: Run both services together by hand once (backend on port 8080, `npm run dev`) to see the real queue and sync end to end; record the open gap G-3 from persistent-session if an in-game 401 appears.
