# Miniboss Adds and Targeting Specification

## Problem Statement

Every fight is one monster, so the only decision is when to fire skills. The owner wants minibosses after chapter 10 to come with add monsters that strongly buff the miniboss's defense. The player then chooses the target: kill the adds first to drop the buff, or go straight for the boss. This feature adds the adds, their per-chapter defense buff, and target selection for the click, the auto click and the allies of `hero-team`. It also makes every damage skill hit all enemies. It is feature 3 of the split in `.specs/features/hero-team/spec.md` (Feature Split) and needs chapters 11 to 15 from `campaign-chapters`.

**Revision of 2026-11-19.** Written on 2026-10-31, before `unified-damage` (AD-021, released as v0.5.0) and `hero-team` (AD-018, accepted on 2026-11-19 at `3e8ff62`). This revision: (1) replaces the physical and magical add buffs and the `defenseType` field by one buff of the one `defense` per add (AD-021), so the Add Table, the worked examples, Adds AC 4 to 7 and 10 and the edge case of the two physical adds are rewritten; (2) drops Q35 and the Out of Scope row "Adds raising team resistance": there is no team resistance, and ally hits meet the buffed defense like every strike (`hero-team` Q35, Q46); (3) plugs the target into the shipped `hero-team` seams (`AllyCombat` `target()`, the formation at x 410 or less); (4) re-checks every fact against `main` at `3e8ff62`; (5) adds the exact layout and texts. The old counterplay "a magical leader or the team can go straight in" no longer exists, so six new questions (Q47 to Q52) go to the owner; design and tasks use their recommended defaults.

## Facts From the Code (not decisions)

Re-checked on `main` at `3e8ff62` (2026-11-19).

