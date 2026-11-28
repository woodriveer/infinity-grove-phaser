# Team Click Damage Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T8) and the `ui-artist` review (T9) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/team-click-damage/spec.md`
**Design**: `.specs/features/team-click-damage/design.md`
**Status**: Draft. Waits for the owner's answers to spec Q1 to Q5. If the owner picks a different answer, the product owner revises the affected rows before any task starts: Q1 (a scale factor) changes T2 and every value table; Q2 (no team on the auto click) changes T2 step 4 and the auto click cases; Q4 changes the texts of T3, T5 and T7.

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text or the test name when the line moved.
- **Branch.** Every task works on the branch `ci/team-click-damage` (spec Q14). The first task creates it: `git fetch origin && git switch -c ci/team-click-damage origin/main`. Every later task starts with `git switch ci/team-click-damage && git pull --rebase origin ci/team-click-damage`. Push right after each commit: `git push origin HEAD:ci/team-click-damage`. No task pushes to `main`; `gitops` merges once T8's CI run is green and T9 is APROVADO.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` (`py -3` on this machine), ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's files and `graphify-out/`, which no task stages.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- **Re-pinning existing tests.** A task changes an existing test only where its table lists it, only to the name and value given, and deletes a test only where the table says `delete`. Name every re-pinned and deleted test in the commit body. If a test the task does not list fails, stop and report it to the orchestrator; do not change it.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times. Run one Playwright file at a time, never the full e2e suite (CI runs it). No suite runs in the background.
- Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003). Player text in Portuguese exactly as spec § Player-Facing Texts (AD-007), with its accents; files stay UTF-8.
- The desktop is the target. No task adds phone behaviour.

Shared vocabulary of the tables below:

- **`team(ctx)`** (unit, module helper added by T2 in `ClickerGame.test.js`) and **`team(page)`** (e2e, helper added in each file that needs it): call `scene.teamStrike(scene.currentTarget())` then `scene.afterDamage()`. This is the team's part of a click without the click; its number stands at the ally place (x 740 on the main monster, add x + 40 on an add), so the values of the old tick tests stay.
- **`advance -> team`** in a table means: replace the `advance(page, 1_000)` / `advance(page, 1000)` / `ctx.scene.update(0, 1000)` call that landed an ally tick with `team(page)` / `team(ctx)`, keep every assertion.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour; heavy suites only in CI), `.claude/agents/test-engineer.md` (author check, mutants with `scripts/sensor.mjs`), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome, fake backend). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Game domain (`allyCombat.js`, `allyAttacker.js`) | unit | `landTeam` every rule (slot order, sum, target read before each hit, stop at a missing or dead target, empty allies); the renamed `allyDamagePerClick` values | `game/src/domain/combat/*.test.js` | `cd game && npm test` |
| Game scene (`ClickerGame.js`) | unit | TCD-01 AC 1 to 11, TCD-02 AC 1 to 4, TCD-03 AC 1 to 7; spec E1 to E9, E12, E13; every re-pin of the tables | `game/src/adapters/phaser/ClickerGame.test.js` | `cd game && npm test` |
| Game view and CSS (`teamView.js`, `style.css`) | unit + e2e | TCD-04 AC 1 to 4 | `game/src/adapters/phaser/views/teamView.test.js`, `game/e2e/teamClickDamage.spec.js` | `cd game && npm test`, `npx playwright test e2e/teamClickDamage.spec.js` |
| Player-visible behaviour | e2e | Every AC of TCD-01 to TCD-04 in Chrome and every spec Edge Case (L-062, L-099); every existing e2e file pinned to the ally clock keeps passing with the re-pins | `game/e2e/teamClickDamage.spec.js` and the files of T4 to T6 | `cd game && npx playwright test e2e/<file>` |
| E2E support and review shot files | none (support code; exercised by the e2e files that use it) | - | `game/e2e/support/affixFight.js`, `game/ui-review/*.shots.js` | the gate of T6 |
| `README.md` | none | Text of TCD-05 | `README.md` | review in T8 |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/teamClickDamage.shots.js` | `cd game && npm run ui:shots -- teamClickDamage` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | T1 to T3 | `cd game && npm test && npm run build` |
| E2E file | T4 to T7 | `cd game && npm test && npx playwright test e2e/<one file>` (one file per run, every file of the task in turn) |
| CI | T8 | `git push origin HEAD:ci/team-click-damage` then `node scripts/ci-wait.mjs ci/team-click-damage` (foreground, `timeout: 600000`) |

---

## Execution Plan

### Phase 1: Game (game-dev)

```
T1 → T2 → T3
```

### Phase 2: Tests in the browser and author check (test-engineer)

```
T4 → T5 → T6 → T7 → T8
```

### Phase 3: UI review (ui-artist)

```
T9
```

---

## Task Breakdown

### Phase 1: Game

#### T1: `landTeam` lands one round of ally hits [x]

**Owner**: game-dev
**Goal**: A pure function lands every fighting ally once on the target read before each hit and reports each hit's target (TCD-01 AC 1, 7, 8).
**Where**: `game/src/domain/combat/allyCombat.js`
**Files**:
- Also changes: `game/src/domain/combat/allyCombat.test.js`
- Read first: design § `landTeam`; `allyCombat.js` (whole, 79 lines); `allyCombat.test.js:1-13` (fixtures `hitter`, `hit`, `one`) and the case `the target is read before every hit` (`:118`)
**Depends on**: None
**Requirement**: TCD-01

**Contract**:

```js
//  One round of the team (spec team-click-damage): every ally in slot order hits the target read right before its hit; a missing or dead
//  target ends the round, so the later slots do not land. Pure JavaScript: no Phaser.
//    allies  [ { slot, attacker } ] in slot order
//    hit(attacker, target) -> damage   lands one hit
//    target() the monster the next hit lands on
//  Returns { slots, damage, hits: [ { slot, target, damage } ] } in the order the hits landed.
export const landTeam = ({ allies, hit, target }) => { ... };
```

Body: `const slots = []; const hits = []; let damage = 0;` then `for (const { slot, attacker } of allies)`: `const aim = target(); if (!aim || aim.dead) { break; } const dealt = hit(attacker, aim); slots.push(slot); hits.push({ slot, target: aim, damage: dealt }); damage += dealt;`; return `{ slots, damage, hits }`.

**Steps**:

1. Add `landTeam` (Contract) at the end of `allyCombat.js`. Leave `ALLY_TICK_MS` and `AllyCombat` as they are (T2 removes them).
2. Import `landTeam` in `allyCombat.test.js` next to `AllyCombat` and add `describe('landTeam', ...)` after the existing describe with the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`game/src/domain/combat/allyCombat.test.js`, `describe('landTeam')`; `Monster` from `./monster`, fixtures of the file):

1. `lands every ally in slot order and sums the round`: `m = new Monster(100)`, allies `[ { slot: 1, attacker: hitter(2) }, { slot: 2, attacker: hitter(3) } ]`, `target: () => m` -> result `toEqual({ slots: [ 1, 2 ], damage: 5, hits: [ { slot: 1, target: m, damage: 2 }, { slot: 2, target: m, damage: 3 } ] })`; `m.health` 95; the `hit` mock was called with attackers of base 2 then 3.
2. `a kill stops the later slots`: `new Monster(2)`, the same two allies -> `slots` `[ 1 ]`, `damage` 2, `hit` called once.
3. `the target is read before every hit`: `a`, `b` = `new Monster(100)`, `targets = [ a, b ]`, `target: () => targets.shift()` -> `hits.map((h) => h.target)` `[ a, b ]`; `a.health` 98, `b.health` 97.
4. `a target that dies mid-round hands the later slots to the next target`: `a = new Monster(2)`, `b = new Monster(100)`, `target: () => (a.dead ? b : a)` -> `hits.map((h) => h.target)` `[ a, b ]`; `a.dead` true; `b.health` 97.
5. `a null target lands nothing`: `target: () => null`, `one()` -> `{ slots: [], damage: 0, hits: [] }`; `hit` not called.
6. `a dead target lands nothing`: `m = new Monster(1)`, `m.hit(1)` first -> `{ slots: [], damage: 0, hits: [] }`; `hit` not called.
7. `no ally lands nothing`: `allies: []` -> `{ slots: [], damage: 0, hits: [] }`.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 7 cases pass; every existing case of `allyCombat.test.js` still passes.
- [x] Gate passes.

**Commit**: `feat(game): land one round of ally hits with landTeam`

---

#### T2: Every click brings the team strike; the ally clock goes [x]

**Owner**: game-dev
**Goal**: `strike` lands the team right after the click hit(s), shows the light-blue sum 8 px right of the last click number, and nothing else lands ally hits (TCD-01, TCD-02, TCD-03).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`, `game/src/domain/combat/allyCombat.js` (remove `ALLY_TICK_MS` and `AllyCombat`), `game/src/domain/combat/allyCombat.test.js` (remove `describe('AllyCombat')` and its import)
- Read first: design § `ClickerGame.strike`, § `teamStrike`, § `update`; spec Examples E1 to E13; `ClickerGame.js:9` (import), `:104-110` (`DAMAGE_FONT`, `ALLY_TEXT`, `ALLY_TEXT_OFFSET`), `:176` (`this.allies = new AllyCombat()`), `:1200-1250` (`update`), `:1293-1372` (`fightingAllies` to `onAllyTick`), `:1541-1639` (`hitMonster` to `strike`), `:1913-1927` (`showDamage`); `ClickerGame.test.js:82-86` (`teamPayload`, `teamHeroes`), `:171-177` (fake `text`), `:5488-5516` (helpers `open`, `allyTexts`, `hp`, `withDefense`, `ironMonster`), `:5785-5793` (`key`, `bigMonster`, `tree`), `:3434-3442` (`leaderOf`, colours of the double click)
**Depends on**: T1
**Requirement**: TCD-01, TCD-02, TCD-03

