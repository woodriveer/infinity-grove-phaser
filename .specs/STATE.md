# STATE

## Decisions

### AD-001
- **Decision**: Authentication uses a stateless HS256 JWT access token (24 h) plus a rotating opaque refresh token (30 days, SHA-256 hashed in `refresh_tokens`); the game keeps the session in `localStorage`.
- **Reason**: Lets a player stay signed in on one browser without server-side session state per request, while refresh tokens remain revocable.
- **Trade-off**: A localStorage refresh token is exposed to XSS, and a revoked user keeps a valid access token until it expires (up to 24 h).
- **Scope**: `backend` security/session code, `game/src/auth`, `game/src/api`
- **Date**: 2026-10-17
- **Status**: active

### AD-002
- **Decision**: Kills are reported by the game in batches (`POST /wallet/sync`); the server credits only the drops it pre-rolled and accepts at most one kill per level `kill-interval-ms` (bucket of 20).
- **Reason**: One request per kill does not scale for a clicker, and combat runs in the browser so the server cannot see a kill.
- **Trade-off**: A client can claim kills it did not make, up to the allowance; kills never synced are lost. Closing the gap needs server-side combat.
- **Scope**: `backend` wallet code, `game/src/scenes/ClickerGame.js` and any future reward (XP, items) that depends on kills
- **Date**: 2026-10-17
- **Status**: active

### AD-003
- **Decision**: The game follows a hexagonal layout (ADR 0007): `domain` (pure rules), `application` (services that receive ports by injection), `adapters` (Phaser scenes, http, storage), composed in `main.js`; imports point inward only and a Vitest test enforces it.
- **Reason**: The stages feature adds a state machine, timers and an ordered report queue that must be testable without Phaser or the network, and `ClickerGame` already mixed rendering with sync policy.
- **Trade-off**: More files and one more hop between a click and a request; hand-written factories instead of a DI container.
- **Scope**: all of `game/src`; new game features are written in this shape
- **Date**: 2026-10-17
- **Status**: active

### AD-004
- **Decision**: Campaign progress is a server-side state machine. The game reports `CLEARED` or `FAILED` from the position it leaves (`POST /progress/outcome`), the server derives the destination and answers 409 with the stored progress on any mismatch; the game mirrors the rules locally and advances before the server answers.
- **Reason**: Play must not wait between phases, but the client must not be able to name an arbitrary destination.
- **Trade-off**: The rules exist on both sides, and boss time limits are not enforced by the server (same limit as AD-002).
- **Scope**: `backend` progress code (ADR 0006), `game/src/domain/campaign`, `game/src/application/campaign`
- **Date**: 2026-10-17
- **Status**: active

### AD-005
- **Decision**: Hero cards are server-authoritative. The backend rolls a drop in the same transaction that accepts a `CLEARED` miniboss or chapter boss report (campaign or farm), stores the bag, and answers `drop`; the game never chooses or reports a card.
- **Reason**: A client-chosen 1 % drop is trivial to forge, and queues of pre-rolled cards (like coins) would let the client see the next card and skip fights.
- **Trade-off**: The server still cannot see a kill (AD-002), so a client can claim wins it did not make; farm wins are spaced by 5 s and the chapter boss pays 10 wins per UTC day.
- **Scope**: `backend` card code (ADR 0007), `game/src/application/campaign`, `game/src/application/farm`
- **Date**: 2026-10-18
- **Status**: active

### AD-006
- **Decision**: The hero of a chapter depends on the player: the starting element (FIRE, WATER or NATURE) chosen at registration, then the element it hits hardest, the remaining one, DARKNESS and LIGHT give the chapter order. The catalog stores elements, not chapter numbers; each chapter boss releases the hero of the next chapter.
- **Reason**: The story changes with the first choice (user decision).
- **Trade-off**: A hero's chapter is not static data; enemy elements per chapter are a separate, still undecided feature.
- **Scope**: `backend` `ChapterOrder`, `CardDropper`, `HeroService`; future chapter content
- **Date**: 2026-10-18
- **Status**: active

