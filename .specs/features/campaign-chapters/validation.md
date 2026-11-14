# Campaign Chapters 6 to 15 Validation

**Date**: 2026-11-14
**Spec**: `.specs/features/campaign-chapters/spec.md` (owner approved 2026-11-14; 15 chapters)
**Diff range**: `91e3111..5cae738` on `main` (T1 to T12, `b3839bf` ktlint, `fe8805c` e2e expectation). Out of scope: `e027ff8` and earlier. T13 and T14 (contract migration) deferred, not counted as gaps.
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Validation: campaign-chapters - FAIL

**Result**: FAIL - 4 blocking or major gaps (ranked below). Every suite is green; the gaps are missing or weak evidence, not failing tests.

**Spec-anchored check**: 24 of 36 ACs with `file:line` evidence matching the spec outcome; 9 partial and 3 without evidence (see tables).
**Gate**: backend 920 passed, 0 failed; game unit 1574 passed, 0 failed; e2e campaign spec 6 passed, 0 failed.
**Sensor**: 16 mutations injected, 14 killed, 2 survived (M4 equivalent inside chapters 1 to 15; M11 a real gap).
**Report**: `.specs/features/campaign-chapters/validation.md`

**Ranked gaps**:
1. Previous-backend compatibility of the expand (AD-016) not executed - CHAP-08 AC 5, CHAP-09 AC 7 - `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/HealthHitPointsMigrationIT.kt:63` (type check only; no run of the previous backend).
2. V9 drop migration asserts 2 of 15 rules; mutant M11 survived - CHAP-09 AC 5 - `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/CoinDropMigrationIT.kt:43`, production `backend/src/main/resources/db/migration/V9__coin_drop_rebalance.sql:29`.
3. Chapter Table not pinned row by row (success criterion unmet) - CHAP-04 AC 1, 2 - `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/domain/ChapterTest.kt:135` to `:187`.
4. Team damage texts `Dano: <n>/s` do not exist in `game/src` - CHAP-07 AC 1 - no `file:line` (surface absent; spec-precision and scope gap).

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 to T12 | Done | Commits `91e3111..8cc0578`, `2209f4c`, `5cae738` in range |
| T13, T14 | Deferred | Contract migration, out of scope by instruction |
| b3839bf, fe8805c | Done | Format and e2e expectation, reviewed below |

---

## Spec-Anchored Acceptance Criteria

Story IDs follow the spec's traceability table. "Spec outcome" is the value or state the spec defines.

### Campaign goes on (CHAP-01, CHAP-02, CHAP-03)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 CLEARED chapter boss c 1 to 14 | store c+1, stage 1, PHASE, phase 1, not completed | `ProgressTest.kt:167` `assertFalse(next.completed)`; `:168` `assertEquals(ProgressPosition(6, 1, Encounter.PHASE, 1), next.position)`; HTTP `ProgressControllerIT.kt:225-236` (chapter 6, stage 1, PHASE, phase 1). Code path `Progress.kt:72` | ✅ (pinned at c=5, shared path for others) |
| AC2 CLEARED chapter 15 boss | store completed | `ProgressTest.kt:177` `assertTrue(done.completed)`; `:178` `assertEquals(last.position, done.position)`; e2e `game/e2e/campaignChapters.spec.js:73` `toBe(true)` | ✅ |
| AC3 seed missing chapters 6 to 15 (10 stages, 3 rules) | created with Chapter Table values | `ChapterSeederIT.kt:51-57` (all 15 present, 45 rules, values); no test deletes a chapter 6 to 15 (`:41-48` deletes chapter 1 only) | ⚠️ partial |
| AC4 start leaves chapters 1 to 5 unchanged | no overwrite | `ChapterSeederIT.kt:61-67` (edited chapter 1 kept, `:67` `assertEquals(1234L, ...)`); `:95-102` (rule 2 kept) | ✅ |
| AC5 completed at 5 then GET | chapter 6, stage 1, PHASE, phase 1, not completed, chapter 6 definition | `ProgressControllerIT.kt:210-221` (`chapter 6`, `stage 1`, `PHASE`, `completed false`, DB chapter 6); definition not asserted here | ⚠️ spec-precision (definition field) |
| AC6 game fights ch 6 to 15, HUD `Capítulo <c>` | HUD text and fight values | e2e `campaignChapters.spec.js:56` and `:59` `toHaveText('Capítulo 6')`; fight values of a chapter 6 to 15 definition only via `campaign.test.js:171` (3e9 case) | ⚠️ partial |
| AC7 chapter 15 dies in time | completion message, no monster | `game/src/adapters/phaser/ClickerGame.test.js:1340` (message, `monster` null; chapter 10 progress); e2e `campaignChapters.spec.js:72` `toHaveText('Chapter complete!')`, no monster assertion | ⚠️ partial (e2e lacks "no monster") |

