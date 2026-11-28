# Portuguese Text Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T10) and the `ui-artist` review (T11) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/portuguese-text/spec.md`
**Design**: `.specs/features/portuguese-text/design.md`
**Status**: Approved by the owner on 2026-11-26 (recommended defaults: spec Q1 to Q10). Runs last, after `tech-debt-polish` and `defense-contract` (both change e2e files this feature edits again).

Rules for every task: the rules block of `.specs/features/early-game-rebalance/tasks.md` (§ Rules for every task) applies word for word: paths from the repository root, `main/` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `test/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, graphify first, the files under **Read first** before editing, one commit per task checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` and ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, files added by path only (never `git add -A` or `git add .`), the task ticked `[x]` here and its requirement rows in `spec.md` § Requirement Traceability set to `Implementing` in the same commit, push with `git pull --rebase origin main && git push origin HEAD:main`, re-pins only where a task lists them, an e2e flake rerun alone twice with `--workers=1`, never the full e2e suite, desktop only. Player text exactly as spec § Player-Facing Texts (AD-007, L-010), with its accents (`á`, `ã`, `é`, `í`, `ç`); files stay UTF-8.

**Between T2 and T8 the e2e files that assert English texts fail.** That is expected: T2 to T7 change the game and its unit tests (gate: unit suite and build), T8 moves every e2e and review assertion in one pass. Do not run those e2e files in T2 to T7, and do not edit them there.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md`, `.claude/agents/test-engineer.md`, `backend/build.gradle.kts`, `game/vitest.config.js`, `game/playwright.config.js`. No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain and web | unit + integration | PT-03 AC 1 to 3 | `test/domain/UserTest.kt`, `test/adapter/web/UserControllerIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Game application (`errorText.js`, `ApiError.js`, `sessionManager.js`) | unit | Every row I11 to I18 of spec § Player-Facing Texts; PT-02 AC 1 to 9 | `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game domain (`campaign.js`) | unit | I19 to I21 | `game/src/domain/campaign/campaign.test.js` | `cd game && npm test` |
| Game adapters (`MainMenu.js`, `ClickerGame.js`, `index.html`) | unit + e2e | I1 to I10, I22 to I34 | `game/src/adapters/phaser/*.test.js`, `game/e2e/portugueseText.spec.js` | `cd game && npm test`; `npx playwright test e2e/portugueseText.spec.js` |
| Existing e2e and review shots | e2e | Every English assertion moved (design § Test Text Mapping) | `game/e2e/**`, `game/ui-review/**` | the gate of T8 |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/portugueseText.shots.js` | `cd game && npm run ui:shots -- portugueseText` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | T1 | `cd backend && ./gradlew ktlintCheck test` |
| Quick | T2 to T7 | `cd game && npm test && npm run build` |
| Full | T8, T9 | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

### Phase 1: Backend (kotlin-backend-dev)

```
T1
```

### Phase 2: Game (game-dev)

```
T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 3: Tests in the browser and author check (test-engineer)

```
T8 → T9 → T10
```

### Phase 4: UI review (ui-artist)

```
T11
```

---

## Task Breakdown

### Phase 1: Backend

#### T1: The short-password error gets the code USER_PASSWORD_TOO_SHORT [x]

**Owner**: kotlin-backend-dev
**Goal**: A password under 8 characters answers 400 with `code` `USER_PASSWORD_TOO_SHORT` and `minLength` 8, so the game can say it in Portuguese (PT-03; spec Backend code AC 1 to 3, Q2).
**Where**: `main/domain/BusinessException.kt`
**Files**:
- Also changes: `main/domain/User.kt` (`validatePassword`), `main/adapter/web/ApiExceptionHandler.kt`, `test/domain/UserTest.kt`, `test/adapter/web/UserControllerIT.kt`
- Read first: design § Backend short-password code, `BusinessException.kt:1-35`, `User.kt:15-80`, `ApiExceptionHandler.kt:36-60` and `:120-140` (`problem`), `UserTest.kt` `register rejects short password`, `UserControllerIT.kt` `POST users returns 400 for a short password` and the `PUT password` cases
**Depends on**: None
**Requirement**: PT-03

**Contract**: design § Backend short-password code, exactly. The `detail` stays `Password must have at least 8 characters`.

**Steps**:

1. Add `PasswordTooShortException` to `BusinessException.kt` after `InvalidPasswordException`.
2. `User.kt`: `validatePassword` throws it (design); remove the `require`.
3. `ApiExceptionHandler.kt`: add `passwordTooShort` (design) after the `UserAlreadyExistsException` handler; import the exception.
4. `UserTest.kt`: `register rejects short password` becomes `register rejects a short password with the code and the minimum length`: `val error = assertFailsWith<PasswordTooShortException> { register(password = "short") }`, `assertEquals("USER_PASSWORD_TOO_SHORT", error.code)`, `assertEquals(8, error.minLength)`. Add `changePassword rejects a short new password with the same error`: `assertFailsWith<PasswordTooShortException> { register().changePassword("password123", "short", hasher) }` with `minLength` 8.
5. `UserControllerIT.kt`: `POST users returns 400 for a short password` asserts also `.body("code", equalTo("USER_PASSWORD_TOO_SHORT"))`, `.body("minLength", equalTo(8))`, `.body("detail", equalTo("Password must have at least 8 characters"))`. Add `PUT password with a short new password returns 400 USER_PASSWORD_TOO_SHORT`: create `yan`, `PUT /users/yan/password` with `{ "currentPassword": <the created password>, "password": "short" }` as `yan` -> 400, the same `code`, `minLength` 8; build the request like the neighbouring `PUT password replaces the stored hash`.
6. Run the gate.

**Tests**: unit + integration
**Test cases**: the 2 `UserTest` cases and the 2 `UserControllerIT` cases above with their values; every other `UserControllerIT`, `AuthControllerIT` and `SecurityIT` case passes unchanged (PT-03 AC 3).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The backend suite passes.
- [x] `git grep -n "Password must have at least" -- backend/src/main` prints only the `PasswordTooShortException` line.
- [x] The commit touches exactly the 5 files above and this file.

**Commit**: `feat(backend): name the short password error with a code and its minimum length`

---

### Phase 2: Game

#### T2: Portuguese error lines chosen by the backend code [x]

**Owner**: game-dev
**Goal**: Every failed request carries a Portuguese `message` chosen by its `code`, never the backend `detail` (PT-02; spec Error lines AC 1 to 9, Edge 4, Q2).
**Where**: `game/src/application/errorText.js` (new)
**Files**:
- Also creates: `game/src/application/errorText.test.js`
- Also changes: `game/src/application/ApiError.js`, `game/src/application/ApiError.test.js`, `game/src/application/session/sessionManager.js`, `game/src/application/session/sessionManager.test.js`, `game/src/adapters/phaser/MainMenu.test.js` (only the cases that assert an English error line coming from a request)
- Read first: design § `errorText.js` and § `ApiError.from`, `ApiError.js` (whole), `ApiError.test.js` (whole), `sessionManager.js:85-96`, `sessionManager.test.js:130-145`, `MainMenu.js:169-205` (`submit` shows `error.message`)
**Depends on**: T1
**Requirement**: PT-02

**Contract**: design § `errorText.js` and § `ApiError.from`, exactly.

**Steps**:

1. Write `errorText.js` (design).
2. `ApiError.js`: import `errorText`, `OFFLINE_TEXT`, `SETUP_FAILED_TEXT`; `from` as in design.
3. `sessionManager.js`: import `OFFLINE_TEXT` from `../errorText`; line 94 uses it.
4. `errorText.test.js`: the cases below.
5. `ApiError.test.js`: re-pin as below.
6. `sessionManager.test.js`: `returns offline with the error message and keeps storage when the server is unreachable` keeps building its own `ApiError` and expects that same message (no change needed); add `returns offline with the Portuguese line when the error has no message`: refresh rejects with `{}` (no `message`) -> `{ status: 'offline', message: 'Não foi possível falar com o servidor. Tente de novo mais tarde.' }`.
7. `MainMenu.test.js`: a case that makes a request fail with a backend `detail` and expects that English text on the message line (search `already exists`) now builds the error with `ApiError.from({ response: { status: 409, data: { detail: "User 'yan' already exists", code: 'USER_ALREADY_EXISTS' } } })` and expects `Esse nome de usuário já existe.` Other `MainMenu.test.js` texts are T3's.
8. Run the gate.

**Tests**: unit
**Test cases**:

- `errorText.test.js`: `USER_ALREADY_EXISTS reads Esse nome de usuário já existe.`; `LOGIN_USER_NOT_FOUND reads Usuário não encontrado.`; `LOGIN_INVALID_PASSWORD reads Senha incorreta.`; `USER_PASSWORD_TOO_SHORT with minLength 8 reads A senha precisa ter pelo menos 8 caracteres.`; `USER_PASSWORD_TOO_SHORT without minLength reads A senha é muito curta.` (body `{}` and body `{ minLength: '8' }` both); `AUTH_INVALID_REFRESH_TOKEN and AUTH_UNAUTHENTICATED read Sua sessão expirou. Entre de novo.`; `an unknown code reads O pedido falhou (erro 409).` (`{ status: 409, code: 'PROGRESS_CONFLICT' }`); `no code reads O pedido falhou (erro 500).`; `OFFLINE_TEXT and SETUP_FAILED_TEXT are the spec texts`.
- `ApiError.test.js`: `maps a backend ProblemDetail response` keeps `status` 409, `code` `USER_ALREADY_EXISTS`, `body`, and its `message` becomes `Esse nome de usuário já existe.`; `falls back to the title, then to a generic message, when detail is missing` becomes `answers O pedido falhou (erro <status>) for an answer without a known code, whatever its detail or title` (status 500 with `title` `Internal Server Error` -> `O pedido falhou (erro 500).`; status 502 with `data: null` -> `O pedido falhou (erro 502).`); `reports an unreachable server when there is no response` expects `Não foi possível falar com o servidor. Tente de novo mais tarde.`; `keeps the original message for request setup failures` becomes `reports O pedido falhou. for a request that could not be built` (`ApiError.from(new Error('boom')).message` is `O pedido falhou.`); the `body` and `code` cases unchanged.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The unit suite passes.
- [x] `git grep -n -E "Request failed|Cannot reach the server" -- game/src ':!*.test.js'` prints nothing.
- [x] The commit touches exactly the files above and this file.

**Commit**: `feat(game): show request errors in Portuguese by their backend code`

---

#### T3: The main menu in Portuguese [x]

**Owner**: game-dev
**Goal**: The sign-in form, its messages, the welcome screen and the page language are Portuguese (PT-01; spec Main menu AC 1 to 6, I1 to I10, I34).
**Where**: `game/src/adapters/phaser/MainMenu.js`
**Files**:
- Also changes: `game/index.html`, `game/src/adapters/phaser/MainMenu.test.js`
- Read first: design § Main menu, `MainMenu.js:1-70`, `:160-230`, `:270-290`, `MainMenu.test.js` (the cases that assert `Welcome back`, `Hello, `, `Enter username and password`, `Account created`, `Logout`, `Sign up`; `git grep -n -E "Welcome back|Hello, |Enter username|Account created|Logout|Sign up|Login|Username|Password" -- game/src/adapters/phaser/MainMenu.test.js`)
**Depends on**: T2
**Requirement**: PT-01

**Contract**: design § Main menu, exactly; `index.html` line 2 `<html lang="pt-BR">`.

**Steps**:

1. `MainMenu.js`: the four constants of the design at the top; `FORM_HTML` placeholders and button texts; both `'Enter username and password'` calls use `EMPTY_FIELDS_TEXT`; the two success callbacks use `signedInText(u.username)` and `signedUpText(u.username)`; `showWelcome` uses `welcomeText(user.username)`; `WELCOME_HTML` prompt `Clique para jogar!`; `LOGOUT_HTML` text `Sair`.
2. `index.html`: `lang="pt-BR"`.
3. `MainMenu.test.js`: re-pin every English menu text with its spec text (`Bem-vindo de volta, yan!`, `Olá, yan!`, `Informe usuário e senha`, `Conta criada, ana!`, `Sair`); rename `renders a Logout button in the welcome state` to `renders a Sair button in the welcome state` and `does not render a Logout button in the auth form state` to `does not render a Sair button in the auth form state`; a title that names `Sign up` or `Login` as a button names `Criar conta` or `Entrar`.
4. Add to `MainMenu.test.js`: `the form shows Usuário, Senha, Entrar and Criar conta` (placeholders of `input[name="username"]` and `input[name="password"]`, text of the `login` and `signup` buttons); `a username of only spaces shows Informe usuário e senha and sends no request` (username `   `, password `secret123`, press `Entrar`; the users port is not called); `the welcome screen shows Clique para jogar!` (`.welcome-start` text).
5. Run the gate.

**Tests**: unit (the browser checks are T8 and T9)
**Test cases**: the re-pinned cases with the texts of step 3 and the 3 new cases of step 4.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The unit suite passes.
- [x] `git grep -n -E "Welcome back|Account created|Hello, |Click to Start|Enter username|>Login<|>Sign up<|Logout<|placeholder=\"(Username|Password)\"" -- game/src game/index.html` prints nothing.
- [x] The commit touches exactly `MainMenu.js`, `index.html`, `MainMenu.test.js` and this file.

**Commit**: `feat(game): translate the main menu to Portuguese`

---

#### T4: The stage plate in Portuguese [x]

**Owner**: game-dev
**Goal**: The encounter labels read `Estágio <s>/<n>  Fase <p>/<m>`, `Estágio <s>/<n>  Miniboss` and `Chefe do capítulo` (PT-04; spec Combat HUD AC 1 to 3, Q4, I19 to I21).
**Where**: `game/src/domain/campaign/campaign.js`
**Files**:
- Also changes (every unit test that holds the English label: `git grep -n -E "Stage [0-9]|Chapter Boss" -- 'game/src/*.test.js'`): `game/src/domain/campaign/campaign.test.js`, `game/src/adapters/phaser/ClickerGame.test.js`, `game/src/adapters/phaser/views/stageLabel.test.js`, `game/src/adapters/http/progressApi.test.js`, and any other file that grep lists
- Read first: design § Stage plate, `campaign.js:110-155`, `game/src/adapters/phaser/views/stageLabel.js`
**Depends on**: T3
**Requirement**: PT-04

**Steps**:

1. `campaign.js`: the three labels of design § Stage plate. Nothing else changes.
2. In every test file the grep lists: `Stage <s>/<n>  Phase <p>/<m>` -> `Estágio <s>/<n>  Fase <p>/<m>`, `Stage <s>/<n>  Miniboss` -> `Estágio <s>/<n>  Miniboss`, `Chapter Boss` -> `Chefe do capítulo`, inside string literals only (a test title that quotes a label quotes the Portuguese one). Numbers stay.
3. Run the gate.

**Tests**: unit
**Test cases**: the re-pinned label assertions, among them `campaign.test.js` (phase, miniboss and chapter boss labels), `stageLabel.test.js` (a plain label and a farm label with ` (Capítulo <n>)`), `ClickerGame.test.js` (`label(ctx)` of a phase, a miniboss and the chapter boss); and a new `campaign.test.js` case `labels the spec examples: Estágio 1/10  Fase 2/8, Estágio 3/10  Miniboss and Chefe do capítulo` (a definition of 10 stages with `phasesPerStage` 8; stage 1 phase 2; the miniboss of stage 3; the chapter boss).

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The unit suite passes with the same number of tests.
- [x] `git grep -n -E "Stage [0-9<$]|Chapter Boss|  Phase " -- game/src` prints only `//` comment lines (comments stay English; string literals must be clean).

**Commit**: `feat(game): translate the stage plate to Portuguese`

---

#### T5: The enemy element chip names the element in Portuguese [ ]

**Owner**: game-dev
**Goal**: The first chip of the enemy line reads `Fogo`, `Água`, `Natureza`, `Luz` or `Escuridão`, keeping its `data-element` and dot (PT-04; spec Combat HUD AC 6, I26).
**Where**: `game/src/adapters/phaser/ClickerGame.js` (`showEnemyStats`)
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`
- Read first: design § Scene texts, `ClickerGame.js` `showEnemyStats` (search `showEnemyStats (stats)`), `ELEMENT_LABELS` (`game/src/domain/heroes/heroes.js:13`, already imported by `ClickerGame.js`), `ClickerGame.test.js` cases that read `enemyText(ctx)` or `.enemy-stats` (`git grep -n -E "(Fire|Water|Nature|Light|Darkness)  " -- game/src/adapters/phaser/ClickerGame.test.js`)
**Depends on**: T4
**Requirement**: PT-04

**Steps**:

1. `showEnemyStats`: `const name = ELEMENT_LABELS[element];` (replaces the `charAt` line); update its comment example to `"Água  Defesa 10%  Seu crítico: 28%"`.
2. `ClickerGame.test.js`: in every expected enemy line, the first word `Fire`, `Water`, `Nature`, `Light`, `Darkness` becomes `Fogo`, `Água`, `Natureza`, `Luz`, `Escuridão`; nothing else in those strings changes.
3. Add `names the element chip in Portuguese for the five elements` (one scene per element FIRE, WATER, NATURE, LIGHT, DARKNESS with defense 0 and critical resistance 0; the `.tag-element` text is `Fogo`, `Água`, `Natureza`, `Luz`, `Escuridão` and its `data-element` is the element id).
4. Run the gate.

**Tests**: unit
**Test cases**: step 2 re-pins and the step 3 case.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The unit suite passes.
- [ ] `git grep -n "charAt(0) + element.slice(1)" -- game/src` prints nothing.

**Commit**: `feat(game): name the enemy element in Portuguese`

---

#### T6: Wallet, boss timer and scene messages in Portuguese [ ]

**Owner**: game-dev
**Goal**: The wallet labels, the timer and the two scene messages read their spec texts (PT-04; spec Combat HUD AC 4, 5, 7, 8, Edge 3, I22 to I25, Q7).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`
- Read first: design § Scene texts, `ClickerGame.js:65` (`COINS`), `:144-145`, `showCountdown`, `placeBossTimer`, `refreshWalletText`; `git grep -n -E "Time: |Gold|Silver|Copper|Could not load|Chapter complete" -- game/src/adapters/phaser/ClickerGame.test.js`
**Depends on**: T5
**Requirement**: PT-04

**Steps**:

1. `COINS`, `LOAD_FAILED_TEXT`, `COMPLETED_TEXT` and the `showCountdown` text as in design § Scene texts; the `refreshWalletText` comment example.
2. `ClickerGame.test.js`: `Time: <n>` -> `Tempo: <n>s`; `Gold: ` / `Silver: ` / `Copper: ` -> `Ouro: ` / `Prata: ` / `Cobre: `; `Could not load progress` -> `Não foi possível carregar o progresso`; `Chapter complete!` -> `Capítulo concluído!`. Test titles that quote these texts quote the Portuguese ones.
3. Add `the boss timer reads Tempo: 37s with 37 seconds left and Tempo: 9s with 9` (a boss scene advanced to 37 s and then to 9 s left; `timer(ctx)` is `Tempo: 37s`, then `Tempo: 9s`).
4. Run the gate.

**Tests**: unit
**Test cases**: step 2 re-pins and the step 3 case.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The unit suite passes.
- [ ] `git grep -n -E "'Gold'|'Silver'|'Copper'|Time: |Could not load|Chapter complete" -- game/src` prints only `//` comment lines.

**Commit**: `feat(game): translate the wallet, the boss timer and the scene messages`

---

#### T7: Pause menu and farm switch in Portuguese [ ]

**Owner**: game-dev
**Goal**: The pause menu, its confirmation and the farm switch label read their spec texts with unchanged behaviour (PT-04, PT-05; spec Combat HUD AC 9, Pause menu AC 1 to 3, I27 to I33, Q6).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`
- Read first: design § Scene texts, `ClickerGame.js:131-142` (`FARM_TOGGLE_HTML`, `PAUSE_MENU_HTML`), the pause handlers (search `pause-continue`, `pause-leave`, `pause-confirm-yes`, `pause-confirm-no`), `ClickerGame.test.js` pause cases (search `describe(` near `continues on the Continue button and on a second Esc`)
**Depends on**: T6
**Requirement**: PT-04, PT-05

**Steps**:

1. `FARM_TOGGLE_HTML` and `PAUSE_MENU_HTML` texts as in design § Scene texts; classes and structure unchanged.
2. `ClickerGame.test.js`: retitle `continues on the Continue button and on a second Esc` -> `continues on the Continuar button and on a second Esc`, `Leave fight in a farm fight returns ...` -> `Sair da luta in a farm fight returns ...`, and any other title or string that quotes the English pause or farm texts.
3. Add `the pause menu reads Pausado, 1. Continuar and 2. Sair da luta` and `the leave confirmation reads Sair da luta? Isso conta como derrota. with Sim, sair and Não, ficar` (texts of `.pause-title`, `.pause-continue`, `.pause-leave`, `.pause-question`, `.pause-confirm-yes`, `.pause-confirm-no`), and `the farm switch label reads Farmar chefe` (`.farm-toggle` `textContent.trim()`).
4. Run the gate.

**Tests**: unit
**Test cases**: step 2 retitles (values unchanged) and the 3 new cases of step 3.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The unit suite passes.
- [ ] `git grep -n -E "Paused|1\. Continue|2\. Leave fight|Leave the fight|Yes, leave|No, stay|Farm boss" -- game/src ':!*.test.js'` prints nothing.

**Commit**: `feat(game): translate the pause menu and the farm switch`

---

### Phase 3: Tests in the browser and author check

#### T8: Move every English e2e and review assertion to Portuguese [ ]

**Owner**: test-engineer
**Goal**: Every e2e test, e2e helper and review shot reads the Portuguese texts, with every other value unchanged (PT-01, PT-02, PT-04, PT-05; design § Test Text Mapping).
**Where**: `game/e2e/support/game.js`
**Files**:
- Also changes: every file `git grep -l -F` lists for the rows M1 to M10 and H1 to H10 of design § Test Text Mapping, over `game/e2e` and `game/ui-review` (on 2026-11-26: 47 e2e files including `support/affixFight.js`, and 15 shots files)
- Read first: design § Test Text Mapping (whole), spec § Player-Facing Texts
**Depends on**: T7
**Requirement**: PT-01, PT-02, PT-04, PT-05

**Steps**:

1. For each row of design § Test Text Mapping, list its files with `git grep -n -F "<find>" -- game/e2e game/ui-review` and replace exactly. Do not change `game/e2e/support/fakeBackend.js` problem `detail` strings (they stay English: the game must ignore them).
2. M6 in `game/e2e/support/game.js` and `game/ui-review/uiRedesign.shots.js`: `getByRole('button', { name: 'Entrar', exact: true })`, `{ name: 'Criar conta', exact: true }`, `{ name: 'Sair', exact: true }`.
3. Test titles that quote an English text quote the Portuguese one.
4. Check every changed `*.shots.js` with `node --check <file>`.
5. Run the gate: one `npx playwright test` with every changed e2e file (no other suite at the same time); a failure outside the replaced lines is rerun alone twice with `--workers=1` before it counts as a flake.

**Tests**: e2e (test-only change; every non-text value unchanged)
**Gate**: `cd game && npm test && npm run build && npx playwright test <every e2e file changed by this task>`
**Done when**:

- [ ] The changed e2e files pass.
- [ ] `git grep -n -E "Welcome back|Account created|Hello, |Click to Start|Enter username|name: 'Login'|name: 'Sign up'|name: 'Logout'|Stage [0-9]|Chapter Boss|Time: [0-9]|Gold: |Could not load|Chapter complete|Farm boss|Paused|1\. Continue|2\. Leave fight|Yes, leave|No, stay" -- game/e2e game/ui-review` prints nothing.
- [ ] `git grep -n -E "'(Password is invalid|Cannot reach the server\. Try again later\.)'|already exists\"|does not exist\"" -- game/e2e ':!game/e2e/support/fakeBackend.js'` prints nothing.

**Commit**: `test(game): read the Portuguese texts in the e2e and review suites`

---

#### T9: The Portuguese texts in the browser [ ]

**Owner**: test-engineer
**Goal**: A new e2e file pins every row of spec § Player-Facing Texts on the real screens and scans the main screens for the inventoried English words (PT-01, PT-02, PT-04, PT-05, PT-06).
**Where**: `game/e2e/portugueseText.spec.js` (new)
**Files**:
- Also changes: `game/e2e/support/fakeBackend.js` (the short-password answer of `POST /users` carries `code` `USER_PASSWORD_TOO_SHORT` and `minLength`; `problem` accepts extra fields)
- Read first: spec (whole), `game/e2e/auth.spec.js` (menu flows), `game/e2e/session.spec.js` and `game/e2e/wake.spec.js` (offline start), `game/e2e/stages.spec.js` (phase, miniboss and boss fights, the timer), `game/e2e/heroes.spec.js` (pause), `game/e2e/farm.spec.js` (farm switch), `game/e2e/support/fakeBackend.js:1-15` (`problem`) and `:1030-1045` (`POST /users`), `:1235-1245` (offline routes)
**Depends on**: T8
**Requirement**: PT-01, PT-02, PT-04, PT-05, PT-06

**Contract** (fake backend):

```js
const problem = (status, detail, code, extra = {}) => ({
    status,
    contentType: 'application/problem+json',
    json: { status, detail, ...(code && { code }), ...extra }
});
//  POST /users, short password
return route.fulfill(problem(400, `Password must have at least ${MIN_PASSWORD_LENGTH} characters`, 'USER_PASSWORD_TOO_SHORT', { minLength: MIN_PASSWORD_LENGTH }));
```

For the codes the fake backend never answers on sign-in (`AUTH_UNAUTHENTICATED`, a 500), the test routes `**/api/users/login` itself with `page.route` before the click.

**Tests**: e2e
**Test cases** (each asserts the exact spec text):

- `the sign-in form reads Usuário, Senha, Entrar and Criar conta` (placeholders and buttons; PT-01 AC 1).
- `an empty field and a username of spaces read Informe usuário e senha and send no request` (PT-01 AC 2, Edge 1; count the `POST /users/login` requests: 0).
- `a sign-in reads Bem-vindo de volta, yan! and Olá, yan!, the prompt Clique para jogar! and the button Sair` (PT-01 AC 3, 5; the prompt has one line: its `getBoundingClientRect().height` is at most 1.5 times its computed `line-height` plus its vertical padding, and `scrollWidth <= clientWidth`).
- `a sign-up reads Conta criada, newbie! and Olá, newbie!` (PT-01 AC 4).
- `the page declares lang pt-BR` (PT-01 AC 6).
- `a taken username reads Esse nome de usuário já existe. and no English detail` (PT-02 AC 2, Edge 4: the page text does not contain `already exists`).
- `an unknown user reads Usuário não encontrado.`, `a wrong password reads Senha incorreta.` (PT-02 AC 3, 4).
- `a short password reads A senha precisa ter pelo menos 8 caracteres.` (PT-02 AC 5; sign up with `short`).
- `an AUTH_UNAUTHENTICATED answer reads Sua sessão expirou. Entre de novo.` (PT-02 AC 6; routed 401 with that code).
- `a 500 answer reads O pedido falhou (erro 500).` (PT-02 AC 7; routed 500 with `detail` `Boom` and `title` `Internal Server Error`).
- `an unreachable server at sign-in and at the start read Não foi possível falar com o servidor. Tente de novo mais tarde.` (PT-02 AC 1, 9; the offline routes of the fake backend).
- `the stage plate reads Estágio 1/10  Fase 1/5, Estágio 1/10  Miniboss and Chefe do capítulo` (PT-04 AC 1 to 3; the default fake definition: 10 stages of 5 phases; start at the phase, at the miniboss and at the chapter boss through the `progress` option).
- `a boss fight reads Tempo: <n>s with the timer 12 px or more right of the plate` (PT-04 AC 4; the default chapter boss limit is 60 000 ms, so the timer matches `/^Tempo: ([1-5]?[0-9]|60)s$/` (the exact values 37 and 9 are pinned by the T6 unit case); `timer.left - plate.right >= 12` from bounding boxes).
- `the wallet reads Ouro: 0 Prata: 0 Cobre: 0` (PT-04 AC 5; the names are inside `.sr-only` spans).
- `the element chip reads Fogo, Água, Natureza, Luz and Escuridão with their data-element` (PT-04 AC 6; one fight per element, or the five monsters of the default fake definition, whose phase monsters cycle the five elements).
- `the farm switch label reads Farmar chefe on one line` (PT-04 AC 9).
- `the pause menu and its confirmation read Pausado, 1. Continuar, 2. Sair da luta, Sair da luta? Isso conta como derrota., Sim, sair and Não, ficar, and Não, ficar returns to the menu` (PT-05 AC 1 to 3).
- `no inventoried English word shows on the main screens` (PT-06 AC 1: on the sign-in form, the welcome screen, a phase fight, a boss fight, the pause menu and its confirmation, `document.body.innerText` contains none of `Username`, `Password`, `Login`, `Sign up`, `Logout`, `Click to Start`, `Welcome back`, `Hello,`, `Stage `, `Phase `, `Chapter Boss`, `Time:`, `Gold`, `Silver`, `Copper`, `Fire`, `Water`, `Nature`, `Light`, `Darkness`, `Farm boss`, `Paused`, `Continue`, `Leave`, `Yes, leave`, `No, stay`; case-sensitive `includes`).
- PT-04 AC 7 and 8 (`Não foi possível carregar o progresso`, `Capítulo concluído!`) are pinned by the T8 re-pins of `uiRedesign.spec.js` and `stages.spec.js`; list their `file:line` in T10.

**Gate**: `cd game && npm test && npx playwright test e2e/portugueseText.spec.js e2e/auth.spec.js`
**Done when**:

- [ ] Every case passes; `auth.spec.js` passes with the new fake backend answer.

**Commit**: `test(game): pin the Portuguese texts in the browser`

---

#### T10: Author check [ ]

**Owner**: test-engineer
**Goal**: Every AC and edge case of PT-01 to PT-06 has a test that asserts its spec text, and the tests kill the injected faults.
**Where**: `.specs/features/portuguese-text/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T9, `scripts/sensor.mjs`
**Depends on**: T9
**Requirement**: PT-01, PT-02, PT-03, PT-04, PT-05, PT-06

