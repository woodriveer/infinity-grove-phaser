# Persistent Session Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/persistent-session/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `backend/docs/adr/0001-logging.md` (logger in service/domain classes), `backend/docs/adr/0003-exception-handling.md`, `game/vitest.config.js`, `game/playwright.config.js`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`domain/`) | unit | All branches; 1:1 to spec ACs; every listed edge case | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`service/`) | unit | All branches incl. every failure path; fakes for ports | `backend/src/test/kotlin/**/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend security adapters (`adapter/security`) | unit | Token claims/expiry, hash determinism, config validation | `backend/src/test/kotlin/**/adapter/security/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository (`adapter/repository`) | integration | Key query paths (find by hash, revoke all, delete all) | `backend/src/test/kotlin/**/adapter/repository/*IT.kt` | `cd backend && ./gradlew test` (Docker) |
| Backend controller / security chain (`adapter/web`, `SecurityConfig`) | integration | All routes in scope: happy + edge + error paths, over HTTP with RestAssured | `backend/src/test/kotlin/**/adapter/web/*IT.kt` | `cd backend && ./gradlew test` (Docker) |
| Backend ports / use cases / entity / exception types / config | none | build gate only | - | `cd backend && ./gradlew build` |
| Game auth + api modules (`src/auth`, `src/api`) | unit | All branches; 1:1 to spec ACs; every edge case | `game/src/**/*.test.js` | `cd game && npm test` |
| Game scene (`MainMenu`) | unit + e2e | Unit: scene logic with Phaser mocked. E2E: happy path + edge + error for each user-visible AC | `game/src/scenes/*.test.js`, `game/e2e/*.spec.js` | `cd game && npm test`, `cd game && npm run test:e2e` |
| E2E support (`fakeBackend.js`) | e2e | Exercised by existing + new specs | `game/e2e/support/*.js` | `cd game && npm run test:e2e` |
| Ops / docs (`start.sh`, ADRs) | none | - (no behavior) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Backend unit-only tasks; game unit-only tasks | backend: `cd backend && ./gradlew ktlintCheck test` / game: `cd game && npm test` |
| Full | Backend integration tasks (Docker running); game tasks with e2e | backend: `cd backend && ./gradlew ktlintCheck test` / game: `cd game && npm test && npm run test:e2e` |
| Build | After phase completion or config/entity-only tasks | `cd backend && ./gradlew build` and `cd game && npm run build && npm test && npm run test:e2e` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend session core (domain, ports, services)

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Backend adapters and HTTP

```
T7 → T8 → T9 → T10 → T11 → T6 → T12 → T13 → T14
```

### Phase 3: Game session core

```
T15 → T16 → T17 → T18 → T19
```

### Phase 4: Game UI and end-to-end

```
T20 → T21 → T22 → T23 → T24
```

### Phase 5: Ops and docs

```
T25 → T26 → T27
```

---

## Task Breakdown

### T1: Add InvalidRefreshTokenException

**What**: Add `InvalidRefreshTokenException` (`AUTH_INVALID_REFRESH_TOKEN`) to the business exception hierarchy.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/BusinessException.kt`
**Depends on**: None
**Reuses**: `LoginException` pattern in the same file
**Requirement**: SESS-10

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Exception extends `BusinessException` with code `AUTH_INVALID_REFRESH_TOKEN` and no HTTP concerns
- [x] Gate passes: `cd backend && ./gradlew build`
- [x] Test count: unchanged

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add InvalidRefreshTokenException`
**Status**: ✅ Complete

---

### T2: RefreshToken domain model

**What**: Add `RefreshToken` and `AuthTokens` domain types with lifetime rules (usable only when not revoked and `now < expiresAt`), `revoke()`, and an `issue()` factory returning the raw token plus the entity.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/RefreshToken.kt`
**Depends on**: T1
**Reuses**: `User.kt` companion/logger pattern; `RefreshTokenSecretPort` declared in T3 is injected, so this task declares the minimal port it needs in the same file's package via T3 ordering (see note)
**Requirement**: SESS-10, SESS-12

> Note: `issue()` takes `generate: () -> String` and `hash: (String) -> String` lambdas, so T2 compiles without the port; T5 passes the port's methods.

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `isUsableAt` is false when revoked, false when `now >= expiresAt`, true otherwise
- [x] `issue` sets `expiresAt = now + 30 days` and stores only the hash of the generated raw value
- [x] `RefreshTokenTest` covers: usable, expired at the exact boundary, revoked, revoke() is idempotent, issue stores hash not raw
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): add RefreshToken domain model`
**Status**: ✅ Complete

