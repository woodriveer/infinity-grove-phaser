# Miniboss Adds and Targeting Specification

## Problem Statement

Every fight is one monster, so the only decision is when to fire skills. The owner wants minibosses after chapter 10 to come with add monsters that strongly buff the miniboss's defense. The player then chooses the target: kill the adds first to drop the buff, or go straight for the boss. This feature adds the adds, their per-chapter physical or magical defense buff, and target selection for the click, the auto click and the allies of `hero-team`. It also makes every damage skill hit all enemies. It is feature 3 of the split in `.specs/features/hero-team/spec.md` (Feature Split) and needs chapters 11 to 15 from `campaign-chapters`.

## Facts From the Code (not decisions)

- Combat runs in the browser (AD-002). The server sees only the outcome report of the miniboss (`CLEARED` or `FAILED`, AD-004), so the adds change no server rule.
- The stage definition (health, attributes, time limit) comes from the backend in the progress payload, and the game types no stage number (`stages`).
- The monster sits at `MONSTER = { x: 670, y: 440, width: 220, height: 250 }` (`ClickerGame.js:24`), so it spans x 560 to 780 and y 315 to 565. The leader sprite stands at `CHARACTER = { x: 230, y: 612, height: 320 }` with origin (0.5, 1), so it spans y 292 to 612; Kael is about 344 px wide (x 58 to 402), the others 102 to 134 px. The HUD button column is centred at x 956.
- The add positions first accepted in Q25, (300, 470) and (450, 470) at 132 x 150 px, overlapped the leader sprite (an add at x 300 spans x 234 to 366). The owner approved the Q38 positions instead (2026-10-31). The `hero-team` attack formation (Q36) keeps every hero at x 410 or less, left of the adds column (x 425 to 535).
- A click counts only when it lands on a living monster (`click-power`). The auto click shows its number at the monster centre x (`auto-click`).
- Chapter c miniboss defenses (both physical and magical) are `min(10 + n + 20 + 3(c-5), 80)` for stage n (`campaign-chapters`): chapter 11 stage 1 is 49, chapter 15 stage 1 is 61.

## Goals

- [ ] From chapter 11, every miniboss fight starts with the miniboss and 2 adds, and each living add raises one of the miniboss's defenses by the amount of the Add Table.
- [ ] The player picks the target with a click, and the auto click and the allies hit that target.
- [ ] Every damage skill hits the miniboss and every living add.
- [ ] The fight is won when the miniboss dies, with or without adds alive, and lost on the countdown as today.
- [ ] Fights of chapters 1 to 10 and every chapter boss stay exactly as today.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Adds on chapter bosses or phases | The owner named minibosses |
| Adds that attack, heal or respawn | Not asked; the only add effect is the defense buff |
| Own art for adds | They reuse the phase monster look of the stage at a smaller scale |
| Rewards for killing adds | Owner decision (Q24): none |
| Server-side check of targets or kills | AD-002 |
| A keyboard key to switch targets | Owner decision (Q22) |
| Adds raising team resistance | Default of Q35 (`hero-team`): the team ignores the add buff |

---

## Add Table

Owner decision for chapters 11 and 15 (Q21). Chapters 12 to 14 are the default of Q39. Each miniboss of these chapters has 2 adds. `Lacaio 1` and `Lacaio 2` are listed in that order.

| Chapter | Lacaio 1 buff | Lacaio 2 buff | Add health |
| --- | --- | --- | --- |
| 1 to 10 | no adds | no adds | - |
| 11 | +30 physical defense | +30 physical defense | 3 x phase monster health of the stage |
| 12 | +35 physical defense | +35 physical defense | 3 x phase monster health |
| 13 | +40 physical defense | +40 magical defense | 3 x phase monster health |
| 14 | +45 physical defense | +45 magical defense | 3 x phase monster health |
| 15 | +50 physical defense | +50 magical defense | 3 x phase monster health |

