# Hero Ascension Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/hero-ascension/spec.md`
**Design**: `.specs/features/hero-ascension/design.md`
**Status**: Ready for the owner's approval of the tasks (scope decided 2026-10-31: cap 9, one skill per star, cards only, drop rates unchanged, purple then gold)

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root. `<main>` is `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `<test>` is `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`PROMPTS_ASSETS_UI.md`, `game/src/adapters/phaser/...`, `game/src/domain/talents/...`, `game/e2e/farm.spec.js`, `game/e2e/talents.spec.js`, `art/`, `game/public/assets/...`, `.idea/`, `.vscode/`). If a file you must change is already modified by the owner, STOP and report it; do not commit their edits.
- Mark the task `[x]` in this file in the same commit.
- Push right after the commit (`CLAUDE.md`).
- A test that pinned the 3-star cap is updated to the new value and renamed after the new behaviour, exactly as the task says (L-054). Never delete or weaken any other test to pass a gate.
- Decimal expectations use `toBeCloseTo(value, 9)` (Vitest) or `assertEquals(expected, actual, 1e-9)` (Kotlin), per the spec (L-012).
- The level of the skill in slot n of a hero with s stars is `s < n ? 0 : 1 + floor((s - n) / 3)`. Levels by stars (slots 1, 2, 3): 3★ `[1, 1, 1]`, 4★ `[2, 1, 1]`, 5★ `[2, 2, 1]`, 6★ `[2, 2, 2]`, 7★ `[3, 2, 2]`, 8★ `[3, 3, 2]`, 9★ `[3, 3, 3]`. Every test below follows this table.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), the agent rules in `CLAUDE.md` (unit for service/domain, e2e for every player-visible behaviour). No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`PlayerCards`, `HeroView`) | unit | Every bound of the stars and fusion ranges, the level of every slot at stars 0 to 9 | `<test>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`HeroService`) | unit | Copies 0 to 9, fusion of 3 to 8 stars, invalid stars | `<test>/service/HeroServiceTest.kt` | `cd backend && ./gradlew test` |
| Backend repository and web | integration (Testcontainers) | 9-star round trip; every fusion status (200, 400, 409); race; wallet, leader and reset untouched | `<test>/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain | unit | Every number of the Star Bonus rows 4 to 9 and of the Skill Levels table; every value that must not scale | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game views and scene | unit (jsdom) | Every exact text, class, attribute and test id of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| Game CSS | none | Checked by the e2e computed colours (T16) and the `ui-artist` review (T17) | `game/public/style.css` | build gate |
| e2e | e2e (Playwright, fake backend) | Every player-visible acceptance criterion of ASC-06, ASC-07, ASC-08 and one per ASC-03 | `game/e2e/heroAscension.spec.js` | `cd game && npx playwright test e2e/heroAscension.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After game tasks with unit tests only | `cd game && npm test` |
| Full | After backend tasks and e2e tasks | backend: `cd backend && ./gradlew ktlintCheck test`; game: `cd game && npm test && npx playwright test` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Backend step A (Phase 1) must be live before step B (Phase 2) is pushed, and the game (Phases 3 to 5) ships after step B (design, Deploy Order).

### Phase 1: Backend reads 0 to 9 stars (deploy step A)

```
T1 → T2
```

### Phase 2: Backend opens the fusions of 3 to 8 stars (deploy step B)

```
T2 → T3
```

### Phase 3: Game domain rules

```
T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 4: Game scene, views and style

```
T8 → T10 → T11 → T12 → T13 → T14 → T9 (T9 deferred: it waits for the owner's ClickerGame.js edits; T10-T14 do not need its code, so it runs after T14)
```

### Phase 5: e2e

```
T14 → T15 → T16
```

### Phase 6: Visual review

```
T16 → T17
```

---

## Task Breakdown

### T1: Store copies of 0 to 9 stars, fusion still capped at 2 [x]

**Owner**: kotlin-backend-dev
**What**: Raise the stored stars range to 0 to 9 and give the fusion its own cap, still 2, so this deploy reads 4 to 9 star copies before any can be written (ASC-01 AC 1, 2; design Deploy Order step A).
**Where**: `<main>/domain/PlayerCards.kt`
**Also changes**: `<test>/domain/PlayerCardsTest.kt`, `<test>/adapter/repository/PlayerCardsRepositoryIT.kt`, `<test>/service/HeroServiceTest.kt`, `<test>/adapter/web/HeroControllerIT.kt`
**Read first**: `PlayerCards.kt` (whole file, 86 lines), `<main>/domain/HeroView.kt:29` (copies use `MAX_STARS`, so they become 0 to 9 with no edit there), `PlayerCardsTest.kt:1-112`, `PlayerCardsRepositoryIT.kt:15-43`, `HeroServiceTest.kt:59-103`
**Depends on**: None
**Requirement**: ASC-01

**Contract**:

```kotlin
// PlayerCards.kt, companion object
const val FUSION_SIZE = 3
const val MAX_STARS = 9
/** The highest stars a fusion takes: 2 until hero-ascension T3 opens the fusions of 3 to 8 stars. */
const val LAST_FUSIBLE_STARS = 2

// fuse(): the first line becomes
if (stars !in 0..LAST_FUSIBLE_STARS) throw InvalidFusionException("stars $stars cannot be fused")
```

The `init` check (`stars in 0..MAX_STARS`) stays as written; it now allows 0 to 9. The KDoc of `CopyKey` (line 5) becomes `[stars] 0 is a blank card, 9 the best a hero can reach.`

**Steps**:

1. In `PlayerCards.kt` set `MAX_STARS = 9` and add `LAST_FUSIBLE_STARS = 2` with the KDoc above.
2. Replace `if (stars !in 0 until MAX_STARS)` with `if (stars !in 0..LAST_FUSIBLE_STARS)`.
3. Update the `CopyKey` KDoc.
4. In `HeroServiceTest.kt` add `4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0` to the four copy maps at lines 64, 67, 71 and 102, and rename `list reports copies per stars 0 to 3, ownership and stars` to `list reports copies per stars 0 to 9, ownership and stars`. Change nothing else in that file.
5. In `HeroControllerIT.kt` (test `GET heroes answers the five heroes...`, line 75) add `.body("heroes[2].copies.9", equalTo(0))` after the `copies.3` line.
6. Write the test cases below.
7. If any other test fails only because a copies map now has the keys 4 to 9, add those keys with 0 and nothing else; list each such file in the commit body.

**Tests**: unit + integration
**Test cases**:

- `PlayerCardsTest` - `cards of 4 to 9 stars are kept and the stars of the hero are the highest`: `PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 3) to 1, CopyKey("kael", 9) to 2))` gives `starsOf("kael") == 9` and `copiesOf("kael", 9) == 2`.
- `PlayerCardsTest` - `a card of 10 stars or of negative stars is rejected`: building `PlayerCards` with `CopyKey("kael", 10) to 1` throws `IllegalArgumentException`, and with `CopyKey("kael", -1) to 1` too.
- `PlayerCardsTest` - `a four-star card cannot be fused yet`: `holding(stars = 4, count = 3).fuse("kael", 4)` throws `InvalidFusionException`. (The existing `a three-star card cannot be fused` and `stars outside 0 to 2 are an invalid fusion` stay unchanged in this task.)
- `PlayerCardsRepositoryIT` - `a copy of 9 stars is saved and read back`: `cards(copies = mapOf(CopyKey("kael", 9) to 1, CopyKey("kael", 0) to 2))`, `repository.save`, then `repository.findForUpdate("yan")` equals the saved value and its `starsOf("kael")` is 9.
- `HeroServiceTest` - `list reports a 9 star hero with copies up to 9`: `player(extra = mapOf(CopyKey("kael", 9) to 1))`; the kael view has `stars == 9` and `copies == mapOf(0 to 1, 1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 1)`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The five new test cases pass; the renamed and extended tests pass; the whole backend suite passes.
- [x] `POST /heroes/kael/fuse` with `{"stars":3}` still answers 400 `INVALID_FUSION` (the existing `HeroControllerIT` case proves it).

**Commit**: `feat(backend): store hero cards of up to 9 stars`

---

### T2: Report the level of every skill [x]

**Owner**: kotlin-backend-dev
**What**: Add `level` to every skill of `GET /heroes` and of the fusion answer: 0 locked, else `1 + (stars - slot) / 3` (ASC-01 AC 3).
**Where**: `<main>/domain/HeroView.kt`
**Also changes**: `<main>/adapter/web/HeroController.kt`, `<test>/domain/HeroViewTest.kt` (new), `<test>/adapter/web/HeroControllerIT.kt`
**Read first**: `HeroView.kt` (whole file), `HeroController.kt:17-38` (`SkillResponse`), `HeroControllerIT.kt:20-100`, `<test>/domain/HeroTest.kt` (domain test style)
**Depends on**: T1
**Requirement**: ASC-01

**Contract**:

```kotlin
// HeroView.kt
/** A skill of a hero as one player sees it: unlocked when the hero has at least as many stars as the slot; [level] 0 to 3. */
data class SkillView(
    val skill: Skill,
    val unlocked: Boolean,
    val level: Int,
) {
    companion object {
        /**
         * 0 while locked; otherwise 1 + (stars - slot) / 3 (integer division): each star from 4 to 9 raises one skill in slot order
         * (4 slot 1, 5 slot 2, 6 slot 3, 7 slot 1, 8 slot 2, 9 slot 3), so a 9-star hero has every skill at level 3
         * (spec hero-ascension, Skill Levels).
         */
        fun levelOf(stars: Int, slot: Int): Int = if (stars < slot) 0 else 1 + (stars - slot) / 3
    }
}

// HeroView.of
skills = hero.skills.map { SkillView(it, unlocked = stars >= it.slot, level = SkillView.levelOf(stars, it.slot)) },

// HeroController.kt: SkillResponse gains `val level: Int` right after `val unlocked: Boolean`; `from(view)` sets `level = view.level`.
```

JSON: each skill object gains `"level": <int>`; nothing else changes.

**Steps**:

1. Add `level` and `levelOf` to `SkillView` as above.
2. Pass the level in `HeroView.of`.
3. Add `level` to `SkillResponse` and map it.
4. Fix every compile error in tests that build `SkillView(...)` with two arguments by adding `level = SkillView.levelOf(<stars of that test>, <slot>)`; change nothing else.
5. Write the test cases below.

