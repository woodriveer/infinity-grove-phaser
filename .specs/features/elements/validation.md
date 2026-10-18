## Validation: elements - PASS

**Verdict**: PASS

**Date**: 2026-10-18
**Spec**: `.specs/features/elements/spec.md`
**Diff range**: `92d0250^..HEAD` (8 commits, 92d0250 to d33ba51), limited to backend/src, game/src, game/e2e, game/public/style.css
**Verifier**: independent sub-agent (author != verifier)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T8 | Done | All Done-when boxes checked in tasks.md; commits 92d0250, ac5a74b, 43a7f98, 37ea520, c832aab, 0fa7a5a, 4f01203, d33ba51 |

---

## Spec-Anchored Acceptance Criteria

Shorthand: `ED` = game/src/domain/combat/damage.test.js, `EL` = game/src/domain/combat/elements.test.js, `MO` = game/src/domain/combat/monster.test.js, `CA` = game/src/domain/campaign/campaign.test.js, `CG` = game/src/adapters/phaser/ClickerGame.test.js, `ES` = backend EnemyStatsTest.kt, `RI` = backend ChapterRepositoryIT.kt, `PI` = backend ProgressControllerIT.kt.

### ELEM-01 Damage follows the element table

| Criterion | Spec-defined outcome | file:line + assertion | Result |
| --------- | -------------------- | --------------------- | ------ |
| AC1 fire x2 nature, x0.5 water, x0.9 light/dark | 2 / 0.5 / 0.9 / 0.9 | `EL:7` row FIRE `[1,0.5,2,0.9,0.9]`, asserted per pair at `EL:23` `expect(elementMultiplier(attacker, defender)).toBe(TABLE[attacker][column])` | PASS |
| AC2 nature x2 water, x0.5 fire, x0.9 light/dark | 2 / 0.5 / 0.9 | `EL:9` row NATURE `[0.5,2,1,0.9,0.9]`, `EL:23` | PASS |
| AC3 water x2 fire, x0.5 nature, x0.9 light/dark | 2 / 0.5 / 0.9 | `EL:8` row WATER `[2,1,0.5,0.9,0.9]`, `EL:23` | PASS |
| AC4 light x0.9 dark, x1.8 triad | 0.9 / 1.8 | `EL:10` row LIGHT `[1.8,1.8,1.8,1,0.9]`, `EL:23` | PASS |
| AC5 dark x0.9 light, x1.8 triad | 0.9 / 1.8 | `EL:11` row DARKNESS `[1.8,1.8,1.8,0.9,1]`, `EL:23` | PASS |
| AC6 same element x1.0 | 1.0 (5 diagonal pairs) | diagonal of `EL:7-11`, `EL:23`; all 25 pairs enumerated, count asserted `EL:29` `toHaveLength(25)` | PASS |
| AC7 fire vs darkness deals 0.9 | 0.9 | `ED:16` `expect(calculateDamage({defender: enemy('DARKNESS'), random: never}).damage).toBeCloseTo(0.9, 10)`; scene `CG:1467-1473` `health toBe(max - 0.9)` and `texts[0].text toBe('0.9')` | PASS |
| AC8 fire vs nature deals 2 | 2 | `ED:20` `.damage).toBe(2)`; scene `CG:1458-1465` `health toBe(max - 2)` | PASS |
| AC9 fractional damage subtracted exactly | health = max - amount | `MO:86-93` `monster.hit(0.9); expect(health).toBe(9.1)`; `MO:95-105` 100 x 0.1 reaches `toBe(0)`; `CG:1467-1473` | PASS (see spec-precision gap SP1) |
| AC10 health 0 or less = dead, bar at 0 width | `dead === true`, fill width 0 | `MO:107-115` `health toBe(0); dead toBe(true)`; `CG:1521-1528` `expect(ctx.fill.width).toBe(0)` | PASS |
| AC11 damage number at most 1 decimal, no trailing zero | '0.9', '2', '1.3' | `ED:124-144` `formatDamage(0.9) toBe('0.9')`, `formatDamage(2) toBe('2')`, `formatDamage(1.26) toBe('1.3')`; scene `CG:1476-1483` `texts[0].text toBe('0')` | PASS |

