# Early Game Rebalance Specification

## Problem Statement

A new account rushes through the first chapters and then hits a hard wall. A simulation of a new account (talents only, no gear, stars, skills or allies) finishes chapter 1 in 3.7 min, chapter 2 in 6.3 min and chapter 3 in 10.3 min at 8 clicks per second, then walls in chapters 4 and 5 (design § Simulation, "antes"). Three causes. (1) `Dano direto de clique` (`CLICK_FLAT_DAMAGE`) gives +19 at grade 1 level 10 on a base damage of 1, so it is the only sensible first buy. (2) Critical hits are dead early: the base critical chance 10 sits under every chapter 1 miniboss (12 to 30) and boss (30), and a critical point is worth a fifth of a click-damage point, so critical talents buy nothing. (3) Health inside a chapter is almost flat (40 to 76) while talent power grows about 20 times through chapter 1, and from chapter 2 on health grows x4 a chapter while talent power grows about x2: miniboss 1-1 asks 7.5 clicks per second at damage 1, the rest of the chapter is trivial, then the wall comes. This feature nerfs the flat talent, makes critical hits a real talent path, gives every chapter (1 to 15) 8 phases a stage and an exponential health curve fitted to the player's power with longer boss timers, and adds monster affixes that ask for a different build.

**Revision of 2026-11-25 (owner answers).** Q1: 8 phases a stage. Q2: chapters 6 to 15 are in scope, with no cliff from chapter 5 on. Q4: the critical talents become a real path (`CRIT_CHANCE` +5 a level, `CRIT_DAMAGE` +15 % a level). Q3, Q5 to Q8: the recommended defaults stand; Q5 is revised by the product owner because chapters 6 to 15 are now simulated (affixes there too, see the row).

## Facts From the Code (not decisions)

Checked on `main` at `23b01b2` (2026-11-25).

- The backend is the source of truth for chapter numbers. `ChapterDefinition.of(number)` (`backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt:180`) seeds: 5 phases a stage, phase monster health `(40 + 4(n - 1)) x healthFactor(c)`, miniboss 5 times it, chapter boss `2000 x healthFactor(c)`, `healthFactor` 1, 4, 16, 64, 256 for chapters 1 to 5 then x2 a chapter (AD-019); miniboss limit 30 000 ms, boss limit 60 000 ms; miniboss defense `min(10 + n + defenseBonus(c), 80)`, miniboss critical resistance `min(10 + 2n + defenseBonus(c), 70)`, boss defense and critical resistance `min(30 + defenseBonus(c), 80 / 70)`, `defenseBonus` `5(c - 1)` to chapter 5 then `20 + 3(c - 5)`. The minibosses of chapters 11 to 15 have 2 adds of 3 times the phase monster health (AD-027, table `stage_adds`).
- `ChapterSeeder` (`adapter/config/ChapterSeeder.kt`) never overwrites a stored chapter; stored rows change only through a Flyway migration that touches rows still holding the seeded values (pattern `V4__monster_health_growth.sql`, `V9__coin_drop_rebalance.sql`). Enemy stats live in the shared `enemies` catalog (unique on element, both defenses and critical resistance); stages and chapters point at a row by id (`miniboss_enemy_id`, `boss_enemy_id`).
- The latest migration is `V15__talent_tree_rework.sql`; the next free versions are **V16** and **V17**. `PreviousBackendCompatibilityIT` checks that older releases start on the migrated schema.
- Talents: `TalentCatalog` (`domain/Talents.kt:74`) defines `CLICK_FLAT_DAMAGE` with `perLevel 2, firstLevel 1` (19, 38, 57 at level 10), `CRIT_CHANCE` 1 point a level and `CRIT_DAMAGE` 5 % a level. The game reads `value` from `GET /talents` (AD-011) and types no catalog number; the card shows `+<value> de dano`, `+<value> pontos`, `+<value>%` (`game/src/domain/talents/talents.js` `describeTalentEffect`). A miniboss first clear pays 2 points, a chapter boss 5 (`TalentRules`).
- Damage (`game/src/domain/combat/damage.js`): base critical chance 10, multiplier 2; effective chance `min(100, max(0, C - R))`, the chance past 100 adds critical damage (AD-029). Every strike lands through `SkillCombat` (`game/src/domain/skills/skillCombat.js`, five `.hit(` calls: click, ally hit, skill hit, aimed shot, damage-over-time tick) on a `Monster` (`game/src/domain/combat/monster.js`).
- Encounters are built in `game/src/domain/campaign/campaign.js` (`encounter()`, `farmEncounterOf`) from `definition.stages[]` and the chapter fields; the stage label reads `Stage <n>/<count>  Phase <p>/<phasesPerStage>` from the payload; `ClickerGame.showEncounter` (`game/src/adapters/phaser/ClickerGame.js:836`) spawns the `Monster` and starts the `BossCountdown`; `update` (`:1128`) advances the countdown by `countdownMs` (Stun and Root stop it).
- A kill costs 1.5 s before the next monster (fade 500 ms, respawn 1000 ms, `ClickerGame.js:47`).

## Goals

