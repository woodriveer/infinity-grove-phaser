# Hero Bag Cards Validation

**Verdict**: PASS (round 2 of 3)
**Date**: 2026-11-18
**Spec**: `.specs/features/hero-bag-cards/spec.md`
**Diff range**: feature `d0b9fa8..ff8584d`. Round 1 covered `d0b9fa8..b8afc93` (feature commits `77ea405` to `b8afc93`, T1 to T25); round 2 covers the fix commits `e400084..ff8584d` (`3b0ed29`, `d663c35`, `4737d05`, `c276ded`, `ff8584d`). Excluded as other work: `4ce1835` (splash feature), `23381d0` (merge), `bb6fe3f` (graphify), `c11dd5c` (agents). Included although no task names it: `8ce6bc9` (equipment e2e expects the six rail buttons of BAG-38).
**Verifier**: independent sub-agent (author ≠ verifier); I wrote none of this feature's code or tests.

PASS. The six round 1 gaps are closed. The fix commits change tests and docs only: `git diff --stat e400084..ff8584d` touches no file under `backend/src/main`, `game/src` (outside `*.test.js`) or `game/public`. The three round 1 survivors (G3, G9, C5) are now killed, and so are 6 new mutants aimed at the new assertions (9/9). The final gate ran in full on `ff8584d`: backend 1013/1013, game unit 1764/1764, e2e 373/374. The one e2e failure is the known `dragEquip.spec.js:640` load flake, which passed alone twice with `--workers=1`.

---

## Round 2: Gaps of round 1

| Gap | Round 1 finding | Fix commit | Evidence now | Status |
| --- | --------------- | ---------- | ------------ | ------ |
| 1 (Major) | BAG-36 "higher than before" not discriminated (G3, G9 survived) | `3b0ed29`, `ff8584d` | `BC:158` `raisedSkills([1:2, 2:1, 3:1], [1:2, 2:2, 3:1])` is `[{ Skill 2, 2 }]`; `BC:165` 2 → 3 named and an unmoved 3 is not; `BC:172` nothing raised gives `[]`; `UI:1012` 4★ Kael levels 2/1/1 + 3×4★ reads exactly `1 fusão. Melhor carta: Hero kael 5★ · Skill 2 no nível 2` (`UI:1025`); `E:362` reads `1 fusão. Melhor carta: Kael Raizférrea 5★ · Investida do Baluarte no nível 2` (`E:372`) | ✅ Closed (G3, G9, R1 killed) |
| 2 (Minor) | BAG-39 red dot had no e2e | `4737d05` | `EH:212`: dot hidden before the drop (`EH:223`), visible inside `hud-bag` after the miniboss drop (`EH:229-230`), hidden after `hud-bag` opens the Mochila (`EH:235`) | ✅ Closed (R2, R3 killed) |
| 3 (Minor) | BAG-01 `top: -5px` not pinned (C5 survived) | `ff8584d` | `E:435-436` `toHaveCSS('top', '-5px')` on `.piece-gems` of `equip-piece-m1` and `equip-slot-kael-WEAPON` | ✅ Closed (C5 killed). The bulk-sell tile uses the same `.piece-gems` rule and keeps its centring assertion |
| 4 (Minor) | Edge case D13 (server answer differs from the preview) had no test | `3b0ed29`, `ff8584d` | `UI:1028`: preview `Fazer 22 fusões?`, server answers 23 and a 4★, result `23 fusões. Melhor carta: Hero kael 4★ · Skill 1 no nível 2` (`UI:1041`), ladder redrawn from the answer (`UI:1042-1044`); `E:375`: 3 blank cards are added to the mock store between the preview and `Sim, fundir`, result `23 fusões. Melhor carta: Kael Raizférrea 3★` (`E:387`), rows 2/3, 1/3, 2/3 and no 0★ row (`E:388-391`). I checked the cascade by hand: 48 → 16 fusions, 17 → 5, 7 → 2, total 23 | ✅ Closed (R4 killed) |
| 5 (Minor) | Spec-precision: BAG-18 Fechar, BAG-04 badge geometry, BAG-29 `fusions` 1 | `ff8584d`, `c276ded` | BAG-18: `E:224` (row fusion) and `E:261` (Fundir tudo) `hero-close` enabled while the request runs, `E:260` `hero-back` too. BAG-04: `E:75-81` badge centre x within 1 px of the card centre, badge top above and bottom below the card top, badge centre y within 5 px (scaled) of the card's top edge. BAG-29: `IT:453-455` `[200, 409]`, the 200 body has `fusions` 1 and `hero.stars` 1 | ✅ Closed (R5, R6 killed) |
| 6 (Cosmetic) | Doc state | `d663c35` | `tasks.md` T25 `[x]` with both Done-when boxes ticked; T17 to T20 Done-when boxes ticked with a Result line each; `tasks.md:13` and `design.md:4` status lines updated; spec rows BAG-36 and BAG-39 set to `Needs Fix` and the rest kept at `Implementing` pending this round | ✅ Closed |

