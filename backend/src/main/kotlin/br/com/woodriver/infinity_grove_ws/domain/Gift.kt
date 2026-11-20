package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate

/** The event gifts (spec black-awareness-staff). One gift exists: the Cajado da Consciência Negra, given on November 20 of any year. */
object GiftDay {
    /** The id of the staff gift in `player_gifts.gift_id`; equal to the name of [PieceSpecial.BLACK_AWARENESS_STAFF]. */
    const val STAFF_GIFT_ID = "BLACK_AWARENESS_STAFF"
    const val MONTH = 11
    const val DAY = 20

    /** True on November 20 of any year; [date] is the date in America/Sao_Paulo (see `GiftCalendarPort`). */
    fun isGiftDay(date: LocalDate): Boolean = date.monthValue == MONTH && date.dayOfMonth == DAY
}

/** The record that [username] received [giftId] as the piece [pieceId] at [grantedAt] (epoch milliseconds). */
data class GiftGrant(
    val username: String,
    val giftId: String,
    val pieceId: String,
    val grantedAt: Long,
)

/** What a claim gave: the new piece, or null when nothing was given. */
data class GiftClaim(
    val piece: Piece?,
) {
    val granted: Boolean get() = piece != null
}