- [ ] `Dano direto de clique` gives +1 a level: 10 at grade 1 level 10, 20 at grade 2, 30 at grade 3 (today 19, 38, 57).
- [ ] `Chance de crítico` gives +5 points a level and `Dano crítico` +15 % a level, so that per talent point they compete with `Dano de clique (%)` (design § Gain per point: at miniboss 3-10, 4.3 % and 3.9 % against 3.7 %).
- [ ] A new player with damage 1 beats miniboss 1-1 at 4.7 clicks per second (Kael), 2.35 (Orina), 5.25 (Lyra) (today 7.5, 3.8, 7.9).
- [ ] In the simulation of design § Simulation (talents, and from chapter 6 the kit of § Late-game Kit), no starting hero meets a wall in chapters 1 to 15 at 6, 8 or 10 clicks per second; Kael at 8 clicks per second ends chapter 1 at 12.0 min, chapter 3 at 30.3, chapter 5 at 47.6, chapter 10 at 88.3 and chapter 15 at 128.0 (today 3.7 and 10.3, wall at 5-3).
- [ ] The base critical chance 10 beats the critical resistance of every chapter 1 miniboss (0 to 9).
- [ ] Encounters of chapters 2 to 15 carry the four affixes of the Affix Table, shown on screen with their numbers.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Hero talents unlocked by stars (Execução for Kael, Ponto fraco for Lyra) | A later feature the owner is thinking about |
| Fewer talent points | Owner: keep 2 per miniboss and 5 per chapter boss |
| Defenses, elements, add buffs and the critical resistance of chapters 6 to 15 | The fit moves health only; those numbers stay as today |
| Other talents than `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE` | Not asked |
| Affixes on phase monsters or adds; affixes on the minibosses of chapters 11 to 15 | Only minibosses and chapter bosses carry one; the adds already make those minibosses a puzzle |
| More than one affix per encounter | Readable fights |
| A notice or refund for the talent changes | The talent points are unchanged; `Reiniciar pontos` already lets a player rebuy |
| Star, card, equipment or ally changes | The late-game kit is an assumption of the simulation, not a change |
| Phone layout | The owner targets desktop only |

---

## Chapter Table

Seeded numbers of every chapter (backend `ChapterDefinition.of`, migration V16 for stored rows). Every chapter has **8 phases** a stage (today 5).

**Phase monster health** (defense 0, critical resistance 0, the stage element as today). Each chapter is `round(B x g^(n - 1))` with the B and g of the row (design § Simulation, step 2), written out so nobody recomputes a rounding:

| Chapter | B | g | Stage 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 69 | 1.33 | 69 | 92 | 122 | 162 | 216 | 287 | 382 | 508 | 676 | 898 |
| 2 | 265 | 1.29 | 265 | 342 | 441 | 569 | 734 | 947 | 1221 | 1575 | 2032 | 2622 |
| 3 | 1000 | 1.16 | 1000 | 1160 | 1346 | 1561 | 1811 | 2100 | 2436 | 2826 | 3278 | 3803 |
| 4 | 4750 | 1.04 | 4750 | 4940 | 5138 | 5343 | 5557 | 5779 | 6010 | 6251 | 6501 | 6761 |
| 5 | 7250 | 1.04 | 7250 | 7540 | 7842 | 8155 | 8481 | 8821 | 9174 | 9541 | 9922 | 10319 |
| 6 | 10000 | 1.04 | 10000 | 10400 | 10816 | 11249 | 11699 | 12167 | 12653 | 13159 | 13686 | 14233 |
| 7 | 28000 | 1.04 | 28000 | 29120 | 30285 | 31496 | 32756 | 34066 | 35429 | 36846 | 38320 | 39853 |
| 8 | 36000 | 1.04 | 36000 | 37440 | 38938 | 40495 | 42115 | 43800 | 45551 | 47374 | 49268 | 51239 |
| 9 | 58000 | 1.04 | 58000 | 60320 | 62733 | 65242 | 67852 | 70566 | 73389 | 76324 | 79377 | 82552 |
| 10 | 71000 | 1.04 | 71000 | 73840 | 76794 | 79865 | 83060 | 86382 | 89838 | 93431 | 97168 | 101055 |
| 11 | 38000 | 1.04 | 38000 | 39520 | 41101 | 42745 | 44455 | 46233 | 48082 | 50005 | 52006 | 54086 |
| 12 | 64000 | 1.04 | 64000 | 66560 | 69222 | 71991 | 74871 | 77866 | 80980 | 84220 | 87588 | 91092 |
| 13 | 90000 | 1.04 | 90000 | 93600 | 97344 | 101238 | 105287 | 109499 | 113879 | 118434 | 123171 | 128098 |
| 14 | 133000 | 1.04 | 133000 | 138320 | 143853 | 149607 | 155591 | 161815 | 168287 | 175019 | 182020 | 189300 |
| 15 | 161000 | 1.04 | 161000 | 167440 | 174138 | 181103 | 188347 | 195881 | 203716 | 211865 | 220340 | 229153 |

Chapter 11 starts lower than chapter 10 ends because its minibosses bring 2 adds of 3 times the phase health each: a chapter 11 miniboss fight holds 9 phase healths (two adds and the miniboss), a chapter 10 one holds 3.

