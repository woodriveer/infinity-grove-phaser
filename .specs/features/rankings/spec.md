# Rankings Specification

## Problem Statement

The game has no way for players to compare themselves. The owner wants four rankings inside the game (owner request of 2026-11-28): the shortest time to defeat the chapter bosses, the shortest time to finish the whole story, the highest Click Damage summed with the Team, and the most money. Each ranking has a catchy name with a one-line explanation under it, and a row shows only the player's nick and the value that puts them in that position.

Combat runs in the browser (AD-002, AD-004), so a ranking the client could fill with any number would be worthless. Every value of this feature is therefore measured or computed **by the backend** from events and state it already owns; the client never sends a ranking value.

## Facts From the Code (not decisions)

Checked on `main` at `e2336cd5` (2026-11-28).

- **Nick.** A player has only `users.username` (`V1__schema.sql:5`, `varchar(255)`, unique, chosen at registration, trimmed and non-blank, `User.register`, `domain/User.kt:50`). There is no display name. No login attempt is throttled (`SecurityConfig.kt:48`, `UserService.login`).
- **Campaign.** 15 chapters (`ChapterOrder.MAX_CHAPTER`), each seeded with 10 stages of 8 phases, a miniboss per stage and a chapter boss (`ChapterDefinition.of`, `domain/Chapter.kt:335`): 91 encounters a chapter, 1 365 in the story. The chapter boss time limit is 90 s, the miniboss 45 s (`Chapter.kt:131-132`). The backend moves the position on every `CLEARED`/`FAILED` report (`Progress.report`, `domain/Progress.kt:39`, `ProgressService.report`, `service/ProgressService.kt:45`); the last miniboss `CLEARED` moves it to `CHAPTER_BOSS`; a `FAILED` chapter boss moves it back to the last phase of the last stage; the chapter 15 boss `CLEARED` sets `completed = true` (only that one completes). `GET /progress` loads the progress under its row lock (`ProgressService.load`).
- **The chapter boss is the hero of the chapter.** Each chapter boss releases the hero of the next chapter (AD-006, AD-008); the story scenes call the chapter end `chapter-boss` (AD-036). "Defeat the heroes of the chapters" is the chapter boss fight.
- **Kill cycle.** A monster fades 500 ms and the next one appears 1 000 ms later (`DEATH`, `game/src/adapters/phaser/ClickerGame.js:54`), so a real client clears at most one encounter every 1 500 ms. The game sends each won encounter at once (`session.flush()`, `ClickerGame.clearEncounter`).
- **Farming.** With the `Farmar chefe` switch on, a won miniboss comes back as a farm fight while the backend position already stands at `CHAPTER_BOSS` (`ClickerGame.js:1780`); Mapa (Rever chefes) starts farm fights at any time (`startFarm`). A farm win is one `POST /farm/outcome` (`FarmService.report`) and never moves the campaign.
- **Account reset.** `POST /account/reset` puts the campaign back at chapter 1 stage 1 and keeps coins, equipment, cards, crystals and the team (AD-015, `AccountResetService.reset`). `player_resets.resets` counts resets (no row = 0).
- **Click damage.** The Equipamento screen shows the leader's `Dano de clique: <n>` = `leaderAttacker(...).baseDamage` (`game/src/domain/equipment/leaderStats.js:26`): `(1 + weapon click damage + CLICK_FLAT_DAMAGE talents) x (1 + (CLICK_DAMAGE_PCT affixes of the leader's pieces + star click percent + CLICK_DAMAGE talents) / 100)` (`equipment.js:79`, `starBonus.js`, `talents.js:17`). The Equipe screen shows `Dano da equipe por clique: <n>` = the sum over the filled bought ally slots of `(1 + weapon click damage) x (1 + CLICK_DAMAGE_PCT affixes / 100) x ALLY_STAR_MULTIPLIER[stars] x allyFactor` (`teamView.js:36`, `allyAttacker.js`), where `allyFactor` is 1.25 when Seraphine fights and the team is active (chapter 5 or later, or completed; `team.js:46`, `team.js:109`), else 1. Every input is server-authoritative: pieces with refined `clickDamage()` and `value(affix)` (`domain/Equipment.kt:117-120`, AD-009), stars (`PlayerCards.starsOf`, AD-005), talent levels and `valueAt` (`domain/Talents.kt:49`, AD-011), the leader and the team (`player_cards.leader_id`, `player_team`, AD-018).
- **Money.** One balance per player, `wallets.copper` (`bigint`); the game shows it as gold, silver and copper discs (100 copper = 1 silver, 100 silver = 1 gold; `ClickerGame.refreshWalletText`, `equipment.js:91-95`). Copper is credited by `WalletService.sync` and the equipment sales (`WalletAccess.save`), and spent on refines, rerolls and ally slots.
- **Number format.** `formatShort` (`game/src/domain/combat/numberFormat.js`): from 1 000 a value reads with K, M, B or T and one decimal; `formatDamage` (`damage.js:42`) rounds to one decimal below 1 000.
- **HUD rail.** Six buttons (AD-034): Heróis, Mochila, Equipe, Equipamento, Talentos, Mapa (`HeroUi.js:44-51`), 76 x 60 px each, a column centred at (956, 370) of the 1024 x 768 scene; screens open in the 920 px `.hero-window` (max height 708 px).
- **Migrations.** `V20__enemy_defense_contract.sql` is the latest; no open branch adds one.

## Goals

- [ ] A player opens a `Ranking` screen from the HUD rail and reads four rankings, each with its name, subtitle, top 10 rows (position, nick, value) and their own position.
- [ ] Every ranking value is measured or computed by the backend; a request body never carries a ranking value.
- [ ] A forged client cannot rank a chapter boss below 1 000 ms or the whole story below 22:45 (1 365 encounters x 1 000 ms).
- [ ] The migration keeps the previous backend working (AD-016, expand only).

## Out of Scope

| Feature | Reason |
| --- | --- |
| A display name separate from the username | Q1 (recommended default: the username is the nick) |
| Server-side combat, or a damage-based floor for boss times | Closing the gap of AD-002/AD-004 is its own feature; this spec uses plausibility floors |
| Moderation (hiding or deleting a cheater from the boards from the game) | Not requested; the owner can delete rows by SQL (design § Operations) |
| Farm wins counting for the boss board | The backend cannot time a farm fight: it sees only the win (`POST /farm/outcome`) |
| Weekly or seasonal boards, history of past records | Not requested; every board is all-time |
| Friends, search, pages beyond the top 10 | Not requested |
| Rankings of crystals, resets, cards, talents | Not requested |
| Showing anything but position, nick and value in a row (leader, chapter, date) | Owner: only the nick and the value |
| Phone layout | The game targets PC only |
| Backfilling boss and story records from before the migration | No timestamps exist for past fights |

---

## The Four Rankings

| Board id (API) | Name (tab) | Subtitle (exact) | Value | Order |
| --- | --- | --- | --- | --- |
| `boss-time` | `Caçada Relâmpago` | `O menor tempo para derrotar o chefe de cada capítulo, contado desde a vitória sobre o último miniboss.` | best boss time of the chosen chapter, ms | ascending |
| `story-time` | `Travessia do Bosque` | `O menor tempo para concluir a história, do início da jornada (ou do último reset) até a vitória sobre o chefe do capítulo 15.` | best story time, ms | ascending |
| `click-power` | `Fúria da Aliança` | `O maior Dano de clique somado ao Dano da equipe por clique que você já alcançou.` | best click power | descending |
| `fortune` | `Tesouro do Bosque` | `A maior fortuna em moedas que você já teve guardada de uma vez.` | peak copper | descending |

Ties: the record reached first ranks higher (earlier `achieved_at`), then the username in ascending code-point order. Positions are 1, 2, 3, ... with no shared position.

## Record Rules

All times are the backend clock (`java.time.Clock` bean, epoch ms). "Now" is the moment the backend handles the request.

### Boss clock and boss time (`boss-time`, one board per chapter 1 to 15)

The backend keeps one **boss clock** per player (`boss_reached_at`, null = stopped).

| Event (accepted by the backend) | Boss clock |
| --- | --- |
| `POST /progress/outcome` `CLEARED` that moves the position to `CHAPTER_BOSS` (the last miniboss) | starts: now |
| `GET /progress` while the position is `CHAPTER_BOSS` and not completed (a page load or login restarts the fight) | restarts: now |
| `POST /farm/outcome` `CLEARED` while the campaign position is `CHAPTER_BOSS` and not completed (back from farming) | restarts: now |
| `POST /progress/outcome` `FAILED` from `CHAPTER_BOSS` | stops: null |
| `POST /account/reset` | stops: null |
| `POST /progress/outcome` `CLEARED` from `CHAPTER_BOSS` of chapter c | measured, then stops: null |

When a `CLEARED` chapter boss report of chapter c is accepted and the clock is running: `time = now - boss_reached_at`. If `time < 1 000` ms the record is refused (log warn, nothing stored). Else the stored time of (player, c) becomes `time` when there is none or `time` is smaller; an equal or larger time changes nothing. With the clock stopped (null) nothing is recorded.

### Run clock and story time (`story-time`)

The backend keeps one **run start** per player (`run_started_at`, null = unknown).

- `POST /account/reset` sets the run start to now.
- When the chapter 15 boss `CLEARED` report is accepted (the progress becomes completed): `start = run_started_at`, or, when it is null and the player never reset (`player_resets` has no row), `users.created_at`; with no start nothing is recorded. `time = now - start`. If `time < floor` the record is refused (log warn). Else the stored story time becomes `time` when there is none or `time` is smaller.
- `floor = 1 000 ms x the number of encounters of chapters 1 to 15` read from the stored chapter definitions: `sum over c of (stageCount x phasesPerStage + stageCount + 1)` = 1 365 x 1 000 = **1 365 000 ms** (22:45) with today's seed.
- A completed campaign stays completed until a reset, so a second completion needs a reset first.

### Click power (`click-power`)

`power = leaderClick + teamClick`, computed by the backend from stored state (numbers as Facts From the Code):

- `leaderClick = (1 + W(leader) + talent(CLICK_FLAT_DAMAGE)) x (1 + (P(leader) + STAR_CLICK_PCT[stars(leader)] + talent(CLICK_DAMAGE)) / 100)`
- `teamClick = sum over the allies of (1 + W(a)) x (1 + P(a) / 100) x ALLY_STAR_MULTIPLIER[stars(a)] x allyFactor`
- `W(h)` = the refined click damage of the weapon hero h wears (0 without one); `P(h)` = the sum of the refined `CLICK_DAMAGE_PCT` affix values of the pieces h wears; `stars(h)` = `PlayerCards.starsOf(h)`; `talent(id)` = the sum of `valueAt(level)` over the grades of `id`.
- `STAR_CLICK_PCT` = 0, 10, 20, 40, 70, 100, 130, 160, 190, 220 for 0 to 9 stars; `ALLY_STAR_MULTIPLIER` = 2, 4, 6, 8, 10, 12, 14, 16, 18, 20.
- The allies are the heroes in ally slots 1 to `boughtSlots` (the backend never stores the leader or a hero in a slot that is not bought, `Team.kt:13`, `Team.afterLeaderChange`). `allyFactor` = 1.25 when the team is active (`completed` or chapter >= 5) and Seraphine (`seraphine`) is one of the allies, else 1.
- The power is computed and kept when bigger than the stored one (`best`) at: every accepted `CLEARED` campaign report of a miniboss or a chapter boss, every accepted farm `CLEARED`, and every `POST /rankings/click-power`. A player with no cards row gets no power.

### Fortune (`fortune`)

Every insert of a wallet and every change of `wallets.copper`, by any backend version, keeps `peak_copper = max(peak_copper, copper)` (a database trigger). At the migration the peak of every existing wallet starts at its current copper. A peak of 0 is not listed.

### Lifecycle

Records and clocks are deleted with the user (cascade). An account reset keeps every record (it only moves the clocks). No record expires.

## Power Examples (the shared fixture, refine 0)

| # | Leader | Talents | Allies | Team active | Power |
| --- | --- | --- | --- | --- | --- |
| C1 | 0 stars, no piece | none | none | no (chapter 1) | 1 |
| C2 | 3 stars (40 %), weapon click 6, ring `CLICK_DAMAGE_PCT` 10 | `CLICK_FLAT_DAMAGE` 3, `CLICK_DAMAGE` 15 | none | no | (1 + 6 + 3) x (1 + 65 / 100) = 16.5 |
| C3 | 0 stars, no piece | none | slot 1 `lyra` 2 stars with weapon click 4; slot 2 `seraphine` 0 stars, no piece | yes (chapter 6) | 1 + (5 x 6 x 1.25) + (1 x 2 x 1.25) = 41 |
| C4 | as C3 | none | as C3 | no (chapter 3) | 1 + 30 + 2 = 33 |
| C5 | 9 stars (220 %), weapon click 20, ring 25 %, amulet 30 % | `CLICK_FLAT_DAMAGE` 10, `CLICK_DAMAGE` 50 | none | no | 31 x 4.25 = 131.75 |
| C6 | 0 stars, no piece | none | `boughtSlots` 1, slot 1 `orina` 9 stars (x20) with weapon click 9 and ring 20 % | yes (completed) | 1 + 10 x 1.2 x 20 = 241 |

Backend-only: a leader weapon of base click 5 at refine 2 (click 6.0) and a ring `CLICK_DAMAGE_PCT` base 7 at refine 3 (value 9) give `7 x 1.09` = 7.63.

## Player-Facing Texts

Every new text, exactly (AD-007, L-010).

| Where | Text |
| --- | --- |
| Rail button label and `aria` name | `Ranking` |
| Screen title (`.hero-title`) | `Ranking` |
| Tab group `aria-label` | `Escolher ranking` |
| Tabs | the four names of § The Four Rankings |
| Board heading (`h3`) | the name of the selected board |
| Subtitle (`p` under the heading) | the subtitle of the selected board |
| Chapter row label | `Capítulo` |
| Chapter chip text / `aria-label` / `title` of the campaign's chapter | `<n>` / `Capítulo <n>` / `Capítulo atual` |
| Column headers | `Posição`, `Jogador`, then `Tempo` (boss-time, story-time), `Dano por clique` (click-power), `Moedas` (fortune) |
| Position | `<n>º` (`1º`, `10º`, `27º`) |
| Own-row chip | `Você` |
| Gap row between the top 10 and the own row | `⋯` |
| Board with no entry | `Ninguém entrou neste ranking ainda.` |
| Board with entries, player without a record | `Você ainda não entrou neste ranking.` |
| While a tab or chapter loads | `Carregando...` |
| A failed load (error line of the panel, existing text) | `Não foi possível carregar.` |
| Fortune value, assistive text before each disc (as the HUD wallet) | `Ouro: `, `Prata: `, `Cobre: ` |

## Value Formats

| Board | Format | Examples |
| --- | --- | --- |
| `boss-time` | `mm:ss.d` (tenths truncated); from 1 hour `hh:mm:ss.d`; hours at least 2 digits | 1 000 -> `00:01.0`; 12 345 -> `00:12.3`; 61 050 -> `01:01.0`; 359 999 -> `05:59.9`; 3 600 000 -> `01:00:00.0` |
| `story-time` | `mm:ss` (seconds truncated); from 1 hour `hh:mm:ss`; hours at least 2 digits | 1 365 000 -> `22:45`; 3 599 999 -> `59:59`; 3 600 000 -> `01:00:00`; 7 384 000 -> `02:03:04`; 360 000 000 -> `100:00:00` |
| `click-power` | `formatDamage` | 1 -> `1`; 16.5 -> `16.5`; 131.75 -> `131.8`; 12 500 -> `12.5K`; 1 234 567 -> `1.2M` |
| `fortune` | three coin discs as the HUD wallet: gold `floor(c / 10000)` through `formatShort`, silver `floor(c / 100) mod 100`, copper `c mod 100` | 1 234 567 -> gold `123`, silver `45`, copper `67`; 123 456 789 -> gold `12.3K`, silver `67`, copper `89`; 5 -> `0`, `0`, `5` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** Nick | **Recommended**: the username is the nick; no new field | It is the only name a player has, it is unique and the player chose it. Trade-off: the rankings make login names public and login has no throttle (design § Risks); a separate display name is a feature of its own | n (owner) |
| **Q2** Story time: wall clock or play time | **Recommended**: wall clock from the run start (registration or last reset) to the chapter 15 boss win; time offline counts | A speedrun reading; the server can measure it without trusting the client; "play time" would need a gap cap the backend cannot pick well (a phase monster has no time limit) | n (owner) |
| **Q3** Ranking 1: one board or per chapter | Per chapter: 15 boards, a chapter chip row like Mapa, default chapter = the campaign's chapter (15 when completed) | Boss health doubles every chapter (AD-019): one board would compare unequal fights | n (owner) |
| **Q4** What the boss time measures | The backend clock from the last miniboss win (or the restarts of § Boss clock) to the chapter boss win; the 1.5 s entrance of the boss is inside every time | The client never sends a time; the clock only runs slower than the fight, never faster, for a real client | n (owner) |
| **Q5** Boss times from the farm | Not counted | The backend sees only the farm win, not its start | n (owner) |
| **Q6** Anti-cheat floors | Boss time >= 1 000 ms; story time >= 1 365 000 ms; below them the record is refused and logged | A real client needs at least 1 500 ms per encounter (kill cycle); a forged client can still reach the floors (AD-002 trade-off) | n (owner) |
| **Q7** Click power: current or best | Best ever, recomputed by the backend at boss wins, farm wins and each opening of the screen | All four boards become records that never fall; a reset drops the team below chapter 5 and should not drop the record; the server computes it, so it cannot be forged | n (owner) |
| **Q8** Click power: what the team part is | Exactly the Equipe number: filled bought slots, Seraphine's 1.25 only while the team is active | The ranking is the sum of the two numbers the player reads (Equipamento + Equipe) | n (owner) |
| **Q9** Money: current or best | Peak balance ever (`max` of `wallets.copper`), kept by a database trigger | Spending on refines and slots must not drop a player; the trigger catches every credit path, the previous backend's too | n (owner) |
| **Q10** Top N and refresh | Top 10 rows, the own row pinned under them when outside; a board loads on opening the screen and on each tab or chapter change; no polling | 10 rows fit the 708 px window with no scroll | n (owner) |
| **Q11** Where the rankings live | A seventh rail button `Ranking` after Mapa, Lucide `trophy` icon; new AD-037 supersedes the six-button count of AD-034 | The rail is where every screen opens | n (owner) |
| **Q12** Existing players | Fortune starts at the current copper; boss, story and power boards start empty; a player who reset before the migration has no run start until the next reset; a player who never reset starts at `users.created_at` | No past timestamps exist; the registration time is a true run start for a player who never reset | n (owner) |
| **Q13** Highlight of the own row | Ember tint row with a `Você` chip; outside the top 10: a `⋯` row, then the own row with its position | Players find themselves at a glance | n (owner) |
| **Q14** Old backend | A game against a backend without `/rankings` shows `Não foi possível carregar.`; the rail button stays | The game and the backend deploy separately | n (owner) |
| Error codes | `404 RANKING_NOT_FOUND` (unknown board), `400 INVALID_RANKING_REQUEST` (boss-time without a chapter, or a chapter that is not an integer from 1 to 15); no `errorText.js` line | The game never sends them; AD-032 asks a line only for errors a player can see | n (owner) |
| Branch | Every task works on `ci/rankings`; `gitops` merges to `main` after a green CI run (backend change, CLAUDE.md § Git workflow) | The backend suite runs only in CI | n (owner) |
| Implicit dimensions | Input bounds: board id from the 4, chapter 1 to 15, username shown as text (no HTML), cut with an ellipsis at 360 px. Failure: a record is written in the transaction of the report that causes it, so a failed report writes no record; a failed board load shows the error line. Idempotency: a report the backend refuses (409) moves no clock; upserts keep the better value, so a retry changes nothing. Concurrency: clocks change only under the `progress` row lock; record upserts are single SQL statements that keep the better value. Auth: both endpoints need the player's token; any player reads every board. Rate limits: none (two cheap queries a load). Data lifecycle: cascade with the user, kept through resets. Observability: info log per new record, warn per refused record. External dependency: N/A (own database). State transitions: the boss clock null -> running -> null as § Boss clock | Large-scope sweep | n (owner) |

**Open questions:** Q1 to Q14 wait for the owner. Q1 (nick = username) and Q2 (wall clock) are the two real product decisions; Q3 to Q14 are the product owner's defaults from the code.

---

## User Stories

### P1: The boss time is recorded by the backend ⭐ MVP

**User Story**: As a player, I want my fastest win over each chapter boss recorded so that I can race the others chapter by chapter.

**Why P1**: Ranking 1 of the owner.

**Acceptance Criteria**:

1. WHEN the backend accepts the `CLEARED` report of the last miniboss of chapter 3 at t = 10 000 and the `CLEARED` chapter 3 boss report at t = 22 345 THEN it SHALL store 12 345 ms as the chapter 3 boss time of the player.  <!-- event-driven -->
2. WHEN the stored chapter 3 time is 12 345 and a new chapter 3 boss win measures 15 000 THEN the backend SHALL keep 12 345.  <!-- event-driven -->
3. WHEN the stored chapter 3 time is 12 345 and a new chapter 3 boss win measures 9 000 THEN the backend SHALL store 9 000.  <!-- event-driven -->
4. IF a chapter boss win measures 999 ms THEN the backend SHALL store nothing and log a warning; a win of exactly 1 000 ms SHALL be stored.  <!-- unwanted-behavior -->
5. WHEN the boss clock started at t = 0 and `GET /progress` is answered at t = 50 000 with the position at `CHAPTER_BOSS` THEN a boss win at t = 62 000 SHALL record 12 000.  <!-- event-driven -->
6. WHEN the boss clock started at t = 0 and a farm win is accepted at t = 30 000 while the campaign stands at `CHAPTER_BOSS` THEN a boss win at t = 41 500 SHALL record 11 500.  <!-- event-driven -->
7. WHEN a `FAILED` chapter boss report is accepted THEN the backend SHALL stop the boss clock, and a later win SHALL be timed from the next time the clock starts.  <!-- event-driven -->
8. IF a chapter boss win is accepted while the boss clock is stopped THEN the backend SHALL store no boss time.  <!-- unwanted-behavior -->
9. WHEN an account reset is accepted THEN the backend SHALL stop the boss clock and keep every stored boss time.  <!-- event-driven -->
10. IF the backend refuses a report (409 position mismatch) THEN it SHALL change no clock and no record.  <!-- unwanted-behavior -->

**Independent Test**: A service test with a mutable clock clears miniboss 10 of chapter 3 at 10 000 and the boss at 22 345 and reads 12 345 for chapter 3.

---

### P1: The story time is recorded by the backend ⭐ MVP

**User Story**: As a player, I want the time of my fastest full run recorded so that a quick run after a reset is worth something.

**Why P1**: Ranking 2 of the owner.

**Acceptance Criteria**:

1. WHEN a player registered at t = 0 who never reset wins the chapter 15 boss at t = 7 200 000 THEN the backend SHALL store a story time of 7 200 000.  <!-- event-driven -->
2. WHEN a player reset at t = 1 000 000 and wins the chapter 15 boss at t = 4 600 000 THEN the backend SHALL store 3 600 000.  <!-- event-driven -->
3. IF the measured story time is 1 364 999 ms THEN the backend SHALL store nothing and log a warning; 1 365 000 SHALL be stored.  <!-- unwanted-behavior -->
4. IF a player with a `player_resets` row and no run start wins the chapter 15 boss THEN the backend SHALL store no story time.  <!-- unwanted-behavior -->
5. WHEN the stored story time is 3 600 000 and a new run measures 4 000 000 THEN the backend SHALL keep 3 600 000; a run of 3 000 000 SHALL replace it.  <!-- event-driven -->
6. The backend SHALL compute the floor from the stored chapter definitions: 1 365 000 ms for the seeded chapters 1 to 15.  <!-- ubiquitous -->

**Independent Test**: A service test resets at 1 000 000, completes the campaign at 4 600 000 and reads 3 600 000.

---

### P1: The click power is computed by the backend ⭐ MVP

**User Story**: As a player, I want my strongest click plus team recorded from my real gear so that nobody can type a fake number.

**Why P1**: Ranking 3 of the owner.

**Acceptance Criteria**:

1. The backend SHALL compute the power of cases C1 to C6 of § Power Examples as 1, 16.5, 41, 33, 131.75 and 241 (within 1e-9).  <!-- ubiquitous -->
2. The game's `leaderAttacker(...).baseDamage` plus the `allyDamagePerClick` of the same allies SHALL give the same six values for the same fixture file.  <!-- ubiquitous -->
3. WHEN the backend accepts a `CLEARED` campaign report of a miniboss or a chapter boss THEN it SHALL compute the power and store it when bigger than the stored one.  <!-- event-driven -->
4. WHEN the backend accepts a farm `CLEARED` report THEN it SHALL compute the power and store it when bigger.  <!-- event-driven -->
5. WHEN the backend accepts a `CLEARED` phase report THEN it SHALL not compute the power.  <!-- event-driven -->
6. WHEN a player calls `POST /rankings/click-power` THEN the backend SHALL answer `{ "value": <current power>, "best": <stored best after the call> }` and store the current power when bigger.  <!-- event-driven -->
7. WHEN the stored best is 41 and the current power is 33 THEN `POST /rankings/click-power` SHALL answer `{ "value": 33, "best": 41 }` and keep 41.  <!-- event-driven -->
8. IF the player has no cards row THEN `POST /rankings/click-power` SHALL answer `{ "value": null, "best": <stored best or null> }` and store nothing.  <!-- unwanted-behavior -->

**Independent Test**: A unit test reads the shared fixture and asserts the six values; a controller IT equips a weapon, posts `/rankings/click-power` and reads the board.

---

### P1: The fortune peak is kept by the database ⭐ MVP

**User Story**: As a player, I want the largest fortune I ever held to count so that spending on my heroes does not throw me down the board.

**Why P1**: Ranking 4 of the owner.

**Acceptance Criteria**:

1. WHEN a wallet's copper rises from 0 to 500 THEN the peak SHALL be 500.  <!-- event-driven -->
2. WHEN the copper then falls from 500 to 200 THEN the peak SHALL stay 500.  <!-- event-driven -->
3. WHEN a wallet row is inserted with 700 copper THEN the peak SHALL be 700.  <!-- event-driven -->
4. WHEN the migration runs on a database whose wallet holds 1 234 copper THEN that player's peak SHALL be 1 234.  <!-- event-driven -->
5. The trigger SHALL keep the peak for a wallet update made by the previous backend's SQL (`update wallets set copper = ...`).  <!-- ubiquitous -->

**Independent Test**: A migration IT updates `wallets.copper` 0 -> 500 -> 200 by SQL and reads 500 from `player_fortune`.

---

### P1: The boards API ⭐ MVP

**User Story**: As the game, I want one call per board that answers the top 10 and the caller's own position.

**Acceptance Criteria**:

1. WHEN the player calls `GET /rankings/boss-time?chapter=3` THEN the backend SHALL answer `{ "board": "boss-time", "chapter": 3, "entries": [ { "position", "username", "value" } ], "me": { "position", "username", "value" } | null }` with at most 10 entries in ascending time.  <!-- event-driven -->
2. WHEN the player calls `GET /rankings/story-time`, `GET /rankings/click-power` or `GET /rankings/fortune` THEN the backend SHALL answer the same shape with `"chapter": null`, ascending for story-time and descending for the other two.  <!-- event-driven -->
3. WHEN two records have the same value THEN the one with the earlier `achieved_at` SHALL rank first, then the smaller username.  <!-- event-driven -->
4. WHEN the caller is 27th of a board THEN `me` SHALL be `{ "position": 27, "username": <their username>, "value": <their value> }` and the entries SHALL not contain the caller.  <!-- event-driven -->
5. WHEN the caller has no record on the board THEN `me` SHALL be `null`.  <!-- event-driven -->
6. The backend SHALL answer `value` as a JSON integer for boss-time, story-time and fortune, and as a JSON number for click-power.  <!-- ubiquitous -->
7. The fortune board SHALL leave out peaks of 0.  <!-- ubiquitous -->
8. IF the board id is not one of the four THEN the backend SHALL answer 404 with code `RANKING_NOT_FOUND`.  <!-- unwanted-behavior -->
9. IF boss-time has no `chapter`, or a `chapter` that is not an integer from 1 to 15 THEN the backend SHALL answer 400 with code `INVALID_RANKING_REQUEST`.  <!-- unwanted-behavior -->
10. IF the request has no valid token THEN the backend SHALL answer 401 as every other protected endpoint.  <!-- unwanted-behavior -->

**Independent Test**: A controller IT with 12 boss times in chapter 3 reads 10 entries in order and `me.position` 12 for the slowest player.

---

### P1: Storage that keeps the previous backend working ⭐ MVP

**User Story**: As the owner, I want the migration to be expand only so that a failed deploy does not break the live backend.

**Acceptance Criteria**:

1. The migration `V21__rankings.sql` SHALL only create tables, indexes, one function and one trigger, and insert the fortune backfill.  <!-- ubiquitous -->
2. WHEN the release whose last migration is V20 starts on the migrated schema THEN its Flyway validation SHALL pass and see V21 as a future migration.  <!-- event-driven -->
3. WHEN a user is deleted THEN every row of the user in the five new tables SHALL be deleted with it.  <!-- event-driven -->
4. The tables SHALL refuse a boss chapter outside 1 to 15, a negative time and a non-positive power.  <!-- ubiquitous -->

**Independent Test**: `PreviousBackendCompatibilityIT` gains the V20 case; a migration IT deletes a user and counts 0 rows.

---

### P1: The Ranking screen ⭐ MVP

**User Story**: As a player, I want to open the rankings from the rail and switch between the four boards.

**Acceptance Criteria**:

1. The rail SHALL show seven buttons in this order: Heróis, Mochila, Equipe, Equipamento, Talentos, Mapa, Ranking (`data-testid="hud-rankings"`).  <!-- ubiquitous -->
2. WHEN the player clicks `Ranking` THEN the game SHALL call `POST /rankings/click-power` once, then `GET /rankings/<board>` of the board shown, and open the panel titled `Ranking`.  <!-- event-driven -->
3. WHEN the screen opens for the first time in a page load THEN it SHALL show `Caçada Relâmpago` with the chapter of the campaign (chapter 15 when completed).  <!-- event-driven -->
4. WHILE the screen is open the game SHALL show the four tabs in the order of § The Four Rankings, the selected one with `aria-pressed="true"`, and under them the selected board's name as a heading and its subtitle.  <!-- state-driven -->
5. WHEN the player clicks another tab THEN the game SHALL load that board (`GET /rankings/<board>`, with `chapter` for boss-time) and show its name, subtitle and rows.  <!-- event-driven -->
6. WHILE `Caçada Relâmpago` is selected the game SHALL show the chapter row `Capítulo` with chips 1 to 15, the shown chapter pressed and the campaign's chapter marked; a click on another chip SHALL load that chapter.  <!-- state-driven -->
7. WHEN the screen is closed and opened again in the same page load THEN it SHALL show the board and chapter shown last.  <!-- event-driven -->
8. WHEN a board answer arrives after the player switched to another tab or chapter, or closed the screen, THEN the game SHALL ignore it.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend, a click on `Ranking` shows `Caçada Relâmpago` of chapter 4 for a player in chapter 4, and a click on `Tesouro do Bosque` shows its subtitle.

---

### P1: Rows and formats ⭐ MVP

**User Story**: As a player, I want each row to show only the position, the nick and the value, and to find myself at once.

**Acceptance Criteria**:

1. The game SHALL show one row per entry with the texts `<n>º`, the username and the value in the format of § Value Formats, under the column headers of § Player-Facing Texts.  <!-- ubiquitous -->
2. The game SHALL show positions 1, 2 and 3 on a gold, a silver and a copper disc.  <!-- ubiquitous -->
3. WHEN the caller is in the entries THEN their row SHALL carry the class `is-me` and the chip `Você`, and no row SHALL be added under the list.  <!-- event-driven -->
4. WHEN `me` is not null and the caller is not in the entries THEN the game SHALL add the row `⋯` and then the caller's row with `me.position`, `is-me` and `Você`.  <!-- event-driven -->
5. WHEN `me` is null and the board has entries THEN the game SHALL show `Você ainda não entrou neste ranking.` under the list.  <!-- event-driven -->
6. WHEN the board has no entry THEN the game SHALL show only `Ninguém entrou neste ranking ainda.` (no headers).  <!-- event-driven -->
7. The game SHALL write the username as text (an entry named `<b>x</b>` reads `<b>x</b>`) and cut a name wider than 360 px with an ellipsis, the full name in `title`.  <!-- ubiquitous -->

**Independent Test**: The fake backend answers 10 fortune entries and `me { position: 27, value: 5 }`; the screen shows 10 rows, `⋯` and `27º` with the discs `0`, `0`, `5`.

---

### P1: Loading and failure ⭐ MVP

**User Story**: As a player, I want to know when a board loads or fails.

**Acceptance Criteria**:

1. WHILE a tab or chapter answer is pending the game SHALL show `Carregando...` in place of the rows, with the tabs and chips still clickable.  <!-- state-driven -->
2. IF `GET /rankings/<board>` fails or answers 404 THEN the game SHALL show `Não foi possível carregar.` in the error line of the panel and no rows.  <!-- unwanted-behavior -->
3. IF `POST /rankings/click-power` fails THEN the game SHALL still load and show the board.  <!-- unwanted-behavior -->
4. WHEN a load succeeds after a failed one THEN the game SHALL hide the error line.  <!-- event-driven -->

**Independent Test**: With the fake backend's rankings endpoint off, a click on `Ranking` shows `Não foi possível carregar.`.

---

## Edge Cases

- WHEN the caller is exactly 10th THEN their row SHALL be highlighted in the list and no `⋯` row SHALL appear.
- WHEN the caller is 11th THEN the list SHALL show 10 rows, `⋯` and the `11º` row.
- WHEN a board has 3 entries THEN the game SHALL show 3 rows.
- WHEN two players reach the same boss time THEN the one stored first SHALL rank higher.
- WHEN a player completes the story, resets and completes again faster THEN the story board SHALL show the faster time.
- WHEN a player at the chapter boss reloads the page THEN the boss time SHALL be counted from the reload (`GET /progress`).
- WHEN a player at the chapter boss turns `Farmar chefe` on, farms miniboss 10 and comes back THEN the boss time SHALL be counted from the last farm win.
- WHEN a player who reached the chapter boss on the previous backend wins it on the new one THEN no boss time SHALL be stored (clock null).
- WHEN a player whose click power was 41 resets and drops to 33 THEN the board SHALL keep 41.
- WHEN a player spends 300 of 500 copper THEN the fortune board SHALL keep 500.
- WHEN a player has 0 copper and never earned any THEN the player SHALL not be on the fortune board.
- WHEN the request is `GET /rankings/story-time?chapter=3` THEN the backend SHALL ignore the chapter and answer `"chapter": null`.
- WHEN `GET /rankings/boss-time?chapter=16` or `?chapter=abc` THEN the backend SHALL answer 400 `INVALID_RANKING_REQUEST`.
- WHEN a user is deleted THEN the user SHALL disappear from every board.
- WHEN a username is 255 characters long THEN its row SHALL keep one line.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RNK-01 | P1: Boss time - AC 1 to 10 | Tasks T2, T5, T6, T7, T8 | Pending |
| RNK-02 | P1: Story time - AC 1 to 6 | Tasks T2, T5, T6, T8 | Pending |
| RNK-03 | P1: Click power - AC 1 to 8 | Tasks T3, T5, T6, T7, T9, T10, T17 | Pending |
| RNK-04 | P1: Fortune - AC 1 to 5 | Tasks T1 | Implementing |
| RNK-05 | P1: Boards API - AC 1 to 10 | Tasks T4, T9, T10 | Pending |
| RNK-06 | P1: Storage - AC 1 to 4 | Tasks T1, T4 | Implementing |
| RNK-07 | P1: Ranking screen - AC 1 to 8 | Tasks T12, T13, T15, T16, T18, T19 | Pending |
| RNK-08 | P1: Rows and formats - AC 1 to 7 | Tasks T11, T14, T18, T21 | Pending |
| RNK-09 | P1: Loading and failure - AC 1 to 4 | Tasks T13, T14, T15, T18 | Pending |

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Backend tests pin every boss, story, power and fortune rule with exact numbers, and the API shape, order, ties and errors.
- [ ] One shared fixture proves the game and the backend compute the same click power.
- [ ] e2e tests show the rail button, the four boards, the chapter chips, the own row, the empty, loading and failure states.
- [ ] The previous backend starts on the migrated schema.
