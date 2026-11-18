# Game Version Label Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/game-version/spec.md`
**Design**: `.specs/features/game-version/design.md`
**Status**: Done and accepted by the product owner on 2026-11-18 (§ Acceptance). The owner approved the spec rulings Q1 to Q6 and T1 to T5 on 2026-11-18 (`469342c`). T1 to T5 are done (`f1e820a`, `9fac504`, `8fafe1a`, `0cf9f4f`, `081a3ff`); the UI review (T5) is APROVADO; Verifier round 1 (`validation.md`, `582354a`) is PASS: 13 of 13 ACs, 11 of 11 mutants killed. Next: the `gitops` release `v0.4.1`.

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`). No task edits any of them.
- Mark the task `[x]` in this file in the same commit, and set the task's requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **No task edits `game/package.json`.** The version stays `0.0.0` during development; `gitops` sets `"version": "0.4.1"` in the release commit (spec D11). Every test reads the version from `game/package.json`, never a literal `0.0.0` or `0.4.1`.
- Never weaken an existing test. No existing test is changed by this feature.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times (`.specs/STATE.md` § Handoff notes).
- Code style of `game/src`: 4-space indent, braces on their own line for functions with a body (see `game/src/adapters/phaser/views/stageLabel.js`), `//  ` comments with two spaces.

After T5: the `verifier` agent runs (round 1 with the full suites, `.claude/agents/verifier.md`), the product owner accepts or rejects, then `gitops` releases `v0.4.1` (version bump in `game/package.json`, `report.html`, `CHANGELOG.md`, tag) and checks that production shows `v0.4.1`.

---

## Acceptance (product-owner, 2026-11-18)

**Verdict: ACCEPTED.** All 5 tasks are done, Verifier round 1 gives PASS and the ui-artist review (T5) gives APROVADO with 0 findings. No new task of this feature.

**Evidence read**: `validation.md` round 1 (`582354a`, diff range `24c53fc..081a3ff`): 13 of 13 ACs matched to the spec outcome with `file:line` evidence, 4 of 4 unit-level ACs with unit tests, 12 of 12 player-visible ACs with e2e (GV-08 shows nothing on screen by definition), 4 of 4 edge cases, 0 spec-precision gaps. Sensor: 11 mutants over the four production files, 11 killed, 0 survived, 0 invalid, isolation ok. Backend 1013/1013, game unit 1781/1781 (+17), e2e 377/381 (+7): the 4 failures (`dragEquip.spec.js:586`, `:640`, `skills.spec.js:49`, `wake.spec.js:56`) each passed alone twice with `--workers=1`, none reads the label, so they are load flakes (the last two added to the known list in `STATE.md` Handoff). `npm run build` exits 0 and the bundle mounts the label before `new Game`. No test removed or weakened; `game/package.json` still reads `0.0.0` (D11); no backend change, no Flyway migration (AD-016 not triggered). `ui-review.html` (`081a3ff`): APROVADO, 11 shots (6 desktop, 5 phone), 0 findings. I checked `06-battle-4x3-desktop.png` myself: the label sits under the battle bar, clear of its ring and of `Farm boss`.

**Spec goals** (`spec.md`, Goals):

| Goal | Evidence (`validation.md` round 1) | Status |
| --- | --- | --- |
| 1. The version in the bottom-right corner of every screen (loading bar, splash, login, battle) | GV-02 to GV-05 (`gameVersion.spec.js:88`, `:108`, `:116`, `:127`), GV-06 one label on each (`:22`), GV-09 corner 8/4 px ±1 at three viewports (`:30-31`); shots 01 to 05 desktop and phone | Met |
| 2. The version is `game/package.json` `version` of the build's commit, no manual step besides the `gitops` bump | GV-07 (`viteConfig.test.js:12`, `:18`, both modes; mutants C1, C2, M1 killed), every e2e `toHaveText(LABEL)` with `LABEL` read from `package.json`; GV-08 blank version adds no label (`versionLabel.test.js:19-36`, `:68-81`) | Met |
| 3. Covers no control or game text at 1280x720 and 390x844, never takes a click | GV-10 right of the canvas (`:124`, `:134`), GV-11 below the canvas and 12 px tall (`:156`, `:157`), GV-12 computed style (`:70-84`), GV-13 click through at 1024x768 skips the splash (`:179-191`; mutant S1 killed) | Met |

