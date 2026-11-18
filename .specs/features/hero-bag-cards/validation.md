# Hero Bag Cards Validation

**Verdict**: FAIL (round 1 of 3)
**Date**: 2026-11-18
**Spec**: `.specs/features/hero-bag-cards/spec.md`
**Diff range**: `d0b9fa8..b8afc93` (feature commits `77ea405` to `b8afc93`, T1 to T25). Excluded as other work: `4ce1835` (splash feature), `23381d0` (merge), `bb6fe3f` (graphify), `c11dd5c` (agents). Included although no task names it: `8ce6bc9` (equipment e2e expects the six rail buttons of BAG-38).
**Verifier**: independent sub-agent (author ≠ verifier); I wrote none of this feature's code or tests.

FAIL. All three full suites pass (backend 1013/1013, game unit 1759/1759, e2e 370/371 with one known load flake that passed alone twice), and all 41 ACs have test evidence at `file:line`. The sensor ran 20 mutants: 17 killed, 3 survived. Two of the survivors (G3, G9) are on the same player-visible rule: the Fundir tudo result line can name a skill that the cascade did not raise. One visible AC (BAG-39) has no e2e test. Every gap can be fixed with tests only; no production code has to change.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 to T24 | ✅ Done | `[x]` in `tasks.md`, one commit each (`c6f57c6` to `76f2dd6`) |
| T25 | ✅ Done (artifact) / ⚠️ not marked | `b8afc93` delivers `ui-review.html` round 3 APROVADO and the six gem PNGs, but `tasks.md:1949` still reads `[ ]` and its Done-when boxes (`:1985`, `:1986`) are unchecked |
| T17 to T20 | ✅ Done / ⚠️ | Task headers are `[x]`, but their Done-when boxes are still `[ ]` (`tasks.md:1503-1505`, `:1590-1591`, `:1686-1687`, `:1716-1717`) |

Other doc drift: the `tasks.md:13` Status line still says T23 to T25 "wait for the owner's approval" (Q9 was approved in `407a885`). The `design.md:4` Status still reads "Draft (waits for the owner's answers to Q1 to Q8)". Every requirement row in the spec traceability table (`spec.md:221-261`) still reads `Implementing`.

---

## Spec-Anchored Acceptance Criteria

Abbreviations: `BC` = `game/src/domain/heroes/bagCards.test.js`, `BV` = `game/src/adapters/phaser/views/bagView.test.js`, `FL` = `game/src/adapters/phaser/views/fusionLadderView.test.js`, `UI` = `game/src/adapters/phaser/HeroUi.test.js`, `API` = `game/src/adapters/http/heroesApi.test.js`, `HC` = `game/src/application/heroes/heroCollection.test.js`, `E` = `game/e2e/heroBagCards.spec.js`, `EH` = `game/e2e/heroes.spec.js`, `EA` = `game/e2e/heroAscension.spec.js`, `PC` = `backend/.../domain/PlayerCardsTest.kt`, `HS` = `backend/.../service/HeroServiceTest.kt`, `IT` = `backend/.../adapter/web/HeroControllerIT.kt`. Every cited test passed in this round's runs.

### P1: Centered rarity gems

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-01 | `.piece-gems` `left: 50%`, `translateX(-50%)`, `top: -5px`; row centre within 1 px of the tile centre on bag, slot and bulk-sell tiles | `E:379` `abs(gemsCentre - tileCentre) <= 1` for `equip-piece-m1` (`E:383`), `equip-slot-kael-WEAPON` (`E:384`) and bulk-sell mode (`E:402`); `E:380` `gems.y < tile.y` | ⚠️ Spec-precision gap: `top: -5px` is not pinned. Only "above the tile" is asserted, so mutant C5 (`top: -4px`) survived |
| BAG-02 | tile 60x60, gem count per rarity (`data-gems`), refine `+<n>` at `right: 2px; bottom: 1px` | `E:386` `data-gems` `'4'`; `E:387` `+2`; `E:390-391` `toHaveCSS('right','2px')`, `('bottom','1px')`; `E:398` 5 px from the tile edge in tile units; `E:414` 3 gems on the EPIC slot | ✅ PASS (60 px is the scale reference of `E:396`, not asserted on its own; COMMON to RARE counts are pre-existing and unchanged) |
| BAG-40 | gem 9x9 px, `column-gap: 6px`, LEGENDARY row 54 px, tips ≥ 2 px apart (2.27), tips inside the tile | `E:416-417` `toHaveCSS('width'/'height','9px')`; `E:419` `column-gap` `'6px'`; `E:426` row width 54 / 39 ±0.5; `E:437` turned width 12.73 ±0.5; `E:440` tip gap `>= 2`; `E:443-444` tips inside the tile | ✅ PASS (C3 killed) |

