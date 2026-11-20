# Black Awareness Staff (Cajado da Consciência Negra) Specification

## Problem Statement

November 20 is Dia da Consciência Negra in Brazil. The owner wants to honour it with a commemorative legendary weapon, the Cajado da Consciência Negra (art already in the repository: `game/public/assets/staff_black_awares_day.png`, untracked). Every account that enters the game on any November 20 (America/Sao_Paulo) receives one staff, once per account ever. The staff is a normal legendary weapon (rolled, refined, rerolled and sold like any other) plus one fixed special effect: +200 % damage against DARKNESS enemies (3 times the normal damage). The feature must ship on 2026-11-20, the event day, so the scope is kept to the gift, the effect and its display.

## Goals

- [ ] Every account that starts the game on a November 20 (America/Sao_Paulo) finds exactly one Cajado da Consciência Negra in its bag, and sees a notice saying so.
- [ ] While a hero wears the staff, every strike of that hero against a DARKNESS monster deals 3 times the damage it deals without the staff.
- [ ] The staff is recognisable on every equipment screen: own icon, own name, and the special line in the tooltip and the detail.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| A dedicated event screen, banner, countdown or modal | Event day delivery; the existing notice slot plus the equipment red dot carry the news (D9) |
| Other event gifts or a generic gift catalog/admin | Only one gift exists; the table and endpoint are generic enough to add one later (D4) |
| Showing the special in the Equipamento attribute panel (`leaderStats`) or in the compare lines of the tooltip (`▲`/`▼`) | Keeps the change to the piece views; the special line on the piece is enough to read the effect (D14) |
| Resizing or re-cutting the 2048x2048 art (black background, 3.2 MB) | No image tool in the repo today (no ImageMagick, no PIL); the file loads lazily only where a staff tile shows. A 256 px copy is a follow-up for the `ui-artist` (D12) |
| Protecting the staff from the bulk sale or from a single sale | Owner: "it can be refined, rerolled and sold like any legendary" (D11) |
| A server-side check of the damage | Damage is computed in the browser (AD-002, AD-009) |
| Granting the staff to accounts that did not enter on a November 20 | Owner rule: only accounts that enter on November 20 |
| Translating existing English texts (`Welcome back, ...`) | TD-001 |

---

## Assumptions & Open Questions

