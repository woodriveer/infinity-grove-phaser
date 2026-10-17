package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ChapterTest {
    private fun stage(
        number: Int = 1,
        phases: Int = 5,
        monster: Int = 10,
        miniboss: Int = 50,
        limit: Long = 30_000,
    ) = StageDefinition(number, phases, monster, miniboss, limit)

    private fun chapter(
        stages: List<StageDefinition> = listOf(stage(1), stage(2)),
        bossHealth: Int = 300,
        bossLimit: Long = 60_000,
    ) = ChapterDefinition(1, bossHealth, bossLimit, stages)

    @Test
    fun `stage rejects a non-positive phase count and names the stage`() {
        val e = assertFailsWith<IllegalArgumentException> { stage(number = 3, phases = 0) }

        assertTrue(e.message!!.contains("Stage 3"), e.message)
    }

    @Test
    fun `stage rejects a non-positive monster health`() {
        assertFailsWith<IllegalArgumentException> { stage(monster = 0) }
    }

    @Test
    fun `stage rejects a non-positive miniboss health`() {
        assertFailsWith<IllegalArgumentException> { stage(miniboss = 0) }
    }

    @Test
    fun `stage rejects a non-positive miniboss time limit`() {
        assertFailsWith<IllegalArgumentException> { stage(limit = 0) }
    }

    @Test
    fun `chapter rejects a non-positive boss health`() {
        assertFailsWith<IllegalArgumentException> { chapter(bossHealth = 0) }
    }

    @Test
    fun `chapter rejects a non-positive boss time limit`() {
        assertFailsWith<IllegalArgumentException> { chapter(bossLimit = 0) }
    }

    @Test
    fun `chapter rejects an empty stage list`() {
        assertFailsWith<IllegalArgumentException> { chapter(stages = emptyList()) }
    }

    @Test
    fun `chapter rejects stages that skip a number`() {
        val e = assertFailsWith<IllegalArgumentException> { chapter(stages = listOf(stage(1), stage(3))) }

        assertTrue(e.message!!.contains("1..2"), e.message)
    }

    @Test
    fun `chapter rejects stages out of order`() {
        assertFailsWith<IllegalArgumentException> { chapter(stages = listOf(stage(2), stage(1))) }
    }

    @Test
    fun `stage returns the stage with that number and fails for an unknown one`() {
        val chapter = chapter()

        assertEquals(2, chapter.stage(2).number)
        assertFailsWith<IllegalArgumentException> { chapter.stage(3) }
    }

    @Test
    fun `stage count is the number of stages`() {
        assertEquals(2, chapter().stageCount)
    }

    @Test
    fun `the seeded first chapter has 10 stages of 5 phases`() {
        val first = ChapterDefinition.first()

        assertEquals(1, first.number)
        assertEquals(10, first.stageCount)
        assertEquals(List(10) { 5 }, first.stages.map { it.phasesPerStage })
    }

    @Test
    fun `the seeded phase monster health grows from 10 to 19`() {
        assertEquals((10..19).toList(), ChapterDefinition.first().stages.map { it.monsterHealth })
    }

    @Test
    fun `the seeded miniboss has 5 times the phase monster health and a 30 second limit`() {
        val stages = ChapterDefinition.first().stages

        assertEquals(stages.map { it.monsterHealth * 5 }, stages.map { it.minibossHealth })
        assertEquals(List(10) { 30_000L }, stages.map { it.minibossTimeLimitMs })
    }

    @Test
    fun `the seeded chapter boss has 300 health and a 60 second limit`() {
        val first = ChapterDefinition.first()

        assertEquals(300, first.bossHealth)
        assertEquals(60_000L, first.bossTimeLimitMs)
    }
}
