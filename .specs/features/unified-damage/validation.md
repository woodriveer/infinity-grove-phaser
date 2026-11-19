# Unified Damage Validation

**Date**: 2026-11-19
**Spec**: `.specs/features/unified-damage/spec.md`
**Diff range**: `8ed5284..24c2a07` (backend 0929ac8 2dbae23 fbf19a0; game a456c2e 226ba9a 5b4d065 40e08e3 7b2eaa7 f6a9c71 39247cb; docs e770a55; e2e 0608fdc f8f0cd1; ui review c2181c7; author check 24c2a07)
**Verifier**: independent sub-agent (author ≠ verifier), round 1 of 3
**Full run**: `24c2a07` (backend, game unit, e2e and deploy suites, all with the coverage commands)
**Coverage summaries**: `.specs/features/unified-damage/coverage/` (`jacocoTestReport.xml`, `unit-coverage-summary.json`, `e2e-coverage-summary.json`), all from the full run at `24c2a07`. The folder is git-ignored (`.gitignore:13`), so it is not committed.

**Verdict**: FAIL
**Result**: FAIL

One gap: the aimed shot (and any forced critical) under Prisão de Espinhos or Bênção da Grande Árvore is pinned by no test. Two sensor mutants that take those effects off forced-critical strikes survive (M19, M20). Every other AC has `file:line` evidence, and 17 of the 18 first-pass mutants were killed. The survivor of that pass, M10, is equivalent.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 to T3 (backend) | ✅ Done | `[x]` in `tasks.md` |
| T4 to T10 (game) | ✅ Done | `[x]` |
| T11, T12 (e2e) | ✅ Done | `[x]` |
| T13 (docs) | ✅ Done | `[x]` |
| T14 (ui review) | ✅ Done | `ui-review.html` APPROVED, no findings |

---

## Spec-Anchored Acceptance Criteria

### P1: One damage in combat

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 One defense, no damage type | every strike meets `defenseOf`, `damageType` ignored | `game/src/domain/combat/damage.test.js:35` - an attacker with `damageType: 'MAGICAL'` on `physicalDefense` 80 → `toBeCloseTo(0.2)`; `:31` `magicalDefense` 80 never read → 1; `skillDamage.test.js:22` 2500 % on defense 90 → 2.5 | ✅ PASS |
| 2 E2 (old payload 50/10) | 12.5 | `game/src/domain/skills/skillCombat.test.js:54` - `hits toEqual [{ damage: 12.5 }]`; e2e `game/e2e/unifiedDamage.spec.js:92` (Base 1.4: 17.5) | ✅ PASS |
| 3 Prisão on every strike (E3, E5, E6, E7, E19) | ×(1 + 0.25 f) on click, hit, aimed shot and tick | click E3 `skillDamage.test.js:140` → 1.25; E5 `:201` → 1.3125; hit `:139` → 1.25; E6 `skillCombat.test.js:319` → 31.25; tick E7 `skillDamage.test.js:141` → 2.5; E19 `skillCombat.test.js:879` → 41.015625. **Aimed shot: no test** (M19 survives) | ❌ GAP (aimed shot) |
| 4 E4 Orina 3★ click under Prisão | 1.75 | `skillDamage.test.js:145` - `toBeCloseTo(1.75)`; e2e `unifiedDamage.spec.js:76` - `toBeCloseTo(STAR * 1.25)` | ✅ PASS |
| 5 Bênção on every strike (E8 to E12, E18) | ×(1 + 0.30 f) on every strike, +25 f click percent | E8 `skillDamage.test.js:66` → 10.4; E10 `:59` → 1.625; E11 `:179` → 1.99375; E12 `:175` → 15.66; E18 `:70` → 2.6; E9 below. **Aimed shot: no test** (M20 survives) | ❌ GAP (aimed shot) |
| 6 E9 Seraphine 3★ Luz Divina under Bênção | 14.56 | `skillCombat.test.js:60` - `toBeCloseTo(14.56, 9)`; e2e `unifiedDamage.spec.js:89` | ✅ PASS |
| 7 Brado on the one defense (E15, E16) | −30 f points, never below 0 | `skillDamage.test.js:128` → 0.8, `:129` defense 10 → 1 (floor), `:133` Chuva → 20, `:193-194` level 3 → 0.95 / floor | ✅ PASS |
| 8 PHYSICAL_BREAK on every strike (E13, E14) | `max(0, defense - V)` | `skillCombat.test.js:191` Chuva → 2250, Investida 360; `:202` tick → 170; `talents.test.js:117` grades added; `:113` floor at 0 | ✅ PASS |
| 9 E17 Prisão + Bênção click | 2.03125 | `skillDamage.test.js:149` - `toBeCloseTo(2.03125)` (unit only: one leader at a time in the game) | ✅ PASS |
| 10 Unchanged numbers (E1, E6, E7, E10, E11, E15, E19) | same as before | E1 `damage.test.js:28` → 0.5; the rest as cited above | ✅ PASS |

