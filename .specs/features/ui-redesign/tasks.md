# UI Redesign (Grove Theme) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/ui-redesign/spec.md`
**Design**: `.specs/features/ui-redesign/design.md`
**Reference image**: `.specs/features/ui-redesign/reference.jpg` (look at it before any CSS task)
**Status**: Approved by the owner on 2026-11-12, defaults of Q2 to Q5 accepted (Q1 decided as D1 on 2026-11-12: round auto click button, its window and the key `A`, tasks T13 to T16; written with the defaults of the open Q2 to Q5). T1 to T30 done. Phase 10 (T31 to T38, fixes of the T30 review) added on 2026-11-13, waiting for the owner's approval

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root.
- This project has a knowledge graph: run `graphify query "<question>"` before your first search in the code, and read only the lines it or this task points to. After the commit, run `graphify update .` (never commit `graphify-out/`).
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds unrelated uncommitted files (`graphify-out/`, `.claude/skills/`, `.agents/`, `CLAUDE.md`, `GEMINI.md`). If a file you must change already shows as modified in `git status` before you start, STOP and report it.
- Mark the task `[x]` in this file in the same commit. Push right after the commit (`CLAUDE.md`).
- **CSS edits** use this vocabulary. *Set `p: v`* = replace the declaration of property `p` in that rule if it exists, else add it as the last declaration of the rule. *Remove `p`* = delete that declaration. *Replace the rule* = replace the whole block from the selector line to its closing brace. Never touch a rule the task does not name. Selectors are quoted exactly as they appear in `game/public/style.css`; when a selector appears in two rules, the task says which one (first or second).
- Never change player text, a `data-testid`, a class name the tests read, or a scene coordinate, unless the task says so.
- A test that pinned an old colour or font is updated to the new spec value and renamed after the new look, exactly as the task says. Never delete or weaken any other test to pass a gate.
- **Phase gate**: the last task of every phase also runs `cd game && npm test && npx playwright test`; every suite must pass unchanged.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit for domain and views, e2e for every player-visible behaviour; `ui:shots` for the ui-artist), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), `game/ui-review.config.js`. No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Game domain (`elements.js`) | unit | Every element and the unknown element of `weaknessOf` | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game scenes (`ClickerGame.js`, `MainMenu.js`, `Preloader.js`) | unit (jsdom) | Every new constant, attribute and property of the spec, with the exact spec value | `game/src/adapters/phaser/*.test.js` | `cd game && npm test` |
| Game CSS and `index.html` | none | Build gate; the computed values are asserted by the e2e of T28 and reviewed by T30 | `game/public/style.css`, `game/index.html` | `cd game && npm test && npm run build` |
| Art tool (`art/tools/cutout_hero.py`) and the 15 images | none (no Python test harness) | An output check command in the gate of T4 and T5 asserts both modes of the tool and every file | `art/tools/`, `game/public/assets/heroes/` | the command in each task's Gate |
| e2e | e2e (Playwright, fake backend) | Every acceptance criterion of UIR-01 to UIR-16 and UIR-19 that the browser can observe, and every spec edge case | `game/e2e/uiRedesign.spec.js` | `cd game && npx playwright test e2e/uiRedesign.spec.js` |
| Review screenshots | none | Every file of design § Review Screenshots on both projects | `game/ui-review/uiRedesign.shots.js` | `cd game && npm run ui:shots -- uiRedesign` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After a game task with unit tests | `cd game && npm test` |
| Build | After a CSS or HTML task | `cd game && npm test && npm run build` |
| Full | Last task of each phase, and the e2e task | `cd game && npm test && npx playwright test` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every task of Phases 1 to 7 is `game-dev` except T15 (`test-engineer`); Phase 8 is `test-engineer`; Phase 9 is `ui-artist`. Phase 10 fixes the findings of the T30 review: T31 to T36 `game-dev`, T37 `test-engineer`, T38 `ui-artist`.

### Phase 1: Foundation

```
T1 → T2 → T3
```

### Phase 2: Skill thumbnails

```
T3 → T4 → T5
```

### Phase 3: Battle HUD, top and enemy

```
T5 → T6 → T7 → T8 → T9 → T10 → T11
```

### Phase 4: Battle controls and overlays

```
T11 → T12 → T13 → T14 → T15 → T16 → T17
```

### Phase 5: Main menu and preloader

```
T17 → T18 → T19 → T20
```

### Phase 6: Hero screens

```
T20 → T21 → T22 → T23 → T24 → T25 → T26
```

### Phase 7: Art prompts

```
T26 → T27
```

### Phase 8: Browser tests and screenshots

```
T27 → T28 → T29
```

### Phase 9: Visual review

```
T29 → T30
```

### Phase 10: Review fixes

```
T30 → T31 → T32 → T33 → T34 → T35 → T36 → T37 → T38
```

---

## Task Breakdown

### T1: Load Cinzel and drop Caprasimo [x]

**Owner**: game-dev
**What**: The page loads Cinzel 700 and Figtree 400, 600, 700, 800 instead of Caprasimo and Figtree (UIR-01 AC 1).
**Where**: `game/index.html`
**Read first**: `game/index.html:6-10`
**Depends on**: None
**Requirement**: UIR-01

**Contract**: the `<link rel="stylesheet">` of Google Fonts (line 9) becomes exactly:

```html
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Figtree:wght@400;600;700;800&display=swap">
```

The two `preconnect` links and the `/style.css` link stay.

**Steps**:

1. Replace the `href` of that link.

**Tests**: none - static HTML; T28 asserts that Cinzel loads and Caprasimo is never requested.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] `grep -c Caprasimo game/index.html` prints `0` and `grep -c "family=Cinzel:wght@700" game/index.html` prints `1`.
- [ ] The build passes.

**Commit**: `style(game): load the Cinzel heading font`

---

### T2: Grove tokens, letterbox and focus ring [x]

**Owner**: game-dev
**What**: The palette, re-mapped tokens, recipe tokens, letterbox colour and focus ring of the design (UIR-01 AC 2 to 6, UIR-03 AC 13).
**Where**: `game/public/style.css`
**Read first**: `game/public/style.css:1-81`; design § Palette and § Recipes
**Depends on**: T1
**Requirement**: UIR-01, UIR-03

**Contract**:

1. Replace the comment of lines 1-2 with:

```css
/* Infinity Grove: the Grove look of spec ui-redesign. Parchment panels and dark wood frames with bronze rings over the forest,
   Cinzel for headings and numbers, Figtree for text, ember for actions. Panels and frames read the recipe tokens of :root. */
```

2. In `:root`, set these existing tokens (every other existing token keeps its value):

```css
    --color-bg: #f4e6c8;
    --color-surface: #e6d0a2;
    --color-text: #2a1a10;
    --color-accent: #a8431a;
    --color-divider: color-mix(in srgb, #2a1a10 22%, transparent);
    --color-neutral-600: #5f5244;
    --color-neutral-700: #574b3e;
    --color-accent-2-700: #4a5636;
    --font-heading: "Cinzel", Georgia, serif;
    --radius-md: 8px;
    --radius-lg: 12px;
    --shadow-md: 0 3px 10px rgb(0 0 0 / 0.35);
    --shadow-lg: 0 10px 28px rgb(0 0 0 / 0.5);
```

3. At the end of `:root` (after `--shadow-lg`), add:

```css

    /* ══ Grove palette (spec ui-redesign) ══ */
    --wood-900: #1c120c;
    --wood-800: #2b1d14;
    --wood-700: #3d2a1c;
    --wood-600: #5a3d26;
    --bronze-500: #b07a3a;
    --gold-400: #e0b45a;
    --gold-200: #f3d58a;
    --parchment-100: #f4e6c8;
    --parchment-200: #ead6ad;
    --parchment-300: #e6d0a2;
    --ink-900: #2a1a10;
    --ink-600: #6b4a2b;
    --ember-500: #e8742a;
    --ember-700: #a8431a;
    --ember-800: #8a3510;
    --color-focus: #cc4e1a;

    /* ══ Grove theme recipes: a rule applies one by writing its declarations (design.md § Recipes) ══ */
    /* Painted textures: none until the art exists; one line turns each on (PROMPTS_ASSETS_UI.md, section 5) */
    --texture-parchment: none;
    --texture-wood: none;

    /* Parchment panel: windows, plaques, rail, bars, cards that float */
    --panel-bg: var(--texture-parchment), radial-gradient(ellipse at 50% 40%, var(--parchment-100) 0%, var(--parchment-200) 62%, var(--parchment-300) 100%);
    --panel-border: 3px solid var(--wood-600);
    --panel-shadow: 0 0 0 2px var(--bronze-500), inset 0 0 22px rgb(138 90 43 / 0.45), 0 10px 28px rgb(0 0 0 / 0.55);

    /* Dark wood frame: leader card, rail buttons, timer, notice, tiles */
    --frame-bg: var(--texture-wood), linear-gradient(180deg, var(--wood-700) 0%, var(--wood-800) 55%, var(--wood-900) 100%);
    --frame-border: 2px solid var(--bronze-500);
    --frame-shadow: inset 0 0 0 1px rgb(243 213 138 / 0.25), 0 0 0 2px var(--wood-900), 0 8px 20px rgb(0 0 0 / 0.5);

    /* Buttons: wood (secondary) and ember (primary) pills */
    --btn-bg: linear-gradient(180deg, var(--wood-600) 0%, var(--wood-800) 100%);
    --btn-primary-bg: linear-gradient(180deg, var(--ember-700) 0%, #7a2e0c 100%);
    --btn-shadow: inset 0 1px 0 rgb(243 213 138 / 0.35), 0 2px 0 var(--wood-900), 0 4px 10px rgb(0 0 0 / 0.4);

    /* Chip: enemy tags, effect tags, weak element */
    --chip-bg: rgb(28 18 12 / 0.85);

    /* Inset card inside a parchment panel */
    --inset-border: 1px solid rgb(90 61 38 / 0.45);
```

4. In `body`: set `background-color: var(--wood-900);`.
5. In `:focus-visible`: set `outline: 3px solid var(--color-focus);` and keep `outline-offset: 2px;`.

**Steps**:

1. Edit the header comment.
2. Set the 13 existing tokens.
3. Append the new tokens.
4. Edit `body` and `:focus-visible`.

**Tests**: none - CSS; T28 asserts the letterbox, the tokens through computed colours, the texture tokens and the focus ring.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] `grep -c "Caprasimo" game/public/style.css` prints `0`.
- [ ] `grep -c -- "--texture-parchment: none;" game/public/style.css` prints `1`.
- [ ] The build and the whole Vitest suite pass.

**Commit**: `style(game): add the grove palette and recipe tokens`

---

### T3: Wood and ember buttons, chips and metallic coins [x]

**Owner**: game-dev
**What**: The shared button groups, tags and coin discs in the Grove recipes (UIR-02 AC 7 to 12).
**Where**: `game/public/style.css` (section `/* — shared controls — */`, lines 83-216)
**Read first**: `game/public/style.css:83-216`; design § Recipes
**Depends on**: T2
**Requirement**: UIR-02

**Contract**: replace everything from the line `/* — shared controls — */` up to the line before `/* ══ 01 · Main menu` with:

```css
/* — shared controls: wood pills (secondary) and ember pills (primary), spec ui-redesign — */

.btn,
.auth-actions button,
.logout,
.path-back,
.pause-menu button,
.reset-card button,
.hero-header button,
.bag-fuse,
.fusion-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    font-family: var(--font-heading);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--parchment-100);
    background: var(--btn-bg);
    background-color: var(--wood-800);
    border: 2px solid var(--bronze-500);
    border-radius: 999px;
    box-shadow: var(--btn-shadow);
    cursor: pointer;
}

/* The primary action: an ember pill with a gold rim */
.auth-actions button[name="login"],
.pause-menu .pause-continue,
.pause-menu .pause-confirm-no,
.reset-card .reset-cancel,
.bag-fuse,
.fusion-button {
    color: var(--parchment-100);
    background: var(--btn-primary-bg);
    background-color: var(--ember-700);
    border-color: var(--gold-400);
    box-shadow: var(--btn-shadow);
}

/* Every wood or ember button brightens under the pointer and darkens while pressed; no transition (spec ui-redesign UIR-03) */
.btn:hover:not(:disabled),
.auth-actions button:hover:not(:disabled),
.logout:hover:not(:disabled),
.path-back:hover:not(:disabled),
.pause-menu button:hover:not(:disabled),
.reset-card button:hover:not(:disabled),
.hero-header button:hover:not(:disabled),
.bag-fuse:hover:not(:disabled),
.fusion-button:hover:not(:disabled),
.equip-button:hover:not(:disabled),
.bulk-sell-yes:hover:not(:disabled),
.auto-click-upgrade:hover:not(:disabled),
.reset-account:hover:not(:disabled) {
    filter: brightness(1.15);
}

.btn:active:not(:disabled),
.auth-actions button:active:not(:disabled),
.logout:active:not(:disabled),
.path-back:active:not(:disabled),
.pause-menu button:active:not(:disabled),
.reset-card button:active:not(:disabled),
.hero-header button:active:not(:disabled),
.bag-fuse:active:not(:disabled),
.fusion-button:active:not(:disabled),
.equip-button:active:not(:disabled),
.bulk-sell-yes:active:not(:disabled),
.auto-click-upgrade:active:not(:disabled),
.reset-account:active:not(:disabled) {
    filter: brightness(0.9);
}

button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.auth-actions button:disabled,
.logout:disabled {
    cursor: wait;
}

/* A dark chip: enemy tags, effect tags and the tags of the hero screens */
.tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 999px;
    color: var(--parchment-100);
    background: var(--chip-bg);
    border: 1px solid var(--bronze-500);
}

.tag-effect {
    position: relative;
    pointer-events: auto;
    color: var(--parchment-100);
    background: var(--frame-bg);
    background-color: var(--wood-800);
    border-color: var(--gold-400);
    box-shadow: var(--shadow-lg);
}

/* Text that is read by assistive tech and the tests but drawn as an icon */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

/* The coins: gold, silver and copper discs with a metal shine */
.coin::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: 7px;
    vertical-align: -3px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--wood-900), inset 0 -2px 0 rgb(0 0 0 / 0.3);
}

.coin-gold::before {
    background: radial-gradient(circle at 35% 30%, #fff1b0, #e0b45a 55%, #8a5a12);
}

.coin-silver::before {
    background: radial-gradient(circle at 35% 30%, #ffffff, #c9ccd1 55%, #6f747b);
}

.coin-copper::before {
    background: radial-gradient(circle at 35% 30%, #f6c08f, #b8652d 55%, #5e2c10);
}
```

The old `.tag-element` rule is gone on purpose: the element chip gets its dot in T9.

**Steps**:

1. Replace the section.

**Tests**: none - CSS; T28 asserts the button, chip and coin values.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] `grep -c "var(--btn-primary-bg)" game/public/style.css` prints `1`.
- [ ] The build passes.

**Commit**: `style(game): draw buttons, chips and coins in the grove look`

---

### T4: Flatten a cutout onto a background colour [x]

**Owner**: game-dev
**What**: `art/tools/cutout_hero.py` gains `--background <hex>`: the cutout is flattened onto that colour, keeps its whole frame and is saved as a JPEG at quality 88; without the flag the tool behaves as today (UIR-16 AC 4, 5).
**Where**: `art/tools/cutout_hero.py`
**Read first**: `art/tools/cutout_hero.py:1-70` (all of it); design § Skill thumbnails
**Depends on**: T3
**Requirement**: UIR-16

**Contract**:

1. Import line: `from PIL import Image, ImageColor`.
2. Docstring: after the first usage line add a second one:

```
    python art/tools/cutout_hero.py art/lyra_double_shot.jpg game/public/assets/heroes/lyra_double_shot.jpg --height 512 --background 1c120c
```

and the sentence `With --background the cutout is flattened onto that colour and keeps its whole frame (skill thumbnails, saved as JPEG).`

3. `main()` becomes:

```python
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('target')
    parser.add_argument('--height', type=int, default=720)
    parser.add_argument('--background', help='hex colour such as 1c120c: flatten onto it, keep the whole frame, save a JPEG')
    args = parser.parse_args()

    hero = cutout(Image.open(args.source))

    if args.background:
        #  A skill thumbnail keeps its frame (object-fit: cover crops it on screen) and a JPEG has no alpha
        backdrop = Image.new('RGBA', hero.size, (*ImageColor.getrgb(f'#{args.background}'), 255))
        hero = Image.alpha_composite(backdrop, hero).convert('RGB')
    else:
        hero = crop(hero)

    width = round(hero.width * args.height / hero.height)
    hero = hero.resize((width, args.height), Image.LANCZOS)
    hero.save(args.target, optimize=True, **({ 'quality': 88 } if args.background else {}))

    print(f'{args.target}: {hero.width}x{hero.height}')
```

`cutout()`, `crop()`, `KEEP`, `DROP` and `MARGIN` do not change.

**Steps**:

1. Edit the import, the docstring and `main()`.
2. Run the gate.

**Tests**: none - no Python test harness in the repository; the gate command checks both modes on a real source.
**Gate**: run from the repository root:

```bash
OUT=$(mktemp -d) && python art/tools/cutout_hero.py art/lyra_double_shot.jpg "$OUT/cut.png" --height 256 && python art/tools/cutout_hero.py art/lyra_double_shot.jpg "$OUT/thumb.jpg" --height 256 --background 1c120c && python -I -c "
import sys
from PIL import Image
cut, thumb = Image.open(sys.argv[1]), Image.open(sys.argv[2])
assert cut.mode == 'RGBA' and cut.getpixel((0, 0))[3] == 0, ('cut', cut.mode, cut.getpixel((0, 0)))
assert thumb.mode == 'RGB' and thumb.size == (256, 256), ('thumb', thumb.mode, thumb.size)
assert all(abs(c - t) <= 12 for c, t in zip(thumb.getpixel((2, 2)), (28, 18, 12))), thumb.getpixel((2, 2))
print('ok')
" "$OUT/cut.png" "$OUT/thumb.jpg"
```

**Done when**:

- [ ] The gate prints `ok`.
- [ ] `git diff --stat` shows only `art/tools/cutout_hero.py` and this file.

**Commit**: `feat(art): flatten a cutout onto a background colour for thumbnails`

---

### T5: Re-cut the 15 skill thumbnails on dark wood [x]

**Owner**: game-dev
**What**: The 15 skill images in `game/public/assets/heroes/` are regenerated from `art/` with the T4 flag, same names, `.jpg`, 512 px tall, on `#1c120c` (UIR-16 AC 1, 2).
**Where**: `game/public/assets/heroes/` (the 15 skill images of the list below; `kael_screen.jpg` is Brado Aterrador, a skill image)
**Read first**: design § Skill thumbnails; spec P1 "Skill thumbnails without magenta"
**Depends on**: T4
**Requirement**: UIR-16

**Contract**: the 15 names, in this exact list:

```
kael_dimensional_cut kael_charge kael_screen lyra_double_shot lyra_focused_shot lyra_rapid_wind orina_grasp_prision orina_tempest orina_meteor_storm seraphine_blessing seraphine_holy_light seraphine_bell_ringing vex_poison_bomb vex_smoke_bomb vex_bleeding_blow
```

Do not touch `kael_position.jpg`, `lyra_position.jpg`, `orina_position.jpg`, `seraphine_position.jpg`, `vex_position.jpg`, any `*_sprite.png`, `kael_rig.*`, or anything in `art/`.

**Steps**:

1. From the repository root run:

```bash
for name in kael_dimensional_cut kael_charge kael_screen lyra_double_shot lyra_focused_shot lyra_rapid_wind orina_grasp_prision orina_tempest orina_meteor_storm seraphine_blessing seraphine_holy_light seraphine_bell_ringing vex_poison_bomb vex_smoke_bomb vex_bleeding_blow; do python art/tools/cutout_hero.py "art/$name.jpg" "game/public/assets/heroes/$name.jpg" --height 512 --background 1c120c || exit 1; done
```

2. Run the gate.
3. Stage the 15 files by path.

**Tests**: none - binary assets; the gate checks every file, and T28 checks them in the browser on every screen.
**Gate**: from the repository root:

```bash
python -I -c "
import os
from PIL import Image
names = 'kael_dimensional_cut kael_charge kael_screen lyra_double_shot lyra_focused_shot lyra_rapid_wind orina_grasp_prision orina_tempest orina_meteor_storm seraphine_blessing seraphine_holy_light seraphine_bell_ringing vex_poison_bomb vex_smoke_bomb vex_bleeding_blow'.split()
total = 0
for name in names:
    path = f'game/public/assets/heroes/{name}.jpg'
    image, source = Image.open(path), Image.open(f'art/{name}.jpg')
    assert image.format == 'JPEG' and image.mode == 'RGB' and image.height == 512, (name, image.format, image.mode, image.size)
    assert abs(image.width - round(source.width * 512 / source.height)) <= 1, (name, image.size, source.size)
    assert all(abs(c - t) <= 12 for c, t in zip(image.getpixel((2, 2)), (28, 18, 12))), (name, image.getpixel((2, 2)))
    pixels = list(image.getdata())
    magenta = sum(1 for r, g, b in pixels if min(r, b) - g >= 110) / len(pixels)
    assert magenta <= 0.001, (name, magenta)
    total += os.path.getsize(path)
assert total < 2_000_000, total
print('ok', total)
" && cd game && npx playwright test e2e/heroes.spec.js e2e/skills.spec.js e2e/heroAscension.spec.js
```