Rows `y` were decided by the owner before the spec (relayed by the orchestrator on 2026-11-20). Rows `n (Q<n>)` are product-owner defaults waiting for the owner's answer to the question below the table.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 What the staff is | A piece with slot `WEAPON`, rarity `LEGENDARY`, refine 0, its base click and its 4 affixes rolled exactly like a legendary weapon dropped by a boss (base click 10 to 12, 4 distinct affix types among the 5 weapon types, each value in the legendary band of `AffixType`), plus the field `special = BLACK_AWARENESS_STAFF` | Owner decision | y |
| D2 Special effect | Fixed +200 % damage against a monster whose element is `DARKNESS`: a strike against DARKNESS is multiplied by 3. It is not an affix: it is not in `affixes`, a reroll never offers it or removes it, a refine never changes it | Owner decision | y |
| D3 Who receives it | Every account whose game start (see D5) happens while the date in `America/Sao_Paulo` is November 20, of any year; once per account ever (an account that received it in 2026 receives nothing in 2027). The backend clock decides, never the browser | Owner decision | y |
| D4 How the backend records it | A new table `player_gifts` (one row per account and gift id, unique) and a new nullable column `equipment_pieces.special`, both added by `V14__black_awareness_staff.sql`, expand only (AD-016). The gift id is `BLACK_AWARENESS_STAFF` | The unique row makes "never two" hold under retries and concurrent tabs; the column keeps the special across refine, reroll, equip and a rollback to the previous backend (which neither reads nor writes it) | n (Q6) |
| D5 What "logs in" means | The game calls `POST /gifts/claim` once every time the battle scene (`ClickerGame`) starts: after a login, after a new registration, and after a stored session is restored. A player who never closes the game across midnight receives it on the next start | A player with a stored session (AD-001) never sees the login form; the battle start is the one moment every player passes through | n (Q1) |
| D6 Bag full | The staff is always stored, even when the bag already holds 100 or more pieces (the bag reads 101/100). It is never sold on arrival | The existing drop rule (sell when full) would make the gift vanish into copper on the event day; the gift happens once per account, so the overflow is bounded to one piece. Later drops into a full bag keep being sold as today | n (Q2) |
| D7 Scope of the effect | The effect belongs to the hero wearing the staff. Leader wearing it: every leader strike (manual click, auto click, every skill hit, the delayed aimed shot, every damage-over-time tick). Ally wearing it (`hero-team`): that ally's hits. A staff in the bag, or worn by another hero, gives nothing to the leader | The weapon feeds the attacker of its wearer only (`attackerFor`, `allyAttacker`); every one of these strikes goes through `calculateDamage` | n (Q3) |
| D8 How it stacks | The x3 multiplies the final damage of the strike together with every other factor: element, defense, critical, boss damage, Bênção, Prisão, combo, and Luz Divina's own x1.5 against DARKNESS (Luz Divina with the staff deals 4.5 times against DARKNESS) | One multiplicative factor is the simplest rule to read and to test | n (Q3) |
| D9 Notice | When the claim answers `granted: true`, the notice slot shows `Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!` for 6 000 ms (a drop notice shows 3 000 ms) and the red dot of the Equipamento button turns on, as for a dropped piece | Re-uses the existing notice and badge; 6 s because it appears while the scene is still loading | n (Q4) |
| D10 Names and texts | Title of the piece: `Cajado da Consciência Negra +<refine>` (replaces `Lendário Arma +<refine>`, also in the tile `aria-label`). Special line: `Especial: +200% de dano contra Escuridão`, the last line of the tooltip and of the detail. `Escuridão` is the existing label of DARKNESS (`ELEMENT_LABELS`) | AD-007 Portuguese; the element word must match what the enemy line shows | n (Q4) |
| D11 Sale | The staff sells for the price of any legendary weapon (`100 x 5 x (2 + refine) / 2` copper: 500 at +0), alone or in the bulk sale (it is selected by `Lendário`). Once sold it never comes back (D3) | Owner decision ("can be sold") | y |
| D12 Icon | The tile shows `game/public/assets/staff_black_awares_day.png` (the file as it is) instead of `slot-weapon.png`, at 52x52 px inside the 60x60 tile, corners 10 px, so its black background reads as the event frame; the gold legendary frame and 4 gems stay | No resize tool today; the black square is deliberate and checked by the `ui-artist` | n (Q5) |
| D13 Unknown special | IF the backend sends a `special` value the game does not know THEN the game shows and treats the piece as a normal piece of its rarity and slot (no name, no line, no effect) | A newer backend must not break an older Worker | n (Q6) |
| D14 Attribute panel | The Equipamento attribute panel and the tooltip compare lines do not mention the special | Scope cut for the event day | n (Q5) |
| D15 Failure of the claim | IF `POST /gifts/claim` fails (network, 5xx, 401) THEN the game shows nothing and plays on; the next start claims again. IF the server granted but the answer was lost THEN the staff is in the bag at the next equipment load with no notice | The gift is never lost; only the notice can be | n (Q6) |
| D16 Account reset and deletion | An account reset keeps the staff and the grant (AD-015 keeps equipment). Deleting the account deletes both (cascade); a new account with the same name is a new account and may receive it | Follows the existing lifecycle | n (Q6) |
| D17 Decision record | AD-028 in `STATE.md` (proposed): a gift is a new, non-boss piece source, may overflow the bag by one, and a piece may carry one fixed special | Extends AD-009 (pieces only from boss reports) and the bag capacity rule | n (Q6) |

**Open questions** (each has a recommended default; the spec is written with it):

- Q1 (D5) The staff is granted when the battle starts on November 20 (login, registration or a remembered session), not only after typing the password. Recommended: yes.
- Q2 (D6) If the bag is full, the staff still goes into it (101/100) instead of being sold. Recommended: yes.
- Q3 (D7, D8) The x3 applies to every strike of the hero wearing it (click, auto click, skills, aimed shot, damage over time; an ally wearing it gets it on its hits) and multiplies with every other bonus, including Luz Divina (4.5x). Recommended: yes.
- Q4 (D9, D10) Texts: notice `Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!` for 6 s; title `Cajado da Consciência Negra +N`; line `Especial: +200% de dano contra Escuridão`. Recommended: yes.
- Q5 (D12, D14) Use the art as it is (black square inside the gold frame) today, and leave the attribute panel and compare lines unchanged. Recommended: yes.
- Q6 (D4, D13, D15, D16, D17) Storage, failure and lifecycle rules as stated, recorded as AD-028. Recommended: yes.