- Combat runs in the browser (AD-002). The server sees only the outcome report of the miniboss (`CLEARED` or `FAILED`, AD-004), so the adds change no server rule.
- The stage definition (health, enemies, time limit, drop rules) comes from the backend in the progress payload and in the farm payload (`definition.stages[]`, `ProgressController.kt:44` `StageResponse`, reused by `FarmController.kt:44`); the game types no stage number (`stages`). Chapters are stored rows seeded once by `ChapterSeeder`, which never overwrites a stored chapter; catalog changes to stored rows go through a Flyway migration that only touches seeded values (`V4`, `V9`, `V11`).
- One damage (AD-021): every strike meets the one `defense`. The order of the reductions is: the stats the hit meets are `monsterAfterBreak(stats, talents, passives)` (`Quebra de defesa` points and Orina's Erosão Arcana -15 off the defense, floor 0; `game/src/domain/talents/talents.js`), read at every hit through `SkillCombat` `statsOf` (`ClickerGame.js:147`); then Brado Aterrador removes `30 x f` points (`skillDamage.js` `strike`); then armor pierce scales what is left (`damage.js` `calculateDamage`: `base x element x (1 - defense x (1 - pierce / 100) / 100) x critical x boss`).
- Miniboss defense of chapter c, stage n: `min(10 + n + 20 + 3(c - 5), 80)` for c of 6 or more (`Chapter.kt:135` `defenseBonus`, `:162`). Chapter 11 stage 1 is 49, chapter 15 stage 1 is 61, chapter 15 stage 10 is 70, so the cap 80 is never reached by a miniboss. The schema bound of any defense is 90 (`EnemyStats.MAX_DEFENSE`, `Chapter.kt:17`; `enemies` check `0 to 90`). Phase monsters have defense 0 and critical resistance 0, with the stage's element, which is also the miniboss's element (`Chapter.kt:161`, `:174`).
- Health is 64-bit (AD-019): the phase monster of chapter c, stage n has `(40 + 4(n - 1)) x 256 x 2^(c - 5)` health and the miniboss 5 times that. Chapter 11 stage 1: phase monster 655 360, miniboss 3 276 800. Chapter 15 stage 1: phase monster 10 485 760, miniboss 52 428 800. The miniboss limit is 30 s (`MINIBOSS_TIME_LIMIT_MS`).
- A skill of level L multiplies its damage percents and effect strength by `1 + 0.25 x (L - 1)` (`skillLevel.js` `levelFactor`, AD-020).
- The farm replays any reached chapter with that chapter's definition (AD-024, `ClickerGame.js` `farmEncounterFor`, `campaign.js:26` `farmEncounterOf`), so a farm fight of a chapter 11 to 15 miniboss reads the stages of that chapter.
- The monster is a translucent cream placeholder rectangle `MONSTER = { x: 670, y: 440, width: 220, height: 250, color: 0xf5ead8, fillAlpha: 0.35 }` (`ClickerGame.js:42`): x 560 to 780, y 315 to 565, with no art. Its health bar (240 x 16) has its top at y 281; damage numbers rise from `damageTextY` = 273 (`ClickerGame.js:196`). The HP text `HP <health>/<max>` sits on that bar (`.hud-monster-hp`, 240 x 16).
- **Any click on the canvas hits the monster**, not only a click on its body (`ClickerGame.js:200`, `hitMonster` at `:1248`); a click on the body shows its number where it landed, any other click at the monster centre x (`damageTextX`, `:1535`). The old fact "a click counts only when it lands on a living monster" is wrong. The auto click is a full click at the monster centre x (`autoClickFrame`, `:518`).
- `SkillCombat` is single-target: `follow(monster)` (`skillCombat.js:36`) ends every debuff, every damage over time, the aimed shot and the Stun/Root stop as soon as a different monster is hit. Debuffs and damage over time live in two flat lists. So a fight with several monsters needs the effects kept per monster.
- `hero-team` seams (`allyCombat.js`): `AllyCombat.advance(ms, { monster, allies, hit, target = () => monster })` (`:18`) restarts its 1000 ms clock only when `monster` changes, reads `target()` right before every ally hit and ends the tick on a missing or dead target (`land`, `:59`). The scene does not pass `target` yet (`ClickerGame.js:1044` `allyFrame`). Ally numbers are light blue `#7fd4ff` 28 px at the monster centre + 70 (x 740) (`ALLY_TEXT`, `ALLY_TEXT_OFFSET`, `:82`).
- The `hero-team` formation keeps every hero at x 410 or less: leader box x 230 to 410 (y 360 to 600), ally slot 3 at (75, 462) since T30 (`ClickerGame.js:31-37`). The team passives (Orina -15 defense, Vex -15 critical resistance) reach every monster through `statsOf`.
- Scene boxes near the adds column (scene px, 1024 x 768): element wheel x 6 to 210, y 121 to 327; effect tags (512, 96), 640 x 40 (bottom y 116); combo (670, 150), 260 x 44 (y 128 to 172); enemy box `.hud-enemy` (670, 596), 460 x 80 (x 440 to 900, y 556 to 636), a column holding the weak chip and the enemy chips; battle bar top y 624.
- Effect tags show the running buffs, debuffs and damage over time (`ClickerGame.js:974` `refreshSkillUi`, `skills.effectsWithOwner()`).
- The latest Flyway migration is `V12__hero_team.sql`; the next free version is **V13**. `PreviousBackendCompatibilityIT` pins the release before the newest migration (`PREVIOUS_LAST_VERSION = 11` today).

## Goals

- [ ] From chapter 11, every miniboss fight (campaign and farm) starts with the miniboss and 2 adds, and each living add raises the miniboss's one defense by the amount of the Add Table, at most 90.
- [ ] The player picks the target with a click, and the auto click and the allies hit that target.
- [ ] Every damage skill hits every living monster of the fight.
- [ ] The fight is won when the miniboss dies, with or without adds alive, and lost on the countdown as today.
- [ ] Fights of chapters 1 to 10, phase monsters and every chapter boss stay exactly as today.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Adds on chapter bosses or phases | The owner named minibosses |
| Adds that attack, heal or respawn | Not asked; the only add effect is the defense buff |
| Art for adds | The monster itself has no art yet: adds are the same placeholder rectangle at half size |
| Rewards for killing adds | Owner decision (Q24): none |
| Server-side check of targets or kills | AD-002 |
| A keyboard key to switch targets | Owner decision (Q22) |
| A damage type, a second defense or a team resistance | AD-021: one damage and one defense everywhere (replaces the old row "Adds raising team resistance") |
| More than 2 adds per miniboss | The layout has 2 places (Q38); the data allows 0 to 2 |

---

## Add Table

Owner decision for chapters 11 and 15 (Q21) and chapters 12 to 14 (Q39), rewritten for one defense (AD-021): each value is the buff of the one `defense`. Both adds of a chapter have the same buff (Q48). `Lacaio 1` and `Lacaio 2` are listed in that order.

| Chapter | Lacaio 1 buff | Lacaio 2 buff | Add health |
| --- | --- | --- | --- |
| 1 to 10 | no adds | no adds | - |
| 11 | +30 defense | +30 defense | 3 x phase monster health of the stage |
| 12 | +35 defense | +35 defense | 3 x phase monster health |
| 13 | +40 defense | +40 defense | 3 x phase monster health |
| 14 | +45 defense | +45 defense | 3 x phase monster health |
| 15 | +50 defense | +50 defense | 3 x phase monster health |

Rules:

- **Guarded defense**: the miniboss's defense is `min(own defense + sum of the buffs of the living adds, 90)`. Every other reduction applies after it, in today's order: `Quebra de defesa` and Erosão Arcana (floor 0), then Brado Aterrador, then armor pierce.
- An add has the stats of the stage's phase monster (the stage's element, defense 0, critical resistance 0 as seeded), its own health and no drop rule.
- **Chapter 11 stage 1** (miniboss defense 49, phase monster 655 360, add 1 966 080, miniboss 3 276 800):

  | Adds alive | Miniboss defense | Base-1 hit, element 1.0, no critical |
  | --- | --- | --- |
  | 2 | 90 | 0.1 |
  | 1 | 79 | 0.21 |
  | 0 | 49 | 0.51 |

  With Brado Aterrador level 1 running on the miniboss: 60 (0.4), 49 (0.51), 19 (0.81). With `Quebra de defesa` 5: 85 (0.15), 74 (0.26), 44 (0.56).
