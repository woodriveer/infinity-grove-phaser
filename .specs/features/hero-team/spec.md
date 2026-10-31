# Hero Team Specification

## Problem Statement

Only the leader fights. By the time a player reaches chapter 5 they own all five heroes (each chapter boss releases the hero of the next chapter, AD-006, so the chapter 4 boss releases the fifth), but the other four are only cards for fusion. The owner wants teams of 5 heroes, the leader plus 4 allies. Allies hit on their own with a new damage type, "dano de equipe", which monsters resist with a new attribute, "resistência a dano de equipe". Their damage grows as they get stronger, and each ally brings a passive while it is in the team. Elemental damage always comes from the leader. The team works only while the campaign is at chapter 5 or later. Ally slots are bought with gold, one more opening per chapter boss from chapter 5 to chapter 8. The allies stand on the field and visibly attack. This is the "team later" that `characters` deferred ("one active leader now, team later; the leader is stored as a single value"); the change is proposed as AD-018 in `.specs/STATE.md`.

This is one of three features split from the owner's request of 2026-10-30 (see Feature Split). The owner answered Q1 to Q25 on 2026-10-30 and Q26 to Q44 on 2026-10-31.

## Feature Split

| Order (Q26) | Feature | Spec | Delivers | Depends on |
| --- | --- | --- | --- | --- |
| 1 | `campaign-chapters` | `.specs/features/campaign-chapters/spec.md` | Chapters 6 to 15, health x2 per chapter, health in bigint, reset reward growing with the chapter, K/M/B number format | Nothing |
| 2 | `hero-team` | `.specs/features/hero-team/spec.md` | Team active from chapter 5, slots bought with gold (opened by the chapter 5 to 8 bosses), team damage type and resistance, ally passives, the Equipe screen, allies on the field | Feature 1: slots 2 to 4 open on the chapter 6, 7 and 8 bosses |
| 3 | `miniboss-adds` | `.specs/features/miniboss-adds/spec.md` | From chapter 11, minibosses come with adds that raise the miniboss defense; target choice; damage skills hit every enemy | Feature 1 (chapters 11+); feature 2 (allies hit the target) |

The owner confirmed this order (Q26, 2026-10-31): slots 2 to 4 open on the chapter 6 to 8 bosses, which only `campaign-chapters` creates. `campaign-chapters` also raises the coin drops so the slot prices are reachable (its Coin Drops section).

## Facts From the Code (not decisions)

- `player_cards.cleared_chapters` holds the chapters whose boss the player has won (`BossRecord.hasWon`). The account reset does not touch `player_cards` (AD-015), so every boss win stays recorded after any reset.
- Each hero already has its own 4 equipment slots (`equipment`), and the Equipamento screen equips any owned hero.
- The leader is `player_cards.leader_id`, changed by `PUT /leader`, read in `GET /heroes` as `leaderId`.
- The combat scene draws the leader as `hero_<id>` (`assets/heroes/<id>_sprite.png`, loaded for all five heroes in `Preloader.js:42`) at `CHARACTER = { x: 230, y: 612, height: 320 }` with origin (0.5, 1) (`ClickerGame.js:22`). The sprites are 102 to 125 px wide and 300 px tall, except `kael_sprite.png`, which is 300 x 279. Kael as leader is therefore about 344 px wide on screen.
- The enemy attributes live in `enemies` (element, physical defense, magical defense, critical resistance; unique on those four columns, `V1__schema.sql`) and reach the game in the progress payload per encounter.
- 1 ouro = 100 prata = 10 000 cobre (`formatCopper`, `equipment.js:77`). The coin drops of `campaign-chapters` (Coin Drops) pay about 12 090 cobre over a first run of chapters 1 to 5 and about 99 450 over chapters 1 to 8. A normal first run therefore affords slot 1 when it opens and all four slots (10 ouro) around the chapter 8 boss.
- Top-left HUD boxes: the element wheel at (108, 224), 204 x 206 px (x 6 to 210, y 121 to 327); the auto click box at (366, 200), 260 x 160 px (x 236 to 496, y 120 to 280); the battle bar at (512, 686), 124 px high (top at y 624). The `miniboss-adds` column (Q38) spans x 425 to 535 and y 298 to 602.
- Combat runs in the browser (AD-002). The fight keeps running behind hero screens and in a hidden tab, and only the pause menu freezes it (`background-fight`).

## Goals

- [ ] A player who has won the chapter 5 boss can buy up to 4 ally slots with gold, each opened by the first win of the chapter 5, 6, 7 or 8 boss, and fill them with owned heroes. The server stores all of it.
- [ ] While the campaign is at chapter 5 or later, every ally hits the target once per second with the formula of Ally Damage (team damage type, leader's element, monster's team resistance).
- [ ] Each of the five heroes has a passive that applies while it is a fighting ally (Passive Table).
- [ ] The allies stand on the field and visibly attack on each hit.
- [ ] A player who has never won the chapter 5 boss, or whose campaign is below chapter 5, plays exactly as today.

## Out of Scope

| Feature | Reason |
| --- | --- |
| New heroes beyond the five of the catalog | Content feature; the team works with any catalog size |
| Ally skills on the skill bar | Owner decision (Q10): only the leader's skills are usable |
| The other four leader bonuses (Kael, Orina, Seraphine, Vex) | Owner decision (Q11): a separate feature |
| Chapters 6 and above | Feature `campaign-chapters` |
| Add monsters, choosing a target among several monsters | Feature `miniboss-adds` (allies hit the target it defines) |
| Anything that lowers team resistance (talent, skill, passive) | Default of Q34: none for now |
| Hero levels, Seiva, upgrading an ally with coins | Not asked; an ally gets stronger through stars and equipment |
| Selling back a bought slot, several saved teams | Not asked |
| New art or a rigged animation for allies | Default of Q36: the existing standing sprites; `kael_rig.*` is not used |
| Server-side check of ally damage | AD-002 |
| Translating existing English text | TD-001 (AD-007) |

