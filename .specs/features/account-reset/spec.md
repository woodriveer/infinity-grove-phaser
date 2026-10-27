# Account Reset Specification

## Problem Statement

Crystals buy the auto click upgrades (AD-014), but nothing pays crystals yet, so nobody can upgrade. This feature adds the crystal source: from chapter 2 a player can reset the account. The campaign goes back to chapter 1 and the talents are wiped, and the player gets as many crystals as the chapter they left (2 to 5). Crystals and the auto click level survive the reset, and once a player has reset the auto click works from chapter 1.

With the prices 10/25/50/100 (185 crystals in total), the auto click reaches 50 ms after 37 resets at chapter 5, or 93 resets at chapter 2.

## Goals

- [ ] A player in chapter 2 or later, or with the campaign completed, can reset and receives `min(chapter, 5)` crystals.
- [ ] The reset brings the campaign back to chapter 1 stage 1 and removes every talent level and every talent point award, so first clears pay points again.
- [ ] Coins, equipment, cards, crystals and the auto click level are kept.
- [ ] A player who has reset at least once has the auto click from chapter 1.
- [ ] The game shows a `Resetar conta (+N cristais)` button with a confirmation that says what is lost and what is kept.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Resetting coins, equipment or cards | User choice: the reset clears only the campaign and the talents |
| Rewards beyond crystals (multipliers, prestige levels, permanent bonuses) | Not asked |
| Undoing a reset | Not asked |
| A cooldown or a daily limit on resets | Not asked; a reset needs the chapter 1 boss beaten again, which already takes time |
| Changing the starting element on reset | Not asked; the chapter order (AD-006) stays |
| Changing the auto click prices | They stay at 10/25/50/100 (`app.auto-click.prices`) |
| Gemini art for the button or the dialog | Text and CSS until the owner draws them |
| Translating existing English text | TD-001 (AD-007) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| What the reset clears | The campaign (`progress` back to chapter 1, stage 1, first phase, not completed), every `player_talents` row and every `talent_point_awards` row of the player, including `legacy` | User choice "Progresso da campanha, Talentos e pontos" | y |
| What the reset keeps | Coins (`wallets`, `wallet_drop_queues`), equipment, cards and heroes, crystals, the auto click level, the starting element | User choice; crystals and the auto click level are the point of the reset | y |
| Reward | `min(chapter, 5)` crystals: chapter 2 pays 2, chapter 5 pays 5, a completed campaign pays 5 | User: "no capitulo 2, ganha 2 cristais, no capitulo 5 ganha 5"; completed = 5 by user choice | y |
| When the reset is open | WHILE the campaign chapter is 2 or later, or the campaign is completed | User: "a partir do capitulo 2" | y |
| Auto click after a reset | The auto click is unlocked WHILE chapter ≥ 2, the campaign is completed, or the player has reset at least once. The backend stores a reset count per player | User choice "Libera após 1º reset" | y |
| Confirmation | A DOM dialog with the text of US-2 AC-3 and the buttons `Resetar` and `Cancelar` | User choice "Botão com confirmação" | y |
| Where the button sits | In the auto click box of the HUD, under the crystals: crystals are earned and spent in the same place | Agent default; the HUD box already shows `Cristais: <n>` | n |
| Idempotency | The request carries the chapter the player saw (`fromChapter`); any other stored chapter answers 409 `RESET_CHAPTER_MISMATCH` with the stored progress, so a double click resets once | Same pattern as `fromLevel` (AD-011, AD-014) | n |
| Lock | The reset takes the `progress` row lock (first of the lock order `progress`, `player_cards`, `wallets`) | Serialises with outcome reports, talent upgrades and auto click upgrades, which take the same lock | n |
| Reward formula in the game | The game computes `min(chapter, 5)` to label the button, mirroring the backend like the campaign rules (AD-004); the backend answer is the truth | The label must not wait for a request at every chapter change | n |
| Reports in flight | After a successful reset the game drops queued outcome reports of the old position and restarts the fight scene from the progress the backend answered. A report that still reaches the server gets the existing 409 position mismatch | A report from chapter 5 must not move the new chapter 1 campaign | n |
| Errors | 409 `RESET_LOCKED` (chapter 1, not completed), 409 `RESET_CHAPTER_MISMATCH` (body: stored progress), 400 `INVALID_RESET_REQUEST` (missing or non-integer `fromChapter`) | Same family as the auto click errors | n |
| Chapter boss daily limit and farm spacing | Unchanged by the reset (AD-005) | They count wins per UTC day, not progress | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Reset the account for crystals ⭐ MVP

