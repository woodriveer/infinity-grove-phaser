# Game Version Label Validation

**Verdict**: PASS (round 1 of 3)
**Date**: 2026-11-18
**Spec**: `.specs/features/game-version/spec.md`
**Diff range**: `24c53fc..081a3ff`: spec `afde02e`, owner approval `469342c`, T1 `f1e820a`, T2 `9fac504`, T3 `8fafe1a`, T4 `0cf9f4f`, T5 `081a3ff`. `git log 24c53fc..081a3ff` holds no other commit. `24c53fc` (gitops bumps the version) is the base and is not part of the feature.
**Full run**: `081a3ff` (backend, game unit and the whole e2e suite, all with the coverage commands; `HEAD` and `origin/main` were both `081a3ff` when the report was written)
**Coverage summaries**: copied into `.specs/features/game-version/coverage/` from the run at `081a3ff`: `jacocoTestReport.xml` (backend), `unit-coverage-summary.json` (from `game/coverage/unit/coverage-summary.json`), `e2e-coverage-summary.json` (from `game/coverage/e2e/coverage-summary.json`, the 10 e2e parts merged with `--keep`). Git ignores the folder.
**Verifier**: independent sub-agent (author ≠ verifier). I wrote none of this feature's code or tests.

PASS. All 13 criteria GV-01 to GV-13 trace to a test that asserts the exact value the spec names: 4 of 4 unit-level criteria have unit tests and 12 of 12 player-visible criteria have e2e. The sensor killed 11 of 11 mutants across the four production files. The suites ran at `081a3ff`: backend 1013/1013, game unit 1781/1781, e2e 377/381. The 4 e2e failures are load flakes: each passed alone twice with `--workers=1`. Two of them (`dragEquip.spec.js:586`, `:640`) are on the known list; two are new to it (`skills.spec.js:49`, `wake.spec.js:56`). None touches the label. The remaining findings are bookkeeping only (Fix 1).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `f1e820a`: `game/vite.config.js`, `game/src/viteConfig.test.js`. Heading `[x]`; Done-when boxes not ticked (Fix 1) |
| T2 | ✅ Done | `9fac504`: `versionLabel.js`, `versionLabel.test.js` (14 cases). Heading `[x]`; Done-when box not ticked (Fix 1) |
| T3 | ✅ Done | `8fafe1a`: `game/src/main.js`, `game/public/style.css`. Heading `[x]`; Done-when boxes not ticked (Fix 1) |
| T4 | ✅ Done | `0cf9f4f`: `game/e2e/gameVersion.spec.js` (7 scenarios). Heading and Done-when boxes `[x]`. One deviation from the task contract, explained in the test (see Code Quality) |
| T5 | ✅ Done | `081a3ff`: `ui-review.html` APROVADO, 0 findings, 11 shots (6 desktop, 5 phone), `game/ui-review/gameVersion.shots.js`. **`tasks.md:399` still reads `[ ]`** and its Done-when boxes are unticked (Fix 1) |

Each task commit touches only the files its task names plus `tasks.md` and `spec.md`. No commit edits `game/package.json`: it still reads `"version": "0.0.0"` (`game/package.json:3`), as D11 requires.

---

## Spec-Anchored Acceptance Criteria

Abbreviations: `VL` = `game/src/adapters/phaser/views/versionLabel.test.js`, `VC` = `game/src/viteConfig.test.js`, `E` = `game/e2e/gameVersion.spec.js`. Line numbers are at `081a3ff`. `E` reads `LABEL` from `game/package.json` (`E:7-8`, `` `v${version.trim()}` ``). The helpers are `expectOneLabel` (`E:19-23`: `toBeVisible`, `toHaveText(LABEL)`, `toHaveCount(1)`), `expectInCorner` (`E:26-34`: `|vw - (x + w) - 8| ≤ 1` at `E:30`, `|vh - (y + h) - 4| ≤ 1` at `E:31`) and `expectGroveStyle` (`E:49-85`). Every cited test passed in this round's runs.

