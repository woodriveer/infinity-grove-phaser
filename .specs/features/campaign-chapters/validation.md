# Campaign Chapters 6 to 15 Validation

**Date**: 2026-11-14
**Spec**: `.specs/features/campaign-chapters/spec.md` (amended in `44fa821`: CHAP-07 AC 1 narrowed to damage numbers and the battle HP text; the defense cap of 80 is inert in chapters 1 to 15, no test owed)
**Diff range**: `91e3111..a24e10e` on `main` (T1 to T12 and the round 1 fix commits `1807622` to `a24e10e`). T13 and T14 (contract migration) deferred, not counted as gaps.
**Verifier**: independent sub-agent, round 2 of 3 (author ≠ verifier)

---

## Validation: campaign-chapters - FAIL

**Verdict**: FAIL - 2 gaps (1 Major, 1 Minor), ranked below. Every suite is green; the gaps are weak or missing assertions on spec outcomes.

**Spec-anchored check**: 34 of 36 ACs with `file:line` evidence matching the spec outcome; CHAP-04 AC 1 and AC 2 match only for stages 1 and 10 (gap 1); CHAP-06 AC 3 dialog pinned at one chapter (gap 2). CHAP-08 AC 5 and CHAP-09 AC 7 are covered by a schema replay, accepted as residual (see below).
**Gate**: backend 934 passed, 0 failed, 0 skipped; game unit 1574 passed, 0 failed; e2e full suite 298 passed, 0 failed, 2 skipped (fixme); campaign spec 11 passed.
**Sensor**: 19 mutations injected, 16 killed, 3 survived (M4 equivalent inside chapters 1 to 15; N7 and N8 real gaps, gap 1).
**Report**: `.specs/features/campaign-chapters/validation.md`

---

## Round History

- Round 1 at `42754ca`: FAIL, 12 ranked gaps, sensor 14 of 16 killed.
- Round 2 (this report, `91e3111..a24e10e`): FAIL, 2 gaps. Round 1 gaps 1 to 3 and 5 to 11 are closed (evidence below); gap 4 closed by the spec amendment `44fa821`; gap 9 closed by the spec note (M4 equivalent); gap 12 (chapter 90 for 99) is informational and unchanged.

---

## Round 1 Gap Closure

