package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.ResetRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

/** One row per player who ever reset the account: how many times. */
@Entity
@Table(name = "player_resets")
class ResetEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var resets: Int,
)

interface JpaResetRepository : JpaRepository<ResetEntity, String>

@Repository
class ResetRepository(
    private val jpaResetRepository: JpaResetRepository,
) : ResetRepositoryPort {
    @Transactional
    override fun count(username: String): Int = jpaResetRepository.findById(username).map { it.resets }.orElse(0)

    @Transactional
    override fun save(
        username: String,
        resets: Int,
    ) {
        jpaResetRepository.save(ResetEntity(username, resets))
    }
}
