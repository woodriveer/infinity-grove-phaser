package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.FakeAccessTokenIssuer
import br.com.woodriver.infinity_grove_ws.FakePasswordHasher
import br.com.woodriver.infinity_grove_ws.FakeRefreshTokenSecrets
import br.com.woodriver.infinity_grove_ws.InMemoryRefreshTokenRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.domain.InvalidRefreshTokenException
import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.domain.User
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class SessionServiceTest {
    private val users = InMemoryUserRepository()
    private val tokens = InMemoryRefreshTokenRepository()
    private val secrets = FakeRefreshTokenSecrets()
    private val clock = MutableClock(1_000_000L)
    private val service = SessionService(users, tokens, FakeAccessTokenIssuer(), secrets, clock)
    private val thirtyDays = 30L * 24 * 60 * 60 * 1000

    private fun storedUser(name: String = "yan") =
        User.register(name, "password123", FakePasswordHasher(), InMemoryUserRepository(), now = 1L).also { users.save(it) }

    @Test
    fun `start returns access token from issuer and refresh token expiring in 30 days`() {
        val user = storedUser()

        val result = service.start(user)

        assertEquals(user, result.user)
        assertEquals("access:yan:1000000", result.accessToken)
        assertEquals(1_000_000L + FakeAccessTokenIssuer.ACCESS_TTL_MS, result.accessTokenExpiresAt)
        assertEquals("raw-1", result.refreshToken)
        assertEquals(1_000_000L + thirtyDays, result.refreshTokenExpiresAt)
    }

    @Test
    fun `start persists only the hash of the refresh token`() {
        val result = service.start(storedUser())

        assertNull(tokens.findByHash(result.refreshToken))
        val saved = tokens.findByHash(secrets.hash(result.refreshToken))
        assertEquals(RefreshToken(secrets.hash("raw-1"), "yan", 1_000_000L + thirtyDays, false), saved)
        assertNotEquals(result.refreshToken, saved?.tokenHash)
    }

    @Test
    fun `refresh with a usable token revokes the old one and returns a new pair`() {
        val first = service.start(storedUser())
        clock.millis += 5_000L

        val second = service.refresh(first.refreshToken)

        assertEquals("access:yan:1005000", second.accessToken)
        assertNotEquals(first.refreshToken, second.refreshToken)
        assertEquals(1_005_000L + thirtyDays, second.refreshTokenExpiresAt)
        assertEquals("yan", second.user.username)
        assertTrue(tokens.findByHash(secrets.hash(first.refreshToken))!!.revoked)
        assertFalse(tokens.findByHash(secrets.hash(second.refreshToken))!!.revoked)
    }

    @Test
    fun `refreshing twice with the same token fails the second time`() {
        val first = service.start(storedUser())
        service.refresh(first.refreshToken)

        assertFailsWith<InvalidRefreshTokenException> { service.refresh(first.refreshToken) }
    }

    @Test
    fun `refresh fails for an unknown token`() {
        storedUser()

        assertFailsWith<InvalidRefreshTokenException> { service.refresh("never-issued") }
        assertTrue(tokens.tokens.isEmpty())
    }

    @Test
    fun `refresh fails for an expired token and persists nothing new`() {
        val first = service.start(storedUser())
        clock.millis += thirtyDays

        assertFailsWith<InvalidRefreshTokenException> { service.refresh(first.refreshToken) }
        assertEquals(1, tokens.tokens.size)
    }

    @Test
    fun `refresh succeeds one millisecond before expiry`() {
        val first = service.start(storedUser())
        clock.millis += thirtyDays - 1

        val second = service.refresh(first.refreshToken)

        assertNotEquals(first.refreshToken, second.refreshToken)
    }

    @Test
    fun `refresh fails for a revoked token and persists nothing new`() {
        val first = service.start(storedUser())
        service.end(first.refreshToken)

        assertFailsWith<InvalidRefreshTokenException> { service.refresh(first.refreshToken) }
        assertEquals(1, tokens.tokens.size)
    }

    @Test
    fun `refresh fails when the user no longer exists and persists nothing new`() {
        val first = service.start(storedUser())
        users.deleteByUsername("yan")

        assertFailsWith<InvalidRefreshTokenException> { service.refresh(first.refreshToken) }
        assertEquals(1, tokens.tokens.size)
    }

    @Test
    fun `end revokes a known token`() {
        val first = service.start(storedUser())

        service.end(first.refreshToken)

        assertTrue(tokens.findByHash(secrets.hash(first.refreshToken))!!.revoked)
    }

    @Test
    fun `end does not throw for an unknown token`() {
        service.end("never-issued")

        assertTrue(tokens.tokens.isEmpty())
    }

    @Test
    fun `end does not throw for an already revoked token`() {
        val first = service.start(storedUser())
        service.end(first.refreshToken)

        service.end(first.refreshToken)

        assertTrue(tokens.findByHash(secrets.hash(first.refreshToken))!!.revoked)
    }
}
