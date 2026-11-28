# Team Click Damage Specification

**Status**: Approved (owner approval of 2026-11-28, relayed by the orchestrator): the recommended answers of Q1 to Q5 (today's per-hit value, the auto click brings the team, no combo or crits for the team, `Dano: <n>/clique` and `Dano da equipe por clique: <n>`, the light-blue number 8 px right of the click number) and the defaults Q6 to Q14.

Owner request of 2026-11-28 (verbatim): "gostaria de implementar uma nova feature, ao inves do dano da equipe ser por segundo, eu gostaria que eles virassem um dano de clique secundário, ou seja a equipe iria complementar o dano do clique. ao clicar iria aparecer o dano do clique e ao lado o dano da equipe como se fosse um segundo clique."

## Problem Statement

From chapter 5 the allies of the team hit on their own once a second (AD-018), so their damage has nothing to do with what the player does. The owner wants the team to complement the click instead: every click deals the leader's click damage and, right after it, the team's damage, shown as a second number beside the click number. The team stops hitting on a clock.

## Facts From the Code (not decisions)

Checked on `main` at `87d13b6` (2026-11-28).

- **The ally clock.** `AllyCombat` (`game/src/domain/combat/allyCombat.js:5-79`) lands one tick every `ALLY_TICK_MS = 1000` ms of fight time; the first tick lands 1000 ms after a monster appears. `ClickerGame` creates it in `create` (`game/src/adapters/phaser/ClickerGame.js:176`) and calls `allyFrame(delta)` from `update` (`:1213`, method `:1321-1353`) before the skills advance. Each tick lands every fighting ally in slot order on the target read right before its hit (`currentTarget()`, `:941`), stops at a dead target, and shows one light-blue number per monster hit (`ALLY_TEXT` `#7fd4ff`, 28 px, stroke `#1c120c` 10 px, `:108`) at the monster centre + 70 (`allyNumberXOf`, `:1609`: 740 on the main monster, add x + 40 on an add). `onAllyTick` (`:1356`) steps the sprites of the slots that hit 24 px right and back, 100 ms each way.
- **The ally hit.** `SkillCombat.allyHit` (`game/src/domain/skills/skillCombat.js:187`) is the strike of a damage-over-time tick at 100 % (`tickDamage`, `skillDamage.js:52`): never critical, no combo, no Ventos Ligeiros or Bênção click bonus; it meets the one defense, the breaks, Erosão Arcana, Brado Aterrador, Prisão de Espinhos, Bênção's +30 % and the monster affix (`Monster.land`). Its attacker is `allyAttacker` (`allyAttacker.js:12`): Ally Base x star multiplier (2 to 20) x Seraphine's 1.25, the leader's element, the ally's own armor pierce, boss damage and staff.
- **The click.** `hitMonster(pointer)` (`ClickerGame.js:1541`) ignores the click while paused, while a hero screen is open or with no living monster; otherwise it picks the clicked monster as target and calls `strike(x, monster)` (`:1617`): one combo step, one hit (two forced critical hits with Lyra's leader bonus, the second 36 px right, `DOUBLE_HIT_OFFSET`, `:86`, and not landing when the first kills), each with its number from `showDamage` (`:1913`, gold `#ffd35c` 32 px or orange `#ff8a1f` 48 px critical, origin (0.5, 1), rising 40 px and fading over 800 ms), then `afterDamage()` once (`:1656`: health bar, kill path, adds).
- **The auto click** fires from `update` through `autoClickFrame` (`:584`) and calls the same `strike` at the target's centre x (AD-014), at 500 ms (level 0, free from chapter 2) down to 50 ms (level 4), at most 5 per frame. It runs while a hero screen is open (the fight keeps running behind hero screens and in a hidden tab, spec `background-fight`); the pause menu stops `update`.
- **Skills** (`useSkill`, `:1376`) and their damage-over-time ticks are not clicks.
- **Equipe texts.** `teamModel` (`game/src/adapters/phaser/views/teamView.js:15-61`) writes `Dano: <n>/s` on each ally card (`.team-dps-line`, Figtree 600 12 px `--ember-700`) and `Dano da equipe: <n>/s` (`p.team-dps`, `data-testid="team-dps"`, Cinzel 700 18 px) from `allyDamagePerSecond` (`allyAttacker.js:28`), the attacker's base before element, defense and boss factor. The card is 132 px wide with 8 px padding and a 2 px border (`game/public/style.css:3493`): 112 px of content.
- **No offline progress exists.** Nothing in `game/src` or `backend/src/main` computes damage or rewards for time away; a closed tab fights nothing.
- **The backend does not see damage.** `backend/` stores the team composition only (`Team.kt`, `TeamService.kt`, `V12__hero_team.sql`); no endpoint, table or check reads ally damage, DPS or click rate. Kills are capped by `kill-interval-ms` 1500 with a bucket of 20 (AD-002, `Chapter.kt:196`); a kill already takes at least 1500 ms of cycle (500 ms fade + 1000 ms respawn, `ClickerGame.js:53`), so a faster team cannot outrun the cap.
- **Timed fights.** Minibosses (45 s) and chapter bosses (90 s) have time limits (AD-030); Kael's passive adds 5 s. No rule reads the ally clock.
- **Player-facing text that names the rhythm**: the two Equipe lines above, and `README.md:48` ("Cada aliado ataca sozinho uma vez por segundo...").
- **Tests pinned to the clock.** Unit: `allyCombat.test.js` (13 cases), `ClickerGame.test.js` describes `ClickerGame hero team`, `ClickerGame hero team formation`, `ClickerGame miniboss adds` and `ClickerGame miniboss target`. E2E: `heroTeamCombat.spec.js`, `heroTeamField.spec.js`, `heroTeamPassives.spec.js`, `heroTeam.spec.js`, `heroTeamEditing.spec.js`, `heroTeamStyle.spec.js`, `minibossAddsTarget.spec.js`, `monsterAffixes.spec.js`; the `freeze` helpers of eight e2e files and three `game/ui-review/*.shots.js` files write `allies.untilTickMs`. Every one is named in `tasks.md`.

## Goals

- [ ] Every click that lands while the team fights is followed, in the same instant, by one hit of every fighting ally; nothing else makes the team hit.
- [ ] The player sees the click number and, 8 px to its right, the team number of that click.
- [ ] No player-facing text says the team hits per second.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Backend changes, migrations | The backend never sees damage (Facts); team composition, slots and prices stay as AD-018 |
| A new team damage formula, a scale factor, crits or the combo on the team | Q1, Q3: the per-hit damage stays the one of AD-018 / Q46 of `hero-team` |
| Skills or their ticks bringing the team | Q6: a skill is not a click |
| Merging the numbers of several clicks or capping how many numbers show | Q8: each click shows its own pair, like click numbers today |
| Offline or away progress | None exists (Facts); nothing is added or removed |
| Changing the auto click rates, its price or its unlock | Not asked; the team follows whatever clicks the auto click makes |
| New art, new sounds, a new number colour | Q5: the existing light-blue ally number is kept |
| Rewriting the `hero-team` spec | History: AD-035 records what changes |
| Phone layout | PC only |

---

## Assumptions & Open Questions

Q1 to Q5 were product decisions for the owner; Q6 to Q14 product owner defaults. The owner accepted every row as written on 2026-11-28.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** How much the team deals per click (owner) | **Recommended**: one hit of each fighting ally per click, with exactly the damage one tick deals today (Ally Damage of `hero-team`, unchanged). Consequence: the team's damage grows with the click rate: x2 with the free auto click (500 ms), up to x20 with auto click level 4 (50 ms), plus manual clicks; a player who neither clicks nor uses the auto click gets no team damage. Alternative: divide the per-click hit by a fixed click rate (for example 1/6) so the team keeps about its old damage per second; numbers on screen would read 0.3 instead of 2 | The owner asked the team to "complement the click like a second click"; the same per-hit value keeps every formula, test value and Equipe number; the chapter tables (AD-030) were fitted without allies, so a stronger team breaks no wall | y (owner, 2026-11-28) |
| **Q2** Does the auto click bring the team (owner) | **Recommended**: yes. An auto click is a click (AD-014, same `strike` path), so it brings one team strike | Without it the team stops working for idle play, which the free auto click at 500 ms covers today | y (owner, 2026-11-28) |
| **Q3** Combo, critical hits and click bonuses on the team (owner) | **Recommended**: none, as today (`hero-team` Q46): the team hit is never critical, gets no combo, no Ventos Ligeiros and no Bênção click bonus; it keeps the defense, breaks, Erosão, Brado, Prisão, Bênção's +30 % and the monster affix | "Second click" is about how it reads, not about copying the click formula; the leader's click power stays the leader's | y (owner, 2026-11-28) |
| **Q4** Equipe texts (owner) | **Recommended**: ally card `Dano: <n>/clique`, team line `Dano da equipe por clique: <n>`; the number stays the same value as today | `Dano por clique: <n>` needs about 130 px at Figtree 600 12 px and the card has 112 px; `Dano: 12.5K/clique` is about 105 px | y (owner, 2026-11-28) |
| **Q5** How the team number looks (owner) | **Recommended**: the existing light-blue ally number (`#7fd4ff`, 28 px, Cinzel 700, `#1c120c` stroke 10 px), left edge 8 px right of the right edge of the click number, on the same baseline, rising and fading with it | The owner chose light blue for allies (`hero-team` Q12) and its contrast was fixed (TD-013); beside the click number reads as "a second click" | y (owner, 2026-11-28) |
| **Q6** Skills | A skill use, a skill hit and a damage-over-time tick bring no team strike | A skill is not a click (Facts); keeps skills and clicks distinct (AD-012) | y (owner, 2026-11-28) |
| **Q7** Lyra's double click | One team strike per click, after both hits; its number follows the second click number | One click is one click; the second number is the last one on screen | y (owner, 2026-11-28) |
| **Q8** Rapid clicks | Every click shows its own click number and team number; nothing merges, nothing is capped | Click numbers already behave so; at most about 48 numbers live at once (20 auto + 4 manual clicks a second, 800 ms each) | y (owner, 2026-11-28) |
| **Q9** The click kills its target | No team hit lands when the click killed the main monster. When the click killed an add, the team hits the new target (the main), as a second click would; that number stands at the main's ally number place (x 740) | The target seam of AD-027 already hands a dead add's target to the main | y (owner, 2026-11-28) |
| **Q10** A team hit kills | Handled once with the click (coins, report or farm win, next encounter); the later slots do not land | Same rule as the tick (AD-018) and the auto click burst | y (owner, 2026-11-28) |
| **Q11** Monster affixes | Each ally hit is one strike through `Monster.land`, as today: on Escudo de golpes the click takes one charge and each ally hit one more | AD-030: every strike goes through the affix; changing it is balance work not asked for | y (owner, 2026-11-28) |
| **Q12** Time limits of minibosses and chapter bosses | Unchanged; a boss is still beaten by clicks, now with the team on every click | The team cannot hit without a click, so a player who stops clicking with the auto click off loses the team's help, which is the change the owner asked for | y (owner, 2026-11-28) |
| **Q13** Code and test identifiers | The CSS classes `.team-dps`, `.team-dps-line`, `data-testid="team-dps"` and the model fields `dpsText`, `teamDpsText` keep their names; `allyDamagePerSecond` becomes `allyDamagePerClick` (same value) | Identifiers are not player-facing; renaming them only churns tests | y (owner, 2026-11-28) |
| **Q14** Delivery | The feature ships as one release on a branch `ci/team-click-damage`; `main` gets it only when the CI run of the last task is green | Between the scene change and the test migration the e2e suite is red; the watcher deploys every game commit on `main` | y (owner, 2026-11-28) |

**Open questions:** none - all resolved (owner approval of 2026-11-28).

---

## Examples

Every example: leader Kael 0 stars (FIRE), no pieces, no talent, critical roll 0.99 (no critical), campaign at chapter 5 with the chapter 5 boss won, auto click off, monster FIRE with defense 0 and critical resistance 0, unless the row says otherwise. Ally Base 1, star multiplier 2 at 0 stars and 20 at 9 stars, so Lyra 0 stars deals 2.

| # | Setup | One click (or the action named) | Result |
| --- | --- | --- | --- |
| E1 | Lyra 0 stars in slot 1, monster 10 health | one click | gold `1` at the click x, light-blue `2` right of it; health 7, `HP 7/10` |
| E2 | Lyra and Orina 0 stars in slots 1 and 2, monster 10 health | one click | gold `1`, one light-blue `4`; health 5 |
| E3 | Lyra 9 stars and Orina 0 stars, monster 10 health | one click | gold `1`, light-blue `20`; the monster dies once (coins, next encounter); Orina does not hit |
| E4 | Lyra 0 stars, monster 1 health | one click | gold `1`; the monster dies; no light-blue number; no ally sprite steps |
| E5 | Lyra and Seraphine 0 stars, monster 10 health | one click | gold `1`, light-blue `5` (2.5 + 2.5); health 4 |
| E6 | Leader Lyra 0 stars (NATURE), Kael 0 stars in slot 1, NATURE monster 1000 health, roll 0 | one click | orange `2` at x, orange `2` at x + 36, light-blue `2` right of the second; health 994 |
| E7 | Chapter 11 miniboss of 100 health with Lacaio 1 of 2 health and Lacaio 2 (fixture of `minibossAddsTarget.spec.js`), Lyra and Vex 0 stars | one click on Lacaio 1 | gold `1` on Lacaio 1; Lyra's `2` kills it (light-blue, right of the gold number, y 360); Vex hits the miniboss for 0.42, light-blue `0.4` at (740, 273); miniboss health 99.58 |
| E8 | Lyra 0 stars, auto click on at level 0 (500 ms), monster 1000 health | 500 ms of fight | one auto click: gold `1` at x 670, light-blue `2`; health 997; 499 ms more change nothing |
| E9 | Lyra 0 stars, monster 10 health | 10 000 ms with no click | health 10; no light-blue number |
| E10 | Chapter 5 miniboss of 100 health with Escudo de golpes 3, Lyra 0 stars | one click | `Escudo de golpes: 1/3`; health 100 |
| E11 | Orina 0 stars in slot 1, monster with defense 40 (shown `Defesa 25%`) | one click | click 0.75 and Orina 1.5: 2.25 dealt |
| E12 | Lyra 0 stars, `COMBO` 10 (cap 50 %), monster 1000 health | three clicks | clicks 1, 1.01, 1.02 and three light-blue `2`; health 990.97 |
| E13 | Lyra 0 stars, campaign at chapter 4 | one click | gold `1`, no light-blue number; health 9 |

---

## User Stories

### P1: The team strikes with every click ⭐ MVP

**User Story**: As a player from chapter 5, I want my allies to hit together with each of my clicks so that my clicks carry the team's damage.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHEN a click (manual or auto click) lands its hit or hits while the team fights THEN the game SHALL land, right after them and before the health bar and the kill path run, one hit of every fighting ally in slot order (E1, E2).  <!-- event-driven -->
2. WHEN an ally hit lands with a click THEN the game SHALL compute it exactly as the ally hit of `hero-team` (Ally Damage: the strike of a tick at 100 %, the leader's element, the one defense, never critical), so Lyra 0 stars deals 2 to a FIRE monster of defense 0 under Kael (E1) and 1 at defense 50.  <!-- event-driven -->
3. WHEN a click with the combo running brings a team strike THEN the game SHALL leave every ally hit without the combo bonus: three clicks with `COMBO` 10 leave a monster of 1000 at 990.97 (E12).  <!-- event-driven -->
4. WHEN the auto click fires while the team fights THEN the game SHALL bring one team strike with each auto click: 500 ms at level 0 leave a monster of 1000 at 997 (E8).  <!-- event-driven -->
5. WHEN Lyra's leader bonus makes a click land two hits THEN the game SHALL bring one team strike, after the second hit (E6).  <!-- event-driven -->
6. IF the click kills the main monster THEN the game SHALL land no ally hit for that click (E4).  <!-- unwanted-behavior -->
7. WHEN the click kills the add it hit and the miniboss lives THEN the game SHALL land the team strike on the new target, the miniboss (E7).  <!-- event-driven -->
8. WHEN an ally hit of a click brings the monster to 0 health THEN the game SHALL handle the kill once (coins or farm win, report, next encounter) and SHALL NOT land the hits of the later slots (E3).  <!-- event-driven -->
9. WHEN a skill is used or a damage-over-time tick lands THEN the game SHALL land no ally hit.  <!-- event-driven -->
10. WHILE the campaign is below chapter 5, or no bought slot holds a hero, or the heroes have not loaded, the game SHALL land no ally hit with a click (E13).  <!-- state-driven -->
11. WHEN a click on a monster with Escudo de golpes brings a team strike THEN the game SHALL take one charge for the click hit and one for each ally hit (E10).  <!-- event-driven -->

**Independent Test**: In the browser at chapter 5 with Lyra in slot 1, a real mouse click on a monster of 10 health leaves `HP 7/10` with a gold `1` and a light-blue `2`.

---

### P1: The team never hits on its own ⭐ MVP

**User Story**: As a player, I want the team to hit only when I click so that the team is part of my click, not a clock.

**Why P1**: The owner asked to replace the per-second damage, not to add to it.

**Acceptance Criteria**:

1. WHILE no click lands the game SHALL land no ally hit, whatever time passes: 10 000 ms with no click leave a monster of 10 at 10 (E9).  <!-- state-driven -->
2. The game SHALL have no ally clock: no timer, counter or frame step lands ally hits.  <!-- ubiquitous -->
3. WHILE the pause menu is open the game SHALL land no click and no ally hit.  <!-- state-driven -->
4. WHILE a hero screen is open the game SHALL ignore a manual click on the canvas and SHALL bring one team strike with each auto click.  <!-- state-driven -->

**Independent Test**: At chapter 5 with Lyra in slot 1 and the auto click off, 10 s of fight leave the monster at full health with no light-blue number.

---

### P1: The team number stands beside the click number ⭐ MVP

**User Story**: As a player, I want to see the team's damage next to my click's damage so that each click reads as two hits.

**Why P1**: The owner described the display ("ao lado o dano da equipe como se fosse um segundo clique").

**Acceptance Criteria**:

1. WHEN a team strike of a click lands on the monster the click hit THEN the game SHALL show one number with the sum of that monster's ally hits (`formatDamage`), in the ally style (`#7fd4ff`, 28 px, Cinzel 700, stroke `#1c120c` 10 px), never critical.  <!-- event-driven -->
2. WHEN that number shows THEN its left edge SHALL stand 8 px right of the right edge of the last click number of the same click (origin (0, 1) at x = click number x + click number width x (1 - its origin x) + 8) and its baseline SHALL be the click number's baseline.  <!-- event-driven -->
3. WHEN the team number shows THEN it SHALL rise 40 px and fade to 0 over 800 ms, starting in the same frame as the click number.  <!-- event-driven -->
4. WHEN a team strike of a click lands hits on a monster other than the one the click hit (E7) THEN the game SHALL show that monster's sum centred at its ally number place: x 740 and the damage text y on the main monster, the add's x + 40 and y on an add.  <!-- event-driven -->
5. WHEN two clicks land in a row THEN the game SHALL show each click's own click number and team number; numbers SHALL NOT merge or replace each other.  <!-- event-driven -->
6. WHEN a team strike lands THEN the game SHALL step the sprite of every slot that hit 24 px right and back, 100 ms each way, restarting a step still running.  <!-- event-driven -->
7. IF a click lands no ally hit THEN the game SHALL show no light-blue number for it and step no sprite (E4, E13).  <!-- unwanted-behavior -->

**Independent Test**: One click at chapter 5 with Lyra in slot 1 shows a gold `1` and, its left edge 8 px right of the gold number, a light-blue `2` on the same baseline.

---

### P1: Equipe speaks of damage per click ⭐ MVP

**User Story**: As a player, I want the Equipe screen to tell me what each ally adds to a click so that the numbers match what I see in the fight.

**Why P1**: `Dano: <n>/s` would be false after the change.

**Acceptance Criteria**:

1. WHEN Equipe shows an ally card THEN its damage line SHALL read `Dano: <n>/clique`, `<n>` the same value as today (Ally Base x star multiplier x team factor, `formatDamage`): Lyra 0 stars reads `Dano: 2/clique`, Lyra 9 stars with a 624 weapon reads `Dano: 12.5K/clique`.  <!-- event-driven -->
2. WHEN Equipe shows the team line THEN it SHALL read `Dano da equipe por clique: <n>` with the sum of the allies' lines: Lyra and Seraphine read `Dano: 2.5/clique` each and `Dano da equipe por clique: 5`; no ally reads `Dano da equipe por clique: 0`.  <!-- event-driven -->
3. The ally damage line SHALL stay on one line inside the card's 112 px content box for every value `formatDamage` writes (up to `999.9K`): `white-space: nowrap`, its box within the card's padding box.  <!-- ubiquitous -->
4. The game SHALL show no text with `/s` or `por segundo` about the team.  <!-- ubiquitous -->

**Independent Test**: Equipe with Lyra 9 stars holding a 624 click weapon reads `Dano: 12.5K/clique` on one line and `Dano da equipe por clique: 12.5K`.

---

### P2: The README tells how the team fights

**User Story**: As someone reading the project, I want the README to say the team hits with the click so that it matches the game.

**Why P2**: Documentation, not gameplay.

**Acceptance Criteria**:

1. The `README.md` team bullet SHALL read: `Cada aliado ataca junto com cada clique do jogador (manual ou auto clique), com o mesmo dano de todos os golpes, e traz uma passiva enquanto está na equipe.`  <!-- ubiquitous -->

---

## Edge Cases

- IF the click kills the main monster THEN the game SHALL land no ally hit and show no light-blue number (E4).
- IF Lyra's first hit kills THEN the second hit SHALL NOT land and the team strike SHALL find the main dead and land nothing.
- WHEN the click kills its add and an ally hit then kills the next target THEN later slots SHALL NOT land and the kill SHALL be handled once.
- WHEN a leader change, a piece equipped on an ally, a fusion or a team change happens THEN the next click's team strike SHALL use it.
- WHEN a farm fight (Rever chefes) runs from chapter 5 THEN clicks SHALL bring team strikes as in the campaign.
- WHEN the campaign resets to chapter 1 THEN clicks SHALL bring no team strike until chapter 5.
- WHEN Prisão de Espinhos or Bênção da Grande Árvore runs at the click THEN the ally hits of that click SHALL get it (2.5 and 2.6 for Lyra 0 stars), and SHALL NOT once it ended (2).
- WHEN five clicks land in a row on a monster of 1000 with Lyra and no combo THEN the game SHALL show five gold `1` and five light-blue `2` and leave 985.
- WHEN a boss's time limit runs out THEN the game SHALL handle it as today; the team does not change the countdown (Kael's +5 s stays).

---

## Player-Facing Texts

| Where | Text |
| --- | --- |
| Ally card damage line (`.team-dps-line`) | `Dano: <n>/clique` |
| Team line (`p.team-dps`) | `Dano da equipe por clique: <n>` |
| `README.md` team bullet | `Cada aliado ataca junto com cada clique do jogador (manual ou auto clique), com o mesmo dano de todos os golpes, e traz uma passiva enquanto está na equipe.` |

Numbers on the canvas use `formatDamage` (one decimal, K/M/B/T from 1 000).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TCD-01 | P1: The team strikes with every click | Tasks | Implementing |
| TCD-02 | P1: The team never hits on its own | Tasks | Implementing |
| TCD-03 | P1: The team number stands beside the click number | Tasks | Implementing |
| TCD-04 | P1: Equipe speaks of damage per click | Tasks | In Tasks |
| TCD-05 | P2: The README tells how the team fights | Tasks | In Tasks |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `git grep -n "ALLY_TICK_MS\|AllyCombat\|allyFrame\|untilTickMs\|allyDamagePerSecond" game/src game/e2e game/ui-review` prints nothing.
- [ ] `git grep -n "/s'\|/s\`\|por segundo" game/src/adapters/phaser/views/teamView.js` prints nothing.
- [ ] Every scenario of `game/e2e/teamClickDamage.spec.js` and every re-pinned e2e file passes in the CI run of the release commit.
- [ ] The `ui-artist` review of the click pair and Equipe is APROVADO.
