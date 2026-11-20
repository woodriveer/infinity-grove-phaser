package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class GiftRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: GiftRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private val grant = GiftGrant("yan", "BLACK_AWARENESS_STAFF", "piece-1", 1_000L)

    @BeforeEach
    fun players() = users("yan", "ana")

    @Test
    fun `exists is false before a grant and true after it`() {
        assertFalse(repository.exists("yan", "BLACK_AWARENESS_STAFF"))

        repository.save(grant)

        assertTrue(repository.exists("yan", "BLACK_AWARENESS_STAFF"))
    }

    @Test
    fun `a second grant of the same gift for the same account fails`() {
        repository.save(grant)

        assertFailsWith<DataIntegrityViolationException> { repository.save(grant.copy(pieceId = "piece-2")) }

        assertEquals("piece-1", jdbc.queryForObject("select piece_id from player_gifts where username = 'yan'", String::class.java))
    }

    @Test
    fun `the same gift for two accounts is two rows`() {
        repository.save(grant)
        repository.save(grant.copy(username = "ana"))

        assertTrue(repository.exists("ana", "BLACK_AWARENESS_STAFF"))
        assertEquals(2, jdbc.queryForObject("select count(*) from player_gifts", Int::class.java))
    }

    @Test
    fun `deleting the account deletes its grant`() {
        repository.save(grant)

        jpaUserRepository.deleteById("yan")

        assertEquals(0, jdbc.queryForObject("select count(*) from player_gifts where username = 'yan'", Int::class.java))
    }
}
