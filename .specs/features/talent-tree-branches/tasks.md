# Talent Tree Branches Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T8) and the `ui-artist` review (T9) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/talent-tree-branches/spec.md`
**Design**: `.specs/features/talent-tree-branches/design.md`
**Pictures**: `.specs/features/talent-tree-branches/owner-sketch.webp` (the owner's request), `.specs/features/talent-tree-branches/layout-target.png` (the target coordinates on the painting)
**Status**: Approved by the owner on 2026-11-24 with the recommended default of every open question (Q1 to Q6). In execution.

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. No task touches `backend/`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree can hold the owner's files and `graphify-out/`, which no task stages.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **Re-pinning existing tests.** A task changes an existing test only where the task lists it, and only to the value this file gives (each value was computed by the product owner with the new layout). Rename a test whose title states a number that changed (L-054) and name every re-pinned test in the commit body. Never delete a test unless the task says so. If a test the task does not list fails, stop and report it to the orchestrator; do not change it.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times. No agent runs two suites at once or leaves one running in the background. Agents run the unit suite and the e2e files named in the task, never the full e2e suite (`gitops` runs it for the report).
- Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003). Player text in Portuguese exactly as written here (AD-007).
- The desktop is the target (spec D7). Phone e2e tests that exist today must keep passing unchanged; no task adds phone behaviour.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, 3 to 5 mutants with `scripts/sensor.mjs`), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome 1280 x 720, fake backend), `game/ui-review.config.js` (shots). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Game domain (`talents.js`) | unit | Every text of P1 Card AC 1, the grade rule, the null case of AC 2 | `game/src/domain/talents/talents.test.js` | `cd game && npm test` |
| Layout data (`talentTreeLayout.js`) | unit | Every coordinate, the grade order, the sides, every clearance, banners, glows, veins and constants of P1 Branches AC 1 to AC 8, P2 Fúria AC 1, AC 2 | `game/src/adapters/phaser/views/talentTreeLayout.test.js` | `cd game && npm test` |
| View (`talentsView.js`) | unit (jsdom) + e2e | Unit: the card DOM of P1 Card AC 1 to AC 7, the re-pinned positions and reveal values; e2e in T6, T7 | `game/src/adapters/phaser/views/talentsView.test.js`, `game/e2e/talentTreeBranches*.spec.js` | `cd game && npm test`, `cd game && npx playwright test e2e/<file>` |
| Stylesheet (`public/style.css`) | e2e | Every size, offset, colour and clip rule of P1 Sizes AC 1 to AC 3 and P1 Card AC 3 to AC 6, with `toHaveCSS` or measured boxes | `game/e2e/talentTreeBranches.spec.js`, `game/e2e/talentTreeBranchesCard.spec.js` | `cd game && npx playwright test e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js` |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/talentTreeBranches.shots.js`, `.specs/features/talent-tree-branches/ui-review.html` | `cd game && npm run ui:shots -- talentTreeBranches` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks with unit tests only | `cd game && npm test` |
| Build | Every game task | `cd game && npm test && npm run build` |
| Full | Tasks that touch the screen | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every arrow is a `Depends on` inside the phase; dependencies on an earlier phase are listed in the task.

### Phase 1: Game code (game-dev)

```
T1 → T4 → T5
T2 → T3 → T4
```

### Phase 2: e2e and author check (test-engineer)

```
T6 → T8
T7 → T8
```

### Phase 3: UI review (ui-artist)

```
T9
```

---

## Task Breakdown

### Phase 1: Game code

#### T1: Talent descriptions [x]

**Owner**: game-dev
**Goal**: The game knows, for each of the 10 talents, one plain sentence that says what it does in combat (TTB-05; spec P1 Card AC 1, AC 2, D4).
**Where**: `game/src/domain/talents/talents.js`
**Files**:
- Also changes: `game/src/domain/talents/talents.test.js` (new `describe('talentDescription')` block at the end)
- Read first: `talents.js:59-61` (`BRANCH_TITLES`, `BRANCHES`), `talents.js:113-114` (`talentFullName`, the style of a one-line helper), `talents.test.js:1-6` (imports), `talents.test.js:234-257` (`talentIconName and the branch titles` block, the test style)
**Depends on**: None
**Requirement**: TTB-05

**Contract**: add right after `export const BRANCHES = [ 'TIME', 'BREAK', 'POWER', 'COMBO' ];`:

```js
//  What each talent does, in the player's words (spec talent-tree-branches P1 Card AC 1): one text per talent, the same for its three grades.
//  No catalog number here (AD-011): the effect line of the card shows the value.
export const TALENT_DESCRIPTIONS = Object.freeze({
    MINIBOSS_TIME: 'Você ganha mais segundos para derrotar cada miniboss antes que o tempo acabe.',
    BOSS_DAMAGE: 'Os golpes do seu líder causam mais dano em minibosses e chefes de capítulo.',
    PHYSICAL_BREAK: 'Diminui a defesa dos inimigos, então cada golpe tira mais vida deles.',
    ARMOR_PIERCE: 'Os golpes do seu líder ignoram uma parte da defesa que ainda resta no inimigo.',
    CLICK_DAMAGE: 'Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.',
    CLICK_FLAT_DAMAGE: 'Soma um valor fixo ao dano de cada clique do seu líder, antes dos bônus em porcentagem.',
    CRIT_CHANCE: 'Aumenta a chance de um golpe do seu líder ser crítico; o que passar de 100% contra o inimigo vira dano crítico.',
    CRIT_DAMAGE: 'Os golpes críticos do seu líder causam ainda mais dano.',
    COMBO: 'Cliques seguidos somam um bônus de dano; este talento aumenta o limite desse bônus.',
    COMBO_FURY: 'Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.'
});

//  The description of `talent` (by `baseId`, or `id` when there is none), or null when the game has none for it (a talent of a newer backend)
export const talentDescription = (talent) => TALENT_DESCRIPTIONS[talent.baseId ?? talent.id] ?? null;
```

**Steps**:

1. Add the two exports above.
2. Add `TALENT_DESCRIPTIONS` and `talentDescription` to the import list of `talents.test.js`.
3. Add the `describe('talentDescription')` block with the cases below.

**Tests**: unit
**Test cases** (`talents.test.js`, `describe('talentDescription')`):

- `describes each of the 10 talents in the player's words`: for each pair of the contract, `talentDescription({ id, baseId: id })` equals the text, written out in the test (copy the 10 strings, do not read them from `TALENT_DESCRIPTIONS`).
- `gives grades 2 and 3 the text of grade 1`: `{ id: 'CLICK_DAMAGE_G3', baseId: 'CLICK_DAMAGE', grade: 3 }` reads the `CLICK_DAMAGE` text; `{ id: 'COMBO_G2', baseId: 'COMBO', grade: 2 }` reads the `COMBO` text.
- `reads the id when the talent has no baseId`: `{ id: 'COMBO_FURY' }` reads the `COMBO_FURY` text.
- `answers null for a talent it does not know`: `{ id: 'NEW_ONE', baseId: 'NEW_ONE' }` gives `null`.
- `writes no catalog number in any text`: `Object.keys(TALENT_DESCRIPTIONS)` has 10 keys, and no text matches `/\d/` once `100%` is removed (`text.replace('100%', '')`).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 5 new cases pass and every other unit test passes unchanged.

**Commit**: `feat(game): describe each talent in the player's words`

---

#### T2: Smaller talent nodes [x]

