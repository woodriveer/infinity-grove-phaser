# Wallet Specification

## Problem Statement

Players earn coins from monsters, but nothing stores them: the game has no currency and the backend has no per-player state besides the account. The backend must keep each player's wallet, decide how many coins each kill drops, and stay cheap to run when many players click all day. Drops are rolled by the server ahead of time and handed to the game as a queue per monster level, so the game needs no request per kill. The drop range and the kill rate come from a configuration table keyed by monster level, so stronger monsters can drop more without changing code or the API.

## Goals

- [ ] An authenticated player reads their wallet (gold, silver, copper) and a queue of 20 pre-rolled drops per monster level with one request.
- [ ] A player reports kills per monster level in batches and the wallet is credited with the server's own rolled values, never an amount chosen by the client.
- [ ] The drop range (min and max copper) and the fastest honest kill interval of each monster level come from configuration; level 1 ships as 1 to 5 copper and 1500 ms.
- [ ] Credited kills of a level are bounded by a server-side allowance of 1 kill per that level's kill interval (burst 20).
- [ ] Gold has no cap other than the 64-bit range of the stored copper total.

## Out of Scope

| Feature                                           | Reason                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Monsters beyond level 1 (stats, art, spawning)    | The table and API support more levels; no other monster exists yet  |
| Non-copper drops, items, drop chances             | Every drop is copper                                                |
| Spending coins, shops, trading                    | Later features                                                      |
| Server-side combat simulation                     | Combat runs in the browser; the allowance bounds a cheater instead  |
| Transaction history / ledger                      | Only the current total is kept                                      |
| Per-IP or per-account rate limiting               | The kill allowance is the only throttle                             |
| Reloading the table without a restart             | Configuration is read at startup                                    |
| Game UI, coin animation, client queue handling    | Covered by the `drops` feature                                      |

---

## Assumptions & Open Questions

| Assumption / decision        | Chosen default                                                                                                  | Rationale                                                                          | Confirmed? |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| Currency units               | 100 copper = 1 silver, 100 silver = 1 gold (10 000 copper = 1 gold)                                             | User decision                                                                      | y          |
| Storage                      | One signed 64-bit total of copper per player; denominations are derived on read                                 | No rounding or carry bugs; gold is unbounded in practice (about 9.2e14 gold)       | n          |
| Drop table                   | Config `app.wallet.drop-table`: a list of `{ level, min-copper, max-copper, kill-interval-ms }`; ships with `{ 1, 1, 5, 1500 }` | User decision: parameterized drops for stronger monsters later                     | y          |
| Level in the API             | Queues, kills and accepted counts are objects keyed by the level as a string, e.g. `{ "1": [...] }`             | User decision: later levels need config and a game change, not an API break        | y          |
| Drop amount                  | Uniform integer from `min-copper` to `max-copper` of the level, both inclusive                                  | User decision (level 1: 1 to 5 copper)                                             | y          |
| Who rolls                    | The server, ahead of time, into a stored queue of 20 values per level                                           | User decision; the client cannot pick its amount, no request per kill              | y          |
| Endpoints                    | `GET /wallet` and `POST /wallet/sync`, both owned by the token's `sub`                                          | No user id in the path, so a player cannot read or credit another wallet           | n          |
| Kill allowance               | One token bucket per player and level: starts at 20, +1 per `kill-interval-ms` elapsed, max 20; each accepted kill spends 1 | Level 1: a monster takes 10 clicks plus 1.5 s of death and respawn, so 1500 ms is the fastest honest rate | n |
| Excess kills                 | Discarded silently; the response reports how many were accepted per level                                       | A lying client gains nothing, an honest client with clock drift is not punished    | n          |
| Table changes between restarts | Stored queue values outside the level's new range are discarded and re-rolled when the queue is next read; a level missing from the table is ignored and its stored queue left untouched | Changing a range must not leave stale amounts in play | n |
| Invalid table                | Startup fails, naming the bad entry (empty table, non-positive level, duplicate level, `min-copper` < 1, `max-copper` < `min-copper`, `kill-interval-ms` < 1) | Same fail-fast rule as `JWT_SECRET`; a bad table must not reach production | n |
| Wallet creation              | Lazily on the first `GET /wallet`; existing users need no migration                                             | Matches Hibernate `ddl-auto: update` schema management                             | n          |
| Overflow                     | Total copper clamps at `Long.MAX_VALUE`                                                                         | Unreachable in play; avoids a negative wallet                                      | n          |
| Concurrent syncs             | Serialized per player with a database row lock                                                                  | Two tabs must not credit the same queued value twice                               | n          |
| Unsynced kills on tab close  | Lost if the game never sends the sync                                                                           | Best-effort sync on scene exit; hard guarantees need a request per kill            | n          |
| Cheating limit               | A client can still claim kills it did not make, up to the allowance; this is logged as a known limitation       | Verifying kills needs server-side combat, out of scope                             | y          |
| Error codes                  | `WALLET_INVALID_KILLS` (malformed body or count) and `WALLET_UNKNOWN_LEVEL` (level not in the table), both HTTP 400, same ProblemDetail shape as `ApiExceptionHandler` | Follows the existing `USER_*` / `LOGIN_*` / `AUTH_*` convention | n |
| Wallet on user deletion      | The wallet row is deleted with the user                                                                         | No orphan data                                                                     | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Read the wallet and the drop queues ⭐ MVP

