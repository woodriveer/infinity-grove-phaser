# Auto Click Specification

## Problem Statement

Every hit on a monster needs a click, so a player who has beaten the first chapter still has to click nonstop to progress. This feature adds an auto click that opens after chapter 1: it clicks for the player at a fixed interval, so clicking by hand becomes optional. The interval gets faster through four upgrades bought with a new special currency, the crystal. How crystals are earned is not decided yet (the owner is thinking of an account reset); until then nobody has crystals and the upgrades cannot be bought.

## Goals

- [ ] A player whose campaign is past chapter 1 gets an auto click that hits the monster every 500 ms with the same effect as a manual click.
- [ ] The player turns the auto click on and off with a HUD switch; the choice is kept in the browser.
- [ ] The backend owns the crystal balance and the auto click level (AD-009, AD-011); four upgrades lower the interval to 250, 150, 100 and 50 ms for 10, 25, 50 and 100 crystals.
- [ ] The game shows the crystal balance, the current interval and the next upgrade with its price.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Any way to earn crystals (account reset / prestige, drops, rewards) | Owner decision still open; a later feature adds the source |
| Buying crystals with coins or real money | Not asked |
| Refunding or downgrading an auto click level | Not asked |
| Auto use of skills | The auto click replaces the click only |
| Server-side check of the click rate | Combat runs in the browser (AD-002) |
| Gemini art for the crystal and the switch | Text and CSS until the owner draws the icons |
| Translating existing English text | TD-001 (AD-007) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Crystal source | None in this feature; every player has 0 crystals, so no upgrade can be bought in play. Backend integration tests set the balance in the database | User: "deixe isso em aberto. por hora ele não pode fazer upgrade" | y |
| Speed levels | Level 0 = 500 ms, 1 = 250 ms, 2 = 150 ms, 3 = 100 ms, 4 = 50 ms (max) | User request | y |
| Upgrade prices | Level 0→1: 10, 1→2: 25, 2→3: 50, 3→4: 100 crystals; backend settings, not typed in the game | User choice "10/25/50/100"; the game types no catalog number (AD-011) | y |
| What an auto click does | Exactly what a manual click does: same damage builder, combo step, critical roll and Lyra's double critical click (AD-012) | User choice "Clique completo" | y |
| When it is unlocked | WHILE the campaign chapter reported by the backend is 2 or higher, or the campaign is completed. In the farm the same rule applies, since the farm only lists bosses of the current chapter | "após o primeiro capítulo" = after the chapter 1 boss is beaten, which opens chapter 2 (AD-008) | n |
| Switch | A HUD checkbox labelled `Auto clique`, on by default, the choice stored in `localStorage`; hidden while locked | User choice "Sim, botão no HUD" | y |
| Timing | Driven by the scene frame time: elapsed fight time accumulates and one auto click fires every time it reaches the interval, at most 5 per frame, the rest of the time kept. Paused frames add nothing | Freezes with the pause like the combo; the 5-per-frame cap stops a burst after a stalled tab | n |
| Damage text position | The auto click shows its damage number above the monster centre (`MONSTER.x`) | There is no pointer | n |
| Upgrade lock | The upgrade locks the player's `progress` row (first of the lock order `progress`, `player_cards`, `wallets`) | Serialises with the chapter check and a future crystal award | n |
| Idempotency | The upgrade request carries the level the player saw (`fromLevel`); a stale one answers 409 `AUTO_CLICK_LEVEL_MISMATCH` | Same as talents (AD-011): a double click must not buy two levels | n |
| Errors | 409 `NOT_ENOUGH_CRYSTALS`, 409 `AUTO_CLICK_MAX_LEVEL`, 409 `AUTO_CLICK_LOCKED` (chapter 1), 409 `AUTO_CLICK_LEVEL_MISMATCH`, 400 `INVALID_AUTO_CLICK_REQUEST` (missing or negative `fromLevel`) | Same family as the talent errors | n |
| Kill allowance | Unchanged: kills faster than `kill-interval-ms` lose their coins as today (AD-002) | A fast auto click is no different from fast manual clicks | n |
| Load failure | IF the auto click state cannot be loaded, the game runs the auto click at 500 ms and hides the upgrade button | The player keeps the base feature offline | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Auto click after chapter 1 ⭐ MVP

