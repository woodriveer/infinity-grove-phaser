package br.com.woodriver.infinity_grove_ws.adapter.security

import br.com.woodriver.infinity_grove_ws.port.AccessToken
import br.com.woodriver.infinity_grove_ws.port.AccessTokenIssuerPort
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.crypto.spec.SecretKeySpec

@Component
class JwtAccessTokenIssuer(
    private val properties: SecurityProperties,
) : AccessTokenIssuerPort {
    private val encoder =
        NimbusJwtEncoder
            .withSecretKey(SecretKeySpec(properties.jwtSecret.toByteArray(Charsets.UTF_8), "HmacSHA256"))
            .algorithm(MacAlgorithm.HS256)
            .build()

    override fun issue(
        username: String,
        now: Long,
    ): AccessToken {
        // JWT NumericDate has second precision; truncate so the returned expiresAt equals the token exp exactly.
        val issuedAt = Instant.ofEpochMilli(now).truncatedTo(ChronoUnit.SECONDS)
        val expiresAt = issuedAt.plus(properties.accessTokenTtl)
        val claims =
            JwtClaimsSet
                .builder()
                .subject(username)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build()
        val header = JwsHeader.with(MacAlgorithm.HS256).build()
        val value = encoder.encode(JwtEncoderParameters.from(header, claims)).tokenValue
        return AccessToken(value = value, expiresAt = expiresAt.toEpochMilli())
    }
}