---

## User Stories

### P1: Receive the staff on November 20 ⭐ MVP

**User Story**: As a player, I want to receive the Cajado da Consciência Negra when I enter the game on November 20, so that I take part in the commemoration.

**Why P1**: The whole event.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `POST /gifts/claim` while the date in `America/Sao_Paulo` is November 20 and the account has no `player_gifts` row for `BLACK_AWARENESS_STAFF` THEN the backend SHALL store one new piece of that player with slot `WEAPON`, rarity `LEGENDARY`, refine 0, no hero, special `BLACK_AWARENESS_STAFF`, a base click from 10 to 12 and 4 affixes of distinct types among `CRIT_CHANCE`, `CRIT_DAMAGE_PCT`, `BOSS_DAMAGE_PCT`, `BOSS_TIME_SECONDS`, `ARMOR_PIERCE_PCT` with values in their legendary bands, store one `player_gifts` row, and answer 200 `{ "granted": true, "gift": "BLACK_AWARENESS_STAFF", "piece": <piece> }`.  <!-- event-driven -->
2. WHEN the chance roller returns 0.5 for every roll THEN the granted staff SHALL have base click 11, `clickDamage` 11.0 and the affixes, in order, `BOSS_DAMAGE_PCT` 28, `BOSS_TIME_SECONDS` 6, `CRIT_DAMAGE_PCT` 55, `ARMOR_PIERCE_PCT` 28, and `sellPrice` 500.  <!-- event-driven -->
3. IF the account already has the `player_gifts` row for `BLACK_AWARENESS_STAFF` THEN `POST /gifts/claim` SHALL answer 200 `{ "granted": false }` and store nothing, on the same day and on any later November 20.  <!-- unwanted-behavior -->
4. IF the date in `America/Sao_Paulo` is not November 20 THEN `POST /gifts/claim` SHALL answer 200 `{ "granted": false }` and store nothing.  <!-- unwanted-behavior -->
5. WHEN the backend clock reads `2026-11-20T03:00:00Z` (00:00 in Sao Paulo) or `2026-11-21T02:59:59Z` (23:59:59 on the 20th in Sao Paulo) THEN the gift day rule SHALL be true; WHEN it reads `2026-11-20T02:59:59Z` or `2026-11-21T03:00:00Z` THEN it SHALL be false.  <!-- event-driven -->
6. WHILE the bag of the player holds 100 or more pieces, WHEN the claim grants the staff THEN the backend SHALL store it (the bag then holds one more piece than before) and SHALL NOT sell it.  <!-- complex -->
7. WHEN two `POST /gifts/claim` requests of the same account run at the same time on November 20 THEN exactly one SHALL answer `granted: true` and the account SHALL hold exactly one piece with special `BLACK_AWARENESS_STAFF`.  <!-- event-driven -->
8. IF `POST /gifts/claim` carries no valid access token THEN the backend SHALL answer 401 and store nothing.  <!-- unwanted-behavior -->
9. WHEN the battle scene starts THEN the game SHALL call `POST /gifts/claim` exactly once.  <!-- event-driven -->
10. WHEN the claim answers `granted: true` THEN the game SHALL show the notice `Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!` for 6000 ms, add the piece to the equipment list without another request, and show the red dot of the Equipamento button.  <!-- event-driven -->
11. IF the claim answers `granted: false` or fails THEN the game SHALL show no gift notice and the battle SHALL keep running.  <!-- unwanted-behavior -->

**Independent Test**: With the backend clock on 2026-11-20, log in: the notice shows, the Equipamento screen lists the staff; log in again: no notice and still one staff.

---

### P1: Triple damage against Darkness ⭐ MVP

**User Story**: As a player, I want the staff to hit DARKNESS enemies three times as hard, so that the gift matters in combat.

