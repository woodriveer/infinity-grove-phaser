# ADR 0009: Normalized schema (Flyway migrations, foreign keys, enemy and drop rule catalogs)

- Status: Accepted
- Date: 2026-10-19

## Context

Hibernate `ddl-auto: update` built the schema (ADR 0005, 0006). It cannot drop a column, move data or add a constraint, so the database had no foreign keys: a `username`, `hero_id`, chapter or stage could point at a row that does not exist. `stages` repeated eight enemy columns per row and `chapters` four more, although the 50 phase monsters share 5 attribute sets. Copper drops came from one `app.wallet.drop-table` level in `application.yaml`, so every kill of the campaign paid 1 to 5 copper whatever the stage.

## Decision

**Flyway owns the schema.** `src/main/resources/db/migration/V1__schema.sql` creates every table; later changes are new `V<n>__*.sql` files, never edits of an applied one. Hibernate runs with `ddl-auto: validate`, so an entity that disagrees with the migrated schema stops the startup. The migration uses only PostgreSQL 16 SQL (docker runs 16, the tests run 17). Integration tests run the same migration on the Testcontainers database.

**Every reference is a foreign key.** The entities keep plain id columns and the repositories assemble the domain objects (no `@ManyToOne`); the keys live in SQL, where the database enforces them. Rows owned by a player (`refresh_tokens`, `wallets`, `wallet_drop_queues`, `progress`, `player_cards`, `card_copies`, `equipment_pieces`) reference `users(username)` with `on delete cascade`. References to a catalog (`heroes`, `chapters`, `stages`, `enemies`, `drop_rules`) use `on delete restrict`. `progress(chapter, stage)` references `stages(chapter, number)`, backed by `unique (chapter, number)`. Catalog FK columns get no index: the catalogs are tiny and never deleted.

**Enemy catalog.** `enemies(id, element, physical_defense, magical_defense, crit_resistance)` holds one row per distinct attribute set (`unique` on the four). `stages.monster_enemy_id`, `stages.miniboss_enemy_id` and `chapters.boss_enemy_id` reference it; health and time limits stay on the stage and the chapter. The domain never sees an enemy id: `ChapterRepository` resolves `EnemyStats` to a row (insert on conflict do nothing, then select) when saving and joins it when reading. `CHECK` constraints keep the element in the five, defenses in 0..90 and crit resistance in 0..100.

**Drop rules.** `drop_rules(id, min_copper, max_copper, kill_interval_ms)` replaces `app.wallet.drop-table`. The id is chosen by the seed or the operator, like the level was. `stages.monster_drop_rule_id`, `stages.miniboss_drop_rule_id` and `chapters.boss_drop_rule_id` reference it. Chapter `c` seeds `3c-2` (monster, `c..5c`), `3c-1` (miniboss, `5c..15c`) and `3c` (boss, `20c..50c`), each 1500 ms: 15 rules. `CHECK` constraints mirror `DropRule`: `min_copper >= 1`, `max_copper >= min_copper`, `kill_interval_ms >= 1`. The wallet reads the `DropTable` from the database on every operation, so a tuned rule applies on the next request.

**Wallet queues per rule.** `wallet_levels` becomes `wallet_drop_queues(id "username/ruleId", username, drop_rule_id, drops, allowance, allowance_updated_at)`. `GET /wallet` and `POST /wallet/sync` keep their JSON shape; the keys are drop rule ids. An unknown id is 400 `WALLET_UNKNOWN_DROP_RULE`. `GET /progress` carries `monsterDropRuleId`, `minibossDropRuleId` per stage and `bossDropRuleId` per chapter, and the game takes each kill's drop from the queue of that encounter's rule.

**Seeding stays in Kotlin.** `ChapterSeeder` saves each missing rule of `ChapterDefinition.dropRules(n)`, then the chapter (enemies through `ChapterRepository`); `HeroSeeder` saves the heroes before their skills. Seeders never overwrite a row, so values tuned by SQL survive restarts.

## Consequences

- An orphan write or the delete of a catalog row in use fails in the database (SQLState `23503`); deleting a user removes all of that player's rows.
- Tuning an enemy changes one row for every stage that uses it; tuning a drop rule needs no restart and no deploy.
- The local database of the old schema must be recreated once (`docker compose down -v`, see `backend/readme.md`): Flyway refuses a non-empty schema without history. Existing players, wallets, cards and equipment are lost.
- A schema change is now a migration file plus the entity change; `validate` catches a mismatch at startup and in every integration test.
- Registering before the heroes are seeded now fails on the `leader_id` FK instead of writing an orphan row (seeders run after the web server starts; accepted for a local single-user startup).
- Comma-separated columns remain (`cleared_chapters`, `drops`, `affixes`); they hold no reference to another table.

## Alternatives considered

- Keep `ddl-auto: update` and add the keys by hand: rejected; nothing would version or reproduce them.
- `@ManyToOne` mappings: rejected; a new pattern with lazy loading and cascade surprises for no gain over plain id columns.
- Seed rows in a `V2__seed.sql`: rejected; the seed values are computed and unit-tested in `ChapterDefinition`, and SQL would duplicate the formulas.
- Identity ids for drop rules: rejected; the game and the wallet key queues by the rule id, so the operator picks it.
- Drop rules in `application.yaml` per stage: rejected; the user asked for drops defined per stage in the database.
