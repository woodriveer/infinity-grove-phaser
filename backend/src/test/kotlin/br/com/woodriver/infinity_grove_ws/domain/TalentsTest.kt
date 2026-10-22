package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class TalentsTest {
    private val rules = TalentRules()
    private val clickDamage = TalentCatalog.find("CLICK_DAMAGE")
    private val combo = TalentCatalog.find("COMBO")

    @Test
    fun `the catalog has the 9 talents of the four branches with the values of the spec`() {
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
                Triple("COMBO", TalentBranch.COMBO, 5),
            ),
            TalentCatalog.all.map { Triple(it.id, it.branch, it.perLevel) },
        )
        assertEquals(List(9) { 10 }, TalentCatalog.all.map { it.maxLevel })
    }

    @Test
    fun `units are seconds, points or percent`() {
        assertEquals(
            listOf("s", "s", "points", "points", "points", "%", "points", "%", "%"),
            TalentCatalog.all.map { it.unit },
        )
    }

    @Test
    fun `the combo talent reads Limite de dano do combo and gives 5 percent a level up to 50`() {
        assertEquals("Limite de dano do combo", combo.label)
        assertEquals(listOf(0, 5, 20, 50), listOf(0, 1, 4, 10).map(combo::valueAt))
    }

    @Test
    fun `an unknown talent is not found`() {
        val e = assertFailsWith<TalentNotFoundException> { TalentCatalog.find("NOPE") }

        assertEquals("TALENT_NOT_FOUND", e.code)
    }

    @Test
    fun `a first clear pays 1 point for a phase, 2 for a miniboss and 5 for a chapter boss`() {
        assertEquals(1, rules.award(ProgressPosition(1, 1, Encounter.PHASE, 1)).points)
        assertEquals(2, rules.award(ProgressPosition(1, 1, Encounter.MINIBOSS, 1)).points)
        assertEquals(5, rules.award(ProgressPosition(1, 5, Encounter.CHAPTER_BOSS, 1)).points)
    }

    @Test
    fun `the award key names the position so a replay of it has the same key and another position another key`() {
        val phase = rules.award(ProgressPosition(2, 3, Encounter.PHASE, 4))

        assertEquals("2:3:PHASE:4", phase.key)
        assertEquals(phase, rules.award(ProgressPosition(2, 3, Encounter.PHASE, 4)))
        assertEquals("2:3:MINIBOSS:1", rules.award(ProgressPosition(2, 3, Encounter.MINIBOSS, 1)).key)
        assertEquals("3:1:PHASE:1", rules.award(ProgressPosition(3, 1, Encounter.PHASE, 1)).key)
    }

    @Test
    fun `the points follow the settings`() {
        val tuned = TalentRules(costPerLevel = 2, pointsPerPhase = 3, pointsPerMiniboss = 4, pointsPerChapterBoss = 9)

        assertEquals(3, tuned.award(ProgressPosition(1, 1, Encounter.PHASE, 1)).points)
        assertEquals(4, tuned.award(ProgressPosition(1, 1, Encounter.MINIBOSS, 1)).points)
        assertEquals(9, tuned.award(ProgressPosition(1, 1, Encounter.CHAPTER_BOSS, 1)).points)
        assertEquals(2, PlayerTalents("yan", earned = 5).upgrade(clickDamage, 0, tuned).cost)
    }

    @Test
    fun `rules reject a cost below 1 and negative points`() {
        assertFailsWith<IllegalArgumentException> { TalentRules(costPerLevel = 0) }
        assertFailsWith<IllegalArgumentException> { TalentRules(pointsPerPhase = -1) }
        assertFailsWith<IllegalArgumentException> { TalentRules(pointsPerMiniboss = -1) }
        assertFailsWith<IllegalArgumentException> { TalentRules(pointsPerChapterBoss = -1) }
    }

    @Test
    fun `a new player has level 0 and 0 points and every next cost is 1`() {
        val talents = PlayerTalents("yan")

        assertEquals(List(9) { 0 }, TalentCatalog.all.map { talents.level(it.id) })
        assertEquals(List(9) { 1 }, TalentCatalog.all.map { talents.nextCost(it, rules) })
        assertEquals(TalentPoints(0, 0), talents.points(rules))
        assertEquals(0, talents.points(rules).available)
    }

    @Test
    fun `an upgrade with 3 points raises the level by one and spends 1`() {
        val upgrade = PlayerTalents("yan", earned = 3).upgrade(combo, 0, rules)

        assertEquals(1, upgrade.talents.level("COMBO"))
        assertEquals(1, upgrade.cost)
        assertEquals(TalentPoints(3, 1), upgrade.talents.points(rules))
        assertEquals(2, upgrade.talents.points(rules).available)
    }

    @Test
    fun `the points spent are the sum of the levels`() {
        val talents = PlayerTalents("yan", mapOf("COMBO" to 4, "CLICK_DAMAGE" to 2), earned = 10)

        assertEquals(TalentPoints(10, 6), talents.points(rules))
        assertEquals(4, talents.points(rules).available)
    }

    @Test
    fun `an upgrade with no available point is refused and changes nothing`() {
        val talents = PlayerTalents("yan", mapOf("COMBO" to 2), earned = 2)

        val e = assertFailsWith<NotEnoughTalentPointsException> { talents.upgrade(combo, 2, rules) }

        assertEquals("NOT_ENOUGH_TALENT_POINTS", e.code)
        assertEquals(2, talents.level("COMBO"))
    }

    @Test
    fun `a request made for another level than the stored one is a mismatch and changes nothing`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 3), earned = 9)

        val e = assertFailsWith<TalentLevelMismatchException> { talents.upgrade(clickDamage, 2, rules) }

        assertEquals("TALENT_LEVEL_MISMATCH", e.code)
        assertEquals(3, talents.level("CLICK_DAMAGE"))
    }

    @Test
    fun `an upgrade from level 0 of a talent already at 1 is a mismatch`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 1), earned = 5)

        assertFailsWith<TalentLevelMismatchException> { talents.upgrade(clickDamage, 0, rules) }
    }

    @Test
    fun `a talent at level 10 refuses the upgrade as max level and has no next cost`() {
        val talents = PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 10), earned = 50)

        val e = assertFailsWith<TalentMaxLevelException> { talents.upgrade(clickDamage, 10, rules) }

        assertEquals("TALENT_MAX_LEVEL", e.code)
        assertNull(talents.nextCost(clickDamage, rules))
    }

    @Test
    fun `at level 9 the next cost is 1 and the upgrade reaches 10, which gives the combo talent 50`() {
        val talents = PlayerTalents("yan", mapOf("COMBO" to 9), earned = 10)

        assertEquals(1, talents.nextCost(combo, rules))
        val upgraded = talents.upgrade(combo, 9, rules).talents
        assertEquals(10, upgraded.level("COMBO"))
        assertEquals(50, combo.valueAt(upgraded.level("COMBO")))
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
    fun `stored levels must be in the catalog and between 1 and 10 and the earned points not negative`() {
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("NOPE" to 1)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 0)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 11)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", earned = -1) }
    }
}