Note on the BAG-04 vertical tolerance (`E:81`): the badge is 24 px high at `top: -12px` of the padding box. Its centre therefore lies on the inner line of the 4 px card border, 4 px below the border-box top that `cardBox.y` measures. A 5 px tolerance (scaled by `badgeBox.height / 24`) accepts a centre anywhere on the border band plus 1 px. That fits "centered on the top edge" (`spec.md:107`), and R6 (the badge sunk by 5 px, `top: -7px`) is killed. A shift of 1 px or less would pass, which I take as visual noise, not a gap.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 to T25 | ✅ Done | `[x]` in `tasks.md` with their Done-when boxes ticked (T17 to T20 and T25 fixed in `d663c35`); one commit each (`c6f57c6` to `b8afc93`) |
| Round 1 fixes 1 to 5 | ✅ Done | Tests only: `3b0ed29`, `4737d05`, `c276ded`, `ff8584d` |
| Round 1 fix 6 | ✅ Done | Docs: `d663c35` |

---

## Spec-Anchored Acceptance Criteria

Abbreviations: `BC` = `game/src/domain/heroes/bagCards.test.js`, `BV` = `game/src/adapters/phaser/views/bagView.test.js`, `FL` = `game/src/adapters/phaser/views/fusionLadderView.test.js`, `UI` = `game/src/adapters/phaser/HeroUi.test.js`, `API` = `game/src/adapters/http/heroesApi.test.js`, `HC` = `game/src/application/heroes/heroCollection.test.js`, `E` = `game/e2e/heroBagCards.spec.js`, `EH` = `game/e2e/heroes.spec.js`, `EA` = `game/e2e/heroAscension.spec.js`, `PC` = `backend/.../domain/PlayerCardsTest.kt`, `HS` = `backend/.../service/HeroServiceTest.kt`, `IT` = `backend/.../adapter/web/HeroControllerIT.kt`. Line numbers are at `ff8584d`. Round 2 inserted tests in `HeroUi.test.js` at `:1012` and in `heroBagCards.spec.js`, so the lines after those points moved from round 1; every line below was re-read at `ff8584d`. Every cited test passed in this round's runs.

### P1: Centered rarity gems

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-01 | `.piece-gems` `left: 50%`, `translateX(-50%)`, `top: -5px`; row centre within 1 px of the tile centre on bag, slot and bulk-sell tiles | `E:417` centring within 1 px on `equip-piece-m1`, `equip-slot-kael-WEAPON` and in bulk-sell mode; `E:435-436` `toHaveCSS('top', '-5px')` | ✅ PASS (C4 killed in round 1, C5 killed in round 2) |
| BAG-02 | tile 60x60, gem count per rarity (`data-gems`), refine `+<n>` at `right: 2px; bottom: 1px` | `E:438` `data-gems` `'4'`, `+2`, `toHaveCSS('right','2px')`, `('bottom','1px')`, 5 px from the tile edge in tile units, 3 gems on the EPIC slot | ✅ PASS |
| BAG-40 | gem 9x9 px, `column-gap: 6px`, LEGENDARY row 54 px, tips ≥ 2 px apart, tips inside the tile | `E:457` (9 px, `6px`, 54 / 39 ±0.5, turned width 12.73 ±0.5, tip gap `>= 2`, tips inside) | ✅ PASS (C3 killed in round 1) |

