# Hero Ascension Validation

**Date**: 2026-11-15
**Spec**: `.specs/features/hero-ascension/spec.md`
**Design**: `.specs/features/hero-ascension/design.md`
**Diff range**: `ce8653e^..5df3635` scoped to the feature (20 commits: `ce8653e`, `491dddc` specs; `cf6d0df`..`545bc92` T1 to T17; `67dfbf2` T9; `5df3635` e2e un-fixme). Other features interleaved in the range are excluded.
**Verifier**: independent sub-agent (author ≠ verifier). Discrimination sensor run in a scratch `git worktree` at `5df3635`, removed afterwards.

## Validation: FAIL

All 17 tasks are done. The feature's gates are green (backend 933 tests, game unit 1585 tests, e2e 15/15 for the feature and 300 in the suite after isolated reruns of 5 timing flakes); the only red gate is ktlint in campaign-chapters code, outside this diff. All 48 acceptance criteria have a test with a `file:line` citation, and 41 assert the exact spec outcome. The feature is not done: two sensor mutants survived (M9 gold chip weight, M10 level 3 pill colour, both ASC-08), two ASC-06 criteria are pinned only by rounded text (G3), five player-visible criteria lack the e2e scenario the T16 contract requires (G4), and two minor gaps remain (G5, G6). Fix tasks for G1 to G6, then re-verify (iteration 1 of 3).

---

## Task Completion

| Task | Status | Commit | Notes |
| ---- | ------ | ------ | ----- |
| T1 store copies of 0 to 9 stars, fusion capped at 2 | ✅ Done | `cf6d0df` | - |
| T2 level of every skill | ✅ Done | `a770674` | - |
| T3 open the fusions of 3 to 8 stars | ✅ Done | `de76f5c` | Deploy step A (`a770674`) is an ancestor of the active commit `b59c135` in `.deploy-state`; the commit body says so |
| T4 game star ranges up to 9 | ✅ Done | `9bea57c` | - |
| T5 skill level rules | ✅ Done | `eb72d04` | - |
| T6 effect factors in damage | ✅ Done | `92589f8` | - |
| T7 skills used at a level | ✅ Done | `f9da74a` | - |
| T8 star bonus rows 4 to 9, star power text | ✅ Done | `1fa1982` | - |
| T9 scene uses the payload level | ✅ Done | `67dfbf2` | Step 0 precondition: `git status` of `ClickerGame*.js` was clean |
| T10 skill rows, tiers, star power on hero screens | ✅ Done | `958be55` | - |
| T11 bag entries of 4 to 9 stars | ✅ Done | `21554cd` | - |
| T12 fusion rows and result past 3 stars | ✅ Done | `091b07c` | - |
| T13 level badge on the skill bar | ✅ Done | `9779d99` | - |
| T14 style of tiers, levels, star power | ✅ Done | `540fc00` | Its rules are the source of the survivors M9 and M10 below |
| T15 fake backend up to 9 stars | ✅ Done | `2709abe` | Regression suites pass |
| T16 e2e of hero ascension | ✅ Done | `82eea42`, `5df3635` | 15 scenarios; 15/15 pass (see Gate) |
| T17 visual review | ✅ Done | `545bc92` | `ui-review.html` verdict APROVADO |

---

## Spec-Anchored Acceptance Criteria

Paths: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `CG` = `game/src/adapters/phaser`, `GD` = `game/src/domain`, `E2E` = `game/e2e`. Line numbers are at `5df3635`.

