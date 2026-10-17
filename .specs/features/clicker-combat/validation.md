# clicker-combat Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/clicker-combat/spec.md`
**Diff range**: `48e783d..HEAD` (4eb5977, 80af7b6, ab4e173), `game/src` only
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS

Gate: `npx vitest run` in `game/`: 10 files, 99 tests passed, 0 failed.

---

## Task Completion

No tasks.md exists for this feature (spec-only); all three commits are present and the gate is green.

---

## Spec-Anchored Acceptance Criteria

Spec IDs map in order: CLK-01..05 = P1 Hit the monster ACs 1-5, CLK-06..08 = Health bar ACs 1-3, CLK-09 = P1 AC 6.

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| CLK-01 one black-square character, one monster, no coins | exactly 1 black, 1 monster, no text/score/physics | `game/src/scenes/ClickerGame.test.js:96` `expect(byColor(0x000000)).toHaveLength(1)`; `:97` `expect(byColor(0xcc2222)).toHaveLength(1)`; `:99` `expect(scene.add.text).not.toHaveBeenCalled()`; `:100` `expect(scene.physics).toBeUndefined()` | PASS (see precision gap P1) |
| CLK-02 click anywhere reduces health by 1 | 10 -> 9 | `game/src/scenes/ClickerGame.test.js:108` `expect(scene.monster.health).toBe(9)`; `game/src/combat/monster.test.js:14` `expect(monster.health).toBe(9)` | PASS |
| CLK-03 text "1" above monster, rises 40 px, fades over 800 ms | text '1', y-40, alpha 0, duration 800 | `game/src/scenes/ClickerGame.test.js:117` `expect(texts[0].text).toBe('1')`; `:119` `toBeLessThan(monster.y - monster.height / 2)`; `:120-125` tween `y: texts[0].y - 40, alpha: 0, duration: 800` | PASS |
| CLK-04 number removed after fade | destroy called on complete | `game/src/scenes/ClickerGame.test.js:135` `expect(texts[0].destroy).toHaveBeenCalledTimes(1)` (not called before, `:131`) | PASS |
| CLK-05 health 0 -> 10 and bar refilled | 10 and 120 px | `game/src/combat/monster.test.js:31` `expect(monster.health).toBe(10)`; `game/src/scenes/ClickerGame.test.js:150-151` `toBe(10)`, `expect(fill.width).toBe(120)` | PASS |
| CLK-06 bar centred above monster, fill = health/max * 120 | back centre x = monster.x, width 120, 16 px gap | `game/src/scenes/ClickerGame.test.js:170` `expect(back.x + back.width / 2).toBe(monster.x)`; `:173` `expect(fill.width).toBe(120)`; `:175` `expect(back.y + back.height).toBe(monster.y - monster.height / 2 - 16)`; `:146` `expect(fill.width).toBe(12)` | PASS |
| CLK-07 fill width updates on health change (same frame) | 108 px after 1 click | `game/src/scenes/ClickerGame.test.js:183` `expect(fill.width).toBe(108)` (synchronous in click handler) | PASS |
| CLK-08 overkill hit -> health 10, width 120, never negative | health 10 | `game/src/combat/monster.test.js:41` `expect(monster.health).toBe(10)` (hit(5) at 2 hp); scene width on refill `ClickerGame.test.js:151` | PASS (scene-level width for overkill is only via 10th-click path; fine, scene damage is fixed 1) |
| CLK-09 no GameOver scene registered | scene list excludes GameOver | No unit test. Judged by code evidence: `game/src/main.js:27-32` scene array is `Boot, Preloader, MainMenu, ClickerGame`; no `GameOver` import in `game/src/main.js:1-5`; `game/src/scenes/GameOver.js` deleted; `grep GameOver game/src game/e2e game/index.html` returns nothing | PASS (by inspection, no automated test) |
| Edge: faster clicks -> one number per click | 2 clicks, 2 independent texts/tweens | `game/src/scenes/ClickerGame.test.js:160` `expect(texts).toHaveLength(2)`; `:162` `expect(tweens[0].targets).not.toBe(tweens[1].targets)` | PASS |
| Edge: click on monster = 1 damage, once | single handler on scene input | `game/src/scenes/ClickerGame.test.js:108` (one handler, one hit); monster-only mutant killed | PASS |

