package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.AutoClickRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

/** One row per player who upgraded the auto click: its level. */
@Entity
@Table(name = "player_auto_click")
class AutoClickEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var level: Int,
)

interface JpaAutoClickRepository : JpaRepository<AutoClickEntity, String>

@Repository
class AutoClickRepository(
    private val jpaAutoClickRepository: JpaAutoClickRepository,
) : AutoClickRepositoryPort {
    @Transactional
    override fun level(username: String): Int = jpaAutoClickRepository.findById(username).map { it.level }.orElse(0)

    @Transactional
    override fun save(
        username: String,
        level: Int,
    ) {
        jpaAutoClickRepository.save(AutoClickEntity(username, level))
    }
}
