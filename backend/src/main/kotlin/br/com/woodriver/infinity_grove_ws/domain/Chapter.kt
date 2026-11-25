package br.com.woodriver.infinity_grove_ws.domain

enum class Element { FIRE, WATER, NATURE, LIGHT, DARKNESS }

/** What the player's damage meets in one encounter: its element, its one defense and its resistance to critical hits (percent). */
data class EnemyStats(
    val element: Element,
    val defense: Int,
    val critResistance: Int,
) {
    init {
        require(defense in 0..MAX_DEFENSE) { "defense $defense must be between 0 and $MAX_DEFENSE" }
        require(critResistance in 0..MAX_CRIT_RESISTANCE) { "crit-resistance $critResistance must be between 0 and $MAX_CRIT_RESISTANCE" }
    }

    companion object {
        const val MAX_DEFENSE = 90
        const val MAX_CRIT_RESISTANCE = 100

        /** What a row created before enemy attributes existed means. */
        val DEFAULT = EnemyStats(Element.FIRE, 0, 0)
    }
}

/** One add of a miniboss (spec miniboss-adds): its health and the points it adds to the miniboss's defense while it lives. */
data class StageAdd(
    val health: Long,
    val defenseBuff: Int,
) {
    init {
        require(health >= 1) { "add health $health must be at least 1" }
        require(defenseBuff in 0..EnemyStats.MAX_DEFENSE) {
            "add defense-buff $defenseBuff must be between 0 and ${EnemyStats.MAX_DEFENSE}"
        }
    }
}

/** What an affix does (spec early-game-rebalance, Affix Rules). Named Monster... because Affix and AffixType are equipment affixes. */
enum class MonsterAffixType { SHELL, HIT_SHIELD, REGENERATION, ARMORED }

/**
 * The affix of one miniboss or chapter boss. [amount] is the points a strike loses (SHELL), the charges (HIT_SHIELD), the basis points of the
 * maximum health healed a second (REGENERATION) or the defense added (ARMORED); [periodMs] is how long a broken shield stays down (HIT_SHIELD only).
 */
data class MonsterAffix(
    val type: MonsterAffixType,
    val amount: Long,
    val periodMs: Long? = null,
) {
    init {
        require(amount >= 1) { "affix amount $amount must be at least 1" }
        when (type) {
            MonsterAffixType.HIT_SHIELD -> {
                require(amount <= MAX_SHIELD_CHARGES) { "shield charges $amount must be at most $MAX_SHIELD_CHARGES" }
                require(periodMs != null && periodMs in 1..MAX_SHIELD_PERIOD_MS) {
                    "shield period-ms $periodMs must be between 1 and $MAX_SHIELD_PERIOD_MS"
                }
            }
            MonsterAffixType.REGENERATION ->
                require(amount <= MAX_REGENERATION_BP) { "regeneration $amount must be at most $MAX_REGENERATION_BP basis points" }
            MonsterAffixType.ARMORED ->
                require(amount <= EnemyStats.MAX_DEFENSE) { "armored defense $amount must be at most ${EnemyStats.MAX_DEFENSE}" }
            MonsterAffixType.SHELL -> Unit
        }
        require(type == MonsterAffixType.HIT_SHIELD || periodMs == null) { "only a shield has a period-ms, got $periodMs on $type" }
    }

    companion object {
        private const val MAX_SHIELD_CHARGES = 1000L
        private const val MAX_SHIELD_PERIOD_MS = 600_000L
        private const val MAX_REGENERATION_BP = 10_000L
    }
}

/** The numbers of one stage: its phase monsters, its miniboss, the miniboss time limit and the drop rule each one pays. */
data class StageDefinition(
    val number: Int,
    val phasesPerStage: Int,
    val monsterHealth: Long,
    val minibossHealth: Long,
    val minibossTimeLimitMs: Long,
    val monster: EnemyStats = EnemyStats.DEFAULT,
    val miniboss: EnemyStats = EnemyStats.DEFAULT,
    val monsterDropRuleId: Int = 1,
    val minibossDropRuleId: Int = 1,
    val adds: List<StageAdd> = emptyList(),
    val minibossAffix: MonsterAffix? = null,
) {
    init {
        require(number >= 1) { "Stage number $number must be at least 1" }
        require(phasesPerStage >= 1) { "Stage $number: phases-per-stage $phasesPerStage must be at least 1" }
        require(monsterHealth >= 1) { "Stage $number: monster-health $monsterHealth must be at least 1" }
        require(minibossHealth >= 1) { "Stage $number: miniboss-health $minibossHealth must be at least 1" }
        require(minibossTimeLimitMs >= 1) { "Stage $number: miniboss-time-limit-ms $minibossTimeLimitMs must be at least 1" }
        require(adds.size <= MAX_ADDS) { "Stage $number: at most $MAX_ADDS adds, got ${adds.size}" }
    }

    companion object {
        const val MAX_ADDS = 2
    }
}

