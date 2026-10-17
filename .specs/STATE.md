# STATE

## Decisions

### AD-001
- **Decision**: Authentication uses a stateless HS256 JWT access token (24 h) plus a rotating opaque refresh token (30 days, SHA-256 hashed in `refresh_tokens`); the game keeps the session in `localStorage`.
- **Reason**: Lets a player stay signed in on one browser without server-side session state per request, while refresh tokens remain revocable.
- **Trade-off**: A localStorage refresh token is exposed to XSS, and a revoked user keeps a valid access token until it expires (up to 24 h).
- **Scope**: `backend` security/session code, `game/src/auth`, `game/src/api`
- **Date**: 2026-10-17
- **Status**: active

## Handoff

- **Feature**: .specs/features/persistent-session
- **Phase / Task**: Done - T1-T27 committed, Verifier PASS (`validation.md`)
- **Completed**: T1-T27
- **In-progress** (file:line): none
- **Next step**: Open gap G-3 (401-after-refresh from an in-game protected call) when the first such call is added; commit the staged baseline before merging
- **Blockers**: none
- **Uncommitted files**: .specs/LESSONS.md, .specs/lessons.json (candidate lessons, left out on purpose)
- **Branch**: main
