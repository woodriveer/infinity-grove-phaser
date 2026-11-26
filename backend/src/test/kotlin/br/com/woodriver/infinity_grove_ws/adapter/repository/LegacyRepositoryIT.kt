package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class LegacyRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var legacies: LegacyRepository

    @Autowired
    private lateinit var resets: ResetRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    private fun rows(username: String = "yan") =
        jdbc.queryForObject("select count(*) from player_legacy where username = ?", Int::class.java, username)

    @Test
    fun `a player without rows has an empty legacy`() {
        assertEquals(ResetLegacy("yan"), legacies.find("yan"))
        assertTrue(legacies.find("yan").percents.isEmpty())
    }

    @Test
    fun `a saved legacy reads back`() {
        legacies.save(ResetLegacy("yan", mapOf(5 to 100, 10 to 50)))

        assertEquals(mapOf(5 to 100, 10 to 50), legacies.find("yan").percents)
        assertTrue(legacies.find("other").percents.isEmpty())
    }

    @Test
    fun `saving a raised chapter updates its row`() {
        legacies.save(ResetLegacy("yan", mapOf(5 to 50)))
        legacies.save(ResetLegacy("yan", mapOf(5 to 100)))

        assertEquals(1, rows())
        assertEquals(100, jdbc.queryForObject("select percent from player_legacy where username = 'yan' and chapter = 5", Int::class.java))
    }

    @Test
    fun `a user deleted takes its legacy rows with it`() {
        legacies.save(ResetLegacy("yan", mapOf(5 to 100, 10 to 50)))

        jpaUserRepository.deleteById("yan")

        assertEquals(0, rows())
    }

    @Test
    fun `the table refuses percent 75 and chapter 16`() {
        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("insert into player_legacy (username, chapter, percent) values ('yan', 5, 75)")
        }
        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("insert into player_legacy (username, chapter, percent) values ('yan', 16, 50)")
        }
    }

    @Test
    fun `players with resets before the migration have no legacy rows`() {
        resets.save("yan", 3)

        assertEquals(3, resets.count("yan"))
        assertTrue(legacies.find("yan").percents.isEmpty())
        assertEquals(0, rows())
    }
}