### P1 Fuse past 3 stars on the backend (ASC-01, ASC-02)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Store copies of 0 to 9 stars; stars = highest | stars 9 with 2 copies of 9★ | `BT/domain/PlayerCardsTest.kt:194-199` - `assertEquals(9, cards.starsOf("kael"))`; `BT/adapter/repository/PlayerCardsRepositoryIT.kt:91-99` - `assertEquals(9, ...starsOf("kael"))` after a save and read back | ✅ PASS |
| 2 | `GET /heroes` carries copies `"0"` to `"9"` | map 0..9 with 1 copy at 9 | `BT/service/HeroServiceTest.kt:75-84` - `assertEquals(mapOf(0 to 1, ..., 9 to 1), kael.copies)`; `BT/adapter/web/HeroControllerIT.kt:77` - `body("heroes[2].copies.9", equalTo(0))` | ✅ PASS |
| 3 | Skill `level` per slot in `GET /heroes` and fusion | `[2, 1, 1]` at 4★, `[2, 2, 2]` at 6★, `[3, 3, 3]` at 9★ | `BT/domain/HeroViewTest.kt:8-24` (locked 0, 1 to 3★ 1), `:26-41` (4 to 9★ vectors), `:43` (5★ view `[2, 2, 1]`); `BT/adapter/web/HeroControllerIT.kt:95-99` - `skills.level equalTo(listOf(2, 1, 1))`, `:137` - fuse `[1, 0, 0]` | ✅ PASS |
| 4 | Fusion of 3 to 8 stars: 200 with the updated hero | next stars +1 copy, 3 removed | `BT/domain/PlayerCardsTest.kt:122-130` (loop over 3..8, `copies == mapOf(stars+1 to 1)`); `BT/adapter/web/HeroControllerIT.kt:252-264` (3★ to 4★, 200), `:266-278` (8★ to 9★, 200) | ✅ PASS |
| 5 | Three 3★ fuse: stars 4, `copies."4"` 1, levels `[2, 1, 1]` | as stated | `BT/adapter/web/HeroControllerIT.kt:253-263`; `BT/service/HeroServiceTest.kt:147-153` | ✅ PASS |
| 6 | Three 8★ fuse: stars 9, `copies."9"` 1, all unlocked, levels `[3, 3, 3]` | as stated | `BT/adapter/web/HeroControllerIT.kt:266-277` | ✅ PASS |
| 7 | 4 copies of 3★, fuse once: 1 of 3★ and 1 of 4★ | `{3★:1, 4★:1}` | `BT/domain/PlayerCardsTest.kt:141-145` | ✅ PASS |
| 8 | `stars` ≥ 9, negative, missing or not an integer: 400 `INVALID_FUSION`, nothing changes | 400 and unchanged bag | 400: `BT/adapter/web/HeroControllerIT.kt:150-157` (`{}`, -1, 9, 10, `"0"`); unchanged bag at service level: `BT/service/HeroServiceTest.kt:137` and `BT/domain/PlayerCardsTest.kt:108-112`. The HTTP tests do not re-read the bag | ⚠️ Minor gap G6 |
| 9 | Fewer than 3 copies at 3 to 8★: 409 `NOT_ENOUGH_CARDS`, nothing changes | 409, 2 copies kept | `BT/domain/PlayerCardsTest.kt:148-151`; `BT/adapter/web/HeroControllerIT.kt:280-288` (409 and `copies == 2`) | ✅ PASS |
| 10 | Two simultaneous fusions of the same 3★ cards: one 200, one 409, 1 copy of 4★ | `[200, 409]`, 1 copy of 4★, no 3★ row | `BT/adapter/web/HeroControllerIT.kt:290-312` - `assertEquals(listOf(200, 409), statuses)`, `copies == 1`, `count { stars == 3 } == 0` | ✅ PASS |
| 11 | Fusion of 3 to 8★ leaves wallet, leader and other copies unchanged | wallet 0/9/0, leader kael, Lyra blank copies 2 | `BT/adapter/web/HeroControllerIT.kt:314-334` | ✅ PASS |
| 12 | Account reset keeps a 9★ hero at 9★ with `[3, 3, 3]` | stars 9, levels `[3, 3, 3]` | `BT/adapter/web/AccountResetControllerIT.kt:281-295` | ✅ PASS |

