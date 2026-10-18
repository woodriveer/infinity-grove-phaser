# Characters (Hero Cards, Bag and Fusion) Specification

## Problem Statement

The player is a fixed fire attacker and nothing drops from bosses except coins. This feature adds the hero card mechanic. The player picks a starting hero (fire, water or nature) when creating the account; the chapters then follow an order of elements that depends on that pick, and each chapter boss releases the hero of the next chapter. Bosses drop hero cards into a per-player bag, and three copies of a card fuse into one card of the next star level; a hero's stars unlock its three skills. Minibosses and the chapter boss become repeatable ("farm") so drop chances of 1 % and 10 % are reachable, with the chapter boss limited to 10 wins per UTC day. The game gets a hero catalog, a bag and a fusion screen, opened from buttons on the game screen, plus one active leader, chosen manually, and a skill bar on the combat screen that shows the leader's three skills. The five heroes designed in `README.md`, with their art in `art/`, are the catalog. All new text is in Portuguese. Executing skills in combat (damage, control, buffs, cooldowns, leader bonus) and a team of several active heroes are later features (`hero-combat`).

## Goals

- [ ] A new account picks a starting hero among fire, water and nature, and the chapter order and boss releases follow from it.
- [ ] A player collects cards from miniboss and chapter boss wins, with the server rolling every drop.
- [ ] Three cards of the same hero and star level fuse into one card of the next level, up to 3 stars, and the star level unlocks skills 1, 2 and 3.
- [ ] The game shows a catalog of the five heroes (owned in colour, pending in grey), a bag and a fusion screen, all reachable from buttons on the game screen, and every screen shows the skills even when locked.
- [ ] The player picks the leader among owned heroes and the combat screen shows the leader's three skills with their lock state.
- [ ] Defeated minibosses and the chapter boss can be fought again, and the chapter boss pays at most 10 wins per UTC day.
- [ ] The campaign position, boss timers and the coin wallet behave exactly as before.

## Out of Scope

| Feature                                                                                                   | Reason                                                                                       |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Executing skills in combat (damage, stun, fear, poison, bleed, buffs, casting, interruption, cooldown running) and the leader bonus effect | Next feature `hero-combat`; this feature shows skills and the leader, the player stays fire and physical in combat |
| A team of several active heroes                                                                           | Decided: one active leader now, team later; the leader is stored as a single value           |
| Hero combat stats (strength, arcane power, attack speed, accuracy, critical, resistance)                  | Not needed until `hero-combat`                                                               |
| Enemy elements and story per chapter, chapter definitions for chapters 2 to 5, chapter cinematics          | Chapter content features; this feature only orders the heroes by chapter                     |
| Selling cards, the market, any use of spare cards                                                         | Later feature; spare cards stay in the bag (decided)                                         |
| Final UI design, card frames, animations                                                                  | UI is undecided; screens are functional DOM using the existing hero art                      |
| Resizing the art and removing its magenta background                                                      | Decided: out of scope; the images ship as they are                                           |
| Existing accounts without a starting hero                                                                 | Decided: the owner clears the existing accounts                                              |
| Translating the text that already exists in the game                                                      | Registered as technical debt TD-001 below                                                    |
| An admin screen or API to edit heroes or drop rates                                                       | Values are edited in the database or configuration                                           |
| Server-side combat validation                                                                             | The client owns combat (AD-002)                                                              |
| Pity counters, bad-luck protection                                                                        | Not requested                                                                                |
| Coin drops from farm fights                                                                               | Wallet drops stay tied to phase monsters as today                                            |

---

## Assumptions & Open Questions