**Success criteria**: screenshots of the four screens at 1280x720 and 390x844 show `v<version>` in the corner (e2e and `ui-review/` shots 01 to 05); a click on the label at 1024x768 skips the splash before 1650 ms (`gameVersion.spec.js:188-190`). Both met. The production check (`v0.4.1` on the Worker) belongs to the `gitops` release, whose commit makes the version bump (D11); it stays open until then.

**Edits made at acceptance** (Verifier Fix 1, docs only):

1. Spec traceability GV-01 to GV-13 set to Verified; Goals and the two met Success Criteria ticked.
2. Spec Assumptions D4 to D10 and D12 to D16 set from `n (Q<n>)` to `y (Q<n>)`: the owner answered yes to Q1 to Q6 on 2026-11-18 (`469342c`).
3. This file: status line set to done and accepted; T5 heading and the Done-when boxes of T1, T2, T3 and T5 ticked; T4's Preloader wait recorded as an accepted deviation.
4. `design.md` status line set to done and accepted.
5. `STATE.md`: Handoff set to done and accepted, next step `gitops`; `skills.spec.js:49` and `wake.spec.js:56` added to the known load flakes.

**Waiting for the owner's confirmation**: nothing for this feature. Q1 to Q6 are confirmed.

**Next step**: `gitops` releases `v0.4.1`: the release commit sets `game/package.json` `version` to `0.4.1`, push, deploy check (`publish.sh` running, the commit on `origin/main`), production check (`v0.4.1` in the corner of `https://infinity-grove.yan-tapajos.workers.dev/`), `report.html`, `CHANGELOG.md`, release tag. The coverage summaries in `coverage/` ran at `081a3ff`; whether the version bump reuses them is the `gitops` call (`validation.md` § Summary).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), product owner rules (unit for service/domain, e2e for every player-visible behaviour), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome 1280x720, fake backend `game/e2e/support/fakeBackend.js`); no coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Vite config (`game/vite.config.js` `define`) | unit (node environment) | `__GAME_VERSION__` for the dev server and the Worker build; the existing plugin and port kept | `game/src/viteConfig.test.js` | `cd game && npm test` |
| Game view (`views/versionLabel.js`) | unit (jsdom) | Every branch of `versionText` and `mountVersionLabel` with the exact strings of the spec | `game/src/adapters/phaser/views/versionLabel.test.js` | `cd game && npm test` |
| Composition root (`main.js`) and stylesheet | e2e | Mount before the game, every computed style value and position of GV-09 to GV-13 | `game/e2e/gameVersion.spec.js` | `cd game && npx playwright test e2e/gameVersion.spec.js` |
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion GV-01 to GV-07, GV-09 to GV-13 and the 4:3 edge case | `game/e2e/gameVersion.spec.js` | `cd game && npx playwright test e2e/gameVersion.spec.js` |
| UI review artifact (`ui-review.html`, `ui-review/gameVersion.shots.js`) | none | Reviewed by the `ui-artist`, read by the product owner at acceptance; not a test of the game | `.specs/features/game-version/ui-review.html`, `game/ui-review/gameVersion.shots.js` | `cd game && npm run ui:shots -- gameVersion` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| Full | After tasks with e2e tests | `cd game && npm test && npx playwright test <files of the task>` |
| Build | After each phase | `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every arrow is a `Depends on`.

### Phase 1: Version constant and label (game-dev)

T1 and T2 touch different files and may run in either order; T3 needs both.

```
T1 → T3
T2 → T3
```

### Phase 2: e2e (test-engineer)

```
T3 → T4
```

### Phase 3: UI review (ui-artist)

```
T4 → T5
```

---

## Task Breakdown

### T1: Define `__GAME_VERSION__` from package.json in the Vite config [x]

**Owner**: game-dev
**Goal**: The dev server and every build replace `__GAME_VERSION__` with the JSON string of the `version` of `game/package.json` (GV-07).
**Where**: `game/vite.config.js`
**Also changes**: `game/src/viteConfig.test.js` (new)
**Read first**: `game/vite.config.js` (whole file, 37 lines), `game/vitest.config.js` (jsdom environment, `src/**/*.test.js`), `game/package.json:3` (`"version": "0.0.0"`), `.specs/features/game-version/design.md` § Components `game/vite.config.js`
**Depends on**: None
**Requirement**: GV-07

**Contract** (`game/vite.config.js`, the whole new file except the unchanged `proxy`, `plugins`, `server` and `preview` values):

```js
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';