---

### T3: Session ports

**What**: Declare `AccessTokenIssuerPort`, `RefreshTokenSecretPort`, `RefreshTokenRepositoryPort` and the `AccessToken` value type.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/SessionPorts.kt`
**Depends on**: T2
**Reuses**: `UserRepositoryPort.kt` style
**Requirement**: SESS-10, SESS-11, SESS-12

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Interfaces match the design (`issue`, `generate`, `hash`, `save`, `findByHash`, `revokeAllByUsername`, `deleteAllByUsername`)
- [x] Gate passes: `cd backend && ./gradlew build`
- [x] Test count: unchanged

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add session ports`
**Status**: ✅ Complete

---

### T4: Session use cases

**What**: Declare `StartSessionUseCase`, `RefreshSessionUseCase`, `EndSessionUseCase`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/usecase/SessionUseCase.kt`
**Depends on**: T3
**Reuses**: `UserUseCase.kt` style
**Requirement**: SESS-01, SESS-10, SESS-16

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Three interfaces exist as in the design
- [x] Gate passes: `cd backend && ./gradlew build`
- [x] Test count: unchanged

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add session use cases`
**Status**: ✅ Complete

---

### T5: SessionService

**What**: Implement start, refresh (with rotation) and end of sessions, with logging per ADR 0001, plus in-memory test fakes for the three ports.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/SessionService.kt`
**Depends on**: T4
**Reuses**: `UserService.kt` (`@Service @Transactional`, logger), `Fakes.kt` (add `InMemoryRefreshTokenRepository`, `FakeAccessTokenIssuer`, `FakeRefreshTokenSecrets`)
**Requirement**: SESS-01, SESS-10, SESS-16

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `start(user)` returns access token + expiry from the issuer and a refresh token expiring 30 days after `now`; persists only the hash
- [x] `refresh` with a usable token revokes the old one, persists a new one and returns new access + refresh tokens
- [x] `refresh` throws `InvalidRefreshTokenException` for unknown, expired, revoked tokens and when the user no longer exists
- [x] `end` revokes a known token; unknown or already revoked token does not throw
- [x] `SessionServiceTest` covers each bullet above including both failure paths per cause
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): add SessionService with refresh token rotation`
**Status**: ✅ Complete

---

### T6: Revoke refresh tokens on user delete and password change

**What**: `UserService.delete` deletes and `updatePassword` revokes all refresh tokens of the user through `RefreshTokenRepositoryPort`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/UserService.kt`
**Depends on**: T11
**Reuses**: Existing `UserServiceTest` setup
**Requirement**: SESS-11

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Deleting a user removes all of that user's tokens and leaves other users' tokens
- [x] Changing a password marks all of that user's tokens revoked and leaves other users' tokens
- [x] A failed delete (user missing) touches no tokens
- [x] `UserServiceTest` updated and extended for the three bullets above
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): revoke refresh tokens when a user is deleted or changes password`
**Status**: ✅ Complete

---

### T7: SecurityProperties

**What**: Bind `app.security.jwt-secret` and `access-token-ttl` (default 24h), failing startup when the secret is shorter than 32 bytes; add `app.security.jwt-secret: ${JWT_SECRET}` to `application.yaml` and test property to the integration test base.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityProperties.kt`
**Depends on**: None (runs after Phase 1 by phase order)
**Reuses**: Spring `@ConfigurationProperties` with `@Validated`; `IntegrationTestBase` (add `properties = ["app.security.jwt-secret=..."]` to `@SpringBootTest`)
**Requirement**: SESS-12

**Tools**:

- MCP: `context7` (Spring Boot 4 configuration properties binding)
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] A secret of 31 bytes is rejected, 32 bytes accepted (unit test on validation logic)
- [x] `application.yaml` has no default secret; `IntegrationTestBase` supplies a test secret so the context loads
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add security properties with jwt secret validation`
**Status**: ✅ Complete

---

### T8: JwtAccessTokenIssuer

