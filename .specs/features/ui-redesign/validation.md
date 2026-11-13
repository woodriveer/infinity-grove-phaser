# Validation: ui-redesign - FAIL

**Date**: 2026-11-13
**Spec**: `.specs/features/ui-redesign/spec.md` (UIR-01 to UIR-19, 105 numbered ACs, 10 testable edge cases)
**Design**: `.specs/features/ui-redesign/design.md`
**Diff range**: `5d98b6f..a9945af` on `main` (46 commits, first `70e9030`; HEAD at dispatch `a9945af`)
**Verifier**: independent sub-agent, not the author of any code or test of this feature

**Verdict**: FAIL. Five spec-defined behaviours have surviving mutants or no test, one AC is uncovered, and one "centred" criterion has no test. The suites are green: no failing test and no flake.

---

## Summary

| Check | Outcome |
| --- | --- |
| Unit (`cd game && npm test`) | 71 files, 1530 passed, 0 failed |
| Build (`cd game && npm run build`) | vite build succeeded (`built in 862ms`, output shows no error) |
| E2E (`cd game && npx playwright test --workers=2`) | 262 passed, 0 failed, 2 skipped (`game/e2e/heroAscension.spec.js:83` and `:92`, `test.fixme`, not part of this feature); 26.2 min; no failure, so no solo rerun was needed |
| Flakes | none |
| Backend | not run: no file under `backend/` changed in the range (`git diff --name-only 5d98b6f..HEAD -- backend` is empty) |
| Spec-anchored check | 105 ACs: 67 covered, 37 partial, 1 uncovered (UIR-19 AC17) |
| Edge cases | 11 testable: 10 covered, 1 partial (reduced motion of the map pulse, no test) |
| Discrimination sensor | 20 injections carrying 22 faults: 16 killed, 4 survived (one survivor carries three faults, see below) |
| Screenshots (UIR-18) | `npm run ui:shots -- uiRedesign` run in a scratch copy: exit 0, 66 files, names identical to the committed `ui-review/` set |
| Test integrity | 2 `it(` lines removed (renames), 144 test declarations added; removed assertions replaced by spec-backed values (see Gate check) |

---

## Task Completion

T1 to T38 are all marked `[x]` in `tasks.md`. Traceability hygiene (low): 27 unticked "Done when" boxes sit under 20 tasks marked done (T1 lines 145-146, T2 3 boxes, T3 2, T4 2, T5 3, T14 2, and one each in T6, T7, T8, T9, T10, T11, T12, T13, T15, T16, T17, T18, T19). Their evidence is in the suites and in this report, not in the boxes.

---

## Spec-Anchored Acceptance Criteria

Result key: C = every value the AC names is asserted by a test (or verified by an artifact the Verifier ran); P = one or more named values, or listed elements, are not asserted by any test; U = uncovered.

Evidence paths: `E` = `game/e2e/uiRedesign.spec.js`, `U` = `game/src/adapters/phaser/ClickerGame.test.js` (CT), `MM` = `MainMenu.test.js`, `PL` = `Preloader.test.js`, `EL` = `game/src/domain/combat/elements.test.js`.

### UIR-01 Grove theme foundation

| AC | Spec-defined outcome | Evidence (`file:line`, assertion) | Result |
| --- | --- | --- | --- |
| 1 | Cinzel 700 and Figtree 400/600/700/800 loaded, no Caprasimo | `E:147-148` (`family=Cinzel` requested, `Caprasimo` not requested); Figtree weights verified in `game/index.html:9` | C |
| 2 | Every palette token with exact value | `E:164-177` `expect(actual).toEqual(tokens)`; the 28 tokens match `design.md` § Palette | C |
| 3 | `--font-heading` is Cinzel; `.hero-title` starts with Cinzel | `E:150` `toMatch(/^"?Cinzel/)`, `E:171` token | C |
| 4 | Letterbox `rgb(28, 18, 12)` | `E:182` `background-color` of `body` | C |
| 5 | Texture token `none`: no `ui-parchment.jpg` or `ui-wood.jpg` request | `E:185-202`; discriminates: a hard-coded texture on `.hero-window` fails it (sensor M22, failing `E:186`) | C |
| 6 | Set texture is the top background layer of every parchment panel and wood frame | `E:205-216` asserts `.hero-window` only (parchment). Wood frame untested: sensor M01-M03 group survived partly through M03 (`style.css:77`, wood layer dropped) | P |

