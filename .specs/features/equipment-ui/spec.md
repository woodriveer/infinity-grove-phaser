# Equipment UI Specification

## Problem Statement

The Equipamento window lists every piece as a text row, hides the leader's real attributes (click damage, critical chance and the rest) and moves gear between heroes one piece at a time. The player cannot read the leader's strength after equipping, cannot scan the bag at a glance, and cannot hand a whole set to the next leader. This feature adds a leader attribute panel, an icon bag with hover tooltips, and a set transfer, all in the browser (no backend change).

## Goals

- [ ] The Equipamento window shows the detailed attributes of the leader (the numbers the click uses).
- [ ] The bag and the worn slots show icon tiles; hovering a tile shows its attributes, clicking it opens the actions.
- [ ] One button moves the whole set of a hero to another hero.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Named equipment sets saved for later (loadouts) | The user offered "transferir" or "conjuntos"; transfer is the smaller one and covers the leader swap |
| A new backend endpoint for the transfer | The existing equip endpoint moves a piece; no schema or API change |
| Sorting and filtering the bag | Not asked |
| Stats of heroes that are not the leader | The user asked for the leader's attributes |
| The icon art | Comes from `PROMPTS_ASSETS_UI.md`; until then each tile shows a drawn mark |
| Combo and temporary skill buffs in the panel | Panel shows the permanent attributes only |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Which feature, set or transfer | Transfer a whole set from one hero to another | The user wrote "ou"; transfer reuses the equip endpoint | n |
| Transfer rule | Each worn piece of the source is equipped on the target in the order Arma, Armadura, Anel, Amuleto; a piece the target wore in that slot goes to the bag (the server rule of `equip`) | Existing backend behaviour, atomic per piece | n |
| Transfer failure | A failed piece stops the rest; the screen reloads the equipment from the server and shows `Não foi possível concluir a ação.` | AD-009: the server list is the truth; the 4 requests are not one transaction | n |
| Transfer UI | In each hero block with at least one worn piece and another owned hero: a button `Transferir conjunto` that opens one button `Para <nome>` per other owned hero | Smallest flow | n |
| Panel owner | The current leader; the panel follows a leader change and every equip, unequip and refine without reopening the window | The user wants the leader's attributes | n |
| Panel numbers | The leader attacker of `click-power` (base 1 + weapon, equipment % + star % + talent %, critical chance capped at 100, critical multiplier, armor pierce, boss damage), without the combo and the skill buffs | One function for the combat and the panel | n |
| Panel lines | `Elemento: <Fogo>`, `Tipo de dano: Físico`, `Dano de clique: <x.x>`, `Chance de crítico: <n>%`, `Dano crítico: x<m>`, `Perfuração de armadura: <n>%`, `Dano em chefes: <n>%`, `Tempo extra de miniboss: <n>s`, `Tempo extra de chefe: <n>s`, and the three talent break lines | Lesson L-010: texts stated in full | n |
| Number format | Click damage with one decimal and the trailing zero kept; percentages and seconds with at most one decimal and no trailing zero; the critical multiplier with at most two decimals and no trailing zero | Matches `describeClickDamage` | n |
| Tile content | The slot icon (`assets/ui/slot-<weapon\|armor\|ring\|amulet>.png`), a border by rarity, and `+<refine>` in the corner when the refine is above 0; the icon falls back to a drawn mark when the file is missing | The art may not exist yet | n |
| Rarity frames | Each rarity differs by colour AND by frame shape, not colour alone: COMMON grey thin border; UNCOMMON green border with 1 corner gem; RARE blue double border with 2 corner gems; EPIC purple double border with 3 corner gems and a fantasy effect (a pulsing violet aura, a light sweep along the border and small twinkling sparkles around the tile); LEGENDARY gold ornate border with 4 corner gems and a rotating golden shimmer (no sparkles, so it never reads as EPIC); classes `rarity-<name>` and `data-rarity` | User asked for different icons or borders per rarity; shape keeps it readable for colour-blind players; CSS needs no art | n |
| Rarity icons | The slot icon stays neutral (4 icons); per-rarity icon art (20 images) is not built, the frame carries the rarity | 20 Gemini images for a difference the frame already shows; can be added later | n |
| Tooltip | Appears on hover, shows title (`Raro Arma +3`), the weapon line, one line per affix and `Equipado em <nome>` or `Na mochila`; no buttons | "Tooltip mostrando os atributos" (user) | y |
| Click | Opens the existing piece detail with equip, remove, refine, reroll and sell | "Se clicasse no item aí sim aparecer as opções" (user) | y |
| Worn slots | Shown as tiles too (an empty slot is a dashed tile with the dimmed icon and the text `vazio`) | Same reading as the bag | n |
| Existing test ids | `equip-piece-<id>`, `equip-slot-<hero>-<slot>`, `equipment-list`, `equipment-bag`, `piece-*` stay on the same actions | Existing tests keep their meaning | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Leader attribute panel ⭐ MVP

