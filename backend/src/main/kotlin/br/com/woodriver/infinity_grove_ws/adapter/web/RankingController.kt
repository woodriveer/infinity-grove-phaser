package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.ClickPowerResult
import br.com.woodriver.infinity_grove_ws.domain.InvalidRankingRequestException
import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingPage
import br.com.woodriver.infinity_grove_ws.domain.RecordRules
import br.com.woodriver.infinity_grove_ws.usecase.GetRankingUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefreshClickPowerUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class RankingEntryResponse(
    val position: Int,
    val username: String,
    val value: Number,
)

data class RankingMeResponse(
    val position: Int,
    val username: String,
    val value: Number,
)

data class RankingPageResponse(
    val board: String,
    val chapter: Int?,
    val entries: List<RankingEntryResponse>,
    val me: RankingMeResponse?,
) {
    companion object {
        /** `value` is a Long for every board but CLICK_POWER (spec Boards API AC 6). */
        fun from(page: RankingPage): RankingPageResponse {
            fun number(value: Double): Number = if (page.board == RankingBoard.CLICK_POWER) value else value.toLong()
            return RankingPageResponse(
                board = page.board.id,
                chapter = page.chapter,
                entries = page.entries.map { RankingEntryResponse(it.position, it.username, number(it.value)) },
                me = page.me?.let { RankingMeResponse(it.position, it.username, number(it.value)) },
            )
        }
    }
}

data class ClickPowerResponse(
    val value: Double?,
    val best: Double?,
) {
    companion object {
        fun from(result: ClickPowerResult) = ClickPowerResponse(result.value, result.best)
    }
}

@RestController
@RequestMapping("/rankings")
class RankingController(
    private val getRanking: GetRankingUseCase,
    private val refreshClickPower: RefreshClickPowerUseCase,
) {
    @GetMapping("/{board}")
    fun board(
        principal: Principal,
        @PathVariable board: String,
        @RequestParam(name = "chapter", required = false) chapter: String?,
    ): RankingPageResponse {
        val parsed = RankingBoard.fromId(board)
        val number = chapter?.let { it.toIntOrNull() ?: throw InvalidRankingRequestException(RecordRules.CHAPTER_MESSAGE) }
        return RankingPageResponse.from(getRanking.board(principal.name, parsed, number))
    }

    @PostMapping("/click-power")
    fun clickPower(principal: Principal): ClickPowerResponse = ClickPowerResponse.from(refreshClickPower.refreshClickPower(principal.name))
}
