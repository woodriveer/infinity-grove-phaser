# monster-death Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/monster-death/spec.md`
**Diff range**: `4832bb8^..4832bb8` (single commit `4832bb8`): `game/src/combat/monster.js`(+test), `game/src/scenes/ClickerGame.js`(+test)
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS

Gate: `npx vitest run` in `game/` at current HEAD (ed29196): 10 files, 112 passed, 0 failed. With the 4832bb8 file contents: 108 passed (later commits e47271a and a3986d8 add tests; the sensor ran against the 4832bb8 contents).

---

## Task Completion

No tasks.md (spec-only feature). Commit 4832bb8 present, gate green. Test count: 99 before to 108 after (2 obsolete immediate-respawn tests removed, 11 covering death/respawn added).

---

## Spec-Anchored Acceptance Criteria

IDs map in order: DEATH-01..04 = P1 "Monster fades out" ACs 1-4, DEATH-05..07 = P1 "Next monster spawns" ACs 1-3. Line numbers refer to 4832bb8 (`git show 4832bb8:game/<path>`).

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DEATH-01 health 0 -> body and bar fade alpha 1 to 0 over 500 ms | tween on body + back + fill, alpha 0, duration 500, only on the 10th click | `game/src/scenes/ClickerGame.test.js:147` `expect(fadeTween(ctx)).toBeUndefined()` (after 9 clicks); `:151` `expect(fadeTween(ctx)).toEqual(expect.objectContaining({ alpha: 0, duration: 500 }))`; `:152` `expect(fadeTween(ctx).targets).toEqual([ ctx.monster, ctx.back, ctx.fill ])` | PASS (see gap G2) |
| DEATH-02 health 0 -> fill 0 px | fill width 0 | `game/src/scenes/ClickerGame.test.js:160` `expect(ctx.fill.width).toBe(0)` | PASS |
| DEATH-03 killing click shows its damage number | 10 texts, 10th is '1' | `game/src/scenes/ClickerGame.test.js:168` `expect(ctx.texts).toHaveLength(10)`; `:169` `expect(ctx.texts[9].text).toBe('1')` | PASS |
| DEATH-04 while dead clicks ignored: no damage, no number | health stays 0, no new text, no new tween | `game/src/scenes/ClickerGame.test.js:180` `expect(ctx.scene.monster.health).toBe(0)`; `:181` `toHaveLength(10)`; `:182` `expect(ctx.tweens).toHaveLength(tweenCount)`; unit: `game/src/combat/monster.test.js` "ignores hits while dead" `expect(landed).toBe(false)`, `expect(monster.health).toBe(0)` | PASS |
| DEATH-05 fade ends -> wait 1000 ms before spawn | no timer before fade completes; after onComplete one timer with delay 1000; still dead | `game/src/scenes/ClickerGame.test.js:188` `expect(ctx.timers).toHaveLength(0)`; `:192` `toHaveLength(1)`; `:193` `expect(ctx.timers[0].delay).toBe(1000)`; `:194` `expect(ctx.scene.monster.health).toBe(0)` | PASS |
| DEATH-06 wait ends -> health 10, alpha 1, fill 120 | health 10, three parts alpha 1, fill 120 | `game/src/scenes/ClickerGame.test.js:205` `expect(ctx.scene.monster.health).toBe(10)`; `:206` `expect([ ctx.monster.alpha, ctx.back.alpha, ctx.fill.alpha ]).toEqual([ 1, 1, 1 ])`; `:207` `expect(ctx.fill.width).toBe(120)` (parts preset to alpha 0 at `:201`) | PASS |
| DEATH-07 next monster takes 1 damage per click | health 9, fill 108, a new number | `game/src/scenes/ClickerGame.test.js:218` `expect(ctx.scene.monster.health).toBe(9)`; `:219` `expect(ctx.fill.width).toBe(108)`; `:220` `expect(ctx.texts).toHaveLength(11)` | PASS |
| Edge: click during fade or 1000 ms wait leaves health and numbers unchanged | health 0, texts unchanged | `game/src/scenes/ClickerGame.test.js:180-182` (clicks while dead, before the fade completes) | PASS for the fade phase; wait phase only implied (gap G1) |

**Status**: all 7 ACs and the edge case covered with exact spec values; 2 low-severity precision gaps.