### AD-007
- **Decision**: New player-facing text is Portuguese; the text that already exists stays English as technical debt TD-001 (`.specs/features/characters/spec.md`) until a dedicated translation task.
- **Reason**: User decision: everything in Portuguese, existing text recorded as debt.
- **Trade-off**: The game is mixed-language until TD-001 is done; there is no translation layer.
- **Scope**: all of `game/src` and `game/e2e`
- **Date**: 2026-10-18
- **Status**: active

### AD-008
- **Decision**: Every boss win drops a card (rates 1.0), the chapter boss opens the next chapter (1 to 5, only chapter 5 completes), and the farm lists only the bosses of the current chapter.
- **Reason**: User decision after playing: the game stopped after the chapter 1 boss and drops were too rare to test the bag.
- **Trade-off**: A player cannot replay the bosses of earlier chapters; farming a miniboss every 5 s at 100 % makes cards cheap. Chapters 2 to 5 reuse the chapter 1 shape with scaled numbers (enemy design per chapter is still open, AD-006).
- **Scope**: `backend` `Progress`, `ChapterDefinition.of`, `ChapterSeeder`, `application.yaml`; `game` `campaignSession`
- **Date**: 2026-10-18
- **Status**: active

### AD-009
- **Decision**: Equipment is server-authoritative like the cards: pieces are rolled by the backend in the boss report transaction, stored one row each in `equipment_pieces`, and refined, rerolled and sold with copper under the `player_cards` row lock (lock order `progress`, `player_cards`, `wallets`). The game computes damage from the pieces the server returns.
- **Reason**: A client-chosen drop or cost is trivial to forge (AD-005), and per-piece state does not fit the `PlayerCards` row.
- **Trade-off**: Damage is still computed in the browser (AD-002), so equipment raises the value of forging clicks, not the ease; `NO_AFFIX_LEFT` is unreachable with the current catalog.
- **Scope**: `backend` equipment code (ADR 0008), `game/src/domain/equipment`, `game/src/application/equipment`, `ClickerGame`
- **Date**: 2026-10-18
- **Status**: active

### AD-010
- **Decision**: Flyway owns the schema (`V1__schema.sql` onward, `ddl-auto: validate`); every reference is a SQL foreign key, with entities holding plain id columns. Player rows cascade with the user, catalog references restrict; enemies and drop rules are catalogs that stages and chapters reference.
- **Reason**: `ddl-auto: update` cannot add constraints, drop columns or move data, so rows could point at players, heroes or stages that did not exist.
- **Trade-off**: A schema change needs a migration file plus the entity change; the local pre-Flyway database is recreated once (`docker compose down -v`) and its players are lost.
- **Scope**: `backend/src/main/resources/db/migration`, every `backend` entity and repository (ADR 0009)
- **Date**: 2026-10-19
- **Status**: active

### AD-011
- **Decision**: Talents are server-authoritative like the equipment: the backend keeps one `player_talents` row per upgraded talent, takes the copper under the wallet row lock and answers the tree with the value and the next price of each talent; the upgrade request carries the level the player saw (`fromLevel`) and a stale one answers 409 `TALENT_LEVEL_MISMATCH`. The game types no number of the catalog.
- **Reason**: A client-chosen level or price is trivial to forge (AD-009), and a double click must not buy two levels.
- **Trade-off**: Levels cannot be refunded or reset; the price curve `round(300 x 1.6^n)` is a config proposal that was not balance-tested; combat is still in the browser (AD-002).
- **Scope**: `backend` talent code (ADR 0010, `V3__player_talents.sql`), `game/src/domain/talents`, `game/src/application/talents`, the Talentos screen
- **Date**: 2026-10-21
- **Status**: active

