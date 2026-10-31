# Bulk Sell Specification

## Problem Statement

The bag holds up to 100 pieces and bosses drop one on every win (AD-008), so it fills with COMMON and UNCOMMON pieces the player will never wear. Today each sale takes three clicks and one request per piece (tile, `Vender`, back to the list), so clearing 30 pieces costs about 90 clicks. The `equipment` spec deferred bulk selling as polish; the owner now asks for it: "poder selecionar mais de um item para vender ao mesmo tempo".

## Goals

- [ ] The player selects several bag pieces and sells them with one confirmation and one request: N pieces take N + 3 clicks (`Vender várias`, N tiles, `Vender selecionadas`, `Sim, vender`).
- [ ] Every bag piece of one rarity is selected with one click, so selling all COMMON pieces takes 4 clicks whatever their number.
- [ ] A batch sale is all-or-nothing on the server: either every listed piece is sold and paid once, or nothing changes.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Selling hero cards | Cards have no sell price; duplicates already feed the fusion (`characters`) |
| Selecting worn pieces in the bulk mode | A worn piece is the player's build; the single `Vender` of the piece detail still sells it (EQP-41) |
| A `Selecionar tudo` button | The rarity buttons cover the common case; selling the whole bag at once is the riskiest click (pending decision D4) |
| Item lock / favourite pieces | Still deferred, as in `equipment` |
| Undo or buyback of a sale | No sale history exists; the confirmation step is the guard |
| Automatic selling rules (sell every COMMON drop) | Not asked |
| Sorting and filtering the bag | Not asked (same as `equipment-ui`) |
| A database migration | The sale deletes `equipment_pieces` rows and credits `wallets` like the single sale; no column or table changes (AD-016 not triggered) |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear. Rows marked `n` are defaults chosen by the product owner and wait for the user's approval.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Which pieces can be selected | Only bag pieces (no `heroId`). In selection mode the worn tiles are disabled. The server still accepts a worn id and sells it after leaving the slot empty, the same rule as the single sale (EQP-41) | Selling a worn piece by accident breaks the build and changes the leader's damage; one server rule for both sale paths | n |
| D2 Hero cards | Not part of the feature | Cards have no price and are consumed by the fusion | n |
| D3 Confirmation | Always: `Vender <k> peças por <total>?` (`Vender 1 peça por <total>?` for one) with `Sim, vender` and `Não`; no request before `Sim, vender` | A batch sale cannot be undone; one extra click is cheap next to the clicks saved | n |
| D4 Shortcuts | P2: five rarity buttons (`Comum` to `Lendário`) that select every bag piece of that rarity, and unselect them when all were selected. No `Selecionar tudo` | Covers "sell all the junk" in one click without making the whole bag one click away | n |
| D5 Batch size | 1 to 100 ids per request (`SellBatch.MAX_SIZE = 100`, the bag capacity); 0, more than 100 or a repeated id is 400 `INVALID_SELL_BATCH` | A player never owns more than 100 pieces, so a valid client never needs two requests | n |
| D6 Atomicity | All-or-nothing: one id that is missing or belongs to another account answers 404 `EQUIPMENT_NOT_FOUND` and sells nothing | A half-done sale leaves the player unsure what was sold; one transaction under the player lock (AD-009) costs nothing extra | n |
| D7 Repeated id | Rejected with 400, never deduplicated | The game never sends one; a repeat is a client bug the server should surface | n |
| D8 After the sale | Success: selection mode ends, the bag shows without the sold pieces and the notice `<n> peças vendidas por <total>` (`1 peça vendida por <total>`). Failure: the list is read again, the error line `Não foi possível concluir a ação.` shows, selection mode stays with only the selected pieces still in the bag | Success needs a visible receipt; after a failure the player can retry without picking again | n |
| D9 Warning for EPIC and LEGENDARY pieces | No extra warning; the question shows the count and the total | The tiles show the rarity frame; the total of a LEGENDARY piece is visibly larger | n |
| D10 Entry point and labels | Button `Vender várias` beside `Mochila (<n>)`; bar texts `Selecionadas: <k> · Total: <total>` (middle dot U+00B7), `Vender selecionadas`, `Cancelar`; the check mark `✓` on a selected tile | Lesson L-010: every on-screen text is stated in full | n |
| D11 Request order | The game sends the selected ids in the order of the bag, not the order of the clicks | Deterministic request; tests can pin it | n |
| D12 Response | `POST /equipment/sell` answers `{ equipment, wallet, sold, earned }`; `sold` (int) and `earned` (copper, long) are always present | The notice uses the server's numbers, not a client sum (AD-009); lesson L-018: no absent-vs-null ambiguity | n |
| Sell price | Same rule as the single sale: `100 * rarity index * (1 + 0.5 * refine)` copper, rounded down (`equipment` spec) | Existing rule, unchanged | y |
| Player-facing text | Portuguese | AD-007 | y |
| Single sale | `POST /equipment/{id}/sell` and the `Vender (<preço>)` button of the piece detail stay as they are | Existing behaviour (EQP-40 to EQP-43) | y |