### Chapter numbers (CHAP-04, CHAP-05)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 health formula c 6 to 15 | boss `2000 x 256 x 2^(c-5)`, phase and miniboss formulas | `ChapterTest.kt:136-138` (factors 256, 512, 262144); `:145-148` (chapter 6); `:156-157` (chapter 10); `:179-184` (chapter 15). Chapters 7 to 9, 11 to 14 not asserted | ⚠️ partial |
| AC2 defenses c 6 to 15 | boss and miniboss defenses and crit caps | `ChapterTest.kt:158-163` (chapter 10); `:170-171` (chapter 12, crit cap 70); `:180-186` (chapter 15). Chapters 6 to 9, 11, 13, 14 not asserted | ⚠️ partial |
| AC3 phase defenses 0, crit 0, time 30 000 / 60 000 | ubiquitous | `ChapterTest.kt:189-202` (loop chapters 6 to 15, `:195-200`) | ✅ |
| AC4 chapter 10 values | boss 16 384 000, stage 10 miniboss 3 112 960, boss def 65, mini def 55 | `ChapterTest.kt:156-163` (each value asserted) | ✅ |
| AC5 chapter 15 values | boss 524 288 000, def 80, crit 70 | `ChapterTest.kt:179-186` | ✅ |
| AC6 element of chapter c 6 to 15 | FIRE: 6 FIRE, 7 NATURE, 8 WATER, 9 DARKNESS, 10 LIGHT, 11 FIRE | `ChapterOrderTest.kt:45-51` | ✅ |
| AC7 chapter c 6 to 14 boss drops c+1 element | first win certain; later wins at rate | `CardDropsTest.kt:94-96` (chapter 6 first win `lyra` = NATURE); `:104-106` (chapter 14 `seraphine`); rate `:72-77` | ✅ |
| AC8 chapter 15 boss drops chapter 15 element | `seraphine` (LIGHT) | `CardDropsTest.kt:87-91`, `:109-111` | ✅ |

### Health without a 32-bit limit (CHAP-08)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 64-bit storage everywhere | Long in entities, domain, JSON | `ChapterEntities.kt:59` `bossHitPoints: Long`; `:110`, `:112` Long; `Chapter.kt:51`, `:31`; `ProgressController.kt:44-45`, `:69`; `HealthHitPointsMigrationIT.kt:35-37` (`bigint`) | ✅ |
| AC2 GET progress answers 3 000 000 000 | JSON integer 3000000000 | `ProgressControllerIT.kt:102-104` `assertEquals(3_000_000_000L, bossHealth)` via `getLong` | ✅ |
| AC3 game spawns exact health, shows `HP 3B/3B` | exact health, text | `campaign.test.js:168-171` (`toBe(3000000000)`); `monster.test.js:181-182` (`toBe('HP 3B/3B')`). No e2e scenario | ⚠️ e2e missing (player-visible) |
| AC4 expand copies every value | unchanged copy | `HealthHitPointsMigrationIT.kt:47-59` (`is distinct from` counts 0; chapter 5 = 512000) | ✅ |
| AC5 previous backend starts, answers, accepts (rollback) | previous slot works on migrated DB | No test runs the previous backend. Only the precondition: `HealthHitPointsMigrationIT.kt:66-67` (legacy columns `integer`, nullable) | ❌ GAP |
| AC6 health below 1 refused | refused at save | `ChapterTest.kt:31-32`, `:36-37`, `:46-47` (`require`); DB `HealthHitPointsMigrationIT.kt:74` (`assertFailsWith` for 0) | ✅ |

