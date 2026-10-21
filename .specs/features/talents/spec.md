# Talents Specification

## Problem Statement

Copper, silver and gold only pay for refining, rerolling and selling equipment, so coins pile up with nothing to buy. This feature adds a talent tree with three branches (Tempo, Quebra de defesa, Poder do clique) that the player upgrades with coins; the backend owns the levels and the prices (AD-009), the game applies the effects in combat.

## Goals

- [ ] The player spends coins on 8 talents in 3 branches, each up to level 10, from a new Talentos screen.
- [ ] Tempo talents add seconds to the time limit of minibosses and of the chapter boss.
- [ ] Quebra de defesa talents lower the physical defense, the magical defense and the critical resistance of every monster.
- [ ] Poder do clique talents raise click damage, critical chance and critical damage of the leader.
- [ ] The levels survive a reload and cannot be forged: only the backend raises a level and takes the coins.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Refunding or resetting talents | Not asked; a later feature if levels turn out wrong |
| Talents per hero | The tree belongs to the account, like the wallet |
| Prestige, account level and Renascimento | Next steps of the roadmap |
| Server-side combat checks | Combat runs in the browser (AD-002) |
| Gemini art | Icons come from `PROMPTS_ASSETS_UI.md`; until then the screen shows a simple drawn mark |

---

## Talent Catalog

Prices and values live in the backend; the game reads them and never types a number. `value` is `level x perLevel`.

| Id | Branch | Label | Per level | Max level |
| --- | --- | --- | --- | --- |
| `MINIBOSS_TIME` | `TIME` | Tempo do miniboss | +2 s | 10 |
| `BOSS_TIME` | `TIME` | Tempo do chefe do capítulo | +3 s | 10 |
| `PHYSICAL_BREAK` | `BREAK` | Quebra de defesa física | -1 point of physical defense | 10 |
| `MAGICAL_BREAK` | `BREAK` | Quebra de defesa mágica | -1 point of magical defense | 10 |
| `CRIT_RESIST_BREAK` | `BREAK` | Quebra de resistência a crítico | -1 point of critical resistance | 10 |
| `CLICK_DAMAGE` | `POWER` | Dano de clique | +3 % click damage | 10 |
| `CRIT_CHANCE` | `POWER` | Chance de crítico | +1 point of critical chance | 10 |
| `CRIT_DAMAGE` | `POWER` | Dano crítico | +5 % critical damage | 10 |

Price of the upgrade from level `n` to `n+1`, in copper: `round(300 x 1.6^n)`, so 300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12884 and 20616 for `n` = 0 to 9 (base cost and growth are `app.talents` settings).

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Number of talents and ramps | The 8 talents, per-level values and 10 levels of the catalog | The user named the three branches and their themes; the numbers are proposals | n |
| Price curve | `round(300 x 1.6^n)` copper from level `n`; one curve for all talents | A refine of a COMMON piece costs 500 copper at +0, a boss pays 20 to 50 copper in chapter 1; the curve is a config | n |
| Server authority | The backend stores `player_talents` rows, takes the copper under the wallet row lock and returns the tree and the wallet | AD-009: a client-chosen price or level is trivial to forge | n |
| Idempotency | The upgrade request carries `fromLevel`, the level the player saw; any other stored level answers 409 `TALENT_LEVEL_MISMATCH` and takes nothing | A double click must not buy two levels | n |
| Error codes | `NOT_ENOUGH_COPPER` (409, existing), `TALENT_MAX_LEVEL` (409), `TALENT_LEVEL_MISMATCH` (409), `TALENT_NOT_FOUND` (404), `INVALID_TALENT_REQUEST` (400) | Same families as the equipment errors | n |
| Defense break | `max(0, defense - points)` on the monster's physical defense, magical defense and critical resistance before the damage formula, for phase monsters, minibosses and chapter bosses; the physical talent applies to PHYSICAL hits, the magical talent to MAGICAL hits | Floors at 0 like Brado Aterrador; the click is PHYSICAL | n |
| Break and Brado | Both apply: the talent first, then Brado Aterrador's 30 points, never below 0 | Two independent reductions | n |
| Time talents | `MINIBOSS_TIME` adds its seconds to the limit of a miniboss encounter, `BOSS_TIME` to the chapter boss; the equipment affix `BOSS_TIME_SECONDS` keeps adding to both | The user listed miniboss time and chapter boss time as two talents | n |
| Power talents | `CLICK_DAMAGE` adds percent to the same sum as the equipment and star click damage; `CRIT_CHANCE` adds points (capped at 100); `CRIT_DAMAGE` adds percent to the critical multiplier like `CRIT_DAMAGE_PCT` | Same units as the equipment affixes and the star bonus (`click-power`) | n |
| Screen | A seventh HUD button `Talentos` opens a window with three columns (Tempo, Quebra de defesa, Poder do clique) of cards; the window pauses the fight like the other hero screens | Same pattern as Equipamento | n |
| Card text | Title `<label>`, line `Nível <level>/<max>`, line `Efeito: <value text>` (`+6 s`, `-3 pontos`, `+9%`, `+3 pontos`), button `Melhorar (<cost as formatCopper>)`; at the max `Nível máximo` and no button | Lesson L-010 | n |
| Button states | Disabled while the wallet holds less than the cost or while a request runs | Avoids a refused request | n |
| Failure texts | `Moedas insuficientes` for NOT_ENOUGH_COPPER, `Não foi possível melhorar o talento.` for any other failure; the screen reloads the tree after a 409 | The server tree is the truth | n |
| New account | All levels 0, no rows stored until the first upgrade | Rows only for upgraded talents | n |
| Lock order | `progress`, `player_cards`, `wallets` as before; an upgrade takes only `wallets` and writes its own `player_talents` row | Wallet lock serialises one player's upgrades | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Buy talent levels (backend) ⭐ MVP

