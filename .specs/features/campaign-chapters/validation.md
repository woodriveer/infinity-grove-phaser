# Campaign Chapters 6 to 15 Validation

**Date**: 2026-11-14
**Spec**: `.specs/features/campaign-chapters/spec.md` (amended in `44fa821`: CHAP-07 AC 1 narrowed to damage numbers and the battle HP text; the defense cap of 80 is inert in chapters 1 to 15, no test owed)
**Diff range**: `91e3111..37949f2` on `main` (T1 to T12, the round 1 fixes `1807622` to `a24e10e`, the round 2 test commits `0aebd84` and `37949f2`). Since round 2 (`b4e6985..37949f2`): 2 test files, 47 insertions, 0 deletions, no production or spec change. T13 and T14 (contract migration) are deferred until the deploy is live, not counted as gaps.
**Verifier**: independent sub-agent, round 3 of 3 (author ≠ verifier)

Path shorthands used below: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `BM` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `GS` = `game/src/`, `GE` = `game/e2e/`.

---

## Validation: campaign-chapters - FAIL

**Verdict**: FAIL - 1 gap (Minor), ranked below. The round 2 gaps are closed. The gap left is the chapters 1 to 5 success criterion: the new sensor mutant F4 changes stage 5 of chapters 2 to 5 and survives the whole backend suite. Round 3 is the last round allowed, so this FAIL escalates to the user.

**Spec-anchored check**: 36 of 36 ACs have `file:line` evidence matching the spec outcome (CHAP-08 AC 5 and CHAP-09 AC 7 by schema and Flyway replay, accepted residual). 4 of 5 Success Criteria match; "Chapters 1 to 5 answer the same definitions" does not (gap 1). One spec-precision note (stage element rotation, non-blocking).
**Gate**: backend 935 passed, 0 failed, 0 skipped; game unit 1576 passed, 0 failed; campaign spec 11 passed; full e2e 291 passed, 7 failed, 2 skipped (fixme). The 7 failures are explained in Gate Check: 5 pass in isolation, 2 are `dragEquip` edge-scroll scenarios outside this feature.
**Sensor**: 6 mutations run this round: 5 killed, 1 survived (F4, gap 1). Carried from round 2: 16 killed, M4 survived as equivalent. Across all 23 mutations: 21 killed, 2 survived (F4 gap, M4 equivalent).
**Report**: `.specs/features/campaign-chapters/validation.md`

---

## Round History

- Round 1 at `42754ca`: FAIL, 12 ranked gaps, sensor 14 of 16 killed.
- Round 2 at `b4e6985`: FAIL, 2 gaps (CHAP-04 AC 1 and 2 per stage for chapters 6 to 15; CHAP-06 AC 3 dialog above chapter 4), sensor 16 of 19 killed.
- Round 3 at `37949f2` (this report): FAIL, 1 gap (chapters 1 to 5 per stage, F4 survives). Both round 2 gaps are closed: `BT domain/ChapterTest.kt:368-394` (every stage 1 to 10 of chapters 6 to 15; mutants N7, N8, F1, F2 killed) and `GS adapters/phaser/ClickerGame.test.js:4616-4632` (dialog at chapter 12 and completed; mutant F3 killed).

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
