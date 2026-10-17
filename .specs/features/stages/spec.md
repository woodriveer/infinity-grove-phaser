# Stages Specification

## Problem Statement

The game has one endless level 1 monster and no sense of progress. This feature adds a campaign: a chapter has 10 stages, each stage has 5 phases (one monster per phase) followed by a miniboss that must die within 30 s, and after stage 10 the chapter boss must die within 60 s. The stage definitions (health, time limits) live in the database, and each player's current position is saved in the database on every phase advance, so a reload resumes exactly where the player stopped. Only chapter 1 exists; beating its boss ends the game for now.

## Goals

- [x] A player advances phase 1 to 5, then the miniboss, through stage 10, then the chapter boss, and the game ends with a completion message.
- [x] A boss that is not killed in time sends the player back to phase 5 of the same stage, with no other loss.
- [x] The position is stored per player in the database and a reload resumes at the same phase, stage or boss.
- [x] Health and time limits come from the database; the game holds no stage numbers except the display of what the backend sends.

## Out of Scope

| Feature                                                    | Reason                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Chapters 2 and above                                       | Decided: the game ends after the chapter 1 boss                     |
| New art, animations or music for minibosses and bosses     | The red rectangle monster stays for every encounter |
| Stage-specific drops, boss rewards, drop rules for new levels | Every chapter 1 monster keeps level 1 and the existing level 1 drop table |
| Damage upgrades, characters, skills                        | Later features; damage stays 1 per click                            |
| An admin screen or API to edit definitions                 | Definitions are edited directly in the database                     |
| Server-side enforcement of the boss timers                 | The client owns combat (AD-002); the server guards transitions only |
| Replaying cleared stages, stage select                     | Position only moves forward, or back to phase 5 after a failed boss |

---

## Assumptions & Open Questions

| Assumption / decision        | Chosen default                                                                                                                              | Rationale                                                                 | Confirmed? |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| Definitions in the database  | Tables `chapters` and `stages`; the backend seeds chapter 1 at startup when it is missing                                                  | User decision                                                             | y          |
| Failed boss                  | The player returns to phase 5 of the same stage and keeps playing; clearing that phase leads to the miniboss of that stage again           | User decision (back to phase 5 and try again)                             | y          |
| Failed chapter boss          | Back to phase 5 of stage 10; clearing it leads to the stage 10 miniboss and then the chapter boss again                                     | Same rule as a miniboss, no extra stored state                            | n          |
| Save moment                  | Every position change is reported to the backend as it happens (phase cleared, boss cleared, boss failed)                                      | User decision                                                             | y          |
| End of the game              | After the chapter boss the progress is `completed`; the game shows a completion message and stops spawning monsters                        | User decision                                                             | y          |
| Definition payload           | Every progress answer (200 and 409) carries the whole chapter definition, 10 small stage rows                                              | The game advances before the server answers and so needs the next encounter's health, and the HUD needs the stage and phase counts | y |
| Position model               | `chapter`, `stage` (1..10), `encounter` (`PHASE`, `MINIBOSS`, `CHAPTER_BOSS`), `phase` (1..5, meaningful for `PHASE`), `completed`          | Small, explicit state machine the server can guard                        | n          |
| Phases per stage             | Column `phases_per_stage` on the stage, 5 in the seed                                                                                      | The rule of 5 stays data, not code                                        | n          |
| Seed values                  | Phase monster health 10 + (stage - 1); miniboss health 5 × phase monster health, limit 30 000 ms; chapter boss health 300, limit 60 000 ms | Reachable with 1 damage per click (about 2 to 3 clicks/s for a miniboss, 5/s for the boss); tunable in the database | n |
| Monster level                | Every chapter 1 monster, bosses included, has level 1                                                                                       | Reuses the existing drop table without a new rule                         | n          |
| Report protocol              | One endpoint, `POST /progress/outcome { chapter, stage, encounter, phase, outcome }` with `outcome` `CLEARED` or `FAILED`; the position is the one being left and the server applies the transition only if it matches the stored position | Idempotent: a retried report cannot advance twice; the client never names the destination, so it cannot jump ahead | y |
| Architecture                 | Stage rules live in a pure `campaign` domain module; the sync queue is an application service that receives its ports by injection; the scene only draws and forwards input (game ADR 0007) | User decision: hexagonal, modular game; the existing wallet and auth code is refactored to the same shape before the stage code builds on it | y |
| Conflict answer              | A report that does not match is answered `409` with the stored progress in the body, and nothing changes                                   | Lets the game realign after a lost report or a second tab                 | n          |
| Optimistic play              | The game moves to the next position at once and sends reports in order, one in flight at a time                                            | No wait between phases                                                    | n          |
| Boss timer                   | Scene clock (`this.time`), counts down in whole seconds from the limit, starts when the boss appears                                       | Same clock as the other timers; not enforced by the server                | n          |
| Load failure                 | No monster spawns until `GET /progress` succeeds; retried every 10 000 ms                                                                  | The game holds no stage data to fall back on                              | n          |
| Reload during a boss         | The boss restarts with a full timer and full health                                                                                         | Only the position is stored, not the fight                                | n          |
| Supersedes                   | The fixed 10-health monster of `clicker-combat`/`monster-death` is replaced by the health sent by the backend; respawn fade and delay stay | Stages need variable health                                               | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: The backend stores definitions and moves the player ⭐ MVP