//  The version of the game (spec game-version): read when the dev server starts or the build runs, so a built Worker shows the
//  version of the commit it was built from. gitops sets it in every release commit. src/main.js shows it in the corner of the page.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig(({ mode }) => {
    //  ... unchanged: env, proxy ...

    return {
        //  __GAME_VERSION__ becomes the string literal of the version in every game module (a missing version becomes '', which shows no label)
        define: {
            __GAME_VERSION__: JSON.stringify(version ?? '')
        },
        //  ... unchanged: plugins, server, preview ...
    };
});
```

**Steps**:

1. Add `import { readFileSync } from 'node:fs';` as the first import of `game/vite.config.js`.
2. Add the comment and the `const { version } = ...` line between the imports and `export default`.
3. Add the `define` key (with its comment) as the first key of the returned object, before the `plugins` comment.
4. Create `game/src/viteConfig.test.js` with the test cases below. Its first line is `// @vitest-environment node` (the config imports `vite`, which needs Node, not jsdom). Read the expected version in the test with `JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version`; import the config with `import viteConfig from '../vite.config.js';` (`defineConfig` returns the function as it is).

**Tests**: unit
**Test cases** (`game/src/viteConfig.test.js`, `describe('vite config')`):

- `defines __GAME_VERSION__ as the package.json version for the dev server`: `viteConfig({ mode: 'development', command: 'serve' }).define` `toEqual` `{ __GAME_VERSION__: JSON.stringify(<version read from package.json>) }`.
- `defines __GAME_VERSION__ as the package.json version for the Worker build`: `viteConfig({ mode: 'pages', command: 'build' }).define` `toEqual` `{ __GAME_VERSION__: JSON.stringify(<version read from package.json>) }`.
- `keeps the istanbul plugin and the dev server port`: `viteConfig({ mode: 'development', command: 'serve' })` has `plugins.length` 1 and `server.port` 8081.

**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The 3 new cases pass and every earlier unit test passes unchanged.
- [x] `npm run build` exits 0.
- [x] `game/package.json` is unchanged (`git diff --quiet game/package.json` exits 0).

**Commit**: `feat(game): define the game version from package.json at build time`

---

### T2: Version label view (views/versionLabel.js) [x]

**Owner**: game-dev
**Goal**: The text rule `v<version>` and the single DOM label `div.game-version` (GV-01, GV-06, GV-08).
**Where**: `game/src/adapters/phaser/views/versionLabel.js` (new)
**Also changes**: `game/src/adapters/phaser/views/versionLabel.test.js` (new)
**Read first**: `game/src/adapters/phaser/views/dom.js:1-25` (`el`: `testid` becomes `data-testid`), `game/src/adapters/phaser/views/stageLabel.js` and `stageLabel.test.js` (pattern of a small view and its test), `.specs/features/game-version/design.md` § Components `versionLabel.js`
**Depends on**: None
**Requirement**: GV-01, GV-06, GV-08

**Contract**:

```js
import { el } from './dom';

//  The version of the game in the bottom-right corner of the page (spec game-version). It sits in document.body, outside the scaled
//  canvas, so it keeps its size on a phone and stays on every scene; style.css .game-version places it and lets clicks through.
export const VERSION_TESTID = 'game-version';

//  'v' and the version without the whitespace around it; null when the version is not a string or is blank
export const versionText = (version) =>
{
    if (typeof version !== 'string' || version.trim() === '')
    {
        return null;
    }

    return `v${version.trim()}`;
};

//  Appends the label to document.body, or rewrites the text of the label already there (the page holds one). Adds nothing for a blank version.
export const mountVersionLabel = (version) =>
{
    const text = versionText(version);

    if (text === null)
    {
        return null;
    }

    const existing = document.querySelector(`[data-testid="${VERSION_TESTID}"]`);

    if (existing)
    {
        existing.textContent = text;

        return existing;
    }

    const label = el('div', 'game-version', text, { testid: VERSION_TESTID });

    document.body.append(label);

    return label;
};
```

**Steps**:

1. Create `versionLabel.js` with the contract above.
2. Create `versionLabel.test.js` with the test cases below; `beforeEach(() => { document.body.innerHTML = ''; })` in the `mountVersionLabel` block.

