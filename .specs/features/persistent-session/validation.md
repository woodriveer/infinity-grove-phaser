# Persistent Session Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/persistent-session/spec.md`
**Diff range**: `483ae76..f6bf3b3` (27 commits: backend T1-T14, game T15-T24, ops/docs T25-T27)
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS

PASS with 3 flagged spec-precision gaps (none is an uncovered AC; see "Flagged gaps"). No behavior-level mutant survived except one proven-equivalent mutant (G3). Gate green.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T14 (backend) | Done | All marked complete in tasks.md |
| T15-T24 (game) | Done | All marked complete |
| T25-T27 (ops/docs) | Done | All marked complete |

Note: tasks.md header still says `Status: Draft` (tasks.md:12); cosmetic.

Repo-hygiene finding (not a spec gap): the baseline the feature builds on (`game/package.json` with test scripts + axios/vitest/playwright, `game/src/main.js` exposing `__PHASER_GAME__`, `game/.gitignore`, `backend/.../InfinityGroveWsApplicationTests.kt`, plus the earlier user/login code) is staged but NOT committed. `git worktree add HEAD` therefore does not build or test (`npm test` -> "Missing script: test"); the sensor scratch was built from `HEAD` overlaid with the index (`git checkout-index -a -f --prefix=<scratch>/`). Commit the staged baseline before merge or HEAD is not self-contained.

---

## Spec-Anchored Acceptance Criteria

Paths: BE = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, G = `game/`.