**User Story**: As a player, I want my place in the campaign saved so that I resume where I stopped.

**Why P1**: The campaign has no meaning without stored progress and rules the client cannot bend.

**Acceptance Criteria**:

1. The backend SHALL store each chapter's boss health and boss time limit in ms, and each stage's number, phases per stage, phase monster health, miniboss health and miniboss time limit in ms, in the database.  <!-- ubiquitous -->
2. WHEN the backend starts and chapter 1 is missing THEN it SHALL seed chapter 1 with 10 stages of 5 phases, miniboss limit 30 000 ms and chapter boss limit 60 000 ms, with the health values of the Assumptions table.  <!-- event-driven -->
3. WHEN `GET /progress` is called by a player with no progress THEN the backend SHALL create it at chapter 1, stage 1, `PHASE`, phase 1, not completed.  <!-- event-driven -->
4. WHEN `GET /progress` is called THEN the backend SHALL answer 200 with `chapter`, `stage`, `encounter`, `phase`, `completed` and the definition of the player's chapter: `bossHealth`, `bossTimeLimitMs` and, for every stage, `number`, `phasesPerStage`, `monsterHealth`, `minibossHealth` and `minibossTimeLimitMs`.  <!-- event-driven -->
5. WHEN `POST /progress/outcome` carries `CLEARED` and the stored position and the encounter is `PHASE` with phase below the stage's `phases_per_stage` THEN the backend SHALL store phase + 1 and answer the new progress.  <!-- event-driven -->
6. WHEN `POST /progress/outcome` carries `CLEARED` and the stored position and the encounter is `PHASE` at the last phase THEN the backend SHALL store `MINIBOSS` for the same stage.  <!-- event-driven -->
7. WHEN `POST /progress/outcome` carries `CLEARED` and the stored position and the encounter is `MINIBOSS` of a stage below 10 THEN the backend SHALL store `PHASE` 1 of the next stage.  <!-- event-driven -->
8. WHEN `POST /progress/outcome` carries `CLEARED` and the stored position and the encounter is `MINIBOSS` of stage 10 THEN the backend SHALL store `CHAPTER_BOSS`.  <!-- event-driven -->
9. WHEN `POST /progress/outcome` carries `CLEARED` and the stored position and the encounter is `CHAPTER_BOSS` THEN the backend SHALL store `completed` true.  <!-- event-driven -->
10. WHEN `POST /progress/outcome` carries `FAILED` and the stored position and the encounter is `MINIBOSS` or `CHAPTER_BOSS` THEN the backend SHALL store `PHASE`, phase 5 of the same stage.  <!-- event-driven -->
11. IF an outcome report carries a position that differs from the stored one THEN the backend SHALL answer 409 with the stored progress and change nothing.  <!-- unwanted-behavior -->
12. IF `POST /progress/outcome` carries `FAILED` while the stored encounter is `PHASE` THEN the backend SHALL answer 409 with the stored progress and change nothing.  <!-- unwanted-behavior -->
13. WHILE the stored progress is completed the backend SHALL answer 409 with the stored progress to every outcome report and change nothing.  <!-- state-driven -->
14. IF a request to `/progress` carries no valid access token THEN the backend SHALL answer 401, and every request SHALL read and write only the progress of the token's player.  <!-- unwanted-behavior -->
15. WHEN two reports with the same position reach the backend for one player at the same time THEN exactly one SHALL apply and the other SHALL get 409.  <!-- event-driven -->

