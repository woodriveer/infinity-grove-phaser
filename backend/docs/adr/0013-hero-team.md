# ADR 0013: Hero team (ally slots bought with copper, one row per player)

- Status: Accepted
- Date: 2026-11-19

## Context

From chapter 5 a player fields allies next to the leader (spec `hero-team`, `AD-018`). The server must remember which ally slots a player bought and which hero sits in each, decide what a slot costs and when it opens, and keep the wallet and the team consistent, as it does for equipment and talents (`AD-009`). Combat runs in the browser (`AD-002`), so the server never sees an ally hit.

## Decision

**One row per player.** `player_team(username, bought_slots, ally_1, ally_2, ally_3, ally_4)` in `V12__hero_team.sql`. `username` is the primary key and a foreign key to `users` that cascades on delete. `bought_slots` has a check from 0 to 4. Each `ally_n` is a nullable foreign key to `heroes(id)` with `on delete restrict`. Four checks refuse a hero in a slot that is not bought (`player_team_ally_n_bought`) and one refuses the same hero twice (`player_team_allies_distinct`; a comparison with `null` is `null`, which a check accepts, so only two equal heroes fail). A player with no row bought no slot and has no ally: `TeamRepositoryPort.find` answers `Team()`. A swap of two allies is one update of one row.

**Expand only.** `V12` creates a table and touches nothing else, and the previous backend never reads it, so it keeps starting and serving on the migrated database (`AD-016`). `PreviousBackendCompatibilityIT` pins this with V11 as the last migration of the previous release.

**The unlock and the open slots come from `player_cards`.** The team is unlocked once `cleared_chapters` holds chapter 5; ally slots 1 to 4 open with the first boss win of chapters 5, 6, 7 and 8 (`Team.openSlots`). Slot prices are 10 000, 20 000, 30 000 and 40 000 copper (`Team.SLOT_PRICES`). The `Team` value in the domain owns these rules and the checks of every change; the services only load, call and store.

**Routes.**

- `GET /heroes` answers `team` next to `leaderId` and `heroes`: `{ unlocked, openSlots, boughtSlots, slotPrices, allies }` (`allies` has 4 entries, a hero id or `null`).
- `PUT /leader { heroId }` answers `{ leaderId, team }`. A hero taken from an ally slot swaps with the old leader, so the old leader sits in that slot. A hero outside the team leaves the allies as they are, and no team row is written when nothing changes.
- `PUT /team { allies: [4 entries] }` answers `{ leaderId, team }`. The check order is `INVALID_TEAM` (400: not 4 entries, an entry that is neither a string nor `null`, a hero twice, the leader), `HERO_NOT_FOUND` (404), `TEAM_LOCKED` (409), `TEAM_SLOT_NOT_BOUGHT` (409), `HERO_NOT_OWNED` (409). Saving the same body twice answers 200 with the same team.
- `POST /team/slots { fromSlots }` answers `{ team, wallet }`. The check order is `INVALID_TEAM_SLOT_REQUEST` (400: missing, not an integer or negative), `TEAM_SLOT_MISMATCH` (409), `TEAM_SLOTS_MAX` (409), `TEAM_SLOT_LOCKED` (409), `NOT_ENOUGH_COPPER` (409, from `Wallet.minus`). `fromSlots` is the bought count the player saw, so a double click or two tabs buy one slot and charge once; the 409 `TEAM_SLOT_MISMATCH` body carries the stored `team` so the game realigns without another request.

**Locks.** Every team change takes the `player_cards` row first (`findForUpdate`, ADR 0008), then the `wallets` row for a purchase (`WalletAccess.lock`). This is the lock order `progress`, `player_cards`, `wallets` of `AD-009`, so the team adds no cycle with equipment, cards or the wallet sync. Two saves of one player run one after the other and the stored team equals one of the two bodies. A refusal throws before anything is stored, and any exception rolls the transaction back, so a refused purchase changes neither the team nor the wallet.

**Reset and deletion.** The account reset does not touch `player_cards` or `player_team`, so `unlocked`, `openSlots`, `boughtSlots` and `allies` survive it. Deleting a user deletes the team row through the foreign key.

**Ally damage is computed in the game.** The server stores who fights and what a slot cost; it never sees a hit, a star multiplier or a passive (`AD-002`). The damage goes through the one damage of `AD-021`.

## Consequences

- A client cannot forge a price, open a slot early or field a hero it does not own; it can still overstate its damage because combat is in the browser (`AD-002`).
- The prices and the chapters that open the slots are constants of `Team`, so a change of either needs a code change and a deploy, not a migration.
- `heroes` rows cannot be deleted while a player has that hero in a slot (`on delete restrict`); the catalog only grows.
- Either side can deploy first (`AD-016`): the previous backend runs on the V12 schema, and a game that finds no valid `team` in `GET /heroes` treats the team as locked.

## Alternatives considered

- One row per ally slot: rejected; a swap would touch two rows and need a deferred uniqueness check, while one row makes it one update and the checks are plain column checks.
- Storing the team in `player_cards` as a comma-separated column like `cleared_chapters`: rejected; the foreign keys to `heroes` and the distinct check are worth a table, and the previous release maps `player_cards` with schema validation.
- Opening a slot with a counter on the server instead of reading `cleared_chapters`: rejected; the boss wins already hold the truth and survive a reset without extra state.
- Letting the client choose the price: rejected for the reason in `AD-009`.
