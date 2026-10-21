package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.io.Serializable

data class TalentKey(
    var username: String = "",
    var talentId: String = "",
) : Serializable

/** One row per player and upgraded talent: its level. */
@Entity
@Table(name = "player_talents")
@IdClass(TalentKey::class)
class TalentEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Id
    @Column(name = "talent_id", nullable = false, updatable = false, length = 64)
    var talentId: String,
    @Column(nullable = false)
    var level: Int,
)

interface JpaTalentRepository : JpaRepository<TalentEntity, TalentKey> {
    fun findAllByUsername(username: String): List<TalentEntity>

    fun deleteAllByUsername(username: String)
}

@Repository
class TalentRepository(
    private val jpaTalentRepository: JpaTalentRepository,
) : TalentRepositoryPort {
    @Transactional
    override fun findAll(username: String): Map<String, Int> = jpaTalentRepository.findAllByUsername(username).associate { it.talentId to it.level }

    @Transactional
    override fun save(
        username: String,
        talentId: String,
        level: Int,
    ) {
        jpaTalentRepository.save(TalentEntity(username, talentId, level))
    }

    @Transactional
    override fun deleteByUsername(username: String) = jpaTalentRepository.deleteAllByUsername(username)
}
