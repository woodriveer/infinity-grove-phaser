# Hero Skills Specification

## Problem Statement

The combat screen shows the leader's three skills, but pressing a slot does nothing (`characters` CHAR-10): the fight is still a plain click. This feature makes the 15 skills of the five heroes usable in the browser fight, adapted to the game as it is (one leader, one monster at a time, damage only from clicks), with cooldowns, timed effects and the boss countdown as the target of control skills.

## Goals

- [ ] Every unlocked skill of the leader can be used by a click on its slot or the keys 1, 2 and 3, and then waits its cooldown.
- [ ] Each of the 15 skills applies the mechanic of the Skill Mechanics table, checked by unit tests with exact numbers.
- [ ] The player sees the cooldown left on each slot and every running effect with its seconds left.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Leader bonuses (all five, Lyra's included) | User decision: a later feature |
| A party of several active heroes | User decision: only the leader uses skills |
| Auto attack, accuracy and evasion, hero resistance, boss interruption and boss debuffs, an Underworld tag on enemies, Seiva | Not in the game; effects are adapted to the click (user decision) |
| Server checks of skill use or damage | Combat runs in the browser (AD-002); no backend change |
| Keeping cooldowns across a page reload | In-memory state of the fight scene |
| Skill animations and sounds beyond damage numbers | Art and VFX are a separate effort |
| Translating the existing English HUD text (`Time:`, enemy stat tags) | TD-001 (AD-007) |

---

## Skill Mechanics

"Base" is the `baseDamage` of the leader's click attacker: the hero's element on the default attacker plus the pieces the leader wears (`attackerFor`). A hit of P % deals what a click with `baseDamage` = Base x P / 100 and the hit's damage type would deal through `calculateDamage` (element, defense, armor pierce, critical roll, boss damage), plus the modifiers of Timed Effects. The monster on screen is "all enemies" and "area".

| Hero | Slot | Skill | CD | Mechanic |
| --- | --- | --- | --- | --- |
| Kael | 1 | Corte Dimensional | 20 s | One PHYSICAL hit of 1500 % with +30 armor pierce added to the attacker's (at most 100) |
| Kael | 2 | Investida do Baluarte | 25 s | One PHYSICAL hit of 400 %; on a boss, the countdown stops for 3 s (Stun) |
| Kael | 3 | Brado Aterrador | 30 s | The monster loses 30 points of physical defense, never below 0, for 10 s |
| Lyra | 1 | Flecha Dupla | 8 s | Two PHYSICAL hits of 300 %, each with its own critical roll |
| Lyra | 2 | Tiro Preciso | 30 s | A 2 s cast, then one PHYSICAL hit of 3000 % that is always critical, crit resistance ignored. Lost if the monster is gone when the cast ends |
| Lyra | 3 | Ventos Ligeiros | 40 s | +50 % click damage for 12 s |
| Orina | 1 | Prisão de Espinhos | 18 s | For 2 s the monster takes +25 % MAGICAL damage; on a boss, the countdown stops for 2 s (Root) |
| Orina | 2 | Tempestade Arcana | 35 s | 6 MAGICAL ticks of 200 %, one per second |
| Orina | 3 | Chuva de Meteoros | 45 s | One MAGICAL hit of 2500 % |
| Seraphine | 1 | Bênção da Grande Árvore | 30 s | For 15 s: +30 % PHYSICAL damage and +25 % click damage |
| Seraphine | 2 | Luz Divina | 25 s | One MAGICAL hit of 800 %, x1.5 against a DARKNESS monster |
| Seraphine | 3 | Carrilhão da Aurora | 45 s | On a boss, +4 s on the countdown at once |
| Vex | 1 | Bomba de Veneno | 15 s | Poison: one PHYSICAL tick per second for 8 s of 100 % per stack, up to 3 stacks |
| Vex | 2 | Bomba de Fumaça | 35 s | +15 points of critical chance (at most 100) for 10 s |
| Vex | 3 | Golpe Sangrento | 20 s | One PHYSICAL hit of 600 %, then Bleed: 6 PHYSICAL ticks of 150 %, one per second |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Who uses skills | Only the leader; the bar shows its three skills | User decision | y |
| Mechanics that do not exist | Adapted to the click as in the Skill Mechanics table; Precisão (Bênção) and "não erram" (Fumaça) have no effect | User decision; map proposed and accepted | y |
| Carrilhão da Aurora | +4 s on the boss countdown at once; no effect on a phase monster | User decision (time shield) | y |
| Leader bonuses | None in this feature | User decision | y |
| Underworld creatures | A monster of element DARKNESS | No Underworld tag exists; Vex, the Underworld spy, is DARKNESS | y |
| Damage of a skill | P % of Base through `calculateDamage`, so element, defense, armor pierce, critical roll and boss damage apply as for a click | One formula for every hit | y |
| Damage types | Kael, Lyra and Vex deal PHYSICAL, Orina and Seraphine MAGICAL; the click stays PHYSICAL | README names magic for Orina and Seraphine; the other effects name physical or nothing | y |
| Ticks (Tempestade, Poison, Bleed) | Never critical; the first tick lands 1 s after the cast; Base and element are taken at the cast; defense, Brado, Prisão and Bênção are read at each tick | Damage over time does not crit; a later leader change does not rewrite a running effect | y |
| Bonus stacking | Click damage bonuses add (Ventos + Bênção = +75 %); click, physical and Prisão bonuses multiply each other | README synergy: attack speed bonuses add up | y |
| Recasting a running effect | Its duration restarts; its value does not stack, except Poison, which adds a stack up to 3 and restarts | README: Poison stacks up to 3 times | y |
| Poison stacking | Kept, though a single Vex cannot reach 2 stacks (cooldown 15 s > duration 8 s) | The README rule is kept for later sources of poison | y |
| Stun and Root together | The countdown stays stopped until the later of the two ends; they do not add | Two freezes of the same timer | y |
| Cooldowns | Start on use, belong to (hero, slot), keep running across monsters, farm and leader changes, and reset on a page reload | A leader switch must not reset a cooldown | y |
| Timed effects across monsters | Effects on the player (Ventos, Bênção, Fumaça) survive a monster's death and a leader change; effects on the monster (Brado, Prisão, Stun, Tempestade, Poison, Bleed) end when it dies or leaves | Buffs belong to the player, debuffs to the monster | y |
| Pause | The pause menu and the hero screens freeze cooldowns, effects, ticks and casts | Same rule as the boss countdown | y |
| Stun and Root tags | None; the boss countdown standing still is their sign. Prisão de Espinhos shows its own tag for its +25 % magical damage | A tag with the same label and seconds as Prisão would repeat it (decided after the Verifier flagged it) | y |
| Enemy stat tags | Keep showing the monster's own defenses while Brado runs | The effect tag shows Brado | y |
| A skill that kills | Counts exactly like a click kill (coins, campaign report, farm win) | One kill path | y |
| On-screen texts | Slot: `<n>s` ready, `<left>s` cooling, `Mirando` casting; effect tag `<skill name> <left>s`, Poison `Bomba de Veneno x<stacks> <left>s`; seconds rounded up | Lesson L-010 | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Use a skill ⭐ MVP

**User Story**: As a player, I want to fire my leader's unlocked skills during a fight so that I kill monsters and bosses faster.

**Why P1**: It is the feature: without it the skill bar is decoration.

**Acceptance Criteria**:

1. WHEN the player clicks an unlocked, ready skill slot of the leader while a living monster is on screen and the fight is not paused THEN the game SHALL apply that skill's mechanic from the Skill Mechanics table.  <!-- event-driven -->
2. WHEN the player presses the key 1, 2 or 3 in the same state THEN the game SHALL use the skill of slot 1, 2 or 3 as if its slot was clicked.  <!-- event-driven -->
3. WHEN a skill is used THEN the game SHALL start its cooldown of the table's seconds for that hero and slot.  <!-- event-driven -->
4. IF the slot is locked, cooling, the fight is paused, a hero screen is open, or no living monster is on screen THEN the game SHALL leave the fight and the cooldown unchanged.  <!-- unwanted-behavior -->
5. WHEN a skill hit lands THEN the game SHALL deal P % of Base as a hit of the skill's damage type through the click damage formula.  <!-- event-driven -->
6. WHEN Corte Dimensional is used with Base 1 against a FIRE monster with physical defense 50 and no critical THEN the game SHALL deal 9.75 damage.  <!-- event-driven -->
7. WHEN Flecha Dupla is used THEN the game SHALL deal two hits of 300 % with one critical roll each.  <!-- event-driven -->
8. WHEN Luz Divina hits a DARKNESS monster THEN the game SHALL deal 1.5 times the damage it deals to the same monster of another element.  <!-- event-driven -->
9. WHEN Chuva de Meteoros, Investida do Baluarte or Golpe Sangrento is used THEN the game SHALL deal one hit of 2500 % MAGICAL, 400 % PHYSICAL or 600 % PHYSICAL.  <!-- event-driven -->
10. WHEN a skill hit or tick lands THEN the game SHALL show its damage number like a click's, larger and peach when critical.  <!-- event-driven -->
11. WHEN a skill hit or tick brings the monster to 0 health THEN the game SHALL handle the kill exactly as a click kill (coins, campaign report or farm win).  <!-- event-driven -->
12. IF the first arrow of Flecha Dupla kills the monster THEN the game SHALL not land the second arrow.  <!-- unwanted-behavior -->
13. WHILE a skill is cooling the game SHALL show its slot with `data-state="cooling"` and the whole seconds left, rounded up, as `<left>s`.  <!-- state-driven -->
14. WHEN a cooldown ends THEN the game SHALL show its slot with `data-state="ready"` and the text `<cooldown>s`.  <!-- event-driven -->
15. WHEN the leader changes THEN the game SHALL show the new leader's slots with the cooldowns that hero's skills still have.  <!-- event-driven -->
16. WHILE the fight is paused the game SHALL freeze every cooldown.  <!-- state-driven -->

**Independent Test**: In the browser against the fake backend, own Kael with 1 star as leader, press 1 on a phase monster and read 15 damage and the slot counting down from `20s`; press 1 again and nothing happens.

---

### P2: Timed effects

**User Story**: As a player, I want buffs, debuffs and damage over time to last their seconds so that I can combine skills.

**Why P2**: Nine of the 15 skills are timed effects; P1 alone covers the instant hits.

**Acceptance Criteria**:

1. WHILE Ventos Ligeiros runs the game SHALL add 50 % to click damage for 12 s.  <!-- state-driven -->
2. WHILE Bênção da Grande Árvore runs the game SHALL add 25 % to click damage and multiply every PHYSICAL hit and tick by 1.3, for 15 s.  <!-- state-driven -->
3. WHILE Ventos Ligeiros and Bênção da Grande Árvore both run the game SHALL deal a Base-1 click on a neutral, defenseless monster for 2.275 damage without a critical (1 x 1.75 x 1.3).  <!-- state-driven -->
4. WHILE Bomba de Fumaça runs the game SHALL add 15 points to the critical chance of every click and skill hit, at most 100, for 10 s.  <!-- state-driven -->
5. WHILE Brado Aterrador runs on a monster the game SHALL compute its PHYSICAL damage with its physical defense minus 30, never below 0, for 10 s.  <!-- state-driven -->
6. WHILE Prisão de Espinhos runs on a monster the game SHALL multiply MAGICAL damage to it by 1.25 for 2 s.  <!-- state-driven -->
7. WHEN Tempestade Arcana is used THEN the game SHALL land 6 MAGICAL ticks of 200 % Base, one each second, starting 1 s after the cast.  <!-- event-driven -->
8. WHEN Bomba de Veneno is used THEN the game SHALL add one Poison stack, at most 3, and restart its 8 s; each second it SHALL land one PHYSICAL tick of 100 % Base per stack.  <!-- event-driven -->
9. WHEN Golpe Sangrento hits THEN the game SHALL start a Bleed of 6 PHYSICAL ticks of 150 % Base, one each second.  <!-- event-driven -->
10. The game SHALL never roll a critical on a tick.  <!-- ubiquitous -->
11. WHEN a running effect is used again THEN the game SHALL restart its duration without stacking its value (Poison excepted).  <!-- event-driven -->
12. WHEN the monster dies or leaves (timeout, leaving the fight, farm switch, realignment) THEN the game SHALL end Brado, Prisão, the Stun and Root stops, Tempestade, Poison and Bleed.  <!-- event-driven -->
13. WHILE Ventos Ligeiros, Bênção or Bomba de Fumaça runs the game SHALL keep it across monster deaths and leader changes until its seconds end.  <!-- state-driven -->
14. WHILE an effect runs the game SHALL show a tag `<skill name> <left>s` in the effects row (`Bomba de Veneno x<stacks> <left>s` for Poison), seconds rounded up, in the order the effects started; Stun and Root show no tag, the stopped countdown shows them.  <!-- state-driven -->
15. WHILE the fight is paused the game SHALL freeze every effect and tick.  <!-- state-driven -->

**Independent Test**: Use Ventos Ligeiros with Lyra and read a Base-1 click dealing 1.5; wait 12 s and read 1 again; the tag `Ventos Ligeiros 12s` counts down and disappears.

---

### P3: Boss control and the aimed shot

**User Story**: As a player, I want control skills to hold the boss's time limit and Lyra's aimed shot to land after its cast so that I beat bosses I could not beat by clicking.

**Why P3**: It only matters on bosses and in one skill.

**Acceptance Criteria**:

1. WHEN Investida do Baluarte hits a boss THEN the game SHALL stop its countdown for 3 s.  <!-- event-driven -->
2. WHEN Prisão de Espinhos is used on a boss THEN the game SHALL stop its countdown for 2 s.  <!-- event-driven -->
3. WHILE a Stun and a Root run together the game SHALL keep the countdown stopped until the later one ends.  <!-- state-driven -->
4. WHEN Carrilhão da Aurora is used on a boss THEN the game SHALL add 4 s to the countdown's time left.  <!-- event-driven -->
5. WHEN Investida do Baluarte, Prisão de Espinhos or Carrilhão da Aurora is used on a phase monster THEN the game SHALL apply only their damage and Prisão's magic bonus.  <!-- event-driven -->
6. WHEN Tiro Preciso is used THEN the game SHALL show its slot with `data-state="casting"` and the text `Mirando` for 2 s.  <!-- event-driven -->
7. WHEN the 2 s cast of Tiro Preciso ends with the same monster alive on screen THEN the game SHALL land one PHYSICAL critical hit of 3000 % Base, ignoring crit resistance.  <!-- event-driven -->
8. IF the monster died or left before the cast ends THEN the game SHALL land nothing and keep the cooldown running.  <!-- unwanted-behavior -->
9. WHILE the fight is paused the game SHALL freeze the cast and the countdown stops.  <!-- state-driven -->

**Independent Test**: On a miniboss with 30 s, use Investida do Baluarte and read the countdown still on the same second 2 s later; use Carrilhão da Aurora and read 4 s more.

---

## Edge Cases

- IF the heroes have not loaded THEN the game SHALL ignore the keys 1, 2 and 3.
- WHEN the leader has 0 stars THEN the game SHALL ignore every slot and key.
- IF a key 1, 2 or 3 is pressed while the pause menu is open THEN the game SHALL not use a skill.
- WHEN the chapter is complete and no monster is on screen THEN the game SHALL ignore skill use.
- WHEN Carrilhão is used repeatedly on one boss THEN the game SHALL add 4 s each time, beyond the starting limit.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SKILL-01 | P1: activation, keys, guards (AC 1-4) | Done | Verified |
| SKILL-02 | P1: skill hits and damage (AC 5-12) | Done | Verified |
| SKILL-03 | P1: cooldown display and leader change (AC 13-16) | Done | Verified |
| SKILL-04 | P2: buffs on the player (AC 1-4, 13) | Done | Verified |
| SKILL-05 | P2: debuffs and damage over time on the monster (AC 5-12) | Done | Verified |
| SKILL-06 | P2: effects row and pause (AC 14-15) | Done | Verified |
| SKILL-07 | P3: Stun, Root and Carrilhão on the countdown (AC 1-5) | Done | Verified |
| SKILL-08 | P3: Tiro Preciso cast (AC 6-9) | Done | Verified |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Each of the 15 skills has a unit test that pins its numbers from the Skill Mechanics table.
- [ ] An e2e test uses a skill by key against the fake backend and reads its damage and cooldown.
- [ ] No backend file changes.