### P1 Skill levels in combat (ASC-03, ASC-04, ASC-05)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Every scaled value times `1 + 0.25 (L - 1)` | factor 1, 1.25, 1.5 | `GD/skills/skillLevel.test.js:5-12` (`levelFactor`); `GD/skills/skillDamage.test.js:137-182`; `GD/skills/skillCombat.test.js:677-820` | ✅ PASS |
| 2 | Kael 4★, Corte Dimensional L2: 31.875, shown 31.9 | health 968.125, text `31.9` | `CG/ClickerGame.test.js:4797-4805` - `toBeCloseTo(968.125, 9)`, `texts.at(-1).text === '31.9'`; `E2E/heroAscension.spec.js:82-88` - `toBeCloseTo(968.125, 5)` | ✅ PASS |
| 3 | Kael 4★, Investida L1: 6.8 | health 993.2 | `CG/ClickerGame.test.js:4806-4813` - `toBeCloseTo(993.2, 9)` | ✅ PASS |
| 4 | Kael 9★, Corte L3: 72 | health 928 | `CG/ClickerGame.test.js:4814-4821` - `toBeCloseTo(928, 9)`; `E2E/heroAscension.spec.js:90-96` - `toBeCloseTo(928, 5)` | ✅ PASS |
| 5 | Hit, aimed shot and ticks use the Level L column | Corte 18.75 / 22.5; Tiro 75; Chuva 31.25 / 37.5; Luz 10 / 16.2; Golpe 9 and 2.25 ticks; Tempestade 3; Veneno 1.25 | `GD/skills/skillCombat.test.js:677-686` (Corte), `:696` (Flecha 3.75), `:700` (Tiro 75), `:710` (Chuva), `:715` (Luz), `:720` (Golpe), `:733` (Tempestade), `:745` (Veneno) | ✅ PASS |
| 6 | Ventos, Bênção, Fumaça click, physical and crit values at L | Ventos L2 1.625; Bênção L3 1.99375; Fumaça L3 +22.5 crit | `GD/skills/skillCombat.test.js:757`, `:770`, `:779`; `GD/skills/skillDamage.test.js:144-168` | ✅ PASS |
| 7 | Brado and Prisão at L | Brado L3 0.95 (L1 0.8); Prisão L2 x1.3125 | `GD/skills/skillCombat.test.js:795`, `:811`; `GD/skills/skillDamage.test.js:169-182` | ✅ PASS |
| 8 | Carrilhão adds 5000 / 6000 ms on a boss, nothing on a phase | 5000, 6000, 0 | `GD/skills/skillCombat.test.js:820-825` | ✅ PASS |
| 9 | Cooldown, duration, cast, Root, ticks, stacks, +30 pierce, DARKNESS unchanged | cooldown 20 s, Ventos 12 s, Prisão countdown 3000, 6 ticks | `GD/skills/skillCombat.test.js:830-853`; armor pierce `:682` (12.1875); DARKNESS `:715` | ✅ PASS |
| 10 | Effect keeps the level it was cast with | Ventos L1 still 1.5 click after Flecha L3 | `GD/skills/skillCombat.test.js:864-872`; restart takes the restart's level `:854-862` | ✅ PASS |
| 11 | Lyra 5★ Ventos L1, fused to 6★, click 3.45 | health `1000 - 3.45` | `CG/ClickerGame.test.js:4872-4882` - `toBeCloseTo(1000 - 3.45, 9)` | ✅ PASS |
| 12 | Unlocked skill without `level` is level 1 | level 1; Corte 15 without level | `GD/skills/skillLevel.test.js:26-33`; `CG/ClickerGame.test.js:4822-4829` (974.5) | ✅ PASS |
| 13 | 0 to 3★: exactly today's damage | Corte 15 at level 1 | `GD/skills/skillCombat.test.js:826-829`; existing `skillCombat` and `skillDamage` cases pass unchanged | ✅ PASS |

