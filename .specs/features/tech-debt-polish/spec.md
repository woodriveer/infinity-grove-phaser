# Tech Debt Polish Specification

**Status**: Approved by the owner on 2026-11-26 (recommended defaults). The owner asked on 2026-11-26 to finish every open technical debt except TD-010; this feature pays the three small ones: TD-011, TD-012 and TD-013 (`.specs/STATE.md` § Technical Debt).

## Problem Statement

Three low-priority debts stayed open after `unified-damage` and `hero-team`. On the Equipamento screen the two break lines of the attribute panel sit in different rows (TD-011). Two hero-team tests are weak: an e2e test reads a monster the allies keep killing with a real-time poll and timed out once under load, and a domain test title names Orina for a value the spec gives to Lyra (TD-012). The light-blue ally damage number reads faint over the light forest (TD-013).

## Facts From the Code (not decisions)

Checked on `main` at `55caf5b` (2026-11-26).

- The attribute panel is `renderLeaderStats` (`game/src/adapters/phaser/views/equipmentView.js:54`): a title `Atributos de <nome>` and one `div.stat-line` per line of `leaderStats` (`game/src/domain/equipment/leaderStats.js:19`), each with `data-testid="stat-<id>"`. The CSS (`game/public/style.css:2608`, `.leader-stats`) is a grid of 3 equal columns (`grid-template-columns: repeat(3, 1fr)`); the title spans the row (`grid-column: 1 / -1`).
- The 10 lines in order: `element`, `clickDamage`, `critChance` | `critDamage`, `armorPierce`, `bossDamage` | `minibossTime`, `bossTime`, `breakDefense` | `breakCrit`. So `breakDefense` ends row 3 and `breakCrit` is alone in row 4.
- `game/e2e/heroTeamCombat.spec.js:324` (`an ally killing the monster drops its coins and the next monster appears`) wakes the loop and then polls `s.monster.health` in real time. The respawn is a Phaser tween (fade 500 ms, `ClickerGame.fadeOutMonster`) then a scene-clock delayed call (1000 ms, `showAfterDelay`), which calls `showEncounter`; a 9-star Lyra (20 a tick) kills the new 10 HP monster 1000 ms after it appears.
- `game/src/domain/skills/skillCombat.test.js:995` is titled `E3: Orina 3 stars with a 10 click weapon and a +20 % ring deals 105.6 ...`; the call (`allyHit` with no team passives) gives 105.6, which spec `hero-team` E3 gives to Lyra (Orina gets 137.28 through her own Erosão Arcana).
- The ally number style is `ALLY_TEXT = { color: '#7fd4ff', fontSize: 28 }` merged over `DAMAGE_FONT = { fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 }` (`game/src/adapters/phaser/ClickerGame.js:97-100`). Every damage number rises 40 px and fades to alpha 0 in 800 ms (`DAMAGE_TEXT`). The shot that showed it faint (`.specs/features/hero-team/ui-review/09b-field-ally-hit-desktop.png`) caught the number mid-fade over the pale mist at the centre of the forest.

## Goals

