# Hero Team Validation

**Date**: 2026-11-19
**Spec**: `.specs/features/hero-team/spec.md` (approved 2026-11-19, Q45 and Q46 at the recommended defaults)
**Diff range**: `0248def..c5847a8` (backend T1 to T6 `7ac77ba..845bd5a`; game T7 to T20 `a9d2c0a..1c796b7`; e2e T21 to T26 `7d97a29..f7c59df`, `72842bb`, `5179a69`; UI review `7542f7b`; UI fixes T28 `5e72889`, T29 `671f452`, T30 `7435d25`; UI review round 2 `a9eb31b`; author check `ae14d63`, `33c55f6`, `c5847a8`)
**Verifier**: independent sub-agent (author ≠ verifier), round 1 of 3
**Full run**: `c5847a8` for all four suites (backend, game unit, e2e in 14 shards, deploy)
**Coverage summaries**: `.specs/features/hero-team/coverage/` (`jacocoTestReport.xml`, `unit-coverage-summary.json`, `e2e-coverage-summary.json`), copied from the round 1 full runs at `c5847a8`. JaCoCo was copied before the backend mutants ran, because `test --tests` rewrites `backend/build/reports/jacoco`; use the copy, not the build folder. The e2e summary merges all 14 shards (484 raw files, one per test). The folder is git-ignored (`.gitignore:13`) and not committed.

**Verdict**: FAIL
**Result**: FAIL

The feature works as the spec intends. Every backend criterion is pinned by an integration test, and 34 of 35 mutants were killed. The verdict is FAIL because the tests leave gaps. One mutant survived: a spec edge case has no test (the frame-end rule, G24). Three ACs are covered for only part of what they list (AC One damage 9, Allies fight 8, Passives 2 and 4). A feature e2e scenario (`heroTeam.spec.js:347`) fails under load because of a race in the test. Every gap is a test-only fix plus one spec wording fix, and no production code has to change.

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 to T6 (backend domain, storage, routes, ADR) | ✅ Done | `[x]` in `tasks.md`; T4 renamed the use case file for ktlint (documented in the task note) |
| T7 to T20 (game domain, application, scene, Equipe screen) | ✅ Done | `[x]` |
| T21 to T26 (fake backend and e2e) | ✅ Done | `[x]` |
| T27 (UI review) | ✅ Done | `[x]` and `ui-review.html` round 2 reads `APROVADO` (`a9eb31b`); its two Done-when boxes (`tasks.md:2548-2549`) are still unticked (cosmetic) |
| T28 to T30 (UI fixes) | ✅ Done | `[x]`; T30 also moved slot 3 from y 450 to y 462 in the spec's formation table and in Allies on the Field AC 1 |

---

## Spec-Anchored Acceptance Criteria

