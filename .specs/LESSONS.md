# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

### L-010 - State the exact on-screen text of every message and countdown a criterion adds, or tests pin a wording the spec never chose
- signal: `spec_precision_gap` · recurrence: 2 feature(s) · scope: `game` · harmful: 0
- features: stages, characters
- evidence: STG-19, STG-22 (validation.md G1, G2) (game) (+1 more)
- last seen: 2026-10-18T11:47:40Z

### L-039 - Give every spec edge case its own test in the feature diff, even when existing behavior is expected to satisfy it
- signal: `ac_gap` · recurrence: 2 feature(s) · scope: `tests` · harmful: 0
- features: account-reset, blue-green-deploy
- evidence: spec.md edge case farm after reset; validation.md Edge cases (indirect via FarmServiceTest.kt:101) (tests) (+1 more)
- last seen: 2026-10-28T09:23:26Z

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Assert the realised end state of an animation or tween (read the object's final position), not only the tween configuration value
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: persistent-session
- evidence: SESS-17 AC2 MainMenu.test.js:330 (game-ui)
- last seen: 2026-10-17T13:06:22Z

### L-002 - Prove a fail-fast startup requirement by booting the application context with the invalid configuration, not only by constructing the properties class
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `backend-config` · harmful: 0
- features: persistent-session
- evidence: SESS-12 AC8 SecurityPropertiesTest.kt:10-23 (backend-config)
- last seen: 2026-10-17T13:06:22Z

### L-003 - When a spec edge case spans modules, add one test at the boundary that proves the end-to-end outcome instead of testing each half separately
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game-auth` · harmful: 0
- features: persistent-session
- evidence: Edge case 2 httpClient.test.js:128-137 (game-auth)
- last seen: 2026-10-17T13:06:22Z

### L-004 - Assert placeholder entity dimensions that the spec Assumptions table states, or the layout values can change unnoticed
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `scenes` · harmful: 0
- features: clicker-combat
- evidence: mutant 15-16 game/src/scenes/ClickerGame.js:4-5 (scenes)
- last seen: 2026-10-17T15:39:33Z

### L-005 - Put stated sizes and positions into the acceptance criterion, not only the Assumptions table, so tests can anchor to them
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: clicker-combat
- evidence: CLK-01 (spec)
- last seen: 2026-10-17T15:39:33Z

### L-006 - When an adapter maps domain data to a response, add a test whose stored state holds extra data the response must omit
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend-web` · harmful: 0
- features: wallet
- evidence: mutant 16 backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/WalletController.kt:66 (backend-web)
- last seen: 2026-10-17T16:57:26Z

### L-007 - Do not write log output as an acceptance criterion unless a test can assert it; state it as a convention instead
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: wallet
- evidence: WAL-23 (spec)
- last seen: 2026-10-17T16:57:26Z

### L-008 - Scope Playwright route globs to the API path so they cannot match the dev server's module URLs under src/api
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `game-e2e` · harmful: 0
- features: drops
- evidence: T8 npm run test:e2e (game-e2e)
- last seen: 2026-10-17T17:20:35Z

### L-009 - State behavior that exists only in the design, such as click-through DOM overlays, as an acceptance criterion so a test anchors to it
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: drops
- evidence: G2 click-through wallet text (spec)
- last seen: 2026-10-17T17:20:35Z

### L-011 - Assert an error requirement at the layer the spec names (HTTP status and no spawn), not only at the repository that raises it
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `backend` · harmful: 0
- features: elements
- evidence: ELEM-02 AC4 / ChapterRepositoryIT.kt:108 (backend)
- last seen: 2026-10-18T01:57:12Z

### L-012 - Write the rounding precision into the spec when a rule says exact but the implementation must round to avoid float dust
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: elements
- evidence: ELEM-01 AC9 vs monster.js:93 (domain)
- last seen: 2026-10-18T01:57:12Z

### L-013 - Define the exact visual marker or text format in the spec when an AC says mark or show, so tests pin a spec value
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `scene` · harmful: 0
- features: elements
- evidence: ELEM-03 AC8 / ELEM-04 AC1 (scene)
- last seen: 2026-10-18T01:57:13Z

### L-014 - Do not write log output as an acceptance criterion unless a test can assert it; state it as a convention instead
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: characters
- evidence: validation.md Drop AC 11 / Fusion AC 11, mutant M12 service/CardRewards.kt:52 (spec)
- last seen: 2026-10-18T11:47:40Z

### L-015 - Prove an atomicity or locking requirement with a test that fails the second write or races two requests, not by trusting the transaction or lock annotation
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend` · harmful: 0
- features: characters
- evidence: mutants M14 service/UserService.kt:25, M15 adapter/repository/PlayerCardsRepository.kt:15; Reg AC 5, Fusion AC 9 (backend)
- last seen: 2026-10-18T11:47:40Z

### L-016 - When the spec says an action leaves a value unchanged, assert that value after the action
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend` · harmful: 0
- features: characters
- evidence: mutant M11 service/CardRewards.kt:51; edge case leader stays unchanged (backend)
- last seen: 2026-10-18T11:47:41Z

### L-017 - Assert every exact label the spec names, button text included
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: characters
- evidence: mutant G7 game/src/adapters/phaser/views/bagView.js:45; Screens AC 5 label (game-ui)
- last seen: 2026-10-18T11:47:41Z

### L-018 - State whether an absent field and an explicit null mean the same in a response, or tests pin a serialization the spec never chose
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `backend-api` · harmful: 0
- features: equipment
- evidence: EQP-07 EquipmentDropFlowIT.kt:74 (backend-api)
- last seen: 2026-10-18T20:27:08Z

### L-019 - Say whether a random value is drawn and then scaled or drawn inside the scaled range, or the roll is not reproducible from the spec
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `backend-domain` · harmful: 0
- features: equipment
- evidence: EQP-03 PieceRollerTest.kt:121 (backend-domain)
- last seen: 2026-10-18T20:27:09Z

### L-020 - Check that the catalog can reach the condition of an error criterion before writing it, or the guard stays without a behavior test
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `backend-domain` · harmful: 0
- features: equipment
- evidence: EQP-38 EquipmentExceptionsTest.kt (backend-domain)
- last seen: 2026-10-18T20:27:10Z

### L-021 - Test ON DELETE RESTRICT by deleting a row whose only dependents are its direct children, so a cascade cannot be masked by a restrict further down the chain
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `migration` · harmful: 0
- features: normalized-schema
- evidence: validation.md B2; SchemaConstraintsIT.kt:176-184 (migration)
- last seen: 2026-10-19T23:20:05Z

### L-022 - Assert both the lower and the upper bound of every range CHECK constraint
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `migration` · harmful: 0
- features: normalized-schema
- evidence: validation.md B7; SchemaConstraintsIT.kt:200-203 (migration)
- last seen: 2026-10-19T23:20:05Z

### L-023 - Cover a required configuration mode such as ddl-auto validate with a test that fails when the mode changes
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `config` · harmful: 0
- features: normalized-schema
- evidence: validation.md B8; SCHEMA-01/SCHEMA-02 (config)
- last seen: 2026-10-19T23:20:06Z

### L-024 - Assert the exact on-screen style (color and size) of a damage number on every code path that shows one, not only the click path
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: hero-skills
- evidence: validation.md M1b ClickerGame.js update showDamage (game)
- last seen: 2026-10-21T08:59:44Z

### L-025 - Pin every field of a data table that changes a formula (such as damage type) with its own assertion, not only the fields next to it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: hero-skills
- evidence: validation.md M28 skillCatalog damageType (game)
- last seen: 2026-10-21T08:59:44Z

### L-026 - Test a pause by resuming for a time shorter than the frozen duration, so a timer that kept running while paused fails the test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: hero-skills
- evidence: validation.md N4 N5 pause (game)
- last seen: 2026-10-21T08:59:45Z

### L-027 - Test that the visible state follows every damage source (click, skill hit, damage over time), not only the click and the kill
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: combat-hud
- evidence: AC4 HP text on a damage tick (validation.md G1, ClickerGame.js update) (game)
- last seen: 2026-10-21T18:09:44Z

### L-028 - Assert a rendered value right after each non-lethal damage source, or removing its refresh survives
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: combat-hud
- evidence: mutant 29 (validation.md G2, ClickerGame.js useSkill updateHealthBar) (game)
- last seen: 2026-10-21T18:09:45Z

### L-029 - Read the handler of an existing control before the spec states what it keeps, a label is not a key binding
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: combat-hud
- evidence: pause menu keys (validation.md G7) (game-ui)
- last seen: 2026-10-21T18:09:45Z

### L-030 - Pin a timer by crossing its boundary by one unit after the action under test, a wait that stops just short cannot tell reset from kept
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: click-power
- evidence: mutant 35 (validation.md G1, ClickerGame.js useSkill combo timer) (game)
- last seen: 2026-10-21T18:42:06Z

### L-031 - When a spec says a text shows in several screens, name the screens and add a test per screen that prints it
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: click-power
- evidence: AC8 hero screens text (validation.md G2) (game-ui)
- last seen: 2026-10-21T18:42:06Z

### L-032 - A freeze while any screen is open needs a test per screen the spec names, not one example
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: click-power
- evidence: combo freeze on hero screens (validation.md precision gap) (game-ui)
- last seen: 2026-10-21T18:42:08Z

### L-033 - Concurrency tests must start from an existing lock row; a fresh player's insert race serialises requests and hides a missing pessimistic lock
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend/service` · harmful: 0
- features: talent-points
- evidence: mutant h: backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/TalentService.kt:48 (backend/service)
- last seen: 2026-10-22T12:59:06Z

### L-034 - Keep an AC's failure-handling wording identical to the Assumptions row that defines it (which errors trigger a reload)
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: talent-points
- evidence: spec P2 AC6 vs HeroUi.test.js:490 (specs)
- last seen: 2026-10-22T12:59:06Z

### L-035 - When a loop stops at a kill, assert the kill side effects (report, drop, combo) happen once, not only the hit count
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: auto-click
- evidence: G8 game/src/adapters/phaser/ClickerGame.js:302 (game)
- last seen: 2026-10-27T10:50:22Z

### L-036 - When an acceptance criterion requires log fields, assert them with a captured appender instead of marking logs as not asserted
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `backend` · harmful: 0
- features: auto-click
- evidence: AUTO-06 AC12 backend/.../domain/AutoClick.kt:74 (backend)
- last seen: 2026-10-27T10:50:23Z

### L-037 - When an acceptance criterion lists several guard states joined by or, write one test per state, not one for the group
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game` · harmful: 0
- features: auto-click
- evidence: validation.md iteration 2 mutant N8, game/src/adapters/phaser/ClickerGame.js:293 (AUTO-01 AC6 no monster) (game)
- last seen: 2026-10-27T11:45:53Z

### L-038 - When an AC asks the client to realign after an error code, specify whether that error's body carries the state to realign to
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `api-errors` · harmful: 0
- features: account-reset
- evidence: spec.md P1 Reset button AC-8 (RESET_LOCKED has no progress body to realign to) (api-errors)
- last seen: 2026-10-27T20:36:52Z

### L-040 - Assert UI acceptance criteria on the rendered view (screen text, badge visibility), not only on the service state behind it
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: account-reset
- evidence: spec.md P1 Reset button AC-7; ClickerGame.test.js:4092-4093 asserts service state only (game-ui)
- last seen: 2026-10-27T20:36:53Z

### L-041 - When readiness accepts one exact status, test that other success statuses such as 200 keep polling
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `deploy` · harmful: 0
- features: blue-green-deploy
- evidence: M1/M1b deploy/lib/slots.mjs:62 (deploy)
- last seen: 2026-10-28T09:23:26Z

### L-042 - Give every check of a regression suite its own failing-case test, not only the happy path order
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `deploy` · harmful: 0
- features: blue-green-deploy
- evidence: M11/M12 deploy/regression.mjs:88,100 (deploy)
- last seen: 2026-10-28T09:23:26Z

### L-043 - When an AC fixes a message frame with placeholders, write the exact value each placeholder takes per case
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: blue-green-deploy
- evidence: US-2 AC 3 FALHOU expected/received wording (spec)
- last seen: 2026-10-28T09:23:26Z

### L-044 - Give every failure path of an operation that logs exact texts its own exact text in the spec, not only the main path
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: blue-green-deploy
- evidence: SPEC_DEVIATION deploy/lib/previous.mjs:38 (spec)
- last seen: 2026-10-28T09:23:27Z

### L-045 - Give a check whose failure a fallback value would mask, such as an earlier token, its own failing-case test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `deploy` · harmful: 0
- features: blue-green-deploy
- evidence: validation.md M27 deploy/regression.mjs:80 (deploy)
- last seen: 2026-10-28T09:37:36Z

### L-046 - A test that reads a CSS rule must cut out its own @media block; searching from a match to the end of the file passes on unrelated blocks.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game/css-tests` · harmful: 0
- features: equipment-ui
- evidence: game/src/rarityFrames.test.js:32 M13/M14 (game/css-tests)
- last seen: 2026-10-28T18:03:01Z

### L-047 - When a CSS rule has a selector list, assert each selector of the list, not only the last one.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game/css-tests` · harmful: 0
- features: equipment-ui
- evidence: game/src/rarityFrames.test.js M15 (game/css-tests)
- last seen: 2026-10-28T18:03:02Z

### L-048 - Check a fix for a surviving mutant with a fresh mutant on the sibling behaviour of the same AC, not only by re-running the original mutant.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `verification` · harmful: 0
- features: equipment-ui
- evidence: iteration 2 M15 (verification)
- last seen: 2026-10-28T18:03:03Z

### L-049 - An AC met only by CSS visibility needs an e2e toBeHidden/toBeVisible check per state; a class check in jsdom does not prove it.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game/e2e` · harmful: 0
- features: boss-map
- evidence: game/e2e/bossMap.spec.js:85 M8 (game/e2e)
- last seen: 2026-10-28T18:07:56Z

### L-050 - Map each spec Independent Test line to an e2e scenario, or the untested half goes unseen.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: boss-map
- evidence: P2 AC3 Independent Test (spec)
- last seen: 2026-10-28T18:07:56Z

### L-051 - When a test depends on whether an asset exists, serve or block it with page.route so local files cannot change the result.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game/e2e` · harmful: 0
- features: boss-map
- evidence: game/e2e/bossMap.spec.js fallback (game/e2e)
- last seen: 2026-10-28T18:07:57Z

### L-052 - A change to a verified feature's catalog or scope must amend its spec or add a decision in STATE.md in the same commit; a commit message is not a spec.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: talents
- evidence: b443844 4a4f86f 08be5c9 (spec)
- last seen: 2026-10-28T18:32:27Z

### L-053 - An AC that says an upgrade counts on the next X needs a test that upgrades, then starts X again and asserts the new value.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game/tests` · harmful: 0
- features: talents
- evidence: game/src/adapters/phaser/ClickerGame.test.js:3166 G6 (game/tests)
- last seen: 2026-10-28T18:32:27Z

### L-054 - When a value comes from a catalog that can change, name the test after the behaviour, not the number, and retitle fixtures when a spec note supersedes it.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game/tests` · harmful: 0
- features: talents
- evidence: game/src/domain/talents/talents.test.js:158 (game/tests)
- last seen: 2026-10-28T18:32:27Z

### L-055 - A decision that adds an endpoint or screen text states the status code, response body and exact texts, or tests pin outcomes no spec owns.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: talents
- evidence: AD-017 POST /talents/reset (spec)
- last seen: 2026-10-28T18:32:27Z

### L-056 - Assert a state reset through the screen-change path the spec names, not only through close: a show() reset survived until a unit test opened another screen while selection was on.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-ui-state` · harmful: 0
- features: bulk-sell
- evidence: game/src/adapters/phaser/HeroUi.js:161 (mutant G3, validation.md) (game-ui-state)
- last seen: 2026-10-31T17:51:19Z

### L-057 - Name the region a rule covers ('every button of the body' vs 'of the window') when a close button stays live during a pending request.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: bulk-sell
- evidence: bulk-sell/spec.md BSL-23 (SP-1) (spec)
- last seen: 2026-10-31T17:51:20Z

### L-058 - A screen-change criterion needs an e2e path the player can reach; check the path is clickable before writing the scenario (the open panel intercepts HUD clicks).
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: bulk-sell
- evidence: bulk-sell/spec.md BSL-19 (e2e)
- last seen: 2026-10-31T17:51:20Z

### L-059 - Amend the spec before changing an assertion to a new value: a UI fix that moves a spec-defined position must update the spec first.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `game/e2e` · harmful: 0
- features: drag-equip
- evidence: DRG-15 validation.md; game/e2e/dragEquip.spec.js:181-183 (game/e2e)
- last seen: 2026-11-02T01:55:13Z

### L-060 - Give each guard of a state machine its own test that runs without the UI disabling its trigger first.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game/unit` · harmful: 0
- features: drag-equip
- evidence: M7 game/src/adapters/phaser/HeroUi.js:439 (game/unit)
- last seen: 2026-11-02T01:55:13Z

### L-061 - Assert every visual value the spec or design defines, and write any visual value a fix adds into the spec before merging.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `game/e2e` · harmful: 0
- features: drag-equip
- evidence: D6 .specs/features/drag-equip/spec.md:41; game/e2e/dragEquip.spec.js:159 (game/e2e)
- last seen: 2026-11-02T01:55:14Z

### L-062 - Give each player-visible acceptance criterion an e2e scenario, not only a unit test.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `game/e2e` · harmful: 0
- features: drag-equip
- evidence: validation.md DRG-06 DRG-08 DRG-11 DRG-13 DRG-28 DRG-30 (game/e2e)
- last seen: 2026-11-02T01:55:14Z

### L-063 - Pin a second-pointer guard with a second primary pointer of another pointer type, and count the created copies rather than reading the first match
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `pointer-input` · harmful: 0
- features: drag-equip
- evidence: game/src/adapters/phaser/views/dragEquip.js:64 (sensor S1, active guard removed; validation.md round 2) (pointer-input)
- last seen: 2026-11-02T03:52:11Z

### L-064 - Pin a timer that restarts on re-entry: leave the zone, come back, end the gesture, and assert the step size and that the timer stops
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `timers` · harmful: 0
- features: drag-equip
- evidence: game/src/adapters/phaser/views/dragEquip.js:105 (sensor S9, timer not cleared on direction change; validation.md round 2) (timers)
- last seen: 2026-11-02T03:52:11Z

### L-065 - Drag tests must cover a piece of every slot kind: a highlight that always marks the first kind survives when all fixtures drag that one kind
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-views` · harmful: 0
- features: drag-equip
- evidence: game/src/adapters/phaser/views/dragEquip.js:130 (sensor F6, round 3) (game-views)
- last seen: 2026-11-02T04:41:31Z

### L-066 - Pin a stale async answer against a close followed by a reopen of the same screen, not only against the close
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-views` · harmful: 0
- features: drag-equip
- evidence: game/src/adapters/phaser/HeroUi.js:469 (sensor F8b, round 3) (game-views)
- last seen: 2026-11-02T04:41:31Z

### L-067 - Assert the colour and the share of every CSS gradient that encodes a value, through computed style, not only the rule that declares it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `css` · harmful: 0
- features: ui-redesign
- evidence: validation.md sensor M01-M02: game/public/style.css:680 timer ring colour and share (css)
- last seen: 2026-11-13T18:12:54Z

### L-068 - Assert every token-driven background layer of a shared recipe, one case per token, not only the first token that the tests happen to set
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `css-tokens` · harmful: 0
- features: ui-redesign
- evidence: validation.md sensor M03: game/public/style.css:77 wood texture layer of the frame recipe (css-tokens)
- last seen: 2026-11-13T18:12:55Z

### L-069 - Test a keyboard shortcut against every blocking overlay its handler checks, one case per overlay, not only the most common one
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-input` · harmful: 0
- features: ui-redesign
- evidence: validation.md sensor M14: game/src/adapters/phaser/ClickerGame.js:341 reset dialog guard of the shortcut (game-input)
- last seen: 2026-11-13T18:12:55Z

### L-070 - Cover every element type that a text-entry guard names with its own test case, not only the input element
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-input` · harmful: 0
- features: ui-redesign
- evidence: validation.md sensor M15: game/src/adapters/phaser/ClickerGame.js:87 isTextField selector list (game-input)
- last seen: 2026-11-13T18:12:55Z

### L-071 - Test that an open panel closes when its enabling state changes while it is open, not only that it stays closed when the state starts off
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `game-ui` · harmful: 0
- features: ui-redesign
- evidence: validation.md sensor M16: game/src/adapters/phaser/ClickerGame.js:288 close-on-lock branch; UIR-19 AC17 (game-ui)
- last seen: 2026-11-13T18:12:55Z

### L-072 - Assert every row of a contrast table against the rendered colours of its own selector, not a sample of the rows
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `css-contrast` · harmful: 0
- features: ui-redesign
- evidence: validation.md UIR-03 AC14: design.md Contrast rows 10, 13 and 14 have no colour pin (css-contrast)
- last seen: 2026-11-13T18:12:55Z

### L-073 - Test a centred element as the distance between its centre and the container centre with a stated pixel tolerance, never as an overlap check
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `geometry` · harmful: 0
- features: ui-redesign
- evidence: validation.md UIR-08 AC6: centred chip criterion has no tolerance and no test (geometry)
- last seen: 2026-11-13T18:12:56Z

### L-074 - Assert each control a criterion names in a list, not one representative, because a shared rule does not prove the per-control overrides
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `css-recipes` · harmful: 0
- features: ui-redesign
- evidence: validation.md UIR-02 AC7 to AC10: only Fechar, Login and Fundir asserted of the named button lists (css-recipes)
- last seen: 2026-11-13T18:12:56Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
