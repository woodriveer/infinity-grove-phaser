# Talent Tree Branches Specification

## Problem Statement

The painted talent tree of `talent-tree-rework` places every chain as a vertical column far from the trunk (`talentTreeLayout.js`, `CHAINS` and `rise`), so the nodes do not sit on the coloured boughs of `talent-tree-bg.jpg` that the owner sees; the nodes are big (60 px, 88 px for Fúria crescente) and crowd the boughs; the detail card names the talent and its effect but never says what the talent does; and Fúria crescente, a talent that opens at level 10 of `Limite de dano do combo`, is drawn big and first on the COMBO bough, before the chain that opens it. The owner asked on 2026-11-24, with an annotated screenshot (`owner-sketch.webp` in this folder), for chains that start where their bough leaves the trunk and climb along it, smaller nodes, a short explanation and a bigger icon on the card, and Fúria crescente after its chain. Desktop only.

## Goals

- [ ] Each of the 9 graded chains starts next to the trunk where its coloured vein leaves it and climbs along its bough, grade 1 nearest the trunk fork and grade 3 farthest, at the coordinates of design § Layout map (`layout-target.png` shows them on the painting).
- [ ] The 28 nodes are 44 px (Fúria crescente 56 px), and no node, caption, banner or fixed part of the screen overlaps another on the 1024 x 576 desktop board.
- [ ] The detail card shows a one or two line explanation of the selected talent in plain Portuguese and an 88 px icon of the talent in a ring of the branch colour.
- [ ] Fúria crescente sits after `Limite de dano do combo` (grade 1), the talent that opens it, and its vein leaves from that node.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The phone layout (viewport up to 640 px) | The owner targets the desktop only (2026-11-24). The 2x zoom and `revealTalent` keep their code; only the shared constants change, and the existing phone e2e tests must keep passing unchanged. No phone review |
| Changing the unlock rule of Fúria crescente (opens at level 10 of `COMBO`, AD-029) | The order on screen follows the rule (D2). Moving the rule to `COMBO_G3` is the alternative of Q2 and needs a backend task and an AD |
| New art (a card frame, new icons) | The card icon reuses the node icon files of `game/public/assets/` and draws its ring in CSS |
| Descriptions served by the backend | Texts only, with no catalog number (AD-011); the game keeps player texts in Portuguese next to `BRANCH_TITLES` (AD-007) |
| Animations of the veins or the card | Same reason as `talent-tree-rework`: static states keep the e2e reads stable |
| Moving the banners' look or the lit-vein formula | Only their coordinates change (D8) |

---

## Assumptions & Open Questions