**User Story**: As the game, I want the player's saved wallet and the next drops in one request so that the player sees their coins and kills need no request.

**Why P1**: Everything else depends on it.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `GET /wallet` THEN the backend SHALL respond 200 with `{ wallet: { gold, silver, copper }, drops: { "<level>": [...] } }` holding one entry per level of the drop table, each with exactly 20 integers from that level's `min-copper` to `max-copper`.  <!-- event-driven -->
2. WHEN a player with no wallet calls `GET /wallet` THEN the backend SHALL create a wallet with 0 copper, and for each level an allowance of 20 and a queue of 20 rolled drops, and respond with gold 0, silver 0, copper 0.  <!-- event-driven -->
3. The backend SHALL derive the wallet from the stored copper total T as copper = T mod 100, silver = (T div 100) mod 100, gold = T div 10 000, with no upper bound on gold other than the 64-bit range of T.  <!-- ubiquitous -->
4. WHEN `GET /wallet` is called twice with no sync in between THEN the backend SHALL return the same drops in the same order for every level.  <!-- event-driven -->
5. IF the request carries no valid access token THEN the backend SHALL respond 401 with code `AUTH_UNAUTHENTICATED`.  <!-- unwanted-behavior -->
6. The backend SHALL read and write only the wallet of the access token's `sub`.  <!-- ubiquitous -->

**Independent Test**: Log in, call `GET /wallet`, see zero coins and 20 values from 1 to 5 under level `"1"`; call it again and see the same list.

---

### P1: Drops come from a configurable table ⭐ MVP

**User Story**: As the developer, I want each monster level's drop range and kill rate in configuration so that stronger monsters drop more without code changes.

**Why P1**: This is what makes the drop parameterized.

**Acceptance Criteria**:

1. The backend SHALL read the drop table from `app.wallet.drop-table`, one entry per monster level with `min-copper`, `max-copper` and `kill-interval-ms`, and ship with level 1 as 1, 5 and 1500.  <!-- ubiquitous -->
2. WHEN the backend rolls a drop for level L THEN it SHALL pick a uniform integer from L's `min-copper` to `max-copper`, both inclusive.  <!-- event-driven -->
3. WHEN the allowance of level L grows THEN the backend SHALL add 1 per L's `kill-interval-ms` elapsed, up to 20.  <!-- event-driven -->
4. WHEN a stored queue holds a value outside its level's current range THEN the backend SHALL discard the queue and roll a new one before returning or crediting it.  <!-- event-driven -->
5. IF the drop table is empty, has a duplicate or non-positive level, a `min-copper` below 1, a `max-copper` below `min-copper`, or a `kill-interval-ms` below 1 THEN the backend SHALL refuse to start and name the invalid entry.  <!-- unwanted-behavior -->

**Independent Test**: Set level 1 to `min-copper` 10 and `max-copper` 12, restart, call `GET /wallet` and see only 10, 11 and 12; set `max-copper` below `min-copper` and see the startup failure.

---

### P1: Credit kills in batches ⭐ MVP

**User Story**: As the game, I want to report my kills in one request so that the server credits the coins it rolled without a request per kill.

