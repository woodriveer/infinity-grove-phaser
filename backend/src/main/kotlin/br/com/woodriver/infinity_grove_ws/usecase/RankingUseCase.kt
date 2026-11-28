package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.ClickPowerResult
import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingPage

interface GetRankingUseCase {
    /** The top 10 of [board] and the caller's row; [chapter] is checked by `RecordRules.chapterOf`. */
    fun board(
        username: String,
        board: RankingBoard,
        chapter: Int?,
    ): RankingPage
}

interface RefreshClickPowerUseCase {
    /** Computes and keeps the caller's click power now. */
    fun refreshClickPower(username: String): ClickPowerResult
}
