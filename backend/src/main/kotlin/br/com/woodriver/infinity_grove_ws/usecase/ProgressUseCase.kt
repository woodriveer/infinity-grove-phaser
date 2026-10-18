package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ProgressView

interface GetProgressUseCase {
    /** Returns the player's progress with its chapter definition, creating the progress on first use. */
    fun get(username: String): ProgressView
}

/** The progress after a report and the card the won boss dropped, if any. */
data class OutcomeResult(
    val view: ProgressView,
    val drop: CardDrop?,
)

interface ReportOutcomeUseCase {
    /**
     * Applies [outcome] reported from [position]; a position that is not the stored one is a conflict.
     * A `CLEARED` miniboss or chapter boss may drop a hero card, rolled here in the same transaction.
     */
    fun report(
        username: String,
        position: ProgressPosition,
        outcome: Outcome,
    ): OutcomeResult
}
