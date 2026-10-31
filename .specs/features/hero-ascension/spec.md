# Hero Ascension Specification

## Problem Statement

A hero stops growing at 3 stars: three cards of the same stars fuse into the next stars only from 0 to 2 (`characters`: "A 3-star card cannot be fused"), so every copy dropped after a hero reaches 3 stars is dead weight in the bag. The owner asked (2026-10-31): "poder fazer upgrade no herói além de 3 estrelas, dessa maneira vai aumentando os níveis da skill e o poder do herói". This feature raises the star cap to 9. Each star from 4 to 9 raises one of the hero's three skills by one level, in slot order (more damage and stronger effects), and raises the hero's star bonus on the leader's click. The upgrade uses the fusion the player already knows, so 9 stars is a long farm: 19 683 blank cards of one hero. No new screen, currency or database column is needed.

The owner reviewed the first draft (commit `ce8653e`, cap 6, all three skills levelling together) on 2026-10-31 and changed it: cap 9, one skill per star, purple stars for 4 to 6 and another colour from 7, cards only, drop rates unchanged.

## Facts From the Code (not decisions)

- Fusion lives in `PlayerCards.fuse` (`backend/.../domain/PlayerCards.kt:41-50`): 3 copies of stars 0 to 2 become 1 copy of the next stars. `MAX_STARS = 3` also bounds the stored copies (`PlayerCards.kt:24`), and `HeroView.of` reports copies for stars 0 to `MAX_STARS` (`HeroView.kt:29`). A skill is unlocked when the hero's stars are at least its slot (`HeroView.kt:30`).
- `card_copies.stars` is a plain `integer` with no check constraint (`V1__schema.sql:124-130`), so copies of 4 to 9 stars need no migration.
- The leader's star bonus is `STAR_BONUS` (`game/src/domain/heroes/starBonus.js:6-11`): 1 star +10 % click damage; 2 stars +20 % click damage, +20 % critical damage; 3 stars +40 % click damage, +30 critical chance, +50 % critical damage. `leaderAttacker` adds it to the click attacker, and skill hits are a percent of that attacker's base damage (`hero-skills`, AD-012). `starBonus` answers no bonus for a star count missing from the table.
- Skill numbers live in `game/src/domain/skills/skillCatalog.js` (hits, cast, ticks, buff and debuff ids, stun, root, countdown extension) and `skillDamage.js:68-73` (Ventos 50, Bênção 25 and x1.3, Fumaça 15, Brado 30, Prisão x1.25). `SkillCombat` keeps cooldowns per (hero, slot) and stores a damage over time with the attacker it was cast with (`skillCombat.js:79-95`).
- The game reads `skill.unlocked` from `GET /heroes`. The Fusão screen lists only the rows with 3 or more copies (`fusionView.js:9`, `availableFusions`). The bag detail says `Estrela máxima: não pode ser fundida` for a 3-star entry (`bagView.js:41`).
- No skill cooldown is shorter than the duration of the same skill's effect (Veneno 15 s for 8 s, Bênção 30 s for 15 s, Brado 30 s for 10 s, Fumaça 35 s for 10 s, Prisão 18 s for 2 s, Ventos 40 s for 12 s), so one hero can never cast an effect again while it still runs.
- The previous backend rejects any stored copy above 3 stars (`PlayerCards.kt:24` throws), so after a rollback a player holding a 4-star copy would fail every request that loads their cards (Design, Deploy Order).
- Card drop rates (`application.yaml`): the miniboss of stage n drops a card at 7 % x n, a repeated chapter boss win at 80 %, farm wins at most one every 5 s. Every drop is a 0-star card of the chapter's hero (AD-005, AD-006).
- The item rarity frames already use purple for EPIC (`#9b59d0`) and gold for LEGENDARY (`#d9a521`, glow `rgb(255 214 90 / 0.6)`) (`game/public/style.css:1886-1924`). The normal stars text is `--color-accent-700` `#8c491a` (`style.css:1096`).

## Goals