- **Chapter 15 stage 1** (miniboss defense 61): 2 adds 90, 1 add 90 (61 + 50 = 111, capped), 0 adds 61.
- **One living add keeps the miniboss at 90** from chapter 12 stage 4 (52 + 3 + 35 = 90) and on every stage of chapters 13 to 15 (Q48). Per stage 1 and stage 10:

  | Chapter | Stage 1: 2 / 1 / 0 adds | Stage 10: 2 / 1 / 0 adds |
  | --- | --- | --- |
  | 11 | 90 / 79 / 49 | 90 / 88 / 58 |
  | 12 | 90 / 87 / 52 | 90 / 90 / 61 |
  | 13 | 90 / 90 / 55 | 90 / 90 / 64 |
  | 14 | 90 / 90 / 58 | 90 / 90 / 67 |
  | 15 | 90 / 90 / 61 | 90 / 90 / 70 |

- **What the plans cost** (chapter 11 stage 1, Base-1 hits, before breaks): straight at the miniboss with both adds alive, 3 276 800 / 0.1 = 32.8 M raw damage; both adds first, 2 x 1 966 080 + 3 276 800 / 0.51 = 10.4 M. Killing the adds is the cheap plan; lowering the guarded defense (Q47) is the other one.

## Target and Skill Rules

- **Target**: the miniboss is the target when a fight with adds starts. A click on a living monster hits it and makes it the target. A click on no monster hits the target (Q51). When the target add dies, the target goes back to the miniboss.
- **What hits the target**: the auto click and every ally hit (`hero-team`). A manual click on a monster hits that monster; Lyra's double critical click lands both hits on it.
- **Damage skills hit every living monster** (owner decision Q23), each monster with its own defense, its own debuffs and its own damage number: Corte Dimensional, Investida do Baluarte, Flecha Dupla, Tiro Preciso, Tempestade Arcana, Chuva de Meteoros, Luz Divina, Bomba de Veneno, Golpe Sangrento (Q41):
  - **Order** (Q50): a skill lands on `Lacaio 1`, then `Lacaio 2`, then the miniboss, all hits of one monster before the next; damage over time ticks and the aimed shot follow the same order. An add killed earlier in the same skill or tick no longer guards the miniboss hit that follows.
  - Flecha Dupla shoots two arrows at each monster, each with its own critical roll; if the first arrow kills a monster, its second arrow does not land.
  - Tiro Preciso lands at the end of its cast on every monster alive at that moment, each a critical hit; it is lost if the miniboss is gone.
  - Tempestade Arcana, Bomba de Veneno and the Bleed of Golpe Sangrento run on each monster they were cast on; each monster's ticks meet that monster's defense. Bomba de Veneno adds a stack to each monster.
- **Debuff skills without damage** (Q40): Brado Aterrador and Prisão de Espinhos apply to every living monster. Stun, Root and Carrilhão act on the countdown once per use, as today.
- **Effects per monster**: debuffs and damage over time belong to the monster they were put on and end when it dies. The effect tags show the player's buffs and the target's debuffs and damage over time (Q52).
- **End**: the miniboss dying wins the fight, and the adds still alive fade out with it. The countdown reaching 0 fails the fight as today and removes every monster at once. An add dying fades out, does not respawn and pays nothing.

