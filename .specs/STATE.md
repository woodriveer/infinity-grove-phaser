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

## Handoff

- **Feature**: .specs/features/wallet and .specs/features/drops
- **Phase / Task**: Done - wallet T1-T17 and drops T1-T10 committed, both Verifier-style reports PASS (`validation.md`)
- **Completed**: wallet T1-T17, drops T1-T10
- **In-progress** (file:line): none
- **Next step**: Run the backend (port 8080, `JWT_SECRET` set) and `npm run dev` together once by hand to see the real queue and sync; open gap G-3 of persistent-session (401-after-refresh from an in-game call) now applies to `GET /wallet` and `POST /wallet/sync`
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: main
