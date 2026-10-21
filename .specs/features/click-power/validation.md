# click-power Validation

**Date**: 2026-10-21
**Spec**: `.specs/features/click-power/spec.md`
**Diff range**: feature commits 9d57da1 (star bonus + `leaderAttacker`), 915d19f (combo + Lyra double click in the scene), d6ab091 (backend seed, Flyway V2, README, fake backend), b414757 (e2e lapse), 7b6824b (fix of iteration 1); verified at 7b6824b. The iteration 1 range was `8c3a67a..775f41f` restricted to the click-power paths. Commits cd95ed6..9e961ef (talents) are unrelated and were ignored, although `ClickerGame.js`, `leaderAttacker.js` and `skillCombat.js` now also hold talent code.
**Verifier**: independent sub-agent (author != verifier)
**Iteration**: 2 of 3 (iteration 1 verdict was FAIL: G1 surviving mutant 35, G2 to G5 minor gaps)
**Verdict**: PASS

---

## Task Completion

No tasks.md; inline steps, one commit each.

| Step | Commit | Status | Notes |
| ---- | ------ | ------ | ----- |
| Star bonus + `leaderAttacker` | 9d57da1 | Done | `starBonus.js`, `leaderAttacker.js`, `attackerFor` bonus argument |
| Combo + Lyra double click in the scene | 915d19f | Done | `combo.js`, `leaderBonus.js`, `skillDamage.js` multiplier/forceCritical, `ClickerGame.js` |
| Backend seed + V2 + README + fake backend | d6ab091 | Done | `HeroSeed.kt`, `V2__lyra_leader_bonus.sql`, `LyraLeaderBonusMigrationIT.kt` |
| e2e lapse | b414757 | Done | combo lapse in the e2e |

---

## Gate Check

- **Gate commands**: inside `game/`: `npx vitest run`; `npx playwright test e2e/clickPower.spec.js`; backend `./gradlew test --tests '*HeroSeedTest' --tests '*LyraLeaderBonusMigrationIT'` with the three `APP_*` env vars.
- **vitest**: 981 passed, 0 failed, 0 skipped (50 files); it was 925 at iteration 1 (the delta mixes the 5 fix tests with the unrelated talents tests). No test was deleted.
- **playwright clickPower.spec.js**: 5 of 5 passed (`e2e/clickPower.spec.js:40, 55, 63, 71, 79`).
- **backend**: BUILD SUCCESSFUL; HeroSeedTest 7 tests, LyraLeaderBonusMigrationIT 5 tests, 0 failures, 0 skipped.
- **Test integrity**: no test deleted; combat-hud closed at 925 and the count is unchanged.
- **Infra note**: the shared `game/node_modules` was incomplete (no `.bin`, no `@jridgewell`, no `@playwright`); the junction points to a scratch `npm ci` of the lockfile outside the repo. Playwright logs `Texture "coin" not found` (a public asset absent from the worktree), unrelated to the feature.

---

## Spec-Anchored Acceptance Criteria

Paths relative to `game/` unless noted. CG = `src/adapters/phaser/ClickerGame.test.js`, SB = `src/domain/heroes/starBonus.test.js`, LA = `src/domain/combat/leaderAttacker.test.js`, CB = `src/domain/combat/combo.test.js`, LB = `src/domain/heroes/leaderBonus.test.js`, EQ = `src/domain/equipment/equipment.test.js`, SD = `src/domain/skills/skillDamage.test.js`, SC = `src/domain/skills/skillCombat.test.js`.

