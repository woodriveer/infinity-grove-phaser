package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/** Persisted form of a refresh token: only the hash of the raw value is ever stored. */
data class RefreshToken(
    val tokenHash: String,
    val username: String,
    val expiresAt: Long,
    val revoked: Boolean,
) {
    fun isUsableAt(now: Long): Boolean {
        val usable = !revoked && now < expiresAt
        logger.debug("Checking RefreshToken usability usable={}", usable)
        return usable
    }

    fun revoke(): RefreshToken {
        logger.info("Revoking RefreshToken username={}", username)
        return copy(revoked = true)
    }

    companion object {
        private val logger = LoggerFactory.getLogger(RefreshToken::class.java)
        const val TTL_MS: Long = 30L * 24 * 60 * 60 * 1000

        fun issue(
            username: String,
            generate: () -> String,
            hash: (String) -> String,
            now: Long,
        ): IssuedRefreshToken {
            logger.info("Issuing RefreshToken username={}", username)
            val raw = generate()
            return IssuedRefreshToken(
                rawValue = raw,
                token = RefreshToken(tokenHash = hash(raw), username = username, expiresAt = now + TTL_MS, revoked = false),
            )
        }
    }
}

/** A freshly issued refresh token: the raw value (returned to the client once) plus the entity to persist. */
data class IssuedRefreshToken(
    val rawValue: String,
    val token: RefreshToken,
)

data class AuthTokens(
    val user: User,
    val accessToken: String,
    val accessTokenExpiresAt: Long,
    val refreshToken: String,
    val refreshTokenExpiresAt: Long,
)
