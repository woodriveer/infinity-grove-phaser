package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class DropTableTest {
    private fun rule(
        level: Int = 1,
        min: Int = 1,
        max: Int = 5,
        interval: Long = 1500,
    ) = DropRule(level, min, max, interval)

    @Test
    fun `rule rejects a level below 1 and names the level`() {
        val e = assertFailsWith<IllegalArgumentException> { rule(level = 0) }

        assertTrue(e.message!!.contains("level 0"), e.message)
    }

    @Test
    fun `rule rejects a minimum below 1 and names the level`() {
        val e = assertFailsWith<IllegalArgumentException> { rule(level = 2, min = 0) }

        assertTrue(e.message!!.contains("level 2"), e.message)
    }

    @Test
    fun `rule rejects a maximum below the minimum and names the level`() {
        val e = assertFailsWith<IllegalArgumentException> { rule(level = 3, min = 5, max = 4) }

        assertTrue(e.message!!.contains("level 3"), e.message)
    }

    @Test
    fun `rule accepts a maximum equal to the minimum`() {
        assertEquals(3, rule(min = 3, max = 3).maxCopper)
    }

    @Test
    fun `rule rejects a kill interval below 1 and names the level`() {
        val e = assertFailsWith<IllegalArgumentException> { rule(level = 4, interval = 0) }

        assertTrue(e.message!!.contains("level 4"), e.message)
    }

    @Test
    fun `rule rolls between its own minimum and maximum`() {
        val asked = mutableListOf<Pair<Int, Int>>()
        val roller =
            object : DropRollerPort {
                override fun roll(
                    min: Int,
                    max: Int,
                ): Int {
                    asked += min to max
                    return 4
                }
            }

        val value = rule(min = 2, max = 9).roll(roller)

        assertEquals(4, value)
        assertEquals(listOf(2 to 9), asked)
    }

    @Test
    fun `rule accepts values inside the range with both bounds included`() {
        val rule = rule(min = 2, max = 5)

        assertFalse(rule.accepts(1))
        assertTrue(rule.accepts(2))
        assertTrue(rule.accepts(5))
        assertFalse(rule.accepts(6))
    }

    @Test
    fun `table rejects an empty rule list`() {
        assertFailsWith<IllegalArgumentException> { DropTable(emptyList()) }
    }

    @Test
    fun `table rejects a duplicate level and names it`() {
        val e = assertFailsWith<IllegalArgumentException> { DropTable(listOf(rule(level = 1), rule(level = 1, max = 9))) }

        assertTrue(e.message!!.contains("level 1"), e.message)
    }

    @Test
    fun `table finds a rule by level and lists its levels`() {
        val table = DropTable(listOf(rule(level = 1), rule(level = 2, min = 10, max = 12)))

        assertEquals(listOf(1, 2), table.levels)
        assertEquals(10, table.ruleFor(2)!!.minCopper)
        assertNull(table.ruleFor(3))
    }
}
