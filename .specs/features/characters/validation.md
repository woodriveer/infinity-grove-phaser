# Characters Validation

**Date**: 2026-10-18
**Spec**: `.specs/features/characters/spec.md`
**Diff range**: `ab9cc9f..HEAD` (HEAD = `8d52b14`; iteration 1 verified up to `e273118`, iteration 2 adds `247143f` T52 and `8d52b14` T53)
**Verifier**: independent sub-agent (author ≠ verifier), iteration 2 of at most 3

---

## Iteration history

| Iteration | HEAD | Verdict | Summary |
| --------- | ---- | ------- | ------- |
| 1 | `e273118` | FAIL | 55/63 ACs; 5 AC gaps (Reg 5, Drop 10, Drop 11, Fusion 9, Fusion 11), label gap (Screens 5), missing 27-card e2e (success criterion), leader-unchanged edge case; sensor 17/22 killed (M11, M12, M14, M15, G7 survived) |
| 2 | `8d52b14` | PASS | all 7 gaps closed by tests only (no production change); every previously surviving mutant now killed plus 3 new mutants killed (10/10); gates green; 1 spec-precision gap remains flagged (Screens 8, non-blocking) |

The iteration 2 Verifier re-derived the evidence from the code, not from the T52/T53 Done-when boxes. `git show 247143f 8d52b14` touches only test files (`LogCapture.kt`, `CardsAtomicityIT.kt`, `CardsFlowIT.kt`, `HeroControllerIT.kt`, `HeroServiceTest.kt`, `ProgressServiceTest.kt`, `bagView.test.js`, `e2e/heroes.spec.js`) plus `.specs` files; no production file and no existing assertion was changed or removed (the `CardsFlowIT` and `bagView.test.js` hunks only add lines).

---

## Task Completion

Every task T1..T53 is marked Done in `tasks.md` with all Done-when boxes checked. Commits for T1..T51 are listed in the iteration 1 table below (unchanged).

| Task | Status | Commit / Notes |
| ---- | ------ | -------------- |
| T1..T15 | ✅ Done | `4a00e69`, `139e086`, `bf6339d` (+ `93df015`), `b99a352`, `0bf7c28`, `9061ad7` (+ `64b17b7`), `d854740`, `d01d9eb`, `0860a6a`, `8468120`, `f317e53`, `12a1cad`, `21c4893`, `15b3c67`, `8b06d6d` |
| T16, T17 | ✅ Done | `9416481` (shared on purpose; recorded in tasks.md) |
| T18..T34 | ✅ Done | `9cd4cf4`, `2f381c9`, `85c4104`, `a6926c5`, `080f0c1`, `09058c8`, `bb771f6`, `fa48ff9`, `8db5905`, `b1306ba`, `24016ce`, `51dce5a`, `e748c66`, `fb265b2`, `2453773`, `c023652`, `038c519` |
| T35..T51 | ✅ Done | `55e2990`, `5c3fcf3`, `0bd9f4f`, `7873014`, `f699350`, `a0c1dd7`, `8e93a62`, `68235cf`, `f7c77fd`, `8e0190d`, `d9312ce`, `0e11ae9`, `545b89a`, `ad742a8`, `f1ed5b4`, `5dafa95`, `e273118` |
| T52 | ✅ Done | `247143f` - atomicity IT, concurrent fusion IT, leader-unchanged assertions, drop and fusion log tests (gaps 1-5) |
| T53 | ✅ Done | `8d52b14` - "Ir para a fusão" label assertion, 27-card e2e to three stars (gaps 6-7) |

Doc nit (not a gap): the `tasks.md` Phase Execution Map still ends at Phase 8 and its header says `Status: In Progress`; Phase 9 (T52, T53) is only in the task breakdown.