| Assumption / decision                | Chosen default                                                                                                                                                                                                                         | Rationale                                                                                       | Confirmed? |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| Star levels                          | A card has 0 to 3 stars. A 0-star ("blank") card gives no skill. Skill n unlocks when the hero holds a card of n stars or more (1, 2 or 3)                                                                                              | User decision                                                                                   | y          |
| Fusion rule                          | 3 cards of the same hero and the same stars (0, 1 or 2) become 1 card of the next stars. A 3-star card cannot be fused                                                                                                                  | User decision                                                                                   | y          |
| Hero state                           | A hero is owned when the bag holds any card of it. Its stars are the highest star level among its cards. Spare cards stay in the bag with no cap                                                                                         | User decision (spare cards are sold later)                                                      | y          |
| Heroes and elements                  | Five heroes from `README.md`, each with one element: Kael Raizférrea (Guerreiro, FIRE), Lyra Folhaveloz (Arqueira, NATURE), Orina Brumaestrela (Maga, WATER), Seraphine Aurora (Clériga, LIGHT), Vex Sombraespinho (Assassino, DARKNESS). Class, three skills (name, type, effect text, cooldown seconds) and leader bonus text are stored as written in the README. The README still names her "Orina" (Mago), an outdated male version; the hero is Orina, a woman, as in the art files | User decision (elements); the README holds the rest                                             | y          |
| Starting hero                        | At account creation the player picks FIRE, WATER or NATURE, which gives Kael, Orina or Lyra. The account starts with one 0-star card of that hero, and that hero is the leader                                                           | User decision (starting hero, one blank card)                                                   | y          |
| Chapter order of elements            | Chapter 1 is the starting element. Chapter 2 is the element the starting one hits hardest (FIRE to NATURE, NATURE to WATER, WATER to FIRE). Chapter 3 is the remaining element of the three. Chapter 4 is DARKNESS and chapter 5 is LIGHT. Examples: FIRE gives FIRE, NATURE, WATER, DARKNESS, LIGHT; NATURE gives NATURE, WATER, FIRE, DARKNESS, LIGHT; WATER gives WATER, FIRE, NATURE, DARKNESS, LIGHT | User decision; the hit order is the multiplier table of the `elements` feature (2.0 against the next) | y          |
| Hero of a chapter                    | The hero of chapter c is the hero whose element is the player's chapter c element                                                                                                                                                       | Follows from the order above                                                                    | y          |
| Who drops what                       | A miniboss of chapter c drops the hero of chapter c. The chapter boss of chapter c releases the hero of chapter c + 1: its first win by the player drops that card with certainty, later wins roll for it. The chapter 5 boss drops the hero of chapter 5 | User decision (each chapter boss releases a new hero)                                           | y          |
| Drop rates                           | Miniboss win: 1 %. Chapter boss win: 10 %, except the player's first win of that chapter boss, which drops with certainty                                                                                                               | User decision                                                                                   | y          |
| Rolls on every win                   | Campaign wins and farm wins of a miniboss both roll the 1 %. Phase monsters never drop cards. A failed fight never rolls                                                                                                                | "a cada mini boss" read as every miniboss win                                                   | n          |
| Where the roll happens               | In the backend, when it accepts a `CLEARED` report, in the same transaction as the progress change; the response carries the dropped card. The game never sends or chooses a drop                                                       | A client-chosen 1 % is trivial to forge; follows AD-002's direction                             | n          |
| Randomness                           | The roll uses an injected random source (0 ≤ r < 1); a drop happens when r < rate. Rates are configuration (`0.01`, `0.10`)                                                                                                             | Deterministic tests; tunable without code                                                       | n          |
| Skill preview                        | The hero detail in the catalog and the card view in the bag show all three skills (art, name, type, effect, cooldown) for every hero, owned or not; skills above the hero's stars are marked locked                                     | User: skills are viewable even when disabled                                                    | y          |
| Hero art                             | The `*_position.jpg` of each hero is its portrait in every screen (the best image, per the user). Each skill uses its skill image: Kael `kael_dimensional_cut` (Corte Dimensional), `kael_charge` (Investida do Baluarte) and `kael_screen` (Brado Aterrador), Lyra `lyra_double_shot`, `lyra_focused_shot`, `lyra_rapid_wind`, Orina `orina_tempest`, `orina_grasp_prision`, `orina_meteor_storm`, Seraphine `seraphine_blessing`, `seraphine_holy_light`, `seraphine_bell_ringing`, Vex `vex_poison_bomb`, `vex_smoke_bomb`, `vex_bleeding_blow`. Every skill has an image | User decision (portraits; `kael_screen` is Brado Aterrador) | y          |
| Art preparation                      | Out of scope. The game loads each portrait and skill image by its file name from `game/public/assets`; this feature ships them as they are in `art/`, and prepared files (resized, transparent background) replace them later under the same names | User decision (resizing and transparency are out of scope)                                      | y          |
| Language                             | All new text is Portuguese: button and screen labels, error lines, the drop notice, the registration choice. Backend error codes stay English constants. The text that exists today stays English until TD-001 is done                    | User decision (everything in Portuguese; existing text is technical debt)                       | y          |
| Labels                               | Buttons: "Heróis", "Mochila", "Fusão", "Líder", "Rever chefes". Fusion row button: "Fundir". Drop notice: "Carta: <nome do herói>". Registration error: "Escolha seu herói inicial."                                                    | Simple Portuguese words for the five concepts                                                   | n          |
| Leader                               | One leader, stored in the backend per player; it starts as the starting hero and the player changes it to any owned hero. There is no team slot yet                                                                                    | User decision (single active leader, manual choice)                                             | y          |
| Skill bar in this feature            | The combat screen shows the leader's three skill slots with art, name and cooldown seconds; a slot above the leader's stars is dimmed with a lock mark. Clicking or pressing a slot does nothing yet                                    | User asked for a functional bar; execution is split into `hero-combat` so this feature stays testable and releasable | n          |
| Leader bonus                         | The hero detail shows the leader bonus text; the bonus has no effect on damage in this feature                                                                                                                                          | Needs the combat stats of `hero-combat`                                                         | n          |
| Button location                      | Heroes, Bag, Fusion, Leader and Farm are always-visible buttons in the game screen HUD, not entries of the pause menu. Opening one pauses play as the pause menu does today                                                             | User decision (the pause menu is not intuitive for them)                                        | y          |
| Farm eligibility                     | A miniboss of stage n can be fought again once its stage is passed (stage < current stage, or the campaign is completed). The chapter boss can be fought again once the campaign is completed                                           | A boss is repeatable only after the player has beaten it                                        | n          |
| Farm effect on progress              | A farm fight never changes the campaign position, the completed flag or the saved progress. A lost farm fight has no penalty                                                                                                            | Farming must not break the state machine (AD-004)                                               | n          |
| Chapter boss daily limit             | 10 wins per player per UTC day, counted on wins only (a loss or an abandoned fight does not count). The first campaign win counts as one. The counter resets at 00:00 UTC                                                                | User decision (10 per day, reset at 00:00, UTC and wins only)                                   | y          |
| Farm throttle                        | The backend accepts at most one farm win report per player every 5 000 ms (configuration); a faster report is rejected with 409 `FARM_TOO_FAST` and nothing changes                                                                    | The client reports wins, so without a floor a script could roll 1 % thousands of times (AD-002) | n          |
| Entering a farm fight                | A farm menu lists the repeatable bosses (each miniboss by stage, the chapter boss with its wins left today); choosing one fights it in a loop, and the loop leaves when the daily limit is hit                                           | User decision (choose the boss in a menu)                                                       | y          |
| Fusion UI shape                      | The fusion screen lists every (hero, stars 0 to 2) with its copy count; one button per row fuses it when copies ≥ 3. Copies are interchangeable, so the player does not pick individual cards. No confirmation dialog                    | Simplest control that matches the rule                                                          | n          |
| Duplicate and concurrent requests    | A repeated outcome report already gets 409 (no second roll). Fusions of one player run one after another; a fusion that no longer has 3 copies fails with 409                                                                           | No double drops, no negative counts                                                             | n          |
| Atomicity                            | A card grant failure rolls back the outcome it came with; a fusion either applies fully or not at all; an account is never created without its starting card                                                                            | Never lose progress or a card half-way                                                          | n          |
| Data lifecycle                       | Deleting a user deletes the bag, the starting element, the leader, the chapter boss wins and the daily counter                                                                                                                         | Same rule as the wallet                                                                         | n          |
| Observability                        | The backend logs every card drop (player, hero, source), every fusion (player, hero, stars) and every leader change at INFO                                                                                                             | Project rule: services log                                                                      | n          |
| External-dependency failure          | N/A: no dependency beyond the database and the game's own requests; a failed game request shows an error line and play continues                                                                                                        | Nothing new to protect                                                                          | n          |
| Reading the bag                      | The bag loads when a card screen opens and after each fusion; the response to an outcome report updates it locally                                                                                                                      | One source of truth: the backend                                                                | n          |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Choose a starting hero at registration ⭐ MVP

