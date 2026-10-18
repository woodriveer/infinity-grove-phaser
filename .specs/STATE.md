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

## Handoff

- **Feature**: .specs/features/elements (builds on stages)
- **Phase / Task**: Done - elements T1-T8 committed and pushed, Verifier report PASS (`validation.md`, 30/30 mutants killed)
- **Completed**: elements T1-T8 (backend EnemyStats and columns, `/progress` payload, game element table, damage formula, scene HUD, e2e); earlier stages, wallet and drops; pause menu and farm toggle (`26e1ccb`)
- **In-progress** (file:line): none
- **Next step**: characters with their own element, damage type and critical stats (the player is fire, physical, 10 % critical until then); decide the HUD wording of the enemy line and the critical mark (spec-precision gaps in `validation.md`)
- **Blockers**: none
- **Uncommitted files**: `game/src/adapters/phaser/Preloader.js` (the owner's coin atlas switch) and `game/public/assets/coin-*.png`; they predate this feature and were never staged
- **Branch**: main