/** A chapter: its stages in order, the chapter boss that closes it and the drop rule the boss pays. */
data class ChapterDefinition(
    val number: Int,
    val bossHealth: Long,
    val bossTimeLimitMs: Long,
    val stages: List<StageDefinition>,
    val boss: EnemyStats = EnemyStats.DEFAULT,
    val bossDropRuleId: Int = 1,
    val bossAffix: MonsterAffix? = null,
) {
    init {
        require(number >= 1) { "Chapter number $number must be at least 1" }
        require(bossHealth >= 1) { "Chapter $number: boss-health $bossHealth must be at least 1" }
        require(bossTimeLimitMs >= 1) { "Chapter $number: boss-time-limit-ms $bossTimeLimitMs must be at least 1" }
        require(stages.isNotEmpty()) { "Chapter $number must have at least one stage" }
        require(stages.map { it.number } == (1..stages.size).toList()) { "Chapter $number stages must be numbered 1..${stages.size}" }
    }

    val stageCount: Int = stages.size

    fun stage(number: Int): StageDefinition =
        stages.firstOrNull { it.number == number } ?: throw IllegalArgumentException("Chapter ${this.number} has no stage $number")

    companion object {
        private const val FIRST_CHAPTER_STAGES = 10
        private const val PHASES_PER_STAGE = 8
        private const val HEALTH_GROWTH_PER_CHAPTER = 4
        private const val MINIBOSS_HEALTH_FACTOR = 3
        private const val MINIBOSS_TIME_LIMIT_MS = 45_000L
        private const val BOSS_TIME_LIMIT_MS = 90_000L

        /** The last chapter with the early critical resistances (spec early-game-rebalance, Chapter Table); later chapters keep the release formula. */
        const val LAST_EARLY_CHAPTER = 5
        private const val EARLY_CRIT_RESISTANCE_PER_CHAPTER = 8
        private const val EARLY_BOSS_CRIT_RESISTANCE_PER_CHAPTER = 10
        private const val EARLY_BOSS_CRIT_RESISTANCE_OFFSET = 5

        /** Phase monster health of chapters 1 to 15, stage 1 first: round(B x g^(n-1)) of the spec Chapter Table, written out. */
        private val PHASE_HEALTH: List<List<Long>> =
            listOf(
                listOf(69L, 92L, 122L, 162L, 216L, 287L, 382L, 508L, 676L, 898L),
                listOf(265L, 342L, 441L, 569L, 734L, 947L, 1221L, 1575L, 2032L, 2622L),
                listOf(1000L, 1160L, 1346L, 1561L, 1811L, 2100L, 2436L, 2826L, 3278L, 3803L),
                listOf(4750L, 4940L, 5138L, 5343L, 5557L, 5779L, 6010L, 6251L, 6501L, 6761L),
                listOf(7250L, 7540L, 7842L, 8155L, 8481L, 8821L, 9174L, 9541L, 9922L, 10319L),
                listOf(10000L, 10400L, 10816L, 11249L, 11699L, 12167L, 12653L, 13159L, 13686L, 14233L),
                listOf(28000L, 29120L, 30285L, 31496L, 32756L, 34066L, 35429L, 36846L, 38320L, 39853L),
                listOf(36000L, 37440L, 38938L, 40495L, 42115L, 43800L, 45551L, 47374L, 49268L, 51239L),
                listOf(58000L, 60320L, 62733L, 65242L, 67852L, 70566L, 73389L, 76324L, 79377L, 82552L),
                listOf(71000L, 73840L, 76794L, 79865L, 83060L, 86382L, 89838L, 93431L, 97168L, 101055L),
                listOf(38000L, 39520L, 41101L, 42745L, 44455L, 46233L, 48082L, 50005L, 52006L, 54086L),
                listOf(64000L, 66560L, 69222L, 71991L, 74871L, 77866L, 80980L, 84220L, 87588L, 91092L),
                listOf(90000L, 93600L, 97344L, 101238L, 105287L, 109499L, 113879L, 118434L, 123171L, 128098L),
                listOf(133000L, 138320L, 143853L, 149607L, 155591L, 161815L, 168287L, 175019L, 182020L, 189300L),
                listOf(161000L, 167440L, 174138L, 181103L, 188347L, 195881L, 203716L, 211865L, 220340L, 229153L),
            )

        /** Chapter boss health of chapters 1 to 15 (spec Chapter Table). */
        private val BOSS_HEALTH_TABLE: List<Long> =
            listOf(
                6000L,
                12_500L,
                13_000L,
                34_000L,
                80_000L,
                130_000L,
                139_000L,
                313_000L,
                475_000L,
                900_000L,
                956_000L,
                1_850_000L,
                1_940_000L,
                2_837_000L,
                4_265_000L,
            )

        private const val MINIBOSS_BASE_DEFENSE = 10
        private const val MINIBOSS_BASE_CRIT_RESISTANCE = 10
        private const val MINIBOSS_CRIT_RESISTANCE_PER_STAGE = 2
        private const val BOSS_DEFENSE = 30
        private const val BOSS_CRIT_RESISTANCE = 30
        private const val DEFENSE_PER_CHAPTER = 5
        private const val DEFENSE_PER_CHAPTER_FROM_6 = 3
        private const val LAST_QUADRUPLED_CHAPTER = 5
        private const val MAX_SEEDED_DEFENSE = 80
        private const val MAX_SEEDED_CRIT_RESISTANCE = 70
        private const val RULES_PER_CHAPTER = 3
        private val MONSTER_COPPER = 2..6
        private val MINIBOSS_COPPER = 8..20
        private val BOSS_COPPER = 30..70
        private const val LAST_DOUBLED_COIN_CHAPTER = 8
        private const val COIN_FACTOR_STEP = 32
        private const val KILL_INTERVAL_MS = 1500L
        private const val ADDS_PER_MINIBOSS = 2
        private const val ADD_HEALTH_FACTOR = 3

        private const val SHIELD_CHARGES_BASE = 10
        private const val SHIELD_CHARGES_PER_CHAPTER = 5
        private const val SHIELD_CHARGES_STEPS = 4
        private const val SHIELD_PERIOD_MS = 6000L
        private const val SHELL_PER_MILLE = 4
        private const val PER_MILLE = 1000
        private const val MINIBOSS_REGENERATION_BP = 50L
        private const val BOSS_REGENERATION_BP = 25L
        private const val ARMORED_DEFENSE = 20L

        /** The affix types of minibosses 3, 6, 9 and of the chapter boss, chapters 2 to 15 (spec Affix Table). Chapter 1 has none. */
        private val AFFIX_TYPES: Map<Int, List<MonsterAffixType?>> =
            run {
                val shield = MonsterAffixType.HIT_SHIELD
                val shell = MonsterAffixType.SHELL
                val regeneration = MonsterAffixType.REGENERATION
                val armored = MonsterAffixType.ARMORED
                val rotation = listOf(shield, shell, regeneration, armored)
                mapOf(
                    2 to listOf(shield, shield, shield, shield),
                    3 to listOf(shell, shield, shell, shell),
                    4 to listOf(regeneration, shell, regeneration, regeneration),
                    5 to listOf(armored, regeneration, armored, armored),
                ) +
                    (6..10).associateWith { c ->
                        listOf(rotation[(c - 6) % 4], rotation[(c - 5) % 4], rotation[(c - 4) % 4], rotation[(c - 3) % 4])
                    } +
                    (11..15).associateWith { c -> listOf(null, null, null, rotation[(c - 3) % 4]) }
            }
        private val AFFIX_STAGES = listOf(3, 6, 9)

        /**
         * The affix of [type] for chapter [number] (spec Affix Table): the shield charges grow by 5 a chapter from 10 to 30, Carapaça loses
         * 4 per mille of [phaseHealth] rounded up, Regeneração heals 50 basis points of a miniboss and 25 of a boss, Blindado adds 20 defense.
         */
        fun affixOf(
            type: MonsterAffixType,
            chapter: Int,
            phaseHealth: Long,
            boss: Boolean,
        ): MonsterAffix =
            when (type) {
                MonsterAffixType.HIT_SHIELD ->
                    MonsterAffix(
                        type,
                        (SHIELD_CHARGES_BASE + SHIELD_CHARGES_PER_CHAPTER * minOf(chapter - 2, SHIELD_CHARGES_STEPS)).toLong(),
                        SHIELD_PERIOD_MS,
                    )
                MonsterAffixType.SHELL -> MonsterAffix(type, (phaseHealth * SHELL_PER_MILLE + PER_MILLE - 1) / PER_MILLE)
                MonsterAffixType.REGENERATION -> MonsterAffix(type, if (boss) BOSS_REGENERATION_BP else MINIBOSS_REGENERATION_BP)
                MonsterAffixType.ARMORED -> MonsterAffix(type, ARMORED_DEFENSE)
            }

        /** The affix of miniboss [stage] of chapter [number] (minibosses 3, 6 and 9 only), null when it has none. */
        fun minibossAffixOf(
            number: Int,
            stage: Int,
            phaseHealth: Long,
        ): MonsterAffix? {
            val index = AFFIX_STAGES.indexOf(stage)
            val type = if (index < 0) null else AFFIX_TYPES[number]?.get(index)
            return type?.let { affixOf(it, number, phaseHealth, boss = false) }
        }

        /** The affix of the chapter boss of chapter [number], with the health of its last stage's phase monster, null when it has none. */
        fun bossAffixOf(
            number: Int,
            lastPhaseHealth: Long,
        ): MonsterAffix? = AFFIX_TYPES[number]?.get(AFFIX_STAGES.size)?.let { affixOf(it, number, lastPhaseHealth, boss = true) }

        /** The buff of each add by chapter (spec miniboss-adds, Add Table); chapters not listed have no adds. */
        private val ADD_BUFFS = mapOf(11 to 30, 12 to 35, 13 to 40, 14 to 45, 15 to 50)

        /** The adds of a stage of chapter [number] whose phase monster has [monsterHealth]: two of 3 times that health from chapter 11 to 15. */
        fun addsOf(
            number: Int,
            monsterHealth: Long,
        ): List<StageAdd> =
            ADD_BUFFS[number]?.let { buff -> List(ADDS_PER_MINIBOSS) { StageAdd(monsterHealth * ADD_HEALTH_FACTOR, buff) } } ?: emptyList()

        /**
         * The three drop rules seeded for chapter [number]: the phase monster (id 3c-2), the miniboss (3c-1) and the chapter boss
         * (3c). Each range is the chapter's copper range times [coinFactor] (AD-019). Tunable in the database afterwards.
         */
        fun dropRules(number: Int): List<DropRule> {
            val factor = coinFactor(number)
            return listOf(
                DropRule(monsterRuleId(number), MONSTER_COPPER.first * factor, MONSTER_COPPER.last * factor, KILL_INTERVAL_MS),
                DropRule(minibossRuleId(number), MINIBOSS_COPPER.first * factor, MINIBOSS_COPPER.last * factor, KILL_INTERVAL_MS),
                DropRule(bossRuleId(number), BOSS_COPPER.first * factor, BOSS_COPPER.last * factor, KILL_INTERVAL_MS),
            )
        }

        /** The copper factor of chapter [number]: it doubles up to chapter 8, then grows by 32 each chapter (AD-019). */
        fun coinFactor(number: Int): Int =
            if (number <= LAST_DOUBLED_COIN_CHAPTER) {
                1 shl (number - 1)
            } else {
                coinFactor(LAST_DOUBLED_COIN_CHAPTER) + COIN_FACTOR_STEP * (number - LAST_DOUBLED_COIN_CHAPTER)
            }

        private fun bossRuleId(number: Int) = RULES_PER_CHAPTER * number

        private fun minibossRuleId(number: Int) = bossRuleId(number) - 1

        private fun monsterRuleId(number: Int) = bossRuleId(number) - 2

        /**
         * How many times the health of chapter 1 the monsters of chapter [number] have: it multiplies by 4 each chapter up to
         * chapter 5 (1, 4, 16, 64, 256), then by 2 each chapter (AD-019).
         */
        fun healthFactor(number: Int): Long =
            if (number <= LAST_QUADRUPLED_CHAPTER) {
                (1 until number).fold(1L) { factor, _ -> factor * HEALTH_GROWTH_PER_CHAPTER }
            } else {
                healthFactor(LAST_QUADRUPLED_CHAPTER) shl (number - LAST_QUADRUPLED_CHAPTER)
            }

        /** The defense added to chapter 1 by chapter [number]: +5 per chapter up to chapter 5, then +3 per chapter (AD-019). */
        fun defenseBonus(number: Int): Int =
            if (number <= LAST_QUADRUPLED_CHAPTER) {
                DEFENSE_PER_CHAPTER * (number - 1)
            } else {
                defenseBonus(LAST_QUADRUPLED_CHAPTER) + DEFENSE_PER_CHAPTER_FROM_6 * (number - LAST_QUADRUPLED_CHAPTER)
            }

        /** Chapter 1 as seeded (the spec Chapter Table: 69 health a phase monster, 6000 for the boss), tunable in the database afterwards. */
        fun first() = of(1)

        /**
         * Chapter [number] as seeded: the health of the spec Chapter Table ([PHASE_HEALTH] for the phase monsters, 3 times that for the
         * minibosses, [BOSS_HEALTH_TABLE] for the boss), 8 phases a stage, the defenses growing each chapter, the critical resistances of
         * the spec for chapters 1 to 5 and the release formula after them, and the stage elements shifted by one per chapter. Which
         * enemies belong to which chapter is still open (AD-006).
         */
        fun of(number: Int): ChapterDefinition {
            require(number in 1..ChapterOrder.MAX_CHAPTER) { "Chapter $number must be between 1 and ${ChapterOrder.MAX_CHAPTER}" }
            val defenseBonus = defenseBonus(number)
            val early = number <= LAST_EARLY_CHAPTER
            return ChapterDefinition(
                number = number,
                bossHealth = BOSS_HEALTH_TABLE[number - 1],
                bossTimeLimitMs = BOSS_TIME_LIMIT_MS,
                stages =
                    (1..FIRST_CHAPTER_STAGES).map { n ->
                        val monsterHealth = PHASE_HEALTH[number - 1][n - 1]
                        // the elements take turns by stage, so every multiplier shows up in the chapter
                        val element = Element.entries[(n - 1 + number - 1) % Element.entries.size]
                        val defense = minOf(MINIBOSS_BASE_DEFENSE + n + defenseBonus, MAX_SEEDED_DEFENSE)
                        val critResistance =
                            if (early) {
                                (n - 1) + EARLY_CRIT_RESISTANCE_PER_CHAPTER * (number - 1)
                            } else {
                                minOf(
                                    MINIBOSS_BASE_CRIT_RESISTANCE + MINIBOSS_CRIT_RESISTANCE_PER_STAGE * n + defenseBonus,
                                    MAX_SEEDED_CRIT_RESISTANCE,
                                )
                            }
                        StageDefinition(
                            number = n,
                            phasesPerStage = PHASES_PER_STAGE,
                            monsterHealth = monsterHealth,
                            minibossHealth = monsterHealth * MINIBOSS_HEALTH_FACTOR,
                            minibossTimeLimitMs = MINIBOSS_TIME_LIMIT_MS,
                            monster = EnemyStats(element, 0, 0),
                            miniboss = EnemyStats(element, defense, critResistance),
                            monsterDropRuleId = monsterRuleId(number),
                            minibossDropRuleId = minibossRuleId(number),
                            adds = addsOf(number, monsterHealth),
                            minibossAffix = minibossAffixOf(number, n, monsterHealth),
                        )
                    },
                boss =
                    EnemyStats(
                        Element.entries[(number + 3) % Element.entries.size],
                        minOf(BOSS_DEFENSE + defenseBonus, MAX_SEEDED_DEFENSE),
                        if (early) {
                            EARLY_BOSS_CRIT_RESISTANCE_PER_CHAPTER * number - EARLY_BOSS_CRIT_RESISTANCE_OFFSET
                        } else {
                            minOf(BOSS_CRIT_RESISTANCE + defenseBonus, MAX_SEEDED_CRIT_RESISTANCE)
                        },
                    ),
                bossDropRuleId = bossRuleId(number),
                bossAffix = bossAffixOf(number, PHASE_HEALTH[number - 1].last()),
            )
        }
    }
}