### P1: One card per hero

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-03 | one `bag-card-<id>` per hero in payload order inside `bag-list`; no `bag-entry-*` | `BV:11-13`; `E:57` the five ids in order, `bag-entry-` count 0 | ✅ PASS |
| BAG-04 | `_sprite.png` art, ribbon with the name, star badge `<stars>★` centred on the top edge | `BV:40-42`; `E:69` `2★`; `E:75-81` horizontal centre ±1 px, badge straddles the top edge, vertical centre within 5 px of it | ✅ PASS (R6 killed) |
| BAG-05 | `data-frame` + `frame-*`: wood 0-3, silver 4-6, gold 7-9 | `BC:11`; `BV:49-52`; `E:68` and the silver/gold cards of `E:57` | ✅ PASS |
| BAG-06 | `hero-stars` + `is-ascended` 4-6 / `is-exalted` 7-9 | `BV:58-62`; `E:57` | ✅ PASS |
| BAG-07 | one chip per layer ≥ 1, ascending, `<s>★×<c>` | `BC:17`, `BC:39`; `BV:43`; `E:83` `['0★×45','1★×1','2★×2']` | ✅ PASS |
| BAG-08 | `Fundir` badge while a layer 0-8 has ≥ 3; never on the detail card (D25) | `BV:68-70`; `E:84`; `E:144` detail badge hidden | ✅ PASS (C2 killed in round 1) |
| BAG-09 | unowned card: disabled, `is-grey`, `wood`, art, ribbon, `Não encontrado`, no badge/chip/Fundir | `BV:76-82`; `E:57` (Lyra, Nyx, Theron, Ignis) | ✅ PASS |
| BAG-10 | click on an unowned card opens nothing | `BV:28-32`; `E:112` | ✅ PASS |
| BAG-11 | no scrollbar, 5 heroes × 10 layers, 1280x720 and 390x844 | `E:123`, `E:135` | ✅ PASS |

### P1: Fusion ladder

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-12 | the detail replaces the grid; `Voltar`; card, `fusion-list`, `fusion-all`, `skill-list` with 3 rows | `FL:15-19`; `UI:203-218`; `E:144` | ✅ PASS |
| BAG-13 | held layers ascending + t+1 at 0 copies when t ≤ 8 and c_t ≥ 3 | `BC:47`, `:57`, `:62`, `:66`, `:72`; `FL:25`; `E:144`, `E:169` | ✅ PASS (G1 killed in round 1) |
| BAG-14 | `<s>★`; progressbar 0/3/min(c,3); fill widths; `<c>/3`; `<s>★→<s+1>★` | `FL:26-54`; `BC:79`; `E:144` | ✅ PASS |
| BAG-15 | row button disabled below 3, enabled at ≥ 3 with no request | `FL:42`, `FL:47`; `UI:931`; `E:144` | ✅ PASS |
| BAG-16 | 9★ row: `Cópias: <c>`, `Estrela máxima: não pode ser fundida`, no bar, no button | `FL:70-74`; `E:169`; `EA:246` | ✅ PASS |
| BAG-17 | one `POST /heroes/<id>/fuse` `{"stars": s}`; redraw; `Nova carta: ...` + skill from 4★ | `UI:234-236`, `UI:281`, `UI:293`; `E:184`; `EA:53`, `EA:71` | ✅ PASS |
| BAG-18 | while a request runs every row button, Fundir tudo and the confirmation buttons are disabled; a second click sends nothing; `Voltar` and `Fechar` stay enabled | `UI:330-335`, `UI:1088-1092`; `FL:94-96`; `E:221-224` (row: buttons disabled, `hero-back` and `hero-close` enabled); `E:258-261` (Fundir tudo: same) | ✅ PASS (G5, G6 killed in round 1; R5 killed in round 2) |
| BAG-19 | failure: `Não foi possível fundir as cartas.`, counts unchanged, no `fusion-result` | `UI:252-255`, `UI:307-309`; `E:276`; `EH:127`; `EA:272-284` | ✅ PASS |
| BAG-20 | Voltar shows the grid with the counts after every fusion | `UI:427-431`, `UI:443-450`; `E:184`, `E:322` | ✅ PASS |
| BAG-21 | the skill bar follows the answered hero without another `GET /heroes` | `UI:238`, `UI:267-269`, `UI:1071-1072`; `HC:90`; `E:184`, `E:322` | ✅ PASS (G10 killed in round 1) |
| BAG-22 | an answer after close or another screen draws nothing | `UI:465-466`, `UI:481-482` | ✅ PASS (not player-visible; unit only, as planned) |
| BAG-41 | `Fundindo...` on the sending button of that hero only; `is-busy`; `cursor: progress` only while busy | `FL:102-130`; `UI:354-415`; `E:207`, `E:243` | ✅ PASS (G7, C1 killed in round 1) |