**Miniboss** of chapter c, stage n: health **3 times** the phase monster health of the stage (today 5 times), limit **45 000 ms** (today 30 000), defense unchanged `min(10 + n + defenseBonus(c), 80)`. Critical resistance: chapters 1 to 5 **`(n - 1) + 8(c - 1)`** (today `10 + 2n + 5(c - 1)`); chapters 6 to 15 unchanged `min(10 + 2n + defenseBonus(c), 70)`. Adds of chapters 11 to 15 keep their buffs and get 3 times the new phase health (chapter 15 stage 1: 483 000).

| Chapter | Miniboss critical resistance, stage 1 ... 10 (today) |
| --- | --- |
| 1 | 0 ... 9 (12 ... 30) |
| 2 | 8 ... 17 (17 ... 35) |
| 3 | 16 ... 25 (22 ... 40) |
| 4 | 24 ... 33 (27 ... 45) |
| 5 | 32 ... 41 (32 ... 50) |
| 6 to 15 | unchanged |

**Chapter boss** of chapter c: limit **90 000 ms** (today 60 000), defense and element unchanged, critical resistance chapters 1 to 5 **`10c - 5`** (today `30 + 5(c - 1)`), chapters 6 to 15 unchanged.

| Chapter | Boss health (today) | Critical resistance (today) |
| --- | --- | --- |
| 1 | 6000 (2000) | 5 (30) |
| 2 | 12500 (8000) | 15 (35) |
| 3 | 13000 (32000) | 25 (40) |
| 4 | 34000 (128000) | 35 (45) |
| 5 | 80000 (512000) | 45 (50) |
| 6 | 130000 (1024000) | unchanged |
| 7 | 139000 (2048000) | unchanged |
| 8 | 313000 (4096000) | unchanged |
| 9 | 475000 (8192000) | unchanged |
| 10 | 900000 (16384000) | unchanged |
| 11 | 956000 (32768000) | unchanged |
| 12 | 1850000 (65536000) | unchanged |
| 13 | 1940000 (131072000) | unchanged |
| 14 | 2837000 (262144000) | unchanged |
| 15 | 4265000 (524288000) | unchanged |

Each boss sits at 90 % or less of its limit for the hardest starting hero at 6 clicks per second (chapters 6 to 15 at 85 % of that ceiling), and never below the boss before it (design § Simulation, step 2).

## Late-game Kit

The tables of chapters 6 to 15 assume the leader holds at least these stars and a weapon of at least this base click damage on entering the chapter (design § Simulation). Nothing in the game changes; a player below the kit can still farm the bosses already beaten for cards and pieces (AD-024).

| Chapter | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Leader stars | 1 | 2 | 3 | 3 | 4 | 4 | 5 | 5 | 6 | 6 |
| Weapon base click | 3 | 4 | 5 | 6 | 6 | 7 | 8 | 8 | 9 | 10 |

A talent-only player (no stars, no weapon) meets the first wall at 8-9 (Lyra, 6 clicks/s), the chapter 8 boss (Kael, 6 clicks/s), the chapter 9 boss (Orina, 6 clicks/s), 12-1 (Kael, 8 clicks/s), 12-2 (Orina, 8 clicks/s) or the chapter 12 boss (Lyra, 8 and 10 clicks/s); Kael and Orina at 10 clicks/s reach the end.

## Talent Change

| Talent | Today (grade 1 / 2 / 3 at level 10) | New |
| --- | --- | --- |
| `CLICK_FLAT_DAMAGE` (Dano direto de clique) | `perLevel 2, firstLevel 1`: 1, 3, 5 ... 19 / 38 / 57 | `perLevel 1`: 1, 2, 3 ... 10 / 20 / 30 |
| `CRIT_CHANCE` (Chance de crítico) | `perLevel 1`: 10 / 20 / 30 | `perLevel 5`: 5, 10, 15 ... 50 / 100 / 150 |
| `CRIT_DAMAGE` (Dano crítico) | `perLevel 5`: 50 / 100 / 150 | `perLevel 15`: 15, 30, 45 ... 150 / 300 / 450 |

Every other talent, the grade rule (grade N costs N points a level, gives N times the value), the subtractive critical model and its overflow (AD-029) and the points paid stay as today.

## Affix Rules

An affix belongs to one miniboss or one chapter boss. It applies in campaign and farm fights of that encounter, to the main monster only (never to adds). Every strike counts: manual click, auto click, the two hits of Lyra's double click, skill hits, the aimed shot, damage-over-time ticks and ally hits.

| Affix (`type`) | Name on screen | `amount` means | Rule |
| --- | --- | --- | --- |
| `SHELL` | Carapaça | points subtracted | Each strike deals `max(0, damage - amount)`, after every multiplier (defense, element, critical, combo, boss damage) |
| `HIT_SHIELD` | Escudo de golpes | charges | While charges are left, each strike removes 1 charge and deals 0, whatever its damage. When the last charge goes, the shield comes back full `periodMs` later (6000); while it is down strikes deal their full damage |
| `REGENERATION` | Regeneração | basis points (1/100 of a percent) of the maximum health per second | While the encounter's countdown runs, the monster heals `maxHealth x amount / 10000` per second, in proportion to the elapsed ms, never above its maximum health and never after it died |
| `ARMORED` | Blindado | defense points | The monster's defense is its seeded defense plus `amount` (before breaks, Brado and armor pierce, as the adds' buff); the enemy line shows the raised defense |

