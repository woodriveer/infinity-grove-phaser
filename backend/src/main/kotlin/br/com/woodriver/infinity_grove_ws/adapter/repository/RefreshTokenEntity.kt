package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(name = "refresh_tokens", indexes = [Index(name = "idx_refresh_tokens_username", columnList = "username")])
class RefreshTokenEntity(
    @Id
    @Column(name = "token_hash", nullable = false, updatable = false)
    var tokenHash: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "expires_at", nullable = false, updatable = false)
    var expiresAt: Long,
    @Column(nullable = false)
    var revoked: Boolean,
) {
    fun toDomain() = RefreshToken(tokenHash, username, expiresAt, revoked)

    companion object {
        fun from(token: RefreshToken) = RefreshTokenEntity(token.tokenHash, token.username, token.expiresAt, token.revoked)
    }
}