**Tests**: unit + integration
**Test cases**:

- `HeroViewTest` (new, package `...domain`) - `a locked skill is level 0`: `levelOf(0, 1)`, `levelOf(1, 2)`, `levelOf(2, 3)` and `levelOf(0, 3)` are all 0.
- `HeroViewTest` - `an unlocked skill of a hero with 1 to 3 stars is level 1`: `levelOf(1, 1)`, `levelOf(2, 1)`, `levelOf(2, 2)`, `levelOf(3, 1)`, `levelOf(3, 2)` and `levelOf(3, 3)` are all 1.
- `HeroViewTest` - `each star from 4 to 9 raises one skill in slot order`: `(1..3).map { levelOf(stars, it) }` equals `listOf(2, 1, 1)` for 4, `listOf(2, 2, 1)` for 5, `listOf(2, 2, 2)` for 6, `listOf(3, 2, 2)` for 7, `listOf(3, 3, 2)` for 8 and `listOf(3, 3, 3)` for 9.
- `HeroViewTest` - `the view of a 5 star hero carries levels 2, 2 and 1`: `HeroView.of(HeroSeed.heroes().first { it.id == "kael" }, PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 5) to 1)))` gives `skills.map { it.level } == listOf(2, 2, 1)` and `skills.map { it.unlocked } == listOf(true, true, true)`.
- `HeroControllerIT` - `GET heroes answers the level of every skill`: `register()` (FIRE), `give("yan", "kael", 4, 1)`; `GET /heroes` answers `heroes[0].stars` 4, `heroes[0].copies.4` 1, `heroes[0].skills.level` `[2, 1, 1]`, `heroes[0].skills.unlocked` `[true, true, true]`, and `heroes[1].skills.level` `[0, 0, 0]` (Lyra, not owned).
- `HeroControllerIT` - `fuse answers the level of every skill`: `give("yan", "kael", 0, 3)`, fuse `{"stars":0}` answers `skills.level` `[1, 0, 0]`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The six test cases pass and the whole backend suite passes.
- [x] `git diff` touches no file under `backend/src/main/resources/db/migration`.

**Commit**: `feat(backend): answer the level of each hero skill`

---

### T3: Open the fusions of 3 to 8 stars [x]

**Owner**: kotlin-backend-dev
**What**: Let 3 copies of 3 to 8 stars fuse into 1 copy of the next stars (ASC-02, spec P1 "Fuse past 3 stars on the backend" AC 4 to 12).
**Where**: `<main>/domain/PlayerCards.kt`
**Also changes**: `<test>/domain/PlayerCardsTest.kt`, `<test>/service/HeroServiceTest.kt`, `<test>/adapter/web/HeroControllerIT.kt`, `<test>/adapter/web/AccountResetControllerIT.kt`
**Read first**: `PlayerCards.kt`, `PlayerCardsTest.kt:85-112`, `HeroServiceTest.kt:96-135`, `HeroControllerIT.kt:85-206` (fuse helpers and the race test at 182-206), `AccountResetControllerIT.kt:40-90` (setup, `atChapter`, `reset`)
**Depends on**: T2
**Requirement**: ASC-02

**Contract**: `const val LAST_FUSIBLE_STARS = 8`, KDoc `/** The highest stars a fusion takes: 3 copies of 8 stars make the 9-star card. */`. Nothing else in `main` changes. Status codes and error codes are the existing ones: 400 `INVALID_FUSION`, 409 `NOT_ENOUGH_CARDS`.

**Steps**:

1. Deploy precondition (design, Deploy Order). Run `git rev-parse HEAD` (the T2 commit) and read `active.commit` in `.deploy-state`. If `git merge-base --is-ancestor <T2 commit> <active.commit>` succeeds, go on. If not, wait and re-read every 60 s for up to 10 minutes. If `.deploy-state` does not exist or does not change in those 10 minutes (`publish.sh` is not running), go on and add the line `Deploy step A was not live before this commit: do not roll back past it.` to the commit body.
2. Set `LAST_FUSIBLE_STARS = 8` with the new KDoc.
3. `PlayerCardsTest`: replace the test `a three-star card cannot be fused` with `a nine-star card cannot be fused` (`holding(stars = 9, count = 5).fuse("kael", 9)` throws `InvalidFusionException`); rename `stars outside 0 to 2 are an invalid fusion` to `stars outside 0 to 8 are an invalid fusion` and make it assert `-1`, `9` and `10`; delete `a four-star card cannot be fused yet` (added in T1, its rule ends here).
4. `HeroServiceTest`: in `fuse with invalid stars leaves the bag unchanged` replace `service.fuse("yan", "kael", 3)` with `service.fuse("yan", "kael", 9)`.
5. `HeroControllerIT`: rename `fuse with stars missing, negative or three answers 400 INVALID_FUSION` to `fuse with stars missing, negative, nine or more, or a string answers 400 INVALID_FUSION`; `give("yan", "kael", 9, 5)`; bodies `{}`, `{"stars":-1}`, `{"stars":9}`, `{"stars":10}`, `{"stars":"0"}`.
6. Write the test cases below.

**Tests**: unit + integration
**Test cases**:

- `PlayerCardsTest` - `three three-star cards fuse into a four-star card`: `holding(3, 3).fuse("kael", 3).copies == mapOf(CopyKey("kael", 4) to 1)` and `starsOf("kael") == 4`.
- `PlayerCardsTest` - `three cards of every stars from 3 to 8 fuse into one card of the next stars`: for `s` in `3..8`, `holding(s, 3).fuse("kael", s)` has `copies == mapOf(CopyKey("kael", s + 1) to 1)` and `starsOf("kael") == s + 1`.
- `PlayerCardsTest` - `three eight-star cards fuse into a nine-star card`: `holding(8, 3).fuse("kael", 8).copies == mapOf(CopyKey("kael", 9) to 1)`, stars 9.
- `PlayerCardsTest` - `four three-star cards fuse once into one three-star and one four-star card`: `holding(3, 4).fuse("kael", 3).copies == mapOf(CopyKey("kael", 3) to 1, CopyKey("kael", 4) to 1)`.
- `PlayerCardsTest` - `fewer than three copies of 3 to 8 stars is not enough`: `holding(3, 2).fuse("kael", 3)` and `holding(8, 2).fuse("kael", 8)` throw `NotEnoughCardsException`.
- `PlayerCardsTest` - `a nine-star hero still fuses its blank cards and stays at nine stars`: `PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 9) to 1, CopyKey("kael", 0) to 3)).fuse("kael", 0)` gives `copiesOf("kael", 1) == 1`, `copiesOf("kael", 9) == 1`, `starsOf("kael") == 9`.
- `PlayerCardsTest` - `a dropped blank card leaves a nine-star hero at nine stars`: `holding(9, 1).add("kael")` gives `starsOf("kael") == 9` and `copiesOf("kael", 0) == 1`.
- `HeroServiceTest` - `fuse of three 3-star cards returns a 4-star hero with levels 2, 1 and 1`: `player(extra = mapOf(CopyKey("kael", 3) to 3))`, `service.fuse("yan", "kael", 3)` gives `stars == 4`, `copies == mapOf(0 to 1, 1 to 0, 2 to 0, 3 to 0, 4 to 1, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0)`, `skills.map { it.level } == listOf(2, 1, 1)`.
- `HeroControllerIT` - `fuse of three 3-star cards answers a 4-star hero with levels 2, 1 and 1`: `give("yan", "kael", 3, 3)`, fuse `{"stars":3}` answers 200, `stars` 4, `copies.3` 0, `copies.4` 1, `skills.level` `[2, 1, 1]`.
- `HeroControllerIT` - `fuse of three 8-star cards answers stars 9 and level 3 on every skill`: `give("yan", "kael", 8, 3)`, fuse `{"stars":8}` answers 200, `stars` 9, `copies.9` 1, `skills.unlocked` `[true, true, true]`, `skills.level` `[3, 3, 3]`.
- `HeroControllerIT` - `fuse of 4 stars without three copies answers 409 NOT_ENOUGH_CARDS and keeps the bag`: `give("yan", "kael", 4, 2)`, fuse `{"stars":4}` answers 409 `NOT_ENOUGH_CARDS`; the `card_copies` row of stars 4 still holds 2.
- `HeroControllerIT` - `two simultaneous fusions of the same three 3-star cards give exactly one 200 and one 409`: copy the race test at lines 182-206 with `give("yan", "kael", 3, 3)` and body `{"stars":3}`; statuses `[200, 409]`; afterwards the stars-4 row holds 1 and no stars-3 row exists.
- `HeroControllerIT` - `a 3-star fusion leaves the wallet, the leader and the other copies unchanged`: `jpaWalletRepository.save(WalletEntity("yan", 900))`, `give("yan", "lyra", 0, 2)`, `give("yan", "kael", 3, 3)`, fuse `{"stars":3}` answers 200; then `GET /wallet` answers `wallet.gold` 0, `wallet.silver` 9, `wallet.copper` 0; `GET /heroes` answers `leaderId` `kael` and `heroes[1].copies.0` 2.
- `AccountResetControllerIT` - `a reset keeps a nine-star hero at nine stars with level 3 skills`: `atChapter(3)`, `jpaCardCopyRepository.save(CardCopyEntity.from("yan", CopyKey("kael", 9), 1))`, `reset(3).statusCode(200)`; `GET /heroes` answers `heroes[0].stars` 9 and `heroes[0].skills.level` `[3, 3, 3]`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 14 new test cases and the 4 updated ones pass; the whole backend suite passes.
- [x] Step 1 was done and its outcome is in the commit body when the deploy was not live.

**Commit**: `feat(backend): fuse hero cards up to 9 stars`

---

### T4: Game star ranges up to 9 [x]

**Owner**: game-dev
**What**: Raise the game's star ranges (bag 0 to 9, fusion rows 0 to 8) and add the star tier helpers (ASC-07 AC 1, 4, 6; ASC-08 AC 1, 2).
**Where**: `game/src/domain/heroes/heroes.js`
**Also changes**: `game/src/domain/heroes/heroes.test.js`
**Read first**: `heroes.js:1-54`, `heroes.test.js:1-60` (fixture `hero(id, copies, extra)` at line 4; `fusionRows` test at line 40)
**Depends on**: T3
**Requirement**: ASC-07

