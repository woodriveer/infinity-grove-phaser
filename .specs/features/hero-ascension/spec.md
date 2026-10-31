# Hero Ascension Specification

## Problem Statement

A hero stops growing at 3 stars: three cards of the same stars fuse into the next stars only from 0 to 2 (`characters`: "A 3-star card cannot be fused"), so every copy dropped after a hero reaches 3 stars is dead weight in the bag. The owner asked (2026-10-31): "poder fazer upgrade no herói além de 3 estrelas, dessa maneira vai aumentando os níveis da skill e o poder do herói". This feature raises the star cap to 6. Each star above 3 raises the level of the hero's three skills (more damage and stronger effects) and the hero's star bonus on the leader's click. The upgrade uses the fusion the player already knows. No new screen, currency or database column is needed.

## Facts From the Code (not decisions)

- Fusion lives in `PlayerCards.fuse` (`backend/.../domain/PlayerCards.kt:41-50`): 3 copies of stars 0 to 2 become 1 copy of the next stars. `MAX_STARS = 3` also bounds the stored copies (`PlayerCards.kt:24`), and `HeroView.of` reports copies for stars 0 to `MAX_STARS` (`HeroView.kt:29`). A skill is unlocked when the hero's stars are at least its slot (`HeroView.kt:30`).
- `card_copies.stars` is a plain `integer` with no check constraint (`V1__schema.sql:124-130`), so copies of 4 to 6 stars need no migration.
- The leader's star bonus is `STAR_BONUS` (`game/src/domain/heroes/starBonus.js:6-11`): 1 star +10 % click damage; 2 stars +20 % click damage, +20 % critical damage; 3 stars +40 % click damage, +30 critical chance, +50 % critical damage. `leaderAttacker` adds it to the click attacker, and skill hits are a percent of that attacker's base damage (`hero-skills`, AD-012). `starBonus` answers no bonus for a star count missing from the table.
- Skill numbers live in `game/src/domain/skills/skillCatalog.js` (hits, cast, ticks, buff and debuff ids, stun, root, countdown extension) and `skillDamage.js:68-73` (Ventos 50, Bênção 25 and x1.3, Fumaça 15, Brado 30, Prisão x1.25). `SkillCombat` keeps cooldowns per (hero, slot) and stores a damage over time with the attacker it was cast with (`skillCombat.js:79-95`).
- The game reads `skill.unlocked` from `GET /heroes`. The Fusão screen lists only the rows with 3 or more copies (`fusionView.js:9`, `availableFusions`). The bag detail says `Estrela máxima: não pode ser fundida` for a 3-star entry (`bagView.js:41`).
- No skill cooldown is shorter than the duration of the same skill's effect (Veneno 15 s for 8 s, Bênção 30 s for 15 s, Brado 30 s for 10 s, Fumaça 35 s for 10 s, Prisão 18 s for 2 s, Ventos 40 s for 12 s), so one hero can never cast an effect again while it still runs.
- The previous backend rejects any stored copy above 3 stars (`PlayerCards.kt:24` throws), so after a rollback a player holding a 4-star copy would fail every request that loads their cards (Design, Risks).
- Card drop rates (`application.yaml`): the miniboss of stage n drops a card at 7 % x n, a repeated chapter boss win at 80 %, farm wins at most one every 5 s. Every drop is a 0-star card of the chapter's hero (AD-005, AD-006).

## Goals

- [ ] A hero can be fused past 3 stars, to 4, 5 and 6 stars, with the same Fusão screen and the same "3 copies make 1 copy of the next stars" rule.
- [ ] Every star above 3 raises all three skills one level (level 2 at 4 stars, 3 at 5, 4 at 6), and a level scales the skill's damage and effect by +25 % per level, checked by unit tests with exact numbers.
- [ ] Every star above 3 raises the leader's star bonus (Star Bonus table), so the click, the attribute panel and every skill hit grow.
- [ ] The player sees the new stars, the skill level and the star power on the hero screens and the skill bar.
- [ ] A hero of 0 to 3 stars plays, deals damage and looks exactly as today, apart from the new `Nível 1` label on its unlocked skill rows.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A copper or crystal cost for the fusions above 3 stars | Default D2: cards only, like today's fusion (pending owner decision) |
| Stars above 6 | Default D1 (pending owner decision) |
| Raising one skill at a time, or picking which skill to level | Default D3: all three skills rise together |
| Shorter cooldowns or longer durations per level | Default D4: only damage and effect strength scale |
| Changes to card drop rates or the farm | Default D9: the curve is tested in play first |
| Ally damage of 4 to 6 star heroes | Belongs to `hero-team` (not built yet). Its star multiplier gains 10, 12 and 14 for 4, 5 and 6 stars (D6, written into `.specs/features/hero-team/spec.md`, Ally Damage) |
| Selling or converting spare copies (including spare 6-star copies) | `characters`: spare cards stay in the bag; selling is a later feature |
| New art (star icons, frames, an ascension animation) | Default D7: text and CSS only; the `ui-artist` reviews the result |
| A database migration | `card_copies.stars` has no constraint (Facts), so none is needed |
| Translating existing English text | TD-001 (AD-007) |