Heals and shield recharges follow the countdown time: they stop while the game is paused and while Stun or Root stops the countdown.

## Affix Table

Seeded for chapters 2 to 15 (backend `ChapterDefinition.of`, migration V17 for stored rows). Chapter 1 has no affix. `-` means no affix.

| Chapter | Miniboss 3 | Miniboss 6 | Miniboss 9 | Chapter boss |
| --- | --- | --- | --- | --- |
| 1 | - | - | - | - |
| 2 | Escudo de golpes 10 | Escudo de golpes 10 | Escudo de golpes 10 | Escudo de golpes 10 |
| 3 | Carapaça 6 | Escudo de golpes 15 | Carapaça 14 | Carapaça 16 |
| 4 | Regeneração 50 | Carapaça 24 | Regeneração 50 | Regeneração 25 |
| 5 | Blindado 20 | Regeneração 50 | Blindado 20 | Blindado 20 |
| 6 | Escudo de golpes 30 | Carapaça 49 | Regeneração 50 | Blindado 20 |
| 7 | Carapaça 122 | Regeneração 50 | Blindado 20 | Escudo de golpes 30 |
| 8 | Regeneração 50 | Blindado 20 | Escudo de golpes 30 | Carapaça 205 |
| 9 | Blindado 20 | Escudo de golpes 30 | Carapaça 318 | Regeneração 25 |
| 10 | Escudo de golpes 30 | Carapaça 346 | Regeneração 50 | Blindado 20 |
| 11 | - | - | - | Escudo de golpes 30 |
| 12 | - | - | - | Carapaça 365 |
| 13 | - | - | - | Regeneração 25 |
| 14 | - | - | - | Blindado 20 |
| 15 | - | - | - | Escudo de golpes 30 |

Seed rules behind the table:

- Chapters 2 to 5 introduce one type each (2 Escudo de golpes, 3 Carapaça, 4 Regeneração, 5 Blindado) on minibosses 3, 6, 9 and the boss as listed.
- Chapters 6 to 10: the order `Escudo de golpes, Carapaça, Regeneração, Blindado` rotates: miniboss 3 takes entry `(c - 6) mod 4`, miniboss 6 `(c - 5) mod 4`, miniboss 9 `(c - 4) mod 4`, the boss `(c - 3) mod 4`. Chapters 11 to 15: the boss only, entry `(c - 3) mod 4`.
- Escudo de golpes has `10 + 5 x min(c - 2, 4)` charges (10, 15, 20, 25, then 30 from chapter 6) and `periodMs` 6000. Carapaça is `ceil(4 / 1000 x phase monster health of the stage)` (stage 10 for the boss: chapter 3, 3803 gives 16). Regeneração is 50 on a miniboss and 25 on a boss. Blindado is 20.

## Affix Display

One chip at the top of the monster, inside its body (the monster box is x 560 to 780, y 315 to 565).

- Box: a Phaser DOM element at scene (670, 336), class `hud-box hud-affix`, 240 x 28 px, `pointer-events: none` like every HUD box (a click through it hits the monster).
- Chip: `div.affix-chip` with `data-testid="affix-chip"` and `data-affix="<type>"`, inside the box, centred. Figtree 700 12 px, color `--parchment-100`, background `--chip-bg`, border 1 px solid the type colour, radius 999 px, padding 3 px 10 px 3 px 8 px, `white-space: pre`, `display: inline-flex`, `align-items: center`, gap 5 px. Hidden (`display: none`) while empty.
- Icon: a `::before` 12 x 12 px mask coloured with the type colour, like the enemy stat chips (`game/public/style.css` `.tag[data-stat]::before`). No image file.

| Type | Colour | Icon (SVG path, viewBox 0 0 24 24) |
| --- | --- | --- |
| `SHELL` | `#b07a3a` | `M12 2 21 7v10l-9 5-9-5V7z` (hexagon) |
| `HIT_SHIELD` | `#5aa0d8` | `<circle cx='12' cy='12' r='9' fill='none' stroke='%23000' stroke-width='3'/><circle cx='12' cy='12' r='3'/>` (ring) |
| `REGENERATION` | `#4f9a3c` | `M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z` (plus) |
| `ARMORED` | `#8a9aa6` | `M4 4h16v9c0 4-3.6 7.3-8 9-4.4-1.7-8-5-8-9z` (plate) |

## Player-Facing Texts

Every new text, exactly (AD-007, L-010). Numbers use the game's short format (`formatShort`, `numberFormat.js`) for amounts of 1 000 or more; the percent uses a decimal comma.

