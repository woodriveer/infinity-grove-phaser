package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.FarmBoss
import br.com.woodriver.infinity_grove_ws.domain.FarmResult
import br.com.woodriver.infinity_grove_ws.domain.FarmState
import br.com.woodriver.infinity_grove_ws.domain.Outcome

interface GetFarmUseCase {
    /** The farm of [chapter] (null: the current chapter; above the current one: the current one). */
    fun state(
        username: String,
        chapter: Int? = null,
    ): FarmState
}

interface ReportFarmUseCase {
    /**
     * Applies the [outcome] of a farm fight against [boss] of [chapter] (null: the current chapter). A win rolls the drop like the campaign
     * does and counts toward the daily chapter boss limit; the campaign position never changes.
     */
    fun report(
        username: String,
        boss: FarmBoss,
        outcome: Outcome,
        chapter: Int? = null,
    ): FarmResult
}
