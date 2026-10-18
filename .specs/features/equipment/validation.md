# Equipment Validation

**Date**: 2026-10-18
**Spec**: `.specs/features/equipment/spec.md`
**Diff range**: `1377280..HEAD` (docs commit, then T1 `77c0581` to T25 `15b7dd4`)
**Verdict**: PASS
**Verifier**: standalone fresh-eyes pass by the author, in the same session. The environment did not allow a separate sub-agent, so author = verifier; the evidence below was re-read from the test files, not taken from the Done-when boxes, and the sensor ran against a clean baseline.

Paths: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`.

---

## Gates

| Gate | Command | Result |
| ---- | ------- | ------ |
| Backend build (ktlint, unit, integration with Testcontainers) | `cd backend && ./gradlew --offline build` | green |
| Game unit tests | `cd game && npm test` | 37 files, 665 tests green |
| Game build | `cd game && npm run build` | green |
| End to end (real Chromium, faked backend) | `cd game && npx playwright test` | 49 of 49 green (44 existing, 5 in `equipment.spec.js`) |

---

## Spec-anchored outcome check (per requirement)

Every row cites a located assertion. Test names are the backtick sentences or `it(...)` titles at the given line.

| ID | Evidence (`file:line`, assertion target) | Covered |
| -- | ---------------------------------------- | ------- |
| EQP-01 | `BT/domain/PieceRollerTest.kt:39` (0.2499 drops, 0.25 and 0.9 do not); `BT/adapter/web/EquipmentDropFlowIT.kt:51` (drop stored, 1 row) and `:74` (roll 0.25: no piece); `BT/service/ProgressServiceTest.kt:385,397` | ✅ |
| EQP-02 | `PieceRollerTest.kt:46` (0.0 and 0.999999 drop); `EquipmentDropFlowIT.kt:84`; `ProgressServiceTest.kt:406`; `FarmControllerIT.kt:206` | ✅ |
| EQP-03 | `PieceRollerTest.kt:52,64` (rarity weights at each boundary), `:78` (slot quarters), `:121` (range and scale, 5/15/33), `:132` (2, 3, 4, 4 distinct affixes) | ✅ |
| EQP-04 | `PieceRollerTest.kt:90` (2 to 5, no `CLICK_DAMAGE_PCT`), `:101` (legendary 11, rare 6), `:151`; `EquipmentTest.kt:33` | ✅ |
| EQP-05 | `PieceRollerTest.kt:112` (ring: null base click, `CLICK_DAMAGE_PCT` 5) | ✅ |
| EQP-06 | `EquipmentDropFlowIT.kt:51` (`equipmentDrop.piece` id fields, rarity, slot, refine, clickDamage 2.0, affixes, costs, `sold` false); `FarmControllerIT.kt:206` | ✅ |
| EQP-07 | `EquipmentDropFlowIT.kt:74`, `FarmControllerIT.kt:222` (`equipmentDrop` is `nullValue()`) | ⚠️ gap 1 |
| EQP-08 | `BT/service/EquipmentRewardsTest.kt:91` (not stored, wallet +200, `sold` true), `:104`; `EquipmentDropFlowIT.kt:113` (100 rows stay, wallet 2 silver) | ✅ |
| EQP-09 | `ProgressServiceTest.kt:417`; `EquipmentDropFlowIT.kt:100`; `FarmServiceTest.kt:337`; `FarmControllerIT.kt:235` | ✅ |
| EQP-10 | `GS/adapters/phaser/HeroUi.test.js:573` (exact `Equipamento encontrado: Raro Arma`, 3000 ms timer); `ClickerGame.test.js:2143,2158,2182`; `GS/domain/equipment/equipment.test.js:105` (all five rarity and four slot labels); `e2e/equipment.spec.js:110` | ✅ |
| EQP-11 | `FarmServiceTest.kt:337` (`FARM_TOO_FAST`, `BOSS_NOT_AVAILABLE`), `:352` (daily limit); `ProgressServiceTest.kt:417` (rejected report reads no roll); `EquipmentDropFlowIT.kt:100` (409 adds no row) | ✅ |
| EQP-12 | `BT/domain/PlayerEquipmentTest.kt:41`; `BT/service/EquipmentServiceTest.kt:77`; `BT/adapter/web/EquipmentControllerIT.kt:107` | ✅ |
| EQP-13 | `PlayerEquipmentTest.kt:49`; `EquipmentServiceTest.kt:88`; `EquipmentControllerIT.kt:119` | ✅ |
| EQP-14 | `PlayerEquipmentTest.kt:65`; `EquipmentServiceTest.kt:101`; `EquipmentControllerIT.kt:131` | ✅ |
| EQP-15 | `PlayerEquipmentTest.kt:88`; `EquipmentServiceTest.kt:131`; `EquipmentControllerIT.kt:172` | ✅ |
| EQP-16 | `EquipmentServiceTest.kt:121,143`; `EquipmentControllerIT.kt:150,186` (404 `EQUIPMENT_NOT_FOUND`, other account, nothing changed) | ✅ |
| EQP-17 | `EquipmentServiceTest.kt:111`; `EquipmentControllerIT.kt:141` (409 `HERO_NOT_OWNED`, piece stays in the bag) | ✅ |
| EQP-18 | `GS/domain/equipment/equipment.test.js:27,31,37,47,52` (4, 4.4, 1.15, crit 14 and 100, multiplier 2.3); `ClickerGame.test.js:2041,2050,2059,2070,2080`; `e2e/equipment.spec.js:56` (1 then 4 per click) | ✅ |
| EQP-19 | `GS/domain/combat/damage.test.js:132-145`; `ClickerGame.test.js:2097` (1 on a phase, 1.2 on a boss) | ✅ |
| EQP-20 | `damage.test.js:107-124` (0.75, 100 % and 150 % ignore the whole defense, magical); `ClickerGame.test.js:2089` | ✅ |
| EQP-21 | `equipment.test.js:78,84` (3000 ms); `ClickerGame.test.js:2108` (`Time: 35`), `:2117` (`Time: 30`) | ✅ |
| EQP-22 | `equipment.test.js:23` (same object back); `damage.test.js:124`; every existing `ClickerGame.test.js` click test still passes with no pieces | ✅ |
| EQP-23 | `GS/adapters/phaser/views/equipmentView.test.js:27,37,46,81,102,111`; `HeroUi.test.js:429`; `e2e/equipment.spec.js:38` | ✅ |
| EQP-24 | `equipmentView.test.js:19` (exact text); `HeroUi.test.js:429`; `e2e/equipment.spec.js:38` | ✅ |
| EQP-25 | `ClickerGame.test.js:2126` (base attacker, retry on tick); `equipmentView.test.js:69`; `HeroUi.test.js:429` (`Equipamento indisponível`) | ✅ |
| EQP-26 | `EquipmentControllerIT.kt:195`; `EquipmentRefineIT.kt:112`; `EquipmentRerollIT.kt:112`; `EquipmentSellIT.kt:100` (all 401) | ✅ |
| EQP-27 | `EquipmentServiceTest.kt:171`; `EquipmentRefineIT.kt:47` (+1, 100 copper left, clickDamage 3.3); `EquipmentTest.kt:136` | ✅ |
| EQP-28 | `EquipmentTest.kt:61` (500, 850, 1445, 2456, 59293, legendary 4000); `EquipmentServiceTest.kt:185` (rare +3 charges 7368) | ✅ |
| EQP-29 | `EquipmentServiceTest.kt:196`; `EquipmentRefineIT.kt:67` (409 `NOT_ENOUGH_COPPER`, piece and wallet unchanged) | ✅ |
| EQP-30 | `EquipmentTest.kt:144`; `EquipmentServiceTest.kt:208`; `EquipmentRefineIT.kt:83` (409 `MAX_REFINE`) | ✅ |
| EQP-31 | `EquipmentTest.kt:40,48` (10 to 20, 7 stays 7, weapon 3.3); `EquipmentControllerIT.kt:59` (5.2 and 27) | ✅ |
| EQP-32 | `equipmentView.test.js:142,147,152`; `HeroUi.test.js:429` (cost text, disabled by the scene wallet); `e2e/equipment.spec.js:80` | ✅ |
| EQP-33 | `EquipmentRefineIT.kt:117` (two threads, wallet 500: statuses `[200, 409]`, level 1, copper 0) | ✅ |
| EQP-34 | `EquipmentTest.kt:150,163`; `EquipmentServiceTest.kt:256` (-5000, affix 1 kept); `EquipmentRerollIT.kt:48` | ✅ |
| EQP-35 | `EquipmentTest.kt:192`; `EquipmentServiceTest.kt:273`; `EquipmentRerollIT.kt:68` | ✅ |
| EQP-36 | `EquipmentServiceTest.kt:285`; `EquipmentRerollIT.kt:79` | ✅ |
| EQP-37 | `EquipmentTest.kt:197`; `EquipmentServiceTest.kt:297`; `EquipmentRerollIT.kt:90,101` (400 `INVALID_AFFIX`) | ✅ |
| EQP-38 | `BT/domain/EquipmentExceptionsTest.kt` (code `NO_AFFIX_LEFT`, 409); the guard at `BE/domain/Equipment.kt` `rerolled` has no behavior test | ⚠️ gap 2 |
| EQP-39 | `equipmentView.test.js:167,171,179` (Rerrolar per affix from +5, cost 50 prata, disabled under 5000) | ✅ |
| EQP-40 | `EquipmentServiceTest.kt:320,334`; `EquipmentSellIT.kt:43` (+100, row gone); `e2e/equipment.spec.js:97` | ✅ |
| EQP-41 | `EquipmentServiceTest.kt:343`; `EquipmentSellIT.kt:60` (worn piece sold, 105 copper) | ✅ |
| EQP-42 | `EquipmentServiceTest.kt:365`; `EquipmentSellIT.kt:84` (404, wallet 10, piece of the other account stays) | ✅ |
| EQP-43 | `equipmentView.test.js:186` (`Vender (7 prata 50 cobre)`); `e2e/equipment.spec.js:97` | ✅ |

Listed edge cases: crit clamp to 100 (`equipment.test.js:47`), rounding (`EquipmentTest.kt:40,48`), another account piece is 404 (`EquipmentControllerIT.kt:95,150`, `EquipmentSellIT.kt:84`).

---

## Spec-precision gaps (non-blocking)

| # | Requirement | Gap | Decision taken |
| - | ----------- | --- | -------------- |
| 1 | EQP-07 | "carry `equipmentDrop` as null" does not say absent or `null`. The campaign response omits the field (like `drop`), the farm response sends an explicit `null`. | Both read as null in JSON paths and in the game; tests assert `nullValue()`. |
| 2 | EQP-38 | A piece holds at most 4 affixes and a slot allows at least 5 types, so `NO_AFFIX_LEFT` can never happen with today catalog. | Guard kept, exception code and mapping tested, no behavior test is possible without a bigger catalog. Noted in ADR 0008. |
| 3 | EQP-03 | "a value drawn inside the range times the rarity multiplier" can mean draw then scale, or draw inside the scaled range. | Draw in the base range, then scale and round down; pinned by `PieceRollerTest.kt:121`. |
| 4 | EQP-08, EQP-10 | The spec does not say what the game shows for a drop sold because the bag was full, nor when the wallet then refreshes. | The notice shows as for any drop; the wallet text catches up at the next kill sync (a known lag, not a requirement). |

---

## Discrimination sensor

Scratch edits applied one at a time to the real file, the targeted tests run, the file restored from its original text; baseline of both runners confirmed green before the run (an earlier backend run was discarded because the command did not start, which a baseline check exposed). After the run `git diff HEAD` was empty (line endings of 5 files restored).

| Mutant | Fault | Tests | Result |
| ------ | ----- | ----- | ------ |
| B1 | miniboss rate `>=` to `>` | `PieceRollerTest` | killed |
| B2 | rarity multiplier ignored | `PieceRollerTest` | killed |
| B3 | sell price ignores half a level | `EquipmentTest` | killed |
| B4 | refine does not charge | `EquipmentServiceTest` | killed |
| B5 | a full bag keeps the piece | `EquipmentRewardsTest` | killed |
| B6 | equip leaves the old piece worn | `PlayerEquipmentTest` | killed |
| B7 | sell credits nothing | `EquipmentServiceTest` | killed |
| B8 | a failed boss still drops equipment | `ProgressServiceTest` | killed |
| B9 | reroll may land on the same type | `EquipmentTest` | killed |
| G1 | weapon replaces the base damage | `equipment.test.js` | killed |
| G2 | boss damage applies to every monster | `damage.test.js` | killed |
| G3 | boss time bonus in hundredths | `equipment.test.js` | killed |
| G4 | scene never marks a boss | `ClickerGame.test.js` | killed |
| G5 | a sold drop joins the list | `equipmentCollection.test.js` | killed |
| G6 | Refinar never disabled | `equipmentView.test.js` | killed |
| G7 | armor pierce not clamped | `damage.test.js` | killed |
| G8 | scene ignores the equipment drop of a farm win | `ClickerGame.test.js` | killed |

17 of 17 killed, no survivor.

---

## Process notes

- Tasks T1 to T25 are one commit each, pushed right after (root `CLAUDE.md`). T2 was committed with a test that did not compile because the gate was chained without a guard; `72c2297` fixed it one commit later. Every later task ran its gate with `&&` before the commit.
- The shell tool rejected commands with apostrophes inside heredocs; edits with such text went through the file tools or script files, with no effect on the code.
- Not done on purpose (out of scope in the spec): account level, talent tree, sets, gold-find affixes.
