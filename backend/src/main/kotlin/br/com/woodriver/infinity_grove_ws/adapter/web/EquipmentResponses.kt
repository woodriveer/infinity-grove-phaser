package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.EquipmentDrop
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.Piece
import com.fasterxml.jackson.annotation.JsonInclude

/** An affix with the value it has at the refine level of its piece. */
data class AffixResponse(
    val type: String,
    val value: Int,
)

/**
 * A piece as the game shows it: every value already refined, plus what the next refine, a reroll and a sale cost in copper.
 * Absent fields are null: `clickDamage` outside a weapon, `heroId` in the bag, `refineCost` at +10, `rerollCost` below +5.
 */
data class PieceResponse(
    val id: String,
    val slot: String,
    val rarity: String,
    val refine: Int,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val clickDamage: Double?,
    val affixes: List<AffixResponse>,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val heroId: String?,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val refineCost: Long?,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val rerollCost: Long?,
    val sellPrice: Long,
) {
    companion object {
        fun from(
            piece: Piece,
            rules: EquipmentRules,
        ) = PieceResponse(
            id = piece.id,
            slot = piece.slot.name,
            rarity = piece.rarity.name,
            refine = piece.refine,
            clickDamage = piece.clickDamage(),
            affixes = piece.affixes.map { AffixResponse(it.type.name, piece.value(it)) },
            heroId = piece.heroId,
            refineCost = piece.refineCost(rules),
            rerollCost = piece.rerollCost(rules),
            sellPrice = piece.sellPrice(),
        )
    }
}

/** The piece a won boss dropped; [sold] is true when the bag was full and the piece went to the wallet as copper. */
data class EquipmentDropResponse(
    val piece: PieceResponse,
    val sold: Boolean,
) {
    companion object {
        fun from(
            drop: EquipmentDrop,
            rules: EquipmentRules,
        ) = EquipmentDropResponse(PieceResponse.from(drop.piece, rules), drop.sold)
    }
}