### P1 Star power of the leader (ASC-06)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Star Bonus row 4 to 9 added to the click attacker | rows 4 to 9 | `GD/combat/leaderAttacker.test.js:88` (`it.each`, 4 to 9); `GD/heroes/starBonus.test.js:33` (`it.each` rows 4 to 9) | ✅ PASS |
| 2 | Clicks 1.7, 2.0, 2.3, 2.6, 2.9, 3.2 for 4 to 9★ | as stated | `GD/combat/leaderAttacker.test.js:88`; `CG/ClickerGame.test.js:4830-4843` - `toEqual(['1.7', '2', '2.3', '2.6', '2.9', '3.2'])`; `E2E/heroAscension.spec.js:98-104` - `toBeCloseTo(996.8, 5)` | ✅ PASS |
| 3 | 4★ critical at roll 0.44 deals 4.675 (shown 4.7); roll 0.45 normal 1.7 | health `1000 - 4.675`, `1000 - 1.7` | `CG/ClickerGame.test.js:4844-4857` asserts only the displayed text `'4.7'` (line 4849) and `'1.7'` (4855) | ❌ GAP: spec-precision (G3) |
| 4 | 9★ critical at roll 0.69 deals 12.8; roll 0.70 normal 3.2 | health `1000 - 12.8`, `1000 - 3.2` | `CG/ClickerGame.test.js:4858-4871` asserts only `'12.8'` (4863) and `'3.2'` (4869) | ❌ GAP: spec-precision (G3) |
| 5 | Attribute panel 1.7 / 45% / x2.75 at 4★ and 3.2 / 70% / x4 at 9★ | as stated | `GD/equipment/leaderStats.test.js:104-118`; `E2E/heroAscension.spec.js:106-122` | ✅ PASS |
| 6 | Next click after a fusion uses the new row, no reload | 6★ click 3.45 without reload | `CG/ClickerGame.test.js:4872-4882` (unit); `E2E/heroAscension.spec.js:47-56` (scene marker kept after fusion) | ⚠️ e2e does not click after the fusion (G4) |

### P1 Fusão and Mochila past 3 stars (ASC-07)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Fusão lists every (hero, 0 to 8★) with 3+ copies | `Kael Raizférrea 3★ → 4★`, `3/3`, Fundir | `GD/heroes/heroes.test.js:118-133`; `CG/views/fusionView.test.js:79-100`; `E2E/heroAscension.spec.js:43-44`, `:63-64` | ✅ PASS |
| 2 | Result `Nova carta: <nome> <n+1>★ · <skill> no nível <L>` at 4 to 9★ | `Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2` | `CG/views/fusionView.test.js:61-67`; `CG/HeroUi.test.js:270-291` (4★ `Skill 1 no nível 2`, 6★ `Skill 3 no nível 2`); `E2E/heroAscension.spec.js:50`, `:67` (9★ `Brado Aterrador no nível 3`) | ✅ PASS |
| 3 | 0 to 2 fusions read `Nova carta: <nome> <n+1>★` | `Nova carta: Hero kael 1★` | `CG/HeroUi.test.js:235`; `CG/views/fusionView.test.js:68-72` (3★ result has no skill suffix) | ✅ PASS (unit only) |
| 4 | Mochila lists 4 to 9★ as `<nome> <n>★` and `x<copies>` | `Hero kael 4★`, `x1`; `Hero kael 9★`, `x2` | `GD/heroes/heroes.test.js:140-146`; `CG/views/bagView.test.js:87-93`; `E2E/heroAscension.spec.js:180-181` | ✅ PASS |
| 5 | Bag entry 3 to 8★: `Para fundir: x/3`, button at 3+ | `Para fundir: 3/3`, `Ir para a fusão` | `CG/views/bagView.test.js:94-107`; `E2E/heroAscension.spec.js:193-196` | ✅ PASS |
| 6 | Bag entry 9★: `Estrela máxima: não pode ser fundida`, no button | as stated | `CG/views/bagView.test.js:75-86`; `E2E/heroAscension.spec.js:184-185` | ✅ PASS |
| 7 | Failed fusion: `Não foi possível fundir as cartas.`, screen open, row kept | error line, `3/3`, no result | `CG/HeroUi.test.js:292-305`; `E2E/heroAscension.spec.js:199-211` | ✅ PASS |
| 8 | Skill bar redraws without reload, cooldown kept | `cooling`, `15s` after a 4★ fusion | `CG/ClickerGame.test.js:4883-4893`; `CG/HeroUi.test.js:257-269` (`Nv. 2`, list called once); `E2E/heroAscension.spec.js:47-56` | ✅ PASS |