**Tests**: unit
**Test cases** (`versionLabel.test.js`):

`describe('versionText')`:

- `writes v before the version`: `versionText('0.4.1')` → `'v0.4.1'`.
- `writes v0.0.0 for the unreleased version`: `versionText('0.0.0')` → `'v0.0.0'`.
- `drops the whitespace around the version`: `versionText(' 0.4.1 ')` → `'v0.4.1'`.
- `gives no text for an empty version`: `versionText('')` → `null`.
- `gives no text for a version of spaces`: `versionText('   ')` → `null`.
- `gives no text for an undefined version`: `versionText(undefined)` → `null`.
- `gives no text for a null version`: `versionText(null)` → `null`.
- `gives no text for a version that is not a string`: `versionText(41)` → `null`.

`describe('mountVersionLabel')`:

- `appends one label with the version text after the elements of the body`: body holds `<div id="app"></div>`; `mountVersionLabel('0.4.1')` returns an element that is `document.body.lastElementChild`, `document.body.children[0].id` is `'app'`, `tagName` `'DIV'`, `className` `'game-version'`, `getAttribute('data-testid')` `'game-version'`, `textContent` `'v0.4.1'`, and `document.querySelectorAll('[data-testid="game-version"]').length` is 1.
- `rewrites the text of the label on a second mount and adds none`: `const first = mountVersionLabel('0.4.0'); const second = mountVersionLabel('0.4.1');` → `second === first`, `first.textContent` `'v0.4.1'`, `document.querySelectorAll('[data-testid="game-version"]').length` 1.
- `adds no label for an empty version`: `mountVersionLabel('')` → `null`; `document.querySelectorAll('[data-testid="game-version"]').length` 0.
- `adds no label for an undefined version`: `mountVersionLabel(undefined)` → `null`; count 0.
- `adds no label for a version of spaces`: `mountVersionLabel('   ')` → `null`; count 0.
- `names the test id game-version`: `VERSION_TESTID` → `'game-version'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 14 new cases pass and every earlier unit test passes unchanged (`src/architecture.test.js` included: the file imports only `./dom`).

**Commit**: `feat(game): add the version label view`

---

### T3: Mount the label and style it in the bottom-right corner [x]

**Owner**: game-dev
**Goal**: `main.js` mounts the label before the Phaser game and `style.css` fixes it 8 px from the right and 4 px from the bottom of the viewport, small, dim and click-through (GV-01 to GV-05, GV-07, GV-09 to GV-13).
**Where**: `game/src/main.js`
**Also changes**: `game/public/style.css`
**Read first**: `game/src/main.js` (whole file, 64 lines; `const game = new Game(config);` at about `:44`), `game/public/style.css:1-95` (`:root` tokens `--font-body`, `--parchment-300`, `--wood-900`) and the last 30 lines (the new rule goes after `.hero-star-power`), `.specs/features/game-version/design.md` § Visual Spec
**Depends on**: T1, T2
**Requirement**: GV-01, GV-02, GV-03, GV-04, GV-05, GV-07, GV-09, GV-10, GV-11, GV-12, GV-13

**Contract**:

`game/src/main.js`:

```js
//  with the other imports, in alphabetical order of the path after './adapters/phaser/Splash'
import { mountVersionLabel } from './adapters/phaser/views/versionLabel';

//  right before `const game = new Game(config);`
//  The version in the bottom-right corner of every screen (spec game-version), in the page before the first frame of the loading bar.
//  __GAME_VERSION__ is replaced by vite.config.js define with the version of game/package.json.
mountVersionLabel(__GAME_VERSION__);
```

`game/public/style.css`, appended at the end of the file (one blank line before the comment):

```css
/* ══ Game version in the bottom-right corner of the page (spec game-version) ══ */
/* Fixed to the viewport, outside the scaled canvas: 12 px on every screen, in the letterbox at 1280x720 and 390x844, under the battle
   bar on a 4:3 screen. Parchment at 60 % over --wood-900 reads rgb(149 132 102), contrast 5.1:1. Clicks pass to the game. */
