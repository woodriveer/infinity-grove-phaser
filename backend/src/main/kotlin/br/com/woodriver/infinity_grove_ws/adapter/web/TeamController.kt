package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.InvalidTeamException
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.usecase.SaveTeamUseCase
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class TeamSaveResponse(
    val leaderId: String,
    val team: TeamResponse,
)

@RestController
@RequestMapping("/team")
class TeamController(
    private val saveTeam: SaveTeamUseCase,
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
}