**User Story**: As a new player, I want to pick my starting hero when I create my account so that my story starts with the element I like.

**Why P1**: Every other rule (chapter order, drops, leader) hangs on it.

**Acceptance Criteria**:

1. The backend SHALL store a hero catalog with, per hero, an id, an element, a name, a class, a leader bonus text and three skills (name, type, effect text, cooldown seconds), seeded with the five README heroes and the elements of the assumptions table.  <!-- ubiquitous -->
2. The backend SHALL derive a player's chapter elements from the starting element as the assumptions table defines: chapter 1 the starting element, chapter 2 the element it hits hardest, chapter 3 the remaining one of fire, water and nature, chapter 4 DARKNESS, chapter 5 LIGHT.  <!-- ubiquitous -->
3. WHEN a registration request carries `startingElement` FIRE, WATER or NATURE THEN the backend SHALL create the account, store the starting element, add one 0-star card of that element's hero to the player's bag and set that hero as the leader.  <!-- event-driven -->
4. IF `startingElement` is missing, or is any value other than FIRE, WATER or NATURE THEN the backend SHALL answer 400 `INVALID_STARTING_ELEMENT` and create no account.  <!-- unwanted-behavior -->
5. IF the card or the leader cannot be stored THEN the backend SHALL create no account.  <!-- unwanted-behavior -->
6. WHEN the registration form is shown THEN the game SHALL offer three choices, "Fogo - Kael", "Água - Orina" and "Natureza - Lyra", each with the hero portrait, and send the chosen element with the registration request.  <!-- event-driven -->
7. IF the player submits the registration form with no hero chosen THEN the game SHALL show "Escolha seu herói inicial." and send no request.  <!-- unwanted-behavior -->

