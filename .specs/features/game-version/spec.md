# Game Version Label Specification

## Problem Statement

Nothing on screen tells which build of the game a player or a screenshot shows. The game is published from every commit of `origin/main` (AD-016, AD-023), so a bug report or a review screenshot cannot be tied to a release. The owner asked on 2026-11-18 for a patch release that shows the current game version in the bottom corner ("fazer um patch release mostrando no canto inferior a versão atual do jogo"), on every screen, so that any screenshot carries it. `game/package.json` holds `"version": "0.0.0"` today; from this release on `gitops` sets it in every release commit (`.claude/agents/gitops.md` step 7), and this feature ships as `v0.4.1`.

## Goals

- [ ] Every screen of the game (loading bar, splash, login, battle) shows the version of the build in the bottom-right corner of the browser window.
- [ ] The version shown is the `version` of `game/package.json` in the commit the build was made from, with no manual step besides the `gitops` bump.
- [ ] The label covers no control and no game text on a 1280x720 screen and on a 390x844 phone, and never takes a click.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Bumping `game/package.json` to `0.4.1` | `gitops` sets the version in the release commit (`.claude/agents/gitops.md` step 7); no development task changes it (D11) |
| The commit hash, the build date or the backend version in the label | Not asked; the backend version is `GET /health` `commit` (AD-023) |
| A changelog or "what is new" screen opened from the label | Not asked; the label takes no pointer (D9) |
| Showing the version inside the game menus (pause menu, panels) | One label for the whole page covers every screen |
| A phone layout of the panels | TD-010, a separate feature; the label is outside the scaled canvas, so it is not affected |
| A backend change or a Flyway migration | Game only; AD-016 expand/contract not triggered |

---

## Assumptions & Open Questions

Rows marked `y` were answered by the owner on 2026-11-18 (relayed by the orchestrator). Rows marked `n (Q<n>)` are product-owner rulings waiting for the owner's approval; each has a question below with the recommended default.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Corner | Bottom right | Owner's answer | y |
| D2 Screens | Every screen of the page: the loading bar (Preloader), the splash, the start screen (login form, welcome, path choice) and the battle (ClickerGame) with any panel open. The e2e names four of them: loading, splash, login form, battle | Owner's answer ("splash/abertura, login and the game itself, so any screenshot shows the version"); the loading bar comes before the splash, so a screenshot of it carries the version too (L-031: one test per named screen) | y |
| D3 Source | `game/package.json` `version`, read by `vite.config.js` when the dev server starts or `vite build` runs, and handed to the game as the Vite `define` constant `__GAME_VERSION__` (a JSON string). A built Worker shows the version of the commit it was built from | Owner's answer; the Worker is built from the commit tree (CLAUDE.md § Deploy) | y |
| D4 Text | `v` followed by the version with surrounding whitespace removed: `v0.4.1`. No word before it (`Versão`), no build suffix | Short, the form of the release tags (`v0.4.0`) and of `CHANGELOG.md`; language-neutral, so AD-007 adds no Portuguese text | n (Q1) |
| D5 Rendering | One plain DOM element `div.game-version` with `data-testid="game-version"`, appended to `document.body` by `main.js` before `new Game(config)`, `position: fixed` to the viewport. Not Phaser text and not inside the Phaser DOM container: those scale with the 1024x768 canvas (0.38 at 390 px wide, TD-010), so the label would read at about 5 px on a phone, and they belong to one scene, so the label would have to be redrawn by every scene | One element covers every scene with no scene code; outside the scaled canvas the label keeps 12 CSS px on every screen | n (Q2) |
| D6 Position | Right edge 8 px and bottom edge 4 px from the viewport's right and bottom edges. At 1280x720 the canvas is 960x720 at x 160 to 1120 (FIT), so the label lies in the right letterbox; at 390x844 the canvas is 390x292.5 at y 275.75 to 568.25, so it lies in the bottom letterbox. On a viewport with no letterbox (4:3, such as 1024x768) it lies over the canvas in the strip below the battle bar (`.battle-bar` ends with its 2 px ring at scene y 750; the label spans scene y 752 to 764 at scale 1) | The viewport corner is the corner the player sees; the letterbox is the one place on both review sizes where it covers nothing | n (Q3) |
| D7 Style | Figtree 600, 12 px, line height 12 px, letter spacing 0.04em (0.48 px), colour `--parchment-300` `#e6d0a2` at opacity 0.6, text shadow `0 1px 2px var(--wood-900)`, no background, no border, `white-space: nowrap`, `z-index: 10` | Grove theme body font and parchment colour (AD-022). Over the `--wood-900` `#1c120c` letterbox the label blends to `rgb(149, 132, 102)`, contrast 5.1:1 (WCAG AA for small text is 4.5:1) while staying dimmer than every HUD text; the shadow keeps it legible over the forest art on a 4:3 screen | n (Q4) |
| D8 Stacking | `z-index: 10`: above the canvas and the Phaser DOM container (no z-index), below the drag copy of an equipment tile (`.piece-drag-ghost`, `z-index: 1000`) | The label must show over the canvas on a 4:3 screen; a dragged tile must still pass over it | n (Q4) |
| D9 No pointer | `pointer-events: none` and `user-select: none`: a click on the label reaches the canvas under it | The brief asks for a label that is not clickable; on a 4:3 screen it lies over the canvas and must not swallow a click | n (Q4) |
| D10 Dev server | The dev server shows the package.json value of the working tree as it is (`v0.0.0` until the release commit, then `v0.4.1`), with no `-dev` suffix | Same code path as the build; e2e tests read `game/package.json`, so they hold before and after the bump | n (Q5) |
| D11 Version bump | `gitops` sets `"version": "0.4.1"` in the release commit `docs(release): v0.4.1 game-version`; no task of this feature edits `game/package.json` | Owner's answer; `.claude/agents/gitops.md` step 7 | y |
| D12 Production before the release | Every pushed game commit of this feature republishes the Worker (CI paths `game/src/**`, `game/public/**`, `game/vite.config.js`), so production shows `v0.0.0` from the first of them until the release commit sets `0.4.1` | Accepting the window keeps the version owned by `gitops` alone (D11); the window lasts until the release, at most the review and verification of this feature | n (Q6) |
| D13 Missing version | IF `__GAME_VERSION__` is not a string, or is empty or only whitespace, THEN no label is added (never `v` alone or `vundefined`) | A broken `package.json` must not print a wrong version; the game still runs | n (Q5) |
| D14 One label | Mounting the label again (a second call of `mountVersionLabel`) rewrites the text of the existing label; the page never holds two | Guards a duplicated mount call | n (Q5) |
| D15 Assistive technology | Plain text, no `role`, no `aria-hidden`: a screen reader reads `v0.4.1` at the end of the page | It is real information and short | n (Q4) |
| D16 Decision record | AD-026 in `STATE.md` (proposed): the version source, the build-time constant and the label | The version source is shared by `gitops`, `vite.config.js` and the game | n (Q6) |

