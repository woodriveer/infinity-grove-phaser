# ADR 0006: Wallet and drops in the game

- Status: Accepted
- Date: 2026-10-17

## Context

Killing the monster drops copper coins that fly to a wallet in the top-left corner. The backend owns the wallet (backend ADR 0005): it hands out a queue of pre-rolled drops per monster level and credits kills reported in batches. The game must show the drop at once, never block on the network, and agree with the server after each sync.

## Decision

- **One pure ledger.** `src/economy/walletLedger.js` holds everything the game knows about the wallet: the server's last wallet (`base`), the drop queues, and one entry per taken drop that the server has not confirmed. It has no Phaser import. `ClickerGame` only wires it to sprites, tweens, the DOM text and `walletApi`.
- **Drop on death.** When the monster's health reaches 0, the scene takes the next value `v` from the queue of `monster.level` and spawns `v` coin sprites (one per copper) at the monster. Each coin tweens to the wallet text over 600 ms, 100 ms after the previous coin. Each landing adds 1 copper to the display. With no wallet loaded, or an empty or missing queue, nothing drops.
- **Display rule.** The text shows the server wallet plus the landed copper of every unconfirmed drop, carried 100 copper to 1 silver and 100 silver to 1 gold. The game holds no drop amounts or ranges.
- **Batched sync.** A looping 10 s timer calls `ledger.beginSync()`. When it returns kills per level the scene sends `POST /wallet/sync { kills }`. One sync at a time. On success the sent entries leave the ledger, the response wallet becomes the base, and each queue becomes the server queue minus the drops taken since the request. On failure the entries stay unreported and go out with the next sync. One last best-effort sync runs when the scene shuts down, without retry.
- **Loading.** `GET /wallet` runs when the scene starts and is retried on each tick until it succeeds. Until then the text is hidden and kills drop nothing.
- **Wallet text is HTML.** A `dom` element with class `wallet`, click-through, so Playwright reads it like the auth form (ADR 0004).
- **Fake backend.** `e2e/support/fakeBackend.js` implements the wallet contract (queue of 20, credit of the first k kills). Its Playwright route globs are `**/api/wallet` and `**/api/wallet/**`: the looser `**/api/wallet**` also matches Vite's request for `/src/api/walletApi.js` and breaks game boot.
- **E2E workers.** `playwright.config.js` caps workers at 3. Every test boots the game, and 6 parallel boots starved each other into timeouts.

## Consequences

- A kill pays out with no request and works while the backend is down; the coins are confirmed by the next successful sync.
- The display can overshoot by the coins in flight when a sync that covers them answers first; it settles within a second (coins landing for a covered drop add nothing).
- If the server credits less than the game showed (it discards kills above its allowance), the text snaps down to the server wallet.
- Kills not synced before the tab closes are lost.
- The e2e suite takes about 1.3 minutes: the drop scenario waits for one real 10 s tick.

## Alternatives considered

- Updating the wallet text from each kill's value directly: rejected; it needs a rule for coins in flight when a sync answers, which the ledger entries answer exactly.
- A request per kill: rejected for request volume.
- Phaser `Text` for the wallet: rejected; canvas text cannot be located by tests (ADR 0004).
- Faking timers in Playwright to skip the 10 s wait: rejected; Phaser's loop runs on its own clock, and one real wait is simpler.