### P1: Fundir tudo on the server

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-23 | one transaction under the row lock; cascade from 0★; 200 `{hero, fusions}` | `PC:231-236`; `HS:223-235`; `IT:351-368` | ✅ PASS (B1, B2, B4, B5 killed in round 1) |
| BAG-24 | the five cascade examples of the spec | `PC:231`, `:240`, `:248`, `:256`, `:264`; `HS:238-246`; `IT:372-384` | ✅ PASS |
| BAG-25 | no other hero, wallet or leader changes | `PC:272-280`; `IT:387-407` | ✅ PASS |
| BAG-26 | nothing to fuse → 409 `NOTHING_TO_FUSE`, no change | `PC:283-290`; `HS:249-255`; `IT:410-416` | ✅ PASS (B3 killed in round 1) |
| BAG-27 | unknown id → 404 `HERO_NOT_FOUND` | `HS:258-264`; `IT:419-423` | ✅ PASS |
| BAG-28 | unauthenticated → 401 | `IT:426-433` | ✅ PASS |
| BAG-29 | two at once on 3 blank → one 200 (`fusions` 1), one 409, one 1★ stored | `IT:453` `[200, 409]`; `IT:454` `fusions` 1; `IT:455` `hero.stars` 1; `IT:456` stored `{1: 1}` | ✅ PASS (B5 killed in round 1) |
| BAG-30 | `POST /heroes/{id}/fuse` unchanged; earlier fuse ITs pass unchanged | `git diff d0b9fa8 ff8584d -- .../HeroControllerIT.kt` removes no line from the earlier tests; `c276ded` changes only the new race test | ✅ PASS |

### P1: Fundir tudo on the screen

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-31 | `Fundir tudo` enabled iff a layer 0-8 has ≥ 3 and no request runs | `BC:27-33`; `FL:78-84`; `UI:932`; `E:144`, `E:169`, `E:243` | ✅ PASS |
| BAG-32 | confirmation texts (`Fazer <n> fusões?` / `Fazer 1 fusão?`, `Antes:` / `Depois:` lines, `Sim, fundir` / `Não`), no request | `BC:123-138`; `FL:136-149`; `UI:958-961`, `UI:1054`; `E:289`; `E:368` `Fazer 1 fusão?` | ✅ PASS (G4 killed in round 1) |
| BAG-33 | row buttons and Fundir tudo disabled while the confirmation shows | `FL:144-145`; `UI:961-962`; `E:289` | ✅ PASS |
| BAG-34 | `Não` hides it, sends nothing, keeps counts | `UI:973-976`; `E:289` | ✅ PASS |
| BAG-35 | `Sim, fundir` sends exactly one `fuse-all`, redraws, `<n> fusões. Melhor carta: <nome> <s>★` from the answer | `UI:988-995`, `UI:1059`; `API:40`; `E:322`; D13 edge: `UI:1028-1044`, `E:375-391` | ✅ PASS (R4 killed) |
| BAG-36 | ` · <skill> no nível <level>` for every skill, in slot order, with level ≥ 2 **and higher than before** | `BC:147-175`; `UI:1009`, `UI:1025`, `UI:1041`; `E:355`, `E:372` | ✅ PASS (G2 killed in round 1; G3, G9, R1 killed in round 2) |
| BAG-37 | failure: error line, confirmation hidden, counts kept, no result | `UI:1145-1150`; `E:394` | ✅ PASS |

