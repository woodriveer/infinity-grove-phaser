# Unified Damage Specification

## Problem Statement

Orina Brumaestrela is the only hero whose skills deal magical damage, and every enemy has two defenses (physical and magical). Her first skill, Prisão de Espinhos, raises only magical damage, but clicks are physical, so it barely matters in a clicker. The owner asked (2026-10-31) to remove the physical/magical split from the whole game: there is one kind of damage ("dano"), one enemy defense, one defense break talent, and every text that speaks of "dano mágico", "dano físico", "resistência física" or "Poder Arcano" is rewritten. Orina's leader bonus becomes "+20% de dano total." (text only for now).

## Facts From the Code (not decisions)

- `calculateDamage` picks `magicalDefense` when `attacker.damageType === MAGICAL`, else `physicalDefense` (`game/src/domain/combat/damage.js:17`). Clicks are always PHYSICAL (`skillDamage.js:44`). Kael, Lyra and Vex skills are PHYSICAL; Orina and Seraphine skills are MAGICAL (`skillCatalog.js:16-38`).
- Bênção da Grande Árvore multiplies PHYSICAL strikes by `1 + 30 x f / 100` (clicks included) and adds 25 x f to the click percent; Prisão de Espinhos multiplies MAGICAL strikes by `1 + 25 x f / 100`; Brado Aterrador removes `30 x f` points of `physicalDefense` (`skillDamage.js:5-34`). `f` is the skill level factor of `hero-ascension` (1, 1.25, 1.5).
- `monsterAfterBreak` lowers `physicalDefense` by the `PHYSICAL_BREAK` value and `magicalDefense` by the `MAGICAL_BREAK` value (`game/src/domain/talents/talents.js:24-29`).
- Every enemy the backend seeds has `physical_defense == magical_defense` (`ChapterDefinition.of`, `backend/.../domain/Chapter.kt:118-167`). The `enemies` table has both columns `not null` with a unique key on `(element, physical_defense, magical_defense, crit_resistance)` (`V1__schema.sql:52-59`). `ChapterSeeder` inserts a chapter only when it is missing.
- The progress payload carries per encounter `{ element, physicalDefense, magicalDefense, critResistance }` (`ProgressController.kt:24-39`). The game falls back to `DEFAULT_STATS` when a stage has no stats (`campaign.js:71-128`).
- Talents cost talent points, not coins (AD-013, AD-017). `available = earned - spent`, and `spent` is derived from the stored levels: the sum over the catalog of `level x grade` (`Talents.kt` `PlayerTalents.points`). Nothing stores the spent points.
- `PlayerTalents` throws when a stored talent id is not in the catalog (`Talents.kt` `init`), so a backend whose catalog lacks `MAGICAL_BREAK` fails every talent request of a player who still has a `MAGICAL_BREAK*` row.
- `HeroSeeder` never overwrites a hero; text changes of seeded heroes need a Flyway update guarded by the old text (pattern `V2__lyra_leader_bonus.sql`). Skill rows have ids `<heroId>/<slot>` (`HeroEntities.kt`).
- Only Lyra's leader bonus has a game effect (`game/src/domain/heroes/leaderBonus.js`).
- The game shows the enemy line as `Water  Physical def 10%  Magical def 10%  Crit res 12%` (`ClickerGame.js:684-693`), and the Equipamento attribute panel has the lines `Tipo de dano: Físico`, `Quebra de defesa física: N` and `Quebra de defesa mágica: N` (`leaderStats.js:22-31`).
- The backend and the game are deployed separately (backend slot vs Worker, `CLAUDE.md` Deploy), and a Flyway migration is not undone by a failed deploy or a rollback (AD-016).

## Goals

