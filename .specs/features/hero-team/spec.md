# Hero Team Specification

## Problem Statement

Only the leader fights. By the time a player reaches chapter 5 they own all five heroes (each chapter boss releases the hero of the next chapter, AD-006, so the chapter 4 boss releases the fifth), but the other four are only cards for fusion. The owner wants teams of 5 heroes, the leader plus 4 allies. Allies hit on their own once a second, their damage grows with their stars and equipment, and each ally brings a passive while it is in the team. Elemental damage always comes from the leader. The team works only while the campaign is at chapter 5 or later. Ally slots are bought with gold, one more opening per chapter boss from chapter 5 to chapter 8. The allies stand on the field and visibly attack. This is the "team later" that `characters` deferred ("one active leader now, team later; the leader is stored as a single value"), recorded as AD-018 in `.specs/STATE.md`.

This is one of three features split from the owner's request of 2026-10-30 (see Feature Split). The owner answered Q1 to Q25 on 2026-10-30 and Q26 to Q44 on 2026-10-31.

**Revision of 2026-11-19.** The owner ordered `unified-damage` (released as v0.5.0 on 2026-11-19), then `hero-team`, then `miniboss-adds`. Owner answer Q2 of `unified-damage` (its D14, AD-021): there is one damage everywhere. Allies deal the same damage as every other strike and meet the same `defense`; the TEAM damage type, the enemy attribute `team_resistance`, its migration and the change of the `enemies` unique key are dropped. This revision rewrites Q7, Q34, Q35, TEAM-05 and the passives Erosão Arcana and Lâminas Sombrias (both lowered a defense that is now one), re-checks every fact against `main` at `7de3208` (after `campaign-chapters`, `hero-ascension`, `boss-replay-chapters`, `hero-bag-cards`, `bulk-sell`, `game-version` and `unified-damage`), and adds the exact screen layout and texts. Two new questions (Q45, Q46) go to the owner; design and tasks use their recommended defaults.

## Feature Split

| Order (Q26) | Feature | Spec | Delivers | Status |
| --- | --- | --- | --- | --- |
| 1 | `campaign-chapters` | `.specs/features/campaign-chapters/spec.md` | Chapters 6 to 15, health x2 per chapter, 64-bit health, reset reward growing with the chapter, K/M/B number format, coin drops raised | Shipped (AD-019) |
| - | `unified-damage` | `.specs/features/unified-damage/spec.md` | One damage, one enemy `defense` | Shipped as v0.5.0 (AD-021) |
| 2 | `hero-team` | this file | Team active from chapter 5, slots bought with gold (opened by the chapter 5 to 8 bosses), ally hits with the one damage, ally passives, the Equipe screen, allies on the field | This revision |
| 3 | `miniboss-adds` | `.specs/features/miniboss-adds/spec.md` | From chapter 11, minibosses come with adds that raise the miniboss defense; target choice; damage skills hit every enemy | Not started; allies hit the target it defines (see Consistency With `miniboss-adds`) |

## Facts From the Code (not decisions)

Re-checked on `main` at `7de3208` (2026-11-19).

