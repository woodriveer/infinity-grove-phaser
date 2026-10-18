# Equipment Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/equipment/design.md`
**Status**: In Progress (approved by the owner: "Pode seguir com a implementação"; executed inline, no sub-agents)

Paths: `BE` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `backend/build.gradle.kts` (ktlint), `game/vitest.config.js`, root `CLAUDE.md` (push right after every commit). Same matrix as the characters feature.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; 1:1 to spec ACs; every listed edge case; hand-written fakes, no mocks | `BT/domain/*Test.kt` | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Backend service | unit | All branches and every failure path of the spec, with in-memory fakes | `BT/service/*Test.kt` | same |
| Backend config | unit | Defaults and rejected values | `BT/adapter/config/*Test.kt` | same |
| Backend repository | integration | Key query paths, sync of rows | `BT/adapter/repository/*IT.kt` | `cd backend && ./gradlew --offline ktlintCheck test` |
| Backend controller | integration | Every route: happy path, each listed error with status and `code`, 401 | `BT/adapter/web/*IT.kt` | same |
| Backend entity / port interface | none | build gate only | - | `cd backend && ./gradlew --offline build` |
| Game domain | unit | All branches; every spec AC for pure rules | `GS/domain/**/*.test.js` | `cd game && npm test` |
| Game application | unit | Success, failure and ordering paths over mocked gateways | `GS/application/**/*.test.js` | `cd game && npm test` |
| Game http adapter | unit | URL, body and returned data | `GS/adapters/http/*.test.js` | `cd game && npm test` |
| Game phaser adapter | unit | DOM output and scene behavior with the Phaser stand-in | `GS/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| Static assets, CSS, docs | none | build gate only | - | `cd game && npm run build` |

## Gate Check Commands

> Windows: run Gradle with `JAVA_HOME=C:/Users/yan_b/.jdks/corretto-25.0.2`. Docker must run for the backend integration tests.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick (backend) | Backend tasks with unit tests only | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Quick (game) | Game tasks with unit tests only | `cd game && npm test` |
| Full (backend) | Backend tasks with integration tests | `cd backend && ./gradlew --offline ktlintCheck test` |
| Build | Last task of a phase, or tasks without tests | backend: `cd backend && ./gradlew --offline build`; game: `cd game && npm run build && npm test` |

---

## Execution Plan

Phases run in order; tasks run one at a time. Each task is one atomic commit followed by `git push` (root `CLAUDE.md`).

### Phase 1: Backend domain rules

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Backend persistence and configuration

```
T6 → T7 → T8
```

### Phase 3: Drops

```
T9 → T10 → T11
```

### Phase 4: Equipment API

```
T12 → T13 → T14 → T15 → T16
```

### Phase 5: Game rules and services

```
T17 → T18 → T19 → T20 → T21
```

### Phase 6: Game screen and combat

```
T22 → T23 → T24
```

### Phase 7: Closing

```
T25
```

---

## Task Breakdown

## Phase 1 tasks: Backend domain rules

### T1: Item model and numbers

**What**: `Slot`, `Rarity`, `AffixType`, `Affix`, `Piece` and `EquipmentRules` with the refined values, weapon click damage, refine cost, reroll cost and sell price.
**Where**: `BE/domain/Equipment.kt`
**Depends on**: None
**Reuses**: validation style of `Hero.kt`
**Requirement**: EQP-28, EQP-31, EQP-33

**Done when**:

- [x] `Rarity` affix counts are 1, 2, 3, 4, 4 and value multipliers 1.0, 1.2, 1.5, 1.8, 2.2; cost multipliers 1, 2, 3, 5, 8
- [x] `Piece.value(affix)` is `floor(base * (1 + 0.1 * refine))`; `clickDamage()` is the weapon base times `1 + 0.1 * refine` to one decimal (null for other slots)
- [x] `refineCost()` is `floor(500 * 1.7^refine)` times the rarity cost multiplier, null at +10; `sellPrice()` is `100 * rarity index * (1 + 0.5 * refine)` rounded down
- [x] A weapon without base click damage, a non-weapon with one, a repeated affix type, a `CLICK_DAMAGE_PCT` on a weapon, more affixes than the rarity allows, or refine outside 0..10 is rejected with `IllegalArgumentException`
- [x] `EquipmentTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T2: Equipment exceptions and wallet credit/debit

