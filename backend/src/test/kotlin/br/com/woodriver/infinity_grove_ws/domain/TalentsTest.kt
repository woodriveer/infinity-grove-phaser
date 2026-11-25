package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class TalentsTest {
    private val rules = TalentRules()
    private val clickDamage = TalentCatalog.find("CLICK_DAMAGE")
    private val combo = TalentCatalog.find("COMBO")
    private val fury = TalentCatalog.find("COMBO_FURY")

    @Test
    fun `the grade 1 block has the 9 graded talents with BOSS_DAMAGE and ARMOR_PIERCE in place of the retired ones`() {
        assertEquals(
            listOf(
                Triple("MINIBOSS_TIME", TalentBranch.TIME, 2),
                Triple("BOSS_DAMAGE", TalentBranch.TIME, 2),
                Triple("PHYSICAL_BREAK", TalentBranch.BREAK, 1),
                Triple("ARMOR_PIERCE", TalentBranch.BREAK, 1),
                Triple("CLICK_DAMAGE", TalentBranch.POWER, 5),
                Triple("CRIT_CHANCE", TalentBranch.POWER, 5),
                Triple("CRIT_DAMAGE", TalentBranch.POWER, 15),
                Triple("COMBO", TalentBranch.COMBO, 5),
                Triple("CLICK_FLAT_DAMAGE", TalentBranch.POWER, 1),
            ),
            TalentCatalog.all.take(9).map { Triple(it.id, it.branch, it.perLevel) },
        )
        assertEquals(List(27) { 10 } + 4, TalentCatalog.all.map { it.maxLevel })
    }

    @Test
    fun `the grade 1 units are s, %, points, %, %, points, %, %, dmg and Fúria crescente reads combo-step`() {
        assertEquals(
            listOf("s", "%", "points", "%", "%", "points", "%", "%", "dmg"),
            TalentCatalog.all.take(9).map { it.unit },
        )
        assertEquals("combo-step", TalentCatalog.find("COMBO_FURY").unit)
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
    fun `the flat click damage talent gives 1 a level up to 10`() {
        val flat = TalentCatalog.find("CLICK_FLAT_DAMAGE")

        assertEquals(listOf(0, 1, 2, 3, 10), listOf(0, 1, 2, 3, 10).map(flat::valueAt))
    }

    @Test
    fun `grade 2 and 3 of the flat click damage give 2 and 3 a level`() {
        val g2 = TalentCatalog.find("CLICK_FLAT_DAMAGE_G2")
        val g3 = TalentCatalog.find("CLICK_FLAT_DAMAGE_G3")

        assertEquals(listOf(2, 10), listOf(1, 5).map(g2::valueAt))
        assertEquals(listOf(3, 21), listOf(1, 7).map(g3::valueAt))
    }

    @Test
    fun `the critical chance talent gives 5 points a level, 50, 100 and 150 at level 10 of its grades`() {
        assertEquals(5, TalentCatalog.find("CRIT_CHANCE").valueAt(1))
        assertEquals(
            listOf(50, 100, 150),
            listOf("CRIT_CHANCE", "CRIT_CHANCE_G2", "CRIT_CHANCE_G3").map { TalentCatalog.find(it).valueAt(10) },
        )
    }

    @Test
    fun `the critical damage talent gives 15 percent a level, 150, 300 and 450 at level 10 of its grades`() {
        assertEquals(15, TalentCatalog.find("CRIT_DAMAGE").valueAt(1))
        assertEquals(
            listOf(150, 300, 450),
            listOf("CRIT_DAMAGE", "CRIT_DAMAGE_G2", "CRIT_DAMAGE_G3").map { TalentCatalog.find(it).valueAt(10) },
        )
    }

    @Test
    fun `the points of a first clear stay 2 for a miniboss and 5 for a chapter boss`() {
        assertEquals(2, rules.pointsPerMiniboss)
        assertEquals(5, rules.pointsPerChapterBoss)
        assertEquals(0, rules.pointsPerPhase)
    }

    @Test
    fun `the catalog has 3 grades of the 9 talents and Fúria crescente make 28`() {
        assertEquals(28, TalentCatalog.all.size)
        assertEquals(listOf(1, 2, 3), TalentCatalog.all.filter { it.baseId == "COMBO" }.map { it.grade })
        assertEquals(listOf("COMBO", "COMBO_G2", "COMBO_G3"), TalentCatalog.all.filter { it.baseId == "COMBO" }.map { it.id })
        assertEquals(listOf(50, 100, 150), listOf("COMBO", "COMBO_G2", "COMBO_G3").map { TalentCatalog.find(it).valueAt(10) })
        assertEquals(
            listOf(10, 20, 30),
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
    fun `a new player has level 0 and 0 points and every next cost is its grade, 2 for Fúria crescente`() {
        val talents = PlayerTalents("yan")

        assertEquals(List(28) { 0 }, TalentCatalog.all.map { talents.level(it.id) })
        assertEquals(List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 2, TalentCatalog.all.map { talents.nextCost(it, rules) })
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
        assertEquals(8, TalentCatalog.find("BOSS_DAMAGE").valueAt(4))
        assertEquals(90, TalentCatalog.find("CRIT_DAMAGE").valueAt(6))
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
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("MAGICAL_BREAK" to 1)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 0)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("CLICK_DAMAGE" to 11)) }
        assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", earned = -1) }
    }

    @Test
    fun `the defense break is one talent labelled Quebra de defesa in each grade`() {
        val grades = listOf("PHYSICAL_BREAK", "PHYSICAL_BREAK_G2", "PHYSICAL_BREAK_G3").map(TalentCatalog::find)

        assertEquals(List(3) { "Quebra de defesa" }, grades.map { it.label })
        assertEquals(List(3) { TalentBranch.BREAK }, grades.map { it.branch })
        assertEquals(List(3) { "points" }, grades.map { it.unit })
        assertEquals(listOf(1, 2, 3), grades.map { it.perLevel })
    }

    @Test
    fun `the magical defense break is not in the catalog`() {
        assertFailsWith<TalentNotFoundException> { TalentCatalog.find("MAGICAL_BREAK") }
        assertFailsWith<TalentNotFoundException> { TalentCatalog.find("MAGICAL_BREAK_G2") }
        assertFailsWith<TalentNotFoundException> { TalentCatalog.find("MAGICAL_BREAK_G3") }
        assertTrue(TalentCatalog.all.none { it.id.startsWith("MAGICAL") })
    }

    @Test
    fun `fromStored leaves out a level outside the catalog and spends no point on it`() {
        val talents = PlayerTalents.fromStored("yan", mapOf("PHYSICAL_BREAK" to 3, "MAGICAL_BREAK" to 5), 20)

        assertEquals(mapOf("PHYSICAL_BREAK" to 3), talents.levels)
        assertEquals(TalentPoints(20, 3), talents.points(rules))
        assertEquals(17, talents.points(rules).available)
    }

    @Test
    fun `fromStored leaves out every grade of the magical break`() {
        val talents = PlayerTalents.fromStored("yan", mapOf("MAGICAL_BREAK" to 10, "MAGICAL_BREAK_G2" to 3, "CLICK_DAMAGE" to 2), 30)

        assertEquals(mapOf("CLICK_DAMAGE" to 2), talents.levels)
        assertEquals(28, talents.points(rules).available)
    }

    @Test
    fun `fromStored keeps every catalog level`() {
        assertEquals(
            PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_G2" to 4), 30),
            PlayerTalents.fromStored("yan", mapOf("COMBO" to 10, "COMBO_G2" to 4), 30),
        )
    }

    @Test
    fun `the boss damage chain is labelled Dano contra chefes and gives 20, 40 and 60 at level 10`() {
        val boss = TalentCatalog.find("BOSS_DAMAGE")

        assertEquals(TalentBranch.TIME, boss.branch)
        assertEquals("Dano contra chefes", boss.label)
        assertEquals("%", boss.unit)
        assertEquals(
            listOf(20, 40, 60),
            listOf("BOSS_DAMAGE", "BOSS_DAMAGE_G2", "BOSS_DAMAGE_G3").map { TalentCatalog.find(it).valueAt(10) },
        )
    }

    @Test
    fun `the armor pierce chain is labelled Perfuração de armadura and gives 10, 20 and 30 at level 10`() {
        val pierce = TalentCatalog.find("ARMOR_PIERCE")

        assertEquals(TalentBranch.BREAK, pierce.branch)
        assertEquals("Perfuração de armadura", pierce.label)
        assertEquals("%", pierce.unit)
        assertEquals(
            listOf(10, 20, 30),
            listOf("ARMOR_PIERCE", "ARMOR_PIERCE_G2", "ARMOR_PIERCE_G3").map { TalentCatalog.find(it).valueAt(10) },
        )
    }

    @Test
    fun `the retired chapter boss time and critical resistance break are not in the catalog`() {
        listOf(
            "BOSS_TIME",
            "BOSS_TIME_G2",
            "BOSS_TIME_G3",
            "CRIT_RESIST_BREAK",
            "CRIT_RESIST_BREAK_G2",
            "CRIT_RESIST_BREAK_G3",
        ).forEach { id -> assertFailsWith<TalentNotFoundException> { TalentCatalog.find(id) } }
    }

    @Test
    fun `Fúria crescente is one COMBO talent of 1 a level up to 4, last in the catalog`() {
        assertEquals("COMBO_FURY", TalentCatalog.all.last().id)
        assertEquals(TalentBranch.COMBO, fury.branch)
        assertEquals("Fúria crescente", fury.label)
        assertEquals(4, fury.maxLevel)
        assertEquals(1, fury.grade)
        assertEquals("COMBO_FURY", fury.baseId)
        assertEquals(listOf(0, 1, 4), listOf(0, 1, 4).map(fury::valueAt))
        assertEquals(1, TalentCatalog.all.count { it.baseId == "COMBO_FURY" })
    }

    @Test
    fun `Fúria crescente opens at level 10 of COMBO`() {
        assertEquals(false, PlayerTalents("yan").unlocked(fury))
        assertEquals(false, PlayerTalents("yan", mapOf("COMBO" to 9)).unlocked(fury))
        assertEquals(true, PlayerTalents("yan", mapOf("COMBO" to 10)).unlocked(fury))
    }

    @Test
    fun `a locked Fúria crescente refuses the upgrade`() {
        assertFailsWith<TalentLockedException> {
            PlayerTalents("yan", mapOf("COMBO" to 9), earned = 20).upgrade(fury, 0, rules)
        }
    }

    @Test
    fun `a level of Fúria crescente costs 2 points`() {
        val upgrade = PlayerTalents("yan", mapOf("COMBO" to 10), earned = 12).upgrade(fury, 0, rules)

        assertEquals(2, upgrade.cost)
        assertEquals(1, upgrade.talents.level("COMBO_FURY"))
        assertEquals(TalentPoints(12, 12), upgrade.talents.points(rules))
    }

    @Test
    fun `Fúria crescente at level 4 refuses the upgrade as max level and has no next cost`() {
        val top = PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_FURY" to 4), earned = 30)

        assertFailsWith<TalentMaxLevelException> { top.upgrade(fury, 4, rules) }
        assertNull(top.nextCost(fury, rules))
        assertEquals(2, PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_FURY" to 3), earned = 30).nextCost(fury, rules))
    }

    @Test
    fun `a seen level of Fúria crescente must be from 0 to 4`() {
        assertEquals(4, fury.requireSeenLevel(4))

        listOf(5, -1).forEach { level ->
            val e = assertFailsWith<TalentRequestException> { fury.requireSeenLevel(level) }
            assertEquals("fromLevel must be an integer between 0 and 4", e.message)
        }
    }

    @Test
    fun `every prerequisite is a talent of the catalog`() {
        TalentCatalog.all.mapNotNull { it.prerequisiteId }.forEach { TalentCatalog.find(it) }

        assertNull(TalentCatalog.find("BOSS_DAMAGE").prerequisiteId)
        assertEquals("BOSS_DAMAGE", TalentCatalog.find("BOSS_DAMAGE_G2").prerequisiteId)
        assertEquals("BOSS_DAMAGE_G2", TalentCatalog.find("BOSS_DAMAGE_G3").prerequisiteId)
        assertEquals("COMBO", fury.prerequisiteId)
    }

    @Test
    fun `a talent with a prerequisite of its own must have one grade`() {
        assertFailsWith<IllegalArgumentException> {
            TalentDefinition("X", TalentBranch.COMBO, "X", "%", 1, grade = 2, requires = "COMBO")
        }
    }

    @Test
    fun `fromStored leaves out every grade of the retired chapter boss time and critical resistance break`() {
        val talents =
            PlayerTalents.fromStored(
                "yan",
                mapOf("BOSS_TIME" to 10, "BOSS_TIME_G2" to 2, "CRIT_RESIST_BREAK" to 4, "CRIT_RESIST_BREAK_G3" to 1, "COMBO" to 3),
                30,
            )

        assertEquals(mapOf("COMBO" to 3), talents.levels)
        assertEquals(TalentPoints(30, 3), talents.points(rules))
    }
}