---

## Team Slots

Proposed (Q27 to Q30). Slot 0 is always the leader. Ally slots 1 to 4 are bought in order with copper from the wallet.

| Ally slot | Opens for purchase on the player's first win of | Price (Q28) |
| --- | --- | --- |
| 1 | chapter 5 boss | 1 ouro (10 000 cobre) |
| 2 | chapter 6 boss | 2 ouro (20 000 cobre) |
| 3 | chapter 7 boss | 3 ouro (30 000 cobre) |
| 4 | chapter 8 boss | 4 ouro (40 000 cobre) |

- A slot is **open** once the player has ever won its boss (`cleared_chapters`), so an open slot stays open after a reset.
- A slot is **bought** once paid. Bought slots stay bought after a reset (Q30).
- A bought slot is empty until the player puts a hero in it.
- The team is **unlocked** once slot 1 is open (first chapter 5 boss win). The team is **active** (allies fight, passives apply) while the campaign chapter is 5 or later, or the campaign is completed (Q2).

## Ally Damage

Owner decisions Q5 and Q7. Default of Q34 for what else applies.

- **Ally Base** = `(1 + ally weapon click damage, refined) x (1 + ally CLICK_DAMAGE_PCT from its own worn pieces / 100)`.
- **Star multiplier** by the ally's stars: 0 stars **2**, 1 star **4**, 2 stars **6**, 3 stars **8**; 4, 5 and 6 stars **10**, **12** and **14** once `hero-ascension` lets heroes pass 3 stars (AD-020, pending owner approval).
- **Ally hit** = `Ally Base x star multiplier x element multiplier (leader's element against the monster's) x (1 - monster team resistance / 100) x boss factor x team factor`, where:
  - boss factor = `1 + ally BOSS_DAMAGE_PCT / 100` on a miniboss or chapter boss, else 1;
  - team factor = 1.25 while Seraphine is a fighting ally, else 1.
- The damage type is **TEAM** (`dano de equipe`). It ignores physical and magical defense, critical resistance, armor pierce, the defense break talents, Brado Aterrador, Prisão de Espinhos, Bênção da Grande Árvore, Ventos Ligeiros, Bomba de Fumaça, the combo, the leader's star bonus and power talents, and the Orina and Vex passives. It is never critical.
- **Rhythm**: all fighting allies hit together once every 1000 ms of fight time. The first hit lands 1000 ms after a monster appears. Allies hit in slot order 1 to 4, and if one hit kills the monster, the later slots of that tick do not land.
- **Shown damage per second** of an ally (Equipe screen) is `Ally Base x star multiplier x team factor`, before element, resistance and boss factor, in the number format of `campaign-chapters`.
- Decimal results are compared with a tolerance of 1e-9 (L-012).

Worked examples (the leader is Kael, FIRE):

| Case | Hit |
| --- | --- |
| Lyra 0 stars, no pieces, FIRE monster, team resistance 0 | 1 x 2 x 1.0 x 1 = **2** |
| Lyra 0 stars, no pieces, FIRE monster with physical defense 90 and team resistance 0 | **2** (physical defense does not apply) |
| Orina 3 stars, weapon 10 click damage at +0, ring +20 % click damage, NATURE monster, team resistance 50 | 13.2 x 8 x 2.0 x 0.5 = **105.6** |
| Lyra 0 stars wearing an amulet of +20 % boss damage, FIRE miniboss, team resistance 10 | 1 x 2 x 1.0 x 0.9 x 1.2 = **2.16** |
| Lyra 0 stars and Seraphine 0 stars, FIRE monster, team resistance 0 | 2.5 + 2.5 = **5** per tick |

## Team Resistance

Proposed (Q33). A new enemy attribute from 0 to 90, stored with the other enemy attributes and sent in the progress payload as `teamResistance` for the phase monster and miniboss of every stage and for the chapter boss.

| Enemy | Chapters 1 to 4 | Chapter c from 5 to 15 |
| --- | --- | --- |
| Phase monster | 0 | 0 |
| Miniboss | 0 | `10 + 3 x (c - 5)`: chapter 5 is 10, chapter 10 is 25, chapter 15 is 40 |
| Chapter boss | 0 | `20 + 3 x (c - 5)`: chapter 5 is 20, chapter 10 is 35, chapter 15 is 50 |
| Miniboss add (`miniboss-adds`) | - | 0 |

Chapters 1 to 4 get 0 because the team never fights there (Q2).

## Passive Table

Owner decision Q9. A passive applies while its hero sits in a bought ally slot and the team is active, in every fight (campaign and farm), and never while that hero is the leader. Values are fixed and do not depend on stars.

| Hero | Passive name (screen text) | Effect | Screen text of the effect |
| --- | --- | --- | --- |
| Kael | Guarda do Baluarte | +5 s on the time limit of every miniboss and chapter boss, adding to the talent and equipment seconds | `+5 s no tempo dos chefes` |
| Lyra | Olho do Falcão | +10 points of critical chance on the leader's clicks and skill hits, capped at 100 | `+10 de chance de crítico` |
| Orina | Erosão Arcana | Every monster has 15 points less magical defense for the leader's hits, floored at 0 | `-15 de defesa mágica dos inimigos` |
| Vex | Lâminas Sombrias | Every monster has 15 points less physical defense for the leader's hits, floored at 0 | `-15 de defesa física dos inimigos` |
| Seraphine | Graça da Aurora | x1.25 on every ally hit (team factor) | `+25% de dano da equipe` |