### P2 Stars, levels and star power on screen (ASC-08)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | 4 to 6★ owned: class `is-ascended`, colour `#7a3fa0`, weight 800 | colour `rgb(122, 63, 160)`, weight 800 | class: `CG/views/catalogView.test.js:134-151`; colour: `E2E/heroAscension.spec.js:131-132`. Weight 800 is asserted nowhere | ❌ GAP: weight, survivor M9 (G1) |
| 2 | 7 to 9★: class `is-exalted`, gold chip `#d9a521`, text `#201e1d`, weight 800 | chip background, text, weight 800 | class: `CG/views/catalogView.test.js:134-151`; background and text: `E2E/heroAscension.spec.js:154-156`. Weight, radius and padding are not asserted, survivor M9 | ❌ GAP: weight (G1) |
| 3 | Unlocked level 1 skill row: `Nível 1`, `data-level="1"` | as stated | `CG/views/catalogView.test.js:109-115`; `E2E/heroAscension.spec.js:170` | ✅ PASS |
| 4 | Level 2 and 3 rows: `Nível 2 · +25% de poder` and `Nível 3 · +50% de poder`; level 3 pill gold | texts and gold pill | texts: `CG/views/catalogView.test.js:116-125`; `E2E/heroAscension.spec.js:136-137`, `:160-162`. Gold pill background is asserted nowhere, survivor M10 | ❌ GAP: pill colour (G2) |
| 5 | Locked skill row has no `.skill-level` | none | `CG/views/catalogView.test.js:130-133`; `E2E/heroAscension.spec.js:171-172` | ✅ PASS |
| 6 | Skill bar badge `Nv. <L>` with testid and `data-level`; purple at 2, gold at 3; none at 1 or locked; top right | as stated | `CG/views/skillBar.test.js:58-88`; `E2E/heroAscension.spec.js:52-55`, `:69-72`, `:142-144`, `:213-221` (corner). Purple colour at level 2 is asserted nowhere | ⚠️ minor gap (G5) |
| 7 | Owned hero with 1 to 9★: `Poder das estrelas: ...` in the order click, crit chance, crit damage | as stated | `GD/heroes/starBonus.test.js:39-47` (`reads every star count`); `CG/views/catalogView.test.js:152-172`; `E2E/heroAscension.spec.js:139`, `:173` | ✅ PASS |
| 8 | 0★ or not owned: no `hero-star-power` | none | `CG/views/catalogView.test.js:173-180` | ✅ PASS (unit only) |
| 9 | 4★, 9★, 1★ texts | `+70%...`, `+220%...`, `+10% de dano de clique` | `CG/views/catalogView.test.js:152-172`; `GD/heroes/starBonus.test.js:39-47`; `E2E/heroAscension.spec.js:173` | ✅ PASS |

### Edge cases (spec, Edge Cases section)

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| 1 copy of 9★ and 3 blank cards: blank fuses, hero stays 9★ | `BT/domain/PlayerCardsTest.kt:207-216` | ✅ PASS |
| Dropped blank card on a 9★ hero: stays 9★, `copies.0` 1 | `BT/domain/PlayerCardsTest.kt:218-224`; levels `[3, 3, 3]` at 9★ in `BT/domain/HeroViewTest.kt:26-41` | ✅ PASS |
| Fusion to 4★ while a skill cools: countdown continues from its seconds | `CG/ClickerGame.test.js:4883-4893` (`15s`) | ✅ PASS |
| Skill of a 4★ hero in an effect tag tooltip carries the same `.skill-level` | `CG/views/skillTooltip.test.js:86` | ✅ PASS |
| `level` with `unlocked: false` is treated as locked (level 0) | `GD/skills/skillLevel.test.js:15-20`; `CG/views/catalogView.test.js:130-133` | ✅ PASS |

**Status**: 41 of 48 ACs pinned to the exact spec outcome. 7 are partial: ASC-06 AC3 and AC4 (rounded text, G3), ASC-08 AC1, AC2 and AC4 (sensor survivors, G1 and G2), ASC-08 AC6 (G5, minor), ASC-02 AC8 (G6, minor). ASC-06 AC6 is pinned by unit tests and lacks an e2e scenario (G4).

---

## Discrimination Sensor

Scratch: `git worktree` at `5df3635`, mutants applied one at a time with an exact-match assertion (each find text occurs once), the covering tests run, the file restored, then the worktree removed. Baselines were green before the mutants (`BASE-game` 592 tests, `BASE-e2e` 3 passed, `BASE-backend` BUILD SUCCESSFUL).