### P1: Lyra's double critical click (PWR-01, PWR-02)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 roll 0.29 -> two critical hits | two hits of 2 on Base 1 | CG:2773-2781 `texts.map(text) toEqual(['2','2'])`, style color/fontSize critical, `monster.health toBe(996)`; LB:6 `clickHits('lyra', () => 0.29) toBe(2)`; `e2e/clickPower.spec.js:63` `dealt toBeCloseTo(4, 5)`; mutants 18, 19, 25 killed | PASS |
| AC2 roll 0.30 -> one hit by normal rules | one hit of 1, normal style | CG:2784-2791 `texts toHaveLength(1)`, `{text:'1', style: normal}`; LB:10 `clickHits('lyra', () => 0.3) toBe(1)`; `e2e:71` `dealt toBeCloseTo(1, 5)` | PASS |
| AC3 two numbers, both critical style | two critical texts | CG:2780 `every(color === '#ffc6a5' && fontSize === 48) toBe(true)`; CG:2855-2862 second number `x` greater than the first (mutant 29 killed) | PASS |
| AC4 resistance 100 still critical | both hits 2 | CG:2803-2811 `texts toEqual(['2','2'])` with `critResistance: 100`; SD:99 forced critical `toEqual({damage: 2, critical: true})` with resistance 100; mutants 22, 23, 25 killed | PASS |
| AC5 first hit kills -> no second hit | one number, monster dead | CG:2813-2822 `texts toEqual(['2'])`, `monster.dead toBe(true)`; mutant 24 killed | PASS |
| AC6 non-Lyra never rolls | one hit, `random` untouched | CG:2824-2831 `texts toHaveLength(1)` at roll 0.29; LB:21-22 `random not.toHaveBeenCalled()` for kael, orina, seraphine, vex, undefined; mutant 31 killed | PASS |
| AC7 skill hit / tick never roll | exactly two numbers for Flecha Dupla; tick without combo | CG:2833-2840 `texts toHaveLength(2)` at roll 0.29; tick `CG:2730-2739` `toBe('2.4')`; `clickHits` is called only in `hitMonster` | PASS |
| AC8 text on the leader card and in the hero screens | `30% de chance de executar um clique duplo crítico.` | Leader card: `e2e/clickPower.spec.js:82` `toContainText('30% de chance de executar um clique duplo crítico.')` (fake backend `e2e/support/fakeBackend.js:82`). Backend: `HeroSeedTest.kt:101` `assertEquals(text, lyra.leaderBonus)` (mutant B1 killed); `LyraLeaderBonusMigrationIT.kt:35` new DB seeds the new text; `:40` old text migrates; `:49` tuned `Tuned` survives (mutant B2 killed); `README.md:82`. Hero screens (G2 closed): `src/adapters/phaser/views/catalogView.test.js:73-76` `renderHeroDetail(lyra).querySelector('.hero-bonus').textContent toBe('Bônus de líder: 30% de chance de executar um clique duplo crítico.')` | PASS (card, hero detail, seed, migration, README, fake backend); the text always comes from the backend payload, so the other hero screens that print `hero.leaderBonus` share `catalogView.js:67` |
| Edge: `random` returns 0 rolls the double click | double | LB:10 (`() => 0` toBe 2), CG:2794-2801 `texts toHaveLength(2)` | PASS |
| Edge: Lyra double click + combo | same bonus on both hits, one click in the streak | CG:2842-2853 11th click `texts.slice(-2) toEqual(['2.2','2.2'])` and `combo-hud toBe('Combo x11 · +11%')` | PASS |

