# ADR 0010: Talents (a coin tree with levels stored by the server)

- Status: Accepted
- Date: 2026-10-21

## Context

Copper, silver and gold only paid for refining, rerolling and selling equipment, so coins piled up. The player wants a tree they can spend coins on to fight longer, break the defense of the monsters and click harder. Combat runs in the browser (`AD-002`), so the server never sees a click, but it must decide what a level costs and which levels a player has, like it does for equipment (`AD-009`).

## Decision

**Catalog in code.** `TalentCatalog` in `Talents.kt` lists the 8 talents of the three branches `TIME` (`MINIBOSS_TIME` +2 s, `BOSS_TIME` +3 s), `BREAK` (`PHYSICAL_BREAK`, `MAGICAL_BREAK`, `CRIT_RESIST_BREAK`, 1 point each) and `POWER` (`CLICK_DAMAGE` +3 %, `CRIT_CHANCE` +1 point, `CRIT_DAMAGE` +5 %), every one up to level 10. `app.talents.*` holds the two numbers an operator tunes: `base-cost` (300) and `growth` (1.6). The upgrade from level `n` costs `round(base-cost x growth^n)` copper, for every talent (300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12885 and 20616). `TalentRules` validates both when it is built.

**One row per upgraded talent.** `player_talents(username, talent_id, level)` with the primary key `(username, talent_id)`, a foreign key to `users` that cascades on delete and a check `level >= 1` (Flyway `V3`, `AD-010`). A talent with no row is at level 0. The talent ids belong to the code catalog, so there is no catalog table to reference.

**An upgrade is one transaction under the wallet lock.** `POST /talents/{id}/upgrade { fromLevel }` loads the wallet row `FOR UPDATE` first, then reads the levels, checks the request, takes the copper and writes the level. It takes only the `wallets` row, the last of the lock order (`progress`, `player_cards`, `wallets`), so there is no cycle with equipment, cards or the wallet sync. Two upgrades of one player run one after the other.

**`fromLevel` makes the request idempotent.** The body carries the level the player saw; a stored level that differs answers 409 `TALENT_LEVEL_MISMATCH` and takes nothing, so a double click or two tabs cannot buy two levels. `fromLevel` must be an integer from 0 to 10, otherwise 400.

**Reads.** `GET /talents` and the upgrade answer the 8 talents with `id`, `branch`, `label`, `unit`, `perLevel`, `maxLevel`, `level`, `value` (`level x perLevel`) and `nextCost` (null at the top level); the upgrade also answers the `wallet` in coins. The game applies the values; it types no number of the catalog.

**Errors.** `TalentRequestException` 400 `INVALID_TALENT_REQUEST`, `TalentNotFoundException` 404 `TALENT_NOT_FOUND`, `TalentConflictException` 409 (`TALENT_LEVEL_MISMATCH`, `TALENT_MAX_LEVEL`) and `NOT_ENOUGH_COPPER` from the wallet side, through `ApiExceptionHandler` (ADR 0003).

## Consequences

- A client cannot forge a level or a price; it can still overstate its damage because combat is in the browser (`AD-002`).
- The levels cannot be refunded or reset: a wrong tuning of the curve is fixed in `app.talents`, a wrong catalog needs a migration.
- Changing `base-cost` or `growth` changes the price of the next level of every player, never what they already paid.
- Deleting a user deletes the levels.

## Alternatives considered

- Levels inside `player_cards`: rejected; 8 counters that grow with the catalog do not fit the comma-separated style of that row.
- A price table per talent in `application.yaml`: rejected for the reason in ADR 0008; one curve with two numbers is enough until a balance pass asks for more.
- Optimistic checking by a version column instead of `fromLevel`: rejected; the client already knows the level it shows, and the wallet lock already orders the requests.
- The game computing the price: rejected; a client-chosen price is trivial to forge (`AD-009`).