- [ ] Every hit (click, skill hit, aimed shot, damage tick) meets the same enemy defense and the same modifiers; no code path picks a defense or a bonus by damage type.
- [ ] Prisão de Espinhos raises every damage the monster takes by 25 % (x f), so an Orina click under Prisão deals 1.25 times more.
- [ ] Bênção da Grande Árvore multiplies every damage by 1.3 (x f) while it runs, skill hits of Orina and Seraphine included; its +25 % click bonus stays.
- [ ] The enemy shows one `Defesa <n>%` tag, and the backend answers one `defense` per enemy while it keeps the old two fields for the previous game.
- [ ] The talent tree has one `Quebra de defesa` talent in each grade (9 talents per grade, 27 in total); every `MAGICAL_BREAK*` level is removed and its talent points come back.
- [ ] No player-visible text says "mágico/mágica", "físico/física", "Poder Arcano" or "Força" about damage; Orina's leader bonus reads `+20% de dano total.`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| A game effect for Orina's `+20% de dano total.` | Owner decision 2: text only; the other four leader bonuses are a separate feature (`hero-team` Q11) |
| Dropping `enemies.magical_defense`, renaming `physical_defense`, removing the API fields `physicalDefense` / `magicalDefense` and the game's fallback to `physicalDefense` | Contract step of AD-016, a later feature once this one is live on both sides (TD-002 below) |
| Renaming the talent id `PHYSICAL_BREAK` | A rename breaks the previous backend, which rejects unknown ids (Facts); kept as the id of the merged talent (D1) |
| New talent art | The broken-shield icon `talent-break-physical.png` reads as a generic defense break (D16) |
| A notice or coin payment for the removed levels | Points come back through the derived balance (D2, open question Q1) |
| The `hero-team` damage type TEAM, team resistance and Orina's ally passive "Erosão Arcana" (`-15 de defesa mágica`) | `hero-team` is not built; its spec is revised when it is picked up (D14, open question Q2) |
| `campaign-chapters` wording "physical and magical defense" | That draft is re-read when it is picked up; its numbers already use one value for both (D17) |
| Translating the English enemy tags `Crit res` and the element names | TD-001 (AD-007) |
| Balance changes to enemy defenses | Seeded values are equal today, so one defense changes no seeded number |

### TD-002 (created by this feature)

| ID | Debt | Paid by |
| --- | --- | --- |
| TD-002 | `enemies.physical_defense` holds the single defense and `enemies.magical_defense` is a write-only copy; the progress payload repeats `defense` as `physicalDefense` and `magicalDefense`; the game reads `defense ?? physicalDefense ?? 0`; `game/public/assets/talent-break-magical.png` is unused; old test fixtures still build enemies as `{ physicalDefense, magicalDefense }` | A contract feature after `unified-damage` is live on the backend and the Worker: rename the column to `defense`, drop `magical_defense` and the two API fields, drop the fallback, convert the fixtures |

---

## Damage Rules

One strike (click, skill hit, aimed shot or tick) against an enemy with defense `D` and critical resistance `R`:

```
D_talent = max(0, D - value of PHYSICAL_BREAK (all grades))
D_brado  = max(0, D_talent - 30 x f_brado)            while Brado Aterrador runs on the monster, else D_talent
D_eff    = D_brado x (1 - min(100, pierce) / 100)
damage   = Base x percent / 100 x element x (1 - D_eff / 100) x (critical ? critMultiplier : 1) x (boss ? 1 + bossDamage / 100 : 1)
           x B x P x (DARKNESS ? vsDarkness : 1) x combo
B = 1 + 30 x f_bencao / 100   while Bênção da Grande Árvore runs on the player, else 1   (every strike)
P = 1 + 25 x f_prisao / 100   while Prisão de Espinhos runs on the monster, else 1        (every strike)
click percent = 100 + 50 x f_ventos (Ventos) + 25 x f_bencao (Bênção)
```

`f` is the level factor the effect was cast with (`hero-ascension`: 1, 1.25, 1.5 for levels 1 to 3). Ticks are never critical; combo applies only to clicks (AD-012). Decimal results are compared with a tolerance of 1e-9 (L-012).

Worked examples (fire attacker, FIRE monster so the element factor is 1, roll 0.99 so no critical, no talent unless named):