Paths below: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`.

---

## Iteration 2: the seven iteration 1 gaps, re-derived

| # | Gap | New evidence (`file:line` + assertion) | Would it fail under a plausible wrong implementation? | Result |
| - | --- | -------------------------------------- | ----------------------------------------------------- | ------ |
| 1 | Registration atomicity (Reg AC 5) | `BT/adapter/web/CardsAtomicityIT.kt:52` - `.statusCode(500)`; `:54` - `assertFalse(jpaUserRepository.existsById("boom"))`; `:55-56` - `jpaPlayerCardsRepository.count() == 0`, `jpaCardCopyRepository.count() == 0`. A `@Primary` `PlayerCardsRepositoryPort` (`:26-39`) throws on `save` for "boom" only | Yes. `UserService.create` saves the user (`UserService.kt:47`) before the cards (`:48`), so the user row exists when the cards save throws; only the transaction removes it. M14 (drop `@Transactional`) fails at `CardsAtomicityIT.kt:54` | ✅ Closed |
| 2 | Two simultaneous fusions (Fusion AC 9) | `BT/adapter/web/HeroControllerIT.kt:182-204` - two threads released by one latch: `:199` `assertEquals(listOf(200, 409), statuses)`; `:200-203` one-star copies `== mapOf(1 to 1)`; `:204` zero blank copies | Yes. M15 (drop `@Lock(PESSIMISTIC_WRITE)` on `findForUpdate`) killed 6/6 runs, every time at `:199` with `expected: <[200, 409]> but was: <[200, 500]>` (the unlocked second writer collides on the copy rows). A fair proof of serialization: the assertion pins the serialized outcome, and the unlocked race was reproduced deterministically in 6 runs. Caveat: it is a timing-based test, so a single lucky schedule could in principle let a lock-free build pass once | ✅ Closed |
| 3 | Leader unchanged after the first chapter boss drop (edge case) | `BT/service/ProgressServiceTest.kt:240` - `assertEquals("kael", playerCards.cards.getValue("yan").leaderId)` after the Lyra drop at `:238`; `BT/adapter/web/CardsFlowIT.kt:79` - `.body("leaderId", equalTo("kael"))` after the chapter boss clear | Yes. M11 (CardRewards makes the dropped hero the leader) and M11b (`PlayerCards.add` sets `leaderId`) both fail at `ProgressServiceTest.kt:240` and `CardsFlowIT.kt:79` | ✅ Closed |
| 4 | Progress rollback when the cards save fails (Drop AC 10) | `BT/adapter/web/CardsAtomicityIT.kt:74` - `.statusCode(500)`; `:77` - `assertEquals(listOf(1, "MINIBOSS", 1, false), listOf(stored.stage, stored.encounter, stored.phase, stored.completed))`; `:78` bag still 1 copy | Yes. `ProgressService.report` saves the moved progress (`ProgressService.kt:48`) before awarding cards (`:49`), so only the rollback restores it. N3 (drop `@Transactional` on `ProgressService`) fails at `CardsAtomicityIT.kt:77`. (The `:78` bag check is trivially true because the failing save writes nothing; the progress check carries the proof) | ✅ Closed |
| 5 | INFO logs of a drop and a fusion (Drop AC 11, Fusion AC 11) | `BT/LogCapture.kt:10-29` (logback `ListAppender` on one class, INFO only); `BT/service/ProgressServiceTest.kt:183` - `assertEquals(listOf("Card dropped username=yan hero=kael source=MINIBOSS"), logs.infos)`; `:194` - `... hero=lyra source=CHAPTER_BOSS`; `:205` - no drop, `emptyList()`; `BT/service/HeroServiceTest.kt:113` - `assertEquals(listOf("Fusing cards username=yan hero=kael stars=1"), logs.infos)` | Yes. M12 (delete the drop log) fails at `ProgressServiceTest.kt:183,194`; N1 (delete the fusion log in `PlayerCards.fuse`) fails at `HeroServiceTest.kt:113`. Exact-message equality also catches a wrong player, hero or source field | ✅ Closed |
| 6 | "Ir para a fusão" label (Screens AC 5) | `GS/adapters/phaser/views/bagView.test.js:61` - `expect(detail.querySelector('[data-testid="bag-go-fusion"]').textContent).toBe('Ir para a fusão')` | Yes. G7 (label → "Fundir agora") fails: `expected 'Fundir agora' to be 'Ir para a fusão'` | ✅ Closed |
| 7 | 27 blank cards → three stars by e2e (Success Criterion 3) | `game/e2e/heroes.spec.js:91-119` - fuses 9 + 3 + 1 times, each click asserted by the row count (`:100` `toHaveText(\`${left}/3\`)`); `:108` - `fusion-result` `toHaveText('Nova carta: Kael Raizférrea 3★')`; `:109` - `skill-slot-3` `data-unlocked == 'true'`; `:110` - `.skill-slot.is-locked` count 0; `:116` - `bag-entry-kael-3` contains `x1`; `:118` - `bag-go-fusion` count 0 for the 3-star card | Yes. An off-by-one in fusing, a missing stars+1 or an unlock rule `>` instead of `>=` fails the per-step count or the final 3★ / unlocked asserts (the unit-level twins G1/G4 were killed in iteration 1). Passed in the e2e gate (`ok 28 ... heroes.spec.js:91:5`, 21.2 s) | ✅ Closed |

