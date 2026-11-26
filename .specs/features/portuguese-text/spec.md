# Portuguese Text Specification

**Status**: Approved by the owner on 2026-11-26 (recommended defaults). Pays TD-001 (`characters` spec) and TD-008 (`supabase-postgres` spec), AD-007. Runs last of the three debt features, after `tech-debt-polish` and `defense-contract`.

## Problem Statement

AD-007 says every player-facing text is Portuguese, but the text that existed before 2026-10-17 is still English: the main menu and its messages, the error lines of sign-in and sign-up (some of them are the backend's English `detail`), the stage plate, the boss timer, the wallet labels, the enemy element chip, the pause menu, the farm switch and two scene messages. Every feature since then wrote Portuguese next to them, so the screens mix languages (`Water  Defesa 10%  Seu crítico: 28%`). This feature translates every English string a player can read, as listed in § Inventory, and moves the matching test assertions.

## Inventory (English text a player can read, 2026-11-26, `main` at `55caf5b`)

Found by scanning every string literal of `game/src` (tests excluded), `game/index.html` and the backend answers the game shows. Each row is one string; § Player-Facing Texts gives its Portuguese text.

| # | Where | English today | Seen |
| --- | --- | --- | --- |
| I1 | `game/src/adapters/phaser/MainMenu.js:27` `FORM_HTML` | placeholder `Username` | sign-in form |
| I2 | `MainMenu.js:28` | placeholder `Password` | sign-in form |
| I3 | `MainMenu.js:30` | button `Login` | sign-in form |
| I4 | `MainMenu.js:31` | button `Sign up` | sign-in form |
| I5 | `MainMenu.js:173`, `:213` | `Enter username and password` | message line |
| I6 | `MainMenu.js:206` | `Welcome back, <user>!` | message line after sign-in |
| I7 | `MainMenu.js:218` | `Account created, <user>!` | message line after sign-up |
| I8 | `MainMenu.js:277` | `Hello, <user>!` | welcome title |
| I9 | `MainMenu.js:61` `WELCOME_HTML` | `Click to Start!` | start prompt |
| I10 | `MainMenu.js:65` `LOGOUT_HTML` | button `Logout` | welcome screen |
| I11 | `game/src/application/ApiError.js:25`, `game/src/application/session/sessionManager.js:94` | `Cannot reach the server. Try again later.` | message line (no answer) |
| I12 | `ApiError.js:20` | `Request failed (<status>)` | message line (answer without `detail` and `title`) |
| I13 | `ApiError.js:28` | the JavaScript error text of a request that could not be built | message line |
| I14 | backend `domain/BusinessException.kt` `UserAlreadyExistsException`, shown through `detail` | `User '<user>' already exists` | message line, sign-up |
| I15 | `LoginUserNotFoundException` | `User '<user>' does not exist` | message line, sign-in |
| I16 | `InvalidPasswordException` | `Password is invalid` | message line, sign-in |
| I17 | `domain/User.kt:74` `require` (400, no `code`) | `Password must have at least 8 characters` | message line, sign-up |
| I18 | `InvalidRefreshTokenException`, `adapter/security/SecurityConfig.kt:81` | `Refresh token is invalid`, `Authentication is required` | message line, if a sign-in call answers them |
| I19 | `game/src/domain/campaign/campaign.js:121` | `Stage <s>/<n>  Phase <p>/<m>` | stage plate |
| I20 | `campaign.js:137` | `Stage <s>/<n>  Miniboss` | stage plate |
| I21 | `campaign.js:151` | `Chapter Boss` | stage plate |
| I22 | `game/src/adapters/phaser/ClickerGame.js` `showCountdown` | `Time: <seconds>` | boss timer |
| I23 | `ClickerGame.js:65` `COINS` | `Gold`, `Silver`, `Copper` (screen-reader labels inside `.wallet`, read as `Gold: 0 Silver: 0 Copper: 3`) | wallet |
| I24 | `ClickerGame.js:144` | `Could not load progress` | scene message |
| I25 | `ClickerGame.js:145` | `Chapter complete!` | scene message |
| I26 | `ClickerGame.js` `showEnemyStats` (`element.charAt(0) + element.slice(1).toLowerCase()`) | `Fire`, `Water`, `Nature`, `Light`, `Darkness` | enemy element chip |
| I27 | `ClickerGame.js:131` `FARM_TOGGLE_HTML` | `Farm boss` | farm switch label |
| I28 | `ClickerGame.js:133` | `Paused` | pause menu title |
| I29 | `ClickerGame.js:135` | `1. Continue` | pause menu |
| I30 | `ClickerGame.js:136` | `2. Leave fight` | pause menu |
| I31 | `ClickerGame.js:139` | `Leave the fight? It counts as failed.` | pause confirmation |
| I32 | `ClickerGame.js:140` | `Yes, leave` | pause confirmation |
| I33 | `ClickerGame.js:141` | `No, stay` | pause confirmation |
| I34 | `game/index.html:2` | `<html lang="en">` | language the browser and screen readers use |

Not player text (stay English, Q8): thrown `Error` messages that no screen shows (`campaign.js` `Unknown stage`, `Unknown boss`, `A completed campaign has nothing to clear`, `Only a boss can be failed`; `campaignSession.js` `The campaign has not loaded`; `sessionManager.js` `No active session`, which only leads to the sign-in form), Phaser scene keys, CSS classes, test ids, storage keys, log lines and backend `detail` strings.

## Goals

- [ ] Every row of § Inventory shows its Portuguese text from § Player-Facing Texts.
- [ ] The sign-in and sign-up error lines come from the game by the backend `code`, so a backend `detail` in English never reaches the screen.
- [ ] Every test that asserted an English text asserts the Portuguese one; a test fails if any § Inventory English string comes back on the main screens.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A translation layer or a language switch | Q1: the game speaks Portuguese only (AD-007) |
| Translating the backend `detail` strings | Q2: the backend stays English for logs and API clients; the game translates by `code` |
| `HP`, the number suffixes `K`, `M`, `B`, `T`, `Combo`, `Miniboss`, `Infinity Grove`, hero and skill names | Q3: terms Brazilian players use as they are; already used in Portuguese texts of the game |
| Code, comments, test titles, specs | AD-007: specs and code stay English |
| Phone layout of the error line (TD-008 asked for a 390 x 844 shot) | The owner targets desktop only (TD-010 dropped on 2026-11-26) |
| Rewording any text that is already Portuguese | Not English |

---

## Player-Facing Texts

Every text exactly (AD-007, L-010). `<user>` is the username as typed (trimmed), `<status>` the HTTP status, `<n>` a number.

| # | Portuguese text |
| --- | --- |
| I1 | placeholder `Usuário` |
| I2 | placeholder `Senha` |
| I3 | button `Entrar` |
| I4 | button `Criar conta` |
| I5 | `Informe usuário e senha` |
| I6 | `Bem-vindo de volta, <user>!` |
| I7 | `Conta criada, <user>!` |
| I8 | `Olá, <user>!` |
| I9 | `Clique para jogar!` |
| I10 | button `Sair` |
| I11 | `Não foi possível falar com o servidor. Tente de novo mais tarde.` |
| I12 | `O pedido falhou (erro <status>).` (also for every answer whose `code` has no row below) |
| I13 | `O pedido falhou.` |
| I14 | code `USER_ALREADY_EXISTS`: `Esse nome de usuário já existe.` |
| I15 | code `LOGIN_USER_NOT_FOUND`: `Usuário não encontrado.` |
| I16 | code `LOGIN_INVALID_PASSWORD`: `Senha incorreta.` |
| I17 | code `USER_PASSWORD_TOO_SHORT` (new, 400, with `minLength`): `A senha precisa ter pelo menos <minLength> caracteres.`; without a numeric `minLength`: `A senha é muito curta.` |
| I18 | codes `AUTH_INVALID_REFRESH_TOKEN` and `AUTH_UNAUTHENTICATED`: `Sua sessão expirou. Entre de novo.` |
| I19 | `Estágio <s>/<n>  Fase <p>/<m>` (two spaces before `Fase`, as today) |
| I20 | `Estágio <s>/<n>  Miniboss` |
| I21 | `Chefe do capítulo` |
| I22 | `Tempo: <seconds>s` |
| I23 | `Ouro`, `Prata`, `Cobre` (the `.wallet` text reads `Ouro: 0 Prata: 0 Cobre: 3`) |
| I24 | `Não foi possível carregar o progresso` |
| I25 | `Capítulo concluído!` |
| I26 | the names of `ELEMENT_LABELS`: `Fogo`, `Água`, `Natureza`, `Luz`, `Escuridão` |
| I27 | `Farmar chefe` |
| I28 | `Pausado` |
| I29 | `1. Continuar` |
| I30 | `2. Sair da luta` |
| I31 | `Sair da luta? Isso conta como derrota.` |
| I32 | `Sim, sair` |
| I33 | `Não, ficar` |
| I34 | `<html lang="pt-BR">` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** Translation layer | **Recommended**: none; each string is replaced in place by its Portuguese text | The game has one language (AD-007); a layer adds indirection to every test | y (owner, 2026-11-26: recommended defaults) |
| **Q2** Backend error messages (TD-008) | **Recommended**: the game shows a Portuguese line chosen by the backend `code` (§ Player-Facing Texts I11 to I18), never the backend `detail`; the backend `detail` stays English. The backend gives the short-password error a code: `USER_PASSWORD_TOO_SHORT` with status 400 (as today) and a `minLength` property. Recorded as AD-032 | The `characters` spec keeps backend codes as stable English constants; one place in the game owns the player's words; a number in the text comes from the backend (AD-011 spirit) | y (owner, 2026-11-26: recommended defaults) |
| **Q3** Gaming terms | **Recommended**: keep `HP`, `K`/`M`/`B`/`T`, `Combo`, `Miniboss` | Common in Brazilian games; `Miniboss` and `Combo` already appear in Portuguese texts (`Tempo extra de miniboss`, talent branch `Combo`) | y (owner, 2026-11-26: recommended defaults) |
| **Q4** Stage and phase words | **Recommended**: `Estágio` and `Fase` (`Estágio 1/10  Fase 2/8`); the chapter boss plate reads `Chefe do capítulo`, as `bossLabel` already does | `Capítulo` is the chapter; `Estágio` and `Fase` keep three distinct levels | y (owner, 2026-11-26: recommended defaults) |
| **Q5** Greeting | **Recommended**: `Bem-vindo de volta, <user>!` | The usual Brazilian game greeting; one short line | y (owner, 2026-11-26: recommended defaults) |
| **Q6** Farm switch | **Recommended**: `Farmar chefe` | The ui-redesign mock-up says `Modo Farmar`; `farmar` is the word Brazilian players use | y (owner, 2026-11-26: recommended defaults) |
| **Q7** Boss timer | **Recommended**: `Tempo: 37s` | Short like today; the mock-up `Tempo Restante: 37s` is twice as wide on the plate row | y (owner, 2026-11-26: recommended defaults) |
| **Q8** Messages no screen shows | **Recommended**: stay English (§ Inventory, "Not player text") | They are developer diagnostics, like code (AD-007) | y (owner, 2026-11-26: recommended defaults) |
| **Q9** Blank username | **Recommended**: kept as today: the empty check already uses the trimmed username (`MainMenu.js:171`, `:211`) and the game sends the trimmed name, so `   ` reads I5 (`Informe usuário e senha`); only the text changes | The backend's untranslated 400 for a blank name stays unreachable from the game | y (owner, 2026-11-26: recommended defaults) |
| **Q10** A game older than this feature against the new backend | **Recommended**: it keeps showing the English `detail`, including the new short-password answer (same 400, same `detail`, one more property) | Additive change; nothing breaks | y (owner, 2026-11-26: recommended defaults) |
| Implicit dimensions | Input bounds: username trimmed (Q9); `minLength` read only when it is an integer (I17). Failure: every failed request maps to one line (I11 to I18). Retry/idempotency, concurrency, data lifecycle, external dependencies: N/A, because only texts change. Auth: N/A, no endpoint or permission changes. Observability: the backend keeps logging the English code and `detail` | Large-scope sweep | y |

**Open questions:** none. The owner approved the recommended defaults Q1 to Q10 on 2026-11-26.

---

## User Stories

### P1: The main menu speaks Portuguese ⭐ MVP

**User Story**: As a Brazilian player, I want the sign-in screen and its messages in Portuguese so that I understand them.

**Why P1**: The first screen every player sees (TD-001, TD-008).

**Acceptance Criteria**:

1. WHILE the sign-in form is shown the game SHALL show the placeholders `Usuário` and `Senha` and the buttons `Entrar` and `Criar conta`.  <!-- state-driven -->
2. WHEN the player presses `Entrar` or `Criar conta` with the username or the password empty, or a username of only spaces, THEN the game SHALL show `Informe usuário e senha` as an error and send no request.  <!-- event-driven -->
3. WHEN a sign-in of `yan` succeeds THEN the game SHALL show `Bem-vindo de volta, yan!` and the welcome title `Olá, yan!`.  <!-- event-driven -->
4. WHEN a sign-up of `newbie` succeeds THEN the game SHALL show `Conta criada, newbie!` and the welcome title `Olá, newbie!`.  <!-- event-driven -->
5. WHILE the welcome screen is shown the game SHALL show the start prompt `Clique para jogar!` on one line inside its 320 px pill and the button `Sair`.  <!-- state-driven -->
6. The page SHALL declare `lang="pt-BR"` on its `html` element.  <!-- ubiquitous -->

**Independent Test**: In the browser, open the menu, read the form, sign in as `yan` and read the welcome screen.

---

### P1: Error lines in Portuguese by code ⭐ MVP

**User Story**: As a player whose sign-in fails, I want to read why in Portuguese.

**Acceptance Criteria**:

1. IF a sign-in or sign-up gets no answer THEN the game SHALL show `Não foi possível falar com o servidor. Tente de novo mais tarde.`  <!-- unwanted-behavior -->
2. IF the backend answers `USER_ALREADY_EXISTS` THEN the game SHALL show `Esse nome de usuário já existe.`  <!-- unwanted-behavior -->
3. IF the backend answers `LOGIN_USER_NOT_FOUND` THEN the game SHALL show `Usuário não encontrado.`  <!-- unwanted-behavior -->
4. IF the backend answers `LOGIN_INVALID_PASSWORD` THEN the game SHALL show `Senha incorreta.`  <!-- unwanted-behavior -->
5. IF the backend answers `USER_PASSWORD_TOO_SHORT` with `minLength` 8 THEN the game SHALL show `A senha precisa ter pelo menos 8 caracteres.`; IF `minLength` is missing THEN it SHALL show `A senha é muito curta.`  <!-- unwanted-behavior -->
6. IF the backend answers `AUTH_INVALID_REFRESH_TOKEN` or `AUTH_UNAUTHENTICATED` THEN the game SHALL show `Sua sessão expirou. Entre de novo.`  <!-- unwanted-behavior -->
7. IF the backend answers status 500 with no known code THEN the game SHALL show `O pedido falhou (erro 500).`, whatever its `detail` and `title`.  <!-- unwanted-behavior -->
8. IF a request cannot be built (no request was sent) THEN the game SHALL show `O pedido falhou.`  <!-- unwanted-behavior -->
9. WHEN the stored session is checked at start and the server does not answer THEN the game SHALL show the text of AC 1.  <!-- event-driven -->

**Independent Test**: The fake backend answers each code; the message line reads the Portuguese text.

---

### P1: The backend names the short-password error ⭐ MVP

**User Story**: As the game, I want a code for the short-password error so that I can say it in Portuguese with the right number.

**Acceptance Criteria**:

1. WHEN `POST /users` gets a password of fewer than 8 characters THEN the backend SHALL answer 400 with `code` `USER_PASSWORD_TOO_SHORT`, `minLength` 8 and `detail` `Password must have at least 8 characters`.  <!-- event-driven -->
2. WHEN `PUT /users/{username}/password` gets a new password of fewer than 8 characters THEN the backend SHALL answer the same 400 body.  <!-- event-driven -->
3. The backend SHALL keep every other status, code and `detail` unchanged.  <!-- ubiquitous -->

**Independent Test**: `UserControllerIT` posts a 5-character password and reads 400, the code, `minLength` 8.

---

### P1: The combat HUD speaks Portuguese ⭐ MVP

**User Story**: As a player in a fight, I want the stage plate, the timer, the wallet and the enemy line in Portuguese.

**Acceptance Criteria**:

1. WHILE a phase monster of stage 1 of 10, phase 2 of 8 is fought the stage plate SHALL read `Estágio 1/10  Fase 2/8`.  <!-- state-driven -->
2. WHILE the miniboss of stage 3 of 10 is fought the stage plate SHALL read `Estágio 3/10  Miniboss`.  <!-- state-driven -->
3. WHILE the chapter boss is fought the stage plate SHALL read `Chefe do capítulo`.  <!-- state-driven -->
4. WHILE a boss with 37 seconds left is fought the timer SHALL read `Tempo: 37s`, and the timer SHALL stay at least 12 px right of the stage plate (spec `boss-replay-chapters`, UI review #1).  <!-- state-driven -->
5. WHEN the wallet holds 0 gold, 0 silver and 3 copper THEN the `.wallet` text SHALL read `Ouro: 0 Prata: 0 Cobre: 3`, with the names still read only by screen readers.  <!-- event-driven -->
6. WHILE a monster of element FIRE, WATER, NATURE, LIGHT or DARKNESS is shown the element chip SHALL read `Fogo`, `Água`, `Natureza`, `Luz` or `Escuridão`, and SHALL keep its `data-element` value (`FIRE` ... `DARKNESS`) and its dot colour.  <!-- state-driven -->
7. WHEN the campaign fails to load THEN the scene message SHALL read `Não foi possível carregar o progresso`.  <!-- event-driven -->
8. WHEN the last chapter boss is won THEN the scene message SHALL read `Capítulo concluído!`.  <!-- event-driven -->
9. WHILE the farm switch is shown its label SHALL read `Farmar chefe` on one line under the switch.  <!-- state-driven -->

**Independent Test**: In the browser, fight the chapter 5 boss of the fake backend and read the plate, the timer, the wallet and the chips.

---

### P1: The pause menu speaks Portuguese ⭐ MVP

**User Story**: As a player who pauses, I want the pause menu and its confirmation in Portuguese.

**Acceptance Criteria**:

1. WHEN the player pauses the fight THEN the pause menu SHALL read the title `Pausado` and the buttons `1. Continuar` and `2. Sair da luta`.  <!-- event-driven -->
2. WHEN the player chooses `2. Sair da luta` THEN the confirmation SHALL read `Sair da luta? Isso conta como derrota.` with the buttons `Sim, sair` and `Não, ficar`.  <!-- event-driven -->
3. The keys `1` and `2` and the buttons SHALL keep their behaviour (continue, leave, confirm, stay).  <!-- ubiquitous -->

**Independent Test**: Pause, read, choose leave, read the confirmation, press `Não, ficar`.

---

### P1: No English left on the main screens ⭐ MVP

**User Story**: As the owner, I want a test that fails if an inventoried English text comes back.

**Acceptance Criteria**:

1. WHEN the main menu, the welcome screen, a phase fight, a boss fight, the pause menu and its confirmation are shown THEN `document.body.innerText` SHALL contain none of the English strings of § Inventory I1 to I33 (`Username`, `Password`, `Login`, `Sign up`, `Logout`, `Click to Start`, `Welcome back`, `Hello,`, `Stage `, `Phase `, `Chapter Boss`, `Time:`, `Gold`, `Silver`, `Copper`, `Fire`, `Water`, `Nature`, `Light`, `Darkness`, `Farm boss`, `Paused`, `Continue`, `Leave`, `Yes, leave`, `No, stay`), compared case-sensitively.  <!-- event-driven -->
2. WHEN the translation is done THEN `git grep` over `game/src` (tests included), `game/e2e` and `game/ui-review` SHALL find none of the English strings of § Inventory I3 to I33 inside a string literal, except the thrown-error messages of Q8.  <!-- event-driven -->

**Independent Test**: `game/e2e/portugueseText.spec.js` walks the screens and checks the list.

---

## Edge Cases

- WHEN the username is `   ` (spaces only) and the password is filled THEN the game SHALL show `Informe usuário e senha` and send no request.
- WHEN the stage plate shows a farm fight of an earlier chapter THEN it SHALL keep `Rever chefe: <boss> (Capítulo <n>)` on two lines as today.
- WHEN a boss has 9 seconds left THEN the timer SHALL read `Tempo: 9s`.
- WHEN the backend answers 409 `USER_ALREADY_EXISTS` with an English `detail` THEN the screen SHALL NOT contain `already exists`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PT-01 | P1: Main menu - AC 1 to 6, Edge 1 | Tasks T3, T8, T10 | Pending |
| PT-02 | P1: Error lines - AC 1 to 9, Edge 4 | Tasks T2, T8, T10 | Pending |
| PT-03 | P1: Backend code - AC 1 to 3 | Tasks T1 | Pending |
| PT-04 | P1: Combat HUD - AC 1 to 9, Edge 2, 3 | Tasks T4, T5, T6, T9, T10 | Pending |
| PT-05 | P1: Pause menu - AC 1 to 3 | Tasks T7, T9, T10 | Pending |
| PT-06 | P1: No English left - AC 1, 2 | Tasks T10 | Pending |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

---

## Amends

- `.specs/features/characters/spec.md` TD-001 and `.specs/features/supabase-postgres/spec.md` TD-008: paid by this feature.
- `ui-redesign` UIR-15 AC 6 names the prompt `Click to Start!`; it becomes `Clique para jogar!` with the same pill.

## Success Criteria

- [ ] The e2e scan of PT-06 passes on every main screen.
- [ ] The ui review shows no clipped or wrapped Portuguese text on the menu, the HUD and the pause menu.
