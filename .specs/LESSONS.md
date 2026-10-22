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

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