### P1: One card per hero

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-03 | one `bag-card-<id>` per hero in payload order inside `bag-list`; no `bag-entry-*` | `BV:11-13` testids in order, `bag-list`, no `bag-entry-`; `E:64` the five ids in order; `E:96` `bag-entry-` count 0 | ✅ PASS |
| BAG-04 | `_sprite.png` art, ribbon with the name, star badge `<stars>★` centred on the top edge | `BV:40-42` `2★`, `kael_sprite.png`, ribbon text; `E:69-73` | ⚠️ Spec-precision gap: "centered on the top edge" has no geometric assertion; only the UI review checks it |
| BAG-05 | `data-frame` + `frame-*`: wood 0-3, silver 4-6, gold 7-9 | `BC:11` `frameTier` at 0/3/4/6/7/9; `BV:49-52`; `E:68`, `:77`, `:82`, `:160`, `:343` | ✅ PASS |
| BAG-06 | badge `hero-stars` + `is-ascended` 4-6 / `is-exalted` 7-9 | `BV:58-62`; `E:79`, `:84` | ✅ PASS |
| BAG-07 | one chip per layer ≥ 1, ascending, `<s>★×<c>` | `BC:17`, `BC:39` `'0★×45'`; `BV:43` `['0★×45','1★×1','2★×2']`; `E:70`, `:189`, `:325` | ✅ PASS |
| BAG-08 | `bag-card-fuse-<id>` `Fundir` while a layer 0-8 has ≥ 3; never on `bag-detail-card-<id>` (D25) | `BV:68-70` (`Fundir`, null at 2/2, null at 9★×4); `E:71`, `:80`, `:161`, `:191`; `E:137` detail badge `toBeHidden()` | ✅ PASS (C2 killed) |
| BAG-09 | unowned card: disabled, `is-grey`, `wood`, art, ribbon, `Não encontrado`, no badge/chip/Fundir | `BV:76-82`; `E:90-93` | ✅ PASS |
| BAG-10 | click on an unowned card opens nothing | `BV:28-32` `onSelect` once, for Kael only; `E:104-107` no `bag-entry-detail` | ✅ PASS |
| BAG-11 | `.hero-window` `scrollHeight <= clientHeight`, 5 heroes × 10 layers, 1280x720 and 390x844 | `E:114` (Desktop Chrome 1280x720, `FULL_BAG` 45 on every layer, `E:118` 10 chips each); `E:123`, `:127` at 390x844 | ✅ PASS |