**Independent Test**: With a fresh player call `GET /progress` (stage 1 phase 1), report `CLEARED` for 5 phases and the miniboss and see stage 2 phase 1; report `FAILED` for a boss and see phase 5; repeat a clear and get 409.

---

### P1: The player fights through stages and bosses ⭐ MVP

**User Story**: As a player, I want phases, a timed miniboss and a timed chapter boss so that the fights build up to something.

**Why P1**: The visible core of the request.

**Acceptance Criteria**:

1. WHEN `ClickerGame` starts THEN the game SHALL call `GET /progress` and spawn the monster of the returned encounter with the health its stage or chapter definition gives.  <!-- event-driven -->
2. WHILE progress is loaded the game SHALL show an HTML text with the position: `Stage S/10  Phase P/5`, `Stage S/10  Miniboss` or `Chapter Boss`.  <!-- state-driven -->
3. WHEN a `PHASE` monster dies THEN the game SHALL move to the next position of the stage rules and, after the existing death fade and respawn delay, spawn the next encounter with its health.  <!-- event-driven -->
4. WHEN a miniboss or chapter boss spawns THEN the game SHALL show a countdown in whole seconds starting at its `timeLimitMs`.  <!-- event-driven -->
5. WHEN a boss dies before its countdown reaches 0 THEN the game SHALL stop the countdown and move to the next position of the stage rules.  <!-- event-driven -->
6. IF a boss countdown reaches 0 while the boss is alive THEN the game SHALL remove the boss, hide the countdown and, after the respawn delay, spawn the phase 5 monster of the same stage.  <!-- unwanted-behavior -->
7. WHEN the chapter boss dies in time THEN the game SHALL show a completion message, spawn no monster and ignore clicks.  <!-- event-driven -->
8. WHEN a monster, boss included, dies THEN the game SHALL take its drop exactly as before, for level 1.  <!-- event-driven -->

**Independent Test**: Start fresh, kill 5 monsters and see the text count `Stage 1/10  Phase 1/5` to `Phase 5/5`, then a miniboss with a 30 s countdown; let it expire and see phase 5 again; kill it in time and see stage 2 phase 1.

---

### P1: The game saves and recovers position ⭐ MVP

**User Story**: As a player, I want progress to survive reloads and failed requests so that I never lose a stage.

**Why P1**: Without it the campaign resets on reload.

**Acceptance Criteria**:

1. WHEN the position changes THEN the game SHALL queue one outcome report (`CLEARED` or `FAILED`) carrying the position it left, and SHALL send queued reports in order with at most one request in flight.  <!-- event-driven -->
2. IF a report fails with a network or server error THEN the game SHALL keep it at the head of the queue, keep playing, and retry at the next 10 000 ms tick.  <!-- unwanted-behavior -->
3. WHEN a report is answered 409 THEN the game SHALL drop its queued reports, replace its local position with the returned progress and respawn that encounter.  <!-- event-driven -->
4. IF `GET /progress` fails THEN the game SHALL show "Could not load progress", spawn no monster and retry at each 10 000 ms tick until it succeeds.  <!-- unwanted-behavior -->
5. WHEN the page is reloaded THEN the game SHALL resume at the stored position, with a full-health encounter and, for a boss, a full countdown.  <!-- event-driven -->