- `player_cards.cleared_chapters` holds the chapters whose boss the player has won (`BossRecord.hasWon`, `backend/.../domain/BossRecord.kt`). The account reset does not touch `player_cards` (`AccountResetService.reset` resets progress, talents, crystals and resets only), so every boss win stays recorded after any reset. A farm win of an earlier chapter boss missing from `cleared_chapters` records it (AD-024).
- The campaign runs to chapter 15 (`ChapterOrder.MAX_CHAPTER = 15`); only the chapter 15 boss completes it (AD-019).
- Each hero has its own 4 equipment slots, and the Equipamento screen equips any owned hero. Piece affixes are `CLICK_DAMAGE_PCT`, `CRIT_CHANCE`, `CRIT_DAMAGE_PCT`, `BOSS_DAMAGE_PCT`, `BOSS_TIME_SECONDS`, `ARMOR_PIERCE_PCT`; a weapon also has `clickDamage` (`game/src/domain/equipment/equipment.js`).
- The leader is `player_cards.leader_id`, changed by `PUT /leader` (answer `{ "leaderId": string }`), read in `GET /heroes` as `leaderId` (`HeroController.kt`). Every hero change takes the `player_cards` row lock (`PlayerCardsRepository.findForUpdate`); lock order `progress`, `player_cards`, `wallets` (AD-009).
- Heroes reach 9 stars (AD-020). The leader star bonus has rows 0 to 9 (`game/src/domain/heroes/starBonus.js`).
- One damage (AD-021): every click, skill hit, aimed shot and damage-over-time tick goes through one `strike` (`game/src/domain/skills/skillDamage.js`) and `calculateDamage` (`game/src/domain/combat/damage.js`): `base x element x (1 - defense x (1 - armorPierce / 100) / 100) x critical x boss`, then x Bênção `1 + 0.30 f` and x Prisão `1 + 0.25 f`; Brado removes `30 f` defense points. A tick (`tickDamage`) is never critical and gets no click bonus (Ventos, Bênção's +25 % click). The defense the hits meet is `monsterAfterBreak(stats, talents)` (`PHYSICAL_BREAK` off the defense, `CRIT_RESIST_BREAK` off the critical resistance, floor 0), read at every hit (`ClickerGame.create`, `SkillCombat` `statsOf`).
- Seeded enemy numbers (`ChapterDefinition.of`): phase monsters have defense 0 in every chapter; a miniboss of chapter c, stage n has defense `min(10 + n + bonus(c), 80)`; a chapter boss `min(30 + bonus(c), 80)`, with `bonus(c) = 5(c - 1)` up to chapter 5 and `20 + 3(c - 5)` after. So the chapter 5 boss has defense 50, the chapter 10 boss 65, the chapter 15 boss 80.
- The combat scene draws the leader as `hero_<id>` (`assets/heroes/<id>_sprite.png`, loaded for all five heroes in `Preloader.js:39`) at `CHARACTER = { x: 230, y: 612, height: 320 }` with origin (0.5, 1) (`ClickerGame.js:26`, `showCharacter`). Sprite textures: `kael_sprite.png` 300 x 279, `lyra_sprite.png` 102 x 300, `orina_sprite.png` 125 x 300, `seraphine_sprite.png` 118 x 300, `vex_sprite.png` 108 x 300. Kael as leader is about 344 px wide on screen today.
- The monster body is `MONSTER = { x: 670, y: 440, width: 220, height: 250 }`; damage numbers rise from `damageTextY` (above the health bar) in `DAMAGE_FONT` (Cinzel 700, stroke `#2a1408`, 8 px), gold `#ffd35c` 32 px or orange `#ff8a1f` 48 px for a critical (`ClickerGame.js:65-67`).
- Scene layout boxes (scene px, 1024 x 768): element wheel at (108, 224), 204 x 206 (x 6 to 210, y 121 to 327); chapter plate (82, 96), 136 x 40; effect tags (512, 96), 640 x 40; battle bar (512, 686), 984 x 124 (top at y 624), which holds the leader card (154, 686), the skill bar (550, 686), the auto click (867, 686) and the farm switch (951, 686); enemy line (670, 596). Since `ui-redesign` the auto click is in the battle bar, so the old box at (366, 200) no longer exists.
- The HUD rail (`HeroUi.js`, `.hero-hud` in `style.css`) is centred at (956, 370) and holds six buttons since `hero-bag-cards` (AD-025): `hud-heroes`, `hud-bag`, `hud-leader`, `hud-equipment`, `hud-talents`, `hud-farm`, each 76 x 60 px with a 22 px Lucide icon at stroke 2.75, gap 6 px. It held seven buttons before `hero-bag-cards`, so a seventh fits above the battle bar. `e2e/equipment.spec.js:45` counts `.hero-hud button` as 6.
- The hero panel (`.hero-window`) is 920 px wide with 26 px side padding (868 px of content) and at most 708 px high, scrolling inside. Hero pictures in the panels use the standing sprite (`views/dom.js` `sprite()`), because `<id>_position.jpg` still carries its chroma-key backdrop.
- `assets/coin-gold.png` is a 787 x 97 animation atlas (`coin.json`), not a single coin; the DOM coins of the wallet are CSS discs (`.coin-gold::before`, radial gradient `#fff1b0`, `#e0b45a` 55 %, `#8a5a12`).
- The card notice (`HeroUi.showNotice`, 3 s at (512, 120)) sits under the open hero panel (the panel has depth 1).
- 1 ouro = 100 prata = 10 000 cobre (`formatCopper`, `equipment.js`). AD-019: a first run earns about 1 ouro by the chapter 5 boss and about 10 ouro by the chapter 8 boss.
- Combat runs in the browser (AD-002). The fight keeps running behind hero screens and in a hidden tab (stepped once a second in 50 ms slices), and only the pause menu freezes it (`background-fight`, `ClickerGame.update` returns while paused).
- The latest Flyway migration is `V11__unified_damage.sql`; the next free version is **V12**. `PreviousBackendCompatibilityIT` pins that the release before the newest migration starts on the migrated schema.

## Goals

- [ ] A player who has won the chapter 5 boss can buy up to 4 ally slots with gold, each opened by the first win of the chapter 5, 6, 7 or 8 boss, and fill them with owned heroes. The server stores all of it.
- [ ] While the campaign is at chapter 5 or later, every ally hits the monster once per second with the one damage of AD-021: Ally Damage formula, the leader's element, the monster's one `defense`.
- [ ] Each of the five heroes has a passive that applies while it is a fighting ally (Passive Table).
- [ ] The allies stand on the field and visibly attack on each hit.
- [ ] A player who has never won the chapter 5 boss, or whose campaign is below chapter 5, plays exactly as today.

## Out of Scope

| Feature | Reason |
| --- | --- |
| New heroes beyond the five of the catalog | Content feature; the team works with any catalog size |
| Ally skills on the skill bar | Owner decision (Q10): only the leader's skills are usable |
| The other four leader bonuses (Kael, Orina, Seraphine, Vex) | Owner decision (Q11): a separate feature |
| A separate damage type or enemy resistance for allies | Owner answer Q2 of `unified-damage` (AD-021): one damage everywhere |
| Any change to the `enemies` table, the progress payload or the farm payload | Follows from AD-021; ally hits read the same `defense` |
| Add monsters, choosing a target among several monsters | Feature `miniboss-adds` (allies hit the target it defines) |
| Hero levels, Seiva, upgrading an ally with coins | Not asked; an ally gets stronger through stars and equipment |
| Selling back a bought slot, several saved teams | Not asked |
| New art or a rigged animation for allies | Default of Q36: the existing standing sprites; `kael_rig.*` is not used |
| Server-side check of ally damage | AD-002 |
| A phone layout of the Equipe screen | TD-010 (every panel is unreadable on a phone today) |
| Translating existing English text | TD-001 (AD-007) |

---

## Team Slots

Owner answers Q27 to Q30. Slot 0 is always the leader. Ally slots 1 to 4 are bought in order with copper from the wallet.

| Ally slot | Opens for purchase on the player's first win of | Price (Q28) |
| --- | --- | --- |
| 1 | chapter 5 boss | 1 ouro (10 000 cobre) |
| 2 | chapter 6 boss | 2 ouro (20 000 cobre) |
| 3 | chapter 7 boss | 3 ouro (30 000 cobre) |
| 4 | chapter 8 boss | 4 ouro (40 000 cobre) |

- `openSlots` is the number of the chapters 5, 6, 7 and 8 in `cleared_chapters` (0 to 4), so an open slot stays open after a reset.
- A slot is **bought** once paid. Bought slots stay bought after a reset (Q30).
- A bought slot is empty until the player puts a hero in it.
- The team is **unlocked** once chapter 5 is in `cleared_chapters` (first chapter 5 boss win). The team is **active** (allies fight, passives apply) while the campaign chapter is 5 or later, or the campaign is completed (Q2). The fought chapter of a farm fight does not matter: a farm fight of chapter 3 while the campaign stands at chapter 7 has an active team.
- A **fighting ally** is a hero in a bought ally slot while the team is active and the heroes have loaded. The leader is never a fighting ally.

## Ally Damage

Owner decisions Q5 (rhythm, star multiplier, never critical, no combo, leader's element) and Q2 of `unified-damage` (one damage). Default of Q46 for which effects apply.

- **Ally Base** = `(1 + ally weapon clickDamage) x (1 + ally CLICK_DAMAGE_PCT / 100)`, from the pieces the ally wears (values already refined by the server).
- **Star multiplier** by the ally's stars: 0 stars **2**, 1 star **4**, 2 stars **6**, 3 stars **8**, 4 stars **10**, 5 stars **12**, 6 stars **14**, 7 stars **16**, 8 stars **18**, 9 stars **20** (Q5 for 0 to 3; AD-020 D6 for 4 to 9).
- **Team factor**: 1.25 while Seraphine is a fighting ally (Graça da Aurora), else 1.
- **Ally attacker**: element = the leader's element; base damage = `Ally Base x star multiplier x team factor`; armor pierce = the ally's `ARMOR_PIERCE_PCT` (at most 100); boss damage = the ally's `BOSS_DAMAGE_PCT`; never critical.
- **Ally hit** = the ally attacker through the strike of a damage-over-time tick at 100 % (`tickDamage`, AD-021): `base x element multiplier (leader's element against the monster's) x (1 - defense x (1 - armorPierce / 100) / 100) x boss factor x Bênção x Prisão`, where
  - defense = the monster's one `defense` minus the `PHYSICAL_BREAK` talent value minus 15 while Orina is a fighting ally (Erosão Arcana), floored at 0, then minus `30 f` while Brado Aterrador runs, floored at 0;
  - boss factor = `1 + BOSS_DAMAGE_PCT / 100` against a miniboss or a chapter boss (a monster with a countdown), else 1;
  - Bênção = `1 + 0.30 f` while Bênção da Grande Árvore runs, Prisão = `1 + 0.25 f` while Prisão de Espinhos holds the monster (f = the level factor of the cast, AD-020).
- Not on ally hits: critical hits (so `CRIT_CHANCE`, `CRIT_DAMAGE_PCT`, Bomba de Fumaça and Lyra's or Vex's passives change nothing), the combo, Ventos Ligeiros and Bênção's +25 % click bonus (click bonuses), the leader's star bonus and power talents (`CLICK_DAMAGE`, `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE`), the ally's `BOSS_TIME_SECONDS`, Lyra's double click.
- **Rhythm**: all fighting allies hit together once every 1000 ms of fight time. The first tick lands 1000 ms after a monster appears. Allies hit in slot order 1 to 4; each hit reads the monster's stats and the running effects at that moment; if one hit kills the monster, the later slots of that tick do not land.
- **Shown damage per second** of an ally (Equipe screen) is `Ally Base x star multiplier x team factor`, before element, defense and boss factor, rounded to one decimal and written with `formatDamage` (`999` reads `999`, `12 500` reads `12.5K`).
- Decimal results are compared with a tolerance of 1e-9 in unit tests and 1e-5 in e2e tests (L-012).

Worked examples (the leader is Kael, FIRE, unless a row says otherwise; level factor f = 1; no talent unless named):

| ID | Case | Hit |
| --- | --- | --- |
| E1 | Lyra 0 stars, no pieces, FIRE monster with defense 0 | 1 x 2 x 1.0 = **2** |
| E2 | Lyra 0 stars, no pieces, FIRE monster with defense 50 | 2 x 0.5 = **1** |
| E3 | Orina 3 stars, weapon 10 click damage at +0, ring +20 % click damage, NATURE monster with defense 50 | 13.2 x 8 x 2.0 x 0.5 = **105.6** |
| E4 | Lyra 0 stars wearing an amulet of +20 % boss damage, FIRE miniboss with defense 10 | 2 x 0.9 x 1.2 = **2.16** |
| E5 | Lyra 0 stars and Seraphine 0 stars, FIRE monster with defense 0 | 2.5 + 2.5 = **5** per tick |
| E6 | Vex 0 stars wearing a ring of 50 % armor pierce, FIRE monster with defense 40 | defense 20: 2 x 0.8 = **1.6** |
| E7 | Lyra 0 stars, Prisão de Espinhos (level 1) holds a FIRE monster with defense 0 | 2 x 1.25 = **2.5** |
| E8 | Lyra 0 stars, Bênção da Grande Árvore (level 1) runs, FIRE monster with defense 0 | 2 x 1.3 = **2.6** |
| E9 | Lyra 0 stars, Brado Aterrador (level 1) on a FIRE monster with defense 40 | defense 10: 2 x 0.9 = **1.8** |
| E10 | Lyra 0 stars, `PHYSICAL_BREAK` value 5, FIRE monster with defense 40 | defense 35: 2 x 0.65 = **1.3** |
| E11 | Lyra 0 stars and Orina 0 stars (Erosão Arcana), FIRE monster with defense 40 | defense 25: 1.5 + 1.5 = **3** per tick |
| E12 | Lyra 9 stars, no pieces, FIRE monster with defense 0 | 1 x 20 = **20** |
| E13 | Lyra 0 stars with a ring of +50 % critical chance and +100 % critical damage, Ventos Ligeiros and Bomba de Fumaça running, combo at +50 %, FIRE monster with defense 0 | **2** (no critical, no click bonus, no combo) |
| E14 | The E1 ally while the leader is Kael 3 stars with `CLICK_DAMAGE` value 20 | **2** (the leader's stars and talents do not reach allies) |
| E15 | Lyra 0 stars, NATURE monster with defense 0, leader Kael (FIRE), then leader Orina (WATER) | **4**, then **1** (2 x 0.5) |

## Passive Table

Owner decision Q9, with Erosão Arcana and Lâminas Sombrias rewritten by this revision (default of Q45). A passive applies while its hero is a fighting ally, in every fight (campaign and farm), and never while that hero is the leader. Values are fixed and do not depend on stars.

| Hero | Passive name (screen text) | Effect | Screen text of the effect |
| --- | --- | --- | --- |
| Kael | Guarda do Baluarte | +5 s on the time limit of every miniboss and chapter boss (campaign and farm), added when the countdown starts, on top of the talent and equipment seconds | `+5 s no tempo dos chefes` |
| Lyra | Olho do Falcão | +10 points of critical chance on the leader's clicks and skill hits, capped at 100 | `+10 de chance de crítico` |
| Orina | Erosão Arcana | Every monster has 15 points less defense for every hit (the leader's and the allies'), after the `PHYSICAL_BREAK` talent, floored at 0 | `-15 de defesa dos inimigos` |
| Vex | Lâminas Sombrias | Every monster has 15 points less critical resistance for the leader's hits, after the `CRIT_RESIST_BREAK` talent, floored at 0 | `-15 de resistência a crítico dos inimigos` |
| Seraphine | Graça da Aurora | x1.25 on every ally hit (team factor) | `+25% de dano da equipe` |

The enemy line (`Defesa <n>%`, `Crit res <n>%`) shows the monster after the break talents and the passives, as it already does after the break talents. The attribute panel of the Equipamento screen adds the passives that apply now: Lyra to `Chance de crítico`, Kael to `Tempo extra de miniboss` and `Tempo extra de chefe`, Orina to `Quebra de defesa`, Vex to `Quebra de resistência a crítico` (AD-012: the panel and the combat read the same builders).

Passive worked examples (leader Kael 0 stars: base damage 1, critical chance 10, critical multiplier 2; no talent unless named):

| ID | Case | Result |
| --- | --- | --- |
| P1 | A miniboss of 30 s appears with Kael as a fighting ally | countdown `Time: 35` |
| P2 | Same with `MINIBOSS_TIME` value 4 | `Time: 39` |
| P3 | A chapter boss of 60 s appears with Kael as a fighting ally | `Time: 65` |
| P4 | Leader click on a FIRE monster with defense 0 and critical resistance 0, `random() * 100` = 15, Lyra a fighting ally | critical: **2** |
| P5 | P4 without Lyra in the team | normal: **1** |
| P6 | Leader click on a FIRE monster with defense 40, Orina a fighting ally | defense 25: **0.75**; enemy chip `Defesa 25%` |
| P7 | Leader click on a FIRE monster with defense 10, Orina a fighting ally | defense 0: **1**; enemy chip `Defesa 0%` |
| P8 | Leader click on a FIRE monster with defense 0 and critical resistance 30, `random() * 100` = 8, Vex a fighting ally | critical chance 10 x 0.85 = 8.5: critical **2**; enemy chip `Crit res 15%` |
| P9 | P8 without Vex in the team | critical chance 10 x 0.7 = 7: normal **1** |
| P10 | The attribute panel with Lyra, Kael, Orina and Vex as fighting allies, leader Kael 0 stars, no pieces, no talents | `Chance de crítico: 20%`, `Tempo extra de miniboss: 5s`, `Tempo extra de chefe: 5s`, `Quebra de defesa: 15`, `Quebra de resistência a crítico: 15` |

## Equipe Screen Layout

The screen opens in the existing hero panel (`.hero-window`, title `Equipe`) with the Grove recipe tokens (AD-022). Every size is in scene px. Top to bottom, every block centred, 12 px between blocks:

| Block | Element | Content and style |
| --- | --- | --- |
| Status | `p.team-status` (`data-testid="team-status"`) | `A equipe luta a partir do capítulo 5.` while the team is inactive, else `hidden`. Figtree 600 14 px, `--ember-700` |
| Notice | `p.team-notice` (`data-testid="team-notice"`) | `Vaga de aliado comprada!` for 3000 ms after a purchase, else `hidden`. Figtree 700 14 px, `--ink-900` |
| Team damage | `p.team-dps` (`data-testid="team-dps"`) | `Dano da equipe: <n>/s`. Cinzel 700 18 px, `--ink-900` |
| Slots | `div.team-slots` (`data-testid="team-slots"`) | 5 cards in a row, gap 16 px (724 px wide) |
| Purchase dialog | `div.team-buy-dialog` (`data-testid="team-buy-dialog"`) | Only while a purchase is asked (Purchase flow); same recipe as `.fusion-all-confirm` (`--parchment-100`, inset border, radius 8 px, padding 12 px 16 px) |
| Actions | `div.team-actions` | `Remover` (`data-testid="team-remove"`) and `Tornar líder` (`data-testid="team-make-leader"`), classes `fusion-button is-secondary` |
| Available title | `h3.team-available-title` | `Heróis disponíveis`. Cinzel 700 16 px, `--ink-900` |
| Available list | `div.team-available` (`data-testid="team-available"`) | Entries in a wrapping row, gap 12 px, or `p.team-available-empty` `Todos os heróis estão na equipe.` |

**Slot card** `.team-slot` (`data-testid="team-slot-<i>"`, i 0 to 4): 132 x 210 px, `box-sizing: border-box`, padding 8 px, radius 8 px, a column centred with gap 4 px, attributes `data-state` and `data-selected` (`"true"` or `"false"`). Slot 0 is a `div`; slots 1 to 4 are `button type="button"`.

| `data-state` | Who | Look | Content (top to bottom) | Click |
| --- | --- | --- | --- | --- |
| `leader` | slot 0 | background `--parchment-100`, border 3 px solid `#e8b64c` | label `Líder`; sprite 80 x 80 (`object-fit: contain`); name; `<stars>★`; the leader bonus text (`leaderBonusText`) | none |
| `filled` | bought slot with a hero | background `--parchment-100`, border 2 px solid `--wood-600` | label `Aliado <n>`; sprite 80 x 80; name; `<stars>★`; `Dano: <n>/s`; `<passive name>: <passive text>` | selects it |
| `empty` | bought slot without a hero | transparent background, border 2 px dashed `--wood-600` | label `Aliado <n>`; `vazio` (Figtree 500 italic 13 px, `--ink-600`) | selects it |
| `buyable` | open, not bought, and the next slot to buy | transparent background, border 2 px solid `--gold-400` | label `Aliado <n>`; coin `span.team-coin` 32 x 32 (the gold disc of `.coin-gold`); price `span.team-price` `1`, `2`, `3` or `4` (Cinzel 700 22 px, `--ink-900`) | opens the purchase dialog |
| `waiting` | open, not bought, an earlier slot not bought | as `buyable` with border `--wood-600`, opacity 0.5, `disabled` | label; coin; price | none |
| `locked` | not open | as `waiting` | label; coin; price; `Chefe do capítulo <4+n>` (Figtree 500 11 px, `--ink-600`) | none |

Text styles inside a card: label Cinzel 700 12 px `--ink-600`; name Figtree 700 13 px `--ink-900`, one line with ellipsis; stars Figtree 600 12 px; `Dano: <n>/s` Figtree 600 12 px `--ember-700`; passive and leader bonus Figtree 500 11 px `--ink-600`, at most 2 lines. A selected card has `outline: 3px solid var(--ember-500)` with `outline-offset: 2px`. A card that was just bought has `data-flash="true"` and background `--gold-200` for 400 ms.

**Available entry** `button.team-hero` (`data-testid="team-available-<id>"`): 200 x 80 px, padding 8 px, background `--parchment-100`, inset border, radius 8 px; sprite 64 x 64 on the left; on the right the name (Figtree 700 13 px), `<stars>★` (12 px) and the passive name (Figtree 500 11 px, `--ink-600`). Owned heroes outside the team (not the leader, not in a bought slot), in catalog order.

**Purchase dialog**: `p.team-buy-question` `Comprar a vaga <n> por <p> ouro?` (Figtree 600 14 px); `p.team-buy-short` `Moedas insuficientes` (Figtree 600 13 px, `--ember-700`) only when the wallet holds less than the price; buttons `Comprar` (`data-testid="team-buy-confirm"`, class `fusion-button`) and `Cancelar` (`data-testid="team-buy-cancel"`, class `fusion-button is-secondary`).

**HUD button**: `Equipe` (`data-testid="hud-team"`) with the Lucide `swords` icon at 22 px and stroke 2.75, inserted right after `hud-leader`. It is absent from the DOM while the team is not unlocked, so the rail keeps six buttons for those players; with it the rail has seven buttons and its bottom stays above the battle bar (y 624).

## Allies on the Field

Owner decisions Q36 (attack formation) and Q37 (attack motion). The leader stands at the tip of a wedge that points at the monster, and the allies spread out behind it, two above and two below. Each sprite is sized from a fit box: it is scaled by `min(box width / texture width, box height / texture height)` and keeps its aspect ratio, so Kael's wide texture (300 x 279) cannot push into its neighbours.

| Who | Fit box | Bottom centre (origin 0.5, 1) | Depth |
| --- | --- | --- | --- |
| Leader, while at least one ally is drawn | 180 x 240 px | (320, 600) | 0.5 |
| Ally slot 1 (upper inner) | 90 x 120 px | (180, 460) | 0.4 |
| Ally slot 2 (lower inner) | 90 x 120 px | (180, 605) | 0.4 |
| Ally slot 3 (upper outer) | 90 x 120 px | (75, 462) | 0.3 |
| Ally slot 4 (lower outer) | 90 x 120 px | (75, 615) | 0.3 |
| Leader, while no ally is drawn | unchanged: 320 px high | unchanged: (230, 612) | 0.5 |

Sprite sizes from the textures: in an ally box Kael 90 x 83.7 (scale 0.3), Lyra 40.8 x 120 (0.4), Orina 50 x 120 (0.4), Seraphine 47.2 x 120 (0.4), Vex 43.2 x 120 (0.4); as leader in the formation Kael 180 x 167.4 (0.6), Lyra 81.6 x 240 (0.8), Orina 100 x 240 (0.8), Seraphine 94.4 x 240 (0.8), Vex 86.4 x 240 (0.8).

Worst-case boxes, checked against the screen of `7de3208`:

- Leader box: x 230 to 410, y 360 to 600. Ally slot 1: x 135 to 225, y 340 to 460. Slot 2: x 135 to 225, y 485 to 605. Slot 3: x 30 to 120, y 342 to 462. Slot 4: x 30 to 120, y 495 to 615.
- No standing box overlaps another box, the element wheel (bottom y 327, and the highest ally box, slot 3, starts 15 px under it, UI review of `hero-team`), the chapter plate and effect tags (bottom y 116), the battle bar (top y 624), the monster (x 560 or more) or the `miniboss-adds` column (x 425 or more).

Motion and gates:

- Every ally hit that lands moves its sprite 24 px toward the monster (x + 24) in 100 ms and back in 100 ms. During that motion an inner ally may pass behind the leader, which is drawn in front.
- One light-blue number `#7fd4ff` at 28 px in `DAMAGE_FONT` shows the sum of the tick (`formatDamage`), at x = monster centre + 70 (740), y = `damageTextY`, rising and fading like the other damage numbers.
- No ally is drawn while the team is inactive, while its slot is empty or not bought, or before the heroes load. With no ally drawn, the leader goes back to its usual size and place.

## Consistency With `miniboss-adds`

`miniboss-adds` (feature 3) adds monsters beside the miniboss and a target the player picks; its spec says the allies hit the target and, when a tick kills the target add, the later hits of that tick land on the new target. This feature builds nothing of it, and keeps three seams so it plugs in without rework:

1. The ally clock follows the fight, not the target: the tick clock restarts only when a new monster appears for the encounter (design `AllyCombat`, `monster` argument).
2. Each ally hit asks for its target right before it lands (design `AllyCombat`, `target` argument). Here the target is the one monster while it lives; once it is dead the later hits of the tick have no target and do not land.
3. The field formation keeps every hero at x 410 or less, left of the adds column (x 425 to 535).

Under AD-021 the add buff of `miniboss-adds` raises the miniboss's one defense, which ally hits meet like every strike (Q35). `miniboss-adds` revises its own spec (physical and magical buffs, team resistance) when it is picked up.

## Player-Facing Texts

Every new text, exactly (AD-007, L-010):

| Where | Text |
| --- | --- |
| HUD button | `Equipe` |
| Panel title | `Equipe` |
| Slot labels | `Líder`, `Aliado 1`, `Aliado 2`, `Aliado 3`, `Aliado 4` |
| Empty bought slot | `vazio` |
| Locked slot | `Chefe do capítulo 5`, `Chefe do capítulo 6`, `Chefe do capítulo 7`, `Chefe do capítulo 8` |
| Slot price | `1`, `2`, `3`, `4` |
| Ally damage line | `Dano: <n>/s` |
| Team damage line | `Dano da equipe: <n>/s` |
| Passive line | `<passive name>: <passive text>`, e.g. `Graça da Aurora: +25% de dano da equipe` |
| Inactive team | `A equipe luta a partir do capítulo 5.` |
| Available list | `Heróis disponíveis`; empty list `Todos os heróis estão na equipe.` |
| Actions | `Remover`, `Tornar líder` |
| Purchase dialog | `Comprar a vaga <n> por <p> ouro?`, `Comprar`, `Cancelar`, `Moedas insuficientes` |
| Purchase notice | `Vaga de aliado comprada!` |
| Errors | `Não foi possível salvar a equipe.`, `Não foi possível comprar a vaga.` |

---

## Assumptions & Open Questions

Rows `Q1` to `Q13` carry the owner's answers of 2026-10-30, rows `Q26` to `Q37` those of 2026-10-31. Rows marked `y` are owner decisions; rows marked `n` are product owner defaults, re-checked against the code of 2026-11-19. Q45 and Q46 are new questions of this revision.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** Split | Three features `campaign-chapters`, `hero-team`, `miniboss-adds` | Owner accepted the split; order in Q26 and the order of 2026-11-19 | y |
| **Q2** When the team works | Only while the campaign chapter is 5 or later, or the campaign is completed. After a reset to chapter 1 the allies do not fight until the player is back at chapter 5 | Owner answer (not permanent) | y |
| **Q2a** Accounts that already beat chapter 5 | Slot 1 is open at once on release, from their `cleared_chapters` | Owner answer | y |
| **Q3** Composition and storage | Leader plus up to 4 distinct owned heroes (0 stars included), stored by the backend, kept by the reset | Owner answer | y |
| **Q4** Team at the unlock | Only the leader. Ally slots are bought one at a time as they open (Team Slots) | Owner answer (changed from auto-fill) | y |
| **Q5** Ally damage formula | 1 hit per second, Ally Base x star multiplier (2, 4, 6, 8 for 0 to 3 stars), never critical, no combo, element of the leader | Owner answer | y |
| **Q6** Ally equipment | Replaced by Q34 | Q7 of 2026-10-30 changed the damage type | replaced by Q34 |
| **Q7** Damage type (rewritten 2026-11-19) | No damage type of its own. Ally hits deal the one damage of AD-021 and meet the monster's one `defense` like every strike. No TEAM type, no `team_resistance`, no migration on `enemies`, no change of its unique key, no change of the progress or farm payload | Owner answer Q2 of `unified-damage` (D14, 2026-11-19), which supersedes the answer of 2026-10-30 | y |
| **Q8** Skills and talents on ally hits | Replaced by Q34 | Q7 of 2026-10-30 changed the damage type | replaced by Q34 |
| **Q9** Passives | Passive Table: Kael, Lyra and Seraphine as answered; Orina and Vex rewritten by Q45 | Owner answer; two passives lowered a defense that is now one | y (Kael, Lyra, Seraphine); y (Orina and Vex, Q45 of 2026-11-19) |
| **Q10** Ally skills | Not usable; only the leader's 3 skills | Owner answer | y |
| **Q11** The other four leader bonuses | A separate feature | Owner answer | y |
| **Q12** Screen and combat UI | HUD button `Equipe` hidden until the team is unlocked. A locked or unbought slot is a transparent square with one gold coin and its price. In combat, the allies stand on the field and attack every second (Allies on the Field). The ally damage number is light blue | Owner answer (slot squares and field allies changed on 2026-10-31) | y |
| **Q13** Unlock toast | None; feedback comes from buying a slot (Q32) | Owner answer | y |
| **Q26** Order of the three features | `campaign-chapters`, then `hero-team`, then `miniboss-adds`; `unified-damage` ran before `hero-team` (order of 2026-11-19) | Owner answers 2026-10-31 and 2026-11-19 | y |
| **Q27** When a slot opens | Slot n opens on the player's first win of the chapter 4 + n boss (5, 6, 7, 8), read from `cleared_chapters`, so it stays open after a reset | Owner answer 2026-10-31 | y |
| **Q28** Slot prices | 1, 2, 3 and 4 ouro (10 000, 20 000, 30 000, 40 000 cobre), 10 ouro in total; the coin drops of AD-019 make them reachable on a first run | Owner answer 2026-10-31: keep the prices, raise the drops | y |
| **Q29** Buying order and content | Slots are bought in order (1 before 2), and a bought slot starts empty | Owner answer 2026-10-31 | y |
| **Q30** Slots after a reset | Bought slots and the heroes in them are kept; they fight again once the campaign reaches chapter 5 | Owner answer 2026-10-31 | y |
| **Q31** Equipe button after a reset | Stays visible below chapter 5 (to manage and buy), the panel shows `A equipe luta a partir do capítulo 5.`, and no ally is drawn on the field | Owner answer 2026-10-31 | y |
| **Q32** Purchase flow and feedback | A click on a buyable slot opens a dialog `Comprar a vaga <n> por <p> ouro?` with `Comprar` and `Cancelar`. On success the slot flashes gold (400 ms), the notice `Vaga de aliado comprada!` shows for 3 s, the wallet updates, and the new empty slot is selected, ready for a hero. A slot not yet open shows its coin and price at 50 % opacity with `Chefe do capítulo <4+n>` | Owner answer 2026-10-31 | y |
| **Q33** Team resistance values | Removed: there is no team resistance (Q7) | AD-021 | superseded by Q7 |
| **Q34** What applies to ally damage (rewritten 2026-11-19) | See Q46 | The 2026-10-31 default listed what the TEAM type ignored; with one damage the list changes | replaced by Q46 |
| **Q35** Adds and ally hits (rewritten 2026-11-19) | The add buff of `miniboss-adds` raises the miniboss's one defense, and ally hits meet it like every strike; the team is no longer a counter to adds | Follows from owner answer Q2 (one damage everywhere); `miniboss-adds` revises its spec when picked up | y |
| **Q36** Ally art and place | Attack formation (Allies on the Field). Sprites are `assets/heroes/<id>_sprite.png`; `kael_rig.*` is not used | Owner answer 2026-10-31; positions re-checked on `7de3208` against the HUD of `ui-redesign` | y |
| **Q37** Attack animation | Each ally hit that lands moves the sprite 24 px toward the monster and back in 200 ms, plus the summed light-blue number | Owner answer 2026-10-31 | y |
| **Q45** Erosão Arcana and Lâminas Sombrias (new) | Orina's Erosão Arcana: `-15 de defesa dos inimigos`, for every hit (leader and allies). Vex's Lâminas Sombrias: `-15 de resistência a crítico dos inimigos`, for the leader's hits, so the two passives stay different | With one defense, the old texts (`-15 de defesa mágica` and `-15 de defesa física`) become the same effect; critical resistance is the other enemy number that already has a break talent (`CRIT_RESIST_BREAK`) and an enemy chip. Alternatives: both lower the one defense by 15 and stack (-30 with both), or the owner names another effect for Vex | y (owner, 2026-11-19: recommended default) |
| **Q46** Which effects reach ally hits (new) | Ally hits go through the strike of a tick (Ally Damage): the one defense after `PHYSICAL_BREAK`, Erosão Arcana and Brado Aterrador; the ally's own armor pierce and boss damage; Prisão de Espinhos and Bênção da Grande Árvore. Not: critical hits, the combo, Ventos Ligeiros and Bênção's click bonus, the leader's star bonus and power talents. Consequence: allies lose half their damage on the chapter 5 boss (defense 50) and 80 % on the chapter 15 boss (defense 80) unless armor pierce or breaks lower it | AD-021: "every effect applies to every strike" and an ally hit is a strike; the leader's own click power stays the leader's (Q5). The old plan (team resistance 20 to 50 on bosses) gave allies more on bosses; AD-021 already accepted losing that lever | y (owner, 2026-11-19: recommended default) |
| Leader change with a team | `PUT /leader` with a hero in ally slot n swaps them: the old leader takes slot n. A hero outside the team becomes leader and the team keeps its allies | A hero is never both leader and ally | n |
| Contract | `GET /heroes` gains `team` = `{ "unlocked": boolean, "openSlots": int 0..4, "boughtSlots": int 0..4, "slotPrices": [10000, 20000, 30000, 40000], "allies": [4 entries, hero id or null] }`. `PUT /team` `{ "allies": [4 entries] }` answers `{ "leaderId": string, "team": {...} }`. `POST /team/slots` `{ "fromSlots": int }` answers `{ "team": {...}, "wallet": { "gold": int, "silver": int, "copper": int } }`. `PUT /leader` answers `{ "leaderId": string, "team": {...} }`. A missing `team` in a payload means a locked team | One nested object reused by four answers and the 409 body; new fields keep the old game working (expand, AD-016); `fromSlots` makes a double click buy once (AD-011 pattern); the game types no price (AD-011). Changed from the top-level fields of 2026-10-31 (never confirmed) | n |
| Errors and check order | `PUT /team`: 400 `INVALID_TEAM` (body shape, a hero twice, the leader), then 404 `HERO_NOT_FOUND`, then 409 `TEAM_LOCKED`, then 409 `TEAM_SLOT_NOT_BOUGHT`, then 409 `HERO_NOT_OWNED`. `POST /team/slots`: 400 `INVALID_TEAM_SLOT_REQUEST`, then 409 `TEAM_SLOT_MISMATCH` (body `team`: the stored team), then 409 `TEAM_SLOTS_MAX`, then 409 `TEAM_SLOT_LOCKED`, then 409 `NOT_ENOUGH_COPPER`. Every refusal changes nothing | Same families as talents and auto click (L-038, L-055); a fixed order makes each case testable | n |
| Locks | Team saves and slot purchases take the `player_cards` row lock, then `wallets` for a purchase (lock order `progress`, `player_cards`, `wallets`) | Serialises with `PUT /leader`, card drops and refines | n |
| Storage and migration | One new table `player_team` (one row per player who bought a slot: `bought_slots`, `ally_1` to `ally_4` referencing `heroes`) created by `V12__hero_team.sql`, expand only (AD-016). No row means 0 bought slots and no ally | The previous backend never reads the new table; one row keeps a swap a single update | n |
| Failure on the screen | A failed save or leader change shows `Não foi possível salvar a equipe.`, a failed purchase `Não foi possível comprar a vaga.`; both keep the panel open and reload the heroes from the backend | The server is the truth | n |
| Heroes not loaded | No ally hits, no passives, no allies drawn until `GET /heroes` answers | Same rule as the leader | n |
| Equipe button place | After `Líder` in the rail; absent from the DOM while locked | The rail of a player without a team stays exactly as today (six buttons, `equipment.spec.js:45`) | n |
| Coin icon | The CSS gold disc of the wallet at 32 x 32, not `assets/coin-gold.png` | That file is an animation atlas (Facts); the disc is the coin the player already sees | n |
| Pictures in the panel | The standing sprite (`<id>_sprite.png`) at 80 x 80 in slot cards and 64 x 64 in the available list | Every hero panel uses the sprite; the portrait JPG has a chroma-key backdrop | n |
| Purchase notice place | Inside the panel (`team-notice`), not the HUD card notice | The HUD notice sits under the open panel (Facts) | n |
| Attribute panel | Shows the passives that apply now (Passive Table) | AD-012: the panel and the combat read the same builders | n |
| Effects at a frame edge | Ally hits of a frame land before the skills advance in that frame, so an ally hit that lands in the frame where Prisão de Espinhos or Bênção da Grande Árvore ends still gets it | Same rule as ticks and the aimed shot at the end instant (L-108); the step is at most one frame (50 ms in a hidden tab) | n |
| Observability (convention, not an AC) | The backend logs each team save and slot purchase (username, slots, allies, price) at INFO and each refusal (username, code) at WARN | L-007 | n |
| Implicit dimensions | Input bounds: Contract and Errors. Failure states: Failure on the screen. Idempotency: whole-team PUT, `fromSlots` on purchase. Auth: 401 without a token, own team only. Concurrency: Locks. Data lifecycle: the team row cascades with the user and survives the reset; a catalog hero in a team cannot be deleted (restrict). Observability: convention above. External dependency: N/A because only the database is involved. State transitions: a slot goes not open, open, bought, never back; the team is active only at chapter 5+ | Complex-scope sweep | n |

**Open questions:** none. The owner answered Q45 and Q46 with the recommended defaults and approved the spec, design and tasks on 2026-11-19.

---

## User Stories

### P1: Team and slots on the backend ⭐ MVP

**User Story**: As a player who beat chapter 5, I want my bought slots and allies stored on the server so that they survive reloads, devices and resets.

**Why P1**: Every other story reads the team, the slots and the unlock from here.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `GET /heroes` THEN the backend SHALL also answer `team` with `unlocked` (true when `cleared_chapters` holds 5), `openSlots` (how many of the chapters 5, 6, 7 and 8 `cleared_chapters` holds), `boughtSlots`, `slotPrices` `[10000, 20000, 30000, 40000]` and `allies` (4 entries, hero id or `null`, slot order).  <!-- event-driven -->
2. WHEN a player with no bought slot calls `GET /heroes` THEN the backend SHALL answer `boughtSlots` 0 and `allies` `[null, null, null, null]`.  <!-- event-driven -->
3. WHEN a player with `boughtSlots` b below `openSlots` and enough copper calls `POST /team/slots` with `fromSlots` b THEN the backend SHALL take `slotPrices[b]` copper from the wallet, store b + 1 bought slots and answer 200 with `team` and `wallet`.  <!-- event-driven -->
4. IF `fromSlots` differs from the stored `boughtSlots` THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOT_MISMATCH` with the stored `team` in the body and change nothing.  <!-- unwanted-behavior -->
5. IF `boughtSlots` equals `openSlots` and is below 4 THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOT_LOCKED` and change nothing.  <!-- unwanted-behavior -->
6. IF `boughtSlots` is 4 THEN `POST /team/slots` SHALL answer 409 `TEAM_SLOTS_MAX` and change nothing.  <!-- unwanted-behavior -->
7. IF the wallet holds less copper than the price THEN `POST /team/slots` SHALL answer 409 `NOT_ENOUGH_COPPER` and change nothing.  <!-- unwanted-behavior -->
8. IF `fromSlots` is missing, not an integer or negative THEN `POST /team/slots` SHALL answer 400 `INVALID_TEAM_SLOT_REQUEST` and change nothing.  <!-- unwanted-behavior -->
9. WHEN two `POST /team/slots` with the same `fromSlots` arrive together THEN the backend SHALL apply exactly one, take the price once and answer the other 409 `TEAM_SLOT_MISMATCH`.  <!-- event-driven -->
10. WHEN an authenticated player with an unlocked team calls `PUT /team` with 4 entries, each an owned hero id or `null`, no id twice, none equal to the leader and `null` at every index from `boughtSlots` on THEN the backend SHALL store them and answer 200 with `leaderId` and `team`.  <!-- event-driven -->
11. WHEN the same `PUT /team` body is sent twice THEN the backend SHALL answer 200 both times with the same stored team.  <!-- event-driven -->
12. IF the team is not unlocked THEN `PUT /team` SHALL answer 409 `TEAM_LOCKED` and store nothing.  <!-- unwanted-behavior -->
13. IF a hero id sits at an index of `allies` equal to or above `boughtSlots` THEN `PUT /team` SHALL answer 409 `TEAM_SLOT_NOT_BOUGHT` and store nothing.  <!-- unwanted-behavior -->
14. IF an entry names a hero the player does not own THEN `PUT /team` SHALL answer 409 `HERO_NOT_OWNED` and store nothing.  <!-- unwanted-behavior -->
15. IF an entry names an id outside the catalog THEN `PUT /team` SHALL answer 404 `HERO_NOT_FOUND` and store nothing.  <!-- unwanted-behavior -->
16. IF `allies` is missing, does not have exactly 4 entries, holds an entry that is neither a string nor `null`, names a hero twice or names the leader THEN `PUT /team` SHALL answer 400 `INVALID_TEAM` and store nothing.  <!-- unwanted-behavior -->
17. IF a `PUT /team` body breaks two rules THEN the backend SHALL answer the first in the order `INVALID_TEAM`, `HERO_NOT_FOUND`, `TEAM_LOCKED`, `TEAM_SLOT_NOT_BOUGHT`, `HERO_NOT_OWNED`, and IF a `POST /team/slots` breaks two THEN the first in the order `INVALID_TEAM_SLOT_REQUEST`, `TEAM_SLOT_MISMATCH`, `TEAM_SLOTS_MAX`, `TEAM_SLOT_LOCKED`, `NOT_ENOUGH_COPPER`.  <!-- unwanted-behavior -->
18. WHEN a player calls `PUT /leader` with the hero of ally slot n THEN the backend SHALL make it the leader, put the previous leader in slot n and answer `leaderId` and `team`.  <!-- event-driven -->
19. WHEN a player calls `PUT /leader` with an owned hero outside the team THEN the backend SHALL make it the leader and keep `allies` unchanged.  <!-- event-driven -->
20. WHEN an account reset is applied THEN the backend SHALL keep `unlocked`, `openSlots`, `boughtSlots` and `allies`.  <!-- event-driven -->
21. WHILE two team saves of the same player run at once the backend SHALL apply them one after the other, so the stored team equals one of the two bodies.  <!-- state-driven -->
22. IF a team request carries no valid access token THEN the backend SHALL answer 401.  <!-- unwanted-behavior -->
23. The backend SHALL let a player read and change only their own team.  <!-- ubiquitous -->
24. WHEN a user is deleted THEN the backend SHALL delete that user's team row.  <!-- event-driven -->
25. WHILE the migration `V12__hero_team.sql` has run and the previous backend version still serves requests, the previous backend SHALL keep starting and answering (AD-016).  <!-- state-driven -->

**Independent Test**: A backend integration test gives a player the chapter 5 boss win and 15 000 copper: `openSlots` 1, `boughtSlots` 0. A purchase with `fromSlots` 0 answers `boughtSlots` 1 and 5 000 copper (`wallet` 0 gold 50 silver 0 copper); a second one answers 409 `TEAM_SLOT_MISMATCH`, and one with `fromSlots` 1 answers 409 `TEAM_SLOT_LOCKED`. `PUT /team` `["lyra", null, null, null]` answers 200; `["lyra", "orina", null, null]` answers 409 `TEAM_SLOT_NOT_BOUGHT`. After a reset the same `team` comes back.

---

### P1: Ally hits use the one damage ⭐ MVP

**User Story**: As the game owner, I want ally hits to be the same damage as every other strike so that one defense and one set of effects balance the whole game (AD-021).

**Why P1**: The ally hit formula is built on it, and it replaces the team damage type of the first draft.

**Acceptance Criteria**:

1. WHEN an ally hit lands THEN the game SHALL compute it as the ally attacker through the strike of a damage-over-time tick at 100 % (Ally Damage), never critical.  <!-- event-driven -->
2. WHEN Lyra with 0 stars and no pieces is an ally of a FIRE leader against a FIRE monster with defense 50 THEN the game SHALL deal 1 per tick (E2).  <!-- event-driven -->
3. WHEN Vex with 0 stars wears a ring of 50 % armor pierce as an ally of a FIRE leader against a FIRE monster with defense 40 THEN the game SHALL deal 1.6 per tick (E6).  <!-- event-driven -->
4. WHILE Prisão de Espinhos holds the monster the game SHALL multiply every ally hit by `1 + 0.25 f`, so the E1 ally deals 2.5 (E7).  <!-- state-driven -->
5. WHILE Bênção da Grande Árvore runs the game SHALL multiply every ally hit by `1 + 0.30 f`, so the E1 ally deals 2.6 (E8).  <!-- state-driven -->
6. WHILE Brado Aterrador runs on the monster the game SHALL lower the defense an ally hit meets by `30 f` points, floored at 0, so the E1 ally against defense 40 deals 1.8 (E9).  <!-- state-driven -->
7. WHILE the `PHYSICAL_BREAK` talent has a value the game SHALL lower the defense an ally hit meets by that value, floored at 0, so value 5 against defense 40 gives 1.3 (E10).  <!-- state-driven -->
8. WHILE Ventos Ligeiros or Bomba de Fumaça runs, the combo is above 0, or the ally wears critical chance or critical damage, the game SHALL leave ally hits unchanged (E13).  <!-- state-driven -->
9. WHILE the leader has stars or power talents the game SHALL leave ally hits unchanged (E14).  <!-- state-driven -->
10. WHEN a progress payload of the backend before `unified-damage` carries `physicalDefense` 50 and no `defense` THEN the game SHALL make the E1 ally deal 1 (it reads the same `defenseOf` as the click).  <!-- event-driven -->

**Independent Test**: Unit tests pin E1 to E15 through `SkillCombat.allyHit`; an e2e test at chapter 5 with Lyra in slot 1 against a FIRE monster with defense 50 reads 1 damage after 1 s with no click, and 2.5 with Prisão de Espinhos running against defense 0.

---

### P1: Allies fight ⭐ MVP

**User Story**: As a player at chapter 5 or later, I want my allies to hit on their own so that my damage grows as they get stronger.

**Why P1**: It is the reason to have a team.

**Acceptance Criteria**:

1. WHILE the team is active, at least one bought slot holds a hero, a living monster is on screen and the pause menu is closed, the game SHALL land one hit of every fighting ally each time 1000 ms of fight time pass, the first 1000 ms after the monster appears.  <!-- state-driven -->
2. WHEN an ally hit lands THEN the game SHALL use the ally's star multiplier 2, 4, 6, 8, 10, 12, 14, 16, 18 or 20 for 0 to 9 stars.  <!-- event-driven -->
3. WHEN Lyra with 0 stars and no pieces is an ally of a FIRE leader against a FIRE monster with defense 0 THEN the game SHALL deal 2 per tick (E1).  <!-- event-driven -->
4. WHEN Orina with 3 stars, a weapon of 10 click damage at +0 and a ring of +20 % click damage is an ally of a FIRE leader against a NATURE monster with defense 50 THEN the game SHALL deal 105.6 per tick (E3).  <!-- event-driven -->
5. WHEN Lyra with 0 stars and an amulet of +20 % boss damage is an ally of a FIRE leader against a FIRE miniboss with defense 10 THEN the game SHALL deal 2.16 per tick (E4).  <!-- event-driven -->
6. WHEN Lyra has 9 stars and no pieces as an ally against a FIRE monster with defense 0 under a FIRE leader THEN the game SHALL deal 20 per tick (E12).  <!-- event-driven -->
7. WHEN the leader changes THEN the game SHALL use the new leader's element on the next ally hit (E15).  <!-- event-driven -->
8. WHEN an ally fuses to more stars or equips a piece THEN the game SHALL use the new values on the next ally hit.  <!-- event-driven -->
9. WHEN an ally hit brings the monster to 0 health THEN the game SHALL handle the kill exactly as a click kill (coins, campaign report or farm win, once) and SHALL NOT land the hits of the later slots of that tick.  <!-- event-driven -->
10. WHEN an ally tick lands THEN the game SHALL show one number with the sum of that tick's damage (`formatDamage`) in color `#7fd4ff` at 28 px in the damage font, at x 740 (the monster centre + 70).  <!-- event-driven -->
11. WHEN an ally hit lands THEN the game SHALL leave the combo streak and its timer unchanged.  <!-- event-driven -->
12. WHEN an ally hit lands without killing THEN the game SHALL update the health bar and the HP text.  <!-- event-driven -->
13. WHILE the campaign chapter is below 5 and the campaign is not completed, the game SHALL land no ally hit and apply no passive.  <!-- state-driven -->
14. WHILE a hero screen is open or the tab is hidden the game SHALL keep landing ally hits as the fight runs (`background-fight`).  <!-- state-driven -->
15. WHILE the pause menu is open the game SHALL land no ally hit, and the time toward the next tick SHALL stay where it was.  <!-- state-driven -->

**Independent Test**: In the browser against the fake backend at chapter 5 with slot 1 bought, Kael (FIRE) as leader and Lyra 0 stars in slot 1, a FIRE phase monster of 10 health with defense 0 reads 8 health and a light-blue `2` after 1 s with no click. After a stubbed reset to chapter 1, a monster takes no damage for 3 s.

---

### P1: Equipe screen and slot purchase ⭐ MVP

**User Story**: As a player, I want to buy slots and choose my allies in one screen so that I build the team I want.

**Why P1**: Without it the player cannot buy slots or see the team.

**Acceptance Criteria**:

1. WHILE the team is unlocked the game SHALL show a seventh HUD button `Equipe` (`data-testid="hud-team"`) right after `hud-leader`, with the Lucide `swords` icon at 22 px and stroke 2.75, and WHILE it is not unlocked the button SHALL be absent from the DOM.  <!-- state-driven -->
2. WHILE the rail shows seven buttons the game SHALL keep the rail's bottom above the battle bar (y 624 in scene px).  <!-- state-driven -->
3. WHEN the player opens Equipe THEN the game SHALL show a panel titled `Equipe` with 5 slot cards of 132 x 210 px in a row, 16 px apart (`team-slot-0` to `team-slot-4`): slot 0 labelled `Líder` with a 3 px solid border `#e8b64c`, slots 1 to 4 labelled `Aliado 1` to `Aliado 4`.  <!-- event-driven -->
4. WHEN a slot holds a hero THEN its card SHALL show the hero's sprite at 80 x 80, the name and `<stars>★`; an ally card (`data-state="filled"`) SHALL also show `Dano: <n>/s` and `<passive name>: <passive text>`, and the leader card (`data-state="leader"`) its leader bonus text.  <!-- event-driven -->
5. WHEN a bought slot is empty THEN its card SHALL have a 2 px dashed border and the text `vazio` (`data-state="empty"`).  <!-- event-driven -->
6. WHEN a slot is open, not bought and the next slot to buy THEN its card SHALL be transparent with a 2 px solid `--gold-400` border, a 32 x 32 gold coin and the price in ouro (`1`, `2`, `3` or `4`) (`data-state="buyable"`).  <!-- event-driven -->
7. WHEN a slot is not open THEN its card SHALL show the coin and price at opacity 0.5 with `Chefe do capítulo <4+n>`, be disabled and take no click (`data-state="locked"`).  <!-- event-driven -->
8. WHEN a slot is open but an earlier slot is not bought THEN its card SHALL show the coin and price at opacity 0.5 with no chapter text, be disabled and take no click (`data-state="waiting"`).  <!-- event-driven -->
9. WHEN the player opens Equipe THEN the game SHALL list the owned heroes outside the team under `Heróis disponíveis` (sprite 64 x 64, name, `<stars>★`, passive name, `data-testid="team-available-<id>"`), or `Todos os heróis estão na equipe.` when there is none.  <!-- event-driven -->
10. WHEN the player clicks an available hero while a bought slot is selected THEN the game SHALL put the hero in that slot (replacing its hero, if any) and send `PUT /team` with the new 4 entries.  <!-- event-driven -->
11. WHEN the player clicks an available hero while no bought slot is selected and a bought slot is empty THEN the game SHALL put the hero in the first empty bought slot and send `PUT /team`.  <!-- event-driven -->
12. WHILE no bought slot is selected and no bought slot is empty the game SHALL disable every available hero entry.  <!-- state-driven -->
13. WHEN the player clicks a filled or empty ally card THEN the game SHALL select it (`data-selected="true"`, 3 px `--ember-500` outline) and unselect any other card.  <!-- event-driven -->
14. WHILE a filled ally card is selected the game SHALL enable `Remover` and `Tornar líder`, and WHILE none is selected it SHALL disable them.  <!-- state-driven -->
15. WHEN the player presses `Remover` THEN the game SHALL empty the selected slot, send `PUT /team` and keep that slot selected.  <!-- event-driven -->
16. WHEN the player presses `Tornar líder` THEN the game SHALL send `PUT /leader` with the selected hero, show the leader and allies of the answer (the old leader in that slot) and clear the selection.  <!-- event-driven -->
17. WHILE a team, leader or purchase request runs the game SHALL disable every slot card, available entry and action button of the panel body, and keep `Fechar` enabled.  <!-- state-driven -->
18. WHEN the player opens Equipe THEN the game SHALL show `Dano da equipe: <n>/s` with the sum of the allies' shown damage per second (`formatDamage`, `0` with no ally).  <!-- event-driven -->
19. WHILE the campaign chapter is below 5 and the campaign is not completed, the panel SHALL show `A equipe luta a partir do capítulo 5.`  <!-- state-driven -->
20. IF a save or leader request fails THEN the game SHALL show `Não foi possível salvar a equipe.` in the panel error line, keep the panel open and reload the heroes from the backend.  <!-- unwanted-behavior -->
21. WHEN the first win of the chapter 5, 6, 7 or 8 boss is answered and the next encounter appears THEN the game SHALL reload the heroes, so the matching slot is buyable the next time Equipe opens and the `Equipe` button appears after the chapter 5 win without a page reload.  <!-- event-driven -->
22. WHEN the game shows `Dano: <n>/s` or `Dano da equipe: <n>/s` THEN it SHALL write `<n>` with `formatDamage`: 105.6 reads `105.6`, 12 500 reads `12.5K`.  <!-- event-driven -->
23. IF Equipe is closed or another screen opens while a team, leader or purchase request runs THEN the game SHALL keep the collection and wallet the answer brings, render nothing for it, and show the stored team with every control enabled the next time Equipe opens.  <!-- unwanted-behavior -->

**Independent Test**: In the browser against the fake backend with the chapter 5 boss won and 1 ouro, open Equipe: `Líder` holds the leader, `Aliado 1` shows the coin and `1`, `Aliado 2` to `Aliado 4` show `Chefe do capítulo 6` to `8`. Buy slot 1 and read `Vaga de aliado comprada!` and `vazio`; click Lyra and read her in `Aliado 1` with `Dano: 2/s`.

---

### P1: Slot purchase dialog ⭐ MVP

**User Story**: As a player, I want to confirm a slot purchase and see it land so that I never spend gold by accident.

**Why P1**: The only way to open an ally slot.

**Acceptance Criteria**:

1. WHEN the player clicks a buyable slot THEN the game SHALL show the dialog `Comprar a vaga <n> por <p> ouro?` with `Comprar` and `Cancelar` under the slot row, and send no request.  <!-- event-driven -->
2. IF the wallet holds less copper than the price when the dialog shows THEN the game SHALL disable `Comprar` and show `Moedas insuficientes`.  <!-- unwanted-behavior -->
3. WHEN the player presses `Comprar` THEN the game SHALL send `POST /team/slots` with `fromSlots` equal to the bought count it shows and disable `Comprar` and `Cancelar` until the answer.  <!-- event-driven -->
4. WHEN the purchase answers 200 THEN the game SHALL close the dialog, set `data-flash="true"` on the new slot for 400 ms, show `Vaga de aliado comprada!` for 3000 ms, show the answered wallet in the HUD, and show the new slot `empty` and selected.  <!-- event-driven -->
5. WHEN the player presses `Cancelar` THEN the game SHALL close the dialog and send no request.  <!-- event-driven -->
6. IF a purchase fails THEN the game SHALL close the dialog, show `Não foi possível comprar a vaga.`, keep the panel open and reload the heroes from the backend.  <!-- unwanted-behavior -->

**Independent Test**: With 1 ouro and slot 1 open, click `Aliado 1`, read `Comprar a vaga 1 por 1 ouro?`, press `Cancelar` and see no request; click again, press `Comprar`, read `Vaga de aliado comprada!` and a wallet of 0. With 0.5 ouro, `Comprar` is disabled next to `Moedas insuficientes`.

---

### P2: Ally passives

**User Story**: As a player, I want each ally to bring its own passive so that the composition changes how I beat bosses.

**Why P2**: The damage of P1 already makes the team useful; passives add the strategy.

**Acceptance Criteria**:

1. WHEN a miniboss or a chapter boss appears with Kael as a fighting ally THEN the game SHALL start its countdown 5 s longer, on top of the talent and equipment seconds: a 30 s miniboss reads `Time: 35`, with `MINIBOSS_TIME` value 4 `Time: 39`, a 60 s chapter boss `Time: 65` (P1 to P3).  <!-- event-driven -->
2. WHILE Lyra is a fighting ally the game SHALL add 10 points to the critical chance of the leader's clicks and skill hits, capped at 100 (P4, P5).  <!-- state-driven -->
3. WHILE Orina is a fighting ally the game SHALL lower the defense of every monster by 15 points for every hit, after the `PHYSICAL_BREAK` talent, never below 0, and show the lowered defense in the enemy line (P6, P7, E11).  <!-- state-driven -->
4. WHILE Vex is a fighting ally the game SHALL lower the critical resistance of every monster by 15 points for the leader's hits, after the `CRIT_RESIST_BREAK` talent, never below 0, and show it in the enemy line (P8, P9).  <!-- state-driven -->
5. WHILE Seraphine is a fighting ally the game SHALL multiply every ally hit by 1.25, so Lyra 0 stars and Seraphine 0 stars deal 5 per tick against a FIRE monster with defense 0 under a FIRE leader (E5).  <!-- state-driven -->
6. WHILE a hero is the leader the game SHALL NOT apply that hero's passive.  <!-- state-driven -->
7. WHILE the team is inactive the game SHALL apply no passive.  <!-- state-driven -->
8. WHEN the team changes THEN the game SHALL apply the new allies' passives to the next hit and the next boss that appears, and a countdown already running SHALL keep its time.  <!-- event-driven -->
9. WHEN the player opens Equipamento with passives applying THEN the attribute panel SHALL include them (P10).  <!-- event-driven -->
10. WHILE Kael is a fighting ally in a farm fight of a boss the game SHALL start that countdown 5 s longer too.  <!-- state-driven -->

**Independent Test**: Unit tests pin P1 to P10 and E5, E11; an e2e test with Kael as a fighting ally reads a miniboss countdown starting at `Time: 35`, and one with Orina reads the enemy chip `Defesa 25%` on a monster of defense 40.

---

### P2: Allies on the field

**User Story**: As a player, I want to see my allies fight next to my leader so that the team feels alive.

**Why P2**: The damage works without it; the owner wants it visible.

**Acceptance Criteria**:

1. WHILE the team is active and the heroes are loaded, the game SHALL draw every hero of a bought, filled ally slot with its sprite `hero_<id>` fitted in a 90 x 120 px box, origin (0.5, 1), at (180, 460), (180, 605), (75, 462) or (75, 615) for slots 1 to 4, at depth 0.4 for slots 1 and 2 and 0.3 for slots 3 and 4.  <!-- state-driven -->
2. WHILE at least one ally is drawn the game SHALL draw the leader fitted in a 180 x 240 px box at (320, 600) at depth 0.5, and WHILE no ally is drawn it SHALL draw the leader 320 px high at (230, 612) as today.  <!-- state-driven -->
3. WHEN Kael is drawn in an ally slot THEN his sprite SHALL measure 90 x 83.7 px (scale 0.3), and WHEN Lyra is drawn there THEN 40.8 x 120 px (scale 0.4).  <!-- event-driven -->
4. WHEN Kael is the leader in the formation THEN his sprite SHALL measure 180 x 167.4 px (scale 0.6), and WHEN Lyra is THEN 81.6 x 240 px (scale 0.8).  <!-- event-driven -->
5. WHEN an ally hit lands THEN the game SHALL move that ally's sprite 24 px to the right (toward the monster) in 100 ms and back to its place in 100 ms.  <!-- event-driven -->
6. WHEN a slot's hero changes, is removed or becomes the leader THEN the game SHALL redraw the allies and the leader without reloading the scene.  <!-- event-driven -->
7. WHEN the team turns inactive (a reset to chapter 1) or active (the campaign reaches chapter 5) THEN the game SHALL redraw the field at the next encounter.  <!-- event-driven -->
8. WHILE the team is inactive, a slot is empty or not bought, or the heroes have not loaded, the game SHALL draw no sprite for that slot.  <!-- state-driven -->
9. The ally sprites SHALL take no input: a click on one reaches the canvas and hits the monster exactly as if the sprite were not there.  <!-- ubiquitous -->

**Independent Test**: At chapter 5 with Lyra in slot 1 and Seraphine in slot 2, the leader stands at (320, 600) and two sprites stand at (180, 460) and (180, 605), each moving on every tick. After `Remover` on both, the leader is back at (230, 612), 320 px high.

---

## Edge Cases

- WHEN a player resets before ever winning the chapter 5 boss THEN `unlocked` SHALL stay false and the `Equipe` button absent.
- WHEN a player with bought slots resets THEN the allies SHALL NOT fight in chapters 1 to 4 and SHALL fight again from chapter 5 stage 1 phase 1.
- WHEN a player stands in chapter 5 before winning its boss for the first time THEN the team SHALL be active with no bought slot, so nothing changes.
- WHEN the team holds 0 allies THEN the game SHALL land no ally hit, apply no passive and draw no ally.
- WHEN the chapter is complete and no monster is on screen THEN the game SHALL land no ally hit.
- WHEN the monster dies between two ticks THEN the time toward the next tick SHALL start again at 0 for the next monster.
- WHEN the pause menu stays open 10 s THEN no ally hit SHALL land, and the first hit after closing it SHALL come after the time still missing from the 1000 ms (L-026).
- WHEN a farm fight runs while the campaign is at chapter 5 or later THEN ally hits and passives SHALL apply as in the campaign, whatever chapter the farm fight replays.
- WHEN `PUT /leader` names the current leader THEN the team SHALL stay unchanged.
- WHEN a hero added to the catalog later is owned THEN it SHALL NOT enter a saved team on its own.
- IF ally kills come faster than the kill allowance THEN the wallet SHALL drop their coins as for clicks (AD-002, unchanged).
- WHEN an ally hit lands in the frame where Prisão de Espinhos or Bênção da Grande Árvore ends THEN it SHALL still get the effect (same rule as ticks and the aimed shot).
- WHEN one advance of the scene spans 2500 ms with a fighting ally THEN the game SHALL land two ticks (at 1000 ms and 2000 ms) and keep 500 ms toward the third.
- WHEN a progress payload has no `team` field in `GET /heroes` (a backend before this feature) THEN the game SHALL treat the team as locked and play as today.
- WHEN Orina and the `PHYSICAL_BREAK` talent together lower the defense below 0 THEN the defense SHALL be 0.
- WHEN Lyra's passive and the leader's own critical chance pass 100 THEN the critical chance SHALL be 100.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TEAM-01 | P1: Team and slots on the backend - AC 1, 2 (read) | Tasks | In Tasks |
| TEAM-02 | P1: Team and slots on the backend - AC 3 to 9, 17 (slot purchase) | Tasks | In Tasks |
| TEAM-03 | P1: Team and slots on the backend - AC 10 to 17, 21 (team save) | Tasks | In Tasks |
| TEAM-04 | P1: Team and slots on the backend - AC 18 to 20, 22 to 25 (leader swap, reset, auth, deletion, migration) | Tasks | In Tasks |
| TEAM-05 | P1: Ally hits use the one damage - AC 1 to 10 (rewritten 2026-11-19; was the team damage type and resistance) | Tasks | In Tasks |
| TEAM-06 | P1: Allies fight - AC 2 to 8 (formula and sources) | Tasks | In Tasks |
| TEAM-07 | P1: Allies fight - AC 1, 9, 11 to 15 (rhythm, kill, gates) | Tasks | In Tasks |
| TEAM-08 | P1: Allies fight - AC 10 (damage number) | Tasks | In Tasks |
| TEAM-09 | P1: Equipe screen - AC 1 to 9, 18, 19, 21, 22 (screen, slot states, HUD button) | Tasks | In Tasks |
| TEAM-10 | P1: Slot purchase dialog - AC 1 to 6 | Tasks | In Tasks |
| TEAM-11 | P2: Ally passives - AC 1 to 10 | Tasks | In Tasks |
| TEAM-12 | P2: Allies on the field - AC 1 to 9 | Tasks | In Tasks |
| TEAM-13 | P1: Equipe screen - AC 10 to 17, 20, 23 (team editing, busy, failure) | Tasks | In Tasks |

**Coverage:** 13 total, 13 mapped to tasks (`tasks.md`), 0 unmapped

---

## Success Criteria

- [ ] A player below chapter 5, or who never beat the chapter 5 boss, sees no change in combat and the rail keeps six buttons.
- [ ] Unit tests pin the ten star multipliers, E1 to E15, P1 to P10 and each passive with exact numbers.
- [ ] An e2e test buys slot 1 against the fake backend, places an ally, and reads the ally's damage and its sprite moving.
- [ ] A backend integration test proves slots and allies survive a reset and a double purchase pays once.
- [ ] `grep -rn -i "team_resistance\|teamResistance\|TEAM_DAMAGE" backend/src game/src` prints nothing after the feature.