| Where | Text |
| --- | --- |
| Carapaça chip | `Carapaça: -<amount> por golpe` (chapter 3 miniboss 3: `Carapaça: -6 por golpe`) |
| Escudo de golpes chip, charges left | `Escudo de golpes: <left>/<amount>` (`Escudo de golpes: 10/10`, after 3 strikes `Escudo de golpes: 7/10`) |
| Escudo de golpes chip, shield down | `Escudo de golpes: volta em <s> s`, `<s>` the seconds left rounded up (`Escudo de golpes: volta em 6 s`) |
| Regeneração chip | `Regeneração: <p>% da vida/s`, `<p>` = `amount / 100` with a decimal comma and no trailing zero (50: `Regeneração: 0,5% da vida/s`; 25: `Regeneração: 0,25% da vida/s`; 100: `Regeneração: 1% da vida/s`) |
| Blindado chip | `Blindado: +<amount> de defesa` (`Blindado: +20 de defesa`) |
| Talent cards | unchanged wording, new values: Dano direto de clique `+10 de dano`, Chance de crítico `+50 pontos`, Dano crítico `+150%` at grade 1 level 10 |
| Stage label | unchanged wording, 8 phases: `Stage 1/10  Phase 1/8` |

A strike that an affix brings to 0 shows the damage number `0`, as any other damage number (Q7).

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** Pacing | 8 phases a stage in every chapter; miniboss 3 times a phase monster, limits 45 s and 90 s. Talent-only to chapter 5 and kit from chapter 6, Kael at 8 clicks/s: 12.0 / 30.3 / 47.6 / 88.3 / 128.0 min at the end of chapters 1, 3, 5, 10, 15. The 15 min and 60 min targets are not reached exactly: as long as no miniboss walls a 6 clicks/s player, the health a chapter holds is bounded (design § Why the targets are bounded); the phases add play without a gate | Owner answer (2026-11-25): 8 phases | y |
| **Q2** Which chapters change | All 15. Health from the fitted tables, 8 phases, 3x miniboss, 45 s / 90 s everywhere; critical resistance only in 1 to 5; defenses, elements and add buffs unchanged. The step from chapter 5 stage 10 to chapter 6 stage 1 is 10 319 to 10 000 (today 19 456 to 20 480) | Owner answer (2026-11-25): no cliff after chapter 5 | y |
| **Q2b** Late-game kit | The tables of chapters 6 to 15 assume § Late-game Kit (stars 1 to 6, weapon 3 to 10). Skills, allies, armour, rings, amulets and refine are left out, so a real player is faster | The talent-only model walls at 8-9 to 12-2; stars and a weapon are the cheapest things a player gains late (cards and pieces from boss wins and the farm) | | y |
| **Q3** Dano direto de clique is still the best first buy | Accept. With base damage 1, +1 is +100 % while `Dano de clique (%)` gives +5 %. After the nerf it tops at +60 instead of +114; a build that never buys it still walls at 1-2 (Kael), 1-3 (Orina), 1-6 (Lyra) | Owner answer (2026-11-25): recommended default | y |
| **Q4** Critical talents | `CRIT_CHANCE` +5 points a level, `CRIT_DAMAGE` +15 % a level (§ Talent Change). Gain per point for Kael at 8 clicks/s: miniboss 1-10 `Chance de crítico` 5.0 % against `Dano de clique (%)` 5.0 %; miniboss 3-10 `Chance de crítico` 4.3 % and `Dano crítico` 3.9 % against 3.7 %; the greedy build holds 10 levels of each by the end of chapter 3. +3 / +15 and +4 / +15 were tried: the greedy build never starts the path (design § Gain per point) | Owner answer (2026-11-25): a real path | y |
| **Q5** Affixes in chapters 6 to 15 | Revised by the product owner after Q2: affixes on minibosses 3, 6, 9 and the boss of chapters 6 to 10 and on the boss of chapters 11 to 15 (their minibosses have adds), in the rotation of § Affix Table | The owner asked for affixes that ask for a different build; with chapters 6 to 15 simulated they fit under the same no-wall rule; one gimmick per fight keeps adds readable | | y |
| **Q6** Affix numbers and placement | The Affix Table | Owner answer (2026-11-25): recommended default | y |
| **Q7** A strike an affix brings to 0 | Shows `0`; the Escudo chip counts down | Owner answer (2026-11-25): recommended default | y |
| **Q8** Existing players | (1) Talent values change at once (they derive from the catalog): `+19` flat becomes `+10`, a `Chance de crítico` at level 4 gives 20 instead of 4; levels and points stay, no notice. (2) Stored chapters 1 to 15 get the new numbers through V16 where they still hold the seeded values; a value an operator tuned stays. Late chapters get much less health (chapter 15 phase 10 485 760 becomes 161 000 to 229 153), so a player already there moves faster. (3) Stored encounters of chapters 2 to 15 get their affixes through V17. (4) A player in the middle of a fight sees the new numbers on the next encounter load | Owner answer (2026-11-25): recommended default | y |
| Storage of affixes | Two new tables in `V17__monster_affixes.sql`, expand only: `stage_affixes (stage_id PK -> stages.id, affix, amount, period_ms)` and `chapter_affixes (chapter PK -> chapters.number, affix, amount, period_ms)`; the previous backend never reads them | A new table leaves the previous backend untouched (AD-016), like `stage_adds` | n |
| Payload | Each stage of the progress and farm payloads carries `minibossAffix`; the chapter definition carries `bossAffix`; each is `{ "type": string, "amount": integer, "periodMs": integer or null }` or `null` | The game types no stage number (AD-011, `stages`) | n |
| Invalid affix data in the game | A missing, `null` or malformed affix is no affix: `type` not one of the four, `amount` not an integer of at least 1, or `HIT_SHIELD` without an integer `periodMs` of at least 1 | A game against a backend of before this feature fights as today | n |
| Bounds | Backend: `amount` at least 1; `HIT_SHIELD` 1 to 1000 charges with `periodMs` 1 to 600 000; `REGENERATION` 1 to 10 000; `ARMORED` 1 to 90; `SHELL` any amount of at least 1; `periodMs` null for the other three. A Blindado defense plus the seeded one can pass 90 (chapter 14 boss: 77 + 20 = 97); a defense of 100 or more deals 0 as today | Keeps every stored value meaningful; the database checks the same | n |
| Reload during an affix fight | The monster restarts with full health and a full shield | Same rule as every fight (`stages`) | n |
| Implicit dimensions | Input bounds: Bounds row (database checks, domain `require`, game validation). Failure: invalid data is no affix; a migration touches only seeded values and can run again. Idempotency, auth, rate limits: N/A because no route is added and the outcome report is unchanged. Concurrency: N/A because the affix runs in the browser like all combat (AD-002). Data lifecycle: catalog rows, never deleted with a player. Observability: the seeder logs the affixes it seeds as it logs the chapters. External dependency: N/A. State transitions: Escudo de golpes up -> down on its last charge, down -> up after `periodMs` of countdown time | Large-scope sweep | n |

