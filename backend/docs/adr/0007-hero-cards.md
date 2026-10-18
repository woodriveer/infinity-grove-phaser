# ADR 0007: Hero cards (server-rolled drops, one locked aggregate, chapter order by starting element)

- Status: Accepted
- Date: 2026-10-18

## Context

Heroes are collected as cards: bosses drop them, three copies of a card fuse into one card of the next star level, and a hero's stars unlock its three skills. A player picks one of three starting heroes at registration and the chapters follow an order of elements that depends on that pick. Minibosses and the chapter boss become repeatable so a 1 % and a 10 % drop are reachable, and the chapter boss is limited to 10 wins per UTC day. Combat runs in the browser (`AD-002`), so the server never sees a kill, but it must be the one that decides what drops.

## Decision

**Catalog.** `heroes` and `hero_skills` hold the five README heroes (id, name, class, element, leader bonus, portrait and per skill name, type, effect text, cooldown seconds, art name). `HeroSeeder` inserts the ones that are missing at startup and never overwrites, like `ChapterSeeder`.

**One aggregate per player.** `PlayerCards` holds the starting element, the leader, the copies per (hero, stars 0 to 3) and a `BossRecord` (chapters whose boss the player beat, the wins of one UTC day, the time of the last farm win). It is stored in `player_cards` (one row, comma-separated cleared chapters) and `card_copies` (one row per stack, synced on save). Every operation that changes it reads the `player_cards` row with `PESSIMISTIC_WRITE`. Lock order is always `progress` first, then `player_cards`; fusion and leader changes only take the second.

**Chapter order.** `ChapterOrder.elements(start)`: the starting element (FIRE, WATER or NATURE), the element it hits hardest (FIRE to NATURE, NATURE to WATER, WATER to FIRE), the remaining one, DARKNESS, LIGHT. The hero of chapter c is the hero of that element. The catalog stores no chapter number.

**Drops are decided in the report transaction.** `ProgressService.report` runs in one transaction: it applies the move, then `CardRewards.award` rolls the drop and updates the cards. A cards failure rolls the progress move back. The roll uses an injected `ChanceRollerPort` (a uniform number in [0, 1)); a drop happens when it is below the rate. `CardDropper` decides which hero: a miniboss drops the hero of its chapter at `miniboss-rate` (1 %); the chapter boss of chapter c releases the hero of chapter c + 1 (chapter 5 drops its own), with certainty on the first win of it and at `chapter-boss-rate` (10 %) afterwards. Phase wins and failed fights never roll. The response of `POST /progress/outcome` carries `drop` (`{ heroId, heroName, stars }`) when a card dropped.

**Update 2026-10-18.** Every boss win drops a card: the shipped `miniboss-rate` and `chapter-boss-rate` are 1.0 (the code defaults stay 1 % and 10 %, and the integration tests pin those). Clearing a chapter boss moves the campaign to stage 1 of the next chapter (`ProgressService` answers with that chapter's definition); the last chapter, 5, is the only one that completes. `ChapterSeeder` seeds chapters 1 to 5 (`ChapterDefinition.of`: the same shape with more health and defense each chapter), and a progress stored as completed before this (`completed` in chapter 1) opens chapter 2 the next time it is read. The farm lists the bosses of the chapter the player is in, so the bosses of earlier chapters can no longer be replayed.

**Fusion and leader.** `POST /heroes/{id}/fuse { stars }` turns 3 cards of stars 0, 1 or 2 into 1 of stars + 1, all or nothing under the row lock. `PUT /leader { heroId }` needs an owned hero. `GET /heroes` returns the catalog as the player sees it: chapter, copies per stars 0 to 3, owned, stars, and per skill whether it is unlocked (skill n unlocks at n stars or more).

**Farm.** `GET /farm` lists the bosses the player has beaten (the miniboss of every stage below the current one, of the current one once the chapter boss is next, all of them and the chapter boss when completed) and the chapter boss wins left today. `POST /farm/outcome { boss, outcome }` rolls the same rates and drops the same hero as the campaign, never changes the progress, adds one chapter boss win per chapter boss win, refuses the 11th chapter boss win of a UTC day (`DAILY_LIMIT_REACHED`), a boss not beaten yet (`BOSS_NOT_AVAILABLE`) and a win within `farm-min-interval-ms` (5 000) of the previous one (`FARM_TOO_FAST`). A campaign chapter boss win counts as one of the day's wins. A `FAILED` farm report answers 200 and changes nothing.

**Registration.** `POST /users` takes `startingElement` (FIRE, WATER or NATURE; anything else is 400 `INVALID_STARTING_ELEMENT`), creates the user and its `PlayerCards` (one blank card of that hero, the leader) in one transaction. Deleting a user deletes the cards.

**Settings.** `app.cards.miniboss-rate`, `chapter-boss-rate`, `chapter-boss-daily-limit`, `farm-min-interval-ms`.

**Errors.** `HeroRequestException` is 400 (`INVALID_STARTING_ELEMENT`, `INVALID_FUSION`), `HeroNotFoundException` 404 (`HERO_NOT_FOUND`), `HeroConflictException` 409 (`NOT_ENOUGH_CARDS`, `HERO_NOT_OWNED`, `DAILY_LIMIT_REACHED`, `BOSS_NOT_AVAILABLE`, `FARM_TOO_FAST`), through `ApiExceptionHandler` (ADR 0003). A player with no cards row answers 422 `PLAYER_WITHOUT_HEROES` on the hero routes and gets no drop (a warning is logged).

**Storage.** Tables are created by Hibernate `ddl-auto: update` (ADR 0005). Existing accounts have no cards row; the owner clears them.

## Consequences

- A client cannot choose or see a drop in advance; it can still claim wins it did not make, limited by the 5 s farm spacing, the 10 chapter boss wins a day and the rule that a boss must be beaten first (`AD-002`). The campaign wins are limited by the state machine of ADR 0006.
- Registering, reporting an outcome, fusing and changing the leader are each one transaction; two fusions of the same player run one after the other.
- A hero's chapter depends on the player, so the same hero is chapter 1 for one player and chapter 3 for another.
- `GET /heroes` takes the cards row lock for a moment, which serializes it with a fusion of the same player.

## Alternatives considered

- Pre-rolled card queues like the coin drops (ADR 0005): rejected; the client would see the next card and could skip fights until it comes.
- Rolling in a separate request after the report: rejected; two requests, no atomicity, the client could skip the call.
- The client reporting the dropped card: rejected; trivially forgeable.
- One table per concern (leader, bag, boss record): rejected; one lock and one transaction are simpler.
- Chapter number stored on the hero: rejected; the order depends on the starting element.