### P1: Fusion ladder

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-12 | the detail replaces the grid; `Voltar`; card (not clickable), `fusion-list`, `fusion-all`, `skill-list` with 3 rows | `FL:15-19` (card is a `DIV`, `Fundir tudo`, 3 `.skill-row`); `UI:203-218`; `E:135-140` | ✅ PASS |
| BAG-13 | rows: held layers ascending + t+1 at 0 copies when t ≤ 8 and c_t ≥ 3; 45/1/2 → 0,1,2; 3 blank → 0,1; one 9★ → 9 | `BC:47`, `:57`, `:62`, `:66`, `:72`; `FL:25`; `E:153` (no row 2), `E:165-167` (9★ only) | ✅ PASS (G1 killed) |
| BAG-14 | `.fusion-name` `<s>★`; progressbar 0/3/`aria-valuenow` min(c,3); fill 0%/33.333%/66.667%/100%; `<c>/3`; button `<s>★→<s+1>★` | `FL:26-27`, `FL:36-46`, `FL:53-54`; `BC:79`; `E:142-150` | ✅ PASS |
| BAG-15 | row button disabled below 3, enabled at ≥ 3 with no request | `FL:42`, `FL:47`; `UI:931`; `E:146`, `:151` | ✅ PASS |
| BAG-16 | 9★ row: `9★`, `Cópias: <c>`, `Estrela máxima: não pode ser fundida`, no bar, no button | `FL:70-74`; `E:165-167`; `EA:246` | ✅ PASS |
| BAG-17 | one `POST /heroes/<id>/fuse` `{"stars": s}`; redraw; `Nova carta: <nome> <s+1>★` + ` · <skill> no nível <level>` from 4★ | `UI:234-236`; `UI:281` `· Skill 1 no nível 2`, `UI:293` `· Skill 3 no nível 2`; `E:180-185` (1 request, body `{stars:0}`); `EA:53`, `EA:71` | ✅ PASS |
| BAG-18 | while a request runs every row button, Fundir tudo and the confirmation buttons are disabled; a second click sends nothing; Voltar and Fechar stay enabled | `UI:330-335` (every detail button disabled, `hero-back` shown, 1 call); `UI:1053-1057` (cascade); `FL:94-96`; `E:208-210` | ✅ PASS (G5, G6 killed). ⚠️ Spec-precision: no test asserts that `Fechar` (`hero-close`) is enabled during a request |
| BAG-19 | failure: `Não foi possível fundir as cartas.`, counts unchanged, no `fusion-result` | `UI:252-255`, `UI:307-309`; `E:268-270`; `EH:127`; `EA:272-284` | ✅ PASS |
| BAG-20 | Voltar shows the grid with the counts after every fusion | `UI:427-431`; `UI:443-450` (Voltar during the request); `E:189-191`, `E:325-327` | ✅ PASS |
| BAG-21 | the skill bar follows the answered hero without another `GET /heroes` | `UI:238`, `UI:267-269` (`list` called once), `UI:1036-1037`; `HC:90`; `E:183`, `E:321` | ✅ PASS (G10 killed) |
| BAG-22 | an answer after close or another screen draws nothing | `UI:465-466`, `UI:481-482`, `UI:1130` | ✅ PASS (not player-visible; unit only, as planned) |
| BAG-41 | `Fundindo...` on the sending button of that hero only; `is-busy`; `cursor: progress` only while busy; a button disabled for lack of copies keeps `not-allowed` | `FL:102-105`, `FL:111-114`, `FL:120-123`, `FL:129-130`; `UI:354-362`, `UI:375-377`, `UI:391`, `UI:405-415`, `UI:1075-1082`, `UI:1096-1098`; `E:211-215`, `E:222-226`, `E:244-249`, `E:254-257` | ✅ PASS (G7, C1 killed) |

### P1: Fundir tudo on the server

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-23 | one transaction under the row lock; cascade from 0★; 200 `{hero, fusions}` | `PC:231-236`; `HS:223-235` (stored copies); `IT:351-368` (200, `fusions` 22, `hero.*`, stored rows) | ✅ PASS (B1, B2, B4, B5 killed) |
| BAG-24 | 45/1/2 → 1★1 2★1 3★2, `stars` 3, 22; 27 → 3★1, 13; 8★7 + 9★1 → 8★1 9★3, 2; 19 683 → 9★1, 9 841; 3★×3 → 4★1, levels 2,1,1, 1 | `PC:231`, `:240`, `:248`, `:256`, `:264`; `HS:238-246` levels `[2,1,1]`; `IT:372-384` | ✅ PASS |
| BAG-25 | no other hero, wallet or leader changes | `PC:272-280`; `IT:387-407` (wallet 0/9/0, leader `kael`, Lyra 5) | ✅ PASS |
| BAG-26 | nothing to fuse (unowned included) → 409 `NOTHING_TO_FUSE`, no change | `PC:283-287` (code), `PC:290`; `HS:249-255` (bag unchanged); `IT:410-416` | ✅ PASS (B3 killed) |
| BAG-27 | unknown id → 404 `HERO_NOT_FOUND` | `HS:258-264`; `IT:419-423` | ✅ PASS |
| BAG-28 | unauthenticated → 401 | `IT:426-433` | ✅ PASS |
| BAG-29 | two at once on 3 blank → one 200 (`fusions` 1), one 409, one 1★ stored | `IT:436-458` `[200, 409]`, stored `{1: 1}` | ✅ PASS (B5 killed). The 200 body's `fusions` 1 is not asserted (minor) |
| BAG-30 | `POST /heroes/{id}/fuse` unchanged; every earlier fuse IT passes unchanged | `git diff d0b9fa8 b8afc93 -- .../HeroControllerIT.kt` removes no line; 19 → 26 tests, all pass | ✅ PASS |

