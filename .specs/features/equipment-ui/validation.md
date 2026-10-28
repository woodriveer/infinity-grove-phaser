# equipment-ui Validation

**Date**: 2026-10-28
**Spec**: `.specs/features/equipment-ui/spec.md`
**Diff range**: `99294a5^..9afa052` (feature commits 99294a5 T1, 72c4caa T2, 79de738 T3, 459053e T4, 4075898 T5, 1ef36a9 T6, fix commits 4066eee for G1 and 9afa052 for G3); verified on the committed tree at `91d5f21` (HEAD of `main`). Since iteration 2 (`4066eee`) the only change to a feature file is `game/src/rarityFrames.test.js` (+5 -1, commit 9afa052); the other files changed in `4066eee..91d5f21` belong to other features (boss-map e2e, talents test, specs).
**Verifier**: independent sub-agent (author != verifier), fresh context
**Iteration**: 3 of 3
**Result**: PASS

---

## Iteration History

| Iteration | HEAD | Verdict | Summary |
| --------- | ---- | ------- | ------- |
| 1 | `dcbcf8e` | rejected | 32/33 ACs; sensor 12/14 killed. G1: the reduced-motion test searched the stylesheet to EOF, so deleting `animation: none` from the EPIC (M13) or LEGENDARY (M14) rule survived. G2 (minor): no test that a refined piece's tile shows the new `+<refine>` and keeps its frame. |
| 2 | `4066eee` | rejected | G1 fixed for EPIC tile and LEGENDARY shimmer: M13 and M14 killed. The test did not pin the EPIC light sweep (`[data-effect="fantasy"]::before`): M15 survived (G3, AC 13). Sensor 7/8 killed. G2 still open (non-blocking). |
| 3 | `91d5f21` | accepted | G3 fixed by 9afa052: M13, M14, M15 killed, plus 2 fresh CSS mutants on the same block (sparkles `::after`, LEGENDARY tile) and 6 fresh behaviour mutants. 33/33 ACs. Sensor 11/11 killed. G2 still open (non-blocking). |

---

## Task Completion

| Task | Commit | Status | Notes |
| ---- | ------ | ------ | ----- |
| T1 Leader attribute lines | 99294a5 | Done | `game/src/domain/equipment/leaderStats.js` |
| T2 Attribute panel | 72c4caa | Done | `renderLeaderStats`, `HeroUi.leaderStatsFor` |
| T3 Piece tile with rarity frame | 79de738 | Done | Reduced-motion CSS `game/public/style.css:1956-1972`; its test `game/src/rarityFrames.test.js:32-49` now pins every selector of the block |
| T4 Icon bag, worn slots and tooltip | 459053e | Done | |
| T5 Transfer a set | 4075898 | Done | |
| T6 Transfer flow and e2e | 1ef36a9 | Done | |
| Fix G1 | 4066eee | Done | Cuts out the frames' own `@media (prefers-reduced-motion: reduce)` block |
| Fix G3 | 9afa052 | Done | Adds `still('.piece-tile[data-effect="fantasy"]::before')` (no trailing ` {`, so it matches the list entry `::before,`) and `still('.piece-tile.rarity-legendary,')`, each `toContain('animation: none')` |

No backend file changed in the range.

---

## Gate Check

- **Install**: `cd game && npm install` (no lock file is committed): exit 0, 0 vulnerabilities; `git status --porcelain` empty afterwards.
- **Unit** (`cd game && npx vitest run`): 65 files, 1248 tests: 1245 passed, 3 failed, 0 skipped. The 3 failures are `src/adapters/phaser/ClickerGame.test.js` "ClickerGame farm mode" (`a win refused as too fast pays nothing but keeps the farm going`, `a win lost to a network failure keeps the loop going`, `a refused win ends the farm without a notice and reloads the farm state`), known since 9e11bf9; **not caused by equipment-ui** and not counted. All 181 tests of the 7 equipment-ui test files pass.
- **Build** (`npm run build`): exit 0 (chunk-size warning only).
- **e2e**: a temporary `game/playwright.verify3.config.js` importing `./playwright.config.js` with port 5195, `workers: 1`, `reuseExistingServer: false` (deleted afterwards); `npx playwright test -c playwright.verify3.config.js e2e/equipmentUi.spec.js e2e/equipment.spec.js --retries=0`: exit 0, **10 passed**, 0 failed (2.7 min). Vite logs `File failed: atlasjson "coin"` (asset absent from the worktree), unrelated.
- **Test count**: 1248 unit tests, same as iterations 1 and 2. Fix 9afa052 added assertions inside the existing `it` and removed none: the old single `::after {` check is kept inside the new list, plus `::before` and `.piece-tile.rarity-legendary,`. No assertion weakened.

---