### P1: Star bonus (PWR-03, PWR-04)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 0 stars: none | all zero | SB:6 `toEqual({clickDamagePct:0, critChance:0, critDamagePct:0})`; LA:20-22 `baseDamage toBe(1)`, `critChance toBe(10)`, `critMultiplier toBe(2)`; CG:2875-2881 `texts.at(-1) toBe('1')` | PASS |
| AC2 1 star: +10 % click | 10/0/0 | SB:10 `toEqual({clickDamagePct:10, critChance:0, critDamagePct:0})`; CG:2889 `toBe('1.1')`; mutant 1 killed | PASS |
| AC3 2 stars: +20 % click, +20 % crit damage | 20/0/20 (total) | SB:14 `toEqual({clickDamagePct:20, critChance:0, critDamagePct:20})`; CG:2890 `toBe('1.2')`; mutants 3, 5 killed | PASS |
| AC4 3 stars: +40 %, +50 %, +30 points | 40/30/50 (total) | SB:18 `toEqual({clickDamagePct:40, critChance:30, critDamagePct:50})`; LA:28-30 `baseDamage toBeCloseTo(1.4)`, `critChance toBe(40)`, `critMultiplier toBeCloseTo(2.5)`; CG:2897 `toBe('1.4')` and CG:2901 `toBe('3.5')` at roll 0.29; CG:2904-2910 roll 0.40 -> `toBe('1.4')` (no crit above 40); `e2e:55` `dealt toBeCloseTo(1.4)`; mutants 2, 4 killed | PASS |
| AC5 2 stars + piece +10 % = base x 1.3 | 1.3 | LA:36 `baseDamage toBeCloseTo(1.3, 10)`; EQ:27-33 `baseDamage toBeCloseTo(1.3)` (+10 piece + 20 bonus), `critMultiplier toBeCloseTo(2.5)`; mutant 8 killed | PASS |
| AC6 fuse to a higher star count: new bonus on the next click | 1.1 after a fusion from 0 to 1 star | `ClickerGame.test.js:2791-2805` (G3 closed) first click `toBe('1')`, `heroes.fuse('kael', 0)`, next click `toBe('1.1')` | PASS |
| AC7 80 points + 3 stars: cap 100 | 100 | LA:48 `critChance toBe(100)`; EQ:31 `critChance toBe(100)`; mutant 9 killed | PASS |
| AC8 leader changes: new leader's bonus | Lyra 0 stars clicks 1 after Kael 3 stars | CG:2913-2921 `texts.at(-1) toBe('1')` after `setLeader('lyra')` | PASS |
| Units: click % adds to equipment %; crit damage on the multiplier (+0.2/+0.5); crit chance capped | adds | EQ:27-33, LA:36, LA:42 (`2 stars + 30 % piece -> critMultiplier 2.5`), EQ:36 `applies a bonus even when the hero wears nothing`; mutants 8, 10, 11, 12 killed | PASS |
| Edge: leader not loaded -> plain attacker, no star bonus | `PLAYER` itself | LA:10 `leaderAttacker({leader:null}) toBe(PLAYER)`; mutant 34 killed | PASS |
| Skill hits use the star-bonus attacker, no combo | 1 star Corte Dimensional 16.5 | CG:2724 `texts.at(-1) toBe('16.5')` after 11 clicks | PASS |

### P2: Click combo (PWR-05, PWR-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 bonus `min(50, streak)` before the click | first 0, second 1 | CB:10-11 `click() toBe(0)`, `toBe(1)`; mutant 15 (bonus after increment) killed | PASS |
| AC2 11th click x1.10 | 1.10 | CB:17 `clicks(combo, 11).at(-1) toBe(10)`; CG:2653 `texts.at(-1) toBe('1.1')`; SD:87-89 `multiplier 1.1 -> 1.1`; mutants 21, 28, 33 killed | PASS |
| AC3 51st click x1.50 and later the same | 1.5 | CB:24-26 `bonuses[49] toBe(49)`, `[50] toBe(50)`, tail `toEqual(Array(10).fill(50))`; CG:2661, CG:2664 `toBe('1.5')`; mutant 13 (cap 51) killed | PASS |
| AC4 1499 keep / 1500 end, next click x1.00 | boundary | CB:38-39 `kept.streak toBe(5)`, `ended.streak toBe(0)`; CB:48 `combo.click() toBe(0)`; CG:2677-2678 `toBe('Combo x5 · +5%')` vs `toBe('')`; CG:2686-2689 `texts.at(-1) toBe('1')`; mutants 14 (`>=` to `>`), 16, 26 killed | PASS |
| AC5 freeze while paused or a hero screen is open | text unchanged after 10 s paused | CG:2692-2702 pause: `toBe('Combo x5 · +5%')` after 10 s; CG:2704-2713 hero screen: same after 10 s. The 10 s freeze is asserted; the "resume then 1499 keeps" step of the pause test only shows the idle time was not consumed while paused | PASS |
| AC6 text `Combo x<streak> · +<bonus>%` | exact | CB:96 `comboText toBe('Combo x11 · +11%')`; CB:108 `'Combo x57 · +50%'`; CG:2654 same text in the HUD; `e2e:40` `toHaveText('Combo x11 · +11%')`; mutant 17 killed | PASS |
| AC7 streak ends: text hidden | empty | CB:100 `comboText(new Combo()) toBe('')`; CG:2678 `toBe('')`; CG:2642-2646 empty before the first click; `e2e:40` `toHaveText('', 4s)`; mutant 27 killed | PASS |
| AC8 skill use keeps streak and its timer | streak unchanged, timer unchanged | `ClickerGame.test.js:2721-2739` (G1 closed): after 11 clicks, 1000 ms, a skill, 499 ms the text is `Combo x11 · +11%`, then 1 ms more gives `toBe('')` (1500 since the last click); mutant 35 now killed | PASS |
| AC9 skill hit / tick get no combo | 16.5; 2.4 | CG:2724 `toBe('16.5')`; CG:2738 `toBe('2.4')` after 20 clicks | PASS |
| AC10 click not on a living monster leaves the streak | unchanged | Dead monster: CG:2741-2750 `combo(ctx) toBe(text)`; paused click: mutant 30 (paused click allowed) killed; click on the background is the same `hitMonster` entry (no separate path) | PASS |
| Edge: streak survives a kill and a new monster | x4 after kill + next | CG:2752-2761 `toBe('Combo x4 · +4%')` | PASS |
| Edge: streak survives a leader change | streak kept | `ClickerGame.test.js:2780-2789` (G4 closed) `combo-hud toBe('Combo x5 · +5%')` after `setLeader('lyra')` | PASS |