### Coin drops (CHAP-09)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 rule formula | ranges `2m-6m`, `8m-20m`, `30m-70m`, interval 1 500 | `ChapterTest.kt:218-224` (coin factor list); `:258-264` (45 distinct ids) | ✅ |
| AC2 chapter 1 rules | 2-6, 8-20, 30-70 | `ChapterTest.kt:227-231`; `ChapterSeederIT.kt:74-76` | ✅ |
| AC3 chapter 8 rules 22-24 | 256-768, 1024-2560, 3840-8960 | `ChapterTest.kt:243-247` | ✅ |
| AC4 chapter 15 rules 43-45 | 704-2112, 2816-7040, 10560-24640 | `ChapterTest.kt:251-255`; `ChapterSeederIT.kt:57` | ✅ |
| AC5 migration moves old ranges of chapters 1 to 5 | rule 5 to 16-40, rule 13 to 32-96 (examples), all 15 rules | `CoinDropMigrationIT.kt:43-52` (rules 5 and 13 only). Migration SQL rules are correct (`V9__coin_drop_rebalance.sql:21-35`). Mutant M11 survived | ⚠️ partial (13 of 15 rules unasserted) |
| AC6 other ranges unchanged | rule 6 at 77-99 stays | `CoinDropMigrationIT.kt:56-62` | ✅ |
| AC7 previous backend keeps crediting kills | same tables, old backend credits | No test. Structural only (same columns) | ❌ GAP |

### Reset reward (CHAP-06)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 reset pays c for c 2 to 15 | 2, 5, 10, 15 | `AccountResetTest.kt:22-25`, `:35-36`; `AccountResetControllerIT.kt:178-183` (`reward` and `crystals` 10) | ✅ |
| AC2 completed campaign pays 15 | 15 | `AccountResetTest.kt:29-31`; `AccountResetServiceTest.kt:98-101`; `AccountResetControllerIT.kt:171-176`; `accountReset.test.js:20` | ✅ |
| AC3 game label and dialog | `Resetar conta (+<c> cristais)`, `Você ganha <c> cristais.`, 15 when completed | `ClickerGame.test.js:4580`, `:4587` (15), `:4593` (12), `:4611` (dialog); e2e `campaignChapters.spec.js:80` and `:87` | ✅ |

### Short format for big numbers (CHAP-07)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 damage, HP text and team damage texts abbreviated | `Dano: <n>/s` and `Dano da equipe: <n>/s` | Damage and HP covered (see AC3 to AC5). Team texts: `grep` finds no `Dano:` in `game/src` | ❌ not covered (surface absent; spec-precision gap) |
| AC2 below 1 000 unchanged | `999` stays | `numberFormat.test.js:5` (`'999'`); `monster.test.js:142-170` (HP below 1000) | ✅ |
| AC3 ten listed values | 999, 1K, 1.5K, 50K, 999.9K, 1M, 1.1M, 16.4M, 2.5B, 1T | `numberFormat.test.js:5`, `:6`, `:7`, `:9`, `:10`, `:11`, `:14`, `:15`, `:17`, `:20` | ✅ |
| AC4 chapter 1 boss `HP 2K/2K`; chapter 10 `HP 16.4M/16.4M` | the two HP texts | e2e `campaignChapters.spec.js:93` (`HP 2K/2K`, custom 2000-HP definition); units `monster.test.js:174`, `:178`. Chapter 10 text has no e2e | ⚠️ partial |
| AC5 click of 5 000 reads `5K` | `5K` | e2e `campaignChapters.spec.js:107` (`toContain('5K')`), `:108`; unit `damage.test.js:105-106` | ✅ |

---

## Edge Cases

| Edge case | `file:line` | Result |
| --- | --- | --- |
| Chapter 5 reset stays 5 | `AccountResetTest.kt:25` `assertEquals(5, ...)` | ✅ |
| Completed at 5, farm lists chapter 6 bosses beaten (none yet) | No test. `grep` of `FarmServiceTest.kt` and `FarmControllerIT.kt` finds no chapter 6 case | ❌ no evidence |
| Hand-made chapter 6 to 15 row left unchanged | No test (`ChapterSeederIT.kt` covers chapter 1 only) | ❌ no evidence |
| 1 049 999 reads `1M` | `numberFormat.test.js:13` | ✅ |
| 2 000 boss, 1 999.95 left reads `HP 2K/2K` | `monster.test.js:214` | ✅ |
| 2 000 boss, 999.95 left reads `HP 1K/2K` | `monster.test.js:198` | ✅ |

