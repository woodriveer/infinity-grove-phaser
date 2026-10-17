package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.RefreshToken

/** A signed access token and the epoch-millisecond instant at which it expires. */
data class AccessToken(
    val value: String,
    val expiresAt: Long,
)

interface AccessTokenIssuerPort {
    fun issue(
        username: String,
        now: Long,
    ): AccessToken
}

interface RefreshTokenSecretPort {
    fun generate(): String

    fun hash(raw: String): String
}

interface RefreshTokenRepositoryPort {
    fun save(token: RefreshToken): RefreshToken

    fun findByHash(tokenHash: String): RefreshToken?

    fun revokeAllByUsername(username: String)

    fun deleteAllByUsername(username: String)
}
