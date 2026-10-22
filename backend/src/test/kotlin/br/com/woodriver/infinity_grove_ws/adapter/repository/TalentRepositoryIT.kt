package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TalentRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: TalentRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    @Test
    fun `a player with no upgrade has no levels`() {
        assertEquals(emptyMap(), repository.findAll("yan"))
    }

    @Test
    fun `save inserts the level and then updates it`() {
        repository.save("yan", "CLICK_DAMAGE", 1)
        repository.save("yan", "CLICK_DAMAGE", 2)
        repository.save("yan", "CRIT_CHANCE", 4)

        assertEquals(mapOf("CLICK_DAMAGE" to 2, "CRIT_CHANCE" to 4), repository.findAll("yan"))
        assertEquals(2, jdbc.queryForObject("select count(*) from player_talents where username = 'yan'", Int::class.java))
    }

    @Test
    fun `findAll returns only the levels of that player`() {
        repository.save("yan", "CLICK_DAMAGE", 2)
        repository.save("other", "CLICK_DAMAGE", 7)

        assertEquals(mapOf("CLICK_DAMAGE" to 2), repository.findAll("yan"))
    }

    @Test
    fun `a player with no award has earned no points`() {
        assertEquals(0, repository.earnedPoints("yan"))
    }

    @Test
    fun `an award is stored once per key and the earned points are their sum`() {
        assertEquals(true, repository.award("yan", "1:1:PHASE:1", 1))
        assertEquals(true, repository.award("yan", "1:1:MINIBOSS:1", 2))
        assertEquals(false, repository.award("yan", "1:1:PHASE:1", 1))

        assertEquals(3, repository.earnedPoints("yan"))
        assertEquals(2, jdbc.queryForObject("select count(*) from talent_point_awards where username = 'yan'", Int::class.java))
    }

    @Test
    fun `earned points count only the awards of that player`() {
        repository.award("yan", "1:1:PHASE:1", 1)
        repository.award("other", "1:1:PHASE:1", 5)

        assertEquals(1, repository.earnedPoints("yan"))
        assertEquals(5, repository.earnedPoints("other"))
    }

    @Test
    fun `an award for a player that does not exist breaks the foreign key`() {
        assertFailsWith<DataAccessException> { repository.award("ghost", "1:1:PHASE:1", 1) }
    }

    @Test
    fun `deleting the player deletes its awards`() {
        repository.award("yan", "1:1:PHASE:1", 1)

        jpaUserRepository.deleteById("yan")

        assertEquals(0, repository.earnedPoints("yan"))
    }

    @Test
    fun `deleteByUsername removes the awards of that player only`() {
        repository.award("yan", "1:1:PHASE:1", 1)
        repository.award("other", "1:1:PHASE:1", 5)

        repository.deleteByUsername("yan")

        assertEquals(0, repository.earnedPoints("yan"))
        assertEquals(5, repository.earnedPoints("other"))
    }

    @Test
    fun `deleteByUsername removes the levels of that player only`() {
        repository.save("yan", "CLICK_DAMAGE", 2)
        repository.save("other", "CLICK_DAMAGE", 7)

        repository.deleteByUsername("yan")

        assertEquals(emptyMap(), repository.findAll("yan"))
        assertEquals(mapOf("CLICK_DAMAGE" to 7), repository.findAll("other"))
    }

    @Test
    fun `a row for a player that does not exist breaks the foreign key`() {
        assertFailsWith<DataAccessException> { repository.save("ghost", "CLICK_DAMAGE", 1) }
    }

    @Test
    fun `a level below 1 is refused by the table`() {
        assertFailsWith<DataAccessException> { repository.save("yan", "CLICK_DAMAGE", 0) }
    }

    @Test
    fun `deleting the player deletes its levels`() {
        repository.save("yan", "CLICK_DAMAGE", 2)

        jpaUserRepository.deleteById("yan")

        assertEquals(emptyMap(), repository.findAll("yan"))
    }
}