- [ ] The two break lines of the attribute panel sit side by side in one row.
- [ ] The hero-team kill-and-respawn e2e test passes without sampling a state the live loop keeps changing, and the E3 test title names Lyra.
- [ ] The ally number keeps its light-blue fill and gets a darker, thicker outline, with a contrast of at least 3:1 against the forest measured on a fresh shot.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Changing the order or the texts of the attribute lines | Q1: the order of `unified-damage` texts AC 6 is kept |
| A different colour for the ally number | Spec `hero-team` Q12 fixed light blue; the owner kept it (2026-11-26) |
| The click and critical numbers (gold and orange) | Not part of TD-013; they keep `DAMAGE_FONT` as it is |
| The fade of the damage numbers | Owner: "darken/thicken the outline only" |
| Phone layout | The owner targets desktop only (TD-010 dropped) |
| TD-001, TD-002, TD-008 | Features `portuguese-text` and `defense-contract` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** How the two break lines come together (TD-011) | **Recommended**: keep the order of the 10 lines; `breakDefense` starts a new row (CSS `grid-column-start: 1`), so the rows are 3, 3, 2 (`minibossTime`, `bossTime`), 2 (`breakDefense`, `breakCrit`) | The two time lines and the two break lines each form a pair; no text or order changes, so `leaderStats.test.js` and every e2e that reads a line stay as they are | y (owner, 2026-11-26: recommended defaults) |
| **Q2** How the kill-and-respawn test reads the new monster (TD-012) | **Recommended**: the test records the monster at the moment each encounter is shown (it wraps `scene.showEncounter` before waking the loop) and asserts the first record after the kill: `{ health: 10, dead: false }`. The coins assertion is kept | A record taken inside the call that creates the monster never changes afterwards, so no poll can miss it (L-112). Stepping the scene clock by hand does not move the fade tween, which Phaser times with `Date.now()` | y (owner, 2026-11-26: recommended defaults) |
| **Q3** The E3 title (TD-012) | **Recommended**: `E3: Lyra 3 stars, an ally without a defense passive, with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50`; asserted value 105.6 unchanged | Spec `hero-team` E3 gives 105.6 to Lyra; the call has no team passives | y (owner, 2026-11-26: recommended defaults) |
| **Q4** The outline of the ally number (TD-013) | **Recommended**: stroke `#1c120c` (the Grove token `--wood-900`, darker than `#2a1408`) and `strokeThickness` 10 (from 8); fill `#7fd4ff`, 28 px, Cinzel 700 unchanged | Owner: keep light blue, darken or thicken the outline only. A Grove token keeps AD-022 | y (owner, 2026-11-26: recommended defaults) |
| **Q5** How the 3:1 contrast is measured (TD-013) | **Recommended**: on a desktop shot (1280 x 720) taken with the loop asleep right after an ally tick (number at alpha 1) over the misty centre of the forest, the `ui-artist` samples the outline colour and the forest 2 px outside the outline on the left, right, top and bottom of the number, and computes the WCAG ratio against the lightest of the four forest samples. Both the outline against the forest and the fill against the outline must be at least 3:1 | WCAG 2.x large text (28 px bold) needs 3:1; the outline is what touches the forest, the fill what touches the outline. A number mid-fade is an animation, not text at rest | y (owner, 2026-11-26: recommended defaults) |
| Implicit dimensions | Input bounds, failure states, retries, auth, concurrency, data lifecycle, observability and external dependencies: N/A, because the feature changes one CSS rule, one style constant and two tests; no request, state or data changes | Medium-scope sweep | y |

**Open questions:** none. The owner approved the recommended defaults Q1 to Q5 on 2026-11-26.

---

## User Stories

### P1: The two break lines side by side ⭐ MVP

**User Story**: As a player reading my leader's attributes, I want the defense break and the critical resistance break in one row so that I compare them at a glance.

**Why P1**: TD-011, the debt the owner asked to pay.

**Acceptance Criteria**:

1. WHEN the Equipamento screen shows the attribute panel THEN the game SHALL draw `stat-breakDefense` and `stat-breakCrit` in the same row (equal top edge), `stat-breakDefense` in the first column (its left edge equal to the left edge of `stat-element`) and `stat-breakCrit` in the second column (its left edge equal to the left edge of `stat-clickDamage`).  <!-- event-driven -->
2. WHEN the attribute panel is shown THEN the game SHALL draw `stat-minibossTime` and `stat-bossTime` in one row, in the first and second columns, above the row of the break lines.  <!-- event-driven -->
3. The game SHALL keep the 10 lines, their ids and texts and the order of `leaderStats` unchanged (unified-damage texts AC 6).  <!-- ubiquitous -->
4. WHILE the attribute panel is shown the game SHALL draw every line on one text line without clipping: for each `.stat-line`, `scrollWidth` is at most `clientWidth`.  <!-- state-driven -->

**Independent Test**: Open Equipamento as Kael (the start of `game/e2e/equipmentUi.spec.js`) and read the bounding boxes of the 10 lines.

---

