# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

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

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