**Why P1**: This is the drop itself.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `POST /wallet/sync` with `{ kills: { "<level>": n, ... } }` THEN the backend SHALL accept, per level, min(n, allowance of that level at that moment).  <!-- event-driven -->
2. WHEN k kills of a level are accepted THEN the backend SHALL add the first k values of that level's stored queue to the copper total and remove them from the queue.  <!-- event-driven -->
3. WHEN k kills of a level are accepted THEN the backend SHALL subtract k from that level's allowance and roll new values to refill its queue to 20.  <!-- event-driven -->
4. WHEN the sync completes THEN the backend SHALL respond 200 with `{ wallet, accepted: { "<level>": k, ... }, drops }`, where `drops` holds the queues of all levels after the refill.  <!-- event-driven -->
5. WHEN n exceeds the accepted count of a level THEN the backend SHALL discard the excess kills and respond 200 with `accepted` below n for that level.  <!-- event-driven -->
6. WHEN `kills` is empty or every count is 0 THEN the backend SHALL respond 200 with every accepted count 0 and leave the wallet, queues and allowances unchanged.  <!-- event-driven -->
7. IF `kills` is missing, is not an object, or any count is missing, not an integer or negative THEN the backend SHALL respond 400 with code `WALLET_INVALID_KILLS` and change nothing.  <!-- unwanted-behavior -->
8. IF `kills` names a level that is not in the drop table THEN the backend SHALL respond 400 with code `WALLET_UNKNOWN_LEVEL` and credit nothing, including the other levels of the request.  <!-- unwanted-behavior -->
9. IF the new copper total would exceed `Long.MAX_VALUE` THEN the backend SHALL store `Long.MAX_VALUE`.  <!-- unwanted-behavior -->
10. WHILE two syncs for the same player run at the same time the backend SHALL process them one after the other, crediting each queued value at most once.  <!-- state-driven -->
11. IF the request carries no valid access token THEN the backend SHALL respond 401 with code `AUTH_UNAUTHENTICATED`.  <!-- unwanted-behavior -->
12. WHEN a sync completes THEN the backend SHALL log the username and, per level, the requested and accepted kills at INFO, and at WARN when kills were discarded.  <!-- event-driven -->

**Independent Test**: Read the wallet, sync `{ kills: { "1": 3 } }`, see the wallet grow by the sum of the first 3 drops and a queue that moved up by 3; sync `{ kills: { "1": 500 } }` immediately and see `accepted` at most 17 for level 1.

---

### P2: Wallet follows the account

**User Story**: As the system, I want wallets removed with their account so that no data is left behind.

**Why P2**: Housekeeping; no player is blocked without it.

**Acceptance Criteria**:

1. WHEN a user is deleted THEN the backend SHALL delete that user's wallet.  <!-- event-driven -->
2. WHERE a user existed before this feature the backend SHALL create their wallet on the first `GET /wallet` and need no data migration.  <!-- optional-feature -->

**Independent Test**: Delete a user who has a wallet; the wallet row is gone.

---

## Edge Cases

- WHEN a player syncs after a long idle period THEN the backend SHALL accept at most 20 kills per level, because the allowance and the queue are both capped at 20.
- IF the access token is valid but its user no longer exists THEN the backend SHALL respond 404 with code `USER_NOT_FOUND` on `GET /wallet` and `POST /wallet/sync` and create no wallet.
- WHEN a sync arrives with 20 kills for a level whose allowance and queue are full THEN the backend SHALL credit all 20 and respond with a fresh queue of 20.

---

## Requirement Traceability

| Requirement ID | Story                       | Phase | Status  |
| -------------- | --------------------------- | ----- | ------- |
| WAL-01         | P1: Read the wallet         | -     | Verified |
| WAL-02         | P1: Read the wallet         | -     | Verified |
| WAL-03         | P1: Read the wallet         | -     | Verified |
| WAL-04         | P1: Read the wallet         | -     | Verified |
| WAL-05         | P1: Read the wallet         | -     | Verified |
| WAL-06         | P1: Read the wallet         | -     | Verified |
| WAL-07         | P1: Configurable table      | -     | Verified |
| WAL-08         | P1: Configurable table      | -     | Verified |
| WAL-09         | P1: Configurable table      | -     | Verified |
| WAL-10         | P1: Configurable table      | -     | Verified |
| WAL-11         | P1: Configurable table      | -     | Verified |
| WAL-12         | P1: Credit kills            | -     | Verified |
| WAL-13         | P1: Credit kills            | -     | Verified |
| WAL-14         | P1: Credit kills            | -     | Verified |
| WAL-15         | P1: Credit kills            | -     | Verified |
| WAL-16         | P1: Credit kills            | -     | Verified |
| WAL-17         | P1: Credit kills            | -     | Verified |
| WAL-18         | P1: Credit kills            | -     | Verified |
| WAL-19         | P1: Credit kills            | -     | Verified |
| WAL-20         | P1: Credit kills            | -     | Verified |
| WAL-21         | P1: Credit kills            | -     | Verified |
| WAL-22         | P1: Credit kills            | -     | Verified |
| WAL-23         | P1: Credit kills            | -     | Verified |
| WAL-24         | P2: Wallet follows account  | -     | Verified |
| WAL-25         | P2: Wallet follows account  | -     | Verified |

**Coverage:** 25 total, 25 verified

---

## Success Criteria

- [ ] `GET /wallet` then `POST /wallet/sync` credits exactly the sum of the queued values the server returned.
- [ ] Changing level 1's `min-copper` and `max-copper` in configuration and restarting changes the drops with no code change.
- [ ] A client that syncs `{ kills: { "1": 1000 } }` in a loop gains at most 1 kill per 1500 ms after the first 20.
- [ ] Backend unit and integration tests cover WAL-01 to WAL-25.
