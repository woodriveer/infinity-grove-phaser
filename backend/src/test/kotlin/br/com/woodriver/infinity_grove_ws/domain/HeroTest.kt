package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class HeroTest {
    private fun skill(
        slot: Int,
        cooldownSeconds: Int = 10,
        name: String = "Skill $slot",
    ) = Skill(slot, name, "Ataque", "Effect", cooldownSeconds, "image_$slot")

    private fun hero(
        skills: List<Skill> = listOf(skill(1), skill(2), skill(3)),
        id: String = "kael",
        name: String = "Kael",
    ) = Hero(id, name, "Guerreiro", Element.FIRE, "Bonus", "kael_position", skills)

    @Test
    fun `a hero with one skill per slot keeps them in slot order`() {
        val hero = hero()

        assertEquals(listOf(1, 2, 3), hero.skills.map { it.slot })
    }

    @Test
    fun `a hero without exactly three skills is rejected`() {
        assertFailsWith<IllegalArgumentException> { hero(skills = listOf(skill(1), skill(2))) }
        assertFailsWith<IllegalArgumentException> { hero(skills = listOf(skill(1), skill(2), skill(3), skill(1))) }
    }

    @Test
    fun `a hero with a repeated slot or skills out of order is rejected`() {
        assertFailsWith<IllegalArgumentException> { hero(skills = listOf(skill(1), skill(1), skill(3))) }
        assertFailsWith<IllegalArgumentException> { hero(skills = listOf(skill(2), skill(1), skill(3))) }
    }

    @Test
    fun `a skill slot outside 1 to 3 is rejected`() {
        assertFailsWith<IllegalArgumentException> { skill(0) }
        assertFailsWith<IllegalArgumentException> { skill(4) }
    }

    @Test
    fun `a skill cooldown below one second is rejected`() {
        assertFailsWith<IllegalArgumentException> { skill(1, cooldownSeconds = 0) }
        assertEquals(1, skill(1, cooldownSeconds = 1).cooldownSeconds)
    }

    @Test
    fun `a blank hero or skill name is rejected`() {
        assertFailsWith<IllegalArgumentException> { hero(name = " ") }
        assertFailsWith<IllegalArgumentException> { hero(id = "") }
        assertFailsWith<IllegalArgumentException> { skill(1, name = "") }
    }
}
