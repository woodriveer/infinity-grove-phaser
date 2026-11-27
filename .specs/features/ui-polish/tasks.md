# UI Polish Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T16) and the `ui-artist` review (T17) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/ui-polish/spec.md`
**Design**: `.specs/features/ui-polish/design.md`
**Status**: Approved, revision 2 (owner approval of 2026-11-27, every recommendation accepted, Q1 to Q28, UIP-14 kept). Runs now, before `portuguese-text` (Q18). If the owner cuts UIP-14 (Q27), delete T10 step 5, its unit cases 13 to 15 and T15 scenario 12.

**Shared files with `portuguese-text`** (not started; it runs after this feature): `game/src/adapters/phaser/ClickerGame.js` and `ClickerGame.test.js` (this feature: the `isTextField` import, the shutdown hook, the T and B handlers; `portuguese-text`: the HUD, stage and pause texts), `game/e2e/support/fakeBackend.js` (this feature: the talent handler; `portuguese-text`: the problem `detail`/`code` lines), `game/e2e/heroes.spec.js` and `game/ui-review/uiRedesign.shots.js` (this feature: Líder to the Equipe leader list; `portuguese-text`: the welcome and button texts). The edits touch different lines, so a `git pull --rebase` merges them. Rules for the later feature: its T8 reruns its `git grep` of English texts before editing (it already says so), which picks up the three new e2e files of this feature (`uiPolishPage`, `uiPolishTalents`, `uiPolishShift`, `uiPolishHud`); those files wait on `toHaveText(/yan/)` and use the helpers of `e2e/support/game.js`, so they need no change when the helpers move to Portuguese. No player text of this feature is English, and none of the texts `portuguese-text` translates is created or moved here.

Rules for every task: the rules block of `.specs/features/early-game-rebalance/tasks.md` (§ Rules for every task) applies word for word: paths from the repository root, `main/` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `test/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, graphify first, the files under **Read first** before editing, one commit per task checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` and ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, files added by path only (never `git add -A` or `git add .`), the task ticked `[x]` here and its requirement rows in `spec.md` § Requirement Traceability set to `Implementing` in the same commit, push with `git pull --rebase origin main && git push origin HEAD:main`, re-pins only where a task lists them (by test name, with the new name and value given here), an e2e flake rerun alone twice with `--workers=1`, never the full e2e suite, desktop only. Player text exactly as spec § Player-Facing Texts (AD-007, L-010), with its accents (`á`, `é`, `í`, `ç`); files stay UTF-8. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003). Kotlin: ktlint, the KDoc style of `Talents.kt`.

