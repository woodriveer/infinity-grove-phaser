# Tech Debt Polish Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T4) and the `ui-artist` review (T5) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/tech-debt-polish/spec.md`
**Design**: none (Medium scope: one CSS rule, one view attribute, one style constant, two test edits; the design is inline in each task)
**Status**: Approved by the owner on 2026-11-26 (recommended defaults: spec Q1 to Q5). Runs first of the three debt features, before `defense-contract` and `portuguese-text`.

Rules for every task: the rules block of `.specs/features/early-game-rebalance/tasks.md` (§ Rules for every task) applies word for word: paths from the repository root, graphify first (`graphify query "<question>"` before the first search; `graphify update .` after changing code), the files under **Read first** before editing, one commit per task checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` and ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, files added by path only (never `git add -A` or `git add .`), the task ticked `[x]` here and its requirement rows in `spec.md` § Requirement Traceability set to `Implementing` in the same commit, push with `git pull --rebase origin main && git push origin HEAD:main`, re-pins only where a task lists them, an e2e flake rerun alone twice with `--workers=1`, never the full e2e suite, Portuguese player text exactly as the spec, desktop only. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, mutants with `node scripts/sensor.mjs`), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome, fake backend). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Game view (`equipmentView.js`) | unit | The new `data-stat` attribute of every line | `game/src/adapters/phaser/views/equipmentView.test.js` | `cd game && npm test` |
| Game scene (`ClickerGame.js` style constant) | unit | The ally style of TDP-03 AC 1; the click styles of AC 2 unchanged | `game/src/adapters/phaser/ClickerGame.test.js` | `cd game && npm test` |
| Game CSS and scene in the browser | e2e | TDP-01 AC 1, 2, 4 and Edge 1; TDP-03 AC 1, 2 on the live scene | `game/e2e/equipmentUi.spec.js`, `game/e2e/heroTeamCombat.spec.js` | `cd game && npx playwright test e2e/<file>` |
| Existing tests (TD-012) | e2e + unit | TDP-02 AC 1 to 4 | `game/e2e/heroTeamCombat.spec.js`, `game/src/domain/skills/skillCombat.test.js` | `cd game && npm test && npx playwright test e2e/heroTeamCombat.spec.js` |
| UI review artifact | none | Reviewed by the `ui-artist` (TDP-03 AC 3) | `game/ui-review/techDebtPolish.shots.js` | `cd game && npm run ui:shots -- techDebtPolish` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Unit only | `cd game && npm test` |
| Full | Tasks that touch the screen or an e2e file | `cd game && npm test && npm run build && npx playwright test <files of the task>` |
| Review | The ui review | `cd game && npm run ui:shots -- techDebtPolish` |

---

## Execution Plan

### Phase 1: Game (game-dev)

```
T1
T2
```

### Phase 2: Test debt and author check (test-engineer)

```
T3 → T4
```

### Phase 3: UI review (ui-artist)

```
T5
```

---

## Task Breakdown

### Phase 1: Game

#### T1: The two break lines share the last row of the attribute panel [x]

**Owner**: game-dev
**Goal**: `breakDefense` starts a new row of the 3-column grid, so the two break lines sit side by side and the two time lines form the row above (TDP-01; spec Break lines AC 1 to 4, Q1).
**Where**: `game/public/style.css`
**Files**:
- Also changes: `game/src/adapters/phaser/views/equipmentView.js` (`renderLeaderStats`), `game/src/adapters/phaser/views/equipmentView.test.js`, `game/e2e/equipmentUi.spec.js`
- Read first: `game/src/adapters/phaser/views/equipmentView.js:53-62` (`renderLeaderStats`), `game/public/style.css:2606-2632` (`.leader-stats`, `.leader-stats-title`, `.stat-line`), `game/src/domain/equipment/leaderStats.js:19-37` (the order), `game/e2e/equipmentUi.spec.js:1-53` (`startGame`, `openEquipment`)
**Depends on**: None
**Requirement**: TDP-01

**Contract**:

- `renderLeaderStats({ name, lines })` gives each line a second attribute: `el('div', 'stat-line', text, { testid: \`stat-${id}\`, 'data-stat': id })`. Nothing else in the view changes.
- `style.css`, right after the `.stat-line` rule:

```css
/* The two break lines share the last row (spec tech-debt-polish, TD-011): the defense break starts a new row, so the 10 lines fill
   rows of 3, 3, 2 (the two time lines) and 2 (the two break lines) */
.stat-line[data-stat="breakDefense"] {
    grid-column-start: 1;
}
```

- Expected layout (3 equal columns, title row first): row 1 `element`, `clickDamage`, `critChance`; row 2 `critDamage`, `armorPierce`, `bossDamage`; row 3 `minibossTime`, `bossTime`, empty; row 4 `breakDefense`, `breakCrit`, empty.

**Steps**:

1. `equipmentView.js`: add `'data-stat': id` to the attributes of the line in `renderLeaderStats`.
2. `equipmentView.test.js`, `describe('renderLeaderStats')`: add the case below.
3. `style.css`: add the rule above after `.stat-line`.
4. `equipmentUi.spec.js`: add the two e2e cases below inside `test.describe('Equipment UI')`, after `shows the attributes of the leader and follows the gear`.
5. Run the gate.

**Tests**: unit + e2e
**Test cases**:

- `equipmentView.test.js`: `gives every line a data-stat equal to its id` (input: the `stats` of the describe; expected `[ 'clickDamage', 'critChance' ]` from `[...panel.querySelectorAll('.stat-line')].map((line) => line.getAttribute('data-stat'))`).
- `equipmentUi.spec.js`: `the two break lines share the last row and the two time lines the row above` (`startGame(page)`, `openEquipment(page)`; read `boundingBox()` of `stat-element`, `stat-clickDamage`, `stat-minibossTime`, `stat-bossTime`, `stat-breakDefense`, `stat-breakCrit`; expect `breakDefense.y === breakCrit.y`, `breakDefense.x === element.x`, `breakCrit.x === clickDamage.x`, `minibossTime.y === bossTime.y`, `minibossTime.x === element.x`, `bossTime.x === clickDamage.x`, `minibossTime.y < breakDefense.y`; and the texts `Quebra de defesa: 0`, `Quebra de resistência a crítico: 0` (Edge 1: no passives)).
- `equipmentUi.spec.js`: `every attribute line fits on one line` (for each of the 10 `.stat-line` of `leader-stats`: `scrollWidth <= clientWidth`, read with `evaluateAll`; and the count is 10).

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/equipmentUi.spec.js e2e/unifiedDamage.spec.js e2e/heroTeamPassives.spec.js`
**Done when**:

- [x] The 3 new cases pass; `leaderStats.test.js` passes unchanged (order case `gives the lines in the order of the spec`).
- [x] `equipmentUi.spec.js`, `unifiedDamage.spec.js` (`the attribute panel shows Quebra de defesa: 3 and no damage type`, count 10) and `heroTeamPassives.spec.js` (`the attribute panel counts the passives`) pass.
- [x] The commit touches exactly the 4 files above and this file.

**Commit**: `fix(game): put the two break lines side by side in the attribute panel`

---

#### T2: The ally number gets the dark 10 px outline [x]

**Owner**: game-dev
**Goal**: The light-blue ally number keeps its fill and size and draws a `#1c120c` outline 10 px thick; the click numbers keep theirs (TDP-03; spec Ally number AC 1, 2, Edge 2, 3, Q4).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`, `game/e2e/heroTeamCombat.spec.js`
- Read first: `ClickerGame.js:97-102` (`DAMAGE_FONT`, `CRITICAL_TEXT`, `NORMAL_TEXT`, `ALLY_TEXT`), `ClickerGame.js` `showDamage` (`const textStyle = { ...DAMAGE_FONT, ...(style ?? ...) }`), `ClickerGame.test.js` cases `the ally tick shows one light-blue 2 at x 740 in the damage font` and the two click style cases that assert `stroke: '#2a1408', strokeThickness: 8` (search `strokeThickness: 8`), `heroTeamCombat.spec.js:1-80` (helpers `startTeam`, `advance`, `scene`, `LYRA_IN_SLOT_1`)
**Depends on**: None
**Requirement**: TDP-03

**Contract**:

```js
//  The light-blue ally number (spec hero-team Q12) with a darker, thicker outline than the click numbers, so it reads over the light
//  forest (spec tech-debt-polish, TD-013): --wood-900 at 10 px
const ALLY_TEXT = { color: '#7fd4ff', fontSize: 28, stroke: '#1c120c', strokeThickness: 10 };
```

`DAMAGE_FONT`, `CRITICAL_TEXT` and `NORMAL_TEXT` stay as they are. `showDamage` already spreads the style over `DAMAGE_FONT`, so the ally keys win; no other line changes.

**Steps**:

1. Replace the `ALLY_TEXT` constant and its comment with the contract above.
2. `ClickerGame.test.js`: re-pin the case `the ally tick shows one light-blue 2 at x 740 in the damage font`: rename it to `the ally tick shows one light-blue 2 at x 740 in the damage font with the dark 10 px outline` and change its last expectation to `toMatchObject({ color: ALLY_BLUE, fontSize: 28, fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10 })`. This is the only re-pin.
3. `ClickerGame.test.js`: add the case below next to it.
4. `heroTeamCombat.spec.js`: add the two e2e cases below in the describe that holds `an ally hit keeps the combo streak`.
5. Run the gate.

**Tests**: unit + e2e
**Test cases**:

- `ClickerGame.test.js` (re-pinned): `the ally tick shows one light-blue 2 at x 740 in the damage font with the dark 10 px outline` (style above).
- `ClickerGame.test.js` (new): `an ally number on an add uses the same dark 10 px outline` (open the miniboss with adds as the neighbouring add cases do (search `[ '2', 520, 360, '#7fd4ff' ]`), tick 1000 ms; the ally text at x 520 has `stroke: '#1c120c'` and `strokeThickness: 10`).
- `heroTeamCombat.spec.js` (new): `an ally number has the light-blue fill and the dark 10 px outline` (`startTeam(page, { team: LYRA_IN_SLOT_1 })`, `advance(page, 1_000)`; read the last Text whose `style.color` is `#7fd4ff` as `{ color, fontSize, fontFamily, fontStyle, stroke, strokeThickness }`; expected `{ color: '#7fd4ff', fontSize: '28px', fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10 }`).
- `heroTeamCombat.spec.js` (new): `a click number keeps the gold fill and the 8 px outline` (same start; one `strike(page)`; the last Text whose `style.color` is `#ffd35c` has `stroke: '#2a1408'`, `strokeThickness: 8`, `fontSize: '32px'`).

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/heroTeamCombat.spec.js e2e/minibossAddsTarget.spec.js`
**Done when**:

- [x] The re-pinned case and the 3 new cases pass; every other unit test passes unchanged.
- [x] `heroTeamCombat.spec.js` and `minibossAddsTarget.spec.js` pass (they filter the ally texts by the colour `#7fd4ff`, which is unchanged).
- [x] The commit touches exactly `ClickerGame.js`, `ClickerGame.test.js`, `heroTeamCombat.spec.js` and this file.

**Commit**: `fix(game): give the ally damage number a darker, thicker outline`

---

### Phase 2: Test debt and author check

#### T3: Hero-team test debt: the respawn record and the E3 title [ ]

**Owner**: test-engineer
**Goal**: The kill-and-respawn e2e test asserts the respawned monster from a record taken when it is shown, and the E3 domain test names Lyra (TDP-02; spec Test debt AC 1 to 4, Q2, Q3).
**Where**: `game/e2e/heroTeamCombat.spec.js`
**Files**:
- Also changes: `game/src/domain/skills/skillCombat.test.js`
- Read first: `heroTeamCombat.spec.js` test `an ally killing the monster drops its coins and the next monster appears` (about `:324-341`) and the helpers `freeze`, `wake`, `scene` (`:27-41`); `game/src/adapters/phaser/ClickerGame.js` `showEncounter` (sets `this.monster` synchronously), `fadeOutMonster`, `showAfterDelay` (the respawn calls `this.showEncounter(next)`); `skillCombat.test.js` `describe('allyHit')` case starting `E3:`; spec `hero-team` E3 (`.specs/features/hero-team/spec.md:109`); `.specs/LESSONS.md` L-112
**Depends on**: T2
**Requirement**: TDP-02

**Contract** (helper added under `wake` in `heroTeamCombat.spec.js`):

```js
//  Records the main monster at the moment each encounter is shown, inside showEncounter: a respawned monster that the allies kill again a
//  second later is read from this record, never from the live scene (L-112, TD-012)
const recordShownMonsters = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const show = game.showEncounter.bind(game);

    window.__shownMonsters = [];
    game.showEncounter = (encounter) => {
        show(encounter);
        window.__shownMonsters.push(game.monster ? { health: game.monster.health, dead: game.monster.dead } : null);
    };
});
const shownMonsters = (page) => page.evaluate(() => window.__shownMonsters);
```

**Steps**:

1. Add the two helpers above.
2. In `an ally killing the monster drops its coins and the next monster appears`: right before `await wake(page);` add `await recordShownMonsters(page);`. Replace the last line (`await expect.poll(() => scene(page, '(s) => s.monster && !s.monster.dead && s.monster.health')).toBe(10);`) with `await expect.poll(() => shownMonsters(page)).toEqual([ { health: 10, dead: false } ]);`. Keep every other line and value: `allyTexts` `[ { text: '20', x: 740, size: '28px' } ]`, `s.monster.dead` true, the wallet `Gold: 0 Silver: 0 Copper: 0` before and `Gold: 0 Silver: 0 Copper: 3` after.
3. Update the comment above `await wake(page)` to: `//  The respawn, the flying coins and the report run in real time; the new monster is read from the record of showEncounter (TD-012)`.
4. `skillCombat.test.js`: rename the case `E3: Orina 3 stars with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50` to `E3: Lyra 3 stars, an ally without a defense passive, with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50`. Its body and the value 105.6 stay.
5. Run the gate, then the repeat run.

**Tests**: e2e + unit (test-only change; no production file)
**Test cases**:

- `an ally killing the monster drops its coins and the next monster appears`: expected record `[ { health: 10, dead: false } ]`, the other values as in step 2.
- `E3: Lyra 3 stars, an ally without a defense passive, with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50`: `toBeCloseTo(105.6, 9)`.

**Gate**: `cd game && npm test && npx playwright test e2e/heroTeamCombat.spec.js && npx playwright test e2e/heroTeamCombat.spec.js --repeat-each=5 --workers=3`
**Done when**:

- [ ] `grep -n "s.monster && !s.monster.dead" game/e2e/heroTeamCombat.spec.js` prints nothing.
- [ ] `grep -n "E3: Orina" game/src/domain/skills/skillCombat.test.js` prints nothing; `grep -c "E3: Lyra 3 stars, an ally without a defense passive" game/src/domain/skills/skillCombat.test.js` prints 1.
- [ ] The repeat run passes 5 of 5 for every test of the file.
- [ ] Remove `heroTeamCombat.spec.js:324` from the flake list of `.specs/STATE.md` § Handoff, Notes for the resume (1), in the same commit.
- [ ] The commit touches exactly the 2 test files, `.specs/STATE.md` and this file.

**Commit**: `test(game): read the respawned monster from a record and name Lyra in E3`

---

#### T4: Author check [ ]

**Owner**: test-engineer
**Goal**: Every AC and edge case of the spec has a test that asserts its spec value, and the tests kill the injected faults (TDP-01, TDP-02, TDP-03).
**Where**: `.specs/features/tech-debt-polish/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T3, `scripts/sensor.mjs` (usage at its top: `node scripts/sensor.mjs <mutants.json>`)
**Depends on**: T3, T1, T2
**Requirement**: TDP-01, TDP-02, TDP-03

**Steps**:

1. Map each AC and edge case to its test (`file:line`), unit and e2e columns, as in `.specs/features/reset-legacy-drops/tasks.md` § Author check.
2. Write a scratch `mutants.json` (not committed) and run `node scripts/sensor.mjs mutants.json` with at least: (M1) the CSS rule's `grid-column-start: 1` removed; (M2) `grid-column-start: 2`; (M3) `ALLY_TEXT.strokeThickness` 8; (M4) `ALLY_TEXT.stroke` `#2a1408`; (M5) `NORMAL_TEXT` given `strokeThickness: 10` (the click numbers must keep 8); (M6) `renderLeaderStats` without `data-stat`.
3. Append § Author check with the table, the mutant results and the suite totals; any surviving mutant or missing AC becomes a fix task listed there with its owner.

**Tests**: e2e + unit (runs the suites, writes no production code)
**Gate**: `cd game && npm test && npx playwright test e2e/equipmentUi.spec.js e2e/heroTeamCombat.spec.js`
**Done when**:

- [ ] Every AC and edge case maps to a test; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the tech debt polish`

---

### Phase 3: UI review

#### T5: UI review of the attribute panel and the ally number [ ]

**Owner**: ui-artist
**Goal**: The attribute panel shows the two break lines side by side with nothing clipped, and the ally number reaches 3:1 against the forest (TDP-01, TDP-03; spec Ally number AC 3, Q5).
**Where**: `game/ui-review/techDebtPolish.shots.js` (new)
**Files**:
- Also creates: `.specs/features/tech-debt-polish/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/tech-debt-polish/ui-review/*.png`
- Read first: `game/ui-review/heroTeam.shots.js` (shot `09b-field-ally-hit`, its start and the loop sleep), `game/ui-review/unifiedDamage.shots.js` (the attribute panel shot `04b-attributes-panel`), `game/ui-review/support/`, spec Q1, Q4, Q5
**Depends on**: T4
**Requirement**: TDP-01, TDP-03

**Shots** (desktop 1280 x 720 only):

- `01-attributes-panel`: Equipamento of Kael with no passives (break lines `0` and `0`).
- `02-attributes-panel-passives`: Equipamento of Kael in chapter 5 with Orina and Vex in the team (break lines `15` and `15`; the start of `heroTeamPassives.spec.js` `the attribute panel counts the passives`).
- `03-field-ally-hit`: chapter 5, Lyra in ally slot 1, FIRE monster, the loop asleep, one tick of 1000 ms stepped by hand, shot at once (number at alpha 1, over the misty centre of the forest, x 740).
- `04-field-ally-hit-add`: a miniboss with adds, the ally number on an add (x 520), shot the same way.

**Check against**: TDP-01 AC 1, 2, 4 on shots 01 and 02 (rows 3 and 4 as in T1 Contract, no clipped line, 13 px Figtree `--color-neutral-800` on `--parchment-300`). TDP-03 on shots 03 and 04: measure as in spec Q5 and write the 4 forest samples, the outline colour, the fill colour and the two ratios in `ui-review.html`; both ratios at least 3:1. Compare with `.specs/features/hero-team/ui-review/09b-field-ally-hit-desktop.png`.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- techDebtPolish`
**Done when**:

- [ ] `ui-review.html` lists the 4 shots with `APROVADO`, or each finding as a new task in this file with its owner.

**Commit**: `docs(ui): review the attribute panel rows and the ally number outline`

---

## Validation Tables

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | None | Phase 1, no arrow | ✅ Match |
| T3 | T2 (phase 1) | Phase 2 start | ✅ Match |
| T4 | T3, T1, T2 (phase 1) | T3 → T4 | ✅ Match |
| T5 | T4 (phase 2) | Phase 3 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Game view + CSS | unit + e2e | unit + e2e | ✅ OK |
| T2 | Game scene | unit + e2e | unit + e2e | ✅ OK |
| T3 | Existing tests | e2e + unit | e2e + unit | ✅ OK |
| T4 | check | - | e2e + unit runs | ✅ OK |
| T5 | UI review artifact | none | none | ✅ OK |