### UIR-02 Buttons

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 7 | Secondary recipe on the seven listed buttons | `E:219-229` asserts `Fechar` only (bg, 2px, border colour, colour, radius 999px) | P (1 of 7) |
| 8 | Primary recipe on the nine listed buttons | `E:233-241` `Fundir`, `E:244-252` `Login`; 7 listed buttons untested | P (2 of 9) |
| 9 | Hover `brightness(1.15)` on every enabled primary or secondary button | `E:255-265` `Fechar` only | P (sample) |
| 10 | Press `brightness(0.9)` on every enabled primary or secondary button | `E:255-265` `Fechar` only | P (sample) |
| 11 | Disabled button opacity 0.45 | `E:267-273` `auto-click-upgrade` | C |
| 12 | Coin discs 20 px, three gradient stops each | `E:276-282`: gold 20 px and first stop, silver and copper one stop each; other stops and silver/copper width not asserted | P |

### UIR-03 Focus, contrast, motion, ids

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 13 | Focus ring 3 px `rgb(204, 78, 26)`, offset 2 px | `E:284-302`; sensor M05 (offset 4 px) killed at `E:285` | C |
| 14 | Every pair of the design contrast table at least 4.5:1 | `E:304-341` covers rows 1-8 (ratios computed). Rows 10 (`.menu-tagline`), 13 (`.talent-effect`), 14 (`.hero-stars` 1-3 stars) have no colour pin in any test. The Verifier recomputed all 16 rows from the design values: 15 text pairs reach 4.5:1, focus pairs 3.15 and 3.63 | P |
| 15 | Restyled buttons, rail and timer: `animation-name: none`, `transition-duration: 0s` | `E:343-352` samples 4 elements (`hud-heroes`, `auto-click-button`, `boss-timer`, `hero-close`) | P (sample) |
| 16 | Test ids, classes, texts kept; suites pass with only listed values changed | Suites green (see Summary). Test-diff review: `accountReset.spec.js` change is listed in `tasks.md` T14 (line 1325); colour value changes are listed (`ClickerGame.test.js` damage and HP bar); `MainMenu.test.js` mock change is required by the oval test | C |

### UIR-04 Battle HUD plaques

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Stage plaque: bg, 3 px border, radius 6 px, Cinzel 700 19 px, text | `E:355-368` (all asserted, Cinzel via regex) | C |
| 2 | Chapter tag: bg, 2 px border, radius 4 px, Cinzel 700 16 px | `E:369-376`; border colour not asserted | P |
| 3 | Wallet is the plaque | `E:377` | C |
| 4 | Combo ember chip: bg, border colour, text, Cinzel 700 20 px | `E:385-390`; 2 px border width and font family not asserted | P |
| 5 | Stage message Cinzel 700 52 px, fill and 10 px stroke | `E:401-406`; font family and weight not asserted | P |
| 6 | Notice dark plaque: bg, 2 px border, text, Cinzel 700 22 px | `E:414-418`; border and font family not asserted | P |
| 7 | Scene coordinates unchanged except skill bar, farm, auto click | `E:994-1005` (skill bar 313-787, auto click 827-907, farm 911-991); `CT:207` farm at 951, 686; other HUD positions not asserted | P |

### UIR-05 Health bar and damage numbers

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 8 | HP bar 240 x 16, back `0x2a1410`, fill `0xc0392b` | `E:421-428`; `CT:296-300` colours; position not asserted | P |
| 9 | Framed box, two rings, gloss gradient, click-through | `E:430-434` (both rings, `pointer-events: none`); gloss not asserted | P |
| 10 | HP text Figtree 800 12 px, colour, 3 px stroke | `E:435-436` (text, weight 800, colour); size 12 px and stroke not asserted | P |
| 11 | Normal number: Cinzel 700 32 px `#ffd35c`, stroke `#2a1408` 8 | `E:444` (exact); `CT:1942-1947` | C |
| 12 | Critical number: Cinzel 700 48 px `#ff8a1f`, stroke `#2a1408` 8 | `E:452` (exact); `CT:1950-1956`; sensor M21 (48 to 44) killed at `CT` "draws a critical number" | C |

### UIR-06 Boss timer ring

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 13 | Timer text kept, dark pill, 2 px border, Cinzel 700 20 px, text colour, 32 px ring | `E:455-461` (bg, colour, 20 px, ring 32 px); border width and font family not asserted | P |
| 14 | `--timer-left` 3 decimals (1.000, 0.750, 0.000); ring fills the share in `rgb(232, 116, 42)` | Values exact at 30 s: `CT:1202-1215`, `CT:1217-1223`; e2e checks only a range `E:463-468`. Ring colour and share are not asserted by any test: sensor M01 (ring colour to gold), M02 (share 360 to 180 deg) survived. Survivor group also M03 | P (survivor) |
| 15 | Hidden: no `--timer-left`, not rendered | `E:503-511` (text empty, property empty); `CT:1236-1251`; "not rendered" (`display: none`) not asserted | P |

