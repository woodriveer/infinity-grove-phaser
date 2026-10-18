package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ProgressTest {
    // 3 stages; stage 2 has 3 phases so the move uses the current stage's phase count
    private val chapter =
        ChapterDefinition(
            1,
            bossHealth = 300,
            bossTimeLimitMs = 60_000,
            stages =
                listOf(
                    StageDefinition(1, 2, 10, 50, 30_000),
                    StageDefinition(2, 3, 11, 55, 30_000),
                    StageDefinition(3, 2, 12, 60, 30_000),
                ),
        )

    private fun at(
        stage: Int,
        encounter: Encounter,
        phase: Int = 1,
        completed: Boolean = false,
    ) = Progress("yan", ProgressPosition(1, stage, encounter, phase), completed)

    private fun Progress.cleared() = report(position, Outcome.CLEARED, chapter)

    private fun Progress.failed() = report(position, Outcome.FAILED, chapter)

    @Test
    fun `a new player starts at chapter 1 stage 1 phase 1 and not completed`() {
        val start = Progress.start("yan")

        assertEquals(ProgressPosition(1, 1, Encounter.PHASE, 1), start.position)
        assertFalse(start.completed)
        assertEquals("yan", start.username)
    }

    @Test
    fun `clearing a phase below the last moves to the next phase of the same stage`() {
        assertEquals(at(2, Encounter.PHASE, 2), at(2, Encounter.PHASE, 1).cleared())
        assertEquals(at(2, Encounter.PHASE, 3), at(2, Encounter.PHASE, 2).cleared())
    }

    @Test
    fun `clearing the last phase moves to the miniboss of the same stage`() {
        assertEquals(at(2, Encounter.MINIBOSS), at(2, Encounter.PHASE, 3).cleared())
        assertEquals(at(1, Encounter.MINIBOSS), at(1, Encounter.PHASE, 2).cleared())
    }

    @Test
    fun `clearing a miniboss below the last stage moves to phase 1 of the next stage`() {
        assertEquals(at(2, Encounter.PHASE, 1), at(1, Encounter.MINIBOSS).cleared())
        assertEquals(at(3, Encounter.PHASE, 1), at(2, Encounter.MINIBOSS).cleared())
    }

    @Test
    fun `clearing the miniboss of the last stage moves to the chapter boss`() {
        assertEquals(at(3, Encounter.CHAPTER_BOSS), at(3, Encounter.MINIBOSS).cleared())
    }

    @Test
    fun `clearing the chapter boss opens stage 1 of the next chapter`() {
        val next = at(3, Encounter.CHAPTER_BOSS).cleared()

        assertFalse(next.completed)
        assertEquals(ProgressPosition(2, 1, Encounter.PHASE, 1), next.position)
    }

    @Test
    fun `clearing the boss of the last chapter completes the progress and keeps the position`() {
        val last = Progress("yan", ProgressPosition(ChapterOrder.MAX_CHAPTER, 3, Encounter.CHAPTER_BOSS, 1))
        val done = last.cleared()

        assertTrue(done.completed)
        assertEquals(last.position, done.position)
    }

    @Test
    fun `a progress completed before the next chapter existed opens it`() {
        val stuck = at(10, Encounter.CHAPTER_BOSS, completed = true)

        assertEquals(Progress("yan", ProgressPosition(2, 1, Encounter.PHASE, 1)), stuck.withNextChapterOpen())

        val last = stuck.copy(position = stuck.position.copy(chapter = ChapterOrder.MAX_CHAPTER))
        assertEquals(last, last.withNextChapterOpen())
    }

    @Test
    fun `failing a miniboss returns to the last phase of the same stage`() {
        assertEquals(at(2, Encounter.PHASE, 3), at(2, Encounter.MINIBOSS).failed())
        assertEquals(at(1, Encounter.PHASE, 2), at(1, Encounter.MINIBOSS).failed())
    }

    @Test
    fun `failing the chapter boss returns to the last phase of the last stage`() {
        assertEquals(at(3, Encounter.PHASE, 2), at(3, Encounter.CHAPTER_BOSS).failed())
    }

    @Test
    fun `a report from a different phase is a conflict carrying the unchanged progress`() {
        val stored = at(2, Encounter.PHASE, 2)

        val e = assertFailsWith<ProgressConflictException> { stored.report(stored.position.copy(phase = 1), Outcome.CLEARED, chapter) }

        assertEquals(stored.view(chapter), e.current)
        assertEquals("PROGRESS_CONFLICT", e.code)
    }

    @Test
    fun `a report from a different stage encounter or chapter is a conflict`() {
        val stored = at(2, Encounter.MINIBOSS)

        listOf(
            stored.position.copy(stage = 1),
            stored.position.copy(encounter = Encounter.PHASE),
            stored.position.copy(chapter = 2),
        ).forEach { reported ->
            assertFailsWith<ProgressConflictException> { stored.report(reported, Outcome.CLEARED, chapter) }
        }
    }

    @Test
    fun `failing while on a phase is a conflict and changes nothing`() {
        val stored = at(1, Encounter.PHASE, 2)

        val e = assertFailsWith<ProgressConflictException> { stored.failed() }

        assertEquals(stored, e.current.progress)
    }

    @Test
    fun `every report on a completed progress is a conflict`() {
        val done = at(3, Encounter.CHAPTER_BOSS, completed = true)

        Outcome.entries.forEach { outcome ->
            val e = assertFailsWith<ProgressConflictException> { done.report(done.position, outcome, chapter) }
            assertEquals(done, e.current.progress)
        }
    }

    @Test
    fun `each seeded chapter takes 61 clears and the fifth one completes the progress`() {
        var progress = Progress.start("yan")
        var clears = 0

        while (!progress.completed) {
            progress = progress.report(progress.position, Outcome.CLEARED, ChapterDefinition.of(progress.position.chapter))
            clears++
        }

        assertEquals(61 * ChapterOrder.MAX_CHAPTER, clears)
        assertEquals(ProgressPosition(ChapterOrder.MAX_CHAPTER, 10, Encounter.CHAPTER_BOSS, 1), progress.position)
    }

    @Test
    fun `position rejects a phase below 1`() {
        assertFailsWith<IllegalArgumentException> { ProgressPosition(1, 1, Encounter.PHASE, 0) }
    }
}