## Allies on the Field

Owner decisions Q36 (attack formation) and Q37 (attack motion). The leader stands at the tip of a wedge that points at the monster, and the allies spread out behind it, two above and two below. Each sprite is sized from a fit box: it is scaled by `min(box width / texture width, box height / texture height)` and keeps its aspect ratio, so Kael's wide texture (300 x 279) cannot push into its neighbours.

| Who | Fit box | Bottom centre (origin 0.5, 1) | Depth |
| --- | --- | --- | --- |
| Leader, while at least one ally is drawn | 180 x 240 px | (320, 600) | front |
| Ally slot 1 (upper inner) | 90 x 120 px | (180, 460) | behind the leader |
| Ally slot 2 (lower inner) | 90 x 120 px | (180, 605) | behind the leader |
| Ally slot 3 (upper outer) | 90 x 120 px | (75, 450) | behind slots 1 and 2 |
| Ally slot 4 (lower outer) | 90 x 120 px | (75, 615) | behind slots 1 and 2 |
| Leader, while no ally is drawn | unchanged: 320 px high | unchanged: (230, 612) | unchanged |

Worst-case boxes, checked against the screen:

- Leader as Kael: 180 x 167, x 230 to 410, y 433 to 600. Leader as Lyra: 82 x 240, x 279 to 361, y 360 to 600.
- Ally slot 1: x 135 to 225, y 340 to 460. Slot 2: x 135 to 225, y 485 to 605. Slot 3: x 30 to 120, y 330 to 450. Slot 4: x 30 to 120, y 495 to 615.
- No standing box overlaps another box, the leader, the element wheel (bottom y 327), the auto click box (x 236 or more, bottom y 280), the battle bar (top y 624) or the adds column (x 425 or more).

Motion and gates:

- Every ally hit that lands moves its sprite 24 px toward the monster and back over 200 ms in total (100 ms out, 100 ms back). During that motion it may pass behind the leader, which is drawn in front.
- One light-blue number `#7fd4ff` at 28 px in the damage font shows the sum of the tick, at the monster centre x + 70.
- No ally is drawn while the team is inactive, while its slot is empty or before the heroes load. With no ally drawn, the leader goes back to its usual size and place.

---

## Assumptions & Open Questions

