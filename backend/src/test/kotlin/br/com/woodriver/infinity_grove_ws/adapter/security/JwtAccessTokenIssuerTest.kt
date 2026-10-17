package br.com.woodriver.infinity_grove_ws.adapter.security

import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.BadJwtException
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import java.time.Duration
import javax.crypto.spec.SecretKeySpec
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class JwtAccessTokenIssuerTest {
    private val secret = "unit-test-secret-0123456789-abcdefghij"
    private val otherSecret = "another-secret-0123456789-abcdefghijkl"
    private val issuer = JwtAccessTokenIssuer(SecurityProperties(jwtSecret = secret))

    private fun decoder(secret: String): JwtDecoder =
        NimbusJwtDecoder
            .withSecretKey(SecretKeySpec(secret.toByteArray(), "HmacSHA256"))
            .macAlgorithm(MacAlgorithm.HS256)
            .build()

    @Test
    fun `issued token decodes with the same key and carries the username as subject`() {
        val token = issuer.issue("yan", System.currentTimeMillis())

        val jwt = decoder(secret).decode(token.value)

        assertEquals("yan", jwt.subject)
    }

    @Test
    fun `token lasts 24 hours and expiresAt equals exp in epoch millis`() {
        val now = System.currentTimeMillis()

        val token = issuer.issue("yan", now)
        val jwt = decoder(secret).decode(token.value)

        assertEquals(Duration.ofHours(24), Duration.between(jwt.issuedAt, jwt.expiresAt))
        assertEquals(jwt.expiresAt!!.toEpochMilli(), token.expiresAt)
        // JWT timestamps have second precision, so the expiry is within one second of now + 24h
        val expected = now + Duration.ofHours(24).toMillis()
        assert(token.expiresAt in (expected - 1_000)..expected) { "expiresAt=${token.expiresAt} expected~$expected" }
    }

    @Test
    fun `a token signed with another key fails decoding`() {
        val foreign = JwtAccessTokenIssuer(SecurityProperties(jwtSecret = otherSecret)).issue("yan", System.currentTimeMillis())

        assertFailsWith<BadJwtException> { decoder(secret).decode(foreign.value) }
    }

    @Test
    fun `an expired token fails decoding`() {
        val threeDaysAgo = System.currentTimeMillis() - Duration.ofDays(3).toMillis()

        val expired = issuer.issue("yan", threeDaysAgo)

        assertFailsWith<BadJwtException> { decoder(secret).decode(expired.value) }
    }

    @Test
    fun `ttl comes from the properties`() {
        val shortLived = JwtAccessTokenIssuer(SecurityProperties(jwtSecret = secret, accessTokenTtl = Duration.ofMinutes(5)))

        val token = shortLived.issue("yan", 1_000_000L)

        assertEquals(1_000_000L + Duration.ofMinutes(5).toMillis(), token.expiresAt)
    }
}
