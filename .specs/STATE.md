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

## Handoff

- **Feature**: .specs/features/characters (hero cards, bag, fusion, leader, farm; builds on stages, drops and elements)
- **Phase / Task**: Done - T1 to T53 committed and pushed; Verifier PASS in iteration 2 (`validation.md`)
- **Completed**: backend (hero catalog and seed, chapter order, `PlayerCards`, drops in the outcome transaction, `GET /heroes`, fuse, `PUT /leader`, `GET /farm`, `POST /farm/outcome`, registration with `startingElement`), game (hero screens, skill bar, card notice, farm mode, sign up choice), e2e (registration, heroes, farm), ADRs backend 0007 and game 0009, AD-005 to AD-007
- **In-progress** (file:line): none
- **Next step**: `hero-combat` (execute the skills, leader bonus, hero stats) and TD-001 (translate the existing English text)
- **Blockers**: none
- **Uncommitted files**: `game/public/assets/coin-*.png` (the owner coin art, never staged)
- **Branch**: main