**Contract** (`ClickerGame.js`):

- Import: replace `import { AllyCombat } from '../../domain/combat/allyCombat';` with `import { landTeam } from '../../domain/combat/allyCombat';`.
- Constant after `ALLY_TEXT_OFFSET`: `//  The team number of a click stands 8 px right of the click number it follows (spec team-click-damage TCD-03)` and `const TEAM_TEXT_GAP = 8;`.
- `create`: delete `this.allies = new AllyCombat();`.
- `update`: delete the comment `//  The allies strike first, ...` and `const allyTicks = this.allyFrame(delta);`; the condition becomes `if (alive && (this.monster.dead || hits.length > 0))`.
- Delete the method `allyFrame` with its comment.
- Rename `onAllyTick (slots)` to `stepAllies (slots)`; comment: `//  The sprites of the slots that hit with this click step 24 px toward the monster and back, 100 ms each way`. Body unchanged.
- `showDamage (damage, x, critical = false, style = null, y = this.damageTextY, originX = 0.5)`: `.setOrigin(originX, 1)` instead of `.setOrigin(0.5, 1)`; add `return text;` at the end. Comment: add `; returns the Text (strike anchors the team number on it)`.
- `strike`: declare `let last = null;` before the loop; in the loop `last = this.showDamage(formatDamage(damage), x + hit * DOUBLE_HIT_OFFSET, critical, null, this.numberYOf(monster));`; after the loop and before `this.showCombo();` add:
  ```js
  //  The team strikes with the click (spec team-click-damage), unless the click killed the main monster
  if (this.monster && !this.monster.dead)
  {
      this.teamStrike(monster, last);
  }
  ```
  Update the comment above `strike` to say one click is the click hit(s), then the team strike, then the kill path once.
- New method right after `allyAttackers`:
  ```js
  //  The team's part of a click (spec team-click-damage): every fighting ally, in slot order, hits the target read right before its hit with the
  //  one damage of a tick (never critical, no combo). One light-blue number per monster hit, with the sum of its hits: on `clicked` it stands
  //  8 px right of `anchor` (the last click number) on the same baseline; on any other monster, or with no anchor, at that monster's ally
  //  place. The sprites that hit step. The caller runs afterDamage. Returns how many allies hit.
  teamStrike (clicked, anchor = null)
  ```
  Body as design § `teamStrike` rules 1 to 5: `const allies = this.allyAttackers();` `if (allies.length === 0 || !this.monster || this.monster.dead) { return 0; }`; `const boss = this.countdown !== null;`; `const { slots, hits } = landTeam({ allies, target: () => this.currentTarget(), hit: (attacker, target) => this.skills.allyHit({ attacker, monster: target, main: this.monster, boss }).damage });`; a `Map` of sums per target in first-hit order; for each entry: `target === clicked && anchor` -> `this.showDamage(formatDamage(sum), anchor.x + anchor.width * (1 - anchor.originX) + TEAM_TEXT_GAP, false, ALLY_TEXT, anchor.y, 0)`, else `this.showDamage(formatDamage(sum), this.allyNumberXOf(target), false, ALLY_TEXT, this.numberYOf(target))`; `this.stepAllies(slots);` `return slots.length;`.
- `allyCombat.js`: delete `ALLY_TICK_MS`, the class `AllyCombat` and the two header comment lines about the clock; the file header becomes `//  The team of the fight (spec hero-team, team-click-damage): one round of ally hits per click. Pure JavaScript: no Phaser.`

**Steps**:

1. `ClickerGame.test.js:172`: the fake Text gets a width: `const obj = { x, y, text, style, alpha: 1, width: String(text).length * 20, destroy: vi.fn() };` (a `1` is 20 px wide, `0.4` 60 px).
2. `ClickerGame.test.js`, after `teamHeroes` (`:86`), add the module helper:
   ```js
   //  The team's part of a click without the click (spec team-click-damage): lands it on the target, then the kill path, as strike does
   const team = (ctx) =>
   {
       ctx.scene.teamStrike(ctx.scene.currentTarget());
       ctx.scene.afterDamage();
   };
   ```
3. Edit `ClickerGame.js` as in the Contract.
4. Edit `allyCombat.js` and `allyCombat.test.js` as in the Contract (the 13 cases of `describe('AllyCombat')` are deleted: `lands nothing at 999 ms and one tick at 1000 ms`, `hits in slot order and sums the tick`, `a kill stops the later slots of the tick`, `the clock starts again at 1000 ms for the next monster after a kill`, `a new monster restarts the clock`, `no monster lands nothing and puts the clock back at 1000 ms`, `a dead monster lands nothing`, `no ally lands nothing and puts the clock back at 1000 ms`, `one advance of 2500 ms lands two ticks and keeps 500 ms`, `the target is read before every hit`, `a null target ends the tick`, `the clock follows the monster, not the target`, and any other case in that describe; `landTeam` of T1 covers their rules).
5. Apply the re-pin table below in `ClickerGame.test.js`.
6. Add the new cases below.
7. Run the gate.

**Re-pins** (`ClickerGame.test.js`; old name -> new name; change; expected):

