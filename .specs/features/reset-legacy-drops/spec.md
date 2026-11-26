# Reset Legacy Drops Specification

## Problem Statement

An account reset (spec `account-reset`, AD-015) pays crystals and raises `player_resets`, and nothing else gets better: the next run drops the same copper and the same pieces as the first one. The owner wants the drops of later runs to grow with **where** the player reset, not with how many times: a reset at chapter 15 should make chapter 1 pay about half of what chapter 15 pays, and resetting twice at the same chapter should stop paying, so the only way to keep improving is to reset further. This feature stores a legacy per chapter, applies the best one to copper and to piece rarity, and shows it in the game.

## Facts From the Code (not decisions)

Checked on `main` at `23b01b2` (2026-11-25).

- `POST /account/reset` (`AccountResetService.reset`, `main/service/AccountResetService.kt:35`) takes the `progress` row lock, checks `fromChapter`, puts the campaign back at chapter 1, deletes the talents, adds the crystals and raises `player_resets`. Its reward is `AccountReset.reward(progress)` (`domain/AccountReset.kt:15`): `15` for a completed campaign, else `min(chapter, 15)` from chapter 2; chapter 1 is closed (409 `RESET_LOCKED`). The answer is `{ reward, crystals, resets, progress }`.
- Copper comes from pre-rolled queues (AD-002): `WalletService` (`service/WalletService.kt`) loads the drop table (`DropRuleRepositoryPort.findAll`), refreshes each queue (`Wallet.refreshed`: a queue is re-rolled whenever it is not 20 values inside its rule's range, `DropQueue.refreshed`, `DropRule.accepts`) and credits the first queued values of accepted kills (`DropQueue.accept`, a bucket of 20 refilled one per `killIntervalMs` = 1500). The game shows the queued values as the coins of each kill (`game/src/domain/economy/walletLedger.js` `takeDrop`).
- Drop rules are seeded per chapter c: phase `3c - 2`, miniboss `3c - 1`, chapter boss `3c` (`ChapterDefinition.dropRules`), ranges `2..6`, `8..20`, `30..70` times `coinFactor(c)` = 1, 2, 4, 8, 16, 32, 64, 128, then +32 a chapter to 352 at chapter 15 (AD-019). A farm fight drops no copper.
- Pieces: `EquipmentRewards.award(username, encounter, chapter)` (`service/EquipmentRewards.kt`) calls `PieceRoller.roll(..., chapter)`; the chapter only picks the rarity weights (`PieceRoller.kt:17-31`): a miniboss rolls COMMON 65 / UNCOMMON 35 before chapter 4 and COMMON 60 / UNCOMMON 30 / RARE 10 from chapter 4; a chapter boss COMMON 30 / UNCOMMON 70 before 4, UNCOMMON 40 / RARE 60 at 4, UNCOMMON 40 / RARE 40 / EPIC 15 / LEGENDARY 5 from 5. Rates: miniboss 0.5, chapter boss 1.0 (`application.yaml app.equipment`). The farm uses the same award.
- The game shows the reset in the auto click window (`ClickerGame.showAutoClick`, `renderResetButton`) and confirms it in a dialog (`game/src/adapters/phaser/views/resetView.js` `renderResetDialog`, text `resetDialogText`).
- Migrations: V15 is the latest on `main`; `early-game-rebalance` (spec in review) takes V16 and V17.

## Goals

- [ ] A reset adds +50 % legacy to the chapter it counts (the reward chapter: 15 when completed), at most 100 % per chapter.
- [ ] Every campaign kill pays its own copper roll plus the best legacy's share of the same kind of kill of the best legacy's chapter: after one reset at chapter 15, a chapter 1 phase monster drops 354 to 1062 copper (today 2 to 6).
- [ ] A piece that drops below the best legacy's chapter uses that chapter's rarity weights with a chance equal to the best legacy's percent.
- [ ] The player sees the best legacy in the auto click window and, before confirming a reset, what the reset will change.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A bonus by reset count (`resets x X`) | Owner: the legacy depends on where, not how many times |
| Summing the legacies of several chapters | Owner decision 1: only the best counts |
| Backfilling legacy for resets made before this feature | Owner decision 2: players who already reset start empty |
| Hero cards, crystals, talent points, damage | Only copper and piece rarity change |
| A higher piece drop rate | Q1: the rate stays 0.5 / 1.0 |
| Farm copper | The farm drops no copper today |
| Phone layout | The owner targets desktop only |

---

## Legacy Rules

- **Legacy per chapter** `L(c)`: 0, 50 or 100 (percent). No row means 0.
- **A reset** counts the chapter of its reward `r` (the chapter left, 15 for a completed campaign): `L(r) = min(100, L(r) + 50)`. Chapters passed through but not reset at stay as they are. A reset at a chapter already at 100 changes nothing in the legacy (it still pays its crystals).
- **Best legacy**: among the chapters with `L(c) > 0`, the one with the largest `L(c) x coinFactor(c)`; on a tie, the higher chapter. Only the best legacy acts (owner decision 1); the others stay stored and can become the best later.
- **Copper**: for a kill of drop rule `id` from 1 to 45 (kind `k = (id - 1) mod 3`: 0 phase, 1 miniboss, 2 boss), the legacy rule is `3 x best - 2 + k` of the best chapter. The player's rule becomes `min = min(id) + floor(L x min(legacy) / 100)`, `max = max(id) + floor(L x max(legacy) / 100)`, same id and kill interval. The queue is rolled in that range, so the coins the game shows already carry the legacy. Rules outside 1 to 45 or without a legacy rule in the table stay as they are. This applies in every chapter, also above the best chapter.
- **Pieces**: when a campaign or farm piece rolls in chapter `k` and the best chapter `b > k`, one extra chance roll decides: below `L(b) / 100` the rarity uses the weights of chapter `b`, else of chapter `k`. With no legacy or `b <= k` no extra roll is made (the roll order of today is kept). Slot, affixes, values and the drop chance are unchanged.

## Legacy Table (examples, chapter 1 kills)

Expected chapter 1 copper: 50 phase kills, 10 minibosses and the boss, today 390 copper.

| Best legacy | Phase kill | Miniboss kill | Boss kill | Chapter 1 copper | x today |
| --- | --- | --- | --- | --- | --- |
| none | 2..6 | 8..20 | 30..70 | 390 | 1 |
| 50 % of chapter 2 | 4..12 | 16..40 | 60..140 | 780 | 2.0 |
| 50 % of chapter 5 | 18..54 | 72..180 | 270..630 | 3 510 | 9.0 |
| 100 % of chapter 5 | 34..102 | 136..340 | 510..1190 | 6 630 | 17.0 |
| 50 % of chapter 10 | 194..582 | 776..1940 | 2910..6790 | 37 830 | 97.0 |
| 50 % of chapter 15 | 354..1062 | 1416..3540 | 5310..12390 | 69 030 | 177.0 |
| 100 % of chapter 10 | 386..1158 | 1544..3860 | 5790..13510 | 75 270 | 193.0 |
| 100 % of chapter 15 | 706..2118 | 2824..7060 | 10590..24710 | 137 670 | 353.0 |

Best choice examples: 100 % of chapter 5 (100 x 16 = 1600) and 50 % of chapter 10 (50 x 192 = 9600): the best is 50 % of chapter 10. 100 % of chapter 10 (19 200) and 50 % of chapter 15 (17 600): the best is 100 % of chapter 10.

Pieces in chapters 1 to 3 with a best legacy of 50 % of chapter 5 or later: a chapter boss piece is EPIC with chance 0.5 x 15 % = 7.5 % and LEGENDARY 2.5 %; a miniboss piece is RARE with 5 %.

## Player-Facing Texts

Every new text, exactly (AD-007, L-010). `<p>` is the percent (50 or 100), `<c>` a chapter number.

| Where | Text |
| --- | --- |
| Legacy line, no legacy | `Legado: nenhum` |
| Legacy line, best legacy | `Legado: <p>% do capítulo <c>` |
| Legacy detail, best legacy (the `title` tooltip of the legacy line) | `Cada abate rende mais <p>% das moedas do capítulo <c>, e cada peça tem <p>% de chance de vir com a raridade do capítulo <c>.` |
| Legacy detail, no legacy (the `title` tooltip of the legacy line) | `Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.` |
| Reset dialog, the reset makes its chapter the best (case A) | `Legado depois do reset: <p'>% do capítulo <r> (hoje: <best>).` where `<best>` is `<p>% do capítulo <c>` or `nenhum` |
| Reset dialog, the chapter rises but another stays best (case B) | `Este reset sobe o legado do capítulo <r> para <p'>%. O melhor legado continua <p>% do capítulo <c>.` |
| Reset dialog, the chapter is already at 100 (case C) | `O legado do capítulo <r> já está em 100%: este reset não muda o seu legado.` |

`<r>` is the chapter the reset counts and `<p'>` its percent after the reset. The case is chosen in the order C, A, B: C when `L(r)` is already 100; A when the best after the reset is chapter `r`; B otherwise.

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Sum or best of several legacies | Only the best counts; best = largest `L(c) x coinFactor(c)`; copper adds `L(best)` % of a roll of the best chapter's range for the same kind; pieces use the best chapter's weights with chance `L(best)` % | Owner decision 1 (2026-11-25) | y |
| Players who already reset | Start with an empty legacy; it counts from their next reset; no backfill from `player_resets` | Owner decision 2 (2026-11-25) | y |
| Legacy step and cap | +50 per reset at a chapter, cap 100; chapters passed through add nothing | Owner proposal | y |
| **Q1** Piece drop rate | **Recommended**: unchanged (miniboss 0.5, chapter boss 1.0); only the rarity moves | The bag fills already (bulk sell exists); more pieces would make selling the main use | y (owner, 2026-11-25: recommended default) |
| **Q2** Tie between two best candidates | **Recommended**: the higher chapter | Its rarity weights are at least as good | y (owner, 2026-11-25: recommended default) |
| **Q3** Copper legacy above the best chapter | **Recommended**: applies in every chapter (a player in chapter 12 with 100 % of chapter 5 also gets +16x the chapter 5 roll) | The owner's formula is "every kill"; one rule is easier to read | y (owner, 2026-11-25: recommended default) |
| **Q4** Piece legacy at or above the best chapter | **Recommended**: no effect (`b <= k` uses chapter k as today) | The chapter's own weights are already as good | y (owner, 2026-11-25: recommended default) |
| **Q5** Farm | **Recommended**: farm pieces get the piece legacy; farm kills drop no copper as today | Same award path (`EquipmentRewards`) | y (owner, 2026-11-25: recommended default) |
| **Q6** Where the player sees it | **Recommended**: a one-line legacy line in the auto click window above `Resetar conta`, its detail in the `title` tooltip of that line (amended 2026-11-26, owner decision 2026-11-26: the detail row covered the monster), and one line in the reset dialog under its question | Both live next to the reset today; no new screen | y (owner, 2026-11-25: recommended default) |
| **Q7** Chapter 1 after a high reset | Accept. The legacy changes no damage, health or talent number of `early-game-rebalance`. Chapter 1 gets faster after a reset because the player keeps the gear: the `early-game-rebalance` simulation (revision 2) with a kept +10 weapon ends chapter 1 at 6.6 min for Kael at 8 clicks/s (12.0 without), chapter 3 at 20.4 (30.3). The legacy adds copper (up to 353x in chapter 1) and better piece rarity below the best chapter | Faster runs after a reset are the point of a reset | y (owner, 2026-11-25: recommended default) |
| Storage | `player_legacy (username -> users on delete cascade, chapter 1 to 15, percent 50 or 100, primary key (username, chapter))`, expand only; version V18 after `early-game-rebalance` (V16, V17), else the next free one | AD-016; a row per chapter keeps the per-chapter value the owner described || y (owner, 2026-11-25: recommended defaults accepted) |
| API | `GET /account/legacy` answers `{ chapters: [{ chapter, percent }], best: { chapter, percent } or null, afterReset: { chapter, percent, best } or null }` (`afterReset` null while the reset is closed); `POST /account/reset` answers the same object as `legacy` | The game types no catalog number (AD-011): the best and the preview come from the backend, which knows `coinFactor` || y (owner, 2026-11-25: recommended defaults accepted) |
| A game against a backend without the endpoint | A failed or 404 `GET /account/legacy` shows no legacy line and no dialog line | Old backend keeps working || y (owner, 2026-11-25: recommended defaults accepted) |
| Concurrency | The legacy is written only by the reset, inside its transaction under the `progress` row lock; wallet sync and piece rolls read it without a lock | A reset and a sync of one player: the sync sees the legacy before or after the reset, both valid || y (owner, 2026-11-25: recommended defaults accepted) |
| Implicit dimensions | Input bounds: chapter 1 to 15 and percent 50 / 100 checked by the database and the domain. Failure: a failed reset writes no legacy (same transaction). Idempotency: a repeated reset is refused by `fromChapter` (409 `RESET_CHAPTER_MISMATCH`) before the legacy changes. Auth: the endpoint needs the player's token like `/account/reset`. Data lifecycle: rows go with the user (cascade); an account reset keeps them. Observability: the reset log line gains the legacy chapter and percent. External dependency: N/A. State transitions: `L(c)` 0 -> 50 -> 100, never down | Large-scope sweep || y (owner, 2026-11-25: recommended defaults accepted) |

**Open questions:** none. The owner answered decisions 1 and 2 and accepted Q1 to Q7 and the magnitude of the Legacy Table (177x, 353x) on 2026-11-25.

---

## User Stories

### P1: A reset leaves a legacy ⭐ MVP

**User Story**: As a player who resets, I want the chapter I reset at to be remembered so that resetting further pays more.

**Why P1**: The base of every other story.

**Acceptance Criteria**:

1. WHEN a player with no legacy resets from chapter 5 THEN the backend SHALL store `L(5) = 50`.  <!-- event-driven -->
2. WHEN a player with `L(5) = 50` resets from chapter 5 THEN the backend SHALL store `L(5) = 100`.  <!-- event-driven -->
3. WHEN a player with `L(5) = 100` resets from chapter 5 THEN the backend SHALL keep `L(5) = 100` and still pay the 5 crystals.  <!-- event-driven -->
4. WHEN a player with a completed campaign resets THEN the backend SHALL count chapter 15.  <!-- event-driven -->
5. WHEN a player resets from chapter 10 after passing chapters 2 to 9 THEN the backend SHALL change only `L(10)`.  <!-- event-driven -->
6. IF the reset is refused (409 `RESET_LOCKED`, 409 `RESET_CHAPTER_MISMATCH`, 400) THEN the backend SHALL leave the legacy unchanged.  <!-- unwanted-behavior -->
7. The backend SHALL keep the legacy through every later reset and delete it only with the user.  <!-- ubiquitous -->
8. WHEN the migration runs on a database with `player_resets` rows THEN every player SHALL start with no legacy.  <!-- event-driven -->

**Independent Test**: A service test resets from chapter 5 twice and from chapter 10 once and reads `{5: 100, 10: 50}`.

---

### P1: The best legacy ⭐ MVP

**User Story**: As a player, I want my strongest legacy to count so that a deeper reset is always worth it.

**Acceptance Criteria**:

1. WHEN the legacy is `{5: 100, 10: 50}` THEN the best SHALL be 50 % of chapter 10.  <!-- event-driven -->
2. WHEN the legacy is `{10: 100, 15: 50}` THEN the best SHALL be 100 % of chapter 10.  <!-- event-driven -->
3. WHEN two chapters give the same `L x coinFactor` THEN the best SHALL be the higher chapter.  <!-- event-driven -->
4. WHEN the player has no legacy THEN the best SHALL be none.  <!-- event-driven -->
5. WHEN the backend answers `GET /account/legacy` THEN it SHALL list every stored chapter in ascending order, the best, and `afterReset` with the chapter the reset counts now, its percent after the reset and the best after the reset.  <!-- event-driven -->
6. WHILE the campaign is in chapter 1 and not completed the backend SHALL answer `afterReset: null`.  <!-- state-driven -->
7. WHEN `POST /account/reset` succeeds THEN its answer SHALL carry `legacy` with the same shape after the reset.  <!-- event-driven -->

**Independent Test**: `GET /account/legacy` of a player with `{5: 100, 10: 50}` in chapter 12 answers best `{10, 50}` and `afterReset {12, 50, best {12, 50}}`.

---

### P1: Copper legacy ⭐ MVP

**User Story**: As a player after a deep reset, I want kills in the early chapters to pay a share of the chapter I reset at.

**Acceptance Criteria**:

1. WHEN a player with best legacy 50 % of chapter 15 loads the wallet THEN the queue of rule 1 SHALL hold 20 values from 354 to 1062, of rule 2 from 1416 to 3540 and of rule 3 from 5310 to 12390.  <!-- event-driven -->
2. WHEN a player with best legacy 100 % of chapter 5 syncs 3 kills of rule 1 THEN the backend SHALL credit the first 3 queued values, each from 34 to 102.  <!-- event-driven -->
3. WHEN a player's legacy changes THEN the next wallet load SHALL re-roll every queue whose values fall outside the new ranges.  <!-- event-driven -->
4. WHEN a player with no legacy loads the wallet THEN every queue SHALL hold values of today's ranges.  <!-- event-driven -->
5. The backend SHALL keep the kill allowance (20, one per 1500 ms) unchanged.  <!-- ubiquitous -->
6. WHEN the drop table holds a rule outside ids 1 to 45 THEN that rule SHALL keep its range.  <!-- event-driven -->
7. WHEN the plain drop table is read (`GetDropTableUseCase.dropTable()`) THEN it SHALL answer the seeded ranges without any legacy.  <!-- event-driven -->

**Independent Test**: A wallet IT with legacy `{15: 50}` reads `drops["1"]` all inside 354..1062.

---

### P1: Piece legacy ⭐ MVP

**User Story**: As a player after a deep reset, I want early bosses to sometimes drop pieces of the rarity of the chapter I reset at.

**Acceptance Criteria**:

1. WHEN a chapter 2 boss piece drops for a player with best legacy 50 % of chapter 5 and the legacy roll is below 0.5 THEN the rarity SHALL use the chapter 5 weights.  <!-- event-driven -->
2. WHEN that legacy roll is 0.5 or more THEN the rarity SHALL use the chapter 2 weights.  <!-- event-driven -->
3. WHEN the best chapter is at or below the chapter of the drop, or the player has no legacy, THEN the backend SHALL make no legacy roll and roll the piece exactly as today.  <!-- event-driven -->
4. WHEN a farm fight of a chapter 1 boss drops a piece for a player with best legacy 100 % of chapter 5 THEN the rarity SHALL use the chapter 5 weights.  <!-- event-driven -->
5. The backend SHALL keep the piece drop rates (0.5 miniboss, 1.0 chapter boss).  <!-- ubiquitous -->

**Independent Test**: A unit test with scripted chances rolls a chapter 2 boss piece with legacy `{5: 50}` and legacy roll 0.2 and gets the EPIC of the chapter 5 table.

---

### P1: The player sees the legacy ⭐ MVP

**User Story**: As a player, I want to see my legacy and what a reset will add before I confirm it.

**Acceptance Criteria**:

1. WHILE the auto click window is open the game SHALL show the legacy line above `Resetar conta` with the text of § Player-Facing Texts and SHALL carry its detail as the `title` tooltip of that line, with no detail row (amended 2026-11-26, owner decision 2026-11-26: the detail row covered the monster: the taller window covered the centre of the monster).  <!-- state-driven -->
2. WHEN the player opens the reset dialog THEN the game SHALL show the legacy line of case A, B or C under the question.  <!-- event-driven -->
3. WHEN the legacy is `{}` and the player opens the reset dialog in chapter 3 THEN the line SHALL read `Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).`  <!-- event-driven -->
4. WHEN the legacy is `{10: 50}` and the player opens the reset dialog in chapter 5 THEN the line SHALL read `Este reset sobe o legado do capítulo 5 para 50%. O melhor legado continua 50% do capítulo 10.`  <!-- event-driven -->
5. WHEN the legacy is `{5: 100}` and the player opens the reset dialog in chapter 5 THEN the line SHALL read `O legado do capítulo 5 já está em 100%: este reset não muda o seu legado.`  <!-- event-driven -->
6. WHEN a reset succeeds THEN the game SHALL show the legacy of the answer at once, with no reload.  <!-- event-driven -->
7. IF `GET /account/legacy` fails or answers 404 THEN the game SHALL show neither the legacy line nor the dialog line, and the reset SHALL work as today.  <!-- unwanted-behavior -->

**Independent Test**: In the browser against the fake backend with legacy `{5: 100}`, the window reads `Legado: 100% do capítulo 5` and the dialog in chapter 5 reads case C.

---

## Edge Cases

- WHEN a player resets from chapter 2 with no legacy THEN the legacy SHALL be `{2: 50}` and a chapter 1 phase kill SHALL drop 4 to 12.
- WHEN the best legacy is 50 % of chapter 2 and the player is in chapter 8 THEN a chapter 8 phase kill (rule 22, 256 to 768) SHALL drop 258 to 774.
- WHEN two resets of one player are sent at once THEN the second SHALL be refused by `fromChapter` and the legacy SHALL rise once.
- WHEN a reset makes chapter `r` the best THEN the next wallet load SHALL re-roll the queues to the new ranges.
- WHEN a user is deleted THEN every `player_legacy` row of the user SHALL be deleted with it.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RLD-01 | P1: Legacy - AC 1 to 5; Best - AC 1 to 4 (domain rules) | Tasks T1 | Implementing |
| RLD-02 | P1: Legacy - AC 6 to 8 (storage, migration, reset writes it) | Tasks T2, T3 | Implementing |
| RLD-03 | P1: Best - AC 5 to 7 (API) | Tasks T3 | Implementing |
| RLD-04 | P1: Copper - AC 1 to 7 | Tasks T1, T4 | Implementing |
| RLD-05 | P1: Pieces - AC 1 to 5 | Tasks T1, T5 | Implementing |
| RLD-06 | P1: Display - AC 1 to 7 | Tasks T6, T7, T8, T9, T11 | Implementing |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Backend tests pin the legacy rules, the best choice, the copper ranges of the Legacy Table and the piece legacy with scripted chances.
- [ ] e2e tests show the legacy line, the three dialog cases and the update after a reset.
- [ ] The `account-reset`, wallet and equipment suites pass unchanged for players without legacy.
