package br.com.woodriver.infinity_grove_ws.domain

import tools.jackson.module.kotlin.jacksonObjectMapper
import tools.jackson.module.kotlin.readValue
import kotlin.test.Test
import kotlin.test.assertEquals

class ClickPowerTest {
    private val cases: List<Map<String, Any?>> =
        jacksonObjectMapper().readValue(ClickPowerTest::class.java.getResource("/ranking/click-power-cases.json")!!.readText())

    @Suppress("UNCHECKED_CAST")
    private fun member(
        case: String,
        raw: Map<String, Any?>,
    ): ClickPower.Member {
        val heroId = raw["heroId"] as String
        val pieces =
            (raw["pieces"] as List<Map<String, Any?>>).mapIndexed { index, piece ->
                val pct = piece["clickDamagePct"] as Int?
                Piece(
                    id = "$case-$heroId-$index",
                    username = "ana",
                    slot = Slot.valueOf(piece["slot"] as String),
                    rarity = Rarity.LEGENDARY,
                    baseClick = piece["click"] as Int?,
                    refine = 0,
                    affixes = if (pct != null) listOf(Affix(AffixType.CLICK_DAMAGE_PCT, pct)) else emptyList(),
                    heroId = heroId,
                )
            }
        return ClickPower.Member(heroId, raw["stars"] as Int, pieces)
    }

    private fun weapon(
        base: Int,
        refine: Int = 0,
    ) = Piece("w", "ana", Slot.WEAPON, Rarity.LEGENDARY, base, refine, emptyList(), "kael")

    private fun ring(
        base: Int,
        refine: Int = 0,
    ) = Piece("r", "ana", Slot.RING, Rarity.LEGENDARY, null, refine, listOf(Affix(AffixType.CLICK_DAMAGE_PCT, base)), "kael")

    private fun at(
        chapter: Int,
        completed: Boolean = false,
    ) = Progress("ana", ProgressPosition(chapter, 1, Encounter.PHASE, 1), completed)

    @Suppress("UNCHECKED_CAST")
    @Test
    fun `the shared fixture gives 1, 16_5, 41, 33, 131_75 and 241`() {
        assertEquals(6, cases.size)

        cases.forEach { case ->
            val name = case["name"] as String
            val allies = (case["allies"] as List<Map<String, Any?>>).map { member(name, it) }
            val power =
                ClickPower.of(
                    leader = member(name, case["leader"] as Map<String, Any?>),
                    allies = allies,
                    talentLevels = (case["talentLevels"] as Map<String, Int>),
                    teamActive = ClickPower.teamActive(at(case["chapter"] as Int, case["completed"] as Boolean)),
                )

            assertEquals((case["expected"] as Number).toDouble(), power, 1e-9, name)
        }
    }

    @Test
    fun `refined values count - a weapon of base 5 at +2 and a ring of base 7 at +3 give 7_63`() {
        val leader = ClickPower.Member("kael", 0, listOf(weapon(5, refine = 2), ring(7, refine = 3)))

        assertEquals(7.63, ClickPower.of(leader, emptyList(), emptyMap(), teamActive = false), 1e-9)
    }

    @Test
    fun `talent grades add up and unknown ids add nothing`() {
        val levels = mapOf("CLICK_DAMAGE" to 10, "CLICK_DAMAGE_G2" to 2, "NOPE" to 5)

        assertEquals(70, ClickPower.talentValue(levels, "CLICK_DAMAGE"))
    }

    @Test
    fun `only the bought slots are allies, in slot order`() {
        assertEquals(listOf("lyra"), ClickPower.allies(Team(2, listOf("lyra", null, null, null))))
        assertEquals(listOf("lyra", "orina", "vex"), ClickPower.allies(Team(3, listOf("lyra", "orina", "vex", null))))
    }

    @Test
    fun `the team is active from chapter 5 and when completed`() {
        assertEquals(false, ClickPower.teamActive(at(4)))
        assertEquals(true, ClickPower.teamActive(at(5)))
        assertEquals(true, ClickPower.teamActive(at(3, completed = true)))
    }

    @Test
    fun `a star count outside 0 to 9 reads 0 percent for the leader and x2 for an ally`() {
        assertEquals(1.0, ClickPower.of(ClickPower.Member("kael", 12, emptyList()), emptyList(), emptyMap(), teamActive = false), 1e-9)
        assertEquals(
            3.0,
            ClickPower.of(
                ClickPower.Member("kael", 0, emptyList()),
                listOf(ClickPower.Member("lyra", 12, emptyList())),
                emptyMap(),
                teamActive = false,
            ),
            1e-9,
        )
    }

    @Test
    fun `Seraphine lifts the team only while it is active`() {
        val leader = ClickPower.Member("kael", 0, emptyList())
        val lyra = ClickPower.Member("lyra", 2, listOf(Piece("lw", "ana", Slot.WEAPON, Rarity.LEGENDARY, 4, 0, emptyList(), "lyra")))
        val seraphine = ClickPower.Member("seraphine", 0, emptyList())

        assertEquals(41.0, ClickPower.of(leader, listOf(lyra, seraphine), emptyMap(), teamActive = true), 1e-9)
        assertEquals(33.0, ClickPower.of(leader, listOf(lyra, seraphine), emptyMap(), teamActive = false), 1e-9)
        assertEquals(31.0, ClickPower.of(leader, listOf(lyra), emptyMap(), teamActive = true), 1e-9)
    }
}
