package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.HeroRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaHeroRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaHeroSkillRepository
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals

class HeroSeederIT : IntegrationTestBase() {
    @Autowired
    private lateinit var seeder: HeroSeeder

    @Autowired
    private lateinit var repository: HeroRepository

    @Autowired
    private lateinit var jpaHeroRepository: JpaHeroRepository

    @Autowired
    private lateinit var jpaHeroSkillRepository: JpaHeroSkillRepository

    private fun emptyCatalog() {
        jpaHeroSkillRepository.deleteAll()
        jpaHeroRepository.deleteAll()
    }

    // other integration tests play against the seeded catalog, so every test leaves it seeded again
    @AfterTest
    fun restoreSeed() {
        emptyCatalog()
        seeder.seed()
    }

    @Test
    fun `application start leaves the five seed heroes in catalog order`() {
        assertEquals(HeroSeed.heroes(), repository.findAll())
    }

    @Test
    fun `seeding an empty catalog creates the five heroes`() {
        emptyCatalog()

        seeder.seed()

        assertEquals(HeroSeed.heroes(), repository.findAll())
    }

    @Test
    fun `seeding again changes nothing and an edited hero survives`() {
        val edited = HeroSeed.heroes().first().copy(name = "Kael Editado")
        repository.save(edited, 0)

        seeder.seed()

        assertEquals("Kael Editado", repository.findById("kael")?.name)
        assertEquals(5, repository.findAll().size)
    }

    @Test
    fun `a missing hero is added without touching the others`() {
        jpaHeroSkillRepository.deleteAll(jpaHeroSkillRepository.findAllByHeroId("vex"))
        jpaHeroRepository.deleteById("vex")

        seeder.seed()

        assertEquals(HeroSeed.heroes(), repository.findAll())
    }
}
