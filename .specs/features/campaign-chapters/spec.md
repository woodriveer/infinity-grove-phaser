# Campaign Chapters 6 to 15 Specification

## Problem Statement

The campaign ends at chapter 5 (AD-008: "only chapter 5 completes"). After that a player can only farm and reset. The owner wants the chapters after 5 to grow in difficulty with a balanced, interesting progression. `hero-team` needs the chapter 6 to 8 bosses to open ally slots 2 to 4, and `miniboss-adds` needs chapters past 10. This feature does five things:

- extends the campaign to chapter 15, with health x2 per chapter from chapter 6 and chapters 1 to 5 unchanged;
- moves every health value to 64-bit integers, so overflow is never a limit again;
- makes the reset pay the chapter reached, with no cap at 5;
- abbreviates big on-screen numbers with K, M and B;
- keeps defenses at +3 per chapter, capped at 80;
- raises the coin drops so a normal first run can afford the ally slots of `hero-team` (1, 2, 3 and 4 ouro).

It is one of the three features of the split in `.specs/features/hero-team/spec.md` (Feature Split) and runs first (Q26). The change of AD-008 and AD-015 is proposed as AD-019 in `.specs/STATE.md`.

## Facts From the Code (not decisions)

- `ChapterOrder.MAX_CHAPTER = 5` drives the last chapter (`Progress.kt:70`), the seeder (`ChapterSeeder.kt:24`), the card drop of the last boss (`CardDrops.kt:54`) and the reset reward cap (`AccountReset.MAX_REWARD = ChapterOrder.MAX_CHAPTER`). The game mirrors the cap as `RESET_MAX_REWARD = 5` (`game/src/domain/campaign/accountReset.js:3`).
- Chapter health grows x4 per chapter today: `healthFactor(c) = 4^(c-1)` (`Chapter.kt:113`, `V4__monster_health_growth.sql`). Defenses grow +5 points per chapter. Time limits are 30 000 ms (miniboss) and 60 000 ms (boss) everywhere.
- `chapters.boss_health`, `stages.monster_health` and `stages.miniboss_health` are `integer` columns (max 2 147 483 647) mapped to Kotlin `Int` (`V1__schema.sql`). Hibernate runs with `ddl-auto: validate` (AD-010), so a backend whose entity says `Int` refuses to start on a `bigint` column. A plain `ALTER COLUMN ... TYPE bigint` therefore breaks a rollback to the previous slot, and AD-016 needs expand/contract.
- `ChapterSeeder` only creates missing chapters, so chapters 6 to 15 are created at the next startup and chapters 1 to 5 keep any value tuned in the database.
- `Progress.withNextChapterOpen()` moves a progress stored as completed to the next chapter when one exists (`ProgressService.kt:104`, `AccountResetService.kt:70`).
- The game holds numbers as JavaScript doubles, exact up to 9 007 199 254 740 991 (2^53 - 1). At x2 per chapter, health passes that value only around chapter 38.
- The HP text today is `HP <health rounded up to 0.1>/<max>` (`monster.js:8`). Damage numbers show at most one decimal (`elements`).

## Goals

- [ ] Beating the chapter 5 boss opens chapter 6, and the campaign completes after the chapter 15 boss.
- [ ] Chapters 6 to 15 follow the Chapter Table, and chapters 1 to 5 keep their numbers.
- [ ] Every health value is a 64-bit integer from the database to the game, migrated with expand/contract (AD-016).
- [ ] The reset pays as many crystals as the chapter left (completed: 15).
- [ ] Damage numbers and the HP text abbreviate from 1 000 (`5K`, `16.4M`, `6B`).
- [ ] A normal first run has earned about 1 ouro when the chapter 5 boss falls and about 10 ouro when the chapter 8 boss falls (Coin Drops).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Changing chapters 1 to 5 | The owner asked for the next chapters to grow |
| Add monsters on minibosses | Feature `miniboss-adds` |
| Team resistance values of enemies | Feature `hero-team` (Team Resistance table) |
| New enemy art, story or regions per chapter | Content; the enemy shape stays the chapter 1 shape (AD-008) |
| Endless generated chapters | Owner decision (Q14): a fixed 15 |
| New heroes per chapter | Content feature; chapters 6+ drop the existing five (Q16) |
| A use for crystals beyond the auto click | Owner: "they will be used later" |
| Changing time limits, talent point awards, the equipment tables or the refine and reroll costs | Q19 |
| Changing the kill allowance of the wallet sync | AD-002 stays as is |
| Abbreviating coin amounts | Coins keep `ouro/prata/cobre` (`formatCopper`) |
| Health beyond 9 007 199 254 740 991 | Default of Q44: far past chapter 15 |
| Translating `Chapter complete!` | TD-001 |

