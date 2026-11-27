# UI Polish Specification

**Status**: Approved, revision 2 (owner approval of 2026-11-27, every recommendation in the Assumptions table accepted, Q1 to Q28). Owner request of 2026-11-27: (1) no text selection and the other web-page artifacts that break the game feel, (2) no screen flash when a talent levels up, (3) Shift buys the most levels a talent can take. Owner decisions of 2026-11-27 (revision 2): keep every proposed item (Q2 to Q5, Q16); the other rebuilding screens wait for the Equipamento redesign (Q9); add the T and B keys and replace Líder with Equipe (Q17); run this feature now, before `portuguese-text` (Q18). Q20 to Q28: the recommendations accepted on 2026-11-27.

## Problem Statement

Infinity Grove runs in a browser page and still behaves like one: Ctrl+A, a double click or a drag paints the selection colour over the HUD, images can be dragged as ghosts and a right click opens the browser menu. On the Talentos screen every level bought rebuilds the whole tree twice, so the painted board, its 28 nodes and their icons blink. And a player with 30 points has to click 30 times to spend them. The HUD also has two screens for the leader (Líder and Equipe), and no key opens the screens a player visits most.

## Facts From the Code (not decisions)

Checked on `main` at `9bebd36` (2026-11-27).

- **No page-level guard exists.** `game/public/style.css` sets `user-select: none` only on the drag ghost and three drag states (`:3091`, `:3132`, `:3450`); `body` (`:97`) has no `user-select`, no `cursor`. No code listens to `contextmenu`; `dragstart` is cancelled only on equipment tiles (`game/src/adapters/phaser/views/dragEquip.js:60`). Focus rings already follow the keyboard only: `:focus { outline: none }` and `:focus-visible { outline: 3px solid var(--color-focus) }` (`style.css:118-125`).
- **Text fields.** The start screen has the only text fields: `input[name="username"]` (type text) and `input[name="password"]` (`game/src/adapters/phaser/MainMenu.js:27-28`). The farm toggle and the auto click switch are checkboxes. `ClickerGame.js:130` already defines a text field as `textarea, select, [contenteditable]:not([contenteditable="false"]), input` other than checkbox, radio and button.
- **Why Talentos blinks.** `HeroUi.render_talents` (`game/src/adapters/phaser/HeroUi.js:1000`) builds a new screen with `renderTalents` (`game/src/adapters/phaser/views/talentsView.js:210`) and swaps it in with `this.body.replaceChildren(screen)`. Each build creates about 65 to 85 new `<img>` elements: the 1024 x 576 board (`talent-tree-image`), 4 banners, a frame and an icon for each of the 28 nodes (icons with `loading="lazy"`, `game/src/adapters/phaser/views/dom.js:41`), a lock per locked node, the plaque, the medallion, the reset art and the card icon. A new `<img>` paints nothing until it decodes, so for one or more frames the board shows its dark gradient fallback and the nodes show no art. A level bought rebuilds twice: once to mark the screen busy (`HeroUi.js:1031`) and once when the answer lands (`:1055`). Reiniciar pontos also rebuilds twice (`:1066`, `:1090`), a node click once (`:1021`), and talent points paid while the screen is open once (`:1228`). The busy build sets `disabled` on the card button and on Reiniciar pontos, so both drop to `opacity: 0.45` (`button:disabled`, `style.css:203`) for the length of the request, and the pulse of every available node (`talent-available-pulse`, `style.css:2499`) restarts on each build. This cause is read from the code; no frame capture was taken. The e2e tests of UIP-06 prove the fix by element identity.
- **Other screens use the same pattern.** Equipamento (`render_equipment`, about 20 call sites in `HeroUi.js`), Equipe (`render_team`), the Mochila hero and its fusion ladder (`openBagHero`), Rever chefes (`render_farm`), the auto click window (`ClickerGame.showAutoClick`, `:331`) and the leader card and skill bar (`HeroUi.updateSkillBar`, `:1165`) each rebuild their whole view, images included, on every action. Not measured; see Q9.
- **The upgrade contract.** `POST /talents/{id}/upgrade` with body `{ "fromLevel": <int> }` raises one level (`backend/.../adapter/web/TalentController.kt:99`). `PlayerTalents.upgrade` (`backend/.../domain/Talents.kt:205`) checks, in order: `fromLevel` equal to the stored level (409 `TALENT_LEVEL_MISMATCH`), open (409 `TALENT_LOCKED`), below the top level (409 `TALENT_MAX_LEVEL`), points (409 `NOT_ENOUGH_TALENT_POINTS`), all under the `progress` row lock (`TalentService.kt:40`). The controller reads the body as a `Map<String, Any?>`, so a key it does not know is ignored. A level of one talent always costs the same: `costPerLevel = rules.costPerLevel x (costFactor ?: grade)`, which the API answers as `nextCost` (null at the top level).
- **Keys in use.** `ESC`, `1`/`2`/`3`, `Q`/`W`/`E` (skills) and `A` (auto click) in `ClickerGame.js:295-315`; T and B are free and Shift is not used. `autoClickKey` (`ClickerGame.js:397`) ignores repeats, text fields, the pause menu, the reset dialog and an open hero screen, but no modifier: from chapter 2, Ctrl+A toggles the auto click window (UIP-14).
- **The Líder screen.** A rail button `hud-leader` (`HeroUi.js` `SCREENS`, `ICONS.leader`) opens `render_leader` (`HeroUi.js:508`), which lists the owned heroes with `renderLeaderPicker` (`views/leaderView.js`) and changes the leader with `heroes.setLeader`, that is `PUT /leader`. Nothing else uses `render_leader`; `leaderView.js` has its own unit test.
- **What Equipe covers today.** The Equipe button joins the rail only once the team is unlocked, after the first chapter 5 boss win (`HeroUi.refreshTeamButton`; `Team.unlocked`, `backend/.../domain/Team.kt:118`). Its `Tornar líder` (`HeroUi.makeTeamLeader`) only promotes the hero of a selected, filled, bought ally slot; slot 1 costs 1 ouro. Removing Líder as it is would leave a player with no way to change the leader before the chapter 5 boss win, and after it until slot 1 is bought and the hero placed in it (Q20). The leader card of Equipe (`teamView.js` `renderLeaderCard`) is a plain `div`.
- **Backend use.** `PUT /leader` serves both Líder and `Tornar líder`; no endpoint becomes unused, so nothing is deprecated and no debt is recorded.
- **Tests tied to Líder.** Unit: `HeroUi.test.js` (`describe('HeroUi Líder')`, three rail cases, the leader change seen by Equipamento), `ClickerGame.test.js` (the HUD buttons case, the Esc case). E2E: `heroBagCards.spec.js`, `heroTeam.spec.js` (3 tests), `uiRedesign.spec.js` (5 tests), `heroes.spec.js`, `heroTeamCombat.spec.js`, `talentTreeReworkCombat.spec.js`. Review: `ui-review/uiRedesign.shots.js` (`hero screens`). Every one is named in `tasks.md` T9 and T14.

