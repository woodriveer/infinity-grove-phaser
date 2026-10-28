# Boss Map Specification

## Problem Statement

The Rever chefes window is a plain list of the bosses already beaten. The player cannot see how far the chapter goes, which boss comes next, or how many remain. This feature turns the window into a map of the chapter: a path of 10 miniboss stops that ends at the chapter boss, with each stop shown as beaten, next or locked. It also delivers the Gemini prompt to paint the map. No backend change.

## Goals

- [ ] The Rever chefes window shows the current chapter as a map with 10 miniboss stops and the chapter boss at the end of one path.
- [ ] Each stop shows its state: beaten (can be fought again), next, or locked.
- [ ] The map image comes from `assets/ui/boss-map.jpg` (prompt in `PROMPTS_ASSETS_UI.md`), with a drawn fallback until the file exists.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A map of all five chapters at once | The farm lists only the bosses of the current chapter (AD-008) |
| Fighting a boss that is not beaten | The farm replays defeated bosses only |
| Travel animations between stops | Not asked |
| Hover cards with the boss element and stats | Not asked |
| Chapters with a stage count other than 10 on the painted map | The backend seeds 10 stages per chapter; extra stages fall back to a plain button |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| What the map shows | The current chapter: stops 1 to 10 are its minibosses, the 11th is its chapter boss | The farm lists only the current chapter | n |
| Stop states | `defeated` (in the farm list), `current` (the next boss of the campaign: the miniboss of the current stage, or the chapter boss), `locked` (every other) | Matches the three levels the user wants to see | n |
| Interaction | Only a `defeated` stop is a button; it starts the farm fight exactly as the list row did (`onPick({ kind, stage })`) | Same behaviour, new look | n |
| Test ids | A defeated stop keeps `farm-entry-miniboss-<n>` / `farm-entry-chapter-boss`; the others use `map-node-miniboss-<n>` / `map-node-chapter-boss`; every stop carries `data-state` | Existing farm tests keep their meaning | n |
| Stop text | A number `<n>` on a miniboss stop, `Chefe` on the chapter boss stop, accessible name `Miniboss <n>` or `Chefe do capítulo` | Short on the map, full for screen readers | n |
| Chapter boss wins | The chapter boss stop keeps `<n> vitórias restantes hoje` and is disabled at 0 | Existing rule | n |
| Window title | `Caminho do Capítulo <n>` over the map | Matches the chapter pill | n |
| Empty case | The map shows with every stop locked or current, plus the text `Nenhum chefe derrotado ainda.` | Keeps the existing message | n |
| Positions | A table of 11 points in percent of the image, from `PROMPTS_ASSETS_UI.md` (10, 84), (28, 88), (46, 84), (64, 88), (80, 62), (58, 56), (36, 60), (20, 30), (40, 24), (60, 30), (84, 16); recalibrated once the painted image exists | The prompt asks the painter for these places; Gemini will not hit them exactly | n |
| Fallback | While the image fails to load, the window shows a green-to-purple gradient and a dashed trail through the 11 points; with the image, no trail is drawn | The painted map already has a road | n |
| Map size | 880 x 495 px (16:9) inside the window | Prompt asks for 16:9 | n |
| Missing position | A stage without a table point is listed as a plain button below the map | A boss must never become unreachable | n |
| Marker art | Flag, number, fog and lock are CSS; no asset | Listed in `PROMPTS_ASSETS_UI.md` as not needing art | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Chapter map ⭐ MVP

**User Story**: As a player, I want a map of the chapter so that I see my path to the final boss and pick a boss to fight again.

**Why P1**: The whole request; the farm keeps working through the same click.

**Acceptance Criteria**:

1. WHEN the player opens Rever chefes THEN the game SHALL show a map (`data-testid="farm-map"`) titled `Caminho do Capítulo <n>` with 10 miniboss stops numbered 1 to 10 and a chapter boss stop, in path order.  <!-- event-driven -->
2. WHILE a stop is in the farm list the game SHALL show it with `data-state="defeated"` as a button.  <!-- state-driven -->
3. WHILE a stop is the next boss of the campaign the game SHALL show it with `data-state="current"`, highlighted, and not clickable.  <!-- state-driven -->
4. WHILE a stop is neither beaten nor next the game SHALL show it with `data-state="locked"`, covered by fog and a lock, and not clickable.  <!-- state-driven -->
5. WHEN the player clicks a defeated stop THEN the game SHALL start the farm fight of that boss exactly as the list row did.  <!-- event-driven -->
6. WHEN the player is at stage 4 of the chapter (minibosses 1 to 3 beaten) THEN the game SHALL show stops 1, 2 and 3 as `defeated`, stop 4 as `current` and stops 5 to 10 and the chapter boss as `locked`.  <!-- event-driven -->
7. WHEN the campaign is at the chapter boss THEN the game SHALL show stops 1 to 10 as `defeated` and the chapter boss as `current`.  <!-- event-driven -->
8. WHILE the chapter boss has 0 wins left today the game SHALL show its stop disabled with `0 vitórias restantes hoje`.  <!-- state-driven -->
9. WHEN no boss is beaten THEN the game SHALL show the map and the text `Nenhum chefe derrotado ainda.` (`data-testid="farm-empty"`).  <!-- event-driven -->
10. The window SHALL not block the pause: opening it SHALL pause the fight and closing it SHALL resume as today.  <!-- ubiquitous -->

**Independent Test**: With the fake backend at stage 4 and 3 minibosses beaten, read three `defeated` stops, one `current` and eight `locked`; click stop 2 and see the farm fight start.

---

### P2: Painted map and fallback

**User Story**: As a player, I want the painted map when the art exists and a clean drawing until then so that the screen never looks broken.

**Why P2**: The logic works on the fallback; the art is polish.

**Acceptance Criteria**:

1. The map SHALL use `assets/ui/boss-map.jpg` as its background at 880 x 495 px.  <!-- ubiquitous -->
2. IF the image fails to load THEN the map SHALL show a gradient background and a dashed trail through the 11 stop positions.  <!-- unwanted-behavior -->
3. WHEN the image loads THEN the map SHALL draw no trail.  <!-- event-driven -->
4. The stops SHALL sit at the table positions as percentages of the map size.  <!-- ubiquitous -->
5. IF a stage number has no table position THEN the game SHALL list that stage as a plain button below the map.  <!-- unwanted-behavior -->
6. The file `PROMPTS_ASSETS_UI.md` SHALL hold the English Gemini prompt of the map with the 11 positions, the look of the stops and the file name `boss-map.jpg`.  <!-- ubiquitous -->

**Independent Test**: Open the window with the image blocked and read the dashed trail; unblock it and read the trail gone.

---

## Edge Cases

- WHEN the farm list is empty and the campaign is at stage 1 THEN stop 1 SHALL be `current` and every other stop `locked`.
- WHEN the whole campaign is completed THEN the chapter boss SHALL be `defeated` and no stop SHALL be `current`.
- WHEN the window is narrower than the map THEN the map SHALL scale down with the same ratio.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MAP-01 | P1: map, order and states (AC 1-4, 6-7) | Done | Verified |
| MAP-02 | P1: farm click, wins, empty, pause (AC 5, 8-10) | Done | Verified |
| MAP-03 | P2: image, fallback, positions (AC 1-5) | Done | Verified |
| MAP-04 | P2: Gemini prompt (AC 6) | Done | Verified |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped

---

## Success Criteria

- [ ] Unit tests pin the state of every stop for the two example positions.
- [ ] An e2e test opens the map, clicks a beaten stop and starts the farm.
- [ ] `PROMPTS_ASSETS_UI.md` carries the map prompt (delivered with this spec).