- [ ] A hero can be fused past 3 stars, up to 9 stars, with the same Fusão screen and the same "3 copies make 1 copy of the next stars" rule; one 9-star hero costs 19 683 blank cards.
- [ ] Each star from 4 to 9 raises exactly one skill by one level, in slot order (4★ skill 1, 5★ skill 2, 6★ skill 3, 7★ skill 1, 8★ skill 2, 9★ skill 3), so at 9 stars all three skills are level 3; a level scales the skill's damage and effect by +25 % per level, checked by unit tests with exact numbers.
- [ ] Every star above 3 raises the leader's star bonus (Star Bonus table), so the click, the attribute panel and every skill hit grow.
- [ ] The player sees the new stars (purple for 4 to 6, gold for 7 to 9), the level of each skill and the star power on the hero screens and the skill bar.
- [ ] A hero of 0 to 3 stars plays, deals damage and looks exactly as today, apart from the new `Nível 1` label on its unlocked skill rows.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A copper, silver or gold cost for the fusions above 3 stars | User decision D2: cards only, like today's fusion |
| Stars above 9 | User decision D1 |
| Picking which skill a star raises | User decision D3: the order is fixed by slot |
| Shorter cooldowns or longer durations per level | Default D4: only damage and effect strength scale |
| Changes to card drop rates or the farm | User decision D9: the owner wants 9 stars to be a long grind |
| Ally damage of 4 to 9 star heroes | Belongs to `hero-team` (not built yet). Its star multiplier gains 10, 12, 14, 16, 18 and 20 for 4 to 9 stars (D6, written into `.specs/features/hero-team/spec.md`, Ally Damage) |
| Selling or converting spare copies (including spare 9-star copies) | `characters`: spare cards stay in the bag; selling cards is a later feature |
| New art (star icons, frames, an ascension animation) | D7: text and CSS only; the `ui-artist` reviews the result |
| A database migration | `card_copies.stars` has no constraint (Facts), so none is needed |
| Translating existing English text | TD-001 (AD-007) |

---

## Star Bonus

The leader's click bonus for its stars (totals for that star count, not cumulative). Rows 0 to 3 exist today and do not change. Rows 4 to 9 add +30 % click damage, +5 critical chance and +25 % critical damage per star over the row before (default D5).

| Stars | Click damage | Critical chance (points) | Critical damage | Click on Base 1, no pieces, no talents | Critical chance with the base 10 | Critical multiplier with the base x2 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | +0 % | +0 | +0 % | 1 | 10 | 2 |
| 1 | +10 % | +0 | +0 % | 1.1 | 10 | 2 |
| 2 | +20 % | +0 | +20 % | 1.2 | 10 | 2.2 |
| 3 | +40 % | +30 | +50 % | 1.4 | 40 | 2.5 |
| 4 | **+70 %** | **+35** | **+75 %** | **1.7** | **45** | **2.75** |
| 5 | **+100 %** | **+40** | **+100 %** | **2.0** | **50** | **3.0** |
| 6 | **+130 %** | **+45** | **+125 %** | **2.3** | **55** | **3.25** |
| 7 | **+160 %** | **+50** | **+150 %** | **2.6** | **60** | **3.5** |
| 8 | **+190 %** | **+55** | **+175 %** | **2.9** | **65** | **3.75** |
| 9 | **+220 %** | **+60** | **+200 %** | **3.2** | **70** | **4.0** |

## Skill Levels

- **Level of the skill in slot n** (1, 2 or 3) of a hero with s stars: 0 while it is locked (s < n); otherwise `1 + floor((s - n) / 3)`. Equivalently, the star s from 4 to 9 raises the skill of slot `((s - 4) mod 3) + 1` by one level. The highest level is 3.
- **Level factor** `f(L) = 1 + 0.25 x (L - 1)`: 1.0, 1.25, 1.5 for levels 1 to 3.
- A skill used at level L multiplies every **scaled value** of the table below by `f(L)`. Every other number of the skill (cooldown, effect duration, cast time, Stun and Root time, tick count, Poison maximum stacks, Corte Dimensional's +30 armor pierce, Luz Divina's x1.5 against DARKNESS) does not change (default D4).
- A buff, a debuff or a damage over time keeps the level it was cast with until it ends; a later fusion changes only the next cast.
- Decimal results are compared with a tolerance of 1e-9 (L-012).

Levels by stars (slot 1, slot 2, slot 3):

| Stars | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Levels | 0, 0, 0 | 1, 0, 0 | 1, 1, 0 | 1, 1, 1 | **2**, 1, 1 | 2, **2**, 1 | 2, 2, **2** | **3**, 2, 2 | 3, **3**, 2 | 3, 3, **3** |
| Skill the star raised | - | unlocks 1 | unlocks 2 | unlocks 3 | slot 1 | slot 2 | slot 3 | slot 1 | slot 2 | slot 3 |

Scaled values:

| Hero | Slot | Skill | Scaled value | Level 1 | Level 2 | Level 3 |
| --- | --- | --- | --- | --- | --- | --- |
| Kael | 1 | Corte Dimensional | hit % | 1500 | 1875 | 2250 |
| Kael | 2 | Investida do Baluarte | hit % | 400 | 500 | 600 |
| Kael | 3 | Brado Aterrador | physical defense removed (points) | 30 | 37.5 | 45 |
| Lyra | 1 | Flecha Dupla | % of each of the 2 hits | 300 | 375 | 450 |
| Lyra | 2 | Tiro Preciso | % of the aimed hit | 3000 | 3750 | 4500 |
| Lyra | 3 | Ventos Ligeiros | click damage % | 50 | 62.5 | 75 |
| Orina | 1 | Prisão de Espinhos | magical damage bonus % (multiplier) | 25 (x1.25) | 31.25 (x1.3125) | 37.5 (x1.375) |
| Orina | 2 | Tempestade Arcana | % of each tick | 200 | 250 | 300 |
| Orina | 3 | Chuva de Meteoros | hit % | 2500 | 3125 | 3750 |
| Seraphine | 1 | Bênção da Grande Árvore | click damage % | 25 | 31.25 | 37.5 |
| Seraphine | 1 | Bênção da Grande Árvore | physical damage bonus % (multiplier) | 30 (x1.3) | 37.5 (x1.375) | 45 (x1.45) |
| Seraphine | 2 | Luz Divina | hit % | 800 | 1000 | 1200 |
| Seraphine | 3 | Carrilhão da Aurora | seconds added to the boss countdown | 4 | 5 | 6 |
| Vex | 1 | Bomba de Veneno | % of each tick per stack | 100 | 125 | 150 |
| Vex | 2 | Bomba de Fumaça | critical chance (points) | 15 | 18.75 | 22.5 |
| Vex | 3 | Golpe Sangrento | hit % | 600 | 750 | 900 |
| Vex | 3 | Golpe Sangrento | % of each Bleed tick | 150 | 187.5 | 225 |

Worked examples (neutral monster: same element as the attacker, every defense 0; roll 0.99, so no critical unless forced):

| Case | Result |
| --- | --- |
| Kael 3 stars (Base 1.4) uses Corte Dimensional, level 1 (today) | 1.4 x 15 = **21** |
| Kael 4 stars (Base 1.7) uses Corte Dimensional, level 2 | 1.7 x 18.75 = **31.875** |
| Kael 4 stars (Base 1.7) uses Investida do Baluarte, still level 1 | 1.7 x 4 = **6.8** |
| Kael 9 stars (Base 3.2) uses Corte Dimensional, level 3 | 3.2 x 22.5 = **72** |
| Lyra 9 stars (Base 3.2) clicks under Ventos Ligeiros cast at level 3 | 3.2 x 1.75 = **5.6** |
| Lyra cast Ventos Ligeiros at 5 stars (level 1), then fused to 6 stars (Ventos level 2), clicks | 2.3 x 1.5 = **3.45** (new star bonus, Ventos stays level 1 until it ends) |
| Base 1, Brado Aterrador level 3, monster physical defense 50, 100 % physical hit | 1 x (1 - 5 / 100) = **0.95** |

## Fusion Cost

Cards only, 3 copies of stars s make 1 copy of stars s + 1 (User decision D2). Blank (0-star) cards needed for one copy of each stars, starting from nothing:

| Stars | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Blank cards (3^stars) | 3 | 9 | 27 | 81 | 243 | 729 | 2 187 | 6 561 | **19 683** |
| Fusions in total | 1 | 4 | 13 | 40 | 121 | 364 | 1 093 | 3 280 | 9 841 |

Drop rates do not change (Facts; User decision D9).

## Star Colours

| Stars | Class on `.hero-stars` | Look |
| --- | --- | --- |
| 0 to 3 | none | As today: text `#8c491a` |
| 4 to 6 | `is-ascended` | Text purple `#7a3fa0`, weight 800 (5.8:1 on `#f5ead8`, 5.2:1 on the card `#ebddc5`) |
| 7 to 9 | `is-exalted` | A gold chip: background `#d9a521` (the LEGENDARY frame gold), text `#201e1d` (7.4:1), weight 800, radius 999px, padding 0 8px, glow `0 0 6px rgb(255 214 90 / 0.6)` |

A skill level pill and a skill bar badge use purple for levels 1 and 2 and the same gold chip for level 3 (level 3 exists only from 7 stars).

---