---

## Star Bonus

The leader's click bonus for its stars (totals for that star count, not cumulative). Rows 0 to 3 exist today and do not change.

| Stars | Click damage | Critical chance (points) | Critical damage | Click on Base 1, no pieces, no talents | Critical chance with the base 10 | Critical multiplier with the base x2 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | +0 % | +0 | +0 % | 1 | 10 | 2 |
| 1 | +10 % | +0 | +0 % | 1.1 | 10 | 2 |
| 2 | +20 % | +0 | +20 % | 1.2 | 10 | 2.2 |
| 3 | +40 % | +30 | +50 % | 1.4 | 40 | 2.5 |
| 4 | **+70 %** | **+35** | **+75 %** | **1.7** | **45** | **2.75** |
| 5 | **+100 %** | **+40** | **+100 %** | **2.0** | **50** | **3.0** |
| 6 | **+130 %** | **+45** | **+125 %** | **2.3** | **55** | **3.25** |

## Skill Levels

- **Level of a skill**: 0 while it is locked (hero stars below its slot); 1 when it is unlocked and the hero has 1 to 3 stars; `stars - 2` when the hero has 4 to 6 stars (level 2, 3 or 4). All three skills of a 4 to 6 star hero are unlocked.
- **Level factor** `f(L) = 1 + 0.25 x (L - 1)`: 1.0, 1.25, 1.5, 1.75 for levels 1 to 4.
- A skill used at level L multiplies every **scaled value** of the table below by `f(L)`. Every other number of the skill (cooldown, effect duration, cast time, Stun and Root time, tick count, Poison maximum stacks, Corte Dimensional's +30 armor pierce, Luz Divina's x1.5 against DARKNESS) does not change.
- A buff, a debuff or a damage over time keeps the level it was cast with until it ends; a later fusion changes only the next cast.
- Decimal results are compared with a tolerance of 1e-9 (L-012).

| Hero | Slot | Skill | Scaled value | Level 1 | Level 2 | Level 3 | Level 4 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kael | 1 | Corte Dimensional | hit % | 1500 | 1875 | 2250 | 2625 |
| Kael | 2 | Investida do Baluarte | hit % | 400 | 500 | 600 | 700 |
| Kael | 3 | Brado Aterrador | physical defense removed (points) | 30 | 37.5 | 45 | 52.5 |
| Lyra | 1 | Flecha Dupla | % of each of the 2 hits | 300 | 375 | 450 | 525 |
| Lyra | 2 | Tiro Preciso | % of the aimed hit | 3000 | 3750 | 4500 | 5250 |
| Lyra | 3 | Ventos Ligeiros | click damage % | 50 | 62.5 | 75 | 87.5 |
| Orina | 1 | Prisão de Espinhos | magical damage bonus % (multiplier) | 25 (x1.25) | 31.25 (x1.3125) | 37.5 (x1.375) | 43.75 (x1.4375) |
| Orina | 2 | Tempestade Arcana | % of each tick | 200 | 250 | 300 | 350 |
| Orina | 3 | Chuva de Meteoros | hit % | 2500 | 3125 | 3750 | 4375 |
| Seraphine | 1 | Bênção da Grande Árvore | click damage % | 25 | 31.25 | 37.5 | 43.75 |
| Seraphine | 1 | Bênção da Grande Árvore | physical damage bonus % (multiplier) | 30 (x1.3) | 37.5 (x1.375) | 45 (x1.45) | 52.5 (x1.525) |
| Seraphine | 2 | Luz Divina | hit % | 800 | 1000 | 1200 | 1400 |
| Seraphine | 3 | Carrilhão da Aurora | seconds added to the boss countdown | 4 | 5 | 6 | 7 |
| Vex | 1 | Bomba de Veneno | % of each tick per stack | 100 | 125 | 150 | 175 |
| Vex | 2 | Bomba de Fumaça | critical chance (points) | 15 | 18.75 | 22.5 | 26.25 |
| Vex | 3 | Golpe Sangrento | hit % | 600 | 750 | 900 | 1050 |
| Vex | 3 | Golpe Sangrento | % of each Bleed tick | 150 | 187.5 | 225 | 262.5 |

