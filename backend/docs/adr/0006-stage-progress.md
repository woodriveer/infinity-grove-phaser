# ADR 0006: Stage progress (server state machine, database-defined stages)

- Status: Accepted
- Date: 2026-10-17

## Context

The game becomes a campaign: a chapter has 10 stages, each stage has 5 phases (one monster each) followed by a miniboss that must die within 30 s, and after stage 10 the chapter boss must die within 60 s. Health and time limits must be editable without a deploy, and each player's position must survive reloads. Combat runs in the browser, so the server cannot see a kill (ADR 0005, `AD-002`); it can only guard which moves are legal.

## Decision

**Definitions live in the database.** `chapters(number, boss_health, boss_time_limit_ms)` and `stages(id "chapter/number", chapter, number, phases_per_stage, monster_health, miniboss_health, miniboss_time_limit_ms)`. `ChapterDefinition` validates that stages are numbered 1..n and every value is positive. `ChapterSeeder` inserts chapter 1 at startup only when it is missing and never overwrites it, so values tuned in the database survive restarts. Seed: 5 phases per stage; phase monster health `10 + (stage - 1)`; miniboss health 5 times that, 30 000 ms; boss health 300, 60 000 ms. Hibernate `ddl-auto: update` creates the tables, as for the wallet.

**Position is a small state machine.** `progress(username, chapter, stage, encounter, phase, completed)` with `encounter` in `PHASE`, `MINIBOSS`, `CHAPTER_BOSS`. `phase` is 1 outside `PHASE` so positions compare with plain equality. The chapter boss sits at the last stage.

| Stored position                | `CLEARED`                                   | `FAILED`                        |
| ------------------------------ | ------------------------------------------- | ------------------------------- |
| `PHASE` below the last phase   | next phase                                  | conflict                        |
| `PHASE` last phase             | `MINIBOSS` of the stage                     | conflict                        |
| `MINIBOSS`, not the last stage | phase 1 of the next stage                   | last phase of the same stage    |
| `MINIBOSS`, last stage         | `CHAPTER_BOSS`                              | last phase of the same stage    |
| `CHAPTER_BOSS`                 | `completed = true`                          | last phase of the last stage    |
| `completed`                    | conflict                                    | conflict                        |

**One report endpoint.** `GET /progress` returns the position and the whole chapter definition (10 small rows), so the game can advance and draw its HUD without waiting for the server. `POST /progress/outcome { chapter, stage, encounter, phase, outcome }` reports `CLEARED` or `FAILED` from the position being left. The client never names the destination; the server derives it from the stored position and definition.

**Conflicts.** A report whose position differs from the stored one, a `FAILED` on a `PHASE`, and any report on a completed progress are answered 409 `PROGRESS_CONFLICT` with the stored progress in the `progress` property of the problem body, and change nothing. A retried report therefore cannot advance twice, and a second tab realigns on its next report. A malformed body is 400 `PROGRESS_INVALID_OUTCOME`.

**Concurrency.** `ProgressService` runs in one transaction and reads the row with `PESSIMISTIC_WRITE`; a missing row is created with `insert ... on conflict do nothing` followed by the locked read (same as ADR 0005). Of two simultaneous identical reports exactly one applies.

**Lifecycle.** Deleting a user deletes the user's progress. Definitions are never deleted by the application.

## Consequences

- Stage tuning is a SQL update; no deploy.
- The boss time limits are not enforced here. A client can report `CLEARED` for a boss it did not beat in time, or skip ahead one legal step per request. Closing that gap needs server-side combat, the same limitation as the wallet (`AD-002`).
- The rules exist twice, here and in the game's `Campaign` (so play never waits for the network). The server stays authoritative and a 409 corrects the game.
- Every progress answer carries the chapter definition (about 1 KB).
- Only chapter 1 exists. A second chapter needs a seed row and a rule for moving from the completed state of the previous one; until then `completed` is the end of the game.

## Alternatives considered

- **The client sends the destination position:** rejected; every rule would need both sides to agree on a destination and the server would have to validate arbitrary jumps.
- **`PUT /progress` with the full state:** rejected for the same reason; a bug or a cheat could write any position.
- **Two endpoints, `clear` and `fail`:** rejected; same body, the outcome is the only difference.
- **Stage values in `application.yaml` like the drop table:** rejected; the user asked for definitions editable in the database.
- **The server answers each report with only the next encounter:** rejected; the game would wait a round trip between phases and could not play offline.