.game-version {
    position: fixed;
    right: 8px;
    bottom: 4px;
    z-index: 10;
    margin: 0;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 12px;
    line-height: 12px;
    letter-spacing: 0.04em;
    color: var(--parchment-300);
    opacity: 0.6;
    text-shadow: 0 1px 2px var(--wood-900);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
}
```

**Steps**:

1. Add the import to `main.js`.
2. Add the comment and `mountVersionLabel(__GAME_VERSION__);` on the line before `const game = new Game(config);`.
3. Append the `.game-version` rule to the end of `style.css`.
4. Run the gate.

**Tests**: e2e regression of the existing `splash.spec.js` and `auth.spec.js` (the label must not change the start of the game); the new e2e of the label is T4.
**Gate**: full - `cd game && npm test && npm run build && npx playwright test e2e/splash.spec.js e2e/auth.spec.js`
**Done when**:

- [x] `npm test` passes unchanged, `npm run build` exits 0, and every test of `e2e/splash.spec.js` and `e2e/auth.spec.js` passes.
- [x] `grep -c "mountVersionLabel(__GAME_VERSION__);" game/src/main.js` prints 1 and the line comes before `const game = new Game(config);`.
- [x] `grep -c "^\.game-version {" game/public/style.css` prints 1.
- [x] `game/package.json` is unchanged.

**Commit**: `feat(game): show the game version in the bottom-right corner`

---

### T4: e2e of the version label [x]

**Owner**: test-engineer
**Goal**: One Playwright scenario per player-visible criterion: the label on the loading bar, the splash, the login form and the battle, its corner and size at 1280x720 and 390x844, its style, and a click through it at 1024x768 (GV-01 to GV-07, GV-09 to GV-13).
**Where**: `game/e2e/gameVersion.spec.js` (new)
**Read first**: `game/e2e/splash.spec.js:1-40` (`waitForSplash`, `splashState` with `endedAt`, `SPLASH_END_MS = 3300`), `game/e2e/support/game.js` (`openMainMenu`, `activeSceneKeys`, `fillCredentials`), `game/e2e/bossMap.spec.js:1-20` (`startGame` pattern), `game/e2e/uiRedesign.spec.js:2131` (`test.use` of a phone viewport), `game/e2e/support/coverage.js` (import `test` and `expect` from it), `.specs/features/game-version/spec.md` (GV-01 to GV-13)
**Depends on**: T3
**Requirement**: GV-01, GV-02, GV-03, GV-04, GV-05, GV-06, GV-07, GV-09, GV-10, GV-11, GV-12, GV-13

**Contract** (top of the file):

```js
import { readFileSync } from 'node:fs';
import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The label reads the version of game/package.json (spec game-version, GV-07); gitops bumps it on every release, so no literal here
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const LABEL = `v${version.trim()}`;
const BOOT_TIMEOUT = 30_000;
const SPLASH_END_MS = 3300;

const label = (page) => page.getByTestId('game-version');
const canvasBox = (page) => page.locator('#game-container canvas').boundingBox();
const waitForScene = (page, key) =>
    page.waitForFunction((k) => window.__PHASER_GAME__?.scene.isActive(k), key, { timeout: BOOT_TIMEOUT });
const splashEndedAt = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Splash').endedAt);

//  The label is visible, reads the version and is the only one on the page
const expectOneLabel = async (page) => {
    await expect(label(page)).toBeVisible();
    await expect(label(page)).toHaveText(LABEL);
    await expect(label(page)).toHaveCount(1);
};