Rows `Q1` to `Q13` carry the owner's answers of 2026-10-30. Rows `Q26` and later are new questions raised by those answers, with the recommended default. The owner answers them before Design.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** Split | Three features `campaign-chapters`, `hero-team`, `miniboss-adds` | Owner accepted the split; the order is reopened by Q26 | y |
| **Q2** When the team works | Only while the campaign chapter is 5 or later, or the campaign is completed. After a reset to chapter 1 the allies do not fight until the player is back at chapter 5 | Owner answer (not permanent) | y |
| **Q2a** Accounts that already beat chapter 5 | Slot 1 is open at once on release, from their `cleared_chapters` | Owner answer | y |
| **Q3** Composition and storage | Leader plus up to 4 distinct owned heroes (0 stars included), stored by the backend, kept by the reset | Owner answer | y |
| **Q4** Team at the unlock | Only the leader. Ally slots are bought one at a time as they open (Team Slots) | Owner answer (changed from auto-fill) | y |
| **Q5** Ally damage formula | 1 hit per second, Ally Base x star multiplier (2, 4, 6, 8), never critical, no combo, element of the leader | Owner answer | y |
| **Q6** Ally equipment | Replaced by Q34 (armor pierce and the defenses no longer reach ally hits) | Q7 changed the damage type | replaced by Q34 |
| **Q7** Damage type | A new type TEAM (`dano de equipe`), resisted only by a new enemy attribute `teamResistance` (`resistência a dano de equipe`) added by an expand/contract migration (AD-016) | Owner answer | y |
| **Q8** Skills and talents on ally hits | Replaced by Q34 | Q7 changed the damage type | replaced by Q34 |
| **Q9** Passives | Passive Table | Owner answer | y |
| **Q10** Ally skills | Not usable; only the leader's 3 skills | Owner answer | y |
| **Q11** The other four leader bonuses | A separate feature | Owner answer | y |
| **Q12** Screen and combat UI | HUD button `Equipe` hidden until the team is unlocked. A locked or unbought slot is a transparent square with one gold coin (`assets/coin-gold.png`) and its price. In combat, the allies stand on the field and attack every second (Allies on the Field). The ally damage number is light blue | Owner answer (slot squares and field allies changed) | y |
| **Q13** Unlock toast | None; feedback comes from buying a slot (Q32) | Owner answer | y |
| **Q26** Order of the three features | `campaign-chapters` first, then `hero-team`, then `miniboss-adds` | Owner answer 2026-10-31 | y |
| **Q27** When a slot opens | Slot n opens on the player's first win of the chapter 4 + n boss (5, 6, 7, 8), read from `cleared_chapters`, so it stays open after a reset | Owner answer 2026-10-31 | y |
| **Q28** Slot prices | 1, 2, 3 and 4 ouro (10 000, 20 000, 30 000, 40 000 cobre), 10 ouro in total. The coin drops rise in `campaign-chapters` (Coin Drops), so a normal first run has about 1 ouro when slot 1 opens and about 10 ouro by the chapter 8 boss | Owner answer 2026-10-31: keep the prices, raise the drops | y |
| **Q29** Buying order and content | Slots are bought in order (1 before 2), and a bought slot starts empty | Owner answer 2026-10-31 | y |
| **Q30** Slots after a reset | Bought slots and the heroes in them are kept; they fight again once the campaign reaches chapter 5 | Owner answer 2026-10-31 | y |
| **Q31** Equipe button after a reset | Stays visible below chapter 5 (to manage and buy), the panel shows `A equipe luta a partir do capítulo 5.`, and no ally is drawn on the field | Owner answer 2026-10-31 | y |
| **Q32** Purchase flow and feedback | A click on a buyable slot opens a dialog `Comprar a vaga <n> por <p> ouro?` with `Comprar` and `Cancelar`. On success the slot flashes gold (400 ms), the notice `Vaga de aliado comprada!` shows for 3 s, the wallet updates, and the new empty slot is selected, ready for a hero. A slot not yet open shows its coin and price at 50 % opacity with `Chefe do capítulo <4+n>` | Owner answer 2026-10-31 | y |
| **Q33** Team resistance values | Team Resistance table: 0 in chapters 1 to 4 and on phase monsters and adds; from chapter 5, miniboss `10 + 3(c-5)` and chapter boss `20 + 3(c-5)` | Allies stay strong on phases and lose some damage on bosses, growing with the chapter like the defenses | default (owner did not object) |
| **Q34** What applies to ally damage | Applies: the leader's element, team resistance, the ally's weapon, `CLICK_DAMAGE_PCT` and `BOSS_DAMAGE_PCT`, Seraphine x1.25. Does not apply: armor pierce, the ally's critical affixes, every defense break talent, Brado, Prisão, Bênção, Ventos, Fumaça, the Orina and Vex passives, the combo. Nothing lowers team resistance for now | Q7: the team type uses only its own resistance | default (owner did not object) |
| **Q35** Adds and team resistance | Adds raise only the miniboss's physical and magical defense, never its team resistance, so allies ignore the add buff | The owner described physical and magical buffs; it makes the team a counter to adds | default (owner did not object) |
| **Q36** Ally art and place | Attack formation (Allies on the Field). While allies are drawn, the leader sits at the tip of a wedge, fitted in 180 x 240 px at (320, 600). Allies are fitted in 90 x 120 px at (180, 460), (180, 605), (75, 450) and (75, 615) for slots 1 to 4, behind the leader. Sprites are `assets/heroes/<id>_sprite.png`; `kael_rig.*` is not used | Owner answer 2026-10-31: leader in front, allies spread behind it above and below like an attack formation; positions checked against the leader, the HUD and the adds column | y |
| **Q37** Attack animation | Each ally hit that lands moves the sprite 24 px toward the monster and back in 200 ms, plus the summed light-blue number | Owner answer 2026-10-31 | y |
| Leader change with a team | `PUT /leader` with a hero in ally slot n swaps them: the old leader takes slot n | A hero is never both leader and ally | n |
| Contract | `GET /heroes` gains `teamUnlocked` (boolean), `openSlots` (0 to 4), `boughtSlots` (0 to 4), `slotPrices` (4 integers in copper) and `allies` (exactly 4 entries, hero id or `null`, slot order). `PUT /team` `{ "allies": [4 entries] }` stores the allies. `POST /team/slots` `{ "fromSlots": int }` buys the next slot | New fields keep the old game working (expand, AD-016); `fromSlots` makes a double click buy once (AD-011 pattern); the game types no price (AD-011) | n |
| Errors | `PUT /team`: 409 `TEAM_LOCKED`, 409 `TEAM_SLOT_NOT_BOUGHT`, 409 `HERO_NOT_OWNED`, 404 `HERO_NOT_FOUND`, 400 `INVALID_TEAM`. `POST /team/slots`: 409 `TEAM_SLOT_LOCKED`, 409 `TEAM_SLOTS_MAX`, 409 `NOT_ENOUGH_COPPER`, 409 `TEAM_SLOT_MISMATCH` (body: the stored team fields), 400 `INVALID_TEAM_SLOT_REQUEST` | Same families as talents and auto click (L-038, L-055) | n |
| Locks | Team saves and slot purchases take the `player_cards` row lock, then `wallets` for a purchase (lock order `progress`, `player_cards`, `wallets`) | Serialises with `PUT /leader`, card drops and refines | n |
| Storage and migrations | New tables or columns for the bought slots and the allies, plus `team_resistance` on `enemies`, all added by expand migrations (AD-016). Design must replace the 4-column unique key of `enemies` without breaking the running backend | The old backend ignores new tables and reads `enemies` without the new column | n |
| Failure on the screen | A failed save or purchase shows `Não foi possível salvar a equipe.` or `Não foi possível comprar a vaga.` and reloads the heroes from the backend | The server is the truth | n |
| Heroes not loaded | No ally hits, no passives, no allies drawn until `GET /heroes` answers | Same rule as the leader | n |
| Observability (convention, not an AC) | The backend logs each team save and slot purchase (username, slots, allies, price) at INFO and each refusal (username, code) at WARN | L-007 | n |
| Implicit dimensions | Input bounds: Contract and Errors. Failure states: Failure on the screen. Idempotency: whole-team PUT, `fromSlots` on purchase. Auth: 401 without a token, own team only. Concurrency: Locks. Data lifecycle: team rows cascade with the user and survive the reset. Observability: convention above. External dependency: N/A because only the database is involved. State transitions: a slot goes not open, open, bought, never back; the team is active only at chapter 5+ | Complex-scope sweep | n |

**Open questions:** none. Q6 and Q8 are replaced by Q34. Q33 to Q35 hold the default because the owner did not object (2026-10-31).

