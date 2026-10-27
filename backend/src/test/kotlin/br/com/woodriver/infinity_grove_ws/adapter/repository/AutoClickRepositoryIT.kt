package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AutoClickRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var autoClick: AutoClickRepository

    @Autowired
    private lateinit var crystals: CrystalRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    private fun rows(table: String) = jdbc.queryForObject("select count(*) from $table where username = 'yan'", Int::class.java)

    @Test
    fun `a player with no row is at level 0 with 0 crystals`() {
        assertEquals(0, autoClick.level("yan"))
        assertEquals(0L, crystals.balance("yan"))
    }

    @Test
    fun `save inserts the level and then updates it`() {
        autoClick.save("yan", 1)
        autoClick.save("yan", 3)

        assertEquals(3, autoClick.level("yan"))
        assertEquals(1, rows("player_auto_click"))
    }

    @Test
    fun `save inserts the crystals and then updates them`() {
        crystals.save("yan", 100)
        crystals.save("yan", 75)

        assertEquals(75L, crystals.balance("yan"))
        assertEquals(1, rows("player_crystals"))
    }

    @Test
    fun `each player reads only their own level and crystals`() {
        autoClick.save("other", 4)
        crystals.save("other", 500)

        assertEquals(0, autoClick.level("yan"))
        assertEquals(0L, crystals.balance("yan"))
        assertEquals(4, autoClick.level("other"))
        assertEquals(500L, crystals.balance("other"))
    }

    @Test
    fun `the rows go with the user`() {
        autoClick.save("yan", 2)
        crystals.save("yan", 10)

        jpaUserRepository.deleteById("yan")

        assertEquals(0, rows("player_auto_click"))
        assertEquals(0, rows("player_crystals"))
    }

    @Test
    fun `a row for an unknown player is refused`() {
        assertFailsWith<DataAccessException> { crystals.save("ghost", 1) }
    }

    @Test
    fun `a negative balance is refused`() {
        assertFailsWith<DataAccessException> { crystals.save("yan", -1) }
    }
}
