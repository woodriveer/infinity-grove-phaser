# ADR 0007: Modular game with hexagonal architecture

- Status: Accepted
- Date: 2026-10-17

## Context

The game grew by features: auth, session, wallet, drops. Each new feature was wired straight into a Phaser scene. `ClickerGame` (246 lines) now draws sprites and also decides when to load the wallet, when to sync, how to retry and what to do on exit, and it imports `walletApi` itself. `MainMenu` imports `userApi` and `sessionManager` directly. `sessionManager` imports `authApi` and `ApiError`, and `httpClient` imports `sessionManager`, a cycle the code avoids only by a comment ("must not import httpClient").

The stages feature adds a state machine (phases, minibosses, a chapter boss), timers and an ordered report queue. Written inside the scene it would need a Phaser instance to test, and the scene tests (773 lines for `ClickerGame` alone) are already the slowest to change.

## Decision

Apply the hexagonal (ports and adapters) style to the game, scaled to plain JavaScript modules.

**Layers, with one dependency rule: imports point inward only.**

| Layer           | Folder                         | Contains                                                                                  | May import                  |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------- |
| Domain          | `src/domain/<area>/`           | Pure rules and state: `combat`, `economy`, `campaign`. No I/O, timers, DOM, Phaser, axios | its own area, other domain  |
| Application     | `src/application/<area>/`      | Use cases that orchestrate domain objects through ports: wallet sync, progress reporting, session start/refresh | domain, port definitions |
| Ports           | next to the service that needs them, as a JSDoc typedef (`@typedef WalletGateway`) | The shape of what the application needs from outside | nothing |
| Adapters in     | `src/adapters/phaser/`         | Scenes: draw, read input, call application services, translate results into sprites/DOM  | application, domain         |
| Adapters out    | `src/adapters/http/`, `src/adapters/storage/` | `httpClient`, `walletApi`, `authApi`, `userApi`, `sessionStore` (localStorage), clock | ports they implement        |
| Composition     | `src/main.js`                  | Builds the adapters, injects them into the services and the services into the scenes     | everything                  |

**Rules that follow**

- The domain and application layers never import `phaser`, `axios`, `localStorage` or `window`. Time comes in as a function (`now()`), timers as a scheduler port.
- Application services take their ports in the constructor or factory (`createWalletSync({ gateway, scheduler })`). No service imports a singleton adapter.
- A scene owns no business rule: no thresholds, no retry policy, no state machine. It subscribes to a service or domain object and renders.
- Adapters are replaceable: the e2e `fakeBackend` already stands in for the HTTP side; unit tests inject a fake gateway instead of mocking modules.
- The `httpClient`/`sessionManager` cycle disappears: `sessionManager` receives an `authGateway` port, and `main.js` hands it `authApi`.

**Naming.** A file keeps its name when it moves, so history and ADR 0004/0005/0006 references stay findable. Moves are `git mv`.

**Enforcement.** One Vitest test (`src/architecture.test.js`) reads every file under `src/`, extracts the import specifiers and fails when a layer imports one it must not (domain or application importing `phaser`, `axios` or an adapter; an adapter importing another adapter's folder). No lint dependency is added.

**Testing by layer.** Domain: plain unit tests, no fakes. Application: unit tests with fake ports and a manual scheduler, which also makes the 10 s sync tick and the 30 s and 60 s boss timers testable without waiting. Adapters: the existing scene and HTTP tests, now shorter because the logic is gone from them. Playwright covers the wiring.

## Refactor inventory

Existing code that does not follow the decision, and what changes. Every step is behavior-preserving and gated by the existing tests of that module.

| Today                                                                 | Problem                                                       | Target                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `combat/monster.js`, `economy/walletLedger.js`                        | Already pure                                                  | Move to `domain/combat`, `domain/economy`                                                       |
| `ClickerGame`: `tick`, `syncWallet`, `loadWallet`, `syncOnExit`, `walletApi` import | Sync policy and I/O inside a scene                | `application/wallet/walletSync.js` with a `WalletGateway` port; the scene calls it and renders  |
| `auth/sessionManager.js` imports `api/authApi`, `api/ApiError`, `sessionStore` | Application logic bound to adapters, cycle with `httpClient` | `application/session/sessionManager.js` receiving `authGateway` and `sessionStore` ports        |
| `auth/sessionStore.js` (localStorage)                                 | An adapter living beside application code                     | `adapters/storage/sessionStore.js`                                                              |
| `api/*` (`httpClient`, `walletApi`, `authApi`, `userApi`, `ApiError`, `config`) | Outbound adapters mixed with nothing else, fine in role | `adapters/http/`, each implementing a port                                                      |
| `MainMenu` imports `userApi` and `sessionManager`                      | Scene calls adapters and session logic directly               | Scene receives a `session` application service; form/DOM code stays in the scene               |
| `Boot`, `Preloader`                                                   | Phaser loading only                                           | Move to `adapters/phaser/` unchanged                                                            |

New stage code is written in the target shape from the start: `domain/campaign` (position and transition rules, boss timer), `application/campaign/progressSync.js` (ordered outcome queue, 409 realignment, retry) with a `ProgressGateway` port, and a scene that renders them.

## Consequences

- Stage rules, the report queue and the boss timers are tested in milliseconds with no Phaser and no network.
- More files and one more hop between a click and a request; `main.js` becomes the single place that shows how the game is wired.
- The refactor touches most imports at once, so it lands first and alone, before the stage work, in small commits that each keep the suite green.
- Dependency injection is by hand (factories), not a container; adding a framework for ten services is not worth it.
- The architecture test checks import paths only. It does not stop a scene from growing a rule; code review does.

## Alternatives considered

- **Keep the folders, add the stage logic to `ClickerGame`:** fastest now, but the scene would pass 400 lines and every stage test would need Phaser.
- **A DI container or an event bus:** rejected as more machinery than the game has parts.
- **Convert to TypeScript for real interfaces:** rejected for now; JSDoc typedefs name the ports without a build change.
- **Refactor everything in one commit:** rejected; a failing test could not be tied to one move.
