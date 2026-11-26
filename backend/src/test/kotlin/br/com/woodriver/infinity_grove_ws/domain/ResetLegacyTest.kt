package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.fail

class ResetLegacyTest {
    private val table = DropTable((1..15).flatMap(ChapterDefinition::dropRules))

    private fun legacy(vararg percents: Pair<Int, Int>) = ResetLegacy("yan", mapOf(*percents))

    private fun DropTable.range(id: Int) = ruleFor(id)!!.let { it.minCopper..it.maxCopper }

    @Test
    fun `a first reset at chapter 5 gives 50 and a second 100`() {
        val first = legacy().afterReset(5)
        val second = first.afterReset(5)

        assertEquals(mapOf(5 to 50), first.percents)
        assertEquals(mapOf(5 to 100), second.percents)
    }

    @Test
    fun `a third reset at chapter 5 keeps 100`() {
        assertEquals(mapOf(5 to 100), legacy(5 to 100).afterReset(5).percents)
    }

    @Test
    fun `a reset at chapter 10 changes only chapter 10`() {
        assertEquals(mapOf(5 to 100, 10 to 50), legacy(5 to 100).afterReset(10).percents)
    }

    @Test
    fun `a reset at chapter 0 or 16 is refused`() {
        assertFailsWith<IllegalArgumentException> { legacy().afterReset(0) }
        assertFailsWith<IllegalArgumentException> { legacy().afterReset(16) }
    }

    @Test
    fun `a stored percent of 75 or a chapter 16 is refused`() {
        assertFailsWith<IllegalArgumentException> { legacy(5 to 75) }
        assertFailsWith<IllegalArgumentException> { legacy(16 to 50) }
    }

    @Test
    fun `the best of 5 at 100 and 10 at 50 is 50 percent of chapter 10`() {
        assertEquals(LegacyChapter(10, 50), legacy(5 to 100, 10 to 50).best())
    }

    @Test
    fun `the best of 10 at 100 and 15 at 50 is 100 percent of chapter 10`() {
        assertEquals(LegacyChapter(10, 100), legacy(10 to 100, 15 to 50).best())
    }

    @Test
    fun `no legacy has no best`() {
        assertNull(legacy().best())
    }

    @Test
    fun `a tie goes to the higher chapter`() {
        assertEquals(LegacyChapter(2, 50), legacy(1 to 100, 2 to 50).best())
    }

    @Test
    fun `chapters lists ascending`() {
        assertEquals(listOf(LegacyChapter(5, 100), LegacyChapter(10, 50)), legacy(10 to 50, 5 to 100).chapters())
    }

    @Test
    fun `50 percent of chapter 15 boosts rule 1 to 354 to 1062, rule 2 to 1416 to 3540, rule 3 to 5310 to 12390`() {
        val boosted = legacy(15 to 50).boost(table)

        assertEquals(354..1062, boosted.range(1))
        assertEquals(1416..3540, boosted.range(2))
        assertEquals(5310..12390, boosted.range(3))
    }

    @Test
    fun `100 percent of chapter 5 boosts rule 1 to 34 to 102`() {
        assertEquals(34..102, legacy(5 to 100).boost(table).range(1))
    }

    @Test
    fun `50 percent of chapter 2 boosts the chapter 8 phase rule 22 to 258 to 774`() {
        assertEquals(258..774, legacy(2 to 50).boost(table).range(22))
    }

    @Test
    fun `a rule above 45 keeps its range`() {
        val withExtra = DropTable(table.rules + DropRule(46, 1, 2, 1500))

        assertEquals(1..2, legacy(15 to 50).boost(withExtra).range(46))
    }

    @Test
    fun `no legacy returns the same table`() {
        assertSame(table, legacy().boost(table))
    }

    @Test
    fun `the boost keeps ids and kill intervals`() {
        val boosted = legacy(15 to 50).boost(table)

        assertEquals(table.ids, boosted.ids)
        assertEquals(table.rules.map { it.killIntervalMs }, boosted.rules.map { it.killIntervalMs })
    }

    @Test
    fun `rarityChapter without legacy or with best at or below the chapter returns the chapter and never reads chance`() {
        val never = { fail("chance must not be read") }

        assertEquals(3, legacy().rarityChapter(3, never))
        assertEquals(5, legacy(5 to 100).rarityChapter(5, never))
        assertEquals(6, legacy(5 to 100).rarityChapter(6, never))
    }

    @Test
    fun `rarityChapter of chapter 2 with 50 percent of chapter 5 is 5 at chance 0 point 2 and 2 at chance 0 point 5`() {
        var reads = 0
        val low = legacy(5 to 50).rarityChapter(2) { reads++.let { 0.2 } }
        val high = legacy(5 to 50).rarityChapter(2) { reads++.let { 0.5 } }

        assertEquals(5, low)
        assertEquals(2, high)
        assertEquals(2, reads)
    }

    @Test
    fun `the legacy table of the spec boosts the chapter 1 rules and pays its chapter 1 copper`() {
        //  best legacy: phase range, miniboss range, boss range, expected copper of 50 phase kills, 10 minibosses and the boss
        val rows =
            listOf(
                Triple(legacy(2 to 50), listOf(4..12, 16..40, 60..140), 780),
                Triple(legacy(5 to 50), listOf(18..54, 72..180, 270..630), 3510),
                Triple(legacy(5 to 100), listOf(34..102, 136..340, 510..1190), 6630),
                Triple(legacy(10 to 50), listOf(194..582, 776..1940, 2910..6790), 37830),
                Triple(legacy(15 to 50), listOf(354..1062, 1416..3540, 5310..12390), 69030),
                Triple(legacy(10 to 100), listOf(386..1158, 1544..3860, 5790..13510), 75270),
                Triple(legacy(15 to 100), listOf(706..2118, 2824..7060, 10590..24710), 137670),
            )

        rows.forEach { (legacy, ranges, copper) ->
            val boosted = legacy.boost(table)

            assertEquals(ranges, listOf(1, 2, 3).map { boosted.range(it) }, "ranges of ${legacy.percents}")
            val expected = ranges.zip(listOf(50, 10, 1)).sumOf { (range, kills) -> kills * (range.first + range.last) / 2 }
            assertEquals(copper, expected, "chapter 1 copper of ${legacy.percents}")
        }
    }

    @Test
    fun `a reset at chapter 2 with no legacy leaves chapter 2 at 50 and a chapter 1 phase kill drops 4 to 12`() {
        val after = legacy().afterReset(2)

        assertEquals(mapOf(2 to 50), after.percents)
        assertEquals(4..12, after.boost(table).range(1))
    }

    @Test
    fun `the best of 5 at 100 and 10 at 50 raises the copper of chapter 1 by the chapter 10 share and not the chapter 5 one`() {
        assertEquals(194..582, legacy(5 to 100, 10 to 50).boost(table).range(1))
    }
}