## Assumptions & Open Questions

Rows marked `y` were decided by the owner on 2026-10-31. Rows marked `n` are the product owner's defaults the owner has not changed; the feature is designed and tasked on them, and each one can change without touching the others unless the row says so.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **D1** Highest star level | 9 stars (six new levels: 4 to 9) | User decision: reaching it should take a long farm of many cards | y |
| **D2** Cost of a star above 3 | The fusion rule continues: 3 copies of 3 to 8 stars become 1 copy of the next stars. Cards only, no coins. One hero at 4 to 9 stars costs 81, 243, 729, 2 187, 6 561 and 19 683 blank cards in total (Fusion Cost) | User decision: same rule as today, no gold cost | y |
| **D3** Which skill levels up | One skill per star in slot order: 4★ skill 1, 5★ skill 2, 6★ skill 3, 7★ skill 1, 8★ skill 2, 9★ skill 3; level of slot n = `1 + floor((stars - n) / 3)` once unlocked; all three are level 3 at 9★ (Skill Levels) | User decision: the same one-skill-per-star pattern as stars 1 to 3 | y |
| **D4** What a skill level changes | +25 % per level on the damage percents and the effect strength of the Skill Levels table. Cooldowns, durations, cast time, Stun and Root time, tick count, stacks, armor pierce and the DARKNESS bonus stay | One factor for 15 skills, so the screen can say `+25% de poder` truthfully; keeps every timing test and cooldown text | n (default) |
| **D5** Hero power | Star Bonus rows 4 to 9: +30 % click damage, +5 critical chance and +25 % critical damage per star over the row before (9★: +220 %, +60, +200 %) | Same three stats as today, linear steps; a 9★ leader's chance is 70 % with the base 10, below the 100 cap | n (default) |
| **D6** Ally star multiplier (`hero-team`) | 10, 12, 14, 16, 18, 20 for 4 to 9 stars (the 2 per star step of 0 to 3 stars continues) | `hero-team` defines 2, 4, 6, 8 for 0 to 3 stars and is not built; written into its spec so it ships with that feature | n (default) |
| **D7** How stars 4 to 9 look | The same `<n>★` text wherever `.hero-stars` shows it: purple `#7a3fa0` (class `is-ascended`) for 4 to 6, a gold chip `#d9a521` with dark text `#201e1d` (class `is-exalted`) for 7 to 9 (Star Colours). Skill rows show `Nível <L>`, the skill bar shows a `Nv. <L>` badge from level 2; level 3 pills and badges are gold. No new art | User decision: purple for 4 to 6, another colour from 7. The gold value is the PO's pick: it repeats the EPIC purple to LEGENDARY gold order of the item frames, stays clear of the brown of 0 to 3 stars and keeps 7.4:1 contrast; checked by the `ui-artist` (T17) | y |
| **D8** Name of the action | Still `Fundir` on the Fusão screen. No "Ascensão" word in the UI; the feature name `hero-ascension` is internal | No new concept for the player | n (default) |
| **D9** Balance against chapters and drop rates | No drop rate changes. A 9★ leader deals about 3.4 times the skill damage of a 3★ one (Base 3.2 / 1.4 x level factor 1.5), a 6★ one about 2.1 times (2.3 / 1.4 x 1.25) | User decision: keep the drop rates, the owner wants a long grind. Not balance-tested | y |
| **D10** Shipping order | Independent of `campaign-chapters` and `hero-team`; no Flyway migration, so no version number clashes with their V8 to V10 | Nothing in this feature reads chapters or teams | n (default) |
| **D11** Fusion result text | `Nova carta: <nome> <n>★` as today for 1 to 3 stars; `Nova carta: <nome> <n>★ · <habilidade> no nível <L>` for 4 to 9 stars, naming the one skill the new star raised (`Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2`) | L-010: every new text is exact; one skill rises per star (D3), so the line names it | n (default) |
| **D12** Spare 9-star copies | Stay in the bag with no use; the bag detail says `Estrela máxima: não pode ser fundida` | `characters` keeps spare cards until selling exists | n (default) |
| Source of the skill level in the game | The `level` field of each skill in `GET /heroes` and the fusion answer. A skill without `level` (a payload from the previous backend) is level 1 when unlocked, 0 when locked | The server owns the rule like `unlocked`; the game keeps working against the previous backend | n (default) |
| Fusion request bounds | `stars` 0 to 8 is a fusion; 9 or more, a negative number, a missing value or a non-integer answer 400 `INVALID_FUSION` | Same error as today, new upper bound | n (default) |
| Rollback safety | The backend first ships a version that reads copies of 0 to 9 stars with fusion still capped at 2, and opens the fusions of 3 to 8 stars in a later commit (Design, Deploy Order) | User decision: keep the two-step deploy; the previous backend throws on a copy above 3 stars (Facts) | y |
| Language | Every new text is Portuguese: `Nível <L>`, `+<p>% de poder`, `Nv. <L>`, `Poder das estrelas: ...`, `<habilidade> no nível <L>` | AD-007 | y |
| Observability (convention, not an AC) | The existing INFO log `Fusing cards username=<u> hero=<h> stars=<s>` covers the new fusions; nothing new is logged | L-007, L-014 | n (default) |
| Implicit dimensions | Input bounds: Fusion request bounds. Failure states: the existing 409 `NOT_ENOUGH_CARDS`, 400 `INVALID_FUSION` and the error line `Não foi possível fundir as cartas.`. Idempotency: a fusion is not idempotent; a repeated request needs 3 more copies or answers 409, as today. Auth: the existing 401 and own-bag rule. Concurrency: the existing `player_cards` row lock (race test in ASC-02). Data lifecycle: copies cascade with the user and survive the account reset (AD-015). Observability: convention above. External dependency: N/A because only the database is involved. State transitions: a hero's stars only rise through fusion, 0 to 9, never down | Large-scope sweep | n (default) |

