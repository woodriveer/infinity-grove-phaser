# Graph Report - game  (2026-11-28)

## Corpus Check
- 295 files · ~273,601 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .jsonc 1)

## Summary
- 2200 nodes · 5221 edges · 132 communities (121 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f70e19fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- teamClickDamage.spec.js
- HeroUi
- teamView.js
- mockBackend
- Campaign
- vitest
- composition.js
- el
- uiRedesign.shots.js
- ClickerGame.test.js
- ClickerGame.js
- talentsView.js
- equipment.js
- bagCards.js
- talents.js
- splashPlan.js
- uiRedesign.spec.js
- HeroUi.test.js
- ClickerGame
- Fight
- skillCombat.test.js
- HeroUi.js
- bulkSell.test.js
- equipmentView.js
- .create
- heroes.js
- SkillCombat
- elementWheel.js
- minibossAddsSkills.spec.js
- farmView.js
- heroTeamPassives.spec.js
- package.json
- dragEquip.test.js
- monsterAffix.js
- heroTeamCombat.spec.js
- minibossAddsTarget.spec.js
- .showEncounter
- minibossAdds.spec.js
- updateTalents
- heroTeamField.spec.js
- talentTreeBranches.spec.js
- talentsView.test.js
- skillCombat.js
- openMainMenu
- coverage.js
- skillsAll.spec.js
- bossReplayChapters.spec.js
- blackAwarenessStaffDamage.spec.js
- earlyGameRebalanceTalents.spec.js
- activeSceneKeys
- autoClick.js
- campaign/resetLegacy.js
- talentTreeRework.spec.js
- unifiedDamage.spec.js
- teamClickDamage.shots.js
- talentTreeBranchesCard.spec.js
- uiPolishTalents.spec.js
- scripts
- defenseContract.test.js
- backgroundFight.test.js
- campaignSession.test.js
- talentTreeBranches.shots.js
- ADR 0003: Authentication UI in the MainMenu scene
- dragEquip.spec.js
- heroBagCards.spec.js
- main.js
- minibossAdds.shots.js
- talentTreeRework.shots.js
- architecture.test.js
- game.js
- fillCredentials
- bossMap.js
- Combo
- leaderStats.js
- uiPolish.shots.js
- gameVersion.spec.js
- heroTeam.spec.js
- MainMenu.test.js
- Preloader
- resetView.js
- shots.js
- heroTeam.shots.js
- techDebtPolish.shots.js
- farm.spec.js
- uiPolishPage.spec.js
- e2eCoverage.mjs
- MainMenu
- pageGuards.test.js
- adds.js
- allyAttacker.js
- damage.js
- heroBagCards.shots.js
- bulkSell.spec.js
- campaignChapters.spec.js
- heroTeamEditing.spec.js
- heroTeamStyle.spec.js
- renderAutoClick
- sessionStore.js
- accountReset/accountReset.test.js
- heroAscension.shots.js
- bossMap.spec.js
- earlyGameRebalance.spec.js
- equipment.spec.js
- userApi.test.js
- .leaderAttacker
- skillLevel.js
- bulkSell.shots.js
- resetLegacy.shots.js
- ADR 0001: HTTP client and API layer
- ADR 0002: Environment configuration
- ADR 0004: Testing strategy
- ADR 0006: Wallet and drops in the game
- autoClick.spec.js
- heroAscension.spec.js
- resetLegacy.spec.js
- talents.spec.js
- uiPolishShift.spec.js
- healthApi.test.js
- walletApi.test.js
- versionLabel.js
- giftClaim.test.js
- allyCombat.test.js
- starBonus.js
- campaignChapters.shots.js
- ADR 0010: Equipment in the game (collection service, attacker from worn pieces, DOM screen)
- skills.spec.js
- Coin Clicker
- ref_node_fs
- equipmentApi.test.js
- maxPurchase
- fetch

## God Nodes (most connected - your core abstractions)
1. `mockBackend()` - 153 edges
2. `openMainMenu()` - 140 edges
3. `fillCredentials()` - 136 edges
4. `activeSceneKeys()` - 129 edges
5. `ClickerGame` - 117 edges
6. `vitest` - 101 edges
7. `el()` - 85 edges
8. `HeroUi` - 67 edges
9. `test` - 54 edges
10. `ApiError` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `ClickerGame`  [INFERRED]
  docs/adr/0006-wallet-and-drops.md → src/adapters/phaser/ClickerGame.js
- `Alternatives considered` --references--> `ClickerGame`  [INFERRED]
  docs/adr/0007-modular-hexagonal-game.md → src/adapters/phaser/ClickerGame.js
- `Alternatives considered` --references--> `ClickerGame`  [INFERRED]
  docs/adr/0008-stages.md → src/adapters/phaser/ClickerGame.js
- `Decision` --references--> `fail()`  [INFERRED]
  docs/adr/0008-stages.md → src/adapters/phaser/views/talentsView.test.js
- `Decision` --references--> `ApiError`  [INFERRED]
  docs/adr/0001-http-client-and-api-layer.md → src/application/ApiError.js

## Import Cycles
- None detected.

## Communities (132 total, 11 thin omitted)

### Community 0 - "teamClickDamage.spec.js"
Cohesion: 0.06
Nodes (40): COMPLETED, LYRA_IN_SLOT_1, pause(), setHealth(), setHealth(), TYPE_COLOUR, TYPE_ICON, advance() (+32 more)

### Community 1 - "HeroUi"
Cohesion: 0.08
Nodes (5): ADR 0009: Hero cards in the game (heroes and farm services, DOM screens, farm mode), Alternatives considered, Consequences, Context, HeroUi

### Community 2 - "teamView.js"
Cohesion: 0.07
Nodes (48): team(), sprite(), renderAvailable(), renderBuyDialog(), renderLeaderCard(), renderSlotCard(), renderTeam(), TEAM_INACTIVE_TEXT (+40 more)

### Community 3 - "mockBackend"
Cohesion: 0.06
Nodes (47): LINES, startGame(), AFFIX_TYPES, afterOutcome(), AUTO_CLICK_INTERVALS, AUTO_CLICK_PRICES, beatenBosses(), chapterElements() (+39 more)

### Community 4 - "Campaign"
Cohesion: 0.06
Nodes (13): ADR 0008: Stages, minibosses and the chapter boss in the game, Alternatives considered, Consequences, Context, Decision, createWalletSync(), ADR-0007, createWalletSync() (+5 more)

### Community 5 - "vitest"
Cohesion: 0.08
Nodes (25): vitest, authApi, authClient, authResponse, config, loadConfig(), createHttpClient(), httpClient (+17 more)

### Community 6 - "composition.js"
Cohesion: 0.06
Nodes (32): createAccountResetApi(), createAutoClickApi(), state, createFarmApi(), state, createGiftApi(), createHeroesApi(), hero (+24 more)

### Community 7 - "el"
Cohesion: 0.10
Nodes (27): renderCatalog(), renderHeroDetail(), renderSkillList(), renderSkillRow(), starsClassName(), hero(), skill(), art() (+19 more)

### Community 8 - "uiRedesign.shots.js"
Cohesion: 0.06
Nodes (19): SMALL_CHAPTER, startGame(), openLeaderList(), chapter(), dealt(), health(), startGame(), BLANK_HEROES (+11 more)

### Community 9 - "ClickerGame.test.js"
Cohesion: 0.07
Nodes (32): ADD, addsDefinition(), addsScene(), addsStart(), atChapter(), AUTO_CLICK_LEVEL_0, autoClickGateway, autoClickPreference (+24 more)

### Community 10 - "ClickerGame.js"
Cohesion: 0.05
Nodes (37): ADR-0004, ADD_BAR, ADD_BOXES, ADD_BUFF_FONT, ADD_SIZE, AFFIX, ALLY_MOVE, ALLY_TEXT (+29 more)

### Community 11 - "talentsView.js"
Cohesion: 0.11
Nodes (33): EMPTY_DETAIL_TEXT, GLYPHS, UNAVAILABLE_TEXT, BANNER_POSITIONS, BRANCH_GLOWS, CAPTION_HALF, CAPTION_ROOM, CHAINS (+25 more)

### Community 12 - "equipment.js"
Cohesion: 0.12
Nodes (28): Decision, renderPieceDetail(), attachPieceTooltip(), renderPieceTooltip(), host, tooltip, tooltipPlace(), ADR-0007 (+20 more)

### Community 13 - "bagCards.js"
Cohesion: 0.14
Nodes (25): renderBagCards(), renderHeroCard(), starsText(), renderBagHero(), renderConfirm(), renderFuseAllResult(), renderRow(), draw() (+17 more)

### Community 14 - "talents.js"
Cohesion: 0.13
Nodes (21): CHAPTER_BOSS, FARM, farmEncounterOf(), farmLabel(), ADR-0006, MINIBOSS, PHASE, definition (+13 more)

### Community 15 - "splashPlan.js"
Cohesion: 0.14
Nodes (19): Splash, createSplash(), gameObject(), branchTip(), clamp01(), CRYSTAL_COLORS, crystalLayout(), crystalPoints() (+11 more)

### Community 16 - "uiRedesign.spec.js"
Cohesion: 0.08
Nodes (19): autoClickOpen(), channels(), chapter(), css(), EMBER_PILL, enterGame(), expectHoverShade(), expectNoMagenta() (+11 more)

### Community 17 - "HeroUi.test.js"
Cohesion: 0.09
Nodes (21): catalog(), CHAPTER_5, createUi(), flush(), hero(), open(), ownedCatalog(), pointsOf() (+13 more)

### Community 18 - "ClickerGame"
Cohesion: 0.15
Nodes (3): ClickerGame, hasModifier(), resetNoticeText()

### Community 20 - "skillCombat.test.js"
Cohesion: 0.12
Nodes (16): addName(), guardedDefense(), MAIN_NAME, MAX_GUARDED_DEFENSE, add(), MAIN_STATS, mainMonster(), twoAdds() (+8 more)

### Community 21 - "HeroUi.js"
Cohesion: 0.10
Nodes (20): BADGED, badgeHtml(), buttonHtml(), DEFAULT_POSITION, HUD, ICONS, keyHtml(), LEADER (+12 more)

### Community 22 - "bulkSell.test.js"
Cohesion: 0.13
Nodes (20): button(), rarityButton(), renderBulkSellBar(), bar(), rarities(), bagPieces(), RARITY_ORDER, rarityState() (+12 more)

### Community 23 - "equipmentView.js"
Cohesion: 0.14
Nodes (19): iconWithFallback(), button(), EMPTY_TEXT, renderEquipment(), renderEquipmentUnavailable(), renderLeaderStats(), renderTransfer(), renderTransferSpace() (+11 more)

### Community 24 - ".create"
Cohesion: 0.11
Nodes (7): ADR 0007: Modular game with hexagonal architecture, Alternatives considered, Consequences, Context, Decision, Refactor inventory, coinMetal()

### Community 25 - "heroes.js"
Cohesion: 0.17
Nodes (18): Decision, renderFusionResult(), ALL_STARS, applyDrop(), ASCENDED_FROM, availableFusions(), bagEntries(), bossLabel() (+10 more)

### Community 27 - "elementWheel.js"
Cohesion: 0.16
Nodes (18): arrow(), badge(), PAIR, renderElementWheel(), times(), TRIAD, BEATS, DARKNESS (+10 more)

### Community 28 - "minibossAddsSkills.spec.js"
Cohesion: 0.12
Nodes (15): ADD, addsChapter(), BIG, BIG_30, freeze(), HERO_IDS, LACAIO_1, lastNumbers() (+7 more)

### Community 29 - "farmView.js"
Cohesion: 0.14
Nodes (14): renderChapters(), renderFarm(), renderStop(), renderTrail(), AT_BOSS, AT_STAGE_4, show(), BEND_LEFT (+6 more)

### Community 30 - "heroTeamPassives.spec.js"
Cohesion: 0.13
Nodes (14): allyTexts(), chapter(), criticalTexts(), dealt(), ELEMENT_OF, freeze(), health(), HERO_IDS (+6 more)

### Community 31 - "package.json"
Cohesion: 0.12
Nodes (20): dependencies, axios@^1.20.0, phaser@^3.80.1, devDependencies, jsdom@^29.1.1, nyc@^18.0.0, @playwright/test@^1.64.1, vite@^8.3.4 (+12 more)

### Community 32 - "dragEquip.test.js"
Cohesion: 0.16
Nodes (17): attachDragToEquip(), move(), up(), DRAG_THRESHOLD_PX, EDGE_PX, ghostOf(), heroUnder(), SCROLL_STEP_PX (+9 more)

### Community 33 - "monsterAffix.js"
Cohesion: 0.14
Nodes (14): AFFIX_TYPES, affixOf(), AffixState, ARMORED, HIT_SHIELD, REGENERATION, SHELL, armored() (+6 more)

### Community 34 - "heroTeamCombat.spec.js"
Cohesion: 0.14
Nodes (10): allyTexts(), chapter(), dealt(), freeze(), health(), HERO_IDS, lastAllyText(), LYRA_IN_SLOT_1 (+2 more)

### Community 35 - "minibossAddsTarget.spec.js"
Cohesion: 0.13
Nodes (15): ADD, addsChapter(), freeze(), GUARD_90, HERO_IDS, LACAIO_1, LACAIO_2, lastNumber() (+7 more)

### Community 37 - "minibossAdds.spec.js"
Cohesion: 0.13
Nodes (14): ADD, addsChapter(), freeze(), GUARD_90, HERO_IDS, LACAIO_1, LACAIO_2, leftovers() (+6 more)

### Community 38 - "updateTalents"
Cohesion: 0.18
Nodes (19): actionKind(), art(), kindOf(), percent(), renderAction(), renderBanner(), renderDetail(), renderLit() (+11 more)

### Community 39 - "heroTeamField.spec.js"
Cohesion: 0.16
Nodes (12): chapter(), FOUR_ALLIES, freeze(), health(), HERO_IDS, leaderSprite(), LYRA_IN_SLOT_1, monsterOf() (+4 more)

### Community 40 - "talentTreeBranches.spec.js"
Cohesion: 0.12
Nodes (9): artMissing(), artPresent(), BRANCH_OF, CHAINS, CHAPTER, CHAPTER_ARMOR, FORK, PIXEL (+1 more)

### Community 41 - "talentsView.test.js"
Cohesion: 0.15
Nodes (16): columnScroll(), keepBetween(), placeTalentScroll(), renderTalentsUnavailable(), revealTalent(), scrollOf(), SHIFT_HINT, talentScrollOf() (+8 more)

### Community 42 - "skillCombat.js"
Cohesion: 0.20
Nodes (10): skillOf(), SKILLS, COOLDOWNS, NO_USE, clickDamage(), factorOf(), hitDamage(), strike() (+2 more)

### Community 43 - "openMainMenu"
Cohesion: 0.14
Nodes (7): CHAPTER, startGame(), startGame(), PIECES, startGame(), openMainMenu(), logIn()

### Community 44 - "coverage.js"
Cohesion: 0.20
Nodes (6): logIn(), test, serverDown(), registryValue(), SESSION_KEY, storedSession()

### Community 45 - "skillsAll.spec.js"
Cohesion: 0.15
Nodes (9): ARMORED, bare(), chapter(), DARKNESS, dealt(), ELEMENT_OF, health(), scene() (+1 more)

### Community 46 - "bossReplayChapters.spec.js"
Cohesion: 0.12
Nodes (5): AT_CHAPTER_3, CHAPTER_2, CURRENT_STOPS, nature, startGame()

### Community 48 - "blackAwarenessStaffDamage.spec.js"
Cohesion: 0.19
Nodes (8): BAG_STAFF, chapter(), dealt(), health_(), monsterOf(), scene(), STAFF_ON, startAs()

### Community 49 - "earlyGameRebalanceTalents.spec.js"
Cohesion: 0.20
Nodes (11): bare(), chapter(), dealt(), ELEMENT_OF, health(), startAs(), chapter(), dealt() (+3 more)

### Community 50 - "activeSceneKeys"
Cohesion: 0.16
Nodes (8): HUD_CHAPTER, KAEL_ONE_STAR, startGame(), ELEMENTS_CHAPTER, startGame(), QUICK_CHAPTER, startGame(), activeSceneKeys()

### Community 51 - "autoClick.js"
Cohesion: 0.18
Nodes (7): ADR-0007, RESET_MAX_REWARD, resetReward(), AUTO_CLICK_BASE_MS, AUTO_CLICK_MAX_PER_FRAME, AutoClicker, autoClickUnlocked()

### Community 52 - "campaign/resetLegacy.js"
Cohesion: 0.27
Nodes (10): createResetLegacy(), FIVE, NONE, isAfterReset(), isChapter(), isChapterOrNull(), legacyLineText(), legacyOf() (+2 more)

### Community 53 - "talentTreeRework.spec.js"
Cohesion: 0.16
Nodes (8): ARMORED, artMissing(), artPresent(), CHAPTER, OLD_CATALOG, PIXEL, POWER_AT_10, startGame()

### Community 54 - "unifiedDamage.spec.js"
Cohesion: 0.21
Nodes (8): bare(), chapter(), dealt(), ELEMENT_OF, enemy(), health(), scene(), startAs()

### Community 55 - "teamClickDamage.shots.js"
Cohesion: 0.15
Nodes (8): ADD, FOUR_ALLIES, HERO_IDS, loaded(), LYRA_IN_SLOT_1, LYRA_WEAPON, openTeam(), start()

### Community 56 - "talentTreeBranchesCard.spec.js"
Cohesion: 0.18
Nodes (8): ARMORED, artMissing(), artPresent(), CHAPTER, DESCRIPTIONS, PIXEL, RING, startGame()

### Community 57 - "uiPolishTalents.spec.js"
Cohesion: 0.15
Nodes (4): ALL_SAME, ARMORED, CHAPTER, startGame()

### Community 58 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build:staging, deploy, dev, dev:staging, preview, test (+5 more)

### Community 59 - "defenseContract.test.js"
Cohesion: 0.17
Nodes (6): filesUnder(), GAME, LEGACY_PAYLOAD_FILES, OLD_ASSET, OLD_FIELDS, SKIPPED_DIRECTORIES

### Community 60 - "backgroundFight.test.js"
Cohesion: 0.23
Nodes (8): BACKGROUND_MAX_MS, BACKGROUND_STEP_MS, BACKGROUND_TICK_MS, runInBackground(), startTicker(), createPage(), createWorld(), FakeWorker

### Community 61 - "campaignSession.test.js"
Cohesion: 0.17
Nodes (6): createCampaignSession(), ADR-0006, ADR-0007, definition, createCampaignSession(), at()

### Community 62 - "talentTreeBranches.shots.js"
Cohesion: 0.17
Nodes (8): ADD, ARMORED, LEVELS, PIXEL, POWER_AT_10, problems, start(), watch()

### Community 63 - "ADR 0003: Authentication UI in the MainMenu scene"
Cohesion: 0.17
Nodes (10): ADR 0003: Authentication UI in the MainMenu scene, Alternatives considered, Consequences, Context, Decision, ADR 0005: Persistent session in localStorage, Alternatives considered, Consequences (+2 more)

### Community 64 - "dragEquip.spec.js"
Cohesion: 0.20
Nodes (7): ALL_FIVE, centre(), drag(), PIECES, startGame(), touchDrag(), TWO

### Community 65 - "heroBagCards.spec.js"
Cohesion: 0.18
Nodes (6): FULL_BAG, KAEL_LADDER, LAYERS, openBag(), openHero(), startWith()

### Community 66 - "main.js"
Cohesion: 0.21
Nodes (7): phaser, Boot, LINEUP, OVAL, config, game, ADR-0007

### Community 67 - "minibossAdds.shots.js"
Cohesion: 0.23
Nodes (8): ADD, addsChapter(), freeze(), HERO_IDS, monsterOf(), scene(), snap(), start()

### Community 68 - "talentTreeRework.shots.js"
Cohesion: 0.18
Nodes (7): ADD, ARMORED, PIXEL, POWER_AT_10, problems, start(), watch()

### Community 69 - "architecture.test.js"
Cohesion: 0.22
Nodes (9): ALLOWED_LAYERS, ALLOWED_PACKAGES, importsOf(), ADR-0007, layerOf(), sourceFiles(), SRC, TEST_PACKAGES (+1 more)

### Community 70 - "game.js"
Cohesion: 0.24
Nodes (4): skipSplash(), @playwright/test, BAG, WORN

### Community 71 - "fillCredentials"
Cohesion: 0.22
Nodes (8): fillCredentials(), AT_CHAPTER_3, CHAPTER_2, nature, start(), chapter, monster, start()

### Community 72 - "bossMap.js"
Cohesion: 0.25
Nodes (6): bossMapStops(), CURRENT, DEFEATED, farmMapPosition(), LOCKED, stopId()

### Community 73 - "Combo"
Cohesion: 0.24
Nodes (5): Combo, COMBO_IDLE_MS, COMBO_STEP_PERCENT, comboText(), clicks()

### Community 74 - "leaderStats.js"
Cohesion: 0.25
Nodes (4): leaderStats(), one(), lines(), two()

### Community 75 - "uiPolish.shots.js"
Cohesion: 0.20
Nodes (7): ARMORED, BLANK_HEROES, CHAPTER, HERO_IDS, iconsLoaded(), openTalent(), start()

### Community 76 - "gameVersion.spec.js"
Cohesion: 0.27
Nodes (6): expectGroveStyle(), expectInCorner(), expectOneLabel(), label(), startGame(), { version }

### Community 77 - "heroTeam.spec.js"
Cohesion: 0.20
Nodes (3): bossOfOneHealth, HERO_IDS, startTeam()

### Community 78 - "MainMenu.test.js"
Cohesion: 0.22
Nodes (6): backend, createScene(), flush(), open(), sessionManager, userApi

### Community 79 - "Preloader"
Cohesion: 0.24
Nodes (4): COIN_METALS, Preloader, createScene(), HERO_IDS

### Community 80 - "resetView.js"
Cohesion: 0.31
Nodes (7): renderLegacyLine(), renderResetButton(), renderResetDialog(), RESET_ERROR_TEXT, resetButtonText(), resetDialogText(), legacyDetailText()

### Community 81 - "shots.js"
Cohesion: 0.27
Nodes (5): PIECES, snap(), kebab(), repoRoot, shot()

### Community 82 - "heroTeam.shots.js"
Cohesion: 0.22
Nodes (6): definition, FOUR, HERO_IDS, loaded(), openTeam(), start()

### Community 83 - "techDebtPolish.shots.js"
Cohesion: 0.20
Nodes (5): ADD, HERO_IDS, LYRA_IN_SLOT_1, PASSIVES, start()

### Community 84 - "farm.spec.js"
Cohesion: 0.22
Nodes (3): COMPLETED, FAST_BOSSES, startGame()

### Community 85 - "uiPolishPage.spec.js"
Cohesion: 0.25
Nodes (6): ARMORED, CHAPTER, openTalents(), pickCombo(), startGame(), startScreen()

### Community 86 - "e2eCoverage.mjs"
Cohesion: 0.22
Nodes (4): env, keep, playwrightArgs, status

### Community 88 - "pageGuards.test.js"
Cohesion: 0.31
Nodes (4): installPageGuards(), isTextField(), added, TEXT_FIELD_SELECTOR

### Community 89 - "adds.js"
Cohesion: 0.31
Nodes (7): addsOf(), MAX_ADD_BUFF, MAX_ADDS, valid(), WATER, validBuff(), validHealth()

### Community 90 - "allyAttacker.js"
Cohesion: 0.36
Nodes (4): ALLY_STAR_MULTIPLIER, allyAttacker(), allyDamagePerClick(), allyStarMultiplier()

### Community 91 - "damage.js"
Cohesion: 0.39
Nodes (4): calculateDamage(), critOverflow(), effectiveCritChance(), PLAYER

### Community 92 - "heroBagCards.shots.js"
Cohesion: 0.25
Nodes (7): FULL_BAG, KAEL_LADDER, LAYERS, MIXED, openBag(), openHero(), startWith()

### Community 94 - "campaignChapters.spec.js"
Cohesion: 0.25
Nodes (3): bare, startGame(), WEAPON

### Community 95 - "heroTeamEditing.spec.js"
Cohesion: 0.25
Nodes (3): HERO_IDS, LYRA_IN_SLOT_1, startTeam()

### Community 97 - "renderAutoClick"
Cohesion: 0.43
Nodes (6): autoClickCrystalsText(), autoClickIntervalText(), autoClickUpgradeText(), renderAutoClick(), box(), LEVEL_0

### Community 98 - "sessionStore.js"
Cohesion: 0.29
Nodes (4): NUMERIC_FIELDS, sessionStore, STRING_FIELDS, session

### Community 99 - "accountReset/accountReset.test.js"
Cohesion: 0.29
Nodes (6): createAccountReset(), ADR-0007, ANSWER, START, STORED, createAccountReset()

### Community 100 - "heroAscension.shots.js"
Cohesion: 0.32
Nodes (4): bare(), chapter(), OTHERS, startAs()

### Community 101 - "bossMap.spec.js"
Cohesion: 0.29
Nodes (3): AT_STAGE_4, PIXEL, startGame()

### Community 102 - "earlyGameRebalance.spec.js"
Cohesion: 0.38
Nodes (5): chapterOne(), ELEMENTS, monsterOf(), PHASE_HEALTH, startGame()

### Community 103 - "equipment.spec.js"
Cohesion: 0.29
Nodes (4): RING, SMALL_CHAPTER, startGame(), WEAPON

### Community 104 - "userApi.test.js"
Cohesion: 0.33
Nodes (5): createUserApi(), authResponse, httpClient, user, userApi

### Community 106 - "skillLevel.js"
Cohesion: 0.48
Nodes (5): levelFactor(), MAX_SKILL_LEVEL, raisedSkillSlot(), SKILL_LEVEL_STEP_PERCENT, skillLevelText()

### Community 107 - "bulkSell.shots.js"
Cohesion: 0.33
Nodes (5): BAG, BAG_RARITIES, piece(), SLOTS, WORN

### Community 108 - "resetLegacy.shots.js"
Cohesion: 0.29
Nodes (6): AFTER, CASE_B, CHAPTER, FULL_5, NONE, start()

### Community 109 - "ADR 0001: HTTP client and API layer"
Cohesion: 0.33
Nodes (5): ADR 0001: HTTP client and API layer, Alternatives considered, Consequences, Context, Decision

### Community 110 - "ADR 0002: Environment configuration"
Cohesion: 0.33
Nodes (5): ADR 0002: Environment configuration, Alternatives considered, Consequences, Context, Decision

### Community 111 - "ADR 0004: Testing strategy"
Cohesion: 0.33
Nodes (5): ADR 0004: Testing strategy, Alternatives considered, Consequences, Context, Decision

### Community 112 - "ADR 0006: Wallet and drops in the game"
Cohesion: 0.33
Nodes (5): ADR 0006: Wallet and drops in the game, Alternatives considered, Consequences, Context, Decision

### Community 114 - "heroAscension.spec.js"
Cohesion: 0.53
Nodes (4): bare(), chapter(), health(), startAs()

### Community 115 - "resetLegacy.spec.js"
Cohesion: 0.40
Nodes (4): CHAPTER, openAutoClick(), openDialog(), startGame()

### Community 116 - "talents.spec.js"
Cohesion: 0.40
Nodes (5): ARMORED, CHAPTER, dealt(), health(), startGame()

### Community 117 - "uiPolishShift.spec.js"
Cohesion: 0.40
Nodes (4): ARMORED, CHAPTER, pick(), startGame()

### Community 118 - "healthApi.test.js"
Cohesion: 0.47
Nodes (4): createHealthApi(), healthApi, httpClient, WAKE_TIMEOUT_MS

### Community 119 - "walletApi.test.js"
Cohesion: 0.40
Nodes (4): createWalletApi(), httpClient, walletApi, walletResponse

### Community 120 - "versionLabel.js"
Cohesion: 0.60
Nodes (3): mountVersionLabel(), VERSION_TESTID, versionText()

### Community 121 - "giftClaim.test.js"
Cohesion: 0.47
Nodes (4): claimGift(), ADR-0007, setup(), STAFF

### Community 122 - "allyCombat.test.js"
Cohesion: 0.47
Nodes (3): landTeam(), hitter(), one()

### Community 123 - "starBonus.js"
Cohesion: 0.53
Nodes (4): NO_BONUS, STAR_BONUS, starBonus(), starPowerText()

### Community 124 - "campaignChapters.shots.js"
Cohesion: 0.33
Nodes (3): bare, boss(), start()

### Community 125 - "ADR 0010: Equipment in the game (collection service, attacker from worn pieces, DOM screen)"
Cohesion: 0.40
Nodes (4): ADR 0010: Equipment in the game (collection service, attacker from worn pieces, DOM screen), Alternatives considered, Consequences, Context

### Community 126 - "skills.spec.js"
Cohesion: 0.40
Nodes (3): KAEL_ONE_STAR, SKILLS_CHAPTER, startGame()

### Community 127 - "Coin Clicker"
Cohesion: 0.40
Nodes (4): Coin Clicker, Deploy, Instructions, Tests

### Community 129 - "equipmentApi.test.js"
Cohesion: 0.50
Nodes (3): createEquipmentApi(), change, equipment

### Community 130 - "maxPurchase"
Cohesion: 0.50
Nodes (5): patchUpgradeButton(), renderUpgradeButton(), maxPurchase(), pointsText(), upgradeButtonText()

## Knowledge Gaps
- **16 isolated node(s):** `ADR-0004`, `ADR-0007`, `ADR-0007`, `ADR-0006`, `ADR-0007` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 895 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ref_node_fs`, `equipmentApi.test.js`, `teamView.js`, `Campaign`, `composition.js`, `el`, `ClickerGame.test.js`, `talentsView.js`, `equipment.js`, `bagCards.js`, `talents.js`, `splashPlan.js`, `HeroUi.test.js`, `skillCombat.test.js`, `HeroUi.js`, `bulkSell.test.js`, `equipmentView.js`, `heroes.js`, `elementWheel.js`, `farmView.js`, `package.json`, `dragEquip.test.js`, `monsterAffix.js`, `talentsView.test.js`, `skillCombat.js`, `autoClick.js`, `campaign/resetLegacy.js`, `defenseContract.test.js`, `backgroundFight.test.js`, `campaignSession.test.js`, `architecture.test.js`, `bossMap.js`, `Combo`, `leaderStats.js`, `MainMenu.test.js`, `Preloader`, `resetView.js`, `pageGuards.test.js`, `adds.js`, `allyAttacker.js`, `damage.js`, `renderAutoClick`, `sessionStore.js`, `accountReset/accountReset.test.js`, `userApi.test.js`, `skillLevel.js`, `healthApi.test.js`, `walletApi.test.js`, `versionLabel.js`, `giftClaim.test.js`, `allyCombat.test.js`, `starBonus.js`?**
  _High betweenness centrality (0.384) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `ClickerGame` (e.g. with `Decision` and `Decision`) actually correct?**
  _`ClickerGame` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADR-0004`, `ADR-0007`, `ADR-0007` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `teamClickDamage.spec.js` be split into smaller, more focused modules?**
  _Cohesion score 0.059395801331285206 - nodes in this community are weakly interconnected._
- **Why does `openMainMenu()` connect `openMainMenu` to `teamClickDamage.spec.js`, `mockBackend`, `uiRedesign.shots.js`, `uiRedesign.spec.js`, `minibossAddsSkills.spec.js`, `heroTeamPassives.spec.js`, `heroTeamCombat.spec.js`, `minibossAddsTarget.spec.js`, `minibossAdds.spec.js`, `heroTeamField.spec.js`, `talentTreeBranches.spec.js`, `coverage.js`, `skillsAll.spec.js`, `bossReplayChapters.spec.js`, `blackAwarenessStaffDamage.spec.js`, `earlyGameRebalanceTalents.spec.js`, `activeSceneKeys`, `talentTreeRework.spec.js`, `unifiedDamage.spec.js`, `teamClickDamage.shots.js`, `talentTreeBranchesCard.spec.js`, `uiPolishTalents.spec.js`, `talentTreeBranches.shots.js`, `dragEquip.spec.js`, `heroBagCards.spec.js`, `minibossAdds.shots.js`, `talentTreeRework.shots.js`, `game.js`, `fillCredentials`, `uiPolish.shots.js`, `gameVersion.spec.js`, `heroTeam.spec.js`, `shots.js`, `heroTeam.shots.js`, `techDebtPolish.shots.js`, `farm.spec.js`, `uiPolishPage.spec.js`, `heroBagCards.shots.js`, `bulkSell.spec.js`, `campaignChapters.spec.js`, `heroTeamEditing.spec.js`, `heroTeamStyle.spec.js`, `heroAscension.shots.js`, `bossMap.spec.js`, `earlyGameRebalance.spec.js`, `equipment.spec.js`, `bulkSell.shots.js`, `resetLegacy.shots.js`, `ADR 0004: Testing strategy`, `autoClick.spec.js`, `heroAscension.spec.js`, `resetLegacy.spec.js`, `talents.spec.js`, `uiPolishShift.spec.js`, `campaignChapters.shots.js`, `skills.spec.js`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Should `HeroUi` be split into smaller, more focused modules?**
  _Cohesion score 0.0807909604519774 - nodes in this community are weakly interconnected._
- **Why does `ApiError` connect `vitest` to `teamView.js`, `accountReset/accountReset.test.js`, `composition.js`, `ClickerGame.test.js`, `ADR 0001: HTTP client and API layer`, `MainMenu.test.js`, `ADR 0004: Testing strategy`, `HeroUi.test.js`, `campaign/resetLegacy.js`, `.create`, `campaignSession.test.js`, `ADR 0003: Authentication UI in the MainMenu scene`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._