### P1: Fundir tudo on the screen

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-31 | `Fundir tudo` enabled iff a layer 0-8 has ≥ 3 and no request runs | `BC:27-33`; `FL:78-84`; `UI:932`; `E:140`, `:168`, `:255` | ✅ PASS |
| BAG-32 | confirmation, `Fazer <n> fusões?` / `Fazer 1 fusão?`, `Antes: 45×0★ + 1×1★ + 2×2★`, `Depois: 1×1★ + 1×2★ + 2×3★`, `Sim, fundir` / `Não`, no request | `BC:123`, `:127`, `:131`, `:137-138`; `FL:136-143`, `FL:149`; `UI:958-961`, `UI:1019`; `E:281-286`, `E:303` | ✅ PASS (G4 killed) |
| BAG-33 | every row button and Fundir tudo disabled while the confirmation shows | `FL:144-145`; `UI:961-962`; `E:296-297` | ✅ PASS |
| BAG-34 | `Não` hides it, sends nothing, keeps counts | `UI:973-976`; `E:301-303` | ✅ PASS |
| BAG-35 | `Sim, fundir` hides it, sends exactly one `fuse-all`, redraws, `<n> fusões. Melhor carta: <nome> <s>★` from the answer | `UI:988-995`; `UI:1024`; `API:40`; `E:315-320` (1 request) | ✅ PASS. Edge case "server holds more copies than the preview" (D13) has no test of its own (gap 4) |
| BAG-36 | ` · <skill> no nível <level>` for every skill, in slot order, with level ≥ 2 **and higher than before** | `BC:147`, `:151`, `:155`, `:168-169`; `UI:1009`; `E:339` | ❌ GAP. Every test starts from skills at level ≤ 1, so "higher than before" is never exercised: G3 (`>` → `>=`) and G9 (`before` ignored) survived |
| BAG-37 | failure: error line, confirmation hidden, counts kept, no result | `UI:1110-1115`; `E:354-357` | ✅ PASS |

### P2: One way into the cards

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-38 | six HUD buttons in order, no `hud-fusion` | `UI:94-98`; `E:365-366`; `game/e2e/equipment.spec.js` (`8ce6bc9`) | ✅ PASS |
| BAG-39 | red dot `bag-badge` lit by a dropped card while the Mochila is closed, cleared when it opens | `UI:1153-1164`, `UI:1166-1180` (unit) | ❌ GAP (e2e). The plan wants e2e for every visible criterion BAG-31 to BAG-39 (`tasks.md` Test Coverage Matrix), and no e2e file asserts `bag-badge`. `EH:188-210` drops a card and opens the Mochila but never reads the dot |

**Status**: ❌ 2 AC gaps (BAG-36 discrimination, BAG-39 e2e), ⚠️ 3 spec-precision gaps (BAG-01 `top`, BAG-04 badge geometry, BAG-18 Fechar).

AC coverage: 41/41 ACs have unit or integration evidence (BAG-01, BAG-02 and BAG-40 are CSS-only, so their tests are e2e by plan). 30/31 visible ACs (BAG-01 to BAG-21, BAG-31 to BAG-41, without BAG-22) have e2e evidence; BAG-39 has none.

---

## Edge Cases

