package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.PlayerTalents
import br.com.woodriver.infinity_grove_ws.domain.TalentCatalog
import br.com.woodriver.infinity_grove_ws.domain.TalentRequestException
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.usecase.ListTalentsUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpgradeTalentUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/**
 * A talent as the game shows it: what one level gives, the level the player has, the value it adds now and the talent points of the next
 * level (null at the top level).
 */
data class TalentResponse(
    val id: String,
    val branch: String,
    val label: String,
    val unit: String,
    val perLevel: Int,
    val maxLevel: Int,
    val level: Int,
    val value: Int,
    val nextCost: Int?,
)

/** The talent points of the player: what the first clears paid, what the levels took and what is left. */
data class TalentPointsResponse(
    val earned: Int,
    val spent: Int,
    val available: Int,
)

/** The tree and the points; the upgrade answers the same shape. */
data class TalentsResponse(
    val talents: List<TalentResponse>,
    val points: TalentPointsResponse,
) {
    companion object {
        fun from(
            talents: PlayerTalents,
            rules: TalentRules,
        ): TalentsResponse {
            val points = talents.points(rules)
            return TalentsResponse(
                TalentCatalog.all.map {
                    TalentResponse(
                        id = it.id,
                        branch = it.branch.name,
                        label = it.label,
                        unit = it.unit,
                        perLevel = it.perLevel,
                        maxLevel = it.maxLevel,
                        level = talents.level(it.id),
                        value = it.valueAt(talents.level(it.id)),
                        nextCost = talents.nextCost(it, rules),
                    )
                },
                TalentPointsResponse(points.earned, points.spent, points.available),
            )
        }
    }
}

@RestController
@RequestMapping("/talents")
class TalentController(
    private val listTalents: ListTalentsUseCase,
    private val upgradeTalent: UpgradeTalentUseCase,
    private val rules: TalentRules,
) {
    @GetMapping
    fun get(principal: Principal) = TalentsResponse.from(listTalents.list(principal.name), rules)

    @PostMapping("/{id}/upgrade")
    fun upgrade(
        principal: Principal,
        @PathVariable id: String,
        @RequestBody body: Map<String, Any?>,
    ): TalentsResponse {
        val fromLevel = body["fromLevel"] as? Int ?: throw TalentRequestException("fromLevel must be an integer")
        return TalentsResponse.from(upgradeTalent.upgrade(principal.name, id, fromLevel), rules)
    }
}
