# combat-hud Validation

**Date**: 2026-10-21
**Spec**: `.specs/features/combat-hud/spec.md`
**Diff range**: `8c3a67a..bea1c4e` (feature commits 8cee4bd, 4796875, ee5f26f, 6aa9cc6, c3a7d9d; fix commit bea1c4e; commits 9d57da1 and 915d19f in the range are unrelated click-power work and were ignored); only `game/` and `.specs/` changed, no backend file
**Verifier**: independent sub-agent (author != verifier)
**Iteration**: 2 of 3 (iteration 1 verdict was FAIL: G1 defect, G2 surviving mutant, G3 to G8 minor)
**Verdict**: PASS

---

## Task Completion

No tasks.md; 5 inline steps plus 1 fix commit.

| Step | Commit | Status | Notes |
| ---- | ------ | ------ | ----- |
| Chapter pill + HP text | 8cee4bd | Done | G1 fixed by bea1c4e |
| Element wheel | 4796875 | Done | - |
| Skill tooltip | ee5f26f | Done | - |
| Skill keys Q/W/E | 6aa9cc6 | Done | - |
| Equipment red dot | c3a7d9d | Done | - |
| Fix of iteration 1 | bea1c4e | Done | `else if (alive && hits.length > 0) this.updateHealthBar()` in `ClickerGame.update`, tests for G1, G2, G3, G5, G6, G8, spec row corrected (G7) |

No backend change (success criterion): confirmed, no file outside `game/` and `.specs/` in the range.

---

## Gate Check

- **Gate command**: inside `game/`: `npx vitest run`; `npx playwright test e2e/combatHud.spec.js`
- **Result**: vitest 925 passed, 0 failed, 0 skipped (47 files); playwright combatHud.spec.js 5 of 5 passed (numbers updated by the author for the star bonus: 1 star Kael clicks 1.1, Corte Dimensional 16.5)
- **Test count**: 854 at iteration 1, 925 now (the delta mixes the fix tests with the unrelated click-power tests); no test was deleted
- **Failures**: none

---

## Spec-Anchored Acceptance Criteria

Paths relative to `game/`. CG = `src/adapters/phaser/ClickerGame.test.js`, HU = `src/adapters/phaser/HeroUi.test.js`, V = `src/adapters/phaser/views/`. Rows carried from iteration 1 were re-run green in the 925 tests; the line numbers of CG rows that moved because of the new commits are given by test name.

### P1: Chapter and monster health (HUD-01, HUD-02)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 show `Capítulo <n>` | `Capítulo 2` for chapter 2 | CG test "shows the chapter of the player position" `expect(chapter(ctx)).toBe('Capítulo 2')`; `src/application/campaign/campaignSession.test.js:49` `expect(session.chapter).toBe(3)`; `e2e/combatHud.spec.js:40` `toHaveText('Capítulo 1')` | PASS |
| AC2 next chapter `Capítulo <n+1>` | `Capítulo 2` | CG test "shows the next chapter when the backend opens it" `expect(chapter(ctx)).toBe('Capítulo 2')`; mutant 6 killed | PASS |
| AC3 `HP <left>/<max>`, ceil to 1 decimal, no trailing zero | format | `src/domain/combat/monster.test.js:142` `toBe('HP 10/30')`, `:154` `toBe('HP 0.1/10')`, `:162` `toBe('HP 7.3/10')`, `:170` `toBe('HP 0/10')`; CG "shows the full health of a new monster" `toBe('HP 30/30')`; `e2e:41` `toHaveText('HP 100/100')`; mutant 1 killed | PASS |
| AC3 centered on the bar | center of bar | CG "is centred on the health bar" `expect(element.x).toBe(ctx.back.x + ctx.back.width / 2)` and `y` | PASS (equal width is CSS only: spec-precision gap, no measurable value) |
| AC4 click, skill hit, damage tick update text with the bar | text and bar move together | click: CG "reads HP 10/30 after 20 damage" `toBe('HP 10/30')` + `fill.width toBe(80)`, `e2e:45` `toHaveText('HP 99/100')`. Skill hit (new): `CG:374-386` "follows a skill hit that does not kill" `expect(hp(ctx)).toBe('HP 983.5/1000')` + `expect(ctx.fill.width).toBeCloseTo(240 * 983.5 / 1000, 10)`. Tick (new): `CG:388-397` "follows a damage tick that does not kill" `expect(hp(ctx)).toBe('HP 997.6/1000')` + `fill.width toBeCloseTo(240 * 997.6 / 1000, 10)`. Mutants 29, 33, 34 killed | PASS (G1, G2 closed) |
| AC5 30 health, 20 damage | `HP 10/30` | CG "reads HP 10/30 after 20 damage" `expect(hp(ctx)).toBe('HP 10/30')` | PASS |
| AC6 0.04 left | `HP 0.1/10` | CG "rounds a fractional health left up to one decimal" `toBe('HP 0.1/10')` | PASS |
| AC7 new monster `HP <max>/<max>` | `HP 10/10` | CG "shows the full health of the next monster" `toBe('HP 10/10')`; mutant 30 killed | PASS |
| AC8 chapter complete: hide text | empty | CG "hides the text when the chapter is complete" `toBe('')`; mutant 8 killed | PASS |
| Edge: fractional health from a skill tick rounds up | rounded up | `monster.test.js:154` plus the tick path now refreshed (`CG:388-397`, value `997.6` is itself a rounded-up fraction) | PASS |
| Edge: no heroes loaded still shows chapter and HP | both visible | `CG:399-403` "shows the chapter and the HP text while the heroes have not loaded" `toBe('Capítulo 3')` and `toBe('HP 1000/1000')` | PASS (G3 closed) |

