# Monster Death Specification

## Problem Statement

When the monster reaches 0 health it currently reappears instantly at full health, so the kill has no weight. The monster should fade out when it dies and the next one should appear after a short wait.

## Goals

- [ ] A monster that reaches 0 health fades out over 500 ms, health bar included.
- [ ] A new full-health monster appears 1000 ms after the fade ends.

## Out of Scope

| Feature                         | Reason                                   |
| ------------------------------- | ---------------------------------------- |
| Death effects beyond the fade   | Particles, shake, sound come later       |
| Spawn-in animation              | New monster appears at once at full alpha |
| Rewards, score, drops           | Later features                           |

Supersedes `clicker-combat` CLK-05 and CLK-08 (immediate respawn). Their other criteria stay valid.

---

## Assumptions & Open Questions

| Assumption / decision             | Chosen default                                              | Rationale                                           | Confirmed? |
| --------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- | ---------- |
| Fade duration                     | 500 ms, alpha 1 to 0, monster body and health bar together  | Quick but visible                                   | n          |
| Respawn wait                      | 1000 ms counted from the end of the fade (1.5 s from death) | Fade and wait are separate steps                    | y          |
| Clicks while the monster is dead  | Ignored: no damage, no damage number                        | There is nothing to hit                             | y          |
| Killing click                     | Shows its damage number as usual                            | The hit landed before the monster died              | n          |
| Health bar while fading           | Fill is 0 px wide, bar fades with the monster               | Reflects 0 health                                   | n          |
| Respawned monster                 | Health 10, alpha 1, fill 120 px, same position              | Same monster as before                              | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Monster fades out on death ⭐ MVP

**User Story**: As a player, I want the monster to fade away when I kill it so that the kill feels real.

**Why P1**: Core of the request.

**Acceptance Criteria**:

1. WHEN the monster's health reaches 0 THEN the system SHALL fade the monster body and its health bar from alpha 1 to alpha 0 over 500 ms.  <!-- event-driven -->
2. WHEN the monster's health reaches 0 THEN the system SHALL set the health bar fill to 0 px wide.  <!-- event-driven -->
3. WHEN the killing click lands THEN the system SHALL show its damage number.  <!-- event-driven -->
4. WHILE the monster is dead the system SHALL ignore clicks, dealing no damage and showing no damage number.  <!-- state-driven -->

**Independent Test**: Click 10 times; the monster and bar fade out in half a second and further clicks do nothing.

---

### P1: Next monster spawns after a wait ⭐ MVP

**User Story**: As a player, I want a short pause before the next monster so that the fight has rhythm.

**Why P1**: Core of the request.

**Acceptance Criteria**:

1. WHEN the fade ends THEN the system SHALL wait 1000 ms before spawning the next monster.  <!-- event-driven -->
2. WHEN the wait ends THEN the system SHALL show a monster with health 10, alpha 1 and a health bar fill 120 px wide.  <!-- event-driven -->
3. WHEN the next monster has spawned THEN the system SHALL apply clicks to it again, dealing 1 damage each.  <!-- event-driven -->

**Independent Test**: Kill the monster, count about 1.5 s, see a fresh monster; click and its bar drops to 108 px.

---

## Edge Cases

- WHEN the player clicks during the fade or the 1000 ms wait THEN the system SHALL leave the monster's health and the damage numbers unchanged.

---

## Requirement Traceability

| Requirement ID | Story                      | Phase | Status  |
| -------------- | -------------------------- | ----- | ------- |
| DEATH-01       | P1: Monster fades out      | -     | Implementing |
| DEATH-02       | P1: Monster fades out      | -     | Implementing |
| DEATH-03       | P1: Monster fades out      | -     | Implementing |
| DEATH-04       | P1: Monster fades out      | -     | Implementing |
| DEATH-05       | P1: Next monster spawns    | -     | Implementing |
| DEATH-06       | P1: Next monster spawns    | -     | Implementing |
| DEATH-07       | P1: Next monster spawns    | -     | Implementing |

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped ⚠️

---

## Success Criteria

- [ ] Killing the monster shows a 500 ms fade, then 1000 ms of empty ground, then a fresh monster.
- [ ] `npm test` passes with unit tests covering DEATH-01 to DEATH-07.