**Contract**:

```js
//  A card has 0 to 9 stars; 3 cards of the same hero and stars (0 to 8) fuse into 1 card of the next stars.
export const FUSION_SIZE = 3;
export const MAX_STARS = 9;
//  From 4 stars a hero is above the old cap and its stars text is purple; from 7 stars it is a gold chip (spec hero-ascension, Star Colours)
export const ASCENDED_FROM = 4;
export const EXALTED_FROM = 7;

const ALL_STARS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const FUSIBLE_STARS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ];

export const isAscended = (stars) => stars >= ASCENDED_FROM;

//  The class of a .hero-stars element: '' for 0 to 3 stars, 'is-ascended' for 4 to 6, 'is-exalted' for 7 to 9
export const starsClass = (stars) => (stars >= EXALTED_FROM ? 'is-exalted' : stars >= ASCENDED_FROM ? 'is-ascended' : '');
```

Also update the header comment on line 2 to `copies: { 0: n, ..., 9: n }`.

**Steps**:

1. Update the header comments (lines 2 and 3), `MAX_STARS`, `ALL_STARS`, `FUSIBLE_STARS`; add `ASCENDED_FROM`, `EXALTED_FROM`, `isAscended` and `starsClass`.
2. In `heroes.test.js` rename `has one row per hero and stars 0 to 2, never 3` to `has one row per hero and stars 0 to 8, never 9` and expect the 18 pairs `[ 'kael', 0 ]` to `[ 'kael', 8 ]` then `[ 'lyra', 0 ]` to `[ 'lyra', 8 ]`.
3. Write the test cases below (add `isAscended`, `starsClass`, `MAX_STARS` to the import).

**Tests**: unit
**Test cases** (`heroes.test.js`):

- `bagEntries lists the entries of 4 to 9 stars`: `bagEntries([ hero('kael', { 4: 1, 9: 2 }) ])` equals `[ { heroId: 'kael', heroName: 'Hero kael', stars: 4, copies: 1 }, { heroId: 'kael', heroName: 'Hero kael', stars: 9, copies: 2 } ]`.
- `availableFusions offers a 3 star row with 3 copies and never a 9 star row`: `availableFusions([ hero('kael', { 3: 3, 9: 5 }) ])` equals `[ { heroId: 'kael', heroName: 'Hero kael', stars: 3, copies: 3, canFuse: true } ]`.
- `availableFusions offers the 8 star row`: `availableFusions([ hero('kael', { 8: 3 }) ]).map((row) => row.stars)` equals `[ 8 ]`.
- `isAscended is false up to 3 stars and true from 4 to 9`: `[ 0, 1, 2, 3 ].map(isAscended)` equals four `false`; `[ 4, 5, 6, 7, 8, 9 ].map(isAscended)` equals six `true`.
- `starsClass is empty up to 3 stars, is-ascended from 4 to 6 and is-exalted from 7 to 9`: `[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map(starsClass)` equals `[ '', '', '', '', 'is-ascended', 'is-ascended', 'is-ascended', 'is-exalted', 'is-exalted', 'is-exalted' ]`.
- `MAX_STARS is 9`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The six new cases and the renamed one pass; the whole Vitest suite passes.
- [x] Also done here (coordinator decision, 2026-10-31): `bagView.test.js` step 2 of T11 (the stars 9 rename) and the `fusionView.test.js` empty-state case, input `{ 0: 2, 9: 5 }`, so the suite stays green. T11 skips its step 2.

**Commit**: `feat(game): count hero stars up to 9`

---

### T5: Skill level rules [x]

**Owner**: game-dev
**What**: A pure module with the level factor, the level of a payload skill, the slot a star raised and the on-screen text (ASC-03 AC 1; ASC-05 AC 12; ASC-07 AC 2; ASC-08 AC 3 to 5).
**Where**: `game/src/domain/skills/skillLevel.js` (new)
**Also changes**: `game/src/domain/skills/skillLevel.test.js` (new)
**Read first**: spec section Skill Levels; `game/src/domain/skills/skillCatalog.js` (style of a pure data module)
**Depends on**: T4
**Requirement**: ASC-03, ASC-05

**Contract** (whole file):

```js
//  The level of a hero skill (spec hero-ascension, Skill Levels). Pure JavaScript: no Phaser.
//  Level 0 is locked and 1 is the skill as in hero-skills. Each star from 4 to 9 raises one skill in slot order (4 slot 1, 5 slot 2,
//  6 slot 3, 7 slot 1, 8 slot 2, 9 slot 3), so the highest level is 3. The backend answers the level; every level above 1 adds 25 % to
//  the skill's damage percents and effect strength.
export const SKILL_LEVEL_STEP_PERCENT = 25;
export const MAX_SKILL_LEVEL = 3;

//  1, 1.25, 1.5 for levels 1 to 3; a level below 1 counts as 1
export const levelFactor = (level) => 1 + SKILL_LEVEL_STEP_PERCENT * (Math.max(1, level) - 1) / 100;

//  The level of a skill of the heroes payload: 0 when locked, its `level` when it is an integer of 1 or more, else 1 (the previous backend
//  sends no level)
export const skillLevelOf = (skill) =>
{
    if (!skill?.unlocked)
    {
        return 0;
    }

    return Number.isInteger(skill.level) && skill.level >= 1 ? skill.level : 1;
};

//  The slot whose level a star from 4 to 9 raised (1, 2, 3, 1, 2, 3); 0 for 0 to 3 stars
export const raisedSkillSlot = (stars) => (stars >= 4 ? ((stars - 4) % 3) + 1 : 0);

//  '' (locked), 'Nível 1', 'Nível 2 · +25% de poder', 'Nível 3 · +50% de poder'
export const skillLevelText = (level) =>
{
    if (level < 1)
    {
        return '';
    }

    return level === 1 ? 'Nível 1' : `Nível ${level} · +${SKILL_LEVEL_STEP_PERCENT * (level - 1)}% de poder`;
};
```

The separator is ` · ` (space, U+00B7 middle dot, space), the same as `Combo x11 · +11%`.

**Steps**:

1. Create the file with the contract.
2. Write the tests.

**Tests**: unit
**Test cases** (`skillLevel.test.js`):

- `levelFactor is 1, 1.25 and 1.5 for levels 1 to 3, and 1 below 1`: `levelFactor(1) === 1`, `levelFactor(2) === 1.25`, `levelFactor(3) === 1.5`, `levelFactor(0) === 1`; `MAX_SKILL_LEVEL === 3`.
- `skillLevelOf is 0 for a locked skill even with a level`: `skillLevelOf({ unlocked: false, level: 3 }) === 0`, `skillLevelOf(null) === 0`, `skillLevelOf(undefined) === 0`.
- `skillLevelOf reads the level of an unlocked skill`: `{ unlocked: true, level: 2 }` gives 2; `{ unlocked: true, level: 3 }` gives 3.
- `skillLevelOf is 1 for an unlocked skill without a valid level`: `{ unlocked: true }`, `{ unlocked: true, level: 0 }`, `{ unlocked: true, level: '2' }`, `{ unlocked: true, level: 1.5 }` all give 1.
- `raisedSkillSlot names the slot each star from 4 to 9 raised`: `[ 4, 5, 6, 7, 8, 9 ].map(raisedSkillSlot)` equals `[ 1, 2, 3, 1, 2, 3 ]`; `[ 0, 1, 2, 3 ].map(raisedSkillSlot)` equals `[ 0, 0, 0, 0 ]`.
- `skillLevelText reads the spec texts`: `0` -> `''`, `1` -> `'Nível 1'`, `2` -> `'Nível 2 · +25% de poder'`, `3` -> `'Nível 3 · +50% de poder'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The six cases pass; the whole Vitest suite passes.

**Commit**: `feat(game): add the hero skill level rules`

---

### T6: Effect strength as a factor in the damage formulas [x]

**Owner**: game-dev
**What**: Let each running effect carry a factor that scales its strength, with factor 1 giving today's numbers (ASC-04, spec AC 6, 7).
**Where**: `game/src/domain/skills/skillDamage.js`
**Also changes**: `game/src/domain/skills/skillDamage.test.js`
**Read first**: `skillDamage.js` (whole file, 46 lines), `skillDamage.test.js:1-150`
**Depends on**: T5
**Requirement**: ASC-04

**Contract**:

```js
const VENTOS_CLICK_PERCENT = 50;
const BENCAO_CLICK_PERCENT = 25;
const BENCAO_PHYSICAL_PERCENT = 30;
const FUMACA_CRIT_POINTS = 15;
const BRADO_DEFENSE_POINTS = 30;
const PRISAO_MAGICAL_PERCENT = 25;