**Owner**: game-dev
**Goal**: Nodes are 44 px (Fúria crescente 56 px) with 28 px (36 px) icons, and the badge, seal and lock shrink with them (TTB-04; spec P1 Sizes AC 1, AC 2, D3).
**Where**: `game/public/style.css`
**Files**:
- Also changes: `game/e2e/talentTreeRework.spec.js` (re-pins below)
- Read first: `style.css` block `/* ══ Talentos: the painted tree` from `.talent-node {` to `.talent-node-grade {` (about `:2400-2436`), `talentTreeRework.spec.js:120-159`
**Depends on**: None
**Requirement**: TTB-04

**Contract** (change only these values; every other property of each rule stays):

| Rule (find the selector) | Old values | New values |
| ------------------------ | ---------- | ---------- |
| `.talent-node {` | `width: 60px; height: 60px;` | `width: 44px; height: 44px;` |
| `.talent-node.is-large {` | `width: 88px; height: 88px;` | `width: 56px; height: 56px;` |
| `.talent-node .talent-node-icon {` | `width: 36px; height: 36px;` | `width: 28px; height: 28px;` |
| `.talent-node.is-large .talent-node-icon {` | `width: 54px; height: 54px;` | `width: 36px; height: 36px;` |
| `.talent-node .talent-node-lock {` | `top: -8px; left: -8px; width: 24px; height: 24px; font-size: 14px;` | `top: -7px; left: -7px; width: 20px; height: 20px; font-size: 12px;` |
| `.talent-node[data-state="maxed"]::after,` + `.talent-node[data-state="available"]::after {` (the shared rule) | `top: -8px; left: -8px;` and `width: 22px; height: 22px;` | `top: -6px; left: -6px;` and `width: 18px; height: 18px;` |
| `.talent-node[data-state="maxed"]::after {` | `font-size: 13px;` | `font-size: 11px;` |
| `.talent-node[data-state="available"]::after {` | `font-size: 17px;` | `font-size: 14px;` |
| `.talent-node-grade {` | `width: 20px; height: 20px;` and `font-size: 11px;` | `width: 18px; height: 18px;` and `font-size: 10px;` |

Update the comment above the seal rule if it names a size. The level chip, the caption, the frame and the halo values stay.

**Steps**:

1. Change the nine rules of the table.
2. Re-pin `talentTreeRework.spec.js` as listed below.

**Tests**: e2e (re-pinned in `talentTreeRework.spec.js`; the full size and mark checks come in T6)
**Re-pinned** (`game/e2e/talentTreeRework.spec.js`):

| Test | Old | New |
| ---- | --- | --- |
| `draws 28 nodes at their map coordinates, Fúria crescente bigger` | `expect((await size(page.getByTestId('talent-CLICK_DAMAGE')))[0]).toBe(60);` and `...COMBO_FURY...).toBe(88);` | `.toBe(44)` and `.toBe(56)` |
| `captions grade 1 nodes and badges grades 2 and 3` | `toHaveCSS('font-size', '11px')` on `talent-node-grade-BOSS_DAMAGE_G2` | `toHaveCSS('font-size', '10px')` |

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/talentTreeRework.spec.js`
**Done when**:

- [x] The three re-pinned assertions pass and every other test of `talentTreeRework.spec.js` passes unchanged (the old coordinates still hold in this task).

**Commit**: `feat(game): draw smaller talent nodes`

---

#### T3: Chains along the painted boughs [x]

**Owner**: game-dev
**Goal**: Every chain starts on the trunk where its vein leaves it and climbs along its bough, Fúria crescente sits after its prerequisite, and the banners, glows, veins and size constants follow (TTB-01, TTB-02, TTB-03, TTB-08; spec P1 Branches, P2 Fúria AC 1, AC 2, design § Layout map).
**Where**: `game/src/adapters/phaser/views/talentTreeLayout.js`
**Files**:
- Also changes: `game/src/adapters/phaser/views/talentTreeLayout.test.js` (rewritten), `game/src/adapters/phaser/views/talentsView.test.js` (re-pins below), `game/e2e/talentTreeRework.spec.js` (one re-pin)
- Read first: `talentTreeLayout.js` (whole file, 63 lines), `talentTreeLayout.test.js` (whole file, the clearance helpers to reuse), design § Layout map and § Clearances, `talentsView.test.js:62-68`, `:226-248`, `:346-465`, `talentTreeRework.spec.js:128-138`
**Depends on**: T2
**Requirement**: TTB-01, TTB-02, TTB-03, TTB-08

**Contract**: replace the whole file with:

```js
//  Where the talent tree sits, in percent of the 16:9 board (origin top left), calibrated on talent-tree-bg.jpg (spec talent-tree-branches, design § Layout map,
//  .specs/features/talent-tree-branches/layout-target.png). Each chain starts on the trunk where its painted vein leaves it and climbs along its bough:
//  TIME left along the cyan bough, BREAK up the red limbs, POWER up and right through the gold crown, COMBO right along the purple bough.
export const TREE_SIZE = { width: 1024, height: 576 };

export const TREE_IMAGE = 'assets/talent-tree-bg.jpg';

//  Each graded talent, in catalog order, and its grade 1, 2 and 3 points: grade 1 nearest the trunk, grade 3 toward the tip of the bough
const CHAINS = [
    [ 'MINIBOSS_TIME', [ { x: 43.5, y: 58 }, { x: 33, y: 43.5 }, { x: 20, y: 40 } ] ],
    [ 'BOSS_DAMAGE', [ { x: 35.5, y: 60.5 }, { x: 28.5, y: 55 }, { x: 16.5, y: 52.5 } ] ],
    [ 'PHYSICAL_BREAK', [ { x: 40.5, y: 40.5 }, { x: 34.5, y: 29 }, { x: 28, y: 18 } ] ],
    [ 'ARMOR_PIERCE', [ { x: 47, y: 33 }, { x: 43, y: 22 }, { x: 38, y: 11 } ] ],
    [ 'CLICK_DAMAGE', [ { x: 53, y: 49.5 }, { x: 55.5, y: 37 }, { x: 58, y: 24.5 } ] ],
    [ 'CLICK_FLAT_DAMAGE', [ { x: 61.5, y: 44 }, { x: 64, y: 31.5 }, { x: 66.5, y: 19 } ] ],
    [ 'CRIT_CHANCE', [ { x: 70, y: 38.5 }, { x: 72.5, y: 26 }, { x: 75, y: 13.5 } ] ],
    [ 'CRIT_DAMAGE', [ { x: 78.5, y: 33 }, { x: 81, y: 20.5 }, { x: 83.5, y: 8 } ] ],
    [ 'COMBO', [ { x: 60, y: 61 }, { x: 69.5, y: 56 }, { x: 86, y: 42 } ] ]
];

//  The 27 graded talents, and Fúria crescente on its own twig after Limite de dano do combo, the talent whose level 10 opens it
export const NODE_POSITIONS = Object.freeze({
    ...Object.fromEntries(CHAINS.flatMap(([ id, path ]) => path.map((position, index) => [ index === 0 ? id : `${id}_G${index + 1}`, position ]))),
    COMBO_FURY: { x: 76, y: 62 }
});

export const LARGE_NODES = Object.freeze([ 'COMBO_FURY' ]);

export const BANNER_POSITIONS = Object.freeze({ TIME: { x: 13.5, y: 30 }, BREAK: { x: 24, y: 6 }, POWER: { x: 66.5, y: 3.5 }, COMBO: { x: 88, y: 58 } });