Rows `y` were decided by the owner (request of 2026-11-24 relayed by the orchestrator, and the owner's standing "desktop only" rule). Rows `n (Q<n>)` are product owner defaults; the spec is written with them and they wait for the owner's answer to the question below the table.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Path of each branch | Calibrated on the painting (`layout-target.png`): each chain follows its painted vein from the trunk outward. TIME: grade 1 on the cyan arc next to the trunk base (x 35.5 to 43.5 %, y 58 to 60.5 %), then left and up along the cyan bough to the far-left foliage (grade 3 at x 16.5 to 20 %). BREAK: grade 1 on the trunk where the red vein starts (x 40.5 to 47 %, y 33 to 40.5 %), climbing up and left along the two red limbs (grade 3 at x 28 and 38 %, y 11 to 18 %). POWER: a band of four parallel paths that starts on the trunk where the gold vein starts (`Dano de clique (%)` grade 1 at (53, 49.5)) and climbs up and right through the gold crown (grade 3 up to (83.5, 8)). COMBO: grade 1 on the right of the trunk base by the purple arc (60, 61), grade 2 on the purple bough (69.5, 56), grade 3 at the bough tip on the far right (86, 42). Two chains of a branch run as parallel paths along the same bough | Owner request 1. The owner's TIME arrow dips under the bough toward the roots; that zone holds the medallion and the detail card, so TIME follows the painted cyan vein, which also starts low by the trunk base | n (Q1) |
| D2 Place of Fúria crescente | Fúria crescente keeps its unlock rule (level 10 of `COMBO`, grade 1, AD-029) and sits on its own twig after that node: at (76, 62), on the low purple foliage, farther from the trunk than `COMBO` and off the `COMBO` → grade 2 → grade 3 line; its fallback vein goes from `COMBO` to Fúria crescente; in the COMBO branch the DOM order is `COMBO`, `COMBO_G2`, `COMBO_G3`, `COMBO_FURY` | The orchestrator asked to make the order on screen match the real unlock rule; the rule opens Fúria with grade 2, not after grade 3, so drawing it after grade 3 would show a lock the game does not have | n (Q2) |
| D3 Node size | Node 44 x 44 px (Fúria crescente 56 x 56), icon 28 x 28 (36 x 36). Grade badge 18 x 18 px, Cinzel 10 px, at top -4 px, right -4 px. State seal (`::after`, star or plus) 18 x 18 px at top -6 px, left -6 px, glyph 11 px (star) and 14 px (plus). Lock 20 x 20 px at top -7 px, left -7 px, glyph 12 px. Level chip (11 px), caption (80 px wide, 12 px, up to 3 lines) and node frame art unchanged | 44 px is the smallest size that stays an easy click target and lets 28 nodes and 10 captions fit the boughs without overlap; the marks shrink in proportion so they stop covering the neighbours | n (Q3) |
| D4 Talent descriptions | One text per `baseId`, shown for every grade of that talent (table in P1 Card AC 1); no catalog number in the text (AD-011); a talent whose `baseId` has no text shows no description line | Grades only change the value, which the `Efeito` line already shows | n (Q4) |
| D5 Detail card | 460 x 136 px (was 380 x min 112), bottom 8 px, centred (x 282 to 742 of the board). Left: name (Cinzel 16 px), one row with `Nível <l>/<m>` and `Efeito: <effect>` (13 px, 12 px apart), the description (Figtree 12 px, line height 15 px, at most 2 lines, `--ink-900`), then the button, `Nível máximo` or the lock text as today. Right: the icon, 88 x 88 px circle, 3 px solid border in `--branch`, a 2 px `--wood-900` outer ring and a 14 px glow of `--branch`, wood radial background, the art 64 x 64 inside. Empty card: the empty text only, no icon | The owner circled the right side of the card for the icon; one row for level and effect keeps the card 136 px tall, so the board keeps the room above it | n (Q5) |
| D6 Card icon art | The same file as the node: `assets/<talentIconName(baseId, grade)>.png`, then the grade 1 file for grades 2 and 3, then the branch glyph (`⏳`, `🛡`, `⚔`, `✦`) at 34 px in `--parchment-100`. The icon stays in colour in every state (the lock text says why it is locked) | Reuses the fallback chain of the nodes (`iconWithFallback`) | n (Q5) |
| D7 Desktop only | The design and review target is the desktop board (1024 x 576, no zoom). The phone code (`zoom: 2`, `revealTalent`, `columnScroll`) is kept as it is; `FIXED_BOTTOM` becomes 144 (card 136 + 8) and `NODE_HALF` 22, `LARGE_NODE_HALF` 28, `SEAL_HEIGHT` 7 follow the new sizes; the existing phone e2e tests must keep passing unchanged | Owner rule of 2026-11-24 ("desktop only, ignore the phone layout") | y |
| D8 Banners and lit veins | Banners and glow ellipses move to the values of design § Layout map, so each banner sits on its foliage clear of every node and caption and each ellipse covers its new path; size, art and opacity formula unchanged | Owner request 1 asks the glows to follow the new path | n (Q1) |
| D9 Fallback veins | 11 polylines: the trunk `50,100 50,58`; one per graded chain from the fork (50, 58) through grades 1, 2 and 3 in catalog order; the last from `COMBO` to `COMBO_FURY` | The veins follow the new paths and reach Fúria crescente from its prerequisite (owner request 4) | n (Q2) |
| D10 Superseded rules | This spec supersedes `talent-tree-rework` P2 Tree AC 1 (card 380 px wide), AC 2 (nodes 60 and 88 px, icons 36 and 54 px), the node position rows of its design § Layout map and D14 (provisional coordinates). AD-029 stays as it is: the tree is still HTML nodes over the painting at percent coordinates; no new AD | No project-level rule changes | n (Q6) |

**Open questions** (each has a recommended default; the spec is written with it):

- Q1 (D1, D8) The paths as drawn in `layout-target.png`: TIME follows the painted cyan vein (low on the trunk, then left along the bough) instead of the loop under the bough in your sketch; POWER is a band of four parallel paths climbing up and right from the trunk. Recommended: yes.
- Q2 (D2, D9) Fúria crescente opens at level 10 of `Limite de dano do combo` grade 1, so it sits on its own twig right after that node (beside grade 2), not after grade 3. Alternative: put it after grade 3 and change the rule so it opens at level 10 of grade 3 (a backend change, a migration-free catalog edit, and a new decision record; players who already bought it keep their levels). Recommended: keep the rule, twig after grade 1.
- Q3 (D3) Nodes of 44 px (Fúria crescente 56 px), icons of 28 and 36 px. Recommended: yes.
- Q4 (D4) The 10 description texts of P1 Card AC 1, the same text for the three grades of a talent. Recommended: yes.
- Q5 (D5, D6) Card of 460 x 136 px with the 88 px icon on the right, level and effect on one row, the icon in colour even when the talent is locked. Recommended: yes.
- Q6 (D10) No new decision record; this spec overrides the sizes and coordinates of `talent-tree-rework`. Recommended: yes.

Open questions: none beyond Q1 to Q6 above, each written into the spec with its recommended default (the owner answers them when approving).

---

## User Stories

### P1: The chains climb their own boughs ⭐ MVP

**User Story**: As a player, I want each talent chain to start where its coloured bough leaves the trunk and climb along it, so that the tree reads like the painting and I see which bough I am growing.

**Why P1**: The main request of the owner; the other stories reuse the new coordinates.

**Acceptance Criteria** (board px are of the 1024 x 576 board, origin top left; a node box is its 44 x 44 px square, 56 x 56 px for `COMBO_FURY`):

1. The tree SHALL centre each of the 28 nodes on its coordinates of design § Layout map, within 1 px on the desktop: `CLICK_DAMAGE` at (542.72, 285.12) px (53 %, 49.5 %), `MINIBOSS_TIME` at (445.44, 334.08) px (43.5 %, 58 %), `COMBO_FURY` at (778.24, 357.12) px (76 %, 62 %).  <!-- ubiquitous -->
2. The tree SHALL place, in each of the 9 graded chains, grade 1 nearest the trunk fork (512, 334.08) px and each next grade farther from it: the distances of grades 1, 2 and 3 strictly grow (design § Layout map lists them, e.g. `CLICK_DAMAGE` 57.8, 133.4, 209.6 px).  <!-- ubiquitous -->
3. The tree SHALL keep every `TIME` and `BREAK` node at x below 50 % and every `POWER` and `COMBO` node at x above 50 %, every `BREAK` and `POWER` grade 3 node at y below 25 % (high on the board), and every `TIME` and `COMBO` grade 1 node at y above 55 % (low on the board, next to the trunk base).  <!-- ubiquitous -->
4. The tree SHALL draw no two node boxes intersecting, and no node box or grade 1 caption (80 px wide, under its node) intersecting another node, another caption, a banner, the title plaque `talent-title`, the close button `hero-close`, the detail card `talent-detail` (460 x 136 px), the medallion `talent-points` or the button `talent-reset`.  <!-- ubiquitous -->
5. WHEN the player clicks the centre of any of the 28 nodes THEN the game SHALL select that node (the element at its centre belongs to it: no caption, chip, mark or other node covers it).  <!-- event-driven -->
6. The tree SHALL centre the four banners (140 x 34 px) at `TIME` (13.5, 30), `BREAK` (24, 6), `POWER` (66.5, 3.5) and `COMBO` (88, 58) percent, each inside the board and clear of every node box, caption and the title plaque.  <!-- ubiquitous -->
7. The tree SHALL give the lit layers the ellipses (centre x, centre y, rx, ry, percent) `TIME` (29, 52, 18, 17), `BREAK` (38, 27, 14, 21), `POWER` (68, 28, 19, 24) and `COMBO` (71, 58, 18, 17), with the opacity rule of `talent-tree-rework` D17 unchanged.  <!-- ubiquitous -->
8. IF the painted board is missing THEN the fallback veins SHALL be 11 polylines: `50,100 50,58`; then, in catalog order (`MINIBOSS_TIME`, `BOSS_DAMAGE`, `PHYSICAL_BREAK`, `ARMOR_PIERCE`, `CLICK_DAMAGE`, `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE`, `COMBO`), `50,58` followed by the grade 1, 2 and 3 coordinates of the chain (the `MINIBOSS_TIME` vein reads `50,58 43.5,58 33,43.5 20,40`); and last `60,61 76,62`.  <!-- unwanted-behavior -->

**Independent Test**: Open Talentos on the desktop with the real art: each chain starts at the trunk on its coloured vein and climbs along its bough (`layout-target.png`); with the art missing, 11 dashed veins follow the same paths.

---

### P1: Smaller nodes ⭐ MVP

**User Story**: As a player, I want smaller talent nodes, so that the boughs are not crowded and I still read and click every node.

**Why P1**: Without it the 28 nodes do not fit the boughs (owner request 2).

**Acceptance Criteria**:

1. The tree SHALL draw every node 44 x 44 px with a 28 x 28 px icon, and `COMBO_FURY` 56 x 56 px with a 36 x 36 px icon.  <!-- ubiquitous -->
2. The tree SHALL draw the grade badge of a grade 2 or 3 node 18 x 18 px with a 10 px `II` or `III`; the seal of a maxed or available node 18 x 18 px with its top left corner 6 px outside the node; the lock of a locked node 20 x 20 px with its top left corner 7 px outside the node; the level chip at 11 px and the caption 80 px wide at 12 px, as today.  <!-- ubiquitous -->
3. WHILE a node is locked the tree SHALL keep its lock clear of its level chip (the boxes of `.talent-node-lock` and `.talent-node-level` do not intersect), on all 19 locked nodes of a fresh account.  <!-- state-driven -->

**Independent Test**: Open Talentos: `Dano de clique (%)` measures 44 x 44 px, Fúria crescente 56 x 56 px; a click on any node fills the card with that talent.

---

### P1: The card explains the talent ⭐ MVP

**User Story**: As a player, I want the detail card to tell me in plain words what the selected talent does and show its icon big, so that I know what I am buying.

**Why P1**: Owner request 3; the names alone do not say how a talent works.

**Acceptance Criteria**:

1. WHEN the player selects a node THEN the card SHALL show `talent-description-<ID>` with the text of its `baseId`, the same for grades 1, 2 and 3:

   | `baseId` | Text |
   | -------- | ---- |
   | `MINIBOSS_TIME` | `Você ganha mais segundos para derrotar cada miniboss antes que o tempo acabe.` |
   | `BOSS_DAMAGE` | `Os golpes do seu líder causam mais dano em minibosses e chefes de capítulo.` |
   | `PHYSICAL_BREAK` | `Diminui a defesa dos inimigos, então cada golpe tira mais vida deles.` |
   | `ARMOR_PIERCE` | `Os golpes do seu líder ignoram uma parte da defesa que ainda resta no inimigo.` |
   | `CLICK_DAMAGE` | `Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.` |
   | `CLICK_FLAT_DAMAGE` | `Soma um valor fixo ao dano de cada clique do seu líder, antes dos bônus em porcentagem.` |
   | `CRIT_CHANCE` | `Aumenta a chance de um golpe do seu líder ser crítico; o que passar de 100% contra o inimigo vira dano crítico.` |
   | `CRIT_DAMAGE` | `Os golpes críticos do seu líder causam ainda mais dano.` |
   | `COMBO` | `Cliques seguidos somam um bônus de dano; este talento aumenta o limite desse bônus.` |
   | `COMBO_FURY` | `Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.` |
   <!-- event-driven -->
2. IF the selected talent's `baseId` (or its `id` when `baseId` is missing) has no text in the table THEN the card SHALL show no description element and the rest of the card as today, with no error.  <!-- unwanted-behavior -->
3. WHEN the player selects a node THEN the card SHALL show `talent-detail-icon` at its right: an 88 x 88 px circle with a 3 px solid border in the branch colour (`TIME` `rgb(59, 154, 166)`, `BREAK` `rgb(196, 73, 47)`, `POWER` `rgb(201, 154, 31)`, `COMBO` `rgb(138, 91, 214)`), a box shadow containing a 2 px `rgb(28, 18, 12)` ring and a 14 px glow of the branch colour, holding the talent art 64 x 64 px from `assets/<talentIconName(baseId, grade)>.png` (`assets/talent-click-damage-g2.png` for `CLICK_DAMAGE_G2`).  <!-- event-driven -->
4. IF the icon file of the selected talent is missing THEN the card icon SHALL try the grade 1 file for a grade 2 or 3 talent and then show the branch glyph (`⏳`, `🛡`, `⚔`, `✦`) at 34 px in `rgb(244, 230, 200)` inside the same ring.  <!-- unwanted-behavior -->
5. The card SHALL be 460 x 136 px, 8 px above the bottom of the window, centred, with the level and the effect on one row (`talent-level-<ID>` and `talent-effect-<ID>` at the same top), and no text of it clipped (its text column's `scrollHeight` at most its `clientHeight`) for an open talent with its button, a maxed talent, a locked grade, and Fúria crescente locked (`Bloqueado: chegue ao nível 10 de Limite de dano do combo`).  <!-- ubiquitous -->
6. WHILE no node is selected the card SHALL show only `Escolha um talento na árvore para ver os detalhes.`, with no icon and no description.  <!-- state-driven -->
7. The card SHALL keep the name, level, effect, button, `Nível máximo` and lock texts and test ids of `talent-tree-rework` P2 Tree AC 5 to AC 8.  <!-- ubiquitous -->

**Independent Test**: Select `Dano de clique (%)`: the card reads `Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.` and shows the gold-ringed icon at the right; route the icons as missing: the ring shows `⚔`.

---

### P2: Fúria crescente after the talent that opens it

**User Story**: As a player, I want Fúria crescente drawn after the combo talent that opens it, so that the tree shows the order I unlock things in.

**Why P2**: A placement rule inside the COMBO bough; P1 places the other 27 nodes.

**Acceptance Criteria**:

1. The tree SHALL place `COMBO_FURY` at (76, 62) percent, farther from the trunk fork than `COMBO` (267.2 px against 103.8 px), and not between the trunk and `COMBO`.  <!-- ubiquitous -->
2. IF the painted board is missing THEN the vein that reaches `COMBO_FURY` SHALL start at `COMBO` (`60,61 76,62`), and the COMBO chain vein SHALL not pass through `COMBO_FURY` (`50,58 60,61 69.5,56 86,42`).  <!-- unwanted-behavior -->
3. The tree SHALL render the COMBO branch nodes in the DOM order `COMBO`, `COMBO_G2`, `COMBO_G3`, `COMBO_FURY`, so the keyboard reaches Fúria crescente after the chain.  <!-- ubiquitous -->
4. WHILE `COMBO` is below level 10 the node `COMBO_FURY` SHALL stay locked with the lock text of `talent-tree-rework` P2 Fúria AC 9 (rule unchanged).  <!-- state-driven -->

**Independent Test**: Open Talentos with the art missing: the dashed vein reaches Fúria crescente from `Limite de dano do combo`, and Tab goes through the three COMBO grades before Fúria crescente.

---

## Edge Cases

- IF the talent list misses `COMBO_FURY` (an older backend) THEN the tree SHALL draw 27 nodes and the 11 fallback veins unchanged (the veins are static art), with no error.
- IF the talent list holds a talent with no position (a newer backend) THEN the tree SHALL draw no node for it (unchanged, `talent-tree-rework` P2 Tree AC 14).
- WHEN a grade 2 or 3 talent is selected THEN the description SHALL be its grade 1 text (`CLICK_DAMAGE_G3` reads the `CLICK_DAMAGE` text).
- WHEN the selected talent changes THEN the card icon and the description SHALL change with it in the same render.
- WHEN the board is shown at 1280 x 720 (the canvas scaled) THEN the rules of P1 hold in board px (the e2e tests measure in board px, as `talentTreeRework.spec.js` does).
- IF the viewport is at most 640 px wide THEN the existing phone behaviour SHALL hold: the e2e tests `on a 390 x 844 phone the tree is zoomed twice, opens centred and keeps the scroll`, `on a phone the selected Fúria crescente ends above the detail card` and `the lock of a locked node does not overlap its level pill on the 390 x 844 phone` pass unchanged.

---

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Failure / partial-failure states | Missing art: the board, frames and icons keep their fallbacks (P1 Card AC 4, P1 Branches AC 8) |
| State-transition integrity | Unlock rules unchanged (P2 Fúria AC 4); selection behaviour unchanged (P1 Card AC 7) |
| Remaining dimensions | N/A for this scope: no request, no storage, no new input, no concurrency, no external service; the feature changes coordinates, sizes and texts of one screen |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TTB-01 | P1 Branches: AC 1, AC 2, AC 3 (coordinates, grade order, sides) | Tasks | Pending |
| TTB-02 | P1 Branches: AC 4, AC 5 (no overlap, every node clickable) | Tasks | Pending |
| TTB-03 | P1 Branches: AC 6, AC 7, AC 8 (banners, lit ellipses, fallback veins) | Tasks | Pending |
| TTB-04 | P1 Sizes: AC 1, AC 2, AC 3 (node, icon and mark sizes) | Tasks | Pending |
| TTB-05 | P1 Card: AC 1, AC 2 (descriptions) | Tasks | Pending |
| TTB-06 | P1 Card: AC 3, AC 4 (card icon and its fallback) | Tasks | Pending |
| TTB-07 | P1 Card: AC 5, AC 6, AC 7 (card size, layout, empty state, kept texts) | Tasks | Pending |
| TTB-08 | P2 Fúria: AC 1, AC 2, AC 3, AC 4 (place, vein, DOM order, rule) | Tasks | Pending |
| TTB-09 | Edge Cases (older backend, phone tests kept) | Tasks | Pending |

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] On the desktop with the real art, each of the four branches starts at the trunk on its coloured vein and the `ui-artist` review is APROVADO.
- [ ] No node, caption, banner or fixed part overlaps another (e2e), and all 28 nodes select on a click at their centre.
- [ ] Every one of the 10 talents shows its description and icon on the card, with the glyph when the art is missing.