**User Story**: As a player who has beaten chapter 1, I want the game to click for me so that I only click when I want to.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHILE the campaign chapter is 2 or higher (or the campaign is completed), the switch is on, the fight is not paused and a living monster is on screen, the game SHALL perform one auto click every time 500 ms of fight time pass at auto click level 0.
2. WHILE the campaign chapter is 1, the game SHALL perform no auto click and SHALL hide the `Auto clique` switch.
3. WHEN an auto click fires THEN the game SHALL apply the same hit as a manual click: one combo step, the leader attacker damage, the critical roll and Lyra's double critical click.
4. WHEN an auto click fires THEN the game SHALL show its damage number at the monster centre `x`.
5. WHILE the fight is paused, the game SHALL add no time to the auto click and SHALL fire no auto click.
6. WHILE there is no monster or the monster is dead, the game SHALL fire no auto click.
7. IF a single frame carries enough time for more than 5 auto clicks THEN the game SHALL fire 5 and keep the rest of the time.
8. WHEN the player clicks by hand while the auto click runs THEN the game SHALL apply the manual click as well, without resetting the auto click time.
9. WHEN the chapter 1 boss is beaten and chapter 2 starts THEN the game SHALL show the switch and start the auto click without reloading.

**Independent Test**: With a campaign at chapter 2 and the switch on, advance the scene 1000 ms with no click: the monster takes 2 click hits and the combo shows 2.

---

### P1: Switch on the HUD ⭐ MVP

**User Story**: As a player, I want to turn the auto click off so that I can play by hand.

**Why P1**: The user asked for it.

**Acceptance Criteria**:

1. WHILE the auto click is unlocked, the game SHALL show a checkbox labelled `Auto clique` on the HUD.
2. The switch SHALL be on the first time a player sees it.
3. WHEN the player turns the switch off THEN the game SHALL fire no auto click until it is turned on again.
4. WHEN the player turns the switch on or off THEN the game SHALL store the choice in `localStorage` and SHALL restore it the next time the fight scene opens.
5. IF `localStorage` cannot be read or written THEN the game SHALL keep the switch on and keep playing.
6. WHEN the player clicks the switch THEN the click SHALL NOT hit the monster.

**Independent Test**: Uncheck `Auto clique`, advance 1000 ms: no hit. Reopen the scene: the switch is still off.

---

### P2: Crystals and speed upgrades

**User Story**: As a player, I want to spend crystals to make the auto click faster so that progress speeds up.

**Why P2**: No crystal can be earned yet, so the upgrade cannot happen in play; it is ready for the crystal source.

**Acceptance Criteria**:

1. The backend SHALL store per player a crystal balance (0 for every player, new or existing) and an auto click level from 0 to 4 (0 for every player).
2. WHEN the game asks for the auto click state THEN the backend SHALL answer the crystals, the level, the current interval in ms and the next upgrade `{ level, intervalMs, price }`, or `null` for the next upgrade at level 4.
3. The interval SHALL be 500, 250, 150, 100 and 50 ms for levels 0, 1, 2, 3 and 4.
4. The price of the upgrade to levels 1, 2, 3 and 4 SHALL be 10, 25, 50 and 100 crystals.
5. WHEN a player in chapter 2 or later with enough crystals asks to upgrade from the level they hold THEN the backend SHALL take the price from the crystals, raise the level by 1 and answer the new state.
6. IF the player holds fewer crystals than the price THEN the backend SHALL answer 409 `NOT_ENOUGH_CRYSTALS` and change nothing.
7. IF the player is at level 4 THEN the backend SHALL answer 409 `AUTO_CLICK_MAX_LEVEL` and change nothing.
8. IF the player's campaign is in chapter 1 THEN the backend SHALL answer 409 `AUTO_CLICK_LOCKED` and change nothing.
9. IF `fromLevel` differs from the stored level THEN the backend SHALL answer 409 `AUTO_CLICK_LEVEL_MISMATCH` with the stored state and change nothing.
10. IF `fromLevel` is missing or negative THEN the backend SHALL answer 400 `INVALID_AUTO_CLICK_REQUEST`.
11. WHEN two upgrade requests from the same level arrive together THEN the backend SHALL apply exactly one.
12. WHEN an upgrade is applied or rejected THEN the backend SHALL log the username, the levels and the crystals at info (applied) or warn (rejected).
13. WHILE the auto click level is N, the game SHALL use the interval the backend answered for level N.