Independent test (998.25 health after Prisão + click): `game/e2e/unifiedDamage.spec.js:73-76` (dealt 1.75).

### P1: One enemy defense from the backend to the screen

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 Model: element, defense 0-90, crit 0-100 | rejects outside | `backend/.../domain/EnemyStatsTest.kt:21` rejects above 90, `:26` negative, `:31` crit range | ✅ PASS |
| 2 Progress and farm payloads | `defense` = `physicalDefense` = `magicalDefense`; ch.1 boss 30, miniboss 11, monster 0, ch.6 boss 53, ch.2 Rever chefes 35 | `backend/.../adapter/web/ProgressControllerIT.kt:119-131` (30/30/30, 0/0/0, 11/11/11); `:228-230` (53); `FarmControllerIT.kt:302-304` (35) | ✅ PASS |
| 3 Row 85/86 reads 85 | defense 85 | `backend/.../adapter/repository/ChapterRepositoryIT.kt:152` inserts (85, 86), `:179` `assertEquals(EnemyStats(NATURE, 85, 87), read.boss)` | ✅ PASS |
| 4 Store d in both columns | `physical_defense` = `magical_defense` = d | `EnemyRepositoryIT.kt:65-72` (81, 81); `ChapterRepositoryIT.kt:188` | ✅ PASS |
| 5 Enemy line text | `Water  Defesa 11%  Crit res 33%` | `game/src/adapters/phaser/ClickerGame.test.js:2098`; e2e `unifiedDamage.spec.js:144-146` | ✅ PASS |
| 6 Old payload 50/10 | `Defesa 50%`, fights at 50 | `ClickerGame.test.js:2036` (`Darkness  Defesa 50%  Crit res 100%`); e2e `unifiedDamage.spec.js:95,99`; `game/e2e/elements.spec.js:63` | ✅ PASS |
| 7 No stats | `Fire  Defesa 0%  Crit res 0%`, defense 0 | `ClickerGame.test.js:2116`; `damage.test.js` "meets defense 0 when the stats carry no defense field" → 1 | ✅ PASS |
| 8 Break 5 on 20, upgrade to 6 | `Defesa 15%` then `Defesa 14%` on the same monster | e2e `unifiedDamage.spec.js:181,188`; `ClickerGame.test.js:3542` (15 %), `:3696` (19 % after an upgrade) | ✅ PASS |
| 9 No `Physical def` / `Magical def` | absent | e2e `unifiedDamage.spec.js:106-107`; `ClickerGame.test.js:3544` | ✅ PASS |
| 10 Chip art | `data-stat="defense"`, 12 px shield `#b07a3a`, no physical/magical chip | e2e `unifiedDamage.spec.js:143,147,174` (`rgb(176, 122, 58)`, 12px); `ClickerGame.test.js:2124` | ✅ PASS |