| # | Case | Result (before this feature) |
| --- | --- | --- |
| E1 | Base 1 click, defense 50 | **0.5** (0.5) |
| E2 | Base 1, Chuva de Meteoros (2500 %), enemy defense 50 (older payload `physicalDefense` 50, `magicalDefense` 10) | 25 x 0.5 = **12.5** (22.5) |
| E3 | Base 1 click under Prisão level 1, defense 0 | **1.25** (1) |
| E4 | Orina 3★ (Base 1.4) click under Prisão level 1, defense 0 | 1.4 x 1.25 = **1.75** (1.4) |
| E5 | Base 1 click under Prisão level 2 (x1.3125) | **1.3125** (1) |
| E6 | Base 1, Chuva de Meteoros under Prisão level 1 | **31.25** (31.25) |
| E7 | Base 1, Tempestade Arcana tick (200 %) under Prisão level 1 | **2.5** (2.5) |
| E8 | Base 1, Luz Divina (800 %) under Bênção level 1, FIRE monster | 8 x 1.3 = **10.4** (8) |
| E9 | Seraphine 3★ (Base 1.4), Luz Divina under Bênção level 1 | 8 x 1.4 x 1.3 = **14.56** (11.2) |
| E10 | Base 1 click under Bênção level 1 | 1.25 x 1.3 = **1.625** (1.625) |
| E11 | Base 1 click under Bênção level 3 (factor 1.5) | 1.375 x 1.45 = **1.99375** (1.99375) |
| E12 | Base 1, Luz Divina level 1 under Bênção level 3, DARKNESS monster | 8 x 0.9 x 1.5 x 1.45 = **15.66** (10.8) |
| E13 | Base 100, `PHYSICAL_BREAK` 10, defense 20: Chuva de Meteoros / Investida do Baluarte | 2500 x 0.9 = **2250** / 400 x 0.9 = **360** (Chuva 2000, Investida 360) |
| E14 | Base 100, `PHYSICAL_BREAK` 5, defense 20, Tempestade Arcana tick | 200 x 0.85 = **170** (160) |
| E15 | Base 1 click, defense 50, Brado level 1 | 1 x (1 - 20 / 100) = **0.8** (0.8) |
| E16 | Base 1, Chuva de Meteoros, defense 50, Brado level 1 | 25 x 0.8 = **20** (Chuva met `magicalDefense`) |
| E17 | Base 1 click under Prisão level 1 and Bênção level 1 | 1.25 x 1.3 x 1.25 = **2.03125** (1.625) |

## Talent Refund

The migration deletes every `player_talents` row of `MAGICAL_BREAK`, `MAGICAL_BREAK_G2` and `MAGICAL_BREAK_G3`. Because `spent` is derived from the stored levels (Facts), the points those levels cost come back to `available` at once: `refund = L1 x 1 + L2 x 2 + L3 x 3`.

| Levels held (G1, G2, G3) | Points back |
| --- | --- |
| 4, 0, 0 | 4 |
| 10, 3, 0 | 10 + 6 = 16 |
| 10, 10, 2 | 10 + 20 + 6 = 36 |
| 0, 0, 0 | 0 |

Example: earned 20, `PHYSICAL_BREAK` 3 and `MAGICAL_BREAK` 5 → `available` 12 before, **17** after; `earned` stays 20.

## Talent Catalog (grade 1 order)

`MINIBOSS_TIME`, `BOSS_TIME`, `PHYSICAL_BREAK`, `CRIT_RESIST_BREAK`, `CLICK_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE`, `COMBO`, `CLICK_FLAT_DAMAGE` (9). Grade 2 and grade 3 repeat the order with `_G2` / `_G3` (27 ids). `PHYSICAL_BREAK*` keeps branch `BREAK`, unit `points`, 1 point a level per grade (x grade), and its label becomes `Quebra de defesa`.

## Player-Facing Texts

| Where | Today | After |
| --- | --- | --- |
| Orina, leader bonus | `+20% de Poder Arcano para todo o grupo.` | `+20% de dano total.` |
| Kael 1, Corte Dimensional | `Um golpe que rasga o próprio espaço, causando 1500% de dano físico a todos os inimigos e ignorando 30% da resistência física.` | `Um golpe que rasga o próprio espaço, causando 1500% de dano a todos os inimigos e ignorando 30% da defesa.` |
| Kael 3, Brado Aterrador | `Um grito de guerra que causa Medo: inimigos perdem 30% de resistência física por 10s.` | `Um grito de guerra que causa Medo: inimigos perdem 30 pontos de defesa por 10s.` |
| Lyra 1, Flecha Dupla | `Dispara duas flechas, cada uma causando 300% de dano físico.` | `Dispara duas flechas, cada uma causando 300% de dano.` |
| Orina 1, Prisão de Espinhos | `Vinhas mágicas prendem os inimigos por 2s; enquanto presos, recebem +25% de dano mágico.` | `Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.` |
| Orina 2, Tempestade Arcana | `Raios caem por 6s, causando 200% de dano mágico por segundo a todos os inimigos.` | `Raios caem por 6s, causando 200% de dano por segundo a todos os inimigos.` |
| Orina 3, Chuva de Meteoros | `Uma chuva de estrelas causa 2500% de dano mágico em área.` | `Uma chuva de estrelas causa 2500% de dano em área.` |
| Seraphine 1, Bênção da Grande Árvore | `Por 15s, todos os aliados ganham +20% de Precisão, +30% de Força e +25% de velocidade de ataque.` | `Por 15s, todos os aliados ganham +20% de Precisão, +30% de dano e +25% de velocidade de ataque.` |
| Seraphine 2, Luz Divina | `Um pilar de luz atinge todos os inimigos, causando 800% de dano mágico (+50% contra criaturas do Submundo).` | `Um pilar de luz atinge todos os inimigos, causando 800% de dano (+50% contra criaturas do Submundo).` |
| Talent `PHYSICAL_BREAK*` label | `Quebra de defesa física` | `Quebra de defesa` (grades 2 and 3 show `Quebra de defesa (Grau 2)` / `(Grau 3)` as today) |
| Enemy line (HUD) | `Water  Physical def 10%  Magical def 10%  Crit res 12%` | `Water  Defesa 10%  Crit res 12%` |
| Equipamento attribute panel | `Tipo de dano: Físico`, `Quebra de defesa física: N`, `Quebra de defesa mágica: N` | no `Tipo de dano` line; one line `Quebra de defesa: N` |