**Done when**:

- [ ] The check prints `ok` and a total under 2 000 000 bytes.
- [ ] The three e2e suites pass unchanged.
- [ ] `git diff --stat` lists exactly the 15 `.jpg` files and this file.

**Commit**: `fix(game): cut the magenta out of the skill thumbnails`

---

### T6: Plaque, tag, scroll, combo, message and notice [x]

**Owner**: game-dev
**What**: The top HUD texts and the notice in the Grove recipes (UIR-04 AC 1 to 6).
**Where**: `game/public/style.css` (section `/* ══ 02 · Battle ══ */`)
**Read first**: `game/public/style.css:490-536` (`.stage-hud, .wallet`, `.chapter-hud`, `.combo-hud`), `:595-604` (`.stage-message`), `:967-976` (`.card-notice`); `reference.jpg` top row
**Depends on**: T5
**Requirement**: UIR-04

**Contract** (vocabulary of the rules above; every other declaration of these rules stays):

| Rule | Set | Remove |
| --- | --- | --- |
| `.stage-hud,` `.wallet` (the group) | `padding: 10px 22px;` `font-weight: 700;` `color: var(--ink-900);` `border-radius: 6px;` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` | - |
| `.chapter-hud` | `padding: 5px 14px;` `font-weight: 700;` `color: var(--ink-900);` `border-radius: 4px;` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: 2px solid var(--wood-600);` `box-shadow: 0 0 0 1px var(--bronze-500), var(--shadow-lg);` | - |
| `.combo-hud` | `font-weight: 700;` `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-800);` `border: 2px solid var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |
| `.stage-message` | `font-weight: 700;` `color: #ffd35c;` `-webkit-text-stroke: 10px #2a1408;` | - |
| `.card-notice` | `font-size: 22px;` `font-weight: 700;` `color: var(--gold-200);` `border-radius: 6px;` `background: var(--frame-bg);` `background-color: var(--wood-800);` `border: var(--frame-border);` `box-shadow: var(--frame-shadow);` | - |

Write `background` before `background-color` in each rule (the shorthand resets the colour).

**Steps**:

1. Edit the five rules.

**Tests**: none - CSS; T28 asserts every value of UIR-04 AC 1 to 6.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] The build passes; no scene coordinate in `ClickerGame.js` or `HeroUi.js` changed (`git diff --stat` lists only `style.css` and this file).

**Commit**: `style(game): draw the battle plaques, combo and notice in the grove look`

---

### T7: Boss timer ring [x]

**Owner**: game-dev
**What**: The timer carries `--timer-left` and draws as a dark pill led by a 32 px ring (UIR-06).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `ClickerGame.js:710-719` (`showCountdown`, `hideCountdown`); `game/src/domain/campaign/bossCountdown.js`; `ClickerGame.test.js:1094-1182` (helpers `killAll`, `advance`, `timer`, `bossStart`, and the countdown tests); `style.css:549-562` (`.boss-timer`)
**Depends on**: T6
**Requirement**: UIR-06

**Contract**:

```js
    showCountdown ()
    {
        this.bossTimer.textContent = `Time: ${this.countdown.seconds}`;
        //  The ring of the timer fills with the share of the time left, 3 decimals (spec ui-redesign UIR-06)
        this.bossTimer.style.setProperty('--timer-left', Math.min(1, Math.max(0, this.countdown.remainingMs / this.countdown.limitMs)).toFixed(3));
    }

    hideCountdown ()
    {
        this.countdown = null;
        this.bossTimer.textContent = '';
        this.bossTimer.style.removeProperty('--timer-left');
    }
```

CSS: replace the rule `.boss-timer` and add `.boss-timer::before` right after it (the `.boss-timer:empty` rule stays):

```css
.boss-timer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 18px 6px 6px;
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: 700;
    color: var(--gold-200);
    white-space: pre;
    border-radius: 999px;
    background: var(--frame-bg);
    background-color: var(--wood-800);
    border: var(--frame-border);
    box-shadow: var(--frame-shadow);
}

/* The ring: the share of the time left in ember, set by ClickerGame as --timer-left (spec ui-redesign UIR-06) */
.boss-timer::before {
    content: '';
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background:
        radial-gradient(circle, var(--wood-900) 0 52%, transparent 54%),
        conic-gradient(var(--ember-500) calc(var(--timer-left, 1) * 360deg), rgb(244 230 200 / 0.18) 0);
}
```

**Steps**:

1. Edit the two methods.
2. Edit the CSS.
3. Add the test cases inside the `describe` that holds `counts the boss time down in whole seconds as the scene updates` (use its `bossStart`, `killAll`, `advance` helpers; `const left = (ctx) => ctx.hud('.boss-timer').style.getPropertyValue('--timer-left');`).

**Tests**: unit
**Test cases** (`ClickerGame.test.js`; the miniboss of `bossStart()` has a 30 s limit):

- `sets --timer-left to 1.000 when a 30 s countdown starts`: `createScene({ start: bossStart() })`; `left(ctx)` is `'1.000'`.
- `sets --timer-left to 0.750 after 7.5 s of a 30 s countdown`: `ctx.scene.update(0, 7500)`; `'0.750'`; `timer(ctx)` is `'Time: 23'`.
- `writes --timer-left as 0.000 in the last millisecond, never negative`: `ctx.scene.update(0, 29999)`; `'0.000'`.
- `computes --timer-left against an extended limit`: `ctx.scene.countdown.extend(30000)`; `ctx.scene.update(0, 0)`; `'1.000'`; then `ctx.scene.update(0, 15000)`; `'0.750'`.
- `removes --timer-left when the boss runs out of time`: `ctx.scene.update(0, 30000)`; `left(ctx)` is `''` and `timer(ctx)` is `''`.
- `removes --timer-left when the boss is beaten`: `killAll(ctx)`; `left(ctx)` is `''`.
- `sets no --timer-left on a phase monster`: `createScene()`; `left(ctx)` is `''`.

**Gate**: quick - `cd game && npm test`, then build - `cd game && npm run build`
**Done when**:

- [ ] The 7 cases pass; every existing `Time: <s>` test passes unchanged; the build passes.

**Commit**: `feat(game): show the boss time left as a ring`

---

### T8: HP bar frame and gold damage numbers [x]

**Owner**: game-dev
**What**: The health bar colours, its frame, the HP text and the damage numbers of UIR-05.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `ClickerGame.js:25`, `:58-60`, `:1245-1258` (`showDamage`); `ClickerGame.test.js:186-215`, `:286-300`, `:1852-1871`, `:2950-2970`, `:3555-3575`, `:3715-3720`; `style.css:421-424` (`.hud-monster-hp`), `:538-547` (`.monster-hp`)
**Depends on**: T7
**Requirement**: UIR-05

**Contract**:

```js
const HEALTH_BAR = { width: 240, height: 16, gap: 18, backColor: 0x2a1410, fillColor: 0xc0392b };
// ...
const DAMAGE_FONT = { fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 };
const CRITICAL_TEXT = { color: '#ff8a1f', fontSize: 48 };
const NORMAL_TEXT = { color: '#ffd35c', fontSize: 32 };
```

Update the comment above `showDamage` to `//  A critical hit is bigger and orange, a normal one gold`.

CSS:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hud-monster-hp` | `border-radius: 3px;` `background: linear-gradient(180deg, rgb(255 255 255 / 0.22) 0%, transparent 55%, rgb(0 0 0 / 0.25) 100%);` `box-shadow: 0 0 0 2px var(--wood-900), 0 0 0 4px var(--bronze-500), 0 2px 6px rgb(0 0 0 / 0.5);` (width 240px and height 16px stay) | - |
| `.monster-hp` | `color: #fff4dc;` `-webkit-text-stroke: 3px var(--wood-900);` | - |

New rule right after `.hud-monster-hp`:

```css
/* No frame while no monster stands there (start of the scene, chapter complete) */
.hud-monster-hp:has(.monster-hp:empty) {
    background: none;
    box-shadow: none;
}
```

Test updates in `ClickerGame.test.js` (exact replacements, nothing else):

| Line | Old | New |
| --- | --- | --- |
| 195 | `byColor(0xc67139)` | `byColor(0xc0392b)` |
| 196 | `byColor(0xdcd3c4)` | `byColor(0x2a1410)` |
| 1854 | test name `... draws that number bigger and peach` | `... draws that number bigger and orange` |
| 1862 | `color: '#ffc6a5'` | `color: '#ff8a1f'` |
| 1865 | test name `draws a normal click cream and 32 px` | `draws a normal click gold and 32 px` |
| 1870 | `color: '#f5ead8'` | `color: '#ffd35c'` |
| 2956 | `color: '#ffc6a5'` | `color: '#ff8a1f'` |
| 2957 | `color: '#f5ead8'` | `color: '#ffd35c'` |
| 3559, 3573 | `color: '#f5ead8'` | `color: '#ffd35c'` |
| 3563, 3719 | `color: '#ffc6a5'` | `color: '#ff8a1f'` |

**Steps**:

1. Edit the constants and the comment.
2. Edit the CSS.
3. Apply the test updates, then add the new cases.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`):

- `describe('ClickerGame health bar')` - `draws the bar back 0x2a1410 and the fill 0xc0392b`: `createScene()`; `byColor(0x2a1410)` and `byColor(0xc0392b)` have length 1 each; both are 240 wide and 16 high.
- next to `draws a normal click gold and 32 px` - `draws damage numbers in Cinzel 700 with a dark outline`: one normal click; `ctx.texts[0].style` matches `expect.objectContaining({ fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 })`.
- same place - `draws a critical number in Cinzel 700 with the same outline`: `ctx.dice.value = 0`, one click; `ctx.texts[0].style` matches `{ fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8, color: '#ff8a1f', fontSize: 48 }` (objectContaining).

**Gate**: quick - `cd game && npm test`, then build - `cd game && npm run build`
**Done when**:

- [ ] The 3 new cases and every updated case pass; `grep -c "'#ffc6a5'\|'#f5ead8'\|0xc67139\|0xdcd3c4" game/src/adapters/phaser/ClickerGame.test.js` prints `0`; the build passes.

**Commit**: `style(game): frame the health bar and draw gold damage numbers`

---

### T9: Enemy chips with element dot and stat icons [x]

**Owner**: game-dev
**What**: The enemy tags carry `data-element` and `data-stat` and render as dark chips with a dot or an icon; their text stays (UIR-07).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `ClickerGame.js:684-694` (`showEnemyStats`); `ClickerGame.test.js:1789-1960` (`describe('ClickerGame elements')`, helpers `stats`, `withStats`, `enemyText`); `style.css:447-450` (`.hud-enemy`), `:564-593` (`.enemy-stats`); design § Enemy chips (icons)
**Depends on**: T8
**Requirement**: UIR-07

**Contract**:

```js
    //  "Water  Physical def 10%  Magical def 10%  Crit res 12%", one chip each; the double spaces are hidden between the chips. data-element and
    //  data-stat give each chip its dot or icon (spec ui-redesign UIR-07)
    showEnemyStats ({ element, physicalDefense, magicalDefense, critResistance })
    {
        const name = element.charAt(0) + element.slice(1).toLowerCase();
        const stats = [ [ 'physical', `Physical def ${physicalDefense}%` ], [ 'magical', `Magical def ${magicalDefense}%` ], [ 'crit', `Crit res ${critResistance}%` ] ];
        const tags = [
            el('span', 'tag tag-element', name, { 'data-element': element }),
            ...stats.map(([ stat, text ]) => el('span', 'tag', text, { 'data-stat': stat }))
        ];

        this.enemyStats.replaceChildren(...tags.flatMap((tag, index) => (index ? [ el('span', 'gap', '  '), tag ] : [ tag ])));
    }
```

CSS: `.enemy-stats` - set `padding: 0;` `background: transparent;`; remove `border-radius` and `box-shadow`. `.hud-enemy` - set `width: 460px;` (height stays 48px here; T11 changes it). Add after the rule `.enemy-stats .gap`:

```css
/* The enemy chips: smaller than the hero-screen tags so the line fits 460 px (spec ui-redesign UIR-07) */
.enemy-stats .tag {
    gap: 4px;
    padding: 3px 8px;
    font-size: 11px;
}

/* The element dot of the enemy chip and of the weak element chip */
:is(.tag-element, .weak-chip)::before {
    content: '';
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--element-color, var(--parchment-100));
    box-shadow: 0 0 0 1px var(--wood-900);
}

