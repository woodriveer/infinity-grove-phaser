package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.FarmBoss
import br.com.woodriver.infinity_grove_ws.domain.FarmResult
import br.com.woodriver.infinity_grove_ws.domain.FarmState
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.usecase.GetFarmUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ReportFarmUseCase
import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class FarmBossResponse(
    val kind: String,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val stage: Int?,
) {
    companion object {
        fun from(boss: FarmBoss) = FarmBossResponse(boss.kind.name, boss.stage)
    }
}

data class FarmStateResponse(
    val bosses: List<FarmBossResponse>,
    val chapterBossWinsLeft: Int,
) {
    companion object {
        fun from(state: FarmState) = FarmStateResponse(state.bosses.map(FarmBossResponse::from), state.chapterBossWinsLeft)
    }
}

data class FarmResultResponse(
    val drop: DropResponse?,
    val chapterBossWinsLeft: Int,
    val equipmentDrop: EquipmentDropResponse?,
) {
    companion object {
        fun from(
            result: FarmResult,
            rules: EquipmentRules,
        ) = FarmResultResponse(
            result.drop?.let(DropResponse::from),
            result.chapterBossWinsLeft,
            result.equipmentDrop?.let { EquipmentDropResponse.from(it, rules) },
        )
    }
}

@RestController
@RequestMapping("/farm")
class FarmController(
    private val getFarm: GetFarmUseCase,
    private val reportFarm: ReportFarmUseCase,
    private val equipmentRules: EquipmentRules,
) {
    @GetMapping
    fun get(principal: Principal) = FarmStateResponse.from(getFarm.state(principal.name))

    @PostMapping("/outcome")
    fun outcome(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): FarmResultResponse {
        val boss = parseBoss(body["boss"])
        val outcome = parseOutcome(body["outcome"])
        return FarmResultResponse.from(reportFarm.report(principal.name, boss, outcome), equipmentRules)
    }

    private fun parseBoss(value: Any?): FarmBoss {
        val fields = value as? Map<*, *> ?: throw IllegalArgumentException("boss is required")
        val kind = Encounter.entries.firstOrNull { it.name == fields["kind"] } ?: throw IllegalArgumentException("boss kind is unknown")
        val stage = fields["stage"]
        require(stage == null || stage is Int) { "boss stage must be an integer" }
        return FarmBoss(kind, stage)
    }

    private fun parseOutcome(value: Any?): Outcome =
        Outcome.entries.firstOrNull { it.name == value } ?: throw IllegalArgumentException("outcome must be CLEARED or FAILED")
}
