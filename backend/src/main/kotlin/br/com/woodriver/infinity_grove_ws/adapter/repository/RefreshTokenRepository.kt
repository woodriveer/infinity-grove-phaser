package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.findByIdOrNull
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaRefreshTokenRepository : JpaRepository<RefreshTokenEntity, String> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshTokenEntity t set t.revoked = true where t.username = :username")
    fun revokeAllByUsername(
        @Param("username") username: String,
    ): Int

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from RefreshTokenEntity t where t.username = :username")
    fun deleteAllByUsername(
        @Param("username") username: String,
    ): Int
}

@Repository
class RefreshTokenRepository(
    private val jpaRefreshTokenRepository: JpaRefreshTokenRepository,
) : RefreshTokenRepositoryPort {
    override fun save(token: RefreshToken): RefreshToken = jpaRefreshTokenRepository.save(RefreshTokenEntity.from(token)).toDomain()

    override fun findByHash(tokenHash: String): RefreshToken? = jpaRefreshTokenRepository.findByIdOrNull(tokenHash)?.toDomain()

    @Transactional
    override fun revokeAllByUsername(username: String) {
        jpaRefreshTokenRepository.revokeAllByUsername(username)
    }

    @Transactional
    override fun deleteAllByUsername(username: String) {
        jpaRefreshTokenRepository.deleteAllByUsername(username)
    }
}