---

## User Stories

### P1: Team and slots on the backend ⭐ MVP

**User Story**: As a player who beat chapter 5, I want my bought slots and allies stored on the server so that they survive reloads, devices and resets.

**Why P1**: Every other story reads the team, the slots and the unlock from here.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `GET /heroes` THEN the backend SHALL also answer `teamUnlocked` (true when the won chapter bosses include 5), `openSlots` (how many of the chapter 5, 6, 7 and 8 bosses the player has won), `boughtSlots`, `slotPrices` `[10000, 20000, 30000, 40000]` and `allies` (4 entries, hero id or `null`).  <!-- event-driven -->
2. WHEN a player with no bought slot calls `GET /heroes` THEN the backend SHALL answer `boughtSlots` 0 and `allies` `[null, null, null, null]`.  <!-- event-driven -->
3. WHEN a player with `boughtSlots` b below `openSlots` and enough copper calls `POST /team/slots` with `fromSlots` b THEN the backend SHALL take `slotPrices[b]` copper from the wallet, store b + 1 bought slots and answer 200 with the team fields of AC 1 and the wallet.  <!-- event-driven -->
4. IF `fromSlots` differs from the stored `boughtSlots` THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOT_MISMATCH` with the stored team fields and change nothing.  <!-- unwanted-behavior -->
5. IF `boughtSlots` equals `openSlots` and is below 4 THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOT_LOCKED` and change nothing.  <!-- unwanted-behavior -->
6. IF `boughtSlots` is 4 THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOTS_MAX` and change nothing.  <!-- unwanted-behavior -->
7. IF the wallet holds less copper than the price THEN `POST /team/slots` SHALL answer 409 `NOT_ENOUGH_COPPER` and change nothing.  <!-- unwanted-behavior -->
8. IF `fromSlots` is missing, not an integer or negative THEN `POST /team/slots` SHALL answer 400 `INVALID_TEAM_SLOT_REQUEST`.  <!-- unwanted-behavior -->
9. WHEN two `POST /team/slots` with the same `fromSlots` arrive together THEN the backend SHALL apply exactly one and answer the other 409 `TEAM_SLOT_MISMATCH`.  <!-- event-driven -->
10. WHEN an authenticated player with an unlocked team calls `PUT /team` with 4 entries, each an owned hero id or `null`, no id twice, none equal to the leader and `null` at every index from `boughtSlots` on THEN the backend SHALL store them and answer 200 with `{ "leaderId": string, "allies": [4 entries] }`.  <!-- event-driven -->
11. WHEN the same `PUT /team` body is sent twice THEN the backend SHALL answer 200 both times with the same stored team.  <!-- event-driven -->
12. IF the team is not unlocked THEN `PUT /team` SHALL answer 409 `TEAM_LOCKED` and store nothing.  <!-- unwanted-behavior -->
13. IF a hero id sits at an index of `allies` equal to or above `boughtSlots` THEN `PUT /team` SHALL answer 409 `TEAM_SLOT_NOT_BOUGHT` and store nothing.  <!-- unwanted-behavior -->
14. IF an entry names a hero the player does not own THEN `PUT /team` SHALL answer 409 `HERO_NOT_OWNED`, and IF it names an id outside the catalog THEN 404 `HERO_NOT_FOUND`, storing nothing in both cases.  <!-- unwanted-behavior -->
15. IF `allies` is missing, does not have exactly 4 entries, holds an entry that is neither a string nor `null`, names a hero twice or names the leader THEN `PUT /team` SHALL answer 400 `INVALID_TEAM` and store nothing.  <!-- unwanted-behavior -->
16. WHEN a player with an unlocked team calls `PUT /leader` with the hero of ally slot n THEN the backend SHALL make it the leader and put the previous leader in slot n.  <!-- event-driven -->
17. WHEN an account reset is applied THEN the backend SHALL keep `teamUnlocked`, `openSlots`, `boughtSlots` and `allies`.  <!-- event-driven -->
18. WHILE two team saves of the same player run at once the backend SHALL apply them one after the other, so the stored team equals one of the two bodies.  <!-- state-driven -->
19. IF a team request carries no valid access token THEN the backend SHALL answer 401, and a player SHALL only read and change their own team.  <!-- unwanted-behavior -->
20. WHEN a user is deleted THEN the backend SHALL delete that user's slots and allies.  <!-- event-driven -->

**Independent Test**: A backend integration test gives a player the chapter 5 boss win and 15 000 copper: `openSlots` 1, `boughtSlots` 0. A purchase with `fromSlots` 0 answers `boughtSlots` 1 and 5 000 copper; a second one answers 409 `TEAM_SLOT_LOCKED`. `PUT /team` `["lyra", null, null, null]` answers 200; `["lyra", "orina", null, null]` answers 409 `TEAM_SLOT_NOT_BOUGHT`. After a reset the same fields come back.

---

### P1: Team damage type and resistance ⭐ MVP

**User Story**: As the game owner, I want a team damage type with its own enemy resistance so that allies are balanced apart from the leader's physical and magical damage.

**Why P1**: The ally hit formula reads this attribute.

**Acceptance Criteria**:

1. The backend SHALL store a team resistance from 0 to 90 for every enemy, and refuse to save a value outside that range.  <!-- ubiquitous -->
2. WHEN the backend answers a progress THEN it SHALL carry `teamResistance` for the phase monster and the miniboss of every stage and for the chapter boss.  <!-- event-driven -->
3. WHEN the migration runs on an existing database THEN every enemy SHALL get the value of the Team Resistance table for the encounters that use it, and every other enemy 0.  <!-- event-driven -->
4. WHEN the backend seeds chapter 10 THEN its miniboss team resistance SHALL be 25 and its chapter boss team resistance 35.  <!-- event-driven -->
5. WHILE the migration has run and the previous backend version still serves requests, the previous backend SHALL keep answering progress and outcome reports (AD-016).  <!-- state-driven -->
6. IF a progress payload carries a `teamResistance` outside 0 to 90 or not a number THEN the game SHALL fail the progress load and spawn no monster, as for an unknown element.  <!-- unwanted-behavior -->

**Independent Test**: Start the backend on an empty database and read `GET /progress` at chapter 5: the stage 1 miniboss answers `teamResistance` 10, the chapter boss 20, the phase monster 0.

---

### P1: Allies fight ⭐ MVP

**User Story**: As a player at chapter 5 or later, I want my allies to hit on their own so that my damage grows as they get stronger.

**Why P1**: It is the reason to have a team.

**Acceptance Criteria**:

1. WHILE the team is active, at least one bought slot holds a hero, a living monster is on screen and the pause menu is closed, the game SHALL land one hit of every ally each time 1000 ms of fight time pass, the first 1000 ms after the monster appears.  <!-- state-driven -->
2. WHEN an ally hit lands THEN the game SHALL deal `Ally Base x star multiplier x element multiplier of the leader's element x (1 - teamResistance / 100) x boss factor x team factor`, with no critical roll.  <!-- event-driven -->
3. WHEN Lyra with 0 stars and no pieces is an ally of a FIRE leader against a FIRE monster with team resistance 0 THEN the game SHALL deal 2 per tick, whatever the monster's physical defense.  <!-- event-driven -->
4. WHEN Orina with 3 stars, a weapon of 10 click damage at +0 and a ring of +20 % click damage is an ally of a FIRE leader against a NATURE monster with team resistance 50 THEN the game SHALL deal 105.6 per tick.  <!-- event-driven -->
5. WHEN Lyra with 0 stars and an amulet of +20 % boss damage is an ally of a FIRE leader against a FIRE miniboss with team resistance 10 THEN the game SHALL deal 2.16 per tick.  <!-- event-driven -->
6. WHILE a defense break talent, Brado Aterrador, Prisão de Espinhos, Bênção da Grande Árvore, Ventos Ligeiros, Bomba de Fumaça, the combo, or the Orina or Vex passive applies, the game SHALL leave ally hits unchanged.  <!-- state-driven -->
7. WHEN the leader changes THEN the game SHALL use the new leader's element on the next ally hit.  <!-- event-driven -->
8. WHEN an ally fuses to more stars or equips a piece THEN the game SHALL use the new values on the next ally hit.  <!-- event-driven -->
9. WHEN an ally hit brings the monster to 0 health THEN the game SHALL handle the kill exactly as a click kill (coins, campaign report or farm win) and SHALL NOT land the hits of the later slots of that tick.  <!-- event-driven -->
10. WHEN an ally tick lands THEN the game SHALL show one number with the sum of that tick's damage in color `#7fd4ff` at 28 px in the damage font, at the monster centre x + 70.  <!-- event-driven -->
11. WHEN an ally hit lands THEN the game SHALL leave the combo streak and its timer unchanged.  <!-- event-driven -->
12. WHILE the campaign chapter is below 5 and the campaign is not completed, the game SHALL land no ally hit and apply no passive.  <!-- state-driven -->
13. WHILE a hero screen is open or the tab is hidden the game SHALL keep landing ally hits as the fight runs (`background-fight`).  <!-- state-driven -->