New e2e files start the game like `startGame` of `game/e2e/talents.spec.js:14-26`, with one change: they wait for the welcome line with `await expect(menu.message).toHaveText(/yan/)` (matches the English line of today and the Portuguese line of `portuguese-text`).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, 3 to 5 mutants with `scripts/sensor.mjs`), `backend/build.gradle.kts` (JUnit 5, Testcontainers, JaCoCo, ktlint), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome, fake backend). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Talents.kt`, `TalentExceptions.kt`) | unit | UIP-08 AC 1, 4 to 7; every check of the order | `test/domain/TalentsTest.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend service and web | unit + integration | UIP-08 AC 1 to 10 | `test/service/TalentServiceTest.kt`, `test/adapter/web/TalentControllerIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Game domain (`talents.js`) | unit | UIP-09 E1 to E7, k = 0 cases, both texts | `game/src/domain/talents/talents.test.js` | `cd game && npm test` |
| Game application and http | unit | UIP-09 AC 3 to 5 (bodies) | `talentCollection.test.js`, `talentApi.test.js` | `cd game && npm test` |
| Game adapters (`pageGuards.js`, `shiftKey.js`, `talentsView.js`, `teamView.js`, `HeroUi.js`, `ClickerGame.js`) | unit | UIP-02 AC 2, 3; UIP-03; UIP-06 AC 1 to 11; UIP-07; UIP-09; UIP-10; UIP-11; UIP-12; UIP-13; UIP-14 | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| CSS and player-visible behaviour | e2e | Every AC of UIP-01 to UIP-14 in the browser; every CSS value the spec names with `toHaveCSS` | `game/e2e/uiPolishPage.spec.js`, `uiPolishTalents.spec.js`, `uiPolishShift.spec.js`, `uiPolishHud.spec.js` | `cd game && npx playwright test <files of the task>` |
| E2E fake backend and helpers | none (support code; exercised by the e2e tasks that add them) | - | `game/e2e/support/fakeBackend.js`, `game/e2e/support/leader.js` | the gate of T12 and T14 |
| Existing e2e and review shots that open Líder | e2e | Every listed re-pin keeps its asserted values | `game/e2e/*.spec.js`, `game/ui-review/uiRedesign.shots.js` | the gate of T14 |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/uiPolish.shots.js` | `cd game && npm run ui:shots -- uiPolish` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | T1, T2 | `cd backend && ./gradlew ktlintCheck test` |
| Quick | T3 to T8 | `cd game && npm test && npm run build` |
| Full | T11 to T15 | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

### Phase 1: Backend (kotlin-backend-dev)

```
T1 → T2
```

### Phase 2: Game (game-dev)

```
T3
T4 → T5
T4 → T7
T6 → T8
T5 → T8
T7 → T8
T8 → T9
T9 → T10
T3 → T10
```

### Phase 3: Tests in the browser and author check (test-engineer)

```
T11 → T12 → T13 → T14 → T15 → T16
```

### Phase 4: UI review (ui-artist)

```
T17
```

---

## Task Breakdown

### Phase 1: Backend

#### T1: The talent domain buys several levels at once [x]

**Owner**: kotlin-backend-dev
**Goal**: `PlayerTalents.upgrade` raises a talent by `count` levels for `count x costPerLevel` points, all or nothing, with the refusals of spec UIP-08 AC 4 to 7.
**Where**: `main/domain/Talents.kt`
**Files**:
- Also changes: `main/domain/TalentExceptions.kt`, `test/domain/TalentsTest.kt`
- Read first: design § Backend multi-level upgrade; `Talents.kt:40-60` (`costPerLevel`, `requireSeenLevel`), `Talents.kt:155-250` (`TalentUpgrade`, `PlayerTalents.upgrade` and its logs); `TalentExceptions.kt` (whole); `TalentsTest.kt:1-15` (fixtures `rules`, `clickDamage`, `combo`, `fury`) and the cases `an upgrade with 3 points raises the level by one and spends 1`, `an upgrade with no available point is refused and changes nothing`, `a talent at level 10 refuses the upgrade as max level and has no next cost`
**Depends on**: None
**Requirement**: UIP-08

**Contract**:

- `TalentExceptions.kt`:
  - `class TalentMaxLevelException(talentId: String, fromLevel: Int? = null, levels: Int? = null) : TalentConflictException("TALENT_MAX_LEVEL", if (levels == null) "Talent '$talentId' is already at the maximum level" else "Talent '$talentId' at level $fromLevel cannot rise $levels levels")`
  - `class NotEnoughTalentPointsException(available: Int, cost: Int, levels: Int = 1) : TalentConflictException("NOT_ENOUGH_TALENT_POINTS", if (levels == 1) "A talent level costs $cost points, the player has $available" else "$levels talent levels cost $cost points, the player has $available")`
- `Talents.kt`, `TalentDefinition`, right after `requireSeenLevel`:
  - `fun requireLevelCount(levels: Int): Int` - throws `TalentRequestException("levels must be an integer between 1 and $maxLevel")` when `levels !in 1..maxLevel`, else returns `levels`. KDoc: `How many levels one request may buy: 1 to the top level.`
- `Talents.kt`, `PlayerTalents.upgrade(definition: TalentDefinition, fromLevel: Int, rules: TalentRules, count: Int = 1): TalentUpgrade`, checks in this order:
  1. `fromLevel != stored` -> `TalentLevelMismatchException` (unchanged).
  2. `!unlocked(definition)` -> `TalentLockedException` (unchanged).
  3. `stored >= definition.maxLevel` -> `TalentMaxLevelException(definition.id)` (unchanged text).
  4. `stored + count > definition.maxLevel` -> log warn `Talent upgrade refused, past max level username={} talent={} stored={} levels={}`, throw `TalentMaxLevelException(definition.id, stored, count)`.
  5. `val cost = definition.costPerLevel(rules) * count`; `available < cost` -> the existing warn log with `levels={}` added, throw `NotEnoughTalentPointsException(available, cost, count)`.
  6. Log info `Talent upgrade accepted username={} talent={} levels={} level={} points={}` (level `stored + count`, points `cost`); return `TalentUpgrade(copy(levels = levels + (definition.id to stored + count)), cost)`.
- The domain parameter is `count` (the class already has the property `levels`). Update the KDoc of `upgrade` to say it raises by `count` levels (default 1) and that nothing changes on any refusal.

**Steps**:

1. Replace `TalentMaxLevelException` and `NotEnoughTalentPointsException` in `TalentExceptions.kt` with the Contract versions; keep their KDoc lines.
2. Add `requireLevelCount` to `TalentDefinition`.
3. Change `PlayerTalents.upgrade` as in the Contract (steps 1 to 6).
4. Add the test cases below to `TalentsTest.kt`, after `an upgrade with no available point is refused and changes nothing`.
5. Run the gate.

**Tests**: unit
**Test cases** (`test/domain/TalentsTest.kt`; `g2 = TalentCatalog.find("COMBO_G2")`):

1. `an upgrade of 5 levels with 5 points raises COMBO from 0 to 5 and spends 5`: `PlayerTalents("yan", earned = 5).upgrade(combo, 0, rules, 5)` -> `level("COMBO")` 5, `cost` 5, `points(rules).available` 0.
2. `an upgrade of 2 grade 2 levels spends 4 points`: `PlayerTalents("yan", mapOf("COMBO" to 10), earned = 14).upgrade(g2, 0, rules, 2)` -> `level("COMBO_G2")` 2, `cost` 4, available 0.
3. `an upgrade of 4 Fúria crescente levels spends 8 points`: `PlayerTalents("yan", mapOf("COMBO" to 10), earned = 19).upgrade(fury, 0, rules, 4)` -> level 4, `cost` 8, available 1.
4. `an upgrade that reaches exactly the top level is accepted`: `PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 8), earned = 20).upgrade(clickDamage, 8, rules, 2)` -> level 10, `cost` 2.
5. `an upgrade past the top level refuses as max level with the level and the count and changes nothing`: same player, `upgrade(clickDamage, 8, rules, 3)` -> `TalentMaxLevelException`, `code` `TALENT_MAX_LEVEL`, `message` `Talent 'CLICK_DAMAGE' at level 8 cannot rise 3 levels`; the original value still has level 8.
6. `a stored level at the top keeps the old max level text with a count`: `PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 10), earned = 30).upgrade(clickDamage, 10, rules, 2)` -> `message` `Talent 'CLICK_DAMAGE' is already at the maximum level`.
7. `an upgrade of 5 levels with 4 points refuses with the total cost and changes nothing`: `PlayerTalents("yan", earned = 4).upgrade(combo, 0, rules, 5)` -> `NotEnoughTalentPointsException`, `code` `NOT_ENOUGH_TALENT_POINTS`, `message` `5 talent levels cost 5 points, the player has 4`; level 0.
8. `one level keeps the one level refusal text`: `PlayerTalents("yan", mapOf("COMBO" to 2), earned = 2).upgrade(combo, 2, rules)` -> `message` `A talent level costs 1 points, the player has 0`.
9. `a mismatch is checked before the count`: `PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 3), earned = 9).upgrade(clickDamage, 2, rules, 5)` -> `TalentLevelMismatchException`.
10. `a locked grade refuses a count as locked`: `PlayerTalents("yan", mapOf("COMBO" to 5), earned = 20).upgrade(g2, 0, rules, 2)` -> `TalentLockedException`.
11. `requireLevelCount accepts 1 to the top level and refuses the rest`: `combo.requireLevelCount(1)` 1, `combo.requireLevelCount(10)` 10; `0`, `-1`, `11` throw `TalentRequestException` with `message` `levels must be an integer between 1 and 10`; `fury.requireLevelCount(4)` 4; `fury.requireLevelCount(5)` throws with `levels must be an integer between 1 and 4`.

Every existing `TalentsTest` case passes unchanged (the one-level path keeps its texts).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 11 new cases pass and the whole backend suite passes.
- [x] The commit touches exactly `Talents.kt`, `TalentExceptions.kt`, `TalentsTest.kt`, this file and `spec.md`.

**Commit**: `feat(backend): raise a talent by several levels in one upgrade`

---

#### T2: POST /talents/{id}/upgrade reads an optional levels [x]

**Owner**: kotlin-backend-dev
**Goal**: The upgrade body takes `levels` (absent or null = 1) and buys that many levels in one transaction under the `progress` lock (UIP-08 AC 1 to 10).
**Where**: `main/adapter/web/TalentController.kt`
**Files**:
- Also changes: `main/usecase/TalentUseCase.kt`, `main/service/TalentService.kt`, `test/service/TalentServiceTest.kt`, `test/adapter/web/TalentControllerIT.kt`
- Also creates: `backend/docs/adr/0016-multi-level-talent-upgrade.md`
- Read first: design § Backend multi-level upgrade and § Data Models; `TalentController.kt:85-108`; `TalentUseCase.kt` (whole); `TalentService.kt:40-58`; `TalentServiceTest.kt:20-115` (`player(points)`, the upgrade cases); `TalentControllerIT.kt:40-65` (helpers `earned`, `level`, `upgrade`), `:215-232` (`upgrading COMBO from level 0 ...`), `:310-327` (the 400 case), `:340-358` (the two-request case); `backend/docs/adr/0015-talent-tree-rework.md` (ADR format)
**Depends on**: T1
**Requirement**: UIP-08

**Contract**:

- `TalentUseCase.kt`: `fun upgrade(username: String, talentId: String, fromLevel: Int, levels: Int = 1): PlayerTalents`; KDoc: `Raises [talentId] by [levels] levels (1 by default) for the talent points they cost, all or nothing, under the progress lock of the player. ...` (keep the `fromLevel` sentence).
- `TalentService.upgrade(username, talentId, fromLevel, levels)` (no default on the override): log `Talent upgrade requested username={} talent={} fromLevel={} levels={}`; after `definition.requireSeenLevel(fromLevel)` call `definition.requireLevelCount(levels)` (both before the lock); `load(username).upgrade(definition, fromLevel, rules, levels)`; log `Talent upgraded username={} talent={} levels={} level={} points={}`.
- `TalentController.upgrade`: after reading `fromLevel`, `val levels = when (val raw = body["levels"]) { null -> 1; is Int -> raw; else -> throw TalentRequestException("levels must be an integer") }`; call `upgradeTalent.upgrade(principal.name, id, fromLevel, levels)`. A missing key and an explicit JSON `null` both give `null` from the map.
- Answer shape unchanged (`TalentsResponse`). No migration, no new route.
- ADR 0016 (`# 0016. Several talent levels in one upgrade`, sections `Status` (Accepted, 2026-11-27, spec `ui-polish`), `Context` (Shift buys the most levels; one request per level costs N round trips and can stop halfway), `Decision` (optional `levels` 1 to `maxLevel`, absent or null = 1; checks in the order of spec UIP-08 AC 7; all or nothing under the `progress` lock; the two new detail texts), `Consequences` (the previous backend ignores `levels` and buys one level; the game shows the answered tree; no data change), `Alternatives considered` (N requests: rejected, partial purchases and N round trips; clamping to what the points pay: rejected, the button promised a target).

**Steps**:

1. Change `TalentUseCase.kt`, then `TalentService.kt`, then `TalentController.kt` as in the Contract.
2. Add the `TalentServiceTest` cases below after `an upgrade with 3 points raises the level and stores it, leaving 2 available`.
3. Add to `TalentControllerIT.kt` a helper `upgradeWith(id: String, body: Map<String, Any?>): ValidatableResponse` (same as `upgrade` but posts `body`) and the IT cases below after `the second level also costs 1 point`.
4. Write the ADR.
5. Run the gate.

**Tests**: unit + integration
**Test cases**:

`TalentServiceTest.kt`:
1. `an upgrade of 3 levels stores level 3 once and leaves no point`: `player(3)`; `service.upgrade("yan", "COMBO", 0, 3)` -> `level("COMBO")` 3, `talents.levels.getValue("yan" to "COMBO")` 3, available 0.
2. `an upgrade of 0 or 11 levels is refused and stores nothing`: `player(20)`; each of `0`, `11` -> `assertFailsWith<TalentRequestException>`; `talents.levels` empty.
3. `an upgrade without levels still raises one level`: `player(3)`; `service.upgrade("yan", "COMBO", 0)` -> level 1 (the interface default).

`TalentControllerIT.kt` (find a talent in the answer with `talents.find { it.id == '<ID>' }.level`):
4. `upgrading COMBO by 5 levels from 0 with 5 points answers level 5, value 25 and no point left`: `earned(5)`; `upgradeWith("COMBO", mapOf("fromLevel" to 0, "levels" to 5))` -> 200, COMBO `level` 5, `value` 25, `nextCost` 1, `points.spent` 5, `points.available` 0; `level("COMBO")` 5.
5. `upgrading COMBO_G2 by 2 levels spends 4 points`: save `TalentEntity("yan", "COMBO", 10)`; `earned(14)`; `upgradeWith("COMBO_G2", mapOf("fromLevel" to 0, "levels" to 2))` -> 200, COMBO_G2 `level` 2, `points.available` 0.
6. `a null levels raises one level`: `earned(3)`; body `mapOf("fromLevel" to 0, "levels" to null)` -> 200, COMBO `level` 1.
7. `a levels of "2", 1.5 or true is 400 INVALID_TALENT_REQUEST and spends nothing`: `earned(5)`; for each value -> 400, `code` `INVALID_TALENT_REQUEST`, `detail` `levels must be an integer`; `GET /talents` `points.available` 5.
8. `a levels of 0, -1 or 11 is 400 with the range and spends nothing`: `earned(5)`; COMBO with each value -> 400, `detail` `levels must be an integer between 1 and 10`; COMBO_FURY with `levels` 5 and `fromLevel` 0 -> 400, `detail` `levels must be an integer between 1 and 4`; `points.available` 5.
9. `levels past the top level is 409 TALENT_MAX_LEVEL and changes nothing`: save `TalentEntity("yan", "CLICK_DAMAGE", 8)`; `earned(20)`; `{ fromLevel: 8, levels: 3 }` -> 409, `code` `TALENT_MAX_LEVEL`, `detail` `Talent 'CLICK_DAMAGE' at level 8 cannot rise 3 levels`; `level("CLICK_DAMAGE")` 8.
10. `levels costing more than the points is 409 NOT_ENOUGH_TALENT_POINTS and changes nothing`: `earned(4)`; COMBO `{ fromLevel: 0, levels: 5 }` -> 409, `code` `NOT_ENOUGH_TALENT_POINTS`, `detail` `5 talent levels cost 5 points, the player has 4`; `level("COMBO")` 0; `points.available` 4.
11. `two requests with the same fromLevel and levels succeed once and answer 409 to the other`: as `two requests with the same fromLevel succeed once and answer 409 to the other` (`:340`) with `withProgress()`, `earned(10)` and two `upgradeWith("CLICK_DAMAGE", mapOf("fromLevel" to 0, "levels" to 3))` -> statuses `[200, 409]`, `level("CLICK_DAMAGE")` 3, `points.spent` 3.

Every existing `TalentControllerIT` and `TalentServiceTest` case passes unchanged (UIP-08 AC 2: bodies without `levels`).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 11 new cases pass and the whole backend suite passes.
- [x] `git diff --stat` shows no file under `backend/src/main/resources/db/migration` (UIP-08 AC 10).
- [x] `backend/docs/adr/0016-multi-level-talent-upgrade.md` exists with the five sections.

**Commit**: `feat(backend): accept a level count on the talent upgrade`

---

### Phase 2: Game

#### T3: The page stops acting like a document [x]

**Owner**: game-dev
**Goal**: No selection, no drag ghost, no context menu and an arrow cursor outside the text fields (UIP-01 to UIP-04; spec Q1 to Q4).
**Where**: `game/src/adapters/phaser/pageGuards.js` (new)
**Files**:
- Also creates: `game/src/adapters/phaser/pageGuards.test.js`
- Also changes: `game/public/style.css` (a block right after the `body` rule at `:97-103`), `game/src/main.js`, `game/src/adapters/phaser/ClickerGame.js` (only the `isTextField` line `:130` and its import)
- Read first: design § Page guards; `ClickerGame.js:128-131` and every use of `isTextField` in that file; `main.js:47-50` (`mountVersionLabel`); `style.css:97-125`; `game/src/adapters/phaser/views/versionLabel.test.js` (a jsdom test of a page-level module)
**Depends on**: None
**Requirement**: UIP-01, UIP-02, UIP-03, UIP-04

**Contract**: design § Page guards, exactly: `TEXT_FIELD_SELECTOR`, `isTextField(target)`, `installPageGuards(doc = document)` returning a remover; the CSS block word for word, with its comment.

**Steps**:

1. Write `pageGuards.js` with a header comment `//  The page outside the text fields is not a document (spec ui-polish): no browser menu and no drag of its images or text.`
2. `ClickerGame.js`: delete the local `isTextField` (and its comment line `:129`); add `import { isTextField } from './pageGuards';` next to the other `./` imports.
3. `main.js`: `import { installPageGuards } from './adapters/phaser/pageGuards';` and call `installPageGuards(document);` on the line after `mountVersionLabel(__GAME_VERSION__);`, with the comment `//  No selection, drag ghost or browser menu outside the text fields (spec ui-polish)`.
4. `style.css`: paste the CSS block of design § Page guards right after the `body { ... }` rule.
5. Write the tests below.
6. Run the gate.

**Tests**: unit (the CSS is checked in the browser by T11)
**Test cases** (`pageGuards.test.js`, jsdom; each test appends its elements to `document.body` and removes them after; dispatch `new MouseEvent('contextmenu', { bubbles: true, cancelable: true })` and `new Event('dragstart', { bubbles: true, cancelable: true })`):

1. `isTextField is true for a text input, a password input, an input with no type, a textarea, a select, a contenteditable div and a span inside it`.
2. `isTextField is false for a checkbox, a radio, a button input, a button, a div, an img, a canvas, null and the document`.
3. `cancels contextmenu on a div, an img and a canvas`: after `installPageGuards(document)`, `defaultPrevented` true for each.
4. `keeps contextmenu on a text input and a password input`: `defaultPrevented` false.
5. `cancels dragstart on an img and a div`: true.
6. `keeps dragstart on a text input`: false.
7. `the returned function removes both listeners`: call the remover; `contextmenu` and `dragstart` on a div -> `defaultPrevented` false.

The `ClickerGame.test.js` cases of the auto click key in a text field pass unchanged.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 7 cases pass; the whole unit suite (including `architecture.test.js`) passes.
- [x] `git grep -n "const isTextField" -- game/src` prints only `pageGuards.js`.

**Commit**: `feat(game): keep the page from acting like a document outside the text fields`

---

#### T4: The rules of the most levels the points buy [x]

**Owner**: game-dev
**Goal**: Pure `maxPurchase` and `upgradeButtonText` give k, the target, the cost and the button texts T1 and T2 (UIP-09, E1 to E7).
**Where**: `game/src/domain/talents/talents.js`
**Files**:
- Also changes: `game/src/domain/talents/talents.test.js`
- Read first: design § Talent purchase rules; `talents.js:120-160`; `talentsView.js:187-195` (today's price text); `talents.test.js:1-30` (fixtures)
**Depends on**: None
**Requirement**: UIP-09

**Contract**: design § Talent purchase rules, exactly. Both are exported. A shared private `pointsText(n)` returns `<n> ponto` for 1 and `<n> pontos` otherwise. KDoc-style comments: `//  The most levels the points buy at once (spec ui-polish UIP-09): ...` and `//  The text of the card button: T2 while Shift is held and a level is affordable, else T1 (spec ui-polish).`

**Steps**:

1. Append `pointsText`, `maxPurchase` and `upgradeButtonText` to `talents.js`.
2. Add a `describe('maxPurchase and upgradeButtonText', ...)` with the cases below; build talents as plain objects `{ level, maxLevel, nextCost, unlocked }`.
3. Run the gate.

**Tests**: unit
**Test cases** (`talents.test.js`):

1. `E1: COMBO 0 with 5 points buys 5 levels for 5`: `maxPurchase({ level: 0, maxLevel: 10, nextCost: 1, unlocked: true }, 5)` -> `{ levels: 5, cost: 5, targetLevel: 5 }`; text with Shift `Melhorar até o nível 5 (5 pontos)`.
2. `E2: level 7 with 20 points stops at the top`: `{ level: 7, maxLevel: 10, nextCost: 1 }`, 20 -> `{ levels: 3, cost: 3, targetLevel: 10 }`; `Melhorar até o nível 10 (3 pontos)`.
3. `E3: a grade 2 talent with 5 points buys 2 levels for 4`: `{ level: 0, maxLevel: 10, nextCost: 2 }`, 5 -> `{ levels: 2, cost: 4, targetLevel: 2 }`; `Melhorar até o nível 2 (4 pontos)`.
4. `E4: a grade 2 talent with 1 point buys nothing and keeps the one level text`: -> `{ levels: 0, cost: 0, targetLevel: 0 }`; text with Shift `Melhorar (2 pontos)`.
5. `E5: one affordable level reads in the singular`: `{ level: 0, maxLevel: 10, nextCost: 1 }`, 1 -> `{ levels: 1, cost: 1, targetLevel: 1 }`; `Melhorar até o nível 1 (1 ponto)`.
6. `E6: Fúria crescente with 9 points buys its 4 levels for 8`: `{ level: 0, maxLevel: 4, nextCost: 2 }`, 9 -> `{ levels: 4, cost: 8, targetLevel: 4 }`; `Melhorar até o nível 4 (8 pontos)`.
7. `E7: a grade 3 talent with 30 points reads Melhorar até o nível 10 (30 pontos)`: `{ level: 0, maxLevel: 10, nextCost: 3 }`, 30.
8. `a locked talent buys nothing`: `{ level: 0, maxLevel: 10, nextCost: 2, unlocked: false }`, 50 -> `{ levels: 0, cost: 0, targetLevel: 0 }`.
9. `a talent at its top level buys nothing`: `{ level: 10, maxLevel: 10, nextCost: null }`, 50 -> `{ levels: 0, cost: 0, targetLevel: 10 }`.
10. `0 points buy nothing`: `{ level: 3, maxLevel: 10, nextCost: 1 }`, 0 -> `{ levels: 0, cost: 0, targetLevel: 3 }`.
11. `without Shift the text is the one level price`: `upgradeButtonText({ level: 0, maxLevel: 10, nextCost: 1 }, 5, false)` -> `Melhorar (1 ponto)`; `nextCost: 3`, 30, false -> `Melhorar (3 pontos)`.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 11 cases pass with the exact values above; the whole unit suite passes.

**Commit**: `feat(game): count the talent levels the points buy at once`

---

#### T5: The talent gateway and collection carry the level count [x]

**Owner**: game-dev
**Goal**: `collection.upgrade(id, fromLevel, levels)` posts `{ fromLevel, levels }` for 2 or more levels and `{ fromLevel }` for one (UIP-09 AC 3 to 5).
**Where**: `game/src/application/talents/talentCollection.js`
**Files**:
- Also changes: `game/src/application/talents/talentCollection.test.js`, `game/src/adapters/http/talentApi.js`, `game/src/adapters/http/talentApi.test.js`
- Read first: design § Talent gateway and collection; `talentCollection.js` (whole); `talentCollection.test.js:85-130` (`sends the level the player saw ...`, the 409 cases); `talentApi.js` (whole); `talentApi.test.js` (whole)
**Depends on**: T4
**Requirement**: UIP-09

**Contract**:

- `talentApi.upgrade: async (talentId, fromLevel, levels = 1) => (await httpClient.post(\`/talents/${encodeURIComponent(talentId)}/upgrade\`, levels === 1 ? { fromLevel } : { fromLevel, levels })).data`
- `collection.upgrade: async (talentId, fromLevel, levels = 1)`: `adopt(await (levels === 1 ? gateway.upgrade(talentId, fromLevel) : gateway.upgrade(talentId, fromLevel, levels)))`; the `catch` (409 reload, rethrow) unchanged. Port comment at the top: `upgrade(talentId, fromLevel, levels?)`.

**Steps**:

1. Change `talentApi.js` and the port comment and `upgrade` of `talentCollection.js`.
2. Add the cases below.
3. Run the gate.

**Tests**: unit
**Test cases**:

`talentApi.test.js`:
1. `upgrade with 5 levels posts { fromLevel: 0, levels: 5 }`: `httpClient.post` called with `'/talents/COMBO/upgrade'` and a body `toEqual({ fromLevel: 0, levels: 5 })`.
2. `upgrade with 1 level posts only fromLevel`: `api.upgrade('COMBO', 3, 1)`; `Object.keys(body)` `toEqual([ 'fromLevel' ])`, `body.fromLevel` 3.

`talentCollection.test.js`:
3. `upgrade with 4 levels calls the gateway with the id, the level and 4 and adopts the answer`: `gateway.upgrade.mock.calls[0]` `toEqual([ 'COMBO', 0, 4 ])`; `levelOf('COMBO')` the answered level (4).
4. `upgrade with 1 level or none calls the gateway with two arguments`: `upgrade('COMBO', 2, 1)` and `upgrade('COMBO', 2)` -> each `mock.calls[n]` `toEqual([ 'COMBO', 2 ])`.
5. `a 409 after a 4 level upgrade reads the tree again and still rejects`: gateway rejects `{ status: 409, code: 'TALENT_MAX_LEVEL' }`; `gateway.list` called once; the promise rejects with that error.

Every existing case passes unchanged (`sends the level the player saw and adopts the tree and the points` still sees two arguments).

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 5 cases pass; the whole unit suite passes.

**Commit**: `feat(game): send the talent level count when more than one level is bought`

---

#### T6: The Shift mode follows the key, the pointer and the window [x]

**Owner**: game-dev
**Goal**: `createShiftKey` holds one boolean that the key, pointer, blur and visibility events keep true to the Shift key (UIP-10 AC 1 to 6, 9; Edge 1).
**Where**: `game/src/adapters/phaser/shiftKey.js` (new)
**Files**:
- Also creates: `game/src/adapters/phaser/shiftKey.test.js`
- Read first: design § Shift mode; `game/src/adapters/phaser/backgroundFight.js` and its test (a module that listens to `document` and is tested with injected targets)
**Depends on**: None
**Requirement**: UIP-10

**Contract**: design § Shift mode, exactly: `createShiftKey({ win = window, doc = document, onChange = () => {} } = {})` -> `{ held, dispose }`; listeners on `win` with capture `true`: `keydown`, `keyup`, `pointermove`, `pointerdown`, `blur`; on `doc`: `visibilitychange`. `onChange(value)` only on a change.

**Steps**:

1. Write `shiftKey.js` with a header comment `//  Whether Shift is held (spec ui-polish UIP-10). No keyup reaches the page when Shift is released outside the window, so blur and a hidden tab end it and every key or pointer event resets it from its shiftKey.`
2. Write the tests below with `const win = new EventTarget()` and `const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })`; key events `new KeyboardEvent('keydown', { key, shiftKey, repeat })`; pointer events `new MouseEvent('pointermove', { shiftKey })` (jsdom has no `PointerEvent`).
3. Run the gate.

**Tests**: unit
**Test cases** (`shiftKey.test.js`):

1. `starts off`: `held()` false, `onChange` not called.
2. `a Shift keydown turns it on once, auto-repeat included`: keydown `Shift` -> `held()` true, `onChange` called once with `true`; a second keydown `Shift` with `repeat: true` -> `onChange` still called once.
3. `a Shift keyup turns it off`: -> false, `onChange` last called with `false`.
4. `another key sets it from its shiftKey`: keydown `a` with `shiftKey: true` -> true; keyup `a` with `shiftKey: false` -> false.
5. `a pointer move or press sets it from its shiftKey`: `pointermove` `shiftKey: true` -> true; `pointerdown` `shiftKey: false` -> false.
6. `blur turns it off`: keydown `Shift`, then `win.dispatchEvent(new Event('blur'))` -> false.
7. `a hidden document turns it off and a visible one does not`: keydown `Shift`; `doc.visibilityState = 'visible'`, dispatch `visibilitychange` -> still true; `doc.visibilityState = 'hidden'`, dispatch -> false.
8. `releasing one of two held Shift keys turns it off` (Edge 1): keydown `Shift` twice, one keyup `Shift` -> false.
9. `dispose removes every listener`: `dispose()`; keydown `Shift`, `pointermove` with `shiftKey: true` -> `held()` false, `onChange` not called after `dispose`.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 9 cases pass; the whole unit suite (including `architecture.test.js`) passes.

**Commit**: `feat(game): follow the Shift key for the talent shortcut`

---

#### T7: The Talentos view updates in place [x]

**Owner**: game-dev
**Goal**: `updateTalents` patches the screen `renderTalents` built, the busy state no longer dims, and the card button shows the Shift form (UIP-06 AC 1 to 9, UIP-07 AC 1, 3, 4, UIP-09 AC 1, 2, 6, 9, 10, UIP-11).
**Where**: `game/src/adapters/phaser/views/talentsView.js`
**Files**:
- Also changes: `game/src/adapters/phaser/views/talentsView.test.js`, `game/public/style.css` (talent block, `.talent-upgrade` rule at `:2560-2572` and three new rules after it)
- Read first: design § Talentos view in place (every interface and the 6 steps of `updateTalents`); `talentsView.js` (whole); `talentsView.test.js:1-41` (fixtures `tree`, `points`, `show`, `find`, `text`, `nodes`), `:143-200`, `:329-350`; `style.css:2440-2580`
**Depends on**: T4
**Requirement**: UIP-06, UIP-07, UIP-09, UIP-11

**Contract**: design § Talentos view in place, exactly: `renderTalents` options gain `shiftHeld`; `data-busy` on the screen; `data-selected-id` on the card; `onUpgrade(talentId, { shift })`; `renderUpgradeButton`, `patchUpgradeButton`, `SHIFT_HINT`, `updateTalents` exported; the reset and card button clicks do nothing while `aria-disabled` is `'true'`; the CSS:

```css
/* in the existing .talent-upgrade rule */
    white-space: nowrap;