### ELEM-02 Enemies carry attributes from the database

| Criterion | Spec-defined outcome | file:line + assertion | Result |
| --------- | -------------------- | --------------------- | ------ |
| AC1 seed chapter 1 with four attributes for monster, miniboss, boss | cycle FIRE..DARKNESS; monster 0/0/0; miniboss def 10+n, crit res 10+2n; boss DARKNESS 30/30/30 | `ES:47-55` element list equals cycle twice; `ES:57-65` `(11..20)` defenses, `(12..30 step 2)` crit res; `ES:67-72` `Triple(0,0,0)`; `ES:74-77` `EnemyStats(DARKNESS,30,30,30) == first().boss`; persisted round trip `RI` (saved chapter reads back, helper `RI:36-48`) | PASS |
| AC2 GET /progress returns the four attributes for monster, miniboss, boss | JSON `definition.boss.*`, `stages[i].monster.*`, `stages[i].miniboss.*` | `PI:81-101` e.g. `.body("definition.boss.element", equalTo("DARKNESS"))`, `.body("definition.stages[0].miniboss.critResistance", equalTo(12))`, `stages[4].monster.element equalTo("DARKNESS")`, `stages[9].miniboss.critResistance equalTo(30)` | PASS |
| AC3 spawned monster gets element and three values | `monster.stats` equals the encounter stats | `CA:108-118` `expect(statsAt(2, PHASE)).toEqual({...monster, physicalDefense: 2})`, miniboss `toEqual(miniboss)`, boss `toEqual(boss)`; `MO:117-123` `new Monster(10,1,stats).stats toBe(stats)`; `CG:1530-1552` HUD text per encounter; e2e `elements.spec.js:39-49` | PASS |
| AC4 unknown stored element fails the progress request, spawns no monster | error on load | `RI:108-116` `assertFailsWith<RuntimeException> { repository.findByNumber(number) }` and `message contains "PLASMA"` (repository level only; no HTTP status assertion, no scene test) | PARTIAL, gap G1 |
| AC5 out-of-range defense/crit resistance refused on save | rejects defense <0 or >90, crit res <0 or >100 | `ES:20-40` `assertFailsWith<IllegalArgumentException> { stats(physical = 91) }`, `magical = 91`, `-1`, `crit = 101`, `crit = -1`; ends accepted `ES:15-18`. Validation lives in the domain constructor; no repository-level save test (spec does not name the mechanism) | PASS with spec-precision gap SP2 |
| AC6 pre-feature row reads FIRE/0/0/0 | `EnemyStats.DEFAULT` | `RI:119-133` raw SQL insert without the columns, then `assertEquals(EnemyStats.DEFAULT, read.boss)` / `.monster` / `.miniboss`; `ES:42-45` DEFAULT equals `EnemyStats(FIRE,0,0,0)` | PASS |

### ELEM-03 Defenses and critical hits shape the damage