### P1: Stay signed in on this device

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 login/sign-up returns access token 24h + refresh token 30d with expiry timestamps | accessToken+refreshToken non-blank, accessTokenExpiresAt ~ now+24h, refreshTokenExpiresAt ~ now+30d | `BE adapter/web/UserControllerIT.kt:165-170` `assertTrue(accessExp in (before + day - 1_000)..(after + day))`, `assertTrue(refreshExp in (before + 30*day - tolerance)..(after + 30*day + tolerance))`; used for sign-up at `:184-195` (201) and login at `:198-211` (200). Unit: `BE service/SessionServiceTest.kt:39,41` `assertEquals(1_000_000L + FakeAccessTokenIssuer.ACCESS_TTL_MS, result.accessTokenExpiresAt)`, `assertEquals(1_000_000L + thirtyDays, result.refreshTokenExpiresAt)`; `BE domain/RefreshTokenTest.kt:66` `assertEquals(2_592_000_000L, RefreshToken.TTL_MS)`; `BE adapter/security/JwtAccessTokenIssuerTest.kt:40-41` `assertEquals(Duration.ofHours(24), Duration.between(jwt.issuedAt, jwt.expiresAt))`, `SecurityPropertiesTest.kt:28` default `Duration.ofHours(24)` | PASS (note: `user.createdAt/lastLoginAt` fields of the response shape are not asserted over HTTP, only `user.username` at `UserControllerIT.kt:32,128`; shape is in Assumptions, not in an AC) |
| AC2 game writes user, both tokens, both expiries to localStorage `infinity-grove.session` | all 5 fields under that key | `G src/auth/sessionStore.test.js:28-33` `expect(JSON.parse(localStorage.getItem(KEY))).toEqual(session)` with `KEY='infinity-grove.session'` (`:4`); `G src/auth/sessionManager.test.js:41-45` (`start` then `expect(stored()).toEqual(authResponse())`, KEY at `:11`); e2e `G e2e/session.spec.js:40` `expect(JSON.parse(await storedSession(page))).toMatchObject({ user: { username: 'yan' } })` (key via `e2e/support/game.js:47`); MainMenu calls `sessionManager.start(response)` asserted `G src/scenes/MainMenu.test.js:141` | PASS |
| AC3 unexpired stored access token -> welcome for stored user, no login form | `Hello, yan!`, no `.auth-form`, no backend call | e2e `G e2e/session.spec.js:35-38` `toHaveText('Hello, yan!')`, `.auth-form toHaveCount(0)`, `expect(backend.calls.slice(callsBeforeReload)).toEqual([])`, `expect(paths(backend)).toEqual(['/users/login'])`; unit `G src/auth/sessionManager.test.js:59-60` `resolves.toEqual({ status: 'active', user })` + `expect(authApi.refresh).not.toHaveBeenCalled()`; scene `G src/scenes/MainMenu.test.js:218-221` `welcomeTitle()` `'Hello, yan!'`, `form.node` undefined | PASS |
| AC4 access expired + refresh unexpired -> POST /auth/refresh, replace tokens, welcome | exactly one refresh, stored tokens replaced | `G src/auth/sessionManager.test.js:76-78` `toHaveBeenCalledTimes(1)`, `toHaveBeenCalledWith('refresh-1')`, `expect(stored()).toEqual(renewed)`; boundary `:88` ("expiring exactly now is expired"); e2e `G e2e/session.spec.js:54-58` `expect(paths(backend).filter(p => p === '/auth/refresh')).toHaveLength(1)`, `after.accessToken not.toBe before.accessToken`, `after.refreshToken not.toBe before.refreshToken`, welcome shown at `:52-53` | PASS |
| AC5 protected 401 -> refresh once, retry once with new token | 1 refresh, 2 requests, 2nd with `Bearer new` | `G src/api/httpClient.test.js:113-115` `expect(refreshImpl).toHaveBeenCalledTimes(1)`, `expect(calls.map(c => c.authorization)).toEqual(['Bearer old', 'Bearer new'])`; second-401 guard `:122-125` `rejects.toMatchObject({ status: 401, code: 'AUTH_UNAUTHENTICATED' })`, `refreshImpl` called 1x, `calls` length 2 | PASS |
| AC6 concurrent 401s -> single refresh, all retried | 1 refresh request, both retried with new token | `G src/api/httpClient.test.js:200-201` `expect(refreshRequests).toBe(1)`, `expect(calls.filter(c => c.authorization === 'Bearer new')).toHaveLength(2)`; real manager single-flight `G src/auth/sessionManager.test.js:170-171` `resolves.toEqual(['access-2','access-2','access-2'])`, `expect(authApi.refresh).toHaveBeenCalledTimes(1)` | PASS |
| AC7a refresh 401 -> remove storage key, clear registry user, show login form | key removed, registry user cleared, form visible | e2e `G e2e/session.spec.js:70-73` `loginButton toBeVisible`, `expect(await storedSession(page)).toBeNull()`, `expect(await registryValue(page,'user')).toBeUndefined()`; unit `G src/auth/sessionManager.test.js:124-125` `localStorage.getItem(KEY)` null, `accessToken()` null; `:193-194` same for `refresh()` | PASS |
| AC7b (SESS-07 AC10) both expiries past -> remove stored session, form, no backend call | no request, key removed | `G src/auth/sessionManager.test.js:97-100` `resolves.toEqual({ status: 'none' })`, `expect(authApi.refresh).not.toHaveBeenCalled()`, `expect(localStorage.getItem(KEY)).toBeNull()`, `accessToken()` null (unit only; no e2e) | PASS |
| AC8 refresh without HTTP response -> keep storage unchanged, form + error message | storage unchanged, message `Cannot reach the server. Try again later.` | e2e `G e2e/session.spec.js:86-88` `menu.message toHaveText('Cannot reach the server. Try again later.')`, `toHaveClass(/error/)`, `expect(await storedSession(page)).toBe(kept)`; unit `G src/auth/sessionManager.test.js:133-138` `{status:'offline', message}` and `expect(stored()).toEqual(session)`; scene `G src/scenes/MainMenu.test.js:241-243` | PASS |
| AC9 invalid JSON or missing needed field -> remove it, show login form | entry removed, form shown | `G src/auth/sessionStore.test.js:35-40` (invalid JSON), `:42-54` (each of 5 fields missing, `toBeNull` + `localStorage.getItem(KEY)` null), `:56-64` (non-numeric expiries), `:66-71` (`null`); e2e `G e2e/session.spec.js:98-99` `loginButton toBeVisible`, `storedSession` null | PASS |
| AC10 -> see AC7b | | | PASS |