**Status**: all ACs and edge cases covered with an assertion that matches the spec outcome; iteration 1 gaps G1 to G5 closed.

**Spec-precision gaps (documented)**:
- P1 Lyra AC8 "in the hero screens": the spec does not list the screens; the leader card (e2e) and the hero detail (`catalogView.test.js:73-76`) are asserted, and the text itself comes from the backend payload.
- Combo AC5 "freeze": the spec does not say which screens count as a hero screen; the test opens the Heróis screen only.
- Combo AC10 "a click on the canvas but not on a living monster": the background click and the click on a dead monster share one guard; only the dead monster is asserted.

---

## Discrimination Sensor

Depth: expanded (more than 12 behavior-level faults). One at a time in the worktree, file bytes restored after each (CRLF preserved), vitest run on the relevant test files; backend mutants ran the two gradle classes. `git status --porcelain` shows only `validation.md` at the end.

| # | File | Description | Result |
| - | ---- | ----------- | ------ |
| 1 | `starBonus.js` | 1 star click 10 -> 11 | Killed |
| 2 | `starBonus.js` | 3 stars critChance 30 -> 25 | Killed |
| 3 | `starBonus.js` | 2 stars critDamage 20 -> 0 | Killed |
| 4 | `starBonus.js` | 3 stars critDamage 50 -> 40 | Killed |
| 5 | `starBonus.js` | 2 stars click 20 -> 30 (cumulative) | Killed |
| 6 | `leaderAttacker.js` | star bonus dropped (`{}`) | Killed |
| 7 | `leaderAttacker.js` | element ignored | Killed |
| 8 | `equipment.js` | star click `||` instead of `+` with the equipment percent | Killed |
| 9 | `equipment.js` | crit cap 100 -> 110 | Killed |
| 10 | `equipment.js` | star critChance ignored | Killed |
| 11 | `equipment.js` | star critDamage ignored | Killed |
| 12 | `equipment.js` | early return ignores `clickDamagePct` | Killed |
| 13 | `combo.js` | cap 50 -> 51 | Killed |
| 14 | `combo.js` | timeout `>=` -> `>` | Killed |
| 15 | `combo.js` | bonus read after the increment | Killed |
| 16 | `combo.js` | click does not reset the idle time | Killed |
| 17 | `combo.js` | text drops the `+` | Killed |
| 18 | `leaderBonus.js` | chance 30 -> 31 | Killed |
| 19 | `leaderBonus.js` | `<` -> `<=` | Killed |
| 20 | `leaderBonus.js` | hero id `'lyra'` -> `'kael'` | Killed |
| 21 | `skillDamage.js` | `multiplier` dropped from the final damage | Killed |
| 22 | `skillDamage.js` | `clickDamage` does not pass `forceCritical` | Killed |
| 23 | `skillCombat.js` | `click` drops `forceCritical` | Killed |
| 24 | `ClickerGame.js` | second-hit-on-kill guard removed | Killed |
| 25 | `ClickerGame.js` | `forceCritical: hits === 2` -> `false` | Killed |
| 26 | `ClickerGame.js` | `combo.advance(delta)` removed | Killed |
| 27 | `ClickerGame.js` | `showCombo()` removed from `update` | Killed |
| 28 | `ClickerGame.js` | click reads `combo.bonus` instead of `combo.click()` | Killed |
| 29 | `ClickerGame.js` | second number not offset | Killed |
| 30 | `ClickerGame.js` | paused click allowed | Killed |
| 31 | `ClickerGame.js` | leader id hard-coded `'lyra'` | Killed |
| 32 | `ClickerGame.js` | `leaderAttacker` ignores the pieces | Killed |
| 33 | `ClickerGame.js` | `multiplier` not passed to the click | Killed |
| 34 | `ClickerGame.js` | `leaderAttacker({ leader: null })` | Killed |
| 35 | `ClickerGame.js` | `useSkill` zeroes `combo.idleMs` (skill resets the timer) | Survived at iteration 1; **Killed at iteration 2** (1 failed) |
| B1 | `HeroSeed.kt` | text `30%` -> `35%` | Killed (gradle exit 1) |
| B2 | `V2__lyra_leader_bonus.sql` | `and leader_bonus = '<old text>'` condition removed | Killed (gradle exit 1) |
| B3 | `V2__lyra_leader_bonus.sql` | `where id = 'lyra'` -> `id <> 'zzz'` | Survived at iteration 1 (equivalent on the data); **Killed at iteration 2** (gradle exit 1, new test `another hero that holds the old text keeps it`) |

