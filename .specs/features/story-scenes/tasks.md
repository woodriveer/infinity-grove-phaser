# Story Scenes Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, discrimination sensor). This project has no Verifier: the `test-engineer` author check (T17) and the `ui-artist` review (T18) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/story-scenes/spec.md`
**Design**: `.specs/features/story-scenes/design.md`
**Status**: Approved by the owner on 2026-11-28 with every recommended answer to Q1 to Q14. Revision 2 (2026-11-28): every line number, contract and existing test re-checked against `origin/main` (`6ad59d17`) after AD-030 to AD-035; T1, T8, T10, T12, T13, T14, T16, T17 and T18 changed. Revision 3 (2026-11-28, scope addition under the owner's standing approval): the chapter 1 boss scene ships with real content (spec STORY-44 to STORY-55, D25 to D33): T3, T4, T5, T7, T8, T9, T13, T15, T17 and T18 amended, T19 (fixture seeds every catalog id) and T20 (e2e of the chapter 1 scene) added. T1 stays done.

Rules for every task:

- Paths are from the repository root `D:/Developer/infinity-grove`. `GS/` = `game/src/`, `VW/` = `game/src/adapters/phaser/views/`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- **Branch.** Every task works on the branch `ci/story-scenes` (T1 created it). Every task starts with `git switch ci/story-scenes && git pull --rebase origin ci/story-scenes`. When `origin/main` moved, rebase with `git fetch origin && git rebase origin/main` and push with `git push --force-with-lease origin ci/story-scenes`. Push right after each commit: `git push origin HEAD:ci/story-scenes`. No task pushes to `main`; `gitops` merges once T17's CI run is green and T18 is APROVADO (design § Tech Decisions: a half-built story must not reach the deployed `main`).
- One task = one commit with the message under **Commit**, checked with `py -3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`, `.claude/agents/*.png`, `BRIEFING_HISTORIA.md`, `ROTEIRO_DIALOGOS.md`, `presentation/`). No task edits any of them.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- **Re-pinning existing tests.** Only T10 (the composition key list) and T12 (the tab label `Rever chefes` becomes `Mapa`) change existing assertions, and only the ones their tables list. Name every re-pinned test in the commit body. If a test the task does not list fails, stop and report it to the orchestrator; do not change it. Never delete a test.
- Locally run only `cd game && npm test` (or one Vitest file) and one Playwright file at a time; the full e2e suite and the mutants run only in CI (`CLAUDE.md` § Agent team 4): `git push origin HEAD:ci/story-scenes`, then `node scripts/ci-wait.mjs ci/story-scenes` once in the foreground with `timeout: 600000`. A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times. No suite runs in the background.
- **Keys** follow AD-034: a key with Ctrl, Alt, Meta or Shift or an auto-repeat does nothing; the pause menu, the reset dialog and (from this feature) a playing scene block the battle keys.
- The desktop is the target (TD-010 dropped on 2026-11-26). No task adds phone behaviour or a phone e2e scenario.
- Game style: 4-space indent, braces on their own line for functions with a body (see `VW/stageLabel.js`), `//  ` comments with two spaces, imports pointing inward only (AD-003: `domain` imports only `domain`; `adapters/storage` imports `domain`, `application`, `storage`; `adapters/phaser` imports `domain`, `application`, `phaser`). Player text is Portuguese and copied from the spec exactly (AD-007, L-010).
- Every e2e spec imports `test` and `expect` from `./support/coverage` (never from `@playwright/test`) and uses `mockBackend` of `./support/fakeBackend` and `openMainMenu`, `fillCredentials`, `activeSceneKeys` of `./support/game`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check, `scripts/sensor.mjs`), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome 1280x720, fake backend `game/e2e/support/fakeBackend.js`; the full suite runs in CI in 12 shards), `GS/architecture.test.js` (import rule; a domain test may not import `node:fs`, so file checks live in `GS/storyAssets.test.js`). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain (`GS/domain/story/*.js`) | unit | Every branch; 1:1 to the spec ACs and every value of the spec examples; every validation rule its own test | `GS/domain/story/*.test.js` | `cd game && npm test` |
| Catalog files on disk | unit (root test, node fs) | Every path the catalog names exists under `game/public/` | `GS/storyAssets.test.js` | `cd game && npm test` |
| Storage adapter (`storySeen.js`) | unit | Every read and write path, storage failure, malformed value | `GS/adapters/storage/storySeen.test.js` | `cd game && npm test` |
| Views (`storyStage.js`, `storyPlayer.js`, `farmView.js`) | unit (jsdom, fake audio, fake clock and frames) | Every DOM state of the spec, every trigger of every outcome (L-098) | `VW/*.test.js` | `cd game && npm test` |
| Scenes (`ClickerGame.js`, `HeroUi.js`) and composition | unit | Every trigger, hold, guard and hook of the spec | `GS/adapters/phaser/*.test.js`, `GS/composition.test.js` | `cd game && npm test` |
| Stylesheet and fonts (`style.css`, `index.html`) | e2e | Every computed value the spec names (`toHaveCSS`, bounding boxes) | `game/e2e/storyStage.spec.js`, `game/e2e/storyReplay.spec.js` | `cd game && npx playwright test e2e/<file>` |
| Player-visible behaviour | e2e (Playwright, fake backend) | Every P1 and P2 criterion a player sees, happy path, every listed edge case | `game/e2e/story*.spec.js` | `cd game && npx playwright test e2e/<file>` |
| UI review artifact | none | Reviewed by the `ui-artist`; not a test of the game | `game/ui-review/storyScenes.shots.js`, `.specs/features/story-scenes/ui-review.html` | `cd game && npm run ui:shots -- storyScenes` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| E2E file | After tasks with e2e tests | `cd game && npm test && npx playwright test e2e/<one file>` (one file per run, every file of the task in turn) |
| Build | After each phase | `cd game && npm test && npm run build` |
| CI | T1, T12 and T17 (and any task the orchestrator asks) | `git push origin HEAD:ci/story-scenes` then `node scripts/ci-wait.mjs ci/story-scenes` (foreground, `timeout: 600000`); exit 0 is green |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every arrow is a `Depends on` inside the phase; dependencies on earlier phases are listed in the task only.

### Phase 1: e2e fixture (test-engineer)

T1 must land before T13, or every chapter 1 e2e test opens the overlay.

```
T1
```

### Phase 2: Domain and storage (game-dev)

```
T2 → T5
T4 → T5
T5 → T19
T3
T6
```

T19 (test-engineer) widens the T1 seed to every catalog id right after the catalog exists, before T13 makes the chapter 1 boss win open a scene.

### Phase 3: Player views (game-dev)

```
T7 → T8
T7 → T9
```

### Phase 4: Wiring (game-dev)

```
T11 → T12 → T13
T10 → T13
```

### Phase 5: e2e and author check (test-engineer)

```
T14 → T17
T15 → T17
T16 → T17
T20 → T17
```

### Phase 6: UI review (ui-artist)

```
T18
```

---

## Task Breakdown

### Phase 1: e2e fixture

#### T1: The shared e2e fixture seeds the prologue as seen [x]

**Owner**: test-engineer
**Goal**: Every existing e2e spec (53 files, all importing `./support/coverage`) keeps starting chapter 1 on the fight once the prologue ships, and story specs can turn the seed off (spec D23; protects STORY-01 to STORY-08 tests from the rest of the suite).
**Where**: `game/e2e/support/coverage.js`
**Also changes**: `game/e2e/storyFixture.spec.js` (new)
**Read first**: `game/e2e/support/coverage.js` (whole file, 27 lines; `test = base.extend` at `:10`), `game/e2e/farm.spec.js:23` (an `addInitScript` that writes localStorage)
**Depends on**: None
**Requirement**: STORY-01 (test isolation, D23)

**Contract** (`coverage.js`, the extended `test`):

```js
export const test = base.extend({
    //  Every spec starts with the prologue seen (spec story-scenes D23), so a chapter 1 battle opens on the fight;
    //  the story specs turn it off with test.use({ storySeen: false }). A value the test wrote itself is kept.
    storySeen: [ true, { option: true } ],
    page: async ({ page, storySeen }, use, testInfo) => {
        if (storySeen) {
            await page.addInitScript(() => {
                if (localStorage.getItem('infinity-grove.story-seen') === null) {
                    localStorage.setItem('infinity-grove.story-seen', '["prologue"]');
                }
            });
        }

        await use(page);
        //  ... unchanged coverage collection ...
    }
});
```

**Steps**:

1. Add the `storySeen` option and the `addInitScript` block above `await use(page);`, with the comment.
2. Create `game/e2e/storyFixture.spec.js` with the cases below. It needs no backend: `await page.goto('/')` then read the key with `page.evaluate(() => localStorage.getItem('infinity-grove.story-seen'))`.

**Tests**: e2e
**Test cases** (`game/e2e/storyFixture.spec.js`):