### P1: Backend token lifecycle

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 unexpired unrevoked refresh -> 200, new access + new refresh (login shape), old revoked | 200, new tokens differ, old now 401 | `BE adapter/web/AuthControllerIT.kt:54-55` `.statusCode(200).body("user.username", equalTo("yan"))`; `:59-61` accessToken non-blank, `assertNotEquals(oldToken, second.path("refreshToken"))`, `refreshTokenExpiresAt > 0`; `:62` `assertInvalidRefreshToken(refresh(oldToken))` (401 + code); `:63` second token -> 200. Unit `BE service/SessionServiceTest.kt:61-66` `assertTrue(tokens.findByHash(secrets.hash(first.refreshToken))!!.revoked)`, `assertFalse(...second...revoked)`, `assertEquals(1_005_000L + thirtyDays, second.refreshTokenExpiresAt)` | PASS |
| AC2 unknown/expired/revoked -> 401 `AUTH_INVALID_REFRESH_TOKEN` | status 401 + that code | helper `BE AuthControllerIT.kt:41-42` `.statusCode(401).body("code", equalTo("AUTH_INVALID_REFRESH_TOKEN"))`; unknown `:68`, expired (row with expiresAt now-1s) `:75-77`, revoked `:83-87`; unit boundary `BE domain/RefreshTokenTest.kt:19` `assertFalse(token.isUsableAt(1_000L))` and `SessionServiceTest.kt:88-91,97-101` (fails at +30d, succeeds at +30d-1ms) | PASS |
| AC3 owning user gone -> 401 `AUTH_INVALID_REFRESH_TOKEN` | same | `BE AuthControllerIT.kt:93-95` `jpaUserRepository.deleteById("yan")` then `assertInvalidRefreshToken(refresh(raw))`; unit `SessionServiceTest.kt:118` `assertFailsWith<InvalidRefreshTokenException>` + `:119` no new token persisted | PASS |
| AC4 missing/blank refreshToken -> 400 | 400 | `BE AuthControllerIT.kt:124-125` blank `"   "` and `""` -> `.statusCode(400)`; `:130-132` `{}`, `null`, empty body -> 400; logout `:155-156` | PASS |
| AC5 user deleted -> all that user's refresh tokens deleted | rows removed, others kept | `BE service/UserServiceTest.kt:117` `assertEquals(setOf("a1"), refreshTokens.tokens.keys)`; HTTP `BE AuthControllerIT.kt:102-105` `delete("/users/yan")` 204, `assertEquals(0, jpaRefreshTokenRepository.count())`; repo `BE adapter/repository/RefreshTokenRepositoryIT.kt:73-78` `deleteAllByUsername`; failed delete touches none `UserServiceTest.kt:140` | PASS |
| AC6 password change -> all that user's refresh tokens revoked | revoked, others untouched | `BE service/UserServiceTest.kt:129-131` y1/y2 `revoked` true, a1 false; HTTP `BE AuthControllerIT.kt:112-119` `PUT /users/yan/password` 200 then `assertInvalidRefreshToken(refresh(raw))`; repo `RefreshTokenRepositoryIT.kt:62-64`; failed update revokes none `UserServiceTest.kt:149,159` | PASS |
| AC7 only SHA-256 hash stored | row key == sha256(raw) != raw | `BE adapter/web/UserControllerIT.kt:225-226` `assertNotEquals(raw, stored.tokenHash)`, `assertEquals(sha256Hex(raw), stored.tokenHash)`; `Sha256RefreshTokenSecretsTest.kt:42` known vector `ba7816bf...15ad` for "abc"; `SessionServiceTest.kt:48,50` raw not findable, stored hash equals `secrets.hash("raw-1")`; `RefreshTokenTest.kt:60-61` | PASS |
| AC8a access tokens signed with `app.security.jwt-secret` | HS256 token decodes only with that key | `BE adapter/security/JwtAccessTokenIssuerTest.kt:28-30` decode with same key, `assertEquals("yan", jwt.subject)`; `:51` foreign key -> `BadJwtException`; HTTP `BE adapter/web/SecurityIT.kt:80-85` token signed by another key -> 401 `AUTH_UNAUTHENTICATED` | PASS |
| AC8b fails to start when secret < 32 bytes | construction/binding rejects 31 bytes, accepts 32 | `BE adapter/security/SecurityPropertiesTest.kt:11` `assertFailsWith<IllegalArgumentException> { SecurityProperties(jwtSecret = "a".repeat(31)) }`, `:16` 32 accepted, `:22-23` counts bytes not chars | PASS (partial) - spec-precision gap G-2: no test boots the Spring context with a short or missing secret; failure to start is inferred from the properties constructor `require` |

