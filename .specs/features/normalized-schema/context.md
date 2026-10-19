# Normalized Schema Context

**Gathered:** 2026-10-19
**Spec:** `.specs/features/normalized-schema/spec.md`
**Status:** Ready for design

---

## Feature Boundary

The database gets foreign keys on every reference, the enemy attributes leave `stages`/`chapters` for a shared `enemies` catalog, and copper drops move from `app.wallet.drop-table` to a `drop_rules` table referenced by the monster, the miniboss and the chapter boss of each stage/chapter. The schema is owned by Flyway instead of `ddl-auto: update`.

---

## Implementation Decisions

### Migration

- Flyway owns the schema; `ddl-auto` becomes `validate`.
- A single `V1` migration creates the normalized schema. The existing local database is dropped and recreated: players, wallets, cards and equipment are lost (user decision).

### Enemies

- `enemies` holds element, physical defense, magical defense and crit resistance; health and time limits stay on the stage / chapter.
- `stages.monster_enemy_id`, `stages.miniboss_enemy_id` and `chapters.boss_enemy_id` reference it. Identical attribute sets share one row.

### Drops

- `drop_rules` (min copper, max copper, kill interval) replaces `app.wallet.drop-table`.
- `stages.monster_drop_rule_id`, `stages.miniboss_drop_rule_id` and `chapters.boss_drop_rule_id` reference it; rules may be shared.
- Seed per chapter `c`: monster 1-5 × c, miniboss 5-15 × c, boss 20-50 × c, all with 1500 ms (15 rules).

### Agent's Discretion

- Foreign-key delete behavior, key types and naming, where seeding lives (migration vs. seeders), API field names for the drop rule id.

### Declined / Undiscussed Gray Areas → Assumptions

- Delete behavior, wallet queue keying and the API contract change are logged in the spec's Assumptions table.

---

## Specific References

No specific requirements - open to standard approaches.

---

## Deferred Ideas

- Card and equipment drop chances per stage (stay in `application.yaml`).
- Named enemies (name, art) in the catalog.