- `the shared fixture marks the prologue as seen before the page loads`: the key reads `'["prologue"]'`.
- `the shared fixture keeps a seen list already stored`: after `goto`, the test writes `'["chapter-1"]'` with `page.evaluate`, reloads, and reads `'["chapter-1"]'` (the fixture's script runs first on every load, so it only fills an absent key).
- `test.use({ storySeen: false })` in a `test.describe('without the seed')`: `the key stays absent`: the key reads `null`.

**Gate**: `cd game && npx playwright test e2e/storyFixture.spec.js`, then `npx playwright test e2e/farm.spec.js` (one file per run); then CI: `git push origin HEAD:ci/story-scenes` and `node scripts/ci-wait.mjs ci/story-scenes`
**Done when**:

- [x] The 3 new cases pass and `farm.spec.js` passes unchanged locally.
- [x] The CI run of the branch is green (every existing e2e spec passes with the seed).

**Commit**: `test(game): seed the prologue as seen in the shared e2e fixture`

---

### Phase 2: Domain and storage

#### T2: Line text and typing count (storyText.js) [x]

**Owner**: game-dev
**Goal**: The text of a line and how many characters show at `t` seconds (STORY-11).
**Where**: `game/src/domain/story/storyText.js` (new)
**Also changes**: `game/src/domain/story/storyText.test.js` (new)
**Read first**: `design.md` § Components `storyText.js` (the whole code is there), `GS/domain/campaign/bossCountdown.js` and its test (pattern of a small pure module)
**Depends on**: None
**Requirement**: STORY-11

**Contract**: `export const lineText = (line) => string` and `export const charsAt = (line, t) => number`, exactly the code of `design.md` § `storyText.js`.

**Steps**:

1. Create `storyText.js` with the design's code and a one-line comment above each export.
2. Create the test with the cases below. Use local fixtures (do not import the catalog): `LINE_2 = { cues: [ [ 0.05, 2.23, 'Até a noite em que as raízes' ], [ 2.6, 3.4, 'tremeram.' ] ] }`, `LINE_1` with the five cues of prologue line 1 (`design.md` § Prologue data), `ONE = { cues: [ [ 0, 2, 'Olá.' ] ] }`.

**Tests**: unit
**Test cases** (`storyText.test.js`, `describe('storyText')`):

- `lineText joins the cue texts with one space`: `lineText(LINE_2)` is `'Até a noite em que as raízes tremeram.'` and its length is 38.
- `charsAt of prologue line 2 at <t> s is <n>` (`it.each`, one row each): `[-1, 0]`, `[0, 0]`, `[0.05, 0]`, `[1.14, 14]`, `[2.23, 29]`, `[2.4, 29]`, `[3.0, 33]`, `[3.4, 38]`, `[10, 38]`.
- `charsAt of prologue line 1 is 43 at the end of the first cue, 61 halfway through the second and 138 at the end`: `t` 3.51, 5.42, 12.2.
- `the last cue brings no trailing space`: `charsAt(ONE, 1)` is 2, `charsAt(ONE, 2)` is 4, `charsAt(ONE, 5)` is 4.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 4 cases (9 rows in the table one) pass and every earlier unit test passes.

**Commit**: `feat(game): add the story line text and typing count`

---

#### T3: Scene state machine, labels, dots, look and scale (storyPlayback.js) [x]

**Owner**: game-dev
**Goal**: The pure rules of a playing scene (STORY-09, STORY-12, STORY-13, STORY-14, STORY-16, STORY-17, STORY-18, STORY-21, STORY-23, STORY-37).
**Where**: `game/src/domain/story/storyPlayback.js` (new)
**Also changes**: `game/src/domain/story/storyPlayback.test.js` (new)
**Read first**: `design.md` § Components `storyPlayback.js` (every function and value)
**Depends on**: None
**Requirement**: STORY-09, STORY-12, STORY-13, STORY-14, STORY-16, STORY-17, STORY-18, STORY-21, STORY-23, STORY-37, STORY-46, STORY-49, STORY-53

**Contract** (exports): `STORY_STAGE` (`{ width: 1280, height: 720 }`), `AUTO_ADVANCE_MS` (`1200`), `startStory(scene)`, `advanceStory(scene, state)`, `endLine(state)`, `skipStory(state)`, `hitLabel(state, scene)`, `progressDots(scene, state)`, `sceneLook(scene, state, t)`, `cameraOf(backdrops, look)`, `cameraTransform(camera)`, `storyScale(width, height)`, each as the design defines (revision 3: `hitLabel` reads `scene.title.action`; `sceneLook` returns `camera` and reads the card `backdrop` and `tints`). Every function returns a new object or array; none mutates its input.

**Steps**:

1. Create the module with the ten exports in the order above.
2. Create the test with local fixtures: `L = (extra) => ({ kind: 'narrator', backdrop: 'forest', tints: [], cues: [ [ 0, 1, 'x' ] ], duration: 1, ...extra })`; `FULL = { title: { kicker: 'k', cta: 'c' }, end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd' }, lines: [ L(), L() ] }`; `BARE = { lines: [ L() ] }`; `SIX = { lines: Array.from({ length: 6 }, () => L()) }`; `RED = L({ tints: [ 'dark', 'red' ], tintAt: { red: 6.1 } })`; `MAP = L({ backdrop: 'map', tints: [ 'gold' ] })`.

**Tests**: unit
**Test cases** (`storyPlayback.test.js`):

- `starts on the title card when the scene has one`: `startStory(FULL)` equals `{ phase: 'title', index: 0, complete: false }`.
- `starts on line 1 when the scene has no title`: `startStory(BARE)` equals `{ phase: 'line', index: 0, complete: false }`.
- `a click on the title card starts line 1`: from the title state to `{ phase: 'line', index: 0, complete: false }`.
- `a click on a typing line completes it`: `{ line, 0, false }` to `{ line, 0, true }`.
- `a click on a complete line starts the next one`: `{ line, 0, true }` to `{ line, 1, false }`.
- `a click on the complete last line shows the end card`: `FULL`, `{ line, 1, true }` to `{ phase: 'end', index: 1, complete: false }`.
- `a click on the complete last line of a scene with no end card ends it`: `BARE`, `{ line, 0, true }` to `{ phase: 'done', index: 0, complete: false }`.
- `a click on the end card ends the scene`: to `{ phase: 'done', index: 1, complete: false }`.
- `a click on a done scene changes nothing`: `advanceStory(FULL, done)` equals `done`.
- `the audio end completes a typing line`: `endLine({ line, 0, false })` equals `{ line, 0, true }`.
- `the audio end changes no other state`: `endLine` of `{ line, 0, true }`, of the title state and of the end state each equals its input.
- `skip ends the scene from the title card, a line and the end card` (three `expect`s): `phase` is `'done'` each time.
- `the hit label of each state`: title `Começar a história`, typing line `Mostrar fala completa`, complete line `Próxima fala`, end `Continuar`, done `''`.
- `dots light up to the current line`: `progressDots(SIX, { line, 2, false })` equals `[ true, true, true, false, false, false ]`.
- `no dot is lit on the title and end cards`: both give six `false`.
- `the title and end cards look like the dark forest`: `sceneLook(FULL, title, 0)` and `sceneLook(FULL, end, 0)` equal `{ backdrop: 'forest', tints: [ 'dark' ], camera: 'wide' }`.
- `a line with no tint shows its backdrop only`: `sceneLook(BARE, { line, 0, false }, 0)` equals `{ backdrop: 'forest', tints: [], camera: 'wide' }`. (Every line look below also carries `camera: 'wide'` unless stated.)
- `the red tint waits for its second`: `{ lines: [ RED ] }`, typing at `t` 6.0 gives tints `[ 'dark' ]`, at 6.1 gives `[ 'dark', 'red' ]`.
- `the red tint shows on a complete line whatever the second`: complete at `t` 0 gives `[ 'dark', 'red' ]`.
- `a map line shows the map and the gold tint`: `{ backdrop: 'map', tints: [ 'gold' ] }`.
- `the stage scale of <w>x<h> is <s>` (`it.each`): `[1280, 720, 1]`, `[1920, 1080, 1.5]`, `[1024, 768, 0.8]`, `[390, 844, 0.3046875]`.
- `auto-advance waits 1200 ms`: `AUTO_ADVANCE_MS` is 1200.
- Revision 3 fixtures: `CAMS = { clearing: { image: 'c.jpg', motion: 'still', cameras: { kael: { x: -551, y: -350, scale: 1.75 }, narr: { x: 0, y: -129, scale: 1.18, ms: 6000 } } } }`; `CARDS = { title: { kicker: 'k', cta: 'c', action: 'Começar a cena', backdrop: 'clearing', tints: [ 'dark' ] }, end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd', backdrop: 'clearing', tints: [ 'dark', 'dawn' ] }, lines: [ L({ backdrop: 'clearing', camera: 'kael' }) ] }`.
- `the title card label comes from its action`: `hitLabel({ phase: 'title', index: 0, complete: false }, CARDS)` is `Começar a cena`; with `FULL` it is `Começar a história`.
- `a card takes its backdrop and tints from the data`: `sceneLook(CARDS, title, 0)` equals `{ backdrop: 'clearing', tints: [ 'dark' ], camera: 'wide' }`; the end state gives `{ backdrop: 'clearing', tints: [ 'dark', 'dawn' ], camera: 'wide' }`.
- `a line names its camera`: `sceneLook(CARDS, { line, 0, false }, 0).camera` is `'kael'`.
- `cameraOf finds the preset with the default 1800 ms`: `cameraOf(CAMS, { backdrop: 'clearing', camera: 'kael' })` equals `{ x: -551, y: -350, scale: 1.75, ms: 1800 }`; `narr` keeps `ms` 6000.
- `cameraOf of wide or an unknown camera is the identity`: `{ backdrop: 'clearing', camera: 'wide' }` and `{ backdrop: 'forest', camera: 'kael' }` (forest has no cameras) each give `{ x: 0, y: 0, scale: 1, ms: 1800 }`.
- `cameraTransform writes the CSS transform`: `{ x: -551, y: -350, scale: 1.75 }` gives `translate(-551px, -350px) scale(1.75)`; the identity gives `translate(0px, 0px) scale(1)`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 28 cases pass and every earlier unit test passes.

**Commit**: `feat(game): add the story scene state machine`

---

#### T4: Catalog rules: validation, trigger and replay list (storyScenes.js) [x]

**Owner**: game-dev
**Goal**: Reject malformed scenes, pick the scene a chapter move opens and list the replayable scenes (STORY-01, STORY-03, STORY-04, STORY-29, STORY-33, STORY-34, STORY-35).
**Where**: `game/src/domain/story/storyScenes.js` (new)
**Also changes**: `game/src/domain/story/storyScenes.test.js` (new)
**Read first**: `design.md` § Components `storyScenes.js`, § Validation rules (the 16 rules, the catalog rules and every message)
**Depends on**: None
**Requirement**: STORY-01, STORY-03, STORY-04, STORY-29, STORY-33, STORY-34, STORY-35, STORY-48, STORY-49, STORY-50, STORY-52, STORY-53, STORY-54

**Contract** (exports): `LINE_KINDS`, `TINTS`, `TRIGGERS`, `MOTIONS` (the arrays of the design), `validateScene(scene, backdrops): string[]`, `validateCatalog(scenes, backdrops): string[]`, `sceneToPlay(scenes, { from, to, seen }): object | null`, `replayableScenes(scenes, seen, position): object[]`. Messages are the design's, character for character. `validateScene` checks rules 1 to 16 (with 5b, 5c and 11b of revision 3, and the two messages of rule 9) in order and collects every message (it does not stop at the first), except rule 6 which skips the line rules.

**Steps**:

1. Write the four constants.
2. Write `validateScene` rule by rule (one `if` per rule, a loop over lines and cues).
3. Write `validateCatalog`: backdrop rules for each `Object.entries(backdrops)`, then `scenes.flatMap((scene) => validateScene(scene, backdrops))`, then duplicate ids, then duplicate triggers (`${kind} ${chapter}`).
4. Write `sceneToPlay` and `replayableScenes` as the design states.
5. Write the tests with local fixtures: `BACKDROPS = { forest: { image: 'a.png', motion: 'drift' } }`; `line = (extra) => ({ kind: 'narrator', speaker: 'N', backdrop: 'forest', tints: [], audio: 'a.mp4', duration: 2, cues: [ [ 0, 1, 'Olá.' ] ], ...extra })`; `scene = (extra) => ({ id: 'chapter-1', label: 'Capítulo 1', trigger: { kind: 'chapter-boss', chapter: 1 }, lines: [ line() ], ...extra })`; `PROLOGUE = scene({ id: 'prologue', label: 'Prólogo', trigger: { kind: 'chapter-start', chapter: 1 } })`, `CH1 = scene()`, `CH2 = scene({ id: 'chapter-2', label: 'Capítulo 2', trigger: { kind: 'chapter-boss', chapter: 2 } })`, `CATALOG = [ PROLOGUE, CH1, CH2 ]`.

**Tests**: unit
**Test cases** (`storyScenes.test.js`):

- `a valid scene has no error`: `validateScene(scene(), BACKDROPS)` is `[]`; also with `title` `{ kicker: 'k', cta: 'c' }`, `end` with the four texts and a character line with `portrait: 'p.png'`.
- One test per rule, named after the message, each with the one broken field and `toEqual([ <message> ])`:
  - rule 1 `id: 'Capítulo 1'` gives `Capítulo 1: id must be lowercase letters, digits and dashes`; `id: 7` gives `?: id must be lowercase letters, digits and dashes`.
  - rule 2 `label: ''` gives `chapter-1: label is missing`.
  - rule 3 `trigger: { kind: 'boss', chapter: 1 }` and, in a second `expect`, `trigger: { kind: 'chapter-boss', chapter: 0 }` and `chapter: 1.5` each give `chapter-1: trigger must be chapter-start or chapter-boss with a chapter of at least 1`.
  - rule 4 `title: { kicker: 'k' }` gives `chapter-1: title needs kicker and cta`.
  - rule 5 `end: { kicker: 'a', title: 'b', subtitle: 'c' }` gives `chapter-1: end needs kicker, title, subtitle and cta`.
  - rule 6 `lines: []` gives `chapter-1: a scene needs at least one line`.
  - rule 7 `kind: 'sera'` on line 2 (`lines: [ line(), line({ kind: 'sera' }) ]`) gives `chapter-1 line 2: kind must be narrator, voice or character`.
  - rule 8 `line({ kind: 'voice', speaker: '' })` gives `chapter-1 line 1: speaker is missing`; a narrator line with no speaker gives `[]`.
  - rule 9 `line({ kind: 'character', speaker: 'Kael' })` with no portrait and no face gives `chapter-1 line 1: a character line needs a portrait or a face`; with `portrait: 'p.png', face: 'f.jpg'` it gives `chapter-1 line 1: a character line takes a portrait or a face, not both`; with only `face: 'f.jpg'` it gives `[]`.
  - rule 5b `title: { kicker: 'k', cta: 'c', backdrop: 'cave' }` gives `chapter-1: title backdrop or tints are unknown`; `end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd', tints: [ 'blue' ] }` gives `chapter-1: end backdrop or tints are unknown`.
  - rule 5c `letterbox: 'yes'` gives `chapter-1: letterbox must be true or false`; `motes: [ [ 1, 2, 3 ] ]` and `motes: [ [ 1, 2, 3, 0 ] ]` each give `chapter-1: motes must be [left, top, delay, duration] numbers`.
  - rule 11b with `BACKDROPS_CAM = { ...BACKDROPS, clearing: { image: 'c.jpg', motion: 'still', cameras: { kael: { x: -551, y: -350, scale: 1.75 } } } }`: `line({ backdrop: 'clearing', camera: 'lyra' })` gives `chapter-1 line 1: unknown camera lyra for backdrop clearing`; `camera: 'kael'` and `camera: 'wide'` give `[]`; `line({ camera: 'kael' })` on `forest` gives `chapter-1 line 1: unknown camera kael for backdrop forest`.
  - rule 10 `backdrop: 'cave'` gives `chapter-1 line 1: unknown backdrop cave`.
  - rule 11 (TINTS now `dawn, dark, red, gold, voice, veins`: `tints: [ 'dawn', 'veins' ]` gives `[]`) `tints: [ 'dark', 'blue', 'pink' ]` gives `[ 'chapter-1 line 1: unknown tint blue', 'chapter-1 line 1: unknown tint pink' ]`.
  - rule 12 `tints: [ 'dark' ], tintAt: { red: 1 }` gives `chapter-1 line 1: tintAt names a tint the line does not use: red`.
  - rule 13 `audio: ''` gives `chapter-1 line 1: audio is missing`.
  - rule 14 `duration: 0` gives `chapter-1 line 1: duration must be above 0`.
  - rule 15 `cues: []` gives `chapter-1 line 1: a line needs at least one cue`.
  - rule 16, one test per broken cue, each giving `chapter-1 line 1 cue 2: cues must be in order, inside the duration and carry text`: `[ [ 0, 1, 'a' ], [ 0.5, 1.5, 'b' ] ]` (overlap), `[ [ 0, 1, 'a' ], [ 1.5, 1.2, 'b' ] ]` (start after end), `[ [ 0, 1, 'a' ], [ 1, 2.5, 'b' ] ]` (past the duration 2), `[ [ 0, 1, 'a' ], [ 1, 2, '' ] ]` (no text).
- `a scene with several broken rules lists every message in rule order`: `label: ''` and `lines: [ line({ audio: '' }) ]` give `[ 'chapter-1: label is missing', 'chapter-1 line 1: audio is missing' ]`.
- `validateCatalog lists a backdrop with no image`: `{ cave: { motion: 'still' } }` gives `backdrop cave: image is missing` first.
- `validateCatalog lists a backdrop of an unknown motion`: `{ cave: { image: 'c.png', motion: 'spin' } }` gives `backdrop cave: motion must be drift, pan or still`.
- `validateCatalog lists a repeated id once`: `[ CH1, CH1, CH1 ]` (and `BACKDROPS`) ends with `duplicate scene id chapter-1` exactly once and `two scenes share the trigger chapter-boss 1` exactly once.
- `validateCatalog of a valid catalog is empty`: `validateCatalog(CATALOG, BACKDROPS)` is `[]`.
- `validateCatalog lists a broken camera`: `{ clearing: { image: 'c.jpg', motion: 'still', cameras: { kael: { x: 0, y: 0, scale: 0 } } } }` gives `backdrop clearing camera kael: needs x, y and a scale above 0`; `cameras: { lyra: { x: 0, scale: 1 } }` gives `backdrop clearing camera lyra: needs x, y and a scale above 0`; `cameras: { kael: { x: 0, y: 0, scale: 1, ms: 0 } }` gives the same message for `kael`.
- `validateCatalog refuses a camera named wide`: `cameras: { wide: { x: 0, y: 0, scale: 1 } }` gives `backdrop clearing camera wide: wide is reserved`.
- `sceneToPlay` (one test each, `seen` `[]` unless stated):
  - `the first encounter at chapter 1 opens the prologue`: `{ from: null, to: 1 }` gives `PROLOGUE`.
  - `a seen prologue opens nothing`: `{ from: null, to: 1, seen: [ 'prologue' ] }` gives `null`.
  - `the first encounter at chapter 2 opens nothing`: `{ from: null, to: 2 }` gives `null`.
  - `a completed campaign on load opens nothing`: `{ from: null, to: null }` gives `null`.
  - `moving from chapter 1 to 2 opens the chapter 1 boss scene`: `{ from: 1, to: 2 }` gives `CH1`.
  - `completing the campaign at chapter 1 opens the chapter 1 boss scene`: `{ from: 1, to: null }` gives `CH1`.
  - `a seen boss scene opens nothing`: `{ from: 1, to: 2, seen: [ 'chapter-1' ] }` gives `null`.
  - `a reset from chapter 3 to 1 opens nothing`: `{ from: 3, to: 1 }` gives `null`.
  - `staying in chapter 2 opens nothing`: `{ from: 2, to: 2 }` gives `null`.
  - `a jump from chapter 1 to 3 opens nothing`: `{ from: 1, to: 3 }` gives `null`.
  - `a chapter with no boss scene opens nothing`: `{ from: 3, to: 4 }` gives `null`.
- `replayableScenes`:
  - `lists the prologue when nothing was seen`: `replayableScenes(CATALOG, [])` gives `[ PROLOGUE ]`.
  - `lists a seen boss scene after the prologue`: `[ 'chapter-2' ]` gives `[ PROLOGUE, CH2 ]`.
  - `keeps the catalog order, not the seen order`: `[ 'chapter-2', 'chapter-1' ]` gives `[ PROLOGUE, CH1, CH2 ]`.
  (The cases above pass `position` `null`.)
  - `lists the boss scenes of the chapters the campaign passed`: `replayableScenes(CATALOG, [], { chapter: 2, completed: false })` gives `[ PROLOGUE, CH1 ]`; `{ chapter: 3, completed: false }` gives `[ PROLOGUE, CH1, CH2 ]`.
  - `does not list the boss scene of the current chapter`: `{ chapter: 1, completed: false }` gives `[ PROLOGUE ]`.
  - `a completed campaign lists the boss scene of its last chapter`: `{ chapter: 2, completed: true }` gives `[ PROLOGUE, CH1, CH2 ]`.
  - `a reset back to chapter 1 lists only what was seen`: `[ 'chapter-2' ]` with `{ chapter: 1, completed: false }` gives `[ PROLOGUE, CH2 ]`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] Every case above passes (one test per rule, per broken cue and per `sceneToPlay` row) and every earlier unit test passes.