### P1: Protect user endpoints

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 valid Bearer -> processed as before | 200/204 as before | `BE adapter/web/SecurityIT.kt:101-104` `GET /users` 200, `GET /users/yan` 200 `username=yan`, `PUT .../password` 200, `DELETE` 204; `:111-116` token from sign-up works | PASS |
| AC2 no header / malformed / bad signature / expired -> 401 `AUTH_UNAUTHENTICATED` ProblemDetail | 401, `application/problem+json`, `code=AUTH_UNAUTHENTICATED` | helper `SecurityIT.kt:36-41` `statusCode(401)`, `contentType(containsString("application/problem+json"))`, `body("status", equalTo(401))`, `body("code", equalTo("AUTH_UNAUTHENTICATED"))`; no header `:60`; malformed `:67-68`; non-Bearer scheme `:75`; foreign-signed `:84`; expired `:93`; all four protected routes (GET /users, GET /users/{u}, PUT password, DELETE) iterated | PASS |
| AC3 the four public routes work without a token | processed | `BE SecurityIT.kt:127-147` sign-up 201 (`:99`/`:122`), login 200 (`:132`), refresh 200 (`:139`), logout 204 (`:147`), all without Authorization; error statuses preserved `:154-180` (409 `USER_ALREADY_EXISTS`, 401 `LOGIN_INVALID_PASSWORD`, 401 `AUTH_INVALID_REFRESH_TOKEN`, 400); other methods on public paths stay protected `:185-186` | PASS |
| AC4 game sends `Authorization: Bearer <accessToken>` on every protected request while a session exists | header value | `G src/api/httpClient.test.js:86` `expect(calls[0].authorization).toBe('Bearer abc')`; none without session `:94`; not on skipAuth `:104`; sign-up/login mark skipAuth `G src/api/userApi.test.js:27,34` (`{ skipAuth: true }`). Unit only; the game currently has no in-game protected call site, so no e2e is possible | PASS |

### P1: Log out

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 welcome screen shows a "Logout" button | button text `Logout` while welcome shown | `G src/scenes/MainMenu.test.js:271-272` `expect(logoutButton().textContent).toBe('Logout')`, `tagName` `'BUTTON'`; absent on form `:280`; e2e `G e2e/session.spec.js:107` clicks `getByRole('button', {name:'Logout'})` | PASS |
| AC2 click -> POST /auth/logout with refresh token, remove key, clear registry user, show login form | body `{refreshToken}`, key null, user undefined, form visible | e2e `G e2e/session.spec.js:109-116` `.auth-form toBeVisible`, `.welcome toHaveCount(0)`, `storedSession` null, `registryValue user` undefined, `backend.calls.filter(/auth/logout).toEqual([{ method:'POST', path:'/auth/logout', body:{ refreshToken } }])`; reload `:122-124` shows form; unit `G src/auth/sessionManager.test.js:230-232` `toHaveBeenCalledWith('refresh-1')`, storage null; scene `MainMenu.test.js:291-296` | PASS |
| AC3 logout request fails -> still removes session, shows form | cleared even on failure | `G src/auth/sessionManager.test.js:236-242` rejecting logout: `resolves.toBeUndefined()`, storage null, `accessToken()` null; scene `G src/scenes/MainMenu.test.js:299-308` rejecting logout -> user undefined, login form present | PASS |
| AC4 backend logout revokes token and responds 204 | 204, token then rejected | `BE AuthControllerIT.kt:139` `logout(raw).then().statusCode(204)`, `:141` `assertInvalidRefreshToken(refresh(raw))`; only given token revoked `:166-169`; unit `SessionServiceTest.kt:128` `assertTrue(...revoked)` | PASS |
| AC5 unknown/already revoked token -> still 204 | 204 | `BE AuthControllerIT.kt:148-150` unknown, revoked, revoked-again all `.statusCode(204)`; unit `SessionServiceTest.kt:133-135,143-145` | PASS |
| AC6 click Logout -> game does NOT start ClickerGame | no ClickerGame scene | e2e `G e2e/session.spec.js:119-120` canvas click then `expect(await activeSceneKeys(page)).not.toContain('ClickerGame')`; unit `G src/scenes/MainMenu.test.js:318-319` `expect(inputHandlers.pointerdown).toBeUndefined()`, `expect(scene.scene.start).not.toHaveBeenCalled()` | PASS |

