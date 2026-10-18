package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaPieceRepository : JpaRepository<PieceEntity, String> {
    fun findAllByUsernameOrderByCreatedAtAscIdAsc(username: String): List<PieceEntity>

    fun deleteAllByUsername(username: String)
}

@Repository
class EquipmentRepository(
    private val jpaPieceRepository: JpaPieceRepository,
) : EquipmentRepositoryPort {
    @Transactional
    override fun findAll(username: String): List<Piece> =
        jpaPieceRepository.findAllByUsernameOrderByCreatedAtAscIdAsc(username).map(PieceEntity::toDomain)

    /** A new piece gets the current time as its place in the order; a stored one keeps the time it was created at. */
    @Transactional
    override fun save(piece: Piece): Piece {
        val createdAt = jpaPieceRepository.findById(piece.id).map { it.createdAt }.orElseGet { System.currentTimeMillis() }
        jpaPieceRepository.save(PieceEntity.from(piece, createdAt))
        return piece
    }

    @Transactional
    override fun delete(id: String) = jpaPieceRepository.deleteById(id)

    @Transactional
    override fun deleteByUsername(username: String) = jpaPieceRepository.deleteAllByUsername(username)
}
