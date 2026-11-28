# Story Scenes Specification

## Problem Statement

The game has a written story (`BRIEFING_HISTORIA.md`, `ROTEIRO_DIALOGOS.md`: a prologue and one dialogue scene after every chapter boss, acts 1 and 2 written) but no way to tell it. The owner designed the prologue player in Claude Design (`.specs/features/story-scenes/design-reference.dc.html`) and asked on 2026-11-28 that it play the first time a player starts chapter 1, that the screen today called "Rever chefes" become "Mapa" and offer a button to watch the story again, and that the player be a reusable template: the chapter scenes (chapters 1 to 30) must be added later as data (lines, audio, cues, backgrounds, portraits) with no new code. This feature ships the player, the template, the prologue and, by a scope addition of 2026-11-28 (revision 3), the chapter 1 boss scene "Capítulo 1 — Final: A Devoradora da Clareira" of a second owner design (`.specs/features/story-scenes/design-reference-chapter-01.dc.html`); the other chapter scenes come in later features.

## Goals

- [ ] A player whose battle loads at chapter 1 for the first time on a browser watches the 6-line prologue (about 40 s) with voice, synced subtitles, backgrounds and tints as in the design, and can skip it.
- [ ] The tab `Rever chefes` reads `Mapa`, and its screen replays the prologue (and, later, every chapter scene already seen).
- [ ] A player who beats the chapter 1 boss watches the 7-line chapter 1 scene once (camera moves, round face portraits, letterbox, veins and dawn), and the Mapa replays it.
- [ ] A chapter scene can be added by appending one entry to `game/src/domain/story/storyCatalog.js` and its files to `game/public/assets/story/`; `npm test` rejects a malformed entry or a missing file, and the scene plays after the first win of its chapter boss with no code change.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The content of the chapter scenes 2 to 30 (lines, audio, portraits of Morvath, Coruja Áurea) | Only the prologue and chapter 1 are designed and recorded |
| Storing "seen" on the backend, per account or across devices | D1: a local flag like the auto click switch; no backend change, no Flyway migration (AD-016 not triggered) |
| Remembering the mute choice after a reload | D13: lasts the page; not asked |
| A portrait on the right side, two portraits at once, portrait expressions | Not in the design; a character line shows one portrait on the left |
| Sound effects or music under the voice | `ROTEIRO_DIALOGOS.md`: effects go into the audio edit, not into the game |
| A scene list for many scenes (31 chips) on the Mapa screen | Only the prologue exists; the chip row wraps. A later content feature revisits the layout when it adds scenes |
| A phone layout, phone e2e scenarios or phone review shots | TD-010 was dropped on 2026-11-26: the game targets PC only. The stage scale formula still fits any window (D15) |
| Translating the story | AD-007: player text is Portuguese |
| Renaming the farm fight label `Rever chefe: <boss>` and the battle bar switch `Farm boss` | D7: they label a fight, not the tab |

---

## Assumptions & Open Questions