### P2: Smaller logo

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 displayed width 400 px (scale = 400 / source width) at 1024x768 | displayWidth 400 | e2e `G e2e/session.spec.js:136` `expect(width).toBeCloseTo(400, 1)` where `width = scene.children.list.find(texture.key==='logo').displayWidth` (`:131-134`); unit `G src/scenes/MainMenu.test.js:329` `expect(logo.setScale).toHaveBeenCalledWith(400 / 2760)` | PASS |
| AC2 after drop-in tween the logo rests at y = 150 | final y 150 | `G src/scenes/MainMenu.test.js:330` `expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ targets: logo, y: 150, duration: 1000, ease: 'Bounce' }))`; start above canvas `:338-339` `expect(y).toBeLessThan(0)`. Asserts the tween config value, not the realised resting position; e2e checks width only | PASS (partial) - spec-precision gap G-1: no assertion reads the logo's y after the tween ends |

---

## Edge Cases

- [x] `localStorage` unavailable or throws -> in-memory session for the page lifetime: `G src/auth/sessionStore.test.js:82-92` (getItem/setItem/removeItem all throw; `save` then `expect(sessionStore.load()).toEqual(session)`; after `clear` `load()` is `null`); stale-entry case `:94-99`. Module-level only, not via `sessionManager`/MainMenu (note, acceptable).
- [~] Access token rejected on a protected call AND refresh also returns 401 -> return to MainMenu's login form: halves are tested (`G src/api/httpClient.test.js:128-137` rejects with the refresh ApiError, no retry; `G src/auth/sessionManager.test.js:186-195` session cleared on refresh 401; e2e `session.spec.js:61-74` for the boot path), but no code path or test navigates to MainMenu's login form from a failed protected call (the game has no protected call site today; and `MainMenu.create` shows the welcome whenever `registry.user` is still set, `MainMenu.js:61-66`). Spec-precision gap G-3.
- [x] Player clock wrong -> a 401 triggers refresh regardless of stored expiry: `httpClient` never reads stored expiry; `G src/api/httpClient.test.js:107-116` triggers refresh from a 401 alone (token `old` rotated to `new`), and `:204-220` handles already-rotated token. Structural, accepted.

Other edge/ordering ACs singled out in the brief: concurrent 401s single refresh (AC6) PASS; both expiries past no backend call PASS (`sessionManager.test.js:97-100`); blank refreshToken 400 PASS; user deleted -> tokens deleted PASS; password change -> revoked PASS; logout does not start ClickerGame PASS; secret < 32 bytes partial (G-2); `GET /users` with expired / foreign-signed / malformed token -> 401 `AUTH_UNAUTHENTICATED` PASS (`SecurityIT.kt:65-95`, `/users` is first entry of `protectedRoutes` at `:21`); public routes without token PASS.

---

## Success Criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| After login, reload shows welcome with zero credential input and zero `/users/login` calls | `G e2e/session.spec.js:37` `expect(backend.calls.slice(callsBeforeReload)).toEqual([])` and `:38` `expect(paths(backend)).toEqual(['/users/login'])` | PASS |
| Session older than 24 h and younger than 30 days resumes with exactly one `/auth/refresh` | `G e2e/session.spec.js:54` `toHaveLength(1)` | PASS |
| `GET /users` without token 401; revoked refresh token never yields new access token | `BE SecurityIT.kt:58-62` (`GET /users` in `protectedRoutes`), `AuthControllerIT.kt:81-88` (revoked -> 401 `AUTH_INVALID_REFRESH_TOKEN`) | PASS |
| Logout leaves no `infinity-grove.session` entry | `G e2e/session.spec.js:112` `expect(await storedSession(page)).toBeNull()` | PASS |
| Logo displays 400 px wide | `G e2e/session.spec.js:136` | PASS |