//  The ellipse of each branch's lit veins: centre (x, y) and radii (rx, ry), in percent
export const BRANCH_GLOWS = Object.freeze({
    TIME: { x: 29, y: 52, rx: 18, ry: 17 },
    BREAK: { x: 38, y: 27, rx: 14, ry: 21 },
    POWER: { x: 68, y: 28, rx: 19, ry: 24 },
    COMBO: { x: 71, y: 58, rx: 18, ry: 17 }
});

export const TRUNK = Object.freeze({ base: { x: 50, y: 100 }, fork: { x: 50, y: 58 } });

//  The fallback veins: the trunk, one line per chain from the fork through its three grades, then the twig from Limite de dano do combo to Fúria crescente
export const VEINS = Object.freeze([
    [ TRUNK.base, TRUNK.fork ],
    ...CHAINS.map(([ , path ]) => [ TRUNK.fork, ...path ]),
    [ NODE_POSITIONS.COMBO, NODE_POSITIONS.COMBO_FURY ]
]);

//  The parts fixed over the scrolling board, in px of the 1024 x 576 window: the plaque "Talentos" ends 76 px from the top, the detail card (136 px tall,
//  8 px from the bottom) and the two bottom buttons start 144 px from the bottom
export const FIXED_TOP = 76;
export const FIXED_BOTTOM = 144;

//  Where the fixed parts sit across the window, in px of the 1024 px wide window: the plaque spans x 416 to 608, and Fechar (x 901 to 1011) ends 46 px from
//  the top, so a column under it keeps 48 px free at the top; a node seal or lock sticks 7 px above its node, a caption is 80 px wide
export const PLAQUE_SPAN = Object.freeze({ from: 416, to: 608 });
export const FECHAR_FROM = 896;
export const FECHAR_ROOM = 48;
export const SEAL_HEIGHT = 7;
export const CAPTION_HALF = 40;