## Spec-Anchored Acceptance Criteria

Re-derived from scratch at `91d5f21`; every cited line was re-read by script (`file:line` printed from the tree). Paths relative to `game/`.

### P1: Leader attribute panel (EQU-01, EQU-02)

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | panel `leader-stats` titled `Atributos de <leader>` | `src/adapters/phaser/HeroUi.test.js:552` `toBe('Atributos de Hero kael')`; `e2e/equipmentUi.spec.js:41` `toHaveText('Atributos de Kael Raizférrea')` | ok |
| 2 | 9 named lines in order | `src/domain/equipment/leaderStats.test.js:13` ids `toEqual([...])`; `src/domain/equipment/leaderStats.test.js:22` `'Elemento: Fogo'` | ok |
| 3 | 3 talent break lines | `src/domain/equipment/leaderStats.test.js:87` `'Quebra de defesa física: 3'`; `:89` `'Quebra de resistência a crítico: 8'`; `:95` zeros | ok |
| 4 | Kael 0 stars: `1.0`, `10%`, `x2`, `0%`, `0%`, `0s`, `0s` | `src/domain/equipment/leaderStats.test.js:24` `'Dano de clique: 1.0'` ... `:30` `'Tempo extra de chefe: 0s'` (M25 killed here) | ok |
| 5 | Lyra 3 stars: `1.4`, `40%`, `x2.5` | `src/domain/equipment/leaderStats.test.js:37` `'Dano de clique: 1.4'`; `:39` `'Dano crítico: x2.5'` | ok |
| 6 | weapon 3.3 + ring 12 % -> `4.8` | `src/domain/equipment/leaderStats.test.js:45` `toBe('Dano de clique: 4.8')` | ok |
| 7 | equip / remove / refine update the panel live | `src/adapters/phaser/HeroUi.test.js:583` `'Dano de clique: 4.3'` (detail still open `:584`); `:596` `'1.0'`; `:608` `'4.6'`; `e2e/equipmentUi.spec.js:51` `'Dano de clique: 1.1'` | ok |
| 8 | new leader name and numbers | `src/adapters/phaser/HeroUi.test.js:622` `'Atributos de Hero lyra'`; `:623` `'Dano de clique: 1.0'` | ok |
| 9 | `9s` and `5s` | `src/domain/equipment/leaderStats.test.js:73` `'Tempo extra de miniboss: 9s'`; `:74` `'Tempo extra de chefe: 5s'` | ok |
| 10 | no leader, no panel | `src/adapters/phaser/HeroUi.test.js:643` `toBeNull()`; `src/adapters/phaser/views/equipmentView.test.js:97` | ok |

### P1: Icon bag with tooltip (EQU-03, EQU-04)

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | tile `equip-piece-<id>`, slot icon, `rarity-<r>`, `data-rarity` | `src/adapters/phaser/views/pieceTile.test.js:12` testid; `:14` `'RARE'`; `:36` icon srcs `assets/ui/slot-<slot>.png` | ok |
| 2 | `+3`, nothing at +0 | `src/adapters/phaser/views/pieceTile.test.js:40` `toBe('+3')`; `:41` `toBeNull()` (M27 killed here); `e2e/equipmentUi.spec.js:65` | ok |
| 3 | tooltip title, weapon line, affixes, location | `src/adapters/phaser/views/equipmentView.test.js:121` `'Raro Arma +3'`; `:132` `'Equipado em Hero kael'` (M23 killed); `e2e/equipmentUi.spec.js:78-80` `'Épico Amuleto +3'`, `'Dano de clique +9%'`, `'Na mochila'` | ok |
| 4 | leave hides the tooltip | `src/adapters/phaser/views/equipmentView.test.js:149` `toBeNull()`; `src/adapters/phaser/views/pieceTooltip.test.js:53`; `e2e/equipmentUi.spec.js:104` `toHaveCount(0)` | ok |
| 5 | no button | `src/adapters/phaser/views/equipmentView.test.js:124` `querySelector('button')).toBeNull()`; `e2e/equipmentUi.spec.js:81` | ok |
| 6 | click opens detail with actions | `src/adapters/phaser/views/equipmentView.test.js:157` hover does not select, `:160` click does; `e2e/equipmentUi.spec.js:92-93` `piece-detail`, `piece-sell` visible | ok |
| 7 | worn tiles; empty `vazio`, `is-empty`, no click | `src/adapters/phaser/views/equipmentView.test.js:42` `'vazio'`; `src/adapters/phaser/views/pieceTile.test.js:74` `is-empty`, `:76` `'vazio'` | ok |
| 8 | icon failure: drawn mark, still clickable | `src/adapters/phaser/views/pieceTile.test.js:55` img gone; `:57` `onClick` called once | ok |
| 9 | empty bag text | `src/adapters/phaser/views/equipmentView.test.js:23` exact text | ok |
| 10 | `Mochila (<n>)` | `src/adapters/phaser/views/equipmentView.test.js:53` `'Mochila (1)'`; `e2e/equipmentUi.spec.js:66` `'Mochila (4)'` | ok |
| 11 | gems 0..4 | `src/adapters/phaser/views/pieceTile.test.js:24` `toEqual([['0',0],...,['4',4]])` | ok |
| 12 | only EPIC `data-effect="fantasy"` | `src/adapters/phaser/views/pieceTile.test.js:30` `[null,null,null,'fantasy',null]`; `e2e/equipmentUi.spec.js:63-64` | ok |
| 13 | reduced motion: EPIC (aura, sweep, sparkles) and LEGENDARY frames still, steady glow | `src/rarityFrames.test.js:40-43` EPIC tile and LEGENDARY `::before` each `toContain('animation: none')` and `toContain('box-shadow')`; `src/rarityFrames.test.js:45-47` fantasy `::before` (sweep) and `::after` (sparkles) each `toContain('animation: none')`; `src/rarityFrames.test.js:48` `still('.piece-tile.rarity-legendary,')` `toContain('animation: none')`. Lookup confined to the frames' own media block (`:34-38`). M13, M14, M15, M21, M22 killed | ok |
| 14 | rarities differ by shape | `src/rarityFrames.test.js:15-21` five distinct frame rules; `src/adapters/phaser/views/pieceTile.test.js:24` gems differ | ok |
| 15 | rarity in words | `src/adapters/phaser/views/equipmentView.test.js:121`; `:266` detail `'Raro Arma +3'`; `e2e/equipmentUi.spec.js:78` | ok |