---

## Chapter Table

Owner decision (Q15). For chapter c >= 6:

- health factor `256 x 2^(c-5)`, so health doubles every chapter;
- defense bonus `20 + 3 x (c-5)`;
- chapter boss physical and magical defense `min(30 + bonus, 80)`, critical resistance `min(30 + bonus, 70)`;
- miniboss of stage n: defenses `min(10 + n + bonus, 80)`, critical resistance `min(10 + 2n + bonus, 70)`;
- phase monster health `(40 + 4(n-1)) x factor`, miniboss health 5 x phase monster health, boss health `2000 x factor`;
- phase monsters keep defenses 0 and critical resistance 0;
- time limits stay 30 000 ms (miniboss) and 60 000 ms (boss).

Chapter 5 is shown for reference and does not change.

| Chapter | Factor | Boss health | Phase health stage 1 | Phase health stage 10 | Miniboss health stage 10 | Bonus | Boss defenses | Boss crit res | Miniboss defenses stage 10 | Miniboss crit res stage 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 (today) | 256 | 512 000 | 10 240 | 19 456 | 97 280 | 20 | 50 | 50 | 40 | 50 |
| 6 | 512 | 1 024 000 | 20 480 | 38 912 | 194 560 | 23 | 53 | 53 | 43 | 53 |
| 7 | 1 024 | 2 048 000 | 40 960 | 77 824 | 389 120 | 26 | 56 | 56 | 46 | 56 |
| 8 | 2 048 | 4 096 000 | 81 920 | 155 648 | 778 240 | 29 | 59 | 59 | 49 | 59 |
| 9 | 4 096 | 8 192 000 | 163 840 | 311 296 | 1 556 480 | 32 | 62 | 62 | 52 | 62 |
| 10 | 8 192 | 16 384 000 | 327 680 | 622 592 | 3 112 960 | 35 | 65 | 65 | 55 | 65 |
| 11 | 16 384 | 32 768 000 | 655 360 | 1 245 184 | 6 225 920 | 38 | 68 | 68 | 58 | 68 |
| 12 | 32 768 | 65 536 000 | 1 310 720 | 2 490 368 | 12 451 840 | 41 | 71 | 70 | 61 | 70 |
| 13 | 65 536 | 131 072 000 | 2 621 440 | 4 980 736 | 24 903 680 | 44 | 74 | 70 | 64 | 70 |
| 14 | 131 072 | 262 144 000 | 5 242 880 | 9 961 472 | 49 807 360 | 47 | 77 | 70 | 67 | 70 |
| 15 | 262 144 | 524 288 000 | 10 485 760 | 19 922 944 | 99 614 720 | 50 | 80 | 70 | 70 | 70 |

The curve was not balance-tested. Capping critical resistance at 70 keeps critical hits possible on every boss.

## Coin Drops

Owner decision Q45 (2026-10-31): keep the slot prices of `hero-team` and raise the drops so a normal first run can afford them. The owner delegated the numbers. Targets: about 1 ouro (10 000 cobre) earned when slot 1 opens (chapter 5 boss), about 10 ouro (100 000 cobre) earned when slot 4 opens (chapter 8 boss), and no shortcut through the refine costs.

- **Coin factor** `m(c)`: `2^(c-1)` for chapters 1 to 8 (1, 2, 4, 8, 16, 32, 64, 128), then `128 + 32 x (c - 8)` for chapters 9 to 15 (160, 192, 224, 256, 288, 320, 352). It doubles while the slots open, then grows by a quarter of chapter 8 per chapter so late chapters do not flood the refine sink.
- **Ranges per kill** (copper, uniform, rule ids `3c-2`, `3c-1`, `3c` as today): phase monster `2m` to `6m` (average 4m), miniboss `8m` to `20m` (average 14m), chapter boss `30m` to `70m` (average 50m). Kill interval 1 500 ms, unchanged.
- **Before**: phase monster `c` to `5c` (average 3c), miniboss `5c` to `15c` (average 10c), chapter boss `20c` to `50c` (average 35c).
- **Expected copper of a first run of chapter c**: 50 phase monsters, 10 minibosses and 1 chapter boss, no failed boss, every kill inside the kill allowance. Before: `50 x 3c + 10 x 10c + 35c = 285c`. After: `50 x 4m + 10 x 14m + 50m = 390m`.