### P1: One defense break talent and the refund

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 27 talents, order and branches | 9 ids × 3 grades, `TIME, TIME, BREAK, BREAK, POWER, POWER, POWER, COMBO, POWER` | `backend/.../adapter/web/TalentControllerIT.kt` "a new player gets the 27 talents" (`talents.size()` 27, ids, `List(3){branches}.flatten()`) | ✅ PASS |
| 2 Label, branch, unit, perLevel | `Quebra de defesa`, BREAK, points, 1/2/3 | `TalentControllerIT.kt:153-165` (labels, perLevel 2 and 3); `domain/TalentsTest.kt:15,253` (grade 1 values and unit) | ✅ PASS |
| 3 Upgrade MAGICAL_BREAK* | 404 `TALENT_NOT_FOUND`, nothing changes | `TalentControllerIT.kt:169-175` (all three ids, level stays 0) | ✅ PASS |
| 4 V11 deletes only MAGICAL_BREAK* | other rows, awards, wallets unchanged | `UnifiedDamageMigrationIT.kt:120-131`, `:173-187` | ✅ PASS |
| 5 earned 20, PB 3, MB 5 | `{ 20, 3, 17 }`, PB level 3 | `UnifiedDamageMigrationIT.kt:135-144` (`TalentPoints(20, 3)`, available 17); over HTTP `TalentControllerIT.kt:179-191` (earned 20, spent 3, available 17); PB level 3 kept `UnifiedDamageMigrationIT.kt:129` | ✅ PASS |
| 6 MB 10 + MB_G2 3 | +16 points | `UnifiedDamageMigrationIT.kt:147-159` (available 20 of 20 after, 16 spent before) | ✅ PASS |
| 7 Row outside the catalog ignored | level 0, no points spent, no failure | `TalentControllerIT.kt:179`; `service/TalentServiceTest.kt:195,208,217`; `domain/TalentsTest.kt:271,280` | ✅ PASS |
| 8 Game drops MAGICAL_BREAK* | no card, no effect | `game/src/application/talents/talentCollection.test.js:134-160` (load, upgrade, reset); `talents.test.js:84` (no effect). Unit only: the fake backend no longer answers the retired ids | ✅ PASS |
| 9 Talentos column | 6 cards, no `talent-MAGICAL_BREAK*` | e2e `unifiedDamage.spec.js:201-208`; `game/src/adapters/phaser/views/talentsView.test.js` columns 2, 2, 4, 1 | ✅ PASS |

### P1: Texts without damage types

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 New database answers the After texts | 9 texts | `backend/.../domain/HeroSeedTest.kt:120,125-151` (all nine); `HeroControllerIT.kt:460-475` (Orina over HTTP); `UnifiedDamageMigrationIT.kt:228` | ✅ PASS |
| 2 V11 rewrites the Today texts | After texts | `UnifiedDamageMigrationIT.kt:190-196` (all nine) | ✅ PASS |
| 3 Tuned text survives | unchanged | `UnifiedDamageMigrationIT.kt:199,210` (all nine tuned) | ✅ PASS |
| 4 No `mágic`, `físic`, `Poder Arcano`, `de Força` | none | `HeroSeedTest.kt:111-117` | ✅ PASS |
| 5 Orina leader bonus on screen | `Bônus de líder: +20% de dano total. (em breve)` and `Líder · +20% de dano total. (em breve)` | e2e `unifiedDamage.spec.js:227,234` | ✅ PASS |
| 6 Panel order, 10 lines | ids in the spec order, no `damageType` / `breakPhysical` / `breakMagical` | `game/src/domain/equipment/leaderStats.test.js:11-16`; e2e `unifiedDamage.spec.js:218-221` | ✅ PASS |
| 7 `Quebra de defesa: 3` / `: 0` | exact text | `leaderStats.test.js:87,96`; e2e `unifiedDamage.spec.js:217` | ✅ PASS |
| 8 README | one damage, none of the five phrases | `grep -n -E "dano mágico\|dano físico\|Poder Arcano\|resistência física\|resistência mágica" README.md` prints nothing (run now); `README.md:55` `- **Defesa:** reduz todo o dano recebido (cliques e habilidades)`, `README.md:93` `+20% de dano total.` | ✅ PASS |

**Status**: ❌ one gap (the aimed shot under Prisão and Bênção, in AC P1-3 and AC P1-5). 35 of 37 ACs fully covered; the other two are covered for every strike except the aimed shot. Screen ACs: 10/10 with e2e (enemy 5 to 10, talents 9, texts 5 to 7). Combat AC 9 (E17) and talents AC 8 are unit only by design: the fake backend runs one leader at a time and no longer answers the retired ids.

---

## Edge Cases

- [x] Prisão ends: `skillCombat.test.js:571` (1.25 then 1); e2e `unifiedDamage.spec.js:78-80` (1.75 then 1.4)
- [x] Bênção ends: `skillCombat.test.js:560` (10.4 then 8)
- [x] Tick at the last second: `skillCombat.test.js:548` (Prisão 2.5, 2.5, then 2); `:536` (Bênção 2.6, then 2)
- [x] Break larger than the defense: `talents.test.js:113`
- [x] `defense` 40 and `physicalDefense` 70: `damage.test.js:41` → 0.6; `monster.test.js:219`; e2e `unifiedDamage.spec.js:115`
- [x] Player without MAGICAL_BREAK*: `UnifiedDamageMigrationIT.kt:162`
- [x] Reset with an ignored row: `TalentControllerIT.kt:195`; `AccountResetServiceTest.kt:167`; `TalentServiceTest.kt:225`