**What**: Implement `AccessTokenIssuerPort` with `NimbusJwtEncoder` (HS256, `sub` = username, `iat`, `exp = now + ttl`); add the `spring-security-oauth2-jose` dependency.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/JwtAccessTokenIssuer.kt`
**Depends on**: T7
**Reuses**: `BCryptPasswordHasher.kt` adapter style; `SecurityProperties`
**Requirement**: SESS-01, SESS-12

**Tools**:

- MCP: `context7` (Spring Security `NimbusJwtEncoder.withSecretKey`)
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Issued token decodes with the same key; `sub` equals the username; `exp - iat` equals 24 h; returned `expiresAt` equals `exp` in epoch ms
- [x] A token signed with another key fails decoding; an expired token fails decoding
- [x] Existing integration tests still pass (dependency does not enable Spring Security auto-configuration)
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: full

**Commit**: `feat(auth): add HS256 JWT access token issuer`
**Status**: ✅ Complete

---

### T9: Sha256RefreshTokenSecrets

**What**: Implement `RefreshTokenSecretPort` with `SecureRandom` (32 bytes, Base64URL) and SHA-256 hex hashing.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/Sha256RefreshTokenSecrets.kt`
**Depends on**: T8
**Reuses**: `BCryptPasswordHasher.kt` adapter style
**Requirement**: SESS-12

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `generate` returns 43-char Base64URL strings that differ between calls
- [x] `hash` is deterministic, 64 hex chars, and differs from the input
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): add SHA-256 refresh token secrets adapter`
**Status**: ✅ Complete

---

### T10: RefreshTokenEntity

**What**: JPA entity for table `refresh_tokens` (`token_hash` PK, `username` indexed, `expires_at`, `revoked`) with domain mapping.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/RefreshTokenEntity.kt`
**Depends on**: T9
**Reuses**: `UserEntity.kt`
**Requirement**: SESS-12

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `toDomain()` and `from()` round-trip all fields
- [x] Gate passes: `cd backend && ./gradlew build` (context loads, Hibernate creates the table)
- [x] Test count: unchanged

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add refresh token entity`
**Status**: ✅ Complete

---

### T11: RefreshTokenRepository

**What**: Implement `RefreshTokenRepositoryPort` over a Spring Data `JpaRefreshTokenRepository` declared in the same file.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/RefreshTokenRepository.kt`
**Depends on**: T10
**Reuses**: `UserRepository.kt`, `IntegrationTestBase`
**Requirement**: SESS-10, SESS-11

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `save` then `findByHash` returns the token; unknown hash returns null
- [x] `revokeAllByUsername` sets `revoked` only on that user's tokens
- [x] `deleteAllByUsername` removes only that user's tokens
- [x] `RefreshTokenRepositoryIT` covers each bullet; table is cleaned before each test
- [x] `@Service` and `@Transactional` are restored on `SessionService` (removed in T5 so the context loads before its adapters exist) and the TODO comment is removed; the application context loads
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test` (Docker running)
- [x] Test count: previous + new tests, none deleted

**Tests**: integration
**Gate**: full

**Commit**: `feat(auth): add refresh token repository`
**Status**: ✅ Complete

---

### T12: Login and sign-up return tokens

**What**: `POST /users` and `POST /users/login` return `AuthResponse` (user + both tokens + expiries) by calling `StartSessionUseCase` after the user use case.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/UserController.kt`
**Depends on**: T6
**Reuses**: `UserResponse`, `SessionService`
**Requirement**: SESS-01

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Sign-up returns 201 with `user.username`, non-blank `accessToken`/`refreshToken`, `accessTokenExpiresAt` about now + 24 h and `refreshTokenExpiresAt` about now + 30 days
- [x] Login returns 200 with the same shape; wrong password / unknown user responses unchanged (401 / 404 and codes)
- [x] The refresh token row exists in the DB as a hash that differs from the returned token
- [x] `UserControllerIT` updated for the new response shape (existing assertions kept)
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test` (Docker running)
- [x] Test count: previous + new tests, none deleted

**Tests**: integration
**Gate**: full

**Commit**: `feat(auth): return access and refresh tokens on login and sign-up`
**Status**: ✅ Complete

---

### T13: AuthController refresh and logout

**What**: Add `POST /auth/refresh` (200 `AuthResponse`) and `POST /auth/logout` (204) and map `InvalidRefreshTokenException` to 401 in `ApiExceptionHandler`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/AuthController.kt`
**Depends on**: T12
**Reuses**: `ApiExceptionHandler.kt` (add handler, same commit), `RefreshSessionUseCase`, `EndSessionUseCase`
**Requirement**: SESS-10, SESS-16

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Refresh with a valid token returns new tokens and the old token then fails with 401 `AUTH_INVALID_REFRESH_TOKEN`
- [x] Unknown token, expired token (row with past `expires_at`), revoked token, and token of a deleted user each return 401 with that code
- [x] Blank or missing `refreshToken` returns 400
- [x] Logout returns 204, the token no longer refreshes; logout with an unknown or already revoked token still returns 204
- [x] `AuthControllerIT` covers each bullet
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test` (Docker running)
- [x] Test count: previous + new tests, none deleted

**Tests**: integration
**Gate**: full

**Commit**: `feat(auth): add refresh and logout endpoints`
**Status**: ✅ Complete

---

### T14: SecurityConfig protects /users

**What**: Add Spring Security (stateless, CSRF off, JWT resource server with HS256 decoder) permitting only `POST /users`, `POST /users/login`, `POST /auth/refresh`, `POST /auth/logout`, with a ProblemDetail 401 entry point (`AUTH_UNAUTHENTICATED`); add the starter dependencies and update every existing IT to send a Bearer token.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityConfig.kt`
**Depends on**: T13
**Reuses**: `ApiExceptionHandler` body shape, `SecurityProperties`, `IntegrationTestBase` (add helper that signs up and returns a Bearer token)
**Requirement**: SESS-13