**Status**: all 17 requirement IDs have file:line evidence; 3 spec-precision gaps flagged below.

---

## Flagged gaps (spec-precision, non-blocking)

| ID | AC | Gap | Evidence | Suggested fix |
| -- | -- | --- | -------- | ------------- |
| G-1 | P2 AC2 (SESS-17) | y = 150 is asserted on the tween configuration only; no test reads the resting y after the tween (e2e reads width only). A tween-engine/easing regression would pass. | `MainMenu.test.js:330`, `session.spec.js:127-137` | In the logo e2e, `expect.poll` the logo `y` to equal 150 after the 1 s tween. |
| G-2 | P1 backend AC8 (SESS-12) | "fail to start when shorter than 32 bytes" is proven by the `SecurityProperties` constructor only; no test boots the context with a short or missing `JWT_SECRET`. | `SecurityPropertiesTest.kt:10-23` | Add a `ApplicationContextRunner`/`@SpringBootTest` failing-startup test with a 31-byte and an absent secret. |
| G-3 | Edge case 2 | No scene-level/behavior evidence that a failed protected call plus failed refresh returns the player to MainMenu's login form; there is no protected call site in the game, and `MainMenu.create` prefers `registry.user` over a cleared storage. | `httpClient.test.js:128-137`, `sessionManager.test.js:186-195`, `MainMenu.js:61-66` | When the first in-game protected call is added, handle 401-after-refresh by clearing the registry user and starting `MainMenu`, with a test. |

Minor note: response `user.createdAt/lastLoginAt` are not asserted over HTTP (`UserControllerIT.kt:32,128` check `user.username` only).

---

## Discrimination Sensor

Sensor depth: **P0-full manual** (authentication code; >= 6 required, 27 injected). Scratch: temporary `git worktree` (HEAD overlaid with the index via `git checkout-index`, `game/node_modules` junctioned to the real one, junction removed with `rmdir` before worktree removal), never `git stash`. Backend run: `gradlew test` (Docker ITs, 108 tests); game run: `npm test` (87 tests). Baseline in scratch was green before mutating (87/87 and 108/108). Each mutation was reverted after its run.