- [x] Only 9★ copies: no badge, 9★ row only, Fundir tudo disabled: `BV:70`, `FL:79`, `E:156-168`.
- [x] A fusion takes the last copies: row gone, layer above updated: `UI:236-237`, `E:181-182`.
- [x] A card drops while closed: the next opening shows the new count: `EH:208` (`0★×2`). The case "first-owned hero shows in colour" is covered by BV unowned/owned cases only.
- [x] Voltar during a request: the grid shows and the answer redraws it: `UI:434-450`.
- [ ] Server holds more copies than the preview (D13): **no test**. The only result-line cases mock an answer that equals the preview (`UI:979` 22 vs 22, `UI:997` 4 vs 4, `E:306`, `E:330`). Lesson L-039 (confirmed) asks for one test per edge case.
- [x] 404 on `fuse-all` (rollback): same catch-all path as BAG-37, tested with 409 (`UI:1101`) and 500 (`E:346`); 404 itself is not sent.
- [x] Heroes cannot be loaded: `UI:176-184` (shared `show()` path, heroes screen).
- [x] The answer restores the button text and drops `is-busy`: `UI:359-362`, `UI:375-377`, `UI:1081-1082`, `UI:1096-1098`.
- [x] Another hero opened while Kael fuses: no `Fundindo...`, locked until the answer: `UI:394-416` (G8 killed).

---

## Discrimination Sensor