| Criterion | Spec-defined outcome | file:line + assertion | Result |
| --------- | -------------------- | --------------------- | ------ |
| AC1 physical damage x (1 - phys def / 100) | defense 50 gives 0.5 | `ED:68` `enemy('FIRE', 50, 0) ... .damage).toBe(0.5)`; ignores magical `ED:72` `toBe(1)`; scene `CG:1485-1491` `health toBe(max - 0.5)` | PASS |
| AC2 magical damage x (1 - magical def / 100) | def 20 gives 0.8 | `ED:75-79` `{...PLAYER, damageType: MAGICAL}`, `enemy('FIRE', 80, 20)`, `toBeCloseTo(0.8, 10)` | PASS |
| AC3 player damage type physical | `PHYSICAL` | `ED:49-51` `expect(PLAYER).toEqual({element:'FIRE', damageType:'PHYSICAL', baseDamage:1, critChance:10, critMultiplier:2})` | PASS |
| AC4 critical when random x 100 < 10 x (1 - res/100) | r=0.0999 crit, r=0.1 not; res 50: 0.0499 crit, 0.05 not | `ED:89-92` `random: () => 0.0999 ... critical toBe(true)`, `0.1 ... toBe(false)`; `ED:94-97` `0.0499 true`, `0.05 false` | PASS |
| AC5 critical doubles damage | nature, def 50, crit gives 2 | `ED:85-87` `toEqual({damage: 2, critical: true})`; scene `CG:1493-1502` `health toBe(max - 2)` | PASS |
| AC6 crit resistance 100 never crits | critical false at lowest roll | `ED:99-101` `random: always (0) ... critical toBe(false)`; scene `CG:1512-1519` `health toBe(max - 1)`; e2e `elements.spec.js:53-65` (miniboss res 100, random 0, health 99.55) | PASS |
| AC7 formula `1 x mult x (1 - def/100) x (2 if crit)`, no rounding | 0.9 x 0.7 x 2 = 1.26; def 90 x 0.5 = 0.05 | `ED:107-109` `toBeCloseTo(1.26, 10)`; `ED:103-105` `toBeCloseTo(0.05, 10)` | PASS |
| AC8 critical damage number marked | distinct from normal | `CG:1493-1502` `texts[0].style toEqual(objectContaining({color:'#ffd700', fontSize:52}))`; normal `CG:1504-1510` `{color:'#ffffff', fontSize:38}` | PASS with spec-precision gap SP3 |

### ELEM-04 The HUD shows the enemy attributes

| Criterion | Spec-defined outcome | file:line + assertion | Result |
| --------- | -------------------- | --------------------- | ------ |
| AC1 element name, physical def, magical def, crit res shown while a monster is on screen | element + 3 values | `CG:1530-1534` `expect(enemyText(ctx)).toBe('Water  Physical def 11%  Magical def 22%  Crit res 33%')`; miniboss `CG:1536`, boss `CG:1542`; e2e `elements.spec.js:39` `.enemy-stats toHaveText('Nature  Physical def 0% ...')` | PASS with spec-precision gap SP4 |
| AC2 replaced when the monster is replaced | next monster stats | `CG:1554-1563` after kill + respawn `enemyText toBe('Nature  Physical def 0% ...')`; farm respawn `CG:1586-1596` | PASS |
| AC3 none when no monster on screen | empty text | `CG:1554-1563` `toBe('')` after death; `CG:1565-1571` boss timeout `toBe('')`; `CG:1573-1577` chapter complete `toBe('')` | PASS |
| AC4 attribute text click-through | pointer-events none | `CG:1579-1583` `expect(element.pointerEvents).toBe('none')` (mocked DOM element; real CSS is not asserted) | PASS |

### Edge Cases

| Edge case | file:line + assertion | Result |
| --------- | --------------------- | ------ |
| Defense 90 and multiplier 0.5 deals 0.05 | `ED:103-105` `toBeCloseTo(0.05, 10)`; `CG:1476-1483` `health toBe(max - 0.05)` | PASS |
| Damage below 0.05 shows "0", health lowered exactly | `ED:140-143` `formatDamage(0.04) toBe('0')`; `CG:1476-1483` `texts[0].text toBe('0')` and health | PASS |
| Damage past 0 sets health to 0 | `MO:107-115` `health toBe(0)`; M18 sensor mutation killed by `monster.test.js` "never goes below 0 health" | PASS |
| Missing attacker/defender element throws | `EL:32-38` `toThrow('Unknown element: PLASMA')`, `toThrow('Unknown element')` for `undefined`; `ED:119-121` | PASS |
| Leave/farm a boss keeps same attributes on respawn | farm `CG:1586-1596` `enemyText toBe('Light  Physical def 4% ...')`; `MO:125-134` stats kept on respawn. Leave-fight goes through `bossTimedOut()` (ClickerGame.js:176-185) and is not asserted separately for attributes | PASS |