### P2: One way into the cards

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| BAG-38 | six HUD buttons in order, no `hud-fusion` | `UI:94-98`; `E:408`; `game/e2e/equipment.spec.js` (`8ce6bc9`) | ✅ PASS |
| BAG-39 | red dot `bag-badge` lit by a dropped card while the Mochila is closed, cleared when it opens | `UI:1182-1215` (unit); `EH:223` hidden, `EH:229-230` visible inside `hud-bag` after the drop, `EH:235` hidden after `hud-bag` opens the bag | ✅ PASS (R2, R3 killed) |

**Status**: ✅ All 41 ACs covered and matched to the spec outcome; no spec-precision gap left open.

AC coverage: 41/41 ACs have unit or integration evidence. BAG-01, BAG-02 and BAG-40 are CSS-only, so their tests are e2e, as planned. 31/31 visible ACs (BAG-01 to BAG-21, BAG-31 to BAG-41, without BAG-22) have e2e evidence.

---

## Edge Cases

- [x] Only 9★ copies: no badge, 9★ row only, Fundir tudo disabled: `BV:70`, `FL:79`, `E:169`.
- [x] A fusion takes the last copies: row gone, layer above updated: `UI:236-237`, `E:184`.
- [x] A card drops while closed: the next opening shows the new count (`EH:188`) and the red dot is lit until the Mochila opens (`EH:212`).
- [x] Voltar during a request: the grid shows and the answer redraws it: `UI:434-450`.
- [x] Server holds more copies than the preview (D13): `UI:1028` (unit) and `E:375` (e2e, the mock store gains 3 blanks after the preview). The result line and the ladder follow the answer, not the preview.
- [x] 404 on `fuse-all`: same catch-all path as BAG-37, tested with 409 (`UI:1136`) and 500 (`E:394`).
- [x] Heroes cannot be loaded: `UI:176-184`.
- [x] The answer restores the button text and drops `is-busy`: `UI:359-362`, `UI:375-377`, `UI:1116-1117`, `UI:1131-1133`.
- [x] Another hero opened while Kael fuses: no `Fundindo...`, locked until the answer: `UI:394-416` (G8 killed in round 1).

---

## Discrimination Sensor

### Round 2

Run: `node scripts/sensor.mjs <scratchpad>/r2/mutants.json --json <scratchpad>/r2/sensor-out.json` from the repository root, in the main checkout, with no other suite running. Before the run, every command passed on the unmutated tree in this round: `npm test` 1764/1764, and `heroBagCards.spec.js` + `heroes.spec.js` + `heroAscension.spec.js` 50/50. Each `-g` filter matches exactly one test of the `--list` output. `git status --porcelain` (graphify-out ignored) was empty before and after the run.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| G3 | `game/src/domain/heroes/bagCards.js` | BAG-36 a skill already at level 2 counts as raised | killed |
| G9 | `game/src/adapters/phaser/HeroUi.js` | BAG-36 raised skills ignore the levels before the request | killed |
| C5 | `game/public/style.css` | BAG-01 gem row top offset -4 px instead of -5 px | killed |
| R1 | `game/src/adapters/phaser/HeroUi.js` | BAG-36 e2e: before levels ignored (G9 against the new e2e) | killed |
| R2 | `game/src/adapters/phaser/HeroUi.js` | BAG-39 e2e: opening the Mochila no longer clears the red dot | killed |
| R3 | `game/src/adapters/phaser/HeroUi.js` | BAG-39 e2e: the dot is lit only while a window is open | killed |
| R4 | `game/src/adapters/phaser/HeroUi.js` | D13 e2e: the result line keeps the preview count | killed |
| R5 | `game/src/adapters/phaser/HeroUi.js` | BAG-18 e2e: Fechar disabled while a row fusion runs | killed |
| R6 | `game/public/style.css` | BAG-04 e2e: star badge sunk 5 px into the card | killed |

**Result**: 9 mutants, 9 killed, 0 survived, 0 invalid; isolation ok