| Chapter | m(c) | Before, chapter | Before, total | After, chapter | After, total | After, total in ouro |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 285 | 285 | 390 | 390 | 0.04 |
| 2 | 2 | 570 | 855 | 780 | 1 170 | 0.12 |
| 3 | 4 | 855 | 1 710 | 1 560 | 2 730 | 0.27 |
| 4 | 8 | 1 140 | 2 850 | 3 120 | 5 850 | 0.59 |
| 5 | 16 | 1 425 | 4 275 | 6 240 | **12 090** | **1.21** (slot 1 opens) |
| 6 | 32 | 1 710 | 5 985 | 12 480 | 24 570 | 2.46 (slot 2 opens) |
| 7 | 64 | 1 995 | 7 980 | 24 960 | 49 530 | 4.95 (slot 3 opens) |
| 8 | 128 | 2 280 | 10 260 | 49 920 | **99 450** | **9.95** (slot 4 opens) |
| 9 | 160 | 2 565 | 12 825 | 62 400 | 161 850 | 16.19 |
| 10 | 192 | 2 850 | 15 675 | 74 880 | 236 730 | 23.67 |
| 11 | 224 | 3 135 | 18 810 | 87 360 | 324 090 | 32.41 |
| 12 | 256 | 3 420 | 22 230 | 99 840 | 423 930 | 42.39 |
| 13 | 288 | 3 705 | 25 935 | 112 320 | 536 250 | 53.63 |
| 14 | 320 | 3 990 | 29 925 | 124 800 | 661 050 | 66.11 |
| 15 | 352 | 4 275 | 34 200 | 137 280 | 798 330 | 79.83 |

The "before" rows for chapters 6 to 15 extend today's `x c` rule, for comparison only.

Economy check:

- The four slots cost 100 000 cobre, so a first run reaches the chapter 8 boss with about the price of all four. Coins spent on refines delay the last slot; a failed boss (phase 5 replayed) and every reset replay add coins.
- Refining one COMMON piece from +0 to +10 costs `sum floor(500 x 1.7^n)` for n = 0 to 9 = 143 280 cobre (computed in double precision, as the backend does). Times the rarity multiplier, that is 286 560 for UNCOMMON, 429 840 for RARE, 716 400 for EPIC and 1 146 240 for LEGENDARY. A whole first run of chapters 1 to 15 (798 330) pays for less than one LEGENDARY piece at +10, so refining stays a long-term sink.
- Talents cost talent points, not coins (AD-013), so they are untouched.
- Kills faster than one per 1 500 ms per rule lose their coins (AD-002), so a fast player earns less than the table. The table is an upper bound for a first run without replays.

## Number Format

Owner decision (Q18). Details are the default of Q42.

- First the existing rounding runs: damage to one decimal (`formatDamage`), current health up to 0.1 (`healthText`). A rounded value below 1 000 shows as today.
- A rounded value from 1 000: divide by the largest unit the value reaches, K = 1 000, M = 1 000 000, B = 1 000 000 000 or T = 1 000 000 000 000. Round to one decimal (half up), drop a trailing `.0`, and append the letter. If the rounding reaches 1000 of a unit, the next unit is used.
- Examples: 999 → `999`; 999.96 damage rounds to 1 000 → `1K`; 1 000 → `1K`; 1 500 → `1.5K`; 5 000 → `5K`; 50 000 → `50K`; 999 949 → `999.9K`; 999 950 → `1M`; 1 050 000 → `1.1M`; 16 384 000 → `16.4M`; 20 000 000 → `20M`; 2 500 000 000 → `2.5B`; 6 000 000 000 → `6B`; 1 000 000 000 000 → `1T`.
- Where: every damage number (click, skill, tick, ally), both numbers of the HP text, and the team damage texts of `hero-team` (`Dano: <n>/s`, `Dano da equipe: <n>/s`). The current health of the HP text is first rounded up to 0.1 as today, then formatted.