**Tools**:

- MCP: `context7` (Spring Security 7 Kotlin DSL, `oauth2ResourceServer`, entry point)
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `GET /users`, `GET /users/{u}`, `PUT /users/{u}/password`, `DELETE /users/{u}` return 401 `AUTH_UNAUTHENTICATED` with no header, with a malformed token, with a token signed by another key, and with an expired token
- [x] The same routes work with a valid token (existing behavior assertions kept)
- [x] The four public routes work without a token
- [x] 401 body is `application/problem+json` with `status`, `detail`, `code`
- [x] `SecurityIT` covers each bullet; `UserControllerIT` and `AuthControllerIT` still pass
- [x] Gate passes: `cd backend && ./gradlew ktlintCheck test` (Docker running)
- [x] Test count: previous + new tests, none deleted

**Tests**: integration
**Gate**: full

**Commit**: `feat(auth): require bearer token on user endpoints`
**Status**: ✅ Complete

---

### T15: sessionStore

**What**: Persist, load, validate and clear the session in `localStorage` key `infinity-grove.session`, with in-memory fallback when storage throws.
**Where**: `game/src/auth/sessionStore.js`
**Depends on**: None (runs after Phase 2 by phase order)
**Reuses**: `config.js` module style
**Requirement**: SESS-02, SESS-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `save` then `load` returns an equal session (user, both tokens, both expiries)
- [x] Invalid JSON, a missing field, or a non-numeric expiry makes `load` return null and removes the entry
- [x] `clear` removes the entry
- [x] When `localStorage` throws on read and write, `save` then `load` still works in memory
- [x] `fromAuthResponse` maps the backend response to the stored shape
- [x] `sessionStore.test.js` covers each bullet
- [x] Gate passes: `cd game && npm test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add session store`
**Status**: ✅ Complete

---

### T16: authApi

**What**: `refresh(refreshToken)` and `logout(refreshToken)` on a dedicated axios instance with no auth interceptors, errors wrapped in `ApiError`.
**Where**: `game/src/api/authApi.js`
**Depends on**: T15
**Reuses**: `config.js`, `ApiError.js`, `httpClient.js` axios defaults
**Requirement**: SESS-04, SESS-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `refresh` POSTs `{ refreshToken }` to `/auth/refresh` and returns the response data
- [x] `logout` POSTs `{ refreshToken }` to `/auth/logout`
- [x] A 401 rejects with `ApiError` status 401 and the code; a network failure rejects with `ApiError` status 0
- [x] `authApi.test.js` covers each bullet
- [x] Gate passes: `cd game && npm test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add auth api`
**Status**: ✅ Complete

---

### T17: sessionManager

