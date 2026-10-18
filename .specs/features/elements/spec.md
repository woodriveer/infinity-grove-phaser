# Elements and Enemy Attributes Specification

## Problem Statement

Every monster is the same: a red rectangle with health only, and every click deals 1 damage. This feature gives each enemy an element, a physical defense, a magical defense and a critical resistance, stored in the database next to its health, and makes damage depend on them. Five elements form two groups: the triad fire, water and nature attack each other in a cycle, and light and darkness hit hard against everything and trade blows at a reduced rate. The player has no character yet, so the player is a fixed fire, physical attacker with a base critical chance; characters come in a later feature.

## Goals

- [ ] Each phase monster, miniboss and chapter boss has an element, a physical defense, a magical defense and a critical resistance, read from the database and shown in the HUD.
- [ ] A click deals damage `base × element multiplier × (1 − defense) × critical`, where every multiplier is defined in this spec.
- [ ] The element multiplier table is a pure rule with a unit test for every attacker and defender pair (25 pairs).
- [ ] The campaign, the saved position and the boss timers behave exactly as before.

## Out of Scope

| Feature                                               | Reason                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Player characters, cards, choosing the player element | Decided: the player is fire by default, characters are a later feature                                        |
| Magical damage dealt by the player                    | The player only has physical damage until characters exist; magical defense is stored, shown and ready to use |
| Enemies attacking the player, player defense          | Combat is one-sided today                                                                                     |
| Element art, monster colors, particle effects         | The red rectangle stays for every encounter                                                                   |
| Damage upgrades, skills, equipment                    | Later features; the base damage stays 1                                                                       |
| An admin screen or API to edit enemy attributes       | Values are edited directly in the database (same rule as stages)                                              |
| Server-side validation of damage                      | The client owns combat (AD-002)                                                                               |
| Neutral or extra elements                             | Exactly five elements                                                                                         |

---

## Assumptions & Open Questions

| Assumption / decision                 | Chosen default                                                                                                                                                                                                  | Rationale                                                                                                           | Confirmed? |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| Player element                        | Fire, fixed in the game domain as the default of the future character card                                                                                                                                      | User decision                                                                                                       | y          |
| Fractional damage                     | Damage is a decimal; the monster dies when its health reaches 0 or less; the damage number on screen shows at most 1 decimal, trailing zero dropped                                                             | User decision (decimal damage)                                                                                      | y          |
| Defenses and critical resistance      | Applied now with a simple formula                                                                                                                                                                               | User decision                                                                                                       | y          |
| Triad multipliers                     | Fire to nature 2.0, nature to fire 0.5, nature to water 2.0, water to nature 0.5, water to fire 2.0, fire to water 0.5                                                                                         | User rule                                                                                                           | y          |
| Light and darkness multipliers        | Light to darkness 0.9, darkness to light 0.9; light or darkness to fire, water, nature 1.8; fire, water, nature to light or darkness 0.9                                                                        | User rule and example (a fire player against a darkness monster loses 10%)                                          | y          |
| Same element                          | Fire vs fire, water vs water, nature vs nature, light vs light, darkness vs darkness all deal 1.0                                                                                                               | The user gave no rule for it; 1.0 is the neutral value                                                              | n          |
| Defense value                         | A percentage from 0 to 90: damage is multiplied by `1 − defense / 100`. Physical defense applies to physical damage, magical defense to magical damage                                                          | Simple and bounded; a defense of 100 would make a monster unkillable; flat subtraction would zero a base damage of 1 | n          |
| Critical hit                          | The player has a 10 % base critical chance and a 2.0 critical multiplier. Effective chance = `10 × (1 − critical resistance / 100)` %; a critical click doubles the damage                                       | Gives critical resistance a visible effect; the numbers are a placeholder until characters carry their own          | n          |
| Critical resistance range             | 0 to 100, in percent; 100 means the player can never crit that enemy                                                                                                                                            | A resistance of 100 is a clear, testable end of the range                                                           | n          |
| Order of the formula                  | `damage = 1 × element multiplier × (1 − defense / 100) × (2 if critical else 1)`; no rounding                                                                                                                  | Multiplication is commutative; no rounding keeps 0.9 and 1.8 visible                                                | n          |
| Damage type of the player             | Physical                                                                                                                                                                                                        | A click is a physical hit; magic belongs to characters                                                              | n          |
| Randomness                            | The critical roll uses an injected random source (0 ≤ r < 1) so tests are deterministic; a crit happens when r × 100 is below the effective chance                                                              | Testable domain rule                                                                                                | n          |
| Where attributes live                 | Four columns per encounter kind on the stage (phase monster, miniboss) and on the chapter (chapter boss), carried in the progress payload                                                                       | Same place as health and time limits; no new endpoint                                                               | n          |
| Seed values                           | Stages 1 to 10: element cycles fire, water, nature, light, darkness by stage number; phase monster defenses 0 and critical resistance 0; miniboss defenses 10 + stage and critical resistance 10 + 2 × stage; chapter boss darkness, defenses 30, critical resistance 30 | Exercises every multiplier in the chapter; tunable in the database                                                  | n          |
| Elements as data                      | The database stores the element as text `FIRE`, `WATER`, `NATURE`, `LIGHT`, `DARKNESS`; an unknown value fails the progress load                                                                                | Fail early instead of dealing a wrong multiplier                                                                    | n          |
| Existing rows                         | Rows created before this feature get element `FIRE`, defenses 0 and critical resistance 0 through the schema migration                                                                                          | Old databases keep working; the seeder only creates missing chapters                                                | n          |
| Reload                                | Nothing new is saved per player; the enemy attributes follow the saved position                                                                                                                                 | Attributes are definition data                                                                                      | n          |
| Phase monsters inside a stage         | All five phase monsters of a stage share the stage's phase monster attributes                                                                                                                                   | Matches how health is shared today                                                                                  | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Damage follows the element table ⭐ MVP

