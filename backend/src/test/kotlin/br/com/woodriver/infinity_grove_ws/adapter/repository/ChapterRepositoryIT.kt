package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ChapterRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: ChapterRepository

    // chapter 1 is the seeded one other tests play against, so these tests use their own number
    private val number = 90

    private fun chapter(
        bossHealth: Int = 321,
        stages: Int = 3,
    ) = ChapterDefinition(
        number,
        bossHealth = bossHealth,
        bossTimeLimitMs = 61_000,
        stages = (1..stages).map { StageDefinition(it, 4 + it, 20 + it, 100 + it, 31_000L + it) },
    )

    private fun clean() {
        jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(number))
        jpaChapterRepository.deleteById(number)
    }

    @BeforeTest
    fun cleanBefore() = jpaChapterRepository.findById(number).ifPresent { clean() }

    @AfterTest
    fun cleanAfter() = jpaChapterRepository.findById(number).ifPresent { clean() }

    @Test
    fun `a saved chapter reads back equal with every stage field in stage order`() {
        repository.save(chapter())

        assertEquals(chapter(), repository.findByNumber(number))
    }

    @Test
    fun `saving a chapter again replaces its values`() {
        repository.save(chapter(bossHealth = 321))

        repository.save(chapter(bossHealth = 999))

        assertEquals(999, repository.findByNumber(number)!!.bossHealth)
    }

    @Test
    fun `existsByNumber is false before the save and true after`() {
        assertFalse(repository.existsByNumber(number))

        repository.save(chapter())

        assertTrue(repository.existsByNumber(number))
    }

    @Test
    fun `an unknown chapter reads null`() {
        assertNull(repository.findByNumber(12345))
    }

    @Test
    fun `chapters do not mix their stages`() {
        repository.save(chapter(stages = 3))
        val other = ChapterDefinition(91, 5, 1000, listOf(StageDefinition(1, 1, 1, 1, 1000)))
        repository.save(other)

        try {
            assertEquals(3, repository.findByNumber(number)!!.stageCount)
            assertEquals(1, repository.findByNumber(91)!!.stageCount)
        } finally {
            jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(91))
            jpaChapterRepository.deleteById(91)
        }
    }
}
