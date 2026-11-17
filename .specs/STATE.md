# STATE

## Decisions

### AD-001
- **Decision**: Authentication uses a stateless HS256 JWT access token (24 h) plus a rotating opaque refresh token (30 days, SHA-256 hashed in `refresh_tokens`); the game keeps the session in `localStorage`.
- **Reason**: Lets a player stay signed in on one browser without server-side session state per request, while refresh tokens remain revocable.
- **Trade-off**: A localStorage refresh token is exposed to XSS, and a revoked user keeps a valid access token until it expires (up to 24 h).
- **Scope**: `backend` security/session code, `game/src/auth`, `game/src/api`
- **Date**: 2026-10-17
- **Status**: active

### AD-002
- **Decision**: Kills are reported by the game in batches (`POST /wallet/sync`); the server credits only the drops it pre-rolled and accepts at most one kill per level `kill-interval-ms` (bucket of 20).
- **Reason**: One request per kill does not scale for a clicker, and combat runs in the browser so the server cannot see a kill.
- **Trade-off**: A client can claim kills it did not make, up to the allowance; kills never synced are lost. Closing the gap needs server-side combat.
- **Scope**: `backend` wallet code, `game/src/scenes/ClickerGame.js` and any future reward (XP, items) that depends on kills
- **Date**: 2026-10-17
- **Status**: active

### AD-003
- **Decision**: The game follows a hexagonal layout (ADR 0007): `domain` (pure rules), `application` (services that receive ports by injection), `adapters` (Phaser scenes, http, storage), composed in `main.js`; imports point inward only and a Vitest test enforces it.
- **Reason**: The stages feature adds a state machine, timers and an ordered report queue that must be testable without Phaser or the network, and `ClickerGame` already mixed rendering with sync policy.
- **Trade-off**: More files and one more hop between a click and a request; hand-written factories instead of a DI container.
- **Scope**: all of `game/src`; new game features are written in this shape
- **Date**: 2026-10-17
- **Status**: active

### AD-004
- **Decision**: Campaign progress is a server-side state machine. The game reports `CLEARED` or `FAILED` from the position it leaves (`POST /progress/outcome`), the server derives the destination and answers 409 with the stored progress on any mismatch; the game mirrors the rules locally and advances before the server answers.
- **Reason**: Play must not wait between phases, but the client must not be able to name an arbitrary destination.
- **Trade-off**: The rules exist on both sides, and boss time limits are not enforced by the server (same limit as AD-002).
- **Scope**: `backend` progress code (ADR 0006), `game/src/domain/campaign`, `game/src/application/campaign`
- **Date**: 2026-10-17
- **Status**: active

### AD-005
- **Decision**: Hero cards are server-authoritative. The backend rolls a drop in the same transaction that accepts a `CLEARED` miniboss or chapter boss report (campaign or farm), stores the bag, and answers `drop`; the game never chooses or reports a card.
- **Reason**: A client-chosen 1 % drop is trivial to forge, and queues of pre-rolled cards (like coins) would let the client see the next card and skip fights.
- **Trade-off**: The server still cannot see a kill (AD-002), so a client can claim wins it did not make; farm wins are spaced by 5 s and the chapter boss pays 10 wins per UTC day.
- **Scope**: `backend` card code (ADR 0007), `game/src/application/campaign`, `game/src/application/farm`
- **Date**: 2026-10-18
- **Status**: active

### AD-006
- **Decision**: The hero of a chapter depends on the player: the starting element (FIRE, WATER or NATURE) chosen at registration, then the element it hits hardest, the remaining one, DARKNESS and LIGHT give the chapter order. The catalog stores elements, not chapter numbers; each chapter boss releases the hero of the next chapter.
- **Reason**: The story changes with the first choice (user decision).
- **Trade-off**: A hero's chapter is not static data; enemy elements per chapter are a separate, still undecided feature.
- **Scope**: `backend` `ChapterOrder`, `CardDropper`, `HeroService`; future chapter content
- **Date**: 2026-10-18
- **Status**: active

### AD-007
- **Decision**: New player-facing text is Portuguese; the text that already exists stays English as technical debt TD-001 (`.specs/features/characters/spec.md`) until a dedicated translation task.
- **Reason**: User decision: everything in Portuguese, existing text recorded as debt.
- **Trade-off**: The game is mixed-language until TD-001 is done; there is no translation layer.
- **Scope**: all of `game/src` and `game/e2e`
- **Date**: 2026-10-18
- **Status**: active

### AD-008
- **Decision**: Every boss win drops a card (rates 1.0), the chapter boss opens the next chapter (1 to 5, only chapter 5 completes), and the farm lists only the bosses of the current chapter.
- **Reason**: User decision after playing: the game stopped after the chapter 1 boss and drops were too rare to test the bag.
- **Trade-off**: A player cannot replay the bosses of earlier chapters; farming a miniboss every 5 s at 100 % makes cards cheap. Chapters 2 to 5 reuse the chapter 1 shape with scaled numbers (enemy design per chapter is still open, AD-006).
- **Scope**: `backend` `Progress`, `ChapterDefinition.of`, `ChapterSeeder`, `application.yaml`; `game` `campaignSession`
- **Date**: 2026-10-18
- **Status**: active; "the farm lists only the bosses of the current chapter" and its trade-off are superseded by AD-024 once spec `boss-replay-chapters` ships (proposed)