Rows marked `y` are the owner's request of 2026-11-28 (relayed by the orchestrator). Rows marked `y (Q<n>)` are product-owner defaults the owner approved on 2026-11-28 with every recommended answer to Q1 to Q14. Revision 2 (2026-11-28) re-checked every row against `origin/main` after `early-game-rebalance`, `reset-legacy-drops`, `portuguese-text`, `ui-polish` and `team-click-damage` (AD-030 to AD-035).

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Where "seen" is stored | localStorage key `infinity-grove.story-seen`, a JSON array of scene ids (`["prologue"]`), per browser and not per account. Logout keeps it; an account reset keeps it, so a reset never replays the prologue. A second account on the same browser does not see the prologue automatically (it can watch it from the Mapa) | The game already keeps per-browser flags this way (`infinity-grove.auto-click`, `game/src/adapters/storage/autoClickPreference.js`); a server flag needs a migration and an endpoint for a cosmetic state | y (Q1) |
| D2 Who sees it automatically | The battle's first encounter of a page load is at chapter 1 (campaign not completed) and `prologue` is not in the seen list. Players already past chapter 1 when this ships never get it automatically; players still in chapter 1 get it once | "The first time the player starts chapter 1"; an old player at chapter 7 already started chapter 1 | y (Q2) |
| D3 When it counts as seen | When the game opens a scene automatically, before its first line, the id is written to the seen list. Closing the tab during the scene does not replay it | One write, no "half seen" state; the Mapa replays it | y (Q2) |
| D4 End of the prologue | The design's end card stays with its texts `Fim do Prólogo`, `Ato 1 — Bosque Desperto`, `Capítulo 1`, and its call becomes `Clique para continuar` (design: `Clique para assistir de novo`). A click closes the overlay: the chapter 1 fight goes on (automatic play) or the Mapa screen shows again (replay) | Owner: continue to chapter 1, replay only from the Mapa | y (Q3) |
| D5 Skip | A `Pular` button in the top-right bar (left of the mute button) and the Escape key close the scene at once from any card or line. Not in the design | A 40 s scene with no exit on every new account is a blocker for returning players on a new browser | y (Q4) |
| D6 Title card | Kept from the design: logo, kicker `Ato 1 — Bosque Desperto · Prólogo`, blinking `Clique para começar`. Its click starts line 1 | The click is a user gesture that lets the audio play (autoplay policies) and gives the player a beat before the voice starts | y (Q3) |
| D7 HUD label `Rever chefe: <boss>` | Unchanged (`game/src/domain/campaign/campaign.js:24`), as is the `Farm boss` switch | It names the farm fight, not the tab | y (Q5) |
| D8 Tab rename | The rail button `hud-farm` and the panel title read `Mapa`; the test id `hud-farm`, the screen id `farm` and the icon stay | Owner's request; ids are not player text. A new icon is the owner's call (Q6) | y (Q6) |
| D9 Replay control | A group `História` with one chip per replayable scene at the top right of the Mapa screen, level with the title `Caminho do Capítulo <n>`. The prologue chip reads `Prólogo` and shows at every chapter, also before any boss is beaten | Owner: the button lives in the Mapa screen; placing it beside the title adds no height to a panel that is already 708 px high | y (Q7) |
| D10 Replayable scenes | Every `chapter-start` scene (the prologue) plus every `chapter-boss` scene of chapter N that is in the seen list or that the campaign already passed (campaign chapter above N, or the campaign completed at N or later), in catalog order | A chapter scene appears in the Mapa once the player watched it (Q12); revision 3 adds the passed chapters (D26) | y (Q12, D26) |
| D11 Fight while a scene plays | Held like the pause menu (`ClickerGame.paused`, `time.paused`, `tweens.paused` true) for automatic play and for replay; resumed when the overlay closes, unless the fight was already paused before | A replay opened during a boss fight must not cost the boss timer (the Mapa panel alone keeps the fight running, spec `background-fight`) | y (Q8) |
| D12 Auto-advance | After a line's audio ends, the next line starts 1200 ms later (design `autoDelay` 1.2 s). A click while the text types shows the whole line and stops the audio; that line then waits for a click | The design's behaviour | y |
| D13 Mute | A 44 px round button with aria-label `Silenciar` / `Ativar som` and `aria-pressed`; the choice lasts until the page reloads, across scenes, and is not stored | The design has the toggle; persisting it is not asked | y (Q9) |
| D14 Audio that cannot play | If `play()` rejects (autoplay blocked, codec unsupported) or the audio fires `error`, the text types by a clock started at that moment and the line completes at its `duration` in seconds; the scene goes on silent. A stalled download with no error waits for the player's click | The design's fallback, plus the `error` event for a missing file | y |
| D15 Window fit | The 1280x720 stage scales to `min(viewport width / 1280, viewport height / 720)`, centred, on `#05090a`, for any window. The desktop is the target (TD-010 dropped on 2026-11-26): the e2e checks 1280x720, 1920x1080 and 1024x768; the 390x844 value (0.3046875) is pinned only by the unit test of the formula | Owner: the stage scales to fit (Q11); the game targets PC | y (Q11) |
| D16 Reduced motion | WHERE `prefers-reduced-motion: reduce`, no animation or transition runs inside the overlay (backdrop drift and pan, tint pulse, cross-fades, motes, orb, portrait entrance, box rise, arrow bob, call blink) and the motes are hidden. The typing stays, because it follows the voice | The motion is decoration; the typing is the subtitle | y (Q10) |
| D17 Chapter scenes trigger | The code to play a `chapter-boss` scene ships now: when a campaign encounter moves from chapter N to N + 1, or the chapter N boss win completes the campaign, the unseen scene of chapter N opens. It is tested with fixture scenes; the catalog holds no chapter scene yet | Owner: chapter scenes must be addable as data with no new code | y (Q12) |
| D18 Fonts | The overlay uses Cinzel 500 and 700 (names, titles, buttons) and Cormorant Garamond 500 and 600, upright and italic (text), loaded with the existing Google Fonts link of `game/index.html`. Recorded as AD-036 (it extends AD-022, whose body font is Figtree) | The design's type; the rest of the game keeps the Grove theme | y (Q13) |
| D19 Portrait art | `portrait-seraphine.png` is 118x300 and is drawn 560 px tall (1.87x, 3.7x on a 2x screen); it ships as it is and the `ui-artist` reports how it reads | Better art is the owner's (like the other painted assets); the code does not depend on the file size | y (Q14) |
| D20 Assets | `bg-forest.png` (1024x768), `bg-map.jpg` (2730x1536), `logo.png` (800x436), `portrait-seraphine.png`, `prologue-01.mp4` to `prologue-06.mp4` (AAC audio, 12.36, 3.47, 7.47, 6.11, 4.05, 6.35 s, checked with `ffprobe`) are committed with the catalog task | Owner copied them; uncommitted files never reach players | y |
| D21 Overlay layer | One DOM element in `document.body`, `position: fixed`, `z-index: 9`: above the canvas and the Phaser DOM panels, below the version label (`z-index: 10`, AD-026) and the drag copy of a tile (1000) | Outside the scaled canvas the stage can fit the whole viewport (D15); the version stays on every screen (AD-026) | y (Q11) |
| D22 Storage failure | IF localStorage cannot be read or written, the seen list lives in memory for the page (the prologue opens once per page load) and nothing throws; a value that is not a JSON array of strings reads as empty and is rewritten on the next automatic scene | Same fallback as `sessionStore` (memory until unload) | y (Q1) |
| D24 Keys while a scene plays | Escape closes the scene only with no Ctrl, Alt, Meta or Shift and not as an auto-repeat, the same rule as the T, B and A keys (AD-034); every Escape keydown is stopped at the overlay while it is open, so the battle never sees it. T, B, A and the skill keys (1, 2, 3, Q, W, E) do nothing while a scene plays, because the hold sets `paused`, which `screenKey`, `autoClickKey` and `useSkill` already check | AD-034 key rule; a key must not open a screen or a skill under the overlay | y (AD-034) |
| D23 Existing e2e and shots | The shared e2e fixture (`game/e2e/support/coverage.js`) seeds the id of every catalog scene (`["prologue","chapter-1"]` today, read from `STORY_SCENES`) before every page load unless a spec turns the option `storySeen` off, so the 53 existing specs keep starting chapter 1 on the fight and win the chapter 1 boss with no overlay. T1 seeded `["prologue"]`; T19 widens it | Otherwise every chapter 1 e2e test, and every test that wins the chapter 1 boss, opens the overlay over the canvas | y |
| D25 Camera | A line may name a camera: `wide` (no move, every backdrop has it) or a camera of its backdrop, `{ x, y, scale, ms }` in `STORY_BACKDROPS.<key>.cameras`. The backdrop layer moves to `translate(x px, y px) scale(scale)` with origin `0 0` over `ms` (default 1800) with `cubic-bezier(0.45, 0.05, 0.25, 1)`. Title and end cards and lines with no camera use `wide`. The clearing has `narr` (0, -129, 1.18, 6000), `kael` (-551, -350, 1.75), `lyra` (-934, -300, 1.8), `orina` (-896, -432, 1.7), `sera` (-1024, -277, 1.8), `vex` (-1024, -268, 1.8) | The values aim at the faces of one painted image, so they belong to the backdrop, not to the scene | y (orchestrator, owner's standing approval 2026-11-28) |
| D26 Chapter 1 scene for players already past chapter 1 | Not played automatically (the trigger is the move from chapter 1 to 2, which already happened), but listed on the Mapa as replayable, because they never saw it | Orchestrator's recommended default; a player at chapter 7 would otherwise never find it | y (orchestrator, standing approval) |
| D27 Two character styles | A `character` line carries either `portrait` (full body at the left, prologue) or `face` (a round 156 px face inside a wider box, chapter 1), never both | Both designs ship; the chapter scenes to come use faces | y (orchestrator, standing approval) |
| D28 Letterbox | A scene with `letterbox: true` shows two black bars 46 px tall at the top and bottom while a line plays (they grow in 0.8 s); title and end cards have none. The prologue has none | Chapter design; a scene flag, not code per scene | y (orchestrator, standing approval) |
| D29 New tints | `veins` (purple radial, screen blend, pulsing 1.4 s, drawn on the backdrop layer so it moves with the camera) and `dawn` (warm radial from the top, 2.5 s fade). The chapter design lit `veins` on Orina's line and on narrator lines; the catalog lists it explicitly on lines 1 and 4. `dawn` is on line 7 and in the end card's tints | Explicit data instead of a rule tied to the narrator | y (orchestrator, standing approval) |
| D30 Card looks as data | `title` and `end` take optional `backdrop` (default `forest`) and `tints` (default `[ 'dark' ]`); `title` takes an optional `title` line and an optional `action` (the hit label, default `Começar a história`). Chapter 1: title on the clearing with `dark`, action `Começar a cena`; end on the clearing with `dark` and `dawn`. The chapter design's 0.6 end-card scrim is drawn as the `dark` tint (0.55) | One template for both designs; 0.05 of opacity is the ui-artist's call | y (orchestrator, standing approval) |
| D31 Card typography by trigger | Cards of a `chapter-boss` scene use the chapter design's sizes (card title 44 px, subtitle 28 px, logo 520 px wide, gap 16 px); cards of a `chapter-start` scene keep the prologue's (end title 56 px, subtitle 30 px, logo 620 px, gap 18 px). The narrator text (940 px, scrim 420 px) and the vignette (0.7) of the prologue serve both (the chapter design: 960 px, 400 px, 0.72) | The two designs differ only by scene kind; the narrator and vignette differences are under 3 % | y (orchestrator, standing approval) |
| D32 Motes as data | A scene may list its motes as `[left, top, delay s, duration s]`; with none it uses the prologue's 14. Chapter 1 lists the design's 10 | Each design places its own motes | y (orchestrator, standing approval) |
| D33 Chapter 1 end call | `Clique para continuar` (design: `Clique para assistir de novo`), closing the scene into the chapter 2 fight or back to the Mapa, as the prologue (D4) | Same rule as the prologue's end card | y (orchestrator, standing approval) |

**Open questions:** none. The owner approved the recommended answer of every question below on 2026-11-28 (record):

- Q1 (D1, D22) Store "seen" only in this browser (localStorage), not per account and not on the server, so a logout or an account reset never replays the prologue and a second account on the same browser does not get it automatically? Recommended: yes.
- Q2 (D2, D3) Play it automatically only when the battle loads at chapter 1 and this browser never saw it, and count it as seen as soon as it opens (closing the tab mid-scene does not replay it)? Players already past chapter 1 watch it from the Mapa. Recommended: yes.
- Q3 (D4, D6) Keep the title card (`Clique para começar`) and the end card, with the end call changed to `Clique para continuar`, which closes the scene and goes on to chapter 1 (or back to the Mapa on a replay)? Recommended: yes.
- Q4 (D5) Add a `Pular` button (and the Escape key) that closes the scene at once? Recommended: yes.
- Q5 (D7) Keep the fight label `Rever chefe: <boss>` and the `Farm boss` switch as they are? Recommended: yes.
- Q6 (D8) Rename only the label and the panel title to `Mapa` and keep the current icon? Recommended: yes; a map icon can come with the `ui-artist` review if it asks for one.
- Q7 (D9) Put the replay control as a `História` group with a `Prólogo` chip at the top right of the Mapa screen, beside `Caminho do Capítulo <n>`? Recommended: yes.
- Q8 (D11) Hold the fight (no clicks, auto click, allies, ticks or boss timer) while any scene plays, also a replay opened from the Mapa during a boss fight? Recommended: yes.
- Q9 (D13) Keep the mute choice only until the page reloads? Recommended: yes.
- Q10 (D16) With reduced motion on, stop every animation of the scene and hide the light motes, but keep the typing synced to the voice? Recommended: yes.
- Q11 (D15, D21) The 1280x720 stage shrinks to fit the window (on a phone the dialogue text would read at about 10 px at 390x844; the game targets PC since TD-010 was dropped), and the scene covers the whole window except the version label? Recommended: yes.
- Q12 (D10, D17) Ship now the code that plays a chapter scene after the first win of its chapter boss (tested with fixture data, no chapter content), and list a chapter scene in the Mapa once it was watched? Recommended: yes.
- Q13 (D18) Load Cormorant Garamond and Cinzel 500 for the story only, as AD-036? Recommended: yes.
- Q14 (D19) Ship the 118x300 Seraphine portrait drawn 560 px tall and let the `ui-artist` judge it? Recommended: yes; a larger portrait (at least 220x560) is owner art.

---

## User Stories

### P1: The prologue opens on the first chapter 1 battle ⭐ MVP

**User Story**: As a new player, I want the story of the Grove told before my first fight so that I know why my heroes fight.

**Why P1**: The owner's main request.

**Acceptance Criteria**:

1. WHEN the battle (scene `ClickerGame`) shows the first encounter of a page load, the campaign is at chapter 1 and not completed, and the seen list does not hold `prologue` THEN the game SHALL open the story overlay (`data-testid="story-overlay"`) on the prologue's title card.  <!-- event-driven -->
2. WHEN the game opens a scene automatically THEN it SHALL add the scene id to the seen list before the title card shows: the localStorage key `infinity-grove.story-seen` reads `["prologue"]` after the prologue opens on an empty list, and `["chapter-1","prologue"]` after it opens on `["chapter-1"]`.  <!-- event-driven -->
3. IF the seen list holds `prologue` THEN the battle at chapter 1 SHALL open no overlay.  <!-- unwanted-behavior -->
4. IF the first encounter of the page load is at chapter 2 or later, or the campaign is completed, THEN the battle SHALL open no overlay and SHALL leave the key `infinity-grove.story-seen` as it was (absent stays absent).  <!-- unwanted-behavior -->
5. WHILE a story overlay is open the battle SHALL be held: `ClickerGame.paused`, `ClickerGame.time.paused` and `ClickerGame.tweens.paused` are `true`, so no click, auto click, team hit (AD-035), skill, damage tick or boss countdown runs.  <!-- state-driven -->
6. WHEN the overlay closes THEN the game SHALL remove it from the page and set `paused`, `time.paused` and `tweens.paused` back to `false`, unless `paused` was already `true` when the overlay opened, in which case it SHALL leave the three as they are.  <!-- event-driven -->
7. IF localStorage cannot be read or written THEN the game SHALL keep the seen list in memory for the page (the prologue opens once per page load) and SHALL not throw; IF the stored value is not a JSON array THEN it SHALL read as an empty list, and the entries that are not strings SHALL be dropped.  <!-- unwanted-behavior -->
8. WHEN an account reset moves the campaign back to chapter 1 THEN the game SHALL open no scene, and neither a reset nor a logout SHALL change the key `infinity-grove.story-seen`.  <!-- event-driven -->

**Independent Test**: Sign up a new account on a browser with no `infinity-grove.story-seen`, start the battle and see the prologue's title card; reload and log in again: the fight shows with no overlay.

---

### P1: Watching a scene ⭐ MVP

**User Story**: As a player, I want the scene to type the subtitles with the voice, let me speed it up, skip it or mute it, so that I watch it at my pace.

**Why P1**: The player is the design the owner approved.

**Acceptance Criteria**:

1. WHILE the title card shows the overlay SHALL show the image `assets/story/logo.png` with alt `Infinity Grove`, the kicker `Ato 1 — Bosque Desperto · Prólogo` and the call `Clique para começar`, and the full-screen button `data-testid="story-hit"` SHALL have the aria-label `Começar a história`.  <!-- state-driven -->
2. WHEN the player clicks `story-hit` on the title card THEN line 1 SHALL start: its audio plays from second 0 and its text starts typing.  <!-- event-driven -->
3. WHILE a line types, the overlay SHALL show the first `charsAt(line, t)` characters of the line text in `.story-shown` and the rest in the transparent `.story-ghost`, where the line text is the cue texts joined by one space, `t` is the audio's `currentTime` (or the clock seconds of D14), and `charsAt` adds, for each cue in order, its text length plus 1 (no 1 for the last cue) once `t >= end`, adds `floor(length x (t - start) / (end - start))` and stops when `start < t < end`, stops when `t <= start`, and caps the sum at the text length. For prologue line 2 (`[[0.05, 2.23, 'Até a noite em que as raízes'], [2.6, 3.4, 'tremeram.']]`, 38 characters) `t` = 0, 0.05, 1.14, 2.23, 2.4, 3.0, 3.4 and 10 give 0, 0, 14, 29, 29, 33, 38 and 38.  <!-- state-driven -->
4. WHEN the player clicks `story-hit` while a line types THEN the overlay SHALL show the whole line, pause its audio, show the next arrow `.story-next` and set the aria-label to `Próxima fala`, and the line SHALL wait for a click (no auto-advance).  <!-- event-driven -->
5. WHEN the player clicks `story-hit` on a complete line THEN the next line SHALL start from second 0; on the last line the end card SHALL show instead.  <!-- event-driven -->
6. WHEN a line's audio fires `ended` (or the clock of D14 reaches the line's `duration`) THEN the line SHALL show complete with `.story-next`, and 1200 ms later the next line (or the end card) SHALL start unless the player clicked first.  <!-- event-driven -->
7. IF a line's audio `play()` rejects or the audio fires `error` THEN the text SHALL type by a clock started at that moment, using the same `charsAt`, and the line SHALL complete when the clock reaches its `duration` (prologue line 2: 3.47 s), then auto-advance as in AC 6.  <!-- unwanted-behavior -->
8. WHILE the end card shows the overlay SHALL show the kicker `Fim do Prólogo`, the title `Ato 1 — Bosque Desperto`, the subtitle `Capítulo 1` and the call `Clique para continuar`, and `story-hit` SHALL have the aria-label `Continuar`.  <!-- state-driven -->
9. WHEN the player clicks `story-hit` on the end card THEN the overlay SHALL close.  <!-- event-driven -->
10. WHEN the player clicks `Pular` (`data-testid="story-skip"`) on the title card, a line or the end card THEN the overlay SHALL close at once and every audio of the scene SHALL be paused.  <!-- event-driven -->
11. WHEN the player presses Escape (no Ctrl, Alt, Meta or Shift held, not an auto-repeat) while the overlay is open THEN the overlay SHALL close as with `Pular`, and the battle SHALL neither open the pause menu nor close an open hero panel.  <!-- event-driven -->
12. WHEN the player clicks the mute button (`data-testid="story-mute"`) THEN every audio of the scene SHALL be muted and the button's aria-label SHALL change from `Silenciar` to `Ativar som` and `aria-pressed` from `false` to `true`; a second click SHALL undo both; the choice SHALL hold for the next scene opened before a reload.  <!-- event-driven -->
13. WHILE a line plays the top-right bar SHALL show one dot `.story-dot` per line of the scene with the dots from the first up to the current line carrying `.is-on` (prologue line 3: 3 of 6); WHILE the title or the end card shows the dots SHALL be hidden.  <!-- state-driven -->
14. The overlay SHALL draw a `narrator` line as centred italic text (`.story-narr`) over a dark scrim with no name plate, a `voice` line as the breathing green orb (`data-testid="story-orb"`) above a dialogue box with the speaker plate (`data-testid="story-speaker"`, `A Voz`) and italic text, and a `character` line as the portrait image (`data-testid="story-portrait"`, alt = the speaker) entering from the left beside a dialogue box with the speaker plate (`Seraphine`) and upright text.  <!-- ubiquitous -->
15. WHILE a line plays the overlay SHALL show only the backdrop named by the line (`.story-backdrop.is-on`, `forest` or `map`) and exactly the tints of the line (`dark`, `red`, `gold`, `voice`) with `.is-on`, where a tint listed in the line's `tintAt` turns on only once `t >= tintAt[tint]` or the line is complete (prologue line 3: `red` off at `t` = 6.0 and on at 6.1); WHILE the title or end card shows the `forest` backdrop and the `dark` tint SHALL be on.  <!-- state-driven -->
16. WHEN the overlay opens THEN focus SHALL move to `story-hit` (Enter and Space on it act as a click), and WHEN it closes focus SHALL return to the element that had it before.  <!-- event-driven -->