**Independent Test**: Register with WATER and read `GET /heroes`: Orina owned with one blank card and leader; her chapter is 1, FIRE's hero is chapter 2 and NATURE's hero is chapter 3. Register with LIGHT and get 400.

---

### P1: Bosses drop hero cards ⭐ MVP

**User Story**: As a player, I want bosses to drop hero cards so that I collect new heroes and level the ones I have.

**Why P1**: Nothing else in the feature has content without cards.

**Acceptance Criteria**:

1. WHEN the backend accepts a `CLEARED` report for a `MINIBOSS` encounter and the roll `r` is below 0.01 THEN the backend SHALL add one 0-star card of the hero of the player's current chapter to the player's bag.  <!-- event-driven -->
2. WHEN the backend accepts a `CLEARED` report for a `MINIBOSS` encounter and the roll `r` is 0.01 or more THEN the backend SHALL add no card.  <!-- event-driven -->
3. WHEN the backend accepts a `CLEARED` report for the `CHAPTER_BOSS` of chapter c below 5 and the player has no earlier win of that chapter boss THEN the backend SHALL add one 0-star card of the hero of chapter c + 1 without rolling.  <!-- event-driven -->
4. WHEN the backend accepts a `CLEARED` report for the `CHAPTER_BOSS` of chapter c below 5 and the player has an earlier win of that chapter boss and the roll `r` is below 0.10 THEN the backend SHALL add one 0-star card of the hero of chapter c + 1.  <!-- event-driven -->
5. WHEN the backend accepts a `CLEARED` report for the `CHAPTER_BOSS` of chapter c below 5 and the player has an earlier win of that chapter boss and the roll `r` is 0.10 or more THEN the backend SHALL add no card.  <!-- event-driven -->
6. WHEN the backend accepts a `CLEARED` report for the `CHAPTER_BOSS` of chapter 5 THEN the backend SHALL apply the rules above with the hero of chapter 5 as the dropped hero.  <!-- event-driven -->
7. WHEN the backend accepts a `CLEARED` report for a `PHASE` encounter or any `FAILED` report THEN the backend SHALL add no card and make no roll.  <!-- event-driven -->
8. WHEN the backend accepts an outcome report THEN the response SHALL carry the card dropped (hero id, hero name and stars 0) or no card.  <!-- event-driven -->
9. IF the backend rejects an outcome report with 409 THEN the backend SHALL make no roll and add no card.  <!-- unwanted-behavior -->
10. IF adding the card fails THEN the backend SHALL roll back the progress change of the same report.  <!-- unwanted-behavior -->
11. WHEN the backend adds a card THEN the backend SHALL log the player, the hero and the source (`MINIBOSS` or `CHAPTER_BOSS`) at INFO.  <!-- event-driven -->

**Independent Test**: A FIRE player with an injected random source of 0.0 reports `CLEARED` on a miniboss and holds 2 blank Kael cards. An injected 0.5 adds nothing. The first chapter 1 boss win with 0.99 adds a blank Lyra card (NATURE is chapter 2).

---

### P1: The bag and fusion rules ⭐ MVP

**User Story**: As a player, I want to see my cards and fuse three of them into a better card so that my heroes grow.

