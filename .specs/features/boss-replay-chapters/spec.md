# Boss Replay Chapters Specification

## Problem Statement

The Rever chefes screen (spec `boss-map`) shows only the current chapter, because AD-008 made the farm list only the bosses of the current chapter. The owner asked on 2026-11-17: "no rever chefe nao da pra escolher capitulo anterior". A player in chapter 3 cannot fight the minibosses or the chapter boss of chapters 1 and 2 again, and the chapter boss of a chapter is never farmable until the whole campaign (chapter 15) is completed. This feature adds a chapter selector to the map screen so the player can pick any chapter they have reached and fight its bosses again with that chapter's numbers and rewards.

## What the code does today (facts, not decisions)

| Item | Where | Today |
| --- | --- | --- |
| Farm list | `backend/.../domain/Farm.kt:23` `FarmBoss.beaten` | Only the chapter of `progress.position`: minibosses below the current stage, the current stage's miniboss once the chapter boss is next, the chapter boss only when `progress.completed` (chapter 15) |
| Farm report | `backend/.../service/FarmService.kt:30` | Checks the boss against the current chapter list; rolls card and piece with `progress.position.chapter` |
| Card drop | `CardRewards.award` / `CardDropper.drop` (`CardDrops.kt:38`) | Miniboss of stage s of chapter c: hero of chapter c at `min(1, 0.07 x s)`; chapter boss of c: hero of chapter `min(c + 1, 15)` at 0.80, certain on the first win (`!clearedChapters.contains(c)`) (`application.yaml` `cards`) |
| Equipment drop | `EquipmentRewards.award` / `PieceRoller.roll` (`PieceRoller.kt:37`) | Miniboss 25 % (default rules), chapter boss 100 %; rarities by chapter: chapters 1 to 3 common/uncommon, chapter 4 adds rare, chapter 5 and later up to legendary; a full bag sells the piece for copper |
| Coins | `game/src/domain/campaign/campaign.js:104` | A farm fight has no drop rule: it pays no copper |
| Talent points | AD-013, AD-017 | A farm win pays none |
| Daily chapter boss limit | `BossRecord` (`winsDay`, `winsToday`), `chapter-boss-daily-limit: 10` | One counter per player per UTC day, not per chapter |
| Farm interval | `BossRecord.lastFarmWinAt`, `farm-min-interval-ms: 5000` | One timestamp per player |
| Enemy numbers | `ChapterDefinition.of(n)` seeded per chapter (`Chapter.kt:84`); the game builds the farm fight from the campaign definition (`campaign.js:106`) | The game only holds the current chapter's definition |
| Account reset | `AccountResetService` | Progress back to chapter 1; `cleared_chapters` kept |

## Goals