| # | File | Description | Killed? / failing tests |
| - | ---- | ----------- | ----------------------- |
| B1 | `service/SessionService.kt` (refresh) | removed `refreshTokenRepository.save(stored.revoke())` (no rotation) | Killed (3 failed: `AuthControllerIT` old-token-fails, `SessionServiceTest` revokes-old, refresh-twice) |
| B2 | `domain/RefreshToken.kt` | `now < expiresAt` -> `now <= expiresAt` | Killed (2: `RefreshTokenTest` exact boundary, `SessionServiceTest` expired) |
| B3 | `domain/RefreshToken.kt` | TTL 30d -> 7d | Killed (8: `RefreshTokenTest` x2, ...) |
| B4 | `adapter/security/SecurityConfig.kt` | added `permitAll` for `GET /users` | Killed (2: `SecurityIT` no-header, non-Bearer) |
| B5 | `service/UserService.kt` | `delete` no longer deletes tokens | Killed (2: `AuthControllerIT` deleting-user, `UserServiceTest` delete) |
| B6 | `service/UserService.kt` | `updatePassword` no longer revokes tokens | Killed (2: `AuthControllerIT` password, `UserServiceTest`) |
| B7 | `adapter/security/SecurityConfig.kt` | JWT validator replaced with always-success (skips expiry) | Killed (1: `SecurityIT` expired token) |
| B8 | `adapter/security/SecurityProperties.kt` | min secret 32 -> 16 bytes | Killed (2: `SecurityPropertiesTest` 31 bytes, bytes-not-chars) |
| B9 | `service/SessionService.kt` | stores raw refresh token (identity "hash") | Killed (11 failed) |
| B10 | `service/SessionService.kt` | refresh ignores revoked/expired (`stored == null` only) | Killed (9 failed) |
| B11 | `adapter/web/AuthController.kt` | logout no longer revokes | Killed (2: `AuthControllerIT` logout tests) |
| B12 | `adapter/web/AuthController.kt` | removed blank check on refresh | Killed (1: `AuthControllerIT` blank refreshToken -> 400) |
| B13 | `adapter/security/SecurityConfig.kt` | 401 code `AUTH_UNAUTHENTICATED` -> `AUTH_UNAUTH` | Killed (7 `SecurityIT`) |
| B14 | `service/SessionService.kt` | deleted-user refresh throws `IllegalStateException` (500) instead of 401 | Killed (2: `AuthControllerIT`, `SessionServiceTest`) |
| G1 | `src/auth/sessionManager.js` | `inFlightRefresh ??=` -> `=` (not single-flight) | Killed (`sessionManager.test.js` "shares one request among three concurrent calls") |
| G2 | `src/api/httpClient.js` | removed `!request.retried` second-401 guard | Killed (suite fails; the guard test loops/times out rather than asserting - kill by non-termination, see note) |
| G3 | `src/api/httpClient.js` | removed `!request.skipAuth` from the 401 branch | **Survived - proven equivalent**: a skipAuth request never gets a Bearer (request interceptor sets `sentBearer` only for non-skipAuth), so the `request?.sentBearer` conjunct already blocks it; the guard is redundant defence. Behavior-level variant G13 below is killed. No fix task. |
| G4 | `src/auth/sessionStore.js` | `load` no longer removes invalid entries | Killed (invalid JSON, 5 missing-field, non-numeric tests) |
| G5 | `src/auth/sessionManager.js` | `logout` no longer clears local session | Killed (`logout` tests x2+) |
| G6 | `src/scenes/MainMenu.js` | logo `400 / width` -> `500 / width` | Killed (`MainMenu.test.js` logo test) |
| G7 | `src/auth/sessionManager.js` | both-expired guard disabled (calls backend) | Killed ("makes no request when both tokens have expired") |
| G8 | `src/auth/sessionManager.js` | refresh 401 no longer clears session | Killed (restore 401 + refresh 401 tests) |
| G9 | `src/scenes/MainMenu.js` | logout leaves the `pointerdown` start handler registered | Killed ("does not start the game when logging out") |
| G10 | `src/scenes/MainMenu.js` | logo rest `y: 150` -> `250` | Killed (`MainMenu.test.js:330`) |
| G11 | `src/api/httpClient.js` | Bearer header not set | Killed (3: attach header, refresh-and-retry, rotated) |
| G12 | `src/auth/sessionManager.js` | network failure on restore clears the session | Killed ("returns offline ... keeps storage") |
| G13 | `src/api/httpClient.js` | Bearer attached on skipAuth (login/sign-up) requests | Killed ("sends no Authorization header on skipAuth requests") |

**Result**: 27 injected, 26 killed, 1 survived (G3, equivalent/redundant guard). 14/14 backend killed, 12/13 game killed + 1 equivalent. **Sensor: PASS**.

Notes: (1) G2 is killed by non-termination (retry loop until test timeout); a counter-based assertion fails faster but the kill is real. (2) An early run of the game mutations against an un-overlaid HEAD scratch produced invalid kills (missing `test` script); those results were discarded and the full set re-run on the overlaid, baseline-green scratch. (3) The first backend attempt through `cmd` could not find gradlew; re-run with `.\gradlew.bat` and failing test names confirmed per mutation.

