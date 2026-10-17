package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class RefreshTokenTest {
    private val token = RefreshToken(tokenHash = "h", username = "yan", expiresAt = 1_000L, revoked = false)

    @Test
    fun `token is usable before expiry when not revoked`() {
        assertTrue(token.isUsableAt(999L))
    }

    @Test
    fun `token is not usable at the exact expiry boundary`() {
        assertFalse(token.isUsableAt(1_000L))
    }

    @Test
    fun `token is not usable after expiry`() {
        assertFalse(token.isUsableAt(1_001L))
    }

    @Test
    fun `revoked token is not usable even before expiry`() {
        assertFalse(token.revoke().isUsableAt(0L))
    }

    @Test
    fun `revoke marks the token revoked and keeps other fields`() {
        val revoked = token.revoke()

        assertTrue(revoked.revoked)
        assertEquals(token.copy(revoked = true), revoked)
    }

    @Test
    fun `revoke is idempotent`() {
        assertEquals(token.revoke(), token.revoke().revoke())
    }

    @Test
    fun `issue expires 30 days after now and starts unrevoked`() {
        val issued = RefreshToken.issue("yan", generate = { "raw" }, hash = { "hash-of-$it" }, now = 5_000L)

        assertEquals(5_000L + 30L * 24 * 60 * 60 * 1000, issued.token.expiresAt)
        assertEquals(RefreshToken.TTL_MS, issued.token.expiresAt - 5_000L)
        assertEquals("yan", issued.token.username)
        assertFalse(issued.token.revoked)
    }

    @Test
    fun `issue stores the hash and not the raw value`() {
        val issued = RefreshToken.issue("yan", generate = { "raw" }, hash = { "hash-of-$it" }, now = 0L)

        assertEquals("raw", issued.rawValue)
        assertEquals("hash-of-raw", issued.token.tokenHash)
        assertNotEquals(issued.rawValue, issued.token.tokenHash)
    }

    @Test
    fun `ttl is 30 days in milliseconds`() {
        assertEquals(2_592_000_000L, RefreshToken.TTL_MS)
    }
}