- [x] A player who has reached chapter N sees chapters 1 to N on the Rever chefes screen and can open the map of any of them; the screen opens on the current chapter.
- [x] On the map of an earlier chapter, all 10 minibosses and the chapter boss are `defeated` and can be fought again.
- [x] A boss of an earlier chapter fights with that chapter's health, defense, critical resistance, element and time limit, and pays that chapter's card and equipment rolls.
- [x] The daily chapter boss limit (10) and the 5 s farm interval stay one per player across all chapters.
- [x] No Flyway migration; a game still on the previous version keeps working against the new backend, and the new game keeps working against the previous backend.
- [x] Closing Rever chefes while a chapter loads never leaves the chapter buttons disabled, and the late answer of that load never changes the farm state or the map shown (TD-009).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Changing the map stop positions in `game/src/adapters/phaser/views/mapLayout.js` | A separate fix is recalibrating them now; this feature must not touch those numbers |
| Selecting a chapter not reached yet, or seeing it locked in the selector | The farm replays beaten bosses only |
| A chapter selector for the HUD `Farm boss` switch | The switch farms the campaign miniboss just won, which is always the current chapter |
| Coins (copper) from farm fights | Not asked; a farm fight still has no drop rule |
| Talent points from farm fights | AD-013 / AD-017 unchanged |
| A daily limit per chapter | Q2 default keeps one shared limit; a per-chapter limit would need a schema change |
| A different painted map per chapter | One painted map (`assets/boss-map.jpg`) serves every chapter, as today |
| Server-side combat checks | AD-002 unchanged |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here. Rows Q1 to Q8 are product decisions taken as product owner defaults; the owner confirms or changes them in one answer.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Q1. Which chapters can be picked | Chapters 1 to the current campaign chapter (`progress.position.chapter` after `withNextChapterOpen`; a completed campaign reaches 1 to 15). An account reset brings the list back to chapter 1 only | The campaign position proves every earlier chapter was cleared in this run; keeping chapters after a reset would let a chapter 1 player farm chapter 15 pieces | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q2. Daily chapter boss limit | One shared count of 10 wins per UTC day over every chapter, as today | No schema change; a per-chapter limit would multiply the chapter boss pieces and cards by up to 15 | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q3. Rewards of an earlier chapter | That chapter's: the miniboss drops the hero of that chapter (7 % x stage), the chapter boss drops the hero of the next chapter (80 %), the piece uses that chapter's rarity tier; no copper, no talent points | Same rules as the current chapter, with the fought chapter as input | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q4. Enemy numbers of an earlier chapter | That chapter's seeded health, defense, critical resistance, element and time limit | The owner's example; matches the rewards | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q5. Selector look and visibility | A row of numbered chips `1` to `N` under the map title; the shown chapter is pressed (ember), the current campaign chapter carries a gold dot; the row is hidden while only chapter 1 is reached | Direct jump to any chapter in one click; 15 chips fit the 880 px map width in one row, and the phone scales that same layout (see the phone-row ruling below) | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q6. Chapter shown when the screen opens | The current campaign chapter on every opening from the HUD button; when the last daily chapter boss win of an earlier chapter ends the farm, the screen reopens on that chapter | The owner's example default; the reopen keeps the player where they were | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q7. HUD label of an earlier chapter fight | `Rever chefe: Miniboss <s> (Capítulo <n>)` and `Rever chefe: Chefe do capítulo (Capítulo <n>)`; a fight of the current chapter keeps `Rever chefe: Miniboss <s>` / `Rever chefe: Chefe do capítulo` | The player sees which chapter's numbers they face; current labels and their tests stay | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Q8. First win of an earlier chapter boss missing from `cleared_chapters` | A farm win of a chapter boss whose chapter is not in `cleared_chapters` counts as its first win: the card is certain and the chapter is added, as `CardRewards` does today | Only accounts whose record predates `cleared_chapters` can hit it; it reuses the existing rule | y (owner, 2026-11-17, "Aprovo os padrões"; AD-024) |
| Request field for the fought chapter | `POST /farm/outcome` takes an optional top-level `chapter`; absent means the current campaign chapter | A game on the previous version keeps working | y (technical, PO) |
| A `GET /farm?chapter=N` above the reached chapter | Answers the reached chapter (`chapter` in the answer says which) | A stale screen after a reset in another tab still gets a valid map | y (technical, PO) |
| When the game sends `chapter` | Only when the picked chapter differs from the current campaign chapter | Existing requests and their tests stay byte-identical | y (technical, PO) |
| Loading a chapter | The chips are disabled while the request runs; the shown map stays until the answer | A double click cannot race two loads | y (technical, PO) |
| UI review #1 (T14): the boss timer covers the end of `Rever chefe: Miniboss 3 (Capítulo 2)` | Two changes. (a) The chapter tag ` (Capítulo <n>)` of an earlier chapter fight goes on a second line of the stage plate, Cinzel 700 14px `--ink-600`; the first line keeps the 19px plate text, so `Rever chefe: Miniboss <s>` / `Rever chefe: Chefe do capítulo` look as today and the plate's text is unchanged. (b) The timer keeps its anchor (centre x 512) while the plate ends at least 12 scene px before the timer's left edge; a longer plate pushes the timer right so its left edge is the plate's right edge + 12 px. The scene measures both widths and writes the push as `--timer-shift` | Measured in Chromium with Cinzel 700 (1024 x 768 scene px): the plate holds 276 px before the centred timer (left edge 512 - 152/2 = 436). Earlier chapter labels on one line are 422 to 514 px wide, so the longest would push a 162 px timer to x 844, under the wallet (box from x 776). On two lines the widest plate is 346 px (`Rever chefe: Chefe do capítulo` + `(Capítulo 14)`, 54 px tall, inside its 56 px box) and the timer ends at x 676 at most. Current chapter farm labels already reach the timer (`Rever chefe: Miniboss 3` 290 px, `Rever chefe: Chefe do capítulo` 375 px), so the push is needed even with two lines. A smaller font for the whole label was rejected: it changes the current-chapter labels | y (PO ruling, 2026-11-17) |
| UI review #1, anchor of ui-redesign UIR-04 AC 7 | The timer anchor (512, 44) of UIR-04 AC 7 holds in its battle state (campaign miniboss: `Stage 10/10  Miniboss`, the widest campaign boss label, is a 262 px plate that ends at x 418, and 418 + 12 = 430 is left of the timer's edge at 436, so the push is 0); the timer moves only when a plate would reach it, which only farm labels do. No AD: this refines a spec AC of a finished feature, it does not change AD-022 | The e2e anchor test `keeps the battle HUD on the scene anchors of the baseline` stays unchanged and still passes | y (PO ruling, 2026-11-17) |
| UI review #2 (T14): the 6 px gold dot touches the numeral of the current chip | Every chip gets `padding-bottom: 3px` (numeral baseline from 21.5 px to 20 px below the chip's top edge, the same on every chip so the row stays aligned) and the dot moves to `bottom: 1px` (its top edge 23 px below the chip's top edge, 1 px clear of the border). The numeral and the dot are 3 px apart; the dot stays 6 x 6 px `--gold-400` | Measured in Chromium: with `bottom: 3px` the dot spans 21 to 27 px and the baseline is at 21.5 px (overlap). Moving only the current chip's numeral (the reviewer's example) would put it 2 px above its neighbours; `bottom: 0` would merge the dot into the gold border of the pressed chip | y (PO ruling, 2026-11-17) |
| Chip row on a phone (ruling on the test-engineer's spec-precision gap) | The edge case states what the player observes: at a 390 px viewport the 15 chips stay in one row inside the scaled map and no chip passes its right edge. The row does not wrap there, and no layout task is created. `flex-wrap: wrap` stays in the Visual Spec as a guard | The HUD is one 1024 px layout scaled down to the phone (`game/public/style.css`, the comment above the 640 px query), so the panel is never narrower than the 15 chips (about 760 px of the 880 px map). A phone-only reflow would change the game for one row and break the scaled-HUD pattern every screen uses | y (PO ruling) |
| Verifier finding F1 (round 1): closing Rever chefes while a chapter load is pending and reopening it can leave the chips disabled, and the late answer overwrites the farm session under the map of the current chapter (`HeroUi.selectFarmChapter`) | Not part of this feature; logged as TD-009 in `STATE.md` with the rule "closing Rever chefes cancels a pending chapter load; a late answer is ignored", for a fix task of `game-dev` | No AC covers a close during a load (P1-Choose AC 8, 9 cover the HUD opening and the pending state); closing and reopening the panel again recovers; the late answer can only start a fight of a reached chapter, which the backend accepts with that chapter's lower rewards | y (PO ruling at acceptance, 2026-11-17) |
| TD-009 fix (follow-up of F1) | Fixed now under the rule "closing Rever chefes cancels a pending chapter load; a late answer is ignored" (P1-Choose AC 14, 15). Mechanism: the farm session gets `cancel()`, a generation counter that every load reads when it starts and checks when its answer arrives, so an answer of a load started before the last `cancel()` changes nothing (a failure still rejects, and changes nothing either). `HeroUi` calls it whenever it leaves Rever chefes (`close()`: the `Fechar` button, Esc, a click on a stop) or opens a screen over it (`show()`, which the scene calls after the last daily win), and resets `farmBusy` there; a dropped chapter load's `finally` does nothing, because the view counter it captured changed | Owner, 2026-11-17: "Sim, corrija". Every Rever chefes opening loads the farm state again before drawing, so dropping a pending answer never leaves the screen without data. The cancel runs only when the screen left is Rever chefes, so the scene's own reload after a refused farm win (`ClickerGame.reportFarmWin`) still lands when the player opens and closes another screen | y (owner, 2026-11-17, "Sim, corrija") |

**Open questions:** none. The owner accepted every default of Q1 to Q8 on 2026-11-17 ("Aprovo os padrões", AD-024).

---

## User Stories

### P1: Choose an earlier chapter on the map ⭐ MVP

**User Story**: As a player in chapter 3, I want to pick chapter 1 or 2 on the Rever chefes screen so that I can see and fight their bosses again.

**Why P1**: The owner's request.

**Acceptance Criteria**:

1. WHEN a player whose campaign is in chapter 3 opens Rever chefes THEN the game SHALL show a group `data-testid="farm-chapters"` (`aria-label="Escolher capítulo"`) with the text `Capítulo` and three buttons `farm-chapter-1`, `farm-chapter-2`, `farm-chapter-3` labelled `1`, `2`, `3`, with `farm-chapter-3` `aria-pressed="true"` and the other two `aria-pressed="false"`.  <!-- event-driven -->
2. WHILE the campaign is in chapter 1 the game SHALL show no `farm-chapters` group.  <!-- state-driven -->
3. WHEN the campaign is completed (chapter 15) THEN the game SHALL show the buttons `farm-chapter-1` to `farm-chapter-15` and no `farm-chapter-16`.  <!-- event-driven -->
4. WHEN the player clicks `farm-chapter-2` THEN the game SHALL request `GET /farm?chapter=2` and show the title `Caminho do Capítulo 2`, with `farm-chapter-2` pressed.  <!-- event-driven -->
5. WHILE the map of an earlier chapter is shown the game SHALL show all 11 stops with `data-state="defeated"` and no stop `current`.  <!-- state-driven -->
6. WHILE the map of the current chapter is shown the game SHALL show the stop states of spec `boss-map` (MAP-01) unchanged.  <!-- state-driven -->
7. The button of the current campaign chapter SHALL carry the class `is-current` and `title="Capítulo atual"`.  <!-- ubiquitous -->
8. WHEN the player opens Rever chefes from the HUD button THEN the game SHALL show the current campaign chapter, whatever chapter was shown before.  <!-- event-driven -->
9. WHILE a chapter request is pending the game SHALL show every chapter button disabled and keep the map shown before.  <!-- state-driven -->
10. IF the chapter request fails THEN the game SHALL show `Não foi possível carregar.` in the error line, keep the map and the pressed button shown before, and enable the chapter buttons again.  <!-- unwanted-behavior -->
11. WHEN the player clicks the pressed chapter button THEN the game SHALL send no request.  <!-- event-driven -->
12. WHILE the map of an earlier chapter is shown the chapter boss stop SHALL show `<n> vitórias restantes hoje` with the shared daily count and be disabled at 0.  <!-- state-driven -->
13. The gold dot of the current campaign chapter's chip SHALL sit 23 px below the chip's top edge (`bottom: 1px` inside a 2 px border of a 32 px chip), at least 2 px below the baseline of the chip's numeral, and every chip's numeral SHALL sit on the same baseline (`padding-bottom: 3px` on every chip).  <!-- ubiquitous -->
14. WHEN the player closes Rever chefes (the `Fechar` button `hero-close`, the Esc key or a click on a stop) while a chapter request is pending, or the game opens a panel screen over it, THEN the game SHALL drop that request, and the next Rever chefes opening SHALL show the current campaign chapter with `farm-chapter-<current>` pressed and every chapter button enabled.  <!-- event-driven -->
15. IF the answer of a dropped chapter request arrives, a success or a failure, THEN the game SHALL ignore it: the farm state (bosses, wins left, chapter, chapters and chapter definitions), the map title, the stop states, the pressed button, the enabled or disabled state of every chapter button and the error line SHALL stay as they were before it arrived.  <!-- unwanted-behavior -->

**Independent Test**: With the fake backend at chapter 3 stage 4, open Rever chefes, read chips 1 to 3 with 3 pressed, click 2 and read the title `Caminho do Capítulo 2` and 11 `defeated` stops.

---

### P1: Fight an earlier chapter boss with its numbers and rewards ⭐ MVP

**User Story**: As a player, I want a boss of an earlier chapter to fight and pay like that chapter so that replaying it is meaningful and fair.

**Why P1**: Without it the selector only changes a picture.

**Acceptance Criteria**:

1. WHEN the player clicks a defeated stop on the map of chapter 2 while the campaign is in chapter 3 THEN the game SHALL start a farm fight whose health, defense, critical resistance, element and time limit are those of that boss in the chapter 2 definition of `GET /farm?chapter=2`.  <!-- event-driven -->
2. WHILE a farm fight of an earlier chapter runs the HUD label SHALL read `Rever chefe: Miniboss <s> (Capítulo <n>)` for a miniboss and `Rever chefe: Chefe do capítulo (Capítulo <n>)` for the chapter boss.  <!-- state-driven -->
3. WHEN a farm fight of an earlier chapter is won THEN the game SHALL send `POST /farm/outcome` with body `{ "boss": { "kind": "MINIBOSS", "stage": <s> }, "outcome": "CLEARED", "chapter": <n> }` (chapter boss: `"boss": { "kind": "CHAPTER_BOSS" }`) and bring the same boss of the same chapter back.  <!-- event-driven -->
4. WHEN a farm fight of the current chapter is won THEN the game SHALL send the body without `chapter`, exactly as today.  <!-- event-driven -->
5. WHEN the backend accepts a farm win of a miniboss of stage s of chapter c THEN the backend SHALL roll the card of the hero of chapter c at `min(1, miniboss-rate-per-stage x s)`.  <!-- event-driven -->
6. WHEN the backend accepts a farm win of the chapter boss of chapter c THEN the backend SHALL roll the card of the hero of chapter `min(c + 1, 15)` at `chapter-boss-rate`, certain when c is not in `cleared_chapters`.  <!-- event-driven -->
7. WHEN the backend accepts a farm win of a boss of chapter c THEN the backend SHALL roll the piece with the rarity tier of chapter c (`PieceRoller.roll(..., chapter = c)`).  <!-- event-driven -->
8. The backend SHALL count a farm chapter boss win of any chapter against one daily limit of `chapter-boss-daily-limit` (10) per player per UTC day.  <!-- ubiquitous -->
9. The backend SHALL refuse with 409 `FARM_TOO_FAST` a farm win less than `farm-min-interval-ms` (5000) after the previous farm win of the player, whatever the chapter of either.  <!-- ubiquitous -->
10. IF `POST /farm/outcome` names a chapter above the player's current chapter THEN the backend SHALL answer 409 `BOSS_NOT_AVAILABLE` and change nothing.  <!-- unwanted-behavior -->
11. IF `POST /farm/outcome` or `GET /farm` carries a `chapter` that is not an integer of at least 1 THEN the backend SHALL answer 400 with detail `chapter must be an integer of at least 1` and change nothing.  <!-- unwanted-behavior -->
12. The backend SHALL never change the campaign position, the completed flag or the talent points on a farm report of any chapter.  <!-- ubiquitous -->
13. WHEN the last daily chapter boss win is spent in a farm fight of an earlier chapter THEN the game SHALL end the farm and reopen Rever chefes on that chapter, with its chapter boss stop disabled and `0 vitórias restantes hoje`.  <!-- event-driven -->
14. WHILE a farm fight of an earlier chapter runs the stage plate SHALL show `Rever chefe: Miniboss <s>` (or `Rever chefe: Chefe do capítulo`) on its first line and ` (Capítulo <n>)` on a second line in `span.stage-hud-chapter`, left-aligned with the first, the plate's text staying the full label of AC 2 and the plate at most 56 px tall with its vertical centre at y 44.  <!-- state-driven -->
15. WHILE a boss countdown runs the left edge of `.boss-timer` SHALL be `max(512 - timerWidth / 2, plateRight + 12)` in the 1024 x 768 scene (within 1 px), where `plateRight` is the right edge of `.stage-hud`, so the timer never overlaps the plate and stays centred on x 512 whenever the plate leaves room; for every label of this spec the timer's right edge SHALL be left of the `.wallet` left edge.  <!-- state-driven -->

**Independent Test**: With the fake backend at chapter 3 and a chapter 2 definition whose miniboss 3 has 77 health, pick chapter 2, click stop 3, read `Rever chefe: Miniboss 3 (Capítulo 2)` and `HP 77/77`, win it and read the request body with `"chapter": 2`.

---

### P2: Farm state per chapter on the API

**User Story**: As the game, I want the farm state of any reached chapter with its definition so that I can draw its map and build its fights.

**Why P2**: The contract the two P1 stories stand on; testable on its own through the API.

**Acceptance Criteria**:

1. WHEN `GET /farm` is called without `chapter` THEN the backend SHALL answer 200 with `chapter` = the current campaign chapter, `chapters` = `[1, ..., current]`, `bosses` and `chapterBossWinsLeft` as today, and `definition` = that chapter's definition in the shape of the `/progress` `definition`.  <!-- event-driven -->
2. WHEN `GET /farm?chapter=c` is called with 1 <= c < current THEN the backend SHALL answer `chapter` = c and `bosses` = the minibosses 1 to 10 in stage order followed by the chapter boss.  <!-- event-driven -->
3. WHEN `GET /farm?chapter=c` is called with c > current THEN the backend SHALL answer as for `chapter` = current.  <!-- event-driven -->
4. WHEN `GET /farm?chapter=c` is called with c = current THEN the backend SHALL answer the `bosses` of today's rule (`FarmBoss.beaten`).  <!-- event-driven -->

**Independent Test**: `GET /farm?chapter=2` for a player stored at chapter 3 stage 4 answers `chapter` 2, `chapters` `[1,2,3]`, 11 bosses and `definition.bossHealth` 8000.

---

### P2: Compatibility both ways

**User Story**: As the owner, I want the backend and the game to ship in any order so that a deploy never breaks the farm.

**Why P2**: Cloud Run deploys the backend before the Worker, and a cached game may still be the previous one.

**Acceptance Criteria**:

1. WHEN a game on the previous version calls `GET /farm` and `POST /farm/outcome` without `chapter` THEN the backend SHALL answer as before for the current chapter (extra fields ignored by that game).  <!-- event-driven -->
2. IF the `GET /farm` answer has no `chapter`, `chapters` or `definition` (previous backend) THEN the game SHALL show no chapter selector and fight the current chapter exactly as today.  <!-- unwanted-behavior -->
3. The feature SHALL add no Flyway migration.  <!-- ubiquitous -->

**Independent Test**: The existing `farm.spec.js` and `bossMap.spec.js` pass unchanged; a unit test feeds the game a farm state without the new fields and reads no selector.

---

## Edge Cases

- WHEN the campaign is in chapter 2 at stage 1 THEN the selector SHALL show `1` and `2`, the chapter 2 map SHALL show the empty text `Nenhum chefe derrotado ainda.` and the chapter 1 map SHALL show 11 `defeated` stops.
- WHEN the campaign is completed at chapter 15 THEN the map of chapter 15 SHALL show 11 `defeated` stops and no `current` stop, as today.
- WHEN a player stored as completed at chapter 5 (opened to chapter 6 by `withNextChapterOpen`) calls `GET /farm?chapter=5` THEN the backend SHALL answer 11 bosses of chapter 5.
- IF `POST /farm/outcome` names `chapter` 2 with a miniboss of stage 11 THEN the backend SHALL answer 409 `BOSS_NOT_AVAILABLE`.
- IF the player's account is reset while an earlier chapter map is open in another tab THEN the next win report SHALL answer 409 `BOSS_NOT_AVAILABLE`, and the game SHALL end the farm and reload the farm state, as today.
- WHEN the game is shown at a 390 px viewport (phone, the 1024 px layout scaled down) THEN the 15 chapter chips SHALL stay inside the scaled map, with no chip extending past its left or right edge.
- IF the game holds no definition of the picked chapter THEN the game SHALL not start the fight.
- WHEN the player closes Rever chefes with `hero-close` while the chapter 2 request is pending, opens it again and the chapter 2 answer then arrives THEN the map SHALL show `Caminho do Capítulo 3` with `farm-chapter-3` pressed and chips 1 to 3 enabled, both before and after that answer, and a later click on `farm-chapter-1` SHALL keep `Caminho do Capítulo 3` shown while chapter 1 loads (TD-009).
- IF the dropped chapter request fails after the player closed Rever chefes with Esc and opened it again THEN the reopened map SHALL show no error line and every chapter button enabled (TD-009).
- WHEN a new chapter request starts on the reopened map before the late answer of a dropped one arrives THEN every chapter button SHALL stay disabled until the new request answers, and the map SHALL then show the newly picked chapter (TD-009).
- WHEN the game reopens Rever chefes itself (after the last daily chapter boss win) while a chapter request is pending THEN the late answer of that request SHALL not change the map the game opened (TD-009).
- WHEN the player opens and closes a screen other than Rever chefes while the farm state reload the game starts after a refused farm win is pending THEN that reload SHALL still update the farm state (TD-009).

---

## Visual Spec (Grove theme, AD-022)

| Element | Rule |
| --- | --- |
| Placement | `.farm-chapters` is a row between the title `farm-map-title` and the map `farm-map` (and above `farm-empty` when present) |
| Row | `display: flex; flex-wrap: wrap; align-items: center; gap: 6px`. The 15 chips fit one row of the 880 px map, so the wrap does not act at 1024 px nor on the scaled phone; it stays as a guard |
| Label `Capítulo` | `.farm-chapters-label`, Figtree (`--font-body`) 14px weight 600, colour `--ink-600`, margin-right 4px |
| Chip | `button.farm-chapter`, `type="button"`, min-width 40px, height 32px, padding `0 10px 3px` (amended by UI review #2: the 3px bottom padding lifts every numeral to a baseline 20px below the chip's top edge), `border-radius: 999px`, Cinzel (`--font-heading`) 700 15px, colour `--parchment-100`, background `--btn-bg` with `background-color: --wood-800`, border `2px solid --bronze-500`, `box-shadow: --btn-shadow`, `position: relative` |
| Pressed chip | `[aria-pressed="true"]`: background `--btn-primary-bg`, `background-color: --ember-700`, border-color `--gold-400` |
| Current campaign chapter | `.is-current::after`: a 6 x 6 px circle `--gold-400`, centred horizontally, `bottom: 1px` (amended by UI review #2, was 3px): it spans 23px to 29px below the chip's top edge, 3px under the numeral's baseline and 1px clear of the border |
| HUD plate of an earlier chapter fight (UI review #1) | `.stage-hud` holds the text `Rever chefe: <boss>` and `span.stage-hud-chapter` with ` (Capítulo <n>)`. `.stage-hud:has(.stage-hud-chapter)`: `flex-direction: column; align-items: flex-start; gap: 0; padding-top: 4px; padding-bottom: 4px` (left and right stay 22px). `.stage-hud-chapter`: Cinzel 700 (inherited) 14px, `line-height: 1.2`, colour `--ink-600` (contrast 5.6:1 on `--parchment-200`), `white-space: nowrap`. Measured plate sizes: `Miniboss 3` + `(Capítulo 2)` 283 x 54px, `Chefe do capítulo` + `(Capítulo 14)` 346 x 54px. Campaign labels and current chapter farm labels keep one 19px line |
| Boss timer beside the plate (UI review #1) | `.boss-timer` adds `position: relative; left: var(--timer-shift, 0px)`. The scene sets `--timer-shift` to `max(0, ceil(156 + plateWidth + 12 - (512 - timerWidth / 2)))` px when a countdown starts and whenever the timer text changes, and removes it when the countdown hides. 156 is the left edge of the plate's box, 12px the gap between the plate and the timer |
| Hover / active | `filter: brightness(1.15)` / `brightness(0.9)` on enabled chips, like `.equip-button` |
| Disabled | The global `button:disabled` rule (opacity 0.45, `cursor: not-allowed`) |
| Focus | `:focus-visible` outline `2px solid --color-focus`, offset 2px |
| Assets | None new; the painted map `assets/boss-map.jpg` is the same for every chapter |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BRC-01 | P2: Farm state per chapter (AC 1-4) | Tasks | Verified |
| BRC-02 | P1: Fight an earlier chapter - backend report and rewards (AC 5-12) | Tasks | Verified |
| BRC-03 | P1: Fight - game client and session carry the chapter (AC 3-4) | Tasks | Verified |
| BRC-04 | P1: Choose a chapter - selector (AC 1-4, 7-11) | Tasks | Verified |
| BRC-05 | P1: Choose a chapter - map of an earlier chapter (AC 5, 6, 12) | Tasks | Verified |
| BRC-06 | P1: Fight - numbers, label, reopen on the limit (AC 1, 2, 13) | Tasks | Verified |
| BRC-07 | P2: Compatibility both ways (AC 1-3) | Tasks | Verified |
| BRC-08 | P1: Fight - plate on two lines and timer beside it (AC 14, 15; UI review #1) | Tasks | Verified |
| BRC-09 | P1: Choose a chapter - dot clear of the numeral (AC 13; UI review #2) | Tasks | Verified |
| BRC-10 | P1: Choose a chapter - a pending chapter load dropped on close (AC 14, 15; TD-009) | Tasks | Verified |

**Coverage:** 10 total, 10 mapped to tasks (BRC-10: T20, T21), 0 unmapped

---

## Success Criteria

- [x] A player in chapter 3 fights miniboss 3 of chapter 2 in two clicks from the HUD (open Rever chefes, chip `2`, stop `3`).
- [x] Every acceptance criterion above has a named unit or integration test, and every player-visible one an e2e scenario in `game/e2e/bossReplayChapters.spec.js`.
- [x] `farm.spec.js`, `bossMap.spec.js` and the backend `FarmServiceTest` / `FarmControllerIT` cases that exist today pass unchanged.
- [x] TD-009: P1-Choose AC 14 and 15 and their five edge cases each have a named unit test (`HeroUi.test.js`, `farmSession.test.js`), the player-visible ones an e2e scenario in `bossReplayChapters.spec.js`, and every existing test passes unchanged.
