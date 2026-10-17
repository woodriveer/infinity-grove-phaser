package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

enum class Encounter { PHASE, MINIBOSS, CHAPTER_BOSS }

enum class Outcome { CLEARED, FAILED }

/** Where a player stands in a chapter. [phase] is 1 outside a `PHASE` encounter so positions compare with plain equality. */
data class ProgressPosition(
    val chapter: Int,
    val stage: Int,
    val encounter: Encounter,
    val phase: Int,
) {
    init {
        require(chapter >= 1) { "Chapter $chapter must be at least 1" }
        require(stage >= 1) { "Stage $stage must be at least 1" }
        require(phase >= 1) { "Phase $phase must be at least 1" }
    }
}

/** A progress together with the chapter definition it is played against. */
data class ProgressView(
    val progress: Progress,
    val chapter: ChapterDefinition,
)

/** One player's campaign progress. The server derives every move; the client only reports an outcome from a position. */
data class Progress(
    val username: String,
    val position: ProgressPosition,
    val completed: Boolean = false,
) {
    fun view(chapter: ChapterDefinition) = ProgressView(this, chapter)

    /** Applies [outcome] reported from [reported]; any report that cannot apply here is a conflict and changes nothing. */
    fun report(
        reported: ProgressPosition,
        outcome: Outcome,
        chapter: ChapterDefinition,
    ): Progress {
        if (completed || reported != position) conflict("position", outcome, chapter)
        val next =
            when (outcome) {
                Outcome.CLEARED -> cleared(chapter)
                Outcome.FAILED -> failed(chapter)
            }
        logger.info("Progress moved username={} outcome={} to={} completed={}", username, outcome, next.position, next.completed)
        return next
    }

    private fun cleared(chapter: ChapterDefinition): Progress =
        when (position.encounter) {
            Encounter.PHASE ->
                if (position.phase < chapter.stage(position.stage).phasesPerStage) {
                    copy(position = position.copy(phase = position.phase + 1))
                } else {
                    copy(position = position.copy(encounter = Encounter.MINIBOSS, phase = 1))
                }
            Encounter.MINIBOSS ->
                if (position.stage < chapter.stageCount) {
                    copy(position = position.copy(stage = position.stage + 1, encounter = Encounter.PHASE, phase = 1))
                } else {
                    copy(position = position.copy(encounter = Encounter.CHAPTER_BOSS, phase = 1))
                }
            Encounter.CHAPTER_BOSS -> copy(completed = true)
        }

    private fun failed(chapter: ChapterDefinition): Progress {
        if (position.encounter == Encounter.PHASE) conflict("fail on a phase", Outcome.FAILED, chapter)
        val lastPhase = chapter.stage(position.stage).phasesPerStage
        return copy(position = position.copy(encounter = Encounter.PHASE, phase = lastPhase))
    }

    private fun conflict(
        reason: String,
        outcome: Outcome,
        chapter: ChapterDefinition,
    ): Nothing {
        logger.warn("Progress report rejected username={} reason={} outcome={} completed={}", username, reason, outcome, completed)
        throw ProgressConflictException(view(chapter))
    }

    companion object {
        private val logger = LoggerFactory.getLogger(Progress::class.java)

        fun start(username: String): Progress {
            logger.info("Starting progress username={}", username)
            return Progress(username, ProgressPosition(1, 1, Encounter.PHASE, 1))
        }
    }
}