### AD-012
- **Decision**: Click power has one pure builder, `leaderAttacker`, that sums equipment, leader stars and power talents (percents add, critical chance caps at 100); the combo (+1 % per click up to +50 %, lost after 1.5 s, frozen while paused) multiplies the final click only and Lyra's leader bonus (30 % double critical click) is rolled once per click in the browser. The attribute panel of the Equipamento screen reads the same builder.
- **Reason**: The combat and the panel must show the same numbers, and skills must not get the combo or the double click (the user wants the click to differ from the skills).
- **Trade-off**: A leader with stars changes every number pinned by skill tests (they carry the 1.1, 1.2 or 1.4 star factor); the combo makes two clicks in the same streak deal different damage, so tests that need plain clicks let the combo lapse first.
- **Scope**: `game/src/domain/combat`, `game/src/domain/heroes/starBonus.js`, `leaderBonus.js`, `ClickerGame`
- **Date**: 2026-10-21
- **Status**: active

### AD-013
- **Decision**: Talents are bought with talent points, not coins: the first clear of a phase pays 1 point, of a miniboss 2 and of a chapter boss 5 (a replay, a failure and a farm win pay nothing); every level of every talent costs 1 point. The backend records one `talent_point_awards` row per player and cleared position (`chapter:stage:encounter:phase`) in the outcome report transaction, derives `available = earned - spent` from the awards and the levels, and an upgrade takes the `progress` row lock. A ninth talent `COMBO` (branch `COMBO`, 5 % a level, max 50) is the cap of the combo bonus; without it the combo gives nothing.
- **Reason**: User decision: progress, not coins, should buy talents, and the combo should be a growing upgrade.
- **Trade-off**: A new player starts with no combo bonus until the first point is spent; clears made before `V5` earn nothing (the migration grants each player as many `legacy` points as the talent levels they already owned); levels still cannot be refunded.
- **Scope**: `backend` talent and progress code (ADR 0011, `V5__talent_point_awards.sql`), `game/src/domain/combat/combo.js`, `game/src/domain/talents`, the Talentos screen, `campaignSession`
- **Date**: 2026-10-22
- **Status**: active; supersedes the coin price of AD-011

### AD-014
- **Decision**: Crystals are a server-authoritative special currency (`player_crystals`, no row = 0) with no source yet; the auto click level (`player_auto_click`, 0 to 4, 500/250/150/100/50 ms) is bought with them under the `progress` row lock, with `fromLevel` and a 409 `AUTO_CLICK_LEVEL_MISMATCH` carrying the stored state. The game clicks in the browser from chapter 2 through the same path as a manual click.
- **Reason**: Same forgery argument as AD-009/AD-011; the owner has not chosen how crystals are earned (an account reset is being considered).
- **Trade-off**: Nobody can upgrade until a crystal source exists; the click rate is not checked by the server (AD-002).
- **Scope**: `backend` auto click code (`V6__auto_click.sql`, `AutoClick*`), `game/src/domain/combat/autoClick.js`, `game/src/application/autoClick`, the HUD box in `ClickerGame`
- **Date**: 2026-10-27
- **Status**: active

### AD-015
- **Decision**: The account reset is the crystal source: `POST /account/reset` from the chapter the player saw (`fromChapter`, 409 `RESET_CHAPTER_MISMATCH` otherwise) under the `progress` row lock puts the campaign back at chapter 1, deletes every talent level and talent point award, pays `min(chapter, 5)` crystals and raises `player_resets`. Coins, equipment, cards, crystals and the auto click level stay. The auto click is unlocked also once `resets >= 1`.
- **Reason**: User decision: reset from chapter 2, chapter N pays N crystals, the auto click must work right after a reset.
- **Trade-off**: 185 crystals for the top auto click mean 37 resets at least; resets have no cooldown; combat is still in the browser (AD-002), so a forged campaign reaches chapter 5 faster.
- **Scope**: `backend` reset code (`V7__player_resets.sql`, `AccountReset*`), `AutoClickService`, `game/src/domain/campaign/accountReset.js`, `game/src/application/accountReset`, the auto click box of `ClickerGame`
- **Date**: 2026-10-27
- **Status**: active; gives AD-014 its crystal source