**Open questions:** none. Q2b and Q5 accepted by the owner on 2026-11-25; the spec is approved.

---

## User Stories

### P1: The flat talent no longer decides the early game ⭐ MVP

**User Story**: As a new player, I want my first talent points to have more than one good use so that the tree is a choice.

**Why P1**: Cause 1 of the problem.

**Acceptance Criteria**:

1. WHEN the backend answers `GET /talents` THEN `CLICK_FLAT_DAMAGE` SHALL have `perLevel` 1 and `value` 1, 2, 3 and 10 at levels 1, 2, 3 and 10.  <!-- event-driven -->
2. WHEN the backend answers `GET /talents` THEN `CLICK_FLAT_DAMAGE_G2` SHALL have `perLevel` 2 and `value` 20 at level 10, and `CLICK_FLAT_DAMAGE_G3` `perLevel` 3 and `value` 30 at level 10.  <!-- event-driven -->
3. The backend SHALL keep paying 2 talent points for a miniboss first clear and 5 for a chapter boss first clear.  <!-- ubiquitous -->
4. WHEN a player with `CLICK_FLAT_DAMAGE` at level 10 opens Talentos THEN the card SHALL read `+10 de dano`.  <!-- event-driven -->
5. WHEN a Kael leader with no equipment, stars or other talent and `CLICK_FLAT_DAMAGE` at level 10 clicks a FIRE monster with defense 0 and critical resistance 100 THEN the game SHALL deal 11.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, Kael with `CLICK_FLAT_DAMAGE: 10` deals `11` on a defenseless FIRE monster and the card reads `+10 de dano`.

---

### P1: Critical hits are a talent path ⭐ MVP

**User Story**: As a player, I want critical talents to pay as much as click damage so that a critical build is a real choice.

**Why P1**: Cause 2 of the problem; owner answer Q4.

**Acceptance Criteria**:

1. WHEN the backend answers `GET /talents` THEN `CRIT_CHANCE` SHALL have `perLevel` 5 and `value` 5 and 50 at levels 1 and 10, `CRIT_CHANCE_G2` `perLevel` 10 and `value` 100 at level 10, `CRIT_CHANCE_G3` `perLevel` 15 and `value` 150 at level 10.  <!-- event-driven -->
2. WHEN the backend answers `GET /talents` THEN `CRIT_DAMAGE` SHALL have `perLevel` 15 and `value` 15 and 150 at levels 1 and 10, `CRIT_DAMAGE_G2` `perLevel` 30 and `value` 300 at level 10, `CRIT_DAMAGE_G3` `perLevel` 45 and `value` 450 at level 10.  <!-- event-driven -->
3. WHEN the backend seeds chapter c from 1 to 5 THEN the miniboss of stage n SHALL have critical resistance `(n - 1) + 8(c - 1)` and the chapter boss `10c - 5`.  <!-- event-driven -->
4. WHEN V16 runs on a database whose chapters 1 to 5 point at enemies with today's seeded critical resistance THEN each such miniboss and boss SHALL point at an enemy with the same element and defense and the new critical resistance.  <!-- event-driven -->
5. IF a stored miniboss or boss of chapters 1 to 5 points at an enemy whose critical resistance is not today's seed THEN V16 SHALL leave it pointing at that enemy.  <!-- unwanted-behavior -->
6. WHEN a leader with no critical bonus faces miniboss 1-1 (critical resistance 0) THEN the enemy line SHALL read `Seu crítico: 10%`.  <!-- event-driven -->
7. WHEN a leader with no critical bonus faces miniboss 1-10 (critical resistance 9) THEN the enemy line SHALL read `Seu crítico: 1%`.  <!-- event-driven -->
8. WHEN a leader with `CRIT_CHANCE` at level 1 faces a monster of critical resistance 0 THEN the enemy line SHALL read `Seu crítico: 15%`.  <!-- event-driven -->
9. WHEN a player with `CRIT_CHANCE` and `CRIT_DAMAGE` at level 10 opens Talentos THEN their cards SHALL read `+50 pontos` and `+150%`.  <!-- event-driven -->