Every other hero text, the skill names (`Tempestade Arcana` included), the classes and the other leader bonuses stay as they are.

---

## Assumptions & Open Questions

Rows marked `y` are owner decisions of 2026-10-31 (relayed by the orchestrator). Rows marked `n` are product owner defaults the owner has not seen yet; the design and tasks are written on them.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **D1** Merging the break talents | `PHYSICAL_BREAK`, `PHYSICAL_BREAK_G2`, `PHYSICAL_BREAK_G3` stay as the ids of the merged talent, labelled `Quebra de defesa`; `MAGICAL_BREAK*` leaves the catalog; each grade simply has 9 talents (27 in total), no replacement talent | Owner decision 1 (merge into one "Quebra de defesa"). Keeping the id means the previous backend still recognises every stored row (Facts); the freed slot needs no new content | y (merge, 9 per grade); n (id kept) |
| **D2** Refund of `MAGICAL_BREAK*` levels | The levels are deleted and their **talent points** return through `available = earned - spent` (Talent Refund). No coins are paid | Talents are bought with points, not coins (AD-013/AD-017); deleting the rows already gives every point back. A coin payment would need an exchange rate the owner has not chosen. **Open question Q1** | n (owner said "coins") |
| **D3** Orina leader bonus | Text `+20% de dano total.`, no game effect | Owner decision 2 | y |
| **D4** Bênção da Grande Árvore | x(1 + 30 x f / 100) on every strike while it runs (clicks, skill hits, aimed shot, ticks); the +25 x f click bonus stays; text `+30% de dano` | Owner decision 3 ("applies to all damage of skills; the +25 % click bonus stays"). Clicks already got x1.3 (they were physical), so the click keeps today's number (E10, E11) | y (skills); n (click keeps x1.3) |
| **D5** Prisão de Espinhos | x(1 + 25 x f / 100) on every strike against the monster while it runs, clicks included | Owner request: "gives a damage bonus (not magic damage)" | y |
| **D6** Brado Aterrador | Removes 30 x f points of the single defense (37.5 and 45 at levels 2 and 3), never below 0 | One defense left | y |
| **D7** Enemy rows whose two columns differ | The single defense is `physical_defense`; `magical_defense` is ignored on read and written equal to `defense` | Seeds are always equal (Facts); `physical_defense` is what clicks met, the main damage source | n |
| **D8** Expand/contract of the enemy defense | No schema change in this feature. The backend reads `physical_defense`, writes the defense to both columns, and the API answers `defense` plus `physicalDefense` and `magicalDefense` equal to it. The contract is TD-002 | An added `not null` column would break inserts of the previous backend (AD-016); answering the old fields keeps the previous Worker exact | n |
| **D9** Game read of an enemy | `defense ?? physicalDefense ?? 0`; `magicalDefense` is never read | Works against the previous backend and the new one in any deploy order | n |
| **D10** Enemy tag | One tag `Defesa <n>%` between the element tag and `Crit res <n>%` | New text is Portuguese (AD-007); the other tags stay English (TD-001) | n |
| **D11** Equipamento attribute panel | The `Tipo de dano` line is removed; `Quebra de defesa física` / `mágica` become one line `Quebra de defesa: <n>` (test id `stat-breakDefense`); 10 lines in total | With one damage type the line carries no information | n |
| **D12** New skill texts | The Player-Facing Texts table, word for word | Each sentence keeps its numbers and drops only the damage type; Brado says "30 pontos de defesa" because it subtracts points (Facts) | n |
| **D13** Names that stay | `Tempestade Arcana`, class `Maga`, `Precisão`, `velocidade de ataque`, "Especialista em dano mágico em área" is rewritten only in `README.md` | A skill name is not a damage type; README is the design doc the seed quotes | n |
| **D14** `hero-team` (not built) | Untouched. When it is picked up its spec drops "physical and magical defense" and Orina's ally passive "Erosão Arcana" becomes `-15 de defesa dos inimigos`. **Open question Q2**: should "dano de equipe" also merge into the single damage? | The owner asked for one damage kind; `hero-team` defines a second one for allies (AD-018) | n |
| **D15** Notice of the refund | None; the Talentos screen shows the larger `Pontos de talento` count | Same as `Reiniciar pontos`, which gives points back silently | n |
| **D16** Talent icon | `PHYSICAL_BREAK*` keeps `talent-break-physical.png` (a broken shield); `talent-break-magical.png` stays in the repository unused (TD-002) | The art reads as a generic defense break | n |
| **D17** Migration number | `V8__unified_damage.sql` (the next free number after `V7__player_resets.sql`). `campaign-chapters` (draft) plans V8 to V10; whichever feature ships second renumbers its files | Flyway refuses an unapplied version lower than the applied ones | n |
| Previous backend after the migration (deploy window, `./deploy.sh --rollback`) | It loads players fine (no `MAGICAL_BREAK*` row means level 0). If a player buys `MAGICAL_BREAK` there, the new backend ignores that row and its points count as available | Rollback safety (AD-016) | n |
| New game against the previous backend | The game drops every talent whose `baseId ?? id` is `MAGICAL_BREAK` from the list it receives, reads `physicalDefense` as the defense, and shows the old hero texts until the backend is migrated | Deploy order is not guaranteed | n |
| Language | Every new text is Portuguese (AD-007) | AD-007 | y |
| Observability (convention, not an AC) | The backend logs WARN `Ignoring talent outside the catalog username=<u> talent=<id> level=<n>` once per ignored row on load; nothing else new is logged | L-007 | n |
| Implicit dimensions | Input bounds: `POST /talents/MAGICAL_BREAK*/upgrade` answers 404 `TALENT_NOT_FOUND` (existing rule for an unknown id); defenses keep the 0 to 90 range. Failure states: a stored id outside the catalog is ignored instead of failing the request. Idempotency: the migration runs once (Flyway) and every statement is safe to repeat. Auth: unchanged (existing 401 and own data). Concurrency: the migration runs before the new slot serves; the previous slot may write a `MAGICAL_BREAK` row afterwards (row above). Data lifecycle: removed rows are gone for good; `talent_point_awards` is untouched. Observability: convention above. External dependency: N/A because only the database is involved. State transitions: a talent level only rises through an upgrade and falls through `Reiniciar pontos`, the account reset or this migration | Large-scope sweep | n |

