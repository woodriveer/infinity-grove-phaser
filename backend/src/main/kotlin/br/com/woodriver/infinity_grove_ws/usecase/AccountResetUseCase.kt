package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.ProgressView
import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy

/** What a reset paid and left: the reward, the crystals and the resets after it, the campaign back at its start and the legacy after it. */
data class ResetResult(
    val reward: Int,
    val crystals: Long,
    val resets: Int,
    val view: ProgressView,
    val legacy: ResetLegacy,
)

interface ResetAccountUseCase {
    /**
     * Gives up the campaign and the talents of the player for crystals, under their progress lock. [fromChapter] is the chapter the player
     * saw: a request made from another stored chapter changes nothing.
     */
    fun reset(
        username: String,
        fromChapter: Int,
    ): ResetResult
}
