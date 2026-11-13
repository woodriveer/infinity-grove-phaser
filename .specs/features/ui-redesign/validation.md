# Validation: ui-redesign - FAIL (round 2 of 3)

**Date**: 2026-11-13
**Spec**: `.specs/features/ui-redesign/spec.md` (UIR-01 to UIR-19, 105 numbered ACs, 11 edge cases, 10 testable)
**Design**: `.specs/features/ui-redesign/design.md`
**Diff range**: `5d98b6f..2a74476` on `main` (whole feature). Round 2 delta: `aeea8bb..2a74476` (15 commits: 14 test or asset commits and `05d2c7e`, a spec amendment). Production files changed in the delta: none (`git diff --name-only aeea8bb..HEAD -- game/src game/public/style.css` lists only `*.test.js` and assets; `git diff --name-only a9945af9..HEAD` shows no production file either). Backend: no file changed in the whole range.
**Verifier**: independent sub-agent, round 2. It did not author any code or test of this feature.
**Evidence rule**: every number below comes from a command run in this round (suites, sensor, artifact checks). Line references are at `2a74476`.

---

## Verdict

FAIL. The suites are green and round 1's six surviving mutants and its uncovered AC are closed. The feature still fails on five points, ranked below:

1. A production gap against UIR-19 AC12: the `A` text-field guard misses `contenteditable=""` and `contenteditable="plaintext-only"` (`game/src/adapters/phaser/ClickerGame.js:87`). Two probe tests fail in the scratch tree.
2. Five injections survive on spec-defined behaviour (border width and style of the enemy chip, the border style of the panels, the radio exclusion of the `A` guard, and the hover of the window's reset and upgrade buttons).
3. 26 of 105 ACs have at least one value the spec states that no test asserts.
4. One spec-precision gap: `Click to Start!` is listed as a primary button (UIR-02 AC8) but renders as a non-interactive `<p>` (`game/src/adapters/phaser/MainMenu.js:57`).
5. Test hygiene from round 1 (27 unticked boxes in `tasks.md`) was not re-checked: `tasks.md` is out of this round's scope.

---

## Round 1 (verdict FAIL at `a9945af9`)

| Round 1 item | Closed by | State now |
| --- | --- | --- |
| UIR-19 AC17 uncovered (window stays open when the auto click locks) | `2f09fba` | Closed: `ClickerGame.test.js:4172` |
| UIR-19 AC14 survivor M14 (`A` opens the window behind the reset dialog) | `6ba6320` | Closed: `ClickerGame.test.js:4185`; sensor R1-M14 killed |
| UIR-19 AC12 survivor M15 (text-field guard names four types, one tested) | `af19ae3` | Closed for textarea, select, contenteditable="true", checkbox: `ClickerGame.test.js:4079, 4087, 4095, 4105`; sensor R1-M15 killed. New gap G1 below |
| UIR-19 AC17 survivor M16 (window not closed on lock) | `2f09fba` | Closed: sensor R1-M16 killed at `ClickerGame.test.js:4172` |
| UIR-06 AC14 survivors M01 (ring colour) and M02 (ring share) | `bd77ec4` | Closed: `uiRedesign.spec.js:685-696`; sensor R1-M01 and R1-M02 killed |
| UIR-01 AC6 survivor M03 (wood layer of the frame) | `b330320` | Closed: `uiRedesign.spec.js:240-249` and `251-259`; sensor R1-M03 killed |
| UIR-03 AC14 contrast rows 10, 13, 14 without a colour pin | `b037416` | Closed: `uiRedesign.spec.js:467-521` (rows 13 and 14 in the table test, row 10 in its own test) |
| UIR-08 AC6 spec-precision gap (no tolerance on "centred") | `05d2c7e` (spec amended) and `2a74476` (test) | Closed: spec gives 1 scene px; `uiRedesign.spec.js:806-824` |
| Reduced motion of the map pulse untested | `8173f65` | Closed: `uiRedesign.spec.js:1630-1642` |
| 37 partial ACs (named values not asserted) | `aa2001b`, `67ae6d0`, `591a8ca`, `267a171`, `b190de5`, `5c17c04` | Reduced to 26 partial ACs (section "Spec-anchored") |

---

## Summary

| Check | Result (this round) |
| --- | --- |
| Unit (`cd game && npm test`) | 71 files, 1536 passed, 0 failed (round 1: 1530) |
| Build (`cd game && npm run build`) | `vite build` built in 719 ms, exit 0 |
| E2E (`cd game && npx playwright test --workers=2`) | 281 passed, 0 failed, 2 skipped (`test.fixme`, `game/e2e/heroAscension.spec.js:83` and `:92`, pre-existing, not in this feature); 23.0 min; exit 0 |
| Flakes | none: no failing test in the full run, so no solo rerun was needed. The sensor reruns of the baseline were green each time (see sensor) |
| Backend (`cd backend && ./gradlew test`) | not run: no file under `backend/` changed in `5d98b6f..HEAD` (`git diff --name-only 5d98b6f..HEAD -- backend` is empty) |
| Spec-anchored check | 105 numbered ACs: 79 covered, 26 partial, 0 uncovered |
| Edge cases | 10 testable: 10 covered; 1 non-testable (purple effects, accepted by the spec, ui-artist review) |
| Discrimination sensor | 22 injections: 17 killed, 5 survived (`N10`, `N11`, `N12`, `N15`, `N16`). Round-1 survivors: 6 of 6 killed. New faults: 16 (11 killed, 5 survived) |
| Probe on a spec gap | 2 of 2 probe tests fail: the `contenteditable` guard does not match an empty or `plaintext-only` value |
| Screenshots (UIR-18) | `npm run ui:shots -- uiRedesign` in the scratch copy: exit 0, 10 tests passed, 66 PNG files, names identical to the 66 committed in `.specs/features/ui-redesign/ui-review/`, all readable |
| Artifacts (UIR-16 AC2, AC4, AC5) | run now: 15 JPEG files as specified, cutout tool output byte-identical to the committed `lyra_double_shot.jpg`, PNG mode without `--background` (see below) |
| Test integrity | `git diff aeea8bb..HEAD -- game/e2e game/src` (round 2 delta): only additions and one rename (`meets 4.5:1 on the eight contrast pairs` to `... (rows 1 to 8, 13 and 14)`). The one change that removes a value (`startAs` signature) only adds a parameter. No assertion was weakened: the `hud-heroes`-only quiet check became all seven rail buttons, and the `skill-key-1` width check became width and height |

---

## Spec-Anchored Acceptance Criteria

Result key: C = every value the AC states is asserted by a test or verified by an artifact run in this round; P = at least one value the spec states is asserted nowhere (the missing value is named); U = uncovered.

Evidence files: `E` = `game/e2e/uiRedesign.spec.js`, `CT` = `game/src/adapters/phaser/ClickerGame.test.js`, `PL` = `Preloader.test.js`, `MM` = `MainMenu.test.js`, `EL` = `game/src/domain/combat/elements.test.js`, `RF` = `game/src/rarityFrames.test.js`, `HR` = `game/src/domain/heroes/heroes.test.js`.

### UIR-01 Grove theme foundation (spec ACs 1 to 6)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 Cinzel 700, Figtree 400/600/700/800, no Caprasimo | C | `E:161-172` (Cinzel requested, Caprasimo not requested, hero title family); `game/index.html:9` (weights) | - |
| 2 every palette token, exact value | C | `E:184-198` (29 tokens, `toEqual`); `design.md:66-94` (29 rows, same values) | - |
| 3 `--font-heading` Cinzel, `.hero-title` starts with Cinzel | C | `E:171`, `E:192` | - |
| 4 letterbox `rgb(28, 18, 12)` | C | `E:200-204` | - |
| 5 no texture request while tokens are `none` | C | `E:206-224` | - |
| 6 set texture is the top layer of every parchment panel and wood frame | C | `E:226-238` (hero window), `E:251-259` (battle bar, second parchment panel), `E:240-249` (leader card, wood frame); one case per texture token | - |

### UIR-02 Buttons (spec ACs 7 to 12)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 7 secondary recipe on the seven named buttons | P | `WOOD_PILL` (`E:127`) on `E:297-303` (Sign up), `E:305-319` (Logout), `E:321-329` (Voltar), `E:331-342` (pause leave and confirm), `E:357-366` (reset confirm), `E:368-381` (equip and sell); `E:261-271` (Fechar) | `border-top-style: solid` of Fechar (`E:261-271`) |
| 8 primary recipe on the nine named buttons | P | `EMBER_PILL` (`E:128`) on Login `E:286-295`, Click to Start `E:305-319`, Continue and No stay `E:344-355`, Cancelar `E:357-366`, Refinar `E:368-381`, bag and bulk `E:383-399`; Fundir `E:274-284` | `border-top-style: solid` on all nine (`EMBER_PILL` has no style); Fundir `2px` border width (`E:274-284`) |
| 9 hover `brightness(1.15)` on every enabled primary or secondary button | P | `expectHoverShade` (`E:132-135`) on `E:274-284`, `E:297-303`, `E:305-319`, `E:321-329`, `E:331-355`, `E:357-366`, `E:383-399`; Fechar `E:401-412` | Not asserted: `reset-account` and `auto-click-upgrade` (window buttons, UIR-11 AC29 names them primary; sensor N15, N16 survived); Click to Start (see spec-precision gap) |
| 10 press `brightness(0.9)` on every enabled primary or secondary button | P | `expectShades` (`E:137-143`) on `E:274-284`, `E:297-303`, `E:305-319`, `E:321-329`, `E:331-355`, `E:357-366`, bag `E:383-389`; hover only on `E:368-381` and `E:398` | Press not asserted on Refinar, equip piece, sell piece, bulk confirm (`E:368-398`), `reset-account`, `auto-click-upgrade`, Click to Start |
| 11 disabled button keeps opacity 0.45 | C | `E:414-420` | - |
| 12 coin discs 20 px, three metallic stops | P | `E:422-445`: 20 px (`E:425`, `E:431-432`); three stop colours for each coin (`E:433-444`) | `radial` gradient type of the three coins asserted nowhere |

### UIR-03 Focus, contrast, motion, ids (spec ACs 13 to 16)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 13 focus ring 3 px `rgb(204, 78, 26)`, offset 2 px | C | `E:447-465` (style solid, 3 px, colour, offset 2 px) | - |
| 14 every pair of the design contrast table at least 4.5:1 | C | `E:467-513` (rows 1 to 8, 13, 14, with ratios); `E:515-521` (row 10); `E:1502-1508` (row 9 colour); `E:565-580` (row 12); `E:742-764` (row 11); `E:877-884` (row 15). Verifier recomputed the 15 text pairs from `design.md:104-120`: lowest 4.51 (row 14), all at least 4.5; focus 3.15 and 3.63 (`design.md:121`) | - |
| 15 restyled buttons, rail and timer: `animation-name: none`, `transition-duration: 0s` | P | `E:523-536` (seven rail buttons, auto click button, timer, hero close) | The other restyled primary and secondary buttons (for example `.fusion-button`, `.equip-button`, `.pause-leave`, `.auth-actions`): no test pins them |
| 16 ids, classes, texts kept; suites pass with only listed values changed | C | Suites green (Summary); round 2 test diff only adds assertions | - |

### UIR-04 Battle HUD plaques (spec ACs 1 to 7)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 stage plaque | P | `E:538-551` (bg, 3 px, colour, radius 6, Cinzel 700 19 px, text) | `border-top-style: solid` |
| 2 chapter tag | C | `E:552-561` | - |
| 3 wallet is the plaque | P | `E:562` (same object as AC1) | `border-top-style: solid` |
| 4 combo ember chip | C | `E:565-580` | - |
| 5 stage message Cinzel 700 52 px, fill and 10 px stroke | C | `E:582-598` | - |
| 6 notice dark plaque | C | `E:600-615` | - |
| 7 scene coordinates kept except skill bar, farm, auto click | P | `E:1288-1299` (skill bar 313..787, auto click 827..907, farm 911..991, each +-1 scene px); `E:617-624` (HP bar x 550, y 281, same as the pre-redesign formula: `MONSTER` and `HEALTH_BAR` constants unchanged since `5d98b6f`); `E:1301-1324` (leader card, bar, rail) | Positions of `stage-hud`, `chapter-hud`, `wallet`, `combo-hud`, boss timer and the enemy line: no test |

### UIR-05 Health bar and damage numbers (spec ACs 8 to 12)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 8 HP bar 240 x 16, back `0x2a1410`, fill `0xc0392b`, position | C | `E:617-624` (`fill`, `back`, `width`, `height`, `x` 550, `y` 281) | - |
| 9 framed box, two rings, gloss gradient, click-through | C | `E:626-632` | - |
| 10 HP text Figtree 800 12 px, colour, 3 px stroke | C | `E:633-641` | - |
| 11 normal number Cinzel 700 32 px `#ffd35c`, stroke `#2a1408` 8 | C | `E:644-650` (exact `lastText`) | - |
| 12 critical number Cinzel 700 48 px `#ff8a1f`, stroke `#2a1408` 8 | C | `E:652-658` (exact `lastText`) | - |

### UIR-06 Boss timer ring (spec ACs 13 to 15)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 13 timer text kept, dark pill, 2 px border, Cinzel 700 20 px, 32 px ring | C | `E:660-683` | - |
| 14 `--timer-left` with 3 decimals; ring fills the share in `rgb(232, 116, 42)` | C | `E:685-696` (colour and share: 270deg at 0.750, 360deg at 1.000); `E:698-728` (value pattern `\d.\d{3}`, never above 1); `CT:1202-1223` (1.000, 0.750, 0.000 exact) | - |
| 15 hidden: no `--timer-left`, not rendered | C | `E:730-740` (empty property, `display: none`); `CT:1236`, `CT:1245` | - |
| edge: extended countdown computed against the extended limit | C | `CT:1225-1234` | - |
| edge: run out reads 0.000, never negative | C | `E:698-728`; `CT:1217-1223` | - |

### UIR-07 Enemy chips (spec ACs 16 to 19)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 16 `data-element` and dot colour of the five elements | C | `E:766-779` (five dot colours, exact); `E:748` (data-element NATURE); `CT:2009-2021` (data-element WATER, DARKNESS) | - |
| 17 physical, magical, crit icons 12 px and colours | P | `E:751-754` (three colours; width 12 px at `E:752`, physical only) | 12 px width of the magical and crit icons |
| 18 dark chip, 1 px solid border, text colour | P | `E:745-764` (background `rgba(28, 18, 12, 0.85)`, border colour, text colour) | 1 px border width and `solid` style (sensor N10 survived) |
| 19 enemy line text unchanged | C | `E:745` (exact text) | - |

### UIR-08 Weak element chip (spec ACs 1 to 7)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 FIRE shows `Fraco: Água` | C | `E:782-793`; `CT:2049-2054` | - |
| 2 WATER shows `Fraco: Natureza` | C | `E:782-793`; `CT:2056-2061` | - |
| 3 NATURE shows `Fraco: Fogo` | C | `E:782-793`; `CT:2063-2068` | - |
| 4 LIGHT and DARKNESS: chip empty, not rendered | C | `E:795-803`; `CT:2070-2080` | - |
| 5 emptied in the same call when the line is cleared | C | `CT:2082-2106` (monster dies, boss times out, chapter complete) | - |
| 6 centred within 1 scene px, bottom at or above the line top, inside `.hud-enemy`, `data-element`, dark chip with dot | P | `E:806-824` (centre within 1 px, bottom above line top, inside `.hud-enemy`); `E:789-791` (dot colour); `E:788` (data-element) | Dark chip of `.weak-chip` (background `rgba(28, 18, 12, 0.85)`, 1 px bronze border): asserted nowhere |
| 7 chip box does not overlap the bar or the rail | C | `E:826-838` | - |

### UIR-09 Hero rail (spec ACs 20 to 22)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 20 parchment strip, 3 px border, radius 10 px, seven buttons, order and ids kept | C | `E:847-854` (bg, 3 px, colour, radius 10, ids and order); labels `E:860` | - |
| 21 button 76 x 60, dark frame, 2 px solid border, icon colour, Figtree 700 11 px, 6 px gaps, no overflow | C | `E:861-873` (size, no overflow, bg, 2 px, solid, colour, radius 6, Figtree 700 11 px, icon colour); gap `E:852` | - |
| 22 ember badges, 2 px dark ring, talents count colour | C | `E:877-884` (bg, text colour, ring); `style.css:1112` (`talents-badge`, the only rail badge in `game/src`) | - |

### UIR-10 Battle bar (spec ACs 23 to 28)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 23 bar 984 x 124, radius 12 px, parchment | C | `E:889-890` | - |
| 24 leader card 240 x 104, frame, 72 px portrait in 3 px ring, Cinzel 700 15 px, line-height 1.1, two lines at most, bonus Figtree 600 12 px | C | `E:891-907` (size, frame, 72 px, ring, name, line-height 16.5 px, bonus); `E:931-956` (five names fit, height at most 34 px, inside card) | - |
| 25 skill frame 150 x 62, 2 px solid border, radius 8, bg, unlocked ring | P | `E:909-918` (size, 2 px, colour, radius, bg, ring) | `border-top-style: solid` |
| 26 key badge 20 x 20, bg, 1 px border, Cinzel 700 12 px, letter colour | C | `E:919-928` | - |
| 27 lock mark 32 px circle, `rgba(28, 18, 12, 0.85)`, gold lock | C | `E:958-969` | - |
| 28 AD-020 level badge and star colours kept | C | `E:1502-1508`; pre-existing `game/e2e/heroAscension.spec.js:72`, `:134`, `:157` (passes in this run) | - |

### UIR-11 Farm switch and auto click colour (spec ACs 29 to 31)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 29 window 240 px, radius 10, tail, switch off and on colours, primary buttons | P | `E:978-995` (240 px, radius 10, bg, switch on `E:985`, off with 1 px border `E:987`, upgrade bg `E:988`, tail `E:990-994`); reset primary `E:1112` | Upgrade border colour `rgb(224, 180, 90)` and text colour `rgb(244, 230, 200)`; tail asserted to exist, not to point at the button |
| 30 farm switch 56 px round, skull colour, bg, 3 px ring, label Figtree 700 12 px | C | `E:1326-1338` (56 px, bg, 3 px solid, skull colour `E:1334`, label family, weight, size) | - |
| 31 ring `rgb(232, 116, 42)` with glow when on | C | `E:1339-1340` (ring, `rgba(232, 116, 42, 0.75) 0 0 12px 2px`) | - |

### UIR-12 Dim layer and cards (spec ACs 32 to 33)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 32 dim `rgba(28, 18, 12, 0.62)` behind pause, reset and hero screens | C | `E:1367`, `E:1375`, `E:1384` | - |
| 33 pause and reset cards 420 px, radius 12 px, `Paused` Cinzel 700 40 px | C | `E:1368-1371` (bg, radius, title 40 px, weight 700, colour, family); `E:1385-1386` (reset card bg, radius, 420 px) | - |

### UIR-13 Hero screens (spec ACs 1 to 6, 12, 13)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 hero window 920 px, radius 12, parchment, 3 px border | P | `E:1441-1452` (920 px, bg, 3 px colour, radius 12) | `border-top-style: solid` |
| 2 title Cinzel 700 30 px `rgb(42, 26, 16)` | C | `E:1453`; family `E:171` | - |
| 3 error line ember, text | C | `E:1491-1500` | - |
| 4 inset recipe on every inner card kind | P | `E:1389-1439` (INSET on hero card, skill row, fusion row, leader row, talent column, equip hero, leader stats, bulk sale bar, fusion empty, equipment empty) | Farm entries (`.farm-entry`, `style.css:1568-1586`): no test; they share a CSS rule with `.fusion-row` |
| 5 portrait on `radial-gradient(circle at 50% 45%, #5a3d26, #1c120c)` | P | `E:1460-1462`, `E:1624` (gradient, `rgb(90, 61, 38)`, `rgb(28, 18, 12)`) | Position `circle at 50% 45%` |
| 6 star tiers AD-020 colours | C | `E:1502-1508` (4-6 stars colour; 7-9 stars bg and text); tier boundaries `HR:156-157` (0 to 9 stars map to the classes) | - |
| 12 Líder rows: name Cinzel 18 px `rgb(42, 26, 16)`, current row and others backgrounds, ratio | P | `E:1510-1526` (colour, 18 px, backgrounds, ratio) | Cinzel family of `.leader-name` in the Líder rows |
| 13 five hero cards equal width and portrait height; names inside the card | P | `E:1465-1489` (equal sizes; names inside card; `.hero-name` 15 px at `E:1483`) | Cinzel family and weight 700 of `.hero-name` |

### UIR-14 Equipment, skill tooltip, talents, map, wheel (spec ACs 7 to 11, 14, 15)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 7 equipment tiles `rgb(43, 29, 20)`, rarity frames, gems and states kept | C | `E:1528-1541` (tile bg `E:1533`); states kept by the existing equipment suites (`game/e2e/equipment.spec.js`, passing) and `RF:32-41` | - |
| 8 piece and skill tooltips parchment, radius 8 px, 2 px border `rgb(90, 61, 38)` | P | `E:1535-1539` (piece tooltip); `E:1547-1552` (skill tooltip) | `border-top-style: solid` on both |
| 9 talent cards keep branch colours on `rgb(244, 230, 200)`, branch bar on the left | P | `E:1579-1584` (card bg); `E:1609` (branch bar of CRIT_CHANCE) | Branch bars of TIME, BREAK, POWER and COMBO cards |
| 10 map framed by a 3 px wood ring and an outer 2 px bronze ring, layout box 880 x 495 | C | `E:1612-1628` (rings `E:1617-1620`; box 880 x 495 `E:1623-1627`) | - |
| 11 element wheel parchment, radius 10 px, Cinzel 700 title | C | `E:1644-1650` | - |
| 14 skill art 112 x 64 px, whole text inside the tooltip, skill row without background, border or padding | P | `E:1555-1577` (art 112 x 64 `E:1567`; text inside `E:1570`; bg, border width, `padding-left` `E:1569`) | Skill row padding top, right and bottom; skill row border style |
| 15 talent branch inks; buttons ink under text 5.90-6.02:1; titles at least 4.82:1 | P | `E:1586-1610` (exact button bg and text, title colour, both for TIME, BREAK, POWER, COMBO; ratio at least 4.5 at `E:1601`, `E:1604`) | `Nível máximo` in the ink of BREAK, TIME, COMBO (only POWER, `E:1607`); the spec's ratio bounds (5.90-6.02, 4.82) are asserted as 4.5, the exact colours pin them |

### UIR-15 Main menu and preloader (spec ACs 1 to 5)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 menu oval fill `0xead6ad`, 6 px stroke `0x5a3d26`, 170, 380, 700 x 1040 | C | `E:1652-1661` (exact); `MM:439-455` | - |
| 2 login fields bg, 2 px solid border, text colour; focus border `rgb(204, 78, 26)` | P | `E:1663-1681` (bg, 2 px, colour, text colour, focus border `E:1680`) | `border-top-style: solid` |
| 3 path panel parchment, each option an inset card | C | `E:1683-1694` (panel bg; first option inset, one shared class `.path-option`) | - |
| 4 preloader bar outline `0xe0b45a` 2 px, fill `0xe8742a`, same position and size | C | `E:1696-1716` (rect 512, 384, 468 x 32, stroke 2 px, colours); `PL:30` (unit); position unchanged: `Preloader.js:17` at `5d98b6f` and now | - |
| 5 boot and preloader on `#1c120c`, no sky image, track `0x2b1d14` | C | `E:1718-1743` (bg, no Image child, track fill, no `preloader.png` request); `PL:56`, `PL:65` | - |

### UIR-16 Skill thumbnails (spec ACs 1 to 5)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 at most 0.1 % pixels with `min(R, B) - G >= 110` in each of the 15 files | C | `E:1751-1766` (hero detail, 3 arts per hero, 5 heroes); `E:1745-1749` (bar); `E:1768-1781` (bag and tooltip) | - |
| 2 same names, `.jpg`, 512 px tall, aspect within 1 px, corner within 12 of `#1c120c` | C (artifact, run now) | Pillow check of the 15 files in `game/public/assets/heroes/`: all JPEG, height 512, width within 1 px of `art/<name>.jpg`, corner (27, 18, 11) (deviation 1), magenta share 0.0000 %, total 956,763 bytes | - |
| 3 drawn skill images below the threshold (bar, detail, bag, tooltip) | C | `E:1745-1749`, `E:1751-1766`, `E:1768-1781` | - |
| 4 `cutout_hero.py ... --height 512 --background 1c120c` writes an RGB JPEG of the whole frame | C (artifact, run now) | `art/tools/cutout_hero.py` run into scratch: RGB JPEG 512 x 512, byte-identical to `game/public/assets/heroes/lyra_double_shot.jpg` | - |
| 5 without `--background`: transparent PNG cropped to the hero | C (artifact, run now) | Same tool into scratch: RGBA PNG 485 x 512, corner alpha 0 | - |

### UIR-17 Prompts (spec AC 1)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 section `5. Texturas da interface`, two prompts with path and `style.css` line | C (document) | `PROMPTS_ASSETS_UI.md:305` (section), `:313-314` (`--texture-parchment: none;`, `--texture-wood: none;`), `:316` and `:327` (prompts); file unchanged since `a9945af9` | - |

### UIR-18 Review screenshots (spec AC 1)

| AC | Result | Evidence | Missing value (P only) |
| --- | --- | --- | --- |
| 1 `npm run ui:shots -- uiRedesign` writes every listed screenshot for desktop and phone | C (run now) | Scratch copy: exit 0, 66 PNG files, names identical to the committed set, all readable. Command config: `game/ui-review.config.js` (projects desktop and phone) | - |

### UIR-19 Round auto click button and window (spec ACs 1 to 22)

| AC | Result | Evidence (`file:line`) | Missing value (P only) |
| --- | --- | --- | --- |
| 1 round button 56 px centred at (867, 686), bg, 3 px ring, icon colour | C | `E:997-1006` (56 px, bg, 3 px, icon `%23f3d58a`); centre `E:1022` (within 1.5 px); `CT:3955-3961` (exact 867, 686 at `CT:3958`); ring on and off `E:1050-1062` | - |
| 2 key badge `A` 20 x 20 top left, label `500 ms` / `250 ms` | C | `E:1007-1014` (`A`, 20 px, top-left by centre comparison); `E:1015`, `E:1034-1038` (labels) | - |
| 3 locked: button, label and window not rendered | C | `E:1040-1048`; `CT:4141-4149` | - |
| 4 on: ring `rgb(95, 211, 90)`, glow `0 0 14px 4px rgba(95, 211, 90, 0.75)` | C | `E:1054-1055` | - |
| 5 off: ring `rgb(176, 122, 58)`, no green glow | C | `E:1061-1062` | - |
| 6 activation (click, Enter, Space) opens window, `aria-expanded` true, focus on switch | C | `E:1065-1080` (click, focus `E:1073`, aria `E:1074-1076`); `E:1082-1089` (Enter); `E:1091-1098` (Space); `CT:3986` | - |
| 7 window holds switch, interval, crystals, upgrade, reset in order, today's text | C | `E:1100-1113` (order `E:1104-1105`, texts `E:1106-1110`); `CT:3997` | - |
| 8 `A` with the window closed opens it | C | `E:1115-1121`; `CT:4006` | - |
| 9 `A`, Escape or button with window open closes it, `aria-expanded` false, focus back | C | `E:1123-1127`, `E:1140-1148`, `E:1155-1163`; `CT:4006`, `CT:4023` | - |
| 10 Escape closes window without opening the pause menu; second Escape opens it | C | `E:1140-1153`; `CT:4034` | - |
| 11 press outside closes window; press acts as today | C | `E:1165-1177`; `CT:4048` | - |
| 12 `A` in a text field does nothing: input other than checkbox, radio, button; textarea; select; contenteditable | P | `E:1219-1236` (`input` type text); `CT:4069` (text field), `CT:4079` (textarea), `CT:4087` (select), `CT:4095` (contenteditable="true"); checkbox opens `CT:4105` | Radio and button exclusions (sensor N12 survived); contenteditable="" and "plaintext-only" (production gap G1, `game/src/adapters/phaser/ClickerGame.js:87`) |
| 13 repeat of a held `A` does nothing | C | `E:1130-1138`; `CT:4115` | - |
| 14 `A` does nothing while pause, reset dialog, hero screen or locked | C | pause `E:1209-1217`, `CT:4123`; hero `E:1197-1207`, `CT:4132`; locked `E:1040-1048`, `CT:4141`; reset dialog `CT:4185-4196` | - |
| 15 focus stays on the control with the same test id when the window re-renders | C | `E:1343-1352`; `CT:4151` | - |
| 16 reset button closes the window and opens the dialog | C | `E:1238-1246`; `CT:4161` | - |
| 17 auto click locks with the window open: window closes | C | `CT:4172-4183` (new in `2f09fba`, state from the `autoClickOpen` getter; sensor R1-M16 killed) | - |
| 18 aria attributes and ids of button and window | C | `E:1074-1079`; `CT:4198` | - |
| 19 click on button or window does not hit the monster | C | `E:1180-1195` (hit counter); `E:1165-1178` (press outside hits) | - |
| 20 key `A` bound to nothing else | C | `CT:4209-4215` (exact list of keydown bindings) | - |
| 21 boxes of the bar do not overlap; window inside scene and left of the rail | C | `E:1258-1286`; ranges `E:1288-1299`; leader card, bar, rail `E:1301-1324` | - |
| 22 phone 390 px: button, badge, label and window scaled by 390/1024 and inside the scene | P | `E:1784-1803` (inside canvas; button width 56/1024 at `E:1800`; window left at least 663 `E:1801`, top at least 400 `E:1802`) | Scale of the key badge, the interval label and the window size on phone |

Edges of UIR-19 (both covered): window grows upward and ends 10 px above the reset-button position, `E:1248-1256`; window on phone stays in the scene, `E:1801-1802`.

### Edge cases (spec § Edge Cases)

| Edge | Result | Evidence (`file:line`) |
| --- | --- | --- |
| UIR-01: Google Fonts request fails, headings fall back to Georgia | C | `E:174-182` |
| UIR-10: skill image fails, dark frame | C | `E:971-976` |
| UIR-06: countdown extended, never above 1.000 | C | `CT:1225-1234` |
| UIR-06: countdown run out, reads 0.000 | C | `E:698-728`; `CT:1217-1223` |
| UIR-08: LIGHT or DARKNESS, chip empty | C | `E:795-803`; `CT:2070-2080` |
| UIR-12: hero screen opens over a running fight, dim layer only | C | `E:1354-1360`; `E:1375` |
| UIR-09: longest rail label fits | C | `E:861` |
| UIR-03: reduced motion keeps EPIC and LEGENDARY tiles still | C | `RF:32-41` |
| UIR-03: reduced motion keeps the map pulse off | C | `E:1630-1642` (round 2, `8173f65`) |
| UIR-19: window on phone stays inside the scaled scene | C | `E:1801-1802` |
| UIR-19: reset button shows, window grows upward | C | `E:1248-1256` |
| UIR-16: purple effects near the chroma key | n/a | accepted by the spec; ui-artist review |

---

## Discrimination Sensor

Isolation: a temporary `git worktree` of `HEAD` (`2a74476`) in the session scratchpad, with `node_modules` linked by a junction and the Playwright port moved from 5174 to 5184 (scratch only). Each injection replaced one anchor that matched exactly once, ran the targeted suite and restored the file with `git checkout` in the worktree. Each baseline run was green before its mutant. The worktree was removed afterwards.

| # | Mutation | Location | Killed by (`file:line`, test) | Result |
| --- | --- | --- | --- | --- |
| R1-M01 | Timer ring colour `--ember-500` to `--gold-400` | `game/public/style.css:680` | `E:685` "fills the ring with the share of the time left in ember" | Killed |
| R1-M02 | Timer ring share `360deg` to `180deg` | `style.css:680` | `E:685` (same) | Killed |
| R1-M03 | Wood texture layer removed from `--frame-bg` | `style.css:77` | `E:240` "draws the wood texture as the top layer of a dark wood frame" | Killed |
| R1-M14 | `A` guard without the reset-dialog check | `ClickerGame.js:341` | `CT:4185` "ignores A while the reset dialog is open" | Killed |
| R1-M15 | Text-field guard without textarea, select, contenteditable | `ClickerGame.js:87` | `CT:4079`, `CT:4087`, `CT:4095` (3 failed) | Killed |
| R1-M16 | Window not closed when the auto click locks | `ClickerGame.js:290` | `CT:4172` "closes the open window when the auto click becomes locked" | Killed |
| N01 | Leader current row background `parchment-100` to `parchment-300` (T31 scope) | `style.css:1620-1622` | `E:1510` "draws the Líder rows in dark ink" | Killed |
| N02 | Battle leader name 15 to 16 px (T32) | `style.css:1195` | `E:886` "draws the battle bar, leader card and skill frames" | Killed |
| N03 | Tooltip skill row `padding-left` 6 px (T33) | `style.css:1947` | `E:1555` "keeps the skill art and its text inside the skill tooltip" | Killed |
| N04 | TIME branch ink `#245d64` to `#245d65` (T34) | `style.css:1998` | `E:1586` "draws the talent buttons, titles and max marks in the dark branch ink" | Killed |
| N05 | Preloader outline 2 to 3 px (T35) | `Preloader.js:17` | `PL:30` "outlines the loading bar in gold, 2 px" (2 failed) | Killed |
| N06 | Boot background `#1c120c` to `#1c120d` (T35) | `game/src/main.js:19` | `E:1718` "draws the boot and preloader screens on dark wood" | Killed |
| N07 | `.hero-card .hero-name` 15 to 16 px (T36) | `style.css:1394` | `E:1465` "keeps the five hero cards the same size" | Killed |
| N08 | Focus token `#cc4e1a` to `#cc4e1b` | `style.css:64` | `E:184` "defines every palette token of the design" | Killed |
| N09 | Hover brightness 1.15 to 1.2 on the `.reset-account` selector, which is the last selector of a 13-selector rule (the mutant changed all 13 hovers) | `style.css:170-185` | `E:357` "draws the reset button of the dialog as a wood pill" (fails on `reset-confirm` hover; confirmed on 2 reruns, baseline green on 2 reruns) | Killed (not a single-button mutant) |
| N10 | Enemy tag border 1 to 2 px | `style.css:214-226` (`.tag`) | none: `E:742-764` checks colours only | **Survived** |
| N11 | Panel border style `solid` to `dashed` (token `--panel-border`) | `style.css:73` | none: `E:538-551`, `E:1441-1452` pass with `dashed` | **Survived** |
| N12 | Text-field guard without the radio exclusion | `ClickerGame.js:87` | none: `CT:4069-4105` subset passes | **Survived** |
| N13 | Weak chip not centred (`align-self: flex-start`) | `style.css:528` (`.weak-chip`) | `E:806-824` (FIRE, WATER, NATURE; 3 failed) | Killed |
| N14 | Auto click button centre x 867 to 866 | `ClickerGame.js:79` | `CT:3955` "places the round auto click button at 867, 686" | Killed |
| N15 | `.reset-account` hover 1.15 to 1.2, own appended rule (single button) | `style.css` (end of file) | none: 5 tests of the window and the reset dialog pass | **Survived** |
| N16 | `.auto-click-upgrade` hover 1.15 to 1.2, own appended rule (single button) | `style.css` (end of file) | none: same 5 tests pass | **Survived** |

**Sensor depth**: expanded, 22 injections. Round 1 asked for at least 10 new behaviour faults: 16 new faults (N01 to N16) across T31 to T36 and the values the new tests pin.
**Result**: 17 of 22 killed (6 of 6 round-1 survivors killed; 11 of 16 new faults killed); 5 survived (N10, N11, N12, N15, N16) - FAIL.
**Probe (not a mutant, a spec check)**: two probe tests added in the scratch copy of `ClickerGame.test.js` (`A` in a `contenteditable=""` element and in a `contenteditable="plaintext-only"` element, expected window closed). Both fail: `expected false to be true`. The guard at `ClickerGame.js:87` matches `[contenteditable="true"]` only (gap G1).

---

## Gate Check

- **Gate commands**: `cd game && npm test`, `npm run build`, `npx playwright test --workers=2`
- **Unit**: 71 files, 1536 passed, 0 failed (round 1: 1530). Six tests added in the round 2 delta (`CT:4079`, `4087`, `4095`, `4105`, `4172`, `4185`)
- **E2E**: 281 passed, 0 failed, 2 skipped (`heroAscension.spec.js:83` and `:92`, `test.fixme`, pre-existing); no flake, no solo rerun needed
- **Build**: `vite build` built in 719 ms, exit 0
- **Test count before feature**: not measured at `5d98b6f`. Declarations added in the round 2 delta: 6 unit `it(` and 18 e2e `test(` lines (static count, including the `for` loops)
- **Test integrity**: no assertion removed in the round 2 delta (see Summary). Round 1 renames are unchanged
- **Skipped tests**: 2, both `test.fixme` in `heroAscension.spec.js` (not part of this feature)
- **Backend**: not run, no change in range

---

## Real tree isolation

- Baseline of the tracked status (`git status --porcelain --untracked-files=no`) taken before the sensor: 10 lines, all owner files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`).
- After the sensor, the probes and the screenshot run, the tracked status is compared again in the final check of this round (see the report message). The sensor and the screenshots wrote only to the scratchpad worktree; the real tree received no write. Untracked owner art under `game/public/assets/` and `graphify-out/` were not staged, edited or reverted.

---

## Requirement Traceability (proposed; spec.md not edited by the Verifier)

| Requirement | Round 1 status | Proposed status |
| --- | --- | --- |
| UIR-01 | Needs Fix (AC6 wood layer) | Verified (all 6 ACs covered) |
| UIR-02 | Needs Fix (named buttons) | Partial (AC7, AC8, AC9, AC10, AC12) |
| UIR-03 | Needs Fix (contrast rows 10, 13, 14) | Partial (AC15) |
| UIR-04 | Partial | Partial (AC1, AC3, AC7) |
| UIR-05 | Partial | Verified |
| UIR-06 | Needs Fix (ring colour and share) | Verified |
| UIR-07 | Partial | Partial (AC17, AC18) |
| UIR-08 | Partial (AC6 "centred") | Partial (AC6 dark chip) |
| UIR-09 | Partial | Verified |
| UIR-10 | Partial | Partial (AC25) |
| UIR-11 | Partial | Partial (AC29) |
| UIR-12 | Partial | Verified |
| UIR-13 | Partial | Partial (AC1, AC4, AC5, AC12, AC13) |
| UIR-14 | Partial | Partial (AC8, AC9, AC14, AC15) |
| UIR-15 | Partial | Partial (AC2) |
| UIR-16 | Verified (artifacts) | Verified (re-run this round) |
| UIR-17 | Verified (artifact) | Verified |
| UIR-18 | Verified (run) | Verified (re-run this round) |
| UIR-19 | Needs Fix (AC17, AC12, AC14) | Partial (AC12, AC22) |

---

## Gaps (ranked) and proposed fix tasks

1. **G1 - production gap, UIR-19 AC12 (Major).** `game/src/adapters/phaser/ClickerGame.js:87`: the guard `[contenteditable="true"]` misses an empty value and `plaintext-only`, both contenteditable in HTML. Probe: 2 of 2 fail (scratch). Fix (game-dev): match `[contenteditable]:not([contenteditable="false"])` or test `target.isContentEditable`; add two unit tests after `CT:4103` with `contenteditable=""` and `contenteditable="plaintext-only"`, each expecting `popover(ctx).hidden === true`.
2. **N12 - surviving mutant, UIR-19 AC12 (Major).** Radio and button exclusions in `ClickerGame.js:87` are unasserted. Fix (test-engineer): unit tests after `CT:4113`: `input type=radio` and `input type=button` targets, each with `press(ctx, 'A', { repeat: false, target })`, expecting `popover(ctx).hidden === false`.
3. **N15, N16 - surviving mutants, UIR-02 AC9 and AC10, UIR-11 AC29 (Major).** Hover and press of `.reset-account` and `.auto-click-upgrade` are asserted nowhere. Fix (test-engineer): in `uiRedesign.spec.js` test `holds the old card's controls in order` (`E:1100-1113`), call `expectShades(page, page.getByTestId('auto-click-upgrade'))` and `expectShades(page, page.getByTestId('reset-account'))`.
4. **N11, plus the `border-top-style` gap, UIR-02 AC7 and AC8, UIR-04 AC1 and AC3, UIR-10 AC25, UIR-13 AC1, UIR-14 AC8, UIR-15 AC2 (Major).** A dashed panel border survives. Fix (test-engineer): add `'border-top-style': 'solid'` to the `expectStyle` calls at `E:261-271` (Fechar), `E:274-284` (Fundir, also `2px`), `EMBER_PILL` (`E:128`), `E:538-562` (stage plaque and wallet), `E:909-918` (skill frame), `E:1441-1452` (hero window), `E:1535-1552` (tooltips), `E:1663-1681` (login field).
5. **N10 and the weak chip dark background, UIR-07 AC18 and UIR-08 AC6 (Major).** Fix (test-engineer): in `E:742-764` add `'border-top-width': '1px'` to the `.tag` checks; in `E:782-793` add `background-color: rgba(28, 18, 12, 0.85)` for `weak-chip`, and `border-top-width: 1px` with `solid`.
6. **Spec precision: `Click to Start!` (UIR-02 AC8, AC9, AC10).** `game/src/adapters/phaser/MainMenu.js:57` renders `<p class="welcome-start">`, which takes no pointer; the test at `E:317` excludes it with a comment. Decision needed from the product owner: remove it from the button list of AC8 or make it a control with hover and press (then the CSS rule and `E:305-319` need the states). Priority: Major until decided.
7. **Partial values, Minor each (one fix task):** UIR-02 AC12 `radial` type of the coins (`E:422-445`); UIR-02 AC10 press on Refinar, equip piece, sell piece, bulk confirm (`E:368-398`); UIR-02 AC8 Fundir `2px` (`E:274-284`); UIR-03 AC15 quiet check on the other restyled buttons (`E:523-536`); UIR-04 AC7 positions of stage-hud, chapter-hud, wallet, combo-hud, boss timer and enemy line (`E:1288-1324` area); UIR-07 AC17 12 px of the magical and crit icons (`E:751-754`); UIR-11 AC29 upgrade border and text colour (`E:988`); UIR-13 AC4 farm entries (`.farm-entry`, `style.css:1568-1586`, no test); UIR-13 AC5 `circle at 50% 45%` (`E:1460-1462`); UIR-13 AC12 Cinzel family of the Líder names (`E:1510-1526`); UIR-13 AC13 family and weight of `.hero-name` (`E:1483`); UIR-14 AC9 branch bars of the other three branches (`E:1609`); UIR-14 AC14 skill row padding top, right, bottom (`E:1569`); UIR-14 AC15 `Nível máximo` of the other three branches (`E:1607`); UIR-19 AC22 phone scale of badge, label and window (`E:1784-1803`).
8. **Tasks hygiene (Cosmetic).** Round 1 reported 27 unticked "Done when" boxes under 20 tasks marked `[x]` in `tasks.md`. Not re-checked in this round (`tasks.md` out of scope).

Not caused by the feature: none. The two `test.fixme` in `heroAscension.spec.js` are pre-existing skips.

---

## Lessons

Round 2 recorded three new grounded lessons in `.specs/lessons.json` (candidates): L-075, the border style keyword with the width and colour (sensor N10, N11); L-076, the text-entry guard against every HTML form of the element (gap G1); L-077, checking that an element takes a pointer before a hover or press criterion names it (spec-precision gap, `Click to Start!`). Round 1 candidates L-067 to L-074 stay candidates: N12 re-confirms L-070 and N15/N16 re-confirm L-074 inside the same feature, which does not promote them (they need two distinct features).

---

## Summary

**Overall**: Not Ready (FAIL, round 2 of 3)

**Spec-anchored check**: 79 of 105 ACs covered; 26 partial; 0 uncovered (round 1: 67, 37, 1).
**Sensor**: 17 of 22 killed; 5 survived (N10, N11, N12, N15, N16). Round-1 survivors: 6 of 6 killed.
**Gate**: unit 1536 passed, e2e 281 passed, 2 skipped (pre-existing), 0 failed, build ok.
**Probe**: contenteditable guard gap confirmed (2 of 2).

**What works**: the palette, fonts, texture tokens, the button recipes (all named buttons with the wood or ember recipe), HUD plaques, timer ring colour and share, enemy chips and their dots, weak chip text and centring, the rail, battle bar and leader card sizes, hero screens, menu and preloader, the 15 skill images (verified now), the review screenshots (66, verified now), and the auto click window with its keys, focus, aria and lock.

**Issues found**: gaps G1 (production), N12, N15/N16, N11 family, N10 family, the `Click to Start!` decision, and the Minor partial values (items 1 to 7 above).

**Next steps**: route items 1 to 6 as fix tasks; item 7 as one Minor task; item 8 with the owner. Re-verify (round 2 of 3, next is round 3).

---

**Recorded by**: test-engineer (Verifier, round 2)
