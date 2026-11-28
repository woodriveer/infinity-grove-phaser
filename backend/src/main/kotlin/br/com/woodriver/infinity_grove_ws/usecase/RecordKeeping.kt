package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition

/** The events the rankings listen to (spec rankings, Record Rules). Each runs inside the caller's transaction, after the caller saved its state. */
interface RecordKeeping {
    /** `GET /progress` answered [progress]. */
    fun onProgressLoaded(
        username: String,
        progress: Progress,
    )

    /** `POST /progress/outcome` accepted [outcome] reported from [reported] and moved the campaign to [next]. */
    fun onOutcome(
        username: String,
        reported: ProgressPosition,
        outcome: Outcome,
        next: Progress,
    )

    /** `POST /farm/outcome` accepted a CLEARED while the campaign stands at [campaign]. */
    fun onFarmWin(
        username: String,
        campaign: Progress,
    )

    /** `POST /account/reset` succeeded. */
    fun onReset(username: String)
}