### P1: Element wheel (HUD-03)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 CSS drawing, 5 elements, triangle Fogo>Natureza>Água>Fogo | testid, names, arrow order | `V/elementWheel.test.js:10` `data-testid` `toBe('element-wheel')`, `:11` names `['Fogo','Natureza','Água','Luz','Escuridão']`, `:16` `['FIRE>NATURE','NATURE>WATER','WATER>FIRE']`; mutant 9 killed | PASS |
| AC2 arrows `x2` | `x2` x3 | `V/elementWheel.test.js:19` `toEqual(['x2','x2','x2'])`; `e2e:55` | PASS |
| AC3 `x1,8` vs triad, `x0,9` pair | values | `V/elementWheel.test.js:25-26`; `e2e:56-57`; mutants 10, 32 killed | PASS |
| AC4 rule text | exact string | `V/elementWheel.test.js:32` `.wheel-rule` `toBe('Fogo vence Natureza, Natureza vence Água, Água vence Fogo: dano em dobro')` | PASS |
| AC5 not block clicks | click-through | CG "shows the element wheel without blocking clicks" `expect(element.pointerEvents).toBe('none')`; `e2e:63-65` click in the wheel lowers monster health by 1; mutant 31 killed | PASS (monster; skill bar and hero buttons are not under the wheel: spec-precision gap) |
| AC6 visible under pause menu or hero screen | visible | CG "keeps the wheel on screen while a hero screen is open" `closest('[hidden]')` `toBeNull()`; `e2e:54,58-59` visible and inside the canvas | PASS for hero screen; pause menu and stacking order stay a documented spec-precision gap (G4, accepted by the coordinator) |