### Success Criteria (spec.md)

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| 25 pairs unit-tested | `EL:23`, `EL:29` | PASS |
| Fire needs fewer clicks on nature than water | Not tested as a click count; implied by `EL:9`/`ED:60` (2.0 vs 0.5) | indirect, gap G4 |
| GET /progress on fresh DB returns element + three values for every encounter | `PI:81-101` samples stage 1, 5, 10 and the boss; not every stage | PASS (partial sample, G5) |
| Existing stage/boss timer/leave-fight/farm tests pass unchanged | full game suite green; no earlier test assertion removed (diff only adds, plus the `dice` fixture) | PASS |

**Status**: all 4 stories covered; 1 AC partial (ELEM-02 AC4), 4 spec-precision gaps flagged.

---

## Discrimination Sensor

Isolated `git worktree` (HEAD, d33ba51), `game/node_modules` linked by junction, mutations applied to scratch copies and reverted after each run. Control run on the unmutated worktree: green. Game mutants run with the full `npx vitest run` (391 tests); backend mutants run with `./gradlew test --tests "*EnemyStatsTest" --tests "*ChapterRepositoryIT" --tests "*ProgressControllerIT"` (control exit 0; kill reasons spot-checked: assertion failures, not build errors).

| # | File | Fault | Killed? (first failing tests) |
| - | ---- | ----- | ------- |
| M1 | combat/elements.js | STRONG 2 -> 0.5 | Killed (7 failed: elements, damage, scene) |
| M2 | combat/elements.js | light/dark vs triad 1.8 -> 1.2 | Killed (6 failed) |
| M3 | combat/elements.js | light vs dark and dark vs light 0.9 -> 1.0 | Killed (2 failed) |
| M4 | combat/elements.js | same element 1.0 -> 0.9 | Killed (41 failed) |
| M5 | combat/damage.js | defense factor `/100` -> `/200` | Killed (8 failed) |
| M6 | combat/damage.js | physical and magical defense swapped | Killed (9 failed) |
| M7 | combat/damage.js | crit `<` -> `<=` | Killed (4 failed) |
| M8 | combat/damage.js | crit multiplier ignored (2 -> 1) | Killed (3 failed) |
| M9 | combat/damage.js | critResistance not applied | Killed (3 failed) |
| M10 | combat/monster.js | health rounding removed | Killed (1 failed: float dust to 0) |
| M11 | combat/damage.js | formatDamage rounding removed | Killed (4 failed) |
| M12 | ClickerGame.js | scene ignores critical styling | Killed (1 failed) |
| M13 | campaign/campaign.js | chapter boss stats replaced by default | Killed (2 failed) |
| M14 | campaign/campaign.js | miniboss uses monster stats | Killed (3 failed) |
| M15 | ClickerGame.js | HUD stats not cleared on death | Killed (1 failed) |
| M16 | ClickerGame.js | Monster built without encounter stats | Killed (5 failed) |
| M17 | ClickerGame.js | element name capitalisation dropped | Killed (6 failed) |
| M18 | combat/monster.js | health floor `Math.max(0, ...)` removed | Killed (2 failed) |
| K1 | domain/Chapter.kt | MAX_DEFENSE 90 -> 100 | Killed |
| K2 | domain/Chapter.kt | MAX_CRIT_RESISTANCE 100 -> 101 | Killed |
| K3 | domain/Chapter.kt | seeded boss element DARKNESS -> LIGHT | Killed |
| K4 | domain/Chapter.kt | miniboss base defense 10 -> 9 | Killed |
| K5 | ChapterEntities.kt | entity read drops boss fields (DEFAULT) | Killed |
| K6 | ProgressController.kt | miniboss response built from monster stats | Killed |
| K7 | domain/Chapter.kt | seeded element cycle shifted by one | Killed |
| K8 | ChapterEntities.kt | miniboss physical defense mapped from magical | Killed |
| K9 | ChapterEntities.kt | column default 'FIRE' -> 'WATER' | Killed (RI raw-insert test) |
| K10 | ProgressController.kt | critResistance dropped from response | Killed |
| K11 | domain/Chapter.kt | physical defense lower bound relaxed to -5 | Killed |
| K12 | ChapterEntities.kt | unknown element falls back to FIRE instead of failing | Killed |