## Success Criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| Every Chapter Table number has a unit test | Rows 7 to 9, 11, 13, 14 unasserted; rows 6, 10, 12, 15 partial (`ChapterTest.kt:135-187`) | ❌ |
| Completed at 5 resumes at 6 with no manual change | `ProgressControllerIT.kt:210-221` (backend only) | ✅ |
| Chapters 1 to 5 answer the same definitions | `ChapterTest.kt:205-216` pins six values only | ⚠️ partial |
| 3 000 000 000 boss round-trips DB to HP text | `ChapterRepositoryIT.kt:93-102` (DB) and `monster.test.js:182` (text); no single scenario | ⚠️ partial |
| Seeded rules of 1, 5, 8, 15 match Coin Drops | `ChapterTest.kt:227-255` | ✅ |

---

## Discrimination Sensor

Isolated in a temporary `git worktree` at `5cae738` (never `git stash`). Each mutant changed one line, ran the covering tests, and was restored. The worktree was removed afterwards and the real tree was checked against the baseline.

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `backend/.../domain/Chapter.kt:133` | Health factor of chapter 6+ one chapter behind | ✅ Killed (5 failing, ChapterTest) |
| M2 | `backend/.../domain/Chapter.kt:88` | Defense cap 80 to 79 | ✅ Killed (ch 15 table) |
| M3 | `backend/.../domain/Chapter.kt:89` | Crit resistance cap 70 to 69 | ✅ Killed (ch 12, ch 15) |
| M4 | `backend/.../domain/Chapter.kt:185-186` | Boss defense cap removed | ❌ Survived. Equivalent inside chapters 1 to 15: uncapped boss defense is 80 at chapter 15, exactly the cap |
| M5 | `backend/.../domain/Chapter.kt:95` | Coin factor step 32 to 33 | ✅ Killed |
| M6 | `backend/.../domain/Chapter.kt:91` | Phase monster copper upper bound 6 to 7 | ✅ Killed (4 failing) |
| M7 | `backend/.../domain/ChapterOrder.kt:9` | `MAX_CHAPTER` 15 to 14 | ✅ Killed (ChapterOrderTest, ProgressTest) |
| M8 | `backend/.../domain/Progress.kt:70` | Transition stops after chapter 5 | ✅ Killed (3 failing) |
| M9 | `backend/.../domain/AccountReset.kt:18` | Backend reset capped at 5 | ✅ Killed (AccountResetTest) |
| M10 | `backend/.../adapter/repository/ChapterEntities.kt:74` | Boss health truncated to 32 bits on load | ✅ Killed (ChapterRepositoryIT, ProgressControllerIT) |
| M11 | `backend/src/main/resources/db/migration/V9__coin_drop_rebalance.sql:29` | Rule 9 maximum off by one (120-281) | ❌ Survived. Rule 9 unasserted → fix task (gap 2) |
| G1 | `game/src/domain/combat/numberFormat.js:6` | Threshold `< 1000` to `<= 1000` | ✅ Killed (3 failing) |
| G2 | `game/src/domain/combat/numberFormat.js:21` | Rounding overflow `>= 1000` to `> 1000` | ✅ Killed (`999950` reads `1M`) |
| G3 | `game/src/domain/campaign/accountReset.js:14` | Game reset capped at 5 | ✅ Killed |
| G4 | `game/src/domain/combat/monster.js:12` | HP text rounds to nearest, not up | ✅ Killed |
| G5 | `game/src/domain/combat/damage.js:36` | `rounded >= 1000` to `> 1000` | ✅ Killed |

**Sensor depth**: expanded (16 manual mutations, no mutation tool configured; the change touches data integrity and migrations).
**Result**: 14/16 killed. Survivors: M4 (equivalent inside the campaign, see gap 9) and M11 (real gap, gap 2).
**Isolation**: after the worktree removal, the real tree's `git status --porcelain` matched the baseline recorded before the sensor, except three untracked paths created by another agent during the session (`.specs/features/campaign-chapters/ui-review.html`, `.specs/features/campaign-chapters/ui-review/`, `game/ui-review/campaignChapters.shots.js`, created 05:38 to 05:40). Those files were not created or modified by this verification and are not part of the commit.

---

## Test Integrity (edits outside the task lists)