### P2: Transfer a set (EQU-05, EQU-06)

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | `Transferir conjunto` only when worn + another owned hero | `src/adapters/phaser/views/equipmentView.test.js:185` text; `:187` null for orina | ok |
| 2 | one `Para <nome>` per other owned hero | `src/adapters/phaser/views/equipmentView.test.js:201` `'Para Hero lyra'`; `:212` none for an unowned hero | ok |
| 3 | order Arma, Armadura, Anel, Amuleto | `src/application/equipment/equipmentCollection.test.js:224` exact call order from a shuffled state | ok |
| 4 | pieces on target, source empty, displaced in bag, notice | `src/adapters/phaser/HeroUi.test.js:689` `'Mochila (1)'`; `:699` `'Conjunto transferido para Hero lyra'`; `e2e/equipmentUi.spec.js:114-119` | ok |
| 5 | panel shows new numbers | `src/adapters/phaser/HeroUi.test.js:713` `'Dano de clique: 4.0'` (was `1.0` at `:709`); `e2e/equipmentUi.spec.js:120` | ok |
| 6 | failure stops, reloads, error text | `src/application/equipment/equipmentCollection.test.js:278` 2 equip calls, `:279` list read twice (M26 killed); `src/adapters/phaser/HeroUi.test.js:743` `'Não foi possível concluir a ação.'`, `:744` reload | ok |
| 7 | every equipment button disabled while running | `src/adapters/phaser/HeroUi.test.js:725` `every(disabled)).toBe(true)`; `:732` re-enabled | ok |
| 8 | one owned hero: no button | `src/adapters/phaser/views/equipmentView.test.js:193` `toBeNull()` (M28 killed) | ok |

**Status**: 33/33 ACs matched to their spec outcome. No spec-precision gap.

---

## Edge Cases

- [x] Source and target wore the same slot: target's old piece in the bag (`src/application/equipment/equipmentCollection.test.js:251-252`, `e2e/equipmentUi.spec.js:119`).
- [x] Source wears only a ring: one request (`src/application/equipment/equipmentCollection.test.js:238`).
- [x] Tooltip kept inside the window (`src/adapters/phaser/views/pieceTooltip.test.js:11-20`, M24 killed; `e2e/equipmentUi.spec.js:87-88`).
- [ ] A refine raises a piece: tile shows the new `+<refine>`, border unchanged. Still no direct test (G2). Judged **non-blocking**, unchanged since iteration 1: the tile is a pure render of the server list on every `render_equipment` (`src/adapters/phaser/HeroUi.js:356-370`, no cached tile), `+<refine>` is pinned (`src/adapters/phaser/views/pieceTile.test.js:40`, M27 killed) and the class depends on rarity alone (`src/adapters/phaser/views/pieceTile.js:16`); the refine flow re-reads the list (`src/adapters/phaser/HeroUi.test.js:608`).

---

## Discrimination Sensor