### AD-009
- **Decision**: Equipment is server-authoritative like the cards: pieces are rolled by the backend in the boss report transaction, stored one row each in `equipment_pieces`, and refined, rerolled and sold with copper under the `player_cards` row lock (lock order `progress`, `player_cards`, `wallets`). The game computes damage from the pieces the server returns.
- **Reason**: A client-chosen drop or cost is trivial to forge (AD-005), and per-piece state does not fit the `PlayerCards` row.
- **Trade-off**: Damage is still computed in the browser (AD-002), so equipment raises the value of forging clicks, not the ease; `NO_AFFIX_LEFT` is unreachable with the current catalog.
- **Scope**: `backend` equipment code (ADR 0008), `game/src/domain/equipment`, `game/src/application/equipment`, `ClickerGame`
- **Date**: 2026-10-18
- **Status**: active

### AD-010
- **Decision**: Flyway owns the schema (`V1__schema.sql` onward, `ddl-auto: validate`); every reference is a SQL foreign key, with entities holding plain id columns. Player rows cascade with the user, catalog references restrict; enemies and drop rules are catalogs that stages and chapters reference.
- **Reason**: `ddl-auto: update` cannot add constraints, drop columns or move data, so rows could point at players, heroes or stages that did not exist.
- **Trade-off**: A schema change needs a migration file plus the entity change; the local pre-Flyway database is recreated once (`docker compose down -v`) and its players are lost.
- **Scope**: `backend/src/main/resources/db/migration`, every `backend` entity and repository (ADR 0009)
- **Date**: 2026-10-19
- **Status**: active

### AD-011
- **Decision**: Talents are server-authoritative like the equipment: the backend keeps one `player_talents` row per upgraded talent, takes the copper under the wallet row lock and answers the tree with the value and the next price of each talent; the upgrade request carries the level the player saw (`fromLevel`) and a stale one answers 409 `TALENT_LEVEL_MISMATCH`. The game types no number of the catalog.
- **Reason**: A client-chosen level or price is trivial to forge (AD-009), and a double click must not buy two levels.
- **Trade-off**: Levels cannot be refunded or reset; the price curve `round(300 x 1.6^n)` is a config proposal that was not balance-tested; combat is still in the browser (AD-002).
- **Scope**: `backend` talent code (ADR 0010, `V3__player_talents.sql`), `game/src/domain/talents`, `game/src/application/talents`, the Talentos screen
- **Date**: 2026-10-21
- **Status**: active

### AD-012
- **Decision**: Click power has one pure builder, `leaderAttacker`, that sums equipment, leader stars and power talents (percents add, critical chance caps at 100); the combo (+1 % per click up to +50 %, lost after 1.5 s, frozen while paused) multiplies the final click only and Lyra's leader bonus (30 % double critical click) is rolled once per click in the browser. The attribute panel of the Equipamento screen reads the same builder.
- **Reason**: The combat and the panel must show the same numbers, and skills must not get the combo or the double click (the user wants the click to differ from the skills).
- **Trade-off**: A leader with stars changes every number pinned by skill tests (they carry the 1.1, 1.2 or 1.4 star factor); the combo makes two clicks in the same streak deal different damage, so tests that need plain clicks let the combo lapse first.
- **Scope**: `game/src/domain/combat`, `game/src/domain/heroes/starBonus.js`, `leaderBonus.js`, `ClickerGame`
- **Date**: 2026-10-21
- **Status**: active

### AD-013
- **Decision**: Talents are bought with talent points, not coins: the first clear of a phase pays 1 point, of a miniboss 2 and of a chapter boss 5 (a replay, a failure and a farm win pay nothing); every level of every talent costs 1 point. The backend records one `talent_point_awards` row per player and cleared position (`chapter:stage:encounter:phase`) in the outcome report transaction, derives `available = earned - spent` from the awards and the levels, and an upgrade takes the `progress` row lock. A ninth talent `COMBO` (branch `COMBO`, 5 % a level, max 50) is the cap of the combo bonus; without it the combo gives nothing.
- **Reason**: User decision: progress, not coins, should buy talents, and the combo should be a growing upgrade.
- **Trade-off**: A new player starts with no combo bonus until the first point is spent; clears made before `V5` earn nothing (the migration grants each player as many `legacy` points as the talent levels they already owned); levels still cannot be refunded.
- **Scope**: `backend` talent and progress code (ADR 0011, `V5__talent_point_awards.sql`), `game/src/domain/combat/combo.js`, `game/src/domain/talents`, the Talentos screen, `campaignSession`
- **Date**: 2026-10-22
- **Status**: active; supersedes the coin price of AD-011

