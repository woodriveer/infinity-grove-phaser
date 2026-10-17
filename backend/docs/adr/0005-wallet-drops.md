# ADR 0005: Wallet and drops (pre-rolled queues, batched sync)

- Status: Accepted
- Date: 2026-10-17

## Context

Killing a monster must drop coins that the player keeps across reloads. The clicker can produce many kills per minute for many players, so one request per kill is too expensive. Combat runs in the browser, so the server cannot see a kill. The drop range must change per monster level later without an API break.

## Decision

**Currency.** The wallet stores one signed 64-bit total of copper per player (`wallets.copper`). Silver and gold are derived: copper = T mod 100, silver = (T div 100) mod 100, gold = T div 10 000. Gold has no cap other than the 64-bit range. A credit that would overflow clamps at `Long.MAX_VALUE`.

**Drop table.** `app.wallet.drop-table` lists one entry per monster level: `level`, `min-copper`, `max-copper`, `kill-interval-ms`. Level 1 ships as 1, 5 and 1500. `DropTable` and `DropRule` validate the entries and the application refuses to start on a bad one. The table is read at startup.

**Queues instead of per-kill requests.** For each player and level the server stores a queue of 20 pre-rolled drops (`wallet_levels.drops`). `GET /wallet` returns the wallet and the queues. The game pops a value locally on each kill. `POST /wallet/sync { kills: { "<level>": n } }` credits the first k queued values of each level, removes them, refills the queue to 20 and returns `{ wallet, accepted, drops }`. The client never chooses an amount.

**Kill allowance.** Each player and level has a token bucket: 20 at the start, +1 per `kill-interval-ms`, maximum 20, spent 1 per accepted kill. A sync accepts min(requested, allowance) kills and discards the rest without an error. A monster takes 10 clicks plus a 1.5 s respawn, so level 1 allows one kill per 1500 ms.

**Changing the table.** A stored queue with a value outside the level's new range is discarded and re-rolled when next read. A level missing from the table keeps its rows but is ignored.

**Concurrency.** `WalletService` runs in one transaction and reads the wallet with a `PESSIMISTIC_WRITE` lock, so syncs of one player run one after the other. A missing wallet is created with `insert ... on conflict do nothing` followed by the locked read, so two first requests do not collide.

**Errors.** `WALLET_INVALID_KILLS` (malformed body or count) and `WALLET_UNKNOWN_LEVEL` (level not in the table) are 400 through `WalletRequestException` (ADR 0003). An unknown level rejects the whole request. A valid token whose user no longer exists gets 404 `USER_NOT_FOUND` and no wallet row.

**Storage.** Tables `wallets(username, copper)` and `wallet_levels(id, username, level, drops, allowance, allowance_updated_at)` created by Hibernate `ddl-auto: update`. The queue is a comma-separated text column; a JSON column would need a Jackson 2 mapper in Hibernate while Spring Boot 4 ships Jackson 3.

## Consequences

- One request per active player every ~10 s instead of one per kill.
- A cheating client can still claim kills it did not make, up to one per `kill-interval-ms` per level. Closing that gap needs server-side combat. The limitation is recorded as AD-002 in `.specs/STATE.md`.
- Kills the game never syncs (tab closed before the last sync) are lost.
- Two open tabs each show an optimistic wallet that snaps to the server total on the next sync.
- Deleting a user deletes the wallet; a deleted user's access token (valid up to 24 h, ADR 0004) cannot create a new one.

## Alternatives considered

- One request per kill with a server roll: rejected for request volume.
- Client rolls, server stores the amount: rejected; the client could send any amount.
- Batched sync where the client reports totals: rejected; trivially cheatable and loses all drops on a crash.
- Row-level optimistic locking with retries: rejected; the pessimistic lock is short and per player.
