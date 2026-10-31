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

interface SellPieceUseCase {
    /** Removes [pieceId] (taking it off its hero first) and credits its sell price, in one transaction with the wallet. */
    fun sell(
        username: String,
        pieceId: String,
    ): EquipmentChange
}

/** The pieces and the wallet after a batch sale, how many pieces were sold and the copper they paid. */
data class BatchSale(
    val equipment: PlayerEquipment,
    val wallet: Wallet,
    val sold: Int,
    val earned: Long,
)

interface SellPiecesUseCase {
    /** Sells every piece of [pieceIds] (taking worn ones off their hero) and credits the sum of their sell prices, in one transaction; one id the player does not own sells nothing. */
    fun sellAll(
        username: String,
        pieceIds: List<String>,
    ): BatchSale
}
