# Persistent Session Specification

## Problem Statement

Players must type username and password on every page load because the session lives only in the Phaser registry (ADR 0003). The backend issues no tokens, so `/users` endpoints are open to anyone. The main-menu logo (2760x1504 px) also renders at natural size and covers the menu. We need a stored session that survives reloads on the same browser, a way to log out, and a smaller logo.

## Goals

- [ ] A player who logged in on a browser reaches the "Click to Start!" screen on reload without typing credentials, for up to 30 days of inactivity.
- [ ] Access tokens expire 24 hours after issue; the game renews them with the refresh token without user action.
- [ ] The player can log out from the main menu, which ends the session on that device.
- [ ] Every `/users` endpoint except sign-up and login rejects requests without a valid access token.
- [ ] The main-menu logo displays at 400 px wide.

## Out of Scope

| Feature                                          | Reason                                                      |
| ------------------------------------------------ | ----------------------------------------------------------- |
| httpOnly-cookie session                          | Decided: localStorage                                       |
| Per-user authorization (only own record editable) | Any authenticated user may call protected endpoints; separate feature |
| Refresh-token reuse detection / token families   | Rotation only; reuse of a revoked token is a plain 401      |
| "Log out all devices" button                     | Backend revokes all tokens on password change/delete only   |
| Rate limiting of login/refresh                   | Separate feature                                            |
| Logout button inside ClickerGame / GameOver      | Logout lives in MainMenu                                    |
| Device fingerprinting                            | "Same device" = same browser profile holding the stored refresh token |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Storage | `localStorage` key `infinity-grove.session` | User decision | y |
| Refresh token lifetime / mode | 30 days, rotating (each refresh issues a new one and revokes the old) | User decision | y |
| Protect existing endpoints | Yes, Bearer access token on `/users/**` except `POST /users` and `POST /users/login` | User decision | y |
| Access token format | JWT, HS256, claim `sub` = username, 24 h expiry, via Spring Security OAuth2 resource server | Stateless verification; standard library support | n |
| Refresh token format | 256-bit random opaque string, stored as SHA-256 hash in new table `refresh_tokens` | Revocable; a DB leak does not expose usable tokens | n |
| Auth endpoints | `POST /auth/refresh`, `POST /auth/logout` (both public); login/sign-up keep `/users/login` and `POST /users` | Minimal change to existing routes | n |
| Login/sign-up response shape | `{ user: {username, createdAt, lastLoginAt}, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }` (epoch ms) | Breaking change to current `UserResponse`; game, fake backend and ITs updated in the same feature | n |
| Concurrent refresh from two tabs | Second tab's refresh fails with 401 and falls back to the login form | Rotation without grace window; reuse detection is out of scope | n |
| Refresh network failure | Keep stored session, show login form with error message, do not clear storage | A temporary outage must not log the player out | n |
| Existing users in DB | Unaffected; no migration (Hibernate `ddl-auto: update` creates `refresh_tokens`) | Matches current schema management | n |
| JWT secret | Env var `JWT_SECRET` mapped to `app.security.jwt-secret`, minimum 32 bytes; startup fails if missing; tests use a fixed test secret | No default secret in prod config | n |
| Existing refresh tokens on password change | All revoked | Stolen-credential recovery | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Stay signed in on this device ⭐ MVP

**User Story**: As a returning player, I want the game to remember my login on this computer so that I do not type credentials every time.

**Why P1**: This is the core request.

**Acceptance Criteria**:

1. WHEN login or sign-up succeeds THEN the backend SHALL return an access token valid for 24 hours and a refresh token valid for 30 days with their expiry timestamps.
2. WHEN login or sign-up succeeds THEN the game SHALL write the user, both tokens and both expiry timestamps to `localStorage` key `infinity-grove.session`.
3. WHEN MainMenu opens and the stored access token is unexpired THEN the game SHALL show the welcome screen for the stored user and SHALL NOT render the login form.
4. WHEN MainMenu opens, the stored access token is expired and the refresh token is unexpired THEN the game SHALL call `POST /auth/refresh`, replace the stored tokens with the response and show the welcome screen.
5. WHEN a protected request returns HTTP 401 THEN the game SHALL call `POST /auth/refresh` once and retry the original request once with the new access token.
6. WHEN several protected requests return 401 at the same time THEN the game SHALL issue a single refresh call and retry all of them with its result.
7. IF `POST /auth/refresh` returns 401 THEN the game SHALL remove `infinity-grove.session` from `localStorage`, clear the registry user and show the login form.
8. IF `POST /auth/refresh` fails without an HTTP response (network error or timeout) THEN the game SHALL keep `infinity-grove.session` unchanged and show the login form with the error message.
9. IF the stored value is not valid JSON or lacks a field the game needs THEN the game SHALL remove it and show the login form.
10. IF both stored token expiries are in the past THEN the game SHALL remove the stored session and show the login form without calling the backend.

**Independent Test**: Log in, reload the page, see "Hello, <name>!" with no form; set the access expiry to the past, reload, see the same screen and one `/auth/refresh` call.

---

### P1: Backend token lifecycle

**User Story**: As the system, I want short-lived access tokens and revocable rotating refresh tokens so that a stolen token has bounded value.

**Why P1**: The stored session in the game depends on these endpoints.

**Acceptance Criteria**:

1. WHEN `POST /auth/refresh` receives an unexpired, unrevoked refresh token THEN the backend SHALL respond 200 with a new access token and a new refresh token (same response shape as login) and mark the presented refresh token revoked.
2. IF the presented refresh token is unknown, expired or revoked THEN the backend SHALL respond 401 with code `AUTH_INVALID_REFRESH_TOKEN`.
3. IF the user owning the refresh token no longer exists THEN the backend SHALL respond 401 with code `AUTH_INVALID_REFRESH_TOKEN`.
4. IF the refresh request body lacks `refreshToken` or it is blank THEN the backend SHALL respond 400.
5. WHEN a user is deleted THEN the backend SHALL delete all refresh tokens of that user.
6. WHEN a user's password changes THEN the backend SHALL revoke all refresh tokens of that user.
7. The backend SHALL store only the SHA-256 hash of each refresh token.
8. The backend SHALL sign access tokens with the secret from `app.security.jwt-secret`, and SHALL fail to start when it is shorter than 32 bytes.

**Independent Test**: Integration test: login, refresh, refresh again with the first token (401), refresh with the second token (200).

---

### P1: Protect user endpoints

**User Story**: As the system owner, I want `/users` endpoints to require authentication so that anonymous callers cannot list or delete users.

**Why P1**: Chosen by the user alongside the session work.

**Acceptance Criteria**:

1. WHEN a request to a `/users/**` route other than `POST /users` and `POST /users/login` carries a valid unexpired Bearer access token THEN the backend SHALL process it as before.
2. IF such a request has no Authorization header, a malformed token, a bad signature or an expired token THEN the backend SHALL respond 401 with code `AUTH_UNAUTHENTICATED` in a ProblemDetail body.
3. WHEN `POST /users`, `POST /users/login`, `POST /auth/refresh` or `POST /auth/logout` is called without a token THEN the backend SHALL process it.
4. The game SHALL send `Authorization: Bearer <accessToken>` on every request to a protected route while a session exists.

**Independent Test**: `GET /users` without a token returns 401; with a token from login returns 200.

---

### P1: Log out

**User Story**: As a player on a shared computer, I want to log out so that the next person cannot play as me.

**Why P1**: Requested explicitly.

**Acceptance Criteria**:

1. WHILE the welcome screen is shown the game SHALL display a "Logout" button.
2. WHEN the player clicks "Logout" THEN the game SHALL call `POST /auth/logout` with the refresh token, remove `infinity-grove.session` from `localStorage`, clear the registry user and show the login form.
3. IF the logout request fails for any reason THEN the game SHALL still remove the stored session and show the login form.
4. WHEN `POST /auth/logout` receives a refresh token THEN the backend SHALL revoke it and respond 204.
5. IF the refresh token sent to `POST /auth/logout` is unknown or already revoked THEN the backend SHALL still respond 204.
6. WHEN the player clicks "Logout" THEN the game SHALL NOT start `ClickerGame`.

**Independent Test**: Log in, click Logout, reload: the login form shows; the old refresh token is rejected by `/auth/refresh`.

---

### P2: Smaller logo

**User Story**: As a player, I want a smaller logo so that it does not cover the menu.

**Why P2**: Visual fix, independent of auth.

**Acceptance Criteria**:

1. WHEN MainMenu is shown THEN the logo SHALL have a displayed width of 400 px (scale = 400 / source width) at game resolution 1024x768.
2. WHEN the logo drop-in tween ends THEN the logo SHALL rest at y = 150 so it does not overlap the form/welcome block (y >= 470).

**Independent Test**: Playwright reads the logo's `displayWidth` through `window.__PHASER_GAME__` and gets 400.

---

## Edge Cases

- IF `localStorage` is unavailable or throws THEN the game SHALL continue with an in-memory session for the page lifetime.
- IF the access token is rejected on a protected call and the refresh also returns 401 THEN the game SHALL return to MainMenu's login form.
- WHEN the player's clock is wrong THEN the game SHALL still recover because a 401 triggers refresh regardless of the stored expiry.

---

## Requirement Traceability

| Requirement ID | Story                              | Phase | Status  |
| -------------- | ---------------------------------- | ----- | ------- |
| SESS-01        | P1: Stay signed in (AC 1)          | -     | Pending |
| SESS-02        | P1: Stay signed in (AC 2)          | -     | Pending |
| SESS-03        | P1: Stay signed in (AC 3)          | -     | Pending |
| SESS-04        | P1: Stay signed in (AC 4)          | -     | Pending |
| SESS-05        | P1: Stay signed in (AC 5)          | -     | Pending |
| SESS-06        | P1: Stay signed in (AC 6)          | -     | Pending |
| SESS-07        | P1: Stay signed in (AC 7, 10)      | -     | Pending |
| SESS-08        | P1: Stay signed in (AC 8)          | -     | Pending |
| SESS-09        | P1: Stay signed in (AC 9) + storage edge case | - | Pending |
| SESS-10        | P1: Backend token lifecycle (AC 1-4) | -   | Pending |
| SESS-11        | P1: Backend token lifecycle (AC 5-6) | -   | Pending |
| SESS-12        | P1: Backend token lifecycle (AC 7-8) | -   | Pending |
| SESS-13        | P1: Protect user endpoints (AC 1-3) | -    | Pending |
| SESS-14        | P1: Protect user endpoints (AC 4)  | -     | Pending |
| SESS-15        | P1: Log out (AC 1-3, 6)            | -     | Pending |
| SESS-16        | P1: Log out (AC 4-5)               | -     | Pending |
| SESS-17        | P2: Smaller logo                   | -     | Pending |

**ID format:** `SESS-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 17 total, 0 mapped to tasks, 17 unmapped ⚠️

---

## Success Criteria

- [ ] After login, a page reload shows the welcome screen with zero credential input and zero `/users/login` calls.
- [ ] A session older than 24 h but younger than 30 days resumes with exactly one `/auth/refresh` call.
- [ ] `GET /users` without a token returns 401; a revoked refresh token never yields a new access token.
- [ ] Logout leaves no `infinity-grove.session` entry in `localStorage`.
- [ ] The logo displays 400 px wide.
