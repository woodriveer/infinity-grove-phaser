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
    fun `the catalog has the 10 talents of the four branches with the values of the spec`() {
        assertEquals(
            listOf(
                Triple("MINIBOSS_TIME", TalentBranch.TIME, 2),
                Triple("BOSS_TIME", TalentBranch.TIME, 3),
                Triple("PHYSICAL_BREAK", TalentBranch.BREAK, 1),
                Triple("MAGICAL_BREAK", TalentBranch.BREAK, 1),
                Triple("CRIT_RESIST_BREAK", TalentBranch.BREAK, 1),
                Triple("CLICK_DAMAGE", TalentBranch.POWER, 5),
                Triple("CRIT_CHANCE", TalentBranch.POWER, 1),
                Triple("CRIT_DAMAGE", TalentBranch.POWER, 5),
                Triple("COMBO", TalentBranch.COMBO, 5),
                Triple("CLICK_FLAT_DAMAGE", TalentBranch.POWER, 2),
            ),
            TalentCatalog.all.filter { it.grade == 1 }.map { Triple(it.id, it.branch, it.perLevel) },
        )
        assertEquals(List(30) { 10 }, TalentCatalog.all.map { it.maxLevel })
    }

    @Test
    fun `units are seconds, points or percent`() {
        assertEquals(
            listOf("s", "s", "points", "points", "points", "%", "points", "%", "%", "dmg"),
            TalentCatalog.all.filter { it.grade == 1 }.map { it.unit },
        )
    }

    @Test
    fun `the combo talent reads Limite de dano do combo and gives 5 percent a level up to 50`() {
        assertEquals("Limite de dano do combo", combo.label)
        assertEquals(listOf(0, 5, 20, 50), listOf(0, 1, 4, 10).map(combo::valueAt))
    }

    @Test
    fun `the click damage percent talent gives 5 percent a level up to 50`() {
        assertEquals(listOf(0, 5, 25, 50), listOf(0, 1, 5, 10).map(clickDamage::valueAt))
    }

    @Test
    fun `the flat click damage talent gives 1, 3, 5 and so on up to 19`() {
        val flat = TalentCatalog.find("CLICK_FLAT_DAMAGE")

        assertEquals(listOf(0, 1, 3, 5, 19), listOf(0, 1, 2, 3, 10).map(flat::valueAt))
    }

    @Test
    fun `the catalog has 3 grades of the 10 talents, grade N giving N times the value of grade 1`() {
        assertEquals(30, TalentCatalog.all.size)
        assertEquals(listOf(1, 2, 3), TalentCatalog.all.filter { it.baseId == "COMBO" }.map { it.grade })
        assertEquals(listOf("COMBO", "COMBO_G2", "COMBO_G3"), TalentCatalog.all.filter { it.baseId == "COMBO" }.map { it.id })
        assertEquals(listOf(50, 100, 150), listOf("COMBO", "COMBO_G2", "COMBO_G3").map { TalentCatalog.find(it).valueAt(10) })
        assertEquals(
            listOf(19, 38, 57),
            listOf("CLICK_FLAT_DAMAGE", "CLICK_FLAT_DAMAGE_G2", "CLICK_FLAT_DAMAGE_G3").map {
                TalentCatalog.find(it).valueAt(10)
            },
        )
    }

    @Test
    fun `a grade is locked until the previous grade is at level 10 and grade 1 is always open`() {
        val g2 = TalentCatalog.find("COMBO_G2")
        val g3 = TalentCatalog.find("COMBO_G3")

        assertEquals(listOf(true, false, false), listOf(combo, g2, g3).map { PlayerTalents("yan").unlocked(it) })
        assertEquals(false, PlayerTalents("yan", mapOf("COMBO" to 9)).unlocked(g2))
        assertEquals(true, PlayerTalents("yan", mapOf("COMBO" to 10)).unlocked(g2))
        assertEquals(false, PlayerTalents("yan", mapOf("COMBO" to 10)).unlocked(g3))
        assertEquals(true, PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_G2" to 10)).unlocked(g3))
    }

    @Test
    fun `a locked grade refuses the upgrade`() {
        assertFailsWith<TalentLockedException> {
            PlayerTalents("yan", mapOf("COMBO" to 9), earned = 50).upgrade(TalentCatalog.find("COMBO_G2"), 0, rules)
        }
    }

    @Test
    fun `a grade level costs its grade in points and the spent points add them up`() {
        val opened = PlayerTalents("yan", mapOf("COMBO" to 10), earned = 30)
        val upgrade = opened.upgrade(TalentCatalog.find("COMBO_G2"), 0, rules)

        assertEquals(2, upgrade.cost)
        assertEquals(2, opened.nextCost(TalentCatalog.find("COMBO_G2"), rules))
        assertEquals(TalentPoints(30, 12), upgrade.talents.points(rules))
        assertEquals(
            TalentPoints(30, 10 + 2 * 4 + 3 * 2),
            PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_G2" to 4, "COMBO_G3" to 2), earned = 30).points(rules),
        )
    }

    @Test
    fun `an unknown talent is not found`() {
        val e = assertFailsWith<TalentNotFoundException> { TalentCatalog.find("NOPE") }

        assertEquals("TALENT_NOT_FOUND", e.code)
    }

    @Test
    fun `a first clear pays no point for a phase, 2 for a miniboss and 5 for a chapter boss`() {
        assertEquals(0, rules.award(ProgressPosition(1, 1, Encounter.PHASE, 1)).points)
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

        assertEquals(List(30) { 0 }, TalentCatalog.all.map { talents.level(it.id) })
        assertEquals(List(10) { 1 } + List(10) { 2 } + List(10) { 3 }, TalentCatalog.all.map { talents.nextCost(it, rules) })
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
        assertEquals(25, clickDamage.valueAt(5))
        assertEquals(50, clickDamage.valueAt(10))
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