**Why P1**: The reason to collect copies.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `GET /heroes` THEN the backend SHALL answer 200 with every hero of the catalog (id, element, name, class, leader bonus, skills), the hero's chapter for this player (1 to 5), the player's copies per stars 0 to 3 (0 when none), whether the hero is owned, its stars (0 when only blank cards or none are held) and the id of the player's leader.  <!-- event-driven -->
2. The backend SHALL treat a hero as owning skill n for n in 1 to 3 exactly when the hero's stars are n or more.  <!-- ubiquitous -->
3. WHEN an authenticated player calls `POST /heroes/{id}/fuse` with `stars` 0, 1 or 2 and holds 3 or more copies of that hero at that stars THEN the backend SHALL remove 3 copies of that stars, add 1 copy of stars + 1 and answer 200 with the updated hero.  <!-- event-driven -->
4. WHEN a fusion produces a 3-star copy THEN the backend SHALL report the hero with stars 3 and skill 3 unlocked.  <!-- event-driven -->
5. WHEN a fusion succeeds THEN the backend SHALL leave every other copy in the player's bag unchanged.  <!-- event-driven -->
6. IF the player holds fewer than 3 copies at the requested stars THEN the backend SHALL answer 409 `NOT_ENOUGH_CARDS` and change nothing.  <!-- unwanted-behavior -->
7. IF `stars` is missing, below 0 or above 2 THEN the backend SHALL answer 400 `INVALID_FUSION` and change nothing.  <!-- unwanted-behavior -->
8. IF the hero id is not in the catalog THEN the backend SHALL answer 404 `HERO_NOT_FOUND` and change nothing.  <!-- unwanted-behavior -->
9. WHILE two fusions of the same player run at once the backend SHALL apply them one after the other, so no count becomes negative.  <!-- state-driven -->
10. IF a request carries no valid access token THEN the backend SHALL answer 401, and a player SHALL only read and change their own bag.  <!-- unwanted-behavior -->
11. WHEN the backend fuses cards THEN the backend SHALL log the player, the hero and the stars at INFO.  <!-- event-driven -->
12. WHEN a user is deleted THEN the backend SHALL delete that user's bag, starting element, leader and boss wins.  <!-- event-driven -->

**Independent Test**: Give a player 3 blank copies of the starting hero, fuse stars 0 and read `GET /heroes`: 0 blank, 1 one-star, hero stars 1. A second fuse answers 409.

---

### P1: Heroes, Mochila and Fusão screens ⭐ MVP

**User Story**: As a player, I want to browse heroes, see my cards and fuse them in the game so that I can follow my progress.

**Why P1**: Without screens the mechanic is invisible.

**Acceptance Criteria**:

1. WHILE the game screen is shown the game SHALL show "Heróis", "Mochila" and "Fusão" buttons in its HUD, and SHALL NOT place them in the pause menu.  <!-- state-driven -->
2. WHEN the player opens Heróis THEN the game SHALL load `GET /heroes` and show every hero of the catalog with portrait, name, element and stars, owned heroes in colour and heroes not owned in grey.  <!-- event-driven -->
3. WHEN the player clicks a hero in the catalog, owned or not, THEN the game SHALL show its portrait, class, element, leader bonus and its three skills with art, name, type, effect and cooldown, each marked unlocked or locked from the hero's stars.  <!-- event-driven -->
4. WHEN the player opens Mochila THEN the game SHALL list every (hero, stars) pair with at least one copy, with its copy count.  <!-- event-driven -->
5. WHEN the player clicks a bag entry THEN the game SHALL show the hero name, the stars, the copy count, the copies needed to fuse, the hero's three skills with their lock state (locked skills included), and a button that opens Fusão with that entry selected.  <!-- event-driven -->
6. WHEN the player opens Fusão THEN the game SHALL list every (hero, stars 0 to 2) pair with its copy count out of 3, and enable that row's "Fundir" button only when the count is 3 or more.  <!-- event-driven -->
7. WHEN the player presses an enabled "Fundir" button THEN the game SHALL call the fuse request, update the screen from the response and show the resulting card.  <!-- event-driven -->
8. IF a screen request fails THEN the game SHALL show an error line in Portuguese on that screen, keep the screen open and leave the bag unchanged.  <!-- unwanted-behavior -->
9. WHILE any of these screens is open the game SHALL pause play as the pause menu does.  <!-- state-driven -->
10. WHEN an outcome response carries a dropped card THEN the game SHALL show the notice "Carta: <hero name>" for 3 s.  <!-- event-driven -->
11. The game SHALL render these screens as DOM elements with stable test ids.  <!-- ubiquitous -->