### P1: Version on every screen

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| GV-01 | WHEN the page loads THEN one `div.game-version`, `data-testid="game-version"`, text `v` + trimmed version, appended to `document.body` before the game is created | `0.4.1` → `v0.4.1`, `0.0.0` → `v0.0.0`, ` 0.4.1 ` → `v0.4.1`; last child of body; `DIV`, class `game-version` | `VL:8` `toBe('v0.4.1')`; `VL:12` `toBe('v0.0.0')`; `VL:16` `versionText(' 0.4.1 ')` `toBe('v0.4.1')`; `VL:50` `label` `toBe(document.body.lastElementChild)`, `VL:51` `children[0].id` `'app'`, `VL:52` `tagName` `'DIV'`, `VL:53` `className` `'game-version'`, `VL:54` `data-testid` `'game-version'`, `VL:55` `'v0.4.1'`, `VL:56` count 1. Order: `game/src/main.js:47` `mountVersionLabel(__GAME_VERSION__);` comes before `:49` `new Game(config)`. The built bundle (`npm run build` at `081a3ff`) holds ``Va(`0.0.0`);var md=new u.Game(pd)``. On screen: `E:88` shows the label while the first scene, the Preloader, draws | ✅ PASS |
| GV-02 | WHILE the loading screen (Preloader) shows, the label is visible with `v<version>` | visible, text `LABEL` | `E:88-106`: `background.png` held by a route (`E:92-95`); waits for the Preloader's bar (`E:100`, children > 0); `expectOneLabel` at `E:102`; then the route is released and the Splash starts (`E:104-105`) | ✅ PASS |
| GV-03 | WHILE the splash shows, the label is visible with `v<version>` | visible, text `LABEL` | `E:108-114`: `waitForScene(page, 'Splash')` (`E:111`), `expectOneLabel` (`E:113`) | ✅ PASS |
| GV-04 | WHILE the login form shows, the label is visible with `v<version>` | visible, text `LABEL` | `E:116-125` `openMainMenu` then `expectOneLabel` (`E:120`); at 390x844 `E:148-152` | ✅ PASS |
| GV-05 | WHILE the battle shows, the label is visible with `v<version>` | visible, text `LABEL` | `E:127-135`: `startGame` waits for `ClickerGame` and `hud-farm` (`E:44-45`), then `expectOneLabel` (`E:130`) | ✅ PASS |
| GV-06 | Exactly one label on every screen; a second `mountVersionLabel` rewrites the text and adds none | count 1; second call returns the same element with the new text | `VL:59-66`: `second` `toBe(first)`, `first.textContent` `'v0.4.1'`, count 1. On screen: `toHaveCount(1)` (`E:22`) on the loading screen, splash, login form (1280x720 and 390x844) and battle (`E:102`, `:113`, `:120`, `:130`, `:152`) | ✅ PASS |

### P1: Version from the build

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| GV-07 | `vite.config.js` defines `__GAME_VERSION__` as the JSON string of `package.json` `version` for every mode and command; the label text comes from that constant only | `define` `{ __GAME_VERSION__: JSON.stringify(version) }` for `development`/`serve` and `pages`/`build` | `VC:12` and `VC:18` `config.define` `toEqual({ __GAME_VERSION__: JSON.stringify(version) })` with `version` read from `package.json` (`VC:6`); `VC:24-25` plugin and port kept. Constant only: every `E` `toHaveText(LABEL)`; mutant M1 (text typed by hand) killed | ✅ PASS |
| GV-08 | IF the version is not a string, or is empty or whitespace, THEN no label | `''`, `'   '`, `undefined`, `null`, `41` add none | `versionText` → `null`: `VL:20` `''`, `VL:24` `'   '`, `VL:28` `undefined`, `VL:32` `null`, `VL:36` `41`. `mountVersionLabel` → `null` and count 0: `VL:69-70` `''`, `VL:74-75` `undefined`, `VL:79-80` `'   '` | ✅ PASS (note N1) |

