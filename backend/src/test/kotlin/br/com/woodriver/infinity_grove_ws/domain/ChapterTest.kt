package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ChapterTest {
    private fun stage(
        number: Int = 1,
        phases: Int = 5,
        monster: Long = 10,
        miniboss: Long = 50,
        limit: Long = 30_000,
    ) = StageDefinition(number, phases, monster, miniboss, limit)

    private fun chapter(
        stages: List<StageDefinition> = listOf(stage(1), stage(2)),
        bossHealth: Long = 300,
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
        assertEquals((40L..76L step 4L).toList(), ChapterDefinition.first().stages.map { it.monsterHealth })
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

        assertEquals(2000L, first.bossHealth)
        assertEquals(60_000L, first.bossTimeLimitMs)
    }

    @Test
    fun `chapter 1 is the first chapter and later chapters have more health and defense`() {
        assertEquals(ChapterDefinition.first(), ChapterDefinition.of(1))
        (2..15).forEach {
            val chapter = ChapterDefinition.of(it)
            val before = ChapterDefinition.of(it - 1)

            assertEquals(it, chapter.number)
            assertTrue(chapter.bossHealth > before.bossHealth)
            assertTrue(chapter.stage(1).monsterHealth > before.stage(1).monsterHealth)
            assertTrue(chapter.boss.physicalDefense > before.boss.physicalDefense)
        }
    }

    @Test
    fun `chapter 0 cannot be built`() {
        assertFailsWith<IllegalArgumentException> { ChapterDefinition.of(0) }
    }

    @Test
    fun `health doubles each chapter from chapter 6`() {
        assertEquals(256L, ChapterDefinition.healthFactor(5))
        assertEquals(512L, ChapterDefinition.healthFactor(6))
        assertEquals(262_144L, ChapterDefinition.healthFactor(15))
    }

    @Test
    fun `chapter 6 has twice the health of chapter 5`() {
        val chapter = ChapterDefinition.of(6)

        assertEquals(1_024_000L, chapter.bossHealth)
        assertEquals(20_480L, chapter.stage(1).monsterHealth)
        assertEquals(38_912L, chapter.stage(10).monsterHealth)
        assertEquals(194_560L, chapter.stage(10).minibossHealth)
    }

    @Test
    fun `chapter 10 follows the chapter table`() {
        val chapter = ChapterDefinition.of(10)
        val miniboss = chapter.stage(10).miniboss

        assertEquals(16_384_000L, chapter.bossHealth)
        assertEquals(3_112_960L, chapter.stage(10).minibossHealth)
        assertEquals(65, chapter.boss.physicalDefense)
        assertEquals(65, chapter.boss.magicalDefense)
        assertEquals(65, chapter.boss.critResistance)
        assertEquals(55, miniboss.physicalDefense)
        assertEquals(55, miniboss.magicalDefense)
        assertEquals(65, miniboss.critResistance)
    }

    @Test
    fun `chapter 12 caps the boss critical resistance at 70`() {
        val boss = ChapterDefinition.of(12).boss

        assertEquals(71, boss.physicalDefense)
        assertEquals(70, boss.critResistance)
    }

    @Test
    fun `chapter 15 follows the chapter table`() {
        val chapter = ChapterDefinition.of(15)
        val miniboss = chapter.stage(10).miniboss

        assertEquals(524_288_000L, chapter.bossHealth)
        assertEquals(80, chapter.boss.physicalDefense)
        assertEquals(80, chapter.boss.magicalDefense)
        assertEquals(70, chapter.boss.critResistance)
        assertEquals(19_922_944L, chapter.stage(10).monsterHealth)
        assertEquals(99_614_720L, chapter.stage(10).minibossHealth)
        assertEquals(70, miniboss.physicalDefense)
        assertEquals(70, miniboss.critResistance)
    }

    @Test
    fun `chapters 6 to 15 keep phase monsters defenseless and the 30 and 60 second limits`() {
        (6..15).forEach { c ->
            val chapter = ChapterDefinition.of(c)

            chapter.stages.forEach { stage ->
                assertEquals(0, stage.monster.physicalDefense, "chapter $c stage ${stage.number}")
                assertEquals(0, stage.monster.magicalDefense, "chapter $c stage ${stage.number}")
                assertEquals(0, stage.monster.critResistance, "chapter $c stage ${stage.number}")
                assertEquals(30_000L, stage.minibossTimeLimitMs, "chapter $c stage ${stage.number}")
            }
            assertEquals(60_000L, chapter.bossTimeLimitMs, "chapter $c boss")
        }
    }

    @Test
    fun `chapters 1 to 5 keep their numbers`() {
        val first = ChapterDefinition.of(1)
        val fifth = ChapterDefinition.of(5)

        assertEquals(2000L, first.bossHealth)
        assertEquals(40L, first.stage(1).monsterHealth)
        assertEquals(512_000L, fifth.bossHealth)
        assertEquals(50, fifth.boss.physicalDefense)
        assertEquals(50, fifth.boss.critResistance)
        assertEquals(40, fifth.stage(10).miniboss.physicalDefense)
        assertEquals(50, fifth.stage(10).miniboss.critResistance)
    }

    @Test
    fun `the coin factor doubles to chapter 8 and then grows by 32`() {
        assertEquals(
            listOf(1, 2, 4, 8, 16, 32, 64, 128, 160, 192, 224, 256, 288, 320, 352),
            (1..15).map { ChapterDefinition.coinFactor(it) },
        )
    }

    @Test
    fun `chapter 1 seeds 2 to 6, 8 to 20 and 30 to 70 copper`() {
        assertEquals(
            listOf(DropRule(1, 2, 6, 1500), DropRule(2, 8, 20, 1500), DropRule(3, 30, 70, 1500)),
            ChapterDefinition.dropRules(1),
        )
    }

    @Test
    fun `chapter 5 seeds sixteen times the chapter 1 ranges`() {
        assertEquals(
            listOf(DropRule(13, 32, 96, 1500), DropRule(14, 128, 320, 1500), DropRule(15, 480, 1120, 1500)),
            ChapterDefinition.dropRules(5),
        )
    }

    @Test
    fun `chapter 8 seeds 128 times the chapter 1 ranges`() {
        assertEquals(
            listOf(DropRule(22, 256, 768, 1500), DropRule(23, 1024, 2560, 1500), DropRule(24, 3840, 8960, 1500)),
            ChapterDefinition.dropRules(8),
        )
    }

    @Test
    fun `chapter 15 seeds 352 times the chapter 1 ranges`() {
        assertEquals(
            listOf(DropRule(43, 704, 2112, 1500), DropRule(44, 2816, 7040, 1500), DropRule(45, 10560, 24640, 1500)),
            ChapterDefinition.dropRules(15),
        )
    }

    @Test
    fun `the 45 seed rules of chapters 1 to 15 have distinct ids`() {
        val ids = (1..15).flatMap { c -> ChapterDefinition.dropRules(c).map { it.id } }

        assertEquals(45, ids.size)
        assertEquals((1..45).toSet(), ids.toSet())
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
        assertEquals(listOf(1L, 4L, 16L, 64L, 256L), (1..5).map { ChapterDefinition.healthFactor(it) })
        assertEquals(40L * 16, ChapterDefinition.of(3).stage(1).monsterHealth)
        assertEquals(76L * 256, ChapterDefinition.of(5).stage(10).monsterHealth)
        assertEquals(2000L * 64, ChapterDefinition.of(4).bossHealth)
    }

    @Test
    fun `a stage keeps a health above the 32-bit limit`() {
        val stage = StageDefinition(1, 5, 3_000_000_000L, 15_000_000_000L, 30_000)

        assertEquals(3_000_000_000L, stage.monsterHealth)
        assertEquals(15_000_000_000L, stage.minibossHealth)
    }
}