**Status**: all ACs covered; 1 spec-precision gap (low severity), 1 un-tested AC (CLK-09, covered by inspection).

**Spec-precision gaps**
- P1: CLK-01 says only "black square"; size 100x100 and monster 160x200 live in the Assumptions table (unconfirmed) and are not asserted by any test. Mutants `size 100->90` and `monster width 160->150` survive.

---

## Discrimination Sensor

Scratch: temp copy of `game/` (node_modules junctioned), discarded afterwards. Real tree `git status --porcelain` identical to baseline (` M game/src/scenes/MainMenu.js`, `?? .specs/LESSONS.md`, `?? .specs/lessons.json`, plus this file).

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| 1 | `game/src/combat/monster.js:1` | damage 1 -> 2 | Killed (6 failed) |
| 2 | `game/src/combat/monster.js:2` | max health 10 -> 11 | Killed (7) |
| 3 | `game/src/combat/monster.js:16` | no respawn (health stays 0) | Killed (3) |
| 4 | `game/src/scenes/ClickerGame.js:40` | bar width not updated | Killed (2) |
| 5 | `game/src/scenes/ClickerGame.js:7` | rise 40 -> 30 | Killed (1) |
| 6 | `game/src/scenes/ClickerGame.js:7` | duration 800 -> 400 | Killed (1) |
| 7 | `game/src/scenes/ClickerGame.js:55` | text not destroyed on complete | Killed (1) |
| 8 | `game/src/scenes/ClickerGame.js:34` | click handler only on monster | Killed (8) |
| 9 | `game/src/scenes/ClickerGame.js:26` | bar off-centre (barX = monster.x) | Killed (1) |
| 10 | `game/src/scenes/ClickerGame.js:48` | damage text x offset from monster | Killed (1) |
| 11 | `game/src/scenes/ClickerGame.js:40` | fill width divisor max+1 | Killed (2) |
| 12 | `game/src/scenes/ClickerGame.js:6` | bar gap 16 -> 10 | Killed (1) |
| 13 | `game/src/scenes/ClickerGame.js:48` | text string damage+1 | Killed (1) |
| 14 | `game/src/scenes/ClickerGame.js:21` | add a "Score" text (coin/score regression) | Killed (4) |
| 15 | `game/src/scenes/ClickerGame.js:4` | character size 100 -> 90 | SURVIVED |
| 16 | `game/src/scenes/ClickerGame.js:5` | monster width 160 -> 150 | SURVIVED |
| 17 | `game/src/scenes/ClickerGame.js:20` | remove background image | SURVIVED (background is an assumption, not an AC; informational) |

**Sensor depth**: lightweight (extended, 17 mutants)
**Result**: 14/17 killed; survivors 15-16 are layout dimensions that no AC states precisely (spec-precision gap P1), 17 is not an AC. Treated as non-blocking, PASS.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS |
| Surgical changes (MainMenu.js uncommitted change is unrelated, ignored) | PASS |
| No scope creep | PASS |
| Matches patterns | PASS |
| Spec-anchored outcome check (asserted values match spec) | PASS |
| Every test maps to a spec requirement | PASS |
| Documented guidelines followed | none - strong defaults applied |

---

## Edge Cases

Both spec edge cases covered (see table above).

## Ranked gaps (non-blocking)

1. Character/monster dimensions unasserted - CLK-01 / Assumptions - `game/src/scenes/ClickerGame.js:4-5`.
2. CLK-09 has no automated test - `game/src/main.js:27-32`.
3. Background retention not asserted (assumption only) - `game/src/scenes/ClickerGame.js:20`.