---

## Success Criteria

| # | Check (run now) | Result |
| - | --------------- | ------ |
| 1 | `git grep -n -i -E "mágic\|físic\|Poder Arcano\|de Força" -- backend/src/main game/src` (tests excluded) | 9 hits, all guard lines of `V11__unified_damage.sql` (lines 13 to 53) ✅ |
| 2 | `git grep -n -E "MAGICAL\|magicalDefense\|damageType" -- game/src ':!*.test.js'` | 4 hits: `talentCollection.js:8` (`RETIRED_TALENT_IDS`), `monster.js:7` (the `defenseOf` comment), plus two comments the criterion does not name: `campaign.js:9` and `damage.js:10`. No code reads those fields. Judged a cosmetic deviation from the criterion's wording, not a gap |
| 3 | Unit tests pin E1 to E19, the refund rows and the 27 talents; an IT runs the migration | ✅ (aimed-shot gap aside) |
| 4 | e2e covers the chip, Prisão on a click, Bênção on a skill hit, Talentos, the panel and Orina's bonus | ✅ `unifiedDamage.spec.js`, 11 scenarios, all passed |
| 5 | Every suite passes | ✅ except the failures listed below, none caused by the feature |

---

## Discrimination Sensor

Run with `node scripts/sensor.mjs` in the main checkout (no other agent testing). Each run's output went to a log in the scratchpad, and each kill was checked as a real test failure: vitest `N failed`, Gradle `<Class> > <test> FAILED`, Playwright `1 failed`. Controls first: an unchanged `Talents.kt` with `.\gradlew.bat test --tests "*TalentServiceTest"` → survived (BUILD SUCCESSFUL), and an unchanged `style.css` with the Playwright command → survived. So the commands pass when nothing is mutated. A first control run with a bare `gradlew.bat` showed "killed" only because cmd.exe could not find the command. That run was discarded and the backend mutants use `.\gradlew.bat`.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| M1 | `game/src/domain/skills/skillDamage.js` | Prisão skips clicks (the pre-feature behaviour, AC P1-3/4) | killed (4 failed) |
| M2 | `game/src/domain/skills/skillDamage.js` | Bênção skips skill hits (AC P1-5/6, E8/E9) | killed (2 failed) |
| M3 | `game/src/domain/skills/skillDamage.js` | Prisão skips damage ticks (AC P1-3, E7, tick edge case) | killed (1 failed) |
| M4 | `game/src/domain/combat/monster.js` | physicalDefense wins over defense (edge case 40 / 70) | killed (2 failed) |
| M5 | `game/src/domain/combat/monster.js` | old payload falls back to magicalDefense (AC P1-2, E2) | killed (10 failed) |
| M6 | `game/src/domain/skills/skillDamage.js` | Brado takes the defense below 0 (AC P1-7) | killed (2 failed) |
| M7 | `game/src/domain/talents/talents.js` | break writes physicalDefense, so a new payload keeps its defense (AC P1-8) | killed (8 failed) |
| M8 | `game/src/domain/talents/talents.js` | break takes the defense below 0 (edge case defense 10, break 15) | killed (2 failed) |
| M9 | `game/src/application/talents/talentCollection.js` | retired MAGICAL_BREAK* not dropped (AC talents-8) | killed (3 failed) |
| M10 | `game/src/adapters/phaser/ClickerGame.js` | chip reads `stats.defense` instead of `defenseOf(stats)` (AC enemy-6/7) | survived, **equivalent** (see below) |
| M11 | `game/public/style.css` | defense chip loses the brown shield (AC enemy-10) | killed (e2e 1 failed) |
| M12 | `game/src/domain/equipment/leaderStats.js` | panel line reads the retired talent (AC texts-7) | killed (2 failed) |
| M13 | `backend/.../domain/Talents.kt` | stored row outside the catalog is not ignored (AC talents-7) | killed (`TalentServiceTest` 2 failed) |
| M14 | `backend/.../adapter/web/ProgressController.kt` | legacy magicalDefense not equal to defense (AC enemy-2) | killed (`ProgressControllerIT` 2 failed) |
| M15 | `backend/.../adapter/repository/ChapterEntities.kt` | defense read from magical_defense (AC enemy-3) | killed (`ChapterRepositoryIT` 1 failed) |
| M16 | `backend/.../db/migration/V11__unified_damage.sql` | grade 3 magical break rows survive the migration (AC talents-4) | killed (`UnifiedDamageMigrationIT` 1 failed) |
| M17 | `backend/.../db/migration/V11__unified_damage.sql` | leader bonus update loses its old-text guard (AC texts-3) | killed (`UnifiedDamageMigrationIT` 2 failed) |
| M18 | `backend/.../adapter/repository/EnemyRepository.kt` | magical_defense not written equal to the defense (AC enemy-4) | killed (`EnemyRepositoryIT` 3 failed) |
| M19 | `game/src/domain/skills/skillDamage.js` | Prisão skips forced-critical strikes (the aimed shot, AC P1-3) | **survived** (`src/domain/skills`, 139 passed) |
| M20 | `game/src/domain/skills/skillDamage.js` | Bênção skips forced-critical strikes (the aimed shot, AC P1-5) | **survived** (`src/domain/skills`, 139 passed) |

