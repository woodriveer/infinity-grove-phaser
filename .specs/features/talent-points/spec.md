# Talent Points Specification

## Problem Statement

Talents are bought with coins, which are also the currency of equipment, and the click combo is a fixed bonus the player cannot grow. This feature replaces coins with talent points earned by clearing the campaign for the first time, and adds the combo as a ninth talent in a new branch, so the player chooses where each hard-won point goes. It changes the talents feature (`.specs/features/talents/spec.md`) and the combo of `click-power`.

> **Superseded in part (2026-10-22 and 2026-10-23, AD-017):** `b443844` raises `CLICK_DAMAGE` to 5 % a level (`+50%` at level 10) and adds a tenth talent `CLICK_FLAT_DAMAGE`; `4a4f86f` makes a phase pay 0 points and adds `POST /talents/reset` with a `Reiniciar pontos` button, which takes every level back and keeps the points earned; `08be5c9` gives each talent 3 grades (30 talents, ids `<ID>_G2` and `<ID>_G3`), grade N costs N points a level, gives N times the grade 1 value and opens at level 10 of the grade before, and a locked grade answers 409 `TALENT_LOCKED`.

## Goals

- [ ] The first clear of a phase pays 1 talent point, of a miniboss 2, of a chapter boss 5; a replay pays nothing.
- [ ] Every talent level costs 1 talent point; coins no longer buy talents.
- [ ] A new talent `COMBO` (branch `COMBO`) raises the cap of the combo bonus by 5 % per level, up to 50 % at level 10.
- [ ] The backend owns the points and the levels (AD-009); the game applies the effects.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Refunding or resetting talents | Not asked; still out as in `talents` |
| Points for farm fights | The user asked for first clears only; the farm replays beaten bosses |
| Retroactive points for clears made before this feature | Past clears were not recorded; the only compensation is the legacy grant below |
| Changing the combo step (+1 % per click) or the 1.5 s idle limit | Only the cap becomes a talent |
| Gemini art | The COMBO card shows the drawn mark until the icon exists |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Point values | Phase 1, miniboss 2, chapter boss 5; settings `app.talents.points-per-phase`, `points-per-miniboss`, `points-per-chapter-boss` | User request | y |
| What counts as a first clear | A `CLEARED` campaign report from a position the player never cleared before, keyed `chapter:stage:encounter:phase`; a `FAILED` boss followed by a replay of the phase pays the phase once | The position goes back after a failed boss, so the stored position alone cannot tell a replay | n |
| Farm | Farm wins pay no points | User: repeating a phase or boss gives no points | y |
| Talent price | 1 point per level for all 9 talents; setting `app.talents.cost-per-level` (1); `base-cost` and `growth` are removed | User: all talents use points | y |
| Combo scale | `COMBO` perLevel 5 %, max level 10: level 0 = no combo bonus, level 1 = 5 %, level 10 = 50 % | User: 5 % growing to 50 % over 10 levels; level 0 gives nothing (a new player starts without combo) | y |
| Combo step | A click still adds +1 % to the streak; the bonus is `min(streak, cap)` where the cap is the `COMBO` value | Unchanged mechanic | n |
| Existing levels | Migration `V5` grants each existing player a `legacy` award equal to the levels they already own, so nobody holds levels without points | Levels were bought with coins; taking them away would be destructive | n |
| Balance | `available = earned - spent`, `spent` = sum of levels x cost per level | Derived, never stored | n |
| Lock | An upgrade locks the player's `progress` row; the award happens under the same lock in the outcome report | Serialises upgrades with awards; first of the lock order (`progress`, `player_cards`, `wallets`) | n |
| Idempotency | Unchanged: `fromLevel` in the request; `TALENT_LEVEL_MISMATCH`, `TALENT_MAX_LEVEL`, `TALENT_NOT_FOUND`, `INVALID_TALENT_REQUEST` keep their meaning | Reuse | n |
| New error | `NOT_ENOUGH_TALENT_POINTS` (409) replaces `NOT_ENOUGH_COPPER` for talents | Same family | n |
| Reads | `GET /talents` answers `{ talents, points: { earned, spent, available } }`; each talent's `nextCost` is its cost in points (null at the top level); the upgrade answers `{ talents, points }` with no wallet | The game shows points, not copper | n |
| Outcome response | The outcome response carries `talentPoints`, the points that report paid (0 for a replay, a failure or a farm) | The game shows the notice and reloads the tree | n |
| Screen | Four columns: `Tempo`, `Quebra de defesa`, `Poder do clique`, `Combo`; a line `Pontos de talento: <available>` above them | Same window as `talents` | n |
| Card text | Button `Melhorar (1 ponto)`; the COMBO card reads title `Limite de dano do combo`, `Efeito: +25%` at level 5 and `Efeito: nenhum` at level 0 | Lesson L-010: exact texts | n |
| Failure texts | `Pontos de talento insuficientes` for `NOT_ENOUGH_TALENT_POINTS`, `Não foi possível melhorar o talento.` otherwise; the tree reloads after a 409 | Same as `talents` | n |
| Award notice | After an accepted report that paid points the game shows the notice `+<n> ponto de talento` for 1 and `+<n> pontos de talento` otherwise, the same way as `Carta: <nome>`; when the same report also dropped a card or a piece, that notice replaces the points one | One notice line is shared; the drop is rarer (found by the e2e specs of the drops) | n |
| Combo HUD at cap 0 | While the cap is 0 the combo HUD stays empty | `Combo x5 · +0%` is noise | n |

