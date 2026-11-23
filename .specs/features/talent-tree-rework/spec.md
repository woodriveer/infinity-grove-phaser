# Talent Tree Rework Specification

## Problem Statement

Three talents stopped pulling their weight and the Talentos screen is a plain list of cards. (1) `BOSS_TIME` (TIME branch) only adds seconds to the chapter boss; the owner wants the branch to be about hunting bosses, so it becomes boss damage. (2) Players reach 100 % critical chance in mid game, and the multiplicative critical resistance (`critChance x (1 - critResistance / 100)`, `game/src/domain/combat/damage.js:19`) then makes the real chance unreadable, while every point above 100 is thrown away (`attackerFor` caps at 100). `CRIT_RESIST_BREAK` only fed that formula. (3) The combo has a fixed step of 1 % a click (`COMBO_STEP_PERCENT`), so the cap of the COMBO talent takes 50 clicks to reach. (4) The tree is four columns of DOM cards (`game/src/adapters/phaser/views/talentsView.js`); the owner wants a painted fantasy tree whose veins light up as points are spent. The owner approved the proposal on 2026-11-23; this spec turns it into testable rules.

## Goals

- [ ] The TIME branch, shown as `Caça aos chefes`, sells boss damage (+2 % a level x grade, 120 % for the whole chain) instead of chapter boss time, and every point a player had in `BOSS_TIME` or `CRIT_RESIST_BREAK` is available again after the deploy.
- [ ] The effective critical chance is `clamp(chance - resistance, 0, 100)`, every point above 100 adds 1 % critical damage on a critical hit, and the enemy line shows `Seu crítico: <n>%` against the monster on screen.
- [ ] `Perfuração de armadura` replaces `Quebra de resistência a crítico` in the BREAK branch, and `Fúria crescente` (4 levels) raises the combo step from 1 % to up to 5 % a click.
- [ ] The Talentos screen is a painted tree with clickable nodes, lit veins per branch and a detail card, and works with every art file missing.
- [ ] `PROMPTS_ASSETS_UI.md` holds a Gemini prompt for each of the 17 new images (written with this spec).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Generating the art | The owner generates it with Gemini from `PROMPTS_ASSETS_UI.md`; the game ships with the fallbacks first |
| Calibrating the node coordinates on the painted background | Done after the owner sends `talent-tree-bg.jpg`, the same flow as the Rever chefes map (`mapLayout.js`); a follow-up `game-dev` task changes only `talentTreeLayout.js` |
| Boss damage and armor pierce talents on allies | The two talents feed the leader attacker only, like every other attacker talent (D2, Q1) |
| Animations (pulsing glow, sap flowing in the veins, node unlock burst) | Static states keep the e2e reads stable; can be a polish feature |
| A notice or mail about the refunded points | Same rule as the retired magical break of AD-021: points only, no notice (D4) |
| Changing `MINIBOSS_TIME`, the equipment affix `BOSS_TIME_SECONDS` or Kael's 5 s passive | Not part of the request; the chapter boss keeps its equipment and Kael time |
| Balance testing of the new numbers | No balance tooling; the numbers are the owner's (D1) and product owner defaults (Q5, Q7) |
| Larger text on phones (TD-010) | The phone layout zooms the tree (D16) but the rest of the panel keeps its size; TD-010 stays open |
| Server-side combat or checks of the damage | Damage is computed in the browser (AD-002) |
| Deleting the retired icon files (`talent-boss-time*.png`, `talent-break-crit*.png`) | No code reads them after this feature; removing art is the owner's call |

---

## Assumptions & Open Questions

