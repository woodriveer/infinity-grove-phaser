package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy
import br.com.woodriver.infinity_grove_ws.port.LegacyRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import org.slf4j.LoggerFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.io.Serializable

data class PlayerLegacyId(
    var username: String = "",
    var chapter: Int = 0,
) : Serializable

/** One row per player and chapter they reset at: its legacy percent (50 or 100). */
@Entity
@Table(name = "player_legacy")
@IdClass(PlayerLegacyId::class)
class PlayerLegacyEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Id
    @Column(nullable = false, updatable = false)
    var chapter: Int,
    @Column(nullable = false)
    var percent: Int,
)

interface JpaPlayerLegacyRepository : JpaRepository<PlayerLegacyEntity, PlayerLegacyId> {
    fun findAllByUsername(username: String): List<PlayerLegacyEntity>
}

@Repository
class LegacyRepository(
    private val jpaPlayerLegacyRepository: JpaPlayerLegacyRepository,
) : LegacyRepositoryPort {
    @Transactional
    override fun find(username: String): ResetLegacy =
        ResetLegacy(username, jpaPlayerLegacyRepository.findAllByUsername(username).associate { it.chapter to it.percent })

    @Transactional
    override fun save(legacy: ResetLegacy) {
        val rows = legacy.chapters().map { PlayerLegacyEntity(legacy.username, it.chapter, it.percent) }
        jpaPlayerLegacyRepository.saveAll(rows)
        logger.debug("Legacy saved username={} chapters={}", legacy.username, legacy.percents)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(LegacyRepository::class.java)
    }
}
