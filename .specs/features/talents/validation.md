# Talents Validation

## Validation: talents - PASS

**Date**: 2026-10-28
**Iteration**: 3 of 3
**Spec**: `.specs/features/talents/spec.md`, superseded in part by `.specs/features/talent-points/spec.md` (AD-013) and by AD-017 (`.specs/STATE.md:133`)
**Diff range**: feature commits `cd95ed6`, `1796327`, `17f5c7b`, `4d90d70` (backend), `56a58a9`, `d47685c`, `9e961ef`, `6fe3212` (game), `3e2c525`, `f212e5a`; later talent commits `9fec6d7..7eb26a9` (talent-points), `b443844`, `4a4f86f`, `08be5c9`, `c269730`, `e32951d`, `53b61ed`, `24bd85d`; fix commits `91d5f21` (iteration 1) and `eadfdc6` (iteration 2). Verified on the committed tree at `eadfdc6` (HEAD of `main`), worktree clean. Between `91d5f21` and `eadfdc6` only `game/src/adapters/phaser/ClickerGame.test.js` changed in code (+12 lines); `a3d2ae8` and `e185c3b` touch other features' docs; no talent spec or `STATE.md` changed.
**Verifier**: independent sub-agent (author != verifier), fresh context
**Verdict**: the gap of iteration 2 is closed. `eadfdc6` adds `ClickerGame.test.js:3166` "adds a time talent upgraded during the fight to the limit of the next encounter", which kills mutant G6. Every AC matches its (superseding) source, 15 of 15 mutants are killed (6 backend, 9 game incl. G6) and every gate is green apart from the 3 known farm-mode unit tests. The remaining notes (reset answer and grade texts not written in a spec, three stale test titles) do not block.

---

## Iteration History

| Iteration | Date | Verdict | Main finding | Fix |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-28 | Not ready (documentation) | `b443844`, `4a4f86f`, `08be5c9` changed catalog and scope with no spec or decision; 13/13 mutants killed; screen AC10 next encounter only indirect (gap 5, not tested by a mutant) | `91d5f21`: AD-017, superseded notes in both talent specs, edge case `+50%`, test renamed |
| 2 | 2026-10-28 | Not ready (one test missing) | Drift closed; 11 of 12 mutants killed; G6 (time talents frozen after the first boss encounter, screen AC10) survives | `eadfdc6`: one unit test in "ClickerGame talents in combat" |
| 3 | 2026-10-28 | Ready (verdict line above) | G6 killed by `ClickerGame.test.js:3166`; 15/15 mutants killed; gates green | none needed; bookkeeping by the orchestrator |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | Done | `cd95ed6` |
| T2 | Done | `1796327` (`V3__player_talents.sql`) |
| T3 | Done | `17f5c7b` |
| T4 | Done | `4d90d70` (ADR 0010) |
| T5 | Done | `56a58a9`, aimed-shot test in `3e2c525` |
| T6 | Done | `d47685c` |
| T7 | Done | `9e961ef` |
| T8 | Done | `6fe3212` |

`tasks.md:12` still reads `Status: In progress` and the traceability table of `spec.md` still reads `Pending`; that bookkeeping is done by the orchestrator at closure and is not counted here.

---

## Fix of iteration 2 (`eadfdc6`)

| Iteration 2 fix item | Where now | Done? |
| --- | --- | --- |
| A test that starts at a miniboss with no time talent, upgrades `MINIBOSS_TIME` 0 -> 5 and shows the next encounter | `game/src/adapters/phaser/ClickerGame.test.js:3166-3176`: `createScene({ start: progress(1, 'MINIBOSS', 1), talents: tree() })`; `:3169` `expect(ctx.scene.countdown.limitMs).toBe(30_000)` (the first boss encounter is shown with the tree loaded, so a freeze would capture it); `:3171` `talentGateway.upgrade.mockResolvedValue({ talents: tree({ MINIBOSS_TIME: 5 }), ... })`; `:3172` `await ctx.scene.talents.upgrade('MINIBOSS_TIME', 0)`; `:3173` `showEncounter(ctx.scene.session.encounter())`; `:3175` `expect(ctx.scene.countdown.limitMs).toBe(40_000)` | Yes |
| The test passes on HEAD and fails with G6 | passes in the full suite (gate below); with G6 applied it is the one non-farm failure (sensor below) | Yes |
| No production change | `git diff --stat 91d5f21 eadfdc6 -- game backend`: only the test file | Yes |