---

## Spec-Anchored Acceptance Criteria

Rows that changed in iteration 2 are marked **(it.2)**; line numbers that moved because of the T52/T53 insertions are updated.

### P1: Choose a starting hero at registration

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Hero catalog seeded with the five README heroes | ids, elements, class, bonus, 3 skills with README cooldowns | `BT/domain/HeroSeedTest.kt:12` - `assertEquals(listOf("kael","lyra","orina","seraphine","vex"), heroes.map { it.id })`; `HeroSeedTest.kt:35-43` cooldowns; `BT/adapter/web/HeroControllerIT.kt:65-77` | ✅ PASS |
| 2 | Chapter elements from the starting element | FIRE→F,N,W,D,L; NATURE→N,W,F,D,L; WATER→W,F,N,D,L | `BT/domain/ChapterOrderTest.kt:15,20,25` | ✅ PASS |
| 3 | FIRE/WATER/NATURE registration stores element, one 0-star card, leader | element, 1 blank copy, leader = that hero | `BT/adapter/web/UserControllerIT.kt:47-58`, `:61-67` | ✅ PASS |
| 4 | Missing or other element → 400 INVALID_STARTING_ELEMENT, no account | 400, code, 0 users | `BT/adapter/web/UserControllerIT.kt:70-81` | ✅ PASS |
| 5 | Card or leader cannot be stored → no account **(it.2)** | no user row, no cards row, no copy rows after a failing cards save | `BT/adapter/web/CardsAtomicityIT.kt:54` - `assertFalse(jpaUserRepository.existsById("boom"))`; `:55-56` - counts `0` | ✅ PASS |
| 6 | Form offers the three labelled choices with portraits and sends the element | exact labels, portraits, `startingElement` | `GS/adapters/phaser/MainMenu.test.js:154-157,171`; `game/e2e/auth.spec.js:19` | ✅ PASS |
| 7 | No hero chosen → "Escolha seu herói inicial." and no request | exact text, no request | `GS/adapters/phaser/MainMenu.test.js:181-183`; `game/e2e/auth.spec.js:52-55` | ✅ PASS |

### P1: Bosses drop hero cards

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Miniboss CLEARED, r < 0.01 → blank card of the chapter hero | drop at 0.0 and 0.0099 | `BT/domain/CardDropsTest.kt:28-29`; `BT/service/ProgressServiceTest.kt:170-172` - `blankCopies("kael") == 2` | ✅ PASS |
| 2 | Miniboss r ≥ 0.01 → no card | no drop at 0.01 | `CardDropsTest.kt:34` - `assertNull(drop(MINIBOSS, 0.01))`; `ProgressServiceTest.kt:216-217` | ✅ PASS |
| 3 | First chapter boss win (c < 5) → hero of c + 1 without rolling | lyra, 0 reads | `CardDropsTest.kt:47-48`; `ProgressServiceTest.kt:238-241` - `"lyra"`, `chance.reads == 0` | ✅ PASS |
| 4 | Later win, r < 0.10 → hero of c + 1 | drop at 0.0999 | `CardDropsTest.kt:54`; `ProgressServiceTest.kt:248-253` | ✅ PASS |
| 5 | Later win, r ≥ 0.10 → no card | no drop at 0.10 | `CardDropsTest.kt:55`; `ProgressServiceTest.kt:263` | ✅ PASS |
| 6 | Chapter 5 boss drops the chapter 5 hero | seraphine for FIRE | `CardDropsTest.kt:68-70` | ✅ PASS |
| 7 | PHASE CLEARED or any FAILED → no card, no roll | 0 reads | `ProgressServiceTest.kt:280-281`; `CardDropsTest.kt:75-76` | ✅ PASS |
| 8 | Response carries the drop (heroId, heroName, stars 0) or none | fields or null | `BT/adapter/web/ProgressControllerIT.kt:358-360`, `:373` | ✅ PASS |
| 9 | 409 rejection → no roll, no card | 409, copies unchanged, 0 reads | `ProgressControllerIT.kt:384-386`; `ProgressServiceTest.kt:291-292` | ✅ PASS |
| 10 | Card add fails → progress change rolled back **(it.2)** | stored progress still at stage 1, MINIBOSS, phase 1, not completed | `BT/adapter/web/CardsAtomicityIT.kt:77` - `assertEquals(listOf(1, "MINIBOSS", 1, false), listOf(stored.stage, stored.encounter, stored.phase, stored.completed))` | ✅ PASS |
| 11 | Card drop logged at INFO with player, hero, source **(it.2)** | INFO line with username, hero, `MINIBOSS`/`CHAPTER_BOSS` | `BT/service/ProgressServiceTest.kt:183` - `"Card dropped username=yan hero=kael source=MINIBOSS"`; `:194` - `source=CHAPTER_BOSS`; `:205` none when no drop | ✅ PASS |