//  Right edge 8 px and bottom edge 4 px from the viewport edges, ±1 px (GV-09)
const expectInCorner = async (page) => {
    const box = await label(page).boundingBox();
    const viewport = page.viewportSize();

    expect(Math.abs(viewport.width - (box.x + box.width) - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(viewport.height - (box.y + box.height) - 4)).toBeLessThanOrEqual(1);

    return box;
};

const startGame = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' } });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();
};
```

**Steps**:

1. Create the file with the contract above and the scenarios below, in three `test.describe` blocks: `Game version` (default Desktop Chrome viewport 1280x720), `Game version on a phone` (`test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })`), `Game version on a 4:3 screen` (`test.use({ viewport: { width: 1024, height: 768 } })`).
2. Run the gate; then run the file twice more with `--workers=1` to confirm no flake.

**Tests**: e2e
**Test cases** (`game/e2e/gameVersion.spec.js`):

`describe('Game version')` (1280x720):

- `shows the version on the loading screen` (GV-01, GV-02, GV-06, GV-07): before `page.goto`, hold the background image: `let release; const held = new Promise((resolve) => { release = resolve; }); await page.route('**/assets/background.png', async (route) => { await held; await route.continue(); });`; `await mockBackend(page); await page.goto('/'); await waitForScene(page, 'Preloader');` → `expectOneLabel(page)`; then `release(); await waitForScene(page, 'Splash');`.
- `shows the version on the splash` (GV-03, GV-06): `mockBackend(page)`, `page.goto('/')`, `waitForScene(page, 'Splash')` → `expectOneLabel(page)`.
- `shows the version on the login form, right of the canvas` (GV-04, GV-06, GV-09, GV-10): `mockBackend(page)`, `openMainMenu(page)` → `expectOneLabel(page)`; `const box = await expectInCorner(page)`; `const canvas = await canvasBox(page)`; `box.x` ≥ `canvas.x + canvas.width`.
- `shows the version in the battle, right of the canvas` (GV-05, GV-06, GV-09, GV-10): `startGame(page)` → `expectOneLabel(page)`; `expectInCorner(page)`; `box.x` ≥ `canvas.x + canvas.width`.
- `draws the version small, dim and click-through in the Grove style` (GV-12): `mockBackend(page)`, `openMainMenu(page)`, then `expectGroveStyle(page)`: a helper declared under the contract that reads `getComputedStyle` of the label in one `evaluate` and expects `position` `'fixed'`, `fontFamily` matches `/^"?Figtree"?,/`, `fontWeight` `'600'`, `fontSize` `'12px'`, `lineHeight` `'12px'`, `letterSpacing` `'0.48px'`, `color` `'rgb(230, 208, 162)'`, `opacity` `'0.6'`, `textShadow` `'rgb(28, 18, 12) 0px 1px 2px'`, `whiteSpace` `'nowrap'`, `zIndex` `'10'`, `pointerEvents` `'none'`, `userSelect` `'none'`.

`describe('Game version on a phone')` (390x844):

- `shows the version below the canvas at full size` (GV-04, GV-09, GV-11, GV-12): `mockBackend(page)`, `openMainMenu(page)` → `expectOneLabel(page)`; `const box = await expectInCorner(page)`; `box.y` ≥ `canvas.y + canvas.height`; `Math.abs(box.height - 12)` ≤ 1; `expectGroveStyle(page)` (the same 13 values as the desktop scenario).

`describe('Game version on a 4:3 screen')` (1024x768):

- `lets a click on the label through to the game` (GV-09, GV-13): `mockBackend(page)`, `page.goto('/')`, `waitForScene(page, 'Splash')`; `const box = await expectInCorner(page)`; the label lies over the canvas: `box.x` ≥ `canvas.x`, `box.y + box.height` ≤ `canvas.y + canvas.height`; `const x = box.x + box.width / 2, y = box.y + box.height / 2`; `page.evaluate(([px, py]) => { const hit = document.elementFromPoint(px, py); return { tag: hit.tagName, inGame: !!hit.closest('#game-container') }; }, [ x, y ])` → `{ tag: 'CANVAS', inGame: true }`; `await page.mouse.click(x, y)`; `await expect.poll(() => splashEndedAt(page), { timeout: 5_000 }).not.toBeNull()`; `splashEndedAt(page)` < `SPLASH_END_MS / 2`; `.auth-form` visible within `BOOT_TIMEOUT`.

**Gate**: full - `cd game && npx playwright test e2e/gameVersion.spec.js`
**Done when**:

- [x] The 7 scenarios pass, and pass again twice with `--workers=1`.
- [x] No literal `0.0.0` or `0.4.1` appears in `game/e2e/gameVersion.spec.js`.

**Deviation (accepted at acceptance, 2026-11-18)**: the loading scenario does not call `waitForScene(page, 'Preloader')` as the first test case above says. It waits for the Preloader's drawn bar instead (`game/e2e/gameVersion.spec.js:100`, `scene.getScene('Preloader').children.list.length > 0`), because a scene that is still loading is never active: while `preload()` waits for the held `background.png`, `isActive('Preloader')` stays false. The bar is drawn in `Preloader.init()`, so the wait proves the loading screen shows (`validation.md` § Code Quality).

**Commit**: `test(game): e2e of the game version label`

---

### T5: UI review of the version label [x]

**Owner**: ui-artist
**Goal**: Check the label on every screen at 1280x720, 390x844 and 1024x768 against design.md § Visual Spec and write the review (GV-09, GV-10, GV-11, GV-12, visual part).
**Where**: `.specs/features/game-version/ui-review.html` (new, built from the template listed under Read first)
**Also changes**: `game/ui-review/gameVersion.shots.js` (new; `npm run ui:shots -- gameVersion` saves into `.specs/features/game-version/ui-review/`)
**Read first**: `.claude/templates/ui-review.html`, `game/ui-review/supabasePostgres.shots.js` (pattern: `watch`, `report`, `shot`), `game/ui-review/support/shots.js`, `game/ui-review.config.js` (projects `desktop` 1280x720 and `phone` 390x844 at device scale 2), `.specs/features/game-version/design.md` § Measured geometry and § Visual Spec, `.specs/features/game-version/spec.md`
**Depends on**: T4
**Requirement**: GV-09, GV-10, GV-11, GV-12

**Contract**: `gameVersion.shots.js` (fake backend, desktop and phone projects) saves, in this order:

1. `01-loading`: the loading bar, with `**/assets/background.png` held as in T4's loading scenario (release it after the shot).
2. `02-splash`: the splash while it plays (shoot after the logo is visible, before it ends).
3. `03-login`: the login form after the splash is gone (`openMainMenu`).
4. `04-battle`: the battle after login (`hud-farm` visible), pointer moved to `(0, 0)`.
5. `05-battle-bag`: the battle with the Mochila open (`page.getByTestId('hud-bag').click()`).
6. `06-battle-4x3`: desktop project only (`if (testInfo.project.name === 'desktop')`): `page.setViewportSize({ width: 1024, height: 768 })`, wait 500 ms for the FIT resize, shoot the battle.

**Steps**:

1. Write `gameVersion.shots.js`.
2. `cd game && npm run ui:shots -- gameVersion`.
3. Check each shot: the label reads `v<version>` in the bottom-right corner on every screen; at 1280x720 it lies in the right letterbox and at 390x844 in the bottom letterbox, touching no part of the canvas; at 1024x768 it lies under the battle bar with a visible gap above it and touches neither the bar's ring nor the `Farm boss` button; it reads dimmer than every HUD text and still legible (desktop and phone); the colour is the parchment of the Grove theme, no stray colour; the text is one line and not clipped.
4. Write `ui-review.html` with the verdict (APROVADO or ALTERAÇÕES), every shot, and one numbered finding per problem (selector, what is wrong, exact fix). Findings become new tasks for the product owner.

**Tests**: none (review artifact; the e2e of the behaviour is T4)
**Gate**: `test -s .specs/features/game-version/ui-review.html && cd game && npm run ui:shots -- gameVersion`
**Done when**:

- [x] `ui-review.html` exists with a verdict, 5 screenshots for the phone project and 6 for the desktop project, and the checks of step 3.
- [x] Each finding names a selector and an exact fix.

**Commit**: `docs(game-version): ui review of the version label`

---

## Requirement Coverage

| Requirement | Unit | e2e | Review |
| ----------- | ---- | --- | ------ |
| GV-01 | T2 `appends one label with the version text...`, `writes v before the version`, `drops the whitespace...` | T4 loading screen | |
| GV-02 | | T4 `shows the version on the loading screen` | T5 shot 01 |
| GV-03 | | T4 `shows the version on the splash` | T5 shot 02 |
| GV-04 | | T4 `shows the version on the login form, right of the canvas`, phone scenario | T5 shot 03 |
| GV-05 | | T4 `shows the version in the battle, right of the canvas` | T5 shots 04, 05 |
| GV-06 | T2 `rewrites the text of the label on a second mount and adds none` | T4 `toHaveCount(1)` on four screens | |
| GV-07 | T1 both `defines __GAME_VERSION__...` cases | T4 every `toHaveText(LABEL)` (LABEL read from `package.json`) | |
| GV-08 | T2 five `gives no text...` and three `adds no label...` cases | not visible (no label) | |
| GV-09 | | T4 `expectInCorner` at 1280x720, 390x844, 1024x768 | T5 |
| GV-10 | | T4 login and battle at 1280x720 | T5 shots 03, 04 |
| GV-11 | | T4 phone scenario | T5 phone shots |
| GV-12 | | T4 `draws the version small, dim and click-through...` (1280x720) and `shows the version below the canvas at full size` (390x844), both through `expectGroveStyle` | T5 |
| GV-13 | | T4 `lets a click on the label through to the game` | T5 shot 06 |
