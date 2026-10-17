package br.com.woodriver.infinity_grove_ws.adapter.security

import java.util.Base64
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class Sha256RefreshTokenSecretsTest {
    private val secrets = Sha256RefreshTokenSecrets()

    @Test
    fun `generate returns 43 char base64url strings without padding`() {
        val value = secrets.generate()

        assertEquals(43, value.length)
        assertTrue(value.matches(Regex("[A-Za-z0-9_-]{43}")), "unexpected alphabet: $value")
        assertEquals(32, Base64.getUrlDecoder().decode(value).size)
    }

    @Test
    fun `generate returns different values between calls`() {
        val values = List(50) { secrets.generate() }.toSet()

        assertEquals(50, values.size)
    }

    @Test
    fun `hash is deterministic, 64 hex chars and differs from the input`() {
        val raw = "some-raw-token"

        val first = secrets.hash(raw)

        assertEquals(first, secrets.hash(raw))
        assertEquals(64, first.length)
        assertTrue(first.matches(Regex("[0-9a-f]{64}")))
        assertNotEquals(raw, first)
    }

    @Test
    fun `hash matches the known SHA-256 of abc`() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", secrets.hash("abc"))
    }

    @Test
    fun `different inputs hash differently`() {
        assertNotEquals(secrets.hash("a"), secrets.hash("b"))
    }
}