### P1: Hero-team test debt ⭐ MVP

**User Story**: As the team, I want the hero-team tests to pass under load and to name the actor the spec names, so that a red run means a real bug.

**Why P1**: TD-012.

**Acceptance Criteria**:

1. WHEN `an ally killing the monster drops its coins and the next monster appears` runs THEN it SHALL assert the first monster shown after the kill from a record taken inside `showEncounter`, as `{ health: 10, dead: false }`, and SHALL NOT read `s.monster` of the live scene after waking the loop.  <!-- event-driven -->
2. The test SHALL keep every value it asserts today: the ally text `[ { text: '20', x: 740, size: '28px' } ]`, `s.monster.dead` true after the tick, the wallet text `Gold: 0 Silver: 0 Copper: 3`, and the respawned monster health 10.  <!-- ubiquitous -->
3. WHEN `game/e2e/heroTeamCombat.spec.js` runs 5 times in a row with `--repeat-each=5 --workers=3` THEN the test SHALL pass every time.  <!-- event-driven -->
4. The domain test that asserts 105.6 for an ally of 3 stars with a 10 click weapon and a +20 % ring against a NATURE monster with defense 50 SHALL be titled `E3: Lyra 3 stars, an ally without a defense passive, with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50` and SHALL keep asserting 105.6.  <!-- ubiquitous -->

**Independent Test**: `npx playwright test e2e/heroTeamCombat.spec.js --repeat-each=5 --workers=3` passes; `npm test` lists the new E3 title.

---

### P1: A readable ally number ⭐ MVP

**User Story**: As a player with allies, I want their damage numbers to stand out from the forest so that I see what my team deals.

**Why P1**: TD-013.

**Acceptance Criteria**:

1. WHEN an ally tick lands THEN the game SHALL draw its number with fill `#7fd4ff`, font size 28 px, font family `Cinzel`, font style `700`, stroke `#1c120c` and stroke thickness 10.  <!-- event-driven -->
2. WHEN a click or a skill hit lands THEN the game SHALL keep its number style unchanged: stroke `#2a1408`, stroke thickness 8, `#ffd35c` 32 px for a normal hit and `#ff8a1f` 48 px for a critical one.  <!-- event-driven -->
3. WHEN the `ui-artist` measures the ally number of the review shot as defined in Q5 THEN the outline against the lightest forest sample SHALL reach at least 3:1 and the fill against the outline at least 3:1.  <!-- event-driven -->

**Independent Test**: A unit test reads the style of the ally text; an e2e test reads `style.stroke` and `style.strokeThickness` of the ally text on the live scene; the ui review lists the two measured ratios.

---

## Edge Cases

- WHEN the leader has no passives (break values 0) THEN the two break lines SHALL still share one row (`Quebra de defesa: 0`, `Quebra de resistência a crítico: 0`).
- WHEN an ally number lands on an add (x = add centre + 40) THEN it SHALL use the same outline `#1c120c` 10 px.
- WHEN two allies tick in the same frame THEN their one summed number SHALL use the same outline.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TDP-01 | P1: Break lines - AC 1 to 4, Edge 1 | Tasks T1, T4 | Implementing |
| TDP-02 | P1: Test debt - AC 1 to 4 | Tasks T3 | Pending |
| TDP-03 | P1: Ally number - AC 1 to 3, Edge 2, 3 | Tasks T2, T5 | Implementing |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped

---

## Amends

- Spec `hero-team` § Allies on the Field (line "One light-blue number `#7fd4ff` at 28 px in `DAMAGE_FONT`") and Display AC 10: the ally number keeps the family and weight of the damage font, with its own outline `#1c120c` at 10 px (TDP-03).
- `.specs/STATE.md` TD-011, TD-012, TD-013: paid by this feature.

## Success Criteria

- [ ] `breakDefense` and `breakCrit` share one row in the browser; the panel order is unchanged.
- [ ] `heroTeamCombat.spec.js` passes 5 times in a row under 3 workers.
- [ ] The ui review measures at least 3:1 for the ally outline against the forest and for the fill against the outline.