### AD-014
- **Decision**: Crystals are a server-authoritative special currency (`player_crystals`, no row = 0) with no source yet; the auto click level (`player_auto_click`, 0 to 4, 500/250/150/100/50 ms) is bought with them under the `progress` row lock, with `fromLevel` and a 409 `AUTO_CLICK_LEVEL_MISMATCH` carrying the stored state. The game clicks in the browser from chapter 2 through the same path as a manual click.
- **Reason**: Same forgery argument as AD-009/AD-011; the owner has not chosen how crystals are earned (an account reset is being considered).
- **Trade-off**: Nobody can upgrade until a crystal source exists; the click rate is not checked by the server (AD-002).
- **Scope**: `backend` auto click code (`V6__auto_click.sql`, `AutoClick*`), `game/src/domain/combat/autoClick.js`, `game/src/application/autoClick`, the HUD box in `ClickerGame`
- **Date**: 2026-10-27
- **Status**: active

### AD-015
- **Decision**: The account reset is the crystal source: `POST /account/reset` from the chapter the player saw (`fromChapter`, 409 `RESET_CHAPTER_MISMATCH` otherwise) under the `progress` row lock puts the campaign back at chapter 1, deletes every talent level and talent point award, pays `min(chapter, 5)` crystals and raises `player_resets`. Coins, equipment, cards, crystals and the auto click level stay. The auto click is unlocked also once `resets >= 1`.
- **Reason**: User decision: reset from chapter 2, chapter N pays N crystals, the auto click must work right after a reset.
- **Trade-off**: 185 crystals for the top auto click mean 37 resets at least; resets have no cooldown; combat is still in the browser (AD-002), so a forged campaign reaches chapter 5 faster.
- **Scope**: `backend` reset code (`V7__player_resets.sql`, `AccountReset*`), `AutoClickService`, `game/src/domain/campaign/accountReset.js`, `game/src/application/accountReset`, the auto click box of `ClickerGame`
- **Date**: 2026-10-27
- **Status**: active; gives AD-014 its crystal source

### AD-016
- **Decision**: The backend goes live only through the blue-green watcher that `./publish.sh` starts: every new commit on `origin/main` that changes `backend/**` is built from the commit tree into the idle slot, checked by the API regression suite on the real database and switched in by rewriting the Traefik file-provider conf inside the proxy container, which Traefik hot-reloads (nginx until 2026-11-01: a Windows bind mount never wakes the Traefik file watcher, so the conf is written with `docker exec`); the old slot is kept stopped 5 minutes for `./deploy.sh --rollback`. Every Flyway migration must keep the previous backend working (expand/contract: add columns and tables first, drop them in a later commit), because a failed deploy does not undo the migration it ran.
- **Reason**: User decision: deploy on every push to `main` with no downtime, only after a regression suite passed; Flyway has no down migrations and both slots share one database.
- **Trade-off**: A destructive migration needs two commits; a commit that breaks the old backend through its migration hurts even when its suite fails; uncommitted work no longer reaches players through `publish.sh`.
- **Scope**: `deploy/`, `publish.sh`, `deploy.sh`, `backend/Dockerfile`, the `deploy` profile of `backend/docker-compose.yml`, `backend/src/main/resources/db/migration`
- **Date**: 2026-10-28
- **Status**: active until the cutover of spec `supabase-postgres`; then its deploy mechanism (watcher, local slots, Traefik, tunnel) is superseded by AD-023 and kept only as the way back for 30 days. The expand/contract rule stays active.

### AD-017
- **Decision**: The talent tree has 10 talents in 3 grades each (30 ids: `<ID>`, `<ID>_G2`, `<ID>_G3`). Grade N costs N points a level, gives N times the grade 1 value a level and opens at level 10 of the grade before (else 409 `TALENT_LOCKED`); the game adds the values of every grade of a talent. `CLICK_DAMAGE` gives 5 % a level and a tenth talent `CLICK_FLAT_DAMAGE` adds 1, 3, 5... up to 19 to the base damage. A phase pays 0 points (only minibosses and chapter bosses pay), and `POST /talents/reset` (`Reiniciar pontos`) takes every level back and keeps the points earned.
- **Reason**: Owner changes after AD-013 (`b443844`, `4a4f86f`, `08be5c9`), recorded here because the commits changed no spec; the talents Verifier (2026-10-28) found the drift.
- **Trade-off**: A reset with no cost lets the player respec at will; the price of grade 3 makes a full tree far longer to reach than AD-013 planned.
- **Scope**: `backend` talent catalog, upgrade and reset code, `game/src/domain/talents`, the Talentos screen
- **Date**: 2026-10-23
- **Status**: active; supersedes the 9-talent tree, the 1 point a level for every talent and the phase point of AD-013