**Sensor depth**: P0-style (talent refund and migration touch stored data): 20 mutants over every changed production file that carries logic.
**Result**: 20 mutants, 17 killed, 3 survived (1 equivalent, 2 real), 0 invalid; isolation ok after each run (`git status --porcelain` matched the baseline).

**M10 is equivalent.** Both callers pass `monsterAfterBreak(...)`, which always writes `defense` (`ClickerGame.js:766`, `:781`; `talents.js` `monsterAfterBreak`). So `stats.defense` equals `defenseOf(stats)` for every input the scene can reach. No test can tell them apart through the scene. It is not a fix task.

**M19 and M20 are real.** `strike` (`skillDamage.js:19-36`) gives Prisão and Bênção to every strike. But no unit or e2e test lands Tiro Preciso's cast hit (`skillCombat.js` `castHit`, `forceCritical: true`) while either effect runs. Gating both effects on `!forceCritical` leaves all 139 tests under `src/domain/skills` green. The combination can't happen in today's game, because only the leader's skills are on the bar (`ClickerGame.js:947`). It can happen in `SkillCombat`, which the unit tests already drive across heroes (`skillCombat.test.js:536`, Bênção then Tempestade Arcana).

---

## Gate Check

| Suite | Command | Result |
| ----- | ------- | ------ |
| Backend | `cd backend && ./gradlew cleanTest test` | 1043 tests, 0 failed, 0 skipped (BUILD SUCCESSFUL, JaCoCo written) |
| Game unit | `cd game && npm run test:coverage` | 80 files, 1811 tests, 1811 passed |
| e2e | `cd game && npm run test:e2e:coverage -- [--keep] <files>` in 12 parts (the last 4 are `uiRedesign.spec.js --shard=N/4`) | 392 tests, 389 passed, 3 failed (none caused by the feature, below) |
| Deploy | `node --test --experimental-test-coverage "deploy/**/*.test.mjs"` | 289 tests, 287 passed, 2 failed (not caused by the feature, below) |

- **Test count before / after** (static count of test declarations at `8ed5284` and `24c2a07`): backend `@Test` 1018 → 1048 (+30), game unit `it(`/`test(` 1734 → 1764 (+30), e2e `test(` 374 → 385 (+11). The tests that pinned the split were renamed after the new behaviour, not deleted (for example `damage.test.js:35`, `talents.test.js:84`).
- **Skipped**: none.

### Failures not caused by the feature