### AD-016
- **Decision**: The backend goes live only through the blue-green watcher that `./publish.sh` starts: every new commit on `origin/main` that changes `backend/**` is built from the commit tree into the idle slot, checked by the API regression suite on the real database and switched in with `nginx -s reload`; the old slot is kept stopped 5 minutes for `./deploy.sh --rollback`. Every Flyway migration must keep the previous backend working (expand/contract: add columns and tables first, drop them in a later commit), because a failed deploy does not undo the migration it ran.
- **Reason**: User decision: deploy on every push to `main` with no downtime, only after a regression suite passed; Flyway has no down migrations and both slots share one database.
- **Trade-off**: A destructive migration needs two commits; a commit that breaks the old backend through its migration hurts even when its suite fails; uncommitted work no longer reaches players through `publish.sh`.
- **Scope**: `deploy/`, `publish.sh`, `deploy.sh`, `backend/Dockerfile`, the `deploy` profile of `backend/docker-compose.yml`, `backend/src/main/resources/db/migration`
- **Date**: 2026-10-28
- **Status**: active

### AD-017
- **Decision**: The talent tree has 10 talents in 3 grades each (30 ids: `<ID>`, `<ID>_G2`, `<ID>_G3`). Grade N costs N points a level, gives N times the grade 1 value a level and opens at level 10 of the grade before (else 409 `TALENT_LOCKED`); the game adds the values of every grade of a talent. `CLICK_DAMAGE` gives 5 % a level and a tenth talent `CLICK_FLAT_DAMAGE` adds 1, 3, 5... up to 19 to the base damage. A phase pays 0 points (only minibosses and chapter bosses pay), and `POST /talents/reset` (`Reiniciar pontos`) takes every level back and keeps the points earned.
- **Reason**: Owner changes after AD-013 (`b443844`, `4a4f86f`, `08be5c9`), recorded here because the commits changed no spec; the talents Verifier (2026-10-28) found the drift.
- **Trade-off**: A reset with no cost lets the player respec at will; the price of grade 3 makes a full tree far longer to reach than AD-013 planned.
- **Scope**: `backend` talent catalog, upgrade and reset code, `game/src/domain/talents`, the Talentos screen
- **Date**: 2026-10-23
- **Status**: active; supersedes the 9-talent tree, the 1 point a level for every talent and the phase point of AD-013

### AD-018
- **Decision**: A player fights with a team: the leader (still `player_cards.leader_id`) plus up to 4 allies in ally slots bought with copper (1, 2, 3, 4 ouro). Slot n opens on the first win of the chapter 4 + n boss (`cleared_chapters`). The backend stores the bought slots and the allies per account and keeps them through account resets (`GET /heroes` team fields, `PUT /team`, `POST /team/slots` with `fromSlots`). The team fights only while the campaign is at chapter 5 or later. Allies hit in the browser once a second with a new damage type TEAM: leader's element, own stars and worn pieces, resisted only by a new enemy attribute `team_resistance` (0 to 90, expand migration). Each ally brings a passive while it fights. While allies are drawn, the leader stands at the tip of an attack formation with the allies behind it, above and below (spec `hero-team`).
- **Reason**: Owner request and answers of 2026-10-30 ("montar equipes de 5 heróis"; team only from chapter 5; slots bought one per chapter; a damage type of its own); `characters` deferred the team ("one active leader now, team later; the leader is stored as a single value").
- **Trade-off**: Ally damage is computed in the browser like the click (AD-002), so a forged client can claim more. Slots 2 to 4 need the chapter 6 to 8 bosses of AD-019. The slot prices rely on the coin drops of AD-019. The unique key of `enemies` must change without breaking the running backend.
- **Scope**: `backend` hero, team and enemy code, `game/src/domain/combat`, `game/src/domain/heroes`, the Equipe screen, `ClickerGame`
- **Date**: 2026-10-30
- **Status**: active (owner answers 2026-10-30 and 2026-10-31; Q33 to Q35 kept as defaults the owner did not object to); ships after `campaign-chapters`; supersedes the single-leader scope of `characters` and adds a damage type beside PHYSICAL and MAGICAL (`elements`, `hero-skills`)