**Independent Test**: Open the prologue, click once to start, click while line 1 types (whole line shows), click again (line 2), let line 2 end on its own (line 3 starts 1.2 s later), mute, press Escape: the overlay is gone.

---

### P1: The Mapa tab replays the story ⭐ MVP

**User Story**: As a player, I want the tab of the boss map called Mapa with a button to watch the story again so that I can revisit it.

**Why P1**: The owner's second request.

**Acceptance Criteria**:

1. The rail button `data-testid="hud-farm"` SHALL read `Mapa` and the panel title of its screen SHALL read `Mapa`, while the farm fight label SHALL keep the text `Rever chefe: <boss>` (for example `Rever chefe: Miniboss 1`).  <!-- ubiquitous -->
2. WHILE the Mapa screen shows, the group `data-testid="farm-story"` with the label `História` SHALL show at the top right of the screen, its vertical centre within 4 px of the vertical centre of `farm-map-title`, with one chip per replayable scene; the prologue chip `data-testid="story-replay-prologue"` SHALL read `Prólogo` with the aria-label `Assistir Prólogo` at every chapter, also when no boss was beaten.  <!-- state-driven -->
3. WHEN the player clicks a story chip THEN the overlay SHALL open on that scene's title card with the fight held (P1 first story AC 5) and the seen list unchanged.  <!-- event-driven -->
4. WHEN a scene opened from the Mapa closes THEN the Mapa screen SHALL still show, on the chapter it showed before.  <!-- event-driven -->
5. The replayable scenes SHALL be every `chapter-start` scene of the catalog plus every `chapter-boss` scene of chapter N whose id is in the seen list or whose chapter the campaign passed (campaign chapter above N, or completed at a chapter of at least N), in catalog order (D26).  <!-- ubiquitous -->