- Each living add adds its buff to the named defense of the miniboss. The sum is capped at 90 (the schema bound), and every other reduction applies after the cap.
- An add has the stage's phase monster element and attributes (defenses 0, critical resistance 0, team resistance 0).
- **Chapter 11 stage 1** (miniboss defenses 49, phase monster 655 360, add 1 966 080, miniboss 3 276 800):

  | Adds alive | Physical defense | Magical defense | Base-1 PHYSICAL click |
  | --- | --- | --- | --- |
  | 2 | 90 | 49 | 0.1 |
  | 1 | 79 | 49 | 0.21 |
  | 0 | 49 | 49 | 0.51 |

  MAGICAL hits deal 0.51 throughout. A physical leader is pushed to kill the adds; a magical leader or the team can go straight in.
- **Chapter 15 stage 1** (miniboss defenses 61): with both adds the physical and magical defenses are 90. With only `Lacaio 2` alive they are physical 61 and magical 90. With only `Lacaio 1` alive they are physical 90 and magical 61.

## Target and Skill Rules

- **Target**: the miniboss is the target when the fight starts. A click on a living monster hits it and makes it the target. When the target add dies, the target goes back to the miniboss.
- **What hits the target**: the auto click and every ally hit (`hero-team`). A manual click hits the monster clicked. Lyra's double critical click stays on the clicked monster.
- **Damage skills hit every living monster** (owner decision Q23), each monster with its own defenses and its own damage number: Corte Dimensional, Investida do Baluarte, Flecha Dupla, Tiro Preciso, Tempestade Arcana, Chuva de Meteoros, Luz Divina, Bomba de Veneno, Golpe Sangrento. Details are the default of Q41:
  - Flecha Dupla shoots two arrows at each monster, each with its own critical roll; if the first arrow kills a monster, its second arrow does not land.
  - Tiro Preciso lands at the end of its cast on every monster alive at that moment.
  - Tempestade Arcana ticks on every monster alive at each tick.
  - Bomba de Veneno adds a stack to each monster.
  - Golpe Sangrento hits each monster and starts a Bleed on each.
- **Debuff skills without damage** (default of Q40): Brado Aterrador and Prisão de Espinhos apply to every living monster. Stun, Root and Carrilhão act on the countdown as today.
- **End**: the miniboss dying wins the fight, and the adds still alive disappear with it. The countdown reaching 0 fails the fight as today. An add dying is removed with the death fade, does not respawn and pays nothing.

---

## Assumptions & Open Questions

