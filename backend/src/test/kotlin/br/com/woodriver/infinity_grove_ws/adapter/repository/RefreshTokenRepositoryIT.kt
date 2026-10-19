package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RefreshTokenRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: RefreshTokenRepository

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "ana")

    private fun token(
        hash: String,
        username: String,
        revoked: Boolean = false,
    ) = RefreshToken(tokenHash = hash, username = username, expiresAt = 1_700_000_000_000L, revoked = revoked)

    @Test
    fun `table is empty at the start of each test`() {
        assertEquals(0, jpaRefreshTokenRepository.count())
    }

    @Test
    fun `save then findByHash returns the token with every field`() {
        val saved = token("h1", "yan")

        repository.save(saved)

        assertEquals(saved, repository.findByHash("h1"))
    }

    @Test
    fun `findByHash returns null for an unknown hash`() {
        repository.save(token("h1", "yan"))

        assertNull(repository.findByHash("unknown"))
    }

    @Test
    fun `save of an existing hash updates the revoked flag`() {
        repository.save(token("h1", "yan"))

        repository.save(token("h1", "yan", revoked = true))

        assertTrue(repository.findByHash("h1")!!.revoked)
        assertEquals(1, jpaRefreshTokenRepository.count())
    }

    @Test
    fun `revokeAllByUsername revokes only that user's tokens`() {
        repository.save(token("a1", "yan"))
        repository.save(token("a2", "yan"))
        repository.save(token("b1", "ana"))

        repository.revokeAllByUsername("yan")

        assertTrue(repository.findByHash("a1")!!.revoked)
        assertTrue(repository.findByHash("a2")!!.revoked)
        assertFalse(repository.findByHash("b1")!!.revoked)
    }

    @Test
    fun `deleteAllByUsername removes only that user's tokens`() {
        repository.save(token("a1", "yan"))
        repository.save(token("a2", "yan", revoked = true))
        repository.save(token("b1", "ana"))

        repository.deleteAllByUsername("yan")

        assertNull(repository.findByHash("a1"))
        assertNull(repository.findByHash("a2"))
        assertNotNull(repository.findByHash("b1"))
        assertEquals(1, jpaRefreshTokenRepository.count())
    }

    @Test
    fun `revoke and delete for a user without tokens do nothing`() {
        repository.save(token("b1", "ana"))

        repository.revokeAllByUsername("ghost")
        repository.deleteAllByUsername("ghost")

        assertEquals(token("b1", "ana"), repository.findByHash("b1"))
    }
}