**Isolation proof** (`git status --porcelain` of the real tree, 76 lines): before sensor = after sensor (`diff` empty, status also identical after the gate runs). Scratch worktree removed (`git worktree remove --force` hit "Filename too long", then `git worktree prune` + `rm -rf`; `git worktree list` shows only the main tree); the real `game/node_modules` is intact (93 entries before and after).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | Pass (one extra defensive guard, `!request.skipAuth` at `httpClient.js:279`, is redundant; harmless) |
| Surgical changes | Pass |
| No scope creep | Pass |
| Matches patterns (hexagonal ports/adapters, logger in service/domain, `ApiError`) | Pass |
| Spec-anchored outcome check (asserted values match spec) | Pass with G-1..G-3 flagged |
| Per-layer Coverage Expectation (domain 1:1 ACs; routes happy+edge+error) | Pass: domain (`RefreshTokenTest`), service (`SessionServiceTest`, `UserServiceTest`), security adapters, repository IT, controller/security IT, game unit and e2e |
| Every test maps to a spec requirement | Pass (spot-check of `AuthControllerIT`, `SecurityIT`, `httpClient.test.js`: all map to ACs/edge cases; `Sha256RefreshTokenSecretsTest` alphabet/length tests map to AC7) |
| Documented guidelines followed | `backend/docs/adr/0001-logging.md`, `0002-testing.md`, `0003-exception-handling.md`, `game/docs/adr/0004-testing-strategy.md`; ktlint passes |

---

## Gate Check

- **Backend**: `cd backend && ./gradlew cleanTest build` -> exit 0, BUILD SUCCESSFUL (ktlintMain/Test/Script checks and `test` executed; Docker ITs ran). Tests: 108 run, 108 passed, 0 failed, 0 skipped (12 result classes).
- **Game build**: `cd game && npm run build` -> exit 0.
- **Game unit**: `cd game && npm test` -> exit 0, 8 files, 87 tests passed, 0 failed.
- **Game e2e**: `cd game && npm run test:e2e` -> exit 0, 18 passed, 0 failed (`session.spec.js` 7 + `auth.spec.js` 11).
- **Test count before feature**: not derivable from a committed baseline (the pre-feature suite is staged, not committed); the feature diff adds 12 backend test files and 7 game test/e2e files (`git diff --stat 483ae76..f6bf3b3`).
- **Skipped tests**: none.
- **Failures**: none.
- No dev servers left running by this verification (the playwright web server on 5174 is torn down by Playwright); the pre-existing listener on port 8081 (pid 19328) was left alone.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| SESS-01..SESS-11, SESS-13..SESS-16 | Implementing | Verified |
| SESS-12 | Implementing | Verified (gap G-2: startup-failure proven at constructor level) |
| SESS-17 | Implementing | Verified (gap G-1: y asserted on tween config) |

(spec.md was not edited by the Verifier; update statuses at orchestration time.)

---

## Summary

**Overall**: Ready (PASS with 3 non-blocking spec-precision gaps)

**Spec-anchored check**: 17/17 requirement IDs matched spec outcome with file:line evidence; 3 spec-precision gaps flagged (G-1 logo y, G-2 startup failure, G-3 edge case 2)
**Sensor**: 26/27 killed; 1 survivor proven equivalent (G3)
**Gate**: backend 108 passed; game unit 87 passed; e2e 18 passed; all exit 0

**What works**: rotation, expiry boundaries, hash-only storage, revoke-on-password-change, delete-purges-tokens, protected `/users/**` with ProblemDetail 401, single-flight refresh, session restore/offline/invalid-data paths, logout, logo scale.

**Issues found**: G-1, G-2, G-3 above; staged-but-uncommitted baseline (HEAD not self-contained).

**Next steps**: commit the staged baseline; optionally add the three small tests/handlers listed in the gap table.

---

## Gap closure (post-verification)

| Gap | Fix | Evidence |
| --- | --- | --- |
| G-2 (SESS-12 AC8) | `SecurityPropertiesStartupTest` boots an `ApplicationContextRunner` with `SecurityProperties` bound: missing secret and 31-byte secret leave `startupFailure` set, 32 bytes starts. | `backend/.../adapter/security/SecurityPropertiesStartupTest.kt`; with the `require` removed from `SecurityProperties`, the 31-byte test fails |
| G-1 (SESS-17 AC2) | `session.spec.js` polls the logo's resting `y` to 150 after the drop-in tween. | `game/e2e/session.spec.js` "the logo rests at y = 150 after the drop-in"; with the tween target changed to 200 it fails (`Expected: 150, Received: 200`) |
| G-3 (edge case 2) | Open: needs the first in-game protected call site. | - |

Gates after closure: backend `./gradlew ktlintCheck test` BUILD SUCCESSFUL; game `npm test` 87 passed; `npm run test:e2e` 19 passed. Verdict unchanged: PASS.
