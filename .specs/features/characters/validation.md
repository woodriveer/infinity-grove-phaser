# Characters Validation

**Date**: 2026-10-18
**Spec**: `.specs/features/characters/spec.md`
**Diff range**: `ab9cc9f..HEAD` (HEAD = `e273118`, 53 commits, 126 files)
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

Every task T1..T51 is marked Done in `tasks.md` with all Done-when boxes checked (0 unchecked boxes). Each has a matching commit in `git log ab9cc9f..HEAD`; besides the task commits there is the planning commit `312d524` and two follow-ups (`93df015` test cleanup after T3, `64b17b7` ktlint format after T6).

| Task | Status | Commit / Notes |
| ---- | ------ | -------------- |
| T1 | ✅ Done | `4a00e69` hero and skill model |
| T2 | ✅ Done | `139e086` seed of the five README heroes |
| T3 | ✅ Done | `bf6339d` (+ `93df015` drop always-false checks) |
| T4 | ✅ Done | `b99a352` chapter order |
| T5 | ✅ Done | `0bf7c28` boss record |
| T6 | ✅ Done | `9061ad7` (+ `64b17b7` ktlint) |
| T7 | ✅ Done | `d854740` player cards aggregate |
| T8 | ✅ Done | `d01d9eb` ports and fakes |
| T9 | ✅ Done | `0860a6a` |
| T10 | ✅ Done | `8468120` |
| T11 | ✅ Done | `f317e53` |
| T12 | ✅ Done | `12a1cad` |
| T13 | ✅ Done | `21c4893` |
| T14 | ✅ Done | `15b3c67` |
| T15 | ✅ Done | `8b06d6d` |
| T16 | ✅ Done | `9416481` |
| T17 | ✅ Done | `9416481`, shared with T16 on purpose (use case signature change forced the controller change to compile; recorded in tasks.md) |
| T18 | ✅ Done | `9cd4cf4` |
| T19 | ✅ Done | `2f381c9` |
| T20 | ✅ Done | `85c4104` |
| T21 | ✅ Done | `a6926c5` |
| T22 | ✅ Done | `080f0c1` |
| T23 | ✅ Done | `09058c8` |
| T24 | ✅ Done | `bb771f6` |
| T25 | ✅ Done | `fa48ff9` |
| T26 | ✅ Done | `8db5905` |
| T27 | ✅ Done | `b1306ba` |
| T28 | ✅ Done | `24016ce` |
| T29 | ✅ Done | `51dce5a` |
| T30 | ✅ Done | `e748c66` |
| T31 | ✅ Done | `fb265b2` |
| T32 | ✅ Done | `2453773` |
| T33 | ✅ Done | `c023652` |
| T34 | ✅ Done | `038c519` |
| T35 | ✅ Done | `55e2990` |
| T36 | ✅ Done | `5c3fcf3` |
| T37 | ✅ Done | `0bd9f4f` |
| T38 | ✅ Done | `7873014` |
| T39 | ✅ Done | `f699350` |
| T40 | ✅ Done | `a0c1dd7` |
| T41 | ✅ Done | `8e93a62` |
| T42 | ✅ Done | `68235cf` |
| T43 | ✅ Done | `f7c77fd` |
| T44 | ✅ Done | `8e0190d` |
| T45 | ✅ Done | `d9312ce` |
| T46 | ✅ Done | `0e11ae9` |
| T47 | ✅ Done | `545b89a` |
| T48 | ✅ Done | `ad742a8` |
| T49 | ✅ Done | `f1ed5b4` |
| T50 | ✅ Done | `5dafa95` |
| T51 | ✅ Done | `e273118` |