**Independent Test**: Open Mapa, read `Mapa` on the tab and the title, click `Prólogo`, watch the title card, click `Pular`: the Mapa is still open.

---

### P1: The prologue content ⭐ MVP

**User Story**: As the owner, I want the prologue to play the texts, voices and timings of my design so that the game shows what I approved.

**Why P1**: The content of this release.

**Acceptance Criteria**:

1. The catalog SHALL hold the scene `prologue` (label `Prólogo`, trigger `chapter-start` of chapter 1) with these 6 lines in this order, each with the cues of the design's `IG_LINES` (`design.md` § Prologue data):

   | # | kind | speaker | backdrop | tints | tintAt | audio | duration (s) |
   | - | ---- | ------- | -------- | ----- | ------ | ----- | ------------ |
   | 1 | narrator | Narrador | forest | none | none | `assets/story/prologue-01.mp4` | 12.36 |
   | 2 | narrator | Narrador | forest | dark | none | `assets/story/prologue-02.mp4` | 3.47 |
   | 3 | narrator | Narrador | forest | dark, red | red 6.1 | `assets/story/prologue-03.mp4` | 7.47 |
   | 4 | narrator | Narrador | map | gold | none | `assets/story/prologue-04.mp4` | 6.11 |
   | 5 | voice | A Voz | forest | dark, voice | none | `assets/story/prologue-05.mp4` | 4.05 |
   | 6 | character (`assets/story/portrait-seraphine.png`) | Seraphine | forest | none | none | `assets/story/prologue-06.mp4` | 6.35 |

   and the line texts SHALL be: 1 `Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo, e sua seiva corre por cada folha, cada rio, cada criatura.`; 2 `Até a noite em que as raízes tremeram.`; 3 `Do fundo da terra subiu um rumor. E os animais do bosque abriram os olhos... Vermelhos.`; 4 `A Árvore despertou. E, entre milhares, escolheu cinco guardiões.`; 5 `Criança... venha. Eu preciso de você.`; 6 `Vocês também ouviram? Ela está nos chamando. A Árvore... está com medo.`  <!-- ubiquitous -->