**Why P1**: The effect is what makes the weapon special.

**Acceptance Criteria**:

1. WHILE the leader wears the staff, a manual click on a DARKNESS monster SHALL deal 3 times the damage the same click deals with the same attacker numbers and no special: attacker base damage 10, element FIRE, critical chance 0, against `{ element: DARKNESS, defense: 0, critResistance: 0 }` deals 27 (10 x 0.9 x 3) instead of 9.  <!-- state-driven -->
2. WHILE the leader wears the staff, a click on a monster of any element other than DARKNESS SHALL deal the same damage as without the special: base damage 10, FIRE, against WATER deals 5.  <!-- state-driven -->
3. WHILE the leader wears the staff, a skill hit against DARKNESS SHALL be multiplied by 3: base damage 10, FIRE, 600 % deals 162 (10 x 6 x 0.9 x 3).  <!-- state-driven -->
4. WHILE the leader wears the staff, a damage-over-time tick against DARKNESS SHALL be multiplied by 3: base damage 10, FIRE, 150 % deals 40.5 (10 x 1.5 x 0.9 x 3).  <!-- state-driven -->
5. WHILE the leader wears the staff, Luz Divina (800 %, its own x1.5 against DARKNESS) SHALL deal, with base damage 10 and element LIGHT against DARKNESS, 10 x 8 x 0.9 x 1.5 x 3 = 324.  <!-- state-driven -->
6. WHILE the leader wears the staff, the auto click and the delayed aimed shot SHALL be multiplied by 3 against DARKNESS like the manual click and the skill hit (they use the same leader attacker).  <!-- state-driven -->
7. WHILE an ally wears the staff, its attacker SHALL carry the +200 % against DARKNESS: an ally of 0 stars wearing a staff of `clickDamage` 10, leader element FIRE, hits a DARKNESS monster with defense 0 for (1 + 10) x 2 x 0.9 x 3 = 59.4.  <!-- state-driven -->
8. IF the staff sits in the bag, or is worn by a hero other than the leader, THEN the leader's strikes SHALL get no DARKNESS bonus.  <!-- unwanted-behavior -->
9. The attacker built for a hero wearing the staff SHALL carry `darknessDamagePct: 200`; an attacker built from pieces with no special SHALL have no `darknessDamagePct` field, so every attacker object pinned by an existing test stays equal.  <!-- ubiquitous -->
10. On the battle scene, the leader Vex (3 stars, base damage (1 + 10) x 1.4 = 15.4) wearing a staff of `clickDamage` 10 SHALL take a DARKNESS monster of defense 0 from 1000 to 953.8 health with one click (46.2), and Golpe Sangrento SHALL deal 277.2 at once and 69.3 per bleed tick.  <!-- state-driven -->

**Independent Test**: Equip the staff on Vex at 3 stars against a DARKNESS monster of defense 0: one click takes 46.2; with a plain legendary weapon of the same click damage it takes 15.4.

---

### P1: See the staff

**User Story**: As a player, I want to recognise the staff and read its effect, so that I know what I received.

**Why P1**: The owner asked for a distinct look, name and effect line.

**Acceptance Criteria**:

1. WHEN a piece with special `BLACK_AWARENESS_STAFF` is drawn as a tile THEN the tile SHALL show the image `assets/staff_black_awares_day.png` (not `assets/slot-weapon.png`), carry `data-special="BLACK_AWARENESS_STAFF"`, keep `data-rarity="LEGENDARY"` and `data-gems="4"`, and have the `aria-label` `Cajado da Consciência Negra +<refine>`.  <!-- event-driven -->
2. WHEN the tooltip or the detail of the staff shows THEN its title SHALL read `Cajado da Consciência Negra +<refine>` (`+0`, `+3`).  <!-- event-driven -->
3. WHEN the tooltip or the detail of the staff shows THEN its lines SHALL be `Dano de clique: <clickDamage with 1 decimal>`, one line per affix in the order of `affixes`, then `Especial: +200% de dano contra Escuridão` as the last line.  <!-- event-driven -->
4. WHEN the staff is refined or one of its affixes is rerolled THEN the answered piece SHALL still carry `special: "BLACK_AWARENESS_STAFF"` and 4 affixes, and the special line SHALL still show.  <!-- event-driven -->
5. The special SHALL never appear in `affixes`, so the reroll buttons of the detail list exactly the 4 affixes.  <!-- ubiquitous -->
6. WHEN the staff is sold (alone or in the bulk sale) THEN the wallet SHALL receive its `sellPrice` (500 copper at +0) and the piece SHALL leave the list, like any legendary weapon.  <!-- event-driven -->
7. IF a piece carries a `special` value the game does not know THEN the game SHALL show it with the normal title `<Raridade> <Slot> +<refine>`, the slot icon, no special line and no damage bonus.  <!-- unwanted-behavior -->