**What**: Orchestrate the session: `start`, `restore`, single-flight `refresh`, `accessToken`, `logout`.
**Where**: `game/src/auth/sessionManager.js`
**Depends on**: T16
**Reuses**: `sessionStore`, `authApi`
**Requirement**: SESS-03, SESS-04, SESS-06, SESS-07, SESS-08, SESS-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `restore` with an unexpired access token returns `active` with the stored user and makes no request
- [x] `restore` with an expired access token and unexpired refresh token calls refresh once, stores the new tokens and returns `active`
- [x] `restore` with both expiries in the past returns `none`, clears storage and makes no request
- [x] `restore` with no or invalid stored data returns `none`
- [x] A refresh that rejects with status 401 clears storage and `restore` returns `none`
- [x] A refresh that rejects with status 0 keeps storage and `restore` returns `offline` with the error message
- [x] Three concurrent `refresh()` calls issue one request and share its result
- [x] `logout` calls `authApi.logout` with the refresh token and clears storage; when the call rejects it still clears storage and resolves
- [x] `sessionManager.test.js` covers each bullet (authApi mocked, fake clock)
- [x] Gate passes: `cd game && npm test`
- [x] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add session manager`
**Status**: ✅ Complete

---

### T18: httpClient auth interceptors

**What**: Attach `Authorization: Bearer` to requests, and on a 401 for such a request refresh once and retry once; skip all of it when `config.skipAuth` is set.
**Where**: `game/src/api/httpClient.js`
**Depends on**: T17
**Reuses**: Existing error interceptor and `httpClient.test.js` fake adapter
**Requirement**: SESS-05, SESS-06, SESS-14

**Tools**:

- MCP: `context7` (axios interceptors, retry pattern)
- Skill: NONE

**Done when**:

- [ ] With a session, requests carry the Bearer header; without one, they carry none; `skipAuth` requests carry none
- [ ] A 401 on a Bearer request triggers one refresh and one retry with the new token, and the retry result is returned
- [ ] If the retry also returns 401, the call rejects with `ApiError` and no second refresh happens
- [ ] If the refresh rejects, the call rejects with that `ApiError`
- [ ] A 401 on a `skipAuth` request is rejected without refresh
- [ ] Two concurrent 401s cause one refresh call and both requests are retried
- [ ] Existing `httpClient.test.js` tests still pass; new tests added for the bullets above
- [ ] Gate passes: `cd game && npm test`
- [ ] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): send bearer token and refresh on 401`

---

### T19: userApi marks credentials calls skipAuth