### UIR-07 Enemy chips

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 16 | `data-element` and dot colour of FIRE, WATER, NATURE, LIGHT, DARKNESS | `E:514-551` (five dot colours exact, `data-element` `E:520`) | C |
| 17 | Physical, magical, crit icons 12 px and their colours | `E:523-526` | C |
| 18 | Dark chip `rgba(28, 18, 12, 0.85)`, 1 px border, text colour | `E:519`, `E:530-535` (bg, border colour, text colour); 1 px width not asserted | C |
| 19 | Enemy line text unchanged | `E:517` exact text | C |

### UIR-08 Weak element chip

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | FIRE shows `Fraco: Água` | `E:554-560`; `CT:2049-2054` | C |
| 2 | WATER shows `Fraco: Natureza` | `E:554-560`; `CT:2056-2061` | C |
| 3 | NATURE shows `Fraco: Fogo` | `E:554-560`; `CT:2063-2068` | C |
| 4 | LIGHT and DARKNESS: chip empty, not rendered | `E:567-575`; `CT:2070-2080`; sensor M09 (remove `:empty` hide) killed at `E:569` | C |
| 5 | Emptied in the same call when the line is cleared | `CT:2082-2104` (monster dies, boss times out, chapter complete); no e2e | C (unit only) |
| 6 | Centred above the enemy line, `data-element`, dark chip with dot | `data-element` `E:560`, dot `E:561-563`; "centred" not asserted anywhere (sensor M-centring not run, no test to kill it) | P (spec precision, see gaps) |
| 7 | Chip box does not overlap bar or rail | `E:577-589` | C |

### UIR-09 Hero rail

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 20 | Parchment strip, 3 px border, radius 10 px, seven buttons, order and ids unchanged | `E:591-603` (bg, border width, radius, ids and order); border colour not asserted | P |
| 21 | Button 76 x 60, dark frame, 2 px border, icon colour, label Figtree 700 11 px, 6 px gaps, no overflow | `E:604-618` (size, bg, border colour, radius, colour, icon colour, `scrollWidth <= clientWidth`); 2 px width, label font, gaps not asserted | P |
| 22 | Ember badges `rgb(232, 116, 42)`, 2 px ring, talents count colour | `E:621-626` (bg, text colour); ring not asserted | P |

Edge (label `Equipamento` fits): `E:603-610` `scrollWidth <= clientWidth` for every rail button. Covered.

### UIR-10 Battle bar

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 23 | Bar 984 x 124, radius 12 px, parchment | `E:631-632` | C |
| 24 | Leader card 240 x 104, frame, 72 px portrait in 3 px ring, name Cinzel 700 15 px, two lines max, bonus Figtree 600 12 px | `E:633-637`, `E:657-682` (five heroes: name fits, height at most 34 px, card size); line-height, bonus font and 2 px border not asserted | P |
| 25 | Skill frame 150 x 62, 2 px border, radius 8 px, bg, unlocked ring | `E:639-648` | C |
| 26 | Key badge 20 x 20, bg, 1 px border, Cinzel 700 12 px, letter colour | `E:649-654`; 1 px border and font not asserted | P |
| 27 | Lock mark 32 px circle, `rgba(28, 18, 12, 0.85)`, gold lock | `E:684-691`; 32 px not asserted | P |
| 28 | AD-020 level badge and star colours kept | pre-existing `game/e2e/heroAscension.spec.js:72` (`rgb(217, 165, 33)`), `:134` (`rgb(122, 63, 160)`), `:157`; pass in this run | C |

Edge (skill image fails, dark frame): `E:693-698` `rgb(28, 18, 12)`. Covered.

### UIR-11 Farm switch and auto click colour

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 29 | Auto click window 240 px, radius 10 px, tail, switch off `rgb(61, 42, 28)` / 1 px border / on `rgb(63, 143, 58)`, primary buttons | `E:700-711` (width, radius, bg, switch on and off, upgrade colour); tail and 1 px border not asserted; reset primary not asserted | P |
| 30 | Farm 56 px round, skull `rgb(224, 180, 90)`, bg, 3 px ring, label Figtree 700 12 px | `E:1007-1015` (size, bg, 3 px, ring colour, 12 px, colour, `Farm boss`); skull colour not asserted | P |
| 31 | Ring `rgb(232, 116, 42)` with glow when on | `E:1017-1019`; sensor M07 (ring to gold) killed at `E:1007` | C |

### UIR-12 Dim layer and cards

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 32 | Dim `rgba(28, 18, 12, 0.62)` behind pause, reset, hero screens | `E:1046`, `E:1054` (`.hero-panel`), `E:1063` | C |
| 33 | Pause and reset cards 420 px, radius 12 px, `Paused` Cinzel 700 40 px `rgb(42, 26, 16)` | `E:1047-1050`, `E:1064-1065`; title weight 700 not asserted (family only) | P |

Edge (fight keeps running behind a hero screen): `E:1033-1039`. Covered.

