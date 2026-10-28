# boss-map Validation

**Date**: 2026-10-28
**Spec**: `.specs/features/boss-map/spec.md`
**Diff range**: feature commits e9970d0 (T1), 3c02374 (T2), f090a33 (T3) and the fix 984a6e2 (G1-G3, `game/e2e/bossMap.spec.js` only). Verified tree: HEAD `91d5f21` of `main`. Between the iteration 1 tree (`dcbcf8e`) and HEAD, `game/src`, `game/public`, `game/e2e` and `PROMPTS_ASSETS_UI.md` changed only in `game/e2e/bossMap.spec.js` (+35, the fix) and in two unrelated unit test files (`talents.test.js`, `rarityFrames.test.js`). The map's production code is the same code verified in iteration 1. No backend change (spec: "No backend change").
**Verifier**: independent sub-agent (author != verifier), fresh context
**Iteration**: 2 of 3

**Result**: PASS

---

## Iteration History

| Iteration | Tree | Verdict | Gaps | Sensor |
| --------- | ---- | ------- | ---- | ------ |
| 1 | `dcbcf8e` | FAIL | G1 Major: P2 AC3 "image loads → no trail" not pinned (M8 survived); G2 Minor: 880 x 495 not asserted; G3 Minor: narrow-window edge case untested | 8/9 killed |
| 2 | `91d5f21` (fix `984a6e2`) | see the verdict line above | none blocking (2 visual spec-precision notes kept) | 7/7 non-equivalent killed, 1 equivalent |

---

## Task Completion

| Task | Commit | Status | Notes |
| ---- | ------ | ------ | ----- |
| T1 Stop states | e9970d0 | ✅ Done | `game/src/domain/campaign/bossMap.js`, `campaignSession.mapPosition()` |
| T2 The map | 3c02374 | ✅ Done | `farmView.js`, `mapLayout.js`, `HeroUi.js`, `ClickerGame.js`, `style.css` |
| T3 e2e and the prompt check | f090a33 | ✅ Done | `e2e/bossMap.spec.js`, `e2e/farm.spec.js` adapted, `src/mapPrompt.test.js` |
| Fix G1-G3 | 984a6e2 | ✅ Done | new e2e `game/e2e/bossMap.spec.js:78`; fallback scenario now forces a 404 (`:60`) |

Housekeeping for the orchestrator: the tasks.md header still says `Status: In progress` and the spec traceability table still says `Specify / Pending`.

---

## Gate Check

- **Gate command** (Build, tasks.md): `cd game && npm test && npm run build && npm run test:e2e`. Run here as `npm install` (there is no committed lock file; `package-lock.json` is gitignored), `npx vitest run`, `npm run build`, then `npx playwright test e2e/bossMap.spec.js e2e/farm.spec.js` through a throwaway config `game/playwright.verifier2.config.js`. That config imported `./playwright.config.js` and set port 5193, `workers: 1` and `reuseExistingServer: false`, because another Verifier was running Playwright on 5174 at the same time. It was deleted afterwards.
- **Unit (Vitest)**: 1248 tests in 65 files. **1245 passed, 3 failed**, 0 skipped. The 3 failures are the known ones in `game/src/adapters/phaser/ClickerGame.test.js` › `ClickerGame farm mode` ("a win refused as too fast…", "a win lost to a network failure…", "a refused win ends the farm…"). They come from `9e11bf9` and touch no map code. **Not caused by boss-map.** The map test files (`bossMap`, `farmView`, `HeroUi`, `campaignSession`, `mapPrompt`) pass 158/158.
- **Build**: `npm run build` exit 0 (chunk-size warning only).
- **e2e (Playwright, chromium, 1 worker)**:
  - `e2e/bossMap.spec.js`: **6/6 passed** (5 before the fix + the new loaded-map scenario).
  - `e2e/farm.spec.js`: **6/9 passed** in the combined run. The failures were:
    - `farm.spec.js:109` "a win too soon after the previous one…" (`Expected: 2, Received: 5`): known, from `9e11bf9`. **Not caused by boss-map.**
    - `farm.spec.js:82` "the chapter boss pays ten wins a day…": it **passed when re-run alone** (`farm.spec.js:61 :82` re-run: `:82` ✓). This is a flake under the load of a concurrent Verifier. It is the e2e of P1 AC8 and it passes.
    - `farm.spec.js:61` "a won farm fight reports the win, shows the dropped card…": it failed again alone at `farm.spec.js:79`, `expect(backend.cardsOf('yan').copies['kael:0']).toBe(2)` → `Received: 3`. It passed in iteration 1. Every map-related step before it passes: the click on `farm-entry-miniboss-1` closes the panel and starts `Rever chefe: Miniboss 1`, and the farm call body is `{ boss: { kind: 'MINIBOSS', stage: 1 }, outcome: 'CLEARED' }`. Only the card-copy count fails. That count comes from the "pay drops on every Farm boss win" loop of `9e11bf9` and depends on how many wins land before the assertion. No map code was changed since iteration 1. **Not caused by boss-map**: it belongs with the same `9e11bf9` farm-mode fix as `:109`.