/* Shift: the button buys the most levels the points pay (spec ui-polish UIP-09) */
.talent-upgrade[data-max="true"] { box-shadow: 0 0 0 2px var(--gold-400); }
/* A request runs: the buttons keep their look and say "wait" (spec ui-polish UIP-07) */
.talent-screen[data-busy="true"] .talent-upgrade,
.talent-screen[data-busy="true"] .talent-reset { cursor: progress; }
```

**Steps**:

1. Import `maxPurchase` and `upgradeButtonText` from `../../../domain/talents/talents`.
2. Export `SHIFT_HINT`. Write `patchUpgradeButton` and `renderUpgradeButton`; `renderDetail` takes `{ busy, shiftHeld, selectedId, onUpgrade }`, builds its action with a new private `renderAction(talent, talents, available, options)` (lock div, max div, or `renderUpgradeButton`) and sets `data-selected-id` on the card (also the empty card).
3. `renderTalents`: `data-busy` on the screen; Reiniciar pontos `disabled = points.spent === 0`, `aria-disabled = String(busy)`, click guarded by `aria-disabled`.
4. Write `updateTalents` in the 6 steps of the design; a private `actionKind(talent)` returns `'lock'`, `'max'` or `'button'`, and `kindOf(element)` reads it from the class (`talent-lock`, `talent-max`, `talent-upgrade`).
5. Update the comments of `renderTalents` (line `:204-209`) to say the screen is built once and patched by `updateTalents`, and that `busy` marks `aria-disabled`.
6. CSS as in the Contract.
7. Re-pin the 3 tests below and add the new ones in a `describe('updateTalents', ...)` and a `describe('the Shift form of the card button', ...)`.
8. Run the gate.

**Tests**: unit
**Re-pins** (`talentsView.test.js`, by name):

- `calls onUpgrade with the talent when the card button is clicked` -> renamed `calls onUpgrade with the talent id and no Shift when the card button is clicked`; asserts `toHaveBeenCalledWith('CLICK_DAMAGE', { shift: false })`.
- `disables the card button while busy` -> renamed `marks the card button aria-disabled while busy and leaves it enabled`; asserts `disabled` false and `aria-disabled` `'true'`.
- `disables Reiniciar pontos while nothing is spent and while busy, and calls onReset` -> renamed `disables Reiniciar pontos while nothing is spent, marks it aria-disabled while busy, and calls onReset`; `withSpent(0)` `disabled` true; `withSpent(3, { busy: true })` `disabled` false and `aria-disabled` `'true'`; `withSpent(3)` click calls `onReset` once.

**Test cases** (new; `patch(screen, levels, available, spent, options)` = `updateTalents(screen, tree(levels), points(available, spent), { onUpgrade: vi.fn(), ...options })`; `snapshot(screen)` = for each `.talent-node`: `[ data-testid, data-state, aria-label, aria-pressed, level chip text, has .talent-node-lock ]`, then every `.talent-lit` opacity, the `talent-points` text, Reiniciar pontos `disabled` and `aria-disabled`, the screen `data-busy`, the card `data-selected-id` and `textContent`, and the card button `[ textContent, disabled, aria-disabled, data-max, title ]` or null):

1. `keeps the board image, the 28 nodes, the card and the card icon after a level bought`: `show({}, 5, { selectedId: 'CLICK_DAMAGE' })`; keep the `.talent-tree-image`, the 28 nodes, `talent-detail` and its `img`; `patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' })`; each is `toBe` the kept one, and `[ ...screen.querySelectorAll('img') ]` equals the list before (same elements, same order).
2. `writes the new values in place`: same transition -> `talent-CLICK_DAMAGE` `data-state` `available`, `talent-node-level-CLICK_DAMAGE` `1/10`, `aria-label` `Dano de clique (%), nível 1 de 10`, `talent-points` `Pontos de talento: 4`, `talent-level-CLICK_DAMAGE` `Nível 1/10`, `talent-effect-CLICK_DAMAGE` `Efeito: +5%`, button `Melhorar (1 ponto)` enabled, every lit opacity equal to the one of `show({ CLICK_DAMAGE: 1 }, 4, { selectedId: 'CLICK_DAMAGE' })`.
3. `a patched screen reads like a fresh build of the same tree`: for each transition, `snapshot` of the patched screen `toEqual` `snapshot` of a fresh `renderTalents` with the target tree and options: (a) `{}`/5/0 -> `{ CLICK_DAMAGE: 1 }`/4/1, selected `CLICK_DAMAGE`; (b) `{ COMBO: 9 }`/1/9 -> `{ COMBO: 10 }`/0/10, selected `COMBO`; (c) `{ COMBO: 10, COMBO_G2: 3 }`/0/16 -> `{}`/16/0, selected `COMBO_G2`; (d) `{}`/5/0 selected null -> same tree, selected `COMBO`; (e) `{}`/5/0 selected `CLICK_DAMAGE` -> same, `busy: true`; (f) `{}`/5/0 selected `COMBO` -> same, `shiftHeld: true`.
4. `replaces only the card when another node is selected`: transition (d): board image and 28 nodes `toBe` the kept ones; `talent-detail` is `not.toBe` the old one and has `data-selected-id` `COMBO`.
5. `keeps the card when the same node stays selected`: transition (a): `talent-detail` `toBe` the old one.
6. `adds the lock to the grades that lock again, keeping their frame and icon`: transition (c): `talent-COMBO_G2` and `talent-COMBO_FURY` each hold one `.talent-node-lock` and their `.talent-node-frame` and `.talent-node-icon` are the kept elements.
7. `removes the lock from a node that opens, keeping its frame and icon`: transition (b): `talent-COMBO_G2` and `talent-COMBO_FURY` hold no `.talent-node-lock`; frame and icon kept.
8. `replaces only the action when the button becomes Nível máximo`: transition (b): `talent-max-COMBO` reads `Nível máximo`, `talent-upgrade-COMBO` is gone, and `talent-detail-name`, `talent-level-COMBO`, `talent-effect-COMBO`, `talent-detail-icon` are the kept elements.
9. `sends the talent id after a patch, with the Shift of the click`: `const onUpgrade = vi.fn()`; `show({}, 5, { selectedId: 'CLICK_DAMAGE', onUpgrade })`; `patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' })` (the button is patched, not rebuilt, so it keeps the listener of `show`); `button.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))` -> `onUpgrade` called with `('CLICK_DAMAGE', { shift: true })`; `button.click()` -> `('CLICK_DAMAGE', { shift: false })`.
10. `ignores clicks on both buttons while busy and takes them again after`: `show({ COMBO: 1 }, 5, { selectedId: 'COMBO', busy: true, onUpgrade, onReset })`; clicks -> neither called; screen `data-busy` `'true'`; `patch(screen, { COMBO: 1 }, 5, 1, { selectedId: 'COMBO', busy: false })` -> `aria-disabled` `'false'` on both; clicks -> each called once.
11. `labels the button Melhorar até o nível 5 (5 pontos) with data-max true while Shift is held` (E1): `show({}, 5, { selectedId: 'COMBO', shiftHeld: true })`.
12. `goes back to Melhorar (1 ponto) with data-max false on the same button when Shift ends`: then `patch(screen, {}, 5, 0, { selectedId: 'COMBO', shiftHeld: false })` -> same element (`toBe`), text `Melhorar (1 ponto)`, `data-max` `'false'`.
13. `keeps Melhorar (2 pontos), disabled and data-max false when no level is affordable` (E4): `show({ COMBO: 10 }, 1, { selectedId: 'COMBO_G2', shiftHeld: true })`.
14. `reads the Shift texts of E2, E3, E5, E6 and E7`: `{ CLICK_DAMAGE: 7 }`/20 -> `Melhorar até o nível 10 (3 pontos)`; `{ COMBO: 10 }`/5 `COMBO_G2` -> `Melhorar até o nível 2 (4 pontos)`; `{}`/1 `COMBO` -> `Melhorar até o nível 1 (1 ponto)`; `{ COMBO: 10 }`/9 `COMBO_FURY` -> `Melhorar até o nível 4 (8 pontos)`; `{ CLICK_DAMAGE: 10, CLICK_DAMAGE_G2: 10 }`/30 `CLICK_DAMAGE_G3` -> `Melhorar até o nível 10 (30 pontos)`.
15. `keeps the lock text and Nível máximo while Shift is held`: `show({ COMBO: 5 }, 50, { selectedId: 'COMBO_G2', shiftHeld: true })` shows `talent-locked-COMBO_G2` and no button; `show({ CLICK_DAMAGE: 10 }, 50, { selectedId: 'CLICK_DAMAGE', shiftHeld: true })` shows `Nível máximo`.
16. `carries the tooltip Segure Shift para melhorar até o máximo in both forms`: `title` of the button with `shiftHeld` false and true.