Worked examples (neutral monster: same element as the attacker, every defense 0; roll 0.99, so no critical unless forced):

| Case | Result |
| --- | --- |
| Kael 4 stars (Base 1.7) uses Corte Dimensional, level 2 | 1.7 x 18.75 = **31.875** |
| Kael 6 stars (Base 2.3) uses Corte Dimensional, level 4 | 2.3 x 26.25 = **60.375** |
| Kael 3 stars (Base 1.4) uses Corte Dimensional, level 1 (today) | 1.4 x 15 = **21** |
| Lyra 6 stars (Base 2.3) clicks under Ventos Ligeiros cast at level 4 | 2.3 x 1.875 = **4.3125** |
| Lyra cast Ventos Ligeiros at 3 stars, then fused to 4 stars, clicks | 1.7 x 1.5 = **2.55** (new star bonus, Ventos stays level 1) |
| Base 1, Brado Aterrador level 3, monster physical defense 50, 100 % physical hit | 1 x (1 - 5 / 100) = **0.95** |

---

## Assumptions & Open Questions

Rows D1 to D12 are the product owner's defaults for decisions the owner has not made yet. They are **pending owner approval**: the feature is designed and tasked on them, and each one can change without touching the others unless the row says so.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **D1** Highest star level | 6 stars (three new levels: 4, 5, 6) | Three new levels mirror the three skills and keep the fusion cost below 1 000 cards; 7 stars would need 2 187 blank cards | n (pending owner) |
| **D2** Cost of a star above 3 | The fusion rule continues: 3 copies of 3, 4 or 5 stars become 1 copy of the next stars. Cards only, no coins. One hero at 4, 5, 6 stars costs 81, 243, 729 blank cards in total | One rule the player already knows, no wallet lock, no new error. Copper already has sinks (refine, reroll, `hero-team` slots). Alternative: add 1, 3 and 9 ouro to the three fusions | n (pending owner) |
| **D3** Which skills level up | All three together: level = stars - 2 from 4 stars (Skill Levels) | Simple to explain ("cada estrela acima de 3 sobe um nível de todas as habilidades") and to test. Alternative: one skill per star in slot order (4 stars skill 1, 5 stars skill 2, 6 stars skill 3), which gives only one extra level per skill | n (pending owner) |
| **D4** What a skill level changes | +25 % per level on the damage percents and the effect strength of the Skill Levels table. Cooldowns, durations, cast time, Stun and Root time, tick count, stacks, armor pierce and the DARKNESS bonus stay | One factor for 15 skills, so the screen can say `+25% de poder` truthfully. Keeps every timing test and cooldown text. Alternative: also -5 % cooldown per level | n (pending owner) |
| **D5** Hero power | Star Bonus rows 4 to 6: +30 % click damage, +5 critical chance and +25 % critical damage per star over the 3-star row | Same three stats as today, linear steps, critical chance stays far from the 100 cap | n (pending owner) |
| **D6** Ally star multiplier (`hero-team`) | 10, 12, 14 for 4, 5, 6 stars (the 2 per star step of 0 to 3 stars continues) | `hero-team` defines 2, 4, 6, 8 for 0 to 3 stars and is not built; written into its spec so it ships with that feature | n (pending owner) |
| **D7** How stars 4 to 6 look | The same `<n>★` text, coloured purple `#7a3fa0` (class `is-ascended`) wherever `.hero-stars` shows it. Skill rows show `Nível <L>`, the skill bar shows a `Nv. <L>` badge from level 2. No new art | No asset to produce; purple reads as "beyond the maximum" and keeps 5.8:1 contrast on the cream panel | n (pending owner) |
| **D8** Name of the action | Still `Fundir` on the Fusão screen. No "Ascensão" word in the UI; the feature name `hero-ascension` is internal | No new concept for the player | n (pending owner) |
| **D9** Balance against chapters and drop rates | No drop rate changes. A 6-star leader deals about 2.9 times the skill damage of a 3-star one (Base 2.3 / 1.4 x level factor 1.75), about 1.5 chapters of the x2 health curve of `campaign-chapters` | The grind (729 cards) matches the gain. Not balance-tested | n (pending owner) |
| **D10** Shipping order | Independent of `campaign-chapters` and `hero-team`; no Flyway migration, so no version number clashes with their V8 to V10 | Nothing in this feature reads chapters or teams | n (pending owner) |
| **D11** Fusion result text | `Nova carta: <nome> <n>★` as today for 1 to 3 stars; `Nova carta: <nome> <n>★ · habilidades no nível <L>` for 4 to 6 stars | L-010: every new text is exact | n (pending owner) |
| **D12** Spare 6-star copies | Stay in the bag with no use; the bag detail says `Estrela máxima: não pode ser fundida` | `characters` keeps spare cards until selling exists | n (pending owner) |
| Source of the skill level in the game | The `level` field of each skill in `GET /heroes` and the fusion answer. A skill without `level` (a payload from the previous backend) is level 1 when unlocked, 0 when locked | The server owns the rule like `unlocked`; the game keeps working against the previous backend | n |
| Fusion request bounds | `stars` 0 to 5 is a fusion; 6 or more, a negative number, a missing value or a non-integer answer 400 `INVALID_FUSION` | Same error as today, new upper bound | n |
| Rollback safety | The backend first ships a version that reads copies of 0 to 6 stars with fusion still capped at 2, and opens the fusions of 3 to 5 stars in a later commit (Design, Deploy order) | The previous backend throws on a copy above 3 stars (Facts) | n |
| Language | Every new text is Portuguese: `Nível <L>`, `+<p>% de poder`, `Nv. <L>`, `Poder das estrelas: ...`, `habilidades no nível <L>` | AD-007 | n |
| Observability (convention, not an AC) | The existing INFO log `Fusing cards username=<u> hero=<h> stars=<s>` covers the new fusions; nothing new is logged | L-007, L-014 | n |
| Implicit dimensions | Input bounds: Fusion request bounds. Failure states: the existing 409 `NOT_ENOUGH_CARDS`, 400 `INVALID_FUSION` and the error line `Não foi possível fundir as cartas.`. Idempotency: a fusion is not idempotent; a repeated request needs 3 more copies or answers 409, as today. Auth: the existing 401 and own-bag rule. Concurrency: the existing `player_cards` row lock (race test in ASC-02). Data lifecycle: copies cascade with the user and survive the account reset (AD-015). Observability: convention above. External dependency: N/A because only the database is involved. State transitions: a hero's stars only rise through fusion, 0 to 6, never down | Large-scope sweep | n |

