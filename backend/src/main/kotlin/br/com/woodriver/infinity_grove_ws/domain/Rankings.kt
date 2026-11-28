package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/** The four boards of spec rankings. [id] is the path segment of `GET /rankings/{board}`; [chaptered] boards need a chapter 1 to 15. */
enum class RankingBoard(
    val id: String,
    val lowerIsBetter: Boolean,
    val chaptered: Boolean,
) {
    BOSS_TIME("boss-time", lowerIsBetter = true, chaptered = true),
    STORY_TIME("story-time", lowerIsBetter = true, chaptered = false),
    CLICK_POWER("click-power", lowerIsBetter = false, chaptered = false),
    FORTUNE("fortune", lowerIsBetter = false, chaptered = false),
    ;

    companion object {
        /** The board of [id]; any other id is [RankingNotFoundException]. */
        fun fromId(id: String): RankingBoard = entries.firstOrNull { it.id == id } ?: throw RankingNotFoundException(id)
    }
}

class RankingNotFoundException(
    board: String,
) : BusinessException("RANKING_NOT_FOUND", "Ranking '$board' not found")

class InvalidRankingRequestException(
    reason: String,
) : BusinessException("INVALID_RANKING_REQUEST", reason)

/** One row of a board: position 1..n, the username and the value (ms, power or copper). */
data class RankingEntry(
    val position: Int,
    val username: String,
    val value: Double,
)

/** The caller's own row. */
data class RankingMe(
    val position: Int,
    val username: String,
    val value: Double,
)

/** One board as `GET /rankings/{board}` answers it; [chapter] is null outside BOSS_TIME. */
data class RankingPage(
    val board: RankingBoard,
    val chapter: Int?,
    val entries: List<RankingEntry>,
    val me: RankingMe?,
)

/** The power `POST /rankings/click-power` computed now ([value], null without cards) and the stored best after the call. */
data class ClickPowerResult(
    val value: Double?,
    val best: Double?,
)

/** One player's clocks (spec rankings, Record Rules): the start of the run and the moment the chapter boss was reached; null = unknown/stopped. */
data class RunClock(
    val username: String,
    val runStartedAt: Long? = null,
    val bossReachedAt: Long? = null,
) {
    /** `GET /progress`: a load while standing at the chapter boss restarts the boss clock. */
    fun afterLoad(
        progress: Progress,
        now: Long,
    ): RunClock = if (atBoss(progress)) copy(bossReachedAt = now) else this

    /**
     * An accepted outcome reported from [reported] that moved the campaign to [next]: a FAILED or CLEARED chapter boss stops the boss
     * clock; a CLEARED that reaches the chapter boss starts it; anything else changes nothing.
     */
    fun afterOutcome(
        reported: ProgressPosition,
        outcome: Outcome,
        next: Progress,
        now: Long,
    ): RunClock {
        val moved =
            when {
                reported.encounter == Encounter.CHAPTER_BOSS -> copy(bossReachedAt = null)
                outcome == Outcome.CLEARED && atBoss(next) -> copy(bossReachedAt = now)
                else -> this
            }
        if (moved != this) logger.info("Boss clock moved username={} outcome={} bossReachedAt={}", username, outcome, moved.bossReachedAt)
        return moved
    }

    /** An accepted farm win while the campaign stands at the chapter boss restarts the boss clock. */
    fun afterFarmWin(
        campaign: Progress,
        now: Long,
    ): RunClock = if (atBoss(campaign)) copy(bossReachedAt = now) else this

    /** An account reset starts a new run and stops the boss clock. */
    fun afterReset(now: Long): RunClock {
        logger.info("Run clock restarted by a reset username={} runStartedAt={}", username, now)
        return copy(runStartedAt = now, bossReachedAt = null)
    }

    /** The boss time of a chapter boss win at [now]; null while the boss clock is stopped. */
    fun bossTime(now: Long): Long? = bossReachedAt?.let { now - it }

    private companion object {
        private val logger = LoggerFactory.getLogger(RunClock::class.java)

        fun atBoss(progress: Progress) = !progress.completed && progress.position.encounter == Encounter.CHAPTER_BOSS
    }
}

/** The floors and limits of spec rankings. */
object RecordRules {
    const val BOSS_FLOOR_MS = 1_000L
    const val ENCOUNTER_FLOOR_MS = 1_000L
    const val TOP = 10
    const val CHAPTER_MESSAGE = "chapter must be an integer between 1 and ${ChapterOrder.MAX_CHAPTER}"

    fun bossTimePlausible(ms: Long): Boolean = ms >= BOSS_FLOOR_MS

    /** 1 000 ms per encounter of [chapters]: each stage's phases and miniboss, plus the chapter boss (1 365 000 for the seed). */
    fun storyFloorMs(chapters: List<ChapterDefinition>): Long =
        chapters.sumOf { chapter -> chapter.stages.sumOf { it.phasesPerStage + 1 }.toLong() + 1 } * ENCOUNTER_FLOOR_MS

    fun storyTimePlausible(
        ms: Long,
        floorMs: Long,
    ): Boolean = ms >= floorMs

    /** The start of the run: the stored one, else the registration of a player who never reset, else unknown (null). */
    fun runStart(
        clock: RunClock,
        resets: Int,
        createdAt: Long,
    ): Long? = clock.runStartedAt ?: if (resets == 0) createdAt else null

    /** The chapter a request for [board] is about: null for a board without chapters, else [chapter] 1 to 15 or [InvalidRankingRequestException]. */
    fun chapterOf(
        board: RankingBoard,
        chapter: Int?,
    ): Int? =
        if (!board.chaptered) {
            null
        } else {
            chapter?.takeIf { it in 1..ChapterOrder.MAX_CHAPTER } ?: throw InvalidRankingRequestException(CHAPTER_MESSAGE)
        }
}
