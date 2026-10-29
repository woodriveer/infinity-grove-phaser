# Background Fight Specification

## Problem Statement

The auto click (spec auto-click) only helps while the player watches the fight. Every hero screen (Heróis, Mochila, Fusão, Líder, Equipamento, Talentos, Rever chefes) freezes the fight like the pause menu, and when the tab is hidden or the window minimized the browser stops `requestAnimationFrame`, so Phaser stops stepping and nothing hits. The player wants the fight, and with it the auto click, to keep running in both cases; only the pause menu (Esc) stops it.

## Goals

- [ ] With any hero screen open the fight keeps running: the auto click hits, monsters die and respawn, timers and the boss countdown run.
- [ ] With the tab hidden on desktop (another tab in front, window minimized) the fight keeps running at real time.
- [ ] The pause menu still freezes everything, visible or hidden.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Phone with the screen off, OS sleep, a tab frozen or discarded by the browser | The browser runs no code at all; it needs an offline catch-up simulation (user chose the background ticker, not catch-up) |
| Catching up time the page did not run | Same reason |
| Rendering while hidden | Nobody sees it; only the scenes are stepped |
| Server-side change to the kill allowance | AD-002 stays as is: kills above the allowance are not credited |
| New on-screen text | No text is added or changed |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Which screens keep the fight running | All seven hero screens; only the pause menu freezes the fight | User choice "Todas as telas" | y |
| Boss countdown behind a screen | Runs like the rest of the fight; a boss that times out fails as usual | User choice "Timer corre normal" | y |
| Hidden tab | A background ticker steps the scenes while `document.hidden` is true | User choice "Ticker em segundo plano" | y |
| Manual clicks and skills with a screen open | Blocked: a click on the canvas outside the panel does not hit and the skill keys do nothing (skills are already blocked) | The screen is the focus; a stray click outside the panel must not count | n |
| Ticker source | A dedicated Web Worker posts a tick every 1000 ms; `setInterval(1000)` when `Worker` does not exist | One wake-up per second keeps the CPU idle between ticks (user asked about slowing the computer). Main-thread timers of hidden pages are throttled to 1 s and, after 5 min, to 1 min (Chrome 88 intensive throttling). Worker exemption is not documented; the elapsed-time rule below keeps the fight at real time either way | n |
| Time per tick | Each tick advances the real time elapsed since the previous tick, at most 60 000 ms, split into steps of at most 50 ms | Real time keeps the fight rate whatever the tick rate (covers the 1-per-minute throttling); the 60 s cap stops a burst after OS sleep; 50 ms is the fastest auto click interval, so a step fires at most one auto click and a kill never drops the next click | y |
| Double stepping | A tick steps nothing when the Phaser loop ran a frame since the previous tick | Some browsers keep `requestAnimationFrame` running in a hidden tab | n |
| Back to visible | The ticker stops; Phaser resumes its loop with a reset delta (its own `onVisible`) | No time is counted twice | n |
| Auto-click AC 5 ("while the fight is paused") | Unchanged: "paused" now means only the pause menu | The rule still holds; only what pauses changed | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: The fight runs behind the hero screens ⭐ MVP

**User Story**: As a player with the auto click on, I want the fight to keep going while I look at equipment or talents so that I do not lose progress managing my heroes.

**Why P1**: It is the main request.

**Acceptance Criteria**:

1. WHEN the player opens any hero screen THEN the game SHALL leave the fight unpaused (`paused` false, scene time and tweens running).
2. WHILE a hero screen is open, the switch is on and a living monster is on screen, the game SHALL perform auto clicks at the auto click interval.
3. WHILE a hero screen is open, a click on the canvas SHALL NOT hit the monster.
4. WHEN the player closes a hero screen THEN the game SHALL leave the pause state as it was before the screen opened.
5. WHILE the fight is paused by the pause menu, opening and closing a hero screen SHALL keep it paused.

**Independent Test**: In chapter 2 open Talentos and see the monster health drop.

---

### P1: The fight runs in a hidden tab

**User Story**: As a player with the auto click on, I want the fight to continue when I switch tabs or minimize the window so that the game progresses while I do something else.

**Why P1**: It is the main request.

**Acceptance Criteria**:

1. WHEN the page becomes hidden THEN the game SHALL start a background ticker that fires every 1000 ms.
2. WHEN a tick fires THEN the game SHALL step every running scene by the real time elapsed since the previous tick (or since the page became hidden), in steps of at most 50 ms.
3. IF more than 60 000 ms elapsed since the previous tick THEN the game SHALL step only 60 000 ms.
4. IF the Phaser loop ran a frame since the previous tick THEN the tick SHALL step nothing.
5. WHEN the page becomes visible THEN the game SHALL stop the ticker.
6. WHILE the fight is paused by the pause menu and the page is hidden, the game SHALL fire no auto click.
7. IF `Worker` is not available THEN the game SHALL tick with `setInterval` every 1000 ms.

**Independent Test**: In chapter 2 stop the Phaser loop, mark the page hidden and see the monster health drop.

---

## Edge Cases

- WHEN the page is hidden and visible again several times THEN only one ticker SHALL run at a time.
- IF the elapsed time of a tick is 0 THEN the tick SHALL step nothing.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BGF-01 | P1: Fight behind hero screens (AC 1, 2, 4, 5) | Execute | Implementing |
| BGF-02 | P1: Fight behind hero screens (AC 3) | Execute | Implementing |
| BGF-03 | P1: Hidden tab (AC 1-5, 7, edge cases) - ticker | Execute | Implementing |
| BGF-04 | P1: Hidden tab (AC 2, 6) - wiring into the game | Execute | Implementing |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] With Talentos open, the auto click kills monsters in chapter 2.
- [ ] With the tab hidden for 10 minutes on desktop Chrome, the stage advanced.