---

## Assumptions & Open Questions

Rows `Q14` to `Q19` carry the owner's answers of 2026-10-30; `Q26`, `Q42` and `Q44` are new questions with the recommended default.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q14** How many chapters | Chapters 6 to 15; the chapter 15 boss completes the campaign | Owner answer | y |
| **Q15** Difficulty curve | Chapter Table: health x2 per chapter from chapter 6, defenses +3 per chapter capped at 80, critical resistance capped at 70, time limits unchanged | Owner answer (health); the defense default was explained and kept | y |
| **Q15b** Health storage | Every health value is a 64-bit integer: the three database columns, Kotlin `Long` in every class and port that carries health, JSON integers in the progress payload, and plain numbers in the game. Migrated with expand/contract (AD-016) | Owner answer: overflow must never be a limit; the x2 curve stays the balance choice | y |
| **Q16** Elements and card drops | The player's 5-chapter element order repeats (chapter 6 = chapter 1, chapter 11 = chapter 1); a miniboss drops the hero of its chapter's element, a chapter boss below 15 the hero of chapter c + 1's element (first win certain), the chapter 15 boss the hero of chapter 15; enemy elements keep the rotating formula | Owner answer | y |
| **Q17** Reset reward | The reset pays as many crystals as the chapter left, with no cap at 5: chapter c pays c (2 to 15), a completed campaign pays 15 (the last chapter) | Owner answer: crystals keep growing with the chapter and will be used later | y |
| **Q18** Big numbers | Number Format: K, M, B (and T) from 1 000, on damage numbers and the HP text | Owner answer (K included) | y |
| **Q19** Rewards of chapters 6 to 15 | Talent points 2 per miniboss and 5 per chapter boss on first clears, the full equipment rarity table, the chapter boss farm limit of 10 a day; coin drops follow Coin Drops (Q45) | Owner answer 2026-10-31 (Q43); the coin part is superseded by Q45 | y |
| **Q26** Order | This feature runs first (see `hero-team` Feature Split) | Owner answer 2026-10-31 | y |
| **Q42** Number format details | One decimal, half up, no trailing `.0`; units K, M, B, T; a rounding that reaches 1000 moves up a unit; values below 1 000 unchanged; also used for the team damage texts; coins excluded | Owner answer 2026-10-31 | y |
| **Q45** Coin drops | Coin Drops section: factor `2^(c-1)` up to chapter 8, then `128 + 32(c-8)`; ranges `2m-6m`, `8m-20m`, `30m-70m`; a data migration moves rules of chapters 1 to 5 that still hold the old seeded range | Owner answer 2026-10-31: keep the slot prices, raise the drops; numbers delegated to the PO and checked against the targets and the refine costs | y |
| **Q44** Ceiling of the game's numbers | Accept 9 007 199 254 740 991 as the new ceiling (JavaScript doubles, no `BigInt` in the game) | Owner answer 2026-10-31 | y |
| Existing completed players | A player stored as completed at chapter 5 lands in chapter 6 stage 1 phase 1 on the next progress load (existing `withNextChapterOpen`) and from then on farms chapter 6 bosses only (AD-008) | Code fact | n |
| Expand/contract for health | Expand: add the 64-bit columns, copy the current values, and have the new backend read and write the new columns while it also writes the old `integer` columns whenever the value fits (chapters 1 to 15 always fit). Contract, in a later commit after a successful deploy: drop the old columns. Design names the columns and migrations | A backend with `Int` entities must keep starting during the 5-minute rollback window (AD-016, Facts) | n |
| Seeding | `ChapterSeeder` creates chapters 6 to 15 and their drop rules at startup with the Chapter Table and Coin Drops values; no migration rewrites the health or attributes of chapters 1 to 5; one data migration rewrites the drop rules of chapters 1 to 5 that still hold their old seeded range | Seeder only adds; the drop update keeps the old backend working (same columns, AD-016) | n |
| Game mirror | The game's reset label uses the chapter shown (no cap at 5), and the game types no other chapter number | AD-004 | n |
| Implicit dimensions | Input bounds: the existing defense and critical resistance range checks hold every Chapter Table value; health must be at least 1. Failure states: a health value that is not an integer fails the progress load. Idempotency, auth, concurrency: N/A because the outcome report path does not change. Data lifecycle: chapters are catalog data. Observability: the seeder logs each chapter it creates (convention). External dependency: N/A because only the database is involved | Complex-scope sweep | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: The campaign goes on after chapter 5 ⭐ MVP