**User Story**: As a player who has beaten chapter 1, I want to reset my account for crystals so that I can buy faster auto clicks.

**Why P1**: It is the crystal source the auto click upgrades wait for.

**Acceptance Criteria**:

1. WHEN a player whose campaign is in chapter N (2 ≤ N ≤ 5, not completed) asks to reset with `fromChapter` N THEN the backend SHALL add N crystals to the balance.
2. WHEN a player whose campaign is completed asks to reset with `fromChapter` 5 THEN the backend SHALL add 5 crystals to the balance.
3. WHEN a reset is applied THEN the backend SHALL set the progress to chapter 1, stage 1, the first phase, not completed.
4. WHEN a reset is applied THEN the backend SHALL delete every talent level of the player, so every talent is at level 0.
5. WHEN a reset is applied THEN the backend SHALL delete every talent point award of the player, so the available points are 0 and the next first clear of each position pays again.
6. WHEN a reset is applied THEN the backend SHALL keep the coins, the equipment pieces, the cards, the auto click level and the existing crystals.
7. WHEN a reset is applied THEN the backend SHALL raise the player's reset count by 1.
8. WHEN a reset is applied THEN the backend SHALL answer 200 with `{ reward, crystals, resets, progress }`, where `progress` has the same shape as the progress endpoint.
9. IF the campaign is in chapter 1 and not completed THEN the backend SHALL answer 409 `RESET_LOCKED` and change nothing.
10. IF `fromChapter` differs from the stored chapter THEN the backend SHALL answer 409 `RESET_CHAPTER_MISMATCH` with the stored progress and change nothing.
11. IF `fromChapter` is missing or is not an integer THEN the backend SHALL answer 400 `INVALID_RESET_REQUEST`.
12. WHEN two reset requests with the same `fromChapter` arrive together THEN the backend SHALL apply exactly one; the other SHALL answer 409 `RESET_CHAPTER_MISMATCH`.
13. WHEN a reset is applied THEN the backend SHALL log at info the username, the chapter left, the reward, the new crystal balance and the new reset count; WHEN one is refused THEN it SHALL log the username, the reason and the stored chapter at warn.

**Independent Test**: A backend integration test puts a player at chapter 3 with 4 crystals, auto click level 1, 2 talent levels and 900 copper, then posts a reset with `fromChapter` 3: the answer is `reward` 3, `crystals` 7, `resets` 1, progress chapter 1 stage 1; the talent tree shows every level at 0 and 0 points; the wallet still shows 900 copper and the auto click is still level 1.

---

### P1: Reset button with confirmation ⭐ MVP

**User Story**: As a player, I want to see how many crystals a reset gives and confirm it so that I do not reset by accident.

**Why P1**: A reset cannot be undone.

**Acceptance Criteria**:

1. WHILE the campaign chapter is 2 or later, or the campaign is completed, the game SHALL show a button `Resetar conta (+N cristais)` in the auto click box, with N = `min(chapter, 5)`.
2. WHILE the campaign chapter is 1 and not completed, the game SHALL hide the reset button.
3. WHEN the player presses the reset button THEN the game SHALL open a dialog with the text `Resetar a conta? Você volta ao capítulo 1 e perde todos os talentos e pontos de talento. Moedas, equipamentos, cartas, cristais e o auto clique são mantidos. Você ganha N cristais.` and the buttons `Resetar` and `Cancelar`.
4. WHEN the player presses `Cancelar` THEN the game SHALL close the dialog and send no request.
5. WHEN the player presses `Resetar` THEN the game SHALL send the reset with the chapter it shows and disable `Resetar` until the answer arrives.
6. WHEN the reset answers 200 THEN the game SHALL close the dialog, show `Cristais: <crystals>` with the answered balance, show the notice `+N cristais` for 3 s with the answered reward, and restart the fight at the answered progress.
7. WHEN the reset answers 200 THEN the game SHALL show every talent at level 0 and 0 available points on the Talentos screen and its red dot.
8. IF the reset answers 409 `RESET_CHAPTER_MISMATCH` or `RESET_LOCKED` THEN the game SHALL close the dialog, realign the campaign to the stored progress and keep the crystals it showed.
9. IF the reset request fails (network error or 5xx) THEN the game SHALL keep the dialog open, enable `Resetar` again and show `Não foi possível resetar. Tente de novo.` in the dialog.
10. WHILE the dialog is open, a click on the dialog SHALL NOT hit the monster.

