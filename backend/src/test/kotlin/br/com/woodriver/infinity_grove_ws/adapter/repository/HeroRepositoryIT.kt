package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.domain.Skill
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class HeroRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: HeroRepository

    @Autowired
    private lateinit var jpaHeroRepository: JpaHeroRepository

    @Autowired
    private lateinit var jpaHeroSkillRepository: JpaHeroSkillRepository

    // the seeded catalog is shared with other integration tests, so these tests use their own ids and clean them up
    private fun hero(id: String) =
        Hero(
            id = id,
            name = "Hero $id",
            heroClass = "Mago",
            element = Element.LIGHT,
            leaderBonus = "Bonus $id",
            portrait = "portrait_$id",
            skills = (1..3).map { Skill(it, "Skill $id $it", "Tipo", "Efeito $id $it", 10 * it, "image_${id}_$it") },
        )

    @AfterTest
    fun removeTestHeroes() {
        jpaHeroSkillRepository.deleteAll(jpaHeroSkillRepository.findAll().filter { it.heroId.startsWith("test-") })
        jpaHeroRepository.deleteAll(jpaHeroRepository.findAll().filter { it.id.startsWith("test-") })
    }

    @Test
    fun `a saved hero is read back equal with its skills in slot order`() {
        repository.save(hero("test-a"), 90)

        assertEquals(hero("test-a"), repository.findById("test-a"))
    }

    @Test
    fun `an unknown id has no hero`() {
        assertNull(repository.findById("test-ghost"))
        assertFalse(repository.existsById("test-ghost"))
    }

    @Test
    fun `a saved hero exists`() {
        repository.save(hero("test-a"), 90)

        assertTrue(repository.existsById("test-a"))
    }

    @Test
    fun `the catalog is returned in the saved order`() {
        repository.save(hero("test-b"), 92)
        repository.save(hero("test-a"), 91)

        val ours = repository.findAll().filter { it.id.startsWith("test-") }

        assertEquals(listOf(hero("test-a"), hero("test-b")), ours)
    }

    @Test
    fun `saving a hero again replaces its fields`() {
        repository.save(hero("test-a"), 90)
        repository.save(hero("test-a").copy(name = "Renamed"), 90)

        assertEquals("Renamed", repository.findById("test-a")?.name)
        assertEquals(1, repository.findAll().count { it.id == "test-a" })
    }
}