**Open questions:** none blocking. D1 to D12 carry defaults the owner has not approved yet; they are listed for approval in the hand-off.

---

## User Stories

### P1: Fuse past 3 stars on the backend ⭐ MVP

**User Story**: As a player with a 3-star hero, I want three of its 3-star cards to fuse into a 4-star card, and so on up to 6 stars, so that the copies I keep collecting still make my hero stronger.

**Why P1**: Every other story reads the stars this one stores.

**Acceptance Criteria**:

1. The backend SHALL store card copies of 0 to 6 stars and report a hero's stars as the highest stars among its copies, from 0 to 6.  <!-- ubiquitous -->
2. WHEN an authenticated player calls `GET /heroes` THEN each hero SHALL carry `copies` with the keys `"0"` to `"6"`, each the number of copies held at that stars (0 when none).  <!-- event-driven -->
3. WHEN `GET /heroes` or a fusion answers a hero THEN each of its skills SHALL carry `level` (integer): 0 when locked, 1 when unlocked and the hero has 1 to 3 stars, and stars - 2 when the hero has 4 to 6 stars.  <!-- event-driven -->
4. WHEN an authenticated player calls `POST /heroes/{id}/fuse` with `stars` 3, 4 or 5 and holds 3 or more copies of that hero at that stars THEN the backend SHALL remove 3 copies of that stars, add 1 copy of stars + 1 and answer 200 with the updated hero.  <!-- event-driven -->
5. WHEN a fusion of three 5-star copies succeeds THEN the answer SHALL carry `stars` 6, `copies."6"` 1 and every skill with `unlocked` true and `level` 4.  <!-- event-driven -->
6. WHEN a player holding 4 copies of 3 stars fuses `stars` 3 once THEN the backend SHALL leave 1 copy of 3 stars and 1 copy of 4 stars.  <!-- event-driven -->
7. IF `stars` is 6 or more, negative, missing or not an integer THEN `POST /heroes/{id}/fuse` SHALL answer 400 `INVALID_FUSION` and change nothing.  <!-- unwanted-behavior -->
8. IF the player holds fewer than 3 copies at the requested stars from 3 to 5 THEN `POST /heroes/{id}/fuse` SHALL answer 409 `NOT_ENOUGH_CARDS` and change nothing.  <!-- unwanted-behavior -->
9. WHEN two fusions of the same three 3-star copies arrive together THEN the backend SHALL answer exactly one 200 and one 409 `NOT_ENOUGH_CARDS`, leaving 1 copy of 4 stars.  <!-- event-driven -->
10. WHEN a fusion of 3 to 5 stars succeeds THEN the backend SHALL leave the player's wallet, the leader and every other copy unchanged.  <!-- event-driven -->
11. WHEN an account reset is applied to a player holding a 6-star copy THEN `GET /heroes` SHALL still answer that hero with `stars` 6 and skill `level` 4.  <!-- event-driven -->