| Round 1 gap | Status | Evidence |
| --- | --- | --- |
| 1 previous backend not executed (CHAP-08 AC 5, CHAP-09 AC 7) | Closed by replay (residual, see below) | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/PreviousBackendCompatibilityIT.kt:59-99` (column types of the three tables V8 and V9 touch, equal to the `91e3111` entities), `:170-206` (Flyway of the `91e3111` migrations, V8 and V9 as `FUTURE_SUCCESS`, zero migrations run) |
| 2 V9 migration asserts 2 of 15 rules (M11 survived) | Closed | `CoinDropMigrationIT.kt:73-82` (all 15 seeded rules, old to new), `:43-52`; M11 now killed (sensor) |
| 3 Chapter Table not pinned row by row | Closed for every column | `ChapterTest.kt:305-365` (table of chapters 6 to 15, every column, `assertChapterTableRow`) |
| 4 team damage texts absent | Closed by spec | CHAP-07 AC 1 narrowed in `44fa821`; `Dano:` texts belong to `hero-team` |
| 5 player-visible ACs without e2e | Closed | `game/e2e/campaignChapters.spec.js:108-113` (`HP 3B/3B`), `:115-120` (`HP 16.4M/16.4M`), `:77-85` (completed at 5 loads chapter 6), `:72-74` (completion, monster null); the sub-1000 HP text is in `game/e2e/combatHud.spec.js:42,46` |
| 6 seeder edges | Closed | `ChapterSeederIT.kt:118-128` (missing chapter 6 seeded with 10 stages and rules 16 to 18), `:132-138` (hand-made chapter 7 unchanged) |
| 7 farm edge (completed at 5) | Closed | `FarmServiceTest.kt:130-146` (no chapter 6 bosses beaten, chapter 5 boss refused); `FarmService.kt:74` (`withNextChapterOpen`, fix `a24e10e`) |
| 8 response fields not asserted | Closed | `ProgressControllerIT.kt:221-226` (definition), `:243` (completed false on report) |
| 9 boss defense cap inert (M4) | Closed by spec note | M4 is equivalent inside 1 to 15 (sensor) |
| 10 chapters 1 to 5 pinned by six values | Closed | `ChapterTest.kt:368-370` (every column of chapters 1 to 5) |
| 11 `heroOfChapter` clamp in fake backend | Closed | `game/e2e/support/fakeBackend.js:119` (`(chapter - 1) % 5`) |

---

## Spec-Anchored Acceptance Criteria

Story IDs follow the spec traceability table. "Spec outcome" is the value or state the spec defines.

### Campaign goes on (CHAP-01, CHAP-02, CHAP-03)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-01 AC1 CLEARED c 1 to 14 | store c+1, stage 1, PHASE, phase 1, not completed | `ProgressTest.kt:167` `assertFalse(next.completed)`; `:168` `assertEquals(ProgressPosition(6, 1, Encounter.PHASE, 1), next.position)`; HTTP `ProgressControllerIT.kt:243` `completed` false, `:231-242` chapter 6, stage 1, PHASE, phase 1 | ✅ |
| CHAP-01 AC2 CLEARED chapter 15 | stored completed | `ProgressTest.kt:177` `assertTrue(done.completed)`; `:178` `assertEquals(last.position, done.position)`; e2e `campaignChapters.spec.js:73` `toBe(true)` | ✅ |
| CHAP-01 AC3 (CHAP-02) seed missing 6 to 15 | chapter, 10 stages, 3 rules with Chapter Table values | `ChapterSeederIT.kt:118-128` (chapter 6 with 10 stages; rules 16, 17, 18 `DropRule(16, 64, 192, 1500)` etc.), `:63-69` (chapters 1 to 15 with values) | ✅ |
| CHAP-01 AC4 (CHAP-02) start leaves 1 to 5 | no overwrite | `ChapterSeederIT.kt:73-79` (`assertEquals(1234L, ...)` edited chapter 1 kept), `:107-114` (rule 2 kept) | ✅ |
| CHAP-01 AC5 completed at 5 then GET | chapter 6, stage 1, PHASE, phase 1, not completed, chapter 6 definition | `ProgressControllerIT.kt:214-226` (`chapter` 6, `stage` 1, `PHASE`, `completed` false, `definition.bossHealth` 1024000, `bossDropRuleId` 18, `boss.physicalDefense` 53, `stages[0].monsterHealth` 20480) | ✅ |
| CHAP-03 AC6 game fights 6 to 15, HUD `Capítulo <c>` | HUD text; fight with the definition | e2e `campaignChapters.spec.js:59` `toHaveText('Capítulo 6')`, `:69` `'Capítulo 15'`; fight values of a received definition `campaign.test.js:168-171` (health from payload) | ✅ |
| CHAP-03 AC7 chapter 15 dies in time | completion message, no monster | e2e `campaignChapters.spec.js:72` `'Chapter complete!'`, `:74` monster null; unit `ClickerGame.test.js:1346-1347` (`'Chapter complete!'`, monster null) | ✅ |

### Chapter numbers (CHAP-04, CHAP-05)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-04 AC1 health formula c 6 to 15 | boss `2000 x 256 x 2^(c-5)`; phase `(40+4(n-1)) x factor` for stage n; miniboss 5x phase | Table rows `ChapterTest.kt:319-331` and `:363-365` pin boss health and stage 1 and stage 10 phase and miniboss values for every chapter 6 to 15. Stages 2 to 9 not pinned: `ChapterTest.kt:145-148`, `:156-157`, `:179-184` (stages 1 and 10 only). Survivor N7 | ❌ gap 1 |
| CHAP-04 AC2 defenses c 6 to 15 | boss and miniboss defenses and crit caps `min(...)` | `ChapterTest.kt:354-359` (boss defense and crit, every row), `:357-359` (miniboss stage 10). Miniboss stage n other than 10 not pinned. Survivor N8 | ❌ gap 1 |
| CHAP-04 AC3 phase defenses 0, crit 0, time 30 000 / 60 000 | ubiquitous | `ChapterTest.kt:189-202` (loop chapters 6 to 15, `:195-200`) | ✅ |
| CHAP-04 AC4 chapter 10 values | boss 16 384 000, stage 10 miniboss 3 112 960, boss def 65, mini def 55 | `ChapterTest.kt:156-163` (each value asserted) | ✅ |
| CHAP-04 AC5 chapter 15 values | boss 524 288 000, def 80, crit 70 | `ChapterTest.kt:179-186` | ✅ |
| CHAP-05 AC6 element of chapter c 6 to 15 | FIRE: 6 FIRE, 7 NATURE, 8 WATER, 9 DARKNESS, 10 LIGHT, 11 FIRE | `ChapterOrderTest.kt:44-51` (chapters 6 to 11 and 15) | ✅ |
| CHAP-05 AC7 chapter 6 to 14 boss drops c+1 element | first win certain; later wins at rate | `CardDropsTest.kt:95-96` (chapter 6 first win `lyra`), `:105-106` (chapter 14 `seraphine`); rate `CardDropsTest.kt:73-75` | ✅ |
| CHAP-05 AC8 chapter 15 boss drops chapter 15 element | `seraphine` | `CardDropsTest.kt:88-90` | ✅ |

### Health without a 32-bit limit (CHAP-08)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-08 AC1 64-bit storage | Long in entities, domain, JSON | `ChapterEntities.kt:59` `bossHitPoints: Long`; `:110`, `:112` Long; `HealthHitPointsMigrationIT.kt:35-37` (`bigint`); `ChapterRepositoryIT.kt:93-96` (3 000 000 000 round trip) | ✅ |
| CHAP-08 AC2 GET answers 3 000 000 000 | JSON integer 3000000000 | `ProgressControllerIT.kt:98-104` `assertEquals(3_000_000_000L, bossHealth)` via `getLong` | ✅ |
| CHAP-08 AC3 game spawns exact health, `HP 3B/3B` | exact health, text | `campaign.test.js:168-171` (`toBe(3000000000)`); `monster.test.js:181-182` (`toBe('HP 3B/3B')`); e2e `campaignChapters.spec.js:108-113` (health and text) | ✅ |
| CHAP-08 AC4 expand copies every value | unchanged copy | `HealthHitPointsMigrationIT.kt:41-59` (copies; `:59` chapter 5 = 512000) | ✅ |
| CHAP-08 AC5 previous backend starts, answers, accepts (rollback) | previous slot works on migrated DB | Replay: `PreviousBackendCompatibilityIT.kt:59-99` (schema check of the three tables), `:101-129` (legacy integer reads), `:148-168` (legacy writes), `:170-206` (Flyway). Previous image not booted. Accepted as residual (below) | ⚠️ replay, residual |
| CHAP-08 AC6 health below 1 refused | refused at save | `ChapterTest.kt:46-47` (chapter boss health 0 refused), `:36-37`, `:31-32`; DB `HealthHitPointsMigrationIT.kt:72-79` (`assertFailsWith` for 0) | ✅ |

### Coin drops (CHAP-09)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-09 AC1 rule formula | ranges and interval 1 500 for every rule | `ChapterTest.kt:218-224` (coin factor list 1 to 15), `:258-264` (45 distinct ids) | ✅ |
| CHAP-09 AC2 chapter 1 rules | 2-6, 8-20, 30-70 | `ChapterTest.kt:226-232`; `ChapterSeederIT.kt:83-103` (stored rules) | ✅ |
| CHAP-09 AC3 chapter 8 rules | 256-768, 1024-2560, 3840-8960 | `ChapterTest.kt:242-248` | ✅ |
| CHAP-09 AC4 chapter 15 rules | 704-2112, 2816-7040, 10560-24640 | `ChapterTest.kt:250-256`; `ChapterSeederIT.kt:69` (rule 45 `DropRule(45, 10_560, 24_640, 1500)`) | ✅ |
| CHAP-09 AC5 migration moves old ranges of 1 to 5 | all 15 rules, examples 16-40 and 32-96 | `CoinDropMigrationIT.kt:73-82` (15 rules), `:43-52` (rules 5 and 13). Sensor M11 killed | ✅ |
| CHAP-09 AC6 other ranges unchanged | rule 6 at 77-99 stays | `CoinDropMigrationIT.kt:56-62` (one tuned rule; the `where min and max` guard is the only other case) | ✅ |
| CHAP-09 AC7 previous backend keeps crediting kills | same tables, old backend credits | Replay: `PreviousBackendCompatibilityIT.kt:131-146` (drop rules of 1, 5, 13, 15 read in the old shape), `:148-168` (old-shape write of `drop_rules`, rolled back). Previous code not booted. Accepted as residual | ⚠️ replay, residual |

### Reset reward (CHAP-06)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-06 AC1 reset pays c for c 2 to 15 | 2, 5, 10, 15 | `AccountResetTest.kt:22-25` (`assertNull` at 1; 2, 3, 5), `:35-36` (10, 15); HTTP `AccountResetControllerIT.kt:181` (chapter 10 pays 10, crystals 10); `accountReset.test.js:16` | ✅ |
| CHAP-06 AC2 completed campaign pays 15 | 15 | `AccountResetTest.kt:30` `assertEquals(15, ...)`; `AccountResetServiceTest.kt:98-101`; HTTP `AccountResetControllerIT.kt:174` (`reward` 15); `accountReset.test.js:20` | ✅ |
| CHAP-06 AC3 label and dialog | `Resetar conta (+<c> cristais)`, `Você ganha <c> cristais.`, 15 when completed | label: `ClickerGame.test.js:4580` (4), `:4587` (15), `:4593` (12); e2e `campaignChapters.spec.js:91` (12), `:98` (15); dialog: `ClickerGame.test.js:4611` only (chapter 4). Dialog above chapter 4 and completed not pinned, see gap 2 | ⚠️ gap 2 |

### Short format for big numbers (CHAP-07)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-07 AC1 damage and HP text abbreviated | `5K`, `HP 2K/2K`, `HP 3B/3B`, `HP 16.4M/16.4M` | `damage.test.js:105-110`; `monster.test.js:173-182`; e2e `campaignChapters.spec.js:101-104`, `:115-120`, `:145-156` | ✅ |
| CHAP-07 AC2 below 1 000 unchanged | `999` stays | `numberFormat.test.js:5`; `monster.test.js:142-170`; e2e `combatHud.spec.js:42` (`HP 100/100`), `:46` (`HP 98.9/100`) | ✅ |
| CHAP-07 AC3 ten listed values | 999, 1K, 1.5K, 50K, 999.9K, 1M, 1.1M, 16.4M, 2.5B, 1T | `numberFormat.test.js:5-20` (all ten, each as its own `it`) | ✅ |
| CHAP-07 AC4 chapter 1 boss `HP 2K/2K`; chapter 10 `HP 16.4M/16.4M` | the two HP texts | `monster.test.js:173-178`; e2e `campaignChapters.spec.js:101-104`, `:115-120` | ✅ |
| CHAP-07 AC5 click of 5 000 reads `5K` | `5K` | e2e `campaignChapters.spec.js:145-156` (`sceneTexts` contains `5K`, `HP 5K/10K`); unit `damage.test.js:105-106` | ✅ |

---

## Edge Cases

| Edge case | `file:line` | Result |
| --- | --- | --- |
| Chapter 5 reset stays 5 | `AccountResetTest.kt:25` `assertEquals(5, ...)` | ✅ |
| Completed at 5, farm lists chapter 6 bosses beaten (none yet) | `FarmServiceTest.kt:130-146` (`emptyList()`, chapter 5 boss refused) | ✅ |
| Hand-made chapter 6 to 15 row left unchanged | `ChapterSeederIT.kt:132-138` (chapter 7) | ✅ |
| 1 049 999 reads `1M` | `numberFormat.test.js:13` | ✅ |
| 2 000 boss, 1 999.95 left reads `HP 2K/2K` | `monster.test.js:204-214` | ✅ |
| 2 000 boss, 999.95 left reads `HP 1K/2K` | `monster.test.js:193-198` | ✅ |

## Success Criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| Every Chapter Table number has a unit test | `ChapterTest.kt:305-365` (every column, chapters 6 to 15); stages other than 1 and 10 not pinned | ⚠️ gap 1 |
| Completed at 5 resumes at 6 with no manual change | `ProgressControllerIT.kt:210-227`; e2e `campaignChapters.spec.js:77-85` | ✅ |
| Chapters 1 to 5 answer the same definitions | `ChapterTest.kt:368-370` (every column) | ✅ |
| 3 000 000 000 boss round-trips DB to HP text | `ChapterRepositoryIT.kt:93-96` (DB), `ProgressControllerIT.kt:98-104` (JSON), `monster.test.js:181-182` (text), e2e `:108-113` (spawn); no single real-stack scenario | ✅ residual (two legs, see below) |
| Seeded rules of 1, 5, 8, 15 match Coin Drops | `ChapterTest.kt:226-256` | ✅ |

---

## Discrimination Sensor

Isolated in a temporary `git worktree` at `a24e10e`, outside the repository working directory (never `git stash`). Each mutant changed one line or appended one line, ran the covering tests, and was reverted with `git checkout` in the scratch copy. Gradle filters: `br.com.woodriver.infinity_grove_ws.domain.*` for domain mutants and the named IT classes otherwise. Killed means at least one assertion failed. The first pass applied no mutant (path error in the script); it was rerun in full.

| Mutation | File:line | Description | Result |
| --- | --- | --- | --- |
| M1 | `backend/src/main/kotlin/.../domain/Chapter.kt:133` | Health factor of chapter 6+ one chapter behind | ✅ Killed (6 of 325) |
| M2 | `.../domain/Chapter.kt:88` | Defense cap 80 to 79 | ✅ Killed (2 of 325) |
| M3 | `.../domain/Chapter.kt:89` | Crit cap 70 to 69 | ✅ Killed (3 of 325) |
| M4 | `.../domain/Chapter.kt:185` | Boss defense cap removed | ❌ Survived. Equivalent: uncapped boss defense is 80 at chapter 15, the cap value. Accepted (spec note) |
| M5 | `.../domain/Chapter.kt:95` | Coin factor step 32 to 33 | ✅ Killed (2 of 325) |
| M7 | `.../domain/ChapterOrder.kt:9` | `MAX_CHAPTER` 15 to 14 | ✅ Killed (7 of 325) |
| M8 | `.../domain/Progress.kt:70` | Transition stops at chapter 5 | ✅ Killed (3 of 325) |
| M9 | `.../domain/AccountReset.kt:10` | Reset reward capped at 5 | ✅ Killed (2 of 325) |
| M10 | `.../adapter/repository/ChapterEntities.kt:74` | Boss health truncated to 32 bits on load | ✅ Killed (2 of 42, ChapterRepositoryIT and ProgressControllerIT) |
| M11 | `backend/src/main/resources/db/migration/V9__coin_drop_rebalance.sql:29` | Rule 9 maximum 280 to 281 | ✅ Killed (1 of 5, CoinDropMigrationIT). Round 1 survivor |
| N1 | `.../service/FarmService.kt:74` | `loadProgress` without `withNextChapterOpen()` | ✅ Killed (2 of 44, FarmServiceTest and FarmControllerIT) |
| N2 | `.../domain/Chapter.kt:141` | Wrong row: chapter 9 defense bonus +1 | ✅ Killed (1 of 325) |
| N3 | `.../adapter/config/ChapterSeeder.kt` | Seeder skips chapter 6 | ✅ Killed (2 of 8, ChapterSeederIT) |
| N4 | `.../adapter/config/ChapterSeeder.kt` | Seeder overwrites an existing chapter (existence check off) | ✅ Killed (2 of 8, ChapterSeederIT) |
| N5 | `db/migration/V8__health_hit_points_expand.sql` (appended line) | Plain `ALTER` of `boss_health` to `bigint` (legacy column unusable for the previous backend) | ✅ Killed (2 of 9, HealthHitPointsMigrationIT and PreviousBackendCompatibilityIT) |
| N6 | `.../adapter/repository/ChapterEntities.kt:50` | New backend never writes the legacy 32-bit column | ✅ Killed (29 of 46) |
| N7 | `.../domain/Chapter.kt:161` | Phase monster health of stage 5 doubled in chapters 6 to 15 | ❌ Survived. Gap 1 |
| N8 | `.../domain/Chapter.kt:164` | Miniboss defense of stage 5 plus 1 in chapters 6 to 15 | ❌ Survived. Gap 1 |
| G1 | `game/src/domain/combat/numberFormat.js:6` | Threshold `< 1000` to `<= 1000` | ✅ Killed (2 of 42, vitest exit 1, numberFormat and monster tests) |

**Sensor depth**: expanded (19 manual mutations, no mutation tool configured; the change touches data integrity, migrations and the chapter table).
**Result**: 16/19 killed. Survivors: M4 (equivalent), N7 and N8 (real gaps, gap 1).
**Isolation**: the worktree was removed and pruned; the real tree's `git status --porcelain` equals the baseline recorded before the sensor (937 lines, no change).

---

## Residual Risks (not gaps)

- **CHAP-08 AC 5 and CHAP-09 AC 7, previous image not booted.** The replay covers every way the `91e3111` code meets the migrated database: the column types its entities map (`Int` for the legacy health and drop rule columns, `bigint` for time limits and intervals), the Flyway history with V8 and V9 as future migrations, and the values it reads and writes. The previous code is unchanged in the range that matters, so the only interaction with the database is what the replay asserts. The spec's Independent Test for CHAP-08 AC 5 is "a migration test starts the previous backend's schema check against the migrated database", which the replay implements. A rollback drill on the deployed previous slot would still be the strongest evidence and remains recommended.
- **3 000 000 000 round trip.** Each leg is tested (DB, JSON, text, spawn); no single scenario crosses the backend JSON into the game. Accepted.
- **Chapter 90 instead of 99.** `ChapterRepositoryIT.kt:29`. Isolation holds; informational.
- **Test counts.** Backend: 934 test cases executed by JUnit (`build/test-results`), 937 `@Test` annotations in `backend/src/test`. Game unit: 72 files, 1574 tests. Range: 0 backend `@Test` lines removed, 49 added; game: 4 `it(`/`test(` titles removed and renamed in place (HP text format and the completed reset pays 15), 44 added.

---

## Gate Check

- **Backend**: `cd backend && ./gradlew cleanTest test jacocoTestReport`. BUILD SUCCESSFUL. 934 test cases, 0 failed, 0 errors, 0 skipped. JaCoCo: lines 98.99% (2756/2784), branches 93.03% (827/889).
- **Game unit**: `cd game && npm run test:coverage`. 72 files, 1574 passed, 0 failed. Coverage: lines 97.95% (2586/2640), branches 95.18% (1205/1266). Changed files at 100% lines and branches: `numberFormat.js`, `damage.js`, `monster.js`, `accountReset.js`, `campaign.js`.
- **E2E campaign spec**: `cd game && npx playwright test e2e/campaignChapters.spec.js`. 11 passed, 0 failed.
- **E2E full suite with coverage**: `cd game && npm run test:e2e:coverage`. 298 passed, 0 failed, 2 skipped (fixme). Line coverage 92.27% (2437/2641), branches 76.84% (780/1015). Lower bound: a page reloaded inside a test loses its counted lines.

## Fix Plans (ranked)

### Gap 1 - Major: per-stage formula of chapters 6 to 15 not pinned (CHAP-04 AC 1 and AC 2)

- **Root cause**: `ChapterTest.kt:145-148`, `:156-157`, `:179-184` and the table loop `:305-365` pin stage 1 and stage 10 only. Sensor N7 (`Chapter.kt:161`) and N8 (`Chapter.kt:164`) survived; both change stage 5 only.
- **Fix task**: in the table loop, assert the phase monster health, miniboss health, miniboss defenses and miniboss crit resistance of every stage 1 to 10 of chapters 6 to 15 against the spec formulas, and the chapter 1 to 5 stages the same way.
- **Priority**: Major.

### Gap 2 - Minor: "Você ganha <c>" dialog pinned at chapter 4 only (CHAP-06 AC 3)

- **Root cause**: `ClickerGame.test.js:4611` is the only dialog assertion (chapter 4). The label is pinned at 4, 12 and 15 (`:4580`, `:4593`, `:4587`); the dialog for chapter 12 and for a completed campaign (15) is not. Not sensor-tested.
- **Fix task**: assert the dialog text at chapter 12 and for a completed campaign.
- **Priority**: Minor.

---

## Requirement Traceability Update

| Requirement | Previous Status (round 1) | New Status |
| --- | --- | --- |
| CHAP-01 | ⚠️ Partial | ✅ Verified (AC 1 to 7) |
| CHAP-02 | ⚠️ Partial | ✅ Verified (AC 3, 4) |
| CHAP-03 | ⚠️ Partial | ✅ Verified (AC 6, 7) |
| CHAP-04 | ❌ Needs Fix | ❌ Needs Fix (AC 1 and AC 2 per stage, gap 1) |
| CHAP-05 | ✅ Verified | ✅ Verified (AC 6 to 8) |
| CHAP-06 | ✅ Verified | ⚠️ Needs Fix (AC 3 dialog, gap 2) |
| CHAP-07 | ❌ Needs Fix | ✅ Verified (AC 1 narrowed by `44fa821`, AC 2 to 5) |
| CHAP-08 | ❌ Needs Fix | ✅ Verified (AC 5 by replay, residual) |
| CHAP-09 | ❌ Needs Fix | ✅ Verified (AC 5 to 7; AC 7 by replay, residual) |

---

## Summary

**Overall**: ❌ Not Ready (FAIL, round 2 of 3)

**Spec-anchored check**: 34/36 ACs matched the spec outcome with `file:line`; gap 1 (CHAP-04 AC 1, 2) and gap 2 (CHAP-06 AC 3).
**Sensor**: 16/19 mutations killed (M4 equivalent; N7 and N8 real gaps).
**Gate**: backend 934 passed; game unit 1574 passed; e2e full 298 passed, 2 skipped (fixme).

**What works**: the Chapter Table values for every chapter and column, the progression to 15 and the completion, the completed-at-5 load and farm, the 64-bit round trip, the seeder edges, the V8 and V9 migrations with all 15 rules, the reset cap, the short format boundaries, the e2e scenarios for the player-visible criteria.

**Issues found**: gap 1 (per-stage pins for chapters 6 to 15) and gap 2 (dialog pins). Both are assertions, not production code.

**Next steps**: route gaps 1 and 2 to a fix task, then re-verify (round 3 of 3).
