package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class EnemyRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: EnemyRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // the seeded enemies are shared with other integration tests; no seed reaches a physical defense of 80, so these rows are ours
    private val stats = EnemyStats(Element.WATER, 81, 82, 97)

    @AfterTest
    fun removeTestEnemies() {
        jdbc.update("delete from enemies where physical_defense >= 80")
    }

    private fun rowsWith(stats: EnemyStats) =
        jdbc.queryForObject(
            "select count(*) from enemies where element = ? and physical_defense = ? and magical_defense = ? and crit_resistance = ?",
            Int::class.java,
            stats.element.name,
            stats.physicalDefense,
            stats.magicalDefense,
            stats.critResistance,
        )

    @Test
    fun `the same stats twice return the same id and leave one row`() {
        val first = repository.idOf(stats)
        val second = repository.idOf(stats)

        assertEquals(first, second)
        assertEquals(1, rowsWith(stats))
    }

    @Test
    fun `stats differing in any one attribute return a new id`() {
        val id = repository.idOf(stats)
        val variants =
            listOf(
                stats.copy(element = Element.FIRE),
                stats.copy(physicalDefense = 83),
                stats.copy(magicalDefense = 84),
                stats.copy(critResistance = 98),
            )

        val ids = variants.map(repository::idOf)

        ids.forEach { assertNotEquals(id, it) }
        assertEquals(variants.size, ids.toSet().size)
        variants.forEach { assertEquals(1, rowsWith(it)) }
    }
}
