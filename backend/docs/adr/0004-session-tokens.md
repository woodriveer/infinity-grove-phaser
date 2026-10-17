# ADR 0004: Session tokens (JWT access + rotating refresh)

- Status: Accepted
- Date: 2026-10-17

## Context

Players must stay signed in across page reloads for up to 30 days, and `/users` endpoints were open to anyone. The backend needs short-lived credentials for API calls and a revocable long-lived credential to renew them.

## Decision

**Tokens**

| Token | Format | Lifetime | Storage |
|---|---|---|---|
| Access | JWT, HS256, `sub` = username, `iat`, `exp` | 24 h (`app.security.access-token-ttl`, default `PT24H`) | Not stored (stateless) |
| Refresh | 256-bit random opaque string (32 bytes from `SecureRandom`, Base64URL, 43 chars) | 30 days (`RefreshToken.TTL_MS`) | Table `refresh_tokens`; only the SHA-256 hex hash is persisted (`token_hash` primary key, `username` indexed, `expires_at`, `revoked`) |

**Endpoints**

- `POST /users` (201) and `POST /users/login` (200) return `{ user: { username, createdAt, lastLoginAt }, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }` (expiries in epoch ms).
- `POST /auth/refresh` with `{ refreshToken }` returns the same shape. The presented token is revoked and a new pair is issued (rotation). A blank or missing `refreshToken` is 400.
- `POST /auth/logout` with `{ refreshToken }` revokes it and returns 204; an unknown or already revoked token still returns 204.
- A refresh token that is unknown, expired, revoked, or whose user no longer exists yields 401 `AUTH_INVALID_REFRESH_TOKEN` (`InvalidRefreshTokenException`, mapped in `ApiExceptionHandler`; an addition to the table in ADR 0003).
- Deleting a user deletes all of that user's refresh tokens; changing a password revokes them all.

**Secret configuration**

- The signing key is `app.security.jwt-secret`, bound from the `JWT_SECRET` environment variable in `application.yaml` with no default. Startup fails when it is missing or shorter than 32 bytes (`SecurityProperties` validation). `start.sh` exports a clearly marked dev-only value for local runs; integration tests supply a fixed test secret through `@SpringBootTest(properties = ...)`.

**Protected routes (`adapter/security/SecurityConfig.kt`)**

- Stateless resource server, CSRF disabled, HS256 `JwtDecoder` built from the same secret.
- Public: `POST /users`, `POST /users/login`, `POST /auth/refresh`, `POST /auth/logout`, and `/error`. The `/error` permit lets Spring's error dispatch (for example the 400 from `IllegalArgumentException` on public routes) reach its response instead of being turned into a 401.
- Every other route, including all other `/users/**`, requires `Authorization: Bearer <accessToken>`.
- A missing header, malformed token, bad signature or expired token returns 401 `AUTH_UNAUTHENTICATED` as `application/problem+json` with `status`, `detail` and `code` (same shape as ADR 0003), plus `WWW-Authenticate: Bearer`.

## Consequences

- Access tokens are not checked against the database, so a revoked session or deleted user keeps a working access token for up to 24 h (revocation lag). Only the refresh path is revocable immediately.
- Authentication is not authorization: any authenticated user may call the protected `/users` endpoints. Per-user authorization is a separate feature.
- A leaked database exposes only hashes, which cannot be used as refresh tokens. A leaked `JWT_SECRET` allows forging access tokens, so it must be injected per environment and rotated if exposed.
- Rotation without reuse detection: replaying a spent refresh token is a plain 401, and two browser tabs refreshing at once means the second one is logged out.
- Login still distinguishes unknown user from wrong password, so username enumeration (ADR 0003) is unchanged.
- Expired and revoked `refresh_tokens` rows are not purged yet.

## Alternatives considered

- Opaque server-side access tokens: rejected; every request would need a database lookup.
- JWT refresh tokens: rejected; they cannot be revoked or rotated without server state anyway, and an opaque value is simpler to hash and store.
- Storing refresh tokens in plain text: rejected; a database leak would hand out usable credentials.
- A default `JWT_SECRET` in `application.yaml`: rejected; a shipped default is a forgeable-token vulnerability in production.
- Session cookies (httpOnly): rejected by the product owner in favour of tokens kept by the game client (see game ADR 0005).
