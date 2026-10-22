package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.EquipmentDrop
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ProgressView

interface GetProgressUseCase {
    /** Returns the player's progress with its chapter definition, creating the progress on first use. */
    fun get(username: String): ProgressView
}

/** The progress after a report, the card and the piece of equipment the won boss dropped, if any, and the talent points the clear paid. */
data class OutcomeResult(
    val view: ProgressView,
    val drop: CardDrop?,
    val equipmentDrop: EquipmentDrop? = null,
    val talentPoints: Int = 0,
)

interface ReportOutcomeUseCase {
    /**
     * Applies [outcome] reported from [position]; a position that is not the stored one is a conflict.
     * A `CLEARED` miniboss or chapter boss may drop a hero card and a piece of equipment, rolled here in the same transaction.
     * The first `CLEARED` report from a position also pays talent points (phase, miniboss, chapter boss); a repeat pays none.
     */
    fun report(
        username: String,
        position: ProgressPosition,
        outcome: Outcome,
    ): OutcomeResult
}
