package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import java.time.LocalDate

/** Today's date for the gift rules: the date in America/Sao_Paulo (spec black-awareness-staff D3). */
interface GiftCalendarPort {
    fun today(): LocalDate
}

/** The gifts each account received; the caller holds the player lock when it saves. */
interface GiftRepositoryPort {
    fun exists(
        username: String,
        giftId: String,
    ): Boolean

    /** Inserts [grant]; a second grant of the same gift for the same account fails. */
    fun save(grant: GiftGrant): GiftGrant
}