## Goals

- [ ] Outside the two start-screen text fields nothing in the game can be selected, dragged as a ghost or right-clicked into the browser menu, and plain text shows the arrow cursor.
- [ ] Buying a level, choosing a node, Reiniciar pontos and new talent points change the Talentos screen in place: no image of the screen is removed or rebuilt, and no button dims while the request runs.
- [ ] Holding Shift turns the card button into "level up to the most the points pay", shown on the button, bought with one request.
- [ ] T and B open and close Talentos and Mochila; no modifier, repeat or text field triggers them.
- [ ] The rail has one screen for the leader and the allies, Equipe, and any player can change the leader from it from chapter 1.

## Out of Scope

| Feature | Reason |
| --- | --- |
| In-place updates of Equipamento, Equipe, Mochila, Rever chefes, the auto click window and the skill bar | Q9 (owner, 2026-11-27): TD-014, fixed when the Equipamento screen is redesigned |
| Optimistic updates (showing the level before the backend answers) | Q7: the talents are server-authoritative (AD-011); the in-place update alone removes the blink |
| Tap highlight, pull-to-refresh, overscroll bounce, long-press menus | Phone artifacts; the game targets PC only |
| Blocking browser zoom (Ctrl + wheel, Ctrl + plus) and browser shortcuts (Ctrl+S, Ctrl+P, F5, the mouse back button) | They are the browser's, and zoom is an accessibility tool |
| What a right-button press does in the fight | Unchanged: UIP-03 removes only the browser menu |
| Shift on the auto click upgrade; Shift + click on a talent node | Q17: not chosen by the owner (2026-11-27) |
| Keys for Heróis, Equipe, Equipamento and Rever chefes | Q17: the owner chose T and B only |
| Removing `PUT /leader` or `leaderView.js` | Both stay in use (UIP-13 AC 10; the leader list reuses the view) |
| Phone layout | PC only |

---

## Assumptions & Open Questions