**Gaps (non-blocking)**
- G1: The wait phase (fade complete, timer pending) is never clicked in a test. The dead guard is state-based (`health === 0`) so behaviour is identical, but a mutant gating clicks on a "fading" flag cleared at onComplete would survive.
- G2: DEATH-01 says "from alpha 1"; the test asserts only target alpha 0 and duration 500. Start value is the Phaser default and the spec sets no easing, so accepted.
- G3: Spec traceability table still shows status "Implementing" and "0 mapped to tasks" (documentation only).

**Real Phaser 3.80.1 sanity check** (`game/node_modules/phaser`): `Rectangle.setSize` (`src/gameobjects/shape/rectangle/Rectangle.js:82-89`) sets width/height, resizes the geom and calls `updateData`, matching the stand-in's `width` assertion; a 0 px fill draws nothing. Rectangle has the Alpha component, so tweening `alpha` and `setAlpha(1)` behave as stubbed. `tweens.add` accepts an array for `targets` and calls `onComplete` once all targets finish (the test invokes it directly). `scene.time.delayedCall(delay, cb)` is the real Clock API; the timer starts when onComplete runs, so the 1000 ms counts from the end of the fade as specified. Timers and tweens are scene-owned and cleaned on shutdown. No behavioural divergence found; real wall-clock timing (1.5 s total) is not verifiable in unit tests (no e2e for this feature).

---

## Discrimination Sensor

Scratch: temp copy of `game/` (node_modules junctioned) populated with the 4832bb8 file contents, discarded afterwards. Scratch baseline: 108 passed. All 21 mutants killed.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| 1 | `ClickerGame.js:8` | fade 500 -> 400 | Killed (1 failed) |
| 2 | `ClickerGame.js:64` | fade alpha target 0 -> 0.5 | Killed (1) |
| 3 | `ClickerGame.js:63` | fade body only | Killed (4) |
| 4 | `ClickerGame.js:63` | fade bar parts only (no body) | Killed (1) |
| 5 | `ClickerGame.js:63` | fade without the fill | Killed (1) |
| 6 | `ClickerGame.js:8` | respawn delay 1000 -> 500 | Killed (1) |
| 7 | `ClickerGame.js:62-67` | delay starts at death, not after the fade | Killed (3) |
| 8 | `monster.js:32` | respawn health 9 | Killed (3) |
| 9 | `monster.js:32` | respawn health 11 | Killed (3) |
| 10 | `ClickerGame.js:74` | alpha not restored | Killed (1) |
| 11 | `ClickerGame.js:74` | alpha restored on body only | Killed (1) |
| 12 | `ClickerGame.js:73` | fill not reset on respawn | Killed (1) |
| 13 | `ClickerGame.js:73` | fill reset to 108 on respawn | Killed (1) |
| 14 | `monster.js:20-23` | removed dead guard in hit (clicks accepted while dead) | Killed (2) |
| 15 | `ClickerGame.js:41` | scene ignores hit() result | Killed (1) |
| 16 | `monster.js:27` | hit() always returns false | Killed (12) |
| 17 | `ClickerGame.js:47` | killing-click damage number suppressed | Killed (3) |
| 18 | `ClickerGame.js:46` | fill not zeroed on death | Killed (1) |
| 19 | `ClickerGame.js:49-52` | no fade at all | Killed (4) |
| 20 | `monster.js:25` | old behaviour: instant respawn at 0 | Killed (9) |
| 21 | `monster.js:14` | `dead` is health <= 1 | Killed (7) |

**Sensor depth**: lightweight, extended (21 mutants). **Result**: 21/21 killed - PASS.

Isolation: the real tree was never edited. Note: between dispatch and verification HEAD advanced (e47271a, a3986d8, ed29196) and the real `git status --porcelain` was already empty (MainMenu and lessons files committed), so the dirty baseline named in the task no longer applied; after cleanup it contains only this file.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (no extra flag state, `dead` derived from health) | PASS |
| Surgical changes (4 source files + spec) | PASS |
| No scope creep (no particles, spawn animation, rewards) | PASS |
| Matches existing patterns (Allman braces, constant objects) | PASS |
| Tests map to ACs; obsolete CLK-05/CLK-08 refill tests replaced, not weakened | PASS |
| Project testing guidelines | none - strong defaults applied |