**Commit**: `feat(game): add the story catalog rules`

---

#### T5: The prologue and chapter 1 catalog, its assets and the file check (storyCatalog.js) [x]

**Owner**: game-dev
**Goal**: The prologue and chapter 1 data of the two designs, the backdrops with the clearing cameras, the default motes, the committed asset files and a unit test that fails on a malformed entry or a missing file (STORY-30, STORY-31, STORY-32, STORY-33, STORY-44, STORY-45).
**Where**: `game/src/domain/story/storyCatalog.js` (new)
**Also changes**: `game/src/domain/story/storyCatalog.test.js` (new), `game/src/storyAssets.test.js` (new), and commits the 23 files of `game/public/assets/story/` (already in the working tree, untracked): `bg-forest.png`, `bg-map.jpg`, `bg-clearing.jpg`, `logo.png`, `portrait-seraphine.png`, `face-kael.jpg`, `face-lyra.jpg`, `face-orina.jpg`, `face-seraphine.jpg`, `face-vex.jpg`, `prologue-01.mp4` to `prologue-06.mp4`, `chapter-01-01.mp4` to `chapter-01-07.mp4`
**Read first**: `design.md` § Data model (the scene format, `STORY_BACKDROPS` with the clearing cameras, `STORY_DEFAULT_MOTES`, § Prologue data and § Chapter 1 data, to copy verbatim), `GS/rarityFrames.test.js` (a root test that reads files with `node:fs`)
**Depends on**: T2, T4
**Requirement**: STORY-30, STORY-31, STORY-32, STORY-33, STORY-44, STORY-45

**Contract**:

```js
//  The story of the game (spec story-scenes): the backdrops and the scenes. A content feature adds a scene here and its files
//  under game/public/assets/story/; storyCatalog.test.js validates it and storyAssets.test.js checks every file.
export const STORY_BACKDROPS = { /* forest, map and clearing with its six cameras: design.md § Data model, verbatim */ };

export const STORY_DEFAULT_MOTES = [ /* the 14 prologue motes: design.md § Data model, verbatim */ ];

export const STORY_SCENES = [ /* the prologue of design.md § Prologue data, then chapter 1 of § Chapter 1 data, verbatim */ ];

export const storyScene = (id) => STORY_SCENES.find((scene) => scene.id === id) ?? null;
```

`storyCatalog.js` imports nothing. The texts are typed in NFC (the default of any editor); `'Árvore'` has 6 characters.

**Steps**:

1. Create `storyCatalog.js`; copy the backdrops, the default motes, the prologue and chapter 1 from `design.md` without changing a number or a character.
2. Create `storyCatalog.test.js` (imports `lineText` from `./storyText` and `validateCatalog` from `./storyScenes`).
3. Create `GS/storyAssets.test.js`: collect every path (`STORY_BACKDROPS[*].image`, every `scene.title?.logo`, every `line.portrait`, every `line.face`, every `line.audio`), and `expect(paths.filter((path) => !existsSync(new URL(`../public/${path}`, import.meta.url)))).toEqual([])`.
4. `git add` the 23 asset files by path in this task's commit.

**Tests**: unit
**Test cases**:

- `storyCatalog.test.js`:
  - `the catalog breaks no rule`: `validateCatalog(STORY_SCENES, STORY_BACKDROPS)` is `[]`.
  - `the prologue opens at the start of chapter 1 with its title and end cards`: `id` `prologue`, `label` `Prólogo`, `trigger` `{ kind: 'chapter-start', chapter: 1 }`, `title` `{ logo: 'assets/story/logo.png', kicker: 'Ato 1 — Bosque Desperto · Prólogo', cta: 'Clique para começar' }`, `end` `{ kicker: 'Fim do Prólogo', title: 'Ato 1 — Bosque Desperto', subtitle: 'Capítulo 1', cta: 'Clique para continuar' }`.
  - `the prologue has the six lines of the design`: `lines.map(({ kind, speaker, portrait, backdrop, tints, tintAt, audio, duration }) => ...)` equals the table of spec P1 Prologue content AC 1 (character line portrait `assets/story/portrait-seraphine.png`; `tintAt` `{ red: 6.1 }` on line 3 and `undefined` on the others).
  - `the prologue lines read the texts of the design`: `lines.map(lineText)` equals the six texts of spec P1 Prologue content AC 1, character for character.
  - `the prologue cue timings are the design's`: `lines[0].cues[0]` is `[ 0.05, 3.51, 'Eldora sempre respirou pela Grande Árvore.' ]`, `lines[2].cues[2]` is `[ 6.23, 7.3, 'Vermelhos.' ]`, `lines[5].cues[3]` is `[ 5.19, 6.2, 'está com medo.' ]`, and the cue counts are `[ 5, 2, 3, 3, 3, 4 ]`.
  - `the backdrops are the forest that drifts, the map that pans and the clearing with six cameras`: `STORY_BACKDROPS` equals the object of `design.md` § Data model (clearing `motion` `still`, `cameras.kael` `{ x: -551, y: -350, scale: 1.75 }`, `cameras.narr` `{ x: 0, y: -129, scale: 1.18, ms: 6000 }`).
  - `the default motes are the 14 of the prologue design`: length 14, first `[ 608, 480, 1.04, 8.46 ]`, last `[ 169, 312, 4.05, 7.54 ]`.
  - `chapter 1 opens after the chapter 1 boss with its cards`: `STORY_SCENES[1]` has `id` `chapter-1`, `label` `Capítulo 1`, `trigger` `{ kind: 'chapter-boss', chapter: 1 }`, `letterbox` `true`, 10 motes (first `[ 120, 520, 0.4, 9.2 ]`), and the `title` and `end` objects of `design.md` § Chapter 1 data.
  - `chapter 1 has the seven lines of its design`: `lines.map(({ kind, speaker, face, backdrop, camera, tints, audio, duration }) => ...)` equals the table of spec P1 chapter 1 AC 1 (every backdrop `clearing`).
  - `chapter 1 lines read the texts of the script`: `lines.map(lineText)` equals the seven texts of spec P1 chapter 1 AC 1, character for character (lengths 83, 61, 72, 98, 61, 49, 58).
  - `chapter 1 cue timings are the design's`: `lines[2].cues[1]` is `[ 1.7, 2.7, 'Ainda brilham.' ]`, `lines[6].cues[1]` is `[ 2.14, 3.77, 'Avançamos ao amanhecer.' ]`, cue counts `[ 2, 3, 3, 3, 2, 3, 2 ]`.
  - `storyScene finds a scene by id`: `storyScene('prologue')` is `STORY_SCENES[0]`, `storyScene('chapter-1')` is `STORY_SCENES[1]`; `storyScene('chapter-99')` is `null`.
- `storyAssets.test.js`: `every file the story catalog names exists under game/public`: the missing list is `[]` (23 distinct paths).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 13 cases pass and every earlier unit test passes.
- [x] `git ls-files game/public/assets/story` lists the 23 files.

**Commit**: `feat(game): add the prologue to the story catalog with its art and voice`

---

#### T6: The seen list in localStorage (storySeen.js) [x]

**Owner**: game-dev
**Goal**: Remember which scenes opened automatically, per browser, with a memory fallback (STORY-02, STORY-07).
**Where**: `game/src/adapters/storage/storySeen.js` (new)
**Also changes**: `game/src/adapters/storage/storySeen.test.js` (new)
**Read first**: `GS/adapters/storage/autoClickPreference.js` and its test (the pattern to copy), `design.md` § Components `storySeen.js`
**Depends on**: None
**Requirement**: STORY-02, STORY-07

**Contract**:

```js
const STORAGE_KEY = 'infinity-grove.story-seen';

//  `storage` returns the Storage to use; it is read on every call because merely touching localStorage can throw
export const createStorySeen = (storage = () => globalThis.localStorage) =>
{
    let memory = [];   //  the list when storage cannot be read or written (spec D22)
    const read = () => { /* null -> memory; JSON array -> its strings; anything else or a throw -> memory when it threw, [] when the value was bad */ };

    return {
        seen: () => [ ...read() ],
        markSeen: (id) => { /* list = read() + id when absent; memory = list; try storage().setItem(STORAGE_KEY, JSON.stringify(list)) */ }
    };
};

export const storySeen = createStorySeen();
```

Read rules: `getItem` throws → `memory`; `getItem` returns `null` → `memory`; `JSON.parse` throws or the value is not an array → `[]`; an array → its entries that are strings.

**Steps**:

1. Create the module with the contract and the read rules.
2. Create the test (`beforeEach(() => localStorage.clear())`, the `broken` storage of `autoClickPreference.test.js`).

**Tests**: unit
**Test cases** (`storySeen.test.js`):

- `is empty the first time`: `createStorySeen().seen()` is `[]`.
- `stores a scene under infinity-grove.story-seen and a new instance reads it`: `markSeen('prologue')`; `localStorage.getItem('infinity-grove.story-seen')` is `'["prologue"]'`; `createStorySeen().seen()` is `[ 'prologue' ]`.
- `appends a second scene after the first`: on `'["chapter-1"]'`, `markSeen('prologue')` stores `'["chapter-1","prologue"]'`.
- `does not store a scene twice`: `markSeen('prologue')` twice stores `'["prologue"]'`.
- `reads a value that is not JSON as empty and rewrites it on the next mark`: `'{'` reads `[]`; `markSeen('prologue')` stores `'["prologue"]'`.
- `reads JSON that is not an array as empty`: `'{"x":1}'` and `'"prologue"'` each read `[]`.
- `drops the entries that are not strings`: `'[1,"prologue",null]'` reads `[ 'prologue' ]`.
- `keeps the list in memory when storage cannot be written`: with `broken`, `markSeen('prologue')` does not throw and `seen()` is `[ 'prologue' ]`; a new `createStorySeen(broken)` reads `[]`.
- `reads empty when touching localStorage throws`: `createStorySeen(() => { throw new Error('SecurityError'); }).seen()` is `[]`.
- `seen returns a copy`: pushing into the returned array leaves the next `seen()` unchanged.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 10 cases pass and every earlier unit test passes.

**Commit**: `feat(game): remember the story scenes already seen in this browser`

---

#### T19: The shared e2e fixture seeds every catalog scene as seen [x]

