package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.PlayerEquipment

interface ListEquipmentUseCase {
    /** Returns every piece the player owns, worn or in the bag, and the bag capacity. */
    fun list(username: String): PlayerEquipment
}

interface EquipPieceUseCase {
    /** Puts [pieceId] on [heroId], which the player must own; the piece that sat in that slot goes back to the bag. */
    fun equip(
        username: String,
        pieceId: String,
        heroId: String,
    ): PlayerEquipment

    /** Takes [pieceId] off its hero and keeps it in the bag. */
    fun unequip(
        username: String,
        pieceId: String,
    ): PlayerEquipment
}
