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

/** The numbers of one stage: its phase monsters, its miniboss and the miniboss time limit. */
data class StageDefinition(
    val number: Int,
    val phasesPerStage: Int,
    val monsterHealth: Int,
    val minibossHealth: Int,
    val minibossTimeLimitMs: Long,
    val monster: EnemyStats = EnemyStats.DEFAULT,
    val miniboss: EnemyStats = EnemyStats.DEFAULT,
) {
    init {
        require(number >= 1) { "Stage number $number must be at least 1" }
        require(phasesPerStage >= 1) { "Stage $number: phases-per-stage $phasesPerStage must be at least 1" }
        require(monsterHealth >= 1) { "Stage $number: monster-health $monsterHealth must be at least 1" }
        require(minibossHealth >= 1) { "Stage $number: miniboss-health $minibossHealth must be at least 1" }
        require(minibossTimeLimitMs >= 1) { "Stage $number: miniboss-time-limit-ms $minibossTimeLimitMs must be at least 1" }
    }
}

/** A chapter: its stages in order and the chapter boss that closes it. */
data class ChapterDefinition(
    val number: Int,
    val bossHealth: Int,
    val bossTimeLimitMs: Long,
    val stages: List<StageDefinition>,
    val boss: EnemyStats = EnemyStats.DEFAULT,
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
        private const val BASE_MONSTER_HEALTH = 10
        private const val MINIBOSS_HEALTH_FACTOR = 5
        private const val MINIBOSS_TIME_LIMIT_MS = 30_000L
        private const val BOSS_HEALTH = 300
        private const val BOSS_TIME_LIMIT_MS = 60_000L
        private const val MINIBOSS_BASE_DEFENSE = 10
        private const val MINIBOSS_BASE_CRIT_RESISTANCE = 10
        private const val MINIBOSS_CRIT_RESISTANCE_PER_STAGE = 2
        private const val BOSS_DEFENSE = 30
        private const val BOSS_CRIT_RESISTANCE = 30

        /** Chapter 1 as seeded: reachable with 1 damage per click, tunable in the database afterwards. */
        fun first() =
            ChapterDefinition(
                number = 1,
                bossHealth = BOSS_HEALTH,
                bossTimeLimitMs = BOSS_TIME_LIMIT_MS,
                stages =
                    (1..FIRST_CHAPTER_STAGES).map { n ->
                        val monsterHealth = BASE_MONSTER_HEALTH + n - 1
                        // the elements take turns by stage, so every multiplier shows up in the chapter
                        val element = Element.entries[(n - 1) % Element.entries.size]
                        val defense = MINIBOSS_BASE_DEFENSE + n
                        val critResistance = MINIBOSS_BASE_CRIT_RESISTANCE + MINIBOSS_CRIT_RESISTANCE_PER_STAGE * n
                        StageDefinition(
                            number = n,
                            phasesPerStage = PHASES_PER_STAGE,
                            monsterHealth = monsterHealth,
                            minibossHealth = monsterHealth * MINIBOSS_HEALTH_FACTOR,
                            minibossTimeLimitMs = MINIBOSS_TIME_LIMIT_MS,
                            monster = EnemyStats(element, 0, 0, 0),
                            miniboss = EnemyStats(element, defense, defense, critResistance),
                        )
                    },
                boss = EnemyStats(Element.DARKNESS, BOSS_DEFENSE, BOSS_DEFENSE, BOSS_CRIT_RESISTANCE),
            )
    }
}