**Open questions:** Q1 (D2: refund in points, or also coins at a rate the owner picks) and Q2 (D14: does "dano de equipe" of `hero-team` also merge) need the owner's answer; the feature is designed and tasked on the defaults, and Q1 changes only T3 if the owner picks coins.

---

## User Stories

### P1: One damage in combat ⭐ MVP

**User Story**: As a player, I want every hit to meet the same defense and every damage buff to raise every hit so that Prisão de Espinhos and Bênção da Grande Árvore matter in a clicker.

**Why P1**: It is the owner's request: the split made Prisão almost useless.

**Acceptance Criteria**:

1. The game SHALL compute every click, skill hit, aimed shot and damage tick with the Damage Rules formula, using one enemy defense and no damage type.  <!-- ubiquitous -->
2. WHEN an Orina skill hit lands on an enemy whose payload has `physicalDefense` 50 and `magicalDefense` 10 and no `defense` THEN the game SHALL deal E2 (Chuva de Meteoros on Base 1: 12.5).  <!-- event-driven -->
3. WHILE Prisão de Espinhos cast at level L runs on the monster, the game SHALL multiply every click, skill hit, aimed shot and tick against it by `1 + 0.25 x f(L)` (E3, E5, E6, E7).  <!-- state-driven -->
4. WHEN an Orina 3★ leader clicks a neutral, defenseless monster under Prisão level 1 without a critical THEN the game SHALL deal 1.75 (E4).  <!-- event-driven -->
5. WHILE Bênção da Grande Árvore cast at level L runs, the game SHALL multiply every click, skill hit, aimed shot and tick by `1 + 0.30 x f(L)` and add `25 x f(L)` to the click percent (E8 to E12).  <!-- state-driven -->
6. WHEN a Seraphine 3★ leader uses Luz Divina on a neutral, defenseless monster while her Bênção level 1 runs THEN the game SHALL deal 14.56 (E9).  <!-- event-driven -->
7. WHILE Brado Aterrador cast at level L runs on a monster, the game SHALL remove `30 x f(L)` points of its single defense for every strike, never below 0 (E15, E16).  <!-- state-driven -->
8. WHEN the player holds `PHYSICAL_BREAK` (all grades added) of value V THEN every strike SHALL meet `max(0, defense - V)` before Brado and armor pierce (E13, E14).  <!-- event-driven -->
9. WHILE Prisão level 1 and Bênção level 1 both run, a Base 1 click on a neutral, defenseless monster without a critical SHALL deal 2.03125 (E17).  <!-- state-driven -->
10. The game SHALL keep every damage number of `hero-skills`, `click-power` and `hero-ascension` whose strike met a defense equal on both sides and no Prisão or Bênção change (E1, E6, E7, E10, E11, E15).  <!-- ubiquitous -->