## Fight Layout

Owner decisions Q25 (marker) and Q38 (positions); target text by Q49. Scene px, 1024 x 768. Adds are drawn only while a fight with adds runs.

| Element | Lacaio 1 | Lacaio 2 | Miniboss |
| --- | --- | --- | --- |
| Body (placeholder `0xf5ead8`, alpha 0.35, like the miniboss) | centre (480, 360), 110 x 125: x 425 to 535, y 297.5 to 422.5 | centre (480, 540), 110 x 125: x 425 to 535, y 477.5 to 602.5 | unchanged: centre (670, 440), 220 x 250 |
| Health bar (back `0x2a1410`, fill `0xc0392b`), 10 px above the body | 100 x 8, top-left (430, 279.5) | 100 x 8, top-left (430, 459.5) | unchanged: 240 x 16, top y 281 |
| Buff text `+<buff> de defesa`: Figtree 700 12 px, `#ffffff`, stroke `#2a1408` 3 px, origin (0.5, 1) | (480, 276.5) | (480, 456.5) | - |
| Target marker: gold `#ffd24a` triangle 16 px wide, 10 px high, pointing down, depth 0.9 (under the damage numbers) | tip at (480, 258.5) | tip at (480, 438.5) | tip at (670, 275), 6 px above its bar |
| Damage numbers (click, skill, tick) | x: the click x on the body, else 480; bottom at y 360 | x as Lacaio 1; bottom at y 540 | unchanged: y 273 |
| Ally number (light blue) | x 520, bottom at y 360 | x 520, bottom at y 540 | unchanged: x 740, y 273 |

- Lacaio 2's body ends at y 602.5, 21.5 px above the battle bar (y 624). The add column (x 425 to 535) is right of the formation (x 410 or less) and left of the miniboss (x 560 or more). Lacaio 2 shares x 440 to 535 and y 556 to 602.5 with the 460 x 80 px enemy box (x 440 to 900, y 556 to 636); the box's rows are centred on x 670, and no row (target chip, weak chip, enemy chips) may intersect Lacaio 2's body.
- **Target chip** (Q49): a new first row of the enemy box, `div.target-chip` (`data-testid="target-chip"`) with the text `Alvo: <name> · HP <health>/<max>` (`<name>` is `Miniboss`, `Lacaio 1` or `Lacaio 2`; the HP part is the `healthText` of the target, e.g. `HP 2M/2M`). Figtree 700 12 px, color `--parchment-100`, background `--chip-bg`, border 1 px solid `--gold-400`, radius 999 px, padding 3 px 10 px; hidden while empty. The weak chip and the enemy chips under it describe the target, buff included.
- The miniboss's big bar and its `HP` text always show the miniboss (unchanged). Each add's small bar shows its own health.
- The marker and the target chip show from the start of a fight with adds until the fight ends (miniboss dead or countdown), also after both adds died. Fights without adds show neither.

## Player-Facing Texts

Every new text, exactly (AD-007, L-010):

| Where | Text |
| --- | --- |
| Buff text above each add | `+<buff> de defesa` (chapter 11: `+30 de defesa`) |
| Target chip | `Alvo: Miniboss · HP <health>/<max>`, `Alvo: Lacaio 1 · HP <health>/<max>`, `Alvo: Lacaio 2 · HP <health>/<max>` (` · ` is a space, U+00B7, a space) |

---

## Assumptions & Open Questions