**User Story**: As a player, I want to spend coins on a talent level so that my progress is saved and cannot be forged.

**Why P1**: Nothing else in the feature works without the stored levels and prices.

**Acceptance Criteria**:

1. WHEN a signed-in player requests `GET /talents` THEN the backend SHALL answer 200 with the 8 talents of the catalog, each with `id`, `branch`, `label`, `unit`, `perLevel`, `maxLevel`, `level`, `value` and `nextCost`.  <!-- event-driven -->
2. WHEN a new player requests `GET /talents` THEN the backend SHALL answer level 0, value 0 and `nextCost` 300 for every talent.  <!-- event-driven -->
3. WHEN the player sends `POST /talents/CLICK_DAMAGE/upgrade` with `{ "fromLevel": 0 }` and holds at least 300 copper THEN the backend SHALL raise the level to 1, take 300 copper from the wallet and answer 200 with the tree and the wallet.  <!-- event-driven -->
4. WHEN a talent is at level 1 THEN the backend SHALL answer `nextCost` 480 and, after the upgrade to level 2 with `fromLevel` 1, take 480 copper.  <!-- event-driven -->
5. WHEN a talent is at level 9 THEN the backend SHALL answer `nextCost` 20616.  <!-- event-driven -->
6. WHEN the stored level is 3 and the request sends `fromLevel` 2 THEN the backend SHALL answer 409 `TALENT_LEVEL_MISMATCH` and leave the level and the wallet unchanged.  <!-- event-driven -->
7. IF the wallet holds less copper than the price THEN the backend SHALL answer 409 `NOT_ENOUGH_COPPER` and leave the level and the wallet unchanged.  <!-- unwanted-behavior -->
8. IF the talent is at level 10 THEN the backend SHALL answer 409 `TALENT_MAX_LEVEL`, answer `nextCost` null in the tree and take nothing.  <!-- unwanted-behavior -->
9. IF the id is not in the catalog THEN the backend SHALL answer 404 `TALENT_NOT_FOUND`.  <!-- unwanted-behavior -->
10. IF `fromLevel` is missing, negative or above the max level THEN the backend SHALL answer 400 `INVALID_TALENT_REQUEST`.  <!-- unwanted-behavior -->
11. IF the request carries no valid access token THEN the backend SHALL answer 401.  <!-- unwanted-behavior -->
12. WHEN two requests with the same `fromLevel` race THEN the backend SHALL accept exactly one and answer 409 to the other.  <!-- event-driven -->
13. The backend SHALL keep the levels of one player apart from every other player and delete them with the player (SQL foreign key, cascade).  <!-- ubiquitous -->

**Independent Test**: `POST /talents/CLICK_DAMAGE/upgrade {"fromLevel":0}` with 300 copper answers level 1 and 0 copper; repeating it answers 409 `TALENT_LEVEL_MISMATCH`.

---

### P1: Talent effects in combat ⭐ MVP

**User Story**: As a player, I want my talents to change the fight so that spending coins pays.

**Why P1**: The talents exist only to change the fight.

**Acceptance Criteria**:

1. WHEN the player holds `CLICK_DAMAGE` level 5 THEN the game SHALL add 15 % to the click damage percent sum of the leader.  <!-- event-driven -->
2. WHEN the player holds `CRIT_CHANCE` level 4 THEN the game SHALL add 4 points to the leader's critical chance, capped at 100.  <!-- event-driven -->
3. WHEN the player holds `CRIT_DAMAGE` level 6 THEN the game SHALL add 0.3 to the leader's critical multiplier.  <!-- event-driven -->
4. WHEN the player holds `PHYSICAL_BREAK` level 3 THEN the game SHALL lower the physical defense of every monster by 3 points, never below 0, for PHYSICAL hits.  <!-- event-driven -->
5. WHEN the player holds `MAGICAL_BREAK` level 3 THEN the game SHALL lower the magical defense of every monster by 3 points, never below 0, for MAGICAL hits.  <!-- event-driven -->
6. WHEN the player holds `CRIT_RESIST_BREAK` level 8 THEN the game SHALL lower the critical resistance of every monster by 8 points, never below 0.  <!-- event-driven -->
7. WHEN a miniboss encounter starts and the player holds `MINIBOSS_TIME` level 5 THEN the game SHALL add 10 s to its time limit.  <!-- event-driven -->
8. WHEN a chapter boss encounter starts and the player holds `BOSS_TIME` level 4 THEN the game SHALL add 12 s to its time limit.  <!-- event-driven -->
9. WHEN a miniboss encounter starts THEN the game SHALL not add the seconds of `BOSS_TIME`, and a chapter boss SHALL not get those of `MINIBOSS_TIME`.  <!-- event-driven -->
10. WHEN Base 100 hits a FIRE monster with physical defense 20 under `PHYSICAL_BREAK` level 5 and no critical THEN the game SHALL deal 85 damage.  <!-- event-driven -->
11. WHEN a monster has physical defense 10, `PHYSICAL_BREAK` is level 4 and Brado Aterrador runs THEN the game SHALL use a defense of 0.  <!-- event-driven -->
12. WHEN the talents have not loaded THEN the game SHALL fight with no talent effect.  <!-- event-driven -->

**Independent Test**: With `PHYSICAL_BREAK` level 5 against physical defense 20, a Base-100 neutral click deals 85 instead of 80.

---

### P2: Talentos screen

**User Story**: As a player, I want a screen to see and buy talent levels so that I plan my coins.

**Why P2**: The effects work from the stored levels; the screen is the way to buy them.

**Acceptance Criteria**:

1. The HUD SHALL show a button `Talentos`; WHEN clicked THEN the game SHALL pause the fight and open the window titled `Talentos` with three columns titled `Tempo`, `Quebra de defesa` and `Poder do clique`.  <!-- ubiquitous -->
2. The window SHALL show, for each talent, its label, `Nível <level>/<max>`, `Efeito: <value text>` and the button `Melhorar (<cost>)`.  <!-- ubiquitous -->
3. WHEN the player holds 300 copper and clicks `Melhorar (300 cobre)` on a level-0 talent THEN the game SHALL send the upgrade with `fromLevel` 0, show `Nível 1/10` and the new wallet.  <!-- event-driven -->
4. WHILE the wallet holds less than a talent's price the game SHALL disable that talent's button.  <!-- state-driven -->
5. WHILE a talent is at level 10 the game SHALL show `Nível máximo` and no button for it.  <!-- state-driven -->
6. IF the backend answers 409 `NOT_ENOUGH_COPPER` THEN the game SHALL show `Moedas insuficientes` and reload the tree.  <!-- unwanted-behavior -->
7. IF the backend answers any other failure THEN the game SHALL show `Não foi possível melhorar o talento.` and reload the tree.  <!-- unwanted-behavior -->
8. WHILE a request runs the game SHALL disable every `Melhorar` button.  <!-- state-driven -->
9. IF the tree cannot be loaded THEN the game SHALL show `Talentos indisponíveis` and keep the fight playable.  <!-- unwanted-behavior -->
10. WHEN a talent is upgraded THEN the game SHALL use the new level on the next click and the next encounter.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend with 300 copper, open Talentos, click `Melhorar (300 cobre)` on `Dano de clique` and read `Nível 1/10`, `Efeito: +3%` and a disabled button.

---

## Edge Cases

- WHEN the player upgrades a talent while the wallet sync of kills is in flight THEN the game SHALL show the wallet the backend answered.
- WHEN the player has 12 884 copper at level 8 THEN the game SHALL enable the button of that talent (`Melhorar (12884 cobre)` shown as `1 ouro 28 prata 84 cobre`).
- WHEN the level of a talent is 10 THEN the effect text SHALL read the max value (`+30%` for `CLICK_DAMAGE`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TAL-01 | P1: tree read, price curve (AC 1, 2, 4, 5) | Specify | Pending |
| TAL-02 | P1: upgrade, wallet, idempotency, concurrency (AC 3, 6, 12) | Specify | Pending |
| TAL-03 | P1: refusals and auth (AC 7-11) | Specify | Pending |
| TAL-04 | P1: storage and isolation (AC 13) | Specify | Pending |
| TAL-05 | P1: power talents in combat (game AC 1-3, 12) | Specify | Pending |
| TAL-06 | P1: break talents in combat (game AC 4-6, 10-11) | Specify | Pending |
| TAL-07 | P1: time talents in combat (game AC 7-9) | Specify | Pending |
| TAL-08 | P2: Talentos screen (screen AC 1-10) | Specify | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped

---

## Success Criteria

- [ ] Backend integration tests pin the price curve (300, 480, 20616), the refusals and the race.
- [ ] Unit tests pin each talent's effect with the exact numbers above.
- [ ] An e2e test buys a level with the fake backend and reads the new level and wallet.
- [ ] The Flyway migration applies on the existing schema (`ddl-auto: validate` still passes).