//  The strength of a running effect: `factors` maps an effect id (ventos, bencao, fumaca, brado, prisao) to its level factor; missing is 1
const factorOf = (factors, id) => factors?.[id] ?? 1;
```

- `strike` gains `factors = {}`:
  - critical chance: `Math.min(100, attacker.critChance + (buffs.includes('fumaca') ? FUMACA_CRIT_POINTS * factorOf(factors, 'fumaca') : 0))` (unless `critChance` is given, as today);
  - Brado: `Math.max(0, defender.physicalDefense - BRADO_DEFENSE_POINTS * factorOf(factors, 'brado'))`;
  - Bênção on a PHYSICAL strike: `1 + BENCAO_PHYSICAL_PERCENT * factorOf(factors, 'bencao') / 100`;
  - Prisão on a MAGICAL strike: `1 + PRISAO_MAGICAL_PERCENT * factorOf(factors, 'prisao') / 100`.
- `clickDamage({ ..., factors = {} })`: bonus = `(ventos ? VENTOS_CLICK_PERCENT * factorOf(factors, 'ventos') : 0) + (bencao ? BENCAO_CLICK_PERCENT * factorOf(factors, 'bencao') : 0)`; passes `factors` to `strike`.
- `hitDamage(options)` passes `options.factors` through (already does via spread).
- `tickDamage({ ..., factors = {} })` passes `factors` to `strike`.

**Steps**:

1. Replace the constants `BENCAO_PHYSICAL = 1.3` and `PRISAO_MAGICAL = 1.25` with the percent constants above; add `factorOf`.
2. Thread `factors` through `strike`, `clickDamage` and `tickDamage` as above.
3. Run the existing tests: every one must pass unchanged.
4. Write the new test cases.

**Tests**: unit
**Test cases** (`skillDamage.test.js`, new `describe('effect factors')`; attacker `PLAYER` (Base 1, critical chance 10, multiplier x2), defender `enemy()` unless said; the factors used are the real level factors 1.25 and 1.5):

- `an empty factors map deals what the effects deal today`: `clickDamage({ attacker: PLAYER, buffs: [ 'ventos' ], debuffs: [], defender: enemy(), random: never })` is 1.5 and with `factors: {}` too.
- `Ventos at factor 1.25 adds 62.5 % to a click`: damage 1.625.
- `Ventos at 1.25 and Bênção at 1.5 add 62.5 and 37.5 and multiply physical by 1.45: 2.9`: buffs `[ 'ventos', 'bencao' ]`, factors `{ ventos: 1.25, bencao: 1.5 }`, click damage `toBeCloseTo(2.9, 9)`.
- `Bênção at factor 1.5 multiplies a physical hit by 1.45 and leaves a magical hit alone`: `hitDamage` 100 % PHYSICAL is `toBeCloseTo(1.45, 9)`; 100 % MAGICAL is 1.
- `Fumaça at factor 1.5 adds 22.5 critical points: a roll of 0.32 crits and 0.33 does not`: `hitDamage` 100 % PHYSICAL with buffs `[ 'fumaca' ]`, factors `{ fumaca: 1.5 }` and `random: () => 0.32` gives `{ damage: 2, critical: true }`; with `() => 0.33` gives `{ damage: 1, critical: false }`; at factor 1 the roll 0.32 does not crit.
- `Brado at factor 1.5 removes 45 physical defense, never below 0`: 100 % PHYSICAL with debuffs `[ 'brado' ]` against `enemy('FIRE', 50)` is `toBeCloseTo(0.95, 9)`; against `enemy('FIRE', 40)` is 1.
- `Prisão at factor 1.25 multiplies magical damage by 1.3125`: 100 % MAGICAL with debuffs `[ 'prisao' ]` is 1.3125; PHYSICAL is 1.
- `a tick reads the factor of Bênção at the tick: 100 % physical at factor 1.5 is 1.45`: `tickDamage({ attacker: PLAYER, percent: 100, damageType: 'PHYSICAL', buffs: [ 'bencao' ], debuffs: [], defender: enemy(), factors: { bencao: 1.5 } })` is `toBeCloseTo(1.45, 9)`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] Every existing `skillDamage.test.js` case passes unchanged and the eight new ones pass; the whole Vitest suite passes.

**Commit**: `feat(game): scale the skill effects by a level factor`

---

### T7: Skills used at a level [x]

**Owner**: game-dev
**What**: `SkillCombat.use` takes the skill level and scales hits, the aimed shot, ticks, effects and Carrilhão by `levelFactor(level)`, leaving every timing value unchanged (ASC-03, spec AC 1, 5, 9; ASC-04, spec AC 6 to 8, 10).
**Where**: `game/src/domain/skills/skillCombat.js`
**Also changes**: `game/src/domain/skills/skillCombat.test.js`
**Read first**: `skillCombat.js` (whole file, 312 lines), `skillCombat.test.js:1-60` (fixtures `stats`, `never`, `monsterOf`, `combat`, `use`), design section Game `SkillCombat`
**Depends on**: T6
**Requirement**: ASC-03, ASC-04

**Contract**:

- `import { levelFactor } from './skillLevel';`
- `start(list, id, label, ms, owner = {}, factor = 1)`: a restart sets `running.remainingMs = ms` and `running.factor = factor`; a new effect is `{ id, label, remainingMs: ms, seq: this.sequence++, factor, ...owner }`.
- `factors()`: `Object.fromEntries([ ...this.buffs, ...this.debuffs ].map((effect) => [ effect.id, effect.factor ?? 1 ]))`.
- `startDot(skill, attacker, owner = {}, factor = 1)`: `percent = skill.ticks.percent * factor`; a restart also sets `percent`; a new dot stores `percent`.
- `use({ heroId, slot, unlocked, level = 1, attacker, monster, boss })`: `const factor = levelFactor(level)`; buff and debuff start with `factor`; each hit uses `percent * factor`; `startDot(skill, attacker, owner, factor)`; the cast is `{ key, remainingMs: skill.cast.ms, skill, attacker, boss, factor }`; the answer's `countdown.extendMs` is `boss ? (skill.countdownExtendMs ?? 0) * factor : 0`.
- `landCast` uses `skill.cast.hit.percent * this.cast.factor`.
- `click`, the hits of `use`, `landCast` and `tickHit` pass `factors: this.factors()` to `clickDamage`, `hitDamage` and `tickDamage`.
- Unchanged: `cooldownMs`, `buff.ms`, `debuff.ms`, `cast.ms`, `stunMs`, `rootMs`, `ticks.count`, `maxStacks`, `armorPierce`, `vsDarkness`.

**Steps**:

1. Add the import, the `factor` argument of `start` and `startDot`, and `factors()`.
2. Change `use`, `landCast`, `click` and `tickHit` as above.
3. Run the existing 63 tests: every one must pass unchanged (they use no level, so level 1).
4. Write the new test cases in a new `describe('skill levels')`, using the file's fixtures and `use(skills, monster, heroId, slot, { level })`.

**Tests**: unit
**Test cases** (`skillCombat.test.js`; Base 1 = `PLAYER`, neutral `stats()`, roll `never` unless said; levels only 1 to 3):

- `Corte Dimensional lands 18.75 at level 2 and 22.5 at level 3`.
- `Corte Dimensional keeps its +30 armor pierce at level 2: 12.1875 against physical defense 50` (`monsterOf(1000, stats('FIRE', 50))`).
- `Investida do Baluarte lands 6 at level 3 and still stops a boss countdown for 3 s`: `boss: true`; hit 6; `skills.countdownMs(5000) === 2000`.
- `Flecha Dupla lands two hits of 3.75 at level 2`.
- `Tiro Preciso at level 2 lands an aimed critical hit of 75 after its 2 s cast`: after `use`, `skills.advance(1999, { monster })` lands nothing; `skills.advance(1, { monster }).hits` equals `[ { damage: 75, critical: true } ]`.
- `Chuva de Meteoros lands 31.25 at level 2 and 37.5 at level 3`.
- `Luz Divina lands 10 at level 2 and 16.2 at level 3 on a DARKNESS monster` (level 2 neutral 10; level 3 against `stats('DARKNESS')` is `toBeCloseTo(12 * 0.9 * 1.5, 9)` = 16.2, the formula of the existing test at line 57).
- `Golpe Sangrento at level 3 lands 9, then six Bleed ticks of 2.25`: `skills.advance(6000, { monster }).hits.map((hit) => hit.damage)` equals six times 2.25; `advance(1000)` after that lands nothing.
- `Tempestade Arcana at level 3 lands six ticks of 3 and no seventh`.
- `Bomba de Veneno at level 2 ticks 1.25 per stack for 8 ticks`.
- `Ventos Ligeiros at level 2 makes a Base-1 click 1.625 for 12 s`: `skills.click({ attacker: PLAYER, monster, boss: false }).damage` is 1.625; after `advance(11999)` still 1.625; after `advance(1)` more the click is 1.
- `Bênção da Grande Árvore at level 3 makes a Base-1 click 1.99375 (1.375 x 1.45)` (`toBeCloseTo(1.99375, 9)`).
- `Bomba de Fumaça at level 3 adds 22.5 critical points`: `combat(() => 0.32)`; after `use(... 'vex', 2, { level: 3 })` a click is `{ damage: 2, critical: true }`; with `combat(() => 0.33)` the click is not critical.
- `Brado Aterrador at level 3 removes 45 physical defense: a click on defense 50 deals 0.95, and 0.8 at level 1`.
- `Prisão de Espinhos at level 2 multiplies Chuva de Meteoros at level 2 by 1.3125: 41.015625`: `use(... 'orina', 1, { level: 2 })` then `use(... 'orina', 3, { level: 2 })`; hit `toBeCloseTo(41.015625, 9)`.
- `Carrilhão da Aurora adds 5000 ms at level 2 and 6000 ms at level 3 on a boss, and nothing on a phase monster`: `result.countdown.extendMs` 5000, 6000, and 0 with `boss: false`.
- `a skill used without a level is level 1`: Corte Dimensional with no `level` lands 15.
- `the cooldown, the duration, the cast, the Root and the tick count do not change with the level`: at level 3, Corte's `slotState('kael', 1, true)` is `{ state: 'cooling', seconds: 20 }`; Ventos shows `effects()` `[ { label: 'Ventos Ligeiros', seconds: 12 } ]`; Prisão on a boss gives `countdownMs(5000) === 3000`; Tempestade lands exactly 6 ticks over `advance(10000)`.
- `a restarted effect takes the factor of the restart`: `skills.start(skills.buffs, 'ventos', 'Ventos Ligeiros', 12000, {}, 1.25)` then `skills.start(skills.buffs, 'ventos', 'Ventos Ligeiros', 12000, {}, 1.5)`; `skills.buffs` has length 1 and `skills.factors()` equals `{ ventos: 1.5 }`.
- `an effect keeps the factor it was cast with when the next skill is used at another level`: Ventos at level 1, then Flecha Dupla at level 3; a click is 1.5.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 63 existing cases pass unchanged and the 20 new ones pass; the whole Vitest suite passes. (`skillCombat.test.js` holds 59 existing cases, all pass unchanged; 59 + 20 = 79.)

**Commit**: `feat(game): use hero skills at their level`

---

### T8: Star bonus rows 4 to 9 and the star power text [x]

**Owner**: game-dev
**What**: Add the Star Bonus rows 4 to 9 and the text of the hero detail line (ASC-06, spec AC 1 to 5; ASC-08, spec AC 7 to 9).
**Where**: `game/src/domain/heroes/starBonus.js`
**Also changes**: `game/src/domain/heroes/starBonus.test.js`, `game/src/domain/combat/leaderAttacker.test.js`, `game/src/domain/equipment/leaderStats.test.js`
**Read first**: `starBonus.js` (13 lines), `starBonus.test.js`, `leaderAttacker.test.js:1-35`, `leaderStats.test.js:1-45`, `leaderStats.js:9-26` (number format: `toFixed(1)` for click damage, `one()` and `two()` drop trailing zeros), spec section Star Bonus
**Depends on**: T7
**Requirement**: ASC-06

**Contract**:

```js
export const STAR_BONUS = {
    0: NO_BONUS,
    1: { clickDamagePct: 10, critChance: 0, critDamagePct: 0 },
    2: { clickDamagePct: 20, critChance: 0, critDamagePct: 20 },
    3: { clickDamagePct: 40, critChance: 30, critDamagePct: 50 },
    4: { clickDamagePct: 70, critChance: 35, critDamagePct: 75 },
    5: { clickDamagePct: 100, critChance: 40, critDamagePct: 100 },
    6: { clickDamagePct: 130, critChance: 45, critDamagePct: 125 },
    7: { clickDamagePct: 160, critChance: 50, critDamagePct: 150 },
    8: { clickDamagePct: 190, critChance: 55, critDamagePct: 175 },
    9: { clickDamagePct: 220, critChance: 60, critDamagePct: 200 }
};