Rows `Q20` to `Q25` carry the owner's answers of 2026-10-30; `Q35`, `Q38`, `Q39`, `Q40` and `Q41` are new questions with the recommended default.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q20** Which chapters | Chapters 11 to 15, in campaign fights and farm fights of those minibosses | Owner answer | y |
| **Q21** Count and strength | 2 adds per miniboss with 3 x phase monster health. Chapter 11: each add +30 physical defense. Chapter 15: one add +50 physical, the other +50 magical. Miniboss defense capped at 90 | Owner answer | y |
| **Q22** Targeting | The click picks the target, the miniboss is the starting target, the auto click and the allies hit the target, a dead target add hands the target back to the miniboss, no keyboard key | Owner answer | y |
| **Q23** Skills with adds | Every damage skill hits the miniboss and every living add | Owner answer (changed: all, not a list) | y |
| **Q24** Win, loss and rewards | Miniboss death wins with adds alive; the countdown fails as today; adds pay no coins, cards, equipment or talent points and are not reported to the server; a click on an add counts for the combo | Owner answer | y |
| **Q25** Layout and screen text | A gold triangle `#ffd24a` above the target; the HP box shows `Alvo: <name>` (`Miniboss`, `Lacaio 1`, `Lacaio 2`) and the target's HP; the enemy attribute line shows the target's numbers, buff included. Positions and sizes: Q38 | Owner answer; positions replaced by Q38 (owner answer 2026-10-31) | y |
| **Q35** Adds and team resistance | Adds raise only physical and magical defense, never team resistance, so ally hits ignore the add buff | Shared with `hero-team`; the owner described physical and magical buffs | default (owner did not object) |
| **Q38** Add positions | Adds at 50 % size (110 x 125 px) in a column between the leader and the miniboss, centres (480, 360) for `Lacaio 1` and (480, 540) for `Lacaio 2`. Each has a 100 x 8 px health bar 10 px above it, and the text `+<buff> defesa física` or `+<buff> defesa mágica` (12 px, white, dark outline) above the bar | Owner answer 2026-10-31 | y |
| **Q39** Chapters 12 to 14 | Chapter 12: +35 physical on both adds. Chapter 13: +40 physical / +40 magical. Chapter 14: +45 physical / +45 magical (Add Table) | Owner answer 2026-10-31 | y |
| **Q40** Brado and Prisão with adds | Applied to every living monster | Owner answer 2026-10-31; when the game is animated, the adds will also show the effect | y |
| **Q41** Multi-hit skills on every monster | Flecha Dupla: two arrows per monster, each with its own critical roll. Tiro Preciso: every monster alive at the end of the cast. Tempestade: every monster alive at each tick. Poison: one stack per monster. Golpe Sangrento: hit and Bleed on each | Owner answer 2026-10-31 | y |
| Data | Each stage of the progress payload carries `adds`: a list (empty for chapters 1 to 10) of `{ "health": integer, "defenseType": "PHYSICAL" or "MAGICAL", "defenseBuff": integer 0 to 90 }`. It is stored by expand migrations (AD-016) and seeded for chapters 11 to 15 from the Add Table | The game types no stage number (`stages`); an empty list keeps chapters 1 to 10 unchanged | n |
| Effects per monster | Debuffs and damage over time belong to the monster they hit and end when it dies; effects on the player are unchanged | One monster's death must not clear another's debuffs | n |
| Reload during the fight | The miniboss and both adds restart at full health with a full countdown | Same rule as today (`stages`) | n |
| Implicit dimensions | Input bounds: the Data checks. Failure states: an invalid add entry fails the progress load like an unknown element (`elements`). Idempotency, auth, concurrency: N/A because the outcome report path does not change. Data lifecycle: catalog data. Observability: N/A because there is no new server event. External dependency: N/A. State transitions: the target changes only on a click on a living monster or the target's death | Complex-scope sweep | n |

**Open questions:** none. Q35 holds the default because the owner did not object (2026-10-31).

---

## User Stories

### P1: Adds come with the miniboss ⭐ MVP

**User Story**: As a player past chapter 10, I want minibosses guarded by adds so that boss fights need a plan.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHEN the backend answers a progress THEN every stage of the definition SHALL carry `adds`, a list of `{ health, defenseType, defenseBuff }`.  <!-- event-driven -->
2. WHEN the backend seeds or migrates chapters 11 to 15 THEN each stage SHALL carry 2 adds with the buffs of the Add Table and health 3 times its phase monster health, and chapters 1 to 10 SHALL carry an empty list.  <!-- event-driven -->
3. WHEN a miniboss whose stage carries adds appears THEN the game SHALL spawn the miniboss and every add with its health and the stage's phase monster attributes.  <!-- event-driven -->
4. WHILE adds are alive the game SHALL compute each miniboss defense as its own value plus the `defenseBuff` of every living add of that `defenseType`, at most 90, before every other reduction.  <!-- state-driven -->
5. WHEN the chapter 11 stage 1 miniboss (defenses 49) is hit by a Base-1 PHYSICAL click with no critical and element multiplier 1.0 THEN the game SHALL deal 0.1 with 2 adds alive, 0.21 with 1 and 0.51 with none.  <!-- event-driven -->
6. WHEN the chapter 11 stage 1 miniboss is hit by a Base-1 MAGICAL skill hit of 100 % with no critical and element multiplier 1.0 while both adds are alive THEN the game SHALL deal 0.51.  <!-- event-driven -->
7. WHEN the chapter 15 stage 1 miniboss (defenses 61) has only `Lacaio 2` alive THEN the game SHALL use physical defense 61 and magical defense 90.  <!-- event-driven -->
8. WHEN an add dies THEN the game SHALL remove it with the death fade, never respawn it in that fight, and drop its buff from the next hit.  <!-- event-driven -->
9. WHEN a stage carries an empty `adds` list THEN the game SHALL fight the miniboss exactly as today.  <!-- event-driven -->
10. IF a stage carries more than 4 adds, an add with health below 1, a `defenseType` other than `PHYSICAL` or `MAGICAL`, or a `defenseBuff` outside 0 to 90 THEN the game SHALL fail the progress load and spawn no monster, as for an unknown element.  <!-- unwanted-behavior -->