**Independent Test**: In the browser against the fake backend, an Orina 3★ leader on a 1 000-health neutral monster with defense 0 presses `1` (Prisão) and clicks once: the monster has 998.25 health.

---

### P1: One enemy defense from the backend to the screen ⭐ MVP

**User Story**: As a player, I want each enemy to show one defense so that I know what my hits meet.

**Why P1**: The split is visible on every enemy today.

**Acceptance Criteria**:

1. The backend SHALL model an enemy as element, one `defense` (0 to 90) and `critResistance` (0 to 100).  <!-- ubiquitous -->
2. WHEN an authenticated player calls `GET /progress` THEN every `boss`, `monster` and `miniboss` object SHALL carry `element`, `defense`, `physicalDefense`, `magicalDefense` and `critResistance`, with `physicalDefense` and `magicalDefense` equal to `defense` (chapter 1 boss: 30, 30, 30; stage 1 miniboss: 11, 11, 11; phase monster: 0, 0, 0).  <!-- event-driven -->
3. WHEN the backend reads an `enemies` row whose `physical_defense` is 85 and `magical_defense` is 86 THEN its `defense` SHALL be 85.  <!-- event-driven -->
4. WHEN the backend stores an enemy of defense d THEN the row SHALL hold `physical_defense` d and `magical_defense` d.  <!-- event-driven -->
5. WHEN the game shows a monster with element WATER, defense 11 and critical resistance 33 THEN the enemy line SHALL read `Water  Defesa 11%  Crit res 33%` (three tags; the double spaces are hidden gaps as today).  <!-- event-driven -->
6. WHEN the payload of a monster has no `defense` but `physicalDefense` 50 and `magicalDefense` 10 THEN the game SHALL show `Defesa 50%` and fight it with defense 50.  <!-- event-driven -->
7. WHEN the payload of a monster has no stats THEN the game SHALL show `Fire  Defesa 0%  Crit res 0%` and fight it with defense 0.  <!-- event-driven -->
8. WHEN the player holds `PHYSICAL_BREAK` value 5 and the monster has defense 20 THEN the enemy line SHALL read `Defesa 15%`, and after an upgrade to value 6 it SHALL read `Defesa 14%` without a new monster.  <!-- event-driven -->
9. The enemy line SHALL never contain `Physical def` or `Magical def`.  <!-- ubiquitous -->

**Independent Test**: A backend integration test reads `GET /progress` and finds `definition.boss.defense` 30 with `physicalDefense` 30 and `magicalDefense` 30; in the browser, a miniboss of payload `{ element: 'DARKNESS', physicalDefense: 50, magicalDefense: 10, critResistance: 100 }` shows `Darkness  Defesa 50%  Crit res 100%`.

---

### P1: One defense break talent and the refund ⭐ MVP

**User Story**: As a player, I want one "Quebra de defesa" talent and my points back from the magical one so that nothing I bought is lost.

**Why P1**: Owner decision 1; a talent that lowers a defense nobody uses would waste points.

**Acceptance Criteria**:

1. WHEN an authenticated player calls `GET /talents` THEN the backend SHALL answer 27 talents: the 9 ids of the Talent Catalog in grade 1, then grade 2, then grade 3, with branches `TIME, TIME, BREAK, BREAK, POWER, POWER, POWER, COMBO, POWER` in each grade.  <!-- event-driven -->
2. WHEN `GET /talents` answers `PHYSICAL_BREAK`, `PHYSICAL_BREAK_G2` and `PHYSICAL_BREAK_G3` THEN each SHALL carry `label` `Quebra de defesa`, `branch` `BREAK`, `unit` `points` and `perLevel` 1, 2 and 3.  <!-- event-driven -->
3. WHEN a client calls `POST /talents/MAGICAL_BREAK/upgrade` (or `_G2`, `_G3`) THEN the backend SHALL answer 404 with `code` `TALENT_NOT_FOUND` and change nothing.  <!-- event-driven -->
4. WHEN `V8__unified_damage.sql` runs THEN it SHALL delete every `player_talents` row whose `talent_id` is `MAGICAL_BREAK`, `MAGICAL_BREAK_G2` or `MAGICAL_BREAK_G3` and leave every other row, every `talent_point_awards` row and every wallet unchanged.  <!-- event-driven -->
5. WHEN a player with earned 20, `PHYSICAL_BREAK` 3 and `MAGICAL_BREAK` 5 is migrated THEN `GET /talents` SHALL answer `points` `{ earned: 20, spent: 3, available: 17 }` and `PHYSICAL_BREAK` level 3.  <!-- event-driven -->
6. WHEN a player holding `MAGICAL_BREAK` 10 and `MAGICAL_BREAK_G2` 3 is migrated THEN the available points SHALL grow by 16 (Talent Refund).  <!-- event-driven -->
7. IF a stored talent row has an id outside the catalog (a `MAGICAL_BREAK*` row written by the previous backend after the migration, or any other) THEN the backend SHALL answer the talent requests as if the row did not exist (level 0, no points spent on it) instead of failing.  <!-- unwanted-behavior -->
8. IF the game receives a talent list that contains `MAGICAL_BREAK`, `MAGICAL_BREAK_G2` or `MAGICAL_BREAK_G3` (previous backend) THEN it SHALL drop them: the Talentos screen SHALL show no card for them and no effect SHALL use them.  <!-- unwanted-behavior -->
9. WHEN the player opens Talentos THEN the `Quebra de defesa` column SHALL show, per grade, the cards `Quebra de defesa` and `Quebra de resistência a crítico` (grade 2 and 3 with ` (Grau N)`), and no card with the test id `talent-MAGICAL_BREAK`, `talent-MAGICAL_BREAK_G2` or `talent-MAGICAL_BREAK_G3`.  <!-- event-driven -->

**Independent Test**: A backend integration test stores `MAGICAL_BREAK` 5, `PHYSICAL_BREAK` 3 and earned 20 for a player, runs `V8__unified_damage.sql`, and reads `available` 17 and 27 talents; in the browser the Talentos screen has 6 cards in the `Quebra de defesa` column.

---

### P1: Texts without damage types ⭐ MVP

**User Story**: As a player, I want the hero, skill and attribute texts to speak of one damage so that what I read matches how the fight works.

**Why P1**: The owner asked to remove every reference to "dano mágico".

**Acceptance Criteria**:

1. WHEN a database is created from scratch THEN `GET /heroes` SHALL answer the "After" texts of the Player-Facing Texts table for Orina's leader bonus and the eight skill effects listed there.  <!-- event-driven -->
2. WHEN `V8__unified_damage.sql` runs on a database seeded before it THEN every hero text that still equals its "Today" value SHALL become its "After" value.  <!-- event-driven -->
3. IF a hero text listed in the Player-Facing Texts table holds a value other than its "Today" text (tuned in the database) THEN the migration SHALL leave it unchanged.  <!-- unwanted-behavior -->
4. The backend hero seed and the `GET /heroes` answer SHALL contain no `mágic`, `físic`, `Poder Arcano` or `de Força` substring.  <!-- ubiquitous -->
5. WHEN the player opens the hero detail of Orina THEN it SHALL show `Bônus de líder: +20% de dano total.`, and the skill bar of an Orina leader SHALL show `Líder · +20% de dano total.`.  <!-- event-driven -->
6. WHEN the player opens Equipamento with a leader THEN the attribute panel SHALL show, in order, the lines with test ids `stat-element`, `stat-clickDamage`, `stat-critChance`, `stat-critDamage`, `stat-armorPierce`, `stat-bossDamage`, `stat-minibossTime`, `stat-bossTime`, `stat-breakDefense`, `stat-breakCrit`, and no `stat-damageType`, `stat-breakPhysical` or `stat-breakMagical`.  <!-- event-driven -->
7. WHEN the player holds `PHYSICAL_BREAK` value 3 THEN the panel SHALL read `Quebra de defesa: 3`, and `Quebra de defesa: 0` without talents.  <!-- event-driven -->
8. The repository `README.md` SHALL describe one damage and one defense and SHALL contain no `dano mágico`, `dano físico`, `Poder Arcano`, `resistência física` or `resistência mágica`.  <!-- ubiquitous -->

