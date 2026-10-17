# Clicker Combat Specification

## Problem Statement

The `ClickerGame` scene is a coin-catching prototype (falling coins, score) and does not match the intended game. It is reworked into a minimal combat scene: one character, one monster, and every click damages the monster. This is the base the game grows from.

## Goals

- [ ] `ClickerGame` shows exactly one character (black square) and one monster, and no coins or score.
- [ ] Every click on the canvas deals damage to the monster, shows a damage number, and lowers the monster's health bar.

## Out of Scope

| Feature                              | Reason                                  |
| ------------------------------------ | --------------------------------------- |
| Character art, animation, attacks    | Character stays a black square for now  |
| Monster art and animation            | Placeholder shape only                  |
| Coins, score, timer                  | Removed with the old prototype          |
| Upgrades, progression, gold, drops   | Later features                          |
| Saving combat state to the backend   | No persistence needed yet               |

---

## Assumptions & Open Questions

| Assumption / decision        | Chosen default                                                        | Rationale                                        | Confirmed? |
| ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ | ---------- |
| Monster look                 | Red rectangle, 160x200 px, right of centre                            | Art is not decided; a plain shape is replaceable | n          |
| Character look and position  | Black square, 100x100 px, left of centre, static                      | Stated by user; position is a layout choice      | n          |
| Damage per click             | Fixed 1                                                               | Simplest; scaling comes with upgrades            | n          |
| Monster max health           | 10 (10 clicks)                                                        | Short loop that shows the bar emptying           | n          |
| Where the damage number shows | Above the monster's body, not at the pointer; rises 40 px and fades out over 800 ms | Keeps the hit readable wherever the player clicks | n          |
| Click area                   | The whole canvas, not only the monster                                | User said "every click on the screen"            | y          |
| Monster at 0 health          | Respawns at once with full health                                     | Keeps the loop going without a death flow       | n          |
| Health bar look              | Dark background bar with a green fill, 120 px wide, 12 px tall, 16 px above the monster's top edge | Readable, art-free | n          |
| Background                   | Keep the existing `background` image                                  | Already loaded, no new asset                     | n          |
| GameOver scene               | Deleted (file and registration in `main.js`); MainMenu still starts `ClickerGame` | User asked to remove it; nothing reaches it after the rework | y          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Hit the monster with a click ⭐ MVP

**User Story**: As a player, I want to click anywhere on the screen to hit the monster so that I can see my character fight.

**Why P1**: This is the whole core loop.

**Acceptance Criteria**:

1. WHEN the scene starts THEN the system SHALL show exactly one character (black square) and one monster, and no coins.  <!-- event-driven -->
2. WHEN the player clicks anywhere on the canvas THEN the system SHALL reduce the monster's health by 1.  <!-- event-driven -->
3. WHEN the player clicks anywhere on the canvas THEN the system SHALL show the text "1" above the monster, rising 40 px and fading out over 800 ms.  <!-- event-driven -->
4. WHEN a damage number finishes fading THEN the system SHALL remove it from the scene.  <!-- event-driven -->
5. WHEN the monster's health reaches 0 THEN the system SHALL restore it to 10 and refill the health bar.  <!-- event-driven -->
6. The system SHALL NOT register a `GameOver` scene.  <!-- ubiquitous -->

**Independent Test**: Start the scene, click 3 times, see three "1" numbers and the bar at 70%; click 7 more times and see the bar refill.

---

### P1: Monster health bar ⭐ MVP

**User Story**: As a player, I want a health bar above the monster's head so that I can see how close it is to dying.

**Why P1**: Without it the damage has no visible effect.

**Acceptance Criteria**:

1. The system SHALL show a health bar centred above the monster whose fill width equals monster health divided by max health, times 120 px.  <!-- ubiquitous -->
2. WHEN the monster's health changes THEN the system SHALL update the fill width in the same frame.  <!-- event-driven -->
3. IF a hit deals more damage than the monster's remaining health THEN the system SHALL set its health to 10 and the fill width to 120 px, never a negative width.  <!-- unwanted-behavior -->

**Independent Test**: At 10 health the fill is 120 px wide; after one click it is 108 px.

---

## Edge Cases

- WHEN the player clicks faster than 800 ms apart THEN the system SHALL show one independent damage number per click.
- WHEN the player clicks on the monster itself THEN the system SHALL deal the same 1 damage as a click anywhere else, once per click.

---

## Requirement Traceability

| Requirement ID | Story                    | Phase | Status  |
| -------------- | ------------------------ | ----- | ------- |
| CLK-01         | P1: Hit the monster      | -     | Implementing |
| CLK-02         | P1: Hit the monster      | -     | Implementing |
| CLK-03         | P1: Hit the monster      | -     | Implementing |
| CLK-04         | P1: Hit the monster      | -     | Implementing |
| CLK-05         | P1: Hit the monster      | -     | Implementing |
| CLK-06         | P1: Monster health bar   | -     | Implementing |
| CLK-07         | P1: Monster health bar   | -     | Implementing |
| CLK-08         | P1: Monster health bar   | -     | Implementing |
| CLK-09         | P1: Hit the monster      | -     | Pending |

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped ⚠️

---

## Success Criteria

- [ ] Ten clicks anywhere on the canvas kill and respawn the monster, with ten damage numbers shown.
- [ ] `npm test` passes with unit tests covering CLK-01 to CLK-09.