Paths: `<it>` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`; game unit files are under `game/src`; e2e files under `game/e2e`.

### P1: Team and slots on the backend (TEAM-01 to TEAM-04)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 `GET /heroes` answers `team` | `unlocked`, `openSlots`, `boughtSlots`, `slotPrices` `[10000, 20000, 30000, 40000]`, `allies` | `<it>/adapter/web/HeroControllerIT.kt:227` all five fields of a new player; `:242` cleared `1..6` → `unlocked` true, `openSlots` 2; `:255` stored allies `["lyra", null, null, null]`; `<it>/domain/TeamTest.kt:53` openSlots of every row, `:64` prices | ✅ PASS |
| 2 no bought slot | `boughtSlots` 0, `allies` four nulls | `HeroControllerIT.kt:227` - `team.boughtSlots` 0, `team.allies` `[null, null, null, null]` | ✅ PASS |
| 3 purchase | `slotPrices[b]` taken, b + 1 stored, 200 with `team` and `wallet` | `<it>/adapter/web/TeamControllerIT.kt:321` 15 000 copper → `boughtSlots` 1, wallet 0 gold 50 silver 0 copper, stored copper 5 000 (the spec's Independent Test); `<it>/service/TeamServiceTest.kt:151` slot 4 takes 40 000 | ✅ PASS |
| 4 mismatch | 409 `TEAM_SLOT_MISMATCH`, stored `team` in the body, nothing changed | `TeamControllerIT.kt:340` - `code`, `team.boughtSlots` 1, `team.openSlots` 1, `team.unlocked` true, copper still 5 000 | ✅ PASS |
| 5 locked | 409 `TEAM_SLOT_LOCKED`, nothing changed | `TeamControllerIT.kt:358` copper stays 50 000; `:370` before the chapter 5 boss | ✅ PASS |
| 6 max | 409 `TEAM_SLOTS_MAX` | `TeamControllerIT.kt:378` | ✅ PASS |
| 7 copper | 409 `NOT_ENOUGH_COPPER`, nothing changed | `TeamControllerIT.kt:387` 9 999 copper stays, team stays `Team()` | ✅ PASS |
| 8 bad `fromSlots` | 400 `INVALID_TEAM_SLOT_REQUEST` for missing, not an integer, negative | `TeamControllerIT.kt:399` missing, `:413` string, `:420` 0.5, `:427` -1 | ✅ PASS |
| 9 double purchase | one applied, price taken once, the other 409 `TEAM_SLOT_MISMATCH` | `TeamControllerIT.kt:459` - answers `[200, 409 TEAM_SLOT_MISMATCH]`, copper 30 000 → 20 000, `boughtSlots` 1 | ✅ PASS |
| 10 save | 200 with `leaderId` and `team`, stored | `TeamControllerIT.kt:93` - `leaderId` kael, every team field, `teamRepository.find` equals `Team(1, [lyra, null, null, null])` | ✅ PASS |
| 11 idempotent save | 200 twice, same stored team | `TeamControllerIT.kt:113` - both 200, equal bodies, stored team | ✅ PASS |
| 12 locked save | 409 `TEAM_LOCKED`, nothing stored | `TeamControllerIT.kt:129` | ✅ PASS |
| 13 slot not bought | 409 `TEAM_SLOT_NOT_BOUGHT`, nothing stored | `TeamControllerIT.kt:138` (the Independent Test body `["lyra", "orina", null, null]`) | ✅ PASS |
| 14 not owned | 409 `HERO_NOT_OWNED`, nothing stored | `TeamControllerIT.kt:154` | ✅ PASS |
| 15 outside the catalog | 404 `HERO_NOT_FOUND` | `TeamControllerIT.kt:165` | ✅ PASS |
| 16 invalid body | 400 `INVALID_TEAM` for missing, not 4 entries, a bad entry, a hero twice, the leader | `TeamControllerIT.kt:174`, `:181`, `:188`, `:195`, `:202`, `:209`, `:219` | ✅ PASS |
| 17 check order | `INVALID_TEAM` < `HERO_NOT_FOUND` < `TEAM_LOCKED` < `TEAM_SLOT_NOT_BOUGHT` < `HERO_NOT_OWNED`; `INVALID_TEAM_SLOT_REQUEST` < `TEAM_SLOT_MISMATCH` < `TEAM_SLOTS_MAX` < `TEAM_SLOT_LOCKED` < `NOT_ENOUGH_COPPER` | PUT: `TeamControllerIT.kt:228`, `:235`, `:242`, `:251`; POST: `:427` (negative before anything), `:434`, `:442`, `:451`; domain `TeamTest.kt:111`, `:116`, `:196` to `:217` | ✅ PASS |
| 18 leader from slot n | new leader, old leader in slot n, answer `leaderId` and `team` | `HeroControllerIT.kt:270` - `leaderId` lyra, `team.allies` `[kael, null, null, null]`, stored; `<it>/service/HeroServiceTest.kt:199` slot 2 | ✅ PASS |
| 19 leader outside the team | `allies` unchanged | `HeroControllerIT.kt:286`; `HeroServiceTest.kt:211` | ✅ PASS |
| 20 reset | `unlocked`, `openSlots`, `boughtSlots`, `allies` kept | `HeroControllerIT.kt:300` - all four after `POST /account/reset`; `TeamControllerIT.kt:506` bought slots after a reset | ✅ PASS |
| 21 concurrent saves | stored team equals one of the bodies | `TeamControllerIT.kt:272` - both 200, stored allies in the two bodies | ✅ PASS |
| 22 401 | 401 without a token | `TeamControllerIT.kt:262` PUT, `:480` POST; `HeroControllerIT.kt:325` every hero route | ✅ PASS |
| 23 own team only | read and change only one's own team | `TeamControllerIT.kt:303` (`ana` saves, `yan` reads four nulls); `:490` a purchase touches only the buyer's team and wallet; `<it>/adapter/repository/TeamRepositoryIT.kt:66`. The backend agent registered `ana` as `FIRE` instead of the task's player so she can hold Lyra (`tasks.md:716`); the test still proves the AC: a save that wrote to the wrong row would show Lyra in `yan`'s answer | ✅ PASS |
| 24 user deleted | team row deleted | `TeamRepositoryIT.kt:75` - 0 rows after `deleteById("yan")` (mutant B8 killed) | ✅ PASS |
| 25 previous backend on V12 | previous release starts and answers | `<it>/adapter/repository/PreviousBackendCompatibilityIT.kt:171` (previous migrations validate, V12 is `FUTURE_SUCCESS`), `:60` previous entities pass the schema check | ✅ PASS |

### P1: Ally hits use the one damage (TEAM-05)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 strike of a tick, never critical | `tickDamage` at 100 %, `critical: false` | `domain/skills/skillCombat.test.js:1090` random 0 → `critical` false, damage 2; E1 to E15 at `:985` to `:1085` | ✅ PASS |
| 2 E2 | 1 per tick | `skillCombat.test.js:989` → 1; e2e `heroTeamCombat.spec.js:138` → 1 | ✅ PASS |
| 3 E6 | 1.6 | `skillCombat.test.js:1014` → 1.6; e2e `heroTeamCombat.spec.js:155` → 1.6 | ✅ PASS |
| 4 E7 Prisão | 2.5 | `skillCombat.test.js:1020` → 2.5; e2e `heroTeamCombat.spec.js:166` → 2.5 | ✅ PASS |
| 5 E8 Bênção | 2.6 | `skillCombat.test.js:1029` → 2.6; e2e `heroTeamCombat.spec.js:176` → 2.6 | ✅ PASS |
| 6 E9 Brado | 1.8 | `skillCombat.test.js:1038` → 1.8; e2e `heroTeamCombat.spec.js:186` → 1.8 | ✅ PASS |
| 7 E10 `PHYSICAL_BREAK` 5 | 1.3 | `skillCombat.test.js:1047` → 1.3; e2e `heroTeamCombat.spec.js:196` → 1.3 | ✅ PASS |
| 8 E13 | 2 with Ventos, Bomba de Fumaça, combo, critical pieces | `skillCombat.test.js:1067` Ventos + Bomba + critical ring, random 0 → 2; e2e `heroTeamCombat.spec.js:205` Ventos + critical ring → 2; `:343` with a running COMBO streak → 2 | ✅ PASS |
| 9 E14 leader stars and power talents | ally hit unchanged | Stars: e2e `heroTeamCombat.spec.js:228` a 3-star Kael leads, the tick is 2. **Power talents: no discriminating test.** `skillCombat.test.js:1078` builds the strong leader but never uses it for the ally (`land(combat(), monsterWith(), ally())` does not depend on it), and no scene or e2e test runs allies with `CLICK_DAMAGE` or `CRIT_*` talents | ❌ GAP (power talents half) |
| 10 old payload | `physicalDefense` 50 → E1 ally deals 1 | e2e `heroTeamCombat.spec.js:147` → 1; `domain/talents/talents.test.js:213` the passive on an old payload reads 35 | ✅ PASS |

### P1: Allies fight (TEAM-06, TEAM-07, TEAM-08)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 rhythm | every 1000 ms of fight time, the first 1000 ms after the monster appears | `domain/combat/allyCombat.test.js:15` nothing at 999, one tick at 1000; `adapters/phaser/ClickerGame.test.js:5156`; e2e `heroTeamCombat.spec.js:100` 10 → 10 at 999 ms, 8 at 1000 ms | ✅ PASS |
| 2 star multiplier | 2 to 20 for 0 to 9 stars | `domain/combat/allyAttacker.test.js:9` all ten rows | ✅ PASS |
| 3 E1 | 2 | `skillCombat.test.js:985`; e2e `heroTeamCombat.spec.js:100` | ✅ PASS |
| 4 E3 | spec: Orina 3 stars → 105.6 | `skillCombat.test.js:993` → 105.6 (SkillCombat without the passives); e2e `heroTeamCombat.spec.js:239` Lyra with the same pieces → 105.6 and `:251` Orina → 137.28 | ⚠️ Spec-precision gap: E3 omits Orina's own Erosão Arcana, which the Passive Table and Q45 apply to every hit, the allies' included. The code follows the Passive Table (137.28), which is the spec's intent; the E3 row needs rewording (product owner) |
| 5 E4 | 2.16 | `skillCombat.test.js:999`; e2e `heroTeamCombat.spec.js:273` | ✅ PASS |
| 6 E12 | 20 | `skillCombat.test.js:1063`; e2e `heroTeamCombat.spec.js:264` | ✅ PASS |
| 7 E15 leader change | new element on the next hit: 4 then 1 against NATURE | e2e `heroTeamCombat.spec.js:284` (Kael FIRE 4, then Orina WATER 1, through the Líder screen); `skillCombat.test.js:1085`; `ClickerGame.test.js:5284` (its comment notes the task text's WATER-vs-FIRE example was wrong; it swaps Orina's element to NATURE, which still proves the switch) | ✅ PASS |
| 8 fusion or equipment | new values on the next hit | Equipment: `ClickerGame.test.js:5301` 2 → 4 after a weapon; e2e `heroTeamCombat.spec.js:303`. **Fusion to more stars: no test** in the scene, the HeroUi tests or e2e | ❌ GAP (fusion half) |
| 9 ally kill | handled as a click kill, once; later slots of the tick do not land | `allyCombat.test.js:38`; `ClickerGame.test.js:5206` (kill path once, slot 2 does not land); e2e `heroTeamCombat.spec.js:324` coins drop and the next monster appears | ✅ PASS |
| 10 number | one number with the tick sum, `#7fd4ff`, 28 px, damage font, x 740 | `ClickerGame.test.js:5166` colour, size, font, x; `:5179` one number for two allies; e2e `heroTeamCombat.spec.js:100` `{ text: '2', x: 740, size: '28px' }` | ✅ PASS |
| 11 combo | streak and timer unchanged | `ClickerGame.test.js:5247`; e2e `heroTeamCombat.spec.js:343` | ✅ PASS |
| 12 health bar | bar and HP text updated | `ClickerGame.test.js:5197`; e2e `heroTeamCombat.spec.js:100` `HP 8/10` | ✅ PASS |
| 13 below chapter 5 | no ally hit, no passive | `ClickerGame.test.js:5221`; e2e `heroTeamCombat.spec.js:114` (reset to chapter 1, 3 s, no damage), `heroTeamPassives.spec.js:218` | ✅ PASS |
| 14 hero screen or hidden tab | ally hits keep landing | `ClickerGame.test.js:5275`; e2e `heroTeamCombat.spec.js:364` | ✅ PASS |
| 15 pause | no hit, remaining time kept | `ClickerGame.test.js:5259`; e2e `heroTeamCombat.spec.js:374` (600 ms, 10 s paused, 399 ms no hit, 1 ms hit) | ✅ PASS |