**Independent Test**: In the browser against the fake backend at chapter 5 with slot 1 bought, Kael (FIRE) as leader and Lyra 0 stars in slot 1, a FIRE phase monster of 10 health with team resistance 0 reads 8 health and a light-blue `2` after 1 s with no click. After a stubbed reset to chapter 1, a monster takes no damage for 3 s.

---

### P1: Equipe screen and slot purchase ⭐ MVP

**User Story**: As a player, I want to buy slots and choose my allies in one screen so that I build the team I want.

**Why P1**: Without it the player cannot buy slots or see the team.

**Acceptance Criteria**:

1. WHILE the team is unlocked the game SHALL show an 8th HUD button labelled `Equipe` (`data-testid="hud-team"`) with a Lucide `swords` icon at the size and stroke of the other HUD icons, and WHILE it is not unlocked the game SHALL hide it.  <!-- state-driven -->
2. WHEN the player opens Equipe THEN the game SHALL show a panel titled `Equipe` with 5 slot cards of 132 x 190 px in a row (`data-testid="team-slot-0"` to `team-slot-4`): slot 0 labelled `Líder` with a gold border `#e8b64c`, slots 1 to 4 labelled `Aliado 1` to `Aliado 4`.  <!-- event-driven -->
3. WHEN a slot holds a hero THEN its card SHALL show the portrait (`assets/heroes/<id>_position.jpg`, 96 x 96 px), the name and `<stars>★`; an ally card SHALL also show `Dano: <n>/s` and `<passive name>: <passive text>`, and the leader card its leader bonus text.  <!-- event-driven -->
4. WHEN a bought slot is empty THEN its card SHALL be dashed with the text `vazio` (`data-state="empty"`).  <!-- event-driven -->
5. WHEN a slot is open and not bought, and it is the next slot to buy, THEN its card SHALL be a transparent square with one gold coin (`assets/coin-gold.png`, 32 x 32 px) and the price in ouro (`1`, `2`, `3` or `4`) (`data-state="buyable"`).  <!-- event-driven -->
6. WHEN a slot is not open THEN its card SHALL show the same coin and price at 50 % opacity with `Chefe do capítulo <4+n>` (`data-state="locked"`) and take no click; WHEN a slot is open but an earlier slot is not bought THEN it SHALL show the coin and price at 50 % opacity with no chapter text and take no click.  <!-- event-driven -->
7. WHEN the player clicks a buyable slot THEN the game SHALL open a dialog `Comprar a vaga <n> por <p> ouro?` with `Comprar` and `Cancelar`, and `Comprar` SHALL be disabled with `Moedas insuficientes` when the wallet holds less than the price.  <!-- event-driven -->
8. WHEN the player presses `Comprar` THEN the game SHALL send `POST /team/slots` with the bought count it shows and disable `Comprar` until the answer.  <!-- event-driven -->
9. WHEN the purchase answers 200 THEN the game SHALL close the dialog, flash the slot gold for 400 ms, show the notice `Vaga de aliado comprada!` for 3 s, show the answered wallet, and show the new slot empty and selected (`data-selected="true"`).  <!-- event-driven -->
10. WHEN the player presses `Cancelar` THEN the game SHALL close the dialog and send no request.  <!-- event-driven -->
11. WHEN the player opens Equipe THEN the game SHALL list the owned heroes outside the team under `Heróis disponíveis` (portrait 64 x 64 px, name, stars, passive name, `data-testid="team-available-<id>"`), or `Todos os heróis estão na equipe.` when there is none.  <!-- event-driven -->
12. WHEN the player clicks an available hero while a bought slot is empty THEN the game SHALL put it in the selected empty slot, or else the first empty bought slot, and send `PUT /team`.  <!-- event-driven -->
13. WHEN the player clicks a filled ally card THEN the game SHALL select it, and WHEN the player then clicks an available hero THEN the game SHALL replace that slot's hero and send `PUT /team`.  <!-- event-driven -->
14. WHEN the player presses `Remover` on an ally card THEN the game SHALL empty that slot and send `PUT /team`; WHEN the player presses `Tornar líder` THEN the game SHALL send `PUT /leader` with that hero and show the swapped team from the answer.  <!-- event-driven -->
15. WHILE a team, leader or purchase request runs the game SHALL disable every button and hero click of the panel.  <!-- state-driven -->
16. WHEN the player opens Equipe THEN the game SHALL show `Dano da equipe: <n>/s` with the sum of the allies' shown damage per second.  <!-- event-driven -->
17. WHILE the campaign chapter is below 5 and the campaign is not completed, the panel SHALL show `A equipe luta a partir do capítulo 5.`  <!-- state-driven -->
18. IF a save or leader request fails THEN the game SHALL show `Não foi possível salvar a equipe.`, and IF a purchase fails THEN `Não foi possível comprar a vaga.`, keep the panel open and reload the heroes from the backend.  <!-- unwanted-behavior -->
19. WHEN the first win of the chapter 5, 6, 7 or 8 boss is answered THEN the game SHALL show the matching slot as buyable the next time Equipe opens, and show the `Equipe` button after the chapter 5 win without a reload.  <!-- event-driven -->

