# Hero Skills Validation

**Date**: 2026-10-21
**Spec**: `.specs/features/hero-skills/spec.md`
**Diff range**: `85264c7..bdbde1d` (`git diff 85264c7..HEAD -- game/ ':!game/src/scenes'`, HEAD = bdbde1d)
**Verifier**: independent sub-agent (author != verifier), iteration 3 of 3
**Verdict**: PASS. Every AC has located evidence matching the spec; 0 non-equivalent mutants survive.

Test file keys: SC = `game/src/domain/skills/skillCombat.test.js`, SD = `skillDamage.test.js`, CAT = `skillCatalog.test.js`, CG = `game/src/adapters/phaser/ClickerGame.test.js`, HU = `HeroUi.test.js`, SB = `views/skillBar.test.js`, SE = `views/skillEffects.test.js`, BC = `game/src/domain/campaign/bossCountdown.test.js`, E2E = `game/e2e/skills.spec.js`. Line numbers are of the `it(` or the quoted assertion at HEAD.


Full-path anchors for the key evidence (same line numbers as the short keys): `game/src/adapters/phaser/ClickerGame.test.js:2665` (aimed shot number `60`, peach, 48), `game/src/adapters/phaser/ClickerGame.test.js:2668` (cast paused), `game/src/adapters/phaser/ClickerGame.test.js:2684` (ticks paused), `game/src/domain/skills/skillCombat.test.js:436` (aimed shot 60 critical), `game/src/domain/skills/skillDamage.test.js:11` (9.75), `game/e2e/skills.spec.js:38` (key 1, 15 damage).

---

## Iteration 1 (FAIL, 85264c7..c048f7d)

Gaps: P1 AC10 critical styling not asserted; Tempestade damage type unpinned; Stun/Root tag deviation unlogged; P2 AC11 restart test waited for the end; Fumaca cap at 100 undiscriminated; pause asserted only for cooldowns; scene exits, farm kill, tick kill and leader change untested; tasks.md `Draft`. Closed in ecdf03e (checked in iteration 2: CG:2501, CAT:17, spec amended, SC:204, SD:78, CG:2522/2539/2550, CG:2562-2642, status Done).

## Iteration 2 (FAIL, 85264c7..ecdf03e)

Gaps: (1) mutant M1b, critical flag dropped for tick and aimed-shot numbers in `update`; (2) partial-pause mutants N4 (cast runs down while paused) and N5 (dots run down while paused); (3) stray tracked `game/src/scenes/ClickerGame.js`; (4) two test titles claiming a surviving buff.

## Iteration 3 (this report): iteration 2 gaps checked at bdbde1d