Rows `Q20` to `Q25` and `Q38` to `Q41` carry the owner's answers of 2026-10-30 and 2026-10-31, rewritten for AD-021 where marked. `Q47` to `Q52` are new questions with the recommended default, on which design and tasks are written. Rows marked `n` without a Q number are product owner defaults.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q20** Which chapters | Chapters 11 to 15, in campaign fights and farm fights of those minibosses | Owner answer | y |
| **Q21** Count and strength (rewritten for AD-021) | 2 adds per miniboss with 3 x phase monster health. Chapter 11: each add +30 defense. Chapter 15: each add +50 defense (the old "+50 physical / +50 magical" is one defense now). Miniboss defense capped at 90 | Owner answer; one defense (AD-021) | y |
| **Q22** Targeting | The click picks the target, the miniboss is the starting target, the auto click and the allies hit the target, a dead target add hands the target back to the miniboss, no keyboard key | Owner answer | y |
| **Q23** Skills with adds | Every damage skill hits the miniboss and every living add | Owner answer | y |
| **Q24** Win, loss and rewards | Miniboss death wins with adds alive; the countdown fails as today; adds pay no coins, cards, equipment or talent points and are not reported to the server; a click on an add counts for the combo | Owner answer | y |
| **Q25** Marker and target text | A gold triangle `#ffd24a` above the target; the target's name and HP shown; the enemy attribute line shows the target's numbers, buff included. Where the name and HP go: Q49 | Owner answer; place revised by Q49 | y |
| **Q35** Adds and team resistance | Void: there is no team resistance (AD-021); ally hits meet the guarded defense like every strike (`hero-team` Q35, Q46) | Superseded by AD-021 | y |
| **Q38** Add positions | Adds at 50 % size (110 x 125 px) in a column between the leader and the miniboss, centres (480, 360) for `Lacaio 1` and (480, 540) for `Lacaio 2`; a 100 x 8 px health bar 10 px above each; the buff text (12 px, white, dark outline) above the bar. Text now `+<buff> de defesa` | Owner answer 2026-10-31; text follows AD-021 | y |
| **Q39** Chapters 12 to 14 | +35, +40, +45 on both adds (Add Table; the old physical / magical split of 13 and 14 is one defense now) | Owner answer 2026-10-31; one defense (AD-021) | y |
| **Q40** Brado and Prisão with adds | Applied to every living monster | Owner answer 2026-10-31 | y |
| **Q41** Multi-hit skills on every monster | Flecha Dupla: two arrows per monster, each with its own critical roll. Tiro Preciso: every monster alive at the end of the cast. Tempestade: every monster alive at each tick. Poison: one stack per monster. Golpe Sangrento: hit and Bleed on each | Owner answer 2026-10-31 | y |
| **Q47** Counterplay against the guarded defense (replaces "a magical leader or the team can go straight in") | **Recommended (A)**: no new rule. The player either kills the adds (defense 0; damage skills hit them all) or lowers the guarded defense with what exists: Brado Aterrador (-30 x f, 10 s of every 30 s), `Quebra de defesa`, Orina's Erosão Arcana as an ally (-15) and armor pierce (pieces, Corte Dimensional +30 %), all applied after the cap. Chapter 11 stage 1, both adds alive: a Base-1 hit deals 0.1, under Brado level 1 0.4, under Brado level 3 (-45) 0.55. Alternatives: (B) adds with 2 x phase monster health instead of 3 x, so killing them is cheaper; (C) a new rule: while Brado Aterrador runs on the miniboss the add buff does not count; (D) cap the guarded defense at 80 instead of 90 (Base-1 hit 0.2 with both adds) | A keeps every existing number and makes a defense-break build (Kael, Orina ally, break talents) the "go straight in" plan; B, C and D change the owner's numbers or add a rule | y (owner, 2026-11-19: recommended default) |
| **Q48** Buff values under one defense | **Recommended (A)**: keep the Add Table values (+40, +45, +50 per add in chapters 13 to 15), so one living add keeps the miniboss at 90 from chapter 12 stage 4 on and both adds must die. Alternative (B): halve the buffs of chapters 13 to 15 to +20, +22, +25 per add, so killing one add gives some relief (stage 1 with one add: 75, 80, 86) | A keeps the owner's numbers; the old split let a physical leader kill only "its" add, which one defense cannot express | y (owner, 2026-11-19: recommended default) |
| **Q49** Where the target's name and HP show | **Recommended (A)**: a target chip `Alvo: <name> · HP <health>/<max>` as the first row of the enemy box (Fight Layout); the miniboss's big bar and its HP text stay the miniboss's. Alternatives: (B) Q25 as first written: the big bar's text and fill follow the target, with `Alvo: <name>` in a line above the bar, where the damage numbers rise (y 233 to 273) and cover it; (C) one line on the big bar, `Alvo: <name> · HP <health>/<max>`, which fills its 240 px at 12 px | A keeps the name next to the target's attributes, never under the numbers, and never shows an add's health on the miniboss's bar | y (owner, 2026-11-19: recommended default) |
| **Q50** Order of a skill on several monsters | **Recommended**: `Lacaio 1`, `Lacaio 2`, then the miniboss, so an add killed by a skill no longer guards that skill's miniboss hit (a burst "breaks the guard", user story). Alternative: miniboss first, so the miniboss hit always meets the adds alive at the start of the skill | Matches the user story; same rule for ticks and the aimed shot | y (owner, 2026-11-19: recommended default) |
| **Q51** A click on no monster | **Recommended**: hits the target, as any click hits the monster today (Facts), with its number at the target's centre x. Alternatives: hits the miniboss; or does nothing in a fight with adds | Keeps the click rule of every other fight; a missed click is never wasted | y (owner, 2026-11-19: recommended default) |
| **Q52** Effect tags with several monsters | **Recommended**: the player's buffs plus the target's debuffs and damage over time. Alternative: always the miniboss's | The tags then match the enemy line, which shows the target | y (owner, 2026-11-19: recommended default) |
| Data | Each stage of the progress and farm payloads carries `adds`: a list of 0 to 2 `{ "health": integer of at least 1, "defenseBuff": integer 0 to 90 }` in slot order (empty for chapters 1 to 10). The backend stores them in a new table `stage_adds` (`V13__miniboss_adds.sql`, expand only, AD-016), filled for the stored chapters 11 to 15 by the migration and for a new database by `ChapterSeeder` | The game types no stage number (`stages`); a new table leaves the previous backend untouched; an empty list keeps chapters 1 to 10 unchanged | n |
| Invalid add data in the game | A missing or non-list `adds` gives no adds; an entry whose `health` is not a number of at least 1 or whose `defenseBuff` is not an integer 0 to 90 is skipped; only the first 2 valid entries count | The backend's checks keep the data valid; a bad entry must never stop a fight (today an unknown element is not checked at load) | n |
| Marker and chip after the adds died | Both stay on the miniboss until the fight ends | Fewer state changes; the fight is still "a fight with adds" | n |
| Reload during the fight | The miniboss and both adds restart at full health with a full countdown | Same rule as today (`stages`) | n |
| Implicit dimensions | Input bounds: the Data checks, in the database and the game. Failure states: invalid add data is skipped (row above); a game against a backend without `adds` fights as today. Idempotency, auth, concurrency: N/A because no route changes and the outcome report path is unchanged. Data lifecycle: catalog data, never deleted with a player. Observability: N/A because there is no new server event. External dependency: N/A. State transitions: the target changes only on a click on a living monster or the target's death | Complex-scope sweep | n |

