# ADR 0008: Equipment (server-rolled pieces, own table, refined with copper)

- Status: Accepted
- Date: 2026-10-18

## Context

A click deals the same damage for every player. Bosses now drop pieces of equipment with random affixes that a hero wears, and copper refines or rerolls them, so two accounts end up with different builds. Combat runs in the browser (`AD-002`), so the server never sees a click, but it must decide what drops and what each action costs.

## Decision

**Catalog in code.** `Slot` (WEAPON, ARMOR, RING, AMULET), `Rarity` (COMMON to LEGENDARY: 1, 2, 3, 4, 4 affixes; refine cost multiplier 1, 2, 3, 5, 8) and `AffixType` (`CLICK_DAMAGE_PCT`, `CRIT_CHANCE`, `CRIT_DAMAGE_PCT`, `BOSS_DAMAGE_PCT`, `BOSS_TIME_SECONDS`, `ARMOR_PIERCE_PCT`, each with a value band per rarity, never overlapping) are enums in `Equipment.kt`. A weapon carries its own base click damage (a band per rarity, 2-3 up to 10-12) and never rolls `CLICK_DAMAGE_PCT`. `app.equipment.*` holds only the numbers an operator tunes: `miniboss-rate` (0.25), `chapter-boss-rate` (1.0), `bag-capacity` (100), `refine-base-cost` (500) and `reroll-cost` (5000), validated when `EquipmentRules` is built.

**One row per piece.** `equipment_pieces(id, username, slot, rarity, base_click, refine, affixes, hero_id, created_at)` created by Hibernate `ddl-auto: update` (ADR 0005). `affixes` is `TYPE:base` pairs joined by commas, like the wallet queues. Rows store base values; the refine level is applied when a value is read (`Piece.value`: floor of base times `1 + 0.1 * refine`; weapon click damage to one decimal). `hero_id` is the hero wearing the piece. `PlayerEquipment` keeps the invariants (unique ids, one piece per hero and slot, bag capacity).

**Drops are decided in the report transaction.** After the cards, `ProgressService.report` and `FarmService.report` call `EquipmentRewards.award` for a `CLEARED` miniboss or chapter boss. `PieceRoller` reads one injected `ChanceRollerPort` in a fixed order (drop, rarity, slot, weapon click damage, then type and value of each affix). A full bag sells the piece into the wallet instead (`sold: true`). The responses carry `equipmentDrop: { piece, sold }`. Rejected reports (409, farm spacing, daily limit) never reach the roll. A player with no cards row gets no equipment.

**Lock order.** `progress` then `player_cards` then `wallets`. Every equipment action takes the `player_cards` row first (the player lock), so drops and actions of one player run one after the other; the wallet is taken second and only by actions that spend or earn copper. `POST /wallet/sync` takes only `wallets`, so there is no cycle.

**Actions.** `GET /equipment`, `POST /equipment/{id}/equip { heroId }` (hero must be owned), `/unequip`, `/refine` (cost `floor(500 * 1.7^n)` copper times the rarity multiplier, +10 maximum), `/reroll { affix }` (from +5, 5000 copper, a type the piece lacks) and `/sell` (`100 * rarity index * (1 + 0.5 * refine)` copper), and POST /equipment/sell { pieceIds } (1 to 100 distinct ids, all-or-nothing, answers { equipment, wallet, sold, earned }). Refine, reroll and sell answer `{ equipment, wallet }` so the game shows the new total at once. A piece that is missing or belongs to another account is 404 `EQUIPMENT_NOT_FOUND`.

**Errors.** `EquipmentRequestException` 400 (`INVALID_AFFIX`, `INVALID_SELL_BATCH`), `EquipmentNotFoundException` 404, `EquipmentConflictException` 409 (`NOT_ENOUGH_COPPER`, `MAX_REFINE`, `REFINE_TOO_LOW`, `NO_AFFIX_LEFT`) and `HERO_NOT_OWNED` from the hero side, through `ApiExceptionHandler` (ADR 0003).

## Consequences

- A client cannot choose or foresee a drop; it can still overstate its damage because the server cannot see a click (`AD-002`).
- Equipment reaches the farm: the farm spacing (5 s) and the 10 chapter boss wins a day also limit how fast pieces can be farmed.
- `NO_AFFIX_LEFT` cannot happen with today catalog (a piece holds at most 4 affixes and a slot allows at least 5 types); the guard stays so a later catalog cannot crash a reroll.
- Deleting a user deletes the pieces.

## Alternatives considered

- Pieces inside `PlayerCards`: rejected; up to 100 pieces with their own state do not fit the comma-separated style of that row.
- Pre-rolled piece queues like the coins: rejected for the reason in ADR 0007; the client would see the next drop.
- Affix ranges in `application.yaml`: rejected; nested tables in properties cost more than they give, the enums are the spec table.
- A database unique index on `(username, hero_id, slot)`: not possible with `ddl-auto: update` for a partial index; `PlayerEquipment` guards it under the player lock.