**Independent Test**: In the browser against the fake backend at the chapter 11 stage 1 miniboss, three monsters appear; the miniboss's attribute line shows physical defense 90 and magical defense 49; after one add dies it shows 79, and after both 49.

---

### P1: The player picks the target ⭐ MVP

**User Story**: As a player, I want to choose whom I hit so that I decide between the adds and the boss.

**Why P1**: Without a target the adds are only a wall.

**Acceptance Criteria**:

1. WHEN a miniboss fight with adds starts THEN the game SHALL make the miniboss the target.  <!-- event-driven -->
2. WHEN the player clicks a living monster THEN the game SHALL hit that monster and make it the target.  <!-- event-driven -->
3. WHEN an auto click fires THEN the game SHALL hit the target and show its number at the target's centre x.  <!-- event-driven -->
4. WHEN an ally tick lands THEN the game SHALL land every ally hit on the target.  <!-- event-driven -->
5. WHEN the target add dies THEN the game SHALL make the miniboss the target.  <!-- event-driven -->
6. WHILE a monster is the target the game SHALL draw a gold triangle `#ffd24a`, 16 px wide, pointing down, 20 px above it.  <!-- state-driven -->
7. WHILE a miniboss fight with adds runs the HP box SHALL show `Alvo: <name>` (`Miniboss`, `Lacaio 1`, `Lacaio 2`) above the target's `HP <health>/<max>`, and the enemy attribute line SHALL show the target's attributes, buff included.  <!-- state-driven -->
8. WHILE an add is alive the game SHALL show its own health bar and its buff text at the positions of Q38.  <!-- state-driven -->
9. WHEN the player clicks an add THEN the click SHALL count one step of the combo, as a click on the miniboss does.  <!-- event-driven -->

**Independent Test**: Click `Lacaio 1`, read `Alvo: Lacaio 1` and its HP falling with the auto click; kill it and read `Alvo: Miniboss`.

---

### P1: Damage skills hit every enemy ⭐ MVP

**User Story**: As a player, I want my damage skills to hit the boss and its adds so that a burst can break the guard.

**Why P1**: Owner decision; without it a skill on the boss ignores the adds that guard it.

**Acceptance Criteria**:

1. WHEN Corte Dimensional, Investida do Baluarte, Chuva de Meteoros, Luz Divina or Golpe Sangrento is used with adds alive THEN the game SHALL land its hit on every living monster, each with its own defenses and its own damage number.  <!-- event-driven -->
2. WHEN Flecha Dupla is used with adds alive THEN the game SHALL shoot two arrows at each living monster, each arrow with its own critical roll, and SHALL NOT land a monster's second arrow when its first arrow killed it.  <!-- event-driven -->
3. WHEN the cast of Tiro Preciso ends THEN the game SHALL land its hit on every monster alive at that moment.  <!-- event-driven -->
4. WHEN Tempestade Arcana ticks THEN each tick SHALL land on every monster alive at that tick.  <!-- event-driven -->
5. WHEN Bomba de Veneno is used THEN the game SHALL add one Poison stack to every living monster, and WHEN Golpe Sangrento hits THEN it SHALL start a Bleed on every monster it hit.  <!-- event-driven -->
6. WHEN Brado Aterrador or Prisão de Espinhos is used with adds alive THEN the game SHALL apply its debuff to every living monster.  <!-- event-driven -->
7. WHEN a monster dies THEN the game SHALL end only that monster's debuffs and damage over time.  <!-- event-driven -->
8. WHEN a damage skill is used in a fight with a single monster THEN the game SHALL behave exactly as today.  <!-- event-driven -->

