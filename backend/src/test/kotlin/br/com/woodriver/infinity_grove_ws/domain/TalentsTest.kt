package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class TalentsTest {
    private val rules = TalentRules()
    private val clickDamage = TalentCatalog.find("CLICK_DAMAGE")

    @Test
    fun `the catalog has the 8 talents of the three branches with the values of the spec`() {
        assertEquals(
            listOf(
                Triple("MINIBOSS_TIME", TalentBranch.TIME, 2),
                Triple("BOSS_TIME", TalentBranch.TIME, 3),
                Triple("PHYSICAL_BREAK", TalentBranch.BREAK, 1),
                Triple("MAGICAL_BREAK", TalentBranch.BREAK, 1),
                Triple("CRIT_RESIST_BREAK", TalentBranch.BREAK, 1),
                Triple("CLICK_DAMAGE", TalentBranch.POWER, 3),
                Triple("CRIT_CHANCE", TalentBranch.POWER, 1),
                Triple("CRIT_DAMAGE", TalentBranch.POWER, 5),
            ),
            TalentCatalog.all.map { Triple(it.id, it.branch, it.perLevel) },
        )
        assertEquals(List(8) { 10 }, TalentCatalog.all.map { it.maxLevel })
    }

    @Test
    fun `units are seconds, points or percent`() {
        assertEquals(
            listOf("s", "s", "points", "points", "points", "%", "points", "%"),
            TalentCatalog.all.map { it.unit },
        )
    }

    @Test
    fun `an unknown talent is not found`() {
        val e = assertFailsWith<TalentNotFoundException> { TalentCatalog.find("NOPE") }

        assertEquals("TALENT_NOT_FOUND", e.code)
    }

    @Test
    fun `the price of the upgrade from level 0 to 9 is 300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12885 and 20616`() {
        assertEquals(listOf(300L, 480L, 768L, 1229L, 1966L, 3146L, 5033L, 8053L, 12885L, 20616L), (0..9).map(rules::cost))
    }

    @Test
    fun `the price follows the base cost and the growth that are settings`() {
        assertEquals(100L, TalentRules(baseCost = 100, growth = 2.0).cost(0))
        assertEquals(400L, TalentRules(baseCost = 100, growth = 2.0).cost(2))
    }

    @Test
    fun `rules reject a negative base cost and a growth below 1`() {
        assertFailsWith<IllegalArgumentException> { TalentRules(baseCost = -1) }
        assertFailsWith<IllegalArgumentException> { TalentRules(growth = 0.9) }
    }

    @Test
    fun `a new player has level 0 and value 0 everywhere and every next cost is 300`() {
        val talents = PlayerTalents("yan")

        assertEquals(List(8) { 0 }, TalentCatalog.all.map { talents.level(it.id) })
        assertEquals(List(8) { 300L }, TalentCatalog.all.map { talents.nextCost(it, rules) })
    }

    @Test
    fun `an upgrade from the stored level raises it by one and costs the price of that level`() {
        val upgrade = PlayerTalents("yan").upgrade(clickDamage, 0, rules)

        assertEquals(1, upgrade.talents.level("CLICK_DAMAGE"))
        assertEquals(300L, upgrade.cost)
        assertEquals(480L, upgrade.talents.nextCost(clickDamage, rules))
    }

    @Test
    fun `the second upgrade costs 480 and leaves the other talents alone`() {
        val first = PlayerTalents("yan").upgrade(clickDamage, 0, rules).talents
        val second = first.upgrade(clickDamage, 1, rules)

        assertEquals(480L, second.cost)
        assertEquals(2, second.talents.level("CLICK_DAMAGE"))
        assertEquals(0, second.talents.level("CRIT_CHANCE"))
    }

    @Test
    fun `a request made for another level than the stored one is a mismatch and changes nothing`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 3))

        val e = assertFailsWith<TalentLevelMismatchException> { talents.upgrade(clickDamage, 2, rules) }

        assertEquals("TALENT_LEVEL_MISMATCH", e.code)
        assertEquals(3, talents.level("CLICK_DAMAGE"))
    }

    @Test
    fun `an upgrade from level 0 of a talent already at 1 is a mismatch`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 1))

        assertFailsWith<TalentLevelMismatchException> { talents.upgrade(clickDamage, 0, rules) }
    }

    @Test
    fun `a talent at level 10 refuses the upgrade as max level and has no next cost`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 10))

        val e = assertFailsWith<TalentMaxLevelException> { talents.upgrade(clickDamage, 10, rules) }

        assertEquals("TALENT_MAX_LEVEL", e.code)
        assertNull(talents.nextCost(clickDamage, rules))
    }

    @Test
    fun `at level 9 the next cost is 20616 and the upgrade reaches 10`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 9))

        assertEquals(20616L, talents.nextCost(clickDamage, rules))
        assertEquals(10, talents.upgrade(clickDamage, 9, rules).talents.level("CLICK_DAMAGE"))
    }

    @Test
    fun `the value of a talent is its level times the per level amount`() {
        assertEquals(15, clickDamage.valueAt(5))
        assertEquals(30, clickDamage.valueAt(10))
        assertEquals(0, clickDamage.valueAt(0))
        assertEquals(12, TalentCatalog.find("BOSS_TIME").valueAt(4))
        assertEquals(30, TalentCatalog.find("CRIT_DAMAGE").valueAt(6))
    }

    @Test
    fun `a seen level must be an integer from 0 to the max level`() {
        assertEquals(0, clickDamage.requireSeenLevel(0))
        assertEquals(10, clickDamage.requireSeenLevel(10))

        listOf(null, -1, 11).forEach { level ->
            val e = assertFailsWith<TalentRequestException> { clickDamage.requireSeenLevel(level) }
            assertEquals("INVALID_TALENT_REQUEST", e.code)
        }
    }

    @Test
    fun `stored levels must be in the catalog and between 1 and 10`() {
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("NOPE" to 1)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 0)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 11)) }
    }
}
