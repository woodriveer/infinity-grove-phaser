package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.AccountReset
import br.com.woodriver.infinity_grove_ws.domain.LegacyChapter
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy

/** What a reset counted now would leave: the chapter it counts, that chapter's percent after it and the best legacy after it. */
data class AfterReset(
    val chapter: Int,
    val percent: Int,
    val best: LegacyChapter?,
)

/** The legacy of a player and the preview of their next reset; [afterReset] is null while the reset is closed. */
data class LegacyView(
    val legacy: ResetLegacy,
    val afterReset: AfterReset?,
) {
    companion object {
        /** The view of [legacy] for a player whose campaign is at [progress]. */
        fun of(
            legacy: ResetLegacy,
            progress: Progress,
        ): LegacyView {
            val afterReset =
                AccountReset.reward(progress)?.let { reward ->
                    val next = legacy.afterReset(reward)
                    AfterReset(reward, next.percents.getValue(reward), next.best())
                }
            return LegacyView(legacy, afterReset)
        }
    }
}

interface GetLegacyUseCase {
    /** Returns the legacy of the player and what their next reset would leave. */
    fun legacy(username: String): LegacyView
}