### AD-018
- **Decision**: A player fights with a team: the leader (still `player_cards.leader_id`) plus up to 4 allies in ally slots bought with copper (1, 2, 3, 4 ouro). Slot n opens on the first win of the chapter 4 + n boss (`cleared_chapters`). The backend stores the bought slots and the allies per account and keeps them through account resets (`GET /heroes` team fields, `PUT /team`, `POST /team/slots` with `fromSlots`). The team fights only while the campaign is at chapter 5 or later. Allies hit in the browser once a second with a new damage type TEAM: leader's element, own stars and worn pieces, resisted only by a new enemy attribute `team_resistance` (0 to 90, expand migration). Each ally brings a passive while it fights. While allies are drawn, the leader stands at the tip of an attack formation with the allies behind it, above and below (spec `hero-team`).
- **Reason**: Owner request and answers of 2026-10-30 ("montar equipes de 5 heróis"; team only from chapter 5; slots bought one per chapter; a damage type of its own); `characters` deferred the team ("one active leader now, team later; the leader is stored as a single value").
- **Trade-off**: Ally damage is computed in the browser like the click (AD-002), so a forged client can claim more. Slots 2 to 4 need the chapter 6 to 8 bosses of AD-019. The slot prices rely on the coin drops of AD-019. The unique key of `enemies` must change without breaking the running backend.
- **Scope**: `backend` hero, team and enemy code, `game/src/domain/combat`, `game/src/domain/heroes`, the Equipe screen, `ClickerGame`
- **Date**: 2026-10-30
- **Status**: active (owner answers 2026-10-30 and 2026-10-31; Q33 to Q35 kept as defaults the owner did not object to); ships after `campaign-chapters`; supersedes the single-leader scope of `characters` and adds a damage type beside PHYSICAL and MAGICAL (`elements`, `hero-skills`)

### AD-019
- **Decision**: The campaign runs to chapter 15 (`ChapterOrder.MAX_CHAPTER = 15`): the chapter 5 boss opens chapter 6 and only the chapter 15 boss completes. Chapters 6 to 15 grow health x2 and defenses +3 per chapter (caps 80, critical resistance 70), and the player's 5-chapter element order repeats. Every health value becomes a 64-bit integer from the database (expand/contract under AD-016) to the game. The reset pays as many crystals as the chapter left (no cap at 5; completed pays 15). On-screen damage and HP numbers abbreviate from 1 000 with K, M, B, T. Coin drops per kill become `2m-6m` (phase), `8m-20m` (miniboss) and `30m-70m` (boss), with `m = 2^(c-1)` up to chapter 8 and `128 + 32(c-8)` after. A first run earns about 1 ouro by the chapter 5 boss and 10 ouro by the chapter 8 boss (spec `campaign-chapters`).
- **Reason**: Owner request and answers of 2026-10-30 ("os próximos capítulos vão aumentando de dificuldade"; overflow must never be a limit; crystals keep growing with the chapter; the ally slots of AD-018 must be affordable on a first run); `hero-team` slots and `miniboss-adds` need chapters past 5 and 10.
- **Trade-off**: The curve is not balance-tested. Players completed at chapter 5 move to chapter 6 and lose the chapter 5 farm list (AD-008). A reset pays up to three times more crystals than AD-015 planned. The health columns need two migrations (expand, then contract after a good deploy). The game's numbers stay exact only up to 2^53 - 1. Coins grow about 9 times faster by chapter 8 than before, and the refine costs stay as they are.
- **Scope**: `backend` `ChapterOrder`, `ChapterDefinition`, `ChapterSeeder`, `AccountReset`, every class carrying health; `backend/src/main/resources/db/migration`; `game/src/domain/campaign/accountReset.js`, `game/src/domain/combat/monster.js` and the damage number format
- **Date**: 2026-10-30
- **Status**: active (owner answers 2026-10-30 and 2026-10-31); supersedes "only chapter 5 completes" of AD-008 and the reward cap 5 of AD-015