Run: `node scripts/sensor.mjs <scratchpad>/mutants.json --json <scratchpad>/sensor-out.json` from the repository root, in the main checkout, with no other suite running. Before the run, each command was run once on the unmutated tree and passed (Gradle classes `BUILD SUCCESSFUL`; Vitest files 26, 18, 156 and 11 tests; each Playwright `-g` listed exactly 1 test). Multi-line `find` strings use CRLF to match the working tree. `git status --porcelain` (graphify-out ignored) was empty before and after the run.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| B1 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/PlayerCards.kt` | BAG-23/24 cascade never fuses the 8-star layer | killed |
| B2 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/PlayerCards.kt` | BAG-23 the 9-star layer loses the copies made from 8 stars | killed |
| B3 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/PlayerCards.kt` | BAG-26 nothing to fuse is accepted | killed |
| B4 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/HeroService.kt` | BAG-23 fuse-all never stores the cascade | killed |
| B5 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/PlayerCardsRepository.kt` | BAG-23/29 no player_cards row lock | killed |
| G1 | `game/src/domain/heroes/bagCards.js` | BAG-13 extra ladder row even when the top layer cannot fuse | killed |
| G2 | `game/src/domain/heroes/bagCards.js` | BAG-36 raised skills not in slot order | killed |
| G3 | `game/src/domain/heroes/bagCards.js` | BAG-36 a skill already at level 2 counts as raised | survived |
| G4 | `game/src/domain/heroes/bagCards.js` | BAG-32 preview fuses the 9-star layer | killed |
| G5 | `game/src/adapters/phaser/views/fusionLadderView.js` | BAG-18/33 row buttons not locked while busy or confirming | killed |
| G6 | `game/src/adapters/phaser/HeroUi.js` | BAG-18 no busy lock during a row fusion | killed |
| G7 | `game/src/adapters/phaser/HeroUi.js` | BAG-41 Fundindo... shown in another hero's detail | killed |
| G8 | `game/src/adapters/phaser/HeroUi.js` | BAG-18 edge case: answer of Kael redraws Kael over another open hero | killed |
| G9 | `game/src/adapters/phaser/HeroUi.js` | BAG-36 raised skills ignore the levels before the request | survived |
| G10 | `game/src/application/heroes/heroCollection.js` | BAG-21 fuseAll fires no change, skill bar not redrawn | killed |
| C1 | `game/public/style.css` | BAG-41 progress cursor not scoped to is-busy | killed |
| C2 | `game/public/style.css` | BAG-08 Fundir badge shown on the detail card (D25) | killed |
| C3 | `game/public/style.css` | BAG-40 gem gap back to 5 px | killed |
| C4 | `game/public/style.css` | BAG-01 gem row not centred | killed |
| C5 | `game/public/style.css` | BAG-01 gem row top offset -4 px instead of -5 px | survived |

**Result**: 20 mutants, 17 killed, 3 survived, 0 invalid; isolation ok

Exact faults and commands:

| Mutant | Fault | Command (cwd) |
| --- | --- | --- |
| B1 | `0..LAST_FUSIBLE_STARS` → `0 until LAST_FUSIBLE_STARS` | `.\gradlew.bat test --tests ...domain.PlayerCardsTest` (backend) |
| B2 | `copiesOf(heroId, MAX_STARS) + carry` → `copiesOf(heroId, MAX_STARS)` | same |
| B3 | `if (fusions == 0)` → `if (fusions < 0)` | same |
| B4 | `playerCardsRepository.save(outcome.cards)` removed from `HeroService.fuseAll` | `... --tests ...service.HeroServiceTest` |
| B5 | `@Lock(LockModeType.PESSIMISTIC_WRITE)` removed from `JpaPlayerCardsRepository.findForUpdate` | `... --tests ...adapter.web.HeroControllerIT` |
| G1 | `top.copies >= FUSION_SIZE` → `top.copies >= 1` | `npx vitest run src/domain/heroes/bagCards.test.js` (game) |
| G2 | `.sort((a, b) => a.slot - b.slot)` → `.reverse()` | same |
| G3 | `skillLevelOf(skill) > skillLevelOf(old)` → `>=` | same |
| G4 | `if (stars === MAX_STARS)` → `if (stars > MAX_STARS)` in `cascade` | same |
| G5 | `button.disabled = locked \|\| !row.canFuse` → `!row.canFuse` | `npx vitest run src/adapters/phaser/views/fusionLadderView.test.js` |
| G6 | `this.fusionBusy = false` right after `fusionPending` is set in `fuse` | `npx vitest run src/adapters/phaser/HeroUi.test.js` |
| G7 | `pending: this.fusionPending?.heroId === heroId ? ... : null` → `this.fusionPending?.target ?? null` | same |
| G8 | `redrawBag`: `this.bagHeroId === heroId` → `this.bagHeroId !== null` | same |
| G9 | `raisedSkills(before?.skills, hero.skills)` → `raisedSkills([], hero.skills)` | same |
| G10 | `changed()` removed from `heroCollection.fuseAll` | `npx vitest run src/application/heroes/heroCollection.test.js` |
| C1 | `.bag-detail.is-busy button:disabled` → `.bag-detail button:disabled` | `npx playwright test e2e/heroBagCards.spec.js -g "a fusion in flight disables" --workers=1` |
| C2 | `.bag-detail .bag-card-fuse` → `.bag-detail .bag-card-fuse-x` | `... -g "a card opens the ladder"` |
| C3 | `.piece-gems` `gap: 6px` → `gap: 5px` | `... -g "each rarity gem is a 9 px square"` |
| C4 | `.piece-gems` `left: 50%` → `left: 0` | `... -g "the rarity gems sit centered"` |
| C5 | `.piece-gems` `top: -5px` → `top: -4px` | same |

Why the survivors live:

- **G3, G9 (BAG-36)**: every Fundir tudo case starts from skills at level ≤ 1. `BC:143-156` uses before levels 1 and 0, `UI:997` and `E:330` start from Kael 3★ (levels 1, 1, 1). With no skill already at level 2 or 3 before the request, "higher than before" never decides an outcome. A real player who runs Fundir tudo on a 4★+ hero (for example 4★ Kael with levels 2, 1, 1 and three 4★ copies, reaching 5★ with levels 2, 2, 1) would read `· Corte Dimensional no nível 2`, a skill that was not raised, and no test would fail.
- **C5 (BAG-01)**: `E:380` asserts only `gems.y < tile.y`, so any `top` that puts the row's top edge above the border box passes.

**Sensor result**: 17/20 killed - FAIL ❌ (3 survivors become Fix 1 and Fix 3)

**Sensor depth**: lightweight+ (20 targeted mutations over the backend cascade, lock and store, the game domain, views, HeroUi state and the CSS rules the spec names).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ `fuseAll` is O(10) arithmetic beside `fuse` (`PlayerCards.kt:62-79`); the views reuse `el`, `sprite`, `starsText`, `renderSkillList` |
| Surgical changes | ✅ No migration (`backend/src/main/resources/db/migration` untouched in the range); the other edited files are the ones the tasks name |
| No scope creep | ✅ |
| Matches patterns | ✅ `NothingToFuseException` extends `HeroConflictException`; the `view` counter guard is reused for late answers; hexagonal imports kept (`bagCards.js` imports only from `domain/`) |
| Spec-anchored outcome check | ❌ BAG-36 "higher than before" is not discriminated (G3, G9); ⚠️ BAG-01 `top`, BAG-04 badge geometry, BAG-18 Fechar |
| Per-layer coverage expectation | ❌ BAG-39 has no e2e, although the matrix requires e2e for BAG-31 to BAG-39 |
| Every test maps to a requirement | ✅ The new cases of BC, BV, FL, UI, API, HC, PC, HS, IT and E all name a BAG criterion, an edge case or a Done-when check |
| Documented guidelines followed | ✅ `CLAUDE.md`, `tasks.md` Test Coverage Matrix and Gate commands, `.specs/STATE.md` flake rule |

Note: `renderConfirm` disables `Sim, fundir` / `Não` while `busy` (`fusionLadderView.js:46-47`), but `HeroUi.fuseAll` hides the confirmation before the request (`HeroUi.js:417`), so that branch never shows. BAG-18 holds either way.

---

## Gate Check

| Suite | Command | Result |
| ----- | ------- | ------ |
| Backend | `cd backend && ./gradlew test` (foreground, 2 m 43 s) | `BUILD SUCCESSFUL`; 91 classes, 1013 tests, 0 failed, 0 errors, 0 skipped (summed from `build/test-results/test/*.xml`) |
| Game unit | `cd game && npm test` (project config) | 78 files, 1759 tests passed, 0 failed |
| e2e | `cd game && npx playwright test <files> --reporter=list`, project config (3 workers), in 9 runs, one at a time; `uiRedesign.spec.js` split with `--shard=1/3..3/3` | 371 tests (`--list` total): 370 passed, 1 failed (load flake, below), 0 skipped. Runs: `heroBagCards` + `heroes` + `heroAscension` 47/47 (5.1 min); `uiRedesign` 39/39, 39/39, 39/39; `bossReplayChapters` + `farm` + `bossMap` 46/46; `dragEquip` + `accountReset` + `drops` + `elements` 37/38; `bulkSell` + `skillsAll` + `talents` 47/47; `auth` + `campaignChapters` + `autoClick` + `session` + `stages` 44/44; `clickPower` + `combatHud` + `equipment` + `equipmentUi` + `skills` + `wake` + `splash` 32/32 |

- **Failures not caused by the feature**: `game/e2e/dragEquip.spec.js:640` `scrolls the window down while a piece is held near its bottom edge` (`scrollTop` 160, expected ≥ 275) in the 3-worker run. Rerun alone twice with `--workers=1`: 1 passed (14.7 s), 1 passed (15.2 s). It is on the known flake list (`.specs/STATE.md` Handoff notes); the feature does not touch drag-to-equip scrolling.
- **Test count before → after** (files the range touched): `HeroControllerIT` 19 → 26, `PlayerCardsTest` 26 → 34, `HeroServiceTest` 18 → 24, `HeroExceptionsTest` 4 → 5, `heroesApi.test.js` 5 → 8, `heroCollection.test.js` 9 → 11, `HeroUi.test.js` 133 → 156, `bagCards.test.js` 0 → 26, `fusionLadderView.test.js` 0 → 18, `heroBagCards.spec.js` 0 → 17; e2e files `heroes`, `heroAscension`, `uiRedesign`, `equipment` unchanged in count. Decreases: `bagView.test.js` 12 → 9 and `fusionView.test.js` 12 → 4, from the removal of `renderBag`, `renderBagEntry` and `renderFusion` that T11 lists (spec D16, D19). That behaviour is gone; this is not a weakened test.
- **Coverage percentages**: not measured by the Verifier (project rule; `gitops` measures them for `report.html`).

---

## Fix Plans

### Fix 1 (Major): discriminate "higher than before" in the Fundir tudo result (BAG-36, G3, G9)

- **Root cause**: no test has a skill already at level ≥ 2 before the cascade.
- **Fix task** (owner `test-engineer`, tests only):
  - `bagCards.test.js`: `raisedSkills([skill(1, 2), skill(2, 1), skill(3, 1)], [skill(1, 2), skill(2, 2), skill(3, 1)])` equals `[{ name: 'Skill 2', level: 2 }]`. This kills G3.
  - `HeroUi.test.js` § Fundir tudo: a 4★ Kael whose skills are at levels 2, 1, 1 holds 3 copies of 4★ (`hero('kael', { 4: 3 }, { stars: 4, skills: ...levels [2,1,1] })`). The answer is a 5★ hero with levels 2, 2, 1 and `fusions` 1. The result reads exactly `1 fusão. Melhor carta: Hero kael 5★ · Skill 2 no nível 2`. This kills G9.
  - Optional e2e in `heroBagCards.spec.js`: `{ 'kael:4': 3 }` reads `1 fusão. Melhor carta: Kael Raizférrea 5★ · Investida do Baluarte no nível 2`.
- **Verify**: rerun G3 and G9 with `node scripts/sensor.mjs <mutants.json> --only G3,G9`; both killed.

### Fix 2 (Minor): e2e for the Mochila red dot (BAG-39)

- **Fix task** (owner `test-engineer`): in `heroBagCards.spec.js` (or the drop scenario of `heroes.spec.js:188`), after a card drops while the Mochila is closed, assert `bag-badge` is visible inside `hud-bag`. After `hud-bag` is clicked, assert it is hidden.

### Fix 3 (Minor): pin `top: -5px` of the gem row (BAG-01, C5)

- **Fix task** (owner `test-engineer`): in `E:369` assert `toHaveCSS('top', '-5px')` on `.piece-gems` of the three tiles, or assert the scaled distance from the tile's padding-box top. C5 must die.

### Fix 4 (Minor): edge case D13, the server answer differs from the preview

- **Fix task** (owner `test-engineer`): add a `HeroUi.test.js` case. The screen holds 45/1/2 (preview `Fazer 22 fusões?`), and `fuseAll` answers `fusions` 23 with a 4★ hero. The result reads `23 fusões. Melhor carta: Hero kael 4★...` with the server's numbers.

### Fix 5 (Minor): spec-precision assertions

- **Fix task** (owner `test-engineer`):
  - In `E:194` assert `hero-close` is enabled while the request runs (BAG-18).
  - In `E:57` assert the star badge's horizontal centre is within 1 px of the card centre and that its top is above the card top (BAG-04).
  - In `IT:436` assert the 200 answer carries `fusions` 1 (BAG-29).

### Fix 6 (Cosmetic): doc state

- **Fix task** (owner `product-owner`): mark T25 `[x]` with its Done-when boxes, and tick the T17 to T20 Done-when boxes. Update the `tasks.md:13` and `design.md:4` status lines. Set the spec traceability rows to `Verified` once the round passes.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| BAG-01 | Implementing | ⚠️ Verified with spec-precision gap (Fix 3) |
| BAG-02 to BAG-03, BAG-05 to BAG-35, BAG-37, BAG-38, BAG-40, BAG-41 | Implementing | ✅ Verified |
| BAG-04, BAG-18, BAG-29 | Implementing | ✅ Verified (spec-precision notes, Fix 5) |
| BAG-36 | Implementing | ❌ Needs Fix (Fix 1) |
| BAG-39 | Implementing | ❌ Needs Fix (Fix 2, e2e) |

(The Verifier changes no spec file; the product owner applies these statuses.)

---

## Summary

**Overall**: ❌ Not Ready (round 1 of 3). Every gap can be closed with tests only.

**Spec-anchored check**: 39/41 ACs match the spec outcome; BAG-36 is not discriminated and BAG-39 lacks e2e; 3 spec-precision gaps flagged.
**Sensor**: 20 mutants, 17 killed, 3 survived (G3, G9, C5).
**Gate**: backend 1013/1013, game unit 1759/1759, e2e 370/371 (1 known load flake, passed alone twice).

**What works**: the server cascade is all-or-nothing under the row lock (the race IT kills the lock removal), all five spec results are pinned at three layers, the ladder and the busy and `Fundindo...` states are discriminated, the preview texts are exact, there is no scrollbar at either viewport, and the gem geometry of D23 (Q9) is pinned in e2e.

**Next steps**: route Fix 1 to Fix 5 to `test-engineer` and Fix 6 to `product-owner`. Round 2 reruns G3, G9 and C5 plus 1 to 3 new mutants on the new tests, the game unit suite and `heroBagCards.spec.js`, and the full backend and e2e suites once before a PASS.
