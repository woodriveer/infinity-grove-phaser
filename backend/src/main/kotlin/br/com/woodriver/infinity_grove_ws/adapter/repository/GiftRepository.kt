package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import br.com.woodriver.infinity_grove_ws.port.GiftRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

/** One row per account and gift; `id` is `<username>/<giftId>`. */
@Entity
@Table(name = "player_gifts")
class PlayerGiftEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "gift_id", nullable = false, updatable = false, length = 64)
    var giftId: String,
    @Column(name = "piece_id", nullable = false, updatable = false)
    var pieceId: String,
    @Column(name = "granted_at", nullable = false, updatable = false)
    var grantedAt: Long,
)

interface JpaPlayerGiftRepository : JpaRepository<PlayerGiftEntity, String> {
    fun existsByUsernameAndGiftId(
        username: String,
        giftId: String,
    ): Boolean

    /** A plain insert (never a merge), so a second grant of the same gift violates the key instead of overwriting the first. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value =
            "insert into player_gifts (id, username, gift_id, piece_id, granted_at) " +
                "values (:id, :username, :giftId, :pieceId, :grantedAt)",
        nativeQuery = true,
    )
    fun insert(
        @Param("id") id: String,
        @Param("username") username: String,
        @Param("giftId") giftId: String,
        @Param("pieceId") pieceId: String,
        @Param("grantedAt") grantedAt: Long,
    ): Int
}

@Repository
class GiftRepository(
    private val jpaPlayerGiftRepository: JpaPlayerGiftRepository,
) : GiftRepositoryPort {
    @Transactional
    override fun exists(
        username: String,
        giftId: String,
    ) = jpaPlayerGiftRepository.existsByUsernameAndGiftId(username, giftId)

    @Transactional
    override fun save(grant: GiftGrant): GiftGrant {
        jpaPlayerGiftRepository.insert("${grant.username}/${grant.giftId}", grant.username, grant.giftId, grant.pieceId, grant.grantedAt)
        return grant
    }
}