**Owner**: test-engineer
**Goal**: The existing e2e specs that win the chapter 1 boss keep playing on once the chapter 1 scene ships, and a future scene needs no fixture change (spec D23).
**Where**: `game/e2e/support/coverage.js`
**Also changes**: `game/e2e/storyFixture.spec.js`
**Read first**: `game/e2e/support/coverage.js` (the `storySeen` option of T1), `game/e2e/storyFixture.spec.js` (T1's three cases), `game/src/domain/story/storyCatalog.js` (T5)
**Depends on**: T5
**Requirement**: STORY-34 (test isolation, D23)

**Contract**: `import { STORY_SCENES } from '../../src/domain/story/storyCatalog.js';` (Node loads it: `game/package.json` has `"type": "module"` and the catalog imports nothing); `const SEEN = JSON.stringify(STORY_SCENES.map((scene) => scene.id));` and the init script writes `SEEN` (passed as the `addInitScript` argument) instead of the literal `'["prologue"]'` when the key is absent. Update the comment of the option.

**Steps**:

1. Add the import and `SEEN`; pass it to `page.addInitScript((seen) => { ... }, SEEN)`.
2. Re-pin `the shared fixture marks the prologue as seen before the page loads` (`storyFixture.spec.js`): rename it `the shared fixture marks every catalog scene as seen before the page loads` and expect `'["prologue","chapter-1"]'`. The other two cases stay as they are.

**Tests**: e2e
**Test cases** (`game/e2e/storyFixture.spec.js`): the re-pinned case above; `the shared fixture keeps a seen list already stored` and `the key stays absent` unchanged.

**Gate**: `cd game && npx playwright test e2e/storyFixture.spec.js`, then `npx playwright test e2e/campaignChapters.spec.js` (one file per run)
**Done when**:

- [x] The 3 cases pass and `campaignChapters.spec.js` passes unchanged.

**Commit**: `test(game): seed every story scene as seen in the shared e2e fixture`

---

### Phase 3: Player views

#### T7: The overlay DOM and its repaint (storyStage.js) [x]

**Owner**: game-dev
**Goal**: Build the overlay of the two designs once and repaint it from a snapshot, keeping the content node while the line does not change, with the camera, face, letterbox, motes and card looks of revision 3 (STORY-09, STORY-11, STORY-16, STORY-20, STORY-21, STORY-22, STORY-23, STORY-32, STORY-46, STORY-47, STORY-49 to STORY-55).
**Where**: `game/src/adapters/phaser/views/storyStage.js` (new)
**Also changes**: `game/src/adapters/phaser/views/storyStage.test.js` (new)
**Read first**: `design.md` § DOM structure (every class, test id and attribute), `VW/dom.js` (`el`), `design-reference.dc.html:88-155` (markup and SVG paths: chevron `:101` 28x18 and `:112` 22x14, speaker icons `:149` muted and `:152` unmuted)
**Depends on**: T2, T3
**Requirement**: STORY-09, STORY-11, STORY-16, STORY-20, STORY-21, STORY-22, STORY-23, STORY-32, STORY-46, STORY-47, STORY-49, STORY-50, STORY-51, STORY-52, STORY-53, STORY-54, STORY-55

**Contract**:

```js
//  The story overlay (spec story-scenes): built once per scene; update() repaints it from { state, shown, t, muted }.
//  The content of a card or line is rebuilt only when the phase or the line changes, so its entrance plays once.
export const createStoryStage = ({ scene, backdrops, onHit, onSkip, onMute }) => ({ root, hit, stage, update })
```

- `root` is `div.story-overlay` with `data-testid="story-overlay"`, `role="dialog"`, `aria-modal="true"`, `aria-label` `História: ${scene.label}`.
- `hit` (click → `onHit()`), `.story-skip` (click → `onSkip()`), `.story-mute` (click → `onMute()`).
- Backdrops: one `div.story-backdrop.is-<motion>` per entry of `backdrops`, `data-backdrop=<key>`, `style.backgroundImage = url("<image>")`, inside `div.story-camera` (with `.story-tint.is-veins`).
- `root` carries the class `is-<scene.trigger.kind>`; motes come from `scene.motes ?? STORY_DEFAULT_MOTES` as inline `left`, `top` (px), `animation-delay`, `animation-duration` (s); the bars exist only when `scene.letterbox`; the camera is written only when its name or backdrop changes (`cameraOf`, `cameraTransform`).
- `update(snapshot)` as `design.md` § DOM structure states; the `.story-shown` / `.story-ghost` split uses `lineText` and `snapshot.shown`.

**Steps**:

1. Write the static part (overlay with its trigger class, hit, stage, camera with backdrops and veins, the other tints in the order `dawn, dark, red, gold, voice`, motes from the data, vignette, the two letterbox bars when the scene asks, empty `.story-content`, bar with dots, `Pular`, mute).
2. Write one builder per content kind (title with its optional `h1.story-cardtitle`, narrator, voice, character with a portrait, character with a face, end) returning the nodes of § DOM structure.
3. Write `update`: look classes, content rebuild on `${phase}:${index}` change, text split, next arrow, hit label, dots, mute label, `aria-pressed` and icon.
4. Write the tests with the real `STORY_SCENES[0]`, `STORY_SCENES[1]` (`CH1`) and `STORY_BACKDROPS` (domain imports are allowed) and `vi.fn()` callbacks. `line = (index, complete = false) => ({ phase: 'line', index, complete })`.

**Tests**: unit
**Test cases** (`storyStage.test.js`):

- `the overlay is a modal dialog named after the scene`: test id, `role` `dialog`, `aria-modal` `true`, `aria-label` `História: Prólogo`.
- `draws one backdrop per entry with its image and motion`: two backdrops; `forest` has `is-drift` and a `background-image` containing `assets/story/bg-forest.png`; `map` has `is-pan` and `assets/story/bg-map.jpg`.
- `draws the six tints and fourteen motes`: `.story-tint.is-dawn`, `.is-dark`, `.is-red`, `.is-gold`, `.is-voice` one each in this order after the camera, `.is-veins` inside `[data-testid="story-camera"]`; 14 `.story-mote`, the first with `style.left` `608px`, `top` `480px`, `animation-delay` `1.04s`, `animation-duration` `8.46s`.
- `the prologue has no letterbox bars and the chapter-start class`: no `.story-bar`; the overlay has `is-chapter-start`.
- `the chapter 1 overlay has bars, ten motes and the chapter-boss class`: `CH1`: two `.story-bar` (`is-top`, `is-bottom`), 10 `.story-mote` (first left `120px`), the overlay has `is-chapter-boss`.
- `the bars are on while a line plays and off on the cards`: `CH1` title: no `.story-bar.is-on`; line 1: both `is-on`; end: none `is-on`.
- `the chapter 1 title card shows its kicker, title, call and action`: `.story-kicker` `Capítulo 1 — Final`, `.story-cardtitle` `A Devoradora da Clareira`, `.story-cta` `Clique para começar`, hit `Começar a cena`; the clearing backdrop and `.is-dark` `is-on`; the prologue title card has no `.story-cardtitle`.
- `the chapter 1 end card shows its texts and the dawn`: `.story-kicker` `Fim do Capítulo 1`, `.story-endtitle` `A Devoradora da Clareira`, `.story-endsub` `Ao amanhecer, os cinco guardiões avançam.`, `.story-cta` `Clique para continuar`, hit `Continuar`; `.is-dark` and `.is-dawn` `is-on`.
- `the camera moves to the line's preset`: `CH1` line 2: `[data-testid="story-camera"]` `style.transform` `translate(-551px, -350px) scale(1.75)`, `style.transitionDuration` `1800ms`; line 1: `translate(0px, -129px) scale(1.18)`, `6000ms`; the title card: `translate(0px, 0px) scale(1)`.
- `a repaint of the same line does not rewrite the camera`: two updates of `CH1` line 2 (`t` 0.5 then 1.0): after the first, set `camera.style.transitionDuration = 'x'`; after the second it is still `'x'`.
- `the prologue camera stays wide`: every prologue state gives `translate(0px, 0px) scale(1)`.
- `a face line shows the round face inside the wide box`: `CH1` line 2: `[data-testid="story-face"]` `src` `assets/story/face-kael.jpg`, `alt` `Kael`; `.story-box.is-face`; speaker `Kael`; no `[data-testid="story-portrait"]`.
- `the veins show on lines 1 and 4 and the dawn on line 7`: `CH1` line 1 and line 4: `.is-veins` `is-on`; line 2: not; line 7: `.is-dawn` `is-on`, `.is-veins` not.
- `the title card shows the logo, the kicker and the call`: `update({ state: { phase: 'title', index: 0, complete: false }, shown: 0, t: 0, muted: false })`: `.story-logo` `src` `assets/story/logo.png`, `alt` `Infinity Grove`; `.story-kicker` `Ato 1 — Bosque Desperto · Prólogo`; `.story-cta` `Clique para começar`; hit `aria-label` `Começar a história`.
- `the title card shows the dark forest and no dots`: forest backdrop `is-on`, map not; only `.is-dark` tint `is-on`; `.story-dots` `hidden`.
- `a typing narrator line splits its text at the shown count`: line 2 typing, `shown` 14: `[data-testid="story-text"]` is `.story-narr`; `.story-shown` `Até a noite em`; `.story-ghost` ` que as raízes tremeram.`; `.story-next` hidden; no `[data-testid="story-speaker"]`; hit `Mostrar fala completa`.
- `a complete line shows the next arrow and the next label`: line 2 complete, `shown` 38: `.story-next` not hidden; hit `Próxima fala`.
- `lights the dots up to the current line`: line 3: 3 of 6 `.story-dot.is-on`; `.story-dots` not hidden.
- `the voice line shows the orb, the plate and italic text`: line 5: `[data-testid="story-orb"]` present; speaker `A Voz`; `.story-box.is-voice`; the text node has `story-line is-italic`.
- `the character line shows the portrait, the plate and upright text`: line 6: portrait `src` `assets/story/portrait-seraphine.png`, `alt` `Seraphine`; speaker `Seraphine`; `.story-box.is-character`; the text node has no `is-italic`.
- `the end card shows its texts and the Continuar label`: end state: `.story-kicker` `Fim do Prólogo`, `.story-endtitle` `Ato 1 — Bosque Desperto`, `.story-endsub` `Capítulo 1`, `.story-cta` `Clique para continuar`; hit `Continuar`; dots hidden.
- `line 3 turns the red tint on at 6.1 s`: typing line 3 at `t` 6.0: `.is-red` not `is-on`, `.is-dark` `is-on`; at `t` 6.1: `.is-red` `is-on`.
- `line 4 shows the map and the gold tint`: map `is-on`, forest not; `.is-gold` `is-on`.
- `keeps the content node while the line does not change`: two updates of line 2 with `shown` 5 then 20: `.story-content` first child is the same node (`toBe`).
- `rebuilds the content node on the next line`: line 2 then line 3: a different node.
- `the mute button reads Silenciar, then Ativar som when muted`: `muted: false` gives `aria-label` `Silenciar`, `aria-pressed` `false`; `muted: true` gives `Ativar som`, `true`.
- `the Pular button reads Pular`: `.story-skip` text `Pular`, `type` `button`, test id `story-skip`.
- `clicks call the callbacks` (one test each, L-098): hit calls `onHit` once; `Pular` calls `onSkip` once; mute calls `onMute` once; none calls the others.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 31 cases pass and every earlier unit test passes.

**Commit**: `feat(game): build the story overlay of the prologue design`

---

#### T8: The scene player: audio, typing clock, keys and scale (storyPlayer.js) [x]

**Owner**: game-dev
**Goal**: Play one scene in the overlay and resolve when it closes; Escape follows the key rule of AD-034 (STORY-10 to STORY-20, STORY-24, STORY-37, STORY-38, STORY-42).
**Where**: `game/src/adapters/phaser/views/storyPlayer.js` (new)
**Also changes**: `game/src/adapters/phaser/views/storyPlayer.test.js` (new)
**Read first**: `design.md` § Components `storyPlayer.js` (options, behaviour steps 1 to 10; step 8 is the Escape rule), `GS/adapters/phaser/ClickerGame.js:34` (`hasModifier`, the same rule), `design-reference.dc.html:216-275` (`play`, `finish`, `next`, `advance`, `toggleMute`)
**Depends on**: T7
**Requirement**: STORY-10, STORY-11, STORY-12, STORY-13, STORY-14, STORY-15, STORY-17, STORY-18, STORY-19, STORY-20, STORY-24, STORY-37, STORY-38, STORY-42

**Contract**:

```js
//  Plays a scene in the story overlay (spec story-scenes) and resolves when it closes (end card, Pular or Escape).
//  Every browser API comes through `options` so the tests drive time, frames and audio by hand.
export const playStory = (scene, options = {}) => Promise<void>
export const storyMuted = () => boolean
export const setStoryMuted = (on) => void
```

Options and defaults exactly as `design.md` § `storyPlayer.js`. The module keeps `let muted = false`.

**Steps**:

1. Write `storyMuted` / `setStoryMuted`.
2. Write `playStory`: open (step 1), `playLine` (2), `fallBack` (3), `tick` (4), `finishLine` (5), `next` (6), hit (7), skip and Escape (8), mute (9), `close` (10), each as a local function.
3. Write the tests with the fakes below; `afterEach(() => { setStoryMuted(false); document.body.replaceChildren(); })`.

Fakes:

```js
const audios = [];
const createAudio = (src) => { const audio = { src, preload: '', currentTime: 0, muted: false, play: vi.fn(() => playResult()), pause: vi.fn(), onended: null, onerror: null }; audios.push(audio); return audio; };
let playResult = () => Promise.resolve();
let clock = 0;
const frames = [];
const runFrames = () => frames.splice(0).forEach((callback) => callback());
const timers = new Map(); let timerId = 0;
const options = (extra = {}) => ({ root: document.body, createAudio, now: () => clock, requestFrame: (cb) => { frames.push(cb); return frames.length; }, cancelFrame: () => { frames.length = 0; },
    setTimer: (cb, ms) => { timers.set(++timerId, { cb, ms }); return timerId; }, clearTimer: (id) => timers.delete(id), viewport: () => ({ width: 1280, height: 720 }), window: new EventTarget(), ...extra });
const hit = () => document.querySelector('[data-testid="story-hit"]');
const shown = () => document.querySelector('.story-shown').textContent;
```

**Tests**: unit
**Test cases** (`storyPlayer.test.js`, the real prologue `STORY_SCENES[0]` unless stated):

- `opens on the title card in the root and focuses the hit button`: overlay in `document.body`; `.story-kicker` present; `document.activeElement` is `hit()`.
- `sets the stage scale from the viewport`: `--story-scale` is `1` at 1280x720 and `0.3046875` with `viewport: () => ({ width: 390, height: 844 })`.
- `creates one audio per line with its file`: 6 audios, `src` `assets/story/prologue-01.mp4` to `-06.mp4`, `preload` `auto`, none played yet.
- `a click on the title card plays line 1 from 0`: `audios[0].play` called once, `audios[0].currentTime` 0.
- `the text follows the audio time`: after the start click, `audios[0].currentTime = 3.51`, `runFrames()`: `shown()` has 43 characters.
- `a click while typing shows the whole line, pauses the audio and waits`: `shown()` has 138 characters, `audios[0].pause` called, `.story-next` not hidden, hit `aria-label` `Próxima fala`, `timers.size` 0.
- `a click on a complete line plays the next line`: `audios[1].play` called once.
- `the audio end completes the line and moves on after 1200 ms`: `audios[0].onended()`: whole line, one timer of `ms` 1200; running its `cb` plays `audios[1]`.
- `a click before the auto-advance moves on once`: after `onended`, a click plays `audios[1]` and the timer is cleared (`timers.size` 0); `audios[1].play` was called once.
- `a rejected play types by the clock and ends at the duration`: on line 2 (`playResult = () => Promise.reject(new Error('NotAllowedError'))` before its start, `clock` 0 at start, `await` a microtask): `clock = 1140`, `runFrames()`: `shown()` has 14 characters; `clock = 3470`, `runFrames()`: whole line (38) and one 1200 ms timer.
- `an audio error types by the clock`: `audios[0].onerror()` at `clock` 1000, then `clock = 4510` (3.51 s later), `runFrames()`: `shown()` has 43 characters.
- `a play that throws types by the clock`: `play` throws synchronously; `clock` advanced to the line's duration completes it.
- `the last line clicked complete shows the end card`: after line 6 complete, a click shows `.story-endtitle` `Ato 1 — Bosque Desperto`; every audio `pause` was called.
- `a click on the end card closes the overlay and resolves`: the promise resolves and `[data-testid="story-overlay"]` is gone.
- `Pular on the title card closes and resolves`.
- `Pular during a line closes, pauses the audio and resolves`: `audios[0].pause` called; `audios[0].onended` is `null`.
- `Pular on the end card closes and resolves`.
- `Escape closes, and the key never reaches the window`: a `keydown` listener on `window` counts calls; `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`: overlay gone, promise resolved, the window listener count 0, `defaultPrevented` `true`.
- `Escape with <modifier> held keeps the scene open and never reaches the window` (`it.each` over `shiftKey`, `ctrlKey`, `altKey`, `metaKey`): `new KeyboardEvent('keydown', { key: 'Escape', [modifier]: true, bubbles: true, cancelable: true })`: overlay still open; the window listener count 0; `defaultPrevented` `true`.
- `a repeated Escape keeps the scene open and never reaches the window`: `{ key: 'Escape', repeat: true, bubbles: true, cancelable: true }`: overlay still open; the window listener count 0.
- `another key does nothing`: `key: 'a'`: overlay still open.
- `mute mutes every audio and the next scene starts muted`: click mute: every audio `muted` `true`, `aria-label` `Ativar som`; close; a second `playStory` creates audios with `muted` `true`.
- `a second mute click unmutes`: every audio `muted` `false`, `aria-label` `Silenciar`.
- `a resize sets the new scale`: `viewport` returns 1920x1080, `options.window.dispatchEvent(new Event('resize'))`: `--story-scale` `1.5`.
- `close gives the focus back`: a `button` in `document.body` focused before `playStory`; after `Pular`, `document.activeElement` is that button.
- `closing twice resolves once and later audio events do nothing`: `Pular` twice does not throw; a later `audios[0].onended?.()` changes nothing (no overlay in the page).
- `the chapter 1 scene creates one audio per line with its file`: `playStory(STORY_SCENES[1], options())`: 7 audios, `src` `assets/story/chapter-01-01.mp4` to `-07.mp4`; the title hit label `Começar a cena`.
- `a scene with no title card starts on line 1`: `{ ...STORY_SCENES[0], title: undefined }`: `audios[0].play` called at open with no click.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 28 cases (31 tests with the 4 rows of the modifier table) pass and every earlier unit test passes.

**Commit**: `feat(game): play story scenes with voice, synced text, skip and mute`

---

#### T9: Story stylesheet and fonts [x]

**Owner**: game-dev
**Goal**: The look of the design and the Mapa group in the stylesheet, and the story fonts (STORY-22, STORY-26, STORY-37, STORY-39, STORY-40, STORY-41).
**Where**: `game/public/style.css`
**Also changes**: `game/index.html` (line 9, the Google Fonts link)
**Read first**: `design.md` § Stylesheet (the whole CSS block, the Mapa rules and the font list), `game/public/style.css:3188-3251` (`.farm-chapters` to `.farm-chapter:focus-visible`), `game/index.html:7-10`
**Depends on**: T7
**Requirement**: STORY-22, STORY-26, STORY-37, STORY-39, STORY-40, STORY-41, STORY-49, STORY-50, STORY-51, STORY-52, STORY-55

**Steps**:

1. Append the `/* Story scenes ... */` block of `design.md` § Stylesheet at the end of `style.css`, unchanged.
2. Add `.farm-story-label` to the selector of `.farm-chapters-label` (`.farm-chapters-label, .farm-story-label {`), and `.farm-story-chip` to `.farm-chapter`, `.farm-chapter:hover:not(:disabled)`, `.farm-chapter:active:not(:disabled)` and `.farm-chapter:focus-visible` the same way.
3. After `.farm-chapter:focus-visible`, add the three Mapa rules of the design (`.farm-screen { position: relative; }`, `.farm-story`, `.farm-story-chip`).
4. In `index.html`, replace the `family=...` part of the stylesheet link with the design's list.

**Tests**: none (stylesheet and markup; every value is pinned by the e2e of T15 and T16 through `toHaveCSS` and bounding boxes)
**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] `npm test` passes unchanged and `npm run build` exits 0.
- [x] `game/public/style.css` contains `.story-camera`, `.story-tint.is-veins`, `.story-tint.is-dawn`, `.story-bar.is-on { height: 46px; }`, `.story-box.is-face`, `.story-face`, `.story-cardtitle`, `.story-overlay.is-chapter-boss .story-logo { width: 520px; }` and `@keyframes storyVeins`, and no `.story-mote.is-m` rule (motes are inline); and `game/index.html` contains `Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600` and `Cinzel:wght@500;700`.