| # | Describe | Old name | New name | Change | Expected |
| --- | --- | --- | --- | --- | --- |
| 1 | `ClickerGame hero team` | `a fighting ally hits the monster for 2 at 1000 ms with no click` | `a click with Lyra in slot 1 deals 1 and her 2: health 10 to 7` | body: `ctx.click();` | `ctx.scene.monster.health` 7; `ctx.texts.map((t) => [ t.text, t.style.color ])` `[ [ '1', '#ffd35c' ], [ '2', '#7fd4ff' ] ]` |
| 2 | same | `the ally tick shows one light-blue 2 at x 740 in the damage font with the dark 10 px outline` | `the team strike shows one light-blue 2 at x 740 in the damage font with the dark 10 px outline` | advance -> team | unchanged |
| 3 | same | `two allies show one number with the sum of the tick` | `two allies show one number with the sum of the team strike` | advance -> team | unchanged (`[ '4' ]`, health 6) |
| 4 | same | `the one summed number of two allies in the same tick uses the dark 10 px outline` | `the one summed number of two allies uses the dark 10 px outline` | advance -> team | unchanged |
| 5 | same | `Seraphine as an ally multiplies every ally hit by 1.25` | unchanged | advance -> team | unchanged (`[ '5' ]`, health 5) |
| 6 | same | `an ally hit that does not kill moves the health bar and the HP text` | unchanged | advance -> team | unchanged |
| 7 | same | `an ally kill is handled once and the later slots do not land` | unchanged | first `ctx.scene.update(0, 1000)` -> `team(ctx)`; the second stays | unchanged |
| 8 | same | `no ally hits while the campaign stands at chapter 4` | `a click lands no team hit while the campaign stands at chapter 4` | `ctx.scene.update(0, 3000)` -> `ctx.click()` | health 9; `allyTexts(ctx)` length 0 |
| 9 | same | `no ally hits before the heroes load` | `a click lands no team hit before the heroes load` | `ctx.scene.update(0, 3000)` -> `ctx.click()` | health 9 |
| 10 | same | `a heroes payload without team lands no ally hit` | `a heroes payload without team lands no team hit with a click` | `ctx.scene.update(0, 3000)` -> `ctx.click()` | health 9 |
| 11 | same | `an ally hit leaves the combo streak unchanged` | `a team strike leaves the combo streak unchanged` | advance -> team | unchanged |
| 12 | same | `the pause menu freezes the ally clock` | `a click while paused lands neither the click nor the team` | body: `ctx.scene.pauseFight(); ctx.click(); ctx.scene.update(0, 10000);` | health 10; `allyTexts(ctx)` length 0 |
| 13 | same | `ally hits keep landing while a hero screen is open` | `with a hero screen open a click does nothing and the auto click brings the team` | `open([ 'lyra', null, null, null ], { autoClickOn: true })`; `await ctx.scene.heroUi.show('heroes'); ctx.click();` assert; then `ctx.scene.update(0, 500);` | health 10 after the click; 7 after the 500 ms |
| 14 | same | `a leader change switches the element of the next ally hit` | `a leader change switches the element of the next team strike` | both updates -> `team(ctx)` | unchanged (8, then 7) |
| 15 | same | `an ally that equips a piece hits with it on the next tick` | `an ally that equips a piece hits with it on the next team strike` | both updates -> `team(ctx)` | unchanged (8, then 4) |
| 16 | same | `Orina as an ally shows Defesa 25% on a monster of defense 40` | `Orina as an ally shows Defesa 25% on a monster of defense 40 and a click deals 0.75 plus her 1.5` | none | health `toBeCloseTo(7.75, 9)` (spec E11) |
| 17 | same | `Lyra as an ally makes a roll of 15 a critical click` | unchanged | none | `withLyra` health 6 (critical 2 + Lyra 2); `without` 9 |
| 18 | nested `the frame where an effect ends...` | `an ally tick in the frame where Prisão de Espinhos ends still gets +25 %: 2.5 at 2000 ms, 2 after it` | `a team strike under Prisão de Espinhos gets +25 %: 2.5, and 2 once it ended` | body: `key(ctx, 'ONE'); team(ctx);` assert; `ctx.scene.update(0, 2000); team(ctx);` assert | first: health `toBeCloseTo(997.5, 9)`, `allyTexts` `[ '2.5' ]`; then `[ '2.5', '2' ]`, health `toBeCloseTo(995.5, 9)` |
| 19 | same | `an ally tick in the frame where Bênção da Grande Árvore ends still gets +30 %: 2.6 at 15000 ms, 2 after it` | `a team strike under Bênção da Grande Árvore gets +30 %: 2.6, and 2 once it ended` | body: `key(ctx, 'ONE'); team(ctx);` assert; `ctx.scene.update(0, 15000); team(ctx);` assert | first: health `toBeCloseTo(997.4, 9)`, last ally text `2.6`; then last ally text `2`, health `toBeCloseTo(995.4, 9)` |
| 20 | same | `an ally that fuses to more stars hits with the new multiplier on the next tick: 4, then 6` | `an ally that fuses to more stars hits with the new multiplier on the next team strike: 4, then 6` | both updates -> `team(ctx)` | unchanged (996, then 990) |
| 21 | same | `power talents of the leader (CLICK_DAMAGE 20, CRIT_CHANCE 20) reach the click but leave the ally tick at 2` | `power talents of the leader (CLICK_DAMAGE 20, CRIT_CHANCE 20) reach the click but leave the team hit at 2` | after `ctx.click()`: assert; `ctx.dice.value = 0;` then `team(ctx)` instead of the update | after the click: health `toBeCloseTo(996.8, 9)`, `allyTexts` `[ '2' ]`; after the team: `[ '2', '2' ]`, health `toBeCloseTo(994.8, 9)` |
| 22 | `ClickerGame hero team formation` | `each ally hit moves its sprite 24 px right and back in 100 ms each way` | `each team strike moves its sprite 24 px right and back in 100 ms each way` | advance -> team | unchanged |
| 23 | same | `a kill moves only the slots that landed` | unchanged | advance -> team | unchanged |
| 24 | `ClickerGame miniboss adds` | `the Erosão Arcana of an Orina ally takes 15 points off the defense of an add: two hits of 1.9 show one 3.8, not 3.2` | unchanged | advance -> team (`before` stays after the click) | unchanged (`[ [ '3.8', 520, 360, '#7fd4ff' ] ]`) |
| 25 | `ClickerGame miniboss target` | `an ally meets the guarded miniboss: Lyra deals 0.2 at x 740` | unchanged | advance -> team | unchanged |
| 26 | same | `an ally hits the target add for 2 with its number at (520, 360)` | unchanged | advance -> team | after the click `healthOf(ctx, 1)` `toBeCloseTo(27, 9)` (was 29); after the team 25 (was 27); last text unchanged |
| 27 | same | `an ally number on an add uses the same dark 10 px outline` | unchanged | advance -> team | unchanged |
| 28 | same | `an ally tick that kills the target add lands its later hits on the miniboss with one number each` | `a click whose team strike kills the target add lands the later hit on the miniboss with one number each` | take `const before = ctx.texts.length;` before `ctx.click(lacaio1)`; delete the `toBeCloseTo(1, 9)` line and the `update` | add 1 dead; `ctx.scene.monster.health` `toBeCloseTo(99.58, 9)`; `ctx.texts.slice(before).map(({ text, x, y, style }) => [ text, x, y, style.color ])` `[ [ '1', 480, 360, '#ffd35c' ], [ '2', 498, 360, '#7fd4ff' ], [ '0.4', 740, 273, '#7fd4ff' ] ]` (spec E7) |
| 29 | same | `the ally clock does not restart when the target changes` | delete | - | - |

**New cases** (`ClickerGame.test.js`, a nested `describe('team click damage (spec team-click-damage)', ...)` at the end of `describe('ClickerGame hero team')`, after the nested `the frame where an effect ends...`; inside it define `const big = (monster = { element: 'FIRE', defense: 0, critResistance: 0 }, health = 1000) => ({ ...atChapter(5), definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: health, monster })) } });` and `const key = (ctx, name) => ctx.handlers[\`keydown-${name}\`]();`):