**Independent Test**: In the browser, one `Chance de crítico` level moves the chip from `Seu crítico: 10%` to `Seu crítico: 15%`.

---

### P1: Every chapter grows inside the chapter ⭐ MVP

**User Story**: As a player, I want each chapter to start easy and end hard, with a first miniboss I can beat and no cliff later, so that progress takes time without a wall.

**Why P1**: Cause 3 of the problem; owner answers Q1, Q2.

**Acceptance Criteria**:

1. WHEN the backend seeds any chapter c from 1 to 15 THEN every stage SHALL have the phase monster health of the Chapter Table and 8 phases.  <!-- event-driven -->
2. WHEN the backend seeds any chapter THEN every miniboss SHALL have 3 times its stage's phase monster health, a 45 000 ms limit and defense `min(10 + n + defenseBonus(c), 80)`.  <!-- event-driven -->
3. WHEN the backend seeds any chapter THEN the chapter boss SHALL have the health of the Chapter Table, a 90 000 ms limit and defense `min(30 + defenseBonus(c), 80)`.  <!-- event-driven -->
4. WHEN the backend seeds chapters 6 to 15 THEN their critical resistances, elements and add buffs SHALL equal today's, and every add SHALL have 3 times the new phase monster health of its stage.  <!-- event-driven -->
5. WHEN Flyway runs V16 on a database whose chapters hold today's seeded numbers THEN those rows SHALL hold the Chapter Table numbers, 8 phases, and adds of 3 times the new phase health afterwards.  <!-- event-driven -->
6. IF a stored stage, chapter or add holds a value other than today's seed (tuned in the database) THEN V16 SHALL leave that value unchanged.  <!-- unwanted-behavior -->
7. WHEN V16 runs a second time THEN it SHALL change nothing.  <!-- event-driven -->
8. WHEN the backend answers `GET /progress` at chapter 1 THEN `definition.stages[0]` SHALL carry `phasesPerStage` 8, `monsterHealth` 69, `minibossHealth` 207, `minibossTimeLimitMs` 45000, and `definition` SHALL carry `bossHealth` 6000 and `bossTimeLimitMs` 90000.  <!-- event-driven -->
9. WHEN the game starts miniboss 1-1 against that payload THEN the countdown SHALL start at `Time: 45` and the health text SHALL read `HP 207/207`.  <!-- event-driven -->
10. WHEN the game shows the first phase of chapter 1 against that payload THEN the stage label SHALL read `Stage 1/10  Phase 1/8`.  <!-- event-driven -->

**Independent Test**: A backend test reads `ChapterDefinition.of(1)` to `of(15)` against the Chapter Table; a migration test runs V16 on today's seed and reads the new rows.

---

### P1: Monster affixes ⭐ MVP

**User Story**: As a player from chapter 2, I want some bosses to carry an affix that asks for a different build so that more than one talent plan pays off.

**Why P1**: Scope D of the owner.

**Acceptance Criteria**:

1. WHEN the backend seeds chapters 2 to 15 THEN the encounters of the Affix Table SHALL carry their affix, and every other encounter of chapters 1 to 15 SHALL carry none.  <!-- event-driven -->
2. WHEN the backend answers a progress or a farm payload THEN every stage SHALL carry `minibossAffix` and the definition `bossAffix`, each `{ type, amount, periodMs }` or `null`.  <!-- event-driven -->
3. WHEN Flyway runs V17 on a database with chapters 2 to 15 stored THEN those encounters SHALL get the affixes of the Affix Table, and a second run SHALL change nothing.  <!-- event-driven -->
4. WHEN a Carapaça 6 miniboss takes a strike of 10 THEN it SHALL lose 4, and WHEN it takes a strike of 5 THEN it SHALL lose 0.  <!-- event-driven -->
5. WHEN an Escudo de golpes miniboss with 10 charges takes 10 strikes THEN it SHALL lose no health, and WHEN it takes an eleventh strike of 5 THEN it SHALL lose 5.  <!-- event-driven -->
6. WHEN 6000 ms of countdown time pass after the last charge of Escudo de golpes went THEN the shield SHALL be back at full charges, and the next strike SHALL deal 0.  <!-- event-driven -->
7. WHILE a Regeneração 50 miniboss of 1000 maximum health is alive and its countdown runs, the game SHALL heal it 5 health a second, never above 1000.  <!-- state-driven -->
8. WHILE the game is paused or Stun or Root stops the countdown, the game SHALL neither heal a Regeneração monster nor advance the Escudo recharge.  <!-- state-driven -->
9. WHEN a Blindado +20 miniboss of seeded defense 33 appears THEN the enemy line SHALL read `Defesa 53%` and a Base-1 strike with element 1.0 and no critical SHALL deal 0.47.  <!-- event-driven -->
10. WHEN an ally hit, a skill hit, an aimed shot or a damage-over-time tick lands on an affix monster THEN the affix SHALL apply to it as to a click.  <!-- event-driven -->
11. WHEN a farm fight of a miniboss or boss with an affix starts THEN the game SHALL apply that affix.  <!-- event-driven -->
12. IF an affix in the payload is missing, `null` or malformed THEN the game SHALL fight that encounter with no affix.  <!-- unwanted-behavior -->