**Independent Test**: With a stubbed campaign at chapter 4, the HUD shows `Resetar conta (+4 cristais)`; pressing it opens the dialog with "Você ganha 4 cristais."; `Cancelar` closes it with no request.

---

### P1: Auto click after a reset ⭐ MVP

**User Story**: As a player who has reset, I want the auto click from the first chapter so that the crystals I spent pay off at once.

**Why P1**: Without it the auto click is idle for the whole of chapter 1 after every reset.

**Acceptance Criteria**:

1. WHEN the game asks for the auto click state THEN the backend SHALL also answer the player's reset count as `resets`.
2. WHILE the reset count is at least 1, the game SHALL treat the auto click as unlocked in chapter 1: show the switch and fire auto clicks at the level's interval.
3. WHILE the reset count is at least 1 and the campaign is in chapter 1, the backend SHALL accept an auto click upgrade (no 409 `AUTO_CLICK_LOCKED`).
4. WHILE the reset count is 0 and the campaign is in chapter 1, the game and the backend SHALL keep the auto click locked as before (spec auto-click).
5. WHEN a reset answers 200 THEN the game SHALL keep the auto click running in the restarted chapter 1 fight without reloading the page.

**Independent Test**: A backend integration test resets a chapter 2 player with 10 crystals in total after the reward, then upgrades the auto click from level 0 while in chapter 1: the answer is level 1, 250 ms.

---

## Edge Cases

- WHEN a player at chapter 5 who has not beaten the boss resets THEN the backend SHALL pay 5, the same as a completed campaign.
- WHEN a reset is applied THEN the reset count SHALL count every reset, not only the first (a second reset leaves `resets` 2).
- IF the player has no `player_crystals` row THEN the reset SHALL create it with the reward.
- IF the player has no talent rows or no award rows THEN the reset SHALL succeed and delete nothing from those tables.
- WHEN a reset is applied while the farm screen is open THEN the farm SHALL list only the chapter 1 bosses the next time it opens (AD-008).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RESET-01 | P1: Reset for crystals - AC 1, 2 (reward) | Design | Pending |
| RESET-02 | P1: Reset for crystals - AC 3 (progress to 1-1) | Design | Pending |
| RESET-03 | P1: Reset for crystals - AC 4, 5 (talents and awards wiped) | Design | Pending |
| RESET-04 | P1: Reset for crystals - AC 6 (kept state) | Design | Pending |
| RESET-05 | P1: Reset for crystals - AC 7, 8 (count and answer) | Design | Pending |
| RESET-06 | P1: Reset for crystals - AC 9, 10, 11 (errors) | Design | Pending |
| RESET-07 | P1: Reset for crystals - AC 12 (concurrency) | Design | Pending |
| RESET-08 | P1: Reset for crystals - AC 13 (logs) | Design | Pending |
| RESET-09 | P1: Reset button - AC 1, 2 (button and label) | Design | Pending |
| RESET-10 | P1: Reset button - AC 3, 4, 5, 10 (dialog) | Design | Pending |
| RESET-11 | P1: Reset button - AC 6, 7 (success) | Design | Pending |
| RESET-12 | P1: Reset button - AC 8, 9 (failures) | Design | Pending |
| RESET-13 | P1: Auto click after reset - AC 1, 3, 4 (backend unlock) | Design | Pending |
| RESET-14 | P1: Auto click after reset - AC 2, 4, 5 (game unlock) | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks, 14 unmapped ⚠️

---

## Success Criteria

- [ ] A player can go from 0 crystals to auto click level 1 with two resets at chapter 5.
- [ ] No reset ever changes the coins, equipment, cards or auto click level of a player.
- [ ] A double click on `Resetar` pays the reward once.