---

## Spec-Anchored Acceptance Criteria

Backend test paths are under `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, game paths under `game/`. Each AC is judged against the latest source that owns it: talents spec, then talent-points spec (TP), then AD-017. Every citation below was re-read on `eadfdc6`; the `ClickerGame.test.js` lines after `:3163` moved by +12 against iteration 2.

### P1: Buy talent levels (backend)

| # | Criterion | Spec-defined outcome (source) | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | `GET /talents` answers the catalog with `id, branch, label, unit, perLevel, maxLevel, level, value, nextCost` | 30 talents = 10 ids x 3 grades; `CLICK_DAMAGE` perLevel 5; `CLICK_FLAT_DAMAGE` added (AD-017) | `adapter/web/TalentControllerIT.kt:72` `.body("talents.size()", equalTo(30))`; `:74-88` the 10 grade-1 ids; `:99` `maxLevel` `List(30){10}`; `:102-107` `COMBO_G2` baseId/perLevel 10, `Dano de clique (%)` perLevel 5; `domain/TalentsTest.kt:22` `Triple("CLICK_DAMAGE", TalentBranch.POWER, 5)`; `:61` `assertEquals(30, TalentCatalog.all.size)` | Covered (vs AD-017) |
| 2 | New player: level 0, value 0, `nextCost` | 0 / 0; `nextCost` 1, 2, 3 by grade; points 0/0/0 | `adapter/web/TalentControllerIT.kt:96-97` `List(30){0}`; `:98` `equalTo(List(10) { 1 } + List(10) { 2 } + List(10) { 3 })`; `:101` unlocked; `:114-116` points | Covered |
| 3 | Upgrade from 0: level 1, cost taken, tree back | level 1, `spent` 1, `available` 2, no wallet (TP) | `adapter/web/TalentControllerIT.kt:164-170` `talents[8].level equalTo(1)`, `value equalTo(5)`, `nextCost equalTo(1)`, `points.spent equalTo(1)`, `points.available equalTo(2)`, `wallet nullValue()` | Covered |
| 4 | Level 1: second level price | 1 point grade 1; 2 points grade 2 (AD-017) | `adapter/web/TalentControllerIT.kt:166`; `:149-150` spent 12 / available 18; `domain/TalentsTest.kt:97-98`, `:101` | Covered |
| 5 | Level 9: `nextCost` | 1 (TP) | `domain/TalentsTest.kt:217` `assertEquals(1, talents.nextCost(combo, rules))` | Covered |
| 6 | Stored 3, `fromLevel` 2: 409 `TALENT_LEVEL_MISMATCH`, nothing changes | 409, level kept | `adapter/web/TalentControllerIT.kt:214` `equalTo("TALENT_LEVEL_MISMATCH")`; `:216` level 3 | Covered |
| 7 | Not enough to pay | 409 `NOT_ENOUGH_TALENT_POINTS`, nothing changes (TP) | `adapter/web/TalentControllerIT.kt:223`, `:225`, `:226` | Covered |
| 8 | Level 10: 409 `TALENT_MAX_LEVEL`, `nextCost` null | same | `adapter/web/TalentControllerIT.kt:234` `equalTo("TALENT_MAX_LEVEL")`; `:241` `nextCost nullValue()`; `:242` value 50 | Covered |
| 9 | Unknown id: 404 `TALENT_NOT_FOUND` | 404 + code | `adapter/web/TalentControllerIT.kt:250` `statusCode(404).body("code", equalTo("TALENT_NOT_FOUND"))` | Covered |
| 10 | `fromLevel` missing, negative, above max: 400 `INVALID_TALENT_REQUEST` | 400 + code | `adapter/web/TalentControllerIT.kt:257-258`, `:262-269` | Covered |
| 11 | No valid token: 401 | 401 on every route | `adapter/web/TalentControllerIT.kt:274`, `:280`, `:155` `post("/talents/reset").then().statusCode(401)` | Covered |
| 12 | Same `fromLevel` race: exactly one accepted | one 200, one 409 | `adapter/web/TalentControllerIT.kt:298` `assertEquals(listOf(200, 409), statuses.sorted())`; `:319`, `:323-324` | Covered |
| 13 | Levels per player, cascade on delete | isolation, cascade | `adapter/web/TalentControllerIT.kt:335`, `:340`; `adapter/repository/TalentRepositoryIT.kt:39`, `:117` | Covered |

### AD-017 additions (backend)

| Criterion (AD-017) | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| A grade is locked until the grade before is at level 10 | 409 `TALENT_LOCKED`; opens at exactly 10 | `adapter/web/TalentControllerIT.kt:140` `upgrade("COMBO_G2", 0).statusCode(409).body("code", equalTo("TALENT_LOCKED"))`; `domain/TalentsTest.kt:79` 9 -> `false`, `:80` 10 -> `true`, `:87` `assertFailsWith<TalentLockedException>` | Covered |
| Grade N costs N points a level, gives N x the grade 1 value | cost 2 / 3; value x2 / x3 | `adapter/web/TalentControllerIT.kt:98`, `:146`, `:149`; `domain/TalentsTest.kt:64`, `:66`, `:97`, `:101` | Covered |
| `POST /talents/reset` takes every level back and keeps the earned points | levels 0, `earned` kept, `available` = earned | `adapter/web/TalentControllerIT.kt:128-132` `statusCode(200)`, `talents.level equalTo(List(30) { 0 })`, `points.earned equalTo(3)`, `points.spent equalTo(0)`, `points.available equalTo(3)`; `service/TalentServiceTest.kt:156-158` `assertEquals(TalentPoints(5, 0), reset.points(rules))`; `:170` other player keeps level 3 | Covered (status 200 and body not stated by AD-017: spec-precision note) |
| A phase pays 0 points | 0 / 2 / 5 | `domain/TalentsTest.kt:115-117` | Covered |

### P1: Talent effects in combat (game)

| # | Criterion | Spec-defined outcome (source) | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | `CLICK_DAMAGE` level 5 adds to the click percent sum | +25 % (AD-017) | `src/domain/talents/talents.test.js:56` `toEqual({ clickDamageFlat: 0, clickDamagePct: 25, critChance: 4, critDamagePct: 30 })`; `e2e/talents.spec.js:56` `toBeCloseTo(1.25 * 0.8, 5)` | Covered |
| 2 | `CRIT_CHANCE` 4: +4 points, cap 100 | +4, cap 100 | `src/adapters/phaser/ClickerGame.test.js:3098` `toBe('2')`, `:3102` `toBe('1')`; `src/domain/combat/leaderAttacker.test.js:64`, `:85` | Covered |
| 3 | `CRIT_DAMAGE` 6: +0.3 multiplier | 2.3 | `src/adapters/phaser/ClickerGame.test.js:3111` `toBeCloseTo(1000 - 2.3, 10)`; `src/domain/combat/leaderAttacker.test.js:65` | Covered |
| 4 | `PHYSICAL_BREAK` 3: def -3, floor 0 | 10 -> 7 | `src/domain/talents/talents.test.js:81` `toEqual(monster(7, 10, 10))`; `:93` `toEqual(monster(0, 0, 0))` | Covered |
| 5 | `MAGICAL_BREAK` 3 | 10 -> 7 | `src/domain/talents/talents.test.js:85` `toEqual(monster(10, 7, 10))`; `src/domain/skills/skillCombat.test.js:175`, `:186` | Covered |
| 6 | `CRIT_RESIST_BREAK` 8: crit res -8, floor 0 | 20 -> 12 | `src/domain/talents/talents.test.js:89` `toEqual(monster(10, 10, 12))`; `src/adapters/phaser/ClickerGame.test.js:3127` `toContain('Crit res 12%')` | Covered |
| 7 | Miniboss + `MINIBOSS_TIME` 5: +10 s | 40 s | `src/domain/talents/talents.test.js:111` `toBe(10_000)`; `src/adapters/phaser/ClickerGame.test.js:3144` `toBe(40_000)`; `e2e/talents.spec.js:62` `/Time: (40\|39)/` | Covered |
| 8 | Chapter boss + `BOSS_TIME` 4: +12 s | 72 s | `src/domain/talents/talents.test.js:115` `toBe(12_000)`; `src/adapters/phaser/ClickerGame.test.js:3152` `toBe(72_000)` | Covered |
| 9 | Neither time talent adds to the other encounter | 0 | `src/domain/talents/talents.test.js:123-124` `toBe(0)`; `src/adapters/phaser/ClickerGame.test.js:3145`, `:3153` | Covered |
| 10 | Base 100 vs FIRE, phys def 20, `PHYSICAL_BREAK` 5: 85 | 85 | `src/domain/skills/skillCombat.test.js:155` `.damage).toBe(85)`; `src/adapters/phaser/ClickerGame.test.js:3119` `toBeCloseTo(1000 - 0.85, 10)`; `e2e/talents.spec.js:39` | Covered |
| 11 | Def 10, `PHYSICAL_BREAK` 4, Brado: def 0 | full damage | `src/domain/skills/skillCombat.test.js:205` `.damage).toBe(100)` | Covered |
| 12 | Talents not loaded: no effect | 0.8 vs def 20 | `src/adapters/phaser/ClickerGame.test.js:3182` `toBeCloseTo(1000 - 0.8, 10)`, `:3195` `toBeCloseTo(0.85, 10)` after the retry | Covered |
| AD-017 | The game adds the values of every grade | sum of grades | `src/domain/talents/talents.test.js:29` `toBe(25)`; `:30` `toMatchObject({ clickDamageFlat: 25, clickDamagePct: 50 })` | Covered |

### P2: Talentos screen

| # | Criterion | Spec-defined outcome (source) | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | HUD `Talentos` pauses and opens the window with the branch columns | four columns incl. `Combo` (TP) | `src/adapters/phaser/HeroUi.test.js:421` `toBe('Talentos')`; `:423` `toEqual([ 'Tempo', 'Quebra de defesa', 'Poder do clique', 'Combo' ])`; `e2e/talents.spec.js:73` | Covered |
| 2 | Card: label, `Nível l/max`, `Efeito`, `Melhorar (<cost>)` | `Melhorar (1 ponto)`; grade 2 `Melhorar (2 pontos)` | `src/adapters/phaser/views/talentsView.test.js:104-106`; `:124-126` `toBe('Melhorar (1 ponto)')`; `:59` `toBe('Melhorar (2 pontos)')`; `e2e/talents.spec.js:181` | Covered |
| 3 | `Melhorar` at level 0: `fromLevel` 0, `Nível 1/10`, new balance | `Pontos de talento: 0` (TP) | `src/adapters/phaser/HeroUi.test.js:435` `toHaveBeenCalledWith('COMBO', 0)`; `:436` `Nível 1/10`; `:438` `Pontos de talento: 0`; `e2e/talents.spec.js:80-82` | Covered |
| 4 | Button disabled while short | disabled at 0 points whatever the wallet (TP) | `src/adapters/phaser/HeroUi.test.js:447` (wallet 1 000 000, every button `disabled toBe(true)`); `src/adapters/phaser/views/talentsView.test.js:148`; `e2e/talents.spec.js:96-98` | Covered |
| 5 | Level 10: `Nível máximo`, no button | same | `src/adapters/phaser/views/talentsView.test.js:160-161`; `e2e/talents.spec.js:106-108` | Covered |
| 6 | 409 short: message, reload | `Pontos de talento insuficientes`, reload (TP) | `src/adapters/phaser/HeroUi.test.js:475`; `:477-478` | Covered |
| 7 | Other failure | `Não foi possível melhorar o talento.` (TP: reload only after a 409) | `src/adapters/phaser/HeroUi.test.js:490-491`; `:500-501` | Covered |
| 8 | Every `Melhorar` disabled while a request runs | all disabled | `src/adapters/phaser/HeroUi.test.js:458`; `src/adapters/phaser/views/talentsView.test.js:154` | Covered |
| 9 | Tree cannot load: `Talentos indisponíveis`, fight playable | text + fight | `src/adapters/phaser/HeroUi.test.js:523` `toBe('Talentos indisponíveis')`; `src/adapters/phaser/ClickerGame.test.js:3182` | Covered |
| 10 | Upgraded level used on the next click **and the next encounter** | live value on both | next click: `src/adapters/phaser/ClickerGame.test.js:3268` `toHaveBeenCalledWith('CLICK_DAMAGE', 0)`, `:3269` `toBeCloseTo(1000 - 1.03, 10)`; `e2e/talents.spec.js:88` `toBeCloseTo(1.05 * 0.8, 5)`. Next encounter: `src/adapters/phaser/ClickerGame.test.js:3169` `limitMs toBe(30_000)` before, `:3172` upgrade `MINIBOSS_TIME` 0 -> 5, `:3175` `expect(ctx.scene.countdown.limitMs).toBe(40_000)` after (30 s + AC7's +10 s). Kills G6 and G9 | Covered (gap of iteration 2 closed) |
| AD-017 | `Reiniciar pontos` takes every level back and shows the points again | levels 0, points = earned | `e2e/talents.spec.js:200-201` `Nível 0/10`, `Pontos de talento: 2`; `src/application/talents/talentCollection.test.js:25`; `src/adapters/phaser/views/talentsView.test.js:31-33` | Covered |
| AD-017 | A locked grade cannot be bought | no button | `src/adapters/phaser/views/talentsView.test.js:66-67` lock text + `toBeNull()`; `e2e/talents.spec.js:180` | Covered (lock text not in a spec: spec-precision note) |

### Edge cases

- [x] Upgrade while the kill wallet sync is in flight: superseded, the upgrade carries no wallet (TP spend AC5); `src/adapters/phaser/ClickerGame.test.js:3270` `expect(ctx.scene.wallet.display()).toEqual(walletBefore)`.
- [x] 12 885 copper at level 8 enables the button: superseded (1 point); `src/adapters/phaser/views/talentsView.test.js:147`.
- [x] Level 10 effect reads `+50%` for `CLICK_DAMAGE` (AD-017): `src/adapters/phaser/views/talentsView.test.js:162` `toBe('Efeito: +50%')`; `e2e/talents.spec.js:107`; `src/domain/talents/talents.test.js:159`; backend `adapter/web/TalentControllerIT.kt:242`.

### Spec-precision notes (not blocking, judged again)

- AD-017 does not state the status or body of `POST /talents/reset`; the tests pin 200 with `{ talents, points }` (`TalentControllerIT.kt:128-132`). The behavior AD-017 does state (levels back to 0, earned points kept) is asserted on value, and the answer mirrors the upgrade answer the spec does define, so the gap is the wording, not the test. Still open; add one line to AD-017 when it is next touched.
- AD-017 gives no screen text for grades; the tests pin `Grau 1` / `Grau 2` (`talentsView.test.js:53`), `Bloqueado: chegue ao nível 10 do Grau 1` (`:66`) and the `Reiniciar pontos` disabled rule (`:37-39`). These are exact texts with no written source (lesson L-010). Unchanged; not blocking because the behavior they show (locked grade, no button; reset only with something spent) follows from AD-017.

**Status**: 38 of 38 criteria (spec ACs, AD-017 items, edge cases) matched their spec-defined outcome; 2 spec-precision notes (unchanged, not blocking).

---

## Discrimination Sensor

Expanded tier (server-authoritative economy code; ≥ 6 mutants across backend and game asked). All mutants ran in a second worktree `scratchpad/tal-sensor3` (`git worktree add --detach ... HEAD` at `eadfdc6`), `game/node_modules` linked by a junction, one mutant at a time, applied by an exact single-match string replace (a mutation with 0 or 2+ matches aborts) and restored from a byte copy. Game runs: `npx vitest run src/domain/talents src/domain/combat src/domain/skills src/application/talents src/adapters/phaser/views/talentsView.test.js src/adapters/phaser/HeroUi.test.js src/adapters/phaser/ClickerGame.test.js` (677 tests; the 3 farm-mode baseline failures were subtracted). Backend runs: `./gradlew test --tests '*Talent*'` (74 tests, Testcontainers).

| # | File:line | Mutation | Killed? | Killing tests |
| --- | --- | --- | --- | --- |
| G6 (re-run) | `game/src/adapters/phaser/ClickerGame.js:687` | time talents frozen at the first boss encounter after load: `talentTimeBonusMs(this.talents.talents(), encounter)` -> `talentTimeBonusMs((this.frozenTalents ??= (this.talents.loaded ? this.talents.talents() : undefined)) ?? this.talents.talents(), encounter)` | Killed (1 beyond baseline) | `ClickerGame.test.js:3166` "adds a time talent upgraded during the fight to the limit of the next encounter" |
| G7 | `game/src/domain/talents/talents.js` `talentTimeBonusMs` | farm fight loses the replayed boss's time talent: `encounter.kind === FARM ? encounter.boss.kind : encounter.kind` -> `encounter.kind` | Killed (1) | `talents.test.js:127` "gives a farm fight the bonus of the boss it replays" |
| G8 | `game/src/adapters/phaser/ClickerGame.js:112` | break talents not applied to the stats the fight uses: `statsOf: (monster) => monsterAfterBreak(monster.stats, this.talents.talents())` -> `monster.stats` | Killed (3) | `ClickerGame.test.js` "lowers the physical defense by 5 points with PHYSICAL_BREAK 5 ...", "lowers the critical resistance by 8 points ...", "fights with no talent effect while they cannot be loaded ..." |
| G9 | `game/src/application/talents/talentCollection.js:69` | upgrade answer not adopted: `adopt(await gateway.upgrade(talentId, fromLevel))` -> `await gateway.upgrade(talentId, fromLevel)` | Killed (6) | `talentCollection.test.js:89`; `HeroUi.test.js` "sends the upgrade with fromLevel 0, shows Nível 1/10 ..."; `ClickerGame.test.js:3166` (next encounter), "uses an upgraded talent on the next click ...", "uses the cap of an upgraded COMBO on the next click ..." |
| G10 | `game/src/adapters/phaser/ClickerGame.js:683` | enemy tags show raw defenses: `showEnemyStats(monsterAfterBreak(encounter.stats, ...))` -> `showEnemyStats(encounter.stats)` | Killed (1) | `ClickerGame.test.js:3122` "shows the lowered defenses on the enemy tags and keeps the stats of the monster itself" |
| G11 | `game/src/domain/talents/talents.js` `monsterAfterBreak` | crit resistance floor removed: `Math.max(0, stats.critResistance - ...)` -> `stats.critResistance - ...` | Killed (1) | `talents.test.js:92` "never goes below 0" |
| B7 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Talents.kt:212` | exact balance refused: `available < cost` -> `available <= cost` | Killed (8 of 74) | `TalentControllerIT` "the second level also costs 1 point", "an upgrade leaves the wallet untouched", "two upgrades of different talents with one point accept exactly one"; `TalentsTest` "at level 9 the next cost is 1 ..."; `TalentServiceTest` "the points run out after as many levels as were earned, across talents" |
| B8 | `backend/.../domain/Talents.kt:175` | `nextCost` not null at the top level: `level(definition.id) < definition.maxLevel` -> `<=` | Killed (3) | `TalentControllerIT` "a talent at level 10 is 409 TALENT_MAX_LEVEL, spends nothing and has a null next cost", "at level 10 the combo talent is worth 50"; `TalentsTest` "a talent at level 10 refuses the upgrade as max level and has no next cost" |
| B9 | `backend/.../service/TalentService.kt:47` | bad `fromLevel` not rejected as 400: `definition.requireSeenLevel(fromLevel)` removed | Killed (2) | `TalentControllerIT` "a missing, negative, too high or non integer fromLevel is 400 INVALID_TALENT_REQUEST"; `TalentServiceTest` "a level the client could not have seen is a bad request" |