| # | File:line | Fault | Covering run | Killed? |
| - | --------- | ----- | ------------ | ------- |
| M1 | `game/src/domain/skills/skillCombat.js:193` | Skill hit percent not multiplied by the level factor | skillCombat.test.js: `Golpe Sangrento at level 3 lands 9` fails (`expected [ 6 ] to deeply equal [ 9 ]`) | ✅ Killed |
| M2 | `game/src/domain/skills/skillCombat.js:57` | A restarted effect keeps its first factor | skillCombat.test.js: `a restarted effect takes the factor of the restart` (`{ventos: 1.25}` vs `{ventos: 1.5}`) | ✅ Killed |
| M3 | `game/src/domain/skills/skillDamage.js:41` | Ventos click bonus ignores the level | skillDamage.test.js: `Ventos at factor 1.25 adds 62.5 % to a click` (1.5 vs 1.625) | ✅ Killed |
| M4 | `game/src/domain/heroes/starBonus.js:16` | 9★ critical chance 55 instead of 60 | starBonus.test.js: `adds the rows 4 to 9 of the spec: 9 stars`, `reads every star count` | ✅ Killed |
| M5 | `game/src/domain/heroes/heroes.js:49` | Gold tier from 8★ instead of 7★ | heroes.test.js: `starsClass is empty up to 3 stars, ...` | ✅ Killed |
| M6 | `game/src/adapters/phaser/ClickerGame.js:934` | Scene uses level 1 whatever the payload says | ClickerGame.test.js: `a 4 star Kael uses Corte Dimensional at level 2 for 31.875` (974.5 vs 968.125) | ✅ Killed |
| M7 | `game/src/adapters/phaser/views/fusionView.js:38` | Fusion result names a skill below 4★ | fusionView.test.js: `the result of a fusion to 1 to 3 stars reads as before` | ✅ Killed |
| M8 | `game/src/domain/skills/skillLevel.js:24` | Raised slot shifted by one star | skillLevel.test.js: `names the slot each star from 4 to 9 raised` | ✅ Killed |
| M9 | `game/public/style.css:2802` | Gold chip `.hero-stars.is-exalted` loses `font-weight: 800` | heroAscension.spec.js `5-star` and `8-star` (3 passed) | ❌ **Survived** (G1) |
| M10 | `game/public/style.css:2819` | Level 3 pill `.skill-level[data-level="3"]` background not gold | heroAscension.spec.js `8-star` and `9-star` (6 passed) | ❌ **Survived** (G2) |
| M11 | `backend/.../domain/PlayerCards.kt:45` | Fusion of 8★ refused (`0 until LAST_FUSIBLE_STARS`) | PlayerCardsTest + HeroServiceTest: 3 of 44 fail | ✅ Killed |
| M12 | `backend/.../domain/HeroView.kt:18` | Skill level grows every two stars | HeroViewTest + HeroServiceTest: 4 of 22 fail | ✅ Killed |
| M13 | `backend/.../domain/PlayerCards.kt:49` | Fusion leaves two cards of the next stars | PlayerCardsTest: 10 of 26 fail | ✅ Killed |

**Sensor depth**: targeted. 13 mutants on the critical paths of the feature: fusion rules (M11, M13), level rules (M8, M12), damage and effect factors (M1 to M3), star bonus (M4), tiers (M5), scene wiring (M6), result text (M7), and the two visual rules the spec pins (M9, M10).
**Result**: 11/13 killed, 2 survived. Survivors become fix tasks G1 and G2.

---

## Gate Check