### P1: Discreet and out of the way

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| GV-09 | `position: fixed`, right edge 8 px (±1) and bottom edge 4 px (±1) from the viewport, at 1280x720, 390x844 and 1024x768 | 8 ±1 px, 4 ±1 px | `expectInCorner` `E:30-31`, called at 1280x720 (`E:121`, `E:131`), 390x844 (`E:153`) and 1024x768 (`E:170`); `position` `'fixed'` at `E:72` | ✅ PASS |
| GV-10 | WHILE 1280x720 the label lies right of the canvas, on the start screen and in the battle | `box.x ≥ canvas.x + canvas.width` | `E:124` (login form), `E:134` (battle) | ✅ PASS |
| GV-11 | WHILE 390x844 the label lies below the canvas and is 12 px (±1) tall | `box.y ≥ canvas.y + canvas.height`; `|h - 12| ≤ 1` | `E:156`, `E:157` (with `isMobile`, `hasTouch`, `E:146`) | ✅ PASS |
| GV-12 | Computed style at 1280x720 and 390x844 | `Figtree…`, 600, 12px, 12px, 0.48px, `rgb(230, 208, 162)`, 0.6, `rgb(28, 18, 12) 0px 1px 2px`, nowrap, z-index 10 | `E:70` `fontFamily` `toMatch(/^"?Figtree"?,/)`; `E:71-84` `toMatchObject` with each spec value, plus `pointerEvents` `'none'`, `userSelect` `'none'`; called at 1280x720 (`E:141`) and 390x844 (`E:158`) | ✅ PASS |
| GV-13 | No pointer; WHILE 1024x768 `elementFromPoint` at the label centre is the game canvas and a click there during the splash skips it (ends before 1650 ms) | `{ tag: 'CANVAS', inGame: true }`; `endedAt < 3300 / 2` | `E:174-175` label over the canvas; `E:179-185` `toEqual({ tag: 'CANVAS', inGame: true })`; `E:188-190` click, `endedAt` not null, `toBeLessThan(SPLASH_END_MS / 2)`; `E:191` `.auth-form` visible; `pointer-events`/`user-select` `'none'` at `E:82-83` | ✅ PASS |

**Status**: ✅ 13/13 criteria covered with the spec's exact outcome. Unit-level criteria with unit tests: 4/4 (GV-01, GV-06, GV-07, GV-08). Player-visible criteria with e2e: 12/12 (GV-01 to GV-07, GV-09 to GV-13; GV-08 shows nothing on screen by definition).

Notes (no gap):

- **N1** GV-08 lists `null` and `41` among the inputs that "each add none". `mountVersionLabel(null)` and `mountVersionLabel(41)` are not called directly. They are covered through `versionText` (`VL:32`, `VL:36`), whose `null` result `mountVersionLabel` returns unchanged (`versionLabel.js:21-26`). Mutant V4 (type guard removed) is killed.
- **N2** GV-01 "before the Phaser game is created" holds in the source (`main.js:47` before `:49`) and in the built bundle. No test tells the two orders apart, and none can: both calls run in the same synchronous module evaluation, before the first frame. I did not run that mutant, because it is equivalent.

---

## Edge Cases

- [x] 1024x768 (no letterbox): the label lies over the canvas and a click on it reaches the game (`E:165-192`, GV-13).
- [x] `mountVersionLabel` twice: one label with the text of the second call (`VL:59-66`).
- [x] Missing, empty or whitespace version: no label (`VL:19-36`, `VL:68-81`).
- [x] Scene changes keep one label: `startGame` passes through the Preloader, Splash, MainMenu and ClickerGame, and the battle still holds exactly one label (`E:130` → `E:22`). Each of the other screens also asserts count 1.

---

## Discrimination Sensor

Run with `node scripts/sensor.mjs <scratchpad>/mutants.json` at `081a3ff`. Each mutant ran its narrowest command (one Vitest file, or the one Playwright spec, filtered with `-g`). After the run, the same commands passed on the clean tree (`gameVersion.spec.js` 7/7, the two Vitest files 17/17), so every kill comes from the fault, not from a broken runner. `style.css` and `main.js` have CRLF line endings, so the multi-line `find` strings use `\r\n`.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| V1 | `game/src/adapters/phaser/views/versionLabel.js` | GV-08 blank check misses a version of spaces | killed |
| V2 | `game/src/adapters/phaser/views/versionLabel.js` | GV-01 whitespace kept around the version | killed |
| V3 | `game/src/adapters/phaser/views/versionLabel.js` | GV-06 second mount appends a second label | killed |
| V4 | `game/src/adapters/phaser/views/versionLabel.js` | GV-08 type guard removed (null, 41) | killed |
| C1 | `game/vite.config.js` | GV-07 define is the raw version, not its JSON string | killed |
| C2 | `game/vite.config.js` | GV-07 Worker build (mode pages) loses the version | killed |
| M1 | `game/src/main.js` | GV-07 label text typed by hand instead of the build constant | killed |
| S1 | `game/public/style.css` | GV-13 label swallows the click (behaviour test only, not the style test) | killed |
| S2 | `game/public/style.css` | GV-09 bottom edge 12 px instead of 4 px | killed |
| S3 | `game/public/style.css` | GV-12 label at full opacity | killed |
| S4 | `game/public/style.css` | GV-11 label 20 px tall on a phone | killed |