- **Test count delta (feature + fix)**: unit +32 (unchanged since iteration 1); e2e +6 in `bossMap.spec.js` (+1 in this iteration). No test was deleted or weakened. The fix only adds a `page.route` 404 to the fallback scenario, which makes it independent of a local copy of the art.

---

## Spec-Anchored Acceptance Criteria

### P1: Chapter map

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | WHEN Rever chefes opens THEN map titled, 10 numbered stops + boss, in path order | `data-testid="farm-map"`, title `Caminho do Capítulo <n>`, labels 1..10 then the boss | `game/src/adapters/phaser/views/farmView.test.js:16` - `toBe('Caminho do Capítulo 2')`; `farmView.test.js:23` - `toHaveLength(11)` plus the label list; `game/src/domain/campaign/bossMap.test.js:13` - ids in path order; `game/src/adapters/phaser/HeroUi.test.js:776` - `'Caminho do Capítulo 3'`; `game/e2e/bossMap.spec.js:39,41` - `toHaveText('Caminho do Capítulo 1')`, `toHaveCount(11)` | ✅ |
| 1a | Stop text and accessible name (assumptions) | `<n>` / `Chefe`; `Miniboss <n>` / `Chefe do capítulo` | `farmView.test.js:32-33` - `'Miniboss 10'`, `'Chefe do capítulo'`; `game/e2e/farm.spec.js:45-48`; `game/e2e/bossMap.spec.js:42-43` | ✅ |
| 2 | WHILE in the farm list THEN `data-state="defeated"` as a button | `defeated`, `<button>`, `farm-entry-*` | `farmView.test.js:39` - the first 3 are `'defeated'`; `farmView.test.js:51` - `tagName` `'BUTTON'` | ✅ |
| 3 | WHILE next boss THEN `data-state="current"`, highlighted, not clickable | `current`, a `DIV`, no `onPick` | `farmView.test.js:39` (index 3 `'current'`), `:52` `'DIV'`, `:83` `onPick` `not.toHaveBeenCalled()` | ✅ (⚠️ "highlighted" is CSS only (the pulse in `style.css`); it is a visual spec-precision note, not testable by assertion) |
| 4 | WHILE neither THEN `data-state="locked"`, fog + lock, not clickable | `locked`, a lock mark, no `onPick` | `farmView.test.js:39` (7 x `'locked'`), `:61-63` (`.map-lock` only on the locked stop), `:83`; `game/e2e/bossMap.spec.js:50-51` - a forced click on `map-node-miniboss-8` keeps the map open | ✅ (⚠️ "fog" is CSS `backdrop-filter`; it is a visual spec-precision note) |
| 5 | WHEN a defeated stop is clicked THEN the farm fight starts as the row did | `onPick({ kind, stage })` → close + `startFarm` | `farmView.test.js:73` - `onPick.mock.calls` `toEqual([[{kind:'MINIBOSS',stage:2}],[{kind:'CHAPTER_BOSS'}]])`; `HeroUi.test.js:797` - `startFarm` `toHaveBeenCalledWith({kind:'MINIBOSS',stage:2})`; `game/e2e/bossMap.spec.js:55-56` - panel hidden, `.stage-hud` `'Rever chefe: Miniboss 2'` | ✅ |
| 6 | WHEN at stage 4 (1-3 beaten) THEN 1-3 defeated, 4 current, the rest locked | the exact 11-state vector | `bossMap.test.js:21`; `farmView.test.js:39`; `HeroUi.test.js:778`; `game/e2e/bossMap.spec.js:40` - `toEqual(['defeated','defeated','defeated','current',...Array(7).fill('locked')])` | ✅ |
| 7 | WHEN at the chapter boss THEN 1-10 defeated, the boss current | `[...10 x defeated, 'current']` | `bossMap.test.js:33`; `farmView.test.js:45` | ✅ |
| 8 | WHILE the boss has 0 wins THEN disabled with `0 vitórias restantes hoje` | exact text, `disabled` | `farmView.test.js:93-94`; `game/e2e/farm.spec.js:93-94` - `toContainText('0 vitórias restantes hoje')`, `toBeDisabled()` (passes alone, see Gate) | ✅ |
| 9 | WHEN nothing is beaten THEN the map + `Nenhum chefe derrotado ainda.` | exact text, map present | `farmView.test.js:110`; `HeroUi.test.js:788`; `game/e2e/bossMap.spec.js:111-112` | ✅ |
| 10 | Opening pauses, closing resumes | `paused` true, then false | `HeroUi.test.js:777` - `pause` `toHaveBeenCalledTimes(1)`; `game/e2e/bossMap.spec.js:119,123` - `scene.paused` `toBe(true)` / `toBe(false)` | ✅ |

