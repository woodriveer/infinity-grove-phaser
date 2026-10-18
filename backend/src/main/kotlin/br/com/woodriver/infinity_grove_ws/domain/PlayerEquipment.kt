package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/**
 * Everything one player holds of equipment: every piece owned (worn or not) and how many the bag may hold. A hero wears at most one piece
 * per slot and a piece is worn by at most one hero. Every change returns a new value; the service stores it under the player lock.
 */
data class PlayerEquipment(
    val username: String,
    val pieces: List<Piece>,
    val capacity: Int,
) {
    init {
        require(capacity >= 1) { "Capacity $capacity must be at least 1" }
        require(pieces.all { it.username == username }) { "Every piece must belong to $username" }
        require(pieces.map { it.id }.toSet().size == pieces.size) { "Piece ids must be unique" }
        val worn = pieces.filter { it.heroId != null }.map { it.heroId to it.slot }
        require(worn.toSet().size == worn.size) { "A hero wears at most one piece per slot" }
    }

    val isFull get() = pieces.size >= capacity

    /** The piece with [pieceId]; a piece the player does not own is the same as one that does not exist. */
    fun find(pieceId: String): Piece = pieces.firstOrNull { it.id == pieceId } ?: throw EquipmentNotFoundException(pieceId)

    /** The pieces worn by [heroId]. */
    fun worn(heroId: String): List<Piece> = pieces.filter { it.heroId == heroId }

    /** Stores [piece] in the bag; the caller checks [isFull] first. */
    fun add(piece: Piece): PlayerEquipment {
        check(!isFull) { "The bag of $username is full" }
        return copy(pieces = pieces + piece)
    }

    /** Puts [pieceId] on [heroId]; the piece that sat in that slot goes back to the bag and a piece worn by another hero moves. */
    fun equip(
        pieceId: String,
        heroId: String,
    ): PlayerEquipment {
        val piece = find(pieceId)
        logger.info("Equipping username={} piece={} hero={}", username, pieceId, heroId)
        val updated =
            pieces.map {
                when {
                    it.id == pieceId -> it.copy(heroId = heroId)
                    it.heroId == heroId && it.slot == piece.slot -> it.copy(heroId = null)
                    else -> it
                }
            }
        return copy(pieces = updated)
    }

    /** Takes [pieceId] off its hero and keeps it in the bag. */
    fun unequip(pieceId: String): PlayerEquipment {
        val piece = find(pieceId)
        logger.info("Unequipping username={} piece={}", username, pieceId)
        return replace(piece.copy(heroId = null))
    }

    /** Swaps the piece with the same id for [piece]. */
    fun replace(piece: Piece): PlayerEquipment {
        find(piece.id)
        return copy(pieces = pieces.map { if (it.id == piece.id) piece else it })
    }

    /** Drops [pieceId] from the player pieces; a worn piece leaves the slot of its hero empty. */
    fun remove(pieceId: String): PlayerEquipment {
        find(pieceId)
        return copy(pieces = pieces.filter { it.id != pieceId })
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(PlayerEquipment::class.java)
    }
}