Scratch: a temporary `git worktree` (`<scratchpad>/sensor3`, detached at `91d5f21`, `node_modules` junctioned to this worktree's). `style.css` in the scratch has CRLF endings (2198 CR bytes); mutants were applied by a node script with `\r?\n`-aware regexes that each had to match exactly once, and every file was restored byte for byte (Buffer compare) after its run. Baseline in the scratch, no mutant: 7 files, 181/181 passed. Each mutant ran `npx vitest run` on the 7 feature test files. Junction removed (`rmdir`, target intact), scratch worktree removed with `git worktree remove --force`; `git status --porcelain` of the real worktree empty before and after.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| 13 (re-run) | `public/style.css:1958` | `animation: none` deleted from the reduced-motion EPIC tile rule (aura keeps pulsing) | Killed (1: `stills the animations under prefers-reduced-motion...`) |
| 14 (re-run) | `public/style.css:1969` | `animation: none` deleted from the LEGENDARY rule (shimmer keeps spinning) | Killed (1, same test) |
| 15 (re-run) | `public/style.css:1962` | `.piece-tile[data-effect="fantasy"]::before,` dropped from the reduced-motion rule (EPIC light sweep keeps animating) | **Killed** (1, same test; survived in iteration 2) |
| 21 (fresh) | `public/style.css:1963` | `::after` dropped from that rule (EPIC sparkles keep twinkling) | Killed (1, same test) |
| 22 (fresh) | `public/style.css:1967` | `.piece-tile.rarity-legendary,` dropped from the LEGENDARY reduced-motion list | Killed (1, same test) |
| 23 (fresh) | `src/adapters/phaser/views/pieceTooltip.js:14` | location ternary swapped: a worn piece reads `Na mochila`, a bagged one `Equipado em` | Killed (2) |
| 24 (fresh) | `src/adapters/phaser/views/pieceTooltip.js:28` | flip condition `above >= MARGIN` -> `above < MARGIN` | Killed (3) |
| 25 (fresh) | `src/domain/equipment/leaderStats.js:23` | click damage `toFixed(1)` -> `one()` (drops the kept trailing zero: `1` not `1.0`) | Killed (7) |
| 26 (fresh) | `src/application/equipment/equipmentCollection.js` (`transferSet` catch) | `await load()` removed: a failed transfer no longer reloads the list | Killed (2) |
| 27 (fresh) | `src/adapters/phaser/views/pieceTile.js:38` | `refine > 0` -> `refine >= 0` (tile shows `+0`) | Killed (1) |
| 28 (fresh) | `src/adapters/phaser/views/equipmentView.js:106` | `owned.length > 1` -> `>= 1` (`Transferir conjunto` with one owned hero) | Killed (1) |

**Sensor depth**: expanded (transfer writes server state): 3 re-run + 2 fresh CSS + 6 fresh behaviour mutants on feature JS.
**Sensor outcome**: 11/11 killed, 0 survived.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ok |
| Surgical changes (fix 9afa052 touched only the test file, +5 -1) | ok |
| No scope creep | ok |
| Matches patterns (ADR 0007 layers) | ok |
| Spec-anchored outcome check | ok, 33/33 |
| Per-layer Coverage Expectation met | ok |
| Every test maps to a spec requirement | ok |
| Documented guidelines followed: `CLAUDE.md`, ADR 0007 | ok |

Note (non-blocking): the fix checks `::before` by a selector string without the trailing ` {` so it matches the list entry; it works but depends on the selector list staying in the frames' media block, which the block lookup at `src/rarityFrames.test.js:34-38` already assumes.

---

## Fix Plans

### Fix 2 (G2, non-blocking, carried over): pin the refine edge case on the tile

- **Fix task**: in `HeroUi.test.js`, refine a RARE piece from +0 to +1, go back to the list and assert the tile reads `+1` and keeps `rarity-rare` / `data-gems="2"`.
- **Priority**: Minor; does not block this verdict.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| EQU-01 | Verified | Verified |
| EQU-02 | Verified | Verified |
| EQU-03 | Needs Fix | Verified |
| EQU-04 | Verified | Verified |
| EQU-05 | Verified | Verified |
| EQU-06 | Verified | Verified |

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 33/33 ACs matched; 0 spec-precision gaps
**Sensor**: 11/11 killed (M13, M14, M15 re-run; M21-M28 fresh)
**Gate**: unit 1245 passed / 3 failed (unrelated `ClickerGame farm mode`, since 9e11bf9); build exit 0; e2e 10/10 on port 5195

**What works**: the leader panel, the icon bag with rarity frames, tooltip and click, the set transfer and its failure path; the reduced-motion test now pins every selector of the frames' media block.

**Issues found**: G2 refine edge case still without a direct test (minor, non-blocking).

**Next steps**: optional fix task for G2; the 3 `ClickerGame farm mode` failures need their own fix outside this feature.
