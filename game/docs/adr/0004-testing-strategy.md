# ADR 0004: Testing strategy

- Status: Accepted
- Date: 2026-10-17

## Context

The game has an API layer, scenes rendered on a canvas, and a backend that is developed separately. We need fast feedback on logic and confidence that whole player flows work in a browser.

## Decision

- **Unit tests: Vitest** (`npm test`, config in `vitest.config.js`, jsdom environment). Spec files sit next to the code as `*.test.js`.
  - `src/api/*`: `ApiError` mapping, env `config`, the axios client (fake adapter, so interceptors and defaults still run) and `userApi` (client mocked).
  - Scenes: Phaser is mocked (`vi.mock('phaser')`) with a minimal scene stand-in; DOM forms are real jsdom elements. Test scene logic, not rendering.
- **End-to-end tests: Playwright** (`npm run test:e2e`, config in `playwright.config.js`, specs in `e2e/`, helpers in `e2e/support/`). Chromium only for now.
  - The real game runs on a Vite dev server (port 5174, started by Playwright, reused locally).
  - The backend is faked with `page.route` (`e2e/support/fakeBackend.js`), mirroring the real status codes and ProblemDetail bodies (`USER_ALREADY_EXISTS` 409, `LOGIN_INVALID_PASSWORD` 401, ...). Tests are deterministic, need no database and run in parallel.
  - Anything a player must read or press (form, status messages, greeting) is rendered as real HTML through Phaser DOM elements, so tests use ordinary Playwright locators (`getByRole('alert')`, `getByRole('button')`, `toBeVisible`, `toHaveText`). Canvas-drawn text cannot be located; new player-facing text that tests must verify should follow the same approach.
  - State with no DOM representation (registry user, active scene) is read through `window.__PHASER_GAME__`, exposed by `src/main.js` in dev builds only (`import.meta.env.DEV`, absent from production builds).
  - `openMainMenu` waits for Boot to register its click handler and for the Preloader transition to finish (MainMenu input is disabled until then) before interacting; this avoids lost clicks.
- First scenarios (`e2e/auth.spec.js`): sign up, duplicate username, short password, login, wrong password, unknown user, empty fields, in-flight state, server down, sign up then login after reload, start game after login.
- Each new feature ships unit specs and at least one Playwright scenario for its happy path.

## Consequences

- Unit tests run in about 2 seconds; the e2e suite takes about 30 seconds and spends most of that booting the game.
- The fake backend can drift from the real one. Keep its responses in sync with `UserController` and `ApiExceptionHandler`; a future contract or full-stack smoke test would close the gap.
- Test ids and DOM structure of the auth form (`name` attributes, button labels) are part of the test contract.

## Alternatives considered

- Running e2e against the real backend: realistic but needs PostgreSQL and data cleanup per test; slower and flakier. Reconsider as a small separate smoke suite.
- Screenshot or pixel assertions for canvas text: brittle across machines; asserting on real DOM elements is more reliable.
- Jest: would need extra setup for Vite ESM and `import.meta.env`.