//  The hero detail line (spec hero-ascension ASC-08): the non-zero parts of the row, '' when there is none
export const starPowerText = (stars) =>
{
    const { clickDamagePct, critChance, critDamagePct } = starBonus(stars);
    const parts = [
        ...(clickDamagePct ? [ `+${clickDamagePct}% de dano de clique` ] : []),
        ...(critChance ? [ `+${critChance} de chance de crítico` ] : []),
        ...(critDamagePct ? [ `+${critDamagePct}% de dano crítico` ] : [])
    ];

    return parts.length ? `Poder das estrelas: ${parts.join(', ')}` : '';
};
```

**Steps**:

1. Add rows 4 to 9 and `starPowerText`.
2. In `starBonus.test.js` rename `adds nothing for a star count the game does not know` to `adds nothing for a star count above 9 or missing` and replace `starBonus(4)` with `starBonus(10)` in it.
3. Write the test cases below.

**Tests**: unit
**Test cases**:

- `starBonus.test.js` - `adds the rows 4 to 9 of the spec` (`it.each`, six cases, `toEqual`): 4 -> `{ clickDamagePct: 70, critChance: 35, critDamagePct: 75 }`; 5 -> `100, 40, 100`; 6 -> `130, 45, 125`; 7 -> `160, 50, 150`; 8 -> `190, 55, 175`; 9 -> `220, 60, 200`.
- `starBonus.test.js` - `starPowerText reads every star count`: `0` -> `''`; `1` -> `'Poder das estrelas: +10% de dano de clique'`; `2` -> `'Poder das estrelas: +20% de dano de clique, +20% de dano crítico'`; `3` -> `'Poder das estrelas: +40% de dano de clique, +30 de chance de crítico, +50% de dano crítico'`; `4` -> `'Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico'`; `5` -> `'Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico'`; `6` -> `'Poder das estrelas: +130% de dano de clique, +45 de chance de crítico, +125% de dano crítico'`; `7` -> `'Poder das estrelas: +160% de dano de clique, +50 de chance de crítico, +150% de dano crítico'`; `8` -> `'Poder das estrelas: +190% de dano de clique, +55 de chance de crítico, +175% de dano crítico'`; `9` -> `'Poder das estrelas: +220% de dano de clique, +60 de chance de crítico, +200% de dano crítico'`.
- `leaderAttacker.test.js` - `gives a leader with 4 to 9 stars and no equipment the Star Bonus table values` (`it.each`): `leaderAttacker({ leader: { element: 'FIRE', stars: n } })` gives `baseDamage` 1.7, 2.0, 2.3, 2.6, 2.9, 3.2, `critChance` 45, 50, 55, 60, 65, 70 and `critMultiplier` 2.75, 3, 3.25, 3.5, 3.75, 4 for n = 4 to 9, each with `toBeCloseTo(..., 9)`.
- `leaderStats.test.js` - `reads Kael with 4 stars as 1.7, 45% and x2.75`: the lines `clickDamage`, `critChance`, `critDamage` read `Dano de clique: 1.7`, `Chance de crítico: 45%`, `Dano crítico: x2.75`.
- `leaderStats.test.js` - `reads Kael with 9 stars as 3.2, 70% and x4`: `Dano de clique: 3.2`, `Chance de crítico: 70%`, `Dano crítico: x4`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The new cases and the renamed one pass; the whole Vitest suite passes.

**Commit**: `feat(game): raise the star bonus of 4 to 9 star leaders`

---

### T9: The scene uses the skill level of the payload [ ]

**Owner**: game-dev
**What**: `ClickerGame.useSkill` passes the level of the leader's skill to `SkillCombat.use`, and scene tests pin the click and skill numbers of 4 to 9 star leaders (ASC-03, spec AC 2 to 4; ASC-05; ASC-06, spec AC 2 to 4, 6; ASC-07 AC 8).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `ClickerGame.js:780-845` (`skillCard`, `skillState`, `leaderAttacker`, `useSkill`), `ClickerGame.test.js:40-90` (fixtures `definition`, `progress`, `heroSkills`, `heroEntry`, `createScene`), `ClickerGame.test.js:2558-2640` (skills helpers `slot`, `slotText`, `key`), `ClickerGame.test.js:3051-3108` (star bonus tests)
**Depends on**: T8
**Requirement**: ASC-05

**Contract**: in `useSkill`, replace the `unlocked:` line with

```js
const skill = leader.skills.find((candidate) => candidate.slot === slot);
// ...
unlocked: skill?.unlocked ?? false,
level: skillLevelOf(skill),
```

and import `skillLevelOf` from `'../../domain/skills/skillLevel'`. Nothing else in `ClickerGame.js` changes.

**Steps**:

0. Precondition: both files carried uncommitted owner edits on 2026-10-31. Run `git status --porcelain -- game/src/adapters/phaser/ClickerGame.js game/src/adapters/phaser/ClickerGame.test.js`. If it prints anything, STOP and report "T9 blocked: the owner's uncommitted edits in ClickerGame.js / ClickerGame.test.js must be committed first"; do not stash, revert or commit them.
1. Make the change above.
2. Add `describe('ClickerGame hero ascension')` at the end of `ClickerGame.test.js` with its own fixtures:

```js
const big = () => ({ ...progress(1, 'PHASE', 1), definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000 })) } });
//  levels: one number per slot, e.g. [ 2, 1, 1 ] for a 4-star hero (spec hero-ascension, Levels by stars)
const levelled = (levels) => heroSkills(true, true, true).map((skill, index) => ({ ...skill, level: levels[index] }));
const leaderAt = (id, stars, levels) => ({
    leaderId: id,
    heroes: [ { ...heroEntry(id, { [stars]: 1 }, stars), ...(levels && { skills: levelled(levels) }) }, heroEntry(id === 'kael' ? 'lyra' : 'kael', { 0: 1 }, 0) ]
});
const key = (ctx, name) => ctx.handlers[`keydown-${name}`]();
const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
const slotText = (ctx, number) => slot(ctx, number).querySelector('.skill-slot-cooldown').textContent;
```

3. Write the test cases. Every scene uses `talents: []` so the combo adds nothing.

**Tests**: unit
**Test cases** (`ClickerGame hero ascension`):

- `a 4 star Kael uses Corte Dimensional at level 2 for 31.875, shown 31.9`: `leaderAt('kael', 4, [ 2, 1, 1 ])`, `key(ctx, 'ONE')`; `monster.health` `toBeCloseTo(968.125, 9)`; `ctx.texts.at(-1).text === '31.9'`.
- `a 4 star Kael uses Investida do Baluarte still at level 1 for 6.8`: `leaderAt('kael', 4, [ 2, 1, 1 ])`, `key(ctx, 'TWO')`; health `toBeCloseTo(993.2, 9)`.
- `a 9 star Kael uses Corte Dimensional at level 3 for 72`: `leaderAt('kael', 9, [ 3, 3, 3 ])`, `key(ctx, 'ONE')`; health `toBeCloseTo(928, 9)`.
- `a skill without a level in the payload is used at level 1`: `leaderAt('kael', 4)` (no level field); `key(ctx, 'ONE')`; health `toBeCloseTo(974.5, 9)` (1.7 x 15).
- `clicks for 1.7, 2, 2.3, 2.6, 2.9 and 3.2 with 4 to 9 stars`: one scene per count, `ctx.click()`, last text `'1.7'`, `'2'`, `'2.3'`, `'2.6'`, `'2.9'`, `'3.2'`.
- `a 4 star leader crits on a roll of 0.44 for 4.7 and not on 0.45`: `ctx.dice.value = 0.44`, click, text `'4.7'`; a new scene with `0.45`, text `'1.7'`.
- `a 9 star leader crits on a roll of 0.69 for 12.8 and not on 0.70`: `leaderAt('kael', 9, [ 3, 3, 3 ])`; `ctx.dice.value = 0.69`, click, text `'12.8'`; a new scene with `0.7`, text `'3.2'`.
- `Ventos Ligeiros cast by a 5 star Lyra stays at +50 % after she fuses to 6 stars`: `leaderAt('lyra', 5, [ 2, 2, 1 ])`; `key(ctx, 'THREE')`; `heroesGateway.fuse.mockResolvedValue({ ...heroEntry('lyra', { 6: 1 }, 6), skills: levelled([ 2, 2, 2 ]) })`; `await ctx.scene.heroes.fuse('lyra', 5)`; `ctx.click()`; `monster.health` `toBeCloseTo(1000 - 3.45, 9)`.
- `a fusion of the leader keeps the cooldown of a cooling slot`: `leaderAt('kael', 3, [ 1, 1, 1 ])`; `key(ctx, 'ONE')`; `ctx.scene.update(0, 5000)`; fuse to `{ ...heroEntry('kael', { 4: 1 }, 4), skills: levelled([ 2, 1, 1 ]) }` as above (`ctx.scene.heroes.fuse('kael', 3)`); `slot(ctx, 1).getAttribute('data-state') === 'cooling'` and `slotText(ctx, 1) === '15s'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] Step 0 printed nothing, or the task was reported blocked.
- [ ] The nine cases pass; every existing `ClickerGame.test.js` case passes unchanged; the whole Vitest suite passes.

**Commit**: `feat(game): fight with the skill level of the leader`

---

### T10: Skill rows, star tiers and star power on the hero screens [x]