### P2: Skill tooltip (HUD-04)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 hover slot: art, name, type, effect, `Recarga`, state | six fields | `V/skillTooltip.test.js:18-23` name `Investida do Baluarte`, type, effect, `Recarga: 25s`, `Liberada`, img src; `V/skillBar.test.js:93` `Liberada`, `:98` `Bloqueada`; `e2e:77-83` `Corte Dimensional`, `Recarga: 20s`, `Liberada`, slot 2 `Bloqueada` | PASS |
| AC2 leave hides | removed | `V/skillTooltip.test.js:51` `toBeNull()`; `V/skillBar.test.js:117`; mutant 11 killed | PASS |
| AC3 tag shows the card of the skill that started it | owner card | `V/skillEffects.test.js:24` `asked toEqual [objectContaining({heroId:'lyra',slot:3})]`, `:26` `Recarga: 40s`; `src/domain/skills/skillCombat.test.js:153-156` owners; former leader (new): CG "skill tooltip of a former leader" `CG:3095-3112` `expect(ctx.scene.skillCard('lyra', 3)).not.toBe(ctx.scene.skillCard('kael', 3))` and identity with Lyra's skill; mutants 18, 25 killed | PASS (G5 closed; the card names are equal in the fake data, the identity assertion is what discriminates) |
| AC4 same texts as `renderSkillRow` | identical | `V/skillTooltip.test.js:32` `expect(node.querySelector('.skill-row').textContent).toBe(renderSkillRow(skill).textContent)` | PASS |
| AC5 click unchanged | `onUse(1)` | `V/skillBar.test.js:108` `expect(used).toEqual([ 1 ])` | PASS |
| AC6 heroes not loaded: no tooltip | none | `V/skillTooltip.test.js:70` `toBeNull()`; CG "shows no tooltip on a tag while the heroes are unknown" `toBeUndefined()`; CG "stays playable with no skill bar when the heroes cannot be loaded" no `.skill-slot` | PASS |
| AC7 tag disappears while open: tooltip hides | gone | CG "hides the tooltip when the effect ends" `CG:2959-2971`: before `expect(ctx.hud('.effect-tags [data-testid="skill-tooltip"]')).toBeDefined()`, after `expect(ctx.hud('.effect-tags .tag-effect')).toBeUndefined()` and the tooltip `toBeUndefined()` | PASS (G6 closed: the tooltip is proven open first) |
| Tooltip survives the countdown refresh | node kept | CG "shows the card of the skill that started a running effect ... keeps it as the seconds count down"; `V/skillEffects.test.js:50-52`; mutant 20 killed | PASS |

### P2: Skill keys Q, W, E (HUD-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 Q/W/E use slots 1/2/3 | slot 1/2/3 | CG "Q uses the skill of slot 1 as a click on its slot" `monster.health` and slot 1 `data-state` `cooling`, cooldown `20s`; "W uses slot 2 ... E uses slot 3" cooldown texts `25s`, `30s`; `e2e:91-94` press `q` lowers monster health and slot 1 is `cooling`; mutants 3, 4 killed (damage numbers moved with the star bonus, assertions follow the new values) | PASS |
| AC2 locked, cooling, paused, hero screen, pause menu, no monster: unchanged | health and cooldown unchanged | CG "ignores the keys of a locked slot and of a leader with no star", "ignores the keys while the pause menu is open" `CG:3059`, "ignores the keys while a hero screen is open", cooling in "uses a skill once per press"; Esc-paused and no-monster covered on the shared `useSkill` path by the key 1/2/3 tests | PASS |
| AC3 keys 1, 2, 3 keep working | slots 1-3 | CG "keeps the keys 1, 2 and 3 working" | PASS |
| AC4 slot shows `Q`/`W`/`E` | letters | `V/skillBar.test.js:84` `toEqual(['Q','W','E'])`; CG "shows the key letter on each slot"; `e2e:89` `toHaveText('Q')`; mutant 22 killed | PASS |
| AC5 held key fires once | repeat ignored | CG "ignores the repeats of a held key and uses the skill on the first press": `{repeat:true}` first leaves health at max, then `{repeat:false}` uses it once; mutant 5 killed | PASS |
| AC6 heroes not loaded or 0 stars: ignore | no damage | CG "ignores the keys while the heroes have not loaded" and "of a leader with no star" | PASS |
| Pause menu keys (assumption) | no key handler in the pause menu; Q/W/E and 1/2/3 do nothing while open | spec row corrected in bea1c4e (G7 was a wrong premise: 1. and 2. are labels); the "does nothing while open" outcome is covered by `CG:3059` | PASS (G7 closed) |