**Independent Test**: Backend integration test sets a player at chapter 2 with 10 crystals, upgrades from level 0: the answer is level 1, 250 ms, 0 crystals, next `{ level: 2, intervalMs: 150, price: 25 }`.

---

### P2: Crystals and upgrade on the HUD

**User Story**: As a player, I want to see my crystals and the next upgrade so that I know what to aim for.

**Why P2**: Pairs with the backend story.

**Acceptance Criteria**:

1. WHILE the auto click is unlocked, the game SHALL show next to the switch the current interval as `<interval> ms` (e.g. `500 ms`).
2. WHILE the auto click state is loaded, the game SHALL show the balance as `Cristais: <n>` next to the switch.
3. WHILE a next upgrade exists, the game SHALL show a button `Melhorar: <intervalMs> ms (<price> cristais)` (e.g. `Melhorar: 250 ms (10 cristais)`).
4. WHILE the crystals are fewer than the price, the upgrade button SHALL be disabled.
5. WHILE the level is 4, the game SHALL show no upgrade button.
6. WHEN the player presses an enabled upgrade button THEN the game SHALL send the upgrade with the level it shows, disable the button until the answer arrives and then show the answered state and use its interval.
7. IF the upgrade answers 409 THEN the game SHALL show the state the backend returned (or reload it) and keep the current interval.
8. IF the auto click state cannot be loaded THEN the game SHALL use 500 ms and hide the crystals and the upgrade button.

**Independent Test**: With a stubbed state of 0 crystals at level 0, the HUD shows `500 ms`, `Cristais: 0` and a disabled `Melhorar: 250 ms (10 cristais)`.

---

## Edge Cases

- IF the monster dies mid-frame during a burst of auto clicks THEN the game SHALL fire no further auto click on the dead monster.
- WHEN the player leaves the fight scene THEN the game SHALL stop the auto click with it.
- WHEN a boss countdown runs out (FAILED) and the fight goes back to the last phase THEN the auto click SHALL keep running on the new monster.
- IF the backend answers the progress with a chapter 2 or higher for a player who had loaded chapter 1 THEN the switch SHALL appear on the next realign.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTO-01 | P1: Auto click after chapter 1 (AC 1, 5, 6, 7) - timing rule | Design | Pending |
| AUTO-02 | P1: Auto click after chapter 1 (AC 2, 9) - unlock by chapter | Design | Pending |
| AUTO-03 | P1: Auto click after chapter 1 (AC 3, 4, 8) - hit equals a manual click | Design | Pending |
| AUTO-04 | P1: Switch on the HUD (AC 1-6) | Design | Pending |
| AUTO-05 | P2: Crystals and speed upgrades (AC 1-4, 13) - state and catalog | Design | Pending |
| AUTO-06 | P2: Crystals and speed upgrades (AC 5-12) - upgrade endpoint | Design | Pending |
| AUTO-07 | P2: Crystals and upgrade on the HUD (AC 1-8) | Design | Pending |

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped ⚠️

---

## Success Criteria

- [ ] A chapter 2 player with the switch on clears a phase without clicking.
- [ ] Every upgrade answer, error code and HUD text above is pinned by a test.
- [ ] No upgrade is possible in play until a crystal source exists.