**Open questions:** none. The owner answered Q47 to Q52 with the recommended defaults and approved the spec, design and tasks on 2026-11-19.

---

## User Stories

### P1: Adds come with the miniboss ⭐ MVP

**User Story**: As a player past chapter 10, I want minibosses guarded by adds so that boss fights need a plan.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHEN the backend answers a progress or a farm list THEN every stage of the definition SHALL carry `adds`, a list of `{ health, defenseBuff }` in slot order.  <!-- event-driven -->
2. WHEN the backend seeds or migrates chapters 11 to 15 THEN each stage SHALL carry 2 adds with the buff of the Add Table and health 3 times its phase monster health, and chapters 1 to 10 SHALL carry an empty list.  <!-- event-driven -->
3. WHEN a miniboss whose stage carries adds appears THEN the game SHALL spawn the miniboss and every add with its health and the stats of the stage's phase monster, at the places of the Fight Layout.  <!-- event-driven -->
4. WHILE adds are alive the game SHALL compute the miniboss's defense as its own defense plus the `defenseBuff` of every living add, at most 90, before every other reduction.  <!-- state-driven -->
5. WHEN the chapter 11 stage 1 miniboss (defense 49) is hit by a Base-1 click with no critical and element multiplier 1.0 THEN the game SHALL deal 0.1 with 2 adds alive, 0.21 with 1 and 0.51 with none.  <!-- event-driven -->
6. WHEN the chapter 15 stage 1 miniboss (defense 61) has one add alive THEN the game SHALL use defense 90, and with none 61.  <!-- event-driven -->
7. WHEN Brado Aterrador level 1 runs on the chapter 11 stage 1 miniboss with 2 adds alive THEN a Base-1 hit SHALL deal 0.4 (90 - 30 = 60).  <!-- event-driven -->
8. WHEN an add dies THEN the game SHALL fade it out over 500 ms, never respawn it in that fight, and drop its buff from the next hit.  <!-- event-driven -->
9. WHEN a stage carries an empty or missing `adds` list THEN the game SHALL fight the miniboss exactly as today.  <!-- event-driven -->
10. IF an add entry has a `health` that is not a number of at least 1 or a `defenseBuff` that is not an integer from 0 to 90 THEN the game SHALL skip that entry, and IF more than 2 valid entries come THEN the game SHALL spawn only the first 2.  <!-- unwanted-behavior -->

