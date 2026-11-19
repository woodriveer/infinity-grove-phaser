# ADR 0014: Miniboss adds (one row per add, seeded by migration and seeder)

- Status: Accepted
- Date: 2026-11-19

## Context

From chapter 11 a miniboss fights with 2 adds that raise its one defense while they live (spec `miniboss-adds`, `AD-021`). The game needs, for each stage, how many adds the miniboss has, the health of each and the defense points each one adds. Combat runs in the browser (`AD-002`), so the server only stores and serves these numbers.

## Decision

**One row per add.** `stage_adds(id, stage_id, slot, hit_points, defense_buff)` in `V13__miniboss_adds.sql`. The id is `chapter/stage/slot` (for example `11/1/1`). Checks: `slot` between 1 and 2, `hit_points` at least 1, `defense_buff` between 0 and 90. `(stage_id, slot)` is unique (`uk_stage_adds_stage_slot`). `stage_id` references `stages(id)` with `on delete restrict` (`AD-010`), so a stage with adds cannot be deleted by accident. A stage of chapters 1 to 10 has no row.

**Seeded twice, because a stored chapter is never overwritten.** The migration inserts the two adds of every stored stage of chapters 11 to 15, with the buff of the chapter (30, 35, 40, 45 and 50) and 3 times the phase monster health the stage holds now (`on conflict do nothing`, so the file can run again and keeps a value tuned in the database). `ChapterSeeder` writes the adds of a chapter it seeds from `ChapterDefinition.of`, whose stages carry `adds` (`ChapterDefinition.addsOf`). `ChapterRepository.save` replaces the adds of a chapter: rows of a slot the new chapter no longer has are deleted, the others are written over.

**Payloads.** `StageResponse.adds` (`[{ health, defenseBuff }]`, empty for chapters 1 to 10) in `GET /progress`, `POST /progress/outcome` and `GET /farm`, which share `ChapterResponse`.

## Expand only

`V13` creates a table and an index and inserts only into that table, so the previous backend keeps starting and serving on the migrated database (`AD-016`). It never reads `stage_adds`. `PreviousBackendCompatibilityIT` pins this with V12 as the last migration of the previous release and V13 as the one future migration. Either deploy order is safe: a game that finds no `adds` in a stage plays it without adds.

## Consequences

- The server never sees an add, a target or an add kill. The guarded defense (the miniboss's defense plus the buffs of the living adds, at most 90) and the target are game rules.
- Tuning an add is a row update: its health in `hit_points`, its buff in `defense_buff`. A tuned row survives a re-run of the migration and a restart (the seeder never overwrites a stored chapter).
- Chapters 11 to 15 hold 100 rows (2 adds on each of 50 stages).
- A hit point total above 2^31 fits (`bigint`), as the other health columns do.