| File | Change | Verdict |
| --- | --- | --- |
| `EnemyRepositoryIT.kt:20-24` | Cleanup boundary 80 to 81 | Legitimate: the chapter 15 boss seeds physical defense 80, so the old cleanup would delete a seeded row. The test's own rows (81+) are still removed. No assertion changed |
| `MonsterHealthMigrationIT.kt:36-42` | `@AfterTest` restore limited to chapters 1 to 5 | Legitimate: keeps the seeded chapters 6 to 15 intact. No assertion weakened |
| `SchemaConstraintsIT.kt:127` | FK test uses chapter 16 instead of 6 | Legitimate: chapter 6 exists now; chapter 16 does not. Same intent (missing chapter) |
| `WalletControllerIT.kt:33-37`, `:58-60`, `:82-96` | Ranges and counts for 45 rules, `seedRange` with the Coin Drops formula | Legitimate: `seedRange` restates the spec formula, the in-range assertions are kept |
| `WalletFlowIT.kt:70-71` | Queue count 15 to 45 | Legitimate |
| `AccountResetServiceTest.kt:98-101` | Completed campaign pays 15 at chapter 15 | Strengthened to the new rule |
| `ProgressServiceTest.kt:116`, `:409` | Missing-chapter test uses 16; last-chapter test uses 15 | Legitimate: chapter 6 exists now |
| `ProgressTest.kt:148-185` | Renamed to "fifteenth"; `61 * 15`; chapter 5 opens 6; completed at 5 opens 6 | Strengthened |
| `uiRedesign.spec.js:733` | `HP 1000/1000` to `HP 1K/1K` | Format only; the monster still has 1000 maximum health |
| `ClickerGame.test.js:423-449` | HP texts to `1K`, `983.5/1K`, `997.6/1K` | Format only |

Test counts: `@Test` annotations in `backend/src/test` 888 to 923 (+35). `it(`/`test(` in `game/src` and `game/e2e` 1783 to 1818 (+35). No test removed.

Notes: `ChapterRepositoryIT.kt:29` uses number 90, while the T2 task text names 99. Isolation holds, so this is a deviation from the task text, not a weakening.

---

## Gate Check

- **Backend**: `cd backend && ./gradlew cleanTest test jacocoTestReport`. BUILD SUCCESSFUL in 2m 39s. 920 test cases, 0 failed, 0 errors, 0 skipped. JaCoCo: lines 98.99% (2756/2784), branches 93.12% (826/887).
- **Game unit**: `cd game && npm test`. 72 files, 1574 passed, 0 failed.
- **Game unit coverage**: `npm run test:coverage`. Lines 97.95%, branches 95.18%. Feature files at 100% lines and branches: `numberFormat.js`, `damage.js`, `monster.js`, `accountReset.js`, `campaign.js`.
- **E2E, campaign spec**: `npx playwright test e2e/campaignChapters.spec.js`. 6 passed, 0 failed.
- **E2E coverage, scoped to the campaign spec**: `npm run test:e2e:coverage -- e2e/campaignChapters.spec.js`. Lines 47.36% (1251/2641), branches 23.64%. This is a lower bound for the feature, not the full suite. The full suite was not rerun in this pass (last full run: 293 passed, 2 fixme, earlier in the session).

## Edge Cases Summary

- [x] Chapter 5 reset stays 5
- [ ] Completed at 5 farm lists chapter 6 bosses
- [ ] Hand-made chapter row left alone
- [x] Rounding edges of the HP text and short format

---

## Fix Plans (ranked)

### Gap 1 - Blocker: previous backend compatibility not executed (CHAP-08 AC 5, CHAP-09 AC 7)

- **Root cause**: no test starts the previous release's schema check or read path against the migrated database. Only the column types are asserted (`HealthHitPointsMigrationIT.kt:63-68`).
- **Fix task**: integration test that runs the previous release's `Int` mapping against the V8 and V9 schema, and checks that it starts, answers progress and credits a kill.
- **Priority**: Blocker (AD-016 rollback).

### Gap 2 - Major: V9 migration asserts 2 of 15 rules (CHAP-09 AC 5)

- **Root cause**: `CoinDropMigrationIT.kt:43-52` checks rules 5 and 13 only. Mutant M11 (`V9__coin_drop_rebalance.sql:29`) survived.
- **Fix task**: table-driven test over the 15 rules, old range to new range.
- **Priority**: Major.

### Gap 3 - Major: Chapter Table not pinned row by row (CHAP-04 AC 1, 2; success criterion)

- **Root cause**: `ChapterTest.kt:135-187` samples chapters 6, 10, 12 and 15.
- **Fix task**: table-driven test over chapters 6 to 15 with every column of the Chapter Table.
- **Priority**: Major.

### Gap 4 - Major (spec): team damage texts do not exist (CHAP-07 AC 1)

- **Root cause**: `Dano: <n>/s` and `Dano da equipe: <n>/s` are part of `hero-team`, absent from `game/src`.
- **Fix task**: owner decision. Move the texts to the `hero-team` spec, or amend CHAP-07 AC 1. No code fix in this feature.
- **Priority**: Major (spec).