### P1: The bag and fusion rules

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | GET /heroes answers catalog, chapter, copies 0..3, owned, stars, leader | 200 with every field | `BT/adapter/web/HeroControllerIT.kt:60-78`; `BT/service/HeroServiceTest.kt:63-70` | ✅ PASS |
| 2 | Skill n owned iff stars ≥ n | unlock list per stars | `HeroServiceTest.kt:79-81`, `:90` | ✅ PASS |
| 3 | Fuse stars 0..2 with ≥ 3 copies → -3, +1 next, 200 hero | copies.0 0, copies.1 1, stars 1 | `HeroControllerIT.kt:88-93`; `BT/domain/PlayerCardsTest.kt:66-68,90,98` | ✅ PASS |
| 4 | 3-star result → stars 3, skill 3 unlocked | stars 3, `[true, true, true]` | `HeroControllerIT.kt:104-105`; `game/e2e/heroes.spec.js:108-110` | ✅ PASS |
| 5 | Other copies unchanged | other stacks equal | `PlayerCardsTest.kt:83` | ✅ PASS |
| 6 | < 3 copies → 409 NOT_ENOUGH_CARDS, nothing changes | 409, code, bag unchanged | `HeroControllerIT.kt:112-114`; `HeroServiceTest.kt:118-123` | ✅ PASS |
| 7 | stars missing, < 0 or > 2 → 400 INVALID_FUSION | 400, code | `HeroControllerIT.kt:122-123`; `HeroServiceTest.kt:127-133` | ✅ PASS |
| 8 | Unknown hero → 404 HERO_NOT_FOUND | 404, code, bag unchanged | `HeroControllerIT.kt:131`; `HeroServiceTest.kt:137-142` | ✅ PASS |
| 9 | Two fusions at once run one after the other **(it.2)** | one 200, one 409, exactly one one-star card, no blank left | `BT/adapter/web/HeroControllerIT.kt:199` - `assertEquals(listOf(200, 409), statuses)`; `:200-204` - `mapOf(1 to 1)`, 0 blank | ✅ PASS |
| 10 | No token → 401; own bag only | 401; other bag untouched | `HeroControllerIT.kt:163-175`; `:212-220` | ✅ PASS |
| 11 | Fusion logged at INFO with player, hero, stars **(it.2)** | INFO line with username, hero, stars | `BT/service/HeroServiceTest.kt:113` - `assertEquals(listOf("Fusing cards username=yan hero=kael stars=1"), logs.infos)` | ✅ PASS |
| 12 | Deleting a user deletes bag, element, leader, boss wins | rows gone, others kept | `BT/service/UserServiceTest.kt:149`; `BT/adapter/repository/PlayerCardsRepositoryIT.kt:79-81` | ✅ PASS |

