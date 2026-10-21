# Click Power Specification

## Problem Statement

Click damage grows only through equipment. Lyra's leader bonus (`Ventos Ligeiros dura 50% mais`) is a placeholder with no effect, hero stars only unlock skills, and nothing rewards clicking steadily. This feature adds three sources of click power: Lyra's double critical click, a star bonus for the leader, and a combo of consecutive clicks. The coin talent tree is a separate feature (`talents`).

## Goals

- [ ] When Lyra leads, 30 % of clicks hit twice, both hits critical.
- [ ] The leader's stars (1 to 3) raise click damage, critical damage and critical chance by the table below.
- [ ] Consecutive clicks build a combo of +1 % per click up to +50 %, lost after 1.5 s without a click.
- [ ] One pure function builds the leader's attacker from every source, so the equipment screen can show the same numbers.

## Out of Scope

| Feature | Reason |
| --- | --- |
| The other four leader bonuses (Kael, Orina, Seraphine, Vex) | Still a later feature (hero-skills decision) |
| Coin talent tree | Separate feature `talents` (needs the backend) |
| A combo for skill hits | User: the combo differentiates the click from the skills |
| Combo or star bonuses for heroes that are not the leader | Only the leader fights |
| Server checks of click damage | Combat runs in the browser (AD-002) |
| Saving the combo across reloads | In-memory state of the fight scene |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| What "duplo clique crítico" is | A click that lands twice, each hit a full click (the same damage formula, forced critical, critical resistance ignored) | Same `forceCritical` as Tiro Preciso; "duplo clique" read as two clicks | n |
| Lyra's chance roll | One roll `random() * 100 < 30` per click on the monster, before the hits; skills, ticks and the second hit never roll it | One independent roll per click | n |
| Where the chance applies | Every click on a monster (phase, miniboss, boss, farm) while Lyra leads | The bonus belongs to the leader | n |
| The second hit after a kill | If the first hit kills, the second does not land | Same rule as Flecha Dupla | n |
| Lyra text | New `leaderBonus`: `30% de chance de executar um clique duplo crítico.` in the backend seed, a Flyway data migration for existing rows, `README.md` and the fake backend | The seeder never overwrites a row | n |
| Star bonus numbers | Totals for the leader's current stars, not cumulative: 0 stars none; 1 star +10 % click damage; 2 stars +20 % click damage and +20 % critical damage; 3 stars +40 % click damage, +50 % critical damage and +30 points of critical chance | User numbers, read as totals per star level | n |
| Units | Click damage % adds to the equipment `CLICK_DAMAGE_PCT`; critical damage % adds to the critical multiplier like `CRIT_DAMAGE_PCT` (+20 % is +0.2); critical chance adds points to the chance, capped at 100 | Same units as the equipment affixes | n |
| Combo bonus of a click | `min(50, streak)` percent, where `streak` is the clicks already in the streak before this click; it multiplies the click's final damage | First click +0 %, second +1 %; multiplicative so it scales every other source | n |
| Combo timeout | The streak ends when 1500 ms pass with no click on a monster; the time is frozen while the fight is paused or a hero screen is open | Same freeze rule as cooldowns | n |
| What clicks count | Only clicks that land on a living monster; a click on the background or a paused click does not count or reset | A miss on the canvas is not a hit | n |
| Combo across kills | The streak survives a kill, a new monster and a leader change | A rhythm game rewards the flow | n |
| Combo text | `Combo x<streak> · +<bonus>%` with `<bonus>` the bonus of the next click, hidden when the streak is 0; `data-testid="combo-hud"` | Lesson L-010 | n |
| Order of the click factors | `(base + weapon) x (1 + (equipment % + star %) / 100)` is the attacker's base damage; Ventos and Bênção add percent to the click; the combo multiplies the result; the double hit repeats the whole click | Keeps `attackerFor` and `clickDamage` as they are | n |
| Skill hits | Use the attacker with the star bonus, not the combo, never Lyra's double | Skills are percent of Base (hero-skills) | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Lyra's double critical click ⭐ MVP

**User Story**: As a player who leads with Lyra, I want some clicks to hit twice as critical strikes so that her bonus matters.

**Why P1**: A direct request; the current text is a placeholder.

**Acceptance Criteria**:

1. WHERE Lyra is the leader, WHEN the player clicks a living monster and the roll `random() * 100` is below 30 THEN the game SHALL deal two hits, each one critical.  <!-- optional-feature -->
2. WHERE Lyra is the leader, WHEN the roll is 30 or above THEN the game SHALL deal one hit by the normal click rules.  <!-- optional-feature -->
3. WHEN a double click lands THEN the game SHALL show two damage numbers, both in the critical style.  <!-- event-driven -->
4. WHEN a double click is rolled against a monster whose critical resistance is 100 THEN the game SHALL still make both hits critical.  <!-- event-driven -->
5. IF the first hit of a double click kills the monster THEN the game SHALL not land the second hit.  <!-- unwanted-behavior -->
6. WHERE the leader is not Lyra, the game SHALL not roll the double click.  <!-- optional-feature -->
7. WHEN a skill hit or a damage tick lands THEN the game SHALL not roll the double click.  <!-- event-driven -->
8. The game SHALL show Lyra's leader bonus as `30% de chance de executar um clique duplo crítico.` on the leader card and in the hero screens.  <!-- ubiquitous -->