Iteration 2's B1-B6 and G1-G5 (grade lock, early unlock, grade cost, reset delete, grade value, phase 0, grade sum, reset button rule, locked view, reset adopt, grade price) were all killed on `91d5f21`; `eadfdc6` changed no production code and removed no test, so they were not re-run.

**Sensor depth**: expanded (9 mutants this iteration: 3 backend, 6 game; G6 re-run plus 8 fresh)
**Outcome**: 9 of 9 killed this iteration; across iterations 2 and 3, 20 of 21 distinct mutants killed on the code as it stands and the one survivor (G6) is now killed.
**Isolation**: `git status --porcelain` of the verified worktree was empty before the sensor and empty after it; the scratch worktree reported an empty porcelain before removal, was unregistered with `git worktree remove --force` and its leftover directory (long build paths) deleted; the junction was removed without touching the real `game/node_modules`.

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | OK: pure domain rules (`Talents.kt`, `talents.js`), one click-power builder (`leaderAttacker`, AD-012) |
| Surgical changes | OK: `eadfdc6` adds one test in the right `describe`, no production change |
| No scope creep | OK: grades, reset, flat damage and phase 0 recorded in AD-017 |
| Matches patterns | OK: the new test uses the same `createScene` / `tree()` / `talentGateway` helpers as its neighbours |
| Spec-anchored outcome check | OK: screen AC10 now asserted on value (40 000 ms = AC7's 30 s + 10 s) |
| Per-layer Coverage Expectation | OK: domain 1:1, service with in-memory ports incl. reset, every route happy + each error code + both races + reset + 401, e2e buys a level, a grade 2 level and resets |
| Every test maps to a spec requirement | Mostly: grade texts and reset disabled rule have no written outcome (spec-precision notes). Stale titles, unchanged and cosmetic: `ClickerGame.test.js:3085` and `leaderAttacker.test.js:57` still say `CLICK_DAMAGE 5 (+15 %)` with a hand-made value-15 fixture (`ClickerGame.test.js:3077`); `talentsView.test.js:79` says `2, 3, 3 and 1` but asserts `[ 2, 3, 4, 1 ]` (`:82`). The asserted values are right |
| Documented guidelines followed | `backend/docs/adr/0002-testing.md`, `game/vitest.config.js`, `game/playwright.config.js`, `CLAUDE.md` |

---

## Gate Check

- **Backend**: `cd backend && ./gradlew test` (Testcontainers, no overrides) - BUILD SUCCESSFUL in 14m 15s, exit 0; **832 tests, 0 failed, 0 errors, 0 skipped** (counted from `build/test-results/test/*.xml`). Talent classes: `TalentsTest` 25, `TalentServiceTest` 17, `TalentControllerIT` 17, `TalentRepositoryIT` 13, `TalentPointsMigrationIT` 2, all green.
- **Game unit**: `npm install` (no lock file), `npx vitest run` - **1249 tests, 1245 passed, 4 failed** (65 files). 3 are the known farm-mode tests (below). The fourth, `src/architecture.test.js` "every layer imports only inward", timed out at 5 000 ms while the backend gate ran in parallel; re-run alone (`npx vitest run src/architecture.test.js`) it passed, 6 of 6. Load, not a defect.
- **Game e2e (feature)**: `npx playwright test --config <temp config> e2e/talents.spec.js`; the temporary config imported `./playwright.config.js` and set port 5199, `workers: 1`, `reuseExistingServer: false`; deleted after the run - **14 passed, 0 failed** (2.3 m).
- **Failures not caused by this feature**: `src/adapters/phaser/ClickerGame.test.js` > `ClickerGame farm mode` > "a win refused as too fast pays nothing but keeps the farm going", "a win lost to a network failure keeps the loop going", "a refused win ends the farm without a notice and reloads the farm state"; known since `9e11bf9 fix(farm)`, no talent code involved. Not counted.
- **Test count**: game unit 1248 -> 1249 (+1, the fix test); backend 832 and talents e2e 14 unchanged. No test deleted or weakened.

---

## Fix Plans

None blocking. Optional, for the orchestrator or a later touch:

- Bookkeeping at closure: `tasks.md` `Status: Done`, TAL-01..08 to Verified.
- State the reset answer (200, `{ talents, points }`) and the grade screen texts in AD-017 or the talents spec.
- Retitle `ClickerGame.test.js:3085`, `leaderAttacker.test.js:57` and `talentsView.test.js:79` to the current catalog (cosmetic).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| TAL-01 | Verified (vs AD-017) | Verified |
| TAL-02 | Verified | Verified |
| TAL-03 | Verified | Verified |
| TAL-04 | Verified | Verified |
| TAL-05 | Verified (vs AD-017) | Verified |
| TAL-06 | Verified | Verified |
| TAL-07 | Verified | Verified |
| TAL-08 | Needs Fix (screen AC10 next encounter) | Verified |

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 38/38 matched their (superseding) outcome; 2 spec-precision notes (reset answer, grade texts), not blocking
**Sensor**: 9 injected this iteration, 9 killed (G6 now killed)
**Gate**: backend 832/832; game unit 1245/1249 (3 farm-mode failures from `9e11bf9` plus 1 load timeout that passes alone); talents e2e 14/14

**What works**: the backend owns levels, points, grades, reset and every refusal; the game adds all grades, applies every combat effect, shows the screen, and an upgrade reaches both the next click and the next encounter.

**Issues found**: none blocking; notes above.

**Next steps**: orchestrator closes the bookkeeping and runs the release report and deploy steps.