**Independent Test**: In the browser against the fake backend, open Heróis (one in colour, four grey), click a grey hero and read three locked skills; open Fusão with 3 blank copies and press "Fundir".

---

### P2: Leader and skill bar

**User Story**: As a player, I want to choose my leader and see its skills on the combat screen so that I know what my hero can do.

**Why P2**: The user wants skills visible in combat; execution follows in `hero-combat`.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `PUT /leader` with the id of an owned hero THEN the backend SHALL store it as the player's only leader and answer 200 with the leader.  <!-- event-driven -->
2. IF the hero is not owned THEN the backend SHALL answer 409 `HERO_NOT_OWNED` and keep the leader unchanged.  <!-- unwanted-behavior -->
3. IF the hero id is not in the catalog THEN the backend SHALL answer 404 `HERO_NOT_FOUND` and keep the leader unchanged.  <!-- unwanted-behavior -->
4. WHEN the player presses the "Líder" HUD button THEN the game SHALL list the owned heroes, mark the current leader and call `PUT /leader` when another one is picked.  <!-- event-driven -->
5. WHILE the combat screen is shown the game SHALL show three skill slots with the leader's skill art, name and cooldown seconds, dimming every slot above the leader's stars with a lock mark.  <!-- state-driven -->
6. WHEN the player clicks or presses a skill slot THEN the game SHALL leave the fight unchanged.  <!-- event-driven -->
7. WHEN a fusion or a drop changes the leader's stars THEN the game SHALL update the lock marks without reloading the scene.  <!-- event-driven -->
8. WHEN the leader changes THEN the game SHALL replace the three slots with the new leader's skills.  <!-- event-driven -->

**Independent Test**: Own Kael with 0 stars: the bar shows three locked slots. Fuse to 1 star and slot 1 lights up. Own Lyra as well, pick her as leader, and the bar shows her skills.

---

### P2: Fight defeated bosses again (farm) with a daily chapter boss limit

**User Story**: As a player, I want to fight bosses I already beat so that I can keep chasing cards.

**Why P2**: Without it the 10 % chapter boss drop is unreachable and the 1 % miniboss drop has only 10 rolls; it needs the new server rules and a menu on top of the P1 drop rules.

**Acceptance Criteria**:

1. WHEN an authenticated player asks for the farm state THEN the backend SHALL answer with the bosses the player may fight again (the miniboss of every stage passed, and the chapter boss once the campaign is completed) and the chapter boss wins left today (10 minus today's wins, never below 0).  <!-- event-driven -->
2. WHEN the backend accepts a farm `CLEARED` report for a boss the player may fight again THEN the backend SHALL roll the same rate and drop the same hero as the campaign drop for that boss kind and add one 0-star card on success, and answer with the card or none.  <!-- event-driven -->
3. WHEN the backend accepts a farm `CLEARED` report for the chapter boss THEN the backend SHALL add 1 to the player's wins of the current UTC day.  <!-- event-driven -->
4. WHEN the backend accepts a farm report of any outcome THEN the backend SHALL leave the campaign position and the completed flag unchanged.  <!-- event-driven -->
5. IF a farm `FAILED` report arrives THEN the backend SHALL answer 200, roll nothing and not change the daily wins.  <!-- unwanted-behavior -->
6. IF a farm `CLEARED` report for the chapter boss arrives when today's wins are already 10 THEN the backend SHALL answer 409 `DAILY_LIMIT_REACHED`, roll nothing and change nothing.  <!-- unwanted-behavior -->
7. WHEN the UTC date changes THEN the backend SHALL count the player's chapter boss wins from 0 for the new date.  <!-- event-driven -->
8. WHEN the campaign chapter boss is cleared THEN the backend SHALL count it as one chapter boss win of the current UTC day.  <!-- event-driven -->
9. IF a farm report names a boss the player has not beaten yet THEN the backend SHALL answer 409 `BOSS_NOT_AVAILABLE` and change nothing.  <!-- unwanted-behavior -->
10. IF a farm `CLEARED` report arrives less than 5 000 ms after the player's previous accepted farm win THEN the backend SHALL answer 409 `FARM_TOO_FAST` and change nothing.  <!-- unwanted-behavior -->
11. WHEN the player presses the "Rever chefes" HUD button THEN the game SHALL list the repeatable bosses by name and, for the chapter boss, the wins left today.  <!-- event-driven -->
12. WHEN the player picks a boss in "Rever chefes" THEN the game SHALL fight it with the same health, stats and time limit as in the campaign, and start it again after each fight.  <!-- event-driven -->
13. WHEN the chapter boss wins left today reach 0 THEN the game SHALL leave the loop and show the "Rever chefes" list with 0 wins left.  <!-- event-driven -->
14. The game SHALL show the HUD label "Rever chefe" with the boss name during a farm fight and SHALL NOT change the saved campaign position.  <!-- ubiquitous -->

**Independent Test**: With a completed campaign, win the chapter boss 10 times through the farm: the 11th report answers 409 and the list shows 0 left; after the UTC date changes the count is 10 again.

---

## Edge Cases

- WHEN a player has 4 blank copies and fuses once THEN the backend SHALL leave 1 blank and 1 one-star copy.
- WHEN a hero is owned with only blank copies THEN the game SHALL show it in colour with 0 stars and all three skills locked.
- IF `GET /heroes` fails when Heróis opens THEN the game SHALL show the error line and no hero grid.
- WHEN two tabs fuse the same copies THEN the second backend call answers 409 and the second tab reloads its bag on the next open.
- WHEN a drop and a daily limit rejection come from different reports THEN each report SHALL be judged on its own.
- WHEN the chapter 1 boss of a FIRE player is won for the first time THEN the player SHALL receive a blank Lyra card, and the leader stays unchanged.

---

## Technical Debt

| ID     | Debt                                                                                                                                                                                                                                  | Resolve when                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| TD-001 | Text that already exists is in English: the main menu and the sign-in and registration forms, the pause menu ("Paused", "Continue", "Leave fight" and its confirmation), the farm toggle, the wallet ("Gold", "Silver", "Copper"), the stage and phase HUD labels, the enemy line, the boss timer, the completion message and the matching e2e assertions. The game has no translation layer | A dedicated translation task, after this feature |

---

## Requirement Traceability

| Requirement ID | Story                                                | Phase  | Status  |
| -------------- | ---------------------------------------------------- | ------ | ------- |
| CHAR-01        | P1: Choose a starting hero at registration           | -      | Pending |
| CHAR-02        | P1: Choose a starting hero at registration           | -      | Pending |
| CHAR-03        | P1: Choose a starting hero at registration           | -      | Pending |
| CHAR-04        | P1: Bosses drop hero cards                           | -      | Pending |
| CHAR-05        | P1: Bosses drop hero cards                           | -      | Pending |
| CHAR-06        | P1: The bag and fusion rules                         | -      | Pending |
| CHAR-07        | P1: The bag and fusion rules                         | -      | Pending |
| CHAR-08        | P1: Heroes, Mochila and Fusão screens                | -      | Pending |
| CHAR-09        | P1: Heroes, Mochila and Fusão screens                | -      | Pending |
| CHAR-10        | P2: Leader and skill bar                             | -      | Pending |
| CHAR-11        | P2: Fight defeated bosses again (farm)               | -      | Pending |
| CHAR-12        | P2: Fight defeated bosses again (farm)               | -      | Pending |

CHAR-01 hero catalog, seed and chapter order; CHAR-02 registration with a starting hero; CHAR-03 registration form choice; CHAR-04 drop rolls and the first-win guarantee; CHAR-05 drop response, atomicity and logging; CHAR-06 bag read and skill unlock; CHAR-07 fusion; CHAR-08 catalog and detail screens; CHAR-09 bag and fusion screens and the drop notice; CHAR-10 leader choice and skill bar; CHAR-11 farm state, drops, daily limit and throttle; CHAR-12 farm menu and loop.

**Coverage:** 12 total, 0 mapped to tasks, 12 unmapped ⚠️

---

## Success Criteria

- [ ] With a fixed random source, every drop rate boundary (0.01, 0.10, first win) has a passing backend test, and the chapter order has a unit test for FIRE, NATURE and WATER starts.
- [ ] The five README heroes appear in the catalog with their skills and art.
- [ ] A new player can collect 27 blank copies in the fake backend and fuse up to a 3-star hero with all three skills unlocked, by e2e.
- [ ] The existing campaign, elements, wallet and e2e suites pass unchanged, apart from the registration form gaining the hero choice.