1. `the team number stands 8 px right of the click number on its baseline, left-anchored` (E1, TCD-03 AC 1, 2): `open([ 'lyra', null, null, null ])`, `ctx.click()` -> `ctx.texts[0]` `toMatchObject({ text: '1', x: 670, originX: 0.5, originY: 1 })`; `ctx.texts[1]` `toMatchObject({ text: '2', x: 688, y: ctx.texts[0].y, originX: 0, originY: 1 })`; `ctx.texts[1].style` `toMatchObject({ color: '#7fd4ff', fontSize: 28, fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10 })`.
2. `the click number and the team number rise 40 px and fade over 800 ms` (TCD-03 AC 3): after `ctx.click()`, for each of `ctx.texts[0]`, `ctx.texts[1]`: `ctx.tweens.find((t) => t.targets === text)` `toMatchObject({ y: text.y - 40, alpha: 0, duration: 800 })`.
3. `two allies: a click shows 1 and one 4, health 5` (E2): `open([ 'lyra', 'orina', null, null ])`, `ctx.click()` -> texts `[ '1', '4' ]`, health 5.
4. `a click that kills shows no team number` (E4, TCD-01 AC 6): `open([ 'lyra', null, null, null ], { start: big(undefined, 1) })`, `ctx.click()` -> `ctx.scene.monster.dead` true; `ctx.texts.map((t) => t.text)` `[ '1' ]`.
5. `a team hit that kills with the click is handled once and Orina does not hit` (E3, TCD-01 AC 8): `open([ 'lyra', 'orina', null, null ], { heroOptions: { stars: { lyra: 9 } }, wallet: walletResponse(undefined, { 1: [ 3 ] }) })`, `ctx.click()` -> dead; texts `[ '1', '20' ]`; `ctx.sprites` length 3; `ctx.scene.update(0, 1000)` -> `ctx.texts` length 2; `ctx.sprites` length 3.
6. `10 s with no click land no team hit` (E9, TCD-02 AC 1): `open([ 'lyra', null, null, null ])`, `ctx.scene.update(0, 10000)` -> health 10; `allyTexts(ctx)` length 0.
7. `the scene has no ally clock` (TCD-02 AC 2): `expect(ctx.scene.allies).toBeUndefined()`; `expect(ctx.scene.allyFrame).toBeUndefined()`.
8. `the auto click brings the team: 500 ms deal 1 and 2` (E8, TCD-01 AC 4): `open([ 'lyra', null, null, null ], { autoClickOn: true, start: big() })`, `ctx.scene.update(0, 500)` -> health 997; `ctx.texts.map((t) => [ t.text, t.x ])` `[ [ '1', 670 ], [ '2', 688 ] ]`; `ctx.scene.update(0, 499)` -> 997.
9. `Lyra's double click: orange 2 at 670 and 706, then the team's 2 at 724` (E6, TCD-01 AC 5): `open([ 'kael', null, null, null ], { heroOptions: { leaderId: 'lyra' }, start: big({ element: 'NATURE', defense: 0, critResistance: 0 }) })`, `ctx.dice.value = 0`, `ctx.click()` -> `ctx.texts.map((t) => [ t.text, t.x, t.style.color ])` `[ [ '2', 670, '#ff8a1f' ], [ '2', 706, '#ff8a1f' ], [ '2', 724, '#7fd4ff' ] ]`; health 994.
10. `the combo does not reach the team: three clicks leave 990.97 with three team 2` (E12, TCD-01 AC 3): `open([ 'lyra', null, null, null ], { start: big(), talents: [ COMBO_MAXED ] })`, three `ctx.click()` -> health `toBeCloseTo(990.97, 9)`; `allyTexts(ctx).map((t) => t.text)` `[ '2', '2', '2' ]`.
11. `five clicks in a row show five click numbers and five team numbers` (Edge, TCD-03 AC 5): `open([ 'lyra', null, null, null ], { start: big() })`, five `ctx.click()` -> gold texts `[ '1', '1', '1', '1', '1' ]`, `allyTexts` `[ '2', '2', '2', '2', '2' ]`, health 985.
12. `a skill brings no team strike` (TCD-01 AC 9): `open([ 'lyra', null, null, null ], { heroOptions: { stars: { kael: 1 } }, start: big() })`, `key(ctx, 'ONE')` -> `allyTexts(ctx)` length 0.

**New case** (`describe('ClickerGame hero team formation')`, after `a kill moves only the slots that landed`):

13. `a click that kills steps no ally sprite` (E4, TCD-03 AC 7): `open([ 'lyra', null, null, null ], { start: { ...atChapter(5), definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1 })) } } })`, `ctx.click()` -> `ctx.tweens.filter((t) => t.targets === sprite(ctx, 'hero_lyra'))` length 0.

**Tests**: unit
**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] `git grep -n "AllyCombat\|ALLY_TICK_MS\|allyFrame\|onAllyTick" game/src` prints nothing.
- [x] The 13 new cases pass; the 28 re-pins carry the names and values of the table; the deleted cases are the 13 of `describe('AllyCombat')` and row 29.
- [x] Gate passes (the e2e suite is expected red until T6; do not run it).

**Execution notes (T2)**:

- Extra re-pin, approved by the orchestrator: `ClickerGame hero team formation` > `no ally sprite takes input` expects `monster.health` `toBe(5)` (was 9): the click on the ally sprite area now brings Lyra's 2 and Orina's 2 (1 + 2 + 2); its intent is unchanged.
- The first Done-when grep still matches one line by design: new case 7 asserts `expect(ctx.scene.allyFrame).toBeUndefined()`. Production code has no match.
- `describe('AllyCombat')` held 12 cases, not 13; all 12 are deleted.
- New case 9 (Lyra's double click) uses the default FIRE monster of `big()`, not NATURE: the unit `heroEntry` makes every hero FIRE, so a NATURE monster doubles the damage (4, not 2). Expected values unchanged (2, 2, 2; health 994).

**Commit**: `feat(game): the team strikes with every click instead of every second`

---

#### T3: Equipe reads damage per click [x]

**Owner**: game-dev
**Goal**: The Equipe lines read `Dano: <n>/clique` and `Dano da equipe por clique: <n>`, the ally line stays on one line, and the README says how the team fights (TCD-04, TCD-05).
**Where**: `game/src/adapters/phaser/views/teamView.js`
**Files**:
- Also changes: `game/src/domain/combat/allyAttacker.js`, `game/src/domain/combat/allyAttacker.test.js`, `game/src/adapters/phaser/views/teamView.test.js`, `game/public/style.css`, `README.md`
- Read first: spec § Player-Facing Texts, TCD-04; `teamView.js:1-61`; `allyAttacker.js:27-28`; `teamView.test.js:17-45`, `:111-119`; `allyAttacker.test.js:1-5`, `:69-74`; `style.css:3509` (`.team-dps-line`); `README.md:48`
**Depends on**: T2
**Requirement**: TCD-04, TCD-05

**Contract**:

- `allyAttacker.js`: rename `allyDamagePerSecond` to `allyDamagePerClick` (same body); its comment: `//  What the Equipe screen shows as \`Dano: <n>/clique\`: the base of the attacker, before element, defense and boss factor`.
- `teamView.js`: import `allyDamagePerClick`; `dpsText: \`Dano: ${formatDamage(damage)}/clique\``; `teamDpsText: \`Dano da equipe por clique: ${formatDamage(teamDps)}\``. Field names, classes and test ids unchanged (spec Q13).
- `style.css` `.team-dps-line`: add `white-space: nowrap;` to the existing rule (keep the other declarations).
- `README.md:48`: replace the line with `- Cada aliado ataca junto com cada clique do jogador (manual ou auto clique), com o mesmo dano de todos os golpes, e traz uma passiva enquanto está na equipe.`

**Steps**:

1. Edit `allyAttacker.js`, then `teamView.js`, `style.css` and `README.md` as in the Contract.
2. Apply the re-pins below.
3. Run the gate.

**Re-pins**:

| File | Test | Change |
| --- | --- | --- |
| `allyAttacker.test.js` | `allyDamagePerSecond reads 2, 105.6, 2.5 and 12500` | rename `allyDamagePerClick reads 2, 105.6, 2.5 and 12500`; the import and the four calls use `allyDamagePerClick`; values unchanged |
| `teamView.test.js` | `the model of a team with Lyra in slot 1 and slot 2 buyable` | `dpsText: 'Dano: 2/clique'`; `teamDpsText` `'Dano da equipe por clique: 2'` |
| `teamView.test.js` | `Seraphine raises every shown damage by 1.25` | `[ 'Dano: 2.5/clique', 'Dano: 2.5/clique' ]`; `'Dano da equipe por clique: 5'` |
| `teamView.test.js` | `the shown damage of a 9 star Lyra with a 624 click weapon reads 12.5K` | `'Dano: 12.5K/clique'` |
| `teamView.test.js` | `no ally reads Dano da equipe: 0/s` | rename `no ally reads Dano da equipe por clique: 0`; value `'Dano da equipe por clique: 0'` |
| `teamView.test.js` | `the screen shows a filled ally card with its damage and passive` | `'Dano: 2/clique'` |

**Tests**: unit
**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] `git grep -n "allyDamagePerSecond\|/s\`\|/s'" game/src/adapters/phaser/views/teamView.js game/src/domain/combat/allyAttacker.js` prints nothing.
- [x] The re-pins carry the values of the table; gate passes.

**Commit**: `feat(game): Equipe shows the team damage per click`

---

### Phase 2: Tests in the browser and author check

#### T4: The hero team combat e2e follows the click [x]

**Owner**: test-engineer
**Goal**: `heroTeamCombat.spec.js` stops stepping the ally clock and keeps every Ally Damage value through the team strike (TCD-01, TCD-02).
**Where**: `game/e2e/heroTeamCombat.spec.js`
**Files**:
- Read first: the shared vocabulary above; spec E1 to E13; `heroTeamCombat.spec.js:1-118` (helpers), `ClickerGame.js` `teamStrike` and `strike` (after T2)
**Depends on**: T3
**Requirement**: TCD-01, TCD-02

**Steps**:

1. Header comment (`:6-9`): replace the clock sentences with `The allies hit once with every click (spec team-click-damage), never critical, with the one damage of every strike. ... The Phaser loop is stopped once the game has loaded: time moves only with advance(page, ms); team(page) lands the team's part of a click without the click.`
2. `freeze`: delete `game.scene.getScene('ClickerGame').allies.untilTickMs = 1000;` and change its comment to `//  Stops the loop`.
3. Add after `wake`: the `team(page)` helper: `const team = (page) => page.evaluate(() => { const s = window.__PHASER_GAME__.scene.getScene('ClickerGame'); s.teamStrike(s.currentTarget()); s.afterDamage(); });` with the comment `//  The team's part of a click without the click: lands it on the target, then the kill path, as strike does`.
4. `startTeam` comment above `if (stop)` (`The first ally tick lands 1000 ms after the team loads...`): `//  The loop sleeps first so no real frame runs an auto click or a respawn while the test reads the scene`.
5. Apply the table, then run the gate.

**Re-pins** (`describe('Hero team: ally hits')`):

| # | Old name | New name | Change | Expected |
| --- | --- | --- | --- | --- |
| 1 | `Lyra in slot 1 hits a FIRE monster of 10 health for 2 after 1 s with no click, in light blue at x 740` | `Lyra in slot 1 lands nothing in 10 s with no click, and a team strike hits a FIRE monster of 10 health for 2 in light blue at x 740` | `advance(page, 999)` -> `advance(page, 10_000)`; `advance(page, 1)` -> `team(page)` | after 10 s: health 10, `allyTexts` `[]`; after the team: health 8, `monster-hp` `HP 8/10`, `allyTexts` `[ { text: '2', x: 740, size: '28px' } ]` |
| 2 | `after a reset to chapter 1 a monster takes no damage from allies for 3 s` | `after a reset to chapter 1 a click deals no team damage` | replace the real-time `expect.poll(() => health(page), ...)` with `await freeze(page); await strike(page);` assert, `await wake(page);`; keep the reset steps; after `reset-dialog` hidden keep the `allyTexts` poll and `freeze`; replace `advance(page, 3_000)` with `strike(page)` | after the first strike health 997; after the reset health 1000; after the second strike health 999 and `allyTexts` `[]` |
| 3 | `an ally meets the one defense: Lyra deals 1 to a FIRE monster with defense 50` | unchanged | advance -> team | unchanged |
| 4 | `an old payload with physicalDefense 50 halves the ally hit too` | unchanged | advance -> team | unchanged |
| 5 | `Vex with 50 % armor pierce deals 1.6 to defense 40` | unchanged | advance -> team | unchanged |
| 6 | `Prisão de Espinhos raises an ally hit to 2.5` | unchanged | `advance(page, 999); useThenAdvance(page, 1, 1)` -> `useSkill(page, 1); team(page)` | unchanged (2.5) |
| 7 | `Bênção da Grande Árvore raises an ally hit to 2.6` | unchanged | advance -> team | unchanged |
| 8 | `Brado Aterrador lowers the defense an ally meets: 1.8 against defense 40` | unchanged | advance -> team | unchanged |
| 9 | `PHYSICAL_BREAK 5 lowers the defense an ally meets: 1.3 against defense 40` | unchanged | advance -> team | unchanged |
| 10 | `Ventos Ligeiros, a running combo and critical pieces leave an ally hit at 2` | `Ventos Ligeiros, a running combo and critical pieces leave a team hit at 2` | the last advance -> team; comment `The clicks are on the monster; only the team strike that follows is measured` | unchanged |
| 11 | `a 3 star leader leaves the ally hit at 2` | `a 3 star leader leaves the team hit at 2` | advance -> team | unchanged |
| 12 | `Lyra 3 stars with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50` | unchanged | advance -> team | unchanged |
| 13 | `Orina 3 stars with the same pieces also lowers the defense by 15: 13.2 x 8 x 2 x 0.65 = 137.28` | unchanged | advance -> team | unchanged |
| 14 | `a 9 star Lyra deals 20` | unchanged | advance -> team | unchanged |
| 15 | `Lyra with +20 % boss damage deals 2.16 to a FIRE miniboss with defense 10` | unchanged | advance -> team | unchanged |
| 16 | `an ally hit uses the new leader's element after a leader change` | unchanged | both advances -> team | unchanged |
| 17 | `an ally that equips a piece hits with it on the next tick` | `an ally that equips a piece hits with it on the next team strike` | both advances -> team | unchanged |
| 18 | `an ally killing the monster drops its coins and the next monster appears` | unchanged | advance -> team; comment `Lyra's 20 kills the monster of 10: Orina's hit of the same team strike does not land` | unchanged |
| 19 | `an ally hit keeps the combo streak` | `a team strike keeps the combo streak` | advance -> team | unchanged |
| 20 | `an ally number has the light-blue fill and the dark 10 px outline` | unchanged | advance -> team | unchanged |
| 21 | `two allies in one tick draw one number with the dark 10 px outline` | `two allies in one team strike draw one number with the dark 10 px outline` | advance -> team | unchanged |
| 22 | `ally hits keep landing while Heróis is open` | delete (T7 scenario 7 covers it with the auto click) | - | - |
| 23 | `the pause menu freezes the ally clock` | `a click while paused lands neither the click nor the team` | body: `startTeam(page, { health: 10, team: LYRA_IN_SLOT_1 })`; `escape()` (as today); `page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').hitMonster({ x: 670, y: 440 }))`; `advance(page, 10_000)`; assert; `escape()`; `.pause-menu` hidden; `strike(page)`; assert | while paused: health 10, `allyTexts` `[]`; after the strike: health 7 |
| 24 | `one advance of 2500 ms lands two ticks` | delete (TCD-02: no ticks; T2 case 6 and T7 scenario 5 cover it) | - | - |
| 25 | `a farm fight at chapter 5 has the allies hit too` | unchanged | advance -> team | unchanged |
| 26 | `a farm fight of chapter 3 while the campaign stands at chapter 7 has the allies hit too` | unchanged | advance -> team | unchanged |

The tests `a click number keeps the gold fill and the 8 px outline` and `a critical click number keeps the orange fill, 48 px and the 8 px outline` stay as they are.

**Tests**: e2e
**Gate**: `cd game && npm test && npx playwright test e2e/heroTeamCombat.spec.js`
**Done when**:

- [x] `git grep -n "untilTickMs" game/e2e/heroTeamCombat.spec.js` prints nothing.
- [x] Every row is applied with the name and value of the table; the file passes.

**Commit**: `test(game): the hero team combat e2e lands the team with the click`

---

#### T5: The other hero team e2e files follow the click [x]

**Owner**: test-engineer
**Goal**: `heroTeamField`, `heroTeamPassives`, `heroTeam`, `heroTeamEditing` and `heroTeamStyle` pass with the team on the click and the per click texts (TCD-01, TCD-03 AC 6, TCD-04).
**Where**: `game/e2e/heroTeamPassives.spec.js`
**Files**:
- Also changes: `game/e2e/heroTeamField.spec.js`, `game/e2e/heroTeam.spec.js`, `game/e2e/heroTeamEditing.spec.js`, `game/e2e/heroTeamStyle.spec.js`
- Read first: the shared vocabulary above; spec E11, TCD-04; each file's `freeze` and `startTeam`
**Depends on**: T4
**Requirement**: TCD-01, TCD-03, TCD-04

**Steps**:

1. `heroTeamField.spec.js` and `heroTeamPassives.spec.js`: in `freeze`, delete the line `game.scene.getScene('ClickerGame').allies.untilTickMs = 1000;` and change its comment to `//  Stops the loop`; add the `team(page)` helper of T4 step 3 after `wake` (heroTeamField) or after `freeze` (heroTeamPassives).
2. Apply the table, then run the gate file by file.

**Re-pins**:

| File | Old name | New name | Change | Expected |
| --- | --- | --- | --- | --- |
| `heroTeamField.spec.js` | `each ally tick moves the sprite 24 px right and back` | `each team strike moves the sprite 24 px right and back` | advance -> team; comment `The team strike lands now; the motion is a Phaser tween, so it runs on the woken loop in real time` | unchanged |
| `heroTeamField.spec.js` | `the attack motion is one yoyo tween of 100 ms each way` | unchanged | advance -> team; comment `The loop is stopped, so the tween the team strike made is still at its start` | unchanged |
| `heroTeamPassives.spec.js` | `Lyra as an ally makes a roll of 15 a critical click` | `Lyra as an ally makes a roll of 15 a critical click, and her team hit adds 2` | none | first page `dealt` `toBeCloseTo(4, 5)` (was 2); `criticalTexts` `[ '2' ]`; the second page unchanged (1, `[]`) |
| `heroTeamPassives.spec.js` | `Orina as an ally shows Defesa 25% on a monster of defense 40 and a click deals 0.75` | `Orina as an ally shows Defesa 25% on a monster of defense 40 and a click deals 0.75 plus her team hit 1.5` | none | `dealt` `toBeCloseTo(2.25, 5)` (spec E11) |
| `heroTeamPassives.spec.js` | `Orina as an ally on a monster of defense 10 shows Defesa 0%` | unchanged | none | `dealt` `toBeCloseTo(3, 5)` (click 1 + Orina 2) |
| `heroTeamPassives.spec.js` | `Vex as an ally shows Seu crítico: 10% on a monster of critical resistance 5 and a roll of 8 is critical` | unchanged | none | first page `dealt` `toBeCloseTo(4, 5)` (critical 2 + Vex 2); the second page unchanged (1) |
| `heroTeamPassives.spec.js` | `Seraphine and Lyra as allies deal 5 per tick` | `Seraphine and Lyra as allies deal 5 per team strike` | advance -> team | unchanged (5, `[ '5' ]`) |
| `heroTeam.spec.js` | `Dano da equipe reads 0/s with no ally` | `Dano da equipe por clique reads 0 with no ally` | text | `team-dps` `Dano da equipe por clique: 0` |
| `heroTeam.spec.js` | `a 12.5K shown damage reads Dano: 12.5K/s` | `a 12.5K shown damage reads Dano: 12.5K/clique` | texts | `.team-dps-line` `Dano: 12.5K/clique`; `team-dps` `Dano da equipe por clique: 12.5K` |
| `heroTeamEditing.spec.js` | `Dano da equipe sums the allies: Lyra and Seraphine read 2.5/s each and 5/s together` | `Dano da equipe por clique sums the allies: Lyra and Seraphine read 2.5/clique each and 5 together` | texts | both `.team-dps-line` `Dano: 2.5/clique`; `team-dps` `Dano da equipe por clique: 5` |
| `heroTeamStyle.spec.js` | the test holding `toHaveText('Dano: 2/s')` (`:163`) | unchanged | text | `Dano: 2/clique`; add `await expect(ally.locator('.team-dps-line')).toHaveCSS('white-space', 'nowrap');` after it |

**Tests**: e2e
**Gate**: `cd game && npm test`, then one at a time: `npx playwright test e2e/heroTeamField.spec.js`, `e2e/heroTeamPassives.spec.js`, `e2e/heroTeam.spec.js`, `e2e/heroTeamEditing.spec.js`, `e2e/heroTeamStyle.spec.js`
**Done when**:

- [x] `git grep -n "untilTickMs\|/s')" game/e2e/heroTeam*.spec.js` prints nothing.
- [x] Every row is applied; the five files pass.

**Execution notes (T5)**:

- Text re-pins the table did not list, same pattern and same values as its `heroTeamEditing` and `heroTeam` rows: `heroTeamEditing.spec.js` `Dano: 2/s` (line 64) -> `Dano: 2/clique`; the test holding `Dano: 2.5/s` x2 and `Dano da equipe: 10/s` (line 245-247) -> `Dano: 2.5/clique` x2 and `Dano da equipe por clique: 10`. Without them the file fails and the Success Criterion grep for `/s'` would not be empty.
- `advance` helper removed from `heroTeamField.spec.js` and `heroTeamPassives.spec.js` (no caller left).

**Commit**: `test(game): the hero team e2e files read the team per click`

---

#### T6: The adds, affix and review files stop writing the ally clock [ ]

**Owner**: test-engineer
**Goal**: The miniboss adds and affix e2e files keep their values with the team on the click, and no support or review file writes `allies.untilTickMs` (TCD-01 AC 7, 11; TCD-03 AC 2, 4).
**Where**: `game/e2e/minibossAddsTarget.spec.js`
**Files**:
- Also changes: `game/e2e/minibossAdds.spec.js`, `game/e2e/minibossAddsSkills.spec.js`, `game/e2e/monsterAffixes.spec.js`, `game/e2e/support/affixFight.js`, `game/ui-review/heroTeam.shots.js`, `game/ui-review/minibossAdds.shots.js`, `game/ui-review/techDebtPolish.shots.js`
- Read first: the shared vocabulary above; spec E7, E10; `minibossAddsTarget.spec.js:20-110` (helpers `freeze`, `hitAt`, `numbers`, `lastNumber`, `state`, fixtures); `support/affixFight.js:36-58`
**Depends on**: T5
**Requirement**: TCD-01, TCD-03

**Steps**:

1. In the `freeze` of `minibossAdds.spec.js` (`:33`), `minibossAddsSkills.spec.js` (`:37`), `minibossAddsTarget.spec.js` (`:34`) and `support/affixFight.js` (`:43`): delete the line `game.scene.getScene('ClickerGame').allies.untilTickMs = 1000;` and change the comment above to `//  Stops the loop`.
2. `support/affixFight.js`: after `advance`, add and export `team`, the helper of T4 step 3 (`export const team = ...`). `monsterAffixes.spec.js` imports it.
3. `minibossAddsTarget.spec.js`: add the `team(page)` helper of T4 step 3 after `freeze`.
4. Review files (not run by CI; keep them runnable):
   - `ui-review/heroTeam.shots.js:43`: delete the `allies.untilTickMs = 1000;` line; in the test `field formation` replace `window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, 1000);` with `window.__PHASER_GAME__.scene.getScene('ClickerGame').strike(670);`.
   - `ui-review/minibossAdds.shots.js`: in `freeze` delete the `allies.untilTickMs = 100000;` line; in `06 with team` delete the line that sets `allies.untilTickMs = 30` (the click of `hitAt` already brings the team).
   - `ui-review/techDebtPolish.shots.js` `tick`: delete `scene.allies.untilTickMs = 1000;`; replace `scene.update(0, 1000);` with `scene.strike(scene.centreXOf(scene.currentTarget()), scene.currentTarget());`; comment `//  Loop asleep, one click stepped by hand: the click number and the team number are at alpha 1`.
5. Apply the table, then run the gate file by file.

**Re-pins**:

| File | Old name | New name | Change | Expected |
| --- | --- | --- | --- | --- |
| `minibossAddsTarget.spec.js` | `an ally hits the guarded miniboss for 0.2 and the target add for 2` | unchanged | both advances -> team | first part unchanged (main 99.8, `0.2` at 740); after `hitAt` and the team: `adds` `[ 25, 30 ]` (was `[ 27, 30 ]`: the click itself now deals 1 + 2); last number `{ text: '2', x: 520, y: 360, color: ALLY }`; the outline check unchanged |
| `minibossAddsTarget.spec.js` | `an ally tick that kills the target add lands its later hit on the miniboss` | `a click whose team strike kills the target add lands the later hit on the miniboss` | delete `await advance(page, 1000);`; read the last gold number `const gold = await scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "#ffd35c").map((o) => ({ x: o.x, width: o.width })).at(-1)');` | state unchanged (`adds` `[ 0, 30 ]`, target `Miniboss`, main `toBeCloseTo(99.58, 5)`); ally numbers `toMatchObject([ { text: '2', y: 360 }, { text: '0.4', x: 740, y: 273 } ])`; `Math.abs(allyNumbers[0].x - (gold.x + gold.width / 2 + 8))` `toBeLessThanOrEqual(0.5)` (spec E7) |
| `minibossAddsTarget.spec.js` | `the Erosão Arcana of an Orina ally lowers the defense an ally hit meets on an add: two hits of 1.9 show 3.8` | unchanged | advance -> team | unchanged (`3.8` at 520, 360) |
| `monsterAffixes.spec.js` | `an ally hit on a shielded miniboss takes a charge` | unchanged | advance -> team (import `team` from `./support/affixFight`) | unchanged (`Escudo de golpes: 2/3`, health 100) |

**Tests**: e2e
**Gate**: `cd game && npm test`, then one at a time: `npx playwright test e2e/minibossAddsTarget.spec.js`, `e2e/minibossAdds.spec.js`, `e2e/minibossAddsSkills.spec.js`, `e2e/monsterAffixes.spec.js`, `e2e/monsterAffixesHud.spec.js`
**Done when**:

- [ ] `git grep -n "untilTickMs" game/e2e game/ui-review` prints nothing.
- [ ] Every row is applied; the five files pass.

**Commit**: `test(game): the adds, affix and review files land the team with the click`

---

#### T7: The click pair in the browser [ ]

**Owner**: test-engineer
**Goal**: Every AC of TCD-01 to TCD-04 and every spec Edge Case holds in Chrome through the player's click (L-062, L-098, L-099).
**Where**: `game/e2e/teamClickDamage.spec.js` (new)
**Files**:
- Read first: spec (whole); `heroTeamCombat.spec.js:1-118` (copy `HERO_IDS`, `monsterOf`, `chapter`, `scene`, `health`, `advance`, `allyTexts`, `freeze`, `wake`, `recordShownMonsters`, `shownMonsters`, `startTeam`, `useSkill`, `strike`, `piece`, `LYRA_IN_SLOT_1` and the `team` helper of T4); `minibossAddsTarget.spec.js:92-97` (`clickAt`, a real mouse click at scene px); `support/affixFight.js` (`startFight`, `affixChapter`, `SHIELD`, `chip`); `heroTeam.spec.js` (`openTeam`, `slot`)
**Depends on**: T6
**Requirement**: TCD-01, TCD-02, TCD-03, TCD-04

**Setup**: copy the helpers listed above. Add to the copied `startTeam` an option `autoClick = false`: when true the init script writes `'on'` instead of `'off'` to `infinity-grove.auto-click`. Add `const texts = (page, color) => scene(page, \`(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "${color}").map((o) => ({ text: o.text, x: o.x, y: o.y, width: o.width, originX: o.originX, size: o.style.fontSize }))\`);` with `GOLD = '#ffd35c'`, `ORANGE = '#ff8a1f'`, `ALLY = '#7fd4ff'`. "Beside" below means `Math.abs(ally.x - (click.x + click.width / 2 + 8)) <= 0.5`, `ally.y === click.y`, `ally.originX === 0`, `click.originX === 0.5`.

**Scenarios**:

`describe('A click brings the team (TCD-01)')`:
1. `a real mouse click on the monster with Lyra in slot 1 deals 1 and 2: HP 7/10` (E1): `startTeam(page, { health: 10, team: LYRA_IN_SLOT_1 })`, `clickAt(page, 670, 440)` -> `expect.poll(() => health(page)).toBe(7)`; `monster-hp` `HP 7/10`; `texts(GOLD)` texts `[ '1' ]`; `texts(ALLY)` texts `[ '2' ]`.
2. `two allies: one click shows a gold 1 and one light-blue 4` (E2): Lyra and Orina, health 10, `strike(page)` -> health 5; `texts(ALLY)` texts `[ '4' ]`.
3. `a click that kills shows no team number` (E4): health 1, `strike(page)` -> monster dead; `texts(ALLY)` `[]`.
4. `a team hit that kills is handled once: Lyra's 20 kills, Orina does not hit, the coins land once` (E3): `startTeam(page, { health: 10, cleared: [ 5, 6 ], stars: { lyra: 9 }, team: { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] } })`, `strike(page)` -> `texts(ALLY)` texts `[ '20' ]`; dead true; then `recordShownMonsters`, `wake` -> `.wallet` `Gold: 0 Silver: 0 Copper: 3`; `shownMonsters` `[ { health: 10, dead: false } ]` (pattern of the T4 row 18 test).
5. `the auto click at 500 ms brings the team` (E8): `startTeam(page, { autoClick: true, team: LYRA_IN_SLOT_1 })` (health 1000), `advance(page, 500)` -> health 997; `texts(GOLD)` `[ { text: '1', x: 670 } ]` (toMatchObject); `texts(ALLY)` texts `[ '2' ]`; `advance(page, 499)` -> 997.
6. `Lyra's double click: two orange 2, then the team's 2 beside the second` (E6): `startTeam(page, { leader: 'lyra', team: { boughtSlots: 1, allies: [ 'kael', null, null, null ] }, monster: monsterOf('NATURE'), roll: 0 })`, `strike(page)` -> `texts(ORANGE)` texts `[ '2', '2' ]`, second x = first x + 36; the ally `2` is beside the second orange number; health 994.
7. `the combo does not reach the team: three clicks leave 990.97` (E12): `talents: { COMBO: 10 }`, three `strike(page)` -> health `toBeCloseTo(990.97, 5)`; `texts(ALLY)` texts `[ '2', '2', '2' ]`.
8. `a skill brings no team strike` (TCD-01 AC 9): `stars: { kael: 1 }`, `useSkill(page, 1)` -> `texts(ALLY)` `[]`.
9. `below chapter 5 a click shows no team number` (E13): `chapter: 4, cleared: [ 5 ], team: LYRA_IN_SLOT_1, health: 10`, `strike(page)` -> health 9; `texts(ALLY)` `[]`.
10. `a click on a shielded miniboss takes a charge for the click and one for Lyra` (E10): `startFight(page, { definition: affixChapter({ affix: SHIELD(3) }), progress: { chapter: 5, stage: 1, encounter: 'MINIBOSS', phase: 1 }, team: LYRA_IN_SLOT_1 })`, `strike(page)` -> `chip` `Escudo de golpes: 1/3`; health 100.
11. `a farm fight at chapter 5: a click deals 1 and 2` (Edge): the farm steps of T4 row 25 (completed campaign, `hud-farm`, `farm-entry-miniboss-1`, `Rever chefe: Miniboss 1`), `freeze`, `strike(page)` -> dealt 3; `texts(ALLY)` texts `[ '2' ]`.

`describe('No click, no team (TCD-02)')`:
12. `10 s with no click deal no team damage` (E9): health 10, `advance(page, 10_000)` -> health 10; `texts(ALLY)` `[]`.
13. `with Heróis open a click does nothing and the auto click still brings the team` (TCD-02 AC 4): `autoClick: true`, health 1000; click `hud-heroes`, `.hero-panel` visible; `page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').hitMonster({ x: 670, y: 440 }))` -> health 1000; `advance(page, 500)` -> 997.
14. `the pause menu stops the click and the team` (TCD-02 AC 3): `escape()` -> `.pause-menu` visible; `hitMonster({ x: 670, y: 440 })` and `advance(page, 10_000)` -> health unchanged; `texts(ALLY)` `[]`.

`describe('The team number beside the click number (TCD-03)')`:
15. `the light-blue number stands 8 px right of the gold number on its baseline` (TCD-03 AC 1, 2): `strike(page)` -> the ally `2` is beside the gold `1`; its style `{ color: '#7fd4ff', fontSize: '28px', fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10 }`; the gold number's right edge `x + width / 2` is at most the ally number's `x`.
16. `a long team number keeps the gap: a 12.5K team hit stands beside the gold 1` (TCD-03 AC 2): Lyra 9 stars with a 624 click weapon worn by Lyra (`piece({ id: 'w1', slot: 'WEAPON', baseClick: 624, heroId: 'lyra' })`), health 100000, `strike(page)` -> ally text `12.5K`, beside the gold `1`.
17. `both numbers rise and fade over 800 ms` (TCD-03 AC 3): after `strike(page)` with the loop asleep, `scene.tweens.getTweens()` holds one tween whose `targets[0]` is the gold Text and one whose `targets[0]` is the ally Text, each with `data[0].duration` 800 (read as in `heroTeamField.spec.js` `the attack motion is one yoyo tween of 100 ms each way`); then `wake(page)` and `expect.poll(() => texts(page, ALLY), { timeout: 3_000 }).toEqual([])` and the same for `GOLD` (both destroyed at the end of the fade). The 40 px rise is pinned by T2 case 2.
18. `five clicks in a row show five gold 1 and five light-blue 2` (Edge, TCD-03 AC 5): five `strike(page)` -> `texts(GOLD)` 5 x `1`, `texts(ALLY)` 5 x `2`; health 985.
19. `each team strike steps Lyra's sprite; a click that kills steps none` (TCD-03 AC 6, 7): `strike(page)` -> one tween on the `hero_lyra` sprite with duration 100 and yoyo true (read as in `heroTeamField.spec.js` `the attack motion is one yoyo tween of 100 ms each way`); a fresh start with health 1 -> `strike(page)` -> no tween on `hero_lyra`.

