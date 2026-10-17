# ADR 0003: Authentication UI in the MainMenu scene

- Status: Accepted
- Date: 2026-10-17

## Context

Players must sign up or log in before playing. Phaser has no native text input.

## Decision

- Render the form with Phaser DOM elements (`this.add.dom(...).createFromHTML`), enabled by `dom.createContainer: true` in the game config. Styles live in `public/style.css` (`.auth-form`).
- `MainMenu` offers Login and Sign up. Both call `userApi`; on success the user (`{ username, createdAt, lastLoginAt }`) is stored in the Phaser registry under `user`, and the scene shows a welcome plus "Click to Start!".
- If `registry.user` already exists (e.g. returning from GameOver), the form is skipped.
- Status messages (`<p class="auth-message" role="alert">`) and the greeting (`.welcome`) are also DOM elements, made click-through (`pointerEvents = 'none'`) so they never block the canvas click that starts the game. Failures show the `ApiError` message there, styled with the `error` class; buttons are disabled while a request is in flight.
- Async callbacks check `this.sys.isActive()` before touching the scene.

## Consequences

- Real inputs give browser password managers and mobile keyboards for free.
- The session lives in memory only: a page reload requires logging in again. Superseded by [ADR 0005](0005-persistent-session.md), which stores the session in `localStorage`.
- DOM overlay scales with the canvas (`Scale.FIT`), but its look is plain CSS, not game art.

## Alternatives considered

- Hand-built Phaser text inputs: poor accessibility, no paste or password manager support.
- A separate Login scene: cleaner separation, but the request was to implement it in MainMenu; it can be extracted later.