| Test | Evidence |
| ---- | -------- |
| `game/e2e/dragEquip.spec.js:586` (top-edge scroll, scrollTop 124 vs 0) | Passes alone at `24c2a07` (1 passed, 21.1 s). At `8ed5284`, the game code before the feature (temporary worktree, own port 5299, since removed), the whole `dragEquip.spec.js` fails the same way: `:586` scrollTop 124 vs 0, and `:640` also fails (216 vs ≥ 275). The same file at `24c2a07` failed `:586` only (scrollTop 20 vs 0). It is a load-dependent flake that existed before the feature and is on the known-flake list. The shorter Equipamento panel does not cause it. |
| `game/e2e/splash.spec.js:25` (plays on its own, login form not visible) | Passes alone (1 passed, 16.1 s); known flaky under load. Splash code is not in the range. |
| `game/e2e/wake.spec.js:56` (server down message in < 15 s, took 28 s) | Passes alone (1 passed, 11.5 s); a timing assertion under load. Wake code is not in the range. |
| `deploy/regression.test.mjs:385` and `:412` (CLI exit code 3221226505 = 0xC0000409 instead of 0 / 1) | `git diff --stat 8ed5284..24c2a07 -- deploy publish.sh deploy.sh` is empty. The `regression.mjs` child process prints its result and then exits with a native Windows crash code (Node v23.11.0). The same 2 fail when `deploy/regression.test.mjs` runs alone. Environmental. |

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ `defenseOf` is the one tolerant reader. The only redundancy is the second `defenseOf` in `showEnemyStats` (M10, harmless) |
| Surgical changes | ✅ 54 files, all named by the tasks |
| No scope creep | ✅ no column drop, no API field removal (TD-002 kept) |
| Matches patterns | ✅ V2-style guarded updates, `fromStored` follows the existing WARN log convention |
| Spec-anchored outcome check (asserted values match spec) | ✅ every E-number asserted to its spec value (1e-9 to 1e-10) |
| Per-layer Coverage Expectation met | ❌ the aimed shot under Prisão / Bênção has no assertion (M19, M20) |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed: `CLAUDE.md`, `.claude/agents/verifier.md`, AD-016 (expand/contract: no schema change, both columns written) | ✅ |

---

## Fix Plans

### Fix 1: Pin the aimed shot under Prisão and Bênção (Minor, owner `test-engineer`)

- **Root cause**: AC P1-3 and AC P1-5 name the aimed shot, but no test lands Tiro Preciso's cast hit while Prisão or Bênção runs, so M19 and M20 survive.
- **Fix task**: in `game/src/domain/skills/skillCombat.test.js`, add two tests that drive `SkillCombat` across heroes, as `:536` does. On a defenceless monster of the attacker's element, Base 1, cast Prisão de Espinhos level 1 (`'orina', 1`), start Tiro Preciso (`'lyra', 2`), and assert the cast hit after 2 s. Prisão lasts 2 s, so with the hero-skills rule that the effect still counts at its last second, the hit lands within it: 3000 % × the ×2 critical × 1.25 = **75**. Then cast Bênção da Grande Árvore level 1 (`'seraphine', 1`), start Tiro Preciso, and assert 60 × 1.3 = **78**. Derive the exact timing from the spec rules, not from the code. If Prisão has ended when the cast lands, pick a Prisão level or a cast order that keeps it running, and say which in the test name.
- **Done when**: both tests pass, and `node scripts/sensor.mjs` with M19 and M20 (`npx vitest run src/domain/skills`) reports both killed.
- **Priority**: Minor. No player can reach the combination today, since only the leader's skills are on the bar, but the spec requires it and the sensor shows the gap.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| UDMG-01 | Pending | ✅ Verified |
| UDMG-02 | Pending | ❌ Needs Fix (aimed shot under Prisão) |
| UDMG-03 | Pending | ❌ Needs Fix (aimed shot under Bênção) |
| UDMG-04 to UDMG-12 | Pending | ✅ Verified |

---

## Summary

**Overall**: ❌ Not Ready (round 1 of 3). One minor test-only gap.

**Spec-anchored check**: 35/37 ACs fully matched to the spec outcome, 2 partly (aimed shot); 0 spec-precision gaps.
**Sensor**: 20 mutants, 17 killed, 3 survived (M10 equivalent, M19 and M20 real).
**Gate**: backend 1043/1043, game unit 1811/1811, e2e 389/392, deploy 287/289. Every failure is outside the feature, with evidence above.

**What works**: one defense from the database to the screen, with the legacy fields kept for the previous Worker; Prisão and Bênção on clicks, hits and ticks; Brado and the break talent on the one defense; the 27-talent catalog, the tolerant load and the V11 refund; the texts, the panel and the README.

**Next steps**: Fix 1 (`test-engineer`), then round 2: M19, M20 plus 1 to 3 new mutants on the new tests' targets, the game unit suite and `unifiedDamage.spec.js`. Then the final gate with the full backend suite. The full e2e suite runs again only if production code changes.
