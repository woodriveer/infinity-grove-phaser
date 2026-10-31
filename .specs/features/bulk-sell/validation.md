# Bulk Sell Validation

**Date**: 2026-10-31
**Spec**: `.specs/features/bulk-sell/spec.md`
**Diff range**: `445a55b..1f7041f` (feature commits, gap-closing tests included), status commit on top
**Verifier**: independent sub-agent (author ≠ verifier), with one disclosed exception: this Verifier added the gap-closing tests listed under "Gaps closed in this run". Their results are part of the verdict; the originals were not changed.

---

## Verdict

## Validation: bulk-sell - PASS ✅ (one spec-coverage exception, see gap 1)

**Result**: PASS with exception 1 (BSL-19 "another screen" has no e2e scenario, unit-covered only)
**Spec-anchored check**: 30/30 BSL ACs matched the spec outcome, 9 edge cases covered, 1 spec-precision gap flagged (SP-1, non-blocking)
**Gate**: backend 879 passed / 0 failed; game unit 1408 passed / 0 failed; e2e 147 passed / 0 failed (bulk sell file 17/17)
**Sensor**: 12 mutations injected, 12 killed on the final tree (1 survived before the gap tests and was killed after them)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 SellBatch value | ✅ Done | Commit `593d271` |
| T2 PlayerEquipment.removeAll | ✅ Done | `708ea18` |
| T3 EquipmentService.sellAll | ✅ Done | `67064ff` |
| T4 POST /equipment/sell | ✅ Done | `9d06cbb` |
| T5 equipmentApi.sellMany | ✅ Done | `611cb30` |
| T6 equipmentCollection.sellMany | ✅ Done | `b3d2f5c` |
| T7 bulkSell.js rules | ✅ Done | `3425cc7` |
| T8 bulkSellView | ✅ Done | `c8fa52c` |
| T9 renderEquipment selection mode | ✅ Done | `5bc8762` |
| T10 HeroUi selection state | ✅ Done | `d229089` |
| T11 selection styles | ✅ Done | `586a50a` |
| T12 e2e bulkSell.spec.js | ✅ Done | `21bc424` |
| T13 compact sticky bar | ✅ Done | `a916c3d` (review finding 1) |
| T14 rarity dot, pressed state | ✅ Done | `60196fc` (review finding 2) |
| T15 hide tooltip in selection | ✅ Done | `c8856cc` (review finding 3) |
| T16 keep hero blocks still | ✅ Done | `847a7ad` (review finding 4) |
| Fix `250360c` | ✅ Done | Piece outlines apart in bulk mode (style only, covered by the e2e and ui-review) |

Bookkeeping: the "Done when" boxes of T5 to T10 and T11 were unchecked in `tasks.md`; they are checked in the status commit, each verified by the runs below.

---

## Spec-Anchored Acceptance Criteria