**Open questions:** none blocking. D4, D5, D6, D8, D10, D11 and D12 keep the product owner's defaults until the owner says otherwise.

---

## User Stories

### P1: Fuse past 3 stars on the backend ⭐ MVP

**User Story**: As a player with a 3-star hero, I want three of its 3-star cards to fuse into a 4-star card, and so on up to 9 stars, so that the copies I keep collecting still make my hero stronger.

**Why P1**: Every other story reads the stars this one stores.

**Acceptance Criteria**:

1. The backend SHALL store card copies of 0 to 9 stars and report a hero's stars as the highest stars among its copies, from 0 to 9.  <!-- ubiquitous -->
2. WHEN an authenticated player calls `GET /heroes` THEN each hero SHALL carry `copies` with the keys `"0"` to `"9"`, each the number of copies held at that stars (0 when none).  <!-- event-driven -->
3. WHEN `GET /heroes` or a fusion answers a hero THEN the skill of slot n SHALL carry `level` (integer): 0 when the hero's stars are below n, else `1 + floor((stars - n) / 3)` (the Levels by stars table: `[2, 1, 1]` at 4 stars, `[2, 2, 2]` at 6, `[3, 3, 3]` at 9).  <!-- event-driven -->
4. WHEN an authenticated player calls `POST /heroes/{id}/fuse` with `stars` from 3 to 8 and holds 3 or more copies of that hero at that stars THEN the backend SHALL remove 3 copies of that stars, add 1 copy of stars + 1 and answer 200 with the updated hero.  <!-- event-driven -->
5. WHEN a fusion of three 3-star copies succeeds THEN the answer SHALL carry `stars` 4, `copies."4"` 1 and skill levels `[2, 1, 1]`.  <!-- event-driven -->
6. WHEN a fusion of three 8-star copies succeeds THEN the answer SHALL carry `stars` 9, `copies."9"` 1 and every skill with `unlocked` true and `level` 3.  <!-- event-driven -->
7. WHEN a player holding 4 copies of 3 stars fuses `stars` 3 once THEN the backend SHALL leave 1 copy of 3 stars and 1 copy of 4 stars.  <!-- event-driven -->
8. IF `stars` is 9 or more, negative, missing or not an integer THEN `POST /heroes/{id}/fuse` SHALL answer 400 `INVALID_FUSION` and change nothing.  <!-- unwanted-behavior -->
9. IF the player holds fewer than 3 copies at the requested stars from 3 to 8 THEN `POST /heroes/{id}/fuse` SHALL answer 409 `NOT_ENOUGH_CARDS` and change nothing.  <!-- unwanted-behavior -->
10. WHEN two fusions of the same three 3-star copies arrive together THEN the backend SHALL answer exactly one 200 and one 409 `NOT_ENOUGH_CARDS`, leaving 1 copy of 4 stars.  <!-- event-driven -->
11. WHEN a fusion of 3 to 8 stars succeeds THEN the backend SHALL leave the player's wallet, the leader and every other copy unchanged.  <!-- event-driven -->
12. WHEN an account reset is applied to a player holding a 9-star copy THEN `GET /heroes` SHALL still answer that hero with `stars` 9 and skill levels `[3, 3, 3]`.  <!-- event-driven -->