**User Story**: As a player, I want elements to matter so that I choose fights I am strong against.

**Why P1**: The element table is the core rule the user asked for and everything else builds on it.

**Acceptance Criteria**:

1. The system SHALL multiply a fire attack by 2.0 against nature, by 0.5 against water and by 0.9 against light and darkness.  <!-- ubiquitous -->
2. The system SHALL multiply a nature attack by 2.0 against water, by 0.5 against fire and by 0.9 against light and darkness.  <!-- ubiquitous -->
3. The system SHALL multiply a water attack by 2.0 against fire, by 0.5 against nature and by 0.9 against light and darkness.  <!-- ubiquitous -->
4. The system SHALL multiply a light attack by 0.9 against darkness and by 1.8 against fire, water and nature.  <!-- ubiquitous -->
5. The system SHALL multiply a darkness attack by 0.9 against light and by 1.8 against fire, water and nature.  <!-- ubiquitous -->
6. The system SHALL multiply an attack by 1.0 when attacker and defender have the same element.  <!-- ubiquitous -->
7. WHEN the fire player clicks a darkness monster THEN the system SHALL deal 0.9 damage before defense and critical.  <!-- event-driven -->
8. WHEN the fire player clicks a nature monster THEN the system SHALL deal 2 damage before defense and critical.  <!-- event-driven -->
9. WHEN a click deals a fractional amount THEN the system SHALL subtract that exact decimal from the monster health.  <!-- event-driven -->
10. WHEN the monster health reaches 0 or less THEN the system SHALL treat the monster as dead and show its health bar at 0 width.  <!-- event-driven -->
11. WHEN a click deals damage THEN the system SHALL show the damage with at most 1 decimal and no trailing zero.  <!-- event-driven -->

**Independent Test**: Unit-test the 25 attacker and defender pairs, then click a darkness monster and see 0.9 rise from it.

---

### P1: Enemies carry attributes from the database ⭐ MVP

**User Story**: As the game owner, I want element, defenses and critical resistance in the database so that I tune each enemy without a release.

**Why P1**: Nothing else can read an attribute until it is stored and delivered.

**Acceptance Criteria**:

1. WHEN the backend starts on an empty database THEN the system SHALL seed chapter 1 with an element, a physical defense, a magical defense and a critical resistance for every phase monster, miniboss and the chapter boss.  <!-- event-driven -->
2. WHEN the game asks for the progress THEN the system SHALL return those four attributes for the phase monster and the miniboss of every stage and for the chapter boss.  <!-- event-driven -->
3. WHEN the game spawns an encounter THEN the system SHALL give the monster the element and the three values of that encounter.  <!-- event-driven -->
4. IF the stored element is not one of `FIRE`, `WATER`, `NATURE`, `LIGHT`, `DARKNESS` THEN the system SHALL fail the progress request with an error and spawn no monster.  <!-- unwanted-behavior -->
5. IF a stored defense is outside 0 to 90 or a stored critical resistance is outside 0 to 100 THEN the system SHALL refuse to save that definition.  <!-- unwanted-behavior -->
6. WHERE a database row predates this feature the system SHALL read it as element `FIRE`, defenses 0 and critical resistance 0.  <!-- optional-feature -->

**Independent Test**: Start the backend on an empty database and read `GET /progress`; every encounter has the four values.

---

### P1: Defenses and critical hits shape the damage ⭐ MVP

**User Story**: As a player, I want tougher enemies to hurt less per click so that bosses feel strong.

**Why P1**: The user asked to apply the attributes now.

**Acceptance Criteria**:

1. WHEN the player deals physical damage THEN the system SHALL multiply it by `1 − physical defense / 100`.  <!-- event-driven -->
2. WHEN the player deals magical damage THEN the system SHALL multiply it by `1 − magical defense / 100`.  <!-- event-driven -->
3. The system SHALL give the player the damage type physical for every click.  <!-- ubiquitous -->
4. WHEN a click is rolled THEN the system SHALL make it critical when `random × 100` is below `10 × (1 − critical resistance / 100)`.  <!-- event-driven -->
5. WHEN a click is critical THEN the system SHALL double its damage.  <!-- event-driven -->
6. WHEN the monster has critical resistance 100 THEN the system SHALL never make a click critical.  <!-- event-driven -->
7. The system SHALL compute the damage as `1 × element multiplier × (1 − defense / 100) × (2 if critical else 1)` with no rounding.  <!-- ubiquitous -->
8. WHEN a click is critical THEN the system SHALL mark its damage number so the player can tell it from a normal hit.  <!-- event-driven -->

**Independent Test**: A fire player against a nature monster with physical defense 50 and no critical deals 1 damage (2 × 0.5); with a forced critical it deals 2.

---

### P2: The HUD shows the enemy attributes

**User Story**: As a player, I want to see the element and defenses of the enemy so that I know why my damage is what it is.

**Why P2**: The rules work without it, but nobody can learn them without seeing the numbers.

**Acceptance Criteria**:

1. WHILE a monster is on screen the system SHALL show its element name, physical defense, magical defense and critical resistance in the HUD.  <!-- state-driven -->
2. WHEN the monster is replaced THEN the system SHALL replace the shown attributes with those of the new monster.  <!-- event-driven -->
3. WHEN no monster is on screen THEN the system SHALL show no enemy attributes.  <!-- event-driven -->
4. The system SHALL keep the attribute text click-through so a click on it still hits the monster.  <!-- ubiquitous -->

**Independent Test**: Open the game and read the line under the stage label for the current monster.

---

## Edge Cases

- WHEN the defense is 90 and the element multiplier is 0.5 THEN the system SHALL deal 0.05 damage per normal click.
- WHEN the damage is below 0.05 THEN the system SHALL show "0" as the damage number and still lower the health by the exact amount.
- IF the damage dealt would take health below 0 THEN the system SHALL set the health to 0.
- IF the attacker or the defender element is missing in the domain call THEN the system SHALL throw an error instead of dealing 1.0.
- WHEN the player leaves a boss or farms it THEN the system SHALL keep the same attributes on the respawned boss.

---

## Requirement Traceability

| Requirement ID | Story                                  | Phase  | Status  |
| -------------- | -------------------------------------- | ------ | ------- |
| ELEM-01        | P1: Damage follows the element table   | Design | Pending |
| ELEM-02        | P1: Enemies carry attributes           | Design | Pending |
| ELEM-03        | P1: Defenses and critical hits         | Design | Pending |
| ELEM-04        | P2: The HUD shows the enemy attributes | Design | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

---

## Success Criteria

- [ ] All 25 element pairs have a unit test asserting the multiplier from this spec.
- [ ] A fire player needs fewer clicks on a nature monster than on a water monster with the same health and defenses.
- [ ] `GET /progress` on a fresh database returns an element and three values for every encounter.
- [ ] The existing stages, boss timer, leave-fight and farm tests still pass unchanged.