**Steps**:

1. Map each AC and edge case to its tests (`file:line`), unit and e2e columns.
2. Run with `node scripts/sensor.mjs` at least: (M1) `errorText` returning the backend `detail` when present; (M2) `USER_PASSWORD_TOO_SHORT` ignoring `minLength`; (M3) the handler of `PasswordTooShortException` removed (the answer becomes 422); (M4) `showEnemyStats` back to the English name; (M5) `showCountdown` without the `s`; (M6) `COINS` with `Gold`; (M7) `PAUSE_MENU_HTML` with `No, stay`; (M8) `index.html` with `lang="en"`; (M9) `campaign.js` chapter boss label `Chapter Boss`.
3. Append § Author check with the table, the mutant results and the suite totals; a survivor or a missing AC becomes a fix task with its owner.

**Tests**: e2e + unit + integration (runs the suites, writes no production code)
**Gate**: `cd backend && ./gradlew test && cd ../game && npm test && npx playwright test e2e/portugueseText.spec.js`
**Done when**:

- [ ] Every AC and edge case maps to a test; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the Portuguese texts`

---

### Phase 4: UI review

#### T11: UI review of the Portuguese screens [ ]

**Owner**: ui-artist
**Goal**: The Portuguese texts fit where the English ones did: no clipped, wrapped or overlapping text (PT-01, PT-04, PT-05; design § Layout).
**Where**: `game/ui-review/portugueseText.shots.js` (new)
**Files**:
- Also creates: `.specs/features/portuguese-text/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/portuguese-text/ui-review/*.png`
- Read first: design § Layout, `game/ui-review/uiRedesign.shots.js` (menu, welcome and HUD shots), `game/ui-review/bossReplayChapters.shots.js` (plate and timer), `game/ui-review/support/`
**Depends on**: T10
**Requirement**: PT-01, PT-04, PT-05

**Shots** (desktop 1280 x 720 only): `01-signin-form`, `02-signin-error-offline` (the longest line, I11), `03-signin-error-short-password`, `04-welcome` (`Olá, yan!`, `Clique para jogar!`, `Sair`), `05-hud-phase` (`Estágio 10/10  Fase 8/8` or the largest numbers the fake definition allows), `06-hud-miniboss-timer` (`Estágio 3/10  Miniboss`, `Tempo: 45s`), `07-hud-chapter-boss` (`Chefe do capítulo`, `Tempo: 90s`), `08-enemy-line-darkness` (`Escuridão  Defesa <n>%  Seu crítico: <n>%`), `09-pause-menu`, `10-pause-confirm`, `11-farm-switch`, `12-chapter-complete`.

**Check against**: design § Layout row by row; Grove tokens and fonts unchanged (AD-022); the start prompt on one line inside its 320 px pill; the timer at least 12 px right of the plate; the farm label on one line inside the battle bar; the pause buttons on one line inside the card; accents render (no tofu boxes) in Cinzel and Figtree.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- portugueseText`
**Done when**:

- [ ] `ui-review.html` lists the 12 shots with `APROVADO`, or each finding as a new task in this file with its owner.

**Commit**: `docs(ui): review the Portuguese screens`

---

## Validation Tables

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 | ✅ Match |
| T2 | T1 (phase 1) | Phase 2 start | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 (phase 2) | Phase 3 start | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 (phase 3) | Phase 4 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Backend domain + web | unit + integration | unit + integration | ✅ OK |
| T2 | Game application | unit | unit | ✅ OK |
| T3 | Game adapter | unit + e2e | unit; e2e in T8 (re-pin) and T9 (new cases) under the owner split of `CLAUDE.md` § Agent team | ✅ OK |
| T4 | Game domain | unit | unit | ✅ OK |
| T5 | Game adapter | unit + e2e | unit; e2e in T8, T9 | ✅ OK |
| T6 | Game adapter | unit + e2e | unit; e2e in T8, T9 | ✅ OK |
| T7 | Game adapter | unit + e2e | unit; e2e in T8, T9 | ✅ OK |
| T8 | Existing e2e | e2e | e2e | ✅ OK |
| T9 | e2e | e2e | e2e | ✅ OK |
| T10 | check | - | runs | ✅ OK |
| T11 | UI review artifact | none | none | ✅ OK |