**Independent Test**: In the browser against the fake backend with the chapter 5 boss won and 1 ouro, open Equipe: `Líder` holds the leader, `Aliado 1` shows the coin and `1`, `Aliado 2` to `Aliado 4` show `Chefe do capítulo 6` to `8`. Buy slot 1 and read `Vaga de aliado comprada!` and `vazio`; click Lyra and read her in `Aliado 1`.

---

### P2: Ally passives

**User Story**: As a player, I want each ally to bring its own passive so that the composition changes how I beat bosses.

**Why P2**: The damage of P1 already makes the team useful; passives add the strategy.

**Acceptance Criteria**:

1. WHILE Kael is a fighting ally the game SHALL add 5 s to the time limit of every miniboss and chapter boss, on top of the talent and equipment seconds.  <!-- state-driven -->
2. WHEN a miniboss of 30 s appears with Kael as a fighting ally and `MINIBOSS_TIME` at level 2 THEN the game SHALL start its countdown at 39 s.  <!-- event-driven -->
3. WHILE Lyra is a fighting ally the game SHALL add 10 points to the critical chance of the leader's clicks and skill hits, capped at 100.  <!-- state-driven -->
4. WHEN a leader with critical chance 10 clicks a monster with critical resistance 0 and `random() * 100` is 15 THEN the game SHALL deal a critical hit with Lyra as a fighting ally and a normal hit without her.  <!-- event-driven -->
5. WHILE Orina is a fighting ally the game SHALL lower the magical defense of every monster by 15 points for the leader's hits, never below 0.  <!-- state-driven -->
6. WHILE Vex is a fighting ally the game SHALL lower the physical defense of every monster by 15 points for the leader's hits, never below 0.  <!-- state-driven -->
7. WHEN the leader hits a monster with physical defense 40 with Vex as a fighting ally THEN the game SHALL compute PHYSICAL damage with physical defense 25, and with physical defense 10 it SHALL use 0.  <!-- event-driven -->
8. WHILE Seraphine is a fighting ally the game SHALL multiply every ally hit by 1.25.  <!-- state-driven -->
9. WHEN Lyra 0 stars and Seraphine 0 stars are the allies of a FIRE leader against a FIRE monster with team resistance 0 THEN the game SHALL deal 5 per tick.  <!-- event-driven -->
10. WHILE a hero is the leader the game SHALL NOT apply that hero's passive.  <!-- state-driven -->
11. WHILE the team is inactive (campaign below chapter 5, not completed) the game SHALL apply no passive.  <!-- state-driven -->
12. WHEN the team changes THEN the game SHALL apply the new allies' passives to the next hit and the next boss that appears; a countdown already running SHALL keep its time.  <!-- event-driven -->