**Independent Test**: In the browser against the fake backend at a chapter 11 stage 1 miniboss with 2 adds, three monsters appear; the target chip reads `Alvo: Miniboss`, the enemy line shows `Defesa 90%`; after one add dies it shows `Defesa 79%`, and after both `Defesa 49%`.

---

### P1: The player picks the target ⭐ MVP

**User Story**: As a player, I want to choose whom I hit so that I decide between the adds and the boss.

**Why P1**: Without a target the adds are only a wall.

**Acceptance Criteria**:

1. WHEN a fight with adds starts THEN the game SHALL make the miniboss the target.  <!-- event-driven -->
2. WHEN the player clicks a living add or the miniboss THEN the game SHALL hit that monster and make it the target.  <!-- event-driven -->
3. WHEN the player clicks no monster THEN the game SHALL hit the target, with its number at the target's centre x.  <!-- event-driven -->
4. WHEN an auto click fires THEN the game SHALL hit the target and show its number at the target's centre x.  <!-- event-driven -->
5. WHEN an ally tick lands THEN the game SHALL land every ally hit on the target read right before that hit, and show one light-blue number per monster hit in that tick at that monster's ally number place.  <!-- event-driven -->
6. WHEN the target add dies THEN the game SHALL make the miniboss the target, and the later hits of the same ally tick or auto click burst SHALL land on the miniboss.  <!-- event-driven -->
7. WHILE a fight with adds runs the game SHALL draw the target marker over the target at the place of the Fight Layout.  <!-- state-driven -->
8. WHILE a fight with adds runs the target chip SHALL read `Alvo: <name> · HP <health>/<max>` of the target, and the weak chip and the enemy chips SHALL show the target's stats after the guard and the breaks.  <!-- state-driven -->
9. WHILE an add is alive the game SHALL show its health bar and its buff text `+<buff> de defesa` at the places of the Fight Layout.  <!-- state-driven -->
10. WHEN the player clicks an add THEN the click SHALL count one step of the combo, as a click on the miniboss does.  <!-- event-driven -->
11. WHEN Lyra is the leader and her click rolls a double critical click on an add THEN both hits SHALL land on that add.  <!-- event-driven -->

**Independent Test**: Click `Lacaio 1`, read `Alvo: Lacaio 1` and its HP falling with the auto click; kill it and read `Alvo: Miniboss`.

---

### P1: Damage skills hit every enemy ⭐ MVP

**User Story**: As a player, I want my damage skills to hit the boss and its adds so that a burst can break the guard.

**Why P1**: Owner decision; without it a skill on the boss ignores the adds that guard it.

**Acceptance Criteria**:

1. WHEN Corte Dimensional, Investida do Baluarte, Chuva de Meteoros, Luz Divina or Golpe Sangrento is used with adds alive THEN the game SHALL land its hit on every living monster in the order `Lacaio 1`, `Lacaio 2`, miniboss, each with its own defense and its own damage number.  <!-- event-driven -->
2. WHEN a skill kills an add before its miniboss hit THEN that miniboss hit SHALL meet the defense without that add's buff.  <!-- event-driven -->
3. WHEN Flecha Dupla is used with adds alive THEN the game SHALL shoot two arrows at each living monster, each arrow with its own critical roll, and SHALL NOT land a monster's second arrow when its first arrow killed it.  <!-- event-driven -->
4. WHEN the cast of Tiro Preciso ends while the miniboss lives THEN the game SHALL land a critical hit on every monster alive at that moment.  <!-- event-driven -->
5. WHEN Tempestade Arcana ticks THEN each tick SHALL land on every monster it was cast on that is still alive.  <!-- event-driven -->
6. WHEN Bomba de Veneno is used THEN the game SHALL add one Poison stack to every living monster, and WHEN Golpe Sangrento hits THEN it SHALL start a Bleed on every monster it hit that is still alive.  <!-- event-driven -->
7. WHEN Brado Aterrador or Prisão de Espinhos is used with adds alive THEN the game SHALL apply its debuff to every living monster.  <!-- event-driven -->
8. WHEN a monster dies THEN the game SHALL end only that monster's debuffs and damage over time.  <!-- event-driven -->
9. WHILE a fight with adds runs the effect tags SHALL show the player's buffs and the target's debuffs and damage over time.  <!-- state-driven -->
10. WHEN a skill is used in a fight with a single monster THEN the game SHALL behave exactly as today.  <!-- event-driven -->

