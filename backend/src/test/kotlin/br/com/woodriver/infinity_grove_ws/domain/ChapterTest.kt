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
    fun `the seeded first chapter has 10 stages of 8 phases`() {
        val first = ChapterDefinition.first()

        assertEquals(1, first.number)
        assertEquals(10, first.stageCount)
        assertEquals(List(10) { 8 }, first.stages.map { it.phasesPerStage })
    }

    @Test
    fun `the seeded phase monster health of chapter 1 grows from 69 to 898`() {
        assertEquals(
            listOf(69L, 92L, 122L, 162L, 216L, 287L, 382L, 508L, 676L, 898L),
            ChapterDefinition.first().stages.map { it.monsterHealth },
        )
    }

    @Test
    fun `the seeded miniboss has 3 times the phase monster health and a 45 second limit`() {
        (1..15).forEach { c ->
            val stages = ChapterDefinition.of(c).stages

            assertEquals(stages.map { it.monsterHealth * 3 }, stages.map { it.minibossHealth }, "chapter $c")
            assertEquals(List(10) { 45_000L }, stages.map { it.minibossTimeLimitMs }, "chapter $c")
        }
    }

    @Test
    fun `the seeded chapter boss of chapter 1 has 6000 health and a 90 second limit`() {
        val first = ChapterDefinition.first()

        assertEquals(6000L, first.bossHealth)
        assertEquals(90_000L, first.bossTimeLimitMs)
    }

    @Test
    fun `chapter 1 is the first chapter and later chapters have more health and defense`() {
        assertEquals(ChapterDefinition.first(), ChapterDefinition.of(1))
        (2..15).forEach {
            val chapter = ChapterDefinition.of(it)
            val before = ChapterDefinition.of(it - 1)

            assertEquals(it, chapter.number)
            assertTrue(chapter.bossHealth > before.bossHealth)
            assertTrue(chapter.boss.defense > before.boss.defense)
        }
        // the table restarts the phase health at chapters 6 and 11 (spec Chapter Table), so the stage 1 health is compared at chapter 2 only
        assertTrue(ChapterDefinition.of(2).stage(1).monsterHealth > ChapterDefinition.of(1).stage(1).monsterHealth)
    }

    @Test
    fun `chapter 0 cannot be built`() {
        assertFailsWith<IllegalArgumentException> { ChapterDefinition.of(0) }
    }

    @Test
    fun `chapter 6 starts where chapter 5 ends`() {
        assertEquals(10_319L, ChapterDefinition.of(5).stage(10).monsterHealth)
        assertEquals(10_000L, ChapterDefinition.of(6).stage(1).monsterHealth)
        assertEquals(130_000L, ChapterDefinition.of(6).bossHealth)
    }

    @Test
    fun `chapter 10 follows the chapter table`() {
        val chapter = ChapterDefinition.of(10)
        val miniboss = chapter.stage(10).miniboss

        assertEquals(900_000L, chapter.bossHealth)
        assertEquals(71_000L, chapter.stage(1).monsterHealth)
        assertEquals(303_165L, chapter.stage(10).minibossHealth)
        assertEquals(65, chapter.boss.defense)
        assertEquals(65, chapter.boss.critResistance)
        assertEquals(55, miniboss.defense)
        assertEquals(65, miniboss.critResistance)
    }

    @Test
    fun `chapter 12 caps the boss critical resistance at 70`() {
        val boss = ChapterDefinition.of(12).boss

        assertEquals(71, boss.defense)
        assertEquals(70, boss.critResistance)
    }

    @Test
    fun `chapter 15 follows the chapter table`() {
        val chapter = ChapterDefinition.of(15)
        val miniboss = chapter.stage(10).miniboss

        assertEquals(4_265_000L, chapter.bossHealth)
        assertEquals(80, chapter.boss.defense)
        assertEquals(70, chapter.boss.critResistance)
        assertEquals(161_000L, chapter.stage(1).monsterHealth)
        assertEquals(229_153L, chapter.stage(10).monsterHealth)
        assertEquals(687_459L, chapter.stage(10).minibossHealth)
        assertEquals(70, miniboss.defense)
        assertEquals(70, miniboss.critResistance)
    }

    @Test
    fun `chapters 6 to 15 keep phase monsters defenseless and seed 90 and 45 second limits`() {
        (6..15).forEach { c ->
            val chapter = ChapterDefinition.of(c)

            chapter.stages.forEach { stage ->
                assertEquals(0, stage.monster.defense, "chapter $c stage ${stage.number}")
                assertEquals(0, stage.monster.critResistance, "chapter $c stage ${stage.number}")
                assertEquals(45_000L, stage.minibossTimeLimitMs, "chapter $c stage ${stage.number}")
            }
            assertEquals(90_000L, chapter.bossTimeLimitMs, "chapter $c boss")
        }
    }

    @Test
    fun `chapters 1 to 5 seed the table`() {
        val first = ChapterDefinition.of(1)
        val fifth = ChapterDefinition.of(5)

        assertEquals(6000L, first.bossHealth)
        assertEquals(69L, first.stage(1).monsterHealth)
        assertEquals(80_000L, fifth.bossHealth)
        assertEquals(50, fifth.boss.defense)
        assertEquals(45, fifth.boss.critResistance)
        assertEquals(40, fifth.stage(10).miniboss.defense)
        assertEquals(41, fifth.stage(10).miniboss.critResistance)
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
    fun `the health factor still multiplies by 4 to chapter 5 and by 2 after`() {
        assertEquals(listOf(1L, 4L, 16L, 64L, 256L), (1..5).map { ChapterDefinition.healthFactor(it) })
        assertEquals(listOf(512L, 1_024L, 2_048L), (6..8).map { ChapterDefinition.healthFactor(it) })
        assertEquals(262_144L, ChapterDefinition.healthFactor(15))
    }

    @Test
    fun `a stage keeps a health above the 32-bit limit`() {
        val stage = StageDefinition(1, 8, 3_000_000_000L, 9_000_000_000L, 45_000)

        assertEquals(3_000_000_000L, stage.monsterHealth)
        assertEquals(9_000_000_000L, stage.minibossHealth)
    }

    /** One row of the Chapter Table of the spec, every column. */
    private data class ChapterTableRow(
        val chapter: Int,
        val factor: Long,
        val bossHealth: Long,
        val phaseHealthStage1: Long,
        val phaseHealthStage10: Long,
        val minibossHealthStage10: Long,
        val bonus: Int,
        val bossDefenses: Int,
        val bossCritResistance: Int,
        val minibossDefensesStage10: Int,
        val minibossCritResistanceStage10: Int,
    )

    private val chapterTable =
        listOf(
            ChapterTableRow(6, 512, 130_000, 10_000, 14_233, 42_699, 23, 53, 53, 43, 53),
            ChapterTableRow(7, 1_024, 139_000, 28_000, 39_853, 119_559, 26, 56, 56, 46, 56),
            ChapterTableRow(8, 2_048, 313_000, 36_000, 51_239, 153_717, 29, 59, 59, 49, 59),
            ChapterTableRow(9, 4_096, 475_000, 58_000, 82_552, 247_656, 32, 62, 62, 52, 62),
            ChapterTableRow(10, 8_192, 900_000, 71_000, 101_055, 303_165, 35, 65, 65, 55, 65),
            ChapterTableRow(11, 16_384, 956_000, 38_000, 54_086, 162_258, 38, 68, 68, 58, 68),
            ChapterTableRow(12, 32_768, 1_850_000, 64_000, 91_092, 273_276, 41, 71, 70, 61, 70),
            ChapterTableRow(13, 65_536, 1_940_000, 90_000, 128_098, 384_294, 44, 74, 70, 64, 70),
            ChapterTableRow(14, 131_072, 2_837_000, 133_000, 189_300, 567_900, 47, 77, 70, 67, 70),
            ChapterTableRow(15, 262_144, 4_265_000, 161_000, 229_153, 687_459, 50, 80, 70, 70, 70),
        )

    /** Chapters 1 to 5 as the spec Chapter Table seeds them: health, defenses and the early critical resistances. */
    private val firstFiveChapters =
        listOf(
            ChapterTableRow(1, 1, 6_000, 69, 898, 2_694, 0, 30, 5, 20, 9),
            ChapterTableRow(2, 4, 12_500, 265, 2_622, 7_866, 5, 35, 15, 25, 17),
            ChapterTableRow(3, 16, 13_000, 1_000, 3_803, 11_409, 10, 40, 25, 30, 25),
            ChapterTableRow(4, 64, 34_000, 4_750, 6_761, 20_283, 15, 45, 35, 35, 33),
            ChapterTableRow(5, 256, 80_000, 7_250, 10_319, 30_957, 20, 50, 45, 40, 41),
        )

    /** The phase monster health of every stage by chapter, written out from the spec Chapter Table. */
    private val tablePhaseHealth: Map<Int, List<Long>> =
        mapOf(
            1 to listOf(69L, 92L, 122L, 162L, 216L, 287L, 382L, 508L, 676L, 898L),
            2 to listOf(265L, 342L, 441L, 569L, 734L, 947L, 1221L, 1575L, 2032L, 2622L),
            3 to listOf(1000L, 1160L, 1346L, 1561L, 1811L, 2100L, 2436L, 2826L, 3278L, 3803L),
            4 to listOf(4750L, 4940L, 5138L, 5343L, 5557L, 5779L, 6010L, 6251L, 6501L, 6761L),
            5 to listOf(7250L, 7540L, 7842L, 8155L, 8481L, 8821L, 9174L, 9541L, 9922L, 10319L),
            6 to listOf(10000L, 10400L, 10816L, 11249L, 11699L, 12167L, 12653L, 13159L, 13686L, 14233L),
            7 to listOf(28000L, 29120L, 30285L, 31496L, 32756L, 34066L, 35429L, 36846L, 38320L, 39853L),
            8 to listOf(36000L, 37440L, 38938L, 40495L, 42115L, 43800L, 45551L, 47374L, 49268L, 51239L),
            9 to listOf(58000L, 60320L, 62733L, 65242L, 67852L, 70566L, 73389L, 76324L, 79377L, 82552L),
            10 to listOf(71000L, 73840L, 76794L, 79865L, 83060L, 86382L, 89838L, 93431L, 97168L, 101055L),
            11 to listOf(38000L, 39520L, 41101L, 42745L, 44455L, 46233L, 48082L, 50005L, 52006L, 54086L),
            12 to listOf(64000L, 66560L, 69222L, 71991L, 74871L, 77866L, 80980L, 84220L, 87588L, 91092L),
            13 to listOf(90000L, 93600L, 97344L, 101238L, 105287L, 109499L, 113879L, 118434L, 123171L, 128098L),
            14 to listOf(133000L, 138320L, 143853L, 149607L, 155591L, 161815L, 168287L, 175019L, 182020L, 189300L),
            15 to listOf(161000L, 167440L, 174138L, 181103L, 188347L, 195881L, 203716L, 211865L, 220340L, 229153L),
        )

    private fun assertChapterTableRow(row: ChapterTableRow) {
        val c = row.chapter
        val chapter = ChapterDefinition.of(c)
        val miniboss = chapter.stage(10).miniboss

        assertEquals(row.factor, ChapterDefinition.healthFactor(c), "chapter $c factor")
        assertEquals(row.bonus, ChapterDefinition.defenseBonus(c), "chapter $c bonus")
        assertEquals(row.bossHealth, chapter.bossHealth, "chapter $c boss health")
        assertEquals(row.phaseHealthStage1, chapter.stage(1).monsterHealth, "chapter $c phase health stage 1")
        assertEquals(row.phaseHealthStage10, chapter.stage(10).monsterHealth, "chapter $c phase health stage 10")
        assertEquals(row.minibossHealthStage10, chapter.stage(10).minibossHealth, "chapter $c miniboss health stage 10")
        assertEquals(row.bossDefenses, chapter.boss.defense, "chapter $c boss defense")
        assertEquals(row.bossCritResistance, chapter.boss.critResistance, "chapter $c boss crit resistance")
        assertEquals(row.minibossDefensesStage10, miniboss.defense, "chapter $c miniboss defense stage 10")
        assertEquals(row.minibossCritResistanceStage10, miniboss.critResistance, "chapter $c miniboss crit resistance stage 10")
    }

    @Test
    fun `every row of the chapter table holds for chapters 6 to 15`() {
        chapterTable.forEach { assertChapterTableRow(it) }
    }

    @Test
    fun `every stage of chapters 6 to 15 follows the table`() {
        (6..15).forEach { c ->
            // Spec Chapter Table: defense bonus 20 + 3 x (c-5), critical resistance min(10 + 2n + bonus, 70)
            assertStageFormulas(c, bonus = 20 + 3 * (c - 5)) { n, bonus -> minOf(10 + 2 * n + bonus, 70) }
        }
    }

    @Test
    fun `every stage of chapters 1 to 5 follows the table`() {
        (1..5).forEach { c ->
            // Spec Chapter Table: defense bonus 5 x (c-1), critical resistance (n - 1) + 8(c - 1)
            assertStageFormulas(c, bonus = 5 * (c - 1)) { n, _ -> (n - 1) + 8 * (c - 1) }
        }
    }

    /** Every stage of chapter [c] against the table health and the defense [bonus]; [critResistance] is the miniboss one by stage and bonus. */
    private fun assertStageFormulas(
        c: Int,
        bonus: Int,
        critResistance: (Int, Int) -> Int,
    ) {
        val elements = listOf(Element.FIRE, Element.WATER, Element.NATURE, Element.LIGHT, Element.DARKNESS)
        val chapter = ChapterDefinition.of(c)

        assertEquals(10, chapter.stageCount, "chapter $c stage count")
        (1..10).forEach { n ->
            val stage = chapter.stage(n)
            val label = "chapter $c stage $n"
            val phaseHealth = tablePhaseHealth.getValue(c)[n - 1]
            assertEquals(phaseHealth, stage.monsterHealth, "$label phase monster health")
            assertEquals(3L * phaseHealth, stage.minibossHealth, "$label miniboss health")
            // miniboss defense min(10 + n + bonus, 80)
            assertEquals(minOf(10 + n + bonus, 80), stage.miniboss.defense, "$label miniboss defense")
            assertEquals(critResistance(n, bonus), stage.miniboss.critResistance, "$label miniboss crit resistance")
            // elements cycle by stage number and shift by one per chapter (campaign-chapters Q16 keeps the rotating formula)
            val element = elements[(n - 1 + c - 1) % elements.size]
            assertEquals(element, stage.monster.element, "$label phase monster element")
            assertEquals(element, stage.miniboss.element, "$label miniboss element")
        }
    }

    @Test
    fun `chapters 1 to 5 keep every column of the chapter table`() {
        firstFiveChapters.forEach { assertChapterTableRow(it) }
    }

    @Test
    fun `chapters 1 to 5 keep the boss elements of the release`() {
        // Release rule (commit 91e3111, Chapter.kt:155): boss element Element.entries[(c + 3) mod 5],
        // over FIRE, WATER, NATURE, LIGHT, DARKNESS. Written as literals, not as the formula.
        val bossElements =
            mapOf(
                1 to Element.DARKNESS,
                2 to Element.FIRE,
                3 to Element.WATER,
                4 to Element.NATURE,
                5 to Element.LIGHT,
            )
        bossElements.forEach { (c, element) ->
            assertEquals(element, ChapterDefinition.of(c).boss.element, "chapter $c boss element")
        }
    }

    @Test
    fun `every chapter seeds 90 and 45 second limits`() {
        (1..15).forEach { c ->
            val chapter = ChapterDefinition.of(c)

            assertEquals(90_000L, chapter.bossTimeLimitMs, "chapter $c boss")
            chapter.stages.forEach { stage ->
                assertEquals(45_000L, stage.minibossTimeLimitMs, "chapter $c stage ${stage.number}")
            }
        }
    }

    @Test
    fun `an add with health 0 is rejected`() {
        val e = assertFailsWith<IllegalArgumentException> { StageAdd(0, 30) }

        assertEquals("add health 0 must be at least 1", e.message)
    }

    @Test
    fun `an add with health 1 is accepted`() {
        assertEquals(1L, StageAdd(1, 30).health)
    }

    @Test
    fun `an add buff of -1 or 91 is rejected and 0 and 90 are accepted`() {
        assertFailsWith<IllegalArgumentException> { StageAdd(5, -1) }
        val e = assertFailsWith<IllegalArgumentException> { StageAdd(5, 91) }

        assertEquals("add defense-buff 91 must be between 0 and 90", e.message)
        assertEquals(0, StageAdd(5, 0).defenseBuff)
        assertEquals(90, StageAdd(5, 90).defenseBuff)
    }

    @Test
    fun `a stage with 3 adds is rejected and names the stage`() {
        val e =
            assertFailsWith<IllegalArgumentException> {
                StageDefinition(1, 5, 10, 50, 30_000, adds = List(3) { StageAdd(1, 0) })
            }

        assertEquals("Stage 1: at most 2 adds, got 3", e.message)
        assertEquals(2, StageDefinition(1, 5, 10, 50, 30_000, adds = List(2) { StageAdd(1, 0) }).adds.size)
    }

    @Test
    fun `a stage without adds has an empty list`() {
        assertEquals(emptyList(), stage().adds)
    }

    @Test
    fun `chapters 1 to 10 seed no adds`() {
        (1..10).forEach { c ->
            ChapterDefinition.of(c).stages.forEach { stage ->
                assertEquals(emptyList(), stage.adds, "chapter $c stage ${stage.number}")
            }
        }
    }

    @Test
    fun `chapter 11 seeds two adds of 30 with 3 times the phase monster health on every stage`() {
        val chapter = ChapterDefinition.of(11)

        assertEquals(listOf(StageAdd(114_000, 30), StageAdd(114_000, 30)), chapter.stage(1).adds)
        assertEquals(listOf(StageAdd(162_258, 30), StageAdd(162_258, 30)), chapter.stage(10).adds)
        chapter.stages.forEach { stage ->
            assertEquals(List(2) { StageAdd(3 * stage.monsterHealth, 30) }, stage.adds, "stage ${stage.number}")
        }
    }

    @Test
    fun `chapters 12 to 15 seed buffs of 35, 40, 45 and 50`() {
        mapOf(12 to 35, 13 to 40, 14 to 45, 15 to 50).forEach { (c, buff) ->
            ChapterDefinition.of(c).stages.forEach { stage ->
                assertEquals(List(2) { StageAdd(3 * stage.monsterHealth, buff) }, stage.adds, "chapter $c stage ${stage.number}")
            }
        }
    }

    @Test
    fun `chapter 15 stage 1 seeds adds of 483000 health`() {
        assertEquals(listOf(StageAdd(483_000, 50), StageAdd(483_000, 50)), ChapterDefinition.of(15).stage(1).adds)
    }

    @Test
    fun `every add of chapters 11 to 15 has 3 times the table health of its stage and today's buff`() {
        val buffs = mapOf(11 to 30, 12 to 35, 13 to 40, 14 to 45, 15 to 50)

        buffs.forEach { (c, buff) ->
            tablePhaseHealth.getValue(c).forEachIndexed { index, health ->
                val stage = ChapterDefinition.of(c).stage(index + 1)

                assertEquals(List(2) { StageAdd(3 * health, buff) }, stage.adds, "chapter $c stage ${stage.number}")
            }
        }
    }

    @Test
    fun `no boss has less health than the boss before it`() {
        assertTrue((2..15).all { ChapterDefinition.of(it).bossHealth >= ChapterDefinition.of(it - 1).bossHealth })
    }

    @Test
    fun `miniboss 1-1 asks 207 health in 45 seconds with critical resistance 0`() {
        val miniboss = ChapterDefinition.of(1).stage(1)

        assertEquals(207L, miniboss.minibossHealth)
        assertEquals(45_000L, miniboss.minibossTimeLimitMs)
        assertEquals(0, miniboss.miniboss.critResistance)
        assertEquals(11, miniboss.miniboss.defense)
    }

    @Test
    fun `the chapter 1 boss has critical resistance 5 and the chapter 5 boss 45`() {
        assertEquals(5, ChapterDefinition.of(1).boss.critResistance)
        assertEquals(45, ChapterDefinition.of(5).boss.critResistance)
    }

    @Test
    fun `chapters 6 to 15 keep their critical resistances, defenses and elements`() {
        (6..15).forEach { c ->
            val bonus = ChapterDefinition.defenseBonus(c)
            val chapter = ChapterDefinition.of(c)

            (1..10).forEach { n ->
                val miniboss = chapter.stage(n).miniboss

                assertEquals(minOf(10 + 2 * n + bonus, 70), miniboss.critResistance, "chapter $c stage $n crit resistance")
                assertEquals(minOf(10 + n + bonus, 80), miniboss.defense, "chapter $c stage $n defense")
                assertEquals(Element.entries[(n - 1 + c - 1) % 5], miniboss.element, "chapter $c stage $n element")
            }
            assertEquals(minOf(30 + bonus, 70), chapter.boss.critResistance, "chapter $c boss crit resistance")
            assertEquals(minOf(30 + bonus, 80), chapter.boss.defense, "chapter $c boss defense")
            assertEquals(Element.entries[(c + 3) % 5], chapter.boss.element, "chapter $c boss element")
        }
    }

    @Test
    fun `addsOf of a chapter outside 11 to 15 is empty`() {
        assertEquals(emptyList(), ChapterDefinition.addsOf(10, 100))
        assertEquals(emptyList(), ChapterDefinition.addsOf(16, 100))
        assertEquals(emptyList(), ChapterDefinition.addsOf(1, 100))
    }

    // affixes

    private val shield10 = MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, 6000)
    private val shield15 = MonsterAffix(MonsterAffixType.HIT_SHIELD, 15, 6000)
    private val shield30 = MonsterAffix(MonsterAffixType.HIT_SHIELD, 30, 6000)
    private val miniboss50 = MonsterAffix(MonsterAffixType.REGENERATION, 50)
    private val boss25 = MonsterAffix(MonsterAffixType.REGENERATION, 25)
    private val armored20 = MonsterAffix(MonsterAffixType.ARMORED, 20)

    private fun shell(amount: Long) = MonsterAffix(MonsterAffixType.SHELL, amount)

    /** The affixes of minibosses 3, 6, 9 and of the chapter boss of chapter [c], in that order. */
    private fun affixesOf(c: Int): List<MonsterAffix?> {
        val health = tablePhaseHealth.getValue(c)
        return listOf(3, 6, 9).map { ChapterDefinition.minibossAffixOf(c, it, health[it - 1]) } +
            ChapterDefinition.bossAffixOf(c, health.last())
    }

    @Test
    fun `chapter 1 seeds no affix`() {
        assertEquals(List(10) { null }, (1..10).map { ChapterDefinition.minibossAffixOf(1, it, tablePhaseHealth.getValue(1)[it - 1]) })
        assertEquals(null, ChapterDefinition.bossAffixOf(1, tablePhaseHealth.getValue(1).last()))
    }

    @Test
    fun `chapter 2 seeds Escudo de golpes of 10 charges and 6000 ms on minibosses 3, 6, 9 and the boss`() {
        assertEquals(listOf(shield10, shield10, shield10, shield10), affixesOf(2))
    }

    @Test
    fun `chapter 3 seeds Carapaça 6 and 14, Escudo of 15 and a Carapaça 16 boss`() {
        assertEquals(listOf(shell(6), shield15, shell(14), shell(16)), affixesOf(3))
    }

    @Test
    fun `chapter 4 seeds Regeneração 50, Carapaça 24, Regeneração 50 and a Regeneração 25 boss`() {
        assertEquals(listOf(miniboss50, shell(24), miniboss50, boss25), affixesOf(4))
    }

    @Test
    fun `chapter 5 seeds Blindado 20 on minibosses 3 and 9 and the boss and Regeneração 50 on miniboss 6`() {
        assertEquals(listOf(armored20, miniboss50, armored20, armored20), affixesOf(5))
    }

    @Test
    fun `chapters 6 to 10 rotate the four types`() {
        assertEquals(listOf(shield30, shell(49), miniboss50, armored20), affixesOf(6))
        assertEquals(listOf(shell(122), miniboss50, armored20, shield30), affixesOf(7))
        assertEquals(listOf(shield30, shell(346), miniboss50, armored20), affixesOf(10))
    }

    @Test
    fun `chapters 11 to 15 seed an affix on the boss only`() {
        (11..15).forEach { c ->
            assertEquals(
                List(10) {
                    null
                },
                (1..10).map { ChapterDefinition.minibossAffixOf(c, it, tablePhaseHealth.getValue(c)[it - 1]) },
                "chapter $c",
            )
        }
        assertEquals(
            listOf(shield30, shell(365), boss25, armored20, shield30),
            (11..15).map { ChapterDefinition.bossAffixOf(it, tablePhaseHealth.getValue(it).last()) },
        )
    }

    @Test
    fun `minibosses other than 3, 6 and 9 carry no affix`() {
        (2..10).forEach { c ->
            listOf(1, 2, 4, 5, 7, 8, 10).forEach { n ->
                assertEquals(null, ChapterDefinition.minibossAffixOf(c, n, tablePhaseHealth.getValue(c)[n - 1]), "chapter $c stage $n")
            }
        }
    }

    @Test
    fun `the shield has 10, 15, 20, 25 and then 30 charges`() {
        assertEquals(
            listOf(10L, 15L, 20L, 25L, 30L, 30L),
            listOf(2, 3, 4, 5, 6, 15).map { ChapterDefinition.affixOf(MonsterAffixType.HIT_SHIELD, it, 1, false).amount },
        )
    }

    @Test
    fun `Carapaça rounds up 4 per mille of the phase health`() {
        assertEquals(6L, ChapterDefinition.affixOf(MonsterAffixType.SHELL, 3, 1346, false).amount)
        assertEquals(4L, ChapterDefinition.affixOf(MonsterAffixType.SHELL, 3, 1000, false).amount)
        assertEquals(5L, ChapterDefinition.affixOf(MonsterAffixType.SHELL, 3, 1001, false).amount)
    }

    @Test
    fun `an affix amount of 0 is rejected and 1 is accepted`() {
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.SHELL, 0) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.HIT_SHIELD, 0, 6000) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.REGENERATION, 0) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.ARMORED, 0) }
        assertEquals(1L, MonsterAffix(MonsterAffixType.SHELL, 1).amount)
        assertEquals(1L, MonsterAffix(MonsterAffixType.HIT_SHIELD, 1, 6000).amount)
        assertEquals(1L, MonsterAffix(MonsterAffixType.REGENERATION, 1).amount)
        assertEquals(1L, MonsterAffix(MonsterAffixType.ARMORED, 1).amount)
    }

    @Test
    fun `a shield needs a period between 1 and 600000 ms`() {
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, null) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, 0) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, 600_001) }
        assertEquals(1L, MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, 1).periodMs)
        assertEquals(600_000L, MonsterAffix(MonsterAffixType.HIT_SHIELD, 10, 600_000).periodMs)
    }

    @Test
    fun `a shield has at most 1000 charges, a regeneration at most 10000 and an armor at most 90`() {
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.HIT_SHIELD, 1001, 6000) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.REGENERATION, 10_001) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.ARMORED, 91) }
        assertEquals(1000L, MonsterAffix(MonsterAffixType.HIT_SHIELD, 1000, 6000).amount)
        assertEquals(10_000L, MonsterAffix(MonsterAffixType.REGENERATION, 10_000).amount)
        assertEquals(90L, MonsterAffix(MonsterAffixType.ARMORED, 90).amount)
    }

    @Test
    fun `only a shield carries a period`() {
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.SHELL, 5, 6000) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.REGENERATION, 5, 6000) }
        assertFailsWith<IllegalArgumentException> { MonsterAffix(MonsterAffixType.ARMORED, 5, 6000) }
    }
}