**User Story**: As a player who beat chapter 5, I want new chapters so that my progress continues.

**Why P1**: It is the feature.

**Acceptance Criteria**:

1. WHEN the backend accepts a `CLEARED` chapter boss report for chapter c from 1 to 14 THEN it SHALL store chapter c + 1, stage 1, `PHASE`, phase 1, not completed.  <!-- event-driven -->
2. WHEN the backend accepts a `CLEARED` chapter boss report for chapter 15 THEN it SHALL store the progress as completed.  <!-- event-driven -->
3. WHEN the backend starts and any of chapters 6 to 15 is missing THEN it SHALL seed that chapter, its 10 stages and its 3 drop rules with the values of the Chapter Table.  <!-- event-driven -->
4. WHEN the backend starts THEN it SHALL leave every stored value of chapters 1 to 5 unchanged.  <!-- event-driven -->
5. WHEN a player whose progress is stored as completed at chapter 5 calls `GET /progress` THEN the backend SHALL answer chapter 6, stage 1, `PHASE`, phase 1, not completed, with the chapter 6 definition.  <!-- event-driven -->
6. WHEN the game receives a chapter 6 to 15 definition THEN it SHALL fight it with the health, defenses and time limits of that definition and show `Capítulo <c>` in the chapter HUD.  <!-- event-driven -->
7. WHEN the chapter 15 boss dies in time THEN the game SHALL show the completion message and spawn no monster, as after chapter 5 today.  <!-- event-driven -->

**Independent Test**: A backend integration test reports `CLEARED` for the chapter 5 boss and reads chapter 6 stage 1 with boss health 1 024 000; a player put at the chapter 15 boss reports `CLEARED` and reads completed.

---

### P1: Chapter numbers ⭐ MVP

**User Story**: As a player, I want each chapter after 5 to be harder by a steady step so that the progression stays interesting.

**Why P1**: The owner asked for growing difficulty with balance.

**Acceptance Criteria**:

1. The seeded chapter c from 6 to 15 SHALL have boss health `2000 x 256 x 2^(c-5)`, phase monster health `(40 + 4(n-1)) x 256 x 2^(c-5)` for stage n, and miniboss health 5 times the phase monster health of its stage.  <!-- ubiquitous -->
2. The seeded chapter c from 6 to 15 SHALL have boss defenses `min(30 + 20 + 3(c-5), 80)`, boss critical resistance `min(30 + 20 + 3(c-5), 70)`, miniboss defenses `min(10 + n + 20 + 3(c-5), 80)` and miniboss critical resistance `min(10 + 2n + 20 + 3(c-5), 70)` for stage n.  <!-- ubiquitous -->
3. The seeded chapters 6 to 15 SHALL have phase monster defenses 0, critical resistance 0, miniboss time limit 30 000 ms and boss time limit 60 000 ms.  <!-- ubiquitous -->
4. WHEN the backend seeds chapter 10 THEN its boss health SHALL be 16 384 000, its stage 10 miniboss health 3 112 960, its boss defenses 65 and its stage 10 miniboss defenses 55.  <!-- event-driven -->
5. WHEN the backend seeds chapter 15 THEN its boss health SHALL be 524 288 000, its boss defenses 80 and its boss critical resistance 70.  <!-- event-driven -->
6. The backend SHALL give chapter c from 6 to 15 the same player chapter element as chapter `((c-1) mod 5) + 1` of the AD-006 order (a FIRE player: chapter 6 FIRE, 7 NATURE, 8 WATER, 9 DARKNESS, 10 LIGHT, 11 FIRE).  <!-- ubiquitous -->
7. WHEN the backend accepts a `CLEARED` chapter boss report of chapter c from 6 to 14 THEN it SHALL drop the hero of chapter c + 1's element by the rules of `characters` (first win certain, later wins at the configured rate).  <!-- event-driven -->
8. WHEN the backend accepts a `CLEARED` chapter 15 boss report THEN it SHALL drop the hero of chapter 15's element by the same rules.  <!-- event-driven -->