| Mutant | Fault | Command (cwd `game`) |
| --- | --- | --- |
| G3 | `skillLevelOf(skill) > skillLevelOf(old)` → `>=` | `npx vitest run src/domain/heroes/bagCards.test.js` |
| G9 | `raisedSkills(before?.skills, hero.skills)` → `raisedSkills([], hero.skills)` | `npx vitest run src/adapters/phaser/HeroUi.test.js` |
| C5 | `.piece-gems` `top: -5px` → `top: -4px` | `npx playwright test e2e/heroBagCards.spec.js -g "the rarity gems sit centered" --workers=1` |
| R1 | same fault as G9 | `npx playwright test e2e/heroBagCards.spec.js -g "names only the skills raised above" --workers=1` |
| R2 | `this.bagBadge.hidden = true;` removed from `show()` | `npx playwright test e2e/heroes.spec.js -g "lights the red dot" --workers=1` |
| R3 | `showDrop`: `this.bagBadge.hidden = this.open && this.screen === 'bag'` → `this.bagBadge.hidden = !this.open` | same |
| R4 | `fusions` → `fusions: Math.min(fusions, 22)` in the `renderFuseAllResult` call | `npx playwright test e2e/heroBagCards.spec.js -g "server numbers when a card dropped" --workers=1` |
| R5 | after `this.fusionPending = { heroId, target: stars };` add `this.panel.querySelector('.hero-close').disabled = true;` | `npx playwright test e2e/heroBagCards.spec.js -g "a fusion in flight disables the ladder" --workers=1` |
| R6 | `.bag-card-star` `top: -12px` → `top: -7px` | `npx playwright test e2e/heroBagCards.spec.js -g "shows one framed card per hero" --workers=1` |

### Round 1 (for the record)

20 mutants, 17 killed, 3 survived (G3, G9, C5), 0 invalid; isolation ok. Killed: B1 to B5 (backend cascade, 9★ carry, nothing-to-fuse, store, row lock), G1, G2, G4 to G8, G10 (domain, ladder lock, busy lock, `Fundindo...` scope, redraw guard, collection change), C1 to C4 (progress cursor scope, detail badge, gem gap, gem centring). Faults and commands are in the round 1 report (`e400084`).

**Sensor depth**: lightweight+ (29 mutation runs over the two rounds, covering the backend cascade, lock and store, the game domain, views, HeroUi state, the CSS rules the spec names, and each assertion added in round 2).
**Sensor result**: round 2 9/9 killed - PASS ✅. No survivor is left from either round.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Unchanged since round 1: `fuseAll` is O(10) arithmetic beside `fuse`; the views reuse the existing helpers |
| Surgical changes | ✅ Round 2 commits touch only the four test files and the four docs that Fix 1 to Fix 6 name |
| No scope creep | ✅ |
| Matches patterns | ✅ The new tests reuse `hero()`, `skills()`, `createUi`, `openKael`, `startWith`, `openHero`, `copiesText`, `mockBackend`, `startGame` |
| Spec-anchored outcome check | ✅ Every new assertion targets the exact spec text or value (`1 fusão. ...`, `23 fusões. ...`, `-5px`, `fusions` 1, `toBeEnabled` on `hero-close`) |
| Per-layer coverage expectation | ✅ Domain 1:1 for BAG-36 (`BC:158-175`); e2e for every visible AC including BAG-39 |
| Every test maps to a requirement | ✅ Each new case names BAG-04, BAG-18, BAG-29, BAG-36, BAG-39, BAG-01 or D13 in a comment or title |
| Documented guidelines followed | ✅ `CLAUDE.md`, `.claude/agents/verifier.md` (round 2 scope, final gate), `tasks.md` Test Coverage Matrix, `.specs/STATE.md` flake rule |

Note carried from round 1, not a gap: `renderConfirm` disables `Sim, fundir` / `Não` while `busy` (`fusionLadderView.js:46-47`), but `HeroUi.fuseAll` hides the confirmation before the request, so that branch never shows. BAG-18 holds either way.

---

## Gate Check

Final gate, all on `ff8584d`, one suite at a time, none left running:

| Suite | Command | Result |
| ----- | ------- | ------ |
| Backend | `cd backend && ./gradlew test` (2 m) | `BUILD SUCCESSFUL`; 91 classes, 1013 tests, 0 failed, 0 errors, 0 skipped (summed from `build/test-results/test/*.xml`, written 16:08 this round) |
| Game unit | `cd game && npm test` (project config) | 78 files, 1764 tests passed, 0 failed |
| e2e | `cd game && npx playwright test <files> --reporter=line`, project config (3 workers), in 9 runs, one at a time; `uiRedesign.spec.js` split with `--shard=1/3..3/3` | 374 tests (`--list` total, 26 files): 373 passed, 1 failed (load flake, below), 0 skipped. Runs: `heroBagCards` + `heroes` + `heroAscension` 50/50 (5.3 min); `uiRedesign` 39/39, 39/39, 39/39; `bossReplayChapters` + `farm` + `bossMap` 46/46; `dragEquip` + `accountReset` + `drops` + `elements` 37/38; `bulkSell` + `skillsAll` + `talents` 47/47; `auth` + `campaignChapters` + `autoClick` + `session` + `stages` 44/44; `clickPower` + `combatHud` + `equipment` + `equipmentUi` + `skills` + `wake` + `splash` 32/32 |

- **Failures not caused by the feature**: `game/e2e/dragEquip.spec.js:640` `scrolls the window down while a piece is held near its bottom edge` (`scrollTop` 232, expected ≥ 275) in the 3-worker run. I reran it alone twice with `--workers=1` and it passed both times (19.0 s, 16.4 s). It is on the known flake list (`.specs/STATE.md` Handoff notes), it failed the same way in round 1, and the feature does not touch drag-to-equip scrolling.
- **Test count round 1 → round 2**: game unit 1759 → 1764 (+3 `bagCards.test.js`, +2 `HeroUi.test.js`); e2e 371 → 374 (+2 `heroBagCards.spec.js`, +1 `heroes.spec.js`); backend 1013 → 1013 (`c276ded` adds two assertions to an existing test). No test was removed or weakened in the fix range.
- **Test count before the feature → now** (files the feature touched): `HeroControllerIT` 19 → 26, `PlayerCardsTest` 26 → 34, `HeroServiceTest` 18 → 24, `HeroExceptionsTest` 4 → 5, `heroesApi.test.js` 5 → 8, `heroCollection.test.js` 9 → 11, `HeroUi.test.js` 133 → 158, `bagCards.test.js` 0 → 29, `fusionLadderView.test.js` 0 → 18, `heroBagCards.spec.js` 0 → 19, `heroes.spec.js` +1. Decreases: `bagView.test.js` 12 → 9 and `fusionView.test.js` 12 → 4, from the removal of `renderBag`, `renderBagEntry` and `renderFusion` that T11 lists (spec D16, D19). That behaviour is gone; this is not a weakened test.
- **Coverage percentages**: not measured by the Verifier (project rule; `gitops` measures them for `report.html`).

---

## Fix Plans

None. Every round 1 fix plan (Fix 1 to Fix 6) is closed; see § Round 2: Gaps of round 1.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| BAG-01 to BAG-35 | Implementing | ✅ Verified |
| BAG-36 | Needs Fix | ✅ Verified |
| BAG-37, BAG-38 | Implementing | ✅ Verified |
| BAG-39 | Needs Fix | ✅ Verified |
| BAG-40, BAG-41 | Implementing | ✅ Verified |

All 41 rows are Verified. My write scope is `validation.md` only. The product owner applies these statuses to `spec.md:221-261`, as with the round 1 statuses (`d663c35`).

---

## Summary

**Overall**: ✅ Ready (round 2 of 3, final PASS round).

**Spec-anchored check**: 41/41 ACs match the spec outcome; 0 spec-precision gaps open (the three of round 1 are pinned).
**Sensor**: round 2 9/9 killed (G3, G9, C5 plus 6 new); round 1 17/20; no survivor left.
**Gate**: backend 1013/1013, game unit 1764/1764, e2e 373/374 (1 known load flake, `dragEquip.spec.js:640`, passed alone twice).

**What works**: the server cascade is all-or-nothing under the row lock, and the race answer is pinned to `fusions` 1. The Fundir tudo result names only skills raised above their previous level and follows the server's numbers when they differ from the preview. The Mochila red dot lights on a drop and clears on open, end to end. `Voltar` and `Fechar` stay usable during both kinds of request. The gem row offset and the star badge position are pinned in e2e.

**Next steps**: the product owner sets the spec rows to `Verified` and runs acceptance, then `gitops` pushes, deploys, writes `report.html`, `CHANGELOG.md` and the tag.
