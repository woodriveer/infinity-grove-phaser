# Combat HUD Specification

## Problem Statement

The combat screen does not tell the player which chapter they are in, how much health the monster has left, which element beats which, or what a skill does once it is running; and the Equipamento button does not signal a newly dropped piece (the 3 s notice already works). This feature adds those readings, the skill keys and the red dot, all in the browser (no backend change).

## Goals

- [ ] The player always reads the chapter number on the combat screen.
- [ ] The monster health bar reads `HP <left>/<max>`.
- [ ] The element rules (fire > nature > water > fire, double damage) are on screen as a CSS drawing.
- [ ] Hovering a skill slot or a running effect shows the skill card of the hero screens.
- [ ] The keys Q, W and E use the leader's skills 1, 2 and 3, and each slot shows its key.
- [ ] A dropped piece of equipment keeps its 3 s notice and also lights a red dot on the Equipamento button until the player opens it.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Translating the existing English HUD text (`Stage 1/10  Phase 2/5`, `Time:`) | TD-001 (AD-007) |
| Touch or keyboard-focus tooltips | The game is played with a mouse |
| Showing the element of the player's own attack on the wheel | Not asked; the hero screens show elements |
| Backend changes | All data is already in the game |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Where the chapter shows | Its own pill `Capítulo <n>` (`data-testid="chapter-hud"`) at the top left, in the row of the stage and wallet pills | Free spot; the stage pill keeps its English text (TD-001) | n |
| Chapter total | Not shown (`Capítulo 2`, not `2 de 5`) | The game has no chapter count in its payload; a constant would duplicate a backend rule | n |
| HP text rounding | Health left is rounded UP to one decimal, no trailing zero; max is shown as it is | A monster with 0.04 left must not read `HP 0` while alive | n |
| HP text place | Centered on the health bar, same width as the bar | "Na barra de HP" (user) | y |
| Element wheel | Always visible, static, click-through, on the left side between the top row and the battle bar; shows the triad with `x2` arrows and the Luz/Escuridão pair with `x1,8` | "Em algum lugar da tela apresentar a lógica de elementos" (user) | n |
| Wheel numbers | Read from `elementMultiplier`, never typed twice | One source of truth for the table | n |
| What "skill ativa" means | The tooltip shows on every slot of the skill bar (liberada or bloqueada) and on every running effect tag | The user's words fit both readings (unlocked skill, running skill) | n |
| Tooltip content | The same card as the hero screen skill row: art, name, type, effect, `Recarga: <n>s`, `Liberada` or `Bloqueada` | "Do mesmo jeito que é quando vou em heróis/skill" (user) | y |
| Effect tag of a former leader | Shows the card of the hero that owns the skill | Effects survive a leader change (hero-skills) | n |
| Drop notice | Already works (user confirmed); it stays as it is and only gets a regression test | The first reading of the request was wrong | y |
| Skill keys | Q, W, E use slots 1, 2, 3 and are added to the existing keys 1, 2, 3, which keep working; each slot shows its keys as `Q` / `W` / `E` (`data-testid="skill-key-<slot>"`) | "Q W E por exemplo" (user); keeping 1-3 breaks nothing | n |
| Keys vs pause menu | The pause menu has no key handler (its `1.` and `2.` are labels of the buttons); Q, W, E and 1, 2, 3 do nothing while it is open | Same guard as the skill keys; the first reading of the pause menu was wrong (Verifier G7) | n |
| Equipment badge | A red dot on the Equipamento button while a dropped piece has not been looked at, like the bag badge for cards | The user asked for "a notificação" of a new item | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Chapter and monster health ⭐ MVP

**User Story**: As a player, I want to read my chapter and the monster's health left so that I know where I am and how close the kill is.

**Why P1**: Two direct requests, both one-line readings.

**Acceptance Criteria**:

1. WHILE a campaign or farm encounter is on screen the game SHALL show `Capítulo <n>` with the chapter number of the player's position.  <!-- state-driven -->
2. WHEN the next chapter opens THEN the game SHALL show `Capítulo <n+1>`.  <!-- event-driven -->
3. WHILE a monster is on screen the game SHALL show `HP <left>/<max>` on its health bar, with `<left>` rounded up to one decimal without a trailing zero.  <!-- state-driven -->
4. WHEN a click, a skill hit or a damage tick lands THEN the game SHALL update the text in the same frame as the bar.  <!-- event-driven -->
5. WHEN a monster with 30 health takes 20 damage THEN the game SHALL show `HP 10/30`.  <!-- event-driven -->
6. WHEN a monster with 10 health has 0.04 left THEN the game SHALL show `HP 0.1/10`.  <!-- event-driven -->
7. WHEN a new monster spawns THEN the game SHALL show `HP <max>/<max>`.  <!-- event-driven -->
8. WHEN the chapter is complete and no monster is on screen THEN the game SHALL hide the HP text.  <!-- event-driven -->

**Independent Test**: Start the fake backend at chapter 2, read `Capítulo 2`, click a 30-health boss until 20 damage landed and read `HP 10/30`.

---

### P1: Element wheel ⭐ MVP

**User Story**: As a player, I want the element rules drawn on the screen so that I pick the leader that hits the monster hardest.

**Why P1**: The element matters in every hit and is only discoverable by reading numbers today.

**Acceptance Criteria**:

1. The combat screen SHALL show a CSS drawing of the five elements (`data-testid="element-wheel"`) with Fogo, Natureza and Água as a triangle of arrows Fogo to Natureza, Natureza to Água and Água to Fogo.  <!-- ubiquitous -->
2. The drawing SHALL label each triangle arrow `x2`, the value of `elementMultiplier(attacker, defender)` for that pair.  <!-- ubiquitous -->
3. The drawing SHALL show Luz and Escuridão as a pair labelled `x1,8` against the triad and `x0,9` between themselves, the values of `elementMultiplier`.  <!-- ubiquitous -->
4. The drawing SHALL carry a line of text `Fogo vence Natureza, Natureza vence Água, Água vence Fogo: dano em dobro`.  <!-- ubiquitous -->
5. The drawing SHALL not block clicks on the monster, the skill bar or the hero buttons.  <!-- ubiquitous -->
6. WHILE the pause menu or a hero screen is open the drawing SHALL stay visible under it.  <!-- state-driven -->

**Independent Test**: Open the combat screen and read the five labels, the arrows and the three multipliers; click through the drawing onto the monster.

---

### P2: Skill tooltip

**User Story**: As a player, I want to see what a skill does without leaving the fight so that I use it well.

**Why P2**: Useful, but the heroes screen already has the same text.

**Acceptance Criteria**:

1. WHEN the pointer enters a slot of the skill bar THEN the game SHALL show a tooltip (`data-testid="skill-tooltip"`) with the skill's art, name, type, effect, `Recarga: <n>s` and `Liberada` or `Bloqueada`.  <!-- event-driven -->
2. WHEN the pointer leaves the slot THEN the game SHALL hide the tooltip.  <!-- event-driven -->
3. WHEN the pointer enters an effect tag THEN the game SHALL show the same tooltip for the skill that started the effect.  <!-- event-driven -->
4. The tooltip SHALL carry the same texts as `renderSkillRow` for the same skill.  <!-- ubiquitous -->
5. The tooltip SHALL not change what a click on the slot does.  <!-- ubiquitous -->
6. IF the heroes have not loaded THEN the game SHALL show no tooltip.  <!-- unwanted-behavior -->
7. WHEN the effect tag disappears while the tooltip is open THEN the game SHALL hide the tooltip.  <!-- event-driven -->

**Independent Test**: In the browser, hover slot 2 of the Kael leader and read `Investida do Baluarte`, its effect and `Recarga: 25s`; use Brado Aterrador, hover its tag and read the same card.

---

### P2: Skill keys Q, W, E

**User Story**: As a player, I want to fire skills with Q, W and E so that my hand stays on the left of the keyboard.

**Why P2**: A direct request; the skills already work by click and by keys 1 to 3.

**Acceptance Criteria**:

1. WHEN the player presses Q, W or E under the conditions of a slot click THEN the game SHALL use the skill of slot 1, 2 or 3 as if its slot was clicked.  <!-- event-driven -->
2. IF the slot is locked, cooling, the fight is paused, a hero screen is open, the pause menu is open or no living monster is on screen THEN the game SHALL leave the fight and the cooldown unchanged.  <!-- unwanted-behavior -->
3. The keys 1, 2 and 3 SHALL keep using slots 1, 2 and 3.  <!-- ubiquitous -->
4. Each slot of the skill bar SHALL show its key letter: `Q`, `W` and `E`.  <!-- ubiquitous -->
5. WHEN the player holds a key THEN the game SHALL use the skill once, not on each key repeat.  <!-- event-driven -->
6. IF the heroes have not loaded or the leader has 0 stars THEN the game SHALL ignore Q, W and E.  <!-- unwanted-behavior -->

**Independent Test**: Lead with Kael with 1 star, press Q on a phase monster and read the slot counting down from `20s`; press Q again and nothing happens.

---

### P2: Equipment red dot

**User Story**: As a player, I want a red dot on the Equipamento button when a new piece drops so that I know there is something to look at.

**Why P2**: A direct request; the 3 s notice is easy to miss.

**Acceptance Criteria**:

1. WHEN the backend drops a piece for a won boss THEN the game SHALL keep showing the notice `Equipamento encontrado: <Raridade> <Peça>` for 3 s as today.  <!-- event-driven -->
2. WHEN a piece drops THEN the game SHALL show a red dot (`data-testid="equipment-badge"`) on the Equipamento button.  <!-- event-driven -->
3. WHEN the player opens the Equipamento screen THEN the game SHALL hide the red dot.  <!-- event-driven -->
4. WHEN a piece drops while the Equipamento screen is open THEN the game SHALL not show the red dot.  <!-- event-driven -->
5. WHEN a card and a piece drop together THEN the game SHALL show the notice of the piece for 3 s after the card's, the later replacing the earlier as today.  <!-- event-driven -->

**Independent Test**: Win a miniboss against the fake backend that drops a Rare weapon; read the notice on screen, the red dot, open Equipamento and see the dot gone.

---

## Edge Cases

- IF the monster has fractional health from a skill tick THEN the game SHALL show it rounded up to one decimal.
- WHEN the player has no heroes loaded THEN the game SHALL still show the chapter and the HP text.
- WHEN a piece is sold on arrival because the bag is full THEN the game SHALL show no red dot.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| HUD-01 | P1: chapter pill (AC 1-2) | Done | Verified |
| HUD-02 | P1: HP text (AC 3-8) | Done | Verified |
| HUD-03 | P1: element wheel (AC 1-6) | Done | Verified |
| HUD-04 | P2: skill tooltip (AC 1-7) | Done | Verified |
| HUD-05 | P2: red dot on Equipamento, notice kept (AC 1-5) | Done | Verified |
| HUD-06 | P2: skill keys Q, W, E (AC 1-6) | Done | Verified |

**Coverage:** 6 total, 6 mapped to commits, 0 unmapped

---

## Success Criteria

- [ ] An e2e test reads `Capítulo`, `HP` and the wheel on the real page.
- [ ] An e2e test proves the red dot shows on a drop and clears when Equipamento opens.
- [ ] No backend file changes.