### UIR-13 Hero screens

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Window 920 px, radius 12 px, parchment, 3 px border | `E:1068-1079` | C |
| 2 | Title Cinzel 700 30 px `rgb(42, 26, 16)` | `E:1080` (size, colour); weight 700 not asserted | P |
| 3 | Error line ember `rgb(138, 53, 16)`, text | `E:1117-1126` | C |
| 4 | Inset recipe on every inner card kind | `E:1081-1086` one hero card only | P (sample) |
| 5 | Portrait vignette `radial-gradient(circle at 50% 45%, #5a3d26, #1c120c)` | `E:1087-1088` checks `radial-gradient` and `rgb(90, 61, 38)`; `#1c120c` stop and detail portrait not asserted | P |
| 6 | Star tiers AD-020 colours | `E:1128-1134` (4-6 stars; 7-9 stars bg and text) | C |
| 12 | Líder rows: name Cinzel 18 px `rgb(42, 26, 16)`, current row and others | `E:1136-1151` (colour, 18 px, backgrounds, ratio) | C |
| 13 | Five hero cards equal width and portrait height; names inside the card | `E:1091-1115` | C |

### UIR-14 Equipment, skill tooltip, talents, map, wheel

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 7 | Equipment tiles `rgb(43, 29, 20)`, rarity frames, gems, effects, drag and selection kept | `E:1154-1160` (tile bg); the state behaviour is in the existing suites (`game/e2e/equipment.spec.js`, `game/src/rarityFrames.test.js`, pass) | C |
| 8 | Piece and skill tooltips parchment, radius 8 px, 2 px border `rgb(90, 61, 38)` | `E:1161-1166`, `E:1173-1178` | C |
| 9 | Talent cards keep branch colours on `rgb(244, 230, 200)`, branch bar on the left | `E:1205-1210` (card bg), `E:1235` (`inset 4px` bar) | C |
| 10 | Map framed by 3 px wood ring and 2 px bronze ring, layout box 880 x 495 | `E:1238-1246` (both rings); layout box not asserted | P |
| 11 | Element wheel parchment, radius 10 px, Cinzel 700 title | `E:1249-1254` | C |
| 14 | Skill art 112 x 64 px, whole text inside tooltip box, skill row no bg/border/padding | `E:1181-1203` | C |
| 15 | Talent branch inks; buttons ink under text 5.90-6.02:1; titles at least 4.82:1 | `E:1212-1236` exact colours (ratio follows from them: Verifier computed 6.02, 5.96, 5.90, 5.95 on the button text and 4.82-4.92 on the card for the four inks); the test asserts at least 4.5, not the spec's stated range | C |

### UIR-15 Main menu and preloader

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Menu oval fill `0xead6ad`, 6 px stroke `0x5a3d26`, centre 170, 380, 700 x 1040 | `MM:444`, `MM:455`, `E:1257-1266` (exact) | C |
| 2 | Login field bg, 2 px border, text colour; focus border `rgb(204, 78, 26)` | `E:1268-1286` | C |
| 3 | Path panel parchment, each option an inset card | `E:1288-1299` (panel; first option only) | C |
| 4 | Preloader bar outline `0xe0b45a` 2 px, fill `0xe8742a` | `PL:36`, `PL:44`, `E:1301-1321` | C |
| 5 | Boot and preloader on `#1c120c`, no `preloader.png`, track `0x2b1d14` | `E:1323-1348` (background, no Image child, track rectangle, no request); `PL:61-62` | C |

### UIR-16 Skill thumbnails

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | At most 0.1 % pixels with `min(R, B) - G >= 110` in each of the 15 files | `E:1356-1371` (five heroes, 3 skills each, all 15 files drawn and read back) | C |
| 2 | Same names, `.jpg`, 512 px tall, aspect within 1 px, corner within 12 of `#1c120c` | Verifier check of the 15 files (Pillow): all JPEG, height 512, width within 1 px of the aspect of `art/<name>.jpg`, corner (27, 18, 11) on every file (max deviation 1). Total size 956,763 bytes (under 2 MB) | C (artifact, not automated) |
| 3 | Drawn skill images below the threshold (bar, detail, bag, tooltip) | `E:1350-1354`, `E:1356-1371`, `E:1373-1386` | C |
| 4 | `cutout_hero.py ... --height 512 --background 1c120c` writes an RGB JPEG of the whole frame | Verifier ran the command into a scratch file: 512 x 512 RGB JPEG; the committed `game/public/assets/heroes/lyra_double_shot.jpg` is byte-identical to that output (`cmp`). Tool code `art/tools/cutout_hero.py:63-72` | C (artifact, not automated) |
| 5 | Without `--background`: transparent PNG cropped to the hero | Verifier ran it into scratch: PNG RGBA 485 x 512, corner alpha 0. Code `art/tools/cutout_hero.py:68` (`crop`) | C (artifact, not automated) |

