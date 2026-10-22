# Equipment Specification

## Problem Statement

A click deals the same damage for every player: the only levers are the leader hero's element and the crit constants. Players need a long-term source of power that differs between accounts and gives gold a permanent use. Equipment dropped by bosses with random affixes, refined with gold, delivers both. The account level and talent tree discussed with the equipment are separate, later features.

## Goals

- [ ] A won miniboss or chapter boss can drop one equipment piece with a rarity and 1 to 4 random affixes, rolled by the server.
- [ ] A hero wears up to 4 pieces (one per slot); the leader's pieces change the damage of a click, the crit odds and the boss timer.
- [ ] Gold (copper) refines a piece from +0 to +10 and rerolls one of its affixes, so the same drop can be improved by play.
- [ ] Two accounts with the same heroes end up with different damage because their drops differ.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Account level / prestige currency | Separate feature (user decision: equipment and refining first) |
| Talent tree | Separate feature, same decision |
| Set bonuses | Needs a stable catalog of pieces first |
| Gold-find and card-drop affixes | The wallet drops are pre-rolled queues (AD-002); an affix would change that contract |
| Damage-per-second affixes | Heroes deal no automatic damage today; only clicks do |
| Bulk selling, item lock, comparison tooltip | Polish after the base loop works |
| Trading between accounts | No player-to-player system exists |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Ownership | Pieces belong to the account's bag; a piece is worn by at most one hero at a time; each hero has its own 4 slots | User decision: equipment per hero | y |
| Slots | `WEAPON`, `ARMOR`, `RING`, `AMULET`; any affix can roll on any slot | Simplest catalog; the build comes from the affixes | n |
| Rarities and affix counts | `COMMON` 1, `UNCOMMON` 2, `RARE` 3, `EPIC` 4, `LEGENDARY` 4 affixes; each rarity rolls its values in its own band (see "Affix bands"), so a better rarity always rolls higher | Matches the earlier proposal; legendary is "same slots, bigger numbers" until sets exist | n |
| Affix types | `CLICK_DAMAGE_PCT`, `CRIT_CHANCE` (percentage points), `CRIT_DAMAGE_PCT`, `BOSS_DAMAGE_PCT`, `BOSS_TIME_SECONDS`, `ARMOR_PIERCE_PCT`; no repeated type on one piece. `CLICK_DAMAGE_PCT` rolls only on `ARMOR`, `RING` and `AMULET`, never on the `WEAPON` | User decision: the weapon's click damage is its own base, not an affix | y |
| Weapon click damage | Every `WEAPON` has a base click damage (not an affix), rolled as a whole number in the band of its rarity (COMMON 2-3, UNCOMMON 4-5, RARE 6-7, EPIC 8-9, LEGENDARY 10-12), and shown with one decimal. The weapon's affixes are drawn from the 5 types that exclude `CLICK_DAMAGE_PCT`, in the count its rarity allows | User decision: the weapon always carries click damage; refining always raises it | y |
| Click damage with a weapon | The click's base damage is `1 + weapon click damage` (refined); with no weapon worn it stays 1 | Additive keeps the unarmed click as today and makes the weapon the main damage source | n |
| Affix bands (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY; never overlapping) | `CLICK_DAMAGE_PCT`, `BOSS_DAMAGE_PCT`, `ARMOR_PIERCE_PCT` 5-9, 10-14, 15-19, 20-24, 25-30; `CRIT_CHANCE` 1-2, 3-4, 5-6, 7-8, 9-10; `CRIT_DAMAGE_PCT` 10-19, 20-29, 30-39, 40-49, 50-60; `BOSS_TIME_SECONDS` 1, 2, 3, 4, 5-6 | Kept as constants in `EquipmentRules` (see design); drop rates, bag size and costs are config (`app.equipment`) | n |
| Drop sources and odds | A `CLEARED` miniboss drops a piece at 25 %; a `CLEARED` chapter boss at 100 %. Rarity weights: miniboss COMMON 60 / UNCOMMON 30 / RARE 10; chapter boss UNCOMMON 40 / RARE 40 / EPIC 15 / LEGENDARY 5 | Mirrors AD-005 (server rolls in the same transaction as the report); item odds are separate from the card odds | n |
| Bag capacity | 100 pieces. A drop that finds the bag full is sold at once for its sell price | A drop is never lost silently and never blocks a win | n |
| Refine | Level 0 to 10 on every piece. Level n multiplies the weapon's click damage and each affix value by `1 + 0.10 * n`. Cost from level n to n+1 is `floor(500 * 1.7^n)` copper times the rarity cost multiplier | Gives gold a permanent sink; a +10 piece is twice its drop value | n |
| Reroll | Needs refine level 5 or more. Replaces one chosen affix with a new type the piece does not have and a new value in the rarity's range; keeps the refine level. Cost 5000 copper | Lets a lucky rarity be steered without a free reroll loop | n |
| Sell price | `100 * rarity index` copper times `1 + 0.5 * refine level`, rarity index COMMON 1 to LEGENDARY 5, rounded down | A sink for duplicates; refine gold is partly recovered | n |
| Which pieces count in combat | Only the pieces worn by the current leader | One leader fights at a time | y |
| Where the damage is computed | In the game, from the worn pieces the server returns; the server owns drops, refines, rerolls and sales | Same trade-off as AD-002: the server cannot see a click | n |
| Player-facing text | Portuguese | AD-007 | y |
| Currency | Copper is the unit; the wallet total in copper is debited | `Wallet.copper` is the whole total | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Boss drops equipment ⭐ MVP