**Owner**: game-dev
**What**: The skill row shows `Nível <L>`, the catalog card and hero detail draw 4 to 6 stars with `is-ascended` and 7 to 9 with `is-exalted`, and the hero detail shows the star power line (ASC-08, spec AC 1 to 5, 7 to 9).
**Where**: `game/src/adapters/phaser/views/catalogView.js`
**Also changes**: `game/src/adapters/phaser/views/catalogView.test.js`, `game/src/adapters/phaser/views/skillTooltip.test.js`
**Read first**: `catalogView.js` (72 lines), `catalogView.test.js`, `skillTooltip.js`, `skillTooltip.test.js:1-40`, `views/dom.js:5-25` (`el(tag, className, text, attributes)`)
**Depends on**: T9
**Requirement**: ASC-08

**Contract**:

- Imports: `starsClass` from `'../../../domain/heroes/heroes'`, `starPowerText` from `'../../../domain/heroes/starBonus'`, `skillLevelOf`, `skillLevelText` from `'../../../domain/skills/skillLevel'`.
- A local helper `const starsClassName = (hero) => [ 'hero-stars', hero.owned ? starsClass(hero.stars) : '' ].filter(Boolean).join(' ');`
- `renderSkillRow`: after the `.skill-state` span, when `const level = skillLevelOf(skill)` is 1 or more, append a text node `' '` and `el('span', 'skill-level', skillLevelText(level), { 'data-level': String(level) })`.
- `renderCatalog`: the `.hero-stars` span uses `starsClassName(hero)` as its class.
- `renderHeroDetail`: the `.hero-stars` div uses `starsClassName(hero)`; right after it, when `hero.owned` and `starPowerText(hero.stars)` is not empty, append `el('div', 'hero-star-power', <text>, { testid: 'hero-star-power' })`.

**Steps**:

1. Make the changes.
2. Write the test cases.

**Tests**: unit
**Test cases** (`catalogView.test.js` unless said):

- `a skill row of an unlocked level 1 skill reads Nível 1`: `renderSkillRow({ ...skill, unlocked: true, level: 1 }).querySelector('.skill-level')` has text `'Nível 1'` and `data-level` `'1'`.
- `a skill row reads Nível 2 and Nível 3 with the power percent`: level 2 gives `'Nível 2 · +25% de poder'` and `data-level` `'2'`; level 3 gives `'Nível 3 · +50% de poder'` and `data-level` `'3'`.
- `an unlocked skill without a level reads Nível 1`.
- `a locked skill row has no level, even with a level field`: `{ unlocked: false, level: 3 }` has no `.skill-level`.
- `the catalog card draws 4 to 6 stars ascended and 7 to 9 stars exalted`: `.hero-stars` of an owned 4-star `hero-card-kael` has class `is-ascended`, not `is-exalted`, text `4★`; an owned 7-star card has `is-exalted`, not `is-ascended`, text `7★`; an owned 3-star card has neither; a hero not owned shows `Não obtido` with neither.
- `the detail of a 4 star hero shows the star power line`: `hero-star-power` text `'Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico'`; its `.hero-stars` has `is-ascended`.
- `the detail of a 9 star hero shows the gold stars and its star power`: `hero-star-power` text `'Poder das estrelas: +220% de dano de clique, +60 de chance de crítico, +200% de dano crítico'`; its `.hero-stars` has `is-exalted`.
- `the detail of a 1 star hero shows only the click part`: `'Poder das estrelas: +10% de dano de clique'`.
- `the detail of a 0 star hero and of a hero not owned has no star power line`: no `[data-testid="hero-star-power"]`.
- `skillTooltip.test.js` - `the tooltip of a level 2 skill carries its level`: `attachSkillTooltip(node, () => ({ ...skill, unlocked: true, level: 2 }))`, `pointerenter`; `.skill-tooltip .skill-level` text `'Nível 2 · +25% de poder'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The ten cases pass; the whole Vitest suite passes.

**Commit**: `feat(game): show the skill level and star power on the hero screens`

---

### T11: Bag entries of 4 to 9 stars [x]

**Owner**: game-dev
**What**: The bag detail reads the new cap of 9 and draws the star tiers (ASC-07 AC 4 to 6; ASC-08 AC 1, 2).
**Where**: `game/src/adapters/phaser/views/bagView.js`
**Also changes**: `game/src/adapters/phaser/views/bagView.test.js`
**Read first**: `bagView.js` (55 lines), `bagView.test.js` (82 lines)
**Depends on**: T10
**Requirement**: ASC-07

**Contract**: import `starsClass`; in `renderBagEntry` the `.hero-stars` div is `el('div', [ 'hero-stars', starsClass(entry.stars) ].filter(Boolean).join(' '), ...)`. `fusible` keeps reading `entry.stars < MAX_STARS` (9 after T4). No other change.

**Steps**:

1. Make the change.
2. In `bagView.test.js` rename the test at lines 75-81 to `a 9 star entry cannot be fused: Estrela máxima and no button` and build it with `stars: 9` and `hero('kael', { 9: 1 }, { stars: 9 })`. **Done in T4; skip this step in T11.**
3. Write the test cases.

**Tests**: unit
**Test cases** (`bagView.test.js`):

- `the bag lists 4 and 9 star entries with their copies`: `renderBag([ hero('kael', { 4: 1, 9: 2 }) ], { onSelect })`: `.bag-name` texts `[ 'Hero kael 4★', 'Hero kael 9★' ]`, `.bag-copies` texts `[ 'x1', 'x2' ]`.
- `a 3 star entry with 3 copies reads Para fundir: 3/3 and offers Ir para a fusão`: `.bag-needed` `'Para fundir: 3/3'`; `[data-testid="bag-go-fusion"]` exists.
- `an 8 star entry with 2 copies reads Para fundir: 2/3 and offers no button`.
- `the stars of a bag entry follow the tier`: `.hero-stars` of a 4-star entry has `is-ascended` and text `Estrelas: 4★`; of a 7-star entry has `is-exalted` and not `is-ascended`; of a 3-star entry has neither.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The four new cases pass (the renamed case was done in T4); the whole Vitest suite passes.

**Commit**: `feat(game): list and detail bag cards of up to 9 stars`

---

### T12: Fusion rows and result past 3 stars [ ]

**Owner**: game-dev
**What**: The Fusão screen lists the 3 to 8 star rows and the result names the one skill the new star raised (ASC-07 AC 1 to 3, 7).
**Where**: `game/src/adapters/phaser/views/fusionView.js`
**Also changes**: `game/src/adapters/phaser/views/fusionView.test.js`, `game/src/adapters/phaser/HeroUi.js`, `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `fusionView.js` (38 lines), `fusionView.test.js`, `HeroUi.js:271-305` (`render_fusion`, `fuse`), `HeroUi.test.js:1-60` (fixtures `skills` at line 11 names skills `Skill 1` to `Skill 3`; `hero` at line 15 takes `extra`) and `:222-256` (fusion tests)
**Depends on**: T11
**Requirement**: ASC-07

**Contract**:

```js
// fusionView.js (import isAscended from heroes)
//  The card a fusion made; from 4 stars it names the one skill the new star raised and its new level
export const renderFusionResult = ({ heroName, stars, skillName = '', level = 0 }) =>
    el('div', 'fusion-result', `Nova carta: ${heroName} ${starsText(stars)}${isAscended(stars) && skillName && level >= 1 ? ` · ${skillName} no nível ${level}` : ''}`, { testid: 'fusion-result' });

// HeroUi.fuse (import raisedSkillSlot, skillLevelOf from '../../domain/skills/skillLevel'), replacing the render_fusion call:
const raised = hero.skills?.find((skill) => skill.slot === raisedSkillSlot(stars + 1));

this.render_fusion({ selected: { heroId, stars }, result: { heroName: hero.name, stars: stars + 1, skillName: raised?.name ?? '', level: skillLevelOf(raised) } });
```

The rows need no change: `availableFusions` already lists stars 0 to 8 after T4.

**Steps**:

1. Change `renderFusionResult` and `HeroUi.fuse` as above.
2. Write the test cases.

**Tests**: unit
**Test cases**:

- `fusionView.test.js` - `lists a 3 star row as 3★ → 4★ with 3/3`: `renderFusion([ hero('kael', { 3: 3 }) ], { onFuse })`; `fusion-row-kael-3` `.fusion-name` `'Hero kael 3★ → 4★'`, `.fusion-copies` `'3/3'`, `fusion-button-kael-3` text `'Fundir'`; a click calls `onFuse('kael', 3)`.
- `fusionView.test.js` - `lists the 8 star row and never a 9 star row`: `hero('kael', { 8: 3, 9: 3 })` has `fusion-row-kael-8` (`'Hero kael 8★ → 9★'`) and no `fusion-row-kael-9`.
- `fusionView.test.js` - `the result of a fusion to 4 to 9 stars names the raised skill and its level`: `renderFusionResult({ heroName: 'Kael Raizférrea', stars: 4, skillName: 'Corte Dimensional', level: 2 }).textContent === 'Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2'`; `{ stars: 9, skillName: 'Brado Aterrador', level: 3 }` gives `'Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3'`.
- `fusionView.test.js` - `the result of a fusion to 1 to 3 stars reads as before`: `{ heroName: 'Kael Raizférrea', stars: 3, skillName: 'Brado Aterrador', level: 1 }` gives `'Nova carta: Kael Raizférrea 3★'`.
- `fusionView.test.js` - `a 4 star result without a skill name reads only the card`: `{ heroName: 'Kael Raizférrea', stars: 4, level: 2 }` gives `'Nova carta: Kael Raizférrea 4★'`.
- `HeroUi.test.js` - `a 3 star fusion names skill 1 at level 2`: `createUi({ list: { leaderId: 'kael', heroes: [ hero('kael', { 3: 3 }), hero('lyra') ] } })`; `ctx.heroesGateway.fuse.mockResolvedValue(hero('kael', { 4: 1 }, { stars: 4, skills: skills(true, true, true).map((skill, index) => ({ ...skill, level: [ 2, 1, 1 ][index] })) }))`; open Fusão, click `fusion-button-kael-3`, flush; `fusion-result` text `'Nova carta: Hero kael 4★ · Skill 1 no nível 2'`.
- `HeroUi.test.js` - `a 5 star fusion names skill 3 at level 2`: `createUi({ list: { leaderId: 'kael', heroes: [ hero('kael', { 5: 3 }, { stars: 5 }), hero('lyra') ] } })`; fuse resolves `hero('kael', { 6: 1 }, { stars: 6, skills: skills(true, true, true).map((skill) => ({ ...skill, level: 2 })) })`; click `fusion-button-kael-5`; `fusion-result` `'Nova carta: Hero kael 6★ · Skill 3 no nível 2'`.
- `HeroUi.test.js` - `a failed 3 star fusion shows the Portuguese error and keeps the row`: `ctx.heroesGateway.fuse.mockRejectedValue(new ApiError('Fewer than 3 cards', { status: 409, code: 'NOT_ENOUGH_CARDS' }))` (follow the existing failure test at line 241); error line `'Não foi possível fundir as cartas.'`; `fusion-row-kael-3` still shows `'3/3'`; no `fusion-result`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The eight cases pass; the whole Vitest suite passes.