### Gap 5 - Minor: player-visible ACs without e2e (CHAP-08 AC 3, CHAP-07 AC 4, CHAP-01 AC 5 and AC 7)

- **Fix task**: add e2e scenarios for `HP 3B/3B` on a 3 000 000 000 boss, the chapter 10 HP text, a completed-at-5 load showing chapter 6, and "no monster" after the chapter 15 boss.
- **Priority**: Minor.

### Gap 6 - Minor: seeder edges untested (CHAP-02 AC 3 and the hand-made row)

- **Fix task**: `ChapterSeederIT` deletes chapter 6 and checks it is seeded; a hand-made row for chapter 7 is left unchanged.
- **Priority**: Minor.

### Gap 7 - Minor: farm edge untested (completed at 5)

- **Fix task**: farm test for a player completed at 5 listing only the chapter 6 bosses beaten.
- **Priority**: Minor.

### Gap 8 - Minor (spec-precision): response fields not asserted (CHAP-01 AC 1 and AC 5)

- **Root cause**: `ProgressControllerIT.kt:210-221` does not assert `definition`; `:225-236` does not assert `completed`.
- **Fix task**: add those two assertions.
- **Priority**: Minor.

### Gap 9 - Minor (spec-precision): boss defense cap is inert in the campaign (M4)

- **Root cause**: the uncapped boss defense is 80 at chapter 15 (`Chapter.kt:185-186`), so the cap of 80 never binds in chapters 1 to 15. No in-scope input can kill the mutant.
- **Fix task**: either state in the spec that the cap is a guard beyond chapter 15, or pin it with `ChapterDefinition.of(16)`.
- **Priority**: Minor.

### Gap 10 - Minor: chapters 1 to 5 "same definitions" pinned by six values only (`ChapterTest.kt:205-216`)

- **Priority**: Minor.

### Gap 11 - Minor (not blocking): `heroOfChapter` clamp in the fake backend

- **Root cause**: `game/e2e/support/fakeBackend.js:118` uses `Math.min(chapter, 5)`, which gives the wrong hero for chapters 6 to 15 (for example chapter 14's boss releases chapter 5's hero instead of chapter 15's).
- **Impact on ACs**: none. CHAP-05 AC 6 to 8 are backend-owned and asserted at `CardDropsTest.kt:94-112` and `ChapterOrderTest.kt:45-51`. No e2e scenario of this feature asserts a drop past chapter 5.
- **Fix task**: wrap by the order (`((c-1) mod 5)+1`) before any e2e asserts a drop past chapter 5.

### Gap 12 - Informational: chapter 90 instead of 99

- **Root cause**: `ChapterRepositoryIT.kt:29` (task text names 99). Isolation holds.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| CHAP-01 | In Tasks | ⚠️ Partial (AC 3, 5, 6, 7) |
| CHAP-02 | In Tasks | ⚠️ Partial (AC 3 seeding) |
| CHAP-03 | In Tasks | ⚠️ Partial (AC 6, 7 e2e) |
| CHAP-04 | In Tasks | ❌ Needs Fix (Chapter Table rows, gap 3) |
| CHAP-05 | In Tasks | ✅ Verified (AC 6 to 8; AC 7 unit coverage only) |
| CHAP-06 | In Tasks | ✅ Verified |
| CHAP-07 | In Tasks | ❌ Needs Fix (AC 1 team texts, gap 4) |
| CHAP-08 | In Tasks | ❌ Needs Fix (AC 5, gap 1) |
| CHAP-09 | In Tasks | ❌ Needs Fix (AC 5 and AC 7, gaps 1 and 2) |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 24/36 ACs matched the spec outcome with `file:line`; 9 partial and 3 missing (gaps 1 to 5; edge cases listed separately).
**Sensor**: 14/16 mutations killed (M4 equivalent inside the campaign; M11 real gap).
**Gate**: backend 920 passed; game unit 1574 passed; e2e campaign spec 6 passed.

**What works**: the chapter 6 to 15 numbers, the progression to 15, the reset cap, the short format boundaries, the 64-bit health round trip, the coin factor and the chapters 1 to 5 drop migration.

**Issues found**: gaps 1 to 4 above.

**Next steps**: route gaps 1 to 4 to fix tasks, then re-verify (the fix to re-verify loop allows 3 rounds).
