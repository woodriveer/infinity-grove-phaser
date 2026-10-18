package br.com.woodriver.infinity_grove_ws.domain

/** The piece a won boss dropped. [sold] is true when the bag was full and the piece went to the wallet as copper instead. */
data class EquipmentDrop(
    val piece: Piece,
    val sold: Boolean,
)