### UIR-17 Prompts

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `PROMPTS_ASSETS_UI.md` section `5. Texturas da interface`, two prompts with path and the exact `style.css` line | `PROMPTS_ASSETS_UI.md:305-338`; table lines `--texture-parchment: none;` and `--texture-wood: none;` | C (document) |

### UIR-18 Review screenshots

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `npm run ui:shots -- uiRedesign` writes the design's screenshots for desktop and phone | Verifier ran it in a scratch copy: exit 0, 66 files, names identical to `.specs/features/ui-redesign/ui-review/` (33 names x 2 projects), all PNG readable. Design list `design.md` § Review Screenshots | C (run) |

### UIR-19 Round auto click button and window

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Round button 56 px centred at (867, 686), bg, 3 px ring, icon colour | `E:713-720` (56 x 56, bg, icon image), `CT:3955-3961` (centre 867, 686); ring width and icon colour not asserted | P |
| 2 | Key badge `A` 20 x 20 top left, label `500 ms` / `250 ms` | `E:721-723`, `E:742-746`, `CT:3955-3968`; top-left position not asserted | P |
| 3 | Locked: button, label, window not rendered; no old card | `E:748-756`, `CT:4105-4113` | C |
| 4 | On: ring `rgb(95, 211, 90)`, glow `0 0 14px 4px` | `E:758-763`; sensor M06 (glow 4 to 2 px) killed at `E:758` | C |
| 5 | Off: bronze ring, no glow | `E:769-770` | C |
| 6 | Activation opens window, `aria-expanded` true, focus to switch | `E:773-781` (click), `E:790-797` (Enter), `E:799-806` (Space); `CT:3986-3995` | C |
| 7 | Window holds switch, interval, crystals, upgrade, reset in order with today's text | `E:808-818`; `CT:3997-4004` | C |
| 8 | `A` with window closed opens it | `E:821-827`; `CT:4006-4021` | C |
| 9 | `A`, Escape or button with window open closes it; `aria-expanded` false; focus back | `E:829-833`, `E:846-854`, `E:861-868`; `CT:4006-4021`, `CT:4023-4032` | C |
| 10 | Escape closes the window without opening the pause menu; second Escape opens it | `E:846-859`; `CT:4034-4046`; sensor M17 (remove Escape branch) killed at `CT:4034` | C |
| 11 | Press outside closes the window; press acts as today | `E:871-884` (hit lands), `CT:4048-4057` | C |
| 12 | `A` in a text field does nothing (input other than checkbox, radio, button; textarea; select; contenteditable) | `E:925-942` and `CT:4069-4077` cover `input[type=text]` only. Sensor M15 removed `textarea, select, [contenteditable]` from the guard: survived in unit and e2e subset | P (survivor) |
| 13 | Repeat of a held `A` does nothing | `E:836-844`, `CT:4079-4085`; sensor M18 (repeat guard removed) killed at `CT:4079` | C |
| 14 | `A` does nothing while pause, reset dialog, hero screen or auto click locked is up | pause `E:915-923`, `CT:4087-4094`; hero `E:903-913`, `CT:4096-4103`; locked `E:753`, `CT:4105-4113`. Reset dialog not covered: sensor M14 (reset guard removed) survived in unit and e2e subset | P (survivor) |
| 15 | Focus stays on the control with the same test id when the window re-renders | `E:1022-1031`, `CT:4115-4123` | C |
| 16 | Reset button closes the window and opens the dialog | `E:944-952`, `CT:4125-4134` | C |
| 17 | Lock with the window open closes the window | no test. Sensor M16 (`showAutoClick` close branch removed) survived in unit and e2e subset | U (survivor) |
| 18 | Button and window `aria` attributes and ids | `E:773-787`, `CT:4136-4145` | C |
| 19 | Click on button or window does not hit the monster | `E:886-901` (hit counter 0) | C |
| 20 | Key `A` bound to nothing else (keys 1, 2, 3, Q, W, E, Esc) | `CT:4147-4153` (exact key list) | C |
| 21 | Boxes of skill bar, auto click, farm, leader, rail and bar edges do not overlap; window inside scene and left of rail | `E:964-992`, `E:994-1005` | C |
| 22 | Phone 390 px: button, badge, label, window scaled and inside scene | `E:1392-1408` (`tap`, 56/1024 width, left at scene x 663 or more, top at 400 or more) | C |

Edges of UIR-19 (both covered): window grows upward for the reset button and ends 10 px above the button, `E:954-962`; the window on phone stays inside the scene, `E:1406-1407`.

### Edge cases (spec § Edge Cases)