2. The repository SHALL hold every file the catalog names under `game/public/`: the 4 images and the 6 audio files of D20.  <!-- ubiquitous -->

**Independent Test**: Click through the prologue and read the six texts in order with the speakers `A Voz` and `Seraphine` on lines 5 and 6.

---

### P2: Scenes are data

**User Story**: As the owner, I want to add a chapter scene by adding its data and files so that the story grows with no new code.

**Why P2**: The template; no chapter scene ships in this release.

**Acceptance Criteria**:

1. The game SHALL read every scene, backdrop image and portrait from `game/src/domain/story/storyCatalog.js` (`STORY_SCENES`, `STORY_BACKDROPS`, format in `design.md` § Data model), so that a scene added there with its files under `game/public/assets/story/` plays, lists and validates with no other file changed.  <!-- ubiquitous -->
2. The unit suite SHALL fail with the message of the broken rule when a catalog scene breaks a rule of `design.md` § Validation rules (for example `chapter-1 line 2: a character line needs a portrait`), and SHALL fail naming the path when a file the catalog names is missing under `game/public/`.  <!-- ubiquitous -->
3. WHEN a campaign encounter moves from chapter N to chapter N + 1, or the chapter N boss win completes the campaign, and the catalog holds a `chapter-boss` scene of chapter N that is not in the seen list THEN the game SHALL add its id to the seen list and open it with the fight held.  <!-- event-driven -->
4. IF the chapter changes any other way (the first encounter of the page, an account reset to chapter 1, a farm fight, a realign that keeps the chapter) THEN the game SHALL open no `chapter-boss` scene.  <!-- unwanted-behavior -->
5. IF a scene is already open THEN a second scene request (automatic or from the Mapa) SHALL be ignored.  <!-- unwanted-behavior -->