**Open questions:** none.

---

## User Stories

### P1: Earn talent points (backend) ⭐ MVP

**User Story**: As a player, I want to earn talent points the first time I clear a phase or a boss so that progress, not coins, buys talents.

**Why P1**: Nothing else works without the points.

**Acceptance Criteria**:

1. WHEN a player reports `CLEARED` from a phase never cleared before THEN the backend SHALL add 1 point to `earned` and answer `talentPoints` 1.  <!-- event-driven -->
2. WHEN a player reports `CLEARED` from a miniboss never cleared before THEN the backend SHALL add 2 points and answer `talentPoints` 2.  <!-- event-driven -->
3. WHEN a player reports `CLEARED` from a chapter boss never cleared before THEN the backend SHALL add 5 points and answer `talentPoints` 5.  <!-- event-driven -->
4. WHEN a player fails a miniboss and clears the last phase of its stage again THEN the backend SHALL pay nothing for that phase and answer `talentPoints` 0.  <!-- event-driven -->
5. WHEN a player wins a farm fight THEN the backend SHALL add no talent points.  <!-- event-driven -->
6. WHEN a `FAILED` outcome is reported THEN the backend SHALL add no talent points and answer `talentPoints` 0.  <!-- event-driven -->
7. WHEN an outcome report is refused with 409 THEN the backend SHALL add no talent points.  <!-- unwanted-behavior -->
8. The backend SHALL keep the awards of one player apart from every other player and delete them with the player (SQL foreign key, cascade).  <!-- ubiquitous -->
9. WHEN `V5` runs on a player who owns talent levels summing to 7 THEN the backend SHALL give that player `earned` 7 and `available` 0.  <!-- event-driven -->

**Independent Test**: Report `CLEARED` from phase 1 of stage 1, then repeat from a replayed position after a failed miniboss: `talentPoints` 1, then 0.

---

### P1: Spend points on talents (backend) ⭐ MVP

**User Story**: As a player, I want each talent level to cost one point so that I decide where my points go.

**Why P1**: This replaces the coin price.

**Acceptance Criteria**:

1. WHEN a signed-in player requests `GET /talents` THEN the backend SHALL answer 200 with the 9 talents (the 8 existing plus `COMBO` with `branch` `COMBO`, `unit` `%`, `perLevel` 5, `maxLevel` 10, `label` `Limite de dano do combo`) and `points` with `earned`, `spent` and `available`.  <!-- event-driven -->
2. WHEN a new player requests `GET /talents` THEN the backend SHALL answer level 0 and `nextCost` 1 for every talent and `points` 0, 0, 0.  <!-- event-driven -->
3. WHEN the player holds 3 available points and sends `POST /talents/COMBO/upgrade` with `{ "fromLevel": 0 }` THEN the backend SHALL raise the level to 1, answer `value` 5 and `points` with `spent` 1 and `available` 2.  <!-- event-driven -->
4. WHEN the player holds 0 available points THEN the backend SHALL answer 409 `NOT_ENOUGH_TALENT_POINTS` and leave the level and the points unchanged.  <!-- unwanted-behavior -->
5. WHEN an upgrade is accepted THEN the backend SHALL leave the wallet unchanged and the response SHALL carry no `wallet`.  <!-- event-driven -->
6. WHEN the stored level is 3 and the request sends `fromLevel` 2 THEN the backend SHALL answer 409 `TALENT_LEVEL_MISMATCH` and change nothing.  <!-- event-driven -->
7. IF the talent is at level 10 THEN the backend SHALL answer 409 `TALENT_MAX_LEVEL`, answer `nextCost` null in the tree and spend nothing.  <!-- unwanted-behavior -->
8. IF the id is not in the catalog THEN the backend SHALL answer 404 `TALENT_NOT_FOUND`; IF `fromLevel` is missing, negative or above 10 THEN 400 `INVALID_TALENT_REQUEST`; IF the request has no valid token THEN 401.  <!-- unwanted-behavior -->
9. WHEN two requests with the same `fromLevel` race THEN the backend SHALL accept exactly one and answer 409 to the other, and two upgrades of different talents SHALL never spend more points than the player earned.  <!-- event-driven -->
10. WHEN `COMBO` is at level 10 THEN the backend SHALL answer `value` 50.  <!-- event-driven -->

**Independent Test**: With 1 earned point, `POST /talents/COMBO/upgrade {"fromLevel":0}` answers level 1 and `available` 0; repeating it answers 409.

---

### P1: Combo cap in combat ⭐ MVP

**User Story**: As a player, I want the combo talent to set how much damage the combo can add so that upgrading it pays.