### AD-020
- **Decision**: Heroes reach 9 stars with the existing fusion (3 copies of 3 to 8 stars make 1 copy of the next stars, cards only, drop rates unchanged: one 9-star hero costs 19 683 blank cards). Every skill of a hero has a level: 0 while locked, else `1 + floor((stars - slot) / 3)`, so each star from 4 to 9 raises one skill in slot order (4 slot 1, 5 slot 2, 6 slot 3, 7 slot 1, 8 slot 2, 9 slot 3) and a 9-star hero has every skill at level 3; the backend answers it as `skills[].level`. A skill used at level L multiplies its damage percents and effect strength by `1 + 0.25 x (L - 1)`; cooldowns and durations never change. The leader's star bonus gains rows 4 to 9 (+30 % click damage, +5 critical chance, +25 % critical damage per star: 9 stars is +220 %, +60, +200 %), and the `hero-team` ally star multiplier gains 10, 12, 14, 16, 18, 20. Stars 4 to 6 are drawn purple `#7a3fa0`, stars 7 to 9 as a gold chip `#d9a521` with text `#201e1d`. The backend first ships a version that reads 0 to 9 star copies, then opens the fusions of 3 to 8 stars, so a rollback never lands on a backend that throws on a 4-star copy (spec `hero-ascension`).
- **Reason**: Owner request of 2026-10-31 ("poder fazer upgrade no herói além de 3 estrelas, dessa maneira vai aumentando os níveis da skill e o poder do herói") and the owner's review of the first draft the same day: cap 9 so the top takes a long farm, one skill per star like stars 1 to 3, a second colour from 7 stars, no gold cost, no drop rate change; the previous backend rejects stored copies above 3 stars.
- **Trade-off**: 19 683 blank cards for one 9-star hero is a deliberate long grind and is not balance-tested; the skill level rule exists on both sides (backend answers it, the game falls back to 1); a game still on the previous version gives a 4-star leader no star bonus until the Worker is republished.
- **Scope**: `backend` `PlayerCards`, `HeroView`, `HeroController`; `game/src/domain/heroes`, `game/src/domain/skills`, the hero views, the skill bar and `style.css`; `hero-team` Ally Damage
- **Date**: 2026-10-31
- **Status**: active (owner decisions of 2026-10-31: D1 cap 9, D2 cards only, D3 one skill per star, D7 purple then gold, D9 drop rates unchanged, two-step deploy). The numbers of D4 (+25 % per level), D5 (star bonus rows) and D6 (ally multiplier) are product owner defaults the owner has not changed. Supersedes "A 3-star card cannot be fused" of `characters` and extends the star factor of AD-012 and the star multiplier of AD-018

### AD-021
- **Decision**: The game has one kind of damage and one enemy defense. Every click, skill hit, aimed shot and tick meets the same `defense`; no skill or attacker has a damage type. Prisão de Espinhos multiplies every strike against its monster by `1 + 0.25 x f`, Bênção da Grande Árvore every strike by `1 + 0.30 x f` (its click bonus stays), Brado Aterrador removes `30 x f` points of the one defense. `MAGICAL_BREAK*` leaves the talent tree (9 talents per grade, 27 ids); `PHYSICAL_BREAK*` keeps its id and is labelled `Quebra de defesa`; the migration deletes the `MAGICAL_BREAK*` levels, whose talent points come back through the derived balance. The backend keeps the `enemies` columns, reads `physical_defense`, writes the defense to both, and answers `defense` plus `physicalDefense` and `magicalDefense` equal to it until a contract feature (TD-002); the game reads `defense ?? physicalDefense ?? 0` and drops `MAGICAL_BREAK*` from any talent list. Orina's leader bonus text is `+20% de dano total.` with no effect yet (spec `unified-damage`).
- **Reason**: Owner request of 2026-10-31: Prisão raised only magical damage while clicks were physical, so the split made Orina's first skill almost useless; "keep only one kind: DANO".
- **Trade-off**: Two database columns and two API fields carry one value until TD-002 is paid; a backend still on the previous version can sell `MAGICAL_BREAK` levels after the migration, which the new backend ignores (free points); the talent id `PHYSICAL_BREAK` no longer matches its name. Refund in points, not coins, is the product owner's default pending the owner's answer (spec Q1).
- **Scope**: `backend` `EnemyStats`, enemy persistence, `ProgressController`, `TalentCatalog`, `PlayerTalents`, `TalentService`, `HeroSeed`, `V8__unified_damage.sql`; `game/src/domain/combat`, `game/src/domain/skills`, `game/src/domain/talents`, `game/src/domain/equipment/leaderStats.js`, `game/src/application/talents`, `ClickerGame`; `README.md`
- **Date**: 2026-10-31
- **Status**: proposed (owner decisions 1 to 3 of 2026-10-31; awaiting approval of the spec and the answers to Q1 and Q2). Supersedes the PHYSICAL / MAGICAL damage types and the two defenses of `elements` and `hero-skills`, the `MAGICAL_BREAK` talent of `talents` and AD-017 (10 talents per grade becomes 9), the "physical" / "magical" wording of the `hero-ascension` Skill Levels table, and "a damage type beside PHYSICAL and MAGICAL" of AD-018 (`hero-team`, not built, is revised when it is picked up; spec Q2)

### AD-022
- **Decision**: The game's look is the Grove theme of spec `ui-redesign`: the palette and recipe tokens of `game/public/style.css :root` (parchment panels, dark wood frames, ember primary and wood secondary buttons, chips), Cinzel 700 for headings and numbers, Figtree for body text. New UI reads the recipe tokens; painted textures are switched on through `--texture-parchment` and `--texture-wood`.
- **Reason**: Owner request of 2026-11-12 ("redesenhasse todo o jogo no estilo da imagem").
- **Trade-off**: Contrast is held by the token values; a new colour must be checked against the parchment and wood bases. The Organic look (Caprasimo, cream pills) is retired.
- **Scope**: `game/public/style.css`, `game/index.html`, the Phaser colour constants of `ClickerGame.js`, `MainMenu.js`, `Preloader.js`.
- **Date**: 2026-11-12
- **Status**: active (owner approval of spec `ui-redesign` on 2026-11-12)

