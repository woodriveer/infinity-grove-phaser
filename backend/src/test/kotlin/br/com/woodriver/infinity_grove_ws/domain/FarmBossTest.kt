package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class FarmBossTest {
    private val at3 = Progress("yan", ProgressPosition(3, 4, Encounter.PHASE, 1))

    @Test
    fun `a chapter below the current one has every miniboss and the chapter boss beaten`() {
        val bosses = FarmBoss.beaten(at3, ChapterDefinition.of(2))

        assertEquals(11, bosses.size)
        assertEquals((1..10).toList(), bosses.take(10).map { it.stage })
        assertEquals(List(10) { Encounter.MINIBOSS }, bosses.take(10).map { it.kind })
        assertEquals(FarmBoss(Encounter.CHAPTER_BOSS), bosses.last())
    }

    @Test
    fun `the current chapter keeps the rule of the stage`() {
        val bosses = FarmBoss.beaten(at3, ChapterDefinition.of(3))

        assertEquals(listOf(1, 2, 3), bosses.map { it.stage })
        assertEquals(List(3) { Encounter.MINIBOSS }, bosses.map { it.kind })
    }

    @Test
    fun `a chapter above the current one has no boss beaten`() {
        assertEquals(emptyList<FarmBoss>(), FarmBoss.beaten(at3, ChapterDefinition.of(4)))
    }

    @Test
    fun `the current chapter at its first phase has no boss beaten but the chapter before has all eleven`() {
        val atFirstPhase = Progress("yan", ProgressPosition(2, 1, Encounter.PHASE, 1))

        assertEquals(emptyList<FarmBoss>(), FarmBoss.beaten(atFirstPhase, ChapterDefinition.of(2)))
        assertEquals(11, FarmBoss.beaten(atFirstPhase, ChapterDefinition.of(1)).size)
    }

    @Test
    fun `a completed campaign has all eleven bosses of chapter 15 and of chapter 14 beaten`() {
        val completed = Progress("yan", ProgressPosition(15, 10, Encounter.CHAPTER_BOSS, 1), completed = true)

        assertEquals(11, FarmBoss.beaten(completed, ChapterDefinition.of(15)).size)
        assertEquals(11, FarmBoss.beaten(completed, ChapterDefinition.of(14)).size)
    }

    @Test
    fun `the reached chapters run from 1 to the current chapter`() {
        val completed = Progress("yan", ProgressPosition(15, 10, Encounter.CHAPTER_BOSS, 1), completed = true)

        assertEquals(listOf(1, 2, 3), FarmBoss.reachedChapters(at3))
        assertEquals(listOf(1), FarmBoss.reachedChapters(Progress.start("yan")))
        assertEquals((1..15).toList(), FarmBoss.reachedChapters(completed))
    }

    @Test
    fun `the chapter message is the 400 detail of the spec`() {
        assertEquals("chapter must be an integer of at least 1", FarmBoss.CHAPTER_MESSAGE)
    }
}
