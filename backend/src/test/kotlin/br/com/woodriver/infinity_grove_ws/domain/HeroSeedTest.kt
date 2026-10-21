package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class HeroSeedTest {
    private val heroes = HeroSeed.heroes()

    @Test
    fun `the seed has the five README heroes in README order with their elements`() {
        assertEquals(listOf("kael", "lyra", "orina", "seraphine", "vex"), heroes.map { it.id })
        assertEquals(
            listOf(Element.FIRE, Element.NATURE, Element.WATER, Element.LIGHT, Element.DARKNESS),
            heroes.map { it.element },
        )
        assertEquals(
            listOf("Guerreiro", "Arqueira", "Maga", "Clériga", "Assassino"),
            heroes.map { it.heroClass },
        )
    }

    @Test
    fun `Orina is the female mage that replaced Orin`() {
        val orina = heroes.single { it.id == "orina" }

        assertEquals("Orina Brumaestrela", orina.name)
        assertTrue(heroes.none { it.name.startsWith("Orin ") })
    }

    @Test
    fun `cooldowns match the README`() {
        val cooldowns = heroes.associate { hero -> hero.id to hero.skills.map { it.cooldownSeconds } }

        assertEquals(
            mapOf(
                "kael" to listOf(20, 25, 30),
                "lyra" to listOf(8, 30, 40),
                "orina" to listOf(18, 35, 45),
                "seraphine" to listOf(30, 25, 45),
                "vex" to listOf(15, 35, 20),
            ),
            cooldowns,
        )
    }

    @Test
    fun `skill names follow the README`() {
        assertEquals(
            listOf(
                "Corte Dimensional",
                "Investida do Baluarte",
                "Brado Aterrador",
                "Flecha Dupla",
                "Tiro Preciso",
                "Ventos Ligeiros",
                "Prisão de Espinhos",
                "Tempestade Arcana",
                "Chuva de Meteoros",
                "Bênção da Grande Árvore",
                "Luz Divina",
                "Carrilhão da Aurora",
                "Bomba de Veneno",
                "Bomba de Fumaça",
                "Golpe Sangrento",
            ),
            heroes.flatMap { hero -> hero.skills.map { it.name } },
        )
    }

    @Test
    fun `portraits are the position images and skills use the art of the spec`() {
        assertEquals(
            listOf("kael_position", "lyra_position", "orina_position", "seraphine_position", "vex_position"),
            heroes.map { it.portrait },
        )
        assertEquals(
            listOf(
                "kael_dimensional_cut",
                "kael_charge",
                "kael_screen",
                "lyra_double_shot",
                "lyra_focused_shot",
                "lyra_rapid_wind",
                "orina_grasp_prision",
                "orina_tempest",
                "orina_meteor_storm",
                "seraphine_blessing",
                "seraphine_holy_light",
                "seraphine_bell_ringing",
                "vex_poison_bomb",
                "vex_smoke_bomb",
                "vex_bleeding_blow",
            ),
            heroes.flatMap { hero -> hero.skills.map { it.image } },
        )
    }

    @Test
    fun `Lyra leads with a double critical click`() {
        assertEquals("30% de chance de executar um clique duplo crítico.", heroes.first { it.id == "lyra" }.leaderBonus)
    }

    @Test
    fun `every hero has a leader bonus and every skill a type and an effect`() {
        assertTrue(heroes.all { it.leaderBonus.isNotBlank() })
        assertTrue(heroes.flatMap { it.skills }.all { it.type.isNotBlank() && it.effect.isNotBlank() })
    }
}
