package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.CrystalRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

/** One row per player who ever held crystals: the balance. */
@Entity
@Table(name = "player_crystals")
class CrystalEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var crystals: Long,
)

interface JpaCrystalRepository : JpaRepository<CrystalEntity, String>

@Repository
class CrystalRepository(
    private val jpaCrystalRepository: JpaCrystalRepository,
) : CrystalRepositoryPort {
    @Transactional
    override fun balance(username: String): Long = jpaCrystalRepository.findById(username).map { it.crystals }.orElse(0L)

    @Transactional
    override fun save(
        username: String,
        crystals: Long,
    ) {
        jpaCrystalRepository.save(CrystalEntity(username, crystals))
    }
}
