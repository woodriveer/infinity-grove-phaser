# Campaign Chapters 6 to 15 Validation

**Date**: 2026-11-14
**Spec**: `.specs/features/campaign-chapters/spec.md` (amended in `44fa821`: CHAP-07 AC 1 narrowed to damage numbers and the battle HP text; the defense cap of 80 is inert in chapters 1 to 15, no test owed)
**Diff range**: `91e3111..37949f2` on `main` (T1 to T12, the round 1 fixes `1807622` to `a24e10e`, the round 2 test commits `0aebd84` and `37949f2`). Since round 2 (`b4e6985..37949f2`): 2 test files, 47 insertions, 0 deletions, no production or spec change. T13 and T14 (contract migration) are deferred until the deploy is live, not counted as gaps.
**Verifier**: independent sub-agent, round 3 of 3 (author ≠ verifier)

Path shorthands used below: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `BM` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `GS` = `game/src/`, `GE` = `game/e2e/`.

---

## Validation: campaign-chapters - PASS

**Verdict (current, round 5)**: PASS. Round 4 gap 1 (boss element of chapters 2 to 5, mutant F8) is closed by `BT domain/ChapterTest.kt:413-427`, and the field sweep of chapters 1 to 5 found no other unpinned field. See `## Round 5` at the end of this file. The text below is the round 3 report, unchanged; `## Round 4` is unchanged too.

**Round 3 verdict**: FAIL - 1 gap (Minor), ranked below. The round 2 gaps are closed. The gap left is the chapters 1 to 5 success criterion: the new sensor mutant F4 changes stage 5 of chapters 2 to 5 and survives the whole backend suite. Round 3 is the last round allowed, so this FAIL escalates to the user.

**Spec-anchored check**: 36 of 36 ACs have `file:line` evidence matching the spec outcome (CHAP-08 AC 5 and CHAP-09 AC 7 by schema and Flyway replay, accepted residual). 4 of 5 Success Criteria match; "Chapters 1 to 5 answer the same definitions" does not (gap 1). One spec-precision note (stage element rotation, non-blocking).
**Gate**: backend 935 passed, 0 failed, 0 skipped; game unit 1576 passed, 0 failed; campaign spec 11 passed; full e2e 291 passed, 7 failed, 2 skipped (fixme). The 7 failures are explained in Gate Check: 5 pass in isolation, 2 are `dragEquip` edge-scroll scenarios outside this feature.
**Sensor**: 6 mutations run this round: 5 killed, 1 survived (F4, gap 1). Carried from round 2: 16 killed, M4 survived as equivalent. Across all 23 mutations: 21 killed, 2 survived (F4 gap, M4 equivalent).
**Report**: `.specs/features/campaign-chapters/validation.md`

---

## Round History

- Round 1 at `42754ca`: FAIL, 12 ranked gaps, sensor 14 of 16 killed.
- Round 2 at `b4e6985`: FAIL, 2 gaps (CHAP-04 AC 1 and 2 per stage for chapters 6 to 15; CHAP-06 AC 3 dialog above chapter 4), sensor 16 of 19 killed.
- Round 3 at `37949f2`: FAIL, 1 gap (chapters 1 to 5 per stage, F4 survives). Both round 2 gaps are closed: `BT domain/ChapterTest.kt:368-394` (every stage 1 to 10 of chapters 6 to 15; mutants N7, N8, F1, F2 killed) and `GS adapters/phaser/ClickerGame.test.js:4616-4632` (dialog at chapter 12 and completed; mutant F3 killed).
- Round 4 at `46edd83` (see `## Round 4` at the end): FAIL, 1 gap (boss element of chapters 2 to 5; mutant F8 survives). Round 3 gap 1 is closed: F4 killed by `BT domain/ChapterTest.kt:394`, and F5, F6, F7 and F9 killed too.
- Round 5 at `b59c135` (see `## Round 5` at the end): PASS. Round 4 gap 1 is closed: F8 killed by `BT domain/ChapterTest.kt:425`. The field sweep (5 mutants, 5 killed) found no other unpinned field of chapters 1 to 5, and the release dump of chapters 1 to 5 is identical to `91e3111`.

---

## Round 2 Gap Closure

| Round 2 gap | Status | Evidence (re-opened this round) |
| --- | --- | --- |
| 1 CHAP-04 AC 1 and 2, per stage, chapters 6 to 15 | Closed | `BT domain/ChapterTest.kt:368-394`. Expected values are computed from the spec formulas, not from the production helpers: factor `256L * (1L shl (c - 5))` (`:372`), bonus `20 + 3 * (c - 5)` (`:373`), phase health `(40L + 4L * (n - 1)) * factor` (`:381`), miniboss health `5L * phaseHealth` (`:383`), miniboss defenses `minOf(10 + n + bonus, 80)` (`:385-386`), miniboss crit `minOf(10 + 2 * n + bonus, 70)` (`:387`), all stages 1 to 10 of chapters 6 to 15. The element list at `:369` is a literal, not a call to production. Phase monster defense and crit 0 and the 30 000 / 60 000 ms limits: `:189-202`. Boss health, boss defenses and boss crit for every chapter 6 to 15: table rows `:319-331`, asserted by `:343-360` and `:363-365`. |
| 2 CHAP-06 AC 3 dialog at chapters 12 and completed | Closed | `GS adapters/phaser/ClickerGame.test.js:4616-4623` (chapter 12: `toBe('Resetar a conta? ... Você ganha 12 cristais.')`), `:4625-4632` (completed: `... Você ganha 15 cristais.`). Both assert the full dialog sentence, which the template in `GS adapters/phaser/views/resetView.js:7-8` produces from `reward`. |

