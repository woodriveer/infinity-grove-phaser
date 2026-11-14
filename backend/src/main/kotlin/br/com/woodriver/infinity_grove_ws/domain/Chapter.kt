package br.com.woodriver.infinity_grove_ws.domain

enum class Element { FIRE, WATER, NATURE, LIGHT, DARKNESS }

/** What the player's damage meets in one encounter: its element, two defenses and its resistance to critical hits (percent). */
data class EnemyStats(
    val element: Element,
    val physicalDefense: Int,
    val magicalDefense: Int,
    val critResistance: Int,
) {
    init {
        require(physicalDefense in 0..MAX_DEFENSE) { "physical-defense $physicalDefense must be between 0 and $MAX_DEFENSE" }
        require(magicalDefense in 0..MAX_DEFENSE) { "magical-defense $magicalDefense must be between 0 and $MAX_DEFENSE" }
        require(critResistance in 0..MAX_CRIT_RESISTANCE) { "crit-resistance $critResistance must be between 0 and $MAX_CRIT_RESISTANCE" }
    }

    companion object {
        const val MAX_DEFENSE = 90
        const val MAX_CRIT_RESISTANCE = 100

        /** What a row created before enemy attributes existed means. */
        val DEFAULT = EnemyStats(Element.FIRE, 0, 0, 0)
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
) {
    init {
        require(number >= 1) { "Stage number $number must be at least 1" }
        require(phasesPerStage >= 1) { "Stage $number: phases-per-stage $phasesPerStage must be at least 1" }
        require(monsterHealth >= 1) { "Stage $number: monster-health $monsterHealth must be at least 1" }
        require(minibossHealth >= 1) { "Stage $number: miniboss-health $minibossHealth must be at least 1" }
        require(minibossTimeLimitMs >= 1) { "Stage $number: miniboss-time-limit-ms $minibossTimeLimitMs must be at least 1" }
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
        private const val PHASES_PER_STAGE = 5
        private const val BASE_MONSTER_HEALTH = 40
        private const val MONSTER_HEALTH_PER_STAGE = 4
        private const val HEALTH_GROWTH_PER_CHAPTER = 4
        private const val MINIBOSS_HEALTH_FACTOR = 5
        private const val MINIBOSS_TIME_LIMIT_MS = 30_000L
        private const val BOSS_HEALTH = 2000
        private const val BOSS_TIME_LIMIT_MS = 60_000L
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

        /** Chapter 1 as seeded: reachable with 1 damage per click, tunable in the database afterwards. */
        fun first() = of(1)

        /**
         * Chapter [number] as seeded: the same shape as chapter 1 with the health and the defenses growing each chapter, and the
         * stage elements shifted by one per chapter. Which enemies belong to which chapter is still open (AD-006).
         */
        fun of(number: Int): ChapterDefinition {
            require(number >= 1) { "Chapter $number must be at least 1" }
            val defenseBonus = defenseBonus(number)
            val healthFactor = healthFactor(number)
            return ChapterDefinition(
                number = number,
                bossHealth = BOSS_HEALTH * healthFactor,
                bossTimeLimitMs = BOSS_TIME_LIMIT_MS,
                stages =
                    (1..FIRST_CHAPTER_STAGES).map { n ->
                        val monsterHealth = (BASE_MONSTER_HEALTH + MONSTER_HEALTH_PER_STAGE * (n - 1)) * healthFactor
                        // the elements take turns by stage, so every multiplier shows up in the chapter
                        val element = Element.entries[(n - 1 + number - 1) % Element.entries.size]
                        val defense = minOf(MINIBOSS_BASE_DEFENSE + n + defenseBonus, MAX_SEEDED_DEFENSE)
                        val critResistance =
                            minOf(
                                MINIBOSS_BASE_CRIT_RESISTANCE + MINIBOSS_CRIT_RESISTANCE_PER_STAGE * n + defenseBonus,
                                MAX_SEEDED_CRIT_RESISTANCE,
                            )
                        StageDefinition(
                            number = n,
                            phasesPerStage = PHASES_PER_STAGE,
                            monsterHealth = monsterHealth,
                            minibossHealth = monsterHealth * MINIBOSS_HEALTH_FACTOR,
                            minibossTimeLimitMs = MINIBOSS_TIME_LIMIT_MS,
                            monster = EnemyStats(element, 0, 0, 0),
                            miniboss = EnemyStats(element, defense, defense, critResistance),
                            monsterDropRuleId = monsterRuleId(number),
                            minibossDropRuleId = minibossRuleId(number),
                        )
                    },
                boss =
                    EnemyStats(
                        Element.entries[(number + 3) % Element.entries.size],
                        minOf(BOSS_DEFENSE + defenseBonus, MAX_SEEDED_DEFENSE),
                        minOf(BOSS_DEFENSE + defenseBonus, MAX_SEEDED_DEFENSE),
                        minOf(BOSS_CRIT_RESISTANCE + defenseBonus, MAX_SEEDED_CRIT_RESISTANCE),
                    ),
                bossDropRuleId = bossRuleId(number),
            )
        }
    }
}