**Independent Test**: A unit test of the chapter definition reads every row of the Chapter Table; a FIRE player's first chapter 6 boss win drops a blank NATURE (Lyra) card, chapter 7's element.

---

### P1: Health without a 32-bit limit ⭐ MVP

**User Story**: As the game owner, I want health stored as 64-bit integers everywhere so that later chapters never hit an overflow.

**Why P1**: Owner decision; every later chapter seed depends on it.

**Acceptance Criteria**:

1. The backend SHALL store the chapter boss health, the phase monster health and the miniboss health as 64-bit integers.  <!-- ubiquitous -->
2. WHEN a chapter boss health of 3 000 000 000 is stored THEN `GET /progress` SHALL answer `bossHealth` 3000000000 as a JSON integer.  <!-- event-driven -->
3. WHEN the game receives a health of 3 000 000 000 THEN it SHALL spawn the monster with exactly that health and show `HP 3B/3B`.  <!-- event-driven -->
4. WHEN the expand migration runs THEN every existing health value SHALL be copied unchanged to the 64-bit storage.  <!-- event-driven -->
5. WHILE the expand migration has run and the previous backend version still serves requests or starts again for a rollback, the previous backend SHALL start, answer progress and accept outcome reports (AD-016).  <!-- state-driven -->
6. IF a health value is below 1 THEN the backend SHALL refuse to save that definition.  <!-- unwanted-behavior -->

**Independent Test**: A backend integration test stores a chapter boss of 3 000 000 000 and reads it back from `GET /progress`; a migration test starts the previous backend's schema check against the migrated database.

---

### P1: Coin drops pay for the ally slots ⭐ MVP

**User Story**: As a player on a first run, I want enough coins by the chapter 5 to 8 bosses so that I can buy the ally slots as they open.

**Why P1**: Owner decision; without it the slots of `hero-team` cost several runs.

**Acceptance Criteria**:

1. The seeded drop rules of chapter c from 1 to 15 SHALL be: rule `3c-2` (phase monster) from `2m` to `6m`, rule `3c-1` (miniboss) from `8m` to `20m`, rule `3c` (chapter boss) from `30m` to `70m` copper, with `m` the coin factor of Coin Drops and a kill interval of 1 500 ms.  <!-- ubiquitous -->
2. WHEN the backend seeds chapter 1 THEN rules 1, 2 and 3 SHALL hold 2-6, 8-20 and 30-70 copper.  <!-- event-driven -->
3. WHEN the backend seeds chapter 8 THEN rules 22, 23 and 24 SHALL hold 256-768, 1024-2560 and 3840-8960 copper.  <!-- event-driven -->
4. WHEN the backend seeds chapter 15 THEN rules 43, 44 and 45 SHALL hold 704-2112, 2816-7040 and 10560-24640 copper.  <!-- event-driven -->
5. WHEN the drop migration runs on a database whose rule `3c-2`, `3c-1` or `3c` of chapter c from 1 to 5 still holds its old seeded range (`c` to `5c`, `5c` to `15c`, `20c` to `50c`) THEN that rule SHALL hold its new range (chapter 5: 32-96, 128-320, 480-1120).  <!-- event-driven -->
6. IF a rule of chapters 1 to 5 holds any other range THEN the drop migration SHALL leave it unchanged.  <!-- unwanted-behavior -->
7. WHILE the drop migration has run and the previous backend version still serves requests, the previous backend SHALL keep crediting kills from the same tables (AD-016).  <!-- state-driven -->

**Independent Test**: A unit test reads `ChapterDefinition.dropRules(c)` for chapters 1, 5, 8 and 15; a migration test puts rule 5 at its old 10-30 and reads 16-40 after the migration, and a rule tuned to 77-99 stays 77-99.

---

### P2: Reset reward grows with the chapter

**User Story**: As a player who pushed past chapter 5, I want the reset to pay for the chapter I reached so that going further is worth it.

**Why P2**: The reset works without it, with the cap of 5.

**Acceptance Criteria**:

