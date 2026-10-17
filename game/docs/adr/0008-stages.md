# ADR 0008: Stages, minibosses and the chapter boss in the game

- Status: Accepted
- Date: 2026-10-17

## Context

The game was one endless level 1 monster. The campaign (backend ADR 0006) gives it 10 stages of 5 phases, a miniboss that must die within 30 s after each stage, and a chapter boss within 60 s after stage 10. The backend stores the definitions and each player's position and decides every move; combat runs here, so the game must show an encounter, run the boss timers, and keep the backend informed without ever waiting for it between phases. The code follows ADR 0007 (hexagonal modules).

## Decision

**Three small modules, no Phaser in two of them.**

- `domain/campaign/campaign.js`: `Campaign.fromProgress(payload)` holds the position and the chapter definition the backend sent. `encounter()` returns what to spawn (`kind`, `health`, `timeLimitMs`, HUD `label`), `cleared()` and `failed()` return the next `Campaign` by the same transition table as the backend, `position()` is what a report names. `domain/campaign/bossCountdown.js`: `BossCountdown(limitMs)` with `advance(ms)`, whole `seconds` rounded up, `expired`.
- `application/campaign/campaignSession.js`: `createCampaignSession({ gateway })` owns the `Campaign` and the report queue. `load()` (single flight), `clear()` and `fail()` move at once and queue one outcome report with the position they left, `flush()` sends the queue in order with one request in flight, `flushOnExit()` sends it once without retry, `onRealign(callback)`.
- `adapters/http/progressApi.js` implements the gateway: `GET /progress` and `POST /progress/outcome { chapter, stage, encounter, phase, outcome }`.

**The scene only draws.** `ClickerGame` reads `createCampaignSession` from `registry.get('services')` (ADR 0007). The monster rectangle, its health bar and the damage numbers are unchanged; they start hidden (alpha 0) and appear when an encounter is shown. The stage position (`.stage-hud`), the boss countdown (`.boss-timer`, `Time: N`) and messages (`.stage-message`) are click-through HTML like the wallet text (ADR 0006), so Playwright reads them as text.

**Flow.** `create()` loads the campaign. A killed monster plays the existing fade (500 ms) and respawn delay (1 000 ms); `session.clear()` has already moved to the next encounter, which is shown after the delay. A boss starts a `BossCountdown` that `update(time, delta)` advances; the click handler runs before `update`, so a kill and the end of the time in the same frame count as a kill. When the countdown reaches 0 the boss is removed, `session.fail()` moves to the last phase of the stage and that encounter is shown after the respawn delay. The chapter boss dying shows `Chapter complete!`; the stored `completed` progress shows it at load. Every kill still takes its level 1 drop, bosses included.

**Saving.** The 10 s tick that syncs the wallet also flushes the report queue, or retries `GET /progress` while the campaign never loaded (the scene shows `Could not load progress` and spawns nothing meanwhile). A network or server failure leaves the report first in the queue; play continues from the local position. A 409 carries the stored progress in `ApiError.body.progress`; the session drops the queue, adopts that progress and calls `onRealign`, and the scene shows that encounter. A respawn that was already waiting is cancelled by a generation counter the scene bumps on every realignment. On shutdown the queue is sent once, in order.

**Fake backend.** `e2e/support/fakeBackend.js` serves `/progress` with the same transition table. Its options `progress` (starting positions) and `definition` (the chapter) let a scenario start at a boss or play a small chapter in seconds. Route globs are `**/api/progress` and `**/api/progress/**`.

## Consequences

- Play never waits for the network between phases, and works while the backend is down (reports retry), except that no encounter spawns until the first `GET /progress` succeeds, because the game holds no stage data.
- The transition table exists in `Campaign` and in the backend `Progress`. The backend is authoritative; a drift shows up as a 409 and a snap to the stored position. Both sides test the same rows.
- The boss timers are the client's: it can report a boss as cleared without beating it in time (`AD-002`, `AD-004`).
- A reload during a boss restarts the fight with full health and a full countdown; only the position is stored.
- A second chapter needs a seed on the backend and a rule for the game after `completed`; today the game ends with the message.

## Alternatives considered

- **Wait for the backend before each spawn:** rejected; a round trip between every phase and no play while offline.
- **Keep the stage rules in `ClickerGame`:** rejected; they would need Phaser to be tested and the scene would pass 500 lines.
- **A Phaser timer event for the boss countdown:** rejected; counting the frame delta in a pure class is testable without a clock and keeps kill-before-timeout ordering explicit.
- **Send each report at once instead of on the tick:** rejected; it would add a request per phase, while the 10 s tick already batches the wallet.