**Sensor depth**: expanded (P0-style, 30 manual behavior-level faults)
**Result**: 30 injected, 30 killed, 0 survived - PASS

Isolation: scratch worktree removed (gradle build paths exceeded the Windows path limit; removed with robocopy mirror then `git worktree prune`; `git worktree list` shows only the main tree). `git status --porcelain` after the sensor equals the baseline: only `?? game/public/assets/coin-copper.png`, `coin-gold.png`, `coin-silver.png`.

---

## Gate Check

- **Game**: `cd game && npm test` - 20 files, 391 passed, 0 failed, 0 skipped.
- **Backend**: `cd backend && ./gradlew ktlintCheck cleanTest test` (forced re-run, Docker/Testcontainers) - BUILD SUCCESSFUL; JUnit XML totals 280 tests, 0 failures, 0 errors, 0 skipped; ktlintCheck clean.
- **E2E**: not re-run by the Verifier (reported green by the author; `game/e2e/elements.spec.js` has 3 tests citing ELEM-01, 03, 04).
- **Test count before feature**: not measured (no baseline checkout run); the diff only adds tests and removes no assertion from earlier tests.
- **Skipped tests**: none.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | OK |
| Surgical changes | OK; the diff also carries pause-menu `updateSize` and `pauseElement` changes in ClickerGame.js plus a Preloader.js edit (outside the feature, listed in the diff range but excluded from scope) |
| Matches patterns | OK (pure domain files, `createHtml`, `require` validation, IT style) |
| Spec-anchored outcome check | OK, 4 spec-precision gaps flagged |
| Every test maps to a spec requirement | OK; the `dice` fixture and `updateSize` pause-menu test belong to the injected random source and the unrelated pause-menu fix |
| Documented guidelines followed | `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md` per tasks.md matrix |

---

## Spec-precision gaps

- SP1 (ELEM-01 AC9 vs edge case "exact"): the spec says "exact decimal", the implementation rounds health to 6 decimals (monster.js:93-119) to avoid float dust. Tests assert the rounded outcome; the spec should say "to 6 decimals".
- SP2 (ELEM-02 AC5): "refuse to save" does not name the mechanism; it is enforced by the domain constructor only, so a direct SQL write (like the one used in RI:110) bypasses it.
- SP3 (ELEM-03 AC8): "mark its damage number" is undefined; tests pin gold `#ffd700` and 52 px, not a spec value.
- SP4 (ELEM-04 AC1): the HUD text format is not defined by the spec; tests pin `Water  Physical def 11%  Magical def 22%  Crit res 33%`.

---

## Ranked gaps (none blocks PASS)

1. G1 (medium) ELEM-02 AC4: "fail the progress request with an error and spawn no monster" is proven only at the repository (`RI:108-116`). No test asserts the HTTP status of `GET /progress` with a corrupt element, and no scene test asserts that no monster spawns when the progress request fails for that reason (the generic load-failure scene test is the nearest cover).
2. G2 (low) ELEM-02 AC5 lacks a persistence-level test; only `EnemyStatsTest` covers it (SP2). Seed/saved definitions with out-of-range values cannot be built, but raw SQL can still store them.
3. G3 (low) ELEM-04 AC4: asserts the mock's `pointerEvents` flag, not real click-through in a browser; e2e never clicks over the HUD text.
4. G4 (low) Success criterion "fire needs fewer clicks on nature than water": no click-count test; derived from multipliers.
5. G5 (low) `PI:81-101` samples stages 1, 5 and 10 only, not the whole seeded cycle; the full cycle is covered at domain level by `ES:47-65`.
6. G6 (low) Leave-fight is not asserted separately for HUD stats clearing (shares `bossTimedOut()` with the timeout test at `CG:1565-1571`).

## Summary

**Overall**: Ready.

**Spec-anchored check**: 28 of 29 ACs match the spec outcome (ELEM-02 AC4 partial), 4 spec-precision gaps.
**Sensor**: 30/30 mutations killed.
**Gate**: game 391 passed, backend 280 passed, ktlint clean.