:is(.tag-element, .weak-chip)[data-element="FIRE"] { --element-color: #e8643c; }
:is(.tag-element, .weak-chip)[data-element="WATER"] { --element-color: #3f8fd1; }
:is(.tag-element, .weak-chip)[data-element="NATURE"] { --element-color: #4f9a3c; }
:is(.tag-element, .weak-chip)[data-element="LIGHT"] { --element-color: #f2c94c; }
:is(.tag-element, .weak-chip)[data-element="DARKNESS"] { --element-color: #4a3a7a; }

/* The stat icons: a mask coloured by the stat */
.tag[data-stat]::before {
    content: '';
    flex: none;
    width: 12px;
    height: 12px;
    background-color: var(--stat-color);
    -webkit-mask: var(--stat-icon) center / contain no-repeat;
    mask: var(--stat-icon) center / contain no-repeat;
}

.tag[data-stat="physical"] {
    --stat-color: #b07a3a;
    --stat-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2 4 5v6c0 5.2 3.4 9.5 8 11 4.6-1.5 8-5.8 8-11V5z'/%3E%3C/svg%3E");
}

.tag[data-stat="magical"] {
    --stat-color: #3f8fd1;
    --stat-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2 4 5v6c0 5.2 3.4 9.5 8 11 4.6-1.5 8-5.8 8-11V5z'/%3E%3C/svg%3E");
}

.tag[data-stat="crit"] {
    --stat-color: #d64541;
    --stat-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23000' stroke-width='3'/%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3C/svg%3E");
}
```

**Steps**:

1. Edit `showEnemyStats`.
2. Edit and add the CSS.
3. Add the test cases.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, `describe('ClickerGame elements')`):

- `marks the element chip with data-element and each defense chip with data-stat`: `withStats(stats('WATER', 11, 22, 33))`; `ctx.hud('.enemy-stats .tag-element').getAttribute('data-element')` is `'WATER'`; `[...ctx.hud('.enemy-stats').querySelectorAll('[data-stat]')].map((tag) => [ tag.getAttribute('data-stat'), tag.textContent ])` equals `[ [ 'physical', 'Physical def 11%' ], [ 'magical', 'Magical def 22%' ], [ 'crit', 'Crit res 33%' ] ]`.
- `keeps the enemy line text exactly as before`: `withStats(stats('DARKNESS', 30, 30, 30))` as chapter boss (copy the setup of `shows the chapter boss attributes`); `enemyText(ctx)` is `'Darkness  Physical def 30%  Magical def 30%  Crit res 30%'` and `.tag-element` has `data-element` `'DARKNESS'`.

**Gate**: quick - `cd game && npm test`, then build - `cd game && npm run build`
**Done when**:

- [ ] The 2 new cases and every existing enemy line test pass; the build passes.

**Commit**: `feat(game): mark the enemy chips with their element and stat`

---

### T10: The element that beats an enemy [x]

**Owner**: game-dev
**What**: `weaknessOf(defender)` returns the element that hits it for double, or null (UIR-08 AC 1 to 4).
**Where**: `game/src/domain/combat/elements.js`
**Also changes**: `game/src/domain/combat/elements.test.js`
**Read first**: `game/src/domain/combat/elements.js` (all); `game/src/domain/combat/elements.test.js:1-30` (style)
**Depends on**: T9
**Requirement**: UIR-08

**Contract** (append at the end of `elements.js`):

```js
//  The element that hits `defender` for double, or null: LIGHT and DARKNESS take at most 1x from any element (spec ui-redesign UIR-08)
export const weaknessOf = (defender) =>
{
    requireElement(defender);

    return ELEMENTS.find((attacker) => elementMultiplier(attacker, defender) === STRONG) ?? null;
};
```

**Steps**:

1. Append the function.
2. Add the test cases in a new `describe('weaknessOf')`.

**Tests**: unit
**Test cases** (`elements.test.js`):

- `FIRE is weak to WATER`: `weaknessOf('FIRE')` is `'WATER'`.
- `WATER is weak to NATURE`: `weaknessOf('WATER')` is `'NATURE'`.
- `NATURE is weak to FIRE`: `weaknessOf('NATURE')` is `'FIRE'`.
- `LIGHT has no weakness`: `weaknessOf('LIGHT')` is `null`.
- `DARKNESS has no weakness`: `weaknessOf('DARKNESS')` is `null`.
- `rejects an unknown element`: `() => weaknessOf('EARTH')` throws `'Unknown element: EARTH'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 6 cases pass with the whole Vitest suite (the architecture test of AD-003 included).

**Commit**: `feat(game): name the element that beats an enemy`

---

### T11: Weak element chip above the enemy line [x]

**Owner**: game-dev
**What**: The HUD shows `Fraco: <elemento>` above the enemy chips and clears it with them (UIR-08).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `ClickerGame.js:68` (`ENEMY_STATS_HTML`), `:180` (`this.enemyStats = ...`), `:685-708` (`showEnemyStats`, `completeChapter`), `:848-853` (`bossTimedOut`), `:1019-1026` (`afterDamage`); `game/src/domain/heroes/heroes.js:13` (`ELEMENT_LABELS`); `ClickerGame.test.js:1915-1960` (clearing tests, `fade` helper); design § Enemy chips and weak element chip
**Depends on**: T10
**Requirement**: UIR-08

**Contract**:

```js
import { weaknessOf } from '../../domain/combat/elements';
import { ELEMENT_LABELS } from '../../domain/heroes/heroes';
// ...
//  The weak element chip sits above the enemy line in the same click-through box (spec ui-redesign UIR-08)
const ENEMY_STATS_HTML = '<div class="hud-box hud-enemy"><div class="weak-chip" data-testid="weak-chip"></div><div class="enemy-stats"></div></div>';
// in create(), right after this.enemyStats = ...:
        this.weakChip = this.enemyStats.parentElement.querySelector('.weak-chip');
// at the end of showEnemyStats:
        const weak = weaknessOf(element);

        this.weakChip.textContent = weak ? `Fraco: ${ELEMENT_LABELS[weak]}` : '';
        this.weakChip.setAttribute('data-element', weak ?? '');
// new method, next to showEnemyStats:
    //  The enemy line and its weak element chip go together
    clearEnemyStats ()
    {
        this.enemyStats.textContent = '';
        this.weakChip.textContent = '';
    }
```

Replace each of the three lines `this.enemyStats.textContent = '';` (in `completeChapter`, `bossTimedOut`, `afterDamage`) with `this.clearEnemyStats();`.

CSS: `.hud-enemy` - set `height: 80px;` `flex-direction: column;` `gap: 4px;` (width 460px from T9 stays). Add after `.hud-enemy`:

```css
/* "Fraco: Água": the element that hits the enemy for double, above the enemy chips (spec ui-redesign UIR-08) */
.weak-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 700;
    white-space: pre;
    color: var(--parchment-100);
    border-radius: 999px;
    background: var(--chip-bg);
    border: 1px solid var(--bronze-500);
}

.weak-chip:empty {
    display: none;
}
```

**Steps**:

1. Imports, HTML constant, `create()`, `showEnemyStats`, `clearEnemyStats`, the three replacements.
2. CSS.
3. Test cases.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, `describe('ClickerGame elements')`; `const weak = (ctx) => ctx.hud('.weak-chip');`):

- `shows Fraco: Água for a FIRE monster`: `withStats(stats('FIRE'))`; `weak(ctx).textContent` is `'Fraco: Água'`, `data-element` `'WATER'`.
- `shows Fraco: Natureza for a WATER monster`: `'Fraco: Natureza'`, `'NATURE'`.
- `shows Fraco: Fogo for a NATURE monster`: `'Fraco: Fogo'`, `'FIRE'`.
- `shows no weak element for a LIGHT miniboss`: setup of `shows the miniboss attributes when the miniboss spawns`; `weak(ctx).textContent` is `''`.
- `shows no weak element for a DARKNESS chapter boss`: setup of `shows the chapter boss attributes`; `''`.
- `empties the weak element chip when the monster dies`: `withStats(stats('NATURE'))`; `killAll(ctx)`; `''`; after the fade and the respawn timer (as in `clears the attributes when the monster dies ...`) it reads `'Fraco: Fogo'` again.
- `empties the weak element chip when the boss runs out of time`: setup of `clears the attributes when the boss runs out of time`; `''`.
- `empties the weak element chip when the chapter is complete`: setup of `clears the attributes when the chapter is complete`; `''`.
- `keeps the weak element chip in the click-through enemy element`: the DOM element whose node holds `.enemy-stats` also holds `.weak-chip`, and its `pointerEvents` is `'none'`.

**Gate**: quick - `cd game && npm test`, then full (phase gate) - `cd game && npm test && npx playwright test`
**Done when**:

- [ ] The 9 cases pass; every Vitest and Playwright suite passes unchanged (`elements.spec.js` still reads the exact enemy line text).

**Commit**: `feat(game): show the element that beats the enemy`

---

### T12: Hero rail of framed squares [x]

**Owner**: game-dev
**What**: The rail as a parchment strip with seven 76 x 60 framed buttons and ember badges (UIR-09).
**Where**: `game/public/style.css` (rules from `/* The hero buttons: a cream rail on the right edge */`)
**Read first**: `style.css:756-824`; `HeroUi.js:15`, `:35-62` (HUD position, buttons, badges); `reference.jpg` right column
**Depends on**: T11
**Requirement**: UIR-09

**Contract**: replace the comment line with `/* The hero buttons: framed wood squares on a parchment strip at the right edge (spec ui-redesign UIR-09) */` and these rules:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hero-hud` | `gap: 6px;` `border-radius: 10px;` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` | - |
| `.hero-hud button` | `justify-content: center;` `width: 76px;` `height: 60px;` `padding: 4px 0;` `color: var(--parchment-100);` `background: var(--frame-bg);` `background-color: var(--wood-800);` `border: var(--frame-border);` `border-radius: 6px;` `box-shadow: var(--frame-shadow);` | - |
| `.hero-hud button:hover` | `filter: brightness(1.15);` | `background` |
| `.hero-hud button:active` | `filter: brightness(0.9);` | `background` |
| `.hero-hud svg` | `color: var(--gold-400);` | - |
| `.hud-badge` | `top: 4px;` `right: 6px;` `background: var(--ember-500);` `box-shadow: 0 0 0 2px var(--wood-900);` | - |
| `[data-testid="talents-badge"]` | `top: 2px;` `right: 2px;` `color: var(--ink-900);` | - |

**Steps**:

1. Edit the comment and the seven rules.

**Tests**: none - CSS; T28 asserts sizes, colours, badges and that no label overflows.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] The build passes; `HeroUi.js` is unchanged.

**Commit**: `style(game): frame the hero rail buttons`

---

### T13: Parchment battle bar, dark leader card and framed skills [x]

**Owner**: game-dev
**What**: The bottom bar, the leader card, the skill frames, key badges and lock marks of UIR-10, and the new layout of the bar that makes room for the round auto click button of T14 (skill bar to x 550, farm button to x 951, farm box 80 x 112; UIR-04 AC 7, UIR-19 AC 21).
**Where**: `game/public/style.css`
**Also changes**: `game/src/adapters/phaser/HeroUi.js` (`SKILL_BAR`), `game/src/adapters/phaser/ClickerGame.js` (`FARM_TOGGLE`), `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `style.css:392-399` (`.battle-bar`), `:462-465` (`.hud-farm`), `:484-488` (`.leader-host`, the second rule with that selector), `:826-965` (leader card and skill bar), `:1606-1622` (`.skill-key`); `HeroUi.js:15-20`; `ClickerGame.js:71`; `HeroUi.test.js:32-75` (`createUi`, the `scene.add.dom` stand-in); design § Layout (Battle bar, left to right); `reference.jpg` bottom row
**Depends on**: T12
**Requirement**: UIR-10, UIR-04, UIR-19

**Contract** - positions:

```js
// HeroUi.js: the skills sit 36 px further left so the round auto click and farm buttons fit at the right end of the bar (spec ui-redesign D1)
const SKILL_BAR = { x: 550, y: 686 };
// ClickerGame.js: the round farm button at the right end of the bar, right of the auto click button
const FARM_TOGGLE = { x: 951, y: 686 };
```

**Contract** - CSS:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hud-farm` | `width: 80px;` `height: 112px;` | - |
| --- | --- | --- |
| `.battle-bar` | `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` (width 984px, height 124px, `border-radius: var(--radius-lg)` stay) | - |
| `.leader-host` (the rule at line 484 only, not the group at line 402) | `width: 240px;` `height: 104px;` | - |
| `.leader-card` | `width: 240px;` `height: 104px;` `padding: 10px 12px;` `border-radius: 10px;` `background: var(--frame-bg);` `background-color: var(--wood-800);` `border: var(--frame-border);` `box-shadow: var(--frame-shadow);` | - |
| `.leader-face` | `background: radial-gradient(circle at 50% 45%, var(--wood-600), var(--wood-900));` `box-shadow: 0 0 0 3px var(--gold-400);` | - |
| `.leader-crown` | `color: var(--parchment-100);` `background: var(--ember-700);` `box-shadow: 0 0 0 2px var(--gold-400);` | - |
| `.leader-name` | `font-weight: 700;` `color: var(--gold-200);` | - |
| `.leader-bonus` | `color: var(--parchment-100);` | - |
| `.skill-slot img` | `border: 2px solid var(--bronze-500);` `border-radius: 8px;` `background: var(--wood-900);` | - |
| `.skill-slot:not(.is-locked) img` | `box-shadow: 0 0 0 2px var(--gold-400);` | - |
| `.skill-slot-cooldown` | `color: var(--ember-800);` | - |
| `.skill-lock-mark` | `color: var(--gold-400);` `background: rgb(28 18 12 / 0.85);` `box-shadow: 0 0 0 1px var(--bronze-500);` | - |
| `.skill-key` | `font-weight: 700;` `color: var(--gold-200);` `background: var(--wood-900);` `border: 1px solid var(--gold-400);` `opacity: 1;` | - |

The AD-020 rules `.skill-level-badge` and `.skill-level-badge[data-level="3"]` do not change.

**Steps**:

1. Change the two position constants (and the comment above each).
2. Edit the thirteen rules.
3. Add the test cases.

**Tests**: unit (the positions; the CSS values are asserted by T28)
**Test cases**:

- `HeroUi.test.js` - `places the skill bar at 550, 686, left of the round buttons`: `createUi()` (return its `scene` if it does not yet); the `scene.add.dom` call whose result node holds `.skill-bar-host` was made with `(550, 686)`.
- `ClickerGame.test.js` - `places the round farm button at 951, 686`: `createScene()`; the element of `ctx.doms` whose node holds `.farm-toggle` has `x` 951 and `y` 686.

**Gate**: quick - `cd game && npm test`, then build - `cd game && npm run build`
**Done when**:

- [ ] The 2 cases pass with the whole Vitest suite; the build passes; `git diff game/public/style.css` touches no `.skill-level-badge` rule.

**Commit**: `style(game): draw the battle bar, leader card and skills in the grove look`

---

### T14: Round auto click button, its window and the key A [x]

**Owner**: game-dev
**What**: The auto click card on the left is replaced by a round button in the battle bar that opens a window with the old card's controls, by click or by the key `A` (decision D1; UIR-19).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `ClickerGame.js:16` (imports of the views), `:73-76` (`AUTO_CLICK_HUD`, `AUTO_CLICK_HUD_HTML`), `:183-189` (end of `create`, the `shutdown` handler), `:206-260` (`createControls`, `createAutoClickHud`, `showAutoClick`), `:280-292` (`openResetDialog`), `:420-430` (`escape`); `game/src/adapters/phaser/views/autoClickView.js`; `ClickerGame.test.js:160-186` (stand-in: `ctx.doms`, `ctx.handlers`), `:3412` (`press`), `:3755-3860` (auto click tests, helpers `autoClickElement`, `toggle`, `atChapter`); design § Auto click button and window
**Depends on**: T13
**Requirement**: UIR-19

**Contract**:

```js
import { autoClickIntervalText, renderAutoClick } from './views/autoClickView';
// ...
//  The auto click (spec ui-redesign D1, UIR-19): a round button at the right end of the battle bar with its key A and its interval under it, and the
//  window it opens above it with the switch, the interval, the crystals, the upgrade and the account reset. The box keeps Phaser's placement fixed.
const AUTO_CLICK_HUD = { x: 867, y: 686 };
const AUTO_CLICK_HUD_HTML = '<div class="hud-box hud-auto-click"><div class="auto-click" data-testid="auto-click">'
    + '<div class="auto-click-popover" id="auto-click-popover" role="dialog" aria-label="Auto clique" data-testid="auto-click-popover" hidden></div>'
    + '<button type="button" class="auto-click-button" data-testid="auto-click-button" data-on="false" aria-label="Auto clique" aria-haspopup="dialog"'
    + ' aria-expanded="false" aria-controls="auto-click-popover"><span class="auto-click-key" data-testid="auto-click-key" aria-hidden="true">A</span></button>'
    + '<span class="auto-click-rate" data-testid="auto-click-rate"></span>'
    + '</div></div>';

//  A key typed into a text field is text, not a shortcut
const isTextField = (target) => Boolean(target?.closest?.('textarea, select, [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="button"])'));
```

`createAutoClickHud()` becomes:

```js
    //  The round auto click button and its window are clickable HTML, hidden until the auto click is open; they read their state in the background
    createAutoClickHud ()
    {
        this.autoClickElement = this.add.dom(AUTO_CLICK_HUD.x, AUTO_CLICK_HUD.y).createFromHTML(AUTO_CLICK_HUD_HTML);
        this.autoClickBox = this.autoClickElement.node.querySelector('.auto-click');
        this.autoClickWindow = this.autoClickBox.querySelector('.auto-click-popover');
        this.autoClickButton = this.autoClickBox.querySelector('.auto-click-button');
        this.autoClickRate = this.autoClickBox.querySelector('.auto-click-rate');
        this.autoClickBox.addEventListener('change', (event) => this.switchAutoClick(event.target.checked));
        this.autoClickBox.addEventListener('click', (event) => event.target.closest('.auto-click-upgrade') && this.upgradeAutoClick());
        this.autoClickBox.addEventListener('click', (event) => event.target.closest('.reset-account') && this.openResetDialog());
        this.autoClickButton.addEventListener('click', () => this.toggleAutoClickWindow());
        //  A press anywhere outside the button and its window closes the window and still does what it does (a press on the canvas hits)
        this.onPressOutsideAutoClick = (event) => !this.autoClickBox.contains(event.target) && this.closeAutoClickWindow({ returnFocus: false });
        document.addEventListener('pointerdown', this.onPressOutsideAutoClick, true);
        this.input.keyboard.on('keydown-A', (event) => this.autoClickKey(event));
        this.showAutoClick();
        this.loadAutoClick();
    }
```

`showAutoClick()` becomes:

```js
    showAutoClick ()
    {
        const reward = this.resetReward;
        //  The window is drawn again on every change; a keyboard user keeps the control that had focus
        const focused = this.autoClickWindow.contains(document.activeElement) ? document.activeElement.getAttribute('data-testid') : null;

        this.autoClickElement.setVisible(this.autoClickOpen);
        this.autoClickWindow.replaceChildren(...renderAutoClick({
            enabled: this.autoClickEnabled, intervalMs: this.autoClick.intervalMs(), state: this.autoClick.state(), busy: this.upgradingAutoClick
        }), ...(reward === null ? [] : [ renderResetButton(reward) ]));
        this.autoClickButton.setAttribute('data-on', String(this.autoClickEnabled));
        this.autoClickRate.textContent = autoClickIntervalText(this.autoClick.intervalMs());

        if (!this.autoClickOpen)
        {
            this.closeAutoClickWindow({ returnFocus: false });
        }
        else if (focused)
        {
            this.autoClickWindow.querySelector(`[data-testid="${focused}"]`)?.focus();
        }
    }
```

New methods, after `showAutoClick`:

```js
    get autoClickWindowOpen ()
    {
        return !this.autoClickWindow.hidden;
    }

    //  The window opens with the focus on its switch, so the keyboard can use it at once
    openAutoClickWindow ()
    {
        if (!this.autoClickOpen)
        {
            return;
        }

        this.autoClickWindow.hidden = false;
        this.autoClickButton.setAttribute('aria-expanded', 'true');
        this.autoClickWindow.querySelector('[data-testid="auto-click-toggle"]')?.focus();
    }

    closeAutoClickWindow ({ returnFocus = true } = {})
    {
        if (!this.autoClickWindowOpen)
        {
            return;
        }

        this.autoClickWindow.hidden = true;
        this.autoClickButton.setAttribute('aria-expanded', 'false');

        if (returnFocus)
        {
            this.autoClickButton.focus();
        }
    }

    toggleAutoClickWindow ()
    {
        this.autoClickWindowOpen ? this.closeAutoClickWindow() : this.openAutoClickWindow();
    }

    //  The A key opens or closes the window; not while typing, not for the repeats of a held key, and not while a dialog, the pause menu or a
    //  hero screen covers the battle bar
    autoClickKey (event)
    {
        if (event?.repeat || isTextField(event?.target) || this.paused || !this.resetDialog.hidden || this.heroUi.isOpen || !this.autoClickOpen)
        {
            return;
        }

        this.toggleAutoClickWindow();
    }
```

Other edits:

- `escape()`: as its first statement, `if (this.autoClickWindowOpen) { this.closeAutoClickWindow(); return; }` (with the house brace style), and the comment becomes `//  Esc closes the auto click window first, then an open hero screen; otherwise it opens or closes the pause menu`.
- `openResetDialog()`: right after the `if (this.resetReward === null) { return; }` block, add `this.closeAutoClickWindow({ returnFocus: false });`.
- The `shutdown` line of `create()` becomes:

```js
        this.events.once('shutdown', () =>
        {
            this.syncOnExit();
            document.removeEventListener('pointerdown', this.onPressOutsideAutoClick, true);
        });
```

`renderAutoClick`, `renderResetButton`, `switchAutoClick`, `upgradeAutoClick` and every text do not change. `FARM_TOGGLE` and `SKILL_BAR` were moved by T13.

**Steps**:

1. Imports, constants, `isTextField`.
2. `createAutoClickHud`, `showAutoClick`, the five new members.
3. `escape`, `openResetDialog`, the `shutdown` handler.
4. Add the test cases in the `describe` of the auto click tests (line ~3755). Helpers: `const button = (ctx) => ctx.hud('[data-testid="auto-click-button"]'); const popover = (ctx) => ctx.hud('[data-testid="auto-click-popover"]'); const attach = (ctx) => document.body.append(autoClickElement(ctx).node);` (focus needs the node in the document; remove it at the end of the test).

**Tests**: unit
**Test cases** (`ClickerGame.test.js`; `atChapter(2)` unless said otherwise):

- `places the round auto click button at 867, 686 with the key A and the interval under it` (UIR-19 AC 1, 2): `autoClickElement(ctx)` has `x` 867, `y` 686; `ctx.hud('[data-testid="auto-click-key"]').textContent` is `'A'`; `ctx.hud('[data-testid="auto-click-rate"]').textContent` is `'500 ms'`.
- `writes 250 ms under the button at level 1` (AC 2): `autoClick: { ...AUTO_CLICK_LEVEL_0, level: 1, intervalMs: 250, next: { level: 2, intervalMs: 150, price: 25 } }`; rate `'250 ms'`.
- `marks the button on while the auto click runs and off when switched off` (AC 4, 5): `button(ctx).getAttribute('data-on')` is `'true'`; set `toggle(ctx).checked = false` and dispatch a bubbling `change`; `'false'`.
- `keeps the window closed until the button is pressed` (AC 6): `popover(ctx).hidden` is `true`, `button(ctx).getAttribute('aria-expanded')` is `'false'`.
- `opens the window on a click with the focus on the switch` (AC 6): `attach(ctx)`; `button(ctx).click()`; `popover(ctx).hidden` `false`, `aria-expanded` `'true'`, `document.activeElement` is `toggle(ctx)`.
- `holds the switch, interval, crystals and upgrade in the window, and the reset from chapter 2` (AC 7): `atChapter(3)`; `[...popover(ctx).children].map((child) => child.getAttribute('data-testid') ?? child.querySelector('[data-testid]')?.getAttribute('data-testid'))` equals `[ 'auto-click-toggle', 'auto-click-interval', 'auto-click-crystals', 'auto-click-upgrade', 'reset-account' ]`; `reset-account` text `'Resetar conta (+3 cristais)'`.
- `opens and closes the window with A, the focus back on the button` (AC 8, 9): `attach(ctx)`; `press(ctx, 'A', { repeat: false, target: document.body })`; open, focus on the switch; press again; closed, `aria-expanded` `'false'`, `document.activeElement` is `button(ctx)`.
- `closes the window when the button is pressed again` (AC 9): two `button(ctx).click()`; closed, focus on the button.
- `closes the window with Escape and does not pause` (AC 9, 10): open; `ctx.handlers['keydown-ESC']()`; closed; `ctx.scene.paused` is `false`; a second `ctx.handlers['keydown-ESC']()` sets `ctx.scene.paused` to `true`.
- `closes the window on a press outside, without moving the focus to the button` (AC 11): `attach(ctx)`; open; `document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))`; closed; `document.activeElement` is not `button(ctx)`.
- `keeps the window open on a press inside it` (AC 11): open; `toggle(ctx).dispatchEvent(new Event('pointerdown', { bubbles: true }))`; still open.
- `ignores A typed into a text field` (AC 12): `const field = document.createElement('input'); field.type = 'text';` `press(ctx, 'A', { repeat: false, target: field })`; closed.
- `ignores the repeats of a held A` (AC 13): `press(ctx, 'A', { repeat: true, target: document.body })`; closed.
- `ignores A while the pause menu is open` (AC 14): `ctx.handlers['keydown-ESC']()` (pauses); `press(ctx, 'A', ...)`; closed.
- `ignores A while a hero screen is open` (AC 14): `ctx.scene.heroUi.show('heroes')`; `press(ctx, 'A', ...)`; closed.
- `ignores A while the auto click is locked` (AC 14, 3): `atChapter(1)` with `resets: 0`; `autoClickElement(ctx).visible` is `false`; `press(ctx, 'A', ...)`; closed.
- `keeps the focus on the switch when the window is drawn again` (AC 15): `attach(ctx)`; open (focus on the switch); `ctx.scene.showAutoClick()`; `document.activeElement` is the new `toggle(ctx)`.
- `closes the window when its reset button opens the reset dialog` (AC 16): `atChapter(3)`; open; `ctx.hud('[data-testid="reset-account"]').click()`; window closed; `ctx.hud('[data-testid="reset-dialog"]').hidden` is `false`.
- `labels the button and the window for assistive tech` (AC 18): button `aria-label` `'Auto clique'`, `aria-haspopup` `'dialog'`, `aria-controls` `'auto-click-popover'`; window `id` `'auto-click-popover'`, `role` `'dialog'`, `aria-label` `'Auto clique'`.
- `binds A to nothing but the auto click window` (AC 20): the keys registered on `scene.input.keyboard.on` are exactly `keydown-ESC`, `keydown-ONE`, `keydown-TWO`, `keydown-THREE`, `keydown-Q`, `keydown-W`, `keydown-E`, `keydown-A` (read `scene.input.keyboard.on.mock.calls.map(([ name ]) => name)`, sorted).
- `removes the outside-press listener when the scene shuts down`: `vi.spyOn(document, 'removeEventListener')`; `ctx.eventHandlers.shutdown()`; it was called with `('pointerdown', ctx.scene.onPressOutsideAutoClick, true)`.

Every existing auto click test (`toggle`, `interval`, `crystals`, `upgradeButton`, `visible`) and account reset test keeps passing unchanged: they query by test id, which the window still holds.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 21 new cases and every existing `ClickerGame.test.js` case pass.
- [ ] `grep -n "366, y: 200" game/src/adapters/phaser/ClickerGame.js` prints nothing.

**Commit**: `feat(game): open the auto click from a round button or the A key`

---

### T15: Open the auto click window in the existing browser tests [x]

**Owner**: test-engineer
**What**: The two e2e suites that used the old card open the auto click window before touching its controls, so they test the same behaviour through the new button (UIR-19 AC 7; regression of `auto-click` and `account-reset`).
**Where**: `game/e2e/autoClick.spec.js`
**Also changes**: `game/e2e/accountReset.spec.js`
**Read first**: `game/e2e/autoClick.spec.js:1-90`; `game/e2e/accountReset.spec.js:1-70`; T14 (test ids)
**Depends on**: T14
**Requirement**: UIR-19

**Contract**: in each file, a helper after `health`:

```js
//  The auto click controls live in the window of the round button (spec ui-redesign D1)
const openAutoClick = async (page) => {
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
};
```

| File:line | Change |
| --- | --- |
| `autoClick.spec.js:51` (test `shows 500 ms, Cristais: 0 and a disabled ...`) | after `await startGame(page, 2);` add `await openAutoClick(page);` |
| `autoClick.spec.js:61` (test `unchecking Auto clique stops it, without the click hitting the monster`) | add `await openAutoClick(page);` right before `await page.getByTestId('auto-click-toggle').click();` (after the hit counter is installed, so the button's click is counted too and must stay 0) |
| `autoClick.spec.js:83` (test `in chapter 1 there is no Auto clique switch ...`) | add the line `await expect(page.getByTestId('auto-click-button')).toBeHidden();` before the existing `toBeHidden` |
| `accountReset.spec.js:31` (test `in chapter 3 the button offers 3 crystals ...`) | add `await openAutoClick(page);` before the first `expect` |
| `accountReset.spec.js:54` (test `Resetar brings chapter 1, ...`) | add `await openAutoClick(page);` before `await page.getByTestId('reset-account').click();` |
| `accountReset.spec.js:61` | `auto-click-toggle` `toBeVisible()` becomes `auto-click-button` `toBeVisible()` (the reset dialog closed the window) |

No other line changes; test names stay.

**Steps**:

1. Add the helper to both files.
2. Apply the six changes.
3. Run the gate.

**Tests**: e2e (regression)
**Gate**: full - `cd game && npx playwright test e2e/autoClick.spec.js e2e/accountReset.spec.js`, then `cd game && npm test && npx playwright test`
**Done when**:

- [ ] Both suites pass with every test name unchanged; the whole Playwright suite passes.

**Commit**: `test(game): open the auto click window in the auto click and reset tests`

---

### T16: Round auto click and farm buttons, the auto click window [x]

**Owner**: game-dev
**What**: The CSS of the round auto click button, its key badge, rate label and window, the switch inside it, and the round farm button (UIR-11, UIR-19 AC 1, 2, 4, 5, 21, 22).
**Where**: `game/public/style.css`
**Read first**: `style.css:467-472` (`.hud-auto-click`), `:606-693` (switches, `.auto-click`, `.auto-click-upgrade`, `.reset-account`); `ClickerGame.js` `AUTO_CLICK_HUD_HTML` (T14) and `FARM_TOGGLE_HTML`; design § Auto click button and window, § Layout; `reference.jpg` bottom right
**Depends on**: T15
**Requirement**: UIR-11, UIR-19

**Contract**: replace the five rules from `.farm-toggle,` `.auto-click-toggle {` up to `.farm-toggle input:checked::after,` `.auto-click-toggle input:checked::after { ... }` (style.css:606-653) with:

```css
/* The auto click switch, inside the auto click window: a wood track with a parchment knob, green when on (spec ui-redesign UIR-11) */
.auto-click-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    font-size: 14px;
    font-weight: 700;
    border-radius: 999px;
    background: var(--parchment-300);
    border: var(--inset-border);
    cursor: pointer;
}

.auto-click-toggle input {
    appearance: none;
    position: relative;
    flex: none;
    width: 40px;
    height: 24px;
    margin: 0;
    border-radius: 999px;
    background: var(--wood-700);
    border: 1px solid var(--bronze-500);
    cursor: pointer;
}

.auto-click-toggle input::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--parchment-100);
    transition: left 120ms;
}

.auto-click-toggle input:checked {
    background: #3f8f3a;
}

.auto-click-toggle input:checked::after {
    left: 18px;
}

/* The two round buttons of the bar share the look: a dark wood disc with a bronze ring, the label under it (spec ui-redesign D1) */
.farm-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-900);
    cursor: pointer;
}

.farm-toggle input,
.auto-click-button {
    appearance: none;
    position: relative;
    flex: none;
    width: 56px;
    height: 56px;
    margin: 0;
    padding: 0;
    border-radius: 50%;
    background-color: var(--wood-800);
    border: 3px solid var(--bronze-500);
    box-shadow: var(--frame-shadow);
    cursor: pointer;
}

.farm-toggle input {
    background:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e0b45a' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z'/%3E%3Ccircle cx='15' cy='12' r='1'/%3E%3Ccircle cx='9' cy='12' r='1'/%3E%3C/svg%3E") center / 30px 30px no-repeat,
        var(--frame-bg);
    background-color: var(--wood-800);
}

.farm-toggle input:checked {
    border-color: var(--ember-500);
    box-shadow: 0 0 12px 2px rgb(232 116 42 / 0.75), var(--frame-shadow);
}

/* The auto click: the button, its key and its interval in a column; the window floats above the button */
.auto-click {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 80px;
}

.auto-click-button {
    background:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f3d58a' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 4.1 12 6'/%3E%3Cpath d='m5.1 8-2.9-.8'/%3E%3Cpath d='m6 12-1.9 2'/%3E%3Cpath d='M7.2 2.2 8 5.1'/%3E%3Cpath d='M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z'/%3E%3C/svg%3E") center / 28px 28px no-repeat,
        var(--frame-bg);
    background-color: var(--wood-800);
}

/* On: a green ring and glow, as in the mock-up */
.auto-click-button[data-on="true"] {
    border-color: #5fd35a;
    box-shadow: 0 0 14px 4px rgb(95 211 90 / 0.75), var(--frame-shadow);
}

.auto-click-button:hover {
    filter: brightness(1.15);
}

.auto-click-button:active {
    filter: brightness(0.9);
}

/* The key that opens the window, like the skill keys */
.auto-click-key {
    position: absolute;
    top: -6px;
    left: -6px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    font-family: var(--font-heading);
    font-size: 12px;
    font-weight: 700;
    color: var(--gold-200);
    border-radius: 6px;
    background: var(--wood-900);
    border: 1px solid var(--gold-400);
    pointer-events: none;
}

.auto-click-rate {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-900);
    white-space: pre;
}

/* The window: parchment above the button, 4 px inside the right edge of the box (left of the hero rail), a tail pointing at the button */
.auto-click-popover {
    position: absolute;
    right: 4px;
    bottom: calc(100% + 10px);
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    width: 240px;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-900);
    border-radius: 10px;
    background: var(--panel-bg);
    background-color: var(--parchment-200);
    border: var(--panel-border);
    box-shadow: var(--panel-shadow);
}

.auto-click-popover::after {
    content: '';
    position: absolute;
    right: 28px;
    bottom: -11px;
    width: 16px;
    height: 16px;
    background: var(--parchment-300);
    border-right: 3px solid var(--wood-600);
    border-bottom: 3px solid var(--wood-600);
    transform: rotate(45deg);
}
```

The window is out of the flow (`position: absolute`), so the button is the top of `.auto-click`: `bottom: calc(100% + 10px)` puts the window's bottom edge 10 px above the button. Use exactly these values; T28 asserts the boxes.

Other rules:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hud-auto-click` | `width: 80px;` `height: 112px;` `align-items: center;` `justify-content: center;` | - |
| the old `.auto-click` rule (the one with `flex-wrap: wrap`, from before T16) | delete the whole rule (the new `.auto-click` above replaces it) | - |
| `.auto-click-upgrade` | `padding: 6px 12px;` `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-700);` `border: 2px solid var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |
| `.auto-click-upgrade:disabled` | - | `background` (the shared `button:disabled` opacity 0.45 dims it) |
| `.reset-account` | `padding: 6px 12px;` `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-700);` `border: 2px solid var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |

**Steps**:

1. Replace the switch rules with the block.
2. Delete the old `.auto-click` rule; edit `.hud-auto-click`, `.auto-click-upgrade`, `.auto-click-upgrade:disabled`, `.reset-account`.

**Tests**: none - CSS; T28 asserts UIR-11 and the layout of UIR-19.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] The build passes; `grep -c "flex-wrap: wrap" game/public/style.css` is one less than before this task (the old card rule is gone) and `grep -c "auto-click-popover" game/public/style.css` prints `2`.

**Commit**: `style(game): draw the round auto click and farm buttons and the auto click window`

---

### T17: Dim layer, pause card and reset card [x]

**Owner**: game-dev
**What**: The overlays of UIR-12.
**Where**: `game/public/style.css`
**Read first**: `style.css:695-754` (`.reset-question` to `.pause-question`)
**Depends on**: T16
**Requirement**: UIR-12

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.pause-menu,` `.reset-dialog,` `.hero-panel` (the group) | `background: rgb(28 18 12 / 0.62);` | - |
| `.pause-card,` `.reset-card` (the group) | `border-radius: var(--radius-lg);` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` | - |
| `.pause-title` | `font-size: 40px;` `font-weight: 700;` `color: var(--ink-900);` | - |
| `.reset-error` | `color: var(--ember-800);` | - |

**Steps**:

1. Edit the four rules.

**Tests**: none - CSS; T28 asserts UIR-12.
**Gate**: build, then full (phase gate) - `cd game && npm test && npm run build && npx playwright test`
**Done when**:

- [ ] The build and every Vitest and Playwright suite pass unchanged.

**Commit**: `style(game): draw the pause and reset cards on parchment`

---

### T18: Main menu fields, buttons and path choice [x]

**Owner**: game-dev
**What**: The DOM of the main menu in the Grove recipes (UIR-15 AC 2, 3).
**Where**: `game/public/style.css` (section `/* ══ 01 · Main menu`)
**Read first**: `style.css:217-389`; `MainMenu.js:20-64` (the HTML)
**Depends on**: T17
**Requirement**: UIR-15

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.menu-tagline` | `color: var(--ink-600);` | - |
| `.auth-form input` | `padding: 12px 20px;` `color: var(--ink-900);` `background: var(--parchment-100);` `border: 2px solid var(--wood-600);` | - |
| `.auth-form input:hover` | `border-color: var(--bronze-500);` | - |
| `.auth-form input:focus-visible` | `border-color: var(--color-focus);` `outline-offset: 2px;` | - |
| `.auth-message` (the rule that sets `min-height`) | `color: var(--color-accent-2-800);` | - |
| `.auth-message.error` | `color: var(--ember-800);` | - |
| `.welcome-title` | `font-weight: 700;` `color: var(--ink-900);` | - |
| `.welcome-start` | `font-weight: 700;` `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-700);` `border: 2px solid var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |
| `.path-choice` | `border-radius: var(--radius-lg);` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` | - |
| `.path-title` | `font-weight: 700;` | - |
| `.path-option` | `font-weight: 700;` `color: var(--ink-900);` `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.path-option:hover:not(:disabled)` | `background: var(--parchment-100);` `box-shadow: inset 0 0 0 2px var(--bronze-500);` | - |

**Steps**:

1. Edit the twelve rules.

**Tests**: none - CSS; T28 asserts UIR-15 AC 2 and 3.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] The build passes.

**Commit**: `style(game): draw the main menu fields and path choice in the grove look`

---

### T19: Parchment menu oval with a wood rim [x]

**Owner**: game-dev
**What**: The Phaser oval of the main menu is parchment with a 6 px dark wood rim (UIR-15 AC 1).
**Where**: `game/src/adapters/phaser/MainMenu.js`
**Also changes**: `game/src/adapters/phaser/MainMenu.test.js`
**Read first**: `MainMenu.js:7-9`, `:70-80`; `MainMenu.test.js:1-80` (Phaser stand-in, `createScene`, the first test)
**Depends on**: T18
**Requirement**: UIR-15

**Contract**:

```js
//  Everything the player reads or clicks sits in a parchment oval with a dark wood rim on the left; x is the centre of that column
const OVAL = { x: 170, y: 380, width: 700, height: 1040, color: 0xead6ad, rim: 0x5a3d26, rimWidth: 6, shadow: 0x2e2b25 };
// in create():
        this.add.ellipse(OVAL.x, OVAL.y, OVAL.width, OVAL.height, OVAL.color).setStrokeStyle(OVAL.rimWidth, OVAL.rim);
```

The shadow ellipse line does not change.

Test stand-in (`MainMenu.test.js:36`): `ellipse: vi.fn(() => { const shape = {}; shape.setStrokeStyle = vi.fn(() => shape); return shape; }),`

**Steps**:

1. Edit the constant, its comment and the oval line.
2. Edit the stand-in.
3. Add the test cases.

**Tests**: unit
**Test cases** (`MainMenu.test.js`, follow the setup of the first test of the file):

- `draws the menu oval in parchment at 170, 380, 700 x 1040`: after `create()`, `scene.add.ellipse.mock.calls[1]` equals `[ 170, 380, 700, 1040, 0xead6ad ]`.
- `gives the menu oval a 6 px dark wood rim`: `scene.add.ellipse.mock.results[1].value.setStrokeStyle` was called once with `(6, 0x5a3d26)`.
- `keeps the soft shadow under the oval`: `scene.add.ellipse.mock.calls[0]` equals `[ 176, 392, 700, 1040, 0x2e2b25, 0.22 ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 3 cases and every existing `MainMenu.test.js` case pass.

**Commit**: `style(game): draw the menu oval on parchment with a wood rim`

---

### T20: Gold and ember loading bar [x]

**Owner**: game-dev
**What**: The preloader bar has a 2 px gold outline and an ember fill (UIR-15 AC 4).
**Where**: `game/src/adapters/phaser/Preloader.js`
**Also changes**: `game/src/adapters/phaser/Preloader.test.js` (new)
**Read first**: `Preloader.js:14-31`; `MainMenu.test.js:1-12` (how a scene test mocks `phaser`)
**Depends on**: T19
**Requirement**: UIR-15

**Contract**:

```js
        //  The outline of the bar: a thin gold rim (spec ui-redesign)
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(2, 0xe0b45a);

        //  The bar itself, in ember; it grows from the left with the progress
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xe8742a);
```

`Preloader.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { Preloader } from './Preloader';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  Minimal Phaser stand-in: only what Preloader.init touches
const createScene = () => {
    const rectangles = [];
    const handlers = {};
    const scene = new Preloader();

    scene.add = {
        image: vi.fn(),
        rectangle: vi.fn((x, y, width, height, color) => {
            const rect = { x, y, width, height, color };

            rect.setStrokeStyle = vi.fn(() => rect);
            rectangles.push(rect);
            return rect;
        })
    };
    scene.load = { on: vi.fn((event, callback) => { handlers[event] = callback; }) };

    return { scene, rectangles, handlers };
};
```

**Steps**:

1. Edit the two lines and their comments.
2. Create the test file with the stand-in and the cases.

**Tests**: unit
**Test cases** (`Preloader.test.js`, `describe('Preloader')`):

- `outlines the loading bar in gold, 2 px, at 512, 384, 468 x 32`: `scene.init()`; `rectangles[0]` has `x` 512, `y` 384, `width` 468, `height` 32; its `setStrokeStyle` was called with `(2, 0xe0b45a)`.
- `fills the loading bar in ember from the left`: `rectangles[1]` has `x` 282, `y` 384, `width` 4, `height` 28, `color` `0xe8742a`.
- `grows the bar to 464 px at full progress`: `handlers.progress(1)`; `rectangles[1].width` is 464.

**Gate**: quick - `cd game && npm test`, then full (phase gate) - `cd game && npx playwright test`
**Done when**:

- [x] The 3 cases pass; every Vitest and Playwright suite passes.

**Commit**: `style(game): draw the loading bar in gold and ember`

---

### T21: Parchment hero window [x]

**Owner**: game-dev
**What**: The shell of every hero screen: window, title, error line, empty state (UIR-13 AC 1 to 4).
**Where**: `game/public/style.css` (section `/* ══ Hero screens`)
**Read first**: `style.css:978-1031`
**Depends on**: T20
**Requirement**: UIR-13

**Contract**: replace the section comment with `/* ══ Hero screens: one parchment window over the dimmed fight ══ */` and:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hero-window` | `border-radius: var(--radius-lg);` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: var(--panel-border);` `box-shadow: var(--panel-shadow);` | - |
| `.hero-title` | `font-size: 30px;` `font-weight: 700;` `color: var(--ink-900);` | - |
| `.hero-error` | `color: var(--parchment-100);` `background: var(--ember-800);` | - |
| `.hero-empty` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |

**Steps**:

1. Edit the comment and the four rules.

**Tests**: none - CSS; T28 asserts UIR-13 AC 1 to 3.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The build passes.

**Commit**: `style(game): draw the hero screens on a parchment window`

---

### T22: Catalog, detail, skill rows, farm list, fusion and leader [x]

**Owner**: game-dev
**What**: The inset cards and dark portraits of UIR-13 AC 4 to 6.
**Where**: `game/public/style.css`
**Read first**: `style.css:1033-1318`; `game/src/adapters/phaser/views/catalogView.js` (classes used)
**Depends on**: T21
**Requirement**: UIR-13

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hero-card` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.hero-card:hover` | `box-shadow: inset 0 0 0 2px var(--bronze-500);` | - |
| `.hero-card img` | `border-radius: 6px;` `background: radial-gradient(circle at 50% 45%, #5a3d26, #1c120c);` | - |
| `.hero-card .hero-name` | `font-weight: 700;` | - |
| `.hero-card.is-grey img` | `background: radial-gradient(circle at 50% 45%, #5a3d26, #1c120c);` | - |
| `.hero-detail-portrait` | `border-radius: var(--radius-md);` `background: radial-gradient(circle at 50% 45%, #5a3d26, #1c120c);` `border: 2px solid var(--bronze-500);` | - |
| `.hero-detail-text .hero-name` | `font-weight: 700;` | - |
| `.hero-bonus` | `color: var(--parchment-100);` `border: 1px solid var(--bronze-500);` `border-radius: var(--radius-md);` `background: var(--wood-800);` | - |
| `.skill-row` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.skill-row.is-locked` | `background: var(--parchment-200);` | - |
| `.skill-art` | `border-radius: 6px;` `border: 2px solid var(--bronze-500);` `background: var(--wood-900);` | - |
| `.skill-state` (the second rule, the one with `border-radius: 999px`) | `color: var(--parchment-100);` `background: var(--wood-800);` | - |
| `.farm-entry` (the first rule, the one with `font-family`) | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.farm-entry:hover:not(:disabled)` | `box-shadow: inset 0 0 0 2px var(--bronze-500);` | - |
| `.farm-wins` (the second rule, the one with `border-radius`) | `color: var(--parchment-100);` `background: var(--wood-800);` | - |
| `.leader-entry.is-current` | `box-shadow: inset 0 0 0 2px var(--gold-400);` `background: var(--parchment-100);` | - |
| `.fusion-result` | `font-weight: 700;` `color: var(--gold-200);` `border: var(--frame-border);` `border-radius: var(--radius-md);` `background: var(--wood-800);` | - |

The AD-020 rules (`.hero-stars.is-ascended`, `.hero-stars.is-exalted`, `.skill-level`, `.skill-level[data-level="3"]`) do not change.

**Steps**:

1. Edit the seventeen rules.

**Tests**: none - CSS; T28 asserts the inset recipe, portraits and AD-020 colours; `heroAscension.spec.js` keeps asserting the star colours.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The build passes; `git diff game/public/style.css` touches no AD-020 rule.

**Commit**: `style(game): draw the hero, fusion and leader cards in the grove look`

---

### T23: Equipment, piece tiles, tooltip and bulk sale [x]

**Owner**: game-dev
**What**: The Equipamento screen of UIR-13 AC 4 and UIR-14 AC 7, 8.
**Where**: `game/public/style.css`
**Read first**: `style.css:1319-1437`, `:1768-1810`, `:1990-2016`, `:2038-2070`, `:2152-2162`
**Depends on**: T22
**Requirement**: UIR-14

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.equip-hero` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.equip-hero-name` | `font-weight: 700;` | - |
| `.equip-slot` | `background: var(--parchment-100);` `border: 1px solid rgb(90 61 38 / 0.35);` | - |
| `.equip-slot:hover:not(:disabled)` | `box-shadow: inset 0 0 0 2px var(--bronze-500);` | - |
| `.equip-button` | `font-weight: 700;` `color: var(--parchment-100);` `background: var(--btn-bg);` `background-color: var(--wood-800);` `border: 2px solid var(--bronze-500);` `box-shadow: var(--btn-shadow);` | - |
| `.equip-button:hover:not(:disabled)` | `filter: brightness(1.15);` | `background` |
| `.equip-button[data-testid="piece-refine"]` | `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-700);` `border-color: var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |
| `.equip-button[data-testid="piece-refine"]:hover:not(:disabled)` | `filter: brightness(1.15);` | `background` |
| `.leader-stats` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.leader-stats-title` | `font-weight: 700;` | - |
| `.piece-tile` | `background: var(--wood-800);` | - |
| `.piece-tooltip` | `border-radius: var(--radius-md);` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: 2px solid var(--wood-600);` `box-shadow: 0 0 0 1px var(--bronze-500), var(--shadow-lg);` | - |
| `.piece-tooltip-title` | `font-weight: 700;` | - |
| `.equip-notice` | `color: var(--parchment-100);` `border: 1px solid var(--bronze-500);` `background: var(--wood-800);` | - |
| `.bulk-sell-bar` | `border: var(--inset-border);` `background: var(--parchment-300);` `box-shadow: none;` | - |
| `.bulk-sell-yes` | `color: var(--parchment-100);` `background: var(--btn-primary-bg);` `background-color: var(--ember-700);` `border-color: var(--gold-400);` `box-shadow: var(--btn-shadow);` | - |
| `.bulk-sell-yes:hover:not(:disabled)` | `filter: brightness(1.15);` | `background` |

The rarity rules (`.piece-tile.rarity-*`, the EPIC and LEGENDARY effects, `@keyframes`, the reduced motion block), `.piece-tile.is-empty`, the selection, lock and drag rules do not change (`dragEquip.spec.js` reads their opacity).

**Steps**:

1. Edit the seventeen rules.

**Tests**: none - CSS; T28 asserts the tile and tooltip values; `dragEquip.spec.js`, `bulkSell.spec.js` and `equipmentUi.spec.js` guard the behaviour.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The build passes; `git diff game/public/style.css` touches no `rarity`, `is-dragging`, `drag-ghost`, `is-selected` or `is-locked` rule.

**Commit**: `style(game): draw the equipment screen in the grove look`

---

### T24: Talent columns and cards [x]

**Owner**: game-dev
**What**: The Talentos screen of UIR-13 AC 4 and UIR-14 AC 9.
**Where**: `game/public/style.css` (section `/* ══ Talentos`)
**Read first**: `style.css:1624-1741`
**Depends on**: T23
**Requirement**: UIR-14

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.talent-points` | `font-weight: 700;` | - |
| `.talent-column` | `border: var(--inset-border);` `border-radius: var(--radius-md);` `background: var(--parchment-300);` | - |
| `.talent-branch-title` | `font-weight: 700;` | - |
| `.talent-card` | `border-radius: 6px;` `background: var(--parchment-100);` `box-shadow: inset 4px 0 0 var(--branch), 0 1px 0 rgb(90 61 38 / 0.25);` | - |
| `.talent-grade-title` | `font-weight: 700;` | - |

The four `--branch` colours, `.talent-upgrade` and `.talent-reset` do not change.

**Steps**:

1. Edit the five rules.

**Tests**: none - CSS; T28 asserts the talent card background; `talents.spec.js` guards the behaviour.
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The build passes.

**Commit**: `style(game): draw the talent tree in the grove look`

---

### T25: Framed chapter map [x]

**Owner**: game-dev
**What**: The `Rever chefes` map gets a wood ring and a bronze ring without changing its size (UIR-14 AC 10).
**Where**: `game/public/style.css` (section `/* ══ Rever chefes`)
**Read first**: `style.css:2259-2290`; `game/e2e/bossMap.spec.js:78-100` (the map keeps 880 x 495)
**Depends on**: T24
**Requirement**: UIR-14

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.farm-map-title` | `font-weight: 700;` `color: var(--ink-900);` | - |
| `.farm-map` | `box-shadow: 0 0 0 3px var(--wood-600), 0 0 0 5px var(--bronze-500), 0 10px 28px rgb(0 0 0 / 0.55);` | - |

Rings are shadows, not a border, so the map keeps its 880 x 495 layout box and the stop positions (`mapLayout.js`) stay where they are.

**Steps**:

1. Edit the two rules.

**Tests**: none - CSS; `bossMap.spec.js` guards the size; T28 asserts the rings.
**Gate**: build - `cd game && npm test && npm run build`, then `cd game && npx playwright test e2e/bossMap.spec.js`
**Done when**:

- [x] The build passes and `bossMap.spec.js` passes unchanged.

**Commit**: `style(game): frame the chapter map`

---

### T26: Element wheel and skill tooltip on parchment [x]

**Owner**: game-dev
**What**: The element wheel card and the skill tooltip in the Grove recipes (UIR-14 AC 8, 11; Q3 default: the wheel stays).
**Where**: `game/public/style.css`
**Read first**: `style.css:1438-1605`
**Depends on**: T25
**Requirement**: UIR-14

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.element-wheel` | `border-radius: 10px;` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `box-shadow: 0 0 0 3px var(--wood-600), 0 0 0 5px var(--bronze-500), inset 0 0 22px rgb(138 90 43 / 0.45), var(--shadow-lg);` | - |
| `.wheel-title` | `font-weight: 700;` `color: var(--ink-900);` | - |
| `.wheel-name` | `color: var(--ink-900);` | - |
| `.wheel-arrow-label` | `color: var(--parchment-100);` `background: var(--ember-800);` | - |
| `.wheel-vs-triad` (the second rule, the one with `border-radius`) | `background: var(--parchment-300);` | - |
| `.skill-tooltip` | `border-radius: var(--radius-md);` `background: var(--panel-bg);` `background-color: var(--parchment-200);` `border: 2px solid var(--wood-600);` `box-shadow: 0 0 0 1px var(--bronze-500), var(--shadow-lg);` | - |

The wheel gets rings as shadows, not a border, so the arrows that `elementWheel.js` places in px keep their positions.

**Steps**:

1. Edit the six rules.

**Tests**: none - CSS; T28 asserts the wheel and tooltip values.
**Gate**: build, then full (phase gate) - `cd game && npm test && npm run build && npx playwright test`
**Done when**:

- [x] The build and every Vitest and Playwright suite pass unchanged.

**Commit**: `style(game): draw the element wheel and skill tooltip on parchment`

---

### T27: Gemini prompts for the parchment and wood textures [x]

**Owner**: game-dev
**What**: `PROMPTS_ASSETS_UI.md` gains section 5 with the two texture prompts and their activation lines (UIR-17).
**Where**: `PROMPTS_ASSETS_UI.md`
**Read first**: `PROMPTS_ASSETS_UI.md:1-20`, `:300-325`; design § Gemini Prompts (the exact text)
**Depends on**: T26
**Requirement**: UIR-17

**Contract**:

1. Before starting, run `git status --short PROMPTS_ASSETS_UI.md`; if it prints anything, STOP and report (the owner has uncommitted edits).
2. Insert the whole block of design § Gemini Prompts (from `## 5. Texturas da interface` to the end of the second prompt) right before the line `## Checklist de arquivos`, followed by a line `---` and an empty line.
3. In the table of `## Checklist de arquivos`, add the last row: ``| `ui-parchment.jpg`, `ui-wood.jpg` | JPG 1:1, 512×512, repetível | textura inteira (seção 5) |``.
4. In the intro line that starts with `Total:`, replace it with `Total: **1 mapa + 4 ícones de equipamento + 10 ícones de talento + 20 ícones dos graus 2 e 3 + 2 texturas = 37 imagens.**`

**Steps**:

1. Check the file status.
2. Make the three edits.

**Tests**: none - documentation.
**Gate**: `grep -c "ui-parchment.jpg" PROMPTS_ASSETS_UI.md` prints at least `3` and `grep -c "## 5. Texturas da interface" PROMPTS_ASSETS_UI.md` prints `1`.
**Done when**:

- [x] The gate passes; `git diff --stat` lists only `PROMPTS_ASSETS_UI.md` and this file.

**Commit**: `docs(game): add the prompts of the parchment and wood textures`

---

### T28: e2e of the Grove theme [x]

**Owner**: test-engineer
**What**: Browser tests of every acceptance criterion of UIR-01 to UIR-16 and UIR-19 the browser can observe, the spec edge cases included.
**Where**: `game/e2e/uiRedesign.spec.js` (new)
**Read first**: `game/e2e/heroAscension.spec.js:1-60` (`startAs`, `colorOf`, imports from `./support/coverage`); `game/e2e/autoClick.spec.js:1-30` (chapter 2 start); `game/e2e/clickPower.spec.js:1-60` (clicking the monster, COMBO talent); `game/e2e/talents.spec.js:60-70` (`talentPoints`); `game/e2e/bossMap.spec.js:1-60` (opening the map); `game/ui-review/bulkSell.shots.js:1-20` (equipment pieces); spec (all); design § Palette, § Contrast
**Depends on**: T27
**Requirement**: UIR-01, UIR-02, UIR-03, UIR-04, UIR-05, UIR-06, UIR-07, UIR-08, UIR-09, UIR-10, UIR-11, UIR-12, UIR-13, UIR-14, UIR-15, UIR-16, UIR-19

**Contract**: one `test.describe('Grove theme')`. Import `test` and `expect` from `./support/coverage`. Helpers:

```js
const bare = (element, physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });
const chapter = (monster) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
});
//  startAs(page, { monster = bare('FIRE'), copies = { 'kael:3': 1 }, leader = 'kael', progress = {}, talents, talentPoints, equipment, random })
//  mockBackend(page, { users: { yan: 'secret123' }, definition: chapter(monster), cards: { yan: { leader, copies } }, progress: { yan: progress }, ... })
//  every per-player option is wrapped under the user: talents: { yan: talents }, talentPoints: { yan: talentPoints }, equipment: { yan: equipment }
//  then openMainMenu(page, { random }), login, canvas click, wait for ClickerGame (as heroAscension.spec.js)
const css = (locator, props, pseudo = null) => locator.evaluate((node, [ names, p ]) => {
    const style = getComputedStyle(node, p);
    return Object.fromEntries(names.map((name) => [ name, style.getPropertyValue(name) ]));
}, [ props, pseudo ]);
//  WCAG 2.x contrast of two 'rgb(...)' or 'rgba(...)' strings (alpha ignored)
const ratio = (a, b) => { /* relative luminance of each, (L1 + 0.05) / (L2 + 0.05) */ };
//  Share of pixels with min(R, B) - G >= 110 of a loaded <img>, drawn at natural size
const magentaShare = (img) => img.evaluate((node) => { /* canvas drawImage, getImageData, count */ });
```

**Steps**:

1. Write the helpers and the scenarios below, one `test()` each.
2. Run the file twice in a row; both runs pass.
3. Run the whole Vitest and Playwright suites.

**Tests**: e2e
**Test cases** (exact expected values; `css()` returns computed strings):

Foundation (UIR-01 to UIR-03):

- `loads Cinzel and never requests Caprasimo` (UIR-01 AC 1, 3): record every request URL from `page.on('request')`; after the main menu and opening Heróis, `document.fonts.check('700 16px Cinzel')` is true, no URL contains `Caprasimo`, and `.hero-title` `font-family` starts with `Cinzel`.
- `paints the letterbox in dark wood` (UIR-01 AC 4): `body` `background-color` is `rgb(28, 18, 12)`.
- `requests no texture file while the texture tokens are none` (UIR-01 AC 5): during login and opening Heróis, no request URL contains `ui-parchment.jpg` or `ui-wood.jpg`; `.hero-window` `background-image` does not contain `url(`.
- `draws the parchment texture as the top layer once its token is set` (UIR-01 AC 6): route `**/assets/ui-parchment.jpg` to a 1 x 1 PNG; `page.addStyleTag({ content: ':root { --texture-parchment: url("assets/ui-parchment.jpg"); }' })`; open Heróis; `.hero-window` `background-image` starts with `url(` and contains `ui-parchment.jpg`.
- `draws Fechar as a wood pill` (UIR-02 AC 7): open Heróis; `hero-close`: `background-color` `rgb(43, 29, 20)`, `border-top-width` `2px`, `border-top-color` `rgb(176, 122, 58)`, `color` `rgb(244, 230, 200)`, `border-top-left-radius` `999px`.
- `draws Fundir as an ember pill` (UIR-02 AC 8): copies `{ 'kael:1': 3 }`; open Fusão; `fusion-button-kael-1`: `background-color` `rgb(168, 67, 26)`, `border-top-color` `rgb(224, 180, 90)`, `color` `rgb(244, 230, 200)`.
- `brightens a hovered button and darkens a pressed one` (UIR-02 AC 9, 10): hover `hero-close`: `filter` `brightness(1.15)`; `page.mouse.down()`: `brightness(0.9)`; `page.mouse.up()` after.
- `keeps a disabled button at opacity 0.45` (UIR-02 AC 11): `progress: { chapter: 2 }`; click `auto-click-button`; `auto-click-upgrade` is disabled and its `opacity` is `0.45`.
- `draws metallic coins` (UIR-02 AC 12): `.wallet .coin-gold` `::before` `background-image` contains `rgb(255, 241, 176)`, `width` `20px`; `.coin-silver` contains `rgb(201, 204, 209)`; `.coin-copper` contains `rgb(184, 101, 45)`.
- `rings the focused control in ember` (UIR-03 AC 13): press `Tab` up to 40 times until `document.activeElement` is a rail button (`data-testid` starts with `hud-`); its `outline-style` `solid`, `outline-width` `3px`, `outline-color` `rgb(204, 78, 26)`, `outline-offset` `2px`.
- `meets 4.5:1 on the eight contrast pairs of the design` (UIR-03 AC 14): for rows 1 to 8 of design § Contrast, read the text `color` and the background's `background-color` and assert `ratio >= 4.5`; also assert the exact colours of each row (e.g. row 1: `rgb(42, 26, 16)` on `rgb(234, 214, 173)`). Row 7 is `.skill-row.is-locked` (its own `color` on its own `background-color`, `rgb(87, 75, 62)` on `rgb(234, 214, 173)`).
- `adds no animation or transition to buttons, rail and timer` (UIR-03 AC 15): `hero-close`, `hud-heroes`, `auto-click-button` (chapter 2) and, in a miniboss fight, `.boss-timer`: `animation-name` `none`, `transition-duration` `0s`.

Battle HUD (UIR-04 to UIR-12):

- `draws the stage plaque, chapter tag and wallet scroll` (UIR-04 AC 1 to 3): `.stage-hud`: `background-color` `rgb(234, 214, 173)`, `border-top-width` `3px`, `border-top-color` `rgb(90, 61, 38)`, `border-top-left-radius` `6px`, `font-family` starts with `Cinzel`, `font-weight` `700`, `font-size` `19px`, `color` `rgb(42, 26, 16)`; `chapter-hud`: same background, `2px`, radius `4px`, `16px`; `.wallet`: same as `.stage-hud`.
- `draws the combo as an ember chip` (UIR-04 AC 4): `talents: { COMBO: 10 }`; click the monster 3 times as in `clickPower.spec.js`; `combo-hud` `background-color` `rgb(138, 53, 16)`, `border-top-color` `rgb(224, 180, 90)`, `color` `rgb(244, 230, 200)`, `font-size` `20px`.
- `draws a stage message in gold with a dark stroke` (UIR-04 AC 5): after `mockBackend`, `page.route('**/api/progress', (route) => route.fulfill({ status: 500 }))`; `.stage-message` reads `Could not load progress`; `color` `rgb(255, 211, 92)`, `-webkit-text-stroke-color` `rgb(42, 20, 8)`, `-webkit-text-stroke-width` `10px`, `font-size` `52px`.
- `draws a notice as a dark plaque` (UIR-04 AC 6): `page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.showNotice('Carta: Lyra Folhaveloz'))`; `card-notice`: `background-color` `rgb(43, 29, 20)`, `color` `rgb(243, 213, 138)`, `font-size` `22px`.
- `keeps the health bar 240 x 16 in its new colours with a framed box` (UIR-05 AC 8 to 10): `page.evaluate` on the scene: `healthFill.fillColor` is `0xc0392b`, `monsterParts[1].fillColor` is `0x2a1410`, `healthFill.width` 240, `healthFill.height` 16; `.hud-monster-hp` `box-shadow` contains `rgb(28, 18, 12) 0px 0px 0px 2px` and `rgb(176, 122, 58) 0px 0px 0px 4px`; `monster-hp` text `HP 1000/1000`, `font-weight` `800`, `color` `rgb(255, 244, 220)`.
- `draws a normal damage number in gold Cinzel` (UIR-05 AC 11): click the monster once; the last Phaser `Text` of the scene (`scene.children.list.filter((child) => child.type === 'Text').at(-1).style`) has `fontFamily` `Cinzel`, `fontStyle` `700`, `color` `#ffd35c`, `fontSize` `32px`, `stroke` `#2a1408`, `strokeThickness` 8.
- `draws a critical damage number in orange Cinzel` (UIR-05 AC 12): `random: 0`; same read: `color` `#ff8a1f`, `fontSize` `48px`.
- `draws the boss timer pill with a ring that empties` (UIR-06 AC 13, 14): `progress: { stage: 1, encounter: 'MINIBOSS', phase: 1 }`; `.boss-timer` text matches `/^Time: \d+$/`, `background-color` `rgb(43, 29, 20)`, `color` `rgb(243, 213, 138)`, `font-size` `20px`; `::before` `width` `32px`; `--timer-left` (`node.style.getPropertyValue`) parses to a number in `(0.9, 1]`; after `expect.poll` 2 s later it is smaller than the first reading and above `0.9`.
- `removes the ring property when the fight is left` (UIR-06 AC 15): in the miniboss fight press `Escape`, click `.pause-leave`, then `.pause-confirm-yes`; `.boss-timer` text `''` and `--timer-left` `''`.
- `draws the enemy chips with a dot and three icons, text unchanged` (UIR-07): `bare('NATURE', 10, 20, 30)`; `.enemy-stats` text `Nature  Physical def 10%  Magical def 20%  Crit res 30%` and `background-color` `rgba(0, 0, 0, 0)`; `.tag-element` `data-element` `NATURE`, `::before` `background-color` `rgb(79, 154, 60)`, `width` `10px`; `[data-stat="physical"]` `::before` `background-color` `rgb(176, 122, 58)`, `width` `12px`; `magical` `rgb(63, 143, 209)`; `crit` `rgb(214, 69, 65)`; every `.enemy-stats .tag`: `background-color` `rgba(28, 18, 12, 0.85)`, `border-top-color` `rgb(176, 122, 58)`, `color` `rgb(244, 230, 200)`.
- `shows Fraco: Água for FIRE, Fraco: Natureza for WATER, Fraco: Fogo for NATURE` (UIR-08 AC 1 to 3, 6): three starts with `bare('FIRE')`, `bare('WATER')`, `bare('NATURE')`; `weak-chip` text and `data-element` `WATER`, `NATURE`, `FIRE`; for FIRE its `::before` `background-color` is `rgb(63, 143, 209)`.
- `shows no weak element for LIGHT and DARKNESS` (UIR-08 AC 4, edge case): starts with `bare('LIGHT')` and `bare('DARKNESS')`; `weak-chip` is hidden and its text `''`.
- `keeps the weak chip and the enemy line clear of the bar and the rail` (UIR-08 AC 7): the bounding boxes of `weak-chip` and `.enemy-stats` do not intersect the boxes of `.battle-bar` and `.hero-hud`.
- `draws the rail as framed wood squares on parchment` (UIR-09 AC 20, 21, edge case): `.hero-hud` `background-color` `rgb(234, 214, 173)`, `border-top-width` `3px`, radius `10px`; the seven `hud-*` buttons in order `heroes, bag, fusion, leader, equipment, talents, farm` with labels `Heróis, Mochila, Fusão, Líder, Equipamento, Talentos, Rever chefes`; each `offsetWidth` 76 and `offsetHeight` 60, `background-color` `rgb(43, 29, 20)`, `border-top-color` `rgb(176, 122, 58)`, radius `6px`, `color` `rgb(244, 230, 200)`, its `svg` `color` `rgb(224, 180, 90)`, and `scrollWidth <= clientWidth`.
- `draws the talents badge as an ember dot with dark text` (UIR-09 AC 22): `talentPoints: 1`; `talents-badge` visible, `background-color` `rgb(232, 116, 42)`, `color` `rgb(42, 26, 16)`.
- `draws the battle bar, leader card and skill frames` (UIR-10 AC 23 to 26): `.battle-bar` `offsetWidth` 984, `offsetHeight` 124, `background-color` `rgb(234, 214, 173)`, radius `12px`; `leader-card` `offsetWidth` 240, `offsetHeight` 104, `background-color` `rgb(43, 29, 20)`, `border-top-color` `rgb(176, 122, 58)`; `.leader-face` `box-shadow` contains `rgb(224, 180, 90) 0px 0px 0px 3px`; `.leader-name` `font-size` `17px`, `color` `rgb(243, 213, 138)`; `.leader-bonus` `color` `rgb(244, 230, 200)`; `skill-slot-1 img`: `offsetWidth` 150, `offsetHeight` 62, `border-top-width` `2px`, `border-top-color` `rgb(176, 122, 58)`, radius `8px`, `background-color` `rgb(28, 18, 12)`, `box-shadow` contains `rgb(224, 180, 90) 0px 0px 0px 2px`; `skill-key-1`: `offsetWidth` 20, `background-color` `rgb(28, 18, 12)`, `border-top-color` `rgb(224, 180, 90)`, `color` `rgb(243, 213, 138)`.
- `draws the lock mark of a locked skill in gold on dark` (UIR-10 AC 27): copies `{ 'kael:1': 1 }`; `skill-slot-2 .skill-lock-mark`: `background-color` `rgba(28, 18, 12, 0.85)`, `color` `rgb(224, 180, 90)`.
- `shows the dark frame behind a skill image that fails to load` (edge case UIR-10): `page.route('**/assets/heroes/kael_charge.jpg', (route) => route.abort())`; `skill-slot-2 img` `background-color` `rgb(28, 18, 12)`.
- `draws the auto click window on parchment with a green switch when on` (UIR-11 AC 29): `progress: { chapter: 2 }`; click `auto-click-button`; `auto-click-popover` `background-color` `rgb(234, 214, 173)`, radius `10px`, `offsetWidth` 240; `auto-click-toggle` checked `background-color` `rgb(63, 143, 58)`; after `uncheck()` `rgb(61, 42, 28)`; `auto-click-upgrade` `background-color` `rgb(168, 67, 26)`.

Round auto click button and its window (UIR-19; `progress: { chapter: 2 }` unless said otherwise):

- `shows the round auto click button in the bar with A and 500 ms, and nothing left of the monster` (AC 1 to 3): `auto-click-button` `offsetWidth` 56, `offsetHeight` 56, `background-color` `rgb(43, 29, 20)`, `background-image` contains `data:image/svg+xml`; `auto-click-key` text `A`, `offsetWidth` 20; `auto-click-rate` text `500 ms`; the button's bounding box lies inside the box of `.battle-bar`; no element with a test id starting `auto-click` has a bounding box whose right edge is left of the monster centre (scene x 670, converted with the canvas box: `canvasBox.x + 670 * canvasBox.width / 1024`) while the window is closed.
- `shows no auto click button in chapter 1` (AC 3): `progress: { chapter: 1 }`; `auto-click-button` hidden; `auto-click-popover` hidden.
- `rings the button green while the auto click is on and bronze when it is off` (AC 4, 5): on: `border-top-color` `rgb(95, 211, 90)`, `box-shadow` contains `rgba(95, 211, 90, 0.75) 0px 0px 14px 4px`; open the window, `uncheck()` the switch, close it with Escape: `border-top-color` `rgb(176, 122, 58)` and `box-shadow` does not contain `95, 211, 90`.
- `opens the window on a click with the focus on the switch` (AC 6, 18): click `auto-click-button`; `auto-click-popover` visible; button `aria-expanded` `true`; `auto-click-toggle` is focused (`toBeFocused()`); window `role` `dialog`, `aria-label` `Auto clique`.
- `opens the window with Enter on the focused button` (AC 6): `auto-click-button` `.focus()`; `page.keyboard.press('Enter')`; window visible.
- `holds the old card's controls in order, the reset from chapter 2` (AC 7): `progress: { chapter: 3 }`; open; inside `auto-click-popover`: `auto-click-toggle` checked, `auto-click-interval` `500 ms`, `auto-click-crystals` `Cristais: 0`, `auto-click-upgrade` `Melhorar: 250 ms (10 cristais)`, `reset-account` `Resetar conta (+3 cristais)`, in this DOM order.
- `opens and closes the window with A, the focus back on the button` (AC 8, 9): `page.keyboard.press('a')`; visible and switch focused; press `a` again; hidden, `aria-expanded` `false`, `auto-click-button` focused.
- `closes the window with Escape without pausing` (AC 9, 10): open; `Escape`; window hidden, `.pause-menu` hidden, button focused; `Escape` again; `.pause-menu` visible.
- `closes the window on a click on the monster, and the click still hits` (AC 11): `const before = await health(page)` (as in `autoClick.spec.js`, with the switch turned off first so only the click hits); open; click the canvas at the monster centre; window hidden; `expect.poll(() => health(page))` below `before`.
- `does not hit the monster when the button or the window is clicked` (AC 19): install the hit counter of `autoClick.spec.js:61-68`; click `auto-click-button`, then `auto-click-toggle`, then `auto-click-button`; the counter is 0.
- `ignores A while a hero screen is open` (AC 14): click `hud-heroes`; press `a`; `auto-click-popover` hidden; close the hero screen; press `a`; visible.
- `ignores A typed into a text field` (AC 12): `page.evaluate` appends `<input type="text" data-testid="probe-field">` to `document.body`; focus it; press `a`; the window stays hidden and the field's value is `a`; remove the field.
- `closes the window when its reset button opens the dialog` (AC 16): `progress: { chapter: 3 }`; open; click `reset-account`; `reset-dialog` visible and `auto-click-popover` hidden.
- `keeps the bar's boxes apart and the window left of the rail` (AC 21): bounding boxes of `.skill-bar-host`, `.hud-auto-click`, `.hud-farm` and `leader-card` do not intersect each other; none intersects `.hero-hud`; each lies inside `.battle-bar`; with the window open (chapter 3, reset shown), the box of `auto-click-popover` lies inside the canvas box and its right edge is left of the left edge of `.hero-hud`.
- `test.describe('on a 390 x 844 phone')` with `test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })` - `keeps the round button and its window inside the scaled scene` (AC 22, edge case): `progress: { chapter: 3 }`; tap `auto-click-button`; the boxes of the button, `auto-click-key`, `auto-click-rate` and `auto-click-popover` lie inside the canvas box; the button's width divided by the canvas width equals `56 / 1024` within 0.002.
- `draws the farm switch as a round skull button with an ember ring when on` (UIR-11 AC 30, 31): `.farm-toggle input` `offsetWidth` 56, `offsetHeight` 56, `background-color` `rgb(43, 29, 20)`, `border-top-width` `3px`, `border-top-color` `rgb(176, 122, 58)`, `background-image` contains `data:image/svg+xml`; `.farm-toggle` `font-size` `12px`, `color` `rgb(42, 26, 16)`, text contains `Farm boss`; then `node.checked = true` by `evaluate` (no event): `border-top-color` `rgb(232, 116, 42)`, `box-shadow` contains `rgba(232, 116, 42, 0.75) 0px 0px 12px 2px`.
- `dims the fight and draws the pause card on parchment` (UIR-12): press `Escape`; `.pause-menu` `background-color` `rgba(28, 18, 12, 0.62)`; `.pause-card` `background-color` `rgb(234, 214, 173)`, `offsetWidth` 420, radius `12px`; `.pause-title` `font-size` `40px`, `color` `rgb(42, 26, 16)`, `font-family` starts with `Cinzel`. Then `Escape`/`1. Continue`, open Heróis: `.hero-panel` `background-color` `rgba(28, 18, 12, 0.62)`.

Hero screens (UIR-13, UIR-14):

- `draws the hero window, title and inset cards` (UIR-13 AC 1, 2, 4, 5): open Heróis; `.hero-window` `background-color` `rgb(234, 214, 173)`, `border-top-width` `3px`, `border-top-color` `rgb(90, 61, 38)`, radius `12px`, `offsetWidth` 920; `.hero-title` `font-size` `30px`, `color` `rgb(42, 26, 16)`; `hero-card-kael`: `background-color` `rgb(230, 208, 162)`, `border-top-width` `1px`, `border-top-color` `rgba(90, 61, 38, 0.45)`, radius `8px`; `hero-card-kael img` `background-image` contains `radial-gradient` and `rgb(90, 61, 38)`.
- `draws the error line in ember` (UIR-13 AC 3): the failed fusion setup of `heroAscension.spec.js` (`a failed 4-star fusion shows the error and keeps the row`); `.hero-error` text `Não foi possível fundir as cartas.`, `background-color` `rgb(138, 53, 16)`, `color` `rgb(244, 230, 200)`.
- `keeps the AD-020 star colours on the inset cards` (UIR-13 AC 6): copies `{ 'kael:5': 1, 'orina:7': 1 }`; `hero-card-kael .hero-stars` `color` `rgb(122, 63, 160)`; `hero-card-orina .hero-stars` `background-color` `rgb(217, 165, 33)`, `color` `rgb(32, 30, 29)`.
- `draws dark piece tiles and a parchment piece tooltip` (UIR-14 AC 7, 8): equipment with one bag piece (shape of `bulkSell.shots.js` `piece()`); open Equipamento; `equip-piece-<id>` `background-color` `rgb(43, 29, 20)`; hover it; `.piece-tooltip` `background-color` `rgb(234, 214, 173)`, `border-top-width` `2px`, `border-top-color` `rgb(90, 61, 38)`, radius `8px`.
- `draws the skill tooltip on parchment` (UIR-14 AC 8): hover `skill-slot-1`; `.skill-tooltip` same four values.
- `draws talent cards on light parchment` (UIR-14 AC 9): open Talentos; the first `.talent-card` `background-color` `rgb(244, 230, 200)`.
- `frames the chapter map with a wood and a bronze ring` (UIR-14 AC 10): open Rever chefes; `farm-map` `box-shadow` contains `rgb(90, 61, 38) 0px 0px 0px 3px` and `rgb(176, 122, 58) 0px 0px 0px 5px`; `offsetWidth` stays 880 (or the room, as in `bossMap.spec.js`).
- `draws the element wheel on parchment` (UIR-14 AC 11): `.element-wheel` `background-color` `rgb(234, 214, 173)`, radius `10px`; `.wheel-title` `font-family` starts with `Cinzel`, `font-weight` `700`.

Main menu (UIR-15):

- `draws the menu oval on parchment with a wood rim` (UIR-15 AC 1): on the main menu, `page.evaluate` over `scene.getScene('MainMenu').children.list` finds one `Ellipse` with `fillColor` `0xead6ad`, `strokeColor` `0x5a3d26`, `lineWidth` 6, at x 170, y 380.
- `draws the login fields on parchment with an ember border when focused` (UIR-15 AC 2): `.auth-form input[name="username"]` `background-color` `rgb(244, 230, 200)`, `border-top-width` `2px`, `border-top-color` `rgb(90, 61, 38)`, `color` `rgb(42, 26, 16)`; after `page.keyboard.press('Tab')` until it is focused, `border-top-color` `rgb(204, 78, 26)`.
- `draws the path choice on parchment with inset options` (UIR-15 AC 3): `Sign up` with a new user; `.path-choice` `background-color` `rgb(234, 214, 173)`; the first `.path-option` `background-color` `rgb(230, 208, 162)`.

Skill thumbnails (UIR-16):

- `shows no magenta in the skill bar` (UIR-16 AC 3): leader kael 3★; for each of the three `skill-slot-<n> img`, wait until `complete && naturalWidth > 0`; `magentaShare` `<= 0.001`.
- `shows no magenta in the detail of any of the five heroes` (UIR-16 AC 3): copies `{ 'kael:3': 1, 'lyra:3': 1, 'orina:3': 1, 'seraphine:3': 1, 'vex:3': 1 }`; open Heróis; for each hero open its card, check the three `.skill-art` images (`<= 0.001`), press `hero-back`.
- `shows no magenta in a bag entry and a skill tooltip` (UIR-16 AC 3): open Mochila, click `bag-entry-lyra-3`, check its `.skill-art` images; close; hover `skill-slot-1`, check the `.skill-tooltip img`.

**Gate**: full - `cd game && npx playwright test e2e/uiRedesign.spec.js` twice in a row, then `cd game && npm test && npx playwright test`
**Done when**:

- [x] Every scenario above passes twice in a row, and the whole Vitest and Playwright suites pass.

**Commit**: `test(game): cover the grove theme in the browser`

---

### T29: Review screenshots of the Grove theme [x]

**Owner**: test-engineer
**What**: `npm run ui:shots -- uiRedesign` writes every screenshot of design § Review Screenshots for desktop and phone (UIR-18).
**Where**: `game/ui-review/uiRedesign.shots.js` (new)
**Read first**: `game/ui-review.config.js`; `game/ui-review/support/shots.js`; `game/ui-review/heroAscension.shots.js` (whole file: `watch`, `report`, `startAs`); `game/ui-review/bulkSell.shots.js:1-80` (equipment, bulk sale); design § Review Screenshots
**Depends on**: T28
**Requirement**: UIR-18

**Contract**: one `test()` per group, each starting with `const problems = watch(page)` and ending with `report(testInfo, '<group>', problems)` (copy both helpers from `heroAscension.shots.js`). Use `shot(page, testInfo, '<NN>-<name>')` with the exact names of the design table; move the mouse to `(0, 0)` before every shot that is not a hover state.

| Test | Setup | Shots |
| --- | --- | --- |
| `menu and preloader` | `mockBackend` with `users: { yan: 'secret123' }`; before `page.goto('/')`, hold `**/assets/heroes/vex_sprite.png` with a route that awaits a promise; click the canvas; shot `01-preloader` once the Preloader scene is active; release the route | `01-preloader`, `02-menu-login` (focus the username field with Tab), `03-menu-welcome` (after login), `04-path-choice` (on a fresh page: `Sign up` with user `novo` / `secret123`) |
| `battle` | `chapter(bare('FIRE', 10, 20, 30))`, `progress: { yan: { chapter: 3, stage: 1, encounter: 'MINIBOSS', phase: 1 } }` (chapter 3, so the window shows the reset button), `talents: { yan: { COMBO: 10 } }`, copies `{ 'kael:3': 1 }`; wait 2 s in the fight | `05-battle-boss`; five canvas clicks on the monster then `06-battle-combo`; hover `skill-slot-1` then `09-skill-tooltip`; `heroUi.showNotice('Carta: Lyra Folhaveloz')` then `10-notice`; `Escape` then `11-pause`; `1. Continue`; press `a` (window opens, switch focused) then `14-auto-click-window`; click `reset-account` then `12-reset-dialog`; `Cancelar`; set `.farm-toggle input` `checked = true` by `evaluate` then `13-farm-on`; press `a`, `uncheck()` `auto-click-toggle`, press `Escape`, then `15-auto-click-off` |
| `light enemy and locked skills` | `chapter(bare('LIGHT'))`, copies `{ 'kael:1': 1 }` | `07-battle-light`, `08-battle-locked` |
| `hero screens` | copies `{ 'kael:5': 1, 'kael:1': 3, 'lyra:4': 1, 'orina:7': 1, 'seraphine:2': 1, 'vex:6': 1 }`, equipment of `bulkSell.shots.js` (`WORN` and `BAG`), `talentPoints: { yan: 3 }` | `20-heroes`; Kael card `21-hero-detail`; Mochila `22-bag`; a bag entry `23-bag-detail`; Fusão `24-fusion`; Líder `26-leader`; Equipamento `27-equipment`; hover `equip-piece-b1` `28-piece-tooltip`; `bulk-sell-start` and three tiles `29-bulk-sell`; Talentos `30-talents`; Rever chefes `31-boss-map` |
| `fusion error` | copies `{ 'kael:4': 3 }`; open Fusão; route `**/api/heroes/*/fuse` to status 500; click `fusion-button-kael-4` | `25-fusion-error` |

**Steps**:

1. Write the file.
2. Run `cd game && npm run ui:shots -- uiRedesign`.
3. Check that `.specs/features/ui-redesign/ui-review/` holds 54 files (27 names x 2 projects).

**Tests**: none - screenshots for the review, not a test of the game; never part of the e2e suite.
**Gate**: `cd game && npm run ui:shots -- uiRedesign` passes and `ls .specs/features/ui-redesign/ui-review/*.png | wc -l` prints `54`.
**Done when**:

- [x] The gate passes; every `CONSOLE-REPORT` line reads `clean` (any other line goes into the commit message body).
- [x] The commit holds the script and the 54 screenshots.

**Commit**: `test(game): screenshot the grove theme for the ui review`

---

### T30: Visual review of the Grove theme [x]

**Owner**: ui-artist
**What**: Review every restyled screen against `reference.jpg` and the design, on desktop and phone, and write the findings (UIR-01 to UIR-18).
**Where**: `.specs/features/ui-redesign/ui-review.html` (new; the template is under **Read first**)
**Read first**: `.claude/templates/ui-review.html` (the report template); `.specs/features/ui-redesign/reference.jpg`; spec (all); design § Palette, § Contrast, § Recipes, § Screen Map, § Layout, § Auto click button and window; the 54 screenshots of T29
**Depends on**: T29
**Requirement**: UIR-01, UIR-02, UIR-03, UIR-04, UIR-05, UIR-06, UIR-07, UIR-08, UIR-09, UIR-10, UIR-11, UIR-12, UIR-13, UIR-14, UIR-15, UIR-16, UIR-17, UIR-18, UIR-19

**Steps**:

1. Compare each screenshot with the reference: parchment panels, dark wood frames with bronze rings, Cinzel headings, gold numbers, chips with icons, round farm button, framed rail and skills. Name every place where the cream look of before survives.
2. Check the 15 skill thumbnails (shots `21`, `23`, `05`, `09`): no magenta, no purple effect lost to the cutout.
3. Audit contrast rows 9 to 16 of design § Contrast and any text the table does not list (talent upgrade buttons on their branch colours included).
4. Check the phone shots: nothing cut off, nothing overlapping.
5. Check the auto click against the mock-up's round button and popover (shots `05`, `14`, `15`, `12`): green glow on, bronze off, `A` badge readable, the window's tail pointing at the button, the window clear of the hero rail, the focus ring visible on the switch in `14`.
6. Write `ui-review.html` with a verdict (OK or CHANGES) and one numbered finding per problem (screen, selector, what is wrong, the exact fix). The orchestrator turns each finding into a new task appended to this file.

**Tests**: none - a visual review produces no code.
**Gate**: `test -s .specs/features/ui-redesign/ui-review.html`
**Done when**:

- [x] `ui-review.html` exists with a verdict and covers steps 1 to 5.

**Commit**: `docs(ui-redesign): add the ui review`

---

### Review fixes: notes for Phase 10

The T30 review (`.specs/features/ui-redesign/ui-review.html`, verdict "MUDANÇAS PEDIDAS") found 9 problems. T31 to T36 fix findings 1 to 5 and 9, T37 fixes finding 8 and adds the shots of the states nobody judged, T38 reviews again. Findings 6 and 7 are deferred (end of this phase). The ACs these tasks implement were added to `spec.md` with these tasks: UIR-10 AC 24 (amended), UIR-13 AC 12 and 13, UIR-14 AC 14 and 15, UIR-15 AC 5.

Rules added for this phase:

- **Line numbers drift.** Every `path:line` below is a hint from HEAD `39a58c8`; find the rule or line by its selector or its exact text, never by the number.
- The new e2e cases go into `game/e2e/uiRedesign.spec.js`, inside `test.describe('Grove theme', ...)`, right after the test the task names. They use the helpers already at the top of that file (`startAs`, `openScreen`, `css`, `expectStyle`, `ratio`, `inside`); add no helper unless the task gives its code.
- The phase gate (`cd game && npm test && npm run build && npx playwright test --workers=2`) runs on T36, the last task that changes game code; T37 and T38 change no game code.
- Measurements quoted below come from Chromium with the real `style.css` and the Google Fonts Cinzel 700 and Figtree, the same browser as the e2e suite. If a size assertion fails by 2 px or less, STOP and report the measured value; do not change the values of the contract.

---

### T31: Scope the battle leader name so the Líder rows keep their ink [x]

**Owner**: game-dev
**What**: The names of the `Líder` screen rows read `rgb(42, 26, 16)` again (review finding 1, blocker; spec UIR-13 AC 12).
**Where**: `game/public/style.css` (the rule `.leader-name`, in the block that starts with the comment `/* The leader on the left of the battle bar */`)
**Also changes**: `game/e2e/uiRedesign.spec.js`
**Read first**: `style.css:1185-1207` (`.leader-text`, `.leader-name`, `.leader-bonus`); `style.css:1568-1636` (`.leader-entry` shares the row rule with `.bag-entry`, `.fusion-row`, `.farm-entry`); `game/src/adapters/phaser/views/leaderView.js:13`; `game/src/adapters/phaser/views/skillBar.js:108-113`
**Depends on**: T30
**Requirement**: UIR-13

**Root cause** (found by the PO, not a guess): the class `leader-name` is used twice. `skillBar.js:113` puts it on the name of the battle bar's leader card; `leaderView.js:13` puts it on the name `<span>` inside every `.leader-entry` row. The battle card rule `.leader-name` is unscoped, so it reaches the rows: it sets `color: var(--gold-200)` (`#f3d58a`, 1.06:1 on `#e6d0a2`, 1.16:1 on `#f4e6c8`), plus `font-size: 17px`, `white-space: nowrap` and `text-overflow: ellipsis`, on the span itself, which beats the colour the span would inherit from `.leader-entry` (`color: var(--color-text)`). It hits the current row too (shot `26-leader`: `Kael Raizférrea 5★` is gold as well). The rule existed before the redesign without a colour (`92abd66`), so the clash was invisible until T13 (`03fe846`) added `color: var(--gold-200)`.

**Contract**: in `game/public/style.css`, change only the selector line of that rule: `.leader-name {` becomes `.leader-card .leader-name {`. It is the only rule whose selector is `.leader-name`; its declarations stay as they are (T32 changes them). Nothing else in the file changes: the rows then inherit `font-family: var(--font-heading)`, `font-size: 18px` and `color: var(--color-text)` (`#2a1a10`) from `.leader-entry`. Do not add a rule for `.leader-entry .leader-name`.

**Steps**:

1. Edit the selector.
2. Add the e2e case below right after the test `keeps the AD-020 star colours on the inset cards`.

**Tests**: e2e
**Test cases** (`uiRedesign.spec.js`):

- `draws the Líder rows in dark ink, the current one too` (UIR-13 AC 12):

```js
    test('draws the Líder rows in dark ink, the current one too', async ({ page }) => {
        await startAs(page, { copies: { 'kael:5': 1, 'lyra:4': 1 } });
        await openScreen(page, 'leader');

        //  Kael leads, so his row is the current one (parchment-100); Lyra's row is an inset card (parchment-300)
        for (const [ hero, background ] of [ [ 'kael', 'rgb(244, 230, 200)' ], [ 'lyra', 'rgb(230, 208, 162)' ] ])
        {
            const row = page.getByTestId(`leader-entry-${hero}`);
            const { color, 'font-size': size } = await css(row.locator('.leader-name'), [ 'color', 'font-size' ]);
            const { 'background-color': back } = await css(row, [ 'background-color' ]);

            expect(color).toBe('rgb(42, 26, 16)');
            expect(size).toBe('18px');
            expect(back).toBe(background);
            expect(ratio(color, back)).toBeGreaterThanOrEqual(4.5);
        }
    });
```

The existing case `draws the battle bar, leader card and skill frames` keeps passing unchanged (`.leader-name` there matches only the battle card, since no hero screen is open).

**Gate**: build - `cd game && npm test && npm run build`, then `cd game && npx playwright test e2e/uiRedesign.spec.js e2e/heroes.spec.js`
**Done when**:

- [x] `grep -c "^\.leader-name {" game/public/style.css` prints `0` and `grep -c "^\.leader-card \.leader-name {" game/public/style.css` prints `1`.
- [x] The new case passes; every case of `uiRedesign.spec.js` and `heroes.spec.js` passes; `npm test` and the build pass.

**Commit**: `fix(game): scope the leader name rule to the battle card`

---

### T32: Show the whole leader name in the battle card [x]

**Owner**: game-dev
**What**: The leader card name wraps to two lines at 15 px instead of being cut with `…` (review finding 3; spec UIR-10 AC 24, amended).
**Where**: `game/public/style.css` (the rule `.leader-card .leader-name` of T31)
**Also changes**: `game/e2e/uiRedesign.spec.js`
**Read first**: `style.css:1128-1207` (`.leader-card` 240 x 104, padding `10px 12px`, border 2 px; `.leader-portrait` 72 px; gap 12 px; `.leader-text`); `game/e2e/uiRedesign.spec.js:619-628`; `game/e2e/heroes.spec.js:147-166` (picking a leader while the `Líder` screen stays open)
**Depends on**: T31
**Requirement**: UIR-10

**Decision and measurements**: the text column of the card is 128 px wide (240 - 2 x 2 border - 2 x 12 padding - 72 portrait - 12 gap). Measured widths of the longest word of each name in Cinzel 700: at 17 px `Brumaestrela` 129 px and `Sombraespinho` 144 px (do not fit even on their own line); at 16 px `Sombraespinho` 135 px (does not fit); at 15 px every word fits, the widest being `Sombraespinho` at 127 px. So the name drops to 15 px and wraps; the card keeps 240 x 104. With the 15 px name the whole text block (name 33 px in two lines, 2 px gap, bonus up to 58 px for Vex) stays inside the card (6 px from its top and bottom edges for Vex).

**Contract**: replace the rule `.leader-card .leader-name` with:

```css
.leader-card .leader-name {
    font-family: var(--font-heading);
    font-size: 15px;
    line-height: 1.1;
    font-weight: 700;
    color: var(--gold-200);
}
```

(`overflow: hidden`, `white-space: nowrap` and `text-overflow: ellipsis` are removed; the name wraps at the space.)

**Steps**:

1. Replace the rule.
2. In the existing case `draws the battle bar, leader card and skill frames`, replace the line `await expectStyle(page.locator('.leader-name'), { 'font-size': '17px', color: 'rgb(243, 213, 138)' });` with `await expectStyle(page.locator('.leader-card .leader-name'), { 'font-size': '15px', color: 'rgb(243, 213, 138)' });` (the spec value changed; the test keeps its name).
3. Add the e2e case below right after `draws the battle bar, leader card and skill frames`.

**Tests**: e2e
**Test cases** (`uiRedesign.spec.js`):

- `shows the whole leader name in the battle card for each of the five heroes` (UIR-10 AC 24):

```js
    test('shows the whole leader name in the battle card for each of the five heroes', async ({ page }) => {
        const names = { kael: 'Kael Raizférrea', lyra: 'Lyra Folhaveloz', orina: 'Orina Brumaestrela', seraphine: 'Seraphine Aurora', vex: 'Vex Sombraespinho' };

        await startAs(page, { copies: Object.fromEntries(Object.keys(names).map((hero) => [ `${hero}:3`, 1 ])) });
        await openScreen(page, 'leader');

        for (const [ hero, name ] of Object.entries(names))
        {
            //  The Líder screen stays open after a pick; Kael is already the leader, so his click changes nothing
            await page.getByTestId(`leader-entry-${hero}`).click();
            await expect(page.getByTestId(`leader-entry-${hero}`)).toHaveClass(/is-current/);

            const label = page.locator('.leader-card .leader-name');

            await expect(label).toHaveText(name);
            await expectStyle(label, { 'font-size': '15px', 'white-space': 'normal', 'text-overflow': 'clip' });

            const fit = await label.evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth, height: node.offsetHeight }));

            expect(fit.scroll).toBeLessThanOrEqual(fit.client);
            //  Two lines of 15 px x 1.1 at most
            expect(fit.height).toBeLessThanOrEqual(34);
            expect(inside(await page.locator('.leader-card .leader-text').boundingBox(), await page.getByTestId('leader-card').boundingBox())).toBe(true);
            expect(await page.getByTestId('leader-card').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 240, 104 ]);
        }
    });
```

**Gate**: build - `cd game && npm test && npm run build`, then `cd game && npx playwright test e2e/uiRedesign.spec.js`
**Done when**:

- [x] The new case passes for all five heroes and the edited case passes with `15px`.
- [x] Every case of `uiRedesign.spec.js` passes; `npm test` and the build pass.

**Commit**: `fix(game): wrap the leader name of the battle card at 15 px`

---

### T33: Keep the skill art and its text inside the skill tooltip [x]

**Owner**: game-dev
**What**: The skill tooltip shows a 112 x 64 art and the whole skill text inside its parchment box (review finding 2, blocker; spec UIR-14 AC 14).
**Where**: `game/public/style.css` (the five slot `img` rules after `.skill-bar`, and one new rule after the tooltip's `is-below` rule)
**Also changes**: `game/e2e/uiRedesign.spec.js`
**Read first**: `style.css:1214-1266` (`.skill-slot` and its five `img` rules); `style.css:1495-1527` (`.skill-row`, `.skill-row.is-locked`, `.skill-row.is-locked .skill-art`, `.skill-art`); `style.css:1918-1945` (`.skill-tooltip`); `game/src/adapters/phaser/views/skillTooltip.js` (the tooltip is a child of the slot); `game/src/adapters/phaser/views/skillBar.js:28-33` (the slot's own art is its direct child `img`); `game/src/adapters/phaser/views/catalogView.js:11-36` (`renderSkillRow`: `div.skill-row` > `img.skill-art` + text `div`)
**Depends on**: T32
**Requirement**: UIR-14

**Root cause** (checked against the markup and the CSS of T22 and T26): `attachSkillTooltip` appends the tooltip inside the `.skill-slot`, so the tooltip's `img.skill-art` is also a descendant `img` of the slot. `.skill-slot img` (specificity 0,1,1) beats `.skill-art` (0,1,0): the tooltip art gets `width: 100%` and `height: 62px`; with `flex: none` from `.skill-art` it takes the whole 312 px row and pushes the text `div` out to the right of the 340 px tooltip. `.skill-slot:not(.is-locked) img` also gives it the gold ring of the bar. The bug predates the redesign (the rule `.skill-slot img` came with `0bd9f4f`); T22 and T26 only restyled it. Scoping the five slot rules to the slot's own art (`> img`) fixes the cause; the review's suggested `.skill-tooltip .skill-art { width: 112px; height: 64px }` would only patch it.

**Contract**:

| Rule (selector today, exactly) | New selector | Declarations |
| --- | --- | --- |
| `.skill-slot img` | `.skill-slot > img` | unchanged |
| `.skill-slot:not(.is-locked) img` | `.skill-slot:not(.is-locked) > img` | unchanged |
| `.skill-slot.is-cooling img` | `.skill-slot.is-cooling > img` | unchanged |
| `.skill-slot.is-casting img` | `.skill-slot.is-casting > img` | unchanged |
| `.skill-slot.is-locked img` | `.skill-slot.is-locked > img` | unchanged |

And add this rule right after the rule `.skill-tooltip.is-below`:

```css
/* The skill row of the hero screens, flat inside the tooltip: the tooltip is already the parchment card */
.skill-tooltip .skill-row {
    padding: 0;
    border: 0;
    background: none;
}
```

It comes after `.skill-row.is-locked` in the file with the same specificity (0,2,0), so it wins for a locked skill too. The tooltip box, its 340 px width and its colours (T26) do not change.

**Steps**:

1. Edit the five selectors.
2. Add the rule.
3. Add the e2e case below right after the test `draws the skill tooltip on parchment`.

**Tests**: e2e
**Test cases** (`uiRedesign.spec.js`):

- `keeps the skill art and its text inside the skill tooltip, locked or not` (UIR-14 AC 14):

```js
    test('keeps the skill art and its text inside the skill tooltip, locked or not', async ({ page }) => {
        //  Kael 1 star: slot 1 unlocked, slot 2 locked
        await startAs(page, { copies: { 'kael:1': 1 } });

        for (const [ slot, filter ] of [ [ 1, 'none' ], [ 2, 'grayscale(1)' ] ])
        {
            await page.getByTestId(`skill-slot-${slot}`).hover();

            const tooltip = page.getByTestId('skill-tooltip');
            const art = tooltip.locator('.skill-art');

            await expect(tooltip).toBeVisible();
            expect(await art.evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 112, 64 ]);
            await expectStyle(art, { filter, 'box-shadow': 'none' });
            await expectStyle(tooltip.locator('.skill-row'), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '0px', 'padding-left': '0px' });
            expect(inside(await tooltip.locator('.skill-row > div').boundingBox(), await tooltip.boundingBox())).toBe(true);
            await page.mouse.move(0, 0);
            await expect(tooltip).toHaveCount(0);
        }

        //  The bar's own art keeps its frame
        expect(await page.getByTestId('skill-slot-1').locator('img').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 150, 62 ]);
    });
```

**Gate**: build - `cd game && npm test && npm run build`, then `cd game && npx playwright test e2e/uiRedesign.spec.js e2e/combatHud.spec.js`
**Done when**:

- [x] `grep -c "^\.skill-slot[^{>]* img {" game/public/style.css` prints `0` and `grep -c "^\.skill-slot[^{]* > img {" game/public/style.css` prints `5`.
- [x] The new case passes; every case of `uiRedesign.spec.js` and `combatHud.spec.js` passes; `npm test` and the build pass.

**Commit**: `fix(game): keep the skill art and text inside the skill tooltip`

---

### T34: Dark branch ink for the talent buttons, titles and max marks [x]

**Owner**: game-dev
**What**: The `Melhorar` buttons, the branch titles and `Nível máximo` use a dark ink of each branch that reaches 4.5:1 (review finding 4; spec UIR-14 AC 15).
**Where**: `game/public/style.css` (section `/* ══ Talentos`)
**Also changes**: `game/e2e/uiRedesign.spec.js`
**Read first**: `style.css:1967-2068` (`.talent-column[data-branch=...]`, `.talent-branch-title`, `.talent-card`, `.talent-max`, `.talent-upgrade`); `game/src/adapters/phaser/views/talentsView.js:14-81` (test ids `talent-branch-<BRANCH>`, `talent-upgrade-<id>`, `talent-max-<id>`; cards are inside their column, so they inherit its custom properties); `game/e2e/support/fakeBackend.js:176-182` (`CLICK_DAMAGE` is a POWER talent)
**Depends on**: T33
**Requirement**: UIR-14

**Decision and contrast** (WCAG 2.x, computed by the PO): the button text is `var(--color-bg)` = `#f4e6c8` = `rgb(244, 230, 200)`. Today the buttons are filled with `--branch`: TIME `#3b9aa6` 2.67:1, BREAK `#c4492f` 3.92:1, POWER `#c99a1f` 2.09:1, COMBO `#8a5bd6` 3.74:1, all below 4.5:1 (the review's estimates were 3.4, 4.2, 2.3 and "passes"; its suggested gold `#8a6a0f` reaches only 4.10:1). The same colours fail as title text on the column `#e6d0a2` (1.71:1 to 3.20:1). Each branch gets a second token, `--branch-ink`: the same hue darkened until it reaches 4.8:1 on `#e6d0a2`. `--branch` stays for the card's left bar and the icon tint (UIR-14 AC 9).

| Branch | `--branch` (kept) | `--branch-ink` (new) | Button: ink vs `#f4e6c8` | Title: ink vs column `#e6d0a2` |
| --- | --- | --- | --- | --- |
| TIME | `#3b9aa6` | `#245d64` = `rgb(36, 93, 100)` | 6.02:1 | 4.92:1 |
| BREAK | `#c4492f` | `#953724` = `rgb(149, 55, 36)` | 5.96:1 | 4.88:1 |
| POWER | `#c99a1f` | `#6c5311` = `rgb(108, 83, 17)` | 5.90:1 | 4.82:1 |
| COMBO | `#8a5bd6` | `#6a31c5` = `rgb(106, 49, 197)` | 5.95:1 | 4.87:1 |

`Nível máximo` sits on the card `#f4e6c8`: same ratios as the button column.

**Contract**: replace the four one-line rules `.talent-column[data-branch="..."] { --branch: ...; }` with these five lines (comment first):

```css
/* --branch marks the column (card bar, icon tint); --branch-ink is the same hue dark enough for text and buttons (4.5:1, spec UIR-14 AC 15) */
.talent-column[data-branch="TIME"] { --branch: #3b9aa6; --branch-ink: #245d64; }
.talent-column[data-branch="BREAK"] { --branch: #c4492f; --branch-ink: #953724; }
.talent-column[data-branch="POWER"] { --branch: #c99a1f; --branch-ink: #6c5311; }
.talent-column[data-branch="COMBO"] { --branch: #8a5bd6; --branch-ink: #6a31c5; }
```

| Rule | Set | Remove |
| --- | --- | --- |
| `.talent-branch-title` | `color: var(--branch-ink);` | - |
| `.talent-max` | `color: var(--branch-ink);` | - |
| `.talent-upgrade` | `background: var(--branch-ink);` | - |

`.talent-card` (its `inset 4px 0 0 var(--branch)` bar), `.icon-fallback`, `.talent-upgrade:disabled` and `.talent-reset` do not change.

**Steps**:

1. Replace the four branch lines.
2. Edit the three rules.
3. Add the e2e case below right after the test `draws talent cards on light parchment`.

**Tests**: e2e
**Test cases** (`uiRedesign.spec.js`):

- `draws the talent buttons, titles and max marks in the dark branch ink` (UIR-14 AC 15):

```js
    test('draws the talent buttons, titles and max marks in the dark branch ink', async ({ page }) => {
        const inks = { TIME: 'rgb(36, 93, 100)', BREAK: 'rgb(149, 55, 36)', POWER: 'rgb(108, 83, 17)', COMBO: 'rgb(106, 49, 197)' };

        //  CLICK_DAMAGE at its maximum shows `Nível máximo`; 10 points enable the other buttons
        await startAs(page, { talents: { CLICK_DAMAGE: 10 }, talentPoints: 10 });
        await openScreen(page, 'talents');

        for (const [ branch, ink ] of Object.entries(inks))
        {
            const column = page.getByTestId(`talent-branch-${branch}`);
            const button = column.locator('.talent-upgrade').first();
            const { 'background-color': columnBack } = await css(column, [ 'background-color' ]);

            await expect(button).toBeEnabled();
            await expectStyle(button, { 'background-color': ink, color: 'rgb(244, 230, 200)' });
            expect(ratio(ink, 'rgb(244, 230, 200)')).toBeGreaterThanOrEqual(4.5);
            await expectStyle(column.locator('.talent-branch-title'), { color: ink });
            expect(columnBack).toBe('rgb(230, 208, 162)');
            expect(ratio(ink, columnBack)).toBeGreaterThanOrEqual(4.5);
        }

        await expectStyle(page.getByTestId('talent-max-CLICK_DAMAGE'), { color: inks.POWER });
        //  The card bar keeps the bright branch colour
        expect((await css(page.getByTestId('talent-CRIT_CHANCE'), [ 'box-shadow' ]))['box-shadow']).toContain('rgb(201, 154, 31) 4px 0px 0px 0px inset');
    });
```

**Gate**: build - `cd game && npm test && npm run build`, then `cd game && npx playwright test e2e/uiRedesign.spec.js e2e/talents.spec.js`
**Done when**:

- [x] `grep -c -- "--branch-ink" game/public/style.css` prints `8` (4 definitions, 1 in the comment, 3 uses).
- [x] The new case passes; every case of `uiRedesign.spec.js` and `talents.spec.js` passes; `npm test` and the build pass.

**Commit**: `fix(game): draw the talent buttons and titles in a dark branch ink`

---

### T35: Boot and preloader screens on dark wood [x]

**Owner**: game-dev
**What**: The first two screens drop the template's sky: dark game background, no sky image, a wood track under the bar (review finding 5; spec UIR-15 AC 5).
**Where**: `game/src/adapters/phaser/Preloader.js`
**Also changes**: `game/src/adapters/phaser/Preloader.test.js`, `game/src/adapters/phaser/Boot.js`, `game/src/main.js`, `game/public/assets/preloader.png` (deleted), `game/e2e/uiRedesign.spec.js`
**Read first**: `Preloader.js:14-31`; `Preloader.test.js` (whole: the stand-in records `color`, `add.image` is a `vi.fn()`); `Boot.js` (whole); `main.js:11-20`; `game/e2e/uiRedesign.spec.js:1171-1191` (how the Preloader is held on screen)
**Depends on**: T34
**Requirement**: UIR-15

**Root cause** (where the cyan comes from): two places, both left from the Phaser template. (1) `Boot.js` loads `assets/preloader.png`, a 1024 x 768 blue-to-cyan gradient, and `Preloader.init` draws it full screen at (512, 384) under the bar. (2) `main.js` sets the game `backgroundColor: '#028af8'` (bright blue), the only thing drawn on the Boot screen while it waits for the first click. Neither the CSS nor `index.html` adds blue; the page around the canvas is already `#1c120c` (T2). `git grep` finds no other user of `preloader.png` or the texture key `preloader`.

**Contract**:

1. `game/src/main.js`: the line `    backgroundColor: '#028af8',` becomes `    backgroundColor: '#1c120c',`.
2. `game/src/adapters/phaser/Boot.js`: delete the whole `preload ()` method (from the line `    preload ()` to its closing `    }` and the empty line after it); `constructor` and `create` stay unchanged.
3. `game/src/adapters/phaser/Preloader.js`, in `init()`: replace these five lines

```js
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'preloader');

        //  The outline of the bar: a thin gold rim (spec ui-redesign)
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(2, 0xe0b45a);
```

with

```js
        //  The track of the bar: dark wood inside a thin gold rim, on the dark game background (spec ui-redesign)
        this.add.rectangle(512, 384, 468, 32, 0x2b1d14).setStrokeStyle(2, 0xe0b45a);
```

The ember bar and the progress handler do not change (the bar stays the second rectangle, drawn over the track).
4. `git rm game/public/assets/preloader.png`.

**Steps**:

1. Edit `main.js`.
2. Edit `Boot.js`.
3. Edit `Preloader.js`.
4. Delete the image with `git rm`.
5. Add the two unit cases to `Preloader.test.js`, inside `describe('Preloader')`, after `grows the bar to 464 px at full progress`.
6. Add the e2e case right after the test `draws the preloader bar with a gold outline and an ember fill`.

**Tests**: unit + e2e
**Test cases**:

`Preloader.test.js` (use `createScene()` of the file):

- `fills the track of the loading bar in dark wood`: `scene.init()`; `rectangles[0].color` is `0x2b1d14`; `rectangles[0].setStrokeStyle` was called with `(2, 0xe0b45a)`.
- `draws no image behind the loading bar`: `scene.init()`; `expect(scene.add.image).not.toHaveBeenCalled()`.

`uiRedesign.spec.js`:

```js
    test('draws the boot and preloader screens on dark wood with no sky image', async ({ page }) => {
        let release;
        const held = new Promise((resolve) => { release = resolve; });
        const requests = [];

        page.on('request', (request) => requests.push(request.url()));
        await page.route('**/assets/heroes/vex_sprite.png', async (route) => { await held; await route.continue(); });
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.goto('/');
        await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));

        //  The Boot screen shows only the game background until the first click
        expect(await page.evaluate(() => window.__PHASER_GAME__.config.backgroundColor.color)).toBe(0x1c120c);

        await page.locator('#game-container canvas').click();
        await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list.length)).toBeGreaterThan(0);

        const children = await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list
            .map((child) => ({ type: child.type, x: child.x, y: child.y, width: child.width, height: child.height, fillColor: child.fillColor, isFilled: child.isFilled })));

        release();

        expect(children.map((child) => child.type)).not.toContain('Image');
        expect(children).toContainEqual(expect.objectContaining({ type: 'Rectangle', x: 512, y: 384, width: 468, height: 32, fillColor: 0x2b1d14, isFilled: true }));
        expect(requests.filter((url) => url.includes('preloader.png'))).toEqual([]);
    });
```

**Gate**: quick - `cd game && npm test`, then build - `cd game && npm run build`, then `cd game && npx playwright test e2e/uiRedesign.spec.js`
**Done when**:

- [x] `git grep -n -e "preloader.png" -e "028af8" -- game/src game/public` prints nothing and `game/public/assets/preloader.png` no longer exists.
- [x] The 2 new unit cases and the 3 existing `Preloader.test.js` cases pass; the new e2e case and the existing preloader e2e case pass; `npm test` and the build pass.

**Commit**: `style(game): draw the boot and preloader screens on dark wood`

---

### T36: Five hero cards of the same size [x]

**Owner**: game-dev
**What**: The `Heróis` cards share one column width, so Vex's portrait is no longer taller and every name stays inside its card (review finding 9; spec UIR-13 AC 13).
**Where**: `game/public/style.css` (rules `.hero-grid` and `.hero-card .hero-name`)
**Also changes**: `game/e2e/uiRedesign.spec.js`
**Read first**: `style.css:1356-1398` (`.hero-grid`, `.hero-card`, `.hero-card img`, `.hero-card .hero-name`); `game/src/adapters/phaser/views/catalogView.js:55-62` (`span.hero-name`)
**Depends on**: T35
**Requirement**: UIR-13

**Root cause and measurements**: `.hero-grid` uses `repeat(5, 1fr)`, and `1fr` never shrinks a column below its content's min-content width. In Cinzel 700 at 16 px the word `Sombraespinho` is 135 px; with the name's 2 x 6 px padding and the card's 2 x 8 px padding and 2 x 1 px border, Vex's card needs 165 px while the five equal columns of the 862 px window content (920 - 2 x 3 border - 2 x 26 padding, 4 gaps of 12) are 162.8 px. So Vex's column grows, and its `img` (width 100%, `aspect-ratio: 3 / 4`) grows about 4 px taller. `minmax(0, 1fr)` makes the five columns equal; at 15 px `Sombraespinho` is 127 px, which fits the 132.8 px left for the name inside the card.

**Contract**:

| Rule | Set | Remove |
| --- | --- | --- |
| `.hero-grid` (the only rule with this selector) | `grid-template-columns: repeat(5, minmax(0, 1fr));` | - |
| `.hero-card .hero-name` | `font-size: 15px;` | - |

`.hero-detail-text .hero-name` and `.equip-detail .hero-name` do not change.

**Steps**:

1. Edit the two rules.
2. Add the e2e case below right after the test `draws the hero window, title and inset cards`.

**Tests**: e2e
**Test cases** (`uiRedesign.spec.js`):

- `keeps the five hero cards the same size with every name inside its card` (UIR-13 AC 13):

```js
    test('keeps the five hero cards the same size with every name inside its card', async ({ page }) => {
        const heroes = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

        await startAs(page, { copies: Object.fromEntries(heroes.map((hero) => [ `${hero}:3`, 1 ])) });
        await openScreen(page, 'heroes');

        const sizes = [];

        for (const hero of heroes)
        {
            const card = page.getByTestId(`hero-card-${hero}`);
            const box = await card.boundingBox();
            //  Screen pixels per CSS pixel (the scene is scaled to the viewport)
            const scale = box.width / await card.evaluate((node) => node.offsetWidth);
            //  The card's content box: 1 px border + 8 px padding on each side
            const content = { x: box.x + 9 * scale, y: box.y, width: box.width - 18 * scale, height: box.height };

            sizes.push(await card.evaluate((node) => [ node.offsetWidth, node.querySelector('img').offsetHeight ]));
            await expectStyle(card.locator('.hero-name'), { 'font-size': '15px' });
            expect(inside(await card.locator('.hero-name').boundingBox(), content)).toBe(true);
        }

        expect(new Set(sizes.map(([ width ]) => width)).size).toBe(1);
        expect(new Set(sizes.map(([ , height ]) => height)).size).toBe(1);
    });
```

**Gate**: build, then full (phase gate) - `cd game && npm test && npm run build && npx playwright test --workers=2`
**Done when**:

- [x] The new case passes.
- [x] Phase gate: every Vitest suite, the build and every Playwright suite pass (`heroes.spec.js` and `heroAscension.spec.js` read the hero cards).

**Commit**: `fix(game): keep the five hero cards the same size`

---

### T37: Settled review shots and the states nobody judged [x]

**Owner**: test-engineer
**What**: Every review shot waits for its images (review finding 8), and six new shots show the selected fusion row, a disabled equipment button and the detail of the four heroes the review could not check (UIR-18; review "Sugestões" 4 and 6, and the partial check of step 2 of T30).
**Where**: `game/ui-review/uiRedesign.shots.js`
**Also changes**: `.specs/features/ui-redesign/design.md` (§ Review Screenshots table), the PNG files of `.specs/features/ui-redesign/ui-review/`
**Read first**: `game/ui-review/uiRedesign.shots.js` (whole; `tabTo` ends near line 77, the `hero screens` test runs from line 200); `game/ui-review/support/shots.js`; `game/src/adapters/phaser/views/dom.js:27-30` (every art `img` is `loading="lazy"`); `game/src/adapters/phaser/views/bagView.js:35-46` (`bag-go-fusion`); `game/src/adapters/phaser/views/fusionView.js:20-21` (`is-selected`); `game/src/adapters/phaser/views/equipmentView.js:268-275` (`piece-refine` is disabled while the wallet is below the cost; the fake wallet starts at 0)
**Depends on**: T36
**Requirement**: UIR-18

**Cause of finding 8**: the art images are `loading="lazy"` and the shots fire as soon as the screen's first element is visible, so the talent icons and the chapter map (`assets/boss-map.jpg`) were still loading: the "test art" of `31-boss-map` is the CSS gradient behind the map image, not a different file. A lazy image that is clipped by a scrolled window never starts loading, so waiting for `complete` alone could hang; switching the lazy images to eager first starts them all. A broken image counts as `complete`, so a missing icon never blocks the wait.

**Contract**:

1. Add this helper right after `tabTo`:

```js
//  Starts every lazy image and waits until each image of the page has loaded or failed, so no shot catches a half-loaded screen (review finding 8)
const settleImages = async (page) => {
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [ ...document.images ].every((img) => img.complete));
};
```

2. Insert `await settleImages(page);` on its own line right before every `await shot(page, testInfo, '...')` call of the file except `01-preloader` (hover shots included: the helper does not move the pointer).
3. In the test `hero screens`:
   - after the line `await page.getByTestId('hero-back').click();` that follows `21-hero-detail`, and before `await page.getByTestId('hero-close').click();`, add one block per hero, in this order: `lyra` `34-hero-detail-lyra`, `orina` `35-hero-detail-orina`, `seraphine` `36-hero-detail-seraphine`, `vex` `37-hero-detail-vex`:

```js
    for (const [ hero, name ] of [ [ 'lyra', '34-hero-detail-lyra' ], [ 'orina', '35-hero-detail-orina' ], [ 'seraphine', '36-hero-detail-seraphine' ], [ 'vex', '37-hero-detail-vex' ] ])
    {
        await page.getByTestId(`hero-card-${hero}`).click();
        await expect(page.getByTestId('hero-detail')).toBeVisible();
        await page.mouse.move(0, 0);
        await settleImages(page);
        await shot(page, testInfo, name);
        await page.getByTestId('hero-back').click();
    }
```

   - after the shot `23-bag-detail` and before the following `await page.getByTestId('hero-close').click();`, add:

```js
    await page.getByTestId('bag-go-fusion').click();
    await expect(page.getByTestId('fusion-row-kael-1')).toHaveClass(/is-selected/);
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '32-fusion-selected');
```

   - after `await page.getByTestId('bulk-sell-cancel').click();` and before the following `await page.getByTestId('hero-close').click();`, add:

```js
    await page.getByTestId('equip-piece-b1').click();
    await expect(page.getByTestId('piece-refine')).toBeDisabled();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '33-equip-disabled');
```

4. In `design.md` § Review Screenshots, append six rows to the table after `31-boss-map`, and add the sentence `Every shot but 01-preloader waits until the page's images have loaded (settleImages).` under the table:

```
| `32-fusion-selected` | Fusão opened from a bag entry with `Ir para a fusão`: the Kael 1★ row selected (`.fusion-row.is-selected`) |
| `33-equip-disabled` | Bag piece b1 opened in Equipamento with an empty wallet: `Refinar` disabled (`.equip-button:disabled`) |
| `34-hero-detail-lyra` | Lyra 4★ detail and her three skill thumbnails |
| `35-hero-detail-orina` | Orina 7★ detail and her three skill thumbnails |
| `36-hero-detail-seraphine` | Seraphine 2★ detail and her three skill thumbnails |
| `37-hero-detail-vex` | Vex 6★ detail and his three skill thumbnails |
```

**Steps**:

1. Add the helper.
2. Insert the `settleImages` calls.
3. Add the three blocks of shots.
4. Edit the design table.
5. Run `cd game && npm run ui:shots -- uiRedesign` (it rewrites all shots on the fixed game of T31 to T36).

**Tests**: none - screenshots for the review, not a test of the game; never part of the e2e suite.
**Gate**: `cd game && npm run ui:shots -- uiRedesign` passes and `ls .specs/features/ui-redesign/ui-review/*.png | wc -l` prints `66` (33 names x 2 projects).
**Done when**:

- [x] The gate passes; every `CONSOLE-REPORT` line reads `clean` except the known noise the T30 review lists (GPU stall in the menu and preloader; HTTP 500 of `fusion error`); any other line goes into the commit message body.
- [x] In `30-talents-desktop.png` and `31-boss-map-desktop.png` the icons and the map art are drawn (open both files and look).
- [x] The commit holds the script, `design.md` and the 66 screenshots.

**Commit**: `test(game): settle images and add six review shots`

---

### T38: Re-review of the Grove theme after the fixes [x]

**Owner**: ui-artist
**What**: Check the fixes of T31 to T37 on desktop and phone and update the review with a new verdict (UIR-01 to UIR-19).
**Where**: `.specs/features/ui-redesign/ui-review.html`
**Read first**: the current `ui-review.html` (findings 1 to 9); spec UIR-10 AC 24, UIR-13 AC 12 and 13, UIR-14 AC 14 and 15, UIR-15 AC 5; T31 to T37 above; § Deferred review findings below
**Depends on**: T37
**Requirement**: UIR-01, UIR-02, UIR-03, UIR-04, UIR-05, UIR-06, UIR-07, UIR-08, UIR-09, UIR-10, UIR-11, UIR-12, UIR-13, UIR-14, UIR-15, UIR-16, UIR-17, UIR-18, UIR-19

**Steps**:

1. Run `cd game && npm run ui:shots -- uiRedesign` again on the current `main` and use those 66 files.
2. For each finding of the old review, write its new state, with the shot that proves it: #1 leader rows (`26-leader`), #2 skill tooltip (`09-skill-tooltip`), #3 leader name (`05-battle-boss`, `08-battle-locked`), #4 talent buttons and titles (`30-talents`), #5 preloader (`01-preloader`), #8 loaded images (`30-talents`, `31-boss-map`), #9 hero cards (`20-heroes`). State is `corrigido` or a new numbered finding with the exact fix.
3. List #6 and #7 as `adiado` with the reason of § Deferred review findings.
4. Judge the states nobody judged: `.fusion-row.is-selected` (`32-fusion-selected`), the disabled `.equip-button` (`33-equip-disabled`), and the skill thumbnails of Lyra, Orina, Seraphine and Vex (`34` to `37`): no magenta, no purple effect lost to the cutout (UIR-16 edge case).
5. Check that the fixes broke nothing on the shots around them (the battle bar of `05`, the tooltip over the effect tags is not in a shot: say so).
6. Write the verdict: OK, or CHANGES with numbered findings (screen, selector, what is wrong, the exact fix). The orchestrator turns new findings into tasks appended to this file.

**Tests**: none - a visual review produces no code.
**Gate**: `test -s .specs/features/ui-redesign/ui-review.html && grep -q "32-fusion-selected" .specs/features/ui-redesign/ui-review.html && grep -q "33-equip-disabled" .specs/features/ui-redesign/ui-review.html && grep -q "37-hero-detail-vex" .specs/features/ui-redesign/ui-review.html` exits 0.
**Done when**:

- [x] `ui-review.html` has a new verdict, the state of findings 1 to 9, and covers steps 2 to 5.
- [x] The commit holds `ui-review.html` and any shot that step 1 changed.

**Commit**: `docs(ui-redesign): re-review the grove theme after the fixes`

---

### Deferred review findings

Decided by the PO on 2026-11-13; not tasks of this feature.

| Finding | Decision | Reason |
| --- | --- | --- |
| #6 Logo top left fades into the forest (battle) | Deferred | The logo is outside this spec (no UIR covers it) and is the same Phaser image as the main menu's; a readable version needs a light logo variant or a glow FX, which is new art or a scene change, not a CSS fix. Owner decides in a later art pass. |
| #7 Card notice covers half of the combo chip (`10-notice`) | Deferred | Moving a HUD element other than the bottom bar's is Out of Scope in the spec; the overlap lasts the 3 s of the notice. Fixing it means moving `NOTICE` (`HeroUi.js`, y 120) or `COMBO_HUD` (`ClickerGame.js`, y 150), an owner decision. |

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5
Phase 3:  T6 → T7 → T8 → T9 → T10 → T11
Phase 4:  T12 → T13 → T14 → T15 → T16 → T17
Phase 5:  T18 → T19 → T20
Phase 6:  T21 → T22 → T23 → T24 → T25 → T26
Phase 7:  T27
Phase 8:  T28 → T29
Phase 9:  T30
Phase 10: T31 → T32 → T33 → T34 → T35 → T36 → T37 → T38
```

Packing for workers (~7 tasks): batch 1 = Phases 1 and 2 (T1 to T5, `game-dev`); batch 2 = Phase 3 (T6 to T11, `game-dev`); batch 3 = Phase 4 (T12 to T17, `game-dev`, except T15 which goes to `test-engineer` between T14 and T16); batch 4 = Phase 5 (T18 to T20, `game-dev`); batch 5 = Phases 6 and 7 (T21 to T27, `game-dev`); batch 6 = Phase 8 (T28, T29, `test-engineer`); then T30 (`ui-artist`). Batch 7 = Phase 10: T31 to T36 (`game-dev`, one worker, in order), then T37 (`test-engineer`), then T38 (`ui-artist`). A fresh `test-engineer` that wrote none of these tasks runs as the Verifier after T38.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 link | ✅ Granular |
| T2 | `:root`, `body`, `:focus-visible` of 1 file | ✅ Cohesive (the token layer) |
| T3 | 1 stylesheet section | ✅ Granular |
| T4 | 1 function of 1 tool | ✅ Granular |
| T5 | 1 command over 15 generated files | ✅ Cohesive (one asset set) |
| T6 | 5 rules of 1 section | ✅ Granular |
| T7 | 2 methods and their 2 rules | ✅ Cohesive |
| T8 | 3 constants, 3 rules, pinned tests | ✅ Cohesive |
| T9 | 1 method and its rules | ✅ Granular |
| T10 | 1 pure function | ✅ Granular |
| T11 | 1 HUD element, 1 method | ✅ Cohesive |
| T12 | 1 stylesheet block | ✅ Granular |
| T13 | 1 stylesheet block and 2 position constants | ✅ Cohesive (the bar's layout) |
| T14 | 1 HUD element of 1 scene: markup, 5 methods, 3 hooks | ✅ Cohesive (one control) |
| T15 | 2 e2e files, 6 edits | ✅ Cohesive (one regression) |
| T16 | 1 stylesheet block | ✅ Granular |
| T17 | 4 rules | ✅ Granular |
| T18 | 1 stylesheet section | ✅ Granular |
| T19 | 1 constant and 1 call | ✅ Granular |
| T20 | 2 calls and 1 new test file | ✅ Granular |
| T21 | 4 rules | ✅ Granular |
| T22 | 1 stylesheet section | ✅ Granular |
| T23 | 1 screen's rules | ✅ Granular |
| T24 | 5 rules | ✅ Granular |
| T25 | 2 rules | ✅ Granular |
| T26 | 6 rules | ✅ Granular |
| T27 | 1 document section | ✅ Granular |
| T28 | 1 e2e file | ✅ Granular |
| T29 | 1 shots file | ✅ Granular |
| T30 | 1 review file | ✅ Granular |
| T31 | 1 selector and 1 e2e case | ✅ Granular |
| T32 | 1 rule, 1 edited and 1 new e2e case | ✅ Granular |
| T33 | 5 selectors and 1 rule of one control, 1 e2e case | ✅ Cohesive (one root cause) |
| T34 | 4 token lines and 3 rules of 1 section, 1 e2e case | ✅ Cohesive (one colour set) |
| T35 | 2 scenes, 1 config value, 1 asset, their tests | ✅ Cohesive (the first two screens) |
| T36 | 2 declarations, 1 e2e case | ✅ Granular |
| T37 | 1 shots file and its design table | ✅ Granular |
| T38 | 1 review file | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T22 | T22 → T23 | ✅ Match |
| T24 | T23 | T23 → T24 | ✅ Match |
| T25 | T24 | T24 → T25 | ✅ Match |
| T26 | T25 | T25 → T26 | ✅ Match |
| T27 | T26 | T26 → T27 | ✅ Match |
| T28 | T27 | T27 → T28 | ✅ Match |
| T29 | T28 | T28 → T29 | ✅ Match |
| T30 | T29 | T29 → T30 | ✅ Match |
| T31 | T30 | T30 → T31 | ✅ Match |
| T32 | T31 | T31 → T32 | ✅ Match |
| T33 | T32 | T32 → T33 | ✅ Match |
| T34 | T33 | T33 → T34 | ✅ Match |
| T35 | T34 | T34 → T35 | ✅ Match |
| T36 | T35 | T35 → T36 | ✅ Match |
| T37 | T36 | T36 → T37 | ✅ Match |
| T38 | T37 | T37 → T38 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Game HTML | none | none | ✅ OK (checked by T28) |
| T2 | Game CSS | none | none | ✅ OK (checked by T28) |
| T3 | Game CSS | none | none | ✅ OK (checked by T28) |
| T4 | Art tool | none (output check in Gate) | none + output check | ✅ OK |
| T5 | Assets | none (output check in Gate) | none + output check + 3 e2e suites | ✅ OK |
| T6 | Game CSS | none | none | ✅ OK |
| T7 | Game scene + CSS | unit (jsdom) | unit | ✅ OK |
| T8 | Game scene + CSS | unit (jsdom) | unit | ✅ OK |
| T9 | Game scene + CSS | unit (jsdom) | unit | ✅ OK |
| T10 | Game domain | unit | unit | ✅ OK |
| T11 | Game scene + CSS | unit (jsdom) | unit | ✅ OK |
| T12 | Game CSS | none | none | ✅ OK |
| T13 | Game CSS + scene and HeroUi constants | unit (jsdom) | unit | ✅ OK |
| T14 | Game scene | unit (jsdom) | unit | ✅ OK |
| T15 | e2e | e2e | e2e (regression) | ✅ OK |
| T16 | Game CSS | none | none | ✅ OK (checked by T28) |
| T17 | Game CSS | none | none | ✅ OK |
| T18 | Game CSS | none | none | ✅ OK |
| T19 | Game scene | unit (jsdom) | unit | ✅ OK |
| T20 | Game scene | unit (jsdom) | unit | ✅ OK |
| T21 | Game CSS | none | none | ✅ OK |
| T22 | Game CSS | none | none | ✅ OK |
| T23 | Game CSS | none | none | ✅ OK |
| T24 | Game CSS | none | none | ✅ OK |
| T25 | Game CSS | none | none + `bossMap.spec.js` | ✅ OK |
| T26 | Game CSS | none | none | ✅ OK |
| T27 | Documentation | none | none | ✅ OK |
| T28 | e2e | e2e | e2e | ✅ OK |
| T29 | Review screenshots | none | none | ✅ OK |
| T30 | Review document | none | none | ✅ OK |
| T31 | Game CSS (player-visible fix) | e2e (phase rule: every observable fix) | e2e | ✅ OK |
| T32 | Game CSS (player-visible fix) | e2e | e2e | ✅ OK |
| T33 | Game CSS (player-visible fix) | e2e | e2e | ✅ OK |
| T34 | Game CSS (player-visible fix) | e2e | e2e | ✅ OK |
| T35 | Game scenes + config | unit (jsdom) + e2e | unit + e2e | ✅ OK |
| T36 | Game CSS (player-visible fix) | e2e | e2e | ✅ OK |
| T37 | Review screenshots | none | none | ✅ OK |
| T38 | Review document | none | none | ✅ OK |
