package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.Piece

interface EquipmentRepositoryPort {
    /** Every piece of the player in the order they were found. The caller holds the player lock when it changes them. */
    fun findAll(username: String): List<Piece>

    /** Inserts [piece] or updates the stored piece with the same id. */
    fun save(piece: Piece): Piece

    fun delete(id: String)

    fun deleteByUsername(username: String)
}
