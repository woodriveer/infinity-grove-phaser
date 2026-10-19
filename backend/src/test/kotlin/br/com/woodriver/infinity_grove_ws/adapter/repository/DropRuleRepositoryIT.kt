package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class DropRuleRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: DropRuleRepository

    @Autowired
    private lateinit var jpaDropRuleRepository: JpaDropRuleRepository

    // the seeded rules are shared with other integration tests, so these tests use their own ids and clean them up
    private val first = DropRule(901, 7, 9, 2_500)
    private val second = DropRule(902, 40, 80, 1_000)

    @AfterTest
    fun removeTestRules() {
        jpaDropRuleRepository.deleteAllById(listOf(first.id, second.id).filter(jpaDropRuleRepository::existsById))
    }

    @Test
    fun `saved rules are returned by findAll with their values, ordered by id`() {
        repository.save(second)
        repository.save(first)

        val rules = repository.findAll().rules

        assertEquals(listOf(first, second), rules.filter { it.id >= first.id })
        assertEquals(rules.map { it.id }.sorted(), rules.map { it.id })
    }

    @Test
    fun `existsById is false before the save and true after`() {
        assertFalse(repository.existsById(first.id))

        repository.save(first)

        assertTrue(repository.existsById(first.id))
        assertFalse(repository.existsById(second.id))
    }
}