**Open questions**: none. The owner answered yes to Q1 to Q6 on 2026-11-18 (D4 to D16 confirmed).

- Q1 (D4) Show the text `v0.4.1` (no `Versão` word)? Recommended: yes.
- Q2 (D5) Draw the label as one DOM element fixed to the browser window, outside the game canvas, instead of Phaser text inside each scene? Recommended: yes.
- Q3 (D6) Place it in the corner of the browser window (8 px from the right, 4 px from the bottom), which on 1280x720 and on a phone is the dark band beside or below the game, and on an exact 4:3 window is the strip under the battle bar? Recommended: yes.
- Q4 (D7, D8, D9, D15) Figtree 12 px parchment at 60 % opacity (contrast 5.1:1 on the dark band), never clickable, above the canvas and below a dragged tile, readable by screen readers? Recommended: yes.
- Q5 (D10, D13, D14) The dev server shows `package.json` as is (`v0.0.0` until the bump), a missing version shows no label, and the page never holds two labels? Recommended: yes.
- Q6 (D12, D16) Accept that production shows `v0.0.0` from the first game commit of this feature until the `v0.4.1` release commit, and record the version rule as AD-026? Recommended: yes.

---

## User Stories

### P1: Version on every screen ⭐ MVP

**User Story**: As the owner, I want every screen of the game to show its version in the bottom-right corner so that any screenshot or bug report says which release it comes from.

**Why P1**: The whole request.

**Acceptance Criteria**:

1. WHEN the page loads THEN the game SHALL append to `document.body`, before the Phaser game is created, one element `div.game-version` with `data-testid="game-version"` and the text `v` followed by the version with surrounding whitespace removed: version `0.4.1` gives `v0.4.1`, `0.0.0` gives `v0.0.0`, ` 0.4.1 ` gives `v0.4.1`.  <!-- event-driven -->
2. WHILE the loading screen (scene `Preloader`) shows, the label SHALL be visible with the text `v<version of game/package.json>`.  <!-- state-driven -->
3. WHILE the splash (scene `Splash`) shows, the label SHALL be visible with the text `v<version of game/package.json>`.  <!-- state-driven -->
4. WHILE the login form (`.auth-form`, scene `MainMenu`) shows, the label SHALL be visible with the text `v<version of game/package.json>`.  <!-- state-driven -->
5. WHILE the battle (scene `ClickerGame`) shows, the label SHALL be visible with the text `v<version of game/package.json>`.  <!-- state-driven -->
6. The page SHALL hold exactly one element with `data-testid="game-version"` on every screen; a second call of `mountVersionLabel` SHALL rewrite the text of the existing label and add none (D14).  <!-- ubiquitous -->

**Independent Test**: Open the game at 1280x720, log in, and read `v<version of game/package.json>` in the bottom-right corner on the loading bar, the splash, the login form and the battle, one label each time.

---

### P1: Version from the build ⭐ MVP

**User Story**: As the owner, I want the label to read the version from `game/package.json` when the game is built so that the published Worker shows the release of the commit it was built from.

**Why P1**: A version typed by hand would drift from the release tags.

**Acceptance Criteria**:

1. The Vite configuration (`game/vite.config.js`) SHALL define the constant `__GAME_VERSION__` as the JSON string of the `version` field of `game/package.json` for every mode and command (`development` serve, `pages` build), and the game SHALL take the label text from that constant only.  <!-- ubiquitous -->
2. IF the version is not a string, or is empty or only whitespace THEN the game SHALL add no label: `''`, `'   '`, `undefined`, `null` and the number `41` each add none (D13).  <!-- unwanted-behavior -->

**Independent Test**: Run the Vite configuration function for mode `pages` and read `define.__GAME_VERSION__` equal to `JSON.stringify(<version of game/package.json>)`; open the dev server and read `v<version>` in the label.

---

### P1: Discreet and out of the way ⭐ MVP

**User Story**: As a player, I want the version small and dim in the corner, never covering a button or taking my click, so that it does not get in the way of the game.

**Why P1**: A label that covers the HUD or eats a click would break the game.

**Acceptance Criteria**:

1. The label SHALL be fixed to the viewport (`position: fixed`) with its right edge 8 px (±1 px) from the right edge of the viewport and its bottom edge 4 px (±1 px) from the bottom edge, at 1280x720, at 390x844 and at 1024x768.  <!-- ubiquitous -->
2. WHILE the viewport is 1280x720 the label SHALL lie entirely to the right of the game canvas (its left edge at or right of the canvas right edge), on the start screen and in the battle.  <!-- state-driven -->
3. WHILE the viewport is 390x844 the label SHALL lie entirely below the game canvas (its top edge at or below the canvas bottom edge) and SHALL be 12 px (±1 px) tall, so it does not shrink with the canvas.  <!-- state-driven -->
4. The label SHALL have the computed style `font-family` starting with `Figtree`, `font-weight` `600`, `font-size` `12px`, `line-height` `12px`, `letter-spacing` `0.48px`, `color` `rgb(230, 208, 162)`, `opacity` `0.6`, `text-shadow` `rgb(28, 18, 12) 0px 1px 2px`, `white-space` `nowrap`, `z-index` `10`, at 1280x720 and at 390x844.  <!-- ubiquitous -->
5. The label SHALL take no pointer (`pointer-events: none`, `user-select: none`): WHILE the viewport is 1024x768, where the label lies over the canvas, `document.elementFromPoint` at the centre of the label SHALL return the game canvas, and a click at that point during the splash SHALL skip the splash (the splash ends before half of its 3300 ms).  <!-- state-driven -->

**Independent Test**: At 1280x720 read the label 8 px from the right and 4 px from the bottom, right of the canvas; at 390x844 below the canvas and 12 px tall; at 1024x768 click its centre during the splash and see the login form come early.

---

## Edge Cases

- WHEN the viewport has no letterbox (1024x768) THEN the label SHALL lie over the canvas and a click on it SHALL reach the game (GV-13).
- WHEN `mountVersionLabel` runs twice THEN the page SHALL hold one label with the text of the second call (GV-06).
- IF the version is missing, empty or only whitespace THEN no label SHALL be added (GV-08).
- WHEN the scene changes (loading bar, splash, login form, battle) THEN the same single label SHALL stay (GV-02 to GV-06).

---

## Requirement Traceability

IDs follow the order of the criteria: GV-01 to GV-06 "Version on every screen", GV-07 to GV-08 "Version from the build", GV-09 to GV-13 "Discreet and out of the way".

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GV-01 | P1: Version on every screen | T2, T3, T4 | Implementing |
| GV-02 | P1: Version on every screen | T3, T4 | Implementing |
| GV-03 | P1: Version on every screen | T3, T4 | Implementing |
| GV-04 | P1: Version on every screen | T3, T4 | Implementing |
| GV-05 | P1: Version on every screen | T3, T4 | Implementing |
| GV-06 | P1: Version on every screen | T2, T4 | Implementing |
| GV-07 | P1: Version from the build | T1, T3, T4 | Implementing |
| GV-08 | P1: Version from the build | T2 | Implementing |
| GV-09 | P1: Discreet and out of the way | T3, T4, T5 | Implementing |
| GV-10 | P1: Discreet and out of the way | T3, T4, T5 | Implementing |
| GV-11 | P1: Discreet and out of the way | T3, T4, T5 | Implementing |
| GV-12 | P1: Discreet and out of the way | T3, T4, T5 | Implementing |
| GV-13 | P1: Discreet and out of the way | T3, T4 | Implementing |

**ID format:** `GV-<NN>`

**Status values** (skill vocabulary): Pending → In Design → In Tasks → Implementing → Verified; a row the Verifier fails reads Needs Fix.

**Coverage:** 13 total, 13 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] A screenshot of the loading bar, the splash, the login form and the battle at 1280x720 and at 390x844 shows `v<version>` in the bottom-right corner (e2e and `ui-review/` shots).
- [ ] After the release commit, `https://infinity-grove.yan-tapajos.workers.dev/` shows `v0.4.1` (checked by `gitops` in production).
- [ ] At 1024x768 a click on the label skips the splash (e2e).