### AD-023
- **Decision**: Production runs off the owner's machine. The backend is the Google Cloud Run service `infinity-grove-backend` in `southamerica-east1`, built from the unchanged `backend/Dockerfile` into Artifact Registry (`southamerica-east1-docker.pkg.dev/<project>/infinity-grove/backend:<commit>`): 1 vCPU, 1 GiB, startup CPU boost, request-based billing, scaled to zero (`--min-instances=0`), at most one serving instance (`--max=1`) and one per revision (`--max-instances=1`), listening on `PORT` (`server.port: ${PORT:8080}`), public (`allUsers` invoker). A public `GET /health` runs `select 1` and answers the commit of the image (`APP_COMMIT`); the startup and liveness probes call it. The GitHub Actions workflow `.github/workflows/deploy.yml`, on every push to `main`, deploys the newest commit of `backend/` when it differs from the live commit: `./gradlew ktlintCheck test`, the image with `deploy/regression.mjs` on a throwaway Postgres, a Workload Identity Federation sign-in (pool `github`, only this repository on `refs/heads/main`, no service account key), a push to Artifact Registry, a revision with no traffic and the tag `c-<commit>` (`deploy-cloudrun`); every run first looks up the image tagged with that commit and skips the tests, the build, the runner regression and the push when it exists, and a run by hand in mode `build-only` prebuilds it (or `rehearsal`, which also reads the service), so the cutover window is about 15 minutes; then `deploy/cloudrun/cloudRunRelease.mjs release`: `/health` and the regression on the tag URL, 100 % of the traffic with `--clear-tags`, a check of the service URL, and the traffic sent back to the previous revision on failure. Then it publishes the game Worker with `BACKEND_URL` (a repository variable) as the service URL. The repository variable `CLOUD_RUN_PRODUCTION` turns it on at the cutover. Flyway runs at boot, during the deploy health check of the new revision. The database is the Supabase project `jnqlrdnwwqslihncszej` through the Session pooler (`aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`) with a Hikari pool of 5 and 1 idle. Secrets live only in Secret Manager (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`; env vars at `latest`, read by the runtime account `infinity-grove-run`) and in the GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, created by the owner only and piped from the gitignored repo-root `.env` (also the input of the one-time copy `deploy/db/copyToSupabase.mjs`, checked by `deploy/lib/databaseEnv.mjs`). The `spring-datasource-*` secrets do not exist until the copy prints `Verificação OK`, so no revision can boot on the empty Supabase. The game tables stay in `public`, the copy revokes every grant of `anon`, `authenticated` and `service_role`, and the Data API is off. An Artifact Registry cleanup policy keeps the 3 newest images and deletes older ones after 30 days; a billing budget alerts at 10 %, 50 % and 100 %. The start screen waits up to 60 s for `/api/health` and shows `Acordando o servidor, aguarde...` after 2 s. Integration tests stay on Testcontainers. The local blue-green stack is only the way back for 30 days (`./publish.sh --way-back`), then removed (TD-005). The Fly.io app and the branch `flyio-new-files` are deleted (spec `supabase-postgres`, revision 3).
- **Reason**: Owner request of 2026-11-15 (database off the local Docker, keep the players' data) and the owner's choice of 2026-11-16 of Google Cloud Run for the backend in the same feature (Render and then Fly.io dropped). The site must work without `publish.sh`. The direct Supabase connection is IPv6 only and the Transaction pooler (6543) breaks Flyway and JDBC prepared statements. A revision deployed with no traffic and checked on its tag URL never takes traffic when it fails, and going back is one traffic command. Workload Identity Federation leaves no long-lived credential in GitHub. One serving instance plus the new revision's peak at 10 of the pooler's 15 connections. Scale to zero keeps compute in the free tier.
- **Trade-off**: A cold start costs a JVM boot (only the start screen waits; TD-006). A failing revision's migration lands on the managed production database and is not undone when the revision fails or the traffic goes back (AD-016 expand/contract still holds). The production regression writes and deletes a throwaway user on every backend deploy. One serving instance means no redundancy. Internet egress to South America has no free allowance (a few cents a month). A wrong new `latest` secret version breaks the next cold start, not only the next deploy. Going back to the local stack loses what was written on Supabase after the cutover. The Free plan has no managed backup (TD-003), and `sslmode=require` does not verify the server certificate (TD-004).
- **Scope**: `.github/workflows/deploy.yml`, `deploy/cloudrun/` (`cloudRunRelease.mjs`, `artifact-cleanup.json`), `deploy/db/`, `deploy/lib/dotenv.mjs`, `deploy/lib/databaseEnv.mjs`, `.env.example`, `.gitignore`, `publish.sh`, `backend/src/main/resources/application.yaml` (`server.port`, `spring.datasource.hikari`, `app.commit`), the `HealthController`, `JdbcDatabaseHealth` and `DatabaseHealthPort` of `backend`, `SecurityConfig`, `game/src/adapters/http/healthApi.js`, `game/src/composition.js`, `MainMenu`, `backend/docs/adr/0012-production-on-cloud-run-and-supabase.md`; outside the repository: the Google Cloud project with its Secret Manager, Artifact Registry, Workload Identity pool and budget
- **Date**: 2026-11-16
- **Status**: active (revision 3, approved by the owner on 2026-11-16 with the recommended defaults of Q9 to Q15). Supersedes, from the cutover on, the deploy mechanism of AD-016 (its expand/contract rule stays); extends the database of AD-010 (Flyway still owns the schema)

### AD-024
- **Decision**: The farm (Rever chefes) can replay any chapter the campaign has reached, not only the current one. The reached chapters are 1 to `progress.position.chapter` (after `withNextChapterOpen`; a completed campaign reaches 1 to 15), so an account reset brings them back to chapter 1. A chapter below the current one has all 10 minibosses and its chapter boss beaten. `GET /farm?chapter=<n>` answers that chapter (`chapter`, `chapters`, `bosses`, `chapterBossWinsLeft`, `definition`; a chapter above the reached one answers the reached one), and `POST /farm/outcome` takes an optional top-level `chapter` (absent: the current chapter; above it: 409 `BOSS_NOT_AVAILABLE`; not an integer of at least 1: 400). A boss of chapter c fights with chapter c's seeded numbers and pays chapter c's rolls: the miniboss card of chapter c's hero, the chapter boss card of chapter c + 1's hero, chapter c's piece rarity tier; still no copper and no talent points. The daily chapter boss limit (10) and the 5 s farm interval stay one per player across every chapter. The game shows a row of chapter chips under the map title (hidden while only chapter 1 is reached), opens on the current chapter, and sends `chapter` only for a chapter other than the current one. No Flyway migration (spec `boss-replay-chapters`).
- **Reason**: Owner request of 2026-11-17 ("no rever chefe nao da pra escolher capitulo anterior"); the backend already keys every farm reward by a chapter number and stores every chapter definition, so the fought chapter only has to become an input.
- **Trade-off**: Chapter bosses become farmable from chapter 2 instead of only after chapter 15: up to 10 chapter boss wins a day can now give next-chapter cards at 80 % and pieces at 100 %, with epic and legendary pieces from the chapter 5 boss once a player is in chapter 6; the shared daily limit keeps the daily maximum where it was. A forged client can still claim wins (AD-002). A farm win of an earlier chapter boss missing from `cleared_chapters` counts as its first win and records the chapter. Resolves the "lose the chapter 5 farm list" trade-off of AD-019.
- **Scope**: `backend` `Farm.kt`, `FarmService`, `FarmUseCase`, `FarmController`; `game/src/adapters/http/farmApi.js`, `game/src/application/farm/farmSession.js`, `game/src/domain/campaign/campaign.js`, `game/src/domain/campaign/bossMap.js`, `game/src/adapters/phaser/views/farmView.js`, `HeroUi`, `ClickerGame`, `game/public/style.css`; `game/e2e/support/fakeBackend.js`
- **Date**: 2026-11-17
- **Status**: active (owner approval of 2026-11-17, "Aprovo os padrões", with the product owner defaults Q1 to Q8 of the spec). Supersedes the farm scope of AD-008 ("the farm lists only the bosses of the current chapter" and "a player cannot replay the bosses of earlier chapters")

### AD-025
- **Decision**: The Mochila is the only card and fusion screen: one framed card per hero (frame by best star: wood 0 to 3, silver 4 to 6, gold 7 to 9 from `ASCENDED_FROM` and `EXALTED_FROM`), a click opens the hero's fusion ladder, and the `Fusão` HUD button and screen are removed (the rail has six buttons). "Fundir tudo" runs the whole cascade of one hero (each layer 0 to 8 fuses floor(c / 3) times and carries the result up, 9 stars never fuse) on the server in one request, `POST /heroes/{id}/fuse-all` answering `{ hero, fusions }`, in one transaction under the `player_cards` row lock; 409 `NOTHING_TO_FUSE` when no layer below 9 holds 3 copies. The game never loops over the single fusion. No Flyway migration (spec `hero-bag-cards`).
- **Reason**: A loop of single fusions costs up to 9 841 requests for 19 683 cards and can stop halfway, leaving a bag the preview never showed; two menu entries for the same cards confuse the rail.
- **Trade-off**: One more endpoint to keep beside `POST /heroes/{id}/fuse`; the request carries no expected counts, so a card dropped between the preview and the confirmation is fused too. The `ui-redesign` rail tests change from seven to six buttons.
- **Scope**: `backend` hero code (`PlayerCards`, `HeroService`, `HeroController`), `game/src/adapters/phaser/HeroUi.js`, `views/bagView.js`, `views/fusionLadderView.js`, `domain/heroes/bagCards.js`
- **Date**: 2026-11-17
- **Status**: proposed (product owner defaults Q5 and Q8 of spec `hero-bag-cards`, awaiting the owner's approval). Conforms to AD-005 and AD-020 (fusion rule and star colours unchanged) and to the expand/contract rule of AD-016 (no migration)

## Technical Debt

TD-001 to TD-008 are recorded in the spec of the feature that found them (`characters`, `unified-damage`, `supabase-postgres`). New debts are logged here.

### TD-009
- **Debt**: In Rever chefes, a chapter chip load still pending when the panel is closed and reopened leaves the chips disabled until the panel is reopened again, and its late answer overwrites the farm session (`bosses`, `chapter`) under the map of the current chapter. `game/src/adapters/phaser/HeroUi.js` `selectFarmChapter` (its `finally` clears `farmBusy` but skips the render once `this.view` changed); `game/src/application/farm/farmSession.js` `load`.
- **Proposed rule**: Closing Rever chefes cancels a pending chapter load; a late answer is ignored.
- **Fix**: `boss-replay-chapters` Phase 8 (BRC-10, spec P1-Choose AC 14, 15): T20 (`game-dev`) adds `cancel()` to the farm session (a generation counter: an answer of a load started before the last cancel changes nothing) and `HeroUi.dropFarmLoad()`, called by `show()` and `close()`, which resets `farmBusy` and cancels the session load when the screen left is Rever chefes; a dropped chip load's `finally` does nothing (its view is old). T21 (`test-engineer`) adds `holdFarm(chapter, { fail })` to the e2e fake backend and three scenarios in `bossReplayChapters.spec.js`.
- **Found**: Verifier round 1 of `boss-replay-chapters`, finding F1 (`5259af2`); ruled non-blocking by the product owner at acceptance (2026-11-17)
- **Status**: resolved (2026-11-17): T20 and T21 of `.specs/features/boss-replay-chapters/tasks.md` done, Verifier round 3 PASS (`59efb0d`, sensor 10 of 10 killed), BRC-10 Verified and accepted by the product owner (`tasks.md` § Acceptance of Phase 8); ships in v0.3.1

## Handoff

- **Features**: `ui-redesign` (AD-022, `.specs/features/ui-redesign/`) and `boss-replay-chapters` (AD-024, `.specs/features/boss-replay-chapters/`)
- **Phase / Task**: both done and accepted by the product owner on 2026-11-17. `ui-redesign`: T1 to T53, Verifier round 3 PASS (`2110a69`), ui-artist T53 APROVADO (`0101e6c`). `boss-replay-chapters`: T1 to T19, Verifier round 1 PASS (`5259af2`: 35 of 35 ACs, sensor 21 of 21 killed), ui-artist re-review APROVADO (`f31884d`); TD-009 follow-up T20, T21: Verifier round 3 PASS (`59efb0d`), accepted 2026-11-17; acceptance in each `tasks.md` § Acceptance
- **Completed**: both features; `boss-replay-chapters` traceability BRC-01 to BRC-10 Verified; TD-009 (Verifier finding F1) resolved
- **In-progress** (file:line): none
- **Next step**: `gitops` cuts patch release v0.3.1 (TD-009 fix, BRC-10): deploy check, production check, `report.html` of the TD-009 range, `CHANGELOG.md`, tag (v0.3.0 of both features is cut, `4f4f9c7`)
- **Waiting for the owner**: `ui-redesign`: the PO rulings marked `n` in its spec Assumptions table (D2, D3, findings #10 to #13, the `Click to Start!` ruling; list in its `tasks.md` § Acceptance; #10 and #12 are owner art). `boss-replay-chapters`: nothing (the owner answered the F1 ruling on 2026-11-17: "Sim, corrija", fixed by TD-009 Phase 8, accepted)
- **Blockers**: none
- **Next candidate work**: `hero-bag-cards` (AD-025, `.specs/features/hero-bag-cards/`): spec, design and tasks T1 to T16 written by the product owner on 2026-11-17; waiting for the owner's approval and the answers to Q1 to Q8 of its spec before any task runs
- **Notes for the resume**: (1) a failing e2e test is rerun alone twice with `--workers=1` and counts as a load flake only when it passes both (seen so far: `dragEquip.spec.js:550`, `:586`, `:604`, `:670`, `talents.spec.js:148` and `:111`, `auth.spec.js:113`, `clickPower.spec.js:41`, `uiRedesign.spec.js:2089`, `uiRedesign.spec.js:1529`, `dragEquip.spec.js:640`). (2) The hero detail magenta test `shows no magenta in the detail of any of the five heroes` (`game/e2e/uiRedesign.spec.js:2089`) takes about 30 s alone of its 60 s budget and timed out under 3-worker load in round 3: the next task that touches that file splits it into one test per hero or marks it `test.slow()`, without changing an asserted value (Verifier note N1, owner `test-engineer`). (3) Line numbers quoted in `tasks.md` drift: locate edits by test name or exact text
- **Uncommitted files**: owner's, never stage them: `CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`
- **Branch**: main