**Why P1**: The talent exists only to change the fight.

**Acceptance Criteria**:

1. WHEN `COMBO` is at level 4 and the streak is 30 clicks THEN the game SHALL give the next click a combo bonus of 20 %.  <!-- event-driven -->
2. WHEN `COMBO` is at level 4 and the streak is 12 clicks THEN the game SHALL give the next click a bonus of 12 %.  <!-- event-driven -->
3. WHEN `COMBO` is at level 10 and the streak is 60 clicks THEN the game SHALL give the next click a bonus of 50 %.  <!-- event-driven -->
4. WHEN `COMBO` is at level 0 or the talents have not loaded THEN the game SHALL give every click a combo bonus of 0 % and keep the combo HUD empty.  <!-- event-driven -->
5. WHEN the player upgrades `COMBO` THEN the game SHALL use the new cap on the next click, keeping the running streak.  <!-- event-driven -->
6. WHILE the combo HUD shows a streak the game SHALL read `Combo x<streak> · +<bonus>%` with the bonus capped at the talent value (`Combo x30 · +20%` at level 4).  <!-- state-driven -->

**Independent Test**: With `COMBO` at level 2, 30 rapid clicks read `Combo x30 · +10%`.

---

### P2: Talentos screen with points

**User Story**: As a player, I want to see my points and spend them on the talent screen.

**Why P2**: The backend and the combat work without the screen, but the player buys through it.

**Acceptance Criteria**:

1. The Talentos window SHALL show the line `Pontos de talento: <available>` and four columns titled `Tempo`, `Quebra de defesa`, `Poder do clique` and `Combo`, the last holding the card `Limite de dano do combo`.  <!-- ubiquitous -->
2. The window SHALL show, for each talent, its label, `Nível <level>/<max>`, `Efeito: <value text>` and the button `Melhorar (1 ponto)`.  <!-- ubiquitous -->
3. WHEN the player holds 1 point and clicks `Melhorar (1 ponto)` on a level-0 talent THEN the game SHALL send the upgrade with `fromLevel` 0, show `Nível 1/10` and `Pontos de talento: 0`.  <!-- event-driven -->
4. WHILE the player holds 0 available points the game SHALL disable every `Melhorar` button, whatever the wallet holds.  <!-- state-driven -->
5. WHILE a talent is at level 10 the game SHALL show `Nível máximo` and no button for it.  <!-- state-driven -->
6. IF the backend answers 409 `NOT_ENOUGH_TALENT_POINTS` THEN the game SHALL show `Pontos de talento insuficientes` and reload the tree; IF any other failure THEN `Não foi possível melhorar o talento.`, and the tree reloads only after a 409.  <!-- unwanted-behavior -->
7. WHILE a request runs the game SHALL disable every `Melhorar` button.  <!-- state-driven -->
8. IF the tree cannot be loaded THEN the game SHALL show `Talentos indisponíveis` and keep the fight playable.  <!-- unwanted-behavior -->
9. WHEN an accepted outcome report answers `talentPoints` 2 and dropped no card or piece THEN the game SHALL show the notice `+2 pontos de talento` and reload the tree; WHEN it answers 1 THEN `+1 ponto de talento`; WHEN it answers 0 THEN no notice.  <!-- event-driven -->
10. The window SHALL not show the wallet price of a talent.  <!-- ubiquitous -->

**Independent Test**: In the browser against the fake backend with 1 point, open Talentos, click `Melhorar (1 ponto)` on `Limite de dano do combo` and read `Nível 1/10`, `Efeito: +5%` and `Pontos de talento: 0`.

---

## Edge Cases

- WHEN the player clears the chapter boss for the first time THEN the points of that report SHALL be 5 and phase 1 of the next chapter SHALL pay 1 when cleared (different key).
- WHEN the player has 3 points and clicks two different talents quickly THEN the game SHALL run the requests one at a time (the busy state disables the buttons).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TPT-01 | P1: earn points (AC 1-3, 8) | Specify | Pending |
| TPT-02 | P1: no points for replay, failure, farm, refusal (AC 4-7) | Specify | Pending |
| TPT-03 | P1: legacy grant (AC 9) | Specify | Pending |
| TPT-04 | P1: tree, COMBO and points read (spend AC 1, 2, 10) | Specify | Pending |
| TPT-05 | P1: upgrade with points, refusals, race (spend AC 3-9) | Specify | Pending |
| TPT-06 | P1: combo cap in combat (combat AC 1-6) | Specify | Pending |
| TPT-07 | P2: screen and notice (screen AC 1-10) | Specify | Pending |

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped

---

## Success Criteria

- [ ] Backend tests pin 1 / 2 / 5 points, the replay after a failed boss, the cost of 1, the legacy grant and the race.
- [ ] Unit tests pin the combo cap at levels 0, 4 and 10 with the exact numbers above.
- [ ] An e2e test earns a point, buys a COMBO level and reads the new cap in the combo HUD.
- [ ] Flyway `V5` applies on the existing schema (`ddl-auto: validate` still passes).