- **Backend**: `cd backend && ./gradlew cleanTest test jacocoTestReport`: BUILD SUCCESSFUL. 84 suites, **933 tests, 0 failures, 0 errors, 0 skipped**.
- **Backend ktlint**: `./gradlew ktlintCheck` fails in `backend/src/test/.../domain/ChapterTest.kt:384` (4 `function-signature` violations). That file belongs to campaign-chapters and is outside this diff. The main source set passes.
- **Game unit**: `cd game && npm test`: **72 files, 1585 tests passed, 0 failed**.
- **E2E**: `cd game && npm run test:e2e`: 300 scenarios. First run 295 passed, 5 failed (timeouts, see below). Those 5 were rerun alone: **5/5 passed**. The hero ascension spec passed **15/15** in the full run and in an idle isolated run.
- **Test count delta** (declarations in the feature's diff): backend +24 `@Test`, game unit +99 `it`/`test` declarations and −4, e2e +15 scenarios. No `skip`, `fixme` or `@Disabled` in the feature's tests. The four removed game declarations are the 3-star and 4-star cases that the 3-star-to-9-star rules make wrong: the T4 and T8 renames (`stars 0 to 2, never 3`, `adds nothing for a star count the game does not know`), the T11 rename of the 3-star "no way to fusion" case, and the `keeps only ... 3 or more copies` rename that now includes 3 stars.
- **Test integrity**: no assertion of an existing test was weakened. The removed lines are renames and updates that move the 3-star cap to 8 or 9 stars, the deleted "cannot be fused" cases of T3, and the new `level`/`copies` keys of the fakes.

## Coverage

- **Backend (JaCoCo)**: whole project lines **99.10%** (2749/2774), branches **93.01%** (825/887). Feature files `PlayerCards.kt`, `HeroView.kt`, `HeroService.kt`, `HeroController.kt`: lines **100.00%** (147/147), branches **98.33%** (59/60).
- **Game unit (Vitest v8)**: whole project lines **97.95%** (2586/2640), branches **95.18%** (1205/1266). Feature files (14, `skillLevel`, `skillDamage`, `skillCombat`, `starBonus`, `heroes`, `fusionView`, `bagView`, `catalogView`, `skillBar`, `skillTooltip`, `HeroUi`, `ClickerGame`, `leaderAttacker`, `leaderStats`): lines **97.73%** (1121/1147), branches **92.88%** (561/604). `ClickerGame.js` alone 97.95% lines and 92.30% branches; `HeroUi.js` 95.28% and 82.81%.
- **E2E (istanbul, `npm run test:e2e:coverage`, whole suite)**: lines **92.27%** (2437/2641), statements 92.16%, functions 91.39%, branches 76.55%. This is a lower bound: a page reloaded inside a test loses what it counted before the reload. The run had 292 passed and 8 failed (see Failures Not Caused By The Feature).

---

## Edge Cases

- [x] 1 copy of 9★ plus blank cards: blank fuses, hero stays 9★
- [x] Dropped blank card on a 9★ hero
- [x] Fusion to 4★ while a skill cools
- [x] Tooltip effect tag shows `.skill-level`
- [x] `level` with `unlocked: false` treated as locked

## Gaps (ranked, one fix task each)

1. **G1, Major: gold chip weight not pinned (ASC-08 AC1, AC2; survivor M9).** `style.css:2802` can lose `font-weight: 800` and every test still passes. Fix: in `game/e2e/heroAscension.spec.js` add `expect(await colorOf(stars, 'fontWeight')).toBe('800')` to the 5★ test (after line 132) and to the 8★ test (after line 156). Re-run the sensor on M9: it must be killed.
2. **G2, Major: level 3 pill colour not pinned (ASC-08 AC4; survivor M10).** `style.css:2819` can lose the gold background of `.skill-level[data-level="3"]`. Fix: in the 8★ test add `expect(await colorOf(page.locator('.skill-level[data-level="3"]').first(), 'backgroundColor')).toBe('rgb(217, 165, 33)')`. Re-run M10.
3. **G3, Major: crit damage pinned by rounded text only (ASC-06 AC3, AC4).** `ClickerGame.test.js:4849`, `:4855`, `:4863`, `:4869` assert the displayed `'4.7'`, `'1.7'`, `'12.8'`, `'3.2'`, never the spec's damage. Fix: after each click also assert `crit.scene.monster.health` `toBeCloseTo(1000 - 4.675, 9)` (4★ critical), `toBeCloseTo(1000 - 1.7, 9)`, `toBeCloseTo(1000 - 12.8, 9)` and `toBeCloseTo(1000 - 3.2, 9)`.
4. **G4, Major: T16 contract, player-visible ACs without e2e.** The T16 matrix requires every player-visible AC of ASC-06, ASC-07 and ASC-08 to have an e2e scenario. Missing: ASC-06 AC3, AC4 (critical clicks), ASC-06 AC6 (click after fusion), ASC-07 AC3 (0 to 2 fusion result), ASC-08 AC8 (no star power for 0★ or a hero not owned). Fix: add those scenarios to `heroAscension.spec.js`, or have the product owner record unit-only coverage for them in the matrix. Visible ACs with an e2e assertion today: 19 of 36 (ASC-03 to ASC-08).
5. **G5, Minor: level 2 badge colour not pinned (ASC-08 AC6).** Fix: in the 5★ test assert `colorOf(page.getByTestId('skill-level-1'), 'backgroundColor')` is `'rgb(122, 63, 160)'`.
6. **G6, Minor: 400 fusion answers do not re-read the bag (ASC-02 AC8).** Fix: in `BT/adapter/web/HeroControllerIT.kt` `fuse with stars missing, negative, nine or more...` assert `jpaCardCopyRepository.findAllByUsername("yan").single { it.stars == 9 }.copies == 5` after the loop.
7. **G7, Info: e2e timing flakes under 3 workers (not a feature gap).** See below. Consider a lower worker count or a longer boot timeout for the combo and drag tests.

## Failures Not Caused By The Feature

- `backend` ktlint: `ChapterTest.kt:384`, 4 `function-signature` violations. Campaign-chapters code, outside this diff.
- E2E, 5 timeouts in the full 3-worker run: `e2e/auth.spec.js:138` (sign up then login after reload), `e2e/clickPower.spec.js:41` (combo HUD not reached), `e2e/dragEquip.spec.js:604` (edge scroll stopped at 168 of 275), `e2e/talents.spec.js:148` (combo HUD), `e2e/uiRedesign.spec.js:333` (Click to Start prompt style). All five pass when run alone (5/5). None asserts a hero star, skill or fusion number. Cause: CPU load on this machine during the parallel run.
- E2E, 8 failures in the instrumented coverage run (`npm run test:e2e:coverage`, 292 passed): `e2e/session.spec.js:76` and `:102`, `e2e/stages.spec.js:57`, `e2e/talents.spec.js:148`, `e2e/uiRedesign.spec.js:316`, `:333`, `:566`, `:1982`. Rerun together with 3 workers: 5 passed, 3 failed (`uiRedesign.spec.js:316`, `:333`, `talents.spec.js:148`). Rerun with 1 worker: 3/3 passed. The instrumented server is slower, so 60-second timeouts recur under 3 workers. No failing assertion touches a hero, skill or fusion value.
- Process note: an earlier background e2e run was still alive while a second run started, which starved the CPU. The first hero spec attempt then failed 4 of 15 by 60-second timeouts. I stopped the stray run and reran the spec on an idle machine (15/15). Those 4 failures are not counted.

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ASC-01 | Pending | ✅ Verified |
| ASC-02 | Pending | ✅ Verified (G6 minor) |
| ASC-03 | Pending | ✅ Verified |
| ASC-04 | Pending | ✅ Verified |
| ASC-05 | Pending | ✅ Verified |
| ASC-06 | Pending | ❌ Needs Fix (G3, G4) |
| ASC-07 | Pending | ❌ Needs Fix (G4) |
| ASC-08 | Pending | ❌ Needs Fix (G1, G2, G4, G5) |

## Lessons Recorded

Signals: 2 surviving mutants (M9, M10) and 1 spec-precision gap (ASC-06 AC3 and AC4, one lesson for both). Recorded with `scripts/lessons.py add` as candidates: L-089 (M9, `style.css:2802`), L-090 (M10, `style.css:2819`), L-091 (`ClickerGame.test.js:4849`).

## Summary

**Overall**: ❌ Not Ready (FAIL, iteration 1 of 3)

**Spec-anchored check**: 48/48 ACs have a test citation; 41 pinned to the exact spec outcome; 7 partial (G1 to G6)
**Sensor**: 13 mutants, 11 killed, 2 survived (M9, M10)
**Gate**: backend 933 passed; game unit 1585 passed; e2e 300 (295 on the first run, the 5 timeouts pass when run alone); ktlint fails only in campaign-chapters code

**What works**: fusion rules and their bounds (backend), the level formulas and every scaled value at levels 2 and 3, the star bonus table rows 4 to 9, the fusion result text, the bag and fusion screens, the skill bar badge and its position, the deploy order precondition (step A live before step B).

**Issues found**: G1 to G4 (Major), G5 and G6 (Minor). Fix tasks are listed above in order.

**Next steps**: write the fix tasks G1 to G6 into `tasks.md`, run them through the implement flow, then re-run the Verifier (iteration 2 of 3).
