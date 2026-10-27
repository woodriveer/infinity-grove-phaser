package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ResetRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var resets: ResetRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    private fun rows() = jdbc.queryForObject("select count(*) from player_resets where username = 'yan'", Int::class.java)

    @Test
    fun `a player with no row never reset`() {
        assertEquals(0, resets.count("yan"))
    }

    @Test
    fun `save inserts the count and then updates it`() {
        resets.save("yan", 1)
        resets.save("yan", 2)

        assertEquals(2, resets.count("yan"))
        assertEquals(1, rows())
    }

    @Test
    fun `each player reads only their own count`() {
        resets.save("other", 7)

        assertEquals(0, resets.count("yan"))
        assertEquals(7, resets.count("other"))
    }

    @Test
    fun `the row goes with the user`() {
        resets.save("yan", 1)

        jpaUserRepository.deleteById("yan")

        assertEquals(0, rows())
    }

    @Test
    fun `a count under 1 is refused`() {
        assertFailsWith<DataAccessException> { resets.save("yan", 0) }
    }
}