Caveat on gap 1 (author's note, verified): the element of each stage is `Element.entries[(n - 1 + c - 1) % 5]` (`BM domain/Chapter.kt:163`), and the test at `:388-391` reproduces that rotation. See spec-precision note 1.

---

## Spec-Anchored Acceptance Criteria

Story IDs follow the spec traceability table. "Spec outcome" is the value or state the spec defines. Evidence was re-opened this round; round 2 citations with unchanged assertions are reused (file lines before the two inserted test blocks did not move, except where a shift is noted).

### Campaign goes on (CHAP-01, CHAP-02, CHAP-03)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-01 AC1 CLEARED c 1 to 14 | store c+1, stage 1, PHASE, phase 1, not completed | `BT domain/ProgressTest.kt:167` `assertFalse(next.completed)`; `:168` `assertEquals(ProgressPosition(6, 1, Encounter.PHASE, 1), next.position)`; HTTP `BT adapter/web/ProgressControllerIT.kt:238-242` (chapter 6, stage 1, PHASE, phase 1, `completed` false; corrected from round 2 `:243`, which holds the boss health line) | PASS |
| CHAP-01 AC2 CLEARED chapter 15 | stored completed | `BT domain/ProgressTest.kt:177` `assertTrue(done.completed)`; `:178` `assertEquals(last.position, done.position)`; e2e `GE campaignChapters.spec.js:72-74` (`Chapter complete!`, `toBe(true)`) | PASS |
| CHAP-01 AC3 (CHAP-02) seed missing 6 to 15 | chapter with 10 stages and 3 rules, Chapter Table values | `BT adapter/config/ChapterSeederIT.kt:118-128` (chapter 6 with 10 stages; rules 16, 17, 18 `DropRule(16, 64, 192, 1500)` etc.), `:63-69` (chapters 1 to 15 with values) | PASS |
| CHAP-01 AC4 (CHAP-02) start leaves 1 to 5 | stored values unchanged | `ChapterSeederIT.kt:73-79` (`assertEquals(1234L, ...)` edited chapter 1 kept), `:107-114` (rule 2 kept) | PASS |
| CHAP-01 AC5 completed at 5, GET | chapter 6, stage 1, PHASE, phase 1, not completed, chapter 6 definition | `ProgressControllerIT.kt:214-226` (`chapter` 6, `stage` 1, `PHASE`, `completed` false, `definition.bossHealth` 1024000, `boss.physicalDefense` 53, `stages[0].monsterHealth` 20480); e2e `campaignChapters.spec.js:77-85` | PASS |
| CHAP-03 AC6 game fights 6 to 15, HUD `Capítulo <c>` | HUD text; fight with the received definition | e2e `campaignChapters.spec.js:59` `toHaveText('Capítulo 6')`, `:69` `'Capítulo 15'`; `GS domain/campaign/campaign.test.js:162-166` (health 300, limit 60000, label) | PASS |
| CHAP-03 AC7 chapter 15 dies in time | completion message, no monster | `GS adapters/phaser/ClickerGame.test.js:1346-1347` (`'Chapter complete!'`, `monster` null); e2e `campaignChapters.spec.js:72`, `:74` | PASS |

### Chapter numbers (CHAP-04, CHAP-05)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-04 AC1 health c 6 to 15 | boss `2000 x 256 x 2^(c-5)`; phase `(40+4(n-1)) x factor`; miniboss 5x phase | `ChapterTest.kt:368-394` (`:382` `assertEquals(phaseHealth, stage.monsterHealth)`, `:383` `assertEquals(5L * phaseHealth, stage.minibossHealth)`, every stage 1 to 10); boss per chapter `:319-331` and `:350` | PASS |
| CHAP-04 AC2 defenses c 6 to 15 | boss and miniboss defenses `min(...)`, crit caps 80 and 70 | `ChapterTest.kt:354-359` (boss defenses and crit, every row); `:385-387` (miniboss physical, magical and crit, every stage 1 to 10 of chapters 6 to 15) | PASS |
| CHAP-04 AC3 phase defenses 0, crit 0, limits 30 000 / 60 000 | ubiquitous | `ChapterTest.kt:189-202` (`:195-197` defense and crit 0, `:198` 30 000, `:200` 60 000) | PASS |
| CHAP-04 AC4 chapter 10 values | boss 16 384 000, stage 10 miniboss 3 112 960, boss def 65, mini def 55 | `ChapterTest.kt:156-163` | PASS |
| CHAP-04 AC5 chapter 15 values | boss 524 288 000, def 80, crit 70 | `ChapterTest.kt:179-186` | PASS |
| CHAP-05 AC6 element of chapter c 6 to 15 | FIRE, NATURE, WATER, DARKNESS, LIGHT, FIRE (player order) | `BT domain/ChapterOrderTest.kt:44-51` | PASS |
| CHAP-05 AC7 chapter 6 to 14 boss drops c+1 element | first win certain; later wins at rate | `BT domain/CardDropsTest.kt:95-96` (chapter 6 first win `lyra`), `:105-106` (chapter 14 `seraphine`), `:73-75` (rate below 0.30) | PASS |
| CHAP-05 AC8 chapter 15 boss drops chapter 15 element | `seraphine` | `CardDropsTest.kt:88-90` | PASS |

### Health without a 32-bit limit (CHAP-08)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-08 AC1 64-bit storage | Long in entities, domain and JSON | `BM adapter/repository/ChapterEntities.kt:59` (`bossHitPoints: Long`), `:110`, `:112` (Long); `BT adapter/repository/HealthHitPointsMigrationIT.kt:35-37` (`bigint`); `ChapterRepositoryIT.kt:93-96` (3 000 000 000 round trip) | PASS |
| CHAP-08 AC2 GET answers 3 000 000 000 | JSON integer 3000000000 | `ProgressControllerIT.kt:97-104` (`assertEquals(3_000_000_000L, bossHealth)` via `getLong`) | PASS |
| CHAP-08 AC3 game spawns exact health, `HP 3B/3B` | exact health and text | `GS domain/campaign/campaign.test.js:168-171` (`toBe(3000000000)`); `GS domain/combat/monster.test.js:181-182` (`toBe('HP 3B/3B')`); e2e `campaignChapters.spec.js:108-113` | PASS |
| CHAP-08 AC4 expand copies every value | unchanged copy | `HealthHitPointsMigrationIT.kt:40-59` (distinct-count 0 for chapters and stages; `:59` chapter 5 = 512000) | PASS |
| CHAP-08 AC5 previous backend starts, answers, accepts (rollback) | previous slot works on migrated DB | Replay: `PreviousBackendCompatibilityIT.kt:59-99` (column types of the three tables), `:101-129` (legacy integer reads), `:148-168` (legacy writes, rolled back), `:170-206` (Flyway of the `91e3111` migrations, V8 and V9 `FUTURE_SUCCESS`). Previous image not booted (residual) | PASS by replay (residual) |
| CHAP-08 AC6 health below 1 refused | refused at save | `ChapterTest.kt:46-47` (chapter boss 0 refused), `:36-37`, `:31-32`; DB `HealthHitPointsMigrationIT.kt:72-79` (`assertFailsWith` for 0) | PASS |

### Coin drops (CHAP-09)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-09 AC1 rule formula | ranges and interval 1500 for every rule | `ChapterTest.kt:218-224` (coin factor list 1 to 15), `:258-264` (45 distinct ids) | PASS |
| CHAP-09 AC2 chapter 1 rules | 2-6, 8-20, 30-70 | `ChapterTest.kt:226-232`; `ChapterSeederIT.kt:83-103` (stored rules) | PASS |
| CHAP-09 AC3 chapter 8 rules | 256-768, 1024-2560, 3840-8960 | `ChapterTest.kt:242-248` | PASS |
| CHAP-09 AC4 chapter 15 rules | 704-2112, 2816-7040, 10560-24640 | `ChapterTest.kt:250-256`; `ChapterSeederIT.kt:69` (rule 45 `DropRule(45, 10_560, 24_640, 1500)`) | PASS |
| CHAP-09 AC5 migration moves old ranges of 1 to 5 | all 15 seeded rules, examples 16-40 and 32-96 | `BT adapter/repository/CoinDropMigrationIT.kt:42-53` (rules 5 and 13), `:73-82` (all 15 seeded rules, old to new) | PASS |
| CHAP-09 AC6 other ranges unchanged | rule 6 at 77-99 stays | `CoinDropMigrationIT.kt:55-63` | PASS |
| CHAP-09 AC7 previous backend keeps crediting kills | same tables, old backend credits | Replay: `PreviousBackendCompatibilityIT.kt:131-146` (drop rules 1, 5, 13, 15 in the old shape), `:148-168` (old-shape write, rolled back). Previous code not booted (residual) | PASS by replay (residual) |

### Reset reward (CHAP-06)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-06 AC1 reset pays c for c 2 to 15 | 2, 5, 10, 15 | `BT domain/AccountResetTest.kt:21-25` (`assertNull` at 1; 2, 3, 5), `:34-36` (10, 15); HTTP `BT adapter/web/AccountResetControllerIT.kt:177-182` (chapter 10 pays 10, crystals 10); `GS domain/campaign/accountReset.test.js:11-17` | PASS |
| CHAP-06 AC2 completed campaign pays 15 | 15 | `AccountResetTest.kt:29-31`; `BT service/AccountResetServiceTest.kt:97-101`; HTTP `AccountResetControllerIT.kt:170-175` (`reward` 15); `accountReset.test.js:19-21` | PASS |
| CHAP-06 AC3 label and dialog | `Resetar conta (+<c> cristais)`; `Você ganha <c> cristais.`; 15 when completed | Label: `GS adapters/phaser/ClickerGame.test.js:4577-4594` (`:4580` 4, `:4587` 15, `:4593` 12); e2e `GE campaignChapters.spec.js:87-99` (12 and 15). Dialog: `ClickerGame.test.js:4603-4614` (chapter 4, `:4611`), `:4616-4623` (chapter 12, full sentence `Você ganha 12 cristais.`), `:4625-4632` (completed, `Você ganha 15 cristais.`) | PASS (round 2 gap 2 closed) |

### Short format for big numbers (CHAP-07)

| Criterion | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| CHAP-07 AC1 damage and HP text abbreviated | `5K`, `HP 2K/2K`, `HP 3B/3B`, `HP 16.4M/16.4M` | `GS domain/combat/damage.test.js:105-110` (`5K`; `999.96` reads `1K`); `GS domain/combat/monster.test.js:173-182`; e2e `campaignChapters.spec.js:101-104`, `:115-120` | PASS |
| CHAP-07 AC2 below 1 000 unchanged | `999` stays; `HP 100/100` | `GS domain/combat/numberFormat.test.js:5`; `monster.test.js:142-170`; e2e `GE combatHud.spec.js:42` (`HP 100/100`), `:46` (`HP 98.9/100`) | PASS |
| CHAP-07 AC3 ten listed values | 999, 1K, 1.5K, 50K, 999.9K, 1M, 1.1M, 16.4M, 2.5B, 1T | `numberFormat.test.js:5-20` (all ten, each its own `it`) | PASS |
| CHAP-07 AC4 chapter 1 boss `HP 2K/2K`; chapter 10 `HP 16.4M/16.4M` | the two HP texts | `monster.test.js:173-178`; e2e `campaignChapters.spec.js:101-104`, `:115-120` | PASS |
| CHAP-07 AC5 click of 5 000 reads `5K` | `5K` | e2e `campaignChapters.spec.js:145-156` (`sceneTexts` contains `5K`; `HP 5K/10K`); `damage.test.js:105-106` | PASS |

---

## Success Criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| Every Chapter Table number has a unit test | `ChapterTest.kt:305-365` (every column, chapters 6 to 15); `:368-394` (every stage 1 to 10) | PASS |
| Completed at 5 resumes at 6 with no manual change | `ProgressControllerIT.kt:210-227`; e2e `campaignChapters.spec.js:77-85` | PASS |
| Chapters 1 to 5 answer the same definitions as before the release | `ChapterTest.kt:397-399` (table columns, stage 1 and 10 only), `:95-97` (chapter 1 stages). Chapters 2 to 5, stages 2 to 9, not pinned. Mutant F4 survives | GAP 1 |
| A 3 000 000 000 health boss round-trips from the database to the HP text | `ChapterRepositoryIT.kt:93-96` (DB), `ProgressControllerIT.kt:97-104` (JSON), `monster.test.js:181-182` (text), e2e `campaignChapters.spec.js:108-113` (spawn); no single real-stack scenario (residual, two legs) | PASS (residual) |
| Seeded drop rules of 1, 5, 8, 15 match Coin Drops | `ChapterTest.kt:226-256`; `ChapterSeederIT.kt:63-69` | PASS |

## Edge Cases

| Edge case | `file:line` | Result |
| --- | --- | --- |
| Chapter 5 reset stays 5 | `AccountResetTest.kt:25` (`assertEquals(5, ...)`) | PASS |
| Completed at 5, farm lists chapter 6 bosses beaten (none yet) | `BT service/FarmServiceTest.kt:129-146` (`emptyList()`; chapter 5 boss refused) | PASS |
| Hand-made chapter 6 to 15 row left unchanged | `ChapterSeederIT.kt:132-138` (chapter 7) | PASS |
| 1 049 999 reads `1M` | `numberFormat.test.js:13` | PASS |
| 2 000 boss, 1 999.95 left reads `HP 2K/2K` | `monster.test.js:209-214` | PASS |
| 2 000 boss, 999.95 left reads `HP 1K/2K` | `monster.test.js:193-198` | PASS |

---

## Discrimination Sensor

Isolated in a temporary `git worktree` at `37949f2`, under the session scratch directory (never `git stash`, never the real tree). Each mutant changed one anchored line in the worktree copy, ran the covering tests, and was reverted with `git checkout` inside the worktree. Controls ran unmutated first: backend domain tests BUILD SUCCESSFUL (326 tests), `ClickerGame.test.js` 388 passed. A first driver attempt ran no tests (Gradle invocation error) and was discarded; every number below comes from the valid reruns.

| Mutation | File:line | Description | Result |
| --- | --- | --- | --- |
| N7 | `BM domain/Chapter.kt:161` | Phase monster health of stage 5 doubled in chapters 6 to 15 | Killed: `ChapterTest.kt:382` (1 of 326 domain tests) |
| N8 | `BM domain/Chapter.kt:164` | Miniboss defense of stage 5 plus 1 in chapters 6 to 15 | Killed: `ChapterTest.kt:385` (expected 38, was 39) |
| F1 | `BM domain/Chapter.kt:167` | Miniboss crit resistance of stage 4 in chapter 7 plus 1 | Killed: `ChapterTest.kt:387` (expected 44, was 45) |
| F2 | `BM domain/Chapter.kt:177` | Miniboss magical defense of stage 8 in chapter 9 minus 1 | Killed: `ChapterTest.kt:386` (expected 50, was 49) |
| F3 | `GS adapters/phaser/views/resetView.js:8` | Reset dialog shows `min(reward, 5)` | Killed: 2 of 388 (`ClickerGame.test.js:4616` chapter 12 and `:4625` completed, asserting `Você ganha 12` and `15`) |
| F4 | `BM domain/Chapter.kt:161` | Phase monster health of stage 5 doubled in chapters 2 to 5 (must stay unchanged) | SURVIVED: 0 of 326 domain tests and 0 of 935 backend tests fail. Gap 1 |

**Carried forward from round 2** (`validation.md` at `b4e6985`; production code unchanged since, `git diff --stat b4e6985..HEAD` shows tests only): killed M1 `Chapter.kt:133` (6 of 325), M2 `Chapter.kt:88` (2), M3 `Chapter.kt:89` (3), M5 `Chapter.kt:95` (2), M7 `ChapterOrder.kt:9` (7), M8 `Progress.kt:70` (3), M9 `AccountReset.kt:10` (2), M10 `ChapterEntities.kt:74` (2 of 42), M11 `V9__coin_drop_rebalance.sql:29` (1 of 5), N1 `FarmService.kt:74` (2 of 44), N2 `Chapter.kt:141` (1), N3 and N4 `ChapterSeeder.kt` (2 of 8 each), N5 `V8__health_hit_points_expand.sql` appended line (2 of 9), N6 `ChapterEntities.kt:50` (29 of 46), G1 `numberFormat.js:6` (2 of 42). Survived as equivalent: M4 `Chapter.kt:185` (uncapped boss defense is 80 at chapter 15, the cap value; spec note).

**Sensor depth**: expanded (23 manual mutations across rounds; no mutation tool configured; the change touches data integrity, migrations and the chapter table).
**Result**: this round 5 of 6 killed; across 23 mutations 21 killed. Survivors: F4 (gap 1) and M4 (equivalent).
**Isolation**: the worktree was removed (`git worktree prune`, extended-path delete); the real tree's `git status --porcelain` equals the baseline captured before the sensor (940 lines, identical after cleanup).

---

## Spec-Precision Notes (not blocking)

1. **Stage element rotation** (`ChapterTest.kt:388-391`, production `BM domain/Chapter.kt:163`). The enemy element of stage n in chapter c is `(n - 1 + c - 1) mod 5` over `FIRE, WATER, NATURE, LIGHT, DARKNESS` (enum order `Chapter.kt:3`). Q16 says "enemy elements keep the rotating formula", but the spec never writes the formula, and the per-chapter shift is production behaviour. The test pins that existing rule. It does not block: the spec's instruction is to keep the rule, and the test reproduces the pre-feature rotation. The fix, if the owner wants it stated, is a spec edit that writes the formula into CHAP-04.

---

## Gate Check

- **Backend**: `cd backend && ./gradlew cleanTest test jacocoTestReport`. BUILD SUCCESSFUL. 935 test cases, 0 failed, 0 errors, 0 skipped (round 2: 934; the +1 is `ChapterTest.kt:368`). JaCoCo: lines 98.99% (2756/2784), branches 93.03% (827/889). Production backend code is unchanged since round 2, so the percentages are unchanged.
- **Game unit**: `cd game && npm run test:coverage`. 72 files, 1576 passed, 0 failed (round 2: 1574; the +2 are `ClickerGame.test.js:4616` and `:4625`). Coverage: lines 97.95% (2586/2640), branches 95.18% (1205/1266). Changed production files at 100% lines and branches: `GS domain/combat/numberFormat.js`, `domain/combat/damage.js`, `domain/combat/monster.js`, `domain/campaign/accountReset.js`, `domain/campaign/campaign.js`.
- **E2E campaign spec**: `cd game && npx playwright test e2e/campaignChapters.spec.js`. 11 passed, 0 failed.
- **E2E full suite with coverage**: `cd game && npm run test:e2e:coverage`. 291 passed, 7 failed, 2 skipped (fixme). Line coverage 92.27% (2437/2641), branches 76.74% (779/1015). Lower bound: a test that fails midway counts only what it executed. Round 2 ran 298 passed; the game source changed in `ClickerGame.test.js`, so the suite was rerun rather than cited.
- **The 7 failures**, rerun in isolation with `npx playwright test -g`: 5 pass (`auth.spec.js:113`, `campaignChapters.spec.js:51`, `session.spec.js:102`, `stages.spec.js:103`, `talents.spec.js:148`). The full run overlapped with the Gradle and Vitest sensor runs of this round, so these were timeouts under load. The other 2 are `dragEquip.spec.js:550` and `:604` (Drag to equip edge scroll), failing in isolation at `:565` and `:618` (window scroll `expect.poll` of 5 s). Not attributed to the feature: no drag, scroll or equipment file changed in `91e3111..HEAD`, and at the round 2 commit `b4e6985` in this environment the bottom-edge scenario also fails (1 of 1) and the top-edge one fails 1 of 3. At HEAD both fail 3 of 3. The cause is not isolated and no campaign AC depends on it.

## Fix Plans (ranked)

### Gap 1 - Minor: per-stage definitions of chapters 2 to 5 not pinned (Goal "chapters 1 to 5 keep their numbers"; Success Criterion "Chapters 1 to 5 answer the same definitions as before the release")

- **Root cause**: the chapters 1 to 5 pins are the table columns of stage 1 and stage 10 (`ChapterTest.kt:397-399`), chapter 1 stages (`:95-97`) and two single values (`:288-294`). Chapters 2 to 5, stages 2 to 9, are not pinned anywhere in the suite. Mutant F4 (`Chapter.kt:161`, chapters 2 to 5) survives the domain run (326 tests) and the whole backend suite (935 tests).
- **Fix task (test only)**: extend the loop of `ChapterTest.kt:368-394` to chapters 1 to 5, asserting phase health, miniboss health, miniboss defenses and crit, and element for every stage, with the release formulas (factor `4^(c-1)`, bonus `5(c-1)`, the same phase and miniboss formulas). Then F4 must be killed. Production code is not to change.
- **Priority**: Minor. A live campaign keeps the stored values of chapters 1 to 5 (CHAP-01 AC 4); the gap guards fresh seeds and the definition itself.

---

## Residual Risks (not gaps)

- **CHAP-08 AC 5 and CHAP-09 AC 7, previous image not booted.** The replay (`PreviousBackendCompatibilityIT.kt:59-206`) covers every way the `91e3111` code meets the migrated database. The previous code is unchanged in the range that matters. A rollback drill on the deployed previous slot would be the strongest evidence and is recommended.
- **3 000 000 000 round trip.** Each leg is tested (DB, JSON, text, spawn); no single scenario crosses the backend JSON into the game. Accepted in round 2.
- **Chapter 90 instead of 99.** `ChapterRepositoryIT.kt:29`. Isolation holds; informational.
- **CHAP-06 AC 3 dialog has no e2e scenario.** Unit coverage pins the exact sentence (`ClickerGame.test.js:4616-4632`). The e2e scenario covers the label (`campaignChapters.spec.js:87-99`), which is what the spec's Independent Test names.
- **dragEquip edge-scroll scenarios** (see Gate Check): timing-sensitive, not a chapter AC, not isolated to a cause.
- **Stage element rotation** (spec-precision note 1).
- **Test counts.** Range since round 2: backend +1 test, game +2 tests, no assertion removed or weakened (47 insertions, 0 deletions).

---

## Requirement Traceability Update

| Requirement | Previous Status (round 2) | New Status |
| --- | --- | --- |
| CHAP-01 | Verified | Verified (AC 1 to 5) |
| CHAP-02 | Verified | Verified (AC 3, 4) |
| CHAP-03 | Verified | Verified (AC 6, 7) |
| CHAP-04 | Needs Fix (AC 1, 2 per stage) | Verified (AC 1 to 5); Success Criterion "chapters 1 to 5 same definitions" open (gap 1) |
| CHAP-05 | Verified | Verified (AC 6 to 8) |
| CHAP-06 | Needs Fix (AC 3 dialog) | Verified (AC 1 to 3) |
| CHAP-07 | Verified | Verified (AC 1 to 5) |
| CHAP-08 | Verified | Verified (AC 5 by replay, residual) |
| CHAP-09 | Verified | Verified (AC 7 by replay, residual) |

The spec file itself was not edited by the Verifier; the status column above is for the orchestrator to apply.

---

## Summary

**Overall**: FAIL (round 3 of 3; escalate to the user)

**Spec-anchored check**: 36/36 ACs with matching evidence (two by replay, residual); Success Criteria 4/5, gap 1.
**Sensor**: 5/6 mutations killed this round (F4 survived); 21/23 across rounds (M4 equivalent, F4 gap).
**Gate**: backend 935 passed; game unit 1576 passed; campaign spec 11 passed; full e2e 291 passed, 7 failed (5 pass in isolation, 2 dragEquip outside the feature), 2 skipped.

**What works**: the Chapter Table for every chapter and column, every stage of chapters 6 to 15 (phase health, miniboss health, defenses, crit, element), the reset dialog for chapters 12 and completed, the progression to 15, the completed-at-5 load and farm, the 64-bit round trip, the seeder edges, the V8 and V9 migrations with all 15 rules, the reset cap, the short-format boundaries, the e2e scenarios for the player-visible criteria.

**Issues found**: gap 1 (chapters 2 to 5 per stage; test-only fix, F4 must die).

**Next steps**: owner decides whether to accept the FAIL or run one test-only fix to close gap 1 (escalation, since round 3 is the last allowed); run the rollback drill before relying on the replay for CHAP-08 AC 5 and CHAP-09 AC 7.

---

## Owner decision (2026-11-14)

The owner accepted the feature `campaign-chapters` with gap 1 left open (per-stage definitions of chapters 2 to 5 not pinned; mutant F4 survives). The Verifier verdict above stays **FAIL**: nothing in this report was changed, and the gap was not fixed. It is a test-only gap with no known production defect.

- **Open follow-up**: close gap 1 with the test-only fix described under "Fix Plans" (extend `ChapterTest.kt:368-394` to chapters 1 to 5 and kill F4). `.specs/STATE.md` has no list for follow-ups (its Handoff block describes a paused feature), so it is recorded here and in `report.html` only.
- **Deploy**: the owner restarts `./publish.sh` personally. Until then the deploy is pending; the release tag, the GitHub release and the production check wait for it. Tasks T13 and T14 (contract migration) wait for the deploy of T1 to T12 to be live.

---

## Round 4

**Date**: 2026-11-15
**Verdict**: FAIL - 1 gap (Minor): the boss element of chapters 2 to 5 is not pinned (mutant F8 survives). Round 3 gap 1 (per-stage definitions of chapters 1 to 5, mutant F4) is closed.
**Diff range**: `37949f2..46edd83` on `main`. The commit under review is `46edd83` (test only, `BT domain/ChapterTest.kt`, 32 insertions, 21 deletions). The other commits in the range are the deferred contract tasks T13 and T14 (`a0c7066`, `ae88c42`; production `ChapterEntities.kt` and `V10__health_legacy_columns_drop.sql`; T14 is already the active slot `8018752` in `.deploy-state`), docs and the reversa files. `Chapter.kt` and `ChapterOrder.kt` have not changed since `37949f2`, and no `game/` file changed in the range.
**Verifier**: fresh instance, round 4 (author ≠ verifier). graphify is not on PATH on this machine, so the source was read directly.

Path shorthands as in round 3: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `BM` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`.

### 1. The new test asserts the spec values, not the production code

Test: `BT domain/ChapterTest.kt:375-380` (`every stage of chapters 1 to 5 follows the release formulas`), helper `:384-404`, table `:336-340`, table test `:408-410`.

- **Release formulas**: `spec.md:19` gives the release health factor `4^(c-1)` and defense `+5` per chapter. The test passes `factor = 1L shl (2 * (c - 1))` and `bonus = 5 * (c - 1)` (`:379`). It does not call `ChapterDefinition.healthFactor` or `defenseBonus`, so a wrong production factor cannot pass through the expectation.
- **Stage formulas** (`:393-403`): phase health `(40 + 4(n-1)) x factor` (`:393-394`), miniboss `5 x` phase health (`:395`), miniboss defenses `min(10 + n + bonus, 80)` (`:397-398`), miniboss crit `min(10 + 2n + bonus, 70)` (`:399`). The caps are the Chapter Table caps. They do not bind for chapters 1 to 5 (largest values: boss defense 50, miniboss defense 40, crit 50).
- **Element** (`:401`): `(n - 1 + c - 1) mod 5` mirrors the rotation of the release. The spec does not write the rotation (spec-precision note 1 of round 3, unchanged).
- **Literal rows**: `:336-340` hold the Chapter Table literals of chapters 1 to 5 (`spec.md:70` is the chapter 5 row). Checked by hand: chapter 3 stage 10 phase health `76 x 16 = 1 216`, miniboss `6 080`, miniboss defense `10 + 10 + 10 = 30`, crit `10 + 20 + 10 = 40`; chapter 5 stage 10 phase health `(40 + 36) x 256 = 19 456` (`spec.md:70`).
- **Same definitions as before the release**: the release code (`git show 91e3111:BM domain/Chapter.kt`) uses the same formulas for chapters 1 to 5: health fold `x4` (`:113`), defense bonus `5 (c-1)` (`:124`), element `(n-1+c-1) mod 5` (`:134`), phase monster defenses 0 (`:147`), boss element `(c+3) mod 5` (`:155`). Its caps (90 and 100, `:19-20`) do not bind for chapters 1 to 5 either. The expected values are therefore the pre-feature values.

### 2. Backend totals

Command: `cd backend && ./gradlew cleanTest test` on `46edd83`. BUILD SUCCESSFUL. JUnit XML (84 suites): **932 tests, 932 passed, 0 failed, 0 skipped**.

Round 3 counted 935. The change is -3: four `@Test` cases removed with the legacy health columns in `a0c7066` and `ae88c42` (`ChapterRepositoryIT`: `a seeded chapter holds the same value in the legacy and the hit point columns`; `MonsterHealthMigrationIT`: `a database seeded with the linear health gets the grown one` and `a health tuned in the database survives`; `HealthHitPointsMigrationIT`: `the legacy health columns stay integer and accept null`), and one added (`ChapterTest.kt:376`). 935 - 4 + 1 = 932. The copy case `the expand migration copies every legacy health into the hit points` was renamed and removed; see residual R1.

### 3. Discrimination sensor

Isolated `git worktree` at `46edd83` under the session scratch directory. Each mutant changed one anchored line in the worktree copy and ran the whole backend suite (`cleanTest test`). The mutant was reverted with `git checkout --` in the worktree, the worktree was removed afterwards (extended-path delete), and the real tree's `git status --porcelain` was empty before and after. `git diff -- backend/src/main` is empty.

Control, unmutated: 932 tests, 931 passed, 1 failed, `BT adapter/web/WalletFlowIT.kt:51` (intermittent, residual R3). The clean real-tree run is the baseline for the verdict.

| Mutation | File:line | Description | Result |
| --- | --- | --- | --- |
| F4 | `BM domain/Chapter.kt:161` | Phase monster health of stage 5 doubled in chapters 2 to 5 (round 3 survivor) | Killed: `ChapterTest.kt:394` (1 failing test) |
| F5 | `BM domain/Chapter.kt:167` | Miniboss crit resistance of stage 3 in chapter 3 plus 1 | Killed: `ChapterTest.kt:399` |
| F6 | `BM domain/Chapter.kt:163` | Element rotation of chapter 4 shifted by one | Killed: `ChapterTest.kt:402` |
| F7 | `BM domain/Chapter.kt:176` | Phase monster physical defense of stage 2 in chapter 3 set to 1 | Killed: `ChapterRepositoryIT.kt:209` (`assertEquals(5, monsters.size)`) |
| F8 | `BM domain/Chapter.kt:184` | Boss element of chapter 2 shifted by one (FIRE to WATER) | **Survived**: 932 of 932 pass. Gap 1 |
| F9 | `BM domain/Chapter.kt:172` | Phases per stage of chapter 4 set to 4 | Killed, indirectly: `ProgressTest.kt:148` (clear count of the chapter) |

**Result**: 5 of 6 killed. F5 to F9 are five new mutations on the chapters 1 to 5 definitions. Across the campaign (round 3 total of 23 plus the 5 new): 28 mutations, 26 killed, 2 survived: M4 (equivalent, see round 2) and F8 (gap 1 of this round). F4 changed from survived to killed.

**Sensor depth**: expanded (manual, behavior-level, one anchored line per mutant; no mutation tool configured).

### 4. Ranked gaps

1. **Minor - boss element of chapters 2 to 5 not pinned (F8 survives).** Spec anchor: Success Criterion `spec.md:309` ("Chapters 1 to 5 answer the same definitions as before the release"). The release rule is `(c + 3) mod 5` (`91e3111` `Chapter.kt:155`): chapter 1 DARKNESS, chapter 2 FIRE, chapter 3 WATER, chapter 4 NATURE, chapter 5 LIGHT. Only chapter 1 is pinned (`BT adapter/web/ProgressControllerIT.kt:118`, `definition.boss.element` DARKNESS). No assertion in the backend suite reads the boss element of chapters 2 to 5.
   - Fix (test only): assert the boss element of chapters 1 to 5 with those literals, for example in `ChapterTest.kt:408-410` (`chapters 1 to 5 keep every column of the chapter table`). Then F8 must die. Production code is not to change.
   - Spec-precision: the spec never states the boss element rule (the Chapter Table has no element column, and Q16 says only "enemy elements keep the rotating formula"). The chapters 6 to 15 boss elements therefore have no spec anchor. A spec edit would make them testable.
   - Priority: Minor. Live chapters keep their stored rows (CHAP-01 AC 4), and only fresh seeds are affected.

### 5. Residual (not gaps)

- **R1. CHAP-08 AC 4 has no standing test since T14.** The case `the expand migration copies every legacy health into the hit points` was removed. `tasks.md` (T14, "Removals allowed", `:682-684`) lists it, and says the V8 backfill was verified by the T1 and T13 runs before the drop. The copy is now historical evidence only. A Flyway replay that migrates legacy rows to V8 would give standing evidence. Reported, not counted as a gap, because the removal is listed in the approved plan.
- **R2. CHAP-08 AC 5 replays the T13 release now.** The round 3 replay of the pre-feature release (legacy integer reads and writes) is gone. `BT adapter/repository/PreviousBackendCompatibilityIT.kt` now checks the T13 release: entities `:59-99`, read path `:101-129`, write path `:148-168`, Flyway V1 to V9 `:170-206`. The spec ends the pre-feature compatibility at the contract (CHAP-08 AC 5: "compatibility with the pre-feature backend ends there by design"), so this is not a gap. The rollback drill recommended in round 3 is still open.
- **R3. `WalletFlowIT` intermittent failure.** One failure in 8 full-suite runs of this round (the control, `WalletFlowIT.kt:51`, `wallet.copper` against `before.sum()`). It passed in the clean real-tree run, in the 6 mutant runs and in 3 class-only reruns. No Kotlin wallet or sync file under `backend/src/main` changed since `91e3111` (the wallet-named changes in the range are the V9 and V10 SQL). The test checks the at-most-once credit of AD-002 under six parallel syncs, so a rare race in production is not excluded by these runs. Follow-up: run `WalletFlowIT` in a loop and, if it fails, open a bug.
- **R4. Game suites not re-run.** No `game/` file changed since `37949f2`. The round 3 figures stand (game unit 1576 passed; e2e 291 passed, 7 failed as explained in round 3, 2 skipped). They are not re-measured here.

### 6. Requirement traceability (for the orchestrator to apply; the spec was not edited)

| Requirement | Round 3 | Round 4 |
| --- | --- | --- |
| CHAP-04 | Verified (AC 1 to 5); Success Criterion open (gap 1) | Verified (AC 1 to 5); Success Criterion open: boss element of chapters 2 to 5 (gap 1, test only) |
| CHAP-08 | Verified (AC 5 by replay, residual) | Verified (AC 1 to 3, 6); AC 4 historical (R1); AC 5 replays T13 (R2) |

### Summary

**Overall**: FAIL (round 4). The round 3 gap is closed, but the same success criterion has a second unpinned definition: the boss element of chapters 2 to 5. Three validation rounds are used up, so this goes to the owner.
**Spec-anchored check**: round 3 gap 1 closed (F4, F5, F6 killed; F7 and F9 killed too). One new Minor gap (F8, boss element of chapters 2 to 5).
**Sensor**: 5 of 6 killed this round; 26 of 28 across the campaign (F8 gap, M4 equivalent).
**Gate**: backend 932 passed, 0 failed, 0 skipped (`cleanTest test`); game and e2e not re-run (no game change in range).

**What works**: the release formulas of chapters 1 to 5 are asserted per stage (phase health, miniboss health, defenses, crit, element); the phase monster defenses and phase counts are covered by mutants F7 and F9; the chapter table literals of chapters 1 to 5 match the pre-feature code.

**Issues found**: gap 1 of this round (boss element of chapters 2 to 5). It needs a test-only fix: the literals above, in `ChapterTest.kt:408-410`, then rerun F8.

**Next steps** (owner decides): (a) one test-only fix to pin the boss element of chapters 1 to 5, then re-verify, or accept the gap as round 3 was accepted; (b) a spec edit that states the boss element rule (Q16 or a Chapter Table column) before chapters 6 to 15 can be pinned; (c) the rollback drill for the V10 deploy (round 3); (d) a loop run of `WalletFlowIT` (R3).

---

## Round 5

**Date**: 2026-11-15
**Verdict**: PASS. Round 4 gap 1 (boss element of chapters 2 to 5, mutant F8) is closed. The sweep of every field of the chapters 1 to 5 definition found no unpinned field. Two fields are pinned only at database level (residual R-a, not a gap).
**Diff range**: `46edd83..b59c135` on `main`. Commits: `23ad9f3` (round 4 report, this file) and `b59c135` (test only: `BT domain/ChapterTest.kt`, 17 insertions, 0 deletions). No production or game file changed since round 4: `git diff --stat 46edd83..HEAD -- backend/src/main game` is empty. Since round 3 (`37949f2..HEAD`), `game` is empty too, and `domain/Chapter.kt` and `domain/ChapterOrder.kt` are unchanged.
**Verifier**: fresh instance, round 5 (author ≠ verifier). graphify is not on PATH on this machine, so the source was read directly.

Path shorthands as before: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `BM` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`.

### 1. The new test against the release

Test: `BT domain/ChapterTest.kt:413-427` (`chapters 1 to 5 keep the boss elements of the release`), assertion `:425`.

- **Literals against the release code.** At `91e3111`, `BM domain/Chapter.kt:3` is `enum class Element { FIRE, WATER, NATURE, LIGHT, DARKNESS }` and `:155` is `Element.entries[(number + 3) % Element.entries.size]`. Index by chapter: 1 gives 4 (DARKNESS), 2 gives 0 (FIRE), 3 gives 1 (WATER), 4 gives 2 (NATURE), 5 gives 3 (LIGHT). The literals at `:418-422` match each row.
- **Independent run of the release.** A throwaway test in a `git worktree` at `91e3111` printed `ChapterDefinition.of(c)` for chapters 1 to 5, every field. The same print at `b59c135` is identical line for line. Its boss elements are DARKNESS, FIRE, WATER, NATURE and LIGHT. Both worktrees were removed; the real tree was not touched.
- **Anchor.** Success Criterion `spec.md:309` ("Chapters 1 to 5 answer the same definitions as before the release"). The test name and the comment at `:414-415` name the release commit `91e3111` and `Chapter.kt:155`, the same referent the criterion names. Anchored. Spec-precision note 2 below explains why the release code is the only written source for this value.

### 2. Sweep of the chapters 1 to 5 definition

Method: the release print is the reference for every field. A field counts as pinned when an assertion at HEAD would fail for a change of that field in chapters 1 to 5. Every row was checked, and the mutants in section 3 test the rows with no unit-level pin.

| Field (chapters 1 to 5) | Pinning test `file:line` | Mutant |
| --- | --- | --- |
| Chapter number | `ChapterTest.kt:89` (chapter 1), `:122` (chapters 2 to 5, loop `:118-122`) | none needed |
| Boss health | `ChapterTest.kt:350` (table loop `:409`), `:209`, `:211` | none needed |
| Boss time limit 60 000 ms | `ChapterTest.kt:434` (`:430-439`) | none needed |
| Boss physical, magical defense | `ChapterTest.kt:354`, `:355` (table loop `:409`) | none needed |
| Boss critical resistance | `ChapterTest.kt:356` (table loop `:409`) | none needed |
| Boss element | `ChapterTest.kt:425` (new, `:413-427`) | F8 killed |
| Boss drop rule id `3c` | `ChapterTest.kt:275` (`:266-277`) | none needed |
| Stage count and numbering 1 to 10 | `ChapterTest.kt:388` (stage count), `:389-390` (`chapter.stage(n)`) | none needed |
| Stage phase monster health | `ChapterTest.kt:393-394` (`:376-381`) | none needed |
| Stage miniboss health (5 times phase) | `ChapterTest.kt:395` | none needed |
| Stage miniboss time limit 30 000 ms | `ChapterTest.kt:436` (every stage, `:430-439`) | none needed |
| Stage phases per stage (5) | Chapter 1: `ChapterTest.kt:91`. Chapters 2 to 5: indirect, `ProgressTest.kt:157` (`61 * 15` clears over chapters 1 to 15) | P3 killed by `ProgressTest.kt:148` |
| Phase monster element | `ChapterTest.kt:402` | none needed |
| Phase monster physical, magical defense and critical resistance (0) | No unit pin for chapters 1 to 5 (`ChapterTest.kt:190-202` starts at chapter 6). Indirect: `ChapterRepositoryIT.kt:195-216`, which requires the 50 seeded stages of chapters 1 to 5 to share 5 distinct monster tuples, all zero (`:209`, `:213`) | P1, P2, P4 killed by `ChapterRepositoryIT.kt:209` (residual R-a) |
| Miniboss element | `ChapterTest.kt:403` | none needed |
| Miniboss physical, magical defense (every stage) | `ChapterTest.kt:397`, `:398` (`:376-381`) | none needed |
| Miniboss critical resistance (every stage) | `ChapterTest.kt:399` | none needed |
| Phase monster and miniboss drop rule ids | `ChapterTest.kt:272`, `:273` | none needed |

Result: every field of chapters 1 to 5 has an assertion. Two groups are pinned indirectly and were proven by mutants: the phases per stage of chapters 2 to 5 (P3) and the phase monster defenses and critical resistance of chapters 1 to 5 (P1, P2, P4).

### 3. Discrimination sensor

Isolated `git worktree` at `b59c135` under the session scratch directory (`r5-head`). One anchored line changed per mutant in the worktree copy. The domain package ran first (328 tests). If nothing failed, `ChapterRepositoryIT` ran next, and the full suite only if that also passed. Each mutant was reverted with `git checkout --` in the worktree, and `git status --porcelain` of the worktree was empty before and after every mutant. The worktree was then removed.

Control, unmutated: domain 328 tests, 0 failed.

| Mutation | File:line | Description | Result |
| --- | --- | --- | --- |
| F8 | `BM domain/Chapter.kt:184` | Boss element of chapter 2 shifted by one (FIRE to WATER), round 4 survivor | Killed: `ChapterTest.kt:425` ("chapters 1 to 5 keep the boss elements of the release") |
| P1 | `BM domain/Chapter.kt:176` | Phase monster magical defense of stage 4 of chapter 2 set to 1 | Killed: `ChapterRepositoryIT.kt:209` (domain 328 pass) |
| P2 | `BM domain/Chapter.kt:176` | Phase monster critical resistance of stage 7 of chapter 4 set to 1 | Killed: `ChapterRepositoryIT.kt:209` (domain 328 pass) |
| P3 | `BM domain/Chapter.kt:172` | Phases per stage of chapter 2 set to 4 | Killed: `ProgressTest.kt:157` (`61 * 15`, test `:148`) |
| P4 | `BM domain/Chapter.kt:176` | Phase monster physical defense of stage 10 of chapter 5 set to 1 | Killed: `ChapterRepositoryIT.kt:209` (domain 328 pass) |

**Sensor depth**: expanded (manual, behavior-level, one anchored line per mutant, weakest fields chosen from the sweep: phases per stage and the phase monster stats). No mutation tool configured.
**Result**: 5 of 5 killed this round. F8 is the round 4 survivor, now killed. Across the campaign: 32 distinct mutations, 31 killed, 1 survived (M4, equivalent, round 2).
**Isolation**: `git status --porcelain` of the real tree is empty and `git diff -- backend/src/main` is empty after the sensor.

### 4. Gate

- **Backend**: `cd backend && ./gradlew cleanTest test jacocoTestReport` on `b59c135`, real tree. BUILD SUCCESSFUL in 3m 22s. JUnit XML: 84 suites, 933 tests, 933 passed, 0 failed, 0 errors, 0 skipped (round 4: 932; the +1 is `ChapterTest.kt:413`). JaCoCo `build/reports/jacoco/test/jacocoTestReport.xml`: lines 99.10% (2749/2774), branches 93.01% (825/887). The change from round 3 (98.99%, 93.03%) comes from the legacy health columns removed by T13 and T14 (`a0c7066`, `ae88c42`), not from this round.
- **Game unit and e2e**: not re-run. No `game` file changed since `37949f2` (`git diff --stat 37949f2..HEAD -- game` is empty), so the round 3 figures are carried, not re-measured. Game unit: 72 files, 1576 passed, 0 failed; `npm run test:coverage` lines 97.95% (2586/2640), branches 95.18% (1205/1266). E2E full suite with coverage: 291 passed, 7 failed, 2 skipped; line coverage 92.27% (2437/2641). The 7 failures are explained in round 3 (5 timeouts under load that pass in isolation, 2 `dragEquip` edge-scroll scenarios outside this feature).
- **Completion gate**: `python .claude/skills/tlc-spec-driven/scripts/validate_state.py campaign-chapters`, run from the repository root on this file, exit code 0 (0 errors).

### 5. Spec-precision notes (not blocking)

1. Stage element rotation (round 3 note 1) is unchanged.
2. **Boss element rule.** The spec never writes it: the Chapter Table has no element column, and Q16 says only "enemy elements keep the rotating formula". The release code (`91e3111` `Chapter.kt:155`) is the only written source, so the test cites it. The boss elements of chapters 6 to 15 have no spec anchor and no test (carried from round 4).
3. **"Same definitions" and the drop rules.** `spec.md:309` read literally would conflict with CHAP-09 AC 5, which moves the drop ranges of chapters 1 to 5 by design. The Verifier reads "definitions" as the `ChapterDefinition` values (the Chapter Table and the stage and boss attributes). Drop rule ranges are outside `ChapterDefinition` and are pinned by `ChapterTest.kt:226-240` and `CoinDropMigrationIT`. The release print confirms the drop rule ranges differ, as CHAP-09 requires. A spec wording that says so would close the reading.

### 6. Residuals (not gaps)

- **R-a. Phase monster stats of chapters 1 to 5 are pinned at database level only** (`ChapterRepositoryIT.kt:195-216`). Chapters 6 to 15 are pinned at unit level (`ChapterTest.kt:190-202`). The gate runs the IT, so the criterion is covered. Optional, test-only hardening: extend the loop of `ChapterTest.kt:191` to `(1..15)`.
- **R-b. `WalletFlowIT` intermittent failure (round 4 R3).** It did not recur: the real-tree gate passed 933 of 933 and the control passed 328 of 328. The loop run remains open.
- **R-c. Rollback drill for the V10 deploy (round 3 recommendation) is still open.**
- **R-d. Lesson not recorded.** The round 4 survivor F8 has no entry in `.specs/LESSONS.md` (L-087 covers the round 3 survivor F4 only). This round's commit is limited to `validation.md`, so `lessons.py add` was not run. Proposed lesson for the orchestrator: "Pin every field of each unchanged row, not only the columns a table lists, because a table column does not name the element, the phase count or the monster stats." Grounded in the round 4 sensor (F8, `Chapter.kt:184`).

### 7. Requirement traceability (for the orchestrator to apply; the spec was not edited)

| Requirement | Round 4 | Round 5 |
| --- | --- | --- |
| CHAP-04 | Verified (AC 1 to 5); Success Criterion open: boss element of chapters 2 to 5 (gap 1) | Verified (AC 1 to 5); Success Criterion "chapters 1 to 5 same definitions" closed by `ChapterTest.kt:413-427`, `:350` and the release print |

### Summary

**Overall**: PASS (round 5). Round 4 gap 1 is closed. Five of five Success Criteria match, with the spec-precision notes above.
**Spec-anchored check**: 36 of 36 ACs as in round 3 and 4; Success Criteria 5 of 5.
**Sensor**: 5 of 5 killed this round (F8, P1 to P4); 31 of 32 across the campaign (M4 equivalent).
**Gate**: backend 933 passed, 0 failed, 0 skipped; JaCoCo lines 99.10%, branches 93.01%. Game and e2e carried from round 3 (no game change).

**What works**: the chapters 1 to 5 definition is identical to the release in every field, and each field has an assertion that a mutant of it fails.

**Issues found**: none blocking. Residuals R-a to R-d and spec-precision notes 2 and 3.

**Next steps**: the product owner accepts or rejects. Orchestrator: apply the traceability in section 7, record the lesson in R-d if wanted, and run the deploy and report steps for this feature (gitops).