**Independent Test**: Open Equipamento with the staff in the bag: the tile shows the staff art; hovering shows the name and the special line; refine it and the line stays.

---

## Edge Cases

- WHEN the claim is made at 23:59:59 on November 20 in Sao Paulo (`2026-11-21T02:59:59Z`) THEN the staff SHALL be granted (P1 Receive AC 5).
- WHEN an account that received the staff in 2026 claims on 2027-11-20 THEN the answer SHALL be `granted: false` (P1 Receive AC 3).
- IF the user of the token no longer exists THEN `POST /gifts/claim` SHALL answer 404 `USER_NOT_FOUND` like `GET /equipment`.
- WHEN an account reset runs after the grant THEN the staff and the `player_gifts` row SHALL stay (no second grant).
- WHEN the previous backend (no `special` mapping) refines or sells the staff after `V14` ran THEN the column SHALL keep its value on refine (the old entity does not write it) and the row SHALL go on sale; nothing fails (AD-016).
- IF the staff is equipped on a hero and the claim is somehow repeated THEN nothing changes (P1 Receive AC 3).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BAS-01 | P1 Receive: AC 1, AC 2 (staff roll and grant) | Tasks | Implementing |
| BAS-02 | P1 Receive: AC 3 (once per account ever) | Tasks | Pending |
| BAS-03 | P1 Receive: AC 4, AC 5 (gift day in Sao Paulo, boundaries) | Tasks | Pending |
| BAS-04 | P1 Receive: AC 6 (bag full overflow) | Tasks | Pending |
| BAS-05 | P1 Receive: AC 7 (concurrency) | Tasks | Pending |
| BAS-06 | P1 Receive: AC 8, edge 404 (auth) | Tasks | Pending |
| BAS-07 | P1 Receive: AC 9, AC 10, AC 11 (game claim and notice) | Tasks | Pending |
| BAS-08 | P1 Damage: AC 1, AC 2, AC 9 (click, non-DARKNESS, attacker field) | Tasks | Implementing |
| BAS-09 | P1 Damage: AC 3, AC 4, AC 5, AC 6 (skill hit, tick, Luz Divina, auto click, aimed shot) | Tasks | Pending |
| BAS-10 | P1 Damage: AC 7 (ally) | Tasks | Pending |
| BAS-11 | P1 Damage: AC 8 (bag or other hero gives nothing) | Tasks | Implementing |
| BAS-12 | P1 Damage: AC 10 (battle scene numbers) | Tasks | Pending |
| BAS-13 | P1 See: AC 1 (tile) | Tasks | Implementing |
| BAS-14 | P1 See: AC 2, AC 3 (title, lines) | Tasks | Implementing |
| BAS-15 | P1 See: AC 4, AC 5 (special survives refine and reroll; not an affix) | Tasks | Implementing |
| BAS-16 | P1 See: AC 6 (sale) | Tasks | Pending |
| BAS-17 | P1 See: AC 7 (unknown special) | Tasks | Implementing |

**Coverage:** 17 total, 17 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] On 2026-11-20 every player who starts the game receives one staff and sees the notice; a second start shows no notice and the bag still holds one staff.
- [ ] Zero accounts hold two pieces with `special = BLACK_AWARENESS_STAFF` (`select username, count(*) from equipment_pieces where special = 'BLACK_AWARENESS_STAFF' group by username having count(*) > 1` returns no row).
- [ ] With the staff equipped, a click on a DARKNESS monster deals 3 times the click on the same monster without it.
