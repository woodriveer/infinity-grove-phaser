# UI Redesign (Grove Theme) Specification

Reference: `.specs/features/ui-redesign/reference.jpg` (the owner's Gemini mock-up of the battle screen). Today's look: `.specs/features/hero-ascension/ui-review/*.png`.

## Open Questions for the Owner

Each question has a recommended default. The tasks are written with the default; a different answer changes the tasks named in the question before any task runs. Q1 is decided (below). The owner accepted the recommended defaults of Q2 to Q5 on 2026-11-12 ("2. segue recomendação, 3. manter, 4. concordo, 5. ok"), so no question is open.

| # | Question | Recommended default | Tasks it changes |
| --- | --- | --- | --- |
| Q2 | The mock-up's HUD is in Portuguese (`Tempo Restante: 37s`, `DEF FÍS`, `Modo Farmar`), while today's HUD says `Time: 37`, `Physical def 0%`, `Farm boss`, `Stage 1/10  Phase 1/5`, `Paused`, `Login` (debt TD-001). Translate them now? | No. The redesign changes no existing text; the translation stays TD-001, a task of its own, because about 40 tests pin those strings. | T6, T7, T9, T16, T17, T18 and the e2e suites that read the texts |
| Q3 | The mock-up has no element wheel. Keep it? | Keep it, restyled as a parchment card in the same place. The new `Fraco: <elemento>` chip shows the counter of the current enemy; the wheel still explains the whole table. | T26 |
| Q4 | Painted parchment and wood textures cannot be drawn by the agents. Ship with CSS only? | Yes. The panels are drawn with CSS gradients, borders and shadows now. `PROMPTS_ASSETS_UI.md` gets two Gemini prompts (`ui-parchment.jpg`, `ui-wood.jpg`); when you add the files, one line per file in `style.css` turns them on. No file is requested before then. | T27 |
| Q5 | Account reset button: inside the auto click window (current plan) or a `Renascer` entry in the right menu as in the mock-up? | Inside the auto click window, as the last control under the upgrade (nothing the player can do today disappears). The rail keeps its seven buttons, `Rever chefes` included. | T12, T14, T16 |

### Decided

| # | Decision | Owner's words | Notes |
| --- | --- | --- | --- |
| D1 (was Q1) | The auto click card on the left of the battle screen is removed. The auto click becomes a round button at the right end of the battle bar, beside the round farm button, as in the mock-up: a glowing green ring while the auto click is on, the interval (e.g. `500 ms`) under it, and the key badge `A`. Activating the button or pressing `A` opens a window above it (a popover, as in the mock-up) with everything the old card had: the `Auto clique` switch, the interval, the crystals, the upgrade and, while the reset pays crystals, the reset button (Q5). Escape, a second `A`, the button again or a press outside closes it. | "eu prefiro o auto clique com o botão redondo, e a opção do atalho para abrir a nova janela e remover a janela antiga do lado esquerdo." (2026-11-12) | Not included: a key `F` and its badge on the farm button (not asked for). The interval label reuses today's format `500 ms` (with a space). Requirement UIR-19. |

---

## Problem Statement

The game looks like a flat mobile app: cream pills with large rounded corners over a painted forest, a display font (Caprasimo) that does not match the art. The owner wants the whole game in the style of the mock-up: a dark fantasy RPG look with parchment panels, dark wood and bronze frames, a serif fantasy heading font and gold numbers. Every screen must change together, or the game looks half-made.

## Goals

- [ ] Every screen of the game (login and path choice, preloader, battle HUD, every hero screen, overlays, tooltips and notices) uses the Grove theme of `design.md`: the palette, Cinzel for headings, parchment panels and dark wood frames, on desktop and phone.
- [ ] No skill thumbnail shows its magenta chroma-key background anywhere (15 images, 5 heroes).
- [ ] No game rule, request, control behaviour, text or test id changes: the existing Vitest and Playwright suites pass, with only the visual values listed in `tasks.md` updated.
- [ ] Text contrast and focus visibility are at least as good as today: every pair of the design's contrast table reaches 4.5:1, the focus ring reaches 3:1 on parchment and on wood.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Monster art (the mock-up's fire treant) | The monster is a placeholder rectangle today and enemy design per chapter is still open (AD-006, AD-008). Wiring art per enemy is new data; it is its own feature. |
| A key `F` and its badge on the farm button | Not asked for (decision D1); the farm button keeps working by click only. |
| `Nível 5` / `Nível 10` under a locked skill | A skill unlocks with stars, not levels (`characters`, AD-020); the text would be wrong. The lock mark stays. |
| `Renascer` button on the rail | Q5 default, accepted by the owner. |
| Translating the English HUD and menu texts | Q2 default; debt TD-001. |
| New labels from the mock-up (`Vida do Chefe`, `Tempo Restante`) | They are text the game does not have; Q2 keeps text unchanged. |
| Larger HP bar, or moving HUD elements other than the bottom bar's | The bar keeps 240 x 16 px (about 20 unit tests pin it). Only the skill bar, the farm button and the auto click move, to make room for the auto click button in the bar (D1, design § Layout); the enemy line drops 13 px while the weak chip shows above it (UIR-04 AC 7). |
| Painted frame art (9-slice borders) | Q4 default: frames are CSS. Only two tileable textures get prompts. |
| A phone-specific layout | The game is one 1024 x 768 scene scaled to the screen (today on phone too); the redesign applies to that scene and is reviewed at the phone viewport. |
| New animations | The redesign adds no animation or transition (UIR-03). |
| Backend changes | None needed: no data, rule or endpoint changes. |
| Unifying the enemy defenses (`unified-damage`, AD-021 proposed) | Separate feature; whichever ships second adapts the enemy chips (design Risks). |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Scope of the redesign | Every screen: login and path choice, preloader, battle HUD, every hero screen (Heróis, detail, Mochila, bulk sell, Fusão, Líder, Equipamento with tiles and tooltip, Talentos, Rever chefes), pause, reset dialog, auto click, farm switch, notices, element wheel, skill tooltip; desktop and phone viewports | Orchestrator assumption 1; one theme for the whole game | n (owner confirms at approval) |
| Kind of change | Visual only: no backend change, no new game rule; layout changes only where the data already exists (timer ring, enemy chips, weak element chip, round farm button). The one behaviour change is D1: the auto click controls move into a window opened by a round button or the key `A` | Orchestrator assumption 2; D1 is the owner's decision | n (D1: y) |
| How the look is built | CSS tokens and recipes in `game/public/style.css`, the Cinzel web font and the existing assets; Phaser colours for the HP bar, damage numbers, menu oval and preloader bar; painted textures only through prompts (Q4) | Orchestrator assumption 3; ships without new art | y |
| Tests and accessibility | Every existing test id, class name and text stays; contrast and focus are not reduced; no new animation | Orchestrator assumption 4 | y |
| Auto click placement | D1: round button at scene (867, 686) in the battle bar, window above it; the left card is removed | Owner decision 2026-11-12 | y |
| Press outside the open auto click window | It closes the window and still does what it does today (a press on the canvas hits the monster); focus stays where the press put it | The window is not modal; the fight must not lose a click the player meant for it | y |
| `A` while a hero screen, the pause menu or the reset dialog is open | Does nothing | Those cover the battle bar; the window would open behind them | y |
| Existing English text | Q2 default: unchanged | Q2 | y |
| Element wheel | Q3 default: kept and restyled | Q3 | y |
| Painted textures | Q4 default: CSS now, art later through the `--texture-*` tokens | Q4 | y |
| Rail buttons and reset button | Q5 default: seven buttons, `Rever chefes` kept; the reset button lives in the auto click window | Q5 | y |
| Magenta skill thumbnails | Decided by the owner (in scope): the 15 skill images are re-cut with the existing `art/tools/cutout_hero.py` onto the dark background `#1c120c`, keeping their names and `.jpg` format, 512 px tall | Same file names mean no change to the backend seed, `dom.js` or any test fixture; JPEG keeps the files small (the 2.3 to 2.8 MB sources become about 60 KB) | y (owner, via orchestrator) |
| Fonts | Cinzel 700 for headings, plaques, buttons and HUD numbers; Figtree stays the body font; Caprasimo is dropped | The mock-up's headings are a classical serif in small caps; its body text is a sans | y |
| Damage number colours | Normal `#ffd35c` (gold), critical `#ff8a1f` (orange), both with a `#2a1408` outline | The mock-up's `15.7` is gold-orange with a dark outline; critical stays bigger (48 px) and warmer | y |
| Weak element chip | `Fraco: <elemento>` names the element that hits the enemy for double (FIRE is weak to WATER, WATER to NATURE, NATURE to FIRE); LIGHT and DARKNESS enemies show no chip | Derived from the element table of `game/src/domain/combat/elements.js`; LIGHT and DARKNESS take at most 1x from any element, so they have no weakness | y |
| New text | `Fraco: <elemento>` is the only new player text, in Portuguese (AD-007), with the labels of `ELEMENT_LABELS` (`Fogo`, `Água`, `Natureza`) | AD-007 | y |
| Fixes of the ui review (2026-11-13, tasks T31 to T38) | Leader card name at 15 px in up to two lines; a dark ink per talent branch for the `Melhorar` buttons, branch titles and `Nível máximo`; Boot and Preloader on `#1c120c` with a wood track; hero cards in equal columns with 15 px names. Findings 6 (logo glow) and 7 (notice over the combo chip) deferred | 17 px does not fit `Sombraespinho` (144 px in a 128 px column, measured in Chromium); the four branch colours fail 4.5:1 as button fill and as title text (1.71:1 to 3.92:1); the logo is outside this spec and moving the notice is out of scope (Out of Scope, HUD positions) | n (owner confirms with the fix tasks) |
| Enemy line under the weak chip (Verifier round 3, D2) | Accepted: the chip, a 4 px gap and the line stack as one column centred on y 596, so the line's vertical centre is y 609 while the chip shows and y 596 while it does not; every other anchor stays at its baseline `5d98b6f` value (UIR-04 AC 7) | UIR-08 AC 6 puts the chip above the line inside `.hud-enemy`; the box keeps its scene anchor (670, 596) and the ui-artist approved the screen | n (product owner, 2026-11-14; owner confirms at acceptance) |
| Beaten stops of the boss map (Verifier round 3, D3) | The `farm-entry-<id>` stops keep the boss map look (UIR-13 AC 16), not the inset recipe; "farm entries" leaves the inset list of AC 4 | The farm list rows the AC named no longer render (the boss map replaced them); an inset rectangle on a round map stop would break the map | n (product owner, 2026-11-14; owner confirms at acceptance) |
| Reference rendering for numbers in tests | Colours are asserted as the computed `rgb(...)` strings of `design.md`; the contrast ratios are computed from those values (WCAG 2.x relative luminance) | L-013: exact markers, not adjectives | y |