**Independent Test**: In the browser against the fake backend, an Escudo de golpes 3 miniboss takes 3 clicks without losing health, the 4th click deals damage, and the chip counts `3/3`, `0/3`, `volta em 6 s`.

---

### P1: The player sees the affix ⭐ MVP

**User Story**: As a player, I want to see which affix a boss carries and its numbers so that I can adapt.

**Why P1**: An affix the player cannot see is a hidden wall.

**Acceptance Criteria**:

1. WHILE an encounter with an affix is alive the game SHALL show the affix chip at the place and in the style of § Affix Display with the text of § Player-Facing Texts.  <!-- state-driven -->
2. WHEN a strike removes an Escudo charge THEN the chip SHALL read the new `<left>/<amount>` before the next frame.  <!-- event-driven -->
3. WHILE the Escudo is down the chip SHALL read `Escudo de golpes: volta em <s> s` with the seconds left rounded up.  <!-- state-driven -->
4. WHEN the affix monster dies or the countdown fails the fight THEN the chip SHALL be empty and hidden.  <!-- event-driven -->
5. WHILE an encounter without an affix is shown the chip SHALL be empty and hidden.  <!-- state-driven -->
6. WHEN the player clicks the place of the chip THEN the click SHALL hit the monster as a click on its body does.  <!-- event-driven -->

**Independent Test**: Screenshots of one miniboss per type and the chip states (ui-artist review).

---

## Edge Cases

- WHEN a critical strike of 30 lands on a Carapaça 16 boss THEN it SHALL deal 14.
- WHEN Lyra's double click hits an Escudo with 1 charge left THEN the first hit SHALL take the last charge and deal 0 and the second hit SHALL deal its damage.
- WHEN a skill lands several hits in one use on an Escudo monster THEN each hit SHALL take one charge, in the order the skill lands them.
- WHEN the Escudo comes back while strikes keep landing THEN the next strike SHALL be absorbed.
- WHEN a Regeneração monster is at full health THEN it SHALL stay at its maximum.
- WHEN the countdown expires on a Regeneração monster THEN the fight SHALL fail as today, and no heal SHALL happen after the failure.
- WHEN a Blindado defense plus breaks lands at 100 or more THEN a strike SHALL deal 0, as any defense of 100 or more (`calculateDamage`).
- WHEN the amount of Carapaça is 1200 THEN the chip SHALL read `Carapaça: -1.2K por golpe` (`formatShort`).
- IF the backend answers a stage with `minibossAffix` of an unknown `type` THEN the game SHALL ignore it and fight with no affix.
- WHEN a fight is replaced (realignment after a 409, a farm fight started or left) THEN the old affix state SHALL go with the old monster.
- WHEN a chapter 11 to 15 miniboss with adds is fought THEN it SHALL carry no affix and its adds SHALL work as today.
- WHEN a leader's critical chance passes 100 against a monster THEN the overflow SHALL add critical damage as today (AD-029): with `CRIT_CHANCE` grades 1 to 3 at level 10 and 9 stars against resistance 10, a Base-1 click deals 21.12.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| EGR-01 | P1: Flat talent - AC 1 to 5; P1: Critical path - AC 1, 2, 8, 9 (catalog, cards, damage) | Tasks T1, T12 | Implementing |
| EGR-02 | P1: Curve - AC 1 to 4, 8 to 10 (seeded numbers, payload, countdown, label) | Tasks T2, T13 | In Tasks |
| EGR-03 | P1: Critical path - AC 3, 6, 7 (seeded resistances, chip) | Tasks T2, T13 | In Tasks |
| EGR-04 | P1: Curve - AC 5 to 7; Critical path - AC 4, 5 (migration V16) | Tasks T3 | In Tasks |
| EGR-05 | P1: Affixes - AC 1 to 3 (backend domain, seed, storage, V17, payload) | Tasks T4, T5, T6 | In Tasks |
| EGR-06 | P1: Affixes - AC 11, 12 (game data, fallback, farm) | Tasks T7, T10, T14 | Implementing |
| EGR-07 | P1: Affixes - AC 4 to 10 and the Edge Cases (combat rules) | Tasks T7, T8, T9, T11, T14 | Implementing |
| EGR-08 | P1: Display - AC 1 to 6 (chip) | Tasks T11, T15, T17 | Implementing |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `node .specs/features/early-game-rebalance/sim/balance.mjs` prints `sem parede` for the three starting heroes at 6, 8 and 10 clicks per second ("depois"), and the times of Goal 4.
- [ ] Backend tests pin the Chapter Table, the Affix Table, the talent values and both migrations with exact numbers.
- [ ] e2e tests show each affix rule, the chip texts, the 8-phase label and the critical chip in the browser.
- [ ] The existing suites pass, with re-pinned values only where a task names them.
