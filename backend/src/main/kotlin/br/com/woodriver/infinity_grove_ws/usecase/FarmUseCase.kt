package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.FarmBoss
import br.com.woodriver.infinity_grove_ws.domain.FarmResult
import br.com.woodriver.infinity_grove_ws.domain.FarmState
import br.com.woodriver.infinity_grove_ws.domain.Outcome

interface GetFarmUseCase {
    /** Returns the bosses the player has beaten and may fight again, and the chapter boss wins left today. */
    fun state(username: String): FarmState
}

interface ReportFarmUseCase {
    /**
     * Applies the [outcome] of a farm fight against [boss]. A win rolls the drop like the campaign does and counts toward the daily
     * chapter boss limit; the campaign position never changes.
     */
    fun report(
        username: String,
        boss: FarmBoss,
        outcome: Outcome,
    ): FarmResult
}