**What**: `EquipmentRequestException` (400), `EquipmentNotFoundException` (404), `EquipmentConflictException` (409) with the concrete exceptions and codes, and `Wallet.plus(copper)` / `Wallet.minus(copper)`.
**Where**: `BE/domain/EquipmentExceptions.kt`
**Depends on**: T1
**Reuses**: `BusinessException`, `HeroExceptions.kt`, `Wallet.addClamped`
**Requirement**: EQP-16, EQP-29, EQP-30, EQP-35, EQP-36, EQP-37, EQP-38

**Done when**:

- [x] Codes are exactly `EQUIPMENT_NOT_FOUND`, `NOT_ENOUGH_COPPER`, `MAX_REFINE`, `REFINE_TOO_LOW`, `NO_AFFIX_LEFT`, `INVALID_AFFIX`
- [x] `Wallet.minus` below zero throws `NotEnoughCopperException` and leaves the wallet unchanged; `plus` clamps at `Long.MAX_VALUE`
- [x] `EquipmentExceptionsTest` and `WalletTest` additions pass; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T3: Piece roll

**What**: `PieceRoller.roll(encounter, rules, chance, id)` that decides the drop, the rarity by the weights of the encounter, the slot, the affix types and base values, and the weapon base click damage.
**Where**: `BE/domain/PieceRoller.kt`
**Depends on**: T2
**Reuses**: `CardDropper` shape
**Requirement**: EQP-01, EQP-02, EQP-03, EQP-04, EQP-05, EQP-09

**Done when**:

- [x] A miniboss roll drops only when `chance() < 0.25`; a chapter boss at `1.0`; a `PHASE` encounter never rolls (and reads no chance)
- [x] Rarity follows the weights (miniboss 60/30/10, chapter boss 40/40/15/5) at the boundary rolls of a scripted `chance`
- [x] A weapon gets a base click damage in 2..5 times the rarity multiplier (floored) and no `CLICK_DAMAGE_PCT`; other slots get none and may roll it
- [x] Each piece has as many distinct affix types as its rarity allows, each base inside the type's range times the multiplier, floored
- [x] `PieceRollerTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T4: Refine and reroll on a piece

**What**: `Piece.refined()` and `Piece.rerolled(index, chance)`.
**Where**: `BE/domain/Equipment.kt` (modify)
**Depends on**: T3
**Reuses**: `PieceRoller` value rolls
**Requirement**: EQP-27, EQP-30, EQP-34, EQP-35, EQP-37, EQP-38

**Done when**:

- [x] `refined()` raises the level by 1 and throws `MaxRefineException` at +10
- [x] `rerolled(index)` at level 5 or more replaces that affix with a type the piece lacks (not `CLICK_DAMAGE_PCT` on a weapon) and a new base, leaving the others and the level
- [x] Below level 5 it throws `RefineTooLowException`; an index outside the affixes `InvalidAffixException`; no type left `NoAffixLeftException`
- [x] `EquipmentTest` additions pass; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T5: Worn slots and the bag

**What**: `PlayerEquipment` with capacity, `add`, `equip`, `unequip`, `remove`, `worn`.
**Where**: `BE/domain/PlayerEquipment.kt`
**Depends on**: T4
**Reuses**: `PlayerCards` immutable-update style
**Requirement**: EQP-08, EQP-12, EQP-13, EQP-14, EQP-15, EQP-16, EQP-41

**Done when**:

- [x] `add` stores a piece below capacity and reports `stored false` at 100 pieces
- [x] `equip` puts the piece on the hero's slot, unwears the previous piece of that slot, and moves a piece worn by another hero leaving that slot empty
- [x] `unequip` keeps the piece; `remove` of a worn piece unwears it first; an unknown id throws `EquipmentNotFoundException`
- [x] `PlayerEquipmentTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