**Independent Test**: Use Chuva de Meteoros with both adds alive and read three damage numbers; use Flecha Dupla and read six.

---

### P1: The fight ends on the miniboss ⭐ MVP

**User Story**: As a player, I want the miniboss to decide the fight so that going straight for it is a valid plan.

**Why P1**: Win and loss rules must be clear before the fight can ship.

**Acceptance Criteria**:

1. WHEN the miniboss dies before its countdown ends THEN the game SHALL win the fight, fade out the adds still alive with it, and report `CLEARED` exactly as today.  <!-- event-driven -->
2. IF the countdown reaches 0 with the miniboss alive THEN the game SHALL remove every monster at once and report `FAILED` exactly as today, whether adds are alive or not.  <!-- unwanted-behavior -->
3. WHEN an add dies THEN the game SHALL drop no coins, send no kill to the wallet sync and send no outcome report.  <!-- event-driven -->
4. WHEN a farm fight of a chapter 11 to 15 miniboss starts THEN the game SHALL spawn its adds by the same rules, from the definition of that chapter.  <!-- event-driven -->
5. WHEN the page reloads during a fight with adds THEN the game SHALL start the miniboss and every add at full health with a full countdown.  <!-- event-driven -->
6. WHEN the player leaves the fight from the pause menu THEN the game SHALL remove every monster at once and report `FAILED` as today.  <!-- event-driven -->

**Independent Test**: Kill the miniboss with both adds alive: stage 2 phase 1 starts and one `CLEARED` report is sent; let the countdown end after killing both adds: phase 5 returns and one `FAILED` report is sent.

---

## Edge Cases

- WHEN a damage skill kills both adds and the miniboss in one use THEN the game SHALL win the fight once and send one `CLEARED` report.
- WHEN the player clicks the monster that is already the target THEN the game SHALL hit it and keep it as the target.
- WHEN an ally tick kills the target add THEN the later ally hits of that tick SHALL land on the miniboss, the new target.
- WHEN two adds of chapter 12 (+35 each) are alive on a miniboss with defense 52 THEN the game SHALL use 90, not 122.
- WHEN `Quebra de defesa`, Erosão Arcana or Brado lower a guarded miniboss THEN the game SHALL subtract them from the capped value, never below 0.
- WHEN Lâminas Sombrias (Vex ally, -15 critical resistance) runs THEN it SHALL apply to every monster of the fight, as today.
- WHILE the pause menu is open the game SHALL change no target and land no hit.
- WHILE a hero screen is open a click on the canvas SHALL hit nothing and change no target, as today.
- WHEN the player clicks where a dead add stood THEN the game SHALL treat it as a click on no monster.
- WHEN a fight with adds is replaced (realignment after a 409, a farm fight started or left) THEN the game SHALL remove the old adds at once and spawn the adds of the new encounter.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ADDS-01 | P1: Adds come with the miniboss - AC 1, 2 (backend data, seed, migration, payload) | Tasks T1 to T4 | In Tasks |
| ADDS-02 | P1: Adds come with the miniboss - AC 3, 8, 9, 10 (game data, spawn, death) | Tasks T5, T7, T10, T13 | In Tasks |
| ADDS-03 | P1: Adds come with the miniboss - AC 4 to 7 (guarded defense) | Tasks T6, T10, T13 | In Tasks |
| ADDS-04 | P1: Target - AC 1 to 6, 10, 11 (target rules) | Tasks T6, T11, T14 | In Tasks |
| ADDS-05 | P1: Target - AC 7 to 9 (marker, chip, add bars and texts) | Tasks T10, T11, T14, T16 | In Tasks |
| ADDS-06 | P1: Damage skills - AC 1 to 7, 10 | Tasks T9, T12, T15 | In Tasks |
| ADDS-07 | P1: Damage skills - AC 8, 9 (effects per monster, tags) | Tasks T8, T12, T15 | In Tasks |
| ADDS-08 | P1: Fight end - AC 1 to 6 | Tasks T7, T10, T13 | In Tasks |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Unit tests pin the Add Table, the guarded defense of chapters 11 and 15 and the Brado example with exact numbers.
- [ ] e2e tests at a chapter 11 miniboss switch the target with a click, win with adds alive and fail on the countdown.
- [ ] The existing stages, skills, farm and hero-team suites pass unchanged for fights without adds.