**Independent Test**: A backend integration test gives a player 3 copies of Kael at 3 stars, fuses `stars` 3 and reads `stars` 4, `copies."4"` 1 and skill levels `[2, 2, 2]`; fusing `stars` 6 answers 400.

---

### P1: Skill levels in combat ⭐ MVP

**User Story**: As a player, I want my 4 to 6 star leader's skills to hit harder and their effects to be stronger so that every star above 3 is felt in the fight.

**Why P1**: It is half of the owner's request ("aumentando os níveis da skill").

**Acceptance Criteria**:

1. WHEN the leader uses a skill whose `level` is L THEN the game SHALL multiply every scaled value of that skill in the Skill Levels table by `1 + 0.25 x (L - 1)`.  <!-- event-driven -->
2. WHEN Kael with 4 stars, no pieces and no talents uses Corte Dimensional at level 2 on a neutral monster with every defense 0 and no critical THEN the game SHALL deal 31.875 and show `31.9`.  <!-- event-driven -->
3. WHEN Kael with 6 stars, no pieces and no talents uses Corte Dimensional at level 4 on the same monster THEN the game SHALL deal 60.375.  <!-- event-driven -->
4. WHEN a skill hit, the aimed shot of Tiro Preciso or a tick of Tempestade Arcana, Bomba de Veneno or Golpe Sangrento lands at level L THEN its percent of Base SHALL be the Level L column of the Skill Levels table.  <!-- event-driven -->
5. WHILE Ventos Ligeiros, Bênção da Grande Árvore or Bomba de Fumaça cast at level L runs, the game SHALL apply the Level L click damage, physical damage bonus or critical points of the Skill Levels table.  <!-- state-driven -->
6. WHILE Brado Aterrador or Prisão de Espinhos cast at level L runs on a monster, the game SHALL remove the Level L physical defense points (never below 0) or multiply magical damage by the Level L multiplier.  <!-- state-driven -->
7. WHEN Carrilhão da Aurora is used at level L on a boss THEN the game SHALL add 4, 5, 6 or 7 s (levels 1 to 4) to the countdown.  <!-- event-driven -->
8. The game SHALL keep the cooldown, the effect duration, the cast time, the Stun and Root time, the tick count, the Poison maximum of 3 stacks, Corte Dimensional's +30 armor pierce and Luz Divina's x1.5 against DARKNESS the same at every level.  <!-- ubiquitous -->
9. WHEN the leader fuses to more stars while one of its buffs, debuffs or damage over time runs THEN the game SHALL keep that effect at the level it was cast with until it ends.  <!-- event-driven -->
10. WHEN Lyra with 3 stars casts Ventos Ligeiros and then fuses to 4 stars THEN her next click on a neutral, defenseless monster without a critical SHALL deal 2.55.  <!-- event-driven -->
11. IF an unlocked skill in the heroes payload carries no `level` THEN the game SHALL use it at level 1.  <!-- unwanted-behavior -->
12. WHILE the leader has 0 to 3 stars the game SHALL deal exactly the skill damage and effects of `hero-skills`.  <!-- state-driven -->