**Sensor depth**: expanded. **Result**: iteration 1: 36 of 38 killed (mutant 35 real survivor, B3 equivalent). Iteration 2: mutant 35 and B3 killed after the fix, and 13 earlier mutants re-run on the new code (3, 6, 8, 13, 14, 15, 20, 24, 25, 28, 30, 33 and 35, 13 in all) killed; 38 of 38 killed - PASS.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | OK: one pure `leaderAttacker`, `Combo`, `starBonus`, `clickHits`, each small |
| Surgical changes | OK: `attackerFor` keeps its old call shape (bonus argument defaulted) |
| No scope creep | OK; DOUBLE_HIT_OFFSET for the second number is the one unspecified addition and is tested |
| Matches patterns | OK |
| Spec-anchored outcome check | OK |
| Domain 1:1 ACs | OK; scene tests cover the wiring |
| Every test maps to a spec requirement | OK |
| Documented guidelines | CLAUDE.md git/deploy only; none for tests - strong defaults applied |

---

## Edge Cases

- [x] Lyra double click + combo: same bonus on both hits, one click in the streak (CG:2842-2853)
- [x] Leader not loaded: plain attacker (LA:10)
- [x] `random` returns 0 rolls the double click (LB:10, CG:2794-2801)

---

## Fix Plans

Iteration 1 gaps, all closed by 7b6824b:

- G1 (mutant 35, AC8 timer): closed, `ClickerGame.test.js:2721-2739` now expects the text to end at 1500 ms.
- G2 (Lyra text in the hero screens): closed, `catalogView.test.js:73-76`.
- G3 (fuse): closed, `ClickerGame.test.js:2791-2805`.
- G4 (streak across a leader change): closed, `ClickerGame.test.js:2780-2789`.
- G5/B3 (migration touches only Lyra): closed, `LyraLeaderBonusMigrationIT` `another hero that holds the old text keeps it`.

Remaining spec-precision gaps (not blocking): which screens count as a "hero screen" for the combo freeze (only Heróis is opened in the test); the background click and the dead-monster click share one guard and only the dead monster is asserted.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| PWR-01 | Pending | Verified |
| PWR-02 | Pending | Verified |
| PWR-03 | Pending | Verified |
| PWR-04 | Pending | Verified |
| PWR-05 | Pending | Verified |
| PWR-06 | Pending | Verified |

---

## Summary

**Overall**: Ready

**Spec-anchored check**: all ACs of the three stories and the three edge cases match the spec outcome (the iteration 1 gaps are closed); 2 spec-precision gaps documented
**Sensor**: 38 of 38 killed (35 and B3 killed after the fix)
**Gate**: vitest 981 passed; playwright 5 of 5; backend 12 tests passed (HeroSeedTest 7, LyraLeaderBonusMigrationIT 5)

**What works**: star table and units, attacker builder, cap at 100, both Lyra rolls, forced critical against resistance 100, second hit skipped on a kill, combo curve, 1499/1500 boundary, skill keeps the timer, freeze, text, fusion and leader change, seed, V2 migration (new, old, tuned and other heroes), README, fake backend.

**Next steps**: none; deploy per CLAUDE.md.