### P1: Equipe screen and slot purchase (TEAM-09, TEAM-13)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 HUD button | `hud-team` right after `hud-leader`, Lucide swords 22 px stroke 2.75; absent while locked | e2e `heroTeam.spec.js:82` (absent, six buttons), `:89` (order, 22 x 22, `stroke-width` 2.75); `adapters/phaser/HeroUi.test.js:2493`, `:2502` | ✅ PASS |
| 2 rail bottom | above y 624 | e2e `heroTeam.spec.js:89` - `rail.y + rail.height <= 624` | ✅ PASS |
| 3 panel and slot cards | title `Equipe`, 5 cards 132 x 210, 16 px apart, `Líder` with 3 px solid `#e8b64c`, `Aliado 1` to `4` | e2e `heroTeam.spec.js:109` | ✅ PASS |
| 4 filled and leader cards | sprite 80 x 80, name, stars; ally `Dano` and passive line; leader bonus | e2e `heroTeam.spec.js:143` leader; `heroTeamEditing.spec.js:53`, `:229` (every passive line); `adapters/phaser/views/teamView.test.js:76`, `:88` | ✅ PASS |
| 5 empty | 2 px dashed, `vazio` | `teamView.test.js:97`; e2e `heroTeamStyle.spec.js:93`, `heroTeam.spec.js:224` | ✅ PASS |
| 6 buyable | transparent, 2 px solid `--gold-400`, 32 x 32 coin, price | e2e `heroTeam.spec.js:158` - background `rgba(0, 0, 0, 0)`, border `rgb(224, 180, 90)` 2 px solid, coin 32 x 32, price `1` | ✅ PASS |
| 7 locked | opacity 0.5, `Chefe do capítulo <4+n>`, disabled | e2e `heroTeam.spec.js:158` (slots 2 to 4, chapters 6 to 8); `teamView.test.js:113` (mutant G21 killed) | ✅ PASS |
| 8 waiting | opacity 0.5, no chapter text, disabled | e2e `heroTeam.spec.js:185`; `heroTeamStyle.spec.js:131` (mutant E1 killed); `teamView.test.js:121` | ✅ PASS |
| 9 available list | owned heroes outside the team, sprite 64, name, stars, passive name, or the empty text | e2e `heroTeam.spec.js:347`; `teamView.test.js:224`, `:240`; style `heroTeamStyle.spec.js:197` | ✅ PASS |
| 10 pick into the selected slot | hero placed (replacing), `PUT /team` with 4 entries | `HeroUi.test.js:2632`, `:2645`; e2e `heroTeamEditing.spec.js:53`, `:78` | ✅ PASS |
| 11 pick with no selection | first empty bought slot | `HeroUi.test.js:2655`; e2e `heroTeamEditing.spec.js:68` | ✅ PASS |
| 12 no target | every entry disabled | `HeroUi.test.js:2664`; e2e `heroTeamEditing.spec.js:92`; `teamView.test.js:46` (mutant G22 killed) | ✅ PASS |
| 13 select | `data-selected` true, 3 px ember outline, others unselected | `HeroUi.test.js:2603`, `:2623`; e2e `heroTeamEditing.spec.js:103`, `heroTeamStyle.spec.js:186` | ✅ PASS |
| 14 actions enabled | only with a filled card selected | `teamView.test.js:57`, `:203`; e2e `heroTeamEditing.spec.js:103` | ✅ PASS |
| 15 Remover | slot emptied, `PUT /team`, slot stays selected | `HeroUi.test.js:2674`; e2e `heroTeamEditing.spec.js:121` | ✅ PASS |
| 16 Tornar líder | `PUT /leader`, answer shown, selection cleared | `HeroUi.test.js:2686`; e2e `heroTeamEditing.spec.js:133` | ✅ PASS |
| 17 busy | every card, entry and action disabled, `Fechar` enabled | `HeroUi.test.js:2699`; e2e `heroTeamEditing.spec.js:147`; `teamView.test.js:248` | ✅ PASS |
| 18 team damage | `Dano da equipe: <n>/s`, `0` with no ally | e2e `heroTeam.spec.js:385` `0/s`, `heroTeamEditing.spec.js:172` `5/s`; `teamView.test.js:42` | ✅ PASS |
| 19 inactive status | `A equipe luta a partir do capítulo 5.` below chapter 5 | e2e `heroTeam.spec.js:392`; `HeroUi.test.js:2561`; `teamView.test.js:154` | ✅ PASS |
| 20 failed save or leader | error text, panel open, heroes reloaded | `HeroUi.test.js:2710`, `:2724`; e2e `heroTeamEditing.spec.js:181`, `:194` | ✅ PASS |
| 21 new slots after a boss | heroes reloaded at the next encounter; button appears without a reload | e2e `heroTeam.spec.js:412` (chapter 5 win, same document), `:437` (chapter 6 win opens slot 2); `ClickerGame.test.js:5389` (mutant G15 killed) | ✅ PASS |
| 22 `formatDamage` | `105.6`, `12.5K` | e2e `heroTeam.spec.js:425` `Dano: 12.5K/s` and `Dano da equipe: 12.5K/s`; `teamView.test.js:35`. A raw number would read `12500`, so the test pins `formatDamage`; `105.6` itself is pinned only on the combat number (`heroTeamCombat.spec.js:239`) | ✅ PASS |
| 23 closed during a request | answer kept, nothing rendered, stored team with controls enabled on reopening | `HeroUi.test.js:2734`, `:2753`, `:2885`; e2e `heroTeamEditing.spec.js:207` | ✅ PASS |