### P2: Painted map and fallback

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Background `assets/ui/boss-map.jpg` at 880 x 495 | exact `src`; 880 x 495 | `farmView.test.js:134` - `src` `toBe('assets/ui/boss-map.jpg')`; `game/src/mapPrompt.test.js:14`; **new** `game/e2e/bossMap.spec.js:104` - `expect(roomy).toEqual([ 880, 495 ])` with room to spare; `bossMap.spec.js:83` - `.farm-map-image` `toBeVisible()` | ✅ (G2 closed; M10 killed) |
| 2 | IF the image fails THEN gradient + dashed trail through the 11 stops | `is-fallback`, trail visible, the table points | `farmView.test.js:143-147` - `is-fallback` true, polyline from `'10,84'` to `'84,16'`; `game/e2e/bossMap.spec.js:60,64-65` - forced 404, `toHaveClass(/is-fallback/)`, `.farm-trail` `toBeVisible()` | ✅ (M14 killed) |
| 3 | WHEN the image loads THEN no trail | trail not drawn | **new** `game/e2e/bossMap.spec.js:79,84-85` - the image is served via `page.route`, `not.toHaveClass(/is-fallback/)`, `.farm-trail` `toBeHidden()`; `farmView.test.js:135` | ✅ (G1 closed; M8 killed at `:85`) |
| 4 | Stops at the table positions as % of the map | the 11 spec points | `farmView.test.js:126` - `style.left` `'10%'` and the full `MAP_STOPS` equality; `game/e2e/bossMap.spec.js:72-75` - measured centres `toBeCloseTo(0.1 / 0.84 / 0.84 / 0.16, 1)`; `mapPrompt.test.js:25` ties `MAP_STOPS` to the prompt table | ✅ |
| 5 | IF a stage has no position THEN a plain button below the map | in `.farm-extra`, a button, still farmable | `farmView.test.js:153-155`, `:165` `onPick` `{kind:'MINIBOSS',stage:11}`, `:169` no `.farm-extra` when all fit | ✅ |
| 6 | `PROMPTS_ASSETS_UI.md` holds the English prompt: 11 positions, stop look, `boss-map.jpg` | file name + 11 rows | `mapPrompt.test.js:15` - `toContain('boss-map.jpg')`; `mapPrompt.test.js:25` - rows equal `MAP_STOPS`; `mapPrompt.test.js:30-31` | ✅ |

