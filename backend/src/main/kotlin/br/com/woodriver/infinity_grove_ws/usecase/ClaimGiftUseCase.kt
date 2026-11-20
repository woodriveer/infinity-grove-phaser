package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.GiftClaim

/** Claims the event gift of the day for [username]: the new piece, or nothing (spec black-awareness-staff). */
interface ClaimGiftUseCase {
    fun claim(username: String): GiftClaim
}