### P1: Slot purchase dialog (TEAM-10)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 ask | `Comprar a vaga <n> por <p> ouro?`, `Comprar`, `Cancelar`, no request | `HeroUi.test.js:2789`; e2e `heroTeam.spec.js:200` | ✅ PASS |
| 2 short | `Comprar` disabled, `Moedas insuficientes` | `HeroUi.test.js:2808` (9 999 copper); `teamView.test.js:66` 9 999 false, 10 000 true; e2e `heroTeam.spec.js:215` | ✅ PASS |
| 3 confirm | `POST /team/slots` with the shown bought count, both buttons disabled until the answer | `HeroUi.test.js:2817` `fromSlots` 0, `:2861` slot 2 → `fromSlots` 1 (mutant G19 killed); e2e `heroTeam.spec.js:315` | ✅ PASS |
| 4 success | dialog closed, `data-flash` 400 ms, notice 3000 ms, wallet in the HUD, new slot empty and selected | `HeroUi.test.js:2829`, `:2844` (400 ms and 3000 ms); `ClickerGame.test.js:5379` wallet text; e2e `heroTeam.spec.js:224` (wallet 0) | ✅ PASS |
| 5 cancel | dialog closed, no request | `HeroUi.test.js:2798`; e2e `heroTeam.spec.js:200` | ✅ PASS |
| 6 failure | dialog closed, `Não foi possível comprar a vaga.`, panel open, heroes reloaded | `HeroUi.test.js:2871`; e2e `heroTeam.spec.js:333` | ✅ PASS |

### P2: Ally passives (TEAM-11)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 Kael | `Time: 35`, `Time: 39` with `MINIBOSS_TIME` 4, `Time: 65` | e2e `heroTeamPassives.spec.js:114`, `:121`, `:128`; `ClickerGame.test.js:5315` (mutant G13 killed) | ✅ PASS |
| 2 Lyra | +10 critical chance on the leader's clicks and skill hits, cap 100 (P4, P5) | Clicks: e2e `heroTeamPassives.spec.js:136` roll 15 critical with Lyra, normal without; `ClickerGame.test.js:5363`; `domain/combat/leaderAttacker.test.js:108`, `:114` (cap; mutant G10 killed). **Skill hits: no test.** No scene or e2e test uses a skill with Lyra in the team; the skill path shares `ClickerGame.leaderAttacker()` with the click, but a shared path covered by one trigger is not evidence for the other | ❌ GAP (skill-hit half) |
| 3 Orina | -15 defense for every hit, floor 0, in the enemy line (P6, P7, E11) | e2e `heroTeamPassives.spec.js:158` `Defesa 25%` and a click of 0.75, `:168` `Defesa 0%`; `talents.test.js:197`, `:201`; `skillCombat.test.js:1055` E11; e2e `heroTeamCombat.spec.js:251` on the allies' own hits | ✅ PASS |
| 4 Vex | -15 critical resistance for the leader's hits, floor 0, in the enemy line (P8, P9) | Clicks and the enemy line: e2e `heroTeamPassives.spec.js:178` `Crit res 15%`, roll 8 critical; `talents.test.js:205`, `:209`; `ClickerGame.test.js:5357`. **Skill hits: no test**, same reason as AC 2 | ❌ GAP (skill-hit half) |
| 5 Seraphine | x1.25, E5 5 per tick | e2e `heroTeamPassives.spec.js:202` → 5; `ClickerGame.test.js:5188`; `skillCombat.test.js:1005` | ✅ PASS |
| 6 leader brings none | no passive of the leader | e2e `heroTeamPassives.spec.js:211`; `ClickerGame.test.js:5324` `Time: 30`; `domain/heroes/team.test.js:95` (mutant G6 killed) | ✅ PASS |
| 7 inactive | no passive | e2e `heroTeamPassives.spec.js:218`; `team.test.js:160` | ✅ PASS |
| 8 team change | next hit and next boss, running countdown kept | e2e `heroTeamPassives.spec.js:225`; `ClickerGame.test.js:5333` | ✅ PASS |
| 9 attribute panel | P10 lines | `domain/equipment/leaderStats.test.js:130` (`20%`, `5s`, `5s`, `15`, `15`); e2e `heroTeamPassives.spec.js:249`; `HeroUi.test.js:2571` | ✅ PASS |
| 10 farm boss | +5 s in a farm fight | e2e `heroTeamPassives.spec.js:264` | ✅ PASS |