### P1: Heroes, Mochila and Fusão screens

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | HUD shows Heróis, Mochila, Fusão; not in the pause menu | labels; none in `.pause-menu` | `GS/adapters/phaser/ClickerGame.test.js:1642-1645` | ✅ PASS |
| 2 | Heróis loads GET /heroes; owned in colour, others grey | 5 cards, grey for not owned | `GS/adapters/phaser/HeroUi.test.js:141-144`; `GS/adapters/phaser/views/catalogView.test.js:20-27`; `game/e2e/heroes.spec.js:40-43` | ✅ PASS |
| 3 | Hero click shows portrait, class, element, bonus, three skills with lock state | all fields | `catalogView.test.js:55-60,66-68,76-82`; `game/e2e/heroes.spec.js:48-51` | ✅ PASS |
| 4 | Mochila lists every (hero, stars) with ≥ 1 copy and count | pairs and counts | `GS/adapters/phaser/views/bagView.test.js:16-18` | ✅ PASS |
| 5 | Bag entry detail incl. "Ir para a fusão" (none at 3 stars) **(it.2)** | fields, exact label, no button at 3 stars | `bagView.test.js:44-47,53-54`; `:61` - `textContent toBe('Ir para a fusão')`; `:65` - `onFuse toHaveBeenCalledWith(entry)`; `:72` - no button at 3 stars; `game/e2e/heroes.spec.js:118` | ✅ PASS |
| 6 | Fusão lists (hero, 0..2) with count out of 3; Fundir only at ≥ 3 | `'2/3'`, enabled only from 3 | `GS/adapters/phaser/views/fusionView.test.js:15,22-23` | ✅ PASS |
| 7 | Enabled Fundir calls fuse, updates, shows result | call, new card | `HeroUi.test.js:223-226`; `game/e2e/heroes.spec.js:79-80,108` | ✅ PASS |
| 8 | Failed request → Portuguese error line, screen open, bag unchanged | error text not fixed by the spec | `HeroUi.test.js:169-172`, `:240-243`; `game/e2e/heroes.spec.js:131` - `toHaveText('Não foi possível fundir as cartas.')` | ⚠️ Spec-precision gap (non-blocking: the spec asks only for "an error line in Portuguese"; tests pin the implementation's Portuguese text, which satisfies the spec. Already captured by confirmed lesson L-010) |
| 9 | Any screen open pauses play | time and tweens paused | `ClickerGame.test.js:1663-1665`; `HeroUi.test.js:94`; `game/e2e/heroes.spec.js:44` | ✅ PASS |
| 10 | Drop → "Carta: <hero name>" for 3 s | exact text, 3000 ms | `HeroUi.test.js:338-344`; `ClickerGame.test.js:1709` | ✅ PASS |
| 11 | DOM screens with stable test ids | data-testid | `HeroUi.test.js:76`; `fusionView.test.js:11`; `farmView.test.js:19`; `skillBar.test.js:17` | ✅ PASS |

### P2: Leader and skill bar

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | PUT /leader with owned hero → 200, stored | 200, `leaderId` | `HeroControllerIT.kt:139-144` | ✅ PASS |
| 2 | Not owned → 409 HERO_NOT_OWNED, leader kept | 409, code | `HeroControllerIT.kt:148-150`; `HeroServiceTest.kt:161` | ✅ PASS |
| 3 | Unknown → 404 HERO_NOT_FOUND, leader kept | 404, code | `HeroControllerIT.kt:157`; `HeroServiceTest.kt:170` | ✅ PASS |
| 4 | Líder lists owned heroes, marks current, PUT on another | owned only; call | `GS/adapters/phaser/views/leaderView.test.js:13,20-21,31,40`; `HeroUi.test.js:253,259`; `game/e2e/heroes.spec.js:147,154` | ✅ PASS |
| 5 | Three slots with art, name, cooldown; locked above stars | 3 slots, lock marks | `GS/adapters/phaser/views/skillBar.test.js:17-22,28-29,35-37`; `ClickerGame.test.js:1651-1653` | ✅ PASS |
| 6 | Clicking a slot leaves the fight unchanged | same state | `skillBar.test.js:57`; `game/e2e/heroes.spec.js:157-166` | ✅ PASS |
| 7 | Fusion or drop changing stars updates lock marks | lock count changes | `HeroUi.test.js:227,328`; `game/e2e/heroes.spec.js:81-82,109-110` | ✅ PASS |
| 8 | Leader change replaces the three slots | new leader's art | `HeroUi.test.js:261`; `game/e2e/heroes.spec.js:151` | ✅ PASS |

### P2: Fight defeated bosses again (farm)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Farm state lists and wins left (≥ 0) | lists and count | `BT/adapter/web/FarmControllerIT.kt:57-63,75`; `BT/service/FarmServiceTest.kt:78-113`; `BT/domain/BossRecordTest.kt:43` | ✅ PASS |
| 2 | Farm CLEARED rolls the same rate and hero | 0.01 / 0.10 | `FarmServiceTest.kt:123-124,132,150-152,163`; `FarmControllerIT.kt:88-93` | ✅ PASS |
| 3 | Farm chapter boss CLEARED adds 1 win today | 10 → 9 | `FarmServiceTest.kt:151-153`; `FarmControllerIT.kt:117-118` | ✅ PASS |
| 4 | Any farm report leaves position and completed flag | progress equal | `FarmServiceTest.kt:178`; `FarmControllerIT.kt:104` | ✅ PASS |
| 5 | Farm FAILED → 200, no roll, wins unchanged | 200, 0 reads | `FarmServiceTest.kt:189-192`; `FarmControllerIT.kt:127-133` | ✅ PASS |
| 6 | 11th win of the day → 409 DAILY_LIMIT_REACHED | 10th ok, 11th 409 | `FarmServiceTest.kt:214-221`; `FarmControllerIT.kt:146-149` | ✅ PASS |
| 7 | New UTC date → count from 0 | 10 left next day | `FarmServiceTest.kt:234-239`; `BossRecordTest.kt:35-36` | ✅ PASS |
| 8 | Campaign chapter boss clear counts as one win | 9 left | `ProgressServiceTest.kt:244` - `bosses.winsLeft(today, 10) == 9` | ✅ PASS |
| 9 | Not-beaten boss → 409 BOSS_NOT_AVAILABLE | 409, code | `FarmServiceTest.kt:201-206`; `FarmControllerIT.kt:157-158` | ✅ PASS |
| 10 | Farm win < 5000 ms → 409 FARM_TOO_FAST | 4999 rejected, 5000 ok | `BossRecordTest.kt:62-63`; `FarmServiceTest.kt:243-262`; `FarmControllerIT.kt:167` | ✅ PASS |
| 11 | "Rever chefes" lists bosses and wins left | names and count | `GS/adapters/phaser/views/farmView.test.js:11-12`; `game/e2e/farm.spec.js:45-47` | ✅ PASS |
| 12 | Picked boss fought with campaign numbers, in a loop | same health and timer | `ClickerGame.test.js:1773-1775,1795-1797`; `game/e2e/farm.spec.js:66-74` | ✅ PASS |
| 13 | Wins left 0 → leave the loop, list with 0 left | farm ends | `ClickerGame.test.js:1850-1854`; `game/e2e/farm.spec.js:90-93` | ✅ PASS |
| 14 | HUD "Rever chefe" + name; saved position unchanged | label, no campaign report | `ClickerGame.test.js:1773,1776,1810`; `game/e2e/farm.spec.js:75-76` | ✅ PASS |

**Status**: ✅ All ACs covered - 62/63 matched the spec outcome with `file:line` evidence; 1 ⚠️ spec-precision gap flagged (Screens 8, non-blocking). Success criterion 3 (27 copies to 3 stars by e2e) now met (`game/e2e/heroes.spec.js:91`).

---

## Discrimination Sensor (iteration 2)

Scratch: `git worktree add --detach C:/tmp/v2 HEAD` (outside the repo); `game/node_modules` junctioned in; each mutant applied by a script with an exact-once string replace, tested, then reverted with `git checkout -- .` inside the worktree. Baseline (unmutated) runs in the scratch: backend targeted suites green, `vitest src/adapters/phaser` 231 passed. Afterwards the junction was removed with `rmdir` (target intact) and the worktree with `git worktree remove --force`. Real tree `git status --porcelain` before and after: identical (the three untracked `game/public/assets/coin-*.png`).

Re-run scope: only the five iteration 1 survivors, plus new mutants on fix-task-adjacent code. The 17 iteration 1 kills (M1-M10, M13, G1-G6) were not re-run: no production code changed since, and T52/T53 removed no assertion.

| Mutation | File:line | Description | Tests run | Killed? |
| -------- | --------- | ----------- | --------- | ------- |
| M11 | `service/CardRewards.kt:51` | `updated.add(hero.id)` → `.add(hero.id).withLeader(hero.id)` (a drop becomes the leader) | ProgressServiceTest, HeroServiceTest, PlayerCardsTest, FarmServiceTest, CardsFlowIT | ✅ Killed (`ProgressServiceTest.kt:240`, `CardsFlowIT.kt:79`) |
| M11b | `domain/PlayerCards.kt:38` | `add` also sets `leaderId = heroId` | same | ✅ Killed (`ProgressServiceTest.kt:240`, `CardsFlowIT.kt:79`) |
| M12 | `service/CardRewards.kt:52` | delete the "Card dropped" INFO log | same | ✅ Killed (`ProgressServiceTest.kt:183`, `:194`) |
| M14 | `service/UserService.kt:25` | drop `@Transactional` on `UserService` | CardsAtomicityIT, UserServiceTest, UserControllerIT | ✅ Killed (`CardsAtomicityIT.kt:54`) |
| M15 | `adapter/repository/PlayerCardsRepository.kt:15` | drop `@Lock(PESSIMISTIC_WRITE)` on `findForUpdate` | HeroControllerIT concurrent test, 6 runs with `--rerun` | ✅ Killed 6/6 (`HeroControllerIT.kt:199`, `[200, 500]` instead of `[200, 409]`) |
| G7 | `game/src/adapters/phaser/views/bagView.js:45` | label "Ir para a fusão" → "Fundir agora" | vitest `src` (530) | ✅ Killed (`bagView.test.js:61`) |
| N1 (new) | `domain/PlayerCards.kt:47` | delete the "Fusing cards" INFO log in `fuse` | ProgressServiceTest, HeroServiceTest, PlayerCardsTest, FarmServiceTest, CardsFlowIT | ✅ Killed (`HeroServiceTest.kt:113`) |
| N2 (new) | `service/HeroService.kt:54` | `setLeader` no longer saves the changed cards | HeroControllerIT, HeroServiceTest, CardsFlowIT | ✅ Killed (`HeroControllerIT.kt:144`, `HeroServiceTest.kt:151`) |
| N3 (new) | `service/ProgressService.kt:24` | drop `@Transactional` on `ProgressService` (was M10, killed only incidentally in iteration 1) | CardsAtomicityIT | ✅ Killed (`CardsAtomicityIT.kt:77`) - now killed by the dedicated rollback assertion |

**Sensor depth**: P0-full manual (data integrity: registration atomicity, outcome rollback, fusion locking)
**Result**: 9/9 killed in iteration 2 (6 re-run survivors incl. the M11b variant, 3 new) - PASS ✅. Cumulative across both iterations: every mutant injected is now killed.

M15 judgement: the concurrency test is a fair proof. It reproduced the lock-free race in 6 of 6 runs and asserts the spec's serialized outcome (one 200, one 409, one one-star card, no blank left), not just "no error". It remains timing-based by nature; it cannot prove the absence of a race on every schedule, but it is the standard two-request race the iteration 1 fix plan asked for, and the lock-on path passed in the scratch baseline and in the full gate.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ T52/T53 add only tests and one small test helper (`LogCapture`, 29 lines) |
| Surgical changes | ✅ No production file touched by the fix tasks |
| No scope creep | ✅ |
| Matches patterns | ✅ ITs extend `IntegrationTestBase`; the failing store is a `@TestConfiguration` delegate imported only by `CardsAtomicityIT` (own context, other ITs unaffected - full gate green); ktlint passes |
| Spec-anchored outcome check (asserted values match spec) | ✅ Exact codes, statuses, stored state and log fields asserted; Screens 8 error text flagged as a spec-precision gap |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ The "locking contract" row of the matrix is now covered at the controller level (`HeroControllerIT.kt:182`) rather than in `PlayerCardsRepositoryIT`; acceptable, it exercises the real lock end to end |
| Every test maps to a spec requirement - no unclaimed tests | ✅ Each new test maps to Reg 5, Drop 10, Drop 11, Fusion 9, Fusion 11, Screens 5, the leader edge case or Success Criterion 3 |
| Test integrity | ✅ Counts only grew (backend 441 → 448, e2e 44 → 45); no assertion removed or weakened |
| Documented guidelines followed: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, root `CLAUDE.md` | ✅ |

Notes (non-blocking):

- The fusion log is pinned on the `PlayerCards` logger. `HeroService.fuse` (`HeroService.kt:40`) also logs an identical "Fusing cards ..." line on its own logger, before validation, so it fires for rejected fusions too. Deleting either line alone still leaves one INFO line in production; N1 is killed because the test targets the domain logger, which is the one that fires only on a real fusion. A reader could mistake the service line for the fusion log; consider renaming it to "Fusion requested".
- `CardsAtomicityIT.kt:78` (bag unchanged) is trivially true because the failing `save` writes nothing; the rollback proof is `:77`.

---

## Edge Cases

- [x] 4 blank copies, fuse once → 1 blank + 1 one-star: `BT/domain/PlayerCardsTest.kt:75-76`
- [x] Owned with only blank copies → colour, 0 stars, all skills locked: `GS/adapters/phaser/views/catalogView.test.js:33-34`; `game/e2e/heroes.spec.js:69`
- [x] GET /heroes fails → error line, no grid: `GS/adapters/phaser/HeroUi.test.js:169-171`
- [x] Two tabs fuse the same copies → second call 409, bag reloads on next open: `game/e2e/heroes.spec.js:121-133`; backend 409 `BT/adapter/web/HeroControllerIT.kt:220` and the simultaneous case `:199`
- [x] Drop and daily limit judged per report: `BT/service/FarmServiceTest.kt:214-221`
- [x] FIRE player's first chapter 1 boss win → blank Lyra and the leader unchanged **(it.2)**: `BT/service/ProgressServiceTest.kt:238,240` - `"lyra"`, `leaderId == "kael"`; `BT/adapter/web/CardsFlowIT.kt:79` - `.body("leaderId", equalTo("kael"))`

---

## Gate Check

- **Gate commands** (real tree, HEAD `8d52b14`): `cd backend && ./gradlew --offline cleanTest build`; `cd game && npm run build && npm test`; `cd game && npm run test:e2e`
- **Backend**: BUILD SUCCESSFUL (48 s, ktlint + unit + Testcontainers ITs), 448 tests (158 in `*IT`), 0 failed, 0 skipped
- **Game build**: OK
- **Game unit**: 33 files, 530 tests passed, 0 failed
- **Game e2e**: 45 passed, 0 failed, 0 flaky in this run (3.6 min); the new 27-card test passed in 21.2 s
- **Test count before feature** (`ab9cc9f`, declarations): backend 282, game unit 360, e2e 28
- **Test count after feature** (executed at HEAD): backend 448, game unit 530, e2e 45
- **Delta vs iteration 1**: backend +7 (2 atomicity ITs, 1 concurrent fusion IT, 3 drop-log tests, 1 fusion-log test), game unit +0 tests (+1 assertion in an existing test), e2e +1
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

None required. Optional follow-ups (not gaps):

- Spec: fix the Portuguese error-line texts in Screens AC 8 ("Não foi possível carregar.", "Não foi possível fundir as cartas.") so the tests anchor to a spec value (L-010).
- Docs: add Phase 9 (T52, T53) to the `tasks.md` Phase Execution Map and close its header status.

---

## Requirement Traceability Update

| Requirement | Previous Status (it.1) | New Status (it.2) |
| ----------- | ---------------------- | ----------------- |
| CHAR-01 | ✅ Verified | ✅ Verified |
| CHAR-02 | ❌ Needs Fix | ✅ Verified (`CardsAtomicityIT.kt:54`) |
| CHAR-03 | ✅ Verified | ✅ Verified |
| CHAR-04 | ✅ Verified | ✅ Verified (+ leader edge `ProgressServiceTest.kt:240`) |
| CHAR-05 | ❌ Needs Fix | ✅ Verified (`CardsAtomicityIT.kt:77`, `ProgressServiceTest.kt:183`) |
| CHAR-06 | ✅ Verified | ✅ Verified |
| CHAR-07 | ❌ Needs Fix | ✅ Verified (`HeroControllerIT.kt:199`, `HeroServiceTest.kt:113`) |
| CHAR-08 | ✅ Verified | ✅ Verified |
| CHAR-09 | ⚠️ Label gap | ✅ Verified (`bagView.test.js:61`; Screens 8 spec-precision gap noted) |
| CHAR-10 | ✅ Verified | ✅ Verified |
| CHAR-11 | ✅ Verified | ✅ Verified |
| CHAR-12 | ✅ Verified | ✅ Verified |

(`spec.md` itself was not edited by the Verifier; its traceability table still reads Pending.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 62/63 ACs matched the spec outcome; 1 spec-precision gap flagged (Screens 8, non-blocking)
**Sensor**: 9/9 mutations killed in iteration 2 (M11, M11b, M12, M14, M15, G7, N1, N2, N3); no survivor left from iteration 1
**Gate**: backend 448 passed, game unit 530 passed, e2e 45 passed, 0 failed

**What works**: everything listed in iteration 1, plus now proven: registration and outcome atomicity over real transactions, serialized concurrent fusions under the row lock, the leader untouched by drops, exact drop and fusion INFO logs, the "Ir para a fusão" label, and the full 27-card path to a 3-star hero with all skills unlocked.

**Issues found**: none blocking.

**Next steps**: mark the feature done; optionally pin the error-line texts in the spec.

**Verdict**: PASS
