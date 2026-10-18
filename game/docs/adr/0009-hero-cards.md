# ADR 0009: Hero cards in the game (heroes and farm services, DOM screens, farm mode)

- Status: Accepted
- Date: 2026-10-18

## Context

The backend (ADR 0007) now owns the hero cards: it rolls the drop when it accepts a boss win, keeps the bag, fuses cards and stores the leader. The game must let the player choose a starting hero at sign up, browse the heroes, see the bag, fuse cards, choose a leader, see the leader's skills on the combat screen, see the card a boss dropped, and fight defeated bosses again. The buttons live in the game screen, not in the pause menu. Executing skills in combat is a later feature, and the new text is Portuguese (`AD-007`). The code follows ADR 0007 (hexagonal modules).

## Decision

**Services, no Phaser.**

- `domain/heroes/heroes.js`: pure rules over the `GET /heroes` payload: `bagEntries`, `fusionRows` (stars 0 to 2, enabled from 3 copies), `unlockedSlots`, `applyDrop`, `bossLabel`, `ELEMENT_LABELS` and `STARTING_CHOICES`. `Campaign.farmEncounter({ kind, stage })` builds the encounter of a beaten boss from the chapter definition (kind `FARM`, the boss it is, label `Rever chefe: ...`).
- `application/heroes/heroCollection.js`: `createHeroCollection({ gateway })` holds the heroes and the leader. `load()` (one request at a time), `fuse(heroId, stars)`, `setLeader(heroId)` (the leader changes only after the backend accepted it), `applyDrop(drop)` (a dropped card joins the bag without a request) and `onChange(listener)`.
- `application/farm/farmSession.js`: `createFarmSession({ gateway })` keeps the beaten bosses and the chapter boss wins left; `win(boss)` is one request.
- `application/campaign/campaignSession.js` gains `onDrop(callback)`, called with the `drop` of each accepted report, and `farmEncounter(boss)`.
- `adapters/http/heroesApi.js` (`GET /heroes`, `POST /heroes/{id}/fuse`, `PUT /leader`) and `farmApi.js` (`GET /farm`, `POST /farm/outcome`) implement the gateways; `userApi.signUp` sends `startingElement`. `composition.js` exposes `createHeroCollection` and `createFarmSession` to the scenes through the registry.

**Screens are plain DOM.** `adapters/phaser/views/*.js` (`catalogView`, `bagView`, `fusionView`, `leaderView`, `farmView`, `skillBar`) build DOM nodes with stable `data-testid`s and no Phaser. `HeroUi` places them with `scene.add.dom`: five HUD buttons on the right (Heróis, Mochila, Fusão, Líder, Rever chefes), one panel that shows the screen that was opened, the skill bar and the `Carta: <nome>` notice. A panel pauses the fight through `pauseForMenu` and resumes through `resumeFromMenu`; it never resumes a fight the player paused with Esc, and Esc closes an open panel before it opens the pause menu. A load or request that fails shows a Portuguese error line and leaves the screen and the bag as they were. The skill bar is not click-through: a click on a slot must not reach the canvas and hit the monster, and it does nothing else (the skills are executed by a later feature).

**Skills are always visible.** The hero detail (catalog) and the bag entry show the three skills with art, name, type, effect and cooldown whether the hero is owned or not; skills above the hero's stars are marked locked.

**Drops.** The 10 s tick that flushes the outcome queue brings the `drop` of each accepted report; `ClickerGame` adds the card to the bag and shows the notice for 3 s. A drop therefore appears up to 10 s after the kill that earned it.

**Farm mode.** `ClickerGame.startFarm(boss)` fights a beaten boss with the numbers and time limit of the campaign, tagged `FARM`. A win is one `POST /farm/outcome` (not queued: the backend spaces farm wins by 5 s and a queue would break that), then the same boss comes back. A timeout restarts the same boss with no request. A farm fight never touches the campaign position or its report queue and drops no coins. The farm ends on Leave fight (back to the campaign position), on the chapter boss win that leaves 0 wins today (the farm list opens showing 0 left) and on a 409 refusal (the farm state reloads). A network failure loses that win and the loop continues. A realignment of the campaign during a farm fight is applied when the farm ends.

**Registration.** The sign-up form shows three choices (Fogo - Kael, Água - Orina, Natureza - Lyra) with the hero portrait; no choice shows `Escolha seu herói inicial.` and sends no request.

**Art.** `art/*.jpg` for the 20 images used are copied unchanged to `public/assets/heroes/` and loaded by file name through `<img>`. They are about 2.3 MB each (46 MB together) and have a magenta background; resizing them and making the background transparent is out of scope and prepared files can replace them under the same names.

**Fake backend.** `e2e/support/fakeBackend.js` serves the same contract (registration with `startingElement`, `/heroes`, `/leader`, `/farm`, and `drop` in outcome responses) with options `cards`, `chances` and `farmMinIntervalMs`, and the routes `**/api/heroes`, `**/api/heroes/**`, `**/api/leader`, `**/api/farm`, `**/api/farm/**` (exact paths, because `**/api/heroes**` would also catch Vite's module request for `heroesApi.js`).

## Consequences

- The scene stays the combat scene: panels, bar and notice live in `HeroUi`, and the scene adds `pauseForMenu`, `resumeFromMenu`, `startFarm`, `receiveDrop` and the farm branches.
- A page of 20 large images makes the first open of a screen slower; this goes away when the prepared images replace them.
- The text that existed before this feature is English (the auth forms, the pause menu, the wallet, the stage HUD and messages). It is technical debt TD-001 in `.specs/features/characters/spec.md`; there is no translation layer yet.
- The old `Farm boss` checkbox (replay the current campaign boss without reporting a win) still exists; it gives no cards because nothing is reported.

## Alternatives considered

- Hero screens as Phaser scenes: rejected; DOM is testable with Playwright locators like the rest of the HUD (ADR 0004 of the game) and styled with CSS.
- Putting the buttons in the pause menu: rejected by the owner, it is not intuitive.
- Queuing farm wins like the outcome reports: rejected; the 5 s spacing would refuse most of a queue.
- Polling `GET /heroes` after every fight to find drops: rejected; the outcome response already carries the card.