### P2: Equipment red dot (HUD-05)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 notice kept, 3 s | exact text, 3000 ms | `HU:637` `toBe('Equipamento encontrado: Raro Arma')`, `:639` `timers.map(delay) toEqual([ 3000 ])`; `e2e:110` | PASS (regression) |
| AC2 drop shows `equipment-badge` on the Equipamento button | visible inside `hud-equipment` | `HU:405-406`; `e2e:111` `toBeVisible()`; `HU:428`, `:447`; mutants 16 killed | PASS |
| AC3 opening hides it | hidden | `HU:410` `hidden toBe(true)`; `e2e:113-115`; mutant 15 killed | PASS |
| AC4 drop while Equipamento open: no dot | hidden | `HU:419` `hidden toBe(true)` | PASS |
| AC5 card and piece together: piece notice 3 s after the card's, later replaces earlier | piece wins, own 3 s | `HU:657-669` "a card then a piece" `timers.map(delay) toEqual([ 3000, 3000 ])`, `card-notice` `toBe('Equipamento encontrado: Raro Arma')`, after the card timer `hidden toBe(false)`, after the piece timer `hidden toBe(true)`; reverse order at `HU:644-651` | PASS (G8 closed) |
| Edge: sold on arrival: no dot | hidden | `HU:436` `hidden toBe(true)` | PASS |

**Status**: all ACs covered; spec-precision gaps flagged below.

**Spec-precision gaps (documented, not blocking)**:
- P1 HP AC3 "same width as the bar" and P1 wheel AC6 "stays visible under" the pause menu or a hero screen: CSS and stacking order, no measurable outcome in the spec (G4). Only the hero screen is asserted; the pause menu is not.
- P1 wheel AC5: the spec says the drawing must not block the skill bar and hero buttons, but only the monster click-through is asserted (the wheel sits away from them).

---

## Discrimination Sensor

Depth: lightweight-plus. Iteration 1: 31 mutants (30 killed, 1 survived). Iteration 2: the survivor and the two classes of the fix re-run, plus 17 earlier mutants re-run on the new code. One at a time in the worktree copy, file rewritten byte for byte after each; vitest run on the relevant test file. `git status --porcelain` shows only `validation.md`.

| # | File | Description | Test file | Result at iteration 2 |
| - | ---- | ----------- | --------- | --------------------- |
| 29 | `ClickerGame.js` `useSkill` | removed `updateHealthBar()` after a non-lethal skill hit (survived in iteration 1) | ClickerGame.test.js | Killed (1 failed, 259 passed) |
| 33 | `ClickerGame.js` `update` | new: `else if (alive && hits.length > 0)` -> `else if (false)` (no refresh on a non-lethal tick) | ClickerGame.test.js | Killed (1 failed) |
| 34 | `ClickerGame.js` `update` | new: guard `hits.length > 0` -> `> 99` | ClickerGame.test.js | Killed (1 failed) |
| 12 | `V/skillTooltip.js` | `if (!skill)` -> `if (false)` | skillTooltip.test.js | Killed only through an unhandled exception (7 passed, run exit non-zero). Unchanged, minor, documented |
| 1 | `monster.js` `healthText` | `Math.ceil` -> `Math.floor` | monster.test.js | Killed |
| 3 | `ClickerGame.js` SKILL_KEYS | `['Q',1]` -> `['Q',2]` | ClickerGame.test.js | Killed (2 failed) |
| 5 | `ClickerGame.js` keydown | removed repeat guard | ClickerGame.test.js | Killed |
| 6 | `ClickerGame.js` | chapter text `chapter + 1` | ClickerGame.test.js | Killed (3 failed) |
| 7 | `ClickerGame.js` `updateHealthBar` | removed HP text update | ClickerGame.test.js | Killed (8 failed) |
| 8 | `ClickerGame.js` | removed HP text clear at chapter end | ClickerGame.test.js | Killed |
| 30 | `ClickerGame.js` spawn | removed `updateHealthBar()` on spawn | ClickerGame.test.js | Killed (4 failed) |
| 20 | `ClickerGame.js` `refreshSkillUi` | always rebuild tags | ClickerGame.test.js | Killed |
| 25 | `ClickerGame.js` `skillCard` | owner hero -> current leader | ClickerGame.test.js | Killed (3 failed) |
| 9 | `V/elementWheel.js` | wrong arrow order | elementWheel.test.js | Killed |
| 11 | `V/skillTooltip.js` | removed `pointerleave` hide | skillTooltip.test.js | Killed |
| 22 | `V/skillBar.js` | Q/W swapped | skillBar.test.js | Killed |
| 15 | `HeroUi.js` | clear-on-open disabled | HeroUi.test.js | Killed |
| 16 | `HeroUi.js` | sold guard removed | HeroUi.test.js | Killed |
| 18 | `domain/skills/skillCombat.js` | buff without owner | skillCombat.test.js | Killed |
| 24 | `campaignSession.js` | `chapter ?? 1` | campaignSession.test.js | Killed |