**Independent Test**: A backend integration test sets Orina's leader bonus to the old text, runs the migration and reads `+20% de dano total.`; in the browser the Orina detail shows `Bônus de líder: +20% de dano total.` and the attribute panel has 10 lines with `Quebra de defesa: 0`.

---

## Edge Cases

- WHEN Prisão de Espinhos ends (2 s at every level) THEN the next click SHALL deal the damage without P (E4 then 1.4).
- WHEN Bênção da Grande Árvore ends THEN the next skill hit SHALL deal the damage without B.
- WHEN a damage tick lands at the second Prisão or Bênção ends THEN it SHALL follow the rule of `hero-skills` for ticks (the tick at the end second still gets the effect), now for every tick.
- WHEN `PHYSICAL_BREAK` is larger than the defense THEN the defense SHALL be 0, never negative (defense 10, break 15: full damage).
- IF a payload carries both `defense` 40 and `physicalDefense` 70 THEN the game SHALL use 40.
- WHEN a player who never bought `MAGICAL_BREAK*` is migrated THEN their points and levels SHALL stay the same.
- WHEN `Reiniciar pontos` or the account reset runs for a player who still has an ignored `MAGICAL_BREAK*` row THEN that row SHALL be deleted with the others (existing `deleteLevels` / `deleteByUsername`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UDMG-01 | P1: One damage in combat - AC 1, 2, 10 (one defense in the formula, no damage type) | Tasks | Pending |
| UDMG-02 | P1: One damage in combat - AC 3, 4, 9 (Prisão on every strike) | Tasks | Pending |
| UDMG-03 | P1: One damage in combat - AC 5, 6 (Bênção on every strike) | Tasks | Pending |
| UDMG-04 | P1: One damage in combat - AC 7, 8 (Brado and the break talent on the single defense) | Tasks | Pending |
| UDMG-05 | P1: One enemy defense - AC 1 to 4 (backend model, persistence, API expand) | Tasks | Pending |
| UDMG-06 | P1: One enemy defense - AC 5 to 9 (game tag and tolerant read) | Tasks | Pending |
| UDMG-07 | P1: One defense break talent - AC 1 to 3, 7 (catalog of 27, tolerant load) | Tasks | Pending |
| UDMG-08 | P1: One defense break talent - AC 4 to 6 (migration and refund) | Tasks | Pending |
| UDMG-09 | P1: One defense break talent - AC 8, 9 (game drops the retired talent, Talentos screen) | Tasks | Pending |
| UDMG-10 | P1: Texts without damage types - AC 1 to 5 (hero texts: seed, migration, screens) | Tasks | Pending |
| UDMG-11 | P1: Texts without damage types - AC 6, 7 (attribute panel) | Tasks | Pending |
| UDMG-12 | P1: Texts without damage types - AC 8 (README) | Tasks | Pending |

**Coverage:** 12 total, 12 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `git grep -n -i -E "mágic|físic|Poder Arcano|de Força"` over `backend/src/main` and `game/src` finds nothing (skill name `Tempestade Arcana` matches none of them).
- [ ] `git grep -n -E "MAGICAL|magicalDefense|damageType"` over `game/src` (tests excluded) finds only the retired-talent filter and the documented fallback of TD-002.
- [ ] Unit tests pin E1 to E17, the Talent Refund rows and the 27-talent catalog; an integration test runs the migration on a seeded database.
- [ ] e2e scenarios cover the enemy tag, Prisão on a click, Bênção on a skill hit, the Talentos column, the attribute panel and Orina's leader bonus.
- [ ] Every existing backend, unit and e2e suite passes; the only edited tests are those that pinned the split, renamed after the new behaviour (L-054).