**Independent Test**: In a unit test, give the battle a catalog with a `chapter-boss` scene of chapter 1, win the chapter 1 boss and see the scene opened once; a second win of the farm opens nothing.

---

### P2: Fits every screen

**User Story**: As a player on any screen, I want the scene to fill my window without cropping, respect my reduced motion setting and leave the version label visible.

**Why P2**: The design is a fixed 1280x720 stage.

**Acceptance Criteria**:

1. The stage (`data-testid="story-stage"`, 1280x720 CSS px) SHALL be centred in the viewport and scaled by `min(width / 1280, height / 720)`: 1280x720 gives a 1280x720 box at (0, 0); 1920x1080 a 1920x1080 box at (0, 0); 1024x768 a 1024x576 box at (0, 96); 390x844 a 390x219.375 box at (0, 312.3125) (each within 1 px), on the overlay background `#05090a`.  <!-- ubiquitous -->
2. WHEN the window is resized while the overlay is open THEN the stage SHALL take the scale of the new size.  <!-- event-driven -->
3. WHERE the system asks for reduced motion (`prefers-reduced-motion: reduce`) every element inside the overlay SHALL have the computed `animation-name` `none` and `transition-duration` `0s`, and the motes (`.story-mote`) SHALL have `display: none`.  <!-- optional-feature -->
4. The overlay SHALL be `position: fixed` with `z-index` 9, and the version label (`data-testid="game-version"`) SHALL stay visible above it.  <!-- ubiquitous -->
5. The overlay text SHALL use the fonts of D18: the speaker plate, kicker, end title, call and `Pular` compute a `font-family` starting with `Cinzel`, and the line texts a `font-family` starting with `"Cormorant Garamond"`.  <!-- ubiquitous -->

**Independent Test**: Open the prologue at 1024x768 (bands of 96 px above and below), at 1280x720 (full window), and with reduced motion emulated (no animation).

---

### P2: Keys while a scene plays

**User Story**: As a player, I want the keys of the battle to stay quiet under a scene so that a key I press while watching opens nothing behind it.

**Why P2**: The battle's key rule of AD-034 (modifiers, repeats) applies to every key of the game.

**Acceptance Criteria**:

1. IF Escape is pressed with Ctrl, Alt, Meta or Shift held, or arrives as an auto-repeat, THEN the overlay SHALL stay open, and no Escape `keydown` SHALL reach the battle while the overlay is open (the pause menu stays hidden and an open hero panel stays open).  <!-- unwanted-behavior -->
2. WHILE a scene plays, the keys T, B, A, 1, 2, 3, Q, W and E SHALL do nothing: no hero screen opens, closes or changes, the auto click window stays closed and no skill is used.  <!-- state-driven -->

**Independent Test**: During the prologue press Shift+Escape (the scene stays), then T, B and 1: no screen opens and no skill fires; press Escape: the scene closes.

---

### P1: The chapter 1 boss scene ⭐ MVP

**User Story**: As a player who beats the Serpente Umbral, I want to watch the heroes talk over her body so that the story goes on after chapter 1.