**Status**: 16/16 ACs matched the spec outcome. Two visual spec-precision notes (P1 AC3 "highlighted", P1 AC4 "fog") are CSS-only looks that no assertion can pin; they are left for UAT.

---

## Edge Cases

- [x] Empty list at stage 1: stop 1 `current`, the rest `locked`. `bossMap.test.js:39`, `game/e2e/bossMap.spec.js:112`
- [x] Completed campaign: chapter boss `defeated`, nothing `current`. `bossMap.test.js:49-50`
- [x] Window narrower than the map: scales with the same ratio. **New**: `game/e2e/bossMap.spec.js:94-95` - `expect(width).toBe(Math.min(880, room))` and `|height - width * 9/16| <= 1`. A probe of the default layout (1280 x 720 viewport, 1024 px hero panel) measured `room = 868`, `map = 868 x 488`. So this assertion really runs the narrow branch, and `:104` runs the roomy one. G3 is closed; M11 and M12 are killed.
- [x] (extra) a beaten stop that is also the next boss stays `defeated`. `bossMap.test.js:54` (M13 killed)

---

## Discrimination Sensor

Scratch: a copy of `game/` (without `node_modules`, `dist`, `test-results`, `coverage`) and `PROMPTS_ASSETS_UI.md` in the session scratchpad, with `node_modules` linked by a junction and a Playwright config on port 5194 (1 worker, no server reuse). A second git worktree was refused by the agent sandbox, so the temp-copy fallback of validate.md was used; `git stash` was never used. Each mutant was applied to the copy and run, and the copy file was restored from a byte-identical backup (hash checked) before the next mutant. Control run on the unmutated copy: unit map tests 158/158, `bossMap.spec.js` 6/6. Unit set: `bossMap`, `farmView`, `HeroUi`, `campaignSession`, `mapPrompt` (158 tests).

| Mutation | File:line | Description | Tests run | Killed? |
| -------- | --------- | ----------- | --------- | ------- |
| M8 (re-run) | `game/public/style.css:2075-2076` `.farm-trail` | `display: none` → `display: block` (trail drawn over the painted map) | e2e | ✅ Killed, `bossMap.spec.js:85` `toBeHidden()` |
| M10 CSS size | `game/public/style.css:2059` `.farm-map` | `width: 880px` → `860px` | e2e | ✅ Killed, `bossMap.spec.js:94` |
| M11 CSS ratio | `game/public/style.css:2061` `.farm-map` | `aspect-ratio: 16 / 9` → `4 / 3` | e2e | ✅ Killed, `bossMap.spec.js:95` |
| M12 CSS narrow window | `game/public/style.css:2060` `.farm-map` | removed `max-width: 100%` (the map no longer shrinks) | e2e | ✅ Killed, `bossMap.spec.js:94` |
| M13 stop states | `game/src/domain/campaign/bossMap.js:29-36` | `current` checked before `defeated` (a beaten next boss shows as current, not clickable) | unit | ✅ Killed, 5 failed (`bossMap.test.js` "keeps a stop defeated…", `farmView.test.js` onPick ×2, `HeroUi.test.js` ×2) |
| M14 fallback switch | `game/src/adapters/phaser/views/farmView.js:67` | `image.addEventListener('error', …)` → `'load'` | unit + e2e | ✅ Killed: unit 1 failed (`farmView.test.js` fallback); e2e 2 failed (`bossMap.spec.js:64`, `:83`) |
| M15 stop states (completed) | `game/src/domain/campaign/bossMap.js:18` | `position.completed ? null :` → `false ? null :` | unit | ⚪ Survived, **equivalent**: when the campaign is completed, the chapter boss is in the farm list and `defeated` wins over `current` (`bossMap.js:29`), so no reachable input changes the output. Not a test gap. |