| Edge | Evidence | Result |
| --- | --- | --- |
| UIR-01: Google Fonts request fails, headings fall back to Georgia | `E:153-161` | C |
| UIR-10: skill image fails, dark frame | `E:693-698` | C |
| UIR-06: countdown extended, computed against the extended limit, never above 1.000 | `CT:1225-1234`; sensor M11 (limit hard-coded to 30 000) killed at `CT:1225` | C |
| UIR-06: countdown run out, reads 0.000, never negative | `E:471-501`, `CT:1217-1223` | C |
| UIR-08: LIGHT or DARKNESS, chip empty | `E:567-575`, `CT:2070-2080` | C |
| UIR-12: hero screen opens over a running fight, dim layer only | `E:1033-1039`, `E:1054` | C |
| UIR-09: longest rail label fits | `E:603-610` | C |
| UIR-03: reduced motion keeps EPIC and LEGENDARY tiles still | `game/src/rarityFrames.test.js:32-41` | C |
| UIR-03: reduced motion keeps the map pulse off | the `@media (prefers-reduced-motion: reduce)` block for `.map-node[data-state="current"]` (`game/public/style.css:2762-2767`) has no test | P |
| UIR-19: window on phone stays inside the scaled scene | `E:1406-1407` | C |
| UIR-19: reset button shows, window grows upward | `E:954-962` | C |
| UIR-16: purple effects near the chroma key | accepted by the spec; ui-artist review, not testable | n/a |

---

## Discrimination Sensor

Isolation: a copy of `HEAD` (`git archive HEAD game`) in the session scratchpad, with `node_modules` linked by junction and the dev-server ports moved off 5174 and 5175. Each injection replaced one anchor that matched exactly once, ran the targeted suite and restored the file from the pristine copy. Baselines passed before the injections (`BASE-css`, `BASE-js`). Each killed mutant was rerun with its full output saved; the names below come from that output.

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M01 | `game/public/style.css:680` | Timer ring colour `--ember-500` to `--gold-400` | Survived (group with M02, M03; full `uiRedesign.spec.js` passed) |
| M02 | `game/public/style.css:680` | Timer ring share `360deg` to `180deg` | Survived (group) |
| M03 | `game/public/style.css:77` | Wood texture layer removed from `--frame-bg` | Survived (group) |
| M04 | `game/public/style.css:72` | Parchment texture moved below the gradient | Killed by `uiRedesign.spec.js:206` |
| M05 | `game/public/style.css:123-124` | Focus outline offset 2 to 4 px | Killed by `uiRedesign.spec.js:285` |
| M06 | `game/public/style.css:885` | Auto click glow 4 to 2 px spread | Killed by `uiRedesign.spec.js:758` |
| M07 | `game/public/style.css:860-862` | Farm switch ring on to gold | Killed by `uiRedesign.spec.js:1007` |
| M08 | `game/public/style.css:1339` | Error line background `--ember-800` to `--ember-700` | Killed by `uiRedesign.spec.js:1117` |
| M09 | `game/public/style.css:542-544` | `.weak-chip:empty { display: none }` removed | Killed by `uiRedesign.spec.js:569` (LIGHT and DARKNESS) |
| M10 | `game/src/adapters/phaser/ClickerGame.js:823` | `--timer-left` written with 2 decimals | Killed by `ClickerGame.test.js` 1202, 1208, 1217, 1225 |
| M11 | `ClickerGame.js:823` | Ratio divided by 30 000 instead of the current limit | Killed by `ClickerGame.test.js:1225` (extended limit) |
| M12 | `ClickerGame.js:802` | `clearEnemyStats` no longer empties the weak chip | Killed by `ClickerGame.test.js` "monster dies" and "boss runs out of time" |
| M13 | `game/src/domain/combat/elements.js:67` | `weaknessOf` searches `=== WEAK` instead of `=== STRONG` | Killed by `elements.test.js:43`, `:47`, `:51` |
| M14 | `ClickerGame.js:341` | `A` guard without the reset-dialog check | Survived in unit (373 tests) and in e2e subset (`autoClick`, `accountReset`, `uiRedesign` filtered) |
| M15 | `ClickerGame.js:87` | `isTextField` without `textarea`, `select`, `contenteditable` | Survived in unit and e2e subset |
| M16 | `ClickerGame.js:288` | `showAutoClick` no longer closes the window when locked | Survived in unit and e2e subset |
| M17 | `ClickerGame.js:512-516` | Escape branch closing the open window removed | Killed by `ClickerGame.test.js:4034` |
| M18 | `ClickerGame.js:341` | Repeat guard of `A` removed | Killed by `ClickerGame.test.js:4079` |
| M19 | `game/src/adapters/phaser/Preloader.js:17` | Track colour `0x2b1d14` to `0x2b1d15` | Killed by `Preloader.test.js` "fills the track of the loading bar in dark wood" |
| M20 | `game/src/adapters/phaser/MainMenu.js:9` | Oval rim 6 px to 4 px | Killed by `MainMenu.test.js` "gives the menu oval a 6 px dark wood rim" |
| M21 | `ClickerGame.js:61` | Critical font size 48 to 44 | Killed by `ClickerGame.test.js` "draws a critical number in Cinzel 700 with the same outline" and "doubles the damage ... orange" |
| M22 | `game/public/style.css` (appended rule on `.hero-window`) | Parchment texture hard-coded while its token is none | Killed by `uiRedesign.spec.js:186` (AC5 discriminates) |