**Result**: 11/11 killed - PASS. 11 mutants, 11 killed, 0 survived, 0 invalid; isolation ok (`git status --porcelain` unchanged, `graphify-out/` ignored by the script). Commands: V1 to V4 `npx vitest run src/adapters/phaser/views/versionLabel.test.js`; C1, C2 `npx vitest run src/viteConfig.test.js`; M1 `npx playwright test e2e/gameVersion.spec.js`; S1 `-g "lets a click"` (only the click-through behaviour test, which does not read the computed style); S2 `-g "right of the canvas"`; S3 `-g "Grove style"`; S4 `-g "below the canvas at full size"`.

**Sensor depth**: lightweight plus (not a P0 path); 11 mutants, every production file of the diff and every branch of `versionLabel.js`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ 42-line view, 5-line mount, 4 lines of config, one CSS rule |
| Surgical changes | ✅ each commit touches only its task's files; `game/package.json` unchanged |
| No scope creep | ✅ no hash, date or backend version; the label takes no pointer |
| Matches patterns | ✅ `el()` from `dom.js`, 4-space indent, Allman braces, `//  ` comments; the view sits in `adapters/phaser/views` (AD-003), and `src/architecture.test.js` passes |
| Spec-anchored outcome check | ✅ every asserted value is the spec's value (13 computed-style values, 8/4 px ±1, 12 px ±1, `CANVAS`, 1650 ms) |
| Per-layer coverage expectation | ✅ view: every branch of `versionText` and `mountVersionLabel` with exact strings; config: both modes; e2e: every visible criterion and the 4:3 edge case |
| Every test maps to a requirement | ✅ the 3 `VC`, 14 `VL` and 7 `E` cases each map to a GV ID or a Done-when line (`VC:21` maps to T1's "existing plugin and port kept") |
| Documented guidelines followed | ✅ `CLAUDE.md`, `.claude/agents/verifier.md`, `tasks.md` Test Coverage Matrix |

Deviation from the task contract (accepted): T4's loading scenario waits for the Preloader's drawn bar (`E:100`, `scene.getScene('Preloader').children.list.length > 0`) instead of `waitForScene(page, 'Preloader')` as `tasks.md:375` wrote. The reason is in the test comment at `E:99`. While its `preload()` is still loading (here held by the route), a Phaser scene is not active, so `isActive('Preloader')` would never turn true. The bar is drawn in `Preloader.init()` (`game/src/adapters/phaser/Preloader.js:14-29`), so the new wait is the more exact proof that the loading screen shows. `tasks.md` does not record the deviation (Fix 1).

---

## Gate Check

| Suite | Command (at `081a3ff`) | Result |
| ----- | ---------------------- | ------ |
| Backend | `cd backend && ./gradlew test`, then `./gradlew cleanTest test` | The first call answered `:test UP-TO-DATE` and ran nothing, so I forced the run with `cleanTest`. 1013 tests in 91 classes: 1013 passed, 0 failed, 0 errors, 0 skipped (2 m 3 s). JaCoCo written |
| Game unit | `cd game && npm run test:coverage` | 80 files, 1781 tests: 1781 passed |
| e2e | `cd game && npm run test:e2e:coverage -- <files>` for the first part, `-- --keep <files>` for the other nine, one at a time, `--reporter=line` | 381 tests (`--list` total, 27 files): 377 passed, 4 failed (load flakes, below), 0 skipped |
| Build | `cd game && npm run build` | exit 0; the bundle inlines the version and mounts it before `new Game` |

e2e parts: (1) `gameVersion` + `heroBagCards` + `heroes` + `heroAscension` 57/57 (12.6 m); (2 to 4) `uiRedesign` `--shard=1/3`, `2/3`, `3/3` 39/39, 39/39, 39/39; (5) `bossReplayChapters` + `bossMap` 37/37; (6) `dragEquip` + `accountReset` + `drops` 33/35; (7) `bulkSell` + `skillsAll` + `elements` 36/36; (8) `talents` + `auth` + `farm` 35/35; (9) `campaignChapters` + `autoClick` + `session` + `stages` + `splash` 36/36; (10) `clickPower` + `combatHud` + `equipment` + `equipmentUi` + `skills` + `wake` 26/28.

**Failures not caused by the feature** (each rerun alone twice with `npx playwright test <file:line> --workers=1`, all four passed both times):

| Test | Full-run failure | Alone, run 1 / run 2 | Verdict |
| ---- | ---------------- | -------------------- | ------- |
| `dragEquip.spec.js:586` edge scroll up | failed in part 6 | passed 15.9 s / 18.6 s | load flake (known) |
| `dragEquip.spec.js:640` edge scroll down | failed in part 6 | passed 18.2 s / 17.2 s | load flake (known) |
| `skills.spec.js:49` second press while the skill cools | `expect(locator).not.toHaveText` failed in part 10 | passed 11.0 s / 12.8 s | load flake (new to the list) |
| `wake.spec.js:56` server down explains without waiting | failed in part 10 | passed 13.6 s / 11.7 s | load flake (new to the list) |

None of the four reads the label or `.game-version`. The label is `pointer-events: none` and lies in the letterbox at 1280x720, so it cannot take their pointer input.

- **Test count before the feature**: backend 1013, game unit 1764, e2e 374 (`STATE.md` Handoff, `hero-bag-cards` round 2)
- **Test count after**: backend 1013, game unit 1781, e2e 381
- **Delta**: backend +0, game unit +17 (3 `VC` + 14 `VL`), e2e +7 (`E`). No test was removed or weakened (`git diff --stat 24c53fc..081a3ff` changes no existing test file)
- **Skipped tests**: none

---

## Fix Plans

### Fix 1: Bookkeeping of `tasks.md` and the spec (Cosmetic)

- **Root cause**: T5's commit `081a3ff` did not mark T5 done, and the Done-when boxes of T1, T2, T3 and T5 were never ticked. The `tasks.md:13` status line still reads "Draft, waiting for the owner's approval", although `469342c` approved it. T4's Preloader wait deviates from `tasks.md:375` without a note in `tasks.md`.
- **Fix task** (owner `product-owner`, at acceptance, docs only): set `### T5 ... [x]` (`tasks.md:399`). Tick the Done-when boxes of T1 (`:133-135`), T2 (`:229`), T3 (`:296-299`) and T5 (`:429-430`). Update the status line. Add one line under T4 saying the loading scenario waits for the Preloader's bar (`E:100`), because a loading scene is not active. Set GV-01 to GV-13 to `Verified` in `spec.md` § Requirement Traceability.
- **Priority**: Cosmetic. It changes no behaviour and no test, and it does not block the release.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| GV-01 to GV-13 | Implementing | ✅ Verified (to be written into `spec.md` by Fix 1; the Verifier writes only this file) |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 13/13 ACs matched the spec outcome; 0 spec-precision gaps
**Sensor**: 11/11 mutations killed
**Gate**: backend 1013/1013, game unit 1781/1781, e2e 377/381 (4 load flakes, each passed alone twice), build exit 0

**What works**: one `v<version>` label from `game/package.json` on the loading bar, splash, login form and battle; fixed 8/4 px in the bottom-right corner; in the letterbox at 1280x720 and 390x844; 12 px on a phone; the Grove style values exactly as the spec names them; clicks pass through it to the canvas at 1024x768.

**Issues found**: Fix 1 (bookkeeping, Cosmetic).

**Next steps**: product-owner acceptance, with Fix 1; then the `gitops` release `v0.4.1`. The coverage in `coverage/` ran at `081a3ff`. The release commit changes `game/package.json`, which the docs-only rule of `.claude/agents/gitops.md` step 5 does not list, so gitops has to decide whether the version bump reuses these summaries or reruns the suites. The bump changes only the label text, and every test reads the version from `package.json`.