`describe('Equipe per click (TCD-04)')`:
20. `the ally line reads Dano: 12.5K/clique on one line inside the card` (TCD-04 AC 1, 3): Lyra 9 stars with the 624 weapon, `openTeam` -> `slot(page, 1).locator('.team-dps-line')` `Dano: 12.5K/clique`, `toHaveCSS('white-space', 'nowrap')`; its bounding box lies within the card box shrunk by 10 px on the left and right (border 2 + padding 8); its height is at most 20 px (one line).
21. `the team line reads Dano da equipe por clique: 12.5K` (TCD-04 AC 2): same start -> `team-dps` `Dano da equipe por clique: 12.5K`.
22. `no text of Equipe says /s` (TCD-04 AC 4): with Lyra and Seraphine -> the text of `page.getByTestId('team-screen')` does not match `/\/s\b|por segundo/`.

**Tests**: e2e
**Gate**: `cd game && npm test && npx playwright test e2e/teamClickDamage.spec.js`
**Done when**:

- [ ] The 22 scenarios pass with the exact values above.

**Commit**: `test(game): pin the click pair of the team in the browser`

---

#### T8: Author check of the team click damage [ ]

**Owner**: test-engineer
**Goal**: Every AC, example and edge case of the spec maps to an exact assertion, the riskiest code kills its mutants, and the whole CI run of the branch is green (the feature's test gate).
**Where**: `.specs/features/team-click-damage/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T7, `scripts/sensor.mjs` (format at its top), `CLAUDE.md` § Agent team 4 (CI and mutants)
**Depends on**: T7
**Requirement**: TCD-01 to TCD-05

**Steps**:

1. Build the AC to assertion table (unit and e2e columns, `file:line`, exact value) as in `.specs/features/tech-debt-polish/tasks.md` § Author check, including E1 to E13, the Edge Cases and TCD-05 (read `README.md:48`).
2. Write a scratch `mutants.json` (not committed) with at least: (M1) `strike` without the `teamStrike` call (T7 scenario 1); (M2) `TEAM_TEXT_GAP = 0` (scenario 15); (M3) `teamStrike` anchoring with origin 0.5 (scenario 15); (M4) `landTeam` without the dead-target `break` (scenario 4, Orina lands); (M5) `strike` calling `teamStrike` before the click loop (scenario 3 shows a light-blue number); (M6) `allyHit` given `multiplier` of the combo in `teamStrike` (scenario 7); (M7) `teamView.js` writing `/s` again (T3 unit and scenario 21); (M8) `.team-dps-line` without `white-space: nowrap` (scenario 20); (M9) `teamStrike` anchoring on the first click number of the loop instead of the last (scenario 6); (M10) `strike` guarding the team with `!monster.dead` (the clicked monster) instead of the main (T6 `a click whose team strike kills the target add ...` and T2 row 28).
3. Push (`git push origin HEAD:ci/team-click-damage`), run the mutants in CI: `gh workflow run tests.yml --ref ci/team-click-damage -f mutants="$(cat mutants.json)" -f suites=false`, then `node scripts/ci-wait.mjs ci/team-click-damage --event workflow_dispatch` (foreground, `timeout: 600000`).
4. Run `node scripts/ci-wait.mjs ci/team-click-damage` (foreground, `timeout: 600000`) for the push run of the branch head: every job green (backend, game unit, e2e 12 shards, deploy).
5. Append § Author check with the table, the mutant results, the CI run ids and the suite totals; any surviving mutant, AC without an exact assertion or red job becomes a fix task listed there with its owner.

**Tests**: e2e + unit (runs the suites in CI, writes no production code)
**Gate**: `node scripts/ci-wait.mjs ci/team-click-damage` exits 0
**Done when**:

- [ ] Every AC, example and edge case maps to a test; every mutant is killed or a fix task is listed; the CI run of the branch head is green.

**Commit**: `test: author check of the team click damage`

---

### Phase 3: UI review

#### T9: UI review of the click pair and Equipe [ ]

**Owner**: ui-artist
**Goal**: The team number reads as a second number of the same click, keeps 8 px from the click number and stays legible over the forest, and the Equipe lines fit (TCD-03, TCD-04).
**Where**: `game/ui-review/teamClickDamage.shots.js` (new)
**Files**:
- Also creates: `.specs/features/team-click-damage/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/team-click-damage/ui-review/*.png`
- Read first: `game/ui-review/techDebtPolish.shots.js` (start, the `tick` stepping after T6), `game/ui-review/heroTeam.shots.js` (Equipe), `game/ui-review/support/shots.js`, spec § Examples, TCD-03, TCD-04, § Player-Facing Texts
**Depends on**: T8
**Requirement**: TCD-03, TCD-04

**Shots** (desktop 1280 x 720 only; each canvas shot with the loop asleep, one click stepped by hand, then one frame drawn with a delta of 0 as `techDebtPolish.shots.js` `tick` does, so every number is at alpha 1):

- `01-click-pair`: chapter 5, Kael leader, Lyra in slot 1, FIRE monster of 1000: one click: gold `1` and light-blue `2`.
- `02-click-pair-critical`: the same with roll 0: orange 48 px `2` and light-blue `2`.
- `03-click-pair-long`: Lyra 9 stars with a 624 click weapon: gold `1` and light-blue `12.5K`.
- `04-double-click`: Lyra leader, Kael in slot 1, NATURE monster, roll 0: two orange `2` and the light-blue `2` after the second.
- `05-rapid-clicks`: loop awake, five clicks 60 ms apart, shot 100 ms after the last.
- `06-click-on-add`: chapter 11 miniboss with adds, Lyra in slot 1, one click on Lacaio 1: gold `1` and light-blue `2` beside it on the add.
- `07-four-allies`: Lyra, Orina, Seraphine and Vex: one click: the light-blue sum and the four sprites mid-step (shot 50 ms after the click with the loop awake).
- `08-equipe-long`: Equipe with Lyra 9 stars and the 624 weapon in slot 1: `Dano: 12.5K/clique`, `Dano da equipe por clique: 12.5K`.
- `09-equipe-empty`: Equipe with no ally: `Dano da equipe por clique: 0`.

**Check against**: TCD-03 AC 1 and 2 (gap 8 px between the right edge of the click number and the left edge of the team number, same baseline; the pair reads as one click, not two hits of different clicks); the light-blue number keeps at least 3:1 against the forest behind it (TD-013 rule), measured on shots 01 and 03; no number covers the combo HUD (670, 150), the affix chip (670, 336) or the enemy line (670, 596); in shot 05 the pairs stay readable; TCD-04 AC 3 (shot 08: `Dano: 12.5K/clique` on one line inside the card, clear of the passive line); compare shots 08 and 09 with `.specs/features/hero-team/ui-review/` for any other change. Write the measured contrast ratios and the gap.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- teamClickDamage`
**Done when**:

- [ ] `ui-review.html` lists the 9 shots with `APROVADO`, or each finding as a new task in this file with its owner.

**Commit**: `docs(ui): review the team click damage`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | One pure function and its tests | ✅ Granular |
| T2 | One scene path (strike, teamStrike, update) and the removal of the clock it replaces; the unit re-pins must land with it for the gate to pass | ⚠️ OK, cohesive (one behaviour; the test file is the scene's) |
| T3 | Two texts, one rename, one CSS line, one README line | ✅ Granular |
| T4 | One e2e file | ✅ Granular |
| T5 | Re-pins of named tests in five e2e files (no new behaviour) | ⚠️ OK, mechanical |
| T6 | Re-pins and one deleted line per support and review file | ⚠️ OK, mechanical |
| T7 | One new e2e file | ✅ Granular |
| T8, T9 | Check and review | ✅ |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 (phase 1) | Phase 2 start | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 (phase 2) | Phase 3 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Game domain | unit | unit | ✅ OK |
| T2 | Game scene + domain | unit | unit | ✅ OK (its player-visible behaviour gets e2e in T7, the browser being the only place the real Text widths exist) |
| T3 | Game view + domain + CSS + README | unit (+ e2e in T5, T7 for CSS) | unit | ✅ OK |
| T4 to T7 | E2E (+ support and review files in T6) | e2e | e2e | ✅ OK |
| T8 | check | - | e2e + unit runs | ✅ OK |
| T9 | UI review artifact | none | none | ✅ OK |