**Commit**: `feat(game): style the story overlay and load its fonts`

---

### Phase 4: Wiring

#### T10: Hand the story services to the scenes (composition.js) [x]

**Owner**: game-dev
**Goal**: The battle gets the seen list, the catalog and the player through the registry (STORY-02, STORY-32).
**Where**: `game/src/composition.js`
**Also changes**: `game/src/composition.test.js`
**Read first**: `game/src/composition.js:15-16` (storage imports) and `:61-76` (`services`), `game/src/composition.test.js:5-14`
**Depends on**: T5, T6, T8
**Requirement**: STORY-02, STORY-32

**Contract**: import `storySeen` from `./adapters/storage/storySeen`, `STORY_SCENES` from `./domain/story/storyCatalog` and `playStory` from `./adapters/phaser/views/storyPlayer`; add to `services`, after `autoClickPreference` (the last key today, `:75`):

```js
    //  The story scenes (spec story-scenes): the seen list of this browser, the catalog and the overlay player
    storySeen,
    storyScenes: STORY_SCENES,
    playStory
```

**Steps**:

1. Add the three imports and the three keys.
2. Re-pin the key list of `hands the scenes the session, the user api and one factory per game service` (`composition.test.js:7`) to the sorted list `[ 'autoClickPreference', 'backend', 'createAccountReset', 'createAutoClickState', 'createCampaignSession', 'createEquipmentCollection', 'createFarmSession', 'createHeroCollection', 'createTalentCollection', 'createWalletSync', 'gifts', 'playStory', 'resetLegacy', 'session', 'storyScenes', 'storySeen', 'users' ]`.
3. Add the new case below.

**Tests**: unit
**Test cases** (`composition.test.js`):

- `hands the scenes the story catalog, the seen list and the player`: `services.storyScenes` is `STORY_SCENES` (`toBe`); `typeof services.storySeen.seen` and `typeof services.storySeen.markSeen` are `function`; `typeof services.playStory` is `function`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The new case and the extended key list pass; every other unit test passes unchanged.

**Commit**: `feat(game): hand the story services to the scenes`

---

#### T11: The História group of the Mapa screen (farmView.js) [x]

**Owner**: game-dev
**Goal**: One chip per replayable scene at the top right of the Mapa (STORY-26).
**Where**: `game/src/adapters/phaser/views/farmView.js`
**Also changes**: `game/src/adapters/phaser/views/farmView.test.js`
**Read first**: `VW/farmView.js:56-79` (`renderChapters`) and `:81-139` (`renderFarm`), `VW/farmView.test.js:1-20` and `:220-236`, `design.md` § `HeroUi` and `farmView` (the markup)
**Depends on**: None
**Requirement**: STORY-26

**Contract**: `renderFarm(bosses, winsLeft, { ..., stories = [], onStory = () => {} })`; a new local `renderStories(stories, onStory)` returns the `div.farm-story` of the design; `renderFarm` appends it right after the `h3.farm-map-title` only when `stories.length >= 1`. Update the comment above `renderFarm` to name `stories` and `onStory`.

**Steps**:

1. Write `renderStories` with `el` (`role` `group`, `aria-label` `História`, `span.farm-story-label` `História`, one `button.farm-story-chip` per story).
2. Add the two options to `renderFarm` and the append after the title.
3. Add the tests (`const STORIES = [ { id: 'prologue', label: 'Prólogo' } ]`).

**Tests**: unit
**Test cases** (`farmView.test.js`, new `describe('the História group')`):

- `shows a História group with one chip per story`: `show(undefined, undefined, { stories: STORIES })`: `[data-testid="farm-story"]` has `role` `group`, `aria-label` `História`; `.farm-story-label` `História`; `[data-testid="story-replay-prologue"]` is a `BUTTON` of `type` `button`, text `Prólogo`, `aria-label` `Assistir Prólogo`.
- `sits right after the map title`: the screen's children class names start with `[ 'farm-map-title', 'farm-story' ]`.
- `a chip click calls onStory with the scene id and picks no boss`: `onStory` called once with `'prologue'`; `onPick` not called.
- `lists two stories in the given order`: `[ { id: 'prologue', label: 'Prólogo' }, { id: 'chapter-1', label: 'Capítulo 1' } ]` gives the chip texts `[ 'Prólogo', 'Capítulo 1' ]`.
- `shows the group when no boss was beaten`: `renderFarm([], 10, { onPick: vi.fn(), map: AT_BOSS, stories: STORIES })` has `farm-story` and `farm-empty`.
- `shows no group without stories`: `show()` has no `[data-testid="farm-story"]` (the existing children-order tests at `:227-228` keep passing unchanged).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 6 new cases pass; every existing `farmView.test.js` case passes unchanged.

**Commit**: `feat(game): list the story scenes on the Mapa screen`

---

#### T12: Rename the tab to Mapa and pass the story hooks (HeroUi.js) [x]

**Owner**: game-dev
**Goal**: The tab and its title read `Mapa`; the Mapa screen lists the stories of the `stories` hook and plays one through `playStory` (STORY-25, STORY-26, STORY-27).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (one assertion), `game/e2e/uiRedesign.spec.js` (one assertion), `game/e2e/uiPolishHud.spec.js` (one title and one assertion)
**Read first**: `HeroUi.js:44-51` (`SCREENS`; the rail is `RAIL = SCREENS` at `:80`, six buttons, AD-034), `:91-98` (class comment and hooks), `:101` (constructor signature), `:119` (`this.hooks = ...`), `:1140-1164` (`render_farm`); `HeroUi.test.js:32-60` (`createUi`), `:95-104`, `:645-660`; `ClickerGame.test.js:2314-2325`; `e2e/uiRedesign.spec.js:958-963`; `e2e/uiPolishHud.spec.js:270-287`
**Depends on**: T11
**Requirement**: STORY-25, STORY-26, STORY-27

**Contract**:

- `SCREENS` farm row: `{ id: 'farm', label: 'Mapa', title: 'Mapa' }`. The icon, the test id `hud-farm`, the screen id `farm`, the order and the key chips (`SHORTCUTS`, T and B) stay.
- Constructor: `{ heroes, equipment, talents, farm, startFarm, walletCopper, useSkill, skillState, mapPosition, stories, playStory }` and `this.hooks = { startFarm, walletCopper, useSkill, skillState, mapPosition, stories, playStory };`. Add to the hooks comment (after the `mapPosition()` line): `//    stories() -> [{ id, label }] the scenes the Mapa lists (optional); playStory(id) plays one over the open Mapa (optional).`
- `render_farm`: add `stories: this.hooks.stories?.() ?? [],` and `onStory: (id) => this.hooks.playStory?.(id)` to the `renderFarm` options. The panel is not closed.
- In the comments of `HeroUi.js`, `Rever chefes` becomes `Mapa` (`:92`, `:315`, `:1166`); no other text changes.

**Steps**:

1. Change `SCREENS`, the constructor, the hooks and `render_farm`.
2. Re-pin the five assertions (table below).
3. Add the new cases.

**Re-pinned** (the spec renames the tab, STORY-25):

| File and line (today) | Test | Old | New |
| --------------------- | ---- | --- | --- |
| `HeroUi.test.js:95` and `:102` | `shows the six buttons Heróis, Mochila, Equipe, Equipamento, Talentos and Rever chefes` | title ends `... Talentos and Rever chefes`; `'Rever chefes'` | title ends `... Talentos and Mapa`; `'Mapa'` |
| `ClickerGame.test.js:2321` | `shows the four hero buttons in the HUD and none of them in the pause menu` | `'Heróis', 'Mochila', 'Equipe', 'Rever chefes'` | `'Heróis', 'Mochila', 'Equipe', 'Mapa'` |
| `e2e/uiRedesign.spec.js:962` | `draws the rail as framed wood squares on parchment` | `[ 'hud-farm', 'Rever chefes' ]` | `[ 'hud-farm', 'Mapa' ]` |
| `e2e/uiPolishHud.spec.js:270` and `:284` | `the rail reads Heróis, Mochila, Equipe, Equipamento, Talentos, Rever chefes in chapter 1` | title ends `Rever chefes in chapter 1`; `[ 'hud-farm', 'Rever chefes' ]` | title ends `Mapa in chapter 1`; `[ 'hud-farm', 'Mapa' ]` |

Rename `describe('HeroUi Rever chefes', ...)` (`HeroUi.test.js:645`) and `describe('HeroUi Rever chefes map', ...)` (`:2139`) to `HeroUi Mapa` and `HeroUi Mapa map`. No asserted value of `Rever chefe: <boss>` changes anywhere; the e2e test titles that say `Rever chefes` (`farm.spec.js:41`, `bossReplayChapters.spec.js:180`, `:210`, `:631`, `:692`) stay, because they assert no tab text.