Evidence is `file:line` of the assertion. Paths: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/` abbreviated `BE/`; `game/src/` and `game/e2e/` in full.

### P1: Sell a batch of pieces (server)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| BSL-01 | 200 with `equipment`, `wallet`, `sold`, `earned`; rows deleted, copper credited, one transaction | `BE/adapter/web/EquipmentBatchSellIT.kt:59-60` `.body("sold", equalTo(3))`, `.body("earned", equalTo(1200))`; `:68-69` row count 1, copper 1250; `BE/service/EquipmentServiceTest.kt:389-396` `assertEquals(3, sale.sold)` | ✅ PASS |
| BSL-02 | Sum of single-sale prices: COMMON +0, RARE +4, UNCOMMON +0 → earned 1200, wallet 0 gold 12 silver 50 copper | `EquipmentBatchSellIT.kt:61-63` `wallet.gold 0`, `wallet.silver 12`, `wallet.copper 50` | ✅ PASS |
| BSL-03 | Worn piece: slot left empty and piece sold in the batch | `EquipmentBatchSellIT.kt:80-82` `sold 1`, `earned 100`, `equipment.pieces` size 0; `EquipmentServiceTest.kt:408-410` `assertEquals(emptyList<Piece>(), sale.equipment.worn("kael"))` | ✅ PASS |
| BSL-04 | Unknown or foreign id: 404 `EQUIPMENT_NOT_FOUND`, nothing deleted, nothing credited | `EquipmentBatchSellIT.kt:96-98` `statusCode(404)`, `body("code", equalTo("EQUIPMENT_NOT_FOUND"))`; `:99` ghost id, same code (added in gap run); `:101-102` 2 rows, copper 10; `EquipmentServiceTest.kt:420-424` `assertFailsWith<EquipmentNotFoundException>` and wallet 10 | ✅ PASS |
| BSL-05 | 1 to 100 distinct ids; empty, >100 or repeat → 400 `INVALID_SELL_BATCH` | `BE/domain/SellBatchTest.kt:9` (1, 100 ids), `:16` (empty), `:23` (101), `:28` (repeat); `EquipmentBatchSellIT.kt:111-112` `.body("code", equalTo("INVALID_SELL_BATCH"))`; `BE/domain/EquipmentExceptionsTest.kt:18-19` code | ✅ PASS |
| BSL-06 | No `pieceIds` / not a list / non-string item → 400, nothing changed | `EquipmentBatchSellIT.kt:124-129` bodies `{}`, `"a"`, `[1,2]` → 400; rows 1, copper 10 | ✅ PASS |
| BSL-07 | No token → 401 | `EquipmentBatchSellIT.kt:139` `statusCode(401)` | ✅ PASS |
| BSL-08 | Two sales at once: one runs after the other under the row lock; second answers 404 and credits nothing | `EquipmentBatchSellIT.kt:158-160` `assertEquals(listOf(200, 404), statuses.sorted())`, copper 200, 0 rows; `EquipmentServiceTest.kt:434-437` second call `assertFailsWith<EquipmentNotFoundException>`, wallet 200 | ✅ PASS (lock: sensor B6) |
| BSL-09 | `POST /equipment/{id}/sell` unchanged | `EquipmentBatchSellIT.kt:172-174` `wallet.silver 1`, copper 100; existing `EquipmentSellIT` passes unchanged in the 879-test run | ✅ PASS |

### P1: Select pieces in the bag

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| BSL-10 | `Vender várias` (`bulk-sell-start`) in the bag header, when an unworn piece exists | `game/src/adapters/phaser/views/equipmentView.test.js:256-262` text, parent `bag-header`; `game/e2e/bulkSell.spec.js:48` visible | ✅ PASS |
| BSL-11 | No button when no unworn piece | `equipmentView.test.js:268-272` `bulk-sell-start` null, `Mochila (0)`; `bulkSell.spec.js:295-303` count 0 after the last bag piece is sold | ✅ PASS |
| BSL-12 | Click enters mode: bar, summary `Selecionadas: 0 · Total: 0 cobre`, Vender selecionadas, Cancelar; `Vender várias` hidden | `equipmentView.test.js:275-280`; `HeroUi.test.js:1157-1166` start null after click; `bulkSell.spec.js:78-84` summary `0 · 0 cobre`, start count 0 | ✅ PASS |
| BSL-13 | Tile click toggles and does not open the piece detail | `HeroUi.test.js:1157-1166` `piece-detail` null, pressed `'true'`; `equipmentView.test.js:283-292` `onToggle` once, `onSelect` not called; `bulkSell.spec.js:85-92` detail count 0, unselect | ✅ PASS |
| BSL-14 | Selected tile: `aria-pressed="true"`, class `is-selected`, `✓`; unselected: `"false"`, no class, no check; outside mode no `aria-pressed` | Positive: `equipmentView.test.js:294-305`; `HeroUi.test.js:1163-1164` (`is-selected` true, added in gap run); `bulkSell.spec.js:56-58` `aria-pressed`, `toHaveClass(/is-selected/)` (added), `✓`, e1 `'false'` and no check. Outside mode: `equipmentView.test.js:307-309`; `bulkSell.spec.js:110-121` `not.toHaveAttribute('aria-pressed')` | ✅ PASS (positive now in unit and e2e) |
| BSL-15 | Summary `Selecionadas: <k> · Total: <total>` via `formatCopper` | `bulkSellView.test.js:11-16`; `equipmentView.test.js:311-316` `'Selecionadas: 2 · Total: 8 prata 50 cobre'`; `HeroUi.test.js:1195-1202` `'Selecionadas: 3 · Total: 4 prata'`; `bulkSell.spec.js:55` `'Selecionadas: 2 · Total: 3 prata'` | ✅ PASS |
| BSL-16 | `Vender selecionadas` enabled with ≥1 selected, disabled with none | `bulkSellView.test.js:53-61`; `HeroUi.test.js:1169-1175` `disabled` true; `bulkSell.spec.js:94` `toBeDisabled` | ✅ PASS |
| BSL-17 | Worn tiles disabled and `is-locked`; no `Transferir conjunto` shown | `equipmentView.test.js:317-325` disabled, class, transfer null; `:326-338` place kept without test id; `HeroUi.test.js:1204-1209`; `bulkSell.spec.js:105-107` disabled, `is-locked`, transfer count 0 | ✅ PASS |
| BSL-18 | Cancelar leaves mode, clears selection, `Vender várias` back, tile click opens detail | `HeroUi.test.js:1301-1314`; `bulkSell.spec.js:110-124` bar count 0, start visible, no `aria-pressed`, detail visible | ✅ PASS |
| BSL-19 | Window closed or another screen opened → leave mode | Close, unit: `HeroUi.test.js:1316-1326`; close, e2e: `bulkSell.spec.js:127-139`; another screen, unit (added in gap run): `HeroUi.test.js:1328-1341` (`.hero-title` `Mochila` asserted before the return to Equipamento); another screen, e2e: none (see gap 1) | ⚠️ Exception 1 (unit only for "another screen") |
| BSL-19 (edge) | A sale answer arriving after the close draws nothing | `HeroUi.test.js:1343-1356` `.hero-body` children 0; `bulkSell.spec.js:345-372` (added in gap run): HUD wallet updated, panel hidden, body empty, reopened bag `Mochila (3)`, no notice, no bar | ✅ PASS |

### P1: Confirm and sell

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| BSL-20 | `Vender <k> peças por <total>?` with `Sim, vender`, `Não`; no request before `Sim, vender` | `bulkSellView.test.js:75-85`; `HeroUi.test.js:1211-1222` question text, `sellMany` not called; `bulkSell.spec.js:63` question `'Vender 2 peças por 3 prata?'` | ✅ PASS |
| BSL-21 | While confirming: tiles and rarity buttons disabled; Vender selecionadas and Cancelar hidden | `bulkSellView.test.js:75-85` (submit and cancel null), `:90-96` (rarity disabled); `equipmentView.test.js:363-369` tile disabled; `HeroUi.test.js:1211-1222`; `bulkSell.spec.js:165-166` tile and rarity disabled, `:167` cancel count 0 | ✅ PASS |
| BSL-22 | `Não` hides the question, shows Vender selecionadas and Cancelar, keeps the selection | `bulkSellView.test.js:97-104`; `HeroUi.test.js:1224-1236` (question null, pressed, summary `2 · 3 prata`, cancel not null added in gap run); `bulkSell.spec.js:141-155` (confirm count 0, pressed `'true'`, cancel visible added, zero requests) | ✅ PASS |
| BSL-23 | `Sim, vender` sends one `POST` with `pieceIds` in bag order, and disables every button of the window | Bag order: `HeroUi.test.js:1238-1255` clicks u1 then c1, `toHaveBeenCalledWith([ 'c1', 'u1' ])`; one call: `HeroUi.test.js:1257-1279`; wire body: `game/src/adapters/http/equipmentApi.test.js:58-64` `{ pieceIds: [ 'p1', 'p 2' ] }`; e2e body `bulkSell.spec.js:75` `{ pieceIds: [ 'c1', 'u1' ] }`; disabled while sending `bulkSell.spec.js:280-286` (confirm-yes disabled added). Scope wording: SP-1 | ✅ PASS (SP-1 open) |
| BSL-24 | Success: leave mode, bag without sold pieces, `Mochila (<n>)`, notice from server numbers, server wallet | `HeroUi.test.js:1238-1255` notice, bar null, start, `Mochila (1)`, piece removed, error hidden; `game/src/application/equipment/equipmentCollection.test.js:164` resolves `{ sold: 1, earned: 100 }`, wallets reported; `bulkSell.spec.js:43-75` notice `'2 peças vendidas por 3 prata'`, `Mochila (2)`, wallet `Silver: 3 Copper: 50` (line 72) | ✅ PASS |
| BSL-25 | Failure: list read again, error line, stay in mode, keep only selected pieces still in bag | `HeroUi.test.js:1281-1299` error text, `list` called 2 times, pressed u1, summary `1 · 2 prata`, question null; `equipmentCollection.test.js:175` reload and reject, `:186` reload failure; `bulkSell.spec.js:170-186` error and selection kept; `:188-210` piece sold in another tab, dropped from selection | ✅ PASS |

### P2: Select by rarity

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| BSL-26 | Five buttons `Comum`, `Incomum`, `Raro`, `Épico`, `Lendário` in order, `bulk-sell-rarity-<RARITY>` | `bulkSellView.test.js:22-33` texts, testids, `data-rarity`, class; `bulkSell.spec.js:234-241` texts and testids in order | ✅ PASS |
| BSL-27 | Not all selected → select every bag piece of the rarity, keep the others | `bulkSell.test.js:37-40`; `:41-44` partly selected; `HeroUi.test.js:1179-1193`; `bulkSell.spec.js:214-225` c1, c2 pressed, u1 not | ✅ PASS |
| BSL-28 | All selected → unselect the rarity, keep the others | `bulkSell.test.js:45-48`; `HeroUi.test.js:1179-1193` second click `0 · 0 cobre`; `bulkSell.spec.js:227-229` | ✅ PASS |
| BSL-29 | Rarity with no bag piece → disabled | `bulkSellView.test.js:34-43` LEGENDARY disabled; `bulkSell.spec.js:219` `bulk-sell-rarity-LEGENDARY` disabled | ✅ PASS |
| BSL-30 | `aria-pressed` true when all of the rarity is selected and held; false otherwise | `bulkSellView.test.js:34-43` COMMON `'true'`, UNCOMMON `'false'`; `HeroUi.test.js:1188`; `bulkSell.spec.js:227` `'true'` | ✅ PASS |

### Edge cases (spec section "Edge Cases")

- [x] Last piece sold while a hero wears one → `Mochila (0)`, no `Vender várias`: `bulkSell.spec.js:295-308`; `HeroUi.test.js:1358-1369`
- [x] Last piece sold → empty text with notice: `bulkSell.spec.js:310-321`; `HeroUi.test.js:1358-1369`; `equipmentView.test.js:377-383`
- [x] Double `Sim, vender` sends one request (BSL-23): `HeroUi.test.js:1257-1279`; `bulkSell.spec.js:260-293`
- [x] Piece sold elsewhere → 404, failure path, dropped from selection (BSL-04, BSL-25): `bulkSell.spec.js:188-210`; `HeroUi.test.js:1281-1299`
- [x] Piece drops while selecting → unselected at the next redraw, selection kept (BSL-14): `HeroUi.test.js:1371-1383` (unit); `bulkSell.spec.js:323-343` (added in gap run, drop through `receiveEquipmentDrop`)
- [x] Answer after the window closed draws nothing (BSL-19): `HeroUi.test.js:1343-1356`; `bulkSell.spec.js:345-372`

---

## Spec-precision gaps

| ID | Criterion | Issue | Status |
| -- | --------- | ----- | ------ |
| SP-1 | BSL-23 "disable every button of the Equipamento window" | The implementation disables the buttons of the body (the equipment list and the bar); the window's own `hero-close` stays enabled, which is what BSL-19 requires (closing during a pending sale). The spec should say "every button of the body" | ⚠️ Non-blocking; product-owner wording |

---

## Discrimination Sensor

Isolated `git worktree` under the scratchpad (`w`, detached), `node_modules` linked by junction, removed afterwards. The real tree was never mutated: no sensor edit appears under `git status` for production files, and the worktree was removed.

Depth: **P0 (payment and data integrity, all branches)**, manual fault injection, 12 mutants (≥ 5 requirement; no mutation tool is configured for the stack).

| # | File:line | Mutation | Covering tests | Killed? |
| - | --------- | -------- | -------------- | ------- |
| B1 | `BE/service/EquipmentService.kt:133` | `plus(earned)` → `plus(earned - 1)` (copper off by one) | `EquipmentServiceTest` (`sellAll removes every listed piece...`, `sellAll creates the missing wallet...`, ...) | ✅ Killed (rerun after a Kotlin daemon failure) |
| B2 | `BE/domain/PlayerEquipment.kt:75` | Removed the unknown-id check of `removeAll` | `PlayerEquipmentTest.kt:119` `removeAll with one unknown id is not found...` | ✅ Killed |
| B3 | `BE/adapter/web/EquipmentController.kt:126` | Non-string ids accepted (`it.toString()`) | `EquipmentBatchSellIT.kt:124-129` (400 for `[1,2]`) | ✅ Killed |
| B4 | `BE/domain/SellBatch.kt:11` | `> MAX_SIZE` → `>= MAX_SIZE` (100 refused) | `SellBatchTest.kt:9` | ✅ Killed |
| B5 | `BE/domain/SellBatch.kt:12` | Repeat check removed | `SellBatchTest.kt:28` | ✅ Killed |
| B6 | `BE/service/EquipmentService.kt:128` | `lockPlayer` → `requireUser` (no row lock) | `EquipmentBatchSellIT.kt:143-161` race (one run; see gap 4) and `EquipmentServiceTest.kt:462` | ✅ Killed |
| G1 | `game/src/domain/equipment/bulkSell.js:51` | `toggleRarity` inverted (`if (!allSelected)`) | `bulkSell.test.js:37`, `:41`, `:45` (3 tests) | ✅ Killed (rerun after worker timeout) |
| G2 | `game/src/adapters/phaser/HeroUi.js:540` | Success keeps the selection mode on | `HeroUi.test.js:1238-1255` | ✅ Killed (rerun after worker timeout) |
| G3 | `game/src/adapters/phaser/HeroUi.js:161` | `show()` keeps the selection (another screen) | Before the gap tests (commit `250360c`): **survived**, 101/101 pass. After `HeroUi.test.js:1328` (commit `0b1f13d`): ✅ Killed | ✅ Killed (after the fix) |
| G4 | `game/src/adapters/phaser/HeroUi.js:527` | Request in click order instead of bag order (D11) | `HeroUi.test.js:1238-1255` (`[ 'c1', 'u1' ]`) | ✅ Killed |
| G5 | `game/src/adapters/phaser/views/equipmentView.js:124` | Tooltip attached in selection mode | `equipmentView.test.js:346-355` | ✅ Killed |
| G6 | `game/src/application/equipment/equipmentCollection.js:153` | No reload after a refused sale | `equipmentCollection.test.js:175-185` | ✅ Killed |

**Sensor depth**: P0 manual, 12 mutants, all branches of the sale path (batch bounds, repeat, unknown id, worn, wallet, lock, selection toggle, rarity toggle, request order, success and failure reset, tooltip guard, reload).
**Result**: 12/12 killed on the final tree. Survivor before the gap tests: G3 (fixed). PASS ✅

Mutants whose first run was lost to infrastructure (Kotlin daemon, vitest worker timeout under concurrent load) were rerun one by one; only the rerun results are reported. An earlier "killed" line for G3 at the pre-gap commit could not be reproduced and was discarded (the rerun survived).

---

## Gaps closed in this run

| Commit | Tests added (existing tests only strengthened where stated) |
| ------ | ------------------------------------------------------------ |
| `0b1f13d` `test(game): cover the drop and late answer of the bulk sale` | Unit: `HeroUi.test.js:1328` opening another screen; `:1164` `is-selected` positive; `:1235` cancel visible after `Não`. E2E: `bulkSell.spec.js:323` drop during selection; `:345` late answer after close; `:57` `is-selected` positive; `:153` cancel visible after `Não`; `:281` confirm-yes disabled during the held sale |
| `1f7041f` `test(backend): check the code of the missing id in the batch sale` | `EquipmentBatchSellIT.kt:99` `code` `EQUIPMENT_NOT_FOUND` for the `ghost` id |

Also tried and dropped: an e2e "another screen" case (`hud-bag` clicked while the window is open). Playwright reported that the open panel (`hero-window`) intercepts the HUD clicks, so the player cannot reach that path with the window open. Removed, because a failing case is not kept as a test.

---

## Interactive UAT

Not performed. The UI was checked by `ui-review.html` (ui-artist) and by the e2e scenarios above.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Production changes match the tasks |
| Surgical changes | ✅ Feature commits touch only the listed files (no owner file touched) |
| Spec-anchored outcome check (asserted values match spec) | ✅ All 30 BSL rows, one exception (BSL-19 e2e) |
| Per-layer Coverage Expectation met | ✅ Domain 1:1 ACs; IT covers 400, 401, 404, race; e2e covers the screen's ACs |
| Every test maps to a requirement, edge case or done-when | ✅ The test names quote the spec outcomes |
| Test titles claim what the body checks | ✅ After the fix in `bulkSell.spec.js:280-281` (the held-sale title) |
| Documented guidelines followed | ✅ `CLAUDE.md` (unit + e2e per visible behaviour), `kotlin-backend-ddd` (service/domain tests, loggers) |

---

## Test Integrity

- Test counts: backend 879 (run), game unit 1408 (run), e2e 147 (run). Bulk-sell declarations added in the range (per bulk-sell commit): backend 23 `@Test`, game unit 61 (including 1 gap test), e2e 17 (including 2 gap tests). No test removed. No assertion weakened; additions only, listed above.
- The gap-run e2e `bulkSell.spec.js` file has 17 cases; the total of the e2e suite was 147 at the run and 150 in the earlier list (other agents' specs changed the count between the two calls; the run figure is the one reported).
- Coverage: see the report numbers in the chat summary. Backend JaCoCo on the clean run before the one-line IT edit (test-only); the edited IT was re-run 8/8 with ktlint.

---

## Requirement Traceability Update

All 30 BSL requirements move from `Implementing` to `Verified` in `spec.md` (except BSL-19, which is `Verified` with exception 1 in this report).

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| BSL-01 to BSL-30 | Implementing | ✅ Verified |

---

## Gaps (ranked)

1. **BSL-19 "another screen is opened": no e2e scenario.** Covered at unit level (`HeroUi.test.js:1328`), which kills the sensor mutant G3. The player cannot open another screen while the window is open: the panel intercepts the HUD clicks (Playwright run with the attempt, removed). The only other caller of `show('farm')` (`ClickerGame.js:1131`) happens after a farm chapter-boss win, which I did not drive in e2e. Decision for the orchestrator: accept unit coverage with this reason, or request an e2e for the farm path. Non-blocking for the verdict as written.
2. **SP-1 spec wording:** "every button of the Equipamento window" versus the implementation (body buttons disabled, `hero-close` enabled). Non-blocking; product-owner clarification.
3. **Drop during selection e2e uses a seam:** `bulkSell.spec.js:323` calls `ClickerGame.receiveEquipmentDrop` (the same entry the backend answer of a won boss uses). A real boss kill needs the window closed, so the drop is injected while the window is open. Limitation noted, not blocking.
4. **Race test (BSL-08) single-run evidence:** the mutant B6 (no row lock) was killed by `EquipmentBatchSellIT.kt:143-161` in one run. Concurrency tests can be timing-sensitive; repeated runs were not done in this run.
5. **JaCoCo per-file observation:** the report lists `EquipmentService.kt` lines 44 to 105 (`list`, `equip`, `unequip`, `refine`, `reroll`, `sell`, pre-existing methods) and 154 to 163 as not covered, while the ITs exercise them. The feature's code (`sellAll`, lines 122 to 137, and `removeAll`) has no missed lines. Not investigated; not a feature gap.
6. **CSS-only tasks (T13, T14):** no automated assertion, by the matrix (`ui-artist` review). They are not spec ACs; the screenshots are in `ui-review.html`.
7. **Co-author line:** `tasks.md` names `Claude Opus 5.5` in the commit footer; the commits made in this run carry `Claude Haiku 5.5` (the model running this Verifier). Attribution only.

---

## Lessons

Recorded with `lessons.py add` (candidates, scope in the store): L-056 (surviving mutant G3: reset assertion through the named screen-change path), L-057 (SP-1: name the region a rule covers), L-058 (BSL-19: check the e2e path is reachable before writing the scenario).

---

## Summary

**Overall**: ✅ Ready (one exception, gap 1)

**Spec-anchored check**: 30/30 BSL matched the spec outcome; 1 spec-precision gap (SP-1)
**Sensor**: 12/12 mutants killed on the final tree (G3 survived before its gap test)
**Gate**: backend 879 passed / 0 failed; game unit 1408 passed / 0 failed; e2e 147 passed / 0 failed

**What works**: the batch sale on the server (one transaction, all-or-nothing, 400/401/404/race), the selection mode and its state machine, the confirmation, the failure path, the rarity buttons, the sell notice, the close and late-answer rules.

**Issues found**: gap 1 (BSL-19 another-screen e2e unreachable with the window open) and SP-1 (wording), both documented above.

**Next steps**: the orchestrator accepts or rejects gap 1 and SP-1; `gitops` pushes (already on `origin/main`), checks the deploy, writes `report.html` and the changelog.