Every other existing `talentsView.test.js` case passes unchanged.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 16 new cases and the 3 re-pinned cases pass; the whole unit suite passes.
- [x] `git grep -n "busy ||" -- game/src/adapters/phaser/views/talentsView.js` prints nothing (busy no longer sets `disabled`).

**Commit**: `feat(game): update the Talentos screen in place and show the Shift purchase`

---

#### T8: HeroUi patches Talentos and buys with Shift [x]

**Owner**: game-dev
**Goal**: Every later render of an open Talentos patches it; a click buys k levels with Shift; clicks are ignored while a request runs; the Shift listeners go away with the scene (UIP-06, UIP-07 AC 2, UIP-09 AC 3 to 8, UIP-10 AC 7 to 9).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Files**:
- Also changes: `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/ClickerGame.js` (only the shutdown hook at `:258-262`)
- Read first: design § HeroUi wiring; `HeroUi.js:1-30` (imports), `:96-135` (constructor), `:998-1093` (`render_talents`, `selectTalent`, `upgradeTalent`, `resetTalents`), `:1220-1232` (`showTalentPoints`); `HeroUi.test.js:1-60` (`createUi`, `open`, `flush`), `:1222-1360` (talent fixtures and cases), `:1491-1512` (the scroll case); `ClickerGame.js:256-262`
**Depends on**: T5, T6, T7
**Requirement**: UIP-06, UIP-07, UIP-09, UIP-10

**Contract**: design § HeroUi wiring, exactly: `this.shiftKey` in the constructor; `refreshTalentShift()`; `render_talents()` patches when a `talent-screen` is in the body, else builds and calls `placeTalentScroll(screen, null)`; `upgradeTalent(talentId, shift = false)`; `resetTalents()` guard; `destroy()`. `ClickerGame` shutdown hook gains `this.heroUi?.destroy?.();`. Imports: `createShiftKey` from `./shiftKey`, `updateTalents` from `./views/talentsView`, `maxPurchase` from `../../domain/talents/talents`; drop `talentScrollOf` from the import when nothing else uses it.

**Steps**:

1. Imports and the constructor line.
2. `refreshTalentShift`, `render_talents`, `upgradeTalent`, `resetTalents`, `destroy` as in the Contract. In `upgradeTalent`, the `view` check and the error texts stay as they are.
3. `ClickerGame.js` shutdown hook.
4. Re-pin the test below and add the new cases in `describe('HeroUi Talentos', ...)` after `says Não foi possível melhorar o talento. ...`. Each new test calls `ctx.ui.destroy()` at its end. Shift: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', shiftKey: true }))`, keyup the same with `shiftKey: false`; blur `window.dispatchEvent(new Event('blur'))`.
5. Run the gate.

**Tests**: unit
**Re-pin** (`HeroUi.test.js`, by name): `disables every Melhorar button while the request runs and enables them after` -> renamed `marks every Melhorar button aria-disabled while the request runs and clears it after`; while held: every `.talent-upgrade` `aria-disabled` `'true'` and `disabled` false; after `finish`: `talent-upgrade-CLICK_DAMAGE` `aria-disabled` `'false'`.

**Test cases** (new; fixtures `talentTree`, `pointsOf`, `talentsAnswer` of `HeroUi.test.js:1222`):

1. `keeps the board image and the nodes after a level bought`: open with `talentsAnswer({}, 1)`, pick `COMBO`, keep `.talent-tree-image` and `talent-COMBO`; upgrade answers `talentTree({ COMBO: 1 })`, `pointsOf(0, 1)`; after `flush`, both `toBe` the kept ones and `talent-node-level-COMBO` reads `1/10`.
2. `keeps them after a node click`: pick `CLICK_DAMAGE` -> same elements.
3. `keeps them after Reiniciar pontos`: open with `talentList: { talents: talentTree({ COMBO: 1 }), points: pointsOf(0, 1) }`, `talentGateway.reset` answers `talentsAnswer({}, 1)`, click `talent-reset` -> same elements, `Pontos de talento: 1`.
4. `keeps them after the points reload`: `showTalentPoints()` with `list` answering `talentsAnswer({}, 3)` -> same elements, `Pontos de talento: 3`.
5. `Shift held: COMBO with 5 points sends one upgrade of 5 levels`: open with `talentsAnswer({}, 5)`, pick `COMBO`, keydown Shift, click -> `talentGateway.upgrade` `toHaveBeenCalledWith('COMBO', 0, 5)`; answer `talentTree({ COMBO: 5 })`/`pointsOf(0, 5)` -> `Nível 5/10`, `Pontos de talento: 0`.
6. `a click with the event's shiftKey and the Shift mode off sends 5 levels`: `button.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))` -> `('COMBO', 0, 5)`.
7. `Shift held with one affordable level sends two arguments`: `talentsAnswer({}, 1)` -> `toHaveBeenCalledWith('COMBO', 0)`; `mock.calls[0]` has length 2.
8. `a click without Shift sends one level`: `talentsAnswer({}, 5)` -> `mock.calls[0]` `toEqual([ 'COMBO', 0 ])`.
9. `the button text follows Shift on the same element`: with 5 points: keydown -> `Melhorar até o nível 5 (5 pontos)`; keyup -> `Melhorar (1 ponto)`; keydown then blur -> `Melhorar (1 ponto)`; the button element is the same in all four reads.
10. `Shift held, selecting another talent shows its Shift text at once`: keydown, pick `CLICK_DAMAGE` -> `talent-upgrade-CLICK_DAMAGE` `Melhorar até o nível 5 (5 pontos)`.
11. `ignores a second upgrade click while the request runs`: held upgrade promise; two clicks -> `upgrade` called once.
12. `ignores Reiniciar pontos while an upgrade runs`: held upgrade; reset click -> `reset` not called.
13. `shows the answered tree with no error when the backend buys one level of a Shift purchase`: Shift purchase of 5 answered `talentTree({ COMBO: 1 })`/`pointsOf(4, 1)` -> `Nível 1/10`, `.hero-error` hidden.
14. `says Pontos de talento insuficientes when a Shift purchase is refused and shows the tree read again`: `upgrade` rejects `new ApiError('Not enough', { status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' })`, `list` then answers `talentsAnswer({ COMBO: 2 }, 3)` -> error text `Pontos de talento insuficientes`, `Nível 2/10`, `Pontos de talento: 3`.
15. `destroy removes the Shift listeners`: `ctx.ui.destroy()`; keydown Shift -> the button still reads `Melhorar (1 ponto)`.