**Sensor depth**: expanded, 20 injections and 22 faults (the lead asked for at least 10 behaviour-level faults), covering the timer ring, enemy chips, weak chip, auto click window, key `A`, menu, preloader and `weaknessOf`.
**Killed**: 16 of 22 faults (16 of 20 injections). **Survived**: 6 faults in 4 injections (M01-M03 as one injection carrying three faults, M14, M15, M16).
**Outcome**: FAIL for this sensor; survivors become the fix tasks below.

---

## Gate Check

- **Gate commands**: `cd game && npm test`, `npm run build`, `npx playwright test --workers=2`
- **Unit**: 71 files, 1530 passed, 0 failed
- **E2E**: 262 passed, 0 failed, 2 skipped (`heroAscension.spec.js:83` and `:92`, `test.fixme`, pre-existing); no flake, no solo rerun needed
- **Test count before feature**: not measured (no run at `5d98b6f`). Declarations added in the range: 144 `it(`/`test(` lines (static count)
- **Test integrity**: removed lines in `game/src/**/*.test.js` and `game/e2e/*.js`: 2 `it(` lines renamed (`ClickerGame.test.js`, damage colour tests), `accountReset.spec.js` `auto-click-toggle` visible became `auto-click-button` visible (listed in `tasks.md` T14, line 1325, because the reset closes the window), colour value changes listed in tasks, and `elements.test.js` import line extended with `weaknessOf`. No assertion was deleted without a spec-backed replacement.
- **Skipped tests**: 2, both `test.fixme` in `heroAscension.spec.js` (not part of this feature).
- **Backend**: not run, no change in range.

---

## Real tree isolation

Pre-sensor baseline taken at 16:51 (`git status --porcelain`, 902 lines). After the sensor and the screenshot run:
- Tracked status lines are identical (10 lines, all owner files); `git diff --stat HEAD -- game` is empty.
- Untracked entries grew by 18 between the baseline and the check at 18:09, all under `game/public/assets/`: 17 talent art files and one Gemini image. Twelve talent files carry modification times 16:13 to 16:29, before the baseline was taken; five (`talent-break-crit-g2.png`, `talent-crit-chance-g2.png`, `talent-crit-chance-g3.png`, `talent-crit-damage-g2.png`, `talent-break-crit-g3.png`) carry 17:53, during the sensor. A later listing showed the owner's set still changing (the Gemini file and one talent file were gone), so the owner is adding and replacing art in this tree during the session. The sensor and the shots write only under the scratchpad; the Vite config has no copy step; no e2e helper writes assets. Nothing in this run wrote those files, and the Verifier neither staged nor modified them.

---

## Requirement Traceability (proposed; spec.md not edited by the Verifier)

| Requirement | Previous status | Proposed status |
| --- | --- | --- |
| UIR-01 | In Tasks | Needs Fix (AC6 wood layer) |
| UIR-02 | In Tasks | Needs Fix (named buttons) |
| UIR-03 | In Tasks | Needs Fix (contrast rows 10, 13, 14) |
| UIR-04 to UIR-05, UIR-07, UIR-09 to UIR-15 | In Tasks | Partial (named values not asserted) |
| UIR-06 | In Tasks | Needs Fix (ring colour and share) |
| UIR-08 | In Tasks | Partial (AC6 "centred") |
| UIR-16, UIR-17, UIR-18 | In Tasks | Verified (artifact checks above) |
| UIR-19 | In Tasks | Needs Fix (AC17 uncovered; AC12 and AC14 survivors) |

---

## Gaps (ranked) and proposed fix tasks

