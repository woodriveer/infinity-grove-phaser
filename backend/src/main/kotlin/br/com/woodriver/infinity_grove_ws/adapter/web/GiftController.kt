package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.GiftDay
import br.com.woodriver.infinity_grove_ws.usecase.ClaimGiftUseCase
import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/** The answer of a gift claim: `gift` and `piece` only when [granted]. */
data class GiftClaimResponse(
    val granted: Boolean,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val gift: String?,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val piece: PieceResponse?,
)

@RestController
@RequestMapping("/gifts")
class GiftController(
    private val claimGift: ClaimGiftUseCase,
    private val rules: EquipmentRules,
) {
    /** Claims the gift of the day (spec black-awareness-staff); always 200, `granted: false` when nothing was given. */
    @PostMapping("/claim")
    fun claim(principal: Principal): GiftClaimResponse {
        val piece = claimGift.claim(principal.name).piece ?: return GiftClaimResponse(false, null, null)
        return GiftClaimResponse(true, GiftDay.STAFF_GIFT_ID, PieceResponse.from(piece, rules))
    }
}