Every other existing `HeroUi.test.js` and `ClickerGame.test.js` case passes unchanged (the scroll case `centres the tree on opening and keeps the scroll the player chose across a re-render` included).

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 15 new cases and the re-pinned case pass (re-pinned in the T7 commit, see its body); the whole unit suite passes.
- [x] `git grep -n "replaceChildren(screen)" -- game/src/adapters/phaser/HeroUi.js` shows the call only inside the build branch of `render_talents`.

**Commit**: `feat(game): patch the open Talentos screen and buy the most levels with Shift`

---

#### T9: Equipe takes the place of Líder [ ]

**Owner**: game-dev
**Goal**: The rail always shows six buttons with Equipe in third place and no Líder; the leader list opens from the leader card of Equipe, so every player can still change the leader from chapter 1 (UIP-13 AC 1 to 8, 10, 11; spec Q20, Q28, Q29).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Files**:
- Also changes: `game/src/adapters/phaser/views/teamView.js`, `game/src/adapters/phaser/views/teamView.test.js`, `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (only the two cases named below), `game/public/style.css` (two rules after the `.team-slot` rules)
- Unchanged and reused: `game/src/adapters/phaser/views/leaderView.js` and `leaderView.test.js`
- Read first: design § Equipe replaces Líder; `HeroUi.js:30-90` (`ICONS`, `SCREENS`, `RAIL`, `buttonHtml`), `:126-191` (constructor, `teamButton`, `refreshTeamButton`), `:338-344` (`showDetail`), `:505-560` (`render_leader`, `pickLeader`, `render_team`); `teamView.js:62-80` (`renderLeaderCard`), `:172-215` (`renderTeam`); `leaderView.js` (whole); the `.team-slot` rules of `style.css` (`git grep -n "\.team-slot" game/public/style.css`); `HeroUi.test.js:90-100`, `:518-545`, `:1590-1606`, `:2685-2720`; `ClickerGame.test.js:2307-2316`, `:2383-2392`
**Depends on**: T8
**Requirement**: UIP-13

**Contract**:

- `HeroUi.js`:
  - `SCREENS` = `heroes` (Heróis), `bag` (Mochila), `team` (Equipe), `equipment` (Equipamento), `talents` (Talentos), `farm` (Rever chefes), in this order; the `leader` entry and `ICONS.leader` are deleted. `RAIL = SCREENS` (the six buttons); `HUD_HTML` maps `RAIL`.
  - Deleted: the `holder` / `this.teamButton` block of the constructor, `refreshTeamButton()` and its two calls (`heroes.onChange` keeps `this.updateSkillBar()`), `render_leader()`. Comments that list the screens drop Líder and the "Equipe only while the team is unlocked" sentence.
  - `render_team()` starts with `this.backButton.hidden = true;` and passes the handler `onLeader: () => this.openLeaderPicker()`.
  - `openLeaderPicker()`: `const picker = el('div', 'leader-picker', '', { testid: 'leader-picker' });` then `picker.append(el('h3', 'team-available-title', 'Escolher líder'), renderLeaderPicker(this.heroes.heroes(), this.heroes.leaderId(), { onPick: (heroId) => this.pickLeader(heroId) }));` then `this.showDetail(picker, () => this.render_team());`. The window title stays `Equipe`.
  - `pickLeader(heroId)`: unchanged except that a success with `view === this.view` calls `this.openLeaderPicker()` (the list stays open and marks the new leader) instead of `this.render_leader()`. A failure still shows `Não foi possível trocar o líder.`
- `teamView.js`:
  - `renderLeaderCard(leader, { busy = false, onLeader } = {})`: a `button` with `type="button"`, class `team-slot is-leader`, `data-testid="team-slot-0"`, `data-state="leader"`, `data-selected="false"`; children as today (label `Líder`, then sprite, name, stars and bonus when there is a leader) and last `el('span', 'team-leader-change', 'Trocar líder', { testid: 'team-leader-change' })`; `disabled = busy`; a click calls `onLeader?.()`.
  - `renderTeam` calls `renderLeaderCard(model.leader, { busy: model.busy, onLeader: handlers.onLeader })`; its comment lists `onLeader()` among the handlers.
- `style.css` (after the `.team-slot` rules):

```css
/* The leader card opens the leader list (spec ui-polish UIP-13) */
.team-slot.is-leader:hover:not(:disabled) { filter: brightness(1.06); }
.team-leader-change { margin-top: auto; font-size: 11px; font-weight: 800; color: var(--color-accent-800); text-decoration: underline; }
```

- No backend change: `PUT /leader` keeps serving the list and `Tornar líder` (UIP-13 AC 10).

**Steps**:

1. `teamView.js` as in the Contract.
2. `HeroUi.js`: the `SCREENS`, `ICONS`, `RAIL`, constructor, `refreshTeamButton` and `render_leader` changes; `render_team`, `openLeaderPicker`, `pickLeader`.
3. `style.css`: the two rules.
4. Re-pin and add the tests below.
5. Run the gate.

**Tests**: unit
**Re-pins** (by name):

- `HeroUi.test.js` `shows the six buttons Heróis, Mochila, Líder, Equipamento, Talentos and Rever chefes` -> renamed `shows the six buttons Heróis, Mochila, Equipe, Equipamento, Talentos and Rever chefes`; ids `[ 'heroes', 'bag', 'team', 'equipment', 'talents', 'farm' ]`, texts `[ 'Heróis', 'Mochila', 'Equipe', 'Equipamento', 'Talentos', 'Rever chefes' ]`.
- `HeroUi.test.js` `describe('HeroUi Líder')` -> renamed `describe('HeroUi Equipe leader list')`; its two cases open `team`, click `team-slot-0`, then assert what they assert today: `lists the owned heroes, changes the leader and replaces the three skills on the bar` (also: `leader-picker` still shown after the pick) and `shows a Portuguese error line and keeps the leader when the change fails`.
- `HeroUi.test.js` `shows the name and the numbers of the new leader after a leader change`: opens `team`, clicks `team-slot-0`, then `leader-entry-lyra`; the rest unchanged.
- `HeroUi.test.js` `the rail has six buttons and no Equipe button while the team is locked` -> renamed `the rail has the six buttons with Equipe in third place while the team is locked`; `railIds(ctx)` `toEqual([ 'hud-heroes', 'hud-bag', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm' ])`.
- `HeroUi.test.js` `the Equipe button appears right after Líder once the team is unlocked` -> renamed `the rail keeps the same six buttons once the team is unlocked`; the same ids; `hud-team` text `Equipe` and 8 icon paths kept.
- `HeroUi.test.js` `the Equipe button leaves the rail when a load answers a locked team` -> renamed `the Equipe button stays when a load answers a locked team`; after the second load `hud-team` is not null and the rail has 6 buttons.
- `ClickerGame.test.js` `shows the four hero buttons in the HUD and none of them in the pause menu`: ids `[ 'heroes', 'bag', 'team', 'farm' ]`, texts `[ 'Heróis', 'Mochila', 'Equipe', 'Rever chefes' ]`; the rest unchanged.
- `ClickerGame.test.js` `Esc closes an open hero screen first and does not open the pause menu`: `openPanel(ctx, 'team')` instead of `'leader'`.

**Test cases** (new):

`teamView.test.js`:
1. `the leader card is a button with Trocar líder that calls onLeader`: `team-slot-0` `tagName` `BUTTON`, `team-leader-change` text `Trocar líder`; a click calls `onLeader` once.
2. `the leader card is disabled while busy`: `busy: true` -> `disabled` true; a click does not call `onLeader`.

`HeroUi.test.js` (`describe('HeroUi Equipe leader list')`):
3. `Equipe opens with a locked team and shows the leader card with Trocar líder`: `createUi()` (locked team), open `team` -> `team-slot-0` is a button holding `Trocar líder`; `team-slot-1` to `team-slot-4` `data-state` `locked`.
4. `the leader card opens Escolher líder with Voltar under the title Equipe`: click `team-slot-0` -> `leader-picker` present, its `h3` text `Escolher líder`, `hero-back` not hidden, `.hero-title` `Equipe`, `leader-entry-kael` has `is-current`.
5. `Voltar returns to Equipe with the new leader card`: pick `lyra` (`setLeader` resolves `{ leaderId: 'lyra' }`), click `hero-back` -> `team-screen` present, `team-slot-0 .team-name` the name of lyra in the fixture, `hero-back` hidden.
6. `the leader card is disabled while a team request runs`: a held `setTeam` started by a click on an available hero -> `team-slot-0` `disabled` true; after it resolves, false.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 6 new cases and the 8 re-pinned cases pass; the whole unit suite passes.
- [ ] `git grep -n "hud-leader\|render_leader\|refreshTeamButton\|teamButton" -- game/src` prints nothing.

**Commit**: `feat(game): open the leader list from Equipe and drop the Líder button`

---

#### T10: The T and B keys open Talentos and Mochila [ ]

**Owner**: game-dev
**Goal**: T toggles Talentos and B toggles Mochila under the rules of spec UIP-12, the two HUD buttons show their key, and A ignores modifiers too (UIP-12, UIP-14; spec Q21 to Q27).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.test.js`, `game/src/adapters/phaser/HeroUi.js` (`buttonHtml`, new `toggle`), `game/src/adapters/phaser/HeroUi.test.js`, `game/public/style.css` (`.hud-key`, after the `.hud-badge` rule)
- Read first: design § Screen keys; `ClickerGame.js:96` (`SKILL_KEYS`), `:279-299` (`createControls`, the ESC and skill key lines), `:395-405` (`autoClickKey`), `:580-595` (`escape`); `HeroUi.js` `buttonHtml`, `show`, `close`; `ClickerGame.test.js:3992` (`press`), `:4421-4440` (A opens and closes), `:4485-4640` (A in text fields, repeat, paused, dialog); `style.css:1007-1023` (`.auto-click-key`), `:1191-1240` (`.hero-hud button`, `.hud-badge`)
**Depends on**: T9, T3
**Requirement**: UIP-12, UIP-14

**Contract**:

- `ClickerGame.js`:
  - `const SCREEN_KEYS = [ [ 'T', 'talents' ], [ 'B', 'bag' ] ];` next to `SKILL_KEYS`.
  - `const hasModifier = (event) => Boolean(event?.ctrlKey || event?.altKey || event?.metaKey || event?.shiftKey);` under the imports, with the comment `//  A shortcut with Ctrl, Alt, Meta or Shift belongs to the browser or to another gesture (spec ui-polish UIP-12)`.
  - In `createControls`, after the `SKILL_KEYS` line: ``SCREEN_KEYS.forEach(([ key, screen ]) => this.input.keyboard.on(`keydown-${key}`, (event) => this.screenKey(screen, event)));``
  - `screenKey(screen, event)`: returns when `event?.repeat || hasModifier(event) || isTextField(event?.target) || this.paused || !this.resetDialog.hidden`; when `this.autoClickWindowOpen`, calls `this.closeAutoClickWindow({ returnFocus: false })`; then `this.heroUi.toggle(screen)`.
  - `autoClickKey(event)`: its guard gains `|| hasModifier(event)` (UIP-14).
- `HeroUi.js`:
  - `const SHORTCUTS = { bag: 'B', talents: 'T' };` `buttonHtml` adds, for an id in `SHORTCUTS`, the attribute `aria-keyshortcuts="<key>"` on the button and, after the label, `<span class="hud-key" data-testid="hud-key-<id>" aria-hidden="true"><key></span>`.
  - `toggle(screen)`: `if (this.open && this.screen === screen) { this.close(); return; } return this.show(screen);` (a Mochila hero detail or fusion ladder is the screen `bag`).
- `style.css`:

```css
/* The key of a HUD button (spec ui-polish UIP-12), in the corner the red dot leaves free */
.hud-key { position: absolute; top: 3px; left: 4px; display: grid; place-items: center; box-sizing: border-box; min-width: 16px; height: 16px; padding: 0 3px; font-family: var(--font-heading); font-size: 10px; font-weight: 700; line-height: 1; color: var(--gold-200); background: var(--wood-900); border: 1px solid var(--gold-400); border-radius: 4px; pointer-events: none; }
```

**Steps**:

1. `ClickerGame.js`: `SCREEN_KEYS`, `hasModifier`, the registration, `screenKey`, the `autoClickKey` guard.
2. `HeroUi.js`: `SHORTCUTS`, `buttonHtml`, `toggle`.
3. `style.css`: `.hud-key`.
4. Add the tests below (`press(ctx, 'T', { repeat: false, target: document.body })`, as the A cases do).
5. Run the gate.

**Tests**: unit
**Test cases** (new):

`ClickerGame.test.js` (`describe('Screen keys T and B')`):
1. `T opens Talentos`: -> `heroUi.isOpen` true, `heroUi.screen` `talents`.
2. `B opens Mochila`: -> `heroUi.screen` `bag`.
3. `T closes Talentos when it is open`: T twice -> `isOpen` false.
4. `B closes Mochila when it is open`: B twice -> false.
5. `T over Mochila shows Talentos`: B then T -> open, `screen` `talents`.
6. `Ctrl, Alt, Meta or Shift with T does nothing`: four presses, each with one of `ctrlKey`, `altKey`, `metaKey`, `shiftKey` true -> `isOpen` false after each.
7. `Ctrl+B does nothing`: `ctrlKey: true` -> false.
8. `a repeated T does nothing`: `repeat: true` -> false.
9. `T typed in a text field does nothing`: target an `input` (type text) -> false.
10. `T does nothing while the fight is paused`: after `keydown-ESC` -> `isOpen` false, `paused` true.
11. `T does nothing while the reset dialog is shown`: `scene.resetDialog.hidden = false` -> false.
12. `T closes the auto click window and opens Talentos`: `atChapter(2)`, A opens the window, T -> popover `hidden` true, `screen` `talents`.
13. `Ctrl+A does not open the auto click window` (UIP-14): `atChapter(2)`, `ctrlKey: true` -> popover `hidden` true.
14. `Alt+A, Meta+A and Shift+A do not open it either`.
15. `a plain A still opens it`: -> `hidden` false.

`HeroUi.test.js`:
16. `the Mochila and Talentos buttons show the keys B and T`: `hud-key-bag` text `B`, `hud-key-talents` text `T`; `hud-bag` `aria-keyshortcuts` `B`, `hud-talents` `T`; the other four buttons hold no `.hud-key` and no `aria-keyshortcuts`.
17. `toggle opens a closed screen, closes the same one and switches from another`: `toggle('bag')` -> open `bag`; `toggle('bag')` -> closed; `toggle('bag')` then `toggle('talents')` -> open `talents`.

Every existing A case of `ClickerGame.test.js` passes unchanged.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 17 new cases pass; the whole unit suite passes.

**Commit**: `feat(game): open Talentos with T and Mochila with B`

---

### Phase 3: Tests in the browser and author check

#### T11: The page guards in the browser [ ]

**Owner**: test-engineer
**Goal**: Every AC of UIP-01 to UIP-05 is pinned in Chrome, with the CSS values read by `toHaveCSS` or `getComputedStyle`.
**Where**: `game/e2e/uiPolishPage.spec.js` (new)
**Files**:
- Read first: spec UIP-01 to UIP-05; `game/e2e/talents.spec.js:1-30` (`startGame`), `game/e2e/support/game.js` (`openMainMenu`, `fillCredentials`), `game/e2e/support/coverage.js` (import `test`, `expect` from it)
**Depends on**: T3, T10
**Requirement**: UIP-01, UIP-02, UIP-03, UIP-04, UIP-05

**Scenarios** (`selection = () => page.evaluate(() => window.getSelection().toString())`; "focus outside a text field" = `page.evaluate(() => document.activeElement?.blur())` before the key):

`describe('No selection (UIP-01)')`:
1. `html and body have user-select none`: `toHaveCSS('user-select', 'none')` on `html` and `body`.
2. `Ctrl+A on the start screen selects nothing`: `openMainMenu`; blur; `page.keyboard.press('Control+A')`; `selection()` `''`.
3. `Ctrl+A on the battle screen selects nothing`: after `startGame`; same.
4. `Ctrl+A on Talentos selects nothing`: `hud-talents` click; same.
5. `a double click on the points pill or the card name selects nothing`: Talentos, pick `COMBO`; `dblclick` on `talent-points` -> `''`; `dblclick` on `talent-detail-name` -> `''`.
6. `a drag across the Talentos window selects nothing`: box of `.hero-window`; `mouse.move(x + 4, y + 4)`, `down`, `move(x + w - 4, y + h - 4, { steps: 10 })`, `up` -> `''`.
7. `the username field still selects its text`: start screen; click `menu.username`, type `yan`, `Control+A` -> `[ selectionStart, selectionEnd ]` `[ 0, 3 ]`; `toHaveCSS('user-select', 'text')`.
8. `the password field keeps user-select text`.

`describe('No drag ghost (UIP-02)')`:
9. `every image of Talentos has -webkit-user-drag none`: every `img` inside `talent-screen` (at least 60) reads `getComputedStyle(img).getPropertyValue('-webkit-user-drag')` `none`.
10. `dragstart on a node icon is cancelled`: dispatch `new DragEvent('dragstart', { bubbles: true, cancelable: true })` on `[data-testid="talent-COMBO"] img` -> `defaultPrevented` true.
11. `dragstart on the username field is not cancelled` -> false.

`describe('No browser menu (UIP-03)')`:
12. `contextmenu on the canvas is cancelled` (dispatched) -> true.
13. `a real right click on a talent node is cancelled`: `page.evaluate` adds `window.addEventListener('contextmenu', (event) => { window.__menuCancelled = event.defaultPrevented; })`; `page.getByTestId('talent-COMBO').click({ button: 'right' })`; `window.__menuCancelled` true.
14. `contextmenu on the username field is not cancelled` -> false.

`describe('Arrow cursor (UIP-04)')`:
15. `plain text shows the arrow`: `body`, `talent-detail-name`, `[data-testid="talent-points"] .talent-pill` -> `toHaveCSS('cursor', 'default')`.
16. `the text fields show the I-beam`: username and password -> `text`.
17. `controls keep the hand`: `talent-COMBO` and `talent-upgrade-COMBO` (5 points) -> `pointer`.

`describe('Keyboard focus ring (UIP-05)')`:
18. `a mouse click leaves no ring`: click `hud-talents` -> `toHaveCSS('outline-style', 'none')`.
19. `Tab and Shift+Tab bring the ring back`: then `keyboard.press('Tab')`, `keyboard.press('Shift+Tab')`; `hud-talents` is `document.activeElement`, matches `:focus-visible`, `outline-style` `solid`, `outline-color` `rgb(204, 78, 26)`.

**Tests**: e2e
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/uiPolishPage.spec.js e2e/dragEquip.spec.js e2e/auth.spec.js`
**Done when**:

- [ ] The 19 scenarios pass; `dragEquip.spec.js` (UIP-02 AC 4) and `auth.spec.js` pass unchanged.

**Commit**: `test(game): pin the page guards in the browser`

---

#### T12: Talentos in place and without dimming, in the browser [ ]

**Owner**: test-engineer
**Goal**: UIP-06 and UIP-07 hold in Chrome: no element of the board is rebuilt and no button dims; the fake backend learns `levels`.
**Where**: `game/e2e/uiPolishTalents.spec.js` (new)
**Files**:
- Also changes: `game/e2e/support/fakeBackend.js` (talent contract `:206-245`, `handleTalents` `:528-564`, the options comment `:259-270`, the returned controls `:1170-1236`)
- Read first: spec UIP-06 to UIP-08; `fakeBackend.js` `holdTeam` and `failNextTeamRequest` (`:288-292`, `:733-740`, `:1209-1223`) as the pattern; `game/e2e/talents.spec.js` (whole)
**Depends on**: T11
**Requirement**: UIP-06, UIP-07, UIP-08

**Fake backend contract** (`fakeBackend.js`):

- `handleTalents` becomes `async`. On `POST /talents/{id}/upgrade`: record `{ id, body: { ...body } }` in `talentUpgrades` first; then `await talentHold` when set; then `talentFailure` (answer that problem once and clear it); then the checks: `fromLevel` as today; `levels`: `undefined` or `null` -> 1; when the option `talentLevels` is `false` -> 1 whatever was sent (a backend without the feature); a non-integer -> 400 `INVALID_TALENT_REQUEST` detail `levels must be an integer`; below 1 or above `maxLevel` -> 400 detail `levels must be an integer between 1 and <maxLevel>`; mismatch, locked, `level >= maxLevel` as today; `level + n > maxLevel` -> 409 `TALENT_MAX_LEVEL`; `available < n x cost` -> 409 `NOT_ENOUGH_TALENT_POINTS`; then `levels[id] = level + n`.
- On `POST /talents/reset`: count it in `talentResets`, `await talentHold` when set, then `talentFailure`, then as today.
- New option `talentLevels` (default `true`), documented in the options comment.
- New controls: `talentUpgrades: () => [ ...talentUpgrades ]`, `talentResets: () => talentResets`, `holdTalents: () => release` (holds every upgrade and reset until `release()`, as `holdTeam`), `failNextTalentRequest: ({ status = 500, code } = {})`, `grantTalentPoints: (username, points)` (adds `points` to what `earnedOf(username)` answers).

**Scenarios** (`marks` = `page.evaluate` stores `window.__marks = { board: <.talent-tree-image>, node: <talent-COMBO>, card: <talent-detail>, icon: <talent-detail-icon img> }` and starts `window.__removedImages = 0` with a `MutationObserver` on `talent-screen` (`childList`, `subtree`) that adds every removed `IMG` and every `IMG` inside a removed node; `same()` = an object of `===` checks against the current elements):

`describe('Talentos in place (UIP-06)')`:
1. `a level bought keeps the board, the nodes, the card and its icon, and removes no image`: `talentPoints` 2; pick `COMBO`; marks; click `talent-upgrade-COMBO`; `talent-level-COMBO` `Nível 1/10`; every `same()` check true; `__removedImages` 0.
2. `the answer shows the values a fresh open shows`: after scenario 1's purchase: `talent-node-level-COMBO` `1/10`, `talent-COMBO` `data-state` `available`, `aria-label` `Limite de dano do combo, nível 1 de 10`, `talent-points` `Pontos de talento: 1`, `talent-effect-COMBO` `Efeito: +5%`, `talent-upgrade-COMBO` `Melhorar (1 ponto)` enabled, `talent-reset` enabled; close, open Talentos, pick `COMBO`: the same seven values.
3. `choosing another node replaces only the card`: marks; read `n` = the number of `img` inside `talent-detail`; pick `CLICK_DAMAGE`; board and `talent-COMBO` same, card not same, `__removedImages` equal to `n` (only the old card's images).
4. `clicking the selected node again keeps the card`: pick `COMBO` twice; card same; `__removedImages` 0.
5. `Reiniciar pontos keeps the board and locks the grades again`: `talents: { COMBO: 10, COMBO_G2: 1 }`, `talentPoints` 0; pick `COMBO`; marks; reset; `talent-points` `Pontos de talento: 12`; board and nodes same; `talent-COMBO_G2` `data-state` `locked` with one `.talent-node-lock`.
6. `a node that opens loses its lock and keeps its art`: `talents: { COMBO: 9 }`, `talentPoints` 1; keep `talent-COMBO_G2 .talent-node-frame` and `.talent-node-icon`; buy COMBO; `talent-COMBO_G2` has no `.talent-node-lock`, `data-state` `open`, frame and icon same.
7. `the button becoming Nível máximo replaces only the action`: same start; keep `talent-detail-name`, `talent-level-COMBO`, `talent-detail-icon`; buy; `talent-max-COMBO` `Nível máximo`; kept elements same.
8. `points paid while Talentos is open keep the board`: marks; `fake.grantTalentPoints('yan', 3)`; `page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.showTalentPoints())`; `Pontos de talento: 3`; `same()` true; `__removedImages` 0.
9. `a refused upgrade keeps the board and says why`: `failNextTalentRequest({ status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' })`; buy; `.hero-error` `Pontos de talento insuficientes`; board and nodes same.
10. `opening Talentos again starts with no node selected`: after a purchase, close and open; `talent-detail-empty` `Escolha um talento na árvore para ver os detalhes.`

`describe('No dimming (UIP-07)')`:
11. `while a level request runs both buttons keep their look and say wait`: `talents: { COMBO: 1 }`, `talentPoints` 2; pick `COMBO`; `release = fake.holdTalents()`; click buy; `talent-upgrade-COMBO` `aria-disabled` `true`, `toHaveCSS('opacity', '1')`, `toHaveCSS('cursor', 'progress')`; `talent-reset` the same three.
12. `clicks while it runs send nothing`: click buy and reset again; `fake.talentUpgrades()` length 1, `fake.talentResets()` 0.
13. `after the answer the buttons take clicks again`: `release()`; `talent-level-COMBO` `Nível 2/10`; `aria-disabled` `false` on both; `talent-upgrade-COMBO` `cursor` `pointer`.
14. `while Reiniciar pontos runs both buttons keep their look`: hold, click reset; the same three values on both buttons.
15. `the card button dims only when the points do not pay a level`: 0 points; `talent-upgrade-COMBO` disabled, `toHaveCSS('opacity', '0.45')`.

**Tests**: e2e
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/uiPolishTalents.spec.js e2e/talents.spec.js e2e/talentTreeRework.spec.js e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js e2e/earlyGameRebalanceTalents.spec.js`
**Done when**:

- [ ] The 15 scenarios pass; the five existing talent files pass unchanged.

**Commit**: `test(game): pin the in-place Talentos screen in the browser`

---

#### T13: The Shift purchase in the browser [ ]

**Owner**: test-engineer
**Goal**: UIP-09, UIP-10 and UIP-11 hold in Chrome with E1 to E7 and the exact bodies sent.
**Where**: `game/e2e/uiPolishShift.spec.js` (new)
**Files**:
- Read first: spec UIP-09 to UIP-11 and the Examples table; the fake backend controls of T12; `game/e2e/uiPolishTalents.spec.js` (start and helpers)
**Depends on**: T12
**Requirement**: UIP-09, UIP-10, UIP-11

**Scenarios** (`button = page.getByTestId('talent-upgrade-<id>')`):

`describe('Shift buys the most (UIP-09)')`:
1. `E1: Shift shows Melhorar até o nível 5 (5 pontos) with the gold ring`: COMBO 0, 5 points, pick `COMBO`; `keyboard.down('Shift')`; text; `data-max` `true`; `toHaveCSS('box-shadow', 'rgb(224, 180, 90) 0px 0px 0px 2px')`.
2. `E1: releasing Shift brings back Melhorar (1 ponto) on the same button`: mark the button element; `keyboard.up('Shift')`; text `Melhorar (1 ponto)`; `data-max` `false`; `box-shadow` `none`; the element is the marked one.
3. `E1: a Shift click buys 5 levels with one request`: down Shift, click; `fake.talentUpgrades()` `[ { id: 'COMBO', body: { fromLevel: 0, levels: 5 } } ]`; `Nível 5/10`, `Efeito: +25%`, `Pontos de talento: 0`, button disabled and, Shift still held, text `Melhorar (1 ponto)` (Edge 3).
4. `a click with the Shift modifier buys the same`: `button.click({ modifiers: [ 'Shift' ] })` -> body `{ fromLevel: 0, levels: 5 }`.
5. `E2: the top level stops the purchase`: CLICK_DAMAGE 7, 20 points; label `Melhorar até o nível 10 (3 pontos)`; click -> body `{ fromLevel: 7, levels: 3 }`, `Nível máximo`, `Pontos de talento: 17`.
6. `E3: a grade 2 talent buys 2 levels for 4`: COMBO 10, 5 points, `COMBO_G2` -> `Melhorar até o nível 2 (4 pontos)`; click -> body `{ fromLevel: 0, levels: 2 }`, `Nível 2/10`, `Pontos de talento: 1`, disabled.
7. `E4: no affordable level keeps Melhorar (2 pontos), disabled, without the ring`: COMBO 10, 1 point, `COMBO_G2`.
8. `E5: one affordable level sends only fromLevel`: COMBO 0, 1 point -> `Melhorar até o nível 1 (1 ponto)`; click -> body `{ fromLevel: 0 }` (no `levels` key).
9. `E6: Fúria crescente buys its 4 levels`: COMBO 10, 9 points, `COMBO_FURY` -> `Melhorar até o nível 4 (8 pontos)`; click -> body `{ fromLevel: 0, levels: 4 }`, `Nível máximo`, `Pontos de talento: 1`.
10. `E7: the longest text fits on one line`: CLICK_DAMAGE 10, CLICK_DAMAGE_G2 10, 30 points, `CLICK_DAMAGE_G3`; Shift -> `Melhorar até o nível 10 (30 pontos)`; `scrollWidth <= clientWidth`; its height equals the height read before Shift.
11. `a click without Shift buys one level`: 5 points -> body `{ fromLevel: 0 }`, `Nível 1/10`.
12. `a backend without levels buys one level and shows no error` (Q19): option `talentLevels: false`; Shift click with 5 points -> `Nível 1/10`, `Pontos de talento: 4`, `.hero-error` hidden.
13. `a refused Shift purchase says why`: `failNextTalentRequest({ status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' })` -> `Pontos de talento insuficientes`.
14. `a second Shift click while the request runs sends nothing`: hold; two Shift clicks; one recorded upgrade; release.
15. `Shift keeps the lock text and Nível máximo`: COMBO 5, `COMBO_G2` -> `talent-locked-COMBO_G2` visible, no button; CLICK_DAMAGE 10 -> `Nível máximo`.

`describe('The Shift mode (UIP-10)')`:
16. `leaving the window ends the Shift mode`: down Shift; `page.evaluate(() => window.dispatchEvent(new Event('blur')))`; text `Melhorar (1 ponto)`; a plain `button.click()` sends `{ fromLevel: 0 }`.
17. `a hidden tab ends the Shift mode`: down Shift; `page.evaluate` defines `document.visibilityState` as `'hidden'` (`Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })`) and dispatches `visibilitychange`; text `Melhorar (1 ponto)`.
18. `a pointer move with Shift turns it on`: COMBO 0, 5 points, pick `COMBO`; down Shift, blur as in 16, `keyboard.up('Shift')`; text `Melhorar (1 ponto)`; `page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove', { shiftKey: true })))` -> `Melhorar até o nível 5 (5 pontos)`.
19. `Shift held, choosing another talent shows its Shift text`: down Shift, pick `CLICK_DAMAGE` -> `Melhorar até o nível 5 (5 pontos)`.

`describe('The hint (UIP-11)')`:
20. `the button carries Segure Shift para melhorar até o máximo with and without Shift`: `toHaveAttribute('title', 'Segure Shift para melhorar até o máximo')` before and while Shift is held.

**Tests**: e2e
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/uiPolishShift.spec.js`
**Done when**:

- [ ] The 20 scenarios pass with the exact texts and bodies above.

**Commit**: `test(game): pin the Shift talent purchase in the browser`

---

#### T14: Existing browser tests open the leader list from Equipe [ ]

**Owner**: test-engineer
**Goal**: Every e2e test and review shot that opened Líder or listed `hud-leader` uses Equipe instead, keeping every value it asserts (UIP-13 AC 1, 4, 5, 9).
**Where**: `game/e2e/support/leader.js` (new)
**Files**:
- Also changes (only the tests named below): `game/e2e/heroBagCards.spec.js`, `game/e2e/heroTeam.spec.js`, `game/e2e/uiRedesign.spec.js`, `game/e2e/heroes.spec.js`, `game/e2e/heroTeamCombat.spec.js`, `game/e2e/talentTreeReworkCombat.spec.js`, `game/ui-review/uiRedesign.shots.js`
- Read first: spec UIP-13; each named test; `git grep -n "hud-leader\|leader-entry" -- game/e2e game/ui-review` (run it again before editing: the list drifts)
**Depends on**: T13
**Requirement**: UIP-13

**Contract**: `leader.js` exports `openLeaderList(page)`: click `hud-team`; expect `team-screen` visible; click `team-slot-0`; expect `leader-list` visible. It imports `expect` from `@playwright/test`.

**Re-pins** (by test name; every other assertion of the test stays as it is):

1. `heroBagCards.spec.js` `the rail has six buttons and no Fusão`: ids `[ 'hud-heroes', 'hud-bag', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm' ]`.
2. `heroTeam.spec.js` `the Equipe button is absent before the chapter 5 boss is won and the rail keeps six buttons` -> renamed `the Equipe button is in the rail before the chapter 5 boss is won and the rail keeps six buttons`; `hud-team` `toHaveCount(1)`; 6 buttons.
3. `heroTeam.spec.js` `the Equipe button sits right after Líder once the chapter 5 boss is won and the rail stays above the battle bar` -> renamed `the Equipe button sits right after Mochila once the chapter 5 boss is won and the rail stays above the battle bar`; ids `[ 'hud-heroes', 'hud-bag', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm' ]`; the icon and rail box assertions kept.
4. `heroTeam.spec.js` `winning the chapter 5 boss shows the Equipe button without a reload` -> renamed `winning the chapter 5 boss makes slot 1 buyable without a reload`; before the win `hud-team` is visible and, in Equipe, `team-slot-1` has `data-state` `locked` (close the window before clicking the canvas); after the win, open Equipe: `team-slot-1` `data-state` `buyable`; `window.__sameDocument` true.
5. `uiRedesign.spec.js` `adds no animation or transition to buttons, rail and timer`: the list reads `hud-team` in place of `hud-leader`.
6. `uiRedesign.spec.js` `draws the rail as framed wood squares on parchment`: `[ 'hud-team', 'Equipe' ]` in place of `[ 'hud-leader', 'Líder' ]`, third in the list.
7. `uiRedesign.spec.js` `shows the whole leader name in the battle card for each of the five heroes`: `openLeaderList(page)` in place of `openScreen(page, 'leader')`; the comment reads `The leader list stays open after a pick`.
8. `uiRedesign.spec.js` `draws every inner card on the inset recipe`: the Líder step uses `openLeaderList(page)`; its comment reads `Equipe leader list: a row that is not the current one`.
9. `uiRedesign.spec.js` `draws the Líder rows in dark ink, the current one too` -> renamed `draws the leader list rows in dark ink, the current one too`; `openLeaderList(page)`; colours and sizes unchanged.
10. `heroes.spec.js` `the leader picker changes the leader and the skill bar shows the skills of the new one`: `openLeaderList(page)` in place of the `hud-leader` click.
11. `heroTeamCombat.spec.js` `an ally hit uses the new leader's element after a leader change`: the same.
12. `talentTreeReworkCombat.spec.js` `the chip follows a leader change: 10% for a blank Kael, 40% for a 3-star Lyra`: the same.
13. `ui-review/uiRedesign.shots.js` `hero screens`: the Líder shot uses `openLeaderList(page)` (imported from `../e2e/support/leader`); the shot keeps its file name.

**Tests**: e2e
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/heroBagCards.spec.js e2e/heroTeam.spec.js e2e/uiRedesign.spec.js e2e/heroes.spec.js e2e/heroTeamCombat.spec.js e2e/talentTreeReworkCombat.spec.js`
**Done when**:

- [ ] The six files pass; `git grep -n "hud-leader\|openScreen(page, 'leader')" -- game/e2e game/ui-review` prints nothing.
- [ ] `uiRedesign.spec.js` `shows no magenta in the detail of any of the five heroes` (STATE Handoff note 2) is split into one test per hero or marked `test.slow()` in this task, without changing an asserted value, because this task touches the file.

**Commit**: `test(game): open the leader list from Equipe in the browser tests`

---

#### T15: The HUD keys and the Equipe leader list in the browser [ ]

**Owner**: test-engineer
**Goal**: UIP-12, UIP-13 and UIP-14 hold in Chrome.
**Where**: `game/e2e/uiPolishHud.spec.js` (new)
**Files**:
- Read first: spec UIP-12 to UIP-14; `game/e2e/support/leader.js`; `game/e2e/heroTeam.spec.js` (`startTeam`, `openTeam`); `game/e2e/uiRedesign.spec.js` (the A key tests near `:1173` and `:1247`); `game/e2e/support/fakeBackend.js` `failNextTeamRequest`
**Depends on**: T14
**Requirement**: UIP-12, UIP-13, UIP-14

**Scenarios** (keys with `page.keyboard.press`; before a key, blur the focused element unless the scenario types in a field):

`describe('T and B (UIP-12)')`:
1. `t opens Talentos and t again closes it`: `.hero-window` visible with class `is-talents`; `.hero-panel` hidden after the second press.
2. `b opens Mochila and b again closes it`: `.hero-title` `Mochila`; then hidden.
3. `b closes Mochila from a hero detail`: open Mochila, click `bag-card-kael`, `b` -> panel hidden.
4. `t over Mochila shows Talentos`: `b`, `t` -> `.hero-window` has `is-talents`.
5. `Control+b, Alt+t and Shift+T do nothing`: the panel stays hidden after each.
6. `a held t opens Talentos once`: `keyboard.down('t')`, wait 600 ms, `keyboard.up('t')` -> open (the auto-repeat does not close it).
7. `t typed in the username field types a t`: start screen; click `menu.username`, press `t` -> the field value `t`.
8. `t does nothing while the pause menu is open`: `Escape`, `t` -> `.pause-menu` visible, `.hero-panel` hidden.
9. `t closes the auto click window and opens Talentos`: chapter 2; `a` opens `auto-click-popover`; `t` -> popover hidden, Talentos open.
10. `the keys show on their buttons`: `hud-key-talents` `T`, `hud-key-bag` `B`; on `hud-key-talents` `toHaveCSS` `font-size` `10px`, `color` `rgb(243, 213, 138)`, `background-color` `rgb(28, 18, 12)`, `border-top-color` `rgb(224, 180, 90)`; `hud-talents` `toHaveAttribute('aria-keyshortcuts', 'T')`; with 3 talent points the chip box lies inside the `hud-talents` box and does not intersect the `talents-badge` box.
11. `Shift held on Talentos and T keeps Talentos open`: open Talentos, `keyboard.down('Shift')`, `keyboard.press('T')`, `keyboard.up('Shift')` -> still open.

`describe('Ctrl+A and the auto click (UIP-14)')`:
12. `Control+a on the battle screen leaves the auto click window closed`: chapter 2; `Control+a` -> `auto-click-popover` hidden; a plain `a` then opens it.

`describe('Equipe replaces Líder (UIP-13)')`:
13. `the rail reads Heróis, Mochila, Equipe, Equipamento, Talentos, Rever chefes in chapter 1`: ids and texts in that order; `hud-leader` count 0.
14. `a chapter 1 player changes the leader from Equipe`: copies `kael:0`, `lyra:1`; click `hud-team`; `team-slot-1` to `team-slot-4` `data-state` `locked`; `team-status` `A equipe luta a partir do capítulo 5.`; `team-leader-change` `Trocar líder`; click `team-slot-0`; `leader-picker h3` `Escolher líder`; `.hero-title` `Equipe`; click `leader-entry-lyra` -> it has `is-current`, the list is still shown, `skill-slot-1 img` `src` `assets/heroes/lyra_double_shot.jpg`.
15. `Voltar shows the new leader card`: then `hero-back` -> `team-slot-0 .team-name` `Lyra Folhaveloz`.
16. `a refused change says why`: `failNextTeamRequest({ status: 500 })` before the pick -> `.hero-error` `Não foi possível trocar o líder.`; `leader-entry-kael` keeps `is-current`.
17. `a new leader taken from an ally slot puts the old one there`: chapter 5 cleared, `team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }`; leader list, pick `lyra`, `hero-back` -> `team-slot-0 .team-name` `Lyra Folhaveloz`, `team-slot-1 .team-name` `Kael Raizférrea`.
18. `Tornar líder still works`: the same start; click `team-slot-1`, `team-make-leader` -> `team-slot-0 .team-name` `Lyra Folhaveloz`.

**Tests**: e2e
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/uiPolishHud.spec.js`
**Done when**:

- [ ] The 18 scenarios pass with the exact values above.

**Commit**: `test(game): pin the HUD keys and the Equipe leader list in the browser`

---

#### T16: Author check of the UI polish [ ]

**Owner**: test-engineer
**Goal**: Every AC and edge case of the spec maps to an exact assertion and the riskiest code kills its mutants (the feature's test gate).
**Where**: `.specs/features/ui-polish/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T15, `scripts/sensor.mjs` (usage at its top)
**Depends on**: T15
**Requirement**: UIP-01 to UIP-14

**Steps**:

1. Build the AC to assertion table (unit and e2e columns, `file:line`, exact value) as in `.specs/features/tech-debt-polish/tasks.md` § Author check, including the Edge Cases and E1 to E7.
2. Write a scratch `mutants.json` (not committed) and run `node scripts/sensor.mjs mutants.json` with at least: (M1) `maxPurchase` without `Math.floor` (E3 must fail); (M2) `maxPurchase` without the `maxLevel - level` bound (E2); (M3) `updateTalents` skipping the level chip write; (M4) `updateTalents` rebuilding the card on every call (identity tests); (M5) `shiftKey.js` without the `blur` listener; (M6) `patchUpgradeButton` setting `disabled = busy || ...`; (M7) `PlayerTalents.upgrade` without the `stored + count > maxLevel` check (backend `TalentsTest`); (M8) `style.css` `user-select: none` removed from `body`; (M9) `.talent-upgrade[data-max="true"]` ring `1px`; (M10) `screenKey` without `hasModifier` (Ctrl+B opens Mochila); (M11) `HeroUi.toggle` always calling `show` (T does not close); (M12) `renderLeaderCard` without the `onLeader` click (the chapter 1 leader change fails); (M13) `.hud-key` `font-size: 12px`.
3. Append § Author check with the table, the mutant results and the suite totals; any surviving mutant or AC without an exact assertion becomes a fix task listed there with its owner.

**Tests**: e2e + unit (runs the suites, writes no production code)
**Gate**: `cd backend && ./gradlew test` then `cd game && npm test && npx playwright test e2e/uiPolishPage.spec.js e2e/uiPolishTalents.spec.js e2e/uiPolishShift.spec.js e2e/uiPolishHud.spec.js`
**Done when**:

- [ ] Every AC and edge case maps to a test; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the ui polish`

---

### Phase 4: UI review

#### T17: UI review of the page guards, the in-place tree, the Shift button, the HUD keys and the Equipe leader list [ ]

**Owner**: ui-artist
**Goal**: The Shift button reads well and fits, the card does not dim while a request runs, the key chips and the Equipe leader card read well, and nothing else on the start screen, the battle, Talentos and Equipe changed look (UIP-01, UIP-04, UIP-06, UIP-07, UIP-09, UIP-11, UIP-12, UIP-13).
**Where**: `game/ui-review/uiPolish.shots.js` (new)
**Files**:
- Also creates: `.specs/features/ui-polish/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/ui-polish/ui-review/*.png`
- Read first: `game/ui-review/talentTreeRework.shots.js` (Talentos start and the wait for the icons), `game/ui-review/techDebtPolish.shots.js` (start), `game/ui-review/support/`, spec § Player-Facing Texts, Q8, Q11 to Q13, Q16
**Depends on**: T16
**Requirement**: UIP-01, UIP-04, UIP-06, UIP-07, UIP-09, UIP-11, UIP-12, UIP-13

**Shots** (desktop 1280 x 720 only; Talentos shots wait until every icon of the board has loaded):

- `01-card-normal`: COMBO 0, 5 points, COMBO selected: `Melhorar (1 ponto)`.
- `02-card-shift`: the same with Shift held: `Melhorar até o nível 5 (5 pontos)` with the 2 px `#e0b45a` ring.
- `03-card-shift-longest`: CLICK_DAMAGE_G3 with 30 points and Shift: `Melhorar até o nível 10 (30 pontos)`.
- `04-card-shift-unaffordable`: COMBO_G2 with 1 point and Shift: `Melhorar (2 pontos)`, disabled, no ring.
- `05-card-busy`: COMBO 1, 2 points, the upgrade held by `holdTalents`: both buttons undimmed.
- `06-after-shift-purchase`: E1 after the answer, taken one animation frame after the level text changes (`page.evaluate(() => new Promise(requestAnimationFrame))`): the board, the 28 nodes and their icons drawn.
- `07-start-ctrl-a`: the start screen after Ctrl+A with the focus outside the fields: no selection colour.
- `08-battle-ctrl-a`: the battle screen after Ctrl+A: no selection colour.
- `09-username-selected`: `yan` typed and selected with Ctrl+A: only the field is highlighted.
- `10-rail-keys`: the six-button rail in chapter 1 with 3 talent points: chips `B` on Mochila and `T` on Talentos, the red dot with `3` on Talentos, Equipe third.
- `11-equipe-chapter-1`: Equipe of a chapter 1 player: the leader card with `Trocar líder`, four locked slots, the status line.
- `12-leader-list`: the leader list under `Escolher líder` with `Voltar`, Kael current, Lyra not.
- `13-equipe-after-pick`: Equipe after picking Lyra and `Voltar`: Lyra on the leader card.
- `14-equipe-chapter-5`: Equipe of a chapter 5 player with Lyra in slot 1 (compare with `.specs/features/hero-team/ui-review/` for any other change).

**Check against**: spec UIP-09 AC 1, 6, 10 (texts T1 and T2, one line, ring `rgb(224, 180, 90)` 2 px on the `--branch-ink` button over `--parchment-100`); UIP-07 AC 1 (shot 05 has no dimmed button); UIP-06 (shot 06 shows no empty node or bare gradient board); UIP-01 (shots 07 to 09); UIP-12 AC 10 (shot 10: chip 16 px high, Cinzel 10 px `#f3d58a` on `#1c120c` with a `#e0b45a` border, inside the button, clear of the red dot and of the icon); UIP-13 (shots 11 to 14: the leader card reads as a button, `Trocar líder` 11 px 800 `--color-accent-800` underlined, text contrast at least 4.5:1 on the slot background). The gold ring must read against the parchment of the card (contrast at least 3:1 for a non-text UI part, WCAG 1.4.11); write the measured ratio. Compare shots 01 and 06 with `.specs/features/talent-tree-rework/ui-review/` for any other change.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- uiPolish`
**Done when**:

- [ ] `ui-review.html` lists the 14 shots with `APROVADO`, or each finding as a new task in this file with its owner.

**Commit**: `docs(ui): review the ui polish`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | One domain method, one validator, two exception texts | ✅ Granular (cohesive, one file pair) |
| T2 | One endpoint parameter through use case, service and controller, plus its ADR | ✅ Granular (one endpoint) |
| T3 | One module, its mount and its CSS block | ✅ Granular |
| T4 | Two pure functions | ✅ Granular |
| T5 | One argument through the gateway and the collection | ✅ Granular |
| T6 | One module | ✅ Granular |
| T7 | One view file (patch, button, busy) and its CSS | ⚠️ OK, cohesive (one file) |
| T8 | One adapter class and one line of its scene | ✅ Granular |
| T9 | The rail entry, the leader card and its sub-view (one screen) | ⚠️ OK, cohesive |
| T10 | Two key handlers, one toggle and one chip | ✅ Granular |
| T11 to T13, T15 | One e2e file each (T12 with its fake backend support) | ✅ Granular |
| T14 | Re-pins of named tests, one helper | ✅ Granular (no new behaviour) |
| T16, T17 | Check and review | ✅ |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | Phase 2, no arrow | ✅ Match |
| T4 | None | Phase 2 start of two chains | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None | Phase 2, start of T6 → T8 | ✅ Match |
| T7 | T4 | T4 → T7 | ✅ Match |
| T8 | T5, T6, T7 | T5 → T8, T6 → T8, T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9, T3 | T9 → T10, T3 → T10 | ✅ Match |
| T11 | T3, T10 (phase 2) | Phase 3 start | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 (phase 3) | Phase 4 | ✅ Match |

No game task needs T1 or T2 to pass its gate: the e2e tests run against the fake backend of T12. Production needs T2 live for a Shift purchase to buy more than one level; until then it buys one (Q19).

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend service and web | unit + integration | unit + integration | ✅ OK |
| T3 | Game adapter + CSS | unit (+ e2e in T11 for CSS) | unit | ✅ OK (the CSS has no unit layer; its e2e is T11, the browser being the only place CSS applies) |
| T4 | Game domain | unit | unit | ✅ OK |
| T5 | Game application + http | unit | unit | ✅ OK |
| T6 | Game adapter | unit | unit | ✅ OK |
| T7 | Game adapter view + CSS | unit (+ e2e in T12, T13) | unit | ✅ OK |
| T8 | Game adapter | unit | unit | ✅ OK |
| T9 | Game adapter view + CSS | unit (+ e2e in T14, T15) | unit | ✅ OK |
| T10 | Game scene + adapter + CSS | unit (+ e2e in T15) | unit | ✅ OK |
| T11 to T15 | E2E (+ fake backend in T12, helper in T14) | e2e | e2e | ✅ OK |
| T16 | check | - | e2e + unit runs | ✅ OK |
| T17 | UI review artifact | none | none | ✅ OK |

---

## Author Check

(Appended by T16.)