## Phase 2 tasks: Backend persistence and configuration

### T6: Equipment port and entity

**What**: `EquipmentRepositoryPort` and the JPA entity `equipment_pieces` with domain mapping.
**Where**: `BE/adapter/repository/PieceEntity.kt`
**Depends on**: T5
**Reuses**: `PlayerCardsEntities.kt`, `HeroPorts.kt`
**Requirement**: EQP-01

**Done when**:

- [x] The port exposes `findAll(username)`, `save(piece)`, `delete(id)`, `deleteByUsername(username)`
- [x] The entity maps every `Piece` field, affixes as `TYPE:base` joined by commas, both ways
- [x] Build gate passes

**Status**: Done
**Tests**: none
**Gate**: Build

---

### T7: Equipment repository

**What**: `EquipmentRepository` over a Spring Data interface.
**Where**: `BE/adapter/repository/EquipmentRepository.kt`
**Depends on**: T6
**Reuses**: `PlayerCardsRepository.kt`
**Requirement**: EQP-01

**Done when**:

- [x] Saved pieces come back equal from `findAll`, only for their username, with affix order kept
- [x] `delete` removes one piece; `deleteByUsername` removes all of a player and no other
- [x] `EquipmentRepositoryIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T8: Equipment settings

**What**: `app.equipment` properties, validation and the `EquipmentRules` bean, with the shipped values in `application.yaml`.
**Where**: `BE/adapter/config/EquipmentConfig.kt`
**Depends on**: T7
**Reuses**: `CardConfig.kt`
**Requirement**: EQP-01, EQP-02, EQP-08, EQP-28, EQP-34

**Done when**:

- [x] Defaults are miniboss rate 0.25, chapter boss rate 1.0, bag 100, refine base cost 500, reroll cost 5000
- [x] A rate outside 0..1, a capacity below 1 or a negative cost fails to build the rules
- [x] `EquipmentConfigTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

## Phase 3 tasks: Drops

### T9: Equipment rewards

**What**: `WalletAccess` and `EquipmentRewards.award(username, encounter)`: roll under the caller's player lock, store the piece or sell it into the wallet when the bag is full.
**Where**: `BE/service/EquipmentRewards.kt`
**Depends on**: T7, T8
**Reuses**: `CardRewards.kt`, `WalletService.load`
**Requirement**: EQP-01, EQP-02, EQP-06, EQP-07, EQP-08

**Done when**:

- [x] A won boss with a passing roll stores the piece and returns it with `sold false`; a failing roll returns null and stores nothing
- [x] With 100 pieces in the bag it stores nothing, credits the sell price to the wallet and returns the piece with `sold true`
- [x] A missing wallet is created before the credit
- [x] `EquipmentRewardsTest` passes with in-memory fakes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T10: Drops in the campaign report

**What**: `ProgressService.report` awards equipment after the cards; `ProgressResponse` carries `equipmentDrop`.
**Where**: `BE/service/ProgressService.kt` (modify)
**Depends on**: T9
**Reuses**: `awardCards`, `ProgressResponse.drop`
**Requirement**: EQP-01, EQP-02, EQP-06, EQP-07, EQP-09, EQP-11

**Done when**:

- [x] `CLEARED` miniboss (roll 0.0) and chapter boss responses carry `equipmentDrop` and the piece is in `GET /equipment` storage (checked through the repository)
- [x] A `CLEARED` phase, a `FAILED` report and a 409 mismatch drop nothing and leave the bag unchanged
- [x] A failure while storing the piece rolls the progress move back
- [x] `EquipmentDropFlowIT` and the existing `ProgressControllerIT` / `CardsFlowIT` pass; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T11: Drops in the farm report

**What**: `FarmService.report` awards equipment on a win; `FarmResultResponse` carries `equipmentDrop`.
**Where**: `BE/service/FarmService.kt` (modify)
**Depends on**: T10
**Reuses**: `EquipmentRewards`
**Requirement**: EQP-01, EQP-02, EQP-09, EQP-11

