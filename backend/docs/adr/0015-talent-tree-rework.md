# ADR 0015: Talent tree rework (retired talents, Fúria crescente and a prerequisite on every talent)

- Status: Accepted
- Date: 2026-11-23

## Context

The talent tree changes with spec `talent-tree-rework` (`AD-029`). The chapter boss time (`BOSS_TIME`) and the critical resistance break (`CRIT_RESIST_BREAK`) leave the catalog: the first becomes a damage bonus against minibosses and chapter bosses (`BOSS_DAMAGE`, the TIME branch is titled `Caça aos chefes`), the second a percentage of the defense ignored (`ARMOR_PIERCE`). Fúria crescente (`COMBO_FURY`) is the first talent opened by another talent and not by the previous grade of itself, and it costs 2 points a level, not its grade. The game draws the tree and needs to know what opens each talent without knowing the catalog (`AD-011`).

## Decision

**Catalog rows.** `BOSS_DAMAGE` (branch TIME, `Dano contra chefes`, `%`, 2 a level) and `ARMOR_PIERCE` (branch BREAK, `Perfuração de armadura`, `%`, 1 a level) take the place of the two retired rows in `TalentCatalog` and keep their three grades, so the catalog still lists the 9 graded talents three times. `COMBO_FURY` (branch COMBO, `Fúria crescente`, `combo-step`, 1 a level, 4 levels) is the 28th and last talent.

**Prerequisite and price.** `TalentDefinition.requires` names the talent whose top level opens a talent that is not a grade (`COMBO` for `COMBO_FURY`); it is allowed only with one grade. `prerequisiteId` is `requires`, else the previous grade, and `PlayerTalents.unlocked` reads it. `TalentDefinition.costFactor` is the points of one level before the operator cost: null means the grade (grade N costs N), `COMBO_FURY` has 2.

**Payload.** `TalentResponse` carries `requiredId` and `requiredLevel` (the max level of the prerequisite), both null when the talent is always open. `GET /talents`, the upgrade and the reset answer them.

**Migration.** `V15__talent_tree_rework.sql` deletes the stored levels of `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2` and `CRIT_RESIST_BREAK_G3`. The points spent are derived from `player_talents` (V5), so the points of those levels come back by themselves. A stored row of a retired id that appears later is ignored by `PlayerTalents.fromStored` and logged, and a reset deletes it.

## Expand only

`V15` is data only: it changes no table, column or constraint, and the previous backend reads a missing row as level 0 (`AD-016`). The previous backend keeps starting and serving on the migrated database.

## Consequences

- The points of the retired levels come back with no notice to the player.
- During the deploy window the previous backend can still sell levels of the retired talents; the new backend ignores those rows and counts their points as available (the same trade as `AD-021` for the magical break).
- A game older than the backend, before the Worker is republished, shows Fúria crescente in its old Talentos screen and reads `BOSS_DAMAGE` and `ARMOR_PIERCE` as talents it does not know.
- The ids and values of the new talents live only in the backend catalog; the game reads `value`, `requiredId` and `requiredLevel`.