**User Story**: As a player, I want to read my leader's attributes in the Equipamento window so that I see what a piece changes.

**Why P1**: A direct request, and the base for choosing gear.

**Acceptance Criteria**:

1. WHILE the Equipamento window is open and a leader exists the game SHALL show a panel (`data-testid="leader-stats"`) titled `Atributos de <nome do líder>`.  <!-- state-driven -->
2. The panel SHALL show the lines `Elemento: <elemento>`, `Tipo de dano: Físico`, `Dano de clique: <x.x>`, `Chance de crítico: <n>%`, `Dano crítico: x<m>`, `Perfuração de armadura: <n>%`, `Dano em chefes: <n>%`, `Tempo extra de miniboss: <n>s` and `Tempo extra de chefe: <n>s`.  <!-- ubiquitous -->
3. The panel SHALL show the lines `Quebra de defesa física: <n>`, `Quebra de defesa mágica: <n>` and `Quebra de resistência a crítico: <n>` from the talents.  <!-- ubiquitous -->
4. WHEN Kael has 0 stars, no equipment and no talents THEN the panel SHALL read `Dano de clique: 1.0`, `Chance de crítico: 10%`, `Dano crítico: x2`, `Perfuração de armadura: 0%`, `Dano em chefes: 0%`, `Tempo extra de miniboss: 0s` and `Tempo extra de chefe: 0s`.  <!-- event-driven -->
5. WHEN Lyra has 3 stars and no equipment or talents THEN the panel SHALL read `Dano de clique: 1.4`, `Chance de crítico: 40%` and `Dano crítico: x2.5`.  <!-- event-driven -->
6. WHEN the leader wears a weapon of 3.3 click damage and a ring of +12 % click damage THEN the panel SHALL read `Dano de clique: 4.9` (rounded from (1 + 3.3) x 1.12 = 4.816 to one decimal).  <!-- event-driven -->
7. WHEN the player equips, removes or refines a piece THEN the panel SHALL show the new numbers without the window reopening.  <!-- event-driven -->
8. WHEN the leader changes THEN the panel SHALL show the new leader's name and numbers.  <!-- event-driven -->
9. WHEN `BOSS_TIME_SECONDS` pieces add 5 s and `MINIBOSS_TIME` is level 2 THEN the panel SHALL read `Tempo extra de miniboss: 9s` and `Tempo extra de chefe: 5s`.  <!-- event-driven -->
10. IF no hero is the leader THEN the game SHALL show no panel.  <!-- unwanted-behavior -->

**Independent Test**: In the browser, lead with Kael with a Rare weapon worn and read `Dano de clique` change after removing it.

---

### P1: Icon bag with tooltip ⭐ MVP

**User Story**: As a player, I want the bag as a grid of icons with details on hover so that I scan my pieces fast.

**Why P1**: A direct request.

**Acceptance Criteria**:

1. The Equipamento window SHALL show each bag piece as a tile (`data-testid="equip-piece-<id>"`) with its slot icon, a class `rarity-<rarity>` and `data-rarity="<RARITY>"`.  <!-- ubiquitous -->
2. WHILE a piece has a refine above 0 its tile SHALL show `+<refine>`.  <!-- state-driven -->
3. WHEN the pointer enters a tile THEN the game SHALL show a tooltip (`data-testid="piece-tooltip"`) with the title (`Raro Arma +3`), the weapon line `Dano de clique: <x.x>` when the piece has one, one line per affix and `Equipado em <nome>` or `Na mochila`.  <!-- event-driven -->
4. WHEN the pointer leaves the tile THEN the game SHALL hide the tooltip.  <!-- event-driven -->
5. The tooltip SHALL carry no button.  <!-- ubiquitous -->
6. WHEN the player clicks a tile THEN the game SHALL open the piece detail with its actions (equip in each hero, remove, refine, reroll, sell).  <!-- event-driven -->
7. The four worn slots of each owned hero SHALL show as tiles with the same tooltip and click; an empty slot SHALL show a dashed tile with the text `vazio` and no click.  <!-- ubiquitous -->
8. IF the icon file of a slot fails to load THEN the tile SHALL show a drawn mark instead and stay clickable.  <!-- unwanted-behavior -->
9. WHEN the bag holds no piece THEN the game SHALL show `Nenhum equipamento ainda. Vença chefes para encontrar peças.` as today.  <!-- event-driven -->
10. The window title of the bag SHALL read `Mochila (<n>)` with the number of bagged pieces.  <!-- ubiquitous -->
11. The tile SHALL show as many corner gems as the rarity order says: COMMON 0, UNCOMMON 1, RARE 2, EPIC 3, LEGENDARY 4 (`data-gems`).  <!-- ubiquitous -->
12. WHERE the rarity is EPIC the tile SHALL show the fantasy effect: a pulsing aura, a light sweep and twinkling sparkles (`data-effect="fantasy"`), and no other rarity SHALL carry that attribute.  <!-- optional-feature -->
13. WHILE the player prefers reduced motion (`prefers-reduced-motion`) the tile SHALL show the EPIC and LEGENDARY frames still, with the same colours, gems and a steady glow.  <!-- state-driven -->
14. The five rarities SHALL differ by frame shape (border thickness, gems, glow) as well as by colour, so two rarities never differ by colour alone.  <!-- ubiquitous -->
15. The tooltip title and the piece detail SHALL name the rarity in words (`Raro`, `Épico`, ...).  <!-- ubiquitous -->

**Independent Test**: Hover a bagged Epic ring and read `Épico Anel +0` and its affixes with no button; click it and see the sell button.

---

### P2: Transfer a set

**User Story**: As a player, I want to move all the gear of one hero to another so that I switch leaders without equipping piece by piece.

**Why P2**: Saves many clicks, but the single-piece equip already works.

**Acceptance Criteria**:

1. WHILE a hero wears at least one piece and another owned hero exists the game SHALL show the button `Transferir conjunto` in that hero's block (`data-testid="equip-transfer-<heroId>"`).  <!-- state-driven -->
2. WHEN the player clicks `Transferir conjunto` THEN the game SHALL show one button `Para <nome>` per other owned hero.  <!-- event-driven -->
3. WHEN the player picks a target THEN the game SHALL equip each worn piece of the source on the target in the order Arma, Armadura, Anel, Amuleto.  <!-- event-driven -->
4. WHEN the transfer ends THEN the game SHALL show the pieces on the target, the source with empty slots, the pieces the target wore before in the bag, and the text `Conjunto transferido para <nome>`.  <!-- event-driven -->
5. WHEN the transfer ends THEN the attribute panel SHALL show the numbers of the current leader with the new gear.  <!-- event-driven -->
6. IF a request of the transfer fails THEN the game SHALL stop, reload the equipment from the server and show `Não foi possível concluir a ação.`.  <!-- unwanted-behavior -->
7. WHILE the transfer runs the game SHALL disable every equipment button.  <!-- state-driven -->
8. IF only one hero is owned THEN the game SHALL show no `Transferir conjunto` button.  <!-- unwanted-behavior -->

**Independent Test**: Kael wears 3 pieces, Lyra owns 1; transfer Kael's set to Lyra; read the 3 pieces under Lyra, Kael's slots `vazio` and Lyra's old piece in the bag.

---

## Edge Cases

- WHEN the source and the target wore a piece in the same slot THEN the game SHALL show the target's old piece in the bag after the transfer.
- WHEN the source wears only a ring THEN the transfer SHALL send one request.
- WHEN a tooltip would leave the window THEN the game SHALL keep it inside the window.
- WHEN a refine raises a piece THEN the tile SHALL show the new `+<refine>` and the border SHALL stay the same.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| EQU-01 | P1: panel lines and numbers (AC 1-6, 9) | Specify | Pending |
| EQU-02 | P1: panel follows changes (AC 7-8, 10) | Specify | Pending |
| EQU-03 | P1: tiles, rarity frames, refine (AC 1-2, 7-8, 10-13) | Specify | Pending |
| EQU-04 | P1: tooltip and click (AC 3-6, 9) | Specify | Pending |
| EQU-05 | P2: transfer flow (AC 1-4) | Specify | Pending |
| EQU-06 | P2: transfer refresh and failure (AC 5-8) | Specify | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped

---

## Success Criteria

- [ ] Unit tests pin the panel lines with the exact numbers above.
- [ ] An e2e test hovers a tile, reads the tooltip, clicks it and transfers a set.
- [ ] No backend file changes.
