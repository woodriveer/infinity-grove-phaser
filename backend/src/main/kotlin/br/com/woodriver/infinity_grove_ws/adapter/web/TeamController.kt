package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.InvalidTeamException
import br.com.woodriver.infinity_grove_ws.domain.InvalidTeamSlotRequestException
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.usecase.BuyTeamSlotUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SaveTeamUseCase
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class TeamSaveResponse(
    val leaderId: String,
    val team: TeamResponse,
)

data class TeamPurchaseResponse(
    val team: TeamResponse,
    val wallet: CoinsResponse,
)

@RestController
@RequestMapping("/team")
class TeamController(
    private val saveTeam: SaveTeamUseCase,
    private val buyTeamSlot: BuyTeamSlotUseCase,
) {
    @PutMapping
    fun save(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): TeamSaveResponse {
        val allies = body["allies"] as? List<*> ?: throw InvalidTeamException("allies must be a list of ${Team.MAX_ALLIES} entries")
        if (allies.size != Team.MAX_ALLIES || allies.any { it != null && it !is String }) {
            throw InvalidTeamException("allies must hold ${Team.MAX_ALLIES} hero ids or nulls")
        }
        val change = saveTeam.saveAllies(principal.name, allies.map { it as String? })
        return TeamSaveResponse(change.leaderId, TeamResponse.from(change.team))
    }

    @PostMapping("/slots")
    fun buySlot(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): TeamPurchaseResponse {
        val fromSlots = body["fromSlots"] as? Int ?: throw InvalidTeamSlotRequestException("fromSlots must be an integer")
        val purchase = buyTeamSlot.buySlot(principal.name, fromSlots)
        return TeamPurchaseResponse(TeamResponse.from(purchase.team), CoinsResponse.from(purchase.wallet.coins()))
    }
}