### P2: Allies on the field (TEAM-12)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 positions | `hero_<id>` fitted 90 x 120, origin (0.5, 1), (180, 460), (180, 605), (75, 462), (75, 615), depths 0.4, 0.4, 0.3, 0.3 | `ClickerGame.test.js:5457` (mutant G14 killed); e2e `heroTeamField.spec.js:86`, `:97`, `:107` (15 px under the Elementos panel, no overlap) | ✅ PASS |
| 2 leader | 180 x 240 box at (320, 600), depth 0.5 with allies; 320 px at (230, 612) without | `ClickerGame.test.js:5433`, `:5441`; e2e `heroTeamField.spec.js:86`, `:213` | ✅ PASS |
| 3 ally sizes | Kael 90 x 83.7 (0.3), Lyra 40.8 x 120 (0.4) | `ClickerGame.test.js:5468`; e2e `heroTeamField.spec.js:125` | ✅ PASS |
| 4 leader sizes | Kael 180 x 167.4 (0.6), Lyra 81.6 x 240 (0.8) | `ClickerGame.test.js:5450`; e2e `heroTeamField.spec.js:136` | ✅ PASS |
| 5 motion | 24 px right in 100 ms and back in 100 ms | `ClickerGame.test.js:5532` (mutant G17 killed); e2e `heroTeamField.spec.js:159`, `:182` | ✅ PASS |
| 6 redraw on a team or leader change | without reloading the scene | `ClickerGame.test.js:5497`, `:5509`; e2e `heroTeamField.spec.js:213`, `:229` | ✅ PASS |
| 7 active or inactive at the next encounter | redraw at the next encounter | `ClickerGame.test.js:5519`; e2e `heroTeamField.spec.js:192`, `:241` | ✅ PASS |
| 8 no sprite | inactive, empty, unbought, heroes not loaded | `ClickerGame.test.js:5478`, `:5484`, `:5491`; e2e `heroTeamField.spec.js:260` | ✅ PASS |
| 9 no input | a click on a sprite hits the monster | `ClickerGame.test.js:5550`; e2e `heroTeamField.spec.js:266` | ✅ PASS |

**Status**: ❌ four partial gaps (One damage AC 9, power talents half; Allies fight AC 8, fusion half; Passives AC 2 and AC 4, skill-hit half), one spec-precision gap (E3 in Allies fight AC 4). 94 of 98 ACs fully covered, 4 covered for part of what they list. Visible ACs: every Equipe screen, purchase dialog, passive and field AC has an e2e scenario, and so does every combat AC except the uncovered halves above.

---

## Edge Cases

- [x] Reset before the chapter 5 win: `unlocked` false, no button - `HeroControllerIT.kt:227`, e2e `heroTeam.spec.js:82`.
- [x] Reset with bought slots: no fighting in chapters 1 to 4, fighting again from chapter 5 - e2e `heroTeamCombat.spec.js:114`, `heroTeamField.spec.js:192`, `:241`.
- [x] Chapter 5 before its first boss win: active, nothing bought - `team.test.js:62` (active at 5), `fightingAllies` empty with 0 bought `team.test.js:89`.
- [x] Team with 0 allies: no hit, no passive, no sprite - `allyCombat.test.js:98`, `team.test.js:123`, `ClickerGame.test.js:5478`.
- [x] Chapter complete, no monster: no hit - `allyCombat.test.js:75`, `:87`.
- [x] Monster dies between ticks: clock back at 0 - `allyCombat.test.js:50`, `:63` (mutant G2 killed).
- [x] Pause 10 s: first hit after the time still missing - `ClickerGame.test.js:5259`, e2e `heroTeamCombat.spec.js:374`.
- [x] Farm fight at chapter 5 or later: hits and passives - e2e `heroTeamCombat.spec.js:409`, `:425`, `heroTeamPassives.spec.js:264`.
- [x] `PUT /leader` with the current leader: team unchanged - `HeroServiceTest.kt:230`, `TeamTest.kt:238`.
- [x] A later catalog hero does not enter a saved team: allies come only from the stored row (`Team.withAllies`); no code adds heroes.
- [x] Ally kills above the kill allowance: the kill path is the click's (`ClickerGame.test.js:5206`, `afterDamage`), so the wallet rule is unchanged.
- [ ] Ally hit in the frame where Prisão or Bênção ends still gets the effect: **no test**. Mutant G24 (the allies strike after `skills.advance` instead of before) survives every `ClickerGame.test.js` case. The code is right (`ClickerGame.js:940` runs `allyFrame` before `skills.advance`). The unit test `skillCombat.test.js:1098` checks only the hit after Prisão ended, and nothing checks the hit in the frame where it ends.
- [x] One advance of 2500 ms: two ticks, 500 ms kept - `allyCombat.test.js:108`, e2e `heroTeamCombat.spec.js:392`.
- [x] No `team` in `GET /heroes`: locked team - `team.test.js:27`, `application/heroes/heroCollection.test.js:184`, `ClickerGame.test.js:5238`.
- [x] Orina plus `PHYSICAL_BREAK` below 0: 0 - `talents.test.js:201`.
- [x] Lyra plus the leader's chance above 100: 100 - `leaderAttacker.test.js:114`.