**Commit**: `feat(game): fuse hero cards past 3 stars on the Fusão screen`

---

### T13: Level badge on the skill bar [ ]

**Owner**: game-dev
**What**: An unlocked skill bar slot of level 2 or 3 shows `Nv. <L>` with `data-level` (ASC-08 AC 6; ASC-07 AC 8).
**Where**: `game/src/adapters/phaser/views/skillBar.js`
**Also changes**: `game/src/adapters/phaser/views/skillBar.test.js`, `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `skillBar.js:44-82`, `skillBar.test.js:1-50`, `HeroUi.test.js:319-341` (bar after a fusion)
**Depends on**: T12
**Requirement**: ASC-08

**Contract**: import `skillLevelOf`; in `renderSkillBar`, inside the `else` branch of an unlocked slot, before the click listener:

```js
const level = skillLevelOf(skill);

if (level >= 2)
{
    slot.append(el('span', 'skill-level-badge', `Nv. ${level}`, { testid: `skill-level-${skill.slot}`, 'data-level': String(level) }));
}
```

**Steps**:

1. Make the change.
2. Write the test cases.

**Tests**: unit
**Test cases**:

- `skillBar.test.js` - `shows Nv. 2 on the slots of level 2 of a 5 star leader and none on its level 1 slot`: three unlocked skills with levels `[ 2, 2, 1 ]`; `skill-level-1` and `skill-level-2` read `'Nv. 2'` with `data-level` `'2'`; no `skill-level-3`.
- `skillBar.test.js` - `shows Nv. 3 with data-level 3 on every slot of a 9 star leader`: levels `[ 3, 3, 3 ]`; `skill-level-1..3` read `'Nv. 3'`, `data-level` `'3'`.
- `skillBar.test.js` - `shows no badge on a level 1 slot, on a slot without a level or on a locked slot`: levels 1, missing, and `{ unlocked: false, level: 3 }` give no `.skill-level-badge`.
- `HeroUi.test.js` - `shows the Nv. 2 badge on slot 1 after the leader fuses to 4 stars, without reloading`: follow the test at line 330; after the fusion resolves a kael with stars 4 and skill levels `[ 2, 1, 1 ]`, `[data-testid="skill-level-1"]` reads `'Nv. 2'`, there is no `[data-testid="skill-level-2"]`, and `ctx.heroesGateway.list` was called once.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The four cases pass; the whole Vitest suite passes.

**Commit**: `feat(game): show the skill level on the skill bar`

---

### T14: Style of the star tiers, levels and star power [ ]

**Owner**: game-dev
**What**: The CSS of the Visual spec (design) so the new classes render as specified (ASC-08, spec AC 1, 2, 4, 6).
**Where**: `game/public/style.css`
**Depends on**: T13
**Requirement**: ASC-08

**Contract**: append these rules at the end of `style.css`, under the comment `/* ══ Hero ascension: star tiers, skill levels and star power ══ */`:

```css
/* 4 to 6 stars: purple text (the EPIC family) */
.hero-stars.is-ascended {
    color: #7a3fa0;
    font-weight: 800;
}

/* 7 to 9 stars: a gold chip (the LEGENDARY frame gold and glow) */
.hero-stars.is-exalted {
    display: inline-block;
    width: fit-content;
    padding: 0 8px;
    border-radius: 999px;
    color: #201e1d;
    background: #d9a521;
    font-weight: 800;
    box-shadow: 0 0 6px rgb(255 214 90 / 0.6);
}

.skill-level {
    display: inline-block;
    margin-left: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #7a3fa0;
    background: #efe4f5;
}

.skill-level[data-level="3"] {
    color: #201e1d;
    background: #d9a521;
}

/* Mirror of .skill-key on the right corner of the art */
.skill-level-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    display: grid;
    place-items: center;
    height: 20px;
    padding: 0 6px;
    font-family: var(--font-heading);
    font-size: 12px;
    color: var(--color-bg);
    border-radius: 6px;
    background: #7a3fa0;
    opacity: 0.9;
    pointer-events: none;
}

.skill-level-badge[data-level="3"] {
    color: #201e1d;
    background: #d9a521;
    opacity: 1;
}

.hero-star-power {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-neutral-800);
}
```

**Steps**:

1. Append the rules. Do not edit any other rule.

**Tests**: none - the matrix gives CSS no unit test; T16 asserts the computed colours (`rgb(122, 63, 160)` for `.hero-stars.is-ascended`; background `rgb(217, 165, 33)` and colour `rgb(32, 30, 29)` for `.hero-stars.is-exalted` and a level 3 badge) and the badge position, and T17 reviews the look.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] `git diff game/public/style.css` shows only added lines.
- [ ] The build passes.

**Commit**: `style(game): color the star tiers and skill levels`

---

### T15: Fake backend for stars up to 9 [ ]

**Owner**: test-engineer
**What**: The e2e fake backend answers copies 0 to 9, skill `level` and fusions of 0 to 8 stars like the real backend after T3 (ASC-01, ASC-02 contract in the browser tests).
**Where**: `game/e2e/support/fakeBackend.js`
**Read first**: `fakeBackend.js:72-136` (heroes, `starsOf`, `heroView`), `:562-590` (`handleHeroes` fuse)
**Depends on**: T14
**Requirement**: ASC-02

**Contract**:

```js
const STAR_LEVELS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const starsOf = (cards, heroId) => [ 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 ].find((stars) => copiesOf(cards, heroId, stars) > 0) ?? 0;
//  Skill level (spec hero-ascension): 0 locked, else 1 + floor((stars - slot) / 3); one skill rises per star from 4 to 9
const skillLevel = (stars, slot) => (stars < slot ? 0 : 1 + Math.floor((stars - slot) / 3));

// heroView:
owned: STAR_LEVELS.some((level) => copiesOf(cards, hero.id, level) > 0),
copies: Object.fromEntries(STAR_LEVELS.map((level) => [ level, copiesOf(cards, hero.id, level) ])),
skills: hero.skills.map((candidate) => ({ ...candidate, unlocked: stars >= candidate.slot, level: skillLevel(stars, candidate.slot) }))