### AD-019
- **Decision**: The campaign runs to chapter 15 (`ChapterOrder.MAX_CHAPTER = 15`): the chapter 5 boss opens chapter 6 and only the chapter 15 boss completes. Chapters 6 to 15 grow health x2 and defenses +3 per chapter (caps 80, critical resistance 70), and the player's 5-chapter element order repeats. Every health value becomes a 64-bit integer from the database (expand/contract under AD-016) to the game. The reset pays as many crystals as the chapter left (no cap at 5; completed pays 15). On-screen damage and HP numbers abbreviate from 1 000 with K, M, B, T. Coin drops per kill become `2m-6m` (phase), `8m-20m` (miniboss) and `30m-70m` (boss), with `m = 2^(c-1)` up to chapter 8 and `128 + 32(c-8)` after. A first run earns about 1 ouro by the chapter 5 boss and 10 ouro by the chapter 8 boss (spec `campaign-chapters`).
- **Reason**: Owner request and answers of 2026-10-30 ("os próximos capítulos vão aumentando de dificuldade"; overflow must never be a limit; crystals keep growing with the chapter; the ally slots of AD-018 must be affordable on a first run); `hero-team` slots and `miniboss-adds` need chapters past 5 and 10.
- **Trade-off**: The curve is not balance-tested. Players completed at chapter 5 move to chapter 6 and lose the chapter 5 farm list (AD-008). A reset pays up to three times more crystals than AD-015 planned. The health columns need two migrations (expand, then contract after a good deploy). The game's numbers stay exact only up to 2^53 - 1. Coins grow about 9 times faster by chapter 8 than before, and the refine costs stay as they are.
- **Scope**: `backend` `ChapterOrder`, `ChapterDefinition`, `ChapterSeeder`, `AccountReset`, every class carrying health; `backend/src/main/resources/db/migration`; `game/src/domain/campaign/accountReset.js`, `game/src/domain/combat/monster.js` and the damage number format
- **Date**: 2026-10-30
- **Status**: active (owner answers 2026-10-30 and 2026-10-31); supersedes "only chapter 5 completes" of AD-008 and the reward cap 5 of AD-015

## Handoff

- **Feature**: five features from the owner's batch of 2026-10-21, all game side except two backend pieces: `combat-hud`, `click-power`, `talents`, `equipment-ui`, `boss-map` (`.specs/features/*`)
- **Phase / Task**: code of the five features done and pushed; Verifier PASS for `combat-hud` and `click-power`; `talents`, `equipment-ui` and `boss-map` were with the Verifier when this was written (see each `validation.md`)
- **Completed**: chapter pill, HP text, element wheel, skill tooltip, keys Q W E, red dot on Equipamento; star bonus, combo, Lyra's double critical click (backend seed + V2 migration); talent tree (backend `V3`, endpoints, Talentos screen, effects in combat); leader attribute panel, icon bag with rarity frames and tooltip, transfer of a set; chapter map in Rever chefes
- **In-progress** (file:line): none
- **Next step**: the owner generates the art of `PROMPTS_ASSETS_UI.md` into `game/public/assets/ui/` (13 files) and sends the map so the 11 positions of `mapLayout.js` are recalibrated; deploy (`./publish.sh`) is pending and needs the local reset `docker compose down -v` in `backend/` (Flyway V1 to V3 on a fresh database); then the other four leader bonuses, account level / prestige
- **Blockers**: the owner's uncommitted `application.yaml` rates (cards 0.07/0.80, equipment miniboss 0.5) fail `EquipmentDropFlowIT` and `FarmControllerIT`; backend gates ran with `APP_EQUIPMENT_MINIBOSSRATE=0.25 APP_CARDS_MINIBOSSRATEPERSTAGE=0.02 APP_CARDS_CHAPTERBOSSRATE=0.30`
- **Uncommitted files**: `backend/src/main/resources/application.yaml` (owner rate edits), `.idea/`, `game/public/assets/coin-*.png`, `game/src/scenes/` (owner work, never stage them; add files by path)
- **Branch**: main