| # | Claimed fix | Evidence | Result |
| - | ----------- | -------- | ------ |
| 1 | aimed shot number is critical | CG:2659 `shows the aimed shot as a critical number of 60 when the cast ends`; CG:2665 `expect(ctx.texts.at(-1)).toMatchObject({ text: '60', style: expect.objectContaining({ color: '#ffc6a5', fontSize: 48 }) })`; M1b re-injected in scratch: KILLED by that test | Fixed |
| 2 | pause runs cast and dots down only when not paused | CG:2668 pause 5000 ms, resume, update 1 ms: `monster.health toBe(1000)`, slot `data-state 'casting'`, then 1999 ms: `health toBe(940)`; N4 re-injected: KILLED (`expected 940 to be 1000`). CG:2684 same with Tempestade, 999 ms after resume `health toBe(1000)`, then 1 ms `toBe(998)`; N5 re-injected: KILLED (`expected 990 to be 1000`) | Fixed |
| 3 | stray file untracked | `git ls-files game/src/scenes` is empty; `game/src/scenes/ClickerGame.js` still on disk (untracked, owner's file); imported nowhere | Fixed |
| 4 | titles | CG:2562 `... when the boss runs out of time`, CG:2596 `... when a farm fight starts` now match the empty-tag assertions | Fixed |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T13 (tasks.md) | Done | All checkboxes ticked, header `Status: Done`; commits c7e3401..ecdf03e |

---

## Spec-Anchored Acceptance Criteria

### P1: Use a skill

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 click on ready unlocked slot applies the mechanic | Kael slot 1: 15 damage | CG:2305 slot click; CG:2283 `monster.health toBe(985)`; E2E:61 click on the slot, damage read; HU:615 `useSkill` hook called with the slot | PASS |
| AC2 keys 1/2/3 = slot click | key ONE 15; TWO and THREE 4 | CG:2283 `health toBe(985)`, `texts.at(-1).text toBe('15')`; CG:2294 `health toBe(996)`; E2E:38 key 1 | PASS |
| AC3 cooldown starts for hero and slot | 20 s on use; all 15 | SC:13 (state cooling 20); CAT:8 `cooldownMs/1000 toEqual(seconds)` for five heroes; SC:111 keyed by hero and slot; mutant no cooldown (M30) KILLED | PASS |
| AC4 locked, cooling, paused, hero screen, no monster: unchanged | no damage, cooldown not started | locked SC:59 and CG:2328; cooling SC:70; paused CG:2349 `slotText '20s'`, `health 985`; hero screen CG:2361; no monster SC:80, CG:2371, CG:2378 | PASS (hero-screen guard redundant with the pause it causes: equivalent) |
| AC5 hit = P % of Base, skill damage type | per-skill P and type | SD:11-47 values; CAT:17 types of all 15, CAT:27 `hits` percents | PASS |
| AC6 Corte Dimensional Base 1, FIRE def 50 | 9.75 | SD:11 `toEqual({ damage: 9.75, critical: false })` | PASS |
| AC7 Flecha Dupla two hits, a roll each | two hits | SC:25 `hits toEqual([{damage:6,critical:true},{damage:3,critical:false}])` | PASS |
| AC8 Luz Divina x1.5 vs DARKNESS | 1.5 times | SD:26; SC:53 (mutant no darkness bonus M13 KILLED) | PASS (spec-precision note: the DARKNESS expectation contains the 0.9 element factor, ratio proven through the product) |
| AC9 Chuva 2500 % MAGICAL, Investida 400 %, Golpe 600 % | 25, 4, 6 | SC:46 `damage 20/6`, SC:53 `toBe(4)`; CAT:27 types | PASS |
| AC10 number like a click's, larger and peach when critical | cream 32 / peach 48 | CG:2501 `style objectContaining({ color: '#ffc6a5', fontSize: 48 })` for a skill hit; CG:2512 tick cream. Hits shown from `update`: aimed shot CG:2665 | PASS (aimed shot number CG:2665 `text '60'`, peach `#ffc6a5`, `fontSize 48`; M1b KILLED) |
| AC11 skill or tick kill = click kill | coins, report, farm win | CG:2385 `sprites toHaveLength(3)`, `report toHaveBeenCalledWith(... 'CLEARED')`; CG:2402 `dead true`, fade; CG:2621 tick kill `sprites 3` and `CLEARED`; CG:2606 farm: `farmGateway.win toHaveBeenCalledTimes(1)`, `sprites toHaveLength(0)`, `report not called`; M21, M22 KILLED | PASS |
| AC12 first arrow kills, no second | one hit | SC:36 `hits toHaveLength(1)`; M14 KILLED | PASS |
| AC13 cooling shows `data-state="cooling"` and `<left>s` ceil | `7s`, `15s` | SB:83 `['cooling','casting','ready']`, `['7s','Mirando','30s']`; SC:97 ceil; CG:2313 `'15s'`; M20 KILLED | PASS |
| AC14 ready shows `ready` and `<cooldown>s` | `10s` | SB:92 `data-state 'ready'`, `'10s'`; CG:2313 | PASS |
| AC15 leader change shows that hero's cooldowns | new leader slot ready, old one still cooling | CG:2642 `ready` after the change to Lyra, then `cooling` and `'20s'` back on Kael; HU:638 `cooling`, `'4s'`; N2 KILLED | PASS |
| AC16 pause freezes every cooldown | unchanged | CG:2349 `slotText toBe('20s')` after `update(0,10000)` paused | PASS |

### P2: Timed effects

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 Ventos +50 % 12 s | 1.5, ends at 12 s | SC:146 `toBe(1.5)`, gone at 12000; SD:50; CG:2419 `'Ventos Ligeiros 12s'`; M17 KILLED | PASS |
| AC2 Bênção +25 % click, x1.3 physical, 15 s | 1.3 / none on magical | SD:58 `1.3` / `1`; SC:161 `seconds` at 15 s; M6, M29 KILLED | PASS |
| AC3 Ventos + Bênção Base-1 click | 2.275 | SC:172 `toBeCloseTo(2.275,10)`; SD:54 | PASS |
| AC4 Fumaça +15 points, cap 100, 10 s | +15, cap, 10 s | SD:65 roll 20 crits at 25 %, not at 10 %; SD:78 cap discriminated; SC:161 ends at 10 s; M4, M27 KILLED | PASS |
| AC5 Brado -30 points floor 0, 10 s | 0.8, 0.5, 1 | SD:87 `0.8`, `1`; SC:182 `0.8` then `0.5`; M5 KILLED | PASS |
| AC6 Prisão x1.25 magical 2 s | 31.25 | SC:193 `hits[0].damage toBe(31.25)`, ends at 2000; SD:98; M28 KILLED | PASS |
| AC7 Tempestade 6 magical ticks of 200 %, first at 1 s | 6 x 2, none before 1 s | SC:290 `advance(999).hits toEqual([])`, counts `[1,1,1,1,1,1,0,0]`, `ticks[0] toEqual([{damage:2,critical:false}])`, `health 988`; CAT:17 MAGICAL; M2, M16 KILLED | PASS |
| AC8 Veneno stack up to 3, restart 8 s | x3 and tick 3 after 4 casts | SC:324 `x1`, `seconds 8`, `health 992`; SC:337 `x3`, `seconds 8`, `damage 3`; CAT:45; M7 KILLED | PASS |
| AC9 Golpe Sangrento bleed 6 x 150 % | hit 6, 6 ticks of 1.5 | SC:353 `hits toEqual([{damage:6}])`, counts, `ticks[0] 1.5`, `health 1000-6-9`; SC:366 no bleed on kill | PASS |
| AC10 no critical on a tick | false at chance 100 | SC:315 `critical false` with `critChance:100`; SD:107; CG:2512 tick cream; M9 KILLED | PASS |
| AC11 re-use restarts duration, no stacking | back to 12 s | SC:204 `effects toEqual([{label:'Ventos Ligeiros', seconds:12}])`, `damage toBe(1.5)`; Poison SC:337; M3 KILLED | PASS |
| AC12 monster dies or leaves ends Brado, Prisão, Stun/Root, Tempestade, Poison, Bleed | effects gone | dies SC:217, SC:376; other monster SC:228; none SC:241; Stun ends SC:541; scene exits CG:2562 timeout, CG:2574 leave, CG:2586 realign, CG:2596 farm start (`tags ''`); N1, N6, M25 KILLED | PASS (CG:2562 and CG:2596 titles say "keeping the buffs" / "a buff survives" but assert only the empty tag; buff survival is covered by SC:217, CG:2432) |
| AC13 Ventos, Bênção, Fumaça survive monster death and leader change | tags still listed | SC:217 `[Ventos 12]`; SC:267; CG:2432 `'Ventos Ligeiros 10s'` after death | PASS |
| AC14 tag `<name> <left>s`, Poison `x<stacks>`, start order; Stun/Root no tag | text and order | SE:5 `toEqual(['Ventos Ligeiros 12s','Bomba de Veneno x2 5s'])`; SC:251 order; SC:324 `x1`; CG:2419; spec amended; M19 KILLED | PASS |
| AC15 pause freezes every effect and tick | unchanged | CG:2522 Ventos `12s` and health 1000 after 12 s paused; CG:2539 Tempestade health 1000 after 5 s paused; M12 KILLED | PASS (CG:2684 `health toBe(1000)` 999 ms after a 5 s pause, then `998`; N5 KILLED) |

### P3: Boss control and the aimed shot

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 Investida on a boss stops it 3 s | `Time: 30` after 3000, `29` after 1001 more | SC:487 `countdownMs(1000)` 0,0,0 then `1000`; CG:2445 `timer 'Time: 30'`, `'Time: 29'` | PASS |
| AC2 Prisão on a boss stops it 2 s | frame 2500 runs 500 | SC:511 `countdownMs(2500) toBe(500)` | PASS |
| AC3 Stun + Root until the later ends | not summed | SC:520 `toBe(500)`; M15 KILLED | PASS |
| AC4 Carrilhão on a boss +4 s | +4000 each time | SC:552 `extendMs 4000` twice; BC `remainingMs toBe(37000)`; CG:2456 `'Time: 34'`; M26 KILLED | PASS |
| AC5 phase monster: damage and Prisão's bonus only | no freeze, no extend | SC:531 `countdownMs(1000) toBe(1000)`; SC:552 `extendMs 0`; CG:2464 `timer ''`; M8, M11 KILLED | PASS |
| AC6 Tiro Preciso `casting` / `Mirando` 2 s | state casting at 1999 ms | SC:426 `slotState state 'casting'` at 0 and 1999; SB:83 `'casting'`, `'Mirando'`; CG:2522 `data-state 'casting'` | PASS |
| AC7 cast ends: PHYSICAL critical 3000 % ignoring resistance | 60; 90 with boss damage and resistance 100 | SC:436 `hits toEqual([{damage:60,critical:true}])`, `health 940`; SC:441 `[{damage:90,critical:true}]`; M24 KILLED | PASS (domain); scene number CG:2665 `text '60'` critical |
| AC8 monster died/left: nothing lands, cooldown runs | no hit, `cooling 28` | SC:450 `hits []`, `{cooling,28}`; SC:461; SC:474; M10 KILLED | PASS |
| AC9 pause freezes cast and countdown stops | unchanged | CG:2522 `casting` after 12 s paused, `health 940` after 2 s resumed; CG:2550 `Time: 30`; M12 and N3 KILLED | PASS (CG:2668 `health toBe(1000)` then `940`; N4 KILLED) |

### Edge Cases

| Edge case | `file:line` + assertion | Result |
| --- | --- | --- |
| Heroes not loaded ignore 1/2/3 | CG:2341 `health toBe(1000)` | PASS |
| Leader with 0 stars ignores every slot and key | CG:2328 `health 1000`, `data-state 'locked'` | PASS |
| Key while the pause menu is open | CG:2349 `health 985` | PASS |
| Chapter complete, no monster | CG:2378 `not.toThrow`, `data-state 'ready'` | PASS |
| Carrilhão repeated adds 4 s each time | SC:552 two `extendMs 4000`; BC `37000` | PASS |

**Status**: All 40 criteria and 5 edge cases have located evidence matching the spec outcome. One spec-precision note (P1 AC8: the DARKNESS expectation contains the 0.9 element factor; the ratio is proven through the product).

---

## Discrimination Sensor

Scratch: `git worktree add --detach` of bdbde1d under the scratchpad, `game/node_modules` copied (no junction or symlink; `find -type l` 0 and 0 reparse points before deletion), removed with plain `rm -rf`, then `git worktree remove` and `prune`. Baseline in scratch 799 green. Command per mutant: `npx vitest run --bail 1`; sources restored with `git checkout -- src` between mutants. No `git stash`. Sensor depth: expanded (14 mutations this iteration, on top of the 36 of iteration 2 whose killers are unchanged).

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| M1b | ClickerGame.js `update` | critical flag dropped (`false`) in the numbers of ticks and aimed shot | Killed (CG:2659) |
| N4 | ClickerGame.js `update` | paused frame still runs the cast down by `delta` | Killed (CG:2668) |
| N5 | ClickerGame.js `update` | paused frame still runs the dots' timers down by `delta` | Killed (CG:2684) |
| P1 | skillCombat.js `tickHit` | tick ignores the stack count | Killed |
| P2 | skillCombat.js `landCast` | aimed shot not forced critical | Killed |
| P3 | skillCombat.js `advance` | cooldowns run at half speed | Killed |
| P4 | skillCombat.js `startDot` | poison gains 2 stacks, max 4 | Killed |
| P5 | skillCombat.js `advance` | Stun/Root stop never runs down | Killed |
| P6 | skillCombat.js `slotState` | casting seconds floor instead of ceil | Survived, equivalent (a casting slot shows `Mirando`; `seconds` is unread, skillBar.js `slotText`) |
| P7 | skillDamage.js `clickDamage` | Ventos and Bencao click bonuses take the max instead of adding | Killed |
| P8 | skillCombat.js `advance` | cast does not run down when the monster is dead | Survived, equivalent (`follow` already clears the cast of a dead monster at the top of `advance`) |
| P9 | ClickerGame.js `update` | boss countdown ignores the Stun/Root stop | Killed |
| P10 | skillCombat.js `startDot` | first tick at 0 ms | Killed |
| P11 | skillDamage.js `strike` | Luz Divina darkness bonus dropped | Killed |

Iteration 2 results unchanged: M18 and M23 equivalent; the other 31 killed.

**Result**: 14 injected this iteration, 12 killed, 2 equivalent, 0 non-equivalent survivors. Cumulative with iteration 2: 50 injected, 43 killed, 4 equivalent (M18, M23, P6, P8), 0 non-equivalent survivors (M1b, N4, N5 now killed) - PASS.

**Isolation**: `git status --porcelain` identical before and after: ` M backend/src/main/resources/application.yaml`, `?? .idea/`, `?? .specs/features/hero-skills/validation.md`, `?? game/public/assets/coin-{copper,gold,silver}.png`, `?? game/src/scenes/`. Real `game/node_modules` untouched (91 entries).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep | Pass: `game/src/scenes/ClickerGame.js` is no longer tracked (`git ls-files game/src/scenes` empty), still on disk as the owner's file; no backend change in the diff |
| Surgical changes | Pass for the feature code: shared `leaderAttacker` / `afterDamage` |
| Matches patterns | Pass |
| Spec-anchored outcome check | Pass |
| Per-layer coverage | Domain 1:1; scene covers guards, keys, pause (cooldowns, effects, ticks, cast, countdown), kills, exits, leader change, numbers |
| Every test maps to a spec requirement | Pass |
| Documented guidelines followed | `game/vitest.config.js`, `game/playwright.config.js`, CLAUDE.md (push after commit) |

---

## Gate Check

- **Gate command**: `cd game && npm test && npm run build`, then `npx playwright test e2e/skills.spec.js` (run in the scratch at bdbde1d)
- **Unit**: 799 passed, 0 failed, 0 skipped
- **Build**: succeeded (only the pre-existing chunk-size warning)
- **E2E skills.spec.js**: 3 passed
- **Delta**: +3 tests since iteration 2 (796 to 799)
- **Failures**: none

---

## Fix Plans

None required.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| SKILL-01 | Verified | Verified |
| SKILL-02 | Verified | Verified |
| SKILL-03 | Verified | Verified |
| SKILL-04 | Verified | Verified |
| SKILL-05 | Verified | Verified |
| SKILL-06 | Verified | Verified |
| SKILL-07 | Verified | Verified |
| SKILL-08 | Verified | Verified |

(The Verifier does not edit spec.md; this is the proposed update.)

---

## Summary

**Overall**: Ready (PASS)

**Spec-anchored check**: 40 of 40 criteria and 5 of 5 edge cases matched the spec outcome with a located assertion; 1 spec-precision note (P1 AC8).
**Sensor**: 0 non-equivalent survivors (M1b, N4, N5 killed; 4 equivalent survivors justified).
**Gate**: 799 unit passed, build ok, skills e2e 3 passed.
