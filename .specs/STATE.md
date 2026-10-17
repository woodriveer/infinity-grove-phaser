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

## Handoff

- **Feature**: .specs/features/stages (builds on wallet and drops)
- **Phase / Task**: Done - stages T1-T23 committed and pushed, Verifier-style report PASS (`validation.md`, 28/28 ACs, 10/10 mutants killed)
- **Completed**: stages T1-T23 (backend domain, service, persistence, seeder, endpoints; game refactor to ADR 0007; campaign domain, session, http adapter, scene flow, saving, e2e); earlier wallet T1-T17 and drops T1-T10
- **In-progress** (file:line): none
- **Next step**: Run the backend (port 8080, `JWT_SECRET` set) and `npm run dev` together once by hand to see the real `/progress` flow (gap G4: the two sides are verified separately); decide the wording of the countdown (`Time: N`) and the completion message (`Chapter complete!`) (gaps G1, G2); the persistent-session gap G-3 (401-after-refresh from an in-game call) now also applies to `GET /progress` and `POST /progress/outcome`
- **Blockers**: none
- **Uncommitted files**: `game/src/adapters/phaser/Preloader.js` (the owner's switch of the coin atlas image to `coin-copper.png`) and `game/public/assets/coin-*.png`; they predate this feature and were never staged
- **Branch**: main
