package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.ChapterRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.DropRuleRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaDropRuleRepository
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ChapterSeederIT : IntegrationTestBase() {
    @Autowired
    private lateinit var seeder: ChapterSeeder

    @Autowired
    private lateinit var repository: ChapterRepository

    @Autowired
    private lateinit var dropRules: DropRuleRepository

    @Autowired
    private lateinit var jpaDropRules: JpaDropRuleRepository

    private fun seedRules() = dropRules.findAll().rules.filter { it.id in 1..15 }

    // other integration tests play against the seeded chapter 1, so every test leaves it seeded again
    @AfterTest
    fun restoreSeed() {
        jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(1))
        jpaChapterRepository.deleteById(1)
        removeChapter(6)
        removeChapter(7)
        dropRules.save(ChapterDefinition.dropRules(1)[1])
        seeder.seed()
    }

    /** Removes chapter [number] with its stages, if it is stored. */
    private fun removeChapter(number: Int) {
        jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(number))
        if (jpaChapterRepository.existsById(number)) jpaChapterRepository.deleteById(number)
    }

    @Test
    fun `application start leaves chapter 1 with the seed values`() {
        assertEquals(ChapterDefinition.first(), repository.findByNumber(1))
    }

    @Test
    fun `seeding an empty database creates chapter 1 with its 10 stages`() {
        jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(1))
        jpaChapterRepository.deleteById(1)

        seeder.seed()

        assertEquals(ChapterDefinition.first(), repository.findByNumber(1))
    }

    @Test
    fun `application start seeds chapters 1 to 15`() {
        (1..15).forEach { assertEquals(ChapterDefinition.of(it), repository.findByNumber(it)) }
        assertEquals(524_288_000L, repository.findByNumber(15)!!.bossHealth)
        assertEquals(3_112_960L, repository.findByNumber(10)!!.stage(10).minibossHealth)
        val rules = dropRules.findAll()
        assertTrue((1..45).all { rules.ruleFor(it) != null })
        assertEquals(DropRule(45, 10_560, 24_640, 1500), rules.ruleFor(45))
    }

    @Test
    fun `seeding again keeps values edited in the database`() {
        val edited = ChapterDefinition.first().copy(bossHealth = 1234)
        repository.save(edited)

        seeder.seed()

        assertEquals(1234L, repository.findByNumber(1)!!.bossHealth)
    }

    @Test
    fun `application start stores the 15 seed drop rules with the spec values`() {
        val expected =
            listOf(
                DropRule(1, 2, 6, 1500),
                DropRule(2, 8, 20, 1500),
                DropRule(3, 30, 70, 1500),
                DropRule(4, 4, 12, 1500),
                DropRule(5, 16, 40, 1500),
                DropRule(6, 60, 140, 1500),
                DropRule(7, 8, 24, 1500),
                DropRule(8, 32, 80, 1500),
                DropRule(9, 120, 280, 1500),
                DropRule(10, 16, 48, 1500),
                DropRule(11, 64, 160, 1500),
                DropRule(12, 240, 560, 1500),
                DropRule(13, 32, 96, 1500),
                DropRule(14, 128, 320, 1500),
                DropRule(15, 480, 1120, 1500),
            )

        assertEquals(expected, seedRules())
    }

    @Test
    fun `seeding again inserts no drop rule and keeps a range changed in the database`() {
        dropRules.save(DropRule(2, 7, 8, 1500))
        val before = dropRules.findAll().rules

        seeder.seed()

        assertEquals(before, dropRules.findAll().rules)
        assertEquals(DropRule(2, 7, 8, 1500), dropRules.findAll().ruleFor(2))
    }

    @Test
    fun `a missing chapter from 6 to 15 is seeded on start with its stages and drop rules`() {
        removeChapter(6)
        (16..18).forEach { jpaDropRules.deleteById(it) }

        seeder.seed()

        assertEquals(ChapterDefinition.of(6), repository.findByNumber(6))
        assertEquals(10, jpaStageRepository.findAllByChapterOrderByNumber(6).size)
        assertEquals(DropRule(16, 64, 192, 1500), dropRules.findAll().ruleFor(16))
        assertEquals(DropRule(17, 256, 640, 1500), dropRules.findAll().ruleFor(17))
        assertEquals(DropRule(18, 960, 2240, 1500), dropRules.findAll().ruleFor(18))
    }

    @Test
    fun `a chapter from 6 to 15 stored by hand is left unchanged on start`() {
        val handMade = ChapterDefinition.of(7).copy(bossHealth = 1_234L)
        repository.save(handMade)

        seeder.seed()

        assertEquals(handMade, repository.findByNumber(7))
    }
}