**Open questions:** none - all resolved or logged above (D1 to D12 wait for the user's approval).

---

## User Stories

### P1: Sell a batch of pieces (server) ⭐ MVP

**User Story**: As a player, I want the server to sell several of my pieces in one request so that a bulk sale is fast and never half done.

**Why P1**: The screen needs it, and the server owns sales (AD-009).

**Acceptance Criteria**:

1. WHEN an authenticated player posts `POST /equipment/sell` with `{"pieceIds": [...]}` holding 1 to 100 distinct ids of pieces they own THEN the server SHALL delete every listed piece, credit the sum of their sell prices to the wallet and answer 200 with `equipment` (the remaining pieces and the capacity), `wallet` (gold, silver, copper), `sold` (number of pieces deleted) and `earned` (copper credited), in one transaction.  <!-- event-driven -->
2. The server SHALL price each piece of the batch with the single-sale rule, so a COMMON +0, a RARE +4 and an UNCOMMON +0 sold together on a wallet of 50 copper answer `sold` 3, `earned` 1200 and a wallet of 0 gold, 12 silver, 50 copper.  <!-- ubiquitous -->
3. IF a listed piece is worn by a hero THEN the server SHALL leave that hero's slot empty and sell the piece in the same batch.  <!-- unwanted-behavior -->
4. IF any listed id does not exist or belongs to another account THEN the server SHALL answer 404 with code `EQUIPMENT_NOT_FOUND`, delete no piece and credit no copper.  <!-- unwanted-behavior -->
5. IF `pieceIds` is empty, holds more than 100 ids or repeats an id THEN the server SHALL answer 400 with code `INVALID_SELL_BATCH` and change nothing.  <!-- unwanted-behavior -->
6. IF the body has no `pieceIds` field, or `pieceIds` is not a list, or one of its items is not a string THEN the server SHALL answer 400 and change nothing.  <!-- unwanted-behavior -->
7. IF an unauthenticated request reaches `POST /equipment/sell` THEN the server SHALL answer 401.  <!-- unwanted-behavior -->
8. IF two sale requests of the same player arrive at once THEN the server SHALL run them one after the other under the `player_cards` row lock, so a piece is paid at most once and a batch whose pieces were already sold answers 404 and credits nothing.  <!-- unwanted-behavior -->
9. The server SHALL keep `POST /equipment/{id}/sell` working as specified by EQP-40 to EQP-42.  <!-- ubiquitous -->

**Independent Test**: Against the API, sell `["c","r","u"]` (COMMON +0, RARE +4, UNCOMMON +0) from a wallet of 50 copper and read 200, `sold` 3, `earned` 1200, 1250 copper stored and the three rows gone; send `["c","ghost"]` and read 404 with nothing changed.

---

### P1: Select pieces in the bag ⭐ MVP

**User Story**: As a player, I want to mark several bag pieces at once so that I choose what to sell without opening each piece.

**Why P1**: The direct request of the owner.

**Acceptance Criteria**:

1. WHILE the bag holds at least one unworn piece and selection mode is off the Equipamento window SHALL show the button `Vender várias` (`data-testid="bulk-sell-start"`) in the bag header beside the title `Mochila (<n>)`.  <!-- state-driven -->
2. IF the bag holds no unworn piece THEN the game SHALL show no `Vender várias` button.  <!-- unwanted-behavior -->
3. WHEN the player clicks `Vender várias` THEN the game SHALL enter selection mode: show the bar `data-testid="bulk-sell-bar"` with the summary `Selecionadas: 0 · Total: 0 cobre`, the buttons `Vender selecionadas` and `Cancelar`, and hide `Vender várias`.  <!-- event-driven -->
4. WHILE selection mode is on, WHEN the player clicks a bag tile THEN the game SHALL select the piece if it was not selected and unselect it if it was, and SHALL NOT open the piece detail.  <!-- complex -->
5. WHILE selection mode is on each bag tile SHALL carry `aria-pressed="true"`, the class `is-selected` and a check mark `✓` (`.piece-check`) when its piece is selected, and `aria-pressed="false"` with neither the class nor the check mark when it is not; outside selection mode a tile SHALL carry no `aria-pressed`.  <!-- state-driven -->
6. WHEN the selection changes THEN the summary (`data-testid="bulk-sell-summary"`) SHALL read `Selecionadas: <k> · Total: <total>`, where k is the number of selected bag pieces and total is the sum of their `sellPrice` written by `formatCopper` (2 COMMON +0 and 1 UNCOMMON +0 read `Selecionadas: 3 · Total: 4 prata`).  <!-- event-driven -->
7. WHILE selection mode is on `Vender selecionadas` (`data-testid="bulk-sell-submit"`) SHALL be enabled when at least one piece is selected and disabled when none is.  <!-- state-driven -->
8. WHILE selection mode is on the worn tiles SHALL be disabled and carry the class `is-locked`, and no `Transferir conjunto` button SHALL show.  <!-- state-driven -->
9. WHEN the player clicks `Cancelar` (`data-testid="bulk-sell-cancel"`) THEN the game SHALL leave selection mode, clear the selection and show `Vender várias` again, and a later click on a bag tile SHALL open the piece detail.  <!-- event-driven -->
10. WHEN the window is closed or another screen is opened THEN the game SHALL leave selection mode, so the next Equipamento view shows `Vender várias` and no selected tile.  <!-- event-driven -->

**Independent Test**: In the browser, click `Vender várias`, click two bag tiles and read both marked with `✓` and the summary with their total; click `Cancelar` and read the bag back to normal.

---

### P1: Confirm and sell ⭐ MVP

**User Story**: As a player, I want to confirm the batch and see what I earned so that I never sell by accident and I know the result.

**Why P1**: Without it the selection does nothing.

**Acceptance Criteria**:

1. WHEN the player clicks `Vender selecionadas` THEN the game SHALL show the confirmation `data-testid="bulk-sell-confirm"` with the question `Vender <k> peças por <total>?` (`Vender 1 peça por <total>?` when k is 1, `data-testid="bulk-sell-question"`) and the buttons `Sim, vender` (`bulk-sell-confirm-yes`) and `Não` (`bulk-sell-confirm-no`), and SHALL send no request.  <!-- event-driven -->
2. WHILE the confirmation shows the bag tiles and the rarity buttons SHALL be disabled and `Vender selecionadas` and `Cancelar` SHALL not show.  <!-- state-driven -->
3. WHEN the player clicks `Não` THEN the game SHALL hide the confirmation, show `Vender selecionadas` and `Cancelar` again and keep the selection.  <!-- event-driven -->
4. WHEN the player clicks `Sim, vender` THEN the game SHALL send one `POST /equipment/sell` whose `pieceIds` are the selected ids in the order of the bag, and SHALL disable every button of the Equipamento window until the answer arrives.  <!-- event-driven -->
5. WHEN the sale succeeds THEN the game SHALL leave selection mode and show the bag without the sold pieces, the title `Mochila (<n>)` with the new count, the notice `<sold> peças vendidas por <earned>` (`1 peça vendida por <earned>` when sold is 1, `data-testid="equip-sell-notice"`) from the server's `sold` and `earned`, and the wallet the server answered.  <!-- event-driven -->
6. IF the sale fails THEN the game SHALL read the equipment again from the server, show the error line `Não foi possível concluir a ação.`, stay in selection mode and keep selected only the selected pieces that are still in the bag.  <!-- unwanted-behavior -->

**Independent Test**: Select a COMMON +0 and an UNCOMMON +0 with 50 copper in the wallet, confirm, and read `2 peças vendidas por 3 prata`, `Mochila` two lower and the wallet at 3 silver 50 copper.

---

### P2: Select by rarity

**User Story**: As a player, I want to select every piece of one rarity with one click so that clearing the junk takes four clicks.

**Why P2**: Saves many clicks, but picking tiles one by one already works.

**Acceptance Criteria**:

1. WHILE selection mode is on the bar SHALL show five buttons `Comum`, `Incomum`, `Raro`, `Épico`, `Lendário` in that order (`data-testid="bulk-sell-rarity-<RARITY>"`).  <!-- state-driven -->
2. WHEN the player clicks a rarity button and at least one bag piece of that rarity is not selected THEN the game SHALL select every bag piece of that rarity and keep the other selected pieces.  <!-- event-driven -->
3. WHEN the player clicks a rarity button and every bag piece of that rarity is selected THEN the game SHALL unselect the bag pieces of that rarity and keep the other selected pieces.  <!-- event-driven -->
4. IF the bag holds no piece of a rarity THEN its button SHALL be disabled.  <!-- unwanted-behavior -->
5. WHILE every bag piece of a rarity is selected and the bag holds at least one of them its button SHALL carry `aria-pressed="true"`, and `aria-pressed="false"` otherwise.  <!-- state-driven -->

**Independent Test**: With 2 COMMON and 1 UNCOMMON in the bag, click `Comum` and read `Selecionadas: 2 · Total: 2 prata`; click it again and read `Selecionadas: 0 · Total: 0 cobre`.

---

## Edge Cases

- WHEN the sale sells the last piece the player owns THEN the game SHALL show `Nenhum equipamento ainda. Vença chefes para encontrar peças.` with the sell notice above it (BSL-24).
- WHEN the sale sells the last bag piece while heroes still wear pieces THEN the game SHALL show `Mochila (0)` and no `Vender várias` button (BSL-11, BSL-24).
- IF the player clicks `Sim, vender` twice THEN the game SHALL send one request (BSL-23).
- IF a selected piece was already sold elsewhere (another tab) THEN the server SHALL answer 404 and the game SHALL follow the failure path, dropping that piece from the selection (BSL-04, BSL-25).
- WHEN a piece drops while selection mode is on THEN the next redraw SHALL show it unselected and SHALL keep the pieces already selected (BSL-14).
- WHEN the answer of a sale arrives after the window was closed THEN the game SHALL draw nothing (BSL-19).

---

## Requirement Traceability

IDs follow the order of the criteria: BSL-01 to BSL-09 for "Sell a batch of pieces", BSL-10 to BSL-19 for "Select pieces in the bag", BSL-20 to BSL-25 for "Confirm and sell", BSL-26 to BSL-30 for "Select by rarity".

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BSL-01 | P1: Sell a batch of pieces | T3, T4 | Implementing |
| BSL-02 | P1: Sell a batch of pieces | T3, T4 | Implementing |
| BSL-03 | P1: Sell a batch of pieces | T2, T3, T4 | Implementing |
| BSL-04 | P1: Sell a batch of pieces | T2, T3, T4 | Implementing |
| BSL-05 | P1: Sell a batch of pieces | T1, T3, T4 | Implementing |
| BSL-06 | P1: Sell a batch of pieces | T4 | Pending |
| BSL-07 | P1: Sell a batch of pieces | T4 | Pending |
| BSL-08 | P1: Sell a batch of pieces | T3, T4 | Implementing |
| BSL-09 | P1: Sell a batch of pieces | T4 | Pending |
| BSL-10 | P1: Select pieces in the bag | T9, T11, T12 | Pending |
| BSL-11 | P1: Select pieces in the bag | T9, T11, T12 | Pending |
| BSL-12 | P1: Select pieces in the bag | T8, T9, T10, T11, T12 | Pending |
| BSL-13 | P1: Select pieces in the bag | T9, T10, T12 | Pending |
| BSL-14 | P1: Select pieces in the bag | T7, T9, T10, T11, T12 | Pending |
| BSL-15 | P1: Select pieces in the bag | T7, T8, T9, T12 | Pending |
| BSL-16 | P1: Select pieces in the bag | T8, T10, T12 | Pending |
| BSL-17 | P1: Select pieces in the bag | T9, T10, T11, T12 | Pending |
| BSL-18 | P1: Select pieces in the bag | T10, T12 | Pending |
| BSL-19 | P1: Select pieces in the bag | T10, T12 | Pending |
| BSL-20 | P1: Confirm and sell | T7, T8, T10, T12 | Pending |
| BSL-21 | P1: Confirm and sell | T8, T9, T10, T12 | Pending |
| BSL-22 | P1: Confirm and sell | T10, T12 | Pending |
| BSL-23 | P1: Confirm and sell | T5, T7, T10, T12 | Implementing |
| BSL-24 | P1: Confirm and sell | T6, T7, T9, T10, T12 | Implementing |
| BSL-25 | P1: Confirm and sell | T6, T7, T10, T12 | Implementing |
| BSL-26 | P2: Select by rarity | T8, T11, T12 | Pending |
| BSL-27 | P2: Select by rarity | T7, T10, T12 | Pending |
| BSL-28 | P2: Select by rarity | T7, T10, T12 | Pending |
| BSL-29 | P2: Select by rarity | T7, T8, T12 | Pending |
| BSL-30 | P2: Select by rarity | T7, T8, T12 | Pending |

**ID format:** `BSL-<NN>`

**Coverage:** 30 total, 30 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Selling every COMMON piece of the bag takes 4 clicks (`Vender várias`, `Comum`, `Vender selecionadas`, `Sim, vender`) and one request, whatever the number of pieces.
- [ ] An integration test that sends the same batch twice at once reads one 200, one 404 and the copper credited once.
- [ ] No batch request changes the bag or the wallet when it answers 400 or 404.
