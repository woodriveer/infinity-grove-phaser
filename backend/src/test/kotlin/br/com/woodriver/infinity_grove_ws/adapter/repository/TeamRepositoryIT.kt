package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.Team
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TeamRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var teams: TeamRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    private fun rows() = jdbc.queryForObject("select count(*) from player_team where username = 'yan'", Int::class.java)

    private fun insert(
        username: String,
        boughtSlots: Int,
        ally1: String? = null,
        ally2: String? = null,
        ally3: String? = null,
        ally4: String? = null,
    ) = jdbc.update(
        "insert into player_team (username, bought_slots, ally_1, ally_2, ally_3, ally_4) values (?, ?, ?, ?, ?, ?)",
        username,
        boughtSlots,
        ally1,
        ally2,
        ally3,
        ally4,
    )

    @Test
    fun `a player with no row has no bought slot and no ally`() {
        assertEquals(Team(), teams.find("yan"))
    }

    @Test
    fun `save inserts the team and then updates it`() {
        teams.save("yan", Team(1, listOf("lyra", null, null, null)))
        teams.save("yan", Team(2, listOf("lyra", "orina", null, null)))

        assertEquals(Team(2, listOf("lyra", "orina", null, null)), teams.find("yan"))
        assertEquals(1, rows())
    }

    @Test
    fun `a swap of two allies is stored`() {
        teams.save("yan", Team(2, listOf("lyra", "orina", null, null)))
        teams.save("yan", Team(2, listOf("orina", "lyra", null, null)))

        assertEquals(Team(2, listOf("orina", "lyra", null, null)), teams.find("yan"))
    }

    @Test
    fun `each player reads only their own team`() {
        val other = Team(1, listOf("lyra", null, null, null))
        teams.save("other", other)

        assertEquals(Team(), teams.find("yan"))
        assertEquals(other, teams.find("other"))
    }

    @Test
    fun `the row goes with the user`() {
        teams.save("yan", Team(1, listOf("lyra", null, null, null)))

        jpaUserRepository.deleteById("yan")

        assertEquals(0, rows())
    }

    @Test
    fun `bought slots 0 and 4 are accepted and -1 and 5 are refused`() {
        insert("yan", 0)
        insert("other", 4)

        jdbc.update("delete from player_team")

        assertFailsWith<DataAccessException> { insert("yan", -1) }
        assertFailsWith<DataAccessException> { insert("yan", 5) }
        assertFailsWith<DataAccessException> { insert("other", -1) }
        assertFailsWith<DataAccessException> { insert("other", 5) }
    }

    @Test
    fun `an ally in a slot that is not bought is refused`() {
        assertFailsWith<DataAccessException> { insert("yan", 1, ally2 = "orina") }
        assertFailsWith<DataAccessException> { insert("yan", 0, ally1 = "lyra") }
        assertFailsWith<DataAccessException> { insert("yan", 3, ally4 = "vex") }
    }

    @Test
    fun `the same hero in two slots is refused`() {
        assertFailsWith<DataAccessException> { insert("yan", 2, ally1 = "lyra", ally2 = "lyra") }
    }

    @Test
    fun `an ally id absent from heroes is refused`() {
        assertFailsWith<DataAccessException> { insert("yan", 1, ally1 = "ghost") }
    }
}