// handleHeroes fuse: the bounds check becomes
if (![ 0, 1, 2, 3, 4, 5, 6, 7, 8 ].includes(body.stars)) { return route.fulfill(problem(400, 'Fusion is invalid', 'INVALID_FUSION')); }
```

Update the comment above `HEROES` to say cards have 0 to 9 stars.

**Steps**:

1. Make the changes above.
2. Run the regression gate.

**Tests**: e2e (regression: the existing hero, skill, click power, farm and drop suites must pass unchanged against the new fake)
**Gate**: full - `cd game && npx playwright test e2e/heroes.spec.js e2e/skills.spec.js e2e/skillsAll.spec.js e2e/clickPower.spec.js e2e/farm.spec.js e2e/drops.spec.js e2e/combatHud.spec.js`
**Done when**:

- [ ] The seven suites pass with no test edited.

**Commit**: `test(game): let the fake backend fuse hero cards up to 9 stars`

---

### T16: e2e of hero ascension [ ]

**Owner**: test-engineer
**What**: Browser tests of every player-visible criterion: the fusions to 4 and 9 stars, the levels on screen, the larger skill and click damage, the attribute panel, the star tiers, the 9-star bag entry and a failed fusion (ASC-03, ASC-06, ASC-07, ASC-08).
**Where**: `game/e2e/heroAscension.spec.js` (new)
**Read first**: `game/e2e/clickPower.spec.js:1-40` (`startAs`, `health`, neutral chapter of 1 000 health), `game/e2e/heroes.spec.js:17-31, 60-92, 132-146` (`startGame`, fusion flow, `backend.cardsOf`), `game/e2e/equipmentUi.spec.js` (opening Equipamento and reading `stat-*`)
**Depends on**: T15
**Requirement**: ASC-03, ASC-06, ASC-07, ASC-08

**Contract**: one `test.describe('Hero ascension')`. Setup helper `startAs(page, { copies })` copied from `clickPower.spec.js` with the chapter `chapter(bare('FIRE'))` (1 000 health, every defense 0, so a Kael hit is neutral), `cards: { yan: { leader: 'kael', copies } }`, default roll 0.99, no talents. `health(page)` reads the monster health as in `clickPower.spec.js`. Keys: `page.keyboard.press('1')` uses slot 1. Colours are read with `locator.evaluate((node) => getComputedStyle(node).<property>)`.

**Steps**:

1. Create the file with the helper and the scenarios below, one `test()` each.
2. Run the gate twice in a row; both runs must pass (no flake).

**Tests**: e2e
**Test cases**:

- `three 3-star Kael cards fuse into a 4-star Kael with Corte Dimensional at level 2` (ASC-07 AC 1, 2, 8; ASC-08 AC 6): copies `{ 'kael:3': 3 }`; click `hud-fusion`; `fusion-row-kael-3` `.fusion-name` `'Kael Raizférrea 3★ → 4★'` and `.fusion-copies` `'3/3'`; click `fusion-button-kael-3`; `fusion-result` `'Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2'`; `skill-level-1` reads `'Nv. 2'`; `skill-level-2` and `skill-level-3` count 0; no page reload happened.
- `three 8-star Kael cards fuse into a 9-star Kael with every skill at level 3` (ASC-07 AC 1, 2; ASC-08 AC 6): copies `{ 'kael:8': 3 }`; Fusão row `'Kael Raizférrea 8★ → 9★'`; `Fundir`; `fusion-result` `'Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3'`; `skill-level-1`, `skill-level-2`, `skill-level-3` read `'Nv. 3'`; `skill-level-3` computed `backgroundColor` `'rgb(217, 165, 33)'`.
- `a 3-star leader shows no level badge` (ASC-08 AC 6): copies `{ 'kael:3': 1 }`; `.skill-level-badge` count 0.
- `a 4-star Kael's Corte Dimensional deals 31.875` (ASC-03 AC 2): copies `{ 'kael:4': 1 }`; health 1000; press `1`; `expect.poll(() => health(page))` `toBeCloseTo(968.125, 5)`.
- `a 9-star Kael's Corte Dimensional deals 72` (ASC-03 AC 4): copies `{ 'kael:9': 1 }`; press `1`; health `toBeCloseTo(928, 5)`.
- `a 9-star Kael clicks for 3.2` (ASC-06 AC 2): copies `{ 'kael:9': 1 }`; one `menu.canvas.click()` on the monster as in `clickPower.spec.js`; health `toBeCloseTo(996.8, 5)`.
- `the attribute panel of a 4-star leader reads 1.7, 45% and x2.75` (ASC-06 AC 5): copies `{ 'kael:4': 1 }`; click `hud-equipment`; `stat-clickDamage` `'Dano de clique: 1.7'`, `stat-critChance` `'Chance de crítico: 45%'`, `stat-critDamage` `'Dano crítico: x2.75'`.
- `the attribute panel of a 9-star leader reads 3.2, 70% and x4` (ASC-06 AC 5): copies `{ 'kael:9': 1 }`; `'Dano de clique: 3.2'`, `'Chance de crítico: 70%'`, `'Dano crítico: x4'`.
- `a 5-star hero shows purple stars, levels 2, 2 and 1 and its star power` (ASC-08 AC 1, 3, 4, 7): copies `{ 'kael:5': 1 }`; click `hud-heroes`; `hero-card-kael` `.hero-stars` text `'5★'`, class `/is-ascended/`, computed `color` `'rgb(122, 63, 160)'`; click the card; `skill-row-1` and `skill-row-2` `.skill-level` read `'Nível 2 · +25% de poder'`, `skill-row-3` `.skill-level` reads `'Nível 1'`; `hero-star-power` `'Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico'`; the skill bar shows `skill-level-1` and `skill-level-2` `'Nv. 2'` and no `skill-level-3`.
- `an 8-star hero shows gold stars and levels 3, 3 and 2` (ASC-08 AC 2, 4): copies `{ 'kael:8': 1 }`; `hero-card-kael` `.hero-stars` text `'8★'`, class `/is-exalted/`, computed `backgroundColor` `'rgb(217, 165, 33)'` and `color` `'rgb(32, 30, 29)'`; detail: `skill-row-1` and `skill-row-2` `.skill-level` `'Nível 3 · +50% de poder'`, `skill-row-3` `'Nível 2 · +25% de poder'`.
- `a 1-star hero shows Nível 1 on its unlocked skill and no level on the locked ones` (ASC-08 AC 3, 5): copies `{ 'kael:1': 1 }`; hero detail: `skill-row-1` `.skill-level` `'Nível 1'`; `skill-row-2` and `skill-row-3` have no `.skill-level`; `hero-star-power` `'Poder das estrelas: +10% de dano de clique'`.
- `a 9-star bag entry cannot be fused` (ASC-07 AC 4, 6; edge D12): copies `{ 'kael:9': 1 }`; click `hud-bag`; `bag-entry-kael-9` contains `'Kael Raizférrea 9★'` and `'x1'`; click it; `.bag-needed` `'Estrela máxima: não pode ser fundida'`; `bag-go-fusion` count 0.
- `a 3-star bag entry with 3 copies leads to the fusion` (ASC-07 AC 5): copies `{ 'kael:3': 3 }`; Mochila, click `bag-entry-kael-3`; `bag-entry-detail` contains `'Para fundir: 3/3'`; click `bag-go-fusion`; `fusion-row-kael-3` has class `/is-selected/`.
- `a failed 4-star fusion shows the error and keeps the row` (ASC-07 AC 7): `const backend = await mockBackend(...)` with copies `{ 'kael:4': 3 }`; open Fusão; set `backend.cardsOf('yan').copies['kael:4'] = 1`; click `fusion-button-kael-4`; `.hero-error` `'Não foi possível fundir as cartas.'`; `fusion-row-kael-4` `.fusion-copies` `'3/3'`; `fusion-result` count 0.
- `the level badge sits on the top right corner of the slot art` (ASC-08 AC 6, layout): copies `{ 'kael:4': 1 }`; the bounding box of `skill-level-1` has its right edge within 8 px of the right edge of `skill-slot-1 img` and its top within 8 px of the image top.

**Gate**: full - `cd game && npx playwright test e2e/heroAscension.spec.js`, then `cd game && npm test && npx playwright test`
**Done when**:

- [ ] The 15 scenarios pass twice in a row, and the whole Playwright and Vitest suites pass.

**Commit**: `test(game): cover hero ascension in the browser`

---

### T17: Visual review of the ascension UI [ ]

**Owner**: ui-artist
**What**: Review every player-visible change against the design's Visual spec and write the findings (ASC-08).
**Where**: `.specs/features/hero-ascension/ui-review.md` (new)
**Read first**: design sections Visual spec and Game views; spec sections Star Colours and story P2
**Depends on**: T16
**Requirement**: ASC-08

**Reference values**: tier 4 to 6 text `#7a3fa0` (5.8:1 on `#f5ead8`, 5.2:1 on `#ebddc5`); tier 7 to 9 chip background `#d9a521`, text `#201e1d` (7.4:1), glow `0 0 6px rgb(255 214 90 / 0.6)`, radius 999px, padding 0 8px; level pill purple `#7a3fa0` on `#efe4f5` (5.6:1) for levels 1 and 2, gold chip for level 3; badge purple `#7a3fa0` with `--color-bg` text at opacity 0.9 for level 2, `#d9a521` with `#201e1d` at opacity 1 for level 3. The gold repeats the LEGENDARY piece frame (`style.css:1919-1924`), the purple sits beside the EPIC frame `#9b59d0`.

**Steps**:

1. Run the game against the fake backend (`cd game && npx playwright test e2e/heroAscension.spec.js --headed`, or screenshots from those tests) and look at the states the design lists: a 3-star, a 4-star and a 7-star catalog card side by side (brown, purple, gold chip, each distinct at a glance); skill rows at level 1, 2, 3 and locked; the skill bar of a 3-star leader, a 5-star leader (`Nv. 2` on slots 1 and 2 only) and a 9-star leader (three gold `Nv. 3`), with `Q`, `W`, `E` still readable and the badge not covering the skill art's focal point; the hero detail with the star power line wrapping inside its column; the gold chip in the bag detail line `Estrelas: 9★`; the Fusão result line `· Brado Aterrador no nível 3`.
2. Check each reference value above against the computed styles; report any mismatch.
3. Write `ui-review.md` with a verdict (OK or CHANGES) and one numbered finding per problem (selector, what is wrong, the exact fix).
4. The orchestrator turns each finding into a new task appended to this file.

**Tests**: none - a visual review produces no code.
**Gate**: `test -s .specs/features/hero-ascension/ui-review.md`
**Done when**:

- [ ] `ui-review.md` exists with a verdict and covers the six states of step 1 and the reference values of step 2.

**Commit**: `docs(hero-ascension): add the ui review`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 → T2
Phase 2:  T3
Phase 3:  T4 → T5 → T6 → T7 → T8
Phase 4:  T9 → T10 → T11 → T12 → T13 → T14
Phase 5:  T15 → T16
Phase 6:  T17
```

Packing for workers (~7 tasks): batch 1 = Phases 1 and 2 (T1 to T3, `kotlin-backend-dev`); batch 2 = Phase 3 (T4 to T8, `game-dev`); batch 3 = Phase 4 (T9 to T14, `game-dev`; T9 may block on the owner's uncommitted `ClickerGame.js`); batch 4 = Phase 5 (T15, T16, `test-engineer`); then T17 (`ui-artist`). A fresh `test-engineer` that wrote none of these tasks runs as the Verifier afterwards.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 2 constants and 1 check in one class, plus the tests that pin the copy map | ✅ Granular |
| T2 | 1 field and 1 pure function, mapped into 1 response | ✅ Cohesive (domain + its response field) |
| T3 | 1 constant | ✅ Granular |
| T4 | 1 module's ranges and 2 helpers | ✅ Granular |
| T5 | 1 new module | ✅ Granular |
| T6 | 1 module's effect constants | ✅ Granular |
| T7 | 1 class | ✅ Granular |
| T8 | 1 table and 1 function | ✅ Granular |
| T9 | 1 method | ✅ Granular |
| T10 | 1 view module | ✅ Granular |
| T11 | 1 view function | ✅ Granular |
| T12 | 1 view function and its 1 caller | ✅ Cohesive |
| T13 | 1 view function | ✅ Granular |
| T14 | 1 stylesheet block | ✅ Granular |
| T15 | 1 fake handler | ✅ Granular |
| T16 | 1 e2e file | ✅ Granular |
| T17 | 1 review file | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend domain + repository + service tests | unit + integration | unit + integration | ✅ OK |
| T2 | Backend domain + web | unit + integration | unit + integration | ✅ OK |
| T3 | Backend domain, service, web | unit + integration | unit + integration | ✅ OK |
| T4 | Game domain | unit | unit | ✅ OK |
| T5 | Game domain | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game domain | unit | unit | ✅ OK |
| T9 | Game scene | unit (jsdom) | unit | ✅ OK |
| T10 | Game views | unit (jsdom) | unit | ✅ OK |
| T11 | Game views | unit (jsdom) | unit | ✅ OK |
| T12 | Game views + HeroUi | unit (jsdom) | unit | ✅ OK |
| T13 | Game views + HeroUi | unit (jsdom) | unit | ✅ OK |
| T14 | Game CSS | none | none | ✅ OK (checked in T16 and T17) |
| T15 | e2e support | e2e | e2e (regression) | ✅ OK |
| T16 | e2e | e2e | e2e | ✅ OK |
| T17 | Review document | none | none | ✅ OK |
