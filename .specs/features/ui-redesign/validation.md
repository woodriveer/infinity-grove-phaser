# Validation: ui-redesign - PASS (round 3 of 3)

**Date**: 2026-11-17
**Spec**: `.specs/features/ui-redesign/spec.md` (UIR-01 to UIR-19, 107 numbered ACs after the amendments `af8af7a` and `9b02759`: UIR-15 AC6 and UIR-13 AC16 added; UIR-02 AC8, UIR-04 AC7 and UIR-13 AC4 reworded; 11 edge cases, 10 testable)
**Design**: `.specs/features/ui-redesign/design.md`
**Diff range**: `5d98b6f..caa2490` on `main` (whole feature). Round 3 delta: `2a74476..caa2490`. Feature commits in the delta: `7cad63f`, `af8af7a`, `941d3e7` (T39, the only production change of its own), `c56db8a`, `5b79826`, `bac675a`, `57098e5`, `9e3bf31`, `96077f8`, `5dc8f14`, `ff29bff`, `b147d1e`, `9b02759`, T49 inside `e027ff8` (three hover rules deleted from `style.css`), `f57f809`, `55cb3b2`, `9633d0f`, `de08ebe`, `0101e6c`, and the author check `1aa7901`, `fa225c5`, `4cbad4c`. Other features in the same range (boss-replay-chapters `67f0f68`..`1dcc5ab`, map stop fix `ac3108f`, campaign-chapters, hero-ascension, supabase-postgres, the wake notice) are judged only where a test of this feature reads them.
**Verifier**: independent `verifier` agent, round 3. It wrote no code, test or task of this feature.
**Evidence rule**: every number below comes from a command run in this round at `caa2490`. Line references are at `caa2490`.

---

## Verdict

PASS. Every round 2 point is closed, all 107 ACs are covered with `file:line` evidence, and the sensor killed 16 of 16 mutants: the five round 2 survivors, the three faults the plan named (T49, T50, T51) and eight new ones on the code and values Phase 11 touched. The full game unit suite is green. In the full e2e run (split by spec file) 315 of 319 passed; the 4 failures are load flakes, and each passed alone twice with `--workers=1`. One of the 4 is this feature's test `uiRedesign.spec.js:2089`, a 60 s timeout under load. The full backend suite is green.

No gap blocks acceptance. Two notes for later work, neither a spec value: the magenta detail test is slow (about 30 s of its 60 s budget alone; note N1), and UIR-05 AC10's example text `HP 1000/1000` now reads `HP 1K/1K`, a change campaign-chapters made on purpose (note N2).

---

## Round 2 items (FAIL at `2a74476`)

| Round 2 item | Closed by | State now (evidence at `caa2490`) |
| --- | --- | --- |
| G1: the `A` guard misses `contenteditable=""` and `plaintext-only` (UIR-19 AC12) | T39 `941d3e7`; `1aa7901` | Closed. Selector `[contenteditable]:not([contenteditable="false"])` at `game/src/adapters/phaser/ClickerGame.js:87`; cases `CT:4124` (bare), `CT:4134` (plaintext-only), `CT:4144` (child), `CT:4156` (`false` opens), `CT:4080` (input without a type). Sensor R3-01 (the old selector put back) killed |
| N12: radio exclusion unasserted | T39 | Closed: `CT:4166` (radio opens), `CT:4176` (button input opens). Sensor R2-N12 killed |
| N15, N16: hover of `reset-account` and `auto-click-upgrade` | T41 `5b79826` | Closed: `E:476-489` calls `expectShades` on each button in turn. Sensors R2-N15 and R2-N16 killed |
| N11 and the `border-top-style` family | T42 `bac675a` | Closed: `EMBER_PILL` `E:128` and `WOOD_PILL` `E:127` carry `solid`; Fechar `E:270`, Fundir `E:285`, Login `E:300`, stage plaque and wallet `E:642`, `E:662`, skill frame `E:1029`, hero window `E:1592`, piece tooltip `E:1688`, skill tooltip `E:1701`, login field `E:1972`. Sensor R2-N11 killed |
| N10 and the weak chip's dark background | T43 `57098e5` | Closed: `.tag` 1 px solid `E:848`, `E:864-866`; weak chip dark recipe `E:931-937`. Sensors R2-N10 and R3-07 killed |
| Spec precision: `Click to Start!` named as a button | PO ruling, spec `af8af7a` (UIR-02 AC8 list without it, new UIR-15 AC6), T40 `c56db8a` | Closed: `E:333-368` asserts tag `P`, every UIR-15 AC6 value and `filter: none` under forced `:hover` and `:active` (`E:365-366`). Sensors R3-02 (a hover shade added) and R3-03 (width 300 px) killed |
| 26 partial ACs | T41 to T52, spec `9b02759` | Closed: each one is listed below with its evidence |
| 27 unticked "Done when" boxes in `tasks.md` | PO ruling (tasks.md § Phase 11 notes) | Closed: `grep -c "^- \[ \]" tasks.md` prints `0`; 53 of 53 task headings carry `[x]` |