**Why P1**: Scope addition of 2026-11-28 (owner's second design, `design-reference-chapter-01.dc.html`).

**Acceptance Criteria**:

1. The catalog SHALL hold the scene `chapter-1` (label `Capítulo 1`, trigger `chapter-boss` of chapter 1, `letterbox: true`) with these 7 lines in this order and the cues of the design's `CF_LINES` (`design.md` § Chapter 1 data):

   | # | kind | speaker | face | camera | tints | audio | duration (s) |
   | - | ---- | ------- | ---- | ------ | ----- | ----- | ------------ |
   | 1 | narrator | Narrador | none | narr | veins | `assets/story/chapter-01-01.mp4` | 6.03 |
   | 2 | character | Kael | `assets/story/face-kael.jpg` | kael | none | `assets/story/chapter-01-02.mp4` | 5.64 |
   | 3 | character | Lyra | `assets/story/face-lyra.jpg` | lyra | none | `assets/story/chapter-01-03.mp4` | 5.49 |
   | 4 | character | Orina | `assets/story/face-orina.jpg` | orina | veins | `assets/story/chapter-01-04.mp4` | 8.91 |
   | 5 | character | Seraphine | `assets/story/face-seraphine.jpg` | sera | none | `assets/story/chapter-01-05.mp4` | 5.25 |
   | 6 | character | Vex | `assets/story/face-vex.jpg` | vex | none | `assets/story/chapter-01-06.mp4` | 4.83 |
   | 7 | character | Kael | `assets/story/face-kael.jpg` | kael | dawn | `assets/story/chapter-01-07.mp4` | 4.05 |

   every line on the backdrop `clearing`, and the line texts SHALL be: 1 `A Serpente Umbral tomba na clareira, e o veneno roxo escorre de volta para a terra.`; 2 `Uma serpente desse tamanho, aqui? Isto não é do nosso bosque.`; 3 `Olha os olhos dela, Kael! Ainda brilham. Vermelho, vermelho, como brasa!`; 4 `Interessante... As veias roxas pulsam no mesmo ritmo. Como se algo lá embaixo respirasse por elas.`; 5 `A Árvore diz que isto é só o começo. Precisamos ficar juntos.`; 6 `Ela diz, é? Sorte a sua. Comigo ninguém conversa.`; 7 `Então fique calado e lute, espião. Avançamos ao amanhecer.`  <!-- ubiquitous -->
2. The repository SHALL hold `game/public/assets/story/bg-clearing.jpg`, the five `face-<hero>.jpg` files and `chapter-01-01.mp4` to `chapter-01-07.mp4` (AAC, 6.03, 5.64, 5.49, 8.91, 5.25, 4.83, 4.05 s by `ffprobe`).  <!-- ubiquitous -->
3. WHEN the chapter 1 boss win moves the campaign to chapter 2 and the seen list does not hold `chapter-1` THEN the game SHALL add `chapter-1` to the seen list and open the overlay on its title card: the logo, the kicker `Capítulo 1 — Final`, the title `A Devoradora da Clareira`, the call `Clique para começar`, and `story-hit` with the aria-label `Começar a cena`.  <!-- event-driven -->
4. WHILE the chapter 1 end card shows the overlay SHALL show the kicker `Fim do Capítulo 1`, the title `A Devoradora da Clareira`, the subtitle `Ao amanhecer, os cinco guardiões avançam.` and the call `Clique para continuar`, with `story-hit` labelled `Continuar`; a click SHALL close it with the chapter 2 fight going on.  <!-- state-driven -->
5. WHILE the Mapa screen shows and `chapter-1` is replayable (P1 Mapa AC 5) the História group SHALL hold, after `Prólogo`, the chip `data-testid="story-replay-chapter-1"` reading `Capítulo 1` with the aria-label `Assistir Capítulo 1`; at chapter 1 with `chapter-1` unseen it SHALL not.  <!-- state-driven -->

**Independent Test**: Win the chapter 1 boss on a browser that never saw the scene: the title card `A Devoradora da Clareira` opens; click through the seven lines (the camera moves to each speaker) to the end card and into chapter 2; open the Mapa and replay `Capítulo 1`.

---

### P2: Scene looks as data

**User Story**: As the owner, I want camera moves, face portraits, letterbox, motes and card looks to be scene data so that the next chapter scenes need no code.

**Why P2**: The chapter design adds them; the template must carry them.

**Acceptance Criteria**:

1. WHILE a line plays, the camera layer (`data-testid="story-camera"`, holding the backdrops and the `veins` tint) SHALL have the inline `transform` `translate(<x>px, <y>px) scale(<scale>)` of the line's camera and the `transition-duration` of its `ms` (default 1800 ms) with the timing function `cubic-bezier(0.45, 0.05, 0.25, 1)`; WHILE a card shows or the line names no camera it SHALL be `translate(0px, 0px) scale(1)` (camera `wide`). Chapter 1 line 2 gives `translate(-551px, -350px) scale(1.75)` and 1.8 s; line 1 gives `translate(0px, -129px) scale(1.18)` and 6 s.  <!-- state-driven -->
2. The overlay SHALL draw a `character` line that has a `face` as the round face image (`data-testid="story-face"`, alt = the speaker, 156x156 px, `border-radius` 50 %) inside the dialogue box `.story-box.is-face` (left 110 px, width 1060 px, `padding-left` 210 px) with the speaker plate at left 206 px, and a `character` line that has a `portrait` as the full-body portrait of P1 Watching AC 14.  <!-- ubiquitous -->
3. WHERE a scene has `letterbox: true`, WHILE a line plays two bars `.story-bar` (`#000`) SHALL be 46 px tall at the top and bottom of the stage, and WHILE a card shows they SHALL be 0 px tall; a scene without `letterbox` SHALL never show them taller than 0 px.  <!-- optional-feature -->
4. WHILE a line or card lists the tint `veins` the overlay SHALL turn on `.story-tint.is-veins` inside the camera layer (it moves with the camera), and WHILE it lists `dawn` it SHALL turn on `.story-tint.is-dawn`: chapter 1 lines 1 and 4 show `veins`, line 7 and the end card show `dawn`.  <!-- state-driven -->
5. WHILE a title or end card shows, the overlay SHALL show the card's `backdrop` and `tints` (default `forest` and `dark`): the chapter 1 title card the `clearing` with `dark`, its end card the `clearing` with `dark` and `dawn`; the prologue cards the `forest` with `dark`.  <!-- state-driven -->
6. The overlay SHALL draw the scene's motes from its `motes` list (`[left px, top px, delay s, duration s]`), 14 of the prologue's when the scene lists none: chapter 1 draws 10, the first at left 120 px, top 520 px.  <!-- ubiquitous -->
7. The cards of a `chapter-boss` scene SHALL use a 44 px card title, a 28 px subtitle and a 520 px logo, and the cards of a `chapter-start` scene a 56 px end title, a 30 px subtitle and a 620 px logo (D31).  <!-- ubiquitous -->

**Independent Test**: In the chapter 1 scene, line 2 moves the clearing to Kael's face in 1.8 s, the box shows Kael's round face, the bars frame the line, Orina's line pulses purple, Kael's last line warms with the dawn that stays on the end card.

---

## Edge Cases

- WHEN the player clicks on the letterbox outside the scaled stage THEN the click SHALL act as a click on `story-hit` (the hit button covers the whole overlay) (STORY-11, STORY-12).
- WHEN the player clicks `Pular` while a line's audio plays THEN the audio SHALL be paused before the overlay is removed (STORY-18).
- WHEN the auto-advance timer is pending and the player clicks THEN the next line SHALL start once, not twice (STORY-13, STORY-14).
- WHEN the player presses Escape on a replay opened over the Mapa THEN the Mapa panel SHALL stay open (STORY-19, STORY-28).
- IF the seen list holds `prologue` but the campaign is at chapter 1 THEN the Mapa SHALL still list `Prólogo` (STORY-26, STORY-29).
- WHEN the prologue opens on a browser whose storage throws THEN the battle SHALL still show the encounter after the overlay closes (STORY-07).
- WHEN a chapter boss is beaten again in the farm THEN no scene SHALL open (STORY-35).
- WHEN a player whose campaign is at chapter 2 or later and whose seen list lacks `chapter-1` opens the Mapa THEN the `Capítulo 1` chip SHALL show (STORY-29, STORY-48), and no scene SHALL open on its own (STORY-35).
- WHEN the camera moves while the player completes a line with a click THEN the camera SHALL keep moving to the same preset (STORY-49).
- WHERE reduced motion is on, the camera SHALL jump to its preset with no transition (STORY-39, STORY-49).

---

## Requirement Traceability

IDs follow the order of the criteria: STORY-01 to STORY-08 "The prologue opens", STORY-09 to STORY-24 "Watching a scene", STORY-25 to STORY-29 "The Mapa tab", STORY-30 to STORY-31 "The prologue content", STORY-32 to STORY-36 "Scenes are data", STORY-37 to STORY-41 "Fits every screen", STORY-42 to STORY-43 "Keys while a scene plays", STORY-44 to STORY-48 "The chapter 1 boss scene" (revision 3), STORY-49 to STORY-55 "Scene looks as data" (revision 3).

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| STORY-01 | P1: The prologue opens (AC 1) | T4, T13, T14 | Implementing |
| STORY-02 | P1: The prologue opens (AC 2) | T6, T13, T14 | Implementing |
| STORY-03 | P1: The prologue opens (AC 3) | T4, T13, T14 | Implementing |
| STORY-04 | P1: The prologue opens (AC 4) | T4, T13, T14 | Implementing |
| STORY-05 | P1: The prologue opens (AC 5) | T13, T14 | In Tasks |
| STORY-06 | P1: The prologue opens (AC 6) | T13, T14 | In Tasks |
| STORY-07 | P1: The prologue opens (AC 7) | T6, T14 | Implementing |
| STORY-08 | P1: The prologue opens (AC 8) | T13, T14 | In Tasks |
| STORY-09 | P1: Watching a scene (AC 1) | T3, T7, T14 | Implementing |
| STORY-10 | P1: Watching a scene (AC 2) | T8, T14 | Implementing |
| STORY-11 | P1: Watching a scene (AC 3) | T2, T7, T8 | Implementing |
| STORY-12 | P1: Watching a scene (AC 4) | T3, T8, T14 | Implementing |
| STORY-13 | P1: Watching a scene (AC 5) | T3, T8, T14 | Implementing |
| STORY-14 | P1: Watching a scene (AC 6) | T3, T8, T16 | Implementing |
| STORY-15 | P1: Watching a scene (AC 7) | T8, T16 | Implementing |
| STORY-16 | P1: Watching a scene (AC 8) | T3, T7, T14 | Implementing |
| STORY-17 | P1: Watching a scene (AC 9) | T3, T8, T14 | Implementing |
| STORY-18 | P1: Watching a scene (AC 10) | T3, T8, T14 | Implementing |
| STORY-19 | P1: Watching a scene (AC 11) | T8, T13, T14, T15 | Implementing |
| STORY-20 | P1: Watching a scene (AC 12) | T7, T8, T16 | Implementing |
| STORY-21 | P1: Watching a scene (AC 13) | T3, T7, T16 | Implementing |
| STORY-22 | P1: Watching a scene (AC 14) | T7, T9, T14 | Implementing |
| STORY-23 | P1: Watching a scene (AC 15) | T3, T7, T16 | Implementing |
| STORY-24 | P1: Watching a scene (AC 16) | T8, T16 | Implementing |
| STORY-25 | P1: The Mapa tab (AC 1) | T12, T15 | In Tasks |
| STORY-26 | P1: The Mapa tab (AC 2) | T9, T11, T12, T15 | In Tasks |
| STORY-27 | P1: The Mapa tab (AC 3) | T12, T13, T15 | In Tasks |
| STORY-28 | P1: The Mapa tab (AC 4) | T13, T15 | In Tasks |
| STORY-29 | P1: The Mapa tab (AC 5) | T4, T13 | Implementing |
| STORY-30 | P1: The prologue content (AC 1) | T5, T14 | Implementing |
| STORY-31 | P1: The prologue content (AC 2) | T5 | Implementing |
| STORY-32 | P2: Scenes are data (AC 1) | T5, T7, T13 | Implementing |
| STORY-33 | P2: Scenes are data (AC 2) | T4, T5 | Implementing |
| STORY-34 | P2: Scenes are data (AC 3) | T4, T13 | Implementing |
| STORY-35 | P2: Scenes are data (AC 4) | T4, T13 | Implementing |
| STORY-36 | P2: Scenes are data (AC 5) | T13 | In Tasks |
| STORY-37 | P2: Fits every screen (AC 1) | T3, T8, T9, T16 | Implementing |
| STORY-38 | P2: Fits every screen (AC 2) | T8, T16 | Implementing |
| STORY-39 | P2: Fits every screen (AC 3) | T9, T16 | In Tasks |
| STORY-40 | P2: Fits every screen (AC 4) | T9, T16 | In Tasks |
| STORY-41 | P2: Fits every screen (AC 5) | T9, T16 | In Tasks |
| STORY-42 | P2: Keys while a scene plays (AC 1) | T8, T13, T14 | Implementing |
| STORY-43 | P2: Keys while a scene plays (AC 2) | T13, T14 | In Tasks |
| STORY-44 | P1: The chapter 1 boss scene (AC 1) | T5, T20 | Implementing |
| STORY-45 | P1: The chapter 1 boss scene (AC 2) | T5 | Implementing |
| STORY-46 | P1: The chapter 1 boss scene (AC 3) | T3, T7, T13, T20 | Implementing |
| STORY-47 | P1: The chapter 1 boss scene (AC 4) | T7, T20 | Implementing |
| STORY-48 | P1: The chapter 1 boss scene (AC 5) | T4, T13, T15 | Implementing |
| STORY-49 | P2: Scene looks as data (AC 1) | T3, T4, T7, T9, T20 | Implementing |
| STORY-50 | P2: Scene looks as data (AC 2) | T4, T7, T9, T20 | Implementing |
| STORY-51 | P2: Scene looks as data (AC 3) | T7, T9, T20 | Implementing |
| STORY-52 | P2: Scene looks as data (AC 4) | T4, T7, T9, T20 | Implementing |
| STORY-53 | P2: Scene looks as data (AC 5) | T3, T4, T7, T20 | Implementing |
| STORY-54 | P2: Scene looks as data (AC 6) | T4, T7, T20 | Implementing |
| STORY-55 | P2: Scene looks as data (AC 7) | T7, T9, T20 | Implementing |

**ID format:** `STORY-<NN>`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 55 total, 55 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] A new account's first battle opens the prologue; the six lines play with their voice and synced text, and the end card leads into chapter 1 (e2e `storyScenes.spec.js`).
- [ ] A reload, a logout or an account reset never shows the prologue again on that browser (e2e and unit).
- [ ] The tab reads `Mapa` and its `Prólogo` chip replays the scene with the Mapa open afterwards (e2e `storyReplay.spec.js`).
- [ ] A fixture `chapter-boss` scene plays after the first win of its chapter boss with no code change (unit `ClickerGame.test.js`), and a malformed catalog entry fails `npm test`.
- [ ] Winning the chapter 1 boss opens the chapter 1 scene once, and the Mapa replays it (e2e `storyChapterOne.spec.js`).
- [ ] The `ui-artist` review of the title card, each line kind (including the chapter 1 faces and camera), the end card, the Mapa group, the 1024x768 fit and reduced motion is APROVADO.