Note: `spec.md` was edited inside the diff (farm eligibility now also covers the current stage's miniboss while the chapter boss is next; bag AC 5 now names the "Ir para a fusão" label and says a 3-star card has no button). Both edits are clarifications that the tests follow; no `SPEC_DEVIATION` marker exists in the code.

Paths below: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`.

---

## Spec-Anchored Acceptance Criteria

### P1: Choose a starting hero at registration

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Hero catalog seeded with the five README heroes | ids kael, lyra, orina, seraphine, vex; elements FIRE, NATURE, WATER, LIGHT, DARKNESS; class, bonus, 3 skills with README cooldowns | `BT/domain/HeroSeedTest.kt:12` - `assertEquals(listOf("kael","lyra","orina","seraphine","vex"), heroes.map { it.id })`; `HeroSeedTest.kt:35-43` - cooldown map `kael to listOf(20, 25, 30)` ... (matches README lines 75-121); `BT/adapter/web/HeroControllerIT.kt:65-77` - `heroes[2].heroClass == "Maga"`, `skills[0].name == "Prisão de Espinhos"`, `cooldownSeconds == 18` | ✅ PASS |
| 2 | Chapter elements from the starting element | FIRE→F,N,W,D,L; NATURE→N,W,F,D,L; WATER→W,F,N,D,L | `BT/domain/ChapterOrderTest.kt:15,20,25` - `assertEquals(listOf(FIRE, NATURE, WATER, DARKNESS, LIGHT), ChapterOrder.elements(FIRE))` and the NATURE and WATER lists | ✅ PASS |
| 3 | FIRE/WATER/NATURE registration stores element, one 0-star card, leader | Orina for WATER, Kael for FIRE, Lyra for NATURE; 1 copy at stars 0; leader = that hero | `BT/adapter/web/UserControllerIT.kt:47-58` - `assertEquals("WATER", cards.startingElement)`, `assertEquals("orina", cards.leaderId)`, `copies.single().stars == 0`, `copies == 1`; `UserControllerIT.kt:61-67` - kael / lyra leaders | ✅ PASS |
| 4 | Missing or other element → 400 INVALID_STARTING_ELEMENT, no account | 400, code `INVALID_STARTING_ELEMENT`, 0 users | `BT/adapter/web/UserControllerIT.kt:70-81` - for `null, LIGHT, DARKNESS, plasma`: `.statusCode(400).body("code", equalTo("INVALID_STARTING_ELEMENT"))`, `assertEquals(0, jpaUserRepository.count())` | ✅ PASS |
| 5 | Card or leader cannot be stored → no account | user row rolled back when the cards save fails | `BT/service/UserServiceTest.kt:80-87` only covers a catalog without the hero (fails **before** `user.save`); no test makes `playerCardsRepository.save` fail after the user is saved. Mutant M14 (drop `@Transactional` on `UserService`) result in the sensor table | ❌ GAP |
| 6 | Form offers "Fogo - Kael", "Água - Orina", "Natureza - Lyra" with portraits and sends the element | exact labels, `*_position` portraits, `startingElement` in the body | `GS/adapters/phaser/MainMenu.test.js:154` - labels `toEqual([ 'Fogo - Kael', 'Água - Orina', 'Natureza - Lyra' ])`; `:155-157` portrait srcs; `:171` - `signUp toHaveBeenCalledWith('ana', 'secret123', 'WATER')`; `game/e2e/auth.spec.js:19` - `backend.calls toEqual([{ ..., body: { ..., startingElement: 'WATER' } }])` | ✅ PASS |
| 7 | No hero chosen → "Escolha seu herói inicial." and no request | exact text, no request | `GS/adapters/phaser/MainMenu.test.js:181-183` - `signUp not.toHaveBeenCalled()`, `message() toEqual({ text: 'Escolha seu herói inicial.', isError: true })`; `game/e2e/auth.spec.js:52-55` - `toHaveText('Escolha seu herói inicial.')`, `backend.calls toEqual([])` | ✅ PASS |

### P1: Bosses drop hero cards

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Miniboss CLEARED, r < 0.01 → blank card of current chapter hero | drop at r = 0.0 and 0.0099 | `BT/domain/CardDropsTest.kt:28-29` - `assertEquals("kael", drop(MINIBOSS, 0.0099))`; `BT/service/ProgressServiceTest.kt:170-171` - `CardDrop("kael", "Kael Raizférrea", 0)`, `blankCopies("kael") == 2` | ✅ PASS |
| 2 | Miniboss r ≥ 0.01 → no card | no drop at r = 0.01 (boundary) | `CardDropsTest.kt:34` - `assertNull(drop(MINIBOSS, 0.01))`; `ProgressServiceTest.kt:181-182` - `assertNull(result.drop)`, `blankCopies == 1` | ✅ PASS |
| 3 | First chapter boss win (c < 5) → hero of c + 1 without rolling | drop at r = 0.99, 0 reads | `CardDropsTest.kt:47-48` - `assertEquals("lyra", drop(CHAPTER_BOSS, 0.99, first = true))`, `assertEquals(0, reads)`; `ProgressServiceTest.kt:204-206` - `"lyra"`, `chance.reads == 0` | ✅ PASS |
| 4 | Later win, r < 0.10 → hero of c + 1 | drop at 0.0999 | `CardDropsTest.kt:54` - `assertEquals("lyra", drop(CHAPTER_BOSS, 0.0999))`; `ProgressServiceTest.kt:217-218` | ✅ PASS |
| 5 | Later win, r ≥ 0.10 → no card | no drop at 0.10 | `CardDropsTest.kt:55` - `assertNull(drop(CHAPTER_BOSS, 0.10))`; `ProgressServiceTest.kt:227` | ✅ PASS |
| 6 | Chapter 5 boss drops the chapter 5 hero | seraphine for FIRE start | `CardDropsTest.kt:68-70` - `"seraphine"` first win and r 0.05, `assertNull` at 0.10 | ✅ PASS |
| 7 | PHASE CLEARED or any FAILED → no card, no roll | 0 reads | `ProgressServiceTest.kt:243-244` - `assertEquals(0, chance.reads)`, `blankCopies("kael") == 1`; `CardDropsTest.kt:75-76` | ✅ PASS |
| 8 | Response carries the drop (heroId, heroName, stars 0) or none | `drop.heroId`, `drop.heroName`, `drop.stars == 0`, else null | `BT/adapter/web/ProgressControllerIT.kt:358-360` - `body("drop.stars", equalTo(0))` etc.; `:373` - `body("drop", nullValue())` | ✅ PASS |
| 9 | 409 rejection → no roll, no card | 409, copies unchanged | `ProgressControllerIT.kt:384-386` - `statusCode(409)`, copies `== 1`; `ProgressServiceTest.kt:255-256` - `chance.reads == 0` | ✅ PASS |
| 10 | Card add fails → progress change rolled back | progress row unchanged after a failed cards save | `ProgressServiceTest.kt:260-270` asserts only that the exception propagates (`assertFailsWith<IllegalStateException>`); no IT checks the stored progress after a failing cards save. The rollback relies on `@Transactional`, whose removal (M10) is caught only incidentally by the concurrency IT | ⚠️ Indirect (GAP) |
| 11 | Card drop logged at INFO (player, hero, source) | log line | no test; mutant M12 (delete the log call) survived | ❌ GAP |

### P1: The bag and fusion rules

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | GET /heroes answers catalog, chapter, copies 0..3, owned, stars, leader | 200 with every field | `BT/adapter/web/HeroControllerIT.kt:60-78` - `statusCode(200)`, `leaderId == "orina"`, `heroes.chapter == [2, 3, 1, 5, 4]`, `copies.0 == 1`, `copies.3 == 0`, `owned`, `stars == 0`; `BT/service/HeroServiceTest.kt:63-70` | ✅ PASS |
| 2 | Skill n owned iff stars ≥ n | unlock list per stars | `HeroServiceTest.kt:79-81` - `[true, true, false]` at 2 stars, `[true, false, false]` at 1, `[false, false, false]` at 0; `:90` 3 stars all true | ✅ PASS |
| 3 | Fuse stars 0..2 with ≥ 3 copies → -3, +1 next, 200 hero | copies.0 0, copies.1 1, stars 1 | `HeroControllerIT.kt:88-93` - `statusCode(200)`, `stars == 1`, `copies.0 == 0`, `copies.1 == 1`; `BT/domain/PlayerCardsTest.kt:66-68,90,98` | ✅ PASS |
| 4 | 3-star result → stars 3, skill 3 unlocked | stars 3, `[true, true, true]` | `HeroControllerIT.kt:104-105` | ✅ PASS |
| 5 | Other copies unchanged | other stacks equal | `PlayerCardsTest.kt:83` - `assertEquals(mapOf(CopyKey("lyra", 0) to 1, CopyKey("kael", 1) to 1), cards.copies)` | ✅ PASS |
| 6 | < 3 copies → 409 NOT_ENOUGH_CARDS, nothing changes | 409, code, bag unchanged | `HeroControllerIT.kt:112-114` - `statusCode(409).body("code", equalTo("NOT_ENOUGH_CARDS"))`, copies `== 1`; `HeroServiceTest.kt:109-111` | ✅ PASS |
| 7 | stars missing, < 0 or > 2 → 400 INVALID_FUSION | 400, code | `HeroControllerIT.kt:122-123` - for `{}`, `-1`, `3`, `"0"`: `statusCode(400).body("code", equalTo("INVALID_FUSION"))`; `HeroServiceTest.kt:118-121` bag unchanged | ✅ PASS |
| 8 | Unknown hero → 404 HERO_NOT_FOUND | 404, code, bag unchanged | `HeroControllerIT.kt:131`; `HeroServiceTest.kt:128-130` | ✅ PASS |
| 9 | Two fusions at once run one after the other | no negative count | no concurrent-fusion test; `PlayerCardsRepositoryIT` has no locking test (the Test Coverage Matrix asks for the "locking contract"). Mutant M15 (drop `@Lock(PESSIMISTIC_WRITE)` on the cards query) result in the sensor table | ❌ GAP |
| 10 | No token → 401; own bag only | 401; another player's bag untouched | `HeroControllerIT.kt:163-175` - `statusCode(401)` on all three routes; `:186-191` - ana sees `heroes[0].owned == false`, her fuse 409 | ✅ PASS |
| 11 | Fusion logged at INFO (player, hero, stars) | log line | no test (same class of gap as drop AC 11) | ❌ GAP |
| 12 | Deleting a user deletes bag, element, leader, boss wins | rows gone, others kept | `BT/service/UserServiceTest.kt:149` - `assertEquals(setOf("ana"), playerCards.cards.keys)`; `BT/adapter/repository/PlayerCardsRepositoryIT.kt:79-81` - `assertNull(findForUpdate("yan"))`, copy rows 0, ana 1 (element, leader and boss record live on the same row) | ✅ PASS |

### P1: Heroes, Mochila and Fusão screens

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | HUD shows Heróis, Mochila, Fusão; not in the pause menu | exact labels; none inside `.pause-menu` | `GS/adapters/phaser/ClickerGame.test.js:1642-1645` - labels `toEqual([ 'Heróis', 'Mochila', 'Fusão', 'Líder', 'Rever chefes' ])`, `control('.pause-menu').querySelector('[data-testid^="hud-"]')).toBeNull()` | ✅ PASS |
| 2 | Heróis loads GET /heroes, shows portrait, name, element, stars; owned colour, others grey | 5 cards, owned not grey | `GS/adapters/phaser/HeroUi.test.js:141-144` - `list toHaveBeenCalledTimes(1)`, 5 cards, 3 grey; `GS/adapters/phaser/views/catalogView.test.js:20-27` - portrait src, `'Fogo'`, `'1★'`, grey lyra; `game/e2e/heroes.spec.js:40-43` - 5 cards, 4 grey | ✅ PASS |
| 3 | Hero click shows portrait, class, element, bonus, three skills with art, name, type, effect, cooldown, lock state | all fields, lock from stars | `catalogView.test.js:55-60,66-68,76-82` - `'Classe: Guerreiro'`, `'Bônus de líder: ...'`, `'Recarga: 20s'`, `[ 'Liberada', 'Bloqueada', 'Bloqueada' ]`; `game/e2e/heroes.spec.js:48-51` - Vex 3 locked rows, `'Elemento: Escuridão'` | ✅ PASS |
| 4 | Mochila lists every (hero, stars) with ≥ 1 copy and count | pairs and counts | `GS/adapters/phaser/views/bagView.test.js:16-18` - testids `[ 'bag-entry-kael-0', 'bag-entry-kael-1', 'bag-entry-orina-3' ]`, counts `[ 'x2', 'x1', 'x4' ]` | ✅ PASS |
| 5 | Bag entry detail: name, stars, copies, needed, 3 skills, "Ir para a fusão" button (none at 3 stars) | fields and the button | `bagView.test.js:44-47` - `'Estrelas: 0★'`, `'Cópias: 2'`, `'Para fundir: 2/3'`; `:53-54` 3 skill rows, 3 locked; `:63` `onFuse toHaveBeenCalledWith(entry)`; `:70` no button at 3 stars; `HeroUi.test.js:207` Fusão opens with `is-selected`. The label "Ir para a fusão" is never asserted (mutant G7 survived) | ⚠️ PASS with label gap |
| 6 | Fusão lists (hero, 0..2) with count out of 3; "Fundir" enabled only at ≥ 3 | `'2/3'`, enabled only from 3 | `GS/adapters/phaser/views/fusionView.test.js:15` - `[ '2/3', '3/3', '0/3' ]`; `:22-23` - labels `'Fundir'`, `disabled [ true, false, false ]` | ✅ PASS |
| 7 | Enabled Fundir calls fuse, updates from response, shows result | call (heroId, stars), new card shown | `HeroUi.test.js:223-226` - `fuse toHaveBeenCalledWith('kael', 0)`, `'Nova carta: Hero kael 1★'`, `'0/3'`; `game/e2e/heroes.spec.js:79-80` | ✅ PASS |
| 8 | Failed request → Portuguese error line, screen open, bag unchanged | error text not fixed by spec | `HeroUi.test.js:169-172` - `'Não foi possível carregar.'`, `isOpen == true`; `:240-243` - `'Não foi possível fundir as cartas.'`, `heroes() toEqual(before)`; `game/e2e/heroes.spec.js:101-103` | ⚠️ Spec-precision gap (the spec says "an error line in Portuguese" but fixes no text; tests pin the implementation's text) |
| 9 | Any screen open pauses play like the pause menu | time and tweens paused, clicks ignored | `ClickerGame.test.js:1663-1665` - `time.paused == true`, `tweens.paused == true`, health unchanged; `HeroUi.test.js:94`; `game/e2e/heroes.spec.js:44` | ✅ PASS |
| 10 | Drop → "Carta: <hero name>" for 3 s | exact text, 3000 ms | `HeroUi.test.js:338-344` - `'Carta: Lyra Folhaveloz'`, timer delay `toEqual([ 3000 ])`, hidden after; `ClickerGame.test.js:1709` | ✅ PASS |
| 11 | DOM screens with stable test ids | data-testid on every control | `HeroUi.test.js:76`, `fusionView.test.js:11`, `farmView.test.js:19`, `skillBar.test.js:17` (all assert `data-testid` values) | ✅ PASS |

### P2: Leader and skill bar

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | PUT /leader with owned hero → 200, stored | 200, `leaderId` | `HeroControllerIT.kt:139-141` - `statusCode(200).body("leaderId", equalTo("lyra"))`, GET shows `lyra` | ✅ PASS |
| 2 | Not owned → 409 HERO_NOT_OWNED, leader kept | 409, code, kael kept | `HeroControllerIT.kt:148-150` | ✅ PASS |
| 3 | Unknown → 404 HERO_NOT_FOUND, leader kept | 404, code | `HeroControllerIT.kt:157`; `HeroServiceTest.kt:156-158` - `leaderId == "kael"` | ✅ PASS |
| 4 | Líder lists owned heroes, marks current, PUT on another | only owned; current marked; call with id | `GS/adapters/phaser/views/leaderView.test.js:13,20-21,31,40`; `HeroUi.test.js:253,259`; `game/e2e/heroes.spec.js:116-124` - `leader-entry-vex toHaveCount(0)`, `backend.cardsOf('yan').leader == 'lyra'` | ✅ PASS |
| 5 | Three slots with art, name, cooldown; slots above stars dimmed with lock mark | 3 slots, lock marks | `GS/adapters/phaser/views/skillBar.test.js:17-22,28-29,35-37`; `ClickerGame.test.js:1651-1653` | ✅ PASS |
| 6 | Clicking a slot leaves the fight unchanged | same health | `skillBar.test.js:57` - `innerHTML toBe(before)`; `game/e2e/heroes.spec.js:133-135` - health stays `20` | ✅ PASS |
| 7 | Fusion or drop changing stars updates lock marks without reload | lock count changes | `HeroUi.test.js:328` - `.skill-slot.is-locked toHaveLength(1)` after fuse; `:227`; `game/e2e/heroes.spec.js:81-82` | ✅ PASS |
| 8 | Leader change replaces the three slots | new leader's art | `HeroUi.test.js:261`; `game/e2e/heroes.spec.js:121` - slot 1 img `lyra_double_shot.jpg` | ✅ PASS |

### P2: Fight defeated bosses again (farm)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Farm state: passed minibosses, chapter boss once completed, wins left (10 - today, ≥ 0) | lists and count | `BT/adapter/web/FarmControllerIT.kt:57-63` - 11 bosses, `chapterBossWinsLeft == 10`; `:75` - stages `[1, 2, 3]`; `BT/service/FarmServiceTest.kt:78-113`; `BT/domain/BossRecordTest.kt:43` never below 0 | ✅ PASS |
| 2 | Farm CLEARED rolls the same rate and hero | 0.01 / 0.10, same hero | `FarmServiceTest.kt:123-124` (r 0.0 kael), `:132` (r 0.01 null), `:150-152` (chapter boss lyra), `:163` (0.10 null); `FarmControllerIT.kt:88-93` | ✅ PASS |
| 3 | Farm chapter boss CLEARED adds 1 win today | wins left 10 → 9 | `FarmServiceTest.kt:151-153`; `FarmControllerIT.kt:117-118` | ✅ PASS |
| 4 | Any farm report leaves position and completed flag | progress equal | `FarmServiceTest.kt:178` - `assertEquals(completed, progresses.progresses.getValue("yan"))`; `FarmControllerIT.kt:104` | ✅ PASS |
| 5 | Farm FAILED → 200, no roll, wins unchanged | 200, 0 reads | `FarmServiceTest.kt:189-192`; `FarmControllerIT.kt:127-133` - `statusCode(200)`, `chapterBossWinsLeft == 10` | ✅ PASS |
| 6 | 11th chapter boss win of the day → 409 DAILY_LIMIT_REACHED, nothing changes | 10th accepted, 11th 409 | `FarmServiceTest.kt:214-221` - 10th gives `0` left, 11th `assertFailsWith<DailyLimitReachedException>`, cards equal; `FarmControllerIT.kt:146-149` - `statusCode(409).body("code", equalTo("DAILY_LIMIT_REACHED"))` | ✅ PASS |
| 7 | New UTC date → count from 0 | 10 left next day | `FarmServiceTest.kt:234-239` - `0` then `10` after +24 h, `9` after a win; `BossRecordTest.kt:35-36` | ✅ PASS |
| 8 | Campaign chapter boss clear counts as one win | 9 left | `ProgressServiceTest.kt:207-210` - `bosses.winsLeft(today, 10) == 9` | ✅ PASS |
| 9 | Not-beaten boss → 409 BOSS_NOT_AVAILABLE, nothing changes | 409, code | `FarmServiceTest.kt:201-206`; `FarmControllerIT.kt:157-158` | ✅ PASS |
| 10 | Farm win < 5000 ms after the previous → 409 FARM_TOO_FAST | 4999 rejected, 5000 accepted | `BossRecordTest.kt:62-63` - throw at `104_999`, accept at `105_000`; `FarmServiceTest.kt:243-262`; `FarmControllerIT.kt:167` - `body("code", equalTo("FARM_TOO_FAST"))` | ✅ PASS |
| 11 | "Rever chefes" lists bosses by name and wins left | `Miniboss n`, `Chefe do capítulo`, `10 vitórias restantes hoje` | `GS/adapters/phaser/views/farmView.test.js:11-12`; `game/e2e/farm.spec.js:45-47` | ✅ PASS |
| 12 | Picked boss fought with campaign numbers, restarted after each fight | same health and timer, loop | `ClickerGame.test.js:1773-1775` - health `50`, `'Time: 30'`; `:1795-1797` - same boss back; `game/e2e/farm.spec.js:66-74` | ✅ PASS |
| 13 | Wins left 0 → leave the loop, list with 0 left | farm ends, list shown | `ClickerGame.test.js:1850-1854` - `farmBoss == null`, panel open, chapter boss disabled, `'0 vitórias restantes hoje'`; `game/e2e/farm.spec.js:90-93` | ✅ PASS |
| 14 | HUD "Rever chefe" + boss name; saved position unchanged | label, no campaign report | `ClickerGame.test.js:1773,1776` - `'Rever chefe: Miniboss 1'`, encounter still stage 3 phase 1; `:1810` no campaign report; `game/e2e/farm.spec.js:75-76` | ✅ PASS |

**Status**: ❌ Gaps present - 55/63 ACs matched the spec outcome; 5 gaps (Reg 5, Drop 10, Drop 11, Fusion 9, Fusion 11), 1 label gap (Screens 5), 1 spec-precision gap (Screens 8).

---

## Discrimination Sensor

Scratch: `git worktree add <scratchpad>/wt HEAD` (outside the repo), `game/node_modules` junctioned in, each mutant applied by script, tested, and reverted; worktree removed afterwards. Real tree `git status --porcelain` before and after: the same three untracked `game/public/assets/coin-*.png`.

| Mutation | File:line | Description | Tests run | Killed? |
| -------- | --------- | ----------- | --------- | ------- |
| M1 | `domain/CardDrops.kt:43` | `chance() < minibossRate` → `<=` | backend unit | ✅ Killed (CardDropsTest, ProgressServiceTest, FarmServiceTest at r = 0.01) |
| M2 | `domain/CardDrops.kt:45` | first chapter boss win rolls like later wins | backend unit | ✅ Killed (CardDropsTest, ProgressServiceTest) |
| M3 | `domain/PlayerCards.kt:45` | `stars !in 0 until MAX_STARS` → `0..MAX_STARS` (3-star fusable) | backend unit | ✅ Killed (PlayerCardsTest, HeroServiceTest) |
| M4 | `domain/BossRecord.kt:43` | throttle `<` → `<=` | backend unit | ✅ Killed (BossRecordTest, FarmServiceTest 5000 ms) |
| M5 | `domain/BossRecord.kt:29` | daily limit `>=` → `>` | backend unit | ✅ Killed (BossRecordTest, FarmServiceTest) |
| M6 | `domain/ChapterOrder.kt:17` | swap chapter 2 and 3 elements | backend unit | ✅ Killed (CardDropsTest, FarmServiceTest, ...) |
| M7 | `service/FarmService.kt:57` | skip `requireWinsLeft` | backend unit | ✅ Killed (FarmServiceTest 11th win) |
| M8 | `service/FarmService.kt:60` | a farm win also saves the progress (reset to start) | backend unit | ✅ Killed (FarmServiceTest progress unchanged) |
| M9 | `service/ProgressService.kt:49` | award cards on FAILED too | backend unit | ✅ Killed (ProgressServiceTest no roll on failed boss) |
| M10 | `service/ProgressService.kt:24` | drop `@Transactional` | backend unit + IT | ✅ Killed, only incidentally (ProgressControllerIT concurrency test; no test asserts the rollback) |
| M11 | `service/CardRewards.kt:51` | a dropped card also becomes the leader | backend unit + IT | ❌ Survived |
| M12 | `service/CardRewards.kt:52` | delete the "Card dropped" INFO log | backend unit | ❌ Survived |
| M13 | `service/FarmService.kt:54` | farm FAILED no longer returns early (rolls, counts, throttles) | backend unit | ✅ Killed (FarmServiceTest failed farm) |
| M14 | `service/UserService.kt:25` | drop `@Transactional` on registration | backend unit + IT | ❌ Survived |
| M15 | `adapter/repository/PlayerCardsRepository.kt:15` | drop `@Lock(PESSIMISTIC_WRITE)` on the cards row | backend unit + IT | ❌ Survived |
| G1 | `game/src/domain/heroes/heroes.js:31` | `canFuse: copies >= 3` → `> 3` | vitest all | ✅ Killed (heroes, fusionView, HeroUi) |
| G2 | `game/src/adapters/phaser/ClickerGame.js` `winFarm` | a farm win also calls `session.clear()` | vitest ClickerGame | ✅ Killed (4 farm tests) |
| G3 | `game/src/adapters/phaser/HeroUi.js:104` | opening a screen no longer calls `pause()` | vitest phaser | ✅ Killed (HeroUi, ClickerGame) |
| G4 | `game/src/domain/heroes/heroes.js:35` | `stars >= slot` → `>` | vitest all | ✅ Killed (heroes.test) |
| G5 | `game/src/adapters/phaser/HeroUi.js:12` | notice 3000 ms → 5000 ms | vitest phaser | ✅ Killed (HeroUi notice) |
| G6 | `game/src/adapters/phaser/ClickerGame.js:557` | leave the farm at `< 0` wins instead of `<= 0` | vitest ClickerGame | ✅ Killed |
| G7 | `game/src/adapters/phaser/views/bagView.js:45` | button label "Ir para a fusão" → "Fundir agora" | vitest all | ❌ Survived |

**Sensor depth**: P0-full manual (≥ 5 mutations; the feature touches data integrity: drops, fusion counts, daily limit)
**Result**: 17/22 killed, 5 survived (M11, M12, M14, M15, G7) - ❌ FAIL (surviving mutants become fix tasks)

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Domain rules are small pure functions (`CardDropper`, `BossRecord`, `PlayerCards`, `ChapterOrder`); views are plain DOM builders |
| Surgical changes | ✅ Changes to existing code are limited to registration (`startingElement`), the outcome response (`drop`) and the combat scene hooks |
| No scope creep | ✅ No skill execution, no leader bonus effect, no coin drops on farm (all out of scope) |
| Matches patterns | ✅ Ports + fakes, `@Transactional` services, ApiError handling, data-testid DOM views; ktlint passes |
| Spec-anchored outcome check (asserted values match spec) | ⚠️ Exact codes, rates, boundaries and Portuguese labels are asserted; error-line text is not fixed by the spec; "Ir para a fusão" not asserted |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ❌ Repository "locking contract" (matrix row) has no test; the drop/fusion log ACs and registration atomicity have no test |
| Every test maps to a spec requirement - no unclaimed tests | ✅ Spot-checked HeroUi, FarmService and ClickerGame farm tests: each maps to an AC, an edge case or a Done-when |
| Test integrity (modified existing tests) | ✅ `MainMenu.test.js`, `userApi.test.js`, `e2e/auth.spec.js`, `UserServiceTest.kt`, `ProgressServiceTest.kt`, `UserControllerIT.kt`, `SecurityIT.kt`, `WalletFlowIT.kt`, `AuthControllerIT.kt`: removed lines are only the old `signUp`/`create` call shapes, each replaced by the same assertion plus `startingElement`; no assertion was dropped or weakened. `ClickerGame.test.js` and `ProgressControllerIT.kt` only gained tests |
| Documented guidelines followed: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, root `CLAUDE.md` | ✅ |

---

## Edge Cases

- [x] 4 blank copies, fuse once → 1 blank + 1 one-star: `BT/domain/PlayerCardsTest.kt:75-76` - `copiesOf("kael", 0) == 1`, `copiesOf("kael", 1) == 1`
- [x] Owned with only blank copies → colour, 0 stars, all skills locked: `GS/adapters/phaser/views/catalogView.test.js:33-34` - not grey, `'0★'`; `game/e2e/heroes.spec.js:69` - 3 locked rows for the owned blank Kael
- [x] GET /heroes fails → error line, no grid: `HeroUi.test.js:169-171` - `'Não foi possível carregar.'`, `hero-grid toBeNull()`
- [x] Two tabs fuse the same copies → second call 409, bag reloads on next open: `game/e2e/heroes.spec.js:98-103` (fake backend lost the copies, error shown, `'3/3'` kept); every open reloads (`HeroUi.show` calls `heroes.load()`, `HeroUi.test.js:141`; reopen shows backend state `heroes.spec.js:84-88`); backend 409 `HeroControllerIT.kt:191`
- [x] Drop and daily limit judged per report: `FarmServiceTest.kt:214-221` - the 10th win rolls (`chance.reads == 1`), the 11th is refused without a roll
- [ ] FIRE player's first chapter 1 boss win → blank Lyra **and the leader stays unchanged**: the Lyra drop is asserted (`ProgressServiceTest.kt:204`, `CardsFlowIT.kt:74`) but no test asserts the leader afterwards; mutant M11 survived

---

## Gate Check

- **Gate commands**: `cd backend && ./gradlew --offline cleanTest build` (ktlint + unit + Testcontainers ITs); `cd game && npm run build && npm test`; `cd game && npm run test:e2e`
- **Backend**: BUILD SUCCESSFUL (3m 6s), 441 tests (155 in `*IT`), 0 failed, 0 skipped
- **Game unit**: build OK; 33 files, 530 tests passed, 0 failed
- **Game e2e**: 44 passed, 0 failed, 0 flaky in this run (3.5 min)
- **Test count before feature** (`@Test` / `it(` / `test(` declarations at `ab9cc9f`): backend 282, game unit 360, e2e 28
- **Test count after feature** (same count at HEAD): backend 443, game unit 499, e2e 44
- **Delta**: +161 backend, +139 game unit (declarations; parametrised cases make the executed 530), +16 e2e; no test was deleted
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

### Fix 1: Registration is not proven atomic (Reg AC 5)

- **Root cause**: `UserServiceTest.kt:80` fails before `user.save`; nothing fails the cards save after the user row is written.
- **Fix task**: add a `UserServiceTest` with a `PlayerCardsRepositoryPort` whose `save` throws and assert the exception propagates, and a `UserControllerIT` (or IT with a failing bean) asserting `jpaUserRepository.count() == 0` after the failure.
- **Priority**: Major

### Fix 2: Concurrent fusions are not tested (Fusion AC 9, matrix "locking contract")

- **Root cause**: no concurrent test on `findForUpdate` of the cards row.
- **Fix task**: `PlayerCardsRepositoryIT` (like `ProgressRepositoryIT` two-thread lock test) or a `HeroControllerIT` firing two fuses with exactly 3 copies at once, asserting one 200, one 409 `NOT_ENOUGH_CARDS`, copies `{0: 0, 1: 1}`.
- **Priority**: Major

### Fix 3: Leader must stay unchanged on a drop (edge case)

- **Root cause**: no assertion of `leaderId` after a chapter boss drop.
- **Fix task**: in `ProgressServiceTest` "first chapter boss win" and `CardsFlowIT` after the chapter boss clear, assert `leaderId == "kael"`.
- **Priority**: Minor

### Fix 4: Outcome rollback is only proven by exception propagation (Drop AC 10)

- **Root cause**: `ProgressServiceTest.kt:260` asserts the throw, not the stored progress.
- **Fix task**: an IT that makes the cards save fail (e.g. a `@MockitoSpyBean`/test bean throwing) and asserts the stored progress position is unchanged after the 500.
- **Priority**: Minor

### Fix 5: INFO logs of drops and fusions are untested (Drop AC 11, Fusion AC 11)

- **Root cause**: no log capture.
- **Fix task**: capture the `CardRewards` and `PlayerCards` loggers (logback `ListAppender`) and assert the `username`, `hero` and `source`/`stars` fields.
- **Priority**: Minor

### Fix 6: "Ir para a fusão" label not asserted (Screens AC 5)

- **Fix task**: `bagView.test.js` - `expect(detail.querySelector('[data-testid="bag-go-fusion"]').textContent).toBe('Ir para a fusão')`.
- **Priority**: Cosmetic

### Fix 7 (success criterion, not an AC): 27 blank copies → 3 stars by e2e

- **Root cause**: spec Success Criteria asks for an e2e that fuses up to a 3-star hero; `heroes.spec.js` only fuses 0 → 1 star.
- **Fix task**: e2e with `cards: { yan: { copies: { 'kael:0': 27 } } }` fusing nine, three and one time, asserting all three skill slots unlocked.
- **Priority**: Minor

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| CHAR-01 | Pending | ✅ Verified |
| CHAR-02 | Pending | ❌ Needs Fix (registration atomicity) |
| CHAR-03 | Pending | ✅ Verified |
| CHAR-04 | Pending | ✅ Verified |
| CHAR-05 | Pending | ❌ Needs Fix (rollback indirect, drop log untested, leader-unchanged edge) |
| CHAR-06 | Pending | ✅ Verified |
| CHAR-07 | Pending | ❌ Needs Fix (concurrent fusion, fusion log) |
| CHAR-08 | Pending | ✅ Verified |
| CHAR-09 | Pending | ⚠️ Label gap ("Ir para a fusão") |
| CHAR-10 | Pending | ✅ Verified |
| CHAR-11 | Pending | ✅ Verified |
| CHAR-12 | Pending | ✅ Verified |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 55/63 ACs matched the spec outcome; 5 gaps, 1 label gap, 1 spec-precision gap
**Sensor**: 22 mutations, 17 killed, 5 survived
**Gate**: backend 441 passed, game unit 530 passed, e2e 44 passed, 0 failed

**What works**: every drop-rate boundary (0.01, 0.10, first-win certainty, chapter 5), chapter order for the three starts, fusion rules (0..2, 3-star refused, 4 → 1 + 1), skill unlock by stars, daily limit (10th allowed, 11th 409, UTC reset), 5000 ms throttle boundary, farm never moving progress, all error codes and statuses, the HUD buttons outside the pause menu, pause on open, skill bar that does nothing on click, Portuguese labels and the 3 s notice. All gates are green.

**Issues found**: registration atomicity and concurrent fusion have no test (Fix 1, 2); a drop could change the leader unnoticed (Fix 3); rollback and logs are not asserted (Fix 4, 5); one label unasserted (Fix 6); the 3-star e2e success criterion is missing (Fix 7).

**Next steps**: route Fix 1 to Fix 6 as fix tasks (tests only, no production change needed unless a new test fails), then re-run the Verifier.

**Verdict**: FAIL