**Independent Test**: In the browser against the fake backend, a 4-star Kael leader presses `Q` on a phase monster of 1 000 health with no defense and reads 968.125 health.

---

### P1: Star power of the leader ⭐ MVP

**User Story**: As a player, I want my leader's clicks to grow with every star above 3 so that the hero itself gets stronger, not only its skills.

**Why P1**: The other half of the owner's request ("e o poder do herói").

**Acceptance Criteria**:

1. WHILE the leader has 4, 5 or 6 stars the game SHALL add that row of the Star Bonus table to the leader's click attacker.  <!-- state-driven -->
2. WHEN a leader with 4, 5 or 6 stars, no pieces and no talents clicks a neutral, defenseless monster without a critical THEN the game SHALL deal 1.7, 2.0 or 2.3.  <!-- event-driven -->
3. WHEN a 4-star leader with no pieces and no talents clicks a neutral, defenseless monster with critical resistance 0 and `random()` 0.44 THEN the game SHALL deal a critical hit of 4.675 (shown `4.7`), and with `random()` 0.45 a normal hit of 1.7.  <!-- event-driven -->
4. WHEN the Equipamento screen shows a 4-star leader with no pieces and no talents THEN the attribute panel SHALL read `Dano de clique: 1.7`, `Chance de crítico: 45%` and `Dano crítico: x2.75`.  <!-- event-driven -->
5. WHEN the leader fuses to more stars THEN the game SHALL use the new row of the Star Bonus table on the next click and the next skill, without reloading the scene.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, a 6-star Kael clicks a 1 000-health neutral monster once and reads 997.7 health.

---

### P1: Fusão and Mochila past 3 stars ⭐ MVP

**User Story**: As a player, I want the Fusão and Mochila screens to offer the fusions of 3 to 5 stars so that I can upgrade my hero without leaving the screens I know.

**Why P1**: Without it the backend fusion is unreachable for the player.

**Acceptance Criteria**:

1. WHEN the player opens Fusão THEN the game SHALL list one row for every (hero, stars 0 to 5) with 3 or more copies, labelled `<nome> <n>★ → <n+1>★`, with `<copies>/3` and a `Fundir` button.  <!-- event-driven -->
2. WHEN a `Fundir` of 3, 4 or 5 stars succeeds THEN the game SHALL show `Nova carta: <nome> <n+1>★ · habilidades no nível <L>`, where L is the `level` of the answered hero's skills (2, 3 or 4).  <!-- event-driven -->
3. WHEN a `Fundir` of 0, 1 or 2 stars succeeds THEN the game SHALL show `Nova carta: <nome> <n+1>★` as today.  <!-- event-driven -->
4. WHEN the player opens Mochila THEN the game SHALL list the entries of 4, 5 and 6 stars like the others, as `<nome> <n>★` and `x<copies>`.  <!-- event-driven -->
5. WHEN the player opens a bag entry of 3, 4 or 5 stars THEN the game SHALL show `Para fundir: <copies>/3`, and the `Ir para a fusão` button when copies are 3 or more.  <!-- event-driven -->
6. WHEN the player opens a bag entry of 6 stars THEN the game SHALL show `Estrela máxima: não pode ser fundida` and no `Ir para a fusão` button.  <!-- event-driven -->
7. IF a fusion of 3 to 5 stars fails THEN the game SHALL show `Não foi possível fundir as cartas.`, keep the Fusão screen open and leave the bag unchanged.  <!-- unwanted-behavior -->
8. WHEN a fusion changes the leader's stars THEN the game SHALL redraw the skill bar with the new levels without reloading the scene and SHALL keep the cooldown each slot had.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, Kael holds 3 copies of 3 stars: Fusão shows `Kael Raizférrea 3★ → 4★` with `3/3`; `Fundir` shows `Nova carta: Kael Raizférrea 4★ · habilidades no nível 2`.

---

### P2: Stars, levels and star power on screen

**User Story**: As a player, I want to see that a hero is above 3 stars, what level its skills are and what its stars give so that I know what each upgrade bought.

**Why P2**: The upgrade works without it; it makes the gain visible.

**Acceptance Criteria**:

1. WHILE a hero has 4 to 6 stars the game SHALL give every `.hero-stars` element showing it (catalog card, hero detail, bag entry detail) the class `is-ascended`, drawn in color `#7a3fa0` at font weight 800; with 0 to 3 stars it SHALL NOT have that class.  <!-- state-driven -->
2. WHEN a skill row is shown (hero detail, bag entry detail, skill tooltip) for an unlocked skill of level 1 THEN it SHALL hold a `.skill-level` element with the text `Nível 1`.  <!-- event-driven -->
3. WHEN a skill row is shown for a skill of level L from 2 to 4 THEN its `.skill-level` text SHALL be `Nível <L> · +<25 x (L - 1)>% de poder` (`Nível 2 · +25% de poder`, `Nível 3 · +50% de poder`, `Nível 4 · +75% de poder`).  <!-- event-driven -->
4. WHEN a skill row is shown for a locked skill THEN it SHALL hold no `.skill-level` element.  <!-- event-driven -->
5. WHILE a leader's skill has level 2 to 4 its skill bar slot SHALL show a badge `Nv. <L>` (`data-testid="skill-level-<slot>"`) on the top right corner of the art, and a slot of level 1 or a locked slot SHALL show none.  <!-- state-driven -->
6. WHEN the player opens the detail of an owned hero with 1 to 6 stars THEN it SHALL show `Poder das estrelas: ` followed by the non-zero parts of its Star Bonus row, in the order `+<c>% de dano de clique`, `+<x> de chance de crítico`, `+<d>% de dano crítico`, joined by `, ` (`data-testid="hero-star-power"`).  <!-- event-driven -->
7. WHEN the detail of a 0-star or not owned hero opens THEN it SHALL show no `hero-star-power` element.  <!-- event-driven -->
8. WHEN the detail of a 4-star hero opens THEN `hero-star-power` SHALL read `Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico`, and for a 1-star hero `Poder das estrelas: +10% de dano de clique`.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, a 5-star Kael shows `5★` in purple on its catalog card, `Nível 3 · +50% de poder` on each skill row of its detail, `Nv. 3` on the three skill bar slots and `Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico`.

---

## Edge Cases

- WHEN a hero holds 1 copy of 6 stars and 3 copies of 0 stars THEN the 0-star row SHALL still fuse and the hero SHALL stay at 6 stars.
- WHEN a 6-star hero receives a dropped 0-star card THEN its stars and skill levels SHALL stay 6 and 4.
- WHEN the leader fuses to 4 stars while one of its skills cools THEN the slot SHALL keep counting down from the seconds it had.
- WHEN a skill of a 4-star hero is shown in the tooltip of an effect tag THEN the tooltip row SHALL carry the same `.skill-level` text as the hero detail.
- IF the game receives a skill with `level` but `unlocked` false THEN it SHALL treat the skill as locked (level 0) and ignore its slot.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ASC-01 | P1: Fuse past 3 stars on the backend - AC 1, 2, 3 (read: copies 0 to 6, skill level) | Tasks | Pending |
| ASC-02 | P1: Fuse past 3 stars on the backend - AC 4 to 11 (fusion 3 to 5, bounds, race, reset) | Tasks | Pending |
| ASC-03 | P1: Skill levels in combat - AC 1 to 4, 8, 12 (level factor on hits and ticks, unchanged values) | Tasks | Pending |
| ASC-04 | P1: Skill levels in combat - AC 5 to 7, 9 (effects scaled and kept at cast level) | Tasks | Pending |
| ASC-05 | P1: Skill levels in combat - AC 10, 11 (scene reads the payload level, fallback 1) | Tasks | Pending |
| ASC-06 | P1: Star power of the leader - AC 1 to 5 | Tasks | Pending |
| ASC-07 | P1: Fusão and Mochila past 3 stars - AC 1 to 8 | Tasks | Pending |
| ASC-08 | P2: Stars, levels and star power on screen - AC 1 to 8 | Tasks | Pending |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Unit tests pin every number of the Star Bonus rows 4 to 6 and of the Skill Levels table (each scaled value at least once at level 2, 3 or 4) and every value that must not scale.
- [ ] A backend integration test fuses 3 to 4 and 5 to 6 stars over HTTP, races two 3-star fusions, and gets 400 for `stars` 6.
- [ ] An e2e test fuses a hero to 4 stars on the Fusão screen and reads the new star text, the level badge and the larger skill damage.
- [ ] Every existing backend, unit and e2e test of heroes, skills and click power passes; the only edited ones are those that pinned the 3-star cap, renamed after the new behaviour.
