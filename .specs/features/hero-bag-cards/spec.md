# Hero Bag Cards (Mochila + Fusão) Specification

## Problem Statement

The Mochila lists one row per (hero, stars) pair (`bagEntries`), so a player with five heroes on several star layers reads a long list with a vertical scrollbar ("Lyra Folhaveloz 0★ x45", "Lyra Folhaveloz 1★ x1", ...). Fusing takes a second screen (Fusão, a HUD button of its own) and one click per fusion: turning 45 blank cards into 3★ cards takes 22 clicks on three different rows. The owner approved a mockup on 2026-11-17 that merges both screens into one Mochila with one framed card per hero, a fusion ladder per hero and a "Fundir tudo" cascade. The same mockup fixes the rarity gems of the item tiles, which today sit stuck to the top-left corner.

## Goals

- [ ] The Mochila shows the five heroes as five cards with no vertical scrollbar in the panel, whatever the number of star layers each hero holds.
- [ ] Every fusion a player can make is reachable from the Mochila; the HUD has no Fusão button.
- [ ] Fusing every layer of one hero takes 3 clicks and 1 request (`Fundir tudo`, `Sim, fundir`, and the card click before them), whatever the number of copies; it is all-or-nothing on the server.
- [ ] The rarity gems of every piece tile sit centered on the top edge of the tile.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Painted (image) card frames | CSS frames ship first; the owner's reference art becomes an optional follow-up asset task (design.md § Card frames, Q3) |
| "Fundir tudo" for every hero at once | Not asked; one hero at a time keeps the preview readable |
| A partial cascade (stop at a chosen star) | Not asked; the single-step row buttons cover a careful player |
| Changing the fusion rule, the drop rates or the skill levels | AD-020 unchanged: 3 copies of s (0 to 8) make 1 copy of s + 1 |
| Sorting or filtering the cards | The five heroes always show in catalog order |
| Selling or discarding cards | Cards have no price (`bulk-sell` Out of Scope) |
| A database migration | `fuse-all` changes `card_copies` rows like the single fusion; no column or table changes (AD-016 not triggered) |
| The Heróis catalog screen | Unchanged; it keeps its own grid |
| Readable text on phones (a phone layout of the panel) | The scaled 1024x768 canvas shrinks every screen, not only the Mochila (ui-review finding #8, D27); tracked as TD-010 in `STATE.md` |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here. Rows marked `n` are product owner defaults that wait for the owner's approval of this spec (questions Q1 to Q8 in the hand-off).

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Centered gems | `.piece-gems` gets `left: 50%; transform: translateX(-50%)` and keeps `top: -5px`; the refine badge, the tile size and the gem count per rarity do not change. One CSS rule covers every tile (bag, slots, bulk sell) because all use `renderPieceTile` | Approved mockup (owner, 2026-11-17) | y |
| D2 No scrollbar | The Mochila card grid fits the panel (`.hero-window` `scrollHeight <= clientHeight`) at 1280x720 and at 390x844. The game is one 1024x768 canvas scaled to the screen, so the phone shows the same five-column grid scaled down, never the old list. The hero detail (ladder plus skills) may scroll when a hero holds many layers | Approved mockup; the canvas does not reflow on phones (`game/public/style.css:344` comment) | y |
| D3 One card per hero | Every hero of `GET /heroes` gets one card in payload order; owned heroes are clickable, the others are disabled and grey with `Não encontrado` | Approved mockup | y |
| D4 Card art | The card shows the standing sprite `assets/heroes/<id>_sprite.png` (the art of the Heróis catalog), not `<id>_position.jpg`: the `_position.jpg` files are three-view turnaround sheets on a magenta chroma-key background and cannot be shown as a portrait | Checked `game/public/assets/heroes/lyra_position.jpg`; `uiRedesign.spec.js` forbids magenta in hero art | n (Q1) |
| D5 Frame tiers | Frame by the hero's best star (`hero.stars`): `wood` 0 to 3, `silver` 4 to 6, `gold` 7 to 9, from the existing `ASCENDED_FROM = 4` and `EXALTED_FROM = 7`. A hero not owned uses `wood` | Approved mockup; reuses the AD-020 tiers | y |
| D6 Star badge colours | The badge keeps the AD-020 star colours (0 to 3 `--color-accent-700`, 4 to 6 purple `#7a3fa0`, 7 to 9 gold chip `#d9a521` with `#201e1d` text); only the frame around the card is silver or gold | AD-020 stays active; the frame is a new element, so no AD conflict | y |
| D7 Chips | One chip per layer with at least one copy, ascending, text `<s>★×<c>` (× is U+00D7). Chips are separate elements with a visual gap and no `·` character between them | The mockup's `0★×45 · 1★×1 · 2★×2` reads as three chips; a separator character adds nothing to separate pills | n (Q2) |
| D8 Unowned text | `Não encontrado` (capital N), the owner's wording, in place of the chips | Owner's mockup text; sentence case like the catalog's `Não obtido` | y |
| D9 Fundir badge | Text `Fundir`, shown while any layer 0 to 8 holds 3 or more copies | Approved mockup | y |
| D10 Ladder rows | One row per layer with at least one copy, ascending (0★ at the top), plus the row of the layer above the highest held layer t, with 0 copies, when t ≤ 8 and layer t holds 3 or more copies (the next fusion reaches it) | "plus the next layer when it can be reached": a row is reachable when its row button below can fuse now | n (Q4) |
| D11 Row content | Name `<s>★`, a progress bar of `min(c, 3)/3`, the count `<c>/3` (the real count, so `45/3`) and the button `<s>★→<s+1>★` (no spaces, → is U+2192), enabled only when c ≥ 3. The 9★ row shows `Cópias: <c>` and `Estrela máxima: não pode ser fundida`, no bar and no button | Approved mockup; the 9★ text reuses the old bag detail text that `heroAscension.spec.js` pinned | y |
| D12 Fundir tudo on the server | A new endpoint `POST /heroes/{id}/fuse-all` does the whole cascade in one transaction under the `player_cards` row lock and answers `{ hero, fusions }`. The game never loops over `POST /heroes/{id}/fuse` | No bulk endpoint exists (`HeroController.kt:96` has only `fuse`). A loop would send up to 9 841 requests for 19 683 cards and could stop halfway, leaving the bag different from the preview; one transaction is all-or-nothing | n (Q5) |
| D13 No stale-preview check | `fuse-all` carries no expected counts: the server fuses what it holds. If a card dropped between the preview and `Sim, fundir`, the result line uses the server's `fusions` and hero | A cascade only ever turns cards into better cards, so fusing one more card never harms the player; the `fromLevel` guard of AD-011 protects spends, not this | n (Q6) |
| D14 Cascade preview text | `Fazer <n> fusões?` (`Fazer 1 fusão?`) and two preview lines `Antes: <before>` and `Depois: <after>` (D21 replaced the single line `<before> → <after>`), each side the layers with at least one copy as `<c>×<s>★` joined by ` + `. The owner's example "45×0★ + 1×1★ + 2×2★ → 1×2★ + 2×3★" drops a copy: 45 blank make 15 1★ (16 with the one held), 16 make 5 2★ and leave 1, 7 2★ make 2 3★ and leave 1, so the preview is `45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★` (22 fusions) | Lesson L-010: every on-screen text is stated in full; the arithmetic is the rule of AD-020 applied layer by layer | n (Q7) |
| D15 Fundir tudo result | `<n> fusões. Melhor carta: <nome> <s>★` (`1 fusão.` for one), then ` · <skill> no nível <level>` for every skill, in slot order, whose level in the answer is 2 or more and higher than before the request | Keeps the single-fusion feedback ("from 4★, the skill raised") for a cascade that can raise several skills at once | n (Q7) |
| D16 Fusão menu entry | Removed: the HUD shows six buttons (Heróis, Mochila, Líder, Equipamento, Talentos, Rever chefes) and the `fusion` screen is deleted | Two buttons that open the same screen confuse the rail; the `Fundir` badge on the cards shows where fusions wait. The rail tests of `ui-redesign` (UIR-03) are updated to six buttons; this spec supersedes that list | n (Q8) |
| D17 Busy lock | While a fusion request (row or Fundir tudo) runs, every ladder button, `Fundir tudo` and the confirmation buttons are disabled; `Voltar` and `Fechar` stay enabled | The old screen had no guard (`HeroUi.js:307`), so a double click sent two requests | y |
| D18 Failure handling | A refused or failed fusion shows `Não foi possível fundir as cartas.` and keeps the ladder as it was; the game does not reload the bag | Existing behaviour of the single fusion (`heroes.spec.js` "a failed fusion..."); `fuse-all` is all-or-nothing, so nothing changed on the server either | y |
| D19 Testids | Stable: `hud-bag`, `bag-badge`, `bag-list`, `bag-empty`, `bag-entry-detail`, `fusion-list`, `fusion-row-<id>-<s>`, `fusion-button-<id>-<s>`, `.fusion-copies` (same `c/3` format), `fusion-result`, `skill-list`. Changed text: `fusion-button-*` reads `<s>★→<s+1>★` (was `Fundir`), `.fusion-name` reads `<s>★` (was `<nome> <s>★ → <s+1>★`). Removed: `hud-fusion`, `bag-entry-<id>-<s>`, `bag-go-fusion`, `.bag-needed`, `fusion-empty`, the `is-selected` row class. New: listed in design.md § Test ids | Keeps every e2e locator that still means the same thing | y |
| D20 Order of the deploy | The backend tasks land first; the game calls `fuse-all` only from a later commit. If the backend is rolled back below `fuse-all`, `Fundir tudo` fails with the error line and changes nothing | AD-023 deploys every push; a game commit never depends on a backend commit after it | y |
| D21 UI review #6: preview in two lines | The preview `fusion-all-preview` is a `div` with two lines: `p.fusion-all-before` (testid `fusion-all-before`) `Antes: <before>` and `p.fusion-all-after` (testid `fusion-all-after`) `Depois: <after>`, 15 px; the `→` line is gone. 45/1/2 copies read `Antes: 45×0★ + 1×1★ + 2×2★` and `Depois: 1×1★ + 1×2★ + 2×3★` | The owner's mockup labels the two sides; the ui-artist found the single 14 px arrow line hard to read (`ui-review.html` finding #6) | y |
| D22 UI review #4: in-flight label | While a fusion request runs, the button that sent it reads `Fundindo...` (three ASCII dots, like `Acordando o servidor, aguarde...`): the row button for a row fusion, `fusion-all` for Fundir tudo, and only in the detail of the hero whose request runs. `bag-entry-detail` carries `is-busy` while any fusion request runs, and only then its disabled buttons show `cursor: progress`; a button disabled for lack of copies keeps `cursor: not-allowed` | Busy and disabled looked the same (finding #4). The reviewer's rule `.bag-detail button:disabled { cursor: progress }` would also put the progress cursor on a 0/3 row with no request, so the cursor is scoped to `is-busy` | n |
| D23 UI review #7: gem size | Each `.piece-gem` is 10x10 px (border included, was 7x7) and `.piece-gems` has a 5 px gap (was 2 px): the 4 LEGENDARY gems make a 55 px row inside the 60 px tile and their turned tips do not touch | The reviewer asked for gems of at least 8 px of colour (finding #7); 10 px with its 1 px border leaves 8 px of colour, and 11 px would push the 4-gem row past the tile | n |
| D24 UI review #1, #2, #3, #5: card and result styles | Values in design.md § Card, § Card frames and § Fundir tudo: the gold sparkles move to the frame edge and the card text sits above every ornament; the hover ring is the opaque `--gold-400` plus `brightness(1.06)`; the wood frame is warm brown `#a06a35` with riveted iron corners; the silver frame gets two more vine leaves per corner; the result line of the Mochila is 16 px, balanced. Painted frame art stays out of scope | Findings #1, #2, #3, #5 of the ui-artist review (commit `4dc43c3`) with the reviewer's exact fixes | n |
| D25 Review suggestion: no Fundir badge in the detail | The card in the hero detail hides its `Fundir` badge (`.bag-detail .bag-card-fuse { display: none }`): the ladder already shows which rows fuse. The grid cards keep it (BAG-08) | Cheap CSS-only suggestion of the review; the badge points to the ladder, which the detail already shows | n |
| D26 Review suggestion: two-line ribbon | The name ribbon reserves two lines (`min-height: calc(2.3em + 8px)`) and centres a one-line name, so the chips of every card start at the same height | Cheap CSS-only suggestion of the review; the grid row already takes the height of the tallest card (a two-line name), so the grid does not grow (BAG-11 still holds; T17 checks it) | n |
| D27 UI review #8: tiny text on phones | Out of scope: the 1280x720 canvas scaled to 390 px makes 11 px chips about 4 px on every screen, not only the Mochila. Recorded as TD-010 in `STATE.md` | Predates this feature (the canvas does not reflow on phones, D2) | y |
| Player-facing text | Portuguese | AD-007 | y |
| Fusion rule | 3 copies of s (0 to 8) make 1 copy of s + 1; 9★ never fuses; skill levels as AD-020 | Existing rule | y |

**Open questions** (the spec is written with the recommended default of each; the owner approves or changes them before any task runs):

- Q1 (D4) Card art: use `<id>_sprite.png` because `<id>_position.jpg` is a turnaround sheet on magenta? Recommended: yes.
- Q2 (D7) Chips without a `·` between them? Recommended: yes.
- Q3 (design.md § Card frames) Ship CSS frames now and keep the painted frames of the reference art as a later asset task that needs the owner's 9-slice PNGs? Recommended: yes.
- Q4 (D10) The extra ladder row above the highest layer shows only when that layer can fuse now? Recommended: yes.
- Q5 (D12) A new backend endpoint `POST /heroes/{id}/fuse-all` instead of a loop of single fusions in the game? Recommended: yes.
- Q6 (D13) No stale-preview check: the server fuses what it holds at `Sim, fundir`? Recommended: yes.
- Q7 (D14, D15) The preview and result texts, with the corrected example `45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★`? Recommended: yes.
- Q8 (D16) Remove the Fusão HUD button instead of pointing it at the Mochila? Recommended: remove.

---

## User Stories

### P1: Centered rarity gems ⭐ MVP

**User Story**: As a player, I want the rarity gems centered on the top edge of every item tile so that the tile reads as a framed piece, not a misplaced sticker.

**Why P1**: Approved fix of the same mockup; one CSS rule.

**Acceptance Criteria**:

1. The game SHALL draw the gem row (`.piece-gems`) of every piece tile with `left: 50%`, `transform: translateX(-50%)` and `top: -5px`, so the horizontal center of the gem row is within 1 px of the horizontal center of the tile, for bag tiles, worn slot tiles and bag tiles in bulk-sell selection mode.  <!-- ubiquitous -->
2. The game SHALL keep the tile at 60x60 px, the gem count per rarity (COMMON 0, UNCOMMON 1, RARE 2, EPIC 3, LEGENDARY 4, `data-gems`) and the refine badge `+<n>` at `right: 2px; bottom: 1px`.  <!-- ubiquitous -->
3. The game SHALL draw each gem `.piece-gem` as a 10x10 px square, border included (`width: 10px; height: 10px`), turned 45°, with a 5 px gap between the gems of a row (`.piece-gems` `column-gap: 5px`), so the LEGENDARY row of 4 gems is 55 px wide and stays inside the 60 px tile (BAG-40, added by the UI review, D23).  <!-- ubiquitous -->

**Independent Test**: Open Equipamento with a LEGENDARY piece in the bag and read the gem row centered over the tile (|center x of `.piece-gems` − center x of the tile| ≤ 1 px).

---

### P1: One card per hero ⭐ MVP

**User Story**: As a player, I want one framed card per hero with its best star and its copies per star so that I read my whole collection at a glance, with no scrolling.

**Why P1**: The core of the mockup.

**Acceptance Criteria**:

1. WHEN the player opens the Mochila THEN the game SHALL show inside `bag-list` one card `bag-card-<heroId>` per hero of the heroes payload, in payload order, and no `bag-entry-<heroId>-<stars>` row.  <!-- event-driven -->
2. Each card of an owned hero SHALL show the standing art `assets/heroes/<id>_sprite.png`, a ribbon `.bag-card-ribbon` with the hero name, and a star badge `bag-card-star-<id>` centered on the top edge of the card with the text `<stars>★`, where stars is the hero's best star (`hero.stars`).  <!-- ubiquitous -->
3. Each card SHALL carry `data-frame="wood"` and the class `frame-wood` when the best star is 0 to 3, `data-frame="silver"` and `frame-silver` for 4 to 6, `data-frame="gold"` and `frame-gold` for 7 to 9.  <!-- ubiquitous -->
4. The star badge SHALL carry the class `hero-stars` plus `is-ascended` for 4 to 6 stars and `is-exalted` for 7 to 9 stars (AD-020 colours).  <!-- ubiquitous -->
5. Each card of an owned hero SHALL show one chip `.bag-card-chip` per star layer with at least one copy, ascending, with the text `<s>★×<c>`: a hero with 45 blank, 1 one-star and 2 two-star copies shows the chips `0★×45`, `1★×1`, `2★×2` in that order.  <!-- ubiquitous -->
6. WHILE an owned hero holds 3 or more copies of a layer from 0 to 8 its card in the grid SHALL show the badge `bag-card-fuse-<id>` with the text `Fundir`, and SHALL show no such badge otherwise; the card in the hero detail (`bag-detail-card-<id>`) never shows it (D25).  <!-- state-driven -->
7. IF the player does not own a hero THEN its card SHALL be a disabled button with the class `is-grey` and `data-frame="wood"`, showing the art, the ribbon and the text `Não encontrado` (`.bag-card-missing`), and no star badge, no chip and no `Fundir` badge.  <!-- unwanted-behavior -->
8. WHEN the player clicks the card of a hero they do not own THEN the game SHALL open nothing (no `bag-entry-detail`).  <!-- event-driven -->
9. WHILE the Mochila grid shows the panel `.hero-window` SHALL not scroll (`scrollHeight <= clientHeight`), with five owned heroes that each hold copies on all ten layers, at the viewport 1280x720 and at the viewport 390x844.  <!-- state-driven -->

**Independent Test**: With Kael 45/1/2 copies of 0★/1★/2★, Lyra one 4★ copy and Orina one 7★ copy, open the Mochila and read Kael wood `2★` with three chips and `Fundir`, Lyra silver `4★`, Orina gold `7★`, Seraphine and Vex grey `Não encontrado`, and no scrollbar.

---

### P1: Fusion ladder of a hero ⭐ MVP

**User Story**: As a player, I want to open a hero card and fuse its layers one step at a time from the same window so that I never switch to another screen to fuse.

**Why P1**: The Fusão screen is merged into the Mochila; without the ladder no single fusion is possible.

**Acceptance Criteria**:

1. WHEN the player clicks the card of an owned hero THEN the game SHALL replace the grid with the hero detail `bag-entry-detail`, show the `Voltar` button, and the detail SHALL hold the hero's card (not clickable), the ladder `fusion-list`, the button `Fundir tudo` (`fusion-all`) and the hero's skill list `skill-list` with its 3 rows.  <!-- event-driven -->
2. The ladder SHALL show one row `fusion-row-<id>-<s>` per layer s with at least one copy, ascending from 0★, plus the row of layer t + 1 with 0 copies when t, the highest layer with copies, is at most 8 and holds 3 or more copies: 45/1/2 copies of 0★/1★/2★ show the rows 0, 1, 2; 3 blank copies show the rows 0 and 1; one 9★ copy shows the row 9 only.  <!-- ubiquitous -->
3. Each row of a layer s from 0 to 8 SHALL show the name `.fusion-name` `<s>★`, a bar `.fusion-bar` with `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="3"` and `aria-valuenow` = min(c, 3), whose fill `.fusion-bar-fill` has the inline width `0%`, `33.333%`, `66.667%` or `100%` for min(c, 3) = 0, 1, 2, 3, the count `.fusion-copies` `<c>/3`, and the button `fusion-button-<id>-<s>` with the text `<s>★→<s+1>★`.  <!-- ubiquitous -->
4. WHILE a layer from 0 to 8 holds fewer than 3 copies its row button SHALL be disabled, and enabled while it holds 3 or more and no fusion request runs.  <!-- state-driven -->
5. The 9★ row SHALL show the name `9★`, the count `.fusion-copies` `Cópias: <c>` and the text `.fusion-max` `Estrela máxima: não pode ser fundida`, with no bar and no button.  <!-- ubiquitous -->
6. WHEN the player clicks an enabled row button of layer s THEN the game SHALL send one `POST /heroes/<id>/fuse` with `{"stars": s}`, and on success redraw the detail from the hero the server answered and show `fusion-result` with `Nova carta: <nome> <s+1>★`, followed for s + 1 ≥ 4 by ` · <skill> no nível <level>` for the skill of slot `raisedSkillSlot(s + 1)` and its level in the answer.  <!-- event-driven -->
7. WHILE a fusion request (row or Fundir tudo) runs every row button, `Fundir tudo` and the confirmation buttons SHALL be disabled, so a second click sends no request, and `Voltar` and `Fechar` SHALL stay enabled.  <!-- state-driven -->
8. IF a row fusion fails THEN the game SHALL show the error line `Não foi possível fundir as cartas.`, keep every row count as it was before the click and show no `fusion-result`.  <!-- unwanted-behavior -->
9. WHEN the player clicks `Voltar` THEN the game SHALL show the card grid with the counts after every fusion made in the detail.  <!-- event-driven -->
10. WHEN a fusion succeeds THEN the game SHALL update the leader's skill bar from the answered hero without another `GET /heroes`.  <!-- event-driven -->
11. IF the answer of a fusion arrives after the panel was closed or another screen was opened THEN the game SHALL draw nothing in the panel.  <!-- unwanted-behavior -->
12. WHILE a fusion request runs the game SHALL show the text `Fundindo...` on the button that sent it (the row button `fusion-button-<id>-<s>` of a row fusion, `fusion-all` of a Fundir tudo) in the detail of that hero only, keep the text of every other button, put the class `is-busy` on `bag-entry-detail` and draw its disabled buttons with the cursor `progress`; a disabled button of a detail with no running request keeps the cursor `not-allowed` (BAG-41, added by the UI review, D22).  <!-- state-driven -->

**Independent Test**: With 3 blank Kael copies, open Kael, click `0★→1★` and read `Nova carta: Kael Raizférrea 1★`, the 0★ row gone, the 1★ row at `1/3`, and the first skill slot of the bar unlocked.

---

### P1: Fundir tudo on the server ⭐ MVP

**User Story**: As a player, I want the server to fuse every layer of a hero in one request so that a cascade is fast and never half done.

**Why P1**: The screen needs it; the server owns the cards (AD-005).

**Acceptance Criteria**:

1. WHEN an authenticated player posts `POST /heroes/{id}/fuse-all` for a hero that holds 3 or more copies of some layer from 0 to 8 THEN the server SHALL, in one transaction under the `player_cards` row lock, fuse from 0★ upward, each layer s fusing floor(c_s / 3) times where c_s is its copies plus the copies the layer below made, keeping c_s mod 3, the 9★ layer receiving the copies made from 8★ and never fusing, and answer 200 with `{"hero": <the hero as GET /heroes answers it>, "fusions": <total fusions, integer>}`.  <!-- event-driven -->
2. The server SHALL answer these results: 45/1/2 copies of 0★/1★/2★ end at 0★ 0, 1★ 1, 2★ 1, 3★ 2, `stars` 3, `fusions` 22; 27 blank copies end at 3★ 1 and nothing else, `fusions` 13; 7 copies of 8★ and 1 of 9★ end at 8★ 1, 9★ 3, `fusions` 2; 19 683 blank copies end at 9★ 1, `fusions` 9 841; 3 copies of 3★ end at 4★ 1 with skill levels 2, 1, 1 and `fusions` 1.  <!-- ubiquitous -->
3. The server SHALL change no copy of another hero, no wallet and no leader in a `fuse-all`.  <!-- ubiquitous -->
4. IF no layer from 0 to 8 of the hero holds 3 or more copies (a hero not owned included) THEN the server SHALL answer 409 with code `NOTHING_TO_FUSE` and change nothing.  <!-- unwanted-behavior -->
5. IF the hero id is not in the catalog THEN the server SHALL answer 404 with code `HERO_NOT_FOUND`.  <!-- unwanted-behavior -->
6. IF an unauthenticated request reaches `POST /heroes/{id}/fuse-all` THEN the server SHALL answer 401.  <!-- unwanted-behavior -->
7. IF two `fuse-all` requests of the same player for a hero with exactly 3 blank copies arrive at once THEN the server SHALL run them one after the other, so one answers 200 with `fusions` 1, the other 409 `NOTHING_TO_FUSE`, and the bag ends with one 1★ copy.  <!-- unwanted-behavior -->
8. The server SHALL keep `POST /heroes/{id}/fuse` working as before (every existing `HeroControllerIT` fuse test passes unchanged).  <!-- ubiquitous -->

**Independent Test**: Against the API, give Kael 45/1/2 copies of 0★/1★/2★, post `fuse-all` and read 200, `fusions` 22 and the stored copies 1★ 1, 2★ 1, 3★ 2; post it again and read 409 `NOTHING_TO_FUSE`.

---

### P1: Fundir tudo on the screen ⭐ MVP

**User Story**: As a player, I want one button that fuses a hero as far as its copies go, with a preview first, so that I never click the same row twenty times and never fuse by accident.

**Why P1**: The click saving the owner asked for.

**Acceptance Criteria**:

1. WHILE the hero detail shows and no fusion request runs `Fundir tudo` SHALL be enabled when some layer from 0 to 8 holds 3 or more copies and disabled otherwise.  <!-- state-driven -->
2. WHEN the player clicks `Fundir tudo` THEN the game SHALL show the confirmation `fusion-all-confirm` with the question `fusion-all-question` `Fazer <n> fusões?` (`Fazer 1 fusão?` when n is 1), the preview `fusion-all-preview` with the two lines `fusion-all-before` `Antes: <before>` and `fusion-all-after` `Depois: <after>`, the buttons `Sim, fundir` (`fusion-all-yes`) and `Não` (`fusion-all-no`), and SHALL send no request; each side of the preview lists the layers with at least one copy, ascending, as `<c>×<s>★` joined by ` + `, so 45/1/2 copies read `Fazer 22 fusões?`, `Antes: 45×0★ + 1×1★ + 2×2★` and `Depois: 1×1★ + 1×2★ + 2×3★` (D21; amended by the UI review, was one line `<before> → <after>`).  <!-- event-driven -->
3. WHILE the confirmation shows every row button and `Fundir tudo` SHALL be disabled.  <!-- state-driven -->
4. WHEN the player clicks `Não` THEN the game SHALL hide the confirmation, send no request and keep every count.  <!-- event-driven -->
5. WHEN the player clicks `Sim, fundir` THEN the game SHALL hide the confirmation and send exactly one `POST /heroes/<id>/fuse-all`, and on success redraw the detail from the answered hero and show `fusion-result` with `<n> fusões. Melhor carta: <nome> <s>★` (`1 fusão. Melhor carta: ...` when n is 1), where n is the answer's `fusions` and s the answered hero's `stars`.  <!-- event-driven -->
6. WHEN a Fundir tudo succeeds THEN the result line SHALL end with ` · <skill> no nível <level>` for every skill, in slot order, whose level in the answer is 2 or more and higher than its level before the request: 9 copies of Kael 3★ read `4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2`.  <!-- event-driven -->
7. IF a Fundir tudo fails THEN the game SHALL show the error line `Não foi possível fundir as cartas.`, hide the confirmation, keep every count as before the click and show no `fusion-result`.  <!-- unwanted-behavior -->

**Independent Test**: With Kael 45/1/2 copies, open Kael, click `Fundir tudo`, read the preview, click `Sim, fundir` and read `22 fusões. Melhor carta: Kael Raizférrea 3★` after one request.

---

### P2: One way into the cards

**User Story**: As a player, I want one menu entry for my cards so that I do not wonder whether Mochila and Fusão differ.

**Why P2**: Cleans the rail; the merged screen already works without it.

**Acceptance Criteria**:

1. The HUD SHALL show six buttons in this order: `Heróis`, `Mochila`, `Líder`, `Equipamento`, `Talentos`, `Rever chefes`, and no `hud-fusion` button.  <!-- ubiquitous -->
2. The game SHALL keep the red dot `bag-badge` on `Mochila` as before: lit by a dropped card while the Mochila is not open, cleared when the Mochila opens.  <!-- ubiquitous -->

**Independent Test**: Log in and read six rail buttons with no `Fusão`; win a card and read the red dot on `Mochila`.

---

## Edge Cases

- WHEN a hero holds only 9★ copies THEN its card SHALL show no `Fundir` badge, its ladder only the 9★ row and `Fundir tudo` SHALL be disabled (BAG-08, BAG-13, BAG-31).
- WHEN a fusion takes the last copies of a layer THEN that row SHALL disappear and the layer above SHALL show its new count (BAG-13, BAG-17).
- WHEN a card drops while the Mochila is closed THEN the next opening SHALL show the new count in the chips, and a hero owned for the first time SHALL show in colour (BAG-07, BAG-09).
- WHEN the player clicks `Voltar` while a fusion request runs THEN the grid SHALL show, and the answer SHALL redraw the grid with the new counts (BAG-18, BAG-20).
- IF the server holds more copies than the preview counted (a card dropped in between) THEN the result line SHALL use the server's `fusions` and hero (BAG-35, D13).
- IF the backend answers 404 for `fuse-all` (a rollback below this feature) THEN the game SHALL follow the failure path of BAG-37 (D20).
- IF the heroes cannot be loaded THEN the Mochila SHALL show `Não foi possível carregar.` as today.
- WHEN a fusion answer arrives (success or failure) THEN the button that read `Fundindo...` SHALL read its own text again (`<s>★→<s+1>★` or `Fundir tudo`) and `bag-entry-detail` SHALL lose `is-busy` (BAG-41).
- WHEN the player goes back and opens another hero while a fusion of Kael runs THEN no button of that hero's detail SHALL read `Fundindo...`, and every one of its fusion buttons SHALL stay disabled until the answer (BAG-18, BAG-41).

---

## Requirement Traceability

IDs follow the order of the criteria: BAG-01 to BAG-02 "Centered rarity gems", BAG-03 to BAG-11 "One card per hero", BAG-12 to BAG-22 "Fusion ladder", BAG-23 to BAG-30 "Fundir tudo on the server", BAG-31 to BAG-37 "Fundir tudo on the screen", BAG-38 to BAG-39 "One way into the cards". The UI review round (T17 to T22, `ui-review.html` of commit `4dc43c3`) appended BAG-40 ("Centered rarity gems" AC 3) and BAG-41 ("Fusion ladder" AC 12) at the end so the earlier IDs stay stable; it amended BAG-08 (no badge in the detail, D25) and BAG-32 (two preview lines, D21).

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BAG-01 | P1: Centered rarity gems | T7, T13, T16, T20, T21, T22 | Implementing |
| BAG-02 | P1: Centered rarity gems | T7, T13 | Implementing |
| BAG-03 | P1: One card per hero | T8, T11, T13 | Implementing |
| BAG-04 | P1: One card per hero | T8, T10, T13, T17, T22 | Implementing |
| BAG-05 | P1: One card per hero | T6, T8, T10, T13, T17, T22 | Implementing |
| BAG-06 | P1: One card per hero | T8, T13 | Implementing |
| BAG-07 | P1: One card per hero | T6, T8, T13, T14, T17, T22 | Implementing |
| BAG-08 | P1: One card per hero | T6, T8, T13, T17, T21, T22 | Implementing |
| BAG-09 | P1: One card per hero | T8, T13 | Implementing |
| BAG-10 | P1: One card per hero | T8, T11, T13 | Implementing |
| BAG-11 | P1: One card per hero | T10, T13, T17 | Implementing |
| BAG-12 | P1: Fusion ladder | T9, T11, T13 | Implementing |
| BAG-13 | P1: Fusion ladder | T6, T9, T13 | Implementing |
| BAG-14 | P1: Fusion ladder | T6, T9, T10, T13 | Implementing |
| BAG-15 | P1: Fusion ladder | T6, T9, T11, T13 | Implementing |
| BAG-16 | P1: Fusion ladder | T6, T9, T13, T14 | Implementing |
| BAG-17 | P1: Fusion ladder | T11, T13, T14, T17 | Implementing |
| BAG-18 | P1: Fusion ladder | T9, T11, T12, T13, T18, T21 | Implementing |
| BAG-19 | P1: Fusion ladder | T11, T13, T14 | Implementing |
| BAG-20 | P1: Fusion ladder | T11, T13 | Implementing |
| BAG-21 | P1: Fusion ladder | T5, T11, T12, T13, T14 | Implementing |
| BAG-22 | P1: Fusion ladder | T11, T12 | Implementing |
| BAG-23 | P1: Fundir tudo on the server | T1, T2, T3 | Implementing |
| BAG-24 | P1: Fundir tudo on the server | T1, T3 | Implementing |
| BAG-25 | P1: Fundir tudo on the server | T1, T3 | Implementing |
| BAG-26 | P1: Fundir tudo on the server | T1, T2, T3 | Implementing |
| BAG-27 | P1: Fundir tudo on the server | T2, T3 | Implementing |
| BAG-28 | P1: Fundir tudo on the server | T3 | Implementing |
| BAG-29 | P1: Fundir tudo on the server | T3 | Implementing |
| BAG-30 | P1: Fundir tudo on the server | T3 | Implementing |
| BAG-31 | P1: Fundir tudo on the screen | T6, T9, T12, T13 | Implementing |
| BAG-32 | P1: Fundir tudo on the screen | T6, T9, T12, T13, T19, T21, T22 | Implementing |
| BAG-33 | P1: Fundir tudo on the screen | T9, T12, T13 | Implementing |
| BAG-34 | P1: Fundir tudo on the screen | T9, T12, T13 | Implementing |
| BAG-35 | P1: Fundir tudo on the screen | T4, T5, T6, T12, T13, T17, T22 | Implementing |
| BAG-36 | P1: Fundir tudo on the screen | T6, T12, T13 | Implementing |
| BAG-37 | P1: Fundir tudo on the screen | T12, T13 | Implementing |
| BAG-38 | P2: One way into the cards | T11, T13, T15 | Implementing |
| BAG-39 | P2: One way into the cards | T11 | Implementing |
| BAG-40 | P1: Centered rarity gems | T20, T21, T22 | Pending |
| BAG-41 | P1: Fusion ladder | T18, T21, T22 | Pending |

**ID format:** `BAG-<NN>`

**Coverage:** 41 total, 41 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] With five heroes holding copies on all ten layers, the Mochila grid shows no scrollbar at 1280x720 and at 390x844 (e2e).
- [ ] Turning 45/1/2 copies of 0★/1★/2★ into 1★ 1, 2★ 1, 3★ 2 takes 3 clicks and 1 `POST /heroes/kael/fuse-all` (e2e request count).
- [ ] An integration test that sends `fuse-all` twice at once for 3 blank copies reads one 200, one 409 and one 1★ copy stored.
- [ ] The gem row of every piece tile is centered within 1 px (e2e, three tile places).