**Independent Test**: Unit tests pin each passive with the numbers above; an e2e test with Kael as a fighting ally reads a miniboss countdown starting at `35`.

---

### P2: Allies on the field

**User Story**: As a player, I want to see my allies fight next to my leader so that the team feels alive.

**Why P2**: The damage works without it; the owner wants it visible.

**Acceptance Criteria**:

1. WHILE the team is active and the heroes are loaded, the game SHALL draw every hero of a bought, filled ally slot with its sprite `hero_<id>` fitted in a 90 x 120 px box, origin (0.5, 1), behind the leader, at (180, 460), (180, 605), (75, 450) or (75, 615) for slots 1 to 4.  <!-- state-driven -->
2. WHILE at least one ally is drawn the game SHALL draw the leader fitted in a 180 x 240 px box at (320, 600), and WHILE no ally is drawn it SHALL draw the leader 320 px high at (230, 612) as today.  <!-- state-driven -->
3. WHEN Kael is drawn in an ally slot THEN his sprite SHALL measure 90 x 83.7 px (scale 0.3), and WHEN Lyra is drawn there THEN 40.8 x 120 px (scale 0.4).  <!-- event-driven -->
4. WHEN an ally hit lands THEN the game SHALL move that ally's sprite 24 px toward the monster in 100 ms and back in 100 ms.  <!-- event-driven -->
5. WHEN a slot's hero changes, is removed or becomes the leader THEN the game SHALL redraw the allies and the leader without reloading the scene.  <!-- event-driven -->
6. WHILE the team is inactive, a slot is empty or the heroes have not loaded, the game SHALL draw no sprite for that slot.  <!-- state-driven -->
7. The ally sprites SHALL take no input: a click on one reaches the canvas exactly as if the sprite were not there.  <!-- ubiquitous -->

**Independent Test**: At chapter 5 with Lyra in slot 1 and Seraphine in slot 2, the leader stands at (320, 600) and two sprites stand at (180, 460) and (180, 605), each moving on every tick. After `Remover` on both, the leader is back at (230, 612), 320 px high.

---

## Edge Cases

- WHEN a player resets before ever winning the chapter 5 boss THEN `teamUnlocked` SHALL stay false and the `Equipe` button hidden.
- WHEN a player with bought slots resets THEN the allies SHALL NOT fight in chapters 1 to 4 and SHALL fight again from chapter 5 stage 1 phase 1.
- WHEN a player stands in chapter 5 before winning its boss for the first time THEN the team SHALL be active with no bought slot, so nothing changes.
- WHEN the team holds 0 allies THEN the game SHALL land no ally hit, apply no passive and draw no ally.
- WHEN the chapter is complete and no monster is on screen THEN the game SHALL land no ally hit.
- WHEN the monster dies between two ticks THEN the time toward the next tick SHALL start again at 0 for the next monster.
- WHEN the pause menu stays open 10 s THEN no ally hit SHALL land, and the first hit after closing it SHALL come after the time still missing from the 1000 ms (L-026).
- WHEN a farm fight runs while the campaign is at chapter 5 or later THEN ally hits and passives SHALL apply as in the campaign.
- WHEN `PUT /leader` names the current leader THEN the team SHALL stay unchanged.
- WHEN a hero added to the catalog later is owned THEN it SHALL NOT enter a saved team on its own.
- IF ally kills come faster than the kill allowance THEN the wallet SHALL drop their coins as for clicks (AD-002, unchanged).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TEAM-01 | P1: Team and slots on the backend - AC 1, 2 (read) | - | Pending |
| TEAM-02 | P1: Team and slots on the backend - AC 3 to 9 (slot purchase) | - | Pending |
| TEAM-03 | P1: Team and slots on the backend - AC 10 to 15, 18 (team save) | - | Pending |
| TEAM-04 | P1: Team and slots on the backend - AC 16, 17, 19, 20 (leader swap, reset, auth, deletion) | - | Pending |
| TEAM-05 | P1: Team damage type and resistance - AC 1 to 6 | - | Pending |
| TEAM-06 | P1: Allies fight - AC 2 to 8 (formula and sources) | - | Pending |
| TEAM-07 | P1: Allies fight - AC 1, 9, 11, 12, 13 (rhythm, kill, gates) | - | Pending |
| TEAM-08 | P1: Allies fight - AC 10 (damage number) | - | Pending |
| TEAM-09 | P1: Equipe screen - AC 1 to 6, 11 to 19 (screen, team editing) | - | Pending |
| TEAM-10 | P1: Equipe screen - AC 7 to 10 (purchase dialog and feedback) | - | Pending |
| TEAM-11 | P2: Ally passives - AC 1 to 12 | - | Pending |
| TEAM-12 | P2: Allies on the field - AC 1 to 7 | - | Pending |

**Coverage:** 12 total, 0 mapped to tasks (Design starts after `campaign-chapters` ships, Q26), 12 unmapped

---

## Success Criteria

- [ ] A player below chapter 5, or who never beat the chapter 5 boss, sees no change in combat.
- [ ] Unit tests pin the star multipliers, the five worked examples of Ally Damage, the Team Resistance table and each passive with exact numbers.
- [ ] An e2e test buys slot 1 against the fake backend, places an ally, and reads the ally's damage and its sprite moving.
- [ ] A backend integration test proves slots and allies survive a reset and a double purchase pays once.