**Open questions:** none - Q1 is decided (D1) and the owner accepted the defaults of Q2 to Q5 and approved the spec on 2026-11-12.

---

## User Stories

### P1: Grove theme foundation ⭐ MVP

**User Story**: As a player, I want the whole game to share one dark fantasy look so that it feels like the RPG of the mock-up.

**Why P1**: Every other story builds on the palette, the font and the button recipes.

**Acceptance Criteria** (UIR-01, UIR-02, UIR-03):

1. The game SHALL load Cinzel (weight 700) and Figtree (weights 400, 600, 700 and 800) from Google Fonts and SHALL request no Caprasimo font.  <!-- UIR-01 -->
2. The style sheet SHALL define every palette token of `design.md` § Palette with its exact value (for example `--wood-800: #2b1d14`, `--parchment-200: #ead6ad`, `--ember-700: #a8431a`, `--color-focus: #cc4e1a`).  <!-- UIR-01 -->
3. The token `--font-heading` SHALL be `"Cinzel", Georgia, serif`, so the computed font-family of a hero screen title (`.hero-title`) starts with `Cinzel`.  <!-- UIR-01 -->
4. The page background around the scaled game SHALL be `rgb(28, 18, 12)`.  <!-- UIR-01 -->
5. WHILE a `--texture-*` token is `none` the panels and frames SHALL draw only their CSS gradients and the page SHALL request no `ui-parchment.jpg` or `ui-wood.jpg`.  <!-- UIR-01 -->
6. WHERE `--texture-parchment` or `--texture-wood` is set to `url("assets/ui-parchment.jpg")` or `url("assets/ui-wood.jpg")`, every parchment panel or wood frame SHALL draw that image as its top background layer.  <!-- UIR-01 -->
7. The secondary button (`Fechar`, `Voltar`, `Sign up`, `Logout`, `2. Leave fight`, `Yes, leave`, `Resetar` of the reset dialog, the equipment action buttons other than `Refinar`) SHALL have computed background-color `rgb(43, 29, 20)`, a 2 px solid border `rgb(176, 122, 58)`, text colour `rgb(244, 230, 200)` and border-radius `999px`.  <!-- UIR-02 -->
8. The primary button (`Login`, `1. Continue`, `No, stay`, `Cancelar` of the reset dialog, `Fundir`, the bag's go-to-fusion button, `Refinar`, the bulk sale confirmation) SHALL have computed background-color `rgb(168, 67, 26)`, a 2 px solid border `rgb(224, 180, 90)` and text colour `rgb(244, 230, 200)`.  <!-- UIR-02 -->
9. WHEN the pointer is over an enabled primary or secondary button THEN the button SHALL render with `filter: brightness(1.15)`.  <!-- UIR-02 -->
10. WHEN an enabled primary or secondary button is pressed THEN it SHALL render with `filter: brightness(0.9)`.  <!-- UIR-02 -->
11. IF a button is disabled THEN it SHALL keep opacity `0.45`, as today.  <!-- UIR-02 -->
12. The coin discs of the wallet SHALL be 20 px metallic radial gradients: gold `#fff1b0` to `#e0b45a` to `#8a5a12`, silver `#ffffff` to `#c9ccd1` to `#6f747b`, copper `#f6c08f` to `#b8652d` to `#5e2c10`.  <!-- UIR-02 -->
13. WHEN a control receives keyboard focus THEN it SHALL show a 3 px solid outline `rgb(204, 78, 26)` with a 2 px offset (3.15:1 against parchment `#ead6ad`, 3.63:1 against wood `#2b1d14`).  <!-- UIR-03 -->
14. Every text and background pair of `design.md` § Contrast SHALL reach at least 4.5:1, measured from the computed colours.  <!-- UIR-03 -->
15. The restyled buttons, rail buttons and the boss timer SHALL have computed `animation-name: none` and `transition-duration: 0s` (the redesign adds no motion; the existing `prefers-reduced-motion` rules stay).  <!-- UIR-03 -->
16. The redesign SHALL keep every `data-testid`, class name, element order and text the existing tests use, and the existing Vitest and Playwright suites SHALL pass with only the values listed in `tasks.md` (HP bar colours, damage number style, menu oval) updated.  <!-- UIR-03 -->

**Independent Test**: Open any screen; the title is Cinzel, panels are parchment with a dark wood border, buttons are wood or ember with a bronze or gold border; Tab shows the orange-red ring; `npm test` and `npx playwright test` pass.

---

### P1: Battle HUD in the Grove theme ⭐ MVP

**User Story**: As a player, I want the fight screen to look like the mock-up so that the main screen of the game carries the new look.

**Why P1**: The player spends almost all the time on this screen.

**Acceptance Criteria** (UIR-04 to UIR-07, UIR-09 to UIR-12):

1. The stage position (`.stage-hud`, e.g. `Stage 1/10  Phase 1/5`) SHALL render as a parchment plaque: background-color `rgb(234, 214, 173)`, a 3 px solid border `rgb(90, 61, 38)`, border-radius `6px`, Cinzel 700 19 px, text `rgb(42, 26, 16)`.  <!-- UIR-04 -->
2. The chapter (`chapter-hud`, e.g. `Capítulo 2`) SHALL render as a parchment tag: background-color `rgb(234, 214, 173)`, a 2 px solid border `rgb(90, 61, 38)`, border-radius `4px`, Cinzel 700 16 px.  <!-- UIR-04 -->
3. The wallet (`.wallet`) SHALL render as the parchment plaque of criterion 1 with the coin discs of the foundation story.  <!-- UIR-04 -->
4. WHILE the combo is shown, the combo (`combo-hud`) SHALL render as an ember chip: background-color `rgb(138, 53, 16)`, a 2 px solid border `rgb(224, 180, 90)`, text `rgb(244, 230, 200)`, Cinzel 700 20 px.  <!-- UIR-04 -->
5. WHEN a stage message shows (e.g. `Chapter complete!`) THEN it SHALL render in Cinzel 700 52 px, fill `rgb(255, 211, 92)` with a 10 px stroke `rgb(42, 20, 8)`.  <!-- UIR-04 -->
6. WHEN a notice shows (`card-notice`, e.g. `Carta: Lyra Folhaveloz`) THEN it SHALL render as a dark frame plaque: background-color `rgb(43, 29, 20)`, a 2 px solid border `rgb(176, 122, 58)`, text `rgb(243, 213, 138)`, Cinzel 700 22 px.  <!-- UIR-04 -->
7. Every HUD element SHALL keep the scene anchor it has at baseline `5d98b6f`, measured in the 1024 x 768 scene within 1 scene px in the same battle state: the left edge of `.stage-hud` at x 156 and its vertical centre at y 44, the right edge of `.wallet` at x 1004 and its vertical centre at y 44, the centre of `chapter-hud` at (82, 96), of `combo-hud` at (670, 150) and of `.boss-timer` at (512, 44), and the horizontal centre of `.enemy-stats` at x 670; the exceptions are the three of the battle bar that make room for the auto click button (the skill bar moves from x 586 to x 550, the farm button from x 918 to x 951, the auto click from (366, 200) to (867, 686)) and the vertical centre of the enemy line, which shares the box `.hud-enemy` (460 x 80, centred on (670, 596)) with the weak chip of UIR-08 as one column centred on y 596 (chip, 4 px gap, line): WHILE the chip renders (FIRE, WATER or NATURE encounter, chip 22 px tall) the vertical centre of `.enemy-stats` SHALL be y 609, and WHILE no chip renders (LIGHT or DARKNESS encounter) it SHALL be y 596. (Amended 2026-11-14, Verifier round 3: the anchors are the ones the e2e test measures; the 13 px drop of the line under the chip is accepted.)  <!-- UIR-04 -->
8. The monster health bar SHALL keep 240 x 16 px and its position, with the back colour `0x2a1410` and the fill colour `0xc0392b`.  <!-- UIR-05 -->
9. The box over the bar (`.hud-monster-hp`) SHALL draw a frame of a 2 px ring `rgb(28, 18, 12)` inside a 2 px ring `rgb(176, 122, 58)` and a gloss gradient, and SHALL stay click-through.  <!-- UIR-05 -->
10. The HP text (`monster-hp`, e.g. `HP 1000/1000`) SHALL keep its text and render in Figtree 800 12 px, colour `rgb(255, 244, 220)` with a 3 px stroke `rgb(28, 18, 12)`.  <!-- UIR-05 -->
11. WHEN a hit that is not critical lands THEN its number SHALL be a Phaser text with fontFamily `Cinzel`, fontStyle `700`, fontSize 32, colour `#ffd35c`, stroke `#2a1408` and strokeThickness 8.  <!-- UIR-05 -->
12. WHEN a critical hit lands THEN its number SHALL be a Phaser text with fontFamily `Cinzel`, fontStyle `700`, fontSize 48, colour `#ff8a1f`, stroke `#2a1408` and strokeThickness 8.  <!-- UIR-05 -->
13. WHILE a miniboss or chapter boss countdown runs, the timer (`.boss-timer`) SHALL keep its text (`Time: <seconds>`) and render as a dark frame pill: background-color `rgb(43, 29, 20)`, a 2 px solid border `rgb(176, 122, 58)`, Cinzel 700 20 px, text `rgb(243, 213, 138)`, led by a 32 px progress ring.  <!-- UIR-06 -->
14. WHILE a countdown runs, the timer SHALL carry the inline CSS property `--timer-left` equal to remaining time divided by the time limit, written with 3 decimals (`1.000` when a 60 s countdown starts, `0.750` after 15 s, `0.000` at expiry), and the ring SHALL fill that share of the circle in `rgb(232, 116, 42)`.  <!-- UIR-06 -->
15. WHEN the countdown is hidden (boss beaten, boss timed out, fight left) THEN the timer SHALL have no `--timer-left` property and SHALL not render.  <!-- UIR-06 -->
16. The element tag of the enemy line SHALL carry `data-element="<ELEMENT>"` and show a 10 px dot in the element colour before its text: FIRE `#e8643c`, WATER `#3f8fd1`, NATURE `#4f9a3c`, LIGHT `#f2c94c`, DARKNESS `#4a3a7a`.  <!-- UIR-07 -->
17. The physical defense, magical defense and critical resistance tags SHALL carry `data-stat` `physical`, `magical` and `crit` and show a 12 px icon before their text: a shield `rgb(176, 122, 58)`, a shield `rgb(63, 143, 209)` and a target `rgb(214, 69, 65)`.  <!-- UIR-07 -->
18. Every enemy tag SHALL render as a dark chip: background-color `rgba(28, 18, 12, 0.85)`, a 1 px solid border `rgb(176, 122, 58)`, text `rgb(244, 230, 200)`; the line itself (`.enemy-stats`) SHALL have a transparent background.  <!-- UIR-07 -->
19. The text of the enemy line SHALL stay exactly as today (e.g. `Fire  Physical def 0%  Magical def 0%  Crit res 0%`).  <!-- UIR-07 -->
20. The hero rail (`.hero-hud`) SHALL render as a parchment strip (background-color `rgb(234, 214, 173)`, 3 px border `rgb(90, 61, 38)`, border-radius `10px`) with its seven buttons, labels, order and test ids unchanged.  <!-- UIR-09 -->
21. Each rail button SHALL be a 76 x 60 px framed square: background-color `rgb(43, 29, 20)`, a 2 px solid border `rgb(176, 122, 58)`, border-radius `6px`, icon colour `rgb(224, 180, 90)`, label Figtree 700 11 px `rgb(244, 230, 200)`, 6 px apart, with no label wider than its button.  <!-- UIR-09 -->
22. The rail badges SHALL be ember dots: background-color `rgb(232, 116, 42)` with a 2 px ring `rgb(28, 18, 12)`; the talents count SHALL be written in `rgb(42, 26, 16)`.  <!-- UIR-09 -->
23. The battle bar SHALL be a parchment panel 984 x 124 px with border-radius `12px`.  <!-- UIR-10 -->
24. The leader card (`leader-card`) SHALL be a 240 x 104 px dark frame card (background-color `rgb(43, 29, 20)`, 2 px border `rgb(176, 122, 58)`): the 72 px portrait inside a 3 px ring `rgb(224, 180, 90)`, the name in Cinzel 700 15 px `rgb(243, 213, 138)` with line-height 1.1, wrapping to at most two lines and never cut (its scrollWidth not greater than its clientWidth for each of the five heroes), the bonus in Figtree 600 12 px `rgb(244, 230, 200)`. (Amended 2026-11-13, review finding 3: at 17 px `Sombraespinho` needs 144 px of the 128 px text column.)  <!-- UIR-10 -->
25. Each skill art in the bar SHALL sit in a 150 x 62 px frame with a 2 px solid border `rgb(176, 122, 58)`, border-radius `8px` and background `rgb(28, 18, 12)`; an unlocked skill SHALL add a 2 px ring `rgb(224, 180, 90)` around it.  <!-- UIR-10 -->
26. The key badge (`skill-key-<slot>`) SHALL be 20 x 20 px with background `rgb(28, 18, 12)`, a 1 px border `rgb(224, 180, 90)` and the letter in Cinzel 700 12 px `rgb(243, 213, 138)`.  <!-- UIR-10 -->
27. WHILE a skill is locked, its lock mark SHALL be a 32 px circle with background `rgba(28, 18, 12, 0.85)` and the lock drawn in `rgb(224, 180, 90)`.  <!-- UIR-10 -->
28. The skill level badges and the star tiers SHALL keep the colours of AD-020 (`#7a3fa0`; `#d9a521` with `#201e1d`).  <!-- UIR-10 -->
29. The auto click window (`auto-click-popover`) SHALL render as a parchment panel 240 px wide with border-radius `10px` and a tail pointing at the button, its switch track `rgb(61, 42, 28)` with a 1 px border `rgb(176, 122, 58)` that turns `rgb(63, 143, 58)` when on, and its upgrade and reset buttons in the primary recipe.  <!-- UIR-11 -->
30. The farm switch (`.farm-toggle input`) SHALL render as a 56 px round button with a skull icon `rgb(224, 180, 90)`, background-color `rgb(43, 29, 20)` and a 3 px solid ring `rgb(176, 122, 58)`, with its label `Farm boss` under it in Figtree 700 12 px `rgb(42, 26, 16)`.  <!-- UIR-11 -->
31. WHILE the farm switch is on, its ring SHALL be `rgb(232, 116, 42)` with an outer glow `0 0 12px 2px rgba(232, 116, 42, 0.75)`.  <!-- UIR-11 -->
32. The dim layer behind the pause menu, the reset dialog and the hero screens SHALL be `rgba(28, 18, 12, 0.62)`.  <!-- UIR-12 -->
33. The pause card and the reset card SHALL be parchment panels 420 px wide with border-radius `12px`; the title `Paused` SHALL be Cinzel 700 40 px `rgb(42, 26, 16)`.  <!-- UIR-12 -->

**Independent Test**: Start a chapter 2 boss fight against a FIRE boss (`npm run ui:shots -- uiRedesign`, shot `05-battle-boss`): plaque, tag, scroll, timer pill with its ring, framed HP bar, dark enemy chips with icons and `Fraco: Água`, framed rail, dark leader card, framed skills, round auto click button with its `A` badge and `500 ms` under it, and the round farm button; no card on the left.

---

### P1: Round auto click button and its window ⭐ MVP

**User Story**: As a player, I want the auto click as a round button in the bar that opens its settings on demand, with a key, so that the left side of the fight stays clear and I reach the settings fast.

**Why P1**: Owner decision D1.

**Acceptance Criteria** (UIR-19):

1. WHILE the auto click is unlocked (campaign at chapter 2 or later, or at least one account reset), the battle bar SHALL show the round button `auto-click-button` centred at scene (867, 686): a 56 px circle with background-color `rgb(43, 29, 20)`, a 3 px ring and a pointer icon in `rgb(243, 213, 138)`.  <!-- UIR-19 -->
2. The button SHALL carry the key badge `auto-click-key` reading `A` (20 x 20 px, the look of the skill key badges) on its top left, and under it the label `auto-click-rate` with the current interval in today's format (`500 ms` at level 0, `250 ms` at level 1).  <!-- UIR-19 -->
3. WHILE the auto click is locked, the button, its label and its window SHALL not render, and no auto click element SHALL render anywhere else (the old card at (366, 200) is gone).  <!-- UIR-19 -->
4. WHILE the auto click is on, the button ring SHALL be `rgb(95, 211, 90)` with an outer glow `0 0 14px 4px rgba(95, 211, 90, 0.75)`.  <!-- UIR-19 -->
5. WHILE the auto click is off, the button ring SHALL be `rgb(176, 122, 58)` with no green glow.  <!-- UIR-19 -->
6. WHEN the player activates the closed button (click, Enter or Space) THEN the window `auto-click-popover` SHALL open above the button, the button's `aria-expanded` SHALL become `true` and focus SHALL move to the switch `auto-click-toggle`.  <!-- UIR-19 -->
7. The window SHALL hold, in this order, the switch `Auto clique`, the interval (`auto-click-interval`), the crystals (`auto-click-crystals`), the upgrade (`auto-click-upgrade`) and, while a reset pays crystals, the button `reset-account` (`Resetar conta (+N cristais)`), each with its text and behaviour of today.  <!-- UIR-19 -->
8. WHEN the player presses `A` with the window closed THEN the window SHALL open as in criterion 6.  <!-- UIR-19 -->
9. WHEN the player presses `A`, presses Escape or activates the button with the window open THEN the window SHALL close, `aria-expanded` SHALL become `false` and focus SHALL return to the button.  <!-- UIR-19 -->
10. WHEN Escape closes the window THEN the pause menu SHALL not open (a second Escape opens it as today).  <!-- UIR-19 -->
11. WHEN a pointer press lands outside the button and its window THEN the window SHALL close and the press SHALL act as it does today (a press on the canvas hits the monster).  <!-- UIR-19 -->
12. IF the `A` key event comes from a text field (an `input` other than checkbox, radio or button, a `textarea`, a `select` or a `contenteditable` element) THEN the key SHALL do nothing.  <!-- UIR-19 -->
13. IF the `A` key event is a repeat of a held key THEN it SHALL do nothing.  <!-- UIR-19 -->
14. WHILE the pause menu, the reset dialog or a hero screen is open, or the auto click is locked, `A` SHALL do nothing.  <!-- UIR-19 -->
15. WHEN the window re-renders while it holds focus (switch turned, upgrade answered, crystals loaded) THEN focus SHALL stay on the control with the same `data-testid`.  <!-- UIR-19 -->
16. WHEN the reset button of the window opens the reset dialog THEN the window SHALL close.  <!-- UIR-19 -->
17. WHEN the auto click becomes locked with the window open THEN the window SHALL close.  <!-- UIR-19 -->
18. The button SHALL carry `aria-label="Auto clique"`, `aria-haspopup="dialog"` and `aria-controls="auto-click-popover"`; the window SHALL carry `id="auto-click-popover"`, `role="dialog"` and `aria-label="Auto clique"`.  <!-- UIR-19 -->
19. A click on the button or inside the window SHALL not hit the monster.  <!-- UIR-19 -->
20. The key `A` SHALL be bound to nothing else in the battle scene (keys in use: 1, 2, 3, Q, W, E, Esc).  <!-- UIR-19 -->
21. The boxes of the skill bar (x 313..787), the auto click (x 827..907) and the farm button (x 911..991) SHALL not overlap each other, the leader card (x 34..274), the hero rail (x from 907, y up to 609) or the bar's edges (x 20..1004, y 624..748); the open window SHALL stay inside the scene and left of the rail.  <!-- UIR-19 -->
22. WHILE the scene is scaled to a 390 px wide phone viewport, the button, its badge, its label and its open window SHALL keep the same layout scaled by 390/1024 and stay inside the scene.  <!-- UIR-19 -->

**Independent Test**: In chapter 2, the bar shows two round buttons at its right end; press `A`: the window opens above the auto click button with the switch focused; Escape closes it and the focus is back on the button; the left of the fight is empty.

---

### P1: Skill thumbnails without magenta ⭐ MVP

**User Story**: As a player, I want the skill pictures on a dark background so that no bright magenta box shows next to the new look.

**Why P1**: Decided in scope by the owner; the magenta is the most visible defect of today's screens.

**Acceptance Criteria** (UIR-16):

1. Each of the 15 skill images (`kael_dimensional_cut`, `kael_charge`, `kael_screen`, `lyra_double_shot`, `lyra_focused_shot`, `lyra_rapid_wind`, `orina_grasp_prision`, `orina_tempest`, `orina_meteor_storm`, `seraphine_blessing`, `seraphine_holy_light`, `seraphine_bell_ringing`, `vex_poison_bomb`, `vex_smoke_bomb`, `vex_bleeding_blow`, all `.jpg` in `game/public/assets/heroes/`) SHALL have at most 0.1 % of its pixels with `min(R, B) - G >= 110`.  <!-- UIR-16 -->
2. Each of the 15 files SHALL keep its name and the `.jpg` format, be 512 px tall, keep the aspect ratio of its source in `art/` (within 1 px of width) and have the corner pixel (2, 2) within 12 of `#1c120c` on each channel.  <!-- UIR-16 -->
3. WHEN the skill bar, the hero detail, a bag entry detail or a skill tooltip shows a skill image THEN the image drawn in the browser SHALL have at most 0.1 % of pixels with `min(R, B) - G >= 110`.  <!-- UIR-16 -->
4. WHEN `python art/tools/cutout_hero.py art/<name>.jpg game/public/assets/heroes/<name>.jpg --height 512 --background 1c120c` runs THEN it SHALL write that file as an RGB JPEG of the whole frame (no crop) flattened onto `#1c120c`.  <!-- UIR-16 -->
5. WHEN `cutout_hero.py` runs without `--background` THEN it SHALL behave exactly as today (transparent PNG cropped to the hero).  <!-- UIR-16 -->

**Independent Test**: Open Heróis, open each of the five heroes: every skill picture sits on near-black, no pink.

---

### P1: Hero screens in the Grove theme ⭐ MVP

**User Story**: As a player, I want every menu screen to match the battle screen so that the game does not switch styles when I open a menu.

**Why P1**: The hero screens are the second most used part of the game.

**Acceptance Criteria** (UIR-13, UIR-14):

1. The hero screen window (`.hero-window`) SHALL be a parchment panel 920 px wide with border-radius `12px`, background-color `rgb(234, 214, 173)` and a 3 px solid border `rgb(90, 61, 38)`.  <!-- UIR-13 -->
2. The screen title (`.hero-title`) SHALL be Cinzel 700 30 px `rgb(42, 26, 16)`.  <!-- UIR-13 -->
3. IF a screen shows an error line (`.hero-error`, e.g. `Não foi possível fundir as cartas.`) THEN it SHALL render with background-color `rgb(138, 53, 16)` and text `rgb(244, 230, 200)`.  <!-- UIR-13 -->
4. The inner cards (hero cards, skill rows, fusion and leader rows, equipment hero blocks, talent columns, leader stats, bulk sale bar, empty states) SHALL use the inset recipe: background-color `rgb(230, 208, 162)`, a 1 px solid border `rgba(90, 61, 38, 0.45)`, border-radius `8px`.  <!-- UIR-13 -->
5. The portraits of the hero cards and of the hero detail SHALL sit on the dark vignette `radial-gradient(circle at 50% 45%, #5a3d26, #1c120c)`.  <!-- UIR-13 -->
6. The star tier colours SHALL stay those of AD-020: 4 to 6 stars `rgb(122, 63, 160)`; 7 to 9 stars background `rgb(217, 165, 33)` with text `rgb(32, 30, 29)`.  <!-- UIR-13 -->
7. The equipment piece tiles SHALL have background-color `rgb(43, 29, 20)`, keeping every rarity frame, gem, effect and the drag and selection states of today.  <!-- UIR-14 -->
8. The piece tooltip and the skill tooltip SHALL be parchment panels with border-radius `8px` and a 2 px solid border `rgb(90, 61, 38)`.  <!-- UIR-14 -->
9. The talent cards SHALL keep their branch colours and render on `rgb(244, 230, 200)` with the branch bar on their left edge.  <!-- UIR-14 -->
10. The chapter map of `Rever chefes` (`.farm-map`) SHALL be framed by a 3 px ring `rgb(90, 61, 38)` and an outer 2 px ring `rgb(176, 122, 58)`, drawn as box-shadows so the map keeps its 880 x 495 layout box.  <!-- UIR-14 -->
11. The element wheel SHALL be a parchment panel with border-radius `10px` and its title in Cinzel 700.  <!-- UIR-14 -->
12. The rows of the `Líder` screen (`.leader-entry`, the current one included) SHALL write the hero name (`.leader-name`) in Cinzel 18 px `rgb(42, 26, 16)`: 13.56:1 on the current row `rgb(244, 230, 200)`, 11.09:1 on the other rows `rgb(230, 208, 162)`.  <!-- UIR-13 -->
13. The five hero cards of `Heróis` SHALL have the same width and the same portrait height, and each hero name (`.hero-card .hero-name`, Cinzel 700 15 px) SHALL lie inside its card's content box.  <!-- UIR-13 -->
14. WHEN the pointer is over a skill slot THEN the skill tooltip SHALL show the skill art at 112 x 64 px and the whole skill text inside the tooltip box, on the tooltip's own parchment (the skill row inside it has no background, border or padding).  <!-- UIR-14 -->
15. Each talent branch SHALL have a dark ink: TIME `rgb(36, 93, 100)`, BREAK `rgb(149, 55, 36)`, POWER `rgb(108, 83, 17)`, COMBO `rgb(106, 49, 197)`. The `Melhorar` buttons SHALL be filled with that ink under text `rgb(244, 230, 200)` (5.90:1 to 6.02:1), and the branch titles and `Nível máximo` SHALL be written in it (at least 4.82:1 on `rgb(230, 208, 162)`); the card's left bar keeps the branch colour of AC 9.  <!-- UIR-14 -->
16. The beaten stops of the `Rever chefes` map (the `farm-entry-<id>` buttons, class `map-node`, `data-state="defeated"`) SHALL keep the boss map look instead of the inset recipe of AC 4: background-color `rgb(225, 238, 204)` and a 3 px solid border `rgb(93, 160, 72)`, each miniboss stop 52 x 52 px with border-radius `50%`, the chapter boss stop (`farm-entry-chapter-boss`) 96 x 80 px with border-radius `24px`. (Amended 2026-11-14, Verifier round 3: the farm list rows were replaced by the map stops.)  <!-- UIR-13 -->

**Independent Test**: Open each rail screen in turn (shots `20` to `31` of `ui:shots`): parchment window, Cinzel title, inset cards, dark tiles with their rarity frames, parchment tooltips.

---

### P2: Weak element chip

**User Story**: As a player, I want to see which element beats the enemy so that I know which hero to lead with.

**Why P2**: The mock-up shows it and the rule exists, but the fight works without it.

**Acceptance Criteria** (UIR-08):

1. WHEN an encounter of element FIRE spawns THEN the chip `weak-chip` SHALL read `Fraco: Água`.  <!-- UIR-08 -->
2. WHEN an encounter of element WATER spawns THEN the chip SHALL read `Fraco: Natureza`.  <!-- UIR-08 -->
3. WHEN an encounter of element NATURE spawns THEN the chip SHALL read `Fraco: Fogo`.  <!-- UIR-08 -->
4. WHEN an encounter of element LIGHT or DARKNESS spawns THEN the chip SHALL be empty and not render.  <!-- UIR-08 -->
5. WHEN the enemy line is cleared (the monster dies, the boss times out, the chapter is complete) THEN the chip SHALL be emptied in the same call.  <!-- UIR-08 -->
6. WHEN the chip shows (FIRE, WATER or NATURE encounter) THEN its horizontal centre SHALL be within 1 scene px of the horizontal centre of the enemy line (`.enemy-stats`) and its bottom edge at or above that line's top edge, inside the same click-through HUD element (`.hud-enemy`), and it SHALL carry `data-element` of the element it names and render as a dark chip with that element's dot.  <!-- UIR-08 -->
7. The chip's box SHALL not overlap the battle bar or the hero rail.  <!-- UIR-08 -->

**Independent Test**: Start against a FIRE monster: `Fraco: Água` with a blue dot above the enemy chips; against a LIGHT monster: no chip.

---

### P2: Main menu and preloader in the Grove theme

**User Story**: As a player, I want the first screens to look like the rest of the game.

**Why P2**: Seen once per session, but it is the first impression.

**Acceptance Criteria** (UIR-15):

1. The main menu oval SHALL be drawn with fill `0xead6ad` and a 6 px stroke `0x5a3d26`, at the same position and size as today (centre 170, 380; 700 x 1040).  <!-- UIR-15 -->
2. The login fields SHALL have background-color `rgb(244, 230, 200)`, a 2 px solid border `rgb(90, 61, 38)` and text `rgb(42, 26, 16)`; WHEN a field has keyboard focus THEN its border SHALL be `rgb(204, 78, 26)`.  <!-- UIR-15 -->
3. The path choice panel (`.path-choice`) SHALL be a parchment panel and each hero option an inset card.  <!-- UIR-15 -->
4. The preloader bar SHALL have a 2 px outline `0xe0b45a` and a fill `0xe8742a`, at the same position and size as today.  <!-- UIR-15 -->
5. The Boot and Preloader screens SHALL draw on the game background `#1c120c` with no image behind the bar (the sky gradient `assets/preloader.png` is neither loaded nor drawn), and the bar's track SHALL be filled `0x2b1d14` inside its gold outline.  <!-- UIR-15 -->
6. WHILE the welcome screen is shown, the start prompt `Click to Start!` (`.welcome-start`, a `<p>` and not a button: a click anywhere on the canvas starts the game) SHALL be drawn as an ember pill with no hover or press shade: computed font-family starting with `Cinzel`, font-weight `700`, font-size `22px`, width `320px`, text colour `rgb(244, 230, 200)`, background-color `rgb(168, 67, 26)`, a 2 px solid border `rgb(224, 180, 90)`, border-radius `999px` and filter `none`.  <!-- UIR-15 -->

**Independent Test**: Reload the page: gold-outlined ember loading bar; menu: parchment oval with a wood rim, Cinzel title, ember `Login`, wood `Sign up`.

---

### P3: Painted textures ready to drop in

**User Story**: As the owner, I want prompts for the parchment and wood textures so that I can generate them and turn them on without new code.

**Why P3**: The CSS look stands on its own; the art adds the painted grain.

**Acceptance Criteria** (UIR-17):

1. `PROMPTS_ASSETS_UI.md` SHALL contain a section `5. Texturas da interface` with one Gemini prompt for `ui-parchment.jpg` and one for `ui-wood.jpg` (tileable, 512 x 512, JPG), each with its target path and the exact line of `style.css` that turns it on.  <!-- UIR-17 -->

---

### P1: Review screenshots ⭐ MVP

**User Story**: As the ui-artist, I want screenshots of every restyled screen on desktop and phone so that I can check them against the mock-up.

**Why P1**: The project's acceptance needs the ui-artist review (`CLAUDE.md`, Agent team step 3).

**Acceptance Criteria** (UIR-18):

1. WHEN `cd game && npm run ui:shots -- uiRedesign` runs THEN it SHALL write every screenshot listed in `design.md` § Review screenshots, for the projects `desktop` and `phone`, into `.specs/features/ui-redesign/ui-review/` as `<NN>-<name>-<desktop|phone>.png`.  <!-- UIR-18 -->

---

## Edge Cases

- IF the Google Fonts request fails THEN headings SHALL fall back to Georgia, serif and every control SHALL keep working (font tokens carry the fallback).  <!-- UIR-01 -->
- IF a skill image fails to load THEN its frame SHALL show the dark background `rgb(28, 18, 12)`, not the parchment (the frame owns the background).  <!-- UIR-10 -->
- WHEN the countdown is extended above its starting limit THEN `--timer-left` SHALL be computed against the extended limit (never above `1.000`).  <!-- UIR-06 -->
- WHEN the countdown has run out THEN `--timer-left` SHALL read `0.000`, never a negative value.  <!-- UIR-06 -->
- WHEN the enemy element is LIGHT or DARKNESS THEN the weak chip SHALL be empty (no `Fraco:` text).  <!-- UIR-08 -->
- WHEN a hero screen opens over a running fight THEN the dim layer SHALL be the only change behind it (the fight keeps running, spec background-fight).  <!-- UIR-12 -->
- WHEN a label is the longest one of the rail (`Equipamento`) THEN its text SHALL fit inside the 76 px button (scrollWidth not greater than clientWidth).  <!-- UIR-09 -->
- WHILE the player's system asks for reduced motion, the existing EPIC and LEGENDARY tile effects and the map pulse SHALL stay off as today, and no new animation SHALL exist to turn off.  <!-- UIR-03 -->
- WHEN the auto click window opens on the phone viewport THEN it SHALL stay inside the scaled scene (left edge at scene x 663 or more, top at scene y 400 or more).  <!-- UIR-19 -->
- WHEN the reset button shows in the window (chapter 2 or later) THEN the window SHALL grow upward to hold it and still end 10 px above the button.  <!-- UIR-19 -->
- IF the skill art of a source has purple effects close to the chroma key THEN the cutout SHALL blend them toward the dark background (accepted; checked in the ui-artist review).  <!-- UIR-16 -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UIR-01 | P1: Grove theme foundation | Tasks | In Tasks |
| UIR-02 | P1: Grove theme foundation | Tasks | In Tasks |
| UIR-03 | P1: Grove theme foundation | Tasks | In Tasks |
| UIR-04 | P1: Battle HUD | Tasks | In Tasks |
| UIR-05 | P1: Battle HUD | Tasks | In Tasks |
| UIR-06 | P1: Battle HUD | Tasks | In Tasks |
| UIR-07 | P1: Battle HUD | Tasks | In Tasks |
| UIR-08 | P2: Weak element chip | Tasks | In Tasks |
| UIR-09 | P1: Battle HUD | Tasks | In Tasks |
| UIR-10 | P1: Battle HUD | Tasks | In Tasks |
| UIR-11 | P1: Battle HUD | Tasks | In Tasks |
| UIR-12 | P1: Battle HUD | Tasks | In Tasks |
| UIR-13 | P1: Hero screens | Tasks | In Tasks |
| UIR-14 | P1: Hero screens | Tasks | In Tasks |
| UIR-15 | P2: Main menu and preloader | Tasks | In Tasks |
| UIR-16 | P1: Skill thumbnails without magenta | Tasks | In Tasks |
| UIR-17 | P3: Painted textures | Tasks | In Tasks |
| UIR-18 | P1: Review screenshots | Tasks | In Tasks |
| UIR-19 | P1: Round auto click button and its window | Tasks | In Tasks |

**Coverage:** 19 total, 19 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] The ui-artist review of the `ui:shots` screenshots (desktop and phone) finds every screen in the Grove theme and no magenta.
- [ ] `cd game && npm test` and `cd game && npx playwright test` pass, with `e2e/uiRedesign.spec.js` added.
- [ ] The 15 skill images total under 2 MB (today about 36 MB; a trial cut at quality 88 gave 0.96 MB).
