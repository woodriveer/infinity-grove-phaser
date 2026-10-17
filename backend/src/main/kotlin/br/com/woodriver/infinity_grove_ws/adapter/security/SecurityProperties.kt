package br.com.woodriver.infinity_grove_ws.adapter.security

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

/** Session token settings bound from `app.security.*`. Startup fails when the secret is shorter than 32 bytes. */
@ConfigurationProperties("app.security")
data class SecurityProperties(
    val jwtSecret: String,
    val accessTokenTtl: Duration = Duration.ofHours(24),
) {
    init {
        require(jwtSecret.toByteArray(Charsets.UTF_8).size >= MIN_SECRET_BYTES) {
            "app.security.jwt-secret must be at least $MIN_SECRET_BYTES bytes"
        }
    }

    // Keep the secret out of logs.
    override fun toString() = "SecurityProperties(accessTokenTtl=$accessTokenTtl)"

    companion object {
        const val MIN_SECRET_BYTES = 32
    }
}