**What**: `signUp` and `login` pass `skipAuth: true`, and the comment documents the new `AuthResponse` shape.
**Where**: `game/src/api/userApi.js`
**Depends on**: T18
**Reuses**: Existing `userApi.test.js`
**Requirement**: SESS-01, SESS-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Both calls send `skipAuth: true` in the axios config and return `response.data` unchanged
- [ ] `userApi.test.js` updated with the new response fixture and the `skipAuth` assertion
- [ ] Gate passes: `cd game && npm test`
- [ ] Test count: previous + new tests, none deleted

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): mark login and sign-up requests as unauthenticated`

---

### T20: MainMenu restores and stores the session

**What**: On create, restore the session (welcome / form / form with offline message); on login or sign-up success, call `sessionManager.start` and set registry `user` to `response.user`.
**Where**: `game/src/scenes/MainMenu.js`
**Depends on**: None (runs after Phase 3 by phase order)
**Reuses**: Existing `showAuthForm`, `showWelcome`, `showMessage`; `MainMenu.test.js` scene stand-in
**Requirement**: SESS-02, SESS-03, SESS-04, SESS-07, SESS-08, SESS-09

**Tools**:

- MCP: NONE
- Skill: `phaser-scenes`

**Done when**:

- [ ] Registry `user` present: welcome shown, `sessionManager.restore` not called
- [ ] `restore` `active`: registry set, welcome shown, no form
- [ ] `restore` `none`: form shown
- [ ] `restore` `offline`: form shown and the message displayed with the error style
- [ ] Login or sign-up success calls `sessionManager.start` with the response and sets registry `user` to the user object
- [ ] The scene being left while `restore` is pending does not throw
- [ ] `MainMenu.test.js` updated and extended for each bullet
- [ ] Gate passes: `cd game && npm test && npm run test:e2e`
- [ ] Test count: previous + new tests, none deleted

**Tests**: unit + e2e
**Gate**: full

**Commit**: `feat(game): restore stored session in main menu`

---

### T21: MainMenu Logout button

**What**: Show a "Logout" button with the welcome screen; click calls `sessionManager.logout`, clears registry `user`, removes the welcome and shows the login form without starting the game. Add `.logout` button style.
**Where**: `game/src/scenes/MainMenu.js`
**Depends on**: T20
**Reuses**: `.auth-actions button` styles in `public/style.css` (add `.logout` rule in the same commit)
**Requirement**: SESS-15

**Tools**:

- MCP: NONE
- Skill: `phaser-input-keyboard-mouse-touch`

**Done when**:

- [ ] Welcome state renders a button with accessible name "Logout"; auth form state does not
- [ ] Click calls `sessionManager.logout` once, clears registry `user`, destroys welcome and logout DOM, shows the form
- [ ] When `logout` rejects the form still shows
- [ ] Clicking Logout does not call `scene.start('ClickerGame')`
- [ ] `MainMenu.test.js` extended for each bullet
- [ ] Gate passes: `cd game && npm test && npm run test:e2e`
- [ ] Test count: previous + new tests, none deleted

**Tests**: unit + e2e
**Gate**: full

**Commit**: `feat(game): add logout button`

---

### T22: Shrink the logo

**What**: Scale the logo to 400 px wide and rest it at y = 150.
**Where**: `game/src/scenes/MainMenu.js`
**Depends on**: T21
**Reuses**: Existing logo tween
**Requirement**: SESS-17

**Tools**:

- MCP: NONE
- Skill: `phaser-sprites-and-images`

**Done when**:

- [ ] `logo.setScale(400 / logo.width)` is applied and the tween targets `y: 150`
- [ ] Unit test asserts the scale and tween target using a logo stand-in with `width: 2760`
- [ ] Gate passes: `cd game && npm test && npm run test:e2e`
- [ ] Test count: previous + new tests, none deleted

**Tests**: unit + e2e
**Gate**: full

**Commit**: `fix(game): shrink main menu logo`

---

### T23: Fake backend and existing e2e adopt tokens

**What**: Extend the fake backend with the new `AuthResponse` shape, `POST /auth/refresh` and `/auth/logout`, Bearer enforcement on protected routes, and controllable token expiry, so existing auth specs pass against the new contract.
**Where**: `game/e2e/support/fakeBackend.js`
**Depends on**: T22
**Reuses**: `mockBackend`, `serverDown`, `problem()` helpers; `auth.spec.js` (adjust assertions only where the response shape or call list changed)
**Requirement**: SESS-01, SESS-10, SESS-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `mockBackend` routes `**/api/users**` and `**/api/auth/**`; login/sign-up return the full `AuthResponse`
- [ ] Refresh rotates tokens and rejects unknown/used tokens with 401 `AUTH_INVALID_REFRESH_TOKEN`; logout revokes with 204
- [ ] `serverDown` aborts both route groups
- [ ] Existing `auth.spec.js` scenarios all pass
- [ ] Gate passes: `cd game && npm test && npm run test:e2e`
- [ ] Test count: all existing e2e scenarios still present

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): teach fake backend the token contract`

---

### T24: Session e2e scenarios

**What**: Add Playwright scenarios for the persistent session and logout.
**Where**: `game/e2e/session.spec.js`
**Depends on**: T23
**Reuses**: `openMainMenu`, `fillCredentials`, `registryValue`, `mockBackend`
**Requirement**: SESS-02, SESS-03, SESS-04, SESS-05, SESS-07, SESS-08, SESS-09, SESS-15, SESS-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] After login and reload, the welcome shows with no form and no `/users/login` call; `localStorage` holds the session
- [ ] With the stored access expiry set to the past, reload shows the welcome after exactly one `/auth/refresh` call and tokens in storage change
- [ ] A rejected refresh (401) removes the storage entry and shows the form
- [ ] With the server down on reload, storage is kept, the form shows with "Cannot reach the server. Try again later."
- [ ] Corrupt stored JSON is removed and the form shows
- [ ] Logout removes the storage entry, sends one `/auth/logout`, shows the form, and does not start `ClickerGame`; reload then shows the form
- [ ] The logo `displayWidth` is 400 via `window.__PHASER_GAME__`
- [ ] Gate passes: `cd game && npm test && npm run test:e2e`
- [ ] Test count: previous + 7 new scenarios, none deleted

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): add persistent session e2e scenarios`

---

### T25: start.sh exports a dev JWT secret

**What**: Export `JWT_SECRET` with a dev-only default (overridable) before `bootRun`.
**Where**: `start.sh`
**Depends on**: None (runs after Phase 4 by phase order)
**Reuses**: Existing script structure
**Requirement**: SESS-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `JWT_SECRET="${JWT_SECRET:-<dev-only 32+ byte string>}"` is exported, with a comment saying it is not for production
- [ ] `bash -n start.sh` passes
- [ ] Gate passes: `cd backend && ./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `chore: export dev jwt secret in start script`

---

### T26: Backend ADR 0004 session tokens

**What**: Document the token design and update the exception table in ADR 0003 reference.
**Where**: `backend/docs/adr/0004-session-tokens.md`
**Depends on**: T25
**Reuses**: ADR format of `0003-exception-handling.md`
**Requirement**: SESS-10, SESS-12, SESS-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR states endpoints, token lifetimes, hashing, secret configuration (`JWT_SECRET`), public routes, consequences (24 h revocation lag, username enumeration unchanged)
- [ ] Gate passes: `cd backend && ./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `docs(backend): add ADR for session tokens`

---

### T27: Game ADR 0005 persistent session

**What**: Document the stored session, refresh flow and logout; supersede the "session lives in memory only" consequence of ADR 0003.
**Where**: `game/docs/adr/0005-persistent-session.md`
**Depends on**: T26
**Reuses**: ADR format of `0003-authentication-ui-in-main-menu.md`
**Requirement**: SESS-02, SESS-04, SESS-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR states storage key and shape, restore outcomes, single-flight refresh, `skipAuth`, logout, localStorage XSS trade-off
- [ ] Gate passes: `cd game && npm run build && npm test && npm run test:e2e`

**Tests**: none
**Gate**: build

**Commit**: `docs(game): add ADR for persistent session`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5
Phase 2:  T7 ------→ T8 ------→ T9 ------→ T10 -----→ T11 -----→ T6 ------→ T12 -----→ T13 -----→ T14
Phase 3:  T15 -----→ T16 -----→ T17 -----→ T18 -----→ T19
Phase 4:  T20 -----→ T21 -----→ T22 -----→ T23 -----→ T24
Phase 5:  T25 -----→ T26 -----→ T27
```

Execution is strictly sequential - there is no intra-phase parallelism. 27 tasks pack into 4 batches of whole phases: [P1 = 5], [P2 = 9, includes T6 moved after T11], [P3 = 5], [P4+P5 = 8].

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1-T4, T9-T11, T15-T16, T19 | 1 file / 1 concept | ✅ Granular |
| T5 | service + test fakes | ✅ cohesive |
| T7, T8, T14 | 1 main file plus a dependency/config line | ⚠️ OK, cohesive |
| T13 | controller + handler mapping | ⚠️ OK, handler needs the endpoint to be testable |
| T20-T22 | 3 sequential edits to one scene file | ✅ Granular |

## Diagram-Definition Cross-Check

Every task depends on the previous task in its chain; the first task of each phase has no in-phase predecessor and relies on phase order. Diagram and `Depends on` fields match for all 27 tasks (validated by `validate_tasks.py`).

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | exception types | none | none | ✅ OK |
| T2 | domain | unit | unit | ✅ OK |
| T3, T4 | ports / use cases | none | none | ✅ OK |
| T5, T6 | service | unit | unit | ✅ OK |
| T7, T8, T9 | security adapters | unit | unit | ✅ OK |
| T10 | entity | none | none | ✅ OK |
| T11 | repository | integration | integration | ✅ OK |
| T12, T13, T14 | controller / security chain | integration | integration | ✅ OK |
| T15-T19 | game auth + api | unit | unit | ✅ OK |
| T20-T22 | MainMenu scene | unit + e2e | unit + e2e | ✅ OK |
| T23, T24 | e2e support / specs | e2e | e2e | ✅ OK |
| T25-T27 | ops / docs | none | none | ✅ OK |