**Done when**:

- [x] A farmed chapter boss win carries `equipmentDrop`; a `FAILED` farm report, a `FARM_TOO_FAST`, a `DAILY_LIMIT_REACHED` and a `BOSS_NOT_AVAILABLE` answer drop nothing and add no piece
- [x] Existing `FarmControllerIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

## Phase 4 tasks: Equipment API

### T12: List and equip

**What**: `EquipmentService` (list, equip, unequip), the use-case interfaces, `EquipmentController` `GET /equipment`, `POST /equipment/{id}/equip`, `POST /equipment/{id}/unequip`, and the `ApiExceptionHandler` mappings.
**Where**: `BE/service/EquipmentService.kt`
**Depends on**: T11
**Reuses**: `HeroService`, `HeroController`
**Requirement**: EQP-12, EQP-13, EQP-14, EQP-15, EQP-16, EQP-17, EQP-26

**Done when**:

- [x] `GET /equipment` returns the pieces with refined values, `clickDamage`, `refineCost`, `rerollCost`, `sellPrice` and `heroId`, plus the capacity
- [x] Equip puts the piece on the hero, replaces the previous one and moves it from another hero; unequip empties the slot but keeps the piece
- [x] Unknown piece or another account's piece is 404 `EQUIPMENT_NOT_FOUND`; an unowned hero 409 `HERO_NOT_OWNED`; no token 401; nothing changes on an error
- [x] `EquipmentServiceTest` and `EquipmentControllerIT` pass; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T13: Refine

**What**: `refine` in `EquipmentService` and `POST /equipment/{id}/refine`.
**Where**: `BE/service/EquipmentService.kt` (modify)
**Depends on**: T12
**Reuses**: `Piece.refined`, `WalletAccess`
**Requirement**: EQP-27, EQP-28, EQP-29, EQP-30, EQP-31, EQP-33

**Done when**:

- [x] A wallet of 600 copper and a COMMON +0 piece: refine answers +1 and wallet 100 copper; the next refine is 409 `NOT_ENOUGH_COPPER` and nothing changes
- [x] +10 answers 409 `MAX_REFINE`
- [x] Two parallel refines on a wallet that pays one leave the wallet at zero or above and the level raised once
- [x] `EquipmentServiceTest` additions and `EquipmentRefineIT` pass; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T14: Reroll

**What**: `reroll` in `EquipmentService` and `POST /equipment/{id}/reroll`.
**Where**: `BE/service/EquipmentService.kt` (modify)
**Depends on**: T13
**Reuses**: `Piece.rerolled`
**Requirement**: EQP-34, EQP-35, EQP-36, EQP-37, EQP-38

**Done when**:

- [x] A +5 piece with 5000 copper rerolls affix 0 to another type, keeps affix 1 and the level, and the wallet drops by 5000
- [x] Below +5 is 409 `REFINE_TOO_LOW`; under 5000 copper 409 `NOT_ENOUGH_COPPER`; a bad index 400 `INVALID_AFFIX`; all types held 409 `NO_AFFIX_LEFT`; each leaves piece and wallet unchanged
- [x] `EquipmentServiceTest` additions and `EquipmentRerollIT` pass; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T15: Sell

**What**: `sell` in `EquipmentService` and `POST /equipment/{id}/sell`.
**Where**: `BE/service/EquipmentService.kt` (modify)
**Depends on**: T14
**Reuses**: `PlayerEquipment.remove`
**Requirement**: EQP-40, EQP-41, EQP-42

**Done when**:

- [ ] Selling a COMMON +0 piece credits 100 copper and removes it
- [ ] A worn piece is unequipped and sold; an unknown or foreign piece is 404 with nothing changed
- [ ] `EquipmentServiceTest` additions and `EquipmentSellIT` pass; full backend gate passes

**Status**: Pending
**Tests**: integration
**Gate**: Full (backend)

---

### T16: Pieces leave with the account

**What**: `UserService.delete` removes the player's pieces; ADR 0008 and AD-009.
**Where**: `BE/service/UserService.kt` (modify)
**Depends on**: T15
**Reuses**: `UserService.delete`
**Requirement**: EQP-01

**Done when**:

- [ ] After deleting a user, `findAll(username)` is empty
- [ ] `backend/docs/adr/0008-equipment.md` records the decisions and `.specs/STATE.md` has AD-009
- [ ] `UserServiceTest` addition passes; full backend gate and build gate pass

**Status**: Pending
**Tests**: unit
**Gate**: Full (backend)

---

## Phase 5 tasks: Game rules and services

### T17: Damage with pierce and boss damage

**What**: `calculateDamage` reads `attacker.armorPierce` and `attacker.bossDamage` and a `boss` flag.
**Where**: `GS/domain/combat/damage.js`
**Depends on**: None
**Reuses**: existing formula
**Requirement**: EQP-19, EQP-20, EQP-22

**Done when**:

- [ ] Defense is multiplied by `1 - min(100, armorPierce)/100`; damage by `1 + bossDamage/100` only when `boss` is true
- [ ] Missing fields leave the result identical to today (defaults 0)
- [ ] `damage.test.js` additions pass; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T18: Equipment rules for the game

**What**: `wornBy`, `attackerFor`, `bossTimeBonusMs`, labels and `describeAffix` / `formatCopper`.
**Where**: `GS/domain/equipment/equipment.js`
**Depends on**: T17
**Reuses**: `damage.js` `PLAYER`
**Requirement**: EQP-18, EQP-21, EQP-22, EQP-23

**Done when**:

- [ ] `attackerFor(base, pieces)` gives damage `(1 + weapon clickDamage) * (1 + sum CLICK_DAMAGE_PCT/100)`, crit chance `min(100, 10 + sum)`, crit multiplier `2 + sum/100`, pierce and boss damage sums; a +0 weapon of 3 gives 4, plus a ring of 10 % gives 4.4
- [ ] With no pieces it returns the base attacker unchanged; `bossTimeBonusMs` is `1000 * sum BOSS_TIME_SECONDS`
- [ ] Labels: Comum, Incomum, Raro, Épico, Lendário; Arma, Armadura, Anel, Amuleto; one Portuguese label per affix type
- [ ] `equipment.test.js` passes; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T19: Equipment gateway

**What**: `createEquipmentApi(httpClient)` with list, equip, unequip, refine, reroll and sell.
**Where**: `GS/adapters/http/equipmentApi.js`
**Depends on**: T18
**Reuses**: `heroesApi.js`
**Requirement**: EQP-12, EQP-27, EQP-34, EQP-40

**Done when**:

- [ ] Each call hits the URL and body of the design and resolves with the response data
- [ ] `equipmentApi.test.js` passes; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T20: Equipment collection and wallet update

**What**: `createEquipmentCollection({ gateway })` plus `WalletLedger.setBase` / `walletSync.setWallet`.
**Where**: `GS/application/equipment/equipmentCollection.js`
**Depends on**: T19
**Reuses**: `heroCollection.js`, `walletLedger.js`
**Requirement**: EQP-12, EQP-25, EQP-27, EQP-34, EQP-40

**Done when**:

- [ ] `load` keeps the pieces and notifies; a failed load keeps the previous pieces and `loaded` false
- [ ] equip, unequip, refine, reroll and sell update the pieces from the response; refine, reroll and sell pass the returned wallet to `onWallet`
- [ ] `applyDrop(piece)` adds a dropped piece unless `sold`
- [ ] `setBase` replaces the ledger base wallet and keeps landed unreported copper in `display()`
- [ ] collection and ledger tests pass; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T21: Equipment drops through the sessions

**What**: `campaignSession` fires `onEquipmentDrop` for an accepted report carrying `equipmentDrop`; the farm result keeps the field.
**Where**: `GS/application/campaign/campaignSession.js` (modify)
**Depends on**: T20
**Reuses**: `onDrop`
**Requirement**: EQP-06, EQP-10

**Done when**:

- [ ] An accepted report with `equipmentDrop` fires the callback once with it; a report without it fires nothing
- [ ] `campaignSession.test.js` and `farmSession.test.js` additions pass; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

## Phase 6 tasks: Game screen and combat

### T22: Equipment view

**What**: `renderEquipment(state, actions)`: the heroes' slots, the bag list, and the piece detail with Equipar/Remover/Refinar/Rerrolar/Vender and their costs.
**Where**: `GS/adapters/phaser/views/equipmentView.js`
**Depends on**: T21
**Reuses**: `bagView.js`, `dom.js`
**Requirement**: EQP-23, EQP-24, EQP-25, EQP-32, EQP-39, EQP-43

**Done when**:

- [ ] Lists each piece with slot, rarity, `+n`, affixes (label and refined value) and, for a weapon, `Dano de clique: <1 decimal>`
- [ ] An empty bag shows `Nenhum equipamento ainda. Vença chefes para encontrar peças.`; a failed load shows `Equipamento indisponível`
- [ ] The detail shows the next refine cost in gold, silver and copper and disables Refinar when the wallet is lower; at +10 there is no Refinar; from +5 each affix has Rerrolar with the cost; Vender shows the price
- [ ] `equipmentView.test.js` passes; `npm test` passes

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T23: Equipment screen and notice

**What**: `HeroUi` gets the sixth button "Equipamento", the `render_equipment` screen and `showEquipmentDrop` with `Equipamento encontrado: <raridade> <slot>` for 3 s.
**Where**: `GS/adapters/phaser/HeroUi.js` (modify)
**Depends on**: T22
**Reuses**: `render_bag`, `showDrop`
**Requirement**: EQP-10, EQP-23, EQP-25

**Done when**:

- [ ] The button opens the screen, pausing the fight like the others; failures show the error line
- [ ] The notice text for a dropped RARE WEAPON is exactly `Equipamento encontrado: Raro Arma` and hides after 3 s
- [ ] `HeroUi.test.js` additions pass; build and `npm test` pass; the HUD still fits (checked in the browser by T24)

**Status**: Pending
**Tests**: unit
**Gate**: Quick (game)

---

### T24: Combat with equipment

**What**: `ClickerGame` builds the attacker from the leader's pieces, applies the boss damage flag and the boss time bonus, receives equipment drops and wallet updates; `composition.js` wires the collection and API.
**Where**: `GS/adapters/phaser/ClickerGame.js` (modify)
**Depends on**: T23
**Reuses**: `hitMonster`, `showEncounter`, `receiveDrop`
**Requirement**: EQP-18, EQP-19, EQP-20, EQP-21, EQP-22, EQP-25

**Done when**:

- [ ] A click uses the leader's attacker (weapon +3 click damage hits for 4 against a 0-defense monster of the same element rules); without pieces the click is unchanged
- [ ] A boss countdown starts at the encounter limit plus the leader's `BOSS_TIME_SECONDS`
- [ ] An `equipmentDrop` from a report shows the notice and joins the collection; a refine's wallet updates the displayed wallet
- [ ] If the equipment fails to load the fight uses the base attacker
- [ ] `ClickerGame.test.js` additions pass; `npm run build` and `npm test` pass; the screen is checked once in the browser

**Status**: Pending
**Tests**: unit
**Gate**: Build

---

## Phase 7 tasks: Closing

### T25: Feature documentation

**What**: Close traceability in `spec.md`, mark the tasks done, update the game readme.
**Where**: `.specs/features/equipment/spec.md` (modify)
**Depends on**: T24
**Reuses**: n/a
**Requirement**: EQP-01

**Done when**:

- [ ] Every requirement is `Verified` in the traceability table and the coverage line says 43 mapped
- [ ] Build gates of backend and game pass

**Status**: Pending
**Tests**: none
**Gate**: Build
