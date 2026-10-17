package br.com.woodriver.infinity_grove_ws.domain

/** The numbers of one stage: its phase monsters, its miniboss and the miniboss time limit. */
data class StageDefinition(
    val number: Int,
    val phasesPerStage: Int,
    val monsterHealth: Int,
    val minibossHealth: Int,
    val minibossTimeLimitMs: Long,
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

        /** Chapter 1 as seeded: reachable with 1 damage per click, tunable in the database afterwards. */
        fun first() =
            ChapterDefinition(
                number = 1,
                bossHealth = BOSS_HEALTH,
                bossTimeLimitMs = BOSS_TIME_LIMIT_MS,
                stages =
                    (1..FIRST_CHAPTER_STAGES).map { n ->
                        val monsterHealth = BASE_MONSTER_HEALTH + n - 1
                        StageDefinition(n, PHASES_PER_STAGE, monsterHealth, monsterHealth * MINIBOSS_HEALTH_FACTOR, MINIBOSS_TIME_LIMIT_MS)
                    },
            )
    }
}