1. WHEN a player in chapter c from 2 to 15, not completed, resets with `fromChapter` c THEN the backend SHALL pay c crystals.  <!-- event-driven -->
2. WHEN a player whose campaign is completed resets with `fromChapter` 15 THEN the backend SHALL pay 15 crystals.  <!-- event-driven -->
3. WHILE the campaign is in chapter c from 2 to 15 the game SHALL label the reset button `Resetar conta (+<c> cristais)` and say `Você ganha <c> cristais.` in its dialog, and WHILE it is completed it SHALL show 15.  <!-- state-driven -->

**Independent Test**: A backend integration test resets a player at chapter 10 and reads `reward` 10; the game at chapter 12 shows `Resetar conta (+12 cristais)`.

---

### P2: Short format for big numbers

**User Story**: As a player, I want big health and damage numbers abbreviated so that I can read the fight.

**Why P2**: Fights work without it; the HP box overflows in late chapters.

**Acceptance Criteria**:

1. WHEN the game shows a damage number, an HP text value or a team damage value of 1 000 or more THEN it SHALL format it by the Number Format rule.  <!-- event-driven -->
2. WHEN the value is below 1 000 THEN the game SHALL show it exactly as today.  <!-- event-driven -->
3. WHEN the values 999, 1 000, 1 500, 50 000, 999 949, 999 950, 1 050 000, 16 384 000, 2 500 000 000 and 1 000 000 000 000 are formatted THEN the game SHALL show `999`, `1K`, `1.5K`, `50K`, `999.9K`, `1M`, `1.1M`, `16.4M`, `2.5B` and `1T`.  <!-- event-driven -->
4. WHEN the chapter 1 boss appears THEN the HP text SHALL read `HP 2K/2K`, and WHEN the chapter 10 boss appears THEN `HP 16.4M/16.4M`.  <!-- event-driven -->
5. WHEN a click deals 5 000 damage THEN its damage number SHALL read `5K`.  <!-- event-driven -->

**Independent Test**: Unit tests of the formatter pin the ten values of AC 3; an e2e test reads `HP 2K/2K` on the chapter 1 boss.

---

## Edge Cases

- WHEN a player at chapter 5 resets THEN the reward SHALL stay 5.
- WHEN a player completed at chapter 5 opens the farm after the release THEN the farm SHALL list the chapter 6 bosses they have beaten (none until they beat one), per AD-008.
- IF a chapter 6 to 15 row was created by hand before the release THEN the seeder SHALL leave it unchanged.
- WHEN 1 049 999 is formatted THEN the game SHALL show `1M` (1.049999 rounds to 1.0, trailing `.0` dropped).
- WHEN a monster of 2 000 health has 1 999.95 left THEN the HP text SHALL read `HP 2K/2K`.
- WHEN a monster with 2 000 maximum health has 999.95 health left THEN the HP text SHALL read `HP 1K/2K`: the health is first rounded up to 0.1 as today (1 000), then formatted.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CHAP-01 | P1: Campaign goes on - AC 1, 2, 5 (transitions and completed players) | T10, T11, T12 | In Tasks |
| CHAP-02 | P1: Campaign goes on - AC 3, 4 (seeding) | T10 | In Tasks |
| CHAP-03 | P1: Campaign goes on - AC 6, 7 (game) | T11, T12 | In Tasks |
| CHAP-04 | P1: Chapter numbers - AC 1 to 5 | T7 | In Tasks |
| CHAP-05 | P1: Chapter numbers - AC 6 to 8 (elements and drops) | T10 | In Tasks |
| CHAP-06 | P2: Reset reward - AC 1 to 3 | T6, T10, T11, T12 | In Tasks |
| CHAP-07 | P2: Big numbers - AC 1 to 5 | T3, T4, T5, T12 | In Tasks |
| CHAP-08 | P1: Health without a 32-bit limit - AC 1 to 6 | T1, T2, T5, T13, T14 | In Tasks |
| CHAP-09 | P1: Coin drops - AC 1 to 7 | T8, T9 | In Tasks |

**Coverage:** 9 total, 9 mapped to tasks (`tasks.md`), 0 unmapped

---

## Success Criteria

- [ ] Every number of the Chapter Table has a unit test.
- [ ] A player completed at chapter 5 resumes at chapter 6 with no manual database change.
- [ ] Chapters 1 to 5 answer the same definitions as before the release.
- [ ] A 3 000 000 000 health boss round-trips from the database to the HP text.
- [ ] The seeded drop rules of chapters 1, 5, 8 and 15 match Coin Drops in a unit test.