Rows `y` were decided by the owner in the approved proposal (relayed by the orchestrator on 2026-11-23). Rows `n (Q<n>)` are product owner defaults; the spec is written with them and they wait for the owner's answer to the question below the table.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Boss damage talent | `BOSS_DAMAGE` replaces `BOSS_TIME` at the same place of the catalog (index 1 of each grade block): branch `TIME`, label `Dano contra chefes`, unit `%`, 2 % a level x grade (grade 1, 2, 3 worth 20, 40, 60 at level 10; 120 for the chain), max level 10, grade N costs N points a level. Its value adds to the attacker's `bossDamage` with the equipment `BOSS_DAMAGE_PCT`; `bossDamage` applies against a miniboss and a chapter boss, campaign or farm (`calculateDamage` `boss` flag) | Owner decision; same grade rule as every talent (AD-017) | y |
| D2 Who gets boss damage and armor pierce | The leader attacker (`leaderAttacker`): manual click, auto click, every skill hit, the delayed aimed shot and every damage-over-time tick of the leader. Allies keep the boss damage and armor pierce of their own pieces only | Every attacker talent (click damage, critical) feeds only the leader today; allies have their own formula (AD-018) | n (Q1) |
| D3 Chapter boss time | No talent adds time to the chapter boss: its limit is the stage limit + equipment `BOSS_TIME_SECONDS` + Kael's 5 s (team passive). `MINIBOSS_TIME` keeps adding to a miniboss (campaign and farm) | Owner decision | y |
| D4 Refund of retired talents | `V15__talent_tree_rework.sql` deletes every `player_talents` row of `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2`, `CRIT_RESIST_BREAK_G3`; the points come back through the derived balance (`available = earned - spent`). No coins, no notice. A row of these ids written later (previous backend during the deploy window) is ignored by `PlayerTalents.fromStored`, so its points count as available | Owner decision: the retired-talent pattern of AD-021; a data-only delete keeps the previous backend working (it reads a missing row as level 0, AD-016) | y |
| D5 Critical model | Effective chance `E = min(100, max(0, C - R))` with `C` the attacker's critical chance and `R` the defender's critical resistance after breaks; a strike is critical when `roll x 100 < E` or when it is forced. Overflow `O = max(0, C - R - 100)`; a critical strike uses the critical multiplier `critMultiplier + O / 100` | Owner decision | y |
| D6 Overflow on forced criticals | A forced critical (the aimed shot of Tiro Preciso, both hits of Lyra's double click) also gets `+O / 100` | One rule for every critical strike (L-105); a forced hit is still a critical hit | n (Q2) |
| D7 Critical chance has no cap | `C` is the plain sum: 10 base + star bonus + `CRIT_CHANCE` affixes + `CRIT_CHANCE` talents + Lyra's 10 (team passive) + Fumaça's 15 x level factor during the buff. The attribute panel line shows that sum (`Chance de crítico: 130%`) | The owner wants the chance above 100 to count; a capped panel would hide it | n (Q2) |
| D8 Enemy line chip | The third chip (`data-stat="crit"`, the red target icon) reads `Seu crítico: <E>%`, `E` computed for the leader's click against the current target after the break talents and the team passives, without running skill buffs (Fumaça) and without the overflow; at most one decimal, no trailing zero | Owner decision for the text; the buffs and the overflow are left out so the chip does not flicker during a skill and stays one short number | n (Q3) |
| D9 Vex's Lâminas Sombrias | Unchanged: `-15` on the critical resistance, never below 0, text `-15 de resistência a crítico dos inimigos`. Under the new model it is +15 effective chance against a monster with resistance 15 or more, and less below that | Keeps the hero text and the `hero-team` balance; an additive +15 chance would duplicate Lyra's passive | n (Q4) |
| D10 Armor pierce talent | `ARMOR_PIERCE` replaces `CRIT_RESIST_BREAK` at the same place of the catalog (index 3 of each grade block): branch `BREAK`, label `Perfuração de armadura`, unit `%`, 1 % a level x grade (10, 20, 30 at level 10; 60 for the chain). Its value adds to the attacker's `armorPierce` with the `ARMOR_PIERCE_PCT` affixes; `calculateDamage` keeps the cap at 100 and applies it after the break points (`defense after breaks x (1 - min(100, pierce) / 100)`) | Same per-level budget as the talent it replaces and as `PHYSICAL_BREAK` (1 a level, 60 for the chain). 2 % would reach the 100 cap from the talent alone (120) and waste 20; 1 % leaves room for the equipment pierce (9 to 30 per affix) to matter | n (Q5) |
| D11 Labels and texts | Branch `TIME` title `Caça aos chefes` (owner). Labels `Dano contra chefes`, `Perfuração de armadura`, `Fúria crescente`. Effect texts: `Efeito: +20%` (boss damage and armor pierce, unit `%`), `Efeito: +<1 + n>% por clique` for Fúria crescente at level n >= 1 (`+2% por clique` at level 1, `+5% por clique` at level 4), `Efeito: nenhum` at level 0. Lock texts: a grade `Bloqueado: chegue ao nível 10 do Grau <N - 1>` (unchanged), Fúria crescente `Bloqueado: chegue ao nível 10 de Limite de dano do combo` | AD-007 Portuguese; the Fúria text states the step the player gets, the way the owner described it (+2 % a click at level 1) | n (Q6) |
| D12 Fúria crescente | `COMBO_FURY`: branch `COMBO`, unit `combo-step`, 1 a level, max level 4, one grade (`grade` 1, `baseId` `COMBO_FURY`), 2 points a level (8 for the talent), last in the catalog (index 27). It opens when `COMBO` (grade 1) is at level 10 (else 409 `TALENT_LOCKED`). The combo step is `1 + level` percent a click; the cap stays the COMBO talent | Owner decision for the step, the max and the unlock. The cost is a default: it opens at the same moment as COMBO grade 2, so it costs what a grade 2 level costs | n (Q7) |
| D13 Prerequisite in the API | Every talent of `GET /talents` (and of the upgrade and reset answers) carries `requiredId` (string or null) and `requiredLevel` (integer or null): null and null for grade 1 and for any talent that is always open; the previous grade id and 10 for grade 2 and 3; `COMBO` and 10 for `COMBO_FURY`. Both fields are always present (null serialized) | AD-011: the game types no number of the catalog; the lock text of Fúria needs the talent and the level that open it | y |
| D14 Layout coordinates | The node, banner and glow coordinates of `talentTreeLayout.js` (design § Layout map) are provisional; they are recalibrated on the painted background once the owner sends it, by a follow-up task that changes only that file | Owner decision (the replay map flow) | y |
| D15 Detail card | Clicking a node selects it (no request) and the card at the bottom shows its name (`<label>` or `<label> (Grau N)`), `Nível <level>/<max>`, `Efeito: <effect>`, then exactly one of: the button `Melhorar (<cost> ponto[s])`, `Nível máximo`, or the lock text. With nothing selected it reads `Escolha um talento na árvore para ver os detalhes.`. Opening the screen clears the selection; an upgrade, a reset, a 409 reload and a points reload keep it | The owner asked for the details on click; one card keeps the tree uncluttered | n (Q8) |
| D16 Narrow screens | On a viewport narrower than 641 px (`@media (max-width: 640px)`), the tree board is drawn at `zoom: 2` (2048 x 1152 inside the 1024 x 576 window) in a box that scrolls on both axes; it opens centred (scroll 512, 288) and keeps its scroll across re-renders. The title plaque, the points medallion, the reset button, the detail card and the close button stay fixed over it | The canvas is scaled to fit (TD-010): at 390 x 844 the window shows at about 0.38, so the 60 px nodes would be 23 px on screen; the zoom makes them 46 px. Horizontal-only scrolling would need a second, wide layout and a second painted image | n (Q9) |
| D17 Lit veins | Each branch has a lit layer (`talent-tree-bg-lit.jpg` masked by an ellipse around the branch) with opacity `0` while the branch has no level, else `round2(0.2 + 0.8 x L / M)`, `L` the sum of the levels and `M` the sum of the max levels of the talents of that branch in the list | The owner asked for opacity growing with the points spent; levels are in the payload, prices are not (AD-011), and 0.2 makes the first level visible | n (Q8) |
| D18 Node marks | A grade 1 node and Fúria crescente carry a caption under them (the label); grade 2 and 3 nodes carry a badge `II` or `III` on the frame and no caption. Every node shows a level chip `<level>/<max>` and a native tooltip (`title`) with its full name | 28 captions do not fit the tree; the badge tells the grades apart while the grade icons are missing | n (Q8) |
| D19 Assets | New files in `game/public/assets/`: `talent-tree-bg.jpg`, `talent-tree-bg-lit.jpg`, `talent-node-frame.png`, `talent-node-frame-large.png`, `talent-node-lock.png`, `talent-banner.png`, `talent-title-plaque.png`, `talent-close-button.png`, `talent-points-medallion.png`, `talent-reset-button.png`, `talent-boss-damage.png` (+ `-g2`, `-g3`), `talent-armor-pierce.png` (+ `-g2`, `-g3`), `talent-combo-fury.png`. The armor pierce icons were not in the owner's list; the talent needs them | Owner decision except the armor pierce icons | n (Q10) |
| D20 Kept test ids | Kept: `talent-screen`, `talent-points` (text `Pontos de talento: <n>`), `talent-reset` (`Reiniciar pontos`), `talent-<ID>` (now the node), `talent-level-<ID>`, `talent-effect-<ID>`, `talent-upgrade-<ID>`, `talent-locked-<ID>`, `talent-max-<ID>` (now inside the detail card, only for the selected talent), `talent-branch-<BRANCH>` (now the banner), `.talent-branch-title`, `talents-unavailable`, `hero-close`. Dropped: `talent-grade-<BRANCH>-<N>`, `.talent-column`, `.talent-card` | The owner asked to keep what the e2e relies on where sensible; a test now clicks the node before it reads the card | n (Q8) |
| D21 Deploy window | A game newer than the backend drops the six retired ids (`RETIRED_TALENT_IDS`) and draws no node for a talent missing from the list (`BOSS_DAMAGE`, `ARMOR_PIERCE`, `COMBO_FURY` stay empty spots). A game older than the backend shows `COMBO_FURY` as a card of the old screen until the Worker is republished (same workflow run, AD-023) | Same tolerance as AD-021; both sides deploy minutes apart | n (Q11) |
| D23 Art direction | The tree follows the Gemini prompt draft written earlier in this session (`prompts-arvore-talentos.md`, now merged into `PROMPTS_ASSETS_UI.md` §§ 6 and 7): a 16:9 background (1024 x 576 window, the full width of the canvas), a trunk with roots and an empty clearing at the bottom centre (the detail card sits there), four boughs: far left `TIME` (turquoise), upper left `BREAK` (ember red), upper right `POWER` (gold), far right `COMBO` (violet, with Fúria crescente); plaques with a light parchment face (branch titles in the branch ink, `Talentos` in dark ink); a 3:1 wooden close button with `Fechar` written on it; a round medallion and a round reset button, each next to a text pill | The owner may already be generating the art from that draft; the layout follows it instead of asking for new art | n (Q12) |
| D22 Decision record | AD-029 in `STATE.md` (proposed): the subtractive critical model with overflow and no cap (supersedes "critical chance caps at 100" of AD-012), the catalog of 27 graded talents plus single talents with an explicit prerequisite and cost (amends AD-017 and AD-021), and the painted tree screen (supersedes the Talentos part of `ui-redesign` UIR-14) | Project-level rules future features must follow | n (Q11) |

**Open questions** (each has a recommended default; the spec is written with it):

- Q1 (D2) Boss damage and armor pierce talents count for the leader's strikes only (click, auto click, skills, aimed shot, damage over time), not for the allies. Recommended: yes.
- Q2 (D6, D7) Critical chance has no cap anywhere (the panel can show `130%`), and the overflow damage also applies to forced critical hits (Tiro Preciso, Lyra's double click). Recommended: yes.
- Q3 (D8) The chip `Seu crítico: <n>%` shows the click's chance against the target without skill buffs and without the overflow. Recommended: yes.
- Q4 (D9) Vex keeps `-15 de resistência a crítico dos inimigos` as it is. Recommended: yes.
- Q5 (D10) Perfuração de armadura gives 1 % a level per grade (10 %, 20 %, 30 %, 60 % for the chain), leader only. Recommended: yes.
- Q6 (D11) Labels and texts: `Dano contra chefes`, `Perfuração de armadura`, `Fúria crescente`, `+2% por clique` (level 1) to `+5% por clique` (level 4), and the lock text of Fúria. Recommended: yes.
- Q7 (D12) Fúria crescente costs 2 talent points a level (8 in total). Recommended: yes.
- Q8 (D15, D17, D18, D20) Tree details: the detail card and its empty text, the vein opacity formula, captions only under grade 1 nodes (II / III badges on the others), the kept and dropped test ids. Recommended: yes.
- Q9 (D16) Phones: the tree is zoomed 2x and scrolls on both axes, opening centred. Recommended: yes (alternative: no zoom, the whole tree at the size of the desktop layout, about 23 px nodes on a 390 px phone).
- Q10 (D19) Add `talent-armor-pierce.png`, `-g2`, `-g3` to the art list. Recommended: yes.
- Q11 (D21, D22) Deploy window behaviour and AD-029 as written. Recommended: yes.
- Q12 (D23) The art follows the prompt draft of this session (16:9 tree, COMBO on the far-right bough, parchment plaques, round medallion and reset button); if you already generated images from it, send the background so the coordinates get calibrated. Recommended: yes.

Open questions: none beyond Q1 to Q12 above, each written into the spec with its recommended default (the owner answers them when approving).

---

## User Stories

### P1: Hunt bosses with the TIME branch ⭐ MVP

**User Story**: As a player, I want the first branch of the tree to raise my damage against minibosses and chapter bosses, so that the points I spend there make boss fights shorter instead of only longer.

**Why P1**: It replaces a talent players already own; the refund (P1 Retired) depends on it shipping.

**Acceptance Criteria**:

1. WHEN a player calls `GET /talents` THEN the backend SHALL answer, at indexes 1, 10 and 19 of the 28 talents, `BOSS_DAMAGE`, `BOSS_DAMAGE_G2` and `BOSS_DAMAGE_G3` with branch `TIME`, label `Dano contra chefes`, unit `%`, `perLevel` 2, 4 and 6, `maxLevel` 10 and, at level 10, `value` 20, 40 and 60, and no talent with an id `BOSS_TIME`, `BOSS_TIME_G2` or `BOSS_TIME_G3`.  <!-- event-driven -->
2. IF a player calls `POST /talents/BOSS_TIME/upgrade` (or `_G2`, `_G3`) THEN the backend SHALL answer 404 with code `TALENT_NOT_FOUND` and store nothing.  <!-- unwanted-behavior -->
3. WHEN the leader strikes a miniboss or a chapter boss (campaign or farm) THEN the game SHALL multiply the strike by `1 + (B_pieces + B_talents) / 100`, `B_pieces` the `BOSS_DAMAGE_PCT` of the leader's worn pieces and `B_talents` the sum of the values of `BOSS_DAMAGE`, `BOSS_DAMAGE_G2` and `BOSS_DAMAGE_G3`: a 0-star Kael (base 1, FIRE) with `BOSS_DAMAGE` at level 10 (value 20) and `BOSS_DAMAGE_G2` at level 5 (value 20) deals 1.4 to a FIRE chapter boss of defense 0 on a roll of 0.99, and 1.68 when it also wears a non-weapon piece whose only affix is `BOSS_DAMAGE_PCT` 28.  <!-- event-driven -->
4. WHEN the same leader strikes a phase monster THEN the game SHALL apply no boss damage: the click of AC 3 deals 1.  <!-- event-driven -->
5. The game SHALL apply the boss damage of AC 3 to every strike kind of the leader against a boss: manual click, auto click, skill hit, the delayed aimed shot and each damage-over-time tick.  <!-- ubiquitous -->
6. WHEN a chapter boss fight starts (campaign or farm) THEN the game SHALL set its limit to the stage limit + the `BOSS_TIME_SECONDS` of the leader's worn pieces x 1000 + Kael's 5000 ms when Kael fights as an ally, with no talent milliseconds: a 60 000 ms boss with no pieces and no Kael shows `Time: 60`, even when the talent list still carries `BOSS_TIME` at level 10 (an older backend).  <!-- event-driven -->
7. WHEN the Talentos screen opens THEN the banner of branch `TIME` SHALL read `Caça aos chefes`, and the four branch titles SHALL read, in DOM order, `Caça aos chefes`, `Quebra de defesa`, `Poder do clique`, `Combo`.  <!-- event-driven -->
8. WHEN the Equipamento screen shows a 0-star Kael with no pieces, `BOSS_DAMAGE` at level 10 and no Kael ally THEN the attribute panel SHALL read `Dano em chefes: 20%` and `Tempo extra de chefe: 0s`.  <!-- event-driven -->

**Independent Test**: Log in with `BOSS_DAMAGE` 10 and click a chapter boss: it loses 1.2 times what the same click takes from it without the talent, and a phase monster loses the same with or without it; the boss timer starts at the stage limit; the tree banner reads `Caça aos chefes`.

---

### P1: Read and use the critical chance past 100 ⭐ MVP

**User Story**: As a player who reached 100 % critical chance, I want the enemy's critical resistance to subtract from my chance and every extra point to add critical damage, so that I can read my real chance and my extra chance is never wasted.

**Why P1**: The confusion the owner reported; every strike goes through this rule.

**Acceptance Criteria**:

1. The game SHALL compute the effective critical chance of a strike as `E = min(100, max(0, C - R))`, `C` the attacker's critical chance and `R` the defender's critical resistance after the break talents and the team passives (a missing `critResistance` reads 0).  <!-- ubiquitous -->
2. WHEN an attacker with `C` 40 and critical multiplier 2 clicks a FIRE monster of defense 0 and `R` 30 THEN the game SHALL deal 2 (critical) on a roll of 0.09 and 1 (not critical) on a roll of 0.10.  <!-- event-driven -->
3. IF `C` is at most `R` THEN the game SHALL never land a rolled critical hit: `C` 30 against `R` 50 on a roll of 0 deals 1, not critical.  <!-- unwanted-behavior -->
4. WHEN a strike is critical THEN the game SHALL multiply it by `critMultiplier + O / 100` with `O = max(0, C - R - 100)`: `C` 130, `R` 10, multiplier 2.5 deals 2.7 on a roll of 0.99; `C` 110, `R` 10, multiplier 2 deals 2 (overflow 0); `C` 111, `R` 10, multiplier 2 deals 2.01; `C` 250, `R` 100, multiplier 2 deals 2.5.  <!-- event-driven -->
5. WHEN a strike is forced critical (the aimed shot, Lyra's double click) THEN the game SHALL make it critical whatever the roll and `R` and SHALL still add the overflow: `C` 10 against `R` 100 deals 2 with multiplier 2; `C` 150 against `R` 20 deals 2.3 with multiplier 2.  <!-- event-driven -->
6. The game SHALL apply AC 1 to AC 5 to every leader strike kind that can be critical: manual click, auto click, skill hit, the aimed shot and both hits of Lyra's double click.  <!-- ubiquitous -->
7. The game SHALL never make a damage-over-time tick or an ally hit critical, whatever `C`, `R` and the roll (both strike with `C` 0).  <!-- ubiquitous -->
8. The game SHALL not cap `C`: a 3-star leader (star bonus 30) with a worn `CRIT_CHANCE` 80 affix has `C` 120; a 0-star leader with `CRIT_CHANCE` 95 and Lyra as a fighting ally has `C` 115; during Fumaça (level factor 1) an attacker of `C` 95 strikes with `C` 110.  <!-- ubiquitous -->
9. WHEN an attacker of `C` 95 clicks during Fumaça (level factor 1) a FIRE monster of `R` 50 THEN the game SHALL land a critical hit on a roll of 0.59 and no critical hit on a roll of 0.60 (`E` 60).  <!-- event-driven -->
10. WHEN the Equipamento screen shows a 3-star Lyra wearing a `CRIT_CHANCE` 80 piece THEN the attribute panel SHALL read `Chance de crítico: 120%`.  <!-- event-driven -->
11. WHILE a monster is on screen the enemy line SHALL show, as its third chip (`data-stat="crit"`), `Seu crítico: <E>%` with `E` from AC 1 for the leader's attacker (no skill buff) against the current target, rounded to at most one decimal with no trailing zero, and no chip reading `Crit res`: a 3-star Kael (`C` 40) reads `Seu crítico: 10%` against `R` 30 and `Seu crítico: 40%` against `R` 0; a 0-star Kael (`C` 10) reads `Seu crítico: 0%` against `R` 12; a leader of `C` 130 reads `Seu crítico: 100%` against `R` 10.  <!-- state-driven -->
12. WHEN the leader's `C` or the target's `R` changes while a monster is on screen (a talent upgrade or reset, a leader change, a piece equipped or unequipped on the leader, a change of the fighting allies, a new target in a fight with adds) THEN the chip SHALL show the new `E` without a new encounter.  <!-- event-driven -->
13. WHEN Vex fights as an ally THEN the game SHALL lower `R` by 15, never below 0, before AC 1: a 0-star Kael (`C` 10) against `R` 5 reads `Seu crítico: 10%` and lands a critical hit on a roll of 0.08; without Vex it reads `Seu crítico: 5%` and the same roll is not critical.  <!-- event-driven -->

**Independent Test**: Log in with a 3-star Kael against a monster of critical resistance 30: the chip reads `Seu crítico: 10%`; a click on a roll of 0.09 is critical and on 0.10 is not.

---

### P1: Get the points of the retired talents back and pierce armor ⭐ MVP

**User Story**: As a player who spent points in Tempo do chefe do capítulo or Quebra de resistência a crítico, I want those points back and a new BREAK talent to spend them on, so that the rework never costs me progress.

**Why P1**: Without the refund the rework takes points away from existing accounts.

**Acceptance Criteria**:

1. WHEN a player calls `GET /talents` THEN the backend SHALL answer, at indexes 3, 12 and 21, `ARMOR_PIERCE`, `ARMOR_PIERCE_G2` and `ARMOR_PIERCE_G3` with branch `BREAK`, label `Perfuração de armadura`, unit `%`, `perLevel` 1, 2 and 3, `maxLevel` 10 and, at level 10, `value` 10, 20 and 30, and no talent with an id `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2` or `CRIT_RESIST_BREAK_G3`.  <!-- event-driven -->
2. WHEN `V15__talent_tree_rework.sql` runs THEN it SHALL delete every `player_talents` row whose `talent_id` is `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2` or `CRIT_RESIST_BREAK_G3`, of every player, and SHALL change no other row.  <!-- event-driven -->
3. WHEN a player with 30 earned points and `BOSS_TIME` 10, `BOSS_TIME_G2` 2, `CRIT_RESIST_BREAK` 4 and `COMBO` 3 (21 spent, 9 available) reads `GET /talents` after the migration THEN the backend SHALL answer `points` `{ "earned": 30, "spent": 3, "available": 27 }`.  <!-- event-driven -->
4. IF a `player_talents` row of a retired id exists after the migration (written by the previous backend) THEN the backend SHALL leave it out of the tree and of the spent points, and `POST /talents/reset` SHALL delete it with the other rows.  <!-- unwanted-behavior -->
5. WHEN the leader strikes with `ARMOR_PIERCE` at level 10 (value 10) THEN the game SHALL ignore 10 % of the defense after the break points: a 0-star Kael deals 0.55 to a FIRE monster of defense 50 (roll 0.99), 0.64 with `PHYSICAL_BREAK` at level 10 (40 x 0.9 = 36), 0.69 with a worn non-weapon piece whose only affix is `ARMOR_PIERCE_PCT` 28 and no break (pierce 38), and 1 with such a piece of `ARMOR_PIERCE_PCT` 95 (pierce 105, capped at 100).  <!-- event-driven -->
6. IF the talent list the game receives carries any of the six retired ids (an older backend) THEN the game SHALL drop them on read (load, upgrade answer, reset answer): no node, no effect, no time.  <!-- unwanted-behavior -->
7. WHEN the Equipamento screen shows a 0-star Kael with no pieces and `ARMOR_PIERCE` at level 10 THEN the attribute panel SHALL read `Perfuração de armadura: 10%`, and `Quebra de resistência a crítico: 15` with Vex as a fighting ally, `Quebra de resistência a crítico: 0` without.  <!-- event-driven -->

**Independent Test**: Store `BOSS_TIME` 10 for a player, deploy, open Talentos: the medallion shows the 10 points again; buy `ARMOR_PIERCE` and a click on a defense 50 monster deals 0.55 instead of 0.5.

---

### P2: Speed up the combo with Fúria crescente

**User Story**: As a player who maxed the combo cap, I want a special talent that makes each click add more combo, so that I reach my cap in a few clicks.

**Why P2**: A new reward for an existing build; the rest of the rework does not depend on it.

**Acceptance Criteria**:

1. WHEN a player calls `GET /talents` THEN the backend SHALL answer, as the last of the 28 talents (index 27), `COMBO_FURY` with branch `COMBO`, label `Fúria crescente`, unit `combo-step`, `perLevel` 1, `maxLevel` 4, `grade` 1, `baseId` `COMBO_FURY`, `requiredId` `COMBO`, `requiredLevel` 10, `value` equal to its level, and `nextCost` 2 below level 4 and null at level 4.  <!-- event-driven -->
2. IF a player upgrades `COMBO_FURY` while `COMBO` is below level 10 THEN the backend SHALL answer 409 `TALENT_LOCKED` and store nothing; with `COMBO` at 10 the talent SHALL answer `unlocked` true whatever the levels of `COMBO_G2` and `COMBO_G3`.  <!-- unwanted-behavior -->
3. WHEN a player with `COMBO` 10 and 2 available points upgrades `COMBO_FURY` from level 0 THEN the backend SHALL answer level 1, value 1, `nextCost` 2 and `available` 0.  <!-- event-driven -->
4. IF a player upgrades `COMBO_FURY` at level 4 THEN the backend SHALL answer 409 `TALENT_MAX_LEVEL`; IF the request carries `fromLevel` 5 or -1 THEN it SHALL answer 400 `INVALID_TALENT_REQUEST` with detail `fromLevel must be an integer between 0 and 4`.  <!-- unwanted-behavior -->
5. The backend SHALL answer `requiredId` and `requiredLevel` on every talent: null and null for the 9 grade 1 talents, `<baseId>` and 10 for grade 2, `<baseId>_G2` and 10 for grade 3, `COMBO` and 10 for `COMBO_FURY`.  <!-- ubiquitous -->
6. WHEN the leader clicks THEN the game SHALL add `1 + v` percent to the combo bonus per click, `v` the value of `COMBO_FURY` (0 without it), capped by the COMBO talents: with `COMBO` 10 (cap 50) and `COMBO_FURY` 4 the 2nd click gets +5 %, the 11th +50 % and the 12th +50 %; with `COMBO` 2 (cap 10) and `COMBO_FURY` 1 the 6th click gets +10 %; with `COMBO` 10 and no `COMBO_FURY` the 11th click gets +10 %.  <!-- event-driven -->
7. WHEN 3 clicks land with `COMBO` 10 and `COMBO_FURY` 4 THEN the combo HUD SHALL read `Combo x3 · +15%`; with `COMBO` 0 it SHALL stay empty whatever `COMBO_FURY`.  <!-- event-driven -->
8. WHEN the detail card shows `COMBO_FURY` THEN its effect line SHALL read `Efeito: nenhum` at level 0, `Efeito: +2% por clique` at level 1 and `Efeito: +5% por clique` at level 4, and its level line `Nível <n>/4`.  <!-- event-driven -->
9. WHILE `COMBO_FURY` is locked the detail card SHALL show `Bloqueado: chegue ao nível 10 de Limite de dano do combo` (`talent-locked-COMBO_FURY`) and no upgrade button.  <!-- state-driven -->

**Independent Test**: Log in with `COMBO` 10 and 8 points, buy 4 levels of Fúria crescente (2 points each), click 11 times: the HUD reads `Combo x11 · +50%`.

---

### P2: Spend points on a painted talent tree

**User Story**: As a player, I want the Talentos screen to look like a living tree whose veins light up as I invest, so that my build reads at a glance and buying a talent feels rewarding.

**Why P2**: The rules above work on any screen; the tree is the presentation the owner asked for.

**Acceptance Criteria**:

1. WHEN the Talentos screen opens THEN the panel window SHALL be 1024 x 576 px (canvas px, 16:9, the full width of the canvas, centred vertically) with no padding, filled by the tree board (`talent-tree`), the title plaque `talent-title` (192 x 64) reading `Talentos` centred at the top, the close button (`hero-close`, 120 x 40 with its art) reading `Fechar` at the top right, the medallion `talent-points` reading `Pontos de talento: <available>` at the bottom left, the button `talent-reset` reading `Reiniciar pontos` at the bottom right and the detail card `talent-detail` (380 px wide) at the bottom centre.  <!-- event-driven -->
2. The tree SHALL draw one node button `talent-<ID>` per talent of the list that has a position in the layout map, centred on its map coordinates (percent of the board, design § Layout map), 60 x 60 px (88 x 88 px for `COMBO_FURY`), holding the talent icon (36 x 36 px, 54 x 54 px for `COMBO_FURY`; grade 2 and 3 fall back to the grade 1 file, then to the branch glyph), the frame art, the level chip `talent-node-level-<ID>` reading `<level>/<max>`, a `title` with the full name (`<label>` or `<label> (Grau N)`), and an `aria-label` `<full name>, nível <level> de <max>`.  <!-- ubiquitous -->
3. The tree SHALL draw a caption `talent-caption-<ID>` with the label under every grade 1 node and under `COMBO_FURY`, and a badge `talent-node-grade-<ID>` reading `II` or `III` on every grade 2 or 3 node and no caption under them.  <!-- ubiquitous -->
4. The tree SHALL mark each node with `data-state`: `locked` when `unlocked` is false (grey icon and the lock art over it), `maxed` when `nextCost` is null (gold ring `rgb(224, 180, 90)`), `available` when it is open, below its max and `points.available >= nextCost` (glow in the branch colour), else `open`; the selected node SHALL carry `aria-pressed="true"` and a 3 px `rgb(244, 230, 200)` outline, the others `aria-pressed="false"`.  <!-- ubiquitous -->
5. WHEN the player clicks a node THEN the screen SHALL select it without any request and the detail card SHALL show its full name, `Nível <level>/<max>` (`talent-level-<ID>`), `Efeito: <effect>` (`talent-effect-<ID>`) and exactly one of: the button `talent-upgrade-<ID>` reading `Melhorar (1 ponto)` or `Melhorar (<n> pontos)`, the text `Nível máximo` (`talent-max-<ID>`), or the lock text (`talent-locked-<ID>`: `Bloqueado: chegue ao nível 10 do Grau <N - 1>` for a grade, the text of P2 Fúria AC 9 for `COMBO_FURY`).  <!-- event-driven -->
6. WHILE no node is selected the detail card SHALL read `Escolha um talento na árvore para ver os detalhes.` (`talent-detail-empty`) and show no button.  <!-- state-driven -->
7. WHEN the player clicks the upgrade button THEN the screen SHALL send `POST /talents/<ID>/upgrade` with the level shown, disable the button and the reset button while it runs, and afterwards keep the same node selected and show the new level, effect, node chip, medallion and lit veins.  <!-- event-driven -->
8. IF the upgrade button's talent costs more than `points.available` THEN the button SHALL be disabled.  <!-- unwanted-behavior -->
9. WHEN the screen is opened again (closed and reopened, or another screen shown in between) THEN no node SHALL be selected.  <!-- event-driven -->
10. The tree SHALL draw one banner `talent-branch-<BRANCH>` per branch (art `talent-banner.png`, 140 x 34 px) with its title `.talent-branch-title` written in the branch ink at the banner coordinates of the map, in DOM order `TIME`, `BREAK`, `POWER`, `COMBO`.  <!-- ubiquitous -->
11. The tree SHALL draw one lit layer `talent-lit-<BRANCH>` per branch (`talent-tree-bg-lit.jpg` masked by the branch ellipse of the map) with CSS opacity `0` while the branch has no level and `round2(0.2 + 0.8 x L / M)` otherwise (D17): `TIME` with only `MINIBOSS_TIME` 5 in a 28-talent list reads 0.27, `COMBO` with only `COMBO` 10 reads 0.44 (0.47 in a list without `COMBO_FURY`), `POWER` with its 12 talents at 10 reads 1.  <!-- ubiquitous -->
12. IF an art file is missing THEN the screen SHALL keep working with its fallback: the board shows a dark gradient (`.talent-tree.is-fallback`) and the dashed veins SVG `talent-tree-veins`; a node without its frame draws a CSS ring in the branch colour (`.talent-node.no-frame`); a missing icon shows the branch glyph (`.icon-fallback`); a missing lock shows the glyph `🔒`; a banner and the title plaque without their art draw a parchment CSS plaque with a wood border (`.no-art`); the medallion and the reset button without their art keep only their text pill (`.no-art`); the close button without its art keeps the text button `Fechar`.  <!-- unwanted-behavior -->
13. WHERE the viewport is at most 640 px wide the board SHALL be drawn at `zoom: 2` inside the scroll box `talent-tree-scroll` (scrollable on both axes, 2048 x 1152 px of content), opened with `scrollLeft` 512 and `scrollTop` 288, keeping the scroll the player chose across re-renders (select, upgrade, reset, points reload), while the title, medallion, reset button, detail card and close button stay at their window positions; WHERE it is wider the board SHALL be drawn at `zoom: 1` with no scroll (content 1024 x 576 px).  <!-- optional-feature -->
14. IF the list holds a talent with no position in the layout map (a newer backend) or misses a mapped talent (an older backend) THEN the tree SHALL draw nodes only for the talents both in the list and in the map, with no error.  <!-- unwanted-behavior -->
15. The screen SHALL keep the behaviours of the old Talentos screen: `Reiniciar pontos` disabled while `points.spent` is 0 or a request runs; `Pontos de talento insuficientes` on `NOT_ENOUGH_TALENT_POINTS`; `Não foi possível melhorar o talento.` on any other failure, reloading the tree after a 409; `Não foi possível reiniciar os talentos.` when the reset fails; `Talentos indisponíveis` when the tree cannot load; the red dot of the HUD button with the available points; the fight keeps running behind the window.  <!-- ubiquitous -->

**Independent Test**: Open Talentos with every art file missing (all `talent-*` assets answered 404): the gradient board, the dashed veins, 28 ringed nodes with glyphs and the four plaques show; click `CLICK_DAMAGE`, buy a level: the card shows `Nível 1/10`, the chip `1/10`, the POWER veins light to 0.21.

---

## Edge Cases

- IF the backend answers a talent list without `requiredId` and `requiredLevel` (an older backend) THEN the lock text of a grade SHALL use the talent's own `maxLevel` (today's text), and `COMBO_FURY` is absent anyway (P2 Tree AC 14).
- IF the label of the `requiredId` talent is not in the list THEN the lock text SHALL read `Bloqueado: chegue ao nível <requiredLevel> do talento anterior`.
- IF a `COMBO_FURY` level arrives while `COMBO` is below 10 (impossible through the API) THEN the game SHALL still apply its value (the game reads `value`, AD-011).
- WHEN a talent reset or an account reset runs THEN the backend SHALL delete the `COMBO_FURY` level with every other level (existing rule, no new code).
- WHEN the selected talent is no longer in the list after a reload THEN the detail card SHALL show the empty text of P2 Tree AC 6.
- WHEN `C - R` is exactly 100 THEN the overflow SHALL be 0 (P1 Critical AC 4, `C` 110 against `R` 10).
- IF the defender carries no `critResistance` THEN `R` SHALL read 0.
- IF the talents have not loaded yet THEN the chip SHALL use the attacker without talents and the tree SHALL not be shown (the screen waits for the load, as today).
- WHEN `V15` runs twice (a rerun on a copy) THEN the second run SHALL delete nothing and fail on nothing.

---

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | `fromLevel` of `COMBO_FURY` is 0 to 4 (P2 Fúria AC 4); unknown and retired ids answer 404 (P1 Boss AC 2); `C` has no upper bound, `E` is clamped 0 to 100, armor pierce stays capped at 100 (P1 Critical, P1 Retired AC 5) |
| Failure / partial-failure states | Upgrade and reset failures keep today's texts (P2 Tree AC 15); missing art keeps the screen usable (P2 Tree AC 12) |
| Idempotency / retry / duplicate handling | `fromLevel` and 409 `TALENT_LEVEL_MISMATCH` unchanged (AD-011); `V15` is a delete and is safe to rerun (Edge Cases) |
| Auth boundaries & rate limits | Every talent route keeps its token check; no new route |
| Concurrency / ordering | Upgrades keep the `progress` row lock (AD-013); no new write path |
| Data lifecycle / expiry | `V15` deletes the retired rows once; rows written later by the previous backend are ignored and deleted by the next reset (P1 Retired AC 4) |
| Observability | `PlayerTalents.fromStored` keeps logging every ignored id at WARN (existing); no new log is an acceptance criterion (L-007) |
| External-dependency failure | N/A because the feature calls no new external service |
| State-transition integrity | Locked to open: grade N at level 10 of grade N - 1, `COMBO_FURY` at level 10 of `COMBO` (P2 Fúria AC 2); levels only go up by one per request or to 0 by a reset |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TTR-01 | P1 Boss: AC 1, AC 2 (catalog, 404) | Tasks | Implementing |
| TTR-02 | P1 Boss: AC 3, AC 4, AC 5 (boss damage in combat) | Tasks | Implementing |
| TTR-03 | P1 Boss: AC 6 (chapter boss time) | Tasks | Implementing |
| TTR-04 | P1 Boss: AC 7, AC 8 (branch title, attribute panel) | Tasks | Implementing |
| TTR-05 | P1 Critical: AC 1, AC 2, AC 3 (subtractive chance) | Tasks | Implementing |
| TTR-06 | P1 Critical: AC 4, AC 5 (overflow, forced critical) | Tasks | Implementing |
| TTR-07 | P1 Critical: AC 6, AC 7 (every strike kind) | Tasks | Implementing |
| TTR-08 | P1 Critical: AC 8, AC 9, AC 10 (no cap, Fumaça, panel) | Tasks | Implementing |
| TTR-09 | P1 Critical: AC 11, AC 12, AC 13 (chip, refresh, Vex) | Tasks | Implementing |
| TTR-10 | P1 Retired: AC 1 (armor pierce catalog) | Tasks | Implementing |
| TTR-11 | P1 Retired: AC 2, AC 3, AC 4 (migration, refund, late rows) | Tasks | Implementing |
| TTR-12 | P1 Retired: AC 5 (armor pierce in combat) | Tasks | Implementing |
| TTR-13 | P1 Retired: AC 6, AC 7 (game drops retired ids, panel) | Tasks | Implementing |
| TTR-14 | P2 Fúria: AC 1, AC 2, AC 3, AC 4 (catalog, lock, cost, bounds) | Tasks | Implementing |
| TTR-15 | P2 Fúria: AC 5 (requiredId, requiredLevel) | Tasks | Implementing |
| TTR-16 | P2 Fúria: AC 6, AC 7 (combo step, HUD) | Tasks | Implementing |
| TTR-17 | P2 Fúria: AC 8, AC 9 (effect and lock texts) | Tasks | Implementing |
| TTR-18 | P2 Tree: AC 1 (window, plaques, medallion, reset, card) | Tasks | Implementing |
| TTR-19 | P2 Tree: AC 2, AC 3 (nodes, captions, badges) | Tasks | Implementing |
| TTR-20 | P2 Tree: AC 4 (node states) | Tasks | Implementing |
| TTR-21 | P2 Tree: AC 5, AC 6, AC 7, AC 8, AC 9 (selection, detail card, upgrade) | Tasks | Implementing |
| TTR-22 | P2 Tree: AC 10, AC 11 (banners, lit veins) | Tasks | Implementing |
| TTR-23 | P2 Tree: AC 12 (fallbacks) | Tasks | Implementing |
| TTR-24 | P2 Tree: AC 13 (narrow screens) | Tasks | Pending |
| TTR-25 | P2 Tree: AC 14, AC 15, Edge Cases (missing talents, kept behaviours) | Tasks | Implementing |

**Coverage:** 25 total, 25 mapped to tasks, 0 unmapped. The Gemini prompts of the last goal are written in `PROMPTS_ASSETS_UI.md` with this spec (no task).

---

## Success Criteria

- [ ] After the deploy, `select count(*) from player_talents where talent_id like 'BOSS_TIME%' or talent_id like 'CRIT_RESIST_BREAK%'` returns 0 and no player's `available` points went down.
- [ ] With every art file missing, the Talentos screen shows 28 nodes, 4 banners, the medallion and the reset button, and a level can be bought.
- [ ] A leader with critical chance above 100 deals more critical damage than the same leader at 100 against the same monster.
- [ ] With COMBO 10 and Fúria crescente 4 the combo reaches +50 % on the 11th click.