**Independent Test**: With Lyra leading and `random` stubbed to 0.29, a click on a Base-1 neutral monster of 10 health deals two critical hits of 2 damage each; with 0.30 it deals one hit of 1.

---

### P1: Star bonus ⭐ MVP

**User Story**: As a player, I want my leader's stars to raise the click so that repeated cards matter.

**Why P1**: A direct request with exact numbers.

**Acceptance Criteria**:

1. WHEN the leader has 0 stars THEN the game SHALL add no star bonus.  <!-- event-driven -->
2. WHEN the leader has 1 star THEN the game SHALL add 10 % click damage.  <!-- event-driven -->
3. WHEN the leader has 2 stars THEN the game SHALL add 20 % click damage and 20 % critical damage.  <!-- event-driven -->
4. WHEN the leader has 3 stars THEN the game SHALL add 40 % click damage, 50 % critical damage and 30 points of critical chance.  <!-- event-driven -->
5. WHEN a leader with 2 stars wears a piece of +10 % click damage THEN the game SHALL use a click damage of base x 1.3.  <!-- event-driven -->
6. WHEN the leader fuses to a higher star count THEN the game SHALL use the new bonus on the next click.  <!-- event-driven -->
7. WHEN a leader with 3 stars wears pieces that give 80 points of critical chance THEN the game SHALL cap the critical chance at 100.  <!-- event-driven -->
8. WHEN the leader changes THEN the game SHALL use the new leader's star bonus on the next click.  <!-- event-driven -->

**Independent Test**: A leader with 3 stars and no equipment clicks a Base-1 neutral monster with `random` at 0.99: damage 1.4; at 0.29 (critical, chance 10 + 30 = 40): 1.4 x 2.5 = 3.5.

---

### P2: Click combo

**User Story**: As a player, I want a steady rhythm of clicks to hit harder so that active play pays.

**Why P2**: Useful, but needs a HUD element and a timer.

**Acceptance Criteria**:

1. WHEN the player clicks a living monster THEN the game SHALL deal the click with a combo bonus of `min(50, streak)` percent, where `streak` is the clicks of the current streak before this click.  <!-- event-driven -->
2. WHEN the 11th click of a streak lands THEN the game SHALL deal base damage x 1.10 (streak 10).  <!-- event-driven -->
3. WHEN the 51st click of a streak lands THEN the game SHALL deal base damage x 1.50, and every later click of the streak the same.  <!-- event-driven -->
4. WHEN 1500 ms pass with no click on a monster THEN the game SHALL end the streak and the next click SHALL deal base damage x 1.00.  <!-- event-driven -->
5. WHILE the fight is paused or a hero screen is open the game SHALL freeze the 1500 ms.  <!-- state-driven -->
6. WHILE the streak is 1 or more the game SHALL show `Combo x<streak> · +<bonus>%` with `<bonus>` the bonus of the next click.  <!-- state-driven -->
7. WHEN the streak ends THEN the game SHALL hide the combo text.  <!-- event-driven -->
8. WHEN a skill is used THEN the game SHALL keep the streak and its timer unchanged.  <!-- event-driven -->
9. WHEN a skill hit or a damage tick lands THEN the game SHALL not apply the combo bonus.  <!-- event-driven -->
10. WHEN a click lands on the canvas but not on a living monster THEN the game SHALL leave the streak unchanged.  <!-- event-driven -->

**Independent Test**: Click a monster 11 times within 1.4 s and read the 11th damage as 1.10 x base and the text `Combo x11 · +11%`; wait 1.5 s and read the text gone.

---

## Edge Cases

- WHEN Lyra's double click and the combo apply to one click THEN the game SHALL apply the same combo bonus to both hits and count one click in the streak.
- WHEN the leader has not loaded THEN the game SHALL use the plain attacker with no star bonus.
- IF `random` returns 0 THEN the game SHALL roll the double click for Lyra.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PWR-01 | P1: Lyra double critical click (AC 1-7) | Specify | Pending |
| PWR-02 | P1: Lyra leader bonus text, seed, migration (AC 8) | Specify | Pending |
| PWR-03 | P1: star bonus table (AC 1-4, 6, 8) | Specify | Pending |
| PWR-04 | P1: units and the attacker builder (AC 5, 7) | Specify | Pending |
| PWR-05 | P2: combo bonus and timeout (AC 1-5, 8-10) | Specify | Pending |
| PWR-06 | P2: combo text (AC 6-7) | Specify | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped

---

## Success Criteria

- [ ] Unit tests pin the star table, the combo curve and Lyra's two rolls with exact numbers.
- [ ] An e2e test reads a double critical click and the combo text on the real page.
- [ ] The backend answers Lyra's new leader bonus for a new and an existing player.