---

## Discrimination Sensor

Run with `node scripts/sensor.mjs` in the main checkout. No other agent was testing (process list checked), and the e2e suite had finished. Each mutant uses the narrowest command: one Vitest file, one Playwright test line with `--workers=1`, or one Gradle test class with `.\gradlew.bat test --tests <class>`. Each command's output went to a log in the scratchpad, and every kill was checked against its log as a real test failure, not a crash or a missing command.

Three controls ran first. Each one names a file with an unchanged replacement (find = replace), so a command that passes when nothing is mutated reads `survived`:

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| C1 | `game/src/domain/combat/allyCombat.js` | control: no change, vitest | survived (`Tests 12 passed (12)`) |
| C2 | `game/public/style.css` | control: no change, playwright | survived (`1 passed`) |
| C3 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Team.kt` | control: no change, gradle | survived (`BUILD SUCCESSFUL`) |

The mutants (table printed by the script):

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| G1 | `game/src/domain/combat/allyCombat.js` | first tick lands after 1000 ms, not at it | killed |
| G2 | `game/src/domain/combat/allyCombat.js` | a new monster keeps the old clock | killed |
| G3 | `game/src/domain/heroes/team.js` | team active only from chapter 6 | killed |
| G4 | `game/src/domain/heroes/team.js` | a not-open slot reads buyable | killed |
| G5 | `game/src/domain/heroes/team.js` | Erosao Arcana 10 instead of 15 | killed |
| G6 | `game/src/domain/heroes/team.js` | the leader counts as a fighting ally | killed |
| G7 | `game/src/domain/combat/allyAttacker.js` | ally boss damage dropped | killed |
| G8 | `game/src/domain/skills/skillCombat.js` | Prisao and Brado skip ally hits | killed |
| G9 | `game/src/domain/talents/talents.js` | Erosao Arcana not applied to the defense | killed |
| G10 | `game/src/domain/combat/leaderAttacker.js` | Olho do Falcao not applied | killed |
| G11 | `game/src/domain/equipment/leaderStats.js` | Kael missing from the time lines | killed |
| G12 | `game/src/adapters/phaser/ClickerGame.js` | ally tick does not move the health bar | killed |
| G13 | `game/src/adapters/phaser/ClickerGame.js` | Guarda do Baluarte missing from the countdown | killed |
| G14 | `game/src/adapters/phaser/ClickerGame.js` | slot 3 back at y 450 (T30) | killed |
| G15 | `game/src/adapters/phaser/ClickerGame.js` | no heroes reload on a new chapter | killed |
| G16 | `game/src/adapters/phaser/ClickerGame.js` | ally number gold instead of light blue | killed |
| G17 | `game/src/adapters/phaser/ClickerGame.js` | attack step 12 px | killed |
| G18 | `game/src/adapters/phaser/ClickerGame.js` | allies fight below chapter 5 | killed |
| G19 | `game/src/adapters/phaser/HeroUi.js` | purchase sends the wrong fromSlots | killed |
| G20 | `game/src/adapters/phaser/HeroUi.js` | Equipe button before Lider | killed |
| G21 | `game/src/adapters/phaser/views/teamView.js` | locked slot clickable | killed |
| G22 | `game/src/adapters/phaser/views/teamView.js` | pick disabled with an empty slot and none selected | killed |
| G23 | `game/src/application/heroes/heroCollection.js` | purchase wallet not sent | killed |
| G24 | `game/src/adapters/phaser/ClickerGame.js` | allies strike after the skills advance (frame-edge rule) | survived |
| E1 | `game/public/style.css` | waiting/locked opacity 0.7 | killed |
| E2 | `game/public/style.css` | slot gap 12 px | killed |
| B1 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Team.kt` | TEAM_SLOTS_MAX check dropped | killed |
| B2 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Team.kt` | off by one on TEAM_SLOT_NOT_BOUGHT | killed |
| B3 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Team.kt` | leader swap drops the old leader | killed |
| B4 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Team.kt` | leader accepted as an ally | killed |
| B5 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/TeamService.kt` | every slot costs 1 ouro | killed |
| B6 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/TeamService.kt` | purchase not stored | killed |
| B7 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/TeamController.kt` | decimal fromSlots accepted | killed |
| B8 | `backend/src/main/resources/db/migration/V12__hero_team.sql` | team row not deleted with the user | killed |
| B9 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/HeroService.kt` | GET /heroes ignores the stored team | killed |

**Result**: 35 mutants, 34 killed, 1 survived, 0 invalid; isolation ok

Kill evidence from the logs (failed test, run total):

- G1 `allyCombat.test.js` 10 failed of 12 (`lands nothing at 999 ms and one tick at 1000 ms` first); G2 1 of 12 (`a new monster restarts the clock`).
- G3 2 of 34 (`is false at chapter 4 and true at chapters 5 and 15`); G4 1 (`of a locked team shows four locked slots…`); G5 2 (`Orina brings 15 points off the defense`); G6 1 (`skips the leader`).
- G7 `allyAttacker.test.js` 1 of 9 (`armor pierce and boss damage come from the ally's pieces`); G8 `skillCombat.test.js` 2 of 105 (E7, E9); G9 `talents.test.js` 3 of 37; G10 `leaderAttacker.test.js` 1 of 22; G11 `leaderStats.test.js` 2 of 21 (P10).
- `ClickerGame.test.js` (451 cases): G12 1 (`an ally hit that does not kill moves the health bar…`), G13 2 (`Kael as an ally starts a 30 s miniboss at Time: 35`), G14 1 (formation positions), G15 1 (`the next chapter reloads the heroes`), G16 3 (light-blue number), G17 1 (24 px move), G18 3 (`no ally hits while the campaign stands at chapter 4`).
- `HeroUi.test.js` (189): G19 2 (`Comprar sends fromSlots 0…`, `a purchase of slot 2 sends fromSlots 1`), G20 1. `teamView.test.js` (27): G21 1, G22 2. `heroCollection.test.js` (20): G23 1.
- E1 `heroTeamStyle.spec.js:131` 1 failed (opacity expected `0.5`, received `0.7`); E2 `heroTeam.spec.js:109` 1 failed (gap off by 4).
- Gradle: B1 `TeamTest` 2 failed of 34 (`buy at 4 bought slots is TEAM_SLOTS_MAX`); B2 2 of 34; B3 1 of 34 (`a new leader from slot 2…`); B4 1 of 34 (`withAllies refuses the leader`); B5 `TeamServiceTest` 1 of 13 (`buy of slot 4 takes 40000 copper`); B6 1 of 13; B7 `TeamControllerIT` 1 of 37 (`POST team slots with a decimal fromSlots…`); B8 `TeamRepositoryIT` 5 of 9 (`the row goes with the user` and the cleanups that depend on the cascade); B9 `HeroServiceTest` 1 of 31.