1. **UIR-19 AC17: the window stays drawn as open when the auto click becomes locked.** `game/src/adapters/phaser/ClickerGame.js:288-291`; sensor M16 survived in unit and e2e. Fix: in `ClickerGame.test.js` after line 4125, open the window, set the scene to locked (`autoClickOpen = false`), call `showAutoClick()`, expect `popover(ctx).hidden === true` and `aria-expanded === 'false'`. Priority: Major.
2. **UIR-19 AC14: `A` opens the window behind the reset dialog.** `ClickerGame.js:341`; sensor M14 survived. Fix: unit test after line 4103: `openResetDialog()` then `press(ctx, 'A', { repeat: false, target: document.body })` expects `popover(ctx).hidden === true`; add the same case to `uiRedesign.spec.js` (open reset dialog from the window's reset button, then press `a`). Priority: Major.
3. **UIR-19 AC12: text-field guard names four element types, only `input` is tested.** `ClickerGame.js:87`; sensor M15 survived. Fix: unit cases in `ClickerGame.test.js` after line 4077 for a `textarea`, a `select` and a `contenteditable` div as the target, each expecting the popover hidden. Priority: Major.
4. **UIR-06 AC14: the timer ring colour and share are not asserted.** `game/public/style.css:680`; sensor M01, M02 survived. Fix: in `uiRedesign.spec.js` after line 469, read `getComputedStyle(.boss-timer, '::before').backgroundImage`: it contains `rgb(232, 116, 42)` and the conic stop equals `calc(share * 360deg)` for a `--timer-left` of `0.750` (`270deg`). Priority: Major.
5. **UIR-01 AC6: the wood frame's texture layer is not asserted.** `game/public/style.css:77`; sensor M03 survived. Fix: in `uiRedesign.spec.js` after line 216, add `--texture-wood: url("assets/ui-wood.jpg")` and check the background image of a wood frame (for example `.boss-timer`, `.leader-card`) starts with `url(` and contains `ui-wood.jpg`. Also check a second parchment panel (for example `.pause-card`), not only `.hero-window`. Priority: Major.
6. **UIR-03 AC14: contrast rows 10 (`.menu-tagline`), 13 (`.talent-effect`), 14 (`.hero-stars` 1-3 stars) have no colour pin.** Fix: add the three rows to the table test at `uiRedesign.spec.js:304-341` with the design's colours and ratio ≥ 4.5. Priority: Major (contrast is a stated goal).
7. **UIR-08 AC6: "centred above the enemy line" has no test and no tolerance.** Spec precision gap: the spec names no tolerance. Fix: decide a tolerance in the spec (for example chip centre within 2 px of the enemy line centre), then add it to the e2e test at `uiRedesign.spec.js:577-589`. Priority: Minor.
8. **Named values and listed elements not asserted (37 partial ACs).** One assertion per missing value: UIR-02 AC7-10 and AC12 (other buttons, hover and press on primary, coin stops and widths); UIR-03 AC15 (more elements); UIR-04 AC2, AC4-7 (border colours, Cinzel weights, combo and notice fonts); UIR-05 AC8-10 (position, gloss, 12 px and 3 px stroke); UIR-06 AC13, AC15 (border width, font, `display: none`); UIR-09 AC20-22 (border colour, 2 px, label font, gaps, ring); UIR-10 AC24, AC26, AC27 (line-height, bonus font, key border and font, 32 px lock circle); UIR-11 AC29-30 (tail, reset primary, skull colour); UIR-12 AC33 and UIR-13 AC2 (weight 700); UIR-13 AC4-5 (other inset containers, detail portrait, `#1c120c` stop); UIR-14 AC10 (map layout box); UIR-19 AC1-2 (ring width, icon colour, top-left badge position). Priority: Minor each.
9. **Reduced motion of the map pulse has no test.** `game/public/style.css:2762-2767`. Fix: `page.emulateMedia({ reducedMotion: 'reduce' })` in `uiRedesign.spec.js` and assert `.map-node[data-state="current"]` has `animation-name: none`. Priority: Minor.
10. **Tasks hygiene.** 27 unticked "Done when" boxes under 20 tasks marked `[x]` in `tasks.md`. Fix: tick them with the evidence or remove them. Priority: Cosmetic.

Not caused by the feature: none. The two `test.fixme` in `heroAscension.spec.js` are pre-existing skips.

---

## Summary

**Overall**: Not Ready (FAIL)

**Spec-anchored check**: 67 of 105 ACs covered; 37 partial; 1 uncovered (UIR-19 AC17). Edge cases 9 of 10 covered (map pulse reduced motion partial).
**Sensor**: 16 of 22 faults killed; 6 survived (M01-M03 group, M14, M15, M16).
**Gate**: unit 1530 passed, e2e 262 passed, 2 skipped (pre-existing), 0 failed, build ok.
**E2E visible ACs**: 98 of 100 player-visible ACs have an e2e scenario; UIR-08 AC5 is unit-only (`ClickerGame.test.js:2082-2104`), UIR-19 AC17 has none.

**What works**: the palette, fonts, buttons, HUD plaques, rail, battle bar, hero screens, menu and preloader, the magenta-free skill art (15 files, 956,763 bytes, verified by the suite and by the Verifier's file checks), the screenshots (66 files), and the D1 auto click window with its keys, focus and aria.

**Issues found**: items 1 to 6 of the ranked gaps (each has a test that would kill the survivor).

**Next steps**: route gaps 1 to 7 as fix tasks; re-run the sensor on M01 to M03, M14, M15, M16; re-verify (round 1 of 3).