**User Story**: As a player, I want a boss win to sometimes give me a piece of equipment with random attributes so that every fight can improve my build.

**Why P1**: Nothing else exists without the item and its affixes.

**Acceptance Criteria**:

1. WHEN the server accepts a `CLEARED` miniboss report THEN the server SHALL roll a piece with probability 25 % and store it in the player's bag in the same transaction as the report.
2. WHEN the server accepts a `CLEARED` chapter boss report THEN the server SHALL roll a piece with probability 100 % and store it in the player's bag in the same transaction as the report.
3. WHEN a piece is rolled THEN the server SHALL pick its rarity by the weights of the encounter, its slot uniformly among the 4 slots, and as many distinct affix types as the rarity allows, each with a whole-number base value drawn uniformly inside the band the type has for that rarity.
4. WHEN a `WEAPON` is rolled THEN the server SHALL give it a base click damage drawn uniformly as a whole number inside the band of its rarity, and SHALL NOT roll `CLICK_DAMAGE_PCT` among its affixes.
5. WHEN an `ARMOR`, `RING` or `AMULET` is rolled THEN the server SHALL give it no base click damage and MAY roll `CLICK_DAMAGE_PCT` among its affixes.
6. WHEN a report accepted by the server drops a piece THEN the response SHALL carry the piece (id, slot, rarity, refine level, affixes) in the field `equipmentDrop`.
7. IF the report does not pay a piece THEN the response SHALL carry `equipmentDrop` as null.
8. IF the bag already holds 100 pieces WHEN a piece is rolled THEN the server SHALL credit its sell price to the wallet instead of storing it and SHALL answer `equipmentDrop` with the piece and `sold` true.
9. IF a `FAILED` report is received THEN the server SHALL roll no piece.
10. WHEN the game receives `equipmentDrop` THEN the game SHALL show the text `Equipamento encontrado: <rarity label> <slot label>` for 3 seconds, where the rarity labels are Comum, Incomum, Raro, Épico, Lendário and the slot labels are Arma, Armadura, Anel, Amuleto.
11. IF a report is rejected by the server (409 or farm spacing) THEN the server SHALL roll no piece.

**Independent Test**: Report a `CLEARED` chapter boss against the API and read one `equipmentDrop` and one new bag entry; report a `FAILED` one and read null.

---

### P1: Equip pieces and fight with them ⭐ MVP

**User Story**: As a player, I want to put pieces on a hero so that the leader hits harder or has more time for bosses.

**Why P1**: Without effect in combat the drop has no value.

**Acceptance Criteria**:

1. WHEN the player equips a piece they own on an owned hero THEN the server SHALL set the piece as the hero's piece of its slot and SHALL return the hero's worn pieces.
2. WHEN the player equips a piece on a slot that already holds another piece of the same hero THEN the server SHALL return the old piece to the bag (unworn).
3. WHEN the player equips a piece worn by another hero THEN the server SHALL move it to the new hero and leave the other hero's slot empty.
4. WHEN the player unequips a slot THEN the server SHALL leave the slot empty and keep the piece in the bag.
5. IF the piece does not exist or belongs to another account THEN the server SHALL answer 404 and change nothing.
6. IF the hero is not owned THEN the server SHALL answer 409 `HERO_NOT_OWNED` and change nothing.
7. WHEN the game loads or the leader or the worn pieces change THEN the attacker of a click SHALL be: base damage `(1 + refined click damage of the worn weapon, 0 with no weapon) * (1 + sum(CLICK_DAMAGE_PCT)/100)`, crit chance `min(100, 10 + sum(CRIT_CHANCE))`, crit multiplier `2 + sum(CRIT_DAMAGE_PCT)/100`, each sum taken over the refined affixes of the pieces worn by the leader.
8. WHEN a click hits a boss (miniboss or chapter boss) THEN the damage SHALL be multiplied by `1 + sum(BOSS_DAMAGE_PCT)/100`.
9. WHEN a click hits any monster THEN the monster defense SHALL be multiplied by `1 - min(100, sum(ARMOR_PIERCE_PCT))/100` before the damage formula applies it.
10. WHEN a boss fight starts THEN its time limit SHALL be the existing limit plus `sum(BOSS_TIME_SECONDS)` of the leader's pieces.
11. WHEN the leader has no worn pieces THEN the game SHALL use the current attacker values unchanged (damage 1, crit 10 %, x2).
12. WHEN the player opens the equipment panel THEN the game SHALL list each hero's slots and the bag with each piece's slot, rarity, refine level, affixes (type label and refined value) and, for a weapon, `Dano de clique: <refined value with one decimal>`, and the buttons Equipar and Remover.
13. IF the player has no piece yet THEN the panel SHALL show `Nenhum equipamento ainda. Vença chefes para encontrar peças.`
14. IF the equipment payload fails to load THEN the game SHALL fight with the unchanged attacker and the panel SHALL show `Equipamento indisponível`.
15. IF an unauthenticated request reaches an equipment endpoint THEN the server SHALL answer 401.

**Independent Test**: Equip a +0 weapon with click damage 3 on the leader and read a click of 4 base damage against a monster with 0 defense and no element modifier; add a ring with `CLICK_DAMAGE_PCT` 10 and read 4.4.

---

### P2: Refine with gold

**User Story**: As a player, I want to spend gold to raise a piece's level so that gold stays useful.

**Why P2**: Makes the economy sink; the game is playable without it.

**Acceptance Criteria**:

1. WHEN the player refines a piece below +10 and the wallet holds at least the cost THEN the server SHALL debit the cost, raise the level by 1 and return the piece and the new wallet, in one transaction.
2. The server SHALL charge `floor(500 * 1.7^n)` copper times the rarity cost multiplier (COMMON 1, UNCOMMON 2, RARE 3, EPIC 5, LEGENDARY 8) to take a piece from level n to n+1.
3. IF the wallet holds less than the cost THEN the server SHALL answer 409 `NOT_ENOUGH_COPPER` and change neither the piece nor the wallet.
4. IF the piece is already +10 THEN the server SHALL answer 409 `MAX_REFINE` and change nothing.
5. The server SHALL return every affix value as `floor(base value * (1 + 0.10 * level))` and the weapon's click damage as `round(base * (1 + 0.10 * level), 1 decimal)`, so a +10 piece shows twice the rolled value and every refine of a weapon raises its click damage by at least 0.2.
6. WHEN the game shows a piece below +10 THEN it SHALL show the next refine cost in gold, silver and copper and SHALL disable the Refinar button while the wallet is lower.
7. IF two refine requests arrive at once THEN the server SHALL serialise them on the player row so that the wallet never goes below zero and each level rise is paid once.

**Independent Test**: Give a wallet of 600 copper and a COMMON +0 piece; refine succeeds, leaves 100 copper and +1; a second refine answers 409 `NOT_ENOUGH_COPPER`.

---

### P2: Reroll one affix

**User Story**: As a player, I want to replace a bad affix so that a good base piece can become my build.

**Why P2**: Gives the refine investment a direction beyond raw numbers.

**Acceptance Criteria**:

1. WHEN the player rerolls an affix of a piece at level 5 or higher and the wallet holds 5000 copper THEN the server SHALL debit 5000 copper and replace that affix with a type the piece does not have and a freshly rolled base value, keeping the other affixes and the refine level.
2. IF the piece is below level 5 THEN the server SHALL answer 409 `REFINE_TOO_LOW` and change nothing.
3. IF the wallet holds less than 5000 copper THEN the server SHALL answer 409 `NOT_ENOUGH_COPPER` and change nothing.
4. IF the affix index is outside the piece's affixes THEN the server SHALL answer 400 and change nothing.
5. IF the piece already has every affix type its slot allows (5 for a weapon, 6 otherwise) THEN the server SHALL answer 409 `NO_AFFIX_LEFT` and change nothing.
6. WHEN the game shows a piece at level 5 or higher THEN each affix SHALL carry a Rerrolar button showing the cost.

**Independent Test**: A +5 piece with 2 affixes and 5000 copper: rerolling affix 0 returns a piece whose affix 0 has a different type and affix 1 is untouched, and the wallet drops by 5000.

---

### P3: Sell a piece

**User Story**: As a player, I want to sell unwanted pieces so that the bag does not fill up.

**Why P3**: The full-bag rule already protects the loop; selling is comfort.

**Acceptance Criteria**:

1. WHEN the player sells a piece THEN the server SHALL remove it, credit its sell price to the wallet and return the wallet, in one transaction.
2. IF the piece is worn by a hero THEN the server SHALL unequip it and then sell it.
3. IF the piece does not exist or belongs to another account THEN the server SHALL answer 404 and change nothing.
4. WHEN the game shows a piece THEN it SHALL show the sell price and a Vender button.

**Independent Test**: Sell a COMMON +0 piece and read +100 copper and the piece gone from the bag.

---

## Edge Cases

- WHEN the affix sums push the crit chance over 100 THEN the game SHALL clamp it to 100 (EQP-18).
- WHEN the refine multiplier yields a fraction THEN the server SHALL round an affix value down and the weapon click damage to one decimal (EQP-31).
- IF a player asks for another account's piece by id THEN the server SHALL answer 404, revealing nothing about the id (EQP-16, EQP-42).

---

## Requirement Traceability

IDs follow the order of the criteria: EQP-01 to EQP-11 for "Boss drops equipment", EQP-12 to EQP-26 for "Equip pieces and fight with them", EQP-27 to EQP-33 for "Refine with gold", EQP-34 to EQP-39 for "Reroll one affix", EQP-40 to EQP-43 for "Sell a piece".

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EQP-01 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-02 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-03 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-04 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-05 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-06 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-07 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-08 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-09 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-10 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-11 | P1: Boss drops equipment | T1-T25 | Verified |
| EQP-12 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-13 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-14 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-15 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-16 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-17 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-18 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-19 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-20 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-21 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-22 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-23 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-24 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-25 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-26 | P1: Equip pieces and fight with them | T1-T25 | Verified |
| EQP-27 | P2: Refine with gold | T1-T25 | Verified |
| EQP-28 | P2: Refine with gold | T1-T25 | Verified |
| EQP-29 | P2: Refine with gold | T1-T25 | Verified |
| EQP-30 | P2: Refine with gold | T1-T25 | Verified |
| EQP-31 | P2: Refine with gold | T1-T25 | Verified |
| EQP-32 | P2: Refine with gold | T1-T25 | Verified |
| EQP-33 | P2: Refine with gold | T1-T25 | Verified |
| EQP-34 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-35 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-36 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-37 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-38 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-39 | P2: Reroll one affix | T1-T25 | Verified |
| EQP-40 | P3: Sell a piece | T1-T25 | Verified |
| EQP-41 | P3: Sell a piece | T1-T25 | Verified |
| EQP-42 | P3: Sell a piece | T1-T25 | Verified |
| EQP-43 | P3: Sell a piece | T1-T25 | Verified |

**Coverage:** 43 total, 43 mapped to tasks, 0 unmapped (Verifier PASS, `validation.md`)

---

## Success Criteria

- [ ] Beating the chapter 1 boss always leaves one piece in the bag.
- [ ] A +10 LEGENDARY piece with the maximum rolls raises a click at least 3x over the unequipped click.
- [ ] No request sequence takes the wallet below zero or the bag above 100 pieces.