**Result**: iteration 2: 20 mutants, 20 killed, 0 survived (1 killed only by an unhandled exception, #12). Cumulative with iteration 1: 34 distinct mutants, none survive on the fixed code.
**Sensor depth**: lightweight-plus
**Result**: PASS

---

## Interactive UAT Results

Not performed by the Verifier; `e2e/combatHud.spec.js` covers the real page for the five stories (5 of 5 pass).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | OK (the fix is an 4-line `else if`) |
| Surgical changes | OK |
| No scope creep | OK |
| Matches patterns | OK |
| Spec-anchored outcome check | OK, with the spec-precision gaps listed |
| Per-layer Coverage Expectation | OK (domain 1:1; HP covered for click, skill hit, tick, spawn, clear) |
| Every test maps to a spec requirement | OK |
| Documented guidelines followed | none found beyond ADR 0004 (HTML HUD); followed |

---

## Edge Cases

- [x] Fractional health from a skill tick rounds up and reaches the HUD (`CG:388-397`)
- [x] No heroes loaded still shows chapter and HP (`CG:399-403`)
- [x] Piece sold on arrival: no dot (`HU:436`)

---

## Fix Plans

Iteration 1 fixes (all closed by bea1c4e):

| Gap | Result |
| --- | ------ |
| G1 HP text and bar stale after a non-lethal tick | Fixed; `CG:388-397`; mutants 33, 34 killed |
| G2 surviving mutant 29 | Closed; `CG:374-386` |
| G3 no-heroes edge | Closed; `CG:399-403` |
| G4 wheel under the pause menu | Documented spec-precision gap (accepted) |
| G5 former leader tooltip | Closed; `CG:3095-3112` |
| G6 weak tag-disappears assertion | Closed; `CG:2959-2971` proves the tooltip was open first |
| G7 pause-menu keys 1/2 | Wrong spec premise, spec row corrected; nothing to test |
| G8 card then piece order | Closed; `HU:657-669` |

Remaining minor note (no fix required): mutant 12 is killed only through an unhandled exception; an explicit `expect` on the null-skill path is the existing test `V/skillTooltip.test.js:70` and already asserts `toBeNull()`, so the guard is covered.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| HUD-01 chapter pill | Pending | Verified |
| HUD-02 HP text | Needs Fix | Verified |
| HUD-03 element wheel | Pending | Verified (pause menu stacking: spec-precision gap) |
| HUD-04 skill tooltip | Pending | Verified |
| HUD-05 red dot | Pending | Verified |
| HUD-06 skill keys | Pending | Verified |

---

## Summary

**Overall**: Ready (PASS)

**Spec-anchored check**: all ACs and edge cases matched the spec outcome with a file:line citation; 3 spec-precision gaps flagged (equal width of the HP text, wheel under the pause menu, wheel vs skill bar and hero buttons)
**Sensor**: 20/20 mutants killed at iteration 2 (34 distinct overall, 0 survivors on the fixed code)
**Gate**: 925 vitest passed; 5/5 e2e combatHud passed

**What works**: chapter pill, HP text on click, skill hit, damage tick (killing or not), spawn and chapter end; element wheel; tooltips on slots and tags including a former leader; Q/W/E with repeat guard; red dot lifecycle including card then piece notices. No backend change.

**Next steps**: none for this feature; the orchestrator may distill lessons and deploy per CLAUDE.md.
