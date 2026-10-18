package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.PlayerEquipment
import br.com.woodriver.infinity_grove_ws.domain.Wallet

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

/** The pieces and the wallet of the player after an action that spent or earned copper. */
data class EquipmentChange(
    val equipment: PlayerEquipment,
    val wallet: Wallet,
)

interface RefinePieceUseCase {
    /** Raises [pieceId] by one refine level for the copper it costs, in one transaction with the wallet. */
    fun refine(
        username: String,
        pieceId: String,
    ): EquipmentChange
}

interface RerollAffixUseCase {
    /** Replaces affix [affixIndex] of [pieceId] with a new type and value for the copper it costs, in one transaction with the wallet. */
    fun reroll(
        username: String,
        pieceId: String,
        affixIndex: Int,
    ): EquipmentChange
}
