# ADR 0005: Persistent session in localStorage

- Status: Accepted
- Date: 2026-10-17
- Supersedes: the "session lives in memory only" consequence of [ADR 0003](0003-authentication-ui-in-main-menu.md)

## Context

Players had to log in on every page load because the session lived only in the Phaser registry. The backend now issues a 24 h access token and a rotating 30-day refresh token (backend ADR 0004), and protects `/users/**` with a Bearer token.

## Decision

**Storage**

- `src/auth/sessionStore.js` keeps the session in `localStorage` under the key `infinity-grove.session` as JSON: `{ user: { username, createdAt, lastLoginAt }, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }` (expiries in epoch ms).
- A value that is not valid JSON, lacks a field, or has a non-numeric expiry is removed and treated as no session.
- If `localStorage` throws, the session is kept in memory for the page lifetime.

**Restore on MainMenu (`sessionManager.restore`)**

- `registry.user` already set: show the welcome, no restore.
- Otherwise MainMenu shows `...` and awaits `restore()`, which returns:
  - `active`: the access token is unexpired (no request), or it was renewed with one `POST /auth/refresh`. The user is put in `registry.user` and the welcome shows.
  - `none`: nothing stored, invalid data, both expiries in the past (entry removed, no request), or the refresh answered 401 (entry removed). The login form shows.
  - `offline`: the refresh failed without an HTTP response. The stored session is kept and the form shows with the error message ("Cannot reach the server. Try again later.").
- After the await MainMenu checks `this.sys.isActive()` before touching the scene.

**Requests and refresh**

- `httpClient` adds `Authorization: Bearer <accessToken>` while a session exists. On a 401 for such a request it calls `sessionManager.refresh()` once and retries the request once; a second 401, or a refresh failure, rejects with `ApiError`.
- Refresh is single-flight: concurrent callers share one `POST /auth/refresh` and its result.
- `authApi` (refresh, logout) uses its own axios instance without these interceptors, so `sessionManager` and `httpClient` have no import cycle.
- Login and sign-up pass `skipAuth: true`: they never carry a Bearer and a 401 (wrong password) never triggers a refresh or retry.

**Logout**

- While the welcome shows, a "Logout" button (its own DOM element, since the welcome block is click-through) calls `sessionManager.logout()`: it sends `POST /auth/logout` with the refresh token, and always clears the stored session, even if the request fails.
- MainMenu then clears `registry.user`, destroys the welcome and button, and shows the login form. The "click to start" pointer handler is removed first, so logging out never starts `ClickerGame`.

**Login and sign-up success** call `sessionManager.start(response)` and store only `response.user` in `registry.user`.

## Consequences

- Reloads on the same browser profile resume without typing credentials for up to 30 days of inactivity.
- Tokens in `localStorage` are readable by any script running on the page (XSS). This trade-off was accepted over httpOnly cookies; mitigations are rotation and server-side revocation of the refresh token, short access token life, and no `innerHTML` with user data (MainMenu uses `textContent`).
- Two tabs refreshing at once: with rotation, the second refresh gets 401 and falls back to the login form. Single-flight only covers one tab.
- A wrong device clock is recoverable because a 401 triggers refresh regardless of the stored expiry.
- Logout only ends the session on this device; other devices keep their own refresh tokens until they expire or the password changes.

## Alternatives considered

- httpOnly cookie session: rejected by the product owner; would also require CORS and CSRF handling.
- `sessionStorage`: does not survive closing the tab, defeating the goal.
- Storing only the refresh token and always refreshing on boot: simpler, but costs a request on every load and fails whenever the backend is briefly down.