**Independent Test**: Use Chuva de Meteoros with both adds alive and read three damage numbers; use Flecha Dupla and read six.

---

### P1: The fight ends on the miniboss ⭐ MVP

**User Story**: As a player, I want the miniboss to decide the fight so that going straight for it is a valid plan.

**Why P1**: Win and loss rules must be clear before the fight can ship.

**Acceptance Criteria**:

1. WHEN the miniboss dies before its countdown ends THEN the game SHALL win the fight, remove the adds still alive, and report `CLEARED` exactly as today.  <!-- event-driven -->
2. IF the countdown reaches 0 with the miniboss alive THEN the game SHALL remove every monster and report `FAILED` exactly as today, whether adds are alive or not.  <!-- unwanted-behavior -->
3. WHEN an add dies THEN the game SHALL pay no coins, send no kill to the wallet sync and send no outcome report.  <!-- event-driven -->
4. WHEN a farm fight of a chapter 11 to 15 miniboss starts THEN the game SHALL spawn its adds by the same rules.  <!-- event-driven -->
5. WHEN the page reloads during a miniboss fight with adds THEN the game SHALL start the miniboss and every add at full health with a full countdown.  <!-- event-driven -->

**Independent Test**: Kill the miniboss with both adds alive: stage 2 phase 1 starts and one `CLEARED` report is sent; let the countdown end after killing both adds: phase 5 returns and one `FAILED` report is sent.

---

## Edge Cases

- WHEN a damage skill kills the miniboss and an add with the same hit THEN the game SHALL win the fight once and send one `CLEARED` report.
- WHEN the player clicks the monster that is already the target THEN the game SHALL hit it and keep it as the target.
- WHEN an ally tick kills the target add THEN the later ally hits of that tick SHALL land on the miniboss, the new target.
- WHEN two physical adds of chapter 12 are alive on a miniboss with physical defense 50 THEN the game SHALL use 90, not 120.
- WHEN the defense break talents, Orina's or Vex's passive, or Brado lower a buffed miniboss THEN the game SHALL subtract them from the capped value, never below 0.
- WHILE the pause menu is open the game SHALL change no target and land no hit.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ADDS-01 | P1: Adds come with the miniboss - AC 1, 2, 10 (data, seed, validation) | - | Pending |
| ADDS-02 | P1: Adds come with the miniboss - AC 3, 8, 9 (spawn and death) | - | Pending |
| ADDS-03 | P1: Adds come with the miniboss - AC 4 to 7 (defense buff) | - | Pending |
| ADDS-04 | P1: Target - AC 1 to 5, 9 (target rules) | - | Pending |
| ADDS-05 | P1: Target - AC 6 to 8 (marker, HP box, bars) | - | Pending |
| ADDS-06 | P1: Damage skills hit every enemy - AC 1 to 8 | - | Pending |
| ADDS-07 | P1: Fight end - AC 1 to 5 | - | Pending |

**Coverage:** 7 total, 0 mapped to tasks (Design starts after `campaign-chapters` and `hero-team`, Q26), 7 unmapped

---

## Success Criteria

- [ ] Unit tests pin the Add Table and the chapter 11 and 15 examples with exact numbers.
- [ ] An e2e test at chapter 11 switches the target with a click and wins with adds alive.
- [ ] The existing stages, skills and farm suites pass unchanged for chapters 1 to 10.