---

## Summary

| Check | Result (this round) |
| --- | --- |
| Unit (`cd game && npm test`) | 73 files, 1620 passed, 0 failed (round 2: 1536; the rest of the growth comes from other features) |
| E2E (`npm run test:e2e -- <files>`, 4 runs by spec file, 3 workers, project config) | 319 tests: 315 passed, 4 failed, 0 skipped. Run A `uiRedesign.spec.js`: 116 passed, 1 failed (19.8 min). Run B `dragEquip`, `heroAscension`, `bulkSell`: 67 passed, 2 failed (13.0 min). Run C `skillsAll`, `talents`, `auth`, `campaignChapters`, `farm`, `autoClick`: 71 passed (11.4 min). Run D the other 13 files: 61 passed, 1 failed (11.6 min) |
| Flakes (each failure rerun alone twice, `--workers=1`) | `uiRedesign.spec.js:2089` (timeout 60 s in `expectNoMagenta`): passed 31.6 s, 30.3 s. `dragEquip.spec.js:586` (scroll 180, expected 0): passed twice. `dragEquip.spec.js:670` (36, expected 0): passed twice. `clickPower.spec.js:41` (combo text empty after the 1.5 s window): passed twice. All four count as load flakes |
| Backend (`cd backend && ./gradlew test`) | 91 test classes, 985 tests, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESSFUL in 3m`, counts summed from `backend/build/test-results/test/*.xml`). No file under `backend/` changed in this feature's commits; the backend changes in range come from other features |
| Spec-anchored check | 107 numbered ACs: 107 covered, 0 partial, 0 uncovered (round 2: 79, 26, 0) |
| Edge cases | 10 testable: 10 covered: the round 2 edge tests are unchanged apart from moved line numbers, and every one passed in this round's runs; 1 not testable (purple effects, accepted by the spec) |
| Discrimination sensor (`node scripts/sensor.mjs`) | 16 mutants, 16 killed, 0 survived, 0 invalid; isolation ok |
| UI review | `ui-review.html` T53 section: verdict `APROVADO` (line 127), pressed shots `38-refine-pressed-desktop.png` and `39-sell-pressed-desktop.png` present; 70 PNG files in `ui-review/` |
| Test integrity | `git diff 2a74476..HEAD -- game/e2e/uiRedesign.spec.js game/src/adapters/phaser/ClickerGame.test.js`: +598 / -27 lines. Every removed line is replaced by a stricter one (`expectHoverShade` by `expectShades`, the 4.5 ratio by the 5.90-6.02 and 4.82 bounds, `offsetWidth` 20 by `[20, 20]`, colour-only style checks by width + style + colour) or by another feature's new text (`HP 1000/1000` to `HP 1K/1K`, `+5 cristais` to `+15 cristais`, campaign-chapters). No assertion was weakened |

---

## Spec-Anchored Acceptance Criteria (round 3)

Result key as in round 2: C = every value the AC states is asserted. Evidence files: `E` = `game/e2e/uiRedesign.spec.js`, `CT` = `game/src/adapters/phaser/ClickerGame.test.js`. The 79 ACs that were C in round 2 keep their tests (all passed in this round's runs); their line numbers moved with the inserted cases, so the table below lists the ACs that changed state or wording, and the new ones.

| AC | Round 2 | Now | Evidence (`file:line`, assertion) |
| --- | --- | --- | --- |
| UIR-02 AC7 secondary recipe | P | C | `WOOD_PILL` (`E:127`, `'border-top-style': 'solid'`) on every named button; Fechar `E:263-276` (`solid` at `E:270`) |
| UIR-02 AC8 primary recipe (amended: no `Click to Start!`) | P | C | `EMBER_PILL` `E:128` with `solid`; Fundir `E:278-291` (`2px`, `solid`); Login `E:293-304` |
| UIR-02 AC9 hover 1.15 | P | C | `expectShades` (`E:137-143`) on every named button, the window's two `E:476-489`, equip, sell, Refinar `E:424-440`, bag and bulk confirm `E:442-460` |
| UIR-02 AC10 press 0.9 | P | C | same calls; the press poll `E:142` (`toBe('brightness(0.9)')`); the T49 cascade fault (T49-M) is killed with `Received: "brightness(1.15)"` |
| UIR-02 AC12 radial coins | P | C | `E:541` `expect(background).toMatch(/^radial-gradient\(/)` for the three coins, three stops each `E:542` |
| UIR-03 AC15 still buttons | P | C | `expectStyle(<button>, QUIET)` (`QUIET` at `E:130`) on Fechar `E:275`, Fundir `E:290`, Login `E:296`, Sign up `E:310`, Logout `E:327`, prompt `E:345`, Voltar `E:377`, pause `E:386-407`, reset dialog `E:417-420`, equip, sell, Refinar `E:430-435`, bag, bulk `E:448`, `E:458`, window `E:486-487`; rail and timer `E:622-635` |
| UIR-04 AC1, AC3 plaque and wallet | P | C | `E:637-663` (`solid` `E:642`, wallet `E:662` same object) |
| UIR-04 AC7 scene anchors (amended `9b02759`) | P | C | `E:1781-1840`: stage left 156, centre y 44; wallet right 1004, y 44; chapter (82, 96); combo (670, 150); timer (512, 44); enemy x 670 and y 609 with `Fraco: Água` (`E:1839`), each `near(..., v)` within 1; `E:1845-1856` LIGHT and DARKNESS, y 596 within 1; bar exceptions `E:1428-1440`. Sensors T50-M and R3-08 killed (R3-08: received 13 px off) |
| UIR-07 AC17 icons 12 px | P | C | `E:854`, `E:858`, `E:859` (`width` `toBe('12px')` for physical, magical, crit) |
| UIR-07 AC18 dark chip, 1 px solid | P | C | `E:848` (`1px`, `solid`, bronze); `E:864-866` |
| UIR-08 AC6 dark weak chip | P | C | `E:931-937` (`rgba(28, 18, 12, 0.85)`, `1px`, `solid`, bronze, text colour); centre and position `E:927-929` |
| UIR-10 AC25 skill frame solid | P | C | `E:1001-1046` (`solid` `E:1029`) |
| UIR-11 AC29 window, tail, upgrade recipe | P | C | upgrade bg, border `rgb(224, 180, 90)`, text `E:484`; tail centre over the button span and window above it `E:491-510`; radius, width, switch `E:1094-1112`. Sensor R3-04 killed (tail centre 855.6 < button left 946.6) |
| UIR-13 AC1 hero window solid | P | C | `E:1583-1609` (`solid` `E:1592`) |
| UIR-13 AC4 inset recipe (amended: farm entries left the list) | P | C | `INSET` `E:1530` on every kind the amended AC lists, `E:1529-1568`; empty states `E:1569-1582` |
| UIR-13 AC5 vignette `circle at 50% 45%` | P | C | `E:1605` (hero card) and `E:1540` (hero detail), `toContain('circle at 50% 45%')`. Sensor R3-05 killed |
| UIR-13 AC12 Líder names Cinzel, ratios | P | C | `E:1670` family `/^"?Cinzel/`; `E:1663-1674` colour, 18 px, backgrounds, `toFixed(2)` = 13.56 and 11.09 |
| UIR-13 AC13 hero card names Cinzel 700 15 px | P | C | `E:1610-1636` (`'font-family'`, `'font-weight': '700'`, `'font-size': '15px'`) |
| UIR-13 AC16 beaten stops (new, `9b02759`) | - | C | `E:1924-1945`: `data-state` `defeated`, class `map-node`, bg `rgb(225, 238, 204)`, `3px` `solid` `rgb(93, 160, 72)`, miniboss 52 x 52 radius `50%`, boss 96 x 80 radius `24px`. Sensor T51-M killed |
| UIR-14 AC8 tooltips solid | P | C | piece tooltip `E:1688`, skill tooltip `E:1701` |
| UIR-14 AC9 branch bars | P | C | `E:1859-1871`: TIME, BREAK, POWER, COMBO colours `toContain('<colour> 4px 0px 0px 0px inset')`. Sensor R3-06 killed |
| UIR-14 AC14 skill row no padding, no border | P | C | `E:1722-1730` (four paddings `0px`, `border-top-style: none`, width 0, transparent bg); art 112 x 64 `E:1719` |
| UIR-14 AC15 inks and ratio bounds | P | C | `E:1747-1775`: exact inks; button ratio `toFixed(2)` in [5.9, 6.02] (`E:1765-1766`); title `toFixed(2)` >= 4.82 (`E:1769`); `Nível máximo` of POWER `E:1772`, of TIME, BREAK, COMBO `E:1873-1889` |
| UIR-15 AC2 login field solid | P | C | `E:1966-1986` (`solid` `E:1972`) |
| UIR-15 AC6 `Click to Start!` prompt (new, `af8af7a`) | - | C | `E:333-368`: tag `P` (`E:344`), Cinzel, 700, 22 px, width 320 px, text, bg, 2 px solid gold, radius 999 px, `filter: none` (`E:346-358`), still `none` with `:hover` and `:active` forced through CDP (`E:365-366`) |
| UIR-19 AC12 text-field guard | P | C | `CT:4069` (text), `CT:4080` (no type), `CT:4088` (textarea), `CT:4096` (select), `CT:4104` (`true`), `CT:4124` (bare), `CT:4134` (plaintext-only), `CT:4144` (child); opens on checkbox `CT:4114`, `false`, `CT:4156`, `CT:4166`, `CT:4176`; e2e `E:1359-1376` |
| UIR-19 AC22 phone scale | P | C | `E:2125-2159`: button width ratio `E:2138`; badge, label and window `box.width / layoutWidth` = 390/1024 within 0.002 (`E:2144-2157`, assertion `E:2156`) |

Status: all 107 ACs covered. No spec-precision gap is open: the round 2 gap (`Click to Start!`) is closed by the spec amendment, and UIR-04 AC7 now names its anchors and tolerance.

Author-check additions also hold: `fa225c5` pins the round button (bg, 3 px ring, round, icon `#f3d58a`) and its key badge `A` at 20 x 20 (`E:1119-1137`); `4cbad4c` pins `A` with the reset dialog open in e2e (`E:1347-1357`) and the 512 px skill images (`E:2050-2081`, UIR-16 AC2 now also in e2e).

---

## Discrimination Sensor

Mutants: `scratchpad/mutants.json` of this session, run with `node scripts/sensor.mjs <mutants.json> --json <out.json>` in the main checkout while no other suite ran. Each e2e mutant ran one case of `e2e/uiRedesign.spec.js` with `-g` (each grep listed 1 to 3 cases with `--list`, and each case passed in run A); each unit mutant ran `src/adapters/phaser/ClickerGame.test.js`. Spot check: T49-M, R3-04 and R3-08 were run again with their output kept; each fails on the intended assertion (`Received: "brightness(1.15)"` at `E:142`; tail centre `855.625` below the button's left `946.5625` at `E:507`; `13` px off y 596 at `E:1854`). `git status --porcelain` before and after: identical.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| R2-N10 | `game/public/style.css` | UIR-07 AC18: .tag border 1px to 2px (style.css:224) | killed |
| R2-N11 | `game/public/style.css` | UIR-04 AC1, UIR-13 AC1: panel border solid to dashed (style.css:73) | killed |
| R2-N12 | `game/src/adapters/phaser/ClickerGame.js` | UIR-19 AC12: guard loses the radio exclusion (ClickerGame.js:87) | killed |
| R2-N15 | `game/public/style.css` | UIR-02 AC9: reset-account hover 1.2, own late rule | killed |
| R2-N16 | `game/public/style.css` | UIR-02 AC9: auto-click-upgrade hover 1.2, own late rule | killed |
| T50-M | `game/public/style.css` | UIR-04 AC7: .hud-enemy gap 4px to 20px (style.css:531) | killed |
| T51-M | `game/public/style.css` | UIR-13 AC16: beaten stop border #5da048 to #5da049 (style.css:2724) | killed |
| T49-M | `game/public/style.css` | UIR-02 AC10: late equip hover rule put back, press loses | killed |
| R3-01 | `game/src/adapters/phaser/ClickerGame.js` | UIR-19 AC12: guard back to contenteditable=true only (round 2 G1) | killed |
| R3-02 | `game/public/style.css` | UIR-15 AC6: hover shade on the start prompt | killed |
| R3-03 | `game/public/style.css` | UIR-15 AC6: prompt width 320px to 300px (style.css:375) | killed |
| R3-04 | `game/public/style.css` | UIR-11 AC29: window tail moved off the button (style.css:954) | killed |
| R3-05 | `game/public/style.css` | UIR-13 AC5: hero card vignette 45% to 50% (style.css:1395) | killed |
| R3-06 | `game/public/style.css` | UIR-14 AC9: talent bar in the dark ink, not the branch colour (style.css:2015) | killed |
| R3-07 | `game/public/style.css` | UIR-08 AC6: weak chip border 1px to 2px (style.css:546) | killed |
| R3-08 | `game/public/style.css` | UIR-04 AC7: enemy box padded, line off y 596 with no chip | killed |

Printed by the script: 16 mutants, 16 killed, 0 survived, 0 invalid; isolation ok

**Sensor depth**: expanded, 16 mutants: the 5 round 2 survivors, the 3 faults that `tasks.md` (§ T53, last paragraph) asks for, and 8 new faults on the code and values Phase 11 touched.
**Result**: 16 of 16 killed - PASS.

---

## Gate Check

- **Gate commands**: `cd game && npm test`; `cd game && npm run test:e2e -- <spec files>` in 4 runs; `cd backend && ./gradlew test`.
- **Unit**: 73 files, 1620 passed, 0 failed.
- **E2E**: 319 tests, 315 passed in the full runs, 4 load flakes (each passed alone twice), 0 skipped. Round 2's two `test.fixme` in `heroAscension.spec.js` are gone (`grep -c "test.fixme\|test.skip" e2e/*.spec.js` is 0 for every file).
- **Backend**: 91 test classes, 985 tests, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESSFUL in 3m`, counts summed from `backend/build/test-results/test/*.xml`).
- **Build**: not run as a separate step; the Vite dev server compiled every module for the 319 e2e cases.
- **Skipped tests**: none.

---

## Failures not caused by the feature

| Test | Failure in the full run | Alone, `--workers=1` | Reason |
| --- | --- | --- | --- |
| `game/e2e/dragEquip.spec.js:586` edge scroll | scroll `180`, expected `0` | passed twice | load flake of the drag feature's timing |
| `game/e2e/dragEquip.spec.js:670` edge scroll light | `36`, expected `0` | passed twice | same |
| `game/e2e/clickPower.spec.js:41` combo streak | `combo-hud` empty: the 1.5 s combo window ended between clicks under load | passed twice | load flake of the click-power timing |

This feature's own flake: `game/e2e/uiRedesign.spec.js:2089` (`shows no magenta in the detail of any of the five heroes`) timed out at 60 s in run A; alone it passed in 31.6 s and 30.3 s. It is a load flake by the rule above (note N1).

---

## Gaps

None block acceptance.

Notes (not gaps, owner: test-engineer when that file is next touched):

- **N1**: `uiRedesign.spec.js:2089` takes about 30 s alone for 15 images across five hero screens, half its 60 s budget, so it times out under 3-worker load. Splitting it per hero (as the round 2 loops do) or `test.slow()` would remove the flake without changing a value.
- **N2**: UIR-05 AC10 gives `HP 1000/1000` as its example of a kept text. campaign-chapters (`a582a3e`) shortened it to `HP 1K/1K` on purpose and `E:717-743` follows. The Figtree 800 12 px style, colour and stroke of AC10 are still asserted. The product owner can refresh the example when the spec is next edited.

---

## Requirement Traceability (proposed; spec.md not edited by the Verifier)

| Requirement | Round 2 status | Proposed status |
| --- | --- | --- |
| UIR-01 | Verified | Verified |
| UIR-02 | Partial (AC7, AC8, AC9, AC10, AC12) | Verified |
| UIR-03 | Partial (AC15) | Verified |
| UIR-04 | Partial (AC1, AC3, AC7) | Verified |
| UIR-05 | Verified | Verified |
| UIR-06 | Verified | Verified |
| UIR-07 | Partial (AC17, AC18) | Verified |
| UIR-08 | Partial (AC6) | Verified |
| UIR-09 | Verified | Verified |
| UIR-10 | Partial (AC25) | Verified |
| UIR-11 | Partial (AC29) | Verified |
| UIR-12 | Verified | Verified |
| UIR-13 | Partial (AC1, AC4, AC5, AC12, AC13) | Verified (AC16 added) |
| UIR-14 | Partial (AC8, AC9, AC14, AC15) | Verified |
| UIR-15 | Partial (AC2) | Verified (AC6 added) |
| UIR-16 | Verified | Verified (assets unchanged since round 2: `git diff --stat 2a74476..HEAD -- game/public/assets/heroes art/tools` is empty) |
| UIR-17 | Verified | Verified (`PROMPTS_ASSETS_UI.md:305`, `:313-314`; the `ac3108f` edit of that file does not touch section 5) |
| UIR-18 | Verified | Verified (ui-artist re-ran `ui:shots` for T53, `0101e6c`) |
| UIR-19 | Partial (AC12, AC22) | Verified |

---

## Lessons

No new lesson: the round has no surviving mutant, no open spec-precision gap and no failed AC. The round 2 candidates L-075 to L-077 were applied by Phase 11 (T42 and T43, T39, T40 and the spec amendment) and stay candidates; they need a second feature to be promoted.

---

**Recorded by**: verifier agent (round 3 of 3)

---

The full round 2 report (FAIL, 2026-11-13, at `2a74476`) is kept in git: `git show 7cad63f:.specs/features/ui-redesign/validation.md`. Its items and their state now are in § Round 2 items above.