Every row is the product owner's recommended default, waiting for the owner.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** What may still be selected (UIP-01) | **Recommended**: nothing outside text fields; a text field is an `input` other than checkbox, radio and button, a `textarea` or a `[contenteditable="true"]` element (today the username and password fields) | The owner asked for no selection; the fields must keep select, copy and paste | n |
| **Q2** [proposed] No image drag ghost (UIP-02) | **Recommended**: include. Every `img` gets `-webkit-user-drag: none` and the page cancels `dragstart` outside text fields | Dragging a node icon or the board shows the browser's translucent copy; drag-to-equip uses pointer events and keeps working | y (owner, 2026-11-27) |
| **Q3** [proposed] No browser context menu (UIP-03) | **Recommended**: include. The page cancels `contextmenu` outside text fields | A right click shows "Save image as" over the game; the text fields keep it for Paste | y (owner, 2026-11-27) |
| **Q4** [proposed] Arrow cursor over plain text (UIP-04) | **Recommended**: include. `body` gets `cursor: default`, text fields `cursor: text`; controls keep `pointer` | Chrome shows the I-beam over every text, which reads as an editable page | y (owner, 2026-11-27) |
| **Q5** [proposed] Keyboard-only focus ring (UIP-05) | **Recommended**: include as a regression test only; no code changes | The rule already exists (`style.css:118-125`); a test keeps it from regressing | y (owner, 2026-11-27) |
| **Q6** Other web artifacts | **Recommended**: not proposed. Phone artifacts are out (PC only); zoom and browser shortcuts belong to the browser | See Out of Scope | n |
| **Q7** How Talentos stops blinking (UIP-06) | **Recommended**: build the screen once when it opens, then patch the elements in place on every change (design § Approach B). No optimistic update | Removes the cause (new images every build) and keeps the server as the truth (AD-011) with no rollback path | n |
| **Q8** What the buttons look like while a talent request runs (UIP-07) | **Recommended**: no dimming. The card button and Reiniciar pontos keep their look, take `aria-disabled="true"`, ignore clicks and show the `progress` cursor; `disabled` (dimmed) only means "cannot buy" or "nothing to reset" | The 0.45 dim for one round trip is a blink on its own; the cursor still says the game is working | n |
| **Q9** Other screens that rebuild on every action | **Owner**: out of this feature. TD-014 lists them; they are fixed when the Equipamento screen is redesigned (the redesign is the trigger), not as a standalone follow-up | Equipamento alone has about 20 render calls and the drag-to-equip gesture; its redesign rewrites those views anyway | y (owner, 2026-11-27) |
| **Q10** How the backend buys several levels (UIP-08) | **Recommended**: one request. `POST /talents/{id}/upgrade` gains an optional integer `levels` (1 to `maxLevel`, absent or null = 1). The exact count is bought or nothing is (all-or-nothing); no clamping | One transaction under the `progress` lock: no partial purchase, one round trip, the `fromLevel` guard still blocks a double click. Many requests would take N round trips and could stop halfway | n |
| **Q11** The button text while Shift is held (UIP-09) | **Recommended**: `Melhorar até o nível <alvo> (<custo> ponto\|pontos)`, shown whenever the points pay at least 1 level, also when that is exactly 1 | One text says "Shift is on" and names the result and the price | n |
| **Q12** Shift held when not even one level is affordable (UIP-09) | **Recommended**: the button keeps `Melhorar (<custo de um nível> ponto\|pontos)`, stays disabled and gets no gold ring | Tells the player what one level costs, as today | n |
| **Q13** A visual cue besides the text (UIP-09) | **Recommended**: a 2 px ring of `--gold-400` (`#e0b45a`) around the button while the Shift text shows | Lets the eye catch the mode change without reading | n |
| **Q14** Window blur while Shift is held (UIP-10) | **Recommended**: losing the window focus or hiding the tab ends the Shift mode at once; it comes back with the next Shift key event (auto-repeat included) or the next pointer move or press made with Shift | The browser sends no keyup when Shift is released outside the window, so a stale mode could spend every point by surprise | n |
| **Q15** Which Shift decides the purchase (UIP-09) | **Recommended**: the click buys the most levels when the click event has `shiftKey` true or the game holds the Shift mode | Covers Shift pressed before the window had focus and a keyboard Enter on the focused button | n |
| **Q16** [proposed] A hint for the shortcut (UIP-11) | **Recommended**: include. The card button carries the tooltip `Segure Shift para melhorar até o máximo` (`title`) | Players cannot guess a hidden shortcut; a tooltip takes no room on the card | y (owner, 2026-11-27) |
| **Q17** Other shortcuts | **Owner**: T opens Talentos and B opens Mochila (UIP-12), and the Líder screen goes away in favour of Equipe (UIP-13). Shift on the auto click upgrade and Shift + click on a talent node are not built | Owner decision | y (owner, 2026-11-27) |
| **Q18** Order in the queue | **Owner**: run now, before `portuguese-text`. Shared files and how to merge them: `tasks.md` § Shared files with `portuguese-text`. The new e2e files wait on `toHaveText(/yan/)` and use the `e2e/support/game.js` helpers, so they survive the later translation unchanged | Owner decision | y (owner, 2026-11-27) |
| **Q19** A backend without `levels` during the deploy window | **Recommended**: accepted. The previous backend ignores `levels` and buys one level; the game shows the tree it answers, with no error line. No migration | Expand only (AD-016); the answer is the truth (AD-011) | n |
| **Q20** Removing Líder leaves a gap (§ Facts: Equipe exists only after the chapter 5 boss win and promotes only an ally in a bought slot) | **Recommended**: Equipe is in the rail for every player from chapter 1, in the place of Líder, and its leader card opens the leader list of the old Líder screen under `Escolher líder`; the Líder button and screen go away (UIP-13). Alternatives: (a) remove Líder with nothing in its place: no leader change before the chapter 5 boss win, nor after it until slot 1 (1 ouro) is bought and the hero placed; (b) keep Líder in the rail until Equipe can change the leader, then swap: two code paths | Nothing Líder did is lost and the rail keeps one leader screen; Equipe before chapter 5 also previews the team (locked slots and the status line). Supersedes the rule of AD-018 that Equipe joins the rail only once the team is unlocked (AD-034) | n |
| **Q21** T or B when its own screen is open | **Recommended**: close the window (toggle), also from a Mochila hero detail or fusion ladder | The same key opens and closes, like A for the auto click window | n |
| **Q22** T or B when another hero screen is open | **Recommended**: show the key's screen in its place, as a click on its HUD button does | The HUD buttons already switch screens | n |
| **Q23** T or B with a modal shown | **Recommended**: nothing while the pause menu or the reset dialog is shown; with the auto click window open, close it and open the screen, as a press outside that window does | The pause menu and the reset dialog cover the battle and wait for an answer; the auto click window closes on any outside press today | n |
| **Q24** T or B with a modifier | **Recommended**: nothing with Ctrl, Alt, Meta or Shift (Ctrl+T and Ctrl+B stay the browser's; Shift+T never closes Talentos while Shift buys levels) | No browser shortcut is hijacked and Shift keeps one meaning | n |
| **Q25** Key repeat and text fields | **Recommended**: a held key acts once; a key typed in a text field is typed | The rules A already follows | n |
| **Q26** Showing the keys | **Recommended**: a 16 px chip `T` on Talentos and `B` on Mochila in the top left corner of the button (the red dot keeps the top right), in the look of the `A` chip of the auto click, plus `aria-keyshortcuts`; no tooltip | The auto click button already shows its key this way | n |
| **Q27** [proposed] A ignores modifiers too (UIP-14) | **Recommended**: include: Ctrl, Alt, Meta or Shift with A does nothing | Today Ctrl+A in the battle (chapter 2 on) opens the auto click window while the browser tries to select all | n |
| **Q28** After a pick in the leader list, and its texts | **Recommended**: the list stays open and marks the new leader (as Líder does today) and `Voltar` returns to Equipe. The leader card shows the caption `Trocar líder`, the list's heading is `Escolher líder` and the window title stays `Equipe` | Same behaviour as today's Líder; the caption tells the player the card is a button | n |
| Implicit dimensions | Input bounds: UIP-08 AC 3 to 5. Failure: all-or-nothing (UIP-08 AC 5, 6), 409 reloads the tree (UIP-09 AC 7). Retries and duplicates: `fromLevel` guard (UIP-08 AC 8), busy guard (UIP-07 AC 2). Auth: N/A, no new route; the existing token rules apply. Concurrency: the `progress` row lock (UIP-08 AC 8); the keys and the leader list reuse the screen `view` and team request guards (UIP-12 AC 7, UIP-13 AC 3). Data lifecycle: N/A, no new data and no migration. Observability: UIP-08 AC 9. External dependency: UIP-09 AC 6 and 7. State transitions: the Shift mode (UIP-10) | Large-scope sweep | n |

**Open questions:** none unrecorded. Q2 to Q5, Q9 and Q16 to Q18 are the owner's decisions of 2026-11-27. Q1, Q6 to Q8, Q10 to Q15, Q19 and the new Q20 to Q28 wait for the owner; each row holds the recommended default.

---

## Player-Facing Texts

| Id | Where | Text | Rule |
| --- | --- | --- | --- |
| T1 | card button, normal | `Melhorar (<custo> ponto)` when the cost is 1, `Melhorar (<custo> pontos)` otherwise | unchanged; `<custo>` is `nextCost` |
| T2 | card button, Shift mode | `Melhorar até o nível <alvo> (<custo> ponto)` when `<custo>` is 1, `Melhorar até o nível <alvo> (<custo> pontos)` otherwise | `<alvo>` = level + k, `<custo>` = k x `nextCost` (UIP-09 AC 1) |
| T3 | card button tooltip (`title`) | `Segure Shift para melhorar até o máximo` | UIP-11, only if Q16 is accepted |
| T4 | error line | `Pontos de talento insuficientes` | unchanged, code `NOT_ENOUGH_TALENT_POINTS` |
| T5 | error line | `Não foi possível melhorar o talento.` | unchanged, any other failure |
| T6 | Equipe leader card caption | `Trocar líder` | UIP-13 AC 3 |
| T7 | heading of the leader list | `Escolher líder` | UIP-13 AC 4 |
| T8 | key chips of the HUD | `T` (Talentos), `B` (Mochila) | UIP-12 AC 11 |
| T9 | error line | `Não foi possível trocar o líder.` | unchanged (UIP-13 AC 7) |
| T10 | rail labels | `Heróis`, `Mochila`, `Equipe`, `Equipamento`, `Talentos`, `Rever chefes` | `Líder` leaves the rail; the word stays on the leader card and on the current row of the list |

---

## User Stories

### P1: The game is not a web page ⭐ MVP

**User Story**: As a player, I want the game text to stay plain when I press Ctrl+A, double-click or drag, so that the screen never turns into a highlighted web page.

**Why P1**: The owner's first request.

**Acceptance Criteria** (UIP-01):

1. The game SHALL give `html` and `body` the computed `user-select` `none`.  <!-- ubiquitous -->
2. WHEN the player presses Ctrl+A with the focus outside a text field, on the start screen, on the battle screen or on the open Talentos screen, THEN the game SHALL leave `window.getSelection().toString()` equal to `''`.  <!-- event-driven -->
3. WHEN the player double-clicks the `Pontos de talento: <n>` pill or the talent card name THEN the game SHALL leave `window.getSelection().toString()` equal to `''`.  <!-- event-driven -->
4. WHEN the player presses the mouse button at the top left corner of the open Talentos window and releases it at the bottom right corner THEN the game SHALL leave `window.getSelection().toString()` equal to `''`.  <!-- event-driven -->
5. WHILE the focus is in the username field the game SHALL let the player select its text: after typing `yan` and pressing Ctrl+A, `selectionStart` is 0, `selectionEnd` is 3 and the field's computed `user-select` is `text`.  <!-- state-driven -->
6. WHILE the focus is in the password field the game SHALL give it the computed `user-select` `text`.  <!-- state-driven -->

**Independent Test**: Open the start screen, the battle and Talentos; press Ctrl+A, double-click and drag; read the selection; type in the username field and select it.

---

### P2: No image drag ghost [proposed, Q2]

**User Story**: As a player, I want images to stay where they are when I drag over them, so that no translucent copy follows the pointer.

**Why P2**: Proposed web artifact; the owner accepts or cuts it.

**Acceptance Criteria** (UIP-02):

1. The game SHALL give every `img` the computed `-webkit-user-drag` `none`.  <!-- ubiquitous -->
2. WHEN a `dragstart` event fires on an element that is not inside a text field THEN the game SHALL cancel it (`defaultPrevented` true).  <!-- event-driven -->
3. IF a `dragstart` event fires inside a text field THEN the game SHALL NOT cancel it (`defaultPrevented` false).  <!-- unwanted-behavior -->
4. The game SHALL keep drag-to-equip working: `game/e2e/dragEquip.spec.js` passes unchanged.  <!-- ubiquitous -->

**Independent Test**: Dispatch `dragstart` on a node icon and on the username field; read `defaultPrevented`.

---

### P2: No browser context menu [proposed, Q3]

**User Story**: As a player, I want a right click to open no browser menu over the game, so that "Save image as" never shows over a fight.

**Why P2**: Proposed web artifact.

**Acceptance Criteria** (UIP-03):

1. WHEN a `contextmenu` event fires on the canvas or on any element outside a text field THEN the game SHALL cancel it (`defaultPrevented` true).  <!-- event-driven -->
2. IF a `contextmenu` event fires inside a text field THEN the game SHALL NOT cancel it, so the player keeps Paste.  <!-- unwanted-behavior -->

**Independent Test**: Dispatch `contextmenu` on the canvas, on a talent node and on the username field.

---

### P2: Arrow cursor over plain text [proposed, Q4]

**User Story**: As a player, I want the arrow over labels and numbers, so that nothing looks editable.

**Why P2**: Proposed web artifact.

**Acceptance Criteria** (UIP-04):

1. The game SHALL give `body` the computed `cursor` `default`, and the talent card name and the `Pontos de talento` pill SHALL inherit `default`.  <!-- ubiquitous -->
2. The game SHALL give the username and password fields the computed `cursor` `text`.  <!-- ubiquitous -->
3. The game SHALL keep the computed `cursor` `pointer` on an enabled talent node and on an enabled card button `talent-upgrade-<id>` while no request runs.  <!-- ubiquitous -->

**Independent Test**: Read computed `cursor` on the four elements.

---

### P3: Focus ring only from the keyboard [proposed, Q5]

**User Story**: As a player, I want no orange ring after I click a button, and the ring back when I use Tab.

**Why P3**: Already true; the owner asked about it, so a test keeps it.

**Acceptance Criteria** (UIP-05):

1. WHEN the player clicks the HUD button `hud-talents` with the mouse THEN the game SHALL leave that button with the computed `outline-style` `none`.  <!-- event-driven -->
2. WHEN the player then presses Tab and Shift+Tab, bringing the focus back to `hud-talents` with the keyboard, THEN the game SHALL give `hud-talents` `:focus-visible`, the computed `outline-style` `solid` and the computed `outline-color` `rgb(204, 78, 26)` (`--color-focus`).  <!-- event-driven -->

**Independent Test**: Click, read the outline; press Tab and Shift+Tab, read it again.

---

### P1: Talentos changes in place ⭐ MVP

**User Story**: As a player buying talents, I want only the numbers and states that changed to change, so that the tree never blinks.

**Why P1**: The owner's second request.

**Acceptance Criteria** (UIP-06):

1. WHEN the player buys a level on the card THEN the game SHALL keep the same DOM elements on the Talentos screen from the click to the answer shown: the board image `.talent-tree-image`, each of the 28 nodes `talent-<id>`, the card `talent-detail` and the card icon image are the elements that were there before the click (`===`).  <!-- event-driven -->
2. WHEN the player buys a level THEN the game SHALL remove no `img` element from the Talentos screen between the click and the answer shown (a `MutationObserver` on `talent-screen` records 0 removed `img`).  <!-- event-driven -->
3. WHEN the answer of a level bought lands THEN the game SHALL show, in place, the values a fresh open of the screen shows for the answered tree: each node's `data-state`, level chip `<level>/<maxLevel>` and `aria-label` `<nome>, nível <level> de <maxLevel>`, each lit layer's `opacity`, `Pontos de talento: <available>`, the card `Nível <level>/<maxLevel>` and `Efeito: <efeito>`, the card action (button text and `disabled`, `Nível máximo`, or the lock text) and Reiniciar pontos `disabled` when `spent` is 0.  <!-- event-driven -->
4. WHEN the player clicks another node THEN the game SHALL keep the board image and the 28 nodes and replace only the card `talent-detail`.  <!-- event-driven -->
5. WHEN the player clicks the selected node again THEN the game SHALL keep the card element `talent-detail` (`===`).  <!-- event-driven -->
6. WHEN Reiniciar pontos answers THEN the game SHALL keep the board image and the 28 nodes and add the lock icon `.talent-node-lock` to every node that is locked again.  <!-- event-driven -->
7. WHEN a node goes from locked to open (its prerequisite reaches its top level) THEN the game SHALL remove its `.talent-node-lock` and keep its frame and icon images.  <!-- event-driven -->
8. WHEN talent points arrive while Talentos is open (`HeroUi.showTalentPoints`) THEN the game SHALL keep the board image and the 28 nodes and show the new `Pontos de talento: <available>`.  <!-- event-driven -->
9. WHEN the card action changes kind (the button becomes `Nível máximo`) THEN the game SHALL replace only that action element and keep the card, its name, level, effect and icon elements.  <!-- event-driven -->
10. IF the upgrade request fails THEN the game SHALL keep the board image and the 28 nodes and show the error line of § Player-Facing Texts T4 or T5.  <!-- unwanted-behavior -->
11. WHEN the player opens Talentos from the HUD THEN the game SHALL build the screen as today: no node selected, the empty card text `Escolha um talento na árvore para ver os detalhes.`  <!-- event-driven -->

**Independent Test**: Mark the board image, a node and the card icon in the page, buy a level, then compare the elements and the removed-image count.

---

### P1: No dimming while a talent request runs ⭐ MVP

**User Story**: As a player, I want the buttons to keep their look during the short wait for the backend, so that each click does not flash the card.

**Why P1**: The dim is part of the blink (Q8).

**Acceptance Criteria** (UIP-07):

1. WHILE an upgrade or reset request runs the game SHALL give the card button and Reiniciar pontos `aria-disabled="true"` and the computed `cursor` `progress`, and an enabled one SHALL keep the computed `opacity` `1`.  <!-- state-driven -->
2. WHILE an upgrade or reset request runs, WHEN the player clicks the card button or Reiniciar pontos, THEN the game SHALL send no request.  <!-- complex -->
3. WHEN the request ends THEN the game SHALL give both buttons `aria-disabled="false"` and an enabled card button the computed `cursor` `pointer`.  <!-- event-driven -->
4. The game SHALL set `disabled` on the card button only when `available` is below `nextCost`, and on Reiniciar pontos only when `spent` is 0; a running request does not set `disabled`.  <!-- ubiquitous -->

**Independent Test**: Hold the upgrade answer in the fake backend; read the button attributes and styles; click again; release.

---

### P1: The backend buys several levels in one request ⭐ MVP

**User Story**: As the game, I want to buy k levels of a talent in one request, so that the Shift purchase is one transaction.

**Why P1**: Needed by UIP-09 (Q10).

**Acceptance Criteria** (UIP-08):

1. WHEN `POST /talents/{id}/upgrade` carries `levels` n, an integer from 1 to the talent's `maxLevel`, and `fromLevel` is the stored level, the talent is open, `fromLevel + n` is at most `maxLevel` and `available` is at least `n x costPerLevel`, THEN the backend SHALL store the level `fromLevel + n`, spend `n x costPerLevel` points and answer 200 with the tree (same shape as today). Example: COMBO at 0 with 5 points earned, `levels` 5, answers COMBO `level` 5, `value` 25, `nextCost` 1 and `points` `{ earned: 5, spent: 5, available: 0 }`.  <!-- event-driven -->
2. WHEN the body has no `levels` key or `levels` is null THEN the backend SHALL raise the talent by one level, as today.  <!-- event-driven -->
3. IF `levels` is present and is not a JSON integer (`"2"`, `1.5`, `true`) THEN the backend SHALL answer 400 `INVALID_TALENT_REQUEST` with detail `levels must be an integer` and change nothing.  <!-- unwanted-behavior -->
4. IF `levels` is an integer below 1 or above the talent's `maxLevel` (0, -1 or 11 for COMBO; 5 for COMBO_FURY, whose `maxLevel` is 4) THEN the backend SHALL answer 400 `INVALID_TALENT_REQUEST` with detail `levels must be an integer between 1 and <maxLevel>` and change nothing.  <!-- unwanted-behavior -->
5. IF `fromLevel + levels` is above `maxLevel` and the stored level is below `maxLevel` THEN the backend SHALL answer 409 `TALENT_MAX_LEVEL` with detail `Talent '<id>' at level <fromLevel> cannot rise <levels> levels` and change nothing. Example: CLICK_DAMAGE at 8, `levels` 3: `Talent 'CLICK_DAMAGE' at level 8 cannot rise 3 levels`.  <!-- unwanted-behavior -->
6. IF `available` is below `levels x costPerLevel` and `levels` is 2 or more THEN the backend SHALL answer 409 `NOT_ENOUGH_TALENT_POINTS` with detail `<levels> talent levels cost <total> points, the player has <available>` and change nothing. Example: COMBO at 0, 4 points earned, `levels` 5: `5 talent levels cost 5 points, the player has 4`.  <!-- unwanted-behavior -->
7. The backend SHALL check a request in this order: `fromLevel` range (400), `levels` type and range (400), `fromLevel` against the stored level (409 `TALENT_LEVEL_MISMATCH`), open (409 `TALENT_LOCKED`), stored level at the top (409 `TALENT_MAX_LEVEL`, detail `Talent '<id>' is already at the maximum level`), `fromLevel + levels` above the top (AC 5), points (AC 6; with one level the detail stays `A talent level costs <cost> points, the player has <available>`).  <!-- ubiquitous -->
8. WHEN two requests with the same `fromLevel` and `levels` reach the backend at once THEN the backend SHALL accept exactly one and answer 409 `TALENT_LEVEL_MISMATCH` to the other.  <!-- event-driven -->
9. The backend SHALL log `levels=<n>` in the `Talent upgrade requested`, `Talent upgrade accepted` and `Talent upgraded` lines.  <!-- ubiquitous -->
10. The backend SHALL add no table, column or migration for this change.  <!-- ubiquitous -->

**Independent Test**: `TalentControllerIT` posts `{ fromLevel, levels }` bodies and reads the stored level and the points.

---

### P1: Shift buys the most levels ⭐ MVP

**User Story**: As a player with many points, I want to hold Shift and click once to level a talent as far as my points go, and see the result on the button before I click.

**Why P1**: The owner's third request.

**Definitions**: for the selected talent, `k = min(maxLevel - level, floor(available / nextCost))` when it is open and below its top level; the target is `level + k`, the cost `k x nextCost`. The game reads `level`, `maxLevel`, `nextCost` and `available` from the API (AD-011: it types no catalog number).

**Acceptance Criteria** (UIP-09):

1. WHILE the Shift mode is on (UIP-10) and k is at least 1 the game SHALL label the card button with text T2 and give it `data-max="true"` and the computed `box-shadow` `rgb(224, 180, 90) 0px 0px 0px 2px`.  <!-- state-driven -->
2. WHEN the Shift mode ends THEN the game SHALL label the card button with text T1, give it `data-max="false"` and the computed `box-shadow` `none`, on the same button element.  <!-- event-driven -->
3. WHEN the player clicks the card button with the click event's `shiftKey` true or with the Shift mode on, and k is 2 or more, THEN the game SHALL send one request with body `{ "fromLevel": <level>, "levels": <k> }` and show the answered tree.  <!-- event-driven -->
4. WHEN the player clicks it the same way and k is 1 THEN the game SHALL send one request with body `{ "fromLevel": <level> }`.  <!-- event-driven -->
5. WHEN the player clicks the card button with no Shift (event `shiftKey` false and the Shift mode off) THEN the game SHALL send one request with body `{ "fromLevel": <level> }`, as today.  <!-- event-driven -->
6. WHILE the Shift mode is on and k is 0 the game SHALL keep text T1 with the cost of one level, `disabled`, `data-max="false"` and no ring.  <!-- state-driven -->
7. IF the answer holds a level below the target (a backend without `levels`, Q19) THEN the game SHALL show the answered tree and keep the error line hidden.  <!-- unwanted-behavior -->
8. IF a Shift purchase fails THEN the game SHALL show the error line of the failure (T4 for `NOT_ENOUGH_TALENT_POINTS`, T5 otherwise) and, after a 409, the tree read again.  <!-- unwanted-behavior -->
9. WHILE the Shift mode is on the game SHALL keep the lock text of a locked talent and `Nível máximo` of a talent at its top level unchanged.  <!-- state-driven -->
10. The game SHALL draw text T2 on one line inside the card: the button's `scrollWidth` is at most its `clientWidth` and its height equals the height of the T1 button, for the longest text `Melhorar até o nível 10 (30 pontos)`.  <!-- ubiquitous -->

**Examples** (each one is a test case; points are `available`):

| Ex | Start | Shift label | Body sent | After the answer |
| --- | --- | --- | --- | --- |
| E1 | COMBO 0, 5 points | `Melhorar até o nível 5 (5 pontos)` | `{ fromLevel: 0, levels: 5 }` | `Nível 5/10`, `Efeito: +25%`, `Pontos de talento: 0`, button disabled |
| E2 | CLICK_DAMAGE 7, 20 points | `Melhorar até o nível 10 (3 pontos)` | `{ fromLevel: 7, levels: 3 }` | `Nível máximo`, `Pontos de talento: 17` |
| E3 | COMBO 10, COMBO_G2 0, 5 points | `Melhorar até o nível 2 (4 pontos)` | `{ fromLevel: 0, levels: 2 }` | `Nível 2/10`, `Pontos de talento: 1`, button disabled |
| E4 | COMBO 10, COMBO_G2 0, 1 point | `Melhorar (2 pontos)`, disabled, no ring | none | - |
| E5 | COMBO 0, 1 point | `Melhorar até o nível 1 (1 ponto)` | `{ fromLevel: 0 }` | `Nível 1/10`, `Pontos de talento: 0` |
| E6 | COMBO 10, COMBO_FURY 0, 9 points | `Melhorar até o nível 4 (8 pontos)` | `{ fromLevel: 0, levels: 4 }` | `Nível máximo`, `Pontos de talento: 1` |
| E7 | CLICK_DAMAGE 10, CLICK_DAMAGE_G2 10, CLICK_DAMAGE_G3 0, 30 points (the longest text) | `Melhorar até o nível 10 (30 pontos)` | not clicked | AC 10 measured on this button |

**Independent Test**: Select COMBO with 5 points, hold Shift, read the button, click, read the tree and the body the fake backend received.

---

### P1: The Shift mode follows the key ⭐ MVP

**User Story**: As a player, I want the button to go back to normal the moment I release Shift or leave the window, so that I never buy many levels by surprise.

**Why P1**: The rules of Q14 and Q15.

**Acceptance Criteria** (UIP-10):

1. WHEN a `keydown` event with key `Shift` reaches the window, auto-repeat included, THEN the game SHALL turn the Shift mode on.  <!-- event-driven -->
2. WHEN a `keyup` event with key `Shift` reaches the window THEN the game SHALL turn the Shift mode off.  <!-- event-driven -->
3. WHEN a key event of another key reaches the window THEN the game SHALL set the Shift mode to that event's `shiftKey`.  <!-- event-driven -->
4. WHEN a `pointermove` or `pointerdown` event reaches the window THEN the game SHALL set the Shift mode to that event's `shiftKey`.  <!-- event-driven -->
5. WHEN the window fires `blur` THEN the game SHALL turn the Shift mode off and show text T1 on the card button at once.  <!-- event-driven -->
6. WHEN the document's `visibilityState` becomes `hidden` THEN the game SHALL turn the Shift mode off.  <!-- event-driven -->
7. WHEN the Shift mode changes while Talentos is open with a talent selected THEN the game SHALL update the card button in place (the same element, UIP-06).  <!-- event-driven -->
8. WHILE the Shift mode is on, WHEN the player selects another talent, THEN the game SHALL show that talent's button in the Shift form at once.  <!-- complex -->
9. WHEN the battle scene shuts down THEN the game SHALL remove every listener the Shift mode added, so no later key event renders anything.  <!-- event-driven -->

**Independent Test**: Hold Shift, read the button, fire `blur`, read it again, move the pointer with Shift, read it again.

---

### P3: A hint for the shortcut [proposed, Q16]

**User Story**: As a player, I want to learn the Shift shortcut from the button itself.

**Why P3**: Proposed; discoverability.

**Acceptance Criteria** (UIP-11):

1. The game SHALL give the card button `talent-upgrade-<id>` the attribute `title` `Segure Shift para melhorar até o máximo`, in both forms.  <!-- ubiquitous -->

**Independent Test**: Read the `title` of the button with and without Shift.

---

### P2: T and B open Talentos and Mochila

**User Story**: As a player, I want to press T for Talentos and B for Mochila, and the same key again to close them, so that I reach the two screens I use most without the mouse.

**Why P2**: Owner decision of 2026-11-27 (Q17).

**Acceptance Criteria** (UIP-12; "the key" is the T key or the B key, Phaser `keydown-T` / `keydown-B`; T belongs to Talentos, B to Mochila):

1. WHEN the player presses T with no modifier, the focus outside a text field, no repeat, and neither the pause menu nor the reset dialog shown, THEN the game SHALL open Talentos as a click on `hud-talents` does.  <!-- event-driven -->
2. WHEN the player presses B under the same conditions THEN the game SHALL open Mochila as a click on `hud-bag` does.  <!-- event-driven -->
3. WHILE Talentos is open, WHEN the player presses T, THEN the game SHALL close the hero window.  <!-- complex -->
4. WHILE Mochila is open, a hero detail or fusion ladder of the Mochila included, WHEN the player presses B, THEN the game SHALL close the hero window.  <!-- complex -->
5. WHILE another hero screen is open, WHEN the player presses the key, THEN the game SHALL show the key's screen in its place, as a click on its HUD button does.  <!-- complex -->
6. IF the key event has `ctrlKey`, `altKey`, `metaKey` or `shiftKey` true (Ctrl+T, Ctrl+B, Alt+T, Shift+T) THEN the game SHALL do nothing.  <!-- unwanted-behavior -->
7. IF the key event is an auto-repeat (`repeat` true) THEN the game SHALL do nothing.  <!-- unwanted-behavior -->
8. IF the key event comes from a text field THEN the game SHALL do nothing, so the letter is typed.  <!-- unwanted-behavior -->
9. WHILE the pause menu or the reset dialog is shown the game SHALL ignore both keys.  <!-- state-driven -->
10. WHILE the auto click window is open, WHEN the player presses the key, THEN the game SHALL close the auto click window and open the key's screen.  <!-- complex -->
11. The game SHALL show the key on its HUD button: `hud-talents` and `hud-bag` hold a chip `hud-key-talents` (`T`) and `hud-key-bag` (`B`) in their top left corner, 16 px high, Cinzel 700 10 px, colour `#f3d58a` on `#1c120c` with a 1 px `#e0b45a` border, and carry `aria-keyshortcuts` `T` and `B`; the other four HUD buttons carry no chip.  <!-- ubiquitous -->

**Independent Test**: Press t and b in the battle; press them with modifiers, held, in the username field, with the pause menu and the auto click window open.

---

### P1: Equipe takes the place of Líder ⭐ MVP

**User Story**: As a player, I want one screen for my leader and my allies, so that the rail has no duplicate screen, and I want to change my leader from chapter 1 on.

**Why P1**: Owner decision of 2026-11-27 (Q17); Q20 keeps the leader change open to every player.

**Acceptance Criteria** (UIP-13):

1. The game SHALL show six HUD buttons at every point of the campaign, in this order: `hud-heroes` `Heróis`, `hud-bag` `Mochila`, `hud-team` `Equipe`, `hud-equipment` `Equipamento`, `hud-talents` `Talentos`, `hud-farm` `Rever chefes`, and no `hud-leader`.  <!-- ubiquitous -->
2. WHILE the team is locked (no chapter 5 boss won) the Equipe screen SHALL show the leader card, ally slots 1 to 4 with `data-state` `locked` and their texts `Chefe do capítulo 5` to `Chefe do capítulo 8`, and, below chapter 5, the status line `A equipe luta a partir do capítulo 5.`  <!-- state-driven -->
3. The game SHALL draw the leader card `team-slot-0` as a button that holds, under the leader's name, stars and bonus, the caption `Trocar líder`; it is disabled while a team request runs.  <!-- ubiquitous -->
4. WHEN the player clicks the leader card THEN the game SHALL show, in the same window titled `Equipe`, the heading `Escolher líder` over the leader list: one row `leader-entry-<id>` per owned hero with its name and stars, the current leader's row with class `is-current` and the word `Líder`, and the `Voltar` button.  <!-- event-driven -->
5. WHEN the player clicks a row that is not the current leader THEN the game SHALL send `PUT /leader` with that hero, keep the list open with that row marked `is-current`, and show the new leader's skills on the skill bar and the new leader on the battle leader card.  <!-- event-driven -->
6. WHEN the player clicks `Voltar` in the leader list THEN the game SHALL show the Equipe screen with the new leader on the leader card.  <!-- event-driven -->
7. IF the leader change fails THEN the game SHALL show `Não foi possível trocar o líder.` and keep the previous leader marked.  <!-- unwanted-behavior -->
8. WHEN the new leader was in an ally slot THEN the game SHALL show, after `Voltar`, the previous leader in that slot (the backend rule of AD-018, unchanged).  <!-- event-driven -->
9. WHEN the chapter 5 boss win opens slot 1 THEN the Equipe screen SHALL show slot 1 with `data-state` `buyable` without a page reload.  <!-- event-driven -->
10. The backend SHALL keep `PUT /leader` unchanged; the leader list and `Tornar líder` both use it.  <!-- ubiquitous -->
11. The game SHALL keep `Tornar líder` of a selected filled slot working as today.  <!-- ubiquitous -->

**Independent Test**: As a chapter 1 player with Kael and Lyra, open Equipe, click the leader card, pick Lyra, press Voltar.

---

### P3: A ignores modifiers [proposed, Q27]

**User Story**: As a player, I want Ctrl+A to never open the auto click window.

**Why P3**: Found while specifying UIP-12: today `autoClickKey` (`ClickerGame.js:397`) ignores no modifier, so from chapter 2 Ctrl+A toggles the auto click window.

**Acceptance Criteria** (UIP-14):

1. IF the A key event has `ctrlKey`, `altKey`, `metaKey` or `shiftKey` true THEN the game SHALL leave the auto click window as it is.  <!-- unwanted-behavior -->
2. WHEN the player presses a plain A under today's conditions THEN the game SHALL still open or close the auto click window.  <!-- event-driven -->

**Independent Test**: In chapter 2, press Control+a and then a.

---

## Edge Cases

- WHEN the player presses and holds both Shift keys and releases one THEN the game SHALL turn the Shift mode off (the browser reports one `keyup` with key `Shift`); the next auto-repeat or pointer move with Shift turns it on again.
- WHILE an upgrade request runs and the Shift mode is on, WHEN the player Shift-clicks again, THEN the game SHALL send no second request (UIP-07 AC 2).
- WHEN the answer of a Shift purchase lands while Shift is still held THEN the game SHALL label the button from the answered tree (E1: text T1 `Melhorar (1 ponto)`, disabled).
- WHEN the player closes Talentos while a request runs and opens it again THEN the game SHALL build the screen afresh (UIP-06 AC 11) and the late answer SHALL change only the collection, as today (`view` check in `HeroUi.upgradeTalent`).
- IF the backend cannot be reached during a Shift purchase THEN the game SHALL show T5 and keep the tree it had.
- WHEN the player presses Ctrl+A inside the username field THEN only the field's text SHALL be selected (UIP-01 AC 5).
- WHILE the Shift mode is on Talentos, WHEN the player presses T, THEN Talentos SHALL stay open (Shift+T is a modified key, UIP-12 AC 6).
- WHEN the player holds T THEN Talentos SHALL open once and stay open (UIP-12 AC 7).
- WHEN the player presses B while a fusion request of the Mochila runs THEN the game SHALL close the window as Fechar does, and the late answer SHALL change only the collection (the `view` check of `HeroUi`).
- WHEN a chapter 1 player owns only Kael THEN the leader list SHALL hold one row, Kael's, marked `is-current`, and a click on it SHALL send nothing.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UIP-01 | P1: Not a web page - AC 1 to 6 | Tasks T3, T11, T17 | Implementing |
| UIP-02 | P2: No drag ghost - AC 1 to 4 | Tasks T3, T11 | Implementing |
| UIP-03 | P2: No context menu - AC 1, 2 | Tasks T3, T11 | Implementing |
| UIP-04 | P2: Arrow cursor - AC 1 to 3 | Tasks T3, T11, T17 | Implementing |
| UIP-05 | P3: Keyboard focus ring - AC 1, 2 | Tasks T11 | In Tasks |
| UIP-06 | P1: Talentos in place - AC 1 to 11, Edge 4 | Tasks T7, T8, T12, T17 | In Tasks |
| UIP-07 | P1: No dimming - AC 1 to 4, Edge 2 | Tasks T7, T8, T12, T17 | In Tasks |
| UIP-08 | P1: Backend levels - AC 1 to 10 | Tasks T1, T2, T12 | Implementing |
| UIP-09 | P1: Shift buys the most - AC 1 to 10, E1 to E7, Edge 3, 5 | Tasks T4, T5, T7, T8, T13, T17 | Implementing |
| UIP-10 | P1: Shift mode - AC 1 to 9, Edge 1 | Tasks T6, T8, T13 | In Tasks |
| UIP-11 | P3: Shortcut hint - AC 1 | Tasks T7, T13, T17 | In Tasks |
| UIP-12 | P2: T and B - AC 1 to 11, Edge 7 to 9 | Tasks T10, T15, T17 | In Tasks |
| UIP-13 | P1: Equipe replaces Líder - AC 1 to 11, Edge 10 | Tasks T9, T14, T15, T17 | In Tasks |
| UIP-14 | P3: A ignores modifiers [proposed] - AC 1, 2 | Tasks T10, T15 | In Tasks |

**Coverage:** 14 total, 14 mapped to tasks (`tasks.md`), 0 unmapped

---

## Amends

- Spec `talent-tree-rework` (AD-029 (3)): the Talentos screen is built once per open and updated in place; `busy` no longer dims the buttons.
- `backend/docs/adr/0010-talents.md`: the upgrade body gains the optional `levels` (new ADR 0016).
- Spec `hero-team` and AD-018: the Equipe button is in the rail from chapter 1 in the place of Líder (it joined only after the chapter 5 boss win), and the Equipe leader card opens the leader list (UIP-13). The slot rules, prices and the team in combat are unchanged.
- Spec `ui-redesign`: the rail lists Equipe third and no Líder; the leader rows keep their look inside Equipe.
- `.specs/STATE.md`: AD-033 and AD-034 (proposed) and TD-014 (Q9).

## Success Criteria

- [ ] Ctrl+A, a double click and a drag select nothing on the start screen, the battle and Talentos; the login fields still select.
- [ ] A level bought, a node chosen, Reiniciar pontos and new points remove 0 images from the Talentos screen.
- [ ] With 5 points on COMBO 0, Shift shows `Melhorar até o nível 5 (5 pontos)` and one click buys 5 levels with one request.
- [ ] T and B open and close their screens; Ctrl+T, Ctrl+B, Shift+T, a held key and a key typed in the username field do nothing to the screens.
- [ ] A chapter 1 player changes the leader from Equipe; `git grep hud-leader` finds nothing in `game/`.