**G24 is not equivalent.** If the allies strike after `skills.advance`, an ally tick that lands in the frame where Prisão de Espinhos or Bênção da Grande Árvore ends loses the effect. The spec's edge case ("WHEN an ally hit lands in the frame where Prisão de Espinhos or Bênção da Grande Árvore ends THEN it SHALL still get the effect") and the design's frame order (`design.md:334`) forbid that. No test pins it (Fix 1).

**Sensor depth**: P0-full for the purchase path (data integrity of gold: B1, B5 to B7 and the order mutants) plus lightweight on the rest. **Result**: 34/35 killed, ❌ FAIL (G24).

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | ✅ `AllyCombat` holds only the clock; the hit reuses `tickDamage` (design approach A) |
| Surgical changes | ✅ Only the files of the design; `PreviousBackendCompatibilityIT` raised to 11 as planned |
| No scope creep | ✅ No team resistance, no enemy schema change (`grep -rn -i "team_resistance\|teamResistance\|TEAM_DAMAGE" backend/src game/src` prints nothing) |
| Matches patterns | ✅ `fromSlots` follows the auto-click mismatch pattern; the stale `view` counter guards late answers (L-096); ordered checks as talents |
| Spec-anchored outcome check | ⚠️ E3 (see the Allies fight table); every other asserted value is a spec value |
| Per-layer Coverage Expectation | ❌ the four partial ACs and the frame-end edge case |
| Every test maps to a spec requirement | ✅ The 106 backend, 196 unit and 92 e2e tests added in the range trace to an AC, an edge case or a task Done-when (style checks: Equipe Screen Layout) |
| Documented guidelines followed | ✅ `CLAUDE.md` (unit for service and domain, e2e for every player-visible behaviour), `tasks.md` Test Coverage Matrix |

Observations that are not gaps:

- `fightingAllies` (`team.js:50`) does not check `hero.owned`. The backend refuses unowned allies (`HERO_NOT_OWNED`), so the game never receives one.
- `teamPassives` applies Vex's `critResistBreak` through `monsterAfterBreak` to every strike. Ally hits are never critical, so in practice it reaches only the leader's hits, as the spec asks.
- `TeamControllerIT.kt:303` registers `ana` as `FIRE`, not as the task's player (`tasks.md:716`), so she can hold Lyra. The test still proves AC 23, because a save that wrote to the wrong row would show Lyra in `yan`'s answer.

---

## Gate Check

| Suite | Command | Result |
| --- | --- | --- |
| Backend | `cd backend && ./gradlew cleanTest test` | 1149 tests in 96 classes, 0 failed, 0 skipped (BUILD SUCCESSFUL, JaCoCo written). Before the feature: 1043 (unified-damage final gate); +106 `@Test` in the range, none removed |
| Game unit | `cd game && npm run test:coverage` | 84 files, 2009 tests, 2009 passed. Before: 1813; +196 `it(` in the range, none removed |
| e2e | `cd game && npm run test:e2e:coverage -- --shard=1/14`, then `-- --keep --shard=k/14` for k = 2 to 14 | 484 tests, 482 passed, 2 failed (`heroTeam.spec.js:347`, `wake.spec.js:56`). Before: 392; +92 `test(` in the range, none removed |
| Deploy | `node --test --experimental-test-coverage "deploy/**/*.test.mjs"` | 289 tests, 287 passed, 2 failed (`deploy/regression.test.mjs:385`, `:412`) |

Skipped tests: none. Test count went up in every suite and no assertion was weakened (`git diff 0248def..c5847a8` removes no test in any suite).

### Failure caused by the feature's tests

| Test | Evidence |
| --- | --- |
| `game/e2e/heroTeam.spec.js:347` (Heróis disponíveis lists…) | Full run, shard 7: `TypeError: Cannot read properties of null (reading 'x')` at `sceneBox` (`heroTeam.spec.js:64`), called from `:360`. Passes alone (`--workers=1`, 1 passed, 23.5 s). Cause: the scenario buys a slot and then measures `team-available-lyra img`, but the 400 ms flash timer and the 3000 ms notice timer re-render the whole panel (`HeroUi.render_team` → `replaceChildren`), so the node can be replaced between `waitFor` and `boundingBox`. The sibling scenario `:259` sleeps the Phaser loop before the purchase for exactly this reason (`:273-274`), but `:347` does not. A race in the feature's own test, so it is listed as a gap (Fix 3), not as unrelated |

### Failures not caused by the feature

| Test | Evidence |
| --- | --- |
| `game/e2e/wake.spec.js:56` (server down message in under 15 s, took 28.7 s) | Passes alone (`--workers=1`, 1 passed, 11.1 s). A timing assertion under 3-worker load, on the known-flake list (`STATE.md:248`). The wake code is not in the range |
| `deploy/regression.test.mjs:385` and `:412` (CLI exit code 3221226505 = 0xC0000409 instead of 0 / 1) | `git diff --name-only 0248def..c5847a8 -- deploy/` is empty. They fail the same way when `deploy/regression.test.mjs` runs alone (23 tests, 21 passed, the same 2 failed): a native Windows crash code of the child process on Node v23.11.0. Environmental, known |