//  Half the side of a node (44 px, 56 px for Fúria crescente), the gap to its caption plus three lines of it, and a margin, in px of the unzoomed board
//  (a phone draws it twice as big)
export const NODE_HALF = 22;
export const LARGE_NODE_HALF = 28;
export const CAPTION_ROOM = 54;
export const REVEAL_MARGIN = 6;
```

**Steps**:

1. Replace `talentTreeLayout.js` with the contract.
2. Rewrite `talentTreeLayout.test.js` with the cases below (keep the `GRADED` and `IDS` constants of today; write helpers `px({ x, y })` = `{ x: x / 100 * 1024, y: y / 100 * 576 }`, `half(id)` = 28 for `COMBO_FURY` else 22, `hit(a, b)` = `a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom`).
3. Re-pin `talentsView.test.js` and `talentTreeRework.spec.js` as listed.

**Tests**: unit + e2e (re-pin)
**Test cases** (`talentTreeLayout.test.js`, all new; the old cases go):

- `places the 28 talents of the catalog`: as today.
- `puts every chain on its painted bough at the coordinates of the design`: `NODE_POSITIONS` `toEqual` the 28 points of the contract written out as one literal object in the test (`MINIBOSS_TIME: { x: 43.5, y: 58 }`, `MINIBOSS_TIME_G2: { x: 33, y: 43.5 }`, ... `COMBO_FURY: { x: 76, y: 62 }`).
- `starts each chain next to the trunk fork and climbs away from it, grade 1 nearest and grade 3 farthest`: with `d(id)` the distance in px from (512, 334.08) to `px(NODE_POSITIONS[id])`, for each of the 9 `GRADED` ids `d(id) < d(id_G2) < d(id_G3)`; and `d('CLICK_DAMAGE')`, `d('CLICK_DAMAGE_G2')`, `d('CLICK_DAMAGE_G3')` `toBeCloseTo` 57.8, 133.4, 209.6 with precision 1.
- `keeps TIME and BREAK left of the trunk, POWER and COMBO right of it, BREAK and POWER grade 3 high, TIME and COMBO grade 1 low`: every node of `MINIBOSS_TIME`, `BOSS_DAMAGE`, `PHYSICAL_BREAK`, `ARMOR_PIERCE` (all grades) has `x < 50`; every node of `CLICK_DAMAGE`, `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE`, `COMBO` and `COMBO_FURY` has `x > 50`; the grade 3 of `PHYSICAL_BREAK`, `ARMOR_PIERCE` and the four POWER chains has `y < 25`; `MINIBOSS_TIME`, `BOSS_DAMAGE` and `COMBO` (grade 1) have `y > 55`.
- `puts Fúria crescente after Limite de dano do combo and marks it large`: `NODE_POSITIONS.COMBO_FURY` `{ x: 76, y: 62 }`; `d('COMBO_FURY')` `toBeCloseTo(267.2, 1)` and greater than `d('COMBO')` (`toBeCloseTo(103.8, 1)`); `LARGE_NODES` `[ 'COMBO_FURY' ]`.
- `keeps no two node footprints touching`: footprint of `id` = `{ left: cx - half - 8, right: cx + half + 4, top: cy - half - 8, bottom: cy + half + 8 }` in px; no pair of the 28 hits (`expect(pairs).toEqual([])` with `"<a> <b>"` strings).
- `keeps every grade 1 caption off every other node footprint and caption`: caption of a grade 1 id and of `COMBO_FURY` = `{ left: cx - 40, right: cx + 40, top: cy + half + 9, bottom: cy + half + 9 + (id === 'COMBO' ? 45 : 30) }`; no caption hits a footprint of another id or another caption (10 captions).
- `keeps every footprint and caption inside the board and off the plaque, Fechar, the detail card, the medallion and the reset button`: every footprint and caption inside `{ 0, 1024, 0, 576 }`; none hits `plaque { left: 416, right: 608, top: 0, bottom: 76 }`, `fechar { left: 884, right: 1024, top: 0, bottom: 60 }`, `card { left: 282, right: 742, top: 432, bottom: 576 }`, `medallion { left: 0, right: 280, top: 508, bottom: 576 }`, `reset { left: 780, right: 1024, top: 508, bottom: 576 }`.
- `puts the four banners on their foliage, inside the board and off every node, caption and the plaque`: `BANNER_POSITIONS` `toEqual({ TIME: { x: 13.5, y: 30 }, BREAK: { x: 24, y: 6 }, POWER: { x: 66.5, y: 3.5 }, COMBO: { x: 88, y: 58 } })`; each banner box (`cx ± 70`, `cy ± 17`) inside the board and hitting no footprint, no caption and not the plaque.
- `lights each branch over its new path`: `Object.keys(BRANCH_GLOWS)` `[ 'TIME', 'BREAK', 'POWER', 'COMBO' ]` and `BRANCH_GLOWS` `toEqual` the contract values.
- `draws the trunk, one vein per chain from the fork and the twig of Fúria crescente from Limite de dano do combo`: `VEINS.map((vein) => vein.map(({ x, y }) => \`${x},${y}\`).join(' '))` `toEqual` the 11 strings of design § Layout map, in order; no vein but the last contains `{ x: 76, y: 62 }`.
- `sizes the reserved bands for 44 px nodes and the 136 px card`: `NODE_HALF` 22, `LARGE_NODE_HALF` 28, `SEAL_HEIGHT` 7, `CAPTION_ROOM` 54, `FIXED_TOP` 76, `FIXED_BOTTOM` 144.

**Re-pinned** (`game/src/adapters/phaser/views/talentsView.test.js`; every value below was computed with the contract by running `revealTalent` on a 2048 x 1152 board):

| Test | Old | New |
| ---- | --- | --- |
| `centres each node on its map coordinates` | `[ '55%', '50%' ]`, `[ '80%', '61%' ]`, `[ '9%', '60%' ]` | `[ '53%', '49.5%' ]` (`CLICK_DAMAGE`), `[ '76%', '62%' ]` (`COMBO_FURY`), `[ '43.5%', '58%' ]` (`MINIBOSS_TIME`) |
| `draws the four banners in branch order with their titles and positions` | `[ '66%', '5%' ]` | `[ '66.5%', '3.5%' ]` |
| `gives each lit layer its ellipse and its opacity` | `[ '25%', '50%', '22%', '24%' ]` | `[ '29%', '52%', '18%', '17%' ]` (opacity values unchanged) |
| `draws the trunk and 9 veins` | title; `toHaveLength(10)` | title `draws the trunk, 9 chain veins and the twig of Fúria crescente`; `toHaveLength(11)`; first `points` `50,100 50,58` (unchanged); add `expect(lines[10].getAttribute('points')).toBe('60,61 76,62')` |
| `revealTalent` describe comment (`A phone board: ...`) | `the card on the bottom 136 px` | `the card on the bottom 144 px` |
| `scrolls Fúria crescente from under the card up into the free area, as far as the board allows` | `1638.4 - (1024 - 88 - 12)` and `702.72 - (576 - 136 - 88 - 108)` | `1556.48 - (1024 - 56 - 12)` (600.48) and `714.24 - (576 - 144 - 56 - 108)` (446.24); comment: its centre (76 %, 62 %) is at (1556.48, 714.24) of the board: the right edge keeps 56 + 12 px, the bottom keeps 56 px of node and 108 px of caption above the card |
| `scrolls a grade 3 node out from under the plaque and keeps its caption room above the card for a grade 1 node` | `299.52 - (76 + 60)`; `691.2 - (576 - 136 - 60 - 108)` | `282.24 - (76 + 44)` (162.24), `scrollLeft` 512; `668.16 - (576 - 144 - 44 - 108)` (388.16), `scrollLeft` 0; comments: (58 %, 24.5 %) is at (1187.84, 282.24): 76 + 44 px under the top edge; (43.5 %, 58 %) is at (890.88, 668.16): inside the side edges, bottom edge 576 - 144 - 44 - 108 px |
| `leaves the scroll alone when the node is already in the free area` | | unchanged (`CLICK_DAMAGE` from 700, 400 stays) |
| `the whole column` describe comment | `520 to 532 px tall ... 440 px (the card and the buttons take 136 px)` | `about 500 px tall at 2x (498 px for CLICK_DAMAGE), the free area of a 1024 x 576 window 432 px (the card and the buttons take 144 px)` |
| `brings a column under Fechar 48 px under the top of the window, grade 3 seal included` | `phone(1024, 400, 800)`, `revealTalent(screen, 'COMBO')`, `scrollLeft` 1024, `scrollTop` `403.2 - 60 - 16 - 48` | title `brings a column under Fechar 48 px under the top of the window, grade 3 seal included, up to the top of the board`; `phone(700, 400, 800)`, `revealTalent(screen, 'CRIT_DAMAGE')`, `scrollLeft` 700, `scrollTop` 0; comment: CRIT_DAMAGE sits at x 78.5 % = 1607.68 of the board, 907.68 px across the window (its caption reaches 987.68 px, over Fechar from 896); its grade 3 (8 % = 92.16) keeps 44 px of node and 14 px of seal and must start 48 px down: 92.16 - 44 - 14 - 48 is below 0, so the scroll stops at 0 (without the Fechar room it would be 34.16) |
| `brings a column under the plaque 76 px under the top of the window` | `299.52 - 60 - 16 - 76` | `282.24 - 44 - 14 - 76` (148.24); comment: (53 %: 1085.44 across the board, 573.44 across the window); grade 3 at 24.5 % = 282.24 |
| `brings a column clear of every fixed part to the top of the window when it fits` | `230.4 - 60 - 16` | `218.88 - 44 - 14` (160.88); comment: (61.5 %: 747.52 across the window, between the plaque and Fechar); grade 3 at 19 % = 218.88 |
| `keeps the scroll the player chose when the whole column is already in the free area` | | unchanged (`CLICK_FLAT_DAMAGE` from 512, 100 stays) |
| `keeps the node and its caption in the free area, as before, when the column does not fit` | `702.72 - (576 - 136 - 88 - 108)` | `714.24 - (576 - 144 - 56 - 108)` (446.24); the `CLICK_FLAT_DAMAGE` part unchanged (512, 288 stays) |

**Re-pinned** (`game/e2e/talentTreeRework.spec.js`, test `draws 28 nodes at their map coordinates, Fúria crescente bigger`): the comment becomes `CLICK_DAMAGE sits at 53 % x 1024 and 49.5 % x 576 of the board`; `563.2` becomes `542.72` and `288` becomes `285.12`.

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/talentTreeRework.spec.js e2e/talents.spec.js`
**Done when**:

- [x] The 12 cases of `talentTreeLayout.test.js` and every re-pinned case pass; every other unit test passes unchanged (`HeroUi.test.js` included).
- [x] `talentTreeRework.spec.js` and `talents.spec.js` pass, the three phone tests of spec § Edge Cases included, with only the re-pin above.

**Commit**: `feat(game): grow the talent chains along the painted boughs`

---

#### T4: Description and icon on the detail card [x]

**Owner**: game-dev
**Goal**: The card shows what the selected talent does and its icon at the right, with the level and the effect on one row (TTB-05, TTB-06, TTB-07; spec P1 Card AC 1 to AC 7).
**Where**: `game/src/adapters/phaser/views/talentsView.js`
**Files**:
- Also changes: `game/src/adapters/phaser/views/talentsView.test.js` (new cases in `describe('the detail card')`)
- Read first: `talentsView.js:1-12` (imports, `GLYPHS`), `:100-144` (`renderNode`, the icon call to copy), `:146-185` (`renderDetail`), `game/src/adapters/phaser/views/dom.js` (`iconWithFallback`), `talentsView.test.js:1-41` (fixture), `:143-224` (card cases)
**Depends on**: T1, T3
**Requirement**: TTB-05, TTB-06, TTB-07

**Contract**: add `talentDescription` to the import from `../../../domain/talents/talents` and replace `renderDetail` (with its comment) by:

```js
//  The card under the tree: on the left the selected talent's name, its level and effect on one row, what it does and its upgrade button (or why it is locked,
//  or Nível máximo); on the right its icon in a ring of the branch colour (spec talent-tree-branches). With nothing selected, only the hint.
const renderDetail = (talents, available, { busy, selectedId, onUpgrade }) =>
{
    const talent = talents.find(({ id }) => id === selectedId);
    const detail = el('div', 'talent-detail', '', { testid: 'talent-detail' });

    if (!talent)
    {
        detail.append(el('p', 'talent-detail-empty', EMPTY_DETAIL_TEXT, { testid: 'talent-detail-empty' }));

        return detail;
    }

    const grade = talent.grade ?? 1;
    const baseId = talent.baseId ?? talent.id;
    const description = talentDescription(talent);
    const body = el('div', 'talent-detail-body', '', { testid: 'talent-detail-body' });
    const stats = el('div', 'talent-detail-stats');
    const icon = el('div', 'talent-detail-icon', '', { testid: 'talent-detail-icon' });

    detail.setAttribute('data-branch', talent.branch);
    stats.append(
        el('div', 'talent-level', `Nível ${talent.level}/${talent.maxLevel}`, { testid: `talent-level-${talent.id}` }),
        el('div', 'talent-effect', `Efeito: ${describeTalentEffect(talent)}`, { testid: `talent-effect-${talent.id}` })
    );
    body.append(el('strong', 'talent-detail-name', talentFullName(talent), { testid: 'talent-detail-name' }), stats);

    if (description)
    {
        body.append(el('p', 'talent-detail-description', description, { testid: `talent-description-${talent.id}` }));
    }

    //  The lock text, Nível máximo or the upgrade button: the code of today, appended to `body` instead of `detail`

    //  The same art as the node: the grade's own file, then grade 1, then the branch glyph
    icon.append(iconWithFallback(talentIconName(baseId, grade), GLYPHS[talent.branch], 'talent-detail-art', grade > 1 ? talentIconName(baseId) : null));
    detail.append(body, icon);

    return detail;
};
```

Keep the three branches of the action (`talent-lock`, `talent-max`, `talent-upgrade` with `disabled = busy || available < talent.nextCost` and the `onUpgrade(talent)` click) exactly as today, appended to `body`.

**Steps**:

1. Add the import.
2. Replace `renderDetail` as above, moving the action code into `body`.
3. Add the test cases below.

**Tests**: unit (jsdom)
**Test cases** (`talentsView.test.js`, `describe('the detail card')`; `fail(image)` as in the file):

- `explains the selected talent after its level and effect`: `show({}, 1, { selectedId: 'CLICK_DAMAGE' })`: `talent-description-CLICK_DAMAGE` is a `P` with class `talent-detail-description` and text `Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.`; the children of `talent-detail-body`, by `data-testid` or class, are in order `talent-detail-name`, `.talent-detail-stats`, `talent-description-CLICK_DAMAGE`, `talent-upgrade-CLICK_DAMAGE`.
- `explains grade 3 with the text of grade 1, before the lock text`: `selectedId: 'CLICK_DAMAGE_G3'`: `talent-description-CLICK_DAMAGE_G3` reads the `CLICK_DAMAGE` text and the next sibling is `talent-locked-CLICK_DAMAGE_G3`.
- `explains Fúria crescente`: `selectedId: 'COMBO_FURY'`: `talent-description-COMBO_FURY` reads `Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.`.
- `shows no description for a talent the game has no text for, and the rest of the card`: `renderTalents([ ...tree(), extra ], points(5), { selectedId: 'NEW_ONE', onUpgrade: vi.fn() })` with `extra` of the test `draws no node for a talent outside the map and throws nothing`: `talent-detail-name` `Novo`, no element whose `data-testid` starts with `talent-description-`, `talent-upgrade-NEW_ONE` present.
- `puts the level and the effect on one row`: `selectedId: 'CLICK_DAMAGE'`: the parent of `talent-level-CLICK_DAMAGE` and of `talent-effect-CLICK_DAMAGE` is the same element, with class `talent-detail-stats`.
- `shows the icon of the talent at the right of the card, the grade file first`: `selectedId: 'CLICK_DAMAGE_G2'` (with `CLICK_DAMAGE: 10`): the card's children are `talent-detail-body` then `talent-detail-icon`; `talent-detail-icon` holds `.talent-detail-art img` whose `src` ends with `assets/talent-click-damage-g2.png`.
- `falls back on the card to the grade 1 icon, then to the branch glyph`: same card: `fail` the image once: `src` ends with `assets/talent-click-damage.png`; `fail` it again: `.talent-detail-art .icon-fallback` reads `⚔`. Then, one card each, one `fail` on grade 1: `MINIBOSS_TIME` reads `⏳`, `PHYSICAL_BREAK` reads `🛡`, `COMBO_FURY` reads `✦`.
- `shows no icon and no description with nothing selected`: `show()`: no `talent-detail-icon`, no `talent-detail-body`, the empty text as today.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 8 new cases pass; every existing case of `talentsView.test.js` and `HeroUi.test.js` passes unchanged.

**Commit**: `feat(game): explain the selected talent and show its icon on the card`

---

#### T5: Card layout and icon ring [x]

**Owner**: game-dev
**Goal**: The card is 460 x 136 px with the text column on the left and the 88 px ringed icon on the right, nothing clipped (TTB-06, TTB-07; spec P1 Card AC 3 to AC 6, D5, D6).
**Where**: `game/public/style.css`
**Files**:
- Also changes: `game/e2e/talentTreeRework.spec.js` (two re-pins)
- Read first: `style.css` rules `.talent-detail {` to `.talent-detail-empty { margin: 0; font-style: italic; }` (about `:2458-2463`), `.icon`, `.icon-image`, `.icon-fallback` (about `:2500-2523`), design § Stylesheet
**Depends on**: T4
**Requirement**: TTB-06, TTB-07

**Contract**: replace the `.talent-detail {` rule with the one below and add the other rules right after `.talent-detail-empty { margin: 0; font-style: italic; }` (values exactly as written; `.talent-detail-name`, `.talent-level`, `.talent-effect`, `.talent-max`, `.talent-lock`, `.talent-upgrade` stay):

```css
.talent-detail { position: absolute; left: 50%; bottom: 8px; z-index: 2; display: grid; grid-template-columns: minmax(0, 1fr) 88px; column-gap: 12px; align-items: center; box-sizing: border-box; width: 460px; height: 136px; padding: 10px 14px 10px 20px; font-size: 13px; color: var(--ink-900); background: var(--parchment-100); border: 2px solid var(--wood-600); border-radius: var(--radius-lg); box-shadow: inset 4px 0 0 var(--branch, var(--bronze-500)), 0 6px 18px rgb(0 0 0 / 0.45); transform: translateX(-50%); }
/* The text column of the card: name, level and effect on one row, what the talent does (2 lines at most), the action (spec talent-tree-branches D5) */
.talent-detail-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; max-height: 112px; overflow: hidden; }
.talent-detail-stats { display: flex; gap: 12px; line-height: 17px; white-space: nowrap; }
.talent-detail-description { margin: 0; font-family: var(--font-body); font-size: 12px; line-height: 15px; color: var(--ink-900); }
.talent-detail-empty { grid-column: 1 / -1; }
/* The talent's icon in a ring of the branch colour, with the glyph of the branch when the art is missing */
.talent-detail-icon { position: relative; display: grid; place-items: center; box-sizing: border-box; width: 88px; height: 88px; background: radial-gradient(circle, var(--wood-700) 0 58%, var(--wood-900) 60%); border: 3px solid var(--branch); border-radius: 50%; box-shadow: 0 0 0 2px var(--wood-900), 0 0 14px 4px var(--branch); }
.talent-detail-icon .talent-detail-art { width: 64px; height: 64px; }
.talent-detail-icon .icon-fallback { font-size: 34px; color: var(--parchment-100); background: none; border-radius: 50%; }
```

**Steps**:

1. Replace `.talent-detail` and add the seven rules.
2. Re-pin the two assertions below.
3. Open the game (`npm run dev`), open Talentos, select `Limite de dano do combo` grade 1 and Fúria crescente (locked): the text fits the card and the icon ring shows violet.

**Tests**: e2e (re-pinned here; the card's sizes, ring and clip checks come in T7)
**Re-pinned** (`game/e2e/talentTreeRework.spec.js`):

| Test | Old | New |
| ---- | --- | --- |
| `opens a 1024 x 576 window with the tree, the plaques and the empty card` | `expect((await size(page.getByTestId('talent-detail')))[0]).toBe(380);` | `.toBe(460)` |
| `on a 390 x 844 phone the tree is zoomed twice, opens centred and keeps the scroll` | `expect((await size(page.getByTestId('talent-detail')))[0]).toBe(380);` | `.toBe(460)` |

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/talentTreeRework.spec.js e2e/talents.spec.js && npx playwright test e2e/uiRedesign.spec.js -g "talent|Nível máximo|contrast pairs|inner card"`
**Done when**:

- [x] The two re-pinned assertions pass and every other test of the three files passes unchanged.

**Commit**: `feat(game): lay out the talent card with its icon ring`

---

### Phase 2: e2e and author check

#### T6: e2e of the branches, the node sizes and Fúria crescente [x]

**Owner**: test-engineer
**Goal**: Every player-visible rule of P1 Branches, P1 Sizes and P2 Fúria is pinned in the browser (TTB-01, TTB-02, TTB-03, TTB-04, TTB-08, TTB-09).
**Where**: `game/e2e/talentTreeBranches.spec.js` (new)
**Files**:
- Read first: `game/e2e/talentTreeRework.spec.js:1-75` (imports from `./support/coverage`, `artMissing`, `artPresent`, `startGame`, `openTalents`, `size`, `select`, `olderBackendTalents` and the `routes` option: copy the helpers you need into the new file), `:120-139` (board px from the `talent-tree` rect: `(box.x + box.width / 2 - tree.x) * (1024 / tree.width)`), `:161-187` (overlap report in one `page.evaluate`), `:567-585` (a route that changes the talent list), spec P1 Branches, P1 Sizes, P2 Fúria, design § Layout map
**Depends on**: T5 (Phase 1)
**Requirement**: TTB-01, TTB-02, TTB-03, TTB-04, TTB-08, TTB-09

**Contract**: one `page.evaluate` helper `centres(page)` returns `{ [testid]: { x, y } }` for every `.talent-node`, in board px (1024 x 576) from the `talent-tree` rect; `FORK = { x: 512, y: 334.08 }`; distances with `Math.hypot`. Every test opens Talentos on the desktop (default 1280 x 720 project) unless it says otherwise.

**Steps**:

1. Create the file with the helpers.
2. Write the tests below, one `test` each, grouped in `test.describe('Talentos branches: ...')` blocks.
3. Run the file, then the author's own check that each test fails when its value is changed by hand (do not commit the change).

**Tests**: e2e
**Test cases**:

- `centres the nodes on the painted boughs`: art missing; `CLICK_DAMAGE` (542.72, 285.12), `MINIBOSS_TIME` (445.44, 334.08), `COMBO_FURY` (778.24, 357.12), `ARMOR_PIERCE_G3` (389.12, 63.36), `CRIT_DAMAGE_G3` (855.04, 46.08), `COMBO_G3` (880.64, 241.92), each within 1 px on both axes (P1 Branches AC 1).
- `every chain climbs away from the trunk fork, grade 1 nearest and grade 3 farthest`: for the 9 chains `d(id) < d(id_G2) < d(id_G3)` (P1 Branches AC 2).
- `TIME and BREAK grow left of the trunk, POWER and COMBO right of it`: x below 512 for every TIME and BREAK node, above 512 for every POWER and COMBO node; y below 144 for the grade 3 of `PHYSICAL_BREAK`, `ARMOR_PIERCE` and the four POWER chains; y above 316.8 for `MINIBOSS_TIME`, `BOSS_DAMAGE` and `COMBO` (P1 Branches AC 3).
- `no node, caption or banner touches another or a fixed part of the screen`: art missing, nothing selected; boxes of the 28 `.talent-node`, the 10 `.talent-node-caption`, the 4 `.talent-banner`, and the fixed `talent-title`, `hero-close`, `talent-detail`, `talent-points`, `talent-reset`: no two nodes intersect; no caption intersects a node other than its own, another caption, a banner or a fixed part; no node or banner intersects a fixed part; every node, caption and banner lies inside the `talent-tree` rect. Report the offending pairs by test id and expect `[]` (P1 Branches AC 4, AC 6).
- `a click at the centre of every node lands on that node`: for each of the 28 nodes `document.elementFromPoint(centre)` has `closest('.talent-node')` equal to that node; then `page.mouse.click` at the centres of `COMBO_FURY`, `ARMOR_PIERCE_G3` and `CRIT_DAMAGE_G3` selects each (`talent-detail-name` `Fúria crescente`, `Perfuração de armadura (Grau 3)`, `Dano crítico (Grau 3)`) (P1 Branches AC 5).
- `the banners sit on their foliage`: banner centres in board px `TIME` (138.24, 172.8), `BREAK` (245.76, 34.56), `POWER` (680.96, 20.16), `COMBO` (901.12, 334.08), within 1 px; each 140 x 34 (P1 Branches AC 6).
- `the lit veins follow the new paths`: `talent-lit-<BRANCH>` inline `--cx`, `--cy`, `--rx`, `--ry` (`node.style.getPropertyValue`) read `TIME` `29%`, `52%`, `18%`, `17%`; `BREAK` `38%`, `27%`, `14%`, `21%`; `POWER` `68%`, `28%`, `19%`, `24%`; `COMBO` `71%`, `58%`, `18%`, `17%` (P1 Branches AC 7).
- `with the art missing 11 dashed veins follow the chains and reach Fúria crescente from Limite de dano do combo`: the `points` of the 11 `polyline` of `talent-tree-veins` equal the 11 strings of design § Layout map in order (P1 Branches AC 8, P2 Fúria AC 2).
- `nodes are 44 px with 28 px icons and Fúria crescente 56 px with a 36 px icon`: `offsetWidth` and `offsetHeight` of `talent-CLICK_DAMAGE` 44 and 44, of its `.talent-node-icon` 28 and 28; `talent-COMBO_FURY` 56 and 56, icon 36 and 36 (P1 Sizes AC 1).
- `the marks shrink with the nodes`: talents `{ CLICK_DAMAGE: 10 }`, points 1, art present: `talent-node-grade-CLICK_DAMAGE_G2` 18 x 18 with `font-size` `10px`; the `::after` of `talent-CLICK_DAMAGE` (maxed) and of `talent-CRIT_CHANCE` (available) has `width` `18px`, `height` `18px`, `top` `-6px`, `left` `-6px`; the `.talent-node-lock` of `talent-CLICK_DAMAGE_G3` (locked) is 20 x 20 with `top` `-7px` and `left` `-7px`; `talent-node-level-CLICK_DAMAGE` `font-size` `11px`; `talent-caption-CLICK_DAMAGE` 80 px wide with `font-size` `12px` (P1 Sizes AC 2). P1 Sizes AC 3 stays pinned by `talentTreeRework.spec.js` `the lock of a locked node does not overlap its level pill on the desktop`.
- `Fúria crescente comes after the chain that opens it`: `d('COMBO_FURY')` > `d('COMBO')`; the test ids of `.talent-node[data-branch="COMBO"]` in DOM order are `talent-COMBO`, `talent-COMBO_G2`, `talent-COMBO_G3`, `talent-COMBO_FURY`; with `talent-COMBO_G3` focused, `Tab` focuses `talent-COMBO_FURY` (P2 Fúria AC 1, AC 3).
- `Fúria crescente stays locked until Limite de dano do combo reaches level 10`: talents `{ COMBO: 9 }`: `talent-COMBO_FURY` `data-state` `locked`; a second start with `{ COMBO: 10 }` and 2 points: `available` (P2 Fúria AC 4).
- `a talent list without Fúria crescente draws 27 nodes and the same 11 veins`: art missing; a route on `**/api/talents` (GET) that fetches the fake answer (`route.fetch()`) and drops `COMBO_FURY` from `talents`; 27 nodes, no `talent-COMBO_FURY`, 11 polylines, no `pageerror` (spec Edge Cases).

**Gate**: `cd game && npx playwright test e2e/talentTreeBranches.spec.js`
**Done when**:

- [x] The 13 tests pass, alone and twice in a row (`--repeat-each=2`).

**Commit**: `test(game): pin the talent branches, node sizes and Fúria crescente in the browser`

---

#### T7: e2e of the detail card [x]

**Owner**: test-engineer
**Goal**: The card's description, icon, fallback, size and kept texts are pinned in the browser (TTB-05, TTB-06, TTB-07).
**Where**: `game/e2e/talentTreeBranchesCard.spec.js` (new)
**Files**:
- Read first: `game/e2e/talentTreeRework.spec.js:1-75` (helpers to copy), `:329-426` (card tests), spec P1 Card, design § Detail card and § Stylesheet
**Depends on**: T5 (Phase 1)
**Requirement**: TTB-05, TTB-06, TTB-07

**Contract**: the 10 texts of spec P1 Card AC 1 written out in the test file (not imported from the game).

**Steps**:

1. Create the file with the helpers.
2. Write the tests below.
3. Run the file twice in a row.

**Tests**: e2e
**Test cases**:

- `the card explains each of the 10 talents in the player's words`: art missing; for each grade 1 id and `COMBO_FURY`, select the node: `talent-description-<ID>` has the exact text (P1 Card AC 1).
- `grades 2 and 3 read the text of grade 1`: select `CLICK_DAMAGE_G2`, then `COMBO_G3`: their descriptions read the `CLICK_DAMAGE` and `COMBO` texts (P1 Card AC 1, spec Edge Cases).
- `the card shows the talent icon in a ring of the branch colour`: art present; select `CLICK_DAMAGE`: `talent-detail-icon` 88 x 88, `border-top-width` `3px`, `border-top-style` `solid`, `border-top-color` `rgb(201, 154, 31)`, `border-radius` `50%`, its `box-shadow` contains `rgb(28, 18, 12) 0px 0px 0px 2px` and `rgb(201, 154, 31) 0px 0px 14px 4px`; `.talent-detail-art` 64 x 64; its `img` `src` ends with `assets/talent-click-damage.png`; the icon's left edge is right of the right edge of `talent-detail-body` and inside the card. Then `MINIBOSS_TIME` `rgb(59, 154, 166)`, `PHYSICAL_BREAK` `rgb(196, 73, 47)`, `COMBO` `rgb(138, 91, 214)` on `border-top-color`; `CLICK_DAMAGE_G2` (talents `{ CLICK_DAMAGE: 10 }`) `src` ends with `assets/talent-click-damage-g2.png` (P1 Card AC 3).
- `a missing grade icon falls back to the grade 1 file`: art present plus a later route answering 404 for `**/assets/talent-click-damage-g2.png`; talents `{ CLICK_DAMAGE: 10 }`; select `CLICK_DAMAGE_G2`: the card `img` `src` ends with `assets/talent-click-damage.png` and `naturalWidth` is 1 (P1 Card AC 4).
- `with the icons missing the card shows the branch glyph in the ring`: art missing; `CLICK_DAMAGE` `⚔`, `MINIBOSS_TIME` `⏳`, `PHYSICAL_BREAK` `🛡`, `COMBO_FURY` `✦` in `talent-detail-icon .icon-fallback`, `font-size` `34px`, `color` `rgb(244, 230, 200)`; the ring stays 88 x 88 (P1 Card AC 4).
- `the card is 460 x 136, 8 px above the bottom and centred, level and effect on one row`: select `CLICK_DAMAGE`: `talent-detail` 460 x 136 (`offsetWidth`, `offsetHeight`), `toHaveCSS('bottom', '8px')`; the distance between the card's centre x and the `.hero-window` centre x is at most 1 px (L-073); `talent-level-CLICK_DAMAGE` and `talent-effect-CLICK_DAMAGE` tops differ by at most 0.5 px (P1 Card AC 5).
- `no text of the card is clipped`: for each state, `talent-detail-body` `scrollHeight <= clientHeight` and `talent-description-<ID>` at most 30 px tall: `CLICK_DAMAGE` open with 1 point (button), `CLICK_DAMAGE` at 10 (`Nível máximo`), `CLICK_DAMAGE_G2` locked, `COMBO_FURY` locked (`Bloqueado: chegue ao nível 10 de Limite de dano do combo`), `CRIT_CHANCE` (the longest description) (P1 Card AC 5).
- `with nothing selected the card shows only the hint`: no `talent-detail-icon`, no `talent-detail-body`, `talent-detail-empty` reads `Escolha um talento na árvore para ver os detalhes.`, the card still 460 x 136 (P1 Card AC 6).
- `the card keeps its texts and its button`: 1 point; select `CLICK_DAMAGE`: `Dano de clique (%)`, `Nível 0/10`, `Efeito: nenhum`, `Melhorar (1 ponto)`; click it: `Nível 1/10`, `Efeito: +5%`, the description still shown, `talent-upgrade-CLICK_DAMAGE` disabled (P1 Card AC 7).
- `changing the selection changes the icon and the description`: art present; select `CLICK_DAMAGE`, then `COMBO_FURY`: the description reads the `COMBO_FURY` text, the `img` `src` ends with `assets/talent-combo-fury.png`, the ring `border-top-color` `rgb(138, 91, 214)` (spec Edge Cases).

P1 Card AC 2 (a talent with no text) cannot be reached in the browser: every node of the map has a text; it is pinned by T4 (`shows no description for a talent the game has no text for`).

**Gate**: `cd game && npx playwright test e2e/talentTreeBranchesCard.spec.js`
**Done when**:

- [x] The 10 tests pass, alone and twice in a row (`--repeat-each=2`).

**Commit**: `test(game): pin the talent card description and icon in the browser`

---

#### T8: Author check of the feature [ ]

**Owner**: test-engineer
**Goal**: Every AC of the spec has a test that asserts its spec value, and the riskiest code is guarded by tests that kill mutants (TTB-01 to TTB-09; `.claude/agents/test-engineer.md` § author check).
**Where**: `.specs/features/talent-tree-branches/tasks.md` (this task's notes)
**Files**:
- Also changes: any test file of this feature where the check finds a gap (unit or e2e), only to add a missing assertion with a spec value
- Read first: `.claude/agents/test-engineer.md` (author check), `scripts/sensor.mjs:1-25` (mutants format), the spec, T1 to T7
**Depends on**: T6, T7
**Requirement**: TTB-01, TTB-02, TTB-03, TTB-04, TTB-05, TTB-06, TTB-07, TTB-08, TTB-09

**Steps**:

1. Map every AC of the spec (and each Edge Case) to the tests that assert it; list any AC without an assertion of its spec value and add it.
2. Write a mutants file in your scratchpad with these 5 mutants and run `node scripts/sensor.mjs <file> --json <out.json>` from the repo root:
   - M1 `game/src/domain/talents/talents.js`: `'Diminui a defesa dos inimigos` → `'Aumenta a defesa dos inimigos`; run `npx vitest run src/domain/talents/talents.test.js` (cwd `game`).
   - M2 `game/src/adapters/phaser/views/talentTreeLayout.js`: `[ NODE_POSITIONS.COMBO, NODE_POSITIONS.COMBO_FURY ]` → `[ TRUNK.fork, NODE_POSITIONS.COMBO_FURY ]`; run `npx vitest run src/adapters/phaser/views/talentTreeLayout.test.js`.
   - M3 `game/src/adapters/phaser/views/talentsView.js`: `'talent-detail-art', grade > 1 ? talentIconName(baseId) : null` → `'talent-detail-art', null`; run `npx vitest run src/adapters/phaser/views/talentsView.test.js`.
   - M4 `game/public/style.css`: in `.talent-detail-icon {`, `border: 3px solid var(--branch)` → `border: 2px solid var(--branch)`; run `npx playwright test e2e/talentTreeBranchesCard.spec.js -g "ring of the branch colour"`.
   - M5 `game/public/style.css`: `.talent-node.is-large { width: 56px; height: 56px; }` → `.talent-node.is-large { width: 60px; height: 60px; }`; run `npx playwright test e2e/talentTreeBranches.spec.js -g "44 px"`.
3. Every survivor gets a test; rerun until the sensor exits 0.
4. Write the result under this task: the AC map gaps found and closed, and the sensor table (id, killed or survived, test that killed it).

**Tests**: unit + e2e (the gaps found)
**Gate**: `cd game && npm test && npx playwright test e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js e2e/talentTreeRework.spec.js` and `node scripts/sensor.mjs <mutants.json>` exits 0
**Done when**:

- [ ] Every AC of the spec maps to at least one test asserting its spec value, and the sensor reports 5 of 5 killed.

**Commit**: `test(game): author check of the talent tree branches`

---

### Phase 3: UI review

#### T9: UI review of the branches and the card [ ]

**Owner**: ui-artist
**Goal**: The tree and the card match the owner's request and the Grove theme (AD-022) on the desktop with the real art (TTB-01 to TTB-08).
**Where**: `.specs/features/talent-tree-branches/ui-review.html` (new, from the template named under Read first)
**Files**:
- Also changes: `game/ui-review/talentTreeBranches.shots.js` (new), `.specs/features/talent-tree-branches/ui-review/*.png`
- Read first: `.claude/templates/ui-review.html` (the template), `game/ui-review/talentTreeRework.shots.js` (helpers `start`, `openTalents`, `select`, the `art: 'real'` option), `game/ui-review/support/shots.js`, `.specs/features/talent-tree-branches/owner-sketch.webp`, `layout-target.png`, the spec
**Depends on**: T8 (Phase 2)
**Requirement**: TTB-01, TTB-02, TTB-03, TTB-04, TTB-05, TTB-06, TTB-07, TTB-08

**Shots** (desktop; the phone shots the config also takes are not reviewed, spec D7):

1. `01-tree-real-art`: real art, fresh account (1 point).
2. `02-tree-real-art-levels`: real art, the 12 POWER talents at 10, `COMBO` 10, `COMBO_FURY` 2, `MINIBOSS_TIME` 5, 3 points (maxed, available, open and locked nodes, lit veins).
3. `03-tree-fallback`: every `talent-*` file missing (gradient board, 11 dashed veins).
4. `04-card-open`: real art, `CLICK_DAMAGE` selected with 1 point.
5. `05-card-maxed`: real art, `CLICK_DAMAGE` at 10 selected.
6. `06-card-locked-grade`: real art, `CLICK_DAMAGE_G2` selected.
7. `07-card-fury-locked`: real art, `COMBO_FURY` selected.
8. `08-card-each-branch`: real art, one shot each of `MINIBOSS_TIME`, `PHYSICAL_BREAK`, `COMBO` selected (the ring colour per branch).
9. `09-card-glyph`: art missing, `CRIT_CHANCE` selected (glyph in the ring, longest description).

**What to check**:

1. Each branch starts at the trunk on its own coloured vein and climbs along its bough, as the owner's arrows ask (`owner-sketch.webp`); compare with `layout-target.png`.
2. Fúria crescente reads as after `Limite de dano do combo`, on its twig.
3. The 44 px nodes, their badges, seals, locks, chips and captions are readable and do not touch each other; the banners sit on their foliage.
4. The card: text fits, the description reads in plain Portuguese, contrast of `--ink-900` on the parchment, the icon ring in the branch colour and its glow, the glyph fallback.
5. The fallback tree is still readable.

**Tests**: none (review artifact; T6 and T7 pin the values)
**Gate**: `cd game && npm run ui:shots -- talentTreeBranches`
**Done when**:

- [ ] `ui-review.html` has a verdict (APROVADO or REPROVADO) and every finding is listed for the product owner to turn into tasks.

**Commit**: `docs(ui): review the talent tree branches`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 constant + 1 function in one file | ✅ Granular |
| T2 | 9 values of one stylesheet block (+ 3 re-pinned assertions) | ⚠️ Cohesive (one rule: the node size) |
| T3 | 1 data file (+ its tests and the re-pins its values cause) | ⚠️ Cohesive (one table; the tests pin it) |
| T4 | 1 function | ✅ Granular |
| T5 | 1 stylesheet block (+ 2 re-pinned assertions) | ✅ Granular |
| T6 | 1 e2e spec file | ✅ Granular |
| T7 | 1 e2e spec file | ✅ Granular |
| T8 | author check | ✅ Granular |
| T9 | 1 review | ✅ Granular |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (none) | ✅ Match |
| T2 | None | (none) | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T1, T3 | T1 → T4, T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 (Phase 1) | (none in phase) | ✅ Match |
| T7 | T5 (Phase 1) | (none in phase) | ✅ Match |
| T8 | T6, T7 | T6 → T8, T7 → T8 | ✅ Match |
| T9 | T8 (Phase 2) | (none in phase) | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Game domain | unit | unit | ✅ OK |
| T2 | Stylesheet | e2e | e2e (re-pins; full checks in T6) | ✅ OK (same pattern as `talent-tree-rework` T15 and T20: the CSS values are pinned by the test-engineer's spec of the same feature) |
| T3 | Layout data | unit | unit + e2e re-pin | ✅ OK |
| T4 | View | unit (jsdom) + e2e | unit (e2e in T7) | ✅ OK |
| T5 | Stylesheet | e2e | e2e (re-pins; full checks in T7) | ✅ OK (as T2) |
| T6 | e2e | e2e | e2e | ✅ OK |
| T7 | e2e | e2e | e2e | ✅ OK |
| T8 | author check | unit, e2e | unit + e2e | ✅ OK |
| T9 | UI review artifact | none | none | ✅ OK |

### Existing e2e that depend on node positions or the card

| File | Test | In this feature |
| ---- | ---- | --------------- |
| `game/e2e/talentTreeRework.spec.js` | `draws 28 nodes at their map coordinates, Fúria crescente bigger` | Re-pinned (sizes T2, centre T3) |
| same | `captions grade 1 nodes and badges grades 2 and 3` | Re-pinned (badge 10 px, T2) |
| same | `opens a 1024 x 576 window with the tree, the plaques and the empty card` | Re-pinned (card 460, T5) |
| same | `on a 390 x 844 phone the tree is zoomed twice, opens centred and keeps the scroll` | Re-pinned (card 460 only, T5) |
| same | `no caption is clipped and none touches another part of the board` | Unchanged; must pass with the new layout (checked in design § Clearances) |
| same | `the lock of a locked node does not overlap its level pill on the desktop` / `on the 390 x 844 phone` | Unchanged; must pass |
| same | `on a phone the selected Fúria crescente ends above the detail card` | Unchanged; must pass (Fúria at (76, 62) still opens under the card on the centred phone board and is revealed above it) |
| same | every other test | Unchanged; must pass |
| `game/e2e/talents.spec.js`, `game/e2e/uiRedesign.spec.js` (talent card tests), `game/e2e/unifiedDamage.spec.js` (BREAK DOM order), `game/e2e/talentTreeReworkCombat.spec.js` | node clicks, card colours and texts, DOM order | Unchanged; must pass |
