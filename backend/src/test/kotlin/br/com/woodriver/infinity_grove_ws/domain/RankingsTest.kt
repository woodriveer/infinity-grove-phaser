package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RankingsTest {
    private fun pos(
        chapter: Int,
        stage: Int,
        encounter: Encounter,
        phase: Int = 1,
    ) = ProgressPosition(chapter, stage, encounter, phase)

    private fun at(
        position: ProgressPosition,
        completed: Boolean = false,
    ) = Progress("ana", position, completed)

    @Test
    fun `the last miniboss win starts the boss clock`() {
        val clock =
            RunClock(
                "ana",
            ).afterOutcome(pos(3, 10, Encounter.MINIBOSS), Outcome.CLEARED, at(pos(3, 10, Encounter.CHAPTER_BOSS)), 10_000)

        assertEquals(10_000L, clock.bossReachedAt)
    }

    @Test
    fun `a phase win and a miniboss win before the last change nothing`() {
        val clock = RunClock("ana", 5, null)

        assertEquals(clock, clock.afterOutcome(pos(3, 2, Encounter.PHASE, 4), Outcome.CLEARED, at(pos(3, 2, Encounter.PHASE, 5)), 9))
        assertEquals(clock, clock.afterOutcome(pos(3, 2, Encounter.MINIBOSS), Outcome.CLEARED, at(pos(3, 3, Encounter.PHASE)), 9))
    }

    @Test
    fun `a chapter boss win stops the clock and bossTime measures it`() {
        val clock = RunClock("ana", null, 10_000)

        assertEquals(12_345L, clock.bossTime(22_345))
        assertNull(
            clock.afterOutcome(pos(3, 10, Encounter.CHAPTER_BOSS), Outcome.CLEARED, at(pos(4, 1, Encounter.PHASE)), 22_345).bossReachedAt,
        )
    }

    @Test
    fun `a failed chapter boss stops the clock`() {
        val clock =
            RunClock(
                "ana",
                null,
                0,
            ).afterOutcome(pos(3, 10, Encounter.CHAPTER_BOSS), Outcome.FAILED, at(pos(3, 10, Encounter.PHASE, 8)), 90_000)

        assertNull(clock.bossReachedAt)
    }

    @Test
    fun `a stopped clock has no boss time`() {
        assertNull(RunClock("ana").bossTime(5))
    }

    @Test
    fun `a load at the chapter boss restarts the clock and elsewhere changes nothing`() {
        val clock = RunClock("ana", null, 0)

        assertEquals(50_000L, clock.afterLoad(at(pos(3, 10, Encounter.CHAPTER_BOSS)), 50_000).bossReachedAt)
        assertEquals(0L, clock.afterLoad(at(pos(3, 4, Encounter.PHASE)), 50_000).bossReachedAt)
    }

    @Test
    fun `a completed campaign is not at the boss`() {
        val clock = RunClock("ana").afterLoad(at(pos(15, 10, Encounter.CHAPTER_BOSS), completed = true), 7)

        assertNull(clock.bossReachedAt)
    }

    @Test
    fun `a farm win at the chapter boss restarts the clock and elsewhere changes nothing`() {
        val clock = RunClock("ana", null, 0)

        assertEquals(30_000L, clock.afterFarmWin(at(pos(3, 10, Encounter.CHAPTER_BOSS)), 30_000).bossReachedAt)
        assertEquals(0L, clock.afterFarmWin(at(pos(3, 2, Encounter.PHASE)), 30_000).bossReachedAt)
    }

    @Test
    fun `a reset starts the run and stops the boss clock`() {
        assertEquals(RunClock("ana", 1_000_000, null), RunClock("ana", 1, 2).afterReset(1_000_000))
    }

    @Test
    fun `the boss floor is 1000 ms`() {
        assertFalse(RecordRules.bossTimePlausible(999))
        assertTrue(RecordRules.bossTimePlausible(1_000))
    }

    @Test
    fun `the story floor of the seeded chapters is 1365000 ms`() {
        val floor = RecordRules.storyFloorMs((1..15).map(ChapterDefinition::of))

        assertEquals(1_365_000L, floor)
        assertFalse(RecordRules.storyTimePlausible(1_364_999, 1_365_000))
        assertTrue(RecordRules.storyTimePlausible(1_365_000, 1_365_000))
    }

    @Test
    fun `the run start is the stored one, else the registration of a player who never reset`() {
        assertEquals(1_000_000L, RecordRules.runStart(RunClock("ana", 1_000_000), 2, 0))
        assertEquals(7L, RecordRules.runStart(RunClock("ana"), 0, 7))
        assertNull(RecordRules.runStart(RunClock("ana"), 1, 7))
    }

    @Test
    fun `a board id reads its board and an unknown one is RANKING_NOT_FOUND`() {
        assertEquals(RankingBoard.BOSS_TIME, RankingBoard.fromId("boss-time"))
        assertEquals(RankingBoard.STORY_TIME, RankingBoard.fromId("story-time"))
        assertEquals(RankingBoard.CLICK_POWER, RankingBoard.fromId("click-power"))
        assertEquals(RankingBoard.FORTUNE, RankingBoard.fromId("fortune"))

        val error = assertFailsWith<RankingNotFoundException> { RankingBoard.fromId("gold") }
        assertEquals("RANKING_NOT_FOUND", error.code)
    }

    @Test
    fun `the boss board needs a chapter from 1 to 15 and the others ignore it`() {
        assertEquals(3, RecordRules.chapterOf(RankingBoard.BOSS_TIME, 3))
        assertEquals(1, RecordRules.chapterOf(RankingBoard.BOSS_TIME, 1))
        assertEquals(15, RecordRules.chapterOf(RankingBoard.BOSS_TIME, 15))
        listOf<Int?>(null, 0, 16).forEach { chapter ->
            val error =
                assertFailsWith<InvalidRankingRequestException>(
                    "chapter $chapter",
                ) { RecordRules.chapterOf(RankingBoard.BOSS_TIME, chapter) }
            assertEquals("INVALID_RANKING_REQUEST", error.code)
        }
        assertNull(RecordRules.chapterOf(RankingBoard.STORY_TIME, 3))
    }
}
