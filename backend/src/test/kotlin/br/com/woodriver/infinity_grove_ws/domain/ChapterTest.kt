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
    fun `the seeded phase monster health grows from 40 to 76 in steps of 4`() {
        assertEquals((40..76 step 4).toList(), ChapterDefinition.first().stages.map { it.monsterHealth })
    }

    @Test
    fun `the seeded miniboss has 5 times the phase monster health and a 30 second limit`() {
        val stages = ChapterDefinition.first().stages

        assertEquals(stages.map { it.monsterHealth * 5 }, stages.map { it.minibossHealth })
        assertEquals(List(10) { 30_000L }, stages.map { it.minibossTimeLimitMs })
    }

    @Test
    fun `the seeded chapter boss has 2000 health and a 60 second limit`() {
        val first = ChapterDefinition.first()

        assertEquals(2000, first.bossHealth)
        assertEquals(60_000L, first.bossTimeLimitMs)
    }

    @Test
    fun `chapter 1 is the first chapter and later chapters have more health and defense`() {
        assertEquals(ChapterDefinition.first(), ChapterDefinition.of(1))
        (2..ChapterOrder.MAX_CHAPTER).forEach {
            val chapter = ChapterDefinition.of(it)
            val before = ChapterDefinition.of(it - 1)

            assertEquals(it, chapter.number)
            assertTrue(chapter.bossHealth > before.bossHealth)
            assertTrue(chapter.stage(1).monsterHealth > before.stage(1).monsterHealth)
            assertTrue(chapter.boss.physicalDefense > before.boss.physicalDefense)
        }
    }

    @Test
    fun `a chapter past the last one cannot be built`() {
        assertFailsWith<IllegalArgumentException> { ChapterDefinition.of(ChapterOrder.MAX_CHAPTER + 1) }
    }

    @Test
    fun `chapter 1 seeds a monster rule of 1 to 5, a miniboss rule of 5 to 15 and a boss rule of 20 to 50 copper`() {
        assertEquals(
            listOf(DropRule(1, 1, 5, 1500), DropRule(2, 5, 15, 1500), DropRule(3, 20, 50, 1500)),
            ChapterDefinition.dropRules(1),
        )
    }

    @Test
    fun `chapter 5 seeds its rules as ids 13 to 15 with five times the chapter 1 ranges`() {
        assertEquals(
            listOf(DropRule(13, 5, 25, 1500), DropRule(14, 25, 75, 1500), DropRule(15, 100, 250, 1500)),
            ChapterDefinition.dropRules(5),
        )
    }

    @Test
    fun `the 15 seed rules of chapters 1 to 5 have distinct ids`() {
        val ids = (1..5).flatMap { c -> ChapterDefinition.dropRules(c).map { it.id } }

        assertEquals(15, ids.size)
        assertEquals((1..15).toSet(), ids.toSet())
    }

    @Test
    fun `every seeded stage pays the chapter monster and miniboss rules and the boss pays the chapter boss rule`() {
        (1..5).forEach { c ->
            val chapter = ChapterDefinition.of(c)

            chapter.stages.forEach { stage ->
                assertEquals(3 * c - 2, stage.monsterDropRuleId, "chapter $c stage ${stage.number} monster")
                assertEquals(3 * c - 1, stage.minibossDropRuleId, "chapter $c stage ${stage.number} miniboss")
            }
            assertEquals(3 * c, chapter.bossDropRuleId, "chapter $c boss")
        }
    }

    @Test
    fun `a hand-built stage and chapter default to drop rule 1`() {
        val chapter = chapter(stages = listOf(stage(1)))

        assertEquals(1, chapter.bossDropRuleId)
        assertEquals(1, chapter.stages.single().monsterDropRuleId)
        assertEquals(1, chapter.stages.single().minibossDropRuleId)
    }

    @Test
    fun `the health multiplies by 4 each chapter`() {
        assertEquals(listOf(1, 4, 16, 64, 256), (1..5).map { ChapterDefinition.healthFactor(it) })
        assertEquals(40 * 16, ChapterDefinition.of(3).stage(1).monsterHealth)
        assertEquals(76 * 256, ChapterDefinition.of(5).stage(10).monsterHealth)
        assertEquals(2000 * 64, ChapterDefinition.of(4).bossHealth)
    }
}
