# Drops Specification

## Problem Statement

Killing the monster gives the player nothing. The first monster level should drop 1 to 5 copper coins that fly to a wallet in the corner of the screen, and the wallet must survive reloads. The `wallet` feature (backend) stores the coins and hands the game a queue of pre-rolled drops per monster level; this feature consumes the queue of the killed monster's level, animates the coins, and reports kills per level to the backend in batches so there is no request per kill. The drop range itself lives in the backend drop table, so stronger monsters can drop more later without a game change beyond giving the monster its level.

## Goals

- [ ] A kill shows coins flying from the monster to the wallet text, which grows by the drop value (1 to 5 copper for the level 1 monster).
- [ ] 100 copper show as 1 silver and 100 silver as 1 gold; gold keeps growing with no cap.
- [ ] The wallet is loaded when the scene starts and matches the backend after a reload.
- [ ] Kills reach the backend at most once every 10 s per player, and a failed request never interrupts play.
- [ ] The game holds no drop amounts or ranges; it plays whatever values the backend sends for the monster's level.

## Out of Scope

| Feature                                        | Reason                                                       |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Storing and rolling drops, the drop table, the kill allowance | Covered by the `wallet` feature               |
| Monsters of level 2 and above (art, health, spawning) | Only the level 1 monster exists                        |
| Spending coins, shop, inventory                | Later features                                               |
| Coin sound, particles, pickup effects          | Later polish                                                 |
| Click-to-collect coins                         | Decided: coins are collected automatically                   |
| Capping the number of coin sprites per drop    | Revisit when a level can drop more than 10 copper            |
| Hard guarantee for kills made just before closing the tab | Sync on scene exit is best effort                 |

Supersedes the `clicker-combat` criteria "no coins or score" (goal and the scene-contents criterion) and the `monster-death` out-of-scope row "Rewards, score, drops". Its other criteria stay valid.

---

## Assumptions & Open Questions

| Assumption / decision        | Chosen default                                                                                                         | Rationale                                                           | Confirmed? |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| Collection                   | Coins fly to the wallet text and are added on arrival                                                                  | User decision                                                       | y          |
| Wallet display               | HTML text in the top-left corner: `Gold: G  Silver: S  Copper: C`, all three always shown                              | User decision; real DOM text keeps it testable (ADR 0004)           | y          |
| Persistence                  | Backend, through `GET /wallet` and `POST /wallet/sync` of the `wallet` feature                                         | User decision                                                       | y          |
| Load time                    | `GET /wallet` when `ClickerGame` starts                                                                                | User decision                                                       | y          |
| Failure behavior             | Play continues; unreported kills are kept and retried at the next tick                                                 | User decision (client fallback, later sync)                         | y          |
| Parameterized drops          | The range lives in the backend drop table; the game only reads queues keyed by monster level and sends kills keyed by level | User decision                                                  | y          |
| Monster level                | The `Monster` carries a `level`, 1 for the only monster; the killed monster's level picks the queue and the kill key   | A stronger monster later sets another level                         | n          |
| Sync cadence                 | Every 10 000 ms while there are unreported kills and no request is in flight, plus once when the scene shuts down      | One request per player per 10 s at most; kills per 10 s stay under the server allowance | n |
| Coin count                   | One coin sprite per copper of the drop (a drop of 3 spawns 3 coins)                                                    | Matches "1 to 5 copper coins"; revisit for bigger drops             | n          |
| Coin visuals                 | `coin` atlas sprite playing the existing `rotate` animation, spawned at the monster center (700, 500)                   | Asset and animation already exist                                   | n          |
| Coin flight                  | 600 ms tween to the wallet text center, each coin started 100 ms after the previous                                    | Readable, short                                                     | n          |
| Wallet arithmetic            | The game adds copper on each landing and carries 100 copper to silver and 100 silver to gold                           | The display matches the backend rule                                | n          |
| Reported kills               | Only kills that took a drop from the queue are counted, per level                                                      | The display and the credit stay in step                             | n          |
| Number precision             | Gold is a JavaScript number; precision is exact up to 2^53, far beyond play                                            | Avoids BigInt plumbing for an unreachable range                     | n          |
| Wallet before it loads       | Text hidden, kills drop nothing, `GET /wallet` retried every 10 s until it succeeds                                    | No wrong zero shown; kills made while offline are not rewarded      | n          |
| Empty local queue            | A kill drops nothing until the next sync refills the queue                                                             | The queue is the only source of values                              | n          |
| Level missing from `drops`   | Treated as an empty queue                                                                                              | A level the backend does not know cannot drop                       | n          |
| 401 handling                 | Existing `httpClient` refresh-and-retry applies unchanged                                                              | Persistent-session behavior                                         | y          |
| Two tabs                     | Each tab shows its own optimistic wallet and snaps to the backend total on its next sync                               | The backend is the single source of truth                           | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Coins drop and fly to the wallet ⭐ MVP

**User Story**: As a player, I want coins to drop when I kill the monster and fly to my wallet so that kills feel rewarding.

**Why P1**: Core of the request.

**Acceptance Criteria**:

1. WHEN `ClickerGame` starts THEN the game SHALL call `GET /wallet` and keep the returned wallet and the drop queues per level.  <!-- event-driven -->
2. WHEN the wallet has loaded THEN the game SHALL show an HTML text in the top-left corner reading `Gold: G  Silver: S  Copper: C` for the wallet values.  <!-- event-driven -->
3. The game SHALL give each monster a level, 1 for the only monster.  <!-- ubiquitous -->
4. WHEN the monster's health reaches 0 and the local queue of the monster's level is not empty THEN the game SHALL take the first value v from that queue and spawn v coin sprites at the monster center.  <!-- event-driven -->
5. WHEN coins spawn THEN the game SHALL tween each coin to the wallet text over 600 ms, starting each coin 100 ms after the previous one.  <!-- event-driven -->
6. WHEN a coin reaches the wallet text THEN the game SHALL add 1 copper to the displayed wallet, destroy the coin and refresh the text.  <!-- event-driven -->
7. WHEN the displayed copper reaches 100 THEN the game SHALL show 1 more silver and 0 copper, and WHEN silver reaches 100 THEN it SHALL show 1 more gold and 0 silver.  <!-- event-driven -->
8. IF the wallet has not loaded or the local queue of the monster's level is empty or missing THEN the game SHALL spawn no coins and leave the wallet unchanged on a kill.  <!-- unwanted-behavior -->
9. The game SHALL show no cap on gold.  <!-- ubiquitous -->

**Independent Test**: Start the game with a wallet of 0, kill the monster, see 1 to 5 coins fly to the corner and the copper count grow by that number; with a wallet of 99 copper and a drop of 2, see 1 silver and 1 copper.

---

### P1: Kills sync with the backend ⭐ MVP

**User Story**: As a player, I want my coins saved so that they are there after a reload.

**Why P1**: Without it the wallet resets on reload.

**Acceptance Criteria**:

1. WHEN 10 000 ms pass, kills with drops are unreported and no sync is in flight THEN the game SHALL call `POST /wallet/sync` with `kills` mapping each level to its unreported count.  <!-- event-driven -->
2. WHILE a sync is in flight the game SHALL start no other sync.  <!-- state-driven -->
3. WHEN a sync succeeds THEN the game SHALL subtract the sent counts from the unreported counts, set its base wallet to the response wallet, and replace each local queue with the response `drops` of that level minus the first m values, where m is the number of drops of that level taken since the request was sent.  <!-- event-driven -->
4. WHEN a sync succeeds THEN the game SHALL display the response wallet plus every drop whose coins have landed and that the response does not cover.  <!-- event-driven -->
5. IF a sync fails THEN the game SHALL keep the unreported counts and the local queues, keep playing, and retry at the next tick.  <!-- unwanted-behavior -->
6. IF `GET /wallet` fails THEN the game SHALL show no wallet text, drop nothing and retry the call at each 10 000 ms tick until it succeeds.  <!-- unwanted-behavior -->
7. WHEN the scene shuts down and kills with drops are unreported THEN the game SHALL send one `POST /wallet/sync` and not retry it.  <!-- event-driven -->

**Independent Test**: Kill the monster 3 times, wait 10 s, see one `POST /wallet/sync` with `kills: { "1": 3 }`; reload and see the same wallet.

---

## Edge Cases

- WHEN the monster is killed while a sync is in flight THEN the game SHALL count that kill as unreported for the next sync, not the current one.
- WHEN the player is not logged in or the session is gone THEN the existing `httpClient` behavior applies and the game SHALL keep playing without a wallet.
- WHEN the scene shuts down while coins are flying THEN the game SHALL drop the coins without error; their kills were already counted for the next sync.
- WHEN the backend returns a drop of more than 5 copper THEN the game SHALL spawn that many coins and add that many copper, because it holds no drop range of its own.

---

## Requirement Traceability

| Requirement ID | Story                      | Phase | Status  |
| -------------- | -------------------------- | ----- | ------- |
| DROP-01        | P1: Coins drop and fly     | -     | Pending |
| DROP-02        | P1: Coins drop and fly     | -     | Pending |
| DROP-03        | P1: Coins drop and fly     | -     | Pending |
| DROP-04        | P1: Coins drop and fly     | -     | Pending |
| DROP-05        | P1: Coins drop and fly     | -     | Pending |
| DROP-06        | P1: Coins drop and fly     | -     | Pending |
| DROP-07        | P1: Coins drop and fly     | -     | Pending |
| DROP-08        | P1: Coins drop and fly     | -     | Pending |
| DROP-09        | P1: Coins drop and fly     | -     | Pending |
| DROP-10        | P1: Kills sync             | -     | Pending |
| DROP-11        | P1: Kills sync             | -     | Pending |
| DROP-12        | P1: Kills sync             | -     | Pending |
| DROP-13        | P1: Kills sync             | -     | Pending |
| DROP-14        | P1: Kills sync             | -     | Pending |
| DROP-15        | P1: Kills sync             | -     | Pending |
| DROP-16        | P1: Kills sync             | -     | Pending |

**Coverage:** 16 total, 0 mapped to tasks, 16 unmapped ⚠️

---

## Success Criteria

- [ ] Killing the monster shows coins flying to the corner wallet, and the wallet equals the backend total after a reload.
- [ ] A session of many kills sends at most one sync per 10 s.
- [ ] Changing the level 1 range in the backend table changes the drops with no game change.
- [ ] `npm test` passes with unit tests covering DROP-01 to DROP-16, and one Playwright scenario covers kill, sync and reload.