**Tests**: unit and e2e (the re-pinned rail)
**Test cases** (`HeroUi.test.js`, in `describe('HeroUi Mapa')`):

- `opening Mapa titles the panel Mapa`: `.hero-title` text `Mapa`.
- `the Mapa screen shows a chip per story of the stories hook`: `ctx.ui.hooks.stories = () => [ { id: 'prologue', label: 'Prólogo' } ]` before `open(ctx, 'farm')`: `story-replay-prologue` text `Prólogo`.
- `a story chip plays that story and keeps the panel open`: `ctx.ui.hooks.playStory = vi.fn()`; click the chip: called once with `'prologue'`; `ctx.ui.isOpen` `true`; `startFarm` not called.
- `without a stories hook the Mapa shows no story group`: no `farm-story`.

**Gate**: `cd game && npm test`, then `npx playwright test e2e/uiRedesign.spec.js -g "draws the rail as framed wood squares on parchment"`, then `npx playwright test e2e/uiPolishHud.spec.js -g "the rail reads"` (one file per run); then CI: `git push origin HEAD:ci/story-scenes` and `node scripts/ci-wait.mjs ci/story-scenes`
**Done when**:

- [x] The 4 new cases and the 5 re-pinned assertions pass; every other unit test passes unchanged.
- [x] `grep -rn "'Rever chefes'" game/src game/e2e` prints nothing.
- [x] The CI run of the branch is green.

**Commit**: `feat(game): rename the boss map tab to Mapa and list the story scenes on it`

---

#### T13: Play the story from the battle and hold the fight (ClickerGame.js) [x]

**Owner**: game-dev
**Goal**: The battle opens the unseen prologue on its first chapter 1 encounter and the unseen chapter boss scene after the boss win, holds the fight while a scene plays (which also silences T, B, A and the skill keys, AD-034), ignores Escape meanwhile and gives the Mapa its hooks (STORY-01 to STORY-06, STORY-08, STORY-19, STORY-27, STORY-28, STORY-29, STORY-32, STORY-34, STORY-35, STORY-36, STORY-42, STORY-43, STORY-46, STORY-48).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `design.md` § `ClickerGame` (changes) and § Integration Points (keys), `ClickerGame.js:34` (`hasModifier`), `:160-205` (`create`; `this.createHeroUi()` at `:258`), `:404-432` (`autoClickKey`, `screenKey`: both return while `paused`), `:604-619` (`escape`), `:622-640` (`createHeroUi`), `:780-795` (`pauseFight`), `:883-900` (`showEncounter`), `:1152-1166` (`completeChapter`), `:1378-1385` (`useSkill`), `:1543-1548` (`hitMonster`); `ClickerGame.test.js:39-52` (`services`), `:105` (`createScene`), `:1480-1496` (a chapter boss win test: `killAll`, `advance`, `flush`), `:4001` (`press`), `:4431` (the A key test, at chapter 2), `:4721-4740` (`Screen keys T and B`), `:3071` (the key 1 skill test), the account reset tests near `confirm = (ctx) => ctx.hud('[data-testid="reset-confirm"]')` (`:5158`), the farm test `picking a boss in Rever chefes closes the panel, resumes and starts the farm fight` (`:2630`)
**Depends on**: T4, T10, T12, T19
**Requirement**: STORY-01, STORY-02, STORY-03, STORY-04, STORY-05, STORY-06, STORY-08, STORY-19, STORY-27, STORY-28, STORY-29, STORY-32, STORY-34, STORY-35, STORY-36, STORY-42, STORY-43, STORY-46, STORY-48

**Contract**: exactly `design.md` § `ClickerGame` (changes): imports `sceneToPlay` and `replayableScenes` from `../../domain/story/storyScenes`; fields `storySeen`, `storyScenes`, `playStoryView`, `storyOpen`; `showEncounter` reads `from` first and calls `playUnseenStory(from, null)` after `completeChapter()` and `playUnseenStory(from, this.session.chapter)` at its end; `playUnseenStory(from, to)`; `async playStory(scene)`; the `escape()` guard; the two hooks in `createHeroUi`. No new Phaser key handler: the list of registered keys pinned at `ClickerGame.test.js:4854` stays as it is.

**Steps**:

1. Add the import and the four fields in `create()` (before `this.createHeroUi()`).
2. Change `showEncounter`; add `playUnseenStory` and `playStory` after it.
3. Add the guard as the first statement of `escape()`.
4. Add `stories` and `playStory` to the `new HeroUi(this, { ... })` options.
5. Extend the test harness: import `STORY_SCENES`; add the stubs below to `services`; give `createScene` two options `seen = STORY_SCENES.map((scene) => scene.id)` (every catalog id, so the existing chapter 1 boss win tests open no scene) and `storyScenes = STORY_SCENES` that set `storySeen.list = [ ...seen ]`, `services.storyScenes = storyScenes`, and reset `story.play` (`mockClear`) and `story.close = null`.

```js
//  The story: the seen list holds the prologue by default (so no other test opens a scene) and the player stays open until a test calls story.close()
const storySeen = { list: [ 'prologue', 'chapter-1' ], seen () { return [ ...this.list ]; }, markSeen (id) { this.list.push(id); } };
const story = { close: null, play: vi.fn(() => new Promise((resolve) => { story.close = resolve; })) };
//  in services: storySeen, storyScenes: STORY_SCENES, playStory: (scene) => story.play(scene)
//  Fixture scene for the chapter boss cases
const bossScene = (chapter) => ({ ...STORY_SCENES[0], id: 'chapter-' + chapter, label: 'Capítulo ' + chapter, trigger: { kind: 'chapter-boss', chapter } });
```

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, new `describe('story scenes')`; `key(ctx, name)` = `press(ctx, name, { repeat: false, target: document.body })`):

- `a chapter 1 battle that never saw the prologue plays it once the campaign loads`: `createScene({ seen: [] })`: `story.play` called once with `STORY_SCENES[0]`; `storySeen.list` is `[ 'prologue' ]`.
- `marks the prologue seen before it plays`: the `story.play` mock reads `storySeen.list` when called: `[ 'prologue' ]`.
- `the fight is held while the prologue plays`: `scene.paused`, `scene.time.paused`, `scene.tweens.paused` are `true`.
- `a click while the prologue plays deals no damage`: `ctx.click()`: the monster's health is unchanged.
- `the fight runs again when the prologue closes`: `story.close(); await flush();`: the three are `false`; a click lowers the monster's health.
- `Esc while a scene plays opens no pause menu`: `ctx.handlers['keydown-ESC']()`: `.pause-menu` is still `hidden`; `scene.paused` still `true`.
- `Esc while a replay plays over the Mapa keeps the panel open`: open `farm`, `heroUi.hooks.playStory('prologue')`, `keydown-ESC`: `heroUi.isOpen` `true`.
- `T while a scene plays opens no screen`: at chapter 2, `heroUi.hooks.playStory('prologue')`, `key(ctx, 'T')`: `heroUi.isOpen` `false`.
- `B while a scene plays opens no screen`: same with `B`.
- `T while a replay plays over the Mapa keeps the Mapa`: open `farm`, replay, `key(ctx, 'T')`: `heroUi.screen` still `'farm'`.
- `A while a scene plays opens no auto click window`: at chapter 2 (as the test at `:4431`), replay, `key(ctx, 'A')`: the popover stays `hidden`.
- `the key 1 while a scene plays uses no skill`: a 1-star Kael as in the test at `:3071`, replay, `key(ctx, 'ONE')`: the monster's health is unchanged and slot 1 `data-state` is not `cooling`.
- `a chapter 1 battle that saw the prologue plays nothing`: default `createScene()`: `story.play` not called; `scene.paused` `false`.
- `a battle that loads at chapter 2 plays nothing and marks nothing`: `createScene({ seen: [], start: atChapter(2) })`: not called; `storySeen.list` `[]`.
- `a battle that loads a completed campaign plays nothing`: `createScene({ seen: [], start: progress(10, 'CHAPTER_BOSS', 1, true) })`: not called.
- `the first win of the chapter 1 boss plays its unseen chapter scene`: `createScene({ start: progress(10, 'CHAPTER_BOSS', 1), storyScenes: [ STORY_SCENES[0], bossScene(1) ] })`, report answers chapter 2 (as the test at `:1480`), `killAll`, `advance`, `await flush()`: `story.play` called once with the `chapter-1` scene; `storySeen.list` ends with `'chapter-1'`.
- `the boss win that completes the campaign plays the chapter scene of that chapter`: `start: atChapter(15, 10, 'CHAPTER_BOSS', 1)`, `storyScenes: [ bossScene(15) ]`, report answers `atChapter(15, 10, 'CHAPTER_BOSS', 1, true)`: called once with `chapter-15`.
- `a seen chapter scene does not play again`: as the chapter 1 case with `seen: [ 'prologue', 'chapter-1' ]`: not called.
- `an account reset back to chapter 1 plays no scene and keeps the seen list`: start at chapter 3 with `seen: []`, run the reset the way the tests near `:5158` do: not called; `storySeen.list` `[]`.
- `a farm win of a chapter boss plays no scene`: a completed campaign at chapter 1 with `storyScenes: [ bossScene(1) ]` and `seen: [ 'prologue' ]`, pick the chapter boss in the farm the way the test at `:2630` picks a miniboss, `killAll`, `advance`, `await flush()`: not called.
- `the first win of the chapter 1 boss plays the real chapter 1 scene`: default catalog, `seen: [ 'prologue' ]`, the chapter 1 boss win of the case above: `story.play` called once with `STORY_SCENES[1]` (`id` `chapter-1`).
- `the Mapa lists the chapter 1 scene for a player already past chapter 1`: default catalog, `seen: [ 'prologue' ]`, `start: atChapter(3)`: `heroUi.hooks.stories().map((s) => s.id)` is `[ 'prologue', 'chapter-1' ]`, and `story.play` was not called.
- `the Mapa does not list the chapter 1 scene at chapter 1 when it was not seen`: default catalog, `seen: [ 'prologue' ]`: `[ 'prologue' ]`.
- `the Mapa lists the prologue and the chapter scenes already seen`: `storyScenes: [ STORY_SCENES[0], bossScene(1), bossScene(2) ]`, `seen: [ 'prologue', 'chapter-2' ]`: `scene.heroUi.hooks.stories().map((s) => s.id)` is `[ 'prologue', 'chapter-2' ]`.
- `the Mapa replays a scene with the fight held and the seen list unchanged`: `heroUi.hooks.playStory('prologue')`: `story.play` called with `STORY_SCENES[0]`; `scene.paused` `true`; `storySeen.list` `[ 'prologue' ]`.
- `a second scene request while one plays is ignored`: during the prologue, `heroUi.hooks.playStory('prologue')`: `story.play` called once in total.
- `a scene opened over the pause menu leaves the fight paused when it closes`: `scene.pauseFight()`, `heroUi.hooks.playStory('prologue')`, `story.close(); await flush()`: `scene.paused` `true`, `.pause-menu` not `hidden`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 27 cases pass; every existing `ClickerGame.test.js` case passes unchanged (the harness seeds every catalog id).

**Commit**: `feat(game): open the story scenes from the battle and hold the fight meanwhile`

---

### Phase 5: e2e and author check

#### T14: e2e: the prologue on the first chapter 1 battle [x]

**Owner**: test-engineer
**Goal**: The player-visible behaviour of automatic play, clicking through, closing, the keys under a scene and the seen list (STORY-01 to STORY-09, STORY-12, STORY-13, STORY-16 to STORY-19, STORY-22, STORY-30, STORY-42, STORY-43).
**Where**: `game/e2e/storyScenes.spec.js` (new)
**Read first**: `game/e2e/farm.spec.js:1-40` (start helper), `game/e2e/accountReset.spec.js:1-40` (reset flow), `game/e2e/session.spec.js:25-50` (reload and restore), spec P1 The prologue opens, P1 Watching a scene, P1 The prologue content
**Depends on**: T1, T9, T13
**Requirement**: STORY-01, STORY-02, STORY-03, STORY-04, STORY-05, STORY-06, STORY-07, STORY-08, STORY-09, STORY-12, STORY-13, STORY-16, STORY-17, STORY-18, STORY-19, STORY-22, STORY-30, STORY-42, STORY-43

**Setup**: `test.use({ storySeen: false });`. `startBattle(page, backend = {})`: `mockBackend(page, { users: { yan: 'secret123' }, ...backend })`, `openMainMenu`, log in as `yan`, click the canvas, wait for `ClickerGame` in `activeSceneKeys`. `held = (page) => page.evaluate(() => { const s = window.__PHASER_GAME__.scene.getScene('ClickerGame'); return [ s.paused, s.time.paused, s.tweens.paused ]; })`. `seenKey = (page) => page.evaluate(() => localStorage.getItem('infinity-grove.story-seen'))`. `hit = page.getByTestId('story-hit')`. `text = page.locator('[data-testid="story-text"] .story-shown')`.

**Tests**: e2e
**Test cases**:

- `the first chapter 1 battle opens the prologue on its title card`: `story-overlay` visible; `.story-kicker` `Ato 1 — Bosque Desperto · Prólogo`; `.story-cta` `Clique para começar`; `.story-logo` `alt` `Infinity Grove`, `src` `assets/story/logo.png`; `hit` `aria-label` `Começar a história` and focused (`toBeFocused`); `seenKey` `'["prologue"]'`.
- `the fight is held while the prologue plays`: `held` is `[ true, true, true ]`.
- `clicking through shows each line, its speaker and the end card`: for line n = 1 to 6, click `hit` (start or next), click `hit` (complete), then `text` has the exact text of spec P1 Prologue content AC 1 line n and `hit` reads `Próxima fala`; on line 3 `.story-dot.is-on` count 3; on line 5 `story-speaker` `A Voz` and `story-orb` visible; on line 6 `story-speaker` `Seraphine`, `story-portrait` `alt` `Seraphine` and `src` `assets/story/portrait-seraphine.png`; on lines 1 to 4 no `story-speaker`. Then one click shows `.story-kicker` `Fim do Prólogo`, `.story-endtitle` `Ato 1 — Bosque Desperto`, `.story-endsub` `Capítulo 1`, `.story-cta` `Clique para continuar`, `hit` `Continuar`.
- `a typing line clicked shows the whole line and waits`: start line 1, click: `text` is the full line 1 text and `.story-next` visible; after `page.waitForTimeout(2500)` `.story-dot.is-on` count is still 1.
- `the red tint is on once Vermelhos shows`: on line 3 complete, `.story-tint.is-red` has class `is-on`; on line 2 it has not.
- `line 4 shows the map backdrop and the gold tint`: `[data-backdrop="map"]` and `.story-tint.is-gold` have `is-on`; `[data-backdrop="forest"]` has not.
- `the end card click closes the prologue and chapter 1 goes on`: overlay count 0; `held` `[ false, false, false ]`; `.stage-hud` `Stage 1/10  Phase 1/5`; a canvas click lowers the monster's health (read `scene.monster.health` before and after).
- `Pular on the title card closes the prologue`: overlay count 0, `held` all `false`, `.pause-menu` hidden.
- `Pular during a line closes the prologue`: after the start click; same checks.
- `Escape closes the prologue and opens no pause menu`: `page.keyboard.press('Escape')`: overlay count 0; `.pause-menu` hidden; `held` all `false` (wait 500 ms, then check again).
- `Shift+Escape keeps the prologue open and opens no pause menu`: `page.keyboard.press('Shift+Escape')`: overlay visible; `.pause-menu` hidden; `held` all `true` (AD-034 modifier rule).
- `T and B open nothing while a replay plays`: at chapter 2 (`progress: { yan: { chapter: 2 } }`), open `hud-farm`, click `story-replay-prologue`, press `t`, then `b`: `.hero-title` still `Mapa` and the panel still open; after `Pular`, `t` opens Talentos (`.hero-title` `Talentos`). The skill keys are covered by the T13 unit case (the default e2e leader has no unlocked skill).
- `the prologue does not open again after a reload`: close with `Pular`, reload, the welcome screen, click the canvas, `.stage-hud` visible: overlay count 0 (checked after the stage HUD shows and again 1 s later).
- `a battle that loads at chapter 2 opens no prologue and writes nothing`: `progress: { yan: { chapter: 2 } }`: overlay count 0; `seenKey` `null`.
- `a completed campaign opens no prologue`: `progress: { yan: { stage: 1, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } }`: overlay count 0.
- `a stored value that is not a list opens the prologue and is rewritten`: `addInitScript` writes `'{"x":1}'` (before `startBattle`): overlay visible; `seenKey` `'["prologue"]'`.
- `storage that refuses the seen list still opens the prologue and the fight goes on`: `addInitScript` wraps `Storage.prototype.setItem` to throw for `infinity-grove.story-seen` only: overlay visible; `Pular`; `held` all `false`.
- `an account reset back to chapter 1 does not open the prologue`: `addInitScript` writes `'["prologue"]'`, start at chapter 2, reset the account as `accountReset.spec.js` does: `.stage-hud` shows stage 1 of chapter 1, overlay count 0, `seenKey` `'["prologue"]'`.
- `a logout keeps the seen list`: close with `Pular`, reload, `Logout` on the welcome screen: `seenKey` `'["prologue"]'`.

**Gate**: `cd game && npx playwright test e2e/storyScenes.spec.js`
**Done when**:

- [x] The 19 scenarios pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the prologue of the first chapter 1 battle in the browser`

---

#### T15: e2e: the Mapa tab and the replay [x]

**Owner**: test-engineer
**Goal**: The renamed tab, the História group and the replay over the open Mapa (STORY-19, STORY-25 to STORY-28).
**Where**: `game/e2e/storyReplay.spec.js` (new)
**Read first**: `game/e2e/farm.spec.js` (start helper, `COMPLETED`, `farmLabel`), `game/e2e/bossMap.spec.js:1-40`, spec P1 The Mapa tab
**Depends on**: T13
**Requirement**: STORY-19, STORY-25, STORY-26, STORY-27, STORY-28, STORY-29, STORY-48

**Setup**: the default fixture (every catalog id seeded: `["prologue","chapter-1"]`). Start as in `farm.spec.js` (`addInitScript` auto click `off`). `openMapa = (page) => page.getByTestId('hud-farm').click()`. `chip = page.getByTestId('story-replay-prologue')`.

**Tests**: e2e
**Test cases**:

- `the tab and its panel title read Mapa`: `hud-farm` `toHaveText('Mapa')`; after `openMapa`, `.hero-title` `Mapa`.
- `the farm fight label still reads Rever chefe`: completed campaign, pick `farm-entry-miniboss-1`: `.stage-hud` `Rever chefe: Miniboss 1`.
- `the Mapa shows the História group beside the map title`: `farm-story` visible; `.farm-story-label` `História`; `chip` text `Prólogo`, `aria-label` `Assistir Prólogo`; the vertical centres of `farm-story` and `farm-map-title` differ by at most 4 px; the right edge of `farm-story` is at or left of the right edge of `farm-screen`; the two boxes do not overlap; the chip computes `font-family` starting with `Cinzel`, `font-size` `15px`, `height` `32px`, `color` `rgb(244, 230, 200)`, `border-top-color` `rgb(176, 122, 58)`.
- `the Prólogo chip shows before any boss is beaten`: campaign at its start: `farm-empty` and `chip` visible.
- `the Mapa lists Capítulo 1 after Prólogo once it was seen`: the chips of `farm-story` read `[ 'Prólogo', 'Capítulo 1' ]`; `story-replay-chapter-1` has the aria-label `Assistir Capítulo 1`.
- `a player past chapter 1 who never saw the chapter 1 scene finds it on the Mapa`: `addInitScript` writes `'["prologue"]'` before the start, `progress: { yan: { chapter: 3 } }`: `story-replay-chapter-1` visible and no overlay opened on its own.
- `at chapter 1 an unseen chapter 1 scene is not listed`: `addInitScript` writes `'["prologue"]'`, campaign at its start: `story-replay-chapter-1` count 0.
- `the Capítulo 1 chip replays the chapter 1 scene`: click `story-replay-chapter-1`: `.story-kicker` `Capítulo 1 — Final`, `.story-cardtitle` `A Devoradora da Clareira`; `Pular` shows the Mapa again.
- `the Prólogo chip replays the prologue with the fight held and the seen list unchanged`: click `chip`: `story-overlay` visible on the title card (`.story-kicker`); `ClickerGame.paused` `true`; `infinity-grove.story-seen` still `'["prologue"]'`.
- `Pular on a replay shows the Mapa again on the same chapter`: overlay count 0; `.hero-panel` visible; `farm-map-title` `Caminho do Capítulo 1`.
- `Escape on a replay closes only the story`: overlay count 0; `.hero-panel` visible (checked again after 500 ms).
- `the end card of a replay returns to the Mapa`: click through the 6 lines and the end card: overlay count 0; `.hero-panel` visible.
- `the mute choice holds for the next replay`: replay, click `story-mute` (`aria-label` `Ativar som`, `aria-pressed` `true`), `Pular`, replay again: `story-mute` `aria-label` `Ativar som`.

**Gate**: `cd game && npx playwright test e2e/storyReplay.spec.js`
**Done when**:

- [x] The 13 scenarios pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the Mapa tab and the story replay in the browser`

---

#### T16: e2e: stage fit, motion, fonts, audio fallback and focus [ ]

**Owner**: test-engineer
**Goal**: The computed look and the behaviours that need a real browser (STORY-14, STORY-15, STORY-20, STORY-21, STORY-23, STORY-24, STORY-37 to STORY-41).
**Where**: `game/e2e/storyStage.spec.js` (new)
**Read first**: `game/e2e/gameVersion.spec.js` (viewport sizes, bounding boxes), spec P2 Fits every screen, design § Stylesheet
**Depends on**: T13
**Requirement**: STORY-14, STORY-15, STORY-20, STORY-21, STORY-23, STORY-24, STORY-37, STORY-38, STORY-39, STORY-40, STORY-41

**Setup**: `test.use({ storySeen: false })`; the `startBattle` of T14 (copy it). `box = (page) => page.getByTestId('story-stage').boundingBox()`; compare each value with `toBeCloseTo(expected, 0)` (within 1 px). `noPlay = () => page.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('blocked', 'NotAllowedError')); }; })` before `startBattle`.

**Tests**: e2e
**Test cases**:

- `the stage fills a 1280x720 window`: box `{ x: 0, y: 0, width: 1280, height: 720 }`; `story-overlay` `background-color` `rgb(5, 9, 10)`, `position` `fixed`, `z-index` `9`.
- `the stage fits a 1024x768 window with bands above and below`: box `{ x: 0, y: 96, width: 1024, height: 576 }`.
- `a resize takes the new scale`: open at 1280x720, then `setViewportSize({ width: 1920, height: 1080 })`: box `{ x: 0, y: 0, width: 1920, height: 1080 }`.
- `a click on the band above the stage starts the scene`: at 1024x768 (`page.setViewportSize` before `startBattle`), `page.mouse.click(512, 40)` on the title card: `.story-narr` visible.
- `the version label stays visible above the overlay`: `game-version` visible and its computed `z-index` `10`.
- `with reduced motion no animation runs and the motes are hidden`: `page.emulateMedia({ reducedMotion: 'reduce' })` before `startBattle`: `[data-backdrop="forest"]` and `.story-cta` `animation-name` `none`; `.story-tint.is-dark` `transition-duration` `0s`; the first `.story-mote` `display` `none`.
- `without reduced motion the forest drifts and the call blinks`: `[data-backdrop="forest"]` `animation-name` `storyDrift`; `.story-cta` `animation-name` `storyBlink`; the first `.story-mote` `display` `block`.
- `the scene uses Cinzel for names and buttons and Cormorant Garamond for the text`: `.story-kicker`, `.story-cta`, `story-skip` compute a `font-family` starting with `Cinzel`; on line 1 `.story-narr` starts with `"Cormorant Garamond"`; on line 5 `story-speaker` starts with `Cinzel` and `[data-testid="story-text"]` with `"Cormorant Garamond"` and `font-style` `italic`; on line 6 `[data-testid="story-text"]` `font-style` `normal`.
- `a line whose audio cannot play types by the clock and moves on by itself`: `noPlay`; start, complete line 1 with a click, click to line 2: within 6 s `text` reads `Até a noite em que as raízes tremeram.` and `.story-next` is visible; within 3 s more `.story-dot.is-on` count is 3.
- `the dots are hidden on the title and end cards and count the lines`: title: `.story-dots` hidden; line 1: 6 `.story-dot`, 1 with `is-on`; end card: hidden.
- `Enter on the focused hit button starts the scene`: `page.keyboard.press('Enter')`: `.story-narr` visible.
- `Space on the hit button completes a typing line`: `page.keyboard.press('Space')` on line 1: the full line 1 text.
- `the mute button switches its label and pressed state`: `Silenciar`/`false`, click `Ativar som`/`true`, click `Silenciar`/`false`.
- `focus returns to the Prólogo chip when a replay closes`: with the default seed (`test.use({ storySeen: true })` in a nested `describe`), open Mapa, focus and press Enter on `story-replay-prologue`: `story-hit` focused; `Pular`: `story-replay-prologue` focused.

**Gate**: `cd game && npx playwright test e2e/storyStage.spec.js`
**Done when**:

- [ ] The 14 scenarios pass twice in a row with `--workers=1`. No phone viewport (TD-010 dropped; the 390x844 scale is pinned by the T3 unit test).

**Commit**: `test(game): cover the story stage fit, motion, fonts and fallbacks in the browser`

---

#### T20: e2e: the chapter 1 boss scene [ ]

**Owner**: test-engineer
**Goal**: The chapter 1 scene opens once after the chapter 1 boss win and shows its cards, faces, camera, letterbox, veins and dawn in the browser (STORY-44, STORY-46, STORY-47, STORY-49 to STORY-55).
**Where**: `game/e2e/storyChapterOne.spec.js` (new)
**Read first**: `game/e2e/campaignChapters.spec.js:1-40` (a chapter boss of health 1 won by one click: `chapter(1)`, `lastChapter`), the `startBattle` of T14, spec P1 The chapter 1 boss scene and P2 Scene looks as data, design § Chapter 1 data and § Stylesheet
**Depends on**: T13
**Requirement**: STORY-44, STORY-46, STORY-47, STORY-49, STORY-50, STORY-51, STORY-52, STORY-53, STORY-54, STORY-55

**Setup**: `test.use({ storySeen: false })` and an `addInitScript` that writes `'["prologue"]'` (the prologue is not under test). Start at `progress: { yan: { chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 } }` with `definition: chapter(1)` and `lastChapter: 2` (the pattern of `campaignChapters.spec.js`), then one canvas click wins the boss. `noPlay` of T16 (play rejects) in every scenario, so lines type by the clock. `camera = page.getByTestId('story-camera')`.

**Tests**: e2e
**Test cases**:

- `the chapter 1 boss win opens the chapter 1 scene on its title card`: `story-overlay` visible with the class `is-chapter-boss`; `.story-kicker` `Capítulo 1 — Final`; `.story-cardtitle` `A Devoradora da Clareira` with `font-size` `44px`; `.story-logo` `width` `520px`; `.story-cta` `Clique para começar`; `story-hit` aria-label `Começar a cena`; `infinity-grove.story-seen` `'["prologue","chapter-1"]'`; `chapter-hud` `Capítulo 2` under the overlay.
- `the camera pushes in on the narrator and moves to Kael`: start: `camera` `transform` computes the matrix of `translate(0px, -129px) scale(1.18)` (`matrix(1.18, 0, 0, 1.18, 0, -129)`) after its 6 s (`expect.poll`, timeout 8 s), `transition-duration` `6s`; complete line 1, next: `matrix(1.75, 0, 0, 1.75, -551, -350)` within 3 s, `transition-duration` `1.8s`, `transition-timing-function` `cubic-bezier(0.45, 0.05, 0.25, 1)`.
- `the letterbox frames the lines and leaves the cards`: title card: both `.story-bar` `height` `0px`; line 1: `46px` within 2 s; end card: `0px` within 2 s.
- `each line shows its speaker and round face`: click through lines 2 to 7: `story-speaker` reads `Kael`, `Lyra`, `Orina`, `Seraphine`, `Vex`, `Kael`; `story-face` `src` ends with `face-kael.jpg`, `face-lyra.jpg`, `face-orina.jpg`, `face-seraphine.jpg`, `face-vex.jpg`, `face-kael.jpg`, computes `width` `156px` and `border-radius` `50%`; `.story-box.is-face` computes `left` `110px`, `width` `1060px`, `padding-left` `210px`; each full text equals spec P1 chapter 1 AC 1.
- `the veins pulse on the narrator and Orina, the dawn warms Kael's last line`: `.story-tint.is-veins` has `is-on` and `animation-name` `storyVeins` on lines 1 and 4, not on line 2; `.story-tint.is-dawn` has `is-on` on line 7 and on the end card.
- `the end card closes into the chapter 2 fight`: `.story-kicker` `Fim do Capítulo 1`, `.story-endtitle` `A Devoradora da Clareira` (`font-size` `44px`), `.story-endsub` `Ao amanhecer, os cinco guardiões avançam.` (`font-size` `28px`), `.story-cta` `Clique para continuar`, hit `Continuar`; a click: overlay count 0, `.stage-hud` `Stage 1/10  Phase 1/5`, the fight not paused.
- `the chapter 1 scene does not open again`: close with `Pular`, reload, back in the battle at chapter 2: overlay count 0.
- `the scene draws ten motes`: `.story-mote` count 10, the first `left` `120px`, `top` `520px`.
- `with reduced motion the camera jumps`: `page.emulateMedia({ reducedMotion: 'reduce' })`: on line 2 `camera` computes `transition-duration` `0s` and the Kael matrix at once.

**Gate**: `cd game && npx playwright test e2e/storyChapterOne.spec.js`
**Done when**:

- [ ] The 9 scenarios pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the chapter 1 boss scene in the browser`

---

#### T17: Author check of the feature [ ]

**Owner**: test-engineer
**Goal**: The feature's test gate (`.claude/agents/test-engineer.md` § Author check): every AC value pinned, the suites green in CI, mutants killed (STORY-01 to STORY-55).
**Where**: `.specs/features/story-scenes/tasks.md` (this file: the AC table below T17 and the ticks)
**Also changes**: test files only, when a gap or a survivor needs a test
**Read first**: `.claude/agents/test-engineer.md` § Suites and § Author check, `scripts/sensor.mjs:1-25` (mutants format), `CLAUDE.md` § Agent team 4 (CI commands)
**Depends on**: T14, T15, T16, T20
**Requirement**: STORY-01 to STORY-55

**Steps**:

1. Write the AC to assertion table (requirement, spec AC, test `file:line`, exact value) under this task; every CSS value the spec names is asserted with `toHaveCSS` in e2e.
2. Run `cd game && npm test` once locally.
3. Push the branch and get the full suites from CI: `git push origin HEAD:ci/story-scenes`, then `node scripts/ci-wait.mjs ci/story-scenes` (foreground, `timeout: 600000`).
4. Write these 7 mutants (5 on the riskiest new code, 2 on spec-named CSS values) in `<scratchpad>/mutants.json`, each with its narrowest command (cwd `game`):
   - M1 `GS/domain/story/storyPlayback.js`: `cameraOf` always returns the identity `{ x: 0, y: 0, scale: 1, ms: 1800 }` (`npx vitest run src/domain/story/storyPlayback.test.js`).
   - M2 `GS/domain/story/storyScenes.js`: in `replayableScenes`, drop the `position.chapter > N` condition (`npx vitest run src/domain/story/storyScenes.test.js`).
   - M3 `GS/adapters/phaser/ClickerGame.js`: `const held = !this.paused` → `const held = true` (`npx vitest run src/adapters/phaser/ClickerGame.test.js`).
   - M4 `ClickerGame.js`: delete `this.storySeen.markSeen(scene.id);` (`npx vitest run src/adapters/phaser/ClickerGame.test.js`).
   - M5 `VW/storyPlayer.js`: delete `event.stopPropagation();` of the Escape handler (`npx playwright test e2e/storyScenes.spec.js -g "Escape"`).
   - M6 `game/public/style.css`: `.story-overlay { ... z-index: 9; ... }` → `z-index: 11` (`npx playwright test e2e/storyStage.spec.js -g "fills a 1280x720"`).
   - M7 `style.css`: delete `.story-mote { display: none; }` inside the reduced motion block (`npx playwright test e2e/storyStage.spec.js -g "reduced motion"`).
5. Run M1 to M4 locally with `node scripts/sensor.mjs <scratchpad>/mutants-unit.json` (single Vitest files only). Run M5 to M7 in CI: `gh workflow run tests.yml --ref ci/story-scenes -f mutants="$(cat <scratchpad>/mutants-e2e.json)" -f suites=false`, then `node scripts/ci-wait.mjs ci/story-scenes --event workflow_dispatch`. Sensor exit 2 means the run is invalid.
6. Every survivor gets a test; rerun until 0 survive.

**Tests**: unit and e2e (the gate of the feature)
**Gate**: `node scripts/ci-wait.mjs ci/story-scenes` exits 0 (suites green) and the sensor runs report 7 of 7 killed
**Done when**:

- [ ] Every AC of the spec has a row with `file:line` and the spec value; 0 gaps.
- [ ] The CI suites of the branch are green (backend untouched, game unit, the 12 e2e shards).
- [ ] 7 of 7 mutants killed; `git status --porcelain` is as before the local sensor run.

**Commit**: `test(game): record the story scenes author check`

---

### Phase 6: UI review

#### T18: UI review of the story overlay and the Mapa [ ]

**Owner**: ui-artist
**Goal**: The player-visible changes match the design reference and read well on the desktop (STORY-09, STORY-16, STORY-21, STORY-22, STORY-25, STORY-26, STORY-37, STORY-39).
**Where**: `.specs/features/story-scenes/ui-review.html` (new, from the ui-review template named under Read first)
**Also changes**: `game/ui-review/storyScenes.shots.js` (new), `.specs/features/story-scenes/ui-review/*.png`
**Read first**: `game/ui-review/blackAwarenessStaff.shots.js` (shots pattern), `game/ui-review/support/shots.js`, `.claude/templates/ui-review.html`, `design-reference.dc.html` and `design-reference-chapter-01.dc.html` (open them in a browser for the target look), spec D15, D16, D19
**Depends on**: T17
**Requirement**: STORY-09, STORY-16, STORY-21, STORY-22, STORY-25, STORY-26, STORY-37, STORY-39, STORY-46, STORY-47, STORY-49, STORY-50, STORY-51, STORY-52, STORY-55

**Shots** (the `desktop` project of `ui-review.config.js`, 1280x720, is the review target; the config also writes `-phone` files, which are not reviewed because TD-010 was dropped and the game targets PC; the shots file uses `@playwright/test` directly, so it writes `infinity-grove.story-seen` itself: absent for the overlay shots, `'["prologue"]'` for the Mapa shots; `HTMLMediaElement.prototype.play` rejects so every line types by the clock, and each line is completed by a click before its shot):

1. `01-title` the title card; 2. `02-narrator-typing` line 1 halfway (after 6 s on the clock); 3. `03-narrator-complete` line 1 complete with the arrow; 4. `04-dark` line 2 complete; 5. `05-red` line 3 complete (red tint on); 6. `06-map` line 4 complete (map and gold); 7. `07-voice` line 5 complete (orb, plate); 8. `08-character` line 6 complete (Seraphine portrait, plate); 9. `09-end` the end card; 10. `10-muted` the bar with the mute on; 11. `11-mapa` the Mapa screen with the História group (chapter 1, no boss beaten); 12. `12-mapa-chapters` the Mapa at chapter 3 with the chapter chips and the História group; 13. `13-reduced-motion` the title card with reduced motion emulated; 14. `14-bands-1024` the title card at 1024x768 (`page.setViewportSize`), bands above and below; 15. `15-ch1-title` the chapter 1 title card; 16. `16-ch1-narrator` chapter 1 line 1 complete after its 6 s push-in (veins on, bars); 17. `17-ch1-kael` line 2 complete after the 1.8 s move (face, wide box); 18. `18-ch1-orina` line 4 complete (veins); 19. `19-ch1-vex` line 6 complete; 20. `20-ch1-dawn` line 7 complete (dawn); 21. `21-ch1-end` the chapter 1 end card; 22. `22-mapa-two-chips` the Mapa with `Prólogo` and `Capítulo 1`. The chapter 1 shots start at the chapter 1 boss (campaign `chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS'`, a boss of health 1) with `'["prologue"]'` stored.

**What to check**:

1. Each shot against the design reference: colours (`#f3dc95`, `#c9a95a`, `#05090a`), plate, box, scrim, vignette, orb, portrait glow, tints; text not clipped, the ghost text never visible.
2. The Seraphine portrait at 560 px (D19): blur or pixelation, and whether a larger file is needed (owner art). The chapter 1 faces (256x256 files drawn at 156 px) and the clearing at camera scale 1.8: each face centred in its frame, the camera framing each speaker as in `design-reference-chapter-01.dc.html`.
7. Chapter 1 cards against the chapter design (44 px title, 520 px logo), the end card scrim drawn as the `dark` tint (D30: 0.55 instead of 0.6), the letterbox bars, the veins and the dawn.
3. The bar (dots, `Pular`, mute): aligned, 44 px targets, readable over every backdrop.
4. `14-bands-1024`: the stage centred with even dark bands of 96 px, nothing of the game showing through.
5. The Mapa: the História group level with the title, not touching the chapter chips or the map, the tab reads `Mapa` with its current icon and the rail keeps its six buttons with the T and B chips (AD-034; spec Q6: say if the icon should change).
6. The version label visible over the overlay in every shot.

**Tests**: none (review artifact; the e2e of T14 to T16 pin the values)
**Gate**: `cd game && npm run ui:shots -- storyScenes`
**Done when**:

- [ ] `ui-review.html` has a verdict (APROVADO or REPROVADO) and every finding is listed for the product owner to turn into tasks.

**Commit**: `docs(ui): review the story overlay and the Mapa`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 fixture option + its check | ✅ Granular |
| T2 | 1 module, 2 functions | ✅ Granular |
| T3 | 1 module (state machine) | ✅ Granular |
| T4 | 1 module (catalog rules) | ✅ Granular |
| T5 | 1 data module + file check + assets | ⚠️ OK (cohesive: data and its files) |
| T6 | 1 storage adapter | ✅ Granular |
| T19 | 1 fixture change + 1 re-pinned case | ✅ Granular |
| T7 | 1 view | ✅ Granular |
| T8 | 1 controller | ✅ Granular |
| T9 | 1 stylesheet block + font link | ⚠️ OK (cohesive) |
| T10 | 1 composition change | ✅ Granular |
| T11 | 1 view change | ✅ Granular |
| T12 | 1 screen change + 5 re-pinned assertions | ✅ Granular |
| T13 | 1 scene change | ✅ Granular |
| T14 | 1 e2e file | ✅ Granular |
| T15 | 1 e2e file | ✅ Granular |
| T16 | 1 e2e file | ✅ Granular |
| T20 | 1 e2e file | ✅ Granular |
| T17 | author check | ✅ Granular |
| T18 | review | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | None | none | ✅ Match |
| T3 | None | none | ✅ Match |
| T4 | None | none | ✅ Match |
| T5 | T2, T4 | T2 → T5, T4 → T5 | ✅ Match |
| T6 | None | none | ✅ Match |
| T19 | T5 | T5 → T19 | ✅ Match |
| T7 | T2, T3 (Phase 2) | none inside Phase 3 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T7 | T7 → T9 | ✅ Match |
| T10 | T5, T6, T8 (earlier phases) | none inside Phase 4 | ✅ Match |
| T11 | None | none | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T4, T19 (Phase 2), T10, T12 | T10 → T13, T12 → T13 | ✅ Match |
| T14 | T1, T9, T13 (earlier phases) | none inside Phase 5 | ✅ Match |
| T15 | T13 (Phase 4) | none inside Phase 5 | ✅ Match |
| T16 | T13 (Phase 4) | none inside Phase 5 | ✅ Match |
| T20 | T13 (Phase 4) | none inside Phase 5 | ✅ Match |
| T17 | T14, T15, T16, T20 | T14 → T17, T15 → T17, T16 → T17, T20 → T17 | ✅ Match |
| T18 | T17 (Phase 5) | none inside Phase 6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | e2e fixture | e2e | e2e | ✅ OK |
| T2 | Domain | unit | unit | ✅ OK |
| T3 | Domain | unit | unit | ✅ OK |
| T4 | Domain | unit | unit | ✅ OK |
| T5 | Domain data + files on disk | unit | unit | ✅ OK |
| T6 | Storage adapter | unit | unit | ✅ OK |
| T19 | e2e fixture | e2e | e2e | ✅ OK |
| T7 | View | unit | unit | ✅ OK |
| T8 | View | unit | unit | ✅ OK |
| T9 | Stylesheet and fonts | e2e | none (pinned by T15, T16) | ⚠️ Project convention: `test-engineer` owns e2e (CLAUDE.md § Agent team); CSS cannot be unit-tested in jsdom. Mutants M16 to M18 of T17 prove the e2e pins it |
| T10 | Composition | unit | unit | ✅ OK |
| T11 | View | unit | unit | ✅ OK |
| T12 | Scene | unit | unit and e2e | ✅ OK |
| T13 | Scene | unit | unit | ✅ OK |
| T14 | e2e | e2e | e2e | ✅ OK |
| T15 | e2e | e2e | e2e | ✅ OK |
| T16 | e2e | e2e | e2e | ✅ OK |
| T20 | e2e | e2e | e2e | ✅ OK |
| T17 | author check (CI suites, 7 mutants) | unit, e2e | unit and e2e | ✅ OK |
| T18 | review artifact | none | none | ✅ OK |