---

## Fix Plans

### Fix 1: Pin the frame-end rule of ally hits (surviving mutant G24)

- **Root cause**: No test lands an ally tick in the same `update` frame in which Prisão de Espinhos or Bênção da Grande Árvore ends. Only "after it ended" is tested (`skillCombat.test.js:1098`).
- **Fix task** (owner `test-engineer`): in `game/src/adapters/phaser/ClickerGame.test.js` (describe `ClickerGame hero team`), use Prisão de Espinhos (level 1, 2 s) with the ally clock set so that one `update(0, delta)` both reaches the ally tick and passes the end of Prisão, and expect the ally hit to be 2.5 (E7). Do the same with Bênção (2.6, E8). Optionally add the same scenario to `heroTeamCombat.spec.js`, after `:166`.
- **Verify**: G24 (the swap of `allyFrame` and `skills.advance` in `ClickerGame.update`) is killed by `npx vitest run src/adapters/phaser/ClickerGame.test.js`.
- **Priority**: Major (spec edge case without a test; blocks PASS).

### Fix 2: One test per trigger in the four partial ACs

- **Root cause**: Each AC lists several triggers for one outcome, and only some triggers have a test (L-098).
- **Fix task** (owner `test-engineer`):
  1. Allies fight AC 8: an ally that **fuses** to more stars hits with the new multiplier on the next tick. Use a scene test with `heroes.fuse` answering Lyra at 1 star, 2 → 4, or an e2e test through the Mochila or Heróis fusion.
  2. One damage AC 9 (E14): a leader with **power talents** (`CLICK_DAMAGE` 20, also `CRIT_CHANCE`) leaves the ally tick at 2 in the scene (`ClickerGame.test.js`) or in e2e. Rewrite `skillCombat.test.js:1078` so the ally it lands is built in the presence of the strong leader, or drop the unused `strong` attacker and state what it proves.
  3. Passives AC 2 and AC 4: a **skill hit** of the leader with Lyra as a fighting ally gets +10 critical chance, and one with Vex meets -15 critical resistance. Use a scene test with a fixed roll, as `ClickerGame.test.js:5363` does for the click.
- **Verify**: each new test fails when its trigger's line is removed (for example, pass `passives: NO_PASSIVES` to the skill path only).
- **Priority**: Minor (the behaviour is correct by a shared code path; evidence is missing).

### Fix 3: Remove the re-render race of `heroTeam.spec.js:347`

- **Root cause**: The scenario measures a node that the 400 ms flash and 3000 ms notice timers re-render (see Gate Check).
- **Fix task** (owner `test-engineer`): before the purchase, sleep the Phaser loop as `heroTeam.spec.js:273-274` does, or wait for `team-notice` to be hidden before measuring. Do not change an asserted value.
- **Verify**: the scenario passes in the full suite under the default 3 workers.
- **Priority**: Minor.

### Fix 4: Reword spec example E3 (spec-precision gap)

- **Root cause**: E3 (`spec.md:109`, and Allies fight AC 4) gives Orina 3 stars as an ally 105.6, but the Passive Table and Q45 apply her own Erosão Arcana to every hit, the allies' included. That makes defense 35 and the hit 137.28, which is what the game does (e2e `heroTeamCombat.spec.js:251`).
- **Fix task** (owner `product-owner`): state E3 for an ally without a defense passive (the e2e uses Lyra: 105.6), or keep Orina and write 137.28. Also tick the two Done-when boxes of T27 (`tasks.md:2548-2549`), which the round 2 UI review already met.
- **Priority**: Minor (wording; the behaviour matches the spec's intent).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| TEAM-01 | In Tasks | ✅ Verified |
| TEAM-02 | In Tasks | ✅ Verified |
| TEAM-03 | In Tasks | ✅ Verified |
| TEAM-04 | In Tasks | ✅ Verified |
| TEAM-05 | In Tasks | ❌ Needs Fix (AC 9 power talents, Fix 2) |
| TEAM-06 | In Tasks | ❌ Needs Fix (AC 8 fusion, Fix 2; E3 wording, Fix 4) |
| TEAM-07 | In Tasks | ❌ Needs Fix (frame-end edge case, Fix 1) |
| TEAM-08 | In Tasks | ✅ Verified |
| TEAM-09 | In Tasks | ❌ Needs Fix (flaky `heroTeam.spec.js:347` for AC 9, Fix 3) |
| TEAM-10 | In Tasks | ✅ Verified |
| TEAM-11 | In Tasks | ❌ Needs Fix (AC 2 and 4 skill hits, Fix 2) |
| TEAM-12 | In Tasks | ✅ Verified |
| TEAM-13 | In Tasks | ✅ Verified |

The orchestrator updates the statuses in `spec.md`, because the Verifier writes only `validation.md`.

---

## Summary

**Overall**: ❌ Not Ready (round 1 of 3; test-only fixes and one spec wording fix)

**Spec-anchored check**: 94/98 ACs fully covered with spec values, 4 partial, 1 spec-precision gap (E3)
**Sensor**: 34/35 mutants killed (G24 survived); 3 controls survived as expected
**Gate**: backend 1149/1149, game unit 2009/2009, e2e 482/484 (1 feature-test race, 1 known flake), deploy 287/289 (known Windows crash code)

**What works**: purchases, saves, swaps, check orders, the double click and the reset on the backend; the one-damage ally hit (E1 to E15 apart from the E3 wording); the clock, the kill path, the pause and background fighting; all five passives; the Equipe screen and the purchase dialog down to the computed style; the formation, its sizes and its motion.

**Issues found**: Fix 1 (G24, frame-end edge case), Fix 2 (one test per trigger), Fix 3 (e2e race), Fix 4 (E3 wording).

**Next steps**: route Fix 1 to Fix 3 to `test-engineer` and Fix 4 to `product-owner`. Round 2 then checks the gaps, the fix diff, G24 plus 1 to 3 new mutants on the touched tests, the game unit suite and the `heroTeam*.spec.js` files, and runs the final backend gate.