**Independent Test**: A backend integration test gives a player 3 copies of Kael at 3 stars, fuses `stars` 3 and reads `stars` 4, `copies."4"` 1 and skill levels `[2, 1, 1]`; fusing `stars` 9 answers 400.

---

### P1: Skill levels in combat ⭐ MVP

**User Story**: As a player, I want each star above 3 to make one of my leader's skills hit harder or its effect stronger so that every star is felt in the fight.

**Why P1**: It is half of the owner's request ("aumentando os níveis da skill").

**Acceptance Criteria**:

1. WHEN the leader uses a skill whose `level` is L THEN the game SHALL multiply every scaled value of that skill in the Skill Levels table by `1 + 0.25 x (L - 1)`.  <!-- event-driven -->
2. WHEN Kael with 4 stars, no pieces and no talents uses Corte Dimensional (level 2) on a neutral monster with every defense 0 and no critical THEN the game SHALL deal 31.875 and show `31.9`.  <!-- event-driven -->
3. WHEN Kael with 4 stars uses Investida do Baluarte (still level 1) on the same monster THEN the game SHALL deal 6.8.  <!-- event-driven -->
4. WHEN Kael with 9 stars, no pieces and no talents uses Corte Dimensional (level 3) on the same monster THEN the game SHALL deal 72.  <!-- event-driven -->
5. WHEN a skill hit, the aimed shot of Tiro Preciso or a tick of Tempestade Arcana, Bomba de Veneno or Golpe Sangrento lands at level L THEN its percent of Base SHALL be the Level L column of the Skill Levels table.  <!-- event-driven -->
6. WHILE Ventos Ligeiros, Bênção da Grande Árvore or Bomba de Fumaça cast at level L runs, the game SHALL apply the Level L click damage, physical damage bonus or critical points of the Skill Levels table.  <!-- state-driven -->
7. WHILE Brado Aterrador or Prisão de Espinhos cast at level L runs on a monster, the game SHALL remove the Level L physical defense points (never below 0) or multiply magical damage by the Level L multiplier.  <!-- state-driven -->
8. WHEN Carrilhão da Aurora is used at level L on a boss THEN the game SHALL add 4, 5 or 6 s (levels 1 to 3) to the countdown.  <!-- event-driven -->
9. The game SHALL keep the cooldown, the effect duration, the cast time, the Stun and Root time, the tick count, the Poison maximum of 3 stacks, Corte Dimensional's +30 armor pierce and Luz Divina's x1.5 against DARKNESS the same at every level.  <!-- ubiquitous -->
10. WHEN the leader fuses to more stars while one of its buffs, debuffs or damage over time runs THEN the game SHALL keep that effect at the level it was cast with until it ends.  <!-- event-driven -->
11. WHEN Lyra with 5 stars casts Ventos Ligeiros (level 1) and then fuses to 6 stars (Ventos level 2) THEN her next click on a neutral, defenseless monster without a critical SHALL deal 3.45.  <!-- event-driven -->
12. IF an unlocked skill in the heroes payload carries no `level` THEN the game SHALL use it at level 1.  <!-- unwanted-behavior -->
13. WHILE the leader has 0 to 3 stars the game SHALL deal exactly the skill damage and effects of `hero-skills`.  <!-- state-driven -->

**Independent Test**: In the browser against the fake backend, a 4-star Kael leader presses `1` on a phase monster of 1 000 health with no defense and reads 968.125 health.

---

### P1: Star power of the leader ⭐ MVP

**User Story**: As a player, I want my leader's clicks to grow with every star above 3 so that the hero itself gets stronger, not only its skills.

**Why P1**: The other half of the owner's request ("e o poder do herói").

**Acceptance Criteria**:

1. WHILE the leader has 4 to 9 stars the game SHALL add that row of the Star Bonus table to the leader's click attacker.  <!-- state-driven -->
2. WHEN a leader with 4, 5, 6, 7, 8 or 9 stars, no pieces and no talents clicks a neutral, defenseless monster without a critical THEN the game SHALL deal 1.7, 2.0, 2.3, 2.6, 2.9 or 3.2.  <!-- event-driven -->
3. WHEN a 4-star leader with no pieces and no talents clicks a neutral, defenseless monster with critical resistance 0 and `random()` 0.44 THEN the game SHALL deal a critical hit of 4.675 (shown `4.7`), and with `random()` 0.45 a normal hit of 1.7.  <!-- event-driven -->
4. WHEN a 9-star leader with no pieces and no talents clicks the same monster with `random()` 0.69 THEN the game SHALL deal a critical hit of 12.8 (shown `12.8`), and with `random()` 0.70 a normal hit of 3.2.  <!-- event-driven -->
5. WHEN the Equipamento screen shows a leader with no pieces and no talents THEN the attribute panel SHALL read `Dano de clique: 1.7`, `Chance de crítico: 45%`, `Dano crítico: x2.75` at 4 stars and `Dano de clique: 3.2`, `Chance de crítico: 70%`, `Dano crítico: x4` at 9 stars.  <!-- event-driven -->
6. WHEN the leader fuses to more stars THEN the game SHALL use the new row of the Star Bonus table on the next click and the next skill, without reloading the scene.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, a 9-star Kael clicks a 1 000-health neutral monster once and reads 996.8 health.

---

### P1: Fusão and Mochila past 3 stars ⭐ MVP

**User Story**: As a player, I want the Fusão and Mochila screens to offer the fusions of 3 to 8 stars so that I can upgrade my hero without leaving the screens I know.

**Why P1**: Without it the backend fusion is unreachable for the player.

**Acceptance Criteria**:

1. WHEN the player opens Fusão THEN the game SHALL list one row for every (hero, stars 0 to 8) with 3 or more copies, labelled `<nome> <n>★ → <n+1>★`, with `<copies>/3` and a `Fundir` button.  <!-- event-driven -->
2. WHEN a `Fundir` of n stars from 3 to 8 succeeds THEN the game SHALL show `Nova carta: <nome> <n+1>★ · <habilidade> no nível <L>`, where the skill is the slot `((n + 1 - 4) mod 3) + 1` of the answered hero and L its `level` (`Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2`, `Nova carta: Kael Raizférrea 6★ · Brado Aterrador no nível 2`, `Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3`).  <!-- event-driven -->
3. WHEN a `Fundir` of 0, 1 or 2 stars succeeds THEN the game SHALL show `Nova carta: <nome> <n+1>★` as today.  <!-- event-driven -->
4. WHEN the player opens Mochila THEN the game SHALL list the entries of 4 to 9 stars like the others, as `<nome> <n>★` and `x<copies>`.  <!-- event-driven -->
5. WHEN the player opens a bag entry of 3 to 8 stars THEN the game SHALL show `Para fundir: <copies>/3`, and the `Ir para a fusão` button when copies are 3 or more.  <!-- event-driven -->
6. WHEN the player opens a bag entry of 9 stars THEN the game SHALL show `Estrela máxima: não pode ser fundida` and no `Ir para a fusão` button.  <!-- event-driven -->
7. IF a fusion of 3 to 8 stars fails THEN the game SHALL show `Não foi possível fundir as cartas.`, keep the Fusão screen open and leave the bag unchanged.  <!-- unwanted-behavior -->
8. WHEN a fusion changes the leader's stars THEN the game SHALL redraw the skill bar with the new levels without reloading the scene and SHALL keep the cooldown each slot had.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, Kael holds 3 copies of 3 stars: Fusão shows `Kael Raizférrea 3★ → 4★` with `3/3`; `Fundir` shows `Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2`.

---

### P2: Stars, levels and star power on screen

**User Story**: As a player, I want to see that a hero is above 3 stars, what level each skill is and what its stars give so that I know what each upgrade bought.

**Why P2**: The upgrade works without it; it makes the gain visible.

**Acceptance Criteria**:

1. WHILE an owned hero has 4 to 6 stars the game SHALL give every `.hero-stars` element showing it (catalog card, hero detail, bag entry detail) the class `is-ascended`, drawn in color `#7a3fa0` at font weight 800.  <!-- state-driven -->
2. WHILE an owned hero has 7 to 9 stars the game SHALL give every `.hero-stars` element showing it the class `is-exalted` (and not `is-ascended`), drawn as a chip with background `#d9a521`, text color `#201e1d` and font weight 800; with 0 to 3 stars it SHALL have neither class.  <!-- state-driven -->
3. WHEN a skill row is shown (hero detail, bag entry detail, skill tooltip) for an unlocked skill of level 1 THEN it SHALL hold a `.skill-level` element with the text `Nível 1` and `data-level="1"`.  <!-- event-driven -->
4. WHEN a skill row is shown for a skill of level 2 or 3 THEN its `.skill-level` text SHALL be `Nível 2 · +25% de poder` or `Nível 3 · +50% de poder`, with `data-level` 2 or 3; a level 3 pill is drawn gold (background `#d9a521`, text `#201e1d`).  <!-- event-driven -->
5. WHEN a skill row is shown for a locked skill THEN it SHALL hold no `.skill-level` element.  <!-- event-driven -->
6. WHILE a leader's skill has level 2 or 3 its skill bar slot SHALL show a badge `Nv. <L>` (`data-testid="skill-level-<slot>"`, `data-level="<L>"`) on the top right corner of the art, purple at level 2 and gold at level 3; a slot of level 1 or a locked slot SHALL show none.  <!-- state-driven -->
7. WHEN the player opens the detail of an owned hero with 1 to 9 stars THEN it SHALL show `Poder das estrelas: ` followed by the non-zero parts of its Star Bonus row, in the order `+<c>% de dano de clique`, `+<x> de chance de crítico`, `+<d>% de dano crítico`, joined by `, ` (`data-testid="hero-star-power"`).  <!-- event-driven -->
8. WHEN the detail of a 0-star or not owned hero opens THEN it SHALL show no `hero-star-power` element.  <!-- event-driven -->
9. WHEN the detail of a 4-star hero opens THEN `hero-star-power` SHALL read `Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico`; for a 9-star hero `Poder das estrelas: +220% de dano de clique, +60 de chance de crítico, +200% de dano crítico`; for a 1-star hero `Poder das estrelas: +10% de dano de clique`.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, a 5-star Kael shows `5★` in purple on its catalog card, skill rows `Nível 2 · +25% de poder`, `Nível 2 · +25% de poder`, `Nível 1` in its detail, `Nv. 2` on skill bar slots 1 and 2 and none on slot 3, and `Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico`; an 8-star Kael shows `8★` as a gold chip and skill rows at levels 3, 3, 2.

---

## Edge Cases

- WHEN a hero holds 1 copy of 9 stars and 3 copies of 0 stars THEN the 0-star row SHALL still fuse and the hero SHALL stay at 9 stars.
- WHEN a 9-star hero receives a dropped 0-star card THEN its stars and skill levels SHALL stay 9 and `[3, 3, 3]`.
- WHEN the leader fuses to 4 stars while one of its skills cools THEN the slot SHALL keep counting down from the seconds it had.
- WHEN a skill of a 4-star hero is shown in the tooltip of an effect tag THEN the tooltip row SHALL carry the same `.skill-level` text as the hero detail.
- IF the game receives a skill with `level` but `unlocked` false THEN it SHALL treat the skill as locked (level 0) and ignore its level.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ASC-01 | P1: Fuse past 3 stars on the backend - AC 1, 2, 3 (read: copies 0 to 9, skill level per slot) | Tasks | Pending |
| ASC-02 | P1: Fuse past 3 stars on the backend - AC 4 to 12 (fusion 3 to 8, bounds, race, reset) | Tasks | Pending |
| ASC-03 | P1: Skill levels in combat - AC 1 to 5, 9, 13 (level factor on hits and ticks, unchanged values) | Tasks | Pending |
| ASC-04 | P1: Skill levels in combat - AC 6 to 8, 10 (effects scaled and kept at cast level) | Tasks | Pending |
| ASC-05 | P1: Skill levels in combat - AC 11, 12 (scene reads the payload level, fallback 1) | Tasks | Pending |
| ASC-06 | P1: Star power of the leader - AC 1 to 6 | Tasks | Pending |
| ASC-07 | P1: Fusão and Mochila past 3 stars - AC 1 to 8 | Tasks | Pending |
| ASC-08 | P2: Stars, levels and star power on screen - AC 1 to 9 | Tasks | Pending |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Unit tests pin every number of the Star Bonus rows 4 to 9, the level of every slot at every stars 0 to 9, every scaled value of the Skill Levels table at level 2 or 3, and every value that must not scale.
- [ ] A backend integration test fuses 3 to 4 and 8 to 9 stars over HTTP, races two 3-star fusions, and gets 400 for `stars` 9.
- [ ] An e2e test fuses a hero to 4 stars and another to 9 stars on the Fusão screen and reads the new star text, the level badges and the larger skill damage.
- [ ] Every existing backend, unit and e2e test of heroes, skills and click power passes; the only edited ones are those that pinned the 3-star cap, renamed after the new behaviour.
