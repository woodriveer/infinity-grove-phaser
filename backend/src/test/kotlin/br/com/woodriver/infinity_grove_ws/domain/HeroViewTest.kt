package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class HeroViewTest {
    @Test
    fun `a locked skill is level 0`() {
        assertEquals(0, SkillView.levelOf(0, 1))
        assertEquals(0, SkillView.levelOf(1, 2))
        assertEquals(0, SkillView.levelOf(2, 3))
        assertEquals(0, SkillView.levelOf(0, 3))
    }

    @Test
    fun `an unlocked skill of a hero with 1 to 3 stars is level 1`() {
        assertEquals(1, SkillView.levelOf(1, 1))
        assertEquals(1, SkillView.levelOf(2, 1))
        assertEquals(1, SkillView.levelOf(2, 2))
        assertEquals(1, SkillView.levelOf(3, 1))
        assertEquals(1, SkillView.levelOf(3, 2))
        assertEquals(1, SkillView.levelOf(3, 3))
    }

    @Test
    fun `each star from 4 to 9 raises one skill in slot order`() {
        val levelsByStars =
            mapOf(
                4 to listOf(2, 1, 1),
                5 to listOf(2, 2, 1),
                6 to listOf(2, 2, 2),
                7 to listOf(3, 2, 2),
                8 to listOf(3, 3, 2),
                9 to listOf(3, 3, 3),
            )

        levelsByStars.forEach { (stars, levels) ->
            assertEquals(levels, (1..3).map { SkillView.levelOf(stars, it) })
        }
    }

    @Test
    fun `the view of a 5 star hero carries levels 2, 2 and 1`() {
        val kael = HeroSeed.heroes().first { it.id == "kael" }

        val view = HeroView.of(kael, PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 5) to 1)))

        assertEquals(listOf(2, 2, 1), view.skills.map { it.level })
        assertEquals(listOf(true, true, true), view.skills.map { it.unlocked })
    }
}
