package br.com.woodriver.infinity_grove_ws.adapter.security

import java.time.Duration
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class SecurityPropertiesTest {
    @Test
    fun `rejects a secret of 31 bytes`() {
        assertFailsWith<IllegalArgumentException> { SecurityProperties(jwtSecret = "a".repeat(31)) }
    }

    @Test
    fun `accepts a secret of 32 bytes`() {
        assertEquals("a".repeat(32), SecurityProperties(jwtSecret = "a".repeat(32)).jwtSecret)
    }

    @Test
    fun `counts bytes not characters`() {
        // 16 two-byte characters = 32 bytes
        SecurityProperties(jwtSecret = "é".repeat(16))
        assertFailsWith<IllegalArgumentException> { SecurityProperties(jwtSecret = "é".repeat(15)) }
    }

    @Test
    fun `access token ttl defaults to 24 hours`() {
        assertEquals(Duration.ofHours(24), SecurityProperties(jwtSecret = "a".repeat(32)).accessTokenTtl)
    }
}