Iteration 1 mutants M1-M7 and M9 hit production code and unit tests that have not changed since; they were not re-run.

**Sensor depth**: lightweight plus (standard feature, not P0)
**Killed**: 7/7 non-equivalent mutants killed; 1 equivalent mutant (M15) set aside
**Isolation**: `git status --porcelain` of the worktree was empty before the sensor and is empty after cleanup. The scratch copy and the throwaway Playwright config were deleted.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ the fix adds one e2e scenario and one route helper; no production change |
| Surgical changes | ✅ `984a6e2` touches only `game/e2e/bossMap.spec.js` |
| No scope creep | ✅ (iteration 1 note on `HeroUi.js` `DEFAULT_POSITION` still stands as acceptable and tested) |
| Matches patterns | ✅ `page.route` + `mockBackend`, the same helpers as the other scenarios |
| Spec-anchored outcome check | ✅ P2 AC3 now asserts the outcome (trail hidden), not a proxy class |
| Per-layer Coverage Expectation met | ✅ domain: every branch; views: states, texts, positions, events; e2e: open, states, click, fallback, loaded, size, narrow, empty, pause |
| Every test maps to a spec requirement | ✅ the new scenario maps to P2 AC1, P2 AC3 and the narrow-window edge case |
| Documented guidelines followed | ✅ `CLAUDE.md`, tasks.md Test Coverage Matrix |

Observation (not a gap): the narrow-window assertion depends on the current panel layout leaving less than 880 px of room (868 today). If the hero panel ever widens past 880 px of inner room, `bossMap.spec.js:94` silently tests only the roomy branch. A fixed narrow parent width set inside the test, like the 1200 px one at `:99`, would make it independent of the layout.

The art file `game/public/assets/ui/boss-map.jpg` still does not exist, so players see the fallback until the owner adds it. The e2e no longer depends on its presence.

---

## Fix Plans

None blocking. Optional hardening: pin the narrow case with an explicit parent width (see the observation above).

Unrelated, to route to their own fix: the 3 `ClickerGame farm mode` unit tests, `farm.spec.js:109` and now `farm.spec.js:61` (the card-copy count at `:79`) all come from the drop payout of `9e11bf9`.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| MAP-01 (P1 AC 1-4, 6-7) | ✅ Verified (it. 1) | ✅ Verified |
| MAP-02 (P1 AC 5, 8-10) | ✅ Verified (it. 1) | ✅ Verified |
| MAP-03 (P2 AC 1-5) | ❌ Needs Fix | ✅ Verified |
| MAP-04 (P2 AC 6) | ✅ Verified (it. 1) | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 16/16 ACs match the spec outcome. There are 2 visual spec-precision notes (highlight, fog) for UAT.
**Sensor**: 7/7 non-equivalent mutants killed (M8 re-run plus 5 fresh: size, ratio, narrow, stop-state order, fallback switch), and 1 equivalent mutant
**Gate**: unit 1245/1248 (3 known `9e11bf9` failures); build OK; e2e `bossMap` 6/6; `farm` 6/9 (`:109` and `:61` from `9e11bf9`, `:82` a load flake that passes alone)

**What works**: everything from iteration 1. The loaded painted map hides the dashed trail. The map is 880 x 495 with room to spare and scales at 16:9 in the narrower real panel (868 x 488). The fallback is now forced with a 404, independent of local art.

**Issues found**: none blocking. `farm.spec.js:61` now also fails on the `9e11bf9` drop count; route it with the other farm-mode failures.

**Next steps**: orchestrator housekeeping (tasks.md status, spec traceability), then the release report and the deploy check per `CLAUDE.md`.