**Independent Test**: Kill 3 monsters, reload and see phase 4 of stage 1; with the progress call failing, play continues and the queued reports arrive in order once it recovers.

---

## Edge Cases

- WHEN a player is on `PHASE` 5 after a failed boss and kills it THEN the game SHALL spawn the miniboss of that stage again with a full countdown.
- IF the countdown reaches 0 in the same frame the boss reaches 0 health THEN the kill SHALL win, because health is checked on the click that dealt the damage.
- WHEN the scene shuts down with reports still queued THEN the game SHALL make one best-effort attempt to send them in order and not retry, like the wallet sync on exit.
- WHEN a user is deleted THEN the backend SHALL delete that user's progress and leave other players' progress, as it does for the wallet.
- WHEN the player has the game open in two tabs THEN the older tab's next report SHALL get 409 and realign to the stored position.

---

## Requirement Traceability

| Requirement ID | Story                           | Phase | Status  |
| -------------- | ------------------------------- | ----- | ------- |
| STG-01         | P1: Backend stores and moves    | -     | Verified |
| STG-02         | P1: Backend stores and moves    | -     | Verified |
| STG-03         | P1: Backend stores and moves    | -     | Verified |
| STG-04         | P1: Backend stores and moves    | -     | Verified |
| STG-05         | P1: Backend stores and moves    | -     | Verified |
| STG-06         | P1: Backend stores and moves    | -     | Verified |
| STG-07         | P1: Backend stores and moves    | -     | Verified |
| STG-08         | P1: Backend stores and moves    | -     | Verified |
| STG-09         | P1: Backend stores and moves    | -     | Verified |
| STG-10         | P1: Backend stores and moves    | -     | Verified |
| STG-11         | P1: Backend stores and moves    | -     | Verified |
| STG-12         | P1: Backend stores and moves    | -     | Verified |
| STG-13         | P1: Backend stores and moves    | -     | Verified |
| STG-14         | P1: Backend stores and moves    | -     | Verified |
| STG-15         | P1: Backend stores and moves    | -     | Verified |
| STG-16         | P1: Fights                      | -     | Verified |
| STG-17         | P1: Fights                      | -     | Verified |
| STG-18         | P1: Fights                      | -     | Verified |
| STG-19         | P1: Fights                      | -     | Verified |
| STG-20         | P1: Fights                      | -     | Verified |
| STG-21         | P1: Fights                      | -     | Verified |
| STG-22         | P1: Fights                      | -     | Verified |
| STG-23         | P1: Fights                      | -     | Verified |
| STG-24         | P1: Saves and recovers          | -     | Verified |
| STG-25         | P1: Saves and recovers          | -     | Verified |
| STG-26         | P1: Saves and recovers          | -     | Verified |
| STG-27         | P1: Saves and recovers          | -     | Verified |
| STG-28         | P1: Saves and recovers          | -     | Verified |

**Coverage:** 28 total, 28 verified

---

## Success Criteria

- [x] A fresh player plays phases 1 to 5, the miniboss, and reaches stage 2; a reload shows the same position.
- [x] Letting a boss countdown expire returns the player to phase 5 of that stage.
- [x] Beating the chapter boss shows the completion message and the stored progress is completed.
- [x] Changing a health or time limit value in the database changes the fight with no game change.
- [x] The wallet and auth code is refactored to ADR 0007 with their existing tests passing and no behavior change, before any stage code builds on it.
- [x] Backend tests and `npm test` pass with tests covering STG-01 to STG-28, and one Playwright scenario covers phases, a failed boss and a reload.